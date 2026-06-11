# IvritSuite metrics Worker

A tiny Cloudflare Worker + D1 database that stores **anonymous, aggregate** usage
counts for IvritSuite. It powers the "Community impact" popup on the homepage and
the public [`/impact.html`](../impact.html) page.

## What it stores (and what it never stores)

One table, `daily_counts(day, event, country, n)` — a running count per UTC day,
per event name, per 2-letter country code. That's everything.

- **Never** an IP address. (Cloudflare's `CF-IPCountry` header gives the country;
  the IP is read only for best-effort rate limiting and is never persisted.)
- **Never** a user-agent, cookie, or any identifier.
- **No way to tie a count to a person** — these are pure tallies.

## Endpoints

| Method | Path     | Body            | Response |
|--------|----------|-----------------|----------|
| POST   | `/event` | `{event, n}`    | `204` on success, `400` (silent) on bad input |
| GET    | `/stats` | —               | JSON: `{totals, daily, countries, generated_at}` (edge-cached 5 min) |

`event` must be on the server-side allow-list; `n` is clamped to a per-event cap.
The client sends `/event` beacons as `text/plain` so they fire during page unload
without a CORS preflight — the Worker parses the body as text regardless of
Content-Type.

## Deploy (run these from this `worker/` directory)

```bash
cd worker

# 1. Authorize wrangler against your Cloudflare account (opens a browser).
npx wrangler login

# 2. Create the D1 database and COPY the database_id it prints.
npx wrangler d1 create ivritsuite-metrics

# 3. Paste that id into wrangler.toml → [[d1_databases]].database_id
#    (replace PASTE_DATABASE_ID_FROM_d1_create).

# 4. Apply the schema to the REMOTE database.
npx wrangler d1 execute ivritsuite-metrics --remote --file=./schema.sql

# 5. Publish the Worker (the routes block provisions the api.ivritsuite.com
#    custom domain + cert automatically; this needs the ivritsuite.com zone to
#    be on the same Cloudflare account).
npx wrangler deploy
```

After deploy, confirm **api.ivritsuite.com** appears under
*Workers & Pages → ivritsuite-metrics → Settings → Domains & Routes*. If it
isn't there, add a Custom Domain `api.ivritsuite.com` in the dashboard.

## Required: add a WAF rate-limit rule (the real abuse backstop)

The in-Worker token bucket is per-isolate and best-effort only. Add a free
Cloudflare rate-limiting rule so abuse can't inflate the counters:

> **Security → WAF → Rate limiting rules → Create**
> When incoming requests match:
> `http.host eq "api.ivritsuite.com" and http.request.method eq "POST"`
> Rate: **60 requests / 1 minute** per IP · Action: **Block** (or Managed Challenge).

## Smoke test

```bash
# Should return 204 (no body):
curl -i -X POST https://api.ivritsuite.com/event \
     -H 'Content-Type: text/plain' --data '{"event":"cards","n":1}'

# Should return JSON:
curl -s https://api.ivritsuite.com/stats

# A bad event should return 400:
curl -i -X POST https://api.ivritsuite.com/event \
     -H 'Content-Type: text/plain' --data '{"event":"nope","n":1}'
```

## Local dev (optional)

```bash
npx wrangler dev          # runs the Worker locally against a local D1
# apply the schema locally first:
npx wrangler d1 execute ivritsuite-metrics --local --file=./schema.sql
```

## Adding a new event later

Add the event name to `ALLOWLIST` in `src/index.js` (and optionally a cap in
`CAPS`) and redeploy. `crosswords` and `tefillot` are already allow-listed for
upcoming tools, so those need no Worker change — just call
`IvritImpact.count('crosswords')` from the page.
