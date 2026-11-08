# Patterns

How the components combine into the pages and flows of an admin dashboard. Each entry names the components, the
motion, where focus goes and what is announced; the [reference app](../example/README.md) builds most of them (its
README maps each pattern to its code). Markup: [components.md](components.md); motion: [motion.md](motion.md).
Whole pages to copy are the [page patterns](#page-patterns) at the end: sign-in, errors, public forms, onboarding and
a full-screen wizard.

Two rules hold everywhere:

- **Focus after a change.** A new view or page puts focus on its `<h1>` (`tabindex="-1"`); a closed overlay returns
  it to its opener (`DS.overlay` does it); a removed item hands it to its neighbour (`DS.motion.flip()` does it). Never
  leave focus on `<body>`.
- **Results are announced.** A busy button and its done face change only what is seen. Say what happened in a
  snackbar (`DS.overlay.toast()`, announced politely) or with `DS.overlay.announce()`; errors that block the user
  are alerts in the page, next to what failed.

## Page types

| Page | Components | Motion | Focus and announcement | In the reference app |
|---|---|---|---|---|
| **List** (devices, tickets, users) | [page head](components.md#page) with the count and one filled action, `.ds-action-bar` with search and filter chips ([Form](components.md#form)), a [table](components.md#table) in a card (`.ds-table-wrap`, sorting, selection, row link; [full-page](components.md#full-page-tables-and-pinned-columns) with `.ds-table-wrap--fill`) or [`.ds-list`](components.md#row-list) rows, [`.ds-empty`](components.md#empty-state) for no results, [`.ds-pagination`](components.md#pagination) or a "Load more" text button | first render staggers once; search and filters re-render with `DS.dom.morphHtml` (keyed rows) inside `DS.motion.flip()`; refresh: `.ds-stale` and the loading bar | the search keeps focus while rows change; the count is announced after a filter ("12 devices") | [Devices](../example/index.html#/devices) (table, pagination); the open tickets of [Overview](../example/index.html#/overview) (row list) |
| **Record** (one device, one ticket) | [page head](components.md#a-records-page-head) with a back link and actions, `.ds-facts` or `.ds-kv-list` ([Lists](components.md#key-value-rows-that-open-bars-facts-in-rows-and-the-lock)), [tabs](components.md#tabs) for long records, a [timeline](components.md#timeline) of its history, a [side sheet](components.md#side-sheet) when opened from a list | the record opens with `DS.motion.transition()` (forward), back goes backward; previous and next in a sheet step with the shared axis | the title takes focus; a saved change is a snackbar | the side sheet of [Devices](../example/index.html#/devices) (its Details and History tabs) |
| **Settings** | cards per topic, [switches](components.md#switch) that apply at once, a [form](components.md#form) with labels above fields and one Save button, a [disclosure](components.md#disclosure) for advanced options, a [save bar](components.md#save-bar) (`.ds-savebar`) for long forms | switches on their spring; Save runs `DS.motion.busy()` | a switch is its own result (no snackbar); a saved form says "Saved" in a snackbar; invalid fields get an error list and focus moves to the first | [Settings](../example/index.html#/settings) |
| **Overview** (the start page) | [tiles](components.md#tiles) with key figures, [alerts](components.md#alert) that come and go with the data, a [chart](components.md#charts) card, a live feed as a [timeline](components.md#timeline) | tiles count on with `countUp()`; alerts and feed rows glide with `flip({ live: true })`, held while pointed at or focused | live changes are not announced one by one; an alert that needs action is | [Overview](../example/index.html#/overview) |
| **Wizard** (create in steps) | [`.ds-steps`](components.md#steps) above one form per step, Back and Next (the last one names the result: "Create device"), a summary step | steps move on the shared axis (`transition()` forward and backward) | each step's heading takes focus; the step change is announced ("Step 2 of 3, Network") | |
| **Sign-in** | [`.ds-auth`](components.md#sign-in-page): one card with the product name, fields, one filled button and a text link | none beyond the busy button | the first field has focus on load; a failed sign-in is an alert above the fields, focused | |

## Flows

| Flow | Components | Motion | Focus and announcement | In the reference app |
|---|---|---|---|---|
| **Create** | a [dialog](components.md#dialog) with a form (short), a [side sheet](components.md#side-sheet) (long) or a wizard (several steps); the opener is the page's filled button | the dialog grows from its opener; the new row enters with the list's `flip()` | the first field on open; after Create focus returns to the opener and a snackbar names the result ("Device added") | the ticket dialog of [Tickets](../example/index.html#/tickets) |
| **Edit** | inline in a side sheet or on the record; `.ds-field--changed` marks edited fields ([Form](components.md#form)); the [save bar](components.md#save-bar) holds Save and Discard | values glide (`countUp`, bars); the save bar rises | focus stays where the user was; "Saved" in a snackbar, an error next to the field | the organisation form of [Settings](../example/index.html#/settings) (changed fields, the save bar) |
| **Delete with undo** | a [confirm dialog](components.md#a-question-with-yes-or-no) (`DS.overlay.confirm()`) only when undo is impossible; otherwise delete at once with an Undo [snackbar](components.md#snackbar) | the row leaves inside `flip()`; Undo brings it back the same way | focus moves to the neighbour row; the snackbar announces "Deleted, Undo" | delete in [Devices](../example/index.html#/devices) (a confirm busy until the backend answered, then Undo) |
| **Bulk actions** | checkboxes in the first column, the header box (`indeterminate`), [`.ds-selection-bar`](components.md#bulk-selection-bar) with the count and the actions | the bar enters when the first row is selected; removed rows leave together | the count is announced ("3 selected"); after the action focus goes to the header box | bulk selection in [Devices](../example/index.html#/devices) |
| **A filter sheet** | a [side sheet](components.md#side-sheet) with fields and checks, Apply and Reset in its foot, the active filters as [input chips](components.md#action-and-input-chips) above the list | the sheet slides in; the list re-renders inside `flip()` after Apply | focus returns to the Filter button; the result count is announced | |
| **A page that failed** | the page head stays; an error [alert](components.md#alert) with what failed and a Retry button ([Page states](components.md#page-states)); partial data keeps showing; a backend that does not answer at all is [a message for the whole app](components.md#a-message-for-the-whole-app) | the alert enters; the loader settles first (`settleLoader()`), so nothing flickers | the alert is announced (`role="alert"`); Retry takes focus | the offline message of every view (Settings cuts the connection) |
| **A page that is gone** (a deleted record, a wrong link) | [`.ds-empty`](components.md#empty-state) with a sentence that says what is gone and a link back to the list | none | the empty state's heading takes focus | |

## Column chooser

A table with optional columns gets a quiet icon button with the `columns` glyph (`aria-label="Columns"`,
`aria-haspopup="menu"`) that opens a menu of `role="menuitemcheckbox"` items, one per column, each with
`aria-checked`. Toggling one keeps the menu open, shows or hides the column at once (the header and the cells; no
motion on the table's width) and saves the choice. The first column (the record's name) is not optional and is not
in the menu. Markup of the menu: [components.md](components.md#menu).

## Page patterns

Whole pages built only from components, in `src/patterns/`: copy one into a project, point its links at the
project's bundle and theme, and wire its own backend where the page's script fakes one. The styleguide lists them
under [Page patterns](../styleguide/index.html#/patterns), each in a preview at a phone, tablet or desktop width
(and in the light or dark scheme), or alone.

How they are made, so a page stays copy-ready:

- **Components only.** Every class is a documented `.ds-*` class with its documented markup; no pattern has a class
  or a stylesheet of the system of its own. The few layout rules they share sit in `src/patterns/pt.css` with the
  prefix `pt-`, read tokens and hooks only and never restyle a `.ds-*` element (a project writes the same with its
  own prefix): `.pt-auth` (the column of a sign-in page), `.pt-brand` (a stand-in logo and the product's name),
  `.pt-codes` (a list of codes without markers), `.pt-foot` (the links under a card) and `.pt-bar` (the head of a
  full-screen task). `tools/check-project.mjs` passes them like a project (`test/patterns.test.js`).
- **How they load the system.** A page links the fonts, the bundle of its family, the theme and `pt.css`, and runs the
  bundle's script and its own wiring at the end of the body:

  ```html
  <link rel="stylesheet" href="../../dist/fonts/fonts.css">
  <link rel="stylesheet" href="ds/ds.auth.css">                                   <!-- the bundle: only what the family uses -->
  <link rel="stylesheet" href="../../dist/themes/presets/default.css" id="pt-theme"> <!-- stands in for the project's theme -->
  <link rel="stylesheet" href="pt.css">
  <script src="pt.js"></script>                                                    <!-- the demo's frame, not part of the pattern -->
  <link rel="expect" href="#pt-ready" blocking="render">
  ...
  <script src="ds/ds.auth.js"></script>
  <script>
  (function () {
    'use strict';
    DS.icons.fill(document);     // the glyphs of every [data-icon]
    DS.init(document);           // the behaviours of the markup (data-ds-*), the action guard
    DS.ripple.attach(document);  // the ripple on every action
    // ...the page's own wiring...
  }());
  </script>
  <div id="pt-ready" hidden></div>                                                 <!-- first paint waits for the glyphs (Chromium) -->
  ```

  The bundles are written by [`tools/bundle.mjs`](bundle.md) from `src/patterns/ds.config.json` into
  `src/patterns/ds/`: one entry per family of pages (`auth`, `status`, `form`, `onboarding`, `wizard`), so a page
  loads what its family uses (a sign-in page about 33 KB of CSS and 110 KB of script, gzip) instead of the whole
  `ds.min.css` and `ds.min.js`. `npm run build` writes them from the `dist/` it just built; they are generated files
  (`node scripts/build.mjs --generated` lists them) and `--check` compares them, so a change to a component or the
  version reaches them by itself. Each `ds.<entry>.json` says which components and modules a family needs and why.
- **The demo's frame** (`pt.js`, a classic script in the `<head>`, loaded by every page and by no project): the colour
  scheme before the first paint (`?scheme=light|dark|auto` from the styleguide's preview, else the choice its
  dark-theme button stored, else the system's), the theme preset (`?preset=<name>`, `?contrast=1`), and that button
  (`[data-pt-scheme]`: a quiet icon toggle with a fillable moon, `aria-pressed`). A project drops it and keeps its own
  scheme switch.
- **Fake backends.** The script at the end of a page is what a project writes: listeners, `DS.motion.busy()` around
  the request, the result in words. Where a server would answer, it waits a moment and decides by a rule each section
  below names (a password under eight characters is wrong, the code `000000` is wrong, an address at `example.com` is
  taken).
- **From disk and on the site.** Every page works from `file://` (classic scripts, relative links) and on GitHub
  Pages: `scripts/site.sh` copies `src/patterns/` beside `dist/`, so the relative links hold. They are no runtime
  code: `dist/` never holds them, and a vendored copy does not either.
- **Adding a pattern.** A page `src/patterns/<name>.html` with `<meta name="pt-title">`, `pt-need` (the line the
  styleguide shows) and `pt-group`, in one entry of `ds.config.json` (its family's, or a new entry) whose bundle it
  links; a `###` section here with the same title and a link to the file (its order here is the styleguide's order);
  then `npm run build`. The build stops on a page without its metas, in no entry or linking another entry's bundle,
  and on any other file in the folder. `test/browser/patterns.spec.js` opens every page in every engine: one `h1`,
  landmarks, every control named, no console error, no sideways scroll at 360px, screenshots at 1280 and 390px.

### Sign in

[sign-in.html](../src/patterns/sign-in.html): email and password, a passkey, single sign-on and a link by email.

- **Components:** the [sign-in page](components.md#sign-in-page) (`.ds-auth`, `.ds-auth__card`, `.ds-auth__alert`),
  [Form](components.md#form) with the [error summary](components.md#error-summary), [Password](components.md#password)
  (reveal, Caps Lock), a [divider](components.md#dividers) with "or", block buttons with their busy face, the
  [empty state](components.md#empty-state)'s done face for "Check your email".
- **The project wires:** the submit (only a valid form arrives: the error summary stops the rest and says what is
  wrong), the request inside `DS.motion.busy()`; a refusal puts the alert from the page's `<template>` into
  `.ds-auth__alert` and focuses it, and empties the password. The passkey and single sign-on buttons hand over to
  the browser and the identity provider. "Email me a sign-in link" needs the address alone
  (`DS.get(summary, 'errorsummary').set([...])` says so at the field), then swaps the form for the done state and
  moves the focus to the title.
- **Demo rule:** a password of eight characters or more signs in (to the two-step page); a shorter one is wrong.

### Two-step verification

[sign-in-code.html](../src/patterns/sign-in-code.html): the second step of a sign-in, a one-time code or a recovery
code.

- **Components:** the [code field](components.md#code-field-one-time-code-pin) (`data-ds-otp`, six cells in two
  groups, `data-ds-otp-submit` sends the form once complete), a "Trust this browser" check, a `.ds-link-btn` to the
  recovery code form, and that form with its pattern and error summary.
- **The project wires:** a wrong code sets `aria-invalid="true"` on the group and adds an error hint in words (named
  in its `aria-describedby`) without moving the focus or clearing the cells (the field's own rule); the next change
  takes both away. The two forms swap with `DS.motion.enter(form, 'swap')`, the focus goes to the first field.
- **Demo rule:** every code but `000000` is right.

### Recovery codes

[recovery-codes.html](../src/patterns/recovery-codes.html): the codes, shown once when two-step verification goes on.

- **Components:** a warning [alert](components.md#alert), the codes as a `.ds-grid` in a filled card (`.ds-mono`), a
  [copy button](components.md#copy-button) with its done face (`data-ds-copy-value`, the codes one per line),
  Download and Print, a required check before the filled button, and [Print](components.md#print)
  (`.ds-print-hide`, `.ds-print-only`) so the paper holds the codes and the account, nothing else.
- **The project wires:** the download (a text file from a `Blob`), `window.print()`, and the confirmation of the
  check through the error summary.

### Sign up

[sign-up.html](../src/patterns/sign-up.html): name, work email, a password with its strength, an optional team name,
the terms.

- **Components:** [Form](components.md#form) (`.ds-field__optional` on the one optional field), the error summary,
  [Password](components.md#password) with the strength meter (`minlength="12"`), a required check whose label holds
  the links, single sign-on as the alternative.
- **The project wires:** the server's answer as an error at its field (`set([{ field: 'email', text }])`), then the
  page that confirms the address (with `?email=`).
- **Demo rule:** an address at `example.com` is taken.

### Reset password

[reset-password.html](../src/patterns/reset-password.html): ask for a link, then say where it went.

- **Components:** Form and the error summary, a standalone [link](components.md#link) back, the empty state's done
  face.
- **The project wires:** the same answer whether the address has an account or not (the page tells nobody who signs
  up), "Use another email" back to an empty form.

### New password

[new-password.html](../src/patterns/new-password.html): the page the reset link opens.

- **Components:** two [Password](components.md#password) fields (the meter on the first), a hidden `username` field
  for password managers, the error summary, the done face with "Sign in".
- **The project wires:** the rule that both are the same, as a custom validity (`setCustomValidity()` on input), which
  the error summary reads with the markup's own rules.

### Verify email

[verify-email.html](../src/patterns/verify-email.html): confirm the address with the code or the link we sent.

- **Components:** the code field, text buttons to send a new code and to change the address, the done face.
- **The project wires:** the address from the sign-up (`?email=`), a wrong code as on the two-step page, and the pause
  after "Send a new code": the button turns `aria-disabled` (still focusable) and a line says why, for a minute.
- **Demo rule:** every code but `000000` is right.

### No access (403)

[error-403.html](../src/patterns/error-403.html): the account may not open the page.

- **Components:** the [result page](components.md#result-page) (`.ds-result--forbidden`, `lock`) as the
  `.ds-cover__main` of a [cover](components.md#layout) with the product's mark above and the links below; a filled
  button with its busy and done faces; a [snackbar](components.md#snackbar) for the answer.
- **The project wires:** the request for access; once sent the button says so (`DS.motion.setLabel()`) and stays
  `aria-disabled`.

### Not found (404)

[error-404.html](../src/patterns/error-404.html): the address leads nowhere.

- **Components:** the result page (`.ds-result--not-found`, `mapPin`), the overview as the filled way out, "Go back".
- **The project wires:** "Go back" (`history.back()`, or the overview when the page was opened from outside).

### Server error (500)

[error-500.html](../src/patterns/error-500.html): the request failed on our side.

- **Components:** the result page (`.ds-result--error`, `alert`), "Try again", the status page, and the reference in
  `.ds-result__meta` with an inline [copy button](components.md#copy-button) (`.ds-copy`, `ds-xs`).
- **The project wires:** the reference and the time of the failure, and the retry (here a reload).

### Maintenance

[maintenance.html](../src/patterns/maintenance.html): down on purpose, back at a time.

- **Components:** the result page (`.ds-result--maintenance`, `wrench`, the code 503 for support), the status page as
  the filled way out, "Check again".
- **The project wires:** the times in the title and the meta line.

### Offline

[offline.html](../src/patterns/offline.html): what a service worker shows for a navigation without a connection.

- **Components:** the result page (`.ds-result--offline`, `wifiOff`), "Try again", a `role="status"` meta line.
- **The project wires:** the reload once the browser is back online (the `online` event), and "Try again" that says
  "Still offline" in the status line when it is not.

### Public form

[form.html](../src/patterns/form.html): one form on one card, for people without an account.

- **Components:** the single-card page (`.ds-auth` with `--ds-auth-width: 640px` on the body), Form with a two-column
  [grid](components.md#form) that falls to one on a phone, [radio tiles](components.md#form) with the gliding tint
  (`DS.indicator`), a counted textarea (`data-ds-counter`), a select, the file field, the error summary at the top.
- **The project wires:** the rules the markup cannot say (three files at most, as a custom validity), the request, and
  the page that confirms it (`form-sent.html`, with the address).

### Form sent

[form-sent.html](../src/patterns/form-sent.html): the page after the public form.

- **Components:** the result page (`.ds-result--success`, `checkCircle`) with the reference and its copy button.
- **The project wires:** the address and the reference (a server renders them into the page).

### Onboarding checklist

[onboarding.html](../src/patterns/onboarding.html): the first page after sign-up, inside the
[app frame](components.md#app-frame).

- **Components:** the frame (`data-ds-shell`: the drawer, the rail and the modal drawer on a phone), the account menu,
  a [page head](components.md#page), a card with a [progress](components.md#progress) bar and the steps as a
  [row list](components.md#row-list) (a done step: a check and a "Done" [status](components.md#status-chip); an open
  one: its action), "Learn the basics" as interactive [cards](components.md#interactive-card) in a `.ds-grid`, a
  [form dialog](components.md#a-form-dialog) to invite people.
- **The project wires:** a step that turns done (the check, the status, the bar's share and its words), the dialog
  through `DS.dialog.form()` (busy while the invitations go out, then a snackbar), and "Hide", which hides the card
  with `DS.motion.leave()`, gives the focus to the title and offers Undo in a snackbar.

### Full-screen wizard

[wizard.html](../src/patterns/wizard.html): a task in checked steps on a page of its own.

- **Components:** a sticky head (`.ds-sticky--head` with `.pt-bar`: close, the title, the dark-theme button), the
  [form wizard](components.md#form-wizard) (`data-ds-wizard`: the steps it writes, an optional step, the summary) in a
  card in a `.ds-measure` column inside `.ds-content` (so the steps show only the current label on a phone), radio
  tiles, the [result page](components.md#result-page)'s done state after the submit.
- **The project wires:** a rule of its own as a custom validity the wizard reads with the rest (a name that is taken),
  the request, the result with the focus on its title, and the way out: Close leads back, after a
  [confirmation](components.md#a-question-with-yes-or-no) (`DS.overlay.confirm()`) when something was typed.
- **Demo rule:** the name `LAPTOP-0042` is taken.
