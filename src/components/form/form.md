## Form

Everything that collects input: labelled fields in three looks, slots inside a field, states in words, checkboxes,
radios and their cards, fieldsets and form sections, filters and an action bar. Labels stay above their fields.

```html
<form class="ds-form">
  <div class="ds-form-grid">                <!-- 3 columns, the first wider; ds-form-grid--2: two; ds-form-grid--3: three equal -->
    <div class="ds-field">
      <label class="ds-field__label" for="name">Name</label>
      <input class="ds-input" id="name" name="name" aria-describedby="name-hint">
      <small class="ds-field__hint" id="name-hint">As printed on the label.</small>
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="type">Type</label>
      <select class="ds-input" id="type"><option>Laptop</option><option>Desktop</option></select>
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="bought">Bought</label>
      <input class="ds-input" id="bought" type="date">
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="serial">Serial</label>
      <input class="ds-input" id="serial" aria-invalid="true" aria-describedby="serial-error">
      <small class="ds-field__hint ds-field__hint--error" id="serial-error">[icon alertCircle 16]Already in use.</small>
    </div>
    <div class="ds-field ds-field--full">
      <label class="ds-field__label" for="notes">Notes</label>
      <textarea class="ds-input" id="notes"></textarea>
    </div>
  </div>

  <label class="ds-check"><input type="checkbox" name="managed" checked><span>Managed</span></label>
  <small class="ds-field__hint">Updates install automatically.</small>
  <label class="ds-check ds-sm"><input type="checkbox" name="clear"><span>Delete the saved key</span></label>

  <input class="ds-checkbox" type="checkbox" aria-label="Select all">       <!-- a checkbox anywhere -->
  <input class="ds-radio-input" type="radio" name="size" aria-label="Small"> <!-- a radio anywhere -->

  <div class="ds-radios" role="radiogroup" aria-label="Plan">
    <label class="ds-radio"><input type="radio" name="plan" value="basic" checked>
      <span><strong>Basic</strong><small>Inventory only.</small></span></label>
    <label class="ds-radio ds-radio--disabled"><input type="radio" name="plan" value="pro" disabled>
      <span><strong>Pro</strong><small class="ds-radio__note">[icon alert 16]Needs a licence.</small></span></label>
  </div>

  <button class="ds-btn ds-btn--text ds-add-row" type="button">[icon plus 16] Add a row</button>

  <div class="ds-form-actions">
    <button class="ds-btn ds-btn--filled" type="submit">Save</button>
    <button class="ds-btn ds-btn--text" type="button">Cancel</button>
    <p class="ds-meta">Last saved today, 09:12</p>
  </div>
</form>
```

**Options** ([options.md](options.md)): classes on the control or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-field--outlined` (default), `.ds-field--filled`, `.ds-field--inset`; on one control `.ds-input--outlined`, `.ds-input--filled`, `.ds-input-group--filled` | the field, or one control | the look: an outline, the tonal fill, the tonal box with the label inside |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | a control, a field, a form | fields 24, 32, 40, 48, 56px high (8px per step), side padding 4px per step, the size's type role at the regular weight (16px on phones at every size); a `.ds-check` row and the halo 8px per step, the box 2px per step; labels and hints keep their roles |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (fields, groups, the inset box, `.ds-check` rows, halos); 2px less padding per step on cards; side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius of fields, the search pill, checkboxes, the check list and the cards times 0, .5, 1, 1.5; a card's press morph too. A radio stays round |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) whatever the size and density, a minimum and no addition (`.ds-lg` stays 48px, `.ds-xl` 56px): fields, `.ds-check` rows, cards, halos; field text at `--ds-font-input`. A halo is painted: a bare `.ds-checkbox` or `.ds-radio-input` still takes a tap only on its box, so under touch give it a `.ds-check` label or an equally large label around it |
| State | `aria-invalid="true"`, `.ds-field--warning`, `.ds-field--success`, `readonly`, `aria-readonly="true"`, `disabled` | the control, the field | the border and ring, always with a hint in words; there is no tone class on a field |

- 40px fields, label above (never only a placeholder), focus as an instant 2px ring inside the field. On blur the
  border, the inner ring and the text colour fade back together, so the ring never fades as half a ring.
- Field text stays `--ds-font-input` (16px) at 600px and below at every size: iOS zooms into smaller text; the padding
  stays around that taller line, so an md field is 42px there. A `--ds-input-font` of a theme wins, so keep it at 16px
  on phones.
- The label of a field (`.ds-field__label` before the field, or the `<legend>` of a fieldset) takes the ring's colour
  with the ring (primary, or the state's on a warning or success field), at once, and fades back on blur; the label of
  an invalid field keeps the error ink, also
  while focused (the control directly in `.ds-field` or in its `.ds-input-group`, `.ds-field__row` or `.ds-combo`).
  A focused invalid input group rings in the error colour alone, like a focused invalid field.
- Error: `aria-invalid="true"` plus a `.ds-field__hint--error` with an icon, linked by `aria-describedby`. The
  message fades in when it appears (inserted, or filled from empty), not when its text changes; where the browser
  can animate height to `auto` and focus is in its form (`<form>`, `.ds-form`) or `.ds-field` (validation on blur
  or on submit), its room also opens from 0 (on `--ds-ease-out`, so the form below never overshoots). A message
  already in the markup only fades in, so nothing shifts on load. Removing it is instant.
- Disabled and read-only (`readonly`, or `aria-readonly="true"` on a select, whose value the page then keeps) fields
  take the quiet surface; a read-only field stays focusable, shows the ring or the focus line of its look while
  focused, and its text can be copied. A `<datalist>` field shows the select triangle.
- Form grids drop to one column when the page is 760px or narrower, and in sheets and dialogs when the window is.
- A form in a card: `<form class="ds-card ds-form">` (16px rhythm).
- A `<textarea class="ds-input">` starts about three lines tall and grows only vertically, by hand.
- A group of checkboxes is a `<fieldset class="ds-field">` with `<legend class="ds-field__label">` as its label;
  both lose the browser's frame and indent.
- Checkboxes and radios are drawn on the native input (`appearance: none`, no wrapper): inputs in `.ds-check`, every
  checkbox in a `.ds-table` (not the hidden input of a switch or chip in a cell), the radio of a `.ds-radio` card, and `.ds-checkbox` / `.ds-radio-input` anywhere else.
  The check wipes in from its short arm, the indeterminate dash (`el.indeterminate = true`) grows from the centre
  while the check collapses into it, the radio dot grows on the spring; nothing animates on load. A 40px halo
  (`--ds-check-target`) shows hover (also on the whole `.ds-check` row), press and keyboard focus with the ring; on
  touch screens a tap grows it from the centre (inputs get no ripple). `aria-invalid="true"` draws the box in the
  error colour; disabled boxes take `--ds-disabled-ink`. Forced colours: system colours, no halo.
- `aria-disabled="true"` on a checkbox or radio (also in a `.ds-check` row or a radio card) looks and acts blocked
  like `disabled`: the disabled ink, no hover or press halo, the row's quieter ink, `GrayText` in forced colours. It
  stays in the tab order and keeps its focus halo, so a tooltip with the reason can still be reached; the action
  guard of `DS.motion` ([motion.md](motion.md)) blocks its click, also a click on its label, so the page needs no
  guard of its own.
- A `.ds-check` row is `--ds-check-height` tall (40px, with the size and density steps) around one line of its
  label. A long label wraps (even a bare text node, `overflow-wrap: anywhere`) and the box stays beside its first line.
- `.ds-check--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-sm`. Until then it keeps the fixed 2.x row
  (`--ds-check-sm-height`, 32px, **deprecated** with it) and the quieter ink; density does not change it.
- Radio cards (`.ds-radio`) have a state layer and the ripple, and turn squarer while pressed
  (`--ds-radius-card-pressed` times `--ds-shape`), springing back on release; keyboard focus rings the whole card and lays the focus
  layer (`--ds-state-focus`) at once (its input has no halo); `.ds-radio--disabled` and a card whose input is
  disabled or `aria-disabled` have none, keep their border on hover and take the quiet look (`--ds-line` border,
  `--ds-surface-low`, the title in `--ds-text-2`; a checked one keeps its selected look).
- Date and time fields (`date`, `datetime-local`, `month`, `week`, `time`) draw their picker button as the icon
  set's `calendar` (`time`: `clock`) in the quieter text colour; side by side in `.ds-filters`, `.ds-inline-form`
  and the two- and three-column grids they take less padding at 720px and below, so the value is not cut off.
- Field hooks: `--ds-input-height`, `--ds-input-padding-x`, `--ds-input-bg`, `--ds-input-border`,
  `--ds-input-radius`, `--ds-input-weight` and `--ds-input-focus-color` (the ring and the label tint),
  [theming.md](theming.md#component-hooks). Checkboxes and radios: `--ds-check-size` (18px at md). Cards:
  `--ds-radio-padding`.
- Keyboard and names: native controls, so Tab reaches every field, checkbox and radio, Space toggles, the arrows move
  within a radio group and step a number. Every field has a `<label>` (`.ds-sr` when the design shows none) and its
  hint by `aria-describedby`; a group of radios a `role="radiogroup"` with a name.
- Forced colours: a focused field (also an input group and a filled field) shows a `Highlight`
  outline, since its inset ring is a shadow that forced colours drop; a selected card's edge and checked input are
  `Highlight`; blocked is `GrayText` (a disabled field or group, a disabled fieldset's legend, a blocked card's title
  and edge when checked); a warning or success field keeps the system's edge and its word says which.

**Hints that confirm, hints with an icon, markers and a counter**

```html
<div class="ds-field">
  <label class="ds-field__label" for="user">Username <span class="ds-field__required" aria-hidden="true">*</span></label>
  <input class="ds-input" id="user" required aria-describedby="user-hint">
  <small class="ds-field__hint ds-field__hint--success" id="user-hint">[icon checkCircle 16]Available.</small>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="room">Room <span class="ds-field__optional">(optional)</span></label>
  <input class="ds-input" id="room" aria-describedby="room-hint">
  <small class="ds-field__hint" id="room-hint">[icon info 16]As written on the door.</small>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="note">Note</label>
  <textarea class="ds-input" id="note" maxlength="200" aria-describedby="note-hint"></textarea>
  <div class="ds-field__foot">
    <small class="ds-field__hint" id="note-hint">Shown to the next person.</small>
    <span class="ds-field__counter" aria-hidden="true">0 / 200</span>
  </div>
</div>
```

- A hint whose first child is an icon lays it out beside its first line (`--ds-text-2`). `.ds-field__hint--success`
  confirms a live check ("Available"): text `--ds-field-success-color` (default `--ds-text-2`), icon `--ds-success`.
  It enters like an error message (a fade, and its room opens while focus is in the form); a hint that turns from
  error to success keeps its element, so only its text and icon change. The hint is a description
  (`aria-describedby`), read on the next focus; when the result must be spoken at once, announce it too
  (`DS.overlay.announce(text)`). The error text reads `--ds-field-error-color` (default
  `--ds-on-error-container`).
- A warning (`.ds-field--warning` with a `.ds-field__hint--warning`, "Expires in 3 days") and a success
  (`.ds-field--success` with a `.ds-field__hint--success`) colour the control's border, ring and the line of the
  filled field; `aria-invalid="true"` stays the only error. Each needs its hint with an icon and words: the colour
  never stands alone. Hook: `--ds-field-warning-color` (default `--ds-on-warning-container`).
- `.ds-field__optional` marks the few optional fields (the recommended way); where most fields are optional, mark
  the required ones with an `aria-hidden` `.ds-field__required` asterisk and `required` on the input (screen readers
  announce that).
- `.ds-field__foot` puts the hint and a `.ds-field__counter` in one row (the counter at the end, tabular). Past the
  limit it takes `.ds-field__counter--over` (the figures say it, the error ink repeats it). `data-ds-counter` on the
  input or textarea lets `DS.form` keep it (below); a page may also write it itself.

**Counter (`DS.form`, 3.0).** `data-ds-counter` on the input or textarea: the limit is `maxlength`, else
`data-ds-counter-max` (a soft limit: typing past it is allowed and shows). The counter is the field's
`.ds-field__counter`, or the element whose id `data-ds-counter` names.

```html
<textarea class="ds-input" id="note" maxlength="200" data-ds-counter aria-describedby="note-hint"></textarea>
<div class="ds-field__foot">
  <small class="ds-field__hint" id="note-hint">Shown to the next person.</small>
  <span class="ds-field__counter" aria-hidden="true"></span>
</div>
```

- It reads "14 / 200" in the locale's digits (without a limit, "14"), counting what `maxlength` counts (UTF-16 code
  units, so an emoji is 2), and takes `.ds-field__counter--over` past a soft limit.
- The counter stays `aria-hidden`: a reader is told once when the text comes near the limit (at most
  `data-ds-counter-warn` characters left, default a tenth of the limit, at least 5: "8 characters left") and once when
  it goes past it ("3 characters too many"), never on each key (the strings `charactersLeft`, `charactersLeftOne`,
  `charactersOver`, `charactersOverOne`).
- `ds:change` with `{ length, max, remaining, over }` goes out on the field when the length changes. A form `reset`
  counts again.

```js
const note = DS.form.counter(textarea);    // or DS.core.get(textarea, 'counter')
note.get();                                // { length: 14, max: 200, remaining: 186, over: false }
note.set('Dock in room B 2.14');
DS.form.count('Dock in room B', 200);      // the same count, without a field
```

`DS.form.counter` returns the controller the attribute path makes (`get`, `set`, `on`, `update`, `destroy`);
`DS.form.count` is the count behind it.

**Search key**

```html
<div class="ds-search">[icon search 20]<input class="ds-input" id="q" type="search" aria-label="Search devices" aria-keyshortcuts="/" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div>
```

The key shows while the search rests empty and goes (in `--ds-dur-instant`) once it has the focus, a value or is
disabled; the field keeps room for it, so the caret is never under it. Touch screens never show it. The input needs
a `placeholder` (the key reads `:placeholder-shown`). The shortcut is the page's:

```js
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault(); // Firefox: no quick find
  search.focus();
});
```

**A field and its button, units and reveals inside a field**

```html
<div class="ds-field">
  <label class="ds-field__label" for="key">API key</label>
  <div class="ds-field__row">
    <input class="ds-input" id="key" value="ex_7f3a9c21" readonly>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy the key" data-tip="Copy the key">[icon copy 20]</button>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="quota">Quota (GB)</label>
  <div class="ds-input-group">
    <input class="ds-input" id="quota" inputmode="numeric" value="50">
    <span class="ds-input-group__suffix" aria-hidden="true">GB</span>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="site">Website</label>
  <div class="ds-input-group">
    <span class="ds-input-group__leading" aria-hidden="true">[icon globe 18]</span>
    <span class="ds-input-group__prefix" aria-hidden="true">https://</span>
    <input class="ds-input" id="site" value="example.org">
    <span class="ds-input-group__trailing"><span class="ds-tag ds-tone-neutral">Suggested</span></span>
  </div>
</div>
<div class="ds-field">
  <label class="ds-field__label" for="pw">Password</label>
  <div class="ds-input-group">
    <input class="ds-input" id="pw" type="password" autocomplete="current-password">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show password" aria-pressed="false" aria-controls="pw">
      <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon eye 18]</span><span class="ds-icon-swap__b">[icon eyeOff 18]</span></span></button>
  </div>
</div>
```

- `.ds-field__row`: the field takes the room, its buttons keep their size; `.ds-field__row--top` aligns them to the
  start, beside a textarea.
- `.ds-input-group` draws the field (border, radius, background, `--ds-input-height` with its steps) and the
  `.ds-input` inside loses its box. The ring moves to the group while the input has the focus (at once, fading back
  on blur); a focused trailing button shows its own ring instead. `aria-invalid="true"` on the input turns the
  group's border, disabled or `readonly` its surface.
- Its slots: `.ds-input-group__leading` (an `aria-hidden` icon, no pointer), `.ds-input-group__prefix` (text before
  the value, such as `https://`), `.ds-input-group__suffix` (a unit after it), `.ds-input-group__trailing` (an icon, a
  tag such as "Suggested", or a button). A prefix and a suffix are `aria-hidden`, so the unit belongs in the label too.
- A button in the group, direct or in the trailing slot, adds nothing to the field's height as long as it is no taller
  than the field. It keeps its own size: `.ds-sm` fits md and the dense density; at `.ds-xs`, or `.ds-sm` with a dense
  density, put `.ds-xs` on it.
- `.ds-input-group__affix` is **deprecated** (3.0, removed when 3.0 ships): `.ds-input-group__prefix` before the
  input, `.ds-input-group__suffix` after it, the same look.
- The reveal is the page's two lines: toggle the input's `type` between `password` and `text`, and the button's
  `aria-pressed` (the icon swap follows it).

**Filled and inset fields**

```html
<div class="ds-field ds-field--filled">
  <label class="ds-field__label" for="owner">Owner</label>
  <input class="ds-input" id="owner" value="Ada Lovelace">
</div>
<div class="ds-field ds-field--inset">
  <label class="ds-field__label" for="title">Title</label>
  <input class="ds-input" id="title" value="Quarterly report">
  <small class="ds-field__hint">Shown in the list.</small>
</div>
```

`.ds-field--filled` puts the field's control (a `.ds-input` or a `.ds-input-group`) on the tonal fill, without an
outline at rest, the label above it. A single control takes `.ds-input--filled` or `.ds-input-group--filled`, a single
outlined one in a filled field `.ds-input--outlined`.

`.ds-field--inset` is the Material 3 filled field: the label sits inside a tonal box above the value (still a real
`<label>`), a hairline closes the box at the bottom and turns into a 2px line in `--ds-input-focus-color` while the
field has the focus. The box is 56px at md and comfortable, and follows size and density. It holds a `.ds-input` or a
`.ds-input-group` with its slots. Hints and a `.ds-field__foot` follow below the box, in line with the label. In forced colours the fill is gone, so the box keeps a
transparent border (its edge there) and a focused field shows the outline.

**Fieldset and form section**

```html
<fieldset class="ds-fieldset">
  <legend class="ds-fieldset__legend">Address</legend>
  <p class="ds-fieldset__hint">Where the device stands.</p>
  <div class="ds-field"><label class="ds-field__label" for="street">Street</label><input class="ds-input" id="street"></div>
</fieldset>

<section class="ds-form-section ds-form-section--columns" aria-labelledby="alerts-title">
  <div class="ds-form-section__head">
    <h3 class="ds-form-section__title" id="alerts-title">Alerts</h3>
    <p class="ds-form-section__text">Who hears about a device that went offline.</p>
  </div>
  <div class="ds-form-section__body">
    <div class="ds-field"><label class="ds-field__label" for="alert-mail">Email</label><input class="ds-input" id="alert-mail" type="email"></div>
  </div>
</section>
```

- `.ds-fieldset`: fields that belong together under a `.ds-fieldset__legend`, without the browser's frame and indent;
  `.ds-fieldset--outlined` puts them in a frame. A disabled fieldset quiets its legend and disables its controls. A
  fieldset that reads as one field (a set of checkboxes under a field label) stays a `fieldset.ds-field`.
- `.ds-form-section`: a titled part of a long form; a section after a section stands on a hairline. With
  `.ds-form-section--columns` (settings) the head stands beside the body; the labels stay above their fields. It falls
  to one column when the page is 760px or narrower, and in sheets and dialogs when the window is.

**Checkbox cards**

```html
<div class="ds-check-cards" role="group" aria-label="Add-ons">
  <label class="ds-check-card"><input class="ds-checkbox" type="checkbox" name="addon" value="backup" checked>
    <span><strong>Backups</strong><small>Every night, kept for 30 days.</small></span></label>
  <label class="ds-check-card"><input class="ds-checkbox" type="checkbox" name="addon" value="audit" disabled>
    <span><strong>Audit log</strong><small class="ds-radio__note">[icon alert 16]Needs a licence.</small></span></label>
</div>
```

The checkbox sibling of the radio card: several may be on. Its `.ds-checkbox` keeps the wipe, the indeterminate dash
and the error ink, without a halo: the card's own layer is its hover, press and focus layer, and it has the ripple
and the press morph of a radio card (`--ds-radius-card-pressed` times `--ds-shape`). A checked card takes the 2px
primary outline, never the tint alone. Keyboard focus rings the whole card.

**Many values from a long set, a parent and its children**

```html
<fieldset class="ds-field"><legend class="ds-field__label">Status</legend>
  <div class="ds-check-list">
    <label class="ds-check"><input type="checkbox" name="status" value="active" checked><span>Active</span><span class="ds-check__count">47</span></label>
    <label class="ds-check"><input type="checkbox" name="status" value="storage"><span>In storage</span><span class="ds-check__count">12</span></label>
  </div>
</fieldset>

<fieldset class="ds-field"><legend class="ds-field__label">Notify by</legend>
  <div class="ds-check-group">
    <label class="ds-check"><input type="checkbox" data-all><span>All channels</span></label>
    <div class="ds-check-group__children" role="group" aria-label="Channels">
      <label class="ds-check"><input type="checkbox" checked><span>Email</span></label>
      <label class="ds-check"><input type="checkbox"><span>Chat</span></label>
    </div>
  </div>
</fieldset>
```

- `.ds-check-list`: rows on hairlines in an outlined box that scrolls on its own beyond `--ds-check-list-max-height`
  (264px, about six rows, so the cut row shows that it scrolls; `none` shows them all, also in a sheet). The row
  padding keeps every halo and ring inside the box. A checked row's label takes the label weight, so the selection
  shows by more than the check; `.ds-check__count` sits at the row's end. Tab walks the boxes and the list scrolls
  each into view.
- `.ds-check-group`: the children's boxes line up under the parent's label. The page keeps the parent in step:

```js
const all = group.querySelector('[data-all]');
const children = [...group.querySelectorAll('.ds-check-group__children input')];
all.addEventListener('change', () => children.forEach((child) => { child.checked = all.checked; }));
group.addEventListener('change', () => { const on = children.filter((child) => child.checked).length;
  all.checked = on === children.length; all.indeterminate = on > 0 && on < children.length; });
```

**Changed fields, read-only values, editing in rows**

```html
<form class="ds-form ds-form--rows">
  <div class="ds-field ds-field--changed">
    <label class="ds-field__label" for="place">Room <span class="ds-field__changed ds-sr">(changed)</span></label>
    <input class="ds-input" id="place" value="B 2.14">
  </div>
  <div class="ds-field" role="group" aria-labelledby="serial-l">
    <span class="ds-field__label" id="serial-l">Serial number</span>
    <span class="ds-field__value">SN-0042</span>
  </div>
  <div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Save</button></div>
</form>
```

- `.ds-field--changed`: a dot after the label (`--ds-field-changed-color`, default `--ds-primary`; `CanvasText` in
  forced colours) fades in on `--ds-dur-fast` and out on `--ds-dur-instant`; it always takes its room, so the label
  never shifts. The word in `.ds-field__changed.ds-sr` joins the label's name only while the field carries the class,
  so the change never shows by colour alone. Put `.ds-field__changed` in every field that can change and toggle the
  class.
- `.ds-field__value`: a value that is read, not edited (set by another system), as tall as a field's text row, without
  a box that would look like a field. A value that must be focusable or submitted is an
  `<input class="ds-input" readonly>` instead.
- `.ds-form--rows`: the fields sit on hairlines with row padding instead of the form's gap, a grid inside turns into
  one column, and controls stop at `--ds-form-rows-control-max` (480px). Labels stay above their controls (never a
  label column, unlike a read-only `.ds-facts--rows`), so switching from reading to editing changes the layout on
  purpose.

**Radio tiles**

```html
<div class="ds-radios ds-radios--tiles" role="radiogroup" aria-label="Device type">
  <label class="ds-radio"><input type="radio" name="kind" value="laptop" checked><span class="ds-radio__icon" aria-hidden="true">[icon laptop 20]</span>
    <span><strong>Laptop</strong><small>With a dock.</small></span><span class="ds-radio__mark" aria-hidden="true">[icon check 14]</span></label>
  <label class="ds-radio"><input type="radio" name="kind" value="desktop"><span class="ds-radio__icon" aria-hidden="true">[icon monitor 20]</span>
    <span><strong>Desktop</strong><small>At one desk.</small></span><span class="ds-radio__mark" aria-hidden="true">[icon check 14]</span></label>
</div>
```

Two columns of radio cards (one below 480px of the content or the window). The radio itself is hidden: the icon disc
fills (`--ds-primary` / `--ds-on-primary`) and the trailing check circle pops in (from `--ds-scale-small` on the
spring) on the checked tile, which keeps the card's ring; keyboard focus rings the tile. The cards keep their press
morph (`--ds-radius-card-pressed`). For a tint that glides from tile to tile, add the indicator once:

```js
const pill = DS.indicator.create(group, { active: '.ds-radio:has(input:checked)', className: 'ds-radios__indicator' });
group.addEventListener('change', () => pill.update()); // checking a radio changes no attribute
```

**Growing textarea**

```html
<textarea class="ds-input ds-input--grow" rows="1" aria-label="Note"></textarea>
```

- `.ds-input--grow` starts one row tall (`--ds-input-height`) and grows with its text up to `--ds-input-grow-max`
  (50vh), then scrolls. Where `field-sizing: content` is missing, `DS.dom.autosize(textarea)` sets the height through
  the CSSOM (never animated); since 3.0 `DS.init()` does it for every `textarea.ds-input--grow` (the behaviour
  `autosize` of `DS.form`), so the page calls nothing. Where `field-sizing` exists it steps aside.

**Customizable select (`.ds-select`, progressive).**

```html
<select class="ds-input ds-select" id="kind">
  <button><selectedcontent></selectedcontent></button>
  <option value="laptop">[icon laptop 20]Laptop</option>
  <option value="monitor">[icon monitor 20]Monitor</option>
</select>
```

- Where `appearance: base-select` exists, the list opens as the engine's own picker on the menu's surface
  (`--ds-surface-popover`, `--ds-elev-popover`, the corners of `--ds-radius-xs` times the shape), rows of the menu's
  height (`--ds-menu-item-height` at every size and density, at least the touch target), a check before the chosen row
  and its label weight, the hover and focus layers of every row; an option may hold an icon or a second line, and
  `<selectedcontent>` shows the chosen one in the field. The chevron turns while it is open (`--ds-dur-medium` on the
  spring); the list fades in on `--ds-dur-fast` and out on `--ds-dur-instant`.
- Elsewhere it is the styled native select (the triangle, the platform's list); the `<button>` and
  `<selectedcontent>` are ignored, and the option's icon is not shown. Keys, type-ahead, the value, `required` and
  `:user-invalid` are the engine's either way.
- Forced colours: the chosen row is `SelectedItem`, the focused one has a `CanvasText` ring, the list keeps an edge.
- A message field with its actions, attachments, commands and mentions is the [composer](#composer).

**Actions that stay on a phone**

```html
<div class="ds-form-actions ds-form-actions--sticky">
  <button class="ds-btn ds-btn--filled" type="submit">Save</button>
  <button class="ds-btn ds-btn--text" type="button">Cancel</button>
</div>
```

At 600px and below the action row of a long form sticks to the bottom of its scroller: a surface bar with a static
hairline that bleeds to the page's padding (`--ds-content-pad-x`) or a card's (`--ds-card-pad`) and keeps clear of
the home indicator (`env(safe-area-inset-bottom)`). In a padded container of the page's own (a project card, a sheet
section) set `--ds-form-actions-bleed` on that container to its inline padding, and the bar meets its edges:

```css
.x-panel { padding: var(--ds-space-5); --ds-form-actions-bleed: var(--ds-space-5); }
```

The hook inherits, so set it on the nearest container the bar runs through (inside a `.ds-card` in such a container,
set it on the card too).

**Toolbar, search, filters, inline form**

```html
<div class="ds-toolbar">
  <div class="ds-filters">
    <div class="ds-field ds-field--grow">
      <label class="ds-sr" for="q">Search</label>
      <div class="ds-search">[icon search 20]<input class="ds-input" id="q" type="search" placeholder="Search devices"></div>
    </div>
    <div class="ds-field">
      <label class="ds-field__label" for="f-type">Type</label>
      <select class="ds-input ds-input--filled" id="f-type"><option>All</option></select>
    </div>
  </div>
  <fieldset class="ds-chips"> ... </fieldset>
</div>

<div class="ds-action-bar">                  <!-- search, buttons and a count in one wrapping row -->
  <div class="ds-search">[icon search 20]<input class="ds-input" type="search" aria-label="Search" placeholder="Search"></div>
  <button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false">[icon filter 16] Filter</button>
  <p class="ds-meta">128 devices</p>
</div>

<div class="ds-inline-form">
  <div class="ds-field"><label class="ds-field__label" for="ticket">Ticket</label><input class="ds-input" id="ticket"></div>
  <button class="ds-btn" type="submit">Look up</button>
</div>
```

`.ds-input--filled` is the toolbar variant on the tonal fill; `.ds-search` is a filled pill with a leading icon.
Inside a dialog, a side sheet or a menu, Escape in a filled `type="search"` field clears it first (an `input` event
follows, so the page's filter runs) and the next Escape closes the layer (2.0, `DS.overlay`).

**Motion:** the check, radio, focus, validation, confirmation, changed dot, search key and radio tile rows of
[Controls](motion.md#controls) in motion.md. A checkbox card moves as a radio card; a warning hint enters as an error
hint does.

<!-- changelog
- Form: `DS.form` (3.0), the module of the field. `data-ds-counter` keeps a `.ds-field__counter` ("14 / 200", the
  `--over` class past a soft `data-ds-counter-max`) and says once that the limit is near or passed (strings
  `charactersLeft`, `charactersLeftOne`, `charactersOver`, `charactersOverOne`); `DS.form.counter()`,
  `DS.form.count()`. Every `textarea.ds-input--grow` grows by itself where `field-sizing` is missing (the behaviour
  `autosize`). `.ds-select`: a customizable select where `appearance: base-select` exists (the menu's surface and rows,
  a check, rich options, `<selectedcontent>`), the styled native select elsewhere.
-->
