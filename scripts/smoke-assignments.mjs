#!/usr/bin/env node
/*
 * smoke-assignments.mjs — headless end-to-end test of Torah Trainer reading assignments against a fake cloud.
 *
 * What it proves, without any real network: the teacher's page (reading_assignments.html) and the Trainer's
 * student panel + Teacher tab (torah_trainer.html), driven through the real js/ivrit-account.js, js/ivrit-saves.js and
 * js/ivrit-assignments.js, with Chromium's fake microphone so MediaRecorder produces real bytes:
 *
 *   A. The teacher creates a class and two student logins from typed names (the preview, the created table with
 *      the one-time passwords), then assigns the reading on screen from the Trainer (the dialog, a generated code
 *      word, the success card); the management page lists it.
 *   B. A student signs in through the chip's username + password form, enters the code word (wrong first, then
 *      right, typed with caps and spaces), the Trainer loads the assigned verse range, and they record, listen,
 *      name and submit — the live line announces each state and the upload's quarter steps; the row and the
 *      object land in the fake. The same flow once more keyboard-only, with the focus asserted at every step.
 *   C. The teacher plays it (a fetched blob, never a URL), leaves feedback and asks for a re-recording; the
 *      student sees the request and submits take 2; the teacher approves it. History: both takes listed.
 *   D. Classmates may listen: off, a second student hears nothing of the first; on, the first's current take and
 *      never the feedback; off again, nothing.
 *   E. Delete a recording (row and object gone) and download everything as a .zip (parsed in Node).
 *   F. Error states, each announced: microphone denied, no MediaRecorder, the upload server failing then Retry,
 *      the server unreachable, a rate-limited sign-in, a locked-out code word.
 *   G. XSS strings in every text field (student name, username, title, feedback, code word, class name) render as
 *      text: no element is created, no pageerror.
 *   H. Privilege attempts through the fake, as the student: the role column, another student's recording, a
 *      foreign upload, a status change — each refused.
 *   I. Signed out the Trainer shows nothing above the reading, downloads nothing extra, and its Teacher tab only asks
 *      to sign in.
 *   J. Accessibility: every control named, the dialogs modal with a focus trap and Escape, live regions present,
 *      the recorder's buttons real buttons.
 *
 * Run from the repo root:  node scripts/smoke-assignments.mjs --sdk path/to/supabase.js   (the pinned UMD build;
 * required). Starts its own python3 -m http.server on port 8086. SMOKE_DEBUG=1 prints the page's console.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const PORT = 8086, BASE = 'http://localhost:' + PORT;
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const REF = new URL(CFG.url).hostname.split('.')[0];
const AUTH_KEY = 'sb-' + REF + '-auth-token';
const WORKER = 'https://recordings.ivritsuite.com';
const sdkArg = process.argv.indexOf('--sdk');
const SDK_FILE = sdkArg > -1 ? process.argv[sdkArg + 1] : null;
if (!SDK_FILE || !fs.existsSync(SDK_FILE)) { console.error('smoke-assignments: --sdk path/to/supabase.js is required (npm pack @supabase/supabase-js@' + (CFG.sdk.match(/@([\d.]+)\//) || [])[1] + ')'); process.exit(2); }
const SDK_BYTES = fs.readFileSync(SDK_FILE);
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-assignments');
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' — ' + detail)); }

/* ---------- the fake cloud: Auth, the assignment tables under 0008's rules, the Edge Function, the Worker ---------- */
const T1 = '10000000-0000-4000-8000-000000000001';
const TEACHER = { id: T1, email: 'morah@example.org', user_metadata: { full_name: 'Morah Leah' }, app_metadata: { provider: 'email' }, role: 'authenticated', aud: 'authenticated' };
const sessionFor = (u) => ({ access_token: 'tok-' + u.id, refresh_token: 'ref-' + u.id, expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user: u });

class FakeCloud {
  constructor() {
    this.users = new Map([[T1, Object.assign({ password: null }, TEACHER)]]);   // id → auth user (+password for students)
    this.t = { profiles: [{ id: T1, display_name: 'Morah Leah', role: 'teacher' }], classes: [], students: [], assignments: [], assignment_members: [], submissions: [], feedback: [], code_attempts: [] };
    this.objects = new Map();   // r2_key → { bytes, type }
    this.log = [];
    this.workerFail = null;     // (path) → status to answer instead, once
    this.tokenStatus = null;    // a status for the next password sign-in
    this.n = 0;
  }
  stamp() { return new Date(Date.UTC(2026, 9, 1, 12, 0, 0) + (++this.n) * 1000).toISOString(); }
  who(headers) {
    const a = headers.authorization || '';
    const m = /^Bearer tok-(.+)$/.exec(a);
    if (!m) return null;
    const u = this.users.get(m[1]);
    return u ? { id: u.id, role: u.app_metadata && u.app_metadata.role === 'student' ? 'student' : 'teacher', user: u } : null;
  }
  // ---- visibility (the policies) ----
  teacherOf(aid) { const a = this.t.assignments.find(x => x.id === aid); return a ? a.teacher_id : null; }
  member(aid, sid) { return this.t.assignment_members.some(m => m.assignment_id === aid && m.student_id === sid); }
  visible(table, r, who) {
    const me = who.id, tch = who.role === 'teacher';
    switch (table) {
      case 'profiles': return r.id === me || (tch && this.t.students.some(s => s.id === r.id && s.teacher_id === me));
      case 'classes': return tch && r.teacher_id === me;
      case 'students': return r.id === me || (tch && r.teacher_id === me);
      case 'assignments': return tch ? r.teacher_id === me : this.member(r.id, me);
      case 'assignment_members': return r.student_id === me || (tch && this.teacherOf(r.assignment_id) === me);
      case 'submissions': {
        if (tch) return this.teacherOf(r.assignment_id) === me;
        if (r.student_id === me) return true;
        const a = this.t.assignments.find(x => x.id === r.assignment_id);
        return !!(a && a.peers_can_listen && this.member(a.id, me) && r.is_current && r.upload_status === 'uploaded');
      }
      case 'feedback': { const s = this.t.submissions.find(x => x.id === r.submission_id); if (!s) return false; return tch ? this.teacherOf(s.assignment_id) === me : s.student_id === me; }
      default: return false;
    }
  }
  filtersOf(q) {
    return [...q.entries()].filter(([k, v]) => !['select', 'order', 'offset', 'limit'].includes(k) && /^(eq|neq|in|is)\./.test(v))
      .map(([k, v]) => v.startsWith('in.') ? [k, 'in', v.slice(4, -1).split(',').map(x => x.trim().replace(/^"(.*)"$/, '$1'))] : [k, v.split('.')[0], v.slice(v.indexOf('.') + 1)]);
  }
  match(r, filters) {
    return filters.every(([k, op, v]) => { const val = r[k] === undefined || r[k] === null ? 'null' : String(r[k]); if (op === 'in') return v.includes(val); if (op === 'neq') return val !== v; if (op === 'is') return val === v; return val === v; });
  }
  pick(table, row, select) {
    if (!select || select.trim() === '*') return Object.assign({}, row);
    const out = {}; const embed = /assignments\(([^)]*)\)/.exec(select);
    select.replace(/assignments\([^)]*\)/, '').split(',').map(s => s.trim()).filter(Boolean).forEach(k => { out[k] = row[k]; });
    if (embed && table === 'submissions') { const a = this.t.assignments.find(x => x.id === row.assignment_id) || {}; out.assignments = {}; embed[1].split(',').forEach(c => { out.assignments[c.trim()] = a[c.trim()]; }); }
    return out;
  }
  pgError(status, code, message) { return { __err: true, status, body: { code, details: null, hint: null, message } }; }
  // ---- writes under the triggers ----
  insert(table, b, who, ignoreDup) {
    const now = this.stamp();
    if (who.role !== 'teacher' && table !== 'submissions') return this.pgError(403, '42501', 'new row violates row-level security policy');
    if (table === 'assignment_members') {   // 0009: the teacher's own assignment and own student, else the policy refuses
      const st = this.t.students.find(x => x.id === b.student_id && x.teacher_id === who.id);
      if (!st || this.teacherOf(b.assignment_id) !== who.id) return this.pgError(403, '42501', 'new row violates row-level security policy');
      if (this.member(b.assignment_id, b.student_id)) return ignoreDup ? null : this.pgError(409, '23505', 'duplicate key value violates unique constraint "assignment_members_pkey"');
      const r = { assignment_id: b.assignment_id, student_id: b.student_id, joined_at: now }; this.t.assignment_members.push(r); return r;
    }
    if (table === 'classes') { if (this.t.classes.some(c => c.teacher_id === who.id && c.name === b.name)) return this.pgError(409, '23505', 'duplicate'); const r = { id: crypto.randomUUID(), teacher_id: who.id, name: String(b.name), created_at: now, updated_at: now }; this.t.classes.push(r); return r; }
    if (table === 'assignments') {
      const norm = String(b.code_word || '').toLowerCase().replace(/[\s\-_]/g, '');
      if (!/^[\p{L}\p{N}]{6,40}$/u.test(norm)) return this.pgError(400, '23514', 'assignments_code_norm_shape');
      if (!/^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy) [0-9]{1,3}:[0-9]{1,3}(-([0-9]{1,3}:)?[0-9]{1,3})?$/.test(String(b.ref || ''))) return this.pgError(400, '23514', 'assignments_ref_check');
      if (this.t.assignments.some(a => a.teacher_id === who.id && a.code_norm === norm)) return this.pgError(409, '23505', 'duplicate key value violates unique constraint "assignments_one_code_per_teacher"');
      if (Buffer.byteLength(JSON.stringify(b.reading === undefined ? {} : b.reading)) > 2000) return this.pgError(400, '23514', 'assignments_reading_check');
      const r = Object.assign({ id: crypto.randomUUID(), teacher_id: who.id, class_id: null, peers_can_listen: false, is_open: true, closed_at: null, max_minutes: 10, due_date: null, retention_days: 30, reading: {}, created_at: now, updated_at: now }, b, { code_norm: norm });
      if (!r.is_open) r.closed_at = now;
      this.t.assignments.push(r); return r;
    }
    if (table === 'feedback') {
      const s = this.t.submissions.find(x => x.id === b.submission_id);
      if (!s || this.teacherOf(s.assignment_id) !== who.id) return this.pgError(403, '42501', 'feedback may only be left by the teacher of the assignment');
      if (this.t.feedback.some(f => f.submission_id === b.submission_id)) return this.pgError(409, '23505', 'duplicate');
      const r = { id: crypto.randomUUID(), submission_id: b.submission_id, teacher_id: who.id, comment: String(b.comment || ''), request_rerecord: !!b.request_rerecord, created_at: now, updated_at: now };
      s.status = r.request_rerecord ? 'needs_rerecord' : (s.status === 'needs_rerecord' ? 'submitted' : s.status);
      this.t.feedback.push(r); return r;
    }
    if (table === 'submissions') {
      if (who.role !== 'student') return this.pgError(403, '42501', 'new row violates row-level security policy');
      const a = this.t.assignments.find(x => x.id === b.assignment_id);
      if (b.student_id && b.student_id !== who.id) return this.pgError(403, '42501', 'new row violates row-level security policy');
      if (!a || !a.is_open || !this.member(a.id, who.id)) return this.pgError(403, '42501', 'new row violates row-level security policy');
      if (!['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].includes(b.mime_type)) return this.pgError(400, '23514', 'submissions_mime_type_check');
      const mine = this.t.submissions.filter(s => s.assignment_id === a.id && s.student_id === who.id);
      mine.forEach(s => { s.is_current = false; });
      const id = crypto.randomUUID();
      const ext = b.mime_type.startsWith('audio/webm') ? 'webm' : b.mime_type === 'audio/mp4' ? 'mp4' : 'ogg';
      const r = { id, assignment_id: a.id, student_id: who.id, title: String(b.title || '').slice(0, 80), version: mine.length + 1, is_current: true, r2_key: `submissions/${a.id}/${who.id}/${id}.${ext}`, mime_type: b.mime_type, duration_seconds: Number(b.duration_seconds) || 0, size_bytes: 0, upload_status: 'pending', status: 'submitted', created_at: now, updated_at: now };
      this.t.submissions.push(r); return r;
    }
    return this.pgError(403, '42501', 'permission denied for table ' + table);
  }
  guard(table, r, patch, who) {   // the per-caller column guards
    const changed = Object.keys(patch).filter(k => JSON.stringify(patch[k]) !== JSON.stringify(r[k]));
    if (table === 'profiles') { if (changed.some(k => k !== 'display_name')) return this.pgError(403, '42501', 'profiles.role is read-only'); return null; }
    if (table === 'students') { if (changed.some(k => k !== 'class_id')) return this.pgError(403, '42501', 'only class_id may change'); return null; }
    if (table === 'submissions') {
      const ident = ['id', 'assignment_id', 'student_id', 'version', 'r2_key', 'mime_type', 'is_current', 'created_at'];
      if (changed.some(k => ident.includes(k))) return this.pgError(403, '42501', 'submission identity is read-only');
      if (changed.includes('upload_status') && !(r.upload_status === 'pending' && patch.upload_status === 'uploaded')) return this.pgError(403, '42501', 'upload_status only moves from pending to uploaded');
      if (who.id === r.student_id) {
        if (changed.includes('status')) return this.pgError(403, '42501', 'a student cannot change status');
        if (r.status !== 'submitted') return this.pgError(403, '42501', 'locked');
        const a = this.t.assignments.find(x => x.id === r.assignment_id); if (!a || !a.is_open) return this.pgError(403, '42501', 'closed');
      } else if (this.teacherOf(r.assignment_id) === who.id) {
        if (changed.some(k => ['title', 'upload_status', 'size_bytes', 'duration_seconds'].includes(k))) return this.pgError(403, '42501', 'a teacher changes only status');
      } else return this.pgError(403, '42501', 'not allowed');
      return null;
    }
    if (table === 'feedback') { const s = this.t.submissions.find(x => x.id === r.submission_id); if (s && 'request_rerecord' in patch) s.status = patch.request_rerecord ? 'needs_rerecord' : (s.status === 'needs_rerecord' ? 'submitted' : s.status); return null; }
    if (table === 'assignments') { if (patch.is_open === false && r.is_open) patch.closed_at = this.stamp(); if (patch.is_open === true && !r.is_open) patch.closed_at = null; if (patch.code_word !== undefined) patch.code_norm = String(patch.code_word).toLowerCase().replace(/[\s\-_]/g, ''); return null; }
    return null;
  }
  canDelete(table, r, who) {
    if (who.role !== 'teacher') return false;
    if (table === 'classes' || table === 'assignments') return r.teacher_id === who.id;
    if (table === 'submissions') return this.teacherOf(r.assignment_id) === who.id;
    if (table === 'feedback') return r.teacher_id === who.id;
    if (table === 'assignment_members') return this.teacherOf(r.assignment_id) === who.id;
    return false;
  }
  cascade(table, r) {
    if (table === 'assignments') { this.t.assignment_members = this.t.assignment_members.filter(m => m.assignment_id !== r.id); this.t.submissions.filter(s => s.assignment_id === r.id).forEach(s => this.cascade('submissions', s)); this.t.submissions = this.t.submissions.filter(s => s.assignment_id !== r.id); }
    if (table === 'submissions') {
      this.t.feedback = this.t.feedback.filter(f => f.submission_id !== r.id);
      if (r.is_current) {   // the after-delete trigger: the latest remaining take becomes current
        const rest = this.t.submissions.filter(s => s !== r && s.assignment_id === r.assignment_id && s.student_id === r.student_id).sort((a, b) => b.version - a.version);
        if (rest[0]) rest[0].is_current = true;
      }
    }
    if (table === 'classes') { this.t.students.forEach(s => { if (s.class_id === r.id) s.class_id = null; }); this.t.assignments.forEach(a => { if (a.class_id === r.id) a.class_id = null; }); }
  }
  claim(code, who) {
    if (who.role !== 'student') return this.pgError(403, '42501', 'not_a_student');
    const st = this.t.students.find(s => s.id === who.id);
    const tenMin = Date.now() - 600e3;
    if (this.t.code_attempts.filter(c => c.user_id === who.id && c.at > tenMin).length >= 10) return this.pgError(403, '42501', 'too_many_attempts');
    const norm = String(code || '').toLowerCase().replace(/[\s\-_]/g, '');
    const a = this.t.assignments.find(x => x.teacher_id === st.teacher_id && x.code_norm === norm && x.is_open);
    if (!a) { this.t.code_attempts.push({ user_id: who.id, at: Date.now() }); return []; }
    this.t.code_attempts = this.t.code_attempts.filter(c => c.user_id !== who.id);
    if (!this.member(a.id, who.id)) this.t.assignment_members.push({ assignment_id: a.id, student_id: who.id, joined_at: this.stamp() });
    return [{ id: a.id, title: a.title, ref: a.ref, ref_label: a.ref_label, reading: a.reading, peers_can_listen: a.peers_can_listen, max_minutes: a.max_minutes, due_date: a.due_date, is_open: a.is_open }];
  }
  // ---- the Edge Function ----
  manageStudents(body, who) {
    if (who.role === 'student') return { status: 403, body: { error: 'student_forbidden' } };
    if (body.action === 'create') {
      const results = [];
      for (const r of body.students || []) {
        const username = String(r.username || '').toLowerCase(), name = String(r.display_name || '').trim(), pw = String(r.password || '');
        if (!name) { results.push({ username, error: 'invalid_name' }); continue; }
        if (!/^[a-z0-9][a-z0-9.]{1,28}[a-z0-9]$/.test(username)) { results.push({ username, error: 'invalid_username' }); continue; }
        if (pw.length < 8) { results.push({ username, error: 'invalid_password' }); continue; }
        if (this.t.students.some(s => s.username === username)) { results.push({ username, error: 'username_taken' }); continue; }
        const id = crypto.randomUUID();
        this.users.set(id, { id, email: username + '@students.ivritsuite.com', user_metadata: { full_name: name }, app_metadata: { provider: 'email', role: 'student' }, role: 'authenticated', aud: 'authenticated', password: pw });
        this.t.profiles.push({ id, display_name: name, role: 'student' });
        this.t.students.push({ id, teacher_id: who.id, class_id: null, username, created_at: this.stamp() });
        results.push({ username, id, display_name: name });
      }
      return { status: 200, body: { ok: true, results } };
    }
    if (body.action === 'reset_passwords') {
      const ids = Array.isArray(body.ids) ? body.ids : [];
      if (!ids.length || ids.length > 60) return { status: 400, body: { error: 'bad_request' } };
      if (String(body.password || '').length < 8) return { status: 400, body: { error: 'invalid_password' } };
      const results = [];
      for (const id of new Set(ids)) { const st = this.t.students.find(x => x.id === id && x.teacher_id === who.id); if (!st) { results.push({ id, error: 'not_found' }); continue; } this.users.get(st.id).password = body.password; results.push({ id, username: st.username }); }
      return { status: 200, body: { ok: true, results } };
    }
    const s = this.t.students.find(x => x.id === body.id && x.teacher_id === who.id);
    if (!s) return { status: 404, body: { error: 'not_found' } };
    if (body.action === 'reset_password') { if (String(body.password || '').length < 8) return { status: 400, body: { error: 'invalid_password' } }; this.users.get(s.id).password = body.password; return { status: 200, body: { ok: true, id: s.id } }; }
    if (body.action === 'delete') { this.users.delete(s.id); this.t.students = this.t.students.filter(x => x.id !== s.id); this.t.profiles = this.t.profiles.filter(x => x.id !== s.id); this.t.assignment_members = this.t.assignment_members.filter(m => m.student_id !== s.id); this.t.submissions.filter(x => x.student_id === s.id).forEach(x => this.cascade('submissions', x)); this.t.submissions = this.t.submissions.filter(x => x.student_id !== s.id); return { status: 200, body: { ok: true, id: s.id } }; }
    return { status: 400, body: { error: 'bad_request' } };
  }
  // ---- the request router ----
  async answer(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method(), headers = req.headers();
    const cors = { 'access-control-allow-origin': headers.origin || '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': '*', 'vary': 'Origin' };
    const json = (status, body, extra) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors, extra || {}), body: body === undefined ? '' : JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const bodyText = req.postData();
    let body = null; try { body = bodyText ? JSON.parse(bodyText) : null; } catch (e) { body = null; }
    this.log.push({ m, path: url.pathname, search: url.search });
    // ---- the Worker ----
    if (url.origin === WORKER) {
      if (this.workerFail && this.workerFail(url.pathname)) { const st = this.workerFail(url.pathname); this.workerFail = null; return json(st, { error: 'error' }); }
      const who = this.who(headers);
      if (!who) return json(401, { error: 'unauthorized' });
      let mm;
      if ((mm = /^\/upload\/([^/]+)$/.exec(url.pathname)) && m === 'PUT') {
        const r = this.t.submissions.find(s => s.id === mm[1]);
        if (!r || !this.visible('submissions', r, who)) return json(404, { error: 'not_found' });
        if (r.student_id !== who.id || who.role !== 'student') return json(403, { error: 'forbidden' });
        if (r.upload_status !== 'pending' || r.status !== 'submitted') return json(409, { error: 'not_accepted' });
        const a = this.t.assignments.find(x => x.id === r.assignment_id); if (!a.is_open) return json(409, { error: 'closed' });
        const type = String(headers['content-type'] || '').replace(/\s+/g, '').toLowerCase();
        if (type !== r.mime_type.toLowerCase()) return json(415, { error: 'unsupported_type' });
        const bytes = req.postDataBuffer() || Buffer.alloc(0);
        if (!bytes.length) return json(400, { error: 'empty' });
        this.objects.set(r.r2_key, { bytes, type: r.mime_type });
        r.upload_status = 'uploaded'; r.size_bytes = bytes.length; r.duration_seconds = Math.max(0, Math.min(1800, Number(url.searchParams.get('duration')) || 0)); r.updated_at = this.stamp();
        return json(200, { ok: true, id: r.id, size_bytes: r.size_bytes, duration_seconds: r.duration_seconds, upload_status: 'uploaded' });
      }
      if ((mm = /^\/audio\/([^/]+)$/.exec(url.pathname)) && m === 'GET') {
        const r = this.t.submissions.find(s => s.id === mm[1]);
        if (!r || !this.visible('submissions', r, who) || r.upload_status !== 'uploaded') return json(404, { error: 'not_found' });
        const o = this.objects.get(r.r2_key); if (!o) return json(404, { error: 'missing' });
        return route.fulfill({ status: 200, headers: Object.assign({ 'content-type': o.type, 'cache-control': 'private, no-store' }, cors), body: o.bytes });
      }
      if (url.pathname === '/delete' && m === 'POST') {
        const r = this.t.submissions.find(s => s.id === (body && body.submission_id));
        if (!r || !this.visible('submissions', r, who)) return json(404, { error: 'not_found' });
        if (who.role !== 'teacher' || this.teacherOf(r.assignment_id) !== who.id) return json(403, { error: 'forbidden' });
        this.objects.delete(r.r2_key); this.cascade('submissions', r); this.t.submissions = this.t.submissions.filter(s => s.id !== r.id);
        return json(200, { ok: true, id: r.id });
      }
      return json(404, { error: 'not_found' });
    }
    // ---- Auth ----
    if (url.pathname.endsWith('/auth/v1/token')) {
      if (url.searchParams.get('grant_type') === 'password') {
        if (this.tokenStatus) { const st = this.tokenStatus; this.tokenStatus = null; return json(st, { code: st, error_code: st === 429 ? 'over_request_rate_limit' : 'unexpected_failure', msg: 'smoke' }); }
        const u = [...this.users.values()].find(x => x.email === String(body.email || '').toLowerCase());
        if (!u || !u.password || u.password !== body.password) return json(400, { code: 400, error_code: 'invalid_credentials', error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' });
        const { password, ...pub } = u;
        return json(200, sessionFor(pub));
      }
      const who = this.who({ authorization: 'Bearer ' + ((body && body.refresh_token) || '').replace(/^ref-/, 'tok-') });
      if (!who) return json(400, { error: 'invalid_grant', error_description: 'refresh token not found' });
      const { password, ...pub } = who.user; return json(200, sessionFor(pub));
    }
    if (url.pathname.endsWith('/auth/v1/user')) { const who = this.who(headers); if (!who) return json(401, { code: 401, error_code: 'session_not_found', msg: 'no session' }); const { password, ...pub } = who.user; return json(200, pub); }
    if (url.pathname.endsWith('/auth/v1/logout')) return route.fulfill({ status: 204, headers: cors });
    // ---- the Edge Function ----
    if (/\/functions\/v1\/manage-students$/.test(url.pathname)) { const who = this.who(headers); if (!who) return json(401, { error: 'no_token' }); const r = this.manageStudents(body || {}, who); return json(r.status, r.body); }
    // ---- PostgREST ----
    const who = this.who(headers);
    if (!who) return json(401, { code: 'PGRST301', message: 'JWT invalid' });
    const rpc = /\/rest\/v1\/rpc\/([a-z_]+)$/.exec(url.pathname);
    if (rpc) {
      if (rpc[1] !== 'claim_assignment') return json(404, { code: 'PGRST202', message: 'no function' });
      const r = this.claim(body && body.code, who);
      if (r && r.__err) return json(r.status, r.body);
      return json(200, r);
    }
    const tm = /\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
    if (!tm || !this.t[tm[1]]) return json(404, { code: 'PGRST205', message: 'no table' });
    const table = tm[1], q = url.searchParams, filters = this.filtersOf(q);
    const single = /vnd\.pgrst\.object/.test(headers.accept || '');
    const represent = /return=representation/.test(headers.prefer || '') || q.has('select');
    if (table === 'code_attempts' || (table === 'students' && m === 'POST')) return json(403, { code: '42501', message: 'permission denied for table ' + table });
    const ignoreDup = /resolution=ignore-duplicates/.test(headers.prefer || '');
    let rows = this.t[table].filter(r => this.visible(table, r, who) && this.match(r, filters));
    let status = 200;
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => { const p = s.split('.'); return [p[0], p[1] === 'desc' ? -1 : 1]; });
      if (order.length) rows = rows.slice().sort((a, b) => { for (const [k, d] of order) { if (a[k] < b[k]) return -d; if (a[k] > b[k]) return d; } return 0; });
      const from = Number(q.get('offset') || 0), to = q.has('limit') ? from + Number(q.get('limit')) : Infinity;
      rows = rows.slice(from, to);
    } else if (m === 'POST') {
      const bodies = Array.isArray(body) ? body : [body];
      const made = [];
      for (const b of bodies) { const r = this.insert(table, b, who, ignoreDup); if (r === null) continue; if (r && r.__err) return json(r.status, r.body); made.push(r); }
      rows = made; status = 201;
    } else if (m === 'PATCH') {
      for (const r of rows) { const err = this.guard(table, r, Object.assign({}, body), who); if (err) return json(err.status, err.body); }
      rows.forEach(r => { Object.assign(r, body); r.updated_at = this.stamp(); });
    } else if (m === 'DELETE') {
      rows = rows.filter(r => this.canDelete(table, r, who));
      rows.forEach(r => { this.cascade(table, r); this.t[table] = this.t[table].filter(x => x !== r); });
    } else return json(405, { message: 'method' });
    if (!represent && m !== 'GET') return route.fulfill({ status: 204, headers: cors });
    const out = rows.map(r => this.pick(table, r, q.get('select')));
    if (single) { if (out.length !== 1) return json(406, { code: 'PGRST116', details: 'The result contains ' + out.length + ' rows', message: 'JSON object requested, multiple (or no) rows returned' }); return json(status, out[0]); }
    return json(status, out, m === 'GET' ? { 'content-range': (out.length ? '0-' + (out.length - 1) : '*') + '/*' } : null);
  }
}

/* ---------- the browser ---------- */
async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { const r = await fetch(BASE + '/index.html', { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {} await sleep(200); }
  throw new Error('http.server did not start');
}
async function newCtx(browser, cloud, { session, viewport = { width: 1280, height: 900 }, lang, dark, mic = true, abortWorker = false, init } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport, acceptDownloads: true });
  if (mic) await ctx.grantPermissions(['microphone'], { origin: BASE });
  await ctx.addInitScript(({ key, session, lang, dark }) => {
    if (session) localStorage.setItem(key, JSON.stringify(session));
    if (lang) localStorage.setItem('hebrewBlender_lang', lang);
    if (dark !== undefined) localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
    localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_hintSeen', '1');
  }, { key: AUTH_KEY, session: session || null, lang, dark });
  if (init) await ctx.addInitScript(init);
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u === CFG.sdk) return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    if (u.startsWith(CFG.url)) return cloud.answer(route);
    if (u.startsWith(WORKER)) { if (abortWorker) return route.abort('failed'); return cloud.answer(route); }
    // Sefaria, stubbed: Genesis 1:1-2:3 (31 + 3 verses) in the v3 shape the Trainer parses, so the reading renders
    // and the Assign dialog's verse checklist has verses; nothing else of Sefaria is answered.
    if (/^https:\/\/www\.sefaria\.org\/api\/v3\/texts\//.test(u)) {
      const vs = n => Array.from({ length: n }, (_, i) => 'בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים ' + (i + 1));
      return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify({ ref: 'Genesis 1:1-2:3', sections: ['1', '1'], versions: [{ language: 'he', text: [vs(31), vs(3)] }] }) });
    }
    return route.abort();
  });
  return ctx;
}
async function openPage(ctx, file, { query = '', waitSignedIn = true } = {}) {
  const page = await ctx.newPage();
  const errors = [], dialogs = { mode: 'accept', seen: [] }, requested = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  page.on('request', r => requested.push(r.url()));
  page.on('dialog', d => { dialogs.seen.push({ type: d.type(), message: d.message() }); if (dialogs.mode === 'dismiss') d.dismiss().catch(() => {}); else d.accept().catch(() => {}); });
  if (process.env.SMOKE_DEBUG) page.on('console', m => console.log('    [page]', m.type(), m.text().slice(0, 300)));
  await page.goto(BASE + '/' + file + query, { waitUntil: 'domcontentloaded' });
  if (waitSignedIn) await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'signed-in', null, { timeout: 20000 });
  else await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() !== 'loading', null, { timeout: 20000 }).catch(() => {});
  return { page, errors, dialogs, requested };
}
const text = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return n ? n.textContent : null; }, sel);
const visible = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return !!n && !n.hidden && n.offsetParent !== null; }, sel);
async function waitText(page, sel, re, ms = 10000) { try { await page.waitForFunction(([s, r]) => { const n = document.querySelector(s); return !!n && new RegExp(r).test(n.textContent); }, [sel, re.source], { timeout: ms }); return true; } catch (e) { return false; } }
const XSS = '<img src=x onerror="window.__xss=1">';

const cloud = new FakeCloud();
const srv = await startServer();
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const teacherSession = sessionFor(TEACHER);
let codeWord = '', assignmentId = '', studentCreds = [];
try {
  /* ───── I. the Trainer signed out ───── */
  {
    const ctx = await newCtx(browser, cloud);
    const { page, errors, requested } = await openPage(ctx, 'torah_trainer.html', { waitSignedIn: false });
    await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'anonymous', null, { timeout: 15000 });
    const r = await page.evaluate(() => ({ hidden: document.getElementById('ttAssign').hidden, display: getComputedStyle(document.getElementById('ttAssign')).display, top: document.getElementById('ttAsgTopCtrl').hidden, topDisplay: getComputedStyle(document.getElementById('ttAsgTopCtrl')).display, module: !!window.IvritAssignments, dialog: document.getElementById('ttAsgDialog').hidden }));
    check('I: signed out the student panel, its top button and the dialog stay hidden (as drawn, not only by attribute) and the module is not loaded', r.hidden && r.display === 'none' && r.top && r.topDisplay === 'none' && !r.module && r.dialog, JSON.stringify(r));
    check('I: …and the module file was never requested', !requested.some(u => u.includes('ivrit-assignments.js')));
    await page.evaluate(() => { openSettings(); setSettingsTab('teacher'); });
    const tab = await page.evaluate(() => ({ selected: document.getElementById('ttTabTeacher').getAttribute('aria-selected'), panel: !document.getElementById('ttTabPanelTeacher').hidden, out: !document.getElementById('ttTeachOut').hidden, tin: document.getElementById('ttTeachIn').hidden, note: document.getElementById('ttTeachOut').textContent }));
    check('I: the drawer\'s Teacher tab shows the sign-in note and nothing of the teacher\'s side', tab.selected === 'true' && tab.panel && tab.out && tab.tin && /Sign in with your teacher account/.test(tab.note), JSON.stringify(tab));
    await page.click('#ttTeachSignIn');
    check('I: its Sign in button closes the drawer and opens the chip\'s menu', await page.evaluate(() => !document.getElementById('settingsModal').classList.contains('open') && document.getElementById('ivacctMenu') && !document.getElementById('ivacctMenu').hidden));
    await page.keyboard.press('Escape');
    check('I: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── A. the teacher: students, a class, an assignment ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: teacherSession });
    const { page, errors, dialogs } = await openPage(ctx, 'reading_assignments.html');
    await page.waitForFunction(() => !document.getElementById('stIn').hidden, null, { timeout: 10000 });
    check('A: the teacher page shows the signed-in tiles', await visible(page, '#secStudents'));
    // a class, through the Add class dialog
    await page.click('#addClassBtn');
    check('A: Add class opens a modal dialog with the name field focused', await page.evaluate(() => !document.getElementById('clsDlg').hidden && document.getElementById('clsDlg').getAttribute('aria-modal') === 'true' && document.activeElement && document.activeElement.id === 'newClassName'));
    await page.fill('#newClassName', 'Kitah Gimel ' + XSS);
    await page.click('#newClassBtn');
    check('A: a class is created (its name rendered as text), the dialog closes and the focus returns to the button', await waitText(page, '#classStatus', /added/) && (await page.evaluate(() => document.querySelector('#classesHost strong').textContent)).includes('<img') && !(await page.evaluate(() => window.__xss)) && await page.evaluate(() => document.getElementById('clsDlg').hidden && document.activeElement && document.activeElement.id === 'addClassBtn'));
    // the username styles: a preview with last names, then cleared
    await page.selectOption('#usernameStyle', 'first.last');
    await page.fill('#namesInput', 'Ruth Cohen\nNoam\n');
    await page.click('#previewBtn');
    const styled = await page.evaluate(() => [...document.querySelectorAll('#previewHost tbody tr')].map(tr => tr.querySelectorAll('input')[1].value));
    check('A: the first.last style gives ruth.cohen, and a single name falls back to the digits', styled.length === 2 && styled[0] === 'ruth.cohen' && /^noam\.[2-9]{2}$/.test(styled[1]), JSON.stringify(styled));
    await page.locator('#previewHost button', { hasText: 'Clear the preview' }).click();
    await page.selectOption('#usernameStyle', 'first.nn');
    // students from names → preview → create
    await page.fill('#namesInput', 'Ruth ' + XSS + '\nNoam\n');
    await page.selectOption('#newClassSel', { index: 1 });
    await page.click('#previewBtn');
    const previewRows = await page.evaluate(() => [...document.querySelectorAll('#previewHost tbody tr')].map(tr => [...tr.querySelectorAll('input')].map(i => i.value)));
    check('A: the preview holds two rows with usernames and 8+ character passwords', previewRows.length === 2 && previewRows.every(r => /^[a-z0-9.]{3,30}$/.test(r[1]) && r[2].length >= 8), JSON.stringify(previewRows));
    await page.click('#previewHost button.btn:not(.ghost)');
    check('A: the accounts are created', await waitText(page, '#createStatus', /2 accounts created/), await text(page, '#createStatus'));
    const created = await page.evaluate(() => [...document.querySelectorAll('#createdHost tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent)));
    studentCreds = created.map(r => ({ name: r[0], username: r[1], password: r[2] }));
    check('A: the created table shows each name (as text), username and password once', created.length === 2 && created[0][0].includes('<img') && !(await page.evaluate(() => window.__xss)) && cloud.t.students.length === 2 && cloud.users.get(cloud.t.students[0].id).password === created.find(r => r[1] === cloud.t.students[0].username)[2], JSON.stringify(created));
    check('A: the students were put in the class', cloud.t.students.every(s => s.class_id === cloud.t.classes[0].id));
    await page.click('#createdHost button.ghost');
    check('A: Hide the passwords clears the table', !(await page.evaluate(() => document.querySelector('#createdHost tbody'))));
    const listed = await page.evaluate(() => [...document.querySelectorAll('#studentsHost tbody tr')].length);
    check('A: the students list shows both', listed === 2, listed);
    check('A: 0 pageerrors on the teacher page', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, 'A-teacher-page.png'), fullPage: true });
    await page.close();
    // the assignment, from the Trainer
    const tt = await openPage(ctx, 'torah_trainer.html', { query: '?parsha=Bereshit&scope=parsha-aliyah-1' });
    await tt.page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttTeachIn').hidden, null, { timeout: 15000 });
    check('A: a teacher sees no panel and no top button above the reading', await tt.page.evaluate(() => getComputedStyle(document.getElementById('ttAssign')).display === 'none' && getComputedStyle(document.getElementById('ttAsgTopCtrl')).display === 'none'));
    const openAssign = async () => { await tt.page.evaluate(() => { openSettings(); setSettingsTab('teacher'); }); await tt.page.click('#ttAsgAssignBtn'); };
    await tt.page.evaluate(() => { openSettings(); setSettingsTab('teacher'); });
    check('A: the drawer\'s Teacher tab shows the teacher face', await visible(tt.page, '#ttAsgAssignBtn') && await tt.page.evaluate(() => document.getElementById('ttTeachOut').hidden && document.getElementById('ttTeachStudent').hidden));
    // the look that will travel: vowel colors in the Talam scheme and transliteration on, as a teacher would set them up first
    await tt.page.evaluate(() => { settings.colorCodeNikkud = true; settings.vowelColorScheme = 'talam'; settings.showTranslit = true; saveSettings(); });
    await tt.page.click('#ttAsgAssignBtn');
    check('A: Assign closes the drawer before the dialog opens', await tt.page.evaluate(() => !document.getElementById('settingsModal').classList.contains('open')));
    const dlg = await tt.page.evaluate(() => ({ open: !document.getElementById('ttAsgDialog').hidden, modal: document.getElementById('ttAsgDialog').getAttribute('aria-modal'), reading: document.getElementById('ttAsgDlgReading').textContent, code: document.getElementById('ttAsgDlgCode').value, focused: document.activeElement && document.activeElement.id }));
    check('A: the dialog opens modal on the reading with a generated code word and the focus on the title', dlg.open && dlg.modal === 'true' && /Genesis 1:1-2:3/.test(dlg.reading) && /^[a-z]+-[a-z]+-[2-9]{2}$/.test(dlg.code) && dlg.focused === 'ttAsgDlgTitle', JSON.stringify(dlg));
    // J: the trap and Escape
    await tt.page.keyboard.press('Shift+Tab');
    check('J: Shift+Tab from the first control wraps to the last', await tt.page.evaluate(() => document.activeElement && document.activeElement.id === 'ttAsgDlgCreate'));
    await tt.page.keyboard.press('Escape');
    check('J: Escape closes the dialog and puts the focus on the gear (its opener sits in the closed drawer)', await tt.page.evaluate(() => document.getElementById('ttAsgDialog').hidden && document.activeElement && document.activeElement.id === 'gearBtn'));
    await openAssign();
    await tt.page.waitForFunction(() => document.querySelectorAll('#ttAsgDlgTarget option').length >= 3 && document.querySelectorAll('#ttAsgDlgVerses input').length === 34, null, { timeout: 10000 });
    const who = await tt.page.evaluate(() => ({ opts: [...document.querySelectorAll('#ttAsgDlgTarget option')].map(o => o.value), pickHidden: document.getElementById('ttAsgDlgStudents').hidden, verses: document.querySelectorAll('#ttAsgDlgVerses input:checked').length, note: document.getElementById('ttAsgDlgVersesNote').textContent }));
    check('A: the dialog offers everyone / the class / chosen students, and lists the 34 verses all ticked', who.opts[0] === 'code' && who.opts.some(v => v.startsWith('class:')) && who.opts[who.opts.length - 1] === 'pick' && who.pickHidden && who.verses === 34 && /34 of 34/.test(who.note), JSON.stringify(who));
    await tt.page.selectOption('#ttAsgDlgTarget', 'pick');
    check('A: Chosen students shows the checklist grouped by class with both students', await tt.page.evaluate(() => !document.getElementById('ttAsgDlgStudents').hidden && document.querySelectorAll('#ttAsgDlgStudents input').length === 2 && [...document.querySelectorAll('#ttAsgDlgStudents .tt-asg-group')].some(g => /Kitah Gimel/.test(g.textContent))));
    await tt.page.selectOption('#ttAsgDlgTarget', 'class:' + cloud.t.classes[0].id);
    await tt.page.uncheck('#ttAsgDlgVerses input[value="2:3"]');
    check('A: unticking a verse updates the count', /33 of 34/.test(await text(tt.page, '#ttAsgDlgVersesNote')));
    await tt.page.screenshot({ path: path.join(SHOTS, 'A-assign-dialog.png') });
    const look = await tt.page.evaluate(() => ({ checked: document.getElementById('ttAsgDlgLook').checked, disabled: document.getElementById('ttAsgDlgLook').disabled, summary: document.getElementById('ttAsgDlgLookSummary').textContent }));
    check('A: the look box is ticked by default and its summary names the transliteration and the vowel colors', look.checked && !look.disabled && /transliteration on/.test(look.summary) && /vowel colors on/.test(look.summary), JSON.stringify(look));
    await tt.page.fill('#ttAsgDlgTitle', 'Bereshit aliyah 1 ' + XSS);
    await tt.page.fill('#ttAsgDlgCode', 'ab');
    await tt.page.click('#ttAsgDlgCreate');
    check('A: a short code word is refused inline', await waitText(tt.page, '#ttAsgDlgNote', /at least 6/));
    await tt.page.click('#ttAsgDlgRegen');
    await tt.page.fill('#ttAsgDlgMinutes', '2');
    await tt.page.click('#ttAsgDlgCreate');
    check('A: the assignment is created and the code word shown large', await waitText(tt.page, '#ttAsgDlgDone', /code word/i) && cloud.t.assignments.length === 1, await text(tt.page, '#ttAsgDlgNote'));
    codeWord = cloud.t.assignments[0].code_word; assignmentId = cloud.t.assignments[0].id;
    check('A: the row carries the ref, the Trainer identifiers and the teacher', cloud.t.assignments[0].ref === 'Genesis 1:1-2:3' && cloud.t.assignments[0].reading.parshahKey === 'Bereshit' && cloud.t.assignments[0].teacher_id === T1 && cloud.t.assignments[0].max_minutes === 2, JSON.stringify(cloud.t.assignments[0]));
    const view = cloud.t.assignments[0].reading.view;
    check('A: …and the teacher\'s look as reading.view (the practice link\'s object: version, the two colorings, the transliteration)', view && view.v === 1 && view.colorCodeNikkud === true && view.vowelColorScheme === 'talam' && view.showTranslit === true && !('hebFont' in view), JSON.stringify(view));
    check('A: …the left-out verse as reading.skip, the class on the row, and both students enrolled', JSON.stringify(cloud.t.assignments[0].reading.skip) === '["2:3"]' && cloud.t.assignments[0].class_id === cloud.t.classes[0].id && cloud.t.assignment_members.length === 2 && cloud.t.assignment_members.every(m => m.assignment_id === assignmentId), JSON.stringify(cloud.t.assignment_members));
    const card = await tt.page.evaluate(() => ({ text: document.getElementById('ttAsgDlgDone').textContent, link: (document.querySelector('#ttAsgDlgDone code') || {}).textContent }));
    check('A: the success card says 2 students can see it and shows the deep link', /2 students can see it now/.test(card.text) && card.link === 'http://localhost:8086/torah_trainer.html?assignment=' + encodeURIComponent(codeWord), JSON.stringify(card));
    check('A: the same code word again is refused as taken', await (async () => { await tt.page.keyboard.press('Escape'); await openAssign(); await tt.page.fill('#ttAsgDlgCode', codeWord.toUpperCase()); await tt.page.click('#ttAsgDlgCreate'); return waitText(tt.page, '#ttAsgDlgNote', /already use/); })());
    await tt.page.keyboard.press('Escape');
    check('A: 0 pageerrors on the Trainer (teacher)', tt.errors.length === 0, tt.errors.join(' | '));
    await tt.page.screenshot({ path: path.join(SHOTS, 'A-trainer-teacher.png') });
    await ctx.close();
  }

  /* ───── B. the student: sign in, the code word, record, submit ───── */
  const student1 = studentCreds.find(s => /Ruth/.test(s.name)), student2 = studentCreds.find(s => /Noam/.test(s.name));
  async function studentSignIn(page, creds) {
    await page.evaluate(() => IvritAccount.openMenu());
    await page.click('[data-ivk="student"]');
    await page.fill('[data-ivk="username"]', creds.username);
    await page.fill('[data-ivk="password"]', creds.password);
    await page.click('[data-ivk="studentgo"]');
    return page.waitForFunction(() => IvritAccount.status() === 'signed-in' && IvritAccount.role() === 'student', null, { timeout: 15000 }).then(() => true, () => false);
  }
  let student1Session = null, firstTake = null;
  {
    const ctx = await newCtx(browser, cloud);
    const { page, errors } = await openPage(ctx, 'torah_trainer.html', { waitSignedIn: false });
    await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'anonymous', null, { timeout: 15000 });
    // a wrong password first
    await page.evaluate(() => IvritAccount.openMenu());
    await page.click('[data-ivk="student"]');
    await page.fill('[data-ivk="username"]', student1.username);
    await page.fill('[data-ivk="password"]', 'wrong-password-1');
    await page.click('[data-ivk="studentgo"]');
    check('B: a wrong password is refused with the student wording', await waitText(page, '.ivacct-note', /do not match/));
    await page.fill('[data-ivk="password"]', student1.password);
    const logAtSignIn = cloud.log.length;
    await page.click('[data-ivk="studentgo"]');
    check('B: the student signs in with username + password', await page.waitForFunction(() => IvritAccount.status() === 'signed-in' && IvritAccount.role() === 'student', null, { timeout: 15000 }).then(() => true, () => false), JSON.stringify({ note: await text(page, '.ivacct-note'), status: await page.evaluate(() => IvritAccount.status() + '/' + IvritAccount.role()), log: cloud.log.slice(-6) }));
    student1Session = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), AUTH_KEY);
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttAssign').hidden, null, { timeout: 15000 });
    check('B: the student panel appears above the reading once the student is in, expanded (its top button not drawn), and the Teacher tab says it is for teachers', await page.evaluate(() => getComputedStyle(document.getElementById('ttAssign')).display !== 'none' && getComputedStyle(document.getElementById('ttAsgTopCtrl')).display === 'none' && !document.getElementById('ttTeachStudent').hidden && document.getElementById('ttTeachIn').hidden));
    await page.waitForFunction(() => document.querySelectorAll('#ttAsgMine li').length === 1, null, { timeout: 10000 });
    check('B: the panel leads with "You have 1 assignment" and an Open button — enrolled by the teacher, no code typed', await page.evaluate(() => { const h = document.querySelector('#ttAsgMine h3'); const first = document.getElementById('ttAsgStudent').firstElementChild; return h && /You have 1 assignment/.test(h.textContent) && first && first.id === 'ttAsgMine' && !!document.querySelector('#ttAsgMine .btn'); }));
    await page.locator('#ttAsgMine .btn', { hasText: 'Show the reading' }).first().click();
    await page.waitForFunction(() => !document.getElementById('ttAsgCurrent').hidden && document.querySelector('#ttReading [data-vk="2:3"]'), null, { timeout: 15000 });
    await page.screenshot({ path: path.join(SHOTS, 'B-student-inbox.png') });
    check('B: the left-out verse is set aside on the page, with its tag, and the others are not', await page.evaluate(() => { const v = document.querySelector('#ttReading [data-vk="2:3"]'); const tag = v && v.querySelector('.tt-skip-tag'); return v && v.classList.contains('tt-verse-skipped') && tag && /not part of the assignment/.test(tag.textContent) && !document.querySelector('#ttReading [data-vk="1:1"]').classList.contains('tt-verse-skipped') && document.querySelectorAll('#ttReading .tt-verse-skipped').length === 1; }));
    await sleep(1500);
    check('B: the student face shows; the saves module never synced (no saves listing, no sync memory, the status line hidden)', !cloud.log.slice(logAtSignIn).some(l => l.path === '/rest/v1/saves') && await page.evaluate(() => !localStorage.getItem('ivritSuite_syncMeta2') && !document.querySelector('#cloudSavesPanel .ivsav:not([hidden])')), JSON.stringify(cloud.log.slice(logAtSignIn).filter(l => /saves/.test(l.path))));
    check('B: the chip names the student account, without an account link', await page.evaluate(() => { IvritAccount.openMenu(); const who = document.querySelector('.ivacct-who'); const acct = document.querySelector('[data-ivk="account"]'); IvritAccount.focusChip(); return who && /student account/.test(who.textContent) && !acct; }));
    await page.keyboard.press('Escape');
    await page.fill('#ttAsgCode', 'nope-nope-11');
    await page.click('#ttAsgCodeForm button[type=submit]');
    check('B: a wrong code word says so', await waitText(page, '#ttAsgStudentStatus', /No assignment matches/));
    await page.fill('#ttAsgCode', '  ' + codeWord.toUpperCase().replace(/-/g, ' ') + ' ');
    await page.click('#ttAsgCodeForm button[type=submit]');
    check('B: the right code word, with caps and spaces, opens the assignment', await waitText(page, '#ttAsgStudentStatus', /Opened:/));
    const loaded = await page.evaluate(() => ({ ref: settings.customRef, scope: settings.scope, line: document.getElementById('ttAsgCurrentLine').textContent, rec: !document.getElementById('ttRec').hidden, state: document.getElementById('ttRecState').textContent }));
    check('B: idle, the recorder draws neither the audio element nor the name-and-submit form (hidden as drawn, not only by attribute)', await page.evaluate(() => getComputedStyle(document.getElementById('ttRecAudio')).display === 'none' && getComputedStyle(document.getElementById('ttRecSubmitForm')).display === 'none'));
    check('B: the Trainer loaded the assigned range into the custom scope and shows the recorder', loaded.ref === 'Genesis 1:1-2:3' && loaded.scope === 'custom' && /up to 2 minutes/.test(loaded.line) && loaded.rec && /Ready to record/.test(loaded.state), JSON.stringify(loaded));
    check('B: the title rendered as text (no element created)', (await text(page, '#ttAsgCurrentLine')).includes('<img') && !(await page.evaluate(() => window.__xss)) && !(await page.evaluate(() => !!document.querySelector('#ttAssign img'))));
    check('B: the claim by code left the membership as it was (already enrolled)', cloud.t.assignment_members.length === 2);
    // the teacher's look: a live view, named as the teacher's, never stored
    const tv = await page.evaluate(() => ({ banner: !document.getElementById('ttLinkView').hidden, msg: document.getElementById('ttLinkViewMsg').textContent, translit: settings.showTranslit, scheme: settings.vowelColorScheme, colors: settings.colorCodeNikkud, stored: storedSettings().showTranslit, storedScheme: storedSettings().vowelColorScheme, bar: document.getElementById('ttShowTranslitBar').checked }));
    check('B: the teacher\'s look opened as a view: the banner names the teacher, transliteration and the Talam vowel colors are on screen, the stored settings untouched', tv.banner && /your teacher/.test(tv.msg) && tv.translit === true && tv.scheme === 'talam' && tv.colors === true && tv.stored === false && tv.storedScheme !== 'talam' && tv.bar, JSON.stringify(tv));
    await page.locator('#ttLinkView button', { hasText: 'Use my settings' }).click();
    await page.waitForFunction(() => document.getElementById('ttLinkView').hidden, null, { timeout: 5000 });
    check('B: Use my settings puts the student\'s own look back', await page.evaluate(() => settings.showTranslit === false && settings.colorCodeNikkud === false && !document.getElementById('ttShowTranslitBar').checked));
    // record
    await page.click('#ttRecStart');
    check('B: recording starts, the live line counts, the focus is on Stop', await waitText(page, '#ttRecState', /Recording… 0:0[1-9]/, 8000) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'ttRecStop'), await text(page, '#ttRecState'));
    // Hide while recording: the panel folds to the top button, which shows the clock; the recording goes on
    await page.click('#ttAsgHideBtn');
    const folded = await page.evaluate(() => ({ hidden: getComputedStyle(document.getElementById('ttAssign')).display === 'none', top: getComputedStyle(document.getElementById('ttAsgTopCtrl')).display !== 'none', expanded: document.getElementById('ttAsgTopBtn').getAttribute('aria-expanded'), label: document.getElementById('ttAsgTopBtn').textContent, focus: document.activeElement && document.activeElement.id, stored: localStorage.getItem('hebrewTorahTrainer_assignCollapsed') }));
    check('B: Hide folds the panel to the top button, which takes the focus, says aria-expanded=false, carries the count and mirrors the recording clock', folded.hidden && folded.top && folded.expanded === 'false' && /Reading assignments \(1\) · Recording… 0:0[1-9]/.test(folded.label) && folded.focus === 'ttAsgTopBtn' && folded.stored === '1', JSON.stringify(folded));
    await sleep(1200);
    check('B: …and the mirrored clock keeps counting', /Recording… 0:0[2-9]/.test(await text(page, '#ttAsgTopBtn')), await text(page, '#ttAsgTopBtn'));
    await page.click('#ttAsgTopBtn');
    check('B: the top button brings the panel back with the focus on its title and the recording still running', await page.evaluate(() => !document.getElementById('ttAssign').hidden && document.getElementById('ttAsgTopCtrl').hidden && document.activeElement && document.activeElement.id === 'ttAssignTitle' && /Recording…/.test(document.getElementById('ttRecState').textContent) && !localStorage.getItem('hebrewTorahTrainer_assignCollapsed')));
    await page.click('#ttRecStop');
    check('B: stopping yields a take, the line says so, the name field gets the focus with a default name', await waitText(page, '#ttRecState', /Recorded 0:0[1-9]/, 8000) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'ttRecTitleIn' && /recording/.test(document.getElementById('ttRecTitleIn').value) && !document.getElementById('ttRecSubmitForm').hidden), await text(page, '#ttRecState'));
    await page.click('#ttRecPlay');
    check('B: Play it back shows the audio element with a blob source, and the name-and-submit form is drawn', await page.evaluate(() => { const a = document.getElementById('ttRecAudio'); return !a.hidden && getComputedStyle(a).display !== 'none' && /^blob:/.test(a.src) && getComputedStyle(document.getElementById('ttRecSubmitForm')).display === 'flex'; }));
    await page.fill('#ttRecTitleIn', 'Ruth reads Bereshit ' + XSS);
    const announced = [];
    await page.exposeFunction('__announce', (t) => announced.push(t));
    await page.evaluate(() => { const n = document.getElementById('ttRecState'); new MutationObserver(() => window.__announce(n.textContent)).observe(n, { childList: true, characterData: true, subtree: true }); });
    await page.click('#ttRecSubmit');
    check('B: the upload completes and the line says Submitted', await waitText(page, '#ttRecState', /Submitted!/, 15000), await text(page, '#ttRecState'));
    check('B: the live line announced uploading with a percentage', announced.some(t => /Uploading… \d+%/.test(t)), JSON.stringify(announced));
    const sub = cloud.t.submissions[0];
    firstTake = sub;
    check('B: the row is uploaded with the true size, the object stored under the row\'s key, the type webm', sub && sub.upload_status === 'uploaded' && sub.size_bytes > 0 && cloud.objects.has(sub.r2_key) && cloud.objects.get(sub.r2_key).bytes.length === sub.size_bytes && /^audio\/webm/.test(sub.mime_type) && sub.duration_seconds >= 1, JSON.stringify(sub));
    check('B: My recordings lists it as Submitted, with the title as text', await waitText(page, '#ttAsgMine', /Submitted/) && (await text(page, '#ttAsgMine')).includes('<img') && !(await page.evaluate(() => window.__xss)));
    check('B: the focus returned to Record', await page.evaluate(() => document.activeElement && document.activeElement.id === 'ttRecStart'));
    // the fold is remembered on this device across a reload
    await page.click('#ttAsgHideBtn');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttAsgTopCtrl').hidden, null, { timeout: 15000 });
    check('B: after a reload the panel is still folded and the button says so, with the count', await page.evaluate(() => document.getElementById('ttAssign').hidden && /^Reading assignments( \(1\))?$/.test(document.getElementById('ttAsgTopBtn').textContent) && document.getElementById('ttAsgTopBtn').getAttribute('aria-expanded') === 'false'));
    await page.click('#ttAsgTopBtn');
    check('B: 0 pageerrors (student)', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, 'B-student.png') });
    await ctx.close();
  }

  /* ───── L. the deep link: signed out it asks for the student sign-in; signed in it opens the assignment ───── */
  {
    const ctx = await newCtx(browser, cloud);
    const { page, errors } = await openPage(ctx, 'torah_trainer.html', { query: '?assignment=' + encodeURIComponent(codeWord.toUpperCase()), waitSignedIn: false });
    await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'anonymous', null, { timeout: 15000 });
    await page.screenshot({ path: path.join(SHOTS, 'L-deep-link-signed-out.png') });
    check('L: signed out, the link shows the sign-in note and nothing else of the feature', await page.evaluate(() => getComputedStyle(document.getElementById('ttAsgLinkNote')).display !== 'none' && getComputedStyle(document.getElementById('ttAssign')).display === 'none' && !window.IvritAssignments));
    await page.click('#ttAsgLinkSignIn');
    check('L: its Sign in button opens the chip on the student form with the username focused', await page.evaluate(() => document.getElementById('ivacctMenu') && !document.getElementById('ivacctMenu').hidden && document.activeElement && document.activeElement.getAttribute('data-ivk') === 'username'));
    await page.fill('[data-ivk="username"]', student1.username);
    await page.fill('[data-ivk="password"]', student1.password);
    await page.click('[data-ivk="studentgo"]');
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttAsgCurrent').hidden && /Bereshit aliyah 1/.test(document.getElementById('ttAsgCurrentLine').textContent), null, { timeout: 20000 });
    check('L: after the sign-in the assignment opened by itself, the note is gone and the address no longer carries the code', await page.evaluate(() => getComputedStyle(document.getElementById('ttAsgLinkNote')).display === 'none' && !new URLSearchParams(location.search).has('assignment') && settings.customRef === 'Genesis 1:1-2:3'));
    check('L: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── B2. keyboard-only, from the signed-in state, as the second student ───── */
  {
    const ctx = await newCtx(browser, cloud);
    const { page, errors } = await openPage(ctx, 'torah_trainer.html', { waitSignedIn: false });
    await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'anonymous', null, { timeout: 15000 });
    // a hostile look on the row (another device could write any JSON): every value passes the link's validators or is dropped
    const goodView = cloud.t.assignments[0].reading.view;
    cloud.t.assignments[0].reading.view = JSON.parse('{"v":1,"showTranslit":true,"hebFont":"<img src=x onerror=window.__xss=1>","layout":"javascript:alert(1)","bogus":"<script>","colorCodeNikkud":true,"nikudColorOverrides":{"patach":"javascript:alert(1)","__proto__":{"polluted":1}},"hebFontSize":"9999"}');
    // the chip by keyboard: Tab to it, Enter opens, ArrowDown walks to the student button
    const tabTo = async (pred, max = 60) => { for (let i = 0; i < max; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(pred)) return true; } return false; };
    check('K: Tab reaches the account chip', await tabTo(() => document.activeElement && document.activeElement.classList.contains('ivacct-btn')));
    await page.keyboard.press('Enter');
    check('K: Enter opens the menu with the focus inside', await page.evaluate(() => document.getElementById('ivacctMenu') && !document.getElementById('ivacctMenu').hidden && document.getElementById('ivacctMenu').contains(document.activeElement)));
    let found = false; for (let i = 0; i < 8 && !found; i++) { if (await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-ivk') === 'student')) found = true; else await page.keyboard.press('Tab'); }
    check('K: Tab (inside the menu) reaches the student option', found);
    await page.keyboard.press('Enter');
    check('K: the username field is focused', await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-ivk') === 'username'));
    await page.keyboard.type(student2.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(student2.password);
    await page.keyboard.press('Enter');
    check('K: Enter signs the student in', await page.waitForFunction(() => IvritAccount.status() === 'signed-in' && IvritAccount.role() === 'student', null, { timeout: 15000 }).then(() => true, () => false));
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttAssign').hidden, null, { timeout: 15000 });
    check('K: Tab reaches the code word field', await tabTo(() => document.activeElement && document.activeElement.id === 'ttAsgCode'));
    await page.keyboard.type(codeWord);
    await page.keyboard.press('Enter');
    check('K: Enter opens the assignment', await waitText(page, '#ttAsgStudentStatus', /Opened:/));
    const hv = await page.evaluate(() => ({ translit: settings.showTranslit, font: settings.hebFont, layout: settings.layout, size: settings.hebFontSize, over: JSON.stringify(settings.nikudColorOverrides || {}), polluted: 'polluted' in {}, xss: !!window.__xss, img: !!document.querySelector('#ttReading img, .tt-page img[src="x"]') }));
    check('K: the hostile look kept only what passes the validators (transliteration on; the font, layout, size and colors untouched; no prototype pollution, no element)', hv.translit === true && !/img/.test(String(hv.font)) && hv.layout !== 'javascript:alert(1)' && Number(hv.size) < 9999 && !/javascript/.test(hv.over) && !hv.polluted && !hv.xss && !hv.img, JSON.stringify(hv));
    cloud.t.assignments[0].reading.view = goodView;
    check('K: Tab reaches Record', await tabTo(() => document.activeElement && document.activeElement.id === 'ttRecStart'));
    await page.keyboard.press('Space');
    check('K: Space starts recording and the focus lands on Stop', await waitText(page, '#ttRecState', /Recording…/, 8000) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'ttRecStop'));
    await sleep(1200);
    await page.keyboard.press('Space');
    check('K: Space stops it and the name field takes the focus', await waitText(page, '#ttRecState', /Recorded/, 8000) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'ttRecTitleIn'));
    await page.keyboard.press('Control+A'); await page.keyboard.type('Noam take 1');
    await page.keyboard.press('Enter');
    check('K: Enter submits; the line says Submitted; the focus is back on Record', await waitText(page, '#ttRecState', /Submitted!/, 15000) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'ttRecStart'));
    check('K: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── C. the teacher reviews; the student re-records; approval ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: teacherSession });
    const { page, errors, dialogs } = await openPage(ctx, 'reading_assignments.html');
    // the class view: both students submitted; a third student, not enrolled, gets an Add button
    await page.waitForFunction(() => document.querySelectorAll('#cvHost tbody tr').length === 2, null, { timeout: 15000 });
    const grid = await page.evaluate(() => [...document.querySelectorAll('#cvHost tbody tr')].map(tr => [tr.querySelector('th').textContent, tr.querySelector('td .badge') ? tr.querySelector('td .badge').textContent : null, !!tr.querySelector('a[href*="assignTo="]')]));
    check('C: the class view lists both students as Submitted, each with Assign a new reading…', grid.length === 2 && grid.every(r => r[1] === 'Submitted' && r[2]), JSON.stringify(grid));
    cloud.manageStudents({ action: 'create', students: [{ display_name: 'Tal', username: 'tal.r', password: 'river-cat-55' }] }, { id: T1, role: 'teacher' });
    await page.click('#studentsRefresh');
    await page.waitForFunction(() => document.querySelectorAll('#cvHost tbody tr').length === 3, null, { timeout: 15000 });
    check('C: the new student\'s cell offers Add', await page.evaluate(() => { const tr = [...document.querySelectorAll('#cvHost tbody tr')].find(r => r.querySelector('th').textContent === 'Tal'); return tr && tr.querySelector('td .btn') && /Add/.test(tr.querySelector('td .btn').textContent) && /Add Tal to/.test(tr.querySelector('td .btn').getAttribute('aria-label')); }));
    await page.locator('#cvHost tbody tr', { hasText: 'Tal' }).locator('td .btn').first().click();
    check('C: Add enrols the student (a membership row) and the cell turns to Assigned', await waitText(page, '#cvStatus', /Tal was added to/) && cloud.t.assignment_members.some(m => m.student_id === cloud.t.students.find(s => s.username === 'tal.r').id) && await page.evaluate(() => { const tr = [...document.querySelectorAll('#cvHost tbody tr')].find(r => r.querySelector('th').textContent === 'Tal'); return tr && tr.querySelector('td .badge') && tr.querySelector('td .badge').textContent === 'Assigned'; }));
    await page.screenshot({ path: path.join(SHOTS, 'C-teacher-page-grid.png'), fullPage: true });
    // a second Noam: both Noams carry their username in the grid, Tal stays plain
    cloud.manageStudents({ action: 'create', students: [{ display_name: 'Noam', username: 'noam.second', password: 'river-cat-56' }] }, { id: T1, role: 'teacher' });
    await page.click('#studentsRefresh');
    await page.waitForFunction(() => document.querySelectorAll('#cvHost tbody tr').length === 4, null, { timeout: 15000 });
    const labels = await page.evaluate(() => [...document.querySelectorAll('#cvHost tbody tr th')].map(th => th.textContent));
    check('C: duplicated display names show their usernames in the class view; unique names stay plain', labels.filter(l => /^Noam · noam\./.test(l)).length === 2 && labels.includes('Tal'), JSON.stringify(labels));
    check('C: the assignment row counts 3 students enrolled and offers Copy link', await page.evaluate(() => /3 students enrolled/.test(document.getElementById('asgHost').textContent) && [...document.querySelectorAll('#asgHost .btn')].some(b => b.textContent === 'Copy link')));
    await page.waitForFunction(() => document.querySelectorAll('#asgHost .sub-row').length === 1, null, { timeout: 10000 });
    const listLine = await text(page, '#asgHost');
    check('C: the assignment is listed with its code word, 2 submitted and the title as text', listLine.includes(codeWord) && /2 submitted/.test(listLine) && listLine.includes('<img') && !(await page.evaluate(() => window.__xss)), listLine.slice(0, 200));
    await page.click('#asgHost .sub-row .btn:not(.ghost)');
    await page.waitForFunction(() => document.querySelectorAll('#subsHost .sub-row').length === 2, null, { timeout: 10000 });
    check('C: the recordings section takes the focus and lists two students; nobody is missing', await page.evaluate(() => document.activeElement && document.activeElement.id === 'secSubs') && /All 2 have submitted/.test(await text(page, '#notSubHost')));
    const ruthRow = page.locator('#subsHost .sub-row', { hasText: 'Ruth' }).first();
    await ruthRow.locator('.sub-audio .btn').click();
    check('C: Play fetches the audio and shows a player with a blob source (no URL exposed)', await ruthRow.locator('audio').evaluate(a => /^blob:/.test(a.src) && a.controls).catch(() => false));
    await ruthRow.locator('textarea').fill('Lovely start. Slow down on the trope. ' + XSS);
    await ruthRow.locator('input[type=checkbox]').check();
    await ruthRow.locator('.fb .btn:not(.ghost)').click();
    check('C: feedback with a re-record request is saved and the row shows the badge', await waitText(page, '#subsHost', /re-recording requested/) && cloud.t.feedback.length === 1 && cloud.t.submissions.find(s => s.student_id === cloud.t.students.find(x => /Ruth/.test(cloud.t.profiles.find(p => p.id === x.id).display_name)).id).status === 'needs_rerecord');
    check('C: the feedback text renders as text', (await text(page, '#subsHost')).includes('<img') && !(await page.evaluate(() => window.__xss)) && !(await page.evaluate(() => !!document.querySelector('#subsHost img'))));
    check('C: 0 pageerrors (review)', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, 'C-review.png'), fullPage: true });
    await ctx.close();
  }
  {
    const ctx = await newCtx(browser, cloud, { session: student1Session });
    const { page, errors } = await openPage(ctx, 'torah_trainer.html');
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttAssign').hidden, null, { timeout: 15000 });
    check('C: the student sees the request and the teacher\'s words', await waitText(page, '#ttAsgMine', /asked for a re-recording/) && /Slow down on the trope/.test(await text(page, '#ttAsgMine')));
    await page.locator('#ttAsgMine .btn', { hasText: 'Re-record' }).click();
    check('C: Re-record loads the assignment and focuses Record', await page.waitForFunction(() => !document.getElementById('ttAsgCurrent').hidden && document.activeElement && document.activeElement.id === 'ttRecStart', null, { timeout: 10000 }).then(() => true, () => false));
    await page.click('#ttRecStart'); await waitText(page, '#ttRecState', /Recording…/, 8000); await sleep(1200); await page.click('#ttRecStop'); await waitText(page, '#ttRecState', /Recorded/, 8000);
    await page.fill('#ttRecTitleIn', 'Ruth take 2');
    await page.click('#ttRecSubmit');
    check('C: take 2 is submitted', await waitText(page, '#ttRecState', /Submitted!/, 15000));
    const ruth = cloud.t.students.find(x => /Ruth/.test(cloud.t.profiles.find(p => p.id === x.id).display_name));
    const takes = cloud.t.submissions.filter(s => s.student_id === ruth.id);
    check('C: version 2 is current, version 1 kept but not current, both objects stored', takes.length === 2 && takes[0].version === 1 && !takes[0].is_current && takes[1].version === 2 && takes[1].is_current && takes[1].status === 'submitted' && cloud.objects.has(takes[1].r2_key));
    check('C: My recordings now says Submitted for take 2', await waitText(page, '#ttAsgMine', /take 2/) && /Submitted/.test(await text(page, '#ttAsgMine')));
    check('C: 0 pageerrors (re-record)', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  {
    const ctx = await newCtx(browser, cloud, { session: teacherSession });
    const { page, errors } = await openPage(ctx, 'reading_assignments.html');
    await page.waitForFunction(() => document.querySelectorAll('#asgHost .sub-row').length === 1, null, { timeout: 10000 });
    await page.click('#asgHost .sub-row .btn:not(.ghost)');
    await page.waitForFunction(() => document.querySelectorAll('#subsHost .sub-row').length >= 2, null, { timeout: 10000 });
    await page.selectOption('#subsFilter', 'all');
    check('C: Every version shows three rows, one marked older', await page.evaluate(() => document.querySelectorAll('#subsHost .sub-row').length === 3 && /older version/.test(document.getElementById('subsHost').textContent)));
    await page.selectOption('#subsFilter', 'current');
    const ruthRow = page.locator('#subsHost .sub-row', { hasText: 'Ruth take 2' }).first();
    await ruthRow.locator('.fb .btn.ghost', { hasText: 'Approve' }).click();
    check('C: Approve marks take 2 approved', await waitText(page, '#subsHost', /approved/) && cloud.t.submissions.find(s => s.title === 'Ruth take 2').status === 'approved');
    check('C: 0 pageerrors (approve)', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── C2. the Assign dialog's checklist tells the two Noams apart ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: teacherSession });
    const { page, errors } = await openPage(ctx, 'torah_trainer.html', { query: '?parsha=Bereshit&scope=parsha-aliyah-1' });
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttTeachIn').hidden, null, { timeout: 15000 });
    await page.evaluate(() => { openSettings(); setSettingsTab('teacher'); });
    await page.click('#ttAsgAssignBtn');
    await page.waitForFunction(() => document.querySelectorAll('#ttAsgDlgStudents input').length === 4, null, { timeout: 10000 });
    const names = await page.evaluate(() => [...document.querySelectorAll('#ttAsgDlgStudents label')].map(l => l.textContent.trim()));
    check('C2: the checklist names both Noams with their usernames and Tal plainly', names.filter(n => /^Noam · noam\./.test(n)).length === 2 && names.includes('Tal'), JSON.stringify(names));
    await page.keyboard.press('Escape');
    check('C2: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── D. classmates may listen ───── */
  async function peersView(session) {
    const ctx = await newCtx(browser, cloud, { session });
    const { page, errors } = await openPage(ctx, 'torah_trainer.html');
    await page.waitForFunction(() => window.IvritAssignments && document.querySelectorAll('#ttAsgMine li').length >= 1, null, { timeout: 15000 });
    await page.locator('#ttAsgMine .btn', { hasText: 'Show the reading' }).first().click();
    await sleep(800);
    const r = { peers: await text(page, '#ttAsgPeers'), hasAudioBtn: await page.evaluate(() => !!document.querySelector('#ttAsgPeers .btn')), errors: errors.length };
    await ctx.close();
    return r;
  }
  {
    const noam = cloud.t.students.find(x => /Noam/.test(cloud.t.profiles.find(p => p.id === x.id).display_name));
    const { password, ...pub } = cloud.users.get(noam.id);
    const noamSession = sessionFor(pub);
    let v = await peersView(noamSession);
    check('D: with classmates off, the second student sees no classmates section', !v.peers && v.errors === 0, JSON.stringify(v));
    cloud.t.assignments[0].peers_can_listen = true;
    v = await peersView(noamSession);
    check('D: with classmates on, the second student sees the first\'s current take by title, never the feedback', /Ruth take 2/.test(v.peers) && !/take 1|Ruth reads/.test(v.peers) && !/Slow down/.test(v.peers) && v.hasAudioBtn, JSON.stringify(v));
    // the Worker lets the classmate fetch it, and refuses the older take
    const ctx = await newCtx(browser, cloud, { session: noamSession });
    const { page } = await openPage(ctx, 'torah_trainer.html');
    await page.waitForFunction(() => window.IvritAssignments, null, { timeout: 15000 });
    const ruthTakes = cloud.t.submissions.filter(s => s.title.startsWith('Ruth'));
    const fetched = await page.evaluate(async (ids) => { const out = {}; for (const [k, id] of Object.entries(ids)) { try { const b = await IvritAssignments.audio(id); out[k] = b.size; } catch (e) { out[k] = e.code; } } return out; }, { current: ruthTakes[1].id, older: ruthTakes[0].id });
    check('D: the classmate fetches the current take and is refused the older one', fetched.current > 0 && fetched.older === 'not_found', JSON.stringify(fetched));
    await ctx.close();
    cloud.t.assignments[0].peers_can_listen = false;
    v = await peersView(noamSession);
    check('D: off again, nothing', !v.peers, JSON.stringify(v));
  }

  /* ───── E. delete and download all ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: teacherSession });
    const { page, errors, dialogs } = await openPage(ctx, 'reading_assignments.html');
    await page.waitForFunction(() => document.querySelectorAll('#asgHost .sub-row').length === 1, null, { timeout: 10000 });
    await page.click('#asgHost .sub-row .btn:not(.ghost)');
    await page.waitForFunction(() => document.querySelectorAll('#subsHost .sub-row').length >= 2, null, { timeout: 10000 });
    const before = cloud.objects.size;
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#subsZip')]);
    const zipPath = await download.path();
    const zip = fs.readFileSync(zipPath);
    const entries = zip.toString('latin1').split('PK\x01\x02').length - 1;
    check('E: Download all produces a zip with a CSV and one file per uploaded recording (every version)', /\.zip$/.test(download.suggestedFilename()) && entries === cloud.t.submissions.filter(x => x.upload_status === 'uploaded').length + 1 && zip.toString('latin1').includes('recordings.csv') && /-v1\.webm/.test(zip.toString('latin1')) && /-v2\.webm/.test(zip.toString('latin1')), `${download.suggestedFilename()} ${entries} entries`);
    const noamRow = page.locator('#subsHost .sub-row', { hasText: 'Noam' }).first();
    await noamRow.locator('.btn', { hasText: 'Delete recording' }).click();
    check('E: deleting a recording asks, then removes the row and its object', await waitText(page, '#subsStatus', /deleted/) && dialogs.seen.some(d => d.type === 'confirm' && /Delete/.test(d.message)) && cloud.objects.size === before - 1 && !cloud.t.submissions.some(s => s.title === 'Noam take 1'));
    check('E: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── F. error states ───── */
  {
    const open = async (opts) => { const ctx = await newCtx(browser, cloud, Object.assign({ session: student1Session }, opts)); const r = await openPage(ctx, 'torah_trainer.html'); await r.page.waitForFunction(() => window.IvritAssignments && document.querySelectorAll('#ttAsgMine li').length >= 1, null, { timeout: 15000 }); await r.page.locator('#ttAsgMine .btn', { hasText: 'Show the reading' }).first().click(); await r.page.waitForFunction(() => !document.getElementById('ttAsgCurrent').hidden, null, { timeout: 5000 }); return { ctx, ...r }; };
    cloud.t.submissions.find(s => s.title === 'Ruth take 2').status = 'submitted';   // the student may record again in F
    // mic denied
    let r = await open({ init: () => { const g = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); } });
    await r.page.click('#ttRecStart');
    check('F: a denied microphone is explained, with how to allow it', await waitText(r.page, '#ttAsgStudentStatus', /microphone is blocked/) && /Ready to record/.test(await text(r.page, '#ttRecState')));
    await r.ctx.close();
    // no MediaRecorder
    r = await open({ init: () => { delete window.MediaRecorder; Object.defineProperty(window, 'MediaRecorder', { value: undefined, configurable: true }); } });
    await r.page.click('#ttRecStart');
    check('F: a browser without MediaRecorder is told so', await waitText(r.page, '#ttAsgStudentStatus', /cannot record audio/));
    await r.ctx.close();
    // the upload server fails once, then Retry succeeds
    r = await open({});
    await r.page.click('#ttRecStart'); await waitText(r.page, '#ttRecState', /Recording…/, 8000); await sleep(1100); await r.page.click('#ttRecStop'); await waitText(r.page, '#ttRecState', /Recorded/, 8000);
    cloud.workerFail = (p) => /^\/upload\//.test(p) ? 500 : 0;
    await r.page.fill('#ttRecTitleIn', 'Ruth take 3'); await r.page.click('#ttRecSubmit');
    check('F: a failed upload says Not submitted, keeps the take, offers Retry with the focus on it', await waitText(r.page, '#ttRecState', /Not submitted/, 15000) && await r.page.evaluate(() => !document.getElementById('ttRecRetry').hidden && document.activeElement && document.activeElement.id === 'ttRecRetry'), await text(r.page, '#ttRecState'));
    const pendingBefore = cloud.t.submissions.filter(s => s.upload_status === 'pending').length;
    await r.page.click('#ttRecRetry');
    check('F: Retry uploads the same pending row (no second row)', await waitText(r.page, '#ttRecState', /Submitted!/, 15000) && cloud.t.submissions.filter(s => s.upload_status === 'pending').length === pendingBefore - 1 && cloud.t.submissions.filter(s => s.title === 'Ruth take 3').length === 1);
    await r.ctx.close();
    // the server unreachable
    r = await open({ abortWorker: true });
    await r.page.click('#ttRecStart'); await waitText(r.page, '#ttRecState', /Recording…/, 8000); await sleep(1100); await r.page.click('#ttRecStop'); await waitText(r.page, '#ttRecState', /Recorded/, 8000);
    await r.page.fill('#ttRecTitleIn', 'Ruth take 4'); await r.page.click('#ttRecSubmit');
    check('F: an unreachable server is reported as a connection problem, with Retry', await waitText(r.page, '#ttRecState', /internet connection/, 15000) && await r.page.evaluate(() => !document.getElementById('ttRecRetry').hidden));
    await r.ctx.close();
    cloud.t.submissions.filter(s => s.upload_status === 'pending').forEach(s => { cloud.cascade('submissions', s); cloud.t.submissions = cloud.t.submissions.filter(x => x !== s); });   // what the reconcile would do
    // a rate-limited sign-in
    const ctx = await newCtx(browser, cloud);
    const p2 = await openPage(ctx, 'torah_trainer.html', { waitSignedIn: false });
    await p2.page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'anonymous', null, { timeout: 15000 });
    cloud.tokenStatus = 429;
    await p2.page.evaluate(() => IvritAccount.openMenu()); await p2.page.click('[data-ivk="student"]'); await p2.page.fill('[data-ivk="username"]', student1.username); await p2.page.fill('[data-ivk="password"]', student1.password); await p2.page.click('[data-ivk="studentgo"]');
    check('F: a rate-limited sign-in says to wait, and the password field is cleared', await waitText(p2.page, '.ivacct-note', /Too many attempts/) && (await p2.page.inputValue('[data-ivk="password"]')) === '');
    await ctx.close();
    // the lockout after ten misses
    r = await open({});
    for (let i = 0; i < 10; i++) { await r.page.fill('#ttAsgCode', 'miss-miss-' + (20 + i)); await r.page.click('#ttAsgCodeForm button[type=submit]'); await waitText(r.page, '#ttAsgStudentStatus', /No assignment matches/); }
    await r.page.fill('#ttAsgCode', codeWord); await r.page.click('#ttAsgCodeForm button[type=submit]');
    check('F: ten misses lock the code word out with its own message', await waitText(r.page, '#ttAsgStudentStatus', /Too many tries/));
    cloud.t.code_attempts = [];
    await r.ctx.close();
  }

  /* ───── H. privilege attempts through the fake, as the student ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: student1Session });
    const { page } = await openPage(ctx, 'torah_trainer.html');
    await page.waitForFunction(() => window.IvritAssignments, null, { timeout: 15000 });
    const noamId = cloud.t.students.find(x => /Noam/.test(cloud.t.profiles.find(p => p.id === x.id).display_name)).id;
    const ruthId = cloud.t.students.find(x => /Ruth/.test(cloud.t.profiles.find(p => p.id === x.id).display_name)).id;
    const mine = cloud.t.submissions.find(s => s.student_id === ruthId && s.is_current);
    const r = await page.evaluate(async ({ noamId, mineId, aid, ownIds }) => {
      const c = await IvritAccount.client();
      const out = {};
      const role = await c.from('profiles').update({ role: 'teacher' }).eq('id', IvritAccount.user().id).select('id, role');
      out.role = role.error ? role.error.code : (role.data && role.data.length ? 'changed' : 'filtered');
      const approve = await c.from('submissions').update({ status: 'approved' }).eq('id', mineId).select('id, status');
      out.approve = approve.error ? approve.error.code : 'changed';
      const key = await c.from('submissions').update({ r2_key: 'submissions/x/y/z.webm' }).eq('id', mineId).select('id');
      out.key = key.error ? key.error.code : 'changed';
      const other = await c.from('submissions').select('id').eq('student_id', noamId);
      out.otherRows = other.data ? other.data.length : 'err';
      const asOther = await c.from('submissions').insert({ assignment_id: aid, student_id: noamId, title: 'forged', mime_type: 'audio/webm' }).select('id');
      out.forge = asOther.error ? asOther.error.code : 'inserted';
      const member = await c.from('assignment_members').insert({ assignment_id: aid, student_id: IvritAccount.user().id }).select('*');
      out.member = member.error ? member.error.code : 'inserted';
      const byCode = await c.from('assignments').select('id').neq('id', aid);
      out.byCode = byCode.data ? byCode.data.length : 'err';
      const profiles = await c.from('profiles').select('id, display_name').eq('id', noamId);
      out.peerProfile = profiles.data ? profiles.data.length : 'err';
      const fb = await c.from('feedback').select('*');
      out.feedbackRows = fb.data ? fb.data.filter(f => !ownIds.includes(f.submission_id)).length : 'err';
      try { await IvritAssignments.upload(mineId, new Blob([new Uint8Array(10)], { type: 'audio/webm' }), { mime: 'audio/webm', duration: 1 }); out.reupload = 'accepted'; } catch (e) { out.reupload = e.code; }
      return out;
    }, { noamId, mineId: mine.id, aid: assignmentId, ownIds: cloud.t.submissions.filter(s => s.student_id === ruthId).map(s => s.id) });
    check('H: the student cannot change their role, approve, rename the key, read a classmate\'s rows (peers off), forge a row, insert a membership, see other assignments, read a peer\'s profile, read others\' feedback, or re-upload an uploaded take',
      r.role === '42501' && r.approve === '42501' && r.key === '42501' && r.otherRows === 0 && r.forge === '42501' && r.member === '42501' && r.byCode === 0 && r.peerProfile === 0 && r.feedbackRows === 0 && r.reupload === 'not_accepted', JSON.stringify(r));
    await ctx.close();
  }

  /* ───── M. bulk passwords: one for everyone shown, then a new one each ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: teacherSession });
    const { page, errors } = await openPage(ctx, 'reading_assignments.html');
    await page.waitForFunction(() => document.querySelectorAll('#studentsHost tbody tr').length === 4, null, { timeout: 15000 });
    await page.click('#bulkOneBtn');
    const pd = await page.evaluate(() => ({ open: !document.getElementById('pwDlg').hidden, note: document.getElementById('pwDlgNote').textContent, pw: document.getElementById('pwDlgIn').value, focused: document.activeElement && document.activeElement.id }));
    await page.screenshot({ path: path.join(SHOTS, 'M-one-password-dialog.png') });
    check('M: the one-password dialog opens on the password field, prefilled, naming the 4 students shown', pd.open && /All 4 students shown/.test(pd.note) && pd.pw.length >= 8 && pd.focused === 'pwDlgIn', JSON.stringify(pd));
    await page.fill('#pwDlgIn', 'class-pass-77');
    await page.click('#pwDlgGo');
    check('M: every shown student gets the one password, shown once in the logins table', await waitText(page, '#studentsStatus', /4 passwords set/) && await page.evaluate(() => document.getElementById('pwDlg').hidden && [...document.querySelectorAll('#createdHost tbody tr')].length === 4 && [...document.querySelectorAll('#createdHost tbody tr td:last-child')].every(td => td.textContent === 'class-pass-77')) && cloud.t.students.every(s => cloud.users.get(s.id).password === 'class-pass-77'));
    await page.click('#bulkEachBtn');
    await waitText(page, '#studentsStatus', /4 passwords set/);
    const each = cloud.t.students.map(s => cloud.users.get(s.id).password);
    check('M: New password for each gives three different random passphrases, listed for printing', new Set(each).size === 4 && each.every(p => /^[a-z]+-[a-z]+-[2-9]{2}$/.test(p)) && await page.evaluate(() => [...document.querySelectorAll('#createdHost tbody tr')].length === 4), JSON.stringify(each));
    check('M: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ───── J. names and live regions; Hebrew + dark at 800px ───── */
  {
    const ctx = await newCtx(browser, cloud, { session: student1Session, lang: 'he', dark: true, viewport: { width: 800, height: 900 } });
    const { page, errors } = await openPage(ctx, 'torah_trainer.html');
    await page.waitForFunction(() => window.IvritAssignments && !document.getElementById('ttAssign').hidden, null, { timeout: 15000 });
    await page.locator('#ttAsgMine .btn').first().click().catch(() => {});
    await sleep(500);
    const a11y = await page.evaluate(() => {
      const name = (n) => (n.getAttribute('aria-label') || n.textContent || '').trim();
      const buttons = [...document.querySelectorAll('#ttAssign button, #ttAsgDialog button')];
      const unnamed = buttons.filter(b => !name(b)).map(b => b.id || b.className);
      const inputs = [...document.querySelectorAll('#ttAssign input, #ttAsgDialog input, #ttAsgDialog select')];
      const unlabeled = inputs.filter(i => !i.getAttribute('aria-label') && !i.closest('label') && !document.querySelector('label[for="' + i.id + '"]')).map(i => i.id);
      const live = ['ttRecState', 'ttAsgStudentStatus', 'ttAsgDlgNote'].map(id => { const n = document.getElementById(id); return n && n.getAttribute('aria-live') === 'polite'; });
      return { unnamed, unlabeled, live, dir: document.documentElement.dir, dark: document.body.classList.contains('dark'), overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, raw: /\b(torah|assign|shared)\.[a-z_]+\.[a-z_]+/.test(document.getElementById('ttAssign').innerText) };
    });
    check('J: every button and field in the region and dialog is named; the live regions are polite', a11y.unnamed.length === 0 && a11y.unlabeled.length === 0 && a11y.live.every(Boolean), JSON.stringify(a11y));
    check('J: Hebrew RTL, dark, 800px: no overflow, no raw keys', a11y.dir === 'rtl' && a11y.dark && !a11y.overflow && !a11y.raw, JSON.stringify(a11y));
    check('J: 0 pageerrors (he, dark)', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, 'J-he-dark.png') });
    await ctx.close();
    const ctx2 = await newCtx(browser, cloud, { session: teacherSession, lang: 'he', dark: true, viewport: { width: 800, height: 900 } });
    const t2 = await openPage(ctx2, 'reading_assignments.html');
    await t2.page.waitForFunction(() => document.querySelectorAll('#asgHost .sub-row').length === 1, null, { timeout: 10000 });
    await t2.page.locator('#asgHost .btn', { hasText: 'עריכה' }).click();
    const d = await t2.page.evaluate(() => ({ open: !document.getElementById('asgDlg').hidden, modal: document.getElementById('asgDlg').getAttribute('aria-modal') === 'true', focused: document.activeElement && document.activeElement.id, raw: /\b(assign|shared)\.[a-z_]+\.[a-z_]+/.test(document.body.innerText), overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      offenders: [...document.querySelectorAll('body *')].filter(n => { const r = n.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).slice(0, 6).map(n => n.tagName + (n.id ? '#' + n.id : '') + '.' + String(n.className).slice(0, 30)) }));
    await t2.page.keyboard.press('Escape');
    check('J: the teacher page\'s edit dialog is modal, focuses its title, closes on Escape; Hebrew at 800px has no raw keys or overflow', d.open && d.modal && d.focused === 'dlgTitleIn' && !d.raw && !d.overflow && await t2.page.evaluate(() => document.getElementById('asgDlg').hidden), JSON.stringify(d));
    check('J: 0 pageerrors (teacher, he, dark)', t2.errors.length === 0, t2.errors.join(' | '));
    await t2.page.screenshot({ path: path.join(SHOTS, 'J-teacher-he-dark.png'), fullPage: true });
    await ctx2.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed ? 1 : 0);
