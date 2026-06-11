/* IvritSuite impact metrics — shared display layer.
   Renders the Community totals (with plain-language equivalents, a milestone
   banner, and a countries-reached list) and the Growth charts (inline SVG, no
   library). Used by BOTH the homepage "Community impact" popup and the public
   impact.html page, so this logic lives in exactly one place.
   Public API:  window.IvritImpactUI = { renderTotals, renderGrowth, ... }. */
(function () {
  'use strict';

  /* ── Equivalent constants (documented; tune freely) ───────────────────────
     parsha ≈ 1,500 Hebrew words: the Chumash has ~79,847 words across 54
     parshiyot (~1,480 each, rounded). A flash-card deck ≈ 20 cards; a classroom
     set ≈ 25 worksheets (one per student). Fonts / searches / audio are 1:1. */
  var WORDS_PER_PARSHA = 1500;
  var CARDS_PER_DECK = 20;
  var WORKSHEETS_PER_SET = 25;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmtNum(n) {
    n = Math.round(+n || 0);
    if (n >= 1e6) {
      var m = n / 1e6;
      return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + 'M';
    }
    return n.toLocaleString('en-US'); // 12,400 / 1,200 / 950
  }

  // "≈ N units" with one decimal between 1 and 10, and gentle copy below 1 unit.
  function ratio(n, per, unit, units) {
    var v = n / per;
    if (v >= 10) return '≈ ' + fmtNum(Math.round(v)) + ' ' + units;
    if (v >= 1) {
      var r = Math.round(v * 10) / 10;
      return '≈ ' + r + ' ' + (r === 1 ? unit : units);
    }
    return 'building toward the first ' + unit;
  }

  function titleCase(s) {
    return String(s).replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  var EVENT_DISPLAY = {
    worksheets:    { icon: '📄', label: 'Worksheets created',    equiv: function (n) { return ratio(n, WORKSHEETS_PER_SET, 'classroom set', 'classroom sets'); } },
    cards:         { icon: '🃏', label: 'Flash cards practiced', equiv: function (n) { return ratio(n, CARDS_PER_DECK, 'deck', 'decks'); } },
    torah_words:   { icon: '📜', label: 'Words of Torah read',   equiv: function (n) { return ratio(n, WORDS_PER_PARSHA, 'parsha', 'parshiyot'); } },
    fonts:         { icon: '🔤', label: 'Hebrew fonts created',  equiv: function (n) { return fmtNum(n) + (n === 1 ? ' custom typeface' : ' custom typefaces'); } },
    dict_searches: { icon: '🔍', label: 'Dictionary searches',   equiv: function (n) { return fmtNum(n) + ' word lookups'; } },
    audio_plays:   { icon: '🔊', label: 'Words heard aloud',     equiv: function (n) { return fmtNum(n) + ' pronunciations'; } }
  };

  function displayFor(key) {
    return EVENT_DISPLAY[key] || { icon: '⭐', label: titleCase(key), equiv: function () { return ''; } };
  }

  /* ── Milestones ───────────────────────────────────────────────────────────
     Returns the power-of-10 a total just crossed (within the last 10% above the
     boundary), or null. Used to show a single celebratory banner. */
  function milestoneFor(total) {
    if (total < 1000) return null;
    var mag = Math.pow(10, Math.floor(Math.log10(total)));
    return (total < mag * 1.1) ? mag : null;
  }

  /* ── Countries ────────────────────────────────────────────────────────────*/
  function flagEmoji(code) {
    if (!code || code === '??' || !/^[A-Za-z]{2}$/.test(code)) return '🌐'; // 🌐
    code = code.toUpperCase();
    return String.fromCodePoint(
      0x1F1E6 + code.charCodeAt(0) - 65,
      0x1F1E6 + code.charCodeAt(1) - 65
    );
  }

  var _dn = null;
  try { _dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { _dn = null; }
  function countryName(code) {
    if (!code || code === '??') return 'Unknown';
    try { return (_dn && _dn.of(code)) || code; } catch (e) { return code; }
  }

  /* ── Inline-SVG line chart ────────────────────────────────────────────────
     series: [{day:'YYYY-MM-DD', n}] ascending. opts: {days, color, label, w, h}.
     7-day trailing smoothing; worded axes; CSS-var strokes so dark mode recolors
     automatically (never var(--white) for strokes — it's a dark surface). */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function shortDate(key) {
    var p = key.split('-');
    return MON[(+p[1]) - 1] + ' ' + (+p[2]);
  }

  function sparkline(series, opts) {
    opts = opts || {};
    var days = opts.days || 90;
    var W = opts.w || 520, H = opts.h || 120;
    var padL = 8, padR = 8, padT = 16, padB = 22;
    var innerW = W - padL - padR, innerH = H - padT - padB;

    var map = {};
    (series || []).forEach(function (p) { map[p.day] = (map[p.day] || 0) + p.n; });

    var pts = [];
    var today = new Date();
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
      var key = d.toISOString().slice(0, 10);
      pts.push({ day: key, n: map[key] || 0 });
    }

    var smooth = pts.map(function (_, i) {
      var a = Math.max(0, i - 6), sum = 0, c = 0;
      for (var j = a; j <= i; j++) { sum += pts[j].n; c++; }
      return sum / c;
    });

    var max = Math.max.apply(null, smooth.concat([1]));
    var N = smooth.length;
    function X(i) { return padL + (N <= 1 ? 0 : innerW * i / (N - 1)); }
    function Y(v) { return padT + innerH - (v / max) * innerH; }

    var line = smooth.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
    var baseY = (padT + innerH).toFixed(1);
    var color = opts.color || 'var(--gold)';
    var hasData = pts.some(function (p) { return p.n > 0; });

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" ' +
      'role="img" aria-label="' + esc(opts.label || 'usage') + ' over the last ' + days + ' days">';
    svg += '<line x1="' + padL + '" y1="' + baseY + '" x2="' + (W - padR) + '" y2="' + baseY +
      '" stroke="var(--border)" stroke-width="1"/>';
    if (hasData) {
      svg += '<polyline points="' + line + '" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      svg += '<text x="' + padL + '" y="' + (padT - 5) + '" font-size="9" fill="var(--muted)">peak ≈ ' +
        fmtNum(max) + '/day</text>';
    } else {
      svg += '<text x="' + (W / 2) + '" y="' + (padT + innerH / 2) +
        '" font-size="11" fill="var(--muted)" text-anchor="middle">No activity yet</text>';
    }
    svg += '<text x="' + padL + '" y="' + (H - 6) + '" font-size="9" fill="var(--muted)">' + shortDate(pts[0].day) + '</text>';
    svg += '<text x="' + (W - padR) + '" y="' + (H - 6) + '" font-size="9" fill="var(--muted)" text-anchor="end">today</text>';
    svg += '</svg>';
    return svg;
  }

  /* ── Community totals ─────────────────────────────────────────────────────*/
  function renderTotals(el, stats) {
    stats = stats || {};
    var totals = stats.totals || {};
    // Configured events first (in display order), then any extra events the
    // server reports that we don't have a config for (generic fallback).
    var keys = Object.keys(EVENT_DISPLAY).concat(
      Object.keys(totals).filter(function (k) { return !EVENT_DISPLAY[k]; })
    );

    var html = '';

    // Single highest "freshly crossed" milestone across all events.
    var best = null;
    keys.forEach(function (k) {
      var m = milestoneFor(totals[k] || 0);
      if (m && (!best || m > best.mag)) best = { mag: m, key: k };
    });
    if (best) {
      html += '<div class="imp-milestone">🎉 Just crossed ' + fmtNum(best.mag) + ' ' +
        esc(displayFor(best.key).label.toLowerCase()) + '!</div>';
    }

    html += '<div class="imp-grid">';
    keys.forEach(function (k) {
      var d = displayFor(k);
      var t = totals[k] || 0;
      var eq = (t > 0 && d.equiv) ? d.equiv(t) : '';
      html += '<div class="imp-card">' +
        '<div class="imp-ico">' + d.icon + '</div>' +
        '<div class="imp-num">' + fmtNum(t) + '</div>' +
        '<div class="imp-lab">' + esc(d.label) + '</div>' +
        (eq ? '<div class="imp-eq">' + esc(eq) + '</div>'
            : (t === 0 ? '<div class="imp-eq imp-muted">counting…</div>' : '')) +
        '</div>';
    });
    html += '</div>';

    var countries = (stats.countries || []).slice();
    var known = countries.filter(function (c) { return c.code !== '??'; });
    var n = known.length;
    html += '<details class="imp-countries">';
    html += '<summary>🌍 Used in ' + n + ' ' + (n === 1 ? 'country' : 'countries') + '</summary>';
    html += '<div class="imp-clist">';
    if (!countries.length) {
      html += '<div class="imp-muted" style="padding:4px 0;">No location data yet.</div>';
    } else {
      countries.forEach(function (c) {
        html += '<div class="imp-crow">' +
          '<span class="imp-flag">' + flagEmoji(c.code) + '</span>' +
          '<span class="imp-cname">' + esc(countryName(c.code)) + '</span>' +
          '<span class="imp-ctot">' + fmtNum(c.total) + '</span></div>';
      });
    }
    html += '</div></details>';

    el.innerHTML = html;
  }

  /* ── Growth charts ────────────────────────────────────────────────────────*/
  function renderGrowth(el, stats, range) {
    stats = stats || {};
    range = range || 90;
    var daily = stats.daily || {};
    var keys = Object.keys(EVENT_DISPLAY).filter(function (k) { return daily[k] && daily[k].length; })
      .concat(Object.keys(daily).filter(function (k) { return !EVENT_DISPLAY[k] && daily[k] && daily[k].length; }));

    var html = '<div class="imp-range">';
    [[30, '30 days'], [90, '90 days'], [365, '1 year']].forEach(function (r) {
      html += '<button type="button" class="imp-range-btn' + (r[0] === range ? ' active' : '') +
        '" data-range="' + r[0] + '">' + r[1] + '</button>';
    });
    html += '</div>';

    if (!keys.length) {
      html += '<div class="imp-muted" style="text-align:center;padding:24px 0;">No activity yet — charts will appear as the tools get used.</div>';
      el.innerHTML = html;
    } else {
      html += '<div class="imp-charts">';
      keys.forEach(function (k) {
        var d = displayFor(k);
        html += '<div class="imp-chart">' +
          '<div class="imp-chart-h">' + d.icon + ' ' + esc(d.label) + '</div>' +
          sparkline(daily[k] || [], { days: range, label: d.label, color: 'var(--gold)' }) +
          '</div>';
      });
      html += '</div>';
      html += '<div class="imp-axisnote">Each line shows daily activity, smoothed over 7 days.</div>';
      el.innerHTML = html;
    }

    el.querySelectorAll('.imp-range-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { renderGrowth(el, stats, +btn.dataset.range); });
    });
  }

  /* ── Shared CSS (injected once; uses the site's CSS variables) ─────────────*/
  function injectCSS() {
    if (document.getElementById('imp-ui-css')) return;
    var css =
      '.imp-milestone{background:var(--gold);color:var(--navy);font-weight:700;text-align:center;padding:8px 12px;border-radius:8px;margin-bottom:12px;font-size:0.9rem;}' +
      '.imp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;}' +
      '.imp-card{background:var(--cream);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;}' +
      '.imp-ico{font-size:1.6rem;line-height:1;}' +
      ".imp-num{font-size:1.5rem;font-weight:700;color:var(--gold);margin-top:4px;font-family:'Libre Baskerville',serif;}" +
      '.imp-lab{font-size:0.8rem;color:var(--text);margin-top:2px;}' +
      '.imp-eq{font-size:0.7rem;color:var(--muted);margin-top:3px;}' +
      '.imp-muted{color:var(--muted);}' +
      '.imp-countries{margin-top:14px;border-top:1px solid var(--border);padding-top:10px;}' +
      '.imp-countries summary{cursor:pointer;font-weight:600;font-size:0.9rem;color:var(--text);}' +
      '.imp-clist{margin-top:8px;display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto;}' +
      '.imp-crow{display:flex;align-items:center;gap:8px;font-size:0.82rem;}' +
      '.imp-flag{font-size:1.1rem;width:1.5em;text-align:center;flex-shrink:0;}' +
      '.imp-cname{flex:1;color:var(--text);}' +
      '.imp-ctot{color:var(--muted);font-variant-numeric:tabular-nums;}' +
      '.imp-range{display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden;width:max-content;margin-bottom:14px;}' +
      '.imp-range-btn{padding:5px 12px;background:var(--white);color:var(--text);border:none;border-right:1px solid var(--border);font-size:0.76rem;font-family:inherit;cursor:pointer;}' +
      '.imp-range-btn:last-child{border-right:none;}' +
      '.imp-range-btn.active{background:var(--navy);color:#fff;}' +
      '.imp-charts{display:flex;flex-direction:column;gap:18px;}' +
      '.imp-chart-h{font-size:0.82rem;font-weight:600;color:var(--text);margin-bottom:4px;}' +
      '.imp-axisnote{font-size:0.72rem;color:var(--muted);margin-top:12px;text-align:center;}';
    var s = document.createElement('style');
    s.id = 'imp-ui-css';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }
  injectCSS();

  window.IvritImpactUI = {
    EVENT_DISPLAY: EVENT_DISPLAY,
    fmtNum: fmtNum,
    milestoneFor: milestoneFor,
    flagEmoji: flagEmoji,
    countryName: countryName,
    sparkline: sparkline,
    renderTotals: renderTotals,
    renderGrowth: renderGrowth
  };
})();
