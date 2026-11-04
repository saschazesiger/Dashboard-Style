## Form wizard

A long form split into steps, each checked before the next, with Back and Next and a summary to review before sending.
It is built on [Steps](#steps).

```html
<form class="ds-wizard" data-ds-wizard aria-labelledby="report-title">
  <ol class="ds-steps ds-wizard__steps" aria-label="Report a problem"></ol>     <!-- or ds-steps--bar, --vertical -->
  <section class="ds-wizard__panel" aria-labelledby="step-device">
    <h3 class="ds-wizard__title" id="step-device">Device</h3>
    <div class="ds-field"><label class="ds-field__label" for="serial">Serial number</label><input class="ds-input" id="serial" name="serial" required></div>
  </section>
  <section class="ds-wizard__panel" aria-labelledby="step-problem" hidden> ... </section>
  <section class="ds-wizard__panel" data-ds-wizard-optional aria-labelledby="step-photos" hidden> ... </section>
  <section class="ds-wizard__panel" data-ds-wizard-summary aria-labelledby="step-review" hidden>
    <h3 class="ds-wizard__title" id="step-review">Review</h3>
    <div class="ds-wizard__summary"></div>
  </section>
  <div class="ds-wizard__actions">
    <button class="ds-btn ds-wizard__back" type="button">Back</button>
    <button class="ds-btn ds-btn--filled ds-wizard__next" type="button">Next</button>
    <button class="ds-btn ds-btn--filled ds-wizard__submit" type="submit" hidden>Send report</button>
  </div>
</form>
```

```js
form.addEventListener('submit', (event) => { event.preventDefault(); send(new FormData(form)); });   // every step valid
form.addEventListener('ds:validate', (event) => { if (!serialFree()) event.preventDefault(); });      // the page's own rules
const wizard = DS.get(form, 'wizard');        // or DS.wizard.create(form)
```

- **Steps.** Each `.ds-wizard__panel` is a step, named by `data-ds-wizard-label` or its `.ds-wizard__title`. The module
  writes the `.ds-wizard__steps` list (a [Steps](#steps) `<ol>`: numbers, the check of a done step that draws itself,
  `aria-current="step"`, "Optional" for a `data-ds-wizard-optional` step, the alert icon and "Needs attention" for a
  step in error) through `DS.dom.morphHtml`, and names a `.ds-steps--bar` "Step 2 of 4".
- **Next** checks the current step: the browser's constraint validation of its fields (`required`, `type`, `pattern`,
  `min` ...), then a cancelable `ds:validate` (`{ index, panel, invalid }`) for the page's own rules (call
  `preventDefault()` and show the error yourself). Each invalid field gets `aria-invalid="true"` and an error hint in
  words (Form's `.ds-field__hint--error`, with the class `.ds-wizard__error`, named in its `aria-describedby`; a group of
  radios or checkboxes gets one, in its fieldset); the first one takes the focus, the step turns to error and "2 fields
  need attention" is spoken. A field put right loses its error at once. A valid step turns done and the next one opens:
  it plays `.ds-enter--swap`, its title takes the focus (`tabindex="-1"`, written once) and "Step 2 of 4: Problem" is
  spoken.
- **Back** never checks. Back is hidden on the first step, Next on the last, where the submit button shows instead.
- **Submit.** A submit before the last step (Enter in a field) moves on instead. On the last step every step is checked
  again; the first invalid one opens with its errors and the page's submit handlers never see the event. The wizard sets
  `novalidate` on the form, since it checks itself.
- **Summary.** A panel with `data-ds-wizard-summary` lists every step before it when it opens: a `.ds-wizard__group`
  per step with its head (`.ds-wizard__group-head`: the `.ds-wizard__group-title` and an Edit button,
  `.ds-wizard__edit`, "Edit Device", going back to that step), then a [facts list](#lists) (`.ds-facts--rows`) of each named field's label and value: a select's option text,
  the label of a chosen radio or of the ticked checkboxes, Yes or No for a lone checkbox, file names, a password as dots,
  "Not given" when empty. `data-ds-wizard-summary="off"` on a field leaves it out; `data-ds-wizard-label` names it.

**JS API.** `DS.get(form, 'wizard')` or `DS.wizard.create(form)` return the controller: `get()` (`{ index, count, step,
panel, status }`), `set(index)` and `go(index)` (forward checks every step on the way; returns whether it got there),
`next()`, `back()`, `validate(index)` (checks a step and shows its errors), `on(type, fn)` (`step`, `validate`) and
`destroy()`. Events on the form: `ds:step` (`{ index, from, direction, panel }`) after a step opened, and
`ds:validate` (cancelable) before a step counts as valid. The helpers `DS.wizard.fieldLabel(field)` and
`DS.wizard.fieldValue(field, scope)` give a field's label and value as the summary reads them.

**Options** ([options.md](options.md)): classes on the wizard or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | the steps' own: row (default), `.ds-steps--vertical`, `.ds-steps--bar` | the `.ds-wizard__steps` | how the steps show |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the wizard or a group | steps, fields and buttons step themselves |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the room between the steps, the panel and the actions, inside a panel and in the summary 2px less per step |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the parts follow |
| Touch | `.ds-touch` | the theme or a container | fields and buttons at least `--ds-touch-target` (48px) |
| Tone | none | | a step's status is the steps' `data-status`, with its icon and word |

**Keyboard and names.** Tab goes through the fields of the open step, then Back and Next. Enter in a field goes on (a
submit). The steps are no tab stops (Steps). The title of each panel names it (`aria-labelledby`) and takes the focus
when it opens; step changes and errors are spoken through the announcer ([DS.a11y](core.md#accessibility-helpers)).
On a phone the row of steps shows only the current label (Steps); the actions wrap.

**Forced colours.** The steps, fields, hints and buttons are their components'; the hairline over the actions stays.

**Hooks:** `--ds-wizard-gap` (`--ds-space-6`), `--ds-wizard-panel-gap` (`--ds-space-4`)
([theming.md](theming.md#component-hooks)).

**Motion:** the panel that opens plays `.ds-enter--swap` (`DS.motion.enter`); a done step's check draws itself and its
connector turns ([Steps](#steps)).

**Strings:** `wizardDone`, `wizardFix`, `wizardStepOf`, `wizardStep`, `wizardError`, `wizardErrors`, `wizardEmpty`,
`wizardEdit`, `wizardEditShort`, `wizardYes`, `wizardNo`, `optional` and `valueRequired`
([install.md](install.md#language-and-locale)).

<!-- changelog -->
- Form wizard (`.ds-wizard`, `DS.wizard`): a form in steps on Steps, each checked before the next (constraint
  validation and a cancelable `ds:validate`), Back and Next, errors in words with focus on the first, and a summary
  step with an Edit button per step; `fieldLabel()` and `fieldValue()`.
