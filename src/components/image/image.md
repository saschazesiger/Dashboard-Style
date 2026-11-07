## Image

A picture in a frame of a fixed shape, cropped or fitted, with a tint while it loads, words where it fails and a
caption: a device photo, a thumbnail in a list, a screenshot in a ticket.

```html
<figure class="ds-image ds-image--wide">
  <span class="ds-image__frame" data-ds-image>
    <img src="printer-7.jpg" alt="Printer 7 by the window" loading="lazy" width="640" height="480">
  </span>
  <figcaption class="ds-image__caption">Printer 7, second floor</figcaption>
</figure>
```

| Part or variant | Class | What |
|---|---|---|
| Image | `.ds-image` | a `<figure>` (or a `<div>` without a caption): the frame and its caption |
| Frame | `.ds-image__frame` | the box of the picture: its shape, its corners and the tint behind it; the picture fills it |
| Caption | `.ds-image__caption` | a `<figcaption>` under it, in the meta type |
| Fallback | `.ds-image__fallback` | in the frame, shown where the picture failed; `DS.image` writes one (the image glyph and the alt text) when the frame has none |
| Square | `.ds-image--square` | the frame 1 / 1 |
| Photo | `.ds-image--photo` | the frame 4 / 3 |
| Wide | `.ds-image--wide` | the frame 16 / 9 |
| Contain | `.ds-image--contain` | the whole picture fitted on the tint, instead of cropped to fill the frame (cover, the default) |

Without a shape modifier the frame takes the picture's own shape; any other ratio goes in `--ds-image-ratio`
(`style="--ds-image-ratio: 21 / 9"`). A frame of its own shape keeps its place while the picture loads, so nothing
below it moves: give a picture without one its `width` and `height` attributes. Lazy loading is the browser's:
`loading="lazy"` (and `decoding="async"`) on the `<img>`.

### Options

On the image or any ancestor; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Shape | `.ds-shape-*` | the frame | its corners times `--ds-shape` |
| Density | `.ds-density-*` | the image | the gap to the caption 1px per step |
| Size, tone, touch | | | not read: a picture is as large as its place |

### Behaviour: `data-ds-image`

On the frame. `data-state` says where the picture is: `loading` until it is there, then `loaded`, or `error`. A
picture that arrives after the start fades in; one from the cache shows at once. A failed picture tries
`data-ds-image-fallback` (another source, such as a placeholder) once, then the frame shows its
`.ds-image__fallback`. A new `src` or `srcset` (from `set()` or a re-render with `DS.dom.morphHtml`) starts again
from `loading`. Without the module the picture shows as it loads, and a failed one shows the browser's own sign.

### JS API

- `DS.image.create(el, { src, fallback })`: the controller the attribute path makes, on the frame. `get()` gives
  `{ state, src }`; `set(src)` loads another picture; `on('change', fn)` runs with `{ state, src }` on every state;
  `update()` reads the picture again; `destroy()` takes `data-state` and the written fallback away. Events:
  `ds:change` with `{ state, src }` once the picture is loaded or failed.

### Accessibility

The `<img>` carries the alt text: what the picture shows, or `alt=""` for decoration. Where it fails, the fallback
shows that text (a screen reader reads it there; the glyph is hidden), and a decorative picture's fallback is hidden
whole. A caption names the picture for the eye; the alt text still describes it. Nothing takes focus.

### Forced colours

The frame keeps a `CanvasText` edge; the fallback's glyph and words are `CanvasText`.

### Hooks

`--ds-image-ratio`, `--ds-image-radius`, `--ds-image-bg`: see [theming.md](theming.md).

**Motion:** a picture that arrives fades in over `--ds-dur-medium` on `--ds-ease-in-out` (`data-state` from
`loading` to `loaded`); a new one fades out over `--ds-dur-fast` while it loads. A transition, so a change mid-way
continues from where it is.

<!-- changelog -->
- Image (new, `image`): `.ds-image` with `__frame`, `__caption`, `__fallback`, the shapes `--square`, `--photo`,
  `--wide` (or `--ds-image-ratio`) and `--contain`; `data-ds-image` writes `data-state` (`loading`, `loaded`,
  `error`), fades the picture in, tries `data-ds-image-fallback` and shows the fallback with the alt text;
  `DS.image.create`; hooks `--ds-image-ratio`, `--ds-image-radius`, `--ds-image-bg`.
