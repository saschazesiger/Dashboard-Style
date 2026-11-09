# Loading only what a page uses

A page loads Dashboard-Style in one of three ways, from the simplest to the smallest. All three cascade the same: the
layer statement fixes the order of the layers, and each component sits in a sublayer of its own,
`ds.components.<name>`, declared in manifest order. So a page that links single files, a partial bundle and several
bundles on one page all cascade exactly as the whole of `ds.css` does.

| Way | What the page links | Setup | When |
|---|---|---|---|
| Everything, minified | `ds.min.css` and `ds.min.js` | none | a small internal app; the default |
| Single files | the `css/core/*.css` files (`manifest.json` "core"), then the `css/components/<name>.css` it needs (`.min.css` next to each) | by hand: `manifest.json` lists what each component requires | a few static pages |
| Project bundle | `ds.bundle.css` and `ds.bundle.js`, written by `tools/bundle.mjs` | `ds.config.json` and one command | recommended for every project with a build step or CI |

With single files, `tools/check-project.mjs` fails a page that uses a class whose stylesheet it does not link
([install.md](install.md#check-a-project), rule `classes`).

The bundle tool and the Vite plugin read `manifest.json` of the copy: every component with its stylesheets, classes,
attributes, the modules it needs and what it requires, and every module with its imports, its exports, the components
it always needs (`requires`) and the components one of its exports needs because it writes their markup itself
(`exportRequires`: `DS.overlay.confirm` needs the dialog, the button and the spinner), and the attributes that need it
whatever they sit on (`attributes`: `data-ds-open`, `data-ds-close` and `data-ds-busy` need the overlay module).

## The project bundle

```sh
node vendor/dashboard-style/tools/bundle.mjs --config ds.config.json
```

It reads `manifest.json` of the copy it sits in (`../manifest.json` next to `tools/`), or of the copy `--dist <path>`
or the config's `dist` names. It needs Node 22 or later and nothing else.

```json
{
  "content": ["index.html", "src/**/*.{html,js,ts,tsx,vue,svelte}", "templates/**/*.tmpl"],
  "out": "public/ds",
  "safelist": ["ds-btn--*", "component:chart"],
  "minify": true,
  "js": "classic",
  "icons": "auto"
}
```

Paths and globs are relative to the config file. Globs know `*`, `**`, `?`, `{a,b}` and `[...]`; one that starts
with `!` leaves files out. `node_modules`, `.git`, the copy itself and the bundle's own files are never scanned.

| Key | Default | What |
|---|---|---|
| `content` | (required without `entries`) | the files to scan |
| `out` | the config's folder | where the bundle goes |
| `entries` | none | `{ "<name>": ["globs"] }`: one bundle per entry (below) |
| `safelist` | `[]` | names the scan cannot see (below) |
| `minify` | `true` | the `.min.css` files of the copy, and the classic script without comments |
| `js` | `"classic"` | `"classic"` (a script that sets `window.DS`), `"esm"` (an ES module that imports the modules) or `false` (no script) |
| `icons` | `"auto"` | `"auto"`: the glyphs the scan finds; `"all"`: every glyph; a list: the glyphs the scan finds and these |
| `dist` | the copy the tool sits in | another copy |

Options:

| Option | What |
|---|---|
| `--config <file>` | the config (default `ds.config.json` in the current folder) |
| `--dist <path>`, `--out <path>` | override the copy and `out` |
| `--check` | write nothing; exit 1 when the written bundle is stale (below) |
| `--report` | print every component, module and icon with the reason it is in, and the sizes |
| `--dry-run` | print what would be written, write nothing |

Exit codes: 0 done, 1 a scan error (or a stale bundle with `--check`), 2 a broken config or copy.

## What the scan reads

The scan reads every file as plain text, as Tailwind does, so it works on HTML, JavaScript, TypeScript, JSX and TSX,
Vue, Svelte, Markdown and server templates alike. It looks for:

- **Classes**: every complete `ds-*` name (`ds-btn`, `ds-btn--filled`, `ds-dialog__box`), matched against the
  classes of the manifest. A custom property (`--ds-btn-height`) and an attribute (`data-ds-busy`) are not classes.
  A name the copy does not know goes into the report's `unknown` list (`tools/check-project.mjs` fails it).
- **Attributes**: `data-ds-*` names that a component styles (`data-ds-ripple`), also written as `dataset.dsRipple`.
- **Modules**: `DS.<module>.<export>` (also through `window.DS` and `const { open } = DS.overlay`), and ES imports
  of `js/<module>.js` (`import { open } from 'vendor/dashboard-style/js/overlay.js'`), with the names they import.
- **React adapter**: ES imports of `react/<file>.js` ([react.md](react.md)) bring the stylesheets that file renders
  and those its modules always need (`manifest.json` `react`), since its classes sit in the adapter, not in the
  project; from `react/index.js` the files of the names imported. The adapter's modules load themselves, so a React
  project sets `"js": false`. Plain behaviour markup React renders outside the adapter's components
  (`data-ds-collapsible`, `data-ds-time`) then starts only when its module is imported too
  (`import '<dest>/js/<module>.js'`): the provider loads `motion`, `ripple`, `overlay` and `tooltip`, nothing else.
- **Icons**: `DS.icons.<name>`, `icon('<name>')`, `data-icon="<name>"` and `data-ds-icon="<name>"` (also in JSX,
  `data-icon={'bell'}`), `setAttribute('data-icon', '<name>')`, and named imports of `js/icons.js`.

Then it resolves what those need, transitively:

- each component's `requires` (a dialog needs the button and the scrim, a combobox the listbox);
- the modules a component needs (a dialog needs `DS.overlay`), the modules those import, and `core`, which is always
  in;
- the stylesheets a module needs (`DS.ripple` needs the ripple's), and those one of its exports needs because it
  builds that markup itself (`DS.overlay.toast()` needs the snackbar's);
- the glyphs a module draws itself (the close button of a snackbar).

## Dynamic names

The scan only sees complete names. A name put together at run time fails the run with its file and line:

```js
el.className = 'ds-btn--' + kind;          // a.js:1 a class name built at run time
el.className = `ds-status--${tone}`;        // a.js:2
el.className = 'ds-' + name;                // a.js:3
el.className = 'ds-chip' + suffix;          // a.js:4
```

`'ds-card ' + other` (a whole name and a space) is fine. Write the names out where you can, for example with a map:

```js
const TONES = { ok: 'ds-tone-success', warning: 'ds-tone-warning', error: 'ds-tone-error' };
el.className = `ds-status ${TONES[tone]}`;
```

An icon name the scan cannot read is an error too (`DS.icons[name]`, `data-icon="{{.Icon}}"`, `data-icon={name}`):
list the glyphs it can be in `icons` (`"icons": ["check", "alert"]`), or set `"icons": "all"`.

## The safelist

`safelist` adds what the scan cannot see:

| Entry | What it adds |
|---|---|
| `"ds-btn--*"` | every class the glob matches, and so their components; it also covers a name built from `ds-btn--` |
| `"component:chart"` | the component and everything it requires; it covers a name built from a prefix that only its classes start with (`'ds-chart__bar--' + tone`) |
| `"module:dom"` | the module (for a name the scan cannot see: `const ui = DashboardStyle.versions['3.0.0']`) |
| `"icon:check"` | the glyph |

A safelist entry that names nothing in the copy is an error (a component or module) or a warning (a glob).

## What it writes

Per bundle (`ds.bundle.*`, or `ds.<entry>.*` with `entries`):

- `ds.bundle.css`: one banner, the layer statement, the sublayer statement, the core (tokens, base, motion and
  global, the rules for every element inside `.ds-theme`), then
  the components in manifest order. `@property` registrations stay at the top level.
- `ds.bundle.js`:
  - `"classic"`: one script with only the modules the project needs, plus `core`, and an icons module that holds only
    the glyphs it uses. Another bundle (or `ds.js`) of the same version on the page adds its modules to the same
    `DashboardStyle.versions[version]` object, so two bundles share one overlay stack, one scroll lock and one guard.
  - `"esm"`: an entry module (`export * as overlay from '../vendor/dashboard-style/js/overlay.js'` ...) for a bundler
    to take from there; it imports only the glyphs the project uses.
- `ds.bundle.json`, the report: the version, the files with their bytes and gzip sizes, every component, module and
  icon with the reason it is in (`src/app.js:12 ds-btn`, `required by dialog`, `needed by DS.overlay.toast (...)`,
  `safelist "component:chart"`) and every class the scan found, with where it found it first.
- `properties.css` (one per folder): the `@property` rules of the bundles, alone. A widget whose bundle sits in a
  shadow root links it in the host document ([theming.md](theming.md), "Embedded in someone else's page").

```html
<link rel="stylesheet" href="ds/ds.bundle.css">
<link rel="stylesheet" href="css/theme.css">
<script src="ds/ds.bundle.js" defer></script>
```

## Entries: one bundle per part of a site

```json
{
  "content": ["templates/layout.html"],
  "entries": { "admin": ["admin/**"], "shop": ["shop/**"] },
  "out": "public/ds"
}
```

Each entry scans its own globs and `content` (the shared layout), and writes `ds.admin.css`, `ds.admin.js`,
`ds.admin.json` and `ds.shop.*`; there is no `ds.bundle.*` then. A page that loads two entries gets one runtime.

## In CI: `--check`

```sh
node vendor/dashboard-style/tools/bundle.mjs --config ds.config.json --check
```

It writes nothing and exits 1 with a summary when the bundle on disk no longer matches the project:

```text
src/list.js:4 uses .ds-chip, which public/ds/ds.bundle.css does not hold
bundle: + component chip (src/list.js:4 ds-chip)
bundle: - component tabs (no longer used)
stale: public/ds/ds.bundle.css
```

Run the tool without `--check` and commit the bundle with the change that needed it.

## The nightly update rebuilds the bundle

A new vendored copy always makes the old bundle stale (the version in its banner changes, and so may the components),
so a `--check` in the nightly update would fail every night. The nightly **rebuilds** the bundle from the new copy and
commits the copy and the bundle together: in `.github/workflows/update-dashboard-style.yml`
([install.md](install.md#automatic-updates-github-actions)) set `BUNDLE: ds.config.json` (the path of the config) and
`SETUP: node`. The template then sets up Node, runs `node "$DEST/tools/bundle.mjs" --config "$BUNDLE"` before the
check, and adds the config's folder (where its `out` folder sits) to the commit. Keep `--check` in the project's own CI,
on every push.

## Vite

`tools/vite-plugin.mjs` runs the same scan inside Vite, without a dependency:

```js
// vite.config.js
import dashboardStyle from './vendor/dashboard-style/tools/vite-plugin.mjs';

export default { plugins: [dashboardStyle({ config: 'ds.config.json' })] };
```

```js
// main.js
import 'virtual:dashboard-style.css';
import DS from 'virtual:dashboard-style.js';
```

At `buildStart` it scans `content` (default `index.html`); after that it scans every module Vite transforms and every
HTML page. In dev a change that needs another component updates the stylesheet (and reloads the page when the script
changes). A build makes the stylesheet at `buildStart`, so list every source folder in `content`: a name that first
appears in a module outside it is a warning at the end of the build (an error with `strict: true`). A name built at
run time fails a build and warns in dev. Options: `config`, `dist`, `strict`, and the config keys `content`,
`safelist`, `minify`, `js` and `icons`. With `"js": "esm"` the script module re-exports the modules by name instead
of setting `window.DS`.

## Other bundlers

With `"js": "esm"`, `ds.bundle.js` is a plain ES module that esbuild, Rollup or webpack take from there: it is also
the list of imports a project can copy into its own entry. Link `ds.bundle.css` (or import it, where the bundler
handles CSS).
