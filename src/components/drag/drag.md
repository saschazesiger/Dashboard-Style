## File upload

```html
<label class="ds-dropzone">
  <input class="ds-dropzone__input" type="file" accept=".csv" multiple>
  <span class="ds-dropzone__disc" aria-hidden="true">[icon upload 24]</span>
  <span class="ds-dropzone__title">
    <span class="ds-dropzone__idle">Drop CSV files here or <span class="ds-dropzone__browse">browse</span></span>
    <span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span>
  </span>
  <span class="ds-dropzone__hint">Up to 10 MB each</span>
</label>

<input class="ds-input" type="file" accept="image/*">       <!-- the plain file field -->
```

```js
DS.dom.dropzone(zone, { onFiles: (files) => addFiles(files), paste: true });   // drop, dialog, paste
DS.dom.dropzone(chatPane, { onFiles: attach, accept: 'image/*', input: null }); // a page's own drop target
```

- **The zone** (2.0) is a `<label>`: a click or Enter on its input opens the file dialog; the input stays in the tab
  order, visually hidden, and the ring shows on the zone. Border `--ds-dropzone-border` (`1px dashed var(--ds-outline)`),
  radius `--ds-radius-card`; the state layer at `--ds-state-hover-lg`, the ripple, and the press morph to
  `--ds-radius-card-pressed` like a radio card. Disabled through its input (`disabled`).
- **Dragging over**: `DS.dom.dropzone()` writes `data-ds-dragover` while files are over the zone (a child included):
  the zone takes `--ds-accent` with an inset `--ds-primary` edge (no layout shift) over `--ds-dur-fast`, and the
  title says it in words (`__over` crossfades with `__idle` in one cell, so the zone never changes its size). On
  any other element (a pane, a chat) the attribute draws a dashed `--ds-primary` outline inside its edge; call
  `DS.dom.dropzone(element, { onFiles })` on it rather than counting drag events yourself.
- **Which file input**: the zone's `.ds-dropzone__input` (else its first `input[type="file"]`) hands its picks to
  `onFiles` too. A page drop target with a file input of its own inside (a composer's attach button, whose picks the
  page already handles) passes `input: null` (drops and paste only), or names the input to use (`input: element`).
- **The file field** `.ds-input[type="file"]`: the field box, the chosen file's name in `--ds-text-2`, and the browser's
  button as a small tonal pill (`--ds-accent`, 32px) with the hover and press mixed into its fill and the press
  morph. It has no ripple (a native field part).
- **The chosen files** are the page's: a [Row list](#row-list) (`.ds-list`, without `--interactive`) with a
  `.ds-progress` and a remove button in each row, rendered through `DS.motion.flip()` (a removed row fades out, focus
  moves to the next remove button). The bar has no width of its own in a row: give it its share in the page's CSS
  (`flex: 0 1 160px; min-width: 80px`).

```html
<ul class="ds-list" aria-label="Chosen files">
  <li class="ds-list__item" data-ds-key="f1">[icon fileText 20 .ds-list__icon]
    <span class="ds-list__text"><span class="ds-list__title">devices.csv</span><span class="ds-list__meta">30%</span></span>
    <div class="ds-progress ds-progress--flat" style="--ds-progress: 0.3">
      <div class="ds-progress__track" role="progressbar" aria-label="Upload of devices.csv" aria-valuemin="0" aria-valuemax="100" aria-valuenow="30"><div class="ds-progress__bar"></div></div>
    </div>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove devices.csv" data-tip="Remove">[icon close 20]</button></span>
  </li>
</ul>
```

- **Forced colours**: a dashed `ButtonText` edge (`Highlight` while dragged over), the file button in `ButtonFace` /
  `ButtonText` with a `ButtonText` border, a page's drop target outlined in `Highlight`; a disabled zone or file
  field is `GrayText`.

**Motion:** the press and state layers of [Controls](motion.md#controls) in motion.md; the drop state is a
`--ds-dur-fast` colour change.

## Reorder rows

```html
<ul class="ds-plain-list" id="steps">
  <li class="ex-step" data-ds-key="a">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move Backup">[icon grip 20]</button>
    Backup
  </li>
  ...
</ul>
```

```js
DS.motion.sortable(steps, { onChange: (order) => save(order.map((row) => row.dataset.dsKey)) });
```

- `.ds-grip` (2.0) on a quiet icon button is the handle: `cursor: grab` and `touch-action: none`, so a drag on a
  touch screen moves the row, not the page. Give it an `aria-label` that names the row.
- **Pointer**: the row follows the pointer and carries `data-ds-dragging` (raised: `--ds-elev-2` and the dragged state
  layer, `currentColor` at `--ds-state-dragged`, over `--ds-dur-fast`; nothing scales), the other rows make room
  through `DS.motion.flip()` and, on release, the row glides into its place on the spring.
- **Keyboard**: on the handle, ArrowUp and ArrowDown move the row one place, Home and End to the start or the end; the
  handle keeps the focus. Each move is spoken ("Moved to position 2 of 5") through a polite region in the list's
  dialog or sheet, else its `.ds-theme`.
- **Forced colours**: the dragged row is outlined in `Highlight`.

**Motion:** `sortable()` in [DS.motion](motion.md#dsmotion-jsmotionjs); the row glides like every `flip()` item.

