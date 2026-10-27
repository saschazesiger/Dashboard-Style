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
| A page that loads, fails or is gone | the page states ([Page](#page)): a skeleton, `.ds-alert--error` with Retry, `.ds-empty` |
| Sections of one page or record (overview, history, settings) | [Tabs](#tabs) `.ds-tabs` (ARIA tabs, or links between pages of a record) |
| Tabs or segmented switch? | tabs change what the page shows (sections, with a panel each); a segmented switch changes how the same content shows (a mode, a view) |
| Where the user is in a form of several steps | [Steps](#steps) `.ds-steps` (marks with labels, or `--bar`) |
| Rendered rich text (Markdown, a help article) or a block of code | [Prose and code](#prose-and-code): `.ds-prose`, `.ds-code-block` |
| A sign-in or password page | `.ds-auth` with `.ds-auth__card` ([Page](#page)) |
| A block of related content | [Card](#card) `.ds-card`; a quieter block inside one: `.ds-card--filled` |
| A whole card opens something (a device, a report) | `.ds-card--interactive` on `<a>` or `<button>`, or on a `<div>` with a `.ds-card__action` link ([Card](#card)) |
| Any action | [Button](#button) `.ds-btn` with one variant; an action inside text or a table cell: `.ds-link-btn` |
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
| A unit or a reveal inside a field | `.ds-input-group` with `.ds-input-group__affix` or a quiet icon button ([Form](#form)) |
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
| Pick one from a long list in a dialog | `.ds-dialog--wide` with a search, a `.ds-dialog__body` list and `--ds-dialog-height` ([Dialog](#dialog), "A search over a list") |
| A task that needs the whole phone screen | `.ds-dialog--full-narrow` (or `--full`) with a `.ds-dialog__head` ([Dialog](#dialog)) |
| Actions of a row on a phone | an action sheet: `.ds-dialog--bottom` with a `.ds-dialog__list` of menu items; a [Menu](#menu) at a desk ([Dialog](#dialog)) |
| Confirm by typing the name of what goes | a `.ds-dialog--wide` `alertdialog` with a field ([Dialog](#dialog), "Confirm by typing the name") |
| Filters or a form with its actions at the end of a side sheet | `.ds-sheet__foot`, and a live count in `.ds-sheet__subtitle` ([Side sheet](#side-sheet)) |
| Name an icon button, or say why a control is disabled | [Tooltip](#tooltip) `.ds-tooltip` |
| Waiting | [Loading](#loading): `.ds-loading` in a section, `.ds-skeleton` with `.ds-loadbar` for a page, `.ds-boot` at app start, `.ds-spinner--sm` in a busy button |
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
  `createIndicator(list, { ..., reveal: true })` sets it by itself and scrolls the list (only the list) so the
  current item stays `--ds-space-2` clear of its edges.
- Cut edges (2.1): a list longer than the drawer shades each edge that has more to show, as a menu does: a sticky
  shade of the drawer's surface (`--ds-backdrop`), `--ds-scroll-fade` long (`0px` turns it off), above the items and
  the pill, taking no room (the list keeps `--ds-space-1` above its rows and `--ds-space-6` below them). Scroll
  timelines drive it; elsewhere call `DS.dom.scrollEdges(list, { axis: 'block' })` once, whose
  `data-ds-overflow-start` / `-end` show the shades over `--ds-dur-fast` (it follows rows that come and go). Hidden in
  forced colours.
- Sliding pills: `DS.indicator.createIndicator(list, { active: '[aria-current="page"]', className: 'ds-drawer__indicator' })`
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
  (`--ds-radius-action-pressed`) and springs back on release; under the active item the pill morphs with it, and
  nothing moves. Its rest radius is half of `--ds-drawer-item-height` (48px). A segmented option lies inside the
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
- Narrow windows: the account shows `.ds-account__avatar` (give it a tooltip with name and email) below 720px. As a
  `role="img"` it shows that tooltip on a tap too ([Tooltip](#tooltip), "On touch screens").
- With the keyboard up (2.0): on a phone the on-screen keyboard shortens the visual viewport, not the layout one.
  Call `DS.dom.followViewport()` once ([motion](motion.md#dsdom-jsdomjs)): it writes `--ds-viewport-height` (px) and,
  while the keyboard is up and a field has the focus, `data-ds-keyboard` on `<html>`, and `--ds-keyboard-inset` (px)
  for the snackbars, and scrolls the window back where the browser panned it for the keyboard. Nothing moves when
  there is no `visualViewport`.
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
DS.indicator.createIndicator(group, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' });
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
- `--ds-segmented-padding-x` (default `--ds-space-4`) narrows the options of a tight switch.
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
      <summary class="ds-drawer__heading ds-drawer__toggle">[icon chevronDown 20 .ds-chevron]<span>Tickets</span><span class="ds-drawer__count" aria-hidden="true">5</span></summary>
      <a class="ds-drawer__item" href="/tickets" aria-current="page" data-tip="Open tickets">[icon ticket 20]<span class="ds-drawer__label">Open</span><span class="ds-drawer__count"><span class="ds-sr">, </span>3</span></a>
      <div class="ds-drawer__row">
        <a class="ds-drawer__item" href="/tickets/waiting" data-tip="Waiting">[icon clock 20]<span class="ds-drawer__label">Waiting</span><span class="ds-drawer__count"><span class="ds-sr">, </span>2</span></a>
        <button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm ds-drawer__action ds-hover-actions" type="button" aria-label="Options for Waiting" data-tip="Options">[icon moreVertical 18]</button>
      </div>
    </details>
  </div>
  <div class="ds-drawer__foot">
    <a class="ds-drawer__item" href="/settings" data-tip="Settings">[icon settings 20]<span class="ds-drawer__label">Settings</span></a>
  </div>
</nav>
```

- `.ds-drawer__back`: a way up (from a record back to its list), between the head and the list, with a hairline under
  it inset to the text edge. Its item is a normal `.ds-drawer__item` that never carries `aria-current` and sits
  outside the pill's track. Above 900px a docked drawer with a back item hides the page head's back link
  (`.ds-page-head__back`), so the page shows one of them; the modal drawer leaves it to the page head.
- `.ds-drawer__actions` (above the list, a primary action) and `.ds-drawer__foot` (below it, clear of the home
  indicator of an installed app). `.ds-drawer__foot--rail` lays its items out icon-only in a row: their labels are
  visually hidden but read, and each item names itself with `data-tip`.
- `.ds-drawer__count`: a count at the end of an item or a group heading (tabular figures, the meta role, the item's
  colour). A `.ds-sr` separator reads it with the label ("Open, 3"). On a group heading it shows only while the group is
  closed (mark that one `aria-hidden`: its items say it).
- Collapsible groups: `<details class="ds-drawer__group ds-collapsible">` with a `<summary class="ds-drawer__heading
  ds-drawer__toggle">`. The heading is a pressable row of the item's height (`--ds-drawer-item-height`): state layer,
  ring snap, press morph and ripple; the chevron turns with the group, and the group opens and closes with the
  `.ds-collapsible` timing. The pill follows the current item across groups; an item inside a closed group has no pill
  (it contracts, and comes back when the group opens). Keep the open groups across loads in the page (`open`).
- `.ds-drawer__row` holds an item and a `.ds-drawer__action`, a quiet small icon button at the item's end (the item
  keeps room for it at the action's size, `--ds-btn-sm-icon-size`, so also under `.ds-touch`). With `.ds-hover-actions` the action shows on hover, focus, the current item and an open menu, and
  always on touch; it stays in the tab order.
- `<a>` drawer items no longer flash on tap in iOS (`-webkit-tap-highlight-color` on every item).
- Forced colours: the current item is `SelectedItem` / `SelectedItemText` (with its icon), a focused current item
  keeps a `CanvasText` ring inside its fill, and an `aria-disabled` item is `GrayText`; the outline is for focus only.

### The rail

`data-drawer-collapsed` on `.ds-app` turns the docked drawer (above 900px) into a rail of `--ds-drawer-rail-width`
(72px): items become 48px squares (circles by the pill rule), labels, headings and counts are visually hidden but
read, row actions go, and the pill follows by itself. Each item's `data-tip` names it there: its visible text is gone,
so the tooltip shows. The column switches at once; the labels fade back in on `--ds-dur-fast` when it widens again
(no layout animation; View Transitions stay for navigation). The modal drawer at 900px and below is unaffected.

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
<span class="ds-avatar ds-avatar--sm" aria-hidden="true">A</span> Ada Lovelace              <!-- next to the name -->
<img class="ds-avatar ds-avatar--lg" src="/people/ada.jpg" alt="">                          <!-- a picture -->
```

A disc on the tint (`--ds-accent` / `--ds-on-accent`) of `--ds-avatar-size` (32px; `--sm` 24px, `--lg` 40px), the
initial in a role that scales with it, a picture covering it. `.ds-account__avatar` is the same disc. No status dot:
a status goes next to the name as a word. Forced colours keep its edge.

### A message for the whole app

```html
<div class="ds-panel">
  <div class="ds-banner">
    <div class="ds-alert ds-alert--warning" role="status">[icon wifiOff 20]<span class="ds-alert__text">You are offline. Changes are saved when the connection is back.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Retry</button></div>
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
- `.ds-content` exposes its padding as `--ds-content-pad-top`, `--ds-content-pad-x` and `--ds-content-pad-bottom`
  (read them, never set them; `.ds-view` defines the same).

### A record's page head

```html
<header class="ds-page-head">
  <a class="ds-btn ds-btn--text ds-btn--sm ds-page-head__back" href="/devices">[icon arrowLeft 18]<span class="ds-sr">Back to </span>Devices</a>
  <div class="ds-page-head__row">
    <div class="ds-page-head__text">
      <h1 class="ds-page-head__title" tabindex="-1">LAPTOP-0042</h1>
      <p class="ds-page-head__lead">Latitude 7440 · issued to Ada Lovelace</p>
      <div class="ds-page-head__status"><span class="ds-status ds-status--ok">[icon check 16]<span>Synced</span></span></div>
    </div>
    <div class="ds-page-head__actions">
      <button class="ds-btn" type="button">Retire</button>
      <button class="ds-btn ds-btn--primary" type="button">Edit</button>
    </div>
  </div>
</header>
```

- `.ds-page-head__back`: the way back to the list, a small text button whose label lines up with the title; the
  `.ds-sr` prefix reads "Back to Devices". A docked drawer with a `.ds-drawer__back` item hides it above 900px.
- `.ds-page-head__row` wraps: `.ds-page-head__text` (title, lead, `.ds-page-head__status`) takes
  `--ds-page-head-text-basis` (320px) and grows; `.ds-page-head__actions` sit at the row's end on the title's centre
  line (`--ds-page-head-title-line`, the headline's 32px line) and start under the title at 600px of the content.
- A text button (`.ds-btn--text`) in the actions hangs its padding into the gutter, as in a card's link row: the last
  one's text ends on the content edge the cards share, and under the title each text button's text starts on the
  title's edge (the gap between them grows by the same amount). Outlined and filled buttons keep their place.
- Empty parts take no room (`:empty`: the head, the lead, the status and the actions). The lead's figures are
  tabular. Print leaves out the back link and the actions.

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

### Page states

A page that loads, fails or is gone says so in its body; the page head stays where it can:

- **Loading:** the body as a skeleton (`.ds-skeleton` with its note, [Loading](#loading)) under a `.ds-loadbar`.
- **Failed:** a `.ds-alert--error` with the reason and a Retry button (`.ds-btn--text`) in place of the body.
- **Gone** (deleted, no access): `.ds-empty` with a way back.

The page hides its body by an attribute of its own (`hidden` on the body, `data-state` is `DS.overlay`'s); never
leave a stale body visible under the state.

### Sign-in page

```html
<body class="ds-auth">                      <!-- in <html class="ds-theme ds-base"> -->
  <div class="ds-auth__alert"><div class="ds-alert ds-alert--error" role="alert">[icon alertCircle 20]<span class="ds-alert__text">The password is wrong.</span></div></div>
  <section class="ds-card ds-card--elevated ds-auth__card" aria-labelledby="auth-title">
    <h1 class="ds-card__title" id="auth-title">Sign in</h1>
    <form class="ds-form"> ...fields... <div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="submit">Sign in</button></div></form>
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
  <button class="ds-tabs__tab" role="tab" type="button" id="t-history" aria-selected="false" aria-controls="p-history" tabindex="-1" data-label="History">History<span class="ds-badge">3</span></button>
</div>
<div class="ds-tabs__panel" role="tabpanel" id="p-details" aria-labelledby="t-details" tabindex="0"> ... </div>
<div class="ds-tabs__panel" role="tabpanel" id="p-history" aria-labelledby="t-history" tabindex="0" hidden> ... </div>

<!-- link tabs -->
<nav class="ds-tabs" aria-label="Device">
  <a class="ds-tabs__tab" href="/devices/42" aria-current="page" data-label="Details">Details</a>
  <a class="ds-tabs__tab" href="/devices/42/history" data-label="History">History</a>
</nav>
```

```js
DS.indicator.createIndicator(tabs, { active: '[aria-selected="true"], [aria-current="page"]', className: 'ds-tabs__indicator', reveal: true });
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

- A row of `--ds-tabs-height` (48px) over a `--ds-line` hairline; labels in the label role at the regular weight in
  `--ds-text-2`. The selected tab takes `--ds-primary` ink, the label weight and the bar: a
  `--ds-tabs-indicator-height` (3px) bar in `--ds-tabs-indicator-color` (`--ds-primary`) at its bottom that glides
  between the tabs (`DS.indicator`, `.ds-tabs__indicator`). Selected is bar, weight and ARIA. `data-label` (the
  tab's text again) keeps the width of the heavier weight, so nothing moves; a `.ds-badge` after the text keeps its
  place.
- Press: the state layer is a pill inside the tab that turns squarer while pressed and springs back, with the ripple
  (`DS.ripple.attach()`); the keyboard ring is inset and snaps inward. `:disabled` and `aria-disabled="true"` take the
  disabled model (no hover, press or morph; `aria-disabled` keeps its focus layer).
- Switching: the page toggles `hidden` on the panels and enters the new one (`DS.motion.enter(panel, 'swap')`). Link
  tabs are navigation: `DS.motion.transition(update, { type: 'fade-through' })` ([Views](motion.md#views)).
- Overflow: the row scrolls sideways without a scrollbar (add `.ds-scroll-x` for its edge fades); `DS.dom.roving()`
  scrolls a focused tab into view, and `reveal: true` keeps the selected one in view.
- `.ds-tabs--fill`: equal widths across the row. `.ds-tabs--flush`: no hairline (the tabs sit on a card's edge).
- A panel that holds nothing focusable keeps `tabindex="0"`, so a keyboard reaches its content.
- Forced colours: the selected tab is `SelectedItem` / `SelectedItemText` (a choice in a set) and the bar is hidden;
  a focused selected tab keeps a `CanvasText` ring inside; blocked tabs are `GrayText`. Print wraps the row.

**Motion:** the "Tabs" row of [Navigation](motion.md#navigation) in motion.md.

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
</ol>

<!-- or a bar: the same items, the list says where the user is -->
<ol class="ds-steps ds-steps--bar" aria-label="Step 2 of 3"> ... </ol>
```

- `data-status="done"` on a finished step (the attribute of `.ds-tasks` too; never `data-state`, which `DS.overlay`
  writes) and `aria-current="step"` on the current one; the rest are upcoming.
- Marks are 24px discs: done `--ds-primary` with a check that draws itself when the step turns done in place
  (re-render with `DS.dom.morphHtml`, so the mark stays; steps rendered with done ones stay still on load), current
  `--ds-primary` with `--ds-on-primary` figures and its label in the label weight, upcoming an `--ds-outline` ring
  in `--ds-text-2`.
  Connectors are `--ds-line` hairlines, `--ds-primary` after a done step (colours on `--ds-dur-medium`). At 600px of
  the content only the current label shows; the others are still read.
- `.ds-steps--bar`: equal segments `--ds-steps-bar-height` (4px) high; done and current ones fill with `--ds-primary`
  (a clip that glides on `--ds-ease-value` over `--ds-dur-glide`), the rest is `--ds-accent`. Marks and labels are
  visually hidden; the list's `aria-label` ("Step 2 of 3") says where the user is.
- Moving between steps: `DS.motion.transition(update, { type: 'forward' })` (or `'back'`).
- Forced colours: done and current marks and segments are `Highlight`, upcoming ones `CanvasText` outlines.

## Button

```html
<button class="ds-btn" type="button">Cancel</button>                                  <!-- outlined -->
<button class="ds-btn ds-btn--outlined" type="button">Export</button>                 <!-- the same, explicit -->
<button class="ds-btn ds-btn--primary" type="submit">Save</button>                    <!-- the main action -->
<button class="ds-btn ds-btn--tonal" type="button">Add entry</button>                 <!-- softer main action -->
<button class="ds-btn ds-btn--text" type="button">Details</button>                    <!-- no frame -->
<button class="ds-btn ds-btn--quiet" type="button">[icon filter 16] Filter</button>   <!-- toolbar -->
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close">[icon close 20]</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="Minimize">[icon minimize 20]</button>
<button class="ds-btn ds-btn--sm" type="button">[icon plus 16] Add</button>         <!-- 32px -->
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit">[icon pencil 18]</button>  <!-- 32px round -->
<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true">[icon filter 16] Filter</button>  <!-- toggle, on -->
<button class="ds-btn ds-btn--primary" type="button" disabled>Save</button>
<button class="ds-btn ds-btn--primary" type="button" aria-disabled="true" aria-describedby="why">Publish</button>
<button class="ds-btn ds-btn--primary" type="button">                              <!-- faces: busy and done -->
  <span class="ds-btn__faces">
    <span class="ds-btn__face">Save</span>
    <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Saving</span>
    <span class="ds-btn__face ds-btn__face--done" aria-hidden="true">[icon check 16]Saved</span>
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

A choice made once, then locked (a vote, an answer that was sent): the pressed toggle keeps its on look while
`aria-disabled`, its siblings dim:

```html
<div role="group" aria-label="Was this helpful?">
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="true" aria-disabled="true" aria-label="Helpful">[icon thumbUp 20 ds-icon--fillable]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-disabled="true" aria-label="Not helpful">[icon thumbDown 20 ds-icon--fillable]</button>
</div>
```

```js
await DS.motion.busy(saveButton, () => fetch(url, { method: 'POST', body }));   // busy, then "Saved" for a moment
DS.motion.crossfade(copySlot, DS.icons.icon(DS.icons.check, 20), { kind: 'icon' });  // copy to check
```

- Every action is a pill. One filled `--primary` per area; there are no red buttons (name the consequence:
  "Delete 3 devices").
- A leading icon pulls the start padding to 12px, also the icon of the first face of `.ds-btn__faces`.
- `.ds-btn--sm` reads `--ds-btn-sm-height` (32px) and, with `--icon`, `--ds-btn-sm-icon-size` (32px): set those to
  change every small button, never `--ds-btn-height` on the modifier.
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
  and the button turns into a round quiet icon button (`--ds-btn-icon-size`, with `--sm`
  `--ds-btn-sm-icon-size`; the icon at 20px). Its accessible name stays the label; give it a `data-tip` with the
  same words, which shows only while the label is folded (a tip equal to the visible text shows only while it is cut
  off, [Tooltip](#tooltip)).
- Quiet links: `.ds-link--quiet` on a link and `.ds-link-btn--quiet` with `.ds-link-btn` take the quieter ink
  (`--ds-text-2`) and a hairline underline (`--ds-line-2`, the link underline geometry), the link colour and
  `--ds-link-underline-hover` on hover; still underlined. For secondary links next to the main one.
- A text button that underlines on hover (`--ds-btn-hover-decoration: underline`) draws it with the link geometry
  (`--ds-link-underline-thickness`, `--ds-link-underline-offset`).
- Press: the state layer comes in `--ds-dur-micro` and the shape turns squarer (`--ds-radius-action-pressed`, 12px;
  hook `--ds-btn-radius-pressed`), then springs back on release (`--ds-ease-spatial`, `--ds-dur-medium`); with
  `DS.ripple.attach(document)` a ripple grows from the pointer ([Ripple](#ripple)) and `.ds-pressed` keeps a quick
  click visible. The rest radius is `min(radius, half the height)`, so the morph runs the whole way; a pressed
  radius is never rounder than the rest radius (square themes stay square). Disabled, `aria-disabled`, busy and done
  buttons show no press. `.ds-btn--disc` morphs and ripples like every pill. Nothing scales or moves.
- Focus: the ring is solid from the first frame and snaps from 4px to its 2px offset in `--ds-dur-fast`, with the
  focus layer (`--ds-state-focus`, hook `--ds-btn-state-focus-opacity`; `--disc` shows its disc). An
  `aria-disabled` button keeps the focus layer.
- Busy and done, without a width jump: `.ds-btn__faces` stacks every `.ds-btn__face` in one grid cell, so the
  button is as wide as its widest face. `aria-busy="true"` blocks it at once and shows `.ds-btn__face--busy` only
  after `--ds-delay-loader` (a fast save shows nothing); `.ds-btn--done` (blocked as well) shows
  `.ds-btn__face--done`, whose `pathLength="1"` check (`DS.icons.check`) draws itself. The faces roll: the leaving
  face rises and fades in `--ds-dur-instant`, the next one rises in over `--ds-dur-fast`; back to rest they roll
  down. `DS.motion.busy(button, work, { done })` ([motion.md](motion.md)) sets and clears both, keeps a busy face
  that showed for the loader minimum and the success face for `--ds-hold-success`. Announce the result with
  `DS.overlay.announce()` (or a snackbar, which announces itself).
- Icon swap: `.ds-icon-swap` holds `.ds-icon-swap__a` and `.ds-icon-swap__b` in one cell; `data-swap="b"`, or an
  `aria-pressed="true"` ancestor (a play/pause toggle), shows b. The incoming icon fades in and springs up from
  `--ds-scale-small`, a `pathLength="1"` glyph draws itself, the outgoing icon only fades; a crossfade with a scale,
  not a path morph ([motion.md](motion.md)).
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the press, focus, busy and success rows of [Controls](motion.md#controls) in motion.md.

## Card

```html
<section class="ds-card">
  <div class="ds-card__row">
    <h2 class="ds-card__title">Sync</h2>
    <button class="ds-btn ds-btn--sm" type="button">Run now</button>
  </div>
  <p class="ds-muted">Runs every night at 02:00.</p>
  <h3 class="ds-card__subtitle">Sources</h3>
  <ul class="ds-plain-list"><li>Directory</li><li>Asset database</li></ul>
  <div class="ds-subsection">
    <h3 class="ds-card__subtitle">Advanced</h3>
    <p>...</p>
  </div>
  <nav class="ds-card__links" aria-label="Related">
    <a class="ds-btn ds-btn--text ds-card__link" href="/runs">Run history [icon arrowRight 16]</a>
  </nav>
</section>

<section class="ds-card ds-card--filled"> ... </section>   <!-- quieter block inside a card or form -->
<div class="ds-more"><button class="ds-btn" type="button">Load more</button></div>
```

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
    <button class="ds-btn ds-btn--sm" type="button">Restart</button>
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
- A disabled or `aria-disabled="true"` card shows no hover or press layer and does not morph; an `aria-disabled` card
  keeps its focus layer.
- Nothing moves on hover, no lift and no scale. A theme may add a shadow on hover with `--ds-card-hover-shadow`
  (default none; for example `var(--ds-elev-hover)`), in over `--ds-dur-medium`, out over `--ds-dur-base`.
- In forced colours every interactive card keeps a visible edge (`.ds-card--filled` included) and the focus ring; an
  `aria-disabled` card turns `GrayText`.

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
</div>
```

- Selected, the card takes `--ds-card-selected-bg` (`--ds-accent`) with `--ds-on-accent` ink and a static inset ring
  (a border of `--ds-focus-width` in `--ds-selected-ring`, `--ds-primary`, on the card's own `::after`), so the
  focus ring stays free and both read at once (a border survives forced colours; a `box-shadow` ring does not). The
  colours change on `--ds-dur-fast`, the ring shows at once. Add a check or the label weight: never the tint alone.
  Forced colours: `Highlight` / `HighlightText`.
- `.ds-card--elevated`: a card that floats a little (`--ds-card-shadow`, `--ds-elev-1`) instead of the hairline; in
  forced colours its edge comes back.
- `.ds-card__title` wraps long words and lines up a leading icon (`[icon ... 20]` first) with its words.
- `.ds-card__links` hangs only text buttons and `.ds-card__link` into the card's margin; an outlined button there keeps
  its place.
- Print: a short card is never split across pages.

**Motion:** the press morph of [Controls](motion.md#controls) (`.ds-card--interactive`) and the "Alert, tile, card" row of [Feedback](motion.md#feedback).

## Tiles

```html
<div class="ds-tiles">
  <div class="ds-tile">
    <p class="ds-tile__label">[icon alert 16]<span>Overdue</span></p>
    <p class="ds-tile__value">12</p>
    <p class="ds-tile__note">3 more than last week</p>
  </div>
  ... (as many per row as fit at 176px, at most four)
</div>
```

The row fills its container, whatever it is (a page, a dialog, a side sheet, beside the drawer): as many tiles per row
as fit at `--ds-tile-min-width` (176px), never more than `--ds-tiles-columns` (4), each row filled. `.ds-tiles--3`
caps the row at three. A single figure that opens a list is one `a.ds-tile`, also outside `.ds-tiles`.

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

**Motion:** the "Alert, tile, card" row of [Feedback](motion.md#feedback) (`countUp()`, the press morph) in motion.md.

## Disclosure

A `<details>` with the system's summary (2.0): advanced settings, or sections that open one at a time.

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

- The plain summary is a pill in the label font, at least `--ds-disclosure-height` (40px) high, whose state layer
  hangs `--ds-space-2` into the space at its sides (its text stays in line with the content around it): hover
  `--ds-state-hover`, press in `--ds-dur-micro`, the focus layer and a ring that snaps in, the press morph and the
  ripple. `.ds-disclosure__body` starts `--ds-space-3` below it.
- `.ds-disclosure--row`: a full-width summary (`--ds-disclosure-row-height`, 48px) with `.ds-disclosure__title`,
  `.ds-disclosure__meta` in `--ds-text-2` and the chevron at the end. Rows in a `.ds-disclosure-list` are divided by
  hairlines and run to the edges of a card (`--ds-card-pad`); a row takes a rectangular layer, an inset ring and the
  ripple, no morph.
- It opens and closes like every `.ds-collapsible` and the `.ds-chevron` turns with it. Rows with the same `name`
  open one at a time where the browser supports it (progressive; elsewhere each opens on its own). The errors list
  of an alert (`.ds-errors`) keeps its own summary.

**Motion:** `.ds-collapsible` and `.ds-chevron` in [Utilities](motion.md#utilities-css) and the press of
[Controls](motion.md#controls) in motion.md.

## Lists

```html
<ul class="ds-kv-list">
  <li><span>Model</span><strong>Latitude 7440</strong></li>
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
    <span class="ds-status ds-status--warning">[icon alert 16]<span>Warranty ends</span></span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="More for LAPTOP-0042">[icon moreVertical 18]</button></span>
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
  weight). In forced colours the current row is `SelectedItem`; its other controls and chips take the system
  colours again, on `Canvas`, so they stay legible on the fill.
- Re-render with `DS.dom.morphHtml` and keyed rows (`data-ds-key`) inside `DS.motion.flip(list, ...)`: rows glide to
  their places on an opaque backing, new rows fade in over `--ds-dur-fast`, a removed row fades out while the rows
  below close the gap, and focus moves to its neighbour.

### Key-value rows that open, bars, facts in rows and the lock

```html
<ul class="ds-kv-list ds-kv-list--interactive">
  <li><a class="ds-kv-list__row" href="/owners/7"><span>Owner</span><strong>Ada Lovelace</strong></a></li>
  <li><button class="ds-kv-list__row" type="button"><span>Tickets</span><strong>3 open</strong></button></li>
  <li><div class="ds-kv-list__row"><span>Serial</span><strong>5CD1234XYZ</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Backup</span><strong>[icon checkCircle 16 .ds-kv-list__icon .ds-kv-list__icon--ok]<span class="ds-sr">Passed:</span> Today, 02:00</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Asset tag</span><strong class="ds-muted">Not set</strong></div></li>
</ul>

<ul class="ds-kv-list ds-kv-list--bars">
  <li><span>Disk</span><strong>78%</strong><span class="ds-meter ds-meter--warning" aria-hidden="true"></span></li>
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
- `.ds-kv-list__icon` before a value, with `.ds-kv-list__icon--ok`, `.ds-kv-list__icon--warning` or
  `.ds-kv-list__icon--error` (`--ds-success`, `--ds-warning`, `--ds-error`), always with a `.ds-sr` word. `strong.ds-muted` is a quiet value ("Not set") in the regular weight.
- `.ds-kv-list--bars` puts a [meter](#charts) under each row, `aria-hidden` (the figure is in the text); the label
  stays on one line and ends in an ellipsis (give it a `data-tip` with the full text).
- `.ds-facts--rows`: each fact on a row of its own, the label in a column of `--ds-facts-label-width` (36%) in the
  body font, hairlines between; under 520px of content (or in a window of 600px and less) the label goes above its
  value.
- `.ds-lock` marks a value another system sets: the `lock` glyph, the reason in `aria-label` and `data-tip`. It is
  not an action and takes no `tabindex` (a tap shows the tip); name the reason once per card in a `.ds-meta` line.
  A locked value is text, never a disabled field ([rules.md](rules.md#state-and-feedback)).

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) and the press of
[Controls](motion.md#controls) in motion.md.

## Timeline

The history of a record (2.0): entries on a rail, grouped by day.

```html
<ol class="ds-timeline" role="list" aria-label="History of LAPTOP-0042">
  <li class="ds-timeline__group" role="presentation"><h3 class="ds-timeline__day">12 Oct 2026</h3></li>
  <li class="ds-timeline__item" data-ds-key="e3">
    <div class="ds-timeline__head">
      <p class="ds-timeline__title">Issued</p>
      <span class="ds-status ds-status--ok">[icon check 16]<span>Active</span></span>
    </div>
    <p class="ds-timeline__meta"><time datetime="2026-10-12T14:05">14:05</time> · Ada Lovelace</p>
    <p class="ds-timeline__text">Issued to Ada Lovelace.</p>
    <div class="ds-timeline__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button" aria-label="Edit the entry of 12 Oct 2026, 14:05">Edit</button></div>
  </li>
  <li class="ds-timeline__item ds-timeline__item--muted" data-ds-key="e2">
    <div class="ds-timeline__head"><p class="ds-timeline__title">Return planned</p></div>
    <p class="ds-timeline__text">Cancelled: the loan was extended.</p>
  </li>
  <li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="e1">
    <span class="ds-timeline__marker" aria-hidden="true">[icon user 16]</span>
    <div class="ds-timeline__head"><p class="ds-timeline__title">Owner changed</p></div>
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
  effect; say why in words. `.ds-timeline__item--icon` with `.ds-timeline__marker`: a disc of
  `--ds-timeline-marker-size` (24px) on `--ds-surface-high` with a 16px icon instead of the dot (an activity feed:
  who or what did it).
- `.ds-timeline__head` (title and a status chip, wrapping), `.ds-timeline__title` (label font), `.ds-timeline__meta`
  (meta font: the `<time>` and who), `.ds-timeline__text` (keeps its line breaks, `--ds-measure` wide),
  `.ds-timeline__body` (a form in place) and `.ds-timeline__actions` (text buttons hang their padding, so their labels
  line up with the text; name the entry in each button's `aria-label`).
- No motion of its own: entries come and go through `DS.motion.flip` with keyed entries (a removed entry moves focus
  to its neighbour; a live feed passes `live: true`), editing in place swaps the text and the form through
  `DS.motion.crossfade` ([motion.md](motion.md#recipes)). The dot is drawn with borders, so it stays in forced colours.

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) in motion.md.

## Tasks

The steps of a job (2.0): an import, a setup, a migration, each step pending, running, done or failed.

```html
<div class="ds-tasks__head"><h3 class="ds-card__title">Set up LAPTOP-0042</h3><p class="ds-meta">2 of 4</p></div>
<ol class="ds-tasks" aria-label="Steps">
  <li class="ds-tasks__item" data-status="done"><span class="ds-tasks__mark">[icon checkCircle 20]</span><span class="ds-tasks__text">Copy the image<span class="ds-sr">: done</span></span></li>
  <li class="ds-tasks__item" data-status="failed"><span class="ds-tasks__mark">[icon alertCircle 20]</span><span class="ds-tasks__text">Join the domain: failed, the server did not answer</span></li>
  <li class="ds-tasks__item" data-status="running"><span class="ds-tasks__mark"><span class="ds-spinner ds-spinner--sm"></span></span><span class="ds-tasks__text">Install updates<span class="ds-sr">: running</span></span></li>
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
  <table><thead><tr><th>Model</th><th>Years</th></tr></thead><tbody><tr><td>Latitude 7440</td><td>4</td></tr></tbody></table>
  <hr>
  <p>Ask <mark>IT support</mark> when in doubt.</p>
</div>

<pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1
Accept: application/json</code></pre>
```

- `.ds-prose` styles only bare elements inside it, under `:where(.ds-prose)`, so any class of the page wins: the
  margins reset, then one gap of `--ds-prose-gap` (`--ds-space-2`) between blocks and `--ds-space-5` above a
  heading; `h1` headline, `h2` subtitle, `h3` and `h4` the label weight at the reading size; lists indented
  `--ds-space-5` with `--ds-space-1` between items; `strong` in `--ds-prose-strong-weight` (the label weight); links
  underlined like every link; a `pre` is a code block; a `table` gets hairline rows, a `--ds-text-2` head and tabular
  figures and scrolls sideways when it is wider; a `blockquote` is a `--ds-surface-high` block on `--ds-radius-card`;
  images are never wider than the text. Font `--ds-prose-font` (`--ds-font-reading`); `.ds-prose--dense` takes
  `--ds-font-body` (in a card, a chat bubble, a side sheet). Long words hyphenate where the browser can (progressive:
  `hyphenate-limit-chars`, only words of 18 characters or more), else break.
- `.ds-code-block`: the code role on `--ds-code-bg` in the card radius, one line per line (`white-space: pre`, tab
  size 2), scrolling sideways with a thin scrollbar. Give it `tabindex="0"` and a name (`aria-label`) only when it can
  scroll sideways, so a keyboard reaches it (an inset ring). A `code` inside loses the inline chip.
  `.ds-code-block--wrap` wraps long lines instead.
- Under `.ds-base` bare headings take the type roles already (`h1` headline, `h2` subtitle, `h3` to `h6` the label
  role, no margins); `.ds-prose` keeps a reading hierarchy for rendered text.
- Forced colours: quotes and code blocks keep their edge. Print: code blocks and tables wrap.

## Empty state

```html
<div class="ds-empty">
  <span class="ds-empty__disc" aria-hidden="true">[icon box 24]</span>
  <p class="ds-empty__title">No devices yet</p>
  <p class="ds-empty__text">Add the first one or import a list.</p>
  <button class="ds-btn ds-btn--tonal" type="button">Add device</button>
</div>
```

At most one sentence and one action. It has no motion of its own; how it comes depends on what brought it
([motion.md](motion.md#data-motion)):

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
the node. Forced colours: the disc keeps an outline.

**Motion:** [Data motion](motion.md#data-motion) in motion.md.

## Status chip

```html
<span class="ds-status ds-status--ok">[icon check 16]<span>Synced</span></span>
<span class="ds-status ds-status--warning">[icon alert 16]<span>Expires soon</span></span>
<span class="ds-status ds-status--error">[icon alert 16]<span>Failed</span></span>
<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span>
<span class="ds-status">[icon clock 16]<span>Waiting</span></span>
<span class="ds-status">[icon ban 16]<span>Off</span></span>
```

Always icon and word. Show chips for deviations, not for the normal case. When the label of a running chip changes,
update the text node only, so the spinner does not restart (`DS.dom.morphHtml`).

Status changes glide, for a user action and a poll alike: render with `DS.dom.morphHtml`, which patches the kept
chip in place, so its container and icon change colour over `--ds-dur-medium` (250ms); an icon or spinner that
comes in new (running to ok) fades in and springs up from `--ds-scale-small` (progressive: `@starting-style`, which
also plays on a chip's first render; elsewhere the icon swaps at once). A row that a keyed `morphHtml` moves (a sort)
keeps its icon as it is: where `moveBefore` is missing, the moved node carries `data-ds-moving` for one style flush,
so the entrance never plays again. The label text changes at once. A page that swaps the icon itself can cross-fade it with `DS.motion.crossfade(chip, icon, { kind: 'icon' })`.

### Tags

A tag is a label of words ("Preview", "Beta", "External"), not a state and not a count; it is not interactive:

```html
<span class="ds-tag">Preview</span>
<span class="ds-tag ds-tag--neutral">[icon tag 16]External</span>
```

The caption type on the tint (hooks `--ds-tag-bg`, `--ds-tag-color`, from `--ds-accent` and `--ds-on-accent`;
`--neutral`: `--ds-surface-high` and `--ds-text`), an optional leading 16px icon (`--ds-on-accent-icon`), the pill
radius at half its height (`--ds-tag-height`, 24px). Forced colours draw a `CanvasText` outline. Tag = words, badge
= counts ([Badge](#badge)), status chip = a state with an icon.

**Motion:** the "Status chip" row of [Feedback](motion.md#feedback) in motion.md.

## Badge

A count on a button, chip, tab or drawer item:

```html
<button class="ds-btn" type="button">[icon mail 16]Inbox <span class="ds-badge">3</span></button>
<label class="ds-chip"><input class="ds-chip__input" type="checkbox" name="state" value="failed"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Failed</span> <span class="ds-badge ds-badge--error">2</span></span></label>
<span class="ds-badge ds-badge--neutral">12</span>
```

- A pill of at least `--ds-badge-size` (20px) in the caption type with tabular figures, on the tint
  (`--ds-badge-bg`, `--ds-badge-color`: `--ds-accent`, `--ds-on-accent`; radius `--ds-badge-radius`, never above half
  the size).
  Tones `.ds-badge--neutral`, `.ds-badge--ok`, `.ds-badge--warning`, `.ds-badge--error` take their container pair; a toned badge needs its word in the
  row ("Failed", "2 errors"): colour is never the only signal. An empty badge takes no room.
- On a tinted host (a pressed toggle, `.ds-btn--tonal`, an open disclosure button, a checked chip, an input chip, a
  selected table row) the default badge turns to `--ds-primary` / `--ds-on-primary` and the neutral one to
  `--ds-surface` / `--ds-text-2`, so it never melts into the tint. In a disabled or `aria-disabled` button, chip, tab
  or drawer item it takes the disabled model over any tone (`--ds-disabled-fill`, `--ds-disabled-ink`; a theme that
  dims instead keeps its colours and fades it with the host). Forced colours: `Canvas` and `CanvasText` with a
  `CanvasText` outline (`GrayText` in a blocked host).
- Motion: colours glide on `--ds-dur-fast`. A count that appears pops in (`DS.motion.enter(badge, 'pop')`), one that
  goes pops out (`DS.motion.leave(badge, 'pop', { then: 'hide' })`); the number itself changes at once, and nothing
  plays on load ([motion.md](motion.md#a-count-badge)).
- Give the host an accessible name that includes the count where it matters (`aria-label="Inbox, 3 new"`), or keep the
  number in the text as above.

**Motion:** the recipe [A count badge](motion.md#a-count-badge) in motion.md.

## Alert

```html
<div class="ds-alert" role="status">[icon info 20]<span class="ds-alert__text">Sync runs at night.</span></div>
<div class="ds-alert ds-alert--success">[icon checkCircle 20]<span class="ds-alert__text">All devices synced.</span></div>
<div class="ds-alert ds-alert--warning">[icon alert 20]<span class="ds-alert__text">The certificate expires in 5 days.</span>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button></div>
<div class="ds-alert ds-alert--error" role="alert">[icon alertCircle 20]<span class="ds-alert__text">Could not load devices.</span>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Try again</button></div>

<details class="ds-errors ds-collapsible">
  <summary>[icon alertCircle 16]2 errors[icon chevronDown 16 ds-errors__chevron]</summary>
  <ul><li>Row 4: unknown model</li><li>Row 9: duplicate serial</li></ul>
</details>
```

The plain `.ds-alert` is the neutral (information) alert: quiet surface, primary icon, no modifier.

A title, more paragraphs and actions; findings in a card (`.ds-alert--plain`):

```html
<div class="ds-alert ds-alert--warning">[icon alert 20]
  <div class="ds-alert__text"><p class="ds-alert__title">Certificate expires soon</p><p>Renew it before 1 May.</p></div>
  <div class="ds-alert__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Remind me</button></div>
</div>

<section class="ds-card">
  <h2 class="ds-card__title">Findings</h2>
  <div class="ds-alert ds-alert--plain ds-alert--error">[icon alertCircle 20]<span class="ds-alert__text"><strong class="ds-alert__title">Disk almost full</strong> 92% used on drive C.</span></div>
  <div class="ds-alert ds-alert--plain ds-alert--warning">[icon alert 20]<span class="ds-alert__text">Warranty ends in 30 days.</span></div>
</section>
```

- `.ds-alert__title` (the label font, the alert's ink) opens `.ds-alert__text` in every alert; paragraphs in the text
  lose their margins and stand `--ds-space-2` apart.
- `.ds-alert__actions` after the text holds one or more buttons side by side; the alert then wraps, the text takes at
  least `--ds-alert-text-basis` (256px) and the actions drop under it on a narrow row.
- `.ds-alert--plain`: a finding in a card, on the card's surface: no fill, no edge, no inline padding, no radius, the
  kind's icon; hairlines between consecutive plain alerts. Static findings carry no live role.
- Hooks (13, [theming.md](theming.md#component-hooks)): `--ds-alert-bg`, `--ds-alert-color`, `--ds-alert-icon` (also the
  edge colour), `--ds-alert-edge` (a leading edge's width, default none: `4px` gives the edge look), and per kind
  `--ds-alert-success-bg`, `--ds-alert-success-color`, `--ds-alert-success-icon`, `--ds-alert-warning-bg`,
  `--ds-alert-warning-color`, `--ds-alert-warning-icon`, `--ds-alert-error-bg`, `--ds-alert-error-color` (also the
  ink of an error alert's buttons), `--ds-alert-error-icon`. Forced colours: a transparent outline becomes the edge.
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

```html
<section class="ds-card">
  <div class="ds-table-wrap">
    <table class="ds-table">                      <!-- ds-table--dense: 40px rows -->
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
          <td><span class="ds-status ds-status--ok">[icon check 16]<span>OK</span></span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

- 48px head, 52px rows, hairlines, no zebra. In a card the table runs to the card edges.
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
  and `data-ds-overflow-end`; without it the static fade at the right edge stays. The fade is `--ds-scroll-fade`
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
      <td><span class="ds-status ds-status--ok">[icon check 16]<span>OK</span></span></td>
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
  its base) and `--ds-table-row-line` (the style of its hairline). They are internal: a page never sets them; to
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
  where alt text for generated content exists (progressive; Safari 16.4 reads them once more). The table keeps its
  table roles in every engine.
- In a card the blocks keep the card's padding. No row hover and no edge fade; rows keep `data-ds-key`, so `flip()`
  and `morphHtml` work as in any table.
- Not combinable: `.ds-table--interactive`, expandable rows and sort buttons (the header is hidden: offer sorting
  elsewhere). A `.ds-table-wrap--fill` or `.ds-table--pin-first` steps aside while the rows stack.

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
  (`scroll-padding`). The ends fade as in a card ([Horizontal scroller](#horizontal-scroller)), while the border and
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
  no hover, press or row link.
- Density hooks: the header cells are `--ds-table-head-height` (48px), the rows `--ds-table-row-height` (52px) and
  `.ds-table--dense` rows `--ds-table-dense-row-height` (40px); the cells' block padding follows the heights.

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
  `.ds-toolbar`), where it takes the full width.
- "Clear selection" unchecks every row and moves focus to the header checkbox (the bar goes). In forced colours the
  bar keeps an outline; in print it is hidden.

**Motion:** the "Table" row of [Feedback](motion.md#feedback) and [Data motion](motion.md#data-motion) in motion.md.

## Pagination

```html
<section class="ds-card">
  <div class="ds-table-wrap"><table class="ds-table">...</table></div>
  <nav class="ds-pagination" aria-label="Pages of devices">        <!-- ds-pagination--simple: previous and next only -->
    <div class="ds-pagination__size">
      <label class="ds-pagination__label" for="pp">Rows per page</label>
      <select class="ds-input ds-input--filled" id="pp"><option>25</option><option selected>50</option><option>100</option></select>
    </div>
    <p class="ds-pagination__range" aria-live="polite">1–50 of 128</p>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="First page" aria-disabled="true" data-tip="First page">[icon chevronFirst 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" aria-disabled="true" data-tip="Previous page">[icon chevronLeft 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page">[icon chevronRight 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Last page" data-tip="Last page">[icon chevronLast 20]</button>
  </nav>
</section>
```

- The footer of a table whose records come in pages: rows per page, the range shown (`--ds-font-meta`, tabular
  figures) and the buttons, end-aligned. After the `.ds-table-wrap` of a card it sits right under the table with a
  hairline and runs to the card's edges. When the content area is at most 600px wide the size field drops and the
  range leads. No numbered pages (a project that needs them builds them from `.ds-btn`s).
- A button that leads nowhere (first and previous on the first page) takes `aria-disabled="true"`, not `disabled`:
  a focused "Next" that turns blocked on the last page keeps the focus, the click is blocked, and its tooltip still
  names it. `.ds-pagination--simple` leaves out first and last.
- The page holds the page number. A page change dims the rows (`.ds-stale` and the loading bar) while the page
  loads, then renders them with `DS.motion.flip(tbody, (o) => DS.dom.morphHtml(tbody, rows, o), { items: 'tr' })`:
  every key is new, so the old rows go at once and the new ones fade in; the range text changes at once. Hidden in
  print.

**Motion:** a page change in [Data motion](motion.md#data-motion) in motion.md.

## Horizontal scroller

```html
<div class="ds-scroll-x" tabindex="0" role="region" aria-label="Months">   <!-- the tab stop: only when nothing inside takes focus -->
  <div class="my-months">...</div>                                         <!-- content wider than the panel -->
</div>
```

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
  Keyboard focus inside lands outside the fades (`scroll-padding-inline`).
- When nothing inside can take focus, the strip is the tab stop (`tabindex="0" role="region" aria-label`), as WebKit
  gives a scroller none by itself: arrow keys scroll it, its ring is inset and the fades drop while it is focused.
- Print: the strip shows all of its content, unmasked.

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
  <label class="ds-check ds-check--sm"><input type="checkbox" name="clear"><span>Delete the saved key</span></label>

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
    <button class="ds-btn ds-btn--primary" type="submit">Save</button>
    <button class="ds-btn ds-btn--text" type="button">Cancel</button>
    <p class="ds-meta">Last saved today, 09:12</p>
  </div>
</form>
```

- 40px fields, label above (never only a placeholder), focus as an instant 2px ring inside the field. On blur the
  border, the inner ring and the text colour fade back together, so the ring never fades as half a ring.
- The label of a field (`.ds-field__label` before the field, or the `<legend>` of a fieldset) takes the primary
  colour with the ring, at once, and fades back on blur; the label of an invalid field keeps the error ink, also
  while focused (the control directly in `.ds-field` or in its `.ds-input-group`, `.ds-field__row` or `.ds-combo`).
  A focused invalid input group rings in the error colour alone, like a focused invalid field.
- Error: `aria-invalid="true"` plus a `.ds-field__hint--error` with an icon, linked by `aria-describedby`. The
  message fades in when it appears (inserted, or filled from empty), not when its text changes; where the browser
  can animate height to `auto` and focus is in its form (`<form>`, `.ds-form`) or `.ds-field` (validation on blur
  or on submit), its room also opens from 0 (on `--ds-ease-out`, so the form below never overshoots). A message
  already in the markup only fades in, so nothing shifts on load. Removing it is instant.
- Disabled and read-only (`readonly`) fields take the quiet surface. A `<datalist>` field shows the select triangle.
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
- A `.ds-check` row is `--ds-check-height` tall (40px; `--sm`: `--ds-check-sm-height`, 32px) around one line of its
  label. A long label wraps (even a bare text node, `overflow-wrap: anywhere`) and the box stays beside its first line.
- Radio cards (`.ds-radio`) have a state layer and the ripple, and turn squarer while pressed
  (`--ds-radius-card-pressed`), springing back on release; keyboard focus rings the whole card and lays the focus
  layer (`--ds-state-focus`) at once (its input has no halo); `.ds-radio--disabled` and a card whose input is
  disabled or `aria-disabled` have none, keep their border on hover and take the quiet look (`--ds-line` border,
  `--ds-surface-low`, the title in `--ds-text-2`; a checked one keeps its selected look).
- Date and time fields (`date`, `datetime-local`, `month`, `week`, `time`) draw their picker button as the icon
  set's `calendar` (`time`: `clock`) in the quieter text colour; side by side in `.ds-filters`, `.ds-inline-form`
  and the two- and three-column grids they take less padding at 720px and below, so the value is not cut off.
- Field hooks: `--ds-input-height`, `--ds-input-bg`, `--ds-input-border`, `--ds-input-radius` and
  `--ds-input-focus-color` (the ring and the label tint), [theming.md](theming.md#component-hooks).
- Forced colours: a focused field (also an input group, a filled field and the composer) shows a `Highlight`
  outline, since its inset ring is a shadow that forced colours drop.

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
- `.ds-field__optional` marks the few optional fields (the recommended way); where most fields are optional, mark
  the required ones with an `aria-hidden` `.ds-field__required` asterisk and `required` on the input (screen readers
  announce that).
- `.ds-field__foot` puts the hint and a `.ds-field__counter` in one row (the counter at the end, tabular). The counter
  is `aria-hidden` and the page updates it on `input`; near the limit the page announces what is left once.

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
    <span class="ds-input-group__affix" aria-hidden="true">GB</span>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="pw">Password</label>
  <div class="ds-input-group">
    <input class="ds-input" id="pw" type="password" autocomplete="current-password">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Show password" aria-pressed="false" aria-controls="pw">
      <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon eye 18]</span><span class="ds-icon-swap__b">[icon eyeOff 18]</span></span></button>
  </div>
</div>
```

- `.ds-field__row`: the field takes the room, its buttons keep their size; `.ds-field__row--top` aligns them to the
  start, beside a textarea.
- `.ds-input-group` draws the field (border, radius, background, `--ds-input-height`) and the `.ds-input` inside
  loses its box. The ring moves to the group while the input has the focus (at once, fading back on blur); a focused
  trailing button shows its own ring instead. `aria-invalid="true"` on the input turns the group's border, disabled
  or `readonly` its surface. An affix (a unit, a prefix such as `https://`) is `aria-hidden`, so the unit belongs in
  the label too.
- The reveal is the page's two lines: toggle the input's `type` between `password` and `text`, and the button's
  `aria-pressed` (the icon swap follows it).

**The filled field**

```html
<div class="ds-field ds-field--inset">
  <label class="ds-field__label" for="title">Title</label>
  <input class="ds-input" id="title" value="Quarterly report">
  <small class="ds-field__hint">Shown in the list.</small>
</div>
```

The Material 3 filled field: the label sits inside a tonal box above the value (still a real `<label>`), a hairline
closes the box at the bottom and turns into a 2px line in `--ds-input-focus-color` while the field has the focus.
Hints follow below the box. In forced colours the fill is gone, so the box keeps a transparent border (its edge
there) and a focused field shows the outline.

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
  <div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="submit">Save</button></div>
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
const pill = DS.indicator.createIndicator(group, { active: '.ds-radio:has(input:checked)', className: 'ds-radios__indicator' });
group.addEventListener('change', () => pill.update()); // checking a radio changes no attribute
```

**Slider**

```html
<div class="ds-field">
  <label class="ds-field__label" for="keep">Keep history for</label>
  <div class="ds-field__row">
    <input class="ds-slider" id="keep" type="range" min="7" max="365" value="90" aria-describedby="keep-out">
    <output class="ds-slider__value" id="keep-out" for="keep">90 days</output>
  </div>
</div>
```

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

Disabled and `aria-disabled` sliders take the disabled ink and no halo. Forced colours: the track in `ButtonText`,
the handle in `Highlight`.

**Growing textarea and the composer**

```html
<textarea class="ds-input ds-input--grow" rows="1" aria-label="Note"></textarea>

<form class="ds-composer">
  <textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Write a message"></textarea>
  <button class="ds-btn ds-btn--primary ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">[icon send 20]</button>
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
  <button class="ds-btn ds-btn--primary" type="submit">Save</button>
  <button class="ds-btn ds-btn--text" type="button">Cancel</button>
</div>
```

At 600px and below the action row of a long form sticks to the bottom of its scroller: a surface bar with a static
hairline that bleeds to the page's padding (`--ds-content-pad-x`) or a card's (`--ds-card-pad`) and keeps clear of
the home indicator (`env(safe-area-inset-bottom)`).

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

**Motion:** the check, radio, focus, validation, confirmation, changed dot, search key, radio tile and slider rows
of [Controls](motion.md#controls) in motion.md.

## Chips

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
- Hooks: `--ds-chip-height` (32px), `--ds-chip-check-size` (18px), `--ds-chip-disabled-border`,
  `--ds-chip-disabled-bg` (the container of a disabled selected chip), `--ds-chip-input-bg`, `--ds-chip-input-color`,
  `--ds-chip-input-border` (input chips), `--ds-chip-max-width` (240px, button chips).

### Action and input chips

Chips that act at once are buttons in a `role="group"` row: an active filter that removes itself (`.ds-chip--input`),
a suggestion (an action chip):

```html
<div class="ds-chips" role="group" aria-label="Active filters">
  <button class="ds-chip ds-chip--input" type="button" data-tip="Building C, second floor">
    <span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>Building C, second floor</span>[icon close 18 ds-chip__trailing]</span></button>
  <button class="ds-chip" type="button"><span class="ds-chip__body">[icon user 18 ds-chip__icon]<span class="ds-chip__label">Only my devices</span></span></button>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Clear filters</button>
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
- `.ds-chips--wrap` on the row lets long labels wrap inside the chip; a one-line chip keeps the 32px height and the
  corners stay soft (`min(--ds-radius-chip, half the height)`).
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

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="sync" checked>
  <span class="ds-switch__track" aria-hidden="true"></span>
  <span class="ds-switch__label">Nightly sync</span>
  <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
</label>
```

With both words (`.ds-switch__on`, `.ds-switch__off`) the CSS shows the right one and crossfades them; a single word
(`<span class="ds-switch__state" aria-hidden="true">On</span>`) still works, and then the page updates it when the
switch flips (screen readers announce the switch state themselves). Toggle in place; never re-render the switch to
change it.

The handle glides and grows on the spatial spring (also when a script sets `checked`), grows to 28px while pressed,
and a halo around it (`--ds-switch-halo`, 40px) shows hover, press and keyboard focus; the switch has no ripple.
Disabled: the neutral track (`--ds-switch-disabled-track`) and handle (`--ds-switch-disabled-handle`), no hover, halo
or grow, the `not-allowed` cursor and the quieter label. An `aria-disabled="true"` switch input is blocked by
`DS.motion.guard()` (a click on the switch or its label never flips it; no page guard needed). `.ds-switch__label` has no styles of its own; add `.ds-sr` to it when a card
title next to the switch already names the setting. A tooltip on a switch (why it is blocked) goes on its input:
`<input type="checkbox" role="switch" aria-disabled="true" data-tip="Managed by your organisation">`.

The input covers the track, so it is the hit target: put a `data-tip` on the input, not on the label or the track.
The switch row is at least `--ds-switch-height` (40px) tall. In forced colours a focused checked switch rings in
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
    <span class="ds-switch__meta"><span class="ds-tag ds-tag--neutral">3 recipients</span></span>
    <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
  </label>
  ...
</div>
```

Rows sit on one grid (track, name over hint, meta, state word), at least `--ds-switch-list-row-height` (56px) tall,
with hairlines between them. The name and its hint stand together on the switch's centre line: no gap between them,
and a row without a hint (or with a name that wraps) still centres its text on the track. At 560px of list width and
below the meta wraps under the name (under the hint when there is one).

**Motion:** the switch rows of [Controls](motion.md#controls) in motion.md.

## Combobox

```html
<div class="ds-combo">
  <input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-controls="model-list"
         aria-autocomplete="list" aria-activedescendant="model-2" value="lat">
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="model-list" role="listbox">
      <li class="ds-combo__option" id="model-1" role="option" aria-selected="false">
        <span class="ds-combo__name">Latitude 5430</span><span class="ds-combo__meta">14", 2022</span></li>
      <li class="ds-combo__option" id="model-2" role="option" aria-selected="true" data-active>
        <span class="ds-combo__name">Latitude 7440</span><span class="ds-combo__meta">14", 2023</span></li>
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

`aria-disabled="true"` on an option draws it in the disabled ink with no active layer (skip it in your keys).
Without a `.ds-combo__toggle` the field keeps only its own end padding. The field reads `--ds-input-height` (40px),
the toggle is that size; options are at least `--ds-combo-option-height` (48px) tall.

The toggle is a round 40px target with a state layer (hover, press in `--ds-dur-micro`), the ripple and the press
morph of every pill; it stays `tabindex="-1"` (the field opens the list from the keyboard), so it has no ring.
Options get no ripple: pressing one selects it and closes the list, and the state layer is the feedback.

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

**Motion:** the "Menu" row of [Overlays](motion.md#overlays) in motion.md.

## Dialog

Native markup (preferred): `showModal()` makes the page inert and gives the dialog its modal semantics, so the box
carries no role.

```html
<dialog class="ds-dialog" role="alertdialog" aria-labelledby="del-title" aria-describedby="del-text">
  <div class="ds-dialog__backdrop" data-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="del-title">Delete 3 devices?</h2>
    <p class="ds-dialog__text" id="del-text">They disappear from every list. This cannot be undone.</p>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-close autofocus>Cancel</button>
      <button class="ds-btn ds-btn--primary" type="button">Delete devices</button>
    </div>
  </div>
</dialog>
```

Div markup (fallback, and the only markup for `.ds-dialog--contained`): the same tree in
`<div class="ds-dialog" hidden>`, with the roles on the box: `<div class="ds-dialog__box" role="alertdialog"
aria-modal="true" aria-labelledby="del-title" aria-describedby="del-text">`.

- Open and close with `DS.overlay.open(dialog, { opener: button })` and `DS.overlay.close(dialog)`
  ([motion.md](motion.md#dsoverlay-jsoverlayjs)): focus moves in at once (`autofocus` marks the intended first focus,
  Cancel in a destructive `alertdialog`; else the first focusable element), the page is inert (the div markup in a
  shadow root makes the host page inert too, and so are elements the page adds while it is open), Escape and
  `[data-close]` close, the scroll lock counts (it stops the page from scrolling with `.ds-base` on `<html>`; not in an
  embedded widget, see [theming.md](theming.md), "Embedded in someone else's page"), and focus is back on the opener in the frame of the close. The dialog
  must sit inside the `.ds-theme` element (`DS.overlay` warns otherwise).
- Motion: the scrim fades while the box fades, grows from `--ds-scale-enter` and rises `--ds-distance-sm` on the
  spatial spring (`--ds-dur-slow`), from an origin towards its opener; it leaves the same way back in `--ds-dur-base`,
  accelerating. It runs on transitions keyed on `data-state`, so a close taken back mid-way continues from where the
  box is. At 600px and below the box decelerates instead of springing (no overshoot past the window).
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
  driven by hand (`showModal()`, `close()`) plays the same transitions where `@starting-style` and
  `transition-behavior: allow-discrete` exist; elsewhere it enters with the keyframes and closes at once.
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
<dialog class="ds-dialog ds-dialog--wide" aria-labelledby="own-title">
  <div class="ds-dialog__backdrop" data-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="own-title">Choose an owner</h2>
    <div class="ds-dialog__body"> ... a form or a list ... </div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button>
      <button class="ds-btn ds-btn--primary" type="button">Choose</button>
    </div>
  </div>
</dialog>
```

`.ds-dialog--wide` makes the box `--ds-dialog-width-wide` (560px) wide. `--ds-dialog-height` (default `auto`, never
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
`.ds-dialog__head`, is the M3 full-screen top bar: a close icon button with `data-close`, the title, an optional text
button at the end (the head may also be used in a normal dialog). The box rises `--ds-distance-lg` on the spring over
`--ds-dur-long` with the fade, no scale, and drops back in `--ds-dur-base`.

```html
<dialog class="ds-dialog ds-dialog--full-narrow" aria-labelledby="new-title">
  <div class="ds-dialog__backdrop" data-close></div>
  <div class="ds-dialog__box">
    <div class="ds-dialog__head">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>[icon close 20]</button>
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
  <div class="ds-dialog__backdrop" data-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="row-title">LAPTOP-0042</h2>
    <div class="ds-dialog__list">
      <button class="ds-menu__item" type="button">[icon pencil 20]<span class="ds-menu__label">Edit</span></button>
      <button class="ds-menu__item" type="button">[icon archive 20]<span class="ds-menu__label">Archive</span></button>
    </div>
    <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div>
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

`destructive: true` makes it an `alertdialog` whose first focus is Cancel, and the confirm button names the
consequence (there are no red buttons). `onConfirm` runs with `DS.motion.busy()` on the confirm button and
`data-ds-busy` on the dialog (Cancel `aria-disabled`); when it rejects, the dialog stays open, `errorText` (default
"That did not work. Try again."; never the raw error) shows as an error snackbar above it, and focus goes back to the
confirm button. `confirm()` resolves `true` or `false`, `prompt()` the value or `null`; Enter in the prompt's field
confirms. A prompt whose `input.required` field is left empty stays open with the field error of the form section:
`aria-invalid`, a `.ds-field__hint--error` with its icon and `requiredText` (default "Enter a value."), linked by
`aria-describedby` and announced at once; typing takes it away. The defaults are English: "Confirm", "Cancel", "OK".

### Confirm by typing the name

For an action that cannot be undone: an `alertdialog`, `.ds-dialog--wide`, a body with the text, a
`.ds-alert--warning` and a field ("Type LAPTOP-0042 to confirm", `autocomplete="off"`, `spellcheck="false"`,
`autocapitalize="off"`, `autofocus`). The action stays `aria-disabled` with a tip until `value.trim()` equals the name;
Enter (not while composing) runs it. While it works: `data-ds-busy` on the dialog, the field `readOnly`, Cancel
`aria-disabled`, and `DS.motion.busy(action, work, { done: false })`. Success closes it with reason `confirm` and a
snackbar; a failure keeps the value, shows an error snackbar above the dialog and focuses the field.

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
action runs: Escape, the native `cancel`, `[data-close]` (the backdrop included) do nothing, while
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

- **Why it closed.** Every close sends `ds-close` with `detail.reason` (`escape`, `backdrop`, `close`, `api`, your own
  string from `close(dialog, { reason })` ...; [motion.md](motion.md#dsoverlay-jsoverlayjs)), once, as soon as it starts.
- **Focus back.** Give row buttons that open a dialog stable `id`s: when a re-render replaced the opener, focus goes to
  the element that now has its `id`; `open(dialog, { opener, returnTo: () => element })` names another place.
- **A double click on the opener** never closes the dialog it opened: a backdrop click closes only as the first click
  of a press that began on it, from `--ds-delay-dismiss` after the open.
- **An opener with `aria-expanded`** (a button that says it shows a dialog, `aria-haspopup="dialog"`) is kept in step:
  `"true"` while it is open, `"false"` as soon as the close starts. An opener without the attribute gets none.

**Motion:** the "Scrim", "Dialog", "Nested dialog", "Dialog on a phone", "Full-screen dialog" and "Action sheet" rows of [Overlays](motion.md#overlays) in motion.md.

## Side sheet

Native markup (preferred), or the same tree in `<div class="ds-sheet" role="dialog" aria-modal="true"
aria-labelledby="sheet-title" hidden>`:

```html
<dialog class="ds-sheet" aria-labelledby="sheet-title">
  <div class="ds-sheet__backdrop" data-close></div>
  <section class="ds-sheet__panel">                      <!-- ds-sheet__panel--wide: 720px -->
    <div class="ds-sheet__head">
      <h2 class="ds-sheet__title" id="sheet-title">LAPTOP-0042</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>[icon close 20]</button>
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
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>[icon close 20]</button>
</div>
<div class="ds-sheet__body" tabindex="0"> ... </div>
<div class="ds-sheet__foot">
  <p class="ds-meta">3 filters</p>
  <button class="ds-btn ds-btn--text" type="button">Reset</button>
  <button class="ds-btn ds-btn--primary" type="button" data-close>Show 12 devices</button>
</div>
```

The title wraps (a long record name stays readable); `.ds-sheet__subtitle` is one line of meta type that ends in an
ellipsis (empty, it takes no room). `.ds-sheet__foot` sits after the body, its actions at the end and wrapping, above a
hairline (`--ds-sheet-foot-border`); a leading `.ds-meta` takes the start; it holds the safe area, so the body above it
ends with its normal gap; empty, it takes no room. The body is positioned (`offsetParent` of what is inside) and has a
thin scrollbar; a lone `.ds-btn` directly in it keeps its own width.

Open and close it like the dialog, with `DS.overlay.open(sheet, { opener })` and `DS.overlay.close(sheet)`. The panel
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
`<div>` for the head, not `<header>` (a second banner landmark).

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
[Dialog](#dialog); `ds-close` tells why it closed.

**Motion:** the "Scrim", "Side sheet" and "Side sheet on a phone" rows of [Overlays](motion.md#overlays) in motion.md.

## Snackbar

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
  <button class="ds-btn ds-btn--text ds-btn--sm ds-toast__action" type="button">Undo</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">[icon close 20]</button></div>
```

The action button comes only with `action`, the close button with every message that stays (`closeLabel`, default
"Close", is its label and its tooltip).

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
- Hooks: `--ds-toast-action-color`, `--ds-toast-close-size` (the close button, 36px)
  ([theming.md](theming.md#component-hooks)).
- **Removed in 2.0:** the region with `role="status" aria-live="polite"` and `role="alert"` on messages (`toast()` now
  takes the attributes off and announces once: use `<div class="ds-toasts"></div>`); showing messages by hand with
  `setTimeout(() => DS.motion.leave(toast), 4000)` (`toast()` times them); the hand recipe that moved messages into a
  side sheet with a page-set `--ds-toast-shift` (`DS.overlay.open(sheet)` moves and glides the region).

**Motion:** the "Snackbar" row of [Overlays](motion.md#overlays) in motion.md.

## Tooltip

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">[icon link 20]</button>
<td><a href="#device-42" data-tip="LAPTOP-0042-FINANCE-BACKUP">LAPTOP-0042-FINANCE-BACKUP</a></td>   <!-- shows only while cut off -->
```

```js
const tips = DS.overlay.tooltips(document);   // one call per page (or per root element or shadow root); tips.destroy() undoes it
```

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
- **Dismissable.** Escape hides it, and only then is the key the tooltip's (an open dialog under it stays open). Any
  pointerdown, `DS.overlay.open()` and a trigger scrolled out of view hide it too; a trigger that leaves the document
  (a re-render, a closed message) takes its tooltip with it at once.
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

**Motion:** the "Tooltip" and "Tooltip warm-up" rows of [Overlays](motion.md#overlays) in motion.md.

## Save bar

```html
<main class="ds-view" id="main" tabindex="-1">
  <div class="ds-content"> ... </div>
  <div class="ds-savebar">
    <div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>
      <p class="ds-savebar__text">2 unsaved changes</p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button">Discard</button>
        <button class="ds-btn ds-btn--primary" type="button"><span class="ds-btn__faces"> ... </span></button>   <!-- the faces of Button -->
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
- Hooks: `--ds-savebar-offset`, `--ds-savebar-inset` (from the view's sides instead of the page column),
  `--ds-savebar-min-height` (56px), `--ds-savebar-radius` (`--ds-radius-card`), `--ds-savebar-bg`
  (`--ds-surface-popover`), `--ds-savebar-shadow` (`--ds-elev-overlay`) ([theming.md](theming.md#component-hooks)). Print: hidden.

**Motion:** the "Save bar" row of [Feedback](motion.md#feedback) in motion.md.

## Loading

```html
<!-- Block loader: the shape loader (M3 Expressive), 48px; --sm 24px; --contained on an --ds-accent disc -->
<div class="ds-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Importing devices
  <p class="ds-loading__detail">812 of 2,030 rows</p></div>                       <!-- a detail line under the text -->
<span class="ds-loader ds-loader--contained" aria-hidden="true"></span>

<!-- Inline spinner: the M3 arc, for buttons, chips, status chips and table cells -->
<span class="ds-spinner" aria-hidden="true"></span>                 <!-- 16px -->
<span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span>  <!-- 12px, text colour -->

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

Every loader except the bare arc spinner fades in only after `--ds-delay-loader` (`.ds-boot` after
`--ds-delay-boot`), so fast loads show nothing; keep a visible one up with
`DS.motion.settleLoader(startedAt, { element })`. A `.ds-spinner` turns at once; delay it through `.ds-loading`, a
busy button or `<span class="ds-enter ds-enter--delayed">`. Delays never stack: a loader
inside `.ds-boot`, `.ds-loading` or `.ds-skeleton`, and a loading bar inside a skeleton, have no fade of their own.

- **Shape loader** (`.ds-loader`): the block loader. A shape morphs through the seven M3 shapes, each step landing
  on the spring, while it turns (`--ds-loop-loader`). It is `aria-hidden`; the surrounding `role="status"` carries
  the text. Keep it to a few per view (the morph repaints every frame). Hooks `--ds-loader-size` (48px) and
  `--ds-loader-color` (`--ds-primary`). The older markup with a `.ds-spinner` in `.ds-boot` or `.ds-loading` keeps
  working.
- **Spinner** (`.ds-spinner`): the inline loader, the M3 arc that grows and shrinks while it turns, without a track.
  Hooks `--ds-spinner-color`, `--ds-spinner-track` (none; the small one keeps a faint ring of the text colour) and
  `--ds-spinner-width` (2px; replaces a project's own `border-width`). Never put `.ds-enter` on it in static markup
  (wrap it); `.ds-enter` on a `.ds-loader` is fine, its loops run on `::before`.
- **Circular progress** (`.ds-spinner--determinate`, 40px): the share as an arc, a gap, then the track in
  `--ds-accent`, on a wavy ring (`.ds-spinner--flat`: a plain ring). It never spins; set `--ds-progress` (0 to 1)
  and the arc glides like linear progress. Markup as for [progress](#progress): `role="progressbar"`,
  `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, a name.
- **Skeleton**: one calm diagonal wave passes over the whole surface, after its entrance. Every bone shows its slice
  of one band fixed to the viewport (the registered `--ds-skeleton-x`), so the bones of a surface share one phase.
  Since 2.0 each bone clips the band to its own shape and the band moves on a compositor layer of its own (a fixed
  `::after`, moved by `translate`), so the wave repaints nothing; before, a fixed background was repainted with the
  whole view. Under a transformed ancestor (a sheet mid-slide, `.ds-enter`) the band is placed in that ancestor
  instead of the viewport: the bones stay in time and share it.
- **Loading line** (`.ds-loading`): the loader, then the text, in one row (inline markup in the text or a trailing
  button stays on it). With `.ds-loading__detail` lines (2.0) it becomes a two-column grid: the lines sit under the
  text in its column (`--ds-font-meta`, `--ds-text-2`), aligned with it whatever the loader's size; keep the text one
  run (or one element) there, since each piece of it takes a cell.
- **Skeleton note** (`p.ds-skeleton__note`, 2.0): a progress line under the lead bone ("Loading 3 of 12 reports",
  `--ds-font-meta` in `--ds-text-2`, tabular figures); it sits inside the `role="status"` skeleton, so its text is
  announced: update it at most every 10% or once a second. Empty, it takes no room. The bones' corners follow
  `--ds-skeleton-radius` (2.0; default `--ds-radius-action`, the heading line `--ds-radius-sm`).
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

**Motion:** the loader and skeleton rows of [Feedback](motion.md#feedback) in motion.md.

## Progress

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

- **The 2024 look** (the default): the bar ends at the share, a gap (`--ds-progress-gap`, 4px) follows, then the
  remaining track (`--ds-progress-track`, `--ds-accent`) with a stop dot at its end (`--ds-progress-stop`,
  `--ds-primary`). The bar is wavy and its wave travels; at `aria-valuenow="100"` (with the documented
  `aria-valuemax="100"`) the wave stops and the flat bar fades in.
- **`.ds-progress--flat`**: the classic look, no gap, no dot, no wave. Use it in dense table cells: the wave reaches
  3px above and below the 4px track, and an ancestor with `overflow: hidden` closer than that clips it.
- **`.ds-progress--indeterminate`**: two segments run across the track (the M3 choreography). When the modifier
  drops, set the first share in the same task: the segments stop and fade out, the bar fades in and grows from 0 to
  its share (it never sweeps across or shrinks from 100%). A share set earlier, while indeterminate, simply
  appears at that share.
- **`.ds-progress--waiting`** hides the track and keeps the labels. The track keeps its 4px, so the label stays put
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

**Motion:** the "Progress" row of [Feedback](motion.md#feedback) in motion.md.

## Charts

Meters, columns and legends (2.0), drawn from the chart roles ([tokens.md](tokens.md#chart-colours)): `--ds-chart-1` to
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
  `--ds-meter-color` (`--ds-chart-1`). Tones `.ds-meter--neutral`, `.ds-meter--warning`, `.ds-meter--error` (always
  with words next to them). A meter with its own figure is `role="meter"` with `aria-valuenow` and `aria-valuetext`; next to a
  figure in text (`.ds-kv-list--bars`) it is `aria-hidden`.
- `.ds-columns`: a `<figure>` with a caption and an `ol.ds-columns__plot` of `.ds-columns__col`, each with
  `.ds-columns__value`, `.ds-columns__fill` and `.ds-columns__label`, `--ds-columns-height` (120px) high, the data
  end rounded by `--ds-columns-radius` (`--ds-radius-xs`). Series `.ds-columns__col--s2`, `.ds-columns__col--s3`,
  `.ds-columns__col--s4` and tones `.ds-columns__col--warning`, `.ds-columns__col--error` set `--ds-chart-color`. A column that opens its category is a `<button>` or `<a>` with the
  class inside a plain `<li>`: a state layer, an inset ring, the ripple, no morph.
- `.ds-columns--mini`: a 32px sparkline beside a figure, no labels or values, the columns `aria-hidden` and the figure
  `role="img"` with a summary; `.ds-columns__col--highlight` takes `--ds-chart-1`, the rest `--ds-chart-neutral`.
- `.ds-columns--grouped`: `.ds-columns__groups` of `.ds-columns__group` (at least `--ds-columns-group-min`, 56px,
  each), its columns 2px apart and its label under the group; `.ds-columns__group--current` lies on a band of
  `--ds-surface-low` with its label in the label weight and a `.ds-sr` word. Put it in a `.ds-scroll-x` when it may
  be wider than its card.
- `.ds-legend`: keys of `--ds-legend-key-size` (12px) in the meta font; `.ds-legend__key--s2`, `.ds-legend__key--s3`,
  `.ds-legend__key--s4`, `.ds-legend__key--neutral`, `.ds-legend__key--warning`, `.ds-legend__key--error`.
- **Colours**: the series in their fixed order, never cycled; at most four, more fold into "Other"; the tones only on
  single-series marks; text never takes a series colour. A theme that changes the roles keeps each at 3:1 on
  `--ds-surface`, `--ds-surface-low` and `--ds-chart-track`, and adjacent series apart for colour-blind readers. In
  forced colours the fills take `CanvasText`, series 2 to 4 a hatching of their own (45, 135 and 90 degrees), as do
  the legend keys.
- **Accessibility**: every chart has a text equivalent: its caption plus a table or a key-value list, or the values
  as text.
- **When to draw your own**: lines, areas, scatter plots and stacked bars are the project's, with the chart roles and
  `--ds-share`.

**Motion:** the "Charts" row of [Feedback](motion.md#feedback) in motion.md.

## File upload

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
DS.dom.dropzone(chatPane, { onFiles: attach, accept: 'image/*' });              // a page's own drop target
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

- **Forced colours**: a dashed `ButtonText` edge (`Highlight` while dragged over), the file button in `ButtonFace` /
  `ButtonText` with a `ButtonText` border, a page's drop target outlined in `Highlight`; a disabled zone or file
  field is `GrayText`.

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

**Motion:** `sortable()` in [DS.motion](motion.md#dsmotion-jsmotionjs); the row glides like every `flip()` item.

## Ripple

A press on an action grows a circle of the content colour from the pointer (Enter or Space: from the centre) and
fades it when the press ends. One call wires every action on the page, also the ones rendered later:

```js
const ripples = DS.ripple.attach(document);   // <html> gets .ds-ripples; ripples.destroy() takes it back
ripples.release(host);                        // end a running press by hand (no argument: every press)
```

```html
<button class="ds-btn" type="button">Export</button>           <!-- a host: nothing to add -->
<div class="x-row" data-ds-ripple tabindex="0">...</div>        <!-- any element becomes a host -->
<nav data-ds-ripple="off">...</nav>                              <!-- no ripples inside -->
```

- Hosts (`DS.ripple.RIPPLE_HOSTS`): `.ds-btn`, `.ds-chip` (the ripple goes into `.ds-chip__body`),
  `.ds-segmented__option`, `.ds-drawer__item`, `:is(button, a).ds-tile`, `.ds-card--interactive` (also the `<div>`
  form), `.ds-table__sort`, the body rows of `.ds-table--interactive` (the ripple goes into the row's first cell, a
  `<td>` or a `<th scope="row">` row header, as a box over the whole row that clips the circle; the row is isolated meanwhile, so the ripple paints under the
  cells' content), `.ds-radio` (a radio card, also when its own input is pressed), `.ds-combo__toggle`,
  `.ds-menu__item`, `.ds-errors summary`, `.ds-pressable` ([Utilities](#a-pressable-element-of-your-own)) and
  `[data-ds-ripple]`; Enter on a `.ds-table__row-link` or
  `.ds-card__action` ripples its row or card from the centre, while a press on another link or control inside the
  row or `<div>` card (a plain link, a field, a label) is that control's own and ripples neither;
  `data-ds-ripple="off"` on a host or an ancestor opts out. Not hosts, by design: inline links (`.ds-link-btn`,
  links in text), the switch, `.ds-check` rows and checkbox or radio inputs (their halo is the press), combobox
  options (pointer-down selects and closes the list; the state layer is the feedback), native field parts, the brand
  link (`.ds-brand`: the home link in the top bar is identity, not a control, so like a link in text it has no state
  layer, ripple or morph) and the skip link (`.ds-skip`: keyboard-only, shown while focused; its focus ring is the
  feedback). Under `.ds-ripples` each host is positioned, and clipped and isolated while a ripple is inside
  (zero specificity, so a host's own `position` wins; at rest a host looks as without `.ds-ripples`). Disabled, `aria-disabled`, `aria-busy` and `.ds-btn--done` hosts (a chip or radio card
  whose input is disabled, also by its `<fieldset>`, or `.ds-radio--disabled`) get no ripple, and neither does a press with a pointer button other than the primary one (a right or middle click) or from a non-primary pointer (a second finger).
- The ripple is `<span class="ds-press-ripple" aria-hidden="true" data-ds-keep>` with the runtime properties
  `--ds-ripple-x`, `--ds-ripple-y` (its centre) and `--ds-ripple-r` (the distance to the farthest corner). It
  grows on `ds-press-ripple` over `--ds-dur-medium` (an effect: no overshoot), gets `.ds-press-ripple--out` on
  release (not before `--ds-dur-instant` after the press) and is removed once that fade settled. The host carries
  `.ds-pressed` from press to release, at least `--ds-dur-instant`, so a quick click shows the whole press.
- The flat state layer and the ripple never stack: under `.ds-ripples` a pressed host keeps its hover layer (0 on
  touch screens), or its focus layer when a key pressed it, and the ripple adds the press. A button's layer also keeps what `--ds-btn-state-pressed-opacity`
  asks for beyond the ripple's `--ds-state-pressed`, so `.ds-btn--disc` shows its disc on press on touch screens
  too. Without `attach()` the flat layer stays the press feedback.
- A press ends early when another element captures the pointer (an ancestor that drags to scroll): the ripple
  fades as on release. `release(host?)` ends one by hand; `detach()` is the **deprecated** alias of `destroy()`
  (removed in 3.0 at the earliest). `:active` (the flat layer and the morph) lasts until the pointer button goes up.
- Colour: `--ds-ripple-color` (default `currentColor`), on `.ds-theme` or a host. Forced colours show no ripple.
- iOS Safari applies `:active` only on pages that listen to `touchstart`. `attach()` adds a passive listener; a
  page without `ds.js` adds one itself (`document.addEventListener('touchstart', () => {}, { passive: true })`, or
  `ontouchstart=""` on `<body>` where the Content-Security-Policy allows inline handlers), otherwise iOS shows no
  press feedback.

**Motion:** the press rows of [Controls](motion.md#controls) in motion.md.

## Utilities

| Class | Effect |
|---|---|
| `.ds-sr` | visually hidden, read by screen readers |
| `.ds-muted` | quieter body text, tabular figures (`p.ds-muted` keeps the reading measure) |
| `.ds-meta` | meta line, 12px, tabular figures |
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
- The radius: `--ds-pressable-radius` (`--ds-radius-sm`). Add the role, `tabindex` and the key handling yourself.

### Actions on demand

```html
<tr>
  <td>LAPTOP-0042</td>
  <td class="ds-num"><span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit LAPTOP-0042">[icon pencil 18]</button></span></td>
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
<span class="ds-presence ds-presence--keep" data-ds-shown><button class="ds-btn ds-btn--tonal ds-btn--sm" type="button">Latest</button></span>
```

A `[popover]` is centred by the browser's `margin: auto`; inside a container that spaces its children with margins
(`.ds-card > * + *`), give it `margin: auto` again or place it outside.

A log that grows at its end (an import log, a chat) sticks to it with `DS.dom.followEnd(scroller, { pill })` (2.0):
while the reader is at the end, new lines keep it there; scrolling up lets go and shows `pill` (a `.ds-presence`
wrapper around a "Latest" button, toggled with `hidden`); a click on it, or `stick()`, goes back to the end
([motion.md](motion.md#dsdom-jsdomjs)).

```html
<div class="ex-log" id="log" tabindex="0" aria-label="Import log">...</div>
<span class="ds-presence" id="latest" hidden><button class="ds-btn ds-btn--tonal ds-btn--sm" type="button">[icon arrowDown 16] Latest</button></span>
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
| `data-ds-dragover` | the system (`DS.dom.dropzone`) | a `.ds-dropzone` or a page drop target | files are dragged over it |
| `data-ds-dragging` | the system (`DS.motion.sortable`) | the item being moved | the dragged row |
| `data-ds-keyboard` | the system (`DS.dom.followViewport`) | `<html>` | the on-screen keyboard is up |
| `data-toast-reserve` (with `--ds-toast-reserve`) | both: `DS.overlay.toast()` by default, the page only with `reserve: false` | `.ds-view`, `.ds-sheet__body`, `.ds-dialog` | the layer keeps room at its end for snackbars that stay ([Snackbar](#snackbar)) |
| `data-ds-savebar` (with `--ds-savebar-height`) | the system (`DS.overlay.savebar()`) | `.ds-view` | the save bar shows: scroll padding and the content's end keep its room ([Save bar](#save-bar)) |
| `data-ds-savebar-rest` | the system (`DS.overlay.savebar()`) | `.ds-view` | the bar hid at the end of the page: its room stays until the page scrolls away from the end ([Save bar](#save-bar)) |
| `data-ds-busy` | the page | `.ds-dialog`, `.ds-sheet`, `.ds-drawer` | keeps the overlay open while its action runs: the user's close attempts do nothing, `DS.overlay.close()` still closes ([Dialog](#dialog), "While its action runs") |
| `data-ds-toast-room` | the page | `.ds-view`, `.ds-sheet__body`, `.ds-dialog` | `off`: this layer keeps no room for snackbars that stay; the page keeps the messages clear itself ([Snackbar](#snackbar), "Room at the end") |
| `data-ds-guard="off"` | the page | any element around actions | its `aria-disabled` and busy actions explain themselves on click: `DS.motion.guard()` lets their activations through |
| `data-icon` | the page | any element | the glyph name that `DS.icons.fill()` draws into it ([icons.md](icons.md)) |
| `data-icon-size` | the page | an element with `data-icon` | the glyph size in px for `DS.icons.fill()` (default 20) |
| `data-ds-shown` | the page | a `.ds-presence--keep` element, a `.ds-hover-actions` host or its actions | shown (`.ds-presence--keep`: without it hidden, keeping its box; `.ds-hover-actions`: the actions show without hover or focus, [Utilities](#actions-on-demand)) |
| `data-drawer-collapsed` | the page | `.ds-app` | the docked drawer is a rail (above 900px; [App frame](#the-rail)) |
| `data-label` | the page | `.ds-segmented__option`, `.ds-tabs__tab` | the option's text again: keeps the width of the selected weight |
| `data-label` | the page | a cell of `.ds-table--stack` / `--stack-wide` | the label shown above the cell's content while the rows stack ([Stacked rows](#stacked-rows)) |
| `data-status` | the page | `.ds-steps__step` | `done`: a finished step ([Steps](#steps)) |
