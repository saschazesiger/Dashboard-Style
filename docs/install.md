# Install and update

Everything a project needs is in `dist/`:

| Path | What |
|---|---|
| `ds.css` | all stylesheets in cascade order (tokens, motion, base, components), in `@layer ds.*` (see "Cascade layers and resets") |
| `ds.js` | classic script, sets `window.DS = { version, motion, indicator, dom, ripple, icons, overlay }` (see "Two copies on one page") |
| `css/` | the single stylesheets (`tokens.css`, `motion.css`, `base.css`, `components/*.css`, `index.css`) |
| `css/properties.css` | every `@property` registration of `ds.css` alone (generated; registers `--ds-*` custom properties and styles nothing). A widget that loads `ds.css` inside a shadow root links it in the host document too: `@property` applies only in document-level stylesheets (as does `@font-face` in Chromium and Firefox, so such a widget also links `fonts/fonts.css` in the host document; see theming.md, "Embedded in someone else's page") |
| `css/optional/` | opt-in stylesheets that `ds.css` never includes: `view-transitions.css` (View Transitions across page loads, needs `<html class="ds-theme">`; see "Multi-page apps") |
| `js/` | the ES modules (`motion.js`, `indicator.js`, `dom.js`, `ripple.js`, `icons.js`, `overlay.js`), each with its types next to it (`motion.d.ts` ...), which an `import` of the module finds by itself |
| `ds.d.ts` | types of `ds.js`: the global `DS` (every module's exports, their options and handles) and `DashboardStyle.versions` (see "Types") |
| `fonts/` | Google Sans woff2 (latin, latin-ext), `fonts.css`, `OFL.txt` |
| `deprecations.json` | every deprecated and removed name as data, for a project's own checks (see "Deprecated and removed names") |
| `LICENSE` | the MIT notice; keep it with the copy |
| `SHA256SUMS` | checksums of every file |
| `themes/` | the shipped themes `dark.css`, `compact.css` and `contrast.css`, loaded after your theme ([theming.md](theming.md#dark-compact-and-contrast)) |
| `tools/` | dependency-free checks for a project: `verify.mjs` and `verify.sh` (the copy against `SHA256SUMS`, see "Verify a copy"), `check-theme.mjs` (a theme file, see theming.md, "Checking a theme"), `check-project.mjs` (the project rules, see "Check a project"), and the modules they share: `theme-rules.mjs` (the contrast pairs and motion prefixes) and `css-scan.mjs` (a small CSS reader) |
| `tokens.json` | every `--ds-*` name as data: `{ version, tokens: [{ name, layer, default, type, themeable, component?, deprecated? }] }` (see "Tokens as data") |

Browsers: Safari 16.4, Chrome and Edge 111, Firefox 128 (ESR) and later. Newer features are refinements that the
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
only add to them), so a service worker that precaches them by name keeps working after an update. Only
`fonts/fonts.css` refers to other files of the copy, with relative `url()`s; no other file depends on where the copy
lives.

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
import { createIndicator } from './vendor/dashboard-style/js/indicator.js';
import { icon, check } from './vendor/dashboard-style/js/icons.js';
```

```css
@import './vendor/dashboard-style/css/index.css';   /* everything, or pick files: */
@import './vendor/dashboard-style/css/tokens.css';
@import './vendor/dashboard-style/css/motion.css';
@import './vendor/dashboard-style/css/components/utilities.css';
@import './vendor/dashboard-style/css/components/button.css';
@import './vendor/dashboard-style/css/components/ripple.css';   /* with DS.ripple */
```

When you pick files, keep the order of `css/index.css` and always include `tokens.css`, `motion.css` (components
name the keyframes in it) and `components/utilities.css` (border-box sizing inside `.ds-theme`, `.ds-sr`). Add
`components/ripple.css` whenever you call `DS.ripple.attach()`: without it the ripple span sits in the flow and
widens the pressed control. With Node subpath imports, `"imports": { "#ds/*": "./vendor/dashboard-style/*" }` in
`package.json` lets both the bundler and Node tests write `#ds/js/motion.js`.

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

An indicator glides across the load only with a `name` (`createIndicator(list, { ..., name: 'nav' })`, unique on the
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
  <script src="app.js"></script>               <!-- createIndicator(list, { ..., name: 'nav' }) -->
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
`styleguide/styleguide.js`).

A page with or without the drawer morphs the panel on page loads too, over `--ds-dur-slow` (within a page,
`DS.motion.transition()` sees the width change and takes `--ds-dur-long`; a page load cannot tell).

Back and forward through the history can move on the shared axis instead of fading through; the file's header holds
the `pagereveal` snippet that sets `data-ds-vt` from `navigation.activation`.

## Two copies on one page

A host page and an embedded widget may each load their own `ds.js`. Every copy registers itself in
`window.DashboardStyle.versions['<version>']`; `window.DS` is set only when it is absent or holds the same version,
so the first copy keeps it. A second copy of the same version does nothing. A copy of another version leaves
`window.DS` alone and logs one warning naming both versions; a `window.DS` that is not Dashboard-Style (no
`version` string) is never touched either. Code that must run on its own copy reads it by version:

```js
const ds = window.DashboardStyle.versions['1.0.0'] || window.DS;
```

From 1.6.1 on, the copies share the overlay state that belongs to the page (the Escape stack, the scroll lock, the
numbering of anchor names and tooltip ids, the tooltip roots) through `document[Symbol.for('ds.overlay')]`; see
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
| `Moved to position ${index} of ${count}` | what a keyboard or pointer move of `DS.motion.sortable()` announces | `DS.motion.sortable(list, { announce: (index, count) => text })` |

A test fails on a quoted UI string in `src/js/` without an option and a row here. Numbers and dates are the page's
too: set `lang` on `<html>` (or the widget root), format figures with `countUp(el, value, { format: new
Intl.NumberFormat(lang).format })`, and dates with `Intl.DateTimeFormat(lang, ...)`; the system never formats either
by itself.

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
    { "name": "--ds-btn-height", "layer": "hook", "default": "36px", "type": "length", "themeable": true, "component": "button" },
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
| `classes` | error | every `ds-` class in markup (`class="..."` in pages and template strings), in selectors of scripts and stylesheets and in `classList` calls exists in `ds.css`; a page that links single stylesheets (`css/components/*.css`) links the one that defines it |
| `deprecated` | error, warning | a name of `deprecations.json`: removed names fail, deprecated ones warn |
| `literals` | error | a colour, radius, font, shadow, duration or curve literal in a rule of your prefix (`.app-*`): read tokens (`--ds-*`, `--app-*`) |
| `keyframes` | error | an own `@keyframes`, or an animation that names anything but a `ds-*` keyframe of the copy |
| `themes` | error, warning | the theme files, through `tools/check-theme.mjs` |
| `layers` | error | an element-only rule (`button`, `body`, `*`) outside a layer, which beats every component (put resets in `@layer reset` declared before ds), and `!important` |
| `hidden` | error | a `[hidden]` rule: `ds.css` hides `[hidden]` already |
| `restyle` | error | a project rule that reaches a `.ds-*` element (`.ds-btn`, `.app-bar .ds-btn`, `.ds-card p`) and sets anything but `--ds-*` hooks and placement (margins and scroll margins, grid and flex placement, position and offsets, sizes, `z-index`); `.ds-theme`, `.ds-base` and `.ds-touch` are scopes, not components, so a rule under them reaches nothing through them |
| `attributes` | error | a script that writes an attribute the system owns (the "Attributes" table of [components.md](components.md#attributes)); `data-toast-reserve` only next to `reserve: false` |
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
