#!/usr/bin/env node
/*
 * test-rls-assignments.mjs — the Row Level Security proof for the reading-assignments tables (migration 0008),
 * run on a throwaway Postgres cluster that holds no real data. Never touches the live project.
 *
 * What it does: makes a temp directory, initdb's a cluster there (Postgres 16 in the Claude container, 17 in
 * production — RLS, grants and plpgsql behave the same), starts it on a unix socket with no TCP listener,
 * loads db/tests/supabase-shim.sql (the roles, `auth.uid()` & co., `storage.*`), replays EVERY migration in
 * db/migrations/ in order and unchanged, runs db/tests/rls-assignments.sql (each case as one identity, the
 * outcome compared with what the policy promises), prints the table, then stops and deletes the cluster.
 *
 * Run from the repo root:  node scripts/test-rls-assignments.mjs [--keep] [--verbose]
 *   --keep      leave the cluster running (prints the psql command to open it)
 *   --verbose   print every case, not only the failures
 * Needs the Postgres server binaries (apt: postgresql-16). As root it runs the server as the `postgres` OS
 * user through `runuser` (Postgres refuses to run as root); as any other user it runs it as itself.
 * Exit code 0 when every case passes.
 */
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const KEEP = process.argv.includes('--keep');
const VERBOSE = process.argv.includes('--verbose');

function findBin(name) {
  const dirs = ['/usr/lib/postgresql'];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const vers = fs.readdirSync(d).sort((a, b) => Number(b) - Number(a));
    for (const v of vers) { const p = path.join(d, v, 'bin', name); if (fs.existsSync(p)) return p; }
  }
  const w = spawnSync('which', [name], { encoding: 'utf8' });
  return w.status === 0 ? w.stdout.trim() : null;
}
const INITDB = findBin('initdb'), PG_CTL = findBin('pg_ctl'), PSQL = findBin('psql');
if (!INITDB || !PG_CTL || !PSQL) { console.error('Postgres binaries not found (initdb, pg_ctl, psql). Install postgresql-16.'); process.exit(2); }

const asRoot = typeof process.getuid === 'function' && process.getuid() === 0;
const wrap = (cmd, args) => asRoot ? ['runuser', ['-u', 'postgres', '--', cmd, ...args]] : [cmd, args];
function run(cmd, args, opts = {}) {
  const [c, a] = wrap(cmd, args);
  const r = spawnSync(c, a, { encoding: 'utf8', ...opts });
  if (r.status !== 0 && !opts.allowFail) { console.error(`${cmd} failed:\n${r.stdout}\n${r.stderr}`); throw new Error(cmd + ' failed'); }
  return r;
}

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ivrit-rls-'));
fs.chmodSync(DIR, 0o777);
const DATA = path.join(DIR, 'data');
const PORT = 54300 + Math.floor(Math.random() * 200);
const DBNAME = 'ivrit_rls';
let started = false;

function stop() {
  if (started && !KEEP) run(PG_CTL, ['-D', DATA, '-m', 'fast', 'stop'], { allowFail: true });
  if (!KEEP) fs.rmSync(DIR, { recursive: true, force: true });
}
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });

run(INITDB, ['-D', DATA, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--no-locale']);
run(PG_CTL, ['-D', DATA, '-o', `-p ${PORT} -k ${DIR} -c listen_addresses=''`, '-l', path.join(DIR, 'log'), '-w', 'start']);
started = true;

// psql runs as the current OS user over the socket (trust auth), as the `postgres` database role.
function psql(args, { file, sql, db = DBNAME, stopOnError = true } = {}) {
  const a = ['-h', DIR, '-p', String(PORT), '-U', 'postgres', '-d', db, '-X', '-q', ...(stopOnError ? ['-v', 'ON_ERROR_STOP=1'] : []), ...args];
  if (file) a.push('-f', file);
  if (sql) a.push('-c', sql);
  return spawnSync(PSQL, a, { encoding: 'utf8', cwd: ROOT });
}
function must(r, what) { if (r.status !== 0) { console.error(`FAILED: ${what}\n${r.stdout}\n${r.stderr}`); process.exit(1); } return r; }

must(psql([], { db: 'postgres', sql: `create database ${DBNAME}` }), 'create database');
must(psql([], { file: 'db/tests/supabase-shim.sql' }), 'load the shim');
const migrations = fs.readdirSync(path.join(ROOT, 'db/migrations')).filter(f => /^\d{4}_.*\.sql$/.test(f)).sort();
for (const m of migrations) {
  const r = must(psql([], { file: 'db/migrations/' + m }), 'apply ' + m);
  console.log('applied ' + m + (r.stderr.trim() ? '\n' + r.stderr.trim() : ''));
}
const t = psql(['-A', '-F', '\t'], { file: 'db/tests/rls-assignments.sql' });
if (t.status !== 0) { console.error('the test file stopped on an error:\n' + t.stdout.slice(-2000) + '\n' + t.stderr); process.exit(1); }

// The file prints two tables last: every case, then the counts.
const lines = t.stdout.split('\n').filter(l => l.trim());
const rows = lines.filter(l => /^\d+\t(PASS|FAIL)\t/.test(l)).map(l => l.split('\t'));
const counts = lines.find(l => /^\d+\t\d+$/.test(l));
let failed = 0;
for (const [n, res, label, got, want] of rows) {
  if (res === 'FAIL') failed++;
  if (VERBOSE || res === 'FAIL') console.log(`${res} #${n} ${label}${res === 'FAIL' ? `\n     got:  ${got}\n     want: ${want}` : ''}`);
}
const [passed, failedCount] = counts ? counts.split('\t') : [rows.length - failed, failed];
console.log(`\n${passed} passed, ${failedCount} failed (${migrations.length} migrations replayed on Postgres ${run(PG_CTL, ['--version'], { allowFail: true }).stdout.trim().replace(/^pg_ctl \(PostgreSQL\) /, '') || '?'})`);
if (KEEP) console.log(`cluster kept: ${PSQL} -h ${DIR} -p ${PORT} -U postgres -d ${DBNAME}`);
process.exit(failed || !counts ? 1 : 0);
