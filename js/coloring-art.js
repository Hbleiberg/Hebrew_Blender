/* ══════════════════════════════════════════════════════
   IvritSuite — a drawing as coloring line art: js/coloring-art.js
   Loaded by parsha_emojis.html (the parasha coloring sheets) and holiday_guide.html (the holiday coloring sheets),
   each as a classic script placed before the page's inline <script>. Plain top-level declarations, as
   js/trope-staff.js: the pages call etCsConvert and etCsMeasure by name (a page's own inline script must not declare
   any name below — a second top-level `const` of the same name is a SyntaxError that stops that whole script).
   It reads no settings and no I18n; etCsMeasure lays a hidden copy of the drawing out in the document.

   The drawings (js/parasha-icons.js from ParashaEmojis.md, js/holiday-guide-data.js from HolidayGuide.md) use only
   path/circle/ellipse/rect/line/polyline/polygon/g; every fill and stroke is none or a var(--hol-*) token, and the
   outline comes from .hol-ico svg (--hol-line, width 2). etCsConvert(svg, colored, key) redraws one in place for
   paper with literal colours — black ink and white paper for colouring in, or the light palette when `colored` — and
   lighter lines (f), so a page-sized picture keeps colouring-book lines. The caller hands it the <svg> with the
   outline written as attributes (fill none, stroke var(--hol-line), stroke-width 2, round caps and joins); `key`
   names the drawing in the geometry cache (any Map key: a parasha index, 'sukkot/2'), so the line art and the
   coloured copy of one drawing share one measuring. It throws when a palette token survives.
   The rules, tuned drawing by drawing on scripts/parasha-coloring-review.mjs's sheets (the holiday drawings are
   reviewed on scripts/holiday-coloring-review.mjs's — a holiday drawing that converts badly is redrawn, the rules
   are not retuned for it: a change here changes all 54 parasha pictures; docs/reference/shared-components.md →
   The line art):
   ══════════════════════════════════════════════════════ */
const ET_CS_WEIGHT = 0.45;   // f: the outline weight on paper, as a share of the site's
const ET_CS_INK = '#000', ET_CS_PAPER = '#fff', ET_CS_DETAIL = '#9a9a9a';
const ET_CS_LIGHT = { line: '#1a2744', gold: '#c9922a', 'gold-lt': '#f0d080', paper: '#fffaf0', navy: '#2a3b66', red: '#c0392b', green: '#3a7d44', blue: '#3b6fb6', flame: '#f0a030', ground: '#ffffff' };
const ET_CS_GEOM = ['d', 'points', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'transform'];
const ET_CS_SHAPES = 'path, circle, ellipse, rect, line, polyline, polygon';
const _etCsGeo = new Map();   // key → its drawing's measured geometry: the line art and the colored copy share one measuring
// Geometry the paint rules need, measured once on a hidden copy of the drawing (shape i ↔ the i-th shape): each shape's
// box area, the largest of its pieces (a path drawn as several, each starting with an absolute M: a bunch of grape
// glints, the three dots of a shin), and the fill token of the topmost earlier filled shape under its box centre (a
// fill) or its midpoint (a line). Nothing is measurable without layout, so the copy sits in the document, out of sight.
// Each piece is a path of its own beside its shape, all of them added before the first read: the copy is laid out once,
// not once per piece (a read after each insertion forced ~600 layouts over the 54 drawings).
function etCsMeasure(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:480px;height:480px;visibility:hidden;pointer-events:none;';
  const copy = svg.cloneNode(true);
  copy.setAttribute('width', '480'); copy.setAttribute('height', '480');
  host.appendChild(copy);
  const shapes = [...copy.querySelectorAll(ET_CS_SHAPES)];
  const pieces = shapes.map(n => {
    const d = n.tagName === 'path' ? (n.getAttribute('d') || '') : '';
    const parts = d.trim().split(/(?=M)/).filter(x => x.trim());
    if (!(parts.length > 1 && parts.every(x => /^M/.test(x.trim())))) return null;
    return parts.map(x => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', x);
      n.parentNode.insertBefore(p, n);
      return p;
    });
  });
  document.body.appendChild(host);
  const fillOf = n => { for (let x = n; x; x = x.parentElement) { if (x.hasAttribute('fill')) return x.getAttribute('fill'); if (x === copy) break; } return 'none'; };
  const out = shapes.map(() => ({ area: 0, piece: 0, under: '' }));
  try {
    const filled = [];
    shapes.forEach((n, i) => {
      let b = null; try { b = n.getBBox(); } catch (e) {}
      out[i].area = b ? b.width * b.height : 0;
      out[i].piece = out[i].area;
      if (pieces[i]) {
        let big = 0;
        pieces[i].forEach(p => { try { const bb = p.getBBox(); big = Math.max(big, bb.width * bb.height); } catch (e) {} });
        out[i].piece = big;
      }
      let pt = null;
      try {
        if (n.getAttribute('fill') && fillOf(n) !== 'none' && b) pt = new DOMPoint(b.x + b.width / 2, b.y + b.height / 2);
        else if (typeof n.getTotalLength === 'function') { const L = n.getTotalLength(); if (L) { const q = n.getPointAtLength(L / 2); pt = new DOMPoint(q.x, q.y); } }
      } catch (e) {}
      const m = n.getScreenCTM && n.getScreenCTM();
      if (pt && m) {
        const sp = pt.matrixTransform(m);
        for (let j = filled.length - 1; j >= 0; j--) {
          const fm = filled[j].n.getScreenCTM();
          try { if (fm && filled[j].n.isPointInFill(sp.matrixTransform(fm.inverse()))) { out[i].under = filled[j].fill; break; } } catch (e) {}
        }
      }
      const fv = fillOf(n);
      if (fv && fv !== 'none') filled.push({ n, fill: fv });
    });
  } finally { host.remove(); }
  return out;
}
function etCsConvert(svg, colored, i) {
  let geo = i == null ? null : _etCsGeo.get(i);   // the same drawing measures the same whichever way it is painted
  if (!geo) { geo = etCsMeasure(svg); if (i != null) _etCsGeo.set(i, geo); }
  const f = ET_CS_WEIGHT, e = 2 * f;
  const tok = v => { const m = /^var\(--hol-([a-z-]+)\)$/.exec(v || ''); return m ? m[1] : (v === 'none' || !v ? '' : '?'); };
  const isInk = v => tok(v) === 'line';
  const isCol = v => { const t = tok(v); return !!t && t !== 'line'; };
  const get = (n, a) => { for (let x = n; x; x = x.parentElement) { if (x.hasAttribute(a)) return x.getAttribute(a); if (x === svg) break; } return null; };
  const groups = new Map();
  const key = n => {
    if (!groups.has(n.parentNode)) groups.set(n.parentNode, groups.size);
    return groups.get(n.parentNode) + '|' + n.tagName + '|' + ET_CS_GEOM.map(a => {
      const v = (n.getAttribute(a) || '').replace(/\s+/g, ' ').trim();
      return a === 'd' ? v.replace(/\s*[Zz]$/, '') : v;
    }).join('|');
  };
  const S = [...svg.querySelectorAll(ET_CS_SHAPES)].map((n, i) => ({ n, i, fill: get(n, 'fill') || 'none', stroke: get(n, 'stroke') || 'none', w: parseFloat(get(n, 'stroke-width')) || 2, k: key(n), area: geo[i].area, piece: geo[i].piece, under: tok(geo[i].under) }));
  const WARM = new Set(['gold', 'gold-lt', 'flame', 'red']);
  const fam = t => (t === 'gold-lt' ? 'gold' : t);
  const byKey = new Map();
  S.forEach(s => { s.inkLine = isInk(s.stroke); if (!byKey.has(s.k)) byKey.set(s.k, []); byKey.get(s.k).push(s); });
  // Same-shape pairs: the catalog draws many parts twice, an ink copy and a coloured copy of one geometry. The drawing's
  // own order is never changed (a fill painted later also covers what came between, like the roots of Vayechi's and
  // Nasso's fingers under the palm):
  //  - a coloured LINE after an ink line of the same path is a band: the ink keeps its width (it is the band's), and
  //    the coloured copy becomes the band's inside, 2e narrower;
  //  - a coloured FILL after an ink line of the same shape is a silhouette: the ink keeps its width and the fill gets
  //    an edge of its own, 2e narrower than the ink, so e of the ink shows round it;
  //  - otherwise the ink line is an ordinary outline (scaled), and a same-shape coloured copy needs no line of its own.
  S.forEach(s => {
    const mates = byKey.get(s.k).filter(o => o !== s);
    s.twin = mates.filter(o => o.inkLine).sort((a, b) => b.w - a.w)[0] || null;
    if (!s.inkLine) return;
    const later = mates.filter(o => o.i > s.i && !o.inkLine);
    const lineMate = later.find(o => isCol(o.stroke));
    const fillMate = later.find(o => isCol(o.fill));
    s.band = !!lineMate && s.w - 2 * e >= 0.95;
    s.silhouette = !!fillMate;
    if (s.band) lineMate.inside = s;
    if (fillMate) fillMate.inside = s;
  });
  const paint = (s, a, v) => s.n.setAttribute(a, v);
  const col = t => colored ? ET_CS_LIGHT[t] : null;
  S.forEach(s => {
    const n = s.n, ft = tok(s.fill), st = tok(s.stroke);
    const twin = !s.inkLine ? s.twin : null;
    // ── stroke ──
    if (s.inkLine) {
      paint(s, 'stroke', colored ? ET_CS_LIGHT.line : ET_CS_INK);
      paint(s, 'stroke-width', String(+((s.band || s.silhouette) ? s.w : s.w * f).toFixed(2)));
    } else if (s.inside) {
      // The inside of a band or a silhouette: 2e narrower than its ink, in paper (or its own colour).
      const inner = s.inside.w - 2 * e;
      const c = colored ? col(isCol(s.stroke) ? st : ft) : ET_CS_PAPER;
      if (inner > 0.05) { paint(s, 'stroke', c); paint(s, 'stroke-width', String(+inner.toFixed(2))); }
      else paint(s, 'stroke', 'none');
    } else if (twin) {
      // A same-shape ink line draws this one's edge (an outline on top, or a wider line under a thin coloured one).
      if (isCol(s.stroke) && !colored) { n.remove(); return; }
      paint(s, 'stroke', isCol(s.stroke) ? col(st) : 'none');
      paint(s, 'stroke-width', String(+(s.w * f).toFixed(2)));
    } else if (isCol(s.stroke)) {
      if (s.fill === 'none' && s.w - 2 * e >= 0.95) {
        // A bold coloured mark (Behar's 7, Bo's doorposts): an outlined band on paper, its own colour when coloured in.
        if (colored) { paint(s, 'stroke', col(st)); paint(s, 'stroke-width', String(s.w)); }
        else {
          paint(s, 'stroke', ET_CS_INK); paint(s, 'stroke-width', String(s.w));
          const c = n.cloneNode(false);
          c.setAttribute('stroke', ET_CS_PAPER); c.setAttribute('stroke-width', String(+(s.w - 2 * e).toFixed(2))); c.setAttribute('fill', 'none');
          n.after(c);
        }
      } else {
        // A thin line: black detail, or light grey where it is shine (a paper line; a light-gold line on gold).
        const detail = st === 'paper' || (st === 'gold-lt' && fam(s.under) === 'gold');
        paint(s, 'stroke', colored ? col(st) : (detail ? ET_CS_DETAIL : ET_CS_INK));
        paint(s, 'stroke-width', String(+(s.w * f).toFixed(2)));
      }
    } else if (s.stroke === 'none') {
      // A fill with no line of its own gets one on paper, so every colour region is a region to colour (the rainbow's
      // bands, Joseph's coat) — except shine and dark details. A light patch on an earlier fill is shine: on a warm part
      // (a lighter tint of it: Shemini's drops), or in pieces too small to colour (the grapes' glints); a larger light
      // piece on a cool part is a feature (the shin's dots on the mezuzah). A small navy patch (eyes, tent doors) is solid.
      s.shine = (ft === 'paper' || ft === 'gold-lt') && !!s.under && s.under !== 'paper' && (WARM.has(s.under) || s.piece < 4.5);
      s.dark = ft === 'navy' && s.area < 60;
      const outline = !colored && isCol(s.fill) && !s.shine && !s.dark;
      paint(s, 'stroke', outline ? ET_CS_INK : 'none');
      if (outline) paint(s, 'stroke-width', String(+e.toFixed(2)));
    }
    // ── fill ──
    if (s.fill === 'none') paint(s, 'fill', 'none');
    else if (isInk(s.fill)) paint(s, 'fill', colored ? ET_CS_LIGHT.line : ET_CS_INK);
    else if (colored) paint(s, 'fill', col(ft) || ET_CS_PAPER);
    else if (s.dark && !twin) paint(s, 'fill', ET_CS_INK);
    else paint(s, 'fill', ET_CS_PAPER);
  });
  svg.querySelectorAll('g').forEach(g => ['fill', 'stroke', 'stroke-width'].forEach(a => g.removeAttribute(a)));
  svg.setAttribute('stroke', colored ? ET_CS_LIGHT.line : ET_CS_INK);
  svg.setAttribute('stroke-width', String(e));
  if (/var\(/.test(svg.innerHTML)) throw new Error('a palette token survived the conversion');
}
