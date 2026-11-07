# Install and update

Everything a project needs is in `dist/`:

| Path | What |
|---|---|
| `ds.css` | all stylesheets in cascade order (tokens, motion, base, components), in `@layer ds.*` (see "Cascade layers and resets") |
| `ds.min.css` | `ds.css` minified (3.0), with its source map `ds.min.css.map`: the same rules, layers and order |
| `ds.js` | classic script, sets `window.DS = { version, core, motion, indicator, dom, ripple, icons, overlay }` plus `DS.init`, `DS.get`, `DS.define` and `DS.config` (those of `DS.core`, [core.md](core.md)); see "Two copies on one page" |
| `ds.min.js` | `ds.js` without comments and indentation (3.0): the same code, nothing renamed |
| `css/` | the single stylesheets: `core/tokens.css`, `core/motion.css`, `core/base.css`, `core/global.css` (the rules for every element inside `.ds-theme`), `components/<name>.css` and `index.css` (their `@import` list in cascade order); each starts with the layer statement and the statement of the component sublayers (each file puts its rules into its own), and a `.min.css` with its `.min.css.map` sits next to each (3.0) |
| `manifest.json` | the components as data (3.0): per component its files, group, classes, attributes, keyframes, hooks, the modules it needs, what it requires and its size; the core stylesheets and their classes; the JS modules with their imports, exports, the components they need (`requires`, and `exportRequires` per export) and the attributes that need them (`attributes`). Tools such as a bundler read it |
| `css/properties.css` | every `@property` registration of `ds.css` alone (generated; registers `--ds-*` custom properties and styles nothing). A widget that loads `ds.css` inside a shadow root links it in the host document too: `@property` applies only in document-level stylesheets (as does `@font-face` in Chromium and Firefox, so such a widget also links `fonts/fonts.css` in the host document; see theming.md, "Embedded in someone else's page") |
| `css/optional/` | opt-in stylesheets that `ds.css` never includes: `view-transitions.css` (View Transitions across page loads, needs `<html class="ds-theme">`; see "Multi-page apps") |
| `js/` | the ES modules, one folder (the table below): the core (`core.js`, `motion.js`, `indicator.js`, `dom.js`, `ripple.js`, `icons.js`, `overlay.js`) and one behaviour module per component that has one, each with its types next to it (`motion.d.ts` ...), which an `import` of the module finds by itself; `core.js` is the shared runtime, the behaviour registry and `init()` ([core.md](core.md)), and every other module imports from it |
| `ds.d.ts` | types of `ds.js`: the global `DS` (every module's exports, their options and handles) and `DashboardStyle.versions` (see "Types") |
| `fonts/` | Google Sans woff2 (latin, latin-ext), `fonts.css`, `OFL.txt` |
| `deprecations.json` | every deprecated and removed name as data, for a project's own checks (see "Deprecated and removed names") |
| `LICENSE` | the MIT notice; keep it with the copy |
| `SHA256SUMS` | checksums of every file |
| `themes/` | the shipped themes `dark.css`, `compact.css` and `contrast.css`, loaded after your theme ([theming.md](theming.md#dark-compact-and-contrast)) |
| `tools/` | dependency-free checks for a project: `verify.mjs` and `verify.sh` (the copy against `SHA256SUMS`, see "Verify a copy"), `check-theme.mjs` (a theme file, see theming.md, "Checking a theme"), `check-project.mjs` (the project rules, see "Check a project"), `bundle.mjs` and `vite-plugin.mjs` (a project bundle of only what it uses, [bundle.md](bundle.md)), and the modules they share: `theme-rules.mjs` (the contrast pairs and motion prefixes), `css-scan.mjs` (a small CSS reader) and `js-wrap.mjs` (the classic-script wrapper of `ds.js`) |
| `tokens.json` | every `--ds-*` name as data: `{ version, tokens: [{ name, layer, default, type, themeable, component?, deprecated? }] }` (see "Tokens as data") |

The modules of `js/`, in the order `ds.js` holds them (each after the modules it imports; generated from `src/js/`
and every `src/components/<name>/<name>.js`, as `manifest.json` `js` lists them):

<!-- generated: modules (scripts/build.mjs; do not edit) -->
| File | Namespace | Kind | Imports | Docs |
|---|---|---|---|---|
| `js/core.js` | `DS.core` | core (`src/js/`) | - | [core.md](core.md) |
| `js/motion.js` | `DS.motion` | core (`src/js/`) | `core` | [motion.md](motion.md) |
| `js/indicator.js` | `DS.indicator` | core (`src/js/`) | `core`, `motion` | [motion.md](motion.md) |
| `js/dom.js` | `DS.dom` | core (`src/js/`) | `motion` | [motion.md](motion.md) |
| `js/ripple.js` | `DS.ripple` | core (`src/js/`) | `core`, `motion` | [motion.md](motion.md) |
| `js/icons.js` | `DS.icons` | core (`src/js/`) | - | [icons.md](icons.md) |
| `js/position.js` | `DS.position` | core (`src/js/`) | - | [motion.md](motion.md) |
| `js/overlay.js` | `DS.overlay` | core (`src/js/`) | `core`, `dom`, `motion`, `position` | [motion.md](motion.md) |
| `js/a11y.js` | `DS.a11y` | core (`src/js/`) | `core`, `dom`, `motion`, `overlay` | [core.md](core.md) |
| `js/hotkeys.js` | `DS.hotkeys` | core (`src/js/`) | `a11y`, `core`, `dom`, `overlay` | [core.md](core.md) |
| `js/format.js` | `DS.format` | core (`src/js/`) | `core` | [core.md](core.md) |
| `js/store.js` | `DS.store` | core (`src/js/`) | `core` | [core.md](core.md) |
| `js/virtual.js` | `DS.virtual` | core (`src/js/`) | `core`, `dom` | [core.md](core.md) |
| `js/dnd.js` | `DS.dnd` | core (`src/js/`) | `core`, `motion` | [core.md](core.md) |
| `js/badge.js` | `DS.badge` | component (`src/components/badge/`) | `core`, `motion` | [components.md](components.md#badge) |
| `js/dialog.js` | `DS.dialog` | component (`src/components/dialog/`) | `core`, `icons`, `motion`, `overlay` | [components.md](components.md#dialog) |
| `js/menu.js` | `DS.menu` | component (`src/components/menu/`) | `core`, `motion`, `overlay` | [components.md](components.md#menu) |
| `js/sheet.js` | `DS.sheet` | component (`src/components/sheet/`) | `core`, `overlay` | [components.md](components.md#side-sheet) |
| `js/toast.js` | `DS.toast` | component (`src/components/toast/`) | `core`, `icons`, `motion`, `overlay`, `position` | [components.md](components.md#snackbar) |
| `js/tooltip.js` | `DS.tooltip` | component (`src/components/tooltip/`) | `core`, `motion`, `overlay`, `position` | [components.md](components.md#tooltip) |
<!-- /generated: modules -->

Browsers: Safari 17.5, Chrome and Edge 123, Firefox 130 and later (3.0). Newer features are refinements that the
files name under "Progressive:"; older engines on that floor get the same page without them.

Load order on a page: fonts (optional), `ds.css`, your theme, then your own styles.

```html
<link rel="stylesheet" href="vendor/dashboard-style/fonts/fonts.css">
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
<link rel="stylesheet" href="css/theme.css">
<script src="vendor/dashboard-style/ds.js" defer></script>
```

With `ds.js`, one call gives every action its pointer ripple ([components.md](components.md#ripple)):

```js
DS.ripple.attach(document);
```

On iOS, Safari shows `:active` (the press feedback) only on pages that listen to `touchstart`; `attach()` adds a
passive listener. A page without `ds.js` adds one itself:
`document.addEventListener('touchstart', () => {}, { passive: true })`, or `ontouchstart=""` on `<body>` where the
Content-Security-Policy allows inline handlers.

## Cascade layers and resets

`ds.css` declares `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;` and puts every rule into one of
these layers. Unlayered CSS beats every layer, whatever its specificity, so your theme and your own styles always win
over a component: no `!important` or doubled selectors are needed against ds.

Inside `ds.components`, each component has a sublayer of its own, `ds.components.<name>` (3.0), declared in
`manifest.json` order by a second statement that every stylesheet of `css/` and every bundle starts with. So the
first stylesheet a page loads fixes the order: single files linked in any order, a partial bundle and several bundles
on one page cascade exactly as `ds.css` does ([bundle.md](bundle.md)). A layer of your own for a component's look
(`@layer ds.components.card { ... }`) would join that sublayer; keep project rules unlayered instead.

That includes resets. A reset loaded unlayered (`button { font: inherit; border: 0; background: none }`, normalize,
the preflight of a utility framework) now overrides the components too. Put it into a layer that is declared before
`ds.css` loads:

```html
<style>@layer reset;</style>
<link rel="stylesheet" href="css/reset.css">            <!-- its rules inside @layer reset { ... } -->
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
```

A project with its own layers lists `ds` where it belongs, for example `@layer reset, ds, app;` before anything
loads. The `!important` that ds keeps (`[hidden]` under `.ds-base`, `.ds-sr`, `.ds-num`, `.ds-center`) sits in a
layer, so it beats an unlayered `!important` of the page.

Under `.ds-base`, `hidden` always hides: never add a `[hidden]` rule to the project's CSS.

An embedded widget cannot move the host page's CSS into a layer: the host's unlayered element rules (`button`, `h2`,
`p`, `dialog`) then beat the widget's components. [theming.md](theming.md), "Embedded in someone else's page", has the
guard that hands those elements back to ds.

## Vendoring (recommended)

Commit a copy to your repository. `main` is always releasable, so updating means fetching the latest `main` again; a
branch, tag or commit can be named instead. `scripts/vendor.sh` (POSIX shell; needs curl or wget, tar, sha256sum or
shasum) and `scripts/vendor.ps1` (Windows PowerShell 5.1 or PowerShell 7) do the same things:

```sh
sh vendor.sh vendor/dashboard-style                   # download the latest main from GitHub
sh vendor.sh <ref> vendor/dashboard-style             # a branch, tag or commit instead
sh vendor.sh --from ../Dashboard-Style vendor/ds      # copy from a local checkout (built dist/)
sh vendor.sh --check vendor/dashboard-style           # verify; exit 1 on any change
```

```powershell
.\vendor.ps1 vendor\dashboard-style
.\vendor.ps1 <ref> vendor\dashboard-style
.\vendor.ps1 -From ..\Dashboard-Style vendor\dashboard-style
.\vendor.ps1 -Check vendor\dashboard-style
```

The destination is replaced as a whole. It must be missing, empty or an earlier vendored copy (a `VERSION` file that
starts with `version ` and a `SHA256SUMS` that lists `ds.css`); anything else is refused. It then gets two extra
files:

- `VERSION`: `version 1.0.0`, `source github:saschazesiger/Dashboard-Style@main` (or `local`) and `commit`: the
  exact commit the ref resolved to; with `--from`, the commit hash of the source checkout (`-modified` if it is dirty), or `none` for a copy that
  is not a Git checkout of its own (an unpacked archive). A Git checkout without commits records the version as
  `1.0.0-dev`.
- `SHA256SUMS`: `sha256sum` format, sorted by path, LF line ends, covering every file including `VERSION`.

Verify it in your tests or CI so edits to the vendored files fail loudly ("Verify a copy", below). On Windows
checkouts, mark the folder binary so Git does not rewrite line ends:

```gitattributes
vendor/dashboard-style/** -text
```

### Verify a copy

The copy carries its own check, so a project needs neither the network nor this repository to verify it:

```sh
node vendor/dashboard-style/tools/verify.mjs        # Node 18 or later, no dependency
sh vendor/dashboard-style/tools/verify.sh           # POSIX sh with sha256sum or shasum (a Go or other non-Node project)
sh vendor.sh --check vendor/dashboard-style         # the same check from the vendoring script
```

Each checks the copy it sits in (`verify.mjs --dir <path>` and `verify.sh <path>` check another one, a built `dist/`
too) and exits 1 on any difference, naming the files. The three apply the same rules (`verify.sh` holds the very
function of `vendor.sh`; a test keeps them and `verify.mjs` in step), and the format of `SHA256SUMS` is a contract
that a project may check with its own code as well:

- one line per file: the SHA-256 in lowercase hex, two spaces, the path relative to the copy with forward slashes;
- every file of the copy is listed, `VERSION` included (a vendored copy) and `SHA256SUMS` itself excluded;
- sorted by path in byte order (`LC_ALL=C sort`), LF line ends (a CR is ignored, so a Windows checkout still
  verifies);
- no symbolic link anywhere in the copy (a listing cannot cover one), nothing missing, changed or added.

The file names of a copy stay the same across versions (`ds.css`, `ds.js`, `css/...`, `js/...`, `fonts/...`; new files
only add to them), so a service worker that precaches them by name keeps working after an update. Files refer to
each other only by relative paths inside the copy: `fonts/fonts.css` (its `url()`s), `css/index.css` (its
`@import`s), the modules in `js/` (`./motion.js` and their other siblings) and their `.d.ts`, `ds.d.ts` (`./js/*.js`)
and `tools/` (each other, `../tokens.json`, `../deprecations.json`). So the copy may live anywhere, but it stays
together: precache all of it, and run the tools from inside it rather than copying one elsewhere.

## CDN

jsDelivr serves any branch, tag or commit of the public repository. `@main` follows the latest version (jsDelivr
caches branches for up to a day); pin a commit hash when a page must never change by itself:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/ds.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/fonts/fonts.css">
<script src="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/ds.js"></script>
```

For subresource integrity, compute the hash of the file you load
(`openssl dgst -sha384 -binary ds.css | openssl base64 -A`) and add `integrity="sha384-..." crossorigin="anonymous"`.
A strict Content-Security-Policy needs `cdn.jsdelivr.net` in `style-src`, `script-src` and `font-src`; vendoring
needs only `'self'` there. Either way `img-src` must allow `data:` (`img-src 'self' data:`): several shapes are
`data:image/svg+xml` masks, and a blocked mask hides what it covers. Under `img-src 'self'` alone, a checked checkbox
(`.ds-check`, `.ds-checkbox`, table checkboxes) loses its check and keeps only the filled box, the value of a
determinate `.ds-progress` and the arc of `.ds-spinner--determinate` disappear (the masks `--ds-progress-wave` and
`--ds-progress-ring-wave` in `tokens.css`), the calendar glyph of date fields (the clock of time fields) and the
clear glyph of search fields go blank (`form.css`), and breadcrumbs lose the chevrons between their links
(`page.css`).

Style attributes need no exception (no `'unsafe-inline'`, no `style-src-attr`): the scripts set styles through the
CSSOM only, and since 2.0 `DS.dom.morphHtml` does too, so a re-rendered `style="--ds-progress: 0.6"` applies under
`style-src 'self'` without a violation report. Markup a page puts in with `innerHTML` is the page's own matter.

## Bundlers and ES modules

Import the single files from the vendored copy (or `dist/` of a checkout). A module only imports from its siblings
in `js/` (`./motion.js`), so keep the folder together.

```js
import { enter, leave, stagger } from './vendor/dashboard-style/js/motion.js';
import { create } from './vendor/dashboard-style/js/indicator.js';
import { icon, check } from './vendor/dashboard-style/js/icons.js';
```

`js/overlay.js` is the shared core of the overlays (3.0): what only one component does lives in that component's module,
so a page that imports single files imports these next to it. `js/menu.js` has a menu's first focus, keys and close on an
item; `js/dialog.js` `confirm()`, `alert()`, `prompt()`, an action sheet's keys and the form dialog; `js/toast.js`
snackbars, `announce()` and their move into an open dialog; `js/tooltip.js` `tooltips()`. Without its module a menu or
dialog still opens, and `open()` warns once in the console; `DS.overlay.confirm()`, `toast()`, `tooltips()` and the
like throw an error that names the file. `ds.js` holds them all, and a bundle keeps what the page uses.

```js
import { open, close } from './vendor/dashboard-style/js/overlay.js';
import './vendor/dashboard-style/js/menu.js';
import './vendor/dashboard-style/js/dialog.js';
import './vendor/dashboard-style/js/toast.js';
import './vendor/dashboard-style/js/tooltip.js';
```

```css
@import './vendor/dashboard-style/css/index.css';   /* everything, or pick files: */
@import './vendor/dashboard-style/css/core/tokens.css';
@import './vendor/dashboard-style/css/core/motion.css';
@import './vendor/dashboard-style/css/core/global.css';
@import './vendor/dashboard-style/css/components/utilities.css';
@import './vendor/dashboard-style/css/components/button.css';
@import './vendor/dashboard-style/css/components/ripple.css';   /* with DS.ripple */
```

When you pick files, keep the order of `css/index.css` and always include `core/tokens.css`, `core/motion.css` (components
name the keyframes in it), `core/global.css` (the rules for every element inside `.ds-theme`: border-box sizing, the
forced-colours icon colour) and `components/utilities.css` (`.ds-sr`, which the scripts' live regions use). Add
`components/ripple.css` whenever you call `DS.ripple.attach()`: without it the ripple span sits in the flow and
widens the pressed control. With Node subpath imports, `"imports": { "#ds/*": "./vendor/dashboard-style/*" }` in
`package.json` lets both the bundler and Node tests write `#ds/js/motion.js`.

To load only what a project uses without picking files by hand, let `tools/bundle.mjs` scan the project and write
its bundle, or use the Vite plugin: [bundle.md](bundle.md) (the three ways to load, the config, the scanning rules,
`--check` in CI and the nightly update).

### Types

The copy carries hand-written TypeScript declarations (2.0), for TypeScript and for `checkJs` in an editor. An
`import` of `js/<module>.js` finds `js/<module>.d.ts` by itself. A page on the classic `ds.js` references
`ds.d.ts`, which declares the global `DS` (and `DashboardStyle.versions`) with every module's exports, their option
objects and the handles they return:

```js
/// <reference path="vendor/dashboard-style/ds.d.ts" />
const handle = DS.ripple.attach(document);   // RippleHandle: { destroy, release, detach }
DS.overlay.toast(null, 'Saved', { kind: 'success' });
```

The declarations follow the modules export for export and parameter for parameter (a test of this repository
compares them); a deprecated export or handle method is marked `@deprecated`, so an editor strikes it through, and
a deprecated option says so in its comment. They are not
a promise beyond the docs: where a type and [motion.md](motion.md) disagree, the docs win and the type is a bug.

## Multi-page apps

An app whose navigation loads pages can let them move like the views of a single-page app (fade-through, the panel
morph, the drawer's pill gliding): load `css/optional/view-transitions.css` after `ds.css` on every page, with
`.ds-theme` on `<html>`, from a `<link>` in the markup of `<head>` (a stylesheet that a script inserts may apply only
after Chromium revealed the new page, which then skips the transition). It opts every same-origin navigation into a
cross-document View Transition (`@view-transition`) and names the view, the panel and the docked drawer for good,
except while the modal drawer (at 900px and below, how phones navigate) or a dialog or side sheet is open (also one shown by hand;
a `.ds-dialog--contained` inside the panel does not count): then the
page being left stays under it and its scrim, and the new page's frame fades in over the crossfade. The motion comes
from the rules of `ds.css`. It affects the whole document, so an embedded widget never loads it.
Browsers without cross-document View Transitions load pages as before.

```html
<html class="ds-theme" lang="en">
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
<link rel="stylesheet" href="vendor/dashboard-style/css/optional/view-transitions.css">
```

An indicator glides across the load only with a `name` (`DS.indicator.create(list, { ..., name: 'nav' })`, unique on the
page), created before the new page is captured, from a classic script (not a module or a deferred script). Browsers
may reveal a page while it still parses (WebKit does), so either load `ds.js` in `<head>` and create the indicator in
an inline script right after its markup, or keep the scripts at the end of `<body>` and let the first render wait for
them:

```html
<head>
  ...
  <link rel="expect" href="#rendered" blocking="render">
</head>
<body>
  ...
  <script src="vendor/dashboard-style/ds.js"></script>
  <script src="app.js"></script>               <!-- DS.indicator.create(list, { ..., name: 'nav' }) -->
  <div id="rendered" hidden></div>
</body>
```

Chromium ends that wait early, with the console warning "Did not find element expected to be parsed", as soon as a
script before the marker parses markup into the page with `innerHTML` or `insertAdjacentHTML` (an icon's `<svg>`, an
`<img>`), so the first render may come before a later script has created the pill. Create the named indicator in the
same classic script that builds the navigation (nothing renders inside one task), or keep the links in the markup, and
build markup through a `<template>` (`DS.dom.morphHtml` does) or with `DS.icons.iconElement()` instead of parsing it
into the page.

Keep what the first render waits for short: the frame, the navigation and its named indicator, and what the first
view shows. An engine skips the transition when the new page is revealed after its timeout (a busy machine reaches it
sooner than you think), and until then the old page stays frozen. Build the rest after the reveal, once the
transition has finished (`pagereveal` gives `event.viewTransition`; its main-thread animations, the indicator's size
among them, stall behind long work); the styleguide's Motion Lab does this with its demos (`startLab` in
`styleguide/motion-lab.js`).

A page with or without the drawer morphs the panel on page loads too, over `--ds-dur-slow` (within a page,
`DS.motion.transition()` sees the width change and takes `--ds-dur-long`; a page load cannot tell).

Back and forward through the history can move on the shared axis instead of fading through; the file's header holds
the `pagereveal` snippet that sets `data-ds-vt` from `navigation.activation`.

## Two copies on one page

A host page and an embedded widget may each load their own `ds.js`. Every copy registers itself in
`window.DashboardStyle.versions['<version>']`; `window.DS` is set only when it is absent or holds the same version,
so the first copy keeps it. A second copy of the same version adds into the first, by name, only what the first
lacks (a module, or an export of a module; the first copy's own stay), so two bundles of one version make one
`DS`. A copy of another version leaves `window.DS` alone and logs one warning naming both versions; a `window.DS`
that is not Dashboard-Style (no `version` string) is never touched either. Code that must run on its own copy reads
it by version:

```js
const ds = window.DashboardStyle.versions['1.0.0'] || window.DS;
```

Every copy, of any version, and the ES modules next to it share one runtime, `window.DashboardStyle.runtime`
(`DS.core.runtime`, made by whichever loads first; [core.md](core.md#one-runtime-per-page)): the overlay state that
belongs to the page (the Escape stack, the scroll lock, the numbering of anchor names and tooltip ids, the tooltip
roots), the action guard of each document, the ripple of each root and the behaviour registry. Copies from 1.6.1
to 2.x share the overlay state through `document[Symbol.for('ds.overlay')]`, which the runtime adopts and keeps; see
[theming.md](theming.md), "Embedded in someone else's page".

## Language and locale

The system has almost no text of its own: labels, titles and messages are the page's markup and arguments. The few
strings a script adds have an option, so a page in another language passes its own:

| Built-in string | Where | Option |
|---|---|---|
| `Close` | the accessible name of the close button of a snackbar that stays | `DS.overlay.toast(region, text, { closeLabel })` |
| `OK` | the one button of a built alert dialog | `DS.overlay.alert({ closeLabel })` |
| `Cancel` | the cancel button of a built confirm or prompt dialog | `DS.overlay.confirm({ cancelLabel })`, `DS.overlay.prompt({ cancelLabel })` |
| `Confirm` | the confirm button of a built confirm or prompt dialog (name the consequence instead: "Delete device") | `DS.overlay.confirm({ confirmLabel })`, `DS.overlay.prompt({ confirmLabel })` |
| `That did not work. Try again.` | the error snackbar when `onConfirm` of a built dialog fails | `DS.overlay.confirm({ errorText })`, `DS.overlay.prompt({ errorText })` |
| `Enter a value.` | the field error of a built prompt's required field left empty | `DS.overlay.prompt({ requiredText })` |
| `Close` | the system's string `close` (behaviours read it with `DS.core.t('close')`) | `DS.core.config({ strings: { close } })` |
| `Copy` | the system's string `copy` | `DS.core.config({ strings: { copy } })` |
| `Copied` | the system's string `copied` | `DS.core.config({ strings: { copied } })` |
| `Show more` | the system's string `showMore` | `DS.core.config({ strings: { showMore } })` |
| `Show less` | the system's string `showLess` | `DS.core.config({ strings: { showLess } })` |
| `Clear` | the system's string `clear` | `DS.core.config({ strings: { clear } })` |
| `Loading` | the system's string `loading` | `DS.core.config({ strings: { loading } })` |
| `More` | the system's string `more` | `DS.core.config({ strings: { more } })` |
| `Dismiss` | the system's string `dismiss` | `DS.core.config({ strings: { dismiss } })` |
| `Required` | the system's string `required` | `DS.core.config({ strings: { required } })` |
| `Optional` | the system's string `optional` | `DS.core.config({ strings: { optional } })` |
| `OK` | the system's string `ok` | `DS.core.config({ strings: { ok } })` |
| `Cancel` | the system's string `cancel` | `DS.core.config({ strings: { cancel } })` |
| `Confirm` | the system's string `confirm` | `DS.core.config({ strings: { confirm } })` |
| `That did not work. Try again.` | the system's string `actionFailed` | `DS.core.config({ strings: { actionFailed } })` |
| `Enter a value.` | the system's string `valueRequired` | `DS.core.config({ strings: { valueRequired } })` |
| `Expand` | the system's string `expand` | `DS.core.config({ strings: { expand } })` |
| `Collapse` | the system's string `collapse` | `DS.core.config({ strings: { collapse } })` |
| `Remove` | the system's string `remove` | `DS.core.config({ strings: { remove } })` |
| `Previous` | the system's string `previous` | `DS.core.config({ strings: { previous } })` |
| `Next` | the system's string `next` | `DS.core.config({ strings: { next } })` |
| `No results` | the system's string `noResults` | `DS.core.config({ strings: { noResults } })` |
| `Moved {count} to {list}` | what a transfer list announces after a move, `{list}` the name of the side (the system's string `transferMoved`) | `DS.core.config({ strings: { transferMoved } })` |
| `Position {position}` | the place of a checked row of an ordered choice, for a screen reader (the system's string `orderPosition`) | `DS.core.config({ strings: { orderPosition } })` |
| `Create “{text}”` | the last option of a creatable combobox (`DS.combobox`) (the system's string `createOption`) | `DS.core.config({ strings: { createOption } })` |
| `1 result` | the status line of a filtered combobox, one match (the system's string `resultsOne`) | `DS.core.config({ strings: { resultsOne } })` |
| `{count} results` | the same, several matches (the system's string `resultsOther`) | `DS.core.config({ strings: { resultsOther } })` |
| `Type to search` | the status line of a combobox with a `source` before its first letters (the system's string `typeToSearch`) | `DS.core.config({ strings: { typeToSearch } })` |
| `Added {label}` | what a combobox of several values and a tag input announce when a value comes (the system's string `added`) | `DS.core.config({ strings: { added } })` |
| `Removed {label}` | the same when a value goes (the system's string `removed`) | `DS.core.config({ strings: { removed } })` |
| `{count} selected` | the summary of several choices: a select panel's trigger, a check group's count (the system's string `selectedCount`) | `DS.core.config({ strings: { selectedCount } })` |
| `{label} is in the list already` | the message of a tag input that refuses a repeated tag (the system's string `tagDuplicate`) | `DS.core.config({ strings: { tagDuplicate } })` |
| `{label} is not valid` | the message of a tag input that refuses a tag its `validate` turned down (the system's string `tagInvalid`) | `DS.core.config({ strings: { tagInvalid } })` |
| `Up to {max} items` | the message of a tag input or an ordered choice at its maximum (the system's string `tagMax`) | `DS.core.config({ strings: { tagMax } })` |
| `All selected` | the system's string `allSelected`: the summary of a select panel or check group with every option chosen | `DS.core.config({ strings: { allSelected } })` |
| `Ctrl` | the system's string `keyCtrl`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyCtrl } })` |
| `Alt` | the system's string `keyAlt`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyAlt } })` |
| `Shift` | the system's string `keyShift`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyShift } })` |
| `Win` | the system's string `keyMeta`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyMeta } })` |
| `Enter` | the system's string `keyEnter`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyEnter } })` |
| `Esc` | the system's string `keyEscape`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyEscape } })` |
| `Space` | the system's string `keySpace`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keySpace } })` |
| `Tab` | the system's string `keyTab`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyTab } })` |
| `Backspace` | the system's string `keyBackspace`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyBackspace } })` |
| `Delete` | the system's string `keyDelete`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyDelete } })` |
| `Home` | the system's string `keyHome`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyHome } })` |
| `End` | the system's string `keyEnd`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyEnd } })` |
| `Page Up` | the system's string `keyPageUp`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyPageUp } })` |
| `Page Down` | the system's string `keyPageDown`: a key in `DS.hotkeys.format()` outside Apple systems (on them the modifiers are ⌃ ⌥ ⇧ ⌘) | `DS.core.config({ strings: { keyPageDown } })` |
| `General` | the system's string `hotkeysGeneral`: the group of a shortcut without one in `DS.hotkeys.list()` | `DS.core.config({ strings: { hotkeysGeneral } })` |
| `Press Space to pick up. Then the arrow keys move it, Space drops it and Escape cancels.` | what a focused handle of `DS.dnd.create()` describes (`aria-describedby`) (the system's string `dragHint`) | `DS.core.config({ strings: { dragHint } })` |
| `Picked up {label}, position {position} of {total}.` | what `DS.dnd.create()` announces on a lift (the system's string `dragGrabbed`) | `DS.core.config({ strings: { dragGrabbed } })` |
| `Moved {label} to position {position} of {total}.` | what `DS.dnd.create()` announces on a move (the system's string `dragMoved`) | `DS.core.config({ strings: { dragMoved } })` |
| `Moved {label} to {zone}, position {position} of {total}.` | the same, with several named zones (the system's string `dragMovedZone`) | `DS.core.config({ strings: { dragMovedZone } })` |
| `Dropped {label} at position {position} of {total}.` | what `DS.dnd.create()` announces on a drop (the system's string `dragDropped`) | `DS.core.config({ strings: { dragDropped } })` |
| `Dropped {label} in {zone}, position {position} of {total}.` | the same, with several named zones (the system's string `dragDroppedZone`) | `DS.core.config({ strings: { dragDroppedZone } })` |
| `Cancelled. {label} is back at position {position} of {total}.` | what `DS.dnd.create()` announces on a cancel (the system's string `dragCancelled`) | `DS.core.config({ strings: { dragCancelled } })` |
| `Resize` | the name of a split pane's divider without one of its own (`DS.splitpane`; the system's string `splitpaneResize`) | `DS.core.config({ strings: { splitpaneResize } })` |
| `Collapsed` | the value a split pane's divider reads while its pane is collapsed (`aria-valuetext`; the system's string `splitpaneCollapsed`) | `DS.core.config({ strings: { splitpaneCollapsed } })` |
| `Back` | the name of a list-detail layout's back button without one of its own (`DS.listdetail`; the system's string `back`) | `DS.core.config({ strings: { back } })` |
| `Decrease` | the name of a number input's minus stepper without one of its own (`DS.number`; the system's string `decrease`) | `DS.core.config({ strings: { decrease } })` |
| `Increase` | the name of a number input's plus stepper without one of its own (the system's string `increase`) | `DS.core.config({ strings: { increase } })` |
| `Show password` | the name of a password's reveal button without one of its own (`DS.password`; the system's string `showPassword`) | `DS.core.config({ strings: { showPassword } })` |
| `Caps Lock is on.` | a password's caps-lock hint while it has no text of its own (the system's string `capsLock`) | `DS.core.config({ strings: { capsLock } })` |
| `Weak` | the first level of a password's strength meter (the system's string `strengthWeak`) | `DS.core.config({ strings: { strengthWeak } })` |
| `Fair` | the second level (the system's string `strengthFair`) | `DS.core.config({ strings: { strengthFair } })` |
| `Good` | the third level (the system's string `strengthGood`) | `DS.core.config({ strings: { strengthGood } })` |
| `Strong` | the fourth level (the system's string `strengthStrong`) | `DS.core.config({ strings: { strengthStrong } })` |
| `Password strength: {level}` | what a password announces when its level changes (the system's string `passwordStrength`) | `DS.core.config({ strings: { passwordStrength } })` |
| `Set` | a secret field's status while a value is stored (`DS.secret`; the system's string `secretSet`) | `DS.core.config({ strings: { secretSet } })` |
| `Not set` | its status while none is (the system's string `secretNotSet`) | `DS.core.config({ strings: { secretNotSet } })` |
| `Removed when you save` | its status once Clear was pressed (the system's string `secretCleared`) | `DS.core.config({ strings: { secretCleared } })` |
| `Recent searches` | the name of a search field's list of recent searches (`DS.search`; the system's string `recentSearches`) | `DS.core.config({ strings: { recentSearches } })` |
| `Clear recent searches` | the button under that list (the system's string `clearRecent`) | `DS.core.config({ strings: { clearRecent } })` |
| `{count} result` | a search field's count of one result (the system's string `searchResultsOne`, the plural form `one`) | `DS.core.config({ strings: { searchResultsOne } })` |
| `{count} results` | its count of any other number (the system's string `searchResultsMany`, the form `other`) | `DS.core.config({ strings: { searchResultsMany } })` |
| `Edit` | the name of an inline edit's view button without one of its own (`DS.inlineedit`; the system's string `edit`) | `DS.core.config({ strings: { edit } })` |
| `Save` | its save button without a name (the system's string `save`) | `DS.core.config({ strings: { save } })` |
| `Saved` | what an inline edit announces after a save (the system's string `saved`) | `DS.core.config({ strings: { saved } })` |
| `Type {name} to confirm` | the label of a type-to-confirm field (`DS.typeconfirm`; the system's string `typeToConfirm`) | `DS.core.config({ strings: { typeToConfirm } })` |
| `There is 1 problem` | the title of an error summary with one problem (`DS.errorsummary`; the system's string `errorSummaryOne`) | `DS.core.config({ strings: { errorSummaryOne } })` |
| `There are {count} problems` | its title with more (the system's string `errorSummaryMany`) | `DS.core.config({ strings: { errorSummaryMany } })` |
| `{label}: {message}` | an error summary's line for a field without an error message of the page's own: its label and the browser's validation message (the system's string `errorSummaryField`) | `DS.core.config({ strings: { errorSummaryField } })` |
| `Digit {index} of {count}` | the name of a cell of a numeric code field without one of its own (`DS.otp`; the system's string `otpDigit`) | `DS.core.config({ strings: { otpDigit } })` |
| `Character {index} of {count}` | the same on an alphanumeric code field (the system's string `otpCharacter`) | `DS.core.config({ strings: { otpCharacter } })` |
| `{count} characters left` | what a field with a character counter says once it comes near its limit (`DS.form`, `data-ds-counter`; the system's string `charactersLeft`, the plural form `other`) | `DS.core.config({ strings: { charactersLeft } })` |
| `1 character left` | the same for one (the system's string `charactersLeftOne`, the form `one`) | `DS.core.config({ strings: { charactersLeftOne } })` |
| `{count} characters too many` | what it says once the text goes past a soft limit (the system's string `charactersOver`) | `DS.core.config({ strings: { charactersOver } })` |
| `1 character too many` | the same for one (the system's string `charactersOverOne`) | `DS.core.config({ strings: { charactersOverOne } })` |
| `Previous month` | the name of the calendar's button to the month before (`DS.calendar`) (the system's string `previousMonth`) | `DS.core.config({ strings: { previousMonth } })` |
| `Next month` | the name of the calendar's button to the month after (the system's string `nextMonth`) | `DS.core.config({ strings: { nextMonth } })` |
| `selected` | what the name of a chosen day in the calendar ends on ("Wednesday, November 4, 2026, selected"; the system's string `selected`) | `DS.core.config({ strings: { selected } })` |
| `Choose date` | the name of a date picker's calendar button and popover without one of their own (`DS.datepicker`) (the system's string `chooseDate`) | `DS.core.config({ strings: { chooseDate } })` |
| `Choose dates` | the same for a date range picker (`DS.daterange`) (the system's string `chooseDates`) | `DS.core.config({ strings: { chooseDates } })` |
| `Choose time` | the same for a time picker, and the name of its list (`DS.timepicker`) (the system's string `chooseTime`) | `DS.core.config({ strings: { chooseTime } })` |
| `Empty` | what a date field's segment reads while it has no value (`aria-valuetext`, `DS.datefield`) (the system's string `empty`) | `DS.core.config({ strings: { empty } })` |
| `Start` | the name of the first date of a range field (the system's string `rangeStart`) | `DS.core.config({ strings: { rangeStart } })` |
| `End` | the name of the second date of a range field (the system's string `rangeEnd`) | `DS.core.config({ strings: { rangeEnd } })` |
| `Presets` | the name of a date range picker's list of presets (the system's string `presets`) | `DS.core.config({ strings: { presets } })` |
| `Last {span}` | a relative range up to now ("Last 7 days"; `{span}` the length in the locale's words) in the date range picker and the time range (the system's string `lastSpan`) | `DS.core.config({ strings: { lastSpan } })` |
| `Time range` | the name of a time range without one of its own, and of its popover (`DS.timerange`) (the system's string `timeRange`) | `DS.core.config({ strings: { timeRange } })` |
| `Absolute time range` | the heading of the time range's from and to fields (the system's string `absoluteRange`) | `DS.core.config({ strings: { absoluteRange } })` |
| `From` | the label of the time range's start field (the system's string `rangeFrom`) | `DS.core.config({ strings: { rangeFrom } })` |
| `To` | the label of the time range's end field (the system's string `rangeTo`) | `DS.core.config({ strings: { rangeTo } })` |
| `Apply` | the button that applies the time range's absolute range (the system's string `apply`) | `DS.core.config({ strings: { apply } })` |
| `Recently used` | the heading of the time range's remembered ranges (the system's string `recentRanges`) | `DS.core.config({ strings: { recentRanges } })` |
| `Quick ranges` | the heading of the time range's relative ranges (the system's string `quickRanges`) | `DS.core.config({ strings: { quickRanges } })` |
| `Refresh` | the name and tooltip of the time range's refresh button (the system's string `refresh`) | `DS.core.config({ strings: { refresh } })` |
| `Auto refresh` | the name of the time range's interval select (the system's string `autoRefresh`) | `DS.core.config({ strings: { autoRefresh } })` |
| `Off` | the first option of that select: no auto refresh (the system's string `off`) | `DS.core.config({ strings: { off } })` |
| `The start must come before the end.` | the error of the time range's absolute range when its start is after its end (the system's string `rangeOrder`) | `DS.core.config({ strings: { rangeOrder } })` |
| `Retry` | the system's string `retry`: the tooltip of a retry button ([File upload](components.md#file-upload)) | `DS.core.config({ strings: { retry } })` |
| `Waiting` | a file of `DS.upload` not started yet (the system's string `uploadWaiting`) | `DS.core.config({ strings: { uploadWaiting } })` |
| `Uploaded` | a file of `DS.upload` that is done (the system's string `uploadDone`) | `DS.core.config({ strings: { uploadDone } })` |
| `Upload failed` | a failed file of `DS.upload` without a reason (the system's string `uploadFailed`) | `DS.core.config({ strings: { uploadFailed } })` |
| `Retry {name}` | the name of a file's retry button in `DS.upload` (the system's string `uploadRetry`) | `DS.core.config({ strings: { uploadRetry } })` |
| `Remove {name}` | the name of a file's remove button in `DS.upload` (the system's string `uploadRemove`) | `DS.core.config({ strings: { uploadRemove } })` |
| `Upload of {name}` | the name of a file's progress bar in `DS.upload` (the system's string `uploadProgress`) | `DS.core.config({ strings: { uploadProgress } })` |
| `{name} is not a type this field takes.` | a file `DS.upload` refused for its type (the system's string `uploadWrongType`) | `DS.core.config({ strings: { uploadWrongType } })` |
| `{name} was not added: at most {max} files.` | a file `DS.upload` refused for the count (the system's string `uploadTooMany`) | `DS.core.config({ strings: { uploadTooMany } })` |
| `{name} is larger than {max}.` | a file `DS.upload` refused for its size (the system's string `uploadTooLarge`) | `DS.core.config({ strings: { uploadTooLarge } })` |
| `{name} is empty.` | an empty file `DS.upload` refused (the system's string `uploadEmpty`) | `DS.core.config({ strings: { uploadEmpty } })` |
| `Added {name}.` | what `DS.upload` announces for one file added (the system's string `uploadAdded`) | `DS.core.config({ strings: { uploadAdded } })` |
| `Added {count} files.` | what `DS.upload` announces for several (the system's string `uploadAddedCount`) | `DS.core.config({ strings: { uploadAddedCount } })` |
| `Removed {name}.` | what `DS.upload` announces for a removal (the system's string `uploadRemoved`) | `DS.core.config({ strings: { uploadRemoved } })` |
| `{name} uploaded.` | what `DS.upload` announces when a file is done (the system's string `uploadDoneAnnounce`) | `DS.core.config({ strings: { uploadDoneAnnounce } })` |
| `Upload of {name} failed.` | what `DS.upload` announces when a file failed (the system's string `uploadFailedAnnounce`) | `DS.core.config({ strings: { uploadFailedAnnounce } })` |
| `Add row` | the add button `DS.kveditor` makes when the markup has none (the system's string `kvAdd`) | `DS.core.config({ strings: { kvAdd } })` |
| `Key, row {row}` | the name of a key field of `DS.kveditor` (the system's string `kvKeyLabel`) | `DS.core.config({ strings: { kvKeyLabel } })` |
| `Value, row {row}` | the name of a value field of `DS.kveditor` without a key (the system's string `kvValueLabel`) | `DS.core.config({ strings: { kvValueLabel } })` |
| `Value of {key}` | the name of a value field of `DS.kveditor` (the system's string `kvValueOf`) | `DS.core.config({ strings: { kvValueOf } })` |
| `Remove {key}` | the name of a row's remove button in `DS.kveditor` (the system's string `kvRemove`) | `DS.core.config({ strings: { kvRemove } })` |
| `Remove row {row}` | the same, for a row without a key (the system's string `kvRemoveRow`) | `DS.core.config({ strings: { kvRemoveRow } })` |
| `Show the value of {key}` | the name of a secret value's reveal button in `DS.kveditor` (the system's string `kvShow`) | `DS.core.config({ strings: { kvShow } })` |
| `Show the value of row {row}` | the same, for a row without a key (the system's string `kvShowRow`) | `DS.core.config({ strings: { kvShowRow } })` |
| `{key} is also on row {rows}: the last one counts.` | the warning of a key that comes twice in `DS.kveditor` (the system's string `kvDuplicate`) | `DS.core.config({ strings: { kvDuplicate } })` |
| `Add a key, or this row is left out.` | the warning of a value without a key in `DS.kveditor` (the system's string `kvNoKey`) | `DS.core.config({ strings: { kvNoKey } })` |
| `Removed {key}.` | what `DS.kveditor` announces for a removed row (the system's string `kvRemoved`) | `DS.core.config({ strings: { kvRemoved } })` |
| `Removed a row.` | the same, for a row without a key (the system's string `kvRemovedRow`) | `DS.core.config({ strings: { kvRemovedRow } })` |
| `Pasted {count} rows.` | what `DS.kveditor` announces after a paste of KEY=value lines (the system's string `kvPasted`) | `DS.core.config({ strings: { kvPasted } })` |
| `done` | the hidden word after a done step's label in `DS.wizard` ("Device, done") (the system's string `wizardDone`) | `DS.core.config({ strings: { wizardDone } })` |
| `Needs attention` | the hint of a step in error in `DS.wizard` (the system's string `wizardFix`) | `DS.core.config({ strings: { wizardFix } })` |
| `Step {index} of {count}` | the name of a `.ds-steps--bar` that `DS.wizard` writes (the system's string `wizardStepOf`) | `DS.core.config({ strings: { wizardStepOf } })` |
| `Step {index} of {count}: {label}` | what `DS.wizard` announces when a step opens (the system's string `wizardStep`) | `DS.core.config({ strings: { wizardStep } })` |
| `One field needs attention.` | what `DS.wizard` announces for a step with one invalid field (the system's string `wizardError`) | `DS.core.config({ strings: { wizardError } })` |
| `{count} fields need attention.` | the same, for several (the system's string `wizardErrors`) | `DS.core.config({ strings: { wizardErrors } })` |
| `Not given` | an empty field in the summary of `DS.wizard` (the system's string `wizardEmpty`) | `DS.core.config({ strings: { wizardEmpty } })` |
| `Edit {label}` | the name of a step's Edit button in the summary of `DS.wizard` (the system's string `wizardEdit`) | `DS.core.config({ strings: { wizardEdit } })` |
| `Edit` | the text of that button (the system's string `wizardEditShort`) | `DS.core.config({ strings: { wizardEditShort } })` |
| `Yes` | a ticked lone checkbox in the summary of `DS.wizard` (the system's string `wizardYes`) | `DS.core.config({ strings: { wizardYes } })` |
| `No` | a lone checkbox left empty in the summary of `DS.wizard` (the system's string `wizardNo`) | `DS.core.config({ strings: { wizardNo } })` |
| `1 unsaved change` | the text of `[data-ds-unsaved-count]` for one change in `DS.unsaved` (the system's string `unsavedOne`) | `DS.core.config({ strings: { unsavedOne } })` |
| `{count} unsaved changes` | the same, for several (the system's string `unsavedMany`) | `DS.core.config({ strings: { unsavedMany } })` |
| `Save changes` | the shortcut sheet's line for the save shortcut of `DS.unsaved` (the system's string `unsavedSaveKey`) | `DS.core.config({ strings: { unsavedSaveKey } })` |
| `Changes saved.` | what `DS.unsaved` announces after a save (the system's string `unsavedSaved`) | `DS.core.config({ strings: { unsavedSaved } })` |
| `Not saved. Your changes are still here.` | what `DS.unsaved` announces when a save failed (the system's string `unsavedFailed`) | `DS.core.config({ strings: { unsavedFailed } })` |
| `Changes discarded.` | what `DS.unsaved` announces after a discard (the system's string `unsavedDiscarded`) | `DS.core.config({ strings: { unsavedDiscarded } })` |
| `Leave without saving?` | the title of the dialog of `DS.unsaved.navigate()` (the system's string `unsavedLeaveTitle`) | `DS.core.config({ strings: { unsavedLeaveTitle } })` |
| `Your unsaved changes will be lost.` | its text (the system's string `unsavedLeaveText`) | `DS.core.config({ strings: { unsavedLeaveText } })` |
| `Discard changes` | its confirm button (the system's string `unsavedLeave`) | `DS.core.config({ strings: { unsavedLeave } })` |
| `Keep editing` | its cancel button (the system's string `unsavedStay`) | `DS.core.config({ strings: { unsavedStay } })` |
| `(changed)` | the word `DS.unsaved` adds to a changed field's label for screen readers, where the label has no `.ds-field__changed` (the system's string `unsavedChangedWord`) | `DS.core.config({ strings: { unsavedChangedWord } })` |
| `is` | the operator of a filter of `DS.query` ("Status is open") (the system's string `queryIs`) | `DS.core.config({ strings: { queryIs } })` |
| `is not` | the same, negated (`-status:closed`) (the system's string `queryNot`) | `DS.core.config({ strings: { queryNot } })` |
| `over` | the same, `key:>n` (the system's string `queryGt`) | `DS.core.config({ strings: { queryGt } })` |
| `at least` | the same, `key:>=n` (the system's string `queryGte`) | `DS.core.config({ strings: { queryGte } })` |
| `under` | the same, `key:<n` (the system's string `queryLt`) | `DS.core.config({ strings: { queryLt } })` |
| `at most` | the same, `key:<=n` (the system's string `queryLte`) | `DS.core.config({ strings: { queryLte } })` |
| `or` | between the values of one filter of `DS.query` (the system's string `queryOr`) | `DS.core.config({ strings: { queryOr } })` |
| `Text` | the name of the free text of `DS.query` ("Text printer") (the system's string `queryText`) | `DS.core.config({ strings: { queryText } })` |
| `Remove filter` | the hidden start of a token's name in `DS.query` (the system's string `queryRemove`) | `DS.core.config({ strings: { queryRemove } })` |
| `Backspace or Delete removes it, F2 edits it.` | the description of every token of `DS.query` (the system's string `queryTokenHint`) | `DS.core.config({ strings: { queryTokenHint } })` |
| `(not a known filter)` | the reason in the name of a token of `DS.query` whose key the page did not name (the system's string `queryUnknownKey`) | `DS.core.config({ strings: { queryUnknownKey } })` |
| `(this filter does not compare)` | the same, for an operator its key does not take (the system's string `queryBadOp`) | `DS.core.config({ strings: { queryBadOp } })` |
| `(not a valid value)` | the same, for a value outside its key's list, or no number or date (the system's string `queryBadValue`) | `DS.core.config({ strings: { queryBadValue } })` |
| `Suggestions` | the name of the list of `DS.query` (the system's string `querySuggestions`) | `DS.core.config({ strings: { querySuggestions } })` |
| `Filter by` | the heading of the keys in that list (the system's string `queryKeys`) | `DS.core.config({ strings: { queryKeys } })` |
| `Compare` | the heading of the operators in that list (the system's string `queryOperators`) | `DS.core.config({ strings: { queryOperators } })` |
| `Saved queries` | the heading of the saved queries in that list (the system's string `querySaved`) | `DS.core.config({ strings: { querySaved } })` |
| `Search` | the heading of the free-text choice in that list (the system's string `querySearch`) | `DS.core.config({ strings: { querySearch } })` |
| `Search for "{text}"` | the free-text choice in that list (the system's string `querySearchFor`) | `DS.core.config({ strings: { querySearchFor } })` |
| `1 suggestion` | the status line of that list for one entry (the system's string `queryOne`) | `DS.core.config({ strings: { queryOne } })` |
| `{count} suggestions` | the same, for several (the system's string `queryMany`) | `DS.core.config({ strings: { queryMany } })` |
| `No suggestions` | the same, for none (the system's string `queryNoMatch`) | `DS.core.config({ strings: { queryNoMatch } })` |
| `Not a known filter` | the same, after a key the page did not name (the system's string `queryUnknown`) | `DS.core.config({ strings: { queryUnknown } })` |
| `Enter applies this saved query, Delete removes it.` | the status line while a saved query is active (the system's string `querySavedHint`) | `DS.core.config({ strings: { querySavedHint } })` |
| `Added filter {label}.` | what `DS.query` announces for a new token (the system's string `queryAdded`) | `DS.core.config({ strings: { queryAdded } })` |
| `Removed filter {label}.` | what `DS.query` announces for a removed token (the system's string `queryRemoved`) | `DS.core.config({ strings: { queryRemoved } })` |
| `Editing filter {label}.` | what `DS.query` announces when a token goes back into the field (the system's string `queryEditing`) | `DS.core.config({ strings: { queryEditing } })` |
| `Cleared the query.` | what `DS.query` announces after its clear button (the system's string `queryCleared`) | `DS.core.config({ strings: { queryCleared } })` |
| `Applied {name}.` | what `DS.query` announces after a saved query was chosen (the system's string `queryApplied`) | `DS.core.config({ strings: { queryApplied } })` |
| `Clear the query` | the name of the clear button of `DS.query` (the system's string `queryClear`) | `DS.core.config({ strings: { queryClear } })` |
| `Save this query` | the name of `.ds-query__save` (the system's string `querySave`) | `DS.core.config({ strings: { querySave } })` |
| `Save the query` | the title of the dialog of `.ds-query__save` (the system's string `querySaveTitle`) | `DS.core.config({ strings: { querySaveTitle } })` |
| `Name` | the field of that dialog (the system's string `querySaveName`) | `DS.core.config({ strings: { querySaveName } })` |
| `Save` | its confirm button (the system's string `querySaveConfirm`) | `DS.core.config({ strings: { querySaveConfirm } })` |
| `Saved the query as {name}.` | what `DS.query` announces after a save (the system's string `querySavedAs`) | `DS.core.config({ strings: { querySavedAs } })` |
| `Removed the saved query {name}.` | what `DS.query` announces after Delete on a saved query (the system's string `querySavedRemoved`) | `DS.core.config({ strings: { querySavedRemoved } })` |
| `Select` | the hidden name of a data grid's selection column with single selection (`DS.datagrid`; the system's string `datagridSelect`) | `DS.core.config({ strings: { datagridSelect } })` |
| `Select all rows` | the name of a data grid's select-all box in its header (the system's string `datagridSelectAll`) | `DS.core.config({ strings: { datagridSelectAll } })` |
| `Select {label}` | the name of a row's checkbox in a data grid (the system's string `datagridSelectRow`) | `DS.core.config({ strings: { datagridSelectRow } })` |
| `{count} selected` | the count a data grid writes into its selection bar (the system's string `datagridSelected`) | `DS.core.config({ strings: { datagridSelected } })` |
| `Select all {total}` | the link in the selection bar that selects every row on every page (the system's string `datagridSelectEvery`) | `DS.core.config({ strings: { datagridSelectEvery } })` |
| `All {total} selected` | the count and announcement once every row is selected (the system's string `datagridSelectedEvery`) | `DS.core.config({ strings: { datagridSelectedEvery } })` |
| `Details` | the hidden name of a data grid's details column (the system's string `datagridDetails`) | `DS.core.config({ strings: { datagridDetails } })` |
| `Details of {label}` | the name of a row's details toggle (the system's string `datagridDetailsOf`) | `DS.core.config({ strings: { datagridDetailsOf } })` |
| `Actions` | the hidden name of a data grid's actions column (the system's string `datagridActions`) | `DS.core.config({ strings: { datagridActions } })` |
| `Sorted by {column}, {direction}.` | what a data grid announces after a sort (the system's string `datagridSorted`) | `DS.core.config({ strings: { datagridSorted } })` |
| `Sorting removed.` | what it announces when the sort is taken off (the system's string `datagridUnsorted`) | `DS.core.config({ strings: { datagridUnsorted } })` |
| `, sort {rank}, {direction}` | the hidden words after a secondary sorted column's label (the system's string `datagridSortRank`) | `DS.core.config({ strings: { datagridSortRank } })` |
| `ascending` | the direction in those words and announcements (the system's string `datagridAscending`) | `DS.core.config({ strings: { datagridAscending } })` |
| `descending` | the other direction (the system's string `datagridDescending`) | `DS.core.config({ strings: { datagridDescending } })` |
| `Resize {column}` | the name of a column's resize separator (the system's string `datagridResize`) | `DS.core.config({ strings: { datagridResize } })` |
| `Move {column}` | the name of a column's grip (the system's string `datagridMove`) | `DS.core.config({ strings: { datagridMove } })` |
| `Columns` | the heading of the column boxes in a data grid's chooser (the system's string `datagridColumns`) | `DS.core.config({ strings: { datagridColumns } })` |
| `Views` | the heading of the presets in the chooser (the system's string `datagridPresets`) | `DS.core.config({ strings: { datagridPresets } })` |
| `Default` | the preset of the default columns (the system's string `datagridPresetDefault`) | `DS.core.config({ strings: { datagridPresetDefault } })` |
| `All columns` | the preset that shows every column (the system's string `datagridPresetAll`) | `DS.core.config({ strings: { datagridPresetAll } })` |
| `{preset} shown.` | what a data grid announces when a preset applies (the system's string `datagridPresetApplied`) | `DS.core.config({ strings: { datagridPresetApplied } })` |
| `{column} shown.` | what it announces when a column shows (the system's string `datagridColumnShown`) | `DS.core.config({ strings: { datagridColumnShown } })` |
| `{column} hidden.` | what it announces when a column hides (the system's string `datagridColumnHidden`) | `DS.core.config({ strings: { datagridColumnHidden } })` |
| `{count} row` | a count of one row: a group's count and the filter's announcement (the system's string `datagridRowsOne`, the plural form `one`) | `DS.core.config({ strings: { datagridRowsOne } })` |
| `{count} rows` | a count of any other number of rows (the system's string `datagridRowsOther`, the form `other`) | `DS.core.config({ strings: { datagridRowsOther } })` |
| `Page {page} of {pages}` | what a data grid announces on a new page (the system's string `datagridPage`) | `DS.core.config({ strings: { datagridPage } })` |
| `{from}–{to} of {total}` | the range a data grid writes into its pager (the system's string `datagridRange`) | `DS.core.config({ strings: { datagridRange } })` |
| `Total` | the label of a data grid's summary row (the system's string `datagridTotal`; the option `footLabel` per grid) | `DS.core.config({ strings: { datagridTotal } })` |
| `No value` | the label of a row group whose value is empty (the system's string `datagridNoValue`) | `DS.core.config({ strings: { datagridNoValue } })` |
| `Nothing here yet` | the title of a data grid with no rows (the system's string `datagridEmpty`; the option `emptyText` per grid) | `DS.core.config({ strings: { datagridEmpty } })` |
| `Nothing matches the filter.` | the text under "No results" when a filter leaves no row (the system's string `datagridNoResultsText`) | `DS.core.config({ strings: { datagridNoResultsText } })` |
| `The data did not load.` | the title of a data grid whose data did not load, also announced (the system's string `datagridError`; the option `errorText` per grid) | `DS.core.config({ strings: { datagridError } })` |
| `Try again` | the button of that state (the system's string `datagridRetry`) | `DS.core.config({ strings: { datagridRetry } })` |
| `Enter a number.` | what an inline edit of a number column says for a value that is no number (the system's string `datagridInvalidNumber`) | `DS.core.config({ strings: { datagridInvalidNumber } })` |
| `{column} saved.` | what a data grid announces after an inline edit (the system's string `datagridEditSaved`) | `DS.core.config({ strings: { datagridEditSaved } })` |
| `{column} not saved.` | what it announces when the page cancels `ds:edit` (the system's string `datagridEditRefused`) | `DS.core.config({ strings: { datagridEditRefused } })` |
| `{count} row copied.` | what it announces after copying one row (the system's string `datagridCopiedOne`, the plural form `one`) | `DS.core.config({ strings: { datagridCopiedOne } })` |
| `{count} rows copied.` | after copying any other number (the system's string `datagridCopiedOther`, the form `other`) | `DS.core.config({ strings: { datagridCopiedOther } })` |
| `Ascending` | the order of a sort field without a type in `DS.sort` (the system's string `sortAscending`) | `DS.core.config({ strings: { sortAscending } })` |
| `Descending` | the same, descending (the system's string `sortDescending`) | `DS.core.config({ strings: { sortDescending } })` |
| `A to Z` | the ascending order of a text field (`data-ds-sort-type="text"`) in `DS.sort` (the system's string `sortAscendingText`) | `DS.core.config({ strings: { sortAscendingText } })` |
| `Z to A` | the same, descending (the system's string `sortDescendingText`) | `DS.core.config({ strings: { sortDescendingText } })` |
| `Lowest first` | the ascending order of a number field in `DS.sort` (the system's string `sortAscendingNumber`) | `DS.core.config({ strings: { sortAscendingNumber } })` |
| `Highest first` | the same, descending (the system's string `sortDescendingNumber`) | `DS.core.config({ strings: { sortDescendingNumber } })` |
| `Oldest first` | the ascending order of a date field in `DS.sort` (the system's string `sortAscendingDate`) | `DS.core.config({ strings: { sortAscendingDate } })` |
| `Newest first` | the same, descending (the system's string `sortDescendingDate`) | `DS.core.config({ strings: { sortDescendingDate } })` |
| `Sorted by {field}, {direction}` | what `DS.sort` announces after the user changed the sort (the system's string `sortAnnounce`) | `DS.core.config({ strings: { sortAnnounce } })` |
| `Showing {loaded} of {total}` | the status of `DS.loadmore` (the system's string `loadMoreStatus`) | `DS.core.config({ strings: { loadMoreStatus } })` |
| `Showing {loaded}` | the same, without a total (the system's string `loadMoreStatusOpen`) | `DS.core.config({ strings: { loadMoreStatusOpen } })` |
| `All {total} shown` | the status of `DS.loadmore` once everything shows (the system's string `loadMoreDone`) | `DS.core.config({ strings: { loadMoreDone } })` |
| `Loaded {count} more.` | what `DS.loadmore` announces after a load, before the status (the system's string `loadMoreLoaded`) | `DS.core.config({ strings: { loadMoreLoaded } })` |
| `Loading more` | what `DS.loadmore` announces when its sentinel starts a load (the system's string `loadMoreLoading`) | `DS.core.config({ strings: { loadMoreLoading } })` |
| `Could not load more.` | the status and announcement of a failed load in `DS.loadmore` (the system's string `loadMoreFailed`) | `DS.core.config({ strings: { loadMoreFailed } })` |
| `Try again` | the label of the button of `DS.loadmore` after a failed load (the system's string `tryAgain`) | `DS.core.config({ strings: { tryAgain } })` |
| `Remove filter` | the hidden start of an applied filter chip's name in `DS.filterbar` and `DS.facets` (the system's string `removeFilter`) | `DS.core.config({ strings: { removeFilter } })` |
| `Removed {filter}` | what `DS.filterbar` and `DS.facets` announce when a chip removed its filter (the system's string `filterRemoved`) | `DS.core.config({ strings: { filterRemoved } })` |
| `Filters cleared` | what `DS.filterbar` and `DS.facets` announce after Clear all (the system's string `filtersCleared`) | `DS.core.config({ strings: { filtersCleared } })` |
| `{count} applied` | the hidden words after the badge of the Filters button of a folded `DS.filterbar` (the system's string `filtersApplied`) | `DS.core.config({ strings: { filtersApplied } })` |
| `{label}: {value}` | the text of an applied filter chip in `DS.filterbar` and `DS.facets` (the system's string `filterChip`) | `DS.core.config({ strings: { filterChip } })` |
| `{count} result` | the count `count()` of `DS.filterbar` writes, one (the system's string `resultsOne`) | `DS.core.config({ strings: { resultsOne } })` |
| `{count} results` | the same, other numbers (the system's string `resultsOther`) | `DS.core.config({ strings: { resultsOther } })` |
| `Show {results}` | the results button in the sheet of a folded `DS.filterbar` (the system's string `showResults`) | `DS.core.config({ strings: { showResults } })` |
| `from {min}` | a range filter with only a lower bound, on its chip (the system's string `rangeFrom`) | `DS.core.config({ strings: { rangeFrom } })` |
| `up to {max}` | a range filter with only an upper bound, on its chip (the system's string `rangeTo`) | `DS.core.config({ strings: { rangeTo } })` |
| `{min} to {max}` | a range filter with both bounds, on its chip (the system's string `rangeBetween`) | `DS.core.config({ strings: { rangeBetween } })` |
| `Show all {count}` | the button after the first options of a facet with a limit in `DS.facets` (the system's string `facetShowAll`) | `DS.core.config({ strings: { facetShowAll } })` |
| `Show fewer` | the same button while every option shows (the system's string `facetShowFewer`) | `DS.core.config({ strings: { facetShowFewer } })` |
| `No match for “{query}”` | the line, and the announcement, of a facet search in `DS.facets` that matches no option (the system's string `facetNoMatch`) | `DS.core.config({ strings: { facetNoMatch } })` |
| `{count} match` | what `DS.facets` announces once typing in a facet search pauses, one (the system's string `facetMatchesOne`) | `DS.core.config({ strings: { facetMatchesOne } })` |
| `{count} matches` | the same, other numbers (the system's string `facetMatchesOther`) | `DS.core.config({ strings: { facetMatchesOther } })` |
| `Edited` | the word on the trigger of `DS.views` while the page's state differs from the current view (the system's string `viewEdited`) | `DS.core.config({ strings: { viewEdited } })` |
| `Default` | the word on the default view in the menu of `DS.views` (the system's string `viewDefault`) | `DS.core.config({ strings: { viewDefault } })` |
| `View: {name}` | what `DS.views` announces after a view was picked (the system's string `viewApplied`) | `DS.core.config({ strings: { viewApplied } })` |
| `Saved {name}` | the snackbar and announcement of `DS.views` after a view was saved or renamed (the system's string `viewSaved`) | `DS.core.config({ strings: { viewSaved } })` |
| `Deleted {name}` | what `DS.views` announces after a view was deleted (the system's string `viewDeleted`) | `DS.core.config({ strings: { viewDeleted } })` |
| `{name} is the default view` | what `DS.views` announces after Make default (the system's string `viewDefaultSet`) | `DS.core.config({ strings: { viewDefaultSet } })` |
| `Link copied` | the snackbar of `DS.views` after the link to a view was copied (the system's string `viewLinkCopied`) | `DS.core.config({ strings: { viewLinkCopied } })` |
| `Name` | the label of the name field in the dialogs of `DS.views` (the system's string `viewNameLabel`) | `DS.core.config({ strings: { viewNameLabel } })` |
| `Save as a new view` | the title of the dialog of `DS.views` that names a new view (the system's string `viewNewTitle`) | `DS.core.config({ strings: { viewNewTitle } })` |
| `Rename view` | the title of the dialog of `DS.views` that renames a view (the system's string `viewRenameTitle`) | `DS.core.config({ strings: { viewRenameTitle } })` |
| `Save` | the confirm button of those two dialogs (the system's string `viewSave`) | `DS.core.config({ strings: { viewSave } })` |
| `Link to this view` | the title and field label of the dialog of `DS.views` that shows the link when the clipboard is refused (the system's string `viewLinkTitle`) | `DS.core.config({ strings: { viewLinkTitle } })` |
| `Delete “{name}”?` | the title of the dialog of `DS.views` that asks before deleting a view (the system's string `viewDeleteTitle`) | `DS.core.config({ strings: { viewDeleteTitle } })` |
| `The view goes from this browser. The list and its data stay as they are.` | the text of that dialog (the system's string `viewDeleteText`) | `DS.core.config({ strings: { viewDeleteText } })` |
| `Delete view` | its confirm button, in the error tone (D10) (the system's string `viewDeleteConfirm`) | `DS.core.config({ strings: { viewDeleteConfirm } })` |
| `Moved to position ${index} of ${count}` | what a keyboard or pointer move of `DS.motion.sortable()` announces | `DS.motion.sortable(list, { announce: (index, count) => text })` |

A test fails on a quoted UI string in `src/js/` without an option and a row here. Numbers and dates follow
the locale of `DS.core.config()` (`lang` on `<html>` by default): `DS.format` ([core.md](core.md#dsformat-numbers-dates-and-the-shared-clock))
formats figures, sizes, durations, lists, plurals and relative time through `Intl`, and nothing else in the system
| `More options for {label}` | the name of a split button's menu toggle without one of its own, `{label}` the action's name (the system's string `moreOptionsFor`) | `DS.core.config({ strings: { moreOptionsFor } })` |
| `More actions` | the name and tooltip of the More button of a priority action bar (the system's string `moreActions`) | `DS.core.config({ strings: { moreActions } })` |
| `Copying is blocked here. The text is selected: press {keys} to copy it.` | what `DS.copy` announces when the browser refuses both ways of copying, `{keys}` the platform's copy keys (the system's string `copyManual`) | `DS.core.config({ strings: { copyManual } })` |
formats either by itself (`countUp(el, value, { format: DS.format.number })` for a figure that counts).

**Direction.** The components are laid out for left-to-right scripts; `dir="rtl"` is not supported yet (a sheet
still slides in from the right, the drawer sits on the left, motion does not mirror). The components use logical
properties (`margin-inline-start`, `inset-inline`, `text-align: start`) wherever the browser baseline has them, so a
later version can add right-to-left without breaking a theme. What stays physical is a short list with reasons, kept
by a test: script and pointer coordinates (menus, tooltips, snackbars, ripples, the gliding indicator), gradient
directions (fades, progress, slider), the select arrow, the safe-area insets, and the sheet, modal drawer and switch
handle that move from one side.

## Fonts

`fonts/fonts.css` self-hosts Google Sans (variable weight 400-700 with the optical size axis) with relative URLs, so
the folder can live anywhere. It is optional: without it `--ds-font` falls back to Roboto, Segoe UI or the system UI
font. Preload the latin file for a faster first paint:

```html
<link rel="preload" href="vendor/dashboard-style/fonts/google-sans-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
```

Keep `OFL.txt` next to the font files and do not rename or re-subset them. To use another typeface, set `--ds-font`
in your theme and skip `fonts.css`.

In a widget that lives in a shadow root, link `fonts.css` in the host document: Chromium and Firefox ignore
`@font-face` inside a shadow root (see theming.md, "Embedded in someone else's page").

## Tokens as data

`tokens.json` lists every `--ds-*` name of the copy, generated by the build from `tokens.css`, the hooks table of
[theming.md](theming.md#component-hooks) and the stylesheets (a test keeps the three in step), so editors, linters and
your own checks need not parse CSS:

```json
{
  "version": "2.0.0",
  "tokens": [
    { "name": "--ds-btn-height", "layer": "hook", "default": "40px", "type": "length", "themeable": true, "component": "button" },
    { "name": "--ds-primary", "layer": "role", "default": "#0b57d0", "type": "color", "themeable": true }
  ]
}
```

- `layer`: `scale` (layer 1, the same in every theme), `role` (layer 2), `hook` (layer 3), `motion-hook` (a
  per-element motion setting), `runtime` (written by a script or the page) or `internal` (set by a component on
  itself; read it, never set it).
- `default`: the declared value (scales, roles), the component's fallback (hooks) or the registered initial value;
  `null` where there is none. `type`: `color`, `length`, `font`, `duration`, `easing`, `number`, `shadow` or
  `other`.
- `themeable`: `true` for roles and hooks only: a theme sets nothing else.
- `component` (hooks): the stylesheet that reads it. `deprecated` (when present): the version that deprecated the
  name; `deprecations.json` has the replacement, and removed names are not listed.

## Check a project

`tools/check-project.mjs` runs the project rules of AGENTS.md ("Using Dashboard-Style in a project") on your code,
without dependencies (Node 18 or later). Describe the project once in `ds-check.json` (paths and globs relative to
it; globs know `*`, `**` and `?`):

```json
{
  "prefix": "app",
  "css": ["css/**/*.css"],
  "js": ["js/**/*.js"],
  "html": ["*.html", "templates/**/*.html"],
  "themes": ["css/theme.css"],
  "themesWith": ["vendor/dashboard-style/themes/dark.css"],
  "vendor": "vendor/dashboard-style",
  "exceptions": [
    { "rule": "restyle", "file": "css/app.css", "selector": ".app-bar .ds-btn", "reason": "the bar is dark; no hook for it yet" }
  ]
}
```

```sh
node vendor/dashboard-style/tools/check-project.mjs --config ds-check.json
```

It prints `<file>:<line> <rule> <message>` per finding (warnings say so) and exits 1 on an error, 2 on a broken
configuration. An exception silences one rule for a file (a path or a glob) and, when it names one, a selector; its
`reason` is required. `themesWith` (optional) names the shipped themes your theme is used with; the `themes` rule passes
them to `check-theme.mjs --with`.

| Rule | Level | What |
|---|---|---|
| `vendor` | error | the copy verifies against its `SHA256SUMS` ("Verify a copy") |
| `classes` | error | every `ds-` class in markup (`class="..."` in pages and template strings), in selectors of scripts and stylesheets and in `classList` calls exists in `ds.css`; a page that links single stylesheets (`css/components/*.css`) links one that defines it: a file whose rules style the class itself, not one that only places it inside another component (`.ds-alert .ds-btn` in `alert.css`); `.ds-theme` needs `css/core/tokens.css`; the `.min.css` of a stylesheet counts as the stylesheet |
| `deprecated` | error, warning | a name of `deprecations.json`: removed names fail, deprecated ones warn |
| `literals` | error | a colour, radius, font, shadow, duration or curve literal in a rule of your prefix (`.app-*`): read tokens (`--ds-*`, `--app-*`). `linear` is the curve of the system's loops and has no token: it passes on a `--ds-loop-*` duration (`animation: ds-spin var(--ds-loop-spin) linear infinite`), as do a zero duration (`0s`) and its curve |
| `keyframes` | error | an own `@keyframes`, or an animation that names anything but a `ds-*` keyframe of the copy |
| `themes` | error, warning | the theme files, through `tools/check-theme.mjs` |
| `layers` | error | an element-only rule (`button`, `body`, `*`) outside a layer, which beats every component (put resets in `@layer reset` declared before ds), and `!important` |
| `hidden` | error | a `[hidden]` rule: `ds.css` hides `[hidden]` already |
| `restyle` | error | a project rule that reaches a `.ds-*` element (`.ds-btn`, `.app-bar .ds-btn`, `.ds-card p`) and sets anything but `--ds-*` hooks and placement (margins and scroll margins, grid and flex placement, position and offsets, sizes, `z-index`); `.ds-theme`, `.ds-base` and `.ds-touch` are scopes, not components, so a rule under them reaches nothing through them |
| `attributes` | error | a script that writes an attribute the system owns (the "Attributes" table of [components.md](components.md#attributes)); `data-toast-reserve` only next to `reserve: false`. A write that `deprecations.json` lists, such as the 1.x hand `data-scrolled` recipe, is reported by `deprecated` instead (a warning in 2.x) |
| `dom` | warning | `innerHTML` with ds markup: re-render with `DS.dom.morphHtml` |
| `pressable` | warning | a `::before` state layer of your own (`currentColor` or a `--ds-state-*` opacity): `.ds-pressable` gives a project element the system's hover, press and focus |

The nightly template runs it as its optional `CHECK` step.

## Updating

1. Read [CHANGELOG.md](../CHANGELOG.md) since the version in your `VERSION` file. Versions follow semver: a minor
   version adds tokens, classes or hooks or deprecates one; a renamed name keeps working under its old name until a
   later major version removes it. The number does not hold anything back: `main` is what you get. Coming from
   1.x, work through the "Migration" table of [2.0.0](../CHANGELOG.md#200) first.
2. Vendor again over the old copy (`vendor.sh vendor/dashboard-style` fetches the latest `main`); the CDN's `@main`
   URLs update by themselves.
3. Open your pages and the styleguide with your theme loaded; run your tests (including the checksum check).

### Automatic updates (GitHub Actions)

[templates/update-dashboard-style.yml](../templates/update-dashboard-style.yml) does step 2 every night. Copy it to
`.github/workflows/` and set three values under `env`:

| Value | Meaning |
|---|---|
| `DEST` | path of the copy, e.g. `vendor/dashboard-style` |
| `SETUP` | the toolchain your checks need: `node` (set up when the repository has a `package.json`, or for `CHECK`), `go` (when it has a `go.mod`) or `none`; another one is a commented step to fill in |
| `CHECK` | optional project check of the new copy, e.g. `node "$DEST/tools/check-project.mjs" --config ds-check.json`; empty to skip |
| `VERIFY` | command that must pass before the update is committed (`npm ci && npm test`); empty to skip |
| `BUILD_WORKFLOW` | workflow file that builds and deploys, started with `workflow_dispatch`; empty if your build starts on push by itself (Cloudflare Pages, Netlify, Vercel) |

It runs daily at 02:30 UTC and on demand (*Run workflow*). If the commit in `DEST/VERSION` equals `main` of
Dashboard-Style, the run ends there. Otherwise it vendors `main`, verifies the copy (`tools/verify.sh`, no Node
needed), runs `CHECK` and `VERIFY`, commits the copy to the branch it runs on and starts `BUILD_WORKFLOW`. A push made with `GITHUB_TOKEN` starts no other workflow, which is why the build is
started explicitly; the build workflow needs `on: workflow_dispatch`. The template asks for `contents: write` and
`actions: write`; a branch protection rule that blocks direct pushes also blocks the update.

#### When the update fails

- **Check**: the project check found a removed name, a restyled component or another rule broken by the new copy
  (its output names file, line and rule); fix the project as for **Verify**.
- **Compare** or **Vendor main**: a network or GitHub API problem; run it again.
- **Verify**: nothing was committed and the site keeps the old copy. Reproduce it locally (vendor `main` as in step 2,
  then run `VERIFY`), look in [CHANGELOG.md](../CHANGELOG.md) for deprecations and removals, check your code against
  the copy's `deprecations.json` (below; `tools/check-project.mjs`, rule `deprecated`, finds those names in your
  code), and commit the new copy together with your fix. A major version has a "Migration" section at the top of its
  changelog entry (for 2.0: `## 2.0.0`, "Migration") with what a project has to change. If the fault is in
  Dashboard-Style, fix it there; the next run picks it up.
- **Commit and push**: usually branch protection (above).

Afterwards start it again under Actions → "Update Dashboard-Style" → *Run workflow*, or wait for the next night.

### Deprecated and removed names

`deprecations.json` in the copy lists every name that a version deprecated or removed, so a project test can read it
instead of keeping a list by hand:

```json
{
  "version": "<the copy's version>",
  "names": [
    {
      "kind": "class",
      "name": ".ds-view--leaving",
      "pattern": "(?<![\\w-])ds-view--leaving(?![\\w-])",
      "replacement": "DS.motion.transition()",
      "deprecated": "2.0.0",
      "removed": null,
      "note": "…"
    }
  ]
}
```

- `kind`: `token`, `role`, `hook`, `class`, `attribute`, `markup`, `keyframes`, `export` or `option` (an argument
  form or a variant string).
- `pattern`: the source of a JavaScript regular expression (no flags) that finds a use in CSS, HTML or JS; `null` for
  an entry that only a `note` can describe. Some patterns cast a wide net (`detach()`): treat a hit as a place to look.
- `deprecated`: the version that deprecated it. `removed`: the version that removed it, or `null` while it still
  works (a later major version removes it).
- `replacement` and `note` (optional): what to use instead and how; `replacement` may be `null` when nothing replaces
  it.

A project check fails on every entry with `removed` set and warns on the others, so a new deprecation never turns the
nightly update red:

```js
import { readFileSync } from 'node:fs';
const { names } = JSON.parse(readFileSync('vendor/dashboard-style/deprecations.json', 'utf8'));
for (const entry of names.filter((name) => name.pattern)) {
  if (new RegExp(entry.pattern).test(source)) (entry.removed ? errors : warnings).push(`${entry.name}: ${entry.replacement ?? entry.note}`);
}
```
