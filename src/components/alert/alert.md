## Alert

Tells the user something about a page or a section, in place, with an icon and a word; never colour alone.

```html
<div class="ds-alert" role="status">[icon info 20]<span class="ds-alert__text">Sync runs at night.</span></div>
<div class="ds-alert ds-tone-success">[icon checkCircle 20]<span class="ds-alert__text">All devices synced.</span></div>
<div class="ds-alert ds-tone-warning">[icon alert 20]<span class="ds-alert__text">The certificate expires in 5 days.</span>
  <button class="ds-btn ds-btn--text ds-sm" type="button">Renew</button></div>
<div class="ds-alert ds-tone-error" role="alert">[icon alertCircle 20]<span class="ds-alert__text">Could not load devices.</span>
  <button class="ds-btn ds-btn--text ds-sm" type="button">Try again</button></div>

<details class="ds-errors ds-collapsible">
  <summary>[icon alertCircle 16]2 errors[icon chevronDown 16 ds-errors__chevron]</summary>
  <ul><li>Row 4: unknown model</li><li>Row 9: duplicate serial</li></ul>
</details>
```

The plain `.ds-alert` is the neutral (information) alert: quiet surface, primary icon, no modifier.

A title, more paragraphs and actions; findings in a card (`.ds-alert--plain`):

```html
<div class="ds-alert ds-tone-warning">[icon alert 20]
  <div class="ds-alert__text"><p class="ds-alert__title">Certificate expires soon</p><p>Renew it before 1 May.</p></div>
  <div class="ds-alert__actions"><button class="ds-btn ds-btn--text ds-sm" type="button">Renew</button><button class="ds-btn ds-btn--text ds-sm" type="button">Remind me</button></div>
</div>

<section class="ds-card">
  <h2 class="ds-card__title">Findings</h2>
  <div class="ds-alert ds-alert--plain ds-tone-error">[icon alertCircle 20]<span class="ds-alert__text"><strong class="ds-alert__title">Disk almost full</strong> 92% used on drive C.</span></div>
  <div class="ds-alert ds-alert--plain ds-tone-warning">[icon alert 20]<span class="ds-alert__text">Warranty ends in 30 days.</span></div>
</section>
```

An inline message under a field or in a row; a section message, a block with its title and actions:

```html
<p class="ds-alert ds-alert--inline ds-tone-warning">[icon alert 16]<span class="ds-alert__text">Used by 3 other devices.</span></p>

<div class="ds-alert ds-alert--section ds-tone-error" role="alert">[icon alertCircle 20]
  <div class="ds-alert__text"><p class="ds-alert__title">The import stopped</p><p>Row 812 has no serial number. Nothing was saved.</p></div>
  <div class="ds-alert__actions"><button class="ds-btn ds-btn--filled" type="button">Open the file</button><button class="ds-btn ds-btn--text" type="button">Discard</button></div>
</div>
```

**Options** ([options.md](options.md)): classes on the alert or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the alert |
|---|---|---|---|
| Variant | `--plain`, `--inline`, `--section` | the alert | a finding on its card; a message without a box; a block with its actions under the text |
| Tone | `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error`; none: the quiet neutral | the alert itself; an inherited tone is ignored | the fill, the ink and the icon, from the tone's container pair and colour (warning: `--ds-warning-surface` and `--ds-text`, as ever); an error alert's buttons take its ink; `--plain` and `--inline` keep only the icon |
| Size | `.ds-xs` ... `.ds-xl` | the alert or a group | 2px of padding per step, and its buttons step with it; type and icon stay |
| Density | `.ds-density-*` | any container | 2px of padding per step (12 and 16px at comfortable, 8 and 12px at dense, and so under `themes/compact.css`); type and icon stay |
| Shape | `.ds-shape-*` | any container or the theme | the corners times 0, .5, 1, 1.5; `--plain` and `--inline` have none |
| Touch | `.ds-touch` | the theme or a container | its buttons and the `.ds-errors` summary, at least `--ds-touch-target` high; the alert itself is no target, but it grows to hold its button (below) |

- `.ds-alert--success`, `.ds-alert--warning`, `.ds-alert--error` are **deprecated** (3.0, removed when 3.0 ships): `.ds-tone-success`, `.ds-tone-warning`, `.ds-tone-error` on the alert, the same look under the option every component shares.
- `.ds-alert__title` (the label font, the alert's ink) opens `.ds-alert__text` in every alert; paragraphs in the text
  lose their margins and stand `--ds-space-2` apart.
- `.ds-alert__actions` after the text holds one or more buttons side by side; the alert then wraps, the text takes at
  least `--ds-alert-text-basis` (256px) and the actions drop under it on a narrow row.
- A button hangs out of the first line, centred on it. Its hang is never more than the block padding, and the padding
  grows when a button needs more: a `.ds-sm` button under `.ds-touch` makes a 48px alert at any density, and a default
  button at `.ds-xl` a 56px one.
- `.ds-alert--plain`: a finding in a card, on the card's surface: no fill, no edge, no inline padding, no radius, the
  tone's icon; hairlines between consecutive plain alerts. Static findings carry no live role.
- `.ds-alert--inline`: the meta type, a 16px icon in the tone and the word in `--ds-text`, on whatever is behind it; no
  fill, edge, padding or radius, so size, density and shape have nothing to change. For a form's validation messages
  keep `.ds-field__error` ([Form](#form)); this is a note next to a value or under a field that has no error.
- `.ds-alert--section`: two columns, the icon and the text; the title in the subtitle font, more padding (hooks below),
  the actions or a lone button always under the text, in its column.
- Hooks ([theming.md](theming.md#component-hooks)): `--ds-alert-bg`, `--ds-alert-color`, `--ds-alert-icon` (also the
  edge colour), `--ds-alert-edge` (a leading edge's width, default none: `4px` gives the edge look), `--ds-alert-radius`,
  `--ds-alert-padding-block`, `--ds-alert-padding-inline`, and per tone `--ds-alert-success-bg`,
  `--ds-alert-success-color`, `--ds-alert-success-icon`, `--ds-alert-warning-bg`, `--ds-alert-warning-color`,
  `--ds-alert-warning-icon`, `--ds-alert-error-bg`, `--ds-alert-error-color` (also the ink of an error alert's buttons),
  `--ds-alert-error-icon`.

**Accessibility.** An alert that appears because something happened takes a live role: `role="status"`, or
`role="alert"` when it needs attention at once; a static finding takes none. Its icon is `aria-hidden` and the word
says the meaning. Keyboard: an alert has no stop of its own; `Tab` reaches its buttons, links and the `.ds-errors`
summary (`Enter` or `Space` opens the list).

**Forced colours.** The fill goes and a transparent outline becomes the edge of a box (`--plain` and `--inline` have
none); icon and word stay in `CanvasText`, and a tone changes nothing there, so the word carries the meaning.

Alerts have no entrance of their own: one re-rendered with fresh data is patched in place and never fades in again.
An alert that comes or goes, by a user action or live data, does it through `DS.motion.flip` on its stack (a flex or
grid column with a gap), with no export of its own and no height animated
([motion.md](motion.md#data-motion)):

```js
DS.motion.flip(stack, () => alert.remove());       // dismiss: it fades out in place, the alerts below glide up
DS.motion.flip(stack, () => stack.prepend(alert)); // insert: it fades in, the others glide down
DS.motion.flip(stack, () => stack.prepend(alert), { live: true }); // live data: waits while the stack is pointed at
```

A dismiss that removes the focused button needs nothing more: `flip()` moves focus to the same button of the next
alert, else of the previous one (`refocus`, 2.0; pass `refocus: heading` to land on the section's heading when the
last one goes). An alert that replaces a placeholder takes `.ds-reveal`.

The summary of `.ds-errors` is pressable: a state layer in its colour (hover, press in `--ds-dur-micro`, keyboard
focus with `--ds-state-focus`) in a 4px padding that hangs into the space around it, the ripple, and its own focus
ring (also without `.ds-base`) that is solid from the first frame and snaps to its offset. It is not a pill and
does not morph. Its chevron turns 180deg with the list on the spring, like `.ds-chevron`; with `.ds-collapsible`
the list opens and closes with the collapsible timing.

**Motion:** the "Alert, tile, card" row of [Feedback](motion.md#feedback) and [Data motion](motion.md#data-motion) in motion.md.
