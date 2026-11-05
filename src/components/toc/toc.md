## Jump links

The sections of a long page, and which one is being read: a table of contents beside the content, or a bar of anchors
over it (the section anchors of an [object page](#object-page)). The link of the section in view is marked as the reader
scrolls (scroll-spy), and a link scrolls to its section and moves the focus there.

```html
<nav class="ds-toc ds-toc--sticky" aria-labelledby="toc-title" data-ds-toc>
  <p class="ds-toc__title" id="toc-title">On this page</p>
  <ol class="ds-toc__list">
    <li><a class="ds-toc__link" href="#overview">Overview</a></li>
    <li><a class="ds-toc__link" href="#hardware">Hardware</a>
      <ol class="ds-toc__list">
        <li><a class="ds-toc__link" href="#storage">Storage</a></li>
      </ol></li>
    <li><a class="ds-toc__link" href="#software">Software<span class="ds-toc__count"><span class="ds-sr">, </span>3</span></a></li>
  </ol>
</nav>

<!-- a bar of anchors over the content: the same list -->
<nav class="ds-toc ds-toc--bar ds-toc--sticky" aria-label="Sections" data-ds-toc> ... </nav>
```

**Options** ([options.md](options.md)): classes on the toc or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | column (default), `--bar`; `--sticky` | the nav | a column with a line at its start, or a row of anchors over a hairline; `--sticky` with either |
| Size | `.ds-xs` ... `.ds-xl` | the nav or a group | a link 16 to 48px high in a column (`--ds-toc-height`, 32px at md), 32 to 64px in a bar (`--ds-toc-bar-height`, 48px), 8px per step; side padding 4px per step; the size's type role (`--ds-toc-font`) at the regular weight (the current link alone takes the label weight) |
| Density | `.ds-density-*` | any container | 4px of height per step; padding and type stay |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the radius of the ring and the state layer, at rest and pressed |
| Touch | `.ds-touch` | the theme or a container | a link is at least `--ds-touch-target` high |
| Tone | none | | a link states no status; a `.ds-toc__count` may say how many |

- **Column** (`.ds-toc`): a `--ds-line` hairline at its start, a row per link in `--ds-text-2`; nested lists are indented
  (by padding, so the bar stays on the line). `.ds-toc__title` is the meta role above the list; name the nav by it
  (`aria-labelledby`) or by an `aria-label`.
- **Current**: `aria-current="location"` on the link of the section being read. It takes `--ds-primary` ink, the label
  weight and the indicator (`.ds-toc__indicator`, `DS.indicator`): a `--ds-toc-indicator-width` (3px) bar in
  `--ds-toc-indicator-color` on the line, under the link in a bar. It glides from link to link; never colour alone.
- **`.ds-toc--bar`**: a row of anchors over a hairline, as line tabs (48px links, the bar under the current one). It
  scrolls sideways without a scrollbar and keeps the current link in view; only the first level shows.
- **`.ds-toc--sticky`**: a column sticks `--ds-toc-top` (`--ds-space-4`) below the top of its scroller and scrolls
  itself when taller than the view (at 600px of the content, where it sits above the text, it stops sticking); a bar sticks at the top on `--ds-toc-bg` (`--ds-backdrop`; set it to the surface
  it lies on). Give the sections `scroll-margin-top` for what sticks above them (a sticky bar, a page head).
- `.ds-toc__count`: a count after the label (tabular meta figures, the link's colour); a `.ds-sr` separator reads it
  with the label.
- Press: the state layer is a pill inside the link that turns squarer while pressed and springs back, with the ripple
  (`DS.ripple.attach()`); the keyboard ring is inset and snaps inward.

### Behaviour: `data-ds-toc`

`data-ds-toc` on the nav (`DS.init()` finds it; `DS.toc.create(nav, options)` is the imperative path, with the same
controller):

- **Scroll-spy.** The current section is the last one whose top has passed the reading line, `data-ds-toc-offset` px
  below the top of the scroller (default: the first section's `scroll-margin-top` plus a quarter of the scroller's
  height). At the end of the scroll, where the last sections cannot reach the line, the last one whose top shows is
  current. An `IntersectionObserver` whose root ends at the reading line says when a section crosses it, a second one
  when the last section shows; there is no scroll listener. The scroller is the nearest scrolling ancestor of the first
  section, else the page. A section is the element the link's hash names: a heading or a whole `<section>`.
- **Jumps.** A click or Enter on a link scrolls its section to the top (smoothly within three heights of the scroller,
  at once beyond that), marks its link at once, and moves the focus to the section
  (with `tabindex="-1"` when it takes no focus of its own; the focus never scrolls), so Tab goes on inside it. The link
  stays marked while its section shows, even a short one near the end. The hash is written with
  `history.pushState` (no `hashchange`), so the address can be shared; `data-ds-toc-hash="off"` leaves the address
  alone (a router that owns the hash). A click with a modifier opens the link as the browser does.
- `ds:change` on the nav: `{ id, link, target, reason }` (`reason`: `'scroll'` or `'link'`).

| Attribute | Option | What |
|---|---|---|
| `data-ds-toc` | | the behaviour, on the `.ds-toc` nav |
| `data-ds-toc-offset` | `offset` | the reading line, px below the top of the scroller |
| `data-ds-toc-hash` | `hash: false` | `off`: a jump leaves the address alone |

The controller (`DS.get(nav, 'toc')`, or what `create()` returns): `get()` (the id of the current section, or null),
`set(id)` (a jump, as a click: scrolls, focuses, marks), `on('change', fn)` (returns the unsubscribe), `refresh()` (reads
the links and sections again; added and removed links are read by themselves) and `destroy()`.
`DS.toc.current(tops, { line, bottom, atEnd, pinned })` is the rule alone: the index of the current section from the
tops of the sections (px from the top of the view).

What the module writes is owned state (`DS.dom.morphHtml` keeps it): `aria-current` on the links and the `tabindex` it
gave a section.

- Keyboard and names: every link is a tab stop (a list of links, not a widget); Enter jumps and moves the focus to the
  section. The nav is a landmark named by its title or `aria-label`; the current link is `aria-current="location"`,
  "current location" to a screen reader.
- Forced colours: the current link is `SelectedItem` / `SelectedItemText` (a choice in a set) and the indicator is
  hidden; a focused current link keeps a `CanvasText` ring inside; the line stays `CanvasText`. Print leaves the toc
  off the paper.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the bar glides from link to link as the tabs' indicator does (stretching toward its target, landing on
`--ds-ease-spatial`); a jump scrolls smoothly within three heights of the scroller. The labels change colour on the
indicator's timing.

<!-- changelog
- Jump links (`.ds-toc`, `DS.toc`, `toc.js`): a table of contents or a bar of anchors, sticky, with scroll-spy through
  `IntersectionObserver` (`aria-current="location"`), jumps that move the focus, and `ds:change`.
-->
