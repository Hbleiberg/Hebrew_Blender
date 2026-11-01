#!/usr/bin/env node
// S592 — delete-account removes every student login a teacher created. The students step paged the list by offset
// while its own deletions shortened it (a deleted student's row cascades), so each page skipped the next hundred: a
// teacher with 150 logins kept 50 student auth users (and their profiles) after "Delete my account" replied ok.
// The function now reads from the start on every pass, and a row seen again after its deletion stops the call.
//
// The repo's own db/functions/delete-account/index.ts runs in Node: types stripped (Node 22's
// --experimental-strip-types, which this script re-execs with), Deno.serve / Deno.env shimmed, the npm: import
// swapped for the pinned SDK fixture, against a fake Auth + PostgREST + Storage holding N student rows (deleting an
// auth user removes its students row, as 0008's `on delete cascade` does; deleting the teacher removes theirs).
//
//   node scripts/loop/probes/S592-delete-account-removes-every-student.mjs --sdk path/to/supabase.js
//   exit 1 when, for N in 0, 99, 100, 101, 150, 200: a student auth user is left, the teacher is not deleted, the reply
//   is not 200 ok or its `deleted.students` is not N; or when 150 rows that never cascade do not end in a 500 with the
//   teacher kept (the loop's stop). Without --sdk it skips (exit 0, says so). SRC=<an index.ts> runs another copy (the
//   control: the source before S592 leaves 1 / 50 / 100 at N = 101 / 150 / 200); --json prints the record.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..', '..', '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const SDK = arg('--sdk');
if (!SDK || !fs.existsSync(SDK)) { console.log('SKIP: needs --sdk <the pinned supabase.js UMD build> (docs/reference/ops.md → Backend smokes)'); process.exit(0); }
// One child per case (a fresh module each time); the parent re-execs itself with type stripping on.
if (!process.env.__S592_CASE) {
  const SRC = process.env.SRC || path.join(ROOT, 'db/functions/delete-account/index.ts');
  const cases = [[0], [99], [100], [101], [150], [200], [150, 'nocascade']];
  const records = [];
  for (const [n, mode] of cases) {
    const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', new URL(import.meta.url).pathname, '--sdk', SDK],
      { env: Object.assign({}, process.env, { __S592_CASE: String(n), __S592_MODE: mode || '', SRC }), encoding: 'utf8' });
    const line = (r.stdout || '').trim().split('\n').pop();
    let rec; try { rec = JSON.parse(line); } catch (e) { rec = { n, mode, error: (r.stderr || r.stdout || '').slice(0, 300) }; }
    rec.ok = mode === 'nocascade'
      ? rec.status === 500 && rec.teacherGone === false
      : rec.status === 200 && rec.reply && rec.reply.ok === true && rec.reply.deleted && rec.reply.deleted.students === n && rec.studentsLeft === 0 && rec.teacherGone === true;
    records.push(rec);
  }
  const pass = records.every(r => r.ok);
  if (process.argv.includes('--json')) console.log(JSON.stringify({ pass, records }, null, 1));
  else {
    for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} N=${r.n}${r.mode ? ' (' + r.mode + ')' : ''} status ${r.status} students deleted ${r.reply && r.reply.deleted ? r.reply.deleted.students : '-'} left ${r.studentsLeft} teacher gone ${r.teacherGone}${r.error ? ' ' + r.error : ''}`);
    console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} — delete-account removes every student login, and stops rather than loops`);
  }
  process.exit(pass ? 0 : 1);
}
// ---- one case ----
const N = Number(process.env.__S592_CASE), NOCASCADE = process.env.__S592_MODE === 'nocascade';
vm.runInThisContext(fs.readFileSync(SDK, 'utf8') + ';globalThis.__sb = supabase;');
const T = '00000000-0000-4000-8000-000000000001';
const sid = (i) => '10000000-0000-4000-8000-' + String(i).padStart(12, '0');
const auth = new Set([T]);
let students = [];
for (let i = 1; i <= N; i++) { auth.add(sid(i)); students.push({ id: sid(i), teacher_id: T }); }
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  req.resume();
  req.on('end', () => {
    const json = (s, b, h) => { res.writeHead(s, Object.assign({ 'content-type': 'application/json' }, h || {})); res.end(JSON.stringify(b)); };
    if (u.pathname === '/auth/v1/user') return json(200, { id: T, aud: 'authenticated', app_metadata: { role: 'teacher' }, user_metadata: {} });
    const m = /^\/auth\/v1\/admin\/users\/(.+)$/.exec(u.pathname);
    if (m && req.method === 'DELETE') {
      const id = m[1]; auth.delete(id);
      students = students.filter(s => s.teacher_id !== id && (NOCASCADE || s.id !== id));
      return json(200, {});
    }
    if (u.pathname.startsWith('/storage/v1/object/list/')) return json(200, []);
    if (u.pathname === '/rest/v1/students') {
      const t = (u.searchParams.get('teacher_id') || '').replace(/^eq\./, '');
      const all = students.filter(s => s.teacher_id === t).sort((a, b) => (a.id < b.id ? -1 : 1));
      const off = Number(u.searchParams.get('offset') || 0), lim = Number(u.searchParams.get('limit') || 1000);
      return json(200, all.slice(off, off + lim).map(s => ({ id: s.id })));
    }
    if (u.pathname.startsWith('/rest/v1/')) return json(200, [], { 'content-range': '*/0' });
    json(404, { message: 'not found' });
  });
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const ENV = { SUPABASE_URL: 'http://127.0.0.1:' + srv.address().port, SUPABASE_SERVICE_ROLE_KEY: 'sk-probe' };
let handler = null;
globalThis.Deno = { env: { get: (k) => ENV[k] }, serve: (h) => { handler = h; } };
const IMPORT = /^import \{ createClient, type SupabaseClient \} from 'npm:@supabase\/supabase-js@2';$/m;
const src = fs.readFileSync(process.env.SRC, 'utf8');
if (!IMPORT.test(src)) { console.log(JSON.stringify({ n: N, error: 'the import line moved: update IMPORT' })); process.exit(2); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 's592-')), 'fn.ts');
fs.writeFileSync(tmp, src.replace(IMPORT, 'const { createClient } = (globalThis as any).__sb;'));
console.error = () => {};   // the function logs its own failure (the nocascade case)
await import(tmp);
if (typeof handler !== 'function') { console.log(JSON.stringify({ n: N, error: 'Deno.serve was never called' })); process.exit(2); }
const r = await handler(new Request('http://fn/', { method: 'POST', headers: { Authorization: 'Bearer probe', Origin: 'https://ivritsuite.com' } }));
const reply = await r.json();
console.log(JSON.stringify({ n: N, mode: NOCASCADE ? 'nocascade' : '', status: r.status, reply, studentsLeft: [...auth].filter(id => id !== T).length, teacherGone: !auth.has(T) }));
srv.close();
process.exit(0);
