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
<button class="ds-btn" type="button" data-icon="plus" data-icon-size="18" data-icon-place="start">Add device</button>
```

```js
DS.icons.fill(document);   // every [data-icon] element gets its glyph, through DOM APIs (no innerHTML)
```

The glyph replaces the element's content. With `data-icon-place="start"` or `"end"` (2.1) it goes in as the first or
last child and the content stays: a labelled button, chip or alert written as markup gets its leading icon where the
component rules expect it (`> svg:first-child`).

| Export | |
|---|---|
| `icon(glyph, size?, className?)` | SVG markup; size defaults to `ICON_SIZE`; throws `Unknown icon` for anything that is not a glyph (a misspelt name is `undefined`) |
| `iconElement(glyph, size?, className?, doc?)` | the same SVG built with `createElementNS`, for pages that forbid parsing HTML |
| `fill(root?)` | fills every `[data-icon]` element inside `root` (default `document`, `root` itself included) with the named glyph at `data-icon-size` px (default 20), built like `iconElement()`; the glyph replaces the content, or with `data-icon-place="start"` / `"end"` (2.1) goes in first or last beside it; idempotent (an element that shows the same glyph at the same size keeps its `<svg>`, a new name or size draws again, replacing only that `<svg>` where it stands; a placed glyph that went missing is put back); returns how many it drew and throws `Unknown icon: <names>` after drawing the known ones |
| `ICON_SIZE` | 20 |
| every glyph | a named export holding inner SVG markup; bundlers ship only the ones you import |

## Sizes

20px for navigation, icon buttons, alerts and tile labels; 16px inside buttons, chips, status chips, lists and meta
lines; 18px for the check in a filter chip; 24px in the empty-state disc. A 16px glyph leading a meta line
(`.ds-meta`, `.ds-timeline__meta`, as its first child) sits on its text line, `--ds-space-1` before the text, without
growing the line.

## Glyphs

| Group | Names |
|---|---|
| Arrows and navigation | `arrowRight` `arrowLeft` `arrowUp` `arrowDown` `chevronDown` `chevronUp` `chevronRight` `chevronLeft` `chevronFirst` `chevronLast` `cornerDownLeft` `external` `arrowUpRight` `arrowUpLeft` `arrowDownRight` `arrowDownLeft` `arrowLeftRight` `cornerUpLeft` `chevronsLeft` `chevronsRight` `login` `launch` |
| Actions | `plus` `close` `minimize` `menu` `moreVertical` `moreHorizontal` `grip` `search` `filter` `sort` `compose` `pencil` `save` `reset` `sync` `undo` `history` `copy` `download` `upload` `clipboard` `paperclip` `printer` `play` `pause` `stopCircle` `trash` `archive` `logout` |
| Communication | `chat` `send` `bell` `mic` `micOff` `volume` `mail` `phone` `globe` `link` `flag` `thumbUp` `thumbDown` |
| Status and feedback | `check` `checkCircle` `alert` `alertCircle` `info` `helpCircle` `eye` `eyeOff` `clock` `ban` `calendar` `activity` `wifi` `wifiOff` `shieldCheck` `shieldAlert` `unlock` `fingerprint` `verified` `bug` `bookmark` `pin` `star` `starHalf` `heart` `smilePlus` `bellOff` `volumeOff` `circleX` `octagonAlert` `circle` `circleDot` `square` `squareCheck` `squareMinus` `toggleOn` `toggleOff` |
| Places and things | `home` `panelLeft` `keyboard` `terminal` `tag` `sun` `moon` `overview` `apps` `list` `columns` `rows` `barChart` `settings` `cpu` `lock` `key` `shield` `user` `users` `userPlus` `ticket` `file` `fileText` `fileCode` `folder` `box` `building` `mapPin` `laptop` `monitor` `hardDrive` `server` `graduationCap` `presentation` `camera` `video` `image` `leaf` `wrench` `sparkles` |
| Files | `fileImage` `fileArchive` `fileSpreadsheet` `fileJson` `filePlus` `fileCheck` `fileDown` `fileUp` `files` `folderOpen` `folderPlus` `cloudUpload` `cloudDownload` |
| Data and charts | `lineChart` `areaChart` `barChartHorizontal` `pieChart` `donutChart` `scatterChart` `gauge` `trendingUp` `trendingDown` `table` `tableProperties` `filterX` `sortAscending` `sortDescending` `group` `layoutGrid` `listTree` `kanban` |
| Editing | `bold` `italic` `code` `quote` `heading` `listOrdered` `unlink` `redo` `cut` `paste` `duplicate` `gripHorizontal` `move` `resize` `expandAll` `collapseAll` `fullscreen` `fullscreenExit` `splitView` `panelRight` `wrapText` |
| People | `userMinus` `userCheck` `userX` `userCircle` `idCard` `network` |
| Devices and infrastructure | `database` `cloud` `cloudOff` `memory` `router` `smartphone` `tablet` `terminalSquare` `braces` `gitBranch` `gitCommit` `gitMerge` `gitPullRequest` `gitCompare` `webhook` `plug` `power` `qrCode` `barcode` `scan` |
| Time | `calendarDays` `calendarCheck` `calendarPlus` `calendarRange` `timer` `hourglass` `refresh` `repeat` |
| AI and chat | `sparkle` `wand` `bot` `chatText` `chatDots` `reply` `audioLines` `videoOff` `skipForward` `skipBack` `atSign` |
| Commerce and admin | `creditCard` `receipt` `wallet` `coupon` `tags` `cart` `truck` `map` `route` `compass` `anchor` `languages` `palette` `brush` `contrast` `mailOpen` `inbox` `archiveRestore` `clipboardCheck` `share` `sliders` `layers` `stack` `puzzle` `rocket` `lightbulb` `beaker` `book` `newspaper` `megaphone` `gift` `trophy` `medal` `target` `zap` `scrollText` |

275 glyphs. 3.0 added 166 for the component catalogue: the new names of the "Arrows and navigation" and "Status and
feedback" rows and the rows from "Files" on. They come from Lucide like the rest, in the drawing the existing families
use (the `file` outline, the `chat` bubble, the `calendar` frame); `donutChart` is drawn for this set on the same grid.
Brand logos stay out. 2.0 added `chevronFirst`, `chevronLast`, `cornerDownLeft`, `moreHorizontal`, `upload`, `clipboard`,
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
- `calendar`, `clock`, `close` and `check` are also drawn by `components/form.css` as masks (date fields, time
  fields, the search's clear button, the drawn checkbox; its check at stroke width 3).
- `clock` means waiting, `ban` switched off or not set up.

## Adding glyphs

Add a named export to `src/js/icons.js` in the same style: flat `<path>`, `<circle>`, `<rect>`, `<line>`,
`<polyline>` or `<ellipse>` elements with plain attributes on the 24px grid, no `stroke`, `fill`, `class` or colour of
their own (the tests check it). Keep one set: a new icon goes here, not into a page. Brand logos are not glyphs; keep
them in your project.
