## State label

The workflow state of one item in a bold, filled pill: open, in review, merged, closed, draft. One per item, in its
head (a ticket's title row, a change request), where the state is the first thing to read.

```html
<h1 class="ds-page-head__title">Printer jams on the second floor
  <span class="ds-lozenge ds-tone-success">[icon circleDot 16]<span>Open</span></span></h1>

<span class="ds-lozenge ds-tone-primary">[icon gitPullRequest 16]<span>In review</span></span>
<span class="ds-lozenge ds-tone-info">[icon gitMerge 16]<span>Merged</span></span>
<span class="ds-lozenge ds-tone-error">[icon circleX 16]<span>Closed</span></span>
<span class="ds-lozenge ds-tone-neutral">[icon pencil 16]<span>Draft</span></span>

<!-- subtle: a list of many items -->
<span class="ds-lozenge ds-lozenge--subtle ds-tone-success">[icon circleDot 16]<span>Open</span></span>
```

Which one: a **state label** says where an item stands in its workflow; a [status chip](#status-chip) (`.ds-status`)
says how a thing is doing (synced, failing, running); a [tag](#status-chip) (`.ds-tag`) adds a word ("Beta"); a
[badge](#badge) counts.

| Variant | Class | Look |
|---|---|---|
| Filled | `.ds-lozenge` | the tone's colour with its on-colour: bold, for an item's head |
| Subtle | `.ds-lozenge--subtle` | the tone's container pair, for a list of many items |

Pick the tone per state once and keep it with its icon everywhere: the state is always a word and usually an icon,
never the colour alone. Without a tone it is neutral.

### Options

On the lozenge or any ancestor, except the tone; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the lozenge | 4px of height per step (20px to 36px; 28px at md), the side padding 2px per step; type and icon stay |
| Shape | `.ds-shape-*` | the lozenge | its radius times `--ds-shape`: a pill at the default, never rounder than half its height |
| Tone | `.ds-tone-*` | the lozenge itself; an inherited tone is ignored | the fill (or the container, `--subtle`) and its ink |
| Density, touch | | | not read: a lozenge is no target and sits in a line |

### Accessibility

Plain text in the item's head, read with it; nothing takes focus. A state that changes while the page is open is
announced by the page (`DS.a11y.announce('Closed')`), not by the label.

### Forced colours

A transparent outline becomes its `CanvasText` edge, the text `CanvasText`: the word and the icon carry the state.

### Hooks

`--ds-lozenge-height`, `--ds-lozenge-radius`: see [theming.md](theming.md).

**Motion:** a state that changes glides its colours over `--ds-dur-medium`; re-render with `DS.dom.morphHtml`, so
the element stays and the class change transitions.

<!-- changelog -->
- State label (new, `lozenge`): `.ds-lozenge` and `--subtle`, a bold workflow state in the tone of the class on it,
  with a word and an icon; hooks `--ds-lozenge-height`, `--ds-lozenge-radius`.
