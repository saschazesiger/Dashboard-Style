## JSON viewer

A JSON document to read: its levels open and close, a search marks keys and values, each row copies its value or its
path. For a payload, a webhook body, a record's raw data or a configuration.

```html
<div class="ds-jsonview" data-ds-jsonview aria-label="Response of GET /devices/42">
  <!-- the JSON, in a script element of type application/json -->
</div>
```

The source sits inside the element in a `<script type="application/json">` (it never renders; a `<pre>` works too, and
shows until the script runs), or comes from the page:

```js
const view = DS.jsonview.create(document.querySelector('#payload'), { value: await response.json(), open: 2 });
view.setText(await response.text());   // keeps every number's digits (ids beyond 2^53)
```

`DS.jsonview` (`js/jsonview.js`) writes everything inside the element: `.ds-jsonview__bar` (a search field
`.ds-jsonview__find` in `.ds-jsonview__search`, the count of matches `.ds-jsonview__count`, previous and next, expand
all and collapse all) and the rows, a [tree view](#tree-view) `.ds-tree.ds-jsonview__tree`. The source stays in place,
hidden: a `<script type="application/json">` (or a `<pre>`) inside the element, else `value` or `text` of `create()`.

- A row is the key (`.ds-jsonview__key`), `: ` (`.ds-jsonview__punct`) and the value (`.ds-jsonview__value`), in the code
  font. The value says its type in its text, as JSON writes it (quotes around a string, `true`, `false`, `null`, `{…}`
  and `[…]` around a container), and in its colour: `.ds-jsonview__value--string`, `--number`, `--boolean`, `--null`,
  `--object`, `--array` (`.ds-jsonview__value--string`, `.ds-jsonview__value--number`, `.ds-jsonview__value--boolean`,
  `.ds-jsonview__value--null`, `.ds-jsonview__value--object`, `.ds-jsonview__value--array`). A long value wraps. A container's row ends in its size ("3 keys", "120 items").
- **Lazy.** Only what opens is rendered: `data-ds-jsonview-open` (or `open`, default 1) is how many levels show open at
  first, and every other container renders its rows the first time it opens (quietly: the data is already there). A
  container of more than 100 entries opens into ranges (`.ds-jsonview__range`, `[0 … 99]`, then `[0 … 9999]` levels for
  more), so no level ever holds more than 100 rows. Expand all opens at most 1500 rows; the rest stay closed.
- **Big numbers.** The parser keeps each number as the text it was written as: `12345678901234567890` shows and copies
  with every digit. `get()` gives integers a double cannot hold as `BigInt`; `text()` gives the JSON exactly.
- **Search.** The field marks every key and value that holds the text (case-insensitive) with
  `<mark class="ds-jsonview__mark">`, opens the levels down to the first match and makes it the tree's chosen row. `Enter`
  goes to the next match, `Shift+Enter` to the one before (or the buttons), `Escape` clears the field (a dialog around it
  stays open). The count says "2 of 5" (at most 1000+) or "No results", and the announcer says it.
- **Copy.** Each row has two buttons (`.ds-jsonview__actions`): the value (a string's own text, a number's digits, a
  container as JSON with two spaces) and the path (`$.devices[0].name`, other keys quoted: `$["display name"]`). They
  show on the row under the pointer, the focused row and the chosen row, and always without hover; `Tab` reaches them
  from the focused row. The announcer says "Copied"; `ds:copy` tells the page.
- **Not JSON.** Text that is no JSON shows `.ds-jsonview__error` with an icon and the place ("Not valid JSON: line 3,
  column 7."), sets `data-state="error"` on the element and dispatches `ds:error`.
- `data-ds-jsonview-search="off"` (or `search: false`) leaves out the bar.

### Options

On the viewer or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the rows | those of the tree view, from a 32px row (`--ds-jsonview-row-height`): 8px per step; the indent 4px per step; the text stays the code font |
| Density | `.ds-density-*` | the rows | 4px of height per step (32, 28, 24, 20px) |
| Shape | `.ds-shape-*` | the block, the rows, a mark | multiplies the radius |
| Touch | `.ds-touch` | the rows, the buttons | at least `--ds-touch-target` high |
| Tone | none | | the types are in the text; an error says so in words |

### JS API

| Export | What |
|---|---|
| `create(el, options)` | a viewer from the page (`value` or `text`, `open`, `search`), or new options for one `DS.init()` made; the controller below |
| `parse(text)` | JSON text to the model (`{ type, entries }`, `{ type: 'number', raw }` ...); throws a `SyntaxError` with `line`, `column` and `offset` |
| `fromValue(input)` | a JavaScript value to the model, as `JSON.stringify` sees it (`toJSON()`, `undefined` left out, a `BigInt` with its digits); a cycle throws |
| `toValue(model)` | the model to a value; integers beyond 2^53 become `BigInt` |
| `stringify(model, indent)` | JSON text of a model or a value, every number as written (`indent` spaces, default 2; 0: one line) |
| `pathOf(segments)` | a path from `$`: `['devices', 0, 'name']` gives `$.devices[0].name` |
| `ranges(from, to)` | the ranges a container's entries open into (none up to 100) |
| `search(model, query, limit)` | the entry index paths of the keys and values that hold `query`, in document order (at most `limit`, default 1000) |

The controller: `get()`, `set(value)`, `setText(text)`, `text()`, `search(text)` (resolves once the first match shows),
`matches()` (`{ query, total, index }`), `expandAll(open)`, `tree()` (the [tree view](#tree-view)'s controller),
`on(type, fn)`, `configure({ open, search })`, `update()` and `destroy()` (the source shows again). Events on the
element: `ds:copy` `{ kind, text, path }`, `ds:search` `{ query, total, index }`, `ds:error` `{ error }`, and those of
the tree on its rows (`ds:toggle`, `ds:select`).

### Keyboard and names

The rows are the tree view's: one tab stop, `↑` `↓` walk, `→` opens or enters, `←` closes or goes up, `Home` `End`,
`*` opens the siblings, letters jump by key, `Enter` and `Space` choose a row. `Tab` goes from the focused row to its copy
buttons, then on. The field, the count and the buttons come first. Name the viewer (`aria-label` or
`aria-labelledby`): the tree takes its name; each item is named by its key and value ("owner: {…}"), and each copy
button by what it copies ("Copy the value of owner").

### Forced colours

The type colours give way to `CanvasText` (the syntax still tells the types apart); a mark is `Highlight` /
`HighlightText`; the chosen row is the tree's `SelectedItem`. The block, the field and the error keep their borders.

### Hooks

`--ds-jsonview-row-height`, `--ds-jsonview-indent`, `--ds-jsonview-max-height`, `--ds-jsonview-radius`,
`--ds-jsonview-key`, `--ds-jsonview-string`, `--ds-jsonview-number`, `--ds-jsonview-boolean`, `--ds-jsonview-null`,
`--ds-jsonview-mark-bg`: see [theming.md](theming.md).

**Motion:** the tree view's (a level opens with its height where the browser animates to `auto`; the chevron turns).

<!-- changelog -->
- JSON viewer (`.ds-jsonview`, `DS.jsonview`): a JSON document on the tree view, lazy (only what opens renders, more
  than 100 entries open into ranges), with search and marks, copy value and copy path per row, and exact big numbers
  (its own parser keeps each number's digits). New strings `jsonTree`, `jsonSearch`, `jsonFind`, `jsonPrevious`, `jsonNext`,
  `jsonMatch`, `jsonExpandAll`, `jsonCollapseAll`, `jsonCopyValue`, `jsonCopyPath`, `jsonKey`, `jsonKeys`, `jsonItem`,
  `jsonItems`, `jsonInvalid`.
