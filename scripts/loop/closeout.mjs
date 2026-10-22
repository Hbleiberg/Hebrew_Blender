#!/usr/bin/env node
/* Close-out runner — the improvement loop's mechanical definition-of-done in one command.
 *
 * Runs, in order: compact-ledger --apply, check-ledger --vs origin/main, check-i18n, check-inline-js,
 * update-llms-txt --check, update-sitemap --check (skipped with a note on a shallow clone),
 * coverage --check, every committed detector (scripts/loop/detect-*.mjs, which must pass their
 * --plant control before a clean run counts), then the static checks that exist. What is not
 * mechanical stays on CLAUDE.md's checklist: sw.js VERSION (until check-sw-version lands), the
 * FONT_MAKER_VERSION bump + changelog, legal text, the backend smokes.
 *
 * Usage:
 *   node scripts/loop/closeout.mjs            # the full close-out (writes the ledger via compaction)
 *   node scripts/loop/closeout.mjs --static   # no writes: compaction dry-run, every check (CI-safe)
 *   node scripts/loop/closeout.mjs --list     # print the plan and exit
 * Exit 1 if any required step fails.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const isStatic = process.argv.includes('--static');
const hasMain = spawnSync('git', ['rev-parse', '--verify', '-q', 'origin/main'], { cwd: root }).status === 0;
const node = process.execPath;

const steps = [
  { name: 'compact-ledger', cmd: [node, 'scripts/compact-ledger.mjs', ...(isStatic ? [] : ['--apply'])] },
  { name: 'check-ledger', cmd: [node, 'scripts/check-ledger.mjs', ...(hasMain ? ['--vs', 'origin/main'] : [])], note: hasMain ? '' : 'origin/main not fetched: conservation not checked' },
  { name: 'check-i18n', cmd: [node, 'scripts/check-i18n.js'] },
  { name: 'check-inline-js', cmd: [node, '--experimental-vm-modules', 'scripts/check-inline-js.mjs'] },
  { name: 'update-llms-txt --check', cmd: [node, 'scripts/update-llms-txt.mjs', '--check'] },
  { name: 'update-sitemap --check', cmd: [node, 'scripts/update-sitemap.mjs', '--check'], skipIf: /SHALLOW clone/ },
  { name: 'coverage --check', cmd: [node, 'scripts/loop/coverage.mjs', '--check'] },
];
const detectors = existsSync(join(root, 'scripts/loop')) ? readdirSync(join(root, 'scripts/loop')).filter(f => /^detect-.*\.mjs$/.test(f)).sort() : [];
for (const d of detectors) steps.push({ name: d + ' --plant', cmd: [node, `scripts/loop/${d}`, '--plant'] }, { name: d, cmd: [node, `scripts/loop/${d}`, '--json'] });
const statics = ['check-shared-blocks.mjs', 'check-sw-version.mjs', 'check-data-versions.mjs', 'check-csp.mjs', 'check-corpus.mjs'];
const missing = [];
for (const s of statics) (existsSync(join(root, 'scripts', s)) ? steps.push({ name: s.replace(/\.mjs$/, ''), cmd: [node, `scripts/${s}`] }) : missing.push(s));

if (process.argv.includes('--list')) {
  for (const s of steps) console.log(`  ${s.name}: ${s.cmd.slice(1).join(' ')}`);
  if (missing.length) console.log(`  not yet committed (run by hand per CLAUDE.md until they land): ${missing.join(', ')}`);
  process.exit(0);
}

let failed = 0;
const pad = s => s.padEnd(30);
for (const s of steps) {
  const r = spawnSync(s.cmd[0], s.cmd.slice(1), { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
  const out = (r.stdout || '') + (r.stderr || '');
  if (r.status === 0) { console.log(`✔ ${pad(s.name)} ${s.note || ''}`.trimEnd()); continue; }
  if (s.skipIf && s.skipIf.test(out)) { console.log(`– ${pad(s.name)} skipped: ${out.split('\n')[0].trim()}`); continue; }
  failed++;
  console.log(`✘ ${pad(s.name)} exit ${r.status}\n` + out.trim().split('\n').slice(0, 12).map(l => '    ' + l).join('\n'));
}
if (missing.length) console.log(`– ${pad('not yet committed')} ${missing.join(', ')} — those items stay on CLAUDE.md's checklist by hand.`);
console.log(failed ? `closeout: ${failed} step(s) failed.` : 'closeout: clean.');
process.exit(failed ? 1 : 0);
