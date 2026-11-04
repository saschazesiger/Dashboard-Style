## Tabs

Sections of one page or record. ARIA tabs show one panel at a time; link tabs move between pages of a record.

```html
<div class="ds-tabs" role="tablist" aria-label="Device">
  <button class="ds-tabs__tab" role="tab" type="button" id="t-details" aria-selected="true" aria-controls="p-details" data-label="Details">Details</button>
  <button class="ds-tabs__tab" role="tab" type="button" id="t-history" aria-selected="false" aria-controls="p-history" tabindex="-1" data-label="History">History<span class="ds-tabs__count"><span class="ds-sr">, </span>3</span></button>
</div>
<div class="ds-tabs__panel" role="tabpanel" id="p-details" aria-labelledby="t-details" tabindex="0"> ... </div>
<div class="ds-tabs__panel" role="tabpanel" id="p-history" aria-labelledby="t-history" tabindex="0" hidden> ... </div>

<!-- link tabs -->
<nav class="ds-tabs" aria-label="Device">
  <a class="ds-tabs__tab" href="/devices/42" aria-current="page" data-label="Details">Details</a>
  <a class="ds-tabs__tab" href="/devices/42/history" data-label="History">History</a>
</nav>

<!-- a tray; the selected tab a surface pill -->
<div class="ds-tabs ds-tabs--contained" role="tablist" aria-label="Range"> ... </div>

<!-- a column beside its panels -->
<div class="ds-tabs__columns">
  <div class="ds-tabs ds-tabs--vertical" role="tablist" aria-orientation="vertical" aria-label="Settings"> ... </div>
  <div> panels </div>
</div>

<!-- a tab that closes: a wrapper, so the close button is no child of the tab -->
<span class="ds-tabs__item" role="none">
  <button class="ds-tabs__tab" role="tab" type="button" id="t-report" aria-selected="false" aria-controls="p-report" tabindex="-1" data-label="Report">Report</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs ds-tabs__close" type="button" tabindex="-1" aria-label="Close Report" data-tip="Close">[icon close 16]</button>
</span>
```

**Options** ([options.md](options.md)): classes on the row or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `--line` (default), `--contained`; `--vertical`, `--fill`, `--flush` | the row | the look; `--vertical` combines with either look, `--fill` and `--flush` with a row |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the row or a group | 32, 40, 48, 56, 64px high (8px per step), side padding 8 to 24px (4px per step), the size's type role at the regular weight (the selected tab alone takes the label weight) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (48, 44, 40, 36px at md); side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | multiplies the ring's radius, the state layer's (rest and pressed) and the contained tray's and pill's |
| Touch | `.ds-touch` | the theme or a container | a tab is at least `--ds-touch-target` (48px) high whatever the size and density; so is the close button, and the tab keeps room for it |
| Tone | none | | a tab states no status; a word or a `.ds-badge` in it may |

```js
DS.indicator.createIndicator(tabs, { active: '[aria-selected="true"], [aria-current="page"]', className: 'ds-tabs__indicator', reveal: true });
DS.dom.roving(tabs);                                   // arrow keys, Home and End move focus and select
tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (!tab || tab.getAttribute('aria-disabled') === 'true') return;
  for (const other of tabs.querySelectorAll('[role="tab"]')) {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
  }
  DS.motion.enter(document.getElementById(tab.getAttribute('aria-controls')), 'swap');
});
```

- A row of `--ds-tabs-height` (48px at size md and comfortable) over a `--ds-line` hairline (`.ds-tabs--line` names this
  look explicitly); labels in the size's role (`--ds-tabs-font`) at the regular weight in `--ds-text-2`, side padding
  `--ds-tabs-padding-x`. The selected tab takes `--ds-primary` ink, the label weight and the bar: a
  `--ds-tabs-indicator-height` (3px) bar in `--ds-tabs-indicator-color` (`--ds-primary`) at its bottom that glides
  between the tabs (`DS.indicator`, `.ds-tabs__indicator`). Selected is bar, weight and ARIA. `data-label` (the
  tab's text again) keeps the width of the heavier weight, so nothing moves; an icon before the text, a
  `.ds-tabs__count` or a `.ds-badge` after it keeps its place.
- `.ds-tabs--contained`: a tray (`--ds-tabs-contained-bg`, `--ds-surface-high`) as wide as its tabs, the selected tab a
  pill of `--ds-surface` that glides inside it (the same indicator). The tab gives up the tray's padding, so the row is
  as high as a line row. Selected is pill, ink, weight and ARIA.
- `.ds-tabs--vertical`: a column with the hairline and the bar at its end, labels at its start (with `--contained` a
  tall tray). Set `aria-orientation="vertical"` and call `DS.dom.roving(tabs, { orientation: 'vertical' })`.
  `.ds-tabs__columns` lays it out beside the panels, and over them at 600px of the content.
- `.ds-tabs__count`: a count after the label (tabular figures, the meta role, the tab's colour). A `.ds-sr` separator
  reads it with the label ("History, 3"). A `.ds-badge` is for news that needs the eye.
- A tab that closes: `.ds-tabs__item` (`role="none"`) holds the tab and a `.ds-tabs__close`, a quiet extra-small icon
  button lying over the tab's end; the tab keeps room for it, also under `.ds-touch`. The page removes the tab and its
  panel, selects a neighbour and moves focus to it. In a tablist the button is `tabindex="-1"`: the tab keeps one stop
  for the row, Delete on the tab closes it, and a screen reader's browse mode still finds the button by its name.
- Press: the state layer is a pill inside the tab that turns squarer while pressed and springs back, with the ripple
  (`DS.ripple.attach()`); the keyboard ring is inset and snaps inward. `:disabled` and `aria-disabled="true"` take the
  disabled model (no hover, press or morph; `aria-disabled` keeps its focus layer).
- Switching: the page toggles `hidden` on the panels and enters the new one (`DS.motion.enter(panel, 'swap')`). Link
  tabs are navigation: `DS.motion.transition(update, { type: 'fade-through' })` ([Views](motion.md#views)).
- Overflow: the row scrolls sideways without a scrollbar (add `.ds-scroll-x` for its edge fades); `DS.dom.roving()`
  scrolls a focused tab into view, and `reveal: true` keeps the selected one in view.
- `.ds-tabs--fill`: equal widths across the row. `.ds-tabs--flush`: no hairline (the tabs sit on a card's edge).
- A panel that holds nothing focusable keeps `tabindex="0"`, so a keyboard reaches its content.
- Keyboard: ARIA tabs are one tab stop (`DS.dom.roving()`): Left and Right (Up and Down in a vertical row), Home and End
  move and select, a disabled tab is skipped, an `aria-disabled` one takes the focus and keeps its panel; Tab goes on to
  the panel. Link tabs keep a stop per link. Names: the row's `aria-label`, `aria-controls` and `aria-labelledby` between
  tab and panel, `aria-current="page"` on the current link.
- Forced colours: the selected tab is `SelectedItem` / `SelectedItemText` (a choice in a set) and the indicator is
  hidden; a focused selected tab keeps a `CanvasText` ring inside; blocked tabs are `GrayText`; the contained tray keeps
  a `CanvasText` edge. Print wraps the row.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the "Tabs" row of [Navigation](motion.md#navigation) in motion.md. The contained pill and the vertical bar
glide like the bar.

<!-- changelog -->
- Tabs (3.0): on the options model (size, density, shape, touch through `--ds-target-min`). Added `.ds-tabs--line`,
  `.ds-tabs--contained`, `.ds-tabs--vertical`, `.ds-tabs__columns`, `.ds-tabs__count`, `.ds-tabs__item` with
  `.ds-tabs__close`, and the hooks `--ds-tabs-padding-x`, `--ds-tabs-font`, `--ds-tabs-contained-bg`. Icons before the
  label keep `data-label`'s reserved width under the text.

