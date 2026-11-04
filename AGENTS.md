# AGENTS.md

Notes for AI agents (Claude Code, Codex, opencode ...) and people working on Dashboard-Style. User documentation:
[README.md](README.md) and the [docs](README.md#-documentation).

## In brief

- A **generic, themeable design system** for admin dashboards in the Material 3 / Google console style: CSS tokens
  (`--ds-*`), components (`.ds-*`), motion, 275 outline icons and Google Sans. Plain CSS and dependency-free JS, MIT.
- **Project-neutral.** Nothing in the repository names a project, organisation, place, brand colour or brand font
  that uses it; `test/repo.test.js` fails on a list of such names. Examples use generic content (devices, tickets,
  "Product", Ada Lovelace). Anything specific to one product stays in that product's repository.
- **English** everywhere: code, comments, docs, commit messages.
- `src/` is the source, `dist/` is what projects vendor. `dist/` is built by `npm run build` and **committed**.

## Commands

| Command | Purpose |
|---|---|
| `npm run check` | tests + verify that `dist/` matches `src/` and that the generated curves, keyframes and masks in `tokens.css` and `motion.css` match their generator (`node scripts/motion-curves.mjs --check`); CI runs this; run it before every commit |
| `npm test` | tests only (`node --test`, Node 22+; needs `npm ci` once, for lightningcss) |
| `npm run build` | rebuild `dist/` and the generated files (`src/index.css`, `docs/components.md`, `styleguide/demos.js`) after any change to `src/`, `fonts/`, `LICENSE` or the version; stops when a `meta.json` does not match its stylesheet; minifies with lightningcss (a pinned devDependency, D12: `npm ci` first) |
| `node scripts/motion-curves.mjs` | regenerate the sampled `linear()` curves (`--ds-ease-spatial`, `--ds-ease-emphasized`) and the progress masks in `src/core/tokens.css`, and the generated loop keyframe stops (loader shapes, spinner arc, indeterminate progress, skeleton wave) in `src/core/motion.css`; never edit them by hand |
| `sh scripts/site.sh <dest>` | assemble the GitHub Pages site (`demo/`, `example/`, `styleguide/`, `dist/`, `docs/`, `themes/`, a root page that forwards to the live tour) into an empty `<dest>` (default `_site`, gitignored); `pages.yml` runs it |
| `sh scripts/vendor.sh --from . <dest>` | copy this checkout's `dist/` into a project to try a change there (`--check <dest>` verifies a copy; Windows: `scripts/vendor.ps1 -From`) |
| `sh scripts/vendor.sh --from . /tmp/ds && sh scripts/vendor.sh --check /tmp/ds` | the vendor round trip CI runs after `npm run check` |
| `node dist/tools/verify.mjs` (or `sh dist/tools/verify.sh`) | verify a built `dist/` or a vendored copy against its `SHA256SUMS` without network (`--dir <path>` / a path for another copy); the same rules as `vendor.sh --check` |
| `node dist/tools/check-theme.mjs <theme.css> [--with dist/themes/dark.css]` | check a theme file: unknown names, motion tokens, `:root`, `@layer`, `!important`, field text under 16px and removed names fail; contrast pairs, deprecated names and restyled components warn |
| `node dist/tools/bundle.mjs --config ds.config.json [--check]` | a project bundle (`ds.bundle.css`, `ds.bundle.js`, the report `ds.bundle.json`, `properties.css`) of only the classes, attributes, modules and icons a project names, from the copy's `manifest.json`; `--check` fails a stale bundle (`docs/bundle.md`); `tools/vite-plugin.mjs` runs the same scan in Vite; fixtures in `test/fixtures/bundle/` |
| `node scripts/tools/theme.mjs --seed <colour> [--scheme tonal] [--contrast high] --out <file>` | the theme generator: one seed (HCT, `tools/color.mjs`) to one `.ds-theme` file with every colour role as `light-dark()`, checked against every pair in both schemes (`docs/theme-generator.md`); `--presets` rewrites `themes/presets/`, `--presets --check` compares them (the unit tests do too) |
| `node dist/tools/check-project.mjs --config ds-check.json` | the project rules of the block at the end of this file, run on a project (`docs/install.md`, "Check a project"); fixtures in `test/check-project.test.js` |
| `npm ci` | once, before the build and the tests (installs the pinned devDependencies `@playwright/test` and `lightningcss`; dist/ and its tools need neither); add `npx playwright install --with-deps chromium firefox webkit` when the pinned browsers are not cached |
| `npm run test:browser` | browser tests in Chromium, Firefox and WebKit (`test/browser/`), plus the `fallback` project (Chromium as an engine on the browser floor: the progressive CSS stripped, no View Transitions or `moveBefore`) for the specs that import `base-test.js`; run it before every push. Outside the Playwright container (other fonts and rasteriser) run `DS_SHOTS=local npm run test:browser`: screenshots then compare against the gitignored `__screenshots-local__/`, generated from the parent commit (`test/browser/README.md`, "CI"). `DS_TEST_PORT` picks another port for a second run or a worktree |
| `npm run test:browser:update` | rewrite screenshots and JSON timelines, then review the diff. The committed `__screenshots__/` set is only ever rewritten from the CI container (Actions → check → Run workflow → "update screenshots"); elsewhere update with `DS_SHOTS=local`, see `test/browser/README.md` |
| open `styleguide/index.html` and `styleguide/motion.html` | the styleguide (every component, token and icon) and the Motion Lab (every curve, duration and choreography, replayable, with rapid toggles and reversals); both work from disk. "Load theme file ..." tries a theme; the speed select in the top bar (1×, 0.5×, 0.25×, 0.1×) or `?speed=0.1` slows every duration and delay tenfold |

## Files

| Path | What |
|---|---|
| `src/core/tokens.css` | all tokens on `.ds-theme` in `@layer ds.tokens`: layer 1 scales before the `── 2. Palette` marker, layer 2 roles after it, the `linear()` refinements at the end; `@property --ds-time-scale` at top level; the one non-custom property, `color-scheme` from `--ds-color-scheme` on `:where(.ds-theme)` (zero specificity) |
| `src/core/motion.css` | every `@keyframes` (in `ds.motion`) and the motion utilities (`.ds-enter`, `.ds-leave`, `.ds-stagger`, `.ds-reveal`, `.ds-collapsible`, `.ds-swap`, in `ds.utilities`), plus the non-inheriting hook registrations (`@property`, top level) |
| `src/core/options.css` | the option classes (size, density, shape, tone, touch; `docs/options.md`), in `ds.utilities`: they set only custom properties, which components compute from in their own rules; their defaults are the "Options" block of `tokens.css` |
| `src/core/base.css` | opt-in page base, scoped with `:where(.ds-base)` |
| `src/core/global.css` | the rules for every element inside `.ds-theme`, whatever components a page uses (border-box sizing, the forced-colours icon colour), in `ds.components` and inlined right before the first component, so every bundle and every set of single files carries them; a rule that no class or `data-ds-*` attribute keys belongs here (tested, with the proof that `ds.css` cascades as before) |
| `src/components/<name>/` | one folder per component: `<name>.css`, `meta.json` (name, group, order = cascade order, docsOrder, classes, attributes, requires, context, hooks, keyframes, js, progressive, ripple; maintained by hand, checked against the stylesheet by the build; `scripts/gen-meta.mjs` shows how the first ones were derived), its section of `docs/components.md` (`<name>.md`) and, where split, its styleguide demo (`<name>.demo.js`, exports only, built into `styleguide/demos.js`); `_partials/` holds the parts of `docs/components.md` that belong to no component. The components (39: `alert`, `badge`, `button`, `card`, `chart`, `chip`, `combobox`, `dialog`, `disclosure`, `drag`, `empty`, `form`, `indicator`, `list`, `loader`, `loading`, `menu`, `page`, `pagination`, `progress`, `prose`, `ripple`, `savebar`, `scroller`, `sheet`, `shell`, `slider`, `spinner`, `status`, `steps`, `switch`, `table`, `tabs`, `tasks`, `tile`, `timeline`, `toast`, `tooltip`, `utilities`; the styleguide's `Components` tile counts them, tested); the header comment sketches markup, modifiers, hooks and "Progressive:" features |
| `src/index.css` | **generated** from `meta.json` `order`: the layer order statement, the statement of the reserved component sublayers (`ds.components.<name>`, empty until a component moves in; the header comment says why), then the `@import` list = cascade order of `ds.css` |
| `src/optional/` | opt-in stylesheets (`view-transitions.css`: View Transitions across page loads), built to `dist/css/optional/`, never in `index.css` or `ds.css` |
| `src/js/*.js` | ES modules `core` (the one runtime per page, `define`, `init` with its observer, `get`, `destroy`, `emit`, `config`, `t`; `docs/core.md`), `motion`, `indicator`, `dom`, `ripple`, `icons`, `overlay`, in `MODULES` order (core first); `scripts/build.mjs` wraps them into `dist/ds.js` as `window.DS.*` through `scripts/tools/js-wrap.mjs` in merge mode (a sibling `import` becomes a read of `DS.<module>`; a later copy or bundle of the same version adds what the page lacks instead of returning early; `DS.init`, `DS.get`, `DS.define`, `DS.config` are `DS.core`'s) |
| `src/js/<module>.requires.json` | optional, next to its module: the components the module always needs (`requires`) and, per export, those whose markup that export writes itself (`exportRequires`: `confirm` → button, dialog, spinner); the build checks it and writes it, with the module's own component (the `meta.json` `js` arrays inverted), into `manifest.json` `js.<module>`, which `tools/bundle.mjs` resolves |
| `fonts/` | Google Sans woff2, `fonts.css`, `OFL.txt` (copied to `dist/fonts/`) |
| `themes/example.css` | theme template: lists every role (a test enforces it) and the hooks, commented out |
| `themes/presets/` | generated by `scripts/tools/theme.mjs --presets` (never by hand): `default`, `slate`, `ocean`, `forest`, `violet`, `amber`, `rose`, `graphite`, each `<name>.css` and `<name>-contrast.css`, one file for both schemes (`light-dark()`, `data-ds-scheme` pins a region); copied to `dist/themes/presets/`; a test keeps them equal to the generator |
| `themes/dark.css`, `themes/compact.css`, `themes/contrast.css` | the shipped themes, copied to `dist/themes/`: every non-derived colour role in the dark tones; compact type and the dense density (`--ds-density: -2`, plus the heights of the components not on the options model yet; the default density and heights back under a coarse pointer); palette-neutral contrast mixes. Contrast pairs and completeness tested in `test/tokens.test.js`; a package that adds a colour role adds its dark and contrast values |
| `src/types/` | hand-written TypeScript declarations: `ds.d.ts` (the global `DS` with its module namespaces and the `DS.init`/`get`/`define`/`config` aliases, and `DashboardStyle.runtime`; copied to `dist/ds.d.ts`) and `js/<module>.d.ts` (each module's exports with their options and handles, copied next to the module in `dist/js/`); `test/build.test.js` keeps the declared exports and their parameter names equal to the modules |
| `src/deprecations.json` | every deprecated and removed name as data (`dist/deprecations.json`); a removed name gets `removed` set |
| `styleguide/` | living styleguide on top of `dist/`: `index.html` (components, tokens, icons) and `motion.html` (the Motion Lab); `styleguide.js` is the one shared script (frame, navigation, themes, speed select, the index demos and the component count tile), `lab.js` the Motion Lab's demo registry (`window.SG_LAB`) |
| `docs/` | `install`, `bundle` (loading only what a page uses), `core` (`js/core.js`: runtime, behaviours, `init()`, events, strings), `tokens`, `options` (size, density, shape, tone, touch and how a component computes them), `theming`, `theme-generator` (`tools/theme.mjs` and the presets), `components` (**generated** from `src/components/_partials/` and every `<name>.md`; edit those), `patterns`, `motion`, `icons`, `rules` (with the accessibility statement) |
| `docs/images/` | the screenshots and GIFs of `README.md`, taken from the live tour, the reference app and the styleguide; retake them when the look changes |
| `demo/` | the live tour, the start page on GitHub Pages: one page with a working demo of every behaviour (press, controls, live data, overlays, feedback, forms, theming, icons), wired as a project wires it (`theme.js` builds the theme from the choices under "Theme it" and shows its file, `demo.css` project components with the prefix `demo-`, `demo.js` the page; classic scripts on `../dist/`, so it works from disk); `test/browser/demo.spec.js` runs it |
| `example/` | the reference app, published on GitHub Pages: a device console that uses the system as a project does (`theme.css` the project theme, `app.css` project components with the prefix `ex-`, `data.js` a fake backend, `app.js` the app; classic scripts on `../dist/`, so it works from disk); its `README.md` maps every pattern to its code. It follows the documented markup and the project rules of "Using Dashboard-Style in a project" below; `test/browser/example.spec.js` runs its flows |
| `scripts/` | `build.mjs` (deterministic, `--check` covers `dist/` and the generated files; checks every `meta.json`; writes the single stylesheets to `dist/css/core/` and `dist/css/components/<name>.css`, a `.min.css` with source map next to each and `ds.min.css` (lightningcss, at the floor, lowering nothing), `ds.min.js` (`stripJs`), `dist/manifest.json`, the version banner on every CSS, JS, MJS, `.d.ts` and shell file, and `dist/tokens.json` from `tokens.css`, the hooks table of `docs/theming.md` and the stylesheets; every file of `scripts/tools/` ships to `dist/tools/` by itself), `gen-meta.mjs` (how the first `meta.json` files were derived, kept for reference), `motion-curves.mjs` (the one source of sampled curves, `--check`), `vendor.sh` / `vendor.ps1` (checksummed copies for projects), `site.sh` (the GitHub Pages site) |
| `scripts/tools/` | the tools shipped in `dist/tools/`, dependency-free: `verify.mjs` and `verify.sh` (a copy against `SHA256SUMS`; `verify.sh` holds `check_dir` of `vendor.sh` word for word), `check-theme.mjs` (reads `light-dark()`: every pair in each scheme a theme shows), `check-project.mjs`, `bundle.mjs` and `vite-plugin.mjs` (a project bundle from `manifest.json`; `docs/bundle.md`), `theme.mjs` (the theme generator) and the modules they share: `theme-rules.mjs` (the contrast pairs, the motion prefixes, the colour resolver and `pickLightDark()`, also read by `test/tokens.test.js`), `css-scan.mjs`, `color.mjs` (a port of Material Color Utilities' HCT, Apache-2.0, notice in `LICENSE`) and `js-wrap.mjs` (the classic-script wrapper of `ds.js` and of every bundle) |
| `templates/update-dashboard-style.yml` | nightly GitHub Actions workflow that projects copy to vendor `main` |
| `test/` | `css`, `tokens`, `options` (the option classes of `core/options.css`), `motion`, `js`, `build`, `registry` (meta.json, the generated files, the manifest, the minified output), `repo`, `controls`, `tools`, `check-project`, `bundle`, `core` (`js/core.js` on a fake DOM), `theme-generator`, `helpers` and `browser-helpers` unit tests; `helpers.js`; `fixtures/bundle/` (a small fake copy and fixture projects for the bundle tool; the bundle tests also bundle from this checkout's `dist/`) |
| `test/browser/` | Playwright harness (`playwright.config.js`, `serve.js`, `base-test.js`: the shared `test` of the specs that also run in `fallback`), `fixtures/`, the one helper module `helpers/motion.js`, the specs (baselines, timelines, capability spike, `lab` for the Motion Lab: coverage, every demo, interruption, the overlay table; `review` for the whole-page sweeps; `perf` for the paint budget and style recalc times, alone) and the committed `__screenshots__/`; `README.md` explains them |
| `plans/` | working plans (`motion-2.md` and its phases, complete; `after-2.0.md`, what 2.0.0 deferred or left open, the names 3.0 may remove and the wishes that were dropped); kept outside `docs/` so the docs tests do not count them |
| `.github/workflows/pages.yml` | GitHub Pages (the live tour at the root): after `check` passed on a push to `main` (or by hand), `npm run check`, `scripts/site.sh`, deploy; the repository's Pages source is "GitHub Actions" |
| `.github/workflows/check.yml` | CI on every push, pull request and by hand: `check` (Node 22 and 24: `npm run check` and the vendor round trip), then `browser` (Playwright in `mcr.microsoft.com/playwright:v<pinned>-noble`, one job per engine); Run workflow with "update screenshots" uploads a new screenshot set |

## Conventions

- English; comments explain *why*, not what. Follow the style of the surrounding file.
- Keep each file's header comment (markup, modifiers, hooks, "Progressive:" features) in step with the code; the
  tests read the "Progressive:" notes.

## Non-negotiables

The tests in `test/` enforce most of these; do not weaken a test to make a change pass.

- **Tokens on `.ds-theme`, never `:root`**, so the system can run inside someone else's page. The `@property`
  registrations (`--ds-time-scale`, the motion hooks) are the one documented exception: they sit at top level. Only
  the `ds-` prefix for classes, custom properties and keyframes; no bare element selector outside a `.ds-` scope.
- **Three token layers.** 1 scales (motion, spacing, state layers, z) are the same in every theme; 2 roles (palette,
  type, radii, elevation, focus, links, layout) are what a theme overrides; 3 hooks (`--ds-btn-*`, `--ds-card-*` ...)
  are read by one component with a fallback (`var(--ds-btn-height, 36px)`). Themes never set motion tokens or
  motion hooks (`--ds-dur-*`, `--ds-ease-*`, `--ds-distance-*`, `--ds-scale-*`, `--ds-loop-*`, `--ds-delay-*`,
  `--ds-hold-*`, `--ds-stagger`, `--ds-time-scale`, `--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`,
  `--ds-clip-from`, `--ds-draw-length`, `--ds-scan-*`, `--ds-indicator-lag`, `--ds-indicator-dur`): motion is one
  scheme for every product, and `DS.motion` reads the computed tokens. The per-element motion hooks take tokens
  only and do not inherit: set them on the animating element. `--ds-time-scale` is for the styleguide and the tests
  only.
- **No literals in components**: colours, radii, shadows, type (`font` roles), durations, curves, opacities
  (`--ds-state-*`) and z-indices (`--ds-z-*`) come from tokens. Literal values live only in `src/core/tokens.css` and
  theme files. A missing value becomes a token (with docs), never a literal.
- **Options are computed where they are used** (`src/core/options.css`, `docs/options.md`). The option classes
  (`.ds-xs` … `.ds-xl`, `.ds-density-*`, `.ds-shape-*`, `.ds-tone-*`, `.ds-touch`) set only their numeric or tone
  custom properties (`--ds-size-step`, `--ds-size-font`, `--ds-density`, `--ds-shape`, `--ds-target-min`,
  `--ds-tone`, `--ds-on-tone`, `--ds-tone-container`, `--ds-on-tone-container`), in `ds.utilities`; their
  defaults sit on `.ds-theme` and no role reads them (tested), so a class on a region applies inside it. A component
  computes its sizes in its own rule into private `--_<x>` properties (never documented, never set from outside):
  8px of height per size step, 4px per density step, `max(--ds-target-min, …)` so touch wins, every radius times
  `--ds-shape`. `plans/3.0-conventions.md` section 11 shows the button as the reference port.
- **Floor: Safari 17.5, Chrome/Edge 123, Firefox 130** (D9). Everything in `src/` may run in an embedded widget on
  such a browser. Allowed directly: `:focus-visible`, `:has()`, `inset`, container size queries, `color-mix()`,
  `oklch()`, `light-dark()` (colours only), `svh`/`dvh`, `<dialog>`, `inert`, `@layer`, `@property`, the
  individual `translate`/`scale`/`rotate`, `linear()`, `@starting-style`, `transition-behavior: allow-discrete`,
  `popover` (always `manual`; closing stays in `DS.overlay`), `details[name]`, `text-wrap: balance`,
  `:user-invalid` and subgrid; in JS `Promise.withResolvers`, the Set methods and `structuredClone`. No CSS nesting
  in `src/`. Progressive only, behind a feature query where it matters, and named by feature under "Progressive:"
  in the file header with its fallback (tested): relative colour syntax, anchor positioning, View Transitions,
  scroll-driven animations, `interpolate-size`, `::details-content`, `field-sizing`, `text-wrap: pretty`, style
  queries, `@scope`, `closedby`, invoker commands, `appearance: base-select`, `moveBefore()`, the Navigation API,
  iterator helpers, `sibling-index()`, `overflow-clip-margin`, `scrollbar-gutter`, `focus({ focusVisible: false })`,
  plus `scrollbar-color`. A port drops the fallbacks of what is now at the floor (a `linear()` fallback, a keyframe
  twin of a `@starting-style` entrance). JS is ES2022; a module may import named exports from an earlier module in `MODULES`
  (`import { a } from './motion.js';`, one line), exports only as `export const` / `export function`, newer APIs
  only behind feature detection, named under "Progressive:".
- **Cascade layers.** `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;` is the first statement
  of every stylesheet in `src/` (`dist/ds.css` declares it once); each file wraps its rules in one block
  (`tokens.css` → `ds.tokens`, `base.css` → `ds.base`, components → `ds.components`; `motion.css` puts its
  keyframes in `ds.motion` and its utilities in `ds.utilities`). `@property` and `@font-face` (and
  `@view-transition` in `src/optional/`) stay at top level; themes, `fonts.css` and project CSS stay unlayered, so
  they win. No doubled-class or other specificity tricks:
  the layer order decides. `!important` only on the allowlist (tested): `[hidden]` in `base.css`, the `.ds-sr`
  rules, the alignment utilities `.ds-num` and `.ds-center`, the forced-colours `svg` colour in `global.css`.
- **Motion.** `@keyframes` only in `src/core/motion.css`, each name once; entrances define only `from`, exits only
  `to`, with named exemptions (tested). Movement keyframes use `translate`/`scale`; exits are movement-only and
  pair with `ds-fade-out`. Durations and curves only from tokens. Effects (opacity, colour) and values run on
  curves within [0, 1] that never decrease; movement that floats runs on the spring `--ds-ease-spatial` (peak at
  most 1.05, then it settles; the percentage is the contract); sizes that push layout never overshoot
  (`--ds-ease-out`). Animate only `transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`,
  `clip-path` and registered custom properties; named exceptions, each allowed by the test when its feature
  lands: `rotate` (spinners, loaders, disclosure chevrons, the table sort arrow, icon swaps), `border-radius` (press morph),
  `outline-offset` (focus snap, transition only), `stroke-dashoffset` (drawn checks), `mask-position` (the
  progress wave), the chip check slot `width`, the heights of `.ds-collapsible`, validation messages and
  expandable rows (`grid-template-rows`), and the `min-height` of a `DS.motion.flip` container shrinking after removals. Never
  `transition: all`, never `font-weight`. Exits take 0.3-0.8 of their entrance (tested); so does a state that shows
  on one duration and hides on another (in on `--ds-dur-fast`, out on `--ds-dur-instant`; never `transition: none`
  for the hide). Hover never moves
  anything; nothing scales on press except the switch handle. Data changes glide only through `countUp`, value bars and `DS.motion.flip`
  (live reorders wait while pointed at or focused, at most 2s); re-render with `DS.dom.morphHtml`, never
  `innerHTML`. Interrupted motion continues from its current state; JS timing comes from the computed tokens
  (`motionDuration`), never ms literals; constants are tested fallbacks (`MOTION_FALLBACKS`). Never a near-zero
  duration on a loop (it races).
- **View Transitions and scroll-driven animations.** View Transitions only through `DS.motion.transition()` for
  navigation, never for data; `::view-transition-*` rules hang off `.ds-theme` (so they match only on `<html>`);
  `@view-transition` and permanent `view-transition-name`s only in `src/optional/` (`ds.css` names the frame only
  while `data-ds-vt` is set). Scroll-driven animations only as documented refinements with a static or
  `data-scrolled` fallback; `animation-timeline` after the `animation` shorthand, named timelines behind
  `@supports (timeline-scope: none)` (tested).
- **State layers.** Hover and press lay `currentColor` (or the hook) over the control at `--ds-state-hover` /
  `--ds-state-pressed` via `::before`; hover rules only inside `@media (hover: hover)`. The press comes in
  `--ds-dur-micro` (`:active` and the `.ds-pressed` that `DS.ripple` holds), never `--ds-dur-instant`; with
  `DS.ripple.attach()` the ripple brings the press and the flat layer stays at its hover value (each host has its
  `.ds-ripples` rule in `ripple.css`; every action is a host or on the tested exemption list). Pills morph: the
  rest radius is `min(radius, half the height)`, never 9999px; pressed it turns `--ds-radius-action-pressed` in
  `--ds-dur-micro` and springs back on `--ds-ease-spatial` over `--ds-dur-medium` (radio cards:
  `--ds-radius-card-pressed`); disabled, `aria-disabled` and busy controls neither morph nor show a press, and the
  action guard (`DS.motion.guard()`, installed by `busy()` and `DS.ripple.attach()`) keeps every input from
  reaching an `aria-disabled`, busy or done action (`data-ds-guard="off"` lets a control explain itself). Focus is
  a 2px ring (`--ds-focus-outline`) on `:focus-visible`, solid from the first frame: it rests at offset + width
  (inset rings: 0) and only `outline-offset` transitions, on `--ds-dur-fast` (never a keyframe, never its colour or
  width), with the focus layer (`--ds-state-focus`) at once. The switch handle is the only thing that scales on
  press (never above 1). Disabled is one model: `--ds-disabled-*`, faded on `--ds-dur-fast`.
- **Overlays.** Dialogs, side sheets, the modal drawer, menus, the combobox list, tooltips and snackbars open and
  close through `DS.overlay` (`open`, `close`, `tooltips`, `toast`) or follow its contract (docs/motion.md). The
  overlay lives inside `.ds-theme`. During the exit only the box or panel is inert; the backdrop keeps catching
  pointer input, so nothing reaches the page through it. Focus returns to the opener as soon as the close starts.
  Escape closes only the top layer, after the page's own handlers (bubble phase: `preventDefault()` keeps it open).
  Snackbars stay above every modal, usable and announced. The scroll lock is reference-counted (`lockScroll` /
  `unlockScroll`). Motion is state-driven: transitions keyed on `data-state` reverse from the current value;
  keyframes only on `:not([data-state])` (the hand path).
- **Every action is a pill at the default shape** (D11): its rest radius is `min(--ds-radius-action, half the
  height)` times `--ds-shape`, so a square theme or region (`.ds-shape-square`) has square actions and the default
  keeps the pill; the pressed radius scales with it. One filled button per area. No red buttons on pages; the one
  exception (D10) is a filled button in the error tone (`.ds-btn--filled.ds-tone-error`) that confirms a destructive
  action in the confirm dialog or the type-to-confirm pattern, its label naming the consequence. Inline text links
  (`.ds-link-btn`, links in text) are the exception to ripple and morph.
- **Status never by colour alone**: icon and word on status chips and alerts, a check on selected chips, selected
  table rows keep their checkbox, the label weight or `aria-*` on active items.
- **Forced colors** (`@media (forced-colors: active)`): floating layers (dialogs, sheets, the modal drawer,
  snackbars, tooltips, menus and the combobox list) keep a transparent outline or border that becomes their edge,
  selects get their native arrow back, spinner, switch, progress and loading bar use system colours. One model per
  meaning: a choice in a set (selected option, current drawer item, segmented option, current list row, selected
  tab) is `SelectedItem` / `SelectedItemText`; an on/off toggle (`aria-pressed`, an open disclosure button, a
  checked chip, a selected tile or card) is `Highlight` / `HighlightText`; blocked (`disabled`, `aria-disabled`) is
  `GrayText`; a focused selected item takes a `CanvasText` ring inside its fill.
- **Accessibility**: text roles pass WCAG AA (the default palette is tested), field text 16px on phones
  (`--ds-font-input`), labels above fields, icons `aria-hidden`.

## Making a change

Work in `src/`, never in `dist/`. Every change follows the same path:
**src → docs → styleguide demo → unit tests → browser tests → CHANGELOG → version in `package.json` →
`npm run build` → `npm run check` → `npm run test:browser`**, and `src/` and `dist/` are committed together.
A change to documented markup, a hook or a JS export that `example/` or `demo/` uses updates the reference app and
the live tour in the same commit, so the published pages never show a deprecated pattern.

- **Component**: a new folder `src/components/<name>/` with `<name>.css` (the usual header comment) and its
  `meta.json` (its `order` places it in the cascade; `npm run build` regenerates `src/index.css` and says what the
  file is missing); a section `<name>.md` (markup, modifiers, behaviour the page must add) with its `docsOrder`
  plus a row in its "Which component for which need" table; new hooks in the table of `docs/theming.md` and
  commented in `themes/example.css`; a demo in `styleguide/styleguide.js` (raise the `Components` tile, a test
  counts the files); its motion as a row of the choreography in `docs/motion.md` and a Motion Lab demo (below);
  forced-colors behaviour and browser motion tests checked. Every `.ds-*` class must appear in
  `docs/components.md` (tested).
- **Motion** (a keyframe, a utility, a JS export, a component's choreography): a Motion Lab demo, an entry in
  `styleguide/lab.js` whose `shows` lists every keyframe, class, export and token it plays, with Replay and, when
  the motion is reversible, a `toggle` (Rapid toggle, Reverse at 50%). The coverage test of
  `test/browser/lab.spec.js` fails for a keyframe, motion class or function of `DS.motion`, `DS.dom`,
  `DS.indicator`, `DS.ripple` or `DS.overlay` that no demo shows (or that is not on its `LAB_EXEMPT` list with a
  reason). An overlay's timing also goes into the Overlays table of `docs/motion.md`, which the same spec compares
  with what every engine plays.
- **Token**: a role goes after the `── 2. Palette` marker in `src/core/tokens.css`, into `docs/tokens.md` and
  `themes/example.css` (tested); a new colour role gets its dark tone in `themes/dark.css` (unless it is derived or
  a `var()` of another role; tested) and, where it carries text or a line, its value in `themes/contrast.css`; its
  pair goes into `scripts/tools/theme-rules.mjs` (`TEXT_PAIRS`, `CONTROL_PAIRS`, `ICON_PAIRS` or the chart lists,
  copied into the styleguide's theme check; tested), which checks the default palette and every shipped theme. A scale goes
  before the marker; a duration-like scale is written as `calc(<n>ms * var(--ds-time-scale, 1))` (tested). Every
  `--ds-*` name must appear in `docs/` (tested).
- **Icon**: a named export in `src/js/icons.js` (24px grid, flat shapes, no `stroke`, `fill`, `class` or colour of
  their own; tested) and its name in the glyph table of `docs/icons.md`. The styleguide lists glyphs by itself.
- **Keyframe**: only in `src/core/motion.css` with the `ds-` prefix, a row in the keyframe table of `docs/motion.md`
  (tested); use it through tokens so `--ds-time-scale` applies; a Motion Lab demo shows it (tested).
- **JS export**: in `src/js/*.js`, documented in `docs/core.md` (core), `docs/icons.md` (icons) or `docs/motion.md`
  (the rest; tested), declared with its options and handle in `src/types/js/<module>.d.ts` (same parameter names;
  tested); a function of a motion module gets a Motion Lab demo (tested). An export that writes markup of a
  component itself (a dialog, a live region on `.ds-sr`) names those components in `exportRequires` of
  `src/js/<module>.requires.json`, so a bundle that uses it gets their CSS.
- **JS module** (until the build reads `src/components/<name>/<name>.js`, a component's behaviour is a module of
  `src/js/` too): `src/js/<name>.js`, plain ES2022, `export const` / `export function` only, imports only as
  `import { a, b } from './core.js';` on one line from modules earlier in `MODULES`; register behaviours with
  `define('<name>', { attribute: 'data-ds-<name>', init(el, ctx) { ... } })` from `./core.js` (state that must be
  one per page in `runtime.state('<name>', ...)`, strings through `t()`), never a global listener of its own. Then
  add it to `MODULES` in `scripts/build.mjs` (after every module it imports from), write
  `src/types/js/<name>.d.ts` and its namespace in `src/types/ds.d.ts`, list the module in the `js` of the
  component's `meta.json` (a module named like its component gets that stylesheet as `requires` by itself),
  add `src/js/<name>.requires.json` when an export writes other components' markup, document every export in
  `docs/motion.md` (the docs test reads `docs/core.md` for core, `docs/icons.md` for icons, `docs/motion.md` for every
  other module), and add the module to the imports of `test/js.test.js`, the module list of
  `test/browser/fixtures/module.html` (with its smoke test), the `dist/` table in `docs/install.md` and a Motion
  Lab demo or `LAB_EXEMPT` entry for what it moves.

## Releases

- **`main` is always releasable and every push ships.** Projects vendor the latest `main`, and their nightly
  workflow (`templates/update-dashboard-style.yml`, 02:30 UTC) picks up any new commit, runs their checks, commits
  the copy and deploys. A push to `main` reaches every project within about 24 hours without anyone reviewing it
  there, so `npm run check` must pass and the styleguide must look right before pushing.
- **The nightly does not wait for this repo's CI.** Push to `main` only what passed `npm run check` and
  `npm run test:browser` locally (`DS_SHOTS=local` outside the Playwright container), or work on a branch and merge
  it once its CI is green.
- **Never break a project.** Prefer additive changes: a new class, modifier, hook or token instead of changing
  what an existing one means. A rename is an addition that keeps the old name working:
  - role: keep `--ds-old: <value>` and add `--ds-new: var(--ds-old)` on `.ds-theme`, so a theme that sets either
    name still works (both appear in `themes/example.css` and `docs/tokens.md`);
  - hook: components read `var(--ds-new, var(--ds-old, <fallback>))`;
  - class: list both selectors; keyframe or JS export: keep both names.

  Mark the old name deprecated in the docs and the changelog, and add it to `src/deprecations.json`. Remove it only
  in a later major version, once projects have moved; the entry stays, with `removed` set to that version, so
  `tools/check-project.mjs` and the projects' own tests fail on it.
- **Semver** in `package.json` and `CHANGELOG.md` is information, not protection: projects vendor `main` whatever
  the number says. The build writes the version into the banners and `DS.version`, and a test keeps them in step.
  Every change to what `dist/` does or offers gets a new version and a `## x.y.z` section at the top of the
  changelog: patch for fixes, minor for additions and deprecations, major for removing a deprecated name, with a
  migration note (old name, new name, what a project has to change).

## Using Dashboard-Style in a project

Copy this block into the project's own `AGENTS.md` and fill in the placeholders (`<dest>`, `<prefix>`,
`<theme file>`, `<check command>`, `<update command>`):

```markdown
## Design system: Dashboard-Style

- The UI is built on [Dashboard-Style](https://github.com/saschazesiger/Dashboard-Style), vendored in `<dest>`
  (tokens `--ds-*`, components `.ds-*`, `DS.motion`, `DS.indicator`, `DS.dom`, `DS.ripple`, `DS.icons`,
  `DS.overlay`). Call `DS.ripple.attach(document)` once at start-up: every action gets the pointer ripple, and the
  action guard it installs blocks busy, done and `aria-disabled="true"` actions for every input (click, keys,
  submit); a control that explains itself on click sits in `data-ds-guard="off"`. Open and close dialogs, side sheets, the modal drawer, menus and the combobox list with `DS.overlay.open(el, { opener })` /
  `DS.overlay.close(el)`, show snackbars with `DS.overlay.toast(region, text)` and tooltips with one
  `DS.overlay.tooltips(document)`; every overlay sits inside the `.ds-theme` element.
- Never edit `<dest>`: it is checksummed (`<dest>/SHA256SUMS`, checked by `<check command>`) and replaced by the
  nightly `.github/workflows/update-dashboard-style.yml` (by hand: `<update command>`). A fix or a component every
  dashboard could use goes to Dashboard-Style itself (project-neutral, English), then the copy is updated.
- When the nightly update fails at "Verify", nothing was committed and the site keeps the old copy: run
  `<update command>` and `<check command>` locally, read Dashboard-Style's `CHANGELOG.md` for deprecations and
  removals, and commit the new copy together with the project's fix (or fix Dashboard-Style; the next run picks it
  up). Then Actions → "Update Dashboard-Style" → *Run workflow*. More in its `docs/install.md`, "When the update
  fails".
- Reach for an existing component first. The docs are not part of the vendored copy: the table "Which component
  for which need" and the markup of every component are in
  https://github.com/saschazesiger/Dashboard-Style/blob/main/docs/components.md; for live examples clone the
  repository and open `styleguide/index.html` (every component) and `styleguide/motion.html` (the Motion Lab: every
  choreography, replayable and slowed down with its speed select; both work from disk). What each component plays
  is the choreography in https://github.com/saschazesiger/Dashboard-Style/blob/main/docs/motion.md. Copy the
  documented markup and attributes exactly; behaviour (wiring the triggers, filtering, choosing) is the project's own script, and opening and
  closing go through `DS.overlay`.
- Theme only through tokens in `<theme file>`, on `.ds-theme`, loaded after `ds.css`: roles (`--ds-primary`,
  `--ds-accent`, `--ds-font` ...), component hooks (`--ds-btn-*`, `--ds-card-*` ...), the project's own
  `--<prefix>-*` tokens and `@font-face`. Never set motion tokens or hooks (`--ds-dur-*`, `--ds-ease-*`,
  `--ds-distance-*`, `--ds-scale-*`, `--ds-loop-*`, `--ds-delay-*`, `--ds-hold-*`, `--ds-stagger`,
  `--ds-time-scale`, `--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`, `--ds-clip-from`, `--ds-draw-length`,
  `--ds-scan-*`, `--ds-indicator-lag`, `--ds-indicator-dur`). Never wrap the theme in `@layer`.
- `ds.css` sits in `@layer ds.*`, so unlayered project CSS beats every component. Load resets in a layer declared
  before ds (`@layer reset;` first, or `@layer reset, ds, app;`). Under `.ds-base`, `hidden` always hides; never add
  a `[hidden]` rule.
- Never write the attributes the system owns (those the "Attributes" table in
  https://github.com/saschazesiger/Dashboard-Style/blob/main/docs/components.md lists as written by the system, such
  as `data-scrolled`); the page sets only its own ones.
- Never change the look of a `.ds-*` component in project CSS (colour, radius, type, motion); set its hooks
  instead, in the theme or on the element. Placing a `.ds-*` element inside a project container is fine; document
  any deliberate deviation with its reason.
- Local components use the project prefix `<prefix>-` and read tokens only (`--ds-*` and `--<prefix>-*`): no
  colour, radius, font, shadow, duration or curve literals, no own `@keyframes` (use the `ds-*` keyframes and
  motion tokens). A project element that acts on a press (a row, a tile of its own) takes `.ds-pressable` (state
  layer, focus ring, ripple), never a `::before` state layer of its own.
- Size, density, shape and tone are option classes (`.ds-sm`, `.ds-density-dense`, `.ds-shape-square`,
  `.ds-tone-error` …) on the element or a container, never hooks set per size in project CSS.
- Bigger targets for a finger are opt-in: `.ds-touch` on the `.ds-theme` element or a container, never a
  `pointer: coarse` rule of the project's own. A widget embedded in someone else's page never calls
  `DS.dom.followViewport()`: the host page owns the viewport.
- Re-render with `DS.dom.morphHtml` (key list rows with `data-ds-key`), never `innerHTML`; it patches in place, so
  bind listeners once (or mark a subtree `data-ds-replace`). Reorders go through `DS.motion.flip`, figures through
  `DS.motion.countUp`; JS timing comes from `DS.motion.motionDuration()`, never ms literals.
- Icons only from `DS.icons` / `js/icons.js`; status never by colour alone; actions are pills at the default shape
  (a square theme makes them square); no red buttons except the filled error button of a destructive confirmation.
- Run `node <dest>/tools/check-project.mjs --config ds-check.json` in CI (`docs/install.md`, "Check a project"): it
  checks the bullets above (rules `vendor`, `classes`, `deprecated`, `literals`, `keyframes`, `themes`, `layers`,
  `hidden`, `restyle`, `attributes`, `dom`, `pressable`); a deliberate deviation is an exception in
  `ds-check.json` with its reason.
```
