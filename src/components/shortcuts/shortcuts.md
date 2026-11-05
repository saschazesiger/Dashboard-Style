## Shortcut sheet

Every keyboard shortcut of the page in one dialog: "?" opens it, and it lists what
[`DS.hotkeys`](core.md#hotkeys) holds as the page stands, grouped by scope and by group.

```html
<dialog class="ds-dialog ds-dialog--lg ds-shortcuts" id="keys" data-ds-shortcuts aria-labelledby="keys-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <div class="ds-dialog__box">
    <div class="ds-dialog__head">
      <h2 class="ds-dialog__title" id="keys-title">Keyboard shortcuts</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <input class="ds-input ds-shortcuts__filter" type="search" aria-label="Find a shortcut" placeholder="Find a shortcut" autofocus>
    <div class="ds-dialog__body ds-shortcuts__list"></div>
  </div>
</dialog>
```

`shortcuts.js` fills `.ds-shortcuts__list` when the sheet opens:

```html
<section class="ds-shortcuts__scope" aria-labelledby="h1">          <!-- only when several scopes have shortcuts -->
  <h3 class="ds-shortcuts__title" id="h1">Board</h3>
  <div class="ds-shortcuts__groups">
    <section class="ds-shortcuts__group" aria-labelledby="h2">
      <h4 class="ds-shortcuts__heading" id="h2">Editing</h4>
      <dl class="ds-shortcuts__items">
        <div class="ds-shortcuts__item">
          <dt class="ds-shortcuts__label">Save</dt>
          <dd class="ds-shortcuts__keys"><span class="ds-shortcuts__combo" role="img" aria-label="Ctrl+S"><kbd class="ds-kbd">Ctrl</kbd><kbd class="ds-kbd">S</kbd></span></dd>
        </div>
        <div class="ds-shortcuts__item" data-off>
          <dt class="ds-shortcuts__label">Archive <span class="ds-shortcuts__off">Not available here</span></dt>
          <dd class="ds-shortcuts__keys"><span class="ds-shortcuts__combo" ...>...</span>
            <span class="ds-shortcuts__or">or</span><span class="ds-shortcuts__combo" ...>...</span></dd>
        </div>
      </dl>
    </section>
  </div>
</section>
<p class="ds-shortcuts__empty">No keyboard shortcuts here.</p>              <!-- none at all, or none that match -->
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` … `.ds-xl` | the dialog or any ancestor | a shortcut's label type (`--ds-size-font`); the keys keep the code type |
| Density | `.ds-density-*` | the dialog or any ancestor | a row's block padding 2px per step, the room between groups 4px per step |
| Shape | `.ds-shape-*` | the dialog or any ancestor | the box's and the keys' radius |
| Width | `.ds-dialog--lg`, `--xl` | the dialog | the groups flow into columns of at least `--ds-shortcuts-column` (240px): one on a phone |
| Tone | none | | |

### Behaviour

- **Its own key.** `data-ds-shortcuts` (or `DS.shortcuts.create()`) registers "?" with `DS.hotkeys` ("Show the keyboard
  shortcuts", so the sheet lists itself); `data-ds-shortcuts-hotkey` names another combo, `"off"` none. "?" is a plain
  key: it never types into a field, where it stays the field's. The same key closes the open sheet; it passes while
  another overlay is open. A `[data-ds-open]` button opens it too.
- **What it lists.** `DS.hotkeys.list()` when the sheet opens, and again on every registration or scope change while it
  is open: every registration with a description, also those of `data-ds-hotkey` and the [command
  palette](#command-palette)'s commands. A control that is hidden is left out; one that does nothing now (disabled, a
  scope that does not count) shows with `data-off` and the words "Not available here".
- **Scopes.** With more than one scope that has shortcuts, each is a section (`.ds-shortcuts__scope`): the scope that
  counts first leads, `global` ("Everywhere", the string `shortcutsGlobal`) comes last. Its heading is its label from
  `scopes` (`{ board: 'Board' }`) or `data-ds-shortcuts-scopes` (the same as JSON), else its name with a capital.
- **Filter.** A `.ds-shortcuts__filter` field hides what does not match every word typed, in the description or the
  keys; nothing left says "No results".
- `DS.shortcuts.render(container, { filter, labels, root, apple, headingLevel })` writes the same list into any element
  (a help page) and returns how many shortcuts it shows; `DS.shortcuts.byScope(groups, order)` is its grouping.

### JS API

`js/shortcuts.js` (`DS.shortcuts`):

- `create(el, { scopes, hotkey })` returns the controller (the one `data-ds-shortcuts` makes): `get()` (`{ open,
  count, filter }`), `set({ scopes, filter })`, `on('filter', fn)`, `open({ opener })`, `close()`, `refresh()` and
  `destroy()`.
- `open(el, options)`, `close(el)`, `render(container, options)` and `byScope(groups, order)`.
- Events on the dialog: `ds:filter` (`{ query, count }`) and the dialog's `ds:open` and `ds:close`.

### Accessibility

- A modal dialog named by its title; focus goes to the filter field on open, so typing finds a shortcut at once (without
  one, to the first control, as in every dialog). The module marks the filter `autofocus` when nothing in the sheet
  is, so `DS.overlay` focuses it first and the close button before it never flashes its tooltip.
- Each group is a section named by its heading, its shortcuts a description list. A combo reads as one phrase
  (`role="img"` with the line `DS.hotkeys.format()` gives: "Ctrl+S", "⇧⌘K"), so a screen reader never spells the keys.
- A shortcut that is off says so in words, never by colour alone.
- Plain-letter shortcuts are a burden for speech input (WCAG 2.1.4): the sheet makes them discoverable; offer a way to
  turn them off where a page has many.

### Forced colours

Rows keep their hairlines (borders); a shortcut that is off reads `GrayText`.

### Hooks

`--ds-shortcuts-column` (240px): the narrowest column of groups.

### Motion

The dialog's entrance and exit (`DS.overlay`); the list changes in place.

<!-- changelog -->
- Shortcut sheet (3.0): `.ds-shortcuts` in a `.ds-dialog`, `DS.shortcuts` (`create`, `open`, `close`, `render`,
  `byScope`), `data-ds-shortcuts`; "?" lists every shortcut of `DS.hotkeys`, grouped by scope and group, with a filter.
