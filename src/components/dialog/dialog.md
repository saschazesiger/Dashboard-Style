## Dialog

A modal box for a decision or a short task: the page waits until it is done.

Native markup (preferred): `showModal()` makes the page inert and gives the dialog its modal semantics, so the box
carries no role.

```html
<dialog class="ds-dialog" role="alertdialog" aria-labelledby="del-title" aria-describedby="del-text">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="del-title">Delete 3 devices?</h2>
    <p class="ds-dialog__text" id="del-text">They disappear from every list. This cannot be undone.</p>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close autofocus>Cancel</button>
      <button class="ds-btn ds-btn--filled" type="button">Delete devices</button>
    </div>
  </div>
</dialog>
```

Div markup (fallback, and the only markup for `.ds-dialog--contained`): the same tree in
`<div class="ds-dialog" hidden>`, with the roles on the box: `<div class="ds-dialog__box" role="alertdialog"
aria-modal="true" aria-labelledby="del-title" aria-describedby="del-text">`.

Declaratively, without a script of your own (3.0): `data-ds-open` on the button opens it, with the button as its opener,
and `data-ds-close` inside it closes it. `data-ds-close="#id"` closes one from outside, and `[data-ds-open]` works on a
sheet and a menu too. `data-close` is the **deprecated** 2.x name of `data-ds-close` and works until 3.0 ships, and so does the event
`'ds-close'`, next to `ds:close`.

```html
<button class="ds-btn" type="button" data-ds-open="#del-dialog">Delete</button>
<dialog class="ds-dialog" id="del-dialog" data-ds-dialog aria-labelledby="del-title"> ... </dialog>
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-dialog--sm`, the default, `.ds-dialog--lg`, `.ds-dialog--xl` | the dialog | the width of the box: 320px, 400px, 560px, 720px (never wider than the window). A size class (`.ds-sm`) on it would change every control inside, so the dialog has these instead. `.ds-dialog--wide` is the **deprecated** name of `.ds-dialog--lg`, and the hook `--ds-dialog-width-wide` of `--ds-dialog-width-lg`, until 3.0 ships |
| Full screen | `.ds-dialog--full`; `.ds-dialog--full-narrow` | the dialog | the box fills the window; `--full-narrow` only at 600px and below |
| Action sheet | `.ds-dialog--bottom` | the dialog | the box sits at the bottom edge |
| Contained | `.ds-dialog--contained` | the dialog, div markup | it covers its positioned container |
| Density | `.ds-density-*` | the dialog or any ancestor | the box's padding and the gap of its parts (2px per step), the full-screen head's height (4px per step) |
| Shape | `.ds-shape-*` | the dialog or any ancestor | multiplies the box's radius |
| Touch | `.ds-touch` | the dialog or any ancestor | reaches the controls inside; the box itself has no target |
| Tone | `.ds-tone-error` | the filled button of a destructive confirmation only (D10) | the one red button; `DS.overlay.confirm({ destructive: true })` sets it. Everything else about a dialog is neutral |

The private values (`--_pad`) are computed in the rule that uses them; set the hooks instead.

### A form dialog

The box is the `<form>`, so Enter submits and the browser's validation runs first. A submit sends a cancelable
`ds:submit` (`detail: { form, data }`, a `FormData`) on the dialog and closes it with reason `submit`, unless a listener
calls `preventDefault()`. For work that takes time, `DS.dialog.form(dialog, { onSubmit, errorText })` runs
`onSubmit(data, form)` as `confirm()` runs `onConfirm`: `DS.motion.busy()` on the submit button and `data-ds-busy` on
the dialog; a rejection keeps it open with an error snackbar and focus on that button.

```html
<dialog class="ds-dialog" id="rename" aria-labelledby="rename-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <form class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="rename-title">Rename the device</h2>
    <div class="ds-dialog__body">
      <div class="ds-field"><label class="ds-field__label" for="rename-name">Name</label>
        <input class="ds-input" id="rename-name" name="name" required autofocus></div>
    </div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
      <button class="ds-btn ds-btn--filled" type="submit">Save</button>
    </div>
  </form>
</dialog>
```

### Behaviour

- Open and close with `DS.overlay.open(dialog, { opener: button })` and `DS.overlay.close(dialog)`
  ([motion.md](motion.md#dsoverlay-jsoverlayjs)): focus moves in at once (`autofocus` marks the intended first focus,
  Cancel in a destructive `alertdialog`; else the first focusable element), the page is inert (the div markup in a
  shadow root makes the host page inert too, and so are elements the page adds while it is open), Escape and
  `[data-ds-close]` close, the scroll lock counts (it stops the page from scrolling with `.ds-base` on `<html>`; not in an
  embedded widget, see [theming.md](theming.md), "Embedded in someone else's page"), and focus is back on the opener in the frame of the close. The dialog
  must sit inside the `.ds-theme` element (`DS.overlay` warns otherwise).
- Motion: the scrim fades while the box fades, grows from `--ds-scale-enter` and rises `--ds-distance-sm` on the
  spatial spring (`--ds-dur-slow`), from an origin towards its opener; it leaves the same way back in `--ds-dur-base`,
  accelerating. It runs on transitions keyed on `data-state`, so a close taken back mid-way continues from where the
  box is. At 600px and below the box decelerates instead of springing (no overshoot past the window).
- **Above the on-screen keyboard** (2.1.1). With `DS.dom.followViewport()` on the page every dialog keeps clear of the
  keyboard (`--ds-keyboard-inset`): a centred box centres in the window above it, a full-screen box (`--full`, and
  `--full-narrow` on phones) ends at its top edge, the action sheet (`--bottom`) sits on it and a contained box sticks
  above it; the scrim keeps covering the whole window. A box taller than the room left scrolls its body.
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

### Body, width and height

A dialog whose content can be taller than the window (a form, a long list) puts it in `.ds-dialog__body`: the box
turns into a column, only the body scrolls, and title and actions stay in view. The body reaches 12px into the box's
padding (focus rings and the halos of checks are never clipped) and shows a hairline at its top while it is scrolled
(`data-scrolled` on the box: `DS.overlay.open()` watches every body with `DS.dom.watchScrolled()` on its first open,
2.0; a dialog shown without `DS.overlay` calls `DS.dom.watchScrolled(body)` once). A body that scrolls with nothing focusable in it
gets `tabindex="0"`, `role="region"` and a name, so the keyboard can scroll it (an inset ring). In a window 320px high
or less the box scrolls as one instead (WCAG 1.4.10). An empty body (its sentinel aside) or empty actions take no room; a body of bare text
(no element around it) stays, as `watchScrolled()` marks it `data-ds-text`. A lone `.ds-btn`
directly in the body keeps its own width.

```html
<dialog class="ds-dialog ds-dialog--lg" aria-labelledby="own-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="own-title">Choose an owner</h2>
    <div class="ds-dialog__body"> ... a form or a list ... </div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
      <button class="ds-btn ds-btn--filled" type="button">Choose</button>
    </div>
  </div>
</dialog>
```

`.ds-dialog--lg` makes the box `--ds-dialog-width-lg` (560px) wide. `--ds-dialog-height` (default `auto`, never
taller than the window) fixes the box's height, so a list that filters does not make the box jump.

**A search over a list.** A `.ds-search` between the title and the body, a `.ds-meta` count after it ("12 of 40
people"), the list in the body, Choose `aria-disabled="true"` with a `data-tip` until a row is chosen, and
`--ds-dialog-height` on the dialog. Filter through `DS.dom.morphHtml` inside `DS.motion.flip`, so the rows glide; with
no match the body shows a `.ds-empty` that enters with `DS.motion.enter(empty, 'fade')`. Escape in the filled search
clears it first; the next Escape closes the dialog.

```js
search.addEventListener('input', () => {
  const rows = people.filter((person) => person.name.toLowerCase().includes(search.value.trim().toLowerCase()));
  DS.motion.flip(list, () => DS.dom.morphHtml(list, rows.length ? rows.map(rowHtml).join('') : emptyHtml));
  count.textContent = `${rows.length} of ${people.length} people`;
});
```

**Steps in one dialog** (choose, then confirm): keep the box's height through the CSSOM
(`box.style.setProperty('height', box.offsetHeight + 'px')`), swap the body's content and play
`DS.motion.enter(body, 'swap')`, focus the second step's primary action and announce the step (a `.ds-sr` live
region, or a snackbar); remove the height once the second step settled.

### Full screen and the action sheet

`.ds-dialog--full` fills the window (no padding around the box, radius `--ds-dialog-full-radius`, 0; safe areas on
head and actions); `.ds-dialog--full-narrow` does so at 600px and below and is a normal dialog above. Its head,
`.ds-dialog__head`, is the M3 full-screen top bar: a close icon button with `data-ds-close`, the title, an optional text
button at the end (the head may also be used in a normal dialog). The box rises `--ds-distance-lg` on the spring over
`--ds-dur-long` with the fade, no scale, and drops back in `--ds-dur-base`.

```html
<dialog class="ds-dialog ds-dialog--full-narrow" aria-labelledby="new-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <div class="ds-dialog__head">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
      <h2 class="ds-dialog__title" id="new-title">New ticket</h2>
      <button class="ds-btn ds-btn--text" type="button">Save</button>
    </div>
    <div class="ds-dialog__body"> ... the form ... </div>
  </div>
</dialog>
```

`.ds-dialog--bottom` is the action sheet: the box sits at the bottom edge (above the home indicator) and rises its
full height on the spring; it drops back in `--ds-dur-base`. `.ds-dialog__list` lays [menu](#menu) items full bleed
in the box, and `DS.overlay` moves focus through them with ArrowUp, ArrowDown, Home and End, as in a menu. A menu at a
desk and an action sheet at 600px and below can share the item markup:

```html
<dialog class="ds-dialog ds-dialog--bottom" aria-labelledby="row-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="row-title">LAPTOP-0042</h2>
    <div class="ds-dialog__list">
      <button class="ds-menu__item" type="button">[icon pencil 20]<span class="ds-menu__label">Edit</span></button>
      <button class="ds-menu__item" type="button">[icon archive 20]<span class="ds-menu__label">Archive</span></button>
    </div>
    <div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button></div>
  </div>
</dialog>
```

```js
const phone = matchMedia('(max-width: 600px)');
rowButton.addEventListener('click', () => DS.overlay.open(phone.matches ? actionSheet : rowMenu, { opener: rowButton }));
```

Forced colours: the full-screen box is the window and needs no edge; the action sheet keeps the box's transparent
border.

### A question with yes or no

`DS.overlay.confirm()`, `alert()` and `prompt()` build the dialog for you (DOM APIs only, inside the opener's
`.ds-theme`), open it through `DS.overlay.open()`, remove it after its exit and resolve with the answer
([motion.md](motion.md#dsoverlay-jsoverlayjs)):

```js
const ok = await DS.overlay.confirm({
  title: 'Delete 3 devices?', text: 'They disappear from every list.',
  confirmLabel: 'Delete devices', destructive: true, opener: button,
  onConfirm: () => api.removeDevices(ids),          // busy on the button, the dialog stays open meanwhile
  errorText: 'Could not delete the devices.',       // a failure keeps it open with this error snackbar
});
const name = await DS.overlay.prompt({ title: 'Rename', label: 'Name', value: device.name, opener: button });
await DS.overlay.alert({ title: 'Export ready', text: 'The file is in your downloads.', opener: button });
```

`destructive: true` makes it an `alertdialog` whose first focus is Cancel, and its confirm button filled in the error
tone (`.ds-btn--filled.ds-tone-error`, D10: the one red button, and only here and in the type-to-confirm pattern); the
button's label names the consequence, so the colour is never alone. `onConfirm` runs with `DS.motion.busy()` on the confirm button and
`data-ds-busy` on the dialog (Cancel `aria-disabled`); when it rejects, the dialog stays open, `errorText` (default
"That did not work. Try again."; never the raw error) shows as an error snackbar above it, and focus goes back to the
confirm button. `confirm()` resolves `true` or `false`, `prompt()` the value or `null`; Enter in the prompt's field
confirms. A prompt whose `input.required` field is left empty stays open with the field error of the form section:
`aria-invalid`, a `.ds-field__hint--error` with its icon and `requiredText` (default "Enter a value."), linked by
`aria-describedby` and announced at once; typing takes it away. The defaults are English: "Confirm", "Cancel", "OK".

### Confirm by typing the name

For an action that cannot be undone: an `alertdialog`, `.ds-dialog--lg`, a body with the text, a
`.ds-alert--warning` and a field ("Type LAPTOP-0042 to confirm", `autocomplete="off"`, `spellcheck="false"`,
`autocapitalize="off"`, `autofocus`). The action stays `aria-disabled` with a tip until `value.trim()` equals the name;
Enter (not while composing) runs it. While it works: `data-ds-busy` on the dialog, the field `readOnly`, Cancel
`aria-disabled`, and `DS.motion.busy(action, work, { done: false })`. Success closes it with reason `confirm` and a
snackbar; a failure keeps the value, shows an error snackbar above the dialog and focuses the field. The action may
take the error tone (D10).

```js
field.addEventListener('input', () => action.setAttribute('aria-disabled', String(field.value.trim() !== name)));
field.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.isComposing) run(); });
action.addEventListener('click', run);
async function run() {
  if (field.value.trim() !== name || dialog.hasAttribute('data-ds-busy')) return;
  dialog.setAttribute('data-ds-busy', '');
  field.readOnly = true;
  cancel.setAttribute('aria-disabled', 'true');
  try { await DS.motion.busy(action, deleteDevice(name), { done: false }); }
  catch { DS.overlay.toast(region, `Could not delete ${name}.`, { kind: 'error' }); field.focus(); return; }
  finally { dialog.removeAttribute('data-ds-busy'); field.readOnly = false; cancel.removeAttribute('aria-disabled'); }
  DS.overlay.close(dialog, { reason: 'confirm' });
  DS.overlay.toast(region, `${name} deleted.`);
}
```

### While its action runs

`data-ds-busy` on the dialog (2.0; set and removed by the page, never written by the system) keeps it open while its
action runs: Escape, the native `cancel`, `[data-ds-close]` (the backdrop included) do nothing, while
`DS.overlay.close(dialog)` still closes. Nothing changes visibly: the busy button is the feedback, Cancel is
`aria-disabled` with a `data-tip`. The same attribute works on the side sheet and the modal drawer.

```js
remove.addEventListener('click', async () => {
  dialog.setAttribute('data-ds-busy', '');
  cancel.setAttribute('aria-disabled', 'true');
  try { await DS.motion.busy(remove, removeDevices(), { done: false }); }
  catch { DS.overlay.toast(region, 'Could not delete the devices.', { kind: 'error' }); return; }
  finally { dialog.removeAttribute('data-ds-busy'); cancel.removeAttribute('aria-disabled'); }
  DS.overlay.close(dialog, { reason: 'confirm' });
});
```

Limits: a morph that drops the attribute frees the dialog (render it, or set it on an element that is not morphed);
Android Back can still force a native close (it follows with reason `escape`); never set `closedby` on a dialog that
`DS.overlay` drives; a `<form method="dialog">` submit closes natively (give its buttons `type="button"`).

- **Why it closed.** Every close sends `ds:close` (and `ds-close`, its **deprecated** 2.x name) with `detail.reason` (`escape`, `backdrop`, `close`, `api`, your own
  string from `close(dialog, { reason })` ...; [motion.md](motion.md#dsoverlay-jsoverlayjs)), once, as soon as it starts.
  It bubbles: a listener on the dialog also hears the menus, lists and dialogs inside it, so check
  `event.target === dialog`.
- **Focus back.** Give row buttons that open a dialog stable `id`s: when a re-render replaced the opener, focus goes to
  the element that now has its `id`; `open(dialog, { opener, returnTo: () => element })` names another place.
- **A double click on the opener** never closes the dialog it opened: a backdrop click closes only as the first click
  of a press that began on it, from `--ds-delay-dismiss` after the open.
- **An opener with `aria-expanded`** (a button that says it shows a dialog, `aria-haspopup="dialog"`) is kept in step:
  `"true"` while it is open, `"false"` as soon as the close starts. An opener without the attribute gets none.

### Keyboard, names and forced colours

- Keyboard: focus moves in at once (`autofocus`, else the first focusable element, else the box); Tab stays inside;
  Escape closes the top layer, after the page's own handlers (a filled search takes the first Escape); Enter in a form
  dialog submits; in `.ds-dialog__list`, ArrowUp, ArrowDown, Home and End move through the rows.
- Names and roles: `aria-labelledby` the title (`aria-describedby` the text, for an `alertdialog`), on the native
  `<dialog>` or on the box of the div markup, which also takes `role` and `aria-modal="true"`. A destructive question is
  an `alertdialog`.
- Forced colours: the box's transparent border (`--ds-dialog-border`) becomes its edge; the full-screen box is the
  window and needs none; the error-tone button takes the system colours, so its label carries the meaning.

### Hooks

`--ds-dialog-width`, `--ds-dialog-width-sm`, `--ds-dialog-width-lg`, `--ds-dialog-width-xl`, `--ds-dialog-padding`,
`--ds-dialog-radius`, `--ds-dialog-head-height`, `--ds-dialog-height`, `--ds-dialog-border`, `--ds-dialog-shadow`,
`--ds-dialog-scrim`, `--ds-dialog-full-radius` ([theming.md](theming.md#component-hooks)). `data-ds-dialog` marks a
dialog that `DS.get(el, 'dialog')` serves.

**JS API.** `js/dialog.js` (`DS.dialog`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`; `confirm(options)`, `alert(options)` and `prompt(options)` are also `DS.overlay.confirm()`, `alert()` and `prompt()`; `form(el, { onSubmit, errorText })` runs a form dialog's submit; `create(el)` returns the controller that `data-ds-dialog` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`).

**Motion:** the "Scrim", "Dialog", "Nested dialog", "Dialog on a phone", "Full-screen dialog" and "Action sheet" rows of [Overlays](motion.md#overlays) in motion.md.

<!-- changelog -->
- Dialog (3.0): behaviour in `js/dialog.js` (`DS.dialog`), `DS.overlay.confirm()`, `alert()` and `prompt()` keep their
  names. Sizes `.ds-dialog--sm`, `--lg` and `--xl`; `--wide` is deprecated. Form dialog: `form.ds-dialog__box`,
  `ds:submit`, `DS.dialog.form()`. Density and shape on the box. `confirm({ destructive: true })` fills its button in
  the error tone (D10). `data-ds-open`, `data-ds-close`; `data-close` and the event `ds-close` are deprecated
  (`ds:close`, `ds:open`).

