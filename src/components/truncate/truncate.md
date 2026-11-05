## Truncate

A text too long for its place, cut at its end, its start or its middle with an ellipsis. While it is cut it shows
whole in a tooltip; a screen reader always reads it whole.

```html
<span class="ds-truncate" data-ds-truncate="end">Replace the toner of every printer on floor 2</span>
<span class="ds-truncate" data-ds-truncate="middle">inventory-export-2026-11-04-final.csv</span>
<a class="ds-truncate" data-ds-truncate="start" href="/devices/7">/devices/north/floor-2/printer-7</a>
<p class="ds-truncate ds-truncate--lines">A description of up to two lines, then cut at its end.</p>
```

| Position | `data-ds-truncate` | Keeps | For |
|---|---|---|---|
| End | `end` (default) | the start | titles, names, sentences: CSS cuts it (`text-overflow`) |
| Start | `start` | the end | paths, the last part of a breadcrumb |
| Middle | `middle` | both ends | file names with their extension, IDs that differ at the end |
| Lines | `.ds-truncate--lines` | the first `--ds-truncate-lines` (2) lines | a description in a card; CSS alone, no tooltip |

For `start` and `middle` the module cuts the text itself on every resize, as many characters as fit, between
graphemes, so an emoji or an accented letter stays whole. It writes what shows into `.ds-truncate__shown`
(`aria-hidden`) and keeps the whole text in a `.ds-sr` beside it. The whole text is the element's text when it starts,
or `data-ds-truncate-text`; a re-render with `DS.dom.morphHtml` that writes a new text is taken as the new whole text.

While the text is cut, `data-tip` holds the whole text (owned state, so a re-render keeps it), and the tooltips of
`DS.overlay` show it on hover and on keyboard focus; a tip the page wrote itself stays. A link or a button may be the
`.ds-truncate` itself: its name stays whole and focusing it shows the tooltip. In a flex row the element shrinks
(`min-width: 0`); give the row's other parts `flex: none`. A grid track needs `minmax(0, 1fr)`, else the text widens it.

### JS API

- `DS.truncate.create(el, { position, text })`: the controller the attribute path makes. `get()` gives
  `{ text, shown, cut }`, `set(text)` writes a new whole text and emits `ds:change`, `on('change', fn)` runs when the
  cut changed, `update()` measures again, `destroy()` puts the whole text back.
- `DS.truncate.cut(text, keep, position)`: the text with `keep` graphemes around the ellipsis.
- `DS.truncate.fit(text, position, fits)`: the longest cut for which `fits(shown)` is true (a binary search).

### Options

None read: it takes the type of where it stands.

### Accessibility

The whole text is always in the accessibility tree: the element's own text at the end, the `.ds-sr` copy at the start
and in the middle. The tooltip is the element's description while it is cut; where the whole text matters to a
keyboard user and the element is no link or button, give it `tabindex="0"`.

### Forced colours

Nothing of its own: the text follows the system colours.

### Hooks

`--ds-truncate-lines`: see [theming.md](theming.md).

<!-- changelog -->
- Truncate (new, `truncate`): `data-ds-truncate` (`end`, `start`, `middle`) cuts a text with an ellipsis, whole in an
  owned tip while cut and in `.ds-sr` for screen readers; `.ds-truncate--lines`; `DS.truncate.create`, `cut`, `fit`;
  hook `--ds-truncate-lines`.
