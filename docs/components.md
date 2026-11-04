# Components

Copy-paste markup for every component. `[icon check 16]` stands for the SVG that `DS.icons.icon(DS.icons.check, 16)`
returns ([icons.md](icons.md)). Behaviour (filtering a combobox, what an action does) is up to your scripts; opening
and closing overlays is `DS.overlay`'s ([motion.md](motion.md#dsoverlay-jsoverlayjs)). The classes and attributes
below are the contract the styles expect. The [styleguide](../styleguide/index.html) shows every
component live.

## Which component for which need

| Need | Use |
|---|---|
| The page frame: top bar, navigation, one scrolling content panel | [App frame](#app-frame): `.ds-app`, `.ds-topbar`, `.ds-drawer`, `.ds-panel` |
| Switch between two or three modes of the app | `.ds-segmented` in the top bar ([App frame](#app-frame)) |
| Switch a mode on the same page (list or map, day or week) | `.ds-segmented` with button options (`role="radio"`, `aria-checked`) in a page toolbar ([App frame](#app-frame)) |
| Many destinations in the drawer: groups that close, counts, a way back up, actions at the end of an item, a narrow rail | `.ds-drawer__group` as `<details>` with `.ds-drawer__toggle`, `.ds-drawer__count`, `.ds-drawer__back`, `.ds-drawer__row`, `data-drawer-collapsed` ([App frame](#app-frame)) |
| The page's title, search or actions in the top bar | `.ds-topbar__title`, `.ds-topbar__search`, `.ds-topbar__actions` ([App frame](#app-frame)) |
| Who is signed in | `.ds-account` in the top bar, or the outlined `.ds-account--capsule`; a person anywhere else: `.ds-avatar` ([App frame](#app-frame)) |
| A message for the whole app (offline, maintenance) | `.ds-banner` with a `.ds-alert`, above the view ([App frame](#app-frame)) |
| A full-page table, or a view that never scrolls (a chat, a terminal) | `.ds-view--fill`, `.ds-view--fixed` ([App frame](#app-frame)) |
| Page title, lead and the column layout of cards | [Page](#page): `.ds-page-head`, `.ds-stack` (one column), `.ds-grid-2` (two) |
| A record's page: the way back, status and actions next to the title | `.ds-page-head__back` or `.ds-breadcrumbs`, `.ds-page-head__row`, `__status`, `__actions` ([Page](#page)) |
| A page that loads, fails or is gone | the page states ([Page](#page)): a skeleton, `.ds-alert.ds-tone-error` with Retry, `.ds-empty` |
| Sections of one page or record (overview, history, settings) | [Tabs](#tabs) `.ds-tabs` (ARIA tabs, or links between pages of a record) |
| Tabs or segmented switch? | tabs change what the page shows (sections, with a panel each); a segmented switch changes how the same content shows (a mode, a view) |
| Where the user is in a form of several steps | [Steps](#steps) `.ds-steps` (marks with labels, or `--bar`) |
| Rendered rich text (Markdown, a help article) or a block of code | [Prose and code](#prose-and-code): `.ds-prose`, `.ds-code-block` |
| A sign-in or password page | `.ds-auth` with `.ds-auth__card` ([Page](#page)) |
| A block of related content | [Card](#card) `.ds-card`; a quieter block inside one: `.ds-card--filled` |
| A whole card opens something (a device, a report) | `.ds-card--interactive` on `<a>` or `<button>`, or on a `<div>` with a `.ds-card__action` link ([Card](#card)) |
| Any action | [Button](#button) `.ds-btn` with one variant; an action inside text or a table cell: `.ds-link-btn` |
| A smaller or larger control, a denser region, other corners, a meaning in colour, bigger targets for a finger | the option classes on the control or any container ([options.md](options.md)): sizes `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl`; density `.ds-density-comfortable`, `.ds-density-compact`, `.ds-density-dense`, `.ds-density-tight`; shape `.ds-shape-square`, `.ds-shape-soft`, `.ds-shape-default`, `.ds-shape-round`; tone `.ds-tone-neutral`, `.ds-tone-primary`, `.ds-tone-info`, `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` (with an icon or a word); touch `.ds-touch` |
| A view option that stays on or off (filter, compact view) | `.ds-btn--quiet` with `aria-pressed` ([Button](#button)) |
| A choice made once, then locked (a vote, a sent answer) | the pressed toggle with `aria-disabled="true"`: it keeps its on look ([Button](#button)) |
| A button whose label folds away on phones | `.ds-btn--adaptive` with `.ds-btn__label` and a `data-tip` ([Button](#button)) |
| A button that opens a panel, a dialog or a side sheet | `.ds-btn--disclosure` or `aria-haspopup="dialog"` with `aria-expanded`: tinted while open ([Button](#button)) |
| A secondary link next to the main one | `.ds-link--quiet`, `.ds-link-btn--quiet` ([Button](#button)) |
| A save that takes a moment, with a success moment after it | `.ds-btn__faces` and `DS.motion.busy()` ([Button](#button)) |
| An icon that turns into another (copy to check, play to pause) | `.ds-icon-swap`, `DS.motion.crossfade(el, icon, { kind: 'icon' })` ([Button](#button)) |
| Key figures at the top of a page | [Tiles](#tiles) `.ds-tiles`, `.ds-tile` |
| Filter by a figure | a `button.ds-tile` with `aria-pressed` ([Tiles](#tiles)) |
| Pick one of a few cards | `.ds-card--interactive` with `aria-pressed` (or `aria-checked`) ([Interactive card](#interactive-card)) |
| Label and value pairs | `.ds-kv-list` (rows) or `.ds-facts` (a grid, best with four) ([Lists](#lists)) |
| A short list of records that open | [Row list](#row-list) `.ds-list--interactive` with a `.ds-list__action` per row; more columns or bulk selection: a [Table](#table) |
| Label and value rows that open their record (an owner, a ticket) | `.ds-kv-list--interactive` with a `.ds-kv-list__row` link or button per row ([Lists](#lists)) |
| Shares per category as thin bars beside their figures | `.ds-kv-list--bars` with a `.ds-meter` per row ([Lists](#lists)) |
| The fields of a record, label beside value | `.ds-facts--rows` ([Lists](#lists)) |
| A value another system sets (a directory, a sync) | the value as text with `.ds-lock` and its reason, never a disabled field ([Lists](#lists)) |
| Hide advanced settings | [Disclosure](#disclosure) `.ds-disclosure` |
| Sections that open one at a time (questions, settings groups) | `.ds-disclosure--row` in a `.ds-disclosure-list`, one `name` for the group ([Disclosure](#disclosure)) |
| The history of a record | [Timeline](#timeline) `.ds-timeline` |
| Steps of a job (an import, a setup) | [Tasks](#tasks) `.ds-tasks` |
| A share as a thin bar | [Charts](#charts) `.ds-meter` |
| Counts per category | [Charts](#charts) `.ds-columns` with a `.ds-legend` for more than one series |
| Values over time | [Charts](#charts) `.ds-columns` (`--grouped` for two or more series per period, `--mini` beside a figure); lines and areas are the project's own |
| A run of short counts ("3 new · 1 updated") | `.ds-parts` ([Lists](#lists)) |
| Nothing to show yet | [Empty state](#empty-state) `.ds-empty` |
| A confirmation after a request or a finished job | `.ds-empty--done` ([Empty state](#empty-state)) |
| The state of one item (synced, failed, running) | [Status chip](#status-chip) `.ds-status` |
| A count on a button or chip | [Badge](#badge) `.ds-badge` (tones `--neutral`, `--ok`, `--warning`, `--error`) |
| A short label such as Preview | `.ds-tag` ([Status chip](#tags)) |
| A message about a page or section that stays | [Alert](#alert) `.ds-alert`; a list of errors to open: `.ds-errors` |
| Findings in a card | `.ds-alert--plain` alerts in the card, one per finding ([Alert](#alert)) |
| Short feedback after an action | [Snackbar](#snackbar) `.ds-toast` in `.ds-toasts` |
| Undo right after an action | a snackbar with `action: { label: 'Undo', onClick }` (`.ds-toast__action`, [Snackbar](#snackbar)) |
| Say a result to screen readers without showing a message | `DS.overlay.announce(text)` ([Snackbar](#snackbar)) |
| Unsaved edits of a view, saved or discarded together | [Save bar](#save-bar) `.ds-savebar` with `DS.overlay.savebar()` |
| A form's actions always in reach, inside its own scroller | [Save bar](#save-bar) `.ds-savebar--inline` |
| Records in rows and columns | [Table](#table) `.ds-table` in `.ds-table-wrap` |
| Rows that open their record | `.ds-table--interactive` with a `.ds-table__row-link` per row ([Table](#table)) |
| Pick several rows for one action (bulk selection) | a checkbox in each row and in the header cell; the row takes the selection colour ([Table](#table)) |
| More about one row without leaving the table | an expandable row: `.ds-table__toggle` and a `.ds-table__detail` row ([Table](#table)) |
| Editable rows on a phone or in a side sheet | `.ds-table--stack` (`--stack-wide` for five or more field columns): each row a block, each cell a label above its field ([Table](#stacked-rows)) |
| A full-page list of records with a header that stays | `.ds-table-wrap--fill` in a `.ds-view--fill`; a first column that stays while the others scroll: `.ds-table--pin-first` ([Table](#full-page-tables-and-pinned-columns)) |
| Actions of one row, a totals row | `td.ds-table__actions` at the row's end; a `<tfoot>` row ([Table](#row-actions-summary-rows-and-density)) |
| Act on the selected rows | `.ds-selection-bar` in the toolbar's place ([Table](#bulk-selection-bar)) |
| Records in pages | [Pagination](#pagination) `.ds-pagination` under the table |
| A strip wider than its panel (months, a row of cards) | [Horizontal scroller](#horizontal-scroller) `.ds-scroll-x` |
| A log that sticks to its end, with a "Latest" pill | `.ds-jump` and `DS.dom.followEnd()` ([Horizontal scroller](#horizontal-scroller)) |
| Data entry | [Form](#form): `.ds-form`, `.ds-form-grid`, `.ds-field`, `.ds-input`, `.ds-form-actions` |
| One choice from a short list | `<select class="ds-input">`; with an explanation per option: `.ds-radios` ([Form](#form)) |
| One choice from a long list, by typing | [Combobox](#combobox) `.ds-combo` |
| Choose one of a few big options | radio tiles: `.ds-radios--tiles` with `.ds-radio__icon` and `.ds-radio__mark` ([Form](#form)) |
| Confirm a live check under a field | `.ds-field__hint--success` with an icon ([Form](#form)) |
| Pick many values from a long set | `.ds-check-list` in a fieldset, with `.ds-check__count` ([Form](#form)) |
| A parent checkbox with its children | `.ds-check-group` ([Form](#form)) |
| A field and its button | `.ds-field__row` ([Form](#form)) |
| A unit or a reveal inside a field | `.ds-input-group` with `.ds-input-group__prefix`, `__suffix`, `__leading`, `__trailing` or a quiet icon button ([Form](#form)) |
| Pick a value on a scale | `.ds-slider` with a `.ds-slider__value` ([Form](#form)) |
| Edit a record's fields one under the other, and show what changed | `.ds-form--rows`, `.ds-field--changed`; a value that is read only: `.ds-field__value` ([Form](#form)) |
| A message with its send button (chat, comments) | `.ds-composer` ([Form](#form)) |
| A form on a phone | `.ds-form-actions--sticky` (the actions stay at the bottom); fields switch to 16px by themselves ([Form](#form)) |
| Pick one of a few rich options (a name with a meta or a share) | `.ds-combo--select`: the select-only combobox ([Combobox](#combobox)) |
| A yes/no value saved with the form | `.ds-check` ([Form](#form)) |
| A checkbox without a label row (a table column, a list item) | `.ds-checkbox` ([Form](#form)); in a `.ds-table` any bare checkbox is drawn the same |
| A setting that applies at once | [Switch](#switch) `.ds-switch` |
| A value set by another system | `.ds-switch--locked` with `aria-disabled` and the reason ([Switch](#locked)) |
| Many settings, each a switch | `.ds-switch-list` ([Switch](#switch-list)) |
| Active filters that remove themselves | input chips: `.ds-chip--input` buttons in a `role="group"` row ([Chips](#action-and-input-chips)) |
| Suggestions that act at once | action chips: `button.ds-chip`; long ones in `.ds-chips--wrap` ([Chips](#action-and-input-chips)) |
| Search and filter a list | `.ds-toolbar` with `.ds-search`, `.ds-filters`, [Chips](#chips) `.ds-chips`; in one row: `.ds-action-bar` ([Form](#form)) |
| Actions for one item or a toolbar overflow | [Menu](#menu) `.ds-menu` |
| Choose one of a few settings from a menu (sort by, density) | a `role="group"` with a `.ds-menu__heading` and `menuitemradio` items ([Menu](#menu)) |
| Confirm an action with consequences | [Dialog](#dialog) `.ds-dialog`; built for you: `DS.overlay.confirm()` ("A question with yes or no") |
| Keep a dialog or side sheet open while its action runs | `data-ds-busy` on the `.ds-dialog`, `.ds-sheet` or `.ds-drawer` ([Dialog](#dialog), "While its action runs") |
| Details or editing of one record next to its list | [Side sheet](#side-sheet) `.ds-sheet` |
| A form or a list taller than the window in a dialog | `.ds-dialog__body`: only the body scrolls, title and actions stay ([Dialog](#dialog)) |
| Pick one from a long list in a dialog | `.ds-dialog--lg` with a search, a `.ds-dialog__body` list and `--ds-dialog-height` ([Dialog](#dialog), "A search over a list") |
| A task that needs the whole phone screen | `.ds-dialog--full-narrow` (or `--full`) with a `.ds-dialog__head` ([Dialog](#dialog)) |
| Actions of a row on a phone | an action sheet: `.ds-dialog--bottom` with a `.ds-dialog__list` of menu items; a [Menu](#menu) at a desk ([Dialog](#dialog)) |
| Confirm by typing the name of what goes | a `.ds-dialog--lg` `alertdialog` with a field ([Dialog](#dialog), "Confirm by typing the name") |
| Filters or a form with its actions at the end of a side sheet | `.ds-sheet__foot`, and a live count in `.ds-sheet__subtitle` ([Side sheet](#side-sheet)) |
| Name an icon button, or say why a control is disabled | [Tooltip](#tooltip) `.ds-tooltip` |
| Waiting | [Loading](#loading): `.ds-loading` in a section, `.ds-skeleton` with `.ds-loadbar` for a page, `.ds-boot` at app start, `.ds-spinner--ink` in a busy button |
| A block of the page waits (a section, a sheet, the app start) against a small spot (a button, a chip, a cell) | the shape loader `.ds-loader` (in `.ds-boot`, `.ds-loading`) against the arc spinner `.ds-spinner` ([Loading](#loading)) |
| A long job with a known or unknown share | [Progress](#progress) `.ds-progress` (`--indeterminate`); round: `.ds-spinner--determinate` |
| Let people add files (by drop, the file dialog or paste) | [File upload](#file-upload): `.ds-dropzone` or the file field `.ds-input[type="file"]`, `DS.dom.dropzone()` |
| Let people reorder rows by drag or keyboard | [Reorder rows](#reorder-rows): `.ds-grip` in each row, `DS.motion.sortable()` |
| Content that opens and closes | `<details class="ds-collapsible">` ([Motion classes](#motion-classes)) |
| Something new appearing, a view's first render | [Motion classes](#motion-classes) and `DS.motion` ([motion.md](motion.md)) |
| Press feedback from the pointer on every action | [Ripple](#ripple): `DS.ripple.attach(document)` once (`.ds-ripples`) |
| A project element that acts on a press (a row, a tile of its own) | `.ds-pressable` ([Utilities](#a-pressable-element-of-your-own)) |
| Row or card actions that show on hover or focus | `.ds-hover-actions` ([Utilities](#actions-on-demand)) |
| A keyboard shortcut in text | `.ds-kbd` ([Utilities](#keys)) |
| A hairline between blocks, items or days | `.ds-divider` ([Utilities](#dividers)) |
| Bigger targets on a touch screen or kiosk | `.ds-touch` ([theming.md](theming.md#touch-screens)) |
| An icon toggle whose glyph fills when on (a rating) | `.ds-icon--fillable` in an `aria-pressed` button ([icons.md](icons.md#glyphs)) |
| An icon | `DS.icons` ([icons.md](icons.md)); brand logos stay in the project |

Nothing fits? If any dashboard could use it, add it to Dashboard-Style ([AGENTS.md](../AGENTS.md#making-a-change))
and update the copy; otherwise build it in the project with the project's own class prefix, from the tokens only
([rules.md](rules.md#code)).

Contents: [App frame](#app-frame) · [Page](#page) · [Tabs](#tabs) · [Steps](#steps) · [Button](#button) · [Card](#card) ·
[Tiles](#tiles) · [Disclosure](#disclosure) · [Lists](#lists) · [Timeline](#timeline) · [Tasks](#tasks) ·
[Prose and code](#prose-and-code) · [Empty state](#empty-state) · [Status chip](#status-chip) · [Badge](#badge) · [Alert](#alert) ·
[Table](#table) · [Form](#form) · [Chips](#chips) · [Switch](#switch) · [Combobox](#combobox) · [Menu](#menu) ·
[Dialog](#dialog) · [Side sheet](#side-sheet) · [Snackbar](#snackbar) · [Tooltip](#tooltip) · [Save bar](#save-bar) ·
[Loading](#loading) · [Progress](#progress) · [Charts](#charts) · [File upload](#file-upload) ·
[Reorder rows](#reorder-rows) · [Ripple](#ripple) · [Utilities](#utilities) · [Motion classes](#motion-classes)

## App frame

The Google console layout: a top bar and a navigation drawer on the tinted backdrop, one white content panel that
is the only scroller. At 900px and below the drawer becomes modal.

```html
<html class="ds-theme ds-base">
<body>
<div class="ds-app ds-app--drawer">
  <a class="ds-skip" href="#main">Skip to content</a>
  <div class="ds-topbar">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__menu" type="button" aria-label="Menu" aria-expanded="false">[icon menu 20]</button>
    <a class="ds-brand" href="/">[logo 32px] <span class="ds-brand__name">Product</span></a>
    <nav class="ds-segmented" aria-label="Mode">
      <a class="ds-segmented__option" href="/live" aria-current="true" data-label="Live">Live</a>
      <a class="ds-segmented__option" href="/admin" data-label="Admin">Admin</a>
    </nav>
    <div class="ds-account">
      <div class="ds-account__text"><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>
      <span class="ds-account__avatar" role="img" aria-label="Ada Lovelace, ada@example.org" tabindex="0" data-tip="Ada Lovelace, ada@example.org">A</span>
      <button class="ds-btn ds-btn--text" type="button">Sign out</button>
    </div>
  </div>
  <div class="ds-scrim"></div>                      <!-- before the drawer: it covers the page, not the drawer -->
  <nav class="ds-drawer" aria-label="Main" tabindex="-1">
    <div class="ds-drawer__head" aria-hidden="true">[logo] <span class="ds-brand__name">Product</span></div>
    <div class="ds-drawer__list">
      <div class="ds-drawer__group">
        <p class="ds-drawer__heading">Inventory</p>
        <a class="ds-drawer__item" href="/" aria-current="page">[icon overview 20]<span class="ds-drawer__label">Overview</span></a>
        <a class="ds-drawer__item" href="/devices">[icon laptop 20]<span class="ds-drawer__label">Devices</span></a>
      </div>
    </div>
  </nav>
  <div class="ds-panel">
    <main class="ds-view" id="main" tabindex="-1">
      <div class="ds-content"><div class="ds-page"> ... </div></div>
    </main>
  </div>
</div>
```

**Options** ([options.md](options.md)): classes on the part or any ancestor; the nearest wins. Put them on the group
(the drawer, the switch), so the pill and the track read the same values as the rows inside.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the drawer or the list; a `.ds-segmented`; an avatar | a drawer row 32 to 64px (8px per step, the pill with it); the switch 16 to 48px high (8px per step), its side padding 4px per step; an avatar 16 to 48px (8px per step); each with the size's type role, at the regular weight on rows and options (only the current one is heavier) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step on drawer rows (48, 44, 40, 36px) and the switch; type, side padding and avatars stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | multiplies the radius of drawer rows and the pill (rest and pressed), the switch and its press clip, the skip link, the account capsule, the panel's top corners, the modal drawer's open side and the avatar |
| Touch | `.ds-touch` | the theme or a container | drawer rows, the switch, the skip link and the brand link are at least `--ds-touch-target` (48px) whatever the size and density; the menu button's box moves the bar's padding and the modal drawer's lock-up with it |
| Tone | none | | the frame states no status; a banner's alert does |

The frame itself (the top bar's height, the drawer's and the rail's width, the panel's margins) is layout, set through
its roles (`--ds-topbar-height`, `--ds-drawer-width`, `--ds-drawer-rail-width`): no option moves it.

- `.ds-app--drawer` adds the drawer column; without it the panel takes the full width.
- State attributes on `.ds-app`: `data-drawer-open` (modal drawer shown), `data-drawer-hidden` (this view has no
  drawer), `data-scrolled` (the view is scrolled; a hairline appears at the panel's top edge and the top bar tints to
  `--ds-topbar-scrolled-bg`, default `--ds-surface-high`, over `--ds-dur-fast`; a theme sets the hook to
  `transparent` for a flat bar). Filled toolbar fields in the bar (`.ds-input--filled`, `.ds-search`) share that
  fill, so they step up to `--ds-surface-highest` while it is tinted and keep their container.
- Where scroll timelines exist (progressive: `animation-timeline`, `timeline-scope`), the hairline and the top bar's
  tint follow the scroll position themselves: both fade in over the first `--ds-space-2` (8px) of scroll. The
  hairline runs on `scroll(nearest block)`; the tint on the view's named timeline `--ds-view-scroll`, which
  `.ds-app` scopes to the bar (`timeline-scope`). The tint is a layer behind the bar's content (`.ds-topbar::before`),
  hidden in forced colours. Elsewhere `data-scrolled` shows both over `--ds-dur-fast`. Set `data-scrolled` in every
  engine (the filled fields read it) with `DS.dom.watchScrolled(view)` (2.0, [motion.md](motion.md#dsdom-jsdomjs)):
  it watches a 1px sentinel at the top of the view with an `IntersectionObserver` rather than a scroll listener, so
  the attribute changes twice per scroll and not on every event, and writes it on the `.ds-app`:

  ```js
  DS.dom.watchScrolled(document.querySelector('.ds-view'));   // data-scrolled on the .ds-app, owned state
  ```

  **Deprecated** (2.0): the 1.x hand recipe, a page's own `IntersectionObserver` on a sentinel that writes
  `target.toggleAttribute('data-scrolled', …)`. It still works in 2.x, and `tools/check-project.mjs` warns on it:
  delete the observer, the sentinel and the page's own `watchScrolled` function, and call
  `DS.dom.watchScrolled(view)` once.

  A scrolled view whose content shrinks until it no longer scrolls leaves its scroll timeline inactive, and Chromium
  and WebKit then keep the tint and the hairline at their last value. `DS.motion.resyncScroll(scroller)` restarts
  them ([motion](motion.md#scroll-driven-effects)); `DS.motion.transition()` calls it after every update, and
  `watchScrolled()` when the view is back at its top.
- A drawer item may be a `<button class="ds-drawer__item">` when it shows a section in place instead of loading a
  page; it loses the browser's button look. The active one also carries `aria-current="page"`.
- `.ds-drawer__list--overflow`: set it when the list is taller than the window, so its scrollbar stays visible;
  `DS.indicator.create(list, { ..., reveal: true })` sets it by itself and scrolls the list (only the list) so the
  current item stays clear of its edges and their shades (below).
- Cut edges (2.1): a list longer than the drawer shades each edge that has more to show, as a menu does: a sticky
  shade of the drawer's surface (`--ds-backdrop`), `--ds-scroll-fade` long (`0px` turns it off), above the items and
  the pill, taking no room (the list keeps `--ds-space-1` above its rows and `--ds-space-6` below them). Scroll
  timelines drive it; elsewhere call `DS.dom.scrollEdges(list, { axis: 'block' })` once, whose
  `data-ds-overflow-start` / `-end` show the shades over `--ds-dur-fast` (it follows rows that come and go). An item
  focused by the keys or revealed by `DS.indicator.create()` lands clear of the shades (`scroll-padding-block`, as
  long). Hidden in forced colours.
- Sliding pills: `DS.indicator.create(list, { active: '[aria-current="page"]', className: 'ds-drawer__indicator' })`
  and the same on `.ds-segmented` with `className: 'ds-segmented__indicator'`. The pill follows `aria-current` and
  the size of the items by itself ([motion](motion.md#dsindicator-jsindicatorjs)); no `update()` is needed. While it
  glides, the labels change colour on its timing (`--ds-indicator-dur`): the new label turns `--ds-on-accent` as its
  pill arrives, the old one fades back. The weight switches at once. Without the script the active item paints its
  own tint, and tint and label change in one frame.
- `data-label` on a segmented option (its text again) reserves the width of the heavier current weight, so the
  switch keeps its width when the current option changes. The option then stacks its content and the reserved copy
  in a column, so use it on an option whose content is its text (or wrap icon and text in one element); without it
  the switch behaves as before.
- One tab stop for a set (2.0): tabs, segmented options that are buttons and toggle buttons in a track take
  `DS.dom.roving(container, { items })` ([motion](motion.md#dsdom-jsdomjs)): Tab reaches the current item only, the
  arrow keys, Home and End move between the items and (by default) press the one they reach, so your click handler
  sets the state; `aria-disabled` items are reached, `disabled` ones skipped. Links in a `<nav>` (the drawer, a
  segmented switch of links) stay separate tab stops and need nothing.
- Scroll-spy with a programmatic smooth scroll: when a drawer link scrolls the view to its section, set the item
  current at once and ignore the scroll-spy (an `IntersectionObserver`) until the scroll ends: `scrollend` on the
  view where it exists, otherwise once no `scroll` event came for `DS.motion.motionDuration(view, '--ds-dur-fast')`
  (start that wait at the first `scroll` and restart it on each one: a busy page may start the smooth scroll late).
  A link to where the view already is mutes nothing, since no scroll follows. Otherwise the pill walks through every
  section on the way.
- The drawer coming back (a view that has it, after one without): remove `data-drawer-hidden`, then
  `DS.motion.enter(drawer)`. It slides in 24px from the left with a fade, like `.ds-enter--slide` (the same as
  `enter(drawer, 'slide')`).
- A view with or without the drawer as part of a navigation: toggle `data-drawer-hidden` inside
  `DS.motion.transition()` with the new view. With View Transitions (and `.ds-theme` on `<html>`) the panel morphs to
  its new width on the spring (`--ds-dur-long`) while the view's content keeps its size (never scaled), the docked
  drawer leaves to the left, accelerating (`--ds-dur-base`), or slides back in from there (`--ds-dur-long`); the top
  bar stays still. `enter(drawer)` inside the update stays quiet then (the transition plays the return), so one
  recipe serves both paths; without View Transitions the grid jumps and the drawer slides in through `enter()`.

  ```js
  DS.motion.transition(() => {
    const comesBack = page.hasDrawer && app.hasAttribute('data-drawer-hidden');
    app.toggleAttribute('data-drawer-hidden', !page.hasDrawer);
    if (comesBack) DS.motion.enter(drawer);
    view.querySelector(':scope > .ds-content').replaceWith(page.content);   // a .ds-content; the sentinel stays
    return page.content;
  });
  ```

  `transition()` sees the panel change its width and marks `<html>` with `data-ds-vt-morph` for that transition:
  only then do the panel and the view move over `--ds-dur-long`; a swap that keeps the drawer ends within
  `--ds-dur-slow`.
- The modal drawer is an opaque sheet: it opens on the spatial spring over `--ds-dur-long` while the scrim fades in,
  and closes accelerating over `--ds-dur-base` (`--ds-ease-exit`). A strip of its background left of it covers the
  spring's overshoot, so the scrim never shows at the screen edge. Opening or closing again mid-way continues from
  where it is.
- Press: drawer items and segmented options take their state layer in `--ds-dur-micro` and, with
  `DS.ripple.attach(document)`, the ripple ([Ripple](#ripple)). A drawer item turns squarer while pressed
  (`--ds-radius-action-pressed` times the shape, never rounder than at rest) and springs back on release; under the
  active item the pill morphs with it, and nothing moves. Its rest radius is half of the height it computes from
  `--ds-drawer-item-height` (48px at size md and comfortable), times the shape. A segmented option lies inside the
  clipping pill, so it morphs the clip of its state layer instead. An `aria-disabled="true"` drawer item shows no
  hover, press or ripple, but keeps its focus layer.
- Focus: drawer items and segmented options draw an inset ring (the list and the pill clip anything outside),
  solid from the first frame, that snaps inward from their edge in `--ds-dur-fast`, with the focus layer
  (`--ds-state-focus`).
- Navigate between views with [`DS.motion.transition(update, { type })`](motion.md#view-transitions) (1.5):
  `'fade-through'` between destinations of the drawer, `'forward'` / `'back'` for a step in a sequence,
  `'container'` from a card or row into its detail. Fetch first, then call it with a quick swap that returns the new
  content; with View Transitions (and `.ds-theme` on `<html>`) the view moves while the top bar stays still and the
  drawer's pill glides, elsewhere the returned element enters with `.ds-enter--swap`. Return the content element,
  never `view.firstElementChild` (that is the `data-scrolled` sentinel). From the modal drawer, close it inside the
  update: while it is open or still leaving, `transition()` leaves the page frame in the root snapshot, so the new
  view crossfades under the drawer and its scrim instead of popping in front of them.

  ```js
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    const html = await fetchView(link.href);          // fetch first: the page is frozen while a transition runs
    DS.motion.transition(() => {
      if (app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
      DS.dom.morphHtml(view, html, { replace: true }); // keeps the data-ds-keep sentinel
      setActive(link);                                 // aria-current: the pill follows by itself
      return view.querySelector(':scope > .ds-content');
    }, { type: 'fade-through' });
  });
  ```
- `.ds-view--leaving` fades the current view out quickly before you swap it (fade-through), the manual recipe that
  `transition()` replaces (it never waits before the update). It is **deprecated** (since 2.0, removed in 3.0 at the
  earliest) with this recipe: use `DS.motion.transition()`. A page that keeps it until then swaps in this order, so the new
  view never shows at full opacity for a frame and a second navigation during a swap ends on the latest content
  (the fade sits on the children, so wait on the content element, never on `view`, and never on
  `view.firstElementChild`, which is the sentinel):

  ```js
  let swaps = 0;
  const content = (view) => view.querySelector(':scope > .ds-content');
  async function swapView(view, html) {
    const run = ++swaps;
    view.classList.add('ds-view--leaving');
    // The fade sits on the children; settled() derives its own ceiling.
    await DS.motion.settled(content(view), { event: 'transitionend', property: 'opacity' });
    if (run !== swaps) return;                       // a newer swap took over
    DS.dom.morphHtml(view, html, { replace: true }); // keeps the data-ds-keep sentinel
    view.classList.remove('ds-view--leaving');       // in the same task as the entrance
    DS.motion.enter(content(view), 'swap');
  }
  ```

- `.ds-view` keeps a stable scrollbar gutter (`--ds-view-scrollbar-gutter`, default `stable`; `stable both-edges` for
  symmetric room, `auto` for none), so a classic scrollbar that appears never shifts the content. Overlay
  scrollbars need no room; Safari before 18.2 ignores it.
- Keyboard: the skip link is the first tab stop and shows only while focused. Drawer items are links or buttons, each a
  tab stop; a group's `<summary>` opens and closes it with Enter or Space. In the modal drawer focus stays inside, and
  Escape closes it and returns focus to the menu button. The rail's toggle is a button with `aria-pressed`; hover never
  expands the rail. A segmented switch of buttons is one tab stop (`DS.dom.roving()`); one of links keeps a stop per
  link.
- Narrow windows: the account shows `.ds-account__avatar` (give it a tooltip with name and email) below 720px. As a
  `role="img"` it shows that tooltip on a tap too ([Tooltip](#tooltip), "On touch screens"). With `tabindex` its disc
  keeps its size and its hit area is at least `--ds-target-min` under `.ds-touch`.
- With the keyboard up (2.0): on a phone the on-screen keyboard shortens the visual viewport, not the layout one.
  Call `DS.dom.followViewport()` once ([motion](motion.md#dsdom-jsdomjs)): it writes `--ds-viewport-height` (px) and,
  while the keyboard is up and a field has the focus, `data-ds-keyboard` on `<html>`, and `--ds-keyboard-inset` (px)
  for the snackbars, dialogs and side sheets (2.1.1: a centred dialog centres above the keyboard, a full-screen one
  and a side sheet end at its top edge, an action sheet sits on it; the scrim keeps covering the whole window), and
  puts the page back at its top where the browser scrolled or panned it for the keyboard (2.1.2: also the visual
  viewport Chrome on Android pans into the empty page under the frame). With `viewport-fit=cover`, a bottom inset the
  keyboard covers although the visual viewport counts it in (Chrome on Android) comes off the height and onto the
  inset (2.1.2), so a bar at the frame's foot stays above the keys. Nothing moves when there is no `visualViewport`.
- Open and close the modal drawer with `DS.overlay.open(drawer, { opener: menu })` and `DS.overlay.close(drawer)`
  ([motion.md](motion.md#dsoverlay-jsoverlayjs)): it sets `data-drawer-open` and `aria-expanded`, makes the rest of
  the app inert (not the scrim), locks the scroll (`.ds-no-scroll` on `<body>`, counted), focuses the current item
  (`aria-current="page"`; without one the drawer), closes on Escape and a scrim click (the first click, from
  `--ds-delay-dismiss` after the open) and gives focus back to the menu button; it acts only at 900px and below
  (`DS.overlay.DRAWER_QUERY`). `data-ds-busy` on the drawer keeps it open while its action runs (as for the
  [Dialog](#dialog)). By hand as before: toggle `data-drawer-open` and add `.ds-no-scroll` to `<body>` (with
  `.ds-base`) while the modal drawer is open.
- When the window crosses 900px the drawer changes between docked and modal in place: add `.ds-drawer--instant` to
  the drawer for two frames, so it neither slides nor fades its scrim, and close a modal drawer that the wider
  window no longer shows. `DS.overlay` does both by itself for every `.ds-app > .ds-drawer` of the page from load on
  (1.6.1), so a page that opens and closes the drawer through it needs nothing more; only a page that drives the
  drawer by hand uses this snippet:

  ```js
  const modal = matchMedia(DS.overlay.DRAWER_QUERY);     // '(max-width: 900px)'
  modal.addEventListener('change', () => {
    drawer.classList.add('ds-drawer--instant');
    if (!modal.matches) {
      app.removeAttribute('data-drawer-open');
      document.body.classList.remove('ds-no-scroll');
      menu.setAttribute('aria-expanded', 'false');
    }
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.remove('ds-drawer--instant')));
  });
  ```

### Segmented options as buttons

A mode of the same page (a list or a map, day or week) is a segmented switch of buttons, anywhere on the page. It
takes its start margin (`--ds-space-4`, `--ds-space-2` on phones) only in the top bar; in a page toolbar it sits
flush. Button options lose the browser's button look.

```html
<div class="ds-segmented" role="radiogroup" aria-label="View">
  <button class="ds-segmented__option" type="button" role="radio" aria-checked="true" data-label="List">List</button>
  <button class="ds-segmented__option" type="button" role="radio" aria-checked="false" tabindex="-1" data-label="Map">Map</button>
  <button class="ds-segmented__option" type="button" role="radio" aria-checked="false" tabindex="-1" aria-disabled="true" data-label="Chart">Chart</button>
</div>
```

```js
DS.indicator.create(group, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' });
DS.dom.roving(group, { items: '.ds-segmented__option' });   // arrow keys, Home and End; a click selects
group.addEventListener('click', (event) => {
  const option = event.target.closest('.ds-segmented__option');
  if (!option || option.getAttribute('aria-disabled') === 'true') return;
  for (const other of group.querySelectorAll('.ds-segmented__option')) other.setAttribute('aria-checked', String(other === option));
  showView(option.dataset.label);
});
```

- Selected: `aria-current="true"` on links, `aria-checked="true"` on radios, `aria-pressed="true"` on toggle buttons;
  the tint (or the gliding pill), the label weight and the attribute, never colour alone.
- Blocked: `:disabled` or `aria-disabled="true"` takes the disabled model (`--ds-disabled-ink`,
  `--ds-disabled-opacity`, faded on `--ds-dur-fast`) and shows no hover, press or morph; `aria-disabled` keeps its
  focus layer (give it a `data-tip` that says why).
- `--ds-segmented-height` (32px, the whole track at size md and comfortable) takes 8px per size step and 4px per density
  step; `.ds-touch` makes it at least 48px. `--ds-segmented-padding-x` (default `--ds-space-4`, 4px more per size step)
  narrows the options of a tight switch; `--ds-segmented-font` sets its type.
- Forced colours: the selected option is `SelectedItem` / `SelectedItemText` (a choice in a set), a focused one keeps
  a `CanvasText` ring inside its fill; the pill is hidden there, blocked options are `GrayText`.

### Drawer parts

```html
<nav class="ds-drawer" aria-label="Main" tabindex="-1">
  <div class="ds-drawer__head" aria-hidden="true">[logo] <span class="ds-brand__name">Product</span></div>
  <div class="ds-drawer__back">
    <a class="ds-drawer__item" href="/devices" data-tip="All devices">[icon arrowLeft 20]<span class="ds-drawer__label">All devices</span></a>
  </div>
  <div class="ds-drawer__actions"><a class="ds-btn ds-btn--tonal" href="/devices/new">[icon plus 18]New device</a></div>
  <div class="ds-drawer__list">
    <details class="ds-drawer__group ds-collapsible" open>
      <summary class="ds-drawer__heading ds-drawer__toggle" data-tip="Tickets">[icon chevronDown 20 .ds-chevron]<span>Tickets</span><span class="ds-drawer__count" aria-hidden="true">5</span></summary>
      <a class="ds-drawer__item" href="/tickets" aria-current="page" data-tip="Open tickets">[icon ticket 20]<span class="ds-drawer__label">Open</span><span class="ds-drawer__count"><span class="ds-sr">, </span>3</span></a>
      <div class="ds-drawer__row">
        <a class="ds-drawer__item" href="/tickets/waiting" data-tip="Waiting">[icon clock 20]<span class="ds-drawer__label">Waiting</span><span class="ds-drawer__count"><span class="ds-sr">, </span>2</span></a>
        <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-drawer__action ds-hover-actions" type="button" aria-label="Options for Waiting" data-tip="Options">[icon moreVertical 18]</button>
      </div>
      <details class="ds-drawer__group ds-collapsible">             <!-- nested, 2-3 levels -->
        <summary class="ds-drawer__heading ds-drawer__toggle" data-tip="Archive">[icon chevronDown 20 .ds-chevron]<span>Archive</span></summary>
        <a class="ds-drawer__item" href="/tickets/2025" data-tip="2025">[icon history 20]<span class="ds-drawer__label">2025</span></a>
      </details>
    </details>
  </div>
  <div class="ds-drawer__foot ds-drawer__foot--pinned">
    <a class="ds-drawer__item" href="/settings" data-tip="Settings">[icon settings 20]<span class="ds-drawer__label">Settings</span></a>
  </div>
</nav>
```

- `.ds-drawer__back`: a way up (from a record back to its list), between the head and the list, with a hairline under
  it inset to the text edge. Its item is a normal `.ds-drawer__item` that never carries `aria-current` and sits
  outside the pill's track. Above 900px a docked drawer with a back item hides the page head's back link
  (`.ds-page-head__back`), so the page shows one of them; the modal drawer leaves it to the page head.
- `.ds-drawer__actions` (above the list, a primary action) and `.ds-drawer__foot` (below it, clear of the home
  indicator of an installed app). The foot is pinned: the list takes the rest of the height and scrolls itself, the foot
  never scrolls away. `.ds-drawer__foot--pinned` adds a hairline above it, inset to the text edge, so a long list reads
  as passing behind it. A current item in the foot paints its own tint (the pill's track is the list).
  `.ds-drawer__foot--rail` lays its items out icon-only in a row: their labels are visually hidden but read, and each
  item names itself with `data-tip`.
- Nested groups: a `.ds-drawer__group` inside a group, 2-3 levels, each one plain or a `<details>` that closes. Its heading
  and items indent by `--ds-drawer-indent` (`--ds-space-8`) per level, as padding: the state layer, the ring and the pill
  keep the row's full width, and the pill follows the current item across levels. The rail drops the indent, so give
  nested items an icon.
- `.ds-drawer__count`: a count at the end of an item or a group heading (tabular figures, the meta role, the item's
  colour). A `.ds-sr` separator reads it with the label ("Open, 3"). On a group heading it shows only while the group is
  closed (mark that one `aria-hidden`: its items say it).
- Collapsible groups: `<details class="ds-drawer__group ds-collapsible">` with a `<summary class="ds-drawer__heading
  ds-drawer__toggle" data-tip="...">`. The heading is a pressable row of the item's height (`--ds-drawer-item-height`)
  and of the size's type (`--ds-drawer-font`) in the label weight: state layer,
  ring snap, press morph and ripple; the chevron turns with the group, and the group opens and closes with the
  `.ds-collapsible` timing. The pill follows the current item across groups; an item inside a closed group has no pill
  (it contracts, and comes back when the group opens). Keep the open groups across loads in the page (`open`).
- `.ds-drawer__row` holds an item and a `.ds-drawer__action`, a quiet small icon button at the item's end (the item
  keeps room for it at the action's size, `--ds-btn-sm-icon-size`, so also under `.ds-touch`). With `.ds-hover-actions` the action shows on hover, focus, the current item and an open menu, and
  always on touch; it stays in the tab order.
- `<a>` drawer items no longer flash on tap in iOS (`-webkit-tap-highlight-color` on every item).
- Type: `--ds-drawer-font` (default the size's role, else `--ds-font-body`), always at the regular weight; the current
  item alone takes the label weight.
- Forced colours: the current item is `SelectedItem` / `SelectedItemText` (with its icon), a focused current item
  keeps a `CanvasText` ring inside its fill, and an `aria-disabled` item is `GrayText`; the outline is for focus only. A
  `.ds-drawer__action` over a current item lies on that fill and takes `SelectedItemText`.

### The rail

`data-drawer-collapsed` on `.ds-app` turns the docked drawer (above 900px) into a rail of `--ds-drawer-rail-width`
(72px): items become 48px squares (circles by the pill rule), labels, headings and counts are visually hidden but
read, row actions go, and the pill follows by itself. The `data-tip` of each item and each group toggle names it there:
its visible text is gone, so the tooltip shows. The column switches at once; the labels fade back in on `--ds-dur-fast` when it widens again
(no layout animation; View Transitions stay for navigation). The modal drawer at 900px and below is unaffected. Hover
never expands the rail: only its toggle does. Items are squares of the height the options compute, on the rail's axis,
as wide as the column allows.

The toggle is the top bar's menu button: with `aria-pressed` it also shows above 900px, on the drawer icons' axis.
The page sets the attribute, keeps it across loads and leaves the modal drawer to `DS.overlay` below 900px:

```js
const wide = matchMedia('(min-width: 901px)');
menu.addEventListener('click', () => {
  if (!wide.matches) return DS.overlay.open(drawer, { opener: menu });
  const collapsed = !app.hasAttribute('data-drawer-collapsed');
  app.toggleAttribute('data-drawer-collapsed', collapsed);
  menu.setAttribute('aria-pressed', String(collapsed));
  localStorage.setItem('drawer', collapsed ? 'rail' : 'full');
});
```

### Top bar parts

```html
<div class="ds-topbar">
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__menu" type="button" aria-label="Menu" aria-expanded="false">[icon menu 20]</button>
  <a class="ds-brand" href="/">[logo 32px] <span class="ds-brand__name">Product</span></a>
  <h1 class="ds-topbar__title">LAPTOP-0042</h1>                     <!-- or a search: -->
  <div class="ds-topbar__search"><div class="ds-search"> ... </div></div>
  <div class="ds-topbar__actions">
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Help" data-tip="Help">[icon info 20]</button>
  </div>
  <div class="ds-account ds-account--capsule">
    <div class="ds-account__text" aria-hidden="true"><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>
    <span class="ds-account__avatar" role="img" aria-label="Ada Lovelace, ada@example.org" tabindex="0" data-tip="Ada Lovelace, ada@example.org">A</span>
    <span class="ds-account__divider"></span>
    <button class="ds-btn ds-btn--text" type="button">Sign out</button>
  </div>
</div>
```

- `.ds-topbar__title`: a page title in the bar (an `h1`, for apps whose views have no page head of their own): it takes
  the room between the brand and the account, in the subtitle role with an ellipsis; at 600px and below it takes the
  label role in up to two lines, and the brand's name gives way (its mark stays).
- `.ds-topbar__search`: a search centred in the bar, at most `--ds-topbar-search-max` (720px) wide; the account and
  actions after it take no auto margin. Hidden below 720px: offer the search in the view there.
- `.ds-topbar__actions`: icon buttons with `data-tip`, at the end of the bar (before the account).
- A brand of only a name (no mark) lines its text up with the drawer's icon edge and keeps the name on phones. Between
  601 and 900px a bar without the drawer starts at `--ds-space-4`, like the panel. The menu button never shrinks.
  Under `.ds-touch` the brand link is at least `--ds-touch-target` (48px) wide and tall.
- `.ds-account--capsule`: the account as one outlined pill (`--ds-line`, `--ds-surface`): the avatar first at every
  width and the only carrier of the name (`role="img"`, `aria-label`, `data-tip`; a tap shows the tip), the text
  `aria-hidden` beside it (at most `--ds-account-text-max`, 240px; hidden below 720px), `.ds-account__divider` and a
  text button. The divider goes with a `[hidden]` sign-out button. Without a shown sign-out button (none in the markup,
  or `hidden`) the capsule ends with the room it starts with: `--ds-space-4` after the text, a round capsule around
  the avatar below 720px. `.ds-account__email:empty` takes no room.

### Avatar

```html
<span class="ds-avatar" role="img" aria-label="Ada Lovelace">A</span>                      <!-- the initial -->
<span class="ds-avatar ds-sm" aria-hidden="true">A</span> Ada Lovelace                      <!-- next to the name -->
<img class="ds-avatar" src="/people/ada.jpg" alt="">                                        <!-- a picture -->
```

A disc on the tint (`--ds-accent` / `--ds-on-accent`) of `--ds-avatar-size` (32px at size md, 8px per size step: `.ds-xs`
16, `.ds-sm` 24, `.ds-lg` 40, `.ds-xl` 48px), the initial in the size's role, a picture covering it. The shape multiplies
its radius (square at `.ds-shape-square`). `.ds-account__avatar` is the same disc. No status dot: a status goes next to
the name as a word. Forced colours keep its edge.

`.ds-avatar--sm` and `.ds-avatar--lg` are **deprecated** (3.0, removed when 3.0 ships): `.ds-sm` and `.ds-lg`, also on any
ancestor. Until then they keep the fixed 2.x discs (24 and 40px).

### A message for the whole app

```html
<div class="ds-panel">
  <div class="ds-banner">
    <div class="ds-alert ds-tone-warning" role="status">[icon wifiOff 20]<span class="ds-alert__text">You are offline. Changes are saved when the connection is back.</span><button class="ds-btn ds-btn--text ds-sm" type="button">Retry</button></div>
  </div>
  <main class="ds-view" id="main" tabindex="-1"> ... </main>
</div>
```

`.ds-banner` is the first child of `.ds-panel`, above the view and outside its scroll; the alert runs to the panel's
edges and keeps only the panel's top corners. `role="status"` for a notice, `role="alert"` only when it is urgent. It
comes and goes through `DS.motion.flip(panel, () => panel.prepend(banner), { items: ':scope > *' })` (and
`banner.remove()` inside `flip()` to go): the view glides, the banner fades in place, no height animates. It does not
print.

### Views that fill, views that never scroll

- `.ds-view`, `.ds-drawer__list` (and `.ds-sheet__body`) are positioned (`position: relative`, no stacking context:
  sticky parts and the view's hairline are unaffected), so an absolute element of the page stays inside its scroller,
  and a `.ds-sr` label without a closer positioned ancestor sits at the top of the view's content instead of the
  document's. `offsetParent` of elements inside a view is the view.
- The page pad properties `--ds-content-pad-x`, `--ds-content-pad-top` and `--ds-content-pad-bottom` (read them,
  never set them) are defined on `.ds-view` too, with the same values as on `.ds-content`, for parts of the view outside
  the content (a bar pinned to the view's bottom).
- `.ds-view--fill`: where there is room (from 601px wide and 720px tall) the view stops scrolling; its content and
  page become flex columns (the page gap stays) and the page's last shown child fills the rest, a
  `.ds-table-wrap--fill` with its sticky header. The content's bottom padding drops to `--ds-space-6`. Below that the
  view scrolls as usual and a fill table is capped a little under the window's height. The filling child scrolls
  itself (a scroller, or a flex column with `min-height: 0`).
- `.ds-view--fixed`: the view never scrolls and has no gutter; the page's last shown child takes the rest and scrolls
  itself (a chat, a terminal, a map).
- The frame is as tall as `--ds-viewport-height` (written on `<html>` by `DS.dom.followViewport()`, the visual
  viewport's height while the on-screen keyboard is up), else `100dvh`. `.ds-app--keyboard-hides-bar` hides the top
  bar while `<html>` carries `data-ds-keyboard`, so the view keeps the field and its context in sight. An embedded
  widget never calls `followViewport()`: the host page owns the viewport.

**Motion:** the [Navigation](motion.md#navigation) table (indicator, drawer, modal drawer, segmented, top bar) and [Views](motion.md#views) in motion.md.
## Page

The padded content area, one page of cards and its head: back link or breadcrumbs, title, status, actions, key facts
and tabs.

```html
<div class="ds-content">                         <!-- padding; container "ds-content" -->
  <div class="ds-page">                          <!-- max --ds-content-max, 20px rhythm -->
    <header class="ds-page-head">
      <h1 class="ds-page-head__title" tabindex="-1">Devices</h1>
      <p class="ds-page-head__lead">Every laptop and desktop, synced nightly.</p>
    </header>
    <div class="ds-stack"> card, card ... </div>  <!-- one column -->
    <div class="ds-grid-2"> card, card </div>      <!-- two columns, one below 900px -->
  </div>
</div>
```

The page's width (not the window's) decides when grids, facts and tables narrow: those are container queries on
`.ds-content`, so the persistent drawer counts.

- `.ds-stack` spaces its children by `--ds-stack-gap` (`--ds-space-4`); a stack directly in the page, and
  `.ds-stack--page` wherever it sits, by `--ds-stack-gap-page` (`--ds-space-5`, the page's rhythm). A lone `.ds-btn`
  directly in `.ds-page` or `.ds-stack` keeps its own width.
- Options ([options.md](options.md)): size, density, shape and tone reach the controls inside the page, each of which
  computes its own. The page's own rhythm, padding and head stay: they are layout, set through the spacing tokens and the
  hooks. Only the breadcrumbs read options themselves (below).
- `.ds-content` exposes its padding as `--ds-content-pad-top`, `--ds-content-pad-x` and `--ds-content-pad-bottom`
  (read them, never set them; `.ds-view` defines the same).

### A record's page head

```html
<header class="ds-page-head">
  <a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="/devices">[icon arrowLeft 18]<span class="ds-sr">Back to </span>Devices</a>
  <div class="ds-page-head__row">
    <div class="ds-page-head__text">
      <h1 class="ds-page-head__title" tabindex="-1">LAPTOP-0042</h1>
      <p class="ds-page-head__lead">Laptop 14 · issued to Ada Lovelace</p>
      <div class="ds-page-head__status"><span class="ds-status ds-tone-success">[icon check 16]<span>Synced</span></span></div>
    </div>
    <div class="ds-page-head__actions">
      <button class="ds-btn" type="button">Retire</button>
      <button class="ds-btn ds-btn--filled" type="button">Edit</button>
    </div>
  </div>
  <dl class="ds-page-head__details">
    <div class="ds-page-head__detail"><dt>Owner</dt><dd>Ada Lovelace</dd></div>
    <div class="ds-page-head__detail"><dt>Last sync</dt><dd>Today, 09:12</dd></div>
  </dl>
  <div class="ds-page-head__tabs">
    <nav class="ds-tabs ds-tabs--flush" aria-label="LAPTOP-0042"> ... </nav>
  </div>
</header>
```

- `.ds-page-head__back`: the way back to the list, a small text button whose label lines up with the title; the
  `.ds-sr` prefix reads "Back to Devices". A docked drawer with a `.ds-drawer__back` item hides it above 900px.
- `.ds-page-head__row` wraps: `.ds-page-head__text` (title, lead, `.ds-page-head__status`) takes
  `--ds-page-head-text-basis` (320px) and grows; `.ds-page-head__actions` sit at the row's end on the title's centre
  line (`--ds-page-head-title-line`, the headline's 32px line) and start under the title at 600px of the content.
- A text button (`.ds-btn--text`) in the actions hangs its padding into the gutter, as in a card's link row: the last
  one's text ends on the content edge the cards share, and under the title the text of a text button that comes
  first starts on the title's edge. Outlined and filled buttons keep their place, and so do the buttons after the
  first under the title (8px apart, as on a wide page) and a `.ds-btn--adaptive` while it is folded into a round icon
  button.
- `.ds-page-head__details` is a row of key facts under the title row: `.ds-page-head__detail` holds a `dt` in the meta
  role over its `dd` in the body role (tabular figures; a long value breaks). It wraps, and it prints.
- `.ds-page-head__tabs` holds the record's [Tabs](#tabs) as the head's last row: the head's gap plus `--ds-space-3`
  under the rest, 16px in all.
- Empty parts take no room (`:empty`: the head, the lead, the status, the actions, the details and the tabs). The lead's
  figures are tabular. Print leaves out the back link and the actions.

### Breadcrumbs

```html
<nav class="ds-breadcrumbs" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Inventory</a></li>
    <li><a href="/devices">Devices</a></li>
    <li><a href="/devices/42" aria-current="page">LAPTOP-0042</a></li>
  </ol>
</nav>
```

In the page head's first row instead of the back link (one or the other). Inline links in the label role and
`--ds-text-2`, underlined, with the link focus ring and no ripple; a chevron (a `chevronRight` mask) between them, in
`CanvasText` under forced colours; each item ends in an ellipsis past `--ds-breadcrumbs-item-max` (240px); the last is
the page itself (`aria-current="page"`, the text colour). At 600px of the content only the parent shows: the way up.
Type follows the size (`--ds-breadcrumbs-font`, default the size's role, else `--ds-font-label`), and under `.ds-touch` a
link is at least `--ds-touch-target` high. Keyboard: each link is a tab stop.

### Page states

A page that loads, fails or is gone says so in its body; the page head stays where it can:

- **Loading:** the body as a skeleton (`.ds-skeleton` with its note, [Loading](#loading)) under a `.ds-loadbar`.
- **Failed:** a `.ds-tone-error` with the reason and a Retry button (`.ds-btn--text`) in place of the body.
- **Gone** (deleted, no access): `.ds-empty` with a way back.

The page hides its body by an attribute of its own (`hidden` on the body, `data-state` is `DS.overlay`'s); never
leave a stale body visible under the state.

### Sign-in page

```html
<body class="ds-auth">                      <!-- in <html class="ds-theme ds-base"> -->
  <div class="ds-auth__alert"><div class="ds-alert ds-tone-error" role="alert">[icon alertCircle 20]<span class="ds-alert__text">The password is wrong.</span></div></div>
  <section class="ds-card ds-card--elevated ds-auth__card" aria-labelledby="auth-title">
    <h1 class="ds-card__title" id="auth-title">Sign in</h1>
    <form class="ds-form"> ...fields... <div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Sign in</button></div></form>
  </section>
</body>
```

`.ds-auth` is a page that is one centred card on the backdrop, at least the window's height, within the safe areas.
`.ds-auth__card` is `--ds-auth-width` (400px) wide at most; `.ds-auth__alert`, the slot above it, takes no room while
empty; the primary action takes the card's width.

### Page outside the frame

A page without `.ds-app` (a wizard, a sign-in page, an embedded flow) marks its view with `.ds-vt-view` (2.0), so
`DS.motion.transition()` moves between its steps like between the views of the frame: named `ds-view` only while a
transition runs, and without View Transitions the new step (its first child) enters with `.ds-enter--swap`. One per
page, never inside `.ds-app`.

```html
<main class="ds-vt-view" tabindex="-1">
  <section class="ds-page"><h1 class="ds-page-head__title" tabindex="-1">Step 1 of 3</h1> ... </section>
</main>
```

```js
DS.motion.transition(() => { DS.dom.morphHtml(view, renderStep(2)); return view.firstElementChild; }, { type: 'forward', focus: true });
```
## Tabs

Sections of one page or record. ARIA tabs show one panel at a time; link tabs move between pages of a record.

```html
<div class="ds-tabs" role="tablist" aria-label="Device">
  <button class="ds-tabs__tab" role="tab" type="button" id="t-details" aria-selected="true" aria-controls="p-details" data-label="Details">Details</button>
  <button class="ds-tabs__tab" role="tab" type="button" id="t-history" aria-selected="false" aria-controls="p-history" tabindex="-1" data-label="History">History<span class="ds-tabs__count"><span class="ds-sr">, </span>3</span></button>
</div>
<div class="ds-tabs__panel" role="tabpanel" id="p-details" aria-labelledby="t-details" tabindex="0"> ... </div>
<div class="ds-tabs__panel" role="tabpanel" id="p-history" aria-labelledby="t-history" tabindex="0" hidden> ... </div>

<!-- link tabs -->
<nav class="ds-tabs" aria-label="Device">
  <a class="ds-tabs__tab" href="/devices/42" aria-current="page" data-label="Details">Details</a>
  <a class="ds-tabs__tab" href="/devices/42/history" data-label="History">History</a>
</nav>

<!-- a tray; the selected tab a surface pill -->
<div class="ds-tabs ds-tabs--contained" role="tablist" aria-label="Range"> ... </div>

<!-- a column beside its panels -->
<div class="ds-tabs__columns">
  <div class="ds-tabs ds-tabs--vertical" role="tablist" aria-orientation="vertical" aria-label="Settings"> ... </div>
  <div> panels </div>
</div>

<!-- a tab that closes: a wrapper, so the close button is no child of the tab; the button is for the pointer -->
<span class="ds-tabs__item" role="none">
  <button class="ds-tabs__tab" role="tab" type="button" id="t-report" aria-selected="false" aria-controls="p-report" tabindex="-1" aria-keyshortcuts="Delete" data-label="Report">Report</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs ds-tabs__close" type="button" tabindex="-1" aria-hidden="true" data-tip="Close">[icon close 16]</button>
</span>
<!-- ... and in its panel, the named action everyone else reaches -->
<div class="ds-tabs__panel" role="tabpanel" id="p-report" aria-labelledby="t-report" tabindex="0" hidden>
  ...
  <button class="ds-btn ds-btn--text" type="button">Close Report</button>
</div>
```

**Options** ([options.md](options.md)): classes on the row or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `--line` (default), `--contained`; `--vertical`, `--fill`, `--flush` | the row | the look; `--vertical` combines with either look, `--fill` and `--flush` with a row |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the row or a group | 32, 40, 48, 56, 64px high (8px per step), side padding 8 to 24px (4px per step), the size's type role at the regular weight (the selected tab alone takes the label weight) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (48, 44, 40, 36px at md); side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | multiplies the ring's radius, the state layer's (rest and pressed) and the contained tray's and pill's |
| Touch | `.ds-touch` | the theme or a container | a tab is at least `--ds-touch-target` (48px) high whatever the size and density; so is the close button, and the tab keeps room for it |
| Tone | none | | a tab states no status; a word or a `.ds-badge` in it may |

```js
DS.indicator.create(tabs, { active: '[aria-selected="true"], [aria-current="page"]', className: 'ds-tabs__indicator', reveal: true });
DS.dom.roving(tabs);                                   // arrow keys, Home and End move focus and select
tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (!tab || tab.getAttribute('aria-disabled') === 'true') return;
  for (const other of tabs.querySelectorAll('[role="tab"]')) {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
  }
  DS.motion.enter(document.getElementById(tab.getAttribute('aria-controls')), 'swap');
});
```

- A row of `--ds-tabs-height` (48px at size md and comfortable) over a `--ds-line` hairline (`.ds-tabs--line` names this
  look explicitly); labels in the size's role (`--ds-tabs-font`) at the regular weight in `--ds-text-2`, side padding
  `--ds-tabs-padding-x`. The selected tab takes `--ds-primary` ink, the label weight and the bar: a
  `--ds-tabs-indicator-height` (3px) bar in `--ds-tabs-indicator-color` (`--ds-primary`) at its bottom that glides
  between the tabs (`DS.indicator`, `.ds-tabs__indicator`). Selected is bar, weight and ARIA. `data-label` (the
  tab's text again) keeps the width of the heavier weight, so nothing moves; an icon before the text, a
  `.ds-tabs__count` or a `.ds-badge` after it keeps its place.
- `.ds-tabs--contained`: a tray (`--ds-tabs-contained-bg`, `--ds-surface-high`) as wide as its tabs, the selected tab a
  pill of `--ds-surface` that glides inside it (the same indicator). The tab gives up the tray's padding, so the row is
  as high as a line row. Selected is pill, ink, weight and ARIA.
- `.ds-tabs--vertical`: a column with the hairline and the bar at its end, labels at its start (with `--contained` a
  tall tray). Set `aria-orientation="vertical"` and call `DS.dom.roving(tabs, { orientation: 'vertical' })`.
  `.ds-tabs__columns` lays it out beside the panels, and over them at 600px of the content.
- `.ds-tabs__count`: a count after the label (tabular figures, the meta role, the tab's colour). A `.ds-sr` separator
  reads it with the label ("History, 3"). A `.ds-badge` is for news that needs the eye.
- A tab that closes: `.ds-tabs__item` (`role="none"`) holds the tab and a `.ds-tabs__close`, a quiet extra-small icon
  button lying over the tab's end; the tab keeps room for it, also under `.ds-touch`. The page removes the tab and its
  panel and moves the focus before the closing control goes: when the selected tab closes it selects a neighbour and
  focuses it; when another tab closes, the focus goes to the selected tab and the selection stays. The button is for the
  pointer alone: a tablist owns only tabs, so it is `tabindex="-1"` and `aria-hidden="true"`, with no name of its own.
  Delete on the tab closes it (`aria-keyshortcuts="Delete"` says so), and the tab's panel holds a named close action,
  the one way for a screen reader on a touch screen.
- Press: the state layer is a pill inside the tab that turns squarer while pressed and springs back, with the ripple
  (`DS.ripple.attach()`); the keyboard ring is inset and snaps inward. `:disabled` and `aria-disabled="true"` take the
  disabled model (no hover, press or morph; `aria-disabled` keeps its focus layer).
- Switching: the page toggles `hidden` on the panels and enters the new one (`DS.motion.enter(panel, 'swap')`). Link
  tabs are navigation: `DS.motion.transition(update, { type: 'fade-through' })` ([Views](motion.md#views)).
- Overflow: the row scrolls sideways without a scrollbar (add `.ds-scroll-x` for its edge fades); `DS.dom.roving()`
  scrolls a focused tab into view, and `reveal: true` keeps the selected one in view.
- `.ds-tabs--fill`: equal widths across the row. `.ds-tabs--flush`: no hairline (the tabs sit on a card's edge).
- A panel that holds nothing focusable keeps `tabindex="0"`, so a keyboard reaches its content.
- Keyboard: ARIA tabs are one tab stop (`DS.dom.roving()`): Left and Right (Up and Down in a vertical row), Home and End
  move and select, a disabled tab is skipped, an `aria-disabled` one takes the focus and keeps its panel; Delete closes
  a tab that closes; Tab goes on to the panel. Link tabs keep a stop per link. Names: the row's `aria-label`, `aria-controls` and `aria-labelledby` between
  tab and panel, `aria-current="page"` on the current link.
- Forced colours: the selected tab is `SelectedItem` / `SelectedItemText` (a choice in a set) and the indicator is
  hidden; a focused selected tab keeps a `CanvasText` ring inside; blocked tabs are `GrayText`; the contained tray keeps
  a `CanvasText` edge; the close button of a selected tab takes `SelectedItemText`, since it lies over that fill. Print
  wraps the row.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the "Tabs" row of [Navigation](motion.md#navigation) in motion.md. The contained pill and the vertical bar
glide like the bar.
## Steps

Where the user is in a form of a few steps. Steps are not buttons: going back is a link or a button of the page.

```html
<ol class="ds-steps" aria-label="Report a problem">
  <li class="ds-steps__step" data-status="done">
    <span class="ds-steps__mark">[icon check 16, its path with pathLength="1"]</span>
    <span class="ds-steps__label">Device<span class="ds-sr">, done</span></span>
  </li>
  <li class="ds-steps__step" aria-current="step"><span class="ds-steps__mark">2</span><span class="ds-steps__label">Problem</span></li>
  <li class="ds-steps__step"><span class="ds-steps__mark">3</span><span class="ds-steps__label">Contact</span></li>
  <li class="ds-steps__step" data-status="optional">
    <span class="ds-steps__mark">4</span>
    <span class="ds-steps__label">Photos</span><span class="ds-steps__hint">Optional</span>
  </li>
</ol>

<!-- needs attention: an icon and a word -->
<li class="ds-steps__step" data-status="error">
  <span class="ds-steps__mark">[icon alertCircle 16]</span>
  <span class="ds-steps__label">Contact</span><span class="ds-steps__hint">Add a phone number</span>
</li>

<!-- or a column: the same items -->
<ol class="ds-steps ds-steps--vertical" aria-label="Report a problem"> ... </ol>

<!-- or a bar: the same items, the list says where the user is -->
<ol class="ds-steps ds-steps--bar" aria-label="Step 2 of 3"> ... </ol>
```

**Options** ([options.md](options.md)): classes on the list or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | row (default), `--vertical`, `--bar` | the list | the layout |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the list or a group | a mark of 16 to 32px (`--ds-steps-mark-size`, 4px per step), the size's type role (`--ds-steps-font`) at the regular weight (the current label alone takes the label weight) |
| Density | `.ds-density-*` | any container | 2px per step off the room between the steps of a column (`--ds-steps-gap`); the row and the marks stay |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the radius of the marks and the segments |
| Touch | none | | a step is no target; a link in one is the page's |
| Tone | none | | a step's status is `data-status`, with its icon and word |

- `data-status` on a step (the attribute of `.ds-tasks` too; never `data-state`, which `DS.overlay` writes):
  `done` a finished step, `error` a step that needs attention (the error colours, an icon in the mark and a word: a
  `.ds-steps__hint`, or a `.ds-sr` one), `optional` an upcoming step the user may skip (a dashed ring and the word).
  `aria-current="step"` on the current one; the rest are upcoming. An error outranks the current look.
- `.ds-steps__hint`: a line of the meta role beside the label (under it in a column), in `--ds-error` on an error step.
  Short of room in a row it truncates with an ellipsis, before any label does; the whole hint is still read. For long
  hints, use the column.
- Marks are 24px discs: done `--ds-primary` with a check that draws itself when the step turns done in place
  (re-render with `DS.dom.morphHtml`, so the mark stays; steps rendered with done ones stay still on load), current
  `--ds-primary` with `--ds-on-primary` figures and its label in the label weight, upcoming an `--ds-outline` ring
  in `--ds-text-2`.
  Connectors are `--ds-line` hairlines, `--ds-primary` after a done step (colours on `--ds-dur-medium`). At 600px of
  the content only the current label shows; the others are still read.
- `.ds-steps--vertical`: a column for long or wordy sequences. The connector runs from mark to mark, in `--ds-primary`
  after a done step; labels and hints wrap, and all of them stay at every width. `--ds-steps-gap` (`--ds-space-5`) is the
  room between steps.
- `.ds-steps--bar`: equal segments `--ds-steps-bar-height` (4px) high; done and current ones fill with `--ds-primary`
  (a clip that glides on `--ds-ease-value` over `--ds-dur-glide`), an error segment with `--ds-error`, the rest is
  `--ds-accent`. Marks, labels and hints are visually hidden; the list's `aria-label` ("Step 2 of 3") says where the user
  is.
- Moving between steps: `DS.motion.transition(update, { type: 'forward' })` (or `'back'`).
- Keyboard and names: steps are not tab stops; the page's own links and buttons are. An `<ol>` with an `aria-label`,
  `aria-current="step"` on the current one, a `.ds-sr` ", done" on a done one; a hint is read with its step.
- Forced colours: done and current marks and segments are `Highlight`, upcoming ones `CanvasText` outlines, an error
  mark its icon on a `CanvasText` ring, an error segment a `CanvasText` fill, the connectors `CanvasText` (`Highlight` after a done step).
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the "Steps" row of [Navigation](motion.md#navigation) in motion.md.
## Button

One component for every action: a pill at the default shape, in one of a few looks, at any size and density.

```html
<button class="ds-btn" type="button">Cancel</button>                                  <!-- outlined -->
<button class="ds-btn ds-btn--outlined" type="button">Export</button>                 <!-- the same, explicit -->
<button class="ds-btn ds-btn--filled" type="submit">Save</button>                     <!-- the main action -->
<button class="ds-btn ds-btn--tonal" type="button">Add entry</button>                 <!-- softer main action -->
<button class="ds-btn ds-btn--elevated" type="button">Open map</button>               <!-- on an image or a busy backdrop -->
<button class="ds-btn ds-btn--text" type="button">Details</button>                    <!-- no frame -->
<button class="ds-btn ds-btn--quiet" type="button">[icon filter 16] Filter</button>   <!-- toolbar -->
<button class="ds-btn ds-btn--ghost" type="button">Dismiss</button>                   <!-- the ink of its surroundings -->
<button class="ds-btn ds-btn--filled ds-btn--block" type="submit">Sign in</button>    <!-- full width -->
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close">[icon close 20]</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="Minimize">[icon minimize 20]</button>
<button class="ds-btn ds-sm" type="button">[icon plus 16] Add</button>                <!-- 32px -->
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Edit">[icon pencil 18]</button>  <!-- 32px round -->
<div class="ds-density-dense">…buttons 32px high…</div>                              <!-- density of a region -->
<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true">[icon filter 16] Filter</button>  <!-- toggle, on -->
<button class="ds-btn ds-btn--filled" type="button" disabled>Save</button>
<button class="ds-btn ds-btn--filled" type="button" aria-disabled="true" aria-describedby="why">Publish</button>
<button class="ds-btn ds-btn--filled" type="button">                               <!-- faces: busy, done and failed -->
  <span class="ds-btn__faces">
    <span class="ds-btn__face">Save</span>
    <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Saving</span>
    <span class="ds-btn__face ds-btn__face--done" aria-hidden="true">[icon check 16]Saved</span>
    <span class="ds-btn__face ds-btn__face--failed" aria-hidden="true">[icon alertCircle 16]Not saved</span>
  </span>
</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link">  <!-- icon swap -->
  <span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">[icon copy 20]</span><span class="ds-icon-swap__b">[icon check 20]</span></span>
</button>
<button class="ds-link-btn" type="button">Printer on floor 2</button>                <!-- reads like a link -->
<button class="ds-btn ds-btn--disclosure" type="button" aria-expanded="false" aria-controls="filters">[icon filter 16] Filters</button>  <!-- opens a panel -->
<button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="false">Details</button>  <!-- opens a sheet or dialog -->
<button class="ds-btn ds-btn--adaptive" type="button" data-tip="Export">[icon download 16]<span class="ds-btn__label">Export</span></button>  <!-- folds on phones -->
<a class="ds-link--quiet" href="/devices/42/history">Show history</a>                 <!-- a quiet link -->
<button class="ds-link-btn ds-link-btn--quiet" type="button">Edit columns</button>
```

The one red button: a destructive confirmation, in the confirm dialog or the type-to-confirm pattern only (D10), its
label naming the consequence:

```html
<div class="ds-dialog__actions">
  <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
  <button class="ds-btn ds-btn--filled ds-tone-error" type="button">Delete 3 devices</button>
</div>
```

A choice made once, then locked (a vote, an answer that was sent): the pressed toggle keeps its on look while
`aria-disabled`, its siblings dim:

```html
<div role="group" aria-label="Was this helpful?">
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="true" aria-disabled="true" aria-label="Helpful">[icon thumbUp 20 ds-icon--fillable]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-disabled="true" aria-label="Not helpful">[icon thumbDown 20 ds-icon--fillable]</button>
</div>
```

```js
await DS.motion.busy(saveButton, () => fetch(url, { method: 'POST', body }));   // busy, then "Saved" (or "Not saved") for a moment
DS.motion.crossfade(copySlot, DS.icons.icon(DS.icons.check, 20), { kind: 'icon' });  // copy to check
```

**Options** ([options.md](options.md)): classes on the button or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the button |
|---|---|---|---|
| Variant | `--outlined` (default), `--filled`, `--tonal`, `--elevated`, `--text`, `--quiet`, `--ghost`; `--icon`, `--disc`, `--disclosure`, `--adaptive`, `--block` | the button | the look; `--icon` and `--disc` combine with a look, `--block` with any |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the button or a group | 24, 32, 40, 48, 56px high (8px per step), side padding 8 to 24px (4px per step), the size's type role (`xs` caption, `sm` chip, `md` label, `lg` and `xl` subtitle); an icon button 24 to 56px square |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (40, 36, 32, 28px at md); side padding, type and icon buttons stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the rest and the pressed radius times 0, .5, 1, 1.5: square, soft corners, the pill (default) |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high whatever the size and density; an icon button as wide |
| Tone | `.ds-tone-error` | a `--filled` button only | the filled error button of a destructive confirmation (above); every other tone and variant ignores tones |
| Exact height | `--ds-btn-height-exact` (a hook) | the button or a theme | a fixed height that ignores size and density, never the touch minimum |

- Every action is a pill at the default shape (D11): the rest radius is `min(radius, half the height)` times
  `--ds-shape`, so a square theme or region has square buttons. One filled button per area. Red buttons only as above
  (D10): pages keep none; name the consequence ("Delete 3 devices"). A filled button inside an error alert or another
  tone region stays filled: the button reads the tone of its own class only.
- `.ds-btn--primary` is **deprecated** (3.0, removed when 3.0 ships): `.ds-btn--filled`, the same look under the
  variant name every component shares.
- `.ds-btn--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-sm`. Until then it keeps the fixed 2.x small
  button: `--ds-btn-sm-height` (32px; with `--icon` `--ds-btn-sm-icon-size`, 32px; both **deprecated** with it) and
  12px of side padding, which density does not change. `.ds-sm` is the same 32px at the default density and follows
  the density like every size (24px in the compact theme); a small `--text` button pads 8px.
- A leading icon pulls the start padding to 12px at md (4px more per size above, never more than the end padding),
  also the icon of the first face of `.ds-btn__faces`. Icons keep the size their markup gives them (16px beside a
  label, 20px alone).
- `--elevated` lifts a `--ds-surface-low` button with `--ds-elev-1` (`--ds-elev-2` on hover; hook
  `--ds-btn-shadow`). `--ghost` has no fill and no frame and takes the ink of its surroundings (`currentColor`): an
  action on a tinted, inverse or status surface. `--block` fills its line (`display: flex`, full width).
- A toggle that is on carries `aria-pressed="true"` and shows the tint (forced colors: the selection colours).
  Toggles in a track with a sliding indicator ([DS.indicator](motion.md), `.ds-has-indicator`) leave the tint to
  the pill (give it `--ds-accent`): the button stays clear, so only one pill shows while it travels, and its label
  changes colour on the pill's timing (`--ds-indicator-dur`).
- `aria-disabled="true"` looks disabled but stays focusable and hoverable, so a tooltip can say why. `disabled` and
  `aria-busy="true"` block the pointer. Blocked for every input (2.0): once `DS.ripple.attach()` or `DS.motion.busy()` ran,
  or `DS.motion.guard()` was called once ([motion.md](motion.md#dsmotion-jsmotionjs)), a click, middle click, Enter,
  Space or form submission on a busy or done `.ds-btn`, or on any `aria-disabled="true"` action inside `.ds-theme`,
  never reaches your listeners: no page guard needed. A control that must explain itself on click gets
  `data-ds-guard="off"`. Forced colours: `GrayText`.
- A choice made once, then locked: `aria-pressed="true"` with `aria-disabled="true"` keeps the on look at full
  strength (no layer, the default cursor; forced colours keep `Highlight`); the unpressed siblings dim as usual.
- A button that opens a panel (`.ds-btn--disclosure` with `aria-expanded`, or any `.ds-btn` with
  `aria-haspopup="dialog"`) takes the pressed tint while `aria-expanded="true"` (forced colours: `Highlight` /
  `HighlightText`, focused with a `CanvasText` ring). Keep `aria-expanded` in step yourself, or let `DS.overlay`
  do it for dialog and sheet openers. Menu triggers (`aria-haspopup="menu"`) do not tint.
- `.ds-btn--adaptive`: a button whose label folds away on phones. Wrap the label in `.ds-btn__label` after the icon;
  in a content panel of 600px or less (anywhere else, such as the top bar, sheets, dialogs and a page outside the
  frame: in a window of 600px or less) the label is visually hidden
  and the button turns into a round quiet icon button (`--ds-btn-icon-size` and its size step; the icon at 20px).
  Its accessible name stays the label; give it a `data-tip` with the
  same words, which shows only while the label is folded (a tip equal to the visible text shows only while it is cut
  off, [Tooltip](#tooltip)).
- Quiet links: `.ds-link--quiet` on a link and `.ds-link-btn--quiet` with `.ds-link-btn` take the quieter ink
  (`--ds-text-2`) and a hairline underline (`--ds-line-2`, the link underline geometry), the link colour and
  `--ds-link-underline-hover` on hover; still underlined. For secondary links next to the main one.
- A text button that underlines on hover (`--ds-btn-hover-decoration: underline`) draws it with the link geometry
  (`--ds-link-underline-thickness`, `--ds-link-underline-offset`).
- Press: the state layer comes in `--ds-dur-micro` and the shape turns squarer (`--ds-radius-action-pressed`, 12px,
  times `--ds-shape`; hook `--ds-btn-radius-pressed`), then springs back on release (`--ds-ease-spatial`,
  `--ds-dur-medium`); with `DS.ripple.attach(document)` a ripple grows from the pointer ([Ripple](#ripple)) and
  `.ds-pressed` keeps a quick click visible. The rest radius is at most half the height, so the morph runs the whole
  way; a pressed radius is never rounder than the rest radius (square shapes stay square). Disabled,
  `aria-disabled`, busy and done buttons show no press. `.ds-btn--disc` morphs and ripples like every pill. Nothing
  scales or moves.
- Focus: the ring is solid from the first frame and snaps from 4px to its 2px offset in `--ds-dur-fast`, with the
  focus layer (`--ds-state-focus`, hook `--ds-btn-state-focus-opacity`; `--disc` shows its disc). An
  `aria-disabled` button keeps the focus layer.
- Busy, done and failed, without a width jump: `.ds-btn__faces` stacks every `.ds-btn__face` in one grid cell, so the
  button is as wide as its widest face and the label stays while it loads. `aria-busy="true"` blocks it at once and
  shows `.ds-btn__face--busy` only after `--ds-delay-loader` (a fast save shows nothing); `.ds-btn--done` (blocked as
  well) shows `.ds-btn__face--done`, whose `pathLength="1"` check (`DS.icons.check`) draws itself; `.ds-btn--failed`
  shows `.ds-btn__face--failed`, an icon and a word (never the colour alone; the button keeps its colours), and is not
  blocked: a press tries again. The faces roll: the leaving face rises and fades in `--ds-dur-instant`, the next one
  rises in over `--ds-dur-fast`; back to rest they roll down. `DS.motion.busy(button, work, { done, failed })`
  ([motion.md](motion.md)) sets and clears them, keeps a busy face that showed for the loader minimum, the success
  face for `--ds-hold-success` and the failed face for `--ds-hold-status` (then rethrows the error). Announce the
  result with `DS.overlay.announce()` (or a snackbar, which announces itself).
- Icon swap: `.ds-icon-swap` holds `.ds-icon-swap__a` and `.ds-icon-swap__b` in one cell; `data-swap="b"`, or an
  `aria-pressed="true"` ancestor (a play/pause toggle), shows b. The incoming icon fades in and springs up from
  `--ds-scale-small`, a `pathLength="1"` glyph draws itself, the outgoing icon only fades; a crossfade with a scale,
  not a path morph ([motion.md](motion.md)).
- Keyboard and names: a `<button>` (or a link that navigates); Enter and Space press it. An icon button needs
  `aria-label`; an adaptive one keeps its label as its name.
- Forced colours: the system button colours; a pressed toggle and an open disclosure button `Highlight` /
  `HighlightText` (focused: a `CanvasText` ring), a blocked one `GrayText`. The error tone becomes the system colours
  too, so its label carries the meaning.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the press, focus, busy and success rows of [Controls](motion.md#controls) in motion.md.
## Card

A block of related content on a surface, or a whole block that opens or picks something.

```html
<section class="ds-card">
  <div class="ds-card__row">
    <h2 class="ds-card__title">Sync</h2>
    <button class="ds-btn ds-sm" type="button">Run now</button>
  </div>
  <p class="ds-muted">Runs every night at 02:00.</p>
  <h3 class="ds-card__subtitle">Sources</h3>
  <ul class="ds-plain-list"><li>Directory</li><li>Asset database</li></ul>
  <div class="ds-card__section">
    <h3 class="ds-card__subtitle">Advanced</h3>
    <p>...</p>
  </div>
  <nav class="ds-card__links" aria-label="Related">
    <a class="ds-btn ds-btn--text ds-card__link" href="/runs">Run history [icon arrowRight 16]</a>
  </nav>
</section>

<section class="ds-card ds-card--outlined"> ... </section>   <!-- the default look, named -->
<section class="ds-card ds-card--filled"> ... </section>     <!-- quieter block inside a card or form -->
<section class="ds-card ds-card--elevated"> ... </section>   <!-- floats a little, no hairline -->
<section class="ds-card ds-card--horizontal">                <!-- media beside the body -->
  <img class="ds-card__media" src="/devices/42.jpg" alt="Printer on floor 2">
  <div class="ds-card__body"> ... </div>
</section>
<div class="ds-card__more"><button class="ds-btn" type="button">Load more</button></div>
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-card--outlined` (default), `--filled`, `--elevated` | the card | the look |
| Layout | `.ds-card--horizontal` | the card | media beside the body; each takes a whole line once the card is too narrow for both |
| Clickable | `.ds-card--interactive` | `<a>`, `<button>` or `<div>` with `.ds-card__action` | state layer, press morph, ripple |
| Selectable | `aria-pressed`, `aria-checked` or `aria-selected`; `.ds-card--selectable` with `.ds-card__check` | an interactive card | the selected look; the mark in the corner |
| Density | `.ds-density-*` | the card or an ancestor | 2px per step off the padding, the rhythm between children and the section's room; `--ds-card-pad` follows, so what bleeds to the edges follows too. Read on the card: a density class on a child (a dense table) leaves the gap above it alone. Type stays |
| Shape | `.ds-shape-*` | the card or an ancestor | multiplies the rest and pressed radius, the media and the mark (`--ds-shape`) |
| Touch | `.ds-touch` | the card or an ancestor | an interactive card is at least `--ds-touch-target` high |
| Size | not read | | a card has no height of its own; a size class on it reaches the controls inside |
| Tone | not read | | a card shows no meaning of its own: put a status chip or an alert in it |

`.ds-subsection` and `.ds-more` are **deprecated** aliases of `.ds-card__section` and `.ds-card__more` (their 2.x names), until 3.0 ships.

Children of a card are 16px apart; a button, switch or `.ds-chip` in `.ds-card__row` overhangs the title line so all
card titles start at the same height; a status chip, badge or tag fits the line and sits on it, so a row that wraps
keeps the card's 16px below it. Cards in `.ds-grid-2` share their height and line up their `.ds-card__links`, the tallest
card's still 16px below its content. Padding: the `--ds-card-padding*` hooks ([theming.md](theming.md#component-hooks)).

### Interactive card

A whole card that opens something (1.4):

```html
<a class="ds-card ds-card--interactive" href="/devices/42">
  <h2 class="ds-card__title">Printer on floor 2</h2>
  <p class="ds-muted">Last seen today, 09:12</p>
</a>

<button class="ds-card ds-card--interactive" type="button">
  <span class="ds-card__title">Printer on floor 2</span> ...       <!-- a button holds phrasing content only -->
</button>

<div class="ds-card ds-card--interactive">                          <!-- with other controls inside -->
  <div class="ds-card__row">
    <h2 class="ds-card__title"><a class="ds-card__action" href="/devices/42">Printer on floor 2</a></h2>
    <button class="ds-btn ds-sm" type="button">Restart</button>
  </div>
  <p class="ds-muted">Last seen today, 09:12</p>
</div>
```

- The `<a>` and `<button>` forms lose the element's own look (colour, font, underline; full width, left-aligned) and
  lay their content out as a column from the top, so cards in one grid row line up.
  In the `<div>` form the `.ds-card__action` link reads as the card's text and its `::after` stretches over the
  card; the card's other links and controls stay above it and keep working.
- A state layer in `currentColor`: hover `--ds-state-hover-lg`, press `--ds-state-pressed` in `--ds-dur-micro`
  (or the ripple, `DS.ripple.attach()`), keyboard focus `--ds-state-focus` with the ring, which is solid from the
  first frame and snaps to its offset (on the `<div>` form the card draws it through
  `:has(.ds-card__action:focus-visible)`, so the clip of a ripple never cuts it).
- The press morph: the radius goes to `--ds-radius-card-pressed` (12 to 8px) and springs back on release.
- A disabled or `aria-disabled="true"` card looks it: the one disabled model (`--ds-disabled-ink` on its text and
  its mark, `--ds-disabled-opacity` where a theme dims, faded on `--ds-dur-fast`, the cursor `not-allowed`). It shows no
  hover or press layer and no hover shadow, and does not morph; an `aria-disabled` card keeps its focus layer.
- Nothing moves on hover, no lift and no scale. A theme may add a shadow on hover with `--ds-card-hover-shadow`
  (default none, an elevated card keeps its own; for example `var(--ds-elev-hover)`), in over `--ds-dur-medium`, out
  over `--ds-dur-base`.
- In forced colours every interactive card keeps a visible edge (`.ds-card--filled` included) and the focus ring; a
  blocked card turns `GrayText`, selected or not.

### Selectable card

Pick one of a few cards (a plan, a template): the card is a toggle. Put `aria-pressed` (or `aria-checked` in a
`role="radiogroup"`, `aria-selected` in a listbox) on a `<button>` card, or on the `.ds-card__action` of the `<div>`
form, which may be a `<button>` too (it loses its own look):

```html
<div class="ds-grid-2" role="group" aria-label="Plan">
  <button class="ds-card ds-card--interactive" type="button" aria-pressed="true">
    <span class="ds-card__title">[icon check 20]Standard</span>
    <span class="ds-muted">Daily sync, 30 days of history</span>
  </button>
  <div class="ds-card ds-card--interactive">
    <h2 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="false">Extended</button></h2>
    <p class="ds-muted">Hourly sync, a year of history</p>
    <a class="ds-link--quiet" href="/plans">Compare plans</a>
  </div>
  <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="false">   <!-- brings its check -->
    <span class="ds-card__title">Archive</span>
    <span class="ds-muted">Monthly sync, kept for ten years</span>
    <span class="ds-card__check" aria-hidden="true">[icon check 16]</span>
  </button>
</div>
```

- Selected, the card takes `--ds-card-selected-bg` (`--ds-accent`) with `--ds-on-accent` ink and a static inset ring
  (a border of `--ds-focus-width` in `--ds-selected-ring`, `--ds-primary`, on the card's own `::after`), so the
  focus ring stays free and both read at once (a border survives forced colours; a `box-shadow` ring does not). The
  colours change on `--ds-dur-fast`, the ring shows at once. Add a check or the label weight: never the tint alone.
  Forced colours: `Highlight` / `HighlightText`.
- `.ds-card--selectable` brings the check: `.ds-card__check`, the card's last child, is an empty round mark in the
  corner at rest and a filled check when selected (`--ds-card-check-size`, `--ds-space-5`), on the title's line; the
  card keeps its content clear of it and the pointer goes through it. It is `aria-hidden`: the state is the
  attribute.
- The page toggles the attribute: the system only draws it. Keyboard: Tab reaches each card, Enter and Space press it;
  the `<div>` form's other links and controls stay in the tab order.
- `.ds-card--elevated`: a card that floats a little (`--ds-card-shadow`, `--ds-elev-1`) instead of the hairline; in
  forced colours its edge comes back.
- `.ds-card__title` wraps long words and lines up a leading icon (`[icon ... 20]` first) with its words.
- `.ds-card__links` hangs only text buttons and `.ds-card__link` into the card's margin; an outlined button there keeps
  its place.
- `.ds-card--horizontal`: `.ds-card__media` (an `<img>`, or an element on `--ds-surface-high` that centres an icon; a
  radius of `--ds-radius-sm` times the shape) takes `--ds-card-media-size` (160px), `.ds-card__body` the rest, and both
  take a whole line once the card has less room than `--ds-card-media-size` + `--ds-card-body-min` (240px) + the gap: no
  query, the card itself decides, wherever it stands. `.ds-card__body` keeps the card's rhythm, by the same rules as the
  card's own children; a `<button>` card uses `<span>`s, which stack. Clickable and selectable combine with it.
- Print: a short card is never split across pages.
- Rows of a [disclosure list](#disclosure) run to the card's edges: this stylesheet pulls the list out by
  `--ds-card-pad` and sets `--ds-disclosure-row-padding-exact` on it, so the rows' text lines up with the card's.

Accessibility: a card is a `<section>` with its own heading, or an `<a>` or `<button>` with one name
(the `<div>` form's name is its `.ds-card__action`). Forced colours: `.ds-card--filled` (when interactive) and
`.ds-card--elevated` keep a `CanvasText` edge; a selected card `Highlight` / `HighlightText`, its media too, with a
`CanvasText` ring when focused and a check in `Highlight` on `HighlightText`; a disabled or `aria-disabled` card
`GrayText` on `Canvas`, its media too, and when selected a check in `Canvas` on `GrayText`; the empty mark a `CanvasText`
ring.

Hooks: `--ds-card-padding`, `--ds-card-padding-sm`, `--ds-card-padding-filled`, `--ds-card-radius`,
`--ds-card-radius-pressed`, `--ds-card-bg`, `--ds-card-border`, `--ds-card-filled-bg`, `--ds-card-title-line`,
`--ds-card-hover-shadow`, `--ds-card-shadow`, `--ds-card-selected-bg`, `--ds-selected-ring`, `--ds-card-check-size`,
`--ds-card-media-size`, `--ds-card-body-min` ([theming.md](theming.md#component-hooks)). `--ds-card-pad` is the
resulting padding: read it, never set it.

**Motion:** the press morph of [Controls](motion.md#controls) (`.ds-card--interactive`) and the "Alert, tile, card" row of [Feedback](motion.md#feedback). The mark's colours run on `--ds-dur-fast` with the card's.
## Tiles

Key figures on tonal tiles that fill their row: a figure, how it moved and its trend. A tile can also open a list or
filter by its figure.

```html
<div class="ds-tiles">
  <div class="ds-tile">
    <p class="ds-tile__label">[icon alert 16]<span>Overdue</span></p>
    <p class="ds-tile__value">12</p>
    <p class="ds-tile__delta ds-tone-error">[icon arrowUp 16]<span>3 more than last week</span></p>
    <p class="ds-tile__note">Target: none overdue</p>
    <div class="ds-tile__trend">
      <figure class="ds-columns ds-columns--mini" role="img" aria-label="Overdue per day, last 14 days: highest 12 today"> ... </figure>
    </div>
  </div>
  ... (as many per row as fit at 176px, at most four)
</div>
```

- `.ds-tile__delta`: how the figure moved, always an arrow and a word ("3 more than last week"), never a colour alone.
  Quiet (`--ds-text-2`) without a tone. A `.ds-tone-*` on the delta itself lays it on the tone's tint: the page decides
  whether up is good (`.ds-tone-success` for more devices, `.ds-tone-error` for more overdue ones). The value keeps its
  ink whatever the delta says.
- `.ds-tile__trend`: a slot at the foot of the tile for a sparkline ([`.ds-columns--mini`](#charts), or the project's
  own SVG in `currentColor`, `--ds-tile-trend-color`), so the sparklines of a row line up whatever stands above them.
  Inside a clickable tile the parts are `<span>`s, the sparkline's too: `<span class="ds-columns ds-columns--mini" role="img" aria-label="...">`.
- A target: `.ds-tile__note` says it ("Target 95%"); a [`.ds-meter`](#charts) as a child of the tile, with its own
  name, shows how far along the figure is.

The row fills its container, whatever it is (a page, a dialog, a side sheet, beside the drawer): as many tiles per row
as fit at `--ds-tile-min-width` (176px), never more than `--ds-tiles-columns` (4), each row filled. `.ds-tiles--3`
caps the row at three. On a phone the default gives one tile per row, so a long value fits whole;
`--ds-tile-min-width: 128px` on the `.ds-tiles` or in the theme keeps two per row down to a 360px phone. A single figure that opens a list is one `a.ds-tile`, also outside `.ds-tiles`.

`DS.motion.countUp()` never takes the target from the markup. It counts from the figure it last wrote (or one a
re-render wrote since, read back through `format`), and on its first call from 0. So keep the raw value in your own
state (the styleguide demo keeps it in a data attribute of its own), and pass `{ from: <the value in the markup> }`
on the first update of a tile rendered with its figure if it should count on rather than from 0.

The value never takes a colour and never wraps (it shrinks on narrow tiles; a value still too wide ends in an
ellipsis, the last resort: shorten figures, put the full value in `data-tip`). A missing value takes
`.ds-tile__value--empty` (`<p class="ds-tile__value ds-tile__value--empty">No data</p>`): `--ds-text-2` in the display
font. Every new value goes through
`DS.motion.countUp(el, next)`: it counts from the figure it shows (the last value it wrote, or one a re-render wrote since that reads back
through `format`; from 0 the first time) on `--ds-ease-value` over
`--ds-dur-glide`, so a refresh counts on from the old value, a new value mid-count retargets from where the figure
is, the same value changes nothing, and assistive technology gets the final value. A meter or progress bar set in
the same task lands on the same frame. The note changes at once
([motion.md](motion.md#data-motion)).

```js
DS.motion.countUp(value, synced);
bar.style.setProperty('--ds-progress', String(synced / total));   // same task: they land together
note.textContent = `${failed} failed`;                             // at once
```

A tile that opens something is a `<button class="ds-tile">` or `<a class="ds-tile">` with `<span>`s instead of the
`<p>`s: a 6% state layer, the focus ring, the ripple, and the press morph (16 to 12px, `--ds-tile-radius-pressed`,
springing back on release); no lift, no scale. A disabled or `aria-disabled="true"` tile shows no hover or press
layer and does not morph; an `aria-disabled` tile keeps its focus layer (forced colours: `GrayText`).

Filter by a figure: a clickable tile that is a toggle (`aria-pressed`, or `aria-checked` / `aria-selected` in a group
of that role):

```html
<div class="ds-tiles" role="group" aria-label="Filter devices">
  <button class="ds-tile" type="button" aria-pressed="true">
    <span class="ds-tile__label">[icon check 16]<span>Overdue</span></span>
    <span class="ds-tile__value">12</span>
  </button>
  <button class="ds-tile" type="button" aria-pressed="false">
    <span class="ds-tile__label"><span>In repair</span></span>
    <span class="ds-tile__value">3</span>
  </button>
</div>
```

Selected, the tile takes `--ds-tile-selected-bg` (`--ds-accent`) with `--ds-on-accent` ink and a static inset ring
(`--ds-selected-ring`, `--ds-primary`, at `--ds-focus-width`), so the focus ring stays free and both read at once.
Colours on `--ds-dur-fast`, the ring at once; add a check or the label weight, never the tint alone. Forced colours:
`Highlight` / `HighlightText`. A short tile is never split across printed pages.

### Options

On the tile, the row or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-tile__value` | an eighth of the display size per step (27 to 45px at the default scale), its line height with it (`--ds-tile-value-line`, 44px at the default scale); narrow tiles still shrink it; not the label, the note or the padding |
| Density | `.ds-density-*` | `.ds-tile`, `.ds-tiles` | the padding 2px per step, the gap of the row 2px per step; not the type |
| Shape | `.ds-shape-*` | `.ds-tile`, `.ds-tile__delta` | multiplies the rest and the pressed radius |
| Touch | `.ds-touch` | a clickable tile | at least `--ds-touch-target` high |
| Tone | `.ds-tone-*` | `.ds-tile__delta` | the tint and its ink, from the class on the delta itself; the value never takes a tone |

### Keyboard and names

`Tab` reaches a tile that opens or filters, `Enter` follows or presses it, `Space` presses a button; a tile that only
shows a figure is not in the tab order. A tile that is a button is named by its text (label, value, delta), so write
those in words. `role="group"` with a name wraps tiles that filter together, each with `aria-pressed`. A sparkline
says its summary in `aria-label`; the arrow in the delta is decoration, the word carries it.

### Forced colours

A selected tile is `Highlight` / `HighlightText`, its delta and sparkline with it (the tile sets
`--ds-chart-forced-ink` for the marks), focused with a `CanvasText` ring; an `aria-disabled` one is `GrayText` on
`Canvas`. A toned delta loses its tint and keeps its arrow and word.

### Hooks

`--ds-tile-radius`, `--ds-tile-radius-pressed`, `--ds-tile-padding`, `--ds-tile-min-width`, `--ds-tiles-columns`,
`--ds-tile-value-line`, `--ds-tile-trend-color`, `--ds-tile-selected-bg`, `--ds-selected-ring`: see [theming.md](theming.md).

**Motion:** the "Alert, tile, card" row of [Feedback](motion.md#feedback) (`countUp()`, the press morph) in motion.md.
## Disclosure

A `<details>` with the system's summary: advanced settings, or an accordion whose sections open one at a time.

```html
<details class="ds-collapsible ds-disclosure">
  <summary>Advanced settings [icon chevronDown 20 .ds-chevron]</summary>
  <div class="ds-disclosure__body"> ... </div>
</details>

<div class="ds-disclosure-list">
  <details class="ds-collapsible ds-disclosure ds-disclosure--row" name="sync-help">
    <summary><span class="ds-disclosure__title">When does the sync run?</span><span class="ds-disclosure__meta">Nightly</span>[icon chevronDown 20 .ds-chevron]</summary>
    <div class="ds-disclosure__body"> ... </div>
  </details>
  <details class="ds-collapsible ds-disclosure ds-disclosure--row" name="sync-help"> ... </details>
</div>
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-disclosure--row` | the details | a full-width row with a title, a meta and the chevron at the end |
| Exclusive | the same `name` on each `<details>` | rows or plain | one open at a time, native, no script |
| Size | `.ds-xs` ... `.ds-xl` | the disclosure or an ancestor | 8px of height per step, the type role of the size (`--ds-size-font`) |
| Density | `.ds-density-*` | the disclosure or an ancestor | 4px of height per step; a row's side padding and the room above and below a body 2px per step |
| Shape | `.ds-shape-*` | the disclosure or an ancestor | multiplies the plain summary's rest and pressed radius; a row stays rectangular |
| Touch | `.ds-touch` | the disclosure or an ancestor | at least `--ds-touch-target` high; touch wins over size and density |
| Tone | not read | | a disclosure shows no meaning of its own |

- The plain summary is a pill in the label font, 40px high at the default size and density (hook
  `--ds-disclosure-height`, the base the options apply to), whose state layer
  hangs `--ds-space-2` into the space at its sides (its text stays in line with the content around it): hover
  `--ds-state-hover`, press in `--ds-dur-micro`, the focus layer and a ring that snaps in, the press morph (hooks
  `--ds-disclosure-radius`, `--ds-disclosure-radius-pressed`, each times `--ds-shape`) and the ripple. Font:
  `--ds-disclosure-font`. `.ds-disclosure__body` starts `--ds-space-3` below it.
- `.ds-disclosure--row`: a full-width summary (`--ds-disclosure-row-height`, 48px, the base) with
  `.ds-disclosure__title`, `.ds-disclosure__meta` in `--ds-text-2` and the chevron at the end. Rows in a
  `.ds-disclosure-list` are divided by hairlines and run to the edges of a card (the card sets
  `--ds-disclosure-row-padding-exact` to `--ds-card-pad`; elsewhere `--ds-disclosure-row-padding`, `--ds-space-4`, 2px
  less per density step); a row takes a rectangular layer, an inset ring and the ripple, no morph.
- It opens and closes like every `.ds-collapsible` and the `.ds-chevron` turns with it.
- An exclusive accordion needs no script: `<details>` that share a `name` open one at a time, and the one that closes
  plays the same motion. A row may start open (`open` on one of them). The errors list of an alert (`.ds-errors`)
  keeps its own summary.
- Keyboard and names: Tab reaches each summary, Enter and Space toggle it (native); screen readers announce its text
  and the expanded state. Keep the chevron `aria-hidden` (`DS.icons` does).
- Forced colours: no state layer; the ring, the hairlines and the turned chevron stay.
- Hooks: `--ds-disclosure-height`, `--ds-disclosure-row-height`, `--ds-disclosure-radius`,
  `--ds-disclosure-radius-pressed`, `--ds-disclosure-font`, `--ds-disclosure-row-padding`,
  `--ds-disclosure-row-padding-exact` ([theming.md](theming.md#component-hooks)).

**Motion:** `.ds-collapsible` and `.ds-chevron` in [Utilities](motion.md#utilities-css) and the press of
[Controls](motion.md#controls) in motion.md.
## Lists

Records in rows that open, label and value rows, bars, facts and lines of parts.

```html
<ul class="ds-kv-list">
  <li><span>Model</span><strong>Notebook 14</strong></li>
  <li><span>Warranty</span><strong>2027-03-31</strong></li>
</ul>

<ul class="ds-plain-list"><li>First</li><li>Second</li></ul>

<dl class="ds-facts">
  <div><dt>Owner</dt><dd>Ada Lovelace</dd></div>
  <div><dt>Location</dt><dd>Building A, 1st floor</dd></div>
  <div><dt>Last seen</dt><dd>Today, 09:12</dd></div>
  <div><dt>Ticket</dt><dd><a href="https://tracker.example/42">#42 [icon external 16]</a></dd></div>
</dl>

<p><span class="ds-parts"><span class="ds-parts__list"><span>3 new</span><span>1 updated</span><span>250 unchanged</span></span></span></p>
```

`.ds-facts` with exactly four entries shows 4, 2 or 1 per row by the page's width. `.ds-parts` wraps between parts
and never leaves a "·" at a line end; only a part wider than the whole line breaks inside. Links in parts
(`<span><a href="#new">3 new</a></span>`) keep their focus ring: the line clips only sideways, and the links take an
inset ring that snaps inward from the edge (also without `.ds-base`).

`.ds-list` is a list of records, `.ds-plain-list` text in list form, `.ds-kv-list` label and value. The three lists
have no top margin of their own (zero weight, so the rhythm of a card spaces them); the last key-value row has no
bottom padding, and long labels and values wrap inside their own part.

### Row list

Records that open, in an outlined list (2.0). Use it for a short list on an overview or in a side sheet; a list that
needs columns, sorting or bulk selection is a [Table](#table).

```html
<ul class="ds-list ds-list--interactive" aria-label="Devices">
  <li class="ds-list__item" data-ds-key="d42">[icon laptop 20 .ds-list__icon]
    <span class="ds-list__text">
      <span class="ds-list__title"><a class="ds-list__action" href="/devices/42">LAPTOP-0042</a></span>
      <span class="ds-list__meta">Notebook 14 · Building A</span>
    </span>
    <span class="ds-status ds-tone-warning">[icon alert 16]<span>Warranty ends</span></span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="More for LAPTOP-0042">[icon moreVertical 18]</button></span>
    [icon chevronRight 20 .ds-list__chevron]
  </li>
</ul>
```

- `.ds-list`: an outlined surface (`--ds-line`, `--ds-radius-card`) with hairlines between rows, each at least
  `--ds-list-item-height` (56px) high. It never clips, so a row's menu is not cut; an empty list takes no room.
  `.ds-list__text` takes the room: below `--ds-list-text-min` (12rem) the trailing parts (a status chip,
  `.ds-list__actions`, the chevron) drop to a second line by themselves. `.ds-list__title` is in the label font,
  `.ds-list__meta` in the meta font and `--ds-text-2`, like `.ds-list__icon` and `.ds-list__chevron`.
- `.ds-list--interactive`: one `.ds-list__action` (a link or a button) per row; its `::after` stretches over the
  row, so the whole row opens the record, and the row's other links and controls stay above it and keep working. A
  state layer (hover `--ds-state-hover-lg`, press `--ds-state-pressed` in `--ds-dur-micro`, not while another
  control in the row is pressed), the focus layer and an inset ring on the row while the action has keyboard focus,
  the ripple (`DS.ripple.attach()`), no morph. A row whose action is `disabled` or `aria-disabled="true"` shows no
  hover or press layer (it keeps its focus layer) and takes the `not-allowed` cursor.
- The current row: `aria-current` on the row or on its action (`aria-current="page"`, anything but `"false"`) tints
  it with `--ds-list-current-bg` (`--ds-accent`) over `--ds-dur-fast`; say it in the row too (a word, the label
  weight). In forced colours the current row is `SelectedItem`; its other controls, chips and media take the system
  colours again, on `Canvas`, so they stay legible on the fill.
- Re-render with `DS.dom.morphHtml` and keyed rows (`data-ds-key`) inside `DS.motion.flip(list, ...)`: rows glide to
  their places on an opaque backing, new rows fade in over `--ds-dur-fast`, a removed row fades out while the rows
  below close the gap, and focus moves to its neighbour.

### A row with media, a description and an aside

```html
<ul class="ds-list" aria-label="People">
  <li class="ds-list__item">
    <span class="ds-list__media ds-list__media--round" aria-hidden="true">AL</span>     <!-- or <img src="..." alt=""> -->
    <span class="ds-list__text">
      <span class="ds-list__title">Ada Lovelace</span>
      <span class="ds-list__description">Asked for a second dock for the lab.</span>
      <span class="ds-list__meta">Research</span>
    </span>
    <span class="ds-list__aside">09:12</span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-sm" type="button" aria-label="Reply to Ada Lovelace">Reply</button></span>
  </li>
</ul>
```

- `.ds-list__media`: a thumbnail, an icon or an avatar's initials in a box of `--ds-list-media-size` (40px) on
  `--ds-surface-high`, with corners of `--ds-list-media-radius` (`--ds-radius-sm`); `.ds-list__media--round` for a
  person. An `<img>` fills it. Hide it from assistive technology when the row names the same thing.
- `.ds-list__description`: a sentence in the body font and `--ds-text-2`, between the title and the meta.
  `.ds-list__aside`: a short fact at the row's end (a time, a count), in the meta font with tabular figures. It drops
  to the second line with the other trailing parts.

### Stacked rows and sticky headings

```html
<ul class="ds-list ds-list--stacked" aria-label="Open requests"> ... </ul>

<ul class="ds-list" role="list" aria-label="People">
  <li class="ds-list__group" role="presentation"><h3 class="ds-list__heading">A</h3></li>
  <li class="ds-list__item"> ... </li>
</ul>
```

- `.ds-list--stacked`: the trailing parts always go under the text, whatever the width, each on a line of its own;
  the media or the icon holds its column beside them. For a narrow column or a side sheet.
- `.ds-list__group` with `.ds-list__heading`: a letter or a day that stays at the top of the nearest scroller on an
  opaque fill (`--ds-list-group-bg`), while its rows pass under it; `--ds-list-group-top` when a sticky page head
  stands above it. When focus moves up, the controls of its rows stop below the heading, never under it. `role="list"`
  keeps the list semantics in Safari; the heading's item is `role="presentation"`.
  Below 12 rows a letter heading rarely helps; for thousands of rows wait for the virtual list.

### Key-value rows that open, bars, facts in rows and the lock

```html
<ul class="ds-kv-list ds-kv-list--interactive">
  <li><a class="ds-kv-list__row" href="/owners/7"><span>Owner</span><strong>Ada Lovelace</strong></a></li>
  <li><button class="ds-kv-list__row" type="button"><span>Tickets</span><strong>3 open</strong></button></li>
  <li><div class="ds-kv-list__row"><span>Serial</span><strong>5CD1234XYZ</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Backup</span><strong>[icon checkCircle 16 .ds-kv-list__icon .ds-tone-success]<span class="ds-sr">Passed:</span> Today, 02:00</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Asset tag</span><strong class="ds-muted">Not set</strong></div></li>
</ul>

<ul class="ds-kv-list ds-kv-list--bars">
  <li><span>Disk</span><strong>78%, high</strong><span class="ds-meter ds-tone-warning" aria-hidden="true"></span></li>
</ul>

<dl class="ds-facts ds-facts--rows">
  <div><dt>Owner</dt><dd>Ada Lovelace <span class="ds-lock" role="img" aria-label="Set by the directory sync" data-tip="Set by the directory sync">[icon lock 16]</span></dd></div>
  <div><dt>Location</dt><dd>Building A, 1st floor</dd></div>
</dl>
<p class="ds-meta">Values with a lock are set by the directory sync: change them there.</p>
```

- `.ds-kv-list--interactive`: each row is a `.ds-kv-list__row`, a link or a button that takes the whole row and
  hangs `--ds-space-2` into the space at its sides (the first and last rows also their outer padding), so its text
  stays in line with static rows: a state layer (`--ds-state-hover-lg`, press in `--ds-dur-micro`), the focus layer
  and a ring that snaps in, the ripple, no morph; `disabled` and `aria-disabled="true"` rows take the disabled
  model (`GrayText` in forced colours). A `div.ds-kv-list__row` is a static row among them.
- `.ds-kv-list__icon` before a value, with a tone on the icon itself (`.ds-tone-success`, `.ds-tone-warning`,
  `.ds-tone-error` ...), always with a `.ds-sr` word. `.ds-kv-list__icon--ok`, `.ds-kv-list__icon--warning` and
  `.ds-kv-list__icon--error` are **deprecated** (3.0, removed when 3.0 ships): `.ds-tone-success`, `.ds-tone-warning`,
  `.ds-tone-error`, the same colours. `strong.ds-muted` is a quiet value ("Not set") in the regular weight.
- `.ds-kv-list--bars` puts a [meter](#charts) under each row, `aria-hidden` (the figure is in the text); the label
  stays on one line and ends in an ellipsis (give it a `data-tip` with the full text). A tone on the meter also goes
  into the row as a word ("78%, high"): the meter is hidden and a figure is no status.
- `.ds-facts--rows`: each fact on a row of its own, the label in a column of `--ds-facts-label-width` (36%) in the
  body font, hairlines between; under 520px of content (or in a window of 600px and less) the label goes above its
  value.
- `.ds-lock` marks a value another system sets: the `lock` glyph, the reason in `aria-label` and `data-tip`. It is
  not an action and takes no `tabindex` (a tap shows the tip); name the reason once per card in a `.ds-meta` line.
  A locked value is text, never a disabled field ([rules.md](rules.md#state-and-feedback)).

### Options

On the list or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-list__item` | 8px of height per step (40, 48, 56, 64, 72px), 4px of it the block padding; the title takes the size's type role; the media 4px per step |
| | | `.ds-kv-list` rows, `.ds-facts--rows` | 8px of height per step, in the body font |
| Density | `.ds-density-*` | `.ds-list__item` | 4px of height per step (56, 52, 48, 44px), the padding 2px per side and per step; not the type, not the media |
| | | `.ds-kv-list` rows, `.ds-facts--rows` | 4px of height per step |
| | | `.ds-facts`, `.ds-plain-list` | the row gap 2px per step; facts above tiles also their column gap, as the tiles' |
| Shape | `.ds-shape-*` | `.ds-list`, `.ds-list__media`, `.ds-kv-list__row` | multiplies the radius (a square list has square rows; a round media has rounded corners at `.ds-shape-soft`, square ones at `.ds-shape-square`) |
| Touch | `.ds-touch` | `.ds-list__item`, `:is(a, button).ds-kv-list__row` | at least `--ds-touch-target` high; touch wins over size and density |
| Tone | `.ds-tone-*` | `.ds-kv-list__icon` | the icon's colour, from the class on the icon itself; always with a `.ds-sr` word |

A two-line row grows with its text and its padding, so the height of a row is a minimum. Its small menu button keeps
its own `.ds-sm`.

### Behaviour, keyboard and names

- The page wires what a row opens. Selectable and reorderable rows arrive with the list module of a later phase;
  today use a [Table](#table) for bulk selection and `DS.motion.flip` for a reorder that the page drives.
- `Tab` reaches a row's `.ds-list__action`, then its other controls; `Enter` opens the record, and `Space` presses it
  when it is a button. The row shows an inset ring and the focus layer while its action has keyboard focus. A key-value
  row that opens is a link or a button of its own.
- Name each list (`aria-label`), name the record in each row control's `aria-label` ("More for LAPTOP-0042"), and give
  a current row `aria-current` plus a word or the label weight. An `aria-disabled` action stays focusable, so its tip
  can say why; `.ds-lock` is `role="img"` with the reason in `aria-label`.

### Forced colours

The current row is `SelectedItem` / `SelectedItemText`, with a `CanvasText` ring when focused, and its other controls,
chips and media take the system colours again on `Canvas`. A blocked key-value row is `GrayText`. The media's
transparent border becomes its edge, in the current row too. The sticky heading's fill stays opaque.

### Hooks

`--ds-list-item-height`, `--ds-list-padding`, `--ds-list-padding-y`, `--ds-list-radius`, `--ds-list-title-font`,
`--ds-list-media-size`, `--ds-list-media-radius`, `--ds-list-text-min`, `--ds-list-current-bg`, `--ds-list-group-bg`,
`--ds-list-group-top`, `--ds-kv-list-padding`, `--ds-facts-label-width`: see [theming.md](theming.md).

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) and the press of
[Controls](motion.md#controls) in motion.md.
## Timeline

The history of a record, an activity feed or a thread of comments: entries on a rail, grouped by day.

```html
<ol class="ds-timeline" role="list" aria-label="History of LAPTOP-0042">
  <li class="ds-timeline__group" role="presentation"><h3 class="ds-timeline__day">12 Oct 2026</h3></li>
  <li class="ds-timeline__item" data-ds-key="e3">
    <div class="ds-timeline__head">
      <p class="ds-timeline__title">Issued</p>
      <span class="ds-status ds-tone-success">[icon check 16]<span>Active</span></span>
    </div>
    <p class="ds-timeline__meta"><time datetime="2026-10-12T14:05">14:05</time> · Ada Lovelace</p>
    <p class="ds-timeline__text">Issued to Ada Lovelace.</p>
    <div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" aria-label="Edit the entry of 12 Oct 2026, 14:05">Edit</button></div>
  </li>
  <li class="ds-timeline__item ds-timeline__item--muted" data-ds-key="e2">
    <div class="ds-timeline__head"><p class="ds-timeline__title">Return planned</p></div>
    <p class="ds-timeline__text">Cancelled: the loan was extended.</p>
  </li>
  <li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="e1">
    <span class="ds-timeline__marker" aria-hidden="true">[icon user 16]</span>
    <div class="ds-timeline__head"><p class="ds-timeline__title">Owner changed</p></div>
    <p class="ds-timeline__meta">[icon sync 16]Directory sync</p>
  </li>
</ol>

<ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Activity">
  <li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="a2">
    <span class="ds-timeline__marker" aria-hidden="true">GH</span>                       <!-- or <img src="..." alt=""> or an icon -->
    <div class="ds-timeline__head">
      <p class="ds-timeline__title"><strong>Grace Hopper</strong> took LAPTOP-0051</p>
      <time class="ds-timeline__time" datetime="2026-10-12T08:47">08:47</time>
    </div>
  </li>
  <li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--muted" data-ds-key="a1">
    <span class="ds-timeline__marker" aria-hidden="true">[icon sync 16]</span>
    <div class="ds-timeline__head">
      <p class="ds-timeline__title"><strong>The nightly sync</strong> changed nothing</p>
      <time class="ds-timeline__time" datetime="2026-10-12T02:00">02:00</time>
    </div>
  </li>
</ol>

<ol class="ds-timeline" role="list" aria-label="Comments on ticket #42">
  <li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--comment">
    <span class="ds-timeline__marker" aria-hidden="true">GH</span>
    <div class="ds-timeline__head">
      <p class="ds-timeline__title">Grace Hopper</p>
      <time class="ds-timeline__time" datetime="2026-10-12T09:40">09:40</time>
    </div>
    <p class="ds-timeline__text">Can you check the battery too?</p>
    <div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" aria-label="Reply to Grace Hopper">Reply</button></div>
  </li>
</ol>
```

- Each entry is indented by `--ds-timeline-indent` (`--ds-space-8`) and divided from the one before by a hairline
  (`--ds-timeline-divider-color`) from its text edge. Its dot (`--ds-timeline-dot-size`, `--ds-timeline-dot-color`)
  sits on the rail, centred on the head line (`--ds-timeline-head-line`, 24px, the height of a status chip); the rail
  (`--ds-timeline-line-width`, `--ds-timeline-line-color`) runs from dot to dot with a gap around each, through the
  day headings (`.ds-timeline__group` with `.ds-timeline__day`, no dot). `role="list"` keeps the list semantics in
  Safari; the day heading's item is `role="presentation"`.
- `.ds-timeline__item--muted`: a ring (`--ds-timeline-muted-color`, `--ds-outline`) for an entry that did not take
  effect; say why in words. With `--icon` the marker is a ring as well; in a feed the sentence also takes the quieter
  ink. `.ds-timeline__item--icon` with `.ds-timeline__marker`: a disc of `--ds-timeline-marker-size` (24px) on
  `--ds-surface-high` with a 16px icon instead of the dot, an avatar's initials (in proportion to the disc) or an image
  that fills it.
- `.ds-timeline--activity`: a feed. An entry is one sentence, who did what: `.ds-timeline__title` in the body font,
  `<strong>` for who, on the marker's disc; no hairlines and the entries closer together (`--ds-timeline-padding`,
  `--ds-space-2`). `.ds-timeline__time` holds the time at the end of the head line, in any timeline.
- `.ds-timeline__item--comment`: what someone wrote, apart from what happened. The entry's `.ds-timeline__text` stands
  in a box of `--ds-timeline-comment-bg` (`--ds-surface-low`) with a `--ds-line` border and corners of
  `--ds-timeline-comment-radius` (`--ds-radius-card`).
- `.ds-timeline__head` (title and a status chip, wrapping), `.ds-timeline__title` (label font), `.ds-timeline__meta`
  (meta font: the `<time>` and who; a leading 16px icon, the source say, sits on its text line, `--ds-space-1`
  before the text), `.ds-timeline__text` (keeps its line breaks, `--ds-measure` wide),
  `.ds-timeline__body` (a form in place) and `.ds-timeline__actions` (text buttons hang their padding, so their labels
  line up with the text: give the size to `.ds-timeline__actions`, as above, not to each button; name the entry in each
  button's `aria-label`).
- No motion of its own: entries come and go through `DS.motion.flip` with keyed entries (a removed entry moves focus
  to its neighbour; a live feed passes `live: true`), editing in place swaps the text and the form through
  `DS.motion.crossfade` ([motion.md](motion.md#recipes)). The dot is drawn with borders, so it stays in forced colours.

### Options

On the list or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-timeline--activity`, `.ds-timeline__item--comment`, `--muted`, `--icon` | the list, an entry | as above |
| Size | `.ds-xs` ... `.ds-xl` | the rail's marks | the marker and the indent 4px per step, the dot 2px per step; the head line 4px per step above md, no less below it (it still holds a status chip or a line of body text); the title takes the size's type role; not the text or the meta |
| Density | `.ds-density-*` | an entry | the block padding 2px per step (the rail follows); not the type, the marker or the dot |
| Shape | `.ds-shape-*` | the dot, the marker, the comment box | multiplies the radius (a round mark has rounded corners at `.ds-shape-soft`, square ones at `.ds-shape-square`) |
| Touch | `.ds-touch` | its buttons | an entry is no target; its buttons take the minimum themselves |

A status chip on the head line (`.ds-status`) carries the tone of an entry: the rail shows no meaning of its own.

### Keyboard and names

An entry is no target, so the list adds no tab stop: `Tab` reaches its buttons and links. Name the list (`aria-label`)
and the entry in each button's `aria-label`. `role="list"` keeps the list semantics in Safari. Hide the marker
(`aria-hidden`): the sentence says who. Times go into `<time datetime>`.

### Forced colours

The dot, the ring and the rail are borders, so they stay. The marker's border (transparent, or the muted ring) becomes
its edge, and the comment box keeps its border.

### Hooks

`--ds-timeline-indent`, `--ds-timeline-padding`, `--ds-timeline-dot-size`, `--ds-timeline-dot-color`,
`--ds-timeline-muted-color`, `--ds-timeline-line-width`, `--ds-timeline-line-color`, `--ds-timeline-divider-color`,
`--ds-timeline-marker-size`, `--ds-timeline-head-line`, `--ds-timeline-comment-bg`, `--ds-timeline-comment-radius`: see
[theming.md](theming.md).

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) in motion.md.
## Tasks

The steps of a job: an import, a setup, a migration, each step pending, running, done or failed.

```html
<div class="ds-tasks__head"><h3 class="ds-card__title">Set up LAPTOP-0042</h3><p class="ds-meta">2 of 4</p></div>
<ol class="ds-tasks" aria-label="Steps">
  <li class="ds-tasks__item" data-status="done"><span class="ds-tasks__mark">[icon checkCircle 20]</span><span class="ds-tasks__text">Copy the image<span class="ds-sr">: done</span></span></li>
  <li class="ds-tasks__item" data-status="failed"><span class="ds-tasks__mark">[icon alertCircle 20]</span><span class="ds-tasks__text">Join the domain: failed, the server did not answer</span></li>
  <li class="ds-tasks__item" data-status="running"><span class="ds-tasks__mark"><span class="ds-spinner ds-spinner--ink ds-sm"></span></span><span class="ds-tasks__text">Install updates<span class="ds-sr">: running</span></span></li>
  <li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">Restart<span class="ds-sr">: waiting</span></span></li>
</ol>
```

- `data-status` on each `.ds-tasks__item` (set by the page): `pending` a ring in `--ds-outline`, `running` the small
  spinner and the label weight, `done` the check in a circle in `--ds-success` (its tick draws itself when the step turns done in place) and
  the text in `--ds-text-2`, `failed` the alert circle in `--ds-error` with the word in the text. The status is in
  the shape of the mark and the weight of the text, never in colour alone; put it into the text for screen readers
  too (a `.ds-sr` word) and keep the count of `.ds-tasks__head` in step.
- Re-render the list with `DS.dom.morphHtml` (the mark's glyph changes with the status). In forced colours the marks
  take `CanvasText`.

### Options

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-tasks` | the space between the steps 2px per step; not the body font or the 20px mark, a glyph on the text's first line |
| Density | `.ds-density-*` | `.ds-tasks` | the space between the steps 2px per step |
| Shape | `.ds-shape-*` | the pending ring | multiplies its radius (rounded corners at `.ds-shape-soft`, square ones at `.ds-shape-square`) |

The spinner and the check in a circle are round glyphs, no radius. A step is no target and shows its status by its own
colours, so touch and tone do not apply.

### Keyboard and names

A step is no target, so the list adds no tab stop; a link in a step's text is reached as usual. Name the list
(`aria-label`). Each step says its status in words (a `.ds-sr` word, or the sentence of a failed step).

### Forced colours

The marks take `CanvasText`: the shape of the mark and the weight of the text carry the status.

### Hooks

`--ds-tasks-gap`: see [theming.md](theming.md).

**Motion:** the "Tasks" row of [Feedback](motion.md#feedback) in motion.md.
## Prose and code

Rendered rich text (Markdown, a help article, a release note) and blocks of code.

```html
<div class="ds-prose">
  <h2>Before you start</h2>
  <p>Back up the device and note its <strong>asset tag</strong>. See <a href="/help/backup">backups</a>.</p>
  <ul><li>Charger</li><li>Docking station</li></ul>
  <blockquote><p>Devices older than four years are retired, not repaired.</p></blockquote>
  <pre><code>ds-cli retire LAPTOP-0042</code></pre>
  <table><thead><tr><th>Model</th><th>Years</th></tr></thead><tbody><tr><td>Laptop 14</td><td>4</td></tr></tbody></table>
  <hr>
  <p>Ask <mark>IT support</mark> when in doubt.</p>
  <ul>
    <li><label><input type="checkbox" disabled checked> Charger packed</label></li>                  <!-- a task list -->
    <li><label><input type="checkbox" disabled> Label printed</label></li>
  </ul>
  <div class="ds-prose__callout ds-tone-warning" role="note">                                         <!-- a callout -->
    <p class="ds-prose__callout-title">[icon alert 16]Warning</p>
    <p>Retiring a device erases it.</p>
  </div>
  <section class="ds-prose__footnotes"><ol><li id="fn-1">The policy of the IT department.</li></ol></section>
</div>

<div class="ds-prose ds-prose--compact"> ... </div>                                                   <!-- a chat bubble -->

<pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1
Accept: application/json</code></pre>
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-prose--dense` | the prose | the body role instead of the reading role, the same hierarchy (in a card, a side sheet) |
| Variant | `.ds-prose--compact` | the prose | for a chat bubble or a narrow panel: the body role, every heading at that size in the label weight, blocks `--ds-space-1` apart, less padding in quotes, callouts, code and table cells |
| Variant | `.ds-code-block--wrap` | `.ds-code-block` | long lines wrap |
| Tone | `.ds-tone-*` | `.ds-prose__callout` | the tint and its ink; always with `.ds-prose__callout-title`, a word and an icon |
| Density | `.ds-density-*` | the prose or an ancestor | 1px per step off the gap between blocks, 2px off the padding of quotes, callouts, code and table cells (`.ds-prose--compact`, tight already: 1px, and a cell keeps its side padding); the text stays. A density class on one block changes that block, not the gap above it |
| Shape | `.ds-shape-*` | the prose or an ancestor | multiplies the radius of quotes, callouts, code blocks and inline code |
| Size, touch | not read | | text keeps its role; the only targets are links in text and read-only checkboxes |

- `.ds-prose` styles only bare elements inside it, under `:where(.ds-prose)`, so any class of the page wins over what
  it sets and an element with a class that starts with `ds-` keeps its component's look (a class that merely contains
  those letters, such as `needs-review`, is the page's own): the
  margins reset, then one gap of `--ds-prose-gap` (`--ds-space-2`) between blocks and `--ds-space-5` above a
  heading; `h1` headline, `h2` subtitle, `h3` and `h4` the label weight at the reading size; lists indented
  `--ds-space-5` with `--ds-space-1` between items; `strong` in `--ds-prose-strong-weight` (the label weight); links
  underlined like every link; a `pre` is a code block; a `table` gets hairline rows, a `--ds-text-2` head and tabular
  figures and scrolls sideways when it is wider; a `blockquote` is a `--ds-surface-high` block on `--ds-radius-card`;
  images are never wider than the text. Font `--ds-prose-font` (`--ds-font-reading`); `.ds-prose--dense` takes
  `--ds-font-body` (in a card, a side sheet). Long words hyphenate where the browser can (progressive:
  `hyphenate-limit-chars`, only words of 18 characters or more), else break.
- Task lists: a list item that starts with a checkbox (the input directly in the `<li>`, or in its first `<p>` or
  `<label>`, as Markdown renderers write them) loses its bullet and takes the checkbox in the bullet's place,
  drawn like a `.ds-checkbox` in `--ds-primary`, without its motion; wrapped lines stay in line with the text. Name each
  checkbox with a `<label>` around it: a bare input has no name. Rendered text is read-only unless the page wires it, so
  `disabled` does not dim the box here: it is how Markdown says read-only, and the state must read.
- Callouts: `.ds-prose__callout` with `.ds-prose__callout-title` (an icon and a word) and a tone
  (`.ds-tone-info`, `-success`, `-warning`, `-error`, on the callout itself; without one the quote's surface, also
  inside an element with a tone): the block takes `--ds-tone-container` and `--ds-on-tone-container`, bare links in it
  the same ink, still underlined; a component in it keeps its look. The word says what it is, so meaning never rests on
  the colour.
- Footnotes: `.ds-prose__footnotes`, the meta role in `--ds-text-2` under a hairline; link the marks with `<sup><a>`.
- `.ds-code-block`: the code role on `--ds-code-bg` in the card radius (`--ds-code-block-radius`, times `--ds-shape`), one line per line (`white-space: pre`, tab
  size 2), scrolling sideways with a thin scrollbar. Give it `tabindex="0"` and a name (`aria-label`) only when it can
  scroll sideways, so a keyboard reaches it (an inset ring). A `code` inside loses the inline chip.
  `.ds-code-block--wrap` wraps long lines instead.
- Under `.ds-base` bare headings take the type roles already (`h1` headline, `h2` subtitle, `h3` to `h6` the label
  role, no margins); `.ds-prose` keeps a reading hierarchy for rendered text.
- Keyboard and names: links and checkboxes are native; a code block that can scroll needs `tabindex="0"` and an
  `aria-label` (an inset ring on `:focus-visible`, solid from the first frame).
- Forced colours: quotes, callouts and code blocks keep their edge (a transparent outline the forced colours paint); a task
  box takes `Highlight` / `HighlightText` when checked, a `CanvasText` edge when not. Print: code blocks and tables wrap.
- Hooks: `--ds-prose-gap`, `--ds-prose-font`, `--ds-prose-strong-weight`, `--ds-prose-radius`, `--ds-code-block-radius`
  ([theming.md](theming.md#component-hooks)).
## Empty state

Says that there is nothing to show and why, at the size of its place, or confirms that a job finished.

```html
<div class="ds-empty">
  <span class="ds-empty__disc" aria-hidden="true">[icon box 24]</span>
  <p class="ds-empty__title">No devices yet</p>
  <p class="ds-empty__text">Add the first one or import a list.</p>
  <button class="ds-btn ds-btn--tonal" type="button">Add device</button>
</div>
```

At most one sentence and one action; two actions go into `.ds-empty__actions`. A picture takes the disc's place:

```html
<div class="ds-empty ds-empty--page ds-empty--first-use">
  <span class="ds-empty__media" aria-hidden="true"><img src="fleet.svg" alt=""></span>
  <p class="ds-empty__title">Bring your fleet in</p>
  <p class="ds-empty__text">Import a list, or add the first device by hand.</p>
  <div class="ds-empty__actions"><button class="ds-btn ds-btn--filled" type="button">Import a list</button><button class="ds-btn" type="button">Add device</button></div>
</div>

<div class="ds-empty ds-empty--inline ds-empty--no-results">
  <span class="ds-empty__disc" aria-hidden="true">[icon search 16]</span>
  <p class="ds-empty__title">No matches</p>
  <p class="ds-empty__text">Nothing matches "floor 9".</p>
  <button class="ds-btn ds-btn--text" type="button">Clear</button>
</div>
```

**Options** ([options.md](options.md)): classes on the empty state or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the empty state |
|---|---|---|---|
| Place | `.ds-empty--section` (the default, named), `.ds-empty--page`, `.ds-empty--inline` | the empty state | `--section`: at most 400px, 32px of block padding, a 48px disc, in a card or a panel. `--page`: at most 480px, 96px, a 72px disc and the title type, a whole page or panel. `--inline`: full width and left-aligned, disc or picture, words and action in a row, 32px, the label and meta type, 12px of block padding, in a list, a popup or a table cell; its actions take at most half the row and stack when it is narrow |
| Cause | below | the empty state | the disc's colours (below) |
| Tone | `.ds-tone-*` | the empty state itself; an inherited tone is ignored | the disc in the tone's container pair, over a cause |
| Size | `.ds-xs` ... `.ds-xl` | the empty state or a group | 8px of disc and 8px of block padding per step (`--inline`: the disc only, its padding takes neither the step nor `--ds-empty-padding`); the type stays that of its place |
| Density | `.ds-density-*` | any container | 2px of padding per step (so 28px of block padding and 12px at the sides under `themes/compact.css`) |
| Shape | `.ds-shape-*` | any container or the theme | the disc's corners times 0, .5, 1, 1.5: square at 0, a disc at the default |
| Touch | | | not read; its buttons read it |

Why it is empty decides the words, the action and the colours. Icon and words always say it, never the colour alone:

| Cause | Class | Disc | Icon | Title and text say | Action | Role |
|---|---|---|---|---|---|---|
| No data yet | `.ds-empty--no-data` | the tint | the object's | what will appear here | add the first | none |
| First use | `.ds-empty--first-use` | primary container | the object's, or a picture | what this page is for | start | none |
| Not set up | `.ds-empty--not-set-up` | primary container | `settings` | which step is missing | go to the step | none |
| No results | `.ds-empty--no-results` | neutral | `search` | what was searched | clear the filter | `status` |
| No access | `.ds-empty--no-access` | neutral | `lock` | who can give access | request it, if there is a way | none |
| Offline | `.ds-empty--offline` | warning container | `wifiOff` | what cannot be reached, what still works | retry | `status` |
| Error | `.ds-empty--error` | error container | `alertCircle` | what failed, in words | retry | `alert` |

It has no motion of its own; how it comes depends on what brought it ([motion.md](motion.md#data-motion)):

| What happened | Motion |
|---|---|
| It replaces a skeleton (first load) | `.ds-reveal` |
| A filter, search or live update left nothing | the rows leave through `DS.motion.flip` (they fade out in place), then `DS.motion.enter(empty, 'fade')`, without a rise |
| The filter was cleared | `DS.motion.leave(empty)` while the rows enter through `flip` |
| The user deleted the last item | the disc pops in: `DS.motion.enter(disc, 'pop')` |

A confirmation (a request sent, a job done) is the done state, with a drawn check in the disc:

```html
<div class="ds-empty ds-empty--done" role="status">
  <span class="ds-empty__disc" aria-hidden="true">[icon check 24]</span>
  <p class="ds-empty__title">Request sent</p>
  <p class="ds-empty__text">We will answer within a day.</p>
  <button class="ds-btn ds-btn--tonal" type="button">Send another</button>
</div>
```

`.ds-empty--done` brings its own entrance: the disc fades in and pops up on the spring (`ds-fade-in`, `ds-pop-in`,
`--ds-dur-slow`) after `--ds-dur-base`, a ring widens and fades once behind it (`ds-ripple`) after `--ds-dur-slow`, and
the `pathLength="1"` check (`DS.icons.check`) draws itself (`ds-draw`, `--ds-dur-glide`, `--ds-ease-out`). It plays
when the element is inserted or shown (`hidden` removed), never again while a re-render (`DS.dom.morphHtml`) keeps
the node.

Hooks ([theming.md](theming.md#component-hooks)): `--ds-empty-disc-size` (48px; `--page` 72px, `--inline` 32px; on the
element or in the theme, say for a confirmation page: the ring follows, the glyph keeps the size of its markup, `[icon
check 32]` in a 72px disc), `--ds-empty-disc-bg` and `--ds-empty-disc-color` (over any cause or tone),
`--ds-empty-padding` (not `--inline`), `--ds-empty-media-size` (`--inline`: 32px).

**Accessibility.** The disc and the picture are decoration (`aria-hidden`, `alt=""`); the title says it. One that comes
because of a user's action takes the role of the table above. Keyboard: no stop of its own; `Tab` reaches its action.

**Forced colours.** The fill of the disc goes, the icon and the words stay; the done state's disc keeps an outline.

**Motion:** [Data motion](motion.md#data-motion) in motion.md.
## Status chip

The state of one item, always with an icon and a word.

```html
<span class="ds-status ds-tone-success">[icon check 16]<span>Synced</span></span>
<span class="ds-status ds-tone-warning">[icon alert 16]<span>Expires soon</span></span>
<span class="ds-status ds-tone-error">[icon alert 16]<span>Failed</span></span>
<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span>
<span class="ds-status">[icon clock 16]<span>Waiting</span></span>
<span class="ds-status">[icon ban 16]<span>Off</span></span>
```

Always icon and word. Show chips for deviations, not for the normal case. When the label of a running chip changes,
update the text node only, so the spinner does not restart (`DS.dom.morphHtml`).

**Options** ([options.md](options.md)): classes on the chip or any ancestor, except the tone. The same for a tag.

| Option | Classes | Where it applies | Effect on the chip |
|---|---|---|---|
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error`; none: neutral | the chip itself; an inherited tone is ignored | the tone's container pair behind the icon and the word |
| Variant | `--running` | the chip | a neutral chip with the primary spinner |
| Size | `.ds-xs` ... `.ds-xl` | the chip or a group | 4px per step, 16 to 32px, and 2px of side padding per step; the caption type and the icon's markup size stay |
| Shape | `.ds-shape-*` | any container or the theme | the corners times 0, .5, 1, 1.5; at the default, round at one line at any size |
| Density, touch | | | not read: a chip sits in a line, like a badge, and it is no target. So `themes/compact.css` keeps 2.x's 24px; a smaller chip is `.ds-sm` |

- `.ds-status--ok`, `.ds-status--warning`, `.ds-status--error` are **deprecated** (3.0, removed when 3.0 ships):
  `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the chip, the same look under the option every component
  shares.
- Hooks: `--ds-status-height` (24px, the md base), `--ds-status-radius` (`--ds-radius-md`, or half the height of a
  taller chip), `--ds-status-spinner-width` (2px) ([theming.md](theming.md#component-hooks)).

**Accessibility.** The word is the status and the icon is `aria-hidden`. A chip is no stop of its own and needs no role;
a status that changes while the user waits goes through a live region (`DS.overlay.announce`, or a `role="status"`
around it). Forced colours: the fill goes, icon and word stay in `CanvasText`; a tone changes nothing there, so the word
carries the meaning; the running spinner's arc turns `Highlight`.

Status changes glide, for a user action and a poll alike: render with `DS.dom.morphHtml`, which patches the kept
chip in place, so its container and icon change colour over `--ds-dur-medium` (250ms); an icon or spinner that
comes in new (running to ok) fades in and springs up from `--ds-scale-small` (`@starting-style`, which also plays on a
chip's first render). A row that a keyed `morphHtml` moves (a sort) keeps its icon as it is: where `moveBefore` is
missing, the moved node carries `data-ds-moving` for one style flush, so the entrance never plays again. The label text
changes at once. A page that swaps the icon itself can cross-fade it with `DS.motion.crossfade(chip, icon, { kind: 'icon' })`.

### Tags

A tag is a label of words ("Preview", "Beta", "External"), not a state and not a count; it is not interactive:

```html
<span class="ds-tag">Preview</span>
<span class="ds-tag ds-tone-neutral">[icon tag 16]External</span>
<span class="ds-tag ds-tone-info">Internal</span>
```

The caption type on the tint (hooks `--ds-tag-bg`, `--ds-tag-color`, from `--ds-accent` and `--ds-on-accent`; a tone:
its container pair, neutral `--ds-surface-high` and `--ds-text`), an optional leading 16px icon (`--ds-on-accent-icon`),
the pill radius at half its height (`--ds-tag-height`, 24px at md, with the size as on the chip and no density; times
the shape). Forced colours draw a `CanvasText` outline. `.ds-tag--neutral` is **deprecated** (3.0, removed when 3.0 ships):
`.ds-tone-neutral`. Tag = words, badge = counts ([Badge](#badge)), status chip = a state with an icon.

**Motion:** the "Status chip" row of [Feedback](motion.md#feedback) in motion.md.
## Badge

A count or a dot on a button, chip, tab or drawer item:

```html
<button class="ds-btn" type="button">[icon mail 16]Inbox <span class="ds-badge">3</span></button>
<label class="ds-chip"><input class="ds-chip__input" type="checkbox" name="state" value="failed"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Failed</span> <span class="ds-badge ds-tone-error">2</span></span></label>
<span class="ds-badge ds-tone-neutral">12</span>
<span class="ds-badge" data-ds-badge="128" data-ds-badge-max="99"></span>          <!-- shows 99+ -->
<button class="ds-btn ds-btn--quiet" type="button">Tasks <span class="ds-badge ds-badge--dot ds-tone-primary"><span class="ds-sr">New tasks</span></span></button>
```

**Options** ([options.md](options.md)): classes on the badge or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the badge |
|---|---|---|---|
| Variant | `.ds-badge--dot` | the badge | a dot, `--ds-badge-dot-size` (8px at md), always round; needs its word, in `.ds-sr` inside it or beside it |
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error`; none: the tint (a dot: `--ds-primary`, so it holds 3:1 on a surface) | the badge itself; an inherited tone is ignored, so a badge in an error alert stays what it was | the tone's container pair (a dot: the full colour) |
| Size | `.ds-xs` ... `.ds-xl` | the badge or a group: a small button takes a small badge | 2px per step, 16 to 24px (a dot 4 to 12px); the caption type stays |
| Shape | `.ds-shape-*` | any container or the theme | the corners times 0, .5, 1, 1.5, at most half the height; a dot stays round |
| Density, touch | | | not read: it sits in a line or on a control, and it is no target |

- A pill of at least `--ds-badge-size` (20px at md) in the caption type with tabular figures, on the tint
  (`--ds-badge-bg`, `--ds-badge-color`: `--ds-accent`, `--ds-on-accent`; radius `--ds-badge-radius`, never above half
  the size). A toned badge needs its word in the row ("Failed", "2 errors"): colour is never the only signal. An empty
  badge takes no room; an empty dot does.
- `.ds-badge--neutral`, `.ds-badge--ok`, `.ds-badge--warning`, `.ds-badge--error` are **deprecated** (3.0, removed when
  3.0 ships): `.ds-tone-neutral`, `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the badge, the same look
  under the option every component shares.
- On a tinted host (a pressed toggle, `.ds-btn--tonal`, an open disclosure button, a checked chip, an input chip, a
  selected table row) the default badge turns to `--ds-primary` / `--ds-on-primary` and the neutral one to
  `--ds-surface` / `--ds-text-2`, so it never melts into the tint. In a disabled or `aria-disabled` button, chip, tab
  or drawer item it takes the disabled model over any tone (`--ds-disabled-fill`, `--ds-disabled-ink`; a theme that
  dims instead keeps its colours and fades it with the host).
- A dot without a tone on a filled button takes the fill's ink (`--ds-on-primary`), where primary would vanish.
- Hooks: `--ds-badge-size`, `--ds-badge-dot-size`, `--ds-badge-radius`, `--ds-badge-bg`, `--ds-badge-color`
  ([theming.md](theming.md#component-hooks)).
- A badge on an icon button's corner is not available yet: every ripple host clips while a ripple is inside. Put the
  count next to the label of a button instead.

**A count with a maximum.** `data-ds-badge` holds the count and `data-ds-badge-max` the largest figure (default 99):
past it the badge shows `99+`, at zero or below nothing, so it takes no room. `DS.init()` finds them, and a change of
either attribute updates the figure. From the page:

```js
const badge = DS.badge.create(el, { value: 3, max: 99 });   // or DS.core.get(el, 'badge') on the attribute path
badge.set(128);                                             // 99+
badge.get();                                                // 128
badge.on('change', ({ value, text }) => { /* also a bubbling ds:change on the badge */ });
DS.badge.format(128);                                       // '99+', for a page that renders the text itself
```

`DS.badge.create` returns the controller (`get`, `set`, `on`, `destroy`); `DS.badge.format` is the pure function behind
it. A page that re-renders with `DS.dom.morphHtml` writes the text in its template as well (`DS.badge.format(count)`):
a patch puts back the children of its template.

**Accessibility.** Give the host an accessible name that includes the count where it matters (`aria-label="Inbox, 3
new"`), or keep the number in the text as above: `99+` is what a screen reader hears from the figure. A dot says
nothing without its word. A badge is no stop of its own: `Tab` reaches its host.

**Forced colours.** `Canvas` and `CanvasText` with a `CanvasText` outline (`GrayText` in a blocked host), so a dot stays
visible; a tone changes nothing there, so the word carries the meaning.

**Motion.** Colours glide on `--ds-dur-fast`. A count that appears pops in (`DS.motion.enter(badge, 'pop')`), one that
goes pops out (`DS.motion.leave(badge, 'pop', { then: 'hide' })`), which the controller's `set()` does by itself; the
number itself changes at once, and nothing plays on load ([motion.md](motion.md#a-count-badge)).
## Alert

Tells the user something about a page or a section, in place, with an icon and a word; never colour alone.

```html
<div class="ds-alert" role="status">[icon info 20]<span class="ds-alert__text">Sync runs at night.</span></div>
<div class="ds-alert ds-tone-success">[icon checkCircle 20]<span class="ds-alert__text">All devices synced.</span></div>
<div class="ds-alert ds-tone-warning">[icon alert 20]<span class="ds-alert__text">The certificate expires in 5 days.</span>
  <button class="ds-btn ds-btn--text ds-sm" type="button">Renew</button></div>
<div class="ds-alert ds-tone-error" role="alert">[icon alertCircle 20]<span class="ds-alert__text">Could not load devices.</span>
  <button class="ds-btn ds-btn--text ds-sm" type="button">Try again</button></div>

<details class="ds-errors ds-collapsible">
  <summary>[icon alertCircle 16]2 errors[icon chevronDown 16 ds-errors__chevron]</summary>
  <ul><li>Row 4: unknown model</li><li>Row 9: duplicate serial</li></ul>
</details>
```

The plain `.ds-alert` is the neutral (information) alert: quiet surface, primary icon, no modifier.

A title, more paragraphs and actions; findings in a card (`.ds-alert--plain`):

```html
<div class="ds-alert ds-tone-warning">[icon alert 20]
  <div class="ds-alert__text"><p class="ds-alert__title">Certificate expires soon</p><p>Renew it before 1 May.</p></div>
  <div class="ds-alert__actions"><button class="ds-btn ds-btn--text ds-sm" type="button">Renew</button><button class="ds-btn ds-btn--text ds-sm" type="button">Remind me</button></div>
</div>

<section class="ds-card">
  <h2 class="ds-card__title">Findings</h2>
  <div class="ds-alert ds-alert--plain ds-tone-error">[icon alertCircle 20]<span class="ds-alert__text"><strong class="ds-alert__title">Disk almost full</strong> 92% used on drive C.</span></div>
  <div class="ds-alert ds-alert--plain ds-tone-warning">[icon alert 20]<span class="ds-alert__text">Warranty ends in 30 days.</span></div>
</section>
```

An inline message under a field or in a row; a section message, a block with its title and actions:

```html
<p class="ds-alert ds-alert--inline ds-tone-warning">[icon alert 16]<span class="ds-alert__text">Used by 3 other devices.</span></p>

<div class="ds-alert ds-alert--section ds-tone-error" role="alert">[icon alertCircle 20]
  <div class="ds-alert__text"><p class="ds-alert__title">The import stopped</p><p>Row 812 has no serial number. Nothing was saved.</p></div>
  <div class="ds-alert__actions"><button class="ds-btn ds-btn--filled" type="button">Open the file</button><button class="ds-btn ds-btn--text" type="button">Discard</button></div>
</div>
```

**Options** ([options.md](options.md)): classes on the alert or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the alert |
|---|---|---|---|
| Variant | `--plain`, `--inline`, `--section` | the alert | a finding on its card; a message without a box; a block with its actions under the text |
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error`; none: the quiet neutral | the alert itself; an inherited tone is ignored | the fill, the ink and the icon, from the tone's container pair and colour (warning: `--ds-warning-surface` and `--ds-text`, as ever); an error alert's buttons take its ink; `--plain` and `--inline` keep only the icon |
| Size | `.ds-xs` ... `.ds-xl` | the alert or a group | 2px of padding per step, and its buttons step with it; type and icon stay |
| Density | `.ds-density-*` | any container | 2px of padding per step (12 and 16px at comfortable, 8 and 12px at dense, and so under `themes/compact.css`); type and icon stay |
| Shape | `.ds-shape-*` | any container or the theme | the corners times 0, .5, 1, 1.5; `--plain` and `--inline` have none |
| Touch | `.ds-touch` | the theme or a container | its buttons and the `.ds-errors` summary, at least `--ds-touch-target` high; the alert itself is no target, but it grows to hold its button (below) |

- `.ds-alert--success`, `.ds-alert--warning`, `.ds-alert--error` are **deprecated** (3.0, removed when 3.0 ships): `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the alert, the same look under the option every component shares.
- `.ds-alert__title` (the label font, the alert's ink) opens `.ds-alert__text` in every alert; paragraphs in the text
  lose their margins and stand `--ds-space-2` apart.
- `.ds-alert__actions` after the text holds one or more buttons side by side; the alert then wraps, the text takes at
  least `--ds-alert-text-basis` (256px) and the actions drop under it on a narrow row.
- A button hangs out of the first line, centred on it. Its hang is never more than the block padding, and the padding
  grows when a button needs more: a `.ds-sm` button under `.ds-touch` makes a 48px alert at any density, and a default
  button at `.ds-xl` a 56px one.
- `.ds-alert--plain`: a finding in a card, on the card's surface: no fill, no edge, no inline padding, no radius, the
  tone's icon; hairlines between consecutive plain alerts. Static findings carry no live role.
- `.ds-alert--inline`: the meta type, a 16px icon in the tone and the word in `--ds-text`, on whatever is behind it; no
  fill, edge, padding or radius, so size, density and shape have nothing to change. For a form's validation messages
  keep `.ds-field__error` ([Form](#form)); this is a note next to a value or under a field that has no error.
- `.ds-alert--section`: two columns, the icon and the text; the title in the subtitle font, more padding (hooks below),
  the actions or a lone button always under the text, in its column.
- Hooks ([theming.md](theming.md#component-hooks)): `--ds-alert-bg`, `--ds-alert-color`, `--ds-alert-icon` (also the
  edge colour), `--ds-alert-edge` (a leading edge's width, default none: `4px` gives the edge look), `--ds-alert-radius`,
  `--ds-alert-padding-block`, `--ds-alert-padding-inline`, and per tone `--ds-alert-success-bg`,
  `--ds-alert-success-color`, `--ds-alert-success-icon`, `--ds-alert-warning-bg`, `--ds-alert-warning-color`,
  `--ds-alert-warning-icon`, `--ds-alert-error-bg`, `--ds-alert-error-color` (also the ink of an error alert's buttons),
  `--ds-alert-error-icon`.

**Accessibility.** An alert that appears because something happened takes a live role: `role="status"`, or
`role="alert"` when it needs attention at once; a static finding takes none. Its icon is `aria-hidden` and the word
says the meaning. Keyboard: an alert has no stop of its own; `Tab` reaches its buttons, links and the `.ds-errors`
summary (`Enter` or `Space` opens the list).

**Forced colours.** The fill goes and a transparent outline becomes the edge of a box (`--plain` and `--inline` have
none); icon and word stay in `CanvasText`, and a tone changes nothing there, so the word carries the meaning.

Alerts have no entrance of their own: one re-rendered with fresh data is patched in place and never fades in again.
An alert that comes or goes, by a user action or live data, does it through `DS.motion.flip` on its stack (a flex or
grid column with a gap), with no export of its own and no height animated
([motion.md](motion.md#data-motion)):

```js
DS.motion.flip(stack, () => alert.remove());       // dismiss: it fades out in place, the alerts below glide up
DS.motion.flip(stack, () => stack.prepend(alert)); // insert: it fades in, the others glide down
DS.motion.flip(stack, () => stack.prepend(alert), { live: true }); // live data: waits while the stack is pointed at
```

A dismiss that removes the focused button needs nothing more: `flip()` moves focus to the same button of the next
alert, else of the previous one (`refocus`, 2.0; pass `refocus: heading` to land on the section's heading when the
last one goes). An alert that replaces a placeholder takes `.ds-reveal`.

The summary of `.ds-errors` is pressable: a state layer in its colour (hover, press in `--ds-dur-micro`, keyboard
focus with `--ds-state-focus`) in a 4px padding that hangs into the space around it, the ripple, and its own focus
ring (also without `.ds-base`) that is solid from the first frame and snaps to its offset. It is not a pill and
does not morph. Its chevron turns 180deg with the list on the spring, like `.ds-chevron`; with `.ds-collapsible`
the list opens and closes with the collapsible timing.

**Motion:** the "Alert, tile, card" row of [Feedback](motion.md#feedback) and [Data motion](motion.md#data-motion) in motion.md.
## Table

Records in columns, to compare, sort, select in bulk and act on per row. It stays a plain `<table>`: every option below
is a class, and the behaviour (sorting, filtering, selecting) is the page's own script.

```html
<section class="ds-card">
  <div class="ds-table-wrap">
    <table class="ds-table">                      <!-- ds-table--zebra, --bordered, --plain; ds-density-tight: 40px rows -->
      <caption class="ds-sr">Devices</caption>
      <thead><tr>
        <th scope="col" aria-sort="ascending"><button class="ds-table__sort" type="button">Device [icon arrowUp 16 ds-table__sort-arrow]</button></th>
        <th scope="col" class="ds-num"><button class="ds-table__sort" type="button">Age</button></th>
        <th scope="col" class="ds-col--secondary">Owner</th><th scope="col">Status</th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="ds-col--text"><button class="ds-link-btn" type="button">Printer on floor 2</button></td>
          <td class="ds-num">3.2</td>
          <td class="ds-col--secondary">Ada Lovelace <small>(default)</small></td>
          <td><span class="ds-status ds-tone-success">[icon check 16]<span>OK</span></span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

- 48px head, 52px rows, hairlines. In a card the table runs to the card edges.
- Row hover is a state layer on the cells (`currentColor` at `--ds-state-hover-lg`, `--ds-dur-fast`), so it adds to
  a selected row's colour; `--ds-table-row-hover` sets a fixed colour instead.
- `.ds-num` right-aligns tabular figures; `.ds-col--text` keeps a readable width; `.ds-col--secondary` is dropped on
  phones. `.ds-table--wide` also drops secondary columns when the page is narrow (next to the drawer). In a card the
  last column still shown keeps the card's gutter at its end, so trailing secondary columns can drop.
- Sortable columns: a `.ds-table__sort` button in the header cell and `aria-sort` on the cell; the arrow shows at the
  sorted column only; every sort button keeps room for it (1.6.1), so moving the sort never shifts the columns. In a
  `.ds-num` column the arrow leads. Render the same up arrow for both directions and mark
  it `.ds-table__sort-arrow`: `aria-sort="descending"` turns it 180deg on the spring (when the header is patched in
  place by `morphHtml`). An arrow without the marker is never turned, so a page that renders `arrowDown` for a
  descending column keeps showing it as drawn.
- Short values that must not break (an ID with a hyphen) take `.ds-nowrap`.
- A table that scrolls sideways in a card (on phones, or `.ds-table--wide` in a narrow content area) fades at the
  card's edge while columns follow (2.0: the one fade model of the [Horizontal scroller](#horizontal-scroller)).
  Where scroll timelines exist (progressive: `animation-timeline`) the fades follow the scroll position: the end fade
  goes over the last `--ds-space-8` of the travel, a start fade grows over the first `--ds-space-8` once the table has
  left its start, and a table that fits shows neither. `ds-scroll-edge-start` and `ds-scroll-edge-end` drive the
  registered numbers `--ds-scroll-edge-start` and `--ds-scroll-edge-end` (0 or 1, times the fade length) on the
  wrapper's own scroll timeline. Elsewhere `DS.dom.scrollEdges(wrapper)` sets them through `data-ds-overflow-start`
  and `data-ds-overflow-end`, and writes `data-ds-edges` after its first measurement, so the fades glide only from
  then on; without it the static fade at the right edge stays. The fade is `--ds-scroll-fade`
  long (default `--ds-card-pad`); `--ds-scroll-fade: 0px` on the theme turns every fade off. The scrollbar strip stays
  unmasked (`--ds-scrollbar-height`, written by `scrollEdges()`). A wrapper with stacked rows never fades. A table
  scrolled sideways that then fits (columns hidden, a filter, a wider window) keeps its last fade in Chromium and
  WebKit: call `DS.motion.resyncScroll(wrapper)` after such a change. `ds-edge-fade`, `--ds-table-fade-start` and
  `--ds-table-fade-end` (the 1.x model, internal) are deprecated in 2.0 and unused (removed in 3.0 at the earliest).
- A wrapper whose cells hold nothing focusable cannot be reached by the keyboard (WebKit gives a scroller no tab stop
  of its own): make it one, `<div class="ds-table-wrap" tabindex="0" role="region" aria-label="Devices">`. Its ring is
  inset (it rests at the edge and snaps inward) and the fades drop while it is focused.
- `.ds-table__sort` presses in `--ds-dur-micro` and ripples (it is not a pill, so it does not morph); keyboard focus
  shows the ring, which snaps to its offset, and the focus layer.
- `.ds-link-btn` is an inline link: no ripple and no morph, which would reach outside its line of text. Keyboard
  focus shows the ring (also without `.ds-base`), snapping to its offset; a press darkens its underline, the press
  feedback on touch screens.
- Any checkbox in a `.ds-table` is drawn like `.ds-checkbox` ([Form](#form)), with a halo that the table's
  wrapper does not clip; a switch or a chip in a cell keeps its own look.
- Figures in tables never count up; a changed value shows at once.

Sort, filter (also while typing) and live data glide (1.4): key the rows with `data-ds-key` and render through
`DS.motion.flip` and `DS.dom.morphHtml`:

```js
// A user's sort or filter (also per keystroke): glides at once, a call mid-glide continues from where each row is.
DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(rows), options), { items: 'tr' });
// Polled data: values update at once; a reorder waits while a mouse or pen is over the rows or a row has focus (at most 2s).
DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(rows), options), { items: 'tr', live: true });
```

Moved rows glide on `translate` on the spring, entering rows fade in, removed rows go at once while the rows below
glide up (a table row cannot leave out of flow), and above 50 moving rows the update lands without motion. While
rows glide, `flip()` marks the `tbody` with `data-ds-glide` and `--ds-flip-backdrop` (the colour behind the table), and
every row gets an opaque backing in that colour (a selected row its colour over it), so rows that cross never show
their text through each other (1.6.1). `live`
is only for polled updates; sorting and filtering are user actions. More in
[motion.md](motion.md#data-motion).

With live data, a column whose content changes width (a status chip, a figure that gains a digit) gets a stable
width (a `min-width` on its `th`, or a `<col>`), so the columns do not shift sideways when a value changes: `flip()`
moves rows only vertically, and automatic table layout re-divides the widths on every change.

### Interactive, selected and expandable rows

```html
<table class="ds-table ds-table--interactive">
  <thead><tr>
    <th scope="col"><input type="checkbox" aria-label="Select all"></th>          <!-- indeterminate for some -->
    <th scope="col"><span class="ds-sr">Details</span></th><th scope="col">Device</th><th scope="col">Status</th>
  </tr></thead>
  <tbody>
    <tr data-ds-key="p2" class="ds-table__row--selected">                         <!-- or just the checked box -->
      <td><input type="checkbox" aria-label="Select Printer on floor 2" checked></td>
      <td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="false" aria-controls="p2-detail"
            aria-label="Details">[icon chevronDown 20 ds-chevron]</button></td>
      <td class="ds-col--text"><a class="ds-link-btn ds-table__row-link" href="/devices/p2">Printer on floor 2</a></td>
      <td><span class="ds-status ds-tone-success">[icon check 16]<span>OK</span></span></td>
    </tr>
    <tr class="ds-table__detail" id="p2-detail" data-ds-key="p2-detail" inert>
      <td colspan="4"><div class="ds-table__expand"><div>
        <dl class="ds-facts">...</dl>
      </div></div></td>
    </tr>
  </tbody>
</table>
```

- **Interactive** (`.ds-table--interactive`): every body row opens its record. The row's primary link or button
  carries `.ds-table__row-link`; its `::after` stretches over the row, so a click anywhere on the row follows it,
  while the row's other controls (checkbox, toggle, buttons) stay above it. Keyboard focus shows the focus layer on
  the row and the ring around the row, inset so the scroller never clips it. The press is the cell layer at
  `--ds-state-pressed` in `--ds-dur-micro`; with `DS.ripple.attach()` the row ripples from the pointer instead
  (Enter on the row link ripples from the centre). A row's first cell may be a `<th scope="row">` row header: it
  takes the row's layers and holds the ripple like a `<td>`. A row without a `.ds-table__row-link` stays plain (2.0):
  no pointer, no press layer, no ripple, since it opens nothing.
- **The row is the link's box** (2.1.1): such a row is positioned, and every body row of an interactive table has
  an identity transform (`transform: translateX(0)`), because WebKit (macOS Safari 26, iOS before 27) lays a table
  row out static whatever its `position`; without the transform every row's link stretched over the whole table and
  the last row took every click, the hover, the status bar URL and WebDriver's element clicks. A row is therefore a
  stacking context and the box of `position: fixed` descendants, except while it holds a `.ds-menu` or
  `.ds-combo__popup` that the script places (no popover or anchor positioning, so no `data-anchored`), which then stays
  fixed against the viewport. WebKit gives the stretched area the table's height below the row's top: the rows below, painted above
  it, still take their own clicks, the last row's area ends at the wrapper, and a focused row clips what it holds to
  itself (`clip-path: inset(0)`), so in WebKit its ring shows on the top and the sides only. `DS.ripple` sizes a
  row's ripple to the row itself. (Anchor positioning would size the area exactly, but WebKit then restyles the link
  from its initial values on every load and its underline and ring offset transition.)
- **Selected** (`.ds-table__row--selected`, or any row with a checked checkbox directly in a cell): the row takes
  `--ds-table-row-selected` (default `--ds-accent`) over `--ds-dur-fast`; select all changes every row in the same
  frame, with no stagger. The checkbox is the cue that does not rely on colour, in every row and in the header cell
  (bulk selection; set `indeterminate` when only some rows are selected).
- **Expandable**: the trigger row holds a `.ds-table__toggle` with a `.ds-chevron` and `aria-expanded`, followed by
  a `.ds-table__detail` row whose single cell holds `.ds-table__expand` and one child. The detail opens by
  `grid-template-rows` over `--ds-dur-medium` on `--ds-ease-out` and closes over `--ds-dur-base` on `--ds-ease-in`
  (it pushes the rows below, so it never overshoots); its content fades over `--ds-dur-fast`, and the chevron turns
  on the spring. There is one hairline, below the detail, which travels down as it opens. The page toggles
  `aria-expanded`, sets `inert` on the collapsed detail row (which also hides it from assistive technology) and
  keys both rows with `data-ds-key`, so `flip()` and `morphHtml` keep them together. The child takes the cells'
  horizontal padding and its own vertical room; put the content straight into it. Name the toggle column's header
  for screen readers, `<th scope="col"><span class="ds-sr">Details</span></th>` (an empty header cell is an
  accessibility error).
- The row decides its layers and its cells paint them (2.0): each body row sets `--ds-table-row-layer` (the state
  layer), `--ds-table-row-pace` (how fast it changes), `--ds-table-row-tint` (the selection a pinned cell lays over
  its base), `--ds-table-row-line` (the style of its hairline) and `--ds-table-row-ring` (the row link's ring on a pinned
  last cell). They are internal: a page never sets them; to
  change the look, set `--ds-table-row-hover` and `--ds-table-row-selected`. A cell rule behind a row's `:has()`
  would make Chromium restyle every table cell of the page on each change anywhere in it.

### Stacked rows

```html
<div class="ds-table-wrap">
  <table class="ds-table ds-table--stack">                <!-- ds-table--stack-wide: five or more field columns -->
    <thead><tr><th scope="col">Name</th><th scope="col">URL</th><th scope="col"><span class="ds-sr">Remove</span></th></tr></thead>
    <tbody>
      <tr data-ds-key="s1">
        <td data-label="Name"><input class="ds-input" aria-label="Name" value="Status page"></td>
        <td data-label="URL"><input class="ds-input" aria-label="URL" value="https://status.example.org"></td>
        <td class="ds-table__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove source 1">[icon close 20]</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

- A table of fields (one row per entry) stacks where a row of fields has no room: always inside `.ds-sheet__body` and
  `.ds-dialog`, and in a view when the content area is at most 600px wide (`--stack`) or 840px (`--stack-wide`).
  Stacked, each row is a block with a hairline border and the card radius, `--ds-space-3` apart; each cell shows its
  `data-label` above its content in the field label's type (labels above fields), and a `.ds-table__actions` cell
  sits at the block's top end. The header stays for screen readers only, and the labels are not read a second time
  (alt text for generated content). The table keeps its table roles in every engine.
- In a card the blocks keep the card's padding. No row hover and no edge fade; rows keep `data-ds-key`, so `flip()`
  and `morphHtml` work as in any table.
- Not combinable: `.ds-table--interactive`, expandable rows and sort buttons (the header is hidden: offer sorting
  elsewhere). A `.ds-table-wrap--fill`, `.ds-table--pin-first` or `.ds-table--pin-last` steps aside while the rows stack.

### Full-page tables and pinned columns

```html
<div class="ds-view ds-view--fill">                      <!-- the view stops scrolling, its last child fills -->
  ...
  <div class="ds-table-wrap ds-table-wrap--fill">
    <table class="ds-table ds-table--interactive ds-table--pin-first">
      <thead><tr><th scope="col">Device</th><th scope="col">Model</th> ... </tr></thead>
      <tbody><tr data-ds-key="p2"><td><a class="ds-link-btn ds-table__row-link" href="/devices/p2">Printer on floor 2</a></td> ... </tr></tbody>
    </table>
  </div>
</div>
```

- **`.ds-table-wrap--fill`**: the wrapper is its own card (hairline border `--ds-line`, `--ds-radius-card`, the
  opaque `--ds-table-sticky-bg`, default `--ds-surface`), takes what is left of a bounded parent (`flex: 1 1 auto`;
  `.ds-view--fill`, or any flex column with a height) and scrolls both ways, so its header row sticks to its top
  (`--ds-z-sticky`). It is at least `--ds-table-fill-min-height` (240px) tall, at most `--ds-table-fill-max-height`
  (none). Use it outside a card. Cells stay on one line and end in an ellipsis at `--ds-table-cell-max-width`
  (280px); a tooltip (`data-tip` with the full text) shows a cut cell. Keyboard focus never lands under the header
  (`scroll-padding` on the wrapper, and a `scroll-margin` on what takes focus for the options on the table). It fills
  the view, so it keeps the wheel (`overscroll-behavior: contain`). The ends fade as in a card ([Horizontal scroller](#horizontal-scroller)), while the border and
  the scrollbars stay opaque.
- **`.ds-table--pin-first`** (in a fill wrapper or a card): the first column stays while the others scroll under it,
  above their controls (`--ds-z-pinned`; the corner over a sticky header `--ds-z-sticky-pinned`). Its cells are
  opaque (`--ds-table-sticky-bg`, or the selection colour of a selected row) and the row's hover, focus and press lie
  over them as two registered colours (`--ds-table-sticky-layer`, `--ds-table-sticky-tint`, internal), so they fade
  like the other cells. A hairline at the column's end shows once the table has scrolled (scroll-driven, else
  `data-ds-overflow-start` from `DS.dom.scrollEdges()`); the wrapper then drops its start fade, which would wash out
  the pinned text (`--ds-table-start-fade`, internal: `0` on a wrapper that holds a pinned table), and keeps the end
  fade.
- In an interactive table the pinned cell holds the row link's stretched area, so `DS.ripple.attach()` forwards a
  click anywhere on the row (outside its controls, with no text selected) to the `.ds-table__row-link`: a plain click
  clicks it, Ctrl, Meta, Shift or the middle button open an `a[href]` in a new tab, and a page that called
  `preventDefault()` on the click keeps it. Without `attach()` only the link's own cell opens the row. The row ripples
  in two parts from one centre. The keyboard ring of the row link wraps the pinned cell only, while the focus layer
  covers the whole row. `DS.dom.scrollEdges()` writes `--ds-table-pin-width` (the pinned column's width) and every
  table wrapper (a fill wrapper or a card's) keeps that much `scroll-padding` at its start, so focus moved by the
  keyboard never lands under the pinned column.
- Forced colours: sticky and pinned cells are `Canvas`, the wrapper border `CanvasText`. Print: unbounded, not
  sticky, every cell wraps; closed detail rows are left out (an open one prints in full).

### Row actions, summary rows and density

```html
<tr data-ds-key="d4">
  ...
  <td class="ds-table__actions">
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Edit LAPTOP-0051" data-tip="Edit">[icon pencil 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Actions for LAPTOP-0051" aria-haspopup="menu" aria-expanded="false">[icon moreVertical 20]</button>
  </td>
</tr>
...
<tfoot><tr><th scope="row">Total</th><td class="ds-num">128</td><td></td></tr></tfoot>
```

- `td.ds-table__actions` holds a row's own buttons at its end: end-aligned, no wider than its buttons, which hang
  into the cell's padding, so the row keeps its height and the last icon lines up with the column's edge. Inside an
  element with `.ds-hover-actions` the buttons show on demand (row hover, focus, selection, an open menu; always on
  touch screens): `<td class="ds-table__actions"><span class="ds-hover-actions">...buttons...</span></td>` (the span,
  not the cell, so the row's hairline and layers stay).
- `<tfoot>` rows sum up the table: the label type in `--ds-text`, tabular figures, a hairline (`--ds-line-2`) above,
  no hover, press or row link. `.ds-table--sticky-foot` keeps them in view.
- `--ds-table-head-height` (48px) and `--ds-table-row-height` (52px) are the base heights, at size md and comfortable
  density; size, density and touch apply to them (the options table above), and the cells' block padding follows.

### Bulk selection bar

```html
<div class="ds-toolbar">
  <div class="ds-swap" id="bulk-slot">                   <!-- one slot: the action bar or the selection bar -->
    <div class="ds-selection-bar" role="toolbar" aria-label="Selected devices">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-tip="Clear selection">[icon close 20]</button>
      <p class="ds-selection-bar__count" aria-live="polite">3 selected</p>
      <div class="ds-selection-bar__actions">
        <button class="ds-btn ds-btn--text" type="button">[icon trash 18] Delete</button>
      </div>
    </div>
  </div>
</div>
```

- While rows are selected, the selection bar stands where the toolbar (or action bar) stood: both share one slot,
  and `DS.motion.crossfade(slot, bar)` swaps them when the count goes from 0 to 1 and back
  (`crossfade(slot, toolbar)`), so the table never moves. The count changes at once, never with a crossfade, and
  says the state (the `--ds-accent` tint with `--ds-on-accent` ink does not). The slot sits in a grid (a
  `.ds-toolbar`), where it takes the full width and keeps the bar's height, also while a shorter toolbar stands in it.
- "Clear selection" unchecks every row and moves focus to the header checkbox (the bar goes). In forced colours the
  bar keeps an outline; in print it is hidden.

### Options

| Option | Classes | Where | What it does |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the table or any ancestor | 8px of head and row height per step. Not the type: cells stay `--ds-font-dense`, the head `--ds-font-label` |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | the table or any ancestor | 4px of head and row height per step (rows 52, 48, 44, 40px; head 48, 44, 40, 36px) and 2px of the cells' side padding per step |
| Touch | `.ds-touch` | the table or any ancestor | head and rows at least `--ds-touch-target` high; the sort button's target as high, hanging into its cell. Touch wins over size and density |
| Shape | `.ds-shape-*` | the table or any ancestor | multiplies the radius of the sort button, the full-page wrapper, a stacked block and the selection bar |
| Zebra | `.ds-table--zebra` | the table | every other body row in `--ds-table-zebra`; a detail row goes with its trigger; selection and the state layers lie over it |
| Borders | `.ds-table--bordered`, `.ds-table--plain` | the table | a hairline between the columns as well (and around the table outside a card or a full-page wrapper); no hairlines between the rows |
| Sticky rows | `.ds-table--sticky-head`, `.ds-table--sticky-foot` | the table, with `--ds-table-max-height` on the wrapper | the header row, the summary row stays while the rows scroll under it |
| Pinned columns | `.ds-table--pin-first`, `.ds-table--pin-last` | the table | the first, the last column stays while the others scroll under it |
| Stacked | `.ds-table--stack`, `.ds-table--stack-wide` | the table | a block per row where a row of fields has no room |

Zebra, borders, sticky rows and pinned columns combine. There is no tone: a table shows no meaning of its own, a
`.ds-status` in a cell does. `.ds-table--dense` is **deprecated** (removed when 3.0 ships), with its hook
`--ds-table-dense-row-height`: the 2.x 40px head and rows at a fixed height, which size and density do not change. Use
`.ds-density-tight` on the table or a container: 40px rows and a 36px head.

### Sticky rows

```html
<div class="ds-table-wrap" style="--ds-table-max-height: 320px" tabindex="0" role="region" aria-label="Devices">
  <table class="ds-table ds-table--sticky-head ds-table--sticky-foot">
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot><tr><th scope="row">Total</th><td class="ds-num">128</td></tr></tfoot>
  </table>
</div>
```

The wrapper is a tab stop, so the keyboard reaches the rows that scroll; drop `tabindex`, `role` and `aria-label` when the
cells hold focusable controls. A sticky row sticks to its scroller, and the wrapper is one: set `--ds-table-max-height` on it (or in the theme), or the
rows have nowhere to scroll and nothing sticks. `.ds-table-wrap--fill` needs neither the class nor the hook for its
header. Sticky cells are opaque (`--ds-table-sticky-bg`); keyboard focus never lands under them, wherever the size,
density or touch sits (`scroll-padding` on the wrapper, and a `scroll-margin` on what takes focus for the options on
the table); where a sticky row meets a pinned column the corner stays on top (`--ds-z-sticky-pinned`).

The wrapper sits mid-page, so a page around it stays usable: a wheel at its end, or over a wrapper with nothing to
scroll, moves the page, and it is a stacking context (`isolation: isolate`), so its sticky cells never paint over a
page's own sticky bar.

### Pinned last column

`.ds-table--pin-last` works like `.ds-table--pin-first` at the end edge, for a row's actions or a total: the cell is
opaque with the row's layers over it, a hairline at its start shows while columns follow under it (scroll-driven, else
`data-ds-overflow-end` from `DS.dom.scrollEdges()`), and the wrapper drops its end fade (`--ds-table-end-fade`,
internal). Its cell stands above the row link, so its own room opens nothing, with no pointer, no press and no ripple:
put the row's controls there. A press on the rest of the row ripples through the cell as well, and a focused row link
that is not in a pinned first cell finishes its ring on it. `DS.dom.scrollEdges()` measures the column and keeps its width
in `--ds-table-pin-last-width` on the wrapper (written by the system, never set it), its end `scroll-padding`: a control that Tab
reaches under it scrolls clear of it. One that still shows in part stays where it is, as browsers scroll focus only out of
hiding.

### Accessibility

- **Names and roles.** A `<caption>` (`.ds-sr` when the title is elsewhere) names the table, `scope` names the header
  cells, and an empty header cell gets a `.ds-sr` name. Stacked rows keep their table roles in every engine.
- **Keyboard.** Tab reaches every control in order: sort buttons, checkboxes, toggles, row links, row actions; Enter or
  Space activates them. A wrapper whose cells hold nothing focusable takes `tabindex="0" role="region" aria-label`, and
  the arrow keys scroll it. A control hidden under a sticky row or a pinned column scrolls clear of it on focus (`DS.dom.scrollEdges()`
  measures the columns). A wrapper with sticky rows or a pinned column draws its ring outside
  its box, since those cells would paint over a ring inside it.
- **Status** is never colour alone: selected rows keep their checkbox, sorted columns their arrow and `aria-sort`.

### Forced colours

Sticky and pinned cells are `Canvas`, so nothing shows through them, and the pinned columns' hairlines and the full-page
wrapper's border are `CanvasText`. Zebra and selection tints go (the rows keep their hairlines, also in `.ds-table--plain`,
and a selected row its checkbox), and the selection bar keeps an outline.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-table-head-height` | 48px | the head's base height, which size and density step from |
| `--ds-table-row-height` | 52px | the rows' base height, which size and density step from |
| `--ds-table-dense-row-height` | 40px | `.ds-table--dense` (deprecated) |
| `--ds-table-padding` | `--ds-space-4` | the cells' side padding, which density steps from; on phones (600px) three quarters of it, below 360px half |
| `--ds-table-row-hover` | `currentColor` at `--ds-state-hover-lg` | the row's hover layer |
| `--ds-table-row-selected` | `--ds-accent` | a selected row |
| `--ds-table-zebra` | `--ds-surface-low` | the even rows of `.ds-table--zebra` |
| `--ds-table-sticky-bg` | `--ds-surface` | the base of sticky and pinned cells, the full-page wrapper |
| `--ds-table-max-height` | none | the wrapper of a table with sticky rows |
| `--ds-table-cell-max-width` | 280px | a cut cell in `.ds-table-wrap--fill` |
| `--ds-table-fill-min-height`, `--ds-table-fill-max-height` | 240px, none | the height of `.ds-table-wrap--fill` |
| `--ds-selection-bar-height` | 48px | the least height of `.ds-selection-bar`, which size and density step from |

**Motion:** the "Table" row of [Feedback](motion.md#feedback) and [Data motion](motion.md#data-motion) in motion.md.
## Pagination

Moves through the pages of a long table or list: the footer of a table whose records come in pages.

```html
<section class="ds-card">
  <div class="ds-table-wrap"><table class="ds-table">...</table></div>
  <nav class="ds-pagination" aria-label="Pages of devices">
    <div class="ds-pagination__size">
      <label class="ds-pagination__label" for="pp">Rows per page</label>
      <select class="ds-input ds-input--filled" id="pp"><option>25</option><option selected>50</option><option>100</option></select>
    </div>
    <p class="ds-pagination__range" aria-live="polite">1–50 of 1,234</p>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="First page" aria-disabled="true" data-tip="First page">[icon chevronFirst 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" aria-disabled="true" data-tip="Previous page">[icon chevronLeft 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page">[icon chevronRight 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Last page" data-tip="Last page">[icon chevronLast 20]</button>
  </nav>
</section>
```

Simple: previous and next, the page beside them.

```html
<nav class="ds-pagination ds-pagination--simple" aria-label="Pages of tickets">
  <p class="ds-pagination__range" aria-live="polite">Page 3 of 12</p>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" data-tip="Previous page">[icon chevronLeft 20]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page">[icon chevronRight 20]</button>
</nav>
```

Numbered: the range at the start, the pages at the end, with a field to jump to a page.

```html
<nav class="ds-pagination ds-pagination--numbered" aria-label="Pages of devices">
  <p class="ds-pagination__range" aria-live="polite">301–350 of 1,234</p>
  <div class="ds-pagination__jump">
    <label class="ds-pagination__label" for="jump">Go to page</label>
    <input class="ds-input" id="jump" type="number" inputmode="numeric" min="1" max="25" value="7">
  </div>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page">[icon chevronLeft 20]</button>
  <ol class="ds-pagination__pages">
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 1">1</button></li>
    <li class="ds-pagination__gap" aria-hidden="true">…</li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 6">6</button></li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 7" aria-current="page">7</button></li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 8">8</button></li>
    <li class="ds-pagination__gap" aria-hidden="true">…</li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 25">25</button></li>
  </ol>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page">[icon chevronRight 20]</button>
</nav>
```

Cursor: keyset paging, where the total is unknown. No numbers; the labels say which way.

```html
<nav class="ds-pagination ds-pagination--cursor" aria-label="Pages of the audit log">
  <button class="ds-btn ds-btn--quiet" type="button" aria-disabled="true">[icon chevronLeft 16] Newer</button>
  <button class="ds-btn ds-btn--quiet" type="button">Older [icon chevronRight 16]</button>
</nav>
```

### Options

| Option | Classes | Where | What it does |
|---|---|---|---|
| Variant | none, `.ds-pagination--simple`, `.ds-pagination--numbered`, `.ds-pagination--cursor` | the bar | how its parts are placed; the parts combine, so leave out what a variant has no use for |
| Rows per page | `.ds-pagination__size` | a part | a select and its `.ds-pagination__label` |
| Jump to page | `.ds-pagination__jump` | a part | a number field and its label, `--ds-pagination-jump-width` wide |
| Range | `.ds-pagination__range` | a part | "1–50 of 1,234" or "Page 3 of 12": `--ds-font-meta`, tabular figures |
| Pages | `.ds-pagination__pages`, `.ds-pagination__page`, `.ds-pagination__gap` | parts | the numbered pages, `aria-current="page"` on the current one, a gap for those left out |
| Size, density, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-density-*`, `.ds-shape-*`, `.ds-touch` | the bar or any ancestor | reach its `.ds-btn` and `.ds-input` controls, which compute them; a page button is at least as wide as high and the gap lines up. Density also takes 2px per step of the bar's padding under a table. The range and labels keep their type |

There is no tone: a page shows no meaning of its own.

### Behaviour the page adds

- The page holds the page number and renders the bar: `aria-current` on the current page, the range text, which pages
  show. A controller is planned as `DS.pagination`; until then this is the page's own script.
- A button that leads nowhere (first and previous on the first page) takes `aria-disabled="true"`, not `disabled`:
  a focused "Next" that turns blocked on the last page keeps the focus, the click is blocked, and its tooltip still
  names it.
- A page change dims the rows (`.ds-stale` and the loading bar) while the page loads, then renders them with
  `DS.motion.flip(tbody, (o) => DS.dom.morphHtml(tbody, rows, o), { items: 'tr' })`: every key is new, so the old rows go
  at once and the new ones fade in; the range text changes at once.
- After the `.ds-table-wrap` of a card it sits right under the table with a hairline and runs to the card's edges. When
  the content area is at most 600px wide the size and jump fields drop and the range leads. A numbered bar then gives
  the range its own line and shows only the current page between previous and next, so the three stay together (the
  other page buttons are out of the tab order until the area widens). Hidden in print.

### Accessibility

- **Names and roles.** A `<nav>` with its own `aria-label` ("Pages of devices"). Every icon button has an `aria-label`,
  every page button says "Page 7", `aria-current="page"` marks the current one, and a gap is `aria-hidden`. The range is
  `aria-live="polite"`, so a page change is announced.
- **Keyboard.** Tab goes through the fields and buttons in order; Enter or Space presses a button, also a link
  (`<a class="ds-btn ds-pagination__page" href="?page=7">`). A blocked button stays focusable and does nothing.

### Forced colours

The current page is a choice in a set: `SelectedItem` and `SelectedItemText`, with a `CanvasText` ring when focused.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-pagination-current-bg` | `--ds-accent` | the fill of the current page |
| `--ds-pagination-current-color` | `--ds-on-accent` | its figure |
| `--ds-pagination-jump-width` | 72px | the jump field |

**Motion:** a page change in [Data motion](motion.md#data-motion) in motion.md.
## Horizontal scroller

Content wider or taller than its room scrolls on its own, with a fade at each end that still has content to show.

```html
<div class="ds-scroll-x" tabindex="0" role="region" aria-label="Months">   <!-- the tab stop: only when nothing inside takes focus -->
  <div class="my-months">...</div>                                         <!-- content wider than the panel -->
</div>

<div class="ds-scroll-x ds-scroll-x--reel" role="region" aria-label="Devices">   <!-- a horizontal reel -->
  <a class="ds-card ds-card--interactive" href="/devices/42">...</a>
  <a class="ds-card ds-card--interactive" href="/devices/17">...</a>
</div>

<div class="ds-scroll-y" tabindex="0" role="region" aria-label="Log">      <!-- the block axis -->
  ...                                                                      <!-- taller than --ds-scroll-max-height -->
</div>
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Axis | `.ds-scroll-x`, `.ds-scroll-y` | the scroller | sideways or down, each with its fades |
| Reel | `.ds-scroll-x--reel` | `.ds-scroll-x` | the children in a row, each `--ds-scroll-reel-item` wide, resting on the start of one |
| Density | `.ds-density-*` | the reel or an ancestor | 2px per step off the reel's gap |
| Size, shape, tone, touch | not read | | a scroll area has no height, radius or meaning of its own; they reach what it holds |

- A strip wider than its panel (months, a row of cards, a wide chart) scrolls sideways on its own, with a thin
  scrollbar and room for the focus rings of its content. A fade at each end says that more follows: where scroll
  timelines exist (progressive) `ds-scroll-edge-start` and `ds-scroll-edge-end` run on its own scroll and drive the
  registered numbers `--ds-scroll-edge-start` and `--ds-scroll-edge-end` (0 to 1, times the fade length): the start
  fade grows while the first `--ds-space-8` scroll away, the end fade goes over the last, and a strip that fits fades
  nowhere. Elsewhere call `DS.dom.scrollEdges(strip)`: its `data-ds-overflow-start` and `data-ds-overflow-end` set
  the numbers over `--ds-dur-fast`; without it the strip shows no fade. The scrollbar strip stays unmasked
  (`--ds-scrollbar-height`, written by `scrollEdges()`). Left-to-right pages only.
- One fade switch: `--ds-scroll-fade` is the fade length of `.ds-scroll-x` (default `--ds-space-8`), the card table
  wrappers (default `--ds-card-pad`) and the cut edges of menus, combobox lists and drawer lists;
  `--ds-scroll-fade: 0px` on the theme turns them all off.
  Keyboard focus inside lands outside the fades (`scroll-padding`).
- `.ds-scroll-x--reel`: the direct children stand in a row, `--ds-scroll-reel-item` wide (default `min(80%, 280px)`, so
  the next one peeks in), `--ds-scroll-reel-gap` apart (`--ds-space-4`), and the scroll rests on the start of one
  (`scroll-snap-type: x proximity`, which never fights a scroll that stops between two). On paper the row wraps.
- `.ds-scroll-y`: the same on the block axis, from `--ds-scroll-max-height` (default none: a page may set the height
  itself). Its timeline is `scroll(self block)`; the fallback is `DS.dom.scrollEdges(area, { axis: 'block' })`, which
  writes `--ds-scrollbar-width` for the mask. `scrollbar-gutter: stable` (progressive) keeps the scrollbar's room, so
  content never reflows when it comes.
- Keyboard and names: when nothing inside can take focus, the scroller is the tab stop (`tabindex="0" role="region"
  aria-label`), as WebKit gives a scroller none by itself: arrow keys scroll it, its ring is inset and the fades drop
  while it is focused. When its content holds links or buttons, leave those attributes out: Tab scrolls each into view,
  clear of the fades.
- Forced colours: the mask is alpha and stays; the ring takes the system colour.
- Print: the strip shows all of its content, unmasked.
- Hooks: `--ds-scroll-fade`, `--ds-scroll-reel-item`, `--ds-scroll-reel-gap`, `--ds-scroll-max-height`
  ([theming.md](theming.md#component-hooks)).

```html
<div class="my-log">                                                       <!-- a scroller -->
  ... messages ...
  <div class="ds-jump"><div class="ds-presence" hidden>
    <button class="ds-btn ds-btn--tonal ds-btn--icon" type="button" aria-label="Latest" data-tip="Latest">[icon arrowDown 20]</button>
  </div></div>
</div>
```

- `.ds-jump`, the last child of a scrolling log, is the place of a "Latest" pill: sticky `--ds-space-4` above the
  log's bottom edge, centred, taking no room, so the log never moves when the pill comes. `DS.dom.followEnd(log,
  { pill })` keeps the log at its end while it grows and shows the pill (a `.ds-presence`) while the reader has
  scrolled up; a click on it scrolls to the end. Only the pill takes the pointer. Hidden in print.

**Motion:** the scroll-linked keyframes in [Keyframes](motion.md#keyframes) and
[Scroll-driven effects](motion.md#scroll-driven-effects) in motion.md.
## Form

Everything that collects input: labelled fields in three looks, slots inside a field, states in words, checkboxes,
radios and their cards, fieldsets and form sections, filters and an action bar. Labels stay above their fields.

```html
<form class="ds-form">
  <div class="ds-form-grid">                <!-- 3 columns, the first wider; ds-form-grid--2: two; ds-form-grid--3: three equal -->
    <div class="ds-field">
      <label class="ds-field__label" for="name">Name</label>
      <input class="ds-input" id="name" name="name" aria-describedby="name-hint">
      <small class="ds-field__hint" id="name-hint">As printed on the label.</small>
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="type">Type</label>
      <select class="ds-input" id="type"><option>Laptop</option><option>Desktop</option></select>
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="bought">Bought</label>
      <input class="ds-input" id="bought" type="date">
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="serial">Serial</label>
      <input class="ds-input" id="serial" aria-invalid="true" aria-describedby="serial-error">
      <small class="ds-field__hint ds-field__hint--error" id="serial-error">[icon alertCircle 16]Already in use.</small>
    </div>
    <div class="ds-field ds-field--full">
      <label class="ds-field__label" for="notes">Notes</label>
      <textarea class="ds-input" id="notes"></textarea>
    </div>
  </div>

  <label class="ds-check"><input type="checkbox" name="managed" checked><span>Managed</span></label>
  <small class="ds-field__hint">Updates install automatically.</small>
  <label class="ds-check ds-sm"><input type="checkbox" name="clear"><span>Delete the saved key</span></label>

  <input class="ds-checkbox" type="checkbox" aria-label="Select all">       <!-- a checkbox anywhere -->
  <input class="ds-radio-input" type="radio" name="size" aria-label="Small"> <!-- a radio anywhere -->

  <div class="ds-radios" role="radiogroup" aria-label="Plan">
    <label class="ds-radio"><input type="radio" name="plan" value="basic" checked>
      <span><strong>Basic</strong><small>Inventory only.</small></span></label>
    <label class="ds-radio ds-radio--disabled"><input type="radio" name="plan" value="pro" disabled>
      <span><strong>Pro</strong><small class="ds-radio__note">[icon alert 16]Needs a licence.</small></span></label>
  </div>

  <button class="ds-btn ds-btn--text ds-add-row" type="button">[icon plus 16] Add a row</button>

  <div class="ds-form-actions">
    <button class="ds-btn ds-btn--filled" type="submit">Save</button>
    <button class="ds-btn ds-btn--text" type="button">Cancel</button>
    <p class="ds-meta">Last saved today, 09:12</p>
  </div>
</form>
```

**Options** ([options.md](options.md)): classes on the control or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-field--outlined` (default), `.ds-field--filled`, `.ds-field--inset`; on one control `.ds-input--outlined`, `.ds-input--filled`, `.ds-input-group--filled` | the field, or one control | the look: an outline, the tonal fill, the tonal box with the label inside |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | a control, a field, a form | fields 24, 32, 40, 48, 56px high (8px per step), side padding 4px per step, the size's type role at the regular weight (16px on phones at every size); a `.ds-check` row and the halo 8px per step, the box 2px per step; labels and hints keep their roles |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (fields, groups, the inset box, `.ds-check` rows, halos); 2px less padding per step on cards; side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius of fields, the search pill, the composer, checkboxes, the check list and the cards times 0, .5, 1, 1.5; a card's press morph too. A radio stays round |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) whatever the size and density, a minimum and no addition (`.ds-lg` stays 48px, `.ds-xl` 56px): fields, `.ds-check` rows, cards, halos; field text at `--ds-font-input`. A halo is painted: a bare `.ds-checkbox` or `.ds-radio-input` still takes a tap only on its box, so under touch give it a `.ds-check` label or an equally large label around it |
| State | `aria-invalid="true"`, `.ds-field--warning`, `.ds-field--success`, `readonly`, `aria-readonly="true"`, `disabled` | the control, the field | the border and ring, always with a hint in words; there is no tone class on a field |

- 40px fields, label above (never only a placeholder), focus as an instant 2px ring inside the field. On blur the
  border, the inner ring and the text colour fade back together, so the ring never fades as half a ring.
- Field text stays `--ds-font-input` (16px) at 600px and below at every size: iOS zooms into smaller text; the padding
  stays around that taller line, so an md field is 42px there. A `--ds-input-font` of a theme wins, so keep it at 16px
  on phones.
- The label of a field (`.ds-field__label` before the field, or the `<legend>` of a fieldset) takes the ring's colour
  with the ring (primary, or the state's on a warning or success field), at once, and fades back on blur; the label of
  an invalid field keeps the error ink, also
  while focused (the control directly in `.ds-field` or in its `.ds-input-group`, `.ds-field__row` or `.ds-combo`).
  A focused invalid input group rings in the error colour alone, like a focused invalid field.
- Error: `aria-invalid="true"` plus a `.ds-field__hint--error` with an icon, linked by `aria-describedby`. The
  message fades in when it appears (inserted, or filled from empty), not when its text changes; where the browser
  can animate height to `auto` and focus is in its form (`<form>`, `.ds-form`) or `.ds-field` (validation on blur
  or on submit), its room also opens from 0 (on `--ds-ease-out`, so the form below never overshoots). A message
  already in the markup only fades in, so nothing shifts on load. Removing it is instant.
- Disabled and read-only (`readonly`, or `aria-readonly="true"` on a select, whose value the page then keeps) fields
  take the quiet surface; a read-only field stays focusable, shows the ring or the focus line of its look while
  focused, and its text can be copied. A `<datalist>` field shows the select triangle.
- Form grids drop to one column when the page is 760px or narrower, and in sheets and dialogs when the window is.
- A form in a card: `<form class="ds-card ds-form">` (16px rhythm).
- A `<textarea class="ds-input">` starts about three lines tall and grows only vertically, by hand.
- A group of checkboxes is a `<fieldset class="ds-field">` with `<legend class="ds-field__label">` as its label;
  both lose the browser's frame and indent.
- Checkboxes and radios are drawn on the native input (`appearance: none`, no wrapper): inputs in `.ds-check`, every
  checkbox in a `.ds-table` (not the hidden input of a switch or chip in a cell), the radio of a `.ds-radio` card, and `.ds-checkbox` / `.ds-radio-input` anywhere else.
  The check wipes in from its short arm, the indeterminate dash (`el.indeterminate = true`) grows from the centre
  while the check collapses into it, the radio dot grows on the spring; nothing animates on load. A 40px halo
  (`--ds-check-target`) shows hover (also on the whole `.ds-check` row), press and keyboard focus with the ring; on
  touch screens a tap grows it from the centre (inputs get no ripple). `aria-invalid="true"` draws the box in the
  error colour; disabled boxes take `--ds-disabled-ink`. Forced colours: system colours, no halo.
- `aria-disabled="true"` on a checkbox or radio (also in a `.ds-check` row or a radio card) looks and acts blocked
  like `disabled`: the disabled ink, no hover or press halo, the row's quieter ink, `GrayText` in forced colours. It
  stays in the tab order and keeps its focus halo, so a tooltip with the reason can still be reached; the action
  guard of `DS.motion` ([motion.md](motion.md)) blocks its click, also a click on its label, so the page needs no
  guard of its own.
- A `.ds-check` row is `--ds-check-height` tall (40px, with the size and density steps) around one line of its
  label. A long label wraps (even a bare text node, `overflow-wrap: anywhere`) and the box stays beside its first line.
- `.ds-check--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-sm`. Until then it keeps the fixed 2.x row
  (`--ds-check-sm-height`, 32px, **deprecated** with it) and the quieter ink; density does not change it.
- Radio cards (`.ds-radio`) have a state layer and the ripple, and turn squarer while pressed
  (`--ds-radius-card-pressed` times `--ds-shape`), springing back on release; keyboard focus rings the whole card and lays the focus
  layer (`--ds-state-focus`) at once (its input has no halo); `.ds-radio--disabled` and a card whose input is
  disabled or `aria-disabled` have none, keep their border on hover and take the quiet look (`--ds-line` border,
  `--ds-surface-low`, the title in `--ds-text-2`; a checked one keeps its selected look).
- Date and time fields (`date`, `datetime-local`, `month`, `week`, `time`) draw their picker button as the icon
  set's `calendar` (`time`: `clock`) in the quieter text colour; side by side in `.ds-filters`, `.ds-inline-form`
  and the two- and three-column grids they take less padding at 720px and below, so the value is not cut off.
- Field hooks: `--ds-input-height`, `--ds-input-padding-x`, `--ds-input-bg`, `--ds-input-border`,
  `--ds-input-radius`, `--ds-input-weight` and `--ds-input-focus-color` (the ring and the label tint),
  [theming.md](theming.md#component-hooks). Checkboxes and radios: `--ds-check-size` (18px at md). Cards:
  `--ds-radio-padding`.
- Keyboard and names: native controls, so Tab reaches every field, checkbox and radio, Space toggles, the arrows move
  within a radio group and step a number. Every field has a `<label>` (`.ds-sr` when the design shows none) and its
  hint by `aria-describedby`; a group of radios a `role="radiogroup"` with a name.
- Forced colours: a focused field (also an input group, a filled field and the composer) shows a `Highlight`
  outline, since its inset ring is a shadow that forced colours drop; a selected card's edge and checked input are
  `Highlight`; blocked is `GrayText` (a disabled field or group, a disabled fieldset's legend, a blocked card's title
  and edge when checked); a warning or success field keeps the system's edge and its word says which.

**Hints that confirm, hints with an icon, markers and a counter**

```html
<div class="ds-field">
  <label class="ds-field__label" for="user">Username <span class="ds-field__required" aria-hidden="true">*</span></label>
  <input class="ds-input" id="user" required aria-describedby="user-hint">
  <small class="ds-field__hint ds-field__hint--success" id="user-hint">[icon checkCircle 16]Available.</small>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="room">Room <span class="ds-field__optional">(optional)</span></label>
  <input class="ds-input" id="room" aria-describedby="room-hint">
  <small class="ds-field__hint" id="room-hint">[icon info 16]As written on the door.</small>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="note">Note</label>
  <textarea class="ds-input" id="note" maxlength="200" aria-describedby="note-hint"></textarea>
  <div class="ds-field__foot">
    <small class="ds-field__hint" id="note-hint">Shown to the next person.</small>
    <span class="ds-field__counter" aria-hidden="true">0 / 200</span>
  </div>
</div>
```

- A hint whose first child is an icon lays it out beside its first line (`--ds-text-2`). `.ds-field__hint--success`
  confirms a live check ("Available"): text `--ds-field-success-color` (default `--ds-text-2`), icon `--ds-success`.
  It enters like an error message (a fade, and its room opens while focus is in the form); a hint that turns from
  error to success keeps its element, so only its text and icon change. The hint is a description
  (`aria-describedby`), read on the next focus; when the result must be spoken at once, announce it too
  (`DS.overlay.announce(text)`). The error text reads `--ds-field-error-color` (default
  `--ds-on-error-container`).
- A warning (`.ds-field--warning` with a `.ds-field__hint--warning`, "Expires in 3 days") and a success
  (`.ds-field--success` with a `.ds-field__hint--success`) colour the control's border, ring and the line of the
  filled field; `aria-invalid="true"` stays the only error. Each needs its hint with an icon and words: the colour
  never stands alone. Hook: `--ds-field-warning-color` (default `--ds-on-warning-container`).
- `.ds-field__optional` marks the few optional fields (the recommended way); where most fields are optional, mark
  the required ones with an `aria-hidden` `.ds-field__required` asterisk and `required` on the input (screen readers
  announce that).
- `.ds-field__foot` puts the hint and a `.ds-field__counter` in one row (the counter at the end, tabular). The counter
  is `aria-hidden` and the page updates it on `input`; near the limit the page announces what is left once. Past the
  limit it takes `.ds-field__counter--over` (the figures say it, the error ink repeats it).

**Search key**

```html
<div class="ds-search">[icon search 20]<input class="ds-input" id="q" type="search" aria-label="Search devices" aria-keyshortcuts="/" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div>
```

The key shows while the search rests empty and goes (in `--ds-dur-instant`) once it has the focus, a value or is
disabled; the field keeps room for it, so the caret is never under it. Touch screens never show it. The input needs
a `placeholder` (the key reads `:placeholder-shown`). The shortcut is the page's:

```js
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault(); // Firefox: no quick find
  search.focus();
});
```

**A field and its button, units and reveals inside a field**

```html
<div class="ds-field">
  <label class="ds-field__label" for="key">API key</label>
  <div class="ds-field__row">
    <input class="ds-input" id="key" value="ex_7f3a9c21" readonly>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy the key" data-tip="Copy the key">[icon copy 20]</button>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="quota">Quota (GB)</label>
  <div class="ds-input-group">
    <input class="ds-input" id="quota" inputmode="numeric" value="50">
    <span class="ds-input-group__suffix" aria-hidden="true">GB</span>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="site">Website</label>
  <div class="ds-input-group">
    <span class="ds-input-group__leading" aria-hidden="true">[icon globe 18]</span>
    <span class="ds-input-group__prefix" aria-hidden="true">https://</span>
    <input class="ds-input" id="site" value="example.org">
    <span class="ds-input-group__trailing"><span class="ds-tag ds-tone-neutral">Suggested</span></span>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="pw">Password</label>
  <div class="ds-input-group">
    <input class="ds-input" id="pw" type="password" autocomplete="current-password">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show password" aria-pressed="false" aria-controls="pw">
      <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon eye 18]</span><span class="ds-icon-swap__b">[icon eyeOff 18]</span></span></button>
  </div>
</div>
```

- `.ds-field__row`: the field takes the room, its buttons keep their size; `.ds-field__row--top` aligns them to the
  start, beside a textarea.
- `.ds-input-group` draws the field (border, radius, background, `--ds-input-height` with its steps) and the
  `.ds-input` inside loses its box. The ring moves to the group while the input has the focus (at once, fading back
  on blur); a focused trailing button shows its own ring instead. `aria-invalid="true"` on the input turns the
  group's border, disabled or `readonly` its surface.
- Its slots: `.ds-input-group__leading` (an `aria-hidden` icon, no pointer), `.ds-input-group__prefix` (text before
  the value, such as `https://`), `.ds-input-group__suffix` (a unit after it), `.ds-input-group__trailing` (an icon, a
  tag such as "Suggested", or a button). A prefix and a suffix are `aria-hidden`, so the unit belongs in the label too.
- A button in the group, direct or in the trailing slot, adds nothing to the field's height as long as it is no taller
  than the field. It keeps its own size: `.ds-sm` fits md and the dense density; at `.ds-xs`, or `.ds-sm` with a dense
  density, put `.ds-xs` on it.
- `.ds-input-group__affix` is **deprecated** (3.0, removed when 3.0 ships): `.ds-input-group__prefix` before the
  input, `.ds-input-group__suffix` after it, the same look.
- The reveal is the page's two lines: toggle the input's `type` between `password` and `text`, and the button's
  `aria-pressed` (the icon swap follows it).

**Filled and inset fields**

```html
<div class="ds-field ds-field--filled">
  <label class="ds-field__label" for="owner">Owner</label>
  <input class="ds-input" id="owner" value="Ada Lovelace">
</div>
<div class="ds-field ds-field--inset">
  <label class="ds-field__label" for="title">Title</label>
  <input class="ds-input" id="title" value="Quarterly report">
  <small class="ds-field__hint">Shown in the list.</small>
</div>
```

`.ds-field--filled` puts the field's control (a `.ds-input` or a `.ds-input-group`) on the tonal fill, without an
outline at rest, the label above it. A single control takes `.ds-input--filled` or `.ds-input-group--filled`, a single
outlined one in a filled field `.ds-input--outlined`.

`.ds-field--inset` is the Material 3 filled field: the label sits inside a tonal box above the value (still a real
`<label>`), a hairline closes the box at the bottom and turns into a 2px line in `--ds-input-focus-color` while the
field has the focus. The box is 56px at md and comfortable, and follows size and density. It holds a `.ds-input` or a
`.ds-input-group` with its slots. Hints and a `.ds-field__foot` follow below the box, in line with the label. In forced colours the fill is gone, so the box keeps a
transparent border (its edge there) and a focused field shows the outline.

**Fieldset and form section**

```html
<fieldset class="ds-fieldset">
  <legend class="ds-fieldset__legend">Address</legend>
  <p class="ds-fieldset__hint">Where the device stands.</p>
  <div class="ds-field"><label class="ds-field__label" for="street">Street</label><input class="ds-input" id="street"></div>
</fieldset>

<section class="ds-form-section ds-form-section--columns" aria-labelledby="alerts-title">
  <div class="ds-form-section__head">
    <h3 class="ds-form-section__title" id="alerts-title">Alerts</h3>
    <p class="ds-form-section__text">Who hears about a device that went offline.</p>
  </div>
  <div class="ds-form-section__body">
    <div class="ds-field"><label class="ds-field__label" for="alert-mail">Email</label><input class="ds-input" id="alert-mail" type="email"></div>
  </div>
</section>
```

- `.ds-fieldset`: fields that belong together under a `.ds-fieldset__legend`, without the browser's frame and indent;
  `.ds-fieldset--outlined` puts them in a frame. A disabled fieldset quiets its legend and disables its controls. A
  fieldset that reads as one field (a set of checkboxes under a field label) stays a `fieldset.ds-field`.
- `.ds-form-section`: a titled part of a long form; a section after a section stands on a hairline. With
  `.ds-form-section--columns` (settings) the head stands beside the body; the labels stay above their fields. It falls
  to one column when the page is 760px or narrower, and in sheets and dialogs when the window is.

**Checkbox cards**

```html
<div class="ds-check-cards" role="group" aria-label="Add-ons">
  <label class="ds-check-card"><input class="ds-checkbox" type="checkbox" name="addon" value="backup" checked>
    <span><strong>Backups</strong><small>Every night, kept for 30 days.</small></span></label>
  <label class="ds-check-card"><input class="ds-checkbox" type="checkbox" name="addon" value="audit" disabled>
    <span><strong>Audit log</strong><small class="ds-radio__note">[icon alert 16]Needs a licence.</small></span></label>
</div>
```

The checkbox sibling of the radio card: several may be on. Its `.ds-checkbox` keeps the wipe, the indeterminate dash
and the error ink, without a halo: the card's own layer is its hover, press and focus layer, and it has the ripple
and the press morph of a radio card (`--ds-radius-card-pressed` times `--ds-shape`). A checked card takes the 2px
primary outline, never the tint alone. Keyboard focus rings the whole card.

**Many values from a long set, a parent and its children**

```html
<fieldset class="ds-field"><legend class="ds-field__label">Status</legend>
  <div class="ds-check-list">
    <label class="ds-check"><input type="checkbox" name="status" value="active" checked><span>Active</span><span class="ds-check__count">47</span></label>
    <label class="ds-check"><input type="checkbox" name="status" value="storage"><span>In storage</span><span class="ds-check__count">12</span></label>
  </div>
</fieldset>

<fieldset class="ds-field"><legend class="ds-field__label">Notify by</legend>
  <div class="ds-check-group">
    <label class="ds-check"><input type="checkbox" data-all><span>All channels</span></label>
    <div class="ds-check-group__children" role="group" aria-label="Channels">
      <label class="ds-check"><input type="checkbox" checked><span>Email</span></label>
      <label class="ds-check"><input type="checkbox"><span>Chat</span></label>
    </div>
  </div>
</fieldset>
```

- `.ds-check-list`: rows on hairlines in an outlined box that scrolls on its own beyond `--ds-check-list-max-height`
  (264px, about six rows, so the cut row shows that it scrolls; `none` shows them all, also in a sheet). The row
  padding keeps every halo and ring inside the box. A checked row's label takes the label weight, so the selection
  shows by more than the check; `.ds-check__count` sits at the row's end. Tab walks the boxes and the list scrolls
  each into view.
- `.ds-check-group`: the children's boxes line up under the parent's label. The page keeps the parent in step:

```js
const all = group.querySelector('[data-all]');
const children = [...group.querySelectorAll('.ds-check-group__children input')];
all.addEventListener('change', () => children.forEach((child) => { child.checked = all.checked; }));
group.addEventListener('change', () => { const on = children.filter((child) => child.checked).length;
  all.checked = on === children.length; all.indeterminate = on > 0 && on < children.length; });
```

**Changed fields, read-only values, editing in rows**

```html
<form class="ds-form ds-form--rows">
  <div class="ds-field ds-field--changed">
    <label class="ds-field__label" for="place">Room <span class="ds-field__changed ds-sr">(changed)</span></label>
    <input class="ds-input" id="place" value="B 2.14">
  </div>
  <div class="ds-field" role="group" aria-labelledby="serial-l">
    <span class="ds-field__label" id="serial-l">Serial number</span>
    <span class="ds-field__value">SN-0042</span>
  </div>
  <div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Save</button></div>
</form>
```

- `.ds-field--changed`: a dot after the label (`--ds-field-changed-color`, default `--ds-primary`; `CanvasText` in
  forced colours) fades in on `--ds-dur-fast` and out on `--ds-dur-instant`; it always takes its room, so the label
  never shifts. The word in `.ds-field__changed.ds-sr` joins the label's name only while the field carries the class,
  so the change never shows by colour alone. Put `.ds-field__changed` in every field that can change and toggle the
  class.
- `.ds-field__value`: a value that is read, not edited (set by another system), as tall as a field's text row, without
  a box that would look like a field. A value that must be focusable or submitted is an
  `<input class="ds-input" readonly>` instead.
- `.ds-form--rows`: the fields sit on hairlines with row padding instead of the form's gap, a grid inside turns into
  one column, and controls stop at `--ds-form-rows-control-max` (480px). Labels stay above their controls (never a
  label column, unlike a read-only `.ds-facts--rows`), so switching from reading to editing changes the layout on
  purpose.

**Radio tiles**

```html
<div class="ds-radios ds-radios--tiles" role="radiogroup" aria-label="Device type">
  <label class="ds-radio"><input type="radio" name="kind" value="laptop" checked><span class="ds-radio__icon" aria-hidden="true">[icon laptop 20]</span>
    <span><strong>Laptop</strong><small>With a dock.</small></span><span class="ds-radio__mark" aria-hidden="true">[icon check 14]</span></label>
  <label class="ds-radio"><input type="radio" name="kind" value="desktop"><span class="ds-radio__icon" aria-hidden="true">[icon monitor 20]</span>
    <span><strong>Desktop</strong><small>At one desk.</small></span><span class="ds-radio__mark" aria-hidden="true">[icon check 14]</span></label>
</div>
```

Two columns of radio cards (one below 480px of the content or the window). The radio itself is hidden: the icon disc
fills (`--ds-primary` / `--ds-on-primary`) and the trailing check circle pops in (from `--ds-scale-small` on the
spring) on the checked tile, which keeps the card's ring; keyboard focus rings the tile. The cards keep their press
morph (`--ds-radius-card-pressed`). For a tint that glides from tile to tile, add the indicator once:

```js
const pill = DS.indicator.create(group, { active: '.ds-radio:has(input:checked)', className: 'ds-radios__indicator' });
group.addEventListener('change', () => pill.update()); // checking a radio changes no attribute
```

**Growing textarea and the composer**

```html
<textarea class="ds-input ds-input--grow" rows="1" aria-label="Note"></textarea>

<form class="ds-composer">
  <textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Write a message"></textarea>
  <button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">[icon send 20]</button>
</form>
```

- `.ds-input--grow` starts one row tall (`--ds-input-height`) and grows with its text up to `--ds-input-grow-max`
  (50vh), then scrolls. Where `field-sizing: content` is missing, call `DS.dom.autosize(textarea)` once; its height
  then follows the text through the CSSOM (never animated).
- `.ds-composer`: a filled shell (`--ds-composer-radius`) with the textarea and its actions, which stay at the
  bottom while the text grows (up to `--ds-composer-max-height`, 220px). The ring follows the field model on the
  shell: at once while the focus is inside, fading back on blur. Forced colours: the shell keeps a transparent border
  (its edge there) and shows the outline while focused.

**Actions that stay on a phone**

```html
<div class="ds-form-actions ds-form-actions--sticky">
  <button class="ds-btn ds-btn--filled" type="submit">Save</button>
  <button class="ds-btn ds-btn--text" type="button">Cancel</button>
</div>
```

At 600px and below the action row of a long form sticks to the bottom of its scroller: a surface bar with a static
hairline that bleeds to the page's padding (`--ds-content-pad-x`) or a card's (`--ds-card-pad`) and keeps clear of
the home indicator (`env(safe-area-inset-bottom)`). In a padded container of the page's own (a project card, a sheet
section) set `--ds-form-actions-bleed` on that container to its inline padding, and the bar meets its edges:

```css
.x-panel { padding: var(--ds-space-5); --ds-form-actions-bleed: var(--ds-space-5); }
```

The hook inherits, so set it on the nearest container the bar runs through (inside a `.ds-card` in such a container,
set it on the card too).

**Toolbar, search, filters, inline form**

```html
<div class="ds-toolbar">
  <div class="ds-filters">
    <div class="ds-field ds-field--grow">
      <label class="ds-sr" for="q">Search</label>
      <div class="ds-search">[icon search 20]<input class="ds-input" id="q" type="search" placeholder="Search devices"></div>
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="f-type">Type</label>
      <select class="ds-input ds-input--filled" id="f-type"><option>All</option></select>
    </div>
  </div>
  <fieldset class="ds-chips"> ... </fieldset>
</div>

<div class="ds-action-bar">                  <!-- search, buttons and a count in one wrapping row -->
  <div class="ds-search">[icon search 20]<input class="ds-input" type="search" aria-label="Search" placeholder="Search"></div>
  <button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false">[icon filter 16] Filter</button>
  <p class="ds-meta">128 devices</p>
</div>

<div class="ds-inline-form">
  <div class="ds-field"><label class="ds-field__label" for="ticket">Ticket</label><input class="ds-input" id="ticket"></div>
  <button class="ds-btn" type="submit">Look up</button>
</div>
```

`.ds-input--filled` is the toolbar variant on the tonal fill; `.ds-search` is a filled pill with a leading icon.
Inside a dialog, a side sheet or a menu, Escape in a filled `type="search"` field clears it first (an `input` event
follows, so the page's filter runs) and the next Escape closes the layer (2.0, `DS.overlay`).

**Motion:** the check, radio, focus, validation, confirmation, changed dot, search key and radio tile rows of
[Controls](motion.md#controls) in motion.md. A checkbox card moves as a radio card; a warning hint enters as an error
hint does.
## Chips

Small pills that filter a list, pick a few options or hold entered values.

```html
<fieldset class="ds-chips">
  <legend class="ds-sr">Status</legend>
  <label class="ds-chip">
    <input class="ds-chip__input" type="checkbox" name="status" value="active" checked>
    <span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Active</span></span>
  </label>
  <label class="ds-chip">
    <input class="ds-chip__input" type="checkbox" name="status" value="stored">
    <span class="ds-chip__body">[icon check 18 ds-chip__check]<span>In storage</span></span>
  </label>
  <span class="ds-chips__divider" aria-hidden="true"></span>
  <label class="ds-chip"><input class="ds-chip__input" type="radio" name="age" value="old"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Older than 4 years</span></span></label>
</fieldset>
```

The native input stays in the form and the tab order; a selected chip shows the tint and the check.

**Options** ([options.md](options.md)): classes on the chip or any ancestor (the tone: on the chip); the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-chip--input`; a `<button>` or a link is an action chip | the chip | below |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | a chip or a row | 16, 24, 32, 40, 48px high (8px per step, never below its own line), side padding 4px per step, check and icon 2px per step, the size's type role |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | 4px less height per step; side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius times 0, .5, 1, 1.5, at most half the height |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high |
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error` | the chip itself | a selected filter chip, an input chip and an action chip take `--ds-tone-container` and its ink; a resting filter chip stays neutral; an inherited tone is ignored. The word carries the meaning, the tone repeats it |

- Selecting opens the room of the check: an empty slot before the label grows to `--ds-chip-check-size` on
  `--ds-ease-out` (a layout size never overshoots) and the chips after it on the line follow; the check draws itself
  from its short arm. Deselecting reverses it (the check leaves first). Radio chips trade the selection at once, so a
  pair keeps its width. A chip rendered selected does not animate.
- When a toggle moves chips to another line, they glide there (FLIP) on pages that call `DS.ripple.attach(root)`;
  without it, or when a script sets `checked`, the chips jump to the new line. A script that toggles a chip and
  wants the glide dispatches the event in the same task: `input.checked = next; input.dispatchEvent(new
  Event('change', { bubbles: true }))`. During the glide the row carries
  `data-ds-glide` and every `.ds-chip` an opaque backing in the colour behind the row (`--ds-chips-backdrop`, written
  by the script; `--ds-surface` without one), so a chip that crosses another never shows it through its body.
- Press: the state layer in `--ds-dur-micro` and the ripple. Chips are not pills, so they do not morph. Keyboard
  focus: the ring, solid from the first frame, snaps to its offset, with the focus layer.
- An `aria-disabled="true"` chip input is blocked by `DS.motion.guard()`: a click on the chip never changes it (no
  page guard needed).
- Disabled chips (`disabled` on the input or its `<fieldset>`) show no hover, press or ripple and the `not-allowed` cursor, and take
  the button's disabled model: the outline (selected: the container) in `--ds-disabled-fill`, label and check in
  `--ds-disabled-ink`, fading on `--ds-dur-fast`. A theme that dims instead (`--ds-disabled-opacity`) keeps the
  chip's own colours. Forced colours: GrayText. `aria-disabled="true"` on the input looks the same and is blocked
  the same (no page guard needed); it keeps its focus layer, so a tooltip can say why.
- Keyboard and names: Tab reaches every chip input, Space toggles it, the arrows move within a radio group of chips;
  name the row with a `<legend>` (`.ds-sr` is enough) or `aria-label`.
- Forced colours: a selected chip `Highlight` / `HighlightText` (focused: a `CanvasText` ring), a blocked one
  `GrayText`, an input chip or a toned action chip a real edge. A tone becomes the system's colours, so the word carries
  the meaning.
- Hooks: `--ds-chip-height` (32px), `--ds-chip-padding-x` (16px), `--ds-chip-radius`, `--ds-chip-font`,
  `--ds-chip-check-size` (18px), `--ds-chip-disabled-border`, `--ds-chip-disabled-bg` (the container of a disabled
  selected chip), `--ds-chip-input-bg`, `--ds-chip-input-color`, `--ds-chip-input-border` (input chips),
  `--ds-chip-max-width` (240px, button chips).

### Action and input chips

Chips that act at once are buttons in a `role="group"` row: an active filter that removes itself (`.ds-chip--input`),
a suggestion (an action chip):

```html
<div class="ds-chips" role="group" aria-label="Active filters">
  <button class="ds-chip ds-chip--input" type="button" data-tip="Building C, second floor">
    <span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>Building C, second floor</span>[icon close 18 ds-chip__trailing]</span></button>
  <button class="ds-chip" type="button"><span class="ds-chip__body">[icon user 18 ds-chip__icon]<span class="ds-chip__label">Only my devices</span></span></button>
  <button class="ds-btn ds-btn--text ds-sm" type="button">Clear filters</button>
</div>

<div class="ds-chips ds-chips--wrap" role="group" aria-label="Suggestions">
  <button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">Show the devices that were not seen this month</span></span></button>
</div>
```

- The button's own look is reset; the body carries every visual. There is no check slot: the padding is 16px, 8px next
  to a leading `.ds-chip__icon` or a trailing `.ds-chip__trailing` (both `--ds-chip-check-size`). The label ends in
  an ellipsis once the body reaches `--ds-chip-max-width` (240px): put the full text in `data-tip`.
- `.ds-chip--input` takes the tint (`--ds-chip-input-bg`, `--ds-chip-input-color`, `--ds-chip-input-border`, from
  `--ds-accent` and `--ds-on-accent`) and the whole chip removes its value; name the action for screen readers
  ("Remove filter"). Forced colours keep a real edge.
- `.ds-chips--wrap` on the row lets long labels wrap inside the chip; a one-line chip keeps its height and the corners
  stay soft (`--ds-radius-chip` times the shape, at most half the height).
- States as for filter chips: hover, the focus ring (on the chip, snapping), the press in `--ds-dur-micro` with the
  ripple, the disabled model; no morph (chips are not pills).
- A chip that stays on or off is a filter chip (a checkbox), never a button chip with `aria-pressed`.
- Removing a chip: `DS.motion.flip(row, () => chip.remove())`; the chips after it glide into its place and focus moves
  to the neighbouring chip of the same kind, the next one, else the one before it (never to "Clear filters" while a
  chip is left; 2.1). When the last chip goes, remove "Clear filters" in the same mutate and pass
  `refocus: () => searchField`. "Clear filters" moves focus to the search field. A row whose chips all went
  (`.ds-chips:empty`) takes no room.

**Motion:** the chip rows of [Controls](motion.md#controls) in motion.md.
## Switch

Turns one setting on or off and shows its state in more than the handle: the state word beside it, and the name.

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="sync" checked>
  <span class="ds-switch__track" aria-hidden="true"></span>
  <span class="ds-switch__label">Nightly sync</span>
  <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
</label>
```

**Options** ([options.md](options.md)): classes on the switch or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-switch--icons`, `.ds-switch--locked` | the switch | a glyph on the handle for each state; a value set elsewhere |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the switch or a group | the track 24, 28, 32, 36, 40px high (4px per step, width 13 : 8; handle, travel and icon follow), the row and the halo 8px per step, the name's type role |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | 4px less row per step (a list row too, and 2px less padding); the track, the halo and the type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius of the track and the handle times 0, .5, 1, 1.5, at most half their height: the pill at the default; the halo stays round |
| Touch | `.ds-touch` | the theme or a container | a row and a halo of at least `--ds-touch-target` (48px) |
| State | `checked`, `disabled`, `aria-disabled="true"`, `aria-busy="true"` | the input | on and off, blocked, waiting |

With both words (`.ds-switch__on`, `.ds-switch__off`) the CSS shows the right one and crossfades them; a single word
(`<span class="ds-switch__state" aria-hidden="true">On</span>`) still works, and then the page updates it when the
switch flips (screen readers announce the switch state themselves). Toggle in place; never re-render the switch to
change it.

The handle glides and grows on the spatial spring (also when a script sets `checked`), grows to 28px (at md) while
pressed,
and a halo around it (`--ds-switch-halo`, 40px) shows hover, press and keyboard focus; the switch has no ripple.
Disabled: the neutral track (`--ds-switch-disabled-track`) and handle (`--ds-switch-disabled-handle`), no hover, halo
or grow, the `not-allowed` cursor and the quieter label. An `aria-disabled="true"` switch input is blocked by
`DS.motion.guard()` (a click on the switch or its label never flips it; no page guard needed). `.ds-switch__label` has no styles of its own; add `.ds-sr` to it when a card
title next to the switch already names the setting. A tooltip on a switch (why it is blocked) goes on its input:
`<input type="checkbox" role="switch" aria-disabled="true" data-tip="Managed by your organisation">`.

The input covers the track, so it is the hit target: put a `data-tip` on the input, not on the label or the track.
The switch row is at least `--ds-switch-height` (40px, with the size and density steps) tall. In forced colours a focused checked switch rings in
`CanvasText`.

### Blocked with a reason

`aria-disabled="true"` on the input looks like `disabled` (no hover, halo or grow, the `not-allowed` cursor, the
quieter label; forced colours `GrayText`) and acts like it (the click, Space and a label click are blocked; no page
guard needed), but the switch stays focusable with its ring and focus halo, so a tooltip can say why:

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="backup" aria-disabled="true" data-tip="Needs an admin">
  <span class="ds-switch__track" aria-hidden="true"></span>
  <span class="ds-switch__label">Cloud backup</span>
</label>
```

### Locked

A value another system sets (a device policy, a directory): `.ds-switch--locked` with `aria-disabled="true"`, the lock
glyph as the track's last child and the reason in words:

```html
<label class="ds-switch ds-switch--locked">
  <input type="checkbox" role="switch" checked aria-disabled="true" aria-describedby="sync-why">
  <span class="ds-switch__track" aria-hidden="true">[icon lock 16 ds-switch__icon]</span>
  <span class="ds-switch__label">Nightly sync</span>
  <small class="ds-switch__hint" id="sync-why">Set by the device policy</small>
</label>
```

It keeps its on and off looks at full strength; the off handle grows to 24px so the lock fits. The lock rides the
handle (`--ds-dur-medium` on the spring), in `--ds-surface-highest` on the off handle and `--ds-primary` on the on
handle, and fades in on `--ds-dur-fast` and out on `--ds-dur-instant` when the lock comes or goes. The reason in words
is required (a hint, or the tooltip). Forced colours: the normal on and off colours, the lock in `Canvas` or
`Highlight`. "Locked" always means a value set elsewhere; a value that is waiting is busy, not locked.

### With icons

```html
<label class="ds-switch ds-switch--icons">
  <input type="checkbox" role="switch" name="sync" checked>
  <span class="ds-switch__track" aria-hidden="true">[icon close 16 ds-switch__icon ds-switch__icon--off][icon check 16 ds-switch__icon ds-switch__icon--on]</span>
  <span class="ds-switch__label">Nightly sync</span>
</label>
```

One glyph per state on the handle: both handles are 24px at md (as under a lock), the glyphs ride the handle on the
spring and crossfade (in on `--ds-dur-fast`, out on `--ds-dur-instant`). The icons repeat the state; they replace
neither the name nor the role.

### Busy

While the page waits for the answer to a change, it sets `aria-busy="true"` together with `aria-disabled="true"` on the
input, and clears both when the answer arrives (and sets `checked` back if the change failed, with a message):

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="sync" checked aria-busy="true" aria-disabled="true">
  <span class="ds-switch__track" aria-hidden="true"><span class="ds-spinner ds-switch__spinner"></span></span>
  <span class="ds-switch__label">Nightly sync</span>
</label>
```

`DS.motion.guard()` blocks it through `aria-disabled` (click, Space, a label click), and it stays focusable, so the
focus does not get lost. On and off keep full strength, there is no hover, halo or grow, the cursor says `progress`,
and the handle (24px) holds the spinner, which shows only after `--ds-delay-loader`, so a fast answer shows nothing.
Keep the spinner in the track at all times, for every switch that can wait: hidden, it does not paint. With
`.ds-switch--icons` it replaces the glyph while busy. "Busy" means waiting; a value set elsewhere is locked.

### Hint and extras

`small.ds-switch__hint` is a line under the name (the meta type, `--ds-text-2`); `span.ds-switch__meta` holds
non-interactive extras before the state word (a count, a tag); the name wraps long words. The hint sits directly under
the name, and the two centre together on the track. Name the input with
`aria-labelledby` (the label's id) and describe it with `aria-describedby` (the hint's id), so the extras stay out of
its name.

### Switch list

Many settings, each a switch:

```html
<div class="ds-switch-list">
  <label class="ds-switch">
    <input type="checkbox" role="switch" name="mail" checked aria-labelledby="mail-name" aria-describedby="mail-hint">
    <span class="ds-switch__track" aria-hidden="true"></span>
    <span class="ds-switch__label" id="mail-name">Email reports</span>
    <small class="ds-switch__hint" id="mail-hint">Every Monday at 08:00</small>
    <span class="ds-switch__meta"><span class="ds-tag ds-tone-neutral">3 recipients</span></span>
    <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
  </label>
  ...
</div>
```

Rows sit on one grid (track, name over hint, meta, state word), at least `--ds-switch-list-row-height` (56px) tall,
with hairlines between them. The name and its hint stand together on the switch's centre line: no gap between them,
and a row without a hint (or with a name that wraps) still centres its text on the track. At 560px of list width and
below the meta wraps under the name (under the hint when there is one).

### Keyboard, names, forced colours

- Keyboard: Tab reaches the input, Space toggles it; a blocked, busy or locked switch stays in the tab order with its
  ring and ignores Space.
- Names: a checkbox with `role="switch"`, named by its label. The track and the state word are `aria-hidden`; screen
  readers announce on and off themselves. A locked switch needs its reason (`aria-describedby`, a hint or a tooltip).
- Forced colours: `Highlight` on, `CanvasText` off, `GrayText` blocked; a locked or busy switch keeps on and off; the
  icons take the track's colour on the handle; a focused checked switch rings in `CanvasText`.
- Hooks: `--ds-switch-height`, `--ds-switch-track-height`, `--ds-switch-halo`, `--ds-switch-font`,
  `--ds-switch-disabled-track`, `--ds-switch-disabled-handle`, `--ds-switch-list-row-height`
  ([theming.md](theming.md#component-hooks)).

**Motion:** the switch rows of [Controls](motion.md#controls) in motion.md; the icons and the busy handle in the Motion
Lab.
## Slider

A value on a scale (a threshold, days of history), drawn on the native range input, so keyboard, forms and labels stay
native.

```html
<div class="ds-field">
  <label class="ds-field__label" for="keep">Keep history for</label>
  <div class="ds-field__row">
    <input class="ds-slider" id="keep" type="range" min="7" max="365" value="90" aria-describedby="keep-out">
    <output class="ds-slider__value" id="keep-out" for="keep">90 days</output>
  </div>
</div>
```

**Options** ([options.md](options.md)): classes on the slider or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the slider or a container | 24, 32, 40, 48, 56px high with the halo (8px per step), the track 2 to 6px, the handle 12 to 28px, the value's type role |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | 4px less height and halo per step; the handle and the track stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius of the track and of the handle: round at the default, square at 0; the halo is the handle's shadow, so it follows the handle's shape |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high, with the halo |

A 4px track in `--ds-accent` with its active part in `--ds-primary`, a 20px handle with a halo
(`--ds-slider-halo`, 40px) for hover, press and keyboard focus (like the switch: the halo is the press, no ripple,
and the handle never scales), the focus ring on the handle. Firefox draws the active part itself; elsewhere the page
sets `--ds-share` (the value's share of the range, 0 to 1) on the input when it renders and on every `input` event,
and keeps the `<output>` in step (without `--ds-share` the track shows no active part, and the slider still works):

```js
const share = () => { slider.style.setProperty('--ds-share', String((slider.value - slider.min) / (slider.max - slider.min)));
  output.value = `${slider.value} days`; };
slider.addEventListener('input', share); share();
```

- Keyboard and names: the native range input: Tab reaches it, the arrow keys step, Home and End jump, Page Up and Page
  Down take bigger steps. Name it with a `<label>`; `aria-describedby` on the `<output>` reads the value's words.
- Disabled and `aria-disabled` sliders take the disabled ink and no halo; `aria-disabled` keeps the slider in the tab
  order with its focus halo, and the action guard of `DS.motion` ([motion.md](motion.md)) holds its value: a press, a
  drag or a key moves nothing and no `input` or `change` reaches the page, so the page needs no guard of its own.
- Forced colours: the track in `ButtonText`, the handle in `Highlight` (`GrayText` when blocked), a focused handle a
  `CanvasText` ring.
- Hooks: `--ds-slider-halo`, `--ds-slider-thumb-size`, `--ds-slider-track-height`
  ([theming.md](theming.md#component-hooks)).

**Motion:** the slider row of [Controls](motion.md#controls) in motion.md.
## Combobox

A searchable list under a field: the page filters and chooses, `DS.overlay` opens and closes it.

```html
<div class="ds-combo">
  <input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-controls="model-list"
         aria-autocomplete="list" aria-activedescendant="model-2" value="lat">
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="model-list" role="listbox">
      <li class="ds-combo__option" id="model-1" role="option" aria-selected="false">
        <span class="ds-combo__name">Laptop 13</span><span class="ds-combo__meta">13", 2022</span></li>
      <li class="ds-combo__option" id="model-2" role="option" aria-selected="true" data-active>
        <span class="ds-combo__name">Laptop 14</span><span class="ds-combo__meta">14", 2023</span></li>
    </ul>
    <p class="ds-combo__status" role="status">2 of 38</p>
  </div>
</div>
```

```js
DS.overlay.open(popup, { opener: input });   // shows the list; aria-expanded="true" on the field
DS.overlay.close(popup);                     // Escape closes it too; focus stays in the field
```

`data-active` marks the keyboard or pointer option (its layer fades in over `--ds-dur-micro` and goes at once, so a
held arrow key leaves no trail), `aria-selected="true"` the chosen one (the tint and the label weight; in forced
colours `SelectedItem`, and while it is also the active one a `CanvasText` ring inside). `aria-expanded="true"` on the field turns the chevron 180deg on the spatial spring;
`DS.overlay` sets it.

- **Open and close** with `DS.overlay` ([motion.md](motion.md#dsoverlay-jsoverlayjs)). The page filters and chooses:
  filtering never re-creates or re-hides the list, and when nothing matches the list keeps showing with the status
  line (`.ds-combo__list` `hidden`, the status says "No match") instead of closing. Closing on blur and on a choice
  is the page's script (`DS.overlay.close(popup)`). Keep the field focused while an option is pressed by cancelling
  `mousedown` on the list (and the toggle) and choose on `click`, never by cancelling `pointerdown`: in WebKit that
  swallows the click of a tap, so a tap on an option would choose nothing.
- **Motion.** The list grows out of the field: it fades in (`--ds-dur-fast`) while its clip opens from the field's
  edge and it grows from `--ds-scale-popup` at the field, both on the spatial spring (`--ds-dur-medium`); the shadow
  is there from the first frame. It leaves with a fade only (`--ds-dur-instant`). The motion runs on transitions
  keyed on `data-state`, so a list closed mid-way turns back from where it is. A page that only drops `hidden`
  (no `DS.overlay`) gets the same reveal once, as keyframes.
- **Placement.** Below the field when the list fits there, else on the side with more room (`data-placement="top"`
  above), and never taller than the room on that side: the list scrolls inside while the status line stays, so it
  never covers the field being typed into, even in a short window. Where popover and CSS anchor positioning exist, the
  list opens as a `popover="manual"` in the top layer, anchored to the field and as wide as it (`data-anchored`), so a
  scrolling dialog or sheet never clips it. Elsewhere it stays absolute under the field, its room counted in the
  window narrowed by every box around the field that clips (a dialog's box, a sheet's body), with an inline
  `max-height` while it is open. There such a box still clips the list, so keep a combobox off the very end of a
  dialog.
- **Cut edges.** A list longer than its room scrolls, and each edge with more to show fades over `--ds-scroll-fade`
  (default `--ds-space-8`; `0px` on the theme turns it off), a mask on the registered numbers of the
  [Horizontal scroller](#horizontal-scroller) turned to the block axis. Where scroll timelines exist the fades follow
  the list's own scroll; elsewhere `DS.overlay.open()` attaches `DS.dom.scrollEdges(list, { axis: 'block' })` while
  the list is open (its `data-ds-overflow-start` and `-end`), so the page adds nothing. The active option, scrolled
  into view, lands clear of the fades (`scroll-padding-block`).

**Select-only** (`.ds-combo--select`, pick one of a few rich options without typing): the field is a
`<button class="ds-input ds-combo__input" type="button" role="combobox" aria-haspopup="listbox">` that shows the
choice in `.ds-combo__value` and an optional `.ds-combo__meta` in one row (start-aligned, ellipsis). Options may hold
any content (a `.ds-progress` on the chosen option keeps a visible track on the tint).

```html
<label class="ds-field__label" id="plan-label">Plan</label>
<div class="ds-combo ds-combo--select">
  <button class="ds-input ds-combo__input" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false"
          aria-controls="plan-list" aria-labelledby="plan-label plan-value">
    <span class="ds-combo__value" id="plan-value">Standard</span><span class="ds-combo__meta">4 devices</span>
  </button>
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show plans">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="plan-list" role="listbox" aria-labelledby="plan-label"> ... options ... </ul>
  </div>
</div>
```

The keys are the page's script, as the WAI select-only pattern says: Enter, Space, ArrowDown and ArrowUp open the
list on the chosen option; the arrows move `data-active` (and `aria-activedescendant` on the button), Home and End go
to the ends, Enter or Space chooses and closes, Escape closes, a printable key moves to the next option that starts
with the typed letters. Focus stays on the button.

**Groups and descriptions**: the WAI grouped listbox. The list is then a `<div>`, each group a `<ul>` whose first item
is a `.ds-combo__heading` (caption type, `role="presentation"`, named by the group's `aria-labelledby`). A
`.ds-combo__description` is a longer line under the name that wraps, where `.ds-combo__meta` stays on one line and ends
in an ellipsis. A heading never takes `data-active`, so the page's keys walk `.ds-combo__option` as ever. Filter by
setting `hidden` on the options: a group with no option left goes by itself, with its heading and its line, and the
line never stands above the first group that still shows.

```html
<div class="ds-combo__list" id="type-list" role="listbox">
  <ul class="ds-combo__group" role="group" aria-labelledby="type-laptops">
    <li class="ds-combo__heading" id="type-laptops" role="presentation">Laptops</li>
    <li class="ds-combo__option" id="type-1" role="option" aria-selected="false">
      <span class="ds-combo__name">Laptop 14</span>
      <span class="ds-combo__description">For most desks: light, with a full day of battery.</span></li>
  </ul>
  <ul class="ds-combo__group" role="group" aria-labelledby="type-desktops"> ... </ul>
</div>
```

**Clearable**: a `.ds-combo__clear` before the toggle. The page empties the field and sets `hidden` on the button while
there is nothing to clear; the field keeps room for it only while it shows. Unlike the toggle it stays in the tab
order, so it has the ring (and the press, the ripple and the morph of the toggle). Cancel its `mousedown` too, and give
focus back to the field after a click.

```html
<button class="ds-combo__clear" type="button" aria-label="Clear model" hidden>[icon close 20]</button>
```

**Creatable**: a last option `.ds-combo__option--create`, an icon and the words in the action ink. The page shows it
when no option matches the text exactly, and creates the value.

```html
<li class="ds-combo__option ds-combo__option--create" id="model-new" role="option" aria-selected="false">[icon plus 20]
  <span class="ds-combo__name">Create "Laptop 15"</span></li>
```

**Several values** (`.ds-combo--multi`, with `aria-multiselectable="true"` on the list): the `.ds-combo` draws the field
box and holds the chosen values as input chips ([Chips](#chips)) before the typing field, which wraps under them. Empty,
the box is the field's height at every step; the chips make it grow, and the toggle stays on its first line. The box
shows hover, focus, error, disabled and read-only for the field inside it.
Choosing leaves the list open; adding, removing and Backspace in the empty field are the page's script, and so is a press
on an empty part of the box, which only the page can send to the field:

```html
<div class="ds-combo ds-combo--multi">
  <button class="ds-chip ds-chip--input" type="button"><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove </span>Laptop 14</span>[icon close 18 ds-chip__trailing]</span></button>
  <input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-controls="order-list" aria-autocomplete="list">
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="order-list" role="listbox" aria-multiselectable="true"> ... </ul></div>
</div>
```

```js
combo.addEventListener('mousedown', (event) => {
  if (event.target === combo) { event.preventDefault(); input.focus(); }
});
```

**States.** Nothing found: `hidden` on `.ds-combo__list` and the words in the status line; the list stays open. Loading:
a `.ds-spinner` before the words in the status line and `aria-busy="true"` on the list. Error: `aria-invalid="true"` on
the field, with a `.ds-field__hint--error`. `aria-disabled="true"` on an option draws it in the disabled ink with no
active layer (skip it in your keys). `disabled` on the field takes its toggle with it (the disabled ink, no pointer)
and removes its clear button, from the tab order too. In `.ds-combo--multi` the chips lose the pointer, but CSS cannot
block their keys: the page sets `disabled` on each chip as well. A disabled select-only button takes its value and meta
into the disabled ink. An option both chosen and blocked keeps its tint and weight in the disabled ink. Without a `.ds-combo__toggle` the field keeps only its
own end padding.

**Options** ([options.md](options.md)): classes on the `.ds-combo` or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the combobox |
|---|---|---|---|
| Variant | `--select` (select-only), `--multi` (several values); `.ds-combo__option--create` | the `.ds-combo`; the option | what the field holds |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the `.ds-combo` or a group | the field and its toggle 24 to 56px (8px per step), an option 32 to 64px, the name's type role (`xs` caption, `sm` chip, `md` body, `lg` and `xl` subtitle; regular weight, the chosen one the label's) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the field, its toggle and an option 4px less per step, the block padding of options and the status line 2px less per step; side padding and type stay. The toggle lives in the field, so unlike an icon button it follows the density |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the list's radius and the rest and pressed radius of the toggle and clear button, times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | field, toggle, clear button and options at least `--ds-touch-target` (48px), whatever the size and the density |
| Tone | none | | a combobox shows no status of its own; the invalid look is the field's |

Put a size on the `.ds-combo`, not on the input: the field, the toggle and the room between them come from one height.
An option's height is a least height: a name with a description takes what its text needs.

The toggle is a round target as tall as the field with a state layer (hover, press in `--ds-dur-micro`), the ripple and
the press morph of every pill; it stays `tabindex="-1"` (the field opens the list from the keyboard), so it has no ring.
Options get no ripple: pressing one selects it and closes the list, and the state layer is the feedback.

**Keyboard and names.** The keys are the page's script, as the WAI combobox pattern says: ArrowDown and ArrowUp open the
list and move `data-active` and `aria-activedescendant` through the options (past headings and blocked options), Enter
chooses, Escape closes (`DS.overlay` handles it, after the page's own handlers). When the list closes, on Escape, on blur
or by a choice, the page clears `data-active` and `aria-activedescendant`, so the field never names an option in a hidden
list. Focus stays in the field. The field
needs a label; a group its `aria-labelledby`; the toggle and the clear button an `aria-label`. The status line is
`role="status"`, so a count or "No match" is announced.

**Forced colours.** The list keeps an edge (its transparent outline). The chosen option is `SelectedItem` /
`SelectedItemText`, the active one has a `Highlight` outline (`CanvasText` on the chosen one), a blocked one `GrayText` (chosen too: on
`Canvas` with a `GrayText` outline).
The box of several values keeps its border, with a 2px `Highlight` outline while focused (as a single field has) and
`GrayText` when disabled, with the toggle of a disabled field.

**Hooks:** `--ds-input-height` (the base of the field and its toggle, 40px; the field's other hooks apply to the box of
several values too: `--ds-input-border`, `--ds-input-bg`, `--ds-input-radius`, `--ds-input-focus-color`),
`--ds-combo-option-height` (the base of an option, 48px), `--ds-combo-radius` (the list, `--ds-radius-xs`),
`--ds-scroll-fade` ([theming.md](theming.md#component-hooks)). The attributes `data-active` (the page's),
`data-state`, `data-placement`, `data-anchored`, `data-ds-overflow-start` and `data-ds-overflow-end` (`DS.overlay`'s)
and `data-ds-ripple` (off for a part: [Ripple](#ripple)) are described above.

**Motion:** the "Combobox list" row of [Overlays](motion.md#overlays) in motion.md.
## Menu

Actions for one item, or the overflow of a toolbar, opened from a button:

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="More actions"
        aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu">[icon moreVertical 20]</button>
<div class="ds-menu" role="menu" id="row-menu" aria-label="Actions" hidden>
  <button class="ds-menu__item" role="menuitem" type="button">[icon pencil 20]<span class="ds-menu__label">Edit</span></button>
  <button class="ds-menu__item" role="menuitem" type="button">[icon copy 20]<span class="ds-menu__label">Duplicate</span></button>
  <button class="ds-menu__item" role="menuitemcheckbox" type="button" aria-checked="true">
    [icon check 20 ds-menu__check]<span class="ds-menu__label">Pinned</span></button>
  <div class="ds-menu__divider" role="separator"></div>
  <button class="ds-menu__item" role="menuitem" type="button" aria-disabled="true">[icon trash 20]<span class="ds-menu__label">Delete</span></button>
</div>
```

Declaratively (3.0): `data-ds-open="#row-menu"` on the trigger toggles the menu on a click and opens it from ArrowDown
(the first item) and ArrowUp (the last). By hand, what it does is:

```js
trigger.addEventListener('click', (event) => {
  if (event.detail > 1) return;                    // the second click of a double click toggles nothing
  if (trigger.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
  else DS.overlay.open(menu, { opener: trigger });
});
trigger.addEventListener('keydown', (event) => {
  // ArrowDown opens on the first item, ArrowUp on the last.
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  DS.overlay.open(menu, { opener: trigger });
});
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the menu or any ancestor | a row's height, 8px per step from 48px; the type (`--ds-size-font`, the body role by default) |
| Density | `.ds-density-*` | the menu or any ancestor | a row's height, 4px per step; the menu's block padding, 2px per step. A row's side padding is room for its icon and label and stays |
| Touch | `.ds-touch` | the menu or any ancestor | a row is at least `--ds-touch-target` high, whatever the size and density |
| Shape | `.ds-shape-*` | the menu or any ancestor | multiplies the menu's radius; a row is square |
| Danger | `.ds-menu__item--danger` | one item | the error ink (`--ds-menu-danger-color`) on its label and icon, for an action that destroys; the label names the consequence, so the colour is never alone |

### Items

```html
<div class="ds-menu" role="menu" id="more" aria-label="More actions" data-ds-menu-checks hidden>
  <button class="ds-menu__item" role="menuitem" type="button" aria-keyshortcuts="Control+E">[icon archive 20]
    <span class="ds-menu__content">
      <span class="ds-menu__label">Archive</span>
      <span class="ds-menu__description">Hide it from every list.</span>
    </span>
    <span class="ds-menu__shortcut">Ctrl E</span></button>
  <button class="ds-menu__item ds-menu__item--danger" role="menuitem" type="button">[icon trash 20]<span class="ds-menu__label">Delete device</span></button>
</div>
```

`.ds-menu__content` holds `.ds-menu__label` and a `.ds-menu__description` under it (meta type, wrapping; part of the
item's name, or point `aria-describedby` at it). `.ds-menu__shortcut` is the shortcut slot at the item's end (meta type,
tabular; say it to a screen reader with `aria-keyshortcuts`). `data-ds-menu-checks` on the menu: the system flips its
check items, a `menuitemcheckbox` toggles and a `menuitemradio` takes the one check of its group, once the item's own
handlers ran, and sends `ds:change` (`detail: { item, checked }`; not for the radio that already has the check). Without it your click handler flips `aria-checked`,
as in 2.x.

### Behaviour

- **Keyboard and focus** (`DS.overlay`, [motion.md](motion.md#dsoverlay-jsoverlayjs)): opening focuses the first
  enabled item (the last one when an ArrowUp keydown opened it); ArrowUp, ArrowDown, Home and End move focus, wrapping;
  Escape closes and focuses the trigger; Tab closes and moves on from the trigger. Activating an item (a click, Enter
  or Space) closes the menu once the item's own `click` handlers ran; focus goes back to the trigger unless a handler
  moved it (a dialog it opened). A `pointerdown` outside the menu and its trigger closes it without moving focus.
  `aria-expanded` on the trigger follows.
- **Items.** `.ds-menu__item` is a 48px row: an icon (`--ds-text-2`) and `.ds-menu__label` (one line, ellipsis), a
  state layer for hover, press and focus, an inset focus ring and the ripple. `role="menuitemcheckbox"` with
  `aria-checked`: the check (`.ds-menu__check` on its icon) shows only when checked and keeps its room otherwise, so
  the labels line up; your click handler flips `aria-checked`. `aria-disabled="true"` keeps an item focusable (its name
  is read) with the disabled ink, no hover, no press and no ripple; `DS.overlay` ignores its clicks, and
  `DS.motion.guard()` keeps them from your handlers too (no page guard needed).
  `.ds-menu__divider` separates groups. `.ds-menu__meta` at an item's end holds a shortcut (`.ds-kbd`) or the word "On" /
  "Off" of a `menuitemcheckbox` (meta type, tabular). `--ds-menu-item-height` (48px) sets the row height.
- **Groups and radio items.** A `<div role="group" aria-labelledby>` with a `.ds-menu__heading` (caption type, not
  focusable: the arrow keys pass it by) holds `role="menuitemradio"` items; the check shows on the one with
  `aria-checked="true"` (your click handler moves it):

  ```html
  <div role="group" aria-labelledby="sort-h">
    <p class="ds-menu__heading" id="sort-h">Sort by</p>
    <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true">[icon check 20 ds-menu__check]<span class="ds-menu__label">Name</span></button>
    <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false">[icon check 20 ds-menu__check]<span class="ds-menu__label">Last seen</span></button>
  </div>
  <button class="ds-menu__item" role="menuitem" type="button">[icon copy 20]<span class="ds-menu__label">Copy link</span><span class="ds-menu__meta">Ctrl C</span></button>
  ```

- **Type-ahead.** A printable key moves focus to the next item whose label starts with the letters typed so far;
  they reset after `--ds-delay-tooltip` (`DS.overlay`).
- **Placement.** Below the trigger from its start edge, flipped towards the start edge when there is no room; above
  the trigger when it does not fit below and there is more room above; 112px to 280px wide, and never taller than the
  room on its side (it scrolls inside), so it never covers its trigger. Where popover and CSS anchor positioning
  exist the menu is a `popover="manual"` in the top layer, anchored to the trigger (`data-anchored`); elsewhere
  `DS.overlay` writes `--ds-menu-x` and `--ds-menu-y` (`position: fixed`, plus an inline `max-height` when it is
  capped), sets `data-placement="top"` above and follows scrolling and resizing.
- **Cut edges.** A menu capped by the room on its side scrolls, and each edge with more to show fades into the menu's
  surface: a sticky shade in `--ds-surface-popover`, `--ds-scroll-fade` long (`0px` turns it off), above the items
  and never in the way of the pointer (the menu is its own surface, so a mask would cut its shadow). Where scroll
  timelines exist it follows the menu's scroll; elsewhere `DS.overlay.open()` attaches
  `DS.dom.scrollEdges(menu, { axis: 'block' })` while the menu is open. Focus moved by the keys lands clear of the
  shades. Forced colours drop them.
- **Inside a dialog or sheet.** A native dialog or sheet opened with `showModal()` makes everything outside it inert,
  top-layer popovers included. A menu used from inside one goes inside it in the markup; a menu that sits elsewhere
  (at the end of the `.ds-theme`, as above) is moved into the open native dialog or sheet by `DS.overlay.open()` and
  put back once it closed.
- **Motion.** As the combobox list: it fades in while its clip opens from the trigger's edge and it grows from
  `--ds-scale-popup` at the trigger on the spatial spring, and leaves with a quick fade; a menu closed mid-way turns
  back from where it is. Shown by hand (dropping `hidden` without `DS.overlay`) it reveals itself once.
- The menu sits inside the `.ds-theme` element, like every overlay. Forced colours keep its edge.

### Names and forced colours

- Names and roles: the trigger has `aria-haspopup="menu"`, `aria-expanded` (kept in step) and `aria-controls`; the menu
  `role="menu"` and a name; its rows `role="menuitem"`, `menuitemcheckbox` or `menuitemradio` with `aria-checked`; a
  group `role="group"` with `aria-labelledby` its heading.
- Forced colours: the transparent outline becomes its edge, the focused item keeps its ring, a blocked item is
  `GrayText`, the edge shades go; a danger item keeps the system's text, its label says what it does.

### Hooks

`--ds-menu-item-height`, `--ds-menu-font`, `--ds-menu-padding`, `--ds-menu-radius`, `--ds-menu-danger-color`
([theming.md](theming.md#component-hooks)). `data-ds-menu` marks a menu that `DS.get(el, 'menu')` serves.

**JS API.** `js/menu.js` (`DS.menu`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`; `create(el)` returns the controller that `data-ds-menu` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`).

**Motion:** the "Menu" row of [Overlays](motion.md#overlays) in motion.md.
## Dialog

A modal box for a decision or a short task: the page waits until it is done.

Native markup (preferred): `showModal()` makes the page inert and gives the dialog its modal semantics, so the box
carries no role.

```html
<dialog class="ds-dialog" role="alertdialog" aria-labelledby="del-title" aria-describedby="del-text">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="del-title">Delete 3 devices?</h2>
    <p class="ds-dialog__text" id="del-text">They disappear from every list. This cannot be undone.</p>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close autofocus>Cancel</button>
      <button class="ds-btn ds-btn--filled" type="button">Delete devices</button>
    </div>
  </div>
</dialog>
```

Div markup (fallback, and the only markup for `.ds-dialog--contained`): the same tree in
`<div class="ds-dialog" hidden>`, with the roles on the box: `<div class="ds-dialog__box" role="alertdialog"
aria-modal="true" aria-labelledby="del-title" aria-describedby="del-text">`.

Declaratively, without a script of your own (3.0): `data-ds-open` on the button opens it, with the button as its opener,
and `data-ds-close` inside it closes it. `data-ds-close="#id"` closes that one, from outside or from another overlay it
leaves open, and `[data-ds-open]` works on a
sheet and a menu too. `data-close` is the **deprecated** 2.x name of `data-ds-close` and works until 3.0 ships, and so does the event
`'ds-close'`, next to `ds:close`.

```html
<button class="ds-btn" type="button" data-ds-open="#del-dialog">Delete</button>
<dialog class="ds-dialog" id="del-dialog" data-ds-dialog aria-labelledby="del-title"> ... </dialog>
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-dialog--sm`, the default, `.ds-dialog--lg`, `.ds-dialog--xl` | the dialog | the width of the box: 320px, 400px, 560px, 720px (never wider than the window). A size class (`.ds-sm`) on it would change every control inside, so the dialog has these instead. `.ds-dialog--wide` is the **deprecated** name of `.ds-dialog--lg`, and the hook `--ds-dialog-width-wide` of `--ds-dialog-width-lg`, until 3.0 ships |
| Full screen | `.ds-dialog--full`; `.ds-dialog--full-narrow` | the dialog | the box fills the window; `--full-narrow` only at 600px and below |
| Action sheet | `.ds-dialog--bottom` | the dialog | the box sits at the bottom edge |
| Contained | `.ds-dialog--contained` | the dialog, div markup | it covers its positioned container |
| Density | `.ds-density-*` | the dialog or any ancestor | the box's padding and the gap of its parts (2px per step), the full-screen head's height (4px per step) |
| Shape | `.ds-shape-*` | the dialog or any ancestor | multiplies the box's radius |
| Touch | `.ds-touch` | the dialog or any ancestor | reaches the controls inside; the box itself has no target |
| Tone | `.ds-tone-error` | the filled button of a destructive confirmation only (D10) | the one red button; `DS.overlay.confirm({ destructive: true })` sets it. Everything else about a dialog is neutral |

The private values (`--_pad`) are computed in the rule that uses them; set the hooks instead.

### A form dialog

The box is the `<form>` with `data-ds-dialog-form`, so Enter submits and the browser's validation runs first. A submit
sends a cancelable `ds:submit` (`detail: { form, data }`, a `FormData`) on the dialog and closes it with reason `submit`,
unless a listener calls `preventDefault()`, on the submit or on `ds:submit`. Without the attribute a form in the box
stays yours, as in 2.x (it posts, or your handler decides). For work that takes time, `DS.dialog.form(dialog, { onSubmit, errorText })` runs
`onSubmit(data, form)` as `confirm()` runs `onConfirm`: `DS.motion.busy()` on the submit button and `data-ds-busy` on
the dialog, Cancel `aria-disabled`, the typed fields read-only and other controls inert, so what shows is what was sent;
a rejection keeps it open with an error snackbar, focus on that button and all of that given back. The submit button
needs the faces of `busy()` in its markup, as below, for its spinner.

```html
<dialog class="ds-dialog" id="rename" aria-labelledby="rename-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <form class="ds-dialog__box" data-ds-dialog-form>
    <h2 class="ds-dialog__title" id="rename-title">Rename the device</h2>
    <div class="ds-dialog__body">
      <div class="ds-field"><label class="ds-field__label" for="rename-name">Name</label>
        <input class="ds-input" id="rename-name" name="name" required autofocus></div>
    </div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
      <button class="ds-btn ds-btn--filled" type="submit">
        <span class="ds-btn__faces"><span class="ds-btn__face">Save</span>
          <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Save</span></span>
      </button>
    </div>
  </form>
</dialog>
```

### Behaviour

- Open and close with `DS.overlay.open(dialog, { opener: button })` and `DS.overlay.close(dialog)`
  ([motion.md](motion.md#dsoverlay-jsoverlayjs)): focus moves in at once (`autofocus` marks the intended first focus,
  Cancel in a destructive `alertdialog`; else the first focusable element), the page is inert (the div markup in a
  shadow root makes the host page inert too, and so are elements the page adds while it is open), Escape and
  `[data-ds-close]` close, the scroll lock counts (it stops the page from scrolling with `.ds-base` on `<html>`; not in an
  embedded widget, see [theming.md](theming.md), "Embedded in someone else's page"), and focus is back on the opener in the frame of the close. The dialog
  must sit inside the `.ds-theme` element (`DS.overlay` warns otherwise).
- Motion: the scrim fades while the box fades, grows from `--ds-scale-enter` and rises `--ds-distance-sm` on the
  spatial spring (`--ds-dur-slow`), from an origin towards its opener; it leaves the same way back in `--ds-dur-base`,
  accelerating. It runs on transitions keyed on `data-state`, so a close taken back mid-way continues from where the
  box is. At 600px and below the box decelerates instead of springing (no overshoot past the window).
- **Above the on-screen keyboard** (2.1.1). With `DS.dom.followViewport()` on the page every dialog keeps clear of the
  keyboard (`--ds-keyboard-inset`): a centred box centres in the window above it, a full-screen box (`--full`, and
  `--full-narrow` on phones) ends at its top edge, the action sheet (`--bottom`) sits on it and a contained box sticks
  above it; the scrim keeps covering the whole window. A box taller than the room left scrolls its body.
- **Over another overlay.** A dialog opened from a side sheet, from the modal drawer or from another dialog takes input
  while the overlay under it stays inert (the div trap follows the stack). Over an open native dialog or sheet, which
  makes everything outside it inert, a dialog or sheet (div or native, and a menu) must sit inside it:
  `DS.overlay.open()` moves it in while it shows and back once it closed. A native one needs it for its exit:
  `dialog.close()` runs at once, so the sheet under it is the top modal again; inside the sheet the leaving dialog
  stays above the sheet's panel and its scrim keeps catching clicks (a double click on it never closes the sheet).
- `.ds-dialog--nested` (set by `DS.overlay` when another modal is open, a dialog from inside a side sheet) uses the
  lighter `--ds-scrim-nested`, so the two scrims add up to about 43% instead of 54%. The hook `--ds-dialog-scrim`
  sets the scrim of one dialog.
- By hand (div markup, no `data-state`; keyframes): show it by dropping `hidden` (it hides the dialog without
  `.ds-base` too) or `.ds-dialog--hidden`, trap focus, close on Escape. To close, release the trap and focus the
  opener first, then add `.ds-dialog--closing`; after `DS.motion.settled(box)` add `hidden` (or `--hidden`) and
  remove `--closing` in the same task. During the exit only the box lets clicks through: the backdrop swallows them
  until the dialog is hidden, so a click meant for the backdrop never reaches the page under it. A native dialog
  driven by hand (`showModal()`, `close()`) plays the same transitions (`@starting-style` and
  `transition-behavior: allow-discrete`, both at the 3.0 browser floor).
- `.ds-dialog--contained` covers the nearest positioned ancestor instead of the window (a dialog inside an embedded
  panel; div markup only). `DS.overlay` traps focus and input within that container only and takes no scroll lock
  (1.6.1), and Escape closes it only when pressed inside the container: the host page around the widget keeps its
  input, its scroll and its own Escape (its dialogs, its search fields). In a container taller than the window the
  box stays in the visible part (`position: sticky`), so it never opens below the fold. Its z-index is the host
  page's business: [theming.md](theming.md), "Embedded in someone else's page".

### Body, width and height

A dialog whose content can be taller than the window (a form, a long list) puts it in `.ds-dialog__body`: the box
turns into a column, only the body scrolls, and title and actions stay in view. The body reaches 12px into the box's
padding (focus rings and the halos of checks are never clipped) and shows a hairline at its top while it is scrolled
(`data-scrolled` on the box: `DS.overlay.open()` watches every body with `DS.dom.watchScrolled()` on its first open,
2.0; a dialog shown without `DS.overlay` calls `DS.dom.watchScrolled(body)` once). A body that scrolls with nothing focusable in it
gets `tabindex="0"`, `role="region"` and a name, so the keyboard can scroll it (an inset ring). In a window 320px high
or less the box scrolls as one instead (WCAG 1.4.10). An empty body (its sentinel aside) or empty actions take no room; a body of bare text
(no element around it) stays, as `watchScrolled()` marks it `data-ds-text`. A lone `.ds-btn`
directly in the body keeps its own width.

```html
<dialog class="ds-dialog ds-dialog--lg" aria-labelledby="own-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="own-title">Choose an owner</h2>
    <div class="ds-dialog__body"> ... a form or a list ... </div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
      <button class="ds-btn ds-btn--filled" type="button">Choose</button>
    </div>
  </div>
</dialog>
```

`.ds-dialog--lg` makes the box `--ds-dialog-width-lg` (560px) wide. `--ds-dialog-height` (default `auto`, never
taller than the window) fixes the box's height, so a list that filters does not make the box jump.

**A search over a list.** A `.ds-search` between the title and the body, a `.ds-meta` count after it ("12 of 40
people"), the list in the body, Choose `aria-disabled="true"` with a `data-tip` until a row is chosen, and
`--ds-dialog-height` on the dialog. Filter through `DS.dom.morphHtml` inside `DS.motion.flip`, so the rows glide; with
no match the body shows a `.ds-empty` that enters with `DS.motion.enter(empty, 'fade')`. Escape in the filled search
clears it first; the next Escape closes the dialog.

```js
search.addEventListener('input', () => {
  const rows = people.filter((person) => person.name.toLowerCase().includes(search.value.trim().toLowerCase()));
  DS.motion.flip(list, () => DS.dom.morphHtml(list, rows.length ? rows.map(rowHtml).join('') : emptyHtml));
  count.textContent = `${rows.length} of ${people.length} people`;
});
```

**Steps in one dialog** (choose, then confirm): keep the box's height through the CSSOM
(`box.style.setProperty('height', box.offsetHeight + 'px')`), swap the body's content and play
`DS.motion.enter(body, 'swap')`, focus the second step's primary action and announce the step (a `.ds-sr` live
region, or a snackbar); remove the height once the second step settled.

### Full screen and the action sheet

`.ds-dialog--full` fills the window (no padding around the box, radius `--ds-dialog-full-radius`, 0; safe areas on
head and actions); `.ds-dialog--full-narrow` does so at 600px and below and is a normal dialog above. Its head,
`.ds-dialog__head`, is the M3 full-screen top bar: a close icon button with `data-ds-close`, the title, an optional text
button at the end (the head may also be used in a normal dialog). The box rises `--ds-distance-lg` on the spring over
`--ds-dur-long` with the fade, no scale, and drops back in `--ds-dur-base`.

```html
<dialog class="ds-dialog ds-dialog--full-narrow" aria-labelledby="new-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <div class="ds-dialog__head">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
      <h2 class="ds-dialog__title" id="new-title">New ticket</h2>
      <button class="ds-btn ds-btn--text" type="button">Save</button>
    </div>
    <div class="ds-dialog__body"> ... the form ... </div>
  </div>
</dialog>
```

`.ds-dialog--bottom` is the action sheet: the box sits at the bottom edge (above the home indicator) and rises its
full height on the spring; it drops back in `--ds-dur-base`. `.ds-dialog__list` lays [menu](#menu) items full bleed
in the box, and `DS.overlay` moves focus through them with ArrowUp, ArrowDown, Home and End, as in a menu. A menu at a
desk and an action sheet at 600px and below can share the item markup:

```html
<dialog class="ds-dialog ds-dialog--bottom" aria-labelledby="row-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="row-title">LAPTOP-0042</h2>
    <div class="ds-dialog__list">
      <button class="ds-menu__item" type="button">[icon pencil 20]<span class="ds-menu__label">Edit</span></button>
      <button class="ds-menu__item" type="button">[icon archive 20]<span class="ds-menu__label">Archive</span></button>
    </div>
    <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button></div>
  </div>
</dialog>
```

```js
const phone = matchMedia('(max-width: 600px)');
rowButton.addEventListener('click', () => DS.overlay.open(phone.matches ? actionSheet : rowMenu, { opener: rowButton }));
```

Forced colours: the full-screen box is the window and needs no edge; the action sheet keeps the box's transparent
border.

### A question with yes or no

`DS.overlay.confirm()`, `alert()` and `prompt()` build the dialog for you (DOM APIs only, inside the opener's
`.ds-theme`), open it through `DS.overlay.open()`, remove it after its exit and resolve with the answer
([motion.md](motion.md#dsoverlay-jsoverlayjs)):

```js
const ok = await DS.overlay.confirm({
  title: 'Delete 3 devices?', text: 'They disappear from every list.',
  confirmLabel: 'Delete devices', destructive: true, opener: button,
  onConfirm: () => api.removeDevices(ids),          // busy on the button, the dialog stays open meanwhile
  errorText: 'Could not delete the devices.',       // a failure keeps it open with this error snackbar
});
const name = await DS.overlay.prompt({ title: 'Rename', label: 'Name', value: device.name, opener: button });
await DS.overlay.alert({ title: 'Export ready', text: 'The file is in your downloads.', opener: button });
```

`destructive: true` makes it an `alertdialog` whose first focus is Cancel, and its confirm button filled in the error
tone (`.ds-btn--filled.ds-tone-error`, D10: the one red button, and only here and in the type-to-confirm pattern); the
button's label names the consequence, so the colour is never alone. `onConfirm` runs with `DS.motion.busy()` on the confirm button and
`data-ds-busy` on the dialog (Cancel `aria-disabled`); when it rejects, the dialog stays open, `errorText` (default
"That did not work. Try again."; never the raw error) shows as an error snackbar above it, and focus goes back to the
confirm button. `confirm()` resolves `true` or `false`, `prompt()` the value or `null`; Enter in the prompt's field
confirms. A prompt whose `input.required` field is left empty stays open with the field error of the form section:
`aria-invalid`, a `.ds-field__hint--error` with its icon and `requiredText` (default "Enter a value."), linked by
`aria-describedby` and announced at once; typing takes it away. The defaults are the system's strings `confirm`,
`cancel`, `ok`, `actionFailed` and `valueRequired`, English until `DS.config({ strings })` sets them
([install.md](install.md#language-and-locale)).

### Confirm by typing the name

For an action that cannot be undone: an `alertdialog`, `.ds-dialog--lg`, a body with the text, a
`.ds-tone-warning` and a field ("Type LAPTOP-0042 to confirm", `autocomplete="off"`, `spellcheck="false"`,
`autocapitalize="off"`, `autofocus`). The action stays `aria-disabled` with a tip until `value.trim()` equals the name;
Enter (not while composing) runs it. While it works: `data-ds-busy` on the dialog, the field `readOnly`, Cancel
`aria-disabled`, and `DS.motion.busy(action, work, { done: false })`. Success closes it with reason `confirm` and a
snackbar; a failure keeps the value, shows an error snackbar above the dialog and focuses the field. The action may
take the error tone (D10).

```js
field.addEventListener('input', () => action.setAttribute('aria-disabled', String(field.value.trim() !== name)));
field.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.isComposing) run(); });
action.addEventListener('click', run);
async function run() {
  if (field.value.trim() !== name || dialog.hasAttribute('data-ds-busy')) return;
  dialog.setAttribute('data-ds-busy', '');
  field.readOnly = true;
  cancel.setAttribute('aria-disabled', 'true');
  try { await DS.motion.busy(action, deleteDevice(name), { done: false }); }
  catch { DS.overlay.toast(region, `Could not delete ${name}.`, { kind: 'error' }); field.focus(); return; }
  finally { dialog.removeAttribute('data-ds-busy'); field.readOnly = false; cancel.removeAttribute('aria-disabled'); }
  DS.overlay.close(dialog, { reason: 'confirm' });
  DS.overlay.toast(region, `${name} deleted.`);
}
```

### While its action runs

`data-ds-busy` on the dialog (2.0; set and removed by the page, never written by the system) keeps it open while its
action runs: Escape, the native `cancel`, `[data-ds-close]` (the backdrop included) do nothing, while
`DS.overlay.close(dialog)` still closes. Nothing changes visibly: the busy button is the feedback, Cancel is
`aria-disabled` with a `data-tip`. The same attribute works on the side sheet and the modal drawer.

```js
remove.addEventListener('click', async () => {
  dialog.setAttribute('data-ds-busy', '');
  cancel.setAttribute('aria-disabled', 'true');
  try { await DS.motion.busy(remove, removeDevices(), { done: false }); }
  catch { DS.overlay.toast(region, 'Could not delete the devices.', { kind: 'error' }); return; }
  finally { dialog.removeAttribute('data-ds-busy'); cancel.removeAttribute('aria-disabled'); }
  DS.overlay.close(dialog, { reason: 'confirm' });
});
```

Limits: a morph that drops the attribute frees the dialog (render it, or set it on an element that is not morphed);
Android Back can still force a native close (it follows with reason `escape`); never set `closedby` on a dialog that
`DS.overlay` drives; a `<form method="dialog">` submit closes natively (give its buttons `type="button"`).

- **Why it closed.** Every close sends `ds:close` (and `ds-close`, its **deprecated** 2.x name) with `detail.reason` (`escape`, `backdrop`, `close`, `api`, `submit`, your own
  string from `close(dialog, { reason })` ...; [motion.md](motion.md#dsoverlay-jsoverlayjs)), once, as soon as it starts.
  It bubbles: a listener on the dialog also hears the menus, lists and dialogs inside it, so check
  `event.target === dialog`.
- **Focus back.** Give row buttons that open a dialog stable `id`s: when a re-render replaced the opener, focus goes to
  the element that now has its `id`; `open(dialog, { opener, returnTo: () => element })` names another place.
- **A double click on the opener** never closes the dialog it opened: a backdrop click closes only as the first click
  of a press that began on it, from `--ds-delay-dismiss` after the open.
- **An opener with `aria-expanded`** (a button that says it shows a dialog, `aria-haspopup="dialog"`) is kept in step:
  `"true"` while it is open, `"false"` as soon as the close starts. An opener without the attribute gets none.

### Keyboard, names and forced colours

- Keyboard: focus moves in at once (`autofocus`, else the first focusable element, else the box); Tab stays inside;
  Escape closes the top layer, after the page's own handlers (a filled search takes the first Escape); Enter in a form
  dialog submits; in `.ds-dialog__list`, ArrowUp, ArrowDown, Home and End move through the rows.
- Names and roles: `aria-labelledby` the title (`aria-describedby` the text, for an `alertdialog`), on the native
  `<dialog>` or on the box of the div markup, which also takes `role` and `aria-modal="true"`. A destructive question is
  an `alertdialog`.
- Forced colours: the box's transparent border (`--ds-dialog-border`) becomes its edge; the full-screen box is the
  window and needs none; the error-tone button takes the system colours, so its label carries the meaning.

### Hooks

`--ds-dialog-width`, `--ds-dialog-width-sm`, `--ds-dialog-width-lg`, `--ds-dialog-width-xl`, `--ds-dialog-padding`,
`--ds-dialog-radius`, `--ds-dialog-head-height`, `--ds-dialog-height`, `--ds-dialog-border`, `--ds-dialog-shadow`,
`--ds-dialog-scrim`, `--ds-dialog-full-radius` ([theming.md](theming.md#component-hooks)). `data-ds-dialog` marks a
dialog that `DS.get(el, 'dialog')` serves.

**JS API.** `js/dialog.js` (`DS.dialog`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`; `confirm(options)`, `alert(options)` and `prompt(options)` are also `DS.overlay.confirm()`, `alert()` and `prompt()`; `form(el, { onSubmit, errorText })` runs a form dialog's submit; `create(el)` returns the controller that `data-ds-dialog` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`).

**Motion:** the "Scrim", "Dialog", "Nested dialog", "Dialog on a phone", "Full-screen dialog" and "Action sheet" rows of [Overlays](motion.md#overlays) in motion.md.
## Side sheet

Details or a form beside the page, in a panel that slides in from the side (from the bottom on phones).

Native markup (preferred), or the same tree in `<div class="ds-sheet" role="dialog" aria-modal="true"
aria-labelledby="sheet-title" hidden>`:

```html
<dialog class="ds-sheet" aria-labelledby="sheet-title">
  <div class="ds-sheet__backdrop" data-ds-close></div>
  <section class="ds-sheet__panel">                      <!-- ds-sheet__panel--wide: 720px -->
    <div class="ds-sheet__head">
      <h2 class="ds-sheet__title" id="sheet-title">LAPTOP-0042</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-sheet__body" tabindex="0"> ... </div>
  </section>
</dialog>
```

The head can hold a subtitle under the title, and the sheet a foot with its actions (2.0):

```html
<div class="ds-sheet__head">
  <div class="ds-sheet__heading">
    <h2 class="ds-sheet__title" id="filter-title">Filters</h2>
    <p class="ds-sheet__subtitle" aria-live="polite">12 of 240 devices</p>
  </div>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
</div>
<div class="ds-sheet__body" tabindex="0"> ... </div>
<div class="ds-sheet__foot">
  <p class="ds-meta">3 filters</p>
  <button class="ds-btn ds-btn--text" type="button">Reset</button>
  <button class="ds-btn ds-btn--filled" type="button" data-ds-close>Show 12 devices</button>
</div>
```

The title wraps (a long record name stays readable); `.ds-sheet__subtitle` is one line of meta type that ends in an
ellipsis (empty, it takes no room). `.ds-sheet__foot` sits after the body, its actions at the end and wrapping, above a
hairline (`--ds-sheet-foot-border`); a leading `.ds-meta` takes the start; it holds the safe area, so the body above it
ends with its normal gap; empty, it takes no room. The body is positioned (`offsetParent` of what is inside) and has a
thin scrollbar; a lone `.ds-btn` directly in it keeps its own width.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Width | `.ds-sheet__panel--wide`, `--ds-sheet-width` | the panel | 720px instead of 560px; the whole width at 600px and below |
| Density | `.ds-density-*` | the sheet or any ancestor | the padding of head, body and foot (2px per step), the head's height (4px per step) |
| Shape | `.ds-shape-*` | the sheet or any ancestor | multiplies the radius of the panel's leading corners |
| Size, touch | `.ds-sm` ..., `.ds-touch` | the sheet or any ancestor | reach the controls inside; the panel itself keeps its size |

There is no tone: a sheet shows no meaning of its own.

### Behaviour

Open and close it like the dialog, with `DS.overlay.open(sheet, { opener })` and `DS.overlay.close(sheet)`, or with
`data-ds-open="#id"` on a button and `data-ds-close` inside it. The panel
is opaque throughout: it slides its full width in from the edge on the spatial spring (`--ds-dur-long`) while the
scrim fades, and goes back to the edge in `--ds-dur-base`, accelerating, without a fade. At 600px and below it rises
from the bottom and falls back down. A strip of the panel's background past its outer edge covers the spring's
overshoot, so the scrim never shows at the screen edge. By hand, close it like the dialog with `.ds-sheet--closing`
(`DS.motion.settled(panel)`, then hide and remove the class in one task): the panel lets clicks through while it
leaves, the backdrop swallows them until the sheet is hidden. The `hidden` attribute hides the div sheet without
`.ds-base` too. While the body is scrolled the panel carries `data-scrolled` (the head's hairline appears):
`DS.overlay.open()` watches the body with `DS.dom.watchScrolled(body)` on its first open (2.0; a sheet shown without
`DS.overlay` calls it once). It writes the attribute on the `.ds-sheet__panel`, and its sentinel takes no room
in the body (absolute at its padding edge) and stays through a record swap with `DS.dom.morphHtml(body, html)`. Where
scroll timelines exist the hairline follows the body's scroll by itself, over the first `--ds-space-2`: the body
names its timeline `--ds-sheet-scroll` and the panel scopes it to the head (progressive: `timeline-scope`). Use a
`<div>` for the head, not `<header>` (a second banner landmark). With `DS.dom.followViewport()` on the page the panel
ends above the on-screen keyboard (`--ds-keyboard-inset`, 2.1.1), so its foot and the field being typed in stay in
view; the scrim keeps covering the whole window.

**Another record in an open sheet** (previous and next, another row of the table): keep the sheet open and swap only
the body with `DS.dom.morphHtml` inside [`DS.motion.transition()`](motion.md#dsmotion-jsmotionjs):

```js
// type: 'forward' for the next record, 'back' for the previous, 'fade-through' for another row
DS.motion.transition(() => { DS.dom.morphHtml(body, html); return body; }, { type: 'forward' });

// The same record refreshed (polling, a save): never a transition, data does not replay an entrance.
DS.dom.morphHtml(body, html);
```

With View Transitions (and `.ds-theme` on `<html>`) the body of the open sheet is its own group, `ds-sheet-body`
(only an open modal sheet's body is named: one shown inline in a page stays in the page), and takes the view's
motion: fade-through, or shared axis X for `forward` and `back`; the head, the panel and the page under the scrim
stay still. Without them the body enters with `.ds-enter--swap`. Fetch the record first and call `transition()` with
the quick swap: the page is frozen while a View Transition runs.

**Container transform** (opt-in): `DS.overlay.open(sheet, { opener: row, container: true })` grows the row (or card)
into the panel instead of sliding it in from the edge ([DS.overlay](motion.md#dsoverlay-jsoverlayjs)); the same works
for a dialog. A row that its table's scroll wrapper clips (the row of a `.ds-table--wide` table wider than its wrapper, or one partly
under the top bar) gets the usual entrance instead: its group would paint the hidden part over the frame.

While its action runs (a save in the sheet's foot), `data-ds-busy` on the sheet keeps it open, as for the
[Dialog](#dialog); `ds:close` tells why it closed.

### Keyboard, names and forced colours

- Keyboard: focus moves in at once (`autofocus`, else the first focusable element, else the panel); Tab stays inside;
  Escape closes it; a scrolling body with nothing focusable is a tab stop (`tabindex="0"`, an inset ring).
- Names and roles: `aria-labelledby` the title, on the native `<dialog>` or on the `role="dialog" aria-modal="true"`
  div. A subtitle that changes (a count) is `aria-live="polite"`.
- Forced colours: the panel's transparent outline becomes its edge.

### Hooks

`--ds-sheet-width`, `--ds-sheet-width-wide`, `--ds-sheet-padding`, `--ds-sheet-head-height`, `--ds-sheet-radius`,
`--ds-sheet-foot-border` ([theming.md](theming.md#component-hooks)). `data-ds-sheet` marks a sheet that
`DS.get(el, 'sheet')` serves.

**JS API.** `js/sheet.js` (`DS.sheet`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`; `create(el)` returns the controller that `data-ds-sheet` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`).

**Motion:** the "Scrim", "Side sheet" and "Side sheet on a phone" rows of [Overlays](motion.md#overlays) in motion.md.
## Snackbar

A short message about something that just happened, at the bottom of the content panel, with an optional action.

```html
<div class="ds-toasts"></div>                                   <!-- right after .ds-app, inside .ds-theme -->
```

```js
DS.overlay.toast(region, 'Saved.');                                 // closes by itself
DS.overlay.toast(region, 'Could not save.', { kind: 'error' });     // stays until closed
const message = DS.overlay.toast(region, 'Export ready.', { persistent: true });
message.close();                                                    // message.closed resolves once it is gone
DS.overlay.toast(region, '3 devices deleted.', { action: { label: 'Undo', onClick: () => restore() } });
DS.overlay.toast(null, 'Saved.');                                   // null: the page's region (toastRegion())
DS.overlay.announce('Saved.');                                      // said, not shown
```

What `toast()` builds from a string (or takes as it is, when you pass a `.ds-toast` element):

```html
<div class="ds-toast [ds-toast--error | ds-toast--info]">[icon checkCircle | alertCircle | info 20]<span class="ds-toast__text">Saved.</span>
  <button class="ds-btn ds-btn--text ds-sm ds-toast__action" type="button">Undo</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">[icon close 20]</button></div>
```

The action button comes only with `action`, the close button with every message that stays (`closeLabel`, default the
system's string `close`, is its label and its tooltip).

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Kind | `kind: 'success'`, `'error'`, `'info'`; `.ds-toast--error`, `.ds-toast--info`, or `.ds-tone-error`, `.ds-tone-info` on a message built by hand | one message | its icon and word; an error stays until closed and is announced at once. On the inverse surface a tone is never a colour of its own |
| Shape | `.ds-shape-*` | the region or any ancestor | multiplies the radius (`--ds-toast-radius`) |
| Size, density | none | | a snackbar floats above the region it reports on and keeps one size; its action stays 32px and its close button 36px (only `.ds-touch` makes that bigger) |

### Behaviour

- Place the region right after `.ds-app`. It sits at the bottom left of the content panel: next to a persistent
  drawer by itself, next to the open modal drawer above 600px, full width on phones. If your panel starts elsewhere,
  set `--ds-toast-left` on the region to the panel's left edge plus 24px
  (`region.style.setProperty('--ds-toast-left', panel.getBoundingClientRect().left + 24 + 'px')`).
  `DS.overlay.toastRegion(doc)` returns the page's region: the `.ds-toasts` in the theme of the first `.ds-app` (else
  the first in the document); without one it creates `<div class="ds-toasts"></div>` right after `.ds-app` (else as
  the last child of the `.ds-theme`, or of `<body>` when the theme is `<html>`; 2.1). `toast(null, ...)`, `announce()` and the save bar use it. A region first used while a
  dialog or side sheet of its theme is open (created then, or rendered by the page after the open) moves into it on
  that first use, like one that was there at the open, so its messages and announcements are above the modal.
- **Stack.** At most three show at once (`TOAST_LIMIT`), the newest at the bottom; the others glide to their places
  (`DS.motion.flip()`) while a message rises in or fades out where it was. A fourth replaces the oldest message that
  would close by itself; when all three stay (errors, `persistent`), it waits and enters when one closes. `close()`
  on a waiting message takes it out of the queue.
- **The same message again.** A string message without action, of the same kind, `persistent` and text (whitespace
  and case aside) as one on screen does not stack: the one on screen starts its timer over and its text is announced
  again, and `toast()` returns its handle (a waiting one keeps its place). A poll that reports "Offline." every few
  seconds shows one message. `restart: false` stacks it all the same.
- **Replace by key.** `toast(region, text, { key: 'sync' })` replaces the message with the same `key` on screen or
  waiting: on screen the old one fades out in place while the new one enters in its slot (one glide), waiting it
  takes its place in the queue; the old handle's `closed` resolves, the call returns the new handle, and focus inside
  the old message moves to the new one's close button. A retry keeps one error: `{ kind: 'error', key: 'save' }`.
- **Close by kind or key.** `DS.overlay.closeToasts(region, { kind, key })` closes every message on screen or waiting
  that matches (both optional; no filter closes all; `region` defaults to `toastRegion()`), as one change of the
  stack, and resolves once they are gone: a save that succeeds after a retry clears its errors with
  `closeToasts(null, { key: 'save' })`.
- **Undo right after an action.** `action: { label, onClick }` (string messages) adds a text button before the close
  button; the message gets the close button too and stays until one of them is used. A click closes the message,
  then calls `onClick(event, handle)` once (an error it throws goes to `reportError`). Any `.ds-btn--text` in a
  message, also one you build, takes the inverse primary ink (`--ds-toast-action-color`, default
  `--ds-inverse-primary`, 7.6:1 on the inverse surface) and sits at the end of the line.
- **Timer.** A message closes after `timeout` ms: by default 4s plus 50ms for each character past 40, at most 10s,
  all stretched by `--ds-time-scale`. Errors, `persistent: true` and messages with an action, another button or a
  link never close by themselves: the close button or the action does. An element message that stays without a
  close button or an action of its own gets the documented close button. The timers pause while a pointer is over a
  message, while focus is in the region and while the tab is hidden, and go on with the time they had left.
- **Room at the end.** While a message that stays shows, its layer keeps room for it, so the last actions can scroll
  clear of it: `toast()` sets `data-toast-reserve` and `--ds-toast-reserve` (how far the highest staying message
  reaches into the scroller, rounded up) on the `.ds-view` of the region's app, on the `.ds-sheet__body` of a side
  sheet that hosts the region, or on a hosting `.ds-dialog` while its box would overlap the stack (the box then
  re-centres above it). It measures again after every change of the stack, after the region moves and when the
  region resizes, and scrolls a focused element that the stack covers clear of it. Both are owned (a re-render
  keeps them). `reserve: false` leaves both to the page for that message. A layer that must never shrink (a fixed
  view that refits its content, such as a terminal) takes `data-ds-toast-room="off"` (2.1): `toast()` keeps no room
  there (no attribute, no padding, nothing scrolled), while the dialogs and sheets that host the region later keep
  theirs. It is read at every measure, so setting or removing it applies on the next change of the stack; the page
  then keeps its own content clear of the messages.
- **Focus.** A focused message that leaves hands focus to the next message's close button, else back to where focus
  came from into the region, else to the view (`.ds-view` with `tabindex="-1"`), never to `<body>`.
- **Screen readers.** The region and the messages are not live regions, so their buttons stay usable. On first use
  `toast()` adds two `.ds-sr` live regions next to the region (polite, and assertive for errors) and writes each
  message's text there; it takes `role` and `aria-live` off the region and off the messages (once, and owned).
  `DS.overlay.announce(text, { assertive, region })` writes a text through the same announcers without a message
  (a result that a busy button only shows, a filter count): the same text twice is said twice, empty text nothing.
  While a dialog or side sheet is open, the announcers sit inside it with the region, so it is heard there.
- **Dialogs and side sheets.** While a dialog or side sheet is open (`DS.overlay.open()`), the regions of its theme
  (not one inside a nested `.ds-theme`, an embedded widget's: it stays in its widget) move into it, so a message shown
  meanwhile (an error from the dialog's action) is above the scrim, announced and usable: in the top layer of a
  native one, outside the inert page of the div markup. In a sheet the messages glide with the panel's edge and rise
  above its `.ds-sheet__foot` (`data-follow="enter"` and `"exit"` time the glide like the sheet); in a dialog they
  keep their place. Closing brings them back: they glide to their place while still inside the leaving dialog or
  sheet (so they stay above its scrim and panel through the exit) and return to the page once it ended. The modal
  drawer leaves the regions and their announcers usable where they are; on phones they rise above its
  `.ds-drawer__foot`. A region placed inside another element of the page (not next to `.ds-app`) is inert under a div
  dialog that does not take it in, so keep it in the documented place.
- **Above bars.** A shown [save bar](#save-bar) lifts the messages above itself. `--ds-toast-lift` is the region's
  runtime rise that `DS.overlay` writes (a sheet's foot, the drawer's foot, the save bar); the messages glide on both
  axes (`--ds-toast-shift`, `--ds-toast-shift-y`, written by `DS.overlay` only). The on-screen keyboard raises them by
  `--ds-keyboard-inset` (written by `DS.dom.followViewport()`). Another bar of your own pinned to the bottom edge:
  set `--ds-toast-bottom` on the region to its height plus a gap while it shows.
- **View transitions.** While `DS.motion.transition()` runs, a region with messages is its own group
  (`ds-toasts`, [motion.md](motion.md#view-transitions)): a message stays on screen and still above the changing
  view, and glides with the panel's edge when the view shows or hides the drawer. Keep one region with messages per
  page: `transition()` lifts the name of a further one, which then crossfades with the page.
- `.ds-toast--info` uses the plain text colour for its icon, like `--error`. `.ds-toast--shown` is runtime state:
  `toast()` marks a message whose entrance has played, so a region that moves never replays it.
- Hooks: `--ds-toast-action-color`, `--ds-toast-close-size` (the close button, 36px), `--ds-toast-radius`
  ([theming.md](theming.md#component-hooks)).
- **Removed in 2.0:** the region with `role="status" aria-live="polite"` and `role="alert"` on messages (`toast()` now
  takes the attributes off and announces once: use `<div class="ds-toasts"></div>`); showing messages by hand with
  `setTimeout(() => DS.motion.leave(toast), 4000)` (`toast()` times them); the hand recipe that moved messages into a
  side sheet with a page-set `--ds-toast-shift` (`DS.overlay.open(sheet)` moves and glides the region).

### Keyboard and forced colours

- Keyboard: a message's buttons are in the tab order, where the region sits; focus inside pauses its timer. It never
  takes focus by itself, and an error is announced, not focused.
- Forced colours: a message's transparent outline becomes its edge.

**JS API.** `js/toast.js` (`DS.toast`): `toast(region, content, options)`, `closeToasts(region, filter)`, `announce(text, options)` and `toastRegion(doc)`, the same functions as under `DS.overlay`.

**Motion:** the "Snackbar" row of [Overlays](motion.md#overlays) in motion.md.
## Tooltip

A short text that names an icon button or explains a control, on hover and on focus.

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">[icon link 20]</button>
<td><a href="#device-42" data-tip="LAPTOP-0042-FINANCE-BACKUP">LAPTOP-0042-FINANCE-BACKUP</a></td>   <!-- shows only while cut off -->
<button class="ds-btn" type="button" data-tip="Search the list" data-tip-shortcut="Ctrl K">Search</button>   <!-- the shortcut slot -->
```

```js
const tips = DS.overlay.tooltips(document);   // one call per page (or per root element or shadow root); tips.destroy() undoes it
```

| Option | Where it applies | Effect |
|---|---|---|
| `data-tip-shortcut` | the trigger | the shortcut slot: `.ds-tooltip__shortcut` after the text, in the code face; the tip then shows also when its text repeats the trigger's |
| `.ds-shape-*` | the theme | multiplies the radius (`--ds-tooltip-radius`) |
| Size, density, tone | none | one tooltip serves the whole theme, whatever its trigger's size, and it shows no status |

`tooltips(root)` serves every `[data-tip]` inside `root` with one `<div class="ds-tooltip" role="tooltip">` that it
creates inside the `.ds-theme` (it warns once when `root` has none). A second call on the same root returns the first
handle; a trigger inside nested roots (a host page's `document` and a widget's root) is served by the innermost one:

- **Delay.** A mouse or pen that rests on a trigger shows the tooltip after `--ds-delay-tooltip` (500ms); keyboard
  focus (`:focus-visible`) shows it at once.
- **On touch screens.** A tap on an image (`role="img"`, a status icon, an avatar) or a blocked control
  (`aria-disabled="true"`, so the reason reaches a finger) shows its tooltip at once; a second tap hides it. Any other
  trigger shows it after a long press of `--ds-delay-tooltip`, and the click and context menu that the press would
  end in never happen; a link keeps its own long press (the browser's menu). It stays until the next touch, a scroll
  or Escape: no timeout (WCAG 1.4.13). A press that moves more than 10px is a scroll, not a tap.
- **Repeats the visible text.** A tip that says what the trigger already shows (a name in a narrow column, with the
  full name as its tip) shows only while that text is cut off: the trigger, one of its first 24 descendants or one
  of up to three ancestors that hold just its text (the `td` around a link) clips it (`overflow` other than
  `visible` and more content than room). Such a tip never describes the trigger. A tip that adds something always
  shows: an icon button, a label hidden on phones (`.ds-sr`, `aria-hidden`, or a 1×1px box), a collapsed rail. No
  attribute is needed for either: plain `data-tip` decides by itself.
- **Warm-up.** While a tooltip is visible, or within `--ds-delay-tooltip-skip` (300ms) of the last hide, the next
  trigger shows at once: a visible tooltip swaps its text and place without leaving, a hidden one only fades in.
- **Hoverable and persistent** (WCAG 1.4.13). It hides `--ds-delay-tooltip-hide` (100ms) after the pointer or focus
  left the trigger; the pointer may cross onto the tooltip meanwhile, and it stays while the pointer is on it or the
  trigger keeps keyboard focus.
- **Dismissable.** Escape hides it, and only then is the key the tooltip's (an open dialog under it stays open),
  unless an open layer lies over its trigger (a menu over the toolbar whose button shows a tip): then the same Escape
  hides the tip and closes that layer (2.1.1). Any pointerdown, `DS.overlay.open()` and a trigger scrolled out of view
  hide it too; a trigger that leaves the document (a re-render, a closed message) takes its tooltip with it at once.
  The opener of an open layer (a menu button while its menu shows) shows no tip at all (2.1.1).
- **Description.** While it shows, the trigger gets `aria-describedby` pointing at it, unless the trigger's accessible
  name already says the same (an icon button whose `aria-label` equals the tip is not described twice).
- **Placement.** Below the trigger and centred on it, above it when there is no room, 8px from the viewport edges.
  Where popover and CSS anchor positioning exist, the tooltip is a `popover="manual"` in the top layer, anchored to
  the trigger (`data-anchored`); elsewhere the script writes `--ds-tooltip-x` and `--ds-tooltip-y` and sets
  `data-placement="top"` above. It fades in and grows from `--ds-scale-tooltip` at the side of the trigger, and
  leaves with a quick fade.
- On a [switch](#switch) the `data-tip` goes on its input, which covers the track.

Placing a `.ds-tooltip` yourself: set `--ds-tooltip-x` and `--ds-tooltip-y` (or `top` and `left`) on it, remove
`hidden` (the entrance plays) and hide it with `DS.motion.leave(tip, '', { then: 'hide' })`. A `transform` placement
composes with the entrance, but its scale shrinks the offset too, so the tooltip drifts in by (1 - scale) × offset;
a script that keeps a `transform: translate(Xpx, Ypx)` also sets `transform-origin: calc(50% + Xpx) calc(50% + Ypx)`.

- **Keyboard and names.** Keyboard focus shows it at once, Escape hides it; it never takes focus. The element is
  `role="tooltip"`, and the trigger's `aria-describedby` points at it while it shows, as above.
- **Forced colours.** Its transparent outline becomes its edge.

**JS API.** `js/tooltip.js` (`DS.tooltip`): `tooltips(root)`, the same function as `DS.overlay.tooltips()`; `DS.init()` serves every root it initialises.

**Motion:** the "Tooltip" and "Tooltip warm-up" rows of [Overlays](motion.md#overlays) in motion.md.
## Save bar

A bar with the unsaved edits of a view and the actions that save or discard them, or the actions of a long form kept in
reach.

```html
<main class="ds-view" id="main" tabindex="-1">
  <div class="ds-content"> ... </div>
  <div class="ds-savebar">
    <div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>
      <p class="ds-savebar__text">2 unsaved changes</p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button">Discard</button>
        <button class="ds-btn ds-btn--filled" type="button"><span class="ds-btn__faces"> ... </span></button>   <!-- the faces of Button -->
      </div>
    </div>
  </div>
</main>
```

```js
const bar = DS.overlay.savebar(document.querySelector('.ds-savebar'), { focusTarget: () => form.querySelector('input') });
form.addEventListener('input', () => bar.show());
discard.addEventListener('click', () => { form.reset(); bar.hide(); });
bar.update(() => { text.textContent = `${count} unsaved changes`; });   // after the exit while it leaves
```

Unsaved edits of a view, saved or discarded together. The `.ds-savebar` is the last child of the `.ds-view`, after
`.ds-content`: sticky at the view's bottom, it takes no room (height 0); its bar floats `--ds-savebar-offset` (16px)
above the view's bottom edge, in the page column (the view's side pad, `--ds-content-pad-x`, at most
`--ds-content-max` wide), text first, the actions at the end, wrapping on narrow views. It shows and hides as a
`.ds-presence`: it fades in and grows from `--ds-scale-enter` at its bottom edge on the spring, leaves faster, and a
toggle mid-way continues from where it is.

`DS.overlay.savebar(element, { focusTarget })` returns `{ element, show(), hide(), update(fn), shown, destroy() }`,
one controller per element (`.ds-savebar` or its `.ds-savebar__bar`):

- `show()` removes `hidden`, measures the bar (`--ds-savebar-height` on the view) and sets `data-ds-savebar` on the
  `.ds-view`: its `scroll-padding-bottom` and the content's bottom padding (at least `--ds-content-pad-bottom`) keep
  the bar's height, offset and `--ds-space-2` free, so the last field scrolls above the bar and the focused element
  scrolls clear of it at once (WCAG 2.4.11). The snackbars of its theme on the page rise above it
  (`--ds-toast-lift`, [Snackbar](#snackbar)); while it shows, the room of the messages that stay
  (`--ds-toast-reserve`) is kept by the content's bottom padding, not the view's, so the bar stays at the view's
  bottom. A `ResizeObserver` measures again while it shows.
- `hide()` moves focus inside the bar to `focusTarget()` (else the view), makes the bar inert while it leaves and
  sets `hidden`; the snackbars glide back down. Hidden while the view was at its end, the room stays
  (`data-ds-savebar-rest`) until the page scrolls away from the end, so nothing jumps.
- `update(fn)` runs `fn` at once, or after the exit while the bar is leaving (the count changes only once it is gone).
- Everything it writes is owned, so `DS.dom.morphHtml` keeps it. Outside a `.ds-view` it warns once and only shows and
  hides.
- Busy save: put the faces in the primary button and run it with `DS.motion.busy()` ([Button](#button)); hide the bar
  when it resolves and say the result with a snackbar.

**In the flow** (`.ds-savebar--inline`): the actions of a long form that is not in a card stay in reach at every width.
The last child of the form, it takes the room of its bar and sticks to the bottom of the scroller while the form is on
screen: a flat surface with a static hairline that runs to the edges of the page (`--ds-savebar-bleed`, default
`--ds-content-pad-x`; in a padded container of the page's own set it to that padding) and keeps clear of the home
indicator. No script and no `DS.overlay.savebar()`: it always shows, or the page sets `hidden` on the bar.

With no script to measure it, its room comes from CSS: its least height at the largest size and a row for the words it
wraps over the actions, wherever the size is set. A `.ds-view` keeps that room in its `scroll-padding-block-end`, so a focused field scrolls clear of the bar; a
scroller of the page's own takes `.ds-savebar-scroller` for the same (WCAG 2.4.11). Snackbars of the theme rise by the
same room. A bar taller than that (a long text on a phone) sets `--ds-savebar-room` on the scroller or a container of
both.

`.ds-form-actions--sticky` ([Form](#form)) is the same on phones only and an ordinary row above; take this one where
the wide layout needs it too, or where a line of text goes with the actions.

```html
<form class="ds-form"> ...                       <!-- in a .ds-view, or in a .ds-savebar-scroller of the page's own -->
  <div class="ds-savebar ds-savebar--inline">
    <div class="ds-savebar__bar" role="group" aria-label="Form actions">
      <p class="ds-savebar__text">Changes apply after a restart</p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button">Cancel</button>
        <button class="ds-btn ds-btn--filled" type="submit">Save</button>
      </div>
    </div>
  </div>
</form>
```

**Options** ([options.md](options.md)): classes on the bar or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the bar |
|---|---|---|---|
| Variant | `--inline` | the `.ds-savebar` | in the flow, flat, at every width |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the bar or a container | the least height 8px per step (40 to 72px); its buttons take the same size from the same class |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the least height 4px less per step, the block padding 2px less per step; side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the floating bar's radius times 0, .5, 1, 1.5; its buttons follow by themselves |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high; its buttons take the minimum too |
| Tone | none | | the bar shows no status of its own; say the result of a save with a snackbar |

**Keyboard and names.** A floating bar is a `role="region"` with an `aria-label` ("Unsaved changes"), the bar in the flow
a `role="group"`. Tab reaches its buttons after the view's content; a focused element the bar would cover scrolls clear
of it (in the flow: inside a `.ds-view` or a `.ds-savebar-scroller`), and `hide()` moves focus from inside it to
`focusTarget()` (else the view), so focus is never lost.

**Forced colours.** The floating bar keeps an edge (its transparent outline); the bar in the flow keeps its hairline; its
buttons are the system's.

**Hooks:** `--ds-savebar-offset`, `--ds-savebar-inset` (from the view's sides instead of the page column),
`--ds-savebar-min-height` (the base of its least height, 56px), `--ds-savebar-radius` (`--ds-radius-card`, times the
shape), `--ds-savebar-bg` (`--ds-surface-popover`; in the flow `--ds-surface`), `--ds-savebar-shadow`
(`--ds-elev-overlay`), `--ds-savebar-bleed` and `--ds-savebar-room` (in the flow)
([theming.md](theming.md#component-hooks)). The attributes
`data-ds-savebar`, `data-ds-savebar-rest` and `data-toast-reserve` are the system's. Print: hidden.

**Motion:** the "Save bar" row of [Feedback](motion.md#feedback) in motion.md.
## Loading

Holds the place of content that is loading: the app start, a loading line, skeleton presets and the page's load bar.

```html
<div class="ds-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Loading ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Importing devices
  <p class="ds-loading__detail">812 of 2,030 rows</p></div>                       <!-- a detail line under the text -->

<div class="ds-skeleton" role="status">
  <span class="ds-sr">Loading ...</span>
  <span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>
  <span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span>
  <span class="ds-skeleton__line ds-skeleton__line--lead" aria-hidden="true"></span>
  <p class="ds-skeleton__note">Loading 3 of 12 reports</p>                        <!-- optional progress line -->
  <div class="ds-skeleton__card">
    <span class="ds-skeleton__line ds-skeleton__line--title"></span>
    <span class="ds-skeleton__line"></span>
    <span class="ds-skeleton__line ds-skeleton__line--short"></span>
    <span class="ds-skeleton__line ds-skeleton__line--mid"></span>
  </div>
</div>
```

Every loader except the bare arc [spinner](#spinner) fades in only after `--ds-delay-loader` (`.ds-boot` after
`--ds-delay-boot`), so fast loads show nothing; keep a visible one up with
`DS.motion.settleLoader(startedAt, { element })`. Delays never stack: a [shape loader](#shape-loader) inside `.ds-boot`,
`.ds-loading` or `.ds-skeleton`, and a loading bar inside a skeleton, have no fade of their own.

**Skeleton presets.** A preset is markup: bones inside a `.ds-skeleton` surface, which holds the role and the words. Mark
the bones `aria-hidden` or leave the whole surface's words in its `.ds-sr`.

| Preset | Markup |
|---|---|
| Text | `.ds-skeleton__line`, with `--mid`, `--short` for shorter lines |
| Heading | `.ds-skeleton__line--heading`, `--lead` (its lead), `--title` (a card title) |
| Avatar | `.ds-skeleton__avatar`: a round bone, 40px at md |
| Media | `.ds-skeleton__media`: a block bone, its ratio `--ds-skeleton-media-ratio` |
| List row | `.ds-skeleton__row` below |
| Table | `.ds-skeleton__table` below |
| Card | `.ds-skeleton__card` above |
| Form | `.ds-skeleton__form` below |

```html
<div class="ds-skeleton" role="status"><span class="ds-sr">Loading devices ...</span>
  <div class="ds-skeleton__row" aria-hidden="true">
    <span class="ds-skeleton__avatar"></span>
    <span class="ds-skeleton__lines"><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></span>
    <span class="ds-skeleton__line"></span>
  </div>
</div>

<div class="ds-skeleton" role="status"><span class="ds-sr">Loading the table ...</span>
  <div class="ds-skeleton__table" aria-hidden="true">
    <div class="ds-skeleton__cells ds-skeleton__cells--head"><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div>
    <div class="ds-skeleton__cells"><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div>
  </div>
</div>

<div class="ds-skeleton" role="status"><span class="ds-sr">Loading the form ...</span>
  <div class="ds-skeleton__form" aria-hidden="true">
    <span class="ds-skeleton__line ds-skeleton__line--label"></span><span class="ds-skeleton__field"></span>
    <span class="ds-skeleton__line ds-skeleton__line--label"></span><span class="ds-skeleton__field"></span>
  </div>
</div>
```

**The wave or the pulse.** By default one calm diagonal wave passes over the whole surface, after its entrance; add
`.ds-skeleton--pulse` to the surface and each bone breathes in place instead, on `--ds-loop-skeleton` and after the same
delay (a small card among finished ones, a long table where a sweep would draw the eye).

**Options** ([options.md](options.md)): classes on the element or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | a bone or a group | a line 2px per step (and a heading, a title); an avatar, a field and a row 8px per step; a loader follows its own steps |
| Density | `.ds-density-*` | any container | the padding of `.ds-loading` and a card, and the gaps of a surface, 2px per step (under `themes/compact.css`: 12px and 20px); a field and a row 4px per step, on the hooks of what they stand for (`--ds-input-height`, `--ds-table-row-height`, `--ds-table-head-height`) |
| Shape | `.ds-shape-*` | any container or the theme | a bone's radius and a card's corners times 0, .5, 1, 1.5, at most half a bone's height; an avatar stays round |
| Touch | `.ds-touch` | the theme or a container | a field bone and a table row are as high as what they stand for; the rest is no target |
| Tone | | | not read: nothing here says more than "wait" |

- **Skeleton**: every bone shows its slice of one band fixed to the viewport (the registered `--ds-skeleton-x`), so the
  bones of a surface share one phase. Since 2.0 each bone clips the band to its own shape and the band moves on a
  compositor layer of its own (a fixed `::after`, moved by `translate`), so the wave repaints nothing; before, a fixed
  background was repainted with the whole view. Under a transformed ancestor (a sheet mid-slide, `.ds-enter`) the band
  is placed in that ancestor instead of the viewport: the bones stay in time and share it.
- **Loading line** (`.ds-loading`): the loader, then the text, in one row (inline markup in the text or a trailing
  button stays on it). With `.ds-loading__detail` lines (2.0) it becomes a two-column grid: the lines sit under the
  text in its column (`--ds-font-meta`, `--ds-text-2`), aligned with it whatever the loader's size; keep the text one
  run (or one element) there, since each piece of it takes a cell.
- **Skeleton note** (`p.ds-skeleton__note`, 2.0): a progress line under the lead bone ("Loading 3 of 12 reports",
  `--ds-font-meta` in `--ds-text-2`, tabular figures); it sits inside the `role="status"` skeleton, so its text is
  announced: update it at most every 10% or once a second. Empty, it takes no room. The bones' corners follow
  `--ds-skeleton-radius` (2.0; default `--ds-radius-action`, the heading line and a field `--ds-radius-sm`, a media bone
  `--ds-radius-card`).
- **Loading bar** (`.ds-loadbar`): the two-segment indeterminate choreography, flat, at the top of the content
  panel (inside `.ds-content`, whose read-only `--ds-content-pad-top` and `--ds-content-pad-x` it reads to reach the
  panel edges; inside `.ds-page` it also spans the page's centring, measured as `100cqw` of `.ds-content`, so it
  reaches the edges at any panel width; the view's scroll hairline hides while it is there). Put the bar, or the
  skeleton that holds it, directly in `.ds-content` or `.ds-page`, with no other size container in between. `DS.motion.refresh(content, load)`
  (2.0) is the refresh pattern as one call: it puts `.ds-stale` and the bar in, waits for `load()` and the loader
  hold, and takes both away before it resolves with the data. By hand, the refresh pattern: put `.ds-stale` on the content
  and insert the loading bar; when the data arrives, `await DS.motion.settleLoader(startedAt, { element: loadbar })`,
  then `DS.motion.leave(loadbar)` (it fades out with its segments still moving, and is removed) and render the fresh
  content. `.ds-leave` keeps the loops of a loading bar and of a skeleton surface while they fade out.
- **Paint cost** (measured by `test/browser/perf.spec.js`, budget: the p95 frame within 33ms, two frames at 60Hz,
  at 4x CPU throttling): 50 table rows of wavy progress with four shape loaders and a skeleton surface stay within
  it. The skeleton's band moves on its own compositor layer (2.0), so its wave repaints nothing; before 2.0 it was
  a fixed background, repainted with the whole view on every step, and a skeleton had to wait alone. Show a
  skeleton only while a page loads its first data; for a refresh use `.ds-stale` and the loading bar.
  Keep shape loaders to a few per view, and use `.ds-progress--flat` in dense table cells (the wave reaches outside
  the 4px track).

**Accessibility.** The surface or line holds `role="status"` and the words (`.ds-sr` in a skeleton); the bones and the
loader say nothing. Keyboard: no stop of its own. **Forced colours.** The fills go: bones and the bar's track take a
`CanvasText` outline and the band is left out, both segments of the bar paint `Highlight`. Print: the band and the
loading bar are left out.

**Motion:** the loader and skeleton rows of [Feedback](motion.md#feedback) in motion.md.
## Spinner

The inline loader: the M3 arc that grows and shrinks while it turns, without a track, for buttons, chips, status chips
and table cells. A known share is the same component as a ring.

```html
<span class="ds-spinner" aria-hidden="true"></span>                     <!-- 16px, on a surface -->
<span class="ds-spinner ds-spinner--ink ds-sm" aria-hidden="true"></span>  <!-- 12px, the text colour on a faint ring: in a button or chip -->
<span class="ds-spinner ds-spinner--determinate" role="progressbar" aria-label="Upload"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" style="--ds-progress: .4"></span>   <!-- a ring, 40px -->
<span class="ds-spinner ds-spinner--determinate ds-spinner--flat" role="progressbar" aria-label="Upload"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" style="--ds-progress: .4"></span>   <!-- a plain ring -->
```

**Options** ([options.md](options.md)): classes on the spinner or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the spinner |
|---|---|---|---|
| Variant | `--ink`, `--determinate`, `--flat` (with `--determinate`) | the spinner | the text colour on a faint ring; a share as a ring; a ring without its wave |
| Size | `.ds-xs` ... `.ds-xl` | the spinner or a group | 4px per step, at least 10px (10, 12, 16, 20, 24px); the ring 8px per step (24 to 56px), its width a tenth of its size |
| Tone | `.ds-tone-*` | the spinner itself; an inherited tone is ignored | the arc in the tone, a ring's track in the tone's container; a share in a tone needs its word next to it |
| Density, shape, touch | | | not read: a spinner is round, no target, and its size follows the size step alone |

- `.ds-spinner--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-spinner--ink` with `.ds-sm`, the same look.
  Until then it keeps its fixed 12px at any size.
- Show it only after `--ds-delay-loader`, so fast loads never flash it: delay it through `.ds-loading`, a busy button or
  `<span class="ds-enter ds-enter--delayed">`. Never put `.ds-enter` on it in static markup (wrap it); it would replace
  the arc and the turn while it runs. A block of the page that waits shows the [shape loader](#shape-loader) instead.
- **Circular progress** (`.ds-spinner--determinate`): the share as an arc, a gap, then the track in `--ds-accent`, on a
  wavy ring (`.ds-spinner--flat`: a plain ring). It never spins; set `--ds-progress` (0 to 1) and the arc glides like
  linear progress. Markup as for [progress](#progress): `role="progressbar"`, `aria-valuemin`, `aria-valuemax`,
  `aria-valuenow`, a name. Inside `.ds-progress` it reads the share of its parent and lands with the bar.
- Hooks ([theming.md](theming.md#component-hooks)): `--ds-spinner-size` (16px), `--ds-spinner-determinate-size` (40px),
  the md bases; `--ds-spinner-color`, `--ds-spinner-track` (none; `--ink` a faint ring of the text colour; a ring
  `--ds-accent`), `--ds-spinner-width` (2px; replaces a project's own `border-width`), `--ds-spinner-determinate-width`
  (a tenth of its size).

**Accessibility.** The turning arc is decoration: `aria-hidden`, and a `role="status"` around it (or the busy control)
carries the words. A ring is a `role="progressbar"` with a name. It is no stop of its own.

**Forced colours.** The arc is painted `Highlight` and the track `GrayText`, in any tone. Print: both keep their colours,
so a status chip keeps its glyph and a ring its share.

**Motion:** the loader rows of [Feedback](motion.md#feedback) in motion.md: the arc (`ds-spinner-arc`, `--ds-loop-arc`)
and the turn (`ds-spin`, `--ds-loop-spin`) always run at their token speed.
## Shape loader

The block loader of the system: a shape morphs through the seven M3 shapes, each step landing on the spring, while it
turns. For a section, a sheet or the app start; a small spot keeps the [spinner](#spinner).

```html
<span class="ds-loader" aria-hidden="true"></span>                       <!-- 48px -->
<span class="ds-loader ds-sm" aria-hidden="true"></span>                 <!-- 24px, the loading line's -->
<span class="ds-loader ds-loader--contained" aria-hidden="true"></span>  <!-- on a tinted disc -->
```

**Options** ([options.md](options.md)): classes on the loader or any ancestor.

| Option | Classes | Where it applies | Effect on the loader |
|---|---|---|---|
| Variant | `--contained` | the loader | the shape on a `--ds-accent` disc |
| Size | `.ds-xs` ... `.ds-xl` | the loader or a group | 24px per step, at least 16px (16, 24, 48, 72, 96px); the shape is 38/48 of it |
| Density, shape, tone, touch | | | not read: it morphs through its own shapes, it is no target and it says nothing but "wait" |

- `.ds-loader--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-sm`, the same 24px. `--ds-loader-sm-size`, read
  only by it, is **deprecated** with it: `--ds-loader-size` is the md base.
- It is decoration: `aria-hidden`, and the surrounding `role="status"` carries the text ([Loading](#loading)). Keep it
  to a few per view: the morph repaints every frame.
- It fades in after `--ds-delay-loader`; inside `.ds-boot`, `.ds-loading` or `.ds-skeleton` the container waits instead,
  and the delays never stack. `.ds-enter` on a `.ds-loader` is fine, its loops run on `::before`. The older markup with
  a `.ds-spinner` in `.ds-boot` or `.ds-loading` keeps working.
- Hooks ([theming.md](theming.md#component-hooks)): `--ds-loader-size` (48px), `--ds-loader-color` (`--ds-primary`).

**Keyboard.** None: it is no stop of its own. **Forced colours.** The shape in `Highlight`, the contained disc as a
`CanvasText` outline. Print: the shape is not printed, its label is.

**Motion:** the loader rows of [Feedback](motion.md#feedback) in motion.md: `ds-loader-morph` and `ds-loader-turn` on
`--ds-loop-loader`, always at their token speed.
## Progress

Shows how far a known or unknown amount of work has come.

```html
<div class="ds-progress" style="--ds-progress: .4">
  <div class="ds-progress__track" role="progressbar" aria-label="Import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40">
    <div class="ds-progress__bar"></div>
  </div>
  <p class="ds-progress__label">40%</p>
  <p class="ds-progress__detail">812 of 2,030 rows</p>
</div>
```

`--ds-progress` (0 to 1) sets the share (set it with `el.style.setProperty`, which a strict CSP allows). It is a
registered number that glides on `--ds-ease-value` over `--ds-dur-glide`: the bar, the remaining track and a
nested `.ds-spinner--determinate` land together, and on the same frame as a `DS.motion.countUp()` figure set in the
same task. The bar is cut at the share (a clip, never a scale), so its round cap keeps its shape at any share.

**Options** ([options.md](options.md)): classes on the progress or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the progress |
|---|---|---|---|
| Variant | `--flat`, `--indeterminate`, `--waiting` | the progress | below |
| Label | `.ds-progress--label-above`, `.ds-progress--label-end`; none: under the track | the progress | where `.ds-progress__label` sits: over the track, or at its end in one row. `.ds-progress__detail` stays under the track |
| Size | `.ds-xs` ... `.ds-xl` | the progress or a group | the track's thickness, 2px per step (1, 2, 4, 6, 8px); the wave's height follows, its wavelength stays; type stays |
| Density | `.ds-density-*` | any container | the label's distance from the track, 2px per step (4px under `themes/compact.css`) |
| Shape | `.ds-shape-*` | any container or the theme | the ends of the bar and the track times 0, .5, 1, 1.5, at most half the height; the stop dot stays a dot |
| Tone | `.ds-tone-*` | the progress itself; an inherited tone is ignored | the bar and the stop dot in the tone, the remaining track in its container; the label says what it means ("Disk almost full"), never the colour alone |
| Touch | | | not read: progress is no target |

```html
<div class="ds-progress ds-progress--label-end ds-tone-warning ds-lg" style="--ds-progress: .92">
  <div class="ds-progress__track" role="progressbar" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="92"><div class="ds-progress__bar"></div></div>
  <p class="ds-progress__label">92%, almost full</p>
</div>
```

- **The 2024 look** (the default): the bar ends at the share, a gap (`--ds-progress-gap`, 4px) follows, then the
  remaining track (`--ds-progress-track`, `--ds-accent`) with a stop dot at its end (`--ds-progress-stop`,
  `--ds-primary`). The bar (`--ds-progress-bar`, `--ds-primary`) is wavy and its wave travels; at `aria-valuenow="100"`
  (with the documented `aria-valuemax="100"`) the wave stops and the flat bar fades in. `--ds-progress-height` (4px) is
  the md base of the track.
- **`.ds-progress--flat`**: the classic look, no gap, no dot, no wave. Use it in dense table cells: the wave reaches
  3px above and below the 4px track, and an ancestor with `overflow: hidden` closer than that clips it.
- **`.ds-progress--indeterminate`**: two segments run across the track (the M3 choreography). When the modifier
  drops, set the first share in the same task: the segments stop and fade out, the bar fades in and grows from 0 to
  its share (it never sweeps across or shrinks from 100%). A share set earlier, while indeterminate, simply
  appears at that share.
- **`.ds-progress--waiting`** hides the track and keeps the labels. The track keeps its height, so the label stays put
  when the wait ends, and fades in over `--ds-dur-fast`.
- **Accessibility**: while `--indeterminate` or `--waiting` is on, the share is unknown: remove `aria-valuenow` and
  set `aria-valuetext` ("Preparing", "Waiting"). With the first share, set `aria-valuenow` again and remove
  `aria-valuetext`. `DS.dom.progress(el, share, { valueText, waiting })` (2.0,
  [motion.md](motion.md#dsdom-jsdomjs)) does all of it in one call, on a `.ds-progress`, a determinate spinner or a
  meter; set the share there or in the template, not both:

```js
DS.dom.progress(progress, null, { valueText: 'Preparing' });   // --indeterminate, no aria-valuenow
DS.dom.progress(progress, 0.3);                                  // the bar grows to 30%, aria-valuenow="30"
DS.motion.countUp(label, 30, { format: (value) => `${Math.round(value)}%` });   // lands on the same frame
```

**Keyboard.** None: progress is no stop of its own. **Forced colours.** The bar, its segments and the stop dot paint
`Highlight`, the remaining track `GrayText`, and the track keeps a `CanvasText` edge, in any tone; the label carries the
meaning. Print: the bar keeps its colours, so the share shows on paper.

**Motion:** the "Progress" row of [Feedback](motion.md#feedback) in motion.md.
## Charts

Meters, columns and legends, drawn from the chart roles ([tokens.md](tokens.md#chart-colours)): `--ds-chart-1` to
`--ds-chart-4` (four series in a fixed order), `--ds-chart-neutral`, `--ds-chart-track`, `--ds-chart-warning` and
`--ds-chart-error`.

```html
<span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="78" aria-valuetext="78% used"></span>

<figure class="ds-columns">
  <figcaption class="ds-sr">Devices that checked in, per day</figcaption>
  <ol class="ds-columns__plot">
    <li class="ds-columns__col">
      <span class="ds-columns__value">42</span>
      <span class="ds-columns__fill" aria-hidden="true"></span>
      <span class="ds-columns__label">Mon</span>
    </li>
    <li><button class="ds-columns__col ds-columns__col--s2" type="button" aria-label="Tuesday: 38 devices"> ... </button></li>
  </ol>
</figure>

<figure class="ds-columns ds-columns--mini" role="img" aria-label="Tickets per day, last 14 days: highest 12 today">
  <ol class="ds-columns__plot" aria-hidden="true"><li class="ds-columns__col"><span class="ds-columns__fill"></span></li> ... <li class="ds-columns__col ds-columns__col--highlight"><span class="ds-columns__fill"></span></li></ol>
</figure>

<figure class="ds-columns ds-columns--grouped">
  <figcaption class="ds-sr">Tickets opened and closed per week</figcaption>
  <div class="ds-scroll-x" tabindex="0" role="group" aria-label="Tickets per week">
    <ol class="ds-columns__groups">
      <li class="ds-columns__group">
        <ol class="ds-columns__plot">
          <li class="ds-columns__col"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Opened: 12</span></li>
          <li class="ds-columns__col ds-columns__col--s2"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Closed: 9</span></li>
        </ol>
        <span class="ds-columns__label">W41</span>
      </li>
      <li class="ds-columns__group ds-columns__group--current"> ... <span class="ds-columns__label">W42<span class="ds-sr">, this week</span></span></li>
    </ol>
  </div>
</figure>

<ul class="ds-legend">
  <li><span class="ds-legend__key"></span>Opened</li>
  <li><span class="ds-legend__key ds-legend__key--s2"></span>Closed</li>
</ul>
```

- **The share**: `--ds-share` (0 to 1, a registered number) on each mark (the meter, each column), set with
  `el.style.setProperty('--ds-share', share)` (a strict CSP allows it) or `DS.dom.progress()`. The fill is clipped at
  the share, never scaled, so its round data end keeps its shape at any value; a new value glides there on
  `--ds-ease-value` over `--ds-dur-glide`, and a column's value rides on the top of its fill. It is not
  `--ds-progress`, which drives the whole progress choreography. On the first render the marks fill from zero:
  `DS.motion.enterAll(marks, 'fill', { stagger: false })` (`.ds-enter--fill`); later values transition.
- `.ds-meter`: a bar `--ds-meter-height` (4px) high on `--ds-meter-track` (`--ds-chart-track`), the fill in
  `--ds-meter-color` (`--ds-chart-1`). A tone on the meter itself (`.ds-tone-warning` ...; always with words next to
  it): `neutral`, `warning` and `error` take their chart roles, the others the tone. A meter with its own figure is `role="meter"` with `aria-valuenow` and `aria-valuetext`; next to a
  figure in text (`.ds-kv-list--bars`) it is `aria-hidden`.
- `.ds-columns`: a `<figure>` with a caption and an `ol.ds-columns__plot` of `.ds-columns__col`, each with
  `.ds-columns__value`, `.ds-columns__fill` and `.ds-columns__label`, `--ds-columns-height` (120px) high, the data
  end rounded by `--ds-columns-radius` (`--ds-radius-xs`). Series `.ds-columns__col--s2`, `.ds-columns__col--s3`,
  `.ds-columns__col--s4` and a tone on the column itself (`.ds-tone-warning` ...) set `--ds-chart-color`. A column that opens its category is a `<button>` or `<a>` with the
  class inside a plain `<li>`: a state layer, an inset ring, the ripple, no morph.
- `.ds-columns--mini`: a 32px sparkline beside a figure, no labels or values, the columns `aria-hidden` and the figure
  `role="img"` with a summary; `.ds-columns__col--highlight` takes `--ds-chart-1`, the rest `--ds-chart-neutral`.
  Inside a clickable [tile](#tiles) its parts are `<span>`s.
- `.ds-columns--grouped`: `.ds-columns__groups` of `.ds-columns__group` (at least `--ds-columns-group-min`, 56px,
  each), its columns 2px apart and its label under the group; `.ds-columns__group--current` lies on a band of
  `--ds-surface-low` with its label in the label weight and a `.ds-sr` word. Put it in a `.ds-scroll-x` when it may
  be wider than its card.
- `.ds-legend`: keys of `--ds-legend-key-size` (12px) in the meta font; `.ds-legend__key--s2`, `.ds-legend__key--s3`,
  `.ds-legend__key--s4`, or a tone on the key itself.
- `.ds-meter--neutral`, `.ds-meter--warning`, `.ds-meter--error`, `.ds-columns__col--warning`,
  `.ds-columns__col--error`, `.ds-legend__key--neutral`, `.ds-legend__key--warning` and `.ds-legend__key--error` are
  **deprecated** (3.0, removed when 3.0 ships): `.ds-tone-neutral`, `.ds-tone-warning`, `.ds-tone-error`, the same
  colours.
- **Colours**: the series in their fixed order, never cycled; at most four, more fold into "Other"; the tones only on
  single-series marks; text never takes a series colour. A theme that changes the roles keeps each at 3:1 on
  `--ds-surface`, `--ds-surface-low` and `--ds-chart-track`, and adjacent series apart for colour-blind readers. In
  forced colours the fills take `CanvasText` (`--ds-chart-forced-ink` where a component lays them on a system fill of
  its own), series 2 to 4 a hatching of their own (45, 135 and 90 degrees), as do the legend keys.
- **Accessibility**: every chart has a text equivalent: its caption plus a table or a key-value list, or the values
  as text.
- **When to draw your own**: lines, areas, scatter plots and stacked bars are the project's, with the chart roles and
  `--ds-share`.

### Options

On the mark or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-meter` | 1px of height per step (2 to 6px) |
| | | `.ds-columns` | the plot 24px per step (72 to 168px); not `--mini`, 32px, which lines up with a figure |
| | | `.ds-legend__key` | 2px per step |
| Density | `.ds-density-*` | `.ds-columns` | the plot 12px per step; not a meter, which is thin already |
| Shape | `.ds-shape-*` | `.ds-meter`, a column's data end, `.ds-legend__key` | multiplies the radius (of a meter: half its height, times the shape, at most half its height) |
| Touch | `.ds-touch` | a column that opens | at least `--ds-touch-target` high; its width comes from the chart's |
| Tone | `.ds-tone-*` | `.ds-meter`, `.ds-columns__col`, `.ds-legend__key` | the fill, from the class on the mark itself; always with words next to it. It beats a `--ds-meter-color` of the theme, as the meaning goes first |

The type stays the meta font at every size.

### Keyboard and names

Only a column that opens takes focus: `Tab` reaches it, `Enter` follows or presses it, `Space` presses a button, and its
`aria-label` says the category and the value ("Tuesday: 38 devices"). A `.ds-scroll-x` around grouped columns is a tab
stop of its own when nothing inside takes focus. A meter with its own figure is `role="meter"` with a name,
`aria-valuenow` and `aria-valuetext`.

### Hooks

`--ds-meter-height`, `--ds-meter-track`, `--ds-meter-color`, `--ds-columns-height`, `--ds-columns-radius`,
`--ds-columns-group-min`, `--ds-chart-color`, `--ds-legend-key-size`, `--ds-chart-forced-ink`: see
[theming.md](theming.md).

**Motion:** the "Charts" row of [Feedback](motion.md#feedback) in motion.md.
## File upload

A drop zone and a file field: files by drop, the file dialog or paste.

```html
<label class="ds-dropzone">
  <input class="ds-dropzone__input" type="file" accept=".csv" multiple>
  <span class="ds-dropzone__disc" aria-hidden="true">[icon upload 24]</span>
  <span class="ds-dropzone__title">
    <span class="ds-dropzone__idle">Drop CSV files here or <span class="ds-dropzone__browse">browse</span></span>
    <span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span>
  </span>
  <span class="ds-dropzone__hint">Up to 10 MB each</span>
</label>

<input class="ds-input" type="file" accept="image/*">       <!-- the plain file field -->
```

```js
DS.dom.dropzone(zone, { onFiles: (files) => addFiles(files), paste: true });   // drop, dialog, paste
DS.dom.dropzone(chatPane, { onFiles: attach, accept: 'image/*', input: null }); // a page's own drop target
```

- **The zone** (2.0) is a `<label>`: a click or Enter on its input opens the file dialog; the input stays in the tab
  order, visually hidden, and the ring shows on the zone. Border `--ds-dropzone-border` (`1px dashed var(--ds-outline)`),
  radius `--ds-radius-card`; the state layer at `--ds-state-hover-lg`, the ripple, and the press morph to
  `--ds-radius-card-pressed` like a radio card. Disabled through its input (`disabled`).
- **Dragging over**: `DS.dom.dropzone()` writes `data-ds-dragover` while files are over the zone (a child included):
  the zone takes `--ds-accent` with an inset `--ds-primary` edge (no layout shift) over `--ds-dur-fast`, and the
  title says it in words (`__over` crossfades with `__idle` in one cell, so the zone never changes its size). On
  any other element (a pane, a chat) the attribute draws a dashed `--ds-primary` outline inside its edge; call
  `DS.dom.dropzone(element, { onFiles })` on it rather than counting drag events yourself.
- **Which file input**: the zone's `.ds-dropzone__input` (else its first `input[type="file"]`) hands its picks to
  `onFiles` too. A page drop target with a file input of its own inside (a composer's attach button, whose picks the
  page already handles) passes `input: null` (drops and paste only), or names the input to use (`input: element`).
- **The file field** `.ds-input[type="file"]`: the field box, the chosen file's name in `--ds-text-2`, and the browser's
  button as a small tonal pill (`--ds-accent`, 32px) with the hover and press mixed into its fill and the press
  morph. It has no ripple (a native field part).
- **The chosen files** are the page's: a [Row list](#row-list) (`.ds-list`, without `--interactive`) with a
  `.ds-progress` and a remove button in each row, rendered through `DS.motion.flip()` (a removed row fades out, focus
  moves to the next remove button). The bar has no width of its own in a row: give it its share in the page's CSS
  (`flex: 0 1 160px; min-width: 80px`).

```html
<ul class="ds-list" aria-label="Chosen files">
  <li class="ds-list__item" data-ds-key="f1">[icon fileText 20 .ds-list__icon]
    <span class="ds-list__text"><span class="ds-list__title">devices.csv</span><span class="ds-list__meta">30%</span></span>
    <div class="ds-progress ds-progress--flat" style="--ds-progress: 0.3">
      <div class="ds-progress__track" role="progressbar" aria-label="Upload of devices.csv" aria-valuemin="0" aria-valuemax="100" aria-valuenow="30"><div class="ds-progress__bar"></div></div>
    </div>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove devices.csv" data-tip="Remove">[icon close 20]</button></span>
  </li>
</ul>
```

- **In one row** (`.ds-dropzone--inline`): the disc, the words and the hint at the end (under the words in less than
  520px), for a form where the full zone would take too much room. It is a size container, so it takes its width from
  its parent: in a flex row of the page's own, give it one.
- **A file over a limit**: `aria-invalid="true"` on the input gives the zone a solid `--ds-error` edge and its hint the
  error ink (`--ds-field-error-color`); say what is wrong in the hint, never with the colour alone.

**Options** ([options.md](options.md)): classes on the zone, the field or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-dropzone--inline` | the zone | one row |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | a zone, a field or a group | the disc 32 to 64px (inline: 24 to 48px) and the title's type role; the file field 24 to 56px and its button 16 to 48px, never less than its own line |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the zone's block padding and gap 2px less per step; the file field and its button 4px less per step |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the zone's rest and pressed radius, its disc and the file button times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | the zone (inline too) and the file field at least `--ds-touch-target` (48px) high |
| Tone | none | | the error edge follows `aria-invalid`, always with words |

- **Keyboard and names**: the input takes the focus, so Tab reaches the zone and Enter or Space opens the file dialog;
  its name comes from the label's text. A page's drop target adds no tab stop of its own: paste works with focus inside.
- **Forced colours**: a dashed `ButtonText` edge (`Highlight` while dragged over, solid for a file over a limit), the file button in `ButtonFace` /
  `ButtonText` with a `ButtonText` border, a page's drop target outlined in `Highlight`; a disabled zone or file
  field is `GrayText`.
- **Hooks**: `--ds-dropzone-border`, `--ds-dropzone-padding` (block padding, `--ds-space-6`), `--ds-dropzone-radius`
  (`--ds-radius-card`), `--ds-file-button-height` (32px); the file field reads `--ds-input-height`, the hint of an
  invalid zone `--ds-field-error-color` ([theming.md](theming.md#component-hooks)).

**Motion:** the press and state layers of [Controls](motion.md#controls) in motion.md; the drop state is a
`--ds-dur-fast` colour change.

## Reorder rows

```html
<ul class="ds-plain-list" id="steps">
  <li class="ex-step" data-ds-key="a">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move Backup">[icon grip 20]</button>
    Backup
  </li>
  ...
</ul>
```

```js
DS.motion.sortable(steps, { onChange: (order) => save(order.map((row) => row.dataset.dsKey)) });
```

- `.ds-grip` (2.0) on a quiet icon button is the handle: `cursor: grab` and `touch-action: none`, so a drag on a
  touch screen moves the row, not the page. Give it an `aria-label` that names the row.
- **Pointer**: the row follows the pointer and carries `data-ds-dragging` (raised: `--ds-elev-2` and the dragged state
  layer, `currentColor` at `--ds-state-dragged`, over `--ds-dur-fast`; nothing scales), the other rows make room
  through `DS.motion.flip()` and, on release, the row glides into its place on the spring.
- **Keyboard**: on the handle, ArrowUp and ArrowDown move the row one place, Home and End to the start or the end; the
  handle keeps the focus. Each move is spoken ("Moved to position 2 of 5") through a polite region in the list's
  dialog or sheet, else its `.ds-theme`.
- **Forced colours**: the dragged row is outlined in `Highlight`.

- **Options**: the grip is a `.ds-btn--icon`, so size, shape and touch reach it through the [Button](#button); density
  leaves it alone, as every icon button. The row's look has no option of its own.

**Motion:** `sortable()` in [DS.motion](motion.md#dsmotion-jsmotionjs); the row glides like every `flip()` item.
## Ripple

A press on an action grows a circle of the content colour from the pointer (Enter or Space: from the centre) and
fades it when the press ends. One call wires every action on the page, also the ones rendered later:

```js
const ripples = DS.ripple.attach(document);   // <html> gets .ds-ripples; ripples.destroy() takes it back (DS.init(document) attaches too)
ripples.release(host);                        // end a running press by hand (no argument: every press)
```

```html
<button class="ds-btn" type="button">Export</button>           <!-- a host: nothing to add -->
<div class="x-row" data-ds-ripple tabindex="0">...</div>        <!-- any element becomes a host -->
<nav data-ds-ripple="off">...</nav>                              <!-- no ripples inside -->
```

- Hosts (`DS.ripple.RIPPLE_HOSTS`): `.ds-btn`, `.ds-chip` (the ripple goes into `.ds-chip__body`),
  `.ds-segmented__option`, `.ds-drawer__item`, `.ds-drawer__toggle`, `.ds-tabs__tab` (the ripple is a box over the tab's
  layer that clips the circle), `:is(button, a).ds-tile`, `.ds-card--interactive` (also the `<div>`
  form), `.ds-table__sort`, the body rows of `.ds-table--interactive` (the ripple goes into the row's first cell, a
  `<td>` or a `<th scope="row">` row header, as a box over the whole row that clips the circle; the row is isolated meanwhile, so the ripple paints under the
  cells' content), `.ds-radio` (a radio card, also when its own input is pressed), `.ds-combo__toggle`,
  `.ds-menu__item`, `.ds-errors summary`, `.ds-disclosure > summary`, `.ds-list--interactive > .ds-list__item`,
  `:is(a, button).ds-kv-list__row`, `.ds-dropzone`, `:is(button, a).ds-columns__col`, `.ds-pressable`
  ([Utilities](#a-pressable-element-of-your-own)) and `[data-ds-ripple]`; Enter on a `.ds-table__row-link` or
  `.ds-card__action` ripples its row or card from the centre, while a press on another link or control inside the
  row or `<div>` card (a plain link, a field, a label) is that control's own and ripples neither;
  `data-ds-ripple="off"` on a host or an ancestor opts out. Not hosts, by design: inline links (`.ds-link-btn`,
  links in text), the switch, `.ds-check` rows and checkbox or radio inputs (their halo is the press), combobox
  options (pointer-down selects and closes the list; the state layer is the feedback), native field parts, the brand
  link (`.ds-brand`: the home link in the top bar is identity, not a control, so like a link in text it has no state
  layer, ripple or morph) and the skip link (`.ds-skip`: keyboard-only, shown while focused; its focus ring is the
  feedback). Each host positions itself in its own stylesheet (`[data-ds-ripple]` is made `position: relative`
  with zero specificity), and it is clipped and isolated while a ripple is inside (at rest a host looks as without `.ds-ripples`). Disabled, `aria-disabled`, `aria-busy` and `.ds-btn--done` hosts (a chip or radio card
  whose input is disabled, also by its `<fieldset>`, or `.ds-radio--disabled`) get no ripple, and neither does a press with a pointer button other than the primary one (a right or middle click) or from a non-primary pointer (a second finger).
- The ripple is `<span class="ds-press-ripple" aria-hidden="true" data-ds-keep>` with the runtime properties
  `--ds-ripple-x`, `--ds-ripple-y` (its centre) and `--ds-ripple-r` (the distance to the farthest corner). It
  grows on `ds-press-ripple` over `--ds-dur-medium` (an effect: no overshoot), gets `.ds-press-ripple--out` on
  release (not before `--ds-dur-instant` after the press) and is removed once that fade settled. The host carries
  `.ds-pressed` from press to release, at least `--ds-dur-instant`, so a quick click shows the whole press.
- The flat state layer and the ripple never stack: under `.ds-ripples` a pressed host keeps its hover layer (0 on
  touch screens), or its focus layer when a key pressed it, and the ripple adds the press. A button's layer also keeps what `--ds-btn-state-pressed-opacity`
  asks for beyond the ripple's `--ds-state-pressed`, so `.ds-btn--disc` shows its disc on press on touch screens
  too. `DS.ripple.attach(document)` or `DS.init(document)` wires it; a page that calls neither keeps the flat layer as
  the press feedback.
- A press ends early when another element captures the pointer (an ancestor that drags to scroll): the ripple
  fades as on release. `release(host?)` ends one by hand; `detach()` is the **deprecated** alias of `destroy()`
  until 3.0 ships. `:active` (the flat layer and the morph) lasts until the pointer button goes up.
- Colour: `--ds-ripple-color` (default `currentColor`), on `.ds-theme` or a host. Forced colours show no ripple.
- iOS Safari applies `:active` only on pages that listen to `touchstart`. `attach()` adds a passive listener; a
  page without `ds.js` adds one itself (`document.addEventListener('touchstart', () => {}, { passive: true })`, or
  `ontouchstart=""` on `<body>` where the Content-Security-Policy allows inline handlers), otherwise iOS shows no
  press feedback.

### Options

The ripple has none of its own: it fills its host, which clips it, so it takes every option from the host.

| Option | Classes | Where it applies | Effect on the ripple |
|---|---|---|---|
| size | `.ds-xs` ... `.ds-xl` | on the host or an ancestor | none of its own: the circle reaches the farthest corner of whatever box the host has at the press |
| density | `.ds-density-*` | on the host or an ancestor | the same |
| touch | `.ds-touch` | on the host or an ancestor | the same: `--ds-target-min` makes the box larger, and the ripple fills all of it |
| shape | `.ds-shape-*` | on the host or an ancestor | the clip is the host's radius: at `.ds-shape-square` a square host clips a square. The press morph is each host's own rule and never makes a corner rounder than at rest, so a square never turns into a pill. A tab's ripple box computes the radius of the tab's layer |
| tone | `.ds-tone-*` | none of its own | the default ink is the host's content colour, so a filled error button ripples in its on-tone colour |

### Keyboard and names

Enter and Space on a focused host ripple from its centre, and on `.ds-table__row-link`, `.ds-card__action` or
`.ds-list__action` they ripple the row or card (Enter only on a link; never Enter on a checkbox or radio, and typing
in a field inside a host is no press). The span is `aria-hidden` and never takes focus, so it adds nothing to the
host's name, and `data-ds-keep` keeps `DS.dom.morphHtml` from removing it.

### Forced colours

Forced colours show no ripple (`display: none`); the host's own forced-colours rules are the press feedback.

### Hooks

`--ds-ripple-color`: [theming.md](theming.md#component-hooks).

**Motion:** the press rows of [Controls](motion.md#controls) in motion.md, and "Pointer ripple" in the Motion Lab.
## Indicator

One pill behind the items of a track that glides to the active item, instead of each item painting its own background.
The segmented switch, the tabs, the drawer list and radio tiles use it; any project track can.

```html
<nav class="ds-segmented" aria-label="Mode"
     data-ds-indicator='[aria-current="true"]' data-ds-indicator-class="ds-segmented__indicator">
  <a class="ds-segmented__option" href="/live" aria-current="true" data-label="Live">Live</a>
  <a class="ds-segmented__option" href="/admin" data-label="Admin">Admin</a>
</nav>
```

```js
const pill = DS.indicator.create(track, { active: '[aria-pressed="true"]', className: 'x-pill' });
pill.update();    // only needed with observe: false
pill.get();       // the active item, or null
pill.set(item);   // an element, a selector, or null: the pill follows
const off = pill.on('change', (event) => event.detail.item);
pill.destroy();
```

- `DS.init()` makes one for every `[data-ds-indicator]`: its value is the selector of the active item (empty: any item
  that says it is the current one, by `aria-current`, `aria-pressed`, `aria-selected` or `aria-checked`).
  `data-ds-indicator-class`, `data-ds-indicator-name` and `data-ds-indicator-reveal` are the options `className`,
  `name` and `reveal` of `DS.indicator.create`. A change of one of them replaces the pill.
  `DS.core.get(track, 'indicator')` returns the handle `DS.indicator.create()` returns for those options, and it stays
  valid when the pill is replaced, also by a call of `create()` with other options on that track.
- `DS.indicator.create(track, options)` inserts `<span class="ds-indicator" aria-hidden="true" data-ds-keep>` and
  `.ds-has-indicator` on the track; one pill per track. `createIndicator` is its 2.x name, **deprecated**: an alias
  until 3.0 ships. `OVERSHOOT`, what it does when, and every option: [DS.indicator](motion.md#dsindicator-jsindicatorjs) in motion.md.
- The page moves the active item by its attribute; the pill follows by itself. A track of `.ds-btn` toggles works as
  it is: under `.ds-has-indicator` a pressed button drops its own tint, so only the pill paints the selection.
- The handle: `get()` is the active item, or null. `set(value)` takes an element of the track or a selector and moves
  the state attribute there (the one the `active` selector names, as the current item writes it; `aria-current` is
  removed from the old item, the others turn `"false"`); `set(null)` clears it. It does nothing where the `active`
  selector names no such attribute (`.ds-radio:has(input:checked)`: that state is the page's). `on(type, fn)` listens
  for `ds:<type>` of this track and returns the unsubscribe; `update()` places the pill now; `destroy()` is final.
- **Event:** `ds:change` (bubbling, `detail.item`: the new active item or null) on the track when the active item
  changes, whoever moved it, once it is placed. The first placement says nothing, and neither does an item that only
  closes with its group. With `observe: false` it comes from `update()` or `set()`.

### Options

The pill has no size of its own: it measures the active item. So the options act on the items, and it follows them.

| Option | Classes | Where it applies | Effect on the pill |
|---|---|---|---|
| size | `.ds-xs` ... `.ds-xl` | on the track, an item or an ancestor | follows the item's box at once (a resize places it without a glide) |
| density | `.ds-density-*` | on the track, an item or an ancestor | the same |
| touch | `.ds-touch` | on the track, an item or an ancestor | the same: the item's larger box |
| shape | `.ds-shape-*` | on the track or an ancestor | a component's class computes `--ds-indicator-radius` with `--ds-shape` in its own rule, and the pill takes that as it is. A project class's plain `border-radius` is copied into it (at most half the item's smaller side) with `--ds-shape` as a live factor: at `.ds-shape-square` the corners spring to square. A class that multiplies by `--ds-shape` itself sets `--ds-indicator-radius` instead: its computed `border-radius` already holds the shape, and a copy would apply it twice |
| tone | none | | the pill shows a choice, no status: no tone |

Its look is up to the component: `background`, and `--ds-indicator-radius` or a plain `border-radius` for its corners.

### Keyboard and names

The pill is `aria-hidden` and takes no focus and no pointer. The selection is on the item (`aria-current`,
`aria-pressed`, `aria-selected`, `aria-checked`), never on the pill alone; keyboard use is the track's
(`DS.dom.roving()` on a toggle group or tab list: the arrow keys, Home and End).

### Forced colours

The pill is gone (`display: none`, also for a project class): the items show the selection by the system colours of
their own component.

### State

`data-glide` (a glide runs), `data-dir` (`left`, `right`, `up`, `down`: the travel) and `data-empty` (no active item) are
written by the script on the span. `.ds-indicator--instant` places it without a glide; the script sets it around a
placement, and a page may set it on a pill of its own.

### Properties of the indicator's class

`--ds-indicator-radius`: its corners, set by a component's class (registered, so it springs; it does not inherit, so
never on `.ds-theme`). It is no theme hook. The one hook is the motion hook `--ds-indicator-lag`, which themes never
set: [DS.indicator](motion.md#dsindicator-jsindicatorjs) in motion.md.

**Motion:** the indicator row of [Navigation](motion.md#navigation) in motion.md, and "Indicator" in the Motion Lab.
## Utilities

The shared helper classes: text, the press model for an element of your own, actions on demand, keys and dividers.

| Class | Effect |
|---|---|
| `.ds-sr` | visually hidden, read by screen readers |
| `.ds-muted` | quieter body text, tabular figures (`p.ds-muted` keeps the reading measure) |
| `.ds-meta` | meta line, 12px, tabular figures; a leading 16px icon (`[icon clock 16]Synced 09:12`) sits on its text line, `--ds-space-1` before the text |
| `.ds-stale` | dims content until its replacement arrives (filter applied, request running), after `--ds-delay-loader`, so an answer within 200ms never dims; removing it is instant. Set `aria-busy="true"` on the container while it is stale |
| `.ds-num` | right-aligned tabular figures |
| `.ds-center` | centred text |
| `.ds-nowrap` | keeps a value and its unit together |
| `.ds-no-scroll` | on `<body>` while a modal layer is open (with `.ds-base`); `DS.overlay` sets it, reference-counted |
| `.ds-pressable` | the press model of the system on an element of your own (below) |
| `.ds-hover-actions` | actions that show on demand: with their row's or card's hover, focus, selection or open menu (below) |
| `.ds-kbd` | a key: `<kbd class="ds-kbd">Ctrl</kbd>` |
| `.ds-divider` | a hairline: `<hr class="ds-divider">`, `--inset`, `--vertical`, `--label` (below) |
| `.ds-icon--fillable`, `.ds-icon--filled` | an icon that fills when its control is on, or always ([icons.md](icons.md#glyphs)) |
| `.ds-touch` | every target at least `--ds-touch-target` (48px), on `.ds-theme` or a container ([theming.md](theming.md#touch-screens)) |

| Option | Applies to | Effect |
|---|---|---|
| `.ds-touch` | `.ds-pressable`, `.ds-hover-actions` | a pressable element is at least `--ds-touch-target` high; actions on demand always show |
| `.ds-shape-*` | `.ds-pressable`, `.ds-kbd` | multiplies the radius (`--ds-shape`) |
| Size, density, tone | not read | these classes have no height or meaning of their own; a pressable element's padding is the project's |

Root classes: `.ds-theme` (tokens; required), `.ds-base` (page base, optional).

`.ds-muted` has no margin (like `.ds-meta`): space it with the layout around it (a card's rhythm, a stack's gap).

Under `.ds-base`, `hidden` always hides (the page base holds it with `!important`, whatever `display` a component or
the page sets); never add a `[hidden]` rule of your own.

### A pressable element of your own

A project component that acts on a press (a row, a tile of its own) takes the system's press model instead of a
hand-built one:

```html
<div class="x-row ds-pressable" role="button" tabindex="0">Printer on floor 2</div>
<div class="x-panel ds-pressable ds-pressable--lg ds-pressable--inset" role="button" tabindex="0">...</div>
```

- A state layer in `currentColor` (hook `--ds-pressable-layer`): hover `--ds-state-hover` (`--lg`:
  `--ds-state-hover-lg`, for large surfaces), press `--ds-state-pressed` in `--ds-dur-micro`, keyboard focus
  `--ds-state-focus` at once with the ring. The ring rests at offset + width and snaps to `--ds-focus-offset`;
  `--inset` rests at 0 and snaps inward (`-1 * --ds-focus-width`), for elements in a container that clips.
- A ripple host: with `DS.ripple.attach()` the ripple brings the press. No morph: pills are `.ds-btn`.
- Disabled, `aria-disabled="true"` and `aria-busy="true"` show no hover or press layer and no ripple and take the
  `not-allowed` cursor; `aria-disabled` keeps its focus layer. Forced colours: no layer, the ring stays.
- The radius: `--ds-pressable-radius` (`--ds-radius-sm`), times `--ds-shape`. Under `.ds-touch` it is at least
  `--ds-touch-target` high. Add the role, `tabindex` and the key handling yourself (Enter and Space press it).

### Actions on demand

```html
<tr>
  <td>LAPTOP-0042</td>
  <td class="ds-num"><span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Edit LAPTOP-0042">[icon pencil 18]</button></span></td>
</tr>
```

`.ds-hover-actions` fades in on `--ds-dur-fast` while its host (the nearest `tr`, `li`, `.ds-card`,
`.ds-drawer__row` or `.ds-hover-host` around it) is hovered (devices that hover), holds the focus, is current
(`aria-current`) or selected (`aria-selected="true"`, `.ds-table__row--selected`) or carries `data-ds-shown` (set by
the page), or while the actions themselves hold an open menu (`aria-expanded="true"`) or carry `data-ds-shown`, and
fades out faster (`--ds-dur-instant`). Only the nearest host counts: in a table inside a card, hovering the card's
title or focusing its search field shows no row's actions, and hovering a row shows that row's. On touch screens (`hover: none`) and
under `.ds-touch` it always shows. It changes opacity only: the buttons stay in the tab order and are read, and
hover moves nothing. Name each button with its row ("Edit LAPTOP-0042").

### Dividers

```html
<hr class="ds-divider">
<hr class="ds-divider ds-divider--inset">
<span class="ds-divider ds-divider--vertical" role="separator" aria-orientation="vertical"></span>
<div class="ds-divider ds-divider--label" role="separator"><span>Today</span></div>
```

A hairline in `--ds-line` with no margin; `--inset` starts at `--ds-space-4`; `--vertical` stands between items of a
row; `--label` draws hairlines on both sides of a caption in the meta font and `--ds-text-2`. They are borders, so
they stay in forced colours.

### Keys

`<kbd class="ds-kbd">K</kbd>`: a key in the code font in a hairline box (`--ds-kbd-border`, `--ds-kbd-bg`), at least
`--ds-space-5` wide. For a shortcut write each key in its own `kbd` (`<kbd class="ds-kbd">Ctrl</kbd> <kbd
class="ds-kbd">K</kbd>`).

Hooks: `--ds-pressable-radius`, `--ds-pressable-layer`, `--ds-kbd-border`, `--ds-kbd-bg`
([theming.md](theming.md#component-hooks)). Forced colours: `.ds-pressable` shows no layer and keeps its ring; dividers
and keys are borders, so they stay.

**Motion:** `.ds-stale`: the "Loading bar" row of [Feedback](motion.md#feedback) in motion.md.
## Motion classes

Documented in [motion.md](motion.md): `.ds-enter` with `.ds-enter--fade`, `.ds-enter--scale`, `.ds-enter--slide`,
`.ds-enter--swap`, `.ds-enter--delayed`, `.ds-enter--pop`, `.ds-enter--fill` (a [chart](#charts) mark fills to its `--ds-share`), `.ds-enter--fill-x`, `.ds-enter--fill-y` (**deprecated** in 2.0, removed in 3.0 at the earliest: use `.ds-enter--fill`); `.ds-leave` with `.ds-leave--sink`, `.ds-leave--scale`, `.ds-leave--slide`, `.ds-leave--pop`;
`.ds-stagger`; `.ds-reveal`; `.ds-reveal--scroll` (a block of a long read-only page fades in and rises while it
scrolls into view, tied to the scroll position; static where `view()` timelines are missing and in print);
`.ds-collapsible` (opens decelerating and closes faster, accelerating; focus rings at its content edge are not cut; a summary holding a `.ds-chevron` drops the native marker); `.ds-chevron` (a disclosure chevron that turns 180deg on the spring
in the summary of an open `<details>` or under `aria-expanded="true"`); `.ds-presence` (toggled elements; on a wrapper, never on a `.ds-btn`, `.ds-chip` or `.ds-card`) with
`.ds-presence--keep` (keeps its box, toggled by `data-ds-shown`; 2.0); `.ds-swap` (the slot of `DS.motion.roll()` and
`DS.motion.crossfade()`) with `.ds-swap--fade` (soft edges, 2.0); `.ds-vt-view` (a view outside the app frame,
2.0, see [Page](#page-outside-the-frame)); `.ds-icon-swap` with `.ds-icon-swap__a` and `.ds-icon-swap__b` (icon swaps, see
[Button](#button)); the sliding indicator `.ds-has-indicator`, `.ds-indicator`,
`.ds-indicator--instant`.

One-shot content (a card that appears once, a row that goes) uses `.ds-enter` / `.ds-leave` or `DS.motion`.
Something that is shown and hidden again and again uses `DS.overlay` (dialogs, sheets, menus, the combobox list)
or, for a project element toggled with `hidden`, as a `[popover]` or as a `<dialog>` of its own, `.ds-presence`:
it fades in and grows from `--ds-scale-popup` on the spring, leaves faster, and a toggle mid-way continues from where
it is (progressive: where `@starting-style` and `transition-behavior: allow-discrete` exist; elsewhere it toggles at
once). Never both on one element. Something that comes and goes without moving its neighbours (a pill shown on
hover, a "Latest" button whose room stays) takes `.ds-presence--keep` and the page's `data-ds-shown` instead: it fades
and keeps its box, in every engine.

```html
<span class="ds-presence ds-presence--keep" data-ds-shown><button class="ds-btn ds-btn--tonal ds-sm" type="button">Latest</button></span>
```

A `[popover]` is centred by the browser's `margin: auto`; inside a container that spaces its children with margins
(`.ds-card > * + *`), give it `margin: auto` again or place it outside.

A log that grows at its end (an import log, a chat) sticks to it with `DS.dom.followEnd(scroller, { pill })` (2.0):
while the reader is at the end, new lines keep it there; scrolling up lets go and shows `pill` (a `.ds-presence`
wrapper around a "Latest" button, toggled with `hidden`); a click on it, or `stick()`, goes back to the end
([motion.md](motion.md#dsdom-jsdomjs)).

```html
<div class="ex-log" id="log" tabindex="0" aria-label="Import log">...</div>
<span class="ds-presence" id="latest" hidden><button class="ds-btn ds-btn--tonal ds-sm" type="button">[icon arrowDown 16] Latest</button></span>
```

```js
DS.dom.followEnd(document.getElementById('log'), { pill: document.getElementById('latest') });
```

**Motion:** [Utilities](motion.md#utilities-css) and [Keyframes](motion.md#keyframes) in motion.md.

## Attributes

The attributes the system writes (owned state: a re-render with `DS.dom.morphHtml` keeps them; never set them) and
the ones the page sets for it. The project check reads this table.

| Attribute | Written by | On | Meaning |
|---|---|---|---|
| `data-scrolled` | the system (`DS.dom.watchScrolled`) | `.ds-app`, `.ds-sheet__panel`, `.ds-dialog__box` or the scroller | the scroller is scrolled away from its top (hairlines, top bar tint) |
| `data-ds-sentinel` | the system (`DS.dom.watchScrolled`) | the 1px sentinel first in a watched scroller | marks the sentinel (with `data-ds-keep`) |
| `data-ds-text` | the system (`DS.dom.watchScrolled`) | a watched `.ds-dialog__body` | bare text stands among its children, so a body of text and the sentinel is not taken for empty |
| `data-ds-edges` | the system (`DS.dom.scrollEdges`) | the scroller | its edges are reported |
| `data-ds-overflow-start` | the system (`DS.dom.scrollEdges`) | the scroller | more to scroll at the start of its axis |
| `data-ds-overflow-end` | the system (`DS.dom.scrollEdges`) | the scroller | more to scroll at the end of its axis |
| `data-ds-dragover` | the system (`DS.dom.dropzone`, `DS.dnd`) | a `.ds-dropzone`, a page drop target or a zone of `DS.dnd` | files are dragged over it, or the dragged item is |
| `data-ds-dragging` | the system (`DS.motion.sortable`, `DS.dnd`) | the item being moved | the dragged row |
| `data-ds-virtual-gap` | the system (`DS.virtual`) | a hidden spacer among the rows | stands in for rows that are not rendered |
| `data-ds-time` | the page | any element, usually a `<time>` | `DS.format` keeps its relative time current ([core.md](core.md#relative-time-data-ds-time)) |
| `data-ds-keyboard` | the system (`DS.dom.followViewport`) | `<html>` | the on-screen keyboard is up |
| `data-toast-reserve` (with `--ds-toast-reserve`) | both: `DS.overlay.toast()` by default, the page only with `reserve: false` | `.ds-view`, `.ds-sheet__body`, `.ds-dialog` | the layer keeps room at its end for snackbars that stay ([Snackbar](#snackbar)) |
| `data-ds-savebar` (with `--ds-savebar-height`) | the system (`DS.overlay.savebar()`) | `.ds-view` | the save bar shows: scroll padding and the content's end keep its room ([Save bar](#save-bar)) |
| `data-ds-savebar-rest` | the system (`DS.overlay.savebar()`) | `.ds-view` | the bar hid at the end of the page: its room stays until the page scrolls away from the end ([Save bar](#save-bar)) |
| `data-ds-busy` | the page | `.ds-dialog`, `.ds-sheet`, `.ds-drawer` | keeps the overlay open while its action runs: the user's close attempts do nothing, `DS.overlay.close()` still closes ([Dialog](#dialog), "While its action runs") |
| `data-ds-open` | the page | a button | `DS.init()`: a click, or a menu's ArrowDown and ArrowUp, opens the overlay it names (a selector or an id), with the button as its opener ([Dialog](#dialog)) |
| `data-ds-close` | the page | a control or a backdrop | without a value closes the overlay around it; with a selector or an id closes that overlay, leaving the one around it open ([Dialog](#dialog)) |
| `data-ds-dialog-form` | the page | the `form.ds-dialog__box` of a dialog | the system handles its submit: `ds:submit`, then the close ([Dialog](#a-form-dialog)) |
| `data-ds-menu-checks` | the page | `.ds-menu` | the system flips its check items and sends `ds:change` ([Menu](#menu)) |
| `data-tip-shortcut` | the page | a `[data-tip]` trigger | the key after the tip's text, in `.ds-tooltip__shortcut`; the tip then shows whatever the visible text ([Tooltip](#tooltip)) |
| `data-ds-toast-room` | the page | `.ds-view`, `.ds-sheet__body`, `.ds-dialog` | `off`: this layer keeps no room for snackbars that stay; the page keeps the messages clear itself ([Snackbar](#snackbar), "Room at the end") |
| `aria-keyshortcuts` | both: the system (`DS.hotkeys`, from `data-ds-hotkey`) unless the markup has one, then the page's stays | the element with `data-ds-hotkey` | the combos of the element, for assistive tech; while the system writes it a re-render keeps it |
| `data-ds-hotkey` (with `data-ds-hotkey-description`, `-group`, `-scope`) | the page | a button, link or field | a press of the combo presses it, or focuses a field ([core.md](core.md#hotkeys)) |
| `data-ds-guard="off"` | the page | any element around actions | its `aria-disabled` and busy actions explain themselves on click: `DS.motion.guard()` lets their activations through |
| `data-ds-badge`, `data-ds-badge-max` | the page | a `.ds-badge` | the count and the largest figure it shows (`DS.badge`, [Badge](#badge)) |
| `data-icon` | the page | any element | the glyph name that `DS.icons.fill()` draws into it ([icons.md](icons.md)) |
| `data-icon-size` | the page | an element with `data-icon` | the glyph size in px for `DS.icons.fill()` (default 20) |
| `data-icon-place` | the page | an element with `data-icon` | `start` or `end`: `DS.icons.fill()` puts the glyph first or last and keeps the content (without it the glyph replaces the content; [icons.md](icons.md)) |
| `data-ds-shown` | the page | a `.ds-presence--keep` element, a `.ds-hover-actions` host or its actions | shown (`.ds-presence--keep`: without it hidden, keeping its box; `.ds-hover-actions`: the actions show without hover or focus, [Utilities](#actions-on-demand)) |
| `data-drawer-collapsed` | the page | `.ds-app` | the docked drawer is a rail (above 900px; [App frame](#the-rail)) |
| `data-label` | the page | `.ds-segmented__option`, `.ds-tabs__tab` | the option's text again: keeps the width of the selected weight |
| `data-label` | the page | a cell of `.ds-table--stack` / `--stack-wide` | the label shown above the cell's content while the rows stack ([Stacked rows](#stacked-rows)) |
| `data-status` | the page | `.ds-steps__step` | `done`, `error` or `optional`: the state of a step ([Steps](#steps)) |
