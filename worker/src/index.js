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
const GA_TTL = 1800;          // /ga edge-cache seconds (30 minutes)
const GA_START_DATE = '2020-01-01'; // lifetime-totals floor for GA reports (tunable)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return preflight();
    if (request.method === 'POST' && url.pathname === '/event') return handleEvent(request, env);
    if (request.method === 'GET' && url.pathname === '/stats') return handleStats(request, env, ctx);
    if (request.method === 'GET' && url.pathname === '/ga') return handleGa(request, env, ctx);
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

/* ── GET /ga — Google Analytics traffic, proxied via the GA4 Data API ────────
   Reads page views / visitors / sessions / a daily trend / top pages from the
   GA4 property using a service account (stored as the GA_SERVICE_ACCOUNT secret),
   never exposing the credential to the browser. Any failure (including "not yet
   configured") returns {error:'unavailable'} so the front-end simply hides the
   GA section — it never affects /event or /stats. */
function b64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemToDer(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

let _gaToken = null; // { token, exp } cached per isolate

async function getGaToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (_gaToken && _gaToken.exp - 60 > now) return _gaToken.token;

  const sa = JSON.parse(env.GA_SERVICE_ACCOUNT);
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })));
  const signingInput = header + '.' + claims;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
  const jwt = signingInput + '.' + b64url(new Uint8Array(sig));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt)
  });
  if (!res.ok) throw new Error('token ' + res.status);
  const json = await res.json();
  _gaToken = { token: json.access_token, exp: now + (json.expires_in || 3600) };
  return _gaToken.token;
}

function gaUnavailable() {
  return new Response(JSON.stringify({ error: 'unavailable' }), {
    status: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
  });
}

async function handleGa(request, env, ctx) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  let payload;
  try {
    if (!env.GA_SERVICE_ACCOUNT || !env.GA_PROPERTY_ID) throw new Error('not configured');
    const token = await getGaToken(env);
    const today = new Date().toISOString().slice(0, 10);
    const body = {
      requests: [
        { dateRanges: [{ startDate: GA_START_DATE, endDate: today }],
          metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'sessions' }] },
        { dateRanges: [{ startDate: '365daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }] },
        { dateRanges: [{ startDate: GA_START_DATE, endDate: today }],
          dimensions: [{ name: 'pageTitle' }], metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 10 }
      ]
    };
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${env.GA_PROPERTY_ID}:batchRunReports`,
      { method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body) }
    );
    if (!res.ok) throw new Error('ga ' + res.status);
    const data = await res.json();
    const reports = data.reports || [];
    const tot = reports[0] && reports[0].rows && reports[0].rows[0];
    payload = {
      totals: {
        pageviews: tot ? +tot.metricValues[0].value : 0,
        users:     tot ? +tot.metricValues[1].value : 0,
        sessions:  tot ? +tot.metricValues[2].value : 0
      },
      daily: ((reports[1] && reports[1].rows) || []).map(r => ({
        day: r.dimensionValues[0].value.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
        pageviews: +r.metricValues[0].value
      })),
      topPages: ((reports[2] && reports[2].rows) || []).map(r => ({
        title: r.dimensionValues[0].value,
        views: +r.metricValues[0].value
      })),
      generated_at: new Date().toISOString()
    };
  } catch (e) {
    return gaUnavailable();
  }

  const res = new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${GA_TTL}` }
  });
  ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}
