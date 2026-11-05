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
| Size, density, shape, touch: launcher | the same classes | the `.ds-launcher` menu or any ancestor | an app 72 to 104px high (8px per size step, 4px per density step), its disc 24 to 56px (8px per size step), the size's type role; the shape multiplies the app's and the disc's radius; `.ds-touch` makes every app at least `--ds-touch-target` |
| Tone | none | | the frame states no status; a banner's alert does; a badge takes its own tone |

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
  tab stop; a group's `<summary>` opens and closes it with Enter or Space; with `data-ds-drawer` the arrow keys, Home
  and End move between them too. In the modal drawer focus stays inside, and
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
`data-ds-shell` on the `.ds-app` does all of it (3.0, [below](#dsshell-the-frames-behaviour)): the button toggles the
rail above 900px and opens the modal drawer at and below it, and the choice is remembered. A drawer action whose
label is a `.ds-drawer__label` (`<button class="ds-btn ds-btn--tonal" data-tip="New ticket">[icon plus 18]<span
class="ds-drawer__label">New ticket</span></button>`) turns into an icon button of its height on the rail, named by
its tooltip. A page without `DS.shell` sets the attribute itself, keeps it across loads and leaves the modal drawer to
`DS.overlay` below 900px:

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

### DS.shell: the frame's behaviour

`src/components/shell/shell.js` (3.0) wires what a 2.x page wrote by hand around the frame. Each part is a
`data-ds-*` attribute that `DS.init()` picks up, or an export that returns the same controller (`get()`, `set()`,
`on(type, fn)`, `destroy()`):

| Attribute | Export | What it does |
|---|---|---|
| `data-ds-shell="<key>"` on `.ds-app` | `DS.shell.create(app, { key, rail, remember })` | the menu button: the rail above 900px (a toggle, `aria-pressed`), the modal drawer at and below it (a disclosure, `aria-expanded`, through `DS.overlay`); a choice in the modal drawer closes it; skip links; the drawer's pill (`DS.indicator`), cut edges (`DS.dom.scrollEdges`) and the view's `data-scrolled` (`DS.dom.watchScrolled`) |
| `data-ds-drawer="<key>"` on `.ds-drawer` | `DS.shell.drawer(nav, { key, remember })` | groups remembered open or closed, the filter, the arrow keys |
| `data-ds-search-sheet` on `.ds-topbar__search` | `DS.shell.searchSheet(el, { opener })` | the search as a full-width sheet at 720px and below (`DS.shell.SEARCH_QUERY`) |
| `data-ds-launcher` on `.ds-menu.ds-launcher` | `DS.shell.launcher(menu)` | the launcher's arrow keys in two dimensions |
| `data-ds-scheme-switch="<key>"` on a group | `DS.shell.schemeSwitch(el, { key, target, link, remember })` | light, dark and auto, remembered, in step everywhere |
| `data-ds-breadcrumbs` on `.ds-breadcrumbs` | `DS.shell.breadcrumbs(nav)` | the crumbs that do not fit fold into a menu |

Two helpers without a DOM: `DS.shell.setScheme(value, { target, link, key, remember })` applies a scheme the way the
switch does (and every switch follows), `DS.shell.matchText(text, query)` is the drawer filter's match (every word, any
case, without accents) for a page's own search, and `DS.shell.fitCrumbs(widths, room, more)` the breadcrumbs' fold.

- **Frame** (`data-ds-shell`): the rail is remembered under the key through [`DS.store`](core.md) (namespace
  `shell`); `data-ds-shell-rail="off"` keeps the drawer full (the button then shows only with the modal drawer) and
  `data-ds-shell-remember="off"` stores nothing. Hover never expands the rail. `set({ rail })` and
  `set({ open })` drive it from the page; `get()` returns `{ rail, open }`; `ds:change` (`{ rail }`) fires on the
  `.ds-app`. The rail clears the drawer's filter (it has no room for the field). A skip link focuses its target (a
  target that cannot take focus gets `tabindex="-1"`); one that leads into the drawer opens the modal drawer, one that
  leads into a phone search sheet opens it.
- **Push or overlay.** Above 900px the drawer is docked and pushes the panel (full or as the rail); at and below it
  the drawer overlays the page as a modal sheet over the scrim. `DS.overlay` decides by `DS.overlay.DRAWER_QUERY`.
- **Drawer** (`data-ds-drawer`): see [Filter, remembered groups and badges](#filter-remembered-groups-and-badges).
- Every part this module adds (the "more" crumb and its menu, the drawer's "No results") carries `data-ds-keep`, so
  a re-render with `DS.dom.morphHtml` leaves it. Its strings come from `DS.core.config({ strings })`:
  `filterMatch`, `filterMatches`, `noResults`, `breadcrumbsMore` ([install.md](install.md), "Language and locale").

### Filter, remembered groups and badges

```html
<nav class="ds-drawer" aria-label="Main" tabindex="-1" data-ds-drawer="main">
  <div class="ds-drawer__search">
    <div class="ds-search">[icon filter 20]<input class="ds-input" type="search" aria-label="Filter the navigation" placeholder="Filter"></div>
  </div>
  <div class="ds-drawer__list">
    <details class="ds-drawer__group ds-collapsible" id="nav-tickets" open> ... </details>
    <a class="ds-drawer__item" href="/updates" data-tip="Updates">[icon bell 20]<span class="ds-drawer__label">Updates</span><span class="ds-badge"><span class="ds-sr">, </span>4<span class="ds-sr"> new</span></span></a>
  </div>
</nav>
```

- **Remembered groups.** Each `<details class="ds-drawer__group">` is remembered open or closed under the drawer's
  key, by its `id` (else `data-ds-key`, else its heading's text). The groups around the current item
  (`aria-current="page"`) open on load, without motion. `get()` returns `{ query, count, open }`, `set({ open:
  { '<key>': true } })` opens or closes groups, `set({ query })` filters.
- **The filter.** `.ds-drawer__search` (between the actions and the list) holds a search field. Typing filters the
  items by their labels: every word, in any case, without accents; a group whose heading matches shows all of its
  items. Groups that hold a match open until the field is cleared (then they close again and nothing of it is
  remembered); filtered items, rows and groups take no room (`data-ds-filtered`, written by the module). Without a
  match `.ds-drawer__empty` says "No results". The count is announced once the typing pauses
  (`--ds-delay-tooltip`): "3 matches". Escape clears a filled field, ArrowDown goes to the first match. `ds:filter`
  (`{ query, count }`) fires on the drawer. The rail hides the field.
- **Keys** (the optional keys of the [APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)):
  ArrowDown and ArrowUp move between the shown items and group toggles, Home and End to the first and the last;
  ArrowUp from the first goes back to the field. Tab still reaches every link; Enter and Space open a group.
- **Badges.** A `.ds-badge` ([Badge](#badge)) at the end of an item or a group toggle takes the count's place, when the
  count is news (unread). Give it its words in `.ds-sr` (", 4 new"). On the rail it becomes a dot on the icon's corner
  (`--ds-badge-dot-size`, `--ds-primary` or the badge's tone), its figure still read with the label; in forced colours
  the dot is `Highlight`.
- **Folder groups**: a nested `<details>` group is a folder; it indents its rows by `--ds-drawer-indent` per level (2-3
  levels) and is remembered like any group.

### Top bar: search, launcher, notifications and account

```html
<div class="ds-topbar">
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__menu" type="button" aria-label="Menu">[icon menu 20]</button>
  <a class="ds-brand" href="/"><span class="ds-brand__name">Product</span></a>
  <div class="ds-topbar__search" data-ds-search-sheet>
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__search-back" type="button" aria-label="Close search" data-ds-close>[icon arrowLeft 20]</button>
    <div class="ds-search">[icon search 20]<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div>
    <div class="ds-topbar__results"> (what the page shows for the query on phones) </div>
  </div>
  <div class="ds-topbar__actions">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__search-open" type="button" aria-label="Search" data-tip="Search">[icon search 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Apps" aria-haspopup="menu" aria-expanded="false" aria-controls="apps" data-ds-open="#apps" data-tip="Apps">[icon apps 20]</button>
    <div class="ds-menu ds-launcher" role="menu" id="apps" aria-label="Apps" data-ds-launcher hidden>
      <a class="ds-menu__item ds-launcher__app" role="menuitem" href="/devices" aria-current="true"><span class="ds-launcher__icon">[icon laptop 24]</span><span class="ds-launcher__label">Devices</span></a>
      <a class="ds-menu__item ds-launcher__app" role="menuitem" href="/tickets"><span class="ds-launcher__icon">[icon ticket 24]</span><span class="ds-launcher__label">Tickets</span></a>
    </div>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Notifications, 3 unread" data-tip="Notifications">[icon bell 20]<span class="ds-badge ds-badge--dot ds-tone-error" aria-hidden="true"></span></button>
  </div>
  <div class="ds-account">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-account__trigger" type="button" aria-label="Account: Ada Lovelace" aria-haspopup="menu" aria-expanded="false" aria-controls="account" data-ds-open="#account" data-tip="Ada Lovelace, ada@example.org"><span class="ds-account__avatar" aria-hidden="true">A</span></button>
    <div class="ds-menu ds-account__menu" role="menu" id="account" aria-labelledby="account-head" hidden>
      <div class="ds-account__head" id="account-head" aria-hidden="true"><span class="ds-account__avatar ds-lg">A</span><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>
      <div class="ds-menu__divider" role="separator"></div>
      <div role="group" aria-labelledby="theme-heading" data-ds-scheme-switch>
        <p class="ds-menu__heading" id="theme-heading">Theme</p>
        <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" data-ds-scheme-value="light">[icon check 20 .ds-menu__check]<span class="ds-menu__label">Light</span>[icon sun 20]</button>
        <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" data-ds-scheme-value="dark">[icon check 20 .ds-menu__check]<span class="ds-menu__label">Dark</span>[icon moon 20]</button>
        <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true" data-ds-scheme-value="auto">[icon check 20 .ds-menu__check]<span class="ds-menu__label">Device</span>[icon monitor 20]</button>
      </div>
      <div class="ds-menu__divider" role="separator"></div>
      <button class="ds-menu__item" role="menuitem" type="button">[icon logout 20]<span class="ds-menu__label">Sign out</span></button>
    </div>
  </div>
</div>
```

- **Global search, a sheet on phones** (`data-ds-search-sheet`). Above 720px the search sits in the bar as before;
  the page shows its results its own way (a [Combobox](#combobox) list, or a results page). At 720px and below the
  bar shows `.ds-topbar__search-open` instead, and that button opens the search as a full-width sheet over the whole
  frame (`DS.overlay`): the head is `.ds-topbar__search-back` (a `data-ds-close` button) and the field on the bar's
  height, `.ds-topbar__results` below it scrolls and holds what the page renders for the query (re-render it with
  `DS.dom.morphHtml`). The field takes the focus; the rest of the page is inert (`DS.a11y.inert`), Tab stays inside,
  the scroll is locked; Escape (a filled field's own clearing first) closes it and the focus returns to the button.
  Widening the window closes it and the search is back in the bar. `get()` says whether it is open, `set(true)`
  opens it (at phone width only). It fades in while it slides down by `--ds-distance-md` on the spring
  (`--ds-dur-medium`) and leaves in `--ds-dur-fast`, accelerating; a close mid-way turns back. Forced colours: its
  transparent outline becomes its edge.
- **App switcher** (`.ds-launcher`): a [Menu](#menu) laid out as a grid of apps, opened by an icon button
  (`data-ds-open`, `aria-haspopup="menu"`). Each app is a `.ds-menu__item.ds-launcher__app`: an icon on a tonal disc
  (`.ds-launcher__icon`) over a label of up to two lines (`.ds-launcher__label`). The current app has
  `aria-current="true"`: its disc takes the tint (`--ds-accent`) and its label the label weight, never colour alone;
  forced colours make it `SelectedItem`. `data-ds-launcher` adds the grid's keys: Left and Right along a row, Up and
  Down by a column (no wrap at the edges), Home and End; the menu does the rest (type-ahead, Escape, Tab closes).
  `--ds-launcher-columns` (3) sets the columns, `--ds-launcher-app-width` (96px) a column's width (the grid is at
  most the window's width), `--ds-launcher-app-height` (88px at md) and `--ds-launcher-icon-size` (40px) step 8px
  per size; density takes 4px per step off an app and 2px off the grid's padding; `.ds-touch` makes every app at least
  `--ds-target-min`; the shape multiplies the app's and the disc's radius.
- **Notification bell** (the slot). An icon button in `.ds-topbar__actions` whose name carries the count
  ("Notifications, 3 unread") and, while there is news, a `.ds-badge.ds-badge--dot` on its icon's corner, inside the
  button (`aria-hidden`: the name says it). The notification centre itself is its own component: give the button its
  `data-ds-open` (or open the centre from the page's click handler) and update the name and the dot when the count
  changes. Without a centre, the button links to a notifications page.
- **Account menu.** `.ds-account__trigger` is a quiet icon button around the `.ds-account__avatar` disc (its state
  layer, ring, ripple and target; the disc keeps its size); it opens `.ds-account__menu` (a [Menu](#menu), at most
  `--ds-account-menu-width`, 280px), named by `.ds-account__head` (the avatar `.ds-lg`, name and email; `aria-hidden`,
  since `aria-labelledby` reads it). Then the theme switch, the page's own links (profile, settings) and sign out, a
  `menuitem` whose click the page handles. The trigger never shrinks; on phones a brand of only a name gives way
  with an ellipsis instead.
- **Theme switch** (`data-ds-scheme-switch="<key>"`): items with `data-ds-scheme-value="light | dark | auto"` and
  `aria-checked` (`menuitemradio` in a menu, `radio` in a `radiogroup` elsewhere). A choice sets `data-ds-scheme` on
  the `.ds-theme` around the switch (`auto` removes it: the system decides) or on the one
  `data-ds-scheme-switch-target` names, which needs a theme that holds both schemes (a preset, `light-dark()`); with
  `themes/dark.css` name its `<link>` in `data-ds-scheme-switch-link`, whose `media` follows (`all`, `not all`,
  `(prefers-color-scheme: dark)`). The choice is stored under the key (default `scheme`; `data-ds-scheme-switch-remember="off"`
  stores nothing) and applied on the next load (call `DS.init()` early, or apply it before the first paint with
  `DS.shell.setScheme(DS.store.open('shell').get('scheme', 'auto'), { remember: false })`). Every switch on the page
  and in other tabs follows, and so does a switch whose theme the page pins itself. `ds:change` (`{ value }`) fires on
  the switch.

### Breadcrumbs that fold

```html
<nav class="ds-breadcrumbs" aria-label="Breadcrumb" data-ds-breadcrumbs>
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/sites">Sites</a></li>
    <li><a href="/sites/a">Building A</a></li>
    <li><a href="/sites/a/devices">Devices</a></li>
    <li><a href="/sites/a/devices/42" aria-current="page">LAPTOP-0042</a></li>
  </ol>
</nav>
```

`data-ds-breadcrumbs` measures the trail against the width of its nav (a `ResizeObserver`, so a narrower column, a
panel or a resized window folds it, not only the window's width). When it does not fit, the crumbs after the first
go into a menu behind `.ds-breadcrumbs__more` (a quiet `.ds-xs` icon button after the first crumb, named "Show 3
more", `aria-haspopup="menu"`), from the start of the middle; then the first crumb; then the parent; the current
page never. Folded crumbs carry `data-ds-collapsed` (written by the module). The menu lists them in order as links,
opens with a click, Enter, Space, ArrowDown or ArrowUp, and moves and closes as every [Menu](#menu). It replaces the
[Page](#page)'s narrow rule (only the parent on phones) with the measured fold. A trail the page changes
folds again. `get()` lists the folded crumbs, `set()` measures again, `ds:change` (`{ folded }`) fires on the nav.

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

<!-- changelog -->
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
