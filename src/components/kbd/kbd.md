## Key combos

A keyboard shortcut written as the keys of the user's platform: `⇧ ⌘ K` on Apple systems, `Ctrl + Shift + K`
elsewhere, one [`.ds-kbd`](#utilities) per key, and read out in words. A single key in running text stays a plain
`<kbd class="ds-kbd">Esc</kbd>`.

```html
<kbd class="ds-kbd-combo" data-ds-kbd="mod+k"></kbd>               <!-- ⌘ K, or Ctrl + K -->
<kbd class="ds-kbd-combo" data-ds-kbd="mod+shift+p"></kbd>         <!-- ⇧ ⌘ P, or Ctrl + Shift + P -->
<kbd class="ds-kbd-combo" data-ds-kbd="g i"></kbd>                 <!-- G then I: a sequence -->
<kbd class="ds-kbd-combo" data-ds-kbd="alt+arrowup" data-ds-kbd-platform="other"></kbd>   <!-- always Alt + ↑ -->
```

The combo is [`DS.hotkeys`](core.md#hotkeys)' own syntax: modifiers and one key joined by `+`, `mod` Command on
Apple systems and Control elsewhere; combos separated by spaces are a sequence. So the shortcut a page registers and
the keys it shows come from one string:

```js
const combo = 'mod+k';
DS.hotkeys.register(combo, openSearch, { description: 'Search' });
button.setAttribute('aria-keyshortcuts', DS.kbd.keys(combo).aria);   // Meta+K or Control+K
```

`DS.init()` writes the keys into the element: a `.ds-kbd` per key in a `.ds-kbd-combo__keys` group that is
`aria-hidden`, each combo in a `.ds-kbd-combo__combo` that never breaks, `.ds-kbd-combo__plus` ("+") between keys where the platform writes it (not on Apple systems),
`.ds-kbd-combo__then` ("then", the string `kbdThen`) between the combos of a sequence, and one `.ds-sr` text with the
keys in words ("Shift Command K"; the strings `kbdCommand`, `kbdOption`, `kbdControl`, `keyShift`, `keyCtrl` ...).
`data-ds-kbd-platform="apple"` or `"other"` pins the platform, for a page that documents both. A combo `DS.hotkeys`
cannot read leaves the element's text alone and reports the error.

### JS API

- `DS.kbd.create(el, { combo, platform })`: the controller the attribute path makes. `get()` gives
  `{ combo, spoken, aria }`, `set(combo)` writes another one (and `data-ds-kbd`) and emits `ds:change`,
  `on('change', fn)`, `update()`, `destroy()` (the keys stay).
- `DS.kbd.keys(combo, { apple })`: the keys alone: `combos` (`keys` and `text` per combo), `spoken`, `aria` and
  `apple`.

### Options

None read: the combo takes the type of where it stands (a menu item's meta, a tooltip, a sentence); the keys keep
the code font and the shape of `.ds-kbd` (`.ds-shape-*` multiplies its radius).

### Accessibility

The keys are hidden from assistive technology and said once in words, so a screen reader never spells "⌘". The
combo describes a shortcut; the control the shortcut presses carries `aria-keyshortcuts` (`DS.kbd.keys(combo).aria`).
Nothing here takes focus.

### Forced colours

The keys keep their edge (a border); the separators take the text colour.

<!-- changelog -->
- Key combos (new, `kbd`): `data-ds-kbd` writes a shortcut as the keys of the platform (`.ds-kbd-combo`,
  `__keys`, `__combo`, `__plus`, `__then`) with the words in `.ds-sr`; `DS.kbd.create`, `keys`; strings `kbdCommand`,
  `kbdOption`, `kbdControl`, `kbdThen`.
