## Load more and infinite scroll

The end of a list that grows by pages: a status line and a "Load more" button. With `data-ds-loadmore-auto` the element
is also the sentinel of an infinite scroll: the next page loads as it scrolls into view, a set number of times, and then
only the button loads, so a footer under the list stays reachable. Use [pagination](#pagination) where people need to
come back to a place in the list.

```html
<ul class="ds-list" id="devices" aria-label="Devices"> ... </ul>
<div class="ds-loadmore" data-ds-loadmore data-ds-loadmore-for="#devices"
     data-ds-loadmore-loaded="50" data-ds-loadmore-total="1234" data-ds-loadmore-auto="3">
  <p class="ds-loadmore__status">[icon alertCircle 16 ds-loadmore__icon]<span class="ds-loadmore__text">Showing 50 of 1,234</span></p>
  <button class="ds-btn ds-loadmore__button" type="button">
    <span class="ds-btn__faces">
      <span class="ds-btn__face">Load more devices</span>
      <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Loading</span>
    </span>
  </button>
</div>
```

```js
// The page loads the next page and hands its promise over: { loaded, total, done }, or the number it added.
document.querySelector('.ds-loadmore').addEventListener('ds:loadmore', (event) => {
  event.detail.respond(api.devices({ after: event.detail.loaded }).then((page) => {
    DS.motion.flip(list, (o) => DS.dom.morphHtml(list, rowsHtml(shown.concat(page.rows)), o), { items: 'li' });
    shown = shown.concat(page.rows);
    return { loaded: shown.length, total: page.total };
  }));
});
```

### Options

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Look | none (centred, the status over the button), `.ds-loadmore--inline` | `.ds-loadmore` | inline: the status at the start and the button at the end of one row, for the foot of a list in a card |
| Counts | `data-ds-loadmore-loaded`, `data-ds-loadmore-total` | `.ds-loadmore` | the first counts; without a total the status says "Showing 50" and the end comes with `done` |
| Infinite scroll | `data-ds-loadmore-auto` (empty: no limit; a number: at most that many automatic loads) | `.ds-loadmore` | loads as the element scrolls into view; then the button. Keep a limit where the page has a footer |
| List | `data-ds-loadmore-for` (a selector) | `.ds-loadmore` | the list gets `aria-busy` while it loads |
| Focus | `data-ds-loadmore-focus="new"` | `.ds-loadmore` | after a load from the button, focus moves to the first new item (default: it stays on the button, now after the new items) |
| Scroller | `data-ds-loadmore-root` (a selector), `data-ds-loadmore-margin` (a rootMargin) | `.ds-loadmore` | what the sentinel watches: default the nearest scrolling ancestor, else the viewport; `0px 0px 25% 0px`, so a load starts a little before the end shows |
| Size, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-shape-*`, `.ds-touch` | `.ds-loadmore` or any ancestor | reach the button, which computes them |
| Density | `.ds-density-*` | `.ds-loadmore` or any ancestor | 2px per step of the block padding (`--ds-loadmore-padding`) and the gap; and the button's height |

There is no tone: a failed load shows the error ink with an icon and words, never the colour alone.

### Behaviour

`js/loadmore.js` (`data-ds-loadmore`, or `DS.loadmore.create(el, options)`): one load at a time, from the button, the
sentinel or `load()`. A load sends `ds:loadmore` (`{ loaded, total, auto, respond(promise) }`) on `.ds-loadmore`, unless
`create()` was given `load`; the page renders the new items and hands its promise to `respond()` (or calls
`set({ loaded, total, done })` when they arrived, `set({ error })` when they did not). While it loads the element has
`data-state="loading"`, the button its busy face (after `--ds-delay-loader`, `DS.motion.busy()`; a fast page shows
nothing) and the list `aria-busy`. Then:

- **More to come.** The status says "Showing 100 of 1,234" and an announcement says "Loaded 50 more. Showing 100 of
  1,234." A sentinel that still shows loads on (a short page fills the view), up to the limit.
- **Done** (`done`, or `loaded` reached `total`): `data-state="done"`, the button goes, the status says "All 1,234 shown";
  a button that had the focus hands it to the status (`tabindex="-1"`, owned).
- **Failed:** `data-state="error"`, the status says "Could not load more." with the alert icon in the error ink, the button
  says "Try again", and the infinite scroll waits for a press.
- **A new query** (a filter, a sort): `reset({ loaded, total })` starts over, the automatic loads too. A load still
  running is dropped: its answer, when it comes, changes nothing and sends no event, and the next load waits for nothing
  but its own page.

New items come in with the page's `DS.motion.flip()` and `DS.dom.morphHtml()` (keyed: the new rows fade in, nothing
else moves). The `ds:loaded` event (`{ loaded, total, state, added }`) follows each load.

### JS API

```js
const more = DS.loadmore.create(el, { load: ({ loaded }) => fetchPage(loaded) });   // the controller data-ds-loadmore makes
more.get();                         // { loaded: 50, total: 1234, state: 'idle' }   (loading, error, done)
more.load();                        // a load now, as the button
more.set({ loaded: 100, total: 1234 });   // the answer to ds:loadmore, or new counts
more.reset({ loaded: 50, total: 80 });    // a new query
more.on('change', ({ loaded, total, state, added }) => {});
DS.loadmore.statusText({ loaded: 50, total: 1234, state: 'idle' });   // 'Showing 50 of 1,234'
```

`DS.loadmore.create(el, options)` returns the controller (`get()`, `set(value)`, `load()`, `reset(value)`,
`on('change', fn)`, `update()`, `destroy()`); on an element that has one it returns that one and hands it `load` and
`status`. `options` are those of the attributes plus `load` (a function of `{ loaded, total, auto }` that returns, or
resolves to, `{ loaded, total, done }` or the number of items it added) and `status` (a function of
`{ loaded, total, state }` that returns the status text, for the page's own words: "Showing 50 of 1,234 devices").
`DS.loadmore.statusText(state)` is the default status text.

### Accessibility

- **Names and roles.** The button names the action ("Load more devices"); the status is plain text, read in order after
  the list. A list that grows by itself can take `role="feed"` (articles inside, `aria-busy` while it loads, as the
  system sets it).
- **Keyboard.** The button is always there for keyboards and screen readers, in automatic mode too; Enter or Space loads.
  Focus stays on the button (now after the new items), or moves to the first new item with `focus: "new"`; when the
  button goes, the status takes the focus.
- **Announcements.** Polite: "Loading more" when the sentinel starts a load (nobody pressed anything), "Loaded 50 more.
  Showing 100 of 1,234." after a load, "All 1,234 shown" at the end, "Could not load more." on a failure.
- **Footers.** An infinite scroll keeps moving the end of the page away: give `data-ds-loadmore-auto` a limit (3 is
  common) where the page has content below the list.
- **Strings.** `loadMoreStatus`, `loadMoreStatusOpen`, `loadMoreDone`, `loadMoreLoaded`, `loadMoreLoading`,
  `loadMoreFailed` and `tryAgain` of `DS.core.config()`.

### Forced colours

The icon and the status are text in the system colours; the failure still says so in words. The button keeps the
button's model.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-loadmore-padding` | `--ds-space-4` | the block padding (and the side padding of `--inline`) at the comfortable density |
| `--ds-loadmore-error-color` | `--ds-error` | the status of a failed load |

**Motion:** none of its own: the button's busy face rolls (after `--ds-delay-loader`, held for `--ds-hold-loader`), the
status changes at once, and the new items are the page's `DS.motion.flip()`.

<!-- changelog
- Load more and infinite scroll (`DS.loadmore`, `.ds-loadmore`, `.ds-loadmore--inline`, `.ds-loadmore__status`,
  `.ds-loadmore__text`, `.ds-loadmore__icon`, `.ds-loadmore__button`, hooks `--ds-loadmore-padding`,
  `--ds-loadmore-error-color`): a status line and a Load more button with its busy face, an IntersectionObserver
  sentinel with a limit of automatic loads, `ds:loadmore` with `respond()`, `aria-busy` on the list, announcements, an
  error state that tries again, focus kept when the button goes. Strings `loadMoreStatus`, `loadMoreStatusOpen`,
  `loadMoreDone`, `loadMoreLoaded`, `loadMoreLoading`, `loadMoreFailed`, `tryAgain`.
-->
