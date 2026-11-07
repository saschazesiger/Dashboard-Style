## Plan card

A plan an assistant or an agent proposes before it acts: what it will do, step by step, and the person's decision.
Nothing happens until someone approves; the card then says who decided what, and its steps can follow the work as
a [task list](#tasks).

```html
<section class="ds-plan" data-ds-plan aria-labelledby="plan-title">
  <div class="ds-plan__head">
    <span class="ds-plan__icon"><!-- clipboardCheck, 20px --></span>
    <h3 class="ds-plan__title" id="plan-title">Replace the swollen batteries</h3>
    <span class="ds-plan__state"></span>
  </div>
  <p class="ds-plan__lead">Three laptops, one ticket each. Nothing changes until you approve.</p>
  <ol class="ds-tasks ds-plan__steps" aria-label="Steps">
    <li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span>
      <span class="ds-tasks__text">Find the laptops with a battery ticket</span></li>
    <li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span>
      <span class="ds-tasks__text">Order three batteries</span></li>
  </ol>
  <div class="ds-plan__actions">
    <button class="ds-btn ds-btn--filled" type="button" data-ds-plan-action="approve">Approve</button>
    <button class="ds-btn" type="button" data-ds-plan-action="reject">Reject</button>
    <button class="ds-btn ds-btn--text" type="button">Edit the plan</button>
  </div>
  <p class="ds-plan__note">Proposed by the assistant at 09:12</p>
</section>
```

| Part | What |
|---|---|
| `.ds-plan__head` | an optional `.ds-plan__icon` (hidden from assistive tech by the module), the `.ds-plan__title` and the `.ds-plan__state`, which the module fills with a 16px `.ds-plan__glyph` and the word |
| `.ds-plan__lead` | optional: what the plan does and what it leaves alone |
| `.ds-plan__steps` | on a `.ds-tasks` list: the steps, `data-status="pending"` while it waits; once approved the page moves each step on (running, done, failed) as the work goes |
| `.ds-plan__actions` | the decision: one filled Approve (`data-ds-plan-action="approve"`), Reject (`data-ds-plan-action="reject"`) and any action of the page's own (Edit the plan) |
| `.ds-plan__note` | optional, quiet: who proposed or decided, and when |

**State** (`data-state`, written by the module; never colour alone):

| State | Shows |
|---|---|
| `waiting` | the hourglass and `Waiting for approval` (string `planWaiting`); the actions |
| `approved` | a check in a circle (`--ds-success`) and `Approved` (`planApproved`); the actions go |
| `rejected` | a crossed circle and `Rejected` (`planRejected`); the actions go and the steps turn quiet |

**Behaviour** (`data-ds-plan`, `DS.init()`). `data-ds-plan-state` gives the state of a plan rendered from history
(default `waiting`; a change is read again). A press on an action first emits `ds:decide` (cancelable, with
`{ decision }`): a page that calls `preventDefault()` keeps the plan waiting and decides later with `set()`, once its
own request went through (wrap the button in `DS.motion.busy()` meanwhile). Otherwise the card takes the state, writes
the word, lets the actions go (focus moves to the title first, which gets `tabindex="-1"`), announces the word and
emits `ds:change` with `{ state }`. Back to `waiting`, the actions come back.

```js
const plan = DS.plan.create(el);                 // or DS.core.get(el, 'plan')
el.addEventListener('ds:decide', (event) => {     // optional: decide after the server agreed
  event.preventDefault();
  send(event.detail.decision).then(() => plan.set(event.detail.decision));
});
plan.set('approved');                            // or 'rejected', 'waiting'; the verbs approve and reject count too
plan.get();                                      // { state: 'approved' }
plan.on('change', ({ state }) => {});            // also ds:change on the card
DS.plan.planState('approve');                    // 'approved'
DS.plan.PLAN_STATES;                             // ['waiting', 'approved', 'rejected']
```

Exports: `DS.plan.create(el, options)` (the controller), `DS.plan.planState(value)` (a state as the card takes it)
and `DS.plan.PLAN_STATES`.

**Options.**

| Option | Classes | Effect |
|---|---|---|
| Density | `.ds-density-*` | the padding and the room between the parts, 2px per step; the steps and the buttons follow their own |
| Shape | `.ds-shape-*` | the frame's corners; the buttons follow their own |
| Size, touch | `.ds-xs` ... `.ds-xl`, `.ds-touch` | the buttons and the steps follow their own; the title keeps its role |
| Tone | | not read: the state shows the meaning, with its word |

**Accessibility.** The card is a `<section>` named by its title (a region); the decision is two real buttons, so Tab and
Enter or Space work as everywhere. The state is a word next to its glyph, announced once when it changes; focus never
falls to the page when the actions go. Keep the step texts plain: they are what the person approves.

**Forced colours.** The frame keeps its border; the glyph follows the word's forced text colour; the word stays.

**Hooks.** `--ds-plan-padding` (`--ds-space-4`, the base the density applies to), `--ds-plan-radius`
(`--ds-radius-card`), `--ds-plan-bg` (`--ds-surface`), `--ds-plan-border` (`--ds-line`)
([theming.md](theming.md#component-hooks)).

**Motion.** Once decided, the actions leave (`DS.motion.leave()`, `.ds-leave`); back to waiting they enter
(`.ds-enter`). The word and the glyph change in place; the steps move as the task list does.

<!-- changelog -->
- Plan card (`.ds-plan`, `DS.plan`, `data-ds-plan`): a proposed plan with its steps (a `.ds-tasks` list) and the
  decision, approve or reject, with a cancelable `ds:decide`, the state as an icon and a word, announced. Strings
  `planWaiting`, `planApproved`, `planRejected`.
