# Plan: proposals from a project migration (after 1.6.2)

Proposals collected on 2026-10-22 and 2026-10-23, while a project moved its own design layer onto Dashboard-Style
1.6.2: an internal admin app (navigation drawer, tables, forms, side sheets, a chat view with a mode switch in the
top bar) and a public multi-step form page with a theme of square surfaces and round actions. Each one is a small
helper or rule the project had to write itself, because Dashboard-Style lacked something every dashboard could use.

Nothing here is decided. This is a backlog for the owner: each proposal says what is missing, what Dashboard-Style
could offer, how it fits [rules.md](../docs/rules.md) and [motion.md](../docs/motion.md), and what a change would
touch. Every proposal is additive (a new class, modifier, hook, option or export, so a minor version) and would
follow "Making a change" in [AGENTS.md](../AGENTS.md). Each was checked against `src/` and `docs/` at `56e6966`;
proposals that Dashboard-Style already covers are listed at the end with what to use instead.

> The plan sits outside `docs/` on purpose, like [motion-2.md](motion-2.md): `test/repo.test.js` counts every
> `docs/**/*.md` as documentation, and a plan that names future classes and exports would satisfy those tests in
> advance.

**Priority:** **P1** fixes a gap that makes a documented pattern inaccessible or unsafe, or that every app frame
rebuilds; **P2** removes a helper a typical dashboard writes; **P3** is a convenience or an idea.

## Summary

| # | Proposal | Group | Priority |
|---|---|---|---|
| A1 | Segmented options as buttons: selected, disabled and forced-colours states | Controls | P1 |
| A2 | Busy and done buttons also block the keyboard | Controls | P1 |
| A3 | End a running press from script (a drag is no press) | Controls | P3 |
| B1 | `watchScrolled()` as an export instead of a recipe | App frame | P1 |
| C1 | `DS.overlay.announce()`: a live region that an open trap does not silence | Feedback | P1 |
| C2 | Snackbars: keep room for a message that stays, and replace by key | Feedback | P2 |
| C3 | Tooltips on touch, and no tooltip that repeats the visible label | Feedback | P2 |
| C4 | `loaderHoldMs()` takes `element`, like `settleLoader()` | Feedback | P3 |
| C5 | One setter for progress share and its ARIA | Feedback | P3 |
| D1 | `.ds-table--stack`: rows become blocks on narrow panels | Data | P2 |
| E1 | `.ds-presence` that keeps the element's own transitions, and a variant that keeps its room | Motion | P3 |
| F1 | A filled "on" glyph without project CSS | Icons | P3 |
| G1 | Hooks for quieter themes: alert, field error, skeleton line, button underline | Theming | P2 |
| H1 | Verify a vendored copy without network | Tooling | P3 |
| H2 | Deprecated names in machine-readable form | Tooling | P2 |
| H3 | A conformance check for projects | Tooling | P3 |

## A. Controls

### A1. Segmented options as buttons (P1)

**Problem.** `.ds-segmented` is documented for links with `aria-current="true"` (a mode switch that navigates). A
switch that changes a mode on the same page ("Table | Cards", a chat mode) is a choice, not a destination: its
options are `<button role="radio" aria-checked>` in a `role="radiogroup"`, or `<button aria-pressed>`. As buttons,
the options keep the browser's border, grey fill and font, which cover the gliding pill; the selected option gets
neither the label weight nor the on-accent colour (both hang off `[aria-current="true"]`); there is no disabled
look; and in forced colours the pill's fill disappears, so the chosen option is marked by weight only. The forced
colours block of `shell.css` outlines only `.ds-drawer__item[aria-current="page"]`. The project reset the buttons in
its own reset layer, styled `[aria-checked="true"]` and `:disabled` itself, and added the outline.

```html
<div class="ds-segmented" role="radiogroup" aria-label="View">
  <button class="ds-segmented__option" type="button" role="radio" aria-checked="true" data-label="Table">Table</button><button class="ds-segmented__option" type="button" role="radio" aria-checked="false" data-label="Cards" tabindex="-1">Cards</button>
</div>
```

**Proposal.**

- `.ds-segmented__option` resets a `<button>` (`margin: 0`, `border: 0` apart from the divider, `background: none`,
  `font` from the option's role, `color` inherited); the divider rule already covers buttons.
- The selected state matches `:is([aria-current="true"], [aria-checked="true"], [aria-pressed="true"])` wherever it
  matches `[aria-current="true"]` today (tint without the indicator, label weight, on-accent ink, the indicator's
  colour timing).
- `:is(:disabled, [aria-disabled="true"])` takes the one disabled model (`--ds-disabled-ink`,
  `--ds-disabled-opacity`, no state layer, no ripple, no morph).
- Forced colours: the selected option gets `outline: 2px solid Highlight; outline-offset: -2px` (inset, the switch
  clips), as the drawer item does.
- `createIndicator(nav, { active: '[aria-checked="true"]' })` already works; docs name the selector per markup.
- Keyboard (one tab stop, arrow keys choose) stays the page's script, as the docs say for behaviour; components.md
  gives the short recipe.

Already there and not the same: toggles in a track (`.ds-has-indicator > .ds-btn[aria-pressed]`) cover a toolbar
toggle group, not the outlined switch in the top bar.

**Fit.** Status never by colour alone (weight plus outline in forced colours); one disabled model; ripple host list
unchanged (`.ds-segmented__option` is a host). No new token or hook.

**Files.** `src/components/shell.css` (rules and header markup), `docs/components.md` (App frame: button markup, the
radio group recipe, "Which component" row "Switch a mode on the same page"), `styleguide/styleguide.js` (a button
switch next to the link one), `test/css.test.js` (forced-colours outline for every selected state; the label rule of
line ~1599 also for button options), browser baselines (controls fixture: the button option at rest, selected,
hovered, disabled, forced colours), `CHANGELOG.md`.

### A2. Busy and done buttons also block the keyboard (P1)

**Problem.** `.ds-btn[aria-busy="true"]` and `.ds-btn--done` set `pointer-events: none`. A focused busy button still
takes Enter and Space, and Enter in a field submits the form through it. `busy()` guards only itself (a second call
returns the running promise), so a handler that starts the work before calling it (`busy(button, save())`) saves
twice, and a click during the success face starts again. The project added one capture-phase `click` listener that
swallows clicks on `[aria-busy="true"]` and `.ds-btn--done` buttons before any handler sees them.

```js
form.addEventListener('submit', (event) => {
  event.preventDefault();
  DS.motion.busy(saveButton, api.save(values));   // Enter while busy: a second api.save()
});
```

**Proposal.** `busy()` installs, once per document, a capture-phase `click` listener that cancels
(`preventDefault()` and `stopImmediatePropagation()`) a click whose target is inside a button it currently owns as
busy or done; a `submit` whose `submitter` is such a button is cancelled the same way. Only the buttons: a busy
region (`aria-busy` on a container under a loading bar) stays usable. Optional, for pages that drive the attributes
by hand: the same guard as `DS.dom.guardBusy(root)`.

**Fit.** Makes "blocked at once" (button.css header) true for every input. No visual change; `aria-disabled` keeps its
documented "the page's script ignores its clicks".

**Files.** `src/js/motion.js` (`busy()`), `src/components/button.css` header, `docs/motion.md` (`busy()` row),
`test/js.test.js` (Enter on a busy button and submit through it start no second run; a click on the done face does
nothing), `test/browser/` (keyboard: Enter while busy in all engines), Motion Lab entry of `busy` (no new demo, the
guard is not motion), `CHANGELOG.md`.

### A3. End a running press from script (P3)

**Problem.** `DS.ripple` ends a press on `pointerup`, `pointercancel` and `pointerleave`. A row the page lets the
mouse drag sideways (a scrolling chip row, drag to scroll a timeline) captures the pointer on the row: the chip under
the pointer keeps its held ripple while the row scrolls. Touch scrolling ends it by itself (`pointercancel`). The
project dispatches a synthetic `pointerleave` on the host.

**Proposal.** The handle of `attach()` gets `release(host)`: ends a running press on `host` (the ripple fades as on
release, `.ds-pressed` goes), a no-op without one. Also: a press ends on `lostpointercapture` of the host and when
another element captures the pointer (`gotpointercapture` outside the host), which covers the common drag case
without any call.

**Fit.** The fade is the normal release (`.ds-press-ripple--out`), so no new motion; interrupted motion continues
from where it is.

**Files.** `src/js/ripple.js`, `docs/motion.md` (DS.ripple), Motion Lab (the press demo: a drag row that releases),
`test/js.test.js`, `test/browser/` (a captured drag ends the ripple), `CHANGELOG.md`.

## B. App frame

### B1. `watchScrolled()` as an export (P1)

**Problem.** `data-scrolled` drives the top bar's tint, the panel's hairline, the filled fields of the top bar and a
side sheet's head hairline in every engine, and components.md asks every page to set it with a 1px sentinel and an
`IntersectionObserver`. Each project copies the recipe; the copy has to remember `data-ds-keep`, `aria-hidden`, a
negative margin that also takes back a flex `row-gap` (sheet bodies), the not-rendered case of a closed sheet, and
`resyncScroll()` when content shrinks. The recipe has no way to stop watching. Every app frame needs it at least
twice (view and sheet body).

**Proposal.** `DS.dom.watchScrolled(scroller, target)` returns `{ stop() }` (or a stop function): it prepends the
documented sentinel (with `data-ds-keep`, `aria-hidden`, `flex-shrink: 0`, a `margin-bottom` of `-1px` minus the
scroller's computed `row-gap`), toggles `data-scrolled` on `target` only on a change, ignores entries of an unrendered
scroller, and calls `DS.motion.resyncScroll(scroller)` when the sentinel comes back into view. Idempotent per
scroller. `DS.overlay.open()` could call it for a `.ds-sheet__body` itself, so sheets need nothing.

**Fit.** Scroll-driven effects keep their `data-scrolled` fallback (rules.md); `staggerOnce()` and `morphHtml()`
already skip `data-ds-keep` helpers.

**Files.** `src/js/dom.js` (dom comes after motion in `MODULES`, so it may import `resyncScroll`), `docs/motion.md`
(DS.dom), `docs/components.md` (App frame and Side sheet: the recipe becomes one call), `example/` and `demo/` (use
it), `styleguide/lab.js` (a scroll demo that `shows` it; the lab coverage test requires one), `test/js.test.js`,
`test/browser/` (tint and hairline toggle in the fallback project), `CHANGELOG.md`.

## C. Feedback

### C1. `DS.overlay.announce()`: a live region that an open trap does not silence (P1)

**Problem.** Pages announce results themselves (rules.md: "announce the result yourself"). A polite live region in
the page goes inert with everything else while a dialog's trap is open, and VoiceOver reads nothing outside an
`aria-modal` subtree, so "Feedback sent", said while the dialog still shows its thanks, is never heard.
Dashboard-Style already solves this for its own snackbars: two announcers next to the `.ds-toasts` region, exempt
from every trap and moved into the open modal with the region. Pages cannot reach them; the project gave every
dialog its own live region and picks the one inside the open dialog.

**Proposal.** `DS.overlay.announce(text, { assertive = false, region })` writes `text` through those announcers
(cleared now, written on the next frame, so the same text again is spoken again; texts of one frame are read
together). `region` defaults to the document's `.ds-toasts` (created next to `.ds-app` when missing, as the docs
describe for snackbars).

**Fit.** Reuses the trap exemption that exists (`announcerNodes`); no visual change.

**Files.** `src/js/overlay.js`, `docs/motion.md` (DS.overlay), `docs/rules.md` (Accessibility: name it where it says
"announce the result yourself"), `docs/components.md` (Button busy faces, Snackbar), `test/js.test.js` (inside an
open dialog and a sheet the text lands in a node that is not inert), Motion Lab `LAB_EXEMPT` entry (not motion),
`CHANGELOG.md`.

### C2. Snackbars: keep room for a message that stays, and replace by key (P2)

**Problem.** An error snackbar stays until closed and may cover the actions it is about. The docs ask the page to set
`data-toast-reserve` on `.ds-view` or `.ds-sheet__body` and `--ds-toast-reserve` to the message's height, which means
finding the layer the region currently lives on (it moves into an open sheet), measuring, releasing the room on
close and on a move, and scrolling the control the error is about clear of it. The project wrote 40 lines for this.
It also closes an older error when a newer one arrives (a retry that fails again) and closes open errors when the
action is tried again; with `TOAST_LIMIT` and three persistent errors, the fourth waits in the queue instead.

**Proposal.** Two `toast()` options:

- `reserve: true` (default for messages that stay): while the message is shown, the scroller of the layer the region
  lives on gets `data-toast-reserve` and `--ds-toast-reserve` from the stack's height; it follows the region into and
  out of a sheet, and gives the room back on close. The focused control (the origin) scrolls clear of it
  (`scroll-padding-bottom` already exists).
- `key: 'save-error'`: a message with the key of an open one replaces it in place (the new text enters, the old one
  leaves, through the existing `flip()`), so repeated failures never stack.

**Fit.** Uses the existing hooks and runtime properties (`--ds-toast-reserve` is already documented as set by the
page); snackbar choreography unchanged.

**Files.** `src/js/overlay.js`, `docs/components.md` (Snackbar), `docs/motion.md` (the Snackbars row: replacement in
place), Motion Lab (the snackbar demo: replace by key, reserve), `test/js.test.js`, `test/browser/` (reserve inside a
sheet and in the view), `CHANGELOG.md`.

### C3. Tooltips on touch, and no tooltip that repeats the visible label (P2)

**Problem.** `tooltips()` never shows on touch. rules.md prefers "a focusable `aria-disabled` control with a tooltip
that says why" over a bare `disabled`, so on a phone the reason is unreachable ("Sync now" blocked while a sync
runs). An avatar whose tooltip names the signed-in account shows nothing on touch either. Second case: a button
whose label hides on narrow panels (icon plus "New item", icon only on phones) carries `data-tip="New item"`; while
the label is visible, the tooltip only repeats it. `tooltips()` already skips `aria-describedby` when the accessible
name says the same, but still shows the bubble.

**Proposal.**

- Touch: a long press (about `--ds-delay-tooltip`, no movement past a few px) shows the tooltip of the trigger and
  suppresses the click that follows; a tap on an `aria-disabled` trigger with `data-tip` shows it at once (the tap
  does nothing else anyway). It hides on the next pointerdown, on scroll and after its usual time. This is the M3
  behaviour for plain tooltips on mobile.
- Duplicate: no tooltip while the trigger's visible text (its rendered, non-`.ds-sr` text) equals `data-tip`
  (normalised as in `accessibleName`).

**Fit.** Tooltip motion unchanged (fade and scale from the anchor); WCAG 1.4.13 (dismissable, hoverable, persistent)
as today.

**Files.** `src/js/overlay.js` (`tooltips()`), `docs/components.md` (Tooltip), `docs/motion.md` (DS.overlay
`tooltips`), `test/js.test.js`, `test/browser/` (touch emulation in Chromium and WebKit: long press, tap on
`aria-disabled`), `CHANGELOG.md`.

### C4. `loaderHoldMs()` takes `element` (P3)

**Problem.** `settleLoader(startedAt, { element })` reads `--ds-delay-loader` (or `--ds-delay-boot`) and
`--ds-hold-loader` from the element, so `--ds-time-scale` applies. `loaderHoldMs()` only takes `delay` and
`minVisible` and otherwise falls back to the constants. A page that needs the number (to schedule a held swap
instead of awaiting) passes `motionDuration(el, '--ds-delay-loader')` and `motionDuration(el, '--ds-hold-loader')`
by hand.

**Proposal.** `loaderHoldMs(startedAt, now, { element })` resolves the times as `settleLoader()` does; explicit
`delay` and `minVisible` still win; `settleLoader()` then calls it with the same options.

**Fit.** JS timing from computed tokens, never literals (rules.md).

**Files.** `src/js/motion.js`, `docs/motion.md` (`loaderHoldMs` row), `styleguide/lab.js` (check that the loader
demo's `shows` still names it), `test/js.test.js` (time scale applies), `CHANGELOG.md`.

### C5. One setter for progress share and its ARIA (P3)

**Problem.** `.ds-progress` needs `--ds-progress` on the box, `aria-valuenow` (0 to 100) on the track, the
`--indeterminate` modifier with no `aria-valuenow` but an `aria-valuetext`, and `--waiting`. A live job card that
switches between these on every poll writes the same 15 lines in every project, and a missed `aria-valuenow`
removal leaves a stale value for screen readers.

```js
DS.dom.progress(box, 0.4);                                   // determinate: share and aria-valuenow 40
DS.dom.progress(box, null, { valueText: 'Listing files' });  // indeterminate
DS.dom.progress(box, null, { waiting: true, valueText: 'Waiting' });
```

**Proposal.** `DS.dom.progress(box, share, { waiting, valueText })` sets the modifiers, `--ds-progress` (rounded to
0.001, in the same task so a figure and its bar land together) and the track's ARIA. Labels stay the page's.

**Fit.** Values glide through the existing transition (`--ds-ease-value`); nothing new moves.

**Files.** `src/js/dom.js`, `docs/motion.md` (DS.dom), `docs/components.md` (Progress: the example uses it),
`styleguide/lab.js` (the progress demo `shows` it), `test/js.test.js`, `CHANGELOG.md`.

## D. Data

### D1. `.ds-table--stack`: rows become blocks on narrow panels (P2)

**Problem.** A table of editable rows (a list of sources, each with a name field, a URL field, a select, a checkbox
and a remove button) has no room for its columns on a phone or beside the docked drawer. Hiding
`.ds-col--secondary` does not help when every column is an input. The project turns rows into outlined blocks with a
label per cell under a container query, and has to switch off the wrapper's edge bleed and its scroll fade (the
blocks never scroll sideways), which Dashboard-Style sets with no hook to turn off.

**Proposal.** `.ds-table--stack` on the table: below 600px of `ds-content` (a fixed step, as `--wide` has 1040px;
a custom property cannot set a container query), each row becomes a block with `--ds-line` outline and `--ds-radius-card`, each cell shows `attr(data-label)` above its content (the
header row stays for screen readers), and its `.ds-table-wrap` drops the bleed and the edge fade. Plus a hook for
the fade on its own: `--ds-table-fade: none` turns off the mask of a wrapper that should never fade.

**Fit.** Labels above fields; no literals; rows keep `data-ds-key`, so `flip()` and `morphHtml()` work as before.

**Files.** `src/components/table.css` (header markup, rules, the "Progressive:" note for the container query if
needed), `docs/components.md` (Table and the "Which component" table: "Editable rows on a phone"),
`docs/theming.md` and `themes/example.css` (the hook), `styleguide/styleguide.js` (a stacked form table),
`test/css.test.js`, browser baselines (390px), `CHANGELOG.md`.

## E. Motion

### E1. `.ds-presence` that keeps the element's own transitions, and a variant that keeps its room (P3)

**Problem.** `.ds-presence` sets `transition` on the element, so a project element that is a presence loses its own
transitions: a floating "Jump to latest" pill's hover tint changes at once. A second case: a hint next to a toggle
that fades in on hover, focus and while the toggle is on must keep its room, so the row never shifts; `hidden` takes
the room, so the project writes its own opacity transition.

**Proposal.**

- `.ds-presence` lists the colour properties (`background-color`, `color`, `border-color`, `box-shadow`) on
  `--ds-dur-fast` `--ds-ease-in-out` in all three transition lists, so a state change of the element glides with it.
- `.ds-presence--keep` (or the attribute `data-ds-shown` on any element): toggled by `data-ds-shown`, it fades with
  `opacity` and `visibility` (both transition in every baseline engine, so no `allow-discrete` is needed) and keeps
  its box; hidden it is out of the accessibility tree and the tab order (`visibility: hidden`).

**Fit.** Effects only, on `--ds-ease-in-out` (never overshoot); exits take 0.3-0.8 of the entrance as today.

**Files.** `src/motion.css`, `docs/motion.md` (Utilities), Motion Lab (the presence demo: hover tint while shown; the
keep variant with Rapid toggle), `test/css.test.js` (exit ratio, animated properties), `CHANGELOG.md`.

## F. Icons

### F1. A filled "on" glyph without project CSS (P3)

**Problem.** icons.md says `thumbUp` and `thumbDown` end with the outline path and may be filled
(`path:last-child { fill: currentColor }`) to show a chosen state by shape. Every project writes that rule and a
class for it, then pairs outline and filled glyph in a `.ds-icon-swap` under `aria-pressed`.

**Proposal.** A documented class `ds-icon--filled` that `icon(glyph, size, 'ds-icon--filled')` can add (CSS in
`base.css` or a small rule in `button.css`: `svg.ds-icon--filled > :last-child { fill: currentColor }`), the list of
glyphs that support it in icons.md (and a test that their last element is a closed outline), and the pattern
"outline as `__a`, filled as `__b` in `.ds-icon-swap`" as the documented markup for a rating toggle.

**Fit.** Status by shape, not only colour; glyphs keep no `fill` of their own (the class adds it).

**Files.** `src/` (one rule), `docs/icons.md`, `docs/components.md` (Button: icon swap), `test/css.test.js` or
`test/repo.test.js` (the fillable glyphs), styleguide icons section, `CHANGELOG.md`.

## G. Theming

### G1. Hooks for quieter themes (P2)

**Problem.** A theme with square surfaces, black text and a single pastel tint could set every role it needed but four
looks, which it had to restyle in project CSS (a deviation the project now lists and tests):

- `.ds-alert` has no hooks: its surface, ink and the kinds' containers come from roles shared with other components.
  A theme whose error colour fails as a container wants a neutral surface with a coloured line along the start
  edge instead.
- `.ds-field__hint--error` takes `--ds-on-error-container`; a theme whose error colour is not AA as text wants the
  message in `--ds-text` with the icon carrying the colour.
- `.ds-skeleton__line` takes `--ds-radius-action`; with round actions a placeholder that covers a square cell turns
  into a pill.
- `.ds-btn` has `--ds-btn-hover-decoration`, but the underline it turns on uses the browser's offset and thickness,
  not `--ds-link-underline-offset` and `--ds-link-underline-thickness`.

**Proposal.** Hooks with today's values as fallbacks: `--ds-alert-bg`, `--ds-alert-color` and `--ds-alert-edge` (a
`border-inline-start`, default none) for the neutral alert, and `--ds-alert-<kind>-bg`, `-color` and `-edge` for
`success`, `warning` and `error`; `--ds-field-error-color`; `--ds-skeleton-radius`; and `.ds-btn` reads `text-underline-offset: var(--ds-link-underline-offset)` and
`text-decoration-thickness: var(--ds-link-underline-thickness)` (no new hook: links and underlined buttons then
match).

**Fit.** Three token layers: hooks read with a fallback in one component, listed in theming.md and
`themes/example.css` (tested); contrast tests for any new default pair.

**Files.** `src/components/alert.css`, `form.css`, `loading.css`, `button.css`, `docs/theming.md`,
`themes/example.css`, `docs/components.md`, styleguide theme presets (`square` shows them), `test/tokens.test.js`,
browser baselines (themes), `CHANGELOG.md`.

## H. Tooling for projects

### H1. Verify a vendored copy without network (P3)

**Problem.** `vendor.sh --check <dest>` verifies a copy, but the vendored copy does not contain the script, so a
project's CI downloads it (or keeps its own copy of the hash logic) to check `SHA256SUMS`.

**Proposal.** Ship a dependency-free `verify.mjs` (Node) and `verify.sh` in `dist/` that check the directory they sit
in against its `SHA256SUMS` (same rules as `check_dir`: nothing missing, nothing added, no links). They are covered
by `SHA256SUMS` themselves.

**Files.** `scripts/build.mjs` (copy them into `dist/`), `scripts/vendor.sh` and `vendor.ps1` (reuse), `docs/install.md`,
`templates/update-dashboard-style.yml` (use it), `test/build.test.js`, the CI vendor round trip.

### H2. Deprecated names in machine-readable form (P2)

**Problem.** CHANGELOG.md marks names deprecated ("removed in 2.0"), and a project wants its check to fail before the
major removes them. Today it keeps a hand-written list of patterns, which the nightly update cannot keep current.

**Proposal.** `dist/deprecated.json`: one entry per deprecated class, hook, role, keyframe or export with `kind`,
`name`, `replacement`, `since` and `removal`, built from one source in `src/` and checked by a test against
CHANGELOG.md and the deprecation markers in `docs/` (the keyframe table test already reads them).

**Files.** a source list in `src/` or `scripts/`, `scripts/build.mjs`, `docs/install.md` ("When the update fails":
check your code against it), `test/repo.test.js`, `CHANGELOG.md`.

### H3. A conformance check for projects (P3)

**Problem.** The "Using Dashboard-Style in a project" block of AGENTS.md lists rules a project should keep, and the
project wrote about a thousand lines of tests to keep them: every `ds-` class it uses exists and its stylesheet is
bundled (`attach` needs `ripple.css`, `tooltips` needs `tooltip.css`), no deprecated name (H2), no colour, radius,
font, duration or curve literal in project components, no own `@keyframes`, themes set no motion tokens and nothing
on `:root`, and no project rule restyles a `.ds-*` component beyond its hooks and placement (with a named list of
deliberate deviations).

**Proposal.** A dependency-free `dist/tools/check-project.mjs <css and js globs>` with those checks and a small
config (`exceptions` with reasons, the project prefix, the theme files), printing offenders like the repository's
own tests. Its rule set is the project block of AGENTS.md, so the two stay in step (a test compares them).

**Files.** new tool and its tests, `docs/install.md`, the project block of `AGENTS.md`, `templates/` (optional CI
step). Larger than the rest; worth it once a second project adopts the system.

## Already covered (use this instead)

| Wish | Use |
|---|---|
| Put a view into the content panel but keep the `data-ds-keep` helpers (the sentinel) | `DS.dom.morphChildren(panel, [view], { replace: true })` (pass a detached view), or `morphHtml` for markup |
| Reset field values after a save (secrets the template never sends back) | `data-ds-replace` on those fields, or `{ replace: true }` for that one call |
| Keep a part's live content through a re-render | `data-ds-keep` on that node |
| Choose a mode with toggles in a track | `.ds-has-indicator > .ds-btn[aria-pressed]` with `createIndicator` (the outlined top-bar switch is A1) |
| Hide a tooltip's description when the name says the same | already done for `aria-describedby`; the bubble itself is C3 |
| An interactive card in another font than its context | it inherits on purpose (`font: inherit`); set `font` on its container |

## Dropped

The project's embedded chat widget, which runs inside other sites' pages, is being made fully independent of
Dashboard-Style. Proposals that served only that widget are dropped unless dashboards need them too:

| Wish | Why dropped |
|---|---|
| A Tab trap option for `.ds-dialog--contained` (Tab stays inside the embedded panel) | Only the embedded widget used it. Dashboards open dialogs over the window, where the native or div trap holds Tab; a contained dialog leaves the host page usable on purpose (components.md) |
| Smaller pieces for embedded widgets (a dialog-only `overlay.js`, a smaller `form.css`) | Only bundle size of an embedded widget. Dashboards load `ds.css` and `ds.js` or the single files of `dist/css/`, and the size of a whole-app bundle does not depend on it |
| An exported browser-floor check | Only the embedded widget had to hide itself on a host page in an old browser. A dashboard is built for the documented baseline ([install.md](../docs/install.md)) |
| `tooltips(root)` takes Escape only inside its root | A host-page concern of the embedded widget. In a dashboard the tooltip taking the first Escape is the WCAG 1.4.13 behaviour Dashboard-Style wants (the dialog under it stays open) |
| A disc-shaped state layer that grows into the pill (one theme's call to action) | One brand's look, not a general need; the project keeps it as a documented deviation |

Kept although it first came up in the widget: A3 (ending a press), because the admin app's chat view lets the mouse
drag a row of suggestion chips, and any dashboard with a drag-to-scroll row has the same problem.
