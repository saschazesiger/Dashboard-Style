## Button

```html
<button class="ds-btn" type="button">Cancel</button>                                  <!-- outlined -->
<button class="ds-btn ds-btn--outlined" type="button">Export</button>                 <!-- the same, explicit -->
<button class="ds-btn ds-btn--primary" type="submit">Save</button>                    <!-- the main action -->
<button class="ds-btn ds-btn--tonal" type="button">Add entry</button>                 <!-- softer main action -->
<button class="ds-btn ds-btn--text" type="button">Details</button>                    <!-- no frame -->
<button class="ds-btn ds-btn--quiet" type="button">[icon filter 16] Filter</button>   <!-- toolbar -->
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close">[icon close 20]</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="Minimize">[icon minimize 20]</button>
<button class="ds-btn ds-btn--sm" type="button">[icon plus 16] Add</button>         <!-- 32px -->
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit">[icon pencil 18]</button>  <!-- 32px round -->
<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true">[icon filter 16] Filter</button>  <!-- toggle, on -->
<button class="ds-btn ds-btn--primary" type="button" disabled>Save</button>
<button class="ds-btn ds-btn--primary" type="button" aria-disabled="true" aria-describedby="why">Publish</button>
<button class="ds-btn ds-btn--primary" type="button">                              <!-- faces: busy and done -->
  <span class="ds-btn__faces">
    <span class="ds-btn__face">Save</span>
    <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Saving</span>
    <span class="ds-btn__face ds-btn__face--done" aria-hidden="true">[icon check 16]Saved</span>
  </span>
</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link">  <!-- icon swap -->
  <span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">[icon copy 20]</span><span class="ds-icon-swap__b">[icon check 20]</span></span>
</button>
<button class="ds-link-btn" type="button">Printer on floor 2</button>                <!-- reads like a link -->
<button class="ds-btn ds-btn--disclosure" type="button" aria-expanded="false" aria-controls="filters">[icon filter 16] Filters</button>  <!-- opens a panel -->
<button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="false">Details</button>  <!-- opens a sheet or dialog -->
<button class="ds-btn ds-btn--adaptive" type="button" data-tip="Export">[icon download 16]<span class="ds-btn__label">Export</span></button>  <!-- folds on phones -->
<a class="ds-link--quiet" href="/devices/42/history">Show history</a>                 <!-- a quiet link -->
<button class="ds-link-btn ds-link-btn--quiet" type="button">Edit columns</button>
```

A choice made once, then locked (a vote, an answer that was sent): the pressed toggle keeps its on look while
`aria-disabled`, its siblings dim:

```html
<div role="group" aria-label="Was this helpful?">
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="true" aria-disabled="true" aria-label="Helpful">[icon thumbUp 20 ds-icon--fillable]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-disabled="true" aria-label="Not helpful">[icon thumbDown 20 ds-icon--fillable]</button>
</div>
```

```js
await DS.motion.busy(saveButton, () => fetch(url, { method: 'POST', body }));   // busy, then "Saved" for a moment
DS.motion.crossfade(copySlot, DS.icons.icon(DS.icons.check, 20), { kind: 'icon' });  // copy to check
```

- Every action is a pill. One filled `--primary` per area; there are no red buttons (name the consequence:
  "Delete 3 devices").
- A leading icon pulls the start padding to 12px, also the icon of the first face of `.ds-btn__faces`.
- `.ds-btn--sm` reads `--ds-btn-sm-height` (32px) and, with `--icon`, `--ds-btn-sm-icon-size` (32px): set those to
  change every small button, never `--ds-btn-height` on the modifier.
- A toggle that is on carries `aria-pressed="true"` and shows the tint (forced colors: the selection colours).
  Toggles in a track with a sliding indicator ([DS.indicator](motion.md), `.ds-has-indicator`) leave the tint to
  the pill (give it `--ds-accent`): the button stays clear, so only one pill shows while it travels, and its label
  changes colour on the pill's timing (`--ds-indicator-dur`).
- `aria-disabled="true"` looks disabled but stays focusable and hoverable, so a tooltip can say why. `disabled` and
  `aria-busy="true"` block the pointer. Blocked for every input (2.0): once `DS.ripple.attach()` or `DS.motion.busy()` ran,
  or `DS.motion.guard()` was called once ([motion.md](motion.md#dsmotion-jsmotionjs)), a click, middle click, Enter,
  Space or form submission on a busy or done `.ds-btn`, or on any `aria-disabled="true"` action inside `.ds-theme`,
  never reaches your listeners: no page guard needed. A control that must explain itself on click gets
  `data-ds-guard="off"`. Forced colours: `GrayText`.
- A choice made once, then locked: `aria-pressed="true"` with `aria-disabled="true"` keeps the on look at full
  strength (no layer, the default cursor; forced colours keep `Highlight`); the unpressed siblings dim as usual.
- A button that opens a panel (`.ds-btn--disclosure` with `aria-expanded`, or any `.ds-btn` with
  `aria-haspopup="dialog"`) takes the pressed tint while `aria-expanded="true"` (forced colours: `Highlight` /
  `HighlightText`, focused with a `CanvasText` ring). Keep `aria-expanded` in step yourself, or let `DS.overlay`
  do it for dialog and sheet openers. Menu triggers (`aria-haspopup="menu"`) do not tint.
- `.ds-btn--adaptive`: a button whose label folds away on phones. Wrap the label in `.ds-btn__label` after the icon;
  in a content panel of 600px or less (anywhere else, such as the top bar, sheets, dialogs and a page outside the
  frame: in a window of 600px or less) the label is visually hidden
  and the button turns into a round quiet icon button (`--ds-btn-icon-size`, with `--sm`
  `--ds-btn-sm-icon-size`; the icon at 20px). Its accessible name stays the label; give it a `data-tip` with the
  same words, which shows only while the label is folded (a tip equal to the visible text shows only while it is cut
  off, [Tooltip](#tooltip)).
- Quiet links: `.ds-link--quiet` on a link and `.ds-link-btn--quiet` with `.ds-link-btn` take the quieter ink
  (`--ds-text-2`) and a hairline underline (`--ds-line-2`, the link underline geometry), the link colour and
  `--ds-link-underline-hover` on hover; still underlined. For secondary links next to the main one.
- A text button that underlines on hover (`--ds-btn-hover-decoration: underline`) draws it with the link geometry
  (`--ds-link-underline-thickness`, `--ds-link-underline-offset`).
- Press: the state layer comes in `--ds-dur-micro` and the shape turns squarer (`--ds-radius-action-pressed`, 12px;
  hook `--ds-btn-radius-pressed`), then springs back on release (`--ds-ease-spatial`, `--ds-dur-medium`); with
  `DS.ripple.attach(document)` a ripple grows from the pointer ([Ripple](#ripple)) and `.ds-pressed` keeps a quick
  click visible. The rest radius is `min(radius, half the height)`, so the morph runs the whole way; a pressed
  radius is never rounder than the rest radius (square themes stay square). Disabled, `aria-disabled`, busy and done
  buttons show no press. `.ds-btn--disc` morphs and ripples like every pill. Nothing scales or moves.
- Focus: the ring is solid from the first frame and snaps from 4px to its 2px offset in `--ds-dur-fast`, with the
  focus layer (`--ds-state-focus`, hook `--ds-btn-state-focus-opacity`; `--disc` shows its disc). An
  `aria-disabled` button keeps the focus layer.
- Busy and done, without a width jump: `.ds-btn__faces` stacks every `.ds-btn__face` in one grid cell, so the
  button is as wide as its widest face. `aria-busy="true"` blocks it at once and shows `.ds-btn__face--busy` only
  after `--ds-delay-loader` (a fast save shows nothing); `.ds-btn--done` (blocked as well) shows
  `.ds-btn__face--done`, whose `pathLength="1"` check (`DS.icons.check`) draws itself. The faces roll: the leaving
  face rises and fades in `--ds-dur-instant`, the next one rises in over `--ds-dur-fast`; back to rest they roll
  down. `DS.motion.busy(button, work, { done })` ([motion.md](motion.md)) sets and clears both, keeps a busy face
  that showed for the loader minimum and the success face for `--ds-hold-success`. Announce the result with
  `DS.overlay.announce()` (or a snackbar, which announces itself).
- Icon swap: `.ds-icon-swap` holds `.ds-icon-swap__a` and `.ds-icon-swap__b` in one cell; `data-swap="b"`, or an
  `aria-pressed="true"` ancestor (a play/pause toggle), shows b. The incoming icon fades in and springs up from
  `--ds-scale-small`, a `pathLength="1"` glyph draws itself, the outgoing icon only fades; a crossfade with a scale,
  not a path morph ([motion.md](motion.md)).
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the press, focus, busy and success rows of [Controls](motion.md#controls) in motion.md.

