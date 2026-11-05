## Tag input

Free values typed into one field box, each an input chip before the typing field: labels, recipients, keywords. For
values from a known list use the [Combobox](#combobox) with several values (`data-ds-combobox-creatable` lets it take
new ones too).

```html
<div class="ds-field">
  <label class="ds-field__label" for="labels">Labels</label>
  <div class="ds-taginput" data-ds-taginput data-ds-taginput-max="8" data-ds-value='["printer","floor-2"]'>
    <input class="ds-input ds-taginput__input" id="labels" aria-describedby="labels-hint">
  </div>
  <p class="ds-field__hint" id="labels-hint">Enter or a comma adds a label. Up to 8.</p>
</div>
```

```js
const labels = DS.taginput.create(el, { validate: (text) => /^[a-z0-9-]+$/.test(text) || 'Use small letters, digits and -' });
labels.get();                          // ['printer', 'floor-2']
labels.set(['printer']);               // from the page: no event, no check
labels.add('lab, shared');             // as the user would: checked, announced, ds:change
labels.on('change', ({ value, added, removed }) => save(value));
```

The module writes the chips (`button.ds-chip.ds-chip--input`, with "Remove" and the name for a screen reader) before
the field, and a `.ds-taginput__message` (`role="status"`) after the box, which the field names through
`aria-describedby`.

- **Adding.** Enter or a separator (a comma; `separators`, `data-ds-taginput-separators`) turns the typed text into a
  tag. A pasted text with line breaks, tabs, semicolons or separators becomes several tags at once. Leaving the field
  adds what is typed (`addOnBlur: false` keeps it). An empty Enter submits the form, as in a field.
- **Checks.** Each tag is trimmed; an empty one is dropped. Refused: a repeat (case aside; `unique: false` allows
  them), one that does not match `data-ds-taginput-pattern` (`pattern`, the whole text), one that `validate(text,
  value)` turns down (`false`, or a message of its own), and every tag past the maximum (`data-ds-taginput-max`,
  `max`). A refused text stays typed, the field takes `aria-invalid="true"` and the message says why with an icon
  ("printer is in the list already", "Up to 8 items"), until the text changes. A pasted list adds what passes and keeps
  the rest typed.
- **Removing.** A press on a chip (Enter or Space on it), Backspace in the empty field (the last tag), Backspace or
  Delete on a focused chip. Each change is announced: "Added printer", "Removed printer".
- **At the maximum** the box takes `.ds-taginput--full`: the field stays, so Backspace still removes, and its
  placeholder goes.
- **Value.** `data-ds-value` (a JSON list or comma-separated) or `value`; `data-ds-taginput-name` (`name`) writes hidden
  inputs for a form. `DS.taginput.split(text, separators)` and `DS.taginput.check(text, value, rules)` are the parsing
  and the checks alone.

The controller (`DS.taginput.create(el, options)`, or `DS.get(el)` of `data-ds-taginput`): `get()`, `set(value)`
(no event, no check), `add(text)` (returns the refused text), `remove(tag)`, `on('change' | 'add', fn)` and
`destroy()`. `ds:add` (`{ text }`, cancelable: the text stays typed) comes before each tag, `ds:change`
(`{ value, added, removed }`) after the user changed the tags.

**Options** ([options.md](options.md)): classes on the `.ds-taginput` or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the tag input |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the box or any ancestor | the box 24 to 56px (40px at md, 8px per step), as a field; the chips follow their own size |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the box 4px less per step |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the box's radius times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | the box at least `--ds-touch-target` (48px) |
| Tone | none | | a refused tag is `aria-invalid` with its message, never a colour |

**States.** `disabled` on the field greys the box, disables the chips and takes their pointer; `readonly` shows the
read-only look and the tags as plain chips (no cross, no "Remove", no pointer); `aria-invalid="true"` (the page's, or the module's for a refused tag) draws the
error edge.

**Keyboard and names.** The field is the one tab stop; the chips are reached by the arrows: ArrowLeft at the start of
the field goes to the last chip, ArrowLeft and ArrowRight walk the chips, ArrowRight past the last one and End go back
to the field, Home to the first chip. On a chip Enter, Space, Backspace and Delete remove it; the focus goes to the
neighbouring chip (Backspace: the one before), else the field. Label the field with its `<label>`; the chips' names say
"Remove printer".

**Forced colours.** The box keeps its border and takes the 2px `Highlight` outline of a focused field; a disabled one
is `GrayText`; the input chips keep their edge; the message is `CanvasText` with its icon.

**Hooks:** the field's `--ds-input-height`, `--ds-input-border`, `--ds-input-bg`, `--ds-input-radius` and
`--ds-input-focus-color` ([Form](#form)).

**Motion:** a new chip fades in, and a chip that goes leaves while the others glide into its place (`DS.motion.flip`,
the chip rows of [Controls](motion.md#controls)); the message fades in over `--ds-dur-fast`.

<!-- changelog -->
- Tag input (3.0): `.ds-taginput` with `DS.taginput` (`data-ds-taginput`): free tags as input chips, Enter, a comma or a
  pasted list, checks (unique, pattern, `validate`, max) with a message, removal by Backspace, Delete or a press, the
  arrow keys across the chips, announcements; `DS.taginput.split` and `DS.taginput.check`.
