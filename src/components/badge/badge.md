## Badge

A count or a dot on a button, chip, tab or drawer item:

```html
<button class="ds-btn" type="button">[icon mail 16]Inbox <span class="ds-badge">3</span></button>
<label class="ds-chip"><input class="ds-chip__input" type="checkbox" name="state" value="failed"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Failed</span> <span class="ds-badge ds-tone-error">2</span></span></label>
<span class="ds-badge ds-tone-neutral">12</span>
<span class="ds-badge" data-ds-badge="128" data-ds-badge-max="99"></span>          <!-- shows 99+ -->
<button class="ds-btn ds-btn--quiet" type="button">Tasks <span class="ds-badge ds-badge--dot ds-tone-primary"><span class="ds-sr">New tasks</span></span></button>
```

**Options** ([options.md](options.md)): classes on the badge or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the badge |
|---|---|---|---|
| Variant | `.ds-badge--dot` | the badge | a dot, `--ds-badge-dot-size` (8px at md), always round; needs its word, in `.ds-sr` inside it or beside it |
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error`; none: the tint (a dot: `--ds-primary`, so it holds 3:1 on a surface) | the badge itself; an inherited tone is ignored, so a badge in an error alert stays what it was | the tone's container pair (a dot: the full colour) |
| Size | `.ds-xs` ... `.ds-xl` | the badge or a group: a small button takes a small badge | 2px per step, 16 to 24px (a dot 4 to 12px); the caption type stays |
| Shape | `.ds-shape-*` | any container or the theme | the corners times 0, .5, 1, 1.5, at most half the height; a dot stays round |
| Density, touch | | | not read: it sits in a line or on a control, and it is no target |

- A pill of at least `--ds-badge-size` (20px at md) in the caption type with tabular figures, on the tint
  (`--ds-badge-bg`, `--ds-badge-color`: `--ds-accent`, `--ds-on-accent`; radius `--ds-badge-radius`, never above half
  the size). A toned badge needs its word in the row ("Failed", "2 errors"): colour is never the only signal. An empty
  badge takes no room; an empty dot does.
- `.ds-badge--neutral`, `.ds-badge--ok`, `.ds-badge--warning`, `.ds-badge--error` are **deprecated** (3.0, removed when
  3.0 ships): `.ds-tone-neutral`, `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the badge, the same look
  under the option every component shares.
- On a tinted host (a pressed toggle, `.ds-btn--tonal`, an open disclosure button, a checked chip, an input chip, a
  selected table row) the default badge turns to `--ds-primary` / `--ds-on-primary` and the neutral one to
  `--ds-surface` / `--ds-text-2`, so it never melts into the tint. In a disabled or `aria-disabled` button, chip, tab
  or drawer item it takes the disabled model over any tone (`--ds-disabled-fill`, `--ds-disabled-ink`; a theme that
  dims instead keeps its colours and fades it with the host).
- A dot without a tone on a filled button takes the fill's ink (`--ds-on-primary`), where primary would vanish.
- Hooks: `--ds-badge-size`, `--ds-badge-dot-size`, `--ds-badge-radius`, `--ds-badge-bg`, `--ds-badge-color`
  ([theming.md](theming.md#component-hooks)).

**On an icon button's corner.** `.ds-badge--corner`, a direct child of the icon button (or of an avatar, or any
positioned element), hangs a quarter of its height over the top end corner; a dot sits inside the corner, on the edge
of a round host. A press on it presses the host, also where it hangs over the edge. The host's name carries the count, so the
badge is `aria-hidden`:

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Notifications, 3 new" data-tip="Notifications">
  [icon bell 20]<span class="ds-badge ds-badge--corner ds-tone-error" aria-hidden="true">3</span>
</button>
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Messages, new ones">
  [icon mail 20]<span class="ds-badge ds-badge--corner ds-badge--dot" aria-hidden="true"></span>
</button>
```

A ripple host clips while a ripple is inside, which would cut the badge: a host that holds a `.ds-badge--corner` keeps
no clip, and its ripple clips itself instead (a box over the host with the host's radius, following the press morph;
[ripple](#ripple)). Keep the count short (`data-ds-badge-max="9"` gives `9+`) so it does not cover the icon.

**A count with a maximum.** `data-ds-badge` holds the count and `data-ds-badge-max` the largest figure (default 99):
past it the badge shows `99+`, at zero or below nothing, so it takes no room. `DS.init()` finds them, and a change of
either attribute updates the figure. From the page:

```js
const badge = DS.badge.create(el, { value: 3, max: 99 });   // or DS.core.get(el, 'badge') on the attribute path
badge.set(128);                                             // 99+
badge.get();                                                // 128
badge.on('change', ({ value, text }) => { /* also a bubbling ds:change on the badge */ });
DS.badge.format(128);                                       // '99+', for a page that renders the text itself
```

`DS.badge.create` returns the controller (`get`, `set`, `on`, `destroy`); `DS.badge.format` is the pure function behind
it. A page that re-renders with `DS.dom.morphHtml` writes the text in its template as well (`DS.badge.format(count)`):
a patch puts back the children of its template.

**Accessibility.** Give the host an accessible name that includes the count where it matters (`aria-label="Inbox, 3
new"`), or keep the number in the text as above: `99+` is what a screen reader hears from the figure. A dot says
nothing without its word. A badge is no stop of its own: `Tab` reaches its host.

**Forced colours.** `Canvas` and `CanvasText` with a `CanvasText` outline (`GrayText` in a blocked host), so a dot stays
visible; a tone changes nothing there, so the word carries the meaning.

**Motion.** Colours glide on `--ds-dur-fast`. A count that appears pops in (`DS.motion.enter(badge, 'pop')`), one that
goes pops out (`DS.motion.leave(badge, 'pop', { then: 'hide' })`), which the controller's `set()` does by itself; the
number itself changes at once, and nothing plays on load ([motion.md](motion.md#a-count-badge)).

<!-- changelog -->
- Badge: `.ds-badge--corner` puts a count or a dot on the corner of an icon button (or an avatar, any positioned host); the host's ripple clips itself instead of the host, so the badge stays whole (catalogue D, reopened from after-2.0).
