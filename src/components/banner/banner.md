## Banner

A system broadcast for the whole app (an outage, maintenance, offline): several messages in priority order in the
[app frame's](#app-frame) `.ds-banner`, each dismissible, the dismissal remembered.

```html
<div class="ds-panel">
  <div class="ds-banner" data-ds-banner>
    <div class="ds-alert ds-tone-info" role="status" data-ds-banner-id="maintenance-1109">[icon info 20]
      <span class="ds-alert__text">Maintenance on Sunday, 02:00 to 04:00. Devices stay online.</span>
      <a class="ds-btn ds-btn--text ds-sm" href="/status">Details</a></div>
    <div class="ds-alert ds-tone-error" role="alert" data-ds-banner-id="outage-1104">[icon alertCircle 20]
      <span class="ds-alert__text">Sign-in is down for some people. We are on it.</span></div>
    <div class="ds-alert ds-tone-warning" role="status">[icon wifiOff 20]
      <span class="ds-alert__text">You are offline. Changes are saved when the connection is back.</span></div>
  </div>
  <main class="ds-view" id="main" tabindex="-1"> ... </main>
</div>
```

What `DS.banner` makes of it (the error first, the others behind the more button):

```html
<div class="ds-banner" data-ds-banner>
  <div class="ds-alert ds-tone-error" role="alert" data-ds-banner-id="outage-1104">[icon alertCircle 20]
    <span class="ds-alert__text">Sign-in is down for some people. We are on it.</span>
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-banner__dismiss" type="button" aria-label="Dismiss" data-tip="Dismiss">[icon close 20]</button></div>
  <div class="ds-alert ds-tone-warning" role="status" hidden> ... </div>
  <div class="ds-alert ds-tone-info" role="status" data-ds-banner-id="maintenance-1109" hidden> ... (dismiss button) </div>
  <button class="ds-btn ds-btn--text ds-sm ds-banner__more" type="button" aria-expanded="false" aria-controls="...">Show 2 more</button>
</div>
```

### Options

| Option | Attribute or class | Where it applies | Effect |
|---|---|---|---|
| Priority | `data-ds-banner-priority="<number>"` on an alert | one message | higher first; without it, by tone: error, warning, info, primary, the plain alert (neutral), success; equal ones keep the markup's order |
| How many show | `data-ds-banner-max="1"` (default 1) | the banner | the others wait behind `.ds-banner__more` ("Show 2 more"), which shows them all and hides them again ("Show less"); a change applies at once and keeps the messages from data |
| Dismissible | `data-ds-banner-id="<key>"` on an alert; `data-ds-banner-dismiss="off"` | one message | an alert with an id gets a `.ds-banner__dismiss` button (unless it has one); `off` keeps it without one. An alert without an id cannot be dismissed: there is nothing to remember |
| Remembered | `data-ds-banner-remember="local"` (default), `"session"`, `"off"` | the banner | where the dismissal is kept: `DS.store` in `localStorage` (every tab, after a reload), `sessionStorage` (this tab), or memory (until the page reloads); a change switches the storage and keeps the messages from data |
| Tone, size, density, shape, touch | those of the [alert](#alert) | each message | the alert's: the icon and the word carry the status; the dismiss button is an icon button at `.ds-sm` (size steps it, density does not; `.ds-touch` makes it a full target) |

Messages under each other: only the first one shown keeps the panel's top corners; the next ones are square, a hairline
(`--ds-line`) apart. A waiting or dismissed message is `hidden` and takes no room, also on a page without `.ds-base`. A
banner with nothing to show is `hidden` itself.

### Behaviour

`DS.init()` finds `[data-ds-banner]`. From the page, or to broadcast from data:

```js
const banner = DS.banner.create(el, {
  banners: [{ id: 'outage-1104', tone: 'error', title: 'Sign-in is down', text: 'We are on it.', action: { label: 'Status', href: '/status' } }],
});
banner.add({ id: 'offline', tone: 'warning', text: 'You are offline.', dismissible: false });
banner.remove('offline');            // the page takes it back (the connection returned)
banner.dismiss('outage-1104');       // as the dismiss button does
banner.restore('outage-1104');       // forgets the dismissal: it shows again
banner.expand();                     // every message; expand(false) folds them again
banner.get();                        // the ids shown, in order
banner.on('dismiss', ({ id }) => {}); // also a bubbling ds:dismiss on the banner
DS.banner.order(list);               // the order of a list of { priority, tone }
DS.banner.priorityOf({ tone: 'error' });
```

| Export | What |
|---|---|
| `create(el, { banners })` | the controller of a `.ds-banner`, the same one `data-ds-banner` makes; once per element (a second call adds `banners`). A message from data: `{ id, tone, title, text, icon, action: { label, href \| onClick(event, banner) }, priority, dismissible, role }`, built in the alert's markup (`role` only when given: it is announced instead; `href` only when [`DS.core.safeHref()`](core.md) accepts it, `http:`, `https:`, `mailto:`, `tel:` or relative, else the action is a button). The controller: `get()`, `set(banners)` (replaces the messages built from data; those of the markup stay), `add(banners)`, `remove(id)`, `dismiss(id)`, `restore(id)`, `expand(on)`, `on(type, fn)`, `update(names)` (core calls it when `data-ds-banner-max` or `-remember` changes), `destroy()` |
| `order(banners)` | the order messages show in: `priorityOf()`, the highest first, equal ones in their given order |
| `priorityOf(banner)` | a message's priority: the number of `priority`, else its tone's rank |

- **Remembered.** A dismissal is kept under the namespace `banner` of [`DS.store`](core.md#dsstore-remembered-preferences),
  key the message's id, so it stays away after a reload, and other tabs hide it at once (the store's `storage` event).
  A new broadcast takes a new id (`maintenance-1109`, not `maintenance`); `restore(id)` brings one back.
- **Focus.** Dismissing the message that holds focus moves focus to the next message's dismiss button, else to the
  more button, else to the view (`.ds-view`, given `tabindex="-1"` when it has none), never to `<body>`.
- **Events.** `ds:dismiss` (`{ id }`) and `ds:change` (`{ shown, hidden }`: the ids) on the banner.
- **Screen readers.** An alert of the markup keeps the role the page gave it: `role="alert"` only for what is urgent,
  `role="status"` for the rest. A message from data has no live role of its own: when `add()` or `set()` shows it, its
  title and text are announced through the snackbar region's announcers (`DS.toast.announce()`; an error
  assertively), so it is heard once, also above an open dialog. A message that waits behind the more button is not
  announced. The more button says how many wait, and `aria-expanded` whether they show.

### Keyboard and forced colours

- `Tab` reaches each shown message's action and dismiss button, then the more button; `Enter` or `Space` presses them.
- Forced colours: the alert's own; the hairline between messages is a border, so it becomes `CanvasText`.

### Motion

Shown, waiting and dismissed messages change inside `DS.motion.flip()` on the banner's parent (the `.ds-panel`): the
view glides to its new place, and a message that appears fades in (`DS.motion.enter(alert, 'fade')`). Nothing
animates a height. On load nothing plays.

<!-- changelog -->
- Banner (3.0): `DS.banner` (`create`, `order`, `priorityOf`) and `data-ds-banner` on the app frame's `.ds-banner`:
  several messages in priority order (`data-ds-banner-priority`, else by tone), `data-ds-banner-max` with the
  `.ds-banner__more` button, dismissal (`data-ds-banner-id`, `.ds-banner__dismiss`) remembered through `DS.store`
  (`data-ds-banner-remember`); the string `bannerMore`.
