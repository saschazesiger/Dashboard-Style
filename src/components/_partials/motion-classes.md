## Motion classes

Documented in [motion.md](motion.md): `.ds-enter` with `.ds-enter--fade`, `.ds-enter--scale`, `.ds-enter--slide`,
`.ds-enter--swap`, `.ds-enter--delayed`, `.ds-enter--pop`, `.ds-enter--fill` (a [chart](#charts) mark fills to its `--ds-share`), `.ds-enter--fill-x`, `.ds-enter--fill-y` (**deprecated** in 2.0, removed in 3.0 at the earliest: use `.ds-enter--fill`); `.ds-leave` with `.ds-leave--sink`, `.ds-leave--scale`, `.ds-leave--slide`, `.ds-leave--pop`;
`.ds-stagger`; `.ds-reveal`; `.ds-reveal--scroll` (a block of a long read-only page fades in and rises while it
scrolls into view, tied to the scroll position; static where `view()` timelines are missing and in print);
`.ds-collapsible` (opens decelerating and closes faster, accelerating; focus rings at its content edge are not cut; a summary holding a `.ds-chevron` drops the native marker); `.ds-chevron` (a disclosure chevron that turns 180deg on the spring
in the summary of an open `<details>` or under `aria-expanded="true"`); `.ds-presence` (toggled elements; on a wrapper, never on a `.ds-btn`, `.ds-chip` or `.ds-card`) with
`.ds-presence--keep` (keeps its box, toggled by `data-ds-shown`; 2.0); `.ds-swap` (the slot of `DS.motion.roll()` and
`DS.motion.crossfade()`) with `.ds-swap--fade` (soft edges, 2.0); `.ds-vt-view` (a view outside the app frame,
2.0, see [Page](#page-outside-the-frame)); `.ds-icon-swap` with `.ds-icon-swap__a` and `.ds-icon-swap__b` (icon swaps, see
[Button](#button)); the sliding indicator `.ds-has-indicator`, `.ds-indicator`,
`.ds-indicator--instant`.

One-shot content (a card that appears once, a row that goes) uses `.ds-enter` / `.ds-leave` or `DS.motion`.
Something that is shown and hidden again and again uses `DS.overlay` (dialogs, sheets, menus, the combobox list)
or, for a project element toggled with `hidden`, as a `[popover]` or as a `<dialog>` of its own, `.ds-presence`:
it fades in and grows from `--ds-scale-popup` on the spring, leaves faster, and a toggle mid-way continues from where
it is (progressive: where `@starting-style` and `transition-behavior: allow-discrete` exist; elsewhere it toggles at
once). Never both on one element. Something that comes and goes without moving its neighbours (a pill shown on
hover, a "Latest" button whose room stays) takes `.ds-presence--keep` and the page's `data-ds-shown` instead: it fades
and keeps its box, in every engine.

```html
<span class="ds-presence ds-presence--keep" data-ds-shown><button class="ds-btn ds-btn--tonal ds-btn--sm" type="button">Latest</button></span>
```

A `[popover]` is centred by the browser's `margin: auto`; inside a container that spaces its children with margins
(`.ds-card > * + *`), give it `margin: auto` again or place it outside.

A log that grows at its end (an import log, a chat) sticks to it with `DS.dom.followEnd(scroller, { pill })` (2.0):
while the reader is at the end, new lines keep it there; scrolling up lets go and shows `pill` (a `.ds-presence`
wrapper around a "Latest" button, toggled with `hidden`); a click on it, or `stick()`, goes back to the end
([motion.md](motion.md#dsdom-jsdomjs)).

```html
<div class="ex-log" id="log" tabindex="0" aria-label="Import log">...</div>
<span class="ds-presence" id="latest" hidden><button class="ds-btn ds-btn--tonal ds-btn--sm" type="button">[icon arrowDown 16] Latest</button></span>
```

```js
DS.dom.followEnd(document.getElementById('log'), { pill: document.getElementById('latest') });
```

**Motion:** [Utilities](motion.md#utilities-css) and [Keyframes](motion.md#keyframes) in motion.md.

