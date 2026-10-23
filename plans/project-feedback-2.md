# Plan: proposals from a second project migration (after 1.6.2)

Proposals collected on 2026-10-23, while an internal inventory app moved its own design layer onto Dashboard-Style
1.6.2: lists of devices, people, phone numbers, software and cameras in full-page tables with filters; record pages
with a save bar, a history timeline and fields that a nightly sync sets and the page must show as locked; an overview
with counts and charts; dialogs and side sheets for filters, choices and deletions. Each proposal is a piece the
project had to build itself, because Dashboard-Style lacked something every dashboard could use. The project's own
builders, wording and policies stay in the project and are not listed.

Nothing here is decided. This is a backlog for the owner, in the form of [project-feedback.md](project-feedback.md):
each proposal says what is missing, what Dashboard-Style could offer, how it fits [rules.md](../docs/rules.md) and
[motion.md](../docs/motion.md), and what a change would touch. Every proposal is additive (a new class, modifier,
element, hook, option, attribute or export, so a minor version) and would follow "Making a change" in
[AGENTS.md](../AGENTS.md). None changes what existing markup means: where a default would have changed existing
pages, the proposal is opt-in or dropped. A few also correct how existing markup behaves where today's behaviour is a
gap (a double click that closes the dialog it just opened, an `aria-disabled` switch that still looks enabled); they
are marked **Changed** or **Fixed**, would be named so in the CHANGELOG, and are collected under
[Cross-cutting decisions](#cross-cutting-decisions). Each was checked against `src/` and `docs/` at `964c602`;
wishes that Dashboard-Style already covers are listed at the end with what to use instead. Where a proposal meets one
of project-feedback.md, it says so and proposes one design for both.

> The plan sits outside `docs/` on purpose, like [motion-2.md](motion-2.md) and project-feedback.md:
> `test/repo.test.js` counts every `docs/**/*.md` as documentation, and a plan that names future classes and exports
> would satisfy those tests in advance.

The ids continue after project-feedback.md (A to H). Groups run from I to U; there is no group P, so an id never reads
like a priority.

**Priority:** **P1** fixes a gap that makes a documented pattern inaccessible or unsafe, or that every app frame
rebuilds; **P2** removes a helper a typical dashboard writes; **P3** is a convenience or an idea.

## Summary

| # | Proposal | Group | Priority |
|---|---|---|---|
| I1 | `data-ds-locked`: keep a dialog, sheet or modal drawer open while its action runs | Overlays | P1 |
| I2 | Why it closed: a `ds-close` event and `close(el, { reason })` | Overlays | P2 |
| I3 | `DS.overlay.topmost()`: is an overlay open, synchronously | Overlays | P2 |
| I4 | Backdrop and scrim guard: the double click that opened a layer does not close it | Overlays | P1 |
| I5 | Focus back to an opener that a re-render replaced (`returnTo`, id twin) | Overlays | P2 |
| I6 | No ring on a dialog box that holds fallback focus | Overlays | P3 |
| J1 | Snackbar action (Undo) with `toast(..., { action })` and its colour | Snackbars and tooltips | P2 |
| J2 | The same snackbar again restarts it (with C2's replace by key) | Snackbars and tooltips | P2 |
| J3 | `data-tip-truncated`: a tooltip only while the text is cut off | Snackbars and tooltips | P2 |
| J4 | A tap shows the tooltip of a `role="img"` trigger (with C3's touch tooltips) | Snackbars and tooltips | P2 |
| K1 | `.ds-dialog__body`: a scrolling middle between title and actions; `.ds-dialog--wide` | Dialog and sheet layout | P2 |
| K2 | A search over a long list in a dialog (pattern, `--ds-dialog-height`) | Dialog and sheet layout | P3 |
| K3 | Confirm by typing the name (recipe) | Dialog and sheet layout | P3 |
| K4 | Side sheet subtitle and foot; snackbars rise above the foot | Dialog and sheet layout | P2 |
| L1 | `.ds-savebar` and `DS.overlay.savebar()`: unsaved edits of a view | Save bar | P2 |
| M1 | `.ds-scroll-x` and `DS.motion.scrollEdges()`: a sideways scroller with edge fades | Tables and scrollers | P2 |
| M2 | `.ds-table-wrap--fill`: a full-page table with a sticky header | Tables and scrollers | P2 |
| M3 | `.ds-table--pin-first`: a pinned first column that keeps the whole-row link | Tables and scrollers | P2 |
| M4 | `flip()` raises gliding rows below sticky parts | Tables and scrollers | P2 |
| N1 | `.ds-list`: an outlined list of rows that open a record | Lists and record rows | P2 |
| N2 | Clickable key-value rows, row icons, quiet values and two kv fixes | Lists and record rows | P2 |
| N3 | `.ds-facts--rows` and `.ds-lock`: record details, values set elsewhere | Lists and record rows | P2 |
| N4 | `.ds-field--changed`, `.ds-field__value`, `.ds-form--rows`: editing in rows | Lists and record rows | P2 |
| N5 | `.ds-alert--plain` and `.ds-alert__title`: a quiet list of findings | Lists and record rows | P3 |
| O1 | Chart roles, the registered `--ds-share` and `.ds-enter--fill` | Charts | P2 |
| O2 | `.ds-meter` and `.ds-kv-list--bars`: value bars and distributions | Charts | P2 |
| O3 | `.ds-columns` (mini and grouped) and `.ds-legend` | Charts | P3 |
| Q1 | Input chips, action chips and a plain chip row | Chips and badges | P2 |
| Q2 | `flip(..., { refocus })`: focus moves to a neighbour when its item goes | Chips and badges | P1 |
| Q3 | `.ds-badge`: a count on a button or chip | Chips and badges | P2 |
| Q4 | A count in a drawer item | Chips and badges | P3 |
| Q5 | `.ds-badge--lg` and `.ds-card__row--leading`: a number before a card title | Chips and badges | P3 |
| R1 | An `aria-disabled` switch looks and acts blocked | Switch | P1 |
| R2 | `.ds-switch--locked`: a value another system sets | Switch | P2 |
| R3 | Switch hint, extras and `.ds-switch-list` | Switch | P3 |
| S1 | `.ds-timeline`: the history of a record | Timeline | P2 |
| T1 | Page head with a way back, actions and status | App frame and page | P2 |
| T2 | `.ds-drawer__back`: a way back above the destinations | App frame and page | P3 |
| T3 | `.ds-account--capsule`: the account with its sign-out action | App frame and page | P3 |
| T4 | `.ds-base--headings`: bare headings take the type roles (opt-in) | App frame and page | P3 |
| T5 | Every scroller is a containing block (`.ds-view`, `.ds-sheet__body`, `.ds-drawer__list`) | App frame and page | P1 |
| T6 | Small frame fixes: tap flash, menu button, link icon, a progress line in a page skeleton | App frame and page | P3 |
| U1 | `.ds-field__hint--success` and hints led by an icon | Forms and small fixes | P3 |
| U2 | `.ds-kbd` and `.ds-search__key`: the search shortcut | Forms and small fixes | P3 |
| U3 | `.ds-check-list` and `.ds-check__count`: many values from a long set | Forms and small fixes | P2 |
| U4 | `.ds-btn--disclosure`: the tint while what it opens is open | Forms and small fixes | P3 |
| U5 | A leading icon in button faces takes the shorter start padding | Forms and small fixes | P3 |
| U6 | Morph: an empty `style` or runtime state is the same shell | Forms and small fixes | P2 |
| U7 | `.ds-code-block`: preformatted blocks | Forms and small fixes | P3 |
| U8 | `.ds-alert__actions` and paragraphs in an alert | Forms and small fixes | P3 |
| U9 | Wrapping fixes: check labels, card titles, tile values | Forms and small fixes | P3 |

51 proposals: 5 at P1, 27 at P2, 19 at P3. Five would be new component files (`badge.css`, `savebar.css`,
`timeline.css`, `chart.css`, `scroller.css`); the rest extend existing files.

## Cross-cutting decisions

Decisions that hold across the groups, for whoever picks a proposal up:

| Topic | Decision |
|---|---|
| Opt-in where a default would change existing pages | Heading roles only under `.ds-base--headings` (T4); a snackbar restarts only with `restart: true` (J2); a tooltip hides while the text fits only with `data-tip-truncated` (J3); `DS.overlay` does not start setting `aria-expanded` on dialog and sheet openers (U4) |
| Changed (corrections of existing behaviour, visible, so named in the CHANGELOG, still minor) | the backdrop guard (I4); the id-twin focus fallback (I5); an `aria-disabled` switch looks blocked (R1); the `flip()` z range (M4); containing blocks change `offsetParent` (T5: a project element positioned absolutely inside `.ds-view` against the window would anchor to the view, so the release notes say so); a text button in `.ds-toast` takes the inverse primary (J1); `.ds-chips:empty` and `.ds-dialog__actions:empty` take no room (Q1, K1); the sheet body takes the thin scrollbar the view already has (K4); snackbar regions also glide vertically, only when a sheet foot or the save bar moves them (K4). Plain bug fixes are marked **Fixed** (I6, N2, Q1, T1, T6, U5, U6, U9). The `:not(.ds-facts--rows)` and `:not(.ds-alert--plain)` exclusions (N3, N5) only scope old rules away from new modifiers and change nothing on existing markup |
| One owner per shared piece | interactive kv rows belong to N2 and charts reuse them (O2); `data-tip-truncated` belongs to J3 and chips use it (Q1); the fallback-focus ring is I6; the sheet body's `position` is T5; the two-axis region glide is K4 and the save bar uses it (L1); the grouped chart sits in M1's `.ds-scroll-x` and has no scroller of its own (O3); the trailing link icon is T6; the kv fixes are N2 |
| Reuse before adding | a quiet value is the existing `.ds-muted` (`strong.ds-muted`), not a new element; badges pop with the existing `.ds-enter--pop`; the save bar enters as a `.ds-presence`; figures use `countUp()` |
| Tones | chip-like marks and row icons mirror `.ds-status`: `--ok`, `--warning`, `--error`; `.ds-status` has no `--neutral` (its plain form is neutral), so `--neutral` exists only on new blocks whose plain form is tinted (badge, meter); alerts keep their existing `--success` |
| Naming | blocks `.ds-badge`, `.ds-savebar`, `.ds-timeline`, `.ds-meter`, `.ds-columns`, `.ds-legend`, `.ds-scroll-x`, `.ds-list`, `.ds-check-list`, `.ds-switch-list`, `.ds-code-block`, `.ds-kbd`, `.ds-lock`; elements `__x`, modifiers `--x`. "Lock" would carry three meanings: the scroll lock (`lockScroll`, today), an overlay that refuses to close (I1) and a value another system sets (N3, R2). Decide the names together; I1's attribute is the one most open to another name |
| Attributes and properties | page-set: `data-tip-truncated`, `data-ds-locked` (as `data-ds-key` and `data-ds-keep` are page-set today); written by Dashboard-Style: `data-ds-overflow-start`, `data-ds-overflow-end`, `data-ds-edges`, `data-ds-savebar-rest`; runtime properties `--ds-share` (registered, set by the page), `--ds-savebar-height`, `--ds-toast-foot`, `--ds-scrollbar-width`, `--ds-scrollbar-height`, `--ds-table-pin-width`; registered internals `--ds-scroll-edge-start`, `--ds-scroll-edge-end`, `--ds-table-sticky-layer`, `--ds-table-sticky-tint` |
| Containing blocks | every new scroller declares `position` (T5 adds a test that holds it for all of them) |

### Dependencies and a suggested order

| Step | Proposals | Why in this order |
|---|---|---|
| 1 | I, J1, J3, J4 (overlay behaviour); M (tables and scrollers); U (forms); T (frame); R (switch); S (timeline) | no dependencies among them; the shared files (`tokens.css`, `utilities.css`, `index.css`) are touched in different places |
| 2 | Q1 and Q2 (chips: need J3; `motion.js` after M); N (lists: `ripple.css` after M and Q1, `form.css` and `alert.css` after U); K (needs the I1 lock in its recipes; `sheet.css` after T5) | each builds on step 1 |
| 3 | O (charts: after M1 and N2); Q3 to Q5 (badge: after Q1, U4 and T, whose tinted hosts it lists); L1 (save bar: after K4's two-axis glide; `page.css` after T1) | the largest pieces last |

From project-feedback.md: A2 (busy buttons block the keyboard) before K3 and L1, which run their action through
`busy()`; B1 (`watchScrolled()`) together with M1 (see there); C2 together with J2; C3 together with J3 and J4; E1
before L1 and U2; G1 before N5 and U1.

## I. Overlays

### I1. `data-ds-locked`: keep a dialog, sheet or modal drawer open while its action runs (P1)

**Problem.** "Delete 3 devices?" runs a request after the click. Until it settles, Escape, a backdrop click or the
Cancel button closes the dialog: the result has no place to show, a failure cannot keep the dialog open with the
field still filled, and a second attempt runs into the first. `DS.overlay` has no way to refuse a close. The project
wrote a lock per layer: a capture-phase Escape handler, a `cancel` listener with `stopImmediatePropagation()`, and
swallowed `[data-close]` clicks.

**Proposal.** A boolean attribute `data-ds-locked` on the overlay element (`.ds-dialog`, `.ds-sheet`, `.ds-drawer`),
set and removed by the page; Dashboard-Style reads it at each close attempt and never writes it. While it is set,
Escape (`preventDefault()`, a visible tooltip still takes Escape first), the native `cancel`, a `[data-close]` click
and a scrim click do not close. `close()` still closes, and so do `'removed'`, `'breakpoint'` and `'parent'`. Popups
(menus, combobox lists) ignore it. The lock neither busies nor disables buttons; that stays `busy()` and
`aria-disabled`.

```js
deleteButton.addEventListener('click', async () => {
  dialog.setAttribute('data-ds-locked', '');
  try { await DS.motion.busy(deleteButton, removeDevices()); }
  finally { dialog.removeAttribute('data-ds-locked'); }
  DS.overlay.close(dialog, { reason: 'confirm' });
});
```

Limits to document: Chromium's close-watcher anti-abuse rule can force a native close (Dashboard-Style then follows
with reason `'escape'`); a morph that drops the attribute unlocks.

**Fit.** Nothing moves. With A2 (busy buttons block the keyboard) the recipe needs no guard of its own. A deliberate
choice over a cancelable close event (see Dropped): a page cannot trap people by a buggy listener.

**Files.** `src/js/overlay.js`, `docs/components.md` (Dialog, Side sheet, App frame: the lock and the recipe; "Which
component" row "Keep a dialog or side sheet open while its action runs"), `docs/motion.md` (DS.overlay prose and the
"An overlay opened and closed" recipe), styleguide (a dialog "While its action runs"), Motion Lab (`dialog-work`:
open, lock and busy, Escape stays, unlock, close), `test/browser/overlay.spec.js` (native and div dialogs and sheets,
the modal drawer at 800px), `CHANGELOG.md`.

### I2. Why it closed: a `ds-close` event and `close(el, { reason })` (P2)

**Problem.** A page reacts differently to "closed by Escape", "closed by the backdrop" and "closed after saving"
(discard a draft, keep it, refresh the list). `DS.overlay` closes for many causes but reports none; the native `close`
event says nothing either. The project noted the cause just before each close and guessed it in a `close` listener.

**Proposal.** `close(element, { reason })` (default `'api'`), and a `CustomEvent('ds-close', { bubbles: true,
detail: { reason } })` on the overlay element, sent once, synchronously, when the close has started (trap released,
focus returned, `data-state="closed"`). Reserved reasons: `escape`, `backdrop`, `close` (`[data-close]`), `item` (a
menu item), `tab`, `outside`, `parent`, `api` (also a native close by the page), `removed`, `breakpoint`; any other
string is the page's. Not sent for a repeat close, a refused (locked) attempt or a reopen. Internally `cause` keeps
steering focus and `reason` is only reported.

**Fit.** No motion; the event is not cancelable (I1 is the veto).

**Files.** `src/js/overlay.js` (`closeFrom(element, cause, reason)`), `docs/motion.md` (DS.overlay table: `close(el,
{ reason })`, a reasons table), `docs/components.md` (Dialog: "Why it closed"), styleguide (a "Last close" line in
the I1 demo), `test/browser/overlay.spec.js` (every reason once, nested `parent` order, nothing during an exit),
`test/js.test.js` (no event for a never-opened element), `CHANGELOG.md`.

### I3. `DS.overlay.topmost()`: is an overlay open, synchronously (P2)

**Problem.** Page shortcuts (Escape to discard edits, Ctrl+S, "/" to search) and an auto-refresh must stand back
while a dialog, sheet or menu is open. `DS.overlay` knows the stack of every copy of ds.js on the page (`order`), but
pages cannot read it; the project kept its own "an overlay is open" flag in step with every open and close.

**Proposal.** `topmost(doc = document)` returns the topmost open overlay element of any copy (from 1.6.1 on, through
the shared state) or `null`. Overlays that are closing do not count. Side-effect free. It includes
`.ds-dialog--contained`; a host page that wants to ignore those checks the class.

```js
addEventListener('keydown', (event) => {
  if (event.key === '/' && !DS.overlay.topmost()) { event.preventDefault(); search.focus(); }
});
```

**Fit.** Not motion (a `LAB_EXEMPT`-style entry or shown by the I1 Lab demo). Filter options are deferred.

**Files.** `src/js/overlay.js`, `docs/motion.md` (DS.overlay row `topmost(doc?)`, recipe), `test/js.test.js` (export,
`null` without a DOM, two copies), `test/browser/overlay.spec.js` (nesting, during an exit, menu, drawer),
`test/browser/lab.spec.js` coverage, `CHANGELOG.md`.

### I4. Backdrop and scrim guard: the double click that opened a layer does not close it (P1)

**Problem.** People double-click a row action. The first click opens the dialog; the second lands on the backdrop
that has just appeared and closes it again, before the entrance has finished. A press that starts in the box and is
released over the backdrop (selecting text in a field) closes it too. The modal drawer's scrim has the same problem
on a tablet. The project wired every backdrop and scrim with a press record and a minimum open time.

**Proposal.** **Changed.** A backdrop (`.ds-dialog__backdrop`, `.ds-sheet__backdrop`) or scrim click from a real
pointer (`event.detail >= 1`) is ignored when `detail > 1`, when the press did not begin on that backdrop, or when
the overlay has been open for less than a new scale token `--ds-delay-dismiss` (300ms, `* --ds-time-scale`, fallback
export `DISMISS_DELAY_MS`). A script's `click()` (`detail === 0`) closes as before; `[data-close]` buttons are not
guarded.

**Fit.** A delay token in layer 1 next to the tooltip delays, shorter than `--ds-dur-slow` (tested); it scales with
the speed select. Nothing new moves.

**Files.** `src/tokens.css`, `src/js/overlay.js`, `docs/motion.md` (timing table row, Overlays "Delays" cells for
scrim and drawer scrim), `docs/tokens.md`, `test/tokens.test.js` (token equals the export, below `--ds-dur-slow`),
`test/js.test.js` (timing allow-list), `test/browser/overlay.spec.js` (double click on the opener, a press released
over the backdrop, `?speed=0.1`, touch double tap in Chromium and WebKit), `CHANGELOG.md` (Changed).

### I5. Focus back to an opener that a re-render replaced (P2)

**Problem.** A row's "Edit" opens a sheet; saving re-renders the list, and the row's button is a new node (a changed
shell, or a list built from scratch). On close, `DS.overlay` finds the opener disconnected and puts focus on the
landmark, so a keyboard user starts over at the top of the page. The project kept a key per opener and looked the
twin up itself.

**Proposal.** `open(el, { opener, container, returnTo })`. On close, the focus target is, in order: the opener chain
as today; `returnTo()` (called in try/catch; it must return something focusable outside the overlay); **Changed:**
an element with the opener's `id` in the opener's root (the id twin), when the opener is gone; the nearest
`[tabindex="-1"]` ancestor; the landmark.

**Fit.** Focus order (WCAG 2.4.3); no motion. Keyed rows (`data-ds-key`) usually survive a morph, so this is for
real replacements.

**Files.** `src/js/overlay.js`, `docs/motion.md` (the `open()` row), `docs/components.md` (Dialog: focus back after a
re-render), `test/browser/overlay.spec.js` (`replaceWith` with the same id, `returnTo`, never called while the
opener lives), `CHANGELOG.md`.

### I6. No ring on a dialog box that holds fallback focus (P3)

**Problem.** When nothing inside a dialog can take focus, `DS.overlay` parks it on the box (`tabindex="-1"`), and the
box shows the focus ring around the whole dialog. The sheet panel already avoids this with a transparent outline.
The project added `.ds-dialog__box[tabindex="-1"]:focus { outline: none }`.

**Proposal.** That rule in `dialog.css`, with a comment; a test that holds it for the box and the sheet panel.

**Fit.** Focus stays programmatic (no keyboard ring is lost: the box is not a tab stop). Forced colours keep the
box's border.

**Files.** `src/components/dialog.css`, browser test (box and panel with fallback focus show no ring),
`CHANGELOG.md` (Fixed).

## J. Snackbars and tooltips

### J1. Snackbar action (Undo) with `toast(..., { action })` (P2)

**Problem.** "Device removed. Undo" is the standard pattern after a reversible action. `toast()` takes text or an
element; with an element, the page builds the button itself (as `example/` does), and a `.ds-btn--text` inside
`.ds-toast` keeps `--ds-action-ink`, which is meant for light surfaces, not the inverse one, and the focus ring in the
wrong ink. (A message with such a button already stays until it is used or closed; that part is covered.) The project
built its own action message and colours.

**Proposal.** `toast(region, text, { action: { label, onClick } })` appends `button.ds-btn.ds-btn--text.ds-btn--sm
.ds-toast__action` before the close button; a message with an action gets the close button; a click
closes it first, then runs `onClick` (errors reported, not thrown); like any message with a button it stays until
used or closed, as today. **Changed:** `.ds-toast__action` and any
`.ds-toast > .ds-btn--text` take `--ds-toast-action-color` (fallback `--ds-inverse-primary`), the ring in
`--ds-on-inverse`.

```html
<div class="ds-toast" role="status">… <span class="ds-toast__text">Device removed.</span>
  <button class="ds-btn ds-btn--text ds-btn--sm ds-toast__action" type="button">Undo</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm ds-toast__close" type="button" aria-label="Close">…</button></div>
```

**Fit.** State layers, press and ripple from `.ds-btn`; no motion of its own. A contrast pair
`--ds-inverse-primary` on `--ds-inverse` in `TEXT_PAIRS`.

**Files.** `src/components/toast.css`, `src/js/overlay.js`, `docs/components.md` (Snackbar; "Which component" row
"Undo right after an action"), `docs/motion.md` (`toast()` signature), `docs/theming.md`, `docs/tokens.md`,
`themes/example.css`, styleguide (Snackbar "With an action"), `test/tokens.test.js`,
`test/browser/toast-tooltip.spec.js`, `example/` (its undo snackbar uses it), `CHANGELOG.md`.

### J2. The same snackbar again restarts it (P2, together with C2)

**Problem.** "Saved." after every save stacks three identical messages when people save three times; with
`TOAST_LIMIT` the next real message waits behind them. The project kept a map of standing messages and replaced its
own.

**Overlap.** C2 in project-feedback.md proposes `key`: a message with the key of an open one replaces it in place
(a retry that fails again). This one is the special case of the same text, where nothing should move at all.

**Proposal.** One matching path for both:

- `key: 'save-error'` (C2): a new message with the key of a shown or queued one replaces it in place, through the
  existing `flip()`.
- `restart: true`: shorthand for "the key is kind + normalised text + persistence". When it matches a shown message,
  nothing moves: its timer restarts and it is announced again; a queued match does nothing; the call returns the
  existing handle `{ el, close, closed }`. Element messages and messages with an action never match.
- Opt-in, so calls without either option behave exactly as in 1.6.2.

**Fit.** No new motion (the replacement is C2's flip; a restart moves nothing); the re-announcement goes through the
existing announcers (C1 would make them reachable for pages too).

**Files.** `src/js/overlay.js`, `docs/components.md` (Snackbar), `docs/motion.md` (Snackbars "Delays": "`restart`
restarts the timer of the same text"), styleguide ("Same message twice"), `test/browser/toast-tooltip.spec.js`
(three calls, one message, one handle, closes `timeout` after the last call, announced three times), `CHANGELOG.md`.

### J3. `data-tip-truncated`: a tooltip only while the text is cut off (P2)

**Problem.** Table cells, row names and filter chips end in an ellipsis on narrow panels. A tooltip with the full
text is needed while the text is cut off, and only then: when it fits, the bubble repeats what is on screen. The
project measured `scrollWidth` on hover and focus and switched its own attribute on and off.

**Overlap.** C3 proposes "no tooltip while the visible text equals `data-tip`". The two cover different cases and
combine: C3's rule as the automatic default (a tip that repeats the visible label never shows), `data-tip-truncated`
for the case where the tip is the full form of a shortened text (shown only while cut off). `tooltips()` already
skips `aria-describedby` when the accessible name says the same; the bubble is what both proposals add.

**Proposal.** A boolean `data-tip-truncated` on a `[data-tip]` trigger: `tooltips()` shows its tip only while the
trigger or one of its first 24 descendant elements clips its content on either axis (`overflow` not visible and
`scrollWidth > clientWidth + 1`; SVG and `.ds-sr` skipped), checked on hover, on focus and again when the delay ends.
Such a tip never sets `aria-describedby` (the text is already in the name).

```html
<td class="ds-col--text"><a class="ds-table__row-link" href="/devices/42" data-tip="LAPTOP-0042-FINANCE-WEST" data-tip-truncated>LAPTOP-0042-FINANCE-WEST</a></td>
```

**Fit.** Tooltip motion and WCAG 1.4.13 behaviour unchanged.

**Files.** `src/js/overlay.js` (`tooltips()`), `docs/components.md` (Tooltip "Only when cut off"; Chips and Table point
to it), styleguide (a 160px column, one name cut off, one fitting), `test/browser/toast-tooltip.spec.js` (fits: no
tip; cut off: shows on hover and at once on focus, no describedby; resizing changes it; a clipping descendant counts),
`CHANGELOG.md`.

### J4. A tap shows the tooltip of a `role="img"` trigger (P2, together with C3)

**Problem.** On a phone the top bar shows only the account avatar (`role="img"`, `data-tip` with name and email, as
components.md asks below 720px). `tooltips()` never shows on touch, so the name is unreachable. The project faked a
`pointerover` on a touch click.

**Overlap.** C3 proposes touch tooltips in general: a long press on any trigger, and a tap on an `aria-disabled`
trigger. A tap on a `role="img"` trigger is the third case of the same rule: a tap shows the tooltip at once where the
tap has nothing else to do. One touch model for both plans:

- tap shows at once on `[role="img"][data-tip]` and on `[aria-disabled="true"][data-tip]`; a second tap on it or a
  press elsewhere hides;
- long press shows on any other trigger and suppresses the click that follows (C3);
- a `data-tip-truncated` tip (J3) follows the same rules while it is cut off.

**Proposal.** In `tooltips()`, on touch only: remember the trigger on `pointerdown`, show on a `pointerup` over the
same trigger (not `click`, because of WebKit's click quirks), toggle on a second tap; `pointercancel` clears it. Mouse
and pen unchanged.

**Fit.** Tooltip motion unchanged; dismissable as today.

**Files.** `src/js/overlay.js`, `docs/components.md` (Tooltip; App frame: "a tap shows it on touch screens"),
`docs/motion.md` (Overlays "Delays": the tap), `test/browser/toast-tooltip.spec.js` (Chromium and WebKit with touch:
shows at once, a second tap hides, a button with `data-tip` shows nothing on a tap), `CHANGELOG.md`.

## K. Dialog and sheet layout

### K1. `.ds-dialog__body`: a scrolling middle between title and actions (P2)

**Problem.** A dialog with a form of ten fields, or a list to choose from, is taller than a laptop window. Today the
whole box scrolls, so the title and the actions scroll out of view. The project overrode `.ds-dialog__box` as a flex
column and wrote a scrolling middle with room for focus rings, plus a wide variant and `:empty` rules.

**Proposal.**

- `.ds-dialog__body`: when the box has one (`:has(> .ds-dialog__body)`), the box becomes a column and only the body
  scrolls (`overflow-y: auto`, `overscroll-behavior: contain`, thin scrollbar); every other box child is pinned. The
  body keeps room for rings and check halos (`margin: -space-3; padding: space-3`, `scroll-padding-block`), and is a
  containing block. Text first in the body sits 8px under the title, as today.
- In a window 320px high or lower the body stops scrolling and the box scrolls as a whole.
- `.ds-dialog--wide` (`--ds-dialog-width-wide`, 560px); `.ds-dialog__body:empty` and `.ds-dialog__actions:empty`
  take no room (**Changed** for the latter).
- A body that scrolls and holds nothing focusable gets `tabindex="0"`, `role="region"` and a name (docs).

```html
<div class="ds-dialog__box">
  <h2 class="ds-dialog__title" id="t">New ticket</h2>
  <div class="ds-dialog__body"> … fields … </div>
  <div class="ds-dialog__actions"> … </div>
</div>
```

The existing `.ds-dialog__box` rule is not changed: a dialog without a body behaves as in 1.6.2.

**Fit.** Body, title and actions move with the box (no motion of their own); the focus ring snaps as everywhere.

**Files.** `src/components/dialog.css` (header markup, hooks line, Progressive: `scrollbar-color`),
`docs/components.md` (Dialog "A scrolling body"; "Which component" row), `docs/theming.md`, `themes/example.css`,
styleguide (a long dialog; an inline contained one in a 360px frame), `test/css.test.js` (the body contract, ring
room, the 320px fallback), a browser spec (1280×600: only the body scrolls; 320×256: the box scrolls; focus scroll
keeps the ring inside), baselines, `CHANGELOG.md`.

### K2. A search over a long list in a dialog (P3)

**Problem.** "Choose an owner" from 240 people: a search on top, the list below, a live count. The project made the
search sticky inside a scrolling list, then had to watch the list's height (a `ResizeObserver`, a minimum list
height) so focus never hid under the sticky search, and capped the list at a fixed height.

**Proposal.** A documented pattern on K1, with no new CSS: box children outside the body are pinned by layout, not by
`position: sticky`, so nothing can cover focus (WCAG 2.4.11) and nothing is measured.

```html
<dialog class="ds-dialog ds-dialog--wide" aria-labelledby="o-title">
  <div class="ds-dialog__backdrop" data-close></div>
  <div class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="o-title">Choose an owner</h2>
    <div class="ds-search">[icon search 20]<input class="ds-input" type="search" aria-label="Search people" aria-controls="o-list" autofocus></div>
    <div class="ds-dialog__body"><div class="ds-radios" role="radiogroup" id="o-list" aria-label="People"> … </div></div>
    <p class="ds-meta" aria-live="polite">12 of 240 people</p>
    <div class="ds-dialog__actions"> Cancel · Choose (aria-disabled with a data-tip until one is chosen) </div>
  </div>
</dialog>
```

A hook `--ds-dialog-height` (default `auto`) keeps the box steady while results filter; set it with
`style.setProperty()` or project CSS (a strict CSP blocks a style attribute). Filtering with `morphHtml` and `flip`;
no matches show `.ds-empty`.

**Fit.** The list glides through `flip()`; the empty state fades in (`enter(empty, 'fade')`).

**Files.** `src/components/dialog.css` (the hook and the header markup), `docs/components.md` (Dialog "A search over a
list"), `docs/theming.md`, `themes/example.css`, styleguide (about 40 people), a browser test (steady box height at
40, 2 and 0 rows; the search does not move), `CHANGELOG.md`.

### K3. Confirm by typing the name (P3)

**Problem.** Deleting a record that others depend on asks for its name. The pieces exist (dialog, field,
`aria-disabled` with a reason, busy faces), but the order of states is easy to get wrong: Enter while the action is
blocked, a field still editable while deleting, a dialog that closes while the request runs, focus after a failure.

**Proposal.** A recipe in components.md and a styleguide demo, no new CSS or JS: an `alertdialog` with
`.ds-dialog--wide`, a `.ds-dialog__body` with the text, a `.ds-alert--warning` about the consequence and a field
("Type **LAPTOP-0042** to confirm", `autocomplete="off"`, `spellcheck="false"`, `autofocus`); the action stays
`aria-disabled` with a `data-tip` until `value.trim()` matches; Enter (not while composing) runs it when it matches;
while working the dialog is locked (I1), the field `readOnly`, Cancel `aria-disabled` with a tip, the action
`busy(action, work, { done: false })`; on success unlock, `close(dialog, { reason: 'confirm' })` and a snackbar; on
failure unlock, keep the value and show an error snackbar in the dialog.

**Fit.** One disabled model; status never by colour alone; A2 removes the need for the recipe's own guard against
Enter while busy.

**Files.** `docs/components.md` (Dialog "Confirm by typing the name"; "Which component" row), styleguide (success and
failure demos), a browser test (blocked until the name matches, locked during work, focus after success and
failure), `CHANGELOG.md`.

### K4. Side sheet subtitle and foot; snackbars rise above the foot (P2)

**Problem.** A filter sheet shows a live count under its title ("47 of 163 devices") and keeps "Reset" and "Done" in
a pinned foot. `.ds-sheet__head` has only a title and a close button, and there is no foot: the project wrote a head
text column, a subtitle, a foot with safe-area padding and a body that pads less above it. A snackbar shown in the
sheet then covers the foot's buttons.

**Proposal.**

- `.ds-sheet__heading` (a grid around title and subtitle) and `.ds-sheet__subtitle` (meta font, tabular figures,
  ellipsis, `:empty` takes no room); the head stays 64px.
- `.ds-sheet__foot`: pinned under the body, wrapping actions at the end, a leading `.ds-meta` pushes them, top border
  `--ds-sheet-foot-border`, safe-area padding, phone padding; `:empty` takes no room; the body's end padding shrinks
  above a foot and keeps `data-toast-reserve`.
- `.ds-sheet__head > .ds-btn` never shrinks; buttons in the body keep stretching as today (a button at its own
  width goes into the foot or a row of the page's); the body gets the thin scrollbar the view already has
  (**Changed**).
- Snackbars in a sheet with a foot sit above it: `DS.overlay` writes `--ds-toast-foot` on the region it hosts, and
  the region's glide (`glideRegion()`) works on both axes (**Changed**: regions also glide vertically when a foot or
  the save bar moves them; with neither nothing differs).

```html
<section class="ds-sheet__panel">
  <div class="ds-sheet__head">
    <div class="ds-sheet__heading"><h2 class="ds-sheet__title" id="f-title">Filters</h2>
      <p class="ds-sheet__subtitle" aria-live="polite">47 of 163 devices</p></div>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-close aria-label="Close">…</button>
  </div>
  <div class="ds-sheet__body" tabindex="0"> … </div>
  <div class="ds-sheet__foot"><button class="ds-btn ds-btn--text" type="button">Reset</button><button class="ds-btn ds-btn--primary" type="button" data-close>Done</button></div>
</section>
```

**Fit.** Head, subtitle and foot move with the panel; only the body swaps on a record change. The two-axis glide is
the existing region glide (`--ds-dur-medium`, `--ds-ease-in-out`); L1 relies on it. B1 (`watchScrolled()`) would keep
the head hairline right in the scrolling body.

**Files.** `src/components/sheet.css`, `src/components/toast.css` (`.ds-sheet > .ds-toasts` above the foot),
`src/js/overlay.js` (internal: measure the foot, both axes), `docs/components.md` (Side sheet; Snackbar),
`docs/motion.md` (Snackbars: both axes), `docs/theming.md`, `themes/example.css`, styleguide ("Filters" with a live
subtitle and a foot), `test/css.test.js` (`RUNTIME` gains `--ds-toast-foot`), `test/repo.test.js` (`NOT_HOOKS` for
`--ds-toast-shift-y`), `test/browser/toast-tooltip.spec.js` (the message's bottom stays above the foot, glides back),
baselines (desktop and phone), `CHANGELOG.md`.

## L. Save bar

### L1. `.ds-savebar` and `DS.overlay.savebar()`: unsaved edits of a view (P2)

**Problem.** A record page edits many fields and saves them together. While something is unsaved, a floating bar at
the bottom of the view says "2 unsaved changes" with Discard and Save; it must not cover the field in focus (WCAG
2.4.11), must push snackbars above itself, must not change the page height when it appears, must give focus a place
when it hides, and leaves room at the end of the page while it is shown. The project wrote about 300 lines for this:
measuring, reserving padding, keeping focus clear, a rest state after hiding near the end of the page, and print.

**Proposal.** A new component and one export.

```html
<main class="ds-view">
  <div class="ds-content"> … the page … </div>
  <div class="ds-savebar">
    <div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>
      <p class="ds-savebar__text">2 unsaved changes</p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button">Discard</button>
        <button class="ds-btn ds-btn--primary" type="button"><span class="ds-btn__faces">…Save…</span></button>
      </div>
    </div>
  </div>
</main>
```

- CSS: `.ds-savebar` is the last child of `.ds-view`, sticky at the bottom with no layout height; the bar sits in the
  page column (`--ds-savebar-inset`), on the overlay elevation; while shown, the view's `scroll-padding-bottom` and
  the content's end padding make room for it, and snackbars of the frame's region rise above it (a page value of
  `--ds-toast-bottom` still wins). `.ds-content` exposes `--ds-content-pad-bottom` (read-only, value unchanged). Print
  hides it. Hooks `--ds-savebar-offset`, `-inset`, `-min-height`, `-radius`, `-bg`, `-shadow`.
- JS: `DS.overlay.savebar(element, { focusTarget })` returns `{ element, show(), hide(), update(fn), shown,
  destroy() }`, one controller per element. `show()` measures and writes `--ds-savebar-height`, glides open
  snackbars up (K4's two-axis glide) and keeps the focused element clear; `hide()` moves focus out of the bar
  (`focusTarget()`, else the view), makes it `inert` while it leaves, and sets `data-ds-savebar-rest` when the page
  was scrolled to its end, so the end does not jump; `update(fn)` waits while the bar leaves. Outside `.ds-view` it
  warns once.

**Overlap.** E1 (`.ds-presence` that keeps its own transitions): the bar is a presence with no hover, so E1 changes
nothing visible here, but both touch the presence rules, so they go together. A2: the bar's Save button runs
through `busy()`, and A2 stops Enter from saving twice. C2's `reserve` would compute
`data-toast-reserve` for an error snackbar above the bar.

**Fit.** Entrance as `.ds-presence` with `--ds-scale-enter` from the bottom edge; snackbars glide; nothing else moves.
Forced colours: the bar is a floating layer with an outline. `:has()` on `.ds-app` has a cost to measure
(`perf.spec.js`).

**Files.** `src/components/savebar.css` (new, imported last), `src/components/page.css`, `src/index.css`,
`src/js/overlay.js`, `docs/components.md` (`## Save bar`; "Which component" row "Unsaved edits of a view, saved or
discarded together"), `docs/motion.md` (Feedback row, DS.overlay row), `docs/theming.md`, `docs/tokens.md`,
`themes/example.css`, styleguide (inline specimens; "Try it") and Motion Lab (`savebar`), `test/css.test.js`,
`test/js.test.js`, a browser spec (no page child moves on show; placement at 1280, 1000 and 390; snackbars above;
keep-clear; focus rescue; print), the Components tile, `CHANGELOG.md`.

## M. Tables and scrollers

### M1. `.ds-scroll-x` and `DS.motion.scrollEdges()`: a sideways scroller with edge fades (P2)

**Problem.** A strip of months, a chart over years or a row of tiles wider than the panel scrolls sideways. Edge
fades exist only for a `.ds-table-wrap` inside a card (driven by `ds-edge-fade` where scroll timelines exist, else a
fixed fade at the end edge that shows even at the end of the scroll, and unaware of scrollbars). The project wrote its own scroller, masks, a scroll listener
with a shared `ResizeObserver` and attributes for the fallback, and re-ran it after every re-render.

**Proposal.**

- `.ds-scroll-x` (new `scroller.css`): `overflow-x: auto`, thin scrollbar, ring room, a containing block; fades at
  each end that grow in over `--ds-space-8` while there is more to scroll, driven by a new keyframe
  `ds-scroll-edges` on two registered numbers (`--ds-scroll-edge-start`, `--ds-scroll-edge-end`) where scroll
  timelines exist, else by `data-ds-overflow-start` and `data-ds-overflow-end`; the scrollbar strip is never faded;
  no fade while focused or printed.
- `DS.motion.scrollEdges(scroller)` returns `{ update, detach }`: one handle per element; it writes the two
  attributes, `data-ds-edges`, `--ds-scrollbar-width` and `--ds-scrollbar-height`, and (for M3) `--ds-table-pin-width`,
  as owned state that survives `morphHtml`; a passive scroll listener (one update per frame), a `ResizeObserver` and
  RTL-aware positions; `resyncScroll()` when the overflow goes.

```html
<div class="ds-scroll-x" role="group" aria-label="Months"><div class="(a track, width: max-content)"> … </div></div>
```

**Overlap.** B1 proposes `DS.dom.watchScrolled()` for the vertical `data-scrolled` recipe. Both are "a scroller
reports its edges as attributes": decide them together, in one module and with one naming (`watchScrolled` for the
block axis, `scrollEdges` for the inline axis, or one function with an axis option). D1's `--ds-table-fade` hook
(turn the wrapper's fade off) should also turn off these fades on a table wrapper, so a theme has one switch. A drag
to scroll with the mouse needs A3 to end a held ripple.

**Fit.** Scroll-driven with an attribute fallback (rules.md); the fade transitions on `--ds-dur-fast`
`--ds-ease-in-out`; a new `@keyframes` gets its row in motion.md and the scroll-linked exemptions in the tests.

**Files.** `src/components/scroller.css` (new), `src/motion.css`, `src/tokens.css` (registrations), `src/index.css`,
`src/js/motion.js`, `docs/components.md` (`## Horizontal scroller`; "Which component" row), `docs/motion.md`
(keyframe row, JS row, Progressive), `docs/tokens.md`, styleguide (a strip of 16 months) and Motion Lab
(`scroll-x`), `test/css.test.js`, `test/motion.test.js` (stub suite), `test/js.test.js`, browser tests (fades, the
scrollbar strip, morph keeps the attributes), the Components tile, `CHANGELOG.md`.

### M2. `.ds-table-wrap--fill`: a full-page table with a sticky header (P2)

**Problem.** A list view is one table that fills the page: 30 to 3000 rows, nine columns, the header in view while
scrolling down, sideways scrolling on a laptop. `.ds-table-wrap` scrolls only sideways and its header comment rules
out a sticky header ("it would stick to the wrapper"). The project wrote its own wrapper: fill height, own scroller in
both axes, border and radius, sticky header, one-line cells with an ellipsis at 280px, fades at the end, print rules.

**Proposal.** A modifier `.ds-table-wrap--fill`: fills its flex parent up to `--ds-table-fill-max-height` (the page
sets the bounded height), scrolls both ways, isolates, card border and radius on `--ds-table-sticky-bg`, thin
scrollbars; the header cells sticky at `--ds-z-sticky`; `scroll-padding-top` of a header row (48px, 40px dense) and
`scroll-padding-left` of the pinned column (M3), so keyboard focus is never hidden; end fades from M1's keyframe
with the border and scrollbars kept out of the mask; cells one line with an ellipsis at `--ds-table-cell-max-width`
(280px; J3 gives them the full text); print shows everything.

```html
<div class="ds-table-wrap ds-table-wrap--fill" tabindex="0" role="region" aria-label="Devices">
  <table class="ds-table ds-table--interactive ds-table--pin-first"> … </table>
</div>
```

**Overlap.** D1's `.ds-table--stack` turns rows into blocks on narrow panels; a stacked table has no sticky header
and no pinned column, so `--fill` and `--pin-first` step aside under the stack's container query.

**Fit.** Hairlines and fades from tokens; no new motion apart from M1's keyframe.

**Files.** `src/components/table.css` (header rewrite, Progressive: scroll-driven, `overflow-clip-margin`,
`scrollbar-color`), `docs/components.md` (Table "Full-page tables and pinned columns"; correct the scroll bullet),
`docs/theming.md`, `themes/example.css`, styleguide (30 rows × 9 columns in a fill frame), browser tests (sticky
header hit test, fades, print, 390px, cell max width; probe Firefox and WebKit first and record any gap), baselines,
`CHANGELOG.md`.

### M3. `.ds-table--pin-first`: a pinned first column that keeps the whole-row link (P2)

**Problem.** With nine columns scrolled sideways, the name column has to stay. Making the first cell sticky breaks
`.ds-table--interactive` in four ways: the sticky cell becomes the containing block, so the stretched
`.ds-table__row-link` covers only that cell; the ripple is confined to it and paints under its background; the
translucent state layers let content scroll visibly underneath; controls lifted to `--ds-z-raised` in later cells
paint over the pinned column. The project forwarded clicks from the row to the link itself (including Ctrl, Meta,
Shift and middle click for a new tab), switched the ripple off, and painted opaque layers by hand.

**Proposal.**

- `.ds-table--pin-first` (in `--fill` and in a card's wrapper): the first cell sticky at a new `--ds-z-pinned` (the
  fill table's corner at `--ds-z-sticky-pinned`); state layers on pinned cells through two registered colours
  (`--ds-table-sticky-layer`, `--ds-table-sticky-tint`) painted over an opaque base; a hairline at its end that
  appears once the table scrolls (scroll-driven, else `data-ds-edges`); `Canvas` in forced colours; never on
  `.ds-table__detail` rows.
- `DS.ripple.attach()` forwards clicks in pinned interactive rows outside controls to the row link (no forwarding
  with a text selection; modifier keys and middle click open a new tab; a page `preventDefault()` cancels), and the
  ripple runs in two parts (the row and the pinned cell, same centre).

**Fit.** Hover, press and selected states as on every row (a selected row keeps its checkbox); ripple and press as
on every row; no new motion. `DS.dom.rowLinks()` as
its own export was considered and is not proposed (see Dropped).

**Files.** `src/components/table.css`, `src/components/ripple.css`, `src/js/ripple.js`, `src/tokens.css` (two z
steps), `docs/components.md`, `docs/motion.md` (DS.ripple: forwarding, two-part ripple), `docs/tokens.md`, styleguide
(card table `--wide --pin-first`), `test/css.test.js` (no `background-color` on pinned cells outside forced colours),
`test/tokens.test.js` (z order), browser tests (pin hit test, forwarding, two ripple spans, opaque pinned cell),
`CHANGELOG.md`.

### M4. `flip()` raises gliding rows below sticky parts (P2)

**Problem.** `flip()` gives each gliding item an inline `z-index` from `--ds-z-raised + 1 + rank`, without an upper
bound. Dashboard-Style has no sticky table header today, but a page's own (or M2's) sits at `--ds-z-sticky` (20): a
sort with 18 or more movers lets rows paint over the header in engines where a table section is no stacking context.

**Proposal.** **Changed.** `raise()` reads `--ds-z-pinned`, `--ds-z-raised` and `--ds-z-sticky` once per flush and
uses `max(base + 1, min(base + 1 + rank, sticky - 1))`, with the base above a pinned column (M3).

**Fit.** The glide itself is unchanged.

**Files.** `src/js/motion.js`, `docs/motion.md` (the `flip` row: the z range), `test/browser/flip.spec.js` (more than
20 movers under a sticky header), `CHANGELOG.md` (Changed).

## N. Lists and record rows

### N1. `.ds-list`: an outlined list of rows that open a record (P2)

**Problem.** A person's devices, a device's software, the results of a search: a short list of rows, each with an
icon, a title, a meta line, a status chip, maybe an action and a chevron, the whole row opening the record. A table
is too heavy, `.ds-kv-list` is for label and value, cards take too much room. The project built its own row list with
a stretched link, state layers and a current-row tint.

**Proposal.** `.ds-list` (`ul`/`ol`, outlined with `--ds-line` and `--ds-radius-card`, never clipping, `:empty`
hidden) with `__item` (a flex row with hairlines; the end rows inherit the corners), `__icon`, `__text`, `__title`,
`__meta` (tabular), `__actions`, `__chevron`; `--interactive` (exactly one stretched `.ds-list__action`, a link or a
button; hover, focus layer, inset ring, press; the actions sit above it); `--current` (a quiet tint,
`--ds-list-current-bg`, plus `aria-current` and a word, never the tint alone); a disabled action blocks the row.
Rows wrap below 600px. Rows keep `data-ds-key`, so `flip()` and `morphHtml()` work, with the glide backing.

```html
<ul class="ds-list" aria-label="Devices">
  <li class="ds-list__item ds-list__item--interactive" data-ds-key="d42">
    [icon laptop 20 .ds-list__icon]
    <span class="ds-list__text">
      <span class="ds-list__title"><a class="ds-list__action" href="/devices/42">LAPTOP-0042</a></span>
      <span class="ds-list__meta">Notebook 14 · Building A</span>
    </span>
    <span class="ds-status ds-status--warning">[icon alert 16]<span>Warranty ends</span></span>
    [icon chevronRight 20 .ds-list__chevron]
  </li>
</ul>
```

**Fit.** The press model of rows (state layer and ripple, no morph); `.ds-list__item--interactive` becomes a ripple
host (`RIPPLE_HOSTS`, `HOST_LINK`, `STRETCHED`); status never by colour alone. The name `.ds-list` next to
`.ds-plain-list` needs a sentence in the docs.

**Files.** `src/components/list.css`, `src/components/ripple.css`, `src/js/ripple.js`, `docs/components.md` (Lists
"Row list"; "Which component" row), `docs/motion.md` (Feedback row "Row list"), `docs/theming.md`,
`themes/example.css`, styleguide ("Row list") and Motion Lab (`row-list`; `press` and `focus` gain a row),
`test/css.test.js`, `test/js.test.js` (hosts), browser tests (ripple and navigation, a button in a row, disabled,
flip with the backing), baselines, `CHANGELOG.md`.

### N2. Clickable key-value rows, row icons, quiet values and two kv fixes (P2)

**Problem.** An overview card lists counts ("Without owner 12", "Warranty ended 3"); each row opens the filtered list.
`.ds-kv-list` rows are static, so the project made the whole row a button with its own state layers, added a warning
icon per row and a quiet look for zero values. Two fixes on the way: the last row keeps its bottom padding in a card,
and a long name pushes the value out.

**Proposal.**

- `.ds-kv-list--interactive` with `.ds-kv-list__row` (`a`, `button` or `div`): the row hangs by `--ds-space-2` on
  both sides so the state layer has room, `--ds-radius-sm`, the press model of rows, ring snap, disabled model.
- `.ds-kv-list__icon` with `--ok`, `--warning`, `--error` (the status roles); the page adds the `.ds-sr` word.
- A zero or missing value is `strong.ds-muted` (existing utility) with a regular weight, never coloured.
- **Fixed:** `.ds-kv-list li:last-child { padding-bottom: 0 }`, and `li > span { min-width: 0; overflow-wrap: anywhere }`.

```html
<ul class="ds-kv-list ds-kv-list--interactive">
  <li><a class="ds-kv-list__row" href="/devices?owner=none"><span>Without owner</span>
    [icon alert 16 .ds-kv-list__icon .ds-kv-list__icon--warning]<span class="ds-sr">Warning:</span><strong>12</strong></a></li>
  <li><a class="ds-kv-list__row" href="/devices?warranty=ended"><span>Warranty ended</span><strong class="ds-muted">0</strong></a></li>
</ul>
```

**Fit.** Tabular figures; no morph on rows; status by icon and word.

**Files.** `src/components/list.css`, `src/components/ripple.css`, `src/js/ripple.js`, `docs/components.md` (Lists
"Clickable values"), `docs/motion.md` (Feedback row), styleguide, `test/css.test.js`, browser tests, baselines,
`CHANGELOG.md` (Added; Fixed for the two kv rules).

### N3. `.ds-facts--rows` and `.ds-lock`: record details, values set elsewhere (P2)

**Problem.** A record page shows twenty name/value pairs in two columns with hairlines, the way a settings page does.
`.ds-facts` lays them out as a grid of 220px tiles. Some values come from a directory or a nightly sync and cannot be
edited here; the page must say so, by more than a grey colour. The project wrote its own rows and a lock marker with
a tooltip.

**Proposal.**

- `.ds-facts--rows`: the same `dl > div > dt + dd` markup in two columns (`--ds-facts-label-width`, 36%) with
  hairlines; the existing `.ds-facts` rules gain `:not(.ds-facts--rows)` (scoping only: existing markup is unchanged).
- `.ds-lock`: a small inline marker (`role="img"`, `aria-label`, `data-tip`, optional `tabindex="0"` for the
  tooltip), `--ds-text-2`, not an action.

```html
<dl class="ds-facts ds-facts--rows">
  <div><dt>Serial number</dt><dd>SN-0042 <span class="ds-lock" role="img" aria-label="Set by the directory sync" data-tip="Set by the directory sync" tabindex="0">[icon lock 16]</span></dd></div>
</dl>
```

**Fit.** A value another system sets is locked, not disabled (the rule R2 also states for switches).

**Files.** `src/components/list.css`, `docs/components.md` (Lists "Details in rows"; "Which component" rows),
`docs/rules.md` (one sentence), `docs/theming.md`, `themes/example.css`, styleguide ("Details"), `test/css.test.js`
(the exclusions), baselines, `CHANGELOG.md`.

### N4. `.ds-field--changed`, `.ds-field__value`, `.ds-form--rows`: editing in rows (P2)

**Problem.** The same record page switches to editing in the same rhythm: one field per row with hairlines, read-only
values in field layout next to inputs, and a mark on every field changed since the last save (the save bar of L1
counts them). The project wrote its own row form, a value element and a dot with a screen-reader word.

**Proposal.**

- `.ds-field--changed` with `.ds-field__changed` (a `.ds-sr`-like word in the label, hidden unless changed): the
  label draws a 6px dot after it (`--ds-field-changed-color`), in on `--ds-dur-fast` `--ds-ease-in-out`, out on
  `--ds-dur-instant` `--ds-ease-in`; `CanvasText` in forced colours.
- `.ds-field__value`: a read-only value in a field (body font, tabular, `overflow-wrap: anywhere`).
- `.ds-form--rows`: no gap, hairlines between fields, controls at most `--ds-form-rows-control-max`.

```html
<div class="ds-field ds-field--changed">
  <label class="ds-field__label" for="room">Room <span class="ds-field__changed">(changed)</span></label>
  <input class="ds-input" id="room" value="B 2.14">
</div>
```

**Fit.** Status by word and dot, not colour alone; the dot's timing gets a row in the Controls table and a control
ratio in the tests.

**Files.** `src/components/form.css`, `docs/components.md` (Form: changed, value, rows), `docs/motion.md` (Controls
row), `docs/theming.md`, `themes/example.css`, styleguide ("Edit in rows") and Motion Lab (`field-changed`),
`test/css.test.js` (`CONTROL_RATIOS`, forced colours), browser tests (dot timing, the word in the name),
`CHANGELOG.md`.

### N5. `.ds-alert--plain` and `.ds-alert__title`: a quiet list of findings (P3)

**Problem.** A record card lists what needs attention ("No owner since March", "Warranty ends in 30 days"), each with
an icon, a short title and a sentence. A stack of `.ds-alert` containers is too loud inside a card. The project wrote
its own findings list.

**Overlap.** G1 proposes alert hooks (`--ds-alert-bg`, `--ds-alert-color`, `--ds-alert-edge`, per kind). With G1,
`--plain` is a preset of those hooks (transparent surface, text ink, no edge) plus the row spacing, not a second set
of colour rules.

**Proposal.** `.ds-alert--plain` inside the existing `ul.ds-plain-list`: no container, `--ds-text` title,
`--ds-text-2` text, hairlines between consecutive plain alerts; `.ds-alert__title` (label font) for any alert.
The existing `.ds-alert--error .ds-btn` rule gains `:not(.ds-alert--plain)` (scoping only: existing markup is unchanged).

**Fit.** The icon and the words carry the kind, never colour alone.

**Files.** `src/components/alert.css`, `docs/components.md` (Alert: plain and title; "Which component" row
"Findings in a card"), styleguide ("Findings"), `test/css.test.js`, baselines, `CHANGELOG.md`.

## O. Charts

### O1. Chart roles, the registered `--ds-share` and `.ds-enter--fill` (P2)

**Problem.** An overview needs a few simple marks: a share bar, a distribution, a small histogram, columns per year.
Dashboard-Style has `.ds-progress`, `ds-fill-x`/`-y` and `countUp()`, but no chart colours and no way for several
parts of a mark (fill, rider, label) to follow one value in the same frame. The project kept its own chart tokens and
an entrance helper.

**Proposal.**

- Layer-2 roles "Charts": `--ds-chart-1` (`--ds-primary`), `--ds-chart-2` to `--ds-chart-4` (validated defaults),
  `--ds-chart-track` (`--ds-accent`), `--ds-chart-warning`, `--ds-chart-error`.
- `@property --ds-share` (`<number>`, inherits, 0): the share 0 to 1 of a mark, set by the page with
  `style.setProperty('--ds-share', …)`; marks clip at it (as `.ds-progress` does), so round ends keep their shape, and
  transition it on `--ds-dur-glide` `--ds-ease-value`.
- `@keyframes ds-fill-share` and `.ds-enter--fill`: a mark grows from 0 to its share on first render,
  `DS.motion.enterAll(marks, 'fill', { stagger: false })`.

**Fit.** Marks clip, never scale; a value change glides, a figure counts with `countUp()` in the same task; first
render once. Tests: every series at 3:1 on `--ds-surface` and `--ds-surface-low`, four distinct series. `ds-fill-x/-y`
stay for project-drawn bars (their deprecation is deferred, see H2 under Deferred).

**Files.** `src/tokens.css`, `src/motion.css`, `docs/tokens.md`, `docs/motion.md` (keyframe and utility rows; `enter()`
lists `'fill'`), `docs/theming.md` (the palette recipe), `themes/example.css` (the roles), `test/css.test.js`,
`test/tokens.test.js`, `CHANGELOG.md`.

### O2. `.ds-meter` and `.ds-kv-list--bars`: value bars and distributions (P2)

**Problem.** "Disk 78 % used" as a thin bar; "Devices by model" as rows of a name, a figure and a bar under it. The
project drew both itself.

**Proposal.**

- `.ds-meter` (new `chart.css`): a 4px track (`--ds-meter-height`, `--ds-meter-track`) with a fill clipped at
  `--ds-share` (`--ds-meter-color`); `--neutral`, `--warning`, `--error` change the fill on `--ds-dur-medium`;
  `role="meter"` (or `img` with a label) with `aria-valuenow`.
- `.ds-kv-list--bars`: kv rows as a grid with a one-line label (full name through J3's `data-tip-truncated`), the
  figure, and a `.ds-meter` across under them; combines with N2's `--interactive` rows.

```html
<ul class="ds-kv-list ds-kv-list--bars ds-kv-list--interactive">
  <li><a class="ds-kv-list__row" href="/devices?model=n14"><span data-tip="Notebook 14 (2024)" data-tip-truncated>Notebook 14 (2024)</span><strong>47</strong>
    <span class="ds-meter" role="meter" aria-label="Notebook 14" aria-valuenow="29" aria-valuemin="0" aria-valuemax="100"></span></a></li>
</ul>
```

**Overlap.** C5 proposes `DS.dom.progress(box, share, …)`, one setter for a progress share and its ARIA. A meter
has the same pair (`--ds-share` and `aria-valuenow`); if both land, the one setter also takes a `.ds-meter`, and the
docs say why a meter reads `--ds-share` while `.ds-progress` keeps `--ds-progress`.

**Fit.** As O1; forced colours draw the fill in `CanvasText`.

**Files.** `src/components/chart.css` (new), `src/components/list.css`, `src/index.css`, `docs/components.md`
(`## Charts`; Lists "Bars"), `docs/theming.md`, `themes/example.css`, styleguide ("Charts") and Motion Lab
(`charts`), `test/css.test.js`, a browser spec (glide with the figure in the same frame, first render once, forced
colours), the Components tile, `CHANGELOG.md`.

### O3. `.ds-columns` (mini and grouped) and `.ds-legend` (P3)

**Problem.** A small histogram in a tile; "bought and to replace, per year" over ten years with the current year
marked. The project drew columns with its own scroller and masks.

**Proposal.** In `chart.css`:

- `.ds-columns` with `__col` and `__fill` (square base, round data end, `--ds-columns-radius`), series and tone
  modifiers shared with `.ds-legend__key` (`--s2`, `--s3`, `--s4`, `--warning`, `--error`, through
  `--ds-chart-color`).
- `--mini`: a 32px histogram in a row, `__col--highlight` in `--ds-chart-1`.
- `--grouped`: `__groups`, `__group` (`--ds-columns-group-min`), `--current` (a tint, label weight and a `.ds-sr`
  word), `__plot`, `__label`, riders `__marker` and `__value` that ride the column top from `--ds-share`. It sits in
  M1's `.ds-scroll-x` and has no overflow, mask or scrollbar of its own.
- Interactive columns (`:is(button, a).ds-columns__col`) press like rows; a zero column is `aria-hidden`.
- `.ds-legend` with `__key` (`--ds-legend-key-size`); forced colours: textures for series 2 to 4.

```html
<div class="ds-scroll-x" role="group" aria-label="Devices bought and replacements planned, per year">
  <div class="ds-columns ds-columns--grouped"><ol class="ds-columns__groups"> … </ol></div>
</div>
```

**Fit.** As O1; charts separate marks by gaps, never by strokes; "when to draw your own" in the docs.

**Files.** `src/components/chart.css`, `src/components/ripple.css`, `src/js/ripple.js` (`RIPPLE_HOSTS`),
`docs/components.md`, `docs/theming.md`, `themes/example.css`, styleguide (full width and a 320px frame), browser
tests (360px: no page scroll, the end fade from `.ds-scroll-x`), baselines, `CHANGELOG.md`.

## Q. Chips and badges

### Q1. Input chips, action chips and a plain chip row (P2)

**Problem.** Active filters show as chips above a list ("Vendor: A", "Building C, second floor"), each removing its
filter, followed by "Clear filters"; a row of suggestions ("Only my devices") acts at once. `.ds-chip` is a filter chip
on a hidden checkbox or radio in a `fieldset`; there is no chip that is a button or a link. The project built input
chips with its own body, label ellipsis, trailing glyph, states and row.

**Proposal.** In `chip.css`:

- A `.ds-chip` on a `<button>` or `<a>` is a button chip (an action chip), with the existing `.ds-chip__body`,
  `.ds-chip__icon` (leading), `.ds-chip__label` (ellipsis) and `.ds-chip__trailing`; padding from `:has()`.
- `.ds-chip--input`: an input chip, always a `<button>`; the whole chip removes, the trailing close glyph says so;
  tonal by default (`--ds-chip-input-bg`, `-color`, `-border` for an outlined theme). Its name starts with the action
  and contains the visible text (WCAG 2.5.3).
- `div.ds-chips` as a plain row without `fieldset`; **Changed:** `.ds-chips:empty` takes no room.
- `aria-disabled` keeps a chip focusable with a reason; a chip that stays on or off is a filter chip, never a button
  with `aria-pressed`.
- **Fixed:** the glide backing reads `--ds-chips-backdrop`, then `--ds-flip-backdrop`.

```html
<div class="ds-chips" role="group" aria-label="Active filters">
  <button class="ds-chip ds-chip--input" type="button" aria-label="Remove filter Building C, second floor"
          data-tip="Building C, second floor" data-tip-truncated>
    <span class="ds-chip__body"><span class="ds-chip__label">Building C, second floor</span>[icon close 18 ds-chip__trailing]</span>
  </button>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Clear filters</button>
</div>
```

**Fit.** Chips are not pills and do not morph (the documented exception, extended to every chip kind); the ripple
goes into the body as today; status by glyph and name.

**Files.** `src/components/chip.css`, `src/components/ripple.css`, `src/js/ripple.js` (one selector),
`docs/components.md` (Chips "Input chips and action chips"; "Which component" rows), `docs/motion.md` (Feedback row
"Chip row"), `docs/theming.md`, `docs/tokens.md`, `themes/example.css`, styleguide and Motion Lab (`input-chips`),
`test/css.test.js`, browser tests (geometry, press, focus, removal, forced colours), baselines, `CHANGELOG.md`.

### Q2. `flip(..., { refocus })`: focus moves to a neighbour when its item goes (P1)

**Problem.** Removing a focused chip, list row, timeline entry or alert through `flip()` drops focus to `<body>`: a
keyboard user loses their place and the next Tab starts at the top (WCAG 2.4.3). Every page that removes items has to
find the neighbour before the render. The project kept keys for that.

**Proposal.** A `flip()` option `refocus: boolean | Element | (() => Element | null)`: before `mutate`, it records
the focused element and its item; afterwards, if that item was removed and the page did not move focus, it focuses
the next remaining item's focus target, else the previous one, else the given fallback, with `preventScroll`, before
the leave plays. Also in the held `live` branch and above `max`.

```js
DS.motion.flip(row, () => chip.remove(), { items: '.ds-chip', refocus: () => clearButton });
```

**Fit.** Focus moves before the exit, so nothing waits for motion. `FOCUSABLE` is shared with `overlay.js` (a test
keeps the two equal).

**Files.** `src/js/motion.js`, `docs/motion.md` (the `flip` row; recipe "Removing an item with focus to its
neighbour"), `test/js.test.js`, `test/browser/flip.spec.js` (next, previous, fallback, the page moved focus itself,
live and above `max`), `CHANGELOG.md`.

### Q3. `.ds-badge`: a count on a button or chip (P2)

**Problem.** "Filter 3", "Columns 8": a small count inside a button or chip, tinted when it counts something active,
quiet otherwise, readable on a tinted (pressed or open) host. The project had its own counter, plus extra rules for
each tinted host.

**Proposal.** A new `badge.css`: `.ds-badge` (an inline pill, 20px, `--ds-badge-size`, caption font, tabular figures,
`:empty` takes no room); default tint, `--neutral`, `--ok`, `--warning`, `--error`; on a tinted host
(`aria-pressed="true"`, `.ds-btn--tonal`, an open `.ds-btn--disclosure` of U4, a selected filter chip, an input chip
of Q1, a selected table row) it switches to `--ds-primary` on `--ds-on-primary`; disabled with its host; forced
colours `Canvas` with an outline. No JS: a count that appears pops with `DS.motion.enter(badge, 'pop')`.

```html
<button class="ds-btn ds-btn--quiet ds-btn--disclosure" type="button" aria-expanded="false" aria-label="Filter, 3 active">[icon filter 16]Filter<span class="ds-badge">3</span></button>
```

**Fit.** A toned badge has its word in the same row (status never by colour alone); the pop is the existing
`.ds-enter--pop`, played by the page, never on load.

**Files.** `src/components/badge.css` (new), `src/index.css`, `docs/components.md` (`## Badge`), `docs/motion.md`
(Feedback row, "A count badge" recipe), `docs/theming.md`, `docs/tokens.md`, `themes/example.css`, styleguide and
Motion Lab (`pop` on a real badge), `test/css.test.js`, a browser spec (tinted hosts resolve to `--ds-primary`),
the Components tile, `CHANGELOG.md`.

### Q4. A count in a drawer item (P3)

**Problem.** "Devices 163" in the navigation drawer: a plain figure at the end of the item in the item's own ink,
also on the current item. The project styled its own.

**Proposal.** `.ds-drawer__item > .ds-badge` in `shell.css`: a plain trailing figure (`margin-inline-start: auto`,
transparent, `color: inherit`, no transition, no pill); forced colours without the outline.

**Fit.** The item's pill and indicator stay the current-state cue.

**Files.** `src/components/shell.css`, `docs/components.md` (App frame), styleguide (a count in the drawer),
`test/css.test.js`, `CHANGELOG.md`.

### Q5. `.ds-badge--lg` and `.ds-card__row--leading`: a number before a card title (P3)

**Problem.** An overview card that leads with a large number ("12 overdue returns") and opens the list. The project
wrote a number marker and its own card row.

**Proposal.** `.ds-badge--lg` (32px, label font, with the tones) and `.ds-card__row--leading` in `card.css`: marker,
title block (grid, shrinks), end item (status chip).

```html
<div class="ds-card ds-card--interactive">
  <div class="ds-card__row ds-card__row--leading">
    <span class="ds-badge ds-badge--lg ds-badge--error">12</span>
    <div><h3 class="ds-card__title"><a class="ds-card__action" href="/devices?filter=overdue">Overdue returns</a></h3>
      <p class="ds-muted">Devices past their return date</p></div>
    <span class="ds-status ds-status--error">[icon alert 16]<span>Urgent</span></span>
  </div>
</div>
```

**Fit.** As Q3.

**Files.** `src/components/badge.css`, `src/components/card.css`, `docs/components.md` (Card "Card with a leading
marker"), styleguide, `test/css.test.js`, `CHANGELOG.md`.

## R. Switch

### R1. An `aria-disabled` switch looks and acts blocked (P1)

**Problem.** rules.md prefers a focusable `aria-disabled` control with a tooltip that says why over a bare
`disabled`. `switch.css` styles only `:disabled`: an `aria-disabled` switch looks enabled, shows hover, halo and the
pressed grow, and a click toggles it unless the page cancels it. A `data-tip` on the label covers the label, not the
track. The project restyled the blocked switch and moved the tip itself.

**Proposal.** **Changed.** `.ds-switch input[aria-disabled="true"]` takes the disabled model (no hover, halo, grow or
press; the neutral track and handle; `cursor` from the disabled rule) but keeps its focus ring. `data-tip` goes on the
input; an input with `data-tip` covers the track (52×32, `appearance: none`), so pointer and keyboard reach the
tooltip, and every other switch keeps its 1px input.
components.md gives the click guard (`preventDefault()` on `click` while `aria-disabled`), which stays page code.

**Fit.** One disabled model; disabled is explained where possible (rules.md).

**Files.** `src/components/switch.css`, `docs/components.md` (Switch "Blocked with a reason"; Tooltip "on a switch, put
`data-tip` on its input"), `docs/motion.md` (Controls intro), styleguide (rename "Locked by policy" to "Unavailable on
this plan"), `test/css.test.js` (`ACTIVE_EXEMPT` keys), browser tests, baselines, `CHANGELOG.md` (Changed).

### R2. `.ds-switch--locked`: a value another system sets (P2)

**Problem.** "Remote access: on, set by the directory sync." The value counts and must read at full strength, but it
cannot be changed here. A disabled switch reads as "off or not applicable". The project drew a lock in the handle.

**Proposal.** `.ds-switch--locked` with `input[aria-disabled="true"]` (never `disabled`): the switch at full strength,
an `svg.ds-switch__icon` (the lock, 16px) as the last child of the track, shown only while locked (in on
`--ds-dur-fast` `--ds-ease-in-out`, out on `--ds-dur-instant` `--ds-ease-in`, riding the handle on the spatial
spring), the off handle slightly larger to hold the lock; forced colours `Canvas`/`Highlight`.

```html
<label class="ds-switch ds-switch--locked">
  <input type="checkbox" role="switch" name="remote" checked aria-disabled="true" data-tip="Set by the directory sync">
  <span class="ds-switch__track" aria-hidden="true">[icon lock 16 ds-switch__icon]</span>
  <span class="ds-switch__label">Remote access</span>
  <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
</label>
```

**Fit.** A value another system sets is locked, not disabled (a rules.md sentence, shared with N3); the lock is shape,
not colour. `aria-readonly` as a second trigger is deferred.

**Files.** `src/components/switch.css`, `docs/components.md` (Switch "Locked"), `docs/motion.md` (Controls row
"switch lock"), `docs/rules.md`, styleguide and Motion Lab (`switch-locked`), `test/css.test.js`, browser tests,
baselines, `CHANGELOG.md`.

### R3. Switch hint, extras and `.ds-switch-list` (P3)

**Problem.** A settings card of eight switches: each a full-width row with a hint under the name ("Runs at 02:00"), a
status chip, the state word aligned on the right, wrapping on a phone. The project built its own switch rows.

**Proposal.** `small.ds-switch__hint` inside `.ds-switch__label`; `span.ds-switch__meta` for non-interactive extras
before the state word; `.ds-switch-list` (a container, `role="group"` with a name) whose `label.ds-switch` rows get
the grid areas `track label meta state`, a row height `--ds-switch-list-row-height` (56px), hairlines, and a wrap at
`@container ds-switch-list (max-width: 560px)`. With a hint or extras the input is named by `aria-labelledby` and
described by `aria-describedby`.

**Fit.** No new motion.

**Files.** `src/components/switch.css`, `docs/components.md` (Switch "Hint and extras", "Switch list"),
`docs/theming.md`, `themes/example.css`, styleguide ("Switch list"), `test/css.test.js`, browser tests, baselines,
`CHANGELOG.md`.

## S. Timeline

### S1. `.ds-timeline`: the history of a record (P2)

**Problem.** A device's history: dated entries with time and author, a sentence each, some recorded automatically
(muted), each with Edit and Delete, one entry turning into a form in place, new entries gliding in. Dashboard-Style has
no timeline; the project built a rail with dots, heads, meta lines and its own flip backing.

**Proposal.** A new `timeline.css`: `.ds-timeline` (`ol` with `role="list"` and a name) with `__item` (a rail and a
dot, both borders, so forced colours keep them), `--muted` (a ring dot; the reason in words), `__head` (with room for
a `.ds-status`), `__title`, `__meta` (tabular, `<time datetime>`, may lead with an icon), `__text` (`pre-line`,
`--ds-measure`), `__body` (a form in place), `__actions`; the glide backing for `flip()`. Hooks
`--ds-timeline-indent`, `-head-line`, `-dot-size`, `-line-width`, `-dot-color`, `-muted-color`, `-line-color`,
`-divider-color`.

```html
<ol class="ds-timeline" role="list" aria-label="History of LAPTOP-0042">
  <li class="ds-timeline__item" data-ds-key="e3">
    <div class="ds-timeline__head"><p class="ds-timeline__title">12 Oct 2026</p>
      <p class="ds-timeline__meta"><time datetime="2026-10-12T14:05">14:05</time> · Ada Lovelace</p></div>
    <p class="ds-timeline__text">Issued to Ada Lovelace.</p>
    <div class="ds-timeline__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button" aria-label="Edit the entry of 12 Oct 2026">Edit</button></div>
  </li>
  <li class="ds-timeline__item ds-timeline__item--muted" data-ds-key="e2"> … <p class="ds-timeline__meta">[icon sync 16]<span>Recorded automatically</span></p> … </li>
</ol>
```

**Fit.** Entries glide through `flip()` and enter with `enter()`; focus before a removal through Q2's `refocus`; a
muted entry says why in words. The name sits next to scroll timelines in motion.md; one sentence keeps them apart.

**Files.** `src/components/timeline.css` (new), `src/index.css`, `docs/components.md` (`## Timeline` after Lists),
`docs/motion.md` (Feedback row, recipe "A timeline with an inline form"), `docs/theming.md` (eight hooks; `time` in
the embedded-widget guard), `docs/rules.md` (forced colours list), `themes/example.css`, styleguide ("History",
"Activity") and Motion Lab (`timeline`), `test/css.test.js` (the head's chip room equals `.ds-status`'s
`min-height`), browser tests and baselines, the Components tile, `example/` (its activity list), `CHANGELOG.md`.

## T. App frame and page

### T1. Page head with a way back, actions and status (P2)

**Problem.** A record page's head: "Devices" back above the title, the record name, a lead line with figures, a
status chip, and actions on the right ("Restart", "Delete …") that wrap under the title on a phone. `.ds-page-head`
has a title and a lead. The project wrote its own head with all of these.

**Proposal.** In `page.css`: `.ds-page-head__back` (a small text button whose padding hangs into the margin),
`__row` (title block and actions, wrapping), `__text`, `__status`, `__actions` (at the end, flush text buttons, start
aligned below 600px of `ds-content`); `:empty` for head, lead, status and actions; **Fixed:** the lead gets tabular
figures; print hides back and actions. The plain head stays valid. Plus a documented "Page states" pattern (loading,
failed, gone) with the existing skeleton and alert.

```html
<header class="ds-page-head">
  <a class="ds-btn ds-btn--text ds-btn--sm ds-page-head__back" href="/devices" aria-label="Back to Devices">[icon chevronLeft 16]<span>Devices</span></a>
  <div class="ds-page-head__row">
    <div class="ds-page-head__text"><h1 class="ds-page-head__title" tabindex="-1">LAPTOP-0042</h1>
      <p class="ds-page-head__lead">Issued to Ada Lovelace.</p>
      <div class="ds-page-head__status"><span class="ds-status ds-status--warning">[icon alert 16]<span>Warranty ends soon</span></span></div></div>
    <div class="ds-page-head__actions"><button class="ds-btn ds-btn--text" type="button">Delete …</button></div>
  </div>
</header>
```

**Fit.** One filled button per area; status chips only for deviations.

**Files.** `src/components/page.css`, `docs/components.md` (Page; "Page states"), `docs/motion.md` (Navigation row
"Page head"), `docs/theming.md` (`--ds-page-head-title-line`), `themes/example.css`, styleguide (wide and 390px),
`test/css.test.js`, browser tests and baselines, `example/` (its page head), `CHANGELOG.md`.

### T2. `.ds-drawer__back`: a way back above the destinations (P3)

**Problem.** On a record page the drawer lists the record's sections, and "Back to Devices" sits above them, outside
the indicator's track and not scrolling with the list. The project built it; with T1's back link in the head as well,
a docked drawer shows the way back twice.

**Proposal.** `.ds-drawer__back` between `.ds-drawer__head` and `.ds-drawer__list`, holding one `.ds-drawer__item` (no
`aria-current`, no pill), a hairline below, `:empty` hidden; above 900px a docked drawer with a back item hides the
page head's back link.

**Fit.** The indicator stays on `.ds-drawer__list`; the item is a ripple host as every drawer item.

**Files.** `src/components/shell.css`, `docs/components.md` (App frame), `docs/motion.md` (Navigation row),
styleguide, `test/css.test.js` (the dedupe selector), browser tests, `CHANGELOG.md`.

### T3. `.ds-account--capsule`: the account with its sign-out action (P3)

**Problem.** The top bar shows the account and "Sign out" together in one outlined pill, with the avatar at every
width. `.ds-account` shows name and email, or only the avatar below 720px, and leaves the action to the page. The
project built its own capsule and accessibility toggling.

**Proposal.** `.ds-account--capsule`: one pill (min height `--ds-space-12`, border, surface) holding avatar, text
(`--ds-account-text-max`, 240px), `.ds-account__divider` and a text button; the avatar names the account at every
width (`role="img"`, `aria-label`) and the text is `aria-hidden`; documented snippet for `tabindex="0"` on the avatar
where only it shows (so the tooltip of J4 is reachable by keyboard).

**Fit.** Actions are pills; the capsule is a container, not an action.

**Files.** `src/components/shell.css`, `docs/components.md` (App frame), `docs/theming.md`, `themes/example.css`,
styleguide, browser tests (720px and 359px), `CHANGELOG.md`.

### T4. `.ds-base--headings`: bare headings take the type roles (opt-in) (P3)

**Problem.** Under `.ds-base`, a bare `h2` in a card keeps the browser's size and margins; every page sets classes on
every heading or writes a heading reset. Changing `.ds-base` itself would change every existing page.

**Proposal.** An opt-in modifier on the root, with `.ds-base`: `:where(.ds-base--headings)` gives `h1` the headline,
`h2` the subtitle and `h3` to `h6` the label role, `margin: 0`; element weight, so every class wins.

**Fit.** Additive by being opt-in (see Cross-cutting decisions); an embedded page leaves it off.

**Files.** `src/base.css`, `docs/components.md` (Page base), `docs/theming.md` ("Embedded" note), `docs/rules.md` (one
sentence), styleguide (a card with the class), `test/css.test.js`, browser test (a page without it is unchanged),
`CHANGELOG.md`.

### T5. Every scroller is a containing block (P1)

**Problem.** `.ds-sr` is `position: absolute`. In `.ds-view`, `.ds-sheet__body` and a `.ds-drawer__list` without the
indicator, nothing is positioned, so a screen-reader text deep in a long view is placed against the window: the
document grows, and `scrollIntoView()` on a field scrolls the whole frame, top bar included. Every app frame hits it
as soon as a long view uses `.ds-sr`. The project made the three positioned.

**Proposal.** **Changed** (`offsetParent`): `position: relative` on `.ds-view`, `.ds-sheet__body` and
`.ds-drawer__list`, a header line in `utilities.css`, and a test that every component rule which makes a block
scroll (`overflow` auto or scroll on `.ds-x` or `.ds-x--mod`) has a rule for that block that declares `position`.
Every new scroller in this plan (K1, M1, M2, U3, U7) declares it.

**Fit.** No visual change apart from the bug.

**Files.** `src/components/shell.css`, `src/components/sheet.css`, `src/components/utilities.css` (header),
`test/css.test.js` (the containing-block rule), browser test (`.ds-sr` in a long view does not lengthen the document),
`CHANGELOG.md` (Changed).

### T6. Small frame fixes (P3)

**Problem and proposal.** Each found while moving the frame:

- An `<a>` drawer item shows the grey tap flash on iOS over its own state layer: `-webkit-tap-highlight-color:
  transparent` on every `.ds-drawer__item`, not only `button.` ones.
- At 320px a long account squeezes the 40px menu button: `.ds-topbar__menu { flex-shrink: 0 }`.
- A trailing icon in a plain text link ("Open the report ↗") touches the text:
  `:where(.ds-base) :where(a:not([class])) > svg:last-child` gets `margin-inline-start: var(--ds-space-1)`.
- A progress line under a page skeleton's lead bone ("Loading devices, 50 of 163"):
  `.ds-skeleton__line--lead + .ds-meta` pulls up by `--ds-space-2`; it fades in with the skeleton.

**Fit.** Fixes; nothing moves.

**Files.** `src/components/shell.css`, `src/base.css`, `src/components/loading.css`, `docs/components.md` (Loading),
`test/css.test.js`, `CHANGELOG.md` (Fixed).

## U. Forms and small fixes

### U1. `.ds-field__hint--success` and hints led by an icon (P3)

**Problem.** A live check under a field ("Free: no other device uses it") confirms with an icon and a word; a neutral
hint may lead with an info icon. `.ds-field__hint` has an error kind only, and an icon in a hint is not laid out. The
project wrote both.

**Overlap.** G1 proposes `--ds-field-error-color` so a theme can keep the message in `--ds-text` and let the icon carry
the colour. The success hint should follow that model from the start: text in `--ds-text-2`, icon in `--ds-success`,
and (if G1 lands) a matching `--ds-field-success-color`.

**Proposal.** `.ds-field__hint:has(> svg:first-child)` lays out icon and text; `.ds-field__hint--success` with
`ds-fade-in` on its entrance (and height on `--ds-ease-out` where `interpolate-size` exists).

```html
<small class="ds-field__hint ds-field__hint--success" id="asset-hint">[icon checkCircle 16]<span>Free: no other device uses it.</span></small>
```

**Fit.** Status by icon and word; the hint is described by `aria-describedby`, not a live region.

**Files.** `src/components/form.css`, `docs/components.md` (Form; "Which component" row), `docs/motion.md` (Controls
row: validation and confirmation), styleguide and Motion Lab (`live-check`), `test/css.test.js`, `CHANGELOG.md`.

### U2. `.ds-kbd` and `.ds-search__key`: the search shortcut (P3)

**Problem.** A list's search says "/" at its end and steps aside once the search is used. There is no key style, and
the key must hide at once on focus, input or disabled, fade back on blur and never show on touch screens. The project
wrote both.

**Overlap.** E1's `.ds-presence--keep` (fade with `opacity` and `visibility`, keep the box) is exactly the key's
show and hide; if E1 lands first, the key uses it instead of rules of its own.

**Proposal.** `.ds-kbd` (utilities: `--ds-kbd-bg`, `--ds-kbd-border`, the code font) and `.ds-search__key` (the
input's end padding makes room, `--ds-search-key-room`; hidden on `:focus`, not `:placeholder-shown` and `:disabled`;
fades back on `--ds-dur-fast`; `(hover: none)` hides it). Docs: the "/" and Escape recipes, `aria-keyshortcuts` on the
input, the key `aria-hidden`.

```html
<div class="ds-search">[icon search 20]<input class="ds-input" type="search" aria-label="Search devices" aria-keyshortcuts="/" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div>
```

**Fit.** Effects only, on `--ds-ease-in-out`; exit at once.

**Files.** `src/components/utilities.css`, `src/components/form.css`, `docs/components.md`, `docs/motion.md` (Controls
row), `docs/theming.md` (`kbd` in the embedded-widget guard), `themes/example.css`, styleguide and Motion Lab
(`search-key`), `test/css.test.js`, `demo/` (its `kbd`), `CHANGELOG.md`.

### U3. `.ds-check-list` and `.ds-check__count`: many values from a long set (P2)

**Problem.** A filter sheet offers "Status" with twelve values and "Building" with forty, each with a count; the list
scrolls on its own after six rows. Checkboxes in a `.ds-field` grow without limit and have no count. The project wrote
a scrolling check list.

**Proposal.** `.ds-check-list`: an outlined box of 40px rows with hairlines that scrolls past
`--ds-check-list-max-height` (264px, a cut row shows that it scrolls), positioned, thin scrollbar; reset to full
length inside a sheet body or dialog box. `.ds-check__count` at the row end (tabular; label weight when checked).

```html
<fieldset class="ds-field"><legend class="ds-field__label">Status</legend>
  <div class="ds-check-list">
    <label class="ds-check"><input type="checkbox" name="status" value="active" checked><span>Active</span><span class="ds-check__count">47</span></label>
  </div>
</fieldset>
```

**Fit.** The rows use the check's own halo; no new motion.

**Files.** `src/components/form.css` (Progressive: `scrollbar-color`), `docs/components.md`, `docs/theming.md`,
`themes/example.css`, styleguide ("Check list"), `test/css.test.js`, browser tests, baselines, `CHANGELOG.md`.

### U4. `.ds-btn--disclosure`: the tint while what it opens is open (P3)

**Problem.** "Filter" opens a sheet; while the sheet is open, the button should look on, like a pressed toggle. It is
not a toggle (`aria-pressed` would announce one); it reports `aria-expanded`. The project wrote the tint.

**Proposal.** `.ds-btn--disclosure[aria-expanded="true"]` takes the toggle hooks (accent container and ink) and joins
both forced-colours lists of `aria-pressed`. The page sets `aria-expanded` for dialog and sheet openers;
`DS.overlay` sets it only for popups and the drawer, as today.

**Fit.** State by attribute and tint; Q3 tints a badge inside it.

**Files.** `src/components/button.css`, `docs/components.md` (Button), styleguide, `test/css.test.js`,
`CHANGELOG.md`.

### U5. A leading icon in button faces takes the shorter start padding (P3)

**Problem.** `.ds-btn:has(> svg:first-child)` shortens the start padding before a leading icon; a button with busy
faces wraps its icon in `.ds-btn__faces`, so it keeps the long padding. The project listed it as a deviation.

**Proposal.** **Fixed:** add `.ds-btn:has(> .ds-btn__faces:first-child > .ds-btn__face:first-child >
svg:first-child)` to that rule; the resting face decides.

**Fit.** The faces share one grid cell, so the width does not change between faces.

**Files.** `src/components/button.css`, `docs/components.md` (Button: faces), `docs/theming.md` (the
`--ds-btn-padding-start` row), `test/css.test.js`, `CHANGELOG.md`.

### U6. Morph: an empty `style` or runtime state is the same shell (P2)

**Problem.** `sameShell()` compares attributes exactly. A node that a helper styled and cleaned up keeps an empty
`style=""` (`stagger()`, `countUp()`, `flip()` remove their properties, not the attribute), or still carries runtime
classes and attributes. Under `data-ds-replace` or `{ replace: true }` such a node counts as changed and is replaced:
focus, a running spinner or an entrance are lost; keyed nodes are reinserted. The project removed empty `style`
attributes before every morph.

**Proposal.** **Fixed:** when the exact comparison fails, an internal `equivalentShell()` compares again after
ignoring runtime and owned attributes and classes, comparing class sets, treating an empty `style` as none and
comparing declarations through the CSSOM. No new export or option.

**Fit.** The documented meaning of `replace` ("when a node's shell differs") is kept.

**Files.** `src/js/dom.js` (header), `docs/motion.md` (DS.dom), `test/js.test.js` (empty style kept; runtime-only
kept; a real difference replaces; class order), browser test (identity after `stagger` and `countUp`),
`CHANGELOG.md`.

### U7. `.ds-code-block`: preformatted blocks (P3)

**Problem.** `--ds-font-code` is documented "for code blocks", but there is no code block: the styleguide, the live
tour and the project each have their own (raw data, a request, a log line).

**Proposal.** `.ds-code-block` (utilities): `--ds-code-bg`, `--ds-font-code`, card radius, scrolls sideways,
positioned; `tabindex="0"` and a name when it can scroll; `--wrap` breaks long lines. The styleguide and the live
tour use it.

**Fit.** The first user of an existing token.

**Files.** `src/components/utilities.css`, `docs/components.md` (Utilities), `docs/theming.md` (`pre` in the
embedded-widget guard), `docs/tokens.md`, styleguide (replace its own), `demo/`, `test/css.test.js`,
`CHANGELOG.md`.

### U8. `.ds-alert__actions` and paragraphs in an alert (P3)

**Problem.** An alert with two actions ("Retry", "Show details") or with two paragraphs. `.ds-alert` has room for one
button. The project wrote an actions row.

**Proposal.** `.ds-alert__actions` (a wrapping row of text buttons after the text) and spacing for `p` inside
`.ds-alert__text`.

**Overlap.** G1's alert hooks apply to the row as to the rest of the alert.

**Fit.** Actions are pills; no motion.

**Files.** `src/components/alert.css`, `docs/components.md` (Alert), styleguide, `test/css.test.js`, `CHANGELOG.md`.

### U9. Wrapping fixes: check labels, card titles, tile values (P3)

**Problem and proposal.** **Fixed:** a long `.ds-check` label runs out of its column (`max-width: 100%`, the label
`min-width: 0; overflow-wrap: break-word`); a long word in `.ds-card__title` overflows and a leading icon in it has no
gap; `.ds-tile__value` overflows when even its smallest size does not fit (ellipsis).

**Fit.** Fixes.

**Files.** `src/components/form.css`, `src/components/card.css`, `src/components/tile.css`, `test/css.test.js`,
baselines, `CHANGELOG.md`.

## Meeting project-feedback.md

| There | Here | Proposed |
|---|---|---|
| A1 segmented options as buttons | U4 `.ds-btn--disclosure`, Q3 badges on tinted hosts | both add selected states of buttons to the forced-colours lists; one pass over those lists |
| A2 busy buttons block the keyboard | I1, K3, L1 run their action through `busy()` | A2 first; the recipes then need no guard of their own |
| A3 end a press from script | M1 (a drag-to-scroll strip) | unchanged; M1's docs point to it |
| B1 `watchScrolled()` | M1 `scrollEdges()`; K4 (sheet head hairline over a body with a foot) | decide the two scroller reporters together: one module, one naming |
| C1 `announce()` | J2 (a restarted message is announced again) | J2 uses the same announcers; no conflict |
| C2 reserve and replace by key | J2 restart; L1 (an error above the save bar) | one matching path: `key`, with `restart` as the same-text case; `reserve` also counts a shown save bar |
| C5 one setter for progress share and ARIA | O2 `.ds-meter` (`--ds-share`, `aria-valuenow`) | one setter for both, if both land |
| C3 touch tooltips, no repeated label | J3 truncation, J4 tap on `role="img"` | one touch model (tap where a tap does nothing else, long press elsewhere); the repeated-label rule as the default, `data-tip-truncated` for shortened text |
| D1 `.ds-table--stack` and `--ds-table-fade` | M1, M2, M3 | one fade switch for wrappers and `.ds-scroll-x`; a stacked table drops the sticky header and the pinned column |
| E1 `.ds-presence` | L1, U2 | E1 before both; U2 uses the keep variant |
| G1 hooks for quieter themes | N5, U1, U8 | `--plain` as a preset of G1's alert hooks; the success hint on G1's error model |
| H2 deprecated names | O1 (`ds-fill-x/-y` stay) | the deprecation, when it comes, is the first entry of `deprecated.json`; nothing here deprecates a name |
| H3 conformance check | Cross-cutting decisions | the check learns the opt-ins (`.ds-base--headings`, `data-tip-truncated`), the attributes Dashboard-Style writes (a project never sets `data-ds-overflow-*`, `data-ds-edges`, `data-ds-savebar-rest`), and the stylesheets the new classes need |

## Already covered (use this instead)

| Wish | Use |
|---|---|
| A quiet zero in a kv row | `.ds-muted` on the `strong` (N2 adds only the regular weight) |
| A count that pops when it appears | `DS.motion.enter(el, 'pop')` (`.ds-enter--pop`); Q3 adds only the badge |
| A floating bar that fades and scales in | `.ds-presence` with `hidden` (L1 builds on it) |
| A snackbar with an Undo button stays until used | already so for any message with a button or link besides the close button (J1 adds only the option and the colour) |
| Place snackbars above a bar of the page's own | `--ds-toast-bottom` on the region, set by the page |
| Room for a standing error at the end of a view or sheet body | `data-toast-reserve` and `--ds-toast-reserve` (C2 would set them) |
| Whole-row link in a table | `.ds-table--interactive` with `.ds-table__row-link`; M3 is only for the pinned case |
| A minimum width for a table's name column | `.ds-col--text` (168px), deliberately not a hook |
| A link that looks like text in a table cell | `.ds-link-btn` |
| Hide the tooltip's description when the name says the same | already done for `aria-describedby`; the bubble is J3 and C3 |
| A chip that stays on or off | the filter chip (`label.ds-chip` with a hidden input), never a button chip with `aria-pressed` |
| A list of short findings without containers | `ul.ds-plain-list` as the container (N5 adds the plain alert inside) |
| A short run of counts ("3 new · 1 updated") | `.ds-parts` |
| The vertical `data-scrolled` hairline of a view or sheet body | the documented sentinel recipe (B1 would make it an export) |
| Glide a reordered list or a removal | `DS.motion.flip()` with `data-ds-key`; Q2 adds only focus |

## Deferred

| Wish | Why later |
|---|---|
| A separate remove button in an input chip | Not needed; two targets in 32px are hard on touch. Additive later |
| A corner badge on icon buttons (`.ds-badge--corner`) | Clipped by the ripple host's `overflow: clip`; needs a ripple change first |
| `DS.overlay` setting `aria-expanded` on dialog and sheet openers | Changes overlay behaviour for existing openers; the page sets it for `.ds-btn--disclosure` (U4) |
| `topmost()` filter options; a `DS.overlay.lock()` function | The attribute (I1) and a class check suffice |
| `.ds-page--fill` / `.ds-view--fill` (a bounded layout for M2) | Frame layout work; the page sets `--ds-table-fill-max-height` |
| A save bar in side sheets or on document-scroll pages | Not needed yet; L1 warns outside `.ds-view` |
| The snackbar's left edge aligned with the save bar | An open design question |
| `aria-readonly` as a second trigger for a locked switch | Uneven screen-reader support |
| Scroll dividers in a dialog body | A later minor (B1 would provide the signal) |
| Timeline icon markers, interactive entries, a draft entry, grouping by day | Nobody needs them yet; additive later |
| Deprecating `ds-fill-x` and `ds-fill-y` | Still the path for project-drawn bars; a 2.0 question (H2) |
| A forced-colours `Highlight` fill for the current drawer item | An accessibility fix outside this batch; a patch of its own |
| `.ds-page > .ds-btn { justify-self: start }`; the top margin of `.ds-kv-list` outside a card | Separate small fixes |
| `--ds-drawer-badge-font` | Only if someone asks |
| A `ResizeObserver` on the sheet foot for snackbar clearance | More code and cost; K4 measures on open and on the first message |
| Stacking `.ds-facts--rows` on very narrow content | Consistent with `.ds-kv-list` today; D1 may set the pattern |

## Dropped

| Wish | Why dropped |
|---|---|
| Heading roles on every `.ds-base` page | Changes existing pages; shipped as the opt-in T4 instead |
| A snackbar that restarts by default | Changes what an existing export does; opt-in J2 instead |
| A second name for the truncated tooltip (`data-tip-overflow`) and a second mechanism in chips | One name, `data-tip-truncated`, one owner (J3) |
| A `.ds-kv-list__quiet` element and a `--ds-kv-row-radius` hook | `.ds-muted` exists; rows use `--ds-radius-sm` |
| A scroller of its own for the grouped chart, reusing the table's internal fade properties | Internal properties of another component; M1's `.ds-scroll-x` hosts it |
| Escape suppression through `keydown` in the dialog recipes | Fragile with close watchers; the I1 lock replaces it |
| A cancelable `ds-close` (a veto) | A buggy listener could trap people; the lock is the veto |
| `DS.dom.rowLinks()` as its own export | `DS.ripple.attach()` already delegates (M3); an export would need a Lab demo of its own |
| A theme hook for the switch-list wrap width | Container query values cannot be themed; a modifier later if needed |
| `--ds-chart-edge` (an outline for pale series) | Charts separate marks by gaps, never by strokes; validate `--ds-chart-2` instead |
| Generic text-tone utilities | They invite status by colour alone |
| Wrapping status chip text | Squeezes next to shrinking flex siblings |
| The count of `.ds-action-bar` pushed to the end | `.ds-meta` is the documented count; the placement is layout |
| Buttons in a sheet body at their own width by default | Changes existing sheets; a button at its own width goes into the foot (K4) or a row of the page's |
| A container query for the dialog body fallback | Layout containment would re-anchor script-placed popups |
