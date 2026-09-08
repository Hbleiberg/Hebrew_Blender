# Deslop pass (O) — the Impeccable detector, how to run it

> Read this only when running the improvement loop's pass O. The pass itself (scope, gate 5, triage
> buckets, boundaries) is defined in `.claude/skills/improveloop/SKILL.md`.

## Get the detector
Third-party, Apache-2.0, `pbakaus/impeccable`. The pass does **not** depend on the Impeccable plugin or
skill being installed (`/plugin` is unavailable in the remote web environment). Shallow-clone into the
session scratchpad — never into the repo, never committed — and call the script directly.

**Upstream HEAD no longer ships the JavaScript detector**: it is a Rust engine binary fetched by a shim,
and that binary download is blocked in the remote sandbox. Check out the last JS-detector tag instead:

```bash
git clone --depth 1 https://github.com/pbakaus/impeccable.git "$SCRATCH/impeccable"
cd "$SCRATCH/impeccable" && git fetch --depth 1 origin tag skill-v4.1.3 && git worktree add "$SCRATCH/imp413" skill-v4.1.3
DET="$SCRATCH/imp413/plugin/skills/impeccable/scripts/detector/detect-antipatterns.mjs"
```

The plugin manifest (`plugin/.claude-plugin/plugin.json`) is the authoritative version, not the root
`package.json`. `npx impeccable detect` is a fallback if cloning is blocked, but it fetches the same
binary — **record which source you used and its version** in the rotation row; the rule registry differs
between majors.

## Two arms
- **Static arm (the workhorse):** `node "$DET" <page>.html`. Reads the file; needs no server. Flags:
  `--json` (for diffing sweeps), `--no-advisory`, `--scope type,layout`, `--quiet`. It needs four parser
  modules — `htmlparser2 css-select css-tree domutils` — installed **in the scratchpad** beside the
  detector (`npm install` there; resolution walks up from its own path). Without them it prints
  `DEGRADED … findings are an undercount` and falls back to regex. **Never record a clean sweep, a hit
  count, or a Pattern-health streak from a DEGRADED run** — fix the install or report the arm as not-run.
- **Browser arm (runtime truth: computed cascade, custom properties, real contrast):** serve the repo
  root per the Playwright recipe in `ops.md`, then point the detector at the URL. It drives Puppeteer;
  reuse the preinstalled Playwright Chromium:
  ```bash
  npm install --ignore-scripts puppeteer        # scratchpad; --ignore-scripts skips the Chrome download
  CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1)   # discover it; the build number drifts
  CI=1 PUPPETEER_EXECUTABLE_PATH="$CHROME" NO_PROXY='*' no_proxy='*' node "$DET" http://localhost:8099/<page>.html
  ```
  `CI=1` is what adds `--no-sandbox` (Chrome refuses to start as root without it). `--viewport 390x844`
  gives a phone-width run (URL mode only).
- **Blind spot:** the browser arm only sees the light theme (dark mode is localStorage-driven). Audit dark
  by eye against the same rule ids and say so in the rotation row — a light-only sweep is not a
  whole-surface sweep.

## Waiving a finding (gate 5 — the maintainer's call)
An inline ignore next to the choice, with the reason:
```css
/* impeccable-disable-line cream-palette -- parchment ground: deliberate siddur identity, ratified S3xx */
```
`impeccable-disable` waives a whole file, `-line`/`-next-line` one site; `<!-- … -->` in HTML, `/* … */`
in CSS; comma-separate rule ids. Prefer inline over `.impeccable/config.json`. Two limits, both measured:
- The static arm reports every CSS-in-HTML finding at line 0, so `-line`/`-next-line` documents but
  never suppresses there — use the file-level directive (right after `<meta charset>`, as the Font
  Maker, dictionary and flash cards do) and say which ids are deliberately left unwaived.
- The browser (URL) arm cannot apply comment directives at all (a live DOM has no line numbers). Its
  DOM twin is `data-impeccable-ignore="rule-id"` on the element, which silences that subtree in every
  arm — but the phantom `gpt-thin-border-wide-shadow` "28px" finding has no element, so that rule
  never reads 0 in URL mode on a `.tour-card` carrier. Confirm a waiver with the static arm, and treat
  the URL arm's count for a waived id as noise.

## Hidden surfaces need a held-open copy
Both arms snapshot early and see only what is rendered: a closed modal, an inactive `.screen`, a
collapsed drawer are invisible. For each such state, write a scratchpad copy of the page (a symlink farm
of the repo root served on its own port keeps relative fetches working) with an injected script that
drives the state on a 50 ms interval, assert with Playwright that the state is open at 500 ms AND at
2000 ms, plant a control tell inside it once (a purple gradient div is enough) and confirm the detector
reports the control — only then do the copy's zeros count.

## Rule ids by owner
- **Tells — O fixes (gated):** `side-tab`, `gpt-thin-border-wide-shadow`, `gradient-text`,
  `ai-color-palette`, `nested-cards`, `monotonous-spacing`, `hero-eyebrow-chip`, `kicker-above-heading`,
  `icon-tile-stack`, `pulsing-dot`, `bounce-easing`, `codex-grid-background`,
  `repeating-stripes-gradient`, `em-dash-overuse` (advisory), and the rest of that family.
- **Pass C:** `low-contrast` (file with the measured ratio); `tiny-text` / `undersized-ui-text` /
  `tight-leading` / `cramped-padding` when the finding is legibility (these tools are projected for
  young students, so sub-11px functional text is a defect, not taste) — pass M when it is refinement.
- **Pass D:** `layout-transition`, `image-hover-transform`.
- **Pass N:** phone-width (`--viewport`) reachability/operability findings.
- **Known false positive:** `cream-palette` fires on `--cream: #fdf8ef`, the suite's deliberate parchment
  ground. A finding that contradicts a documented, chosen identity is a false positive; "fixing" it is
  the actual slop.
