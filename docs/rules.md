# Design rules

The components follow these rules; pages and project components built on the tokens should too. Most are checked by
the tests in `test/`.

## Look

- **Tinted backdrop, white panels.** The page, top bar and drawer sit on `--ds-backdrop` without lines or shadows;
  content lives on one white panel (the only scroller) and in white cards.
- **Hairlines, not shadows.** Cards are outlined with `--ds-line`. Only floating layers (menus, dialogs, sheets,
  snackbars) cast a shadow; a filled button lifts to level 1 on hover.
- **One tint.** `--ds-primary` for the strongest action, focus, switches, progress and links; `--ds-accent` is the
  only tint (active navigation, selected chips, the tonal button, tracks). No extra accent colours; neutral notices
  use the quiet surface with a primary icon.
- **Every action is a pill** (`--ds-radius-action`): buttons, navigation items, search, segmented switch.
- **Hierarchy through type.** Two weights (regular and label); headings are never bold. Sentence case, no
  uppercase "eyebrow" lines above headings, tracking 0. Figures in counts, times and tables are tabular.
- **4px grid.** Page rhythm 20px between blocks, card rhythm 16px between children, card padding 24px (16px on
  phones).
- **One filled button per area**, no red buttons: the main action names the consequence ("Delete 3 devices"). A
  trailing "..." means a question or a choice follows.

## State and feedback

- **Status is never colour alone.** A status chip has an icon and a word; a selected chip has a check; the active
  navigation item is also set in the label weight; a chosen toggle changes shape.
- **Links are underlined** (`--ds-link-underline-*`); colour alone does not tell a link from text.
- **Focus is a 2px ring that appears instantly**, never animated, on every control (`--ds-focus-outline`). Put the
  ring on `:focus` and take it off with a separate `:focus:not(:focus-visible)` rule; never list `:focus-visible` or
  `:has()` next to other selectors, since a browser that lacks one drops the whole list.
- **Disabled is explained where possible.** Prefer a focusable `aria-disabled` control with a tooltip that says
  why over a bare `disabled`.
- **No flicker.** Fast loads show nothing: loaders appear after `--ds-delay-loader` and then stay at least 450ms.
  Never re-render an animating element; update in place (`DS.dom.morphHtml`, `.textContent`).
- **Updated data never animates.** Only the first render of a view and changes the user asked for move.

## Motion

- Material 3 curves only, nothing outside [0, 1]: no overshoot, no spring. No lift, growth or scaling on hover or
  press. Short distances (4-12px), exits shorter than entrances.
- Durations and curves only from tokens, keyframes only from `motion.css`, so reduced motion works everywhere from
  one switch. Loaders slow down instead of stopping. Details: [motion.md](motion.md).

## Accessibility

- Text roles pass WCAG AA on their surfaces; `--ds-text-3` only on white.
- Field text is 16px on phones (`--ds-font-input`), or iOS Safari zooms into the page.
- Labels stay above fields, never only as a placeholder; hints and errors are linked with `aria-describedby`.
- Forced colors (Windows contrast themes) drop backgrounds and shadows: floating layers carry a transparent outline
  that becomes their edge, selects get their native arrow back, and the spinner, switch, progress and loading bar use
  system colours. Keep these when you build your own floating layers.
- Hover effects only for devices that hover (`@media (hover: hover)`).
- A skip link before the navigation; one `<h1>` per page that can take focus (`tabindex="-1"`) after a page change;
  no `<header>` inside dialogs or sheets (it would be a second banner landmark).
- Icons are `aria-hidden`; icon-only buttons need `aria-label`.

## Code

- Tokens on `.ds-theme`, never `:root`; classes and custom properties use the `ds-` prefix; project classes use their
  own prefix.
- Components read roles and hooks only: no colour, radius, font, shadow, duration or curve literals outside
  `tokens.css` and theme files.
- Plain CSS for Safari 14 (no `@layer`, no nesting); newer features only where they degrade gracefully, named under
  "Progressive:" in the file header.
- JS: ES2020 modules without imports or destructuring, so `dist/ds.js` can wrap them.
