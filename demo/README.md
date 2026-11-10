# Live tour

The start page on GitHub Pages (`scripts/site.sh` puts it at the root): one page that walks through Z-Dash
3.0, every stop a working demo wired the way a project wires it. Open `index.html` from disk or from the published
site; it needs nothing but this checkout's `dist/` and the bundle next to it.

| File | What |
|---|---|
| `index.html` | the frame (top bar, drawer, view), the fifteen stops and the overlays; the load order of a project: fonts, the bundle's stylesheet, the theme, the tour's own CSS, then the bundle's script and the tour's script (both `defer`) |
| `ds.config.json` | the bundle's whole setup: scan `index.html` and the scripts, minified, every icon (the icon grid shows them all) |
| `ds/` | the project bundle `tools/bundle.mjs` writes from it: `ds.bundle.css`, `ds.bundle.js`, the report `ds.bundle.json` and `properties.css`. Committed, never edited |
| `theme.js` | the theme chosen under "Theme it": a preset of `themes/presets/` (one file for both schemes) or the file the generator made from a colour of the visitor's own, the shape and density options, the appearance; applied before the first paint |
| `demo.css` | the tour's own components, prefix `demo-`, from tokens only |
| `demo.js` | the tour: the frame, the lazy stops, every demo |

## The bundle

The tour links `ds/ds.bundle.css` and `ds/ds.bundle.js`, never the whole `ds.css` or `ds.js`. `npm run build` writes
the bundle from `ds.config.json` and the `dist/` it just built, as a project would run

```sh
node dist/tools/bundle.mjs --config demo/ds.config.json
```

so it follows every change to `dist/` (a component the tour uses, a new version) or to the tour; commit it with the
change. `npm run check` fails a stale bundle, and `test/demo.test.js` runs the bundle tool's own `--check`, as a
project's CI would.

## Fast on a slow phone

- **Stops set up when they come near.** Every stop below the welcome starts inside `data-ds-managed`, so
  `DS.core.init(document)` after the first paint takes over only the frame. Half a view before a stop scrolls in, the
  tour draws its icons and hands it to the system part by part (each card, and inside one each date or time field, in
  a task of its own, `scheduler.yield()` where it exists), then runs the stop's own setup steps, one task each. A link
  to a stop (the drawer, `#theme`, the command palette) sets that stop up first and lines the view up once it is ready.
- **Far stops are not rendered.** Each stop below the first has `content-visibility: auto` (`demo.css`): far from the
  view it is a box of its last known height, so a theme change or an open dialog restyles only what is near. Inside a
  stop, the heavy cards without a popup of their own (`.demo-part`: the charts, the log, the code, the diff) and each
  icon of the grid do the same, so a stop that scrolls in is styled a card at a time, not all at once. The icon grid
  arrives in three tasks.
- **A jump lands where it aims.** Stops on the way take their true height as they pass; the smooth scroll of a link
  is aimed again from where it is, then the view lines the stop up once it is set up and watches the stops not set up
  yet afresh, so the ones it landed next to set up too.
- **The start is three tasks.** The frame paints first; then `DS.core.init(document)` takes it over (the gliding pills
  of the drawer and the speed switch read a finished layout), then the tiles count up.
- **Work only in view.** The live data polls and the device log streams only while their stop is in view.
- The theme generator (`styleguide/theme-generator.js`) loads with the first colour of the visitor's own; the presets
  are plain stylesheets.

## Where each pattern lives

| Stop | What it shows | In `demo.js` |
|---|---|---|
| Frame | `data-ds-shell` (rail, modal drawer, the drawer's pill, `data-scrolled`), `data-ds-scheme-switch` in the top bar, a scroll spy on `aria-current`, the speed switch (`--ds-time-scale`), the command palette (`DS.command.create()`, Ctrl+K) | Frame, Command palette |
| Actions | variants and sizes, busy and done faces, an icon swap, toggle groups, split and menu buttons, the priority bar, copy | `SETUP.actions` |
| Forms and inputs | switches, a parent checkbox, chips, radio cards, the slider, date, time, date range and time range pickers, number fields, a tag input, password strength, a code field; a form with its own validation and the combobox of the system; a CSV import (`DS.dom.dropzone`, rows through `flip`) | `SETUP.forms` |
| Data display | `DS.datagrid` (multi-sort, chooser, selection bar, row menu, inline edit, paging, export), `data-ds-chart` with new data, a tracker, a bar list, a tree, the JSON viewer | `SETUP.data` |
| Live data | tiles through `countUp`, rows through `flip` and `morphHtml` (`live`), input chips, the empty state, the side sheet | `SETUP.live`, Overlays |
| Overlays | the confirm dialog that stays busy, the side sheet stepping with `DS.motion.transition()`, a menu, snackbars with an undo, a popover, a toggletip | `SETUP.overlays` |
| Feedback | progress with its figure, a status that changes, loaders, alerts through `flip`, the steps of a job, an empty state | `SETUP.feedback` |
| Navigation | breadcrumbs that fold, tabs, steps driven by Back and Next, a segmented mode (`DS.a11y.roving`, `DS.indicator`), pages | `SETUP.navigation` |
| Layout | a split pane, dashboard panels on the auto-fit grid | `SETUP.layout` |
| People | personas, avatars with hues from the name, a group with "+N", badges and presence | `SETUP.people` |
| Content | a code block with files as tabs, Markdown rendered as you type, a diff, the log viewer | `SETUP.content` |
| Chat and AI | a transcript with a reasoning disclosure, a tool call, citations, feedback, the AI label; the thinking indicator and a streamed reply; suggestions into the composer | `SETUP.chat` |
| Theme it | presets, a seed of your own through the generator, palette style, contrast, shape and density, the appearance; the file a project would write | `SETUP.theme`, `theme.js` |
| Icons | the whole set, filtered through `flip`, copied on click | `SETUP.icons` |

`test/browser/demo.spec.js` sets up every stop and works each one in Chromium, Firefox, WebKit and the `fallback`
project, checks on a 360px phone that nothing passes the screen or its card, and measures the tour on a slow phone
with `DS_TOUR_PERF=1` (Chromium, 4x CPU, 390x844, alone): no task of the start or of a stop over 200ms; the dialog and
the grid sort answer within 400ms for now, the cost of the system (`DS.overlay`, `DS.motion.flip`, `DS.datagrid`; the
spec says where), down to 200ms once that is fixed.
