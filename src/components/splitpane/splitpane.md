## Split pane

Two or three panes side by side or stacked, with a divider between each pair that a pointer drags and the keyboard
moves (the WAI-ARIA window splitter). Sizes can be remembered, panes can collapse:

```html
<div class="ds-splitpane ds-splitpane--outlined" data-ds-splitpane data-ds-splitpane-store="devices" style="--ds-splitpane-height: 480px">
  <section class="ds-splitpane__pane" id="device-list" aria-label="Devices" data-ds-splitpane-collapsible
           style="--ds-splitpane-size: 320px; --ds-splitpane-min: 240px; --ds-splitpane-max: 50%">
    <ul class="ds-list"> ... </ul>
  </section>
  <div class="ds-splitpane__divider" role="separator" tabindex="0" aria-controls="device-list" aria-label="Resize the device list"></div>
  <section class="ds-splitpane__pane ds-splitpane__pane--fill" aria-label="Details">
    <div class="ds-splitpane__body"> ... </div>
  </section>
</div>

<button class="ds-btn ds-btn--icon ds-btn--quiet" type="button" aria-label="Device list" data-ds-splitpane-toggle="device-list">[icon panelLeft 20]</button>
```

Three panes: give the outer two a size and the middle one `--fill` (a list, the work area, an inspector); each divider
then resizes its outer neighbour.

| Part | What |
|---|---|
| `.ds-splitpane` | the frame: a flex row (`--stacked`: a column) of `--ds-splitpane-height` (100%), clipping |
| `.ds-splitpane__pane` | a pane that scrolls on its own; its start size `--ds-splitpane-size` (any length, or a percentage of the split pane; default 50%), its limits `--ds-splitpane-min` (0) and `--ds-splitpane-max` (100%), set on the pane; registered, so they do not reach a split pane nested inside |
| `.ds-splitpane__pane--fill` | the pane that takes the rest; without one, the last pane does |
| `.ds-splitpane__divider` | between two panes: a hairline with a grip, a hit area wider than the line; resizes the pane its `aria-controls` names, else the neighbour that does not fill |
| `.ds-splitpane__body` | padded content in a pane (a pane has no padding, so it can collapse to nothing) |

**Options** ([options.md](options.md)): classes on the split pane or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-splitpane--outlined` | the split pane | the hairline frame and `--ds-splitpane-radius` (`--ds-radius-card`) on `--ds-surface`: a split view inside a page; without it the split pane fills its place (the content panel, a card's body) |
| Orientation | `.ds-splitpane--stacked` | the split pane | the panes one above the other, the divider across |
| Size | `.ds-xs` ... `.ds-xl` | any ancestor | the grip's length, 8px per step (32px at md) |
| Density | `.ds-density-*` | any container | the padding of `.ds-splitpane__body`, 2px per step; the panes and the divider stay |
| Shape | `.ds-shape-*` | any container or the theme | the frame of `--outlined` and the grip's ends |
| Touch | `.ds-touch` | any container | the hit area at least half the touch target wide (24px), the grip at least the target long (48px) |
| Tone | | | not read: a divider says nothing |

**Behaviour** (`data-ds-splitpane`, `DS.init()`):

- Drag a divider with a pointer, a finger or a pen (captured, so it follows outside the line; while it drags, the line
  and the grip turn `--ds-primary`, the resize cursor holds over the whole split pane and nothing selects). `Escape`
  during a drag puts it back where it began.
- A pane with `data-ds-splitpane-collapsible` collapses: `Enter` on its divider, a double click on the divider, or a drag
  below half its minimum snaps it shut; the same again (or a drag or an arrow key out) restores it to its last open
  size. A pane that cannot collapse goes back to its start size on a double click. A collapsed pane is inert; when it
  held the focus (a hide button in its own header), the focus moves to its divider first.
- `data-ds-splitpane-toggle="<pane id>"` on a button anywhere in the page (or the pane's index, on a button inside the
  split pane) collapses and restores that pane; the system keeps its `aria-expanded` and `aria-controls`.
- `data-ds-splitpane-store="<key>"` remembers the sizes and the collapsed panes (`DS.store`, namespace `splitpane`),
  restored at the next load while the number of panes still matches.
- `data-ds-splitpane-step="<px>"`: how far a key moves the divider (default 16; with `Shift` four times that).
- `data-ds-splitpane-stack="<px>"`: stack the panes while the split pane is narrower than that (a phone). The system
  measures its own width and writes `data-state="stacked"` on it, which lays it out as `--stacked`: the sizes and the
  limits then apply to the heights, the divider runs across and moves with `ArrowUp` and `ArrowDown`
  (`aria-orientation="horizontal"`). Give such a split pane sizes in percent, which read well either way.
- A size keeps the unit the markup gave it: a percentage stays a share when the split pane resizes, anything else is
  written in px. The browser holds the limits and shrinks the sized panes when the split pane gets narrower; a move is
  clamped to the same limits and to the room the other panes leave (the filling pane keeps its minimum).

**JS API.** The attribute path makes the controller (`DS.core.get(el, 'splitpane')`); from the page:

```js
const split = DS.splitpane.create(el, { store: 'devices', step: 16, stack: 560 });
split.get();                          // { sizes: [320, null], collapsed: [false, false] } (px; null: the filling pane)
split.set({ sizes: [400], collapsed: [false] });   // px, or CSS text ('30%')
split.collapse(0); split.expand('device-list'); split.toggle(0);
split.reset();                        // the markup's sizes, nothing collapsed, the remembered sizes forgotten
split.on('change', ({ sizes, collapsed, index }) => { /* also a bubbling ds:change on the split pane */ });
DS.splitpane.toPixels('calc(20% + 16px)', 1000);   // 216
DS.splitpane.nextSize({ size: 320, min: 240, max: 600 }, { key: 'ArrowRight' });   // { size: 336, collapsed: false }
```

`DS.splitpane.create` returns the controller (`get`, `set`, `collapse`, `expand`, `toggle`, `reset`, `on`, `update`,
`destroy`); its toggle buttons need `DS.init()` (one delegated listener per root), or call `toggle()`. A change of
`data-ds-splitpane-step`, `-stack` or `-store` reaches the controller through `update()`, so the panes keep their sizes.
`destroy()` takes back what it wrote: a collapsed pane opens to its markup size and is no longer inert, the dividers
keep only the attributes of the markup. `ds:change` goes out after a
drag, a key, a toggle or `set()`, never during a drag. `DS.splitpane.toPixels` and `DS.splitpane.nextSize` are the pure
functions behind it.

**Accessibility** (APG window splitter). Each divider is `role="separator"`, focusable, with `aria-orientation`
(`vertical` between panes side by side), `aria-controls` (the pane it resizes) and its value: `aria-valuenow`,
`aria-valuemin` and `aria-valuemax` are the pane's share of the room in percent; a collapsed pane reads
`aria-valuetext` "Collapsed" (`t('splitpaneCollapsed')`). Name every divider after its pane (`aria-label="Resize the
device list"`); one without a name gets `t('splitpaneResize')`. Keys on a divider: `ArrowLeft` / `ArrowRight` (stacked:
`ArrowUp` / `ArrowDown`) move it, `Shift` four times as far; `Home` and `End` give the pane its smallest and largest
size; `Enter` collapses and restores a collapsible pane. Name the panes (`aria-label` or a heading) so a screen reader
user knows what grew.

**Forced colours.** The line and the grip in `CanvasText`, `Highlight` while dragged; the focus ring in `CanvasText`.

**Hooks:** `--ds-splitpane-size`, `--ds-splitpane-min`, `--ds-splitpane-max` (on a pane), `--ds-splitpane-height`,
`--ds-splitpane-line`, `--ds-splitpane-grip`, `--ds-splitpane-hit`, `--ds-splitpane-radius`,
`--ds-splitpane-padding` ([theming.md](theming.md#component-hooks)).

**Motion.** Collapsing and restoring glide the size (`--ds-splitpane-size`, registered) over `--ds-dur-medium` on
`--ds-ease-out` (a size that pushes layout never overshoots) and reverse from where they are; a drag and the keys move at
once. The line and the grip change colour over `--ds-dur-fast`. Focus: a ring around the grip, solid from the first
frame, snapping from offset + width to the offset.

<!-- changelog -->
- Split pane (`.ds-splitpane`, `DS.splitpane`): two or three panes, side by side or stacked, with dividers that drag
  and move by keyboard (APG window splitter), limits per pane, collapse and restore (keys, double click, toggle
  buttons), sizes remembered through `DS.store`, stacking under a width of its own on a phone
  (`data-ds-splitpane-stack`). New strings `splitpaneResize`, `splitpaneCollapsed`.
