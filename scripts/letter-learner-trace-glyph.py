#!/usr/bin/env python3
"""Trace a Hebrew letter from the suite's own Frank Ruhl Libre into SVG path data for letter_learner.html.

The Letter Learner's hint drawings are built ON the real letterform (the golfer's body is the gimel's
vertical, the door is the dalet): the outline comes from fonts/FrankRuhlLibre-Regular.ttf — a variable
font — instantiated at the requested weight, flipped into SVG's y-down space and fitted into the
drawings' 100×100 box. The output is pasted into a drawing's `svg` string (or wrapped in a
<g transform="translate(…) scale(…)"> to place it in a scene). Nothing here is shipped: this is a dev
tool, like scripts/add_os_font.py.

Requires Python 3 + fontTools (`pip install fonttools`; in the sandbox: a venv in the scratchpad).

Usage:
  python3 scripts/letter-learner-trace-glyph.py --char ג [--wght 700] [--box 100] [--pad 6]
                                                [--font fonts/FrankRuhlLibre-Regular.ttf] [--json]
  python3 scripts/letter-learner-trace-glyph.py --char א --char ב --char ג --char ד --json

Prints, per character, an SVG comment with the source and the fitted bounding box, then the
<path d="…" fill="var(--ll-line)"/> (or one JSON object per line with --json: char, cp, d, bbox).
"""
import argparse
import json
import os
import sys


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--char', action='append', required=True, help='the letter to trace (repeatable)')
    ap.add_argument('--font', default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fonts', 'FrankRuhlLibre-Regular.ttf'))
    ap.add_argument('--wght', type=float, default=700, help='variable-font weight (300–900; 700 = Bold)')
    ap.add_argument('--box', type=float, default=100, help='the square the glyph is fitted into')
    ap.add_argument('--pad', type=float, default=6, help='margin inside the box')
    ap.add_argument('--json', action='store_true', help='one JSON object per character')
    args = ap.parse_args()

    try:
        from fontTools.ttLib import TTFont
        from fontTools.pens.boundsPen import BoundsPen
        from fontTools.pens.svgPathPen import SVGPathPen
        from fontTools.pens.transformPen import TransformPen
    except ImportError:
        sys.stderr.write('letter-learner-trace-glyph: fontTools is not installed (pip install fonttools)\n')
        sys.exit(2)

    font = TTFont(args.font)
    if 'fvar' in font:
        from fontTools.varLib import instancer
        axes = {a.axisTag: (a.minValue, a.maxValue) for a in font['fvar'].axes}
        lo, hi = axes.get('wght', (args.wght, args.wght))
        wght = max(lo, min(hi, args.wght))
        font = instancer.instantiateVariableFont(font, {'wght': wght}, inplace=False)
    else:
        wght = None
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()

    def ntos(v):
        s = '%.1f' % v
        return s.rstrip('0').rstrip('.') if '.' in s else s

    inner = args.box - 2 * args.pad
    for ch in args.char:
        cp = ord(ch[0])
        name = cmap.get(cp)
        if name is None:
            sys.stderr.write('letter-learner-trace-glyph: U+%04X is not in %s\n' % (cp, os.path.basename(args.font)))
            continue
        glyph = glyph_set[name]
        bp = BoundsPen(glyph_set)
        glyph.draw(bp)
        xmin, ymin, xmax, ymax = bp.bounds
        w, h = xmax - xmin, ymax - ymin
        s = inner / max(w, h)
        tx = args.pad + (inner - w * s) / 2 - xmin * s
        ty = args.pad + (inner - h * s) / 2 + ymax * s   # y flips: y' = ty - y * s
        pen = SVGPathPen(glyph_set, ntos=ntos)
        glyph.draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
        d = pen.getCommands()
        bbox = [round(tx + xmin * s, 1), round(ty - ymax * s, 1), round(tx + xmax * s, 1), round(ty - ymin * s, 1)]
        if args.json:
            print(json.dumps({'char': ch[0], 'cp': 'U+%04X' % cp, 'glyph': name, 'wght': wght, 'd': d, 'bbox': bbox}, ensure_ascii=False))
        else:
            print('<!-- %s U+%04X from %s wght %s, fitted bbox x %s–%s y %s–%s in a %g box -->' % (
                ch[0], cp, os.path.basename(args.font), wght, bbox[0], bbox[2], bbox[1], bbox[3], args.box))
            print('<path d="%s" fill="var(--ll-line)"/>' % d)


if __name__ == '__main__':
    main()
