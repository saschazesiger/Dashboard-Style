## Badge

A count on a button, chip, tab or drawer item:

```html
<button class="ds-btn" type="button">[icon mail 16]Inbox <span class="ds-badge">3</span></button>
<label class="ds-chip"><input class="ds-chip__input" type="checkbox" name="state" value="failed"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Failed</span> <span class="ds-badge ds-badge--error">2</span></span></label>
<span class="ds-badge ds-badge--neutral">12</span>
```

- A pill of at least `--ds-badge-size` (20px) in the caption type with tabular figures, on the tint
  (`--ds-badge-bg`, `--ds-badge-color`: `--ds-accent`, `--ds-on-accent`; radius `--ds-badge-radius`, never above half
  the size).
  Tones `.ds-badge--neutral`, `.ds-badge--ok`, `.ds-badge--warning`, `.ds-badge--error` take their container pair; a toned badge needs its word in the
  row ("Failed", "2 errors"): colour is never the only signal. An empty badge takes no room.
- On a tinted host (a pressed toggle, `.ds-btn--tonal`, an open disclosure button, a checked chip, an input chip, a
  selected table row) the default badge turns to `--ds-primary` / `--ds-on-primary` and the neutral one to
  `--ds-surface` / `--ds-text-2`, so it never melts into the tint. In a disabled or `aria-disabled` button, chip, tab
  or drawer item it takes the disabled model over any tone (`--ds-disabled-fill`, `--ds-disabled-ink`; a theme that
  dims instead keeps its colours and fades it with the host). Forced colours: `Canvas` and `CanvasText` with a
  `CanvasText` outline (`GrayText` in a blocked host).
- Motion: colours glide on `--ds-dur-fast`. A count that appears pops in (`DS.motion.enter(badge, 'pop')`), one that
  goes pops out (`DS.motion.leave(badge, 'pop', { then: 'hide' })`); the number itself changes at once, and nothing
  plays on load ([motion.md](motion.md#a-count-badge)).
- Give the host an accessible name that includes the count where it matters (`aria-label="Inbox, 3 new"`), or keep the
  number in the text as above.

**Motion:** the recipe [A count badge](motion.md#a-count-badge) in motion.md.

