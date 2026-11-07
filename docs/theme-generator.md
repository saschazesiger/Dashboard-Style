# Theme generator

`tools/theme.mjs` turns one seed colour into a theme file. The file sets every colour role of the system, in the light
and the dark scheme at once, and every contrast pair of the theme check passes in both. The tool runs without network
or dependencies (Node 18 or later), and the same function runs in a browser.

```sh
node vendor/dashboard-style/tools/theme.mjs --seed '#0b57d0' --name brand --out css/theme.css
```

```html
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
<link rel="stylesheet" href="css/theme.css">
```

The file replaces both a hand-written palette and `themes/dark.css`: it carries both schemes. Type, radii, hooks and
your own tokens go into a second theme file loaded after it (see [Theming](theming.md)).

> **Browser floor.** The generated files use `light-dark()`, which needs Safari 17.5, Chrome/Edge 123 or Firefox 130
> (the 3.0 floor). On an older browser the colour roles do not resolve. For the 2.x floor, keep
> [`themes/dark.css`](../themes/dark.css) and a light theme of your own.

## Options

| Option | Default | What |
|---|---|---|
| `--seed <colour>` | required | the brand colour: the primary palette and, by the scheme, the neutrals and the chart series |
| `--scheme <name>` | `tonal` | `tonal`, `vibrant`, `neutral`, `fidelity` or `monochrome` (below) |
| `--contrast <level>` | `standard` | `standard`, `medium` or `high` (below) |
| `--neutral <colour>` | from the seed | hue and chroma of both neutral palettes (surfaces, text, lines) |
| `--accent <colour>` | the primary palette | the tint (`--ds-accent`, `--ds-on-accent`) |
| `--error <colour>` | hue 25, chroma 84 | the error palette (Material's) |
| `--success <colour>` | `#146c2e` | the success palette |
| `--warning <colour>` | `#8f4e06` | the warning palette |
| `--name <name>` | `custom` | named in the file's header |
| `--out <file>` | stdout | where the theme goes |

A colour is `#rgb`, `#rrggbb`, `rgb()` or `oklch()`; an `oklch()` seed outside sRGB is gamut mapped first (CSS Color 4,
keeping lightness and hue). The CLI prints a summary on stderr and exits 1 if a check fails, 2 on a usage error.

## Schemes

The palettes come from HCT (hue, chroma, tone), the colour space of Material Color Utilities, ported dependency-free
into `tools/color.mjs`. A scheme decides how much chroma each palette gets; tone 0 is black, 100 white.

| Scheme | Primary | Neutrals (surfaces / text and lines) | Use |
|---|---|---|---|
| `tonal` | seed hue, chroma 36 | chroma 6 / 8 | calm, the Material default (tonal spot) |
| `vibrant` | seed hue, the most chroma sRGB holds | chroma 10 / 12 | a loud brand |
| `neutral` | seed hue, chroma 12 | chroma 2 / 2 | almost grey, a hint of the seed |
| `fidelity` | the seed's own hue and chroma | the seed's chroma / 8, and that plus 4 | the seed exactly as given |
| `monochrome` | grey | grey | no colour except status and charts |

The status palettes (error, success, warning) and the chart series keep their colour in every scheme: status is
never told by colour alone, but colour still helps. The chart series beside `--ds-chart-1` (the primary) sit at fixed hue
steps from the primary hue, the steps of the default palette (blue, orange, teal, purple). The syntax colours
(`--ds-code-keyword` ... `--ds-code-deleted`) keep fixed hues whatever the seed and the scheme, those of `tokens.css`
(the comment grey takes the neutral variant palette), at the tones of `tokens.css` and `themes/dark.css`, and of
`themes/contrast.css` at the high level; each is a text pair on `--ds-code-bg`.

## Contrast levels

| Level | Text pairs | Controls, icons, outlines, chart marks | Tones |
|---|---|---|---|
| `standard` | 4.5:1 | 3:1 | Material's tones |
| `medium` | 6:1 | 4:1 | halfway |
| `high` | 7:1 | 4.5:1 | as [`themes/contrast.css`](../themes/contrast.css) sets them: secondary text as text, lines at the outline tone, a stronger tint; plus `--ds-focus-width: 3px` and `--ds-link-underline: currentColor` |

A `high` file is a complete theme. Load it for users who ask for more contrast, after the standard one:

```html
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="css/theme-contrast.css" media="(prefers-contrast: more)">
```

## Light and dark in one file

Every colour role is written as `light-dark(<light>, <dark>)`:

```css
.ds-theme {
  --ds-color-scheme: light dark;
  --ds-primary: light-dark(#0856cf, #b2c5ff);
  /* ... */
}
.ds-theme[data-ds-scheme="light"] { --ds-color-scheme: light; }
.ds-theme[data-ds-scheme="dark"] { --ds-color-scheme: dark; }
```

`tokens.css` sets `color-scheme` on every `.ds-theme` element from `--ds-color-scheme`. The roles are unregistered
custom properties, so `light-dark()` is resolved where a component uses the colour, by that element's colour scheme.
So:

- Without the attribute, the system's setting decides (`light dark`), and scrollbars and native controls follow it.
- `data-ds-scheme="light"` or `"dark"` on a `.ds-theme` element pins the scheme for that element and everything in
  it. A user's choice of appearance sets it on `<html class="ds-theme">`, before the first paint, the way
  [Theming](theming.md#dark-compact-and-contrast) describes for the dark link.
- A nested `.ds-theme` region can take the other scheme.
- The derived roles (`--ds-primary-hover`, `--ds-link-underline`, `--ds-fill-round`, `--ds-disabled-fill` ...) mix
  `light-dark()` values and follow by themselves.

Shadows are not colours, so a shadow cannot be one `light-dark()`. Its colour parts are: `--ds-elev-1` to
`--ds-elev-3` cast grey in the light scheme and black in the dark. The scrims (`--ds-scrim`, `--ds-scrim-nested`)
darken in the dark scheme as in `themes/dark.css`. The shimmer's glint (`--ds-shimmer-glint`) stays white in both.

## What it guarantees

- **Every pair, both schemes.** Every pair of `TEXT_PAIRS`, `CONTROL_PAIRS`, `ICON_PAIRS` and `CHART_PAIRS` in
  `tools/theme-rules.mjs` reaches its minimum on the final hex values, in light and in dark (WCAG 2). The roles that
  only read another role (`--ds-link`, `--ds-focus`, `--ds-action-ink`, `--ds-chart-1` read the primary, `--ds-chart-track`
  reads `--ds-surface-high` ...) are checked through it.
- **Tones move, the pairs stay.** A seed that would fail a pair, such as a light yellow whose primary is too pale on
  white, gets its tone moved: the foreground moves away from its ground, and the ground only when the foreground is
  already black or white. The surfaces never move. The header of the file lists every moved tone.
- **The theme check passes.** The CLI runs `tools/check-theme.mjs` on the light and the dark view of what it writes
  and exits 1 on a finding. `check-theme.mjs` also reads `light-dark()` itself: on the file as written it checks every
  pair in both schemes, so `node tools/check-theme.mjs themes/presets/ocean.css` passes as well.
- **The roles of `themes/dark.css`, and nothing else.** It sets every colour role that does not follow another role
  by itself, plus the floating surfaces (`--ds-surface-overlay`, `--ds-surface-popover`), `--ds-color-scheme`, the
  scrims, the shimmer's glint and the shadows. It never sets a scale, a hook or a motion token, and it stays unlayered.
- **sRGB hex.** HCT tones are always inside sRGB, so every value is hex. OKLCH would only be needed for a colour
  outside sRGB, which the generator never writes.
- **Deterministic.** The same options give the same file, byte for byte. Regenerate it rather than editing it; the
  header holds the command.

A test (`test/theme-generator.test.js`) runs 60 seeds across the hue wheel and the chroma range through every
scheme and contrast level, and checks every pair in both schemes.

## Presets

Generated by `node scripts/tools/theme.mjs --presets`, shipped in `themes/presets/` (each with a `-contrast` file at
the `high` level), and kept up to date by a test.

| Preset | Seed | Scheme | Character |
|---|---|---|---|
| [`default`](../themes/presets/default.css) | `#0b57d0`, neutral `#74777f` | `fidelity` | the 2.x palette: the seed is `--ds-primary` of `tokens.css` |
| [`slate`](../themes/presets/slate.css) | `#475d78` | `neutral` | quiet blue-grey, almost no colour |
| [`ocean`](../themes/presets/ocean.css) | `#00658f` | `fidelity` | deep sea blue |
| [`forest`](../themes/presets/forest.css) | `#2f6b3a` | `fidelity` | muted green |
| [`violet`](../themes/presets/violet.css) | `#6750a4` | `tonal` | soft violet (Material's baseline seed) |
| [`amber`](../themes/presets/amber.css) | `#9a5b00` | `fidelity` | warm amber |
| [`rose`](../themes/presets/rose.css) | `#b3264d`, neutral `#807475` | `fidelity` | deep rose on nearly neutral surfaces |
| [`graphite`](../themes/presets/graphite.css) | `#3c4043` | `monochrome` | greys only; status and charts keep their colour |

```html
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
<link rel="stylesheet" href="vendor/dashboard-style/themes/presets/ocean.css">
<link rel="stylesheet" href="vendor/dashboard-style/themes/presets/ocean-contrast.css" media="(prefers-contrast: more)">
```

## In JavaScript

`tools/theme.mjs` imports only `color.mjs` and `theme-rules.mjs`, so a page can import it directly. The CLI's
`node:` imports are dynamic and run only from the command line.

```js
import { generateTheme } from './vendor/dashboard-style/tools/theme.mjs';

const { css, light, dark, moves, report } = generateTheme({ seed: '#0b57d0', scheme: 'fidelity', contrast: 'standard', name: 'brand' });
```

| Export | What |
|---|---|
| `generateTheme(options)` | the options of the CLI as `{ seed, scheme, contrast, neutral, accent, error, success, warning, name }` (colours as text or ARGB integers); returns `{ css, light, dark, moves, report, options }`: the stylesheet, the hex of every role per scheme, the moved tones (`{ scheme, role, from, to }`), every pair per scheme (`{ scheme, kind, fg, bg, min, ratio, apca }`) and the options as read |
| `pickScheme(css, scheme)` | the stylesheet as `light` or `dark` sees it: every `light-dark(a, b)` replaced by one branch (`pickLightDark()` of `theme-rules.mjs`) and `--ds-color-scheme` set to that scheme, for tools that do not read `light-dark()` |
| `presetFiles()` | the preset files, `Map` of file name to CSS |
| `PRESETS`, `SCHEMES`, `CONTRAST_LEVELS`, `ROLES`, `FOLLOWS` | the presets, the scheme names and their HCT variants, the minimums per level, the role table (palette and tones), the roles checked through another |

`tools/color.mjs` holds the colour science: `Hct`, `Cam16`, `ViewingConditions`, `TonalPalette`,
`schemePalettes(variant, hct)`, `DislikeAnalyzer`, `TemperatureCache` and `Contrast` (the port), plus
`parseColor()`, `hexFromArgb()`, `oklchFromArgb()`, `argbFromOklch()` (gamut mapped), `wcagContrast()` and
`apcaContrast()`. Colours are ARGB integers, as in Material Color Utilities. The port reproduces MCU's reference
values bit for bit (the tests quote them). It ports the palettes of the scheme variants (MCU's 2021 spec), not MCU's
dynamic colours: the system has its own roles and its own pairs.

## APCA (advisory)

`report` carries the APCA lightness contrast (Lc, APCA-W3 0.0.98G-4g) of every pair, and the CLI prints the lowest
text pair per scheme. APCA models perceived contrast better than WCAG 2, above all for light text on dark grounds,
where WCAG 2 overrates contrast. But it is not a conformance target yet. The generator guarantees WCAG 2, never APCA,
and never moves a tone for APCA. Read a low Lc (under about 60 for body text) as a hint to choose a darker or lighter
seed, or a higher contrast level.

## Limits

- The warning palette has one hue. The 2.x light theme pairs an orange ink with a yellow container; a generated theme
  shows a pale wash of the warning hue instead.
- The chart series follow the primary hue at fixed steps. A seed close to a status hue (red, green, amber) puts a
  series near that status colour, and the series keep their words and legends, as always.
- Light text on dark grounds passes WCAG 2 at lower APCA values: the dark `--ds-text-3` is the lowest pair of most
  seeds. Use `medium` where that matters.
