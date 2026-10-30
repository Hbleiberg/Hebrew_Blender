/*
 * IvritSuite — the audio Worker for Torah Trainer reading assignments.
 *
 * One Cloudflare Worker in front of one private R2 bucket. The browser never talks to the bucket: every byte
 * goes through here, and every request is answered only after two questions — "whose token is this?"
 * (verified against the Supabase project's public signing key, ES256) and "may this person touch this
 * recording?" — the second asked of Supabase AS THAT PERSON, so Row Level Security (db/migrations/0008) decides.
 * The Worker holds no key that could read another person's rows, except in the daily reconcile (`scheduled`,
 * at the bottom), the one place the project's secret key is used, for four narrow housekeeping queries.
 *
 * Endpoints (all need `Authorization: Bearer <Supabase access token>`; CORS for the site's origins only):
 *   PUT  /upload/{submission_id}?duration=<seconds>   the recording's bytes (Content-Type one of ALLOWED_TYPES,
 *        Content-Length required and capped) — the row must be the caller's, pending, with its assignment
 *        open; the bytes land under the key the DATABASE chose for the row, never one the client names; then
 *        the row is marked uploaded as the caller, with the true size.
 *   GET  /audio/{submission_id}                       the bytes back — the caller is the student, the teacher,
 *        or a classmate the teacher allowed (RLS says which; the Worker only asks).
 *   POST /delete  {"submission_id": "..."}            teacher only: the object, then the row (as the teacher).
 *   GET  /health                                      "ok" with no auth, for the README's first check.
 *
 * Errors are one word of JSON and never a stack trace: unauthorized (401), forbidden (403), not_found (404 —
 * also "not yours", on purpose), method_not_allowed (405), not_accepted (409), length_required (411),
 * too_large (413), unsupported_type (415), rate_limited (429), error (500).
 *
 * Settings come from wrangler.toml ([vars]) and `wrangler secret put` — see README.md. Nothing is hardcoded
 * but the defaults below, which are safe to publish.
 */

const ALLOWED_TYPES = new Set(['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']);
const HARD_MAX_BYTES = 16 * 1024 * 1024;          // never more than this, whatever an assignment says
const BYTES_PER_SECOND = 4000;                    // 32 kbps mono Opus/AAC, what the page records at
const JWKS_TTL_MS = 10 * 60 * 1000;               // how long a fetched signing key is trusted before a re-fetch
const JWKS_RETRY_MS = 60 * 1000;                  // an unknown key id re-fetches at most this often
const STALE_PENDING_MS = 60 * 60 * 1000;          // a pending row older than this is reconciled
const ATTEMPT_LOG_MS = 24 * 60 * 60 * 1000;       // code-word attempts older than this are pruned
const RECONCILE_MAX_OBJECTS = 1000;               // per run; the rest waits for tomorrow
const CHUNK = 200;                                // ids per PostgREST call in the reconcile

// ─────────────────────────────────────────── helpers ───────────────────────────────────────────

function json(status, body, extra) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(extra || {}) } });
}
const fail = (status, code, extra) => json(status, { error: code }, extra);

function origins(env) {
  return String(env.ALLOWED_ORIGINS || 'https://ivritsuite.com,https://www.ivritsuite.com').split(',').map(s => s.trim()).filter(Boolean);
}
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const h = {
    'access-control-allow-methods': 'GET, PUT, POST, OPTIONS',
    'access-control-allow-headers': request.headers.get('Access-Control-Request-Headers') || 'authorization, content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin',
  };
  if (origins(env).includes(origin)) h['access-control-allow-origin'] = origin;
  return h;
}
function withCors(res, request, env) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, env))) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlJson(s) { return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))); }

// ─────────────────────────────────────────── JWT ───────────────────────────────────────────
// Supabase signs access tokens with an ES256 key whose public half is published at
// <project>/auth/v1/.well-known/jwks.json. Only that algorithm is accepted: a verifier picked by the token's
// own header would be the classic algorithm-confusion bug, and this project is on ES256.

const jwks = { keys: new Map(), fetchedAt: 0, lastMissAt: 0 };   // kid → CryptoKey (per isolate)

async function fetchJwks(env) {
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('jwks ' + r.status);
  const body = await r.json();
  const next = new Map();
  for (const k of body.keys || []) {
    if (k.kty !== 'EC' || k.crv !== 'P-256' || !k.kid) continue;
    if (k.alg && k.alg !== 'ES256') continue;
    const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: k.x, y: k.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    next.set(k.kid, key);
  }
  jwks.keys = next;
  jwks.fetchedAt = Date.now();
}

async function keyFor(kid, env) {
  const now = Date.now();
  if (!jwks.fetchedAt || now - jwks.fetchedAt > JWKS_TTL_MS) await fetchJwks(env);
  if (jwks.keys.has(kid)) return jwks.keys.get(kid);
  // An unknown key id: the project may have rotated. Re-fetch, but not on every junk token.
  if (now - jwks.lastMissAt > JWKS_RETRY_MS) { jwks.lastMissAt = now; await fetchJwks(env); }
  return jwks.keys.get(kid) || null;
}

/** Returns { sub, role: 'student'|'teacher', token } or null. Every check that fails is a null, never a throw. */
export async function verifyToken(token, env) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = b64urlJson(parts[0]);
    if (header.alg !== 'ES256' || typeof header.kid !== 'string') return null;
    const key = await keyFor(header.kid, env);
    if (!key) return null;
    const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64urlToBytes(parts[2]), data);
    if (!ok) return null;
    const c = b64urlJson(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    if (typeof c.exp !== 'number' || c.exp + 60 < now) return null;
    if (typeof c.iat === 'number' && c.iat > now + 60) return null;
    if (typeof c.nbf === 'number' && c.nbf > now + 60) return null;
    if (c.iss !== `${env.SUPABASE_URL}/auth/v1`) return null;
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!aud.includes('authenticated')) return null;
    if (c.role !== 'authenticated') return null;
    if (c.is_anonymous === true) return null;
    if (typeof c.sub !== 'string' || !/^[0-9a-f-]{36}$/i.test(c.sub)) return null;
    const role = c.app_metadata && c.app_metadata.role === 'student' ? 'student' : 'teacher';
    return { sub: c.sub, role, token };
  } catch (e) {
    return null;
  }
}

// ─────────────────────────────────────────── PostgREST, as the caller ───────────────────────────────────────────

async function rest(env, token, method, pathAndQuery, body, prefer) {
  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    authorization: 'Bearer ' + token,
    accept: 'application/json',
  };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (prefer) headers.prefer = prefer;
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${pathAndQuery}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = null;
  const text = await r.text();
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  return { status: r.status, data };
}

const SUBMISSION_COLS = 'id,student_id,assignment_id,r2_key,mime_type,upload_status,status,is_current,duration_seconds,assignments(teacher_id,is_open,max_minutes)';

/** The one row, as the caller sees it, or null (which covers "no such row" and "not yours" alike). */
async function readSubmission(env, token, id) {
  const r = await rest(env, token, 'GET', `submissions?id=eq.${encodeURIComponent(id)}&select=${SUBMISSION_COLS}`);
  if (r.status === 401) return { unauthorized: true };
  if (r.status !== 200 || !Array.isArray(r.data) || r.data.length !== 1) return { row: null };
  return { row: r.data[0] };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────── rate limiting ───────────────────────────────────────────
// The Workers Rate Limiting binding when wrangler.toml declares it; a per-isolate map otherwise (local dev).
// Abuse damping, not a security boundary: the database's policies are that.

const localBuckets = new Map();
async function limited(binding, key, limit, periodSec) {
  if (binding && typeof binding.limit === 'function') {
    try { const r = await binding.limit({ key }); return !r.success; } catch (e) { return false; }
  }
  const now = Date.now();
  const b = localBuckets.get(key) || { n: 0, reset: now + periodSec * 1000 };
  if (now > b.reset) { b.n = 0; b.reset = now + periodSec * 1000; }
  b.n++;
  localBuckets.set(key, b);
  return b.n > limit;
}

// ─────────────────────────────────────────── handlers ───────────────────────────────────────────

function bearer(request) {
  const a = request.headers.get('Authorization') || '';
  return a.startsWith('Bearer ') ? a.slice(7).trim() : '';
}

async function handleUpload(request, env, id, who) {
  if (await limited(env.RL_UPLOAD, 'u:' + who.sub, 20, 60)) return fail(429, 'rate_limited');
  const type = (request.headers.get('Content-Type') || '').toLowerCase().replace(/\s+/g, '');
  if (!ALLOWED_TYPES.has(type)) return fail(415, 'unsupported_type');
  const lenHeader = request.headers.get('Content-Length');
  const length = lenHeader === null ? NaN : Number(lenHeader);
  if (!Number.isInteger(length) || length < 0) return fail(411, 'length_required');
  if (length === 0) return fail(400, 'empty');
  if (length > HARD_MAX_BYTES) return fail(413, 'too_large');

  const got = await readSubmission(env, who.token, id);
  if (got.unauthorized) return fail(401, 'unauthorized');
  const row = got.row;
  if (!row) return fail(404, 'not_found');
  if (row.student_id !== who.sub || who.role !== 'student') return fail(403, 'forbidden');
  if (row.upload_status !== 'pending' || row.status !== 'submitted') return fail(409, 'not_accepted');
  const a = row.assignments || {};
  if (!a.is_open) return fail(409, 'closed');
  const rowType = String(row.mime_type || '').toLowerCase().replace(/\s+/g, '');
  if (rowType !== type) return fail(415, 'unsupported_type');
  const cap = Math.min(HARD_MAX_BYTES, Math.floor((a.max_minutes || 10) * 60 * BYTES_PER_SECOND * 1.5) + 1024 * 1024);
  if (length > cap) return fail(413, 'too_large');
  if (!row.r2_key || !row.r2_key.startsWith('submissions/')) return fail(500, 'error');

  const url = new URL(request.url);
  const duration = Math.max(0, Math.min(1800, Math.floor(Number(url.searchParams.get('duration')) || 0)));

  // The body must be exactly Content-Length bytes: R2 needs a known length, and FixedLengthStream refuses a
  // body that is shorter or longer, which aborts the put with nothing stored. That is the cap, enforced.
  let stored;
  try {
    const fixed = new FixedLengthStream(length);
    const piped = request.body.pipeThrough(fixed);
    stored = await env.RECORDINGS.put(row.r2_key, piped, { httpMetadata: { contentType: row.mime_type } });
  } catch (e) {
    console.error('upload: put failed', id, String(e && e.message || e));
    return fail(413, 'too_large');
  }
  if (!stored || stored.size !== length) {
    try { await env.RECORDINGS.delete(row.r2_key); } catch (e) {}
    return fail(413, 'too_large');
  }

  // Mark the row uploaded AS THE STUDENT — the guard trigger allows exactly this move, once.
  const patch = await rest(env, who.token, 'PATCH', `submissions?id=eq.${encodeURIComponent(id)}`,
    { upload_status: 'uploaded', size_bytes: stored.size, duration_seconds: duration }, 'return=representation');
  if (patch.status < 200 || patch.status >= 300 || !Array.isArray(patch.data) || patch.data.length !== 1) {
    // The assignment closed, or the teacher acted, between the read and the write: keep nothing.
    try { await env.RECORDINGS.delete(row.r2_key); } catch (e) {}
    return fail(409, 'not_accepted');
  }
  const out = patch.data[0];
  return json(200, { ok: true, id: out.id, size_bytes: out.size_bytes, duration_seconds: out.duration_seconds, upload_status: out.upload_status });
}

async function handleAudio(request, env, id, who) {
  if (await limited(env.RL_AUDIO, 'a:' + who.sub, 120, 60)) return fail(429, 'rate_limited');
  const got = await readSubmission(env, who.token, id);
  if (got.unauthorized) return fail(401, 'unauthorized');
  const row = got.row;
  if (!row || row.upload_status !== 'uploaded') return fail(404, 'not_found');
  const obj = await env.RECORDINGS.get(row.r2_key);
  if (!obj) return fail(404, 'missing');   // the row says uploaded, the bucket disagrees: the UI's "recording missing"
  const headers = {
    'content-type': row.mime_type,
    'content-length': String(obj.size),
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff',
  };
  if (obj.httpEtag) headers.etag = obj.httpEtag;
  return new Response(obj.body, { status: 200, headers });
}

async function handleDelete(request, env, who) {
  if (await limited(env.RL_DELETE, 'd:' + who.sub, 30, 60)) return fail(429, 'rate_limited');
  let body = null;
  try { body = await request.json(); } catch (e) { return fail(400, 'bad_request'); }
  const id = body && typeof body.submission_id === 'string' ? body.submission_id : '';
  if (!UUID_RE.test(id)) return fail(400, 'bad_request');
  const got = await readSubmission(env, who.token, id);
  if (got.unauthorized) return fail(401, 'unauthorized');
  const row = got.row;
  if (!row) return fail(404, 'not_found');
  const a = row.assignments || {};
  if (who.role !== 'teacher' || a.teacher_id !== who.sub) return fail(403, 'forbidden');
  // The object first: a failure between the two leaves a row whose audio is gone (visible, re-deletable),
  // never an object that nothing points at.
  try { await env.RECORDINGS.delete(row.r2_key); } catch (e) { console.error('delete: object', id, String(e && e.message || e)); return fail(500, 'error'); }
  const del = await rest(env, who.token, 'DELETE', `submissions?id=eq.${encodeURIComponent(id)}`, undefined, 'return=representation');
  if (del.status < 200 || del.status >= 300 || !Array.isArray(del.data) || del.data.length !== 1) return fail(409, 'not_accepted');
  return json(200, { ok: true, id });
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (path === '/health' && request.method === 'GET') return new Response('ok', { headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

  const token = bearer(request);
  if (!token) return fail(401, 'unauthorized');
  const who = await verifyToken(token, env);
  if (!who) return fail(401, 'unauthorized');

  let m;
  if ((m = path.match(/^\/upload\/([^/]+)$/))) {
    if (request.method !== 'PUT') return fail(405, 'method_not_allowed');
    if (!UUID_RE.test(m[1])) return fail(404, 'not_found');
    return handleUpload(request, env, m[1].toLowerCase(), who);
  }
  if ((m = path.match(/^\/audio\/([^/]+)$/))) {
    if (request.method !== 'GET') return fail(405, 'method_not_allowed');
    if (!UUID_RE.test(m[1])) return fail(404, 'not_found');
    return handleAudio(request, env, m[1].toLowerCase(), who);
  }
  if (path === '/delete') {
    if (request.method !== 'POST') return fail(405, 'method_not_allowed');
    return handleDelete(request, env, who);
  }
  return fail(404, 'not_found');
}

// ─────────────────────────────────────────── the daily reconcile ───────────────────────────────────────────
// Runs on the cron in wrangler.toml with the project's SECRET key (a Worker secret, never in a page), and does
// exactly four things, batched to fit the free plan's budget of external calls per run:
//   1. rows still `pending` after an hour: object present → mark uploaded (the student's work survives a crash
//      after the PUT); absent → the row goes.
//   2. objects under submissions/ that no row names (a deleted student, assignment or teacher) → the objects go.
//   3. rows whose assignment has been closed longer than its retention period → the objects, then the rows.
//   4. code-word attempts older than a day → pruned.

function serviceRest(env, method, pathAndQuery, body, prefer) {
  return rest({ SUPABASE_URL: env.SUPABASE_URL, SUPABASE_ANON_KEY: env.SUPABASE_SERVICE_ROLE_KEY }, env.SUPABASE_SERVICE_ROLE_KEY, method, pathAndQuery, body, prefer);
}
function inList(ids) { return 'in.(' + ids.map(encodeURIComponent).join(',') + ')'; }

export async function reconcile(env, log = console.log) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) { log('reconcile: SUPABASE_SERVICE_ROLE_KEY is not set; nothing done'); return { skipped: true }; }
  const report = { stale_fixed: 0, stale_dropped: 0, orphans_deleted: 0, expired_deleted: 0, attempts_pruned: true, errors: [] };
  const err = (where, e) => { const m = where + ': ' + String(e && e.message || e); report.errors.push(m); console.error('reconcile', m); };

  // 1. stale pending rows
  try {
    const since = new Date(Date.now() - STALE_PENDING_MS).toISOString();
    const r = await serviceRest(env, 'GET', `submissions?select=id,r2_key&upload_status=eq.pending&created_at=lt.${encodeURIComponent(since)}&limit=500`);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('listing ' + r.status);
    const drop = [];
    for (const row of r.data) {
      const head = await env.RECORDINGS.head(row.r2_key);
      if (head) {
        if (report.stale_fixed < 20) {   // rare, and one call each: a small cap keeps the run inside its budget
          const p = await serviceRest(env, 'PATCH', `submissions?id=eq.${encodeURIComponent(row.id)}&upload_status=eq.pending`, { upload_status: 'uploaded', size_bytes: head.size }, 'return=minimal');
          if (p.status >= 200 && p.status < 300) report.stale_fixed++;
        }
      } else drop.push(row.id);
    }
    for (let i = 0; i < drop.length; i += CHUNK) {
      const ids = drop.slice(i, i + CHUNK);
      const d = await serviceRest(env, 'DELETE', `submissions?id=${inList(ids)}&upload_status=eq.pending`, undefined, 'return=minimal');
      if (d.status >= 200 && d.status < 300) report.stale_dropped += ids.length;
    }
  } catch (e) { err('stale', e); }

  // 2. objects with no row
  try {
    const keys = [];
    let cursor;
    do {
      const page = await env.RECORDINGS.list({ prefix: 'submissions/', cursor, limit: 1000 });
      for (const o of page.objects) keys.push(o.key);
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor && keys.length < RECONCILE_MAX_OBJECTS);
    if (keys.length) {
      const known = new Set();
      for (let offset = 0; ; offset += 1000) {
        const r = await serviceRest(env, 'GET', `submissions?select=r2_key&order=r2_key&limit=1000&offset=${offset}`);
        if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('keys ' + r.status);
        for (const row of r.data) known.add(row.r2_key);
        if (r.data.length < 1000) break;
      }
      const orphans = keys.filter(k => !known.has(k));
      for (let i = 0; i < orphans.length; i += 1000) await env.RECORDINGS.delete(orphans.slice(i, i + 1000));
      report.orphans_deleted = orphans.length;
    }
  } catch (e) { err('orphans', e); }

  // 3. retention
  try {
    const r = await serviceRest(env, 'GET', 'rpc/retention_due');
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('retention_due ' + r.status);
    const rows = r.data.filter(x => x && typeof x.id === 'string');
    const keys = rows.map(x => x.r2_key).filter(k => typeof k === 'string' && k.startsWith('submissions/'));
    for (let i = 0; i < keys.length; i += 1000) await env.RECORDINGS.delete(keys.slice(i, i + 1000));
    for (let i = 0; i < rows.length; i += CHUNK) {
      const ids = rows.slice(i, i + CHUNK).map(x => x.id);
      const d = await serviceRest(env, 'DELETE', `submissions?id=${inList(ids)}`, undefined, 'return=minimal');
      if (d.status >= 200 && d.status < 300) report.expired_deleted += ids.length;
    }
  } catch (e) { err('retention', e); }

  // 4. the attempt log
  try {
    const before = new Date(Date.now() - ATTEMPT_LOG_MS).toISOString();
    const d = await serviceRest(env, 'DELETE', `code_attempts?attempted_at=lt.${encodeURIComponent(before)}`, undefined, 'return=minimal');
    report.attempts_pruned = d.status >= 200 && d.status < 300;
  } catch (e) { err('attempts', e); }

  log('reconcile ' + JSON.stringify(report));
  return report;
}

export default {
  async fetch(request, env, ctx) {
    let res;
    try { res = await route(request, env); }
    catch (e) { console.error('unhandled', String(e && e.stack || e)); res = fail(500, 'error'); }
    return withCors(res, request, env);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(reconcile(env));
  },
};
