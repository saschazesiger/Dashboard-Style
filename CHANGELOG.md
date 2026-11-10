# Changelog

All notable changes. Versions follow [semver](https://semver.org): renaming or removing a token, class, hook or JS
export is a major change; adding one is a minor change. Identifiers such as D7 refer to the design decisions in
[plans/motion-2.md](plans/motion-2.md).

## 3.0.0 (unreleased)

A rewrite, built on the `next` branch ([plans/3.0.md](plans/3.0.md)); `main` stays 2.x. The pre-releases carry
`3.0.0-alpha.<n>`.

### Removed at the release

The 2.x aliases that the pre-releases kept "until 3.0 ships" are gone from the code. Their entries in
`deprecations.json` stay as they are, so `tools/migrate.mjs` still rewrites them and `check-project` and `check-theme`
still name them; [docs/migration.md](docs/migration.md) lists each with its replacement.

- **Classes:** `.ds-btn--primary` (`.ds-btn--filled`), `.ds-btn--sm`, `.ds-check--sm`, `.ds-loader--sm`,
  `.ds-avatar--sm`, `.ds-avatar--lg` (`.ds-sm`, `.ds-lg`), `.ds-spinner--sm` (`.ds-spinner--ink` with `.ds-sm`),
  `.ds-dialog--wide` (`.ds-dialog--lg`), `.ds-table--dense` (`.ds-density-tight`), `.ds-input-group__affix`
  (`.ds-input-group__prefix`, `.ds-input-group__suffix`), `.ds-subsection` and `.ds-more` (`.ds-card__section`,
  `.ds-card__more`).
- **Tone modifiers** (now `.ds-tone-*` on the element): `.ds-alert--success`, `--warning`, `--error`;
  `.ds-badge--neutral`, `--ok`, `--warning`, `--error`; `.ds-status--ok`, `--warning`, `--error`; `.ds-tag--neutral`;
  `.ds-kv-list__icon--ok`, `--warning`, `--error`; `.ds-meter--neutral`, `--warning`, `--error`;
  `.ds-columns__col--warning`, `--error`; `.ds-legend__key--neutral`, `--warning`, `--error`. `DS.usage` now writes
  `.ds-tone-warning` and `.ds-tone-error` on its meter.
- **Hooks:** `--ds-btn-sm-height`, `--ds-btn-sm-icon-size` (a drawer row keeps room for its small action from
  `--ds-btn-icon-size` less one size step), `--ds-check-sm-height`, `--ds-loader-sm-size`, `--ds-table-dense-row-height`
  (the base hooks of each), `--ds-dialog-width-wide` (`--ds-dialog-width-lg`).
- **JS:** `DS.indicator.createIndicator()` (`DS.indicator.create()`), `detach()` of the `DS.ripple.attach()` handle
  (`destroy()`), the `data-close` attribute (`data-ds-close`) and the `ds-close` event (`ds:close`, still with
  `detail.reason`); their declarations in `.d.ts` went too.
- **Tests:** the removed-name guard of `test/repo.test.js` now treats a name removed in the release this version leads
  to (3.0.0 from a 3.0.0 pre-release) as gone, so no file of the repository uses one and no doc marks one deprecated;
  the tests that kept the aliases working check that they are gone. The shipped tools keep their rule: a pre-release
  copy warns on these names, 3.0.0 fails on them.

### Performance on slow and mobile devices (3.0.0-alpha.6)

Measured in Chromium at 4x CPU throttling on a 390px phone viewport (style and layout work, long tasks, interaction
latency), then fixed where the system or its pages did more than they need to.

- **Pseudo-elements.** The border-box reset no longer names `::before` and `::after`: a rule whose subject is every
  pseudo-element made Chromium compute two pseudo-element styles for every element of the page, content or not. The
  few pseudo-elements with a size and a border or padding set `box-sizing` in their own rule. A unit test keeps any
  rule from giving every element a pseudo-element style again.
- **`:has()` before a combinator.** No rule styles a bare or pseudo-element subject behind a `:has()` that is not in
  its subject (`.x:has(.y) > *`): Chromium then restyles the whole page on every change anywhere. The expandable
  table row passes its state to its content through private properties; a unit test covers every stylesheet.
- **Motion tokens.** `DS.motion.motionDuration()` and `motionEasing()` read the tokens on the nearest `.ds-theme`
  instead of the element: the root is usually clean, while a new or just-changed element forced a style flush of the
  whole document in the middle of an interaction (several per page change in the styleguide).
- **View Transitions across pages** (`css/optional/view-transitions.css`): the rules that name the frame while no
  modal covers it look through the page with `:has()` on `html.ds-theme` only, not on every nested `.ds-theme`.
- **Styleguide and Motion Lab.** They load `ds.min.css` and `ds.min.js`. The Motion Lab sets a demo up as its card
  comes near the viewport, in idle time, and lets cards far away skip rendering (`content-visibility`): on a phone at
  4x CPU it was ready after 16s with a 10s freeze and 180ms scroll frames; it now renders at once and stays
  responsive while it finishes. The loops of cards well out of view (spinners, loaders, shimmer) pause until their card
  comes near: with about forty of them running, WebKit drew the lab at about twelve frames a second, and a popover
  waited for those frames; now sixty. `test/browser/work.spec.js` counts the style work of the lab's load, a page change and
  opening a modal, so it holds in the shared run.
- **Bundles carry only the behaviours a page uses.** `tools/bundle.mjs` brings a component's module only when the page
  uses that component; one that another component's CSS requires (a list styles a `.ds-meter` it may hold) brings its
  stylesheet alone, so a page with a list no longer carries the chart engine.
- **Real devices** (BrowserStack: Galaxy S25 with Samsung Internet, Moto G71, iPhone 15, iPad, Windows Firefox,
  macOS Safari). A jump in the Motion Lab, from its navigation or the address, landed thousands of pixels short in
  every engine: the cards it passed rendered on the way and moved the section. The view now follows the section
  until it holds still (a person who scrolls takes over), tested in `styleguide-regressions.spec.js`. A page
  pattern's preview opens at the width nearest the screen (a phone previews a phone, not a desktop scaled to a
  third).
- **Jump links** (`DS.toc`): a jump to a section more than a view away no longer hands the mark to every section the
  glide passes (the bar slid back and forth on the way); the jump's link keeps it until the scroll has rested.
- **Page head** (`DS.page`, sticky): when the head unfolded during a smooth scroll (a reader turning round, a jump
  link), measuring its fold let scroll anchoring move the scroll, and putting it back stopped the smooth scroll short.
  Anchoring is off while the fold is measured (`overflow-anchor`, progressive; elsewhere the scroll is still put back).
- **Tooltips** (Firefox): a tooltip shown during the warm-up (the next trigger along a toolbar) could grow from
  `--ds-scale-tooltip` instead of only fading in; its closed state is now styled without transitions on the warm path
  too, as on the cold one.
- **Virtual lists** (`DS.virtual`, the combobox, data grid and logs on it): a jump to a far row (End, ArrowUp to the
  last option of 5,000) could stop short of it: rows measured after the jump (wrapped text, the container's fonts) were
  taller or shorter than their estimate and moved it out of view. A row `scrollTo()` brought into view stays there while
  later measurements change the offsets (until the person scrolls the list), placed by where it really is once
  rendered.
- **Time range** (`DS.timerange.resolve()`): one clock reading for both ends, so "Last 6 hours" spans exactly six hours
  (it read the clock twice and could add a millisecond).
- **Announcements** (`DS.overlay.announce()`, `DS.a11y.announce()`): texts said within one frame are read together; a new
  `key` option lets a newer text replace the one of the same key not read yet. The composer's palette, the audit log's
  filter and the JSON viewer's search say their counts keyed, so typing quickly says the last count only.
- **CI**: the screenshot set of 3.0 for every engine from the Playwright container (the committed one was 2.x's); each
  engine runs in four shards, past 35 minutes in one job.
- **Accessibility sweep** (`test/browser/a11y-sweep.spec.js`): every demo's interactive elements are named, ARIA
  references resolve, ids are unique, images have text and roles are valid. It found a blank line of `DS.logview`
  without a name (now "Blank line", the string `logBlank`) and broken references in the result and wizard demos.

### Phase 3: page patterns and the live tour

Additive. The patterns and the tour are pages, not part of `dist/`.

- **Page patterns** in `src/patterns/` ([docs/patterns.md](docs/patterns.md)), copy-ready pages built only from
  components, each loading a `tools/bundle.mjs` bundle of its family (written by the build into `src/patterns/ds/`):
  - sign in (password, passkey, single sign-on, a link by email), two-step verification with a one-time or recovery
    code, recovery codes, sign up, reset password, new password, verify email, 403, 404, 500, maintenance, offline, a
    public single-card form and its success page, an onboarding checklist, a full-screen wizard;
  - the app itself: dashboard home, a list with filters and saved views, a record (object page), settings, profile and
    account, team members, a permissions matrix, API keys, integrations and an audit log;
  - billing (plan, quota meters, invoices), a printable invoice, pricing, webhooks with a delivery log, a status page,
    a changelog, notification settings, a file manager, an inbox, a chat app, a calendar and a kanban board.

  The styleguide lists them in its Page patterns area (a framed preview at phone, tablet and desktop width, light and
  dark). `test/browser/patterns.spec.js` loads each in every engine (no console error, one h1, landmarks, named
  controls, no sideways scroll at 360px, keyboard walks of the interactive ones).
- **The live tour runs on 3.0**: it loads a project bundle (`demo/ds/`, written by the build) instead of the whole
  `ds.css` and `ds.js`, shows the new groups (layout, the data grid and charts, dates and times, people, code and
  Markdown, chat and AI), and sets each stop up only as it comes near the view, so a slow phone keeps scrolling smoothly.
- **Fixed:** `dist/manifest.json` lists no page-written attribute (`data-ds-scheme`, `data-ds-key`, `data-ds-keep`,
  `data-ds-replace`) as a component's, so a bundle no longer pulls in every module that quotes them; `tools/bundle.mjs`
  reads `DS.init`, `DS.get`, `DS.define` and `DS.config` as the core's exports, and `data-ds-copy` leads to the copy
  module only.

### Phase 3: the React adapter

Additive: nothing of 2.x or of the earlier pre-releases changes meaning.

- **`react/`** in the copy ([docs/react.md](docs/react.md)): typed React components over the system's own behaviours,
  plain ES modules without JSX or a build step, React 18 or later as the project's peer. `DSProvider` (the
  `.ds-theme` root, `DS.init()` with its observer, the scheme, options, locale and strings), the hand-written
  `Button`, `Field`, `Card`, `Badge`, `Status`, `Alert`, `Table`, `Tabs`, `Dialog`, `useToast()` and `Icon`, and a
  component generated by `scripts/react.mjs` for every other behaviour that initialises an element: a typed wrapper
  of the documented root element, by decision (its inner markup stays the page's), with option props from the
  behaviour's documented attributes, `variant` from its block's modifiers (not the state classes the system writes),
  `onDs<Type>` events, `controllerRef`, and `open` / `onClose` for the overlays. `Markdown`, `Highlight`,
  `Formatted`, `Truncate`, `SearchHits`, `Time` and `Kbd`, whose behaviour writes their content, take it as a prop
  or string children and render no React children. `manifest.json` `react` lists each file's exports, stylesheets
  and modules; `tools/bundle.mjs` follows imports of `react/<file>.js`. StrictMode-safe, tested in three engines on
  a pinned React 18 (`test/react/`), every generated component on its docs' markup with and without StrictMode.
- **Core**: `DS.core.manage(el, name)` runs a behaviour for an owner that renders the element itself (`{ controller,
  update(), destroy() }`); `DS.init()` and its observer skip everything inside `data-ds-managed`, and
  `data-ds-managed="off"` hands a subtree inside one back ([docs/core.md](docs/core.md)).
- **Fixed for StrictMode and re-created controllers**: `destroy()` gives back what init took, so a second init shows
  the same: the data grid restores the header and body rows it read its columns and rows from (its select column was
  doubled and its summary row lost), the command palette its options (their shortcut keys were lost), and Markdown's
  attribute path its source (the rendered headings were read again as text).

### Phase 3: the reference app on 3.0 (unreleased)

The reference app (`example/`) moves to 3.0 as a project would: a project bundle, saved views, the filter bar and the
data grid, the device as an object page, facets on Tickets, the command palette and the notification centre. What it
changed in the system:

- **Bundles**: `manifest.json` no longer lists the shared `data-ds-*` vocabulary (what the core modules use themselves,
  such as `data-ds-key`, `data-ds-keep` and `data-ds-leaving`, and the shared options `data-ds-value` and
  `data-ds-config`) under the component modules that read it, so a page that keys its rows or sets a value no longer
  pulls in a dozen component modules (upload, tree, tag input ...). A project that relied on such an attribute alone
  to bundle a module names the module (`DS.<module>`) or its own attribute instead. `tools/bundle.mjs` reads
  `DS.init`, `DS.get`, `DS.define` and `DS.config` as the core's aliases (no "unknown module" in the report).
- **Time range** (`DS.timerange`): its two date-time fields and the buttons of the quick and recent ranges are made on
  the first open of the popover, and its Intl formatters are made once; a view that starts with a time range no
  longer spends a long task on a slow phone for what does not show.
- **Core**: `DS.core.config()` copies the merged strings once per change instead of on every read (every format and
  label reads it).

### Phase 2: the tier-1 catalogue (3.0.0-alpha.5)

The new components of [plans/3.0.md](plans/3.0.md), built in 22 packages, each reviewed and fixed before the merge.
Everything is additive: no 2.x name changes meaning.

**Integration.**
- **Search hits** are the component `hits` (`.ds-hit`, `DS.hits`, `data-ds-hits`, `data-ds-hits-mode`,
  `data-ds-hits-skip`, hooks `--ds-hit-bg` and `--ds-hit-color`), as the plan names them; `highlight` is the syntax
  highlighter (D13).
- **`.ds-truncate`** belongs to the truncate component (one line cut at its end, start or middle, with its tooltip, and
  printed in full); the text utilities keep the clamps, `.ds-break`, `.ds-mono`, `.ds-tabular`, `.ds-balance` and
  `.ds-pretty`.
- **Strings** two packages added under one name: a section saved in an object page is `sectionSaved`, the bounds of a
  range filter's chip `rangeMin` and `rangeMax` (`rangeFrom` and `rangeTo` are the time range's labels), and
  `DS.steps` announces through `stepOf` (`Step {step} of {total}: {label}`).
- **Colour roles**: the code roles `--ds-code-keyword`, `-string`, `-number`, `-comment`, `-function`, `-type`,
  `-property`, `-meta`, `-inserted` and `-deleted` (text on `--ds-code-bg`, checked like every text pair) and
  `--ds-shimmer-glint` and `--ds-shimmer-peak` are roles of `tokens.css` with dark and contrast values; the theme
  generator derives the code roles at fixed hues. `themes/contrast.css` gives them `light-dark()` pairs.
- **Cascade order**: the new components sit between the 2.x ones and `ripple`, which stays the last sublayer.
- **Core**: `DS.virtual` with `keyboard: false` leaves every key to the page; `DS.overlay` returns the focus only to an
  element that takes it (a span that only placed a popup counts as gone); `DS.dom.followEnd()` keeps to the end after
  content shrank without a scroll event (WebKit); a table's last row drops the bottom line of its header cells too.
- **meta.json**: `motionExceptions.morph` registers a shape JS morphs frame by frame (the chart's lines, areas and
  arcs, D14). The project check knows the new system-written attributes `data-ds-dirty`, `data-ds-unsaved-marked` and
  `data-ds-wizard-error`.
- **Fixed after the merge** (the browser suite on the merged tree):
  - Three new selectors (the nowrap cluster with a title, the toggletip in a field, the query's placeholder) styled
    what follows an element that `:has()` something; in Chromium any change on the page then restyled and laid out
    the whole page. They pass their state through a private property or select from the sibling's side.
  - A changed word in a diff sits on the success or error container itself, so every code colour reads at 4.5:1.
  - A `.ds-view` inside another view no longer names the view's scroll timeline (an ambiguous name left the frame's
    top bar tint without a timeline); a view of a nested `.ds-app` still does.
  - The page head ignores the helper the More menu's placement inserts (the focus stayed on More); a closed tool
    call's code blocks run no focus transition (Firefox never ends one inside a closed `<details>`); the jump links
    mark the current link before they make their pill; `data-ds-moving` also stops `::before` and `::after`
    transitions; charts add their pointer listeners in a microtask (WebKit lays out once per listener after an SVG
    `<text>`).
- The wheel and the shimmer ([plans/wheel-and-shimmer.md](plans/wheel-and-shimmer.md)) ship as components:
  `DS.wheel.hooks`, `DS.wheel.roll()` and `DS.wheel.create()` instead of the proposal's `DS.motion.wheelHooks` and
  `DS.motion.wheel()`.
- **Style cost**: `.ds-cluster--nowrap`, the toggletip in a field and the query's placeholder no longer style the
  children of an element that `:has()` something: in Chromium that form restyled and laid out the whole page on each
  DOM change (150 ms and more on the Motion Lab). A nowrap cluster with a title tells its items through the private
  `--_cluster-shrink`. `[data-ds-moving]` turns off the transitions of `::before` and `::after` too.
- **Load motion**: the jump links mark the current link before their pill exists, so it is placed, not grown, on load;
  the page head's measure of what folds runs without transitions (its hairline no longer starts on every measure).
- **Charts** add their pointer listeners after the task that made them: in WebKit each such listener, once an SVG
  `<text>` is in the page, cost a layout of the whole page at the next read.

#### Layout and page structure

- Added: Container presets, `.ds-container` and the visibility classes `.ds-hide-compact`, `.ds-hide-medium`,
  `.ds-hide-expanded`, `.ds-only-compact`, `.ds-only-medium`, `.ds-only-expanded` and `.ds-stack-compact` on the
  container sizes compact (under 600px), medium (600-839px) and expanded (840px and up).
- Added: Layout, the layout primitives `.ds-cluster`, `.ds-push`, `.ds-split`, `.ds-switcher`, `.ds-measure`
  (center), `.ds-cover`, `.ds-frame` and the auto-fit grid `.ds-grid` (`--ds-grid-min`, `--max-n`, `--fill`), with
  their hooks.
- Added: Print, `.ds-print-only`, `.ds-print-hide`, `.ds-print-break-before`, `.ds-print-break-after`,
  `.ds-print-avoid`, `.ds-print-exact`, `.ds-print-urls` and the printable sheet `.ds-print-page`
  (`--ds-print-page-width`, `--ds-print-page-pad`).
- Added: Spacing, the gap classes `.ds-gap-0` to `.ds-gap-12` and the top margins `.ds-mt-0` to `.ds-mt-12` and
  `.ds-mt-auto`, on the space scale.
- Added: Sticky, `.ds-sticky` with `--head`, `--foot`, `--start`, `--end`, `--side` and `--flat`: a raised edge
  once content passes under the box, on the scroller's scroll timeline or through `DS.dom.watchScrolled()` and `DS.dom.scrollEdges()`. Hooks
  `--ds-sticky-offset`, `--ds-sticky-bg`, `--ds-sticky-line`, `--ds-sticky-shadow`.
- Added: Text utilities, `.ds-clamp-1` to `.ds-clamp-5`, `.ds-clamp` (`--ds-clamp-lines`),
  `.ds-break`, `.ds-mono`, `.ds-tabular`, `.ds-balance` and `.ds-pretty`.
- Added: `.ds-divider--start` and `.ds-divider--end` (a caption near one end), the upright divider around a caption
  (`.ds-divider--vertical.ds-divider--label`), the upright inset divider, and the hook `--ds-divider-color`.

#### Panes

- Dashboard panel (`.ds-dashpanel`): a titled panel with an actions slot for a menu, a loading bar along its head, a
  body that keeps its place through the loading, refreshing, failed and no-data states, a foot; outlined, filled and
  elevated.
- List-detail layout (`.ds-listdetail`, `DS.listdetail`): list, detail and sub-detail columns that fold by the
  layout's own width to two and to one with a back button, declarative triggers (`data-ds-listdetail-show`), focus
  that follows the level, the entering column sliding in. New string `back`.
- Split pane (`.ds-splitpane`, `DS.splitpane`): two or three panes, side by side or stacked, with dividers that drag
  and move by keyboard (APG window splitter), limits per pane, collapse and restore (keys, double click, toggle
  buttons), sizes remembered through `DS.store`, stacking under a width of its own on a phone
  (`data-ds-splitpane-stack`). New strings `splitpaneResize`, `splitpaneCollapsed`.

#### Actions

- Button group (3.0): `.ds-btn-group` (one pill outline: outer corners the pill times `--ds-shape`, shared borders, a
  divider in filled and tonal groups, the press morph on the outer corners) and `.ds-btn-group--block`; hooks
  `--ds-btn-group-radius` and `--ds-btn-group-divider`.
- Button: icon buttons in the standard (`--quiet`), `--filled`, `--tonal` and `--outlined` looks, each also a toggle,
  documented with their required label and tooltip; a `--filled` or `--tonal` toggle shows the neutral container
  while off and its own fill while on.
- Copy button (3.0): `DS.copy` (`data-ds-copy`, `data-ds-copy-value`, `copy`, `create`, `textOf`; the Clipboard API,
  the copy command, then a selection and a hint), `.ds-copy`, `.ds-copy--field`, `.ds-copy__value`, `.ds-copy__manual`,
  `.ds-copy__done`, hooks `--ds-copy-font` and `--ds-copy-field-bg`. String `copyManual`.
- Link (3.0): `.ds-link` (inline), `.ds-link--standalone`, `.ds-link--external` with `.ds-link__icon`, and the hook
  `--ds-link-font`; the quiet link (`.ds-link--quiet`) is documented with them and still ships in button.css.
- Menu button (3.0): `DS.menubutton` (`data-ds-menubutton`, `data-ds-value`, `create`, `open`, `close`, `menuOf`,
  `itemValue`), `.ds-menu-btn`, `.ds-menu-btn__value` and `.ds-menu-btn__chevron`.
- Priority action bar (3.0): `DS.prioritybar` (`data-ds-prioritybar`, `data-ds-priority`, `create`, `plan`; the More
  button and its menu built when the markup has none), `.ds-priority-bar`, `.ds-priority-bar--end`,
  `.ds-priority-bar__more`, `.ds-priority-bar__menu`, `data-ds-folded`; hooks `--ds-priority-bar-gap` and
  `--ds-priority-bar-menu-width`. String `moreActions`.
- Split button (3.0): `DS.splitbutton` (`data-ds-splitbutton`, `data-ds-value`, `create`, `partsOf`),
  `.ds-split-btn`, `.ds-split-btn__action`, `.ds-split-btn__label` and `.ds-split-btn__toggle`. String
  `moreOptionsFor`.
- Toggle button and toggle group (3.0): `DS.toggle` (`data-ds-toggle`, `data-ds-toggle-group="single | multiple"`,
  `data-ds-toggle-group-required`, `data-ds-value`, `data-ds-toggle-group-roving`; roving focus in a `role="toolbar"`),
  `.ds-toggle-group` and the hook
  `--ds-toggle-group-gap`. Button: a `--filled` or `--tonal` toggle shows the neutral container while off and its
  fill while on (Material 3 icon toggles); an outlined, quiet or text toggle keeps the tint.

#### Inputs

- Error summary (`DS.errorsummary`, `.ds-errorsummary`, `__title`, `__list`, `[data-ds-errorsummary]`): the problems
  of a form at its top after a submit, from the fields' constraints and `aria-invalid`, a link per problem to its field,
  focused; messages written into empty error hints; the list follows the fixes. Strings `errorSummaryOne`,
  `errorSummaryMany`, `errorSummaryField`.
- Form: `DS.form` (3.0), the module of the field. `data-ds-counter` keeps a `.ds-field__counter` ("14 / 200", the
  `--over` class past a soft `data-ds-counter-max`) and says once that the limit is near or passed (strings
  `charactersLeft`, `charactersLeftOne`, `charactersOver`, `charactersOverOne`); `DS.form.counter()`,
  `DS.form.count()`. Every `textarea.ds-input--grow` grows by itself where `field-sizing` is missing (the behaviour
  `autosize`). `.ds-select`: a customizable select where `appearance: base-select` exists (the menu's surface and rows,
  a check, rich options, `<selectedcontent>`), the styled native select elsewhere.
- Inline edit (`DS.inlineedit`, `.ds-inlineedit` with `__view`, `__value`, `__edit`, `__form`, `__actions`, `__error`,
  `[data-ds-inlineedit]` with `-blur` and `-trim`, hook `--ds-inlineedit-field-min`): a value that turns into a field
  in place, Enter and Escape, an async save through `ds:save` and `wait()` with a busy button and an error in words.
  Strings `edit`, `save`, `saved`.
- Number input (`DS.number`, `.ds-number`, `.ds-number--split`, `.ds-number__step`, `.ds-number__steps`,
  `.ds-number__down`, `.ds-number__up`, hook `--ds-number-step-size`): a spinbutton on an input group with steppers,
  min, max, step and page, locale parsing and formatting through `DS.format`, currency and unit affixes from Intl,
  a hidden input with the plain value. Strings `decrease`, `increase`.
- Code field (`DS.otp`, `.ds-otp`, `.ds-otp__cell`, `.ds-otp__sep`, `[data-ds-otp]` with `-type`, `-mask` and `-submit`,
  hooks `--ds-otp-cell-width`, `--ds-otp-gap`, `--ds-otp-font`): one-time codes and PINs in n cells, auto-advance,
  paste and one-time-code autofill spread over the cells, the keys of a split field. Strings `otpDigit`,
  `otpCharacter`.
- Password (`DS.password`, `[data-ds-password]`, `.ds-password__meter`, `.ds-password__bars`, `.ds-password__strength`,
  `.ds-password__caps`, hooks `--ds-password-meter-width`, `--ds-password-bar-height`): reveal with the caret kept and
  spell checking off, a four-level strength meter in words, a caps-lock hint. Strings `showPassword`, `capsLock`,
  `passwordStrength`, `strengthWeak`, `strengthFair`, `strengthGood`, `strengthStrong`.
- Search field (`DS.search`, `[data-ds-search]` with `-recent`, `-recent-max` and `-count`, `.ds-search__clear`,
  `.ds-search__count`, the list's `.ds-search__popup`, `.ds-search__history`, `.ds-search__foot`,
  `.ds-search__forget`, hook `--ds-search-clear-size`): a clear button and Escape in every engine, the shortcut's key
  as the platform writes it, a result count shown and spoken, recent searches through `DS.store`. Strings
  `recentSearches`, `clearRecent`, `searchResultsOne`, `searchResultsMany`.
- Secret field (`DS.secret`, `.ds-secret` with `__stored`, `__mask`, `__status`, `__actions`, `__replace`, `__clear`,
  `__undo`, `__entry`, `__cancel`): set, replace and clear states that never show the value, a hidden
  `[data-ds-secret-action]` of keep, set or clear for the server. Strings `secretSet`, `secretNotSet`,
  `secretCleared`.
- Type-to-confirm (`DS.typeconfirm`, `[data-ds-typeconfirm]` with `-case`, `.ds-typeconfirm` with `__label`, `__name`,
  `__input`, `__error`, `__confirm`): a destructive confirmation in a dialog whose filled error button (D10) waits until
  the name is typed, with an async action through `ds:confirm` and `wait()`. String `typeToConfirm`.

#### Choice

- Choice list (3.0): `.ds-choices` with `DS.choices` (`data-ds-choices`): "select all" with the indeterminate state, a
  count, a fuzzy filter that marks its letters, columns (`.ds-choices--columns`) and a scrolling box
  (`.ds-choices--scroll`) for long sets; `DS.choices.summary`.
- Combobox: `data-ds-combobox` and `DS.combobox` (`create`, `open`, `close`): the behaviour by the system on the same
  markup, through the list engine of `DS.listbox`: fuzzy filter with scoring and `.ds-combo__match`, an async `source`
  with debounce, abort and a loading state, creatable (`ds:create`), clearable, several values with chips, nothing
  found, windowed long lists, select-only keys. A page's own script keeps working without the attribute.
- Combobox: `--ds-scroll-edge-start` and `--ds-scroll-edge-end` are registered once in `tokens.css` (no longer in
  `scroller.css`), so the list's cut edges fade when `combobox.css` is linked without `scroller.css`.
- Listbox (3.0): `.ds-listbox` with `DS.listbox` (`data-ds-listbox`): one or several values, groups, descriptions,
  type-ahead, data rendered and windowed through `DS.virtual`, fuzzy matching with marked letters
  (`DS.listbox.fuzzy`, `filter`, `highlight`); the list engine of the combobox and the select panel.
- Ordered choice (3.0): `.ds-orderedchoice` with `DS.orderedchoice` (`data-ds-orderedchoice`): checked rows in an order
  of their own, moved by `DS.dnd` (pointer and keys) and by Alt with the arrows, Home and End; the place of each checked
  row in a disc and in words; a maximum; `DS.orderedchoice.arrange` and `DS.orderedchoice.ranks`.
- Select panel (3.0): `.ds-selectpanel` with `DS.selectpanel` (`create`, `open`, `close`, `summarize`;
  `data-ds-selectpanel`): a popover through `DS.overlay` with a filter, a listbox to check and an apply foot; pending
  until Apply, discarded by Escape or a press outside; the button's summary; anchored in the top layer where the engine
  can.
- Tag input (3.0): `.ds-taginput` with `DS.taginput` (`data-ds-taginput`): free tags as input chips, Enter, a comma or a
  pasted list, checks (unique, pattern, `validate`, max) with a message, removal by Backspace, Delete or a press, the
  arrow keys across the chips, announcements; `DS.taginput.split` and `DS.taginput.check`.
- Transfer list (3.0, tier 2): `.ds-transfer` with `DS.transfer` (`data-ds-transfer`): two listboxes of the
  `DS.listbox` engine, add and remove buttons, Enter and a double-click to move, filters, windowed data, announcements;
  stacks below 560px; `DS.transfer.move`.

#### Date and time

- Calendar (3.0): `.ds-calendar` and `DS.calendar`, the month grid of every date picker and its date engine (`parse`,
  `iso`, `add`, `compare`, `weekInfo`, `weekNumber`, `grid`, `available`, `label`, `rangeLabel`): one or two months, a
  day or a range with a preview, min and max, blocked days, week numbers, the locale's first day through `Intl`.
- Date field (3.0): `.ds-datefield` and `DS.datefield`, a date, time, date-time or range typed part by part in the
  locale's order and hour cycle (`create`, `hourCycle`, `layout`, `zoneName`, `toInstant`, `typeDigit`), with min and
  max, paste, a hidden input for forms and the zone of a wall time.
- Date picker (3.0): `DS.datepicker` (`create`), a date or date-time field with a calendar (and a list of times) in a
  popover: min, max, blocked days, week numbers, today, clear, the zone of a wall time, all in the locale through
  `Intl`.
- Date range picker (3.0): `DS.daterange` (`create`, `resolve`, `presetLabel`), a field of two dates and a popover with
  presets, relative ranges that resolve against today and two months with a hover preview.
- Duration input (3.0, tier 2): `.ds-duration` and `DS.duration` (`create`, `parse`, `iso`, `format`), a text field
  that reads "1h 30m", "90 min", "1:30" and ISO 8601 in the locale's words, steps with the arrow keys, keeps ISO 8601.
- Picker popover (3.0): `.ds-picker` and `DS.picker` (`create`, `open`, `close`), the popover of the date and time
  pickers, also for a page's own panel: a modal dialog through `DS.overlay`, in the top layer, placed below its field,
  with presets, panes and a foot.
- Time picker (3.0): `DS.timepicker` (`create`, `list`, `times`), a segmented time field and a list of times in a
  popover, in the locale's hour cycle, with step, min, max and seconds.
- Time range (3.0): `.ds-timerange` and `DS.timerange` (`create`, `parse`, `resolve`, `label`, `query`, `spanMs`),
  the range control of a monitoring view: quick relative ranges, absolute from and to, recent ranges remembered through
  `DS.store`, an auto-refresh interval that sends `ds:refresh`, URL-friendly values.

#### Form flows

- Drag and files: the section of the drop zone is now "Drop zone and file field"; `#file-upload` names the new [File upload](#file-upload), which renders the chosen files around the same zone.
- Key-value editor (`.ds-kveditor`, `DS.kveditor`): rows of a key and a value with add and remove, paste of
  `KEY=value` lines, a warning on duplicate keys, secret values with reveal, a hidden input for plain forms and
  `toObject()`; the helpers `parse()`, `stringify()`, `duplicates()` and `toObject()`.
- Query input (`.ds-query`, `DS.query`): filters as tokens (`key:value`, several values, quotes, `-key:` and `!`,
  `>`, `>=`, `<`, `<=`), suggestions for keys, operators and values (static or from `values()`), invalid tokens in the
  error tone with the reason, keyboard editing of the tokens, saved queries in `DS.store`, a hidden input and a
  structured query in `ds:change`; `parse()`, `stringify()`, `toQuery()`, `suggest()`.
- Unsaved-changes guard (`data-ds-unsaved`, `DS.unsaved`): dirty tracking of a form against its baseline, the count
  and Form's changed dots, the Save bar shown and hidden, save through a cancelable `ds:save` with `waitUntil()` (busy
  face, new baseline, spoken result), discard, Ctrl or Command+S through `DS.hotkeys`, `beforeunload` only while
  dirty, and a guarded in-app navigation (`navigate()`, `[data-ds-unsaved-link]`); `isDirty()`, `snapshot()`, `diff()`.
- File upload (`.ds-upload`, `DS.upload`): the drop zone grows into a full upload: rows or a preview grid with progress
  per file, retry and remove, paste, limits on type, size and count with errors in words, and pictures resized in the
  browser (`resize`). The page uploads through `ds:files` and reports with `progress()`, `done()` and `fail()`.
- Form wizard (`.ds-wizard`, `DS.wizard`): a form in steps on Steps, each checked before the next (constraint
  validation and a cancelable `ds:validate`), Back and Next, errors in words with focus on the first, and a summary
  step with an Edit button per step; `fieldLabel()` and `fieldValue()`.

#### Data grid

- Added: the data grid, `.ds-datagrid` and `js/datagrid.js` (`DS.datagrid`): multi-column sort, column resize, reorder and
  chooser with presets (remembered through `DS.store`), client or server data through one contract, selection with
  Shift ranges and "Select all N" across pages with the selection bar, details, tree rows and row groups with subtotals,
  a summary row, inline edit, the APG grid keys (cell or row), row actions and a context menu, windowed rows
  (`DS.virtual`), the empty, loading and error states, CSV and clipboard export. Strings `datagrid*` in
  `DS.core.config({ strings })`. Hooks `--ds-datagrid-indent`, `--ds-datagrid-group-bg`.

#### Filters and views

- Facet filter panel (`DS.facets`, `.ds-facets-layout`, `__main`, `.ds-facets`, `__head`, `__title`, `__clear`,
  `__applied`, `__chips`, `__toggle`, `__badge`, `__count`, `__results`, `.ds-facet`, `--scroll`, `__title`,
  `__options`, `__search`, `__empty`, `__more`, `__range`, `__dash`, `data-folded`, `data-ds-facets-sheet`,
  `data-ds-facets-zero`, `data-ds-facet-limit`, hooks `--ds-facets-width`, `--ds-facets-main-min`, `--ds-facets-gap`,
  `--ds-facet-max-height`): facets with counts, a search inside long facets, a limit with "Show all", ranges, applied
  chips with Clear all, a side sheet when the layout is narrow; `counts()`, `count()`, `open()`, `visible()`,
  `foldText()`; a second applied row in the main part while folded; the count announced once changes pause. Strings `facetShowAll`, `facetShowFewer`, `facetNoMatch`, `facetMatchesOne`, `facetMatchesOther`.
- Filter bar: a radio of `value=""` is "Any" (no filter), and the one checked again once its filter is empty.
- Filter bar (`DS.filterbar`, `.ds-filterbar`, `.ds-filterbar__row`, `__search`, `__filters`, `__more`, `__badge`,
  `__range`, `__count`, `__applied`, `__chips`, `__clear`, `__results`, `data-folded`, hooks `--ds-filterbar-gap`,
  `--ds-filterbar-search-min`, `--ds-filterbar-field-width`, `--ds-filterbar-range-width`): inline filters that fold into a side sheet by the bar's
  width, applied input chips with Clear all, a result count, `ds:filter`; `read()`, `write()`, `applied()`, `fold()` and
  the `filters()` engine. Strings `removeFilter`, `filterRemoved`, `filtersCleared`, `filtersApplied`, `filterChip`,
  `resultsOne`, `resultsOther`, `showResults`, `rangeMin`, `rangeMax`, `rangeBetween`.
- Load more and infinite scroll (`DS.loadmore`, `.ds-loadmore`, `.ds-loadmore--inline`, `.ds-loadmore__status`,
  `.ds-loadmore__text`, `.ds-loadmore__icon`, `.ds-loadmore__button`, hooks `--ds-loadmore-padding`,
  `--ds-loadmore-error-color`): a status line and a Load more button with its busy face, an IntersectionObserver
  sentinel with a limit of automatic loads, `ds:loadmore` with `respond()`, `aria-busy` on the list, announcements, an
  error state that tries again, focus kept when the button goes. Strings `loadMoreStatus`, `loadMoreStatusOpen`,
  `loadMoreDone`, `loadMoreLoaded`, `loadMoreLoading`, `loadMoreFailed`, `tryAgain`.
- Sort control (`DS.sort`, `.ds-sort`, `.ds-sort--menu`, `.ds-sort__field`, `.ds-sort__label`, `.ds-sort__order`,
  `.ds-sort__trigger`, `.ds-sort__value`, `.ds-sort__words`, `.ds-sort__word`, `.ds-sort__arrow`, hook
  `--ds-sort-field-width`): the field and direction of a list or cards outside a table, inline or as a menu, with the
  direction in the field's words, `ds:sort`, an announcement, and `parse()` / `stringify()` for addresses. Strings
  `sortAscending`, `sortDescending`, `sortAscendingText`, `sortDescendingText`, `sortAscendingNumber`,
  `sortDescendingNumber`, `sortAscendingDate`, `sortDescendingDate`, `sortAnnounce`.
- Saved views (`DS.views`, `.ds-views`, `__trigger`, `__name`, `__edited`, `__chevron`, `__save`, `__list`,
  `__default`, `data-ds-views-key`, `data-ds-views-url`, `data-ds-views-prefix`, `data-ds-view`, `data-ds-view-state`,
  `data-ds-view-default`, `data-ds-views-action`, hook `--ds-views-name-max`): named filter, sort and column sets in a
  menu, built-in and the user's own (in `DS.store`, followed across tabs), a default, "Edited" while the state differs,
  a link that carries the view (`toQuery()`, `fromQuery()`, `history.replaceState` with `sync`), `ds:view` and
  `ds:views`. Strings `viewEdited` ... `viewDeleteConfirm`.

#### Structures

- Audit log (`.ds-auditlog`, `DS.auditlog`): who, what and when on the activity timeline, grouped by day, with a diff of
  each changed field (`.ds-auditlog__diff`: old struck through, new underlined, the words for a reader), a filter bar
  with a live count, and the pure helpers `changes()`, `group()` and `matches()`. Hooks `--ds-auditlog-field-width`,
  `--ds-auditlog-old-bg`, `--ds-auditlog-new-bg`, `--ds-auditlog-diff-radius`. New strings `auditlogToday`,
  `auditlogYesterday`, `auditlogUndated`, `auditlogBefore`, `auditlogAfter`, `auditlogNotSet`, `auditlogEvent`,
  `auditlogEvents`, `auditlogFiltered`, `auditlogMore`. A `limit` (200) with a "Show more" button
  (`.ds-auditlog__more`) keeps a log of thousands of entries quick.
- JSON viewer (`.ds-jsonview`, `DS.jsonview`): a JSON document on the tree view, lazy (only what opens renders, more
  than 100 entries open into ranges), with search and marks, copy value and copy path per row, and exact big numbers
  (its own parser keeps each number's digits). New strings `jsonTree`, `jsonSearch`, `jsonFind`, `jsonPrevious`, `jsonNext`,
  `jsonMatch`, `jsonExpandAll`, `jsonCollapseAll`, `jsonCopyValue`, `jsonCopyPath`, `jsonKey`, `jsonKeys`, `jsonItem`,
  `jsonItems`, `jsonInvalid`.
- Lists: `DS.list` (`data-ds-list`): selectable rows (`data-ds-list-select`, `.ds-list__check`, shift ranges, a
  "select all" box with `data-ds-list-all`, `--ds-list-selected-bg`), reorderable rows (`data-ds-list-reorder`,
  `.ds-list__grip`, through `DS.dnd`) and a virtual list (`create(el, { virtual })`, `.ds-list--scroll`,
  `--ds-list-max-height`). Facts: `.ds-facts--stacked`, `.ds-facts--grid` with `.ds-facts__wide` and `.ds-facts__full`,
  `.ds-facts--bordered` (`--ds-facts-radius`) and copy per value (`data-ds-facts-copy`, `.ds-facts__copy`). New strings
  `listMove`, `listSelected`, `factsCopy`.
- Tree view (`.ds-tree`, `DS.tree`): the APG tree with single selection, tri-state checkboxes, lazy children through a
  loader, row actions, drag to move through `DS.dnd`, type-ahead and folder groups. New strings `treeMove`,
  `treeMoveBefore`, `treeMoveAfter`, `treeMoveInside`, `treeDropped`, `treeLoaded`, `treeLoadFailed`, `treeError`.

#### Displays

- Badge: `.ds-badge--corner` puts a count or a dot on the corner of an icon button (or an avatar, any positioned host); the host's ripple clips itself instead of the host, so the badge stays whole (catalogue D, reopened from after-2.0).
- Bar list (new, `bar-list`): `.ds-bar-list` with `__item`, `__label`, `__value` and `--plain`, ranked rows on
  bars clipped at `--ds-share`, tones per row, links in labels; hooks `--ds-bar-list-height`, `--ds-bar-list-bar`,
  `--ds-bar-list-ink`.
- Category bar (new, `category-bar`): `.ds-category-bar` with `__head`, `__label`, `__total`, `__track`, `__part`
  (`--s2` ... `--s4`, tones), `__marker`, `__value` and `--rest`, parts on `--ds-share` with the chart legend;
  hooks `--ds-category-bar-height`, `--ds-category-bar-gap`.
- Expandable text (new, `expandable`): `data-ds-expandable` clamps `.ds-expandable__text` to `--ds-expandable-lines`
  and adds a `.ds-expandable__toggle` ("Show more", "Show less") only while the text is longer; `DS.expandable.create`,
  `overflows`.
- Formatted value (new, `formatted`): `data-ds-format` (`number`, `compact`, `percent`, `currency`, `bytes`,
  `duration`) with `data-ds-value` and `data-ds-format-*` options, the exact value in a tooltip; `DS.formatted.create`,
  `text`, `exact`; `.ds-value--plain`. Relative time (`data-ds-time` of the core) documented beside it, with its
  dotted underline and tabular figures.
- Search hits (new, `hits`): `data-ds-hits` marks the hits of a query in a container's text as `.ds-hit`
  (case and accents folded, words or `phrase` mode); `DS.hits.create`, `ranges`; hooks `--ds-hit-bg`,
  `--ds-hit-color`.
- Image (new, `image`): `.ds-image` with `__frame`, `__caption`, `__fallback`, the shapes `--square`, `--photo`,
  `--wide` (or `--ds-image-ratio`) and `--contain`; `data-ds-image` writes `data-state` (`loading`, `loaded`,
  `error`), fades the picture in, tries `data-ds-image-fallback` and shows the fallback with the alt text;
  `DS.image.create`; hooks `--ds-image-ratio`, `--ds-image-radius`, `--ds-image-bg`.
- Key combos (new, `kbd`): `data-ds-kbd` writes a shortcut as the keys of the platform (`.ds-kbd-combo`,
  `__keys`, `__combo`, `__plus`, `__then`) with the words in `.ds-sr`; `DS.kbd.create`, `keys`; strings `kbdCommand`,
  `kbdOption`, `kbdControl`, `kbdThen`.
- Label group (new, `labelgroup`): `.ds-label-group` with `__list`, `__more`, `__popup` and `__all`;
  `data-ds-label-group` (and `-max`) keeps the tags that fit on one line and writes a "+N" button that opens every tag
  in a popup through `DS.overlay`; `DS.labelgroup.create`, `visibleCount`; hook `--ds-label-group-gap`; strings
  `labelGroupMore`, `labelGroupAll`.
- State label (new, `lozenge`): `.ds-lozenge` and `--subtle`, a bold workflow state in the tone of the class on it,
  with a word and an icon; hooks `--ds-lozenge-height`, `--ds-lozenge-radius`.
- Meter variants (new, `meter`): `.ds-meter--segmented` and `.ds-meter__threshold` on the chart meter, the ring and
  gauge `.ds-gauge` (`--arc`, `__value`, `__label`, `__threshold`) and the bar gauge `.ds-bar-gauge` with warning and
  error zones, all on `--ds-share`.
- Result page (new, `result`): `.ds-result` with the causes `--success`, `--forbidden`, `--not-found`, `--error`,
  `--maintenance`, `--offline` (or a tone) and the parts `__disc`, `__media`, `__code`, `__title`, `__text`,
  `__actions`, `__meta`; hooks `--ds-result-disc-size`, `--ds-result-media-size`, `--ds-result-padding`.
- Ripple: a host that holds a `.ds-badge--corner` is isolated but no longer clipped while it ripples; its ripple clips itself (a box over the host with the host's radius, the circle as its `::before`), as a tab's and a table row's did. Every other host clips as before.
- Tiles, KPI stat: `.ds-tile__unit` (a unit after the figure, which then sits in `.ds-tile__figure`, the element
  `countUp()` writes) and `.ds-tile__target` with `.ds-tile__target-text`
  (a meter with a threshold mark at the target and the words whether it is met).
- Tracker (new, `tracker`): `.ds-tracker` with `__head`, `__label`, `__summary`, `__cells`, `__cell` (`--success`,
  `--info`, `--warning`, `--error`, `--empty`, each with its own shape), `__axis` and `__legend`; `data-ds-tracker`
  makes the row one tab stop with the arrow keys; `DS.tracker.create`, `counts`; hooks `--ds-tracker-height`,
  `--ds-tracker-gap`.
- Truncate (new, `truncate`): `data-ds-truncate` (`end`, `start`, `middle`) cuts a text with an ellipsis, whole in an
  owned tip while cut and in `.ds-sr` for screen readers; `.ds-truncate--lines`; `DS.truncate.create`, `cut`, `fit`;
  hook `--ds-truncate-lines`.

#### Charts

- Added: `DS.chart` (`chart.js`), dependency-free SVG charts on `.ds-chart`: line, area and stacked area (time series
  with gaps), column and bar (grouped, stacked, horizontal, 100%), combo with two axes, sparkline, donut, pie, ring,
  gauge and bar gauge, from a `<table>` or JSON in `data-ds-chart`, or `DS.chart.create(el, spec)`. A cursor with a
  crosshair and a tooltip, a legend that toggles series, keyboard navigation along the points with announcements, a
  table view, thresholds and annotations, container-driven layout, dashes, markers and hatchings that tell series
  apart without colour; lines and areas morph to new data (D14), bars glide, figures count. The engine is exported:
  `scale`, `ticks`, `timeTicks`, `path`, `stack`, `nearest`, `parse`, `layout`.
- Added: hooks `--ds-chart-height`, `--ds-chart-radial-height`, `--ds-chart-gauge-height`, `--ds-chart-spark-height`,
  `--ds-chart-bar`, `--ds-chart-radius`, `--ds-chart-stroke`, `--ds-chart-marker`, `--ds-chart-grid`,
  `--ds-chart-area-opacity`, `--ds-chart-stack-opacity`, `--ds-chart-dash-2` to `--ds-chart-dash-4`; strings
  `chartTableView`, `chartRole`, `chartKeys`, `chartKeysBars`, `chartKeysSlices`, `chartPoint`, `chartSummary`,
  `chartTotal`, `chartOther`, `chartShown`, `chartHidden`, `chartEmpty`.

#### Popovers and menus

- Menu: submenus (an item with `aria-haspopup="menu"` and `aria-controls`, `.ds-menu__chevron`; beside the item in
  the top layer, ArrowRight / ArrowLeft, hover intent, the chain closes together), a search at the top of a long menu
  (`.ds-menu__search` over the items in a `.ds-menu__list`, `.ds-menu__empty` written with the string `noResults`), and context menus
  (`data-ds-contextmenu`: right click, long press, Shift+F10 and the ContextMenu key; `ds:contextmenu`;
  `DS.menu.openAt()`). The items, check and radio items of a menu ignore those of a submenu inside it. New motion
  tokens for them: `--ds-delay-submenu` (100ms, hover intent), `--ds-delay-submenu-close` (300ms, the grace) and
  `--ds-delay-long-press` (500ms, the touch that opens a context menu). A searchable menu puts its items in a
  `.ds-menu__list` with `role="menu"`, since a menu owns only items.
- Popover (`.ds-popover`, `js/popover.js`, `DS.popover`): an anchored non-modal panel with an optional arrow
  (`.ds-popover--arrow`), a help card variant (`.ds-popover--tip`), placement and alignment
  (`data-ds-popover-placement`, `data-ds-popover-align`), the top layer as `popover="manual"`, light dismiss
  through `DS.overlay`, and the hover card (`data-ds-popover-trigger="hover"`). Hooks `--ds-popover-width`,
  `--ds-popover-tip-width`, `--ds-popover-padding`, `--ds-popover-tip-padding`, `--ds-popover-radius`.
- Toggletip (`.ds-toggletip`, `js/toggletip.js`, `DS.toggletip`): the info button that opens a help card
  (`.ds-popover--tip`) on a click or a tap and announces its text; sits on the label row of a `.ds-field`. Hook
  `--ds-toggletip-size`. New string `moreInfo` ("More information").
- Tooltip: `data-tip-placement` (bottom, top, start, end; the tooltip carries the asked side as `data-side`, and
  `data-placement` now also says `start` and `end`) and `data-tip-delay` (none, short, long) on the trigger. The
  shortcut slot (`data-tip-shortcut`) is documented with `aria-keyshortcuts`.

#### Command palette and notifications

- Banner (3.0): `DS.banner` (`create`, `order`, `priorityOf`) and `data-ds-banner` on the app frame's `.ds-banner`:
  several messages in priority order (`data-ds-banner-priority`, else by tone), `data-ds-banner-max` with the
  `.ds-banner__more` button, dismissal (`data-ds-banner-id`, `.ds-banner__dismiss`) remembered through `DS.store`
  (`data-ds-banner-remember`); the string `bannerMore`.
- Command palette (3.0): `.ds-command` in a `.ds-dialog`, `DS.command` (`create`, `open`, `close`, `fuzzy`, `rank`),
  `data-ds-command`; Ctrl+K through `DS.hotkeys`, groups, recent commands through `DS.store`, fuzzy search with
  marks, shortcuts, pages and prefixes, async providers.
- Notification centre (3.0): `.ds-notifications` on a `.ds-sheet`, `.ds-notifications__bell` with its count badge,
  `DS.notifications` (`create`, `open`, `close`, `groupByDay`, `dayOf`), `data-ds-notifications`: groups by day,
  read and unread, mark all read, actions per notification, an unread-only switch, the empty state and a live
  announcement on arrival. Hooks `--ds-notifications-icon-size`, `--ds-notifications-item-padding`,
  `--ds-notifications-dot-size`; the `notifications*` strings.
- Shortcut sheet (3.0): `.ds-shortcuts` in a `.ds-dialog`, `DS.shortcuts` (`create`, `open`, `close`, `render`,
  `byScope`), `data-ds-shortcuts`; "?" lists every shortcut of `DS.hotkeys`, grouped by scope and group, with a filter.
- Snackbar (3.0): `DS.toast.promise()` (a waiting message with a spinner that turns into its outcome in place) and
  `DS.toast.progress()` (a message with a progress bar: `set()`, `done()`, `fail()`); `.ds-toasts--stack`, a
  collapsed stack that expands on focus or a click (never on hover), with the hook `--ds-toast-stack-width`;
  `data-ds-toast-limit` on a region (1 to 5 messages at once). New classes `.ds-toast--progress`, `.ds-toast__body`,
  `.ds-toast__spinner`, `.ds-toast__value`; the system's string `done`.

#### Surfaces

- Bottom sheet (`DS.bottomsheet`, `[data-ds-bottomsheet]` with `data-ds-bottomsheet-detents`, `.ds-bottomsheet` with
  `__panel` and `__handle`, on the side sheet's markup): a modal sheet at the bottom edge with detents, a handle (click
  and keys), drag that follows the finger (the named motion exception) and drag to dismiss (reason `drag`);
  `open()`, `close()`, `create()`, `parseDetents()`, `settleDetent()`. Hooks `--ds-bottomsheet-width`, `-gap`,
  `-radius`. Strings `resizeSheet`, `sheetDetent`.
- Dialog: `.ds-dialog--scroll-outside` (the window scrolls the whole box; the body scrolling inside stays the default),
  a non-modal box `.ds-dialog__box--modeless` (no frame or scrim, the page stays usable; DS.overlay's non-modal layer,
  focus moved in by `DS.dialog` once it opened; hook `--ds-dialog-modeless-inset`), and `lines` and `facts` on
  `confirm()`, `alert()` and `prompt()` (`.ds-dialog__lines`, `.ds-dialog__facts`). Stacked dialogs documented.
- Lightbox (`DS.lightbox`, `[data-ds-lightbox]` with `[data-ds-lightbox-item]`, `.ds-lightbox__gallery`, `__item`, and
  the viewer `.ds-lightbox` with `__box`, `__bar`, `__count`, `__stage`, `__nav` (`--prev`, `--next`), `__figure`,
  `__frame`, `__image`, `__caption`, `__error`, `__thumbs`, `__thumb`): images one at a time in a modal dialog, with
  thumbnails, keys, zoom and pan (buttons, keys, double click, wheel, pinch), a caption, swipe on touch, loading and
  error states; `create()`, `open()`, `close()`, `show()`, `nextZoom()`, `clampPan()`, `MAX_ZOOM`. Hooks
  `--ds-lightbox-bg`, `-ink`, `-thumb-size`, `-item-size`, `-radius`. Strings `imageOf`, `images`, `zoomIn`, `zoomOut`,
  `imageFailed`. Integrator: the glyphs `zoomIn` and `zoomOut` (a magnifier with plus and minus) would read better than
  `plus` and `minimize` in the bar.
- Loading overlay (`DS.loadingoverlay`, `[data-ds-loadingoverlay]` with `[data-ds-loadingoverlay-cancel]`,
  `.ds-loadingoverlay` with `--opaque`, `__box`, `__message`, `__detail`): blocks one region with a spinner and a message
  (the region inert and `aria-busy`, focus kept, the message announced, no flash through `--ds-delay-loader` and
  `--ds-hold-loader`, a cancel); `show()`, `hide()`, `wait()`, `create()`, `holdMs()`. Hooks
  `--ds-loadingoverlay-veil`, `-radius`, `-padding`, `-spinner-size`.
- Side sheet: docked panels in a `.ds-sheet__layout` beside its `.ds-sheet__main`, `.ds-sheet__panel--push` (the
  content narrows, focus moves in) and `.ds-sheet__panel--inspector` (beside a list that stays usable, focus stays in
  the list), non-modal layers of `DS.overlay`; resizing with `.ds-sheet__resize` (a separator: pointer and keys, the
  width remembered through `DS.store` under `data-ds-sheet-remember`, bounded by `data-ds-sheet-min` and `-max`,
  `ds:resize`), `DS.sheet.resizable()`, `clampWidth()`, `dragWidth()`, `MIN_WIDTH`; hooks `--ds-sheet-docked-width`
  and `--ds-sheet-docked-border`; string `resizePanel`. The separator's pill stays shown on a screen without hover.
- Tearsheet (`DS.tearsheet`, `[data-ds-tearsheet]`, `.ds-tearsheet` with `--narrow`, `__box`, `__head`, `__heading`,
  `__label`, `__description`, `__progress`, `__main`, `__steps`, `__body`, `__step`, `__foot`; the buttons
  `[data-ds-tearsheet-back]`, `-next`, `-submit`): a tall create or edit flow in a modal dialog with steps checked one
  by one, a submit with `wait()`, unsaved changes guarded by a destructive question (and `beforeunload`), and stacking
  (`data-stacked`). Hooks `--ds-tearsheet-width`, `-width-narrow`, `-gap`, `-padding`, `-rail-width`, `-radius`.
  Strings `stepOf`, `stepDone`, `stepError`, `discardTitle`, `discardText`, `discard`, `keepEditing`.

#### App frame

- **App frame** (3.0): `DS.shell` (`src/components/shell/shell.js`), the frame's behaviour as `data-ds-*` attributes:
  `data-ds-shell` (the menu button toggles the rail above 900px, remembered, and opens the modal drawer below; skip
  links; the drawer's pill, edges and `data-scrolled`), `data-ds-drawer` (groups remembered open or closed, a filter
  inside the drawer, `.ds-drawer__search` and `.ds-drawer__empty`, the arrow keys), `data-ds-search-sheet` (the top
  bar's search as a full-width sheet at 720px and below, `.ds-topbar__search-open`, `.ds-topbar__search-back`,
  `.ds-topbar__results`), `data-ds-launcher` (the app switcher, `.ds-launcher`, `.ds-launcher__app`,
  `.ds-launcher__icon`, `.ds-launcher__label`, hooks `--ds-launcher-columns`, `--ds-launcher-app-width`,
  `--ds-launcher-app-height`, `--ds-launcher-icon-size`, `--ds-launcher-font`), `data-ds-scheme-switch` and
  `DS.shell.setScheme()` (light, dark, auto, remembered), the account menu (`.ds-account__trigger`,
  `.ds-account__menu`, `.ds-account__head`, hook `--ds-account-menu-width`), and `data-ds-breadcrumbs` (the middle
  folds into a menu behind `.ds-breadcrumbs__more` by the nav's width). Badges in drawer items (a dot on the rail),
  a dot on a top bar icon button (the notification slot), and a drawer action that turns icon-only on the rail.
  Strings `filterMatch`, `filterMatches`, `breadcrumbsMore`.
- Segmented switch: icons and counts (`.ds-segmented__count`) on an option, icon-only options with half the side
  padding; `data-label` now reserves the heavier width in a grid, so an icon keeps its column.

#### Page navigation

- Back to top (`.ds-backtop`, `.ds-backtop--fixed`, `DS.backtop`, `backtop.js`): a button that appears after a scroll
  (with a threshold that does not flicker), scrolls back to the top and moves the focus there.
- Object page (`.ds-object`, `DS.object`, `object.js`): one record on one page, the page head with its key facts, the
  section anchors as a sticky bar of jump links under it, sections as cards, and an edit mode that turns a section or
  every section into its inline form (`ds:edit`, `ds:save` with the form's values, `ds:cancel`, `done()`).
- Page head: `.ds-page-head--sticky` (`--ds-page-head-top`, `--ds-page-head-bg`) and a behaviour module (`DS.page`,
  `data-ds-page-head`): the sticky head condenses once the reader has scrolled (`data-scrolled`, the content kept in
  place; the hairline on a scroll timeline where supported), and the actions fold into a More menu
  (`.ds-page-head__more`) by the row's width.
- Steps: clickable steps (`.ds-steps__link`, a button or a link around the mark and label, with state layer, ripple
  and touch target), a stage path (`.ds-steps--path`, `--ds-steps-path-height`) and a behaviour module (`DS.steps`,
  `data-ds-steps`): a press sends a cancelable `ds:change`, moves `aria-current` and announces the step.
- Tabs: `data-ds-tabs` (`DS.tabs`, `tabs.js`): selection, the keyboard, panels kept alive (`first` in `ds:change`),
  the indicator, closing (`ds:close`, cancelable; Delete, the close button, `data-ds-tabs-close` in a panel), adding
  (`.ds-tabs__add`, `ds:add`, `add()`) and the overflow into a "More" menu (`data-ds-tabs-overflow`,
  `.ds-tabs__bar`, `.ds-tabs__more`). New strings `moreTabs`, `tabClosed`, `closeTab`.
- Jump links (`.ds-toc`, `DS.toc`, `toc.js`): a table of contents or a bar of anchors, sticky, with scroll-spy through
  `IntersectionObserver` (`aria-current="location"`), jumps that move the focus, and `ds:change`.

#### People

- Avatar (3.0): `.ds-avatar` moves out of the app frame into a component of its own, with `.ds-avatar--hue-1` ... `-6`
  (a colour from the name, 4.5:1 in every theme), `.ds-avatar--square` (entities), `.ds-avatar--ring` (activity), a
  status dot (`.ds-presence-dot`) and a corner badge (`.ds-badge`) that are never cut, interactive avatars (state layer,
  focus ring, touch hit area), and `.ds-avatar-group` with `--spread` and `__more`. `DS.avatar` (`initials`, `hue`,
  `create`, `group`), `data-ds-avatar` and `data-ds-avatar-group`. New strings: `avatarStatus`, `avatarMore`,
  `avatarOverflow`. An avatar's overflow is visible now (2.x clipped it); a picture inside clips itself.
- Level meter (3.0, new): `.ds-levelmeter` with `__label`, `__track`, `__fill`, `__peak` and `__note`, the variants
  `--segmented` and `--vertical`; `DS.levelmeter` (`create`, `level`, `peak`, `decibels`) and `data-ds-levelmeter`: reads a
  page-supplied AnalyserNode every frame, peak hold, "Too loud" in words when the sample peak reaches -1 dBFS. New strings: `levelmeterValue`, `levelmeterLoud`.
- Media (3.0, new): `.ds-media` cards (`__thumb`, `__tag`, `__select`, `__check`, `__open`, `__title`, `__meta`,
  `__actions`; `--square`, `--wide`, `--bare`) in a `.ds-media-grid`; `DS.media` (`create`, `between`) and
  `data-ds-media`: one tab stop, arrows in two dimensions, Space, Shift ranges, Ctrl+A and Escape. New strings:
  `mediaSelected`, `mediaSelectionCleared`.
- Persona (3.0, new): `.ds-persona` with `__text`, `__name`, `__role` and `__status`, the variants `--stacked` and
  `--inline`, and an interactive persona with `.ds-pressable`; hooks `--ds-persona-gap`, `--ds-persona-name-font`,
  `--ds-persona-role-font`.
- Presence (3.0, new): `.ds-presence-dot` with `--online`, `--away`, `--busy` and `--offline`, each a shape of its own,
  and `.ds-presence-label` (the dot with its word); the strings `presenceOnline`, `presenceAway`, `presenceBusy`,
  `presenceOffline`.

#### Content and code

- Code block (3.0): `.ds-code-block` and `.ds-code-block--wrap` move from prose.css to the new component `code` (same
  classes; prose requires it). New: the frame `.ds-code` with `.ds-code--lines`, `.ds-code__head`, `.ds-code__title`,
  `.ds-code__lang`, `.ds-code__actions`, `.ds-code__line` (`--mark`, `--inserted`, `--deleted`), `.ds-code__foot`,
  `.ds-code__expand-label`; `DS.code` (`data-ds-code`, `-lang`, `-label`, `-start`, `-mark`, `-max`, `-wrap`,
  `-remember`, `-expand`; `create`, `parseLines`, `linesHtml`). A `.ds-code-block` in prose now takes the prose's gap.
  String `wrapLines`. Motion exception: the folded block's `height`. `get()` and `refresh()` read lines the page changed
  underneath (a streamed Markdown answer); in forced colours a focused framed block keeps its ring.
- Syntax highlighting (3.0, D13): `DS.highlight` (`data-ds-highlight`; `tokenize`, `highlight`, `lines`, `language`,
  `languages`, `register`, `use`, `create`, `KINDS`) with tokenizers for json, js, ts, sh, html, xml, css, sql, yaml,
  go, py and diff; the token classes `.ds-highlight__*`; the colour roles `--ds-code-keyword`, `--ds-code-string`,
  `--ds-code-number`, `--ds-code-comment`, `--ds-code-function`, `--ds-code-type`, `--ds-code-property`,
  `--ds-code-meta`, `--ds-code-inserted`, `--ds-code-deleted` (light, dark and contrast values). Linear time, long single
  lines included.
- Markdown (3.0): `DS.markdown` (`data-ds-markdown` with `-anchors`, `-breaks`, `-code`, `-images`; `render`,
  `create`, `use`, `slug`): a safe CommonMark subset with GFM tables, task lists, strikethrough and autolinks,
  footnotes and callouts, no HTML passthrough, links limited to http, https, mailto and relative URLs, the page's own
  sanitiser or renderer as a hook; linear time on hostile input, nesting capped at 100. Strings `copyCode`,
  `codeBlock`, `footnotes`, `footnoteBack`, `calloutNote`, `calloutTip`, `calloutImportant`, `calloutWarning`,
  `calloutCaution`.
- Prose (3.0): heading anchors (`.ds-prose__anchor`), footnote references and links back (`.ds-prose__fnref`,
  `.ds-prose__fnback`, the `:target` note on the tint), `kbd` and `mark` in prose, the column alignment `data-align`.
  `.ds-code-block` and `.ds-code-block--wrap` and the hook `--ds-code-block-radius` move to [Code block](#code-block)
  (same names; prose requires code).

#### Diffs, logs and terminal

- Diff view (`.ds-diff`, `DS.diff`): unified diff text parsed into files with headers, +/- counts, hunk headers, two
  line-number gutters, word-level marks, folded unchanged lines with their buttons, unified, split and auto views, a
  highlighter hook (`DS.diff.highlighter`, or `DS.highlight` from `ds.js`) and the lines between hunks through a
  `load` callback. Files above 1,000 lines start folded and render when opened. New strings `diffAdded`, `diffRemoved`, `diffStats`, `diffFileAdded`, `diffFileDeleted`,
  `diffFileRenamed`, `diffFileCopied`, `diffFileBinary`, `diffBinary`, `diffNoChanges`, `diffUntitled`,
  `diffNoNewline`, `diffExpandOne`, `diffExpand`, `diffShownOne`, `diffShown`, `diffOldLine`, `diffNewLine`,
  `diffChange`, `diffCode`, `diffOldCode`, `diffNewCode`.
- Log viewer (`.ds-logview`, `DS.logview`): a windowed log (`DS.virtual`, 100,000 lines by default) with ANSI colours
  on theme roles (hooks `--ds-logview-black` ... `--ds-logview-white`), levels read from the text with an icon and a
  word, level filter chips with counts, search with a count and next and previous, "Only matching lines", wrap,
  timestamps (time of day, full or none), copy of a line or a range (a multi-select listbox), follow mode with the
  "Latest" pill (`DS.dom.followEnd`), `append()` batched per frame, `DS.logview.parse` and `DS.logview.ansi`. New
  strings `logName`, `logFatal`, `logError`, `logWarn`, `logInfo`, `logDebug`, `logTrace`, `logLevels`, `logSearch`,
  `logSearchPlaceholder`, `logPrevious`, `logNext`, `logMatch`, `logMatchesOne`, `logMatches`, `logOnlyMatches`,
  `logWrap`, `logTimestamps`, `logCopyLine`, `logCopyLines`, `logCopiedOne`, `logCopied`, `logSelected`,
  `logLinesOne`, `logLines`, `logShown`, `logEmpty`, `logNoneShown`, `logLatest`, `logFollowing`.
- Terminal frame (`.ds-terminal`, `DS.terminal`, tier 2): the chrome around a terminal emulator the page brings: a
  head with the title, a status chip (connecting, connected, disconnected) and the page's actions, the screen, and a
  key bar (Esc, Tab, Ctrl, Alt, the arrows; more by name or character) shown under a coarse pointer, with Ctrl and
  Alt held for the next key, also for a character typed on the soft keyboard. `DS.terminal.sequence` gives xterm's
  bytes of a key, `DS.terminal.theme` the theme's colours for an emulator (hooks `--ds-terminal-*`); `--fill` for a
  terminal page; plain output with `data-fg` spans. New strings `terminalKeys`, `terminalUp`, `terminalDown`,
  `terminalLeft`, `terminalRight`, `terminalConnecting`, `terminalConnected`, `terminalDisconnected`,
  `terminalHeld`, `terminalReleased`.

#### Chat

- AI label (3.0, new): `.ds-ailabel` (`--outlined`, `--plain`, `--icon`) with its toggletip `.ds-ailabel__tip`
  (`__title`) and `DS.ailabel` (`data-ds-ailabel`, `create`), opened through `DS.overlay`. Hooks `--ds-ailabel-height`,
  `--ds-ailabel-bg`, `--ds-ailabel-color`, `--ds-ailabel-tip-width`.
- Composer (3.0): `.ds-composer` moves out of the form into a folder of its own, with a behaviour module
  (`DS.composer`, `data-ds-composer`): attachments as chips (`.ds-composer__attachments`, `.ds-composer__attachment`,
  `.ds-composer__picker`, drop and paste), a slash-command and mention palette at the caret (`.ds-composer__palette`,
  `.ds-composer__option`), send and stop (`data-ds-composer-busy`), Enter / Shift+Enter, remembered drafts
  (`data-ds-composer-draft`). New hooks `--ds-composer-bg`, `--ds-composer-chip-height`,
  `--ds-composer-chip-max-width`, `--ds-composer-palette-width`, `--ds-composer-palette-radius`,
  `--ds-composer-option-height`. The 2.x markup keeps its look.
- Feedback (3.0, new): `.ds-feedback` (`__label`, `__status`) and `DS.feedback` (`data-ds-feedback`,
  `data-ds-feedback-value`, `-reason`, `-reason-for`, `-lock`; `create`, `toggle`, `asks`): thumbs as exclusive toggles,
  `ds:change` and `ds:feedback`, an optional reason dialog. String `feedbackThanks`.
- Message (3.0, new): `.ds-message` with the roles `--assistant`, `--user`, `--system` and `--tool`, its parts
  (`__avatar`, `__main`, `__head`, `__author`, `__time`, `__content`, `__note`, `__footer`), the states streaming
  (a cursor, `aria-busy`), partial and error (a note), and `DS.message` (`data-ds-message`, `create`, `state`) with the
  footer actions copy, retry and edit. Hooks `--ds-message-avatar-size`, `--ds-message-gap`, `--ds-message-user-bg`,
  `--ds-message-user-color`, `--ds-message-user-max`, `--ds-message-radius`, `--ds-message-tool-bg`. Strings
  `messageStopped`, `messageFailed`.
- Suggestions (3.0, new): `.ds-suggestions` (a row of action chips that scrolls sideways with `.ds-scroll-x`, or
  `.ds-suggestions--wrap`) and `DS.suggestions` (`data-ds-suggestions`, `-for`, `-send`, `create`, `items`): drag to
  scroll, `ds:select`, filling or sending a composer. Hook `--ds-suggestions-gap`.
- Transcript (3.0, new): `.ds-transcript` with `__list`, `__day`, `__earlier`, `__latest` and `__unread`, and
  `DS.transcript` (`data-ds-transcript`, `create`, `day`): sticks to the end, the "Latest" pill with an unread count,
  load earlier in place (`data-ds-transcript-earlier`, `ds:earlier`, `loaded()`), polite announcements of complete
  replies (`data-ds-transcript-announce`). Hooks `--ds-transcript-max-width`, `--ds-transcript-gap`,
  `--ds-transcript-pad`. Strings `latest`, `unreadCount`, `earlierLoaded`.

#### Agent

- Sources and citations (`.ds-cite`, `.ds-cite__card`, `.ds-cite-list`, `DS.cite`, `data-ds-cite`): numbered markers
  that open a source card on hover (WCAG 1.4.13: hoverable, dismissible) and on a press (focus moves into it), through
  `DS.overlay` in the top layer, placed by `DS.position`; and the list of sources.
- Plan card (`.ds-plan`, `DS.plan`, `data-ds-plan`): a proposed plan with its steps (a `.ds-tasks` list) and the
  decision, approve or reject, with a cancelable `ds:decide`, the state as an icon and a word, announced. Strings
  `planWaiting`, `planApproved`, `planRejected`.
- Question card (`.ds-question`, `DS.question`, `data-ds-question`): a question with radio or checkbox cards, an
  answer of one's own, Answer and Skip; keys 1 to 9, a cancelable `ds:answer`, the answer kept in view and announced.
  Strings `questionAnswered`, `questionSkipped`, `questionRequired`.
- Reasoning disclosure (`.ds-reasoning`, `DS.reasoning`, `data-ds-reasoning`): thinking collapsed under a summary line
  ("Thinking" with the shimmer, then "Thought for 12s" or the page's own), the thoughts following their end while they
  stream, an optional auto open and close. Strings `reasoningRunning`, `reasoningDone`.
- Shimmer (`.ds-shimmer`, `data-shimmer`): a soft glint that travels over the words of a status line, on
  `ds-progress-wave`. Hook `--ds-shimmer-length`; colour roles `--ds-shimmer-glint` and `--ds-shimmer-peak` (in
  `tokens.css`, `themes/dark.css` and `themes/contrast.css`); the loop `--ds-loop-shimmer` requested (until then:
  `--ds-loop-loader`).
- Thinking indicator (`.ds-thinking`, `DS.thinking`, `data-ds-thinking`): the step on a wheel with the shimmer, the
  thought, the elapsed time and the tokens. Strings `tokensOne`, `tokensOther`.
- Tool call (`.ds-toolcall`, `DS.toolcall`, `data-ds-toolcall`): a disclosure row in a frame with the call's name,
  arguments, status (icon and word), live duration, input, output and nested calls; announces its end. String
  `toolStatus`, and the status words `toolPending`, `toolRunning`, `toolDone`, `toolFailed`, `toolCancelled`.
- Usage meter (`.ds-usage`, `DS.usage`, `data-ds-usage`): tokens and cost against a budget on a meter, with an icon
  and a word near and over it (announced once). Strings `usageOf`, `usageShare`, `usageNear`, `usageOver`.
- Wheel (`.ds-wheel`, `DS.wheel`): a live status line whose new line pushes the old one out, with a hold so a quick run
  of changes rolls once; morph hooks (`DS.wheel.hooks`), `DS.wheel.roll()`, `DS.wheel.create()` and `data-ds-wheel`.
  Hooks `--ds-wheel-travel`, `--ds-wheel-fade`. The reference implementation of plans/wheel-and-shimmer.md, as a
  component module (`DS.wheel.hooks` and `DS.wheel.roll` stand for the plan's `DS.motion.wheelHooks` and
  `DS.motion.wheel`).

### Phase 1 completed: one sublayer per component, the 2.x styleguide retired (3.0.0-alpha.4)

**Sublayers.** Every component's rules sit in its own sublayer, `ds.components.<name>`, and `global.css` in
`ds.components.global`, the first. `src/index.css`, `ds.css`, every file of `css/` and every bundle declare them in
`manifest.json` order, so the first stylesheet a page loads fixes the cascade: single files linked in any order, a
partial bundle and several bundles on one page cascade exactly as `ds.css` does (`bundle.spec.js` links single files
in reverse order and compares every element). A later component now wins over an earlier one whatever the specificity.

**Migration.**
- **Your own `@layer ds.components.<name> { … }`** joins that component's sublayer; a project rule that relied on
  `@layer ds.components { … }` directly now beats every component (it did not before). Keep project CSS unlayered.
- **Cascade order** (`manifest.json` `order`): building blocks first, the containers after what they place, the frame
  after them, `ripple` last. A page that links single files may link them in any order.

**Build.** It fails a component stylesheet with a rule outside its own sublayer, a selector that names a class of a
component that comes later (outside `:not()` and `:has()`), or a `context` entry it does not name. New optional
`meta.json` key `stateClasses`: the classes a module writes on other components' elements (ripple: `.ds-pressed`,
`.ds-ripples`), which any stylesheet names without listing the component in `context`. `manifest.json` gives each
component's `layer` as its sublayer.

**Moved between stylesheets** (same selectors and weight, now in the later component of each pair): the link row of
cards in `.ds-grid-2` and the page's loading bar (page), key facts in a card (card), the toolbar's swap slot (form),
the row form's cap of a combobox (combobox), a chip and a badge in a card's head row (chip, badge), a chip in a
current list row in forced colours (chip), a badge in a selected table row, a blocked tab and a blocked drawer item
(table, tabs, shell), the hover actions of a card, a drawer row and a selected table row (card, shell, table). The
card's zero-weight paragraph reset moves to `global.css`. `.ds-stale` belongs to utilities.

**Changed, on purpose.** A prose block in a card keeps its rhythm between blocks (2.x: the card's paragraph reset
outweighed it by its type selector). A computed-style probe of the styleguide, every component fixture, the Motion Lab,
the live tour, the reference app and the 2.x fixtures (light and dark, 1280 and 390px, and with every element
hovered, pressed and focused) found no other difference.

**Styleguide.** The 2.x styleguide is retired: `styleguide/legacy.html` and `styleguide.js` are gone, and every 2.x
section lives on a component page or a foundation page of `styleguide/index.html`. Old addresses
(`index.html#forms`) open the page that took the section over. The Motion Lab's frame (navigation, theme and speed
selects, the demo cards) lives in `styleguide/motion-lab.js`. "Theme file" puts a shipped theme (dark, compact,
contrast, example, System) or a snippet over the preset. The demos show what only the 2.x sections showed (a
full-width field, adding and editing rows, the radio tiles' indicator, a contained dialog, type-to-confirm, the held
press of every button look, a wide pinned table, a stale refresh). The drawer, the overview and the Motion Lab list
components in docs order (`meta.json` `docsOrder`), no longer in cascade order.

### Phase 1: every component on the options model, the helpers (3.0.0-alpha.3)

Every component computes size, density, shape, touch and, where it shows meaning, tone in its own rule, so **a 2.x page
changes where those options apply**. 2.x names keep working until 3.0.0 ships, except what "Migration" names.

**Migration.**
- **Modules.** `import { toast } from 'js/overlay.js'` also needs `js/toast.js` (likewise `js/dialog.js` for `confirm`,
  `alert` and `prompt`, `js/tooltip.js` for `tooltips`, `js/menu.js` for a menu's keys): without it the call throws an
  error that names the file, or a menu has no keys. `ds.js` and a bundle have them.
- **Compact.** `themes/compact.css` is now the density and two hooks: fields 32px (2.x: 36px), chips 24px (28px), cards
  padded 20px and spaced 12px, alerts, empty states, loading and progress with tighter block padding. Table rows (40px,
  16px beside the text), buttons, tabs, drawer rows, menu rows and the segmented switch keep their 2.x size. A theme that
  set the removed heights itself keeps them, but they are now the base that the density steps apply to.
- **Touch.** `.ds-touch` no longer sets component heights (`--ds-input-height`, `--ds-chip-height`, `--ds-tabs-height`
  and the others): everything takes `--ds-target-min`. A page that read those hooks under `.ds-touch` reads the
  computed size instead.
- **Pinned last column.** `DS.dom.scrollEdges()` writes `--ds-table-pin-last-width`, so a page no longer sets it.
- **Removed fallback.** `-webkit-mask-*` duplicates and other floor features (D9) went with the ports.

**Tools.** `manifest.json` lists the attributes a core module's `define()` declares, so a bundle finds `DS.indicator`,
`DS.hotkeys` and `DS.format` by `data-ds-indicator`, `data-ds-hotkey` and `data-ds-time`. `DS.core.config()` dispatches
`ds:config` on the document when the locale or the strings changed, so a page re-renders its text there.
`ripple.js`: a press on the box of a `.ds-check-card` ripples, as on a radio card.

**By component.**

*alert.*
- Alert: on the options model (size and density pad it, shape rounds it, tones from the class on the alert). New
  `.ds-alert--inline` and `.ds-alert--section`, hooks `--ds-alert-radius`, `--ds-alert-padding-block`,
  `--ds-alert-padding-inline`. `.ds-alert--success`, `--warning`, `--error` deprecated: `.ds-tone-success`, `-warning`,
  `-error`. The box grows to hold its button. Changed under `themes/compact.css`: the padding is 8/12px (2.x: 12/16px),
  since the theme is density -2.

*badge.*
- Badge: on the options model (size steps it, shape rounds it, tones from the class on the badge). New `.ds-badge--dot`
  (`--ds-badge-dot-size`) and a count with a maximum, `DS.badge` (`data-ds-badge`, `data-ds-badge-max`, `create`,
  `format`). `.ds-badge--neutral`, `--ok`, `--warning`, `--error` deprecated: `.ds-tone-neutral`, `-success`,
  `-warning`, `-error`.

*card.*
- Card on the options model: density (padding, rhythm, `--ds-card-pad`), shape (rest and pressed radius), touch (an interactive card).
- New: `.ds-card--outlined`, `.ds-card--horizontal` with `.ds-card__media` and `.ds-card__body`, `.ds-card--selectable` with `.ds-card__check`; hooks `--ds-card-radius`, `--ds-card-radius-pressed`, `--ds-card-bg`, `--ds-card-border`, `--ds-card-filled-bg`, `--ds-card-check-size`, `--ds-card-media-size`, `--ds-card-body-min`.
- Renamed: `.ds-subsection` to `.ds-card__section`, `.ds-more` to `.ds-card__more` (aliases until 3.0 ships).
- The rule that runs disclosure rows to a card's edges moved here from the disclosure's stylesheet.
- Fixed from 2.x: a disabled or `aria-disabled` clickable card now looks blocked (`--ds-disabled-*`, cursor `not-allowed`) and takes no hover shadow; an elevated clickable card keeps its shadow on hover and while pressed.

*chart.*
- Charts on the options model: size steps a meter, the plot and a legend key, density the plot, the shape multiplies
  every radius, `.ds-touch` gives a column that opens its target.
- Tones on the mark itself (`.ds-tone-*` on `.ds-meter`, `.ds-columns__col`, `.ds-legend__key`). Deprecated:
  `.ds-meter--neutral`, `--warning`, `--error`, `.ds-columns__col--warning`, `--error`, `.ds-legend__key--neutral`,
  `--warning`, `--error`.

*chip.*
- Chips: on the options model: size, density, shape, touch and tone computed in the chip's own rule. Hooks
  `--ds-chip-padding-x`, `--ds-chip-radius`, `--ds-chip-font`. `.ds-touch` no longer sets `--ds-chip-height`, and the
  compact theme neither: a chip there is its dense density's 24px (2.x 28px), like every control on that density.

*combobox.*
- Combobox on the options model (size, density, shape, touch, computed in `combobox.css`); the field, the toggle and
  the options follow them. `DS.overlay` stays its opener and the 2.x markup keeps working.
- New: group headings (`.ds-combo__group`, `.ds-combo__heading`) and option descriptions (`.ds-combo__description`),
  the clear button (`.ds-combo__clear`), the create option (`.ds-combo__option--create`), several values
  (`.ds-combo--multi`), a spinner row in the status line, the disabled state of toggle and clear button, hook
  `--ds-combo-radius`.
- Removed the `-webkit-mask-*` duplicates of the list's cut edges (the floor has `mask`).

*dialog.*
- Dialog (3.0): behaviour in `js/dialog.js` (`DS.dialog`), `DS.overlay.confirm()`, `alert()` and `prompt()` keep their
  names. Sizes `.ds-dialog--sm`, `--lg` and `--xl`; `--wide` is deprecated. Form dialog: `form.ds-dialog__box`,
  `ds:submit`, `DS.dialog.form()`. Density and shape on the box. `confirm({ destructive: true })` fills its button in
  the error tone (D10). `data-ds-open`, `data-ds-close`; `data-close` and the event `ds-close` are deprecated
  (`ds:close`, `ds:open`). New strings `confirm`, `actionFailed` and `valueRequired`; a built dialog reads them, with
  `ok` and `cancel`, from `DS.config({ strings })`. Migration: a page that imports single files imports `js/dialog.js`
  next to `js/overlay.js`; without it `confirm()`, `alert()` and `prompt()` throw and `open()` of a dialog warns once.

*disclosure.*
- Disclosure on the options model: size, density and touch (`--ds-target-min`; `.ds-touch` no longer sets `--ds-disclosure-height`), shape on the plain summary.
- `details[name]` is at the floor: exclusive accordions are documented without a fallback.
- New hooks `--ds-disclosure-radius`, `--ds-disclosure-radius-pressed`, `--ds-disclosure-font`, `--ds-disclosure-row-padding`, `--ds-disclosure-row-padding-exact`.

*drag.*
- File field and drop zone on the options model (size, density, shape, touch, computed in `drag.css`); the file field is
  40px at the default like every field (2.x: 42px).
- New: `.ds-dropzone--inline`, the zone's error state through `aria-invalid` on its input, hooks
  `--ds-dropzone-padding`, `--ds-dropzone-radius`, `--ds-file-button-height`.

*empty.*
- Empty state: `--section`, `--page`, `--inline`; causes `--no-data`, `--first-use`, `--not-set-up`, `--no-results`,
  `--no-access`, `--offline`, `--error`; a picture in `.ds-empty__media` and two actions in `.ds-empty__actions`; size,
  density, shape and tone; hooks `--ds-empty-disc-bg`, `--ds-empty-disc-color`, `--ds-empty-padding`,
  `--ds-empty-media-size`. Changed under `themes/compact.css`: 28px of block padding and 12px at the sides (2.x: 32px
  and 16px), since the theme is density -2.

*form.*
- Form: on the options model: fields, input groups, `.ds-check` rows, halos and cards compute size, density, shape and
  touch in their own rules (`--ds-input-height` is the md, comfortable base, and `.ds-touch` no longer sets it; the
  compact theme's field is now its density's 32px, 2.x 36px). New: `.ds-field--filled`, `.ds-field--outlined`, `.ds-input--outlined`, `.ds-input-group--filled`;
  the slots `.ds-input-group__leading`, `__prefix`, `__suffix`, `__trailing`; `.ds-field--warning`, `.ds-field--success`,
  `.ds-field__hint--warning`, `--ds-field-warning-color`; `aria-readonly="true"` on a select; `.ds-field__counter--over`;
  `.ds-fieldset`; `.ds-form-section`; `.ds-check-card`, `.ds-check-cards`; an inset field holds an input group; hooks
  `--ds-input-padding-x`, `--ds-input-weight`, `--ds-radio-padding`.
- Deprecated, removed when 3.0 ships: `.ds-check--sm` and `--ds-check-sm-height` (`.ds-sm`, `--ds-check-height`),
  `.ds-input-group__affix` (`.ds-input-group__prefix`, `.ds-input-group__suffix`).

*indicator.*
- Indicator on the options model: the pill follows the item at any size, density and touch target; a project class's
  `border-radius` is copied with `--ds-shape` as a live factor and again at each rest, so it follows a size change too.
- New: `DS.indicator.create()` (`createIndicator()` is its deprecated alias until 3.0 ships) and the declarative
  `data-ds-indicator`, with `data-ds-indicator-class`, `-name` and `-reveal`. Its controller is the handle `create()`
  returns, which also gains `get()`, `set()` and `on()`, and a `ds:change` on the track.
- A pill whose radius springs to 0 keeps its clip through the spring's pass below zero.
- Forced colours hide every pill, also a project class's, not only the system's.

*list.*
- List on the options model: `.ds-list__item` steps 8px per size and 4px per density from its 56px base, with new hooks
  `--ds-list-padding`, `--ds-list-padding-y`, `--ds-list-radius`, `--ds-list-title-font` and `--ds-kv-list-padding`;
  the shape multiplies its radii; `.ds-touch` gives rows and key-value rows that open their target.
- New: `.ds-list__media` (`--round`, `--ds-list-media-size`, `--ds-list-media-radius`), `.ds-list__description`,
  `.ds-list__aside`, `.ds-list--stacked`, `.ds-list__group` with `.ds-list__heading` (`--ds-list-group-bg`,
  `--ds-list-group-top`).
- Deprecated: `.ds-kv-list__icon--ok`, `--warning`, `--error`: `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error`
  on the icon.

*loader.*
- Shape loader: its own docs section; size steps of 24px from the md base. `.ds-loader--sm` and `--ds-loader-sm-size`
  deprecated: `.ds-sm`, `--ds-loader-size`.

*loading.*
- Loading: skeleton presets (`.ds-skeleton__avatar`, `__media`, `__row` with `__lines`, `__table` with `__cells` and
  `__cells--head`, `__form` with `__field` and `__line--label`), `.ds-skeleton--pulse` beside the wave, hook
  `--ds-skeleton-media-ratio`; size, density and shape. The spinner and the shape loader have their own sections now.
  Changed under `themes/compact.css`: 12px of padding on `.ds-loading` and 20px on a card (2.x: 16px and 24px), since the
  theme is density -2. A field bone and a table row read the hooks of the input and the table.

*menu.*
- Menu (3.0): behaviour in `js/menu.js` (`DS.menu`). `.ds-menu__content`, `.ds-menu__description`, `.ds-menu__shortcut`,
  `.ds-menu__item--danger`, `data-ds-menu-checks`. Size, density, touch and shape on the rows and the menu; the default
  row stays 48px. Placement in `js/position.js`. `data-ds-open` toggles a menu and opens it from its arrow keys.
  Migration: a page that imports single files imports `js/menu.js` next to `js/overlay.js`; without it a menu opens with
  no first focus, keys or close on an item, and `open()` warns once.

*page.*
- Page head (3.0): `.ds-page-head__details` and `.ds-page-head__detail`, a row of key facts; `.ds-page-head__tabs`, the
  record's tabs as its last row.
- Breadcrumbs (3.0): `--ds-breadcrumbs-font`, the size's type role; at least `--ds-target-min` high under `.ds-touch`.

*pagination.*
- Pagination: the variants `.ds-pagination--simple` (now with a rule of its own), `.ds-pagination--numbered` and
  `.ds-pagination--cursor`, the parts `.ds-pagination__pages`, `.ds-pagination__page`, `.ds-pagination__gap` and
  `.ds-pagination__jump`, the hooks `--ds-pagination-current-bg`, `--ds-pagination-current-color` and
  `--ds-pagination-jump-width`. Its fields' width comes from a grid column, not from a rule against `.ds-input`. A
  numbered bar in a narrow content area keeps previous, the current page and next on one line.
- A simple bar's range leads too when the content area is at most 600px wide, as in 2.x.

*progress.*
- Progress: size steps of the track (`--ds-progress-height`), the label's place (`--label-above`, `--label-end`),
  tones from the class on the element, the ends follow the shape, hook `--ds-progress-bar`.
  Changed under `themes/compact.css`: the label sits 4px from the track (2.x: 8px), since the theme is density -2.

*prose.*
- New: `.ds-prose--compact` for chat, task lists from the bare markup of a Markdown renderer, `.ds-prose__callout` and `.ds-prose__callout-title` with a tone, `.ds-prose__footnotes`; hooks `--ds-prose-radius`, `--ds-code-block-radius`.
- Prose on the options model: density (the gap, the padding of blocks), shape (every radius). An element with a `ds-` class inside prose is no longer reached by the bare-element rules, so a component keeps its look whatever the cascade order.
- Floor: the `-webkit-hyphens` twins are gone.
- A callout reads its tone from its own class only, and a page class that merely contains `ds-` (`needs-review`) no longer counts as a system class.

*ripple.*
- Ripple on the options model: a host at any size, density, shape and touch target; the tab's ripple box follows the
  shape, and it takes the inset and the radius the tab's layer computes. The rules hold in any cascade order: each
  pressed rule leaves out the host's blocked states by itself, and every system host positions itself (only
  `[data-ds-ripple]` is positioned by `ripple.css`).
- `detach()` of the `DS.ripple.attach()` handle goes with 3.0.0 (`removed` set in `deprecations.json`): use `destroy()`.

*savebar.*
- Save bar on the options model (size, density, shape, touch, computed in `savebar.css`).
- New: `.ds-savebar--inline`, the actions of a long form outside a card in reach at every width, with
  `.ds-savebar-scroller` and hooks `--ds-savebar-bleed` and `--ds-savebar-room`.
- Its cascade order moved after page (`meta.json` `order`), so the room it keeps on `.ds-content` holds in the
  component sublayers too.

*scroller.*
- New: `.ds-scroll-x--reel` (a horizontal reel) and `.ds-scroll-y` (the block axis, with `scrollbar-gutter`); hooks `--ds-scroll-reel-item`, `--ds-scroll-reel-gap`, `--ds-scroll-max-height`.
- Floor: the `-webkit-mask-*` twins are gone (Chrome and Edge have the unprefixed properties since 120).

*sheet.*
- Side sheet (3.0): `js/sheet.js` (`DS.sheet`), `data-ds-sheet`, `data-ds-open`. Density and shape on the panel; hooks
  `--ds-sheet-padding`, `--ds-sheet-head-height`, `--ds-sheet-radius`.

*shell.*
- App frame (3.0): on the options model. Drawer rows and the segmented switch follow size, density, shape and touch;
  the avatar follows size and shape; the panel, the modal drawer, the skip link and the capsule follow the shape; the
  brand link takes `--ds-target-min`.
- Added: nested drawer groups (`--ds-drawer-indent`), `.ds-drawer__foot--pinned`, the hooks `--ds-drawer-font`,
  `--ds-segmented-height`, `--ds-segmented-font`.
- Deprecated: `.ds-avatar--sm` and `.ds-avatar--lg` (`.ds-sm`, `.ds-lg`).
- Changed: a segmented switch under `.ds-touch` is 48px high (it stayed 32px); the rail centres its items on its axis
  (a compact row sat 4px off it); the track never goes under its option's line, so it stays a pill at every size and
  density; a group toggle takes the size's type in the label weight, and a `data-tip` that names it on the rail; a row
  action over a current row takes `SelectedItemText` under forced colours; `.ds-account__avatar[tabindex]` has a hit area
  of at least `--ds-target-min`.
- `themes/compact.css`: drawer rows take their 40px from the density; `--ds-drawer-item-height` is no longer set there,
  and `--ds-segmented-height` is 40px, so the switch keeps its 32px. `.ds-touch` no longer sets
  `--ds-drawer-item-height`.

*slider.*
- Slider: a section of its own; on the options model: size, density, shape and touch computed in its own rule. Hooks
  `--ds-slider-thumb-size`, `--ds-slider-track-height`.

*spinner.*
- Spinner: its own docs section; size steps (`--ds-spinner-size`, `--ds-spinner-determinate-size`), tones on the
  element. New `.ds-spinner--ink`; `.ds-spinner--sm` deprecated: `.ds-spinner--ink` with `.ds-sm`.

*status.*
- Status chip and tag: on the options model (size, shape, tones from the class on the element; no density, so 24px
  stays under `themes/compact.css`); hook
  `--ds-status-height`. `.ds-status--ok`, `--warning`, `--error` deprecated: `.ds-tone-success`, `-warning`, `-error`.
  `.ds-tag--neutral` deprecated: `.ds-tone-neutral`.

*steps.*
- Fixed: the connectors of a row keep their line under forced colours.
- Fixed: in a row with hints every label keeps its width; a hint truncates with an ellipsis before the next mark.
- Steps (3.0): on the options model (size on the mark and the type, density on a column's room, shape on the radius).
  Added `.ds-steps--vertical`, `data-status="error"` and `"optional"`, `.ds-steps__hint`, and the hooks
  `--ds-steps-mark-size`, `--ds-steps-font`, `--ds-steps-gap`.

*switch.*
- Switch: on the options model: the track, row, halo and list row compute size, density, shape and touch in their own
  rule. New: `.ds-switch--icons`, `.ds-switch__icon--on`, `.ds-switch__icon--off`; busy with `aria-busy="true"` and
  `.ds-switch__spinner`; hooks `--ds-switch-track-height`, `--ds-switch-font`.

*table.*
- Table on the options model: size, density and touch compute head and row height where they are used, density the
  cells' side padding, shape the radii. New: `.ds-table--zebra`, `.ds-table--bordered`, `.ds-table--plain`,
  `.ds-table--sticky-head`, `.ds-table--sticky-foot`, `.ds-table--pin-last`, the hooks `--ds-table-padding`,
  `--ds-table-zebra`, `--ds-table-max-height` and `--ds-selection-bar-height`; `DS.dom.scrollEdges()` writes
  `--ds-table-pin-last-width` for a pinned last column.
- Deprecated: `.ds-table--dense` and `--ds-table-dense-row-height` (use `.ds-density-tight`; removed when 3.0 ships).
- A wrapper with sticky rows is a stacking context and hands the wheel on to the page; the pinned columns' hairlines
  show in forced colours; `--ds-table-padding` also sets the phones' side padding.
- `DS.ripple.attach()` knows a pinned last column: a press on its own room shows no press and opens nothing, and a row's
  ripple reaches the cell in a part of its own. A focused row link finishes its ring on the cell.
- A wrapper that is a tab stop draws its ring outside the box when it holds sticky rows or a pinned column; the
  `.ds-toolbar > .ds-swap` slot keeps the selection bar's height, so the table stays where it is; `.ds-table--plain`
  keeps its row lines in forced colours.
- Floor: no `-webkit-mask-*` twins on the table wrappers, and the alt text of a stacked cell's label is used directly.

*tabs.*
- Tabs (3.0): on the options model (size, density, shape, touch through `--ds-target-min`). Added `.ds-tabs--line`,
  `.ds-tabs--contained`, `.ds-tabs--vertical`, `.ds-tabs__columns`, `.ds-tabs__count`, `.ds-tabs__item` with
  `.ds-tabs__close`, and the hooks `--ds-tabs-padding-x`, `--ds-tabs-font`, `--ds-tabs-contained-bg`. Icons before the
  label keep `data-label`'s reserved width under the text.
- `themes/compact.css`: tabs take their 40px from the density; `--ds-tabs-height` is no longer set there. `.ds-touch` no
  longer sets `--ds-tabs-height`. The ripple box follows the tab's computed inset and radius.

*tasks.*
- Tasks on the options model: size and density space the steps (hook `--ds-tasks-gap`), the shape multiplies the
  pending ring.

*tile.*
- Tile on the options model: size steps the value, density the padding (hook `--ds-tile-padding`) and the gap, the shape
  multiplies the rest and pressed radius, `.ds-touch` gives a clickable tile its target.
- New: `.ds-tile__delta` (an arrow and a word, with a tone on it) and the `.ds-tile__trend` slot
  (`--ds-tile-trend-color`). `.ds-columns` is a block also as a `<span>`, for a sparkline inside a clickable tile.
- New hook `--ds-tile-value-line`: the value's line height at the md size, which the size steps scale. A line height
  inside a theme's `--ds-font-display` no longer reaches the value: set the hook instead.

*timeline.*
- Timeline on the options model: size steps the rail's marks, the indent and the title, density the padding (hook
  `--ds-timeline-padding`), the shape the dot, the marker and the comment box.
- New: `.ds-timeline--activity` (a feed of sentences, with avatars in the marker), `.ds-timeline__item--comment`
  (`--ds-timeline-comment-bg`, `--ds-timeline-comment-radius`), `.ds-timeline__time`, and a muted entry with a marker.
- `.ds-timeline__actions` hangs by the text button's padding at its size: put `.ds-sm` on it instead of on each button.

*toast.*
- Snackbar (3.0): behaviour in `js/toast.js` (`DS.toast`), `DS.overlay.toast()` and the others keep their names. Shape on
  the radius, hook `--ds-toast-radius`. `.ds-tone-error`, `.ds-tone-info` on a message built by hand.
  The close button's default name is the string `close` of `DS.config({ strings })`. Migration: a page that imports
  single files imports `js/toast.js` next to `js/overlay.js`.

*tooltip.*
- Tooltip (3.0): behaviour in `js/tooltip.js` (`DS.tooltip`), `DS.overlay.tooltips()` keeps its name. `data-tip-shortcut`
  and `.ds-tooltip__shortcut`; shape on the radius, hook `--ds-tooltip-radius`. Placement in `js/position.js`.
  Migration: a page that imports single files imports `js/tooltip.js` next to `js/overlay.js`.

*utilities.*
- `.ds-pressable` and `.ds-kbd` read `--ds-shape`; `.ds-pressable` takes `--ds-target-min` under `.ds-touch`.

*Helpers.*
- New `js/a11y.js` (`DS.a11y`): `trap()`, `tabbables()`, `canTakeFocus()`, `readsKeys()`, `typeahead()`, `typeaheadMatch()`, and `roving()`,
  `announce()` and `inert()` under this name (the functions of `DS.dom` and `DS.overlay`, which stay).
- New `js/hotkeys.js` (`DS.hotkeys`): a registry of shortcuts per document with platform-aware combos, scopes, fields
  left alone, overlays masking what is behind them, the data of a shortcut sheet (`list()`, `onChange()`), `format()`
  and `data-ds-hotkey`.
- New `DS.overlay.holdInert()` (counted inert for a modal region that is no overlay) and `DS.overlay.layerAt()` (the open
  layer that rules at a node).
- `DS.overlay.canFocus()`, `DS.overlay.FOCUSABLE`, `DS.overlay.typeAhead()`, `DS.dom.typesText()`, `DS.dom.own()` and
  `DS.dom.disown()` are exported (the helpers build on them).
- New strings: `keyCtrl`, `keyAlt`, `keyShift`, `keyMeta`, `keyEnter`, `keyEscape`, `keySpace`, `keyTab`, `keyBackspace`,
  `keyDelete`, `keyHome`, `keyEnd`, `keyPageUp`, `keyPageDown`, `hotkeysGeneral`.
- New core modules: `DS.format` (`number`, `percent`, `currency`, `bytes`, `duration`, `list`, `plural`, `relative`,
  `absolute`, `clock`, `time`, and `data-ds-time` through `DS.init()`), `DS.store` (`open`, `available`), `DS.virtual`
  (`create`, `sizes`) and `DS.dnd` (`create`). `docs/core.md`.
- New strings: `dragHint`, `dragGrabbed`, `dragMoved`, `dragMovedZone`, `dragDropped`, `dragDroppedZone`, `dragCancelled`.
- New attribute written by the system: `data-ds-virtual-gap`. `data-ds-dragging` and `data-ds-dragover` are also written
  by `DS.dnd`.
- New event: `ds:config` on the document, when `DS.core.config()` changed the locale or the strings.

### Phase 1 preparation: the folder pipeline, options, styleguide (3.0.0-alpha.2)

**The default button is 40px** (2.x: 36px): `.ds-sm` and the compact density keep their 32px. Everything else below
adds to 2.x names, which keep working until 3.0.0 ships.

- **One folder per component.** The build discovers a component's module, types, tests, spec, fixture, Motion Lab
  entries and keyframes in `src/components/<name>/`; a new component edits no other file. `scripts/meta-schema.json`
  describes every `meta.json` field; `need`, `tier` and `status` are required and written for all 39 components.
  The hooks table of `docs/theming.md`, the hooks of `themes/example.css`, the keyframe and module tables and
  `RIPPLE_HOSTS` are generated. `node scripts/build.mjs --generated` lists the generated files.
- **Options** ([docs/options.md](docs/options.md), `css/core/options.css`): size `.ds-xs` to `.ds-xl`, density
  `.ds-density-*`, shape `.ds-shape-*`, tone `.ds-tone-*`, touch `.ds-touch`, set around a component and computed in
  its own rule. New roles: `--ds-info` and its family, `--ds-on-error`, `--ds-on-success`, `--ds-on-warning`,
  `--ds-primary-container`, `--ds-on-primary-container`; in the themes, the pairs and the generator.
- **`--ds-type-scale`** multiplies every type role and `--ds-size-display`, theme-level, it does not nest. Migration:
  **`--ds-font-input` no longer follows `--ds-font-reading`**; it keeps a floor of 16/24, so no scale makes iOS zoom.
  A theme that changes the reading role and wants fields to follow sets `--ds-font-input` too.
  `themes/compact.css` writes its 13/18 times the scale.
- **Button, the reference port.** Sizes 24 to 56px, density 4px a step (side padding, type and icon buttons stay),
  every radius times `--ds-shape` (a square theme has square buttons, D11), `.ds-touch` as a minimum through
  `--ds-target-min`, `--ds-btn-height-exact`. Variants `--filled`, `--elevated`, `--ghost`, `--block`; the failed face
  (`.ds-btn--failed`, `.ds-btn__face--failed`, `busy({ failed })`); `.ds-tone-error` on a filled button for a
  destructive confirmation only (D10); hook `--ds-btn-shadow`. The components that line up with a button compute the
  same height.
- **Deprecated, removed when 3.0.0 ships:** `.ds-btn--primary` (`.ds-btn--filled`), `.ds-btn--sm` (`.ds-sm`, which
  follows the density and pads a small text button 8px), `--ds-btn-sm-height` and `--ds-btn-sm-icon-size`. The
  system's own output (`DS.overlay` dialogs and snackbars), the docs, the live tour, the reference app, the shell, the
  Motion Lab and the view demos use the new names. `.ds-toast__action.ds-sm` stays 32px at any density.
- **Tools.** A name with `removed: "3.0.0"` is deprecated (a warning, still in `tokens.json`) in a pre-release copy and
  removed (an error) from the release on, in `check-theme` and `check-project`. `check-theme` reads the type scale.
  `tokens.json` gives an unset hook no default.
- **Browser floor: Safari 17.5, Chrome/Edge 123, Firefox 130** (D9): `linear()`, `@starting-style`,
  `allow-discrete`, `popover` and `details[name]` are used directly; the `fallback` project strips only what stays
  progressive.
- **Styleguide 3.0:** `index.html` is a shell with a page per demo (`SG.demo`, `sg-core.js`), an options panel that
  really applies size, density, shape, tone and touch around the demo, foundation pages, search, a need overview and
  the live theme generator. The theme panel runs from `file://` in every engine (`styleguide/theme-generator.js`, a
  generated classic script). The 2.x sections move to `legacy.html` until the last port. The `Components` tile counts
  the generated registry.
- **Harness:** the fixture route `component.html?c=<name>` mounts a demo through `sg-core.js`.

### Wave 0: icons, core, theme generator, bundle; the integration (3.0.0-alpha.1)

The four other branches of wave 0, merged into `next` after the restructure, and the work that joins them. What the
CSS does is still that of 2.1.3: the one rule that changed place (below) cannot change a cascade.

- **Icons: 275 glyphs** (166 new) in `js/icons.js` for the 3.0 catalogue: files, charts, editing, status, people,
  devices, time, navigation, AI and chat, commerce and admin. Taken from Lucide (ISC, already in `LICENSE`):
  0.460 first, so the new file, calendar and chat glyphs share the outlines of the old ones, 1.67 where 0.460 lacks
  a glyph; lines become paths, `donutChart` is drawn for the set. `docs/icons.md` lists every glyph once.
- **`js/core.js`, `DS.core`:** the first module, which every other imports from. One runtime per page
  (`DashboardStyle.runtime`, made by whichever copy loads first, of any version), `define(name, spec)`,
  `init(root, { observe })` with one `MutationObserver` per root (batched to a microtask; a keyed move keeps its
  controller), `get`, `destroy`, `emit` (bubbling `ds:<type>` events), `config({ locale, strings })` and `t()`. The
  overlay stack, the scroll lock, the action guard and the ripple delegation live in the runtime, so two copies or
  bundles share them; `init()` always installs the guard and the ripple. [docs/core.md](docs/core.md).
- **`DS.init`, `DS.get`, `DS.define`, `DS.config`** at the top level of `window.DS` (`ds.js` and every classic
  bundle): `DS.core`'s functions, typed in `ds.d.ts`.
- **`ds.js` merges instead of returning early.** It is written by `tools/js-wrap.mjs` (the wrapper the bundle tool
  uses), in merge mode: a later `ds.js` or bundle of the same version adds the modules the page lacks, and the
  exports a module on the page lacks (a frozen copy), by name; a module the page has in full is not made again;
  `window.DS` and the version warning stay the first copy's. 2.x returned at once.
- **Theme generator:** `tools/theme.mjs` turns one seed colour (plus optional neutral, accent and status seeds, a
  scheme `tonal`, `vibrant`, `neutral`, `fidelity` or `monochrome`, and a contrast level) into one `.ds-theme`
  file with every colour role of `themes/dark.css` as `light-dark(<light>, <dark>)`, checked against every pair in
  both schemes (a failing seed moves tones, never the pairs). `--ds-color-scheme: light dark`; `data-ds-scheme="light"`
  or `"dark"` pins a region. `tools/color.mjs` is a dependency-free port of Material Color Utilities' HCT
  (Apache-2.0, notice in `LICENSE`). [docs/theme-generator.md](docs/theme-generator.md).
- **Presets** in `themes/presets/` (shipped in `dist/themes/presets/`): `default` (the 2.x palette), `slate`,
  `ocean`, `forest`, `violet`, `amber`, `rose`, `graphite`, each with a `-contrast` file. Generated; never edit them.
- **`check-theme.mjs` reads `light-dark()`**: every pair in each scheme the theme shows (those its
  `--ds-color-scheme` names; a variant pinned to dark, dark only), each finding with its scheme. So does the
  styleguide's theme check.
- **Project bundle:** `tools/bundle.mjs --config ds.config.json` scans a project as plain text (complete `ds-*`
  classes, `data-ds-*` attributes, `DS.<module>.<export>`, imports, icon names; a name built at run time fails with
  its file and line unless the safelist covers it), resolves what they need and writes `ds.bundle.css`,
  `ds.bundle.js` (classic with only the glyphs used, or an ES entry), the report `ds.bundle.json` and
  `properties.css`; `--check` fails a stale bundle, `entries` writes one set per entry. `tools/vite-plugin.mjs` runs
  the same scan in Vite. [docs/bundle.md](docs/bundle.md).
- **`manifest.json` `js.<module>`** gains `requires` (the components a module always needs: its own, from the
  `meta.json` `js` arrays) and `exportRequires` (per export, the components whose markup it writes itself:
  `DS.overlay.confirm` needs the dialog, the button and the spinner), from `src/js/<module>.requires.json`; the
  bundle tool resolves both.
- **`css/core/global.css`**, a new core stylesheet: the rules for every element inside `.ds-theme`, so every
  bundle carries them. Border-box sizing moves there from `utilities.css`, the forced-colours icon colour
  (`.ds-theme svg`) from `shell.css`. `ds.css` inlines it right before the first component, where border-box stood;
  the icon colour is the only `!important` colour declaration of `ds.css`, so its earlier place in the layer
  decides nothing (tested). A page that links single files adds `css/core/global.css` after `css/core/base.css`.

### Wave 0: restructure (3.0.0-alpha.0)

The repository moves to the 3.0 layout and the generated-registry model. What the CSS does is unchanged: apart from
file markers and comments, `ds.css` gains one statement (the reserved sublayers, below), and a comparison of the
computed styles of every element (and its `::before` and `::after`) of the styleguide, the Motion Lab and the
reference app against 2.1.3 found no difference. `ds.min.css` renders the same as `ds.css` in all three engines
(`test/browser/minified.spec.js`).

- **Layout.** `src/tokens.css`, `src/base.css` and `src/motion.css` moved to `src/core/`. Every component is a
  folder, `src/components/<name>/`, holding `<name>.css`, `meta.json`, its section of the docs (`<name>.md`) and,
  where split, its styleguide demo (`<name>.demo.js`).
- **`meta.json`** per component: `name`, `group`, `order` (the cascade order), `docsOrder`, `classes`,
  `attributes`, `requires` (what the component needs, which a bundle resolves), `context` (components it only
  styles where both meet, never pulled in), `hooks`, `keyframes`, `js`, `progressive` and `ripple`. Written once by
  `scripts/gen-meta.mjs`, maintained by hand; the build checks each against its stylesheet and stops with the
  reason on a mismatch.
- **Generated:** `src/index.css` (from `order`), `docs/components.md` (from the partials in
  `src/components/_partials/` and every `<name>.md`; byte for byte the 2.1.3 file) and `styleguide/demos.js` (the
  demos as `window.SG_DEMOS`, a classic script, so the styleguide still works from disk; the Charts section is the
  first one split). `npm run build -- --check` covers them.
- **dist/ paths:** the single stylesheets are now `css/core/{tokens,base,motion}.css` and
  `css/components/<name>.css` (2.x: `css/tokens.css` ...). Every file of `dist/css/` carries the layer statement and
  the sublayer statement, so a subset loads in the right order.
- **Sublayers, reserved.** `src/index.css` declares `ds.components.<name>` for every component, in cascade order.
  The components do not use them yet: moving them in would change the cascade, because 2.x lets an earlier
  component's heavier rule beat a later one's `:where()` default in several places that form cycles (the ripple
  host's position, card spacing against the lists, a link button's hover inside an alert). Each component moves
  into its sublayer when it is ported.
- **Minified builds:** `ds.min.css` (lightningcss, at the floor Safari 17.5, Chrome 123, Firefox 130, lowering and
  prefixing nothing) and a `.min.css` next to every stylesheet of `css/`, each with a source map; `ds.min.js`
  (comments and indentation stripped, nothing renamed). lightningcss is a pinned devDependency of the build:
  `npm ci` before `npm run build` or `npm test`; `dist/` and the tools stay dependency-free.
- **`dist/manifest.json`:** the layer statements, the core stylesheets and their classes (`pseudo`), the component
  order, per component its files, group, requires, context, classes, attributes, keyframes, js, hooks and sizes
  (`bytes`, `gzip` of its `.min.css`), and the JS modules with their imports and exports.
- **Version banner** on every CSS, JS, MJS, `.d.ts` and shell file of `dist/`, the themes and tools included.
- **Tools:** `check-project.mjs` knows the new paths (`.ds-theme` needs `css/core/tokens.css`) and accepts the
  `.min.css` of a stylesheet as that stylesheet.

## 2.2.0

One new glyph. Nothing else changed; no migration is required.

### Added

- **`userOff`**, a person struck through: an account or a person that cannot be used now (signed out, locked, at
  its usage limit). It is `user` cut by the slash of `micOff`, `eyeOff` and `wifiOff`. 110 glyphs.

## 2.1.3

Performance. No class, token, hook or export changed, and nothing looks or moves differently; no migration is
required.

### Fixed

- **A FLIP that brings and takes many items recalculates style a few times, not several times per item.**
  `DS.motion.flip()` read the page between its own writes: a removed item's display, then the container's borders
  and scroll, before each item it lifted out of flow; each moving item's position before raising it, and the
  backdrop after the first; the travel tokens for every glide; an entering or leaving item's animations around its
  classes. Each of those reads made the browser recalculate style (and often layout) for the whole page again, which
  on a page with many `:has()` rules and a slow phone was most of what a live list cost. Every read now comes before
  the writes it would have followed: `measure()` keeps each item's display with its rect, the container's box is
  read once per FLIP, the positions, the backdrop and the two travel tokens once before the glides start, and the
  items that come and go play their entrance and exit as one batch of reads and writes (the same classes, the same
  handoffs, the same promises as `enter()` and `leave()` for each). Ten items that go and ten that come took 105 to
  145 style and layout passes in Chromium; now 9 (`test/browser/flip.spec.js`).

## 2.1.2

Fixes found on real Android phones. No class, token, hook or export changed; no migration is required. A project
that panned the page back or took the lost bottom inset off its frame itself can drop that.

### Fixed

- **The page goes back when the visual viewport was panned down under the keyboard.** Chrome on Android shrinks only
  the visual viewport for the keyboard: the layout viewport keeps the whole window, so under a frame sized by
  `--ds-viewport-height` lies a keyboard's height of empty page. Anything scrolled into view (`scrollIntoView()`, a
  focus) panned the visual viewport down into it (`visualViewport.offsetTop` 206.9 with `window.scrollY` 0 on a
  Pixel 9, Android 16, Chrome 152; 114.8 on a Galaxy Tab S9), and the frame stood half above the screen until the
  keyboard went: `followViewport()` only scrolled the window back, which moves nothing there. While a field has the
  keyboard and the page is not zoomed, it now pans the visual viewport back to the top (an element at the top
  scrolled into view, `behavior: "instant"`); a window scrolled up (iOS) scrolls back as before.
- **A bar at the frame's foot stays above the keyboard with `viewport-fit=cover`.** Chrome on Android draws such a
  page edge to edge, under the gesture bar (`env(safe-area-inset-bottom)` 24px on a Pixel 9). With the keyboard up it
  reads that inset as 0, yet its visual viewport still ends where the inset began: 460.6px tall while the keyboard's
  top edge is at 436.6px, so the bottom 24px of the frame (a composer, a key bar) and of the snackbars, dialogs and
  sheets that keep clear of `--ds-keyboard-inset` lay under the keys. `followViewport()` now reads the inset off a
  hidden probe in `<body>` (`data-ds-keep`, so morphs leave it), remembers it while the viewport is full height and
  no field has the focus, and while the keyboard is up and the inset reads 0 takes it off `--ds-viewport-height` and
  adds it to `--ds-keyboard-inset` (Pixel 9: 437px and 364px, the frame's foot at the keyboard's edge). Without
  `viewport-fit=cover` the inset is 0 and nothing changes; iOS keeps its inset under the keyboard (an iPhone 15 on
  its side: 20px with and without the keyboard), so nothing changes there either.

## 2.1.1

Fixes found on real devices. No class, token, hook or export changed; no migration is required. Interactive table
rows are now stacking contexts (see the first entry): check a page that places its own `position: fixed` element
inside such a row. Dialogs and side sheets now keep clear of the on-screen keyboard: a project rule that lifted them
itself can go.

### Fixed

- **An interactive table row is its link's box in WebKit too.** macOS Safari (26) computes a `<tr>` as
  `position: static` whatever the stylesheet says, so every row's `.ds-table__row-link::after` stretched over the
  nearest positioned box around the table (the `.ds-table-wrap`): the last row's link lay over every row and took
  each click, the hover, the status bar URL, a middle or ⌘-click and WebDriver's element clicks ("click
  intercepted"); a focused link's ring went round the whole table. Every body row of an interactive table now gets an
  identity transform (`transform: translateX(0)`), which WebKit honours as the containing block, so each link covers
  exactly its row in every engine, the row's other controls stay above it and a pinned cell still confines it. A row
  is therefore a stacking context and the box of `position: fixed` descendants; while it holds a `.ds-menu` or
  `.ds-combo__popup` that the script places (no popover or anchor positioning) the transform is dropped, so that
  popup stays unclipped and above the rows below. WebKit gives such a box the table's height below the row's top:
  the rows below, painted above it, still take their own clicks (also a row without a link), the last row's area
  ends at the wrapper, and a focused row clips what it holds to itself (`clip-path: inset(0)`), so there its ring
  shows on the top and the sides only. `DS.ripple.attach()` now ripples
  such rows in Safari (it skipped a row that computes `static`; a transformed host counts as positioned) and gives
  a row's ripple box the row's height. A project that worked around the stale hit area (rerouting a row click by
  its coordinates) can drop that.
- **Escape closes a menu even while a tooltip shows under it.** A tooltip took the first Escape whenever it was
  visible, so with a menu open from a toolbar the tip of its opener (the pointer back on the button) or of a
  neighbouring button needed one Escape and the menu a second. A tooltip now keeps the key only when no open layer
  lies over its trigger (a trigger inside the topmost dialog or menu, as before); otherwise the same Escape hides it
  and closes the layer. The opener of an open layer shows no tooltip at all while that layer is open. The shared
  Escape order records each layer's opener (`opener()`), so copies of ds.js from 2.1.1 on see each other's.
- **Dialogs and side sheets above the on-screen keyboard.** A phone's keyboard shortens only the visual viewport, and
  a dialog was centred in the whole window, so with its field focused its buttons sat under the keys (a 801px window
  with the keyboard from 461px: the buttons at 435-483px) and a tap meant for them reached the keyboard. With
  `DS.dom.followViewport()` on the page every dialog now keeps clear of `--ds-keyboard-inset`: a centred box centres
  in the window above the keyboard, a full-screen box (`--full`, and `--full-narrow` on phones) and a side sheet's
  panel end at its top edge, the action sheet (`--bottom`) sits on it and a contained box sticks above it. The scrim
  keeps covering the whole window; a box taller than the room scrolls its body. Without `followViewport()` (or with
  the keyboard down, 0px) nothing moves.
- **No keyboard ring after a tap on an overlay opened a moment later.** `DS.overlay` takes back the ring WebKit puts
  on what it focuses after a pointer press (`focus({ focusVisible: false })`), but only when it ran inside the press's
  own event: a dialog opened once an action sheet's exit settled (a delete confirmation from one of its items), after
  a fetch or a timer showed the ring on its first button after real taps on an iPhone. `DS.overlay` now remembers
  each document's last input (a `pointerdown` or `mousedown`, or a key other than a modifier; capture listeners
  installed by `DS.ripple.attach()`, the first `open()` or `tooltips()`, shared by every copy of ds.js under
  `Symbol.for('ds.input')`) and, outside any input event, a press decides as one inside
  it would. Focusing into a layer and giving focus back on close follow the same rule, for div overlays and menus
  too. A key press still keeps the engine's ring.

## 2.1.0

Fixes and small additions from the first projects on 2.0. Additive: no class, token, hook or export was removed or
renamed; `DS.overlay.prompt()` and `DS.dom.dropzone()` take new options, `DS.icons.fill()` reads a new attribute,
and there are two new hooks and one new page-set attribute. No migration is required. A few looks move to where the
docs already put them (check your pages and screenshots): a text button that ends a page head moves 12px into the
gutter, a `.ds-btn--adaptive` outside a `.ds-content` now folds in a window of 600px or less, a 16px icon leading a
meta line moves onto its text line, and switch rows with a hint, phone tables in cards and wrapped card heads move
by a few pixels. A page that links `table.css` but not `button.css` and uses `.ds-link-btn` now links `button.css`
too.

### Added

- `DS.overlay.prompt({ input })` takes `spellcheck` (a boolean, written as `"true"` or `"false"`), `autocapitalize`,
  `autocorrect` and `enterkeyhint` (strings, written as the attributes of the same name), so a path or a code field
  turns spellcheck, capitals and autocorrect off and labels Enter without patching the built field from a `ds-open`
  listener. Absent, nothing is written, as before. Declared in `js/overlay.d.ts`.
- `data-ds-toast-room="off"` (page-set) on a `.ds-view`, `.ds-sheet__body` or `.ds-dialog`: that layer keeps no room
  for snackbars that stay (no `data-toast-reserve`, no padding, nothing scrolled clear), while the other layers keep
  theirs, so a fixed view that must not shrink (a terminal that refits) no longer needs `reserve: false` on every
  message, which also cost the dialogs opened later their room. Read at every measure: setting or removing it applies
  on the next change of the stack. A row in the Attributes table of `docs/components.md`.
- A `.ds-drawer__list` longer than the drawer shades each cut edge that has more to show, as a menu does: a sticky
  shade of the drawer's surface (`--ds-backdrop`), `--ds-scroll-fade` long (`0px` turns it off), above the items and
  the pill, taking no room. Scroll timelines drive it; elsewhere `DS.dom.scrollEdges(list, { axis: 'block' })`,
  which the page calls once (the styleguide, the live tour and the reference app now do): its first measure shows
  the shades at once, later changes fade them over `--ds-dur-fast`, so nothing moves on load. An item focused by the
  keys lands clear of the shades, focus ring and all (`scroll-padding-block`, `--ds-scroll-fade` long), and so does
  the current item that `createIndicator(list, { reveal: true })` scrolls into view: `reveal` now keeps a track's
  `scroll-padding` at each edge where it is larger than `--ds-space-2`. The list's block padding
  moved into the two shades, so its rows keep `--ds-space-1` above and `--ds-space-6` below them and nothing moves;
  a project rule that set the list's `padding` shorthand now adds its block padding to the shades' room. Hidden in
  forced colours. Screenshots of drawers with a list longer than the window change.
- `DS.icons.fill()` reads `data-icon-place="start"` or `"end"`: the glyph goes in as the first or last child and the
  element's content stays, so a labelled control written as markup
  (`<button class="ds-btn" data-icon="plus" data-icon-size="18" data-icon-place="start">Add</button>`) gets its
  leading icon where the component rules read it (`> svg:first-child`). Idempotent as before: the same name and size
  draw nothing, a new name or size replaces only that `<svg>` where it stands, a placed glyph that went missing is put
  back. Without the attribute the glyph replaces the content, as before. A row in the Attributes table of
  `docs/components.md`. The reference app draws its static icons this way instead of its own loop.
- `DS.dom.dropzone(zone, { input })` names the file input whose picks go to `onFiles` (absent: the zone's
  `.ds-dropzone__input`, else its first `input[type="file"]`, as before), or `input: null` for none: a page drop
  target (a chat pane) whose composer has its own attach button, whose picks the page already handles, takes drops
  and paste only, instead of handing that input's picks to `onFiles` a second time. Declared in `js/dom.d.ts`.
- A 16px icon leading a meta line (the first child of `.ds-meta` or `.ds-timeline__meta`: a source, a clock) sits on
  its text line, `--ds-space-1` before the text, and the line keeps its 16px; it stood on the baseline, 3-4px above
  the text's centre, touching the text and growing the line by 4px. A project rule or `ds-check.json` exception that
  aligned such an icon can go.
- Hook `--ds-empty-disc-size` (48px), the width and height of `.ds-empty__disc`, so a confirmation page
  (`.ds-empty--done`, a request sent) can show a larger disc than an empty table; the ring follows, the glyph keeps
  the size of its markup. In `docs/theming.md` and `themes/example.css`.
- Hook `--ds-form-actions-bleed`, how far a `.ds-form-actions--sticky` bar bleeds on a phone (default
  `--ds-content-pad-x`, in a `.ds-card` `--ds-card-pad`, as before): set on a padded container of the page's own (a
  project card, a sheet section) to its inline padding, the bar meets that container's edges instead of stopping
  short of them. It inherits, so it goes on the nearest container the bar runs through. In `docs/theming.md` and
  `themes/example.css`.

### Changed

- Docs: `ds-close` bubbles, so a listener on an overlay also hears the dialogs, menus and combobox lists inside it (a
  confirmation opened from a side sheet closes, and the sheet's listener runs). `docs/motion.md` and the Dialog
  section of `docs/components.md` say so, and the example checks `event.target === dialog`; a project listener that
  reacts to a reason without that check should add it. The styleguide's busy-dialog demo checks it too.
- Docs: Tiles on phones. The default `--ds-tile-min-width` (176px) stays and gives one tile per row on a phone, so a
  long value fits whole; `docs/components.md` (Tiles) and `docs/theming.md` now say that
  `--ds-tile-min-width: 128px` on the `.ds-tiles` or in the theme keeps two per row down to a 360px phone. The open
  row in `plans/after-2.0.md` is closed with that decision.
- Docs: `docs/components.md`, Combobox, "Open and close": keep the field focused while an option is pressed by
  cancelling `mousedown` on the list (and the toggle), never `pointerdown`.
- `.ds-link-btn` is defined in `css/components/button.css` (its base rule, hover, press and focus ring moved
  unchanged from `table.css`), so a page that links single stylesheets no longer needs `table.css` for it: a quiet
  link button without `table.css` kept the browser's button padding, border and fill. Nothing changes in `ds.css`.
  A page that links `table.css` but not `button.css` and uses `.ds-link-btn` now links `button.css` too;
  `tools/check-project.mjs` (rule `classes`) names it.

### Fixed

- A top-bar brand of only a name (no mark) now starts its text on the docked drawer's icon edge, as documented. The
  rule nested a `:has()` inside a `:has()`, which every engine rejects, so it never applied; it now matches the name
  as the brand's only child. A unit test fails on any `:has()` inside a `:has()` argument in `src/`.
- A switch with a hint and the rows of `.ds-switch-list` stand the name directly on its hint (the switch's 12px gap
  stood between them) and centre the text on the track whatever rows are empty: a row without a hint no longer sits
  8px above the track's centre (12px in the narrow list), nor does a wrapped name. In the narrow list (560px and
  below) the meta sits under the hint with `--ds-space-1` above it. Switch list screenshots change.
- An account capsule without a shown sign-out button (none in the markup, or `hidden`) ends with the room it starts
  with: `--ds-space-4` after the text instead of 4px, and a round capsule around the avatar below 720px.
- A `.ds-drawer__row` item keeps room for its action at the action's size (`--ds-btn-sm-icon-size`, the hook the
  small icon button reads), so a long label no longer runs under the 48px action under `.ds-touch`; 40px as before
  without it.
- In a card, the last table column still shown keeps the card's gutter at its end when trailing
  `.ds-col--secondary` columns drop (on phones, and in a `.ds-table--wide` when the content area is narrow); it kept
  the cell padding (12px on phones) against the fade and the card edge. Phone table screenshots with trailing
  secondary columns change.
- In `.ds-grid-2`, the tallest card with a `.ds-card__links` row keeps 16px between its content and the link row's
  hairline (the auto margin that lines the link rows up left none there); shorter cards still line their link rows
  up at the bottom.
- A status chip, badge or tag in `.ds-card__row` sits on the title line instead of overhanging it like a 36px
  button, so on a wrapped head row (phones) it keeps the card's 16px to the block below (it hung 6px into it); a
  `.ds-chip` overhangs by its own height (`--ds-chip-height`). On one line nothing moves. Phone screenshots of card
  heads that wrap change.
- `.ds-btn--adaptive` outside a content panel (the top bar, a `.ds-vt-view` page, any page without a `.ds-content`
  around the button) folds its label in a window of 600px or less, as sheets and dialogs already did; it never folded
  there. Inside a `.ds-content` the panel's width still decides. A project that set `container: ds-content` on an
  element of its own (not `.ds-content`) now folds by the window there too.
- `DS.motion.flip()`'s `refocus` finds the twin of the old focus again when the system had put a state class on it
  for a moment (`ds-pressed` of `DS.ripple`, `ds-btn--done` of `busy()`, the `ds-enter*` / `ds-leave*` classes): a
  "Remove" pressed by mouse or Enter moves focus to the next row's "Remove", no longer to the row's first field. A
  twin in an item before the removed one now wins over a different control that comes next: removing the last chip of
  a row focuses the chip before it, not the "Clear filters" after it. Twins are searched by distance (the next item,
  the previous one, the second next, the second previous ..., counting only items with something to focus, so a day
  heading is still passed over), so a twin next door always wins over one further down: when the rows after the
  removed one have no "Remove" (locked rows), focus goes to the row before it, never to a "Remove" far below and off
  screen. With no twin left, focus goes
  to the next item's first focusable element as before.
- `DS.dom.autosize()` called before the textarea is in the page (or while it is hidden) no longer writes
  `height: 0px`, which stuck: on a `.ds-input--grow` field where the browser sizes it (`field-sizing: content`) the
  stale height kept it at one row, elsewhere it stayed at 0 until the first input. It measures once the field is
  rendered and again when its width changes (a `ResizeObserver`, so a narrower window that wraps more lines grows it
  too), and drops a height it wrote before where the browser takes over.
- `DS.overlay.toastRegion()` on a page with the theme on `<html>` and no `.ds-app` (a sign-in page) creates the
  snackbar region as the last child of `<body>`; it appended it to `<html>`, after `<body>`. The same mapping as the
  promise dialogs; `toast(null, ...)`, `announce()` and `savebar()` follow.
- `DS.dom.scrollEdges()` watches every child of the scroller, not only the first (a `MutationObserver` adds the
  children that come and drops the ones that go), so a list that grows or shrinks by rows (a drawer list, whose first
  child is its absolute `.ds-indicator`, a menu-like list) updates `data-ds-overflow-start` / `-end` without a
  scroll; a list that filled up showed no end edge until it was scrolled.
- `DS.dom.followViewport()` counts a field focused inside a same-origin `<iframe>` (an embedded editor) as editing,
  through the frame's open shadow roots too, so `data-ds-keyboard` and `--ds-keyboard-inset` come with the keyboard
  there as well (`.ds-app--keyboard-hides-bar` hides the bar, snackbars stay above the keyboard). A cross-origin
  frame's focus is unknown and still does not count.
- The combobox of the live tour and of the reference app keeps the field focused by cancelling `mousedown` on the
  list instead of `pointerdown`, which in WebKit swallowed the click of a tap: an option tapped on a phone chose
  nothing and the list stayed open.
- A text button (`.ds-btn--text`) in `.ds-page-head__actions` hangs its padding into the gutter, as in a card's link
  row: the last one's text ends on the content edge the title, the cards and the banners share (it stood 12px
  inside), and under the title (600px of the content) a text button that comes first starts its text on the title's
  edge. Outlined and filled buttons keep their place, and so do the buttons after the first under the title, 8px
  apart as on a wide page (a "Cancel" before a "Save" keeps its 20px from text to button), and a `.ds-btn--adaptive`
  while it is folded into a round icon button. A page whose head ends in a text button, or starts with one under the
  title, moves it by 12px; a project exception for it can go.

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
| recipe (deprecated, still works) | the page writes `data-scrolled` from its own `IntersectionObserver` on a sentinel (the 1.x App frame snippet) | `DS.dom.watchScrolled(view)` | delete the observer, the sentinel and the page's own `watchScrolled` function, and call `DS.dom.watchScrolled(view)` once; `tools/check-project.mjs` warns on the write | `(setAttribute\|toggleAttribute)\(\s*['"`]data-scrolled\|\.dataset\.scrolled\s*=` |
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
  a page's own watch or sentinel recipe for them. Left in place it still works (a second sentinel), but the hand
  recipe is deprecated: `tools/check-project.mjs` warns on its `data-scrolled` write (Migration, above).
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
  `morphChildren()`, `morphHtml()` and `flip()`; `DS.dom.watchScrolled()` (on a `.ds-dialog__body` it also writes
  `data-ds-text` while bare text stands in it, so a body of text and the sentinel is not hidden as empty), `scrollEdges()`, `progress()` (a share and
  its ARIA in one call), `roving()` (one tab stop for a set), `followViewport()` (the frame follows the on-screen
  keyboard), `followEnd()` (a log that sticks to its end), `autosize()`, `dropzone()`; `.ds-presence--keep`
  (`data-ds-shown`), `.ds-vt-view` (a view-transition target outside the frame), `.ds-swap--fade` (`--ds-swap-fade`);
  the `DS.ripple.attach()` handle's `release()` and `destroy()` (a press also ends when another element captures the
  pointer).
- Drag, drop and files (`drag.css`): `.ds-grip`, the `[data-ds-dragging]` row, the styled `.ds-input[type="file"]`,
  `.ds-dropzone` with `__input`, `__disc`, `__title`, `__idle`, `__over`, `__browse`, `__hint`,
  `--ds-dropzone-border`, and `[data-ds-dragover]` on any page drop target.
- Loading: `--ds-skeleton-radius`, `.ds-skeleton__note`, `.ds-loading__detail` (with detail lines `.ds-loading`
  becomes a two-column grid; without them it stays the one-row flex line of 1.x).
- Tables and scrollers: `.ds-table--stack` and `--stack-wide` (each row a block, each cell's `data-label` above its
  value; always in sheets and dialogs, in a view at a content area of at most 600px / 840px), `.ds-table-wrap--fill`
  (a full-page table with a sticky header and cut cells), `.ds-table--pin-first` (a pinned first column, in a
  fill wrapper or a card: keyboard focus stays clear of it, and its wrapper fades only at the end;
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
  project rules of AGENTS.md on a project, configured by `ds-check.json`, exceptions with reasons; a page that links
  single stylesheets needs one that defines each class it uses, and `linear` passes on a `--ds-loop-*` loop).
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
- The hand `data-scrolled` recipe of 1.x (a page's own `IntersectionObserver` on a sentinel writes
  `data-scrolled`): use `DS.dom.watchScrolled(view)`.
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
