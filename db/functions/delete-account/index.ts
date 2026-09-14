// IvritSuite — "Delete my account" (Supabase Edge Function, Deno).
//
// What it does, for the signed-in caller only, in this order:
//   1. Reads the caller's user id from the JWT in the Authorization header. The platform's own check
//      (verify_jwt) already refused requests without a valid user JWT before this code ran; getUser()
//      asks the Auth server to validate the token again and says who it belongs to, so the function can
//      only ever delete the account that is calling it.
//   2. Removes every file under <user id>/ in the three Font Maker buckets (project files, photos,
//      exports). Deleting an auth user does NOT remove Storage objects, so this has to happen first, here.
//   3. Deletes the auth user. The profiles, saves and font_projects rows go with it (on delete cascade).
//
// It needs the project's secret key — which never ships to the browser — and the platform hands that to
// every Edge Function as an environment variable (SUPABASE_SECRET_KEYS, or the legacy
// SUPABASE_SERVICE_ROLE_KEY). Nothing else is configured.
//
// Where this lives and how it is deployed: db/README.md ("Edge Functions").
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://ivritsuite.com', 'https://www.ivritsuite.com', 'http://localhost:8080', 'http://127.0.0.1:8080'];
const BUCKETS = ['font-projects', 'font-sources', 'font-exports'];
const PAGE = 100;

// The browser sends a CORS preflight before the real call. The site's own origins are answered; any other
// origin gets no Access-Control-Allow-Origin header, and the browser refuses the call for it.
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
// The secret key: the new JSON dictionary first (its "default" entry), the legacy variable as the fallback.
function secretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '');
    if (keys && typeof keys.default === 'string' && keys.default) return keys.default;
  } catch (_) { /* not set, or not JSON: fall through */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}
// Every object under prefix, subfolders included (a folder comes back as an entry without an id).
async function listFiles(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;
    const rows = data ?? [];
    for (const r of rows) {
      if (!r.name) continue;
      const path = prefix + '/' + r.name;
      if (r.id) out.push(path);
      else out.push(...(await listFiles(admin, bucket, path)));
    }
    if (rows.length < PAGE) return out;
  }
}
async function countRows(admin: SupabaseClient, table: string, uid: string): Promise<number> {
  const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true }).eq('user_id', uid);
  if (error) throw error;
  return count ?? 0;
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

  // 1. Who is calling — the Auth server's answer, never the header's own claim.
  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  if (whoErr || !who?.user) return reply(req, 401, { error: 'invalid_token' });
  const uid = who.user.id;

  try {
    const deleted = { saves: await countRows(admin, 'saves', uid), projects: await countRows(admin, 'font_projects', uid), files: 0 };
    // 2. Files first: once the rows are gone nothing would point at them any more.
    for (const bucket of BUCKETS) {
      const paths = await listFiles(admin, bucket, uid);
      for (let i = 0; i < paths.length; i += PAGE) {
        const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + PAGE));
        if (error) throw error;
      }
      deleted.files += paths.length;
    }
    // 3. The account itself; the profiles / saves / font_projects rows cascade.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;
    return reply(req, 200, { ok: true, deleted });
  } catch (e) {
    console.error('delete-account failed for', uid, e);
    return reply(req, 500, { error: 'delete_failed' });
  }
});
