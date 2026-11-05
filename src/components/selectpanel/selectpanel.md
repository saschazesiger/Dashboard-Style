## Select panel

A button that opens a popover with a filter, a list of options to check and an apply foot: labels, assignees, filters
of a table. Nothing changes until Apply, so a long pick is one decision. The list is a [Listbox](#listbox) and
`DS.listbox` its engine; for a value typed into a form field use the [Combobox](#combobox).

```html
<div class="ds-selectpanel" data-ds-selectpanel>
  <button class="ds-btn ds-btn--outlined ds-selectpanel__trigger" type="button">
    [icon tag 20]Labels <span class="ds-selectpanel__summary"></span>[icon chevronDown 20]
  </button>
  <div class="ds-selectpanel__panel" role="dialog" aria-label="Labels" hidden>
    <div class="ds-selectpanel__head">
      <input class="ds-input ds-selectpanel__search" type="search" aria-label="Filter labels" placeholder="Filter labels">
    </div>
    <div class="ds-listbox ds-listbox--plain ds-selectpanel__list" role="listbox" aria-multiselectable="true" aria-label="Labels">
      <div class="ds-listbox__option" role="option" aria-selected="false" data-value="bug">
        <span class="ds-listbox__check" aria-hidden="true">[icon check 16]</span><span class="ds-listbox__name">Bug</span>
      </div>
    </div>
    <p class="ds-selectpanel__status" role="status"></p>
    <div class="ds-selectpanel__foot">
      <button class="ds-btn ds-btn--text" type="button" data-ds-selectpanel-clear>Clear</button>
      <button class="ds-btn ds-btn--filled" type="button" data-ds-selectpanel-apply>Apply</button>
    </div>
  </div>
</div>
```

```js
const labels = DS.selectpanel.create(el, { items: rows.map((row) => ({ value: row.id, label: row.name, meta: row.count })) });
labels.get();                                   // ['bug', 'docs']
labels.set(['bug']);                            // from the page: no event
labels.on('change', ({ value }) => filterTable(value));
DS.selectpanel.open(el);  DS.selectpanel.close(el, { commit: true });
```

- **Open and close** through `DS.overlay`: the button opens and closes the panel (and ArrowDown or ArrowUp on it opens
  it); Escape closes it, the first Escape in a filled filter clears the filter instead; the focus goes back to the
  button. Where the top layer and anchor positioning exist the panel opens as `popover="manual"` (`data-anchored`),
  so no scrolling box clips it, below the button or above it (`data-placement="top"`), never taller than the room on
  that side; elsewhere it stands under the button inside its boxes (`DS.position`).
- **Pending until Apply** (`data-ds-selectpanel-apply`): Escape, a press outside and the focus leaving the panel
  discard what changed since it opened; Apply (or Ctrl+Enter, Cmd+Enter) applies it, closes the panel, sends
  `ds:change` (`{ value }`) and announces the summary. `data-ds-selectpanel-clear` unchecks every option (pending).
  Without an Apply button each change applies at once; one value (no `aria-multiselectable`) applies and closes on the
  choice.
- **Filter.** `.ds-selectpanel__search` keeps the focus while the arrows move the active option
  (`aria-activedescendant`); Enter checks or unchecks it. It matches with `DS.listbox.fuzzy()` and marks the letters;
  `.ds-selectpanel__status` says "No results" (the module makes one when the markup has none). Without a filter the
  list itself is the tab stop with the keys of a listbox.
- **Summary.** `.ds-selectpanel__summary` in the button says what is applied: one or two names ("Bug and Docs"), else
  "3 selected", or "All selected" (`DS.selectpanel.summarize(names, total)`); nothing with none.
- **Data and value** as `DS.listbox`: the markup's options, or `items` (windowed from `DS.listbox.VIRTUAL_FROM`,
  `data-ds-selectpanel-virtual`); `data-ds-value` (a JSON list) or `value`, else the options marked
  `aria-selected="true"`; `data-ds-selectpanel-name` (`name`) writes hidden inputs of the applied value for a form.

The controller (`DS.selectpanel.create(el, options)`, or `DS.get(el)` of `data-ds-selectpanel`): `get()`, `set(value)`
(no event), `on('change', fn)`, `setItems(items)`, `open()`, `close(commit)`, `list` (the engine) and `destroy()`.
`DS.selectpanel.open(el)` and `DS.selectpanel.close(el, { commit })` do the same from outside.

**Options** ([options.md](options.md)): classes on the `.ds-selectpanel` or any ancestor; the panel inherits them
through the DOM, also in the top layer.

| Option | Classes | Where it applies | Effect on the select panel |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the select panel or any ancestor | the button (a `.ds-btn`) and the options (listbox options, 8px per step) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the options 4px less per step, head and foot padding 2px less |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the panel's radius; the button's pill as every action |
| Touch | `.ds-touch` | the theme or a container | the button and every option at least `--ds-touch-target` (48px) |
| Tone | none | | a select panel shows no status of its own |

**Keyboard and names.** The button says `aria-haspopup="dialog"`, `aria-controls` and `aria-expanded`; name the panel
(`role="dialog"`, `aria-label`) and the list. Tab moves from the filter to Clear and Apply; leaving the panel discards.
A chosen option shows by the check, the tint and the label weight.

**Forced colours.** The panel keeps a transparent outline that becomes its edge; the options are the listbox's.

**Hooks:** `--ds-selectpanel-width` (320px), `--ds-selectpanel-list-max-height` (320px), `--ds-selectpanel-radius`
(`--ds-radius-xs`) ([theming.md](theming.md#component-hooks)).

**Motion:** the panel grows from the button as a menu does: its clip opens and it scales on `--ds-ease-spatial` over
`--ds-dur-medium` while it fades in over `--ds-dur-fast`; it leaves with a fade in `--ds-dur-instant`, and a close
mid-way turns back from where it is.

<!-- changelog -->
- Select panel (3.0): `.ds-selectpanel` with `DS.selectpanel` (`create`, `open`, `close`, `summarize`;
  `data-ds-selectpanel`): a popover through `DS.overlay` with a filter, a listbox to check and an apply foot; pending
  until Apply, discarded by Escape or a press outside; the button's summary; anchored in the top layer where the engine
  can.
