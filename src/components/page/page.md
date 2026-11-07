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

### A sticky head that condenses, actions that fold

```html
<header class="ds-page-head ds-page-head--sticky" data-ds-page-head>
  ... the same parts ...
</header>
```

- **`.ds-page-head--sticky`** sticks `--ds-page-head-top` (0px; the height of a bar that sticks above it) below the top
  of its scroller, on `--ds-page-head-bg` (`--ds-backdrop`; set it to the surface it lies on), with `--ds-space-3`
  above and below. A hairline under it shows while the content scrolls under it: where scroll timelines exist it fades
  in over the first `--ds-space-2` of scroll (`ds-scroll-fade`, progressive), elsewhere with `data-scrolled` over
  `--ds-dur-fast`. Print puts it back in the flow.
- **Condensing** (`data-ds-page-head` on a sticky head; `data-ds-page-head-condense="off"` keeps it whole): once the
  head sticks (a head under a banner or a toolbar first scrolls up to its sticky top) and the reader has scrolled past
  what folds, the module writes `data-scrolled` on the head and the back link or breadcrumbs,
  the lead, the status and the key facts fold away; the title takes `--ds-font-title` on one line (an ellipsis when
  short of room) with the actions at its end, also on a narrow page; the tabs stay. What folded keeps its room in the
  flow (a bottom margin as tall, `--ds-page-head-fold`, a runtime property the module writes), so the content under it
  stays where it was, a running scroll goes on, and the state follows the scroll position alone: nothing jumps,
  nothing flickers. The scroller is the nearest scrolling ancestor of the head, else the page. A head prints whole,
  also while condensed.
- **Folding actions** (`data-ds-page-head` on any head): the module writes `.ds-page-head__more` (a quiet icon button
  named "More actions", the string `moreActions`) and its `.ds-menu` after the actions. Actions that do not fit the
  title row (on its own line under the title as well; half of it beside the title of a condensed head) hide, the first
  ones first and a filled one last, and the menu lists them with their icon and label; an item presses its action (a
  link item follows the link), a blocked action stays blocked in the menu. The row's width decides (a
  `ResizeObserver`), so a narrow content panel folds as a phone does. An action that opens an overlay with itself as
  the opener passes the More button instead while it is folded (`hidden`), so the popup is placed against a button on
  screen and the focus returns to it on close:
  `DS.overlay.open(dialog, { opener: button.hidden ? head.querySelector('.ds-page-head__more') : button })`.
- `ds:change` on the head: `{ condensed }`.

| Attribute | Option | What |
|---|---|---|
| `data-ds-page-head` | | the behaviour, on the `.ds-page-head` |
| `data-ds-page-head-condense` | `condense: false` | `off`: a sticky head stays whole |

The controller (`DS.get(head, 'page')`, or what `DS.page.create(head, options)` returns): `get()` (whether it is
condensed), `set(condensed)` (until the next scroll decides), `on('change', fn)`, `refresh()` (lays the actions out
again and measures the head's place, after content above it changed) and `destroy()`. `DS.page.fold(widths, { room, gap, more, order })` is the folding rule alone: the indices of the
actions that fold.

What the module writes is owned state (`DS.dom.morphHtml` keeps it): `data-scrolled` and its `style` (the fold) on the
head and `hidden` on the folded actions; the More button and its menu are the system's own (`data-ds-keep`).

- Keyboard and names: the More button is a tab stop after the actions that stay; Enter, Space or Down opens its menu
  (`DS.menu`: arrow keys, Escape returns the focus to More). A condensed head keeps every action reachable. The title
  keeps its heading level in both states.
- Forced colours: the hairline under a sticky head is `CanvasText`; the More
  button and menu are the button's and the menu's.

**Motion:** the hairline under a sticky head fades in with the scroll (or over `--ds-dur-fast`); the head condenses in
one frame once its folding parts have scrolled under it, so the reader sees no jump.
The More menu opens and closes as every menu does.

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

<!-- changelog
- Page head: `.ds-page-head--sticky` (`--ds-page-head-top`, `--ds-page-head-bg`) and a behaviour module (`DS.page`,
  `data-ds-page-head`): the sticky head condenses once the reader has scrolled (`data-scrolled`, the content kept in
  place; the hairline on a scroll timeline where supported), and the actions fold into a More menu
  (`.ds-page-head__more`) by the row's width.
-->
