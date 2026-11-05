## Reasoning disclosure

An assistant's thinking, collapsed under one summary line: "Thinking" with the [shimmer](#shimmer) while it runs,
"Thought for 12s" (or the page's own summary) once it is done; the thoughts are a press away. It is a plain
[disclosure](#disclosure), so its summary presses, focuses and opens like one.

```html
<details class="ds-collapsible ds-disclosure ds-reasoning" data-ds-reasoning
         data-ds-reasoning-since="2026-11-05T09:00:00Z" data-ds-reasoning-auto>
  <summary>
    <span class="ds-reasoning__icon"><!-- sparkle, 18px --></span>
    <span class="ds-reasoning__summary"></span> <time class="ds-reasoning__time"></time>
    <!-- chevronDown, 20px, class ds-chevron -->
  </summary>
  <div class="ds-disclosure__body ds-reasoning__body">
    <div class="ds-reasoning__text" tabindex="0" aria-label="Thoughts">
      <p>The request asks which laptops leave warranty this year.</p>
      <p>Forty laptops; eleven end before March.</p>
    </div>
  </div>
</details>
```

| Part | What |
|---|---|
| `.ds-reasoning__icon` | optional: a glyph before the line, hidden from assistive tech |
| `.ds-reasoning__summary` | the line. Leave it empty and the module writes it: `Thinking` (the string `reasoningRunning`) with the shimmer while it runs, `Thought for 12s` (`reasoningDone`) at the end. A summary of the page's own stays, with the shimmer while it runs |
| `.ds-reasoning__time` | optional: the time while it runs; at the end the total, only beside a summary of the page's own |
| `.ds-reasoning__body` | on the `.ds-disclosure__body`: the room above the thoughts |
| `.ds-reasoning__text` | the thoughts: quiet body type on a rail, scrolling past `--ds-reasoning-max-height`. Give it `tabindex="0"` and a name, so the keyboard can scroll it. While it runs it stays at its end as thoughts come in (`DS.dom.followEnd()`); scrolling up lets go |

**Behaviour** (`data-ds-reasoning`, `DS.init()`; a change of an attribute is read again):

| Attribute | What |
|---|---|
| `data-ds-reasoning-since` | when it started: a date text or a timestamp in ms (default: when the module found it) |
| `data-ds-reasoning-done` | present: it ended; a value in ms is the total time. The module writes `data-state` (`running`, `done`) |
| `data-ds-reasoning-auto` | open while it runs, close at the end, unless the reader opened or closed it meanwhile |

```js
const thinking = DS.reasoning.create(details, { since: Date.now(), auto: true });   // or DS.core.get(details, 'reasoning')
thinking.set({ done: true });                                          // 'Thought for 12s'
thinking.set({ summary: 'Compared the warranty of 40 laptops' });      // the page's own line ('' gives it back)
thinking.get();                                                        // { done, elapsed, open }
thinking.on('change', (state) => {});                                  // also ds:change on the element
DS.reasoning.summaryText(12000, true);                                 // 'Thought for 12s'
```

**Options.** The summary is the plain disclosure's: size (8px of height per step and its type), density (4px of
height per step, and 2px of room above the thoughts), shape (its radius, the press morph) and touch (its target). Tone
is not read: it shows no meaning.

**Accessibility.** The summary is the disclosure's button (Tab, Enter or Space); its name is the line and the time.
The line is no live region: the reply that follows says the result, and a page that wants the end spoken announces
it. The shimmer's copy is left out of the name.

**Forced colours.** The rail stays (a border); the line keeps its words and the shimmer's copy goes.

**Hooks.** `--ds-reasoning-max-height` (320px), `--ds-reasoning-rail` (`--ds-line`)
([theming.md](theming.md#component-hooks)).

**Motion.** The disclosure's (the body opens as a `.ds-collapsible`, the chevron turns), the shimmer on the running
line; with `data-ds-reasoning-auto` it opens when it starts and closes when it ends.

<!-- changelog -->
- Reasoning disclosure (`.ds-reasoning`, `DS.reasoning`, `data-ds-reasoning`): thinking collapsed under a summary line
  ("Thinking" with the shimmer, then "Thought for 12s" or the page's own), the thoughts following their end while they
  stream, an optional auto open and close. Strings `reasoningRunning`, `reasoningDone`.
