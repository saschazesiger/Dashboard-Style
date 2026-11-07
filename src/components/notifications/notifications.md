## Notification centre

What happened for someone while they worked: a bell with the unread count in the top bar opens a [side
sheet](#side-sheet) of notifications, grouped by day, to read, act on and mark read.

```html
<span class="ds-notifications__bell">
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-open="#inbox" aria-label="Notifications" data-tip="Notifications">[icon bell 20]</button>
</span>

<dialog class="ds-sheet ds-notifications" id="inbox" data-ds-notifications aria-labelledby="inbox-title">
  <div class="ds-sheet__backdrop" data-ds-close></div>
  <section class="ds-sheet__panel">
    <div class="ds-sheet__head">
      <div class="ds-sheet__heading">
        <h2 class="ds-sheet__title" id="inbox-title">Notifications</h2>
        <p class="ds-sheet__subtitle"></p>
      </div>
      <a class="ds-btn ds-btn--quiet ds-btn--icon" href="/settings/notifications" aria-label="Notification settings" data-tip="Notification settings">[icon settings 20]</a>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-notifications__bar">
      <label class="ds-switch"><input type="checkbox" role="switch" data-ds-notifications-unread-only>
        <span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Only unread</span></label>
      <button class="ds-btn ds-btn--text ds-sm" type="button" data-ds-notifications-read-all>Mark all as read</button>
    </div>
    <div class="ds-sheet__body ds-notifications__feed" tabindex="0"></div>
  </section>
</dialog>
```

```js
const centre = DS.notifications.create(document.querySelector('#inbox'), { items });
centre.add({ id: 'n9', title: 'LAPTOP-0042 is offline', text: 'Last seen in Building A.', time: new Date(),
  tone: 'warning', icon: DS.icons.wifiOff, href: '/devices/42', actions: [{ id: 'ticket', label: 'Open a ticket' }] });
centre.on('action', ({ item, action }) => { /* also a bubbling ds:action on the sheet */ });
centre.on('read', ({ ids, read }) => saveReadState(ids, read));
```

What it renders into the feed, per group (the rows keyed, patched in place):

```html
<section class="ds-notifications__group" aria-labelledby="h1">
  <h3 class="ds-notifications__heading" id="h1">Today</h3>
  <ul class="ds-notifications__list" role="list">
    <li class="ds-notifications__item" data-ds-key="n9" data-unread>
      <span class="ds-notifications__icon ds-tone-warning" aria-hidden="true">[icon wifiOff 20]</span>
      <div class="ds-notifications__content">
        <p class="ds-notifications__title" id="t1"><a class="ds-notifications__link" href="/devices/42">LAPTOP-0042 is offline</a></p>
        <p class="ds-notifications__text">Last seen in Building A.</p>
        <p class="ds-notifications__meta"><span class="ds-notifications__dot" aria-hidden="true"></span><span class="ds-sr">Unread, </span><time datetime="2026-11-05T13:27:00.000Z">3 minutes ago</time></p>
        <div class="ds-notifications__actions"><button class="ds-btn ds-btn--text ds-sm" type="button" data-ds-key="ticket">Open a ticket</button></div>
      </div>
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-notifications__toggle" type="button" aria-label="Mark as read" aria-describedby="t1" data-tip="Mark as read">[icon mailOpen 20]</button>
    </li>
  </ul>
</section>
<div class="ds-empty ds-notifications__empty" hidden>
  <span class="ds-empty__disc" aria-hidden="true">[icon bell 24]</span><p class="ds-empty__title">No notifications</p></div>
```

A page that renders on the server writes the same rows (with `data-ds-key`, `data-unread`, the title, its link, the
text and `<time datetime>`) and `DS.init()` reads them as the first notifications. Its own `.ds-empty` in the feed (a
title and a sentence: "You are all caught up") replaces the built one.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Tone | `tone` of a notification (`.ds-tone-*` on its icon) | one notification's icon | the disc takes the tone's container pair; the glyph carries the meaning: without an `icon` of its own it is the tone's (`alertCircle` for error, `alert` for warning, `checkCircle` for success, else `info`), and pick one that says it when you name one (`wifiOff`). Error, warning and success add their word for screen readers ("Error", `notificationsError`; `notificationsWarning`, `notificationsSuccess`) before the time. A tone on an ancestor is ignored |
| Size | `.ds-xs` ... `.ds-xl` | the sheet or any ancestor | a row's padding 4px per step (8px of height), the disc 8px per step (`--ds-notifications-icon-size`, 40px at md); type stays |
| Density | `.ds-density-*` | any container | a row's padding 2px per step (`--ds-notifications-item-padding`, 12px at comfortable), the bar's height 4px per step; the sheet's padding follows the sheet |
| Shape | `.ds-shape-*` | any container or the theme | the disc's radius times `--ds-shape` (round at the default) |
| Touch | `.ds-touch` | the theme or a container | the read button and the actions grow to `--ds-touch-target`; the bell's button too |

### Behaviour

- **A notification** is `{ id, title, text, time, read, icon, tone, href, group, actions }`: `time` a `Date`, a timestamp
  or an ISO text, shown as a relative time that stays current ([`DS.format.time`](core.md#relative-time-data-ds-time),
  the absolute date in its tooltip); `icon` a glyph of `DS.icons` (default: the tone's glyph, else `info`); `href` links the title (following
  it marks the notification read and dispatches `ds:select`) when [`DS.core.safeHref()`](core.md) accepts it
  (`http:`, `https:`, `mailto:`, `tel:` or relative; a `javascript:` or `data:` URL leaves the title plain text); `group` a heading of its own instead of the day;
  `actions` a list of `{ id, label, run(item, centre) }`, text buttons under the text (`ds:action`, then `run`).
- **Groups.** Today, Yesterday and Earlier by the calendar day of `time` (the strings `notificationsToday`,
  `notificationsYesterday`, `notificationsEarlier`), or the notification's `group`; newest first inside a group, the
  groups in the order of their newest notification.
- **Read and unread.** An unread notification shows a dot before its time, its title in the label weight and the word
  "Unread" for screen readers (`data-unread` on the row), never colour alone. Its read button (`.ds-notifications__toggle`,
  named "Mark as read" or "Mark as unread", described by the title) toggles it. `[data-ds-notifications-read-all]` marks
  all read and announces it ("All notifications marked as read."); it is `aria-disabled` while nothing is unread. An
  unread-only switch (`[data-ds-notifications-unread-only]`) hides what was read; a row that leaves while it holds
  focus (read there, or removed) hands focus to the next row's first control, else the previous row's, else the feed. Read state is the page's to keep:
  save it on `ds:read`.
- **The count.** Every button with `data-ds-open="#<id>"` inside a `.ds-notifications__bell` (or the `bell` option)
  gets the unread count as a `.ds-badge` on its corner ([badge](#badge): `99+` past 99, gone at zero, popping in and
  out), outside the button so its ripple never clips it, and the accessible name "Notifications, 3 unread"
  (`notificationsCount`, from the button's own label). The sheet's `.ds-sheet__subtitle` says "3 unread".
- **Arrivals.** `add(items)` puts new notifications at the top and announces "New notification: LAPTOP-0042 is
  offline" (several in one task: "3 new notifications"), politely, through the snackbar region's announcers, so it is
  heard above an open dialog too; `{ announce: false }` adds quietly (a backlog on load). A notification with the id
  of one on screen replaces it.
- **Settings and the empty state.** The settings link is the page's, in the head; with nothing to show (or nothing
  unread under the switch) the feed shows its empty state.
- **Open and close** through `DS.overlay`, as every sheet: the bell's `data-ds-open`, `data-ds-close` inside,
  `DS.notifications.open(el, { opener })`. Focus returns to the bell.

| Export | What |
|---|---|
| `create(el, { items, bell })` | the centre of a `.ds-sheet.ds-notifications`, the same controller `data-ds-notifications` makes; once per element (a second call sets `items`). The controller: `get()`, `set(items)`, `add(items, { announce })`, `update(id, patch)`, `remove(id)`, `read(id, read)`, `readAll()`, `unread()`, `open({ opener })`, `close()`, `refresh()`, `on(type, fn)`, `destroy()` |
| `open(el, { opener })` | opens the centre through `DS.overlay` (made on first use) |
| `close(el)` | closes it through `DS.overlay` |
| `groupByDay(items, { now })` | the groups as rendered: `[{ key, day, items }]` |
| `dayOf(value, now)` | `'today'`, `'yesterday'` or `'earlier'` for a time |

Events on the sheet: `ds:change` (`{ items, unread }`), `ds:read` (`{ ids, read }`), `ds:action` (`{ item, action }`),
`ds:select` (`{ item }`), and the sheet's `ds:open` and `ds:close`.

### Keyboard and forced colours

- The bell is a button: `Enter` or `Space` opens the sheet with focus on the feed (`notifications.js` writes
  `autofocus` there unless the markup puts it elsewhere) and Tab stays inside (`DS.overlay`); `Escape` closes it and
  focus returns to the bell.
- In the feed, `Tab` goes through each notification's link, its actions and its read button, in reading order; the
  feed itself is a stop (`tabindex="0"`) so it can scroll by keys. Removing the notification that holds focus moves
  focus to the next one's first control.
- Forced colours: the unread dot takes `CanvasText`, the icon disc keeps a `CanvasText` edge, links are `LinkText`.

### Hooks

`--ds-notifications-icon-size` (40px), `--ds-notifications-item-padding` (12px), `--ds-notifications-dot-size` (8px);
the bar reads the sheet's `--ds-sheet-padding` ([theming.md](theming.md#component-hooks)).

### Motion

The sheet's own (DS.overlay). With the sheet open, an arriving notification fades in (`DS.motion.enter(row, 'fade')`)
while the others glide down (`DS.motion.flip()`); the unread switch glides the rows that stay. The unread dot comes in
over `--ds-dur-fast` and goes at once. The badge pops in and out ([badge](#badge)).

<!-- changelog -->
- Notification centre (3.0): `.ds-notifications` on a `.ds-sheet`, `.ds-notifications__bell` with its count badge,
  `DS.notifications` (`create`, `open`, `close`, `groupByDay`, `dayOf`), `data-ds-notifications`: groups by day,
  read and unread, mark all read, actions per notification, an unread-only switch, the empty state and a live
  announcement on arrival. Hooks `--ds-notifications-icon-size`, `--ds-notifications-item-padding`,
  `--ds-notifications-dot-size`; the `notifications*` strings.
