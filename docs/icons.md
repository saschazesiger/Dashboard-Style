# Icons

One outline set on a 24px grid in the style of [Lucide](https://lucide.dev) (ISC-licensed shapes): stroke width 2,
round caps and joins, colour from `currentColor`. Icons are decorative (`aria-hidden="true"`): the control around
them carries the accessible name. A state or theme recolours them with `color`.

```js
import { icon, iconElement, check, arrowRight } from './vendor/dashboard-style/js/icons.js';

button.insertAdjacentHTML('beforeend', icon(check, 16));    // markup string
button.append(iconElement(arrowRight, 16, 'my-hook'));      // SVGElement, no innerHTML (strict CSP)
```

Classic script: `DS.icons.icon(DS.icons.check, 16)`, `DS.icons.iconElement(DS.icons.check)`.

| Export | |
|---|---|
| `icon(glyph, size?, className?)` | SVG markup; size defaults to `ICON_SIZE`; throws `Unknown icon` for anything that is not a glyph (a misspelt name is `undefined`) |
| `iconElement(glyph, size?, className?, doc?)` | the same SVG built with `createElementNS`, for pages that forbid parsing HTML |
| `ICON_SIZE` | 20 |
| every glyph | a named export holding inner SVG markup; bundlers ship only the ones you import |

## Sizes

20px for navigation, icon buttons, alerts and tile labels; 16px inside buttons, chips, status chips, lists and meta
lines; 18px for the check in a filter chip; 24px in the empty-state disc.

## Glyphs

| Group | Names |
|---|---|
| Arrows | `arrowRight` `arrowLeft` `arrowUp` `arrowDown` `chevronDown` `chevronUp` `chevronRight` `chevronLeft` `external` |
| Actions | `plus` `close` `minimize` `menu` `moreVertical` `search` `filter` `sort` `compose` `pencil` `save` `reset` `sync` `undo` `history` `copy` `download` `trash` `archive` `logout` |
| Communication | `chat` `mail` `phone` `globe` `link` `flag` `thumbUp` `thumbDown` |
| Status | `check` `checkCircle` `alert` `alertCircle` `info` `clock` `ban` `calendar` `activity` `wifi` `wifiOff` |
| Places and things | `overview` `apps` `list` `columns` `rows` `barChart` `settings` `cpu` `lock` `key` `shield` `user` `users` `userPlus` `ticket` `file` `fileText` `fileCode` `folder` `box` `building` `mapPin` `laptop` `monitor` `hardDrive` `server` `graduationCap` `presentation` `camera` `video` `image` `leaf` `wrench` `sparkles` |

The [styleguide](../styleguide/index.html#icons) shows them all. Notes:

- `check` has `pathLength="1"`, so it can draw itself (`ds-draw`, [motion.md](motion.md#keyframes)).
- `thumbUp` and `thumbDown` end with the outline path: fill it (`path:last-child { fill: currentColor }`) to show a
  chosen state by shape, not only colour.
- `calendar` and `close` are also drawn by `components/form.css` as masks (date fields, the search's clear button).
- `clock` means waiting, `ban` switched off or not set up.

## Adding glyphs

Add a named export to `src/js/icons.js` in the same style: flat `<path>`, `<circle>`, `<rect>`, `<line>`,
`<polyline>` or `<ellipse>` elements with plain attributes on the 24px grid, no `stroke`, `fill`, `class` or colour of
their own (the tests check it). Keep one set: a new icon goes here, not into a page. Brand logos are not glyphs; keep
them in your project.
