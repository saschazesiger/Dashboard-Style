## Shape loader

The block loader of the system: a shape morphs through the seven M3 shapes, each step landing on the spring, while it
turns. For a section, a sheet or the app start; a small spot keeps the [spinner](#spinner).

```html
<span class="ds-loader" aria-hidden="true"></span>                       <!-- 48px -->
<span class="ds-loader ds-sm" aria-hidden="true"></span>                 <!-- 24px, the loading line's -->
<span class="ds-loader ds-loader--contained" aria-hidden="true"></span>  <!-- on a tinted disc -->
```

**Options** ([options.md](options.md)): classes on the loader or any ancestor.

| Option | Classes | Where it applies | Effect on the loader |
|---|---|---|---|
| Variant | `--contained` | the loader | the shape on a `--ds-accent` disc |
| Size | `.ds-xs` ... `.ds-xl` | the loader or a group | 24px per step, at least 16px (16, 24, 48, 72, 96px); the shape is 38/48 of it |
| Density, shape, tone, touch | | | not read: it morphs through its own shapes, it is no target and it says nothing but "wait" |

- `.ds-loader--sm` is **deprecated** (3.0, removed when 3.0 ships): `.ds-sm`, the same 24px. `--ds-loader-sm-size`, read
  only by it, is **deprecated** with it: `--ds-loader-size` is the md base.
- It is decoration: `aria-hidden`, and the surrounding `role="status"` carries the text ([Loading](#loading)). Keep it
  to a few per view: the morph repaints every frame.
- It fades in after `--ds-delay-loader`; inside `.ds-boot`, `.ds-loading` or `.ds-skeleton` the container waits instead,
  and the delays never stack. `.ds-enter` on a `.ds-loader` is fine, its loops run on `::before`. The older markup with
  a `.ds-spinner` in `.ds-boot` or `.ds-loading` keeps working.
- Hooks ([theming.md](theming.md#component-hooks)): `--ds-loader-size` (48px), `--ds-loader-color` (`--ds-primary`).

**Keyboard.** None: it is no stop of its own. **Forced colours.** The shape in `Highlight`, the contained disc as a
`CanvasText` outline. Print: the shape is not printed, its label is.

**Motion:** the loader rows of [Feedback](motion.md#feedback) in motion.md: `ds-loader-morph` and `ds-loader-turn` on
`--ds-loop-loader`, always at their token speed.

<!-- changelog -->
- Shape loader: its own docs section; size steps of 24px from the md base. `.ds-loader--sm` and `--ds-loader-sm-size`
  deprecated: `.ds-sm`, `--ds-loader-size`.
