## Diff view

What changed in one or more files, from unified diff text (`git diff`, `git show`, `diff -u`): each file with its
header and counts, hunk headers, two line-number gutters and the changed words marked, unified or side by side, long
runs of unchanged lines folded.

```html
<div class="ds-diff" data-ds-diff data-ds-diff-view="unified" aria-label="Changes in this ticket">
  <pre class="ds-diff__source">diff --git a/src/sync.js b/src/sync.js
--- a/src/sync.js
+++ b/src/sync.js
@@ -1,5 +1,6 @@ export function sync(device) {
 import { fetch } from './net.js';
-const RETRIES = 2;
+const RETRIES = 3;
...</pre>
</div>
```

The page writes the diff text into `.ds-diff__source`; `DS.init()` parses it and renders the files next to it
(`.ds-diff__files`, the component's own), and hides the source. Without the script the source reads as a plain code
block. A page that re-renders with `DS.dom.morphHtml` and changes the text gets the new diff rendered; the folds the
person opened stay open while the text stays the same.

**What it shows.**

- A **file header** (`.ds-diff__head`) per file: a disclosure button (`.ds-diff__toggle`, `aria-expanded`) that
  folds the whole file, the path as a heading (`.ds-diff__name`; a rename shows `old → new`), a status word
  (`.ds-diff__status`: New file, Deleted, Renamed, Copied, Binary) and the counts (`.ds-diff__stat`, one
  `.ds-diff__count` per kind: `+12 −3`, and "12 added, 3 removed" for screen readers). The path is a
  `.ds-diff__path`; a rename shows the old one as `.ds-diff__path--old`, then an arrow (`.ds-diff__arrow`). The
  header sticks while its file scrolls under it, at `--ds-diff-sticky-top`.
- The **body** (`.ds-diff__body`) holds the file's `.ds-diff__table`, whose `.ds-diff__cols` row names the columns
  for screen readers only.
- **Large files**: a file with more than 1,000 lines in its hunks (a lockfile, generated code) starts folded, its
  header and counts showing; its table renders once the reader opens it with the toggle. A folded file renders no
  rows, and opening or folding a file, a fold or the lines loaded between hunks renders that file alone; the word
  marks of a line pair are computed once per text.
- **Hunk headers** (`.ds-diff__hunk`, its content in `.ds-diff__hunk-head`): the range (`@@ -1,5 +1,6 @@`,
  `.ds-diff__range`) and the section git names after it (`.ds-diff__section`, a function).
- **Lines** (`.ds-diff__line`) with two gutters in the unified view, old and new line number (`.ds-diff__num`), a
  sign (`.ds-diff__sign`: `+` added, `−` removed, with the hidden words "Added" and "Removed") and the code
  (`.ds-diff__code`). Every cell carries `data-kind` (`add`, `del`, `ctx`; `empty` for the blank side of a split row).
  Numbers and signs are generated content: selecting lines copies only the code.
- **Word marks**: a removed line and the added line that replaces it (the first removal of a block against the first
  addition, and so on) mark the words that changed, `<del class="ds-diff__word">` and `<ins class="ds-diff__word">`.
  Two lines that share less than about a third of their text are a rewrite and get no marks.
- **Folds** (`.ds-diff__fold`): a run of unchanged lines that would hide at least four lines beyond the context on
  each side becomes a button, "Show 14 unchanged lines" (`.ds-diff__expand`); pressing it shows them, moves the focus
  to the first of them and says how many came.
- "No newline at end of file" follows its line as a row of its own (`.ds-diff__note`).
- A binary file, or a file with no hunks (a pure rename), shows a line of text instead (`.ds-diff__empty`). So does
  text with no file at all ("No changes").

| Attribute | Option | What |
|---|---|---|
| `data-ds-diff` | | marks the view; its `.ds-diff__source` holds the text |
| `data-ds-diff-view` | `view` | `unified` (default), `split` (old on the left, new on the right; long lines wrap), or `auto`: split from `--ds-diff-split-min` (720px) of the view's own width, else unified |
| `data-ds-diff-context` | `context` | the unchanged lines kept around a change before the rest folds (default 3); `all` never folds |
| `data-ds-diff-lang` | `language` | the language of every file for the highlighter (default: each file's extension) |
| `data-ds-diff-heading` | `heading` | the level of the file headings, 2 to 6 (default 3) |
| `.ds-diff--wrap` | | long lines wrap in the unified view too (the split view always wraps) |

The view writes `data-view` (`unified` or `split`, the one in force) on the element and on each table.

**Options** ([options.md](options.md)): classes on the view or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Density | `.ds-density-*` | the lines and the file headers | 1px of block padding per step off each line (rows 24, 22, 20, 20px), 2px off the header's |
| Size | `.ds-xs` ... `.ds-xl` | the lines; the header's buttons by their own rules | 1px of block padding per step on each line; the code keeps its role (`--ds-diff-font`) |
| Shape | `.ds-shape-*` | each file block and the word marks | the corners times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the header's and the folds' buttons | they reach the touch target; the lines are no targets |
| Tone | | | not read: the kinds of change are its colours, each with its sign and word |

**Syntax highlighting.** The code of each line goes through a highlighter, `fn(code, language)` returning the markup
of that line (escaped by the highlighter; the view takes it as it comes, since the page chose it). The word marks are
laid over that markup by character. Which one applies:

```js
DS.diff.highlighter((code, language) => myHighlighter(code, language));   // the page's, for every view
DS.diff.create(el, { highlight: false });                                // none for this view
```

1. the view's own `highlight` option (`false`: none);
2. the page's, set once with `DS.diff.highlighter(fn)` (it renders every live view again; `null` takes it away);
3. `DS.highlight.highlight` when the page loads the system's highlighter through `ds.js`;
4. else the code stays plain text.

Each line is highlighted on its own, so a construct that spans lines (a block comment) is coloured line by line.

**Lines above a hunk.** The lines a diff leaves out between two hunks (or above the first) are not in its text. A page
that can fetch them passes `load`: the hunk header then offers them (an icon button named "Show 34 unchanged lines"),
and `load({ file, path, from, to })` (old-side line numbers, inclusive) returns the lines, or a promise of them. They
show as unchanged lines in front of the hunk, the focus moves to the first of them, and they never fold again. A load
that fails says "That did not work. Try again." and keeps the button.

```js
const view = DS.diff.create(el, {
  text,                                       // or the .ds-diff__source inside
  view: 'auto',
  context: 3,
  load: ({ path, from, to }) => fetch(`/files/${path}?from=${from}&to=${to}`).then((response) => response.json()),
});
view.set({ view: 'split' });                  // or new text: view.set(nextText)
view.get();                                   // { text, view, mode, files }
view.expand();                                // opens every fold
view.on('change', ({ view, text }) => {});    // also a bubbling ds:change on the element
view.on('expand', ({ file, count }) => {});   // also ds:expand
```

`DS.diff.create` returns the controller (`get`, `set`, `expand`, `on`, `refresh`, `destroy`); the attribute path makes
the same one (`DS.core.get(el, 'diff')`). The data behind it is public for a page that shows changes its own way:

- `DS.diff.parse(text)`: the files, each `{ oldPath, newPath, path, status, binary, additions, deletions, hunks }`, a
  hunk `{ oldStart, oldLines, newStart, newLines, section, lines }`, a line `{ kind, text, old, new, noNewline }`.
  Lines before the first file (a commit message) are left out; `\r\n` reads as `\n`.
- `DS.diff.words(before, after)`: the changed ranges of two versions of a line, `{ removed, added }` (each a list of
  `[start, end)`), or `null` for a rewrite or very long lines.
- `DS.diff.rows(file, { view, context, expanded })`: the rows a view shows, folds included.
- `DS.diff.highlighter(fn)`: above.

**Accessibility.** Each file is a section (unnamed, so not a landmark of its own) under its heading; its toggle is a
disclosure button named by the heading. The table has column headers for screen readers (old line, new line, change, code; in the split view before
and after), and each changed line says "Added" or "Removed" through its sign cell, so the kind never rests on colour.
The body of each file is a focusable region named by the file (the one landmark per file) that scrolls sideways with the arrow keys (`Tab`
reaches it, then the next file's toggle). A fold's button opens its lines, the first of them takes the focus (a ring
inside the row) and the count is announced politely ("14 more lines shown").

**Forced colours.** The fills go; the signs and the hidden words stay, inserted words are underlined and removed
words struck through, and a hunk row keeps a rule above it. The focus ring is the system's.

**Hooks**: `--ds-diff-bg`, `--ds-diff-add-bg`, `--ds-diff-del-bg`, `--ds-diff-add-word`, `--ds-diff-del-word`,
`--ds-diff-hunk-bg`, `--ds-diff-radius`, `--ds-diff-font`, `--ds-diff-sticky-top` and `--ds-diff-split-min` (720px;
px, rem or em), the width from which `data-ds-diff-view="auto"` shows the split view ([theming.md](theming.md)). The script writes
`--ds-diff-digits` (the digits of the highest line number) on each table, so the gutters fit the numbers.

**Motion.** None of its own: a file's chevron turns with `.ds-chevron`, and a fold opens in one step (the rows
appear, the focus follows).

<!-- changelog -->
- Diff view (`.ds-diff`, `DS.diff`): unified diff text parsed into files with headers, +/- counts, hunk headers, two
  line-number gutters, word-level marks, folded unchanged lines with their buttons, unified, split and auto views, a
  highlighter hook (`DS.diff.highlighter`, or `DS.highlight` from `ds.js`) and the lines between hunks through a
  `load` callback. Files above 1,000 lines start folded and render when opened. New strings `diffAdded`, `diffRemoved`, `diffStats`, `diffFileAdded`, `diffFileDeleted`,
  `diffFileRenamed`, `diffFileCopied`, `diffFileBinary`, `diffBinary`, `diffNoChanges`, `diffUntitled`,
  `diffNoNewline`, `diffExpandOne`, `diffExpand`, `diffShownOne`, `diffShown`, `diffOldLine`, `diffNewLine`,
  `diffChange`, `diffCode`, `diffOldCode`, `diffNewCode`.
