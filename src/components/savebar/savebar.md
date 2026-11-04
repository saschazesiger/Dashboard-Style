## Save bar

A bar with the unsaved edits of a view and the actions that save or discard them, or the actions of a long form kept in
reach.

```html
<main class="ds-view" id="main" tabindex="-1">
  <div class="ds-content"> ... </div>
  <div class="ds-savebar">
    <div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>
      <p class="ds-savebar__text">2 unsaved changes</p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button">Discard</button>
        <button class="ds-btn ds-btn--filled" type="button"><span class="ds-btn__faces"> ... </span></button>   <!-- the faces of Button -->
      </div>
    </div>
  </div>
</main>
```

```js
const bar = DS.overlay.savebar(document.querySelector('.ds-savebar'), { focusTarget: () => form.querySelector('input') });
form.addEventListener('input', () => bar.show());
discard.addEventListener('click', () => { form.reset(); bar.hide(); });
bar.update(() => { text.textContent = `${count} unsaved changes`; });   // after the exit while it leaves
```

Unsaved edits of a view, saved or discarded together. The `.ds-savebar` is the last child of the `.ds-view`, after
`.ds-content`: sticky at the view's bottom, it takes no room (height 0); its bar floats `--ds-savebar-offset` (16px)
above the view's bottom edge, in the page column (the view's side pad, `--ds-content-pad-x`, at most
`--ds-content-max` wide), text first, the actions at the end, wrapping on narrow views. It shows and hides as a
`.ds-presence`: it fades in and grows from `--ds-scale-enter` at its bottom edge on the spring, leaves faster, and a
toggle mid-way continues from where it is.

`DS.overlay.savebar(element, { focusTarget })` returns `{ element, show(), hide(), update(fn), shown, destroy() }`,
one controller per element (`.ds-savebar` or its `.ds-savebar__bar`):

- `show()` removes `hidden`, measures the bar (`--ds-savebar-height` on the view) and sets `data-ds-savebar` on the
  `.ds-view`: its `scroll-padding-bottom` and the content's bottom padding (at least `--ds-content-pad-bottom`) keep
  the bar's height, offset and `--ds-space-2` free, so the last field scrolls above the bar and the focused element
  scrolls clear of it at once (WCAG 2.4.11). The snackbars of its theme on the page rise above it
  (`--ds-toast-lift`, [Snackbar](#snackbar)); while it shows, the room of the messages that stay
  (`--ds-toast-reserve`) is kept by the content's bottom padding, not the view's, so the bar stays at the view's
  bottom. A `ResizeObserver` measures again while it shows.
- `hide()` moves focus inside the bar to `focusTarget()` (else the view), makes the bar inert while it leaves and
  sets `hidden`; the snackbars glide back down. Hidden while the view was at its end, the room stays
  (`data-ds-savebar-rest`) until the page scrolls away from the end, so nothing jumps.
- `update(fn)` runs `fn` at once, or after the exit while the bar is leaving (the count changes only once it is gone).
- Everything it writes is owned, so `DS.dom.morphHtml` keeps it. Outside a `.ds-view` it warns once and only shows and
  hides.
- Busy save: put the faces in the primary button and run it with `DS.motion.busy()` ([Button](#button)); hide the bar
  when it resolves and say the result with a snackbar.

**In the flow** (`.ds-savebar--inline`): the actions of a long form that is not in a card stay in reach at every width.
The last child of the form, it takes the room of its bar and sticks to the bottom of the scroller while the form is on
screen: a flat surface with a static hairline that runs to the edges of the page (`--ds-savebar-bleed`, default
`--ds-content-pad-x`; in a padded container of the page's own set it to that padding) and keeps clear of the home
indicator. No script and no `DS.overlay.savebar()`: it always shows, or the page sets `hidden` on the bar.
`.ds-form-actions--sticky` ([Form](#form)) is the same on phones only and an ordinary row above; take this one where
the wide layout needs it too, or where a line of text goes with the actions.

```html
<form class="ds-form"> ...
  <div class="ds-savebar ds-savebar--inline">
    <div class="ds-savebar__bar" role="group" aria-label="Form actions">
      <p class="ds-savebar__text">Changes apply after a restart</p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button">Cancel</button>
        <button class="ds-btn ds-btn--filled" type="submit">Save</button>
      </div>
    </div>
  </div>
</form>
```

**Options** ([options.md](options.md)): classes on the bar or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the bar |
|---|---|---|---|
| Variant | `--inline` | the `.ds-savebar` | in the flow, flat, at every width |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the bar or a container | the least height 8px per step (40 to 72px); its buttons take the same size from the same class |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the least height 4px less per step, the block padding 2px less per step; side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the floating bar's radius times 0, .5, 1, 1.5; its buttons follow by themselves |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high; its buttons take the minimum too |
| Tone | none | | the bar shows no status of its own; say the result of a save with a snackbar |

**Keyboard and names.** A floating bar is a `role="region"` with an `aria-label` ("Unsaved changes"), the bar in the flow
a `role="group"`. Tab reaches its buttons after the view's content; a focused element the bar would cover scrolls clear
of it, and `hide()` moves focus from inside it to `focusTarget()` (else the view), so focus is never lost.

**Forced colours.** The floating bar keeps an edge (its transparent outline); the bar in the flow keeps its hairline; its
buttons are the system's.

**Hooks:** `--ds-savebar-offset`, `--ds-savebar-inset` (from the view's sides instead of the page column),
`--ds-savebar-min-height` (the base of its least height, 56px), `--ds-savebar-radius` (`--ds-radius-card`, times the
shape), `--ds-savebar-bg` (`--ds-surface-popover`; in the flow `--ds-surface`), `--ds-savebar-shadow`
(`--ds-elev-overlay`), `--ds-savebar-bleed` (in the flow) ([theming.md](theming.md#component-hooks)). The attributes
`data-ds-savebar`, `data-ds-savebar-rest` and `data-toast-reserve` are the system's. Print: hidden.

**Motion:** the "Save bar" row of [Feedback](motion.md#feedback) in motion.md.

<!-- changelog -->
- Save bar on the options model (size, density, shape, touch, computed in `savebar.css`).
- New: `.ds-savebar--inline`, the actions of a long form outside a card in reach at every width, with hook
  `--ds-savebar-bleed`.
- Its cascade order moved after page (`meta.json` `order`), so the room it keeps on `.ds-content` holds in the
  component sublayers too.

