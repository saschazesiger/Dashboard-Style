## Status chip

```html
<span class="ds-status ds-status--ok">[icon check 16]<span>Synced</span></span>
<span class="ds-status ds-status--warning">[icon alert 16]<span>Expires soon</span></span>
<span class="ds-status ds-status--error">[icon alert 16]<span>Failed</span></span>
<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span>
<span class="ds-status">[icon clock 16]<span>Waiting</span></span>
<span class="ds-status">[icon ban 16]<span>Off</span></span>
```

Always icon and word. Show chips for deviations, not for the normal case. When the label of a running chip changes,
update the text node only, so the spinner does not restart (`DS.dom.morphHtml`).

Status changes glide, for a user action and a poll alike: render with `DS.dom.morphHtml`, which patches the kept
chip in place, so its container and icon change colour over `--ds-dur-medium` (250ms); an icon or spinner that
comes in new (running to ok) fades in and springs up from `--ds-scale-small` (progressive: `@starting-style`, which
also plays on a chip's first render; elsewhere the icon swaps at once). A row that a keyed `morphHtml` moves (a sort)
keeps its icon as it is: where `moveBefore` is missing, the moved node carries `data-ds-moving` for one style flush,
so the entrance never plays again. The label text changes at once. A page that swaps the icon itself can cross-fade it with `DS.motion.crossfade(chip, icon, { kind: 'icon' })`.

### Tags

A tag is a label of words ("Preview", "Beta", "External"), not a state and not a count; it is not interactive:

```html
<span class="ds-tag">Preview</span>
<span class="ds-tag ds-tag--neutral">[icon tag 16]External</span>
```

The caption type on the tint (hooks `--ds-tag-bg`, `--ds-tag-color`, from `--ds-accent` and `--ds-on-accent`;
`--neutral`: `--ds-surface-high` and `--ds-text`), an optional leading 16px icon (`--ds-on-accent-icon`), the pill
radius at half its height (`--ds-tag-height`, 24px). Forced colours draw a `CanvasText` outline. Tag = words, badge
= counts ([Badge](#badge)), status chip = a state with an icon.

**Motion:** the "Status chip" row of [Feedback](motion.md#feedback) in motion.md.

