#!/usr/bin/env python3
"""Trace the handwritten (cursive) letterforms of a classroom alef-bet chart into SVG path data for letter_learner.html.

The Letter Learner's cursive hint drawings are built ON the handwritten letterform the way the block ones are built
on Frank Ruhl (scripts/letter-learner-trace-glyph.py): here the source is a photo of the maintainer's wall chart —
three rows of nine cells, the printed letter in red above and the cursive form in black below, with red start
dots and arrows — and the output is one filled outline per form, fitted into the drawings' 100×100 box on a SHARED
scale and baseline (x-height 35 px → 44 units, baseline at y = 70, centred at x = 50), so a final's tail visibly
crosses the writing line and the 27 letters sit alike. The chart itself is not shipped (only the redrawn letter
shapes are); this is a dev tool, like the glyph tracer, and needs only Pillow + numpy.

Pipeline per cell: the ink mask (R, G, B < 120 — the red marks and the pale rule drop out) → crop → ×8 upscale +
blur + threshold + a small dilation (the chart's stroke is thinner than a drawing wants) → pixel-edge contour loops
(shared edges cancel; holes come out with the opposite winding, so the path is drawn with fill-rule="evenodd") →
Douglas–Peucker → quadratic Béziers through the segment midpoints → 1-decimal coordinates.

Usage:
  python3 scripts/letter-learner-trace-chart.py --image chart.jpg [--json out.json] [--html preview.html]
                                                [--rows 157-304:281,312-468:442,476-633:609]
                                                [--edges 65,141,218,295,371,447,524,601,677,754]
                                                [--xheight 35] [--eps 1.8] [--dilate 5]

The defaults are the measured geometry of the chart the drawings were made from (an 800×800 photo); another chart
needs its own rows (y0-y1:baseline per row), cell edges (x, left to right) and x-height, measured once.
"""
import argparse
import json
import math

NAMES = [
    ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav', 'zayin', 'chet', 'tet'],
    ['yod', 'kaf', 'kaf_sofit', 'lamed', 'mem', 'mem_sofit', 'nun', 'nun_sofit', 'samech'],
    ['ayin', 'pe', 'pe_sofit', 'tzadi', 'tzadi_sofit', 'kuf', 'resh', 'shin', 'tav'],
]


def contours(mask):
    """Closed loops around every ink region of a boolean mask, as lists of (x, y) pixel corners."""
    import numpy as np
    m = np.pad(mask, 1)
    out = {}
    ys, xs = np.nonzero(m)
    for y, x in zip(ys, xs):
        if not m[y - 1, x]: out.setdefault((x, y), []).append((x + 1, y))
        if not m[y, x + 1]: out.setdefault((x + 1, y), []).append((x + 1, y + 1))
        if not m[y + 1, x]: out.setdefault((x + 1, y + 1), []).append((x, y + 1))
        if not m[y, x - 1]: out.setdefault((x, y + 1), []).append((x, y))
    loops = []
    while out:
        start = next(iter(out)); cur = start; prev_dir = None; loop = [cur]
        while True:
            cands = out.get(cur)
            if not cands: break
            if len(cands) == 1 or prev_dir is None: nxt = cands[0]
            else:
                def turn(n): d = (n[0] - cur[0], n[1] - cur[1]); return prev_dir[0] * d[1] - prev_dir[1] * d[0]
                nxt = min(cands, key=turn)   # the tightest right turn keeps a loop on its own region
            cands.remove(nxt)
            if not cands: del out[cur]
            prev_dir = (nxt[0] - cur[0], nxt[1] - cur[1]); cur = nxt
            if cur == start: break
            loop.append(cur)
        loops.append([(x - 1, y - 1) for x, y in loop])
    return loops


def rdp(pts, eps):
    """Douglas–Peucker on a closed polyline (split at the point farthest from pts[0])."""
    if len(pts) < 3: return pts
    def dist(p, a, b):
        ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay; L = dx * dx + dy * dy
        if L == 0: return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    far = max(range(1, len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
    def rec(seg):
        if len(seg) < 3: return seg
        a, b = seg[0], seg[-1]
        i, dm = max(((i, dist(seg[i], a, b)) for i in range(1, len(seg) - 1)), key=lambda t: t[1])
        if dm > eps: return rec(seg[:i + 1])[:-1] + rec(seg[i:])
        return [a, b]
    p1 = rec(pts[:far + 1]); p2 = rec(pts[far:] + [pts[0]])
    return p1[:-1] + p2[:-1]


def smooth_path(pts, fx, fy):
    """Quadratic Béziers through the segment midpoints, the vertices as control points — a closed, smooth outline."""
    n = len(pts)
    def mid(i): return ((pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2)
    def num(v): s = '%.1f' % v; return s.rstrip('0').rstrip('.') if '.' in s else s
    def f(p): return num(fx(p[0])) + ' ' + num(fy(p[1]))
    s = 'M' + f(mid(0))
    for i in range(1, n + 1): s += 'Q' + f(pts[i % n]) + ' ' + f(mid(i % n))
    return s + 'Z'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--image', required=True, help='the chart photo (not shipped)')
    ap.add_argument('--json', help='write one object per form: {id, d, top, bottom, width}')
    ap.add_argument('--html', help='write a preview page of the 27 outlines on their writing line')
    ap.add_argument('--rows', default='157-304:281,312-468:442,476-633:609', help='per row: y0-y1:baseline')
    ap.add_argument('--edges', default='65,141,218,295,371,447,524,601,677,754', help='cell edges, x, left to right')
    ap.add_argument('--xheight', type=float, default=35.0, help='the chart x-height in px (→ 44 units)')
    ap.add_argument('--eps', type=float, default=1.8, help='Douglas–Peucker tolerance in upscaled px')
    ap.add_argument('--dilate', type=int, default=5, help='MaxFilter size at ×8 (0 = none)')
    args = ap.parse_args()
    try:
        from PIL import Image, ImageFilter
        import numpy as np
    except ImportError:
        raise SystemExit('letter-learner-trace-chart: Pillow and numpy are required')
    im = Image.open(args.image).convert('RGB')
    a = np.asarray(im).astype(int); R, G, B = a[..., 0], a[..., 1], a[..., 2]
    dark = (R < 120) & (G < 120) & (B < 120)
    rows = []
    for r in args.rows.split(','):
        span, base = r.split(':'); y0, y1 = span.split('-'); rows.append((int(y0), int(y1), int(base)))
    edges = [int(x) for x in args.edges.split(',')]
    S = 8; UNIT = 44.0 / args.xheight
    glyphs = []
    for ri, (y0, y1, base) in enumerate(rows):
        for ci in range(len(edges) - 1):
            xl, xr = edges[len(edges) - 2 - ci], edges[len(edges) - 1 - ci]   # right-to-left: the first cell is the rightmost
            nm = NAMES[ri][ci] if ri < len(NAMES) and ci < len(NAMES[ri]) else 'r%dc%d' % (ri, ci)
            sub = dark[y0:y1 + 1, xl + 3:xr - 2]
            yy = np.where(sub.any(axis=1))[0]; xs = np.where(sub.any(axis=0))[0]
            if not len(yy): continue
            bx0, by0, bx1, by1 = xl + 3 + xs.min(), y0 + yy.min(), xl + 3 + xs.max(), y0 + yy.max()
            pad = 4
            crop = Image.fromarray((dark[by0 - pad:by1 + pad + 1, bx0 - pad:bx1 + pad + 1] * 255).astype('uint8'))
            big = crop.resize((crop.width * S, crop.height * S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S * 0.5))
            mask = np.asarray(big) > 128
            if args.dilate:
                mask = np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(ImageFilter.MaxFilter(args.dilate))) > 128
            loops = [rdp(l, args.eps) for l in contours(mask) if len(l) > 24]
            cx = (bx0 + bx1) / 2
            fx = lambda u: 50 + ((bx0 - pad + u / S) - cx) * UNIT
            fy = lambda v: 70 + ((by0 - pad + v / S) - base) * UNIT
            d = ''.join(smooth_path(l, fx, fy) for l in loops)
            g = {'id': nm, 'd': d, 'top': round(70 + (by0 - base) * UNIT, 1), 'bottom': round(70 + (by1 - base) * UNIT, 1), 'width': round((bx1 - bx0) * UNIT, 1)}
            glyphs.append(g)
            print('%-12s loops %d  width %5.1f  y %6.1f..%5.1f  %5d bytes' % (nm, len(loops), g['width'], g['top'], g['bottom'], len(d)))
    if args.json:
        with open(args.json, 'w', encoding='utf-8') as f: json.dump(glyphs, f, ensure_ascii=False, indent=0)
    if args.html:
        html = ['<!doctype html><meta charset="utf-8"><body style="margin:16px;background:#fff;font:13px sans-serif"><div style="display:flex;flex-wrap:wrap;gap:10px">']
        for g in glyphs:
            html.append('<div style="text-align:center"><svg viewBox="0 0 100 100" width="150" height="150" style="border:1px dashed #bbb"><path d="M4 70H96" stroke="#9ad" stroke-dasharray="3 3" fill="none"/><path d="%s" fill="#1a2744" fill-rule="evenodd"/></svg><div>%s</div></div>' % (g['d'], g['id']))
        html.append('</div></body>')
        with open(args.html, 'w', encoding='utf-8') as f: f.write(''.join(html))


if __name__ == '__main__':
    main()
