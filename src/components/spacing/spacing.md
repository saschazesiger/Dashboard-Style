## Spacing

The gap between the parts of a flex or grid container and, for the rare case, a top margin, both on the space
scale (a 4px grid).

```html
<div class="ds-stack ds-gap-2">…</div>          <!-- 8px between the parts -->
<div class="ds-cluster ds-gap-6">…</div>        <!-- 24px -->
<div class="ds-grid ds-gap-0">…</div>           <!-- none -->
<p class="ds-mt-4">…</p>                          <!-- 16px above -->
<section class="ds-card" style="display: flex; flex-direction: column">
  …
  <div class="ds-card__links ds-mt-auto">…</div> <!-- pushed to the foot -->
</section>
```

| Class | Value |
|---|---|
| `.ds-gap-0` | `gap: 0px` |
| `.ds-gap-1`, `.ds-gap-2`, `.ds-gap-3`, `.ds-gap-4`, `.ds-gap-5`, `.ds-gap-6`, `.ds-gap-8`, `.ds-gap-10`, `.ds-gap-12` | `gap: --ds-space-<n>` (4, 8, 12, 16, 20, 24, 32, 40, 48px) |
| `.ds-mt-0` | `margin-block-start: 0px` |
| `.ds-mt-1`, `.ds-mt-2`, `.ds-mt-3`, `.ds-mt-4`, `.ds-mt-5`, `.ds-mt-6`, `.ds-mt-8`, `.ds-mt-10`, `.ds-mt-12` | `margin-block-start: --ds-space-<n>` |
| `.ds-mt-auto` | `margin-block-start: auto`: in a flex column, this block and what follows go to the end |

- Space between parts is the container's gap: set it on the stack, cluster, grid or row, never as margins on the
  children. A margin is for what a container cannot give: one block set apart in flowing text, or an item pushed to
  the end of a column (`.ds-mt-auto`; across a row it is `.ds-push` of [Layout](#layout)).
- They come after every component but the ripple in the cascade, so they set the gap of a stack, a cluster, a card's
  rows or a form row whatever the component gives it. Unlayered project CSS still wins over them.
- An exact step: density does not change it. The primitives' own default gaps follow density instead
  ([Layout](#layout)).
- Options, forced colours, motion: none; these classes set space only.

<!-- changelog -->
- Added: Spacing, the gap classes `.ds-gap-0` to `.ds-gap-12` and the top margins `.ds-mt-0` to `.ds-mt-12` and
  `.ds-mt-auto`, on the space scale.
