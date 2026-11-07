## Highlight

The hits of a search marked in a text: a list filtered by a search field, search results, a log. Each hit is a
`<mark class="ds-mark">`, matched ignoring case and accents.

```html
<input class="ds-input" type="search" aria-label="Search tickets" aria-controls="tickets">
<ul class="ds-list" id="tickets" data-ds-highlight="">...</ul>

<!-- marked by the server -->
<p>Replace the <mark class="ds-mark">toner</mark> on floor 2</p>
```

```js
search.addEventListener('input', () => DS.get(list, 'highlight').set(search.value));
```

`data-ds-highlight` holds the query: its words, each marked wherever it occurs, or the whole query as one with
`data-ds-highlight-mode="phrase"`. "cafe" finds "Café", and the mark covers what the text shows; hits that touch or
overlap are one mark. Only text is marked: never inside `<script>`, `<style>`, form fields, the page's own marks or
anything under `[data-ds-highlight-skip]`. A new query takes the old marks out first. A re-render of the container
with `DS.dom.morphHtml` is marked again before paint.

### JS API

- `DS.highlight.create(el, { query, mode })`: the controller the attribute path makes. `get()` gives
  `{ query, count }`, `set(query)` marks another query (empty: none; it writes `data-ds-highlight` when the element
  has it) and emits `ds:change` with `{ query, count }`, `on('change', fn)`, `update()`, `destroy()` takes every
  mark out.
- `DS.highlight.ranges(text, query, { mode })`: the hits alone, as `[start, end)` pairs.

### Options

Shape only: the mark's corners times `--ds-shape`. It takes the type of its text.

### Accessibility

A `<mark>`; some screen readers say "highlight" around it. The marks say nothing about how many matched: the page
announces the count where it matters (`DS.a11y.announce('3 tickets match')`), next to its search field. A mark is not a
status, so its colour needs no word.

### Forced colours

The system's `Mark` and `MarkText`. Printed, the background stays.

### Hooks

`--ds-mark-bg`, `--ds-mark-color`: see [theming.md](theming.md).

**Motion:** none: a hit that faded in would trail the typing.

<!-- changelog -->
- Highlight (new, `highlight`): `data-ds-highlight` marks the hits of a query in a container's text as `.ds-mark`
  (case and accents folded, words or `phrase` mode); `DS.highlight.create`, `ranges`; hooks `--ds-mark-bg`,
  `--ds-mark-color`.
