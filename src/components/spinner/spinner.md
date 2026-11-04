## Spinner

The inline loader: the M3 arc that grows and shrinks while it turns, without a track, for buttons, chips, status chips
and table cells. A known share is the same component as a ring.

```html
<span class="ds-spinner" aria-hidden="true"></span>                     <!-- 16px, on a surface -->
<span class="ds-spinner ds-spinner--ink ds-sm" aria-hidden="true"></span>  <!-- 12px, the text colour on a faint ring: in a button or chip -->
<span class="ds-spinner ds-spinner--determinate" role="progressbar" aria-label="Upload"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" style="--ds-progress: .4"></span>   <!-- a ring, 40px -->
<span class="ds-spinner ds-spinner--determinate ds-spinner--flat" role="progressbar" aria-label="Upload"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" style="--ds-progress: .4"></span>   <!-- a plain ring -->
```

**Options** ([options.md](options.md)): classes on the spinner or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the spinner |
|---|---|---|---|
| Variant | `--ink`, `--determinate`, `--flat` (with `--determinate`) | the spinner | the text colour on a faint ring; a share as a ring; a ring without its wave |
| Size | `.ds-xs` ... `.ds-xl` | the spinner or a group | 4px per step, at least 10px (10, 12, 16, 20, 24px); the ring 8px per step (24 to 56px), its width a tenth of its size |
| Tone | `.ds-tone-*` | the spinner itself; an inherited tone is ignored | the arc in the tone, a ring's track in the tone's container; a share in a tone needs its word next to it |
| Density, shape, touch | | | not read: a spinner is round, no target, and its size follows the size step alone |

- `.ds-spinner--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-spinner--ink` with `.ds-sm`, the same look.
  Until then it keeps its fixed 12px at any size.
- Show it only after `--ds-delay-loader`, so fast loads never flash it: delay it through `.ds-loading`, a busy button or
  `<span class="ds-enter ds-enter--delayed">`. Never put `.ds-enter` on it in static markup (wrap it); it would replace
  the arc and the turn while it runs. A block of the page that waits shows the [shape loader](#shape-loader) instead.
- **Circular progress** (`.ds-spinner--determinate`): the share as an arc, a gap, then the track in `--ds-accent`, on a
  wavy ring (`.ds-spinner--flat`: a plain ring). It never spins; set `--ds-progress` (0 to 1) and the arc glides like
  linear progress. Markup as for [progress](#progress): `role="progressbar"`, `aria-valuemin`, `aria-valuemax`,
  `aria-valuenow`, a name. Inside `.ds-progress` it reads the share of its parent and lands with the bar.
- Hooks ([theming.md](theming.md#component-hooks)): `--ds-spinner-size` (16px), `--ds-spinner-determinate-size` (40px),
  the md bases; `--ds-spinner-color`, `--ds-spinner-track` (none; `--ink` a faint ring of the text colour; a ring
  `--ds-accent`), `--ds-spinner-width` (2px; replaces a project's own `border-width`), `--ds-spinner-determinate-width`
  (a tenth of its size).

**Accessibility.** The turning arc is decoration: `aria-hidden`, and a `role="status"` around it (or the busy control)
carries the words. A ring is a `role="progressbar"` with a name. It is no stop of its own.

**Forced colours.** The arc is painted `Highlight` and the track `GrayText`, in any tone. Print: both keep their colours,
so a status chip keeps its glyph and a ring its share.

**Motion:** the loader rows of [Feedback](motion.md#feedback) in motion.md: the arc (`ds-spinner-arc`, `--ds-loop-arc`)
and the turn (`ds-spin`, `--ds-loop-spin`) always run at their token speed.

<!-- changelog -->
- Spinner: its own docs section; size steps (`--ds-spinner-size`, `--ds-spinner-determinate-size`), tones on the
  element. New `.ds-spinner--ink`; `.ds-spinner--sm` deprecated: `.ds-spinner--ink` with `.ds-sm`.
