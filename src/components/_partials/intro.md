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

