# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P2 | flash_cards.html (~3148, `tooltipIIFE`) | `.has-tip` tooltips are hover + click-to-pin only, on non-focusable `<span>`s — no `tabindex`/`role`/`aria-expanded`/`aria-describedby` and no keyboard handler; keyboard & screen-reader users can't reach feature help. It's the only tool still not on the shared accessible-tooltip pattern (`bindTip`/`wire`). | found: 2026-07-05, Pass F
- [ ] P3 | index.html (165 `.page-card` hover lift, 176 `.bookmark-tip` fade) | No `@media (prefers-reduced-motion: reduce)` block despite hover transform/opacity animations — violates the suite's own convention. | found: 2026-07-05, Pass F
- [ ] P3 | flash_cards.html | Missing the guided-tour engine — the only 1 of 6 tools without a "Take a tour"; the tool most used by beginners. | found: 2026-07-05, Pass F
- [ ] P3 | sw.js (11-33, `CORE_ASSETS`) | `404.html` is the only root `*.html` not precached, so the custom 404 is never available offline (navigate handler falls back to /index.html). | found: 2026-07-05, Pass E
- [ ] P3 | Hebrew_Font_Maker.html (2884 `toggleGuides`, 7004 `savePlacement`) | Two project-state mutations call `markDirty()` but skip the undo system, while their siblings use `udDo`. | found: 2026-07-05, Pass A
- [ ] P3 | Hebrew_Font_Maker.html (5846, 5865, 7867, 10124) | Falsy-zero `l.advance || …` in center-X midpoint fallbacks — a legitimately-stored `advance === 0` gets the default. Degenerate (only when no contour bbox exists); `effLetterAdvance` already uses `!= null`. | found: 2026-07-05, Pass A
- [ ] P3 | CLAUDE.md (592-594, 971-973) | Doc drift: the reduced-motion list wrongly says flash_cards is Missing (it has the block) and "6 files" is now 7; the dashboard accessible-tooltip claim of `aria-expanded` doesn't match `wire()` (no `aria-expanded`/`aria-describedby` in the file). | found: 2026-07-05, Pass F
- [ ] P3 | resources.html, contact.html, privacy.html | No `@media (prefers-reduced-motion)` block (convention gap; harmless today — these pages have no animations). Lower priority than the index.html one. | found: 2026-07-05, Pass F
- [ ] Info | flash_cards.html | Only page with no Google Analytics — documented as intentional (inline comment). Confirm the omission is still intended before "fixing". | found: 2026-07-05, Pass F
- [ ] Info | Hebrew_Font_Maker.html | No `.tip-wrap`/`data-tip` tooltip layer at all — tour-only help, divergent by design. Flag only if tooltip parity is desired. | found: 2026-07-05, Pass F

## In progress

_(none)_

## Done

- [x] 2026-07-05 | f2b0e71 | Hebrew_Font_Maker.html | UX (user-reported follow-up to v2.9) — the placement size sliders were reverted from the side-by-side row back to a vertical **stack** (one per line), and the ✓ Confirm placement + Reset letter/Reset all buttons were moved into their own bordered **panel to the right** of the sliders (#stageBelow = two-column flex: sliders+hint left, actions panel right; wraps on narrow screens). FONT_MAKER_VERSION 3.0, sw v191. | Verified headless (Playwright): 3 stacked `.size-slider-line`s in `.size-slider-col`, `.anchor-confirm-panel` to the right with Confirm+Reset, old `.size-slider-row`/`.anchor-confirm-foot`/divider gone, under-strip = Apply only, Fix-A undo intact, 0 pageerrors (light+dark, desktop+800) + screenshots.
- [x] 2026-07-05 | 67c66e0 | Hebrew_Font_Maker.html | UX (user-reported) — the Place Nikkud panel mixed control scopes with one dense hint; regrouped under scope-explicit headers ("Qamats — every letter" for Height/Edit shape; "Below position — Alef only" for X/Y; trop groups Height/Horizontal/spread under "— every letter") with one short hint per section. FONT_MAKER_VERSION 2.9. | Verified headless: header order in below+trop, dense hint gone, Height (tropTune) & X/Y (per-letter) undo intact, 0 pageerrors + screenshots.
- [x] 2026-07-05 | c598821 | Hebrew_Font_Maker.html | UX (user-reported) — size sliders below the canvas stacked side-by-side on one row with vertical dividers (shortened 74px bars, compact labels). | Verified headless: 3 cells one row, dividers on cells 2+, slider undo burst intact, 0 pageerrors + screenshot.
- [x] 2026-07-05 | 1474723 | Hebrew_Font_Maker.html | UX (user-reported follow-ups to the v2.8 layout) — placement canvas fills the center width again (dropped the 560px cap + the .mode-anchors hook), and a letter's controls are grouped below it: size sliders → divider → ✓ Confirm placement + Reset letter/Reset all (Confirm pulled from the right column, Reset from the under-strip; under-strip = Apply only). sw v189. | Verified headless (Playwright): #stageBelow order sliders→hr→Confirm→Reset, under-strip Apply-only & no Confirm/Reset, right column no Confirm, canvas max-width 100%, Fix-A undo intact, 0 pageerrors (light+dark, desktop+800) + screenshot.
- [x] 2026-07-05 | 9544fde | Hebrew_Font_Maker.html | UX (user-reported) — compact the Place Nikkud/Trop layout: size sliders moved directly below the canvas (#stageBelow), ✓ Confirm placement + pill moved to the bottom of the right column, under-strip slimmed to Apply + Reset, placement canvas capped to 560px via `.ws-grid.mode-anchors` (anchors-only, Trace/Align unchanged). FONT_MAKER_VERSION 2.8. | Verified headless (Playwright): DOM placement of sliders/Confirm/under-strip, 560px cap in anchors with no leak into trace, #stageBelow clears off-mode, relocated size slider keeps its readout + Ctrl+Z undo, 0 pageerrors (light+dark, desktop+800px) + screenshot.
- [x] 2026-07-05 | 7db38d0 | Hebrew_Font_Maker.html | Bug (user-reported) — Place Nikkud "above" class: the picker now drives the on-canvas preview (`activeVowelCp` returned a hard-coded holam, so selecting Rafe / Shin dot / Sin dot did nothing); and Shin-only dots are hidden from the above-mark grid on non-Shin letters, clamping a stale pick to holam. | Verified headless (Playwright, real setters): Shin shows all 4 marks, Tsadi shows Holam+Rafe only, Rafe selection sets activeVowelCp=05BF, 0 pageerrors.
- [x] 2026-07-05 | faefe8b | index.html + CLAUDE.md | P2 — register `hebrewFlashCards_settings` in AllTools (export/import/erase + `.ivrit` gather/apply); the only tool settings blob missing from backup, so restore on a new device silently dropped all flash-cards live config. | Verified headless (Playwright): round-trips through both the export/import textarea path and the `.ivrit` gather/apply path, and cleared by erase; 0 pageerrors (light+dark, desktop+800px).
- [x] 2026-07-05 | eaa8be7 | Hebrew_Font_Maker.html | P2 — make the 5 mark/trop size sliders undoable (undo-wiring): route `setMarkScale`/`setDageshScale`/`setCholamScale`/`setHolamScale`/`setTropScale` through `udBurstBegin([{t:'tropTune'}])` + `onchange="udBurstCommit()"`, and extend the `tropTune` undo snapshot/restore to actually capture the 5 `*Scale` fields (it previously snapshotted only tropSideOffset/halign/markNudge, so the undo entry wouldn't have reverted a size). FONT_MAKER_VERSION 2.6→2.7 + changelog. | Verified headless (Playwright): each setter's undo reverts the scale, one entry per drag (burst coalescing), readouts update, 0 pageerrors (light+dark, desktop+800px).

## Recurring-pattern sweep status

- falsy-zero: last swept 2026-07-05 (all 11 root HTML). Prior hits `effLetterAdvance`/`ensureTropAnchors` confirmed fixed. Remaining: 4 `l.advance ||` center-X midpoint fallbacks (P3, degenerate — see Candidates). All other `|| default` hits are legal min-clamps (rates, 1-indexed verses, layout fallbacks), not bugs.
- undo-wiring (Font Maker mutations that `markDirty()` without `udDo`/`udBurstBegin`): last swept 2026-07-05. Fixed the 5 size setters (this session). Remaining: `toggleGuides`, `savePlacement` (P3). Custom-glyph CRUD is intentionally not undo-backed (documented).
- slider-commit (Font Maker `oninput` sliders lacking `onchange="udBurstCommit()"`): last swept 2026-07-05. The 5 size sliders fixed this session; the rest already commit.
- workMode/step reachability (controls reachable in only one workMode while the workflow steers past it): last swept 2026-07-05 — no new instances found (prior Letter-Metrics hit already resolved).
- localStorage-vs-AllTools (keys written by a tool but missing from index.html gather/import/erase or the owning `.ivrit`): last swept 2026-07-05. Fixed `hebrewFlashCards_settings` (this session). Known remaining gap: `hebrewDictionary_lastState` is in eraseAllSettings only (real session data, never backed up/restored) — documented in CLAUDE.md as a known gap; not yet re-prioritized.
- unescaped-input / unsafe-parse (innerHTML interpolation bypassing `esc()`; untrusted `JSON.parse` bypassing `ivritSafeParse`): last swept 2026-07-05 (all 11 root HTML). No new instances — folder-tree/buildItemRow renderers use `createElement`+`textContent`; imports use `ivritSafeParse`/`ivritSafeAssign`.
- JSON-LD ↔ visible-content parity: last swept 2026-07-05 — not re-audited in depth this session (prior Font Maker FAQ hit noted resolved); revisit.
- destructive-bulk (loops over all items/letters overwriting per-item customizations unconditionally): last swept 2026-07-05 — no new unconfirmed instances; existing bulk ops (`resetTropSideColumns`, applyNikkud) are confirm-gated and undoable.
- console/error audit (Pass B): last run 2026-07-05 — all 11 root pages load with 0 real pageerrors.
- freshness/site-health (Pass E): last run 2026-07-05 — sitemap/THIRD_PARTY_LICENSES/internal-links all pass; only gap was 404.html not precached (Candidate above) + stale privacy/contact `lastmod` (cleared by this session's sitemap refresh).
- cross-tool consistency (Pass F): last run 2026-07-05 — divergences logged as Candidates (flash_cards tooltips + tour; index/resources/contact/privacy reduced-motion).

### Discovery-pass rotation (run one per session, stalest first)
- A recurring-pattern sweep: 2026-07-05
- B console/error audit: 2026-07-05
- C accessibility (one tool): _never_ ← next stalest
- D performance (one tool): _never_
- E freshness/site-health: 2026-07-05
- F cross-tool consistency: 2026-07-05
