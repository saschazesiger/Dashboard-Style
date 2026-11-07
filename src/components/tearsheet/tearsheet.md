## Tearsheet

A tall create or edit flow over the page (a new device with its network and owner, a bulk edit): taller than a
dialog, with its own head, steps and foot. It is a modal [dialog](#dialog) anchored to the bottom of the window with a
gap above, so the page still shows that the work happens over it.

```html
<button class="ds-btn ds-btn--filled" type="button" data-ds-open="#add-device">Add a device</button>

<dialog class="ds-dialog ds-tearsheet" id="add-device" aria-labelledby="add-title" data-ds-tearsheet>
  <div class="ds-dialog__backdrop"></div>
  <form class="ds-dialog__box ds-tearsheet__box" novalidate>
    <div class="ds-tearsheet__head">
      <div class="ds-tearsheet__heading">
        <p class="ds-tearsheet__label">Devices</p>
        <h2 class="ds-dialog__title" id="add-title">Add a device</h2>
        <p class="ds-tearsheet__description">Register it, connect it and hand it over.</p>
        <p class="ds-tearsheet__progress"></p>
      </div>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-tearsheet__main">
      <nav class="ds-tearsheet__steps" aria-label="Steps">
        <ol class="ds-steps ds-steps--vertical">
          <li class="ds-steps__step" aria-current="step"><span class="ds-steps__mark">1</span><span class="ds-steps__label">Device</span></li>
          <li class="ds-steps__step"><span class="ds-steps__mark">2</span><span class="ds-steps__label">Network</span></li>
          <li class="ds-steps__step"><span class="ds-steps__mark">3</span><span class="ds-steps__label">Owner</span></li>
        </ol>
      </nav>
      <div class="ds-tearsheet__body">
        <section class="ds-tearsheet__step" aria-labelledby="add-s1">
          <h3 id="add-s1" tabindex="-1">Device</h3>
          <div class="ds-field"><label class="ds-field__label" for="add-name">Name</label>
            <input class="ds-input" id="add-name" name="name" required></div>
        </section>
        <section class="ds-tearsheet__step" aria-labelledby="add-s2" hidden> ... </section>
        <section class="ds-tearsheet__step" aria-labelledby="add-s3" hidden> ... </section>
      </div>
    </div>
    <div class="ds-tearsheet__foot">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
      <button class="ds-btn ds-btn--outlined" type="button" data-ds-tearsheet-back>Back</button>
      <button class="ds-btn ds-btn--filled" type="button" data-ds-tearsheet-next>Next</button>
      <button class="ds-btn ds-btn--filled" type="submit" data-ds-tearsheet-submit>
        <span class="ds-btn__faces"><span class="ds-btn__face">Add device</span>
          <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Adding</span></span>
      </button>
    </div>
  </form>
</dialog>
```

```js
sheet.addEventListener('ds:submit', (event) => event.detail.wait(api.addDevice(Object.fromEntries(event.detail.data))));
```

The div markup works as for the dialog (`<div class="ds-dialog ds-tearsheet" hidden>`, the box with `role="dialog"`,
`aria-modal="true"` and the name). The backdrop has no `data-ds-close`: a stray click never loses a half-filled form.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Width | the default, `.ds-tearsheet--narrow` | the tearsheet | `--ds-tearsheet-width` (1200px) or `--ds-tearsheet-width-narrow` (640px, a short form, usually without a rail), never wider than the window less `--ds-space-8` on each side |
| Steps | `.ds-tearsheet__steps` with a vertical [steps](#steps) list, or none | the main area | a rail of `--ds-tearsheet-rail-width` (256px) at the start; without it the progress line says where the flow is |
| Stacked | none: `data-stacked`, written by the system | a tearsheet under another | the lower box recedes; the upper one sits `--ds-space-4` lower, so the edge below shows |
| Density | `.ds-density-*` | the tearsheet or any ancestor | the padding of head, rail, body and foot and the gap of a step's fields (2px per step) |
| Shape | `.ds-shape-*` | the tearsheet or any ancestor | multiplies the radius of the box's top corners |
| Size, touch | `.ds-sm` ..., `.ds-touch` | the tearsheet or any ancestor | reach the controls inside; the box keeps its size |

There is no tone. At 600px and below the box fills the window (no gap, no radius, safe areas on head and foot) and
the rail gives way to the progress line in the head.

### Parts

- `.ds-tearsheet__head`: `.ds-tearsheet__heading` with an optional `.ds-tearsheet__label` (what it belongs to), the
  `.ds-dialog__title`, an optional `.ds-tearsheet__description` and the `.ds-tearsheet__progress` line that the system
  writes ("Step 2 of 4: Network"; shown where no rail says it), then the close icon button. A hairline under it.
- `.ds-tearsheet__main`: the optional rail `.ds-tearsheet__steps` (a `<nav>` with a name around a
  `.ds-steps--vertical` list) on `--ds-surface-low`, and `.ds-tearsheet__body`, the one part that scrolls.
- `.ds-tearsheet__step`: a section per step in the body, a column of the page's fields at a readable width, its
  heading `tabindex="-1"` (focus lands there on a step change). Only the current one shows.
- `.ds-tearsheet__foot`: the actions at the end above a hairline; the first of several (Cancel, or a `.ds-meta` line)
  takes the start. `[data-ds-tearsheet-back]`, `[data-ds-tearsheet-next]` and `[data-ds-tearsheet-submit]` are shown
  and hidden by the system. One filled button shows at a time (Next, or the submit on the last step).

### Behaviour

`data-ds-tearsheet` (`DS.init()`) or `DS.tearsheet.create(el)` runs it; open and close it with `data-ds-open` and
`data-ds-close`, or `DS.tearsheet.open(el, { opener })` and `DS.tearsheet.close(el)`.

- **Opening.** Through `DS.overlay`: the page is inert, the scroll locked, Escape is on the stack. Each open starts
  clean at the first step; focus goes to `[autofocus]`, else the first control of the first step.
- **Steps.** Next checks the current step: the constraint validation of its controls (the first invalid one reports
  its message and takes focus; the rail marks the step `data-status="error"`, with its icon and a hidden word), then a
  cancelable `ds:step` (`{ from, to }`) that the page may refuse with its own check. A change shows the next section
  (it enters with `DS.motion.enter(section, 'swap')`), scrolls the body to its top, focuses the section's heading and
  says "Step 2 of 4: Network" politely. The rail follows: `aria-current="step"` on the current item, `data-status="done"`
  with a drawn check and a hidden ", done" on those before it, the number on the others (`data-status="optional"` stays).
  Back never checks. `ds:change` (`{ step, total }`) follows each change. Enter in a field of a form box goes on to the
  next step, and submits on the last.
- **Submit.** The last step's submit sends a cancelable `ds:submit` (`{ form, data, wait(promise) }`, `data` a
  `FormData` of a form box). A promise given to `wait()` runs with `DS.motion.busy()` on the submit button and
  `data-ds-busy` on the tearsheet (Escape and Cancel wait); a rejection keeps it open with an error snackbar
  (`errorText`, else the string `actionFailed`) and focus on the button. Done, or without `wait()`, it closes with
  reason `submit`. `preventDefault()` keeps it open: the page shows its own message.
- **Unsaved changes.** An `input` or `change` in it (outside `[data-ds-tearsheet-ignore]`) makes it dirty
  (`ds:dirty`, `{ dirty }`). While dirty, the user's closes (Escape, the native cancel, a `[data-ds-close]` in it) ask
  first in a destructive confirm dialog over it: "Discard your changes?", Discard (the one red button, D10) closes it
  with reason `discard`, Keep editing returns to where the user was. Leaving the page asks the browser's own question
  (`beforeunload`). `DS.tearsheet.close(el)` asks too; `close(el, { force: true })` and `DS.overlay.close(el)` do not.
  After a draft was saved, `set({ dirty: false })`.
- **Stacked.** A tearsheet opened from inside another goes on the overlay stack over it: the lighter nested scrim, the
  lower one inert and receding (`data-stacked`), Escape closes only the top one (asking first when it has changes),
  and focus goes back into the lower one. `data-stacked` goes as soon as the upper one starts to close.

**JS API.** `js/tearsheet.js` (`DS.tearsheet`):

- `create(el, { discard, errorText })` returns the controller that `data-ds-tearsheet` makes: `get()` (`{ step, total,
  dirty, open }`), `set(n)` (a step, without checking) or `set({ step, dirty })`, `next()` and `back()` (resolve whether
  they moved), `close({ force })`, `on(type, fn)` (`step`, `change`, `submit`, `dirty`, `open`, `close`) and `destroy()`.
  `discard` holds the texts of the question (`title`, `text`, `confirmLabel`, `cancelLabel`).
- `open(el, { opener, step })` opens it (at `step`, else the first); `close(el, { force, reason })` closes it, asking
  first while dirty, and resolves whether it closed.
- `stepIndex(to, total)` and `statuses(total, current, errors)` are the arithmetic of the steps and the rail.

### Keyboard, names and forced colours

- Keyboard: focus moves in at once and Tab stays inside; Escape closes (asking first with changes); Enter in a field
  goes to the next step; the heading of a new step takes focus, so the reading starts there.
- Names and roles: `aria-labelledby` the title on the `<dialog>` (or the div markup's box); the rail is a `<nav>` with
  a name and its list says the current step with `aria-current="step"`; each step section is labelled by its heading.
- Forced colours: the box keeps the dialog's transparent border as its edge; the hairlines of head, rail and foot are
  borders and stay; the rail's marks take the [steps](#steps) system colours.

### Hooks

`--ds-tearsheet-width`, `--ds-tearsheet-width-narrow`, `--ds-tearsheet-gap`, `--ds-tearsheet-padding`,
`--ds-tearsheet-rail-width`, `--ds-tearsheet-radius` ([theming.md](theming.md#component-hooks)), and the dialog's
`--ds-dialog-scrim`, `--ds-dialog-border` and `--ds-dialog-shadow`.

**Motion:** the scrim fades in while the box rises its full height from the bottom edge over `--ds-dur-long` on
`--ds-ease-out` (a box as tall as the window would show the page under it if it sprang past its rest), fading in over
`--ds-dur-fast`; it drops back in `--ds-dur-base`, accelerating. A tearsheet that becomes stacked recedes to
`--ds-scale-enter` and up by `--ds-distance-lg` on the spring over `--ds-dur-slow`, and comes back the same way. A step
enters with the swap of `DS.motion.enter()`. By hand (no `data-state`) the keyframes `ds-lift-in` and `ds-drop-out`
with the fades.
