## Layout

The layout primitives: a row that wraps, a side and main column, equal parts, a centred column, a full-height cover,
a media frame and an auto-fit grid. Each sizes itself by its content and its own width, with no media query and no
container, so the same markup fits a phone, a side sheet and a wide page.

```html
<div class="ds-cluster">                               <!-- a row that wraps: buttons, chips, filters -->
  <button class="ds-btn" type="button">Export</button>
  <button class="ds-btn ds-btn--filled ds-push" type="button">Add device</button>  <!-- pushed to the end -->
</div>
<div class="ds-cluster ds-cluster--between">…title…, …actions…</div>

<div class="ds-split">                                 <!-- side beside main; stacked when main gets narrow -->
  <section class="ds-split__side" aria-label="Filters">…filters…</section>
  <div class="ds-split__main">…results…</div>
</div>

<div class="ds-switcher">…three key figures…</div>     <!-- one row of equal parts, or one column -->
<div class="ds-measure">…a form or text…</div>         <!-- centred at the reading measure -->

<div class="ds-cover" style="--ds-cover-min: 320px">   <!-- fills its height, __main in the middle -->
  <p class="ds-meta">Step 2 of 3</p>
  <div class="ds-cover__main">…sign-in card…</div>
  <p class="ds-meta">Need help?</p>
</div>

<div class="ds-frame ds-frame--4-3"><img src="device.jpg" alt="LAPTOP-0042, front"></div>
<div class="ds-grid">…cards…</div>                     <!-- auto-fit columns of at least 16rem -->
<div class="ds-grid ds-grid--max-3">…tiles…</div>       <!-- the same, never more than three -->
```

The one-column stack is `.ds-stack` of [Page](#page); space any of them with the `.ds-gap-*` classes of
[Spacing](#spacing).

| Primitive | Classes | What it does |
|---|---|---|
| Cluster | `.ds-cluster`, `.ds-cluster--end`, `.ds-cluster--center`, `.ds-cluster--between`, `.ds-cluster--top`, `.ds-cluster--baseline`, `.ds-cluster--nowrap` | a row that wraps, items centred across; `--nowrap` keeps one line: a `.ds-truncate` title (or the item that holds one, such as a heading around it) shrinks and is cut, every other item keeps its width, an icon button or an avatar too; without a `.ds-truncate` the items shrink to their longest word |
| Push | `.ds-push` | an item of a cluster (or any flex row) that goes to the end of its line with everything after it |
| Split | `.ds-split`, `.ds-split__side`, `.ds-split__main`, `.ds-split--stretch` | the side at `--ds-split-side` beside main; once main would be narrower than `--ds-split-min` of the row, both stack at full width. The side may come first or second in the markup; both start at the top unless `--stretch` |
| Switcher | `.ds-switcher`, `.ds-switcher--top` | equal parts on one row while the switcher is at least `--ds-switcher-at` wide, else each on a row of its own (never two above one); five or more parts always stack |
| Measure (center) | `.ds-measure`, `.ds-measure--wide`, `.ds-measure--intrinsic` | a column centred at most `--ds-measure-max` wide (the reading measure; `--wide`: `--ds-content-max`); `--intrinsic` centres each child at its own width |
| Cover | `.ds-cover`, `.ds-cover__main`, `.ds-cover--screen` | at least `--ds-cover-min` high (`--screen`: the dynamic viewport), `__main` vertically centred, the parts before and after it at the edges |
| Frame | `.ds-frame`, `.ds-frame--square`, `.ds-frame--4-3`, `.ds-frame--3-4`, `.ds-frame--16-9`, `.ds-frame--21-9` | an aspect ratio (`--ds-frame-ratio`, 16 / 9) that crops an `img`, `video`, `iframe`, `canvas` or `picture` to cover it; anything else is centred on `--ds-surface-low` |
| Grid | `.ds-grid`, `.ds-grid--fill`, `.ds-grid--max-2`, `.ds-grid--max-3`, `.ds-grid--max-4`, `.ds-grid--max-6` | as many columns as fit at `--ds-grid-min` (one on a phone); `--fill` keeps the empty tracks, so a lone card stays one column wide; `--max-n` never more than n, whatever the gap |

| Option | Applies to | Effect |
|---|---|---|
| `.ds-density-*` | the gaps of cluster, split, switcher and grid | 2px less per step (the padding of blocks), never below 0 |
| `.ds-gap-*` ([Spacing](#spacing)) | every primitive | an exact gap on the space scale, whatever the density |
| `.ds-shape-*` | `.ds-frame` | multiplies its radius |
| Size, tone, touch | not read | a primitive has no height or meaning; its children compute their own |

- Behaviour: none; plain CSS. Nothing moves: a primitive never animates its layout.
- Accessibility: the visual order is the markup order everywhere (no `order`, no reversed direction), so reading and
  Tab order follow what is seen. `.ds-split` stacks the side where it stands in the markup: put a filter side first,
  a details side last. A frame's media keeps its own `alt` or label.
- Forced colours: the primitives draw nothing; a frame keeps a transparent outline that becomes its edge.
- Hooks: `--ds-cluster-gap`, `--ds-split-gap`, `--ds-switcher-gap`, `--ds-grid-gap`, `--ds-split-side`,
  `--ds-split-min`, `--ds-switcher-at`, `--ds-measure-max`, `--ds-measure-pad`, `--ds-cover-min`, `--ds-cover-pad`,
  `--ds-frame-ratio`, `--ds-frame-radius`, `--ds-grid-min` ([theming.md](theming.md#component-hooks)); set them on the
  element (`style="--ds-grid-min: 12rem"`) or in the theme.

<!-- changelog -->
- Added: Layout, the layout primitives `.ds-cluster`, `.ds-push`, `.ds-split`, `.ds-switcher`, `.ds-measure`
  (center), `.ds-cover`, `.ds-frame` and the auto-fit grid `.ds-grid` (`--ds-grid-min`, `--max-n`, `--fill`), with
  their hooks.
