## File upload

Files by drop, the file dialog or paste, with their progress, retry and remove, previews, limits that say what is wrong,
and pictures made smaller before they go. The page uploads; `DS.upload` shows it.

```html
<div class="ds-upload" data-ds-upload data-ds-upload-max-size="10 MB" data-ds-upload-max-files="5" data-ds-upload-resize="1600">
  <label class="ds-dropzone">
    <input class="ds-dropzone__input" type="file" accept="image/*,.pdf" multiple>
    <span class="ds-dropzone__disc" aria-hidden="true">[icon upload 24]</span>
    <span class="ds-dropzone__title">
      <span class="ds-dropzone__idle">Drop photos or PDFs here or <span class="ds-dropzone__browse">browse</span></span>
      <span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span>
    </span>
    <span class="ds-dropzone__hint">Up to 10 MB each, at most 5 files</span>
  </label>
  <ul class="ds-list ds-upload__list" aria-label="Files"></ul>          <!-- or <ul class="ds-upload__grid" aria-label="Photos"> -->
</div>
```

```js
el.addEventListener('ds:files', ({ detail }) => detail.entries.forEach((entry) => send(entry)));
const upload = DS.get(el, 'upload');
function send(entry) {
  const request = new XMLHttpRequest();
  request.upload.onprogress = (event) => upload.progress(entry.id, event.loaded / event.total);
  request.onload = () => (request.status < 300 ? upload.done(entry.id) : upload.fail(entry.id, 'The server refused it.'));
  request.onerror = () => upload.fail(entry.id);
  request.open('POST', '/files');
  request.send(entry.file);
}
el.addEventListener('ds:retry', ({ detail }) => send(detail.entry));
```

The zone is the [drop zone](#drop-zone-and-file-field) of Drag and files, unchanged: a `<label>` around its visually
hidden input, so Tab, Enter and Space open the file dialog. `DS.upload` takes its picks, drops on the whole
`.ds-upload` and files pasted while focus is inside it, then:

1. **Checks the limits** in this order: the type (`accept`), then (after a resize) the room left (`maxFiles`, counting
   the files shown) and the size (`maxSize`; an empty file is refused too). A refused file is not added: the input takes
   `aria-invalid="true"` (the zone's error edge) and the `.ds-upload__error` line under the zone says why, with an icon
   and words ("report.pdf is larger than 10 MB."), named in the input's `aria-describedby` and spoken at once. The next
   pick or a removal clears it.
2. **Resizes pictures** (`resize`): a JPEG, PNG or WebP larger than the box is drawn smaller on a canvas, its
   orientation kept (GIF and SVG stay as they are); a result that would be larger keeps the original.
3. **Adds a row** per file (`data-status="queued"`: "Waiting", no bar yet), says "Added devices.csv" and sends
   `ds:files` with the new entries: the page starts each upload there.

Then the page reports: `progress(id, share)` (`uploading`, the bar glides to the share and the meta says the percent),
`done(id)` (the check and "Uploaded") or `fail(id, reason)` (the alert icon and the reason in the error ink, Retry
shows; a failure is spoken). Retry sets the entry back to waiting and sends `ds:retry`; Remove takes the row out on
`DS.motion.flip()` (focus moves to the next row's Remove, else the zone), sends `ds:remove` so the page aborts its
request, and frees the preview.

**Rows or previews.** The list is a [row list](#row-list) (`.ds-list.ds-upload__list`): the thumbnail of a picture or
a file icon, the name, the size and the status with the bar under them, then Retry and Remove (quiet icon buttons with
tooltips), which keep the first line down to a phone's width. The
grid (`ul.ds-upload__grid`) shows a tile per file: the preview (4:3, the picture cropped to fill it, else a large file
icon), the name on one line and the meta, the bar, and tonal Retry and Remove over the preview's top corner, so they
read on any picture. Tiles fill the row in columns of at least `--ds-upload-tile` (144px). Without either list the
module adds a `.ds-upload__list`; without an error line it adds one after the zone.

**Parts**, written by the module: a row `li.ds-list__item.ds-upload__item` (a tile `li.ds-upload__tile`) with
`data-status`; its picture `.ds-upload__thumb` (a tile's `.ds-upload__preview`, with a `.ds-upload__glyph` for a file
that is no picture); `.ds-upload__name`; `.ds-upload__meta` with a `.ds-upload__status-icon` and the words in
`.ds-upload__status`; in a tile both in `.ds-upload__caption`; the bar `.ds-upload__bar` (a flat
[Progress](#progress)); and `.ds-upload__actions` with `.ds-upload__retry` (shown on a failure) and
`.ds-upload__remove`. The error line `.ds-upload__error` holds an icon and `.ds-upload__error-text`.

**Attributes** (on the `.ds-upload`; a change applies to the next pick):

| Attribute | Option | What |
|---|---|---|
| `data-ds-upload` | | the behaviour |
| `data-ds-upload-accept` | `accept` | the types it takes, as `accept` (default the input's `accept`) |
| `data-ds-upload-max-size` | `maxSize` | the largest file: bytes or `10 MB`, `500 kB`, `2 MiB` |
| `data-ds-upload-max-files` | `maxFiles` | the most files it holds |
| `data-ds-upload-resize` | `resize` | `1600` (the longer edge at most 1600px) or `1600x1200` |
| `data-ds-upload-quality` | `resize.quality` | 0 to 1 (default 0.9) |
| `data-ds-upload-resize-type` | `resize.type` | `image/webp`, `image/jpeg` or `image/png` (default the picture's own) |
| `data-ds-upload-paste` | `paste` | `off`: no paste |

Say the limits in the zone's hint ("Up to 10 MB each, at most 5 files"), so nobody learns them from an error.

**JS API.** `DS.get(el, 'upload')` or `DS.upload.create(el, options)` (the options of the table, which win over the
attributes) return the controller:

| Member | What |
|---|---|
| `get()` | the entries `{ id, file, name, size, type, status, progress, error, url }` |
| `set(entries)` | shows these instead: files already stored (`{ id, name, size, type, url }`, status `done` unless given) |
| `add(files)` | checks, resizes and adds files as a drop does; resolves with the entries added |
| `progress(id, share)` | 0 to 1: the entry is uploading |
| `done(id, { url })` | uploaded; `url` gives a preview the file had none of |
| `fail(id, reason)` | failed, with the reason in words (default "Upload failed") |
| `retry(id)`, `remove(id)`, `clear()` | what the buttons do; `remove()` resolves after the row left |
| `on(type, fn)` | `files`, `reject`, `retry`, `remove` or `change`; returns the unsubscribe |
| `destroy()` | stops listening and frees the previews |

| Event, on the `.ds-upload` | Detail | When |
|---|---|---|
| `ds:files` | `{ entries }` | files were added: upload them |
| `ds:reject` | `{ rejected: [{ file, reason, limit }] }` | files were refused: `type`, `count`, `size` or `empty` |
| `ds:retry` | `{ entry }` | Retry: upload it again |
| `ds:remove` | `{ entry }` | Remove: abort its request, delete what was stored |
| `ds:change` | `{ entries }` | the entries changed |

The helpers, for a page that checks or shrinks files by itself:

- `DS.upload.accepts(file, accept)`: whether a file matches an accept list (extensions, MIME types, `image/*`).
- `DS.upload.validate(files, { accept, maxSize, minSize, maxFiles, count })`: `{ accepted, rejected }`, each refused
  file with its `reason` and `limit`.
- `DS.upload.parseSize(text)`: `10 MB` in bytes (kB, MB, GB at 1000; KiB, MiB, GiB at 1024), else `null`.
- `DS.upload.fitSize(width, height, { maxWidth, maxHeight })`: the size inside the box, never larger.
- `DS.upload.resizeImage(file, { maxWidth, maxHeight, quality, type })`: a Promise of the smaller file, or the file
  itself.

The rows are the module's own: render the `.ds-upload` once and leave its list alone in a re-render (or give the page's
`DS.dom.morphHtml` a template without the list's children only while nothing is chosen).

**Options** ([options.md](options.md)): classes on the upload or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `ul.ds-upload__grid` instead of `.ds-upload__list` | the list | previews in tiles |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the upload or a group | a tile's least width 16px per step (112 to 176px, never under 96px) and the name's type role; the rows follow the [row list](#row-list), the zone the drop zone |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the room between the parts, between the tiles and the caption's padding 2px less per step; rows follow the list |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | a tile's radius (its preview's top corners follow) times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | the buttons and the zone take `--ds-touch-target` (48px) |
| Tone | none | | a file's status is `data-status`, with its icon and word |

**Keyboard and names.** Tab reaches the zone's input (Enter or Space opens the file dialog; Ctrl or Cmd+V pastes files
while focus is inside the upload), then each row's Retry and Remove, named after the file ("Remove devices.csv"). A
row's bar is a `progressbar` named "Upload of devices.csv" with its value; a busy row has `aria-busy="true"`. Additions,
removals, completions and failures are spoken through the announcer ([DS.a11y](core.md#accessibility-helpers)), refusals
at once (assertive). Name the list (`aria-label`).

**Forced colours.** Tiles and previews keep their edges in `CanvasText`, a failed tile a 2px edge; the status words and
icons carry the meaning; the bar is Progress's; the zone is Drag and files'.

**Hooks:** `--ds-upload-tile` (144px), `--ds-upload-radius` (`--ds-radius-card`), `--ds-upload-gap` (`--ds-space-3`);
the error line and a failed row read `--ds-field-error-color` ([theming.md](theming.md#component-hooks)). The attribute
`data-status` on a row or tile is the module's.

**Motion:** rows and tiles come and go through `DS.motion.flip()` (they fade in over `--ds-dur-fast`, the others glide);
the bar glides on `--ds-ease-value` (Progress); the error line fades in (`ds-fade-in`, `--ds-dur-fast`).

**Strings:** `uploadWaiting`, `uploadDone`, `uploadFailed`, `uploadRetry`, `uploadRemove`, `uploadProgress`,
`uploadWrongType`, `uploadTooMany`, `uploadTooLarge`, `uploadEmpty`, `uploadAdded`, `uploadAddedCount`,
`uploadRemoved`, `uploadDoneAnnounce`, `uploadFailedAnnounce` and `retry`, `remove`
([install.md](install.md#language-and-locale)).
