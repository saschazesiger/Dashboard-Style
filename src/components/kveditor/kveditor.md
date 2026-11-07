## Key-value editor

Pairs of a key and a value (environment variables, labels, request headers): add and remove rows, paste `KEY=value`
lines, a warning on a key that comes twice, secret values hidden until revealed, and the whole as an object.

```html
<fieldset class="ds-kveditor ds-kveditor--code" data-ds-kveditor data-ds-kveditor-name="env"
          data-ds-kveditor-secret="TOKEN|SECRET|PASSWORD"
          data-ds-value='{"API_URL":"https://api.example.test","API_TOKEN":"s3cr3t"}'>
  <legend class="ds-fieldset__legend">Environment variables</legend>
  <div class="ds-kveditor__head" aria-hidden="true"><span>Key</span><span>Value</span></div>
  <ul class="ds-kveditor__rows"></ul>
  <div class="ds-kveditor__foot">
    <button class="ds-btn ds-btn--text ds-kveditor__add" type="button">[icon plus 18] Add variable</button>
  </div>
</fieldset>
```

```js
const editor = DS.get(el, 'kveditor');               // or DS.kveditor.create(el, { value, secret: /TOKEN/i })
el.addEventListener('ds:change', ({ detail }) => save(detail.value));   // { rows, value, duplicates }
editor.toObject();                                   // { API_URL: 'https://api.example.test', API_TOKEN: 's3cr3t' }
```

The rows are the module's: `li.ds-kveditor__row` with a `.ds-kveditor__key` field, the value in `.ds-kveditor__value`
(its field `.ds-kveditor__input`), a `.ds-kveditor__remove` icon button and a `.ds-kveditor__hint` under them. The page
gives the frame: a `<fieldset>` with a legend names the group and disables every field at once; the column labels
`.ds-kveditor__head` (hidden from screen readers, the fields have names of their own); the `.ds-kveditor__rows` list;
and a `.ds-kveditor__foot` with its `.ds-kveditor__add` button (made, "Add row", when the markup has none).

- **The value.** `data-ds-value` (JSON: an object, or a list of `{ key, value, secret }`; KEY=value text also reads) at
  the start; `set(value)` from the page. With `data-ds-kveditor-name` a hidden input of that name carries the object as
  JSON, or KEY=value lines with `data-ds-kveditor-format="env"`, so a plain form submits it.
- **Add and remove.** Add appends an empty row and focuses its key; Remove takes a row out on `DS.motion.flip()` (the
  others glide) and says so. Focus moves to the next row's Remove, else the one before, else Add.
- **Paste.** Pasting text with `KEY=value` lines into a key, or several such lines into a value, fills that row (when
  empty) and adds the others after it, as `DS.kveditor.parse()` reads them: blank lines and `#` comments skipped,
  `export ` dropped, quotes and escapes read as a `.env` file has them. "Pasted 4 rows" is spoken. Into a value, text
  whose lines do not all assign (a certificate, a JSON document) is not split: it stays that value, as the field takes
  it.
- **Duplicates.** A key that comes twice gives every row of it `data-status="warning"`: the key takes the warning edge
  and the hint says which rows share it, with an icon ("API_URL is also on row 3: the last one counts"), named in the
  key's `aria-describedby`. A value without a key warns too. Warnings never block: `toObject()` keeps the last row of a
  key.
- **Secrets.** A row whose key matches `data-ds-kveditor-secret` (a pattern, case-insensitive), or one given with
  `secret: true`, masks its value (`type="password"`) inside an [input group](#form) with a reveal button
  (`.ds-kveditor__reveal`, `aria-pressed`, "Show the value of API_TOKEN"). The secret stays in the page's memory as
  typed: masking hides it from onlookers, not from scripts.
- **Keys.** Enter in a key goes to its value; Enter in a value goes to the next row's key, or adds a row after the last
  one when it has a key. Tab goes through key, value, reveal and Remove of each row.

**JS API.** `DS.get(el, 'kveditor')` or `DS.kveditor.create(el, { value, name, format, secret })` (the options win
over the attributes) return the controller: `get()` (the rows `{ key, value, secret }`), `set(value)`,
`add(row, index)` (returns the new row element), `remove(index)`, `toObject()`, `toText()` (KEY=value lines),
`on('change', fn)` and `destroy()`. `ds:change` on the editor carries `{ rows, value, duplicates }` after every edit.

The helpers: `DS.kveditor.parse(text)` (KEY=value lines as rows), `DS.kveditor.stringify(rows)` (rows as lines,
quoting values with blanks, quotes, `#` or line breaks), `DS.kveditor.duplicates(rows)` (a `Map` of each key that comes
more than once to its row indices) and `DS.kveditor.toObject(rows)` (the last row of a key wins, rows without a key
left out).

**Options** ([options.md](options.md)): classes on the editor or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-kveditor--code` | the editor | keys and values in the monospace family (`--ds-font-mono`), at the field's size |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the editor or a group | the fields and buttons step themselves ([Form](#form), [Button](#button)) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the room between rows and inside a row 2px less per step (never under 4px); the fields 4px per step |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the fields and buttons follow |
| Touch | `.ds-touch` | the theme or a container | fields and buttons at least `--ds-touch-target` (48px) |
| Tone | none | | a warning is `data-status`, with its icon and words |

**Narrow.** Under 480px of the editor (a container query) the key and Remove share the first line, the value takes the
second, a hairline parts the rows and the column labels go.

**Keyboard and names.** A `<fieldset>` with its legend names the group. Each field has a name with its row: "Key, row
2", "Value of API_URL"; Remove and reveal name the key they act on. Additions, removals and pastes are spoken through
the announcer ([DS.a11y](core.md#accessibility-helpers)); a warning is in the key's description, read when it takes
focus.

**Forced colours.** A warning key keeps a 2px `CanvasText` edge, the hint its icon and words; fields and buttons are
Form's and Button's.

**Hooks:** `--ds-kveditor-key-width` (2fr: the key's share beside the value's 3fr), `--ds-kveditor-gap`
(`--ds-space-2`); the hint reads `--ds-field-warning-color` ([theming.md](theming.md#component-hooks)). The attributes
`data-status` and `data-secret` on a row are the module's.

**Motion:** rows come and go through `DS.motion.flip()` (a new row fades in over `--ds-dur-fast`, the others glide);
a hint fades in (`ds-fade-in`, `--ds-dur-fast`).

**Strings:** `kvAdd`, `kvKeyLabel`, `kvValueLabel`, `kvValueOf`, `kvRemove`, `kvRemoveRow`, `kvShow`, `kvShowRow`,
`kvDuplicate`, `kvNoKey`, `kvRemoved`, `kvRemovedRow`, `kvPasted` and `remove` ([install.md](install.md#language-and-locale)).

<!-- changelog -->
- Key-value editor (`.ds-kveditor`, `DS.kveditor`): rows of a key and a value with add and remove, paste of
  `KEY=value` lines, a warning on duplicate keys, secret values with reveal, a hidden input for plain forms and
  `toObject()`; the helpers `parse()`, `stringify()`, `duplicates()` and `toObject()`.
