## Media

Files, photos, recordings or devices as thumbnails in a grid: each card opens, can be selected and carries its own
actions.

```html
<ul class="ds-media-grid" aria-label="Photos" data-ds-media>
  <li class="ds-media" data-ds-key="p1">
    <span class="ds-media__thumb"><img src="/photos/pump-room.jpg" alt=""><span class="ds-media__tag">RAW</span></span>
    <a class="ds-media__open" href="/photos/p1"><span class="ds-media__title">pump-room.jpg</span></a>
    <span class="ds-media__meta">2.4 MB · JPEG</span>
    <span class="ds-media__select"><input class="ds-checkbox ds-media__check" type="checkbox" aria-label="Select pump-room.jpg"></span>
    <span class="ds-media__actions">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="More for pump-room.jpg"
              aria-haspopup="menu" aria-expanded="false" data-ds-open="#p1-menu">[icon moreVertical 20]</button>
      <div class="ds-menu" role="menu" id="p1-menu" hidden> ... </div>
    </span>
  </li>
  <li class="ds-media ds-media--wide" data-ds-key="v1">
    <span class="ds-media__thumb">[icon video 32]<span class="ds-media__tag">0:42</span></span>
    ...
  </li>
</ul>
```

| Part | What |
|---|---|
| `.ds-media__thumb` | the picture at the card's ratio (`--ds-media-ratio`, 4 / 3): an `<img>` or `<video>` covers it, else an icon (a file type, a device) on `--ds-surface-high` |
| `.ds-media__tag` | a short fact over the picture's bottom end corner (a duration, a page count, "RAW"), `--ds-inverse` / `--ds-on-inverse` in the caption type |
| `.ds-media__select` | the selection checkbox (`.ds-checkbox.ds-media__check`, [Form](#form)) on a disc over the picture's top start corner: it shows with the card's hover or focus, always once anything in the grid is selected, under a coarse pointer and in `.ds-touch` |
| `.ds-media__open` | the main action, a link or a button around the title; its box stretches over the whole card, so the picture opens too, and carries the state layer; the focus ring goes round the card |
| `.ds-media__title`, `.ds-media__meta` | the name and a second line (`--ds-font-meta`, `--ds-text-2`), each one line with an ellipsis |
| `.ds-media__actions` | buttons at the end of the text, above the stretched action: a menu button ([Menu](#menu)) |

| Variant | Class | Look |
|---|---|---|
| Default | | the picture at 4 / 3 above the text |
| Square | `.ds-media--square` | 1 / 1 |
| Wide | `.ds-media--wide` | 16 / 9 (video, screenshots) |
| Bare | `.ds-media--bare` | the picture alone: the title and meta stay in the tree (read, not shown), the stretched action still covers the card, the actions sit over the picture on a disc |

The parts come in this order, which is the tab order inside a card: the picture, the open control, the meta, the
checkbox, the actions (the checkbox sits over the picture wherever it is in the markup).

**Selected.** The checkbox is the truth (`:checked`): the card takes `--ds-media-selected-bg` (`--ds-accent`) with `--ds-on-accent` text and a static
inset ring of `--ds-focus-width` in `--ds-selected-ring` (`--ds-primary`), so the focus ring stays free; the checked box is
the mark that never relies on colour. Colours change on `--ds-dur-fast`, the ring at once. A card that cannot be
selected leaves the checkbox out or disables it.

**Grid.** `.ds-media-grid` fills columns of at least `--ds-media-min` (128px at md: two columns on a phone) and stretches them to the row; a list
(`<ul>` of `<li class="ds-media">`) or any container of cards. An empty gallery is an [empty state](#empty-state), a
loading one [skeletons](#loading).

**Options** ([options.md](options.md)):

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the grid or any ancestor | the column minimum 32px per step (64 to 192px), the title in the size's type role |
| Density | `.ds-density-*` | any container | the grid gap 4px per step (`--ds-media-gap`), the text padding 2px per step |
| Shape | `.ds-shape-*` | any container | the card's and the picture's radius times `--ds-shape` |
| Touch | `.ds-touch` | any container | the selection checkboxes always show; their halo is the form's, at least `--ds-target-min` |
| Tone | | | not read: a card shows no status of its own; a status chip or badge inside says its word |

### Behaviour: `data-ds-media`

`data-ds-media` on the grid (with `DS.init()`), or `DS.media.create(grid)`, makes the gallery one tab stop with the
selection of a file manager (the grid pattern of the WAI-ARIA practices, for cards):

| Key | Does |
|---|---|
| `Tab` | enters at the current card's open control, then its checkbox and actions, then leaves the grid; the other cards' checkboxes and actions are out of the tab order (an owned `tabindex="-1"`) until their card is current |
| `←` `→` | the card before or after |
| `↑` `↓` | the nearest card of the row above or below |
| `Home`, `End` | the first and the last card |
| `Enter` | opens (the link or button itself) |
| `Space` | on a card's open control: selects it or lets go |
| `Shift` + `Space`, `Shift` + click on a checkbox | the range from the last card chosen |
| `Ctrl` + `A` (`Cmd` + `A`) | every card |
| `Escape` | lets go of every card; taken, so a dialog around the grid stays open (inside an open menu of a card, Escape is the menu's) |

The controller sets the checkboxes without firing their own `change` and sends one `ds:change` (`detail: { selected }`,
the keys in grid order) per action on the grid; a card's key is its `data-ds-key`, else its checkbox's `value`, else its
index. A change from the keyboard, a range, all and none are announced ("4 selected", `mediaSelected`; "Selection
cleared", `mediaSelectionCleared`); a plain checkbox speaks for itself.

```js
const photos = DS.media.create(grid);       // or DS.core.get(grid, 'media')
photos.set(['p1', 'p4']);
photos.get();                               // ['p1', 'p4']
photos.selectAll();
photos.clear();
photos.on('change', ({ selected }) => toolbar.hidden = !selected.length);
DS.media.between(items, from, to);          // the items from one to the other, both included
```

| Export | What |
|---|---|
| `DS.media.create(el)` | the controller of a grid: `get()`, `set(keys)`, `selectAll()`, `clear()`, `on('change')`, `destroy()` |
| `DS.media.between(items, from, to)` | the items from `from` to `to` in list order, both included (the range of Shift) |

A toolbar that acts on the selection ("3 selected", Download, Delete) is the page's: the table's `.ds-selection-bar`
([Table](#bulk-selection-bar)) fits above the grid.

### Accessibility

- Name the grid (`aria-label`), each checkbox ("Select pump-room.jpg") and each action button ("More for pump-room.jpg"):
  the title alone repeats on every card. The picture is decoration (`alt=""`) when the title names it.
- The open control is a real link or button: `Enter` opens it, a screen reader lists it.
- Selection is the checked box, never the tint alone.

### Forced colours

Every card keeps its border; a selected card is `Highlight` with `HighlightText` and a `Highlight` ring, its picture,
checkbox and actions keep their forced looks; the focus ring is `CanvasText`; the tag keeps an edge.

### Motion

The state layer fades on `--ds-dur-fast` (the press in `--ds-dur-micro`), the focus ring snaps (`outline-offset`), the
selection checkbox fades in on `--ds-dur-fast` and out on `--ds-dur-instant`, the selected colours change on
`--ds-dur-fast`. Nothing moves or scales.

Hooks: `--ds-media-min`, `--ds-media-gap`, `--ds-media-radius`, `--ds-media-border`, `--ds-media-bg`,
`--ds-media-ratio`, `--ds-media-selected-bg`; reads `--ds-selected-ring` ([theming.md](theming.md#component-hooks)).
