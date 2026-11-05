## Type-to-confirm

A destructive action that waits until the name of what goes has been typed: for what cannot be undone and hits more
than a click should (a device with its history, a project, a key in use). It sits in a confirm dialog whose confirm
button is the one red button D10 allows. `DS.typeconfirm` runs it.

```html
<button class="ds-btn ds-btn--outlined" type="button" data-ds-open="#del-dialog">Delete device</button>

<dialog class="ds-dialog" id="del-dialog" role="alertdialog" aria-labelledby="del-title" aria-describedby="del-text">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <form class="ds-dialog__box ds-typeconfirm" data-ds-typeconfirm="LAPTOP-0042">
    <h2 class="ds-dialog__title" id="del-title">Delete LAPTOP-0042?</h2>
    <p class="ds-dialog__text" id="del-text">Its history and its 3 open tickets go with it. This cannot be undone.</p>
    <div class="ds-field">
      <label class="ds-field__label ds-typeconfirm__label" for="del-name"></label>
      <input class="ds-input ds-typeconfirm__input" id="del-name" autocomplete="off" spellcheck="false" autocapitalize="off">
      <small class="ds-field__hint ds-field__hint--error ds-typeconfirm__error" hidden></small>
    </div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close autofocus>Cancel</button>
      <button class="ds-btn ds-btn--filled ds-tone-error ds-typeconfirm__confirm" type="submit">
        <span class="ds-btn__faces"><span class="ds-btn__face">Delete device</span>
          <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Deleting</span></span>
      </button>
    </div>
  </form>
</dialog>
```

```js
dialog.addEventListener('ds:confirm', (event) => event.detail.wait(api.removeDevice(device.id)));
```

**The red button (D10).** `.ds-btn--filled.ds-tone-error` is allowed only here and in the confirm dialog of
[Dialog](#dialog), never on a page; its label names the consequence ("Delete device", never "OK"). Cancel comes first
and takes the first focus.

**Options** ([options.md](options.md)).

| Option | Attribute | Where it applies | Effect |
|---|---|---|---|
| Name | `data-ds-typeconfirm="<name>"` | the root | what must be typed; a change applies at once |
| Case | `data-ds-typeconfirm-case="insensitive"` | the root | the case does not count (the default: it does) |
| Size, density, shape, touch | the option classes | the dialog or any ancestor | the field and the buttons, as in [Form](#form) and [Button](#button); the name keeps the label's size |
| Tone | | | none of its own: the confirm button's error tone is the D10 exception |

**Behaviour.** `DS.init()` finds `data-ds-typeconfirm`.

- An empty `.ds-typeconfirm__label` gets "Type LAPTOP-0042 to confirm" (the string `typeToConfirm`), the name in a
  `.ds-typeconfirm__name` (monospace, a pointer selects it whole). A label with words of its own stays.
- The confirm button is `aria-disabled="true"` (written by the system) until the field holds the name (exact but for
  the outer spaces): it stays in the tab order and the action guard of `DS.motion` blocks it. A submit before that
  (Enter in the field) marks the field `aria-invalid` and keeps the focus there. Pasting is allowed.
- Confirm: `ds:confirm` goes out on the root, cancelable, with `{ name, wait(promise) }`. Without a promise, or once it
  resolves, the dialog closes (`DS.overlay.close(dialog, { reason: 'confirm' })`); while it runs the confirm button is
  busy (`DS.motion.busy`) and the field read-only. A rejection keeps the dialog open with the error's message (else
  `actionFailed`) in `.ds-typeconfirm__error`, linked to the field and announced at once. `preventDefault()` keeps the
  dialog open (the page shows its own message).
- Each time the dialog opens or closes, the field empties and the button waits again. `ds:change` with `{ match }`
  goes out when the match changes.

**JS API.**

```js
const guard = DS.typeconfirm.create(box);   // or DS.core.get(box, 'typeconfirm')
guard.get();                                 // { name: 'LAPTOP-0042', typed: 'LAPTOP', match: false }
guard.set('ROUTER-7');                       // another name
guard.reset();
guard.on('confirm', () => api.removeDevice(device.id));   // a returned promise counts as wait()
DS.typeconfirm.matches(' LAPTOP-0042 ', 'LAPTOP-0042');   // true
```

`DS.typeconfirm.create` returns the controller the attribute path makes (`get`, `set`, `reset`, `on`, `update`,
`destroy`); `DS.typeconfirm.matches` is the rule of the match.

**Accessibility.** `role="alertdialog"` with the title and the consequence as its name and description; the label
says what to type, so a reader hears it on the field. The blocked button keeps its name and is announced as
unavailable; once the name matches it is available. Never block pasting: copying the name is a legitimate way to type
it.

**Forced colours.** The dialog, the field and the buttons are those of [Dialog](#dialog), [Form](#form) and
[Button](#button): the blocked button `GrayText`, the active one a system button; the name is `CanvasText`.

**Hooks:** none of its own.

**Motion:** none of its own: the dialog opens and closes through `DS.overlay`, the busy face is `DS.motion.busy`'s.

<!-- changelog
- Type-to-confirm (`DS.typeconfirm`, `[data-ds-typeconfirm]` with `-case`, `.ds-typeconfirm` with `__label`, `__name`,
  `__input`, `__error`, `__confirm`): a destructive confirmation in a dialog whose filled error button (D10) waits until
  the name is typed, with an async action through `ds:confirm` and `wait()`. String `typeToConfirm`.
-->
