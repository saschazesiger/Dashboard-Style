## Status chip

The state of one item, always with an icon and a word.

```html
<span class="ds-status ds-tone-success">[icon check 16]<span>Synced</span></span>
<span class="ds-status ds-tone-warning">[icon alert 16]<span>Expires soon</span></span>
<span class="ds-status ds-tone-error">[icon alert 16]<span>Failed</span></span>
<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span>
<span class="ds-status">[icon clock 16]<span>Waiting</span></span>
<span class="ds-status">[icon ban 16]<span>Off</span></span>
```

Always icon and word. Show chips for deviations, not for the normal case. When the label of a running chip changes,
update the text node only, so the spinner does not restart (`DS.dom.morphHtml`).

**Options** ([options.md](options.md)): classes on the chip or any ancestor, except the tone. The same for a tag.

| Option | Classes | Where it applies | Effect on the chip |
|---|---|---|---|
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error`; none: neutral | the chip itself; an inherited tone is ignored | the tone's container pair behind the icon and the word |
| Variant | `--running` | the chip | a neutral chip with the primary spinner |
| Size | `.ds-xs` ... `.ds-xl` | the chip or a group | 4px per step, 16 to 32px, and 2px of side padding per step; the caption type and the icon's markup size stay |
| Density | `.ds-density-*` | any container | 2px less height per step, never below its own line; side padding stays |
| Shape | `.ds-shape-*` | any container or the theme | the corners times 0, .5, 1, 1.5 |
| Touch | | | not read: a chip is no target |

- `.ds-status--ok`, `.ds-status--warning`, `.ds-status--error` are **deprecated** (3.0, removed when 3.0 ships):
  `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the chip, the same look under the option every component
  shares.
- Hooks: `--ds-status-height` (24px, the md base), `--ds-status-radius` (`--ds-radius-md`), `--ds-status-spinner-width`
  (2px) ([theming.md](theming.md#component-hooks)).

**Accessibility.** The word is the status and the icon is `aria-hidden`. A chip is no stop of its own and needs no role;
a status that changes while the user waits goes through a live region (`DS.overlay.announce`, or a `role="status"`
around it). Forced colours: the fill goes, icon and word stay in `CanvasText`; a tone changes nothing there, so the word
carries the meaning; the running spinner's arc turns `Highlight`.

Status changes glide, for a user action and a poll alike: render with `DS.dom.morphHtml`, which patches the kept
chip in place, so its container and icon change colour over `--ds-dur-medium` (250ms); an icon or spinner that
comes in new (running to ok) fades in and springs up from `--ds-scale-small` (`@starting-style`, which also plays on a
chip's first render). A row that a keyed `morphHtml` moves (a sort) keeps its icon as it is: where `moveBefore` is
missing, the moved node carries `data-ds-moving` for one style flush, so the entrance never plays again. The label text
changes at once. A page that swaps the icon itself can cross-fade it with `DS.motion.crossfade(chip, icon, { kind: 'icon' })`.

### Tags

A tag is a label of words ("Preview", "Beta", "External"), not a state and not a count; it is not interactive:

```html
<span class="ds-tag">Preview</span>
<span class="ds-tag ds-tone-neutral">[icon tag 16]External</span>
<span class="ds-tag ds-tone-info">Internal</span>
```

The caption type on the tint (hooks `--ds-tag-bg`, `--ds-tag-color`, from `--ds-accent` and `--ds-on-accent`; a tone:
its container pair, neutral `--ds-surface-high` and `--ds-text`), an optional leading 16px icon (`--ds-on-accent-icon`),
the pill radius at half its height (`--ds-tag-height`, 24px at md, with size and density as on the chip; times the
shape). Forced colours draw a `CanvasText` outline. `.ds-tag--neutral` is **deprecated** (3.0, removed when 3.0 ships):
`.ds-tone-neutral`. Tag = words, badge = counts ([Badge](#badge)), status chip = a state with an icon.

**Motion:** the "Status chip" row of [Feedback](motion.md#feedback) in motion.md.

<!-- changelog -->
- Status chip and tag: on the options model (size, density, shape, tones from the class on the element); hook
  `--ds-status-height`. `.ds-status--ok`, `--warning`, `--error` deprecated: `.ds-tone-success`, `-warning`, `-error`.
  `.ds-tag--neutral` deprecated: `.ds-tone-neutral`.
