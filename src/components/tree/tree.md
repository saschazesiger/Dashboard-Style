## Tree view

A hierarchy that opens and closes (folders, groups, nested records), the APG tree pattern: pick one row, or check many
with tri-state checks; children may load when a folder first opens, and items move by drag.

```html
<ul class="ds-tree" role="tree" aria-label="Files" data-ds-tree>
  <li class="ds-tree__item" role="treeitem" aria-expanded="true" data-ds-key="docs">
    <div class="ds-tree__row">
      <span class="ds-tree__toggle" aria-hidden="true">[icon chevronRight 16]</span>
      <span class="ds-tree__icon" aria-hidden="true">[icon folder 20][icon folderOpen 20]</span>
      <span class="ds-tree__label">Documents</span>
      <span class="ds-tree__meta">2 files</span>
      <span class="ds-tree__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" tabindex="-1" aria-label="More for Documents">[icon moreVertical 18]</button></span>
    </div>
    <ul class="ds-tree__group" role="group">
      <li class="ds-tree__item" role="treeitem" aria-selected="false" data-ds-key="plan">
        <div class="ds-tree__row"><span class="ds-tree__icon" aria-hidden="true">[icon fileText 20]</span><span class="ds-tree__label">Plan.pdf</span><span class="ds-tree__meta">1.2 MB</span></div>
      </li>
      <li class="ds-tree__item" role="treeitem" aria-selected="false" aria-disabled="true" data-ds-key="old">
        <div class="ds-tree__row"><span class="ds-tree__icon" aria-hidden="true">[icon lock 20]</span><span class="ds-tree__label">Archive 2019</span></div>
      </li>
    </ul>
  </li>
  <li class="ds-tree__item" role="treeitem" aria-expanded="false" data-ds-tree-lazy data-ds-key="reports">
    <div class="ds-tree__row">
      <span class="ds-tree__toggle" aria-hidden="true">[icon chevronRight 16]</span>
      <span class="ds-tree__icon" aria-hidden="true">[icon folder 20][icon folderOpen 20]</span>
      <span class="ds-tree__label">Reports</span>
    </div>
  </li>
</ul>
```

- **Rows.** `.ds-tree__item` (`role="treeitem"`, keyed with `data-ds-key`) holds a `.ds-tree__row` and, for a folder,
  a `.ds-tree__group` (`role="group"`) of child items. A folder has `aria-expanded` and a `.ds-tree__toggle` with a
  `chevronRight` that turns a quarter while it is open; a leaf has neither, and its row keeps the toggle's room, so
  labels line up. `.ds-tree__icon` holds one glyph, or two for a folder group: the second shows while the folder is
  open (`folder`, `folderOpen`). `.ds-tree__label` takes the room and ends in an ellipsis (a link label,
  `a.ds-tree__label`, reads as the row); `.ds-tree__meta` is a short fact in the meta font with tabular figures.
- **Row actions.** `.ds-tree__actions` holds the row's buttons with `tabindex="-1"`: `Tab` reaches those of the
  focused row only, then leaves the tree. Name the record in each `aria-label` ("More for Documents"). A menu opens
  from them as anywhere ([Menu](#menu)).
- Each level sits `--ds-tree-indent` (20px) further in, with a guide (`--ds-tree-guide`) below its folder's chevron.
  Rows are `--ds-tree-row-height` (40px) at the default size and density, the label in the body font; the chosen row
  (`aria-selected="true"`) takes `--ds-tree-selected-bg` (`--ds-accent`) and the label weight, a blocked row
  (`aria-disabled="true"`) the disabled model.
- Each row is a state layer and a ripple host: hover `--ds-state-hover-lg`, the press in `--ds-dur-micro` (not while
  one of its buttons is pressed), the focus layer and an inset ring on `:focus-visible` of its item. No morph.

### Options

On the tree or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes, attributes | Applies to | Effect |
|---|---|---|---|
| Selection | `data-ds-tree-select="single"` (default), `"checkbox"`, `"none"` | the tree | one chosen row (`aria-selected`); tri-state checks (`aria-checked`, `aria-multiselectable` on the tree); open and activate only |
| Drag | `data-ds-tree-drag` | the tree | a grip in each row moves the item and its subtree (`DS.dnd`) |
| Size | `.ds-xs` ... `.ds-xl` | a row | 8px of height per step (24, 32, 40, 48, 56px), the toggle and the indent 4px per step, the label the size's type role |
| Density | `.ds-density-*` | a row | 4px of height per step (40, 36, 32, 28px), the side padding 2px per step; not the type or the indent |
| Shape | `.ds-shape-*` | a row | multiplies the row's radius |
| Touch | `.ds-touch` | a row | at least `--ds-touch-target` high; touch wins over size and density |
| Tone | | | none: a status in a row is a chip or a word |

### Checkboxes

```html
<ul class="ds-tree" role="tree" aria-label="Permissions" data-ds-tree data-ds-tree-select="checkbox">
  <li class="ds-tree__item" role="treeitem" aria-expanded="true" aria-checked="mixed" data-ds-key="devices">
    <div class="ds-tree__row">
      <span class="ds-tree__toggle" aria-hidden="true">[icon chevronRight 16]</span>
      <input class="ds-checkbox ds-tree__check" type="checkbox">
      <span class="ds-tree__label">Devices</span>
    </div>
    <ul class="ds-tree__group" role="group">
      <li class="ds-tree__item" role="treeitem" aria-checked="true" data-ds-key="devices.read">
        <div class="ds-tree__row"><input class="ds-checkbox ds-tree__check" type="checkbox"><span class="ds-tree__label">Read</span></div>
      </li>
      <li class="ds-tree__item" role="treeitem" aria-checked="false" data-ds-key="devices.write">
        <div class="ds-tree__row"><input class="ds-checkbox ds-tree__check" type="checkbox"><span class="ds-tree__label">Change</span></div>
      </li>
    </ul>
  </li>
</ul>
```

`aria-checked` on the item is the state; the `.ds-checkbox.ds-tree__check` in the row only shows it (`DS.tree` makes it
inert, `aria-hidden` and keeps it in step: checked, or the dash for `mixed`). A click on the row or `Space` toggles the
item and every loaded descendant that is not disabled; each folder above shows what its children hold (`mixed` for
some). A disabled child that is not checked does not count, since a check of its folder could never reach it. Children
that load later take their folder's state.

### Lazy children

An item with `data-ds-tree-lazy` loads its children the first time it opens:

```js
DS.tree.create(document.querySelector('#files'), {
  load: async (item, { key, signal }) => {
    const response = await fetch(`/api/folders/${key}`, { signal });
    return (await response.json()).map((entry) => ({ id: entry.id, label: entry.name, icon: 'fileText', meta: entry.size, children: entry.folder || undefined }));
  },
});
```

`load(item, { key, signal })` returns, or resolves to, markup (a string of `.ds-tree__item` elements, morphed into the
group), nodes, or data: `{ id, label, icon, meta, href, children, expanded, disabled, checked, selected }`, where
`children: true` is another lazy folder and an array its children. Data is written through DOM APIs, so its text
needs no escaping; an `href` becomes a link only when it is relative, a fragment (`#…`), `http:`, `https:` or
`mailto:` (a `javascript:` or `data:` one leaves the label as text, so loader data from users is safe); `icon` names a glyph of `DS.icons` (a folder without one shows `folder` and `folderOpen`).

- While it loads the item is `aria-busy="true"`: a `.ds-spinner.ds-tree__spinner` takes the chevron's place after
  `--ds-delay-loader` (a fast load never flashes it). When the children arrive the folder opens and a polite
  announcement says so ("Loaded Reports."); the signal aborts when the tree goes.
- A loader that returns at once (no promise: children built from data the page already holds, as the
  [JSON viewer](#json-viewer) does) renders them in place, with no busy state and no announcement.
- A failure leaves the folder closed with `data-state="error"` and `.ds-tree__error` in its row ("Could not load", with
  an icon), says "Could not load Reports.", dispatches `ds:error`, and the next opening tries again.
- Without a loader the tree dispatches `ds:load` and opens the folder: the page fills its `.ds-tree__group` itself.
- `create()` on a tree the attribute path already made returns that controller with the new options, so a page adds its
  loader to markup that `DS.init()` found.

### Drag to move

With `data-ds-tree-drag` (or `drag: true`) `DS.tree` writes a `.ds-tree__grip` (a quiet extra small icon button named
"Move Plan.pdf") at the end of each row and moves items through [`DS.dnd`](core.md#dsdnd-pointer-and-keyboard-drag):

- **Pointer.** Drag the grip: a line above a row (`data-ds-tree-drop="before"`), below a folder's last row
  (`"after"`), or the folder's row framed (`"inside"`, over its middle half) shows where it goes; the item follows the
  pointer, raised (`drag.css`). A pointer that rests on a closed folder opens it after `--ds-delay-tooltip`.
- **Keyboard.** `Tab` to the grip of the focused row, `Space` lifts; `ArrowUp` and `ArrowDown` step through every place
  in reading order (before each row, into each closed folder, after the last row of each level), `Home` and `End` to the
  first and last; `ArrowRight` opens the folder at an "into" place. `Space` drops, `Escape` cancels. Each step is
  spoken: "Before Plan.pdf, in Documents.", "Into Reports.", "Moved Plan.pdf to Reports, position 3 of 3."
- **Saving.** The tree moves the item in the DOM, then `ds:drop` tells the page with `to: { parent, index, zone }`
  (`parent`: the folder item, or `null` for the top level; `index`: among its children). `preventDefault()` there puts
  the item back. `accept(item, folder)` refuses a place before it shows. A disabled folder and a lazy one that has
  not loaded take no item; a folder never goes into itself.

### Behaviour, keyboard and names

| Key | On a row |
|---|---|
| `ArrowDown`, `ArrowUp` | the next and the previous row that shows |
| `ArrowRight` | a closed folder opens; an open one: its first child |
| `ArrowLeft` | an open folder closes; else the parent folder |
| `Home`, `End` | the first and the last row that shows |
| `Enter` | activates the row: single selection chooses it, a link label follows, `ds:activate` |
| `Space` | checkbox: toggles the check; single: chooses the row; none: activates |
| `*` | opens every sibling folder |
| letters | the next row whose label starts with them (`DS.a11y.typeahead`) |
| `Tab` | the focused row's buttons, then out of the tree |

- One tab stop: the active item has `tabindex="0"`, every other `-1` (owned state, so `DS.dom.morphHtml` keeps it).
  Focus starts on the chosen row, else the first. Closing a folder that holds the focus moves it to the folder.
- A click focuses the row; on the chevron it opens or closes the folder, elsewhere it chooses the row (single), toggles
  its check (checkbox) or opens a folder (none); a double click opens or closes a folder.
- Name the tree (`aria-label`). Each item takes its name from its `.ds-tree__label` (`DS.tree` points
  `aria-labelledby` at it where the item has no `aria-label`), so a folder is not named by the text of every row below
  it. `.ds-tree__icon` and `.ds-tree__toggle` are `aria-hidden`. Say a row's status in words in the row.

### JS API

```js
const files = DS.tree.create(el, { select: 'single', load, drag: true, accept: (item, folder) => true });
files.get();                        // the selected key; checkbox: the checked keys; none: the active key
files.set('plan');                  // chooses a row (checkbox: an array of keys)
files.expand('reports');            // opens a folder (loading it first), expand(key, false) closes it
files.expandAll();                  // every loaded folder; expandAll(false) closes them
files.check('devices', true);       // checkbox
files.focus('plan');                // opens what lies above and focuses it
files.item('plan');                 // the element
files.reload('reports');            // loads a folder again
files.on('toggle', ({ item, key, expanded }) => {});
DS.tree.checkState(['true', 'mixed']);   // 'mixed': what a folder shows for these children
```

`DS.tree.create` returns the controller (`get`, `set`, `on`, `expand`, `expandAll`, `check`, `focus`, `item`,
`reload`, `configure`, `destroy`); the attribute path makes the same one (`DS.core.get(el, 'tree')`).
`DS.tree.checkState` is the rule behind the folders' checks. Events bubble from the tree: `ds:toggle` (`{ item, key,
expanded }`), `ds:select` (`{ item, key }`), `ds:change` (`{ item, key, checked, keys }`), `ds:activate`, `ds:load`,
`ds:error` (`{ item, key, error }`), and `ds:drag-start`, `ds:drag-move`, `ds:drop`, `ds:drag-cancel` of `DS.dnd`.

The tree writes `aria-expanded`, `aria-selected` and `aria-checked`; a page that re-renders the tree writes them from
the events, so its template keeps what the person chose.

### Forced colours

The chosen row is `SelectedItem` / `SelectedItemText`, with a `CanvasText` ring when it has focus; its buttons take the
system colours again. A blocked row is `GrayText`. The drop marks are `Highlight`, the guide `GrayText`, and the checks
are the system's checkboxes.

### Hooks

`--ds-tree-row-height`, `--ds-tree-padding`, `--ds-tree-indent`, `--ds-tree-toggle-size`, `--ds-tree-radius`,
`--ds-tree-selected-bg`, `--ds-tree-guide`, `--ds-tree-drop-color`: see [theming.md](theming.md).

**Motion:** a folder's children open with their height where the browser animates to `auto` (progressive
`interpolate-size`, as `.ds-collapsible`: over `--ds-dur-medium` on `--ds-ease-out`, closing on `--ds-dur-base`,
accelerating), else at once; the chevron turns a quarter on `--ds-ease-spatial`. A drop glides the item into place
(`DS.dnd`).

<!-- changelog -->
- Tree view (`.ds-tree`, `DS.tree`): the APG tree with single selection, tri-state checkboxes, lazy children through a
  loader, row actions, drag to move through `DS.dnd`, type-ahead and folder groups. New strings `treeMove`,
  `treeMoveBefore`, `treeMoveAfter`, `treeMoveInside`, `treeDropped`, `treeLoaded`, `treeLoadFailed`, `treeError`.
