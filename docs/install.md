# Install and update

Everything a project needs is in `dist/`:

| Path | What |
|---|---|
| `ds.css` | all stylesheets in cascade order (tokens, motion, base, components), in `@layer ds.*` (see "Cascade layers and resets") |
| `ds.js` | classic script, sets `window.DS = { version, motion, indicator, dom, ripple, icons }` (see "Two copies on one page") |
| `css/` | the single stylesheets (`tokens.css`, `motion.css`, `base.css`, `components/*.css`, `index.css`) |
| `js/` | the ES modules (`motion.js`, `indicator.js`, `dom.js`, `ripple.js`, `icons.js`) |
| `fonts/` | Google Sans woff2 (latin, latin-ext), `fonts.css`, `OFL.txt` |
| `LICENSE` | the MIT notice; keep it with the copy |
| `SHA256SUMS` | checksums of every file |

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

Verify it in your tests or CI so edits to the vendored files fail loudly: run `vendor.sh --check`, or compare the
hashes yourself (`cd vendor/dashboard-style && sha256sum -c SHA256SUMS`, plus a check that no unlisted file was
added). On Windows checkouts, mark the folder binary so Git does not rewrite line ends:

```gitattributes
vendor/dashboard-style/** -text
```

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
needs only `'self'` there. Either way `img-src` must allow `data:`: the calendar glyph of date fields and the clear
glyph of search fields are `data:image/svg+xml` masks in `form.css`, and `img-src 'self'` alone leaves them blank.

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
@import './vendor/dashboard-style/css/components/button.css';
```

When you pick files, keep the order of `css/index.css` and always include `tokens.css` and `motion.css` (components
name the keyframes in it). With Node subpath imports, `"imports": { "#ds/*": "./vendor/dashboard-style/*" }` in
`package.json` lets both the bundler and Node tests write `#ds/js/motion.js`.

## Two copies on one page

A host page and an embedded widget may each load their own `ds.js`. Every copy registers itself in
`window.DashboardStyle.versions['<version>']`; `window.DS` is set only when it is absent or holds the same version,
so the first copy keeps it. A second copy of the same version does nothing. A copy of another version leaves
`window.DS` alone and logs one warning naming both versions; a `window.DS` that is not Dashboard-Style (no
`version` string) is never touched either. Code that must run on its own copy reads it by version:

```js
const ds = window.DashboardStyle.versions['1.0.0'] || window.DS;
```

## Fonts

`fonts/fonts.css` self-hosts Google Sans (variable weight 400-700 with the optical size axis) with relative URLs, so
the folder can live anywhere. It is optional: without it `--ds-font` falls back to Roboto, Segoe UI or the system UI
font. Preload the latin file for a faster first paint:

```html
<link rel="preload" href="vendor/dashboard-style/fonts/google-sans-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
```

Keep `OFL.txt` next to the font files and do not rename or re-subset them. To use another typeface, set `--ds-font`
in your theme and skip `fonts.css`.

## Updating

1. Read [CHANGELOG.md](../CHANGELOG.md) since the version in your `VERSION` file. Versions follow semver: a minor
   version adds tokens, classes or hooks or deprecates one; a renamed name keeps working under its old name until a
   later major version removes it. The number does not hold anything back: `main` is what you get.
2. Vendor again over the old copy (`vendor.sh vendor/dashboard-style` fetches the latest `main`); the CDN's `@main`
   URLs update by themselves.
3. Open your pages and the styleguide with your theme loaded; run your tests (including the checksum check).

### Automatic updates (GitHub Actions)

[templates/update-dashboard-style.yml](../templates/update-dashboard-style.yml) does step 2 every night. Copy it to
`.github/workflows/` and set three values under `env`:

| Value | Meaning |
|---|---|
| `DEST` | path of the copy, e.g. `vendor/dashboard-style` |
| `VERIFY` | command that must pass before the update is committed (`npm ci && npm test`); empty to skip |
| `BUILD_WORKFLOW` | workflow file that builds and deploys, started with `workflow_dispatch`; empty if your build starts on push by itself (Cloudflare Pages, Netlify, Vercel) |

It runs daily at 02:30 UTC and on demand (*Run workflow*). If the commit in `DEST/VERSION` equals `main` of
Dashboard-Style, the run ends there. Otherwise it vendors `main`, runs `VERIFY`, commits the copy to the branch it runs
on and starts `BUILD_WORKFLOW`. A push made with `GITHUB_TOKEN` starts no other workflow, which is why the build is
started explicitly; the build workflow needs `on: workflow_dispatch`. The template asks for `contents: write` and
`actions: write`; a branch protection rule that blocks direct pushes also blocks the update.

#### When the update fails

- **Compare** or **Vendor main**: a network or GitHub API problem; run it again.
- **Verify**: nothing was committed and the site keeps the old copy. Reproduce it locally (vendor `main` as in step 2,
  then run `VERIFY`), look in [CHANGELOG.md](../CHANGELOG.md) for deprecations and removals, and commit the new copy
  together with your fix. If the fault is in Dashboard-Style, fix it there; the next run picks it up.
- **Commit and push**: usually branch protection (above).

Afterwards start it again under Actions → "Update Dashboard-Style" → *Run workflow*, or wait for the next night.
