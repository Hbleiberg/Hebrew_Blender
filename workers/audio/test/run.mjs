#!/usr/bin/env node
/*
 * run.mjs — local tests for the audio Worker. No network, no real Supabase, no real bucket.
 *
 * It starts a fake Supabase on 127.0.0.1 (the JWKS endpoint with a key pair made for this run, and enough of
 * PostgREST — the submissions table with the same visibility rules as db/migrations/0008, the retention
 * function, the attempt log), starts `wrangler dev --local` pointed at it (Miniflare answers the R2 binding
 * with a bucket in a temp dir), then drives the Worker over HTTP as different people with tokens signed by
 * the run's key. Each case prints PASS or FAIL; the exit code is 1 when any fails.
 *
 *   cd workers/audio && npm install && npm test
 */
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const FAKE_PORT = 9797, WORKER_PORT = 8787;
const FAKE = `http://127.0.0.1:${FAKE_PORT}`, WORKER = `http://127.0.0.1:${WORKER_PORT}`;
const ANON = 'anon-test-key', SERVICE = 'service-test-key';
const ORIGIN = 'https://ivritsuite.com';

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' — ' + detail)); }

// ───────── keys and tokens ─────────
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const KID = 'test-key-' + Date.now();
const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const otherPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pubJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
const JWKS = { keys: [{ kty: 'EC', crv: 'P-256', x: pubJwk.x, y: pubJwk.y, kid: KID, use: 'sig', alg: 'ES256', key_ops: ['verify'] }] };

async function signES256(claims, { kid = KID, key = pair.privateKey, header = {} } = {}) {
  const h = b64u(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid, ...header }));
  const p = b64u(JSON.stringify(claims));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(h + '.' + p));
  return `${h}.${p}.${b64u(sig)}`;
}
async function signHS256(claims, secret) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: KID }));
  const p = b64u(JSON.stringify(claims));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(h + '.' + p));
  return `${h}.${p}.${b64u(sig)}`;
}
const now = () => Math.floor(Date.now() / 1000);
function claimsFor(uid, role, extra = {}) {
  return { iss: `${FAKE}/auth/v1`, sub: uid, aud: 'authenticated', role: 'authenticated', exp: now() + 3600, iat: now() - 5,
    app_metadata: role === 'student' ? { role: 'student', provider: 'email' } : { provider: 'email' }, user_metadata: {}, is_anonymous: false, ...extra };
}
const tokenFor = (uid, role, extra, opts) => signES256(claimsFor(uid, role, extra), opts);

// ───────── the fixture (what 0008's policies would show each person) ─────────
const T1 = '10000000-0000-4000-8000-000000000001', T2 = '10000000-0000-4000-8000-000000000002';
const S1 = '10000000-0000-4000-8000-000000000011', S2 = '10000000-0000-4000-8000-000000000012', S3 = '10000000-0000-4000-8000-000000000013';
const A1 = '20000000-0000-4000-8000-000000000031', A2 = '20000000-0000-4000-8000-000000000032', A3 = '20000000-0000-4000-8000-000000000033';
const assignments = {
  [A1]: { teacher_id: T1, is_open: true, max_minutes: 10, peers_can_listen: false, members: [S1, S2] },
  [A2]: { teacher_id: T1, is_open: true, max_minutes: 1, peers_can_listen: true, members: [S1, S2] },
  [A3]: { teacher_id: T1, is_open: false, max_minutes: 10, peers_can_listen: false, members: [S1] },
};
const SB = (n) => `30000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`;
const key = (a, s, id, ext = 'webm') => `submissions/${a}/${s}/${id}.${ext}`;
function row(n, assignment_id, student_id, over = {}) {
  const id = SB(n);
  return { id, assignment_id, student_id, title: 'take ' + n, version: 1, is_current: true, mime_type: 'audio/webm', upload_status: 'pending', status: 'submitted',
    duration_seconds: 0, size_bytes: 0, created_at: new Date().toISOString(), r2_key: key(assignment_id, student_id, id, over.mime_type === 'audio/mp4' ? 'mp4' : 'webm'), ...over };
}
const rows = new Map();
const seed = (r) => rows.set(r.id, r);
seed(row(1, A1, S1));                                   // S1's pending take in A1
seed(row(2, A1, S2, { upload_status: 'uploaded' }));    // S2's uploaded take in A1 (no object yet)
seed(row(3, A2, S1, { upload_status: 'uploaded' }));    // S1's current upload in A2 (classmates may listen)
seed(row(4, A3, S1));                                   // S1's pending take in the CLOSED A3
seed(row(5, A1, S1, { status: 'needs_rerecord', is_current: false }));   // the teacher acted on it
seed(row(6, A2, S1, { mime_type: 'audio/mp4' }));       // pending, mp4
seed(row(7, A1, S2, { created_at: new Date(Date.now() - 2 * 3600e3).toISOString() }));   // stale pending, no object
seed(row(8, A2, S2));                                   // will be uploaded, then its row removed → orphan
seed(row(9, A2, S1, { version: 2 }));                   // will be uploaded, then flipped back to pending → stale with object
seed(row(10, A1, S1, { version: 2 }));                  // retention case
let retentionDue = [];
const requests = [];   // every request the fake saw: { path, auth }
let codeAttemptsPruned = 0;

async function whoIs(authHeader) {
  const t = (authHeader || '').replace(/^Bearer /, '');
  if (t === SERVICE) return { service: true };
  try {
    const [h, p, s] = t.split('.');
    const hd = JSON.parse(Buffer.from(h, 'base64url'));
    if (hd.alg !== 'ES256' || hd.kid !== KID) return null;
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + p));
    if (!ok) return null;
    const c = JSON.parse(Buffer.from(p, 'base64url'));
    if (c.exp < now()) return null;
    return { sub: c.sub, role: c.app_metadata && c.app_metadata.role === 'student' ? 'student' : 'teacher' };
  } catch (e) { return null; }
}
function visible(r, who) {
  if (who.service) return true;
  const a = assignments[r.assignment_id];
  if (who.role === 'teacher') return a.teacher_id === who.sub;
  if (r.student_id === who.sub) return true;
  return a.peers_can_listen && a.members.includes(who.sub) && r.is_current && r.upload_status === 'uploaded';
}
function matches(r, params) {
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
    const m = v.match(/^(eq|lt|in)\.(.*)$/s);
    if (!m) return false;
    const val = r[k];
    if (m[1] === 'eq' && String(val) !== m[2]) return false;
    if (m[1] === 'lt' && !(String(val) < m[2])) return false;
    if (m[1] === 'in' && !m[2].replace(/^\(|\)$/g, '').split(',').map(decodeURIComponent).includes(String(val))) return false;
  }
  return true;
}
function project(r, select) {
  if (!select) return { ...r };
  const out = {};
  const embed = select.match(/assignments\(([^)]*)\)/);
  for (const col of select.replace(/assignments\([^)]*\)/, '').split(',').map(s => s.trim()).filter(Boolean)) out[col] = r[col];
  if (embed) { const a = assignments[r.assignment_id]; out.assignments = {}; for (const c of embed[1].split(',')) out.assignments[c.trim()] = a[c.trim()]; }
  return out;
}
const fake = http.createServer(async (req, res) => {
  const url = new URL(req.url, FAKE);
  const send = (status, body, type = 'application/json') => { res.writeHead(status, { 'content-type': type }); res.end(body === undefined ? '' : (typeof body === 'string' ? body : JSON.stringify(body))); };
  let bodyText = ''; for await (const c of req) bodyText += c;
  requests.push({ path: url.pathname, auth: req.headers.authorization || '', apikey: req.headers.apikey || '' });
  if (url.pathname === '/auth/v1/.well-known/jwks.json') return send(200, JWKS);
  if (!req.headers.apikey) return send(401, { message: 'No API key found in request' });
  const who = await whoIs(req.headers.authorization);
  if (!who) return send(401, { code: 'PGRST301', message: 'JWT invalid' });
  const params = [...url.searchParams.entries()];
  if (url.pathname === '/rest/v1/rpc/retention_due') return who.service ? send(200, retentionDue) : send(403, { code: '42501', message: 'permission denied' });
  if (url.pathname === '/rest/v1/code_attempts' && req.method === 'DELETE') { if (!who.service) return send(403, { code: '42501' }); codeAttemptsPruned++; return send(204); }
  if (url.pathname !== '/rest/v1/submissions') return send(404, { message: 'not found' });
  let hit = [...rows.values()].filter(r => visible(r, who) && matches(r, params));
  const limit = Number(url.searchParams.get('limit') || 0), offset = Number(url.searchParams.get('offset') || 0);
  if (offset) hit = hit.slice(offset);
  if (limit) hit = hit.slice(0, limit);
  if (req.method === 'GET') return send(200, hit.map(r => project(r, url.searchParams.get('select'))));
  if (req.method === 'PATCH') {
    const patch = JSON.parse(bodyText);
    const out = [];
    for (const r of hit) {
      if (!who.service) {   // the guard trigger, as 0008 writes it for the owning student
        const a = assignments[r.assignment_id];
        const okMove = r.upload_status === 'pending' && patch.upload_status === 'uploaded';
        const onlyUploadFields = Object.keys(patch).every(k => ['upload_status', 'size_bytes', 'duration_seconds'].includes(k));
        if (who.role !== 'student' || r.student_id !== who.sub || !okMove || !onlyUploadFields || r.status !== 'submitted' || !a.is_open)
          return send(403, { code: '42501', message: 'guard' });
      }
      Object.assign(r, patch); out.push(r);
    }
    return send(200, out);
  }
  if (req.method === 'DELETE') {
    const out = [];
    for (const r of hit) {
      if (!who.service && !(who.role === 'teacher' && assignments[r.assignment_id].teacher_id === who.sub)) continue;   // no policy → filtered, not refused
      rows.delete(r.id); out.push(r);
    }
    return send(200, out);
  }
  send(405, { message: 'method' });
});
await new Promise(r => fake.listen(FAKE_PORT, '127.0.0.1', r));

// ───────── wrangler dev ─────────
// A stale runtime from an earlier run would answer with that run's cached signing key: refuse to start over it.
{
  const busy = await new Promise(r => { const c = net.connect(WORKER_PORT, '127.0.0.1'); c.on('connect', () => { c.destroy(); r(true); }); c.on('error', () => r(false)); });
  if (busy) { console.error(`port ${WORKER_PORT} is already in use (a previous run's runtime?) — stop it first: pkill -x workerd`); process.exit(2); }
}
const persist = fs.mkdtempSync(path.join(os.tmpdir(), 'ivrit-audio-test-'));
const wr = spawn(path.join(HERE, '..', 'node_modules', '.bin', 'wrangler'), ['dev', '--local', '--port', String(WORKER_PORT), '--ip', '127.0.0.1', '--persist-to', persist, '--test-scheduled', '--log-level', 'log',
  '--var', `SUPABASE_URL:${FAKE}`, '--var', `SUPABASE_ANON_KEY:${ANON}`, '--var', `SUPABASE_SERVICE_ROLE_KEY:${SERVICE}`,
  '--var', `ALLOWED_ORIGINS:${ORIGIN},http://localhost:8080`], { cwd: path.join(HERE, '..'), detached: true, env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' } });
let wrLog = '';
wr.stdout.on('data', d => { wrLog += d; }); wr.stderr.on('data', d => { wrLog += d; });
function cleanup() {
  try { process.kill(-wr.pid, 'SIGTERM'); } catch (e) {}
  try { wr.kill('SIGTERM'); } catch (e) {}
  // wrangler's runtime (workerd) sometimes outlives it; give it a moment, then insist
  const t0 = Date.now();
  while (Date.now() - t0 < 2000) { try { process.kill(-wr.pid, 0); } catch (e) { break; } Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); }
  try { process.kill(-wr.pid, 'SIGKILL'); } catch (e) {}
  try { fake.close(); } catch (e) {}
  fs.rmSync(persist, { recursive: true, force: true });
}
process.on('exit', cleanup);
for (let i = 0; i < 300; i++) {
  try { const r = await fetch(WORKER + '/health'); if (r.ok) break; } catch (e) {}
  await new Promise(r => setTimeout(r, 200));
  if (i === 299) { console.error('wrangler dev did not start:\n' + wrLog); process.exit(2); }
}

// ───────── drivers ─────────
async function call(method, p, { token, body, type, origin = ORIGIN, headers = {} } = {}) {
  const h = { origin, ...headers };
  if (token) h.authorization = 'Bearer ' + token;
  if (type) h['content-type'] = type;
  const r = await fetch(WORKER + p, { method, headers: h, body });
  const text = await r.text();
  let data = null; try { data = JSON.parse(text); } catch (e) {}
  return { status: r.status, data, text, headers: r.headers };
}
async function audioBytes(p, token) {
  const r = await fetch(WORKER + p, { headers: { origin: ORIGIN, authorization: 'Bearer ' + token } });
  return { status: r.status, type: r.headers.get('content-type'), buf: Buffer.from(await r.arrayBuffer()) };
}
const blob = (n, fill = 7) => Buffer.alloc(n, fill);
// A PUT written by hand on a socket, so the declared Content-Length and the bytes sent can disagree (Node's
// fetch refuses that). Resolves with the status line's code, or 0 when the connection closed without one.
function rawPut(p, token, type, declaredLength, bytes, { closeAfterMs = 0 } = {}) {
  return new Promise((resolve) => {
    let out = '', settled = false;
    const finish = () => { if (settled) return; settled = true; const m = out.match(/^HTTP\/1\.[01] (\d{3})/); resolve(m ? Number(m[1]) : 0); try { s.destroy(); } catch (e) {} };
    const s = net.connect(WORKER_PORT, '127.0.0.1', () => {
      s.write(`PUT ${p} HTTP/1.1\r\nHost: 127.0.0.1:${WORKER_PORT}\r\nOrigin: ${ORIGIN}\r\nAuthorization: Bearer ${token}\r\nContent-Type: ${type}\r\nContent-Length: ${declaredLength}\r\nConnection: close\r\n\r\n`);
      s.write(bytes);
      if (closeAfterMs) setTimeout(() => { try { s.end(); } catch (e) {} }, closeAfterMs);   // half-close: "that was all"
    });
    s.on('data', d => { out += d; if (/\r\n\r\n/.test(out)) finish(); });   // the status line is enough
    s.on('close', finish); s.on('error', finish);
    setTimeout(finish, 8000);
  });
}

const tS1 = await tokenFor(S1, 'student'), tS2 = await tokenFor(S2, 'student'), tS3 = await tokenFor(S3, 'student');
const tT1 = await tokenFor(T1, 'teacher'), tT2 = await tokenFor(T2, 'teacher');

// ───────── 1. health and CORS ─────────
{
  const r = await call('GET', '/health');
  check('health answers without a token', r.status === 200 && r.text === 'ok');
  const pre = await fetch(WORKER + '/upload/x', { method: 'OPTIONS', headers: { origin: ORIGIN, 'access-control-request-method': 'PUT', 'access-control-request-headers': 'authorization, content-type' } });
  check('preflight from the site: allowed', pre.status === 204 && pre.headers.get('access-control-allow-origin') === ORIGIN && /PUT/.test(pre.headers.get('access-control-allow-methods')), pre.status);
  const evil = await fetch(WORKER + '/upload/x', { method: 'OPTIONS', headers: { origin: 'https://evil.example', 'access-control-request-method': 'PUT' } });
  check('preflight from another origin: no allow-origin header', evil.headers.get('access-control-allow-origin') === null);
  const dev = await fetch(WORKER + '/health', { headers: { origin: 'http://localhost:8080' } });
  check('the localhost dev origin is allowed', dev.headers.get('access-control-allow-origin') === 'http://localhost:8080');
}

// ───────── 2. tokens ─────────
{
  check('no token → 401', (await call('GET', '/audio/' + SB(3))).status === 401);
  check('garbage token → 401', (await call('GET', '/audio/' + SB(3), { token: 'abc.def.ghi' })).status === 401);
  check('expired token → 401', (await call('GET', '/audio/' + SB(3), { token: await tokenFor(S1, 'student', { exp: now() - 120 }) })).status === 401);
  check('wrong issuer → 401', (await call('GET', '/audio/' + SB(3), { token: await tokenFor(S1, 'student', { iss: 'https://other.supabase.co/auth/v1' }) })).status === 401);
  check('anon-role token → 401', (await call('GET', '/audio/' + SB(3), { token: await tokenFor(S1, 'student', { role: 'anon', aud: 'anon' }) })).status === 401);
  check('anonymous user → 401', (await call('GET', '/audio/' + SB(3), { token: await tokenFor(S1, 'student', { is_anonymous: true }) })).status === 401);
  check('HS256-signed token (algorithm confusion) → 401', (await call('GET', '/audio/' + SB(3), { token: await signHS256(claimsFor(S1, 'student'), 'whatever') })).status === 401);
  check('signed by another key under the same kid → 401', (await call('GET', '/audio/' + SB(3), { token: await tokenFor(S1, 'student', {}, { key: otherPair.privateKey }) })).status === 401);
  check('unknown kid → 401', (await call('GET', '/audio/' + SB(3), { token: await tokenFor(S1, 'student', {}, { kid: 'nope' }) })).status === 401);
  check('a valid token on an unknown path → 404', (await call('GET', '/nothing', { token: tS1 })).status === 404);
  const jwksFetches = requests.filter(r => r.path.endsWith('jwks.json')).length;
  check('the signing key was fetched once, not per request', jwksFetches <= 3, jwksFetches);
}

// ───────── 3. upload ─────────
{
  let r = await call('PUT', '/upload/' + SB(1) + '?duration=42', { token: tS1, body: blob(1000), type: 'audio/webm' });
  check('S1 uploads their pending take (1000 bytes)', r.status === 200 && r.data && r.data.ok && r.data.size_bytes === 1000 && r.data.duration_seconds === 42, r.text);
  check('…the fake row is now uploaded with the true size', rows.get(SB(1)).upload_status === 'uploaded' && rows.get(SB(1)).size_bytes === 1000);
  const userCalls = requests.filter(q => q.path === '/rest/v1/submissions');
  check('the Worker asked Supabase as the student (their token, the publishable key)', userCalls.every(q => q.auth === 'Bearer ' + tS1 && q.apikey === ANON), JSON.stringify(userCalls.slice(-1)));
  r = await call('PUT', '/upload/' + SB(1), { token: tS1, body: blob(10), type: 'audio/webm' });
  check('uploading again to an uploaded row → 409', r.status === 409, r.text);
  r = await call('PUT', '/upload/' + SB(2), { token: tS1, body: blob(10), type: 'audio/webm' });
  check('S1 cannot upload to S2\'s row they cannot see → 404', r.status === 404, r.text);
  r = await call('PUT', '/upload/' + SB(3), { token: tS2, body: blob(10), type: 'audio/webm' });
  check('S2 cannot upload to a classmate\'s row they CAN see (peers on) → 403', r.status === 403, r.text);
  r = await call('PUT', '/upload/' + SB(6), { token: tT1, body: blob(10), type: 'audio/mp4' });
  check('a teacher cannot upload → 403', r.status === 403, r.text);
  r = await call('PUT', '/upload/' + SB(4), { token: tS1, body: blob(10), type: 'audio/webm' });
  check('a closed assignment → 409 closed', r.status === 409 && r.data.error === 'closed', r.text);
  r = await call('PUT', '/upload/' + SB(5), { token: tS1, body: blob(10), type: 'audio/webm' });
  check('a row the teacher acted on → 409', r.status === 409, r.text);
  r = await call('PUT', '/upload/' + SB(6), { token: tS1, body: blob(10), type: 'text/plain' });
  check('a non-audio type → 415', r.status === 415, r.text);
  r = await call('PUT', '/upload/' + SB(6), { token: tS1, body: blob(10), type: 'audio/webm' });
  check('a type that differs from the row\'s → 415', r.status === 415, r.text);
  // (wrangler's dev proxy delivers a response only after draining the request body, so the full body is sent
  // here; the Worker still refuses on the header alone — it asks Supabase nothing for these two.)
  let seen = requests.length;
  r = await call('PUT', '/upload/' + SB(6), { token: tS1, body: blob(20 * 1024 * 1024), type: 'audio/mp4' });
  check('Content-Length over the hard cap → 413', r.status === 413, r.text);
  check('…refused before Supabase was asked anything', requests.length === seen, requests.length - seen);
  r = await call('PUT', '/upload/' + SB(6), { token: tS1, body: blob(6 * 1024 * 1024), type: 'audio/mp4' });
  check('Content-Length over the assignment\'s cap (1 minute) → 413', r.status === 413, r.text);
  check('…after one read of the row (for its max_minutes), nothing written', requests.length === seen + 1 && rows.get(SB(6)).upload_status === 'pending', requests.length - seen);
  r = await call('POST', '/upload/' + SB(6), { token: tS1, body: blob(10), type: 'audio/mp4' });
  check('POST on /upload → 405', r.status === 405);
  r = await call('PUT', '/upload/not-a-uuid', { token: tS1, body: blob(10), type: 'audio/webm' });
  check('a malformed id → 404', r.status === 404);
  // no Content-Length (a chunked body)
  const chunked = await new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: WORKER_PORT, method: 'PUT', path: '/upload/' + SB(6), headers: { origin: ORIGIN, authorization: 'Bearer ' + tS1, 'content-type': 'audio/mp4', 'transfer-encoding': 'chunked' } }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => resolve({ status: res.statusCode, body: b })); });
    req.on('error', e => resolve({ status: 0, body: String(e) }));
    req.write(blob(10)); req.end();
  });
  check('a chunked body with no Content-Length → 411', chunked.status === 411, JSON.stringify(chunked));
  // a body shorter than its Content-Length: the put must store nothing
  const short = await rawPut('/upload/' + SB(6), tS1, 'audio/mp4', 1000, blob(400), { closeAfterMs: 300 });
  check('a body shorter than its Content-Length does not mark the row uploaded', rows.get(SB(6)).upload_status === 'pending', 'status ' + short);
  r = await call('PUT', '/upload/' + SB(6) + '?duration=9999', { token: tS1, body: blob(2000, 3), type: 'audio/mp4' });
  check('the mp4 take uploads after that; duration is clamped', r.status === 200 && r.data.duration_seconds === 1800, r.text);
  check('…the object carries the row\'s type', (await audioBytes('/audio/' + SB(6), tS1)).type === 'audio/mp4');
}

// ───────── 4. playback ─────────
{
  let a = await audioBytes('/audio/' + SB(1), tS1);
  check('S1 hears their own recording (same bytes)', a.status === 200 && a.buf.length === 1000 && a.buf.equals(blob(1000)) && a.type === 'audio/webm', a.status);
  check('T1 (the teacher) hears it', (await audioBytes('/audio/' + SB(1), tT1)).status === 200);
  check('S2 (a classmate, peers OFF in A1) → 404', (await audioBytes('/audio/' + SB(1), tS2)).status === 404);
  check('T2 (another teacher) → 404', (await audioBytes('/audio/' + SB(1), tT2)).status === 404);
  check('S3 (another teacher\'s student) → 404', (await audioBytes('/audio/' + SB(1), tS3)).status === 404);
  check('a row marked uploaded whose object is missing → 404 missing', (await call('GET', '/audio/' + SB(3), { token: tS1 })).data.error === 'missing');
  await call('PUT', '/upload/' + SB(8), { token: tS2, body: blob(300, 1), type: 'audio/webm' });
  check('S1 (peers ON in A2) hears S2\'s current upload', (await audioBytes('/audio/' + SB(8), tS1)).status === 200);
  assignments[A2].peers_can_listen = false;
  check('…and not once the teacher turns peers off', (await audioBytes('/audio/' + SB(8), tS1)).status === 404);
  assignments[A2].peers_can_listen = true;
  check('a pending row → 404', (await audioBytes('/audio/' + SB(9), tS1)).status === 404);
  const cc = await fetch(WORKER + '/audio/' + SB(1), { headers: { origin: ORIGIN, authorization: 'Bearer ' + tS1 } });
  check('audio is never cached', /no-store/.test(cc.headers.get('cache-control')) && cc.headers.get('access-control-allow-origin') === ORIGIN);
}

// ───────── 5. delete ─────────
{
  let r = await call('POST', '/delete', { token: tS1, body: JSON.stringify({ submission_id: SB(1) }), type: 'application/json' });
  check('the student cannot delete their own recording → 403', r.status === 403, r.text);
  r = await call('POST', '/delete', { token: tT2, body: JSON.stringify({ submission_id: SB(1) }), type: 'application/json' });
  check('another teacher → 404', r.status === 404, r.text);
  r = await call('POST', '/delete', { token: tT1, body: JSON.stringify({ submission_id: SB(1) }), type: 'application/json' });
  check('the teacher deletes it', r.status === 200 && r.data.ok, r.text);
  check('…the row is gone', !rows.has(SB(1)));
  check('…and the audio', (await audioBytes('/audio/' + SB(1), tT1)).status === 404);
  r = await call('POST', '/delete', { token: tT1, body: JSON.stringify({ submission_id: SB(1) }), type: 'application/json' });
  check('deleting again → 404', r.status === 404);
  r = await call('POST', '/delete', { token: tT1, body: '{"submission_id": 5}', type: 'application/json' });
  check('a malformed body → 400', r.status === 400);
  r = await call('GET', '/delete', { token: tT1 });
  check('GET /delete → 405', r.status === 405);
}

// ───────── 6. rate limit ─────────
{
  let last = 0, n = 0;
  for (let i = 0; i < 130; i++) { last = (await audioBytes('/audio/' + SB(6), tS1)).status; n++; if (last === 429) break; }
  check('the 121st playback in a minute is rate-limited (429)', last === 429 && n > 100, `${n} requests, last ${last}`);
  check('…and another person is not affected', (await audioBytes('/audio/' + SB(6), tT1)).status === 200);
}

// ───────── 7. the daily reconcile ─────────
{
  await call('PUT', '/upload/' + SB(9), { token: tS1, body: blob(50, 9), type: 'audio/webm' });   // object + row uploaded…
  Object.assign(rows.get(SB(9)), { upload_status: 'pending', size_bytes: 0, created_at: new Date(Date.now() - 2 * 3600e3).toISOString() });   // …then the row "forgot"
  await call('PUT', '/upload/' + SB(10), { token: tS1, body: blob(60, 2), type: 'audio/webm' });
  retentionDue = [{ id: SB(10), r2_key: rows.get(SB(10)).r2_key }];
  rows.delete(SB(8));   // the orphan: its object stays, its row is gone
  const before = requests.length;
  const cron = await fetch(WORKER + '/__scheduled?cron=17+3+*+*+*');
  check('the cron endpoint answers', cron.status === 200, cron.status);
  let report = null;
  for (let i = 0; i < 100 && !report; i++) { const m = wrLog.match(/reconcile (\{.*\})/); if (m) report = JSON.parse(m[1]); else await new Promise(r => setTimeout(r, 100)); }
  check('the reconcile ran and reported', !!report, wrLog.slice(-800));
  if (report) {
    check('stale pending row with an object → marked uploaded', report.stale_fixed === 1 && rows.get(SB(9)).upload_status === 'uploaded' && rows.get(SB(9)).size_bytes === 50, JSON.stringify(report));
    check('stale pending row with no object → dropped', report.stale_dropped === 1 && !rows.has(SB(7)), JSON.stringify(report));
    check('an object with no row → deleted', report.orphans_deleted === 1, JSON.stringify(report));
    check('retention: the object and the row go', report.expired_deleted === 1 && !rows.has(SB(10)), JSON.stringify(report));
    check('the attempt log was pruned', report.attempts_pruned === true && codeAttemptsPruned === 1);
    check('no errors in the run', report.errors.length === 0, JSON.stringify(report.errors));
    const svc = requests.slice(before).filter(q => q.path.startsWith('/rest/'));
    check('the reconcile used the secret key and nothing else did', svc.length > 0 && svc.every(q => q.auth === 'Bearer ' + SERVICE) && requests.slice(0, before).every(q => q.auth !== 'Bearer ' + SERVICE), svc.length);
    check('the reconcile stayed inside the free plan\'s external-call budget', svc.length <= 50, svc.length);
  }
  check('the teacher can hear the stale-then-fixed take (S1 is still rate-limited from above)', (await audioBytes('/audio/' + SB(9), tT1)).status === 200);
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed && process.env.WRANGLER_LOG_ON_FAIL) console.log(wrLog);
cleanup();
process.exit(failed ? 1 : 0);
