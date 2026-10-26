# Changelog

All notable changes. Versions follow [semver](https://semver.org): renaming or removing a token, class, hook or JS
export is a major change; adding one is a minor change. Identifiers such as D7 refer to the design decisions in
[plans/motion-2.md](plans/motion-2.md).

## 2.0.0

A major release. Every name deprecated in 1.0.0 to 1.6.2 is removed; a few defaults change where the old behaviour
had no use; the system gains the parts that the projects built by hand (row lists, timelines, charts, tabs, the save
bar, dialog bodies, a select-only combobox, input chips, badges, the action guard, touch density, dark, compact and
contrast themes; 13 new component stylesheets, 39 in all) and tools to check a copy, a theme and a project. Read
"Migration" first: the table lists every removed name with its replacement and a pattern to find it, and the list
under it every default and look that changed without a rename. `dist/deprecations.json` holds the same names as data
and `tools/check-project.mjs` finds them in a project.

A 1.6 copy of `ds.js` in an embedded widget keeps coordinating Escape order and the scroll lock with a 2.0 page, and
the other way round: the records behind `Symbol.for('ds.overlay')` and `Symbol.for('ds.owned')` keep their shape
(fields may be added in 2.x, none is removed or retyped).

### Migration

| Kind | Old | New | What to change | Find it |
|---|---|---|---|---|
| token | `--ds-ease` | `--ds-ease-emphasized` | rename every `var(--ds-ease)` (same value; the `linear()` path where supported); `MOTION_FALLBACKS['--ds-ease']` is gone | `--ds-ease(?![\w-])` |
| role | `--ds-spinner-sm-track` | none | delete it from the theme (no effect since 1.0) | `--ds-spinner-sm-track` |
| scale | `--ds-state-pulse` | none | delete any use (only `ds-pulse` read it) | `--ds-state-pulse` |
| token | `--ds-loop-pulse` | `--ds-loop-skeleton` (the wave of `.ds-skeleton`) | use the skeleton markup | `--ds-loop-pulse` |
| keyframes | `ds-pulse` | `.ds-skeleton` (`ds-skeleton-wave`) | drop any `animation: ds-pulse …` (it plays nothing now) and use the skeleton markup | `ds-pulse(?![\w-])` |
| keyframes | `ds-indeterminate` | `.ds-progress--indeterminate`, `.ds-loadbar` (`ds-progress-head` + `ds-progress-tail`) | use the markup | `ds-indeterminate` |
| keyframes | `ds-sink-out`, `ds-scale-out`, `ds-slide-out` | `ds-fade-out` + `ds-drop-out` / `ds-shrink-out` / `ds-shift-out`, or `.ds-leave--sink` / `--scale` / `--slide`, or `DS.motion.leave(el, 'sink' \| 'scale' \| 'slide')` | two animation entries, or the utility | `ds-(sink\|scale\|slide)-out` |
| export | `DS.motion.easeOutCubic` | none (`countUp()` runs on `--ds-ease-value`) | remove every call and import: an import of it from `js/motion.js` stops the module from loading | `easeOutCubic` |
| class | `.ds-btn__swap` | `.ds-btn__faces` with `.ds-btn__face`, `.ds-btn__face--busy`, `.ds-btn__face--done`, driven by `DS.motion.busy()` | rewrite the markup | `ds-btn__swap` |
| attribute | `data-open` on `.ds-combo` | `aria-expanded="true"` on `.ds-combo__input` (`DS.overlay.open(list, { opener: field })` sets it) | open the list through `DS.overlay` | `ds-combo[^>]*data-open` |
| markup | `.ds-toasts` with `role` or `aria-live`, `role="alert"` on messages | `<div class="ds-toasts"></div>` | remove the attributes (`toast()` now strips them from an old region on first use and announces each message once through its own announcers) | `ds-toasts[^>]*(role\|aria-live)` |
| recipe | page-set `--ds-toast-shift` / `--ds-toast-shift-y` to move snackbars into a side sheet; closing messages with `setTimeout` | `DS.overlay.open(sheet)` moves the region and glides the messages; `toast()` times them | delete the recipe; both properties stay, written by `DS.overlay` only | `--ds-toast-shift` |

Changed defaults and looks (no rename; check your pages and your tests):

- **Blocked actions are blocked for every input.** Once `DS.ripple.attach()` or `DS.motion.busy()` ran (or
  `DS.motion.guard()`), a click, middle click, Enter, Space, label click or form submission on a busy or done
  `.ds-btn`, or on any `aria-disabled="true"` action inside `.ds-theme`, never reaches your listeners or its default
  action; on an ARIA-role action (`<div role="button">`, an option, a menu item) the `keydown` and `keyup` of Enter
  and Space are cancelled before your key handler. Delete your own guards. A control that must explain itself on click gets `data-ds-guard="off"`.
- `busy()` shows the done face only when the button has one (no `{ done: false }` needed for buttons without it).
- `flip()` moves focus to the same control of the next item when the focused item goes (else the previous one,
  skipping items that take no focus, such as a day heading); `refocus: false` turns it off. Delete "move focus before
  a dismiss" code.
- `toast()`: the same string message (same kind, same text, no action) while it shows restarts it instead of stacking
  (`restart: false`); messages that stay reserve room at the end of the view, sheet body or dialog body
  (`reserve: false`; a page writes `data-toast-reserve` only then); a text button in a message takes the inverse
  primary ink; an element message that stays gets a close button (with its tooltip).
- Tooltips: a tip equal to the trigger's visible text shows only while that text is cut off (also in a table cell or
  another ancestor that clips it); on touch screens a tap shows the tip of an image or a blocked control, a long press
  shows the others, and a tip stays until it is dismissed; a tip hides when its trigger leaves the document. Remove
  page attributes such as a "truncated" marker and their measuring code: plain `data-tip` does it. On a `.ds-switch`,
  put `data-tip` on the input.
- A backdrop or scrim click within `--ds-delay-dismiss` (300ms) of the open, a press that began elsewhere, and the
  second click of a double click (any `[data-close]` click with `detail > 1`) no longer close an overlay. A test that
  clicks a backdrop right after opening waits 300ms or closes with Escape. A press on a backdrop or scrim no longer
  moves focus (the field a dialog just focused keeps it through the second click of the double click that opened it).
- Focus returns to the opener's id twin when a re-render replaced the opener (or to `open(el, { returnTo })`);
  `open()` without an opener takes the clicked control (Safari); `open(drawer)` focuses the current item.
- `DS.overlay.open()` watches every `.ds-sheet__body` and `.ds-dialog__body` itself (`DS.dom.watchScrolled()`): remove
  a page's own watch or sentinel recipe for them (left in place it adds a second sentinel, which is harmless).
- `.ds-view`, `.ds-sheet__body` and `.ds-drawer__list` are positioned (`position: relative`, no stacking context): the
  `offsetParent` of elements inside them changes, an absolutely placed element no longer escapes the scroller, and a
  `.ds-sr` without a closer positioned ancestor sits at the top of the view's content.
- A lone `.ds-btn` directly in `.ds-page`, `.ds-stack`, `.ds-sheet__body` or `.ds-dialog__body` keeps its own width.
- `.ds-segmented` has its start margin only in the top bar; in a page toolbar it sits flush. Button options reset the
  UA look.
- Bare `h1` to `h6` under `.ds-base` take the type roles (`h1` headline, `h2` subtitle, `h3` to `h6` label, no
  margins). Wrap rendered text (Markdown, help pages) in `.ds-prose`, or keep the project's own heading rules.
- Interactive table rows without a `.ds-table__row-link` stay plain: no pointer, no press layer, no ripple (they
  opened nothing).
- `.ds-tiles` columns fill their container: up to four (`--ds-tiles-columns`), each at least `--ds-tile-min-width`
  (176px); `.ds-tiles--3` caps at three. This replaces the 1100px window step: a lone tile fills its row, and a 390px
  phone shows one tile per row.
- `.ds-switch`: the input covers the track. `aria-disabled` switches, checkboxes, radios, radio cards and filter chips
  look and act blocked (no hover or press, the disabled ink; the focus ring stays).
- `.ds-kv-list` and `.ds-plain-list` lose the browser's top margin (pages sit higher by it); the last kv row loses its
  bottom padding; long labels and values wrap and values align to the end. `.ds-muted` has no margin, like
  `.ds-meta`.
- `.ds-sheet__title` wraps; the sheet body has a thin scrollbar; `.ds-dialog__body:empty` and
  `.ds-dialog__actions:empty` take no room.
- Combobox options are at least 48px tall (`--ds-combo-option-height`); the toggle and the field's end room follow
  `--ds-input-height`.
- Size modifiers read their own hooks instead of setting the shared ones: `.ds-btn--sm` `--ds-btn-sm-height` and
  `--ds-btn-sm-icon-size`, `.ds-check--sm` `--ds-check-sm-height`, `.ds-toast__close` `--ds-toast-close-size`,
  `.ds-loader--sm` `--ds-loader-sm-size`, `.ds-spinner--determinate` `--ds-spinner-determinate-width`,
  `.ds-status__spinner` `--ds-status-spinner-width`. Set those in the theme instead of overriding the component.
- Forced colours follow one model per meaning: a choice in a set (the current drawer item, the selected segmented
  option and tab, the current list row, the chosen combobox option) is `SelectedItem` / `SelectedItemText`, with a
  `CanvasText` ring when focused; a toggle that is on (a pressed button, an open disclosure button, a checked chip, a
  selected tile or card) is `Highlight` / `HighlightText`; blocked controls (`disabled` and `aria-disabled` buttons,
  menu items, options, drawer items, tabs, cards, tiles, checks, rows) are `GrayText`; focused fields show a 2px
  `Highlight` outline.
- Derived roles follow their source: `--ds-link-underline`, `--ds-fill-round`, `--ds-disabled-fill`,
  `--ds-disabled-ink`, `--ds-primary-hover`, `--ds-primary-pressed` are `color-mix()` of `--ds-link`, `--ds-text` and
  `--ds-primary` (same default values). A theme that sets them keeps its value; a theme that sets only the sources
  now moves them too.
- `ds-spin` animates `rotate`: an element's own `transform` stays while it spins (a page `rotate` on a spinner is
  overridden while it turns).
- Snackbar regions glide on both axes (above a sheet foot, the drawer foot on phones or the save bar) and rise by
  `--ds-keyboard-inset`; beside the open modal drawer (601px to 900px) the region starts at the drawer's edge.
- The card table wrappers fade through the scroll-edge numbers and `--ds-scroll-fade` (`0px` turns every fade off).
- Escape in a filled `input[type="search"]` inside a dialog, sheet or menu clears the search first; the next Escape
  closes the layer.
- A `.ds-btn` with `aria-haspopup="dialog"` (or `.ds-btn--disclosure`) and `aria-expanded="true"` takes the pressed
  tint (and `Highlight` in forced colours) while its dialog or sheet is open, and `DS.overlay` keeps the
  `aria-expanded` of such an opener in step; menu triggers stay plain. A pressed toggle that is `aria-disabled` keeps
  its on look.
- `.ds-chips:empty` takes no room; a row of button chips is a `div role="group"`. `.ds-action-bar > .ds-search` takes
  its own row under 600px of content.
- A long `.ds-check` label wraps beside its box, which aligns with the first line. The narrow date padding (720px
  and below) applies only where fields stand side by side (`.ds-filters`, `.ds-inline-form`, `.ds-form-grid--2`,
  `--3`).
- `.ds-hover-actions`, the search key, the changed-field dot and other show-and-hide pairs leave faster than they come
  (the exit ratio).
- The skeleton band is a fixed `::after` on its own layer, clipped by each bone: a project that styled the
  `background-image` or `background-attachment` of `.ds-skeleton__line` sets `--ds-skeleton-highlight` instead.
- The hover underline of `.ds-link-btn` takes the link underline's thickness and offset.
- The `flag` glyph draws its pole first: a project that copies glyph strings refreshes `flag` (no other glyph
  changed).
- Strict CSP: `DS.dom.morphHtml()` sets styles through the CSSOM, so a `style-src-attr 'unsafe-inline'` added only for
  it can go.

### Added

- Overlays: `data-ds-busy` (an overlay stays open while its action runs), `close(el, { reason })` and the `ds-close`
  event (why it closed), `DS.overlay.topmost()`, `open(el, { returnTo })`, `DS.overlay.confirm()`, `alert()` and
  `prompt()` (built dialogs that resolve a promise; a required prompt field left empty shows a field error,
  `requiredText`), `DRAWER_QUERY`, `DISMISS_DELAY_MS`, the scale
  `--ds-delay-dismiss`; `.ds-dialog__body`, `.ds-dialog__head`, `.ds-dialog--wide`, `--full`, `--full-narrow`,
  `--bottom` (an action sheet), `.ds-dialog__list`, `--ds-dialog-width-wide`, `--ds-dialog-height`,
  `--ds-dialog-full-radius`; `.ds-sheet__heading`, `__subtitle`, `__foot`, `--ds-sheet-foot-border`; menu groups,
  `.ds-menu__heading`, `.ds-menu__meta`, radio items (`menuitemradio`), type-ahead, `--ds-menu-item-height`; menus and
  combobox lists fade at their cut edges (`open()` attaches `DS.dom.scrollEdges()` on the block axis);
  `.ds-combo--select` (a select-only combobox), `.ds-combo__value`, `--ds-combo-option-height`. Recipes: a search
  over a list in a dialog, steps in one dialog, confirm by typing the name.
- Snackbars and tooltips: `DS.overlay.announce()` (say a result without a message), `toastRegion()`, `closeToasts()`;
  `toast()` takes `null` as its region and the options `key` (replace by key), `restart`, `reserve` and `action` (an
  Undo button); a region first used while a dialog or side sheet is open (created by `toastRegion()` then) moves
  into it, so its messages and announcements are above the modal; `.ds-toast__action`, `--ds-toast-action-color`, `--ds-toast-close-size`, the runtime
  `--ds-toast-lift`; tooltips on touch screens.
- Save bar: `.ds-savebar` with `__bar`, `__text`, `__actions`, `DS.overlay.savebar()` (`{ show, hide, update,
  shown, destroy }`), hooks `--ds-savebar-offset`, `--ds-savebar-inset`, `--ds-savebar-min-height`,
  `--ds-savebar-radius`, `--ds-savebar-bg`, `--ds-savebar-shadow`; runtime `data-ds-savebar`, `data-ds-savebar-rest`,
  `--ds-savebar-height`.
- Motion and DOM: `DS.motion.guard()`, `refresh()` (the documented refresh as one call), `setLabel()`, `sortable()`
  (reorder by drag and keyboard), `roll(…, { hold })` with `--ds-hold-status`, `transition(…, { focus })`,
  `settleLoader(…, { now, element })`, `loaderHoldMs(…, { element })`, `flip(…, { refocus })`, `onKeep` for
  `morphChildren()`, `morphHtml()` and `flip()`; `DS.dom.watchScrolled()`, `scrollEdges()`, `progress()` (a share and
  its ARIA in one call), `roving()` (one tab stop for a set), `followViewport()` (the frame follows the on-screen
  keyboard), `followEnd()` (a log that sticks to its end), `autosize()`, `dropzone()`; `.ds-presence--keep`
  (`data-ds-shown`), `.ds-vt-view` (a view-transition target outside the frame), `.ds-swap--fade` (`--ds-swap-fade`);
  the `DS.ripple.attach()` handle's `release()` and `destroy()` (a press also ends when another element captures the
  pointer).
- Drag, drop and files (`drag.css`): `.ds-grip`, the `[data-ds-dragging]` row, the styled `.ds-input[type="file"]`,
  `.ds-dropzone` with `__input`, `__disc`, `__title`, `__idle`, `__over`, `__browse`, `__hint`,
  `--ds-dropzone-border`, and `[data-ds-dragover]` on any page drop target.
- Loading: `--ds-skeleton-radius`, `.ds-skeleton__note`, `.ds-loading__detail`.
- Tables and scrollers: `.ds-table--stack` and `--stack-wide` (each row a block, each cell's `data-label` above its
  value; always in sheets and dialogs, in a view at a content area of at most 600px / 840px), `.ds-table-wrap--fill`
  (a full-page table with a sticky header and cut cells), `.ds-table--pin-first` (a pinned first column;
  `DS.ripple.attach()` forwards a click on the row to its `.ds-table__row-link` and ripples it in two parts),
  `td.ds-table__actions`, `tfoot` summary rows, `.ds-scroll-x` (a sideways strip with edge fades), `.ds-jump` (the
  place of a "Latest" pill), `.ds-pagination` (`--simple`), `.ds-selection-bar`; hooks `--ds-scroll-fade`,
  `--ds-table-head-height`, `--ds-table-row-height`, `--ds-table-dense-row-height`, `--ds-table-sticky-bg`,
  `--ds-table-cell-max-width`, `--ds-table-fill-min-height`, `--ds-table-fill-max-height`; scales `--ds-z-pinned`,
  `--ds-z-sticky-pinned`; keyframes `ds-scroll-edge-start` and `ds-scroll-edge-end` (registered
  `--ds-scroll-edge-start` / `-end`).
- Lists and data: `.ds-list` (rows that open a record: `__item`, `__icon`, `__text`, `__title`, `__meta`, `__actions`,
  `__chevron`, `.ds-list--interactive` with `.ds-list__action`, the current row by `aria-current`;
  `--ds-list-item-height`, `--ds-list-text-min`, `--ds-list-current-bg`); key-value rows that open
  (`.ds-kv-list--interactive`, `.ds-kv-list__row`), row icons (`.ds-kv-list__icon` with `--ok`, `--warning`,
  `--error`), quiet values (`strong.ds-muted`) and `.ds-kv-list--bars`; `.ds-facts--rows`
  (`--ds-facts-label-width`) and `.ds-lock` (a value another system sets); `.ds-disclosure` (a styled `<details>`,
  `__body`, `--row`, `.ds-disclosure-list`, `--ds-disclosure-height`, `--ds-disclosure-row-height`); `.ds-timeline`
  (the history of a record, nine hooks); `.ds-tasks` (a checklist of a job's steps, `data-status`); chart roles
  `--ds-chart-1` to `--ds-chart-4`, `--ds-chart-track`, `--ds-chart-neutral`, `--ds-chart-warning`,
  `--ds-chart-error`; the runtime `--ds-share`, keyframes `ds-fill-share` and `.ds-enter--fill`; `.ds-meter`,
  `.ds-columns` (`--mini`, `--grouped`) and `.ds-legend` with their hooks.
- Controls: `.ds-pressable` (`--lg`, `--inset`, `--ds-pressable-radius`, `--ds-pressable-layer`: the press model for a
  project element), `.ds-hover-actions` (with `.ds-hover-host`; only the nearest host reveals them, so a table in a
  card shows the pointed row's actions), `.ds-kbd`, `.ds-divider` (`--inset`, `--vertical`,
  `--label`), `.ds-touch` and the role `--ds-touch-target` (48px: every target hook at once, opt-in),
  `.ds-icon--filled`, `.ds-icon--fillable` (fills under `aria-pressed` / `aria-checked`), 27 glyphs (`chevronFirst`,
  `chevronLast`, `cornerDownLeft`, `moreHorizontal`, `upload`, `clipboard`, `paperclip`, `send`, `printer`, `play`,
  `pause`, `stopCircle`, `grip`, `bell`, `mic`, `micOff`, `volume`, `helpCircle`, `eye`, `eyeOff`, `home`,
  `panelLeft`, `keyboard`, `terminal`, `tag`, `sun`, `moon`; 109 in all), `DS.icons.fill()` for `[data-icon]` /
  `data-icon-size`; `.ds-btn--disclosure`, `.ds-btn--adaptive` with `.ds-btn__label`, `.ds-link--quiet`,
  `.ds-link-btn--quiet`; action and input chips (`button.ds-chip`, `.ds-chip--input`, `.ds-chip__icon`, `__label`,
  `__trailing`), `.ds-chips--wrap` and the chip hooks; `.ds-badge` (`--neutral`, `--ok`, `--warning`, `--error`; the
  disabled model in a blocked host) and
  `.ds-tag` (`--neutral`); selected tiles and interactive cards (`aria-pressed`, `-checked`, `-selected`;
  `--ds-tile-selected-bg`, `--ds-card-selected-bg`, `--ds-selected-ring`), the button form of `.ds-card__action`,
  `.ds-card--elevated` (`--ds-card-shadow`), `.ds-tile__value--empty`, `.ds-tiles--3`, `--ds-tile-min-width`,
  `--ds-tiles-columns`; alert hooks (`--ds-alert-bg`, `-color`, `-icon`, `-edge`, the per-kind
  `--ds-alert-{success,warning,error}-{bg,color,icon}`, `--ds-alert-text-basis`), `.ds-alert--plain`,
  `.ds-alert__title`, `.ds-alert__actions`; `.ds-empty--done` with `.ds-empty__disc` (a confirmation state);
  `.ds-switch--locked` with `.ds-switch__icon`, `.ds-switch__hint`, `.ds-switch__meta`, `.ds-switch-list`,
  `--ds-switch-height`; the size hooks named under Migration.
- Forms: `.ds-field__hint--success` and icon-led hints, `--ds-field-error-color`, `--ds-field-success-color`; the
  search key (`<kbd class="ds-kbd ds-search__key">`); `.ds-check-list` (`--ds-check-list-max-height`) and
  `.ds-check__count`; `.ds-field--changed` with `.ds-field__changed`, `.ds-field__value`, `.ds-form--rows`;
  `--ds-input-height`, `--ds-check-height`, `--ds-input-bg`, `--ds-input-border`, `--ds-input-radius`,
  `--ds-input-focus-color`; `.ds-field--inset` (the filled field); `.ds-field__row`, `.ds-input-group` with `__affix`;
  `.ds-field__optional`, `__required`, `__foot`, `__counter`; `.ds-check-group` with `__children`; `.ds-slider`
  (`slider.css`); `.ds-input--grow` and `.ds-composer`; `.ds-form-actions--sticky`; `.ds-radios--tiles`; the other
  date and time types (`datetime-local`, `month`, `week`, `time`).
- App frame and page: segmented options as buttons (`aria-checked` / `aria-pressed`, `--ds-segmented-padding-x`);
  `.ds-drawer__back`, `__count`, collapsible groups (`.ds-drawer__group`, `.ds-drawer__toggle`), `__row`, `__action`,
  `__actions`, `__foot`, the rail (`data-drawer-collapsed`, `--ds-drawer-rail-width`); `createIndicator(…, { reveal })`;
  `.ds-account--capsule`; `.ds-topbar__actions`, `__search`, `__title`; `.ds-tabs` (`tabs.css`); page head parts
  (`.ds-page-head__back`, `__row`, `__text`, `__status`, `__actions`); `.ds-breadcrumbs`; `.ds-steps`; `.ds-banner` (a
  message for the whole app); `.ds-avatar`; `.ds-view--fill`, `.ds-view--fixed`; `--ds-content-pad-*` on the view;
  `.ds-app` height from `--ds-viewport-height`, `.ds-app--keyboard-hides-bar`; `--ds-stack-gap`, `.ds-stack--page`;
  `.ds-prose`, `.ds-code-block`; `.ds-auth` (a sign-in page); `hr` and `mark` in the page base.
- Theming: the roles `--ds-surface-overlay` (dialog box, side sheet panel) and `--ds-surface-popover` (menus, the
  combobox list, the save bar, the skip link), both `var(--ds-surface)` by default, and `--ds-color-scheme`
  (`light`), which sets `color-scheme` on the theme root. Shipped themes in `dist/themes/`: `dark.css` (load with
  `media="(prefers-color-scheme: dark)"`), `compact.css` (13/18 UI text and shorter controls; the default heights
  under a coarse pointer and on a `.ds-touch` theme root) and `contrast.css` (for `prefers-contrast: more`), all
  contrast-tested like the default palette.
- Data and tools in `dist/`: `deprecations.json` (every deprecated and removed name: kind, pattern, replacement,
  versions), `tokens.json` (every `--ds-*` name with its layer, default, type, component and deprecation),
  `ds.d.ts` and `js/*.d.ts` (types of `window.DS` and the ES modules), `tools/verify.mjs` and `tools/verify.sh` (a
  copy against `SHA256SUMS`, offline), `tools/check-theme.mjs` (a theme file) and `tools/check-project.mjs` (the
  project rules of AGENTS.md on a project, configured by `ds-check.json`, exceptions with reasons).
- `templates/update-dashboard-style.yml`: `SETUP: node | go | none`, verification with `tools/verify.sh` (no Node
  needed), an optional `CHECK` step.
- Docs: `docs/patterns.md` (page types and flows), the accessibility statement in `docs/rules.md` (WCAG 2.2 AA),
  "Language and locale" in `docs/install.md` (every built-in string and the option that replaces it), "Verify a copy"
  with the `SHA256SUMS` format as a contract, "Check a project", "Tokens as data", "Types", and the "Attributes" table
  of `docs/components.md` (what the system writes, what the page sets).
- Styleguide: demos of every new part, a live "Theme check" in the Colour section, the dark, compact, contrast and
  System presets; the Motion Lab has 86 demos (was 60). The live tour offers a colour scheme; the reference app an
  Appearance setting, a full-page device table in pages, row lists, a timeline, tabs and the save bar.

### Changed

- `.ds-presence` keeps its element's own background, colour, border, shadow and focus-snap transitions (put it on a
  wrapper, never on a `.ds-btn`, `.ds-chip` or `.ds-card`).
- `flip()` ranks gliding items between `max(--ds-z-raised, --ds-z-pinned) + 1` and `--ds-z-sticky - 1`, so they stay
  under sticky headers.
- The skeleton wave repaints nothing: one band layer per bone, moved by `translate`, with the same look. A skeleton may
  now sit beside other loops; the paint limit of skeletons leaves the docs.
- Table rows decide their state layers and their cells paint them (internal `--ds-table-row-layer`, `-pace`, `-tint`,
  `-line`): no table cell sits behind a row's `:has()`, so a DOM change anywhere no longer restyles every table cell
  in Chromium (the styleguide: 27ms to 4ms per change). Same look and timing.
- Direction: the components use logical properties (`margin-inline-*`, `padding-inline-*`, `inset-inline`,
  `text-align: start | end`) where the browser floor has them; no left-to-right pixel changes. The system is
  left-to-right only (said in `docs/install.md` and `docs/rules.md`); a test keeps new physical properties out of
  `src/components/` outside a list of reasons.
- Print: open menus, the combobox list, dialogs, side sheets, snackbars, tooltips, the shape loader, the skeleton band,
  the loading bar, the banner, the save bar, the selection bar and pagination are left out; drawn checkboxes, radios,
  switches, sliders, progress, spinners and steps keep their colours (`print-color-adjust: exact`); a closed table
  detail row takes no room; short cards, tiles, alerts, kv rows and facts do not break across pages.
- `dist/` gains the files named under Added; every file name of 1.x stays (service workers precache them) and
  `SHA256SUMS` keeps its format. `scripts/vendor.sh` and the copy's `tools/verify.sh` share one check (tested).
- The styleguide's `dim` preset no longer shrinks type and buttons (that is `compact` now).
- `perf.spec.js` asserts the whole fixture, skeleton included.

### Fixed

- Forced colours: a focused `.ds-input`, date field, input group and composer show a focus outline (the inset-shadow
  ring disappeared there); keyboard focus on the current drawer item shows; a checked, focused switch shows a
  `CanvasText` ring; the selected segmented option is no longer told by weight alone; `aria-disabled` controls look
  blocked, and a focused one (button, chip, switch, interactive card, tile) rings in `CanvasText`, not the brand
  colour.
- Busy and done buttons took Enter, Space and form submissions (only the pointer was blocked); `busy()` blanked and
  blocked a button without a done face for `--ds-hold-success`.
- `flip()` dropped focus to `<body>` when the focused item went.
- `DS.dom.morphHtml()` under a strict CSP (`style-src 'self'` without `style-src-attr`): styles go through the CSSOM.
  Shells that differ only in class order, an empty `style` or runtime state are patched, never replaced;
  `stagger()`, `countUp()` and `flip()` remove a `style` attribute they emptied.
- An `aria-disabled` switch hovered, grew and coloured like an enabled one; `aria-disabled` checkboxes, radios and
  filter chips looked enabled.
- A tooltip outlived its removed trigger (Firefox and WebKit kept it at the old place or in the corner of the view).
- `createIndicator()` added a second pill on a second call and leaked listeners through `document.fonts`: a second call
  returns the live handle, listeners are held weakly, and a detached track places nothing.
- `.ds-kv-list`: the last row kept its padding and long labels pushed the value out; lists kept the browser's top
  margin and `.ds-muted` its margins.
- A chip row glided by `flip()` showed `--ds-surface` behind the chips (the backing reads `--ds-flip-backdrop`).
- A fallback focus on a dialog box showed a ring.
- A staying element message without a close button could never be dismissed.
- A sideways table wrapper could not be scrolled by keyboard in WebKit: a wrapper without focusable cells is documented
  as a tab stop (`tabindex="0" role="region" aria-label`) with an inset ring.
- A text button in a snackbar was unreadable (`--ds-primary` on `--ds-inverse`).
- Derived colour roles were literals: a theme that set `--ds-text` kept near-black disabled ink.
- A leading icon in button faces kept the long start padding; `.ds-alert .ds-btn` centred on a 32px button (now the
  button's own height); `.ds-card__links` hung non-text buttons out of the card; card titles did not wrap long words.
- `.ds-btn--sm`, `.ds-toast__close`, `.ds-loader--sm`, `.ds-spinner--determinate` and `.ds-status__spinner` set
  shared size hooks on themselves, out of a theme's reach.
- A text-only brand was misaligned and hidden on phones; `<a>` drawer items flashed on tap (iOS); the top bar's menu
  button shrank at 320px.
- Every date field lost 4px of padding at 720px and below.
- `code` inside `pre` or a link got the inline chip on every line; a link's leading or trailing icon lost its
  spacing; `text-size-adjust` is set unprefixed too; `.ds-account__email:empty` takes no room.
- A menu placed by the script re-placed itself on its own scroll, so a menu scrolled to its end jumped back.
- Header comments that disagreed with the docs: the side sheet's close button without `data-close`, the combobox status
  without `role`, the menu button without `type` and `aria-expanded`, the drawer without `tabindex`, the toggle
  column of expandable rows without a named header; a test now compares the header markup of dialogs, sheets, the
  combobox and the frame with the docs.

### Deprecated (removed in 3.0 at the earliest)

All still work in 2.x, are marked **deprecated** in the docs and listed in `dist/deprecations.json`;
`tools/check-project.mjs` and `tools/check-theme.mjs` warn on them.

- `.ds-view--leaving` and its manual swap recipe: use `DS.motion.transition()`.
- The numeric second argument of `settleLoader(startedAt, now)`: use `settleLoader(startedAt, { now })`.
- `ds-fill-x`, `ds-fill-y`, `.ds-enter--fill-x`, `.ds-enter--fill-y` and the `enter()` variants `'fill-x'`,
  `'fill-y'`: a scaled mark squashes its round end; set `--ds-share` on the mark and use `.ds-enter--fill` or
  `enter(el, 'fill')`.
- `ds-edge-fade`, `--ds-table-fade-start`, `--ds-table-fade-end` (internal, unused since the wrappers fade through
  `ds-scroll-edge-start` / `-end`).
- `detach()` of the `DS.ripple.attach()` handle: use `destroy()`.

### Removed

The names of the Migration table, with their docs, Motion Lab entries and tests: `--ds-ease`,
`--ds-spinner-sm-track`, `--ds-state-pulse`, `--ds-loop-pulse`, `ds-pulse`, `ds-indeterminate`, `ds-sink-out`,
`ds-scale-out`, `ds-slide-out`, `DS.motion.easeOutCubic`, `.ds-btn__swap`, `data-open` on `.ds-combo`, the live-region
markup of the snackbar region and the hand recipe that moved snackbars into a side sheet. `src/deprecations.json` marks
them removed, and a repository test keeps them out of everything the system ships.

## 1.6.2

Fixes from the second and third final Motion 2 reviews. No class, token, hook or export was added, removed or
renamed (one token, `--ds-state-pulse`, is now marked deprecated); `dist/` gains one generated file,
`css/properties.css`, and `DS.overlay.tooltips()` and `DS.ripple.attach()` also take a shadow root. No migration is
required.

### Added

- `dist/css/properties.css`: every top-level `@property` of `ds.css`, alone (generated by the build; it registers the
  `--ds-*` custom properties and styles nothing). `@property` applies only in document-level stylesheets, so a widget
  that loads `ds.css` inside a shadow root links it in the host document; without it the indicator, progress,
  spinner and skeleton stepped instead of gliding and the per-element motion hooks inherited. Link `fonts/fonts.css`
  (and any theme `@font-face`) in the host document too: Chromium and Firefox ignore `@font-face` inside a shadow
  root.
- Shadow roots: `DS.dom`, `DS.motion` and `DS.overlay` read the focus of the element's own tree (inside a shadow root
  `document.activeElement` is the host), and the document-level Escape, outside-press and pointer listeners read the
  event's real origin (`composedPath()`). `DS.overlay.tooltips(shadowRoot)` and `DS.ripple.attach(shadowRoot)` take
  the shadow root (the tooltip and `.ds-ripples` go on the `.ds-theme` inside it). Before, a `morphHtml()` in a
  shadow root overwrote the focused field, a contained dialog ignored Escape, `close()` sent focus to `<body>`,
  `leave()` left focus in the element it made inert, and `tooltips()` and `attach()` threw.

### Fixed

- The wave of determinate progress travels on Chrome/Edge 111-119 too: `ds-progress-wave` animates
  `-webkit-mask-position` beside `mask-position` (those versions know only the prefixed masks; the wave was drawn
  but stood still).
- `DS.motion.leave(el, v, { then: 'hide' })` hides any ds component inside `.ds-theme` without `.ds-base` (an
  embedded widget): a zero-specificity `[hidden] { display: none }` scoped by `.ds-theme` in `ds.utilities`. Before,
  an alert, a button or a chip played its exit and snapped back visible with `hidden` set, because its layered
  `display` beat the browser's `[hidden]` rule. Project CSS still wins; `.ds-presence` and `hidden="until-found"` keep
  their own behaviour.
- Rows that glide through `DS.motion.flip()` in an interactive table cover the checkbox and the chevron of a row
  they cross: the raised items start one above `--ds-z-raised` (the level those controls are lifted to). Before, the
  lowest-ranked gliding row tied with them and a later row's controls painted over it.
- A direct child that a plain DOM `mutate` removed (`flip(list, () => item.remove())`) goes back for its exit where
  it was, before the node that followed it, not at the end of the container: `:first-child` and the like keep
  matching, so the first row of a `.ds-kv-list` no longer jumps 13px and grows a divider while it fades.
- `DS.dom.morphHtml()` on an `<svg>` (or MathML) target parses the markup in that namespace: a chart or a sparkline
  morphs in place, `<path/>` stays a sibling. Before, its shapes became HTML elements and the graphic disappeared.
- A menu or tooltip that the script places (no anchor positioning) keeps one hidden probe beside it while it is
  placed, instead of inserting and removing one on every scroll and resize frame: the page's MutationObservers and
  an indicator track around the menu no longer wake up per frame. The probe carries `data-ds-keep` and
  `aria-hidden` and goes once the popup closes.
- A div `.ds-dialog` (also `--contained`) and a div `.ds-sheet` that are later children of a `.ds-card` no longer
  take the card's 16px rhythm margin (`margin: 0`): the cover filled its container or the window 16px too low,
  leaving a band without scrim.
- A contained dialog in a container taller than the window keeps its box in the visible part
  (`.ds-dialog__box` is `position: sticky` there); before, it centred below the fold while focus moved into it.
- Under a layered reset such as Bootstrap's reboot, a group's `legend.ds-field__label` no longer floats, widens or
  takes a margin, inline code under `.ds-base` keeps the colour of its text, and the bare checkbox of a table keeps no
  UA margin, so a table head with a select-all checkbox is 48px (not 49px) and the select column the same width in
  every engine.
- The styleguide's page skeleton keeps the height of the page that replaces it, and its button keeps its width: the
  stage stacks both states in one cell, so nothing under the pointer moves.
- One menu shared by several triggers (the row menu of a table): a press on another trigger while the menu is still
  leaving (its pointerdown starts the outside close, its click opens) opens it afresh from that trigger, placed at
  and growing from it, with `aria-expanded` on it. Before, the menu turned back open under the previous trigger,
  which kept `aria-expanded="true"`, and the new trigger could not close it.
- The two announcers `DS.overlay.toast()` puts after a snackbar region and the tooltip of `DS.overlay.tooltips()`
  carry `data-ds-keep`, so a `DS.dom.morphHtml()` of the region's parent or of the theme never matches, patches or
  removes them. Before, such a re-render patched the polite announcer into the next page element, and the next
  message was written into that element (its content gone); the tooltip was removed and its trigger showed nothing.
  An announcer that is no longer one is replaced.
- A native dialog or side sheet opened or closed with the pointer shows no keyboard focus ring in Safari: WebKit marks
  what `showModal()` and `close()` focus (the `autofocus` control, then the opener) as `:focus-visible` even after a
  click. Inside a pointer event, `DS.overlay` keeps the visibility the previous focus had (`focus({ focusVisible:
  false })`, progressive); a keyboard open, Escape and an open from script keep the engine's own choice.
- `DS.motion.staggerOnce()` leaves out `data-ds-keep` helpers: the 1px `data-scrolled` sentinel first in a `.ds-view`
  no longer takes the first step of the stagger (an invisible entrance that started the content 30ms late).
- Styleguide: the read-outs under the Motion Lab demos keep their line while empty (`.ds-card > p:empty` hid them, so
  the first Replay grew the card by 24px and moved every card below), and code labels in the curve captions, the
  ladder heads and the rules list no longer break at a hyphen or a space.

- Radio cards lay the focus layer (`--ds-state-focus`) under their keyboard ring, at once, like every other ringed
  action with a layer (their input has no halo inside a card); a key press keeps it under the ripple. Before, a
  focused radio card showed only the ring.
- A disabled or `aria-disabled` clickable tile (`:is(button, a).ds-tile`) or interactive card shows no hover or press
  layer, as it already took no press morph (an `aria-disabled` one keeps its focus layer). Before, it reacted to a
  press with the pressed layer but kept its shape.
- A dialog driven by hand without `data-state` (the keyframe path: div markup by hand, and a native dialog by hand
  on engines without `allow-discrete`) rises `--ds-distance-sm` like every other dialog path and like its own exit;
  it rose `--ds-distance-md` (8px) because `ds-grow-in` fell back to it. Its `--ds-dur-medium` stays (motion.md
  rule 3).
- `DS.dom.morphHtml()` keeps the choice of a focused `<select>` (its selected options) and of a focused radio (the
  checked radio of its group) when the markup selects or checks another one: the options of a select and the other
  radios of a group are never the focused element, so their `selected` and `checked` were written, and in Chromium
  and WebKit a changed attribute on an untouched option or radio moved the choice by itself. The live choice is
  recorded before the patch and put back after it. Before, a poll re-rendered the choice the user was making.
- `DS.motion.roll()`: the new line starts once the old one is half out (`--ds-enter-delay`: half of
  `--ds-dur-fast`). The spring of the entrance caught up with the accelerating exit, and for about 70ms both lines
  showed half a line apart, stacked as double text. The roll takes 75ms longer.
- `DS.overlay`: a press inside a web component (an icon element with its own shadow root) in a menu item or the
  menu's trigger counts as inside again; the document-level listeners test the event's composed path instead of
  `contains()` of its innermost node, which stops at the shadow boundary. Before (an earlier 1.6.2 change), a press
  on an item's icon closed the menu without running the item, a press on the trigger's icon closed and reopened
  it, Escape in a field inside a web component in a contained dialog was taken for one outside it, and a pointer
  over a web component in a snackbar resumed its timer.
- A native dialog or side sheet opened with the mouse leaves a text field it focuses (`autofocus` or the first
  focusable) alone: the WebKit ring correction of this release blurred and refocused whatever `showModal()`
  focused, in every engine, so the field's blur handlers ran on open (validate-on-blur, a combobox closing) and it
  lost `:focus-visible` and its ring. Text-entry controls always show the ring, so they are skipped.
- The trap of a div dialog, side sheet or modal drawer in a shadow root crosses it through its host: the host page
  around the widget is inert while it is open (before, the walk stopped at the shadow root, and Tab left the dialog
  for the host page). The trap also takes siblings the page adds while it is open (a banner a host script appends
  to `<body>`, a re-rendered section); before, Tab reached them.
- A dialog or side sheet of a page with `.ds-theme` on `<html>` leaves the `.ds-toasts` region of an embedded
  widget with its own `.ds-theme` in the widget: it moves only the regions of its own theme. Before, the widget's
  messages took the page's tokens and font while it was open, and widget code that looked its region up in its own
  root found none, so `toast()` dropped the message.
- Styleguide: the poll toggle of the status chips sits before the chip, so the button does not jump with the
  chip's width on every tick; the live table reserves the width of its widest status chip, so its columns no longer
  shift sideways when "Overloaded" comes and goes; punctuation that touches a code label in the Motion Lab stays
  on its line (`.sg-glue`); half-width Motion Lab cards come in pairs before a wide card, so none sits alone beside
  an empty column.

### Deprecated

- `--ds-state-pulse`: read only by the deprecated `ds-pulse` (deprecated in fact since 1.4.0, now marked); removed in
  2.0 with it.

### Docs

- The arc spinner has no delay of its own: it turns at once, and its container (`.ds-loading`, a busy button) or a
  `.ds-enter--delayed` wrapper delays it (motion.md rule 9, the Feedback table and Utilities, components.md
  Loading, rules.md "No flicker" said it waited the loader delay).
- theming.md, "Embedded in someone else's page": the guard lists every element the documented markup uses (`h5`,
  `h6`, `small`, `strong`, `code`, `dl`, `dt`, `dd`, `section`, `header`, `nav`, `main`, `fieldset`, `legend`,
  `details`, `summary`, `caption` were missing; a test keeps it complete), and a paragraph on shadow roots.
- install.md: picking single files also needs `components/utilities.css`, and `components/ripple.css` with
  `DS.ripple.attach()` (without it the ripple span widened the pressed control); the `dist/` table lists
  `css/properties.css`.
- components.md: the brand link (`.ds-brand`) and the skip link (`.ds-skip`) are named among the actions that are no
  ripple hosts, with their reasons; the unit test also checks the `<a>` and `<button>` classes of the component
  header markup (a link gets its pointer cursor from the browser, so the `cursor: pointer` scan missed them).
- motion.md rule 1 and Principle 3, plan D29 and "What may animate": layout sizes open on `--ds-ease-out`; the
  collapsible and expandable rows close accelerating on `--ds-ease-in` (as their choreography rows already said),
  and the validation message room animates `height` through `interpolate-size` only where it exists.
- theming.md, "Embedded in someone else's page": a widget puts `ds-base` on its root as well (its `html` and `body`
  rules never match a `<div>`); without it links in the documented markup took the browser's link colour and
  `strong` its bold. Shadow roots: `fonts/fonts.css` goes in the host document (also install.md).
- motion.md: where `DS.ripple.attach(shadowRoot)` puts `.ds-ripples` and `DS.overlay.tooltips(shadowRoot)` the
  tooltip; the `data-ds-keep` list names the snackbar announcers and the tooltip; `open()` names the fresh open of a
  popup from another trigger; `staggerOnce()` names the helpers it leaves out.
- theming.md "Brand palette" and the README theme set `--ds-inverse-primary` (the snackbar icon), the one role a
  component reads that does not follow `--ds-primary`.
- components.md, Tiles: a note that `countUp()` never takes the target from the markup and counts from 0 on its first
  call (pass `from` for a tile rendered with its figure).
- The tile markup no longer shows a `data-count` attribute that nothing reads; motion.md points to the decisions
  behind the (Dn) identifiers; the `dom.js` header lists `data-drawer-open` and `.ds-toast--shown` among the state
  helpers own; the button docs and a table comment no longer suggest that a supported engine may lack `:has()`.
- install.md, CDN: the Content-Security-Policy note names every `data:` mask a blocked `img-src` hides: the check of
  a checked checkbox (its state then shows by colour alone), the value of determinate progress and the arc of the
  determinate spinner (`--ds-progress-wave`, `--ds-progress-ring-wave`), besides the date and search glyphs; a test
  keeps the note complete.
- The progressive-feature lists of AGENTS.md, README.md and motion.md name `scrollbar-gutter` and
  `focus({ focusVisible: false })` (a test keeps the AGENTS and README lists equal).
- components.md, Table: a column whose content changes width under live data gets a stable width (`min-width` on
  its `th`, or a `<col>`); `flip()` moves rows only vertically.
- The radio-card, tile and card sections, the dialog docs, motion.md (`DS.dom` focus, the `roll()` row, the div
  trap and the hosted snackbar regions) and theming.md (shadow roots, a host page that uses Dashboard-Style) follow
  the fixes above.

## 1.6.1

Fixes from the final Motion 2 review. No class, token, hook or export was added, removed or renamed;
`lockScroll()` / `unlockScroll()` take an optional document, and `flip()` marks its container while items glide. No
migration is required.

### Added

- `DS.overlay.lockScroll(doc)` / `unlockScroll(doc)`: an optional document whose lock to count (default: the global
  document, as before).
- While items glide, `DS.motion.flip()` sets `data-ds-glide` and `--ds-flip-backdrop` (the background colour of the
  nearest painted ancestor) on the container, removed with the last glide; table rows read them (below).

### Fixed

- Table rows that glide through `DS.motion.flip()` (sort, filter, live data) are opaque while they move: every row of
  a gliding `tbody` gets a backing in the colour behind the table, a selected row its colour over it, and the cells'
  hover and press layers stay above. Before, rows had no background of their own, so the z-order `flip()` gives the
  moving rows hid nothing and the texts, checkboxes and chevrons of crossing rows lay over each other.
- An overlay that `DS.overlay` moved into an open native dialog or sheet (a menu, a popup, a dialog or a sheet) goes
  back to its place when the page removes that host while the overlay is open or closing, so a later `open()` shows
  it again; nested moves (a menu in a native dialog in a native sheet) go back topmost first. Before, it left the
  document with the host and every later `open()` returned at once.
- The modal drawer's frame loses `data-drawer-open` also when the page replaces the open drawer element alone (a
  re-rendered drawer component): `DS.overlay` keeps the `.ds-app` it opened the drawer in. Before, the scrim kept
  covering the page and the documented toggle called `close()` on a drawer that was never open.
- Escape closes a `.ds-dialog--contained` only when pressed inside the container it covers: in the host page around an
  embedded widget the key stays the host's (its own modal dialog closes, a search field clears), instead of closing
  the widget's dialog and being prevented.
- `DS.overlay` keeps no detached drawer or snackbar region alive: the drawer breakpoint listener is one per window and
  the tab-visibility listener one per document, both holding the elements through `WeakRef`, and the document
  listeners are made outside the per-element scope. Before, every drawer passed to `open()` / `close()` and every
  region that showed a snackbar stayed in memory with its whole frame, one per re-render of an SPA.
- `.ds-card` (also the interactive one as a link or button), `.ds-dialog__box`, `.ds-sheet__panel` and `.ds-table` set
  their own text colour (`--ds-text`) on their surfaces: in a widget without `.ds-base`, text in them no longer takes
  the host page's colour (near-white on white on a dark host). Inside `.ds-base` nothing changes.
- The external icon after a link in a `.ds-table` cell and in a `.ds-facts` value has its own `display`, so a layered
  preflight (`svg { display: block }`) no longer drops it below the link text.

- `DS.dom.morphHtml` keeps the state a DS helper owns while it runs, as it is, present or absent, and takes the
  template's value again once the helper lets go. Before, a live re-render (D7: `flip()` with `morphHtml`) closed a row
  menu opened by `DS.overlay` in the middle of an interaction (its dropped `hidden` came back, `data-state` and the
  opener's `aria-expanded` went, focus was lost while `DS.overlay` still counted it open), reset `aria-expanded` on the
  in-row trigger of a menu at the end of `.ds-theme`, and took a `busy()` button's busy face and then its success face
  away at the next poll. Owned now: `DS.overlay`'s state on the overlay and its box or panel, its opener, `.ds-app`, its
  anchor and what its trap took (until the close settled), a tooltip's `aria-describedby`, `.ds-toast--shown`,
  `busy()`'s `aria-busy` and `.ds-btn--done`, `countUp()`'s `aria-busy`, `min-width` and tabular figures, a running
  swap's `.ds-swap`, `.ds-icon-swap` and `data-swap`, and `flip()`'s `z-index` and `position` on gliding items and
  `data-ds-glide` and `--ds-flip-backdrop` on their container. The record sits on the element under
  `Symbol.for('ds.owned')`, so every copy of `ds.js` on a page shares it (`docs/motion.md`, DS.dom).
- `DS.overlay` makes every `.ds-app > .ds-drawer` of the page cross 900px in place from load on (`.ds-drawer--instant`
  for two frames, a stale open state closed), not only a drawer it had opened or closed once: a page that drives the
  drawer through `DS.overlay` without the breakpoint snippet no longer slides it off screen (or back in) on its first
  resize across 900px.
- A menu opened from a trigger that also has a tooltip (`[data-tip]`) stays anchored: the tooltip and the popup share
  one counted `anchor-name` on the trigger, removed only once neither uses it. Before, the tooltip's fade removed the
  name and the open menu jumped to the corner of the viewport (and closing the menu took the name from a tooltip that
  still showed).
- An overlay that the page removes from the document while it is open or closing is closed at once, without motion:
  its scroll lock, the inert of its trap, `aria-expanded`, its runtime state and its Escape entry go. Before, the page
  stayed locked (and, for the div markup, inert) and the next Escape was swallowed.
- `.ds-dialog--contained` opened through `DS.overlay` traps focus and input only inside its positioned container and
  takes no scroll lock (nor `.ds-dialog--nested`): the host page around an embedded widget stays usable, instead of
  being inert and locked while it showed uncovered.
- `lockScroll(doc)` / `unlockScroll(doc)` count per document (default: the global one, as before) and the overlays
  lock their own document, so an overlay in a same-origin iframe driven from the parent's `DS` locks the iframe's page.
  The scroll-driven animations are told by their timeline's `axis`, not by `instanceof` a constructor of this realm, so
  `settled()`, the handoffs, `flip()` and `resyncScroll()` treat those of an iframe right too.
- A named indicator (`createIndicator(..., { name })`) keeps no `view-transition-name` for a page load while a dialog,
  a side sheet or the modal drawer is open: its group glided undimmed above the scrim and over the drawer's labels.
- `.ds-errors` keeps its bullets under a layered reset that sets `list-style: none` on lists.
- `DS.motion.flip(..., { live: true })` with a plain DOM `mutate` (`() => stack.prepend(alert)`, the alerts recipe)
  holds while the list is pointed at or focused: a `mutate` without parameters cannot honour `holdOrder`, so it waits
  whole (every such call, in order) and glides on release. A `mutate` that takes the options but changes the items all
  the same glides at once from where they were. Before, the insert ran at once under the pointer, without a glide,
  and the release glided nothing.
- `flip()` owns what it holds on the container while items glide or leave (the inline `position`, `isolation`,
  `min-height` and `align-content`), and the chip glide of `DS.ripple` the row's `data-ds-glide` and
  `--ds-chips-backdrop`, so `DS.dom.morphHtml` keeps them. Before, a live re-render of the card around a gliding
  list dropped them: the content below jumped by the held height, a leaving item jumped to the corner of the next
  positioned ancestor and the raised rows escaped the list's isolation.
- `countUp()` counts on from a figure that a re-render (`DS.dom.morphHtml`) or the page wrote since its last count,
  when that text reads back through `format`; one that does not lands at once. Before, it counted from the last value
  it wrote itself: a polled tile whose markup carries the figure jumped back and counted up again, also to the value
  it already showed.
- The snackbar region (with its announcers) that an open dialog or side sheet took in, and an overlay that
  `DS.overlay` adopted into an open native dialog, carry `data-ds-keep` while they are away from home (a page's own
  `data-ds-keep` stays), and a close finds a hosted region even if it left the document. Before, a re-render of the
  open dialog, or of the view holding it, removed them for good: no snackbar showed or was announced again on that
  page, and the adopted menu was lost.
- Two copies of `ds.js` on a page (a host page and an embedded widget, any 1.6.1 or later) share the overlay state
  that belongs to the document, under `document[Symbol.for('ds.overlay')]`: Escape closes the topmost layer
  whichever copy opened it, the scroll lock holds until the last modal of either copy closes, and anchor names and
  tooltip ids are numbered once per page. Before, Escape closed the first copy's lower overlay and left the top one
  open, closing one copy's modal released the lock under the other's, and both copies wrote `--ds-anchor-1` and
  `ds-tooltip-1`.
- `tooltips(root)` returns the first handle on a second call for the same root, and a trigger inside nested roots
  (`tooltips(document)` on the page, `tooltips(widgetRoot)` in a widget) is served by the innermost one only. Before,
  both showed a tooltip and the trigger was described twice.
- Menus and tooltips that the script places (no popover or anchor positioning) under a host ancestor with
  `transform`, `filter` or `contain` write their coordinates in that box's terms, so they sit at their trigger instead
  of off by the ancestor's offset.
- A sortable column without its arrow keeps the arrow's room (in its padding), so a sort
  that moves to another column no longer resizes every column in the frame where the rows start to glide.
- `DS.ripple.attach()` keeps one pending blur listener per focused action: a button pressed with Enter again and
  again (a stepper) no longer collects one per press.
- `DS.dom.morphHtml` keeps only the ripple properties DS writes (`--ds-ripple-x`, `-y`, `-r`): a host's
  `--ds-ripple-color` now follows the template like any other inline style.
- Opening a dialog or side sheet with an empty snackbar region no longer measures the region and flushes its style
  (two forced layouts of the page before the entrance's first frame on the div markup).

### Docs and styleguide

- `docs/theming.md`, "Embedded in someone else's page": give the widget root the body type and ink that `.ds-base`
  would give (`font: var(--ds-font-body); color: var(--ds-text)`); full-window modals still count the scroll lock but
  only `.ds-base` stops the host page from scrolling (with a rule a widget may add); Escape of a contained dialog. The
  example of a host rule that outweighs the `revert-layer` guard is now one that does (`.content .toolbar button`).
  `docs/components.md` and `docs/motion.md` say the same in the Dialog section, the Escape stack and "Removed while
  open".
- The list of motion hooks that themes never set is the same everywhere (AGENTS.md and its project block,
  `docs/theming.md` rule 2, `themes/example.css`): `--ds-clip-from`, `--ds-draw-length`, `--ds-scan-*`,
  `--ds-indicator-lag` and `--ds-indicator-dur` were missing; the theme test now also rejects `--ds-scan-*`, and a
  unit test keeps the lists in step with it. `docs/tokens.md` no longer counts `--ds-ripple-color`, a theme hook,
  among the runtime properties.
- `docs/theming.md`, "Square containers, round actions": the comment says that the chip line makes chips pills (they
  are not by default).
- `docs/motion.md`, rule 2 and the `--ds-ease-in` row: small leaving effects accelerate on `--ds-ease-in`, while the
  overlay layers and the View Transition old snapshots fade out on the standard curve, as the Overlays table says
  (they turn back on the curve of their entrance). The DS.dom list of the state a patch keeps names everything the
  helpers own (`flip()`'s container, the chip row, the `inert` of a closing box or panel) and the nodes `DS.overlay`
  marks `data-ds-keep`; the alerts recipe shows the live insert.
- `docs/theming.md`, "Embedded in someone else's page": a host ancestor with `transform`, `filter`, `perspective`,
  `will-change` or `contain` becomes the box that fixed layers fill (prefer the native `<dialog>` there), and what two
  copies share; `docs/install.md`, "Two copies on one page", points there.
- `themes/example.css`: `--ds-text-3` is `#6e7878` (4.54:1 on its white surface; it was 4.48:1, under the 4.5:1 the
  file asks for). A unit test checks every text pair of the template.
- Motion Lab: a stage is at least its demo's height and grows where its content needs more (a narrow window), so no
  demo is cut off; the disclosure reserves its open height at every width, and the skeleton's loading bar sits on its
  pane's top edge instead of crossing the label, so the skeleton keeps the height of the page that replaces it.
- `test/browser/README.md` lists the `shell-overlay.html` fixture.
- `scripts/vendor.sh --check` (and `vendor.ps1`) fail on a symbolic link inside the copy, which `SHA256SUMS` cannot
  cover; `docs/install.md` says so.
- CI: each run on `main` has a concurrency group of its own, so a run that waits is never cancelled by a newer push.
- Motion Lab: the validation demo hangs from the top of its stage, so the field that was left stays in place while its
  message opens (before, the re-centred form moved it up by half the message).
- `docs/theming.md`, "Embedded in someone else's page": the host page's unlayered element CSS beats a widget's
  components (with a `revert-layer` guard to hand them back), and the stacking of the div markup and the snackbar
  region in the host's stacking context (prefer the native `<dialog>` in a widget). `docs/install.md` points there.
- README: `ds.js` also brings `DS.overlay`; `scrollbar-gutter` in the list of progressive features.
- `docs/components.md`: the drawer breakpoint snippet is only for pages that drive the drawer by hand; the ripple skips
  presses with a non-primary pointer button, not the non-primary button variants.
- `themes/example.css` marks `--ds-spinner-sm-track` deprecated and without effect.
- The 1.0.0 migration notes say exactly what to do about `prefersReducedMotion()` (calls and imports) and that
  `enter()` clears any `inert`.
- Styleguide: "View without the drawer" plays the documented recipe (the panel morphs inside
  `DS.motion.transition()`) instead of fading the drawer and then snapping the panel; a Motion Lab read-out reserves
  its line, so the first Replay no longer moves the buttons under the pointer; code labels no longer break at their
  hyphens, and the notes set token and class names as code; the loaders note says that the arc spinner has no delay of
  its own.

## 1.6.0

Motion 2, the close: the Motion Lab, the complete motion reference and the final review in every engine, with the
fixes it found. Additive: no class, token, hook or export was removed or renamed, and no migration is required.

### Added

- The Motion Lab, `styleguide/motion.html` (styleguide only, not in `dist/`): every curve plotted as the browser plays
  it (with the spring's peak), the duration ladder and `travelDuration()`, and a replayable demo of every keyframe,
  motion utility, JS function and component choreography, each with "Rapid toggle" and "Reverse at 50%" where the
  motion is reversible. A speed select in the top bar of both styleguide pages (1×, 0.5×, 0.25×, 0.1×, stored;
  `?speed=` wins) sets `--ds-time-scale`. The demos are a registry, `styleguide/lab.js`.
- `docs/motion.md` as one reference: principles, the motion tokens (moved from `docs/tokens.md`, which links to
  them), the numbered rules with the test that holds each, the choreography of every component (with the overlay
  table: tracks, durations, curves, origin, delays, interruption and focus per layer), interruption, keyframes and
  utilities, the JS modules, recipes, View Transitions, scroll-driven effects and every progressive feature with its
  fallback. `docs/components.md` points every component with motion to its row.
- Browser tests (`test/browser/`): `lab.spec.js` (coverage of every primitive by a demo, every demo's timeline and
  settled stage per engine, continuity of every reversal at `?speed=0.1`, rapid toggles, the overlay table compared
  with what each engine plays), `review.spec.js` (quiet load, hover and disabled sweeps, forced colours, the page
  load transition, the style scope of a DOM change) and `perf.spec.js` (the paint budget and the
  style recalc time of that DOM change, in a `perf` project of its own that asserts only when run alone).

### Changed

- Header comments: every "Progressive:" note in `src/` is a list of `<feature> (<what it adds>): <what happens
  without it>`, so each newer feature names its fallback (tested); they ship in `dist/css/` and `dist/ds.js`.
- `themes/example.css` lists the button colour hooks one by one (`--ds-btn-bg`, `--ds-btn-color`, `--ds-btn-border`,
  `--ds-btn-hover-*`, `--ds-btn-disabled-*`) instead of abbreviating them.
- Docs: rule 1 of `docs/motion.md` lists the named exceptions of the animate list one per line, rule 3 the
  exit/entrance pairs as a table (both read by the tests); `docs/components.md` "Loading" gains "Paint cost", the
  measured limits of the loaders (one skeleton surface per view, alone; a few shape loaders; `--flat` bars in dense
  tables).
- Fixed: in Chromium every DOM change inside a `.ds-card` (a text, a re-render) restyled a large part of the page,
  about 35ms per change on a page of 2,800 elements, through the rule that lines facts up with the tiles of their card
  (`.ds-card:has(.ds-tiles) > .ds-facts > :nth-child(2)`). The facts now take two equal columns with the tiles' gap,
  so the second fact still starts where the third tile does (the second below 1100px) with no rule per fact: about
  3-4ms per change, the cost of the other `:has()` rules (`review.spec.js`, "style scope", counts the
  restyled elements; `perf.spec.js` times the recalc).
- Fixed: in Chromium the check of a filter chip drew late, or only when something else restyled the row: a change of
  `:checked` did not reach the `[pathLength]` rule of the stroke. The stroke now runs on the chip's `<svg>`
  (`.ds-chip__check`) and its path inherits it; the success check of `.ds-btn--done` draws on its `<svg>` the same
  way. A css test keeps every moving rule off `[pathLength]` selectors.
- Fixed: `DS.indicator.createIndicator()` on a track the page had already styled (a toggle row, a drawer rendered
  before the script ran) faded the pressed toggle's own tint, or a label's colour, out on load while the pill was
  already in place. The items now take their look under the new pill at once (one style flush with `data-ds-moving`
  on the track, like the pill's first placement).
- Fixed: a `.ds-dialog--contained` on the page (shown in place, inside the panel) counted as an open modal, so
  `css/optional/view-transitions.css` left the view, the panel and the docked drawer unnamed on that page and
  `DS.motion.transition()` lifted their names: on a page load the docked drawer slid out or in as if it left the view,
  and two sets of its labels showed. A contained dialog now never counts (`review.spec.js`, "page loads", checks the
  frame's groups both ways).
- Fixed: a named indicator (`createIndicator(..., { name })`) whose pill was scrolled out of its track's view when
  the page was left or revealed (the active item of a long drawer list scrolled down to a link further on) glided in
  from outside the drawer, over the top bar. Such a pill now keeps no name for that navigation (`pageswap`,
  `pagereveal`) and goes or comes with its page.
- `loading.css` names `.ds-skeleton__line--mid` in its header.
- Docs: `docs/install.md` ("Multi-page apps") asks to keep what the first render waits for short
  and to build the rest after the reveal: an engine skips the transition when the new page comes after its timeout.
  The Motion Lab does so with its demos.

### Deprecated

Every name deprecated in 1.0.0 to 1.5.0, still working and removed in 2.0:

- `--ds-ease`: use `--ds-ease-emphasized` (1.0.0).
- `--ds-spinner-sm-track`: the colour mix of the small spinner's ring replaces it (1.0.0).
- `DS.motion.easeOutCubic`: no longer used, `countUp()` runs on `--ds-ease-value` (1.0.0).
- `ds-sink-out`, `ds-scale-out`, `ds-slide-out`: use `ds-fade-out` with `ds-drop-out`, `ds-shrink-out` or
  `ds-shift-out` (1.0.0).
- `.ds-btn__swap`: use `.ds-btn__faces` and `DS.motion.busy()` (1.1.0).
- The snackbar region with `role="status" aria-live="polite"` (and `role="alert"` on errors): use the region without
  a role, `DS.overlay.toast()` announces; the manual `--ds-toast-shift` recipe for a side sheet and closing snackbars
  with `setTimeout`: `toast()` does both (1.3.0).
- `data-open` on `.ds-combo`: `aria-expanded="true"` on the field turns the chevron (1.3.0).
- `ds-pulse` with `--ds-loop-pulse`: skeletons run `ds-skeleton-wave`; `ds-indeterminate`: indeterminate progress
  runs `ds-progress-head` and `ds-progress-tail` (1.4.0).

### For 2.0

- The skeleton wave paints the whole view on every frame of its sweep (`background-attachment: fixed`, which gives
  the one diagonal band across all bones): without GPU rasterisation a full-width skeleton drops most frames
  (`test/browser/perf.spec.js` records it). Compositing the bones or a scrolling band removes the cost but loses the
  diagonal across the bones in Chromium and Firefox, a change of the look D11 chose; until then the limits in
  `docs/components.md` apply.
- Remove the deprecated names above.

## 1.5.0

Motion 2, views and scrolling: the motion between views (D15) and the motion that follows scrolling (D5, D33).
`DS.motion.transition()` moves to another view with Material 3's patterns (fade-through between destinations, shared
axis X for forward and back, a container transform from a card or row into its detail) as a View Transition where
the engine has them and `.ds-theme` sits on `<html>`; the top bar stays still and the drawer's pill glides.
Elsewhere, and in an embedded widget, the new view fades through with `.ds-enter--swap` (D30). Multi-page apps opt in
with `css/optional/view-transitions.css`. Where scroll timelines exist, the panel hairline, the top bar's tint, a
sheet head's hairline and a table's edge fades follow the scroll position; `data-scrolled` and the static fade stay
the fallback. Additive: no class, token, hook or export was removed or renamed, and no migration is required.

### Added

- `DS.motion.transition(update, { type, from })`: `type` `'fade-through'` (default), `'forward'`, `'back'` or
  `'container'` (`from` grows into the element `update` returns; a fade-through without either, or when a scroller
  clips a part of one of them that lies in the window, since its group would paint over the top bar); any other type
  throws a `TypeError`. For navigation
  only (a destination, a drill-down, another record), never for data. With View Transitions and `.ds-theme` on
  `<html>` it writes `data-ds-vt="<type>"` on `<html>` while it runs, which names the view (`ds-view`), the panel
  (`ds-panel`), the docked drawer (`ds-drawer`) and the body of an open modal side sheet (`ds-sheet-body`; a sheet
  shown inline in a page is never named); a running transition is
  skipped by the next call (every update runs, in call order), and an update still pending after `--ds-dur-long`
  loses its motion, so input is never blocked for long (fetch first, then swap quickly). Under an open dialog or
  sheet (opened by `DS.overlay`, or shown by hand: a native one with `showModal()`, the div markup by removing
  `hidden`), or the modal drawer (open or still leaving), the page frame keeps no names, so a record swap moves only
  the sheet's body and a navigation from the modal drawer crossfades under it (close the drawer inside the update). A
  snackbar region with messages is named `ds-toasts` meanwhile (toast.css) and stays on top and still, so a message
  never blinks out under the view (one such region per page; the name of a further one is lifted). A press while it
  runs, which Chromium and WebKit deliver to `<html>`, skips the motion, and its click goes to the element under the
  pointer once the page is live again, so quick clicks through records or destinations all land. A
  view that shows or hides the drawer (the panel changes its width) also gets `data-ds-vt-morph` on `<html>`.
  Without View Transitions, or with `.ds-theme` on a wrapper, the update runs at once and the returned element (else
  the first child of the themed `.ds-view` that is not `data-ds-keep` or `aria-hidden`, never the `data-scrolled`
  sentinel) enters with `.ds-enter--swap`. Returns a Promise; it rejects with the update's error after
  cleaning up.
- The view-transition rules in `motion.css` (`ds.utilities`, every selector on `.ds-theme::view-transition-*`, no
  keyframes of their own): the root's crossfade over `--ds-dur-fast`, every group on the spring over
  `--ds-dur-slow`, fade-through, shared axis X (24px, `--ds-distance-xl`; the new view travels with its fade), the
  container transform over `--ds-dur-long` (one opaque surface: the detail's live image under the card's, which
  fades out within `--ds-dur-fast`), snackbars above every group, and the panel morph of a view with or without the drawer
  (`data-drawer-hidden` toggled inside the update, keyed on `data-ds-vt-morph`: the panel and the view's content
  morph over `--ds-dur-long`, the content never scaled; a plain swap ends within `--ds-dur-slow`; the docked drawer leaves to the left or slides back in). `DS.motion.enter(drawer)` inside a transition stays quiet, so one recipe
  serves both paths.
- `css/optional/view-transitions.css` (`dist/css/optional/`, checksummed, never part of `ds.css`): View Transitions
  across page loads for multi-page apps (`@view-transition { navigation: auto; }` and permanent names for the view,
  the panel and the docked drawer, left off while the modal drawer, a dialog or a side sheet is open, also one shown
  by hand, so the page being left stays under it and its scrim). Requires `<html class="ds-theme">`; load it after `ds.css`. Its header holds the
  `pagereveal` snippet for shared axis on history steps ([install.md](docs/install.md#multi-page-apps)). Chromium ends
  a `<link rel="expect">` render block early once a script parses markup such as an `<svg>` into the page before the
  expected element: the docs say to create the named indicator in the script that builds the navigation.
- `createIndicator(track, { ..., name })`: the pill's permanent `view-transition-name` `ds-indicator-<name>` (unique
  per page), so it glides from the old page's item to the new page's on a page load. Within a page
  `DS.motion.transition()` lifts the name while it runs and the pill glides live, under its labels.
- `DS.overlay.open(el, { opener, container: true })`: the opener (a card, a table row) grows into a dialog or side
  sheet (container transform over `--ds-dur-long`); opt-in, since the page is frozen meanwhile. `close()` keeps its
  own exit; without View Transitions it is the usual entrance from the opener, and an opener that its scroller clips
  (the row of a wide table that overflows its wrapper) gets that entrance inside a short fade-through.
- Scroll-driven hairlines and tint: the panel's top hairline (`scroll(nearest block)`), the top bar's tint (the
  view's named timeline `--ds-view-scroll`, scoped by `.ds-app`) and a side sheet's head hairline (the body's
  `--ds-sheet-scroll`, scoped by the panel) fade in over the first `--ds-space-2` of scroll. Progressive:
  `animation-timeline`, `timeline-scope`; elsewhere `data-scrolled` as before.
- Table edge fades that follow the scroll (`scroll(self inline)`): a fade on each side of a sideways-scrolling table
  that still has columns to show, none on a table that fits; the registered, internal `--ds-table-fade-start` and
  `--ds-table-fade-end`. Elsewhere the static right fade stays.
- `DS.motion.resyncScroll(root?)`: restarts the scroll-driven animations whose scroller stopped overflowing. Chromium
  and WebKit keep such an animation's last progress on the inactive timeline, so a scrolled view whose content
  shrank kept the top bar tinted and its hairline shown, a sheet its head hairline, and a table that now fits its
  left edge fade. `transition()` calls it after every update; a page calls it after a change in place that may
  shrink a scroller (the sentinel snippet does when the scroller is back at its top).
- `.ds-reveal--scroll` (`ds.utilities`): a block of a long read-only page fades in and rises `--ds-distance-md` while
  it scrolls into view (`view()`), opaque once 96px of it are in view; static where `view()` is missing and in print.
- Keyframes `ds-edge-fade` (the table's edge fades) and `ds-scroll-fade` (opacity 0 to 1 with both ends named, for
  the hairlines and the tint: a scroller without overflow shows nothing), both scroll-linked.
- Docs: "View transitions" and "Scroll-driven effects" in `docs/motion.md`; the sentinel snippet that sets
  `data-scrolled` from an `IntersectionObserver` (App frame and Side sheet in `docs/components.md`); "Multi-page
  apps" in `docs/install.md`. The styleguide has a views page (`styleguide/views.html`).

### Changed

- **Top bar tint** (D33, 1.2.0): it follows the scroll position where scroll timelines exist. It is now a layer of its
  own behind the bar's content (`.ds-topbar::before`, hidden in forced colours) instead of the bar's
  `background-color`; `--ds-topbar-scrolled-bg` keeps its meaning (`transparent` keeps the flat bar). A project that
  overrode `.ds-app[data-scrolled] .ds-topbar { background-color }` sets the hook instead.
- `DS.motion.settled()`, the handoffs of `enter()`/`leave()` and `flip()` ignore scroll-driven animations (they follow
  the scroll, never finish and take no time-based `currentTime`).
- `.ds-view--leaving` and its manual swap recipe still work; `DS.motion.transition()` replaces them in the docs. A
  manual swap waits on the view's content element (`view.querySelector(':scope > .ds-content')`), not
  `settled(view)`, and not `view.firstElementChild`, which is the `data-scrolled` sentinel.

## 1.4.0

Motion 2, feedback and data: the Material 3 Expressive loaders (a shape-morphing block loader, the growing and
shrinking arc spinner, wavy circular progress), the 2024 progress look with the two-segment indeterminate
choreography, one calm skeleton wave per surface, and data that glides: table rows (hover layer, selection,
expandable rows, sort, filter and live data through `DS.motion.flip`), status chips, tiles, alerts and empty states.
New clickable cards and table rows, a press morph on clickable tiles, and `.ds-collapsible` with asymmetric timing,
a chevron and an unclipped focus ring. Additive: no class, token, hook or export was removed or renamed, and no
migration is required. Loaders, progress and skeletons deliberately change their default look (D10, D11): each
change is listed under "Changed" with what a project can do (usually nothing; at most `--flat` or a hook).

### Added

- `.ds-loader` (`loader.css`), the M3 Expressive loading indicator and the block loader: a shape that morphs through
  the seven M3 shapes (each step landing on the spring) while it turns, 48px (`--sm` 24px, `--contained` on an
  `--ds-accent` disc); it fades in after `--ds-delay-loader`, and inside `.ds-boot`, `.ds-loading` and
  `.ds-skeleton` it has no delay of its own. Hooks `--ds-loader-size`, `--ds-loader-color`. It keeps its own delay in
  `.ds-stagger` and `.ds-reveal`, like the other loaders.
- `.ds-spinner--determinate` (circular progress, 40px: the share as an arc, a gap, the track in `--ds-accent`, the
  arc wavy) with `.ds-spinner--flat`; it never spins and its value glides like linear progress. Hook
  `--ds-spinner-width` (2px; 4px on the ring).
- `.ds-progress--flat`: the classic progress look (no gap, no stop dot, no wave), for dense table cells.
- `.ds-card--interactive` (on `<a>`, `<button>`, or a `<div>` with a `.ds-card__action` link stretched over it): a
  state layer, the focus ring and focus layer, the press morph to `--ds-radius-card-pressed` (12 to 8px) and the
  ripple; nothing moves on hover. The `<a>` and `<button>` forms lay their content out as a column from the top, so
  cards in one grid row line up. Hook `--ds-card-hover-shadow` (default none).
- Table: `.ds-table--interactive` with `.ds-table__row-link` (a row that opens its record: cursor, inset ring, focus,
  press layer and the ripple on the row; separate borders, so Firefox keeps the hairlines next to a selected row),
  `.ds-table__row--selected` (and any row with a checked checkbox in a cell:
  `--ds-table-row-selected`, default `--ds-accent`), expandable rows (`.ds-table__toggle`, `.ds-table__detail`,
  `.ds-table__expand`: `grid-template-rows` over `--ds-dur-medium` on `--ds-ease-out`, closing over `--ds-dur-base`
  on `--ds-ease-in`), and `.ds-table__sort-arrow`, an opt-in marker on the sort button's svg: one up arrow for both
  directions that turns 180deg on the spring for `aria-sort="descending"` (an unmarked arrow is never turned, so a
  page that renders `arrowDown` for a descending column keeps its direction). The row cells' layers, the selection
  cue and the row ripple also take a `<th scope="row">` row header as a row's cell. Hooks
  `--ds-table-row-hover`, `--ds-table-row-selected`.
- `.ds-chevron` (`motion.css`, `ds.utilities`): a disclosure chevron that turns 180deg on the spring in the summary of
  an open `<details>` or under `aria-expanded="true"`; a `.ds-collapsible` summary holding one drops its native
  marker.
- Clickable tiles morph on press (16 to 12px): hook `--ds-tile-radius-pressed` (fallback `--ds-radius-md`).
- Progress hooks `--ds-progress-gap` (4px), `--ds-progress-stop` (the stop dot, `--ds-primary`) and
  `--ds-progress-track` (the remaining track, `--ds-accent`).
- Tokens: the loop scales `--ds-loop-arc` (5332ms: four 1333ms arc cycles, so the advancing start meets itself),
  `--ds-loop-loader` (4550ms, 7 × 650ms), `--ds-loop-skeleton` (2s) and `--ds-loop-wave` (1.2s); `--ds-state-pulse`
  (.45, now read by `ds-pulse`); `--ds-progress-wave`, `--ds-progress-ring-wave` (generated mask images) and
  `--ds-progress-wave-length` (40px); `--ds-progress-wave-start` (.06) and `--ds-progress-wave-ramp` (.05), the
  shares between which a short bar or arc turns from flat to wavy; the role `--ds-skeleton-highlight` (`var(--ds-surface-high)`).
- Registered runtime properties (top level): `--ds-progress` (`<number>`, inheriting, so the bar, the track and a
  nested ring land together), `--ds-progress-head-1`, `--ds-progress-head-2`, `--ds-progress-tail-1`,
  `--ds-progress-tail-2` (`<percentage>`, inheriting), `--ds-spinner-arc` and `--ds-spinner-start` (`<angle>`, not
  inheriting), `--ds-skeleton-x` (`<length>`, inheriting).
- Read-only `--ds-content-pad-top` and `--ds-content-pad-x` on `.ds-content` (its resulting padding; read, never
  set).
- Keyframes `ds-spinner-arc`, `ds-loader-morph`, `ds-loader-turn`, `ds-progress-head`, `ds-progress-tail`,
  `ds-progress-wave` and `ds-skeleton-wave`; `scripts/motion-curves.mjs` generates their stops (and the masks),
  checked by `npm run check`.
- `DS.ripple.RIPPLE_HOSTS` gains `.ds-card--interactive` (also the `<div>` form) and the body rows of
  `.ds-table--interactive`; Enter on a `.ds-table__row-link` or `.ds-card__action` ripples its row or card, while a
  press on another link or control inside the row or `<div>` card ripples neither (as its `:active` layer).
- `.ds-leave` on a `.ds-loadbar` or a `.ds-skeleton` keeps its loop running, so the segments and the wave move on
  while the exit fades them out; a skeleton's band rests off screen (`--ds-skeleton-x: -150vw`) whenever the wave
  does not run.
- Docs: "Data motion" in motion.md (what glides, what changes at once, recipes for a live list, filtering while
  typing, table sort, alert dismiss and insert, the loader refresh, a tile with its bar); the progress aria rules
  (no `aria-valuenow` but an `aria-valuetext` while the share is unknown).

### Changed

- **Progress** (D10): the 2024 look is the default: the bar ends at the share, a 4px gap, the remaining track in
  `--ds-accent` with a stop dot; the bar is wavy and its wave travels until `aria-valuenow="100"`, where the flat bar
  fades in. Short bars stay flat (up to 6%, wavy from 11%, cross-fading on the gliding share), as does a short arc of
  the determinate ring, so a starting bar never shows a loose piece of the wave. The bar is cut by `clip-path` at the share instead of `scaleX()`. A project that wants the old bar adds
  `.ds-progress--flat`; one that styled `.ds-progress__bar`'s `transform` reads `--ds-progress` instead.
- **Indeterminate progress** runs the M3 two-segment choreography on `ds-progress-head` and `ds-progress-tail`, wavy
  (flat with `--flat`); the loading bar (`.ds-loadbar`) runs the same two segments, flat. Dropping the modifier
  stops the segments and fades them out while the bar grows from 0 to its share.
- **Spinner**: the M3 arc that grows and shrinks while it turns, without a track (set `--ds-spinner-track` to keep
  one; `.ds-spinner--sm` keeps its faint ring). A project override of `border-width` becomes `--ds-spinner-width`.
- `--ds-loop-spin` is 1568ms (was 1s) and `--ds-loop-indeterminate` 1800ms (was 2s), the M3 periods.
- **Skeletons** (D11): one calm diagonal wave passes over every bone of a surface at once (a band fixed to the
  viewport, after the entrance) instead of the pulse. Where `background-attachment: fixed` does not hold (iOS, a
  transformed ancestor) the bones stay in time but the band no longer runs across them.
- **Table row hover**: a `currentColor` layer on the cells (`--ds-state-hover-lg`), so it adds to a selected row's
  colour; it no longer uses `--ds-backdrop` (the square preset gets its hover back). `--ds-table-row-hover` brings
  back a fixed colour.
- **`.ds-progress--waiting`** keeps the track's 4px (hidden) instead of `display: none`, so the label no longer jumps
  when the wait ends; the track fades in over `--ds-dur-fast`.
- **`.ds-stale`** dims only after `--ds-delay-loader` (200ms), so an answer within 200ms never dims; removing it stays
  instant.
- **Status chips** change colour over `--ds-dur-medium` (was `--ds-dur-fast`), the container and the icon together;
  an icon or spinner that comes in new fades in and springs up (progressive: `@starting-style`, also on a chip's
  first render).
- **`.ds-collapsible`** opens over `--ds-dur-medium` on `--ds-ease-out` while its content fades in, and closes faster,
  accelerating (`--ds-dur-base` on `--ds-ease-in`).
- **`.ds-errors`**: its chevron turns 180deg (`rotate`) with the list, like `.ds-chevron`; document it as
  `<details class="ds-errors ds-collapsible">` for the collapsible timing.
- **A standalone loading bar** fades in after `--ds-delay-loader` (inside a skeleton only its loops run).
- **`DS.motion.flip()`** also handles plain DOM calls in `mutate`: a direct child that `mutate` removes fades out in
  place, out of flow, and a new item fades in (unless it runs an entrance of its own), so
  `flip(stack, () => alert.remove())` and `flip(stack, () => stack.prepend(alert))` need nothing else; a grid
  container keeps `align-content: start` while its height is held.
- **Docs**: the documented markup of `.ds-boot` and `.ds-loading` uses `.ds-loader`; the old `.ds-spinner` markup in
  both keeps working (the spinner is documented as the inline loader). The interactive table row is a ripple host.

### Deprecated (removed in 2.0)

- Keyframes `ds-pulse` (now `opacity: var(--ds-state-pulse)`) and `ds-indeterminate`: the skeleton wave and the
  two-segment keyframes replace them.

### Fixed

- The indeterminate to determinate handoff: the bar never sweeps across or shrinks from 100%; it grows from 0 to its
  share while the segments fade out where they stopped.
- The squashed cap of a progress bar at small shares (the clip keeps a round end at any share).
- The focus ring of a control flush with the content edge of an open `.ds-collapsible` is no longer cut
  (`overflow-clip-margin`, progressive).
- The loading bar's margins follow the content panel's padding (also at 720px and below) and, inside `.ds-page`,
  the page's centring, so it reaches the panel edges at any width (also above `--ds-content-max`); the view's scroll
  hairline no longer draws over it.
- A keyed reorder through `DS.dom.morphHtml` (a table sort) no longer replays the entrance of a moved row's status
  icon where `moveBefore` is missing (WebKit, Firefox 128, Chrome before 133): the moved node carries `data-ds-moving`
  for one style flush, and `motion.css` turns its transitions off meanwhile, so no `@starting-style` plays again.
- The label of `.ds-progress--waiting` no longer shifts by 4px when the wait ends.

## 1.3.0

Motion 2, the overlays: a new `DS.overlay` module opens and closes dialogs, side sheets, the modal drawer, menus and
the combobox list (native `<dialog>` with `showModal()` first, the div markup as fallback), shows snackbars and
tooltips. Every overlay is interruptible: its motion runs on transitions keyed on `data-state`, so a close taken back
continues from where it is. Side sheets slide their full width on the spring, popups and tooltips grow out of their
trigger, snackbars stack. New `.ds-menu` and `.ds-presence`. Additive: no class, token, hook or export was removed or
renamed, and no migration is required. Screenshots of the overlays change (see "Changed").

### Added

- `DS.overlay` (`js/overlay.js`, `window.DS.overlay`): `open(el, { opener })`, `close(el)`, `lockScroll()`,
  `unlockScroll()`, `toast(region, content, { kind, persistent, timeout, closeLabel })` and `tooltips(root)`, plus the
  fallback constants `TOAST_MS` (4000), `TOAST_MAX_MS` (10000), `TOAST_LIMIT` (3), `TOOLTIP_DELAY_MS` (500),
  `TOOLTIP_SKIP_MS` (300) and `TOOLTIP_HIDE_MS` (100). Focus moves in at once (`autofocus` first) and is back on the
  opener as soon as the close starts; the div markup makes the page inert, a native dialog uses `showModal()`; only the
  box or panel is inert during the exit, so the backdrop keeps catching clicks; Escape closes only the top layer (one
  document listener in the bubble phase, after the page's own handlers: a widget inside that calls `preventDefault()`
  keeps the overlay open; a native `cancel` plays the exit); closing a dialog, sheet or the drawer closes the menus
  and lists open inside it; overlays over each other compose (the div trap follows the stack, so a dialog from a div
  sheet or from the modal drawer takes input while the overlay under it stays inert, and a menu, dialog or sheet (div
  or native) opened over a native dialog or sheet moves inside it while it shows, so a native dialog leaving a native
  sheet stays above its panel and a click on its scrim never closes the sheet); `[data-close]` closes; a press on a
  leaving backdrop or the drawer's scrim keeps focus on the opener; the scroll lock
  is reference-counted and
  keeps the room of a scrollbar it removes (`scrollbar-gutter`, else `padding-right`); a modal drawer acts only at 900px
  and below and handles the breakpoint by itself; an overlay outside `.ds-theme` logs one warning. Docs: motion.md,
  "DS.overlay".
- Native markup for the dialog and the side sheet: `<dialog class="ds-dialog">` and `<dialog class="ds-sheet">` with the
  same inner tree as the div markup (UA box reset, transparent `::backdrop`, hidden while closed). Driven by hand
  (`showModal()`, `close()`), they play the same transitions where `@starting-style` and `allow-discrete` exist.
- `.ds-menu` (`menu.css`): `.ds-menu__item` (48px rows with icon, state layer, inset ring and ripple; a ripple host),
  `.ds-menu__label`, `.ds-menu__check` (the check of a `menuitemcheckbox`), `.ds-menu__divider`; `DS.overlay` places
  it, moves focus with the arrows, Home and End and closes on Escape, Tab, an item and a pointerdown outside.
- `.ds-presence` (`motion.css`, `ds.utilities`): a project element toggled with `hidden`, as a `[popover]` or as a
  `<dialog>` of its own fades in and grows on the spring, leaves faster, and a toggle mid-way continues from where it
  is (progressive; elsewhere an instant toggle).
- `.ds-dialog--nested` (set by `DS.overlay` for a dialog over another modal) with the role `--ds-scrim-nested`
  (`rgba(0, 0, 0, .16)`) and the hook `--ds-dialog-scrim` (default `--ds-scrim`).
- Tooltip delays (layer 1, time-scaled): `--ds-delay-tooltip` (500ms), `--ds-delay-tooltip-skip` (300ms, the warm-up
  along a toolbar) and `--ds-delay-tooltip-hide` (100ms, the grace that lets the pointer cross onto the tooltip).
- Runtime placement properties: `--ds-tooltip-x` / `--ds-tooltip-y` on `.ds-tooltip` and `--ds-menu-x` / `--ds-menu-y`
  on `.ds-menu`, written where CSS anchor positioning is missing. Where popover and anchor positioning exist, menus,
  the combobox list and the tooltip open as `popover="manual"` in the top layer (`data-anchored`), so a scrolling
  dialog or sheet never clips them.
- Snackbars: `kind: 'info'` (`.ds-toast--info`), a stack of at most three, two `.ds-sr` live regions that `toast()`
  adds (polite, assertive for errors), and the regions move into an open dialog or side sheet (in a sheet they glide
  with the panel's edge, `data-follow`), so a message shown meanwhile is above its scrim, announced and usable (also
  through the exit: they glide back inside the leaving overlay and return to the page once it ended); the div trap
  and the modal drawer never make the regions or their announcers inert.
- Tooltips (`tooltips(root)`): one tooltip per root, delay, warm-up, swap in place, hoverable and dismissable
  (WCAG 1.4.13), `aria-describedby` only when the tip adds to the trigger's name, re-placed on scroll and resize,
  `data-placement` on the side it really sits on (anchored: read again after a swap);
  like the snackbar regions, the div trap and the modal drawer never make it inert, so a trigger inside them shows
  a tooltip that is hoverable and heard.

### Changed

- **Side sheet** (D16): the panel is opaque throughout and slides its full width in from the edge on the spatial
  spring over `--ds-dur-long` while the scrim fades; it leaves back to the edge in `--ds-dur-base` on `--ds-ease-exit`
  without a fade (was a 24px slide with a fade over `--ds-dur-slow`). At 600px and below it rises from the bottom on
  `--ds-ease-out` (as tall as the screen, a spring would carry its head past the top edge) and falls back down. A
  48px strip of its background past the outer edge covers the spring's overshoot.
- **Dialog**: the box fades over `--ds-dur-fast` while it grows from `--ds-scale-enter` and rises `--ds-distance-sm`
  on the spring over `--ds-dur-slow`, from an origin towards its opener; the exit mirrors it in `--ds-dur-base`
  (opacity on `--ds-ease-in-out`, movement on `--ds-ease-exit`). The keyframe path (div markup by hand) leaves with
  `ds-fade-out` plus `ds-shrink-out`. At 600px and below the box decelerates instead of springing.
- **Tooltip**: fades in and grows from `--ds-scale-tooltip` at the side of its trigger (was around its centre; no
  rise), springing to full size over `--ds-dur-medium`, and leaves with a fade only in `--ds-dur-instant`; a
  `transform` placement still composes.
- **Popups**: the combobox list (and the new menu) fades in while its `clip-path` opens from the trigger's edge and it
  grows from `--ds-scale-popup` at the trigger, on the spring over `--ds-dur-medium`; the shadow is there from the
  first frame (the clip keeps `--ds-space-6` of room on the other edges; `originFrom()` writes `--ds-clip-from` with
  that room, and `ds-clip-in` / `ds-clip-out` open to `--ds-space-6` beyond the box). It leaves with a fade only in
  `--ds-dur-instant`. It opens below its trigger when it fits, else on the side with more room (`data-placement="top"`
  above), and never taller than the room on that side (it scrolls inside), so it never covers its trigger or the
  field being typed into.
- **Combobox chevron**: follows `aria-expanded` on the field and turns 180deg on the spring with the list.
- **Combobox active option**: its layer fades in over `--ds-dur-micro` and goes at once (no trail on a held arrow
  key, no separate hover layer).
- **Snackbars**: the rise runs on the spring; insertions and removals glide through `DS.motion.flip()`, so the other
  messages never jump; the timer grows with the text length and pauses on hover, focus and a hidden tab.
- **Forced colours**: the combobox list and the menu keep their edge (a transparent outline, no `CanvasText` outline
  of their own), and the chosen option shows `SelectedItem` / `SelectedItemText`.

### Fixed

- Focus is on the opener in the same task as Escape, Cancel or a backdrop click, and nothing behind an exiting
  overlay is clickable through it.
- Reopening a dialog or sheet mid-close continues from its current opacity and scale in every engine (no jump to
  full opacity, no restarted entrance).
- Tabbing between tooltip triggers keeps the tooltip and swaps it in place; moving onto the icon inside a trigger
  keeps it.
- Closing a focused snackbar never drops focus to `<body>`; five messages in a row never show more than three.
- The scroll lock no longer shifts a body-scrolling page sideways.
- A combobox at the bottom of a dialog is no longer clipped where popover and anchor positioning exist (elsewhere
  its list flips above). In a short window the list (and a menu) fits the room on its side instead of covering the
  field (or its trigger), and every option stays reachable.
- `DS.motion.flip()`: a removed item keeps its measured size while it fades out of flow (a `max-width: 100%` item of
  a shrink-wrapped container collapsed before).

### Deprecated (removed in 2.0)

- The snackbar region `<div class="ds-toasts" role="status" aria-live="polite">` with `role="alert"` on errors: use the
  region without role (`toast()` announces through its own live regions).
- The manual `--ds-toast-shift` / `--ds-toast-shift-y` recipe for moving snackbars into a side sheet (`toast()` follows
  the sheet by itself), and closing snackbars with `setTimeout(..., 4000)`.
- `data-open` on `.ds-combo`: `aria-expanded="true"` on the field turns the chevron.

## 1.2.0

Motion 2, the navigation: the sliding indicator stretches toward its target and lands on the spring, follows its
items by itself and survives `morphHtml`; the drawer comes back on the x axis, the modal drawer opens on the spring
and closes accelerating without a gap at the screen edge; labels change colour with the pill; the segmented switch
can keep its width; the top bar tints on scroll and the view keeps a stable scrollbar gutter. Additive: no class,
token, hook or export was removed or renamed. Screenshots of the frame change (see "Changed").

### Added

- `DS.indicator.createIndicator(track, { active, className, observe })`: the new `observe` option (default `true`)
  makes the pill follow `aria-current`, `aria-pressed`, `aria-selected` and `aria-checked` and added or removed
  items by itself; `update()` stays (needed only with `observe: false`). `DS.indicator.OVERSHOOT` (0.05) exports
  the overshoot share of a glide.
- `.ds-drawer--instant`: no slide and no scrim fade while the window crosses 900px (the page sets it for two frames
  on the `matchMedia` change; snippet in docs/components.md, App frame).
- `data-label` on `.ds-segmented__option` (its text again): the option keeps the width of its heavier current
  weight, so the switch never changes width. Such an option lays out its content in a column (for its text, or one
  wrapper); options without it are unchanged.
- Hooks: `--ds-topbar-scrolled-bg` (default `--ds-surface-high`), `--ds-view-scrollbar-gutter` (default `stable`),
  `--ds-indicator-radius` (the pill's corners) and `--ds-indicator-lag` (how long the trailing edge waits, default
  `--ds-dur-micro`; a motion hook, themes never set it).
- The top bar tints to a surface container colour while the view is scrolled (`data-scrolled`), with the panel's
  hairline, over `--ds-dur-fast`. Filled toolbar fields in it (`.ds-input--filled`, `.ds-search`) step up to
  `--ds-surface-highest` meanwhile, so they keep their container on the tint.

### Changed

- **The indicator** is drawn by `clip-path` on a box and moved by `translate` (never by animating `width`,
  `height` or `transform`): a glide stretches toward the target (the leading edge leads, the trailing edge follows
  `--ds-indicator-lag` later on `--ds-ease-in-out`, so the pill is never shorter than its item), lands on the
  spatial spring (the leading edge passes the target by at most 5 % of the travel) and
  takes `--ds-dur-medium` for a neighbour up to `--ds-dur-slow` for long jumps (`travelDuration()`, written as
  `--ds-indicator-dur` on the track). A new target mid-glide continues from where the pill is; the first placement
  and a resize jump. `--ds-indicator-x/-y/-w/-h` describe the box, which is the union of two items during a glide.
  An empty state contracts the pill to its centre and an item after it grows from there (an item that comes back
  while the pill still contracts turns it from where it is). Own indicator classes
  keep working: their `border-radius` is read at rest and copied into `--ds-indicator-radius`.
- `DS.motion.enter(drawer)` slides the drawer in from the left on the x axis (the same keyframes, duration and
  curves as `enter(drawer, 'slide')`); it rose from below before.
- **Modal drawer**: opens on the spring over `--ds-dur-long` (was `--ds-dur-slow` on the emphasized curve), the
  scrim fades in over `--ds-dur-medium`; closes over `--ds-dur-base` on `--ds-ease-exit` (was `--ds-ease-in`). A
  bleed of its own background on its left covers the spring's overshoot.
- Drawer and segmented labels change colour on the pill's timing (`--ds-indicator-dur`), so the new label turns
  `--ds-on-accent` while its pill arrives; their weight still switches at once. Without the indicator script, and
  in the modal drawer, tint and label change in one frame (the colour transition exists only under
  `.ds-has-indicator`).
- `.ds-btn[aria-pressed="true"]` inside `.ds-has-indicator` (a track of toggles with a sliding indicator) drops its
  own tint and border, so the pill alone paints the selection and no second highlight appears in place while it
  travels; the labels change colour on `--ds-indicator-dur`. Toggles outside a track are unchanged.
- `.ds-view` keeps a stable scrollbar gutter, so a classic scrollbar that appears never shifts the content; set
  `--ds-view-scrollbar-gutter: auto` for the old behaviour (overlay scrollbars and Safari before 18.2 are
  unaffected).

### Fixed

- The indicator follows item size and position changes (a badge or a wrap in an earlier item, a group expanding
  above, the active label growing) and fonts that load late; `destroy()` stops late callbacks and leaves no
  observer, listener or frame behind.
- No drawer slide when the window crosses 900px (with the documented snippet).
- The styleguide's nav no longer walks the pill through every section on a click (the scroll-spy pattern is in
  docs/components.md, App frame).

## 1.1.0

Motion 2, the controls: every action presses with a layer in `--ds-dur-micro`, a ripple and a shape morph; every
focus ring is solid from the first frame and snaps to its offset, with a focus layer; buttons get busy and success
faces without a width jump and icon swaps; chips, the switch and drawn checkboxes and radios move on the shared
timing; fields and disabled states follow one model. Additive: no class, token, hook or export was removed or
renamed. Screenshots of pressed, focused and disabled controls change (see "Changed").

### Added

- Button faces: `.ds-btn__faces` with `.ds-btn__face`, `.ds-btn__face--busy` and `.ds-btn__face--done` stack every
  label in one cell, so a button never changes width; `.ds-btn--done` shows the success face (its `pathLength="1"`
  check draws itself) and blocks the button like `aria-busy`.
- `DS.motion.busy(button, work, { done })`: `aria-busy` at once, the busy face only after `--ds-delay-loader`, kept
  for the loader minimum once shown, then `.ds-btn--done` for `--ds-hold-success`; a failure clears at once and
  rethrows; a second call while busy returns the running promise.
- `.ds-icon-swap` (`.ds-icon-swap__a`, `.ds-icon-swap__b`, `data-swap` or an `aria-pressed="true"` ancestor) and
  the `'icon'` kind of `DS.motion.crossfade()`: the incoming icon fades in and springs up from `--ds-scale-small`, a
  drawn glyph draws itself, the outgoing one fades.
- Switch state words: `.ds-switch__state` may hold both `.ds-switch__on` and `.ds-switch__off`; the CSS shows the
  right one and crossfades them (the single-word markup still works).
- `.ds-checkbox` and `.ds-radio-input`: a drawn checkbox or radio anywhere (a table column, a list item).
- Tokens: `--ds-state-focus` (.10, the focus layer), `--ds-hold-success` (600ms); roles `--ds-radius-check` (2px),
  `--ds-radius-action-pressed` (12px) and `--ds-radius-card-pressed` (`= --ds-radius-sm`).
- Hooks: `--ds-btn-radius-pressed`, `--ds-btn-state-focus-opacity`, `--ds-chip-height`, `--ds-chip-check-size`,
  `--ds-chip-disabled-border`, `--ds-chip-disabled-bg`, `--ds-switch-halo`, `--ds-switch-disabled-track`,
  `--ds-switch-disabled-handle`, `--ds-check-size`, `--ds-check-target`, `--ds-drawer-item-height`.
- Ripple hosts: `.ds-radio` (radio cards, also when their input is pressed), `.ds-combo__toggle` and
  `.ds-errors summary`; `DS.ripple.RIPPLE_HOSTS` exports the host selector. `DS.ripple.attach()` also glides chips
  that a toggle moves to another line (FLIP, each chip on an opaque backing in the colour behind the row:
  `data-ds-glide`, `--ds-chips-backdrop`; the toggled chip opens with its neighbour by `clip-path` and its label
  glides, so the two never overlap), and plays the check slot from where it is on a rapid toggle.
- `.ds-pressed` (the press `DS.ripple` holds) now counts as a press on every host: chips, segmented options, drawer
  items, tiles, table sort buttons, radio cards, the combobox toggle and the errors summary; a static
  `.ds-pressed` shows a held press.

### Changed

- **Press morph**: buttons (`.ds-btn`, also `--icon` and `--disc`), drawer items (and the pill under the active
  one) and the combobox toggle turn squarer while pressed (`--ds-radius-action-pressed`, in `--ds-dur-micro`) and
  spring back on release (`--ds-ease-spatial`, `--ds-dur-medium`); radio cards go to `--ds-radius-card-pressed`;
  segmented options morph the clip of their state layer. The rest radius of a pill is now `min(radius, half the
  height)` instead of 9999px (the same look; the morph interpolates over its whole run). Disabled, `aria-disabled`,
  busy and done controls neither morph nor show a press.
- **Micro press-in**: every press layer comes in `--ds-dur-micro` instead of `--ds-dur-instant`.
- **Focus**: every ring is solid from the first frame and snaps from offset + width to its offset
  (`outline-offset`, `--ds-dur-fast`; inset rings of segmented options, drawer items and `.ds-parts` links from the
  edge inward), with a focus layer (`--ds-state-focus`) under it on buttons, chips, segmented options, drawer items,
  tiles, table sort buttons and the errors summary. Drawer items now have a ring of their own; `.ds-link-btn` and
  `.ds-errors summary` show theirs without `.ds-base`; `.ds-parts` no longer clips the rings of its links.
- **Checkboxes and radios are drawn** on the native input (`appearance: none`, no wrapper) instead of
  `accent-color`, in `.ds-check`, `.ds-table` (not the hidden input of a switch or chip in a cell), radio cards and
  the new classes: the check wipes in from its short
  arm, the indeterminate dash and the check morph into each other, the radio dot springs, and a 40px halo shows
  hover (also on the `.ds-check` row), press and focus (on touch screens a tap grows it from the centre). In a table
  cell the box now centres on the text (`vertical-align: middle`). Forced colours use system colours.
- **Chips**: the check keeps its room in the layout; selecting grows its slot (`width`, `--ds-ease-out`, the
  neighbours follow) and draws the check; deselecting reverses it.
- **Switch**: the handle is one 28px box moved and scaled on the spring (`translate`, `scale`; never above 1), grows
  to its full size while pressed, and a halo (`--ds-switch-halo`) follows it for hover, press and focus.
- **One disabled model**: chips and the switch now take the button's neutral Material look
  (`--ds-disabled-fill`, `--ds-disabled-ink`; a dimming theme keeps their own colours), show no hover, press,
  ripple or halo and take the `not-allowed` cursor; buttons, chips, the switch and the inputs fade into the
  disabled look on `--ds-dur-fast`.
- **Fields**: on blur border, inner ring and text fade back together (the ring never fades as half a ring); the
  label takes the primary colour with the ring and keeps the error ink on an invalid field; an error message fades
  in and, where `interpolate-size` exists, its room opens from 0 when it appears while focus is in its form or
  field (a message already in the markup only fades, so nothing shifts on load).
- `.ds-link-btn`: a press darkens its underline. `.ds-errors summary`: a state layer, the ripple and a 4px padding
  that hangs into the space around it. `.ds-combo__toggle`: a state layer, the ripple and the press morph.
- The `check` glyph is drawn from its short arm (`M4 12l5 5L20 6`, `pathLength="1"`); the tick of `checkCircle`
  can draw itself too. Same shape; only `ds-draw` and drawn checks change direction.
- A project `transition` on `.ds-btn`, `.ds-chip__body` or `.ds-input` (unlayered, so it wins) replaces the
  component's list, and with it the focus snap, the spring back of the morph and the ring's fade: set hooks
  instead (docs/theming.md, "Layers").

### Fixed

- `DS.ripple`: a chip or radio card whose input is disabled by a disabled `<fieldset>` (such as
  `<fieldset class="ds-chips" disabled>`) no longer gets a ripple or `.ds-pressed`; only an input's own `disabled`
  attribute counted before.

### Deprecated (removed in 2.0)

- `.ds-btn__swap` (one face that the page swaps): use `.ds-btn__faces` and `DS.motion.busy()`.

## 1.0.0

Motion 2, the foundation and the engine: a newer browser floor, cascade layers, one motion scheme on every device, a
spatial spring, a rebuilt keyframe catalogue, and a `DS.motion` that reads its timing from the tokens, continues
interrupted motion from where it is and glides data (FLIP, figures that count from what they show). `DS.dom.morphHtml`
patches in place, and the new `DS.ripple` grows a ripple from the pointer. Breaking; read the migration notes.

### Migration

- **Browser floor**: Safari 16.4, Chrome/Edge 111, Firefox 128. Older browsers are no longer supported.
- **`@layer`**: every stylesheet puts its rules into `ds.tokens`, `ds.base`, `ds.components`, `ds.motion` or
  `ds.utilities`, so unlayered project CSS now beats every component, whatever its specificity. Move resets
  (normalize, `button { font: inherit }`, framework preflights) into a layer declared before ds: `@layer reset;`
  first (or `@layer reset, ds, app;`), then load `ds.css`. Drop the `!important` and doubled selectors written
  against ds. A layered `!important` (`[hidden]` with `.ds-base`, `.ds-sr`, `.ds-num`, `.ds-center`) beats a
  project's unlayered `!important`. Never wrap a theme in `@layer`: unlayered, it wins over every `ds.*` layer.
- **Reduced motion is removed**: the `prefers-reduced-motion` switch in `tokens.css`, `.ds-motion-full` (it does
  nothing now: remove it) and `DS.motion.prefersReducedMotion()`. Remove every call and every import of it: with
  `ds.js` a call throws, and an ES-module import of it from `js/motion.js` stops the module from loading. Motion is
  the same on every device. There is no reduced mode, and none is supported: motion tokens and hooks stay untouched.
- **Motion hooks no longer inherit** (`--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`, `--ds-clip-from`,
  `--ds-draw-length`, `--ds-i`): set them on the animating element.
- **Duration-like tokens are `calc()` expressions** (`calc(250ms * var(--ds-time-scale, 1))`): read them with
  `DS.motion`, not `parseInt`.
- **Movement keyframes animate `translate` and `scale`**, so they compose with an element's `transform`. A project
  rule that sets `translate` or `scale` on an animating element is overridden while the animation runs.
- **Exits are movement-only**: pair `ds-drop-out`, `ds-shrink-out` and `ds-shift-out` with `ds-fade-out`.
  `ds-sink-out`, `ds-scale-out` and `ds-slide-out` are deprecated (still fade + move).
- `.ds-enter.ds-enter` and `.ds-leave.ds-leave` are single classes; the `ds.utilities` layer makes them win.
- Never put `.ds-enter` on a looping element (a spinner) in static markup: the entrance now plays once and ends,
  and it replaces the loop while the class stays. Wrap the spinner (`<span class="ds-enter ds-enter--delayed">`)
  or use `.ds-loading`.
- **Motion character**: spatial movement floats on a spring (`--ds-ease-spatial`, a 2.8 % overshoot that settles),
  exits accelerate on the new exit curves (`--ds-ease-in`, `--ds-ease-exit` for large surfaces), and `--ds-ease` is
  deprecated (use `--ds-ease-emphasized`). Screenshots and timings of animated states change.

Behaviour of the JS exports (`DS.dom`, `DS.motion`):

- **`morphHtml` patches in place.** A node of the same tag (and key) is kept and its attributes are synced, where
  0.1.0 replaced any node whose attributes changed. Listeners on kept nodes therefore stay: bind them once
  (delegate to a container), or mark a subtree `data-ds-replace`, or pass `{ replace: true }` to get fresh nodes
  as before. Key list rows with `data-ds-key` (or `id`) so a reorder moves them. Nodes marked `data-ds-keep` are
  never touched; the focused element is never replaced and keeps its value and caret.
- **`leave()` moves focus and sets `inert`.** Focus inside the leaving element goes to `focus` (new option), else
  the element that had focus when `enter()` ran, else the closest `tabindex="-1"` ancestor, before the element turns
  `inert` for its exit: it takes no clicks or focus while it leaves. `then: 'hide'` clears `inert` again;
  `then: 'keep'` leaves it invisible and inert until `enter()` or the new `cancel()`. While `leave()` is
  removing an element (`then: 'remove'`) it carries `data-ds-leaving`, so `morphHtml` skips it instead of patching
  it into the next item; `enter()` and `cancel()` take the mark back.
- **`enter()` clears `hidden` and `inert`** (any `inert`, also one the page set): drop the `el.hidden = false` before
  it, and set `inert` again after `enter()` if the element must stay inert.
- **A later call wins.** `enter()`, `leave()` and `cancel()` keep one state per element: a call made while
  another motion runs continues from the current state (no restart, no reversed entrance), and the earlier call's
  promise resolves without acting (a superseded `leave()` never removes or hides). Both remove every `ds-enter*` and
  `ds-leave*` variant class, not only their own.
- **`settled()` resolves when nothing runs** (on the next frame) instead of after its 1000ms timeout, and otherwise
  when the element's own finite animations finish or are cancelled; its ceiling comes from their timing. Transitions
  count only with `transitions: true` (or `event: 'transitionend'`); pseudo-elements and loops never count. Code
  that relied on the fixed wait waits for the motion it starts.
- **`countUp` counts from the shown value** (0 on the first call) on `--ds-ease-value` over `--ds-dur-glide`, up or
  down, instead of from 0 on an ease-out each time; the same value again changes nothing, a new call takes over the
  running count, a count down to 0 animates too, and it returns `{ cancel, finished }` (was `undefined`). Pass
  `from` to start elsewhere. While it counts the element is `aria-busy` and keeps its width.
- Timing comes from the computed tokens: `settleLoader` takes `{ element }` to read `--ds-delay-loader` (or
  `--ds-delay-boot` inside `.ds-boot`) and `--ds-hold-loader` time-scaled; the exported constants stay as the
  fallbacks outside a `.ds-theme`.

### Changed

- `.ds-leave` takes 150ms (`--ds-dur-fast`), `.ds-leave--scale` and `--slide` 200ms; the variants run
  `ds-fade-out` plus a movement-only exit.
- `.ds-enter`, `.ds-enter--slide`, `.ds-reveal` and `.ds-stagger` move on the spatial spring (`--ds-ease-spatial`);
  the fades stay on the standard curve. `.ds-enter` plays once, also on an element with its own loop.
- `.ds-stagger` children rise 4px as they fade in. A loader (`.ds-skeleton`, `.ds-loading`, `.ds-boot`,
  `.ds-spinner`) placed directly in `.ds-stagger` or given `.ds-reveal` keeps its own loader delay and loop.
- `.ds-enter--fill-x` / `--fill-y` grow on `--ds-ease-value`.
- `.ds-enter--pop` springs in too: its scale settles about 1% past full size.
- A tooltip placed with an inline `transform` no longer flies in from the page origin (the keyframes no longer
  replace its `transform`). Place tooltips with `top`/`left`: a `transform` placement still drifts in by
  (1 - scale) × offset unless the script also sets `transform-origin: calc(50% + Xpx) calc(50% + Ypx)`.
- The disc of `.ds-btn--disc` only fades (no scale on hover or press); the arrow of `.ds-card__link` no longer
  leans on hover.
- A closing dialog's or side sheet's backdrop catches clicks during the exit; the dialog box fades and drops, the
  sheet panel fades and shifts away on `--ds-ease-exit`.
- The `hidden` attribute hides `.ds-dialog`, `.ds-sheet` and `.ds-combo__popup` without `.ds-base`.
- Focus rings sit on `:focus-visible` (no `:focus` fallback rules).
- `icon()` escapes `className`.
- `ds.js` loaded twice keeps the first copy as `window.DS`; every copy is in `DashboardStyle.versions`.
- The styleguide's `?speed=<factor>` sets `--ds-time-scale`; `DS.motion` reads every duration from the computed
  tokens, so JS and CSS slow down together.
- `DS.motion.enter()` / `leave()`: interruptible (an interrupted motion continues from its current opacity,
  `translate`, `scale` and `clip-path` on the new direction's curve, for the share of the duration left, through
  `el.animate()`, without inline style; a value the new motion has no track for, such as the lift of an entrance
  under the fade-only `leave()`, glides to its rest instead of snapping), one state per element, focus and `inert` handling, `hidden` cleared (see
  the migration notes).
- `DS.motion.settled()` watches the element's own animations (`getAnimations()`) with a derived ceiling; new
  options `names`, `transitions` and `subtree`.
- `DS.motion.countUp()` counts from the shown value on the curve and time of progress bars, on a clock animation of
  the element (id `ds-count`) that starts in the same frame as a CSS transition, so a figure and its bar land
  together; one count per element; tabular figures; returns `{ cancel, finished }`.
- `DS.motion.replay()` restarts with a style flush instead of a layout read (works on SVG).
- `DS.dom.morphHtml()` patches in place, keyed (`data-ds-key`, then `id`), moves with `moveBefore` where it exists,
  keeps focus, caret and the runtime classes and properties DS writes, looks ahead at most 8 siblings.
- `DS.indicator`: the indicator span carries `data-ds-keep` and comes back if a re-render dropped it.

### Added

- Tokens: `--ds-dur-micro` (50ms), `--ds-dur-long` (450ms), `--ds-ease-exit`, `--ds-ease-spatial` (a spring,
  peak about 1.028, `linear()` with the `--ds-ease-out` fallback), `--ds-ease-value`, `--ds-scale-popup` (.95),
  `--ds-scale-tooltip` (.9), and the registered `--ds-time-scale` (slow motion for the styleguide and tests only).
- Keyframes: `ds-drop-out`, `ds-shrink-out`, `ds-shift-out`, `ds-pop-out`, `ds-clip-in`, `ds-clip-out`,
  `ds-press-ripple`.
- `.ds-leave--pop` (`leave(el, 'pop')`) and the `--ds-leave-easing` hook.
- Where `sibling-index()` exists, `.ds-stagger` numbers its children without `stagger()`.
- Modules in `src/js` may import from an earlier module (`scripts/build.mjs` bundles them).
- `DS.motion`: `motionDuration`, `motionEasing`, `MOTION_FALLBACKS`, `travelDuration`, `cancel`, `enterAll`,
  `staggerOnce`, `flip` (FLIP for lists: retargets mid-flight, moving items paint above the ones they cross, removed items fade out of flow inside the list, which
  keeps its height meanwhile and then glides to the new one, a cap of 50 moving items, a live guard that holds reorders under a mouse or pen or focus for at most 2s), `originFrom`, `roll` and
  `crossfade` (kind `'text'`); `leave()` takes `focus`; `loaderHoldMs()` and `settleLoader()` take `delay` and
  `minVisible`, `settleLoader()` also `element`; `countUp()` takes `from`.
- `DS.dom.morphHtml()` / `morphChildren()` options `replace`, `holdOrder`, `onInsert` and `onRemove` (a returned
  Promise keeps the node as a pending removal); the attributes `data-ds-key`, `data-ds-keep` and `data-ds-replace`.
- `DS.ripple` (`js/ripple.js`, `window.DS.ripple`): `attach(root)` gives every action a ripple from the pointer
  (Enter and Space: from the centre) and returns `{ detach }`; it also adds the passive `touchstart` listener iOS
  needs for `:active`. `components/ripple.css`: `.ds-ripples`, `.ds-press-ripple`, `.ds-press-ripple--out`,
  `.ds-pressed`, `data-ds-ripple` (`="off"` opts out) and the hook `--ds-ripple-color`.
- `.ds-swap`: a slot whose old and new content cross in one grid cell (`roll()`, `crossfade()`).
- `--ds-hold-loader` (450ms): how long a loader that showed stays at least (`LOADER_MIN_VISIBLE_MS`).
- The Playwright `fallback` project: Chromium as an engine on the browser floor, so the fallback paths are tested.
- `scripts/motion-curves.mjs` generates the sampled curves (`npm run check` verifies them).

### Deprecated (removed in 2.0)

- `--ds-ease` (use `--ds-ease-emphasized`), `--ds-spinner-sm-track`.
- `DS.motion.easeOutCubic`, no longer used (`countUp` runs on `--ds-ease-value`).
- `ds-sink-out`, `ds-scale-out`, `ds-slide-out` (use `ds-fade-out` with `ds-drop-out`, `ds-shrink-out`,
  `ds-shift-out`).

## 0.1.0

First release.

- Tokens in three layers on `.ds-theme`: scales (motion, spacing, state layers, z), roles (neutral default palette,
  type roles, radii, elevation, focus, links, layout) and component hooks. One reduced-motion switch,
  `.ds-motion-full` opt-out.
- Motion: keyframes and the `.ds-enter`, `.ds-leave`, `.ds-stagger`, `.ds-reveal`, `.ds-collapsible` utilities;
  `.ds-enter--pop` for badges that appear; `ds-fill-x` / `ds-fill-y` with `.ds-enter--fill-x` / `--fill-y` for bars
  and columns that fill on first render.
- Opt-in page base (`.ds-base`).
- Components: button (variants, toggle, busy, focusable `aria-disabled`), spinner, sliding indicator, loading (boot,
  loading line, skeleton, loading bar), card, tiles (also clickable), lists and facts, empty state, status chip,
  alert, table (sortable headers, dense rows), form (fields, read-only, select, date, search, filters, action bar,
  checkbox, radio cards), chips, switch, combobox, progress, side sheet, dialog, snackbar, tooltip, app frame (top
  bar, navigation drawer, segmented switch, account, content panel, print styles), page layout, utilities.
- JS (ES modules and the classic `dist/ds.js`): `motion`, `indicator`, `dom` (morph), `icons` (82 outline glyphs,
  `icon()`, `iconElement()`).
- Google Sans (OFL 1.1) with `fonts.css`; theme template `themes/example.css`; living styleguide.
- `scripts/vendor.sh` and `scripts/vendor.ps1` for checksummed copies of the latest `main` (or any branch, tag or
  commit), recording the exact commit; `templates/update-dashboard-style.yml`, a nightly GitHub Actions workflow
  that vendors `main` when it changed, verifies, commits and starts the project's build.
- Focus rings sit on `:focus` and come off with a separate `:focus:not(:focus-visible)` rule, so browsers without
  `:focus-visible` (Safari 14.1 to 15.3) keep them; no selector list mixes `:focus-visible` or `:has()` with other
  selectors (a test enforces both).
- Drawer items may be `<button>`s; `<textarea class="ds-input">` and `<fieldset class="ds-field">` with
  `<legend class="ds-field__label">` are styled; the snackbar takes `--ds-toast-bottom` and `--ds-toast-shift-y`.
- The loading bar stays visible in forced colors; the print reset of `.ds-content` and `.ds-page` comes after
  their screen rules (a test checks every print rule).
- Docs: `img-src data:` in a strict CSP (the field glyphs are data URIs), and how an embedded widget scopes its
  theme when the host page uses Dashboard-Style too.
