# AGENTS.md

Notes for AI agents (Claude Code, Codex, opencode ...) and people working on Dashboard-Style. User documentation:
[README.md](README.md) and the [docs](README.md#documentation).

## In brief

- A **generic, themeable design system** for admin dashboards in the Material 3 / Google console style: CSS tokens
  (`--ds-*`), components (`.ds-*`), motion, 82 outline icons and Google Sans. Plain CSS and dependency-free JS, MIT.
- **Project-neutral.** Nothing in the repository names a project, organisation, place, brand colour or brand font
  that uses it; `test/repo.test.js` fails on a list of such names. Examples use generic content (devices, tickets,
  "Product", Ada Lovelace). Anything specific to one product stays in that product's repository.
- **English** everywhere: code, comments, docs, commit messages.
- `src/` is the source, `dist/` is what projects vendor. `dist/` is built by `npm run build` and **committed**.

## Commands

| Command | Purpose |
|---|---|
| `npm run check` | tests + verify that `dist/` matches `src/` and that the sampled curves in `tokens.css` match their generator (`node scripts/motion-curves.mjs --check`); CI runs this; run it before every commit |
| `npm test` | tests only (`node --test`, no dependencies, Node 22+) |
| `npm run build` | rebuild `dist/` after any change to `src/`, `fonts/`, `LICENSE` or the version |
| `node scripts/motion-curves.mjs` | regenerate the sampled `linear()` curves (`--ds-ease-spatial`, `--ds-ease-emphasized`) in `src/tokens.css`; never edit them by hand |
| `sh scripts/vendor.sh --from . <dest>` | copy this checkout's `dist/` into a project to try a change there (`--check <dest>` verifies a copy; Windows: `scripts/vendor.ps1 -From`) |
| `sh scripts/vendor.sh --from . /tmp/ds && sh scripts/vendor.sh --check /tmp/ds` | the vendor round trip CI runs after `npm run check` |
| `npm ci` | once, for the browser tests only (installs the pinned `@playwright/test`, the only devDependency); add `npx playwright install --with-deps chromium firefox webkit` when the pinned browsers are not cached |
| `npm run test:browser` | browser tests in Chromium, Firefox and WebKit (`test/browser/`); run it before every push. Outside the Playwright container (other fonts and rasteriser) run `DS_SHOTS=local npm run test:browser`: screenshots then compare against the gitignored `__screenshots-local__/`, generated from the parent commit (`test/browser/README.md`, "CI"). `DS_TEST_PORT` picks another port for a second run or a worktree |
| `npm run test:browser:update` | rewrite screenshots and JSON timelines, then review the diff. The committed `__screenshots__/` set is only ever rewritten from the CI container (Actions → check → Run workflow → "update screenshots"); elsewhere update with `DS_SHOTS=local`, see `test/browser/README.md` |
| open `styleguide/index.html` | every component, token, motion demo and icon, works from disk; "Load theme file ..." tries a theme; `?speed=0.1` slows its motion tenfold |

## Files

| Path | What |
|---|---|
| `src/tokens.css` | all tokens on `.ds-theme` in `@layer ds.tokens`: layer 1 scales before the `── 2. Palette` marker, layer 2 roles after it, the `linear()` refinements at the end; `@property --ds-time-scale` at top level |
| `src/motion.css` | every `@keyframes` (in `ds.motion`) and the motion utilities (`.ds-enter`, `.ds-leave`, `.ds-stagger`, `.ds-reveal`, `.ds-collapsible`, in `ds.utilities`), plus the non-inheriting hook registrations (`@property`, top level) |
| `src/base.css` | opt-in page base, scoped with `:where(.ds-base)` |
| `src/components/*.css` | one file per component; the header comment sketches markup, modifiers, hooks and "Progressive:" features |
| `src/index.css` | the layer order statement, then the `@import` list = cascade order of `ds.css`; every stylesheet must be listed |
| `src/js/*.js` | ES modules `motion`, `indicator`, `dom`, `icons`; `scripts/build.mjs` (`MODULES`) wraps them into `dist/ds.js` as `window.DS.*` (a sibling `import` becomes a read of `DS.<module>`) |
| `fonts/` | Google Sans woff2, `fonts.css`, `OFL.txt` (copied to `dist/fonts/`) |
| `themes/example.css` | theme template: lists every role (a test enforces it) and the hooks, commented out |
| `styleguide/` | living styleguide on top of `dist/` (`styleguide.js` holds the demos and the component count tile) |
| `docs/` | `install`, `tokens`, `theming`, `components`, `motion`, `icons`, `rules` |
| `scripts/` | `build.mjs` (deterministic, `--check`), `motion-curves.mjs` (the one source of sampled curves, `--check`), `vendor.sh` / `vendor.ps1` (checksummed copies for projects) |
| `templates/update-dashboard-style.yml` | nightly GitHub Actions workflow that projects copy to vendor `main` |
| `test/` | `css`, `tokens`, `motion`, `js`, `build`, `repo`, `helpers` and `browser-helpers` unit tests; `helpers.js` |
| `test/browser/` | Playwright harness (`playwright.config.js`, `serve.js`), `fixtures/`, the one helper module `helpers/motion.js`, the specs (baselines, timelines, capability spike, known bugs as `test.fail` markers) and the committed `__screenshots__/`; `README.md` explains them |
| `plans/` | working plans (Motion 2); kept outside `docs/` so the docs tests do not count them |
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
  `--ds-stagger`, `--ds-time-scale`, `--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`): motion is one scheme for every
  product, and `DS.motion` reads the computed tokens. The per-element motion hooks take tokens only and do not
  inherit: set them on the animating element. `--ds-time-scale` is for the styleguide and the tests only.
- **No literals in components**: colours, radii, shadows, type (`font` roles), durations, curves, opacities
  (`--ds-state-*`) and z-indices (`--ds-z-*`) come from tokens. Literal values live only in `src/tokens.css` and
  theme files. A missing value becomes a token (with docs), never a literal.
- **Baseline: Safari 16.4, Chrome/Edge 111, Firefox 128.** Everything in `src/` may run in an embedded widget on
  such a browser. Allowed directly: `:focus-visible`, `:has()`, `inset`, container queries, `color-mix()`,
  `svh`/`dvh`, `<dialog>`, `inert`, `@layer`, `@property` and the individual `translate`/`scale`/`rotate`. No
  CSS nesting. Progressive only, behind a feature query where it matters, and named by feature under
  "Progressive:" in the file header with its fallback (tested): `linear()`, `@starting-style`,
  `transition-behavior: allow-discrete`, `popover`, anchor positioning, View Transitions, scroll-driven
  animations, `interpolate-size`, `::details-content`, `overflow-clip-margin`, `sibling-index()`,
  `moveBefore()`, plus `text-wrap` and `scrollbar-color`. JS is ES2022; a module may import named exports from
  an earlier module in `MODULES` (`import { a } from './motion.js';`, one line), exports only as `export const` /
  `export function`, newer APIs only behind feature detection, named under "Progressive:".
- **Cascade layers.** `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;` is the first statement
  of every stylesheet in `src/` (`dist/ds.css` declares it once); each file wraps its rules in one block
  (`tokens.css` → `ds.tokens`, `base.css` → `ds.base`, components → `ds.components`; `motion.css` puts its
  keyframes in `ds.motion` and its utilities in `ds.utilities`). `@property` and `@font-face` stay at top level;
  themes, `fonts.css` and project CSS stay unlayered, so they win. No doubled-class or other specificity tricks:
  the layer order decides. `!important` only on the allowlist (tested): `[hidden]` in `base.css`, the `.ds-sr`
  rules, the alignment utilities `.ds-num` and `.ds-center`, the forced-colours `svg` colour in `shell.css`.
- **Motion.** `@keyframes` only in `src/motion.css`, each name once; entrances define only `from`, exits only
  `to`, with named exemptions (tested). Movement keyframes use `translate`/`scale`; exits are movement-only and
  pair with `ds-fade-out`. Durations and curves only from tokens. Effects (opacity, colour) and values run on
  curves within [0, 1] that never decrease; movement that floats runs on the spring `--ds-ease-spatial` (peak at
  most 1.05, then it settles; the percentage is the contract); sizes that push layout never overshoot
  (`--ds-ease-out`). Animate only `transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`,
  `clip-path` and registered custom properties; named exceptions, each allowed by the test when its feature
  lands: `rotate` (spinners, loaders, disclosure chevrons, icon swaps), `border-radius` (press morph),
  `outline-offset` (focus snap, transition only), `stroke-dashoffset` (drawn checks), `mask-position` (the
  progress wave), the chip check slot `width`, and the heights of `.ds-collapsible`, validation messages and
  expandable rows; the sliding indicator's `width`/`height` until 1.2.0. Never `transition: all`, never
  `font-weight`. Exits take 0.3-0.8 of their entrance (tested). Hover never moves anything; nothing scales on
  press except the switch handle. Updated data never animates; never re-render an animating element
  (`DS.dom.morphHtml`). Never a near-zero duration on a loop (it races).
- **State layers.** Hover and press lay `currentColor` (or the hook) over the control at `--ds-state-hover` /
  `--ds-state-pressed` via `::before`; hover rules only inside `@media (hover: hover)`; focus is a 2px ring
  (`--ds-focus-outline`) on `:focus-visible`, solid from the first frame. On top come the pointer ripple
  (`DS.ripple`, from 1.0.0), the press shape morph and the focus snap (from 1.1.0: only the ring's offset moves,
  never its colour or width).
- **Every action is a pill** (`--ds-radius-action`). One filled button per area, no red buttons.
- **Status never by colour alone**: icon and word on status chips and alerts, a check on selected chips, the
  label weight or `aria-*` on active items.
- **Forced colors** (`@media (forced-colors: active)`): floating layers keep a transparent outline that becomes
  their edge, selects get their native arrow back, spinner, switch, progress and loading bar use system colours.
- **Accessibility**: text roles pass WCAG AA (the default palette is tested), field text 16px on phones
  (`--ds-font-input`), labels above fields, icons `aria-hidden`.

## Making a change

Work in `src/`, never in `dist/`. Every change follows the same path:
**src → docs → styleguide demo → unit tests → browser tests → CHANGELOG → version in `package.json` →
`npm run build` → `npm run check` → `npm run test:browser`**, and `src/` and `dist/` are committed together.

- **Component**: a new `src/components/<name>.css` with the usual header comment; `@import` it in `src/index.css`
  at its place in the cascade; a section in `docs/components.md` (markup, modifiers, behaviour the page must add)
  plus a row in its "Which component for which need" table; new hooks in the table of `docs/theming.md` and
  commented in `themes/example.css`; a demo in `styleguide/styleguide.js` (raise the `Components` tile, a test
  counts the files); forced-colors behaviour and browser motion tests checked. Every `.ds-*` class must appear in
  `docs/components.md` (tested).
- **Token**: a role goes after the `── 2. Palette` marker in `src/tokens.css`, into `docs/tokens.md` and
  `themes/example.css` (tested); a new text colour pair gets a contrast check in `test/tokens.test.js`. A scale goes
  before the marker; a duration-like scale is written as `calc(<n>ms * var(--ds-time-scale, 1))` (tested). Every
  `--ds-*` name must appear in `docs/` (tested).
- **Icon**: a named export in `src/js/icons.js` (24px grid, flat shapes, no `stroke`, `fill`, `class` or colour of
  their own; tested) and its name in the glyph table of `docs/icons.md`. The styleguide lists glyphs by itself.
- **Keyframe**: only in `src/motion.css` with the `ds-` prefix, a row in the keyframe table of `docs/motion.md`;
  use it through tokens so `--ds-time-scale` applies.
- **JS export**: in `src/js/*.js`, documented in `docs/motion.md` or `docs/icons.md` (tested). A new module also
  goes into `MODULES` in `scripts/build.mjs` (after every module it imports from), the `dist/` table in
  `docs/install.md` and the module imports of `test/js.test.js`.

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

  Mark the old name deprecated in the docs and the changelog. Remove it only in a later major version, once
  projects have moved.
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
  (tokens `--ds-*`, components `.ds-*`, `DS.motion`, `DS.indicator`, `DS.dom`, `DS.icons`).
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
  repository and open `styleguide/index.html` (works from disk). Copy the documented markup and attributes
  exactly; behaviour (opening, closing, filtering) is the project's own script.
- Theme only through tokens in `<theme file>`, on `.ds-theme`, loaded after `ds.css`: roles (`--ds-primary`,
  `--ds-accent`, `--ds-font` ...), component hooks (`--ds-btn-*`, `--ds-card-*` ...), the project's own
  `--<prefix>-*` tokens and `@font-face`. Never set motion tokens or hooks (`--ds-dur-*`, `--ds-ease-*`,
  `--ds-distance-*`, `--ds-scale-*`, `--ds-loop-*`, `--ds-delay-*`, `--ds-stagger`, `--ds-time-scale`,
  `--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`). Never wrap the theme in `@layer`.
- `ds.css` sits in `@layer ds.*`, so unlayered project CSS beats every component. Load resets in a layer declared
  before ds (`@layer reset;` first, or `@layer reset, ds, app;`).
- Never change the look of a `.ds-*` component in project CSS (colour, radius, type, motion); set its hooks
  instead, in the theme or on the element. Placing a `.ds-*` element inside a project container is fine; document
  any deliberate deviation with its reason.
- Local components use the project prefix `<prefix>-` and read tokens only (`--ds-*` and `--<prefix>-*`): no
  colour, radius, font, shadow, duration or curve literals, no own `@keyframes` (use the `ds-*` keyframes and
  motion tokens).
- Icons only from `DS.icons` / `js/icons.js`; status never by colour alone; actions are pills.
```
