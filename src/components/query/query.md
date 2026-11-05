## Query input

A search field whose filters become tokens, such as `status:open` or `priority:>2`, with suggestions for keys,
operators and values, saved queries and keyboard editing of the tokens. It sends a structured query.

```html
<div class="ds-query" data-ds-query data-ds-query-store="tickets" data-ds-query-name="q"
     data-ds-query-keys='[{ "key": "status", "label": "Status", "values": ["open", "pending", "closed"] },
                          { "key": "priority", "label": "Priority", "type": "number" },
                          { "key": "assignee", "label": "Assignee", "values": ["Ada Lovelace", "Grace Hopper"] }]'>
  <label class="ds-field__label" for="ticket-query">Filter tickets</label>
  <div class="ds-query__row">
    <div class="ds-combo ds-combo--multi ds-query__box">
      <span class="ds-query__icon" aria-hidden="true">[icon search 20]</span>
      <input class="ds-input ds-combo__input ds-query__input" id="ticket-query" placeholder="status:open printer">
      <button class="ds-combo__clear" type="button" hidden>[icon close 20]</button>
      <div class="ds-combo__popup" hidden>
        <div class="ds-combo__list"></div>
        <p class="ds-combo__status" role="status"></p>
      </div>
    </div>
    <button class="ds-btn ds-btn--icon ds-query__save" type="button" data-tip="Save this query">[icon bookmark 20]</button>
  </div>
</div>
```

```js
el.addEventListener('ds:change', ({ detail }) => loadTickets(detail.filters, detail.text));
const query = DS.get(el, 'query');           // or DS.query.create(el, { keys, values, store, name, value })
query.set('status:open assignee:"Ada Lovelace"');
query.get();   // { terms, filters: [{ key: 'status', op: 'is', values: ['open'] }, ...], text: '', invalid: [], value: '...' }
```

The parts are other components': the box is Combobox's box of several values (`.ds-combo--multi`), the list its
grouped list, a token an input chip of [Chips](#chips) (`.ds-chip--input`). The module writes the tokens into
`.ds-query__tokens` (a run without a box of its own, made when the markup has none), the list, the status line, the
names (`role="combobox"`, `aria-controls`, `aria-activedescendant`, the clear and save buttons' `aria-label` when the
markup has none) and, with `data-ds-query-name`, a hidden input with the text for a plain form.

- **The language.** `key:value`; several values `key:a,b` (any of them); quotes for spaces, `key:"two words"`; `-key:value`
  or `key:!value` for "is not"; `key:>3`, `key:>=3`, `key:<3`, `key:<=3` for keys that compare. The other words are
  the free text. `data-ds-query-keys` (JSON, or the option `keys`) names the keys: `key`, `label`, `description`, `type`
  (`text`, `number` or `date`: ISO dates), `values` (texts, or `{ value, label, description }`), `operators` (default `is`
  and `not`; numbers and dates all six) and `free` (a value outside `values` is fine). A filter of a key the page did not
  name, a value outside its list, a number or date that is none, or an operator its key does not take makes an
  **invalid token**: the error tone on the chip, the alert icon and the reason in its name and tooltip; it stays out of
  `filters`.
- **Suggestions.** Typing opens the list: the keys whose name or label fits (with the saved queries above them while the
  field is empty), then after `key:` the operators the key compares with and its values (what is typed narrows them;
  values already in the filter leave). Words that are no filter offer `Search for "printer"`. The status line counts
  the suggestions, or says that there are none. The option `values(key, typed)` may return a key's values, or a promise
  of them, as the person types (the list is `aria-busy` meanwhile; a late answer to an older text is dropped).
- **Tokens.** Choosing a value, Space after a complete filter, or Enter turns the typed text into tokens (free words join
  the free text there is, one phrase). A token reads `Status: open`, `Priority ≥ 2`, `Status ≠ closed`; its name says it
  in words ("Remove filter Priority at least 2"), its description how to edit it.
- **Saved queries.** `.ds-query__save` (`aria-disabled` while there are no tokens) asks for a name (`DS.overlay.prompt()`)
  and keeps the query in [DS.store](core.md#dsstore-remembered-preferences) (namespace `query`, the key
  `data-ds-query-store`; without it, for this page only). The list shows them while the field is empty: choosing one
  applies it, Delete on one removes it.
- **Events** on the `.ds-query`: `ds:change` with the query after every change of the tokens, `ds:submit` with it on
  Enter in the empty field, `ds:saved` (`{ name, value }`) after a save.

**JS API.** `DS.get(el, 'query')` or `DS.query.create(el, options)` return the controller: `get()` (the query:
`terms`, `filters`, `text`, `invalid`, `value`), `set(value)` (text or terms), `add(value)` (text, a term or terms;
returns whether any came of it), `remove(index)`, `clear()`, `setKeys(keys)`, `saved()`, `save(label)`,
`on(type, fn)` (`change`, `submit`, `saved`) and `destroy()`. `data-ds-value` is the first query. The helpers:
`DS.query.parse(text, keys)` (terms `{ key, op, values, invalid }`), `DS.query.stringify(terms)`,
`DS.query.toQuery(terms)` (the structured query) and `DS.query.suggest(typed, keys)` (what the list would offer).

**Options** ([options.md](options.md)): classes on the query or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the query or a container | the box, tokens, list and save button step themselves; the glyph's room 4px per step |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the box, tokens and options (Combobox, Chips) |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the box, tokens, list and button |
| Touch | `.ds-touch` | the theme or a container | box, tokens, options and the save button at least `--ds-touch-target` (48px) |
| Tone | none | | an invalid token takes the error tone with its icon and words |

**Keyboard and names.** The field is a combobox (the WAI pattern): ArrowDown and ArrowUp open the list and move the
active suggestion (`aria-activedescendant`), Enter takes it (a key goes into the field, a value or a saved query makes
tokens), Escape closes the list and then empties the field, Tab leaves it. Enter without an active suggestion turns the
text into tokens, and in the empty field sends `ds:submit`. Backspace in the empty field takes the last token back into
it to edit. ArrowLeft at the field's start moves to the tokens (`tabindex="-1"`: the field is the one tab stop): the
arrows, Home and End move, End and Escape go back to the field, Backspace removes and moves left, Delete removes and
moves right, F2 edits, and a press (Enter, Space, a click) removes, as on every input chip. Additions, removals, edits
and saved queries are spoken through the announcer ([DS.a11y](core.md#accessibility-helpers)). The field needs a label;
the list is named "Suggestions" unless the markup names it.

**Forced colours.** The box, list, tokens and button are their components': the box keeps its border and the focus
outline, the active option a `Highlight` outline, a token its edge; the glyph is `CanvasText`.

**Motion:** the list's ([Combobox](#combobox)): it grows out of the box on the spring and leaves with a fade. Tokens
come and go at once.

**Strings:** `queryIs`, `queryNot`, `queryGt`, `queryGte`, `queryLt`, `queryLte`, `queryOr`, `queryText`, `queryRemove`,
`queryTokenHint`, `queryUnknownKey`, `queryBadOp`, `queryBadValue`, `querySuggestions`, `queryKeys`, `queryOperators`,
`querySaved`, `querySearch`, `querySearchFor`, `queryOne`, `queryMany`, `queryNoMatch`, `queryUnknown`,
`querySavedHint`, `queryAdded`, `queryRemoved`, `queryEditing`, `queryCleared`, `queryApplied`, `queryClear`,
`querySave`, `querySaveTitle`, `querySaveName`, `querySaveConfirm`, `querySavedAs` and `querySavedRemoved`
([install.md](install.md#language-and-locale)).

<!-- changelog -->
- Query input (`.ds-query`, `DS.query`): filters as tokens (`key:value`, several values, quotes, `-key:` and `!`,
  `>`, `>=`, `<`, `<=`), suggestions for keys, operators and values (static or from `values()`), invalid tokens in the
  error tone with the reason, keyboard editing of the tokens, saved queries in `DS.store`, a hidden input and a
  structured query in `ds:change`; `parse()`, `stringify()`, `toQuery()`, `suggest()`.
