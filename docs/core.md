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
| `runtime` | the page's one runtime (`globalThis.ZDash.runtime`); `runtime.state(name, init)` returns the shared state `name`, made by `init()` (a function, or the value itself) the first time any copy asks |
| `define(name, spec)` | adds the behaviour `name` (below); returns `true`, or `false` when a copy loaded earlier defined the name (that copy's definition stays) |
| `init(root?, { observe })` | installs every global behaviour on `root` (default: the document) and initialises every matching element in it; `observe` (default `true`) keeps doing so for markup added, changed or removed later. Returns `{ destroy() }` |
| `get(el, name?)` | the controller of `el` for the behaviour `name` (without a name: its first), or `null`. A behaviour whose `init` returned a function or nothing has a handle with `destroy()` only |
| `manage(el, name)` | runs the behaviour `name` on `el` for an owner that renders the element itself (the [React adapter](react.md), inside `data-ds-managed`): the behaviour's own `init` makes the controller, so the element's `data-ds-*` attributes are its options, and `get(el, name)` returns it (an element without the behaviour's attribute gets it once `update()` sees the attribute). Returns `{ controller, update(), destroy() }` (`update()` after the owner changed the element's attributes: the controller's `update(names)`, else a fresh controller; `destroy()` is safe to call twice), or `null` when no behaviour `name` initialises elements |
| `destroy(root?)` | destroys every controller in `root` (itself included) at once, and takes down the roots of `init()` at or inside it |
| `emit(el, type, detail?, { cancelable })` | dispatches the bubbling `CustomEvent` `ds:<type>` with `detail` on `el`; returns `false` when a listener called `preventDefault()`. Cancelable only when asked, and only where cancelling cannot trap someone |
| `config({ locale, strings })` | sets the page's locale (`null`: back to the default, the `lang` of `<html>`, else the browser's) and overrides strings by key (`null` restores one); returns the settings in force, `{ locale, strings }`. A change dispatches `ds:config` on the document |
| `t(key, vars?)` | the system's string `key`: the page's override, else the English default, else the key itself; `{name}` placeholders are filled from `vars`, and a string may be a function of `vars` (plurals) |
| `safeHref(value)` | `value` when it is safe to write as an `href` or to navigate to from data: an absolute URL on `http:`, `https:`, `mailto:` or `tel:`, or a relative one (a path, a query, a `#fragment`); else `null` (`javascript:`, `data:`, `blob:` …). The scheme is read by the URL parser, so tabs, newlines or spaces cannot hide it. Notifications, banners and the command palette pass every `href` from data through it |

## One runtime per page

A host page and an embedded widget, two bundles, or a bundle and the ES modules next to it: whichever loads first
makes `globalThis.ZDash.runtime`, and every later copy, of any version, uses it. The state that must be
unique per page lives there, by name:

| State | Owner | What |
|---|---|---|
| `core` | `core.js` | the behaviours, the controllers of each element, the roots of `init()`, the settings |
| `overlay` | `overlay.js` | per document: the Escape stack of every copy, the scroll-lock count, the numbering of anchor names and tooltip ids, the tooltip roots (2.x copies keep the same record under `document[Symbol.for('ds.overlay')]`; the runtime adopts it) |
| `guard` | `motion.js` | the installed action guard of each document or shadow root and its holders |
| `ripple` | `ripple.js` | the ripple delegation of each root |
| `a11y` | `a11y.js` | per document the stack of `trap()`, per container its handle |
| `hotkeys` | `hotkeys.js` | per root the registrations, the active scopes and the one keydown listener |
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
| `hotkey` | per element | `data-ds-hotkey`: a shortcut that presses the element ([Hotkeys](#hotkeys)) |
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
  [React adapter](react.md) marks its roots so, owns what is inside and runs their behaviours itself through
  `manage()`. Delegated behaviours (ripple, guard, tooltips) still serve them. Removing the attribute initialises the
  subtree. `data-ds-managed="off"` on an element inside one hands that element's subtree back (the nearest
  `data-ds-managed` decides): plain markup there is initialised and observed again.
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

`ds:config` is the system's own: `DS.core.config()` dispatches it on the document after a change, with the settings now in
force and what changed: `{ locale, strings, changed }`, where `changed` lists `'locale'` (another locale is in force) and
`'strings'` (strings were given). It cannot be cancelled.

## Strings and locale

The system's own few texts are English by default; a page in another language overrides them once, and the built-in
strings of [install.md](install.md#language-and-locale) list every key. There is no language pack.

```js
DS.core.config({ locale: 'de', strings: { close: 'Schliessen', moreCount: ({ count }) => `${count} weitere` } });
DS.core.t('close');                    // 'Schliessen'
DS.core.t('moreCount', { count: 3 });  // '3 weitere'
DS.core.config().locale;               // 'de'
```

A change reaches what is already on screen through `ds:config` (see [Events](#events)): a page re-renders its own text
there, and the relative times of `data-ds-time` are rewritten at once when the locale changes. A change of `lang` on
`<html>` alone says nothing; call `config()` as well.

## Accessibility helpers

`js/a11y.js` (`DS.a11y`) holds the focus and speech tools a behaviour needs, so no component writes its own. It loads
after `dom.js` and `overlay.js`, whose functions it builds on.

```js
const hold = DS.a11y.trap(panel);              // Tab stays inside; hold.destroy() returns focus
DS.a11y.roving(toolbar, { items: 'button', activate: false });  // one tab stop, arrow keys
DS.a11y.typeahead(list);                       // typing a label moves focus to its item
DS.a11y.announce('Saved');                     // spoken, not shown
const still = DS.a11y.inert(others);           // inert until still.destroy()
```

| Export | What |
|---|---|
| `trap(container, { initial, returnFocus })` | keeps the Tab key inside `container` until `destroy()` and pulls focus that lands outside back to where it was inside. It moves focus in at once: `initial` (an element or a selector), else `[autofocus]`, else the first tabbable, else the container itself; `initial: false`, or focus already inside without an `initial`, leaves it. `destroy()` gives focus back to `returnFocus` (default: what had it before; `false`: nowhere) when focus is still inside or nowhere. Once per container (a second call returns the same handle). Returns `{ destroy() }` |
| `tabbables(root)` | the elements inside `root` that the Tab key stops at, in DOM order: `FOCUSABLE` of `DS.overlay` and `canTakeFocus()`, without a negative `tabindex`; a named radio group counts once (its checked radio, else the first) |
| `canTakeFocus(node)` | whether focus can land on the node as the page stands: `canFocus()` of `DS.overlay`, and not in a disabled fieldset, nor unseen through `visibility` or `content-visibility` of itself or an ancestor (a closed details, a closed panel) |
| `readsKeys(node)` | whether plain keys on `node` already mean something: a field that takes text (`DS.dom.typesText()`), a select, or a widget with type-ahead (`role` textbox, searchbox, combobox, spinbutton, listbox, menu, menubar, tree, treegrid, or inside one). A read-only field and a checkbox type nothing, so a letter has nothing to do there; their own keys (Space on a checkbox) are another matter, which `DS.hotkeys` leaves to them |
| `roving(container, { items, orientation, wrap, activate, onActivate })` | `DS.dom.roving()` under this name, the same function and the same handle ([motion.md](motion.md)) |
| `typeahead(container, { items, label, onMatch, current })` | typing a label moves focus to its item: the letters typed within `--ds-delay-tooltip` of each other are one search, a navigation key starts a new one, a space counts only within a word (alone it activates the item), a field inside the container keeps its letters. `items`: a selector or a function (default: every option, menu item, tree item, tab and radio); disabled and hidden items are skipped, `aria-disabled` ones reached (their name is read). `label(item)` gives the lower-case label (default: its `aria-label`, else its text). `onMatch(item)` replaces `item.focus()`. The search goes on from the item that holds focus, else the one the container's `aria-activedescendant` names (the pattern `onMatch` is for), else `current()`. Delegated on the container, once per container. Returns `{ destroy() }` |
| `typeaheadMatch(items, current, typed, label)` | the matching alone (`DS.overlay.typeAhead()`, the matcher of the menus, with this label): the next item after `current` (wrapping) whose label starts with `typed` (lower case); one letter typed again and again cycles through the items with that letter; else `null` |
| `announce(text, { assertive, region, key })` | `DS.overlay.announce()` under this name: says `text` through the announcers of a snackbar region without showing anything ([motion.md](motion.md)) |
| `inert(elements)` | `DS.overlay.holdInert()` under this name: makes the elements (one or a list) inert until `destroy()`, counted per element, and composing with the overlays' own inert in any order; what the page made inert itself stays inert. A re-render with `morphHtml` keeps it. Returns `{ destroy() }` |

**Which trap.** A dialog, a side sheet and the modal drawer go through `DS.overlay.open()`: that is their trap, with the
page inert, the scroll lock and the Escape stack. `trap()` is for a region that is no overlay, such as a tour step or a
full-screen editor. It holds the keyboard only: the page stays usable by pointer and for a screen reader's virtual
cursor, so a modal region adds `inert()` for what lies around it. Leave out what must stay usable (the snackbar region,
what holds the region); an overlay opened inside a held element is inert with it.

```js
const others = [...main.children].filter((child) => !child.contains(region) && !child.matches('.ds-toasts'));
const still = DS.a11y.inert(others);
const hold = DS.a11y.trap(region);
// ... and when it ends:
hold.destroy();
still.destroy();
```

- Traps stack per document: the last one holds, and destroying it wakes the one below.
- A trap rests while an overlay over its region is open, so a dialog opened from a trapped region keeps its focus; a
  region inside the open overlay keeps holding. It comes back when the overlay closes. A contained dialog lies only
  over its container: elsewhere the trap holds, and leaves alone only the focus inside that dialog.
- A region that stops rendering (`hidden`, `display: none`) lets go until it shows again: Tab works natively, and the
  trap below holds. One the page removed (a re-render that drops it) lets go for good, like `destroy()`, at the next Tab
  or focus change.
- Snackbars stay usable above a trap, as above every modal: focus on one stays there, and the next Tab out returns.
- Escape is the page's: `trap()` closes nothing.

**Roving and type-ahead together.** Both are delegated on the container and do not know each other: focus moved by
`typeahead()` moves the tab stop of `roving()`.

```js
DS.a11y.roving(list, { orientation: 'vertical', activate: false });
DS.a11y.typeahead(list);
```

## Hotkeys

`js/hotkeys.js` (`DS.hotkeys`) is one registry of keyboard shortcuts per document: combos that read right on every
platform, scopes, and the data of a shortcut sheet. It imports `a11y.js`.

```js
const save = DS.hotkeys.register('mod+s', store, { description: 'Save', group: 'Editing' });
const board = DS.hotkeys.scope('board');   // its shortcuts count until board.destroy()
DS.hotkeys.format('mod+s').text;           // '⌘S' on Apple systems, 'Ctrl+S' elsewhere
DS.hotkeys.list();                         // the groups a shortcut sheet shows
```

```html
<button class="ds-btn" type="button" data-ds-hotkey="mod+k" data-ds-hotkey-description="Search devices">Search</button>
<input class="ds-input" type="search" aria-label="Search" data-ds-hotkey="/" data-ds-hotkey-description="Go to search">
```

| Export | What |
|---|---|
| `register(combo, handler, { description, group, scope, within, owner, overlays, fields, repeat, when, available, root })` | `combo` (a string, or a list of alternatives) calls `handler(event)`; a handler that returns `false` passes the key on. `description` (a string, or a function `list()` asks each time) and `group` are for `list()`, which leaves out a registration without a description. `scope` (default `'global'`). `within`: an element the key press must come from. `owner`: the element this belongs to, when it is no `within`: in an open overlay it still counts. `overlays: true` counts over any overlay. `fields`: `true` counts in fields and on the keys a native control uses itself, `false` never (default: only a combo with Control or Command). `repeat: true` takes a held key. `when(event)`: `false` skips it for this press. `available()`: `false` means it does nothing as the page stands, so it takes no key and `list()` says it is not active. `root`: default the document. A bad combo throws here. Returns `{ destroy() }` |
| `scope(name, { exclusive, root })` | turns the scope on until `destroy()`: its shortcuts count, before those of the scopes turned on earlier. `exclusive: true` masks every scope below it, `'global'` too |
| `scopes({ root })` | the scopes that count now, the one that counts first at the head |
| `list({ root, activeOnly, apple })` | the data of a shortcut sheet: the groups in the order they were first registered, each `{ name, items }`, an item `{ description, scope, active, combos: [{ combo, keys, text, aria }] }`. A registration that a later one with the same combos, scope and `within` replaces is left out, and so is one whose `owner` or `within` is not shown (hidden, unseen, in a closed layer). `active`: its scope counts now and `available()` says yes, so a disabled control shows as off; `activeOnly: true` leaves the others out |
| `onChange(fn, { root })` | calls `fn` after a registration or scope change; call `list()` again when opening a sheet or after changing a control's state. Returns the unsubscribe |
| `format(combo, { apple })` | a combo for people and for assistive tech on this platform: `keys` one label per key, for a `<kbd class="ds-kbd">` each; `text` the one line (`⇧⌘K`, `Ctrl+Shift+K`); `aria` the value of `aria-keyshortcuts` (`Shift+Meta+K`, `Control+Shift+K`; the plus key is `Plus`) |
| `parse(combo)` | a combo as data, `{ key, mod, ctrl, meta, alt, shift }`; without a key (only modifiers), with an unknown modifier or an unknown key name it throws |
| `matches(event, combo)` | whether a keyboard event is this combo (a string or what `parse()` gives) |
| `isApple(view?)` | whether this is an Apple system, where `mod` means Command. Progressive: `navigator.userAgentData`, else `navigator.platform` |

**Combos.** Modifiers and one key, joined by `+`, in any case.

- `mod` is Command on Apple systems and Control elsewhere: write it for an application shortcut. `ctrl` (`control`),
  `meta` (`cmd`, `command`, `win`, `super`), `alt` (`option`, `opt`) and `shift` are themselves.
- A key: a letter, a digit, `f1`, a word (`enter` or `return`, `escape` or `esc`, `space`, `tab`, `backspace`, `delete` or
  `del`, `home`, `end`, `pageup`, `pagedown`, `up`, `down`, `left`, `right`, or another key name of UI Events, such as `insert`) or a character. `+` alone or `plus` is the
  plus key (`mod++`).
- A character other than a letter or a digit is written as typed (`?`, never `shift+/`): which Shift it takes depends on
  the layout.
- A letter or a digit matches by what it types, then by its place on the keyboard where the layout types no Latin letter
  (another alphabet, Option on a Mac) or the digit needs a modifier (`shift+1`, a French layout). AltGr types a
  character: it counts as neither Control nor Alt, and a key pressed with it, or held by an IME, matches only by what it
  types.

**Which registration takes a key press.**

1. The page's own handlers come first (the registry listens in the bubble phase on the document): `preventDefault()`
   keeps the key. A composing IME gets nothing, and a held key runs a handler only with `repeat: true`; without it the
   key still keeps its default, so a held `mod+s` never opens the browser's own dialog.
2. A combo without Control or Command stays out of fields and of widgets that read keys (`DS.a11y.readsKeys()`), where
   it would type; `mod+k` still works from a search field, and so does a function key (`f2`), which types nothing. It also stays off the keys a native control uses itself: `space`
   and `enter` on a button, link, summary, checkbox, radio and their roles; the arrows, `home`, `end`, `pageup` and
   `pagedown` on a range, radio, media controls, a read-only field and `role` slider, radiogroup, tablist, grid and
   toolbar. `fields` changes that.
3. An open overlay masks the registrations behind it, so letters reach a menu's type-ahead and no shortcut acts on the
   inert page. A `within` or `owner` in that layer, or `overlays: true`, still counts. A contained dialog masks only
   inside its container, since the page around it stays live. Escape stays the overlay's: over an open layer an `escape`
   registration counts only with a `within` inside that layer, pressed from there. That is a widget handling its own
   Escape (an inline editor): the handler runs first and keeps the layer open, unless it returns `false`.
4. Of what is left, the innermost `within` wins, then the scope turned on last, then the registration made last. So a
   component that registers a combo takes it for as long as it lives, and `destroy()` brings the earlier one back.
5. The handler runs, and the one that takes the key prevents the default (a browser's own `mod+s`).

**Scopes.** `'global'` is always on, below the others. A view turns its own scope on while it shows; an `exclusive` one
(a full-screen editor) masks the rest. A scope turned on twice counts until both handles are gone.

**`data-ds-hotkey`.** With `DS.init()`, the attribute holds one combo or several separated by spaces, and a press of it
presses the button or link (the action guard applies), or focuses and selects a field, read-only ones too. The element
decides, not its ancestors: a button in a menu is pressed. It counts only while the element could take focus
(`DS.a11y.canTakeFocus()`: not disabled, hidden, unseen or inert) and is not `aria-disabled`, and over an overlay only
when it sits in that overlay; `list()` shows the same (off while it is disabled, not listed while it is not shown).
`data-ds-hotkey-description` (default: its `aria-label`, else its label, else its text, as they are when `list()` asks), `data-ds-hotkey-group` and
`data-ds-hotkey-scope` are the options of `register()`. It writes `aria-keyshortcuts` unless the markup has one, and a
re-render with `morphHtml` keeps it.

**Accessibility.** Plain-letter shortcuts are a burden for people on speech input (WCAG 2.1.4): a page offers them only
as an addition to a visible control, with a way to turn them off or remap them, or with `within` so they count only
while the element has focus. `list()` is what a sheet needs to make them discoverable, and `format().aria` the value for
`aria-keyshortcuts`. The key names are strings (`keyCtrl`, `keyEnter` ...: [install.md](install.md#language-and-locale)).

## Helpers on the runtime

Four core modules, each optional in a bundle: `DS.format`, `DS.store`, `DS.virtual` and `DS.dnd`. They read the locale
and strings of `DS.core.config()` and write owned state, so `DS.dom.morphHtml` leaves what they wrote alone.

## `DS.format`: numbers, dates and the shared clock

`js/format.js`. Everything goes through `Intl` in the locale of `DS.core.config()`; pass `locale` to override it for
one call. A locale the engine refuses counts as none, so a typo in `lang` never stops a page. `null`, `undefined`, a blank
text and what is no number or date (`true`, an array, an object) give `options.empty` (default `''`), so a page shows its
own dash.

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
| `bytes(value, options)` | the largest unit that keeps a figure of at least 1: `base` 1000 (default: `kB`, `MB` through `Intl` units) or 1024 (`KiB`, `MiB`, whose symbols do not translate). Whole bytes read `B` at either base, unless `unitDisplay` asks `Intl` at base 1000. One fraction digit unless the options say others, none for whole bytes; a figure that rounds up to the next unit takes it |
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
and `destroy()`. Without `DS.init()`, a controller whose element left the document stops at the next tick; one whose
element never entered it has its text at once and waits for it, so `destroy()` it if it never will.

- **One clock.** A thousand times share one timer, kept in the page's runtime (`runtime.state('format')`) and so by
  every copy of the system. It waits until the soonest text changes (a time three hours old wakes it when the hour
  turns, not every second) and sleeps while the page is hidden; on return everything is brought up to date at once. Another
  locale (`DS.core.config({ locale })`) does the same at once. A tick dispatches no event, and only a text that changed
  is written.
- **Tooltip.** The absolute date goes into `data-tip` for the tooltips of `DS.overlay` (`DS.init()` serves them), unless
  the element has its own `data-tip`. A `<time>` takes no focus, so give it `tabindex="0"` where the exact date matters
  to someone on a keyboard.
- **Re-render.** `DS.dom.morphHtml` is fine: `data-tip` is owned state, a changed `datetime` applies at once, and text
  a morph writes back is corrected before paint.
- **Screen readers.** The text changes silently; it is never a live region. A reader reads the current text when it gets
  there.
- **Bundles.** A bundle finds `DS.format` by the calls and by `data-ds-time`.

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
  `localStorage.clear()` in another tab arrives as `key: null`: read again. Other tabs are heard from the first `open()`
  until the last handle's `destroy()`, so `ds:store` needs no `on()` of its own. The memory fallback cannot reach other tabs.
- **Sensitive data never.** Anything in `localStorage` can be read by every script of the origin.

## `DS.virtual`: windowed lists and rows

`js/virtual.js`. A list or the rows of a table with thousands of entries, of which only those near the viewport exist.
Use it when rows are many and uniform; a filter or pagination is often the better answer.

```html
<div id="wrap" class="ds-table-wrap">  <!-- the scroller: give it a block size and overflow in project CSS -->
  <table class="ds-table" style="table-layout: fixed">  <!-- or explicit column widths: see Layout below -->
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
| `content` | the element that holds the rows (default the first `tbody`, list, listbox, rowgroup or grid in the scroller, else the scroller; in a `table` its first `tbody`, in an ARIA table or grid with rowgroups the last one, so a header row group stays) |
| `keyboard` | `false` leaves focus to the page (a combobox, a grid's cell navigation) |
| `active` | the row that holds the tab stop at the start (default 0) |
| `total` | what ARIA reports when `count` is not the whole set; `-1`: unknown |
| `rowOffset` | rows above these in a table or grid (default the rows of its `thead`, or of the row group before them) |
| `columns` | the columns a spacer row spans (default those of the header row) |

The controller: `get()` (`{ start, end, count, active }`), `set({ count, total, active, forget })` (`forget`: the data is
new, forget measured heights), `on('range' | 'active', fn)`, `refresh(index)` (one row, or all without an index),
`scrollTo(index, { align })` (`auto`, `start`, `center`, `end`), `focus(index)`, `row(index)`, `indexOf(node)` and
`destroy()`. Events on the scroller: `ds:range` `{ start, end, count }` when the rendered rows change, `ds:active`
`{ index, element }` when the active row changes.

- **Layout.** Rows stay in normal flow between hidden spacers (`data-ds-virtual-gap`), so a sticky header keeps working:
  scrolling and focus keep a row out from under it. A table needs `table-layout: fixed` or explicit column widths to keep
  its column sizes: the automatic layout sizes columns by the cells of the rows that exist, and those change as the window
  moves. A row's spacing belongs inside the row: margins and gaps between rows are not measured. Structural selectors see
  the spacers, so stripes by `:nth-child` do not hold.
- **Dynamic heights.** A row's measured height replaces the estimate; a `ResizeObserver` catches later changes. Rows
  above the viewport that turn out taller or shorter shift the scroll position by the same amount, so what is on screen
  stays where it is (`overflow-anchor` is off on the scroller).
- **Re-render.** Rows go through `DS.dom.morphHtml`: one that stays is patched in place and keeps its focus, listeners
  and running transitions. Each row is rendered once while it shows; `refresh()` renders again. A morph of a parent that
  empties the rows is put right before paint.
- **Screen readers.** In a table or grid: `aria-rowcount` on it and `aria-rowindex` on each row. Elsewhere: `aria-setsize`
  and `aria-posinset` on each row. All owned state, and `destroy()` takes them away. The page gives the list its role, as
  without windowing.
- **Keyboard.** One tab stop, the active row (`tabindex="0"`, the others `-1`, and the scroller `-1` unless it has its own: Firefox makes a scroller a stop). Buttons and links inside the other rows wait with `tabindex="-1"` (owned; their own value comes back when the row turns active), so Tab goes through the active row's controls and leaves the list. A control a page adds to a row by itself counts from the next render. ArrowUp, ArrowDown, Home, End, PageUp and
  PageDown move the active row and the focus, rendering the target first; not from inside a text field and not with a modifier. The
  active row stays rendered wherever the scroll position is, so scrolling away drops neither the focus nor the tab stop.
  When the row that held the focus goes, the focus moves to the active row, and to the scroller when no row is left. So a
  row must show a focus ring of its own: `.ds-pressable` has one. A table of editors that tabs from field to field takes
  `keyboard: false` and its own navigation.
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
item without a drag, with the events and the announcement of a drop, the DOM in its new order when `ds:drop` runs and back
if it is refused: for a "Move to ..." menu), `cancel()`, `on(type, fn)` and `destroy()`.

| Event, on the container | Detail | What |
|---|---|---|
| `ds:drag-start` | `{ item, from, mode }` | cancelable: refuses the lift |
| `ds:drag-move` | `{ item, from, to, mode }` | the target changed |
| `ds:drop` | `{ item, from, to, mode }` | cancelable: the item goes back to `from`. The page saves here |
| `ds:drag-cancel` | `{ item, from, mode }` | Escape, a lost pointer, a focus that left, a refused drop, or a drop on the place it came from |

`from` and `to` are targets, `{ zone, index }`: the index among the zone's items without the dragged one, ready for
`splice()`. `mode` is `pointer`, `keyboard` or `api`.

- **Pointer.** A press on a handle and a move of 4px lift the item (a press alone stays a click; a drag never ends in one,
  so a handle that also opens its card does not open it). It follows the pointer
  (its inline `translate`) with `data-ds-dragging` on it: raised, with the dragged state layer; nothing scales. Whenever the
  target changes it moves in the DOM and the others make room through `DS.motion.flip()`. Near the edge of a scrollable
  ancestor, that ancestor scrolls. On release it glides into place on `--ds-ease-spatial`, and the raised look leaves in
  `--ds-dur-instant`. Over several zones, the one under it carries `data-ds-dragover`.
- **Keyboard.** On a handle, Space or Enter lifts. The arrows, Home and End then move it (along the axis in a zone; across
  it to the next zone that accepts it; with `axis: 'both'` an arrow with nowhere left in the zone goes on to the next one
  or the one before) and keep it in view; the handle keeps the focus. Space or Enter drops; a held key counts once, and
  held arrows repeat. Escape cancels, and keeps an open dialog around it open. A focus that leaves or a handle that goes
  cancels, so Tab is never held.
- **Announcements.** Every step is spoken through a polite `.ds-sr` region in the list's modal, else its `.ds-theme`, there
  from `create()` on so that a reader knows it before the first words, and a focused handle describes the keys through `aria-describedby`. The texts are the strings `dragHint`, `dragGrabbed`,
  `dragMoved`, `dragMovedZone`, `dragDropped`, `dragDroppedZone` and `dragCancelled` of `DS.core.config()`, each with
  `{label}`, `{zone}`, `{position}` and `{total}`. Name the handle by its action ("Move Replace the fan").
- **Blocked.** A handle or item that is `disabled`, `aria-disabled="true"` or `aria-busy="true"` does not lift.
- **Other shapes.** `target`, `keyTarget` and `place` replace the list logic: a tree returns `{ zone, index, position:
  'inside' }` and marks the row, a panel grid returns its cell and shows a placeholder. Two targets are the same when
  their `zone`, `index` and `position` are. Zones may nest; an item never goes into a zone inside itself (`zones` in the
  context leaves those out, and a target or `set()` that names one is ignored). The context holds `item`, `mode`, `from`, `current`, `zones`, `itemsIn(zone)`,
  `accepts(item, zone)` and `layoutBox(element)` (where an element sits without its translate or a glide).
- **Re-render.** What it writes (`data-ds-dragging`, `data-ds-dragover`, `aria-describedby`, `translate`, `z-index`) is owned
  state. Still hold live re-renders of the list until `ds:drop` or `ds:drag-cancel`: one that reorders moves the item
  under the pointer. A re-render that removes the handle cancels the drag.
- **Limit.** The dragged item stays in its zone's DOM, so a zone with `overflow: auto` clips it at its edge until it
  crosses into the next zone.
- **Forced colours.** The dragged item and the zone under it are outlined in `Highlight` (`drag.css`).
