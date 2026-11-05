## Link

A link that navigates: inline in text, standalone, external with its icon, or quiet next to the main one. An action that
does something on the page is a [Button](#button) (`.ds-link-btn` when it must read like a link).

```html
<p>Assigned to <a class="ds-link" href="/people/ada">Ada Lovelace</a> since Monday.</p>       <!-- inline -->
<a class="ds-link ds-link--standalone" href="/devices">All devices[icon arrowRight 16 ds-link__icon]</a>
<a class="ds-link ds-link--external" href="https://example.com/manual" target="_blank" rel="noopener noreferrer">
  Product manual[icon external 16 ds-link__icon]<span class="ds-sr"> (opens in a new tab)</span></a>
<a class="ds-link ds-link--standalone ds-link--external" href="https://example.com/status" target="_blank"
   rel="noopener noreferrer">Service status[icon external 16 ds-link__icon]<span class="ds-sr"> (opens in a new tab)</span></a>
<a class="ds-link--quiet" href="/devices/42/history">Show history</a>                        <!-- quiet -->
```

### Variants

| Variant | Classes | Use |
|---|---|---|
| Inline | `.ds-link` | a link in running text: the link colour (`--ds-link`) and the underline (`--ds-link-underline`, the shared geometry); the look of every `<a>` under `.ds-base`, for a page or a region without it |
| Standalone | `.ds-link .ds-link--standalone` | a link on its own line, at the end of a card or under a list ("All devices"): the label role, no underline at rest (its place tells it apart), the underline on hover, press and keyboard focus; an optional trailing `.ds-link__icon` (`arrowRight`, `chevronRight`) |
| External | `.ds-link .ds-link--external` | a link that leaves the product: a trailing `.ds-link__icon` with `DS.icons.external`; with `target="_blank"` write `rel="noopener noreferrer"` and a `.ds-sr` "(opens in a new tab)". Combines with `--standalone` |
| Quiet | `.ds-link--quiet` | a secondary link next to the main one: `--ds-text-2` with a hairline underline in `--ds-line-2`; the link colour and `--ds-link-underline-hover` on hover. Still underlined. Alone, without `.ds-link`; its rules ship with the [Button](#button) stylesheet, next to its twin `.ds-link-btn--quiet` |

`.ds-link__icon` is an icon after the link's words (in a standalone link also before them): 1em square, on the text's
centre line, `--ds-space-1` from the text. It never moves, also on hover.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | a standalone link or an ancestor | the size's type role (`--ds-size-font`, else the label role; hook `--ds-link-font`); an inline link keeps the type of its text |
| Touch | `.ds-touch` | the theme or a container | a standalone link is at least `--ds-target-min` (48px) high; an inline link in text is exempt (WCAG 2.5.8) |
| Shape | `.ds-shape-*` | any container | the focus ring's small radius (`--ds-radius-xs`) times `--ds-shape` |
| Density | | | nothing: a link has no box of its own |

Links never take a tone: a status is said with a [status chip](#status-chip) or a [badge](#badge), never with a red link.

### Accessibility

- An `<a href>`: Tab reaches it, Enter follows it. Its text says where it goes ("All devices", never "Click here");
  an icon is `aria-hidden` (`DS.icons.icon` writes it).
- In running text a link is told apart by its underline, not by colour alone; a standalone link stands apart from text
  and takes the underline on hover and keyboard focus.
- External: `target="_blank"` only where the user would lose work otherwise; then the `.ds-sr` text says it, and
  `rel="noopener noreferrer"` keeps the new page from the opener.
- Focus: the ring (`--ds-focus-outline`) is solid from the first frame and snaps from offset + width to its offset in
  `--ds-dur-fast`.
- Forced colours: the system's `LinkText`; a standalone link keeps its underline at rest there, since colour alone no
  longer tells it apart.

### Hooks

`--ds-link-font` (a standalone link's type). The colours are the link roles: `--ds-link`, `--ds-link-underline`,
`--ds-link-underline-hover`, `--ds-link-underline-thickness`, `--ds-link-underline-offset`
([tokens.md](tokens.md)).

**Motion:** the ink and the underline colour fade on `--ds-dur-fast`; a press on a touch screen darkens the underline
as hover does. A link is inline text: no state layer, no ripple, no press morph, and hover moves nothing.

<!-- changelog -->
- Link (3.0): `.ds-link` (inline), `.ds-link--standalone`, `.ds-link--external` with `.ds-link__icon`, and the hook
  `--ds-link-font`; the quiet link (`.ds-link--quiet`) is documented with them and still ships in button.css.
