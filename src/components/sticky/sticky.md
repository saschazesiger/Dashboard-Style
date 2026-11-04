## Sticky

A head, a foot or a side that stays in view while its scroller moves, with a raised edge (a hairline and a shadow
towards the content) once content passes under it.

```html
<div class="x-ticket-list" style="overflow: auto; max-block-size: 24rem">     <!-- any scroller, or the page -->
  <header class="ds-sticky ds-sticky--head">Tickets · 12 open</header>
  <ul class="ds-list">…</ul>
  <div class="ds-sticky ds-sticky--foot">3 selected …actions…</div>
</div>

<div class="ds-split">
  <nav class="ds-split__side ds-sticky ds-sticky--side" aria-label="On this page">…</nav>   <!-- stays beside long content -->
  <div class="ds-split__main">…</div>
</div>

<div class="x-wide-board" style="overflow-x: auto">
  <div class="x-row"><span class="ds-sticky ds-sticky--start">LAPTOP-0042</span> …columns…</div>
</div>
```

| Class | Sticks to | Edge |
|---|---|---|
| `.ds-sticky--head` | the top of its scroller (block start) | below it, once rows pass under it |
| `.ds-sticky--foot` | the bottom (block end) | above it, while rows are hidden under it |
| `.ds-sticky--start` | the inline start of a sideways scroller | at its end side, once columns pass under it |
| `.ds-sticky--end` | the inline end | at its start side, while columns are hidden under it |
| `.ds-sticky--side` | the top, as a side column beside long content | none: no fill and no edge, nothing passes under it; it keeps its own height in a flex or grid row (`align-self: start`) |
| `.ds-sticky--flat` | (with one of the above) | never |

Every box needs `.ds-sticky` and one placement. It is opaque (`--ds-sticky-bg`, the surface) and above what scrolls
under it (`--ds-z-sticky`); a table has sticky rows and pinned columns of its own ([Table](#table)).

**The raised edge.** A layer under the box's content carries the hairline (`--ds-sticky-line`) on the side that
faces the content and the shadow (`--ds-sticky-shadow`) beyond it. Where scroll-driven animations exist it follows
the scroller's scroll timeline: the head and the start column raise it over the first `--ds-space-2` of scroll, the
foot and the end column lower it over the last `--ds-space-2`. Elsewhere it shows over `--ds-dur-fast` from
attributes the page attaches once through `DS.dom`:

```js
DS.dom.watchScrolled(list, head);                  // head: data-scrolled on the head (or watchScrolled(list): on the list, the head a child of it)
DS.dom.scrollEdges(list, { axis: 'block' });       // foot: data-ds-overflow-end on the list
DS.dom.scrollEdges(board);                         // start and end: data-ds-overflow-start, data-ds-overflow-end
```

Watch a scroller on the axis its boxes stick on (the attributes of both axes have the same names). Both paths read
the scroller, not the box: a head that sits lower in its scroller raises its edge from the first scrolled pixel, before
it sticks, so put a head first in its scroller.

- `--ds-sticky-offset` (0px) is the distance from the scroller's edge: a page that scrolls under a fixed top bar
  sets it to the bar's height, a second head below a first to the first one's height.
- Keyboard: focus that moves under a head or a foot scrolls clear of it only if the scroller keeps room: give it
  `scroll-padding-block-start` (the head's height) and `scroll-padding-block-end` (the foot's).
- Accessibility: the box stays where it is in the reading and Tab order; make a head a `header` (or a heading in
  it), a foot a `footer`, a side a landmark with its name (`nav aria-label="On this page"`).
- Options: none read. The box is a frame; its controls compute their own size, density and touch.
- Forced colours: the box is Canvas, the shadow goes and the hairline stays (a border).
- Print: nothing sticks; the box prints where it stands, with no edge.
- Progressive: scroll-driven animations (the edge on the scroller's scroll timeline); without them the `DS.dom`
  attributes above, or no edge.
- Hooks: `--ds-sticky-offset`, `--ds-sticky-bg`, `--ds-sticky-line`, `--ds-sticky-shadow`
  ([theming.md](theming.md#component-hooks)).

**Motion:** the edge fades on `ds-scroll-fade` along the scroll position, or on `--ds-dur-fast` in the fallback;
the box itself never moves on its own.

<!-- changelog -->
- Added: Sticky, `.ds-sticky` with `--head`, `--foot`, `--start`, `--end`, `--side` and `--flat`: a raised edge
  once content passes under the box, on the scroller's scroll timeline or through `DS.dom.watchScrolled()` and `DS.dom.scrollEdges()`. Hooks
  `--ds-sticky-offset`, `--ds-sticky-bg`, `--ds-sticky-line`, `--ds-sticky-shadow`.
