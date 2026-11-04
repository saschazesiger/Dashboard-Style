# Core: runtime, behaviours and `init()`

`js/core.js` (`DS.core` in `ds.js`) is the first module of the system; every other module imports from it. It holds
the one runtime a page shares, the registry of behaviours, declarative initialisation, the `ds:` events and the
system's own strings.

```js
DS.init(document);                             // every behaviour on the page, now and for later markup
DS.config({ strings: { close: 'Schliessen' } });
```

`DS.init`, `DS.get`, `DS.define` and `DS.config` are `DS.core.init`, `DS.core.get`, `DS.core.define` and
`DS.core.config` at the top level of `window.DS` (`ds.js` and every classic bundle). An ES module project imports
them from `js/core.js`.

| Export | What |
|---|---|
| `runtime` | the page's one runtime (`globalThis.DashboardStyle.runtime`); `runtime.state(name, init)` returns the shared state `name`, made by `init()` (a function, or the value itself) the first time any copy asks |
| `define(name, spec)` | adds the behaviour `name` (below); returns `true`, or `false` when a copy loaded earlier defined the name (that copy's definition stays) |
| `init(root?, { observe })` | installs every global behaviour on `root` (default: the document) and initialises every matching element in it; `observe` (default `true`) keeps doing so for markup added, changed or removed later. Returns `{ destroy() }` |
| `get(el, name?)` | the controller of `el` for the behaviour `name` (without a name: its first), or `null`. A behaviour whose `init` returned a function or nothing has a handle with `destroy()` only |
| `destroy(root?)` | destroys every controller in `root` (itself included) at once, and takes down the roots of `init()` at or inside it |
| `emit(el, type, detail?, { cancelable })` | dispatches the bubbling `CustomEvent` `ds:<type>` with `detail` on `el`; returns `false` when a listener called `preventDefault()`. Cancelable only when asked, and only where cancelling cannot trap someone |
| `config({ locale, strings })` | sets the page's locale (`null`: back to the default, the `lang` of `<html>`, else the browser's) and overrides strings by key (`null` restores one); returns the settings in force, `{ locale, strings }` |
| `t(key, vars?)` | the system's string `key`: the page's override, else the English default, else the key itself; `{name}` placeholders are filled from `vars`, and a string may be a function of `vars` (plurals) |

## One runtime per page

A host page and an embedded widget, two bundles, or a bundle and the ES modules next to it: whichever loads first
makes `globalThis.DashboardStyle.runtime`, and every later copy, of any version, uses it. The state that must be
unique per page lives there, by name:

| State | Owner | What |
|---|---|---|
| `core` | `core.js` | the behaviours, the controllers of each element, the roots of `init()`, the settings |
| `overlay` | `overlay.js` | per document: the Escape stack of every copy, the scroll-lock count, the numbering of anchor names and tooltip ids, the tooltip roots (2.x copies keep the same record under `document[Symbol.for('ds.overlay')]`; the runtime adopts it) |
| `guard` | `motion.js` | the installed action guard of each document or shadow root and its holders |
| `ripple` | `ripple.js` | the ripple delegation of each root |
| `format` | `format.js` | the one clock (its clients and timer) and the controller of each `data-ds-time` element |
| `store` | `store.js` | the values kept in memory, the listeners and the one `storage` listener |
| `dnd` | `dnd.js` | the live region and the hint of each host, the numbering of the hints |

So a dialog opened by one copy and a sheet opened by another close in stack order on Escape, the scroll stays
locked until the last of them closed, a document has one action guard, and `DS.ripple.attach(document)` or
`DS.overlay.tooltips(document)` from a second copy returns the first copy's handle. The names are internal: a
project reads the state only through the modules.

## Behaviours

```js
DS.core.define('copy', {
  attribute: 'data-ds-copy',
  init(el, ctx) {
    const copy = () => navigator.clipboard.writeText(document.querySelector(el.dataset.dsCopy).textContent)
      .then(() => ctx.emit('copy', { text: ctx.t('copied') }));
    el.addEventListener('click', copy, { signal: ctx.signal });
  },
});
```

The spec of `define(name, spec)`:

| Key | What |
|---|---|
| `attribute` | the `data-ds-*` attribute that marks an element |
| `selector` | instead of (or besides) the attribute: the selector of the elements |
| `init(el, ctx)` | called once per matching element; returns a controller (an object with `destroy()`), a cleanup function or nothing. `ctx` holds `name`, `root` (the root of `init()`), `signal` (an `AbortSignal` that aborts when the controller goes, for listeners), `emit(type, detail, options)` on the element and `t(key, vars)` |
| `global(root)` | installed once per root of `init()`, for a delegated behaviour (one listener on the root, no work per element); returns a cleanup |
| `attributes` | more attributes to observe (the behaviour's options). A change of one of them, or of `attribute`, calls the controller's `update(names)` when it has one, else destroys the controller and initialises the element again. Never list an attribute the controller writes itself |

A behaviour defined after `init()` (a later bundle, a lazy module) applies to the roots already initialised. A
controller's `destroy()` must be safe to call twice; a page that wants to drop one calls `DS.core.destroy(el)`.

Registered by the system:

| Name | Kind | What |
|---|---|---|
| `guard` | global | `DS.motion.guard()` on the root's document or shadow root: busy, done and `aria-disabled` actions are blocked for every input |
| `ripple` | global | `DS.ripple.attach(root)`: the pointer ripple on every action |
| `tooltips` | global | `DS.overlay.tooltips(root)`: tooltips for every `[data-tip]` |
| `time` | element | `DS.format.time(el)`: keeps the relative time of every `[data-ds-time]` current |

So `init()` always installs the action guard and the ripple delegation (they come with `motion.js` and
`ripple.js`, and `ds.js` has both). A root that `DS.ripple.attach()` or `DS.overlay.tooltips()` served before keeps
that handle, and `init()`'s `destroy()` leaves it in place; the calls themselves stay and are no-ops on a root
already served.

## `init()` and the observer

- **Idempotent.** A second `init()` on the same root rescans it and holds it once more; each handle's `destroy()`
  lets go of its hold, and the last one takes the root down (globals, observer, controllers). `DS.core.destroy(root)`
  does so at once. A root inside one already initialised is rescanned only (the outer root's globals and observer
  serve it); a root around ones already initialised takes them over, controllers included.
- **`data-ds-managed`.** Nothing inside an element with `data-ds-managed` (itself included) is initialised: the
  React adapter marks its roots so, and owns what is inside. Delegated behaviours (ripple, guard, tooltips) still
  serve them. Removing the attribute initialises the subtree.
- **Observer.** With `observe` (the default) one `MutationObserver` per root watches `childList` and `subtree`, plus
  the attributes of every behaviour (an `attributeFilter`): `DS.dom.morphHtml` patches in place, so a new or changed
  `data-ds-*` attribute arrives without any added node, and initialises its element.
- **Batches.** Records are batched to a microtask. At the flush, controllers go only for elements that are **still
  disconnected**, so a keyed move without `moveBefore()` (Firefox and Safari: a remove plus an add) keeps its
  controller; then changed elements are reconciled and added ones initialised. A removal and an insertion in
  separate tasks make a new element.
- **Errors.** A behaviour whose `init` throws is reported (`reportError`, else the console) and skipped; the others
  still run.
- **Without a DOM** (Node), `init()` returns a handle that does nothing; loading the module touches no DOM.

## Events

Events of the system are DOM `CustomEvent`s with the `ds:` prefix that bubble: `ds:open`, `ds:change`, `ds:select`
... A `ds:before-*` event is cancelable only where cancelling cannot trap someone (a dialog with unsaved changes may
refuse a close; Escape is never cancelable). `emit()` returns whether the action may go on:

```js
if (!DS.core.emit(dialog, 'before-close', { reason }, { cancelable: true })) return;
```

## Strings and locale

The system's own few texts are English by default; a page in another language overrides them once, and the built-in
strings of [install.md](install.md#language-and-locale) list every key. There is no language pack.

```js
DS.core.config({ locale: 'de', strings: { close: 'Schliessen', moreCount: ({ count }) => `${count} weitere` } });
DS.core.t('close');                    // 'Schliessen'
DS.core.t('moreCount', { count: 3 });  // '3 weitere'
DS.core.config().locale;               // 'de'
```

## Helpers on the runtime

Four core modules, each optional in a bundle: `DS.format`, `DS.store`, `DS.virtual` and `DS.dnd`. They read the locale
and strings of `DS.core.config()` and write owned state, so `DS.dom.morphHtml` leaves what they wrote alone.

## `DS.format`: numbers, dates and the shared clock

`js/format.js`. Everything goes through `Intl` in the locale of `DS.core.config()`; pass `locale` to override it for
one call. A locale the engine refuses counts as none, so a typo in `lang` never stops a page. `null`, `undefined`, `''`
and what is no number or date give `options.empty` (default `''`), so a page shows its own dash.

```js
DS.format.number(1234.5);                           // '1,234.5'
DS.format.percent(0.42);                            // '42%'
DS.format.currency(19.9, 'EUR', { locale: 'de' });  // '19,90 €'
DS.format.bytes(1536);                              // '1.5 kB'
DS.format.bytes(1536, { base: 1024 });              // '1.5 KiB'
DS.format.duration(3725000);                        // '1 hr, 2 min'
DS.format.duration(3725000, { style: 'clock' });    // '1:02:05'
DS.format.list(['Ada', 'Grace', 'Joan']);           // 'Ada, Grace, and Joan'
DS.format.plural(3, { '=0': 'No devices', one: '{count} device', other: '{count} devices' }); // '3 devices'
DS.format.relative(Date.now() - 180000);            // '3 minutes ago'
DS.format.absolute(Date.now());                     // 'Nov 4, 2026, 9:00 AM'
```

| Export | What |
|---|---|
| `number(value, options)` | `Intl.NumberFormat`; `options` are its options, plus `locale` and `empty` |
| `percent(value, options)` | a share as a percentage, `Intl`'s way: `0.42` gives `42%` |
| `currency(value, code, options)` | an amount in the ISO 4217 currency `code` |
| `bytes(value, options)` | the largest unit that keeps a figure of at least 1: `base` 1000 (default: `kB`, `MB` through `Intl` units) or 1024 (`KiB`, `MiB`, whose symbols do not translate). One fraction digit unless the options say others, none for whole bytes; a figure that rounds up to the next unit takes it |
| `duration(value, options)` | a length of time given in ms. `style`: `short` (default), `long`, `narrow` or `clock` (`1:02:03`, `2:05`). `parts` (default 2): how many units at most, the last one rounded. `smallest`: the smallest unit (default `second`; under a second `millisecond` unless named) |
| `list(items, options)` | `Intl.ListFormat`: `type` `conjunction` (default), `disjunction` or `unit`, `style` `long` (default), `short` or `narrow`. Empty items are left out |
| `plural(count, forms, options)` | the form for `count`: an exact `'=0'`, then the category of `Intl.PluralRules` (`one`, `few`, `many`, `other` ...), then `other`. A form is a text with `{count}` (formatted) or a function of `{ count, formatted }`. `type: 'ordinal'` picks ordinal categories |
| `relative(value, options)` | how far a `Date`, timestamp or date text is from `now` (default this moment), in the largest fitting unit, cut to whole units: `3 minutes ago`, `in 2 hours`, `yesterday`. `style`, `numeric` (`auto`, default, or `always`), `smallest` and `largest` limit it |
| `absolute(value, options)` | a full date and time through `Intl.DateTimeFormat`; default a medium date and a short time |
| `clock(fn)` | adds `fn(now)` to the page's one timer and runs it now; returns the function that takes it off. `fn` returns how long until it next needs to run (ms), or nothing: every second |
| `time(el, options)` | keeps the relative time of `el` current; the same controller as `data-ds-time` below |

### Relative time: `data-ds-time`

```html
<time data-ds-time datetime="2026-11-04T09:00:00Z">Nov 4, 09:00</time>
<span data-ds-time="2026-11-04T09:00:00Z" data-ds-time-smallest="minute"></span>
```

`DS.init()` finds these (`DS.format.time(el, options)` is the imperative path, with the same options and controller).
The date comes from `data-ds-time`, else `datetime`; keep a readable text in the markup for the moment before the
script runs. An element without a valid date keeps its text.

| Attribute | Option | What |
|---|---|---|
| `data-ds-time` | `value` | the date (ISO 8601), or empty: read `datetime` |
| `datetime` | | the date on a `<time>` |
| `data-ds-time-style` | `style` | `long` (default), `short` or `narrow` |
| `data-ds-time-numeric` | `numeric` | `auto` (default: `yesterday`, `now`) or `always` (`1 day ago`) |
| `data-ds-time-smallest` | `smallest` | the smallest unit, so a table need not tick every second (`minute`) |
| `data-ds-time-largest` | `largest` | the largest unit (`day`: never `3 weeks ago`) |
| `data-ds-time-tip` | `tip: false` | `off`: no absolute date in `data-tip` |

The controller: `get()` (`{ value, text }`), `set(value)` (a new date), `on('change', fn)` (the text changed), `update()`
and `destroy()`. Without `DS.init()`, a controller whose element left the document stops at the next tick.

- **One clock.** A thousand times share one timer, kept in the page's runtime (`runtime.state('format')`) and so by
  every copy of the system. It waits until the soonest text changes (a time three hours old wakes it when the hour
  turns, not every second) and sleeps while the page is hidden; on return everything is brought up to date at once. A tick
  dispatches no event, and only a text that changed is written.
- **Tooltip.** The absolute date goes into `data-tip` for the tooltips of `DS.overlay` (`DS.init()` serves them), unless
  the element has its own `data-tip`. A `<time>` takes no focus, so give it `tabindex="0"` where the exact date matters
  to someone on a keyboard.
- **Re-render.** `DS.dom.morphHtml` is fine: `data-tip` is owned state, a changed `datetime` applies at once, and text
  a morph writes back is corrected before paint.
- **Screen readers.** The text changes silently; it is never a live region. A reader reads the current text when it gets
  there.
- **Bundles.** A bundle finds `DS.format` by the calls; for `data-ds-time` alone, safelist `module:format`.

## `DS.store`: remembered preferences

`js/store.js`. Columns, density, dismissed banners, sheet widths: JSON values in `localStorage` under
`ds:<namespace>:<key>`, so a host page and a widget never read each other's.

```js
const prefs = DS.store.open('devices');
prefs.get('columns', ['name', 'status']);   // the fallback while nothing is stored
prefs.set('columns', ['name']);
const off = prefs.on('change', ({ key, value, external }) => { if (key === 'columns') show(value); });
prefs.remove('columns');
prefs.destroy();                            // takes this handle's listeners off; the values stay
```

| Export | What |
|---|---|
| `open(namespace, { storage })` | the preferences of `namespace` (no colon). `storage`: `sessionStorage` for this tab only, `null` for memory only; default `localStorage` |
| `available({ storage })` | whether values reach real storage and survive a reload |

The handle: `get(key, fallback)`, `set(key, value)` (`undefined` removes), `remove(key)`, `clear()` (this namespace),
`keys()`, `on('change', fn)` (returns the unsubscribe) and `destroy()`.

- **Never a store of record.** A preference may vanish at any time, and nothing here throws because storage did. Where
  `localStorage` cannot be reached (blocked, a sandboxed frame) or refuses a write (quota), the value stays in memory
  for this page, so the choice holds until it reloads. What cannot be parsed reads as not stored.
- **Change events.** A write that changes a value tells every listener of the namespace, in this tab and through the
  `storage` event in other tabs (`external: true`), and dispatches a bubbling `ds:store` on the document with the same
  detail: `{ namespace, key, value, previous, external }`. A write of the same value is no change. A
  `localStorage.clear()` in another tab arrives as `key: null`: read again. The memory fallback cannot reach other tabs.
- **Sensitive data never.** Anything in `localStorage` can be read by every script of the origin.

## `DS.virtual`: windowed lists and rows

`js/virtual.js`. A list or the rows of a table with thousands of entries, of which only those near the viewport exist.
Use it when rows are many and uniform; a filter or pagination is often the better answer.

```html
<div id="wrap" class="ds-table-wrap">  <!-- the scroller: give it a block size and overflow in project CSS -->
  <table class="ds-table">
    <thead><tr><th scope="col">Device</th><th scope="col">Status</th></tr></thead>
    <tbody></tbody>
  </table>
</div>
```

```js
const rows = DS.virtual.create(wrap, {
  count: devices.length,
  estimate: 48,
  render: (index) => `<tr data-ds-key="${devices[index].id}"><td>${esc(devices[index].name)}</td><td>...</td></tr>`,
});
rows.set({ count: devices.length });        // more or fewer rows
rows.refresh();                             // the data changed: patch what shows
rows.scrollTo(4000, { align: 'center' });
rows.on('range', ({ end, count }) => { if (end > count - 20) loadMore(); });
```

| Export | What |
|---|---|
| `create(scroller, options)` | windows the rows of `scroller` (an element that scrolls, or the document's scroller); once per scroller. Returns the controller below |
| `sizes(count, estimate)` | the height model alone, for what windows by itself: `size(i)`, `set(i, height)`, `measured(i)`, `offset(i)`, `total()`, `indexAt(offset)`, `resize(count)`, `estimate(value)`, `forget()`. A Fenwick tree, so a jump stays logarithmic for a million rows |

| Option | What |
|---|---|
| `render(index)` | the markup of one row: one root element, with its `data-ds-key`. Escape what you put in it |
| `count` | how many rows |
| `estimate` | a row's height until it was measured, a number or a function of the index (default: the first row measured). Close is enough: rows correct it as they show |
| `overscan` | rows rendered beyond each end of the viewport (default 4) |
| `content` | the element that holds the rows (default the first `tbody`, list, listbox, rowgroup or grid in the scroller, else the scroller) |
| `keyboard` | `false` leaves focus to the page (a combobox, a grid's cell navigation) |
| `active` | the row that holds the tab stop at the start (default 0) |
| `total` | what ARIA reports when `count` is not the whole set; `-1`: unknown |
| `rowOffset` | rows above these in a table or grid (default the rows of its `thead`) |
| `columns` | the columns a spacer row spans (default those of the header row) |

The controller: `get()` (`{ start, end, count, active }`), `set({ count, total, active, forget })` (`forget`: the data is
new, forget measured heights), `on('range' | 'active', fn)`, `refresh(index)` (one row, or all without an index),
`scrollTo(index, { align })` (`auto`, `start`, `center`, `end`), `focus(index)`, `row(index)`, `indexOf(node)` and
`destroy()`. Events on the scroller: `ds:range` `{ start, end, count }` when the rendered rows change, `ds:active`
`{ index, element }` when the active row changes.

- **Layout.** Rows stay in normal flow between hidden spacers (`data-ds-virtual-gap`), so a table keeps its column sizes
  and a sticky header keeps working. A row's spacing belongs inside the row: margins and gaps between rows are not
  measured. Structural selectors see the spacers, so stripes by `:nth-child` do not hold.
- **Dynamic heights.** A row's measured height replaces the estimate; a `ResizeObserver` catches later changes. Rows
  above the viewport that turn out taller or shorter shift the scroll position by the same amount, so what is on screen
  stays where it is (`overflow-anchor` is off on the scroller).
- **Re-render.** Rows go through `DS.dom.morphHtml`: one that stays is patched in place and keeps its focus, listeners
  and running transitions. Each row is rendered once while it shows; `refresh()` renders again. A morph of a parent that
  empties the rows is put right before paint.
- **Screen readers.** In a table or grid: `aria-rowcount` on it and `aria-rowindex` on each row. Elsewhere: `aria-setsize`
  and `aria-posinset` on each row. All owned state. The page gives the list its role, as without windowing.
- **Keyboard.** One tab stop, the active row (`tabindex="0"`, the others `-1`, and the scroller `-1` unless it has its own: Firefox makes a scroller a stop). ArrowUp, ArrowDown, Home, End, PageUp and
  PageDown move it and the focus, rendering the target first; not from inside a text field and not with a modifier. The
  active row stays rendered wherever the scroll position is, so scrolling away drops neither the focus nor the tab stop.
  When the row that held the focus goes, the focus moves to the active row. So a row must show a focus ring of its own:
  `.ds-pressable` has one.
- **Forced colours.** Nothing of its own: rows keep what their component does, and spacers are `visibility: hidden`.
- **Limits.** Browser search finds rendered rows only, so offer a filter. A browser caps an element's height (about 17
  million px in Firefox): keep count times height under that.

## `DS.dnd`: pointer and keyboard drag

`js/dnd.js`. The engine under kanban boards, trees and panel grids. `DS.motion.sortable()` stays what it is, one list
with a grip that saves each step; use `DS.dnd` for more than one zone, a drop the page can refuse, or a placement of its
own. It needs `drag.css` (`data-ds-dragging`, `data-ds-dragover`, `.ds-grip`).

```html
<section class="ex-column" aria-label="To do">
  <article class="ex-card">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move Replace the fan">(grip 20)</button>
    Replace the fan
  </article>
</section>
```

```js
const drag = DS.dnd.create(board, { zones: '.ex-column', items: '.ex-card' });
board.addEventListener('ds:drop', ({ detail }) => save(detail.item, detail.to));
```

| Export | What |
|---|---|
| `create(container, options)` | moves items by pointer and keyboard inside `container`; once per container. Returns the controller below |

| Option | What |
|---|---|
| `items` | the items, a selector (default the zone's element children) |
| `handle` | where a drag starts, a selector (default `.ds-grip`). A control inside a larger handle stays a control. A handle of your own needs `touch-action: none` |
| `zones` | the drop zones in the container, a selector (default the container) |
| `list` | the element in a zone that holds its items, a selector (default the zone) |
| `axis` | how a zone's items run: `block` (default), `inline` or `both` (wrapping) |
| `accept(item, zone)` | whether the item may go there |
| `label(item)`, `zoneLabel(zone)` | names in announcements (default the `aria-label`, else the item's text; a zone's `aria-label` or `aria-labelledby`) |
| `announce(type, detail)` | the text for `grab`, `move`, `drop` or `cancel`; `''` stays silent. Default the strings below |
| `target(point, context)` | a pointer position to a target or `null`, instead of the list logic |
| `keyTarget(key, context)` | a key (arrows, Home, End) to a target, instead of the list logic |
| `place(target, context)` | shows a target, instead of moving the item in the DOM |
| `autoScroll` | scroll an ancestor while the pointer is near its edge (default `true`) |

The controller: `get()` (the running drag `{ item, mode, from, to }`, or `null`), `set({ item, zone, index })` (moves an
item without a drag, with the events and the announcement of a drop: for a "Move to ..." menu), `cancel()`, `on(type, fn)`
and `destroy()`.

| Event, on the container | Detail | What |
|---|---|---|
| `ds:drag-start` | `{ item, from, mode }` | cancelable: refuses the lift |
| `ds:drag-move` | `{ item, from, to, mode }` | the target changed |
| `ds:drop` | `{ item, from, to, mode }` | cancelable: the item goes back to `from`. The page saves here |
| `ds:drag-cancel` | `{ item, from, mode }` | Escape, a lost pointer, a focus that left, a refused drop, or a drop on the place it came from |

`from` and `to` are targets, `{ zone, index }`: the index among the zone's items without the dragged one, ready for
`splice()`. `mode` is `pointer`, `keyboard` or `api`.

- **Pointer.** A press on a handle and a move of 4px lift the item (a press alone stays a click). It follows the pointer
  (its inline `translate`) with `data-ds-dragging` on it: raised, with the dragged state layer; nothing scales. Whenever the
  target changes it moves in the DOM and the others make room through `DS.motion.flip()`. Near the edge of a scrollable
  ancestor, that ancestor scrolls. On release it glides into place on `--ds-ease-spatial`, and the raised look leaves in
  `--ds-dur-instant`. Over several zones, the one under it carries `data-ds-dragover`.
- **Keyboard.** On a handle, Space or Enter lifts. The arrows, Home and End then move it (along the axis in a zone; across
  it to the next zone that accepts it); the handle keeps the focus. Space or Enter drops. Escape cancels, and keeps an
  open dialog around it open. A focus that leaves cancels, so Tab is never held.
- **Announcements.** Every step is spoken through a polite `.ds-sr` region in the list's modal, else its `.ds-theme`, and a
  focused handle describes the keys through `aria-describedby`. The texts are the strings `dragHint`, `dragGrabbed`,
  `dragMoved`, `dragMovedZone`, `dragDropped`, `dragDroppedZone` and `dragCancelled` of `DS.core.config()`, each with
  `{label}`, `{zone}`, `{position}` and `{total}`. Name the handle by its action ("Move Replace the fan").
- **Blocked.** A handle or item that is `disabled`, `aria-disabled="true"` or `aria-busy="true"` does not lift.
- **Other shapes.** `target`, `keyTarget` and `place` replace the list logic: a tree returns `{ zone, index, position:
  'inside' }` and marks the row, a panel grid returns its cell and shows a placeholder. Two targets are the same when
  their `zone`, `index` and `position` are. The context holds `item`, `mode`, `from`, `current`, `zones`, `itemsIn(zone)`,
  `accepts(item, zone)` and `layoutBox(element)` (where an element sits without its translate or a glide).
- **Re-render.** What it writes (`data-ds-dragging`, `data-ds-dragover`, `aria-describedby`, `translate`, `z-index`) is owned
  state. Still hold live re-renders of the list until `ds:drop` or `ds:drag-cancel`: one that reorders moves the item
  under the pointer. A re-render that removes the handle cancels the drag.
- **Limit.** The dragged item stays in its zone's DOM, so a zone with `overflow: auto` clips it at its edge until it
  crosses into the next zone.
- **Forced colours.** The dragged item and the zone under it are outlined in `Highlight` (`drag.css`).

<!-- changelog -->
- New core modules: `DS.format` (`number`, `percent`, `currency`, `bytes`, `duration`, `list`, `plural`, `relative`,
  `absolute`, `clock`, `time`, and `data-ds-time` through `DS.init()`), `DS.store` (`open`, `available`), `DS.virtual`
  (`create`, `sizes`) and `DS.dnd` (`create`). `docs/core.md`.
- New strings: `dragHint`, `dragGrabbed`, `dragMoved`, `dragMovedZone`, `dragDropped`, `dragDroppedZone`, `dragCancelled`.
- New attribute written by the system: `data-ds-virtual-gap`. `data-ds-dragging` and `data-ds-dragover` are also written
  by `DS.dnd`.
