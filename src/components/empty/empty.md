## Empty state

Says that there is nothing to show and why, at the size of its place, or confirms that a job finished.

```html
<div class="ds-empty">
  <span class="ds-empty__disc" aria-hidden="true">[icon box 24]</span>
  <p class="ds-empty__title">No devices yet</p>
  <p class="ds-empty__text">Add the first one or import a list.</p>
  <button class="ds-btn ds-btn--tonal" type="button">Add device</button>
</div>
```

At most one sentence and one action; two actions go into `.ds-empty__actions`. A picture takes the disc's place:

```html
<div class="ds-empty ds-empty--page ds-empty--first-use">
  <span class="ds-empty__media" aria-hidden="true"><img src="fleet.svg" alt=""></span>
  <p class="ds-empty__title">Bring your fleet in</p>
  <p class="ds-empty__text">Import a list, or add the first device by hand.</p>
  <div class="ds-empty__actions"><button class="ds-btn ds-btn--filled" type="button">Import a list</button><button class="ds-btn" type="button">Add device</button></div>
</div>

<div class="ds-empty ds-empty--inline ds-empty--no-results">
  <span class="ds-empty__disc" aria-hidden="true">[icon search 16]</span>
  <p class="ds-empty__title">No matches</p>
  <p class="ds-empty__text">Nothing matches "floor 9".</p>
  <button class="ds-btn ds-btn--text" type="button">Clear</button>
</div>
```

**Options** ([options.md](options.md)): classes on the empty state or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the empty state |
|---|---|---|---|
| Place | `.ds-empty--section` (the default, named), `.ds-empty--page`, `.ds-empty--inline` | the empty state | `--section`: at most 400px, 32px of block padding, a 48px disc, in a card or a panel. `--page`: at most 480px, 96px, a 72px disc and the title type, a whole page or panel. `--inline`: full width and left-aligned, disc or picture, words and action in a row, 32px, the label and meta type, 12px of block padding, in a list, a popup or a table cell; its actions take at most half the row and stack when it is narrow |
| Cause | below | the empty state | the disc's colours (below) |
| Tone | `.ds-tone-*` | the empty state itself; an inherited tone is ignored | the disc in the tone's container pair, over a cause |
| Size | `.ds-xs` ... `.ds-xl` | the empty state or a group | 8px of disc and 8px of block padding per step (`--inline`: the disc only, its padding takes neither the step nor `--ds-empty-padding`); the type stays that of its place |
| Density | `.ds-density-*` | any container | 2px of padding per step (so 28px of block padding and 12px at the sides under `themes/compact.css`) |
| Shape | `.ds-shape-*` | any container or the theme | the disc's corners times 0, .5, 1, 1.5: square at 0, a disc at the default |
| Touch | | | not read; its buttons read it |

Why it is empty decides the words, the action and the colours. Icon and words always say it, never the colour alone:

| Cause | Class | Disc | Icon | Title and text say | Action | Role |
|---|---|---|---|---|---|---|
| No data yet | `.ds-empty--no-data` | the tint | the object's | what will appear here | add the first | none |
| First use | `.ds-empty--first-use` | primary container | the object's, or a picture | what this page is for | start | none |
| Not set up | `.ds-empty--not-set-up` | primary container | `settings` | which step is missing | go to the step | none |
| No results | `.ds-empty--no-results` | neutral | `search` | what was searched | clear the filter | `status` |
| No access | `.ds-empty--no-access` | neutral | `lock` | who can give access | request it, if there is a way | none |
| Offline | `.ds-empty--offline` | warning container | `wifiOff` | what cannot be reached, what still works | retry | `status` |
| Error | `.ds-empty--error` | error container | `alertCircle` | what failed, in words | retry | `alert` |

It has no motion of its own; how it comes depends on what brought it ([motion.md](motion.md#data-motion)):

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
the node.

Hooks ([theming.md](theming.md#component-hooks)): `--ds-empty-disc-size` (48px; `--page` 72px, `--inline` 32px; on the
element or in the theme, say for a confirmation page: the ring follows, the glyph keeps the size of its markup, `[icon
check 32]` in a 72px disc), `--ds-empty-disc-bg` and `--ds-empty-disc-color` (over any cause or tone),
`--ds-empty-padding` (not `--inline`), `--ds-empty-media-size` (`--inline`: 32px).

**Accessibility.** The disc and the picture are decoration (`aria-hidden`, `alt=""`); the title says it. One that comes
because of a user's action takes the role of the table above. Keyboard: no stop of its own; `Tab` reaches its action.

**Forced colours.** The fill of the disc goes, the icon and the words stay; the done state's disc keeps an outline.

**Motion:** [Data motion](motion.md#data-motion) in motion.md.
