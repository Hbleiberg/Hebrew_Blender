#!/usr/bin/env node
/**
 * update-sitemap.mjs — refresh every <lastmod> in sitemap.xml to the date of
 * each page's most recent git commit (YYYY-MM-DD, committer date).
 *
 * Plain Node, zero dependencies. Run from anywhere:
 *   node scripts/update-sitemap.mjs
 *
 * Behaviour:
 *   - Maps each <loc> to a file: "https://ivritsuite.com/" -> index.html,
 *     "https://ivritsuite.com/foo.html" -> foo.html.
 *   - Reads that file's last commit date via `git log -1 --format=%cs`.
 *   - Rewrites ONLY that <url> block's <lastmod> — changefreq, priority and all
 *     whitespace/formatting are left untouched.
 *   - Files with no git history are skipped (their existing <lastmod> stays).
 *   - Idempotent: a second run with no new commits produces no diff.
 *
 * Standing end-of-session step (see CLAUDE.md, alongside the sw.js VERSION bump):
 * run this after your final content commit so the dates reflect that commit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = join(repoRoot, 'sitemap.xml');

/** "https://ivritsuite.com/" -> "index.html"; ".../foo.html" -> "foo.html" */
function locToFile(loc) {
  const path = new URL(loc).pathname.replace(/^\//, '');
  return path === '' ? 'index.html' : path;
}

/** Last committer date for a repo file, as YYYY-MM-DD, or null if untracked. */
function gitLastDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

const original = readFileSync(sitemapPath, 'utf8');
const report = [];
const skipped = [];

const updated = original.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  if (!loc) return block;
  const file = locToFile(loc);
  const date = gitLastDate(file);
  if (!date) {
    skipped.push(file);
    return block;
  }
  report.push(`  ${date}  ${file}`);
  return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`);
});

if (updated !== original) {
  writeFileSync(sitemapPath, updated);
  console.log('sitemap.xml updated.');
} else {
  console.log('sitemap.xml already current — no changes.');
}
if (report.length) console.log('Per-file lastmod:\n' + report.join('\n'));
if (skipped.length) console.log('Skipped (no git history): ' + skipped.join(', '));
