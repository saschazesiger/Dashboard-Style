## Code field (one-time code, PIN)

A one-time code from a text message or an authenticator app, or a PIN: one cell per character, with auto-advance,
paste and the browser's one-time-code autofill. `DS.otp` runs the cells.

```html
<div class="ds-field">
  <span class="ds-field__label" id="code-l">Verification code</span>
  <div class="ds-otp" role="group" aria-labelledby="code-l" aria-describedby="code-hint" data-ds-otp>
    <input class="ds-input ds-otp__cell" inputmode="numeric" autocomplete="one-time-code">
    <input class="ds-input ds-otp__cell" inputmode="numeric" autocomplete="off">
    <input class="ds-input ds-otp__cell" inputmode="numeric" autocomplete="off">
    <span class="ds-otp__sep" aria-hidden="true"></span>
    <input class="ds-input ds-otp__cell" inputmode="numeric" autocomplete="off">
    <input class="ds-input ds-otp__cell" inputmode="numeric" autocomplete="off">
    <input class="ds-input ds-otp__cell" inputmode="numeric" autocomplete="off">
    <input type="hidden" name="code">
  </div>
  <small class="ds-field__hint" id="code-hint">We sent it to the phone ending in 42.</small>
</div>
```

The number of cells is the length of the code. The hidden input holds the code for the form; the cells carry no
`name`. `.ds-otp__sep` is an optional gap between two groups of cells (3 + 3, 4 + 4).

**Options** ([options.md](options.md)).

| Option | Classes or attributes | Where it applies | Effect |
|---|---|---|---|
| Type | `data-ds-otp-type="numeric"` (default) or `"alphanumeric"` | the group | which characters a cell takes; alphanumeric upper-cases letters |
| PIN | `data-ds-otp-mask` | the group | the cells become password fields |
| Submit when complete | `data-ds-otp-submit` | the group | the form is submitted (`requestSubmit()`) once every cell is full |
| Error | `aria-invalid="true"` | the group | copied to every cell, which takes the field's error look; add an error hint in words |
| Disabled | `disabled` | every cell, or a disabled fieldset | the field's disabled look |
| Size | `.ds-xs` ... `.ds-xl` | the group or any ancestor | 8px of height and 8px of width per step (40 by 40px at md); in a narrow container a cell gives up to 40% of its width, and on a phone the gaps are 4px, so the code stays on one line |
| Density | `.ds-density-*` | any container | 4px of height per step, 2px less gap |
| Shape | `.ds-shape-*` | any container or the theme | the cells' corners (the field's radius) |
| Touch | `.ds-touch` | the theme or a container | cells at least `--ds-touch-target` high and as wide where there is room (60% of it in a narrow row, so eight cells fit a phone at 360px) |
| Tone | | | none: an error shows through `aria-invalid` and a hint in words |

**Behaviour.** `DS.init()` finds `data-ds-otp`.

- A character the type allows fills the cell and moves the focus to the next; any other is ignored. A cell selects its
  character when it gets the focus, so typing replaces it.
- **Backspace** in a filled cell clears it; in an empty one it clears the cell before and moves there. **Delete** clears
  the cell and stays. **Left** and **Right** move by one cell, **Home** and **End** to the first and the last.
- **Paste and autofill**: several characters arriving in one cell (a paste, the code a phone offers for
  `autocomplete="one-time-code"`) are cleaned (spaces, dashes and characters the type does not allow go; digits of
  other scripts count as digits) and spread from that cell on, or from the first when they fill every cell. Only the
  first cell carries `one-time-code`, so the browser offers the code once.
- The system names every cell that has no name of its own: "Digit 3 of 6" (the strings `otpDigit` and, on an
  alphanumeric code, `otpCharacter`), sets `autocapitalize`, `autocorrect` and spell checking off and, on a PIN, the
  type `password`.
- Events on the group: `ds:change` with `{ value, complete }` after each change, `ds:complete` with `{ value }` when
  the last empty cell is filled. A form `reset` empties the hidden value too.

**JS API.**

```js
const code = DS.otp.create(group);        // or DS.core.get(group, 'otp')
code.get();                               // '1234'
code.set('123456');
code.clear();                             // every cell empty, the first focused (after a wrong code)
code.focus();                             // the first empty cell
code.on('complete', ({ value }) => verify(value));
DS.otp.clean('12 34-56', { type: 'numeric', length: 6 });   // '123456'
```

`DS.otp.create` returns the controller the attribute path makes (`get`, `set`, `clear`, `focus`, `on`, `update`,
`destroy`); `DS.otp.clean` is the cleaning behind paste and `set()`.

**Accessibility.** The group is `role="group"` named by the field's label (`aria-labelledby`) and described by the
hint, so a reader hears "Verification code, group, Digit 1 of 6, edit text". Never move the focus on its own after a
wrong code: say so in an error hint (`aria-invalid` on the group) and let the person clear it, or call `clear()` from
the action they took. A code that expires says when in its hint, not in a countdown that is read aloud.

**Forced colours.** The cells are fields of [Form](#form): the system's edge, a `Highlight` outline on focus; the
separator is a `CanvasText` dash.

**Hooks:** `--ds-otp-cell-width` (40px), `--ds-otp-gap` (8px), `--ds-otp-font` (`--ds-font-subtitle`), and the
field's `--ds-input-focus-color` for the caret ([theming.md](theming.md#component-hooks)).

**Motion:** none of its own; a cell's focus ring is the field's.

<!-- changelog
- Code field (`DS.otp`, `.ds-otp`, `.ds-otp__cell`, `.ds-otp__sep`, `[data-ds-otp]` with `-type`, `-mask` and `-submit`,
  hooks `--ds-otp-cell-width`, `--ds-otp-gap`, `--ds-otp-font`): one-time codes and PINs in n cells, auto-advance,
  paste and one-time-code autofill spread over the cells, the keys of a split field. Strings `otpDigit`,
  `otpCharacter`.
-->
