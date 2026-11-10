<div align="center">

# 🎛️ Dashboard-Style

**Calm, themeable admin dashboards in the Material 3 / Google console style.**<br>
White panels on a tinted backdrop, hairlines instead of shadows, pill-shaped actions and motion that feels right.

[![Live tour](https://img.shields.io/badge/%E2%96%B6%20live%20tour-try%20it%20in%20your%20browser-0b57d0?style=for-the-badge)](https://saschazesiger.github.io/Dashboard-Style/)

![License: MIT](https://img.shields.io/badge/license-MIT-146c2e)
![Dependencies: 0](https://img.shields.io/badge/dependencies-0-146c2e)
![Build step: none](https://img.shields.io/badge/build%20step-none-146c2e)
![Components: 143](https://img.shields.io/badge/components-143-6750a4)
![Icons: 276](https://img.shields.io/badge/icons-276-6750a4)

[🚀 Live tour](https://saschazesiger.github.io/Dashboard-Style/) ·
[🖥️ Reference app](https://saschazesiger.github.io/Dashboard-Style/example/) ·
[🧩 Styleguide](https://saschazesiger.github.io/Dashboard-Style/styleguide/index.html) ·
[🎬 Motion Lab](https://saschazesiger.github.io/Dashboard-Style/styleguide/motion.html) ·
[📚 Docs](#-documentation)

<a href="https://saschazesiger.github.io/Dashboard-Style/"><img src="docs/images/tour.png" alt="The live tour of Dashboard-Style: a hero on the accent colour, four tiles with key figures and the navigation drawer" width="900"></a>

</div>

## ✨ Why Dashboard-Style?

| | |
|---|---|
| 🪶 **Plain CSS, tiny JS** | One stylesheet and one optional, dependency-free script. No framework, no bundler, no build step. |
| 🎨 **Themeable from one file** | Every colour, radius, font and shadow is a `--ds-*` token. A project theme overrides tokens; it never touches components. |
| ♿ **Accessible by default** | WCAG AA text contrast, a focus ring that is there from the first frame, forced colours (Windows contrast themes), status never by colour alone. |
| 🌊 **Motion that feels right** | One spring for everything that floats, ripples from your pointer, overlays that turn around mid-way, rows that glide when data changes. |
| 🧳 **Embeddable** | Tokens live on `.ds-theme`, not `:root`, and every rule sits in `@layer ds.*`, so the system runs inside someone else's page and the page's own CSS always wins. |
| 🔒 **Safe to vendor** | A checksummed copy of `dist/` in your project, updated by a nightly workflow. |

## 👀 See it in action

> 💡 Everything below is live on the [**tour page**](https://saschazesiger.github.io/Dashboard-Style/). Switch the top bar to
> **Slow motion** there to watch every animation at a fifth of its speed.

**Overlays** open from where you pressed and close back there: a side sheet that steps between records, a dialog that
grows from its button.

<img src="docs/images/overlays.gif" alt="A side sheet slides in, steps to the next device and closes; then a confirm dialog grows from its button and closes" width="800">

**Live data** glides: tiles count on from what they show, sorted rows travel to their new place, status chips fade
to their new colour.

<img src="docs/images/live-data.gif" alt="A device table is sorted by name, status and load; the rows glide to their new places" width="800">

**One theme file** restyles everything: accent, shape and density are just tokens.

<img src="docs/images/themes.gif" alt="The same page in blue, teal, violet with square corners, and green in the compact density" width="800">

<table>
<tr>
<td width="50%"><a href="https://saschazesiger.github.io/Dashboard-Style/example/"><img src="docs/images/reference-app.png" alt="The reference app: an overview with alerts, four tiles, a sync card and a chart"></a><br>🖥️ <b>Reference app</b>: a device console built the way a project uses the system.</td>
<td width="50%"><a href="https://saschazesiger.github.io/Dashboard-Style/example/#/devices"><img src="docs/images/object-page.png" alt="A device of the reference app as an object page: key facts, sections and the jump links"></a><br>📋 <b>Data grids and object pages</b>: saved views, filter chips, sorting, bulk selection, a record with its sections.</td>
</tr>
<tr>
<td><a href="https://saschazesiger.github.io/Dashboard-Style/styleguide/index.html"><img src="docs/images/styleguide.png" alt="The styleguide: the page of the button with its options panel (size, density, shape, tone, variant, colour scheme, theme preset and file, width, contrast, touch) above its demo"></a><br>🧩 <b>Styleguide</b>: every component, token and icon, with a theme switcher.</td>
<td><a href="https://saschazesiger.github.io/Dashboard-Style/styleguide/motion.html"><img src="docs/images/motion-lab.png" alt="The Motion Lab: the spring curve plotted as the browser plays it, and three boxes on one spring"></a><br>🎬 <b>Motion Lab</b>: every curve sampled from your browser, every choreography replayable.</td>
</tr>
<tr>
<td><a href="https://saschazesiger.github.io/Dashboard-Style/#choose"><img src="docs/images/controls.png" alt="Switches, checkboxes with a parent in the indeterminate state, filter chips and radio cards"></a><br>✅ <b>Controls</b>: checks that draw themselves, switches on a spring, chips that make room.</td>
<td><a href="https://saschazesiger.github.io/Dashboard-Style/#icons"><img src="docs/images/icons.png" alt="A grid of the outline icons with their names"></a><br>🖼️ <b>276 icons</b>: one outline set on a 24px grid, in <code>DS.icons</code>.</td>
</tr>
</table>

📱 **Phones included**: the drawer turns modal at 900px, forms drop to one column, fields keep 16px text.

<p>
<img src="docs/images/phone-app.png" alt="The reference app on a phone" width="260">
&nbsp;&nbsp;
<img src="docs/images/phone-tour.png" alt="The live tour on a phone" width="260">
</p>

MIT licensed. The bundled Google Sans font is under the SIL Open Font License 1.1; the icon shapes come from Lucide
(ISC) and Feather (MIT), see [LICENSE](LICENSE). Light by default; dark, compact and high-contrast themes ship with it
([Theming](#-theming)).

## ⚡ Quick start

Copy `dist/` into your project (or use the CDN, see below) and write:

```html
<!doctype html>
<html lang="en" class="ds-theme ds-base">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Devices</title>
  <link rel="stylesheet" href="dist/fonts/fonts.css">
  <link rel="stylesheet" href="dist/ds.css">
</head>
<body>
  <div class="ds-content"><div class="ds-page">
    <header class="ds-page-head"><h1 class="ds-page-head__title">Devices</h1></header>
    <section class="ds-card">
      <h2 class="ds-card__title">Inventory</h2>
      <p class="ds-muted">128 devices, 3 need attention.</p>
      <button class="ds-btn ds-btn--filled" type="button">Add device</button>
    </section>
  </div></div>
  <script src="dist/ds.js"></script>
  <script>
    DS.icons.fill(document);      // the glyphs of every data-icon
    DS.init(document);            // the behaviours of every data-ds-* attribute, and of what you add later
    DS.ripple.attach(document);   // the pointer ripple and the action guard
  </script>
</body>
</html>
```

- 🎨 `ds-theme` turns the tokens on, `ds-base` (optional) styles the page itself: backdrop, body text, links, focus.
- 🧠 `ds.js` brings the behaviours: `DS.init(document)` starts every `data-ds-*` behaviour on the page (a
  `data-ds-open` button opens its dialog, `data-ds-datagrid` sorts and selects, `data-ds-combobox` filters) and keeps
  watching for markup you add later ([docs/core.md](docs/core.md)). Without it the styles still apply, and a page
  wires its own scripts and opens overlays through `DS.overlay` ([docs/components.md](docs/components.md)). For
  production, load only what a page uses: `ds.min.css` and `ds.min.js`, or a project bundle
  ([docs/bundle.md](docs/bundle.md)).
- 🖥️ For a whole app (navigation, tables with live data, overlays, forms, a project theme and project components),
  read the reference app in [`example/`](example/README.md): its README maps every pattern to its code.
- 🚀 The live tour in [`demo/`](demo/index.html) shows one working demo of every behaviour, wired as a project wires it.
- 🧩 Open [`styleguide/index.html`](styleguide/index.html) in a browser (works from disk) to see every component, the
  tokens and the icons, and to try a theme file. Its Motion Lab, [`styleguide/motion.html`](styleguide/motion.html),
  plots every curve as your browser plays it, lines up the durations and replays every choreography, with rapid
  toggles and reversals; the speed select in the top bar slows it all down to 0.1×.

## 📦 Install

**🔒 Vendor a copy (recommended).** The script copies `dist/` of the latest `main` into your project and writes
`VERSION` (with the exact commit) and `SHA256SUMS` next to it, so a test or CI step can prove nobody edited the copy.
To update, run it again.

```sh
curl -fsSLO https://raw.githubusercontent.com/saschazesiger/Dashboard-Style/main/scripts/vendor.sh
sh vendor.sh vendor/dashboard-style             # copy the latest main (or: vendor.sh <ref> <dest>)
sh vendor.sh --check vendor/dashboard-style     # verify (exit 1 if anything changed)
```

Windows PowerShell: `scripts/vendor.ps1` with the same arguments (`-From`, `-Check`). A nightly GitHub Actions
workflow that keeps the copy on `main` is in [`templates/`](templates/update-dashboard-style.yml).

**🌍 CDN.** jsDelivr serves the repository (`@main`, or a commit hash to pin):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/ds.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/fonts/fonts.css">
<script src="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/ds.js"></script>
```

**🧰 Bundlers.** `dist/css/` and `dist/js/` hold the single stylesheets and ES modules (with their `.d.ts` types);
import only what you need. Details, updates and integrity checks: [docs/install.md](docs/install.md).

**⚛️ React.** `dist/react/` is an optional adapter (React 18 or later, your own): typed components that render the
documented markup and run the system's behaviours, StrictMode-safe, one module per component: [docs/react.md](docs/react.md).

**🔍 Checks.** `dist/tools/` runs without network or dependencies: `verify.mjs` (or `verify.sh`) checks a copy against
its `SHA256SUMS`, `check-theme.mjs` a theme file (`light-dark()` themes in both schemes), `check-project.mjs` your code
against the project rules (deprecated and removed names from `dist/deprecations.json` included), `theme.mjs` writes a
theme from one seed colour ([docs/theme-generator.md](docs/theme-generator.md)), `bundle.mjs` a project bundle
([docs/bundle.md](docs/bundle.md)), `migrate.mjs` moves a 2.x project to 3.0 ([docs/migration.md](docs/migration.md)).

**⬆️ From 2.x to 3.0.** `node <copy>/tools/migrate.mjs --config ds-check.json` shows a diff of every renamed class,
hook, token, attribute and call it can rewrite and lists what needs a person; `--write` applies it. The guide, with
every removed name and what to check by hand: [docs/migration.md](docs/migration.md).

**⬆️ From 1.x to 2.0.** 2.0.0 removes the names deprecated in 1.x and changes a few defaults. Work through the
"Migration" table of [2.0.0 in the changelog](CHANGELOG.md#200), then run `tools/check-project.mjs`
([docs/install.md](docs/install.md), "Updating").

## 🎨 Theming

Load a theme after `ds.css` and override tokens on the same `.ds-theme` selector:

```css
.ds-theme {
  --ds-primary: #006a6a;
  --ds-accent: #cce8e7;
  --ds-on-accent: #002020;
  --ds-inverse-primary: #4cdada;
  --ds-font: 'Inter', system-ui, sans-serif;
}
```

[`themes/example.css`](themes/example.css) is a template listing every role. Guide: [docs/theming.md](docs/theming.md).
Shipped themes in `dist/themes/`: `dark.css` (for `prefers-color-scheme: dark`), `compact.css` and `contrast.css` (for
`prefers-contrast: more`). `node dist/tools/check-theme.mjs theme.css` checks a theme file.
Want to play first? The [**Theme it**](https://saschazesiger.github.io/Dashboard-Style/#theme) stop of the tour builds
a theme file from a few clicks and lets you copy it.

## 🧩 What's inside

| | |
|---|---|
| 🏗️ **Frame** | top bar (actions, search, title), navigation drawer (modal on phones, groups, counts, a rail) with a sliding pill, account capsule, avatars, a message for the whole app, segmented switch, tabs, steps, one scrolling content panel, a sign-in page |
| 🃏 **Content** | page head with breadcrumbs and a way back, cards (also interactive and selectable), tiles, row lists, key-value lists and facts, disclosures, a timeline, task lists, prose and code blocks, empty states |
| 🚦 **Status** | status chips, tags, badges, alerts, error lists, snackbars (with Undo), tooltips |
| 📊 **Data** | tables with sorting, selection and a bulk selection bar, expandable, stacked and full-page rows, a pinned first column, pagination, sideways scrollers; meters, columns and legends; progress (linear and round), loaders, skeletons |
| 📝 **Input** | buttons (busy and done faces, icon swaps), fields (input groups, counters, changed fields), selects, checkboxes, radio cards, switches (also locked), filter, action and input chips, combobox (also select-only), search, slider, a growing composer, file fields and drop zones, rows to reorder |
| 🪟 **Overlays** | dialogs (also full screen and as an action sheet, with built-in `confirm()`, `alert()` and `prompt()`), side sheets, menus, a save bar, through `DS.overlay` (focus, Escape, scroll lock, stacking, busy overlays that stay open) |
| 🌊 **Motion** | `DS.motion` (`flip`, `countUp`, `busy`, `transition`, `refresh`, `sortable`, `crossfade` ...), `DS.indicator`, `DS.dom` (`morphHtml`, `watchScrolled`, `scrollEdges`, `roving`, `progress` ...), `DS.ripple` with the action guard |
| 🖼️ **Icons** | 276 outline glyphs in `DS.icons` |
| 🎨 **Themes and tools** | dark, compact and contrast themes; `dist/tools/` checks a copy, a theme and a project; `tokens.json`, `deprecations.json` and TypeScript types |

Which component fits which need: the table at the top of [docs/components.md](docs/components.md).

## 📚 Documentation

| Topic | |
|---|---|
| 📦 [Install and update](docs/install.md) | vendoring, CDN, bundlers, fonts, verifying a copy, checking a project, language and locale |
| ⬆️ [Migration](docs/migration.md) | from 2.x to 3.0: `tools/migrate.mjs`, every renamed and removed name, what to check by hand |
| ⚙️ [Core](docs/core.md) | `DS.init()`, the behaviour registry, the one runtime per page, `ds:` events, strings and locale |
| ⚛️ [React](docs/react.md) | the React adapter: `<DSProvider>`, typed components for every behaviour, what survives a re-render, what it does not do |
| ✂️ [Bundle](docs/bundle.md) | loading only what a page uses: the bundle tool, its scan, the safelist, `--check` in CI, the Vite plugin |
| 🎚️ [Tokens](docs/tokens.md) | the three layers and every token (the motion scales in [Motion](docs/motion.md#tokens)) |
| 📏 [Options](docs/options.md) | size, density, shape, tone and touch as classes on any element, and how a component computes them |
| 🎨 [Theming](docs/theming.md) | writing a project theme, component hooks |
| 🌈 [Theme generator](docs/theme-generator.md) | one seed colour to a checked theme for both schemes (`tools/theme.mjs`), and the generated presets |
| 🧩 [Components](docs/components.md) | which component for which need, copy-paste markup for every component |
| 🗺️ [Patterns](docs/patterns.md) | page types and flows (list, record, settings, create, delete with undo, bulk actions ...) built from the components |
| 🌊 [Motion](docs/motion.md) | principles, motion tokens, rules, the choreography of every component, interruption, keyframes and utilities, `DS.motion` (FLIP, `countUp`, `transition`), indicator, morph, ripple, overlays, recipes, view transitions, scroll-driven effects |
| 🖼️ [Icons](docs/icons.md) | the outline set and its helpers |
| 📐 [Rules](docs/rules.md) | the design rules the components follow, and the accessibility statement (WCAG 2.2 AA) |

## 🗂️ Files

```
dist/            what you ship (built, committed): ds.css, ds.min.css, ds.js, ds.min.js, ds.d.ts, css/ (core/, components/, optional/, properties.css; a .min.css next to each), js/, react/ (the optional React adapter), fonts/, themes/ (presets/ too), tools/, manifest.json, tokens.json, deprecations.json, LICENSE, SHA256SUMS
src/             sources: core/ (tokens.css, options.css, motion.css, base.css, global.css), components/<name>/ (<name>.css, meta.json, <name>.md, <name>.demo.js), optional/*.css, js/ (core.js first, the other modules, <module>.requires.json), types/ (ds.d.ts, js/*.d.ts), react/ (the React adapter), patterns/ (the page patterns, copy-ready pages; not in dist/), deprecations.json, index.css (generated)
fonts/           Google Sans (latin, latin-ext) with fonts.css and OFL.txt
themes/          example.css, the theme template; dark.css, compact.css, contrast.css, the shipped themes; presets/, generated by tools/theme.mjs
demo/            the live tour: one page that demonstrates every behaviour (the start page on GitHub Pages)
example/         the reference app: a device console on top of dist/, as a project builds one (published on GitHub Pages)
styleguide/      living styleguide (open index.html; motion.html: the Motion Lab; views.html: view transitions and scrolling)
scripts/         build.mjs, gen-meta.mjs, motion-curves.mjs, vendor.sh, vendor.ps1, site.sh (assembles the GitHub Pages site); tools/: the sources of dist/tools/
templates/       update-dashboard-style.yml, a GitHub Actions workflow that keeps a copy on main
test/            node --test unit tests (npm ci once, for lightningcss); test/browser/ Playwright tests (three engines)
docs/            the documentation above (docs/images/: the pictures of this README)
AGENTS.md        how to work on the system (CLAUDE.md points to it)
```

## 🌐 Browser support

Safari 17.5, Chrome and Edge 123, Firefox 130 and later. Everything in `src/` may run in an embedded widget on such
a browser, so the CSS uses `:focus-visible`, `:has()`, `inset`, container size queries, `color-mix()`, `oklch()`,
`light-dark()`, `svh`/`dvh`, `<dialog>`, `inert`, `@layer`, `@property`, the individual `translate`/`scale`/`rotate`,
`linear()`, `@starting-style`, `transition-behavior: allow-discrete`, `popover`, `details[name]`,
`text-wrap: balance`, `:user-invalid` and subgrid directly, but no CSS nesting; the JS is ES2022.

Newer features are refinements only, behind a feature query where it matters, and each file names them under
"Progressive:" in its header with its fallback: relative colour syntax, anchor positioning, View Transitions,
scroll-driven animations, `interpolate-size`, `::details-content`, `field-sizing`, `text-wrap: pretty`, style queries,
`@scope`, `closedby`, invoker commands, `appearance: base-select`, `moveBefore()`, the Navigation API, iterator
helpers, `sibling-index()`, `overflow-clip-margin`, `scrollbar-gutter`, `focus({ focusVisible: false })`, plus
`scrollbar-color`. Older browsers get the same page without the refinement (a disclosure that toggles instead of
gliding, a tooltip placed by script instead of anchor positioning).

## 🛠️ Develop

Node 22 or later. `npm ci` once installs the two pinned devDependencies: `lightningcss`, which the build uses to
minify (the unit tests and `npm run check` run the build), and `@playwright/test` for the browser tests (Chromium,
Firefox and WebKit), which also need the Playwright browsers once. `dist/` and its tools need neither.

```sh
npm test          # guardrails: tokens, literals, motion, docs, dist up to date
npm run build     # rebuild dist/ after changing src/ or fonts/
npm run check     # tests and a check that dist/ matches src/, as CI does

npm ci                                                # once: lightningcss and Playwright
npx playwright install --with-deps chromium firefox webkit   # when the pinned browsers are not cached
npm run test:browser                                  # motion, layout and screenshots in three engines
npm run test:browser:update                           # rewrite screenshots and timelines, then review the diff
```

How the browser tests work, the screenshot environment and the known-bug markers:
[test/browser/README.md](test/browser/README.md).

Change `src/`, run the build, commit `src/` and `dist/` together, note the change in [CHANGELOG.md](CHANGELOG.md).
`main` is always releasable: projects that use the nightly update workflow receive every push within a day,
whatever the version number says, so a rename keeps the old name working and only a later major version removes it.
The full checklist for components, tokens, icons and keyframes is in [AGENTS.md](AGENTS.md).

<div align="center">

Made with 💙 for calm dashboards · [MIT](LICENSE)

</div>
