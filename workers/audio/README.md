# The audio Worker — Torah Trainer reading assignments

This folder is the one piece of IvritSuite that does not run on GitHub Pages or inside Supabase: a small
**Cloudflare Worker** (one file, `worker.js`) standing in front of a private **Cloudflare R2 bucket**. Every
recording a student submits goes through the Worker into the bucket, and every playback comes back out through
it. The Worker never trusts the page: it checks whose sign-in token is calling, then asks Supabase *as that
person* whether they may touch that recording, so the database's own rules (Row Level Security,
`db/migrations/0008_reading_assignments.sql`) decide. The bucket has no public address at all.

Everything below is written for someone setting up a backend for the first time. Do the steps in order; each
one says exactly where to click and what to type. Nothing here costs money unless the site grows far beyond a
few schools (the limits are at the end).

---

## What you need before starting

- The Cloudflare account that holds the `ivritsuite.com` DNS (the same one with the `totaltorah-audio` bucket).
- A computer with **Node.js 18 or newer** (`node --version` in a terminal). Node 22 is what the tests use.
- The Supabase dashboard for the IvritSuite project (`hhkmqwpjsyxdeuhvcyis`).
- About 30 minutes.

Open a terminal in this folder for the command steps:

```bash
cd workers/audio
```

---

## Step 1 — turn on R2 in your Cloudflare account

1. Go to <https://dash.cloudflare.com> and sign in.
2. In the left menu click **R2 Object Storage**.
3. If you see a button like **Purchase R2 plan** or **Enable R2**, click it. Cloudflare asks for a payment
   method even for the free allowance (10 GB stored, and more requests per month than a school will ever
   make). You are not charged inside that allowance. If R2 is already on (you made `totaltorah-audio`), the
   page shows your buckets and this step is done.

## Step 2 — create the private bucket

1. Still under **R2 Object Storage**, click **Create bucket**.
2. **Bucket name:** `torahtrainer-recordings` — exactly this, lowercase, with the hyphen. (The name is in
   `wrangler.toml`; a different name means editing that file.)
3. **Location:** leave *Automatic*.
4. **Default storage class:** *Standard*.
5. Click **Create bucket**.
6. Open the bucket → **Settings**. Check that:
   - **Public access** says *Not allowed* (leave it so — never click *Allow Access*).
   - **R2.dev subdomain** is *Disabled* (leave it disabled).
   - **Custom Domains** is empty (leave it empty — the Worker, not the bucket, gets a domain).

## Step 3 — bucket CORS policy: not needed

A bucket needs a CORS policy only when a browser talks to the bucket directly. Here the browser talks only to
the Worker (Step 5), and the Worker reads and writes the bucket from inside Cloudflare through a *binding*,
which is not a web request. So there is nothing to paste. If you ever see a CORS error in the browser, it is
about the Worker's own list of allowed sites (`ALLOWED_ORIGINS` in `wrangler.toml`), not the bucket.

## Step 4 — R2 API token: not needed

For the same reason, no R2 API token is created and no key is copied anywhere. The binding in
`wrangler.toml` (`[[r2_buckets]]`) gives the Worker access to this one bucket and nothing else, and that
access cannot leak because there is no key to leak. (The Total Torah upload token you already hold is for
the *other* bucket and is not used here.)

## Step 5 — install wrangler, sign in, set the one secret, deploy

`wrangler` is Cloudflare's command-line tool. It installs into this folder only.

```bash
npm install
```

Sign in (a browser window opens; approve it, then come back to the terminal):

```bash
npx wrangler login
```

Check it worked — this prints your account name:

```bash
npx wrangler whoami
```

Now the one secret. The Worker's nightly tidy-up job (it removes audio whose recording was deleted, and
recordings past their retention date) needs the Supabase project's **secret key**. Find it: Supabase
dashboard → the IvritSuite project → **Project Settings** (the gear) → **API Keys** → the **Secret keys** tab
→ if there is none yet, **Create new secret key** (name it `audio-worker`); click **Reveal**, copy it (it
starts with `sb_secret_`). Then:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Paste the key when asked and press Enter. It is stored encrypted on Cloudflare's side; nothing is written to
disk, and it must never be pasted into any file in this repository or into a page.

Deploy:

```bash
npx wrangler deploy
```

The last lines print the Worker's address, something like
`https://ivritsuite-recordings.<your-subdomain>.workers.dev`. Open that address with `/health` on the end in
a browser — it must show the word `ok`. (The deploy also creates the daily schedule and the three rate-limit
rules from `wrangler.toml`; nothing else to click.)

If `deploy` complains that the bucket does not exist, Step 2's name differs from `wrangler.toml`.

## Step 6 — give the Worker its own address: `recordings.ivritsuite.com`

The site's pages are told to talk to `https://recordings.ivritsuite.com` (it is in `js/ivrit-assignments.js`
and in the pages' Content Security Policy), so the Worker needs that name. Because `ivritsuite.com`'s DNS is
already on Cloudflare, this is one form:

1. Cloudflare dashboard → **Workers & Pages** → click **ivritsuite-recordings**.
2. **Settings** tab → **Domains & Routes** → **Add** → **Custom domain**.
3. Type `recordings.ivritsuite.com` → **Add domain**.
4. Cloudflare creates the DNS record and the certificate by itself. After a minute, open
   <https://recordings.ivritsuite.com/health> — `ok` again.

If it refuses because a record named `recordings` already exists in DNS, remove that record first (DNS →
Records) and try again. The Total Torah address `audio.ivritsuite.com` is a different name and is not touched.

## Step 7 — the two lifecycle rules (the bucket cleans up after itself)

The site deletes a recording's audio 30 days after its assignment is closed (the teacher can change that
per assignment, 7–180 days, and can delete any recording at once). These two rules are the safety net in case
the nightly job ever stops running:

1. **R2 Object Storage** → `torahtrainer-recordings` → **Settings** → **Object lifecycle rules** → **Add rule**.
2. Rule 1 — **Rule name:** `expire-recordings`; **Prefix:** `submissions/`; under *Conditions* tick
   **Delete uploaded objects** and set **400 days** after upload (that is "a school year plus the summer",
   so nothing is lost mid-year even if a teacher never closes an assignment). Save.
3. **Add rule** again. Rule 2 — **Rule name:** `abort-unfinished-uploads`; leave the prefix empty; tick
   **Abort incomplete multipart uploads** and set **1 day**. Save.

## Step 8 — the Supabase side

1. **The database.** Supabase dashboard → **SQL Editor** → **New query** → paste the whole of
   `db/migrations/0008_reading_assignments.sql` → **Run**. It should finish with no error. Then
   **Database → Tables** shows the new tables (`assignments`, `submissions`, …) each with the RLS shield.
   (Or ask Claude Code to apply it through the Supabase connector, which also records it in the migration
   history; `db/README.md` explains both ways and how to read the result back.)
2. **The two server functions.** **Edge Functions** → **Deploy a new function** → **Via Editor**:
   - name `manage-students`, paste `db/functions/manage-students/index.ts`, keep **Verify JWT** on, **Deploy**;
   - open the existing `delete-account`, replace its code with `db/functions/delete-account/index.ts`
     (it now also removes a teacher's student accounts, and refuses a student), **Deploy**.
3. **Passwords for students.** **Authentication → Sign In / Providers → Email**: set **Minimum password
   length** to `8` and switch on **Leaked password protection**. Save. (Student logins are generated
   three-word passphrases, which clear both.)
4. Nothing else changes: the email and Google settings stay as they are, and there is no rate-limit setting
   to raise — password sign-ins are limited per school network at 30 in a burst, which fits one class at a
   time; the page tells a student to wait a minute if a whole school signs in at once.

## Step 9 — the `students.ivritsuite.com` DNS records

Student accounts carry a made-up email address under `students.ivritsuite.com` (nobody can email it, and
the site never sends to it). Two records make sure any mail aimed there fails instantly instead of bouncing
around the internet:

1. Cloudflare dashboard → `ivritsuite.com` → **DNS** → **Records** → **Add record**.
2. **Type** `MX`, **Name** `students`, **Mail server** `.` (a single dot), **Priority** `0`, **TTL** Auto → Save.
   (This is the standard "null MX": it means *this name receives no mail*.)
3. **Add record** again: **Type** `TXT`, **Name** `students`, **Content** `v=spf1 -all` → Save.

---

## Checking that it all works

- <https://recordings.ivritsuite.com/health> shows `ok`.
- Sign in as a teacher on <https://ivritsuite.com/torah_trainer.html?assignments=1>, open the management page
  from there, create one test student (yourself), create an assignment, then sign in as that student in a
  private window, enter the code word, record ten seconds and submit. Back as the teacher, play it. The
  teacher guide (`docs/reading-assignments-teacher-guide.md`) walks through the same thing with pictures of
  what each screen says.
- Watch the Worker live while you do that:

```bash
npx wrangler tail
```

  Each request prints one line (`PUT /upload/… 200`, `GET /audio/… 200`). Press Ctrl+C to stop watching.
- The nightly job prints one line a day beginning `reconcile {…}` with its counts. To run it now instead of
  waiting: in the dashboard, **Workers & Pages → ivritsuite-recordings → Settings → Triggers → Cron
  Triggers**, or from the terminal with a local copy (`npx wrangler dev --test-scheduled`, then open
  `http://localhost:8787/__scheduled?cron=17+3+*+*+*`).

## Limits, and what they cost

| What | Free allowance | What happens past it |
|---|---|---|
| Worker requests | 100,000 per day | the Worker answers an error page until the next day; the site's reading tools keep working, only recording and playback pause. A class of 25 recording twice and a teacher listening to it all is well under 500 requests. |
| Worker CPU time | 10 ms per request | uploads and playback stream and use almost none. The nightly job is the one to watch: if `npx wrangler tail` ever shows `exceededCpu` on it, the fix is the **Workers Paid** plan ($5/month, 30 s per request), not a code change. |
| R2 storage | 10 GB | a ten-minute recording is about 2.4 MB, so 10 GB is roughly 4,000 recordings kept at once; retention keeps the number far lower. |
| R2 operations | 1 million writes, 10 million reads per month | not reachable by a school. |

## When something fails

| What you see | Where to look |
|---|---|
| The page says *Couldn't reach the recording server* | <https://recordings.ivritsuite.com/health> in a browser. No `ok` → Step 6 (the domain) or the Worker is not deployed (`npx wrangler deployments list`). |
| Upload fails with *not accepted* | the assignment closed, or the teacher already marked that recording, between pressing Record and Submit; the student re-records. |
| Upload fails with *too large* | the recording ran past the assignment's maximum length (the page stops recording at the limit, so this means the browser's own limit was hit first); lower the maximum minutes or re-record. |
| Playback says *recording missing* | the row exists but the audio is gone (a lifecycle rule, or a deletion that failed half-way); the teacher deletes the row and asks for a re-recording. |
| `npx wrangler tail` shows `unauthorized` on every request | the Supabase project rotated its signing key (Project Settings → JWT Keys) — the Worker picks the new key up within ten minutes by itself; if it does not, redeploy. |
| `reconcile … "errors":[…]` in the tail | the secret key is missing or was rotated: run Step 5's `secret put` again; `not_configured` in the line means the same. |
| `npx wrangler deploy` says *not authenticated* | `npx wrangler login` again. |

## Changing or removing it later

- After editing `worker.js` or `wrangler.toml`: `npx wrangler deploy`. The old version stays listed
  (`npx wrangler deployments list`) and can be rolled back (`npx wrangler rollback`).
- Rotating the Supabase secret key: create the new key in the dashboard, `npx wrangler secret put
  SUPABASE_SERVICE_ROLE_KEY` with it, then delete the old key in the dashboard.
- Adding a development address to the allowed sites: edit `ALLOWED_ORIGINS` in `wrangler.toml`, deploy.
- Turning it off: `npx wrangler delete` removes the Worker (the bucket and its recordings stay until you
  delete them in the dashboard).

## Running the tests

```bash
npm install
npm test
```

`test/run.mjs` starts a pretend Supabase on your computer (with a signing key made for that run and the
same row-visibility rules as the real database), starts the Worker under wrangler's local runtime with a
pretend bucket in a temp folder, and drives it as a student, a classmate, the teacher, another teacher and
an outsider: good and bad tokens (expired, wrong issuer, wrong key, the HS256 trick), uploads that are too
big, the wrong type, chunked, or cut short, playback rights with the classmates toggle on and off, deletion,
the rate limit, and the nightly job's four branches. It needs no network and no account.

## How it decides (for the curious)

1. **Whose token?** The `Authorization: Bearer …` header must be a Supabase access token signed with the
   project's current key (ES256; the public half is fetched from the project and kept for ten minutes).
   The token's expiry, issuer, audience and role are all checked. Nothing else is accepted — not the
   publishable key, not an old-style HS256 token.
2. **May they?** The Worker reads the recording's row from Supabase *with the caller's own token*, so the
   database applies its policies: a student sees their own rows, a teacher the rows of their assignments, a
   classmate only current uploads of assignments whose teacher turned *classmates may listen* on. No row →
   `not_found`, whoever asked.
3. **Where do the bytes go?** Under the key the database wrote into the row when the student pressed Submit
   (`submissions/<assignment>/<student>/<recording>.<ext>`). The client never names a key.
4. **How big?** `Content-Length` is required and capped (the assignment's minutes × 32 kbps × 1.5 + 1 MB,
   never more than 16 MB); the bytes are streamed through a fixed-length pipe, so a body that is shorter or
   longer than declared stores nothing.
5. **Then** the row is marked uploaded, again as the student (a database trigger allows exactly that one move).
6. **Every night** (03:17 UTC), with the secret key and nothing but four narrow queries: rows stuck
   *pending* for an hour are fixed or dropped; objects no row names are deleted; recordings past retention
   go; the code-word attempt log is pruned.
