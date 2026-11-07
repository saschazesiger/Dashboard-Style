## Inline edit

One value changed where it is shown: the text turns into a field in place, Enter saves and Escape leaves it. For a
whole record use a form; for a single name, a room or a note in a list of facts, this. `DS.inlineedit` runs it.

```html
<div class="ds-inlineedit" data-ds-inlineedit>
  <div class="ds-inlineedit__view">
    <span class="ds-inlineedit__value">LAPTOP-0042</span>
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-inlineedit__edit" type="button" aria-label="Edit device name">[icon pencil 18]</button>
  </div>
  <div class="ds-inlineedit__form">
    <input class="ds-input ds-inlineedit__input" aria-label="Device name" required maxlength="40">
    <span class="ds-inlineedit__actions">
      <button class="ds-btn ds-btn--tonal ds-sm ds-inlineedit__save" type="button">
        <span class="ds-btn__faces"><span class="ds-btn__face">Save</span>
          <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Saving</span></span>
      </button>
      <button class="ds-btn ds-btn--text ds-sm ds-inlineedit__cancel" type="button">Cancel</button>
    </span>
  </div>
  <small class="ds-field__hint ds-field__hint--error ds-inlineedit__error" hidden></small>
</div>
```

```js
root.addEventListener('ds:save', (event) => event.detail.wait(api.rename(device.id, event.detail.value)));
```

The field may be an input, a textarea or a select. Keep the buttons `type="button"` and the parts out of a `<form>` of
their own, so the component can sit inside a page's form.

**Options** ([options.md](options.md)).

| Option | Attribute or class | Where it applies | Effect |
|---|---|---|---|
| Value | `data-ds-value` | the root | the value the field gets, when the shown text differs (a formatted figure); the system keeps it after a save, and the shown text is the page's (below) |
| Blur | `data-ds-inlineedit-blur="keep"` (default), `"save"`, `"cancel"` | the root | what happens when the focus leaves the whole component while the field is open |
| Trim | `data-ds-inlineedit-trim` | the root | compares and saves without the outer spaces |
| Size | `.ds-xs` ... `.ds-xl` | the component or any ancestor | the view as high as the field (8px per step); the field and buttons follow their own models |
| Density | `.ds-density-*` | any container | 4px per step |
| Shape | `.ds-shape-*` | any container or the theme | the field and the buttons |
| Touch | `.ds-touch` | the theme or a container | the view, the field and the buttons at least `--ds-touch-target` |
| Tone | | | none: an error shows in words |

**Behaviour.** `DS.init()` finds `data-ds-inlineedit`. `data-state` (`view`, `edit`) and `aria-busy` on the root are
written by the system; the view or the form shows by them (before the script runs, the view).

- **Open**: the edit button, or a click on the value, shows the field with the value selected and focused
  (`ds:edit` with `{ value }`).
- **Save**: Enter in an input (Ctrl+Enter or Cmd+Enter in a textarea), or Save. An unchanged value only closes. A field
  that fails its own constraints (`required`, `pattern`, `maxlength` ...) shows its validation message as the error and
  stays open. Otherwise `ds:save` goes out, cancelable, with `{ value, previous, wait(promise) }`: hand the save's
  promise to `wait()` and the save button is busy (`DS.motion.busy`) and the field read-only until it settles. Resolved
  (or no promise): the new value shows, the focus returns to the edit button and "Saved" is announced (the string
  `saved`). Rejected: the field stays open with the error (the error's message, else the string `actionFailed`) in
  `.ds-inlineedit__error`, linked to the field (`aria-describedby`), announced at once, the field focused again;
  typing takes the error away. `preventDefault()` keeps the field open without an error (the page shows its own).
- **Formatted values** (`data-ds-value`): a save writes the new value into `data-ds-value`, and the shown text only when
  the page gives it: a save's promise that resolves to `{ text }` (`wait(api.save(v).then(() => ({ text: fmt(v) })))`)
  or `set(value, { text })`. Without one the page rewrites `.ds-inlineedit__value` itself, so a formatted figure never
  turns into the raw value. Without `data-ds-value` the shown text is the value.
- **Cancel**: Escape in the field (a dialog around it stays open) or Cancel: the value stays, the focus returns to the
  edit button (`ds:cancel` with `{ value }`).
- Names: an edit button without a name is called "Edit" (the string `edit`) and described by the value; a save button
  without words is called "Save" (`save`).

**JS API.**

```js
const name = DS.inlineedit.create(root);    // or DS.core.get(root, 'inlineedit')
name.get();                                 // { value: 'LAPTOP-0042', editing: false, busy: false }
name.set('LAPTOP-0043');                    // another value from the server
price.set('1300', { text: '1,300.00 €' });  // with data-ds-value: the value and its shown text
name.edit();  name.save();  name.cancel();
name.on('save', ({ value }) => api.rename(device.id, value));   // a returned promise counts as wait()
DS.inlineedit.decide(' Room B ', 'Room A', { trim: true });     // { action: 'save', value: 'Room B' }
```

`DS.inlineedit.create` returns the controller the attribute path makes (`get`, `set`, `edit`, `save`, `cancel`, `on`,
`destroy`); `DS.inlineedit.decide` is the rule of a save.

**Accessibility.** Name the edit button by what it edits ("Edit device name") and the field like its label
(`aria-label`, or a `<label for>` outside the component). The edit button always shows: one that appears on hover
cannot be reached on a touch screen. The value is plain text for a reader; the button carries the action. Focus never
gets lost: it moves into the field and back to the edit button.

**Forced colours.** The field and the buttons are [Form](#form)'s and [Button](#button)'s; the error is words with
an icon.

**Hooks:** `--ds-inlineedit-field-min` (12rem), and the field's `--ds-input-height` for the view's height
([theming.md](theming.md#component-hooks)).

**Motion:** none of its own: the view and the field swap at once and the focus moves with them; the save button's
busy face is `DS.motion.busy`'s, the error message enters as every field error.

<!-- changelog
- Inline edit (`DS.inlineedit`, `.ds-inlineedit` with `__view`, `__value`, `__edit`, `__form`, `__actions`, `__error`,
  `[data-ds-inlineedit]` with `-blur` and `-trim`, hook `--ds-inlineedit-field-min`): a value that turns into a field
  in place, Enter and Escape, an async save through `ds:save` and `wait()` with a busy button and an error in words.
  Strings `edit`, `save`, `saved`.
-->
