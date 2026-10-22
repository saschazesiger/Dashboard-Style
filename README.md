# Dashboard-Style

A neutral, themeable design system for admin dashboards and internal tools, in the style of the Google admin consoles
(Material 3): white panels on a tinted backdrop, hairlines instead of shadows, pill-shaped actions, calm motion.

- **Plain CSS and dependency-free JS.** No build step needed: one stylesheet, one optional script.
- **Themeable from one file.** Every colour, radius, font and shadow comes from a `--ds-*` token. A project theme
  overrides tokens; it never touches components.
- **Accessible by default.** WCAG AA text contrast, visible instant focus, forced colors (Windows contrast
  themes), status never by colour alone.
- **Embeddable.** Tokens live on `.ds-theme`, not `:root`, so the system can run inside someone else's page, and
  every rule sits in `@layer ds.*`, so the page's own unlayered CSS always wins.

**See it live:** [saschazesiger.github.io/Dashboard-Style](https://saschazesiger.github.io/Dashboard-Style/) runs the
reference app (a small device console built the way a project uses the system, source in [`example/`](example/README.md)),
the [styleguide](https://saschazesiger.github.io/Dashboard-Style/styleguide/index.html) and the
[Motion Lab](https://saschazesiger.github.io/Dashboard-Style/styleguide/motion.html).

MIT licensed. The bundled Google Sans font is under the SIL Open Font License 1.1; the icon shapes come from Lucide
(ISC) and Feather (MIT), see [LICENSE](LICENSE). There is no dark theme: the default is light, and dark mode is not
designed yet.

## Quick start

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
      <button class="ds-btn ds-btn--primary" type="button">Add device</button>
    </section>
  </div></div>
  <script src="dist/ds.js"></script>
</body>
</html>
```

`ds-theme` turns the tokens on, `ds-base` (optional) styles the page itself: backdrop, body text, links, focus.
`ds.js` is only needed for the motion helpers, the sliding indicator, the DOM morph, the pointer ripple
(`DS.ripple.attach(document)` once), the overlays (`DS.overlay`: dialogs, side sheets, the modal drawer, menus, the
combobox list, tooltips and snackbars) and the icons (`window.DS`); every component works without it, overlays then
opened and closed by hand as [docs/components.md](docs/components.md) describes.

For a whole app (navigation, tables with live data, overlays, forms, a project theme and project components),
read the reference app in [`example/`](example/README.md): its README maps every pattern to its code.

Open [`styleguide/index.html`](styleguide/index.html) in a browser (works from disk) to see every component, the
tokens and the icons, and to try a theme file. Its Motion Lab, [`styleguide/motion.html`](styleguide/motion.html),
plots every curve as your browser plays it, lines up the durations and replays every choreography, with rapid
toggles and reversals; the speed select in the top bar slows it all down to 0.1×.

## Install

**Vendor a copy (recommended).** The script copies `dist/` of the latest `main` into your project and writes `VERSION`
(with the exact commit) and `SHA256SUMS` next to it, so a test or CI step can prove nobody edited the copy. To update,
run it again.

```sh
curl -fsSLO https://raw.githubusercontent.com/saschazesiger/Dashboard-Style/main/scripts/vendor.sh
sh vendor.sh vendor/dashboard-style             # copy the latest main (or: vendor.sh <ref> <dest>)
sh vendor.sh --check vendor/dashboard-style     # verify (exit 1 if anything changed)
```

Windows PowerShell: `scripts/vendor.ps1` with the same arguments (`-From`, `-Check`).

**CDN.** jsDelivr serves the repository (`@main`, or a commit hash to pin):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/ds.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/fonts/fonts.css">
<script src="https://cdn.jsdelivr.net/gh/saschazesiger/Dashboard-Style@main/dist/ds.js"></script>
```

**Bundlers.** `dist/css/` and `dist/js/` hold the single stylesheets and ES modules; import only what you need.
Details, updates and integrity checks: [docs/install.md](docs/install.md).

## Theming

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

## Documentation

| Topic | |
|---|---|
| [Install and update](docs/install.md) | vendoring, CDN, bundlers, fonts, verifying a copy |
| [Tokens](docs/tokens.md) | the three layers and every token (the motion scales in [Motion](docs/motion.md#tokens)) |
| [Theming](docs/theming.md) | writing a project theme, component hooks |
| [Components](docs/components.md) | which component for which need, copy-paste markup for every component |
| [Motion](docs/motion.md) | principles, motion tokens, rules, the choreography of every component, interruption, keyframes and utilities, `DS.motion` (FLIP, `countUp`, `transition`), indicator, morph, ripple, overlays, recipes, view transitions, scroll-driven effects |
| [Icons](docs/icons.md) | the outline set and its helpers |
| [Rules](docs/rules.md) | the design rules the components follow |

## Files

```
dist/            what you ship (built, committed): ds.css, ds.js, css/ (with css/optional/, css/properties.css), js/, fonts/, LICENSE, SHA256SUMS
src/             sources: tokens.css, motion.css, base.css, components/*.css, optional/*.css, js/*.js, index.css (order)
fonts/           Google Sans (latin, latin-ext) with fonts.css and OFL.txt
themes/          example.css, the theme template
styleguide/      living styleguide (open index.html; motion.html: the Motion Lab; views.html: view transitions and scrolling)
example/         the reference app: a device console on top of dist/, as a project builds one (published on GitHub Pages)
scripts/         build.mjs, motion-curves.mjs, vendor.sh, vendor.ps1, site.sh (assembles the GitHub Pages site)
templates/       update-dashboard-style.yml, a GitHub Actions workflow that keeps a copy on main
test/            node --test unit tests, no dependencies; test/browser/ Playwright tests (three engines)
docs/            the documentation above
AGENTS.md        how to work on the system (CLAUDE.md points to it)
```

## Browser support

Safari 16.4, Chrome and Edge 111, Firefox 128 (ESR) and later. Everything in `src/` may run in an embedded widget
on such a browser, so the CSS uses `:focus-visible`, `:has()`, `inset`, container queries, `color-mix()`,
`svh`/`dvh`, `<dialog>`, `inert`, `@layer`, `@property` and the individual `translate`/`scale`/`rotate` directly,
but no CSS nesting; the JS is ES2022.

Newer features are refinements only, behind a feature query where it matters, and each file names them under
"Progressive:" in its header with its fallback: `linear()`, `@starting-style`, `transition-behavior:
allow-discrete`, `popover`, anchor positioning, View Transitions, scroll-driven animations, `interpolate-size`,
`::details-content`, `overflow-clip-margin`, `sibling-index()`, `moveBefore()`, `scrollbar-gutter`,
`focus({ focusVisible: false })`, plus `text-wrap` and `scrollbar-color`. Older browsers get the same page without the refinement (a cubic curve instead of the spring,
a disclosure that toggles instead of gliding).

## Develop

Node 22 or later. The unit tests, the build and `npm run check` need nothing installed. The browser tests
(Chromium, Firefox and WebKit, through the one pinned devDependency `@playwright/test`) need `npm ci` and the
Playwright browsers once.

```sh
npm test          # guardrails: tokens, literals, motion, docs, dist up to date
npm run build     # rebuild dist/ after changing src/ or fonts/
npm run check     # tests and a check that dist/ matches src/, as CI does

npm ci                                                # once, for the browser tests only
npx playwright install --with-deps chromium firefox webkit   # when the pinned browsers are not cached
npm run test:browser                                  # motion, layout and screenshots in three engines
npm run test:browser:update                           # rewrite screenshots and timelines, then review the diff
```

How the browser tests work, the screenshot environment and the known-bug markers:
[test/browser/README.md](test/browser/README.md).

Change `src/`, run the build, commit `src/` and `dist/` together, note the change in [CHANGELOG.md](CHANGELOG.md).
`main` is always releasable: projects that use the nightly update workflow receive every push within a day,
whatever the version number says, so a rename keeps the old name working and only a later major version removes it. The full checklist for components, tokens, icons
and keyframes is in [AGENTS.md](AGENTS.md).
