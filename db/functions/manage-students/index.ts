// IvritSuite — "manage-students" (Supabase Edge Function, Deno): the student accounts a teacher creates for the
// Torah Trainer's reading assignments.
//
// Why a server function: creating an auth user with a password, resetting one, and deleting one are admin calls
// that need the project's secret key, which never ships in a page. The platform hands the key to the function
// as an environment variable (SUPABASE_SECRET_KEYS, or the legacy SUPABASE_SERVICE_ROLE_KEY), exactly as the
// delete-account function reads it. Everything else about assignments goes through the Data API under the
// caller's own token and Row Level Security (db/migrations/0008_reading_assignments.sql).
//
// What it does, for a signed-in TEACHER only (the platform's verify_jwt refuses requests without a valid token
// before this runs; getUser() then asks the Auth server whose token it is, and a student's token is refused):
//   action "create"          { students: [{ display_name, username, password }] } → one auth user per row with
//                            email <username>@students.ivritsuite.com (a domain that receives no mail), the
//                            password, email_confirm true, user_metadata.full_name (the sign-up trigger copies it
//                            into profiles.display_name) and app_metadata.role = 'student' (only this key can
//                            write that; every token the student gets carries it), then the students row that
//                            ties the account to this teacher. A taken username is refused before anything is
//                            created; a students row that cannot be written removes the auth user again. Caps:
//                            60 rows per call, 200 students per teacher.
//   action "reset_password"  { id, password } → a new password for one of this teacher's students.
//   action "reset_passwords" { ids: [..], password } → the same new password for up to 60 of this teacher's students
//                            (the class setup page's "one password for everyone shown"); per-id results.
//   action "delete"          { id } → removes one of this teacher's students (auth user; the rows cascade; the
//                            audio objects go at the Worker's next daily reconcile).
// Replies: { ok: true, ... } or { error: <one word> } — never a stack trace.
//
// Deploying it: db/README.md → Edge Functions (through the connector, or the dashboard editor, with Verify JWT on).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://ivritsuite.com', 'https://www.ivritsuite.com', 'http://localhost:8080', 'http://127.0.0.1:8080'];
const STUDENT_DOMAIN = 'students.ivritsuite.com';
const USERNAME_RE = /^[a-z0-9][a-z0-9.]{1,28}[a-z0-9]$/;
const MAX_PER_CALL = 60;
const MAX_PER_TEACHER = 200;
const PASSWORD_MIN = 8, PASSWORD_MAX = 72;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') ?? 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (ALLOWED_ORIGINS.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function reply(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } });
}
function secretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '');
    if (keys && typeof keys.default === 'string' && keys.default) return keys.default;
  } catch (_) { /* not set, or not JSON: fall through */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Which student is this, and is it the caller's? (service role: no RLS, so the check is explicit)
async function ownStudent(admin: SupabaseClient, teacherId: string, id: string) {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await admin.from('students').select('id, teacher_id, username').eq('id', id).maybeSingle();
  if (error || !data || data.teacher_id !== teacherId) return null;
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' });

  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!jwt) return reply(req, 401, { error: 'no_token' });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const secret = secretKey();
  if (!url || !secret) return reply(req, 500, { error: 'not_configured' });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  if (whoErr || !who?.user) return reply(req, 401, { error: 'invalid_token' });
  const teacherId = who.user.id;
  if (who.user.app_metadata?.role === 'student') return reply(req, 403, { error: 'student_forbidden' });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch (_) { return reply(req, 400, { error: 'bad_request' }); }
  const action = typeof body?.action === 'string' ? body.action : '';

  try {
    if (action === 'create') {
      const rows = Array.isArray(body.students) ? body.students : [];
      if (!rows.length || rows.length > MAX_PER_CALL) return reply(req, 400, { error: 'bad_request' });
      const { count, error: cErr } = await admin.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId);
      if (cErr) throw cErr;
      if ((count ?? 0) + rows.length > MAX_PER_TEACHER) return reply(req, 400, { error: 'too_many_students' });

      const results: Array<Record<string, unknown>> = [];
      const seen = new Set<string>();
      for (const r of rows) {
        const displayName = str(r?.display_name, 80);
        const username = str(r?.username, 30).toLowerCase();
        const password = typeof r?.password === 'string' ? r.password : '';
        const out: Record<string, unknown> = { username };
        if (!displayName) { out.error = 'invalid_name'; results.push(out); continue; }
        if (!USERNAME_RE.test(username) || seen.has(username)) { out.error = seen.has(username) ? 'username_taken' : 'invalid_username'; results.push(out); continue; }
        if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) { out.error = 'invalid_password'; results.push(out); continue; }
        seen.add(username);
        const { data: taken } = await admin.from('students').select('id').eq('username', username).maybeSingle();
        if (taken) { out.error = 'username_taken'; results.push(out); continue; }
        const { data: created, error: mkErr } = await admin.auth.admin.createUser({
          email: `${username}@${STUDENT_DOMAIN}`,
          password,
          email_confirm: true,
          user_metadata: { full_name: displayName },
          app_metadata: { role: 'student' },
        });
        if (mkErr || !created?.user) {
          const m = String(mkErr?.message ?? '').toLowerCase();
          out.error = /already|registered|exists/.test(m) ? 'username_taken' : (/password/.test(m) ? 'invalid_password' : 'create_failed');
          console.error('manage-students create:', username, mkErr?.message);
          results.push(out); continue;
        }
        const { error: rowErr } = await admin.from('students').insert({ id: created.user.id, teacher_id: teacherId, username });
        if (rowErr) {
          console.error('manage-students students row:', username, rowErr.message);
          await admin.auth.admin.deleteUser(created.user.id).catch(() => {});   // nothing half-made is left behind
          out.error = 'create_failed'; results.push(out); continue;
        }
        out.id = created.user.id; out.display_name = displayName;
        results.push(out);
      }
      return reply(req, 200, { ok: true, results });
    }

    if (action === 'reset_password') {
      const id = typeof body.id === 'string' ? body.id : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return reply(req, 400, { error: 'invalid_password' });
      const s = await ownStudent(admin, teacherId, id);
      if (!s) return reply(req, 404, { error: 'not_found' });
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) { console.error('manage-students reset:', id, error.message); return reply(req, 500, { error: /password/i.test(error.message) ? 'invalid_password' : 'reset_failed' }); }
      return reply(req, 200, { ok: true, id });
    }

    if (action === 'reset_passwords') {
      const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : [];
      const password = typeof body.password === 'string' ? body.password : '';
      if (!ids.length || ids.length > MAX_PER_CALL) return reply(req, 400, { error: 'bad_request' });
      if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return reply(req, 400, { error: 'invalid_password' });
      const results: Array<Record<string, unknown>> = [];
      for (const id of new Set(ids)) {
        const s = await ownStudent(admin, teacherId, id);
        if (!s) { results.push({ id, error: 'not_found' }); continue; }
        const { error } = await admin.auth.admin.updateUserById(id, { password });
        if (error) { console.error('manage-students reset_passwords:', id, error.message); results.push({ id, error: /password/i.test(error.message) ? 'invalid_password' : 'reset_failed' }); continue; }
        results.push({ id, username: s.username });
      }
      return reply(req, 200, { ok: true, results });
    }

    if (action === 'delete') {
      const id = typeof body.id === 'string' ? body.id : '';
      const s = await ownStudent(admin, teacherId, id);
      if (!s) return reply(req, 404, { error: 'not_found' });
      const { error } = await admin.auth.admin.deleteUser(id);   // profiles, students, memberships, submissions, feedback cascade
      if (error) { console.error('manage-students delete:', id, error.message); return reply(req, 500, { error: 'delete_failed' }); }
      return reply(req, 200, { ok: true, id });
    }

    return reply(req, 400, { error: 'bad_request' });
  } catch (e) {
    console.error('manage-students failed for', teacherId, e);
    return reply(req, 500, { error: 'failed' });
  }
});
