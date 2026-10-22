# Design rules

The components follow these rules; pages and project components built on the tokens should too. Most are checked by
the tests in `test/`.

## Look

- **Tinted backdrop, white panels.** The page, top bar and drawer sit on `--ds-backdrop` without lines or shadows;
  content lives on one white panel (the only scroller) and in white cards.
- **Hairlines, not shadows.** Cards are outlined with `--ds-line`. Only floating layers (menus, the combobox list,
  dialogs, sheets, snackbars) cast a shadow; a filled button lifts to level 1 on hover.
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

- **Status is never colour alone.** A status chip has an icon and a word; a selected chip has a check; a selected
  table row keeps its checkbox; the active navigation item is also set in the label weight; a chosen toggle changes
  shape.
- **Links are underlined** (`--ds-link-underline-*`); colour alone does not tell a link from text.
- **Focus is a 2px ring on `:focus-visible`** on every control (`--ds-focus-outline`), solid from the first frame;
  only its offset snaps from 4px to 2px (inset rings from the edge inward) in `--ds-dur-fast`. A focus layer
  (`--ds-state-focus`) lies under the ring at once; a press stays on top of it. Fields show their inset ring on any
  focus. No ring may be clipped: a container that clips takes an inset ring for its items.
- **A press is a layer, a ripple and a shape.** The state layer comes in `--ds-dur-micro`, the ripple grows from the
  pointer (`DS.ripple.attach(document)`), and pills turn squarer (`--ds-radius-action-pressed`) and spring back on
  release. Nothing scales on press except the switch handle; checkboxes, radios and the switch show a halo instead
  of a ripple. Inline text links (`.ds-link-btn`, links in text) neither ripple nor morph.
- **One disabled model.** Disabled controls take the neutral Material look (`--ds-disabled-fill` container or
  outline, `--ds-disabled-ink` content; a theme may dim them as a whole with `--ds-disabled-opacity`), show no hover,
  press, ripple, morph or halo, take the `not-allowed` cursor where they can still be pointed at, and fade into that
  look on `--ds-dur-fast`.
- **Disabled is explained where possible.** Prefer a focusable `aria-disabled` control with a tooltip that says
  why over a bare `disabled`.
- **No flicker.** Fast loads show nothing: loaders appear after `--ds-delay-loader` and then stay at least
  `--ds-hold-loader` (450ms). A block that waits shows the shape loader (`.ds-loader`), a small spot (a button, a
  chip, a cell) the arc spinner (it has no delay of its own: put it in `.ds-loading`, a busy button, or a
  `.ds-enter--delayed` wrapper); delays never stack. Re-render with `DS.dom.morphHtml` (keyed, in place), never `innerHTML`: an
  animating element keeps its animation and a field its focus.
- **Data changes glide, they never replay an entrance.** Values count from the shown value (`countUp`, bars on
  `--ds-ease-value`); reorders glide through `DS.motion.flip`: user actions at once, live data held while a mouse
  or pen is over the list or a row has focus (at most 2s), at most 50 moving rows. Only the first render of a view
  staggers in.

## Motion

- Effects (opacity, colour) and values run on Material 3 curves within [0, 1] that never decrease. Movement that
  floats (translate, scale, clip-path) runs on the spring `--ds-ease-spatial`: it peaks at most 5% past its target
  and settles. Sizes that push layout never overshoot (`--ds-ease-out`).
- An entrance is a fade plus a movement; an exit is `ds-fade-out` plus a movement-only keyframe, and takes 0.3-0.8
  of its entrance. Short distances (4-12px, 24px for a panel that slides in by hand
  (`.ds-enter--slide`); side sheets and the modal drawer slide their full width).
- Hover never moves anything (state layer, colour and documented shadow only); nothing scales on press except the
  switch handle. A press ripples from the pointer (`DS.ripple.attach(document)` once per page).
- Interrupted motion continues from where it is, on the curve of the new direction: never a jump to the end, a
  restart from zero or a reversed entrance (`DS.motion.enter`, `leave` and `flip` do it). JS timing comes from
  the computed tokens (`DS.motion.motionDuration`), never from ms literals.
- Animate only `transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`, `clip-path` and registered
  custom properties, plus the named exceptions of [motion.md](motion.md#rules). Never `transition: all`, never
  `font-weight`.
- Durations and curves only from tokens, keyframes only from `motion.css`. Motion is the same on every device;
  loaders always run at their token speed. Details: [motion.md](motion.md); what each component plays: its
  [choreography](motion.md#choreography), live in the Motion Lab (`styleguide/motion.html`).
- View Transitions only through `DS.motion.transition()`, for navigation (a destination, a drill-down, another
  record), never for data; the `::view-transition-*` rules hang off `.ds-theme`, and `@view-transition` and
  permanent `view-transition-name`s live only in `src/optional/` ([motion.md](motion.md#view-transitions)).
- Scroll-driven animations only as documented refinements with a static or `data-scrolled` fallback;
  `animation-timeline` comes after the `animation` shorthand, which resets it
  ([motion.md](motion.md#scroll-driven-effects)).

## Accessibility

- Text roles pass WCAG AA on their surfaces; `--ds-text-3` only on white.
- Field text is 16px on phones (`--ds-font-input`), or iOS Safari zooms into the page.
- Labels stay above fields, never only as a placeholder; hints and errors are linked with `aria-describedby`.
- Checkboxes and radios stay native inputs, drawn on the input itself (`appearance: none`, no wrapper), so forms,
  labels, the keyboard and screen readers work as without CSS.
- A busy button (`aria-busy`) and its done face change only what is seen: announce the result yourself (an
  `aria-live` region or a snackbar).
- Forced colors (Windows contrast themes) drop backgrounds and shadows: floating layers (dialogs, sheets, the modal
  drawer, snackbars, tooltips, menus and the combobox list) carry a transparent outline that becomes their edge, a
  selected option shows `SelectedItem`, selects get their native arrow back, and the spinner, switch, progress and
  loading bar use system colours. Keep these when you build your own floating layers.
- Hover effects only for devices that hover (`@media (hover: hover)`).
- A skip link before the navigation; one `<h1>` per page that can take focus (`tabindex="-1"`) after a page change;
  no `<header>` inside dialogs or sheets (it would be a second banner landmark).
- Icons are `aria-hidden`; icon-only buttons need `aria-label`.

## Code

- Tokens on `.ds-theme`, never `:root`; classes and custom properties use the `ds-` prefix; project classes use their
  own prefix.
- Components read roles and hooks only: no colour, radius, font, shadow, duration or curve literals outside
  `tokens.css` and theme files.
- Plain CSS for Safari 16.4, Chrome/Edge 111 and Firefox 128 (no nesting); newer features only where they degrade
  gracefully, named under "Progressive:" in the file header.
- Every stylesheet sits in `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities`; themes and project
  CSS stay unlayered and win. No specificity tricks; `!important` only on a short allowlist.
- JS: ES2022 modules; a module may import named exports from an earlier sibling module, and `dist/ds.js` wraps
  them all into `window.DS`.
