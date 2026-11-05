## Expandable text

A long text shows its first lines and a "Show more" button that reveals the rest: a description, a comment, a log
message in a list. The button shows only while the text is longer than those lines.

```html
<div class="ds-expandable" data-ds-expandable>
  <div class="ds-expandable__text">Every printer on the second floor reports low toner ...</div>
</div>

<!-- two lines, open at the start -->
<div class="ds-expandable" data-ds-expandable="open" style="--ds-expandable-lines: 2"> ... </div>
```

`DS.init()` gives the text an id (unless it has one) and adds the toggle after it:
`<button class="ds-link-btn ds-expandable__toggle" type="button" aria-expanded="false" aria-controls="...">`, labelled
with the strings `showMore` and `showLess`. It writes `data-state` on the element: `closed` clamps the text to
`--ds-expandable-lines` (3), `open` shows it whole; a text that fits gets neither and no toggle. Without the script the
whole text shows. Whether the text is longer than its lines is measured again on every resize, so a phone may show
the toggle where a wide screen does not.

| Part | Class | What |
|---|---|---|
| Block | `.ds-expandable` | the text and its toggle; `data-ds-expandable` (`"open"` starts open) |
| Text | `.ds-expandable__text` | the text, clamped while closed |
| Toggle | `.ds-expandable__toggle` | added by the module: an inline text link ([`.ds-link-btn`](#buttons)) |

### JS API

- `DS.expandable.create(el, { open })`: the controller the attribute path makes. `get()` gives whether it is open,
  `set(open)` opens or closes it and emits `ds:change` with `{ open }`, `on('change', fn)`, `update()` measures
  again, `destroy()` removes the toggle and the state.
- `DS.expandable.overflows(fullHeight, lineHeight, lines)`: whether a text that tall hides some of its lines.

### Options

None read: the text takes the type of where it stands; the lines are the hook.

### Accessibility

The toggle is a real button after the text, with `aria-expanded` and `aria-controls`; `Enter` or `Space` opens and
closes it, and focus stays on it. The clamp is visual: a screen reader reads the whole text in both states.

### Forced colours

Nothing of its own: the toggle is a text link in the system's link colour.

### Hooks

`--ds-expandable-lines`: see [theming.md](theming.md).

**Motion:** none. The text opens and closes at once: its height pushes the layout, and a clamp has no height to
glide between.

<!-- changelog -->
- Expandable text (new, `expandable`): `data-ds-expandable` clamps `.ds-expandable__text` to `--ds-expandable-lines`
  and adds a `.ds-expandable__toggle` ("Show more", "Show less") only while the text is longer; `DS.expandable.create`,
  `overflows`.
