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
  one's text ends on the content edge the cards share, and under the title the text of a text button that comes
  first starts on the title's edge. Outlined and filled buttons keep their place, and so do the buttons after the
  first under the title (8px apart, as on a wide page) and a `.ds-btn--adaptive` while it is folded into a round icon
  button.
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

