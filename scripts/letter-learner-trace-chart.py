#!/usr/bin/env python3
"""Trace the handwritten (cursive) letterforms of a classroom alef-bet chart into SVG path data for letter_learner.html.

The Letter Learner's cursive hint drawings are built ON the handwritten letterform the way the block ones are built
on Frank Ruhl (scripts/letter-learner-trace-glyph.py): here the source is a photo of the maintainer's wall chart —
three rows of nine cells, the printed letter in red above and the cursive form in black below, with red start
dots and arrows — and the output is one filled outline per form, fitted into the drawings' 100×100 box on a SHARED
scale and baseline (x-height 35 px → 44 units, baseline at y = 70, centred at x = 50), so a final's tail visibly
crosses the writing line and the 27 letters sit alike. The chart itself is not shipped (only the redrawn letter
shapes are); this is a dev tool, like the glyph tracer, and needs only Pillow + numpy.

Pipeline per cell: the ink mask (R, G, B < 120 — the red marks and the pale rule drop out — plus the red start
dots put back: each sits ON its stroke's first pixels, so dropping it would bite a notch out of the letter; the red
arrows are thin and light and never count) → crop → ×8 upscale +
blur + threshold + a small dilation (the chart's stroke is thinner than a drawing wants) → pixel-edge contour loops
(shared edges cancel; holes come out with the opposite winding, so the path is drawn with fill-rule="evenodd") →
a moving average along each loop (the photo's pixel wobble goes, the stroke's shape stays) → Douglas–Peucker →
a closed Catmull-Rom spline through the kept points, written as cubic Béziers → 1-decimal coordinates.

Usage:
  python3 scripts/letter-learner-trace-chart.py --image chart.jpg [--json out.json] [--html preview.html]
                                                [--rows 157-304:281,312-468:442,476-633:609]
                                                [--edges 65,141,218,295,371,447,524,601,677,754]
                                                [--xheight 35] [--eps 2.0] [--dilate 5] [--smooth 12] [--blur 0.9]

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


def start_dots(R, G, B, dark, dot_max):
    """The chart's red start dots as a mask: every small, compact red blob that touches the ink (the arrows are too
    thin and light to register; a dot sits on the first pixels of its stroke)."""
    import numpy as np
    from collections import deque
    if dot_max <= 0: return np.zeros_like(dark)
    red = (R > 140) & (G < 120) & (B < 120) & ((R - G) > 60)
    near = dark.copy()
    near[1:, :] |= dark[:-1, :]; near[:-1, :] |= dark[1:, :]; near[:, 1:] |= dark[:, :-1]; near[:, :-1] |= dark[:, 1:]
    H, W = red.shape; seen = np.zeros_like(red); out = np.zeros_like(red)
    ys, xs = np.nonzero(red)
    for y0, x0 in zip(ys, xs):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and red[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
        if len(pts) < 10 or len(pts) > dot_max: continue
        py = [p[0] for p in pts]; px = [p[1] for p in pts]
        if max(py) - min(py) > 9 or max(px) - min(px) > 9: continue   # a dot, not an arrow
        if not any(near[p] for p in pts): continue
        for p in pts: out[p] = True
    return out


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


def average(pts, k):
    """A moving average over ±k neighbours along a closed loop — the pixel wobble of a photographed stroke goes."""
    if k <= 0 or len(pts) < 2 * k + 3: return pts
    n = len(pts); out = []
    for i in range(n):
        xs = ys = 0.0
        for j in range(-k, k + 1):
            p = pts[(i + j) % n]; xs += p[0]; ys += p[1]
        out.append((xs / (2 * k + 1), ys / (2 * k + 1)))
    return out


def smooth_path(pts, fx, fy):
    """A closed Catmull-Rom spline through the points, as cubic Béziers — the outline passes through every kept vertex
    with a continuous tangent, so a stroke reads as one pen line."""
    n = len(pts)
    def num(v): s = '%.1f' % v; return s.rstrip('0').rstrip('.') if '.' in s else s
    def f(p): return num(fx(p[0])) + ' ' + num(fy(p[1]))
    if n < 3: return ''
    s = 'M' + f(pts[0])
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        s += 'C' + f(c1) + ' ' + f(c2) + ' ' + f(p2)
    return s + 'Z'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--image', required=True, help='the chart photo (not shipped)')
    ap.add_argument('--json', help='write one object per form: {id, d, top, bottom, width}')
    ap.add_argument('--html', help='write a preview page of the 27 outlines on their writing line')
    ap.add_argument('--rows', default='157-304:281,312-468:442,476-633:609', help='per row: y0-y1:baseline')
    ap.add_argument('--edges', default='65,141,218,295,371,447,524,601,677,754', help='cell edges, x, left to right')
    ap.add_argument('--xheight', type=float, default=35.0, help='the chart x-height in px (→ 44 units)')
    ap.add_argument('--eps', type=float, default=2.0, help='Douglas–Peucker tolerance in upscaled px')
    ap.add_argument('--dilate', type=int, default=5, help='MaxFilter size at ×8 (0 = none)')
    ap.add_argument('--smooth', type=int, default=12, help='moving-average half-window along a loop, in upscaled px (0 = none)')
    ap.add_argument('--blur', type=float, default=0.9, help='Gaussian blur before the threshold, as a fraction of the ×8 scale')
    ap.add_argument('--dot-max', dest='dot_max', type=int, default=60, help='largest red blob (px) treated as a start dot and kept as ink; 0 = keep none')
    args = ap.parse_args()
    try:
        from PIL import Image, ImageFilter
        import numpy as np
    except ImportError:
        raise SystemExit('letter-learner-trace-chart: Pillow and numpy are required')
    im = Image.open(args.image).convert('RGB')
    a = np.asarray(im).astype(int); R, G, B = a[..., 0], a[..., 1], a[..., 2]
    dark = (R < 120) & (G < 120) & (B < 120)
    dark |= start_dots(R, G, B, dark, args.dot_max)
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
            big = crop.resize((crop.width * S, crop.height * S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S * args.blur))
            mask = np.asarray(big) > 128
            if args.dilate:
                mask = np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(ImageFilter.MaxFilter(args.dilate))) > 128
            loops = [rdp(average(l, args.smooth), args.eps) for l in contours(mask) if len(l) > 24]
            loops = [l for l in loops if len(l) >= 3]
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
