## Empty state

```html
<div class="ds-empty">
  <span class="ds-empty__disc" aria-hidden="true">[icon box 24]</span>
  <p class="ds-empty__title">No devices yet</p>
  <p class="ds-empty__text">Add the first one or import a list.</p>
  <button class="ds-btn ds-btn--tonal" type="button">Add device</button>
</div>
```

At most one sentence and one action. It has no motion of its own; how it comes depends on what brought it
([motion.md](motion.md#data-motion)):

| What happened | Motion |
|---|---|
| It replaces a skeleton (first load) | `.ds-reveal` |
| A filter, search or live update left nothing | the rows leave through `DS.motion.flip` (they fade out in place), then `DS.motion.enter(empty, 'fade')`, without a rise |
| The filter was cleared | `DS.motion.leave(empty)` while the rows enter through `flip` |
| The user deleted the last item | the disc pops in: `DS.motion.enter(disc, 'pop')` |

A confirmation (a request sent, a job done) is the done state, with a drawn check in the disc:

```html
<div class="ds-empty ds-empty--done" role="status">
  <span class="ds-empty__disc" aria-hidden="true">[icon check 24]</span>
  <p class="ds-empty__title">Request sent</p>
  <p class="ds-empty__text">We will answer within a day.</p>
  <button class="ds-btn ds-btn--tonal" type="button">Send another</button>
</div>
```

`.ds-empty--done` brings its own entrance: the disc fades in and pops up on the spring (`ds-fade-in`, `ds-pop-in`,
`--ds-dur-slow`) after `--ds-dur-base`, a ring widens and fades once behind it (`ds-ripple`) after `--ds-dur-slow`, and
the `pathLength="1"` check (`DS.icons.check`) draws itself (`ds-draw`, `--ds-dur-glide`, `--ds-ease-out`). It plays
when the element is inserted or shown (`hidden` removed), never again while a re-render (`DS.dom.morphHtml`) keeps
the node. Forced colours: the disc keeps an outline.

The disc is 48px; `--ds-empty-disc-size` (on the element or in the theme) makes it larger, say for a confirmation
page: the ring follows, the glyph keeps the size of its markup (`[icon check 32]` in a 72px disc).

**Motion:** [Data motion](motion.md#data-motion) in motion.md.

