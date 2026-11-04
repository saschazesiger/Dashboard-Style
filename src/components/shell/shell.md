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
  `createIndicator(list, { ..., reveal: true })` sets it by itself and scrolls the list (only the list) so the
  current item stays clear of its edges and their shades (below).
- Cut edges (2.1): a list longer than the drawer shades each edge that has more to show, as a menu does: a sticky
  shade of the drawer's surface (`--ds-backdrop`), `--ds-scroll-fade` long (`0px` turns it off), above the items and
  the pill, taking no room (the list keeps `--ds-space-1` above its rows and `--ds-space-6` below them). Scroll
  timelines drive it; elsewhere call `DS.dom.scrollEdges(list, { axis: 'block' })` once, whose
  `data-ds-overflow-start` / `-end` show the shades over `--ds-dur-fast` (it follows rows that come and go). An item
  focused by the keys or revealed by `createIndicator()` lands clear of the shades (`scroll-padding-block`, as
  long). Hidden in forced colours.
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
  `role="img"` it shows that tooltip on a tap too ([Tooltip](#tooltip), "On touch screens").
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
      <summary class="ds-drawer__heading ds-drawer__toggle">[icon chevronDown 20 .ds-chevron]<span>Tickets</span><span class="ds-drawer__count" aria-hidden="true">5</span></summary>
      <a class="ds-drawer__item" href="/tickets" aria-current="page" data-tip="Open tickets">[icon ticket 20]<span class="ds-drawer__label">Open</span><span class="ds-drawer__count"><span class="ds-sr">, </span>3</span></a>
      <div class="ds-drawer__row">
        <a class="ds-drawer__item" href="/tickets/waiting" data-tip="Waiting">[icon clock 20]<span class="ds-drawer__label">Waiting</span><span class="ds-drawer__count"><span class="ds-sr">, </span>2</span></a>
        <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-drawer__action ds-hover-actions" type="button" aria-label="Options for Waiting" data-tip="Options">[icon moreVertical 18]</button>
      </div>
      <details class="ds-drawer__group ds-collapsible">             <!-- nested, 2-3 levels -->
        <summary class="ds-drawer__heading ds-drawer__toggle">[icon chevronDown 20 .ds-chevron]<span>Archive</span></summary>
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
  ds-drawer__toggle">`. The heading is a pressable row of the item's height (`--ds-drawer-item-height`): state layer,
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
  keeps a `CanvasText` ring inside its fill, and an `aria-disabled` item is `GrayText`; the outline is for focus only.

### The rail

`data-drawer-collapsed` on `.ds-app` turns the docked drawer (above 900px) into a rail of `--ds-drawer-rail-width`
(72px): items become 48px squares (circles by the pill rule), labels, headings and counts are visually hidden but
read, row actions go, and the pill follows by itself. Each item's `data-tip` names it there: its visible text is gone,
so the tooltip shows. The column switches at once; the labels fade back in on `--ds-dur-fast` when it widens again
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
    <div class="ds-alert ds-alert--warning" role="status">[icon wifiOff 20]<span class="ds-alert__text">You are offline. Changes are saved when the connection is back.</span><button class="ds-btn ds-btn--text ds-sm" type="button">Retry</button></div>
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

<!-- changelog -->
- App frame (3.0): on the options model. Drawer rows and the segmented switch follow size, density, shape and touch;
  the avatar follows size and shape; the panel, the modal drawer, the skip link and the capsule follow the shape; the
  brand link takes `--ds-target-min`.
- Added: nested drawer groups (`--ds-drawer-indent`), `.ds-drawer__foot--pinned`, the hooks `--ds-drawer-font`,
  `--ds-segmented-height`, `--ds-segmented-font`.
- Deprecated: `.ds-avatar--sm` and `.ds-avatar--lg` (`.ds-sm`, `.ds-lg`).
- Changed: a segmented switch under `.ds-touch` is 48px high (it stayed 32px); the rail centres its items on its axis
  (a compact row sat 4px off it).

