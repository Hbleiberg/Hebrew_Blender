#!/usr/bin/env python3
"""Automated intake of NEW partner fonts found by scripts/audit-os-fonts.mjs.

    node scripts/audit-os-fonts.mjs --emit-new new.json
    python3 scripts/stage_os_fonts.py new.json [--dry-run] [--only <slug>] [--report out.md]

For every font in `new.json` (the partner-list entries the audit could not match to a staged
font) this script does what a person does in /addOSFont, with the same tool and the same gate:

  0. (metadata) --name is the partner's catalogue name minus a trailing parenthetical, --id the
     partner's slug when it is a valid manifest id, --designer the catalogue's typographer (a cited
     source, as the manual intakes chose) with the name-table designer noted in the report.
  1. downloads the partner's archive — `fonts/<family>/<family>.zip` in the aharonium/opensiddur.org
     repository first (no Cloudflare in front of raw.githubusercontent.com), the site's
     `wp-content/uploads/fonts/<family>/<family>.zip` second — and records which one it took;
  2. picks ONE face: the only .ttf/.otf, or the Regular/Book/Medium/Light face of a family
     (bold/italic/oblique/condensed faces lose; .ttf beats .otf on a tie);
  3. picks the shipped license TEXT: a plain-text member named LICENSE/LICENCE/OFL/COPYING, then
     README (GNU FreeFont's README carries the exception), then GNU-GPL. HTML-only licenses
     (README.htm, License.html) are NOT transcribed by a machine — the font is left for a person;
  4. runs `scripts/add_os_font.py --dry-run` on that pair — its license gate and Culmus
     per-section exception scoping decide, exactly as for a manual intake;
  5. stages only when the detected license FAMILY agrees with the partner's own label (a
     "GPL 3.0" label against shipped GPL+FE text is the known coarse-label case: staged, and the
     discrepancy is appended to not-staged.json so the weekly audit shows it as recorded).
     Anything else — no license text, a refused or ambiguous classification, an OFL label
     against CC BY-SA text, an HTML-only license, an empty or collection-only archive — is
     reported with the exact reason and the /addOSFont command a person would run.

Nothing here invents metadata: every value is the partner's catalogue or the font file and its
shipped license text, via add_os_font.py.

Exit code: 0 (the report says what happened), 1 on a usage error. Requires fontTools
(`pip install fonttools`), same as add_os_font.py.
"""
import argparse, io, json, os, re, shutil, subprocess, sys, tempfile, urllib.request, zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FONTS_DIR = REPO / 'starting-fonts'
MANIFEST = FONTS_DIR / 'manifest.json'
NOT_STAGED = FONTS_DIR / 'not-staged.json'
INTAKE = REPO / 'scripts' / 'add_os_font.py'

ARCHIVE_SOURCES = (
    ('https://raw.githubusercontent.com/aharonium/opensiddur.org/master/fonts/{f}/{f}.zip',
     'https://github.com/aharonium/opensiddur.org/blob/master/fonts/{f}/{f}.zip'),
    ('https://opensiddur.org/wp-content/uploads/fonts/{f}/{f}.zip',
     'https://opensiddur.org/wp-content/uploads/fonts/{f}/{f}.zip'),
)
UA = 'Mozilla/5.0 (compatible; IvritSuite-fonts-intake/1.0; +https://ivritsuite.com)'
ID_RE = re.compile(r'^[a-z0-9-]{1,48}$')          # the Font Maker's picker filters manifest ids to this shape

FACE_BONUS = (('regular', 40), ('book', 35), ('medium', 30), ('roman', 25), ('light', 20), ('normal', 20))
FACE_MALUS = (('bold', 40), ('black', 40), ('heavy', 40), ('semibold', 35), ('demi', 35), ('italic', 30),
              ('oblique', 30), ('condensed', 20), ('narrow', 20), ('thin', 15), ('extra', 10), ('ultra', 10),
              ('title', 10), ('heading', 10))
LICENSE_PRIORITY = (
    (r'^licen[cs]e', 0), (r'^ofl', 1), (r'licen[cs]e', 2), (r'^copying(?!.*gpl)', 3), (r'^copying', 4),
    (r'^readme', 5), (r'^gnu-?gpl|^gpl', 6),
)


def lic_families(label):
    """Port of the audit's licFamilies(): a partner label -> [(family, fontExceptionOrNone)]."""
    out = []
    for s in re.split(r',|&|\bor\b|/', str(label or '')):
        s = s.strip().lower()
        if not s:
            continue
        if re.search(r'ofl|open font', s): out.append(('OFL', None))
        elif 'apache' in s: out.append(('Apache', None))
        elif re.search(r'lppl|latex', s): out.append(('LPPL', None))
        elif re.search(r'ufl|ubuntu font', s): out.append(('UFL', None))
        elif re.search(r'cc0|public domain|cc-?zero', s): out.append(('CC0', None))
        elif re.search(r'cc[- ]?by', s): out.append(('CC-BY-SA' if re.search(r'\bsa\b|share', s) else 'CC-BY', None))
        elif re.search(r'gpl|general public', s): out.append(('GPL', bool(re.search(r'exception|\+ ?fe\b|font ex', s))))
        elif re.search(r'\bmit\b', s): out.append(('MIT', None))
        else: out.append((s, None))
    return out


def family_of_id(lic_id):
    if lic_id == 'GPL-with-font-exception': return ('GPL', True)
    if lic_id.startswith('GPL-'): return ('GPL', False)
    if lic_id.startswith('OFL'): return ('OFL', None)
    if lic_id.startswith('Apache'): return ('Apache', None)
    if lic_id.startswith('CC-BY-SA'): return ('CC-BY-SA', None)
    if lic_id.startswith('CC-BY'): return ('CC-BY', None)
    if lic_id.startswith('CC0'): return ('CC0', None)
    if lic_id.startswith('UFL'): return ('UFL', None)
    if lic_id.startswith('LPPL'): return ('LPPL', None)
    return (lic_id, None)


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def download_archive(family):
    errors = []
    for get_url, provenance in ARCHIVE_SOURCES:
        url = get_url.format(f=family)
        try:
            data = fetch(url)
            if data[:2] != b'PK':
                errors.append('%s: not a zip' % url); continue
            return data, provenance.format(f=family), errors
        except Exception as e:  # noqa: BLE001 — record and try the next source
            errors.append('%s: %s' % (url, str(e)[:80]))
    return None, None, errors


def score_face(path):
    stem = Path(path).stem.lower()
    s = 0
    for k, v in FACE_BONUS:
        if k in stem: s += v
    for k, v in FACE_MALUS:
        if k in stem: s -= v
    if path.lower().endswith('.ttf'): s += 1
    return s


def pick_face(members):
    fonts = [m for m in members if m.lower().endswith(('.ttf', '.otf')) and '__macosx' not in m.lower()]
    if not fonts:
        return None, fonts
    fonts.sort(key=lambda m: (-score_face(m), m.lower()))
    return fonts[0], fonts


def license_candidates(z, members):
    """Plain-text license candidates in priority order; HTML and binaries are never candidates."""
    cands = []
    for m in members:
        if '__macosx' in m.lower():
            continue
        base = Path(m).name
        ext = Path(m).suffix.lower()
        if ext not in ('', '.txt', '.md'):
            continue
        for pat, pri in LICENSE_PRIORITY:
            if re.search(pat, base, re.I):
                raw = z.read(m)
                if b'\0' in raw[:4096] or not raw.strip():
                    break
                cands.append((pri, len(m), m))
                break
    cands.sort()
    return [m for _, _, m in cands]


def html_license_present(members):
    return [m for m in members if re.search(r'licen[cs]e|readme', Path(m).name, re.I) and Path(m).suffix.lower() in ('.htm', '.html')]


def has_exception(path):
    try:
        return re.search(r'as a special exception', path.read_text(encoding='utf-8', errors='replace'), re.I) is not None
    except OSError:
        return False


def clean_name(name):
    return re.sub(r'\s*\([^)]*\)\s*$', '', name or '').strip()


def run_intake(args):
    p = subprocess.run([sys.executable, str(INTAKE)] + args, capture_output=True, text=True)
    return p.returncode, p.stdout, p.stderr


def parse_dry_entry(stdout):
    m = re.search(r'Manifest entry would be:\s*(\{.*\})\s*$', stdout, re.S)
    return json.loads(m.group(1)) if m else None


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('new_json', help='the --emit-new output of scripts/audit-os-fonts.mjs')
    ap.add_argument('--dry-run', action='store_true', help='decide and report, stage nothing, touch no file')
    ap.add_argument('--only', help='process just this partner slug')
    ap.add_argument('--report', help='write the markdown report here (also printed)')
    a = ap.parse_args()

    if not INTAKE.is_file():
        print('stage_os_fonts: %s is missing' % INTAKE, file=sys.stderr); return 1
    try:
        candidates = json.loads(Path(a.new_json).read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        print('stage_os_fonts: cannot read %s: %s' % (a.new_json, e), file=sys.stderr); return 1
    if a.only:
        candidates = [c for c in candidates if c.get('slug') == a.only]
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.is_file() else {'fonts': []}
    existing_ids = {f['id'] for f in manifest['fonts']}

    staged, skipped = [], []
    tmp_root = Path(tempfile.mkdtemp(prefix='os-fonts-'))
    try:
        for c in candidates:
            name, family, slug, label = c.get('name', ''), c.get('family', ''), c.get('slug', ''), c.get('license', '')
            tag = '%s (`%s`)' % (name or family or slug, slug)
            manual = '`/addOSFont` — archive `%s`' % (ARCHIVE_SOURCES[0][1].format(f=family) if family else '?')

            def skip(reason, todo=manual, extra=''):
                skipped.append({'name': name, 'slug': slug, 'family': family, 'label': label, 'reason': reason, 'todo': todo, 'extra': extra})

            if not family:
                skip('the partner entry has no `family`, so the archive name is unknown'); continue
            data, provenance, errors = download_archive(family)
            if data is None:
                skip('archive not found at either source', extra='; '.join(errors)); continue
            try:
                z = zipfile.ZipFile(io.BytesIO(data))
                members = [m for m in z.namelist() if not m.endswith('/')]
            except zipfile.BadZipFile:
                skip('archive is not a readable zip'); continue
            face, faces = pick_face(members)
            if not face:
                skip('archive contains no .ttf/.otf (only web fonts or a collection)', extra=', '.join(Path(m).name for m in members[:8])); continue
            texts = license_candidates(z, members)
            html = html_license_present(members)
            if not texts:
                if html:
                    skip('the only license text is HTML (%s) — a person transcribes it to .txt first' % ', '.join(Path(m).name for m in html),
                         todo='%s — extract the license block from the HTML verbatim, then `--license-file` it' % manual); continue
                skip('archive ships no license text file', todo='%s with `--license-source partner-declared` if you accept the listed "%s"' % (manual, label)); continue

            work = tmp_root / slug
            work.mkdir(parents=True, exist_ok=True)
            z.extractall(work)
            font_path = work / face
            common = ['--upstream', provenance]
            if slug and ID_RE.match(slug) and slug not in existing_ids:
                common += ['--id', slug]
            if clean_name(name):
                common += ['--name', clean_name(name)]

            entry, chosen_lic, last_err = None, None, ''
            for t in texts:
                code, out, err = run_intake([str(font_path), '--license-file', str(work / t), '--dry-run'] + common)
                if code == 0:
                    entry, chosen_lic = parse_dry_entry(out), t
                    if entry: break
                last_err = (err.strip() or out.strip()).splitlines()[-1] if (err.strip() or out.strip()) else 'exit %d' % code
            if not entry:
                skip('the license gate did not accept any shipped text (%s)' % ', '.join(Path(t).name for t in texts), extra=last_err); continue
            # GNU FreeFont: COPYING is the bare GPL body and README carries the exception clause. When the
            # verdict is GPL+FE but the chosen text does not itself state the exception, prefer a text
            # that does — the staged LICENSE.txt is what every derivative's export will carry.
            if entry['licenseId'] == 'GPL-with-font-exception' and not has_exception(work / chosen_lic):
                for t in texts:
                    if t != chosen_lic and has_exception(work / t):
                        code, out, _ = run_intake([str(font_path), '--license-file', str(work / t), '--dry-run'] + common)
                        alt = parse_dry_entry(out) if code == 0 else None
                        if alt and alt['licenseId'] == entry['licenseId']:
                            entry, chosen_lic = alt, t; break

            ours = family_of_id(entry['licenseId'])
            listed = lic_families(label)
            same = [l for l in listed if l[0] == ours[0]]
            if listed and not same:
                skip('partner lists "%s" but the shipped text is %s — a person decides which wins' % (label, entry['licenseId']),
                     todo='%s — read the shipped `%s`, stage under the text if it permits editing, and record the disagreement in `not-staged.json`' % (manual, Path(chosen_lic).name)); continue
            coarse = bool(same and ours[0] == 'GPL' and same[0][1] is not None and same[0][1] != ours[1])

            real = [str(font_path), '--license-file', str(work / chosen_lic)] + common
            typographer = (c.get('typographer') or '').strip()
            if typographer and typographer != entry.get('designer', ''):
                real += ['--designer', typographer]
            record = {'name': name, 'slug': entry['id'], 'family': family, 'label': label, 'licenseId': entry['licenseId'],
                      'licenseName': entry.get('licenseName', ''), 'face': Path(face).name, 'licenseFile': Path(chosen_lic).name,
                      'upstream': provenance, 'rfns': entry.get('reservedFontNames') or [], 'coarse': coarse,
                      'url': 'https://ivritsuite.com/Hebrew_Font_Maker.html?start=%s' % entry['id'],
                      'faces': len(faces), 'designer': typographer or entry.get('designer', ''),
                      'nameTableDesigner': entry.get('designer', '') if '--designer' in real else ''}
            if a.dry_run:
                record['dryRun'] = True; staged.append(record); continue
            code, out, err = run_intake(real)
            if code != 0:
                skip('staging failed after a clean dry run', extra=(err.strip() or out.strip())[-300:]); continue
            existing_ids.add(entry['id'])
            if coarse and NOT_STAGED.is_file():
                ns = json.loads(NOT_STAGED.read_text(encoding='utf-8'))
                ns.setdefault('discrepancies', []).append({
                    'name': name, 'id': entry['id'], 'pageLicense': label, 'staged': entry['licenseId'],
                    'note': 'The partner list labels this "%s", but the license text shipped in the archive (%s) states the font '
                            'exception verbatim, so it is staged as GPL+FE. Primary text wins; the label is coarser. '
                            'Recorded by the automated intake.' % (label, Path(chosen_lic).name)})
                NOT_STAGED.write_text(json.dumps(ns, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
                # LINKS.md renders not-staged.json, so regenerate it once more.
                run_intake(['--regen-links'])
            staged.append(record)
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)

    # ---------- report ----------
    L = ['## Automated intake', '']
    if a.dry_run:
        L += ['_Dry run: decisions only, nothing staged._', '']
    L += ['| | count |', '|---|---|', '| Candidates | %d |' % len(candidates),
          '| **Staged%s** | **%d** |' % (' (would stage)' if a.dry_run else '', len(staged)),
          '| Left for a person | %d |' % len(skipped), '']
    if staged:
        L += ['### Staged — every one passed the shipped-license gate', '']
        for s in staged:
            bits = ['**%s** (`%s`) — %s' % (s['name'], s['slug'], s['licenseName'] or s['licenseId'])]
            if s['rfns']: bits.append('reserved names honored: %s' % ', '.join(s['rfns']))
            bits.append('face `%s`%s' % (s['face'], ' (of %d)' % s['faces'] if s['faces'] > 1 else ''))
            bits.append('license from `%s`' % s['licenseFile'])
            if s['designer']: bits.append('designer %s%s' % (s['designer'], (' (name table says %s)' % s['nameTableDesigner']) if s['nameTableDesigner'] else ''))
            if s['coarse']: bits.append('partner label "%s" is coarser than the shipped text — recorded in `not-staged.json`' % s['label'])
            L.append('- ' + ' · '.join(bits))
            L.append('  - Live: <%s> · upstream <%s>' % (s['url'], s['upstream']))
        L.append('')
    if skipped:
        L += ['### Left for a person', '']
        for s in skipped:
            L.append('- **%s** (`%s`, listed "%s"): %s' % (s['name'], s['slug'], s['label'], s['reason']))
            L.append('  - To do: %s' % s['todo'])
            if s['extra']: L.append('  - Detail: %s' % s['extra'].replace('\n', ' '))
        L.append('')
    report = '\n'.join(L)
    print(report)
    if a.report:
        Path(a.report).write_text(report + '\n', encoding='utf-8')
    gh = os.environ.get('GITHUB_OUTPUT')
    if gh:
        with open(gh, 'a', encoding='utf-8') as f:
            f.write('staged=%d\nskipped=%d\nstaged_ids=%s\n' % (len(staged), len(skipped), ' '.join(s['slug'] for s in staged)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
