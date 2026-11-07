## Shimmer

"Something is at work" on the words themselves: a soft glint travels over the text of a status line, left to right, a
pass and a pause, and nothing else on the line moves. No spinner or bar beside the text.

```html
<span class="ds-shimmer" data-shimmer="Running npm test">Running npm test</span>
<span class="ds-wheel"><span class="ds-wheel__line ds-shimmer" data-shimmer="Thinking">Thinking</span></span>
```

`data-shimmer` is the text as it reads (the same words and spaces). The text keeps its own colour; the wave is a copy
of it on top in the line's own type, so it lies on the letters and is cut with the same ellipsis. Give the whole line
one weight (`<strong class="ds-shimmer">`): a bold word inside a regular line would be wider than its copy. Remove the class or the
attribute when the work ends: the glint goes at once, the text stays. A `.ds-wheel` line takes it from
`DS.wheel.roll(slot, text, { shimmer: true })` or `data-ds-wheel-shimmer` ([Wheel](#wheel)).

- The copy is in `--ds-shimmer-glint` (white in every theme: over dark text it reads as a faint sheen passing, over
  light text in the dark theme as a soft glint), shown through a horizontal mask only in a soft band: transparent to
  32%, `--ds-shimmer-peak` at 50% (only its alpha counts: 55% of the text at the crest, a sheen in the background,
  never wiping the words out), transparent from 68% of a tile `--ds-shimmer-length` (480px) long, repeated along the
  line.
- It is one line: `white-space: nowrap` with an ellipsis, as wide as its text and at most its container.
- **Options.** None: it takes the type and colour of its text; size, density, shape and tone have nothing to act on.

**Accessibility.** The copy's alternative text is empty (`content: attr(data-shimmer) / ""`), so the accessible name
is the text's own, said once. The glint carries no meaning: say the state in the words ("Running", "Thinking").

**Forced colours.** The copy is left out (`content: none`); the text stays.

**Hooks and roles.** `--ds-shimmer-length` (480px, one tile: the band and the pause after it;
[theming.md](theming.md#component-hooks)). The colour roles `--ds-shimmer-glint` (white in light and dark; the text
colour in the contrast theme) and `--ds-shimmer-peak` (`color-mix(in srgb, var(--ds-text) 55%, transparent)`;
`transparent` in the contrast theme, so no glint passes there) ([tokens.md](tokens.md)).

**Motion.** The mask tile travels one `--ds-shimmer-length` per `--ds-loop-shimmer` (4.55s, the shape loader's round;
`--ds-loop-loader` until that token is in the theme), linear and endless, on the progress wave's keyframe
(`ds-progress-wave`, with `--ds-progress-wave-length` set to the tile): about 105px/s, so a short text sees one slow
pass and a pause. Nothing else animates; the mask is the only repaint.
