## Question card

A question an assistant or an agent asks while it works: options to choose (one or several), an answer of one's
own, and Answer and Skip. Once answered, the choice stays in view and a line says it.

```html
<form class="ds-question" data-ds-question aria-labelledby="q-title">
  <div class="ds-question__head">
    <span class="ds-question__icon"><!-- helpCircle, 20px --></span>
    <h3 class="ds-question__title" id="q-title">Which laptops should get new batteries?</h3>
  </div>
  <p class="ds-question__hint">The assistant waits for your answer.</p>
  <div class="ds-radios ds-question__options" role="radiogroup" aria-labelledby="q-title">
    <label class="ds-radio"><input type="radio" name="q1" value="all">
      <span><strong>All three</strong><small>LAPTOP-0007, -0019 and -0031</small></span></label>
    <label class="ds-radio"><input type="radio" name="q1" value="worst">
      <span><strong>Only LAPTOP-0007</strong><small>Its battery swells</small></span></label>
    <label class="ds-radio"><input type="radio" name="q1" value="other">
      <span><strong>Something else</strong></span></label>
  </div>
  <div class="ds-field ds-question__other">
    <label class="ds-field__label" for="q-other">Your answer</label>
    <input class="ds-input" id="q-other" name="other" autocomplete="off">
  </div>
  <p class="ds-field__hint ds-field__hint--error ds-question__error" hidden></p>
  <div class="ds-question__actions">
    <button class="ds-btn ds-btn--filled" type="submit">Answer</button>
    <button class="ds-btn ds-btn--text" type="button" data-ds-question-skip>Skip</button>
  </div>
  <p class="ds-question__answer" hidden></p>
</form>
```

| Part | What |
|---|---|
| `.ds-question__head` | an optional `.ds-question__icon` (hidden from assistive tech by the module) and the `.ds-question__title` |
| `.ds-question__hint` | optional: why it asks, what happens next |
| `.ds-question__options` | the choices: radio cards (`.ds-radios`, `role="radiogroup"`) for one, checkbox cards (`.ds-check-cards`, `role="group"`) for several, named by the title |
| `.ds-question__other` | optional: a `.ds-field` for an answer of one's own; typing picks the radio whose value is `other` |
| `.ds-question__error` | on a `.ds-field__hint--error`, empty and `hidden`: the module writes the message of an answer without a choice |
| `.ds-question__actions` | Answer (the form's submit, the one filled button) and Skip (`data-ds-question-skip`) |
| `.ds-question__answer` | empty and `hidden`: once decided, the module writes a 16px `.ds-question__glyph` and `Answered: All three` or `Skipped` |

**State** (`data-state`, written by the module; never colour alone): `waiting`, `answered` (the check in a circle in
`--ds-success` and the words), `skipped` (a crossed-out circle and `Skipped`).

**Behaviour** (`data-ds-question`, `DS.init()`). The submit never leaves the page (the module sets `novalidate` and
answers in place):

- **Without a choice** and without text, the error shows `Choose an answer.` (string `questionRequired`) with an icon,
  the options get `aria-invalid` and `aria-describedby`, and focus goes to the first option. A choice clears it.
- **With one**, the card emits `ds:answer` (cancelable) with `{ values, labels, other, skipped: false }`. A page that
  calls `preventDefault()` keeps it open and settles it later with `set({ state: 'answered' })`. Otherwise the controls
  are disabled (the choice stays in view), the actions go, the answer line says `Answered: All three` (string
  `questionAnswered`; several labels as a list, `DS.format.list()`) and takes the focus (`tabindex="-1"`) when the
  focus was in the card, so a screen reader reads it; otherwise (an answer set from the page) it is announced.
  `ds:change` follows with `{ state }`.
- **Skip** does the same with `skipped: true` and `Skipped` (string `questionSkipped`).
- `set({ state: 'waiting' })` opens it again.
- `data-ds-question-state="answered"` (or `"skipped"`) renders a question from history decided at once, with its
  choice checked in the markup: no motion, no announcement, no events.

**Keyboard.** Tab reaches the options, the field and the actions. In a radio group the arrows move and choose (the
native group); Space checks a checkbox. With focus in the card outside the text field, `1` to `9` pick the option of
that number and focus it; Enter on an option answers, as Enter in the text field does.

```js
const question = DS.question.create(form);       // or DS.core.get(form, 'question')
form.addEventListener('ds:answer', (event) => send(event.detail));   // { values, labels, other, skipped }
question.set({ value: 'all' });                  // picks; { values: [...] } for checkboxes, { other: 'text' }
question.get();                                  // { state, values, labels, other }
question.on('answer', (detail) => {});           // also on('change', ({ state }) => {})
DS.question.answerText('answered', ['All three']);   // 'Answered: All three'
DS.question.optionIndex({ key: '2' });           // 1
DS.question.QUESTION_STATES;                     // ['waiting', 'answered', 'skipped']
```

Exports: `DS.question.create(form)` (the controller), `DS.question.answerText(state, labels)` (the answer line),
`DS.question.optionIndex(event)` (the option a digit key picks) and `DS.question.QUESTION_STATES`.

**Options.**

| Option | Classes | Effect |
|---|---|---|
| Density | `.ds-density-*` | the padding and the room between the parts, 2px per step; the cards, the field and the buttons follow their own |
| Shape | `.ds-shape-*` | the frame's corners; the cards and the buttons follow their own |
| Size, touch | `.ds-xs` ... `.ds-xl`, `.ds-touch` | the cards, the field and the buttons follow their own; the title keeps its role |
| Tone | | not read: the state shows the meaning, with its word |

**Accessibility.** A `<form>` named by its title; the options are a radio group (or a group of checkboxes) named by
the same title, so a screen reader hears the question with each option. The error is tied to the group and the
answer is said once (read on the focused line, or announced when the focus was elsewhere); focus never falls to the
page when the actions go.

**Forced colours.** The frame keeps its border; the glyph follows the line's forced text colour; the cards are the
form's.

**Hooks.** `--ds-question-padding` (`--ds-space-4`, the base the density applies to), `--ds-question-radius`
(`--ds-radius-card`), `--ds-question-bg` (`--ds-surface`), `--ds-question-border` (`--ds-line`)
([theming.md](theming.md#component-hooks)).

**Motion.** Once decided the actions leave (`DS.motion.leave()`, `.ds-leave`) and the answer line fades in
(`ds-fade-in`, `--ds-dur-fast`); opened again the actions enter (`.ds-enter`).
