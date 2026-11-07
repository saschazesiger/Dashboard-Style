## Tool call

One call an assistant or agent made (a command, a search, a request to an API), as a row that opens: its name and
arguments, its status with a word and how long it took; opened, its input, its output and the calls it made itself.
It is a [disclosure](#disclosure) row in a frame, so it presses, focuses and opens like one.

```html
<div class="ds-toolcall-list">
  <details class="ds-collapsible ds-disclosure ds-disclosure--row ds-toolcall" data-status="done"
           data-ds-toolcall data-ds-toolcall-duration="1240">
    <summary>
      <span class="ds-toolcall__icon"><!-- terminal, 20px --></span>
      <span class="ds-disclosure__title ds-toolcall__title">
        <span class="ds-toolcall__name">run_tests</span> <span class="ds-toolcall__args">npm test -- devices</span>
      </span>
      <span class="ds-toolcall__status"><span class="ds-toolcall__mark"><!-- checkCircle, 16px --></span><span class="ds-toolcall__word">Done</span></span>
      <time class="ds-toolcall__time"></time>
      <!-- chevronDown, 20px, class ds-chevron -->
    </summary>
    <div class="ds-disclosure__body ds-toolcall__body">
      <div class="ds-toolcall__part">
        <p class="ds-toolcall__label">Input</p>
        <pre class="ds-toolcall__code" tabindex="0" aria-label="Input"><code>{ "script": "test", "filter": "devices" }</code></pre>
      </div>
      <div class="ds-toolcall__part">
        <p class="ds-toolcall__label">Output</p>
        <pre class="ds-toolcall__code" tabindex="0" aria-label="Output"><code>42 passing (1s)</code></pre>
      </div>
    </div>
  </details>
</div>
```

| Part | What |
|---|---|
| `.ds-toolcall-list` | optional: calls one under the other, `--ds-space-2` apart |
| `.ds-toolcall__icon` | the tool's glyph, quiet |
| `.ds-toolcall__name` | the tool's name, in the code type |
| `.ds-toolcall__args` | a one-line summary of the arguments, quiet, cut with an ellipsis |
| `.ds-toolcall__status` | the status: `.ds-toolcall__mark` (the spinner or a 16px glyph) and `.ds-toolcall__word` (the word) |
| `.ds-toolcall__time` | the duration, tabular; a `<time>` gets an ISO 8601 `datetime` |
| `.ds-toolcall__body` | on the `.ds-disclosure__body`: the parts, `--ds-space-3` apart (2px per density step) |
| `.ds-toolcall__part`, `.ds-toolcall__label` | a labelled block of the body: input, output, a diff |
| `.ds-toolcall__code` | the input or output in the code type, scrolling past `--ds-toolcall-code-max-height`. Give it `tabindex="0"` and a name (`aria-label`), so the keyboard can scroll it. A code block of the system may stand in its place |
| `.ds-toolcall__part--error` | an output that failed: its label and edge in `--ds-error` (the word of the status says so too) |
| `.ds-toolcall__calls` | the calls this one made: rows on a rail under the icon, without a frame of their own |

**Status** (`data-status`, always an icon and a word, never colour alone):

| `data-status` | Mark | Word (the page's) |
|---|---|---|
| `pending` | hourglass | "Waiting", "Needs approval" |
| `running` | the spinner (`.ds-spinner`) | "Running" |
| `done` | check in a circle, `--ds-success` | "Done" |
| `failed` | alert circle; mark and word in `--ds-error` | "Failed" |
| `cancelled` | ban | "Cancelled" |

**Behaviour** (`data-ds-toolcall`, `DS.init()`; a change of one of these attributes is read again, so a page that
re-renders the row with `DS.dom.morphHtml` just writes them):

| Attribute | What |
|---|---|
| `data-status` | the status above |
| `data-ds-toolcall-since` | when it started: a date text or a timestamp in ms. While it runs, the time ticks every second (`DS.format.clock()`) |
| `data-ds-toolcall-duration` | the duration in ms, once known; it wins over `since`. Without it, an ended call shows the time it ran until it ended |
| `data-ds-toolcall-announce="off"` | no announcement |

The time shows the milliseconds under a second (`240ms`), else whole seconds, narrow (`12s`, `1m 5s`). When a call
turns from pending or running to done, failed or cancelled, it says so once through `DS.a11y.announce()`: the string
`toolStatus` (`{name}: {status}`) with its name and its word, so a closed row needs no live region.

```js
const call = DS.toolcall.create(row, { status: 'running', since: Date.now() });   // or DS.core.get(row, 'toolcall')
call.set({ status: 'done', label: 'Done', duration: 1240 });   // data-status, the mark, the word, the time
call.get();                                                   // { status: 'done', duration: 1240 }
call.on('change', ({ status, duration }) => {});              // also ds:change on the row, after a set() that changed the status
DS.toolcall.durationText(240);                                // '240ms'
DS.toolcall.STATUSES;                                         // ['pending', 'running', 'done', 'failed', 'cancelled']
```

Exports: `DS.toolcall.create(el, options)` (the controller), `DS.toolcall.durationText(ms)` (the duration as the summary shows it) and `DS.toolcall.STATUSES` (the statuses `data-status` takes).

`set()` writes the mark (the spinner, or `hourglass`, `checkCircle`, `alertCircle`, `ban` of `DS.icons`) and the word:
the `label`, or without one the status's own (strings `toolPending`, `toolRunning`, `toolDone`, `toolFailed`,
`toolCancelled`: `Pending`, `Running`, `Done`, `Failed`, `Cancelled`). A page that renders the row writes them in its
markup; one that changes only `data-status` gets the mark, and the word unless it wrote its own with it.

**Options.**

| Option | Classes | Effect |
|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the summary's height (8px per step) and type; the code keeps its role |
| Density | `.ds-density-*` | the summary's height (4px per step) and the room of the body (2px per step) |
| Shape | `.ds-shape-*` | the frame's and the code's corners |
| Touch | `.ds-touch` | the summary is at least `--ds-touch-target` high |
| Tone | | not read: the status shows the meaning, with its word |

A row narrower than 360px (each row is its own container) lets the time go; the arguments are cut shorter.

**Accessibility.** The summary is the disclosure's button: Tab reaches it, Enter or Space opens and closes it, and its
name is its text (name, arguments, status word, time: keep a space between the parts in the markup, so they are read
apart); the icon, the mark and the chevron are hidden. The code blocks
take focus to scroll by keyboard. The end of a call is announced once.

**Forced colours.** The frame and the code's edges stay; the icon and the mark take `CanvasText`, every status keeps
its word, and the spinner takes its system colours.

**Hooks.** `--ds-toolcall-height` (40px), `--ds-toolcall-radius` (`--ds-radius-card`),
`--ds-toolcall-code-max-height` (240px), `--ds-toolcall-code-bg` (`--ds-surface-low`)
([theming.md](theming.md#component-hooks)). It sets the disclosure's `--ds-disclosure-row-height` and
`--ds-disclosure-row-padding` on its rows.

**Motion.** The disclosure's: the body opens as a `.ds-collapsible` and the chevron turns. A new status swaps its
mark at once.
