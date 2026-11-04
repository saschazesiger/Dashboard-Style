## Secret field

A value the server keeps and never sends back to the page (an API key, a token, the password of a mail server): the
field says that one is set, without the value, and offers to replace or clear it. `DS.secret` switches its parts.

```html
<div class="ds-field ds-secret" data-ds-secret="set">          <!-- "set": one is stored; "": none yet -->
  <label class="ds-field__label" for="key">API key</label>
  <div class="ds-secret__stored">
    <span class="ds-secret__mask" aria-hidden="true">••••••••</span>
    <span class="ds-secret__status"></span>
    <span class="ds-secret__actions">
      <button class="ds-btn ds-btn--text ds-secret__replace" type="button">Replace</button>
      <button class="ds-btn ds-btn--text ds-secret__clear" type="button">Clear</button>
      <button class="ds-btn ds-btn--text ds-secret__undo" type="button">Undo</button>
    </span>
  </div>
  <div class="ds-secret__entry">
    <div class="ds-input-group"><input class="ds-input" id="key" name="api_key" type="password" autocomplete="off" spellcheck="false"></div>
    <button class="ds-btn ds-btn--text ds-secret__cancel" type="button">Cancel</button>
  </div>
  <input type="hidden" name="api_key_action" data-ds-secret-action>
</div>
```

The mask is the page's fixed text (never the real length). The field never holds the stored value: render
`data-ds-secret="set"` and an empty input.

**States.** `data-state` on `.ds-secret` is written by the system and decides which parts show:

| State | Shows | The hidden input says |
|---|---|---|
| `empty` | the entry, without Cancel; the status "Not set" (for a reader) | `set` once something is typed, else `keep` |
| `set` | the stored box: the mask, "Set", Replace and Clear | `keep` |
| `replace` | the entry, empty, with Cancel | `set` once something is typed, else `keep` |
| `clear` | the mask struck through, "Removed when you save" in the warning ink, Undo | `clear` |

Before the script runs only the entry shows, so the field still works as a plain password field. The server reads
`[data-ds-secret-action]` on save: `keep` leaves the stored value, `set` stores the field's value, `clear` removes it.
After a save, render `data-ds-secret` again (a change applies at once) or call `set('set')`.

**Options** ([options.md](options.md)).

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the field or any ancestor | the stored box like a field: 8px of height and 4px of padding per step; its text buttons 8px lower than the box |
| Density | `.ds-density-*` | any container | 4px of height per step |
| Shape | `.ds-shape-*` | any container or the theme | the box's corners (the field's radius) |
| Touch | `.ds-touch` | the theme or a container | the box and its buttons at least `--ds-touch-target` |
| Tone | | | none; the status is words |

**Behaviour.** `DS.init()` finds `data-ds-secret`.

- Replace shows the empty entry and moves the focus into it; Cancel or Escape in it goes back to `set` (Escape there
  never closes a dialog around it) and focuses Replace.
- Clear strikes the mask through and focuses Undo; Undo goes back to `set` and focuses Replace.
- Every change of state but Replace is announced with the status words (`secretSet`, `secretNotSet`,
  `secretCleared`), and `ds:change` with `{ state, action }` goes out on the field. A form `reset` returns to the
  first state.
- The input is `disabled` while the stored box shows, so a form never posts an empty value for it.

**JS API.**

```js
const key = DS.secret.create(field, { stored: true });   // or DS.core.get(field, 'secret')
key.get();                  // { state: 'set', stored: true, action: 'keep' }
key.set('clear');           // 'empty', 'set', 'replace' or 'clear'
key.on('change', ({ state, action }) => markDirty());
DS.secret.action('replace', 'ex_new_key');   // 'set'
```

`DS.secret.create` returns the controller (`get`, `set`, `on`, `update`, `destroy`); `DS.secret.action` is the rule
behind the hidden input.

**Accessibility.** Replace, Clear and Undo keep their short names; the system describes them by the field's label
and the status (`aria-describedby`), so "Replace" says which secret and that it is set. The mask is `aria-hidden`.
Give the input `autocomplete="off"` (or `new-password` for a service password) and `spellcheck="false"`.

**Forced colours.** The stored box keeps a `CanvasText` edge (drawn over its content, so the buttons take its whole height); the struck mask and the words say the state.

**Hooks:** the field's (`--ds-input-height`, `--ds-input-padding-x`, `--ds-input-radius`, `--ds-input-font`) and
`--ds-field-warning-color` of [Form](#form).

**Motion:** none; the parts of a state show at once and the focus moves with them.

<!-- changelog
- Secret field (`DS.secret`, `.ds-secret` with `__stored`, `__mask`, `__status`, `__actions`, `__replace`, `__clear`,
  `__undo`, `__entry`, `__cancel`): set, replace and clear states that never show the value, a hidden
  `[data-ds-secret-action]` of keep, set or clear for the server. Strings `secretSet`, `secretNotSet`,
  `secretCleared`.
-->
