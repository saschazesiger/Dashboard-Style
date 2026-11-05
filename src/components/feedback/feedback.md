## Feedback

Thumbs up and down on a reply, with an optional dialog that asks why: two quiet icon toggles whose thumb fills while
pressed.

```html
<div class="ds-feedback" role="group" aria-label="Rate this answer" data-ds-feedback data-ds-feedback-reason="reason-dialog">
  <span class="ds-feedback__label" aria-hidden="true">Helpful?</span>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="false" aria-label="Helpful" data-tip="Helpful"
    data-ds-feedback-value="up">[icon thumbUp 18 ds-icon--fillable]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="false" aria-label="Not helpful" data-tip="Not helpful"
    data-ds-feedback-value="down">[icon thumbDown 18 ds-icon--fillable]</button>
  <span class="ds-feedback__status"></span>
</div>

<dialog class="ds-dialog" id="reason-dialog" aria-labelledby="reason-title">
  <div class="ds-dialog__backdrop" data-ds-close></div>
  <form class="ds-dialog__box">
    <h2 class="ds-dialog__title" id="reason-title">What went wrong?</h2>
    <fieldset class="ds-chips"><legend class="ds-sr">Reasons</legend>
      <label class="ds-chip"><input class="ds-chip__input" type="checkbox" name="reason" value="wrong">
        <span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Not correct</span></span></label>
      ...
    </fieldset>
    <div class="ds-field"><label class="ds-field__label" for="reason-comment">Anything else? (optional)</label>
      <textarea class="ds-input ds-input--grow" id="reason-comment" name="comment" rows="2"></textarea></div>
    <div class="ds-dialog__actions">
      <button class="ds-btn ds-btn--text" type="button" data-ds-close>Skip</button>
      <button class="ds-btn ds-btn--filled" type="submit">Send feedback</button>
    </div>
  </form>
</dialog>
```

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-shape-*`, `.ds-touch` | the buttons or any ancestor | the buttons' own rule ([button](#button)); `.ds-sm` suits a message footer |
| Density | `.ds-density-*` | any container | 1px less between the buttons per step |
| Tone | | | none: the pressed look and the filled thumb say which |

**Parts.** `.ds-feedback__label` (an optional question, meta type in `--ds-text-2`; hide it from screen readers when the
group's name says the same) and `.ds-feedback__status` (where the module writes its thanks; empty, it takes no room).
The thumbs take `.ds-icon--fillable`, so the chosen one fills ([utilities](#utilities)): the on state never shows by
colour alone.

**Behaviour.** `data-ds-feedback` attaches `DS.feedback` on `DS.init()`:

- The buttons with `data-ds-feedback-value` (`up`, `down`, or any value) are toggles: a press turns its `aria-pressed`
  on and the others off; a press on the one that is on turns it off. Each change dispatches `ds:change`
  (`{ value, previous }`, `value` `null` when none is on).
- A value that turns on is feedback: `ds:feedback` (`{ value, reasons, comment }`) follows, "Thanks for the feedback"
  (the string `feedbackThanks`) is announced and written into `.ds-feedback__status`. With `data-ds-feedback-lock`
  both buttons turn `aria-disabled` once it is given: a choice made once, the chosen one keeps its on look.
- **The reason dialog**: `data-ds-feedback-reason="<id>"` names a [dialog](#dialog) with a form. It opens for `down`
  (`data-ds-feedback-reason-for="up"`, `"down"` or `"both"`), its form reset, with the pressed button as its opener
  (focus goes back there). Its submit is taken by the module (no `data-ds-dialog-form` needed, nothing is sent
  anywhere): the checked `reason` fields and the `comment` field go into `ds:feedback`, and it closes. Closed without
  a submit (Skip, Escape), `ds:feedback` comes with no reasons: the thumb still counts.

```js
el.addEventListener('ds:feedback', ({ detail }) => save(messageId, detail.value, detail.reasons, detail.comment));
const thumbs = DS.feedback.create(el);    // or DS.core.get(el, 'feedback'): the same controller
thumbs.set('up');                         // shows a stored choice; no ds:feedback
thumbs.get();                             // { value: 'up' }
DS.feedback.toggle('up', 'up');           // null: a second press turns it off
DS.feedback.asks('down', 'both');         // true: the dialog opens for this value
```

`DS.feedback.create(el)` returns the controller: `get()`, `set(value)`, `on(type, fn)` for `change` and `feedback`
(the unsubscribe) and `destroy()`. `DS.feedback.toggle(current, pressed)` and `DS.feedback.asks(value, when)` are the
rules as pure functions.

**Accessibility.** The pair is a named `role="group"`; each button has a name and `aria-pressed`. The dialog follows the
dialog's contract: focus moves into it and returns to the thumb. The thanks are announced once.

**Forced colours.** The pressed button is `Highlight` / `HighlightText` (the button's toggle model) and its thumb stays
filled.

**Hooks**: none of its own; the buttons read the button's.

**Motion.** The thumb fills on `--ds-dur-fast` (`.ds-icon--fillable`); the dialog opens and closes through
`DS.overlay`.

<!-- changelog -->
- Feedback (3.0, new): `.ds-feedback` (`__label`, `__status`) and `DS.feedback` (`data-ds-feedback`,
  `data-ds-feedback-value`, `-reason`, `-reason-for`, `-lock`; `create`, `toggle`, `asks`): thumbs as exclusive toggles,
  `ds:change` and `ds:feedback`, an optional reason dialog. String `feedbackThanks`.
