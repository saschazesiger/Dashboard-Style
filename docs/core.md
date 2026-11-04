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
| `a11y` | `a11y.js` | per document the stack of `trap()`, per container its handle |
| `hotkeys` | `hotkeys.js` | per root the registrations, the active scopes and the one keydown listener |

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

## Accessibility helpers

`js/a11y.js` (`DS.a11y`) holds the focus and speech tools a behaviour needs, so no component writes its own. It loads
after `dom.js` and `overlay.js`, whose functions it builds on.

```js
const hold = DS.a11y.trap(panel);              // Tab stays inside; hold.destroy() returns focus
DS.a11y.roving(toolbar, { activate: false });  // one tab stop, arrow keys
DS.a11y.typeahead(list);                       // typing a label moves focus to its item
DS.a11y.announce('Saved');                     // spoken, not shown
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
| `announce(text, { assertive, region })` | `DS.overlay.announce()` under this name: says `text` through the announcers of a snackbar region without showing anything ([motion.md](motion.md)) |

**Which trap.** A dialog, a side sheet and the modal drawer go through `DS.overlay.open()`: that is their trap, with the
page inert, the scroll lock and the Escape stack. `trap()` is for a region that is no overlay, such as a tour step or a
full-screen editor. It holds the keyboard only: the page stays usable by pointer and for a screen reader's virtual
cursor, so a modal region must not rely on it alone.

- Traps stack per document: the last one holds, and destroying it wakes the one below.
- A trap rests while an overlay it does not sit in is open, so a dialog opened from a trapped region keeps its focus;
  a region inside the open overlay keeps holding. It comes back when the overlay closes.
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
| `register(combo, handler, { description, group, scope, within, owner, overlays, fields, repeat, when, available, root })` | `combo` (a string, or a list of alternatives) calls `handler(event)`; a handler that returns `false` passes the key on. `description` and `group` are for `list()`, which leaves out a registration without a description. `scope` (default `'global'`). `within`: an element the key press must come from. `owner`: the element this belongs to, when it is no `within`: in an open overlay it still counts. `overlays: true` counts over any overlay. `fields`: `true` counts in fields and on the keys a native control uses itself, `false` never (default: only a combo with Control or Command). `repeat: true` takes a held key. `when(event)`: `false` skips it for this press. `available()`: `false` means it does nothing as the page stands, so it takes no key and `list()` says it is not active. `root`: default the document. A bad combo throws here. Returns `{ destroy() }` |
| `scope(name, { exclusive, root })` | turns the scope on until `destroy()`: its shortcuts count, before those of the scopes turned on earlier. `exclusive: true` masks every scope below it, `'global'` too |
| `scopes({ root })` | the scopes that count now, the one that counts first at the head |
| `list({ root, activeOnly, apple })` | the data of a shortcut sheet: the groups in the order they were first registered, each `{ name, items }`, an item `{ description, scope, active, combos: [{ combo, keys, text, aria }] }`. A registration that a later one with the same combos, scope and `within` replaces is left out, and so is one whose `owner` or `within` is not shown (hidden, unseen, in a closed layer). `active`: its scope counts now and `available()` says yes, so a disabled control shows as off; `activeOnly: true` leaves the others out |
| `onChange(fn, { root })` | calls `fn` after every change of what `list()` or `scopes()` give, so an open sheet stays true. Returns the unsubscribe |
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
  character: it counts as neither Control nor Alt.

**Which registration takes a key press.**

1. The page's own handlers come first (the registry listens in the bubble phase on the document): `preventDefault()`
   keeps the key. A composing IME gets nothing, and a held key runs a handler only with `repeat: true`; without it the
   key still keeps its default, so a held `mod+s` never opens the browser's own dialog.
2. A combo without Control or Command stays out of fields and of widgets that read keys (`DS.a11y.readsKeys()`), where
   it would type; `mod+k` still works from a search field. It also stays off the keys a native control uses itself: `space`
   and `enter` on a button, link, summary, checkbox, radio and their roles; the arrows, `home`, `end`, `pageup` and
   `pagedown` on a range, radio, media controls, a read-only field and `role` slider, radiogroup, tablist, grid and
   toolbar. `fields` changes that.
3. An open overlay masks the registrations behind it, so letters reach a menu's type-ahead and no shortcut acts on the
   inert page. A `within` or `owner` in that layer, or `overlays: true`, still counts. Escape stays the overlay's.
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
`data-ds-hotkey-description` (default: its `aria-label`, else its label, else its text), `data-ds-hotkey-group` and
`data-ds-hotkey-scope` are the options of `register()`. It writes `aria-keyshortcuts` unless the markup has one, and a
re-render with `morphHtml` keeps it.

**Accessibility.** Plain-letter shortcuts are a burden for people on speech input (WCAG 2.1.4): a page offers them only
as an addition to a visible control, with a way to turn them off or remap them, or with `within` so they count only
while the element has focus. `list()` is what a sheet needs to make them discoverable, and `format().aria` the value for
`aria-keyshortcuts`. The key names are strings (`keyCtrl`, `keyEnter` ...: [install.md](install.md#language-and-locale)).

<!-- changelog
- New `js/a11y.js` (`DS.a11y`): `trap()`, `tabbables()`, `canTakeFocus()`, `readsKeys()`, `typeahead()`, `typeaheadMatch()`, and `roving()`
  and `announce()` under this name (the functions of `DS.dom` and `DS.overlay`, which stay).
- New `js/hotkeys.js` (`DS.hotkeys`): a registry of shortcuts per document with platform-aware combos, scopes, fields
  left alone, overlays masking what is behind them, the data of a shortcut sheet (`list()`, `onChange()`), `format()`
  and `data-ds-hotkey`.
- `DS.overlay.canFocus()`, `DS.overlay.FOCUSABLE`, `DS.overlay.typeAhead()`, `DS.dom.typesText()`, `DS.dom.own()` and
  `DS.dom.disown()` are exported (the helpers build on them).
- New strings: `keyCtrl`, `keyAlt`, `keyShift`, `keyMeta`, `keyEnter`, `keyEscape`, `keySpace`, `keyTab`, `keyBackspace`,
  `keyDelete`, `keyHome`, `keyEnd`, `keyPageUp`, `keyPageDown`, `hotkeysGeneral`.
-->
