## Listbox

A list of options to choose one or several from, always in view: the WAI listbox pattern, with groups, descriptions,
type-ahead and thousands of options. `DS.listbox` is also the list engine of the [Combobox](#combobox) and the
[Select panel](#select-panel). For a few plain values a native `<select>` or radios stay simpler.

```html
<span class="ds-field__label" id="device-label">Device</span>
<div class="ds-listbox" role="listbox" aria-labelledby="device-label" data-ds-listbox>
  <div class="ds-listbox__option" role="option" aria-selected="true" data-value="laptop-14">
    <span class="ds-listbox__name">Laptop 14</span>
    <span class="ds-listbox__description">For most desks: light, with a full day of battery.</span>
    <span class="ds-listbox__check" aria-hidden="true">[icon check 16]</span>
  </div>
  <div class="ds-listbox__group" role="group" aria-labelledby="desktops">
    <div class="ds-listbox__heading" id="desktops" role="presentation">Desktops</div>
    <div class="ds-listbox__option" role="option" aria-selected="false" data-value="mini">
      <span class="ds-listbox__name">Mini desktop</span><span class="ds-listbox__meta">Desktop, 2023</span>
      <span class="ds-listbox__check" aria-hidden="true">[icon check 16]</span>
    </div>
  </div>
</div>
```

Several values: `aria-multiselectable="true"` on the listbox. The `.ds-listbox__check` is then a box at the start that
fills in the primary colour and draws its check, as a checkbox does; with one value it is a check at the end of the
chosen option. The chosen options take the tint and the label weight too, so the choice never shows by colour alone.

```js
const devices = DS.listbox.create(list, {
  items: rows.map((row) => ({ value: row.id, label: row.name, meta: row.site, group: row.kind })),
  multiple: true,
});
devices.get();                                 // ['d-14', 'd-52']
devices.set(['d-14']);                         // from the page: no event
devices.on('change', ({ value }) => save(value));
devices.filter('lap 14');                      // shows the matches, marks the letters; returns how many
```

**Markup or data.** With `data-ds-listbox`, `DS.init()` takes the options of the markup (`role="option"`; the value is
`data-value`, else the name's text; `aria-selected="true"` the first choice, or `data-ds-value`, a value or a JSON list).
`DS.listbox.create(el, { items })` renders data instead, through `DS.dom.morphHtml`: strings, or objects with `value`,
`label`, `description`, `meta`, `group` and `disabled`; each rendered option carries its value in `data-value`. Groups follow in the order they first appear; give a data list
with groups a `div` as its listbox. From `DS.listbox.VIRTUAL_FROM` items on (100), or with `virtual: true`
(`data-ds-listbox-virtual`), only the options near the viewport exist (`DS.virtual`): the active one always does, and
each carries `aria-setsize` and `aria-posinset`. A windowed list has no group headings: put the group in the meta line.

| Option | Attribute | What |
|---|---|---|
| `items` | | data to render; without it the markup's options |
| `multiple` | `aria-multiselectable="true"` | several values |
| `value` | `data-ds-value` | the first value (else the options marked `aria-selected="true"`) |
| `virtual` | `data-ds-listbox-virtual` | `true`, `false`, or the number of items from which a data list is windowed |
| `name` | `data-ds-listbox-name` | hidden inputs of this name, after the listbox, carry the value in a form |
| `follow` | | one choice follows the active option (default on, as in a native `<select size>`) |
| `focus` | | the element that keeps the focus and `aria-activedescendant` (a combobox's field); default the listbox |
| `scroller` | | what scrolls, default the listbox |
| `prefix`, `check`, `render(item, name)`, `wrap`, `pinned(option)` | | for an engine user: the class block of the parts (default `ds-listbox`), the check mark, the inner markup of a data option (`name` with the matched letters marked), arrows that go round, a markup option that comes last whatever the query (`true`, or a function of the query and the number of matches: a "Create" option) |

**The controller** (`DS.listbox.create()`, or `DS.get(el)` of `data-ds-listbox`): `get()` (one value or `null`; several
as a list), `set(value)` (from the page, no event), `on('change', fn)`, `setItems(items)` (new data, the query kept),
`filter(text)`, `shown()` and `entries()` (`{ value, label, item, disabled, ... }`), `active()`, `activate(value |
'first' | 'last' | null)`, `move(step)`, `pick(value?)` (as a press would), `key(event)` (a key a field passes on; `true`
when it was the list's), `refresh()` (the page changed the markup's options) and `destroy()`. `ds:change`
(`{ value, item, selected }`) bubbles from the listbox when the user changed the choice.

**Matching.** `DS.listbox.fuzzy(query, text)` gives `{ score, ranges }` or `null`: every word of the query must be in
the text, as a substring (better at the start and at a word start; the whole text best) or as its letters in order;
case and accents do not count. `DS.listbox.filter(items, query, { label, limit })` returns the matches best first
(`{ item, index, score, ranges }`); `DS.listbox.highlight(text, ranges, className)` the text as escaped markup with the
ranges in `<mark class="ds-listbox__match">`. A filter keeps the order of a markup list and sorts a data list best
first; the matched letters take the label weight and an underline.

**Options** ([options.md](options.md)): classes on the listbox or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the listbox |
|---|---|---|---|
| Variant | `.ds-listbox--plain` | the listbox | no box and no height cap of its own, for a panel that has both |
| Size | `.ds-xs` ... `.ds-xl` | the listbox or a group | an option 24 to 56px (40px at md, 8px per step), the name's type role, the check box 2px per step |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | an option 4px less per step, its block padding 2px less; side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the box's radius and the check box's, times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | every option at least `--ds-touch-target` (48px) |
| Tone | none | | a listbox shows no status of its own |

**States.** `aria-disabled="true"` on an option draws it in the disabled ink and the keys pass it by; on the listbox it
blocks every option and the listbox leaves the tab order. `hidden` on an option hides it, and a group with none left goes
with its heading.

**Keyboard and names** (WAI listbox). The listbox is one tab stop; `aria-activedescendant` names the active option
(`data-active`). ArrowDown and ArrowUp move, Home and End go to the ends, PageDown and PageUp ten options, blocked options
are passed by. One value: the choice follows the active option. Several: Space toggles the active option, Shift with
ArrowDown or ArrowUp moves and toggles, Ctrl+A (Cmd+A) chooses every option that shows, or none when all are chosen, and
a Shift-click adds. Typing letters moves to the next option whose name starts with them (`--ds-delay-tooltip` between
letters). On focus the first chosen option is active, else the first one. Name the listbox with `aria-labelledby` (or
`aria-label`), a group with its heading.

**Forced colours.** The box keeps its border; a chosen option is `SelectedItem` / `SelectedItemText` (a `CanvasText`
ring inside while it is active), the active one has a `Highlight` outline while the listbox has the focus, a blocked one
`GrayText`; the check box keeps a `CanvasText` edge and fills with `SelectedItemText`.

**Hooks:** `--ds-listbox-option-height` (40px), `--ds-listbox-max-height` (264px, about six options; `none` shows them
all), `--ds-listbox-radius` (`--ds-radius-field`), `--ds-check-size` (the box of several values) and `--ds-scroll-fade`
(the cut edges, which `DS.dom.scrollEdges()` reports through `data-ds-edges`, `data-ds-overflow-start` and
`data-ds-overflow-end`) ([theming.md](theming.md#component-hooks)).

**Motion:** the active option's layer fades in over `--ds-dur-micro` and goes at once, so a held arrow key leaves no
trail; the check box fills over `--ds-dur-fast` while its check is drawn from left to right over `--ds-dur-medium`; the
end check of one value fades over `--ds-dur-fast`.

<!-- changelog -->
- Listbox (3.0): `.ds-listbox` with `DS.listbox` (`data-ds-listbox`): one or several values, groups, descriptions,
  type-ahead, data rendered and windowed through `DS.virtual`, fuzzy matching with marked letters
  (`DS.listbox.fuzzy`, `filter`, `highlight`); the list engine of the combobox and the select panel.
