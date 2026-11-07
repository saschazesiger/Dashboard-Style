## Search field

The search pill of [Form](#form) with what a search needs around it: a shortcut that reaches it, a clear button, the
number of results shown and spoken, and the recent searches. `DS.search` runs it.

```html
<div class="ds-search" data-ds-search data-ds-search-recent="devices" data-ds-search-count="dev-count">
  [icon search 20]
  <input class="ds-input" id="q" type="search" aria-label="Search devices" placeholder="Search devices"
         autocomplete="off" data-ds-hotkey="/">
  <kbd class="ds-kbd ds-search__key" aria-hidden="true"></kbd>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-search__clear" type="button" hidden>[icon close 18]</button>
</div>
<span class="ds-search__count" id="dev-count"></span>
```

Each part is optional: leave out the key, the clear button, `data-ds-search-recent` or the count. The count lives
wherever the page shows it (beside the search, at the end of a toolbar), named by its id.

**Options** ([options.md](options.md)).

| Option | Attribute or class | Where it applies | Effect |
|---|---|---|---|
| Shortcut | `data-ds-hotkey="/"` (or `mod+k` ...) | the input | the system's hotkey focuses and selects the field ([core.md](core.md#hotkeys)); its first combo is written into an empty `.ds-search__key` as the platform says it ("/", "Ctrl+K", "⌘K") |
| Recent searches | `data-ds-search-recent="<key>"`, `data-ds-search-recent-max` (5) | the root | the searches kept in `DS.store` (namespace `search`, under the key) and offered in an empty field |
| Count | `data-ds-search-count="<id>"` | the root | the element that shows the count |
| Size | `.ds-xs` ... `.ds-xl` | the search or any ancestor | the pill 8px per step (form.css); the clear button 8px lower than the pill at every size |
| Density | `.ds-density-*` | any container | 4px per step on the pill and the clear button |
| Shape | `.ds-shape-*` | any container or the theme | the pill and the clear button (actions: a pill at the default, square at 0) |
| Touch | `.ds-touch` | the theme or a container | pill and clear button at least `--ds-touch-target`; the key never shows on a touch screen |
| Tone | | | none |

**Behaviour.** `DS.init()` finds `data-ds-search`.

- **Clear**: the button shows while the field has a value (the system sets `hidden`), empties it, sends an `input`
  event (the page's filter runs) and gives the focus back to the field. Escape in a filled field does the same in every
  engine and keeps a dialog around it open; the next Escape closes the dialog. The engine's own clear glyph goes while
  the button is there. A button without a name is called by the string `clear`.
- **Shortcut**: `data-ds-hotkey` on the input is the system's hotkey; the key shows while the field rests empty
  ([Form](#form), "Search key"), and the field keeps room for it whatever its width (`--ds-search-key-room`, written by
  the system).
- **Count**: `set({ count })` writes "12 results" (the strings `searchResultsOne` and `searchResultsMany`, chosen by
  the locale's plural rules; 0 is `noResults`) into the count, adds it to the field's description and says it once
  typing pauses (`--ds-delay-tooltip`). `set({ count: null })` empties it.
- **Recent searches**: Enter in a filled field (or `remember(value)`) keeps the search at the head of the list; an
  earlier copy goes, in any case. In an empty field a click, **Down** or **Alt+Down** opens the list under the pill
  (through `DS.overlay`, as the combobox's list): **Up** and **Down** move the active row, **Enter** takes it (the value,
  an `input` event and `ds:search`), **Delete** forgets it, **Escape** or **Alt+Up** closes the list, and typing closes
  it too. "Clear recent searches" (the string `clearRecent`) under the list forgets them all. While the list exists
  the field is a `combobox` with `aria-controls` and `aria-activedescendant`; the list is a `listbox` named "Recent
  searches" (`recentSearches`).
  The list is written by `DS.search`: a `.ds-search__popup` (the combobox's popup), each row with the
  `.ds-search__history` glyph, and a `.ds-search__foot` holding the `.ds-search__forget` button.
- **Events** on the root: `ds:search` with `{ value, source }` (`'enter'` or `'recent'`). The input's own `input`
  event is the change.

**JS API.**

```js
const search = DS.search.create(root);    // or DS.core.get(root, 'search')
search.set({ count: rows.length });
search.get();                             // { value: 'lap', count: 12, recent: ['laptop', 'router'] }
search.remember('laptop');
search.forget();
search.on('search', ({ value, source }) => load(value));
DS.search.remember(['router'], 'Laptop', { max: 5 });   // ['Laptop', 'router']
```

`DS.search.create` returns the controller the attribute path makes (`get`, `set`, `remember`, `forget`, `on`,
`update`, `destroy`); `DS.search.remember` is the rule behind the list.

**Accessibility.** Name the input (`aria-label`, or a label) and keep `type="search"`; put `role="search"` on the
form or region around it when it searches the page. The key is `aria-hidden`: the hotkey writes `aria-keyshortcuts`.
The count is the field's description and is announced politely, once typing pauses, so a fast typist hears it once.
Recent searches are kept on this device only (`localStorage`): never offer the list on a shared device for searches
that reveal private data, and offer "Clear recent searches".

**Forced colours.** The clear button is a system button; the list is the combobox's (its edge, the active row in
`Highlight`); the foot's rule is `CanvasText`.

**Hooks:** `--ds-search-clear-size` (32px) ([theming.md](theming.md#component-hooks)); the list takes the
combobox's.

**Motion:** the list opens and closes as the combobox's (`DS.overlay`); the key fades as in [Form](#form).
