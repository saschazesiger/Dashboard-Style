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
