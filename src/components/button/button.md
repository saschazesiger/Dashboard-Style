## Button

One component for every action: a pill at the default shape, in one of a few looks, at any size and density.

```html
<button class="ds-btn" type="button">Cancel</button>                                  <!-- outlined -->
<button class="ds-btn ds-btn--outlined" type="button">Export</button>                 <!-- the same, explicit -->
<button class="ds-btn ds-btn--filled" type="submit">Save</button>                     <!-- the main action -->
<button class="ds-btn ds-btn--tonal" type="button">Add entry</button>                 <!-- softer main action -->
<button class="ds-btn ds-btn--elevated" type="button">Open map</button>               <!-- on an image or a busy backdrop -->
<button class="ds-btn ds-btn--text" type="button">Details</button>                    <!-- no frame -->
<button class="ds-btn ds-btn--quiet" type="button">[icon filter 16] Filter</button>   <!-- toolbar -->
<button class="ds-btn ds-btn--ghost" type="button">Dismiss</button>                   <!-- the ink of its surroundings -->
<button class="ds-btn ds-btn--filled ds-btn--block" type="submit">Sign in</button>    <!-- full width -->
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close">[icon close 20]</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="Minimize">[icon minimize 20]</button>
<button class="ds-btn ds-sm" type="button">[icon plus 16] Add</button>                <!-- 32px -->
<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Edit">[icon pencil 18]</button>  <!-- 32px round -->
<div class="ds-density-dense">…buttons 32px high…</div>                              <!-- density of a region -->
<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true">[icon filter 16] Filter</button>  <!-- toggle, on -->
<button class="ds-btn ds-btn--filled" type="button" disabled>Save</button>
<button class="ds-btn ds-btn--filled" type="button" aria-disabled="true" aria-describedby="why">Publish</button>
<button class="ds-btn ds-btn--filled" type="button">                               <!-- faces: busy, done and failed -->
  <span class="ds-btn__faces">
    <span class="ds-btn__face">Save</span>
    <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Saving</span>
    <span class="ds-btn__face ds-btn__face--done" aria-hidden="true">[icon check 16]Saved</span>
    <span class="ds-btn__face ds-btn__face--failed" aria-hidden="true">[icon alertCircle 16]Not saved</span>
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

The one red button: a destructive confirmation, in the confirm dialog or the type-to-confirm pattern only (D10), its
label naming the consequence:

```html
<div class="ds-dialog__actions">
  <button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button>
  <button class="ds-btn ds-btn--filled ds-tone-error" type="button">Delete 3 devices</button>
</div>
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
await DS.motion.busy(saveButton, () => fetch(url, { method: 'POST', body }));   // busy, then "Saved" (or "Not saved") for a moment
DS.motion.crossfade(copySlot, DS.icons.icon(DS.icons.check, 20), { kind: 'icon' });  // copy to check
```

**Options** ([options.md](options.md)): classes on the button or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the button |
|---|---|---|---|
| Variant | `--outlined` (default), `--filled`, `--tonal`, `--elevated`, `--text`, `--quiet`, `--ghost`; `--icon`, `--disc`, `--disclosure`, `--adaptive`, `--block` | the button | the look; `--icon` and `--disc` combine with a look, `--block` with any |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the button or a group | 24, 32, 40, 48, 56px high (8px per step), side padding 8 to 24px (4px per step), the size's type role (`xs` caption, `sm` chip, `md` label, `lg` and `xl` subtitle); an icon button 24 to 56px square |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (40, 36, 32, 28px at md); side padding, type and icon buttons stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the rest and the pressed radius times 0, .5, 1, 1.5: square, soft corners, the pill (default) |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high whatever the size and density; an icon button as wide |
| Tone | `.ds-tone-error` | a `--filled` button only | the filled error button of a destructive confirmation (above); every other tone and variant ignores tones |
| Exact height | `--ds-btn-height-exact` (a hook) | the button or a theme | a fixed height that ignores size and density, never the touch minimum |

- Every action is a pill at the default shape (D11): the rest radius is `min(radius, half the height)` times
  `--ds-shape`, so a square theme or region has square buttons. One filled button per area. Red buttons only as above
  (D10): pages keep none; name the consequence ("Delete 3 devices"). A filled button inside an error alert or another
  tone region stays filled: the button reads the tone of its own class only.
- `.ds-btn--primary` is **deprecated** (3.0, removed when 3.0 ships): `.ds-btn--filled`, the same look under the
  variant name every component shares.
- `.ds-btn--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-sm`. Until then it keeps the fixed 2.x small
  button: `--ds-btn-sm-height` (32px; with `--icon` `--ds-btn-sm-icon-size`, 32px; both **deprecated** with it) and
  12px of side padding, which density does not change. `.ds-sm` is the same 32px at the default density and follows
  the density like every size (24px in the compact theme); a small `--text` button pads 8px.
- A leading icon pulls the start padding to 12px at md (4px more per size above, never more than the end padding),
  also the icon of the first face of `.ds-btn__faces`. Icons keep the size their markup gives them (16px beside a
  label, 20px alone).
- `--elevated` lifts a `--ds-surface-low` button with `--ds-elev-1` (`--ds-elev-2` on hover; hook
  `--ds-btn-shadow`). `--ghost` has no fill and no frame and takes the ink of its surroundings (`currentColor`): an
  action on a tinted, inverse or status surface. `--block` fills its line (`display: flex`, full width).
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
  and the button turns into a round quiet icon button (`--ds-btn-icon-size` and its size step; the icon at 20px).
  Its accessible name stays the label; give it a `data-tip` with the
  same words, which shows only while the label is folded (a tip equal to the visible text shows only while it is cut
  off, [Tooltip](#tooltip)).
- Quiet links: `.ds-link--quiet` on a link and `.ds-link-btn--quiet` with `.ds-link-btn` take the quieter ink
  (`--ds-text-2`) and a hairline underline (`--ds-line-2`, the link underline geometry), the link colour and
  `--ds-link-underline-hover` on hover; still underlined. For secondary links next to the main one.
- A text button that underlines on hover (`--ds-btn-hover-decoration: underline`) draws it with the link geometry
  (`--ds-link-underline-thickness`, `--ds-link-underline-offset`).
- Press: the state layer comes in `--ds-dur-micro` and the shape turns squarer (`--ds-radius-action-pressed`, 12px,
  times `--ds-shape`; hook `--ds-btn-radius-pressed`), then springs back on release (`--ds-ease-spatial`,
  `--ds-dur-medium`); with `DS.ripple.attach(document)` a ripple grows from the pointer ([Ripple](#ripple)) and
  `.ds-pressed` keeps a quick click visible. The rest radius is at most half the height, so the morph runs the whole
  way; a pressed radius is never rounder than the rest radius (square shapes stay square). Disabled,
  `aria-disabled`, busy and done buttons show no press. `.ds-btn--disc` morphs and ripples like every pill. Nothing
  scales or moves.
- Focus: the ring is solid from the first frame and snaps from 4px to its 2px offset in `--ds-dur-fast`, with the
  focus layer (`--ds-state-focus`, hook `--ds-btn-state-focus-opacity`; `--disc` shows its disc). An
  `aria-disabled` button keeps the focus layer.
- Busy, done and failed, without a width jump: `.ds-btn__faces` stacks every `.ds-btn__face` in one grid cell, so the
  button is as wide as its widest face and the label stays while it loads. `aria-busy="true"` blocks it at once and
  shows `.ds-btn__face--busy` only after `--ds-delay-loader` (a fast save shows nothing); `.ds-btn--done` (blocked as
  well) shows `.ds-btn__face--done`, whose `pathLength="1"` check (`DS.icons.check`) draws itself; `.ds-btn--failed`
  shows `.ds-btn__face--failed`, an icon and a word (never the colour alone; the button keeps its colours), and is not
  blocked: a press tries again. The faces roll: the leaving face rises and fades in `--ds-dur-instant`, the next one
  rises in over `--ds-dur-fast`; back to rest they roll down. `DS.motion.busy(button, work, { done, failed })`
  ([motion.md](motion.md)) sets and clears them, keeps a busy face that showed for the loader minimum, the success
  face for `--ds-hold-success` and the failed face for `--ds-hold-status` (then rethrows the error). Announce the
  result with `DS.overlay.announce()` (or a snackbar, which announces itself).
- Icon swap: `.ds-icon-swap` holds `.ds-icon-swap__a` and `.ds-icon-swap__b` in one cell; `data-swap="b"`, or an
  `aria-pressed="true"` ancestor (a play/pause toggle), shows b. The incoming icon fades in and springs up from
  `--ds-scale-small`, a `pathLength="1"` glyph draws itself, the outgoing icon only fades; a crossfade with a scale,
  not a path morph ([motion.md](motion.md)).
- Keyboard and names: a `<button>` (or a link that navigates); Enter and Space press it. An icon button needs
  `aria-label`; an adaptive one keeps its label as its name.
- Forced colours: the system button colours; a pressed toggle and an open disclosure button `Highlight` /
  `HighlightText` (focused: a `CanvasText` ring), a blocked one `GrayText`. The error tone becomes the system colours
  too, so its label carries the meaning.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the press, focus, busy and success rows of [Controls](motion.md#controls) in motion.md.

<!-- changelog -->
- Button (3.0): the options model. Sizes `.ds-xs` to `.ds-xl` (24 to 56px), density (4px a step), shape (the rest and
  pressed radius times `--ds-shape`: a square theme has square buttons, D11), `.ds-touch` as a minimum
  (`--ds-target-min`). The default height is 40px (2.x: 36px), so `.ds-sm` (32px) and the compact density (32px) keep
  their 2.x heights. New variants `--filled` (2.x `--primary`, **deprecated**), `--elevated`, `--ghost`, `--block`; the
  failed face (`.ds-btn--failed`, `.ds-btn__face--failed`, `busy({ failed })`); `.ds-tone-error` on a filled button
  for destructive confirmations only (D10). New hooks `--ds-btn-height-exact`, `--ds-btn-shadow`. `.ds-btn--sm`,
  `--ds-btn-sm-height` and `--ds-btn-sm-icon-size` **deprecated** (removed when 3.0 ships).
