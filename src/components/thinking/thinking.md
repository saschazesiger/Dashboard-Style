## Thinking indicator

What an assistant or an agent is doing right now, while it works: the step it is on (a [wheel](#wheel) line with the
[shimmer](#shimmer)), its current thought, how long it has been at it and how many tokens it used. It stays in the
background: a new step rolls in and is spoken once; the time and the tokens tick quietly.

```html
<div class="ds-thinking" data-ds-thinking="Reading the device list"
     data-ds-thinking-since="2026-11-05T09:00:00Z" data-ds-thinking-tokens="1240">
  <span class="ds-thinking__icon"><!-- sparkle, 20px --></span>
  <span class="ds-thinking__step" aria-live="polite"><span class="ds-wheel"></span></span>
  <span class="ds-thinking__meta"><time class="ds-thinking__time"></time><span class="ds-thinking__tokens"></span></span>
  <p class="ds-thinking__thought">Comparing the warranty dates of 40 devices</p>
</div>
```

| Part | What |
|---|---|
| `.ds-thinking__icon` | optional: a glyph before the step, in `--ds-thinking-icon-color`; the module hides it from assistive tech |
| `.ds-thinking__step` | the step: a `.ds-wheel` the module rolls (made when missing), its line a `.ds-shimmer` while it works. Make it the polite live region (`aria-live="polite"`), so each new step is spoken once |
| `.ds-thinking__meta` | the elapsed time (`.ds-thinking__time`, a `<time>` gets an ISO 8601 `datetime`) and the tokens (`.ds-thinking__tokens`), quiet and tabular, joined by a dot; an empty one takes no room |
| `.ds-thinking__thought` | optional: the current thought, two lines at most, cut with an ellipsis |

The meta follows the step on its line; when both do not fit, the meta wraps under the step (a narrow column, a
phone). The icon hangs before the first line, so what wraps lines up with the step.

**Behaviour** (`DS.init()`; a change of an attribute is read again):

| Attribute | What |
|---|---|
| `data-ds-thinking` | the step |
| `data-ds-thinking-since` | when it started: a date text or a timestamp in ms (default: when the module found it) |
| `data-ds-thinking-tokens` | the tokens used so far: `1.2K tokens` (the strings `tokensOne`, `tokensOther`) |
| `data-ds-thinking-done` | present: it ended, the time stops, the shimmer goes, and `data-state="done"` is written; a value in ms is the total time |

The time shows whole seconds, narrow (`12s`, `1m 5s`), on the page's one clock (`DS.format.clock()`), and stops at the
end. The module writes the step, the time and the tokens; the page writes the thought, or `set({ thought })`.

```js
const status = DS.thinking.create(el, { step: 'Thinking', since: Date.now() });   // or DS.core.get(el, 'thinking')
status.set({ step: 'Running npm test', tokens: 2048, thought: 'Comparing versions' });
status.set({ done: true });                       // the time stops; set({ done: true, total: 12000 }) gives it
status.get();                                     // { step, thought, tokens, elapsed, done }
status.on('change', (state) => {});               // also ds:change with the state, after a set() that changed something
DS.thinking.elapsedText(65000);                   // '1m 5s'
DS.thinking.tokensText(1240);                     // '1.2K tokens'
DS.thinking.isoDuration(65000);                   // 'PT1M5S'
DS.thinking.sinceOf('2026-11-05T09:00:00Z');      // a timestamp in ms, or null
```

Exports: `DS.thinking.create(el, options)` (the controller), `DS.thinking.elapsedText(ms)` (the time as the line shows it), `DS.thinking.isoDuration(ms)` (the `datetime` of its `<time>`), `DS.thinking.tokensText(count)` (the compact count, string `tokensOne` / `tokensOther`) and `DS.thinking.sinceOf(value)` (a start as a timestamp: a number, a `Date` or an ISO string).

`set()` drives it from the page and never writes the attributes: use one path per indicator.

**Options.**

| Option | Classes | Effect |
|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the step's type (`--ds-size-font`) and the icon, 4px per step; the meta and the thought keep their roles |
| Density | `.ds-density-*` | the room between the parts, 2px per step |
| Shape, tone, touch | | not read: it is no target and shows no meaning of its own (an error is the message's) |

**Accessibility.** Only the step is a live region, so a screen reader hears each new step once and never the ticking
time. Say the state in the words ("Thinking", "Running npm test", "Done"); the shimmer carries no meaning.

**Forced colours.** The icon takes `CanvasText`; the shimmer's copy goes, the text stays.

**Hooks.** `--ds-thinking-font`, `--ds-thinking-gap` (`--ds-space-2`, the base the density applies to),
`--ds-thinking-icon-color` ([theming.md](theming.md#component-hooks)).

**Motion.** The wheel's turn and the shimmer's travel; nothing else moves.

<!-- changelog -->
- Thinking indicator (`.ds-thinking`, `DS.thinking`, `data-ds-thinking`): the step on a wheel with the shimmer, the
  thought, the elapsed time and the tokens. Strings `tokensOne`, `tokensOther`.
