## Loading

Holds the place of content that is loading: the app start, a loading line, skeleton presets and the page's load bar.

```html
<div class="ds-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Loading ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Importing devices
  <p class="ds-loading__detail">812 of 2,030 rows</p></div>                       <!-- a detail line under the text -->

<div class="ds-skeleton" role="status">
  <span class="ds-sr">Loading ...</span>
  <span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>
  <span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span>
  <span class="ds-skeleton__line ds-skeleton__line--lead" aria-hidden="true"></span>
  <p class="ds-skeleton__note">Loading 3 of 12 reports</p>                        <!-- optional progress line -->
  <div class="ds-skeleton__card">
    <span class="ds-skeleton__line ds-skeleton__line--title"></span>
    <span class="ds-skeleton__line"></span>
    <span class="ds-skeleton__line ds-skeleton__line--short"></span>
    <span class="ds-skeleton__line ds-skeleton__line--mid"></span>
  </div>
</div>
```

Every loader except the bare arc [spinner](#spinner) fades in only after `--ds-delay-loader` (`.ds-boot` after
`--ds-delay-boot`), so fast loads show nothing; keep a visible one up with
`DS.motion.settleLoader(startedAt, { element })`. Delays never stack: a [shape loader](#shape-loader) inside `.ds-boot`,
`.ds-loading` or `.ds-skeleton`, and a loading bar inside a skeleton, have no fade of their own.

**Skeleton presets.** A preset is markup: bones inside a `.ds-skeleton` surface, which holds the role and the words. Mark
the bones `aria-hidden` or leave the whole surface's words in its `.ds-sr`.

| Preset | Markup |
|---|---|
| Text | `.ds-skeleton__line`, with `--mid`, `--short` for shorter lines |
| Heading | `.ds-skeleton__line--heading`, `--lead` (its lead), `--title` (a card title) |
| Avatar | `.ds-skeleton__avatar`: a round bone, 40px at md |
| Media | `.ds-skeleton__media`: a block bone, its ratio `--ds-skeleton-media-ratio` |
| List row | `.ds-skeleton__row` below |
| Table | `.ds-skeleton__table` below |
| Card | `.ds-skeleton__card` above |
| Form | `.ds-skeleton__form` below |

```html
<div class="ds-skeleton" role="status"><span class="ds-sr">Loading devices ...</span>
  <div class="ds-skeleton__row" aria-hidden="true">
    <span class="ds-skeleton__avatar"></span>
    <span class="ds-skeleton__lines"><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></span>
    <span class="ds-skeleton__line"></span>
  </div>
</div>

<div class="ds-skeleton" role="status"><span class="ds-sr">Loading the table ...</span>
  <div class="ds-skeleton__table" aria-hidden="true">
    <div class="ds-skeleton__cells ds-skeleton__cells--head"><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div>
    <div class="ds-skeleton__cells"><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div>
  </div>
</div>

<div class="ds-skeleton" role="status"><span class="ds-sr">Loading the form ...</span>
  <div class="ds-skeleton__form" aria-hidden="true">
    <span class="ds-skeleton__line ds-skeleton__line--label"></span><span class="ds-skeleton__field"></span>
    <span class="ds-skeleton__line ds-skeleton__line--label"></span><span class="ds-skeleton__field"></span>
  </div>
</div>
```

**The wave or the pulse.** By default one calm diagonal wave passes over the whole surface, after its entrance; add
`.ds-skeleton--pulse` to the surface and each bone breathes in place instead, on `--ds-loop-skeleton` and after the same
delay (a small card among finished ones, a long table where a sweep would draw the eye).

**Options** ([options.md](options.md)): classes on the element or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | a bone or a group | a line 2px per step (and a heading, a title); an avatar, a field and a row 8px per step; a loader follows its own steps |
| Density | `.ds-density-*` | any container | the padding of `.ds-loading` and a card, and the gaps of a surface, 2px per step; a field and a row 4px per step, as what they stand for |
| Shape | `.ds-shape-*` | any container or the theme | a bone's radius and a card's corners times 0, .5, 1, 1.5, at most half a bone's height; an avatar stays round |
| Touch | `.ds-touch` | the theme or a container | a field bone is as high as the field it stands for; the rest is no target |
| Tone | | | not read: nothing here says more than "wait" |

- **Skeleton**: every bone shows its slice of one band fixed to the viewport (the registered `--ds-skeleton-x`), so the
  bones of a surface share one phase. Since 2.0 each bone clips the band to its own shape and the band moves on a
  compositor layer of its own (a fixed `::after`, moved by `translate`), so the wave repaints nothing; before, a fixed
  background was repainted with the whole view. Under a transformed ancestor (a sheet mid-slide, `.ds-enter`) the band
  is placed in that ancestor instead of the viewport: the bones stay in time and share it.
- **Loading line** (`.ds-loading`): the loader, then the text, in one row (inline markup in the text or a trailing
  button stays on it). With `.ds-loading__detail` lines (2.0) it becomes a two-column grid: the lines sit under the
  text in its column (`--ds-font-meta`, `--ds-text-2`), aligned with it whatever the loader's size; keep the text one
  run (or one element) there, since each piece of it takes a cell.
- **Skeleton note** (`p.ds-skeleton__note`, 2.0): a progress line under the lead bone ("Loading 3 of 12 reports",
  `--ds-font-meta` in `--ds-text-2`, tabular figures); it sits inside the `role="status"` skeleton, so its text is
  announced: update it at most every 10% or once a second. Empty, it takes no room. The bones' corners follow
  `--ds-skeleton-radius` (2.0; default `--ds-radius-action`, the heading line and a field `--ds-radius-sm`, a media bone
  `--ds-radius-card`).
- **Loading bar** (`.ds-loadbar`): the two-segment indeterminate choreography, flat, at the top of the content
  panel (inside `.ds-content`, whose read-only `--ds-content-pad-top` and `--ds-content-pad-x` it reads to reach the
  panel edges; inside `.ds-page` it also spans the page's centring, measured as `100cqw` of `.ds-content`, so it
  reaches the edges at any panel width; the view's scroll hairline hides while it is there). Put the bar, or the
  skeleton that holds it, directly in `.ds-content` or `.ds-page`, with no other size container in between. `DS.motion.refresh(content, load)`
  (2.0) is the refresh pattern as one call: it puts `.ds-stale` and the bar in, waits for `load()` and the loader
  hold, and takes both away before it resolves with the data. By hand, the refresh pattern: put `.ds-stale` on the content
  and insert the loading bar; when the data arrives, `await DS.motion.settleLoader(startedAt, { element: loadbar })`,
  then `DS.motion.leave(loadbar)` (it fades out with its segments still moving, and is removed) and render the fresh
  content. `.ds-leave` keeps the loops of a loading bar and of a skeleton surface while they fade out.
- **Paint cost** (measured by `test/browser/perf.spec.js`, budget: the p95 frame within 33ms, two frames at 60Hz,
  at 4x CPU throttling): 50 table rows of wavy progress with four shape loaders and a skeleton surface stay within
  it. The skeleton's band moves on its own compositor layer (2.0), so its wave repaints nothing; before 2.0 it was
  a fixed background, repainted with the whole view on every step, and a skeleton had to wait alone. Show a
  skeleton only while a page loads its first data; for a refresh use `.ds-stale` and the loading bar.
  Keep shape loaders to a few per view, and use `.ds-progress--flat` in dense table cells (the wave reaches outside
  the 4px track).

**Accessibility.** The surface or line holds `role="status"` and the words (`.ds-sr` in a skeleton); the bones and the
loader say nothing. Keyboard: no stop of its own. **Forced colours.** The fills go: bones and the bar's track take a
`CanvasText` outline and the band is left out, both segments of the bar paint `Highlight`. Print: the band and the
loading bar are left out.

**Motion:** the loader and skeleton rows of [Feedback](motion.md#feedback) in motion.md.

<!-- changelog -->
- Loading: skeleton presets (`.ds-skeleton__avatar`, `__media`, `__row` with `__lines`, `__table` with `__cells` and
  `__cells--head`, `__form` with `__field` and `__line--label`), `.ds-skeleton--pulse` beside the wave, hook
  `--ds-skeleton-media-ratio`; size, density and shape. The spinner and the shape loader have their own sections now.
