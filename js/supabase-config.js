/*
 * supabase-config.js — IvritSuite's Supabase project settings. PUBLIC values only.
 *
 * Loaded on every page that offers accounts, right after /js/i18n.js and before /js/ivrit-account.js:
 *   <script src="/js/supabase-config.js" defer></script>
 *
 * Where these come from (Supabase dashboard → the IvritSuite project):
 *   url       Project Settings → API → Project URL
 *   anonKey   Project Settings → API Keys → the "publishable" key (sb_publishable_…). It is SAFE to
 *             commit: it only identifies the project, and Row Level Security is what keeps each
 *             user's rows private. Rotating it = paste the new key here, bump VERSION in sw.js, deploy.
 *   sdk       The pinned @supabase/supabase-js v2 UMD build on jsDelivr (exposes window.supabase).
 *             Upgrading = change the version in the URL AND recompute sdkIntegrity (see below).
 *   sdkIntegrity  Subresource Integrity hash of that exact file, so a tampered or wrong file never
 *             runs. Compute it from the npm tarball (jsDelivr serves the same bytes):
 *               curl -sSo sb.tgz https://registry.npmjs.org/@supabase/supabase-js/-/supabase-js-<ver>.tgz
 *               tar -xzf sb.tgz package/dist/umd/supabase.js
 *               echo "sha384-$(openssl dgst -sha384 -binary package/dist/umd/supabase.js | openssl base64 -A)"
 *             If the SDK ever refuses to load with an integrity error in the console, set it to ''.
 *   enabled   The kill switch. false = no chip, no SDK download, no network calls anywhere.
 */
window.IVRIT_SUPABASE = {
  enabled: true,
  url: 'https://hhkmqwpjsyxdeuhvcyis.supabase.co',
  anonKey: 'sb_publishable_pqTQ0XtPQpcRWYs9sNTVNQ_IlV3GaG8',
  sdk: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js',
  sdkIntegrity: 'sha384-iLddHTLokph6Omwoyid4XKxHaWa6w41BnoEj0q5oOrzmYPpHIKt1wyjReA7s//pP'
};
