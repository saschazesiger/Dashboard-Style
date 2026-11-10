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
| `npm test` | tests only (`node --test` over `test/*.test.js` and `src/components/*/*.test.js`, Node 22+; needs `npm ci` once, for lightningcss) |
| `npm run build` | rebuild `dist/` and the generated files (`node scripts/build.mjs --generated` lists them: `src/index.css`, `docs/components.md`, `styleguide/demos.js`, `styleguide/lab-components.js`, `styleguide/registry.js`, `styleguide/theme-generator.js`, and the `generated:` blocks of `docs/theming.md`, `docs/motion.md`, `docs/install.md`, `docs/react.md`, `src/types/ds.d.ts`, `src/js/ripple.js` and `themes/example.css`, the README badge, and the bundles of the page patterns (`src/patterns/ds/`) and of the live tour (`demo/ds/`), written by `tools/bundle.mjs` from the `dist/` just built and listed once git tracks them) after any change to `src/`, `fonts/`, `LICENSE` or the version; stops when a `meta.json` does not match `scripts/meta-schema.json`, its folder or its stylesheet; minifies with lightningcss (a pinned devDependency, D12: `npm ci` first) |
| `node scripts/motion-curves.mjs` | regenerate the sampled `linear()` curves (`--ds-ease-spatial`, `--ds-ease-emphasized`) and the progress masks in `src/core/tokens.css`, and the generated loop keyframe stops (loader shapes, spinner arc, indeterminate progress, skeleton wave) in `src/core/motion.css`; never edit them by hand |
| `sh scripts/site.sh <dest>` | assemble the GitHub Pages site (`demo/`, `example/`, `styleguide/`, `dist/`, `docs/`, `themes/`, `src/patterns/`, a root page that forwards to the live tour) into an empty `<dest>` (default `_site`, gitignored); `pages.yml` runs it |
| `sh scripts/vendor.sh --from . <dest>` | copy this checkout's `dist/` into a project to try a change there (`--check <dest>` verifies a copy; Windows: `scripts/vendor.ps1 -From`) |
| `sh scripts/vendor.sh --from . /tmp/ds && sh scripts/vendor.sh --check /tmp/ds` | the vendor round trip CI runs after `npm run check` |
| `node dist/tools/verify.mjs` (or `sh dist/tools/verify.sh`) | verify a built `dist/` or a vendored copy against its `SHA256SUMS` without network (`--dir <path>` / a path for another copy); the same rules as `vendor.sh --check` |
| `node dist/tools/check-theme.mjs <theme.css> [--with dist/themes/dark.css]` | check a theme file: unknown names, motion tokens, `:root`, `@layer`, `!important`, field text under 16px and removed names fail; contrast pairs, deprecated names and restyled components warn |
| `node dist/tools/bundle.mjs --config ds.config.json [--check]` | a project bundle (`ds.bundle.css`, `ds.bundle.js`, the report `ds.bundle.json`, `properties.css`) of only the classes, attributes, modules and icons a project names, from the copy's `manifest.json`; `--check` fails a stale bundle (`docs/bundle.md`); `tools/vite-plugin.mjs` runs the same scan in Vite; fixtures in `test/fixtures/bundle/` |
| `node scripts/tools/theme.mjs --seed <colour> [--scheme tonal] [--contrast high] --out <file>` | the theme generator: one seed (HCT, `tools/color.mjs`) to one `.ds-theme` file with every colour role as `light-dark()`, checked against every pair in both schemes (`docs/theme-generator.md`); `--presets` rewrites `themes/presets/`, `--presets --check` compares them (the unit tests do too) |
| `node dist/tools/check-project.mjs --config ds-check.json` | the project rules of the block at the end of this file, run on a project (`docs/install.md`, "Check a project"); fixtures in `test/check-project.test.js` |
| `node dist/tools/migrate.mjs --config ds-check.json [--write]` | a 2.x project to 3.0 (`docs/migration.md`): rewrites every name of `deprecations.json` it can map, lists the rest for a person with file and line, sets `"major"`; a dry run (diff and report) without `--write`, exit 1 while anything is left; the 2.x fixture project in `test/fixtures/migrate/` (`project/` to `expected/`) |
| `npm ci` | once, before the build and the tests (installs the pinned devDependencies `@playwright/test` and `lightningcss`; dist/ and its tools need neither); add `npx playwright install --with-deps chromium firefox webkit` when the pinned browsers are not cached |
| `npm run test:browser` | browser tests in Chromium, Firefox and WebKit (`test/browser/`), plus the `fallback` project (Chromium as an engine on the browser floor: the progressive CSS stripped, no View Transitions or `moveBefore`) for the specs that import `base-test.js`; run it before every push. Outside the Playwright container (other fonts and rasteriser) run `DS_SHOTS=local npm run test:browser`: screenshots then compare against the gitignored `__screenshots-local__/`, generated from the parent commit (`test/browser/README.md`, "CI"). `DS_TEST_PORT` picks another port for a second run or a worktree |
| `npm run test:browser:update` | rewrite screenshots and JSON timelines, then review the diff. The committed `__screenshots__/` set is only ever rewritten from the CI container (Actions → check → Run workflow → "update screenshots"); elsewhere update with `DS_SHOTS=local`, see `test/browser/README.md` |
| open `styleguide/index.html` and `styleguide/motion.html` | the styleguide (a page per component with a demo and its options panel, the foundations, search, the live theme generator) and the Motion Lab (every curve, duration and choreography, replayable, with rapid toggles and reversals); all work from disk, the generator included, in every engine. "Theme file" puts a shipped theme or a snippet over the preset and "Load theme file ..." tries a theme; the speed select in the top bar (1×, 0.5×, 0.25×, 0.1×) or `?speed=0.1` slows every duration and delay tenfold |

## Files

| Path | What |
|---|---|
| `src/core/tokens.css` | all tokens on `.ds-theme` in `@layer ds.tokens`: layer 1 scales before the `── 2. Palette` marker, layer 2 roles after it, the `linear()` refinements at the end; `@property --ds-time-scale` at top level; the one non-custom property, `color-scheme` from `--ds-color-scheme` on `:where(.ds-theme)` (zero specificity) |
| `src/core/motion.css` | every core `@keyframes` (in `ds.motion`; `dist/` appends each component's `<name>.keyframes.css`) and the motion utilities (`.ds-enter`, `.ds-leave`, `.ds-stagger`, `.ds-reveal`, `.ds-collapsible`, `.ds-swap`, in `ds.utilities`), plus the non-inheriting hook registrations (`@property`, top level) |
| `src/core/options.css` | the option classes (size, density, shape, tone, touch; `docs/options.md`), in `ds.utilities`: they set only custom properties, which components compute from in their own rules; their defaults are the "Options" block of `tokens.css` |
| `src/core/base.css` | opt-in page base, scoped with `:where(.ds-base)` |
| `src/core/global.css` | the rules for every element inside `.ds-theme`, whatever components a page uses (border-box sizing, the forced-colours icon colour), in `ds.components.global` (the first sublayer) and inlined right before the first component, so every bundle and every set of single files carries them; a rule that no class or `data-ds-*` attribute keys belongs here (tested, with the proof that `ds.css` cascades as before) |
| `src/core/hooks.json` | the hooks of the core stylesheets, the rows of the hooks table no `meta.json` owns (`{ "--ds-x": { "default", "description" } }`) |
| `src/components/<name>/` | one folder per component, everything it owns (`plans/3.0-conventions.md`, section 1): `<name>.css`; `meta.json` (validated against `scripts/meta-schema.json`, which describes every field, and checked against the stylesheet by the build); its section of `docs/components.md` (`<name>.md`); its styleguide demo (`<name>.demo.js`, `SG.demo()`, built into `styleguide/demos.js`); and where it applies its behaviour module `<name>.js` with its types `<name>.d.ts` (and `<name>.requires.json`), its unit tests `<name>.test.js` (run by `npm test`), its Playwright spec `<name>.spec.js` (and `<name>.fixture.html`), its Motion Lab entries `<name>.lab.js` (built into `styleguide/lab-components.js`) and its keyframes `<name>.keyframes.css` (appended to `motion.css` in `dist/`). Any other file stops the build. `_partials/` holds the parts of `docs/components.md` that belong to no component. No file lists the components by hand: the build counts the folders (the README badge) and the `Components` tile of both styleguide pages counts `registry.js` (tested); the header comment of each stylesheet sketches markup, modifiers, hooks and "Progressive:" features |
| `src/index.css` | **generated** from `meta.json` `order`: the layer order statement, the sublayer statement (`ds.components.global`, then `ds.components.<name>` per component; the header comment says how a rule finds its sublayer), then the `@import` list = cascade order of `ds.css` |
| `src/patterns/` | the page patterns (`docs/patterns.md`, "Page patterns"): copy-ready pages built only from components, one `<name>.html` each with `<meta name="pt-title">`, `pt-need` and `pt-group` (the styleguide lists them by these, through `registry.js`); `pt.css` (their few layout rules, prefix `pt-`, tokens only, no restyle) and `pt.js` (the demo's frame: the scheme and preset from the query or the stored choice, the dark-theme button), nothing else of their own; `ds.config.json` (one bundle entry per family of pages) and `ds/` (**generated**: the bundles `tools/bundle.mjs` writes from `dist/` during `npm run build`, compared by `--check`). Each page links its entry's bundle, the fonts and a preset of `dist/` by relative paths, so it works from disk and on GitHub Pages (`site.sh` keeps the layout); `dist/` never holds them. The build stops on any other file, a page without its metas, in no entry or linking another entry's bundle; `test/patterns.test.js` and `test/browser/patterns.spec.js` cover them |
| `src/optional/` | opt-in stylesheets (`view-transitions.css`: View Transitions across page loads), built to `dist/css/optional/`, never in `index.css` or `ds.css` |
| `src/js/*.js` | the core ES modules `core` (the one runtime per page, `define`, `init` with its observer, `get`, `destroy`, `emit`, `config`, `t`; `docs/core.md`), `motion`, `indicator`, `dom`, `ripple`, `icons`, `position` (placing popups), `overlay` (the stack, focus, inert, scroll lock), and the helpers `a11y`, `hotkeys`, `format`, `store`, `virtual`, `dnd` (`docs/core.md`), in `CORE_MODULES` order (core first). Dialogs, toast, tooltips and menus have their modules in their folders; `overlay.js` opens and closes them. `MODULES` in `scripts/build.mjs` is these, then every component module (`src/components/<name>/<name>.js`, discovered and ordered by its imports); the build writes them flat to `dist/js/<name>.js` (a component's imports rewritten to `./<module>.js`) and wraps them into `dist/ds.js` as `window.DS.*` through `scripts/tools/js-wrap.mjs` in merge mode (a sibling `import` becomes a read of `DS.<module>`; a later copy or bundle of the same version adds what the page lacks instead of returning early; `DS.init`, `DS.get`, `DS.define`, `DS.config` are `DS.core`'s). `RIPPLE_HOSTS` in `ripple.js` is a generated block (`meta.json` `rippleHosts`) |
| `src/js/<module>.requires.json` | optional, next to its module: the components the module always needs (`requires`) and, per export, those whose markup that export writes itself (`exportRequires`: `confirm` → button, dialog, spinner); the build checks it and writes it, with the module's own component (the `meta.json` `js` arrays inverted), into `manifest.json` `js.<module>`, which `tools/bundle.mjs` resolves |
| `fonts/` | Google Sans woff2, `fonts.css`, `OFL.txt` (copied to `dist/fonts/`) |
| `themes/example.css` | theme template: lists every role (a test enforces it) and, commented out in a generated block, the hooks with their fallbacks |
| `themes/presets/` | generated by `scripts/tools/theme.mjs --presets` (never by hand): `default`, `slate`, `ocean`, `forest`, `violet`, `amber`, `rose`, `graphite`, each `<name>.css` and `<name>-contrast.css`, one file for both schemes (`light-dark()`, `data-ds-scheme` pins a region); copied to `dist/themes/presets/`; a test keeps them equal to the generator |
| `themes/dark.css`, `themes/compact.css`, `themes/contrast.css` | the shipped themes, copied to `dist/themes/`: every non-derived colour role in the dark tones; compact type and the dense density (`--ds-density: -2`, plus the heights of the components not on the options model yet; the default density and heights back under a coarse pointer); palette-neutral contrast mixes. Contrast pairs and completeness tested in `test/tokens.test.js`; a package that adds a colour role adds its dark and contrast values |
| `src/react/` | the React adapter's hand-written modules (`provider`, `shared` with `behaviour()`, `button`, `field`, `card`, `badge`, `status`, `alert`, `table`, `tabs`, `dialog`, `toast`), each with its `.d.ts`, plain ES2022 without JSX, `react` a peer; `names.json` gives every generated component its export name and, where the docs do not show it, its root (`tag`, `classes`, `role`) and its `content` (a behaviour that writes its element's text: `set`, `reinit`, `attribute` or `none`). Built to `dist/react/` (`docs/react.md`) |
| `scripts/react.mjs` | the adapter's part of the build: `REACT_HAND` (each hand-written module and the stylesheets it renders), the generated component of every other behaviour that initialises an element (root from the docs, option props from its `define()`'s `attributes`, variants from its block without `stateClasses()`), `dist/react/index.js`, `manifest.json` `react` and the component table of `docs/react.md` |
| `dist/react/` | built, never edited: the hand-written modules with their imports rewritten to `../js/<module>.js`, a generated `<behaviour>.js` and `.d.ts` per behaviour, and `index.js` |
| `test/react/` | the pinned UMD development builds of React 18.3.1 the browser spec mounts the adapter with (not an npm dependency; its `README.md` and `LICENSE`); `test/react.test.js` keeps `src/react/`, `dist/react/` and the manifest in step, `test/browser/react.spec.js` runs the adapter |
| `src/types/` | hand-written TypeScript declarations of the core: `ds.d.ts` (the global `DS` with its module namespaces, a generated block from `MODULES`, the `DS.init`/`get`/`define`/`config` aliases, and `DashboardStyle.runtime`; copied to `dist/ds.d.ts`) and `js/<module>.d.ts` (each core module's exports with their options and handles, copied next to the module in `dist/js/`); a component's types sit in its folder (`<name>.d.ts`); `test/build.test.js` keeps the declared exports and their parameter names equal to the modules |
| `src/deprecations.json` | every deprecated and removed name as data (`dist/deprecations.json`); a removed name gets `removed` set |
| `styleguide/` | living styleguide on top of `dist/`, classic scripts that work from disk: `index.html` with `shell.js` and `shell.css` (the 3.0 shell: a page per registered demo with its options panel, the foundations with the theme choices, search, the need overview, the theme generator; an address of a 2.x section opens the page that took it over), `styleguide.css` (the parts every styleguide page shares), `sg-core.js` (the demo API `SG.demo`, `SG.mount`, the helpers `h`; also used by the fixture route), `demos.js` **generated** from every `<name>.demo.js`, `registry.js` **generated** from every `meta.json` and `tokens.css`, `theme-generator.js` **generated** from `scripts/tools/{color,theme-rules,theme}.mjs`; the "Page patterns" area (`#/patterns`, `#/patterns/<name>`: each pattern of `registry.js` with its need line, a framed preview loaded only when its page opens, at a phone, tablet or desktop width, scaled to fit, in the light, dark or auto scheme, and a link to open it alone); `motion.html` (the Motion Lab) with `motion-lab.js` (its frame, navigation, theme and speed selects, and the demo cards with Replay, Rapid toggle and Reverse at 50%), `lab.js` (its demo registry, `window.SG_LAB`) and `lab-components.js` **generated** from every `<name>.lab.js` (`SG_LAB.add(entry)`, the entry shape of `lab.js`); `views.html` (View Transitions across pages) |
| `docs/` | `install`, `bundle` (loading only what a page uses), `core` (`js/core.js`: runtime, behaviours, `init()`, events, strings), `tokens`, `options` (size, density, shape, tone, touch and how a component computes them), `theming`, `theme-generator` (`tools/theme.mjs` and the presets), `components` (**generated** from `src/components/_partials/` and every `<name>.md`; edit those; the hooks table of `theming`, the component keyframes table of `motion` and the module table of `install` are generated blocks), `patterns`, `motion`, `icons`, `rules` (with the accessibility statement), `migration` (2.x to 3.0: `tools/migrate.mjs`, every renamed and removed name, what to check by hand) |
| `docs/images/` | the screenshots and GIFs of `README.md`, taken from the live tour, the reference app and the styleguide; retake them when the look changes |
| `demo/` | the live tour, the start page on GitHub Pages: one page with a working demo of every behaviour (press, controls, live data, overlays, feedback, forms, theming, icons), wired as a project wires it (`theme.js` builds the theme from the choices under "Theme it" and shows its file, `demo.css` project components with the prefix `demo-`, `demo.js` the page; classic scripts, so it works from disk). It loads a project bundle, as a project does: `demo/ds.config.json` is its setup and `demo/ds/` the bundle, generated by `npm run build` from the `dist/` just built (`--check` compares it) and committed; `test/demo.test.js` guards the config and the links, `test/browser/demo.spec.js` runs the tour |
| `example/` | the reference app, published on GitHub Pages: a device console that uses the system as a project does (`theme.css` the project theme, `app.css` project components with the prefix `ex-`, `data.js` a fake backend, `app.js` the app; classic scripts on `../dist/`, so it works from disk); its `README.md` maps every pattern to its code. It follows the documented markup and the project rules of "Using Dashboard-Style in a project" below; `test/browser/example.spec.js` runs its flows |
| `scripts/` | `build.mjs` (deterministic, `--check` covers `dist/` and the generated files, `--generated` lists those; checks every `meta.json`; writes the single stylesheets to `dist/css/core/` and `dist/css/components/<name>.css`, a `.min.css` with source map next to each and `ds.min.css` (lightningcss, at the floor, lowering nothing), `ds.min.js` (`stripJs`), `dist/manifest.json`, the version banner on every CSS, JS, MJS, `.d.ts` and shell file, and `dist/tokens.json` from `tokens.css`, the hooks table of `docs/theming.md` and the stylesheets; every file of `scripts/tools/` ships to `dist/tools/` by itself), `meta-schema.json` (every `meta.json` field; the build validates against it), `gen-meta.mjs` (how the first `meta.json` files were derived, in the 2.x shape, kept for reference), `motion-curves.mjs` (the one source of sampled curves, `--check`), `vendor.sh` / `vendor.ps1` (checksummed copies for projects), `site.sh` (the GitHub Pages site) |
| `scripts/tools/` | the tools shipped in `dist/tools/`, dependency-free: `verify.mjs` and `verify.sh` (a copy against `SHA256SUMS`; `verify.sh` holds `check_dir` of `vendor.sh` word for word), `check-theme.mjs` (reads `light-dark()`: every pair in each scheme a theme shows), `check-project.mjs`, `migrate.mjs` (2.x to 3.0 from the copy's `deprecations.json`; `docs/migration.md`), `bundle.mjs` and `vite-plugin.mjs` (a project bundle from `manifest.json`; `docs/bundle.md`), `theme.mjs` (the theme generator) and the modules they share: `theme-rules.mjs` (the contrast pairs, the motion prefixes, the colour resolver and `pickLightDark()`, also read by `test/tokens.test.js`), `css-scan.mjs`, `color.mjs` (a port of Material Color Utilities' HCT, Apache-2.0, notice in `LICENSE`) and `js-wrap.mjs` (the classic-script wrapper of `ds.js` and of every bundle) |
| `templates/update-dashboard-style.yml` | nightly GitHub Actions workflow that projects copy to vendor `main` |
| `test/` | the shared unit tests (a component's own sit in its folder, `<name>.test.js`; `npm test` runs both): `css`, `tokens`, `options` (the option classes of `core/options.css`), `motion`, `js`, `build`, `registry` (meta.json, the generated files, the manifest, the minified output), `repo`, `controls`, `tools`, `check-project`, `migrate`, `bundle`, `patterns` (the page patterns: listed in `docs/patterns.md` and the styleguide, their bundles fresh, `check-project` clean, classes and markup), `core` (`js/core.js` on a fake DOM), the helpers `a11y`, `hotkeys`, `format`, `store`, `virtual`, `dnd`, `theme-generator`, `helpers` and `browser-helpers` unit tests; `helpers.js`; `fixtures/bundle/` (a small fake copy and fixture projects for the bundle tool; the bundle tests also bundle from this checkout's `dist/`); `fixtures/migrate/` (a 2.x project and what `tools/migrate.mjs` makes of it) |
| `test/browser/` | Playwright harness (`playwright.config.js`, `serve.js` (with the generated page `fixtures/component.html?c=<name>`: a component's demo alone, through `styleguide/sg-core.js`), `base-test.js`: the shared `test` of the specs that also run in `fallback`), `fixtures/`, the one helper module `helpers/motion.js`, the specs (baselines, timelines, capability spike, `lab` for the Motion Lab: coverage, every demo, interruption, the overlay table; `review` for the whole-page sweeps; `work` for the style work budgets (elements restyled, load-independent); `a11y-sweep` for names, references, ids and roles of every demo; `perf` for the paint budget and style recalc times, alone; `patterns` for every page of `src/patterns/` in every engine) and the committed `__screenshots__/`; the projects also run every `src/components/<name>/<name>.spec.js`, its shots under `__screenshots__/<project>/components/`; `README.md` explains them |
| `plans/` | working plans (`3.0.md`, the 3.0 plan, and `3.0-conventions.md`, the contract of every component folder; `motion-2.md` and its phases, complete; `after-2.0.md`, what 2.0.0 deferred or left open, the names 3.0 may remove and the wishes that were dropped); kept outside `docs/` so the docs tests do not count them |
| `.github/workflows/pages.yml` | GitHub Pages (the live tour at the root): after `check` passed on a push to `main` (or by hand), `npm run check`, `scripts/site.sh`, deploy; the repository's Pages source is "GitHub Actions" |
| `.github/workflows/check.yml` | CI on every push, pull request and by hand: `check` (Node 22 and 24: `npm run check` and the vendor round trip), then `browser` (Playwright in `mcr.microsoft.com/playwright:v<pinned>-noble`, three shards per engine, `perf` alone); Run workflow with "update screenshots" uploads a new screenshot set |

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
  are read by one component with a fallback (`var(--ds-btn-height, 40px)`). Themes never set motion tokens or
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
  (`import { a } from './motion.js';` in `src/js/`, `'../../js/motion.js'` or `'../<other>/<other>.js'` in a
  component folder; one line), exports only as `export const` / `export function`, newer APIs only behind feature
  detection, named under "Progressive:".
- **Cascade layers.** `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;` is the first statement
  of every stylesheet in `src/` (`dist/ds.css` declares it once); each file wraps its rules in one block
  (`tokens.css` → `ds.tokens`, `base.css` → `ds.base`, `global.css` → `ds.components.global`, a component →
  its own sublayer `ds.components.<name>`; `motion.css` puts its keyframes in `ds.motion` and its utilities in
  `ds.utilities`). The sublayer statement (`ds.components.global`, then every component in `meta.json` `order`)
  follows the layer statement in `src/index.css`, `ds.css`, every file of `dist/css/` and every bundle, so single
  files in any order, partial and per-entry bundles cascade as `ds.css` does. A later component wins whatever the
  specificity: a rule that names another component's class (outside `:not()` and `:has()`; the ripple's
  `stateClasses` aside) sits in the later of the two, with the other in `context`, and the build fails otherwise
  (`plans/3.0-conventions.md`, section 1). `ripple` is the last sublayer. `@property` and `@font-face` (and
  `@view-transition` in `src/optional/`) stay at top level; themes, `fonts.css` and project CSS stay unlayered, so
  they win. No doubled-class or other specificity tricks:
  the layer order decides. `!important` only on the allowlist (tested; a component's in its `meta.json`
  `exceptions.important`): `[hidden]` in `base.css`, the `.ds-sr` rules, the alignment utilities `.ds-num` and
  `.ds-center`, the forced-colours `svg` colour in `global.css`.
- **Motion.** `@keyframes` only in `src/core/motion.css` and a component's `<name>.keyframes.css`, each name once;
  entrances define only `from`, exits only `to`, with named exemptions (tested; a component's in its `meta.json`
  `motionExceptions`). Movement keyframes use `translate`/`scale`; exits are movement-only and
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

- **Component**: a new folder `src/components/<name>/`, and nothing outside it (`plans/3.0-conventions.md`, section 1,
  the contract of every file): `<name>.css` (the usual header comment), `meta.json` (`scripts/meta-schema.json`
  describes every field, `need`, `tier` and `status` among the required ones; its `order` places it in the cascade), a section `<name>.md` (markup, modifiers, behaviour the
  page must add) with its `docsOrder`, `<name>.demo.js` (`SG.demo()`, with the need line of its `meta.json`), a spec `<name>.spec.js` on the generated page
  `/test/browser/fixtures/component.html?c=<name>`, and where they apply `<name>.js` with `<name>.d.ts`,
  `<name>.test.js`, `<name>.lab.js` and `<name>.keyframes.css`. `npm run build` regenerates the shared files and says
  what the folder is missing. New hooks are described in `meta.json` `hooks` (the theming table and
  `themes/example.css` follow); an exception of a guardrail goes in `meta.json` `exceptions` or `motionExceptions`
  with its reason; a ripple host in `rippleHosts`. Its motion gets a row of the choreography in `docs/motion.md` (the
  integrator's, from the report) and a Motion Lab demo (below); forced-colors behaviour and browser motion tests
  checked. Every `.ds-*` class must appear in `docs/components.md` (tested). A component that reads another's height computes the same
  formula (`plans/3.0-conventions.md`, section 11).
- **Motion** (a keyframe, a utility, a JS export, a component's choreography): a Motion Lab demo: an entry in
  `styleguide/lab.js`, or for a component `SG_LAB.add(entry)` in its `<name>.lab.js`, whose `shows` lists every
  keyframe, class, export and token it plays, with Replay and, when the motion is reversible, a `toggle` (Rapid toggle,
  Reverse at 50%). The coverage test of `test/browser/lab.spec.js` fails for a keyframe, motion class or function of
  `DS.motion`, `DS.dom`, `DS.indicator`, `DS.ripple`, `DS.overlay` or a component module that no demo shows (or that is
  not on its `LAB_EXEMPT` list or in the component's `meta.json` `labExempt`, with a reason). An overlay's timing also
  goes into the Overlays table of `docs/motion.md`, which the same spec compares with what every engine plays.
- **Token**: a role goes after the `── 2. Palette` marker in `src/core/tokens.css`, into `docs/tokens.md` and
  `themes/example.css` (tested); a new colour role gets its dark tone in `themes/dark.css` (unless it is derived or
  a `var()` of another role; tested) and, where it carries text or a line, its value in `themes/contrast.css`; its
  pair goes into `scripts/tools/theme-rules.mjs` (`TEXT_PAIRS`, `CONTROL_PAIRS`, `ICON_PAIRS` or the chart lists,
  copied into the theme check of the styleguide, `shell.js`; tested), which checks the default palette
  and every shipped theme. A type role multiplies its size and line height by `--ds-type-scale` (tested). A scale goes
  before the marker; a duration-like scale is written as `calc(<n>ms * var(--ds-time-scale, 1))` (tested). Every
  `--ds-*` name must appear in `docs/` (tested).
- **Page pattern**: a page `src/patterns/<name>.html` built only from documented markup (`docs/patterns.md`, "Adding a
  pattern"): its `pt-title`, `pt-need` and `pt-group` metas, its family's entry in `src/patterns/ds.config.json`, a
  `###` section in `docs/patterns.md` with the same title and a link to the file, then `npm run build` (the bundle and
  `registry.js` follow). Layout of its own only in `pt.css`, tokens only; the wiring a project would write at the end
  of the page; generic content and a fake backend whose rule the docs name.
- **Icon**: a named export in `src/js/icons.js` (24px grid, flat shapes, no `stroke`, `fill`, `class` or colour of
  their own; tested) and its name in the glyph table of `docs/icons.md`. The styleguide lists glyphs by itself.
- **Keyframe**: in `src/core/motion.css` with the `ds-` prefix and a row in the keyframe table of `docs/motion.md`, or
  a component's in its `<name>.keyframes.css` (one `@layer ds.motion` block of `@keyframes`) with `meta.json`
  `keyframes` and `keyframeDocs` (the generated table of `docs/motion.md`; tested); use it through tokens so
  `--ds-time-scale` applies; a Motion Lab demo shows it (tested).
- **JS export**: in `src/js/*.js` or a component's `<name>.js`, documented in `docs/core.md` (core), `docs/icons.md`
  (icons), `docs/motion.md` (the rest of `src/js/`) or the component's `<name>.md` (tested), declared with its options
  and handle in `src/types/js/<module>.d.ts` or the folder's `<name>.d.ts` (same parameter names; tested); a function
  of a motion or component module gets a Motion Lab demo or a `labExempt` (tested). An export that writes markup of a
  component itself (a dialog, a live region on `.ds-sr`) names those components in `exportRequires` of the module's
  `<module>.requires.json`, so a bundle that uses it gets their CSS.
- **React component**: a behaviour's adapter component is generated, nothing to write: give its export name in
  `src/react/names.json` (and `tag`, `classes`, `role` when no element of its docs carries the attribute, `content`
  when its behaviour writes its element's text), its option props come from the `define()`'s `attributes`. A
  hand-written one (props for its whole markup) is `src/react/<name>.js` with `<name>.d.ts`, listed in `REACT_HAND`
  of `scripts/react.mjs` with the stylesheets it renders, named in `docs/react.md` and run in
  `test/browser/react.spec.js`. Its behaviour's `destroy()` gives back what init took, so StrictMode's second start
  shows the same (the spec mounts every generated component with and without StrictMode).
- **Component module**: `src/components/<name>/<name>.js`; no list to edit. The build discovers it, orders it after
  what it imports (a cycle stops the build), writes `dist/js/<name>.js` and `.d.ts`, and adds it to `ds.js`,
  `manifest.json`, `src/types/ds.d.ts` and the table of `docs/install.md`; the tests and `module.html` read the same
  list. `meta.json` has `"module": true` and lists `<name>` in `js`; `<name>` is a JS identifier (no hyphen; it becomes
  `DS.<name>`) and no core module's name. Plain ES2022, `export const` / `export function` only, imports only as
  `import { a, b } from '../../js/core.js';` (another component: `'../<other>/<other>.js'`), one line each; register
  behaviours with `define('<name>', { attribute: 'data-ds-<name>', init(el, ctx) { ... } })` (state that must be one
  per page in `runtime.state('<name>', ...)`, strings through `t()`), never a global listener of its own.
- **Core module** (`src/js/<name>.js`, rare): the same rules with `import { a, b } from './core.js';`; add it to
  `CORE_MODULES` in `scripts/build.mjs` (after every module it imports from), write `src/types/js/<name>.d.ts`, list it
  in the `js` of the component's `meta.json` (a module named like its component gets that stylesheet as `requires` by
  itself), and document every export in `docs/motion.md` (the helpers: `docs/core.md`, through `moduleFiles()`). `manifest.json` lists the `data-ds-*` attributes its `define()` declares, so a bundle finds the module by them. A helper without motion goes on `LAB_EXEMPT` function by function, with its reason (`test/browser/lab.spec.js`).

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
  `hidden`, `restyle`, `attributes`, `dom`, `pressable`, `options`, `bundle`); `ds-check.json` names the copy's
  `"major"` and, with a project bundle, its `"bundle"` config; a deliberate deviation is an exception in
  `ds-check.json` with its reason.
```
