## Save bar

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
- Hooks: `--ds-savebar-offset`, `--ds-savebar-inset` (from the view's sides instead of the page column),
  `--ds-savebar-min-height` (56px), `--ds-savebar-radius` (`--ds-radius-card`), `--ds-savebar-bg`
  (`--ds-surface-popover`), `--ds-savebar-shadow` (`--ds-elev-overlay`) ([theming.md](theming.md#component-hooks)). Print: hidden.

**Motion:** the "Save bar" row of [Feedback](motion.md#feedback) in motion.md.

