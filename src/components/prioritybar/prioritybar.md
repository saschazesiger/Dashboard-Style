## Priority action bar

A row of actions that stays on one line at any width: the least important ones fold into a "More" menu when the bar
is too narrow for all of them, and come back when there is room. The menu holds the same commands.

```html
<div class="ds-priority-bar" role="toolbar" aria-label="Ticket actions" data-ds-prioritybar>
  <button class="ds-btn ds-btn--quiet" type="button" data-ds-priority="2">[icon pencil 16]Edit</button>
  <button class="ds-btn ds-btn--quiet" type="button" data-ds-priority="1">[icon userPlus 16]Assign</button>
  <button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false" data-ds-toggle>[icon bellOff 16]Mute</button>
  <button class="ds-btn ds-btn--quiet" type="button">[icon archive 16]Archive</button>
  <button class="ds-btn ds-btn--quiet" type="button">[icon trash 16]Delete</button>
</div>

```

| Class or attribute | What |
|---|---|
| `.ds-priority-bar` | the row: one line, no wrap. It takes the width its parent gives (a block, or a flex item that grows: `flex: 1 1 auto` is its own) and never the width of its actions (`contain: inline-size`), so folding never resizes it; it is as high as an icon button, so More never changes its height |
| `.ds-priority-bar--end` | the actions sit at the end: in a head row (a flex row) the title takes the room it needs and the bar grows into the rest |
| `.ds-priority-bar__more` | the More button: a quiet icon button (`moreHorizontal`, named "More actions", string `moreActions`) the module adds, or the bar's own child with this class; always the last item, shown only while something is folded |
| `.ds-priority-bar__menu` | its menu (a `.ds-menu`, added the same way, or the bar's own child with this class), at least `--ds-priority-bar-menu-width` wide |
| `data-ds-priority` | on an action: a number (default 0). The lower folds first; among equals the last one first |
| `data-ds-folded` | on a folded action (and on More while nothing is folded), written by the system: not displayed |

The actions are the bar's `.ds-btn` children (buttons and links) in any look; quiet ones are usual in a toolbar. Any
other child (a divider, a search field) never folds and keeps its room. An action the page hides (`hidden`) is left out.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Alignment | `.ds-priority-bar--end` | the bar | the actions at the end |
| Size | `.ds-xs` ... `.ds-xl` | the bar or any ancestor | the actions' height, padding and type; the bar's height |
| Density | `.ds-density-*` | any container | the actions' height; the gap, 1px less per step (4px to 1px) |
| Shape | `.ds-shape-*` | any container | the actions' radius |
| Touch | `.ds-touch` | the theme or a container | every action and More at least `--ds-touch-target` |

No tone: the bar has no status; a destructive action keeps its word and icon in the bar and in the menu.

### Behaviour: `data-ds-prioritybar`

The bar measures on every change of its width (`ResizeObserver`), of its content (`MutationObserver`: an action added,
hidden or relabelled) and once the fonts are ready. It shows every action that fits and folds the rest: actions fold by
priority, the More button appears at the end. Nothing animates: an action folds and unfolds at once. `ds:change`
(`{ folded }`, the folded actions) goes out on the bar when the folded set changes.

The menu lists the folded actions in the bar's order and is built each time it opens, so it shows them as they are: the
action's label (`aria-label`, else `.ds-btn__label`, else its text) and its first icon; a toggle (`aria-pressed`) as a
`menuitemcheckbox` with its check; a disabled, `aria-disabled` or busy one as an `aria-disabled` item. Picking an item
clicks the action it stands for, so the page's handlers run as for a press in the bar. An action that opens its own
menu or dialog should keep a high priority. The More button and the menu the module adds carry `data-ds-keep`, so a
re-render of the bar with `DS.dom.morphHtml` keeps them.

### JS API

```js
const bar = DS.prioritybar.create(element);       // the controller data-ds-prioritybar makes
bar.get();                                         // the folded actions
bar.update();                                      // measure again (the observers do it by themselves)
bar.on('change', ({ folded }) => { /* also a bubbling ds:change on the bar */ });
bar.more;  bar.menu;
DS.prioritybar.plan({ widths: [80, 96, 72], priorities: [2, 0, 0], available: 200, gap: 4, more: 40 });  // [1, 2]
```

`DS.prioritybar.create(bar)` returns the controller (`get`, `update`, `on('change')`, `destroy`, which unfolds every
action and removes what the module added); `DS.prioritybar.plan(input)` is the pure rule behind the fold.

### Accessibility

- A `role="toolbar"` bar with an `aria-label` is one tab stop ([`DS.a11y.roving`](core.md)): ArrowLeft and ArrowRight
  move between the shown actions and More, Home and End to the ends; a bar without the role leaves every action in
  the Tab order. A focused action that folds hands its focus to More.
- More is a [menu button](#menu-button): Enter, Space or ArrowDown open the menu on its first item, ArrowUp on its
  last; the menu's arrows, Home, End and type-ahead; Escape closes it and focus returns to More.
- A folded action is not displayed, so it is out of the accessibility tree; its menu item carries the same name and
  state. Toggles stay `aria-checked` in the menu, never the colour alone.
- Forced colours: the buttons' and the menu's system colours.

### Hooks

`--ds-priority-bar-gap` (the gap at the comfortable density), `--ds-priority-bar-menu-width` (the menu's least width);
the bar's height reads `--ds-btn-icon-size`.

**Motion:** none of its own: a fold is a layout change, so it happens at once. The menu grows out of More
([Menu](#menu)).

<!-- changelog -->
- Priority action bar (3.0): `DS.prioritybar` (`data-ds-prioritybar`, `data-ds-priority`, `create`, `plan`; the More
  button and its menu built when the markup has none), `.ds-priority-bar`, `.ds-priority-bar--end`,
  `.ds-priority-bar__more`, `.ds-priority-bar__menu`, `data-ds-folded`; hooks `--ds-priority-bar-gap` and
  `--ds-priority-bar-menu-width`. String `moreActions`.
