/*
 * IvritSuite — anonymous, privacy-first usage metrics.
 *
 * Counts events, NEVER people. The only things stored are: the event name, the
 * UTC day, a 2-letter country code (Cloudflare's CF-IPCountry header — never the
 * IP itself), and a running count. No cookies, no identifiers, no IP, no
 * user-agent. The IP is read only for best-effort rate limiting and is never
 * persisted.
 *
 * Endpoints:
 *   POST /event  { event, n }  -> 204   (upsert one daily count)
 *   GET  /stats                -> JSON  (all-time totals, daily series, countries)
 *
 * The browser sends beacons as text/plain (a CORS "simple request") so they fire
 * during page unload with no preflight; we parse the body as text regardless of
 * Content-Type.
 */

const ALLOWED_ORIGIN = 'https://ivritsuite.com';

// Events the client may report. crosswords + tefillot are upcoming tools —
// allow-listed now so they can start counting without redeploying this Worker.
const ALLOWLIST = [
  'worksheets', 'cards', 'torah_words', 'fonts',
  'dict_searches', 'audio_plays', 'crosswords', 'tefillot'
];

// Per-event sanity cap: the most a single beacon may add. Values above the cap
// are CLAMPED (not rejected) so a legitimately batched beacon isn't dropped.
// Allow-listed events without an explicit cap fall back to DEFAULT_CAP, so new
// events work without a redeploy.
const CAPS = {
  worksheets: 10, cards: 200, torah_words: 600,
  fonts: 3, dict_searches: 50, audio_plays: 100
};
const DEFAULT_CAP = 100;

const STATS_TTL = 300; // /stats edge-cache seconds (5 minutes)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return preflight();
    if (request.method === 'POST' && url.pathname === '/event') return handleEvent(request, env);
    if (request.method === 'GET' && url.pathname === '/stats') return handleStats(request, env, ctx);
    return new Response(null, { status: 404, headers: corsHeaders() });
  }
};

/* ── CORS ──────────────────────────────────────────────────────────────────
   We allow exactly one origin. NOTE: the Origin header (like CF-IPCountry) is
   client-influenced and spoofable outside a real browser — we accept that. This
   is non-authoritative vanity telemetry, not security data; the WAF rate-limit
   rule (see README) is the real abuse backstop. */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Vary': 'Origin'
  };
}

function preflight() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(),
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function bad() {
  return new Response(null, { status: 400, headers: corsHeaders() });
}

/* ── Rate limit ────────────────────────────────────────────────────────────
   Per-isolate, in-memory token bucket (~30 req/min/IP). BEST-EFFORT ONLY: an
   isolate is short-lived and Cloudflare runs many of them, so this trims the
   most obvious bursts but is not a real limiter. Add a Cloudflare WAF
   rate-limit rule on api.ivritsuite.com (see README) for actual protection.
   The IP is used for bucketing only and is never stored. */
const BUCKETS = new Map();
const RATE = 30;         // tokens per window
const WINDOW_MS = 60000; // 1 minute

function rateOk(ip) {
  const now = Date.now();
  let b = BUCKETS.get(ip);
  if (!b) { b = { tokens: RATE, ts: now }; BUCKETS.set(ip, b); }
  b.tokens = Math.min(RATE, b.tokens + (now - b.ts) * RATE / WINDOW_MS);
  b.ts = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

/* ── POST /event ───────────────────────────────────────────────────────────*/
async function handleEvent(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  if (!rateOk(ip)) return new Response(null, { status: 429, headers: corsHeaders() });

  // Content-Type agnostic: beacons arrive as text/plain to avoid a preflight.
  let body;
  try { body = JSON.parse(await request.text()); }
  catch { return bad(); }

  const event = body && body.event;
  let n = body && body.n;
  if (!ALLOWLIST.includes(event)) return bad();
  if (!Number.isInteger(n) || n < 1) return bad();

  const cap = CAPS[event] ?? DEFAULT_CAP;
  if (n > cap) n = cap; // clamp rather than reject — beacons legitimately batch

  const day = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
  let country = (request.headers.get('CF-IPCountry') || '??').toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) country = '??';    // 'XX', 'T1' (Tor), null → '??'

  try {
    await env.DB.prepare(
      `INSERT INTO daily_counts (day, event, country, n) VALUES (?, ?, ?, ?)
       ON CONFLICT(day, event, country) DO UPDATE SET n = n + excluded.n`
    ).bind(day, event, country, n).run();
  } catch {
    // Swallow DB hiccups — telemetry must never surface an error to the client.
  }

  return new Response(null, { status: 204, headers: corsHeaders() });
}

/* ── GET /stats ────────────────────────────────────────────────────────────
   All-time totals per event, the last 366 days of daily totals per event
   (country collapsed), and an all-time per-country breakdown. Edge-cached for
   5 minutes via caches.default + Cache-Control so dashboard traffic is ~free. */
async function handleStats(request, env, ctx) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const since = new Date(Date.now() - 366 * 86400000).toISOString().slice(0, 10);

  const [totals, daily, countries] = await Promise.all([
    env.DB.prepare(
      `SELECT event, SUM(n) AS total FROM daily_counts GROUP BY event`).all(),
    env.DB.prepare(
      `SELECT day, event, SUM(n) AS n FROM daily_counts
       WHERE day >= ? GROUP BY day, event ORDER BY day ASC`).bind(since).all(),
    env.DB.prepare(
      `SELECT country AS code, SUM(n) AS total FROM daily_counts
       GROUP BY country ORDER BY total DESC`).all()
  ]);

  // Pivot the flat daily rows into { event: [{day, n}, ...] } so the client
  // charts don't have to group. Country is already collapsed by the SUM.
  const dailyByEvent = {};
  for (const r of daily.results) {
    (dailyByEvent[r.event] || (dailyByEvent[r.event] = [])).push({ day: r.day, n: r.n });
  }

  const payload = {
    totals: Object.fromEntries(totals.results.map(r => [r.event, r.total])),
    daily: dailyByEvent,
    countries: countries.results.map(r => ({ code: r.code, total: r.total })),
    generated_at: new Date().toISOString()
  };

  const res = new Response(JSON.stringify(payload), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${STATS_TTL}`
    }
  });
  ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}
