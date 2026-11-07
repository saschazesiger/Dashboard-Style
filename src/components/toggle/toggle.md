## Toggle button and toggle group

A button that stays on or off (`aria-pressed`), and a set of them where one or several are on: a view switch, the
format of a text, a filter that is shown.

```html
<!-- One toggle -->
<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false" data-ds-toggle>
  <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon filter 16]</span><span class="ds-icon-swap__b">[icon check 16]</span></span>Only open
</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-label="Pin" data-tip="Pin" data-ds-toggle>
  [icon pin 20 ds-icon--fillable]
</button>

<!-- One of a set (single), one always on: a toolbar, one tab stop -->
<div class="ds-toggle-group" role="toolbar" aria-label="View" data-ds-toggle-group="single" data-ds-toggle-group-required>
  <button class="ds-btn" type="button" aria-pressed="true" value="list">[icon list 16]List</button>
  <button class="ds-btn" type="button" aria-pressed="false" value="grid">[icon layoutGrid 16]Grid</button>
</div>

<!-- Several of a set (multiple), connected: one pill outline -->
<div class="ds-toggle-group ds-btn-group" role="toolbar" aria-label="Format" data-ds-toggle-group="multiple" data-ds-value="bold">
  <button class="ds-btn ds-btn--icon" type="button" aria-pressed="false" value="bold" aria-label="Bold" data-tip="Bold">[icon bold 20]</button>
  <button class="ds-btn ds-btn--icon" type="button" aria-pressed="false" value="italic" aria-label="Italic" data-tip="Italic">[icon italic 20]</button>
  <button class="ds-btn ds-btn--icon" type="button" aria-pressed="false" value="code" aria-label="Code" data-tip="Code">[icon code 20]</button>
</div>
```

The buttons are `.ds-btn` toggles ([Button](#button) draws on and off: the tint on an outlined, quiet or text button;
the neutral container off and the variant's fill on for a `--filled` or `--tonal` one). `.ds-toggle-group` lays them out
in a row that wraps, `--ds-space-2` apart; with `.ds-btn-group` ([Button group](#button-group)) they join into one pill.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Look | `.ds-btn` variants | each button | outlined (default), `--quiet`, `--text`, `--filled`, `--tonal`; icon only with `--icon` |
| Connected | `.ds-btn-group` | the group | one pill outline, no gap ([Button group](#button-group)) |
| Size | `.ds-xs` ... `.ds-xl` | the group or any ancestor | the buttons' height, padding and type |
| Density | `.ds-density-*` | any container | the buttons' height (4px per step) and the gap, 2px less per step (8px to 2px) |
| Shape | `.ds-shape-*` | any container | the buttons' radius, times `--ds-shape` |
| Touch | `.ds-touch` | the theme or a container | every button at least `--ds-touch-target` high; the gap stays |

Toggles take no tone: on and off are a state, not a status.

### Behaviour: `data-ds-toggle`, `data-ds-toggle-group`

| Attribute | On | Effect |
|---|---|---|
| `data-ds-toggle` | a button | flips `aria-pressed` on its click (pointer, Enter, Space), after the page's own click handlers ran and none called `preventDefault()`; sends `ds:change` (`{ pressed }`) on the button. A button without `aria-pressed` starts off |
| `data-ds-toggle-group="single"` | a container | at most one of its `[aria-pressed]` buttons is on; pressing the one that is on turns it off |
| `data-ds-toggle-group="multiple"` | a container | each button flips on its own |
| `data-ds-toggle-group-required` | the group | single: exactly one is on; pressing it again changes nothing |
| `data-ds-value` | the group | the start: one value (single) or values separated by spaces (multiple); else the markup's `aria-pressed` |
| `data-ds-toggle-group-roving="on"` / `"off"` | the group | one tab stop with the arrow keys, or every button its own tab stop; without it a `role="toolbar"` group is one tab stop and a `role="group"` is not (read at set-up) |

An item's value is its `value` attribute, else its `data-value`, else its position (`"0"`, `"1"` ...). A user change
sends `ds:change` (`{ value, item }`) on the group: `value` is a string or `null` (single) or a list (multiple). A
`disabled`, `aria-disabled` or busy button never changes ([the action guard](#button)). Do not put `data-ds-toggle` on the
buttons of a group: the group serves them.

### JS API

```js
const pin = DS.toggle.create(button, { pressed: false });   // the controller data-ds-toggle makes
pin.get();                                                    // false
pin.set(true);                                                // from the page: no event
pin.on('change', ({ pressed }) => save(pressed));

const view = DS.toggle.group(element, { mode: 'single', required: true, value: 'list' });
view.get();                     // 'list'
view.set('grid');               // single: a value or null; multiple: a list of values
view.on('change', ({ value, item }) => render(value));
DS.get(element, 'toggle-group'); // the controller of a group the attribute set up
DS.toggle.nextPressed(['bold'], 'italic', { mode: 'multiple' });   // ['bold', 'italic']
DS.toggle.parseValue('bold code', 'multiple');                     // ['bold', 'code']
```

`DS.toggle.create(button, options)` and `DS.toggle.group(element, options)` return the controllers the attributes make
(`get`, `set`, `on('change')`, `destroy`; a group also `update`), one per element: on a button or group the attribute
set up they return that controller with their options applied, so a press still flips it once. What the options leave
out, the markup says (`data-ds-toggle-group`, `-required`, `data-ds-value`, the role). `set()` is the page's, so it
sends nothing.
`DS.toggle.nextPressed(pressed, item, { mode, required })` is the pure rule behind a press, and
`DS.toggle.parseValue(value, mode)` reads a `data-ds-value`.

### Accessibility

- Each toggle is a `<button>` with `aria-pressed`; a screen reader says "pressed" or "not pressed" with its name and
  hears the change on its own. Its label never changes with the state ("Pin", not "Pin" / "Unpin"). An icon toggle
  needs `aria-label` and a `data-tip` with the same words.
- A set with arrow keys is a `role="toolbar"` with an `aria-label` (the APG toolbar), one tab stop
  ([`DS.a11y.roving`](core.md)): ArrowLeft and ArrowRight move between the buttons (wrapping), Home and End go to the
  first and the last; Space and Enter press. The stop starts on the button that is on; in a multiple group it rests on
  the last focused button, in a single group Tab comes back to the button that is on. A `role="group"` with an
  `aria-label` keeps every button in the Tab order (a group says nothing about arrow keys), for a few toggles among
  other controls. A single-choice set that reads better as radios (a form value) is a segmented control or radio group
  instead.
- Never by colour alone: on is the tint plus the attribute; give a text toggle an icon that swaps to a check
  (`.ds-icon-swap`: b shows under `aria-pressed="true"`) and an icon toggle a fillable glyph (`.ds-icon--fillable`
  fills while on).
- Forced colours: a toggle that is on is `Highlight` / `HighlightText`, a focused one with a `CanvasText` ring; a
  blocked one `GrayText` ([Button](#button)).

### Hooks

`--ds-toggle-group-gap` (the gap at the comfortable density). The buttons read the button hooks.

**Motion:** the buttons' own: the fill and the label colour fade on `--ds-dur-fast`, the press morph and the ripple;
an icon swap crossfades with a small scale. The group moves nothing.
