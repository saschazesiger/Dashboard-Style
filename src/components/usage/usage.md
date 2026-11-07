## Usage meter

What an assistant or an agent used against a budget: tokens, what they cost, or both, as a [meter](#charts) with its
figures. Near the budget and past it, a status with an icon and a word says so, and it is announced once.

```html
<section class="ds-usage" data-ds-usage data-ds-usage-used="182400" data-ds-usage-budget="250000"
         data-ds-usage-cost="3.12" data-ds-usage-cost-budget="5" data-ds-usage-currency="USD"
         aria-labelledby="usage-title">
  <div class="ds-usage__head">
    <h3 class="ds-usage__title" id="usage-title">Tokens this month</h3>
    <span class="ds-usage__status" hidden></span>
  </div>
  <span class="ds-meter ds-usage__meter" role="meter" aria-labelledby="usage-title"></span>
  <p class="ds-usage__figures"><span class="ds-usage__value"></span><span class="ds-usage__cost"></span></p>
  <p class="ds-usage__note">Resets on 1 December.</p>
</section>
```

| Part | What |
|---|---|
| `.ds-usage__head` | the `.ds-usage__title` and the `.ds-usage__status` (empty and `hidden` while the usage is comfortable; the module writes a 16px `.ds-usage__icon` and the word into it) |
| `.ds-usage__meter` | on a `.ds-meter` (role `meter`, named by the title): the share of the budget, its tone near and over it |
| `.ds-usage__figures` | the tokens (`.ds-usage__value`, `182.4K of 250K tokens`) and the cost (`.ds-usage__cost`, `$3.12 of $5.00`), tabular, on one line that wraps; leave out the one you do not show |
| `.ds-usage__note` | optional: when it resets, what the budget covers |
| `.ds-usage--inline` | one row: the title, the meter (at most `--ds-usage-inline-meter` wide) and the figures, for a composer's foot or a toolbar; it wraps when the row is too narrow |

**Behaviour** (`DS.init()`; a change of an attribute is read again):

| Attribute | What |
|---|---|
| `data-ds-usage-used` | the tokens used |
| `data-ds-usage-budget` | the token budget |
| `data-ds-usage-cost` | what they cost |
| `data-ds-usage-cost-budget` | the money budget |
| `data-ds-usage-currency` | ISO 4217 (default `USD`), formatted for the page's locale |
| `data-ds-usage-warn` | the share from which it is near the budget (default `0.8`) |
| `data-ds-usage-announce="off"` | no announcement when the state gets worse |

The share is the larger of the token share and the cost share (each only with its budget). The module writes it as
`--ds-share` on the meter with `aria-valuenow` (0 to 100) and `aria-valuetext` (`73% used`, past the budget `112%
used`), the figures, and `data-state="near"` (from the warn share) or `"over"` (past the budget) on the root. Then the
status shows an icon and the word (`Near the budget`, `Over budget`; strings `usageNear`, `usageOver`), the meter takes
`.ds-meter--warning` or `.ds-meter--error`, and the word is announced once when the state gets worse. Without a budget
there is no share and no status: the figures alone, the meter `hidden` (and without its values) until a budget comes.

```js
const usage = DS.usage.create(el, { used: 182400, budget: 250000, cost: 3.12, costBudget: 5 });   // or DS.core.get(el, 'usage')
usage.set({ used: 241000, cost: 4.1 });      // the meter glides; near the budget the status shows and is announced
usage.get();                                 // { used, budget, cost, costBudget, currency, share, state }
usage.on('change', (state) => {});           // also ds:change with the state, after a set() that changed something
DS.usage.shareOf({ used: 241000, budget: 250000 });   // 0.964
DS.usage.stateOf(0.964);                     // 'near'
DS.usage.usageText(182400, 250000);          // '182.4K of 250K tokens'
DS.usage.costText(3.12, 5, 'USD');           // '$3.12 of $5.00'
```

Exports: `DS.usage.create(el, options)` (the controller), `DS.usage.shareOf(values)` (the share of the budget, or
null), `DS.usage.stateOf(share, warn)` (`'ok'`, `'near'` or `'over'`), `DS.usage.usageText(used, budget)` and
`DS.usage.costText(cost, costBudget, code)` (the figures; string `usageOf`). `set()` drives it from the page and
never writes the attributes: use one path per meter.

**Options.**

| Option | Classes | Effect |
|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the meter's thickness, 1px per step (the meter's own); the type stays |
| Density | `.ds-density-*` | the room between the parts, 2px per step |
| Shape | `.ds-shape-*` | the meter's ends |
| Tone, touch | | not read: the status shows the meaning, with its word, and nothing in it is a target |

**Accessibility.** The meter is `role="meter"` named by the title, its value in words (`73% used`). The status is never
colour alone: an icon and a word, and the meter's tone only repeats it. Only a change for the worse is announced (once
per state), never the figures as they climb.

**Forced colours.** The meter takes its system colours; the icon follows the word's forced text colour and the word
stays.

**Hooks.** `--ds-usage-gap` (`--ds-space-2`, the base the density applies to), `--ds-usage-inline-meter` (160px)
([theming.md](theming.md#component-hooks)).

**Motion.** The meter's share glides on `--ds-ease-value` over `--ds-dur-glide` (the meter's own); the figures and
the status change in place.

<!-- changelog -->
- Usage meter (`.ds-usage`, `DS.usage`, `data-ds-usage`): tokens and cost against a budget on a meter, with an icon
  and a word near and over it (announced once). Strings `usageOf`, `usageShare`, `usageNear`, `usageOver`.
