## Alert

```html
<div class="ds-alert" role="status">[icon info 20]<span class="ds-alert__text">Sync runs at night.</span></div>
<div class="ds-alert ds-alert--success">[icon checkCircle 20]<span class="ds-alert__text">All devices synced.</span></div>
<div class="ds-alert ds-alert--warning">[icon alert 20]<span class="ds-alert__text">The certificate expires in 5 days.</span>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button></div>
<div class="ds-alert ds-alert--error" role="alert">[icon alertCircle 20]<span class="ds-alert__text">Could not load devices.</span>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Try again</button></div>

<details class="ds-errors ds-collapsible">
  <summary>[icon alertCircle 16]2 errors[icon chevronDown 16 ds-errors__chevron]</summary>
  <ul><li>Row 4: unknown model</li><li>Row 9: duplicate serial</li></ul>
</details>
```

The plain `.ds-alert` is the neutral (information) alert: quiet surface, primary icon, no modifier.

A title, more paragraphs and actions; findings in a card (`.ds-alert--plain`):

```html
<div class="ds-alert ds-alert--warning">[icon alert 20]
  <div class="ds-alert__text"><p class="ds-alert__title">Certificate expires soon</p><p>Renew it before 1 May.</p></div>
  <div class="ds-alert__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Remind me</button></div>
</div>

<section class="ds-card">
  <h2 class="ds-card__title">Findings</h2>
  <div class="ds-alert ds-alert--plain ds-alert--error">[icon alertCircle 20]<span class="ds-alert__text"><strong class="ds-alert__title">Disk almost full</strong> 92% used on drive C.</span></div>
  <div class="ds-alert ds-alert--plain ds-alert--warning">[icon alert 20]<span class="ds-alert__text">Warranty ends in 30 days.</span></div>
</section>
```

- `.ds-alert__title` (the label font, the alert's ink) opens `.ds-alert__text` in every alert; paragraphs in the text
  lose their margins and stand `--ds-space-2` apart.
- `.ds-alert__actions` after the text holds one or more buttons side by side; the alert then wraps, the text takes at
  least `--ds-alert-text-basis` (256px) and the actions drop under it on a narrow row.
- `.ds-alert--plain`: a finding in a card, on the card's surface: no fill, no edge, no inline padding, no radius, the
  kind's icon; hairlines between consecutive plain alerts. Static findings carry no live role.
- Hooks (13, [theming.md](theming.md#component-hooks)): `--ds-alert-bg`, `--ds-alert-color`, `--ds-alert-icon` (also the
  edge colour), `--ds-alert-edge` (a leading edge's width, default none: `4px` gives the edge look), and per kind
  `--ds-alert-success-bg`, `--ds-alert-success-color`, `--ds-alert-success-icon`, `--ds-alert-warning-bg`,
  `--ds-alert-warning-color`, `--ds-alert-warning-icon`, `--ds-alert-error-bg`, `--ds-alert-error-color` (also the
  ink of an error alert's buttons), `--ds-alert-error-icon`. Forced colours: a transparent outline becomes the edge.
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

