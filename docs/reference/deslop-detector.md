# Deslop pass (O) — the Impeccable detector, how to run it

> Read this only when running the improvement loop's pass O. The pass itself (scope, gate 5, triage
> buckets, boundaries) is defined in `.claude/skills/improveloop/SKILL.md`.

## Get the detector
Third-party, Apache-2.0, `pbakaus/impeccable`. The pass does **not** depend on the Impeccable plugin or
skill being installed (`/plugin` is unavailable in the remote web environment). Shallow-clone into the
session scratchpad — never into the repo, never committed — and call the script directly:

```bash
git clone --depth 1 https://github.com/pbakaus/impeccable.git "$SCRATCH/impeccable"
DET="$SCRATCH/impeccable/plugin/skills/impeccable/scripts/detector/detect-antipatterns.mjs"
```

`npx impeccable detect` is a fallback if cloning is blocked, but npm has lagged the GitHub repo by a
full major — **record which source you used and its version** in the rotation row; the rule registry
differs between majors.

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
in CSS; comma-separate rule ids. Prefer inline over `.impeccable/config.json`.

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
