## Loading overlay

Blocks one region of the page (a card, a table, a form, a pane) while work on it runs, with a spinner and a message;
the rest of the page stays usable. Not for the whole page (the app's start is `.ds-boot`, [Loading](#loading)) and not
for content that is still to come (a skeleton).

```html
<section class="ds-card" aria-labelledby="dev-title" style="position: relative">
  <h2 class="ds-card__title" id="dev-title">LAPTOP-0042</h2>
  ... the content ...
  <div class="ds-loadingoverlay" hidden data-ds-loadingoverlay>
    <div class="ds-loadingoverlay__box" role="status">
      <span class="ds-spinner" aria-hidden="true"></span>
      <p class="ds-loadingoverlay__message">Saving LAPTOP-0042 ...</p>
      <p class="ds-loadingoverlay__detail">3 of 12 settings</p>
      <button class="ds-btn ds-btn--text" type="button" data-ds-loadingoverlay-cancel>Cancel</button>
    </div>
  </div>
</section>
```

```js
await DS.loadingoverlay.wait(card, api.saveDevice(form), { message: 'Saving LAPTOP-0042 ...', done: 'Saved' });
```

Without markup, `DS.loadingoverlay.show(region, { message, cancel })` builds the overlay as the region's last child
(DOM APIs; `cancel: true` adds a Cancel button with the string `cancel`). The region must be positioned; a static one
gets `position: relative` from the script while the overlay shows (an inline style it owns and gives back), so give it
yourself to keep the script out of your layout.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Veil | the default, `.ds-loadingoverlay--opaque` | the overlay | the surface at `--ds-state-stale` over the content (it shows through, dimmed), or the plain surface (content that must not show while it changes) |
| Progress | a `.ds-spinner--determinate` ring instead of the arc, `set({ progress })` | the box | a known share as a ring ([Spinner](#spinner)); keep the figure in the detail line too |
| Size | `.ds-xs` ... `.ds-xl` | the region, the overlay or any ancestor | the spinner's size step (from `--ds-loadingoverlay-spinner-size`, 32px at md) and the message's type role |
| Density | `.ds-density-*` | any container | the box's padding and gap, 2px per step |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the box's radius |
| Touch | `.ds-touch` | any container | reaches the cancel button |

No tone: waiting is no status. The overlay takes the region's radius (`border-radius: inherit`).

### Behaviour

`data-ds-loadingoverlay` (`DS.init()`) or `DS.loadingoverlay.create(el)` runs it.

- **While it shows** the veil takes the pointer at once, the region's other children are inert
  (`DS.a11y.inert()`), the region carries `aria-busy="true"`, and focus that was inside the region moves to the cancel
  button (else the box, `tabindex="-1"`), so it never sits on an inert control.
- **No flash.** It becomes visible only after `--ds-delay-loader` (a quick save shows nothing, though the region is
  blocked from the first frame); once visible it stays for `--ds-hold-loader` at least (`DS.motion.loaderHoldMs()`),
  then fades out.
- **Announced.** The message (and the detail) is said politely once it can be seen; a new message while it shows is
  said again; `done` ("Saved") is said as it goes. The box is a `role="status"`.
- **Hiding** gives the region back at once (inert, `aria-busy`), returns focus to where it was when focus is still in
  the overlay, and sets `hidden` once the fade settled.
- **Cancel.** `[data-ds-loadingoverlay-cancel]`, or Escape while focus is in an overlay that has one, sends a
  cancelable `ds:cancel` on the overlay; not cancelled, the overlay hides. Stop the work in the listener.
- `ds:show` and `ds:hide` (`{ region }`) follow each change. What it writes (`data-state`, `hidden`, the region's
  `aria-busy` and `position`) is owned, so a re-render with `DS.dom.morphHtml` keeps it.

**JS API.** `js/loadingoverlay.js` (`DS.loadingoverlay`):

- `show(region, { message, detail, progress, cancel })` shows the region's overlay (built when it has none) and
  returns its controller; `hide(region, { done })` hides it and resolves once it is hidden; `wait(region, promise,
  options)` shows it until the promise settles and resolves or rejects with it.
- `create(el)` returns the controller that `data-ds-loadingoverlay` makes: `get()` (`{ shown, message, detail }`),
  `set(true | false | { shown, message, detail, progress, done })`, `wait(promise, options)`, `on(type, fn)` (`show`,
  `hide`, `cancel`) and `destroy()`.
- `holdMs(shownAt, now, { delay, minVisible })` is the arithmetic of the hold.

### Keyboard, names and forced colours

- Keyboard: nothing inside the region takes focus while it is blocked; focus that was there is on the cancel button
  (Enter, Space, or Escape cancel) or on the box, and comes back after.
- Names and roles: the box is a `role="status"` with the message; the spinner is `aria-hidden` (a determinate ring is a
  `role="progressbar"` with a name); the region says `aria-busy="true"`.
- Forced colours: the veil is `Canvas` (the content under it is blocked anyway); the box keeps its edge (a transparent
  border that becomes visible); the spinner takes its system colours.

### Hooks

`--ds-loadingoverlay-veil`, `--ds-loadingoverlay-radius`, `--ds-loadingoverlay-padding`,
`--ds-loadingoverlay-spinner-size` ([theming.md](theming.md#component-hooks)).

**Motion:** after `--ds-delay-loader` the veil and the box fade in over `--ds-dur-fast` while the box rises
`--ds-distance-sm` on `--ds-ease-out`; it leaves over `--ds-dur-instant` (falling back on `--ds-ease-in`), after
`--ds-hold-loader` of being visible. By hand (no `data-state`): `ds-fade-in` after the delay.

<!-- changelog
- Loading overlay (`DS.loadingoverlay`, `[data-ds-loadingoverlay]` with `[data-ds-loadingoverlay-cancel]`,
  `.ds-loadingoverlay` with `--opaque`, `__box`, `__message`, `__detail`): blocks one region with a spinner and a message
  (the region inert and `aria-busy`, focus kept, the message announced, no flash through `--ds-delay-loader` and
  `--ds-hold-loader`, a cancel); `show()`, `hide()`, `wait()`, `create()`, `holdMs()`. Hooks
  `--ds-loadingoverlay-veil`, `-radius`, `-padding`, `-spinner-size`.
-->
