# scripts/loop — the improvement loop's committed tooling

The loop's protocol is `.claude/skills/improveloop/SKILL.md`; the passes are `docs/reference/loop-passes.md`;
the pattern catalog is `docs/reference/loop-patterns.md`. This folder holds what a session used to rebuild in
its scratchpad every time.

| File | Role |
|---|---|
| `drift.mjs` | The outside-loop drift line (session-start step 4; `--vs` diffs against the last close-out's line). |
| `coverage.mjs` | Surface × pass "last audited" matrix from the ledger, the archive and the findings headings (one surface per row or heading, plus any joined to it with a literal ` + ` before the row's first colon, outside parentheses); `--check` rejects a rotation note that contradicts the record. |
| `closeout.mjs` | The mechanical close-out: compaction, the ledger checks, i18n, inline JS, llms/sitemap `--check`, coverage, every detector, every static check that exists. `--static` never writes. |
| `detect-<id>.mjs` | One detector per catalog pattern (to come). Contract: reads the shared harness, `--plant` injects one known hit into a scratch copy and must report it, `--json` prints `{ id, hits: [{ file, line, note }], delta }`; a run whose plant fails is never a clean run. |
| `probes/S<N>-<slug>.mjs` | A fix's own probe, committed only when no smoke scenario or ACTIVE pattern covers it; `regress.mjs --last 2` runs them at session start (to come). So far: `S553-sw-precache-revalidates.mjs` — the worker's install after a `VERSION` bump through a warm HTTP cache (an in-process server with `max-age=600`, the real worker, `--control` serves the plain `cache.add(url)` and must report the stale precache).; `S564-dashboard-calendar-lines-follow-settings.mjs` — the holiday, Shabbat and Omer lines after a starter and a preset Load, two dates, the drawer's switches the control; `S564-dashboard-fullscreen-fits-the-screen.mjs` — Full Screen at 1024×768 / 1280×720 / 1920×1080 on two boards, the message on screen and the clock on one line. |
| `fixtures/` | Canned responses of the remote APIs the pages parse (E's shape-drift arm; to come). |

Every script here is plain Node, read-only unless its name says otherwise, and runs from any directory.
