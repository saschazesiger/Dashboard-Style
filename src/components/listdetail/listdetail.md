## List-detail layout

A list, the detail of what is picked in it and, optionally, a sub-detail (a related record, a log line, a reply), as
columns that fold to fewer as the layout narrows, down to one with a back button on a phone:

```html
<div class="ds-listdetail" data-ds-listdetail="list" role="group" aria-label="Devices">
  <section class="ds-listdetail__list" aria-labelledby="ld-list">
    <header class="ds-listdetail__head"><h2 class="ds-listdetail__title" id="ld-list">Devices</h2></header>
    <ul class="ds-list ds-list--interactive">
      <li class="ds-list__item"> ... <a class="ds-list__action" href="#d42" data-ds-listdetail-show="detail">LAPTOP-0042</a> ... </li>
    </ul>
  </section>
  <section class="ds-listdetail__detail" aria-labelledby="ld-detail">
    <header class="ds-listdetail__head">
      <button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__back" type="button" aria-label="Back to devices">[icon arrowLeft 20]</button>
      <h2 class="ds-listdetail__title" id="ld-detail">LAPTOP-0042</h2>
    </header>
    <div class="ds-listdetail__body"> ... <button class="ds-btn" type="button" data-ds-listdetail-show="sub">Ticket #42</button></div>
  </section>
  <section class="ds-listdetail__sub" aria-labelledby="ld-sub">
    <header class="ds-listdetail__head">
      <button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__back" type="button" aria-label="Back to LAPTOP-0042">[icon arrowLeft 20]</button>
      <h2 class="ds-listdetail__title" id="ld-sub">Ticket #42</h2>
      <button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__close" type="button" aria-label="Close the ticket">[icon close 20]</button>
    </header>
    <div class="ds-listdetail__body"> ... </div>
  </section>
</div>
```

| Part | What |
|---|---|
| `.ds-listdetail` | the layout: a row of columns of `--ds-listdetail-height` (100%); it folds by its own width (measured by the script), also inside a sheet or a card |
| `.ds-listdetail__list` | the list column, `--ds-listdetail-list-width` (320px) beside the detail |
| `.ds-listdetail__detail` | the detail: takes the rest, at least `--ds-listdetail-detail-min` (400px) beside another column; while nothing is picked it holds the page's empty state (an [empty state](#empty-state)) |
| `.ds-listdetail__sub` | optional: the sub-detail, `--ds-listdetail-sub-width` (360px), shown only at the sub level |
| `.ds-listdetail__head` | a column's header row, sticky at its top: a back button, the title, actions at the end |
| `.ds-listdetail__title` | the column's title on one line with an ellipsis; where the focus lands when the column comes |
| `.ds-listdetail__body` | padded content of a column |
| `.ds-listdetail__back` | up one level; shown only while the column before it is hidden (a phone; the detail while the sub-detail pushes the list out) |
| `.ds-listdetail__close` | up one level as well; shown only while the column before it shows (the sub-detail beside its detail) |

A `.ds-list` right in a column loses its frame and runs to the column's edges.

**What shows.** The level (`list`, `detail`, `sub`) and the layout's own width decide. The script measures the width
(no size container, which would re-anchor the popups inside) and writes `data-columns` (1, 2, 3) and `data-shown` (the
levels that show); the columns fit by `--ds-listdetail-list-width` + `--ds-listdetail-detail-min` (720px) and that plus
`--ds-listdetail-sub-width` (1080px), read in px or rem:

| Width of the layout | `list` | `detail` | `sub` |
|---|---|---|---|
| under 720px: one column | the list | the detail, with its back button | the sub-detail, with its back button |
| 720px to 1080px: two | the list and the detail | the list and the detail | the detail (with its back button) and the sub-detail (with its close button) |
| 1080px and more: three | the list and the detail | the list and the detail | all three |

Before the script runs, a window under 720px shows the list alone (or the level `data-ds-listdetail` names), a wider
one the list and the detail.

**Options** ([options.md](options.md)): classes on the layout or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-listdetail--outlined` | the layout | the hairline frame and `--ds-listdetail-radius` (`--ds-radius-card`) on `--ds-surface`; without it the layout fills its place (the content panel) with hairlines between its columns |
| Density | `.ds-density-*` | any container | the head's height (56px at the comfortable density, 4px per step) and the padding of the head and the body (2px per step) |
| Shape | `.ds-shape-*` | any container or the theme | the frame of `--outlined` |
| Touch | `.ds-touch` | any container | the head at least the touch target high |
| Size, tone | | | not read: it is a layout; a size class reaches the controls in it |

**Behaviour** (`data-ds-listdetail`, `DS.init()`):

- `data-ds-listdetail` holds the page's level: its value at the start (`list` when empty or unknown; `detail` and `sub`
  only when their column exists), and a later change of it (a re-render through `DS.dom.morphHtml`) sets the level.
  The system writes the level it shows as `data-state`, the way it got there as `data-direction` (`forward`, `back`),
  and `data-columns` and `data-shown` as above.
- A click on `[data-ds-listdetail-show="detail"]` (or `"sub"`, `"list"`) goes to that level, after the page's own click
  handlers (one delegated listener per root of `DS.init()`), which render what it shows; it goes also when a router
  called `preventDefault()` on the link. `.ds-listdetail__back` and `.ds-listdetail__close` go up one level from their
  column. A back or close button without a name gets `t('back')` or `t('close')`.
- The page owns what is picked: mark the open row (`aria-current="true"` on its `.ds-list__action`), render the record,
  and tie the levels to its routes (`ds:change`, `set()` on `popstate`) so the browser's back button works on a phone.

**JS API.** The attribute path makes the controller (`DS.core.get(el, 'listdetail')`); from the page:

```js
const layout = DS.listdetail.create(el, { level: 'list' });
layout.set('detail', { opener: row });   // after rendering the record; the focus comes back to `opener`
layout.back();                           // up one level; back('sub'): up from that level
layout.get();                            // 'detail'
layout.visible();                        // ['list', 'detail'] at this width
DS.listdetail.arrange(900, 'sub');       // { columns: 2, shown: ['detail', 'sub'] }
layout.on('change', ({ level, previous }) => { /* also a bubbling ds:change on the layout */ });
DS.listdetail.level('sub', ['list', 'detail']);   // 'list': no sub-detail column
DS.listdetail.parent('sub');                      // 'detail'
```

`DS.listdetail.create` returns the controller (`get`, `set`, `back`, `visible`, `on`, `update`, `destroy`); its
triggers need `DS.init()`, or call `set()` and `back()`. `set(level, { animate: false, focus: false })` changes the level
without the entrance or the focus move. `DS.listdetail.arrange`, `DS.listdetail.level` and `DS.listdetail.parent` are the
pure functions behind it.

**Accessibility.** Name the layout (`role="group"` with `aria-label`: a plain `div` takes no name) and each column
(`aria-label`, or `aria-labelledby` to its title). The focus moves only when the column that held it is no longer shown
or the focused control hid (the close button just pressed, the detail's back button once the list is back), so on a
wide layout it stays in the list while the detail changes: going deeper it lands on the new column's title (given
`tabindex="-1"`), which a screen reader reads; going back on the trigger that opened the level below the one it lands
on (the row picked last). A resize that hides the focused column or control moves the focus the same way. The back button is a real button with a name ("Back to devices"); hidden buttons are `display: none`, so they are
no tab stop. Hidden columns are out of the tab order and the accessibility tree.

**Forced colours.** The hairlines and the frame are borders, so they stay; the buttons are the system's.

**Hooks:** `--ds-listdetail-height`, `--ds-listdetail-list-width`, `--ds-listdetail-detail-min`,
`--ds-listdetail-sub-width`,
`--ds-listdetail-line`, `--ds-listdetail-radius`, `--ds-listdetail-head-height`, `--ds-listdetail-padding`
([theming.md](theming.md#component-hooks)).

**Motion.** A column that comes into view by a change of level slides in and fades (`DS.motion.enter(column, 'slide')`:
`ds-shift-in` over `--ds-dur-slow` on `--ds-ease-spatial` with `ds-fade-in`), from the end going deeper and from the
start going back (`data-direction="back"` turns `--ds-motion-distance` round); the column that goes is gone at once.
Nothing plays at the start or when the layout folds by a resize.
