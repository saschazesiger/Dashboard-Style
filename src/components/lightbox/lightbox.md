## Lightbox

The images of a record (the photos of a device, the screenshots of a ticket) one at a time over the whole window, with
thumbnails, the arrow keys, zoom and pan, a caption and swipe on touch. The page writes a gallery of links to the full
images; `DS.lightbox` builds the viewer, a modal [dialog](#dialog) that `DS.overlay` opens and closes.

```html
<ul class="ds-lightbox__gallery" aria-label="Photos of LAPTOP-0042" data-ds-lightbox>
  <li><a class="ds-lightbox__item" href="photos/lid.jpg" data-caption="The lid, scratched on the left">
    <img src="photos/lid-small.jpg" alt="The lid of LAPTOP-0042"></a></li>
  <li><a class="ds-lightbox__item" href="photos/ports.jpg" data-caption="The ports on the right side">
    <img src="photos/ports-small.jpg" alt="The ports of LAPTOP-0042"></a></li>
</ul>
```

Without JavaScript the links still open the full images. Each item is a `.ds-lightbox__item` (or any element with
`data-ds-lightbox-item`): its `href` or `data-src` is the full image, `data-caption` the line under it, the `alt` of its
`<img>` what it shows (else its `aria-label`), and that `<img>` the thumbnail. A `<button>` works as an item too.

The viewer `DS.lightbox` builds (DOM APIs, inside the gallery's `.ds-theme`):

```html
<dialog class="ds-dialog ds-lightbox" aria-label="Photos of LAPTOP-0042">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box ds-lightbox__box">
    <div class="ds-lightbox__bar">
      <p class="ds-lightbox__count">Image 2 of 6</p>
      <button class="ds-btn ds-btn--ghost ds-btn--icon" type="button" aria-label="Zoom out">[icon minimize 20]</button>
      <button class="ds-btn ds-btn--ghost ds-btn--icon" type="button" aria-label="Zoom in">[icon plus 20]</button>
      <button class="ds-btn ds-btn--ghost ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-lightbox__stage">
      <button class="ds-btn ds-btn--ghost ds-btn--icon ds-lightbox__nav ds-lightbox__nav--prev" type="button" aria-label="Previous">[icon chevronLeft 20]</button>
      <figure class="ds-lightbox__figure">
        <div class="ds-lightbox__frame">
          <img class="ds-lightbox__image" alt="The ports of LAPTOP-0042">
          <span class="ds-spinner" aria-hidden="true"></span>
          <p class="ds-lightbox__error">[icon alertCircle 20]The image could not be loaded.</p>
        </div>
        <figcaption class="ds-lightbox__caption">The ports on the right side</figcaption>
      </figure>
      <button class="ds-btn ds-btn--ghost ds-btn--icon ds-lightbox__nav ds-lightbox__nav--next" type="button" aria-label="Next">[icon chevronRight 20]</button>
    </div>
    <div class="ds-lightbox__thumbs" role="group" aria-label="Images">
      <button class="ds-lightbox__thumb" type="button" aria-label="Image 1 of 6: The lid of LAPTOP-0042"><img alt=""></button>
      <button class="ds-lightbox__thumb" type="button" aria-label="Image 2 of 6: The ports of LAPTOP-0042" aria-current="true"><img alt=""></button>
    </div>
  </div>
</dialog>
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Gallery | `.ds-lightbox__gallery`, `--ds-lightbox-item-size` | the list of items | a grid of square thumbnails, columns of at least 120px; a gallery of your own (a row in a card) works as well |
| Density | `.ds-density-*` | any container | the gallery's gap (1px per step) and the viewer bar's padding (2px per step) |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the radius of the gallery's items and the thumbnails |
| Size, touch | `.ds-sm` ..., `.ds-touch` | any container | reach the viewer's buttons; under `.ds-touch` a thumbnail is at least the touch target |

There is no tone. The viewer is dark in both colour schemes (`--ds-lightbox-bg`, `--ds-lightbox-ink`: the inverse
surface in the light scheme, the backdrop in the dark one), so the images keep their colours; its buttons are ghost
buttons in that ink. At 600px and below the arrows lie over the image's sides and the thumbnails are 48px.

### Behaviour

`data-ds-lightbox` on the gallery (`DS.init()`) or `DS.lightbox.create(gallery)`: a click on an item opens the viewer
at that image (a click with Ctrl, Cmd or Shift keeps the link's own behaviour), with the item as the opener.

- **Opening.** Through `DS.overlay.open()`: the page is inert, the scroll locked, focus on the first enabled button of the
  bar, Escape on the stack, and focus back on the item when it closes. "Image 2 of 6" and the caption are said.
- **Moving.** The arrows (wrapping round), a thumbnail, ArrowLeft and ArrowRight, Home and End. In the row of
  thumbnails the arrow keys move between them (one tab stop, `DS.a11y.roving()`) and show the image at once; the
  current one has `aria-current="true"`, its ring and the full opacity. A change says "Image 3 of 6" and the caption
  (else the alt), and the image enters with the swap of `DS.motion.enter()`. `ds:change` (`{ index, total }`) follows.
- **Zoom.** The buttons, `+` (or `=`) and `-` step 1, 2 and 4; `0` goes back to the fit; a double click (a double tap)
  zooms to 2 at that point and back; Ctrl with the wheel (a trackpad pinch) and two fingers zoom freely up to 4. A
  zoomed image pans with a drag and the arrow keys, never further than the image covers the frame. Escape first goes
  back to the fit, then closes. `ds:zoom` (`{ zoom }`) follows.
- **Swipe.** Unzoomed, a finger swiped sideways leads the image; past a fifth of the frame it goes to the next or the
  previous image, else it glides back.
- **Loading and errors.** A spinner shows after `--ds-delay-loader` while an image loads; one that fails shows an icon
  and "The image could not be loaded." in its place (`data-failed`).
- **A list without a gallery.** `DS.lightbox.show([{ src, alt, caption, thumb }], { index, opener, label })` opens a
  viewer for images the page has as data; it goes once it closed.

**JS API.** `js/lightbox.js` (`DS.lightbox`):

- `create(gallery, { images, label, home })` returns the controller that `data-ds-lightbox` makes: `get()` (`{ open,
  index, total, zoom }`), `set(index)` or `set({ index, zoom })`, `open(index, opener)`, `close()`, `next()`, `prev()`,
  `on(type, fn)` (`open`, `close`, `change`, `zoom`, on the gallery) and `destroy()` (removes the viewer). `images` (a
  function returning the list) replaces the gallery's items.
- `open(gallery, { index, opener })` and `close(gallery)`; `show(images, { index, opener, label })`.
- `nextZoom(zoom, direction)`, `clampPan(x, y, size, frame, zoom)` and `MAX_ZOOM` (4) are its arithmetic.

### Keyboard, names and forced colours

- Keyboard: Tab stays in the viewer (the bar, the arrows, the row of thumbnails); ArrowLeft and ArrowRight move (pan
  when zoomed), ArrowUp and ArrowDown pan, Home and End, `+`, `-`, `0`; Escape takes the zoom back, then closes.
- Names and roles: the viewer is a dialog named by the gallery's `aria-label` (else the string `images`); each button
  has a name (the strings `zoomIn`, `zoomOut`, `close`, `previous`, `next`); the image has the item's alt; the row of
  thumbnails is a group named "Images", each thumbnail named "Image 2 of 6: ..." with `aria-current` on the current
  one; the count is visible text.
- Forced colours: the gallery's items and the thumbnails keep a `CanvasText` edge, the current thumbnail a
  `SelectedItem` ring (a choice in a set), the error its `CanvasText` icon and words.

### Hooks

`--ds-lightbox-bg`, `--ds-lightbox-ink`, `--ds-lightbox-thumb-size`, `--ds-lightbox-item-size`,
`--ds-lightbox-radius` ([theming.md](theming.md#component-hooks)). `--ds-lightbox-zoom`, `--ds-lightbox-x` and
`--ds-lightbox-y` are runtime properties of the frame: never set them.

**Motion:** the viewer opens and closes as a dialog (the box fades and grows from `--ds-scale-enter` on the spring over
`--ds-dur-slow`, leaves in `--ds-dur-base`); a new image enters with the swap of `DS.motion.enter()`; zoom and pan glide
over `--ds-dur-medium` on `--ds-ease-out` (it fills the frame, so it never overshoots); a drag and a swipe follow the
pointer (direct manipulation, as the drag of `DS.dnd`), and a swipe that does not go far enough glides back.

<!-- changelog
- Lightbox (`DS.lightbox`, `[data-ds-lightbox]` with `[data-ds-lightbox-item]`, `.ds-lightbox__gallery`, `__item`, and
  the viewer `.ds-lightbox` with `__box`, `__bar`, `__count`, `__stage`, `__nav` (`--prev`, `--next`), `__figure`,
  `__frame`, `__image`, `__caption`, `__error`, `__thumbs`, `__thumb`): images one at a time in a modal dialog, with
  thumbnails, keys, zoom and pan (buttons, keys, double click, wheel, pinch), a caption, swipe on touch, loading and
  error states; `create()`, `open()`, `close()`, `show()`, `nextZoom()`, `clampPan()`, `MAX_ZOOM`. Hooks
  `--ds-lightbox-bg`, `-ink`, `-thumb-size`, `-item-size`, `-radius`. Strings `imageOf`, `images`, `zoomIn`, `zoomOut`,
  `imageFailed`. Integrator: the glyphs `zoomIn` and `zoomOut` (a magnifier with plus and minus) would read better than
  `plus` and `minimize` in the bar.
-->
