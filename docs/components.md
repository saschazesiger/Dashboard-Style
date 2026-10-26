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
| Page title, lead and the column layout of cards | [Page](#page): `.ds-page-head`, `.ds-stack` (one column), `.ds-grid-2` (two) |
| A block of related content | [Card](#card) `.ds-card`; a quieter block inside one: `.ds-card--filled` |
| A whole card opens something (a device, a report) | `.ds-card--interactive` on `<a>` or `<button>`, or on a `<div>` with a `.ds-card__action` link ([Card](#card)) |
| Any action | [Button](#button) `.ds-btn` with one variant; an action inside text or a table cell: `.ds-link-btn` |
| A view option that stays on or off (filter, compact view) | `.ds-btn--quiet` with `aria-pressed` ([Button](#button)) |
| A save that takes a moment, with a success moment after it | `.ds-btn__faces` and `DS.motion.busy()` ([Button](#button)) |
| An icon that turns into another (copy to check, play to pause) | `.ds-icon-swap`, `DS.motion.crossfade(el, icon, { kind: 'icon' })` ([Button](#button)) |
| Key figures at the top of a page | [Tiles](#tiles) `.ds-tiles`, `.ds-tile` |
| Label and value pairs | `.ds-kv-list` (rows) or `.ds-facts` (a grid, best with four) ([Lists](#lists)) |
| A run of short counts ("3 new · 1 updated") | `.ds-parts` ([Lists](#lists)) |
| Nothing to show yet | [Empty state](#empty-state) `.ds-empty` |
| The state of one item (synced, failed, running) | [Status chip](#status-chip) `.ds-status` |
| A message about a page or section that stays | [Alert](#alert) `.ds-alert`; a list of errors to open: `.ds-errors` |
| Short feedback after an action | [Snackbar](#snackbar) `.ds-toast` in `.ds-toasts` |
| Records in rows and columns | [Table](#table) `.ds-table` in `.ds-table-wrap` |
| Rows that open their record | `.ds-table--interactive` with a `.ds-table__row-link` per row ([Table](#table)) |
| Pick several rows for one action (bulk selection) | a checkbox in each row and in the header cell; the row takes the selection colour ([Table](#table)) |
| More about one row without leaving the table | an expandable row: `.ds-table__toggle` and a `.ds-table__detail` row ([Table](#table)) |
| Data entry | [Form](#form): `.ds-form`, `.ds-form-grid`, `.ds-field`, `.ds-input`, `.ds-form-actions` |
| One choice from a short list | `<select class="ds-input">`; with an explanation per option: `.ds-radios` ([Form](#form)) |
| One choice from a long list, by typing | [Combobox](#combobox) `.ds-combo` |
| A yes/no value saved with the form | `.ds-check` ([Form](#form)) |
| A checkbox without a label row (a table column, a list item) | `.ds-checkbox` ([Form](#form)); in a `.ds-table` any bare checkbox is drawn the same |
| A setting that applies at once | [Switch](#switch) `.ds-switch` |
| Search and filter a list | `.ds-toolbar` with `.ds-search`, `.ds-filters`, [Chips](#chips) `.ds-chips`; in one row: `.ds-action-bar` ([Form](#form)) |
| Actions for one item or a toolbar overflow | [Menu](#menu) `.ds-menu` |
| Confirm an action with consequences | [Dialog](#dialog) `.ds-dialog` |
| Details or editing of one record next to its list | [Side sheet](#side-sheet) `.ds-sheet` |
| Name an icon button, or say why a control is disabled | [Tooltip](#tooltip) `.ds-tooltip` |
| Waiting | [Loading](#loading): `.ds-loading` in a section, `.ds-skeleton` with `.ds-loadbar` for a page, `.ds-boot` at app start, `.ds-spinner--sm` in a busy button |
| A block of the page waits (a section, a sheet, the app start) against a small spot (a button, a chip, a cell) | the shape loader `.ds-loader` (in `.ds-boot`, `.ds-loading`) against the arc spinner `.ds-spinner` ([Loading](#loading)) |
| A long job with a known or unknown share | [Progress](#progress) `.ds-progress` (`--indeterminate`); round: `.ds-spinner--determinate` |
| Content that opens and closes | `<details class="ds-collapsible">` ([Motion classes](#motion-classes)) |
| Something new appearing, a view's first render | [Motion classes](#motion-classes) and `DS.motion` ([motion.md](motion.md)) |
| Press feedback from the pointer on every action | [Ripple](#ripple): `DS.ripple.attach(document)` once (`.ds-ripples`) |
| An icon | `DS.icons` ([icons.md](icons.md)); brand logos stay in the project |

Nothing fits? If any dashboard could use it, add it to Dashboard-Style ([AGENTS.md](../AGENTS.md#making-a-change))
and update the copy; otherwise build it in the project with the project's own class prefix, from the tokens only
([rules.md](rules.md#code)).

Contents: [App frame](#app-frame) · [Page](#page) · [Button](#button) · [Card](#card) · [Tiles](#tiles) ·
[Lists](#lists) · [Empty state](#empty-state) · [Status chip](#status-chip) · [Alert](#alert) · [Table](#table) ·
[Form](#form) · [Chips](#chips) · [Switch](#switch) · [Combobox](#combobox) · [Menu](#menu) · [Dialog](#dialog) ·
[Side sheet](#side-sheet) · [Snackbar](#snackbar) · [Tooltip](#tooltip) · [Loading](#loading) ·
[Progress](#progress) · [Ripple](#ripple) · [Utilities](#utilities) · [Motion classes](#motion-classes)

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
      <span class="ds-account__avatar" role="img" aria-label="Ada Lovelace, ada@example.org">A</span>
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

  A scrolled view whose content shrinks until it no longer scrolls leaves its scroll timeline inactive, and Chromium
  and WebKit then keep the tint and the hairline at their last value. `DS.motion.resyncScroll(scroller)` restarts
  them ([motion](motion.md#scroll-driven-effects)); `DS.motion.transition()` calls it after every update, and
  `watchScrolled()` when the view is back at its top.
- A drawer item may be a `<button class="ds-drawer__item">` when it shows a section in place instead of loading a
  page; it loses the browser's button look. The active one also carries `aria-current="page"`.
- `.ds-drawer__list--overflow`: set it when the list is taller than the window, so its scrollbar stays visible.
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
  `transition()` replaces (it never waits before the update). A page that keeps it swaps in this order, so the new
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
- Narrow windows: the account shows `.ds-account__avatar` (give it a tooltip with name and email) below 720px.
- Open and close the modal drawer with `DS.overlay.open(drawer, { opener: menu })` and `DS.overlay.close(drawer)`
  ([motion.md](motion.md#dsoverlay-jsoverlayjs)): it sets `data-drawer-open` and `aria-expanded`, makes the rest of
  the app inert (not the scrim), locks the scroll (`.ds-no-scroll` on `<body>`, counted), closes on Escape and a scrim
  click and gives focus back to the menu button; it acts only at 900px and below. By hand as before: toggle
  `data-drawer-open` and add `.ds-no-scroll` to `<body>` (with `.ds-base`) while the modal drawer is open.
- When the window crosses 900px the drawer changes between docked and modal in place: add `.ds-drawer--instant` to
  the drawer for two frames, so it neither slides nor fades its scrim, and close a modal drawer that the wider
  window no longer shows. `DS.overlay` does both by itself for every `.ds-app > .ds-drawer` of the page from load on
  (1.6.1), so a page that opens and closes the drawer through it needs nothing more; only a page that drives the
  drawer by hand uses this snippet:

  ```js
  const modal = matchMedia('(max-width: 900px)');
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
```

```js
await DS.motion.busy(saveButton, () => fetch(url, { method: 'POST', body }));   // busy, then "Saved" for a moment
DS.motion.crossfade(copySlot, DS.icons.icon(DS.icons.check, 20), { kind: 'icon' });  // copy to check
```

- Every action is a pill. One filled `--primary` per area; there are no red buttons (name the consequence:
  "Delete 3 devices").
- A leading icon pulls the start padding to 12px.
- A toggle that is on carries `aria-pressed="true"` and shows the tint (forced colors: the selection colours).
  Toggles in a track with a sliding indicator ([DS.indicator](motion.md), `.ds-has-indicator`) leave the tint to
  the pill (give it `--ds-accent`): the button stays clear, so only one pill shows while it travels, and its label
  changes colour on the pill's timing (`--ds-indicator-dur`).
- `aria-disabled="true"` looks disabled but stays focusable and hoverable, so a tooltip can say why. `disabled` and
  `aria-busy="true"` block the pointer. Blocked for every input (2.0): once `DS.motion.busy()` ran, or
  `DS.motion.guard()` was called once ([motion.md](motion.md#dsmotion-jsmotionjs)), a click, middle click, Enter,
  Space or form submission on a busy or done `.ds-btn`, or on any `aria-disabled="true"` action inside `.ds-theme`,
  never reaches your listeners: no page guard needed. A control that must explain itself on click gets
  `data-ds-guard="off"`.
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
  that showed for the loader minimum and the success face for `--ds-hold-success`. Announce the result yourself
  (`aria-live`, a snackbar). `.ds-btn__swap` (one face the page swaps in) is **deprecated** (removed in 2.0): use
  the faces.
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

Children of a card are 16px apart; a button or switch in `.ds-card__row` overhangs the title line so all card titles
start at the same height. Cards in `.ds-grid-2` share their height and line up their `.ds-card__links`. Padding:
the `--ds-card-padding*` hooks ([theming.md](theming.md#component-hooks)).

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
- In forced colours every interactive card keeps a visible edge (`.ds-card--filled` included) and the focus ring.

**Motion:** the press morph of [Controls](motion.md#controls) (`.ds-card--interactive`) and the "Alert, tile, card" row of [Feedback](motion.md#feedback).

## Tiles

```html
<div class="ds-tiles">
  <div class="ds-tile">
    <p class="ds-tile__label">[icon alert 16]<span>Overdue</span></p>
    <p class="ds-tile__value">12</p>
    <p class="ds-tile__note">3 more than last week</p>
  </div>
  ... (four per row, two below 1100px)
</div>
```

`DS.motion.countUp()` never takes the target from the markup. It counts from the figure it last wrote (or one a
re-render wrote since, read back through `format`), and on its first call from 0. So keep the raw value in your own
state (the styleguide demo keeps it in a data attribute of its own), and pass `{ from: <the value in the markup> }`
on the first update of a tile rendered with its figure if it should count on rather than from 0.

The value never takes a colour and never wraps (it shrinks on narrow tiles). Every new value goes through
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
layer and does not morph; an `aria-disabled` tile keeps its focus layer.

**Motion:** the "Alert, tile, card" row of [Feedback](motion.md#feedback) (`countUp()`, the press morph) in motion.md.

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

**Motion:** the "Status chip" row of [Feedback](motion.md#feedback) in motion.md.

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
  phones. `.ds-table--wide` also drops secondary columns when the page is narrow (next to the drawer).
- Sortable columns: a `.ds-table__sort` button in the header cell and `aria-sort` on the cell; the arrow shows at the
  sorted column only; every sort button keeps room for it (1.6.1), so moving the sort never shifts the columns. In a
  `.ds-num` column the arrow leads. Render the same up arrow for both directions and mark
  it `.ds-table__sort-arrow`: `aria-sort="descending"` turns it 180deg on the spring (when the header is patched in
  place by `morphHtml`). An arrow without the marker is never turned, so a page that renders `arrowDown` for a
  descending column keeps showing it as drawn.
- Short values that must not break (an ID with a hyphen) take `.ds-nowrap`.
- A table that scrolls sideways in a card (on phones, or `.ds-table--wide` in a narrow content area) fades at the
  card's right edge while columns follow. Where scroll timelines exist (progressive: `animation-timeline`) the fades
  follow the scroll position: the right fade goes over the last 5% of the travel, a left fade grows over the first
  5% once the table has left its start, and a table that fits shows neither. `ds-edge-fade` drives the registered
  lengths `--ds-table-fade-start` and `--ds-table-fade-end` (internal, set nowhere else) on the wrapper's own scroll
  timeline. Elsewhere the static right fade stays. A table scrolled sideways that then fits (columns hidden, a
  filter, a wider window) keeps its last fade in Chromium and WebKit: call `DS.motion.resyncScroll(wrapper)` after
  such a change.
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
    <th scope="col"></th><th scope="col">Device</th><th scope="col">Status</th>
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
  takes the row's layers and holds the ripple like a `<td>`.
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
  horizontal padding and its own vertical room; put the content straight into it.

**Motion:** the "Table" row of [Feedback](motion.md#feedback) and [Data motion](motion.md#data-motion) in motion.md.

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
  while focused.
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
- Radio cards (`.ds-radio`) have a state layer and the ripple, and turn squarer while pressed
  (`--ds-radius-card-pressed`), springing back on release; keyboard focus rings the whole card and lays the focus
  layer (`--ds-state-focus`) at once (its input has no halo); `.ds-radio--disabled` and a card whose input is
  disabled have none.

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

**Motion:** the check, radio, focus and validation rows of [Controls](motion.md#controls) in motion.md.

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
  without it, or when a script sets `checked`, the chips jump to the new line. During the glide the row carries
  `data-ds-glide` and every `.ds-chip` an opaque backing in the colour behind the row (`--ds-chips-backdrop`, written
  by the script; `--ds-surface` without one), so a chip that crosses another never shows it through its body.
- Press: the state layer in `--ds-dur-micro` and the ripple. Chips are not pills, so they do not morph. Keyboard
  focus: the ring, solid from the first frame, snaps to its offset, with the focus layer.
- An `aria-disabled="true"` chip input is blocked by `DS.motion.guard()`: a click on the chip never changes it (no
  page guard needed).
- Disabled chips (`disabled` on the input or its `<fieldset>`) show no hover, press or ripple and the `not-allowed` cursor, and take
  the button's disabled model: the outline (selected: the container) in `--ds-disabled-fill`, label and check in
  `--ds-disabled-ink`, fading on `--ds-dur-fast`. A theme that dims instead (`--ds-disabled-opacity`) keeps the
  chip's own colours. Forced colours: GrayText.
- Hooks: `--ds-chip-height` (32px), `--ds-chip-check-size` (18px), `--ds-chip-disabled-border`,
  `--ds-chip-disabled-bg` (the container of a disabled selected chip).

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
title next to the switch already names the setting.

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
colours `SelectedItem`). `aria-expanded="true"` on the field turns the chevron 180deg on the spatial spring;
`DS.overlay` sets it. `data-open` on `.ds-combo` still turns it but is **deprecated** (removed in 2.0).

- **Open and close** with `DS.overlay` ([motion.md](motion.md#dsoverlay-jsoverlayjs)). The page filters and chooses:
  filtering never re-creates or re-hides the list, and when nothing matches the list keeps showing with the status
  line (`.ds-combo__list` `hidden`, the status says "No match") instead of closing. Closing on blur and on a choice
  is the page's script (`DS.overlay.close(popup)`).
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
trigger.addEventListener('click', () => {
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
  `.ds-menu__divider` separates groups.
- **Placement.** Below the trigger from its start edge, flipped towards the start edge when there is no room; above
  the trigger when it does not fit below and there is more room above; 112px to 280px wide, and never taller than the
  room on its side (it scrolls inside), so it never covers its trigger. Where popover and CSS anchor positioning
  exist the menu is a `popover="manual"` in the top layer, anchored to the trigger (`data-anchored`); elsewhere
  `DS.overlay` writes `--ds-menu-x` and `--ds-menu-y` (`position: fixed`, plus an inline `max-height` when it is
  capped), sets `data-placement="top"` above and follows scrolling and resizing.
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
`<div class="ds-dialog" hidden>`, with `role="alertdialog" aria-modal="true" aria-labelledby aria-describedby` on
`.ds-dialog__box`.

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

**Motion:** the "Scrim", "Dialog", "Nested dialog" and "Dialog on a phone" rows of [Overlays](motion.md#overlays) in motion.md.

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

Open and close it like the dialog, with `DS.overlay.open(sheet, { opener })` and `DS.overlay.close(sheet)`. The panel
is opaque throughout: it slides its full width in from the edge on the spatial spring (`--ds-dur-long`) while the
scrim fades, and goes back to the edge in `--ds-dur-base`, accelerating, without a fade. At 600px and below it rises
from the bottom and falls back down. A strip of the panel's background past its outer edge covers the spring's
overshoot, so the scrim never shows at the screen edge. By hand, close it like the dialog with `.ds-sheet--closing`
(`DS.motion.settled(panel)`, then hide and remove the class in one task): the panel lets clicks through while it
leaves, the backdrop swallows them until the sheet is hidden. The `hidden` attribute hides the div sheet without
`.ds-base` too. Set `data-scrolled` on the panel while the body is scrolled (the head's hairline appears) with
`DS.dom.watchScrolled(body)` (2.0): it writes the attribute on the `.ds-sheet__panel`, and its sentinel takes the
body's gap back by itself and stays through a record swap with `DS.dom.morphHtml(body, html)`. Where
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
```

What `toast()` builds from a string (or takes as it is, when you pass a `.ds-toast` element):

```html
<div class="ds-toast [ds-toast--error | ds-toast--info]">[icon checkCircle | alertCircle | info 20]<span class="ds-toast__text">Saved.</span>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close">[icon close 20]</button></div>
```

- Place the region right after `.ds-app`. It sits at the bottom left of the content panel: next to a persistent
  drawer by itself, full width on phones. If your panel starts elsewhere, set `--ds-toast-left` on the region to the
  panel's left edge plus 24px (`region.style.setProperty('--ds-toast-left', panel.getBoundingClientRect().left + 24 + 'px')`).
- **Stack.** At most three show at once (`TOAST_LIMIT`), the newest at the bottom; the others glide to their places
  (`DS.motion.flip()`) while a message rises in or fades out where it was. A fourth replaces the oldest message that
  would close by itself; when all three stay (errors, `persistent`), it waits and enters when one closes. `close()`
  on a waiting message takes it out of the queue.
- **Timer.** A message closes after `timeout` ms: by default 4s plus 50ms for each character past 40, at most 10s,
  all stretched by `--ds-time-scale`. Errors, `persistent: true` and messages with another button or a link (an
  action such as Undo) never close by themselves: the close button (`closeLabel`, default "Close") or your action
  does. The timers pause while a pointer is over a message, while focus is in the region and while the tab is
  hidden, and go on with the time they had left.
- **Focus.** A focused message that leaves hands focus to the next message's close button, else back to where focus
  came from into the region, else to the view (`.ds-view` with `tabindex="-1"`), never to `<body>`.
- **Screen readers.** The region and the messages are not live regions, so their buttons stay usable. On first use
  `toast()` adds two `.ds-sr` live regions next to the region (polite, and assertive for errors) and writes each
  message's text there.
- **Dialogs and side sheets.** While a dialog or side sheet is open (`DS.overlay.open()`), the regions of its theme
  (not one inside a nested `.ds-theme`, an embedded widget's: it stays in its widget) move into it, so a message shown meanwhile (an error from the dialog's action) is above the scrim, announced and
  usable: in the top layer of a native one, outside the inert page of the div markup. In a sheet the messages glide
  with the panel's edge (`data-follow="enter"` and `"exit"` time the glide like the sheet); in a dialog they keep
  their place. Closing brings them back: they glide to their place while still inside the leaving dialog or sheet
  (so they stay above its scrim and panel through the exit) and return to the page once it ended. The modal drawer leaves the regions and their announcers usable where they
  are. A region placed inside another element of the page (not next to `.ds-app`) is inert under a div dialog that
  does not take it in, so keep it in the documented place.
- **View transitions.** While `DS.motion.transition()` runs, a region with messages is its own group
  (`ds-toasts`, [motion.md](motion.md#view-transitions)): a message stays on screen and still above the changing
  view, and glides with the panel's edge when the view shows or hides the drawer. Keep one region with messages per
  page: `transition()` lifts the name of a further one, which then crossfades with the page.
- A bar pinned to the bottom edge (a save bar): set `--ds-toast-bottom` on the region to its height plus a gap while
  it shows, so messages stay above it.
- An error that stays until closed: give `.ds-view` (or `.ds-sheet__body`) `data-toast-reserve` and set
  `--ds-toast-reserve` to the message's height, so the last actions can scroll clear of it.
- `.ds-toast--info` uses the plain text colour for its icon, like `--error`.
- **Deprecated** (still working, removed in 2.0): the region `<div class="ds-toasts" role="status" aria-live="polite">`
  with `role="alert"` on error messages (on such a region `toast()` adds no announcers, so nothing is read twice);
  showing messages by hand with `setTimeout(() => DS.motion.leave(toast), 4000)`; and the hand recipe for moving
  messages into a side sheet: mark them `.ds-toast--shown`, set `--ds-toast-shift` and `--ds-toast-shift-y` to the
  offset from the old place with `transition: none`, force a style flush, then remove both.

**Motion:** the "Snackbar" row of [Overlays](motion.md#overlays) in motion.md.

## Tooltip

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">[icon link 20]</button>
```

```js
const tips = DS.overlay.tooltips(document);   // one call per page (or per root element or shadow root); tips.destroy() undoes it
```

`tooltips(root)` serves every `[data-tip]` inside `root` with one `<div class="ds-tooltip" role="tooltip">` that it
creates inside the `.ds-theme` (it warns once when `root` has none). A second call on the same root returns the first
handle; a trigger inside nested roots (a host page's `document` and a widget's root) is served by the innermost one:

- **Delay.** A mouse or pen that rests on a trigger shows the tooltip after `--ds-delay-tooltip` (500ms); keyboard
  focus (`:focus-visible`) shows it at once. Touch never shows one.
- **Warm-up.** While a tooltip is visible, or within `--ds-delay-tooltip-skip` (300ms) of the last hide, the next
  trigger shows at once: a visible tooltip swaps its text and place without leaving, a hidden one only fades in.
- **Hoverable and persistent** (WCAG 1.4.13). It hides `--ds-delay-tooltip-hide` (100ms) after the pointer or focus
  left the trigger; the pointer may cross onto the tooltip meanwhile, and it stays while the pointer is on it or the
  trigger keeps keyboard focus.
- **Dismissable.** Escape hides it, and only then is the key the tooltip's (an open dialog under it stays open). Any
  pointerdown, `DS.overlay.open()` and a trigger scrolled out of view hide it too.
- **Description.** While it shows, the trigger gets `aria-describedby` pointing at it, unless the trigger's accessible
  name already says the same (an icon button whose `aria-label` equals the tip is not described twice).
- **Placement.** Below the trigger and centred on it, above it when there is no room, 8px from the viewport edges.
  Where popover and CSS anchor positioning exist, the tooltip is a `popover="manual"` in the top layer, anchored to
  the trigger (`data-anchored`); elsewhere the script writes `--ds-tooltip-x` and `--ds-tooltip-y` and sets
  `data-placement="top"` above. It fades in and grows from `--ds-scale-tooltip` at the side of the trigger, and
  leaves with a quick fade.

Placing a `.ds-tooltip` yourself: set `--ds-tooltip-x` and `--ds-tooltip-y` (or `top` and `left`) on it, remove
`hidden` (the entrance plays) and hide it with `DS.motion.leave(tip, '', { then: 'hide' })`. A `transform` placement
composes with the entrance, but its scale shrinks the offset too, so the tooltip drifts in by (1 - scale) × offset;
a script that keeps a `transform: translate(Xpx, Ypx)` also sets `transform-origin: calc(50% + Xpx) calc(50% + Ypx)`.

**Motion:** the "Tooltip" and "Tooltip warm-up" rows of [Overlays](motion.md#overlays) in motion.md.

## Loading

```html
<!-- Block loader: the shape loader (M3 Expressive), 48px; --sm 24px; --contained on an --ds-accent disc -->
<div class="ds-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading ...</div>
<span class="ds-loader ds-loader--contained" aria-hidden="true"></span>

<!-- Inline spinner: the M3 arc, for buttons, chips, status chips and table cells -->
<span class="ds-spinner" aria-hidden="true"></span>                 <!-- 16px -->
<span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span>  <!-- 12px, text colour -->

<div class="ds-skeleton" role="status">
  <span class="ds-sr">Loading ...</span>
  <span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>
  <span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span>
  <span class="ds-skeleton__line ds-skeleton__line--lead" aria-hidden="true"></span>
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
  of one band fixed to the viewport (`background-attachment: fixed`, the registered `--ds-skeleton-x`), so the bones
  of a surface share one phase. Fallback: where `background-attachment: fixed` is ignored (iOS) or broken by a
  transformed ancestor (a sheet mid-slide, `.ds-enter`), the bones stay in time but the band no longer runs across
  them; never wrap a skeleton in an entrance that fills forwards.
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
  at 4x CPU throttling): 50 table rows of wavy progress with four shape loaders stay within it. The skeleton wave
  does not: its fixed band (`background-attachment: fixed`) is repainted with the whole view, so without GPU
  rasterisation a full-width skeleton stalls a frame for three or more several times a second, at any CPU speed.
  Limits: one skeleton surface per view, shown only while a page loads its first data and never beside other
  loops (shape loaders, wavy bars, spinners; its own loading bar aside) in the same view; for a refresh use `.ds-stale` and the loading bar.
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

## Ripple

A press on an action grows a circle of the content colour from the pointer (Enter or Space: from the centre) and
fades it when the press ends. One call wires every action on the page, also the ones rendered later:

```js
const ripples = DS.ripple.attach(document);   // <html> gets .ds-ripples; ripples.detach() takes it back
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
  `.ds-menu__item`, `.ds-errors summary` and `[data-ds-ripple]`; Enter on a `.ds-table__row-link` or
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

Root classes: `.ds-theme` (tokens; required), `.ds-base` (page base, optional).

**Motion:** `.ds-stale`: the "Loading bar" row of [Feedback](motion.md#feedback) in motion.md.

## Motion classes

Documented in [motion.md](motion.md): `.ds-enter` with `.ds-enter--fade`, `.ds-enter--scale`, `.ds-enter--slide`,
`.ds-enter--swap`, `.ds-enter--delayed`, `.ds-enter--pop`, `.ds-enter--fill-x`, `.ds-enter--fill-y`; `.ds-leave` with `.ds-leave--sink`, `.ds-leave--scale`, `.ds-leave--slide`, `.ds-leave--pop`;
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
``` A `[popover]` is centred by the browser's `margin: auto`; inside a container that
spaces its children with margins (`.ds-card > * + *`), give it `margin: auto` again or place it outside.

**Motion:** [Utilities](motion.md#utilities-css) and [Keyframes](motion.md#keyframes) in motion.md.

## Attributes

The attributes the system writes (owned state: a re-render with `DS.dom.morphHtml` keeps them; never set them) and
the ones the page sets for it. The project check reads this table.

| Attribute | Written by | On | Meaning |
|---|---|---|---|
| `data-scrolled` | the system (`DS.dom.watchScrolled`) | `.ds-app`, `.ds-sheet__panel`, `.ds-dialog__box` or the scroller | the scroller is scrolled away from its top (hairlines, top bar tint) |
| `data-ds-sentinel` | the system (`DS.dom.watchScrolled`) | the 1px sentinel first in a watched scroller | marks the sentinel (with `data-ds-keep`) |
| `data-ds-edges` | the system (`DS.dom.scrollEdges`) | the scroller | its edges are reported |
| `data-ds-overflow-start` | the system (`DS.dom.scrollEdges`) | the scroller | more to scroll at the start of its axis |
| `data-ds-overflow-end` | the system (`DS.dom.scrollEdges`) | the scroller | more to scroll at the end of its axis |
| `data-ds-dragover` | the system (`DS.dom.dropzone`) | a `.ds-dropzone` or a page drop target | files are dragged over it |
| `data-ds-dragging` | the system (`DS.motion.sortable`) | the item being moved | the dragged row |
| `data-ds-keyboard` | the system (`DS.dom.followViewport`) | `<html>` | the on-screen keyboard is up |
| `data-ds-guard="off"` | the page | any element around actions | its `aria-disabled` and busy actions explain themselves on click: `DS.motion.guard()` lets their activations through |
| `data-ds-shown` | the page | a `.ds-presence--keep` element | shown (without it hidden, keeping its box) |
