## Result page

The whole page, or a whole panel, says how a request ended when there is nothing else to show: done, not allowed
(403), not found (404), failed (500), down for maintenance, offline. A disc with the cause's icon (or a picture),
the code, a title that says what happened, one line of what to do, the way out and a reference for support.

```html
<main class="ds-result ds-result--not-found" aria-labelledby="result-title">
  <span class="ds-result__disc" aria-hidden="true">[icon mapPin 32]</span>
  <p class="ds-result__code">404</p>
  <h1 class="ds-result__title" id="result-title" tabindex="-1">Page not found</h1>
  <p class="ds-result__text">The address may be mistyped, or the page has moved.</p>
  <div class="ds-result__actions">
    <a class="ds-btn ds-btn--filled" href="/">Go to the overview</a>
    <a class="ds-btn ds-btn--text" href="/search">Search</a>
  </div>
  <p class="ds-result__meta">Reference 9F2C-118A</p>
</main>
```

An [empty state](#empty-state) says that a place has nothing to show; a result page replaces the page.

| Cause | Class | Disc | Suggested icon, title and way out |
|---|---|---|---|
| Done | `.ds-result--success` | success container | `checkCircle`; "Device added"; open it, add another |
| 403 | `.ds-result--forbidden` | neutral | `lock`; "You need access"; ask an administrator, go back |
| 404 | `.ds-result--not-found` | the accent tint | `mapPin`; "Page not found"; the overview, search |
| 500 | `.ds-result--error` | error container | `alert`; "Something went wrong"; try again, the status page; a reference |
| Maintenance | `.ds-result--maintenance` | warning container | `wrench`; "Back at 14:00"; the status page |
| Offline | `.ds-result--offline` | warning container | `wifiOff`; "You are offline"; try again |
| Any other | `.ds-tone-*` on `.ds-result` | the tone's container | |

| Part | Class | What |
|---|---|---|
| Disc | `.ds-result__disc` | the cause's icon (32px), `aria-hidden` |
| Picture | `.ds-result__media` | an illustration in place of the disc, at most `--ds-result-media-size` high, `alt=""` |
| Code | `.ds-result__code` | the status code, quiet: a figure for support, never the only word |
| Title | `.ds-result__title` | what happened, in words (the page's `h1`) |
| Text | `.ds-result__text` | one line of what to do |
| Actions | `.ds-result__actions` | one filled button at most, and a text button; stacked full width on a phone |
| Meta | `.ds-result__meta` | a reference or a time, selectable, for a support request |

### Options

On it or any ancestor, except the tone; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the disc, the padding | 8px of disc and 8px of block padding per step; the type stays |
| Density | `.ds-density-*` | the padding, the gaps | 4px of block padding and 1px of gap per step |
| Shape | `.ds-shape-*` | the disc | its radius times `--ds-shape`: round at the default |
| Tone | `.ds-tone-*` | the result itself | the disc's colours, over the cause's |
| Touch | `.ds-touch` | its buttons | as everywhere |

**Status never by colour alone.** The icon and the title say what happened; the colour and the code add nothing a
word does not.

### Accessibility

One `h1`, the title, names the landmark (`aria-labelledby`); a result inside a panel takes the panel's heading level.
After a request in a single-page app, move focus to the title (`tabindex="-1"`, `focus()`), so the result is read;
it shows no ring, being no control. The disc and the picture are `aria-hidden`.

### Forced colours

The disc keeps a transparent outline that becomes its edge; its fill is dropped. The text and the buttons follow the
system colours.

### Hooks

`--ds-result-disc-size`, `--ds-result-media-size`, `--ds-result-padding`: see [theming.md](theming.md).

**Motion:** none of its own. A result that replaces content after a request comes in with `.ds-reveal`
([motion.md](motion.md)).

<!-- changelog -->
- Result page (new, `result`): `.ds-result` with the causes `--success`, `--forbidden`, `--not-found`, `--error`,
  `--maintenance`, `--offline` (or a tone) and the parts `__disc`, `__media`, `__code`, `__title`, `__text`,
  `__actions`, `__meta`; hooks `--ds-result-disc-size`, `--ds-result-media-size`, `--ds-result-padding`.
