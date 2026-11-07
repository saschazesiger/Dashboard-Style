## Log viewer

A long or live log (a device's output, a build, a job run) that stays light at 100,000 lines: only the lines near the
viewport are in the page. ANSI colours map to theme roles, each level shows an icon and a word, and the reader can
filter by level, search with next and previous, wrap long lines, hide the timestamps, copy one line or a range, and
follow new lines as they arrive with a "Latest" pill to come back to the end.

```html
<div class="ds-logview" data-ds-logview aria-label="Log of device 42">
  <pre class="ds-logview__source">2026-11-04T09:00:01.120Z INFO  Device 42 started (firmware 3.2.1)
2026-11-04T09:00:02.348Z WARN  Battery at 15%
2026-11-04T09:00:05.902Z ERROR Sync failed: timeout after 8000 ms
    at sync (src/devices/sync.js:31)
...</pre>
</div>
```

The page writes the text into `.ds-logview__source`; `DS.init()` reads it, renders the view next to it and hides the
source. Without the script the source reads as a plain block of text. Lines that arrive later go through
`append()`; a page that re-renders the source with more text at its end gets the new lines appended, other text
starts the log again. That holds for a re-render of the page around the view with `DS.dom.morphHtml` too: the bar and
the scroller carry `data-ds-keep`, and the source's `hidden` and the element's `data-wrap` and `data-time` are owned
state, so the morph leaves the view as it is and patches only the source.

**What it shows** (rendered by the script; the page writes none of it):

- The **bar** (`.ds-logview__bar`): the search (`.ds-logview__find`: a `.ds-search` field `.ds-logview__search`,
  the count `.ds-logview__found`, "3 of 12", previous and next match, and "Only matching lines"), the view tools
  (`.ds-logview__tools`: wrap, timestamps and copy, icon buttons with `aria-pressed` where they toggle) and the
  filters (`.ds-logview__filters`): a filter chip per level that occurs (`.ds-chips.ds-logview__levels`, each
  `.ds-logview__chip` with the level's icon `.ds-logview__glyph`, its word and its count `.ds-logview__tally`; shown
  once two levels occur), and the line count (`.ds-logview__count`, "120 of 4,000 lines" while a filter hides lines).
- The **lines** (`.ds-logview__scroller` around the listbox `.ds-logview__lines`): each `.ds-logview__line` has its
  number (`.ds-logview__num`, not selectable or copied), its time (`.ds-logview__time`), its level
  (`.ds-logview__level`: an icon and the word `.ds-logview__word`) and its text (`.ds-logview__text`), with the
  ANSI runs as `.ds-logview__ansi` and the search matches as `<mark class="ds-logview__match">`
  (`.ds-logview__match--current` for the one the count names). Error and fatal lines lie on an error tint, warnings
  on a warning tint; the icon and the word say the level, never the colour alone.
- The **"Latest" pill**: a `.ds-jump` with a `.ds-presence` around an elevated button, through
  `DS.dom.followEnd()`. While the reader is at the end, new lines keep the view there; scrolling up lets go and
  shows the pill; pressing it goes back to the end and follows again. Pressed from the keyboard, the focus moves to
  the last line (the pill hides at once).
- `.ds-logview__empty`: "No lines yet", or "No line matches the filters".

**Lines.** A timestamp at the start (ISO 8601 such as `2026-11-04T09:00:01.120Z`, a time of day `09:00:01`, a
syslog date `Nov  4 09:00:01`, bracketed or not) and the level after it (`[ERROR]`, `<warn>`, `ERROR`, `error:`) are
read off the text and shown in their columns; a level as a field (`level=error`, `"level":"error"`) counts and stays
in the text. A word that could start a sentence ("Error connecting") is no level unless it is bracketed, upper
case or followed by a colon. Level words: fatal (`fatal`, `crit`, `critical`, `panic`, `emerg`, `alert`), error
(`error`, `err`, `severe`), warn (`warn`, `warning`), info (`info`, `notice`), debug (`debug`, `dbg`, `fine`),
trace (`trace`, `verbose`, `finest`). A line with neither a stamp nor a level continues the line before it (a stack
trace): it takes that line's level for the filter and the tint, without an icon of its own. A carriage return keeps
what came after it (a progress bar that redrew itself).

**ANSI.** SGR escapes colour the text: the eight colours (`30`-`37`, bright `90`-`97`, and 256 or true colours, which
take the nearest of the eight) read `--ds-logview-black` ... `--ds-logview-white`, whose defaults are theme roles, so
every theme and both schemes keep them readable; backgrounds (`40`-`47`, `100`-`107`) are that colour at a fifth
over the ground; bold, dim, italic, underline, strike and inverse are words of `data-sgr`. Every other escape
(cursor moves, titles) is dropped. On a span: `data-fg`, `data-bg` (a colour name), `data-sgr`.

| Attribute | Option | What |
|---|---|---|
| `data-ds-logview` | | marks the view; its `.ds-logview__source` holds the text |
| `data-ds-logview-follow` | `follow` | `off`: no following and no pill (a finished log) |
| `data-ds-logview-wrap` | `wrap` | long lines wrap (default: one line each, the view scrolls sideways) |
| `data-ds-logview-time` | `time` | `time` (default: the time of day), `full` (the stamp as written) or `off` (no column) |
| `data-ds-logview-limit` | `limit` | lines kept (default 100000; `0`: no limit): past it the oldest tenth goes at once, so a log at its limit does not shift on every line |
| `data-ds-logview-tools` | `tools` | `off`: no bar (the API still works) |
| `data-ds-logview-store` | `store` | a `DS.store` namespace that remembers wrap and timestamps; read once, when the view starts |

A change of one of the other attributes (or of `aria-label`, the name of the lines) applies that option alone: the
wrap and timestamps the reader chose stay until `data-ds-logview-wrap` or `data-ds-logview-time` itself changes.

The view writes `data-wrap` and `data-time` on the element, `data-level` on the lines and chips, and the runtime
properties `--ds-logview-chars`, `--ds-logview-digits`, `--ds-logview-time-chars` and `--ds-logview-level-chars` on
the lines, so the columns line up.

**Options** ([options.md](options.md)): classes on the view or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Density | `.ds-density-*` | the lines and the bar | 1px of block padding per step off each line (rows 24, 22, 20, 20px), 2px off the bar's |
| Size | `.ds-xs` ... `.ds-xl` | the lines; the bar's controls by their own rules | 1px of block padding per step on each line; the text keeps its role (`--ds-logview-font`) |
| Shape | `.ds-shape-*` | the frame and the match marks | the corners times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the bar's buttons, chips and field, and the pill | they reach the touch target; the lines stay compact |
| Tone | | | not read: the levels are its colours, each with its icon and word |

Under a width of 30rem (a container query) the level word hides (it is still read), the search takes a row of its
own and the chips scroll sideways.

```js
const log = DS.logview.create(el, { lines: text, follow: true, limit: 50000, store: 'device-log' });
socket.onmessage = (event) => log.append(event.data);       // text, or a list of lines or { text, level, time }
log.set({ query: 'timeout', levels: ['fatal', 'error', 'warn'], wrap: true, time: 'full' });
log.get();                         // { count, shown, query, levels, only, wrap, time, selected, lines }
log.copy();                        // the selected lines that show, else the active one
log.find('next');                  // or 'previous'
log.latest();                      // back to the end, following again
log.clear();
log.on('change', ({ query, levels, shown, count }) => {});  // also ds:change on the element
log.on('select', ({ lines }) => {});                        // also ds:select
log.on('copy', ({ text, count }) => {});                    // also ds:copy
```

`DS.logview.create` returns the controller (`get`, `set`, `append`, `clear`, `copy`, `find`, `latest`, `on`,
`update`, `destroy`); the attribute path makes the same one (`DS.core.get(el, 'logview')`). `append()` batches what
arrives within a frame, so a fast stream costs one render per frame. A line given as an object takes its `level`
and `time` (a `Date` or a timestamp is formatted through `DS.format.absolute`) from there. The data is public too:

- `DS.logview.parse(line)`: `{ time, level, text, segments }`, the stamp as written, the level, the message and its
  ANSI runs.
- `DS.logview.ansi(text)`: the runs of a text, each `{ text, fg, bg, bold, dim, italic, underline, strike, inverse }`.

**Search.** The search finds text in the messages, case-insensitive, as it is typed; the count says how many and
which ("3 of 12"). Enter or F3 goes to the next match, Shift+Enter to the previous (or the buttons); the line of the
match turns active and scrolls into view, sideways too. "Only matching lines" hides the others. Escape in the field
clears it first.

**Copy.** A click selects a line, Shift+click a range, Ctrl or Cmd+click one more; a second click on the only
selected line lets it go. Ctrl+C (Cmd+C) or the copy button copies the selected lines that show, else the active
line, as plain text: the lines as written, without the ANSI codes and without the line numbers. A text selection
the reader dragged over the lines is the browser's own copy and leaves the line selection alone. The copy is
announced ("Copied 3 lines").

**Accessibility.** The lines are a multi-select listbox named by the view's `aria-label` (APG listbox): one tab stop,
the arrow keys, Home, End, PageUp and PageDown move through the lines (`DS.virtual`, which tells their place with
`aria-setsize` and `aria-posinset`); Space selects or lets go of a line, Shift+arrow and Shift+Space select a range,
Ctrl+Shift+Home and End select to an end, Ctrl+A selects every line that shows, Escape clears the selection, Ctrl+C
copies and Ctrl+F goes to the search. ArrowDown in the search goes to the lines. Each line's name is its time, its
level word and its text. The search field is described by its count; a filter, a copy and a match are announced
politely. New lines are not announced one by one (a log is no live region: it would talk over everything); the
count in the bar shows them.

**Forced colours.** The tints go; the icon and the word stay. A selected line is `SelectedItem` with its bar, a match
`Mark` and the current match `Highlight`; the focus ring is the system's.

**Hooks**: `--ds-logview-height`, `--ds-logview-bg`, `--ds-logview-radius`, `--ds-logview-font`,
`--ds-logview-error-bg`, `--ds-logview-warn-bg`, `--ds-logview-match`, `--ds-logview-match-current` and the ANSI
colours `--ds-logview-black`, `--ds-logview-red`, `--ds-logview-green`, `--ds-logview-yellow`, `--ds-logview-blue`,
`--ds-logview-magenta`, `--ds-logview-cyan`, `--ds-logview-white` ([theming.md](theming.md)).

**Motion.** The "Latest" pill comes and goes with `.ds-presence`; following the end is a scroll (smooth within one
screen, else at once). Lines arrive in place, without motion.

<!-- changelog -->
- Log viewer (`.ds-logview`, `DS.logview`): a windowed log (`DS.virtual`, 100,000 lines by default) with ANSI colours
  on theme roles (hooks `--ds-logview-black` ... `--ds-logview-white`), levels read from the text with an icon and a
  word, level filter chips with counts, search with a count and next and previous, "Only matching lines", wrap,
  timestamps (time of day, full or none), copy of a line or a range (a multi-select listbox), follow mode with the
  "Latest" pill (`DS.dom.followEnd`), `append()` batched per frame, `DS.logview.parse` and `DS.logview.ansi`. New
  strings `logName`, `logFatal`, `logError`, `logWarn`, `logInfo`, `logDebug`, `logTrace`, `logLevels`, `logSearch`,
  `logSearchPlaceholder`, `logPrevious`, `logNext`, `logMatch`, `logMatchesOne`, `logMatches`, `logOnlyMatches`,
  `logWrap`, `logTimestamps`, `logCopyLine`, `logCopyLines`, `logCopiedOne`, `logCopied`, `logSelected`,
  `logLinesOne`, `logLines`, `logShown`, `logEmpty`, `logNoneShown`, `logLatest`, `logFollowing`.
