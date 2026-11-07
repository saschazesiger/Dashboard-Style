## Back to top

A button that appears once the reader has scrolled a long page or box down, and takes them back to its top.

```html
<!-- the last child of the long content: the page's, or a box's -->
<button class="ds-btn ds-btn--elevated ds-btn--icon ds-backtop" type="button" data-ds-backtop hidden>[icon arrowUp 20]</button>

<!-- with a label -->
<button class="ds-btn ds-btn--elevated ds-backtop" type="button" data-ds-backtop hidden>[icon arrowUp 18] Back to top</button>

<!-- fixed to the window's corner -->
<button class="ds-btn ds-btn--elevated ds-btn--icon ds-backtop ds-backtop--fixed" type="button" data-ds-backtop hidden>[icon arrowUp 20]</button>
```

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | default, `--fixed` | the button | sticks to the bottom end of its scroller from the end of the content (its own row there, so it never covers the last line), or fixed to the window's bottom end corner, clear of the safe areas |
| Look | `.ds-btn--elevated` (or `--tonal`), `--icon` | the button | the [button](#button)'s own: an icon button, or one with a label |
| Size, density, shape, touch | the option classes | the button or any ancestor | the button computes them in its own rule; this component reads none |
| Tone | none | | it states no status |

`--ds-backtop-offset` (`--ds-space-6`) is the room to the bottom and end edges.

### Behaviour: `data-ds-backtop`

`data-ds-backtop` on the button (`DS.init()` finds it; `DS.backtop.create(button, options)` is the imperative path, with
the same controller):

- **When it shows.** The scroller is `data-ds-backtop-target` (a selector; `html` or `body` for the page), else the
  nearest scrolling ancestor of the button, else the page. Past `data-ds-backtop-after` px of scroll (default: one height
  of the scroller) the button enters (`DS.motion.enter(button, 'scale')`); under half of that it leaves again
  (`DS.motion.leave(button, 'scale', { then: 'hide' })`), so a reader who stops near the line sees no flicker. One
  passive scroll listener on the scroller, throttled to a frame.
- **What it does.** A click scrolls the scroller to its top (smoothly within three of its heights, at once beyond that)
  and moves the focus to the top: `data-ds-backtop-focus` (a selector), else the box's first heading (the page's first
  `h1`), else the scroller (with `tabindex="-1"` when it takes no focus of its own; the focus never scrolls). So the
  keyboard goes on from the top, as the eye does.
- `ds:change` on the button: `{ shown }`.

| Attribute | Option | What |
|---|---|---|
| `data-ds-backtop` | | the behaviour, on the `.ds-backtop` button |
| `data-ds-backtop-after` | `after` | px of scroll after which it shows |
| `data-ds-backtop-target` | `target` | the scroller, a selector |
| `data-ds-backtop-focus` | `focus` | what takes the focus at the top, a selector |

The controller (`DS.get(button, 'backtop')`, or what `create()` returns): `get()` (whether it shows), `set(shown)`
(shows or hides it until the next scroll decides), `go()` (back to the top, as a click), `on('change', fn)` and
`destroy()`. `DS.backtop.shown(top, { after, shown })` is the rule alone.

What the module writes is owned state (`DS.dom.morphHtml` keeps it): `hidden` on the button, its `aria-label` and the
`tabindex` it gave a target.

- Keyboard and names: a button in the tab order where it sits (at the end of the content), named by its text or, without
  one, by the string `backToTop` ("Back to top"; `DS.core.config({ strings })`). While hidden it is out of the tab order.
- Forced colours: the button's own edge and ink. Print leaves it off the paper.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** it enters with `ds-fade-in` and `ds-grow-in` and leaves with `ds-fade-out` and `ds-shrink-out` (the
`.ds-enter--scale` and `.ds-leave--scale` pair); the way back scrolls smoothly within three heights of the scroller.

<!-- changelog
- Back to top (`.ds-backtop`, `.ds-backtop--fixed`, `DS.backtop`, `backtop.js`): a button that appears after a scroll
  (with a threshold that does not flicker), scrolls back to the top and moves the focus there.
-->
