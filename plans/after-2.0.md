# Plan: after 2.0.0

**Status:** open backlog. Nothing here is scheduled.

2.0.0 decided both project backlogs (the proposals of two project migrations, ids A1 to H3 and I1 to U9) and the
promises of [motion-2.md](motion-2.md): every proposal was implemented, excluded or dropped. The two backlog files
are gone; `git show b165297:plans/project-feedback.md` and `git show b165297:plans/project-feedback-2.md` bring them
back for their reasoning. This file keeps what is still open:

1. [Deferred](#deferred): wishes that 2.0.0 left out on purpose, each with the reason and what would bring it back.
   All are additive (a new class, modifier, hook, option or export), so each fits a 2.x minor release and follows
   "Making a change" in [AGENTS.md](../AGENTS.md).
2. [Open after the release](#open-after-the-release): questions and measurements that the 2.0 work left for the owner
   or for CI.
3. [Deprecated in 2.0](#deprecated-in-20-removable-in-30): the names 3.0 may remove, and what removing them takes.
4. [Dropped](#dropped): wishes that were decided against, so they are not proposed again without a new reason.

> Like motion-2.md, the plan sits outside `docs/` on purpose: `test/repo.test.js` counts every `docs/**/*.md` as
> documentation, and a plan that names future classes, tokens and exports would satisfy those tests in advance.

A wish that a project raises goes here first, in the form of the rows below (what is missing, why it waits, what would
trigger it), checked against `src/` and `docs/`; it names no project.

## Deferred

| Wish | Why not in 2.0 | Trigger |
|---|---|---|
| Full right-to-left support: mirrored motion through a registered `--ds-dir`, `[dir="rtl"]` twins of masks and gradients, mirrored directional glyphs, an rtl fixture | No project needs it. 2.0 states left-to-right only (`docs/rules.md`, `docs/install.md`), writes new CSS with logical properties and lints physical ones out of `src/components/` (the allowlist in `test/css.test.js` names the rest). `:dir()` is above the browser floor (Chrome 120). | A project that ships a right-to-left language; or the floor reaching `:dir()`. |
| Corner badges on icon buttons, and an avatar with an activity ring and a corner badge | Every ripple host clips while a ripple is inside, so a badge on the corner would be cut. Each ripple would first have to clip itself (a change across every host). | Two projects that build a count on an icon button by hand. |
| Rich tooltip / toggletip (a help card with a link) | A fifth non-modal overlay type; SN-6's one tooltip rule had to settle first. An "i" with `role="img"` and `data-tip` shows on a tap today. | A help text that needs a link or more than one sentence. |
| Tree view, split button, submenus, column resize | Large, and no project needs them. The split button conflicts with "every action is a pill". | A concrete need; the split button only with a design that keeps one pill. |
| A phone-width global search sheet | FR-4 hides the top bar search below 720px; the sheet is a second step. | A project whose search must stay reachable on a phone from every view. |
| `busy(button, work, { hold: overlay })` | Sugar over `data-ds-busy`; the attribute is the primitive. | Projects writing the same three lines around every overlay action. |
| A scroll-driven hairline above a sheet foot | Needs `scrollEdges` on the body's block end; the static border is enough. | A sheet design without the static border. |
| Keying the press morph to `.ds-pressed` only, so `DS.ripple.attach().release()` also ends the `:active` morph | A change across every host. The documented limit: the morph lasts until the button is released. | A drag-to-scroll surface where the held morph is visible and wrong. |
| An account menu (avatar button that opens a menu with name, email and Sign out) | Nobody asked; it needs a menu head element. `.ds-account` covers the capsule. | A second project building the menu by hand. |
| `DS.overlay.topmost()` filters, `DS.overlay.lock()` | `data-ds-busy` and a class check on `topmost()` suffice. | A case those two cannot express. |
| The save bar in side sheets and on pages that scroll the document | No project needs it; `DS.overlay.savebar()` warns outside `.ds-view`. | A record edited in a sheet with several fields that save together. |
| `aria-readonly` as a second trigger of the locked switch | Uneven support; a read-only checkbox still toggles. | Support that makes it mean read-only in every engine of the floor. |
| A `ResizeObserver` on the sheet foot for the snackbar lift | The lift is measured on open and on the first message. | A sheet foot that changes height while a message shows. |
| `DS.overlay.open(el, { focus })`: initial focus without raising the phone keyboard | Touch specific; it should follow real use of `.ds-touch`. | A project on `.ds-touch` whose dialogs open on a field. |
| A combobox list on a textarea (slash commands) | Not documented yet; a project can open it through `DS.overlay` with `.ds-combo__popup` markup. | A second project that does so. |
| A page-wide default `returnTo` | `open(el, { returnTo })` and the id twin cover the cases. | An app that re-renders every opener on each update. |
| The O3 `__marker` rider of the column chart | Its meaning was never defined. | A project that needs a mark on a column and can say what it means. |
| A separate remove button in an input chip | Two targets in a 32px chip are hard on touch; the whole chip removes. | A chip whose body must do something else than remove. |
| A `data-ds-modal` attribute written by `DS.overlay` instead of the `:has()` lists for "a modal is open" | The documented by-hand overlay paths do not run `DS.overlay`, so the `:has()` fallback stays. Those `.ds-theme:not(:has(…))` rules now live only in the opt-in `src/optional/view-transitions.css`; while they apply, Chromium puts the root into its global `:has()` invalidation set, so a later rule of the form `X:has(…) <combinator> <common selector>` restyles every match on every DOM change. `test/css.test.js` guards table rows and cells only. | A style-recalc regression in `perf.spec.js` on a page that loads the optional stylesheet, or a new `:has()` rule outside tables. Then widen the guard or move to the attribute. |
| A JS fallback for `.ds-collapsible` without `interpolate-size` | Would change documented markup for engines that are catching up; without it the height snaps. | An engine of the floor that never ships `interpolate-size`. |
| A live status line: lines that roll quietly, the new one pushing the old one out (`.ds-wheel`, `DS.motion.wheelHooks` for the morph) and a faint white wave over text at work (`.ds-shimmer`); spec, choreography and reference implementation in [wheel-and-shimmer.md](wheel-and-shimmer.md) | Asked for after 2.0 by a project that built both as its own components, written as DS components are, so they can move here as they are. | A second project with a live status line, or the owner's go. |

Closed while 2.0 was built, so no longer deferred: `DS.ripple.setChecked()` (the documented `change` dispatch glides;
`test/browser/controls-2.spec.js` proves it) and skeleton option B (option A, one band layer per bone, held the look
and paints next to nothing; MO-22 shipped it).

## Open after the release

| Item | State | Next step |
|---|---|---|
| Frame and style-recalc budgets of `perf.spec.js` | The skeleton case now asserts the whole fixture; the style-recalc cases measured about 8-9ms against the 7.5ms limit on a loaded shared machine, before and after 2.0, so the numbers there say nothing. | Read the CI `perf` job. If the skeleton case fails there, assert only the table and loaders again; if the recalc cases fail, profile the styleguide pages. |
| The tile grid on phones | Closed in 2.1: the default stays (one tile per row on a phone, so a lone long value fits whole). `docs/components.md` (Tiles) and the `--ds-tile-min-width` row of `docs/theming.md` say that `--ds-tile-min-width: 128px` on the tiles or in the theme keeps two per row down to a 360px phone. | None. |
| "`output` in the guard list" (FM-10) | The plan's line has no list to land in: the action guard covers actions, and `<output>` is none. Nothing was changed. | Closed unless the owner says what was meant. |
| The collapsed drawer rail's tooltip | It hides its labels the same 1×1px way as the rail foot, which `tooltip-touch.spec.js` covers; the collapsed rail has no test of its own. | A row in that spec when the rail is next touched. |
| The deprecated `.ds-view--leaving` in the Motion Lab | Its Lab demo stays for coverage while the class exists; the styleguide's own view swap runs through `DS.motion.transition()`. | Goes with the class in 3.0 (below). |

## Deprecated in 2.0, removable in 3.0

Every name below still works in 2.x and is listed in `src/deprecations.json` with `removed: null`; `docs/` marks each
**deprecated** (a repository test ties the two), `tools/check-project.mjs` and `tools/check-theme.mjs` warn on them,
and the types mark `detach` `@deprecated`. AGENTS.md "Releases": a name goes only in a major version, once the projects
have moved.

| Deprecated | Kind | Replacement |
|---|---|---|
| `.ds-view--leaving` and its manual swap recipe | class | `DS.motion.transition()` |
| the numeric second argument of `settleLoader(startedAt, now)` | option | `settleLoader(startedAt, { now })` |
| `ds-fill-x`, `ds-fill-y` | keyframes | `ds-fill-share` (a mark clips on `--ds-share`, never scales) |
| `.ds-enter--fill-x`, `.ds-enter--fill-y` | class | `.ds-enter--fill` with `--ds-share` |
| `enter(el, 'fill-x')`, `enter(el, 'fill-y')` | option | `enter(el, 'fill')` |
| `ds-edge-fade` | keyframes | `ds-scroll-edge-start`, `ds-scroll-edge-end` |
| `--ds-table-fade-start`, `--ds-table-fade-end` (internal, unused since 2.0) | token | `--ds-scroll-edge-start`, `--ds-scroll-edge-end` |
| `detach()` of the `DS.ripple.attach()` handle | export | `destroy()` |

**Trigger:** every project that vendors the system runs `tools/check-project.mjs` without a deprecated warning, and a
3.0 has another reason to exist (no major release for these names alone).

**Removing them** follows the 2.0 pattern (RM-1 to RM-14): delete the rules, keyframes, branches and docs rows; set
`removed: "3.0.0"` in `src/deprecations.json` so the repository guard keeps them out; drop the Lab demo of
`.ds-view--leaving`, the `ds-edge-fade` row of `LAB_EXEMPT`, the `'fill-x'` and `'fill-y'` variants of `enter()` in
`motion.js` and `src/types/js/motion.d.ts`; a CHANGELOG `## 3.0.0` with a Migration table (old name, new name, what a project changes).

Not deprecated, though they may look so: `--ds-toast-shift` and `--ds-toast-shift-y` stay as runtime properties that
only `DS.overlay` writes (the page recipe that set them was removed in 2.0); `data-toast-reserve` and
`--ds-toast-reserve` are written by `toast()` and by the page only with `reserve: false`.

## Dropped

Decided against in 2.0; reopen only with a reason the row does not answer.

| Wish | Why |
|---|---|
| A media-query motion switch | Owner decision D8 of motion-2 (tested); the accessibility statement in `docs/rules.md` says so (WCAG 2.3.3 is AAA). |
| `data-tip-truncated`, `data-tip-overflow` | One automatic rule (SN-6) covers both without an attribute pages must remember. |
| `--ds-hold-tooltip` (hide a touch tooltip after 1.5s) | WCAG 1.4.13 asks for persistence until dismissed. |
| `.ds-page--fill` | Does not bound the table; `.ds-view--fill` does. |
| `--ds-table-fade: none`, `--ds-fade-edges: none` | One length hook, `--ds-scroll-fade` (`0px` = off), serves every fade. |
| `.ds-list__item--interactive`, a `--current` modifier on rows | The switch sits on the list, as on tables; `aria-current` is the state. |
| `.ds-badge--lg`, `.ds-card__row--leading` | The interactive tile is the big figure that opens a list. |
| `.ds-kv-list__quiet`, `--ds-kv-row-radius`, `--ds-chart-edge`, generic text-tone utilities, wrapping status chip text next to shrinking siblings, a count pushed to the end of the action bar, a scroller of its own for grouped columns, a theme hook for the switch-list wrap width, `--ds-drawer-badge-font` | Covered otherwise, or they invite status by colour alone, or container query values cannot be themed. |
| A cancelable `ds-close`, `DS.dom.rowLinks()`, Escape suppression through `keydown` in recipes | A buggy listener could trap people; `attach()` delegates; `data-ds-busy` replaces it. |
| A container query on a table wrapper or a dialog body | Layout containment re-anchors script-placed popups. |
| A "reset to full length in sheets" for `.ds-check-list` | Contradicts the need (a filter sheet); set the hook to `none`. |
| `DS.html` markup builders, a `DS.dom.html` template tag | Templating is the project's; the docs and the project check cover correctness. |
| `--ds-font-overline` and an overline utility | M3 dropped overlines; use `.ds-meta`. |
| `.ds-base--app` (no overscroll on html and body) | One line of project CSS, not a component. |
| `-webkit-touch-callout: none` | Would change link previews of page elements. |
| `@supports (color: SelectedItem)` fallbacks | Forced colours exist only in engines that have it. |
| `.ds-table__cell-label` | `data-label` on stacked tables covers it. |
| `DS.dom.steps()` | The page sets the label of `.ds-steps--bar`; the list form needs no script. |
| Star rating, a custom date or range picker, FAB, bottom navigation, carousel | Not admin-console patterns, or a large accessibility and locale surface the native pickers already cover. |
| Renaming page-set attributes without the `data-ds-` prefix, the leave variant names, `--ds-btn-state-opacity`, the tested fallback constants | A rename costs every project more than it brings. |
