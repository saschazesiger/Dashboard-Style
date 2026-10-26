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
  release. Nothing scales on press except the switch handle; checkboxes, radios, the switch and the slider show a
  halo instead of a ripple. Inline text links (`.ds-link-btn`, links in text) neither ripple nor morph. Project
  controls use `.ds-pressable` for their layer, focus snap and ripple instead of a hand-built state layer.
- **One disabled model.** Disabled controls take the neutral Material look (`--ds-disabled-fill` container or
  outline, `--ds-disabled-ink` content; a theme may dim them as a whole with `--ds-disabled-opacity`), show no hover,
  press, ripple, morph or halo, take the `not-allowed` cursor where they can still be pointed at, and fade into that
  look on `--ds-dur-fast`.
- **Disabled is explained where possible.** Prefer a focusable `aria-disabled` control with a tooltip that says
  why over a bare `disabled`: the reason shows on hover, on keyboard focus and on a tap on touch screens.
- **A value another system sets is locked, not disabled.** Show it as text with the lock (`.ds-lock`) and its reason
  (where to change it), or as a locked switch (`.ds-switch--locked`, the `lock` glyph) that says by whom in words;
  never a disabled field.
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
- A busy button (`aria-busy`) and its done face change only what is seen: announce the result yourself
  (`DS.overlay.announce()` or a snackbar).
- Blocked means blocked for every input: a busy or done button and an `aria-disabled` action ignore a click, a middle
  click, Enter, Space and a form submission alike. `DS.motion.guard()` (installed by `DS.ripple.attach()` and `DS.motion.busy()`) cancels them
  before any listener of the page; focus, hover and the tooltip that says why stay.
- Forced colors (Windows contrast themes) drop backgrounds and shadows: floating layers (dialogs, sheets, the modal
  drawer, snackbars, tooltips, menus and the combobox list) carry a transparent outline that becomes their edge, a
  selected option shows `SelectedItem`, selects get their native arrow back, and the spinner, switch, progress and
  loading bar use system colours; the current row of a list is `SelectedItem`, timeline dots and rails are borders,
  and chart fills take `CanvasText` with series 2 to 4 hatched. Keep these when you build your own floating layers.
- Print: what floats is not printed (dialogs, sheets, menus, the combobox list, snackbars, tooltips, the save bar,
  the loading bar and the shape loader); what scrolls sideways shows all of its content, unmasked; closed detail
  rows are left out. Controls drawn with backgrounds (checkboxes, radios, switches, sliders, progress bars,
  spinners, steps, meters and columns) keep their colours (`print-color-adjust: exact`), so their state survives a
  printer that drops backgrounds. Short cards, tiles and alerts are not split across pages.
- Hover effects only for devices that hover (`@media (hover: hover)`).
- A skip link before the navigation; one `<h1>` per page that can take focus (`tabindex="-1"`) after a page change;
  no `<header>` inside dialogs or sheets (it would be a second banner landmark).
- Icons are `aria-hidden`; icon-only buttons need `aria-label`.

## Accessibility statement

Dashboard-Style aims at **WCAG 2.2, level AA** for what it draws and does. A page built from it still owes its own
content: the system guarantees the parts below, the tests named in each row check them, and the last column says what
the page adds.

| Criterion | What the system guarantees | How it is tested | What the page owes |
|---|---|---|---|
| 1.4.3 Contrast (minimum) | every text role passes 4.5:1 on the surfaces it is meant for, in the default palette and in the shipped dark and contrast themes | `test/tokens.test.js` (the pairs of `tools/theme-rules.mjs`); `tools/check-theme.mjs` for a project theme | keep its own colours and its theme at 4.5:1 |
| 1.4.10 Reflow | the frame and every component work at 320 CSS px without sideways scrolling of the page (tables scroll inside their card) | phone-width screenshots and specs in `test/browser/` | no fixed widths of its own |
| 1.4.11 Non-text contrast | checkbox and radio parts, field borders, outlines, status icons and chart marks at 3:1; the focus ring at 3:1 against the surface | `test/tokens.test.js` (control, icon and chart pairs) | the same for its own controls |
| 1.4.13 Content on hover or focus | tooltips show on hover and focus, stay while the pointer moves onto them, close on Escape and never time out (on touch they stay until dismissed) | `test/browser/toast-tooltip.spec.js` | no tooltip that hides essential content |
| 2.1.1 Keyboard | every control is a native element or a documented role with its keys: menus, the combobox, tabs, dialogs, sheets and the drawer work with the keyboard alone | `test/browser/popups.spec.js`, `overlay.spec.js`, `shell.spec.js` | use the documented markup; no click-only `div` |
| 2.4.3 Focus order | overlays move focus in and back to their opener; a removed item hands focus to its neighbour; the drawer comes before the content with a skip link | `test/browser/overlay.spec.js`, `flip.spec.js` | focus the `<h1>` of a new view or page |
| 2.4.7 Focus visible | a 2px ring (`--ds-focus-outline`) on `:focus-visible`, solid from the first frame, never clipped, kept in forced colours | `test/css.test.js`, focus screenshots in `test/browser/baseline.spec.js` | no `outline: none` of its own |
| 2.4.11 Focus not obscured (minimum) | snackbars that stay reserve room at the end of the view, sheet body or dialog (`scroll-padding-bottom` from `--ds-toast-reserve`), so a focused control scrolls clear of them; sticky table heads stay inside their card | `test/browser/toast-tooltip.spec.js` | no fixed layer of its own over the content |
| 2.5.3 Label in name | icon buttons take their name from `aria-label`, text buttons from their text; tooltips repeat the name, never replace it | the documented markup of `docs/components.md`; accessible names asserted in the specs of `test/browser/` | names that match the visible label |
| 2.5.8 Target size (minimum) | every action is at least 24 by 24 CSS px (buttons 36px, small buttons and chips 32px, check and radio halos 40px; links inside text are exempt); `.ds-touch` raises them to `--ds-touch-target` for a finger | the hook defaults of `docs/theming.md`; `.ds-touch` in `test/browser/touch.spec.js` | keep `.ds-touch` where fingers are the input |
| 4.1.2 Name, role, value | native inputs stay native; custom widgets carry their roles, `aria-expanded`, `aria-selected`, `aria-checked` and `aria-current`, kept in step by `DS.overlay` and `DS.indicator` | `test/browser/` specs per component | the names of its controls and regions |
| 4.1.3 Status messages | snackbars are announced politely, errors assertively, once; busy and done faces change only what is seen | `test/browser/toast-tooltip.spec.js` | announce results (`DS.overlay.toast()` or `announce()`), set `lang` |

Beyond the criteria: status is never colour alone (an icon and a word), forced colours keep every edge and state
(one model per meaning, [AGENTS.md](../AGENTS.md)), and field text is 16px on phones.

Not supported, by decision:

- **The system setting to reduce motion** is not honoured: one motion scheme for every product, short, never
  flashing, never parallax, and it carries no information on its own; WCAG 2.3.3 (Animation from interactions) is
  level AAA.
- **Right-to-left scripts**: the layout is left-to-right; `dir="rtl"` is not supported yet ([install.md](install.md#language-and-locale)).

## Code

- Tokens on `.ds-theme`, never `:root`; classes and custom properties use the `ds-` prefix; project classes use their
  own prefix.
- Components read roles and hooks only: no colour, radius, font, shadow, duration or curve literals outside
  `tokens.css` and theme files.
- Project controls take the press model from `.ds-pressable`, actions that show on hover from `.ds-hover-actions`
  and touch sizes from `.ds-touch`: never a hand-built state layer, reveal or size override.
- Plain CSS for Safari 16.4, Chrome/Edge 111 and Firefox 128 (no nesting); newer features only where they degrade
  gracefully, named under "Progressive:" in the file header.
- Every stylesheet sits in `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities`; themes and project
  CSS stay unlayered and win. No specificity tricks; `!important` only on a short allowlist.
- JS: ES2022 modules; a module may import named exports from an earlier sibling module, and `dist/ds.js` wraps
  them all into `window.DS`.
