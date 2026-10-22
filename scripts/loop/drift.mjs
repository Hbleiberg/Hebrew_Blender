#!/usr/bin/env node
/* Outside-loop drift line — the improvement loop's session-start step 4 in one command.
 *
 * Prints one line naming everything that can move outside a loop session: the base branch's commit,
 * sw.js VERSION, FONT_MAKER_VERSION, the highest db/migrations file and its Live? cell in db/README.md,
 * a digest of db/functions/* (a source edit with no recorded deploy is drift), the SDK pin and a digest
 * of js/supabase-config.js, and a digest of the keep-alive workflow. A close-out pastes the line into
 * the ledger; the next session runs `--vs '<that line>'` and reads which fields moved.
 *
 * Read-only. Usage:
 *   node scripts/loop/drift.mjs
 *   node scripts/loop/drift.mjs --vs 'drift: main=… sw=v1072 …'
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = p => readFileSync(join(root, p), 'utf8');
const sha7 = s => createHash('sha256').update(s).digest('hex').slice(0, 7);
const git = (...a) => { try { return execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim(); } catch { return null; } };

function filesUnder(dir) {
  const out = [];
  const walk = d => { for (const n of readdirSync(join(root, d)).sort()) { const p = `${d}/${n}`; (statSync(join(root, p)).isDirectory() ? walk(p) : out.push(p)); } };
  if (existsSync(join(root, dir))) walk(dir);
  return out;
}

const fields = {};
fields.main = (git('rev-parse', '--short=7', 'origin/main') || git('rev-parse', '--short=7', 'HEAD') || '?') + (git('rev-parse', 'origin/main') ? '' : '(HEAD)');
fields.sw = (read('sw.js').match(/const VERSION = '([^']+)'/) || [])[1] || '?';
fields.fm = (read('Hebrew_Font_Maker.html').match(/const FONT_MAKER_VERSION = '([^']+)'/) || [])[1] || '?';
const migrations = filesUnder('db/migrations').filter(f => /\/\d{4}_[^/]+\.sql$/.test(f)).sort();
const top = migrations.length ? migrations[migrations.length - 1].split('/').pop() : '-';
fields.migration = top;
{ // the Live? cell of that migration's row in db/README.md: the cell after the one naming the file
  const row = read('db/README.md').split('\n').find(l => l.startsWith('|') && l.includes(top));
  const cells = row ? row.split('|').map(c => c.trim()) : [];
  const i = cells.findIndex(c => c.includes(top));
  fields.live = i !== -1 && cells[i + 1] ? cells[i + 1].replace(/\*/g, '').split(/[\s—–]/)[0] : '?';   // the cell's first word (yes/no); the rest is prose
}
fields.functions = sha7(filesUnder('db/functions').map(f => f + '\n' + read(f)).join('\n'));
const cfg = read('js/supabase-config.js');
fields.sdk = (cfg.match(/supabase-js@([\d.]+)/) || [])[1] || '?';
fields.config = sha7(cfg);
fields.keepalive = existsSync(join(root, '.github/workflows/supabase-keepalive.yml')) ? sha7(read('.github/workflows/supabase-keepalive.yml')) : '-';

const line = 'drift: ' + Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(' ');
console.log(line);

const vsIdx = process.argv.indexOf('--vs');
if (vsIdx !== -1) {
  const prev = Object.fromEntries((process.argv[vsIdx + 1] || '').replace(/^drift:\s*/, '').split(/\s+/).filter(Boolean).map(kv => kv.split('=')));
  const moved = Object.entries(fields).filter(([k, v]) => prev[k] !== undefined && prev[k] !== v).map(([k, v]) => `${k}: ${prev[k]} → ${v}`);
  const unknown = Object.keys(fields).filter(k => prev[k] === undefined);
  if (moved.length) console.log('moved since the last close-out (unaudited surface — discovery territory):\n  ' + moved.join('\n  '));
  else console.log('nothing moved since the last close-out.');
  if (unknown.length) console.log('fields the previous line did not carry: ' + unknown.join(', '));
}
