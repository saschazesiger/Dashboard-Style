## Tabs

Sections of one page or record. ARIA tabs show one panel at a time; link tabs move between pages of a record.

```html
<div class="ds-tabs" role="tablist" aria-label="Device">
  <button class="ds-tabs__tab" role="tab" type="button" id="t-details" aria-selected="true" aria-controls="p-details" data-label="Details">Details</button>
  <button class="ds-tabs__tab" role="tab" type="button" id="t-history" aria-selected="false" aria-controls="p-history" tabindex="-1" data-label="History">History<span class="ds-badge">3</span></button>
</div>
<div class="ds-tabs__panel" role="tabpanel" id="p-details" aria-labelledby="t-details" tabindex="0"> ... </div>
<div class="ds-tabs__panel" role="tabpanel" id="p-history" aria-labelledby="t-history" tabindex="0" hidden> ... </div>

<!-- link tabs -->
<nav class="ds-tabs" aria-label="Device">
  <a class="ds-tabs__tab" href="/devices/42" aria-current="page" data-label="Details">Details</a>
  <a class="ds-tabs__tab" href="/devices/42/history" data-label="History">History</a>
</nav>
```

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

- A row of `--ds-tabs-height` (48px) over a `--ds-line` hairline; labels in the label role at the regular weight in
  `--ds-text-2`. The selected tab takes `--ds-primary` ink, the label weight and the bar: a
  `--ds-tabs-indicator-height` (3px) bar in `--ds-tabs-indicator-color` (`--ds-primary`) at its bottom that glides
  between the tabs (`DS.indicator`, `.ds-tabs__indicator`). Selected is bar, weight and ARIA. `data-label` (the
  tab's text again) keeps the width of the heavier weight, so nothing moves; a `.ds-badge` after the text keeps its
  place.
- Press: the state layer is a pill inside the tab that turns squarer while pressed and springs back, with the ripple
  (`DS.ripple.attach()`); the keyboard ring is inset and snaps inward. `:disabled` and `aria-disabled="true"` take the
  disabled model (no hover, press or morph; `aria-disabled` keeps its focus layer).
- Switching: the page toggles `hidden` on the panels and enters the new one (`DS.motion.enter(panel, 'swap')`). Link
  tabs are navigation: `DS.motion.transition(update, { type: 'fade-through' })` ([Views](motion.md#views)).
- Overflow: the row scrolls sideways without a scrollbar (add `.ds-scroll-x` for its edge fades); `DS.dom.roving()`
  scrolls a focused tab into view, and `reveal: true` keeps the selected one in view.
- `.ds-tabs--fill`: equal widths across the row. `.ds-tabs--flush`: no hairline (the tabs sit on a card's edge).
- A panel that holds nothing focusable keeps `tabindex="0"`, so a keyboard reaches its content.
- Forced colours: the selected tab is `SelectedItem` / `SelectedItemText` (a choice in a set) and the bar is hidden;
  a focused selected tab keeps a `CanvasText` ring inside; blocked tabs are `GrayText`. Print wraps the row.

**Motion:** the "Tabs" row of [Navigation](motion.md#navigation) in motion.md.

