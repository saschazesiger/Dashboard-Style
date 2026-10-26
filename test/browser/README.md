# Browser tests

Playwright tests that prove motion, layout and behaviour in real engines: Chromium, Firefox and WebKit. They
complement the unit tests in `test/*.test.js`, which stay dependency-free (`npm test` and `npm run check` need
nothing installed and never load this folder: `node --test "test/*.test.js"` does not recurse).

## Running

```sh
npm ci                                   # once: installs the pinned @playwright/test (the only devDependency)
npx playwright install chromium firefox webkit   # only when the pinned browsers are not in the cache yet
npm run test:browser                     # all three engines and the fallback project
npm run test:browser -- --project=webkit # one engine
npm run test:browser -- --project=fallback   # Chromium as an engine on the browser floor (see "The fallback project")
npm run test:browser:update              # rewrite screenshots and JSON snapshots, then review the diff
DS_SHOTS=local npm run test:browser      # screenshots against __screenshots-local__/ (see "Screenshots")
DS_VIDEO=1 npm run test:browser -- demos.spec.js --project=chromium   # one video per demo at ?speed=0.1
DS_VIDEO=1 npm run test:browser -- lab.spec.js --project=webkit   # one video per Motion Lab section at ?speed=0.1
npm run test:browser -- --project=perf   # the paint budget and style recalc times, alone (see "Paint budget")
```

- `@playwright/test` is pinned to an exact version in `package.json` (1.63.0: chromium 1243, firefox 1543,
  webkit 2359). Changing it means installing its browsers and changing the CI container tag in the same commit
  (`test/repo.test.js` keeps the two in step).
- The config (`playwright.config.js`) starts `serve.js`, a dependency-free static server for the repository root on
  `http://127.0.0.1:4173`, or on the port in `DS_TEST_PORT`. It never reuses a server that already listens there:
  that one may serve another checkout, or stop when its own run ends, so a busy port fails the run at once. Two runs
  at the same time (or a run in a worktree, see "CI") each take their own port: `DS_TEST_PORT=4174 npm run
  test:browser`.
- A browser that will not start with "error while loading shared libraries" lacks system packages:
  `sudo npx playwright install-deps chromium firefox webkit` (Debian and Ubuntu) installs them. Where installing is
  not possible, extract the same Debian packages into a private folder and point `LD_LIBRARY_PATH` at it before
  running the tests.
- Retries are off and `test.only` fails on CI: a flaky motion test is a bug in the test or in the motion.

## Layout

| Path | What |
|---|---|
| `playwright.config.js` | projects `chromium`, `firefox`, `webkit` and `fallback` (below), viewport 1280 x 800 at scale 1, `en-US`, UTC, light, `reducedMotion: 'no-preference'` |
| `base-test.js` | the shared `test` of the engine specs: `@playwright/test` with the `dsFallback` option of the `fallback` project; besides the specs and the config the only file that imports `@playwright/test` (`test/repo.test.js`) |
| `serve.js` | static server: MIME types (`.js` as `text/javascript`, so module fixtures load), nothing outside the root, no listings, no caching headers |
| `helpers/motion.js` | the one helper module (below); imports only `node:*`, so its pure checks run under `node --test` |
| `fixtures/*.html` | minimal pages on `/dist/fonts/fonts.css`, `/dist/ds.css` and `/dist/ds.js` |
| `*.spec.js` | the specs (below) |
| `__screenshots__/` | committed screenshots and JSON timelines, `<project>/<spec>/<name>`, from the CI container |
| `__screenshots-local__/` | gitignored screenshots of this machine (`DS_SHOTS=local`, see "Screenshots") |

### Specs

| Spec | Engines | Asserts |
|---|---|---|
| `smoke.spec.js` | all | the server (types, no listings, nothing outside the root); the styleguide reaches `data-sg-ready` with no console error and runs the `DS.version` of `package.json`; every fixture loads cleanly; `module.html` imports the six ES modules; a theme switch sets `data-sg-theme` and re-places the three indicators; a saved theme loads before `data-sg-ready`; `?speed=0.1` slows the styleguide and the fixtures |
| `spike.spec.js` | all | the ten capabilities of the spike ("Capability spike") |
| `baseline.spec.js` | all (phone, themes, forced colours: Chromium) | settled screenshots ("Baselines") |
| `motion-today.spec.js` | all | JSON timelines of every motion utility and animated component; smoke checks for `ds-spin` and `.ds-enter` |
| `frames.spec.js` | Chromium | mid-animation frames (0, 50 %, end) of the overlays, the drawer entrance and the modal drawer; the indicator's glide in the drawer and the segmented switch (start, trailing edge, 50 %, overshoot; compared with a colour threshold of 0.02, since the pill's tint is close to the backdrop) |
| `demos.spec.js` | all (videos: Chromium) | every styleguide demo ends settled without a console error; one video per demo with `DS_VIDEO=1` |
| `foundation.spec.js` | all | the 1.0.0 foundation: the layer order of `ds.css`, unlayered CSS (and an unlayered reset) beating components, utilities beating component animations, non-inheriting motion hooks, `?speed=` scaling durations and delays, the spring on movement tracks, the paired exits, hover that moves nothing, the 4px stagger rise and the `sibling-index()` stagger |
| `motion-engine.spec.js` | all, `fallback` | the P2 engine: `leave()` during `enter()` and back continue from the current opacity without a jump (no inline style), rapid toggles end in the last call's state, `cancel()`, the cubic retry where `el.animate()` rejects `linear()`, focus moving to the opener before `inert`, SVG `enter()`, `settled()` within one frame, `motionDuration()` and `settled()` under `--ds-time-scale`, `motionEasing()`, `staggerOnce()` |
| `countup.spec.js` | all, `fallback` | `countUp()`: a rising count never turns back and lands, a new target continues from the figure on screen, a figure that a re-render wrote counts on from what it shows (the same value changes nothing), a figure and its `.ds-progress` bar set in one task land within one frame and agree within 2 % on the way (at `?speed=0.1`) |
| `flip.spec.js` | all, `fallback` | `flip()`: a sort glides on `translate` (spring peak at most 1.05, none on the cubic fallback) and lands, a sort mid-flight continues from where the item is, a typing filter never stacks glides, live data waits under the mouse (values at once) and reorders when it leaves or after `hold`, a touch tap never holds, `<tbody>` rows glide, 60 moving items update without motion, a removed item fades out of flow while its neighbours close the gap; live: a plain DOM `mutate` waits whole under the mouse and glides on release, one that ignores `holdOrder` glides at once; a re-render of the list's ancestor mid-glide keeps the held height, the leaving item's place and the raised ranks (1.6.1) |
| `morph.spec.js` | all, `fallback` | `morphHtml()`: patched nodes keep their identity and a progress transition runs, a field re-rendered per keystroke keeps focus, caret and value, a morphed segmented control keeps its indicator and `update()` glides, a keyed reorder moves the same nodes (`moveBefore` where it exists, `insertBefore` in `fallback`) |
| `ripple.spec.js` | all, `fallback` (forced colours: Chromium; touch: WebKit) | `DS.ripple`: the centre at the pointer (±1px), the span goes after the release, no ripple on disabled, `aria-disabled` and busy hosts, a static `[data-ds-ripple]` host is positioned and clips, Enter ripples from the centre, under `.ds-ripples` the pressed flat layer stays at its hover value, forced colours hide it, a WebKit tap ripples and `attach()` adds the passive `touchstart` listener |
| `controls.spec.js` | all, `fallback` (forced colours: Chromium; touch: WebKit) | the 1.1.0 controls: a held press reaches the 12px pressed radius and the layer within 100ms, the release springs back (peak at most 1.05, none in `fallback`) and settles within `--ds-dur-medium` + 50ms, `.ds-pressed` holds a 30ms click for `--ds-dur-instant`, blocked buttons show no press, the disc never scales; one clipped ripple on the combobox toggle, errors summary and table sort, layer and ripple never add up; the focus ring solid from the first frame snapping 4 to 2px in `--ds-dur-fast`, the focus layer at .10, a focused `.ds-enter` button runs both, inset rings unclipped; chips (slot to 18px without overshoot, the check drawn and reversed in order, a radio pair keeps its width, nothing on first render, a wrap glides by FLIP from where the chip was, on an opaque backing that goes after the glide, the toggled chip never overlapping its neighbour and its label gliding, both ways); the switch (travel peak, scale at most 1, the halo follows, press grow, disabled, the two words); checkboxes and radios (pseudo-elements render, nothing on load, the wipe, check to dash, the dot's spring, the row hover halo, the halo unclipped in a table, a switch and a chip in a table cell keep their hidden inputs, a WebKit tap grows it from 0, a forced-colours screenshot); fields (label tint in the first focus frame, the error message fade and, in Chromium, its height while focus is in the field; a message in the markup keeps its height from the first frame on load); busy faces (no running loop at rest, constant width, nothing for fast work, the done hold) and the icon swap; a disabled fieldset fades every control; the drawer item and its pill morph, and with `attach()` a click on another item still glides the pill; a re-render of a chip row's ancestor mid-glide keeps the chips' backing (1.6.1) |
| `controls-2.spec.js` | all, `fallback` (forced colours: Chromium) | the controls of 2.0 on `controls-2.html`: a pointer captured by a dragging ancestor ends the press (ripple out, `.ds-pressed` gone) before the button goes up, `release()` with and without a host, `destroy()` and the deprecated `detach()`, a chip toggled by script with a `change` event glides; `aria-disabled` filter chips get no ripple or press; `.ds-pressable` layers, ripples, blocks and snaps its ring; `.ds-hover-actions` on hover and focus; keys and dividers; the disclosure tint, a locked choice, faces padding, the adaptive label, quiet links; button chips, input chips, wrapping chips, badges and tags; selected tiles and cards (tint and border ring), intrinsic tile columns; plain alerts and actions; the done state plays when shown, not on a morph; the switch input covers the track, `aria-disabled` and locked switches, the switch list; fillable icons and `DS.icons.fill()`; forced colours; two settled shots |
| `touch.spec.js` | all, `fallback` | `.ds-touch` on `controls.html`: buttons, icon buttons, chips, switches and drawer items at least 48px, the switch and check halos 48px, fields at the input role, nothing without the class; one `test.fixme` per hook another part of 2.0 adds (fields, check rows, combobox options, menu items, the snackbar close, disclosures, tabs); a settled shot |
| `indicator.spec.js` | all, `fallback` | `DS.indicator` (1.2.0), read from computed values with the motion paused in the task that starts it: a glide stretches lead-first (only the leading edge moves during `--ds-dur-micro`), passes its target by more than 0 and at most 5 % of the travel (never in `fallback`) while the trailing edge never passes its target (the pill never gets shorter than the item) and lands in the rest state; in real time (nothing finished or seeked) the collapse to rest comes within `--ds-indicator-dur` + lag + 50ms of the edges' start (on the document timeline; a late frame only adds its own lateness); its time is `travelDuration()` (a neighbour hop near `--ds-dur-medium`, a long jump up to `--ds-dur-slow`, both ten times longer at `?speed=0.1`); a second target mid-glide continues from the painted pill; the first placement and a window resize start no transition; `aria-current` moves the pill without `update()` (not with `observe: false`); after `DS.dom.morphHtml()` the span stays, the next change glides by itself and replaced items stay observed; an empty state contracts the pill in `--ds-dur-fast` and the next item grows it from its centre, while an item that comes back mid-contraction turns the pill from where it is painted (continuous edges, the fade only rises); a project class's `border-radius` is copied into `--ds-indicator-radius`; `destroy()` then `loadingdone` writes nothing. No screenshots of a running glide in WebKit: Playwright's WebKit screenshot ends running custom-property transitions (a video shows them) |
| `shell.spec.js` | all, `fallback` | the app frame of 1.2.0: `enter(drawer)` and `enter(drawer, 'slide')` play the same timeline on the x axis only; the modal drawer opens over `--ds-dur-long` (peak above 0 and at most 5 % of its width, none in `fallback`, drawer or bleed at x = 0 in every seeked frame), closes on `--ds-dur-base` and `--ds-ease-exit` and turns back from where it is; drawer labels and icons change colour on the track's `--ds-indicator-dur` with no `font` transition, in one frame without the indicator and at once in the modal drawer; a segmented switch with `data-label` keeps its width, and options without it keep icon, text and badge in a row at the old height; the top bar tints to `--ds-surface-high` over `--ds-dur-fast`, and filled toolbar fields (search, filled select) in it stay distinct from the tint (a focused search keeps `--ds-surface`); `.ds-view` keeps a stable gutter; the documented view swap never shows the new view at full opacity before its entrance (read by a `MutationObserver` in the microtask after the swap, so a late frame cannot matter) and ends on the latest; a styleguide nav click changes `aria-current` once and glides the pill once |
| `overlay.spec.js` | all, `fallback` (forced colours: Chromium) | `DS.overlay` (1.3.0) on the dialog and the side sheet in both markups, the modal drawer and the popups: focus moves in at once (`autofocus` first) and is on the opener in the same task as Escape, Cancel or a backdrop click; Tab and Shift+Tab never reach the page; the div trap makes the page inert and gives back exactly what it took, only the box is inert during the exit and a double click on the backdrop (dialog and sheet, both markups) then never reaches the page and leaves focus on the opener, as on the modal drawer's scrim; a native dialog over a native sheet moves into it and, leaving, stays above the sheet's panel and takes the clicks (a double click on its scrim never closes the sheet); Escape closes only the top (a dialog from the sheet is `--nested`), after the page's own handlers (a widget inside that prevents it keeps the overlay open); the scroll lock counts and nothing shifts sideways (no gutter in the shell app); a close taken back ends open and five toggles leave nothing behind; one warning outside `.ds-theme`; a closing native dialog or sheet stays above a sticky element and is gone when its exit ends; snackbars stay usable over the modal drawer. Motion, paused in the task that starts it and seeked: the entrance and exit tracks match the choreography (properties, durations, curves as the engine serialises the tokens; exit shorter), the sheet panel never fades, its spring peaks at most 1.05 and settles, and at the deepest frame the screen edge shows the panel (the bleed; right column; phones rise on `--ds-ease-out`, the top never past 0, bottom row); the hand paths (no `data-state`) leave with their exit keyframes at 1000px and 400px; a reopen at 50 % of the exit is continuous in opacity and scale; `reducedMotion: 'reduce'` gives the same tracks. Forced colours: each overlay keeps its edge (screenshots) |
| `toast-tooltip.spec.js` | all, `fallback` | `DS.overlay.toast()` and `DS.overlay.tooltips()` (1.3.0): never more than three messages, the others start their glide where they stood, the oldest message that would close by itself is replaced and a fourth waits behind three that stay (`close()` drops a waiting one); the timer pauses on hover, focus and a hidden tab; errors, persistent and action messages stay; a focused message that leaves hands focus to the next close button, then back where it came from, then the view; the polite and assertive announcers (a repeated text again; an old `role="status"` region loses the role and gets its own pair); an open side sheet takes the region in, which glides on the sheet's timing and comes back. Tooltips: the delay, `aria-describedby` only when it adds to the name, the entrance (opacity and scale from `--ds-scale-tooltip` at the anchor side, below and above, clamped 8px from the edge) and the fade-only exit, a tooltip that the page places with an inline `transform` is at its anchor at 10 % of the entrance (keyframes and `data-state`), the trigger's icon and a crossing onto the tooltip keep it, Escape in a dialog hides only the tooltip, Tab and the warm-up swap or show at once, a warm swap marks the side the tooltip really sits on (also from a trigger in a scrolled box), anchor positioning where the engine has it (else the script's place), scroll moves or hides it, pointerdown hides it, a touch hover never shows it. Over a modal: while a dialog (native, div) or side sheet is open, a new error sits in it, above its scrim, announced (never inert), and its close button closes only the message. 2.0 on `fixtures/savebar.html`: `announce()` (twice for the same text, nothing for empty text) and `toastRegion()` (finds, creates after `.ds-app`); the same message restarts (one message, its timer starts over; `restart: false` stacks); a `key` replaces in place (old `closed` resolves, focus to the new close button, a waiting one keeps its slot); `closeToasts()` by kind and key; the reserve on the view (its value, given back, a page value with `reserve: false` stays), a covered focused field scrolls clear; in a side sheet the body reserves and the region rises above the foot, starting where it stood on both axes; in a dialog the dialog makes room while the box would overlap; beside the open modal drawer at 800px, above its foot at 390px; the action (inverse primary ink, one call on a double click, it stays past its timeout); an element message that stays gets the close button with its tooltip and `--ds-toast-close-size` |
| `tooltip-touch.spec.js` | all, `fallback` (real taps: Chromium, WebKit) | the 2.0 tooltip rule on `fixtures/tooltip-touch.html`: a tip that repeats a text that fits never shows, cut off (a 160px column, a `td` that clips an inline link) it shows and describes nothing, a `.ds-sr` or 1×1px label is not visible text (a folded `.ds-btn--adaptive` and the rail foot's `.ds-drawer__label` included); a removed trigger hides its tooltip at once; touch (synthetic pointer events): a tap on an image or a blocked control shows the tip at once and keeps it (no timeout), a second tap hides it, a long press shows the others and swallows the click, a link keeps its long press, a moved press or `pointercancel` cancels, a scroll hides a touch tip; real taps on a blocked control and an image |
| `savebar.spec.js` | all, `fallback` | `.ds-savebar` and `DS.overlay.savebar()` (2.0) on `fixtures/savebar.html`: at 1280, 1000 and 390px showing moves no page child, the bar sits in the page column 16px above the view's bottom, `data-ds-savebar`, `--ds-savebar-height`, the scroll padding and the content's bottom padding keep its room; snackbars rise above it and come back down (also a message that shows while it is up); a focused field under it scrolls clear; focus inside it goes to `focusTarget()` (else the view), inert while it leaves; hidden at the end of the page the room stays until the page scrolls away; `update()` waits for the exit; a re-render keeps its state; the `.ds-presence` entrance from the bottom edge; print hides it |
| `popups.spec.js` | all, `fallback` | `.ds-menu` and the combobox list through `DS.overlay` (1.3.0): a menu focuses its first enabled item (the last from ArrowUp), the arrows, Home and End move and wrap, Escape gives focus back to the trigger, Tab closes and moves on, an item closes it after its click handlers ran (a disabled one does not), an outside pointerdown leaves focus where it went; it sits under its trigger from the start edge, towards the start edge at the window's edge and above at the bottom edge; the entrance starts closed at the trigger edge (`clip-path` from `--ds-clip-from` with the 24px room, `scale` .95, opacity 0) and the exit is opacity alone in `--ds-dur-instant`, for the menu and the combobox list, below and above the trigger, with the shadow from the first frame; a close taken back continues from the current opacity. The combobox chevron turns to 180deg with `aria-expanded`, on the spring (rising to its peak, at most 5 % past, settling) and back; the list is as wide as its field; it opens above at the window's bottom edge; at the bottom of a dialog it is not clipped where anchor positioning exists (else it flips to the side with more room in the box); Escape closes the list before the dialog, and closing the dialog closes its open list (not expanded, off the Escape stack); the active option's layer goes at once. Cut edges (2.0): `open()` attaches `DS.dom.scrollEdges()` on the block axis of a menu and a combobox list until it is hidden; a menu cut by the window shades the edge with more to show (sticky, under no pointer) and a list masks it, through scroll timelines or the attributes; a script-placed menu keeps its own scroll position. `.ds-presence`: a toggle taken back mid-way continues from where it is, in opacity and scale (where the engine transitions `display`; Firefox exits at once, `fallback` toggles) |
| `feedback.spec.js` | all, `fallback` (screenshots and forced colours: Chromium) | the feedback parts of 1.4.0: the shape loader runs `ds-loader-morph` and `ds-loader-turn` on `::before` over `--ds-loop-loader` (a 64-vertex polygon that turns), fades in only after `--ds-delay-loader` on its own and has no delay of its own in `.ds-boot`, `.ds-loading` and `.ds-skeleton`; the spinner runs `ds-spinner-arc` and `ds-spin` with its arc within [10deg, 270deg], and `ds-spin` turns `rotate`, so the spinner's own `transform` stays; the determinate ring never spins and glides; two skeleton bones read one `--ds-skeleton-x` on a fixed band, the wave starts after the entrance, `leave()` keeps the wave where it is and without the wave the band rests off screen; progress keeps a round cap at .05 (clip, no scale; screenshot), `--ds-progress` rises monotonically on `--ds-dur-glide`, `--waiting` keeps the label's place and fades the track in, at 100 the wave fades out and the flat fill in, `--flat` has no dot, gap or wave; a standalone loading bar shows nothing for 150ms and reaches the content edges, in a skeleton it has no fade, `leave()` fades it with its segments still moving, the view hairline gives way to it; `.ds-stale` never dims within 150ms, has dimmed at 400ms and goes at once; a status change colours chip and icon over `--ds-dur-medium`; the ring at an open `.ds-collapsible`'s edge (screenshot); forced colours (spinners, loaders, progress, skeleton); the same timelines under `reducedMotion: 'reduce'` (D8) |
| `data.spec.js` | all, `fallback` (forced colours: Chromium) | the data parts of 1.4.0: the table's hover layer on the cells over a selected row's colour, select all starting every row's transition on one frame, an expandable row opening over `--ds-dur-medium` and closing over `--ds-dur-base` (monotonic, no overshoot), the chevron and the sort arrow landing on 180deg (peak at most 5 % past), a sort FLIP on `<tr>` `translate` (continuous) and a second sort mid-flight within 2px, a live reorder held under the mouse for at most 2s; cards and tiles reaching their pressed radius within 100ms and springing back, nothing moving on hover, the hover shadow only from `--ds-card-hover-shadow`, the ripple clipped to the card (both forms) and the row; under `.ds-ripples` a press on another link or field in a row or a `<div>` card leaves the host unpressed; the button card's content starting at the same height as the `<div>` card's, the row toggle centred on the text line, both hairlines of a selected row at device scale 1 and 2; an alert dismissed from a stack of three (the next glides up continuously, the dismissed one is gone); forced colours of a selected row and the cards. The bar and a `countUp` figure landing on one frame is in `countup.spec.js` |
| `lists.spec.js` | all, `fallback` (forced colours: Chromium) | the record parts of 2.0: a row opens from anywhere on it while its own button stays a control; the row's state layer (hover, press, focus at once), its inset ring and no morph; a blocked row without layers and with `not-allowed`; the current row's tint and `SelectedItem` in forced colours; the ripple over the row, none for a press on its button; rows gliding through `flip()` on a backing and a new row fading in over `--ds-dur-fast`; trailing parts that wrap in a narrow list; key-value rows in line with static rows, their ring, the blocked model, the kv fixes and bars; facts in rows stacking in a narrow window and the lock; the disclosure pill that turns squarer and springs back, accordion rows to the card's edges that open one at a time where `details[name]` exists; the task list's tick that draws |
| `timeline.spec.js` | all, `fallback` (forced colours: Chromium) | the timeline of 2.0: dots and markers on the rail and on the head line, the rail from dot to dot with a gap and through a day heading, a ring for a muted entry, line breaks kept, nothing moving at rest, entries coming and going through `flip()` on a backing, borders that stay in forced colours |
| `charts.spec.js` | all, `fallback` (forced colours: Chromium) | the charts of 2.0: a meter clipped at `--ds-share` with a round end (never scaled) on the chart roles, a new share gliding on `--ds-dur-glide` (monotonic) beside a `countUp()` figure, the first render filling from zero (`ds-fill-share` and `ds-fade-in`), a column's value riding on its fill, series and legend keys on their roles, a column that opens its day (layer, inset ring, ripple, no morph), the sparkline, forced colours (fills in `CanvasText`, series hatched) |
| `view-transitions.spec.js` | all, `fallback` (the View Transition path where `startViewTransition` exists; page loads where `onpagereveal` exists: Chromium, WebKit; top bar screenshots: Chromium) | `DS.motion.transition()` (1.5.0) on `views.html`, read at the transition's `ready` with every pseudo-element animation paused in the same task: fade-through (old `ds-fade-out` in `--ds-dur-instant` on `--ds-ease-in`, new `ds-fade-in` and `ds-grow-in` over `--ds-dur-medium` after `--ds-dur-instant`, the root crossfade over `--ds-dur-fast`, no top bar group; Chromium: the bar's frames at 0 and 50 % are the same picture and match the settled bar in luminance, since snapshots are rasterised with grayscale text), shared axis (the new image starts on the positive side going forward, the negative side going back; the tracks and the spring), the container (`ds-container` group over `--ds-dur-long` on the spring, no inline name left), the indicator within a page (no group of its own, the docked drawer live, the pill's name lifted while `data-ds-vt` is set, its edges transition and it lands on the item with its name back), the watchdog (a 2s update is skipped after `--ds-dur-long` and a click reaches the page meanwhile), a view without the drawer (the `ds-panel` group over `--ds-dur-long`, the drawer's old-only exit and new-only return, `enter(drawer)` quiet), the side sheet (previous and next animate only `ds-sheet-body`; Refresh starts no transition and no animation); page loads (`mpa-a.html` to `mpa-b.html`: a `ds-indicator-nav` group over `--ds-dur-slow`, no top bar group; with `?plain=1` no transition); the fallback (`shell.html`, the embedded case, and `views.html` in `fallback`: no `startViewTransition`, the returned element plays `ds-fade-in` and `ds-lift-in`, no pseudo-element animation, the drawer slides back through `enter()`); rapid double navigation within 50ms ends on the second view without a rejection; the styleguide's `views.html` demos end settled without a console error |
| `scroll.spec.js` | all, `fallback` | scroll-driven effects (1.5.0) on `views.html`, by feature detection: the panel hairline and the top bar's tint at opacity 0, about .5 and 1 at `scrollTop` 0, 4 and 8 (`?observe=0`: no `data-scrolled` on the view; a sheet's panel has it through `DS.overlay.open()`, and the timeline still draws), else the sentinel's `data-scrolled` fading both in over `--ds-dur-fast` (read in the microtask after the observer set it, paused in the same task); the same for a side sheet's head hairline; the table's edge fades (2.0: the edge numbers `--ds-scroll-edge-start` / `-end` 0 and 1 at the start, the reverse at the end, both 0 on a table that fits; else the static `to left` mask without animation); `.ds-reveal--scroll` (hidden below the fold, opaque 96px into view, reversed when scrolled back, opaque in print; static without `view()`); the styleguide's sentinel changes `data-scrolled` at most twice while its view scrolls 2000px; `DS.overlay.open()` watches sheet and dialog bodies (one sentinel through re-opens and re-renders, `data-scrolled` on the panel or box, an empty dialog body takes no room) |
| `example.spec.js` | all, `fallback` | the reference app (`example/`, published on GitHub Pages) at `?live=0` (no polling): it starts without a console error or warning, every view renders with focus on its title and `aria-current` on its drawer item, Back returns; a tile opens the devices filtered by its status; a search that leaves nothing shows the empty state and clearing the filters brings every row back; select all turns indeterminate for some rows while the selection bar counts them, deleting asks in the alertdialog (Cancel focused), the range drops by two and the snackbar's Undo restores the rows; the pages (next, last, rows per page, blocked ends) and Clear in the selection bar handing focus to select all; the side sheet opens from a row, steps to the next device and gives focus back to the row; a new ticket shows its errors on submit, takes a device from the combobox by keyboard and lands in the table; the accent radio cards change `--ds-primary` and keep the choice across a reload |
| `tables.spec.js` | all, `fallback` (forced colours: Chromium) | the tables of 2.0 on `tables.html`: stacked rows (a bordered block per row with its `data-label` above the field in a 560px content area, a sheet body and `--stack-wide` at 800px, not `--stack` at 800px; the remove button at the block's top end; the card padding; no fade; an ARIA snapshot: the table roles stay in every engine); the full-page table (the sticky header and the pinned column in a hit test after scrolling both ways, the cell cut with an ellipsis at `--ds-table-cell-max-width`, the corner above, the head's scroll padding; its fades by scroll position or the attributes, the border and scrollbars kept by the mask composite); the pinned card table (sticky, its three-layer opaque base, the selection tint, the hairline once scrolled, the hover layer, nothing showing through); click forwarding of `DS.ripple.attach()` (a plain click, the pinned cell's padding, controls keep theirs, Ctrl or Meta and the middle button open a new tab through a stubbed `window.open`, a page `preventDefault()` and selected text keep the click, nothing without `attach()`); the two-part ripple with one centre; rows without a row link get no pointer and no ripple; row actions keep the 52px row; the summary row's hairline; pagination under the table with a hairline, its size field gone at 520px; the selection bar; print and forced colours |
| `scroller.spec.js` | all, `fallback` | `.ds-scroll-x` on `tables.html`: the edge numbers at 0 and 1 at the start, about .5 after 16px, 1 and 0 at the end, 0 and 0 when it fits (scroll-driven), else none until `DS.dom.scrollEdges()` fades the end in over `--ds-dur-fast`; `--ds-scroll-fade: 0px` turns the fade off; `--ds-scrollbar-height` sizes the opaque scrollbar layer; the tab stop's inset ring without the mask, arrow keys scroll; `.ds-jump`'s pill 16px above the log's bottom edge, centred, the place 0px high and the pointer reaching the log beside the pill; print; a re-render through `morphHtml` keeps the edge state `scrollEdges()` owns |
| `fallback.spec.js` | `fallback` only | the floor engine itself: `--ds-ease-spatial` computes to its cubic, `startViewTransition`, `showPopover` and `moveBefore` are gone, `el.animate()` rejects `linear()` |
| `guard.spec.js` | all, `fallback` | `DS.motion.guard()` (2.0): Enter in a field submits until the default button is busy, a done button is blocked like a busy one, an `aria-disabled` button keeps its focus and tooltip but no click, Enter or Space reaches the page, a label click never flips an `aria-disabled` switch, a middle click on an `aria-disabled` link opens nothing; `data-ds-guard="off"`, a button in an `aria-busy` region and `destroy()` let activations through; `DS.ripple.attach()` installs it and its `destroy()` lets go |
| `roving.spec.js` | all, `fallback` | `DS.dom.roving()` (2.0): a tab list is one tab stop; the arrows, Home and End move the focus and the selection, skip a disabled tab and reach an `aria-disabled` one; a toolbar moves the focus only and does not wrap; a re-render keeps the keys working |
| `sortable.spec.js` | all, `fallback` | `DS.motion.sortable()` (2.0): the keys of the grip move the row, keep the focus and speak the position; a pointer drag carries the row past two others, lands and reports the order; `destroy()` lets go |
| `dropzone.spec.js` | all, `fallback` (a synthetic file drag where the engine builds a `DataTransfer` with files; WebKit drives the attribute) | `DS.dom.dropzone()` and `.ds-dropzone` (2.0): a file drag over the zone and its children shows the drop state, a drop hands on the accepted file, a text drag changes nothing, a page drop target gets the dashed outline and several files, a paste with the focus inside takes the clipboard's file |
| `regressions.spec.js`, `styleguide-regressions.spec.js` | per marker | the known bugs as `test.fail` ("Known bugs"); a fixed bug's test stays and passes |
| `lab.spec.js` | all, `fallback` (videos with `DS_VIDEO=1`) | the Motion Lab ("Motion Lab: `lab.spec.js`"): the speed select, the curve plots and the ladder, coverage of every primitive by a demo, every demo's Replay timeline (JSON) and settled stage (PNG) per engine, Rapid toggle ending on the far state, Reverse at 50% continuous at `?speed=0.1`, the Overlays table of `docs/motion.md` against what each engine plays, and every stage holding its demo at 1280, 1000 and 390px (the open disclosure keeps its stage's height; the skeleton keeps the height of the page that replaces it) |
| `review.spec.js` | all (forced colours, style scope: Chromium; page loads: Chromium, WebKit) | the review sweeps over both styleguide pages ("Review sweeps: `review.spec.js`"): quiet load, hover, disabled, forced colours, the page load transition, the style scope of a DOM change |
| `perf.spec.js` | `perf` (Chromium, measured only when that project runs alone) | the paint budget ("Paint budget"): on `fixtures/perf.html` at 4x CPU throttling the p95 rAF interval of the table of 50 wavy progress bars with four shape loaders is at most two frames (33ms, plus 1ms of rAF jitter); the whole fixture and the skeleton alone are recorded in the annotations; the style recalc of a text change inside a card on both styleguide pages, and on the index while its save bar shows, stays under 7.5ms (lower quartile of 21) |

### Fixtures

Every fixture loads `/dist/fonts/fonts.css`, `/dist/ds.css` and `/dist/ds.js`, and all but `module.html` also the
shared `fixture.css` and `fixture.js`. `module.html` is the exception: it only compares the ES modules with
`window.DS` and reports through `window.moduleResult`, not through `html[data-fixture-ready]`. `.ds-theme` sits on a
wrapper `<div>`, not on `<html>`, and there is no `.ds-base`: the embedded-widget path is the default under test.
`views.html`, `mpa-a.html` and `mpa-b.html` put `.ds-theme` on `<html>`, which View Transitions need. The styleguide
covers the `html.ds-theme.ds-base` path.

| Fixture | Content |
|---|---|
| `motion.html` | every `.ds-enter` and `.ds-leave` variant on its own element (`#enter-<variant>`, `#leave-<variant>`, `default` for none) with a replay button; `.ds-stagger`, `.ds-reveal` with a `.ds-enter--slide` child, a `.ds-collapsible` with a control flush with its content edge, a delayed spinner (`#delayed-spinner`) and an SVG `<path>` (`#svg-path`) |
| `controls.html` | every `.ds-btn` variant and state, a wrapping `.ds-chips` row, `.ds-switch` off, on and disabled, check and radio cards, a `.ds-table` with a checkbox column, fields with hint and error, `.ds-search`, `.ds-segmented` and a scrolling drawer list with indicators, `.ds-parts` with links, `.ds-link-btn`, `.ds-errors` |
| `feedback.html` | `.ds-progress` at .05, .4 and 1, `--indeterminate`, `--waiting`; loading bar, skeleton, spinners, the four status chips and one whose class a button toggles on the live node, alerts, a clickable tile and a card link; the 1.4.0 parts: shape loaders (`#loader`, `--contained`, `--sm`, in `#boot` and `#loading-loader`), determinate rings (`#ring`, `#ring-flat`), `#progress-flat`, a flat indeterminate bar, a queued `--waiting` bar with a label (`#progress-queued`) and a paragraph to mark stale (`#stale`) |
| `tables.html` | the tables and scrollers of 2.0: stacked tables in a 560px and an 800px `.ds-content` and in a `.ds-sheet__body`, a full-page table (`#fill`, 30 x 9, pinned, row links in the first cell) in a 640 x 360 frame, a pinned card table (`#pinned-wrap`, a checkbox first, row links `#link-<n>` to `#open-p<n>`, row 2 selected, an edit action, a `<tfoot>`), an interactive table with and without a row link (`#row-linked`, `#row-plain`), a strip that scrolls (`#strip`, a tab stop) and one that fits, a log with `.ds-jump` (`#log`), pagination and a selection bar in a card in an 800px `.ds-content` |
| `data.html` | data that changes: a tile figure with a `.ds-progress` bar (`#figure`, `#progress`), an empty keyed list (`#list`) and table body (`#rows`), a form container (`#form`) and a `.ds-segmented` with an indicator; `window.fxData` renders keyed items and rows (`list(names, values)`, `rows(names)`) for `morphHtml`; an interactive table (`#itable`, keyed rows `a1` to `a3` with a checkbox, an expand toggle and a row link, `a2` selected, details collapsed; select all and a sort button), an alert stack (`#alerts`, a grid with a gap), a `<button>` and a `<div>` interactive card (`#card-button`, `#card-div`) and a clickable tile (`#tile-button`) |
| `lists.html` | the record parts of 2.0 (`lists.spec.js`, `timeline.spec.js`): a row list (`#rows`, keyed `d42`, `d17` current, `p03`, `m09` blocked) and a narrow one, key-value rows that open with a static, a blocked and an icon row, bars, facts in rows with a lock, a plain disclosure and accordion rows in a card, a timeline with two day groups, a muted and an icon entry, a task list; `window.fxLists` renders rows, entries and tasks (`rowsHtml()`, `timelineHtml()`, `tasksHtml()`) |
| `charts.html` | the charts of 2.0 (`charts.spec.js`): a meter with a figure, a warning meter, columns of series 1 to 4 and a column that is a button, a legend, a mini sparkline |
| `shell.html` | the `.ds-app.ds-app--drawer` frame with top bar, drawer, indicator, scrim and panel; use it at 1000px (docked) and 800px (modal drawer; the menu button and the scrim toggle `data-drawer-open`); its page script runs the breakpoint snippet of `docs/components.md` (`.ds-drawer--instant` while the window crosses 900px) |
| `shell-overlay.html` | `shell.html` as a page that drives the modal drawer through `DS.overlay` (the menu button calls `open` / `close`, the scrim closes it through `DS.overlay`), with no breakpoint snippet and no scrolled hairline; tests resize across 900px before any open (the 1.6.1 fix: crossings are instant from load on) and replace the drawer while it is open |
| `module.html` | imports the six ES modules of `dist/js/`; `window.moduleResult` says whether they export everything `window.DS` exposes |
| `reset.html` | a normalize-like reset without a layer before `ds.css`; it changed in P1 on purpose (the unlayered reset now wins: the `@layer` break of the 1.0.0 migration note) |
| `reset-layered.html` | the same reset in `@layer reset`, declared before `ds.css`; kept its P0 screenshot through P1 |
| `overlay.html` | `.ds-theme` on `<body>` (the body scrolls, for the scroll lock): openers for a div dialog, a native `<dialog>` with `autofocus` on Cancel, a div side sheet (whose button opens the div dialog nested), a native side sheet and a menu, and a combobox; the page script only wires the openers to `DS.overlay` |
| `popups.html` | `.ds-theme` on a wrapper: a menu trigger with a four-item menu (one `aria-disabled`, one `menuitemcheckbox`, a divider), a trigger at the right edge and one fixed at the bottom edge with their menus, a combobox with a chevron, one fixed at the bottom edge, a native dialog whose last field is a combobox, `.ds-presence` on a `[hidden]` note and on a `[popover]`; the triggers are wired as `docs/components.md` shows, item clicks are recorded in `window.activated` |
| `toast-tooltip.html` | `.ds-theme` on a wrapper: a `.ds-toasts` region without role and one with the deprecated `role="status"`, a toolbar of five `[data-tip]` icon buttons (one whose tip equals its name), a trigger fixed at the bottom edge, a native dialog with a trigger, a div side sheet; `DS.overlay.tooltips(document)` as `window.tips` |
| `perf.html` | the paint budget (`perf.spec.js`): four shape loaders, a full-width skeleton surface and a table of 50 rows with a wavy progress bar each; `?parts=loaders,skeleton,table` keeps only the parts named |
| `spike.html` | the test bed of the capability spike, one numbered block per capability; animations start when a test adds the `--run` class |
| `views.html` | `.ds-theme` on `<html>` (the View Transition path; `shell.html` stays the embedded case): the app frame with a drawer indicator named `nav`, four destinations (the fourth without the drawer), a card detail, a native side sheet with previous/next and Refresh, all through `window.fxViews` (`go`, `slow`, `detail`, `back`, `openSheet`, `step`, `refresh`); the first destination scrolls and holds a wide table (`#wide`), one that fits (`#narrow`) and a `.ds-reveal--scroll` block below the fold (`#reveal`); the 1px sentinel sets `data-scrolled` on `.ds-app` and the sheet panel, `?observe=0` leaves it out |
| `mpa-a.html`, `mpa-b.html` | two pages of a multi-page app: `.ds-theme` on `<html>`, `css/optional/view-transitions.css` as a parser-inserted link (`?plain=1` sets its media to `not all`), a drawer indicator named `nav` from the classic scripts at the end of `<body>`, which the first render waits for (`<link rel="expect" blocking="render">`); the new page records the animations of its View Transition at `ready` in `window.revealed` |
| `guard.html` | a form whose default button `busy()` runs, an `aria-disabled` button with a tooltip, link and switch, a control under `data-ds-guard="off"` and a button in an `aria-busy` region; `window.fxSeen` counts what reaches the page (`guard.spec.js`) |
| `helpers-2.html` | the 2.0 helpers: a list for `DS.motion.sortable()` (its order in `window.fxOrder`), a drop zone and a page drop target for `DS.dom.dropzone()` (files in `window.fxFiles`), a tab list and a toolbar for `DS.dom.roving()` |
| `csp.html` | a page under `style-src 'self'` (a meta CSP, no `style-src-attr`): `morphHtml()` applies a morphed `style` without a violation (`window.fxViolations`, `morph.spec.js`) |
| `vt-view.html` | `.ds-theme` on `<html>` and a wizard in a `.ds-vt-view` without `.ds-app`; `window.fxStep(n, type)` goes to a step through `DS.motion.transition()` (`view-transitions.spec.js`) |

`fixture.js` fills `[data-icon]` placeholders from `DS.icons`, wires `[data-replay]` buttons
(`DS.motion.replay`), `[data-toggle-class]` buttons and `[data-indicator]` tracks (`DS.indicator.createIndicator`,
with `data-indicator-name` as its `name`, reachable as `window.fixtureIndicators`; an item with `data-fx-follow` loads
its link instead), honours `?speed=` and then sets `html[data-fixture-ready]`.

### Styleguide hooks

`styleguide/styleguide.js` (still a classic ES5 script, so it runs from disk) gives the tests three hooks:

| Hook | Meaning |
|---|---|
| `html[data-sg-ready]` | render, navigation, demos and themes are set up, and a theme saved in `localStorage` (`ds-styleguide-theme`) has loaded; `ready()` waits for it instead of racing the first stagger. The lab renders its demos after its first render (after the incoming View Transition, if any), so on `motion.html` it also means the demos exist |
| `html[data-sg-theme="<value>"]` | the theme last applied (`example`, `square`, `dim`, `default`, `file`), set after `afterThemeChange()` refreshed the shown values and re-placed the three indicators; a theme file link is awaited by its `load` or `error` event, a `<style>` preset by one frame, never by a timeout |
| `html[data-sg-speed]` | `?speed=<factor>` is active (see "Slow motion") |

A theme for a test goes in before the page loads:
`page.addInitScript(() => localStorage.setItem('ds-styleguide-theme', 'square'))`, then `ready()`.

## Helper module

`helpers/motion.js` is the only helper file; every spec imports it.

| Function | Use |
|---|---|
| `ready(page)` | fonts loaded, plus `html[data-sg-ready]` on the styleguide or `html[data-fixture-ready]` on a fixture |
| `timeline(locator, { subtree, names })` | `getAnimations()` as data: type, name, pseudo-element, duration, delay, easing (and `keyframeEasing`, where a CSS animation keeps its curve), iterations (`Infinity` for loops), direction, fill, play state, current time |
| `freeze(page)`, `seek(page, ms \| { progress })` | pause every animation (pseudo-elements included) and set its time: for mid-animation screenshots and seek-based sampling |
| `sample(locator, props, times, { pseudo })` | freeze, then seek to each time and read numbers (keys listed in the file header) |
| `rafSample(locator, props, ms, { pseudo })` | the same values every frame in real time; only for interruption, judged with tolerances |
| `settle(page, { timeout })` | waits for every finite animation; rejects and names what still runs (a frozen page never settles) |
| `setSpeed(page, factor)` | reloads with `?speed=<factor>`, which sets `--ds-time-scale` (see "Slow motion") |
| `press(locator, { holdMs, x, y, pointer })` | real pointer down, hold, up with the mouse; `pointer: 'touch'` taps (context with `hasTouch`), a touch hold needs Chromium |
| `focusByKeyboard(page, locator)` | focus by the Tab key, so `:focus-visible` matches |
| `expectEndState(locator, styles)` | computed styles at rest |
| `series`, `expectMonotonic`, `expectWithin`, `peakRatio`, `expectPeakAtMost`, `expectSettles`, `expectContinuous` | pure checks on a series of numbers, unit-tested in `test/browser-helpers.test.js` |

Scroll-driven animations (on a `ScrollTimeline` or `ViewTimeline`: the panel hairline, the top bar's tint, a sheet
head's hairline, a table's edge fades, `.ds-reveal--scroll`) follow the scroll position: they never finish by
themselves and take no time-based `currentTime` (Chromium throws). `freeze`, `seek`, `sample` and `settle` leave
them out, and every spec that walks `document.getAnimations()` filters them the same way
(`.filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))`). Test them by setting
`scrollTop` / `scrollLeft` and waiting a frame.

Mid-animation screenshots pause all animations and seek `currentTime`, then take the shot with
`animations: 'allow'`; the config's `animations: 'disabled'` is only for settled shots. Infinite loops are shot at
fixed seek times for the same reason.

## Known bugs: `test.fail`

A known bug gets a test that asserts the **correct** behaviour, marked as expected to fail:

```js
test('the delayed spinner keeps turning after its entrance', async ({ page }) => {
  test.fail(true, 'repo-enter-iteration: fixed in P1');
  // ... assertions of the correct behaviour ...
});
```

- The condition is `true`, or the engines where the bug reproduces (`browserName === 'webkit'`).
- The reason is `<id>[, <id> ...]: fixed in P<n>`, with the ids of `plans/motion-2/coverage.md` (a decision such
  as `D8` counts as an id); capability gaps use `spike: <capability>`.
- Since P8 no bug marker is left: `test/repo.test.js` fails on any `test.fail` other than a `spike: <capability>`
  marker whose condition names the engine (never `true`) and whose capability has a row in the table of "Capability
  spike", and on a `test.skip` without its reason. A bug found later is fixed with its test, not marked.
- Never `test.fixme`: it never runs and proves nothing. Before committing, confirm that each marker fails, in the
  engines it names, for the reason it names. A reproduction that unexpectedly passes is a finding to re-check, not
  a marker.
- **Flipping a marker:** the phase that fixes the bug deletes the `test.fail(...)` line and nothing else; the test
  then passes as written. If Playwright reports "expected to fail, but passed" earlier, a change fixed the bug as a
  side effect: delete the marker in that change.
- To see why a marked test fails (it reports as passed), run it with `--reporter=json` and read its `errors`, or
  delete the marker locally for a moment.

The markers of P0, in `regressions.spec.js` (fixtures) and `styleguide-regressions.spec.js` (the styleguide's demo
code); every one was confirmed to fail, in the engines it names, for the reason it names. A marker that reads one
point inside a motion fixes that point (pauses and seeks the motion, or waits for a phase of a loop) instead of
relying on frame timing, so a loaded machine cannot make it pass or time out by chance:

| Phase | Test (what the fix makes true) | Ids | Engines |
|---|---|---|---|
| P1 (fixed, marker deleted) | a delayed spinner plays its entrance once, keeps turning; `enter()` resolves on `animationend` | repo-enter-iteration | all |
| P1 (fixed, marker deleted) | a `.ds-enter--slide` child of `.ds-reveal` travels `--ds-distance-xl` | core-css-distance-inherits | all |
| P1 (fixed, marker deleted) | `[hidden]` hides dialog, sheet and combobox popup without `.ds-base` | overlay-hidden-attr-ignored | all |
| P1 (fixed, marker deleted) | a backdrop click during the dialog exit does not reach the page | overlay-missed-1 | all |
| P1 (fixed, marker deleted) | a tooltip placed by an inline `transform` is at its anchor at 10 % of the entrance | overlay-tooltip-transform-fly | all |
| P1 (fixed, marker deleted) | `reducedMotion: 'reduce'` gives the same timelines (enter, leave, spinner, dialog) | D8 | all |
| P2 (fixed, marker deleted) | `leave(…, { then: 'hide' })` then `enter(el, 'swap')` ends visible | core-js-leave-enter-race, js-leave-enter-race, repo-leave-enter-race | all |
| P2 (fixed, marker deleted) | a second `countUp()` mid-count never counts backwards (fixture and styleguide tiles) | core-js-countup-reentry, js-countup-concurrent, repo-countup-overlap | all |
| P2 (fixed, marker deleted) | `enter()` restarts the entrance of an SVG path that carries `.ds-enter` | core-js-replay-svg-reflow | all |
| P2 (fixed, marker deleted) | `morphHtml()` keeps a track's `.ds-indicator` | js-morph-indicator, controls-indicator-morph-removes | all |
| P2 (fixed, marker deleted) | `morphHtml()` keeps focus and caret of a focused input | js-morph-focus | all |
| P3 (fixed, marker deleted) | hovering a disabled chip or switch changes nothing (two tests) | controls-chip-disabled-hover, controls-switch-disabled | all |
| P3 (fixed, marker deleted) | 50ms after blur a field shows no primary border without its inset shadow | controls-form-blur-ghost | all |
| P3 (fixed, marker deleted) | the focus ring of a `.ds-parts` link is not clipped | controls-list-parts-clip | all |
| P3 (fixed, marker deleted) | `.ds-link-btn` and `.ds-errors summary` show the `--ds-focus-outline` ring without `.ds-base` | layout-linkbtn-focus, layout-errors-summary-focus | all |
| P4 (fixed, marker deleted) | `DS.motion.enter(drawer)` moves along x only, starting left | layout-drawer-enter-axis, repo-drawer-enter-axis | all |
| P4 (fixed, marker deleted) | 1000px to 800px starts no transition on `.ds-drawer` (no `transitionrun` event) | layout-drawer-resize-slide | all |
| P4 (fixed, marker deleted) | the indicator follows a growing active label and a badge on an earlier item | controls-indicator-item-resize | all |
| P5 (fixed, marker deleted) | focus is on the opener two frames after Escape or Cancel (the exit is held until then) | overlay-focus-during-exit | all |
| P5 (fixed, marker deleted) | tabbing between `[data-tip]` buttons keeps the tooltip shown | overlay-tooltip-demo-interrupt, js-tooltip-refocus | all |
| P5 (fixed, marker deleted) | the pointer moving onto the icon inside a tooltip button keeps the tooltip | js-tooltip-mouseout-child | all |
| P5 (fixed, marker deleted) | closing an error snackbar does not drop focus to `<body>` | overlay-toast-close-focus-loss | all |
| P5 (fixed, marker deleted) | reopening a closing dialog continues from its opacity (the exit held at 40 %, read in one task) | overlay-keyframes-not-interruptible | all |
| P6 (fixed, marker deleted) | indeterminate to determinate at .3, set in a frame callback 40 to 60 % into the loop's cycle: the bar stays within 30 % from the left edge | layout-progress-handoff | Firefox (the others jumped to the share) |
| P6 (fixed, marker deleted) | a status class change: the icon runs on the container's timing | layout-status-data-crossfade | all |
| P6 (fixed, marker deleted) | the focus ring of a control flush with an open `.ds-collapsible` is not clipped | core-css-collapsible-clip | Chromium (the clip is gated on `interpolate-size`) |

The clipping tests compare the pixels around the focused control with and without the clip (a style sheet that lifts
it): equal pixels mean nothing was cut off.

## The fallback project

`fallback` is Chromium playing an engine on the browser floor (Safari 16.4, Chrome/Edge 111), so the fallback paths
run in CI, not only the refinements:

- `dist/ds.css` is served without its `@supports (...)` and `@starting-style` blocks (an `@supports not (...)` block
  keeps its rules): `linear()` tokens compute to their cubic fallbacks, anchor positioning, `interpolate-size`,
  `sibling-index()` and `overflow-clip-margin` are gone. The route fails the test if a `linear()` survives.
- An init script deletes `document.startViewTransition`, the popover methods and `moveBefore`, makes
  `CSS.supports()` answer false for the stripped features, and makes `Element.prototype.animate` throw a
  `TypeError` for a `linear()` easing, so the cubic retry of `motion.js` (`animateSafe`) is what plays.

A spec opts in by importing `test` and `expect` from `./base-test.js` instead of `@playwright/test`; the config
runs exactly those specs in `fallback` (a spec on plain `@playwright/test` would only run Chromium twice). The engine
specs of P2 import it, and so does every later spec of a feature with a fallback. `fallback.spec.js` checks the floor
engine itself and runs in `fallback` only (`testIgnore` in the three engine projects). A fallback spec that needs its own
screenshots or JSON snapshots gets them under `__screenshots__/fallback/`.

## Slow motion: `?speed=`

`?speed=<factor>` with a factor of 1 or less (for example `?speed=0.1`) slows motion down on the styleguide and on
every fixture: the page sets `--ds-time-scale: <1 / factor>` on `<html>` (the styleguide's root `.ds-theme`, above the
fixtures' `.ds-theme`). The registered token multiplies every duration and delay token, so CSS motion stretches by
itself. The styleguide marks it with `html[data-sg-speed]`, fixtures with `html[data-fx-speed]`.

JS timing follows it through `DS.motion.motionDuration()`, which reads the scaled tokens, and `settled()`, whose ceiling
comes from the animations it waits for (and waits on while one is paused), and `countUp()`, which counts over the
scaled `--ds-dur-glide`, and the indicator, whose travel time is `travelDuration()`. The Motion Lab
(P8) builds its global slow motion on the same token.

## Screenshots

The committed set in `__screenshots__/<project>/<spec>/` comes from the CI container
`mcr.microsoft.com/playwright:v1.63.0-noble`: run the `check` workflow by hand (Actions, "check", Run workflow) with
"update screenshots" set, download the uploaded `screenshots-<browser>` artifacts (one per engine, each the whole
`__screenshots__/` folder after that engine's run), copy each one's `<browser>/` folder into
`test/browser/__screenshots__/` and commit them. CI compares against that set (`maxDiffPixelRatio: 0.002`, `threshold: 0.05` per pixel).

The JSON timelines of `motion-today.spec.js` sit in the same folder but do not depend on fonts or the rasteriser:
they are compared on every machine, also with `DS_SHOTS=local`.

### The 1.6.0 set

P8 refreshed every committed shot on purpose (`--update-snapshots=all`, all four projects, in the container image
as for the P0 set, since the review ran without Actions): 515 PNG and 103 JSON files, 14 MB (Chromium 233 + 35,
Firefox 141 + 34, WebKit 141 + 34). 218 files changed. Until then a run rewrote only shots that failed, and
Playwright's default per-pixel threshold (0.2) let state layers, a selected row's tint or a hover layer pass
unseen, so the set still showed some P0 states; the config now compares with `threshold: 0.05` (stable over
repeated runs in the container). The lab and review specs then added their own (`--update-snapshots=missing`,
checked with `--repeat-each=3`): a JSON timeline and a settled stage per Motion Lab demo and project (60 + 60 in
each of the four), and four forced-colour shots. The set is now 759 PNG and 343 JSON files, 18 MB (Chromium 297 + 95,
Firefox 201 + 94, WebKit 201 + 94, fallback 60 + 60). A CI run with "update screenshots" should reproduce the set;
if it differs, its artifacts win, as for the P0 set.

### The P0 set and local parity

The P0 set (477 PNG and 97 JSON files, 11 MB) was generated in the container image itself: without Docker, the
layers of `mcr.microsoft.com/playwright:v1.63.0-noble` (amd64) were pulled from the registry, extracted into a root
folder and the suite ran there through `chroot` (with `/proc`, `/dev`, `/sys` and the repository bound in,
`CI=1`), with the image's Node 24 and its `/ms-playwright` browsers: the same files and fonts as the CI job. The
first CI run with "update screenshots" should reproduce it; if it differs, its artifacts win.

Parity of this development machine (Debian 12, Playwright's browsers with extracted Debian libraries) against that
set, run on 2026-10-19:

| Engine | Screenshots off by more than 0.2 % | Why |
|---|---|---|
| Chromium | 8 of 197 (sections with monospace or system text: `colour`, `type`, `frame`, the phone frame, forced-colours buttons; three snackbar frames over the colour swatches) | system fonts differ (the monospace stack and fallbacks are not the bundled Google Sans) |
| Firefox | 131 of 140 | anti-aliasing and hinting of every text run (1 to 10 % of a crop's pixels) |
| WebKit | 0 of 140 | |
| JSON timelines | 0 in all engines | |

**Decision: local runs on such a machine use `DS_SHOTS=local`.** The committed container set stays the CI gate, and
local runs compare against the gitignored `__screenshots-local__/`, generated from the parent commit before a
change (below). A machine that runs the container (Docker, Podman, or the `chroot` route above) compares against
the committed set directly.

## CI

`.github/workflows/check.yml` runs on every push and pull request, and by hand (`workflow_dispatch`, with the
"update screenshots" switch). Read-only permissions; runs on `main` are never cancelled (every commit there ships),
older runs of another branch are.

| Job | What |
|---|---|
| `check` | Node 22 and 24: `npm run check` and the vendor round trip; no `npm ci`, the unit tests need nothing installed |
| `browser` | after `check`; one job per project, the three engines and `fallback` (`fail-fast: false`) in `mcr.microsoft.com/playwright:v1.63.0-noble` as user 1001: `npm ci`, then the engine's project; uploads `playwright-report/` and `test-results/` on failure (14 days) and, with "update screenshots", the rewritten `__screenshots__/` |

The container tag and the pinned `@playwright/test` version change together (`test/repo.test.js`).

Local runs on another system (fonts, rasteriser) do not match it (see "The P0 set and local parity").
`DS_SHOTS=local` switches the screenshot folder to the gitignored `__screenshots-local__/`. Generate it from the
parent commit before a change, then run the tests on the change against it, so a local run still proves "no
unintended visual change":

```sh
git worktree add ../ds-parent HEAD
(cd ../ds-parent && npm ci && DS_TEST_PORT=4174 DS_SHOTS=local npm run test:browser:update)
rm -rf test/browser/__screenshots-local__ && cp -r ../ds-parent/test/browser/__screenshots-local__ test/browser/
DS_SHOTS=local npm run test:browser
```

A run in a worktree takes its own `DS_TEST_PORT`, so it can never meet a server started from another checkout (the
config refuses a busy port rather than reuse it). The committed `__screenshots__/` set is only ever rewritten from
the CI container: never run plain `npm run test:browser:update` on another system. The container set stays the CI
gate. With Docker or Podman installed, local runs can use the container route
instead, without other changes.

## Baselines

### Settled screenshots: `baseline.spec.js`

One set of element shots (or a clip around a part, so focus rings and halos fit), never full pages:

| Group | Engines | Shots |
|---|---|---|
| styleguide sections | all three | every section (`overview` plus each `section('<id>'` of `styleguide.js`, 15), in a 1280 x 2200 viewport, so no section is cut by the scrolling view |
| fixture controls | all three | the eight sections of `controls.html` at rest; 27 controls (buttons, chips, switches, check and radio cards, a table row and sort button, link button, field, search, segmented option, drawer item, a `.ds-parts` link, the `.ds-errors` summary, the clickable tile and the card link) hovered, pressed and held, and focused by the Tab key (the radio cards: only the checked one is a tab stop); nine disabled controls hovered |
| feedback parts | all three | progress at .05, .4 and 1, waiting, the status chips and a status swapped on the live node, the alerts; indeterminate progress, the skeleton with its loading bar, the loading line and the spinners at 0 and 25 % of their loop |
| app frame | all three | `shell.html` docked at 1000px, scrolled (hairline), with `data-drawer-hidden`; the modal drawer closed and open at 800px |
| overlays | all three | the styleguide's dialog and side sheet at 1280px, the side sheet at 390px, two snackbars, the tooltip, the open combobox |
| reset fixtures | all three | `reset.html` and `reset-layered.html` |
| phone, themes, forced colours | Chromium | the frame, table and overlays sections at 390px; buttons, forms and cards with the `example`, `square` and `dim` presets (set through `localStorage` in `addInitScript`); buttons, forms, selection, overlays and loading with `forcedColors: 'active'` (skipped, with the reason, where the engine does not emulate it) |

Settled means `ready()`, `settle()`, the count-up tiles at their final value, the pointer parked at (1, 1), and
every infinite loop paused at a fixed point of its cycle; the shots then use `animations: 'allow'`, because
`'disabled'` would cancel the loops. A held press is a real `mouse.down()` held while the shot is taken and released
off the content, so it toggles and navigates nothing. Each test names the `src/` anchors it covers as `src`
annotations.

`controls.spec.js` keeps shots of its own: in Chromium only, the drawn checkboxes and radios of `controls.html`
(`forced-checks.png`) and a checked, an indeterminate and a radio input (`forced-boxes.png`) with
`forcedColors: 'active'`; in the three engines, a chip row 40ms into a glide across a wrap (`wrap-glide.png`,
seeked: the moving chip covers the one it crosses). `overlay.spec.js` shoots the open overlays of its fixtures with
`forcedColors: 'active'`, in Chromium only (one baseline), each clipped 8px around it: the div and the native dialog,
the side sheet, the menu, the combobox list with a selected option, a stack of three snackbars and the tooltip
(`forced-*.png`, 7 files); each test first checks that the overlay's transparent outline or border is painted.

Size in the committed container set (1.3.0): 449 settled PNG files, 9.2 MB (Chromium 167 files, 3.9 MB; Firefox and
WebKit 141 files each, 2.7 MB each). The 62 section-sized shots (sections, phone sections, theme presets and the
forced-colours sections) are 6.1 MB of it; the state crops are 1 to 5 kB each. With the mid-animation frames (53
files, 1.9 MB) and the JSON timelines (103 files, 0.1 MB) the whole `__screenshots__/` folder is 11 MB.

### Motion timelines: `motion-today.spec.js`

`timeline()` of every motion, stored as JSON snapshots (one set per engine,
`__screenshots__/<project>/motion-today.spec.js/<name>.json`): every `.ds-enter` and `.ds-leave` variant,
`.ds-stagger > *`, `.ds-reveal`, the spinner, the skeleton, the loading bar, indeterminate progress, the dialog and
the side sheet opening and closing, a snackbar entering and leaving, the tooltip showing and hiding (from 1.3.0
through `DS.overlay.tooltips()`: a mouse `pointerover`, hidden by Escape), the combobox list opening and closing, the drawer
indicator gliding and the modal drawer (and its scrim) opening and closing. A snapshot holds the timing contract
only (type, name, pseudo-element, target, duration, delay, easing, keyframe easing, iterations, direction, fill),
never the current time or play state. Each motion is started and paused in the same task, so nothing finishes
before it is read. In P1 these files show exactly what the new token system changes.

- JSON snapshots do not depend on fonts or the rasteriser: they always live in `__screenshots__/`, also with
  `DS_SHOTS=local` (the config sets `snapshotPathTemplate` for them and `expect.toHaveScreenshot.pathTemplate` for
  screenshots).
- `.ds-collapsible` (Chromium, where `interpolate-size` exists): Chromium runs its height transition on
  `::details-content` but does not list it in `getAnimations()`, so the snapshot holds the declared transition
  and the test proves that it runs (a height between closed and open two frames after each toggle). Firefox and
  WebKit skip it with that reason.

### Mid-animation frames: `frames.spec.js`

Chromium only, to keep the set small: the side sheet (1280 and 390px) and the dialog opening and closing, a snackbar
entering and leaving, the tooltip showing and hiding and the combobox list opening and closing (clips), the drawer
entrance (`DS.motion.enter(drawer)` at 1000px) and the modal drawer opening and closing at 800px, each at 0, 50 % and
the end: 45 PNG files. The motion is
started and paused in the same task, then every animation is seeked to one time (so a `visibility` flip at the end
of a slide stays at the end). The demos' 1000ms `settled()` timeout and the snackbar's auto-close (4s and more)
are dropped for the test, so an exit stays on screen while it is seeked; seeking into the after phase still fires
`animationend`, so an exit's end frame shows what the demo leaves behind. Until 1.3.0 the combobox had no entrance
(one frame); since then its list grows out of the field like every popup. These are the before-images of P4, P5
and P8.

From 1.2.0 also the indicator's glide (`glideFrames()`): a click in the drawer list (Overview to Settings, 1000px)
and in the segmented switch (Live to Admin), paused in the same task and shot at its start, at `--ds-dur-micro`
(only the leading edge has moved: the stretch), halfway and at the frame where the leading edge passes its target
furthest (the overshoot, found by seeking in 2ms steps): 8 more PNG files. The test keeps references to the paused
animations and seeks only before their end, so it can go back to 0 (a paused transition seeked past its end leaves
`getAnimations()`).

### Demo walk-through: `demos.spec.js`

One test per styleguide demo: the `[data-sg]` buttons (`toggle`, `switch`, `menu` at 800px, `toast`,
`toast-error`, `toast-many`, `stagger`, `fill`, `count`, `sheet`, `dialog`, `dialog-div`, `dialog-combo`,
`dialog-nested`, `progress`, `dense`, `busy`), the overflow menu, the `.ds-presence` popover, the combobox, the enter
and leave buttons of the Motion card, the track and segmented options and the disclosure. Each checks what the demo did and
must end settled with no console error.

`DS_VIDEO=1 npm run test:browser -- demos.spec.js --project=chromium` records one video per demo at `?speed=0.1`
into `test-results/` (not committed; other engines skip). Later phases record their "before" videos from the P0
tag: `git worktree add ../ds-before motion-2-p0`, then the same command there after `npm ci`, with its own
`DS_TEST_PORT` (for example 4175) when another run is going on.

### Source anchors

The audit's layout findings cite `dist/ds.css` lines; these are the matching `src/` lines, verified at `05aaeb3`
(`src/` is unchanged since). Specs and annotations use them.

| Part | `src/` anchor |
|---|---|
| drawer entrance (`.ds-drawer.ds-enter`) | `components/shell.css:248-252` |
| `.ds-view--leaving` | `components/shell.css:545-550` |
| modal drawer, closed and open | `components/shell.css:576-603` (its transform and transitions 588-603) |
| scrim | `components/shell.css:622-645` |
| progress bar, indeterminate, waiting | `components/progress.css:25-48` (transition 35, indeterminate 38-44) |
| boot, loading line | `components/loading.css:20-40` |
| skeleton | `components/loading.css:42-69` |
| loading bar | `components/loading.css:76-113` |
| spinner | `components/spinner.css:16-44` (`ds-spin` at line 24) |
| status transition | `components/status.css:28-30` |
| table row hover | `components/table.css:84` |
| table edge masks | `components/table.css:198-226` (the container-query mask 198-201, the phone mask 223-226) |
| `.ds-link-btn` | `components/table.css:251-272` |
| `.ds-errors` | `components/alert.css:89-131` |
| card arrow lean | `components/card.css:145-155` |
| clickable tile layer | `components/tile.css:107-118` |
| `.ds-stale` | `components/utilities.css:65` |
| `.ds-parts` clip | `components/list.css:146-151` |
| `.ds-input` transition and focus | `components/form.css:206-208`, `:247` |
| `.ds-enter.ds-enter` | `motion.css:144` |
| `.ds-reveal` | `motion.css:203` |
| `.ds-collapsible` | `motion.css:216-228` |

## Motion Lab: `lab.spec.js`

The lab (`styleguide/motion.html`) renders the registry of `styleguide/lab.js` (`window.SG_LAB`): one card per
demo, `data-lab-demo="<id>"`, with `data-lab-shows` (the keyframes, classes, exports and tokens it plays), its
stage (`.sg-lab-stage`, a fixed height) and the buttons `[data-lab="replay"]`, and for a reversible demo
`[data-lab="rapid"]` (five toggles 80ms apart at the current speed) and `[data-lab="reverse"]` (back at half of
the longest running animation). A card carries `data-lab-state="running"` while its run's Promise is pending and
`"settled"` once it resolved, so the tests never sleep. `Math.random` is seeded per test (the live data of the
demos), so a run is the same on every machine.

- **Speed:** the select sets `--ds-time-scale` on `<html>` (CSS and `motionDuration()` follow: ten times longer at
  0.1), stores its choice, and `?speed=` wins without being stored.
- **Curves and durations:** every `--ds-ease-*` token has a plot sampled from the engine (101 points of a paused
  probe): effects within [0, 1] and monotonic, the spring above 1 and at most 1.05, settling (the cubic fallback in
  `fallback`); the ladder has a row per `--ds-dur-*` token, and its chips take token x time scale.
- **Coverage:** every `@keyframes` of the page's stylesheets (layer blocks included), every `.ds-enter*`,
  `.ds-leave*`, `.ds-stagger`, `.ds-reveal*`, `.ds-collapsible`, `.ds-swap` and `.ds-icon-swap` class and every
  function of `DS.motion`, `DS.dom`, `DS.indicator`, `DS.ripple` and `DS.overlay` appears in some `data-lab-shows`,
  apart from `LAB_EXEMPT` (primitives that need no demo of their own, each with its reason; a row that says
  deprecated needs its entry in `src/deprecations.json`, `test/repo.test.js`). A demo that names something that does not
  exist fails too. Every reversible demo is in `CONTINUITY` or in `CONTINUITY_EXEMPT` with its reason.
- **Demos** (one test per section, at speed 1): Replay is pressed in the page and, in the task of the click, the
  timeline it started in the stage and the demo's subject is read: `type name pseudo duration delay iterations
  easing` per animation, the curve named by its token, unique and sorted. It is compared with the JSON snapshot of
  the engine (`__screenshots__/<project>/lab.spec.js/<id>.json`); the card must then settle within 4s plus ten times
  the longest animation of that timeline, or within its `LONG_RUNS` ceiling (a Replay that chains steps on timers or
  moves outside the stage, so its timeline is empty or short: the drawer, the snackbars, the tooltips ..., each with
  its reason; a timer chain stretches on a loaded machine), and the settled stage is compared with its screenshot
  (`<id>.png`; `SHOT_MASKS` covers what frame timing writes, the interruption trace, and, in Firefox only, the
  frames of `views` and `wizard`, which Firefox now and then paints 1px off after its View Transition, and of
  `savebar`, where it does so without one (capability table, row 11);
  a caption that tells what a
  demo did is written from its nominal times, never from the wall clock). A reversible demo then rapid-toggles
  twice: five toggles end on the other side of where it was (the registry's `state()`), five more come back, each
  time with nothing `inert` or `--closing` left, and what carries `hidden` at the end is what carried it before (no
  `hidden` left by an entrance that was turned back). After a section nothing is left over (`ds-enter` /
  `ds-leave` classes, `--ds-i`, `inert`, `--closing`, the scroll lock).
- **Interruption** (one test per section, at `?speed=0.1`): Reverse at 50% of every reversible demo is sampled every
  frame on the demo's main property (`CONTINUITY`: an opacity, a `translate`, a radio's dot, an indicator's painted
  edge ...). It must move and be continuous in time (`expectSmooth()` of `helpers/motion.js`): no step larger than
  four times what the faster of its neighbouring moving frames covers in that step's own frame time, plus 3 % of the
  range. A sample's time is its frame's rAF timestamp, the time the frame's animations were sampled at: on a loaded
  machine the moment a script gets to read drifts from it by a frame or more, and a step then read as a jump. Frames
  that hold a value (a delay, the frame a new animation starts) are no neighbours, and a long frame may cover more
  ground, so a jump to the end or back to the start stands out in every engine while a steep curve does not.
- **Overlay table:** every row of the "Overlays" table of `docs/motion.md` is opened and closed in the lab (at
  `?speed=0.1`; the phone rows at 390px): the part's running transitions and animations (property or keyframe,
  duration, curve) equal the row's tracks resolved in the engine (durations through `motionDuration()`, curves
  through the engine's own serialisation on a probe), and where the row names `--ds-motion-origin`, `originFrom()`
  wrote it and the part grows from it. The table names exactly the layers of `LAYERS`.
- **Videos:** with `DS_VIDEO=1` only the video tests run, one per section at `?speed=0.1` ("Final review (P8)").

New lab demos get their snapshots with `--update-snapshots=missing` in the container; check them with
`--repeat-each=3` before committing (a nondeterministic part is masked or made deterministic, never retried).

## Review sweeps: `review.spec.js`

- **Quiet load:** from load until settled, every `transitionrun` and `animationstart` on `index.html` and
  `motion.html` must come from a source on the `QUIET` list, each with its reason: loops, loaders after their delay,
  the first-render stagger, scroll-driven effects, and the documented first-render entrances of content in the
  markup (a status icon, a validation message, the overlays the index shows in place). Nothing on a chip, switch,
  checkbox, radio or the drawer's pill may move on load. (It found the pill growing in from an empty track and the
  mixed checkboxes playing their dash in Firefox and WebKit; both are fixed in the styleguide and, for the pill's
  items, in `createIndicator()`.)
- **Hover** (engines with a hovering pointer): one element of every kind of interactive element (tag, `ds-`/`sg-`
  classes, type and role) on both pages keeps its box within 0.5px and its `translate`, `scale` and `transform`
  while the mouse rests on it (D14).
- **Disabled:** a press (mouse down, 250ms) on every visible `:disabled` or `aria-disabled="true"` control (a chip or
  switch through its label) creates no `.ds-press-ripple`, keeps its radius and leaves its `::before` state layer as
  it was.
- **Forced colours** (Chromium): screenshots of both pages and of the lab's Controls and Feedback sections with
  `forcedColors: 'active'`.
- **Page loads** (where `onpagereveal` exists: Chromium, WebKit): at a height where both drawer lists fit, the
  drawer's "Motion Lab" link from `index.html` and the link back each run a cross-document View Transition in which
  `ds-drawer`, `ds-panel`, `ds-view` and `ds-indicator-nav` have groups of their own, no image of the drawer plays a
  slide (a one-sided drawer would), and the pill's group starts inside the drawer. At 1280x800 the index's list
  scrolls to its "Motion Lab" link, so the active item's pill is out of view: it gets no group and never starts
  outside the drawer. (The first found the index's in-place `.ds-dialog--contained` unnaming the frame, the second
  the pill gliding in over the top bar; both fixed in 1.6.0.) An engine skips the transition when the new page is
  revealed after its timeout, which the shared run of every spec can cause: each page records when it was revealed
  (`pagereveal`, ms from the click), and only a page revealed later than `REVEAL_BUDGET` (1s, below every engine's
  timeout) may come without one, as an annotation; a page revealed in time must have it. The lab once held its first
  render for 0.3-0.6s (up to 2s under load) while it built and set up every demo, and WebKit dropped the transition at
  random; its demos now come after the reveal (0.1-0.2s).
- **Style scope** (Chromium): with every loop paused, a text change inside a card (on both pages) restyles fewer
  than 100 elements (`UpdateLayoutTree` in a CDP trace). A count does not depend on the load, so it is checked in
  the shared run; what the change costs in ms is timed in `perf.spec.js` ("Style recalc"), where the CPU is not
  shared. Before 1.6.0 a rule of `list.css` made it a large part of the page (257 elements, about 35ms of the lab's
  2,800); a later form of it with a per-fact subject restyled few elements but still cost 8-12ms per change. Each
  rule alone is cheap; a `:has()` ancestor with a tag or structural subject is not.

## Paint budget: `perf.spec.js`

`fixtures/perf.html` holds what loops most in a dashboard: four shape loaders, a full-width skeleton surface and a
table of 50 rows with a wavy progress bar each. The test throttles Chromium's CPU 4x (CDP
`Emulation.setCPUThrottlingRate`), waits 1s, records the rAF intervals of 3s and writes their p95 into its
annotations. The budget is 33ms, two frames at 60Hz: rAF times come in whole frames (16.7ms steps, a few tenths of
jitter), so two frames read 33.2-33.5ms and the check allows two frames plus 1ms of that jitter (34.3ms) at the
p95, never a value between two and three frames. It runs in the `perf` project and measures only when
that project runs alone (`npm run test:browser -- --project=perf`; CI runs it in a job of its own), since frame
times taken while other workers share the CPU are noise (a full parallel run read 83ms for the same page).

Result with Playwright 1.63.0 in the CI container, 2026-10-21 (four runs):

| Part | p95 | Frames in 3s (180 is every frame) | Asserted |
|---|---|---|---|
| table of 50 wavy bars and four shape loaders | 33.3-33.4ms (two frames), never three | 162-172 | yes |
| the whole fixture | 133-183ms | 47-65 | no: over budget |
| the skeleton surface alone | 100-133ms, also without throttling | 88-99 | no: over budget |

The skeleton wave is the cost: its band is fixed to the viewport (`background-attachment: fixed`, the one phase
across every bone of D11), and a fixed background is repainted with the whole view on every frame of the sweep.
With `background-attachment: scroll`, or with the bones composited (`will-change: transform`), the same page holds
every frame, but both lose the diagonal band across the bones in Chromium and Firefox (WebKit keeps it), so P8 did
not change it: the limits are documented in `docs/components.md` ("Loading", "Paint cost"), and the skeleton's paint
is on the list for 2.0 in the CHANGELOG. The cost is the rasteriser's (the container has no GPU), so it hardly
changes with the CPU throttling; a GPU-rasterised browser repaints the band far faster, but still every frame.

2.0 (MO-22) moves the band onto a layer of its own: every bone clips itself (`clip-path` with its radius) and
carries the band as a fixed `::after` that the wave moves with `translate` (`will-change: translate`), so it keeps
the one band across the bones of D11 and nothing repaints while it runs. `spike.spec.js` (12) holds the look against
the fixed background pixel by pixel in every engine and reads the paint from a Chromium trace: over 1s of the wave
the fixed background repainted the whole view 6 to 16 times (6.1 to 16.4 million px²), the shipped band nothing
(also without `will-change`: Chromium gives a fixed box a layer of its own anyway; a bone that still had
`background-attachment: fixed` beside the band repainted every frame). The test above now asserts the whole fixture
as well; its frame times were not taken for 2.0 on a machine with the CPU alone (the next CI `perf` job does). On a
shared, loaded machine (not the container) the skeleton alone read a p95 of 33.3ms with 170 of 180 frames, where the
container read 100-133ms before 2.0.

### Style recalc

The second half of the style scope sweep: on both styleguide pages, with every loop paused, the same text change
inside a card as in `review.spec.js` is made 21 times, and the lower quartile of `RecalcStyleDuration` (CDP
`Performance.getMetrics`) stays under 7.5ms (`STYLE_CEILING`). In the container with the CPU alone a change costs
3-4.5ms (the `:has()` rules of `ds.css` are most of it; without any it is 0.4ms); the per-fact rule of `list.css`
took it to 8-12ms. In a full parallel run the same change read 8-27ms, so like the paint budget it asserts only in
the `perf` project run alone, and the lower quartile, not the median, keeps a stray process out.

## Final review (P8)

### Before/after report

The P0 screenshot set is the "before" picture. Without touching the committed set, extract it into the ignored
folder and point a wrapper config at it:

```sh
mkdir -p test/browser/__screenshots-local__/p8-review/p0
git archive motion-2-p0 test/browser/__screenshots__ | tar -x -C test/browser/__screenshots-local__/p8-review/p0
# p0.config.js there: the main config with testMatch /(baseline|frames)\.spec\.js$/, the three engines, an html
# reporter into p8-review/report and toHaveScreenshot.pathTemplate into p8-review/p0/...
npx playwright test -c test/browser/__screenshots-local__/p8-review/p0.config.js
```

The HTML report holds actual, expected and diff for every shot; it is the review artefact and is never committed.
In the P8 review 44 of 88 tests differed (177 shots), every difference explained by a CHANGELOG entry: the reset
fixture (1.0.0: unlayered resets now beat the components), press, hover and focus shots (1.1.0: press morph, focus
ring and layer, drawn checkboxes and radios, drawer item rings; the controls table grew 1 to 2px with the drawn
checkboxes), feedback shots (1.4.0: wavy progress with gap and stop dot, the loading bar), the overlay frames (1.3.0:
`DS.overlay` timings, the sheet's full-width slide, focus back on the opener at once, so no ring on the closing
dialog), the modal drawer (1.2.0), the styleguide sections (new demos in every phase, the stable scrollbar gutter of
1.2.0, the speed select and the Motion Lab card of 1.6.0) and the theme presets (the same controls).

### Videos

`DS_VIDEO=1 npm run test:browser -- lab.spec.js --project=chromium --project=firefox --project=webkit` records one
video per Motion Lab section at `?speed=0.1` (Replay, then Reverse at 50% and Rapid toggle where a demo is
reversible) into `test-results/`. Review each demo for jumps, restarts, reversed entrances (D21), movement on hover
(D14), overshoot on layout sizes (D29) and gaps at the screen edge. Without a video player, Playwright's own ffmpeg
(`/ms-playwright/ffmpeg-*/ffmpeg-linux` in the container) cuts a video into PNG frames:
`ffmpeg-linux -i video.webm -r 4 frame-%03d.png`.

## Capability spike

`spike.spec.js` on `fixtures/spike.html` asserts, in every engine, a capability that a later design relies on;
gaps are `test.fail(browserName === '<engine>', 'spike: <capability>')`. Findings that are recorded rather than
asserted are `spike-result` annotations of the test. Results with Playwright 1.63.0 (chromium 1243, firefox 1543,
webkit 2359), run on 2026-10-19; no engine needed a marker, and none is left at 1.6.0 (the table records the
capabilities the design relies on; a later gap gets its row and its `spike:` marker):

| # | Capability | Chromium | Firefox | WebKit | Design consequence |
|---|---|---|---|---|---|
| 1 | Interruption: `cancel()` then `animate([current, target])`, with `linear()` and cubic easing | works; `animate()` accepts `linear()` | works; accepts `linear()` | works; accepts `linear()` | P2's mechanism is confirmed: read the computed values, `cancel()`, `animate()` in the same task shows no un-animated frame and continues without a jump. The cubic fallback stays for engines on the floor without `linear()` (Chrome/Edge 111-112, Safari 16.4-17.1). |
| 2 | `setKeyframes()` / `updateTiming()` on a running `CSSAnimation` (for the record) | works | works | works | Script-set keyframes and duration stick (a later `animation-duration` change is ignored), a property the script left alone (the delay) still follows the CSS, `animation-name: none` removes the animation. Not used: the authority keeps mechanism 1. |
| 3 | `translate` keyframes over an inline `transform`; `composite: 'add'` | composes; `add` works | composes; `add` works | composes; `add` works | Tooltip and indicator keep their inline `transform` under `translate` keyframes (at 10 % the box sits at the anchor plus the keyframe offset). FLIP retargeting may use `composite: 'add'` on `translate`. |
| 4 | Pseudo-element animations in `getAnimations()`, seekable | listed with `pseudoElement`; seek reflected | same | same | P6's loader and progress tests can sample `::before`/`::after` with `freeze()`/`seek()`. |
| 5 | `appearance: none` checkbox and radio with pseudo-elements and halo | renders; halo not clipped in `.ds-table-wrap` | same | same | D23 as planned in P3: `::before`/`::after` on the 18px input and a `box-shadow` halo; the header checkbox's 10px halo fits in the default cell padding. |
| 6 | `translate` on a `<tr>`; `position: relative` on a `<tr>` | the cells move; the row contains the absolute child | same | same | Rows FLIP with `translate` and can host the ripple; the WebKit containment quirk does not show in the tested build (keep the "rows FLIP even without ripple" fallback for older WebKit on the floor). |
| 7 | Registered properties in durations and delays; `inherits: false` | duration and delay scale ×10; `inherits: false` stays put | same | same | P1's `--ds-time-scale` (registered, `inherits: true`) can multiply durations and delays through `calc()`; motion hooks registered with `inherits: false` do not leak to children. |
| 8 | Focus snap: `outline-offset` transition beside a running animation | ring solid at frame 1, offset 4 → 3 → 2px; the animation keeps running | same | same | D24 as planned in P3: a transition on `outline-offset` never takes over `animation`. |
| 9 | A closing `<dialog>` above a sticky element | paints above | paints above | paints above | P5's `--closing` rule (`display: block; position: fixed; z-index`) keeps a closed dialog above sticky content in every engine. |
| 10 | Skeleton wave in phase across bones (`background-attachment: fixed`) | one phase across bones; breaks under an ancestor's `translate` animation, also while a finished one fills; holds once it is gone | same as Chromium | one phase in every case | P6: the wave starts after the container's entrance, and no entrance around a skeleton fills forwards (`.ds-enter` fills `backwards` only). Noted in `plans/motion-2/P6.md`. |
| 11 | Painting a frame (`<iframe>`) after a same-document View Transition inside it (recorded, not a spike test) | the same paint every run | now and then, under parallel load (2 of 20 with 10 workers), paints the frame's content 1px up and to the left while its border stays put; the DOM, the rects, the scroll, the transforms and the animations are those of a good run, and a forced repaint does not stop it | the same paint every run | Not a `src/` bug: the settled shots of the lab's `views` and `wizard` demos mask the `iframe` in Firefox only (`SHOT_MASKS`, `engines`); their timeline JSON and the state checks of the Replay stay the proof. The `savebar` demo's frame, which runs no View Transition, shows the same offset now and then (2 of 5 runs of its group in the CI container) and is masked the same way. |
| 12 | The skeleton band as a fixed `::after` on its own layer, clipped by each bone (MO-22, 2.0) | the same band at the same screen place as the fixed background (worst grey error 2 of 255); the running wave paints nothing (the fixed background repainted the whole view 6 to 16 times a second); no scroll added around a translated parent | the same band (error 1) | the same band (error 1) | Shipped in 2.0 (`loading.css`); `perf.spec.js` asserts the whole fixture. |
