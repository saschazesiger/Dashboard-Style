## Form

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
  <label class="ds-check ds-check--sm"><input type="checkbox" name="clear"><span>Delete the saved key</span></label>

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

- 40px fields, label above (never only a placeholder), focus as an instant 2px ring inside the field. On blur the
  border, the inner ring and the text colour fade back together, so the ring never fades as half a ring.
- The label of a field (`.ds-field__label` before the field, or the `<legend>` of a fieldset) takes the primary
  colour with the ring, at once, and fades back on blur; the label of an invalid field keeps the error ink, also
  while focused (the control directly in `.ds-field` or in its `.ds-input-group`, `.ds-field__row` or `.ds-combo`).
  A focused invalid input group rings in the error colour alone, like a focused invalid field.
- Error: `aria-invalid="true"` plus a `.ds-field__hint--error` with an icon, linked by `aria-describedby`. The
  message fades in when it appears (inserted, or filled from empty), not when its text changes; where the browser
  can animate height to `auto` and focus is in its form (`<form>`, `.ds-form`) or `.ds-field` (validation on blur
  or on submit), its room also opens from 0 (on `--ds-ease-out`, so the form below never overshoots). A message
  already in the markup only fades in, so nothing shifts on load. Removing it is instant.
- Disabled and read-only (`readonly`) fields take the quiet surface. A `<datalist>` field shows the select triangle.
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
- A `.ds-check` row is `--ds-check-height` tall (40px; `--sm`: `--ds-check-sm-height`, 32px) around one line of its
  label. A long label wraps (even a bare text node, `overflow-wrap: anywhere`) and the box stays beside its first line.
- Radio cards (`.ds-radio`) have a state layer and the ripple, and turn squarer while pressed
  (`--ds-radius-card-pressed`), springing back on release; keyboard focus rings the whole card and lays the focus
  layer (`--ds-state-focus`) at once (its input has no halo); `.ds-radio--disabled` and a card whose input is
  disabled or `aria-disabled` have none, keep their border on hover and take the quiet look (`--ds-line` border,
  `--ds-surface-low`, the title in `--ds-text-2`; a checked one keeps its selected look).
- Date and time fields (`date`, `datetime-local`, `month`, `week`, `time`) draw their picker button as the icon
  set's `calendar` (`time`: `clock`) in the quieter text colour; side by side in `.ds-filters`, `.ds-inline-form`
  and the two- and three-column grids they take less padding at 720px and below, so the value is not cut off.
- Field hooks: `--ds-input-height`, `--ds-input-bg`, `--ds-input-border`, `--ds-input-radius` and
  `--ds-input-focus-color` (the ring and the label tint), [theming.md](theming.md#component-hooks).
- Forced colours: a focused field (also an input group, a filled field and the composer) shows a `Highlight`
  outline, since its inset ring is a shadow that forced colours drop.

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
- `.ds-field__optional` marks the few optional fields (the recommended way); where most fields are optional, mark
  the required ones with an `aria-hidden` `.ds-field__required` asterisk and `required` on the input (screen readers
  announce that).
- `.ds-field__foot` puts the hint and a `.ds-field__counter` in one row (the counter at the end, tabular). The counter
  is `aria-hidden` and the page updates it on `input`; near the limit the page announces what is left once.

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
    <span class="ds-input-group__affix" aria-hidden="true">GB</span>
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
- `.ds-input-group` draws the field (border, radius, background, `--ds-input-height`) and the `.ds-input` inside
  loses its box. The ring moves to the group while the input has the focus (at once, fading back on blur); a focused
  trailing button shows its own ring instead. `aria-invalid="true"` on the input turns the group's border, disabled
  or `readonly` its surface. An affix (a unit, a prefix such as `https://`) is `aria-hidden`, so the unit belongs in
  the label too.
- The reveal is the page's two lines: toggle the input's `type` between `password` and `text`, and the button's
  `aria-pressed` (the icon swap follows it).

**The filled field**

```html
<div class="ds-field ds-field--inset">
  <label class="ds-field__label" for="title">Title</label>
  <input class="ds-input" id="title" value="Quarterly report">
  <small class="ds-field__hint">Shown in the list.</small>
</div>
```

The Material 3 filled field: the label sits inside a tonal box above the value (still a real `<label>`), a hairline
closes the box at the bottom and turns into a 2px line in `--ds-input-focus-color` while the field has the focus.
Hints follow below the box. In forced colours the fill is gone, so the box keeps a transparent border (its edge
there) and a focused field shows the outline.

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
const pill = DS.indicator.createIndicator(group, { active: '.ds-radio:has(input:checked)', className: 'ds-radios__indicator' });
group.addEventListener('change', () => pill.update()); // checking a radio changes no attribute
```

**Slider**

```html
<div class="ds-field">
  <label class="ds-field__label" for="keep">Keep history for</label>
  <div class="ds-field__row">
    <input class="ds-slider" id="keep" type="range" min="7" max="365" value="90" aria-describedby="keep-out">
    <output class="ds-slider__value" id="keep-out" for="keep">90 days</output>
  </div>
</div>
```

A 4px track in `--ds-accent` with its active part in `--ds-primary`, a 20px handle with a halo
(`--ds-slider-halo`, 40px) for hover, press and keyboard focus (like the switch: the halo is the press, no ripple,
and the handle never scales), the focus ring on the handle. Firefox draws the active part itself; elsewhere the page
sets `--ds-share` (the value's share of the range, 0 to 1) on the input when it renders and on every `input` event,
and keeps the `<output>` in step (without `--ds-share` the track shows no active part, and the slider still works):

```js
const share = () => { slider.style.setProperty('--ds-share', String((slider.value - slider.min) / (slider.max - slider.min)));
  output.value = `${slider.value} days`; };
slider.addEventListener('input', share); share();
```

Disabled and `aria-disabled` sliders take the disabled ink and no halo. Forced colours: the track in `ButtonText`,
the handle in `Highlight`.

**Growing textarea and the composer**

```html
<textarea class="ds-input ds-input--grow" rows="1" aria-label="Note"></textarea>

<form class="ds-composer">
  <textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Write a message"></textarea>
  <button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">[icon send 20]</button>
</form>
```

- `.ds-input--grow` starts one row tall (`--ds-input-height`) and grows with its text up to `--ds-input-grow-max`
  (50vh), then scrolls. Where `field-sizing: content` is missing, call `DS.dom.autosize(textarea)` once; its height
  then follows the text through the CSSOM (never animated).
- `.ds-composer`: a filled shell (`--ds-composer-radius`) with the textarea and its actions, which stay at the
  bottom while the text grows (up to `--ds-composer-max-height`, 220px). The ring follows the field model on the
  shell: at once while the focus is inside, fading back on blur. Forced colours: the shell keeps a transparent border
  (its edge there) and shows the outline while focused.

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

**Motion:** the check, radio, focus, validation, confirmation, changed dot, search key, radio tile and slider rows
of [Controls](motion.md#controls) in motion.md.

