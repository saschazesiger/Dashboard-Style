# Motion 2: coverage of the audit findings

Every finding of the audit (249 ids; areas `core`, `overlay`, `controls`, `layout`, `js`, `repo`) and the phase that
owns it. The owning phase is the one whose Coverage table lists the id; where a later phase finishes a part, the note
says so. Decisions D1-D35 are in [motion-2.md](../motion-2.md); the tasks are in the phase files.

## Summary

| Phase | Findings |
|---|---|
| [P0](P0.md) | 6 |
| [P1](P1.md) | 43 |
| [P2](P2.md) | 49 |
| [P3](P3.md) | 26 |
| [P4](P4.md) | 24 |
| [P5](P5.md) | 38 |
| [P6](P6.md) | 26 |
| [P7](P7.md) | 12 |
| [P8](P8.md) | 3 |
| Merged into another finding | 10 |
| Dropped | 12 |
| **Total** | **249** |

Two ids are split across phases: `js-theme-switch` (P0 fixes the theme load; P7 adds the View Transition
showcase) and `overlay-dialog-origin-aware` (P5 origin-aware entrance; P7 the opt-in container transform).

Dropped findings and why:

- `core-tokens-reduced-fades`: D8: reduced motion removed entirely; the removal itself is the P1 bullet.
- `core-tokens-reduced-optin`: D8: no reduced-motion switch, no .ds-motion-full and no .ds-motion-reduce.
- `core-missed-8`: D8: prefersReducedMotion() is removed, so there is no listener to add.
- `overlay-tooltip-focus-visible-throws`: D3: Safari 16.4 supports :focus-visible (since 15.4), so matches(':focus-visible') no longer throws on the baseline. The P5 tooltip helper uses it directly. Duplicates js-focus-visible-safari14.
- `overlay-reduced-motion-fades`: D8: reduced motion is removed entirely, so there are no reduced-motion fade tokens. Duplicates core-tokens-reduced-fades.
- `layout-missed-9`: D8 removes reduced motion entirely, so no reduced-motion fallback for the modal drawer. The P1 bullet only removes the related comments.
- `js-focus-visible-safari14`: D3 raises the baseline to Safari 16.4, where matches(':focus-visible') works (15.4+); the P5 tooltip helper uses it directly. Duplicates overlay-tooltip-focus-visible-throws.
- `js-reduced-motion-class`: D8 removes reduced motion entirely: no .ds-motion-reduced class, no change listener.
- `repo-js-reduced-motion-full`: D8: prefersReducedMotion() and .ds-motion-full are removed entirely (the removal is a P1 task).
- `repo-docs-reduced-scale`: D8: the reduced-motion switch and its comment are deleted.
- `repo-nightly-ci-gate`: D4: the nightly template stays as it is, without a green-CI gate.
- `repo-missed-9`: D1 decided it: spatial springs overshoot 2-4% (at most 1.05), so the question is moot.

When a phase finishes, its ids are done or moved explicitly here (definition of done, item 5).

**The plan is complete (P8, 1.6.0):** every id of P0 to P8 is done; the merged and dropped ones are listed above.

## Findings

| id | area | phase | note |
|---|---|---|---|
| core-tests-mock-restore | core | P0 | **Done (P0):** `t.mock` and `t.mock.timers` in the three tests, `mock` import gone. Unit-test fixes: `t.mock` in `test/motion.test.js`: Also converts the two `mock.timers` blocks; no `dist/` change. |
| layout-missed-1 | layout | P0 | **Done (P0):** anchor table in `test/browser/README.md` (modal drawer corrected to `shell.css:576-603`), `baseline.spec.js`, `motion-today.spec.js`, `frames.spec.js`, and the known bugs in the two regression specs. Baselines: `src/` anchor table, settled screenshots, timelines, mid-animation frames; Known bugs: Anchors re-verified against `src/` at `05aaeb3`. The draft's own `src/` lines for loading, spinner, status, alert, tile and utilities were also wrong (those files are shorter) and are corrected here. The pseudo-element sampling check is spike item 4. |
| js-theme-switch | js | P0 | **P0 part done:** `whenLinkLoaded()` and one `afterThemeChange()`, marked by `html[data-sg-theme]` (tested in `smoke.spec.js`). Styleguide hooks: theme switch: Load event plus one `afterThemeChange()` in both branches. The View Transition showcase follows in P7. **P7 part done:** the theme swaps inside `DS.motion.transition(apply, { type: 'fade-through' })`, the file loading on `media="not all"` first. |
| repo-test-hover-parser | repo | P0 | **Done (P0):** `atRuleBlocks()`, `withoutAtRuleBlocks()`, the `HOVER_EXEMPT` rewrite and `test/helpers.test.js`. Unit-test fixes: `atRuleBlocks`, hover test rewrite, helper self-tests: Must land before the P1 `@layer` wrap re-indents the CSS. |
| repo-ci-hardening | repo | P0 | **Done (P0):** permissions, concurrency, `workflow_dispatch` with "update screenshots", Node 22/24 and the `browser` job. CI: hardening and the browser job: `main` runs are never cancelled (1.6.1: one concurrency group per run on `main`, since a shared group cancels its older pending run). Node 22/24 matrix. The nightly template is unchanged (D4). |
| repo-missed-1 | repo | P0 | **Done (P0):** baseline recorded (100 tests, 14 suites, 39 files); P0 ends with 117 tests in 16 suites and `dist/` unchanged; the commit message lines and the `motion-2-p0` tag belong to the P0 commit. Starting point; Done when: Recorded as 100 tests, 14 suites, 39 `dist/` files. "Must not change it" means `dist/` and the existing tests. The count grows only by P0's new unit tests. |
| core-css-distance-inherits | core | P1 | **Done (P1):** Non-inheriting motion hooks; browser test: Covers the whole hook family (merged core-missed-1). Migration note: set hooks on the animating element. |
| core-tokens-easing-set | core | P1 | **Done (P1):** Motion tokens: easings: Canonical names override the draft: `--ds-ease-exit` instead of `--ds-ease-in-emphasized`, no `--ds-ease-decelerate`. `--ds-ease` stays as a deprecated alias (removed in 2.0), not removed. |
| core-tokens-springs | core | P1 | **Done (P1):** Motion tokens: the spring, generator; utilities: One `--ds-ease-spatial` (ζ 0.75, peak 1.028), fallback `--ds-ease-out`. |
| core-tokens-durations | core | P1 | **Done (P1):** Motion tokens: durations, multiplier: micro and long added; `--ds-time-scale` registered, never declared; delays scale too. |
| core-tokens-scales | core | P1 | **Done (P1):** Motion tokens: scales: `--ds-scale-popup` (canonical name, not `-popover`) and `--ds-scale-tooltip`. The draft's `--ds-scale-through` is not in the canonical spec; P7 adds it only if needed. The reduced-motion reset part is dropped (D8). |
| core-css-leave-curve | core | P1 | **Done (P1):** Keyframe catalogue: exits; `.ds-leave`; dialog, sheet: Movement-only exits under new names; the combined names stay as deprecated aliases. |
| core-css-leave-duration | core | P1 | **Done (P1):** `.ds-leave`: 150ms default, 200ms for `--scale`/`--slide`; the ratio band is 0.3-0.8 per the authority. |
| core-css-scale-out-distance | core | P1 | **Done (P1):** Keyframe catalogue: `ds-shrink-out`: The movement-only replacement reads both hooks; the deprecated alias stays unchanged. |
| core-css-stagger | core | P1 | **Done (P1):** `.ds-stagger`: Rise plus the `sibling-index()` refinement; `staggerOnce` is P2. |
| core-css-missing-exits | core | P1 | **Done (P1):** Keyframe catalogue: new keyframes; `.ds-leave--pop`; styleguide demo: The "conceal pair" uses the canonical names `ds-clip-in`/`ds-clip-out`. `roll()` is P2. |
| core-css-specificity-claim | core | P1 | **Done (P1):** Cascade layers: Doubled classes removed; the utilities layer wins. |
| core-docs-rules | core | P1 | **Done (P1):** Docs and rules; headers: Interim rewrite; the full `motion.md` with choreography comes in P8. **P8:** the full reference is written. |
| core-tests-css-guards | core | P1 | **Done (P1):** Tests: curves, ratio, exits, Progressive, generator: The ratio band follows the authority (0.3-0.8), not 0.5-0.75. |
| core-missed-6 | core | P1 | **Done (P1):** Components: dialog, sheet: Fade + movement pairs in the same commit; P5 drops the sheet panel fade (D16). |
| core-missed-7 | core | P1 | **Done (P1):** Motion tokens: durations: Role comment rewritten to the canonical table. |
| overlay-tooltip-transform-fly | overlay | P1 | **Done (P1):** Keyframe catalogue; tooltip; browser test: Individual `translate`/`scale` compose with a page transform. The tooltip motion itself is P5. |
| overlay-hidden-attr-ignored | overlay | P1 | **Done (P1):** Components: dialog, sheet, combobox; tests: Plus the generic `[hidden]` test. |
| overlay-tests-progressive-guards | overlay | P1 | **Done (P1):** Tests: Progressive by name, `[hidden]`, closing: The `.ds-combo__popup` forced-colours edge case moves to P5 with overlay-combo-forced-colors (the outline lands there). The overlay choreography tests are P5. |
| overlay-missed-1 | overlay | P1 | **Done (P1):** Components: dialog, sheet; tests: `pointer-events: none` on the box or panel only. |
| controls-btn-disc-timing | controls | P1 | **Done (P1):** Components: button disc: D14: fade only; merged controls-missed-1 (press scale gone). |
| controls-spatial-easing-token | controls | P1 | **Done (P1):** Motion tokens: the spring: Canonical single spring; the draft's `--ds-ease-spatial-fast`/`--ds-dur-spatial-fast` are not created (P3 uses `--ds-ease-spatial` + `--ds-dur-medium`). |
| controls-form-radio-focus-hole | controls | P1 | **Done (P1):** Baseline sweep: radio card; focus test: Moot under the Firefox 128 floor (D28): every engine has `:has()`. No `@supports` guard; a generic test keeps every `outline: none` paired with a ring. |
| layout-card-link-arrow-press | layout | P1 | **Done (P1):** Components: card: Lean removed; no focus or press lean. |
| layout-missed-4 | layout | P1 | **Done (P1):** `.ds-enter` (`--slide`): Moves to the spring. `--ds-ease-emphasized` is not deprecated: the authority keeps it unchanged for movement that starts and ends on screen. |
| js-stagger-inherit | js | P1 | **Done (P1):** Non-inheriting motion hooks; browser test: `--ds-i` registered `<integer>`, `inherits: false`; `enterAll`/`staggerOnce` cleanup is P2. |
| js-es-guard-test | js | P1 | **Done (P1):** Build: sibling imports; JS headers; js tests: ES2022 denylist, sibling-import rule, progressive-API guard. |
| js-build-inline-import | js | P1 | **Done (P1):** Build: `inlineCss()`; `test/build.test.js`: Files wrap themselves, so the build only drops the repeated layer statements instead of wrapping imports. |
| js-dsjs-double-load | js | P1 | **Done (P1):** Build: double-load guard; install.md: First copy wins; `DashboardStyle.versions`. |
| js-icon-classname | js | P1 | **Done (P1):** JS modules: `icon()`: Escape, never throw. |
| js-missed-6 | js | P1 | **Done (P1):** Keyframe catalogue: `ds-draw` setup, nothing pruned: `stroke-dashoffset` allowed; unused keyframes are kept (P3, P6, P8 use them), not removed. |
| js-missed-7 | js | P1 | **Done (P1):** Motion tokens: multiplier; styleguide speed: Duration tokens stay unregistered (parsed as `calc()` by P2's `motionDuration`), so "outside `.ds-theme`" stays detectable. The draft's `--ds-hold-*` tokens are not in the canonical spec. |
| repo-enter-iteration | repo | P1 | **Done (P1):** `.ds-enter`; spinner header; browser marker: Iteration count 1 plus the documented wrapper. |
| repo-browser-baseline | repo | P1 | **Done (P1):** Baseline sweep; JS headers; docs: Firefox 128 (D28), not 121. |
| repo-test-animated-properties | repo | P1 | **Done (P1):** Tests: animated properties: `EXCEPTIONS` and `PENDING` maps; later phases add exceptions as their features land; P8 asserts `PENDING` is empty. **P8:** `PENDING` is gone (a repo test forbids it), `EXCEPTIONS` equals the plan's list and rule 1 of `docs/motion.md`. |
| repo-test-motion-hooks-bypass | repo | P1 | **Done (P1):** Tests: hooks take tokens, `MOTION` regex: New rationale: the multiplier and the one fixed scheme (reduced motion is gone). |
| repo-test-keyframe-shape-loops | repo | P1 | **Done (P1):** Tests: keyframe shapes and loops: Named exemptions; longhand `infinite` handled. |
| repo-test-choreography-ratios | repo | P1 | **Done (P1):** Tests: exit/entrance ratio: The hover-asymmetry part is replaced by "hover never moves" (D14). |
| repo-docs-opacity-curve | repo | P1 | **Done (P1):** Docs: `motion.md` rule 2: Leaving fades accelerate (`--ds-ease-in`), entering fades on standard; merged layout-missed-3. |
| repo-docs-rule-lists | repo | P1 | **Done (P1):** Docs: AGENTS.md, `motion.md`, `rules.md`: Lists match the tests; final sync in P8. **P8:** synced. **1.6.1:** the motion hooks themes never set completed everywhere (`--ds-clip-from`, `--ds-draw-length`, `--ds-scan-*`, `--ds-indicator-lag`/`-dur`); `test/tokens.test.js` keeps them in step with its MOTION list. |
| repo-opp-spatial-springs | repo | P1 | **Done (P1):** Motion tokens: the spring, generator: Canonical: `--ds-ease-spatial` with existing durations; no `--ds-ease-spring`/`--ds-dur-spring-*`. The generator is `scripts/motion-curves.mjs`, not `springs.mjs`. |
| repo-test-progressive-regex | repo | P1 | **Done (P1):** Baseline sweep: Progressive notes; tests: Feature-by-name table for the 16.4 / 111 / 128 floor. |
| repo-missed-3 | repo | P1 | **Done (P1):** Cascade layers: `.ds-stagger`/`.ds-reveal` beat component animations; browser test. |
| repo-missed-7 | repo | P1 | **Done (P1):** Docs: AGENTS.md and README: One progressive list, written identically in both. |
| core-js-leave-enter-race | core | P2 | **Done (P2):** T2: generation map, superseded promises resolve silently, `cancel(el)` |
| core-js-settled-cancel | core | P2 | **Done (P2):** T6: `getAnimations` + `allSettled`, filters, derived ceiling |
| core-js-replay-svg-reflow | core | P2 | **Done (P2):** T7, T8: style-only flush, `enterAll` |
| core-js-countup-reentry | core | P2 | **Done (P2):** T10: D7: counts from the shown value, one loop, handle |
| core-js-countup-a11y | core | P2 | **Done (P2):** T10: `aria-busy` while counting |
| core-js-motion-preference | core | P2 | **Done (P2):** T1: timing from tokens; the reduced-motion part dropped by D8 (P1 removes `prefersReducedMotion`) |
| core-js-leave-focus | core | P2 | **Done (P2):** T4: focus to `focus`/opener before `inert` |
| core-js-interruptible | core | P2 | **Done (P2):** T5: one mechanism (snapshot, cancel, `el.animate`) per the authority, not `setKeyframes` |
| core-js-flip | core | P2 | **Done (P2):** T14: canonical signature, retarget, cap, touch-aware live guard |
| core-css-origin-aware | core | P2 | **Done (P2):** T12: `originFrom` writes `--ds-motion-origin`/`--ds-clip-from`; hooks registered in P1, used in P5 |
| core-docs-example | core | P2 | **Done (P2):** T9, Docs: `staggerOnce`, example rewrite, `stagger()` comment |
| core-tests-js-gaps | core | P2 | **Done (P2):** Tests: fakes with `getAnimations`; browser counterparts; P0 markers flipped. Unit: handoff, `settled`, `countUp`, curves, `originFrom`, `flip`, `roll`/`crossfade` (`motion.test.js`), the morph on a fake DOM and the timing-literal allowlist (`js.test.js`), `MOTION_FALLBACKS` against `tokens.css`; browser: `motion-engine`, `countup`, `flip`, `morph`, `ripple`, `fallback` specs; no P2 marker left. |
| core-missed-2 | core | P2 | **Done (P2):** T6: `settled` watches only its own class change's animations, generations guard, `replay` never cancels |
| core-missed-3 | core | P2 | **Done (P2):** T10: `countUp` on `--ds-ease-value`, lands with the bars (it starts on its first frame like a CSS transition; `countup.spec.js` proves one frame in every engine) |
| core-missed-4 | core | P2 | **Done (P2):** T4: `keep` defined and documented |
| core-missed-5 | core | P2 | **Done (P2):** T3: `enter()` clears `hidden` and `inert` |
| controls-indicator-morph-removes | controls | P2 | **Done (P2):** T19, T20: `data-ds-keep` plus the re-prepend in `place()` (both here) |
| controls-missed-2 | controls | P2 | **Done (P2):** T23: passive `touchstart` in `attach()`, documented fallback |
| js-leave-enter-race | js | P2 | **Done (P2):** T2: same fix as core-js-leave-enter-race |
| js-variant-classes-linger | js | P2 | **Done (P2):** T2: `clearMotion` (covers merged js-missed-1/-2) |
| js-interrupt-from-current | js | P2 | **Done (P2):** T5: individual `translate`/`scale` snapshot (P1 keyframes), remaining share, no inline style |
| js-settled-robust | js | P2 | **Done (P2):** T6: covers merged js-missed-4 (pseudo-element events) |
| js-replay-svg | js | P2 | **Done (P2):** T7. |
| js-enter-batch | js | P2 | **Done (P2):** T8, T24: `enterAll` with `visibleOnly` (default true); styleguide demos use it |
| js-countup-concurrent | js | P2 | **Done (P2):** T10: handle is `{ cancel, finished }` (canonical), not `stop()` |
| js-countup-layout | js | P2 | **Done (P2):** T10: `min-width` lock, tabular figures, `aria-busy` |
| js-motion-source-of-truth | js | P2 | **Done (P2):** T1: the reduced-motion half removed in P1 (D8) |
| js-countup-curve | js | P2 | **Done (P2):** T1, T10: internal `curve()` for `cubic-bezier`/`linear()` |
| js-morph-attributes | js | P2 | **Done (P2):** T15: in-place patch is the 1.0.0 default (D31), with escape hatches |
| js-morph-focus | js | P2 | **Done (P2):** T18. |
| js-morph-keys | js | P2 | **Done (P2):** T16: `data-ds-key`, then `id`; `moveBefore` progressive; P6 wires tables |
| js-morph-greedy | js | P2 | **Done (P2):** T17: 8-sibling lookahead after the shell check |
| js-morph-indicator | js | P2 | **Done (P2):** T19, T20: the coverage note's P4 re-prepend is done here (one line); P4 keeps it |
| js-page-stagger-cleanup | js | P2 | **Done (P2):** T24, T9: `staggerOnce` on the sections in view |
| js-morph-hooks | js | P2 | **Done (P2):** T19, T14: `onInsert`/`onRemove`/`holdOrder` feed `flip` |
| js-loader-delay-option | js | P2 | **Done (P2):** T11: `--ds-hold-loader` is added here (T11); P1 does not add it |
| js-tests-coverage | js | P2 | **Done (P2):** Tests: indicator glide tests stay in P4 |
| js-missed-5 | js | P2 | **Done (P2):** T10: disconnect writes the final value; `duration: 0` via `??` |
| js-missed-8 | js | P2 | **Done (P2):** Tasks (anchors): informational: the corrected anchors (enter :100, leave :115, settled :77, countUp :170) are used above |
| repo-leave-enter-race | repo | P2 | **Done (P2):** T2, T5: plus the tooltip docs line (`components.md` Tooltip) in P5 with `DS.overlay.tooltips` |
| repo-countup-overlap | repo | P2 | **Done (P2):** T10: D7 overrides the verifier: count from the shown value; covers merged repo-missed-5 |
| repo-docs-stagger-example | repo | P2 | **Done (P2):** T9: `staggerOnce` replaces the `data-ds-rendered` guard |
| repo-js-replay-reflow | repo | P2 | **Done (P2):** T7, T8. |
| repo-js-settled-cancel | repo | P2 | **Done (P2):** T6. |
| repo-countup-curve | repo | P2 | **Done (P2):** T1, T10: the `easeStandard` values are the `curve()` tests |
| repo-dom-morph-attrs | repo | P2 | **Done (P2):** T15, T16: key attribute is `data-ds-key` (canonical), not `data-key` |
| repo-opp-flip-helper | repo | P2 | **Done (P2):** T14: WAAPI is allowed (D21); AGENTS wording in Docs |
| repo-tests-js-coverage | repo | P2 | **Done (P2):** Tests, T25: engine unit and browser tests; the `fallback` project starts here |
| repo-missed-4 | repo | P2 | **Done (P2):** T6: ceiling derived from delay and duration |
| overlay-combo-toggle-state-layer | overlay | P3 | **Done (P3):** Other parts: `.ds-combo__toggle`; Shared: ripple hosts: layer, morph, ripple; no ring (`tabindex="-1"`) |
| controls-press-feedback-weak | controls | P3 | **Done (P3):** Shared press feedback; Navigation items; Radio cards; table sort and tiles: tile and card morph stay in P6 (layout-tile-press-shape, layout-card-interactive); chips are not pills, so no morph |
| controls-btn-focus-layer | controls | P3 | **Done (P3):** Focus: snap by transition, `--ds-state-focus` |
| controls-disabled-inconsistent | controls | P3 | **Done (P3):** Disabled states: visual change under "Changed" |
| controls-btn-busy-swap | controls | P3 | **Done (P3):** Buttons: faces, busy, icon swap: `.ds-btn__swap` deprecated |
| controls-chip-layout-shift | controls | P3 | **Done (P3):** Chips: slot glide, across a wrap: `--ds-ease-out` per D29; wrap via FLIP per D22 |
| controls-chip-check-drawin | controls | P3 | **Done (P3):** Chips: check draws in. |
| controls-icon-check-direction | controls | P3 | **Done (P3):** Buttons: drawable check glyphs. |
| controls-chip-disabled-hover | controls | P3 | **Done (P3):** Chips: disabled: P0 marker flips |
| controls-switch-disabled | controls | P3 | **Done (P3):** Switch: disabled: P0 marker flips; HOVER_EXEMPT entry updated |
| controls-switch-halo | controls | P3 | **Done (P3):** Switch: halo. |
| controls-switch-thumb-motion | controls | P3 | **Done (P3):** Switch: handle: `--ds-ease-spatial` at `--ds-dur-medium` (no spatial-fast tokens) |
| controls-form-blur-ghost | controls | P3 | **Done (P3):** Text fields: blur: P0 marker flips |
| controls-form-label-focus | controls | P3 | **Done (P3):** Text fields: label tint: `:has()` is baseline (Firefox 128), no fallback note |
| controls-form-error-hint-shift | controls | P3 | **Done (P3):** Text fields: validation message: height progressive, `--ds-ease-out` |
| controls-form-native-checks | controls | P3 | **Done (P3):** Checkbox and radio: 18px input as the box, halo by `box-shadow` (authority risk row); gated by the P0 spike |
| controls-list-parts-clip | controls | P3 | **Done (P3):** Other parts: `.ds-parts`: P0 marker flips |
| controls-missed-4 | controls | P3 | **Done (P3):** Checkbox and radio: radio cards and rows; Shared: press shape roles: pressed radius from `--ds-radius-card-pressed` (added in P3; 8px against the 12px card radius) |
| controls-missed-5 | controls | P3 | **Done (P3):** Text fields: blur: `color` in the `.ds-input` transition |
| controls-missed-6 | controls | P3 | **Done (P3):** Switch: state words. |
| layout-linkbtn-focus | layout | P3 | **Done (P3):** Other parts: `.ds-link-btn`; Focus: `:focus-visible` directly (D3); ripple and morph exception; P0 marker flips |
| layout-errors-summary-focus | layout | P3 | **Done (P3):** Other parts: `.ds-errors summary`; Focus: P0 marker flips; chevron rotation in P6 |
| layout-drawer-press-feedback | layout | P3 | **Done (P3):** Navigation items: drawer item: uses `--ds-radius-action-pressed`, not a drawer-specific radius hook |
| js-busy-restore | js | P3 | **Done (P3):** Buttons: `DS.motion.busy`: CSS faces, no width measuring |
| js-icon-motion | js | P3 | **Done (P3):** Buttons: icon swap, drawable glyphs: incoming scale from `--ds-scale-small` (one canonical scale) |
| repo-missed-2 | repo | P3 | **Done (P3):** Shared: shape morph: the disc's hover and press scale removal moved to P1 (controls-btn-disc-timing, with the stricter test, no PENDING entry); P3 gives the disc the shared morph and ripple and its browser test |
| core-docs-drawer-enter | core | P4 | **Done (P4):** Drawer and modal drawer: drawer coming back: One task with layout-drawer-enter-axis and repo-drawer-enter-axis; equality with `.ds-enter--slide` tested. |
| controls-indicator-item-resize | controls | P4 | **Done (P4):** Indicator: observing: Observes the track, every item child and the active item (covers position-only shifts, merged controls-missed-3), rAF-batched, `loadingdone`. |
| controls-indicator-glide-window | controls | P4 | **Done (P4):** Indicator: glide decision: Running edge transitions from `getAnimations()` replace the 600ms window. |
| controls-indicator-appear | controls | P4 | **Done (P4):** Indicator: appear and disappear: Grows from the item centre on the spring, contracts on `--ds-ease-in`; first placement still jumps, no `@starting-style`. |
| controls-indicator-layout-props | controls | P4 | **Done (P4):** Indicator: drawing and stretch: Clip-path on a union box with registered edges is the default (D20); radius through `--ds-indicator-radius` with the computed-radius fallback, so project classes need no migration; scroll coordinates kept. No `--plain` fallback: `@property` is baseline (D28). |
| controls-indicator-stretch | controls | P4 | **Done (P4):** Indicator: drawing and stretch, stretch: Trailing edge lags `var(--ds-indicator-lag, var(--ds-dur-micro))`, not `--ds-stagger`; spring is `--ds-ease-spatial` (no `-fast` variant exists). |
| controls-indicator-distance-duration | controls | P4 | **Done (P4):** Indicator: duration from distance: Uses P2's `travelDuration` (authority: `--ds-dur-medium` up to `--ds-dur-slow`), not a separate base-to-slow formula. |
| controls-indicator-auto-observe | controls | P4 | **Done (P4):** Indicator: self-updating: On by default, `observe: false` opts out; no `class` in the filter; the indicator's own and `data-ds-keep` mutations ignored. |
| controls-missed-7 | controls | P4 | **Done (P4):** Indicator: destroy() is final: Destroyed flag guards `place()`, the rAF batch and both fonts callbacks; unit test. |
| layout-drawer-enter-axis | layout | P4 | **Done (P4):** Drawer and modal drawer: drawer coming back: Same task; comment and docs fixed; P0 `test.fail` turned green. |
| layout-drawer-resize-slide | layout | P4 | **Done (P4):** Drawer and modal drawer: breakpoint: CSS hook `.ds-drawer--instant` and the documented `matchMedia` snippet; P5's `DS.overlay` drawer mode automates it. |
| layout-drawer-open-curve | layout | P4 | **Done (P4):** Drawer and modal drawer: open and close: Open on `--ds-ease-spatial` over `--ds-dur-long` (no separate slow spring token exists), close on `--ds-ease-exit`; bleed pseudo-element at the left edge. |
| layout-indicator-label-sync | layout | P4 | **Done (P4):** Active labels: label colour: Colour follows `--ds-indicator-dur`; weight stays an instant switch; off in the modal drawer. |
| layout-segmented-weight-shift | layout | P4 | **Done (P4):** Active labels: segmented width: Opt-in `data-label` with a zero-height `::after`. |
| layout-view-scrollbar-gutter | layout | P4 | **Done (P4):** Top bar and view: scrollbar gutter: Stable by default through `--ds-view-scrollbar-gutter`; Progressive (Safari before 18.2 ignores it). |
| layout-missed-5 | layout | P4 | **Done (P4):** Active labels: without a glide: Colour transition exists only under `.ds-has-indicator`; browser test. |
| layout-missed-6 | layout | P4 | **Done (P4):** Top bar and view: view swap sequence: Documented sequence with a child `settled()`, supersession counter and a browser test; P7's D30 fallback keeps only its `enter(…, 'swap')` step. |
| js-indicator-observe | js | P4 | **Done (P4):** Indicator: observing, self-updating, destroy, morph-safe: `ownerDocument`/`defaultView`, observers, destroyed flag; the `data-ds-keep` part is P2 (js-morph-indicator). |
| js-indicator-glide-window | js | P4 | **Done (P4):** Indicator: glide decision: Same task; the tokens.test literal pin is replaced (Tests). |
| js-indicator-stretch | js | P4 | **Done (P4):** Indicator: drawing and stretch, stretch: Default, not opt-in (D20). The draft's "lead edge 0.75 × dur" is replaced by the lag design (critique §1, controls' variant). |
| js-nav-scroll-chase | js | P4 | **Done (P4):** Styleguide: nav click: `setActive` on click, observer muted until `scrollend` or a token-based quiet period; pattern documented. |
| repo-drawer-enter-axis | repo | P4 | **Done (P4):** Drawer and modal drawer: drawer coming back: X-axis rule on the spring done here. The panel glide is moved to P7 (layout-drawer-hidden-jump, container morph): a `translate`-only FLIP cannot animate the 256px width change and would open a gap at the right edge. |
| repo-indicator-glide-constant | repo | P4 | **Done (P4):** Indicator: glide decision; Tests (tokens.test.js): No exported constant is needed: timing comes from computed tokens; the source-text pin becomes a no-literal check plus browser tests. |
| repo-missed-8 | repo | P4 | **Done (P4):** Drawer and modal drawer: open and close: Close is `--ds-dur-base` (200ms, the authority's duration for exits of panels) against the 450ms entrance: 0.44, inside the authority's 0.3-0.8 band; the coverage note's 250ms/420ms pair came from superseded tokens and the old 0.5 floor. Row added to P1's ratio test. |
| core-css-starting-style | core | P5 | **Done (P5):** Presence utility; Dialog (native by hand): `.ds-presence`, top-level `@starting-style`, `[popover]:not(:popover-open)` in its own rule; the choosing rule in motion.md |
| overlay-closing-class-lifecycle | overlay | P5 | **Done (P5):** DS.overlay module (close order); Docs (Dialog): DS.overlay owns the lifecycle; the docs give the hide-and-remove-in-one-task order for the hand path; `settled()` from P2 |
| overlay-focus-during-exit | overlay | P5 | **Done (P5):** DS.overlay module (open, close, Escape stack): inert box only, focus back at once, Escape stack, siblings inert as the div trap, `showModal()` as the native trap |
| overlay-toast-close-focus-loss | overlay | P5 | **Done (P5):** Snackbars (focus on close): uses P2 `leave(..., { focus })` fallback; never `<body>` |
| overlay-tooltip-demo-interrupt | overlay | P5 | **Done (P5):** Tooltip (`tooltips()`): relatedTarget check, hoverable grace, Escape, cancellable hide, in-place swap |
| overlay-keyframes-not-interruptible | overlay | P5 | **Done (P5):** Dialog / Side sheet / Tooltip / Combobox state paths: `[data-state]` transitions with the closed→flush→open sequence; keyframes only on `:not([data-state])` |
| overlay-native-dialog-starting-style | overlay | P5 | **Done (P5):** Dialog and Side sheet native markup; progressive block: the same inner markup, transparent `::backdrop`, `@starting-style` and `display`/`overlay` allow-discrete as progressive |
| overlay-sheet-entry-curve | overlay | P5 | **Done (P5):** Side sheet (state path): `--ds-ease-spatial` over `--ds-dur-long`; the canonical names replace the draft's `--ds-ease-spatial-slow` |
| overlay-sheet-translucent-panel | overlay | P5 | **Done (P5):** Side sheet (state path, old path, bleed): D16: opaque panel, no fade, bleed for the overshoot; the pairing-test exemption for the full-distance slide |
| overlay-sheet-exit-distance | overlay | P5 | **Done (P5):** Side sheet: the exit mirrors the full width, `--ds-dur-base` on `--ds-ease-exit` (ratio .44, like P4's modal drawer) |
| overlay-sheet-phone-entry | overlay | P5 | **Done (P5):** Side sheet (phones): rises from the bottom, falls on exit; old path `ds-lift-in`/`ds-drop-out` |
| overlay-dialog-exit-symmetry | overlay | P5 | **Done (P5):** Dialog (state path, old path): the exit mirrors the entrance; the old path uses `ds-fade-out` + `ds-shrink-out` |
| overlay-dialog-nested-scrim | overlay | P5 | **Done (P5):** Dialog (nested scrim): `--ds-scrim-nested`, `--ds-dialog-scrim`, `.ds-dialog--nested` set by DS.overlay |
| overlay-dialog-origin-aware | overlay | P5 | **Done (P5):** Dialog (state path); DS.overlay open step 7: origin from `originFrom(opener, box)` via `--ds-motion-origin`. The scale is `--ds-scale-enter` (.98), as the authority sets for dialogs, not the .95 of the coverage note. No `--ds-dialog-origin` hook (the canonical `originFrom` writes `--ds-motion-origin`). Container transform in P7 P7 part: Side sheet: container transform. **P7 part done:** `DS.overlay.open(el, { opener, container: true })`. |
| overlay-toast-reflow-jump | overlay | P5 | **Done (P5):** Snackbars (`toast()`): D19 stack of 3 with `flip()` (P2) for entering and leaving |
| overlay-toast-timer-pause | overlay | P5 | **Done (P5):** Snackbars (timer): hover, focus and hidden-tab pause, length-based timeout, time scale |
| overlay-toast-shift-choreography | overlay | P5 | **Done (P5):** Snackbars (following a side sheet): the region's own transition with the sheet's tokens (`data-follow`); `flip()` is not used here because the canonical signature has no timing option |
| overlay-tooltip-origin-scale | overlay | P5 | **Done (P5):** Tooltip (CSS): D17: fade plus `--ds-scale-tooltip` from the anchor side via `--ds-motion-origin` (no `--ds-tooltip-origin` hook) |
| overlay-tooltip-delays-warmup | overlay | P5 | **Done (P5):** Tooltip (`tooltips()`): delay tokens added here (Tooltip), read through `motionDuration`; warm-up and in-place swap |
| overlay-tooltip-anchor-positioning | overlay | P5 | **Done (P5):** Tooltip (placement): progressive anchor positioning and `popover="manual"`; the JS fallback flips and clamps |
| overlay-combo-popup-no-motion | overlay | P5 | **Done (P5):** Combobox popup; Menu: D17 clip reveal plus `--ds-scale-popup` from the trigger with negative inset room for the shadow; shared by `.ds-menu`; `ds-clip-in` on the hand path (no `ds-unclip-*` keyframes) |
| overlay-combo-active-trail | overlay | P5 | **Done (P5):** Combobox (active trail): fade-in at `--ds-dur-micro`, instant fade-out, no `:hover` layer |
| overlay-combo-chevron-state | overlay | P5 | **Done (P5):** Combobox (chevron): `aria-expanded` selector; D25 `rotate: 180deg` on `--ds-ease-spatial` |
| overlay-combo-forced-colors | overlay | P5 | **Done (P5):** Combobox (forced colours): transparent outline, `SelectedItem`; the forced-colours test is added here (P1 deferred it) |
| overlay-combo-clipped-in-dialog | overlay | P5 | **Done (P5):** Combobox (clipping): `popover="manual"` plus anchor positioning, the JS upward flip, a docs note |
| overlay-scroll-lock-shift | overlay | P5 | **Done (P5):** DS.overlay module (scroll lock): reference-counted; gutter or padding only when the body actually scrolls |
| overlay-missed-2 | overlay | P5 | **Done (P5):** DS.overlay open step 1; Docs (theming.md Embedded, components.md): overlays inside `.ds-theme`; one warning |
| overlay-missed-4 | overlay | P5 | **Done (P5):** Snackbars (live regions): region without role, polite and assertive announcers on the existing `.ds-sr` (no new `.ds-sr-only` class); the old pattern deprecated |
| overlay-missed-5 | overlay | P5 | **Done (P5):** DS.overlay open step 8; Docs (Dialog): `autofocus` documented and honoured; the misleading selector removed |
| js-tooltip-transform-fly | js | P5 | **Done (P5):** Tooltip (CSS); Docs (Tooltip): the fly-in itself is fixed in P1 (individual `scale`); P5 adds the `--ds-tooltip-x/-y` API, fixes docs/components.md:520, and adds the 10%-frame browser test |
| js-tooltip-refocus | js | P5 | **Done (P5):** Tooltip (`tooltips()`): focus between triggers cancels the hide and swaps in place |
| js-tooltip-mouseout-child | js | P5 | **Done (P5):** Tooltip (`tooltips()`): relatedTarget containment; hoverable with the `--ds-delay-tooltip-hide` grace |
| js-toast-stack | js | P5 | **Done (P5):** Snackbars: one API `DS.overlay.toast` (no `showSnackbar`); the timeout formula as stated |
| js-overlay-demo | js | P5 | **Done (P5):** DS.overlay module; Modal drawer mode; Styleguide: close order per the authority (native `close()` first); the drawer returns focus to the menu button |
| js-toast-live-region | js | P5 | **Done (P5):** Snackbars (live regions); Styleguide (index.html:49): the same fix as overlay-missed-4 |
| js-missed-3 | js | P5 | **Done (P5):** Tooltip (placement): repositions on scroll or resize (anchor path or rAF fallback), Escape dismisses |
| repo-opp-interruptible-overlays | repo | P5 | **Done (P5):** State paths of every overlay; Presence utility: origin hooks are the canonical `--ds-motion-origin` / `--ds-clip-from`, not per-component hooks |
| repo-missed-6 | repo | P5 | **Done (P5):** Combobox (forced colours); Tests (css.test.js floating layers): the floating-layer test gains `.ds-combo__popup` and `.ds-menu`; dialog and snackbar are already covered |
| core-css-collapsible-clip | core | P6 | **Done (P6):** Collapsible and chevron: `overflow-clip-margin: var(--ds-space-3)` (one token: Chromium computes a `calc()` there to 0) covers the ring at its P3 start offset; elevation 2/3 clipping accepted; listed under Progressive with a padding fallback. P0 marker passes; Chromium screenshot in feedback.spec.js. |
| core-css-collapsible-polish | core | P6 | **Done (P6):** Collapsible and chevron: Asymmetric open and close (ease-out open per D29), content fade, `.ds-chevron`, Progressive header. Also covers the merged layout-collapsible-asymmetric. |
| core-css-loops | core | P6 | **Done (P6):** Generator; Keyframes: Canonical names replace the draft's (`ds-skeleton-wave`, `ds-progress-head/-tail`, `ds-spinner-arc`, `ds-loader-morph/-turn`), plus `ds-progress-wave` for the travelling determinate wave. The pulse literal becomes `--ds-state-pulse`. `--ds-loop-arc` is 5332ms (four arc cycles, so the advancing start loops seamlessly). |
| layout-progress-handoff | layout | P6 | **Done (P6):** Progress: The bar never animates while indeterminate; the registered `--ds-progress` glides from its previous value. P0 `test.fail` turned green. |
| layout-status-data-crossfade | layout | P6 | **Done (P6):** Status chip: D7: the colour transition stays (now 250ms). Icon via `@starting-style` (Progressive) or `crossfade`. P0 `test.fail` turned green. |
| layout-card-interactive | layout | P6 | **Done (P6):** Card; Ripple hosts: `.ds-card--interactive` with state layer, press morph to `--ds-radius-card-pressed`, optional `--ds-card-hover-shadow`, no transform. Container transform in P7. |
| layout-tile-countup-refresh | layout | P6 | **Done (P6):** Tile; Styleguide: Docs and header only; the `countUp` engine is P2's. |
| layout-tile-press-shape | layout | P6 | **Done (P6):** Tile; Ripple hosts: 16px to 12px through `--ds-tile-radius-pressed` (fallback `--ds-radius-md`, never rounder than at rest), release on `--ds-ease-spatial`. Tested in data.spec.js. |
| layout-table-row-state-layer | layout | P6 | **Done (P6):** Table: Cell-level `color-mix()` layer behind `--ds-table-row-hover`, so it adds to the selection colour. Visible change in the CHANGELOG. |
| layout-table-select-expand | layout | P6 | **Done (P6):** Table; Ripple hosts; Styleguide: Interactive, selected and expandable rows (`grid-template-rows`, ease-out), sort arrow, FLIP recipe with the canonical `flip` options. The P0 spike passed, so rows are ripple hosts; removed rows go at once (a `<tr>` cannot leave out of flow). Tested in data.spec.js. |
| layout-empty-motion-guidance | layout | P6 | **Done (P6):** Stale, empty and guidance: Rewritten for D7: filter results animate through `flip` and `enter`. |
| layout-errors-chevron | layout | P6 | **Done (P6):** Alert and errors; Collapsible and chevron: `rotate` property with the `.ds-chevron` timing; alert.css:124 comment rewritten. |
| layout-alert-exit-space | layout | P6 | **Done (P6):** Alert and errors: Canonical `flip` covers dismissal and insertion (it now also handles plain DOM calls in `mutate`, additive); the draft's `DS.motion.dismiss()` is dropped. Tested in data.spec.js. |
| layout-progress-scalex-radius | layout | P6 | **Done (P6):** Progress: `clip-path` inset with `round`, driven by the registered `--ds-progress` on `--ds-ease-value`. Implemented once, together with repo-progress-scalex. |
| layout-progress-indeterminate-m3 | layout | P6 | **Done (P6):** Generator; Keyframes; Progress; Loadbar: Two canonical keyframes animate the four registered head and tail properties with generated stops (no curve tokens). Same on the loadbar, which stays flat. |
| layout-progress-m3-2024-look | layout | P6 | **Done (P6):** Progress: Gap, stop dot and wave are the default (D10); `--flat` keeps the classic look. The wave travels (`ds-progress-wave`, `--ds-loop-wave`) and stops at 100. Remaining track and dot are background layers of the track (hook `--ds-progress-track`). |
| layout-progress-waiting-shift | layout | P6 | **Done (P6):** Progress: `visibility` instead of `display: none`; the 4px reserve is listed under Changed. |
| layout-loadbar-standalone-delay | layout | P6 | **Done (P6):** Skeleton and loadbar: Delayed fade only when standalone; refresh pattern with `settleLoader(startedAt, { element })`. |
| layout-loadbar-margins | layout | P6 | **Done (P6):** Skeleton and loadbar: Read-only `--ds-content-pad-top/-x` on `.ds-content`; hairline hidden over the loadbar (P7 keeps the rule). |
| layout-skeleton-pulse | layout | P6 | **Done (P6):** Generator; Keyframes; Skeleton: D11: one viewport-anchored diagonal wave per surface, driven by the registered `--ds-skeleton-x`; `ds-pulse` deprecated. |
| layout-spinner-m3-arc | layout | P6 | **Done (P6):** Spinner; Shape loader; Styleguide: Conic arc with registered angles, the determinate wavy ring, and `.ds-loader` adopted by `.ds-boot` and `.ds-loading` (D34). |
| layout-stale-delay | layout | P6 | **Done (P6):** Stale, empty and guidance: Transition delay `--ds-delay-loader`; removal stays instant; `aria-busy` documented. |
| layout-missed-2 | layout | P6 | **Done (P6):** Generator; Skeleton: No `--ds-ease-loop` token: the loop curves are sampled into the loop keyframes, which run `linear` (the loader morph steps on `--ds-ease-spatial`). `ds-pulse` is deprecated and keeps its curve. |
| layout-missed-7 | layout | P6 | **Done (P6):** Stale, empty and guidance: One "Data motion" section in docs/motion.md, referenced from each header. |
| layout-missed-8 | layout | P6 | **Done (P6):** Progress: `aria-valuenow` removed while indeterminate or waiting, `aria-valuetext` set, and restored with the first share. |
| repo-progress-scalex | repo | P6 | **Done (P6):** Progress: Duplicate of layout-progress-scalex-radius, implemented once; the 2024 look per layout-progress-m3-2024-look. |
| core-js-view-transitions | core | P7 | **Done (P7):** `DS.motion.transition()` with the View Transition path keyed on `data-ds-vt`, the watchdog and the D30 fallback; unit tests in `test/motion.test.js`, browser tests in `view-transitions.spec.js`. `DS.motion.transition()`; View-transition CSS in `ds.css`; Tests: Canonical signature `transition(update, { type, from })`. Types via `data-ds-vt`, not view-transition `types`. Fallback per D30 (`.ds-enter--swap`), not an instant swap. |
| overlay-sheet-hairline-scroll-timeline | overlay | P7 | **Done (P7):** `--ds-sheet-scroll`, scoped on the panel, with `ds-scroll-fade` (both ends named) instead of the opacity-1 base (a body without overflow would show the hairline); `scroll.spec.js`. Scroll-driven: sheet head hairline: `timeline-scope` on the panel as the verifier corrected. Opacity-1 base under `@supports (timeline-scope: none)`. |
| overlay-sheet-record-swap | overlay | P7 | **Done (P7):** recipe in `sheet.css` and docs; the page frame keeps no names under an open sheet, so only `ds-sheet-body` moves; `view-transitions.spec.js`. Side sheet: record swap: `morphHtml` plus `transition()` forward/back/fade-through on a record change only. Same-record refresh never transitions. |
| controls-indicator-view-transition | controls | P7 | **Done (P7):** `name` option; within a page the name is lifted and the docked drawer shows live (the pill glides under its labels), the group serves page loads; tested both ways. Indicators across views; Opt-in MPA stylesheet: `name` option → `ds-indicator-<name>`. `::view-transition-group(*)` replaces the wildcard and `view-transition-class`. No literal exception: the file requires `html.ds-theme`. |
| layout-drawer-hidden-jump | layout | P7 | **Done (P7):** panel and view groups over `--ds-dur-long`, the drawer's old-only exit and new-only return, `enter(drawer)` quiet inside a transition. Drawer shown or hidden with a view: Panel morph on `--ds-dur-long` / `--ds-ease-spatial`. Without View Transitions the grid still jumps and the drawer slides in (P4). |
| layout-view-swap-vt | layout | P7 | **Done (P7):** names only while `data-ds-vt` is set, the root crossfade over `--ds-dur-fast`; the top bar's frames stay one picture (Chromium test). View-transition CSS in `ds.css` (names in shell.css, pseudo rules in motion.css): `ds-view` named only during `[data-ds-vt]`. The root keeps a short crossfade, so the unchanged top bar and drawer stay still (no `animation: none` hack). The settled-wait correction is in the docs. |
| layout-scroll-hairline-timeline | layout | P7 | **Done (P7):** hairline on `scroll(nearest block)`, tint on `--ds-view-scroll` (`timeline-scope`), both with `ds-scroll-fade`; `scroll.spec.js`. Scroll-driven: panel hairline and top bar tint: Anonymous `scroll(nearest block)`. The top bar tint (D33) shares the section. |
| layout-table-edge-fade-scroll | layout | P7 | **Done (P7):** `ds-edge-fade` on `scroll(self inline)`; `scroll.spec.js`. Scroll-driven: table edge fades: Registered `--ds-table-fade-*` (Firefox 128 baseline, so `@property` is direct). Animating registered properties is on the authority's allowlist, so no extra rule exception. |
| layout-base-vt-optin | layout | P7 | **Done (P7):** `src/optional/view-transitions.css`; load it as a parser-inserted link, and create named indicators before the new page is captured (docs/install.md). Opt-in MPA stylesheet: `src/optional/` → `dist/css/optional/`. Test exemption with a build and docs check. No reduced-motion block (D8). Smooth scroll stays off. |
| js-view-transitions | js | P7 | **Done (P7):** rapid navigation and the fallback tested in all four projects. `DS.motion.transition()` (fallback, rapid navigation): Duplicate of core-js-view-transitions. The `.ds-view--leaving` fallback is replaced by D30's `.ds-enter--swap` without a waiting step; rapid navigation through `skipTransition()` and `enter()`'s generation token. |
| js-scroll-attr | js | P7 | **Done (P7):** `watchScrolled()` in the styleguide, the views page and the docs; at most two attribute changes over 2000px (`scroll.spec.js`). Scrolled-state fallback and the styleguide: Sentinel IntersectionObserver, docs snippet for frame and sheet. |
| repo-opp-view-transitions | repo | P7 | **Done (P7):** see core-js-view-transitions and layout-base-vt-optin. `DS.motion.transition()`; Opt-in MPA stylesheet: Duplicate. The "instant swap" for embedded use is superseded by D30's fade-through. Selectors `.ds-theme::view-transition-*`, no literal fallbacks. |
| overlay-docs-choreography-table | overlay | P8 | **Done (P8):** the Overlays table of `docs/motion.md` ("Choreography"), one row per layer (scrim, dialog, nested dialog, dialog on a phone, side sheet on desktop and phone, modal drawer and its scrim, snackbar, tooltip and its warm-up, menu, combobox list) with entrance and exit tracks, moves, origin, delays, interruption and focus; `lab.spec.js` "overlay table" opens and closes every row in the lab and compares the engine's tracks, durations, curves and origin with it in all four projects; the overlay demos with Rapid toggle and the layers and lock read-out; the speed select. Docs: `docs/motion.md` section 4, Overlays table; Overlays demos (rapid toggle, layer and lock read-out); speed select; `lab.spec.js` overlays test: Columns as the audit asked, except "reduced motion" (dropped, D8). The slow-motion switch is `--ds-time-scale` (registered in P1), not a class that multiplies tokens. The table is the one source for the overlay timings; the P0 frames are the "before" images. |
| js-playground | js | P8 | **Done (P8):** `styleguide/motion.html` with `lab.js`, the speed select on both pages (`--ds-time-scale`, stored, `?speed=` wins), the curve plots, the spring explainer, the duration ladder, the interruption benches and the rewritten rules disclosure; `lab.spec.js` (speed, curves, ladder, interruption continuity at `?speed=0.1`). Motion Lab page and shared frame; speed select; Foundations group (plots, spring explainer, ladder); interruption benches; styleguide wording: Speeds 1/0.5/0.25/0.1 as factors, in line with the P0 `?speed=`. The reduced-motion and full-motion toggles were dropped (D8, `.ds-motion-full` is gone). Plots sample the real computed easing through a paused WAAPI probe, so no `cubicBezier` or `easing` export is added. JS timers follow because they read `motionDuration` (P2, P5). |
| js-missing-demos | js | P8 | **Done (P8):** 60 lab demos cover every keyframe, motion class and function of the five motion modules (`lab.spec.js` coverage, with the deprecated names on `LAB_EXEMPT`); every demo's Replay timeline and settled stage are snapshots per engine, its Rapid toggle and Reverse at 50% are tested; videos reviewed. `lab.js` registry; Choreography demos; `lab.spec.js` coverage and per-demo tests; videos: Every primitive the audit listed has a demo, except `.ds-motion-full` (removed, D8). `.ds-toast--shown` is shown through `DS.overlay.toast` (P5). The stroke setup for `ds-draw` comes with the P3 checks. The demo for `DS.ripple` uses the P2 module. |
| core-missed-1 | core | MERGED:core-css-distance-inherits (P1) | The whole --ds-enter-*/--ds-leave-* hook family is registered non-inheriting in the same P1 bullet. |
| overlay-missed-3 | overlay | MERGED:overlay-tooltip-demo-interrupt (P5) | The keyboard toolbar race is fixed by the cancellable hide and in-place swap in DS.overlay.tooltips (also js-tooltip-refocus). |
| controls-missed-1 | controls | MERGED:controls-btn-disc-timing (P1) | The disc press scale disappears with the D14 fade-only disc in P1. |
| controls-missed-3 | controls | MERGED:controls-indicator-item-resize (P4) | Position-only shifts are covered by observing every item (P4). |
| layout-collapsible-asymmetric | layout | MERGED:core-css-collapsible-polish (P6) | Same change in motion.css, owned by core. The .ds-errors chevron in P6 reuses its timings. |
| layout-missed-3 | layout | MERGED:repo-docs-opacity-curve (P1) | Rule 2 is reworded in P1 so that leaving fades accelerate; the shell scrim and .ds-view--leaving already conform. |
| js-missed-1 | js | MERGED:js-variant-classes-linger (P2) | enter() -> enter() with another variant leaving the old variant: fixed by clearMotion and generations. |
| js-missed-2 | js | MERGED:js-variant-classes-linger (P2) | leave(then:'keep') leftovers: fixed by clearMotion on the next call. |
| js-missed-4 | js | MERGED:js-settled-robust (P2) | settled() ignores pseudo-element events: covered by the !effect.pseudoElement filter and the evt.pseudoElement check. |
| repo-missed-5 | repo | MERGED:repo-countup-overlap (P2) | A countUp on a disconnected node writes the final value; handled in the countUp rewrite. |
| core-tokens-reduced-fades | core | DROPPED | D8: reduced motion removed entirely; the removal itself is the P1 bullet. |
| core-tokens-reduced-optin | core | DROPPED | D8: no reduced-motion switch, no .ds-motion-full and no .ds-motion-reduce. |
| core-missed-8 | core | DROPPED | D8: prefersReducedMotion() is removed, so there is no listener to add. |
| overlay-tooltip-focus-visible-throws | overlay | DROPPED | D3: Safari 16.4 supports :focus-visible (since 15.4), so matches(':focus-visible') no longer throws on the baseline. The P5 tooltip helper uses it directly. Duplicates js-focus-visible-safari14. |
| overlay-reduced-motion-fades | overlay | DROPPED | D8: reduced motion is removed entirely, so there are no reduced-motion fade tokens. Duplicates core-tokens-reduced-fades. |
| layout-missed-9 | layout | DROPPED | D8 removes reduced motion entirely, so no reduced-motion fallback for the modal drawer. The P1 bullet only removes the related comments. |
| js-focus-visible-safari14 | js | DROPPED | D3 raises the baseline to Safari 16.4, where matches(':focus-visible') works (15.4+); the P5 tooltip helper uses it directly. Duplicates overlay-tooltip-focus-visible-throws. |
| js-reduced-motion-class | js | DROPPED | D8 removes reduced motion entirely: no .ds-motion-reduced class, no change listener. |
| repo-js-reduced-motion-full | repo | DROPPED | D8: prefersReducedMotion() and .ds-motion-full are removed entirely (the removal is a P1 task). |
| repo-docs-reduced-scale | repo | DROPPED | D8: the reduced-motion switch and its comment are deleted. |
| repo-nightly-ci-gate | repo | DROPPED | D4: the nightly template stays as it is, without a green-CI gate. |
| repo-missed-9 | repo | DROPPED | D1 decided it: spatial springs overshoot 2-4% (at most 1.05), so the question is moot. |
