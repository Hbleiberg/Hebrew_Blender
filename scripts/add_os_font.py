#!/usr/bin/env python3
"""IvritSuite "Starting Fonts" intake — stage a partner font for the ?start= deep link.

Validates a TTF/OTF against the partner license allowlist, extracts its real metadata
(name table + license text — detection, never invention), stages it under
starting-fonts/<id>/ with its upstream LICENSE.txt, and appends starting-fonts/manifest.json.
Prints the live URL + a paste-ready <a> snippet for the partner's page.

    python3 scripts/add_os_font.py <font.ttf|otf> --upstream <url> [--license-file <path>]
        [--id <slug>] [--name <displayName>] [--designer <name>] [--partner opensiddur]
        [--force] [--dry-run]

Requires Python 3 + fontTools (`pip install fonttools`). Run from anywhere; paths are
resolved against the repo root (this script's parent's parent).

The gate asks ONE question: does the license permit MODIFICATION? A partner font exists to be
edited in the Font Maker and re-exported, so every license that allows derivatives is allowlisted,
each carrying its own obligations (copyleft, rename, state-changes, attribution) into the export.
Refused: no license found, or a license that forbids derivatives (CC *-ND, all-rights-reserved).

NOTE the font exception is NOT about editing — it only stops a DOCUMENT that embeds the font from
inheriting the GPL. Bare GPL fonts are fully editable; the derivative is simply GPL too.

Exit codes: 0 ok · 2 missing fontTools · 3 license refused/ambiguous · 4 coverage refused ·
5 duplicate id (use --force) · 1 other error.
"""
import sys

try:
    from fontTools.ttLib import TTFont
except ImportError:
    print("fontTools is required: pip install fonttools", file=sys.stderr)
    sys.exit(2)

import argparse, datetime, hashlib, json, re, shutil
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FONTS_DIR = REPO / 'starting-fonts'
MANIFEST = FONTS_DIR / 'manifest.json'
LINKS_MD = FONTS_DIR / 'LINKS.md'
NOT_STAGED = FONTS_DIR / 'not-staged.json'   # requested fonts deliberately refused + license discrepancies

PARTNERS = {
    'opensiddur': {'partnerName': 'the Open Siddur Project', 'partnerUrl': 'https://opensiddur.org/help/fonts/'},
}

# id -> (display name, canonical URL, obligations the DERIVATIVE inherits)
#   copyleft   the derivative must carry this same license
#   changes    the modifier must state that they changed it, and when (GPL s2a)
#   source     the modifier must offer the corresponding source (GPL) — the UFO export is it
#   rename     the derivative MUST NOT keep the original family name (enforced like a Reserved Font Name)
#   attribution  credit the original author in the derivative
LICENSE_IDS = {
    'OFL-1.1':                 ('SIL Open Font License 1.1', 'https://openfontlicense.org', ('copyleft',)),
    'GPL-with-font-exception': ('GNU GPL v2 with font exception', 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html', ('copyleft', 'changes')),
    'GPL-2.0':                 ('GNU General Public License v2', 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html', ('copyleft', 'changes', 'source')),
    'GPL-3.0':                 ('GNU General Public License v3', 'https://www.gnu.org/licenses/gpl-3.0.html', ('copyleft', 'changes', 'source')),
    'Apache-2.0':              ('Apache License 2.0', 'https://www.apache.org/licenses/LICENSE-2.0', ('changes', 'attribution')),
    'CC0-1.0':                 ('CC0 1.0 (public domain)', 'https://creativecommons.org/publicdomain/zero/1.0/', ()),
    'UFL-1.0':                 ('Ubuntu Font Licence 1.0', 'https://ubuntu.com/legal/font-licence', ('copyleft', 'rename')),
    'LPPL-1.3c':               ('LaTeX Project Public License 1.3c', 'https://www.latex-project.org/lppl/lppl-1-3c/', ('copyleft', 'rename', 'changes')),
    'CC-BY-SA-4.0':            ('Creative Commons Attribution-ShareAlike 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', ('copyleft', 'attribution', 'changes')),
    'CC-BY-SA-3.0':            ('Creative Commons Attribution-ShareAlike 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', ('copyleft', 'attribution', 'changes')),
    'CC-BY-4.0':               ('Creative Commons Attribution 4.0', 'https://creativecommons.org/licenses/by/4.0/', ('attribution', 'changes')),
    'CC-BY-3.0':               ('Creative Commons Attribution 3.0', 'https://creativecommons.org/licenses/by/3.0/', ('attribution', 'changes')),
}

BASE_RANGE = range(0x05D0, 0x05EB)                       # alef..tav incl. finals = 27 cps
NIKKUD_CPS = list(range(0x05B0, 0x05BE)) + [0x05C1, 0x05C2, 0x05C7]
TROP_RANGE = range(0x0591, 0x05B0)


def read_names(font):
    name = font['name']
    get = lambda nid: (name.getDebugName(nid) or '').strip()
    return {'copyright': get(0), 'family': get(1), 'version': get(5),
            'designer': get(9), 'license': get(13), 'licenseUrl': get(14)}


SECTION_RE = re.compile(r'\n(?=[A-Z][^\n]{0,70}?(?:font|fonts|family)[^\n]{0,45}?(?:is|are)\s+[Cc]opyright)')
EXCEPTION_RE = re.compile(r'[Aa]s a special exception')


def _norm(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())


def exception_scoped_to(name, text):
    """Is the GPL font-exception clause actually attached to THIS font?

    Culmus ships ONE license covering 13 families in which the clause sits in Yoram Gnat's
    sections only. A whole-file search wrongly clears all 13 — it did once, and 21 bare-GPL fonts
    were staged as GPL+FE. In a combined file the clause counts only inside this font's own
    copyright section. Returns (bool, evidence).
    """
    if not EXCEPTION_RE.search(text):
        return False, 'no font-exception clause'
    sections = SECTION_RE.split(text)[1:]
    if len(sections) <= 1:
        return True, 'font-exception clause (single-scope license)'
    target = _norm(name)
    # Each section opens "<Family> font family is copyright ..." — match on that family, and let the
    # LONGEST match win so "Miriam Mono" beats "Miriam". Substring either way, because the staged
    # display name and the license's own wording differ at both ends ("Sofer Stam Ashkenaz" vs
    # "Stam Ashkenaz"; "Drugulin CLM" vs "Drugulin").
    best = None
    for sec in sections:
        head = sec.strip().split('\n')[0]
        fam = _norm(re.split(r'\s+(?:font|fonts|family)\b', head, 1)[0])
        if not fam:
            continue
        if fam in target or target in fam:
            if best is None or len(fam) > len(best[0]):
                best = (fam, sec, head)
    if best:
        if EXCEPTION_RE.search(best[1]):
            return True, 'font-exception clause in its own section: "%s"' % best[2][:60]
        return False, 'combined license: this font\'s own section carries NO exception ("%s")' % best[2][:60]
    return False, 'combined license covering %d families; this font is not named in any of them' % len(sections)


def classify_license(text, name=''):
    """Return (licenseId, evidence), or (None, reason) when the license forbids derivatives or
    none was found. `text` = upstream license file + name-table license/copyright strings.
    `name` scopes the GPL exception check to this font inside a combined license file."""
    t = re.sub(r'\s+', ' ', text)
    # HTML-derived text splits words across tags ("Attribution-Sha re Alike"), and a license URL
    # is often the only unambiguous marker, so match the CC family on a space-stripped copy too.
    tight = re.sub(r'\s+', '', text).lower()

    # Hard refusal first: a license that forbids modification is useless for a font editor.
    nd = (re.search(r'NoDerivat\w*|/by-n[cd][\w-]*-nd|Attribution-N\w*-?NoDerivs?|No Derivative Works', t, re.I)
          or re.search(r'noderivat|licenses/by-[a-z-]*nd[-/]', tight))
    if nd:
        return None, 'license forbids derivative works ("%s") — a partner font must be editable.' % nd.group(0)[:40]

    found, evidence = [], []
    if re.search(r'SIL OPEN FONT LICENSE|SIL Open Font License', t):
        m = re.search(r'Open Font License[ ,]*(?:\(OFL\)[ ,]*)?Version 1\.1|OPEN FONT LICENSE Version 1\.1', t)
        if m:
            found.append('OFL-1.1'); evidence.append('OFL 1.1 marker: "%s"' % m.group(0))
        else:
            return None, 'OFL marker found but not version 1.1 — refusing (ask the maintainer).'
    if re.search(r'UBUNTU FONT LICENCE|Ubuntu Font Licence', t, re.I):
        found.append('UFL-1.0'); evidence.append('Ubuntu Font Licence marker')
    if re.search(r'LaTeX Project Public License', t, re.I):
        found.append('LPPL-1.3c'); evidence.append('LaTeX Project Public License marker')
    m = re.search(r'attribution-?sharealike(\d\.\d)?|creativecommons\.org/licenses/by-sa/(\d\.\d)', tight)
    if m:
        ver = next((g for g in m.groups() if g), None) or ('3.0' if '3.0unported' in tight else '4.0')
        if ver not in ('3.0', '4.0'):
            return None, 'CC BY-SA version %s is not allowlisted — ask the maintainer.' % ver
        found.append('CC-BY-SA-%s' % ver); evidence.append('CC BY-SA %s marker' % ver)
    elif re.search(r'creativecommons\.org/licenses/by/(\d\.\d)', tight):
        ver = re.search(r'creativecommons\.org/licenses/by/(\d\.\d)', tight).group(1)
        if ver not in ('3.0', '4.0'):
            return None, 'CC BY version %s is not allowlisted — ask the maintainer.' % ver
        found.append('CC-BY-%s' % ver); evidence.append('CC BY %s marker' % ver)
    if re.search(r'GNU (?:General |)Public License', t, re.I):
        ok, why = exception_scoped_to(name, text)
        if ok:
            found.append('GPL-with-font-exception'); evidence.append(why)
        else:
            # Bare GPL is ALLOWED: it permits modification. The derivative is simply GPL too.
            ver = '3.0' if re.search(r'GNU GENERAL PUBLIC LICENSE\s*,?\s*Version 3|Public License[^.]{0,40}version 3', t, re.I) else '2.0'
            found.append('GPL-%s' % ver)
            evidence.append('bare GPL %s (%s) — modification permitted; the derivative stays GPL' % (ver, why))
    if re.search(r'Apache License[ ,]*Version 2\.0', t):
        found.append('Apache-2.0'); evidence.append('Apache 2.0 marker')
    if re.search(r'CC0|creativecommons\.org/publicdomain/zero|public domain dedication', t, re.I):
        found.append('CC0-1.0'); evidence.append('CC0 / public-domain marker')
    if not found:
        return None, 'No license detected. Ask the maintainer.'
    if len(set(found)) > 1:
        # Prefer the explicit "This Font Software is licensed under ..." declaration.
        decl = re.search(r'This Font Software is licensed under the ([^.]{0,80})', t)
        if decl and 'Open Font License' in decl.group(1):
            return 'OFL-1.1', 'declaration sentence: "%s"' % decl.group(0)
        if decl and re.search(r'GNU|GPL', decl.group(1)):
            gpl = [f for f in found if f.startswith('GPL')]
            if gpl:
                return gpl[0], 'declaration sentence: "%s"' % decl.group(0)
        # Dual-licensed (e.g. Libertine ships GPL+FE and OFL): take the most permissive for a
        # derivative — OFL over copyleft-GPL — and say so.
        for pref in ('CC0-1.0', 'OFL-1.1', 'Apache-2.0', 'GPL-with-font-exception'):
            if pref in found:
                return pref, 'dual-licensed (%s); taking %s as the most permissive for a derivative' % (
                    ', '.join(sorted(set(found))), pref)
        return None, 'Multiple license candidates (%s) and no clear declaration — ask the maintainer.' % ', '.join(sorted(set(found)))
    return found[0], '; '.join(evidence)


def detect_rfns(text):
    """Reserved Font Name declarations, quoted or bare, order-preserving. Recorded for
    EVERY license (not just OFL): if the upstream reserves a name, we honor it."""
    rfns = []
    for m in re.finditer(r'Reserved Font [Nn]ames?\s*((?:[:,]|\s)*)((?:["“\'][^"“”\']{1,60}["”\']|and|,|\s){1,200}?)(?=[.;\n]|This|is licensed)', text):
        for q in re.finditer(r'["“\']([^"“”\']{1,60})["”\']', m.group(2)):
            n = q.group(1).strip()
            if n and n not in rfns:
                rfns.append(n)
    for m in re.finditer(r'Reserved Font Name\s+(?!["“\'])([A-Z][\w-]{1,40})', text):
        n = m.group(1).strip().rstrip('.')
        if n and n not in rfns:
            rfns.append(n)
    return rfns


def copyright_block(license_text, name_copyright):
    """The upstream copyright declaration: Copyright-bearing sentences before the license
    body header in the license file; falls back to name-table ID 0's first paragraph."""
    if license_text:
        head = re.split(r'SIL OPEN FONT LICENSE|GNU GENERAL PUBLIC LICENSE|TERMS AND CONDITIONS|Apache License,? Version|PREAMBLE', license_text)[0]
        paras = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n|\n-{4,}\n?|-{20,}', head)]
        keep = [p for p in paras if re.search(r'[Cc]opyright \(|\(c\)|\(C\)|©', p) and 'licensed under' not in p]
        if keep:
            return '\n'.join(keep)
    first = (name_copyright or '').replace('\r\n', '\n').split('\n\n')[0]
    return re.sub(r'\s+', ' ', first).strip()


def slugify(s):
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return re.sub(r'-{2,}', '-', s) or 'font'


def not_staged_section():
    """Render starting-fonts/not-staged.json — what was refused and why, plus any place the
    partner's fonts page and a font's own distribution disagree. Returns [] when absent."""
    if not NOT_STAGED.is_file():
        return []
    try:
        d = json.loads(NOT_STAGED.read_text(encoding='utf-8'))
    except ValueError:
        return []
    L, cats = [], d.get('categories') or []
    items = d.get('notStaged') or []
    if items:
        L += ['## Not staged', '',
              'Requested partner fonts deliberately kept OUT of `manifest.json`. Reviewed %s against %s.'
              % (d.get('reviewed', '(date not recorded)'), d.get('source', 'the partner font list')),
              'Generated from `not-staged.json` — do not hand-edit.', '']
        for cat in cats:
            group = [f for f in items if f.get('category') == cat.get('key')]
            if not group:
                continue
            L += ['### %s (%d)' % (cat.get('title', cat.get('key', '?')), len(group)), '']
            if cat.get('note'):
                L += [cat['note'], '']
            for f in group:
                bits = ['**%s**' % f.get('name', '?')]
                if f.get('pageLicense'):
                    bits.append('page says %s' % f['pageLicense'])
                L.append('- %s — %s' % (' · '.join(bits), f.get('reason', '')))
                if f.get('conflict'):
                    L.append('  - ⚠ **Conflict:** %s' % f['conflict'])
            L.append('')
    disc = d.get('discrepancies') or []
    if disc:
        L += ['## License discrepancies (staged fonts)', '',
              'Fonts that ARE staged, where the partner page\'s label differs from the license text shipped',
              'in the font\'s own distribution. The shipped text decides; this records the difference.', '']
        for f in disc:
            L.append('- **%s** — page: %s · staged as: %s. %s'
                     % (f.get('name', '?'), f.get('pageLicense', '?'), f.get('staged', '?'), f.get('note', '')))
        L.append('')
    return L


def write_links_md(manifest):
    """Regenerate starting-fonts/LINKS.md — the copy-paste sheet of every live ?start= link,
    followed by the not-staged / discrepancy record."""
    L = [
        '# Starting-font links',
        '',
        'GENERATED by `scripts/add_os_font.py` from `manifest.json` + `not-staged.json` — do not',
        'hand-edit (`python3 scripts/add_os_font.py --regen-links` refreshes it). One block per',
        'staged font, ready to paste into an email or the partner\'s page; then the record of what',
        'was deliberately NOT staged and why.',
        '',
    ]
    for f in manifest.get('fonts', []):
        url = 'https://ivritsuite.com/Hebrew_Font_Maker.html?start=%s' % f['id']
        L.append('## %s' % f.get('displayName', f['id']))
        L.append('')
        L.append('- Live link: <%s>' % url)
        L.append('- Snippet: `<a href="%s">Edit this font using IvritSuite</a>`' % url)
        rfns = ', '.join(n for n in (f.get('reservedFontNames') or []) if n)
        lic = f.get('licenseName') or f.get('licenseId') or ''
        L.append('- License: %s%s' % (lic, (' · reserved names honored: ' + rfns) if rfns else ''))
        meta = []
        if f.get('designer'):
            meta.append('Designer: %s' % f['designer'])
        if f.get('originalVersion'):
            meta.append('upstream version %s' % f['originalVersion'])
        if f.get('added'):
            meta.append('added %s' % f['added'])
        if meta:
            L.append('- ' + ' · '.join(meta))
        if f.get('upstream'):
            L.append('- Upstream source: <%s>' % f['upstream'])
        L.append('')
    L += not_staged_section()
    LINKS_MD.write_text('\n'.join(L).rstrip() + '\n', encoding='utf-8')


def main():
    ap = argparse.ArgumentParser(description='Stage a partner starting font (see module docstring).')
    ap.add_argument('font', nargs='?', help='the .ttf/.otf to stage (omit with --regen-links)')
    ap.add_argument('--regen-links', action='store_true', help='rebuild starting-fonts/LINKS.md from the manifest and exit')
    ap.add_argument('--upstream', help='URL of the exact upstream file (provenance; required when staging)')
    ap.add_argument('--license-file', help='upstream license text file — staged verbatim as LICENSE.txt')
    ap.add_argument('--id', dest='slug', help='override the URL slug')
    ap.add_argument('--name', help='display name override (when the embedded family name is stale)')
    ap.add_argument('--designer', help='designer override (cite your source; else name-table ID 9)')
    ap.add_argument('--partner', default='opensiddur', choices=sorted(PARTNERS))
    ap.add_argument('--force', action='store_true', help='replace an existing manifest id')
    ap.add_argument('--dry-run', action='store_true', help='report + print the entry, stage nothing')
    a = ap.parse_args()

    if a.regen_links:
        if not MANIFEST.is_file():
            print('No manifest to regenerate from (%s).' % MANIFEST, file=sys.stderr); return 1
        write_links_md(json.loads(MANIFEST.read_text(encoding='utf-8')))
        print('Rebuilt %s from the manifest.' % LINKS_MD.relative_to(REPO)); return 0
    if not a.font or not a.upstream:
        print('Refused: staging needs a font file and --upstream (or use --regen-links).', file=sys.stderr); return 1

    src = Path(a.font)
    if not src.is_file() or src.suffix.lower() not in ('.ttf', '.otf'):
        print('Refused: need an existing .ttf or .otf file, got %s' % src, file=sys.stderr); return 1
    data = src.read_bytes()
    if data[:4] == b'ttcf':
        print('Refused: TTC collections are not supported — provide a single-font TTF/OTF.', file=sys.stderr); return 1

    font = TTFont(src, lazy=True)
    names = read_names(font)
    license_text = ''
    if a.license_file:
        license_text = Path(a.license_file).read_text(encoding='utf-8', errors='replace')

    scope_name = a.name or names['family'] or src.stem
    lic_id, evidence = classify_license('\n'.join([license_text, names['license'], names['copyright']]), scope_name)
    if not lic_id:
        print('LICENSE GATE REFUSED — nothing staged.\n  Reason: %s' % evidence, file=sys.stderr)
        print('  name-table ID 0: %r' % names['copyright'][:300], file=sys.stderr)
        print('  name-table ID 13: %r' % names['license'][:300], file=sys.stderr)
        return 3
    lic_name, lic_url, obligations = LICENSE_IDS[lic_id]

    cmap = font.getBestCmap()
    base = sum(1 for cp in BASE_RANGE if cp in cmap)
    nik = sum(1 for cp in NIKKUD_CPS if cp in cmap)
    trop = sum(1 for cp in TROP_RANGE if cp in cmap)
    if base < 27:
        print('COVERAGE REFUSED — only %d/27 Hebrew base letters in the cmap.' % base, file=sys.stderr); return 4

    rfns = detect_rfns('\n'.join([license_text, names['license'], names['copyright']]))
    display = (a.name or names['family'] or src.stem).strip()
    slug = a.slug or slugify(display)
    version = re.sub(r'^Version\s*', '', names['version']).split(';')[0].strip()
    designer = (a.designer or names['designer']).strip()
    partner = PARTNERS[a.partner]

    entry = {
        'id': slug,
        'file': '%s/%s' % (slug, src.name),
        'displayName': display,
        'partner': a.partner,
        'partnerName': partner['partnerName'],
        'partnerUrl': partner['partnerUrl'],
        'upstream': a.upstream,
        'licenseId': lic_id,
        'licenseName': lic_name,
        'licenseUrl': lic_url,
        'licenseFile': '%s/LICENSE.txt' % slug,
        'copyright': copyright_block(license_text, names['copyright']),
        'reservedFontNames': rfns,
        'designer': designer,
        'originalVersion': version,
        'hasNikkud': nik >= len(NIKKUD_CPS) // 2 + 1,
        'hasTrop': trop >= len(TROP_RANGE) // 2 + 1,
        'sha256': hashlib.sha256(data).hexdigest(),
        'added': datetime.date.today().isoformat(),
    }
    # What the DERIVATIVE inherits. The runtime reads these to build the exported LICENSE.txt and
    # to decide whether the family name must change.
    if obligations:
        entry['obligations'] = list(obligations)
    if 'rename' in obligations:
        entry['renameRequired'] = True
    if names['family'] and names['family'] != display:
        entry['nameTableFamily'] = names['family']

    print('Detected: %s · %s · %d/27 base, %d nikkud, %d trop cps' % (display, lic_id, base, nik, trop))
    print('  license evidence: %s' % evidence)
    print('  copyright: %s' % entry['copyright'].replace('\n', ' | '))
    print('  reserved font names: %s' % (', '.join(rfns) or '(none declared)'))
    print('  derivative obligations: %s' % (', '.join(obligations) or '(none)'))
    if 'rename' in obligations:
        print('  NOTE: this license REQUIRES the derivative to be renamed — the original family name '
              'is enforced like a Reserved Font Name.')
    if 'nameTableFamily' in entry:
        print('  NOTE: embedded family name is %r — recorded as nameTableFamily.' % names['family'])
    if not a.license_file:
        print('  WARNING: no --license-file; LICENSE.txt will hold the embedded name-table license text.')

    manifest = {'schema': 1, 'fonts': []}
    if MANIFEST.is_file():
        manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    existing = [f['id'] for f in manifest['fonts']]
    if slug in existing and not a.force:
        print('Refused: id %r already in the manifest (use --force to replace).' % slug, file=sys.stderr); return 5

    if a.dry_run:
        print('\n--dry-run: nothing staged. Manifest entry would be:')
        print(json.dumps(entry, indent=2, ensure_ascii=False)); return 0

    dest = FONTS_DIR / slug
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest / src.name)
    lic_out = license_text if license_text else (names['license'] or names['copyright'])
    (dest / 'LICENSE.txt').write_text(lic_out.replace('\r\n', '\n').rstrip() + '\n', encoding='utf-8')
    manifest['fonts'] = [f for f in manifest['fonts'] if f['id'] != slug] + [entry]
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    write_links_md(manifest)   # keep the copy-paste link sheet in lockstep with the manifest

    staged = TTFont(dest / src.name, lazy=True)                      # smoke: staged copy re-parses
    ok = sum(1 for cp in BASE_RANGE if cp in staged.getBestCmap())
    assert ok >= 27 and hashlib.sha256((dest / src.name).read_bytes()).hexdigest() == entry['sha256']
    json.loads(MANIFEST.read_text(encoding='utf-8'))                 # smoke: manifest still parses

    url = 'https://ivritsuite.com/Hebrew_Font_Maker.html?start=%s' % slug
    print('\nStaged starting-fonts/%s/ and updated the manifest + LINKS.md. No sw.js bump needed for intake.' % slug)
    print('  Live URL:  %s' % url)
    print('  Snippet:   <a href="%s">Edit this font using IvritSuite</a>' % url)
    print('  Summary for the partner: "%s" (%s%s) is now editable in the IvritSuite Hebrew Font Maker.'
          % (display, lic_name, '; reserved names honored: ' + ', '.join(rfns) if rfns else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main())
