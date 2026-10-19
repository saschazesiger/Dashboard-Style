# Browser tests

Playwright tests that prove motion, layout and behaviour in real engines: Chromium, Firefox and WebKit. They
complement the unit tests in `test/*.test.js`, which stay dependency-free (`npm test` and `npm run check` need
nothing installed and never load this folder: `node --test "test/*.test.js"` does not recurse).

## Running

```sh
npm ci                                   # once: installs the pinned @playwright/test (the only devDependency)
npx playwright install chromium firefox webkit   # only when the pinned browsers are not in the cache yet
npm run test:browser                     # all three engines
npm run test:browser -- --project=webkit # one engine
npm run test:browser:update              # rewrite screenshots and JSON snapshots, then review the diff
DS_SHOTS=local npm run test:browser      # screenshots against __screenshots-local__/ (see "Screenshots")
DS_VIDEO=1 npm run test:browser -- demos.spec.js --project=chromium   # one video per demo at ?speed=0.1
```

- `@playwright/test` is pinned to an exact version in `package.json` (1.63.0: chromium 1243, firefox 1543,
  webkit 2359). Changing it means installing its browsers and changing the CI container tag in the same commit
  (`test/repo.test.js` keeps the two in step).
- The config (`playwright.config.js`) starts `serve.js`, a dependency-free static server for the repository root on
  `http://127.0.0.1:4173`, or on the port in `DS_TEST_PORT`. It never reuses a server that already listens there:
  that one may serve another checkout, or stop when its own run ends, so a busy port fails the run at once. Two runs
  at the same time (or a run in a worktree, see "CI") each take their own port: `DS_TEST_PORT=4174 npm run
  test:browser`.
- A browser that will not start with "error while loading shared libraries" lacks system packages:
  `sudo npx playwright install-deps chromium firefox webkit` (Debian and Ubuntu) installs them. Where installing is
  not possible, extract the same Debian packages into a private folder and point `LD_LIBRARY_PATH` at it before
  running the tests.
- Retries are off and `test.only` fails on CI: a flaky motion test is a bug in the test or in the motion.

## Layout

| Path | What |
|---|---|
| `playwright.config.js` | projects `chromium`, `firefox`, `webkit` (the `fallback` project arrives in P2), viewport 1280 x 800 at scale 1, `en-US`, UTC, light, `reducedMotion: 'no-preference'` |
| `serve.js` | static server: MIME types (`.js` as `text/javascript`, so module fixtures load), nothing outside the root, no listings, no caching headers |
| `helpers/motion.js` | the one helper module (below); imports only `node:*`, so its pure checks run under `node --test` |
| `fixtures/*.html` | minimal pages on `/dist/fonts/fonts.css`, `/dist/ds.css` and `/dist/ds.js` |
| `*.spec.js` | the specs (below) |
| `__screenshots__/` | committed screenshots and JSON timelines, `<project>/<spec>/<name>`, from the CI container |
| `__screenshots-local__/` | gitignored screenshots of this machine (`DS_SHOTS=local`, see "Screenshots") |

### Specs

| Spec | Engines | Asserts |
|---|---|---|
| `smoke.spec.js` | all | the server (types, no listings, nothing outside the root); the styleguide reaches `data-sg-ready` with no console error and runs `DS.version` 0.1.0; every fixture loads cleanly; `module.html` imports the four ES modules; a theme switch sets `data-sg-theme` and re-places the three indicators; a saved theme loads before `data-sg-ready`; `?speed=0.1` slows the styleguide and the fixtures |
| `spike.spec.js` | all | the ten capabilities of the spike ("Capability spike") |
| `baseline.spec.js` | all (phone, themes, forced colours: Chromium) | settled screenshots ("Baselines") |
| `motion-today.spec.js` | all | JSON timelines of every motion utility and animated component; smoke checks for `ds-spin` and `.ds-enter` |
| `frames.spec.js` | Chromium | mid-animation frames (0, 50 %, end) of the overlays, the drawer entrance and the modal drawer |
| `demos.spec.js` | all (videos: Chromium) | every styleguide demo ends settled without a console error; one video per demo with `DS_VIDEO=1` |
| `regressions.spec.js`, `styleguide-regressions.spec.js` | per marker | the known bugs as `test.fail` ("Known bugs") |

### Fixtures

Every fixture loads `/dist/fonts/fonts.css`, `/dist/ds.css` and `/dist/ds.js`, and all but `module.html` also the
shared `fixture.css` and `fixture.js`. `module.html` is the exception: it only compares the ES modules with
`window.DS` and reports through `window.moduleResult`, not through `html[data-fixture-ready]`. `.ds-theme` sits on a wrapper `<div>`, not on `<html>`, and there is no `.ds-base`: the
embedded-widget path is the default under test. The styleguide covers the `html.ds-theme.ds-base` path.

| Fixture | Content |
|---|---|
| `motion.html` | every `.ds-enter` and `.ds-leave` variant on its own element (`#enter-<variant>`, `#leave-<variant>`, `default` for none) with a replay button; `.ds-stagger`, `.ds-reveal` with a `.ds-enter--slide` child, a `.ds-collapsible` with a control flush with its content edge, a delayed spinner (`#delayed-spinner`) and an SVG `<path>` (`#svg-path`) |
| `controls.html` | every `.ds-btn` variant and state, a wrapping `.ds-chips` row, `.ds-switch` off, on and disabled, check and radio cards, a `.ds-table` with a checkbox column, fields with hint and error, `.ds-search`, `.ds-segmented` and a scrolling drawer list with indicators, `.ds-parts` with links, `.ds-link-btn`, `.ds-errors` |
| `feedback.html` | `.ds-progress` at .05, .4 and 1, `--indeterminate`, `--waiting`; loading bar, skeleton, spinners, the four status chips and one whose class a button toggles on the live node, alerts, a clickable tile and a card link |
| `shell.html` | the `.ds-app.ds-app--drawer` frame with top bar, drawer, indicator, scrim and panel; use it at 1000px (docked) and 800px (modal drawer; the menu button and the scrim toggle `data-drawer-open`) |
| `module.html` | imports the four ES modules of `dist/js/`; `window.moduleResult` says whether they export everything `window.DS` exposes |
| `reset.html` | a normalize-like reset without a layer before `ds.css`; expected to change in P1 (the `@layer` break of the migration note) |
| `reset-layered.html` | the same reset in `@layer reset`, declared before `ds.css`; must keep its P0 screenshot after P1 |
| `spike.html` | the test bed of the capability spike, one numbered block per capability; animations start when a test adds the `--run` class |

`fixture.js` fills `[data-icon]` placeholders from `DS.icons`, wires `[data-replay]` buttons
(`DS.motion.replay`), `[data-toggle-class]` buttons and `[data-indicator]` tracks (`DS.indicator.createIndicator`,
reachable as `window.fixtureIndicators`), honours `?speed=` and then sets `html[data-fixture-ready]`.

### Styleguide hooks

`styleguide/styleguide.js` (still a classic ES5 script, so it runs from disk) gives the tests three hooks:

| Hook | Meaning |
|---|---|
| `html[data-sg-ready]` | render, navigation, demos and themes are set up, and a theme saved in `localStorage` (`ds-styleguide-theme`) has loaded; `ready()` waits for it instead of racing the first stagger |
| `html[data-sg-theme="<value>"]` | the theme last applied (`example`, `square`, `dim`, `default`, `file`), set after `afterThemeChange()` refreshed the shown values and re-placed the three indicators; a theme file link is awaited by its `load` or `error` event, a `<style>` preset by one frame, never by a timeout |
| `html[data-sg-speed]` | `?speed=<factor>` is active (see "Slow motion") |

A theme for a test goes in before the page loads:
`page.addInitScript(() => localStorage.setItem('ds-styleguide-theme', 'square'))`, then `ready()`.

## Helper module

`helpers/motion.js` is the only helper file; every spec imports it.

| Function | Use |
|---|---|
| `ready(page)` | fonts loaded, plus `html[data-sg-ready]` on the styleguide or `html[data-fixture-ready]` on a fixture |
| `timeline(locator, { subtree, names })` | `getAnimations()` as data: type, name, pseudo-element, duration, delay, easing (and `keyframeEasing`, where a CSS animation keeps its curve), iterations (`Infinity` for loops), direction, fill, play state, current time |
| `freeze(page)`, `seek(page, ms \| { progress })` | pause every animation (pseudo-elements included) and set its time: for mid-animation screenshots and seek-based sampling |
| `sample(locator, props, times, { pseudo })` | freeze, then seek to each time and read numbers (keys listed in the file header) |
| `rafSample(locator, props, ms, { pseudo })` | the same values every frame in real time; only for interruption, judged with tolerances |
| `settle(page, { timeout })` | waits for every finite animation; rejects and names what still runs (a frozen page never settles) |
| `setSpeed(page, factor)` | reloads with `?speed=<factor>` (see "Slow motion") |
| `press(locator, { holdMs, x, y, pointer })` | real pointer down, hold, up with the mouse; `pointer: 'touch'` taps (context with `hasTouch`), a touch hold needs Chromium |
| `focusByKeyboard(page, locator)` | focus by the Tab key, so `:focus-visible` matches |
| `expectEndState(locator, styles)` | computed styles at rest |
| `series`, `expectMonotonic`, `expectWithin`, `peakRatio`, `expectPeakAtMost`, `expectSettles`, `expectContinuous` | pure checks on a series of numbers, unit-tested in `test/browser-helpers.test.js` |

Mid-animation screenshots pause all animations and seek `currentTime`, then take the shot with
`animations: 'allow'`; the config's `animations: 'disabled'` is only for settled shots. Infinite loops are shot at
fixed seek times for the same reason.

## Known bugs: `test.fail`

A known bug gets a test that asserts the **correct** behaviour, marked as expected to fail:

```js
test('the delayed spinner keeps turning after its entrance', async ({ page }) => {
  test.fail(true, 'repo-enter-iteration: fixed in P1');
  // ... assertions of the correct behaviour ...
});
```

- The condition is `true`, or the engines where the bug reproduces (`browserName === 'webkit'`).
- The reason is `<id>[, <id> ...]: fixed in P<n>`, with the ids of `plans/motion-2/coverage.md` (a decision such
  as `D8` counts as an id); capability gaps use `spike: <capability>`. `test/repo.test.js` checks the format.
- Never `test.fixme`: it never runs and proves nothing. Before committing, confirm that each marker fails, in the
  engines it names, for the reason it names. A reproduction that unexpectedly passes is a finding to re-check, not
  a marker.
- **Flipping a marker:** the phase that fixes the bug deletes the `test.fail(...)` line and nothing else; the test
  then passes as written. If Playwright reports "expected to fail, but passed" earlier, a change fixed the bug as a
  side effect: delete the marker in that change.
- To see why a marked test fails (it reports as passed), run it with `--reporter=json` and read its `errors`, or
  delete the marker locally for a moment.

The markers of P0, in `regressions.spec.js` (fixtures) and `styleguide-regressions.spec.js` (the styleguide's demo
code); every one was confirmed to fail, in the engines it names, for the reason it names. A marker that reads one
point inside a motion fixes that point (pauses and seeks the motion, or waits for a phase of a loop) instead of
relying on frame timing, so a loaded machine cannot make it pass or time out by chance:

| Phase | Test (what the fix makes true) | Ids | Engines |
|---|---|---|---|
| P1 | a delayed spinner plays its entrance once, keeps turning; `enter()` resolves on `animationend` | repo-enter-iteration | all |
| P1 | a `.ds-enter--slide` child of `.ds-reveal` travels `--ds-distance-xl` | core-css-distance-inherits | all |
| P1 | `[hidden]` hides dialog, sheet and combobox popup without `.ds-base` | overlay-hidden-attr-ignored | all |
| P1 | a backdrop click during the dialog exit does not reach the page | overlay-missed-1 | all |
| P1 | a tooltip placed by an inline `transform` is at its anchor at 10 % of the entrance | overlay-tooltip-transform-fly | all |
| P1 | `reducedMotion: 'reduce'` gives the same timelines (enter, leave, spinner, dialog) | D8 | all |
| P2 | `leave(…, { then: 'hide' })` then `enter(el, 'swap')` ends visible | core-js-leave-enter-race, js-leave-enter-race, repo-leave-enter-race | all |
| P2 | a second `countUp()` mid-count never counts backwards (fixture and styleguide tiles) | core-js-countup-reentry, js-countup-concurrent, repo-countup-overlap | all |
| P2 | `enter()` restarts the entrance of an SVG path that carries `.ds-enter` | core-js-replay-svg-reflow | all |
| P2 | `morphHtml()` keeps a track's `.ds-indicator` | js-morph-indicator, controls-indicator-morph-removes | all |
| P2 | `morphHtml()` keeps focus and caret of a focused input | js-morph-focus | all |
| P3 | hovering a disabled chip or switch changes nothing (two tests) | controls-chip-disabled-hover, controls-switch-disabled | all |
| P3 | 50ms after blur a field shows no primary border without its inset shadow | controls-form-blur-ghost | all |
| P3 | the focus ring of a `.ds-parts` link is not clipped | controls-list-parts-clip | all |
| P3 | `.ds-link-btn` and `.ds-errors summary` show the `--ds-focus-outline` ring without `.ds-base` | layout-linkbtn-focus, layout-errors-summary-focus | all |
| P4 | `DS.motion.enter(drawer)` moves along x only, starting left | layout-drawer-enter-axis, repo-drawer-enter-axis | all |
| P4 | 1000px to 800px starts no transition on `.ds-drawer` (no `transitionrun` event) | layout-drawer-resize-slide | all |
| P4 | the indicator follows a growing active label and a badge on an earlier item | controls-indicator-item-resize | all |
| P5 | focus is on the opener two frames after Escape or Cancel (the exit is held until then) | overlay-focus-during-exit | all |
| P5 | tabbing between `[data-tip]` buttons keeps the tooltip shown | overlay-tooltip-demo-interrupt, js-tooltip-refocus | all |
| P5 | the pointer moving onto the icon inside a tooltip button keeps the tooltip | js-tooltip-mouseout-child | all |
| P5 | closing an error snackbar does not drop focus to `<body>` | overlay-toast-close-focus-loss | all |
| P5 | reopening a closing dialog continues from its opacity (the exit held at 40 %, read in one task) | overlay-keyframes-not-interruptible | all |
| P6 | indeterminate to determinate at .3, set in a frame callback 40 to 60 % into the loop's cycle: the bar stays within 30 % from the left edge | layout-progress-handoff | Firefox (the others jump to the share) |
| P6 | a status class change: the icon runs on the container's timing | layout-status-data-crossfade | all |
| P6 | the focus ring of a control flush with an open `.ds-collapsible` is not clipped | core-css-collapsible-clip | Chromium (the clip is gated on `interpolate-size`) |

The clipping tests compare the pixels around the focused control with and without the clip (a style sheet that lifts
it): equal pixels mean nothing was cut off.

## Slow motion: `?speed=`

`?speed=<factor>` with a factor of 1 or less (for example `?speed=0.1`) slows motion down on the styleguide and on
every fixture: the page sets every animation's and transition's `playbackRate` to the factor (capture-phase
`animationstart` and `transitionrun` listeners plus a sweep each frame over `document.getAnimations()`, which also
catches `el.animate()`). The styleguide marks it with `html[data-sg-speed]`, fixtures with `html[data-fx-speed]`.

Limits until P1/P2: only CSS and Web Animations slow down. JS timing keeps its pace: the 1000ms timeout of
`settled()`, the indicator's 600ms glide window and `COUNT_UP_MS`. P1 replaces the bridge with
`--ds-time-scale = 1 / factor` under the same query parameter (and `setSpeed()` with it); the Motion Lab (P8)
builds its global slow motion on that token.

## Screenshots

The committed set in `__screenshots__/<project>/<spec>/` comes from the CI container
`mcr.microsoft.com/playwright:v1.63.0-noble`: run the `check` workflow by hand (Actions, "check", Run workflow) with
"update screenshots" set, download the uploaded `screenshots-<browser>` artifacts (one per engine, each the whole
`__screenshots__/` folder after that engine's run), copy each one's `<browser>/` folder into
`test/browser/__screenshots__/` and commit them. CI compares against that set (`maxDiffPixelRatio: 0.002`).

The JSON timelines of `motion-today.spec.js` sit in the same folder but do not depend on fonts or the rasteriser:
they are compared on every machine, also with `DS_SHOTS=local`.

### The P0 set and local parity

The P0 set (477 PNG and 97 JSON files, 11 MB) was generated in the container image itself: without Docker, the
layers of `mcr.microsoft.com/playwright:v1.63.0-noble` (amd64) were pulled from the registry, extracted into a root
folder and the suite ran there through `chroot` (with `/proc`, `/dev`, `/sys` and the repository bound in,
`CI=1`), with the image's Node 24 and its `/ms-playwright` browsers: the same files and fonts as the CI job. The
first CI run with "update screenshots" should reproduce it; if it differs, its artifacts win.

Parity of this development machine (Debian 12, Playwright's browsers with extracted Debian libraries) against that
set, run on 2026-10-19:

| Engine | Screenshots off by more than 0.2 % | Why |
|---|---|---|
| Chromium | 8 of 197 (sections with monospace or system text: `colour`, `type`, `frame`, the phone frame, forced-colours buttons; three snackbar frames over the colour swatches) | system fonts differ (the monospace stack and fallbacks are not the bundled Google Sans) |
| Firefox | 131 of 140 | anti-aliasing and hinting of every text run (1 to 10 % of a crop's pixels) |
| WebKit | 0 of 140 | |
| JSON timelines | 0 in all engines | |

**Decision: local runs on such a machine use `DS_SHOTS=local`.** The committed container set stays the CI gate, and
local runs compare against the gitignored `__screenshots-local__/`, generated from the parent commit before a
change (below). A machine that runs the container (Docker, Podman, or the `chroot` route above) compares against
the committed set directly.

## CI

`.github/workflows/check.yml` runs on every push and pull request, and by hand (`workflow_dispatch`, with the
"update screenshots" switch). Read-only permissions; runs on `main` are never cancelled (every commit there ships),
older runs of another branch are.

| Job | What |
|---|---|
| `check` | Node 22 and 24: `npm run check` and the vendor round trip; no `npm ci`, the unit tests need nothing installed |
| `browser` | after `check`; one job per engine (`fail-fast: false`) in `mcr.microsoft.com/playwright:v1.63.0-noble` as user 1001: `npm ci`, then the engine's project; uploads `playwright-report/` and `test-results/` on failure (14 days) and, with "update screenshots", the rewritten `__screenshots__/` |

The container tag and the pinned `@playwright/test` version change together (`test/repo.test.js`).

Local runs on another system (fonts, rasteriser) do not match it (see "The P0 set and local parity").
`DS_SHOTS=local` switches the screenshot folder to the gitignored `__screenshots-local__/`. Generate it from the
parent commit before a change, then run the tests on the change against it, so a local run still proves "no
unintended visual change":

```sh
git worktree add ../ds-parent HEAD
(cd ../ds-parent && npm ci && DS_TEST_PORT=4174 DS_SHOTS=local npm run test:browser:update)
rm -rf test/browser/__screenshots-local__ && cp -r ../ds-parent/test/browser/__screenshots-local__ test/browser/
DS_SHOTS=local npm run test:browser
```

A run in a worktree takes its own `DS_TEST_PORT`, so it can never meet a server started from another checkout (the
config refuses a busy port rather than reuse it). The committed `__screenshots__/` set is only ever rewritten from
the CI container: never run plain `npm run test:browser:update` on another system. The container set stays the CI
gate. With Docker or Podman installed, local runs can use the container route
instead, without other changes.

## Baselines

### Settled screenshots: `baseline.spec.js`

One set of element shots (or a clip around a part, so focus rings and halos fit), never full pages:

| Group | Engines | Shots |
|---|---|---|
| styleguide sections | all three | every section (`overview` plus each `section('<id>'` of `styleguide.js`, 15), in a 1280 x 2200 viewport, so no section is cut by the scrolling view |
| fixture controls | all three | the eight sections of `controls.html` at rest; 27 controls (buttons, chips, switches, check and radio cards, a table row and sort button, link button, field, search, segmented option, drawer item, a `.ds-parts` link, the `.ds-errors` summary, the clickable tile and the card link) hovered, pressed and held, and focused by the Tab key (the radio cards: only the checked one is a tab stop); nine disabled controls hovered |
| feedback parts | all three | progress at .05, .4 and 1, waiting, the status chips and a status swapped on the live node, the alerts; indeterminate progress, the skeleton with its loading bar, the loading line and the spinners at 0 and 25 % of their loop |
| app frame | all three | `shell.html` docked at 1000px, scrolled (hairline), with `data-drawer-hidden`; the modal drawer closed and open at 800px |
| overlays | all three | the styleguide's dialog and side sheet at 1280px, the side sheet at 390px, two snackbars, the tooltip, the open combobox |
| reset fixtures | all three | `reset.html` and `reset-layered.html` |
| phone, themes, forced colours | Chromium | the frame, table and overlays sections at 390px; buttons, forms and cards with the `example`, `square` and `dim` presets (set through `localStorage` in `addInitScript`); buttons, forms, selection, overlays and loading with `forcedColors: 'active'` (skipped, with the reason, where the engine does not emulate it) |

Settled means `ready()`, `settle()`, the count-up tiles at their final value, the pointer parked at (1, 1), and
every infinite loop paused at a fixed point of its cycle; the shots then use `animations: 'allow'`, because
`'disabled'` would cancel the loops. A held press is a real `mouse.down()` held while the shot is taken and released
off the content, so it toggles and navigates nothing. Each test names the `src/` anchors it covers as `src`
annotations.

Size in the committed container set: 437 PNG files, 7.9 MB (Chromium 157 files, 3.1 MB; Firefox and WebKit 140
files each, 2.4 MB each). The 45 section shots are 3.2 MB of it; the state crops are 1 to 5 kB each. With the
mid-animation frames (40 files, 1.8 MB) and the JSON timelines (97 files, 0.4 MB) the whole `__screenshots__/`
folder is 11 MB.

### Motion timelines: `motion-today.spec.js`

`timeline()` of every motion, stored as JSON snapshots (one set per engine,
`__screenshots__/<project>/motion-today.spec.js/<name>.json`): every `.ds-enter` and `.ds-leave` variant,
`.ds-stagger > *`, `.ds-reveal`, the spinner, the skeleton, the loading bar, indeterminate progress, the dialog and
the side sheet opening and closing, a snackbar entering and leaving, the tooltip showing and hiding, the drawer
indicator gliding and the modal drawer (and its scrim) opening and closing. A snapshot holds the timing contract
only (type, name, pseudo-element, target, duration, delay, easing, keyframe easing, iterations, direction, fill),
never the current time or play state. Each motion is started and paused in the same task, so nothing finishes
before it is read. In P1 these files show exactly what the new token system changes.

- JSON snapshots do not depend on fonts or the rasteriser: they always live in `__screenshots__/`, also with
  `DS_SHOTS=local` (the config sets `snapshotPathTemplate` for them and `expect.toHaveScreenshot.pathTemplate` for
  screenshots).
- `.ds-collapsible` (Chromium, where `interpolate-size` exists): Chromium runs its height transition on
  `::details-content` but does not list it in `getAnimations()`, so the snapshot holds the declared transition
  and the test proves that it runs (a height between closed and open two frames after each toggle). Firefox and
  WebKit skip it with that reason.

### Mid-animation frames: `frames.spec.js`

Chromium only, to keep the set small: the side sheet (1280 and 390px) and the dialog opening and closing, a snackbar
entering and leaving, the tooltip showing and hiding (clips), the drawer entrance (`DS.motion.enter(drawer)` at
1000px) and the modal drawer opening and closing at 800px, each at 0, 50 % and the end: 40 PNG files. The motion is
started and paused in the same task, then every animation is seeked to one time (so a `visibility` flip at the end
of a slide stays at the end). The demos' 1000ms `settled()` timeout and the snackbar's 4s auto-close are dropped
for the test, so an exit stays on screen while it is seeked; seeking into the after phase still fires
`animationend`, so an exit's end frame shows what the demo leaves behind. The combobox has no entrance today (the
list appears at once; the test asserts that nothing animates), so it has one frame. These are the before-images of
P4, P5 and P8.

### Demo walk-through: `demos.spec.js`

One test per styleguide demo: the `[data-sg]` buttons (`toggle`, `switch`, `menu` at 800px, `toast`,
`toast-error`, `stagger`, `fill`, `count`, `sheet`, `dialog`, `progress`, `dense`, `busy`), the enter and leave
buttons of the Motion card, the track and segmented options and the disclosure. Each checks what the demo did and
must end settled with no console error.

`DS_VIDEO=1 npm run test:browser -- demos.spec.js --project=chromium` records one video per demo at `?speed=0.1`
into `test-results/` (not committed; other engines skip). Later phases record their "before" videos from the P0
tag: `git worktree add ../ds-before motion-2-p0`, then the same command there after `npm ci`, with its own
`DS_TEST_PORT` (for example 4175) when another run is going on.

### Source anchors

The audit's layout findings cite `dist/ds.css` lines; these are the matching `src/` lines, verified at `05aaeb3`
(`src/` is unchanged since). Specs and annotations use them.

| Part | `src/` anchor |
|---|---|
| drawer entrance (`.ds-drawer.ds-enter`) | `components/shell.css:248-252` |
| `.ds-view--leaving` | `components/shell.css:545-550` |
| modal drawer, closed and open | `components/shell.css:576-603` (its transform and transitions 588-603) |
| scrim | `components/shell.css:622-645` |
| progress bar, indeterminate, waiting | `components/progress.css:25-48` (transition 35, indeterminate 38-44) |
| boot, loading line | `components/loading.css:20-40` |
| skeleton | `components/loading.css:42-69` (`ds-pulse` at line 62) |
| loading bar | `components/loading.css:76-113` |
| spinner | `components/spinner.css:16-44` (`ds-spin` at line 24) |
| status transition | `components/status.css:28-30` |
| table row hover | `components/table.css:84` |
| table edge masks | `components/table.css:198-226` (the container-query mask 198-201, the phone mask 223-226) |
| `.ds-link-btn` | `components/table.css:251-272` |
| `.ds-errors` | `components/alert.css:89-131` |
| card arrow lean | `components/card.css:145-155` |
| clickable tile layer | `components/tile.css:107-118` |
| `.ds-stale` | `components/utilities.css:65` |
| `.ds-parts` clip | `components/list.css:146-151` |
| `.ds-input` transition and focus | `components/form.css:206-208`, `:247` |
| `.ds-enter.ds-enter` | `motion.css:144` |
| `.ds-reveal` | `motion.css:203` |
| `.ds-collapsible` | `motion.css:216-228` |
| `ds-pulse`, `ds-indeterminate` | `motion.css:106`, `:111` |

## Capability spike

`spike.spec.js` on `fixtures/spike.html` asserts, in every engine, a capability that a later design relies on;
gaps are `test.fail(browserName === '<engine>', 'spike: <capability>')`. Findings that are recorded rather than
asserted are `spike-result` annotations of the test. Results with Playwright 1.63.0 (chromium 1243, firefox 1543,
webkit 2359), run on 2026-10-19; no engine needed a marker:

| # | Capability | Chromium | Firefox | WebKit | Design consequence |
|---|---|---|---|---|---|
| 1 | Interruption: `cancel()` then `animate([current, target])`, with `linear()` and cubic easing | works; `animate()` accepts `linear()` | works; accepts `linear()` | works; accepts `linear()` | P2's mechanism is confirmed: read the computed values, `cancel()`, `animate()` in the same task shows no un-animated frame and continues without a jump. The cubic fallback stays for engines on the floor without `linear()` (Chrome/Edge 111-112, Safari 16.4-17.1). |
| 2 | `setKeyframes()` / `updateTiming()` on a running `CSSAnimation` (for the record) | works | works | works | Script-set keyframes and duration stick (a later `animation-duration` change is ignored), a property the script left alone (the delay) still follows the CSS, `animation-name: none` removes the animation. Not used: the authority keeps mechanism 1. |
| 3 | `translate` keyframes over an inline `transform`; `composite: 'add'` | composes; `add` works | composes; `add` works | composes; `add` works | Tooltip and indicator keep their inline `transform` under `translate` keyframes (at 10 % the box sits at the anchor plus the keyframe offset). FLIP retargeting may use `composite: 'add'` on `translate`. |
| 4 | Pseudo-element animations in `getAnimations()`, seekable | listed with `pseudoElement`; seek reflected | same | same | P6's loader and progress tests can sample `::before`/`::after` with `freeze()`/`seek()`. |
| 5 | `appearance: none` checkbox and radio with pseudo-elements and halo | renders; halo not clipped in `.ds-table-wrap` | same | same | D23 as planned in P3: `::before`/`::after` on the 18px input and a `box-shadow` halo; the header checkbox's 10px halo fits in the default cell padding. |
| 6 | `translate` on a `<tr>`; `position: relative` on a `<tr>` | the cells move; the row contains the absolute child | same | same | Rows FLIP with `translate` and can host the ripple; the WebKit containment quirk does not show in the tested build (keep the "rows FLIP even without ripple" fallback for older WebKit on the floor). |
| 7 | Registered properties in durations and delays; `inherits: false` | duration and delay scale ×10; `inherits: false` stays put | same | same | P1's `--ds-time-scale` (registered, `inherits: true`) can multiply durations and delays through `calc()`; motion hooks registered with `inherits: false` do not leak to children. |
| 8 | Focus snap: `outline-offset` transition beside a running animation | ring solid at frame 1, offset 4 → 3 → 2px; the animation keeps running | same | same | D24 as planned in P3: a transition on `outline-offset` never takes over `animation`. |
| 9 | A closing `<dialog>` above a sticky element | paints above | paints above | paints above | P5's `--closing` rule (`display: block; position: fixed; z-index`) keeps a closed dialog above sticky content in every engine. |
| 10 | Skeleton wave in phase across bones (`background-attachment: fixed`) | one phase across bones; breaks under an ancestor's `translate` animation, also while a finished one fills; holds once it is gone | same as Chromium | one phase in every case | P6: the wave starts after the container's entrance, and no entrance around a skeleton fills forwards (`.ds-enter` fills `backwards` only). Noted in `plans/motion-2/P6.md`. |
