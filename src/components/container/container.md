## Container presets

Three widths a region can have (compact, medium, expanded), as classes that query the nearest container instead of
the window: a part of the page reacts to the room it has, in a side sheet, a card or beside an open drawer.

```html
<section class="ds-container">                                      <!-- a container (inline size) -->
  <div class="ds-cluster ds-stack-compact">                         <!-- a row; a column of full-width items when compact -->
    <button class="ds-btn" type="button">Export</button>
    <button class="ds-btn ds-btn--filled" type="button">Add device</button>
  </div>
  <span class="ds-meta ds-hide-compact">Last synced 09:12</span>     <!-- not when compact -->
  <span class="ds-meta ds-only-compact">09:12</span>                 <!-- only when compact -->
</section>
```

| Size | Container width | Typical region |
|---|---|---|
| compact | narrower than 600px | a phone, a side sheet, a narrow card |
| medium | 600px to 839px | a tablet, a page beside an open drawer |
| expanded | 840px and wider | a desktop page |

| Class | Effect |
|---|---|
| `.ds-container` | makes the element a container (`container-type: inline-size`) |
| `.ds-hide-compact`, `.ds-hide-medium`, `.ds-hide-expanded` | hidden at that size |
| `.ds-only-compact`, `.ds-only-medium`, `.ds-only-expanded` | shown at that size only |
| `.ds-stack-compact` | a flex row (a `.ds-cluster`, a head's actions) that turns into a column of full-width items when compact; a `.ds-push` item drops its auto margin there |

- Below or above a size: combine two. Hidden below expanded: `.ds-hide-compact.ds-hide-medium`; hidden above compact:
  `.ds-hide-medium.ds-hide-expanded`.
- The nearest container decides: a `.ds-container`, the page's content area (`.ds-content`; the styleguide stage
  too) or a component that is one (a tile). With no container around, no query matches: everything shows and
  nothing stacks.
- `.ds-container` takes inline-size containment: its width no longer follows its content. Use it on a block, or on
  a flex or grid item that has a width of its own (a `.ds-split__main`), never on a shrink-to-fit item.
- Hiding is `display: none !important`, like the `hidden` attribute: the element leaves the layout and the
  accessibility tree, whatever `display` a component gives it. Keep every action and name reachable at every size: an
  action that hides when compact moves into a menu that shows only then, and an icon button keeps its `aria-label`.
- Options: none read; these classes have no look.
- Forced colours: nothing of their own. Print: a container keeps querying its own width on paper (the content of an
  A4 page in portrait is about 720px wide: medium); hide what paper does not need with `.ds-print-hide`
  ([Print](#print)).

<!-- changelog -->
- Added: Container presets, `.ds-container` and the visibility classes `.ds-hide-compact`, `.ds-hide-medium`,
  `.ds-hide-expanded`, `.ds-only-compact`, `.ds-only-medium`, `.ds-only-expanded` and `.ds-stack-compact` on the
  container sizes compact (under 600px), medium (600-839px) and expanded (840px and up).
