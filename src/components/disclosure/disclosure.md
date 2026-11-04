## Disclosure

A `<details>` with the system's summary: advanced settings, or an accordion whose sections open one at a time.

```html
<details class="ds-collapsible ds-disclosure">
  <summary>Advanced settings [icon chevronDown 20 .ds-chevron]</summary>
  <div class="ds-disclosure__body"> ... </div>
</details>

<div class="ds-disclosure-list">
  <details class="ds-collapsible ds-disclosure ds-disclosure--row" name="sync-help">
    <summary><span class="ds-disclosure__title">When does the sync run?</span><span class="ds-disclosure__meta">Nightly</span>[icon chevronDown 20 .ds-chevron]</summary>
    <div class="ds-disclosure__body"> ... </div>
  </details>
  <details class="ds-collapsible ds-disclosure ds-disclosure--row" name="sync-help"> ... </details>
</div>
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-disclosure--row` | the details | a full-width row with a title, a meta and the chevron at the end |
| Exclusive | the same `name` on each `<details>` | rows or plain | one open at a time, native, no script |
| Size | `.ds-xs` ... `.ds-xl` | the disclosure or an ancestor | 8px of height per step, the type role of the size (`--ds-size-font`) |
| Density | `.ds-density-*` | the disclosure or an ancestor | 4px of height per step; a row's side padding and the room above and below a body 2px per step |
| Shape | `.ds-shape-*` | the disclosure or an ancestor | multiplies the plain summary's rest and pressed radius; a row stays rectangular |
| Touch | `.ds-touch` | the disclosure or an ancestor | at least `--ds-touch-target` high; touch wins over size and density |
| Tone | not read | | a disclosure shows no meaning of its own |

- The plain summary is a pill in the label font, 40px high at the default size and density (hook
  `--ds-disclosure-height`, the base the options apply to), whose state layer
  hangs `--ds-space-2` into the space at its sides (its text stays in line with the content around it): hover
  `--ds-state-hover`, press in `--ds-dur-micro`, the focus layer and a ring that snaps in, the press morph (hooks
  `--ds-disclosure-radius`, `--ds-disclosure-radius-pressed`, each times `--ds-shape`) and the ripple. Font:
  `--ds-disclosure-font`. `.ds-disclosure__body` starts `--ds-space-3` below it.
- `.ds-disclosure--row`: a full-width summary (`--ds-disclosure-row-height`, 48px, the base) with
  `.ds-disclosure__title`, `.ds-disclosure__meta` in `--ds-text-2` and the chevron at the end. Rows in a
  `.ds-disclosure-list` are divided by hairlines and run to the edges of a card (the card sets
  `--ds-disclosure-row-padding-exact` to `--ds-card-pad`; elsewhere `--ds-disclosure-row-padding`, `--ds-space-4`, 2px
  less per density step); a row takes a rectangular layer, an inset ring and the ripple, no morph.
- It opens and closes like every `.ds-collapsible` and the `.ds-chevron` turns with it.
- An exclusive accordion needs no script: `<details>` that share a `name` open one at a time, and the one that closes
  plays the same motion. A row may start open (`open` on one of them). The errors list of an alert (`.ds-errors`)
  keeps its own summary.
- Keyboard and names: Tab reaches each summary, Enter and Space toggle it (native); screen readers announce its text
  and the expanded state. Keep the chevron `aria-hidden` (`DS.icons` does).
- Forced colours: no state layer; the ring, the hairlines and the turned chevron stay.
- Hooks: `--ds-disclosure-height`, `--ds-disclosure-row-height`, `--ds-disclosure-radius`,
  `--ds-disclosure-radius-pressed`, `--ds-disclosure-font`, `--ds-disclosure-row-padding`,
  `--ds-disclosure-row-padding-exact` ([theming.md](theming.md#component-hooks)).

**Motion:** `.ds-collapsible` and `.ds-chevron` in [Utilities](motion.md#utilities-css) and the press of
[Controls](motion.md#controls) in motion.md.

<!-- changelog -->
- Disclosure on the options model: size, density and touch (`--ds-target-min`; `.ds-touch` no longer sets `--ds-disclosure-height`), shape on the plain summary.
- `details[name]` is at the floor: exclusive accordions are documented without a fallback.
- New hooks `--ds-disclosure-radius`, `--ds-disclosure-radius-pressed`, `--ds-disclosure-font`, `--ds-disclosure-row-padding`, `--ds-disclosure-row-padding-exact`.

