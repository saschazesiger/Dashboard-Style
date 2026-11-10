# Migrating from 2.x to 3.0

3.0 is a rebuild ([plans/3.0.md](../plans/3.0.md)): one folder per component, pages that load only what they use, size,
density, shape, tone and touch as option classes, a theme generator, behaviours through `DS.init()`. Most of a 2.x
project keeps working as it is. What changed names is in `deprecations.json` of the copy, and `tools/migrate.mjs`
rewrites what it can map and lists the rest. This guide is the whole list, with what to check by hand.

- [Before you start](#before-you-start)
- [Run the migration](#run-the-migration)
- [The tool](#the-tool)
- [Renamed and removed names](#renamed-and-removed-names)
- [Changes without a new name](#changes-without-a-new-name)
- [Check by hand](#check-by-hand)

## Before you start

- **The project has a new name: Z-Dash** (it was Dashboard-Style until 2.x; the repository is
  `saschazesiger/Z-Dash`, GitHub forwards the old address). Markup, classes, tokens and `DS` keep their `ds` prefix,
  so the name changes nothing on a page. What names the project: the nightly workflow's `REPO`
  (`saschazesiger/Z-Dash`; the template is now [templates/update-z-dash.yml](../templates/update-z-dash.yml)), a CDN
  address (`gh/saschazesiger/Z-Dash@main`, `migrate.mjs` rewrites the stylesheet paths in it but not the name) and
  the page-wide registry `DashboardStyle`, now `ZDash` (both hold the same object; `migrate.mjs` rewrites it, with the
  types `DashboardStyleApi` and `DashboardStyleRegistry`). The copy's folder may keep its name
  (`vendor/dashboard-style`): the tools read both names.
- **Keep the 2.x copy until the project moves.** The nightly update vendors `main`, and the update workflow has no
  setting for another branch yet. A project that is not ready for 3.0 when it reaches `main` disables its "Update
  Z-Dash" workflow (Actions, "Disable workflow") and, for a 2.x fix, vendors a 2.x tag or commit by hand
  (`sh vendor.sh <ref> vendor/z-dash`, [install.md](install.md#updating)). It turns the workflow back on in
  the same commit as its migration. A 2.x `ds-check.json` has no `"major"`, so `check-project` of a 3.0 copy fails
  on it: a nightly that picks up 3.0 stops before it commits the copy.
- **The browser floor rises** to Safari 17.5, Chrome and Edge 123, Firefox 130 ([rules.md](rules.md)). A product that
  must run on older browsers stays on 2.x.
- **Start from a clean 2.x project.** `node <copy>/tools/check-project.mjs --config ds-check.json` with the 2.x copy
  should pass first: a removed 1.x name or a restyled component is easier to fix before the move.

## Run the migration

1. Vendor the 3.0 copy over the 2.x one (`scripts/vendor.sh vendor/z-dash`, or your update command). The
   tools of the new copy read its `deprecations.json`.
2. Look at what the tool would change. It writes nothing:

   ```sh
   node vendor/z-dash/tools/migrate.mjs --config ds-check.json
   ```

   It prints a unified diff of every change, then three lists: what it rewrites, what it rewrites but you should
   check (a pattern that casts a wide net), and what needs a person, each with file and line.
3. Apply it, and commit the result on its own, so the review sees the mechanical part apart from your own:

   ```sh
   node vendor/z-dash/tools/migrate.mjs --config ds-check.json --write
   ```

4. Work through "Needs a person" and "check each" ([Check by hand](#check-by-hand) says what each kind of item asks
   for). Run the tool again: it finds nothing more to rewrite, and the list for a person shrinks as you fix it.
5. Run the checks of the new copy. `migrate.mjs` has set `"major": 3` in `ds-check.json`:

   ```sh
   node vendor/z-dash/tools/check-project.mjs --config ds-check.json
   node vendor/z-dash/tools/check-theme.mjs css/theme.css
   ```

   `check-project` now also runs the rules `options` (an option written as a restyle) and `bundle`
   ([install.md](install.md#check-a-project)); `check-theme` knows seeds, the option defaults and generated themes
   ([theming.md](theming.md#checking-a-theme)).
6. Load less. `ds.min.css` and `ds.min.js` are the same as `ds.css` and `ds.js`, minified; a project bundle holds only
   what the project uses ([bundle.md](bundle.md)). Name the bundle's config in `"bundle"` of `ds-check.json`, so the
   check proves the bundle holds every class.
7. Open every page in light and dark, at a phone's width and wide, with the keyboard, and run your own tests. Looks
   that changed on purpose are listed under [Changes without a new name](#changes-without-a-new-name).

## The tool

```sh
node <copy>/tools/migrate.mjs [--config ds-check.json] [<file, folder or glob> ...] [--write] [--json] [--no-diff]
                              [--deprecations <file>]
```

| Option | What |
|---|---|
| `--config ds-check.json` | the files of the config (`css`, `js`, `html`, `themes`), outside its `vendor`; paths start from the config's folder, and the config's `"major"` is set to the copy's |
| `<file, folder or glob>` | files to read as well (or instead): a folder is walked for pages, stylesheets and scripts (`html`, `css`, `scss`, `js`, `mjs`, `ts`, `tsx`, `jsx`, `vue`, `svelte`, Go and other templates); without a config or a path, the current folder |
| `--write` | apply the changes; without it the run is a dry run |
| `--json` | the report as JSON (every change and every item for a person, with file and line), for a script or a CI annotation |
| `--no-diff` | the report without the diff |
| `--deprecations <file>` | another `deprecations.json` (the default is the one of the copy the tool sits in) |

It never reads `node_modules`, `.git`, a vendored copy (a folder with `SHA256SUMS` and `deprecations.json`),
minified files or a file the system wrote (a bundle: it starts with the system's banner). It is dependency-free and
needs Node 22 or later.

Exit codes: `0` nothing is left (nothing to rewrite and nothing for a person), `1` a dry run that would change files
or found something for a person, or a `--write` run that left something for a person, `2` a usage or configuration
error. In CI, the dry run fails as long as the migration is not complete.

What it rewrites, by the kind of name:

| Kind | Example | Rewrite |
|---|---|---|
| a renamed class | `.ds-btn--primary` | `.ds-btn--filled`, in class lists, selectors and strings |
| a modifier that became an option class | `.ds-btn--sm`, `.ds-badge--ok` | in a class list the option replaces it, once per list (`ds-btn ds-sm`, `ds-badge ds-tone-success`); in a selector it joins the block (`.app-bar .ds-btn.ds-sm`), so the selector still matches only that component |
| a renamed token, hook or keyframe | `--ds-dialog-width-wide` | `--ds-dialog-width-lg`, wherever it is named |
| a renamed attribute | `data-close` | `data-ds-close` in markup, selectors and strings, `dataset.close` to `dataset.dsClose` |
| a renamed export | `createIndicator()` | member calls (`DS.indicator.create(...)`), named imports of its module (`import { create as createIndicator } from '<copy>/js/indicator.js'`) and destructuring of `DS.indicator`, so the local name keeps working; an import or destructuring of anything else stays |
| a method of a handle | `detach()` | `.destroy()` and `const { destroy: detach } = ...` only on a name the same file binds from `DS.ripple.attach()` (or an imported `attach()`); every other `.detach()` (jQuery's, a DOM library's) stays and is listed |
| an event or a variant string | `'ds-close'`, `'fill-x'` | `'ds:close'`, `'fill'` |
| an argument form | `settleLoader(t0, now)` | `settleLoader(t0, { now })` |
| a moved stylesheet | `<copy>/css/tokens.css` | `<copy>/css/core/tokens.css` (also `base.css` and `motion.css`), in links and imports that name the copy: the config's `vendor` folder or `z-dash`, in any case, with or without `dist/` (`node_modules/z-dash/dist/css/tokens.css`, the jsDelivr address `.../Z-Dash@main/dist/css/tokens.css`); any other path to a `css/tokens.css`, `base.css` or `motion.css` is listed, as the tool cannot tell the copy from a file of the project |

## Renamed and removed names

Every entry of `deprecations.json`, with what `migrate.mjs` does about it: "rewrites" it, makes it an "option class",
"rewrites, check each" (see [Check by hand](#check-by-hand)), or "lists it" for a person, with the note of the entry.

### Removed in 3.0.0

The 2.x aliases of the new names. They work in the 3.0 pre-releases (the checks warn) and are gone from 3.0.0 on (the
checks fail).

| Kind | 2.x | 3.0 | migrate.mjs |
|---|---|---|---|
| class | `.ds-btn--primary` | `.ds-btn--filled` | rewrites |
| class | `.ds-btn--sm` | `.ds-sm` (32px at the default density, 4px less per density step) | option class |
| hook | `--ds-btn-sm-height` | `--ds-btn-height` is the base of every size | lists it |
| hook | `--ds-btn-sm-icon-size` | `--ds-btn-icon-size` is the base of every size | lists it |
| class | `.ds-dialog--wide` | `.ds-dialog--lg` (the same 560px) | rewrites |
| hook | `--ds-dialog-width-wide` | `--ds-dialog-width-lg` | rewrites |
| attribute | `data-close` | `data-ds-close` | rewrites |
| event | the event `ds-close` | `ds:close`, with the same `detail.reason` | rewrites |
| class | `.ds-check--sm` | `.ds-sm` | option class |
| hook | `--ds-check-sm-height` | `--ds-check-height` is the base of every size | lists it |
| class | `.ds-input-group__affix` | `.ds-input-group__suffix` after the input, `.ds-input-group__prefix` before it | rewrites, check each |
| class | `.ds-alert--success`, `.ds-alert--warning`, `.ds-alert--error` | `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` | option class |
| class | `.ds-badge--neutral`, `.ds-badge--ok`, `.ds-badge--warning`, `.ds-badge--error` | `.ds-tone-neutral`, `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` | option class |
| class | `.ds-status--ok`, `.ds-status--warning`, `.ds-status--error` | `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` | option class |
| class | `.ds-tag--neutral` | `.ds-tone-neutral` | option class |
| class | `.ds-spinner--sm` | `.ds-spinner--ink` with `.ds-sm` (the same 12px) | option class |
| class | `.ds-loader--sm` | `.ds-sm` | option class |
| hook | `--ds-loader-sm-size` | `--ds-loader-size` is the base of every size | lists it |
| class | `.ds-table--dense` | `.ds-density-tight` (40px rows, a 36px head) | option class |
| hook | `--ds-table-dense-row-height` | `--ds-table-row-height` is the base of every density | lists it |
| class | `.ds-kv-list__icon--ok`, `.ds-kv-list__icon--warning`, `.ds-kv-list__icon--error` | `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the icon | option class |
| class | `.ds-meter--neutral`, `.ds-meter--warning`, `.ds-meter--error` | `.ds-tone-neutral`, `.ds-tone-warning`, `.ds-tone-error` on the meter | option class |
| class | `.ds-columns__col--warning`, `.ds-columns__col--error` | `.ds-tone-warning`, `.ds-tone-error` on the column | option class |
| class | `.ds-legend__key--neutral`, `.ds-legend__key--warning`, `.ds-legend__key--error` | `.ds-tone-neutral`, `.ds-tone-warning`, `.ds-tone-error` on the key | option class |
| class | `.ds-subsection` | `.ds-card__section` | rewrites |
| class | `.ds-more` | `.ds-card__more` | rewrites |
| class | `.ds-avatar--sm`, `.ds-avatar--lg` | `.ds-sm`, `.ds-lg` | option class |
| export | `createIndicator()` | `DS.indicator.create()`, the same options and handle | rewrites calls and imports |
| export | `detach()` of the `DS.ripple.attach()` handle | `destroy()` | rewrites calls and imports |

### Deprecated in 2.x, still working in 3.0

A later major version removes them; the checks warn.

| Kind | 2.x | 3.0 | migrate.mjs |
|---|---|---|---|
| recipe | the hand `data-scrolled` recipe: a page's own observer (the 1.x App frame) | `DS.dom.watchScrolled(view)` | lists it |
| class | `.ds-view--leaving` and the hand swap recipe | `DS.motion.transition()` | lists it |
| argument | `settleLoader(startedAt, now)` | `settleLoader(startedAt, { now })` | rewrites |
| keyframes | `ds-fill-x`, `ds-fill-y` | `ds-fill-share`, the mark sets `--ds-share` | rewrites, check each |
| class | `.ds-enter--fill-x`, `.ds-enter--fill-y` | `.ds-enter--fill`, the mark sets `--ds-share` | rewrites, check each |
| argument | `enter(el, 'fill-x')`, `enter(el, 'fill-y')` | `enter(el, 'fill')` | rewrites, check each |
| keyframes | `ds-edge-fade` | `ds-scroll-edge-start`, `ds-scroll-edge-end` with `--ds-scroll-fade` | lists it |
| token | `--ds-table-fade-start`, `--ds-table-fade-end` | `--ds-scroll-edge-start`, `--ds-scroll-edge-end` | rewrites |

### Deprecated in 3.0

The names of the project before its rename. Both work; the checks warn.

| Kind | 2.x | 3.0 | migrate.mjs |
|---|---|---|---|
| export | **deprecated** `DashboardStyle` (`DashboardStyle.versions`, `.runtime`; the types `DashboardStyleApi`, `DashboardStyleRegistry`) | `ZDash` (`ZDashApi`, `ZDashRegistry`), the same object | rewrites |

### Removed in 2.0.0

A 2.x project that passed `check-project` has none of these; the tool still finds them.

| Kind | 1.x | Since 2.0 | migrate.mjs |
|---|---|---|---|
| token | `--ds-ease` | `--ds-ease-emphasized` | rewrites |
| token | `--ds-loop-pulse` | `--ds-loop-skeleton` | rewrites |
| role, token | `--ds-spinner-sm-track`, `--ds-state-pulse` | none: delete them | lists it |
| keyframes | `ds-pulse`, `ds-indeterminate` | `.ds-skeleton`, `.ds-progress--indeterminate` | lists it |
| keyframes | `ds-sink-out`, `ds-scale-out`, `ds-slide-out` | `ds-fade-out` with `ds-drop-out`, `ds-shrink-out` or `ds-shift-out` | lists it |
| export | `DS.motion.easeOutCubic` | none: `countUp()` runs on `--ds-ease-value` | lists it |
| class | `.ds-btn__swap` | `.ds-btn__faces` with a `.ds-btn__face` per state, driven by `DS.motion.busy()` | lists it |
| attribute | `data-open` on `.ds-combo` | `aria-expanded="true"` on `.ds-combo__input`, through `DS.overlay.open()` | lists it |
| markup | the live region `.ds-toasts[role]` / `.ds-toasts[aria-live]` | a plain `.ds-toasts` region: `DS.overlay.toast()` announces | lists it |
| recipe | the hand recipe that moves snackbars into a side sheet | `DS.overlay.open(sheet)` and `DS.overlay.toast()` do it | this guide |

## Changes without a new name

No name shows these, so the tool lists what it can find (the module imports, project rules in `ds.components`, single
stylesheets) and the rest is for your review. The [CHANGELOG](../CHANGELOG.md) has the details per component.

- **Options.** Every component computes size, density, shape, touch and, where it shows meaning, tone in its own rule
  ([options.md](options.md)). A hook a theme sets (`--ds-btn-height: 44px`) is now the base that size and density
  step from; an exact hook (`--ds-btn-height-exact`) fixes a value. A per-size hook of 2.x has no successor: drop it
  and use the size class, or set the base.
- **Touch is opt-in.** `.ds-touch` no longer sets component heights (`--ds-input-height`, `--ds-chip-height`,
  `--ds-tabs-height` ...): every control takes `--ds-target-min` and stays at least that tall. A page that read those
  hooks under `.ds-touch` reads the computed size instead. A coarse pointer never turns touch on by itself.
- **Compact theme.** `themes/compact.css` is the dense density (`--ds-density: -2`) plus 13/18 type: fields 32px
  (2.x: 36px), chips 24px (28px), tighter block padding on cards, alerts, empty states and loading. Table rows,
  buttons, tabs, drawer rows, menu rows and the segmented control keep their 2.x size; a coarse pointer gets the
  default density back.
- **Type.** `--ds-type-scale` multiplies every type role. `--ds-font-input` no longer follows `--ds-font-reading`: it
  keeps a floor of 16/24 so no scale makes iOS zoom; a theme that changes the reading role and wants fields to follow
  sets `--ds-font-input` too.
- **Modules.** With ES modules imported one by one, the overlays' behaviours have modules of their own: `toast()` and
  `closeToasts()` need `js/toast.js`, `confirm()`, `alert()` and `prompt()` need `js/dialog.js`, `tooltips()` needs
  `js/tooltip.js`, and a menu's keys need `js/menu.js`, each next to `js/overlay.js`. Without it the call throws an
  error that names the file. `ds.js`, `ds.min.js` and a bundle hold them all.
- **Single stylesheets.** The core moved to `css/core/` (`tokens.css`, `base.css`, `motion.css`), and 3.0 adds
  `css/core/options.css` (the option classes) and `css/core/global.css` (the rules for every element inside
  `.ds-theme`). Some classes moved into a component of their own (`.ds-avatar`, `.ds-kbd` ...):
  `check-project` names the file every class needs.
- **Cascade.** Every component has its own sublayer, `ds.components.<name>`, in the order of `manifest.json`: a later
  component wins whatever the specificity, and single files cascade alike in any order. A project rule inside
  `@layer ds.components { … }` now beats every component; keep project CSS unlayered (it wins anyway) and set hooks.
- **Pinned last column.** `DS.dom.scrollEdges()` writes `--ds-table-pin-last-width`; a page no longer sets it.
- **Behaviours by attribute.** `DS.init()` attaches every behaviour whose `data-ds-*` attribute is on the page and
  watches for new ones ([core.md](core.md)). The 2.x calls keep working; a page that wires tooltips, copy buttons or
  menus by hand may let the attributes do it.
- **Events.** Every event of the system is `ds:<event>` and bubbles (`ds:open`, `ds:close`, `ds:change` ...).
- **Status colours.** The roles gained `--ds-info` and its family and `--ds-on-error`, `--ds-on-success`,
  `--ds-on-warning`, `--ds-primary-container`, `--ds-on-primary-container`. A theme that sets the status colours by hand
  checks the new pairs with `check-theme`; or generate the theme from one seed ([theme-generator.md](theme-generator.md)).

## Check by hand

| Item | What to do |
|---|---|
| a per-size hook (`--ds-btn-sm-height` ...) | Delete it. The size class (`.ds-sm`) takes the base hook less one size step; if the 2.x value differs, set the base so the step lands on it, or use the exact hook on that element. |
| `.ds-input-group__affix` became `__suffix` | A slot before the input is `.ds-input-group__prefix`: change those by hand. |
| `detach()` became `destroy()` | The tool renames it only on a name bound from `DS.ripple.attach()` in the same file. A `.detach()` it lists is called on something else: change it where that is the ripple handle (passed in from another file), leave it for anything else (a DOM library's own `detach()`). |
| `fill-x`, `fill-y`, `ds-fill-x`, `.ds-enter--fill-x` | The mark sets `--ds-share` (its share, 0 to 1) instead of its own `scaleX()` or `scaleY()`. |
| a class built at run time (`'ds-badge--' + kind`) | The tool cannot see its values. Map them: a status value becomes `ds-tone-<tone>` (`ok` is `success`), a size `ds-sm` or `ds-lg`. |
| a hook under an option class (`.app-panel .ds-table.ds-density-tight { --ds-table-row-height: 36px }`, left by the rewrite of `.ds-table--dense`) | The option computes from the base hook, so a hook under it redefines what the option means (`check-project`, rule `options`). Set the base hook on the element or in the theme (`--ds-table-row-height` on `.app-panel .ds-table`) and drop the rule; the tool lists it on every run until it is gone. |
| an option class that replaced a modifier | An option class applies to everything inside the element, a modifier only to its own component. `.ds-density-tight` on a table makes its rows tight and also the buttons, fields and chips in its cells (a 40px button becomes 28px), where `.ds-table--dense` shortened only the rows. Put `.ds-density-comfortable` (or the size class they need) on the cells or controls that must keep their size. |
| a module import of `js/overlay.js` | Import the module the report names next to it, or load `ds.js` or a bundle. |
| `@layer ds.components { … }` in project CSS | Move the rules out of the layer; set hooks on the component instead of restyling it. |
| a path to `css/tokens.css` the tool lists | If it is the copy (a name the run does not know: run with `--config`, whose `vendor` names it), the file is `css/core/tokens.css` now (`base.css` and `motion.css` too); a file of the project stays. |
| single stylesheets | Link `css/core/options.css` after `css/core/tokens.css` and `css/core/global.css` before the components, then add what `check-project` names; or switch to `ds.min.css` or a bundle. |
| a removed name with no replacement | Delete it; the note of the entry says what took its place. |
| screenshots | The ports to the options model changed some sizes on purpose (the compact theme above; the file field is 40px like every field, 2.x 42px); compare the diffs with [Changes without a new name](#changes-without-a-new-name) before you call one a regression. |
