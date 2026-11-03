## Disclosure

A `<details>` with the system's summary (2.0): advanced settings, or sections that open one at a time.

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

- The plain summary is a pill in the label font, at least `--ds-disclosure-height` (40px) high, whose state layer
  hangs `--ds-space-2` into the space at its sides (its text stays in line with the content around it): hover
  `--ds-state-hover`, press in `--ds-dur-micro`, the focus layer and a ring that snaps in, the press morph and the
  ripple. `.ds-disclosure__body` starts `--ds-space-3` below it.
- `.ds-disclosure--row`: a full-width summary (`--ds-disclosure-row-height`, 48px) with `.ds-disclosure__title`,
  `.ds-disclosure__meta` in `--ds-text-2` and the chevron at the end. Rows in a `.ds-disclosure-list` are divided by
  hairlines and run to the edges of a card (`--ds-card-pad`); a row takes a rectangular layer, an inset ring and the
  ripple, no morph.
- It opens and closes like every `.ds-collapsible` and the `.ds-chevron` turns with it. Rows with the same `name`
  open one at a time where the browser supports it (progressive; elsewhere each opens on its own). The errors list
  of an alert (`.ds-errors`) keeps its own summary.

**Motion:** `.ds-collapsible` and `.ds-chevron` in [Utilities](motion.md#utilities-css) and the press of
[Controls](motion.md#controls) in motion.md.

