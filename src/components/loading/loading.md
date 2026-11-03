## Loading

```html
<!-- Block loader: the shape loader (M3 Expressive), 48px; --sm 24px; --contained on an --ds-accent disc -->
<div class="ds-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading ...</div>
<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Importing devices
  <p class="ds-loading__detail">812 of 2,030 rows</p></div>                       <!-- a detail line under the text -->
<span class="ds-loader ds-loader--contained" aria-hidden="true"></span>

<!-- Inline spinner: the M3 arc, for buttons, chips, status chips and table cells -->
<span class="ds-spinner" aria-hidden="true"></span>                 <!-- 16px -->
<span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span>  <!-- 12px, text colour -->

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

Every loader except the bare arc spinner fades in only after `--ds-delay-loader` (`.ds-boot` after
`--ds-delay-boot`), so fast loads show nothing; keep a visible one up with
`DS.motion.settleLoader(startedAt, { element })`. A `.ds-spinner` turns at once; delay it through `.ds-loading`, a
busy button or `<span class="ds-enter ds-enter--delayed">`. Delays never stack: a loader
inside `.ds-boot`, `.ds-loading` or `.ds-skeleton`, and a loading bar inside a skeleton, have no fade of their own.

- **Shape loader** (`.ds-loader`): the block loader. A shape morphs through the seven M3 shapes, each step landing
  on the spring, while it turns (`--ds-loop-loader`). It is `aria-hidden`; the surrounding `role="status"` carries
  the text. Keep it to a few per view (the morph repaints every frame). Hooks `--ds-loader-size` (48px) and
  `--ds-loader-color` (`--ds-primary`). The older markup with a `.ds-spinner` in `.ds-boot` or `.ds-loading` keeps
  working.
- **Spinner** (`.ds-spinner`): the inline loader, the M3 arc that grows and shrinks while it turns, without a track.
  Hooks `--ds-spinner-color`, `--ds-spinner-track` (none; the small one keeps a faint ring of the text colour) and
  `--ds-spinner-width` (2px; replaces a project's own `border-width`). Never put `.ds-enter` on it in static markup
  (wrap it); `.ds-enter` on a `.ds-loader` is fine, its loops run on `::before`.
- **Circular progress** (`.ds-spinner--determinate`, 40px): the share as an arc, a gap, then the track in
  `--ds-accent`, on a wavy ring (`.ds-spinner--flat`: a plain ring). It never spins; set `--ds-progress` (0 to 1)
  and the arc glides like linear progress. Markup as for [progress](#progress): `role="progressbar"`,
  `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, a name.
- **Skeleton**: one calm diagonal wave passes over the whole surface, after its entrance. Every bone shows its slice
  of one band fixed to the viewport (the registered `--ds-skeleton-x`), so the bones of a surface share one phase.
  Since 2.0 each bone clips the band to its own shape and the band moves on a compositor layer of its own (a fixed
  `::after`, moved by `translate`), so the wave repaints nothing; before, a fixed background was repainted with the
  whole view. Under a transformed ancestor (a sheet mid-slide, `.ds-enter`) the band is placed in that ancestor
  instead of the viewport: the bones stay in time and share it.
- **Loading line** (`.ds-loading`): the loader, then the text, in one row (inline markup in the text or a trailing
  button stays on it). With `.ds-loading__detail` lines (2.0) it becomes a two-column grid: the lines sit under the
  text in its column (`--ds-font-meta`, `--ds-text-2`), aligned with it whatever the loader's size; keep the text one
  run (or one element) there, since each piece of it takes a cell.
- **Skeleton note** (`p.ds-skeleton__note`, 2.0): a progress line under the lead bone ("Loading 3 of 12 reports",
  `--ds-font-meta` in `--ds-text-2`, tabular figures); it sits inside the `role="status"` skeleton, so its text is
  announced: update it at most every 10% or once a second. Empty, it takes no room. The bones' corners follow
  `--ds-skeleton-radius` (2.0; default `--ds-radius-action`, the heading line `--ds-radius-sm`).
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

**Motion:** the loader and skeleton rows of [Feedback](motion.md#feedback) in motion.md.

