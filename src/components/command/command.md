## Command palette

One search field over every command of the app, in a dialog: Ctrl+K (Command+K on Apple systems) opens it, typing finds
a command, Enter runs it.

```html
<button class="ds-btn" type="button" data-ds-open="#palette">[icon search 16]Search</button>
<dialog class="ds-dialog ds-command" id="palette" data-ds-command aria-label="Command palette">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <div class="ds-command__search">[icon search 20]
      <input class="ds-command__input" type="text" aria-label="Search commands" placeholder="Search or run a command">
      <kbd class="ds-kbd">Esc</kbd>
      <button class="ds-btn ds-btn--text ds-command__close" type="button" data-ds-close>Cancel</button>
    </div>
    <div class="ds-command__list" aria-label="Commands">
      <div class="ds-command__group">
        <div class="ds-command__heading">Devices</div>
        <div class="ds-command__item" data-ds-command-id="add-device" data-ds-command-shortcut="mod+shift+a" data-ds-command-keywords="new create">
          [icon plus 20]<span class="ds-command__label">Add a device</span></div>
        <div class="ds-command__item" data-ds-command-href="/devices">[icon laptop 20]<span class="ds-command__label">Open devices</span></div>
      </div>
    </div>
    <div class="ds-command__foot">
      <span><kbd class="ds-kbd">↑</kbd><kbd class="ds-kbd">↓</kbd> Move <kbd class="ds-kbd">Enter</kbd> Run <kbd class="ds-kbd">Esc</kbd> Close</span>
    </div>
  </div>
</dialog>
```

The options in the markup are read once, as data: their label, group heading, `data-ds-command-id`,
`-keywords`, `-shortcut` and `-href`, an icon and a `.ds-command__description`. From then on `command.js` renders the
list. A rendered option holds its icon (`.ds-command__icon`), then `.ds-command__content` with the label and the
description, then its shortcut's keys and, for a page, the chevron:

```html
<div class="ds-command__item" role="option" id="o1" aria-selected="true" data-active aria-keyshortcuts="Control+Shift+A">
  [icon plus 20 ds-command__icon]
  <span class="ds-command__content"><span class="ds-command__label"><mark class="ds-command__match">Add</mark> a device</span>
    <span class="ds-command__description">Register a laptop, tablet or phone</span></span>
  <span class="ds-command__shortcut" aria-hidden="true"><kbd class="ds-kbd">Ctrl</kbd><kbd class="ds-kbd">Shift</kbd><kbd class="ds-kbd">A</kbd></span></div>
```

Most apps give the commands as data instead:

```js
const palette = DS.command.create(document.querySelector('#palette'), {
  commands: [
    { id: 'add-device', label: 'Add a device', group: 'Devices', icon: DS.icons.plus, shortcut: 'mod+shift+a',
      keywords: ['new', 'create'], run: () => openNewDevice() },
    { id: 'theme', label: 'Change the theme', group: 'Settings', icon: DS.icons.palette, children: [
      { id: 'light', label: 'Light', run: () => setTheme('light') },
      { id: 'dark', label: 'Dark', run: () => setTheme('dark') },
    ] },
    { id: 'tickets', label: 'Search tickets', prefix: '#', placeholder: 'Ticket number or title',
      children: (query, { signal }) => fetch(`/api/tickets?q=${encodeURIComponent(query)}`, { signal }).then((r) => r.json()) },
  ],
  providers: [{ group: 'Devices', minLength: 2, search: (query, { signal }) => findDevices(query, signal) }],
});
palette.on('select', ({ command }) => track(command.id));
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` … `.ds-xl` | the dialog or any ancestor | the search row and an option 8px per step, the option's type |
| Density | `.ds-density-*` | the dialog or any ancestor | the search row and an option 4px per step, the list's padding 2px per step; type stays |
| Shape | `.ds-shape-*` | the dialog or any ancestor | the box's radius (the dialog's) and an option's radius |
| Touch | `.ds-touch` | the dialog or any ancestor | an option at least `--ds-target-min` tall |
| Tone | none | | a palette states no status |

Phones (600px and below): the box fills the window, the key hints of the foot and the field go, and
`.ds-command__close` (a text button, hidden above 600px) is the way out without an Escape key.

### Commands

| Key | What |
|---|---|
| `id` | what the recent list and `run(id)` know it by (default its label) |
| `label`, `description` | its name (searched, the matched letters marked with `.ds-command__match`) and a line under it |
| `group` | the heading it sits under |
| `keywords` | more words that find it (a list, or a text) |
| `icon` | a glyph of `DS.icons` |
| `shortcut` | a combo of `DS.hotkeys` (or a list): shown as keys (`.ds-command__shortcut`, `aria-keyshortcuts` on the option) and registered with `DS.hotkeys` while the palette lives, so it works without the palette and shows on the [shortcut sheet](#shortcut-sheet) (`shortcuts: false` leaves them out) |
| `href`, `run(command, palette)` | what it does: the palette closes (focus goes back to its opener), then it runs. An `href` is followed only when [`DS.core.safeHref()`](core.md) accepts it (`http:`, `https:`, `mailto:`, `tel:` or relative); otherwise nothing happens and the error goes to `reportError` |
| `children` | makes it a page: a list, or a function `(query, { signal })` that returns one or a promise of one (a search on the server); the option shows `.ds-command__chevron` |
| `prefix`, `placeholder` | a page's character that, typed first, enters it (`>`, `#`); the field's placeholder there |
| `disabled` | shown with `aria-disabled`, reachable, never run |
| `keepOpen` | runs without closing the palette |

### Behaviour

- **Opening.** `data-ds-command` (or `DS.command.create()`) registers Ctrl+K with `DS.hotkeys` (the combo of
  `data-ds-command-hotkey`; `"off"` registers none); the same combo closes the open palette, and it passes while
  another overlay is open. A `[data-ds-open]` button opens it too, and gets `aria-keyshortcuts`. It opens on the first
  page with an empty field, wherever it was left.
- **Search.** Every word typed must match the label, letters in order with gaps allowed (`adddev` finds "Add a
  device"), or a keyword; case and accents aside. Word starts and runs of letters score higher; groups follow their
  best match. `DS.command.fuzzy(query, text)` and `DS.command.rank(commands, query)` are the same search for a page's
  own lists.
- **Recent.** The last commands run (`recent`, default 5; 0: none) lead the empty field under "Recent", remembered
  through [`DS.store`](core.md#dsstore-remembered-preferences) (namespace `command`, the dialog's id as key). Only
  the palette's own `commands` and the items of their list pages are remembered: a provider's result or an item of a
  page function is data of the moment, so it never takes a Recent slot.
- **Pages.** A command with `children` opens in place: its label shows before the field (`.ds-command__back`, a
  button that goes back), the list holds its children. Backspace in an empty field and Escape go back one page; on
  the first page Escape closes the palette.
- **Providers.** `providers` (each `{ group, search(query, { signal, page }), minLength }`) and a page's function
  are asked --ds-dur-fast after the last key; a newer query aborts the older call (its `signal`). Meanwhile the list
  has `aria-busy="true"` and the status line a `.ds-spinner` (after `--ds-delay-loader`); a failure says so there.
- **Empty.** Nothing found: the list hides (the field's `aria-expanded` turns `false`) and `.ds-command__empty` says
  `No results for "…"` (`commandEmpty`).

### JS API

`js/command.js` (`DS.command`):

- `create(el, options)` returns the controller (the one `data-ds-command` makes; a second call sets `commands` and
  `providers`): `get()` (`{ open, query, page, active }`), `set({ commands, providers, query })`, `on('select' |
  'query', fn)`, `open({ opener, query, page })`, `close()`, `back()`, `run(id)`, `refresh()` and `destroy()`.
  Options: `commands`, `providers`, `recent`, `hotkey`, `shortcuts`.
- `open(el, options)` and `close(el)`.
- `fuzzy(query, text)` returns `{ score, ranges }` or `null`; `rank(commands, query)` the matching commands, best first.
- Events on the dialog: `ds:select` (`{ command, query }`), `ds:query` (`{ query, page }`), and the dialog's
  `ds:open` and `ds:close`.

### Accessibility

- The WAI-ARIA combobox in a modal dialog: the field is `role="combobox"` with `aria-expanded` (`true` while the list
  has options, `false` while nothing matches), `aria-controls` and `aria-activedescendant` (written by `command.js`), the list a `role="listbox"` of options in
  `role="group"`s named by their headings. The active option carries `aria-selected="true"` and `data-active`. Name the
  dialog (`aria-label`) and the field.
- Keys: ArrowDown and ArrowUp move the active option (wrapping), PageDown and PageUp go to the next or previous group,
  Enter runs it; Home, End and the letters stay the field's. Focus never leaves the field; Tab reaches the dialog's
  other controls.
- The status line (`.ds-command__status`, `role="status"`) says how many results there are once typing pauses, "Loading"
  while providers answer, and when they failed.
- Status is never colour alone: the active option has the hover layer, a match the label's weight.

### Forced colours

The active option takes a `Highlight` ring, a match its underline, blocked options `GrayText`; the field's line turns
`Highlight` while it has focus.

### Hooks

`--ds-command-width` (640px), `--ds-command-top` (the room above the box, `min(12vh, 96px)`), `--ds-command-height`
(480px at most), `--ds-command-search-height` (56px) and `--ds-command-item-height` (48px), the md comfortable bases,
`--ds-command-item-radius` (`--ds-radius-sm`).

### Motion

The dialog's entrance and exit (`DS.overlay`). The active option's layer fades in over `--ds-dur-micro` and goes at
once, so a held arrow key leaves no trail. Results change in place, without motion.

<!-- changelog -->
- Command palette (3.0): `.ds-command` in a `.ds-dialog`, `DS.command` (`create`, `open`, `close`, `fuzzy`, `rank`),
  `data-ds-command`; Ctrl+K through `DS.hotkeys`, groups, recent commands through `DS.store`, fuzzy search with
  marks, shortcuts, pages and prefixes, async providers.
