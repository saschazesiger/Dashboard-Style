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

Markup that names its icons (a server template, a static page) draws them with one call:

```html
<span data-icon="bell" data-icon-size="16"></span>
```

```js
DS.icons.fill(document);   // every [data-icon] element gets its glyph, through DOM APIs (no innerHTML)
```

| Export | |
|---|---|
| `icon(glyph, size?, className?)` | SVG markup; size defaults to `ICON_SIZE`; throws `Unknown icon` for anything that is not a glyph (a misspelt name is `undefined`) |
| `iconElement(glyph, size?, className?, doc?)` | the same SVG built with `createElementNS`, for pages that forbid parsing HTML |
| `fill(root?)` | fills every `[data-icon]` element inside `root` (default `document`, `root` itself included) with the named glyph at `data-icon-size` px (default 20), built like `iconElement()`; idempotent (an element that shows the same glyph at the same size keeps its `<svg>`, a new name or size draws again); returns how many it drew and throws `Unknown icon: <names>` after drawing the known ones |
| `ICON_SIZE` | 20 |
| every glyph | a named export holding inner SVG markup; bundlers ship only the ones you import |

## Sizes

20px for navigation, icon buttons, alerts and tile labels; 16px inside buttons, chips, status chips, lists and meta
lines; 18px for the check in a filter chip; 24px in the empty-state disc.

## Glyphs

| Group | Names |
|---|---|
| Arrows | `arrowRight` `arrowLeft` `arrowUp` `arrowDown` `chevronDown` `chevronUp` `chevronRight` `chevronLeft` `chevronFirst` `chevronLast` `cornerDownLeft` `external` |
| Actions | `plus` `close` `minimize` `menu` `moreVertical` `moreHorizontal` `grip` `search` `filter` `sort` `compose` `pencil` `save` `reset` `sync` `undo` `history` `copy` `download` `upload` `clipboard` `paperclip` `printer` `play` `pause` `stopCircle` `trash` `archive` `logout` |
| Communication | `chat` `send` `bell` `mic` `micOff` `volume` `mail` `phone` `globe` `link` `flag` `thumbUp` `thumbDown` |
| Status | `check` `checkCircle` `alert` `alertCircle` `info` `helpCircle` `eye` `eyeOff` `clock` `ban` `calendar` `activity` `wifi` `wifiOff` |
| Places and things | `home` `panelLeft` `keyboard` `terminal` `tag` `sun` `moon` `overview` `apps` `list` `columns` `rows` `barChart` `settings` `cpu` `lock` `key` `shield` `user` `users` `userPlus` `ticket` `file` `fileText` `fileCode` `folder` `box` `building` `mapPin` `laptop` `monitor` `hardDrive` `server` `graduationCap` `presentation` `camera` `video` `image` `leaf` `wrench` `sparkles` |

109 glyphs. 2.0 added `chevronFirst`, `chevronLast`, `cornerDownLeft`, `moreHorizontal`, `upload`, `clipboard`,
`paperclip`, `send`, `printer`, `play`, `pause`, `stopCircle`, `grip`, `bell`, `mic`, `micOff`, `volume`, `helpCircle`,
`eye`, `eyeOff`, `home`, `panelLeft`, `keyboard`, `terminal`, `tag`, `sun` and `moon`, and swapped the two paths of
`flag` (the pole first, the flag last): a project that copies glyph strings refreshes `flag`.

The [styleguide](../styleguide/index.html#icons) shows them all. Notes:

- `check` and the tick of `checkCircle` have `pathLength="1"`, so they can draw themselves (`ds-draw`,
  [motion.md](motion.md#keyframes); the done face of a button; `.ds-icon-swap`). The check is drawn from its short
  arm, left to right, like the checks of chips and checkboxes.
- Icon swaps (copy to check, play to pause) are a crossfade with a scale, not a path morph: `.ds-icon-swap` or
  `DS.motion.crossfade(el, icon, { kind: 'icon' })` ([motion.md](motion.md#dsmotion-jsmotionjs)).
- Icons that fill when on: the fillable glyphs `thumbUp`, `thumbDown`, `chat`, `shield`, `folder`, `flag`, `bell`,
  `home`, `moon` and `play` end with a closed outline (tested). `.ds-icon--fillable` on the `<svg>` fills that last
  element in `currentColor` while an ancestor is `[aria-pressed="true"]` or `[aria-checked="true"]` (the fill fades on
  `--ds-dur-fast`), so a chosen state shows by shape, not only colour; `.ds-icon--filled` fills it always. A rating
  toggle:

  ```html
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-label="Helpful">[icon thumbUp 20 ds-icon--fillable]</button>
  ```
- `calendar`, `close` and `check` are also drawn by `components/form.css` as masks (date fields, the search's clear
  button, the drawn checkbox; its check at stroke width 3).
- `clock` means waiting, `ban` switched off or not set up.

## Adding glyphs

Add a named export to `src/js/icons.js` in the same style: flat `<path>`, `<circle>`, `<rect>`, `<line>`,
`<polyline>` or `<ellipse>` elements with plain attributes on the 24px grid, no `stroke`, `fill`, `class` or colour of
their own (the tests check it). Keep one set: a new icon goes here, not into a page. Brand logos are not glyphs; keep
them in your project.
