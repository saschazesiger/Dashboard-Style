## Snackbar

A short message about something that just happened, at the bottom of the content panel, with an optional action.

```html
<div class="ds-toasts"></div>                                   <!-- right after .ds-app, inside .ds-theme -->
```

```js
DS.overlay.toast(region, 'Saved.');                                 // closes by itself
DS.overlay.toast(region, 'Could not save.', { kind: 'error' });     // stays until closed
const message = DS.overlay.toast(region, 'Export ready.', { persistent: true });
message.close();                                                    // message.closed resolves once it is gone
DS.overlay.toast(region, '3 devices deleted.', { action: { label: 'Undo', onClick: () => restore() } });
DS.overlay.toast(null, 'Saved.');                                   // null: the page's region (toastRegion())
DS.overlay.announce('Saved.');                                      // said, not shown
```

What `toast()` builds from a string (or takes as it is, when you pass a `.ds-toast` element):

```html
<div class="ds-toast [ds-toast--error | ds-toast--info]">[icon checkCircle | alertCircle | info 20]<span class="ds-toast__text">Saved.</span>
  <button class="ds-btn ds-btn--text ds-sm ds-toast__action" type="button">Undo</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">[icon close 20]</button></div>
```

The action button comes only with `action`, the close button with every message that stays (`closeLabel`, default the
system's string `close`, is its label and its tooltip).

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Kind | `kind: 'success'`, `'error'`, `'info'`; `.ds-toast--error`, `.ds-toast--info`, or `.ds-tone-error`, `.ds-tone-info` on a message built by hand | one message | its icon and word; an error stays until closed and is announced at once. On the inverse surface a tone is never a colour of its own |
| Shape | `.ds-shape-*` | the region or any ancestor | multiplies the radius (`--ds-toast-radius`) |
| Size, density | none | | a snackbar floats above the region it reports on and keeps one size; its action stays 32px and its close button 36px (only `.ds-touch` makes that bigger) |

### Behaviour

- Place the region right after `.ds-app`. It sits at the bottom left of the content panel: next to a persistent
  drawer by itself, next to the open modal drawer above 600px, full width on phones. If your panel starts elsewhere,
  set `--ds-toast-left` on the region to the panel's left edge plus 24px
  (`region.style.setProperty('--ds-toast-left', panel.getBoundingClientRect().left + 24 + 'px')`).
  `DS.overlay.toastRegion(doc)` returns the page's region: the `.ds-toasts` in the theme of the first `.ds-app` (else
  the first in the document); without one it creates `<div class="ds-toasts"></div>` right after `.ds-app` (else as
  the last child of the `.ds-theme`, or of `<body>` when the theme is `<html>`; 2.1). `toast(null, ...)`, `announce()` and the save bar use it. A region first used while a
  dialog or side sheet of its theme is open (created then, or rendered by the page after the open) moves into it on
  that first use, like one that was there at the open, so its messages and announcements are above the modal.
- **Stack.** At most three show at once (`TOAST_LIMIT`), the newest at the bottom; the others glide to their places
  (`DS.motion.flip()`) while a message rises in or fades out where it was. A fourth replaces the oldest message that
  would close by itself; when all three stay (errors, `persistent`), it waits and enters when one closes. `close()`
  on a waiting message takes it out of the queue.
- **The same message again.** A string message without action, of the same kind, `persistent` and text (whitespace
  and case aside) as one on screen does not stack: the one on screen starts its timer over and its text is announced
  again, and `toast()` returns its handle (a waiting one keeps its place). A poll that reports "Offline." every few
  seconds shows one message. `restart: false` stacks it all the same.
- **Replace by key.** `toast(region, text, { key: 'sync' })` replaces the message with the same `key` on screen or
  waiting: on screen the old one fades out in place while the new one enters in its slot (one glide), waiting it
  takes its place in the queue; the old handle's `closed` resolves, the call returns the new handle, and focus inside
  the old message moves to the new one's close button. A retry keeps one error: `{ kind: 'error', key: 'save' }`.
- **Close by kind or key.** `DS.overlay.closeToasts(region, { kind, key })` closes every message on screen or waiting
  that matches (both optional; no filter closes all; `region` defaults to `toastRegion()`), as one change of the
  stack, and resolves once they are gone: a save that succeeds after a retry clears its errors with
  `closeToasts(null, { key: 'save' })`.
- **Undo right after an action.** `action: { label, onClick }` (string messages) adds a text button before the close
  button; the message gets the close button too and stays until one of them is used. A click closes the message,
  then calls `onClick(event, handle)` once (an error it throws goes to `reportError`). Any `.ds-btn--text` in a
  message, also one you build, takes the inverse primary ink (`--ds-toast-action-color`, default
  `--ds-inverse-primary`, 7.6:1 on the inverse surface) and sits at the end of the line.
- **Timer.** A message closes after `timeout` ms: by default 4s plus 50ms for each character past 40, at most 10s,
  all stretched by `--ds-time-scale`. Errors, `persistent: true` and messages with an action, another button or a
  link never close by themselves: the close button or the action does. An element message that stays without a
  close button or an action of its own gets the documented close button. The timers pause while a pointer is over a
  message, while focus is in the region and while the tab is hidden, and go on with the time they had left.
- **Room at the end.** While a message that stays shows, its layer keeps room for it, so the last actions can scroll
  clear of it: `toast()` sets `data-toast-reserve` and `--ds-toast-reserve` (how far the highest staying message
  reaches into the scroller, rounded up) on the `.ds-view` of the region's app, on the `.ds-sheet__body` of a side
  sheet that hosts the region, or on a hosting `.ds-dialog` while its box would overlap the stack (the box then
  re-centres above it). It measures again after every change of the stack, after the region moves and when the
  region resizes, and scrolls a focused element that the stack covers clear of it. Both are owned (a re-render
  keeps them). `reserve: false` leaves both to the page for that message. A layer that must never shrink (a fixed
  view that refits its content, such as a terminal) takes `data-ds-toast-room="off"` (2.1): `toast()` keeps no room
  there (no attribute, no padding, nothing scrolled), while the dialogs and sheets that host the region later keep
  theirs. It is read at every measure, so setting or removing it applies on the next change of the stack; the page
  then keeps its own content clear of the messages.
- **Focus.** A focused message that leaves hands focus to the next message's close button, else back to where focus
  came from into the region, else to the view (`.ds-view` with `tabindex="-1"`), never to `<body>`.
- **Screen readers.** The region and the messages are not live regions, so their buttons stay usable. On first use
  `toast()` adds two `.ds-sr` live regions next to the region (polite, and assertive for errors) and writes each
  message's text there; it takes `role` and `aria-live` off the region and off the messages (once, and owned).
  `DS.overlay.announce(text, { assertive, region })` writes a text through the same announcers without a message
  (a result that a busy button only shows, a filter count): the same text twice is said twice, empty text nothing.
  While a dialog or side sheet is open, the announcers sit inside it with the region, so it is heard there.
- **Dialogs and side sheets.** While a dialog or side sheet is open (`DS.overlay.open()`), the regions of its theme
  (not one inside a nested `.ds-theme`, an embedded widget's: it stays in its widget) move into it, so a message shown
  meanwhile (an error from the dialog's action) is above the scrim, announced and usable: in the top layer of a
  native one, outside the inert page of the div markup. In a sheet the messages glide with the panel's edge and rise
  above its `.ds-sheet__foot` (`data-follow="enter"` and `"exit"` time the glide like the sheet); in a dialog they
  keep their place. Closing brings them back: they glide to their place while still inside the leaving dialog or
  sheet (so they stay above its scrim and panel through the exit) and return to the page once it ended. The modal
  drawer leaves the regions and their announcers usable where they are; on phones they rise above its
  `.ds-drawer__foot`. A region placed inside another element of the page (not next to `.ds-app`) is inert under a div
  dialog that does not take it in, so keep it in the documented place.
- **Above bars.** A shown [save bar](#save-bar) lifts the messages above itself. `--ds-toast-lift` is the region's
  runtime rise that `DS.overlay` writes (a sheet's foot, the drawer's foot, the save bar); the messages glide on both
  axes (`--ds-toast-shift`, `--ds-toast-shift-y`, written by `DS.overlay` only). The on-screen keyboard raises them by
  `--ds-keyboard-inset` (written by `DS.dom.followViewport()`). Another bar of your own pinned to the bottom edge:
  set `--ds-toast-bottom` on the region to its height plus a gap while it shows.
- **View transitions.** While `DS.motion.transition()` runs, a region with messages is its own group
  (`ds-toasts`, [motion.md](motion.md#view-transitions)): a message stays on screen and still above the changing
  view, and glides with the panel's edge when the view shows or hides the drawer. Keep one region with messages per
  page: `transition()` lifts the name of a further one, which then crossfades with the page.
- `.ds-toast--info` uses the plain text colour for its icon, like `--error`. `.ds-toast--shown` is runtime state:
  `toast()` marks a message whose entrance has played, so a region that moves never replays it.
- Hooks: `--ds-toast-action-color`, `--ds-toast-close-size` (the close button, 36px), `--ds-toast-radius`
  ([theming.md](theming.md#component-hooks)).
- **Removed in 2.0:** the region with `role="status" aria-live="polite"` and `role="alert"` on messages (`toast()` now
  takes the attributes off and announces once: use `<div class="ds-toasts"></div>`); showing messages by hand with
  `setTimeout(() => DS.motion.leave(toast), 4000)` (`toast()` times them); the hand recipe that moved messages into a
  side sheet with a page-set `--ds-toast-shift` (`DS.overlay.open(sheet)` moves and glides the region).

### Keyboard and forced colours

- Keyboard: a message's buttons are in the tab order, where the region sits; focus inside pauses its timer. It never
  takes focus by itself, and an error is announced, not focused.
- Forced colours: a message's transparent outline becomes its edge.

**JS API.** `js/toast.js` (`DS.toast`): `toast(region, content, options)`, `closeToasts(region, filter)`, `announce(text, options)` and `toastRegion(doc)`, the same functions as under `DS.overlay`.

**Motion:** the "Snackbar" row of [Overlays](motion.md#overlays) in motion.md.
