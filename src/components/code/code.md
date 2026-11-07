## Code block

A block of code or a raw request, alone or in a frame with its file or language, a copy button, a wrap toggle, line
numbers, marked lines, tabs for several files and a height that folds long code behind "Show more". Highlighting comes
from [Syntax highlighting](#syntax-highlighting).

```html
<!-- a block alone: give it tabindex="0" and a name when it can scroll -->
<pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1
Accept: application/json</code></pre>
<pre class="ds-code-block ds-code-block--wrap"><code>...</code></pre>                <!-- long lines wrap -->

<!-- the frame: header, numbered lines, marked lines, folded after 12 lines -->
<figure class="ds-code ds-code--lines" data-ds-code data-ds-code-max="12">
  <div class="ds-code__head ds-sm">
    <span class="ds-code__title">device.json</span>
    <span class="ds-code__lang"></span>
    <span class="ds-code__actions">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-code-wrap aria-pressed="false" aria-label="Wrap lines" data-tip="Wrap lines">[icon wrapText 20]</button>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-copy aria-label="Copy code" data-tip="Copy code">
        <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon copy 20]</span><span class="ds-icon-swap__b">[icon check 20]</span></span>
      </button>
    </span>
  </div>
  <pre class="ds-code-block" tabindex="0" data-ds-code-lang="json" data-ds-code-mark="3,5-6"><code>{ ... }</code></pre>
  <div class="ds-code__foot">
    <button class="ds-btn ds-btn--text" type="button" data-ds-code-expand aria-expanded="false">
      <span class="ds-code__expand-label">Show more</span>[icon chevronDown 20, class ds-chevron]
    </button>
  </div>
</figure>

<!-- several files: a tablist in the header, a block per file -->
<figure class="ds-code" data-ds-code>
  <div class="ds-code__head ds-sm">
    <div class="ds-tabs ds-tabs--flush" role="tablist" aria-label="Files">
      <button class="ds-tabs__tab" role="tab" type="button" id="f-json" aria-selected="true" aria-controls="b-json" data-label="device.json">device.json</button>
      <button class="ds-tabs__tab" role="tab" type="button" id="f-sh" aria-selected="false" aria-controls="b-sh" tabindex="-1" data-label="retire.sh">retire.sh</button>
    </div>
    <span class="ds-code__lang"></span>
    <span class="ds-code__actions"> ... copy button ... </span>
  </div>
  <pre class="ds-code-block" id="b-json" role="tabpanel" aria-labelledby="f-json" tabindex="0" data-ds-code-lang="json"><code>...</code></pre>
  <pre class="ds-code-block" id="b-sh" role="tabpanel" aria-labelledby="f-sh" tabindex="0" data-ds-code-lang="sh" hidden><code>...</code></pre>
</figure>
```

| Class | What |
|---|---|
| `.ds-code-block` | the block: the code role on `--ds-code-bg` in the card radius (`--ds-code-block-radius`, times `--ds-shape`), one line per line (`white-space: pre`, tab size 2), scrolling sideways with a thin scrollbar; a `code` inside loses the inline chip. A `pre` in `.ds-prose` looks the same. No margin of its own outside prose; in prose the prose's gap spaces it |
| `.ds-code-block--wrap` | long lines wrap instead of scrolling |
| `.ds-code` | the frame on `--ds-code-bg` in the same radius; the blocks inside give up their own corners |
| `.ds-code--lines` | numbers the lines in a gutter as wide as the largest number (`--ds-text-2`, never selected or copied) |
| `.ds-code__head` | the header: a hairline under it; put `.ds-sm` on it so its controls stay a step under the text |
| `.ds-code__title` | a file name: the code role, one line with an ellipsis |
| `.ds-code__lang` | the language of the block shown (DS.code writes it: the block's `data-ds-code-label`, else its language) in the meta role and `--ds-text-2`; hidden without one |
| `.ds-code__actions` | the buttons at the header's end (quiet icon buttons) |
| `.ds-code__line` | a line (DS.code writes them, `data-line` its number) |
| `.ds-code__line--mark` | a marked line: a `<mark>` with a 10% `--ds-primary` tint and a 2px bar at its start, so it never rests on the colour |
| `.ds-code__line--inserted`, `.ds-code__line--deleted` | the `+` and `-` lines of a diff: a tint of `--ds-code-inserted` or `--ds-code-deleted`; the sign stays |
| `.ds-code__foot`, `.ds-code__expand-label` | the foot with the button that unfolds a folded block, and its words ("Show more", "Show less"); a fade lies over the last folded lines. Without `data-state` (nothing to fold) the foot is gone |

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Wrap | `.ds-code-block--wrap` | a block (DS.code sets it on every block of a frame from the wrap toggle) | long lines wrap |
| Line numbers | `.ds-code--lines` | the frame | the gutter |
| Density | `.ds-density-*` | any container | 2px per step off the block's padding (1px in `.ds-prose--compact`), the lines and the gutter with it; the header's tabs take their own density |
| Shape | `.ds-shape-*` | any container or the theme | the radius of the block and the frame |
| Touch | `.ds-touch` | the theme or a container | the header's tabs and buttons grow to the touch target, and the header with them |
| Size, tone | not read | | the code keeps its role; code states no status |

### Behaviour: `data-ds-code`

| Attribute | On | Effect |
|---|---|---|
| `data-ds-code` | the frame (or a lone `pre`) | DS.code renders every `pre.ds-code-block` in it as lines, highlighted when the block names a language; the value is the language for blocks that name none |
| `data-ds-code-lang` | a `pre` (or its `code`) | the block's language (a `language-<x>` class on the `code` works too) |
| `data-ds-code-label` | a `pre` | the word the header shows for it instead of the language |
| `data-ds-code-start` | a `pre` or the frame | the number of the first line (default 1) |
| `data-ds-code-mark` | a `pre`, or the frame of one block | the lines to mark, as shown: `3`, `2,4-6` |
| `data-ds-code-max` | the frame | fold a block longer than this many lines (`data-state="collapsed"`, written by the system) |
| `data-ds-code-wrap` | a button in the frame | the wrap toggle: `aria-pressed`, every block wraps; without a name it gets the strings' `wrapLines` ("Wrap lines") |
| `data-ds-code-remember` | the frame | a key: the wrap choice is kept under it (`DS.store`, namespace `code`) |
| `data-ds-code-expand` | a button in `.ds-code__foot` | unfolds and folds (`aria-expanded`, `aria-controls`); its `.ds-code__expand-label` says `showMore` / `showLess` |
| `data-ds-copy` | a button in the header | the copy button (`DS.copy`, the Copy button component): DS.code points it at the code of the block shown (`#<id>`), so it copies the source (line numbers are no text) |
| `data-state` | the frame, written by the system | `collapsed` or `expanded` while a block is longer than `data-ds-code-max` |

The code's text stays the source: each line keeps its line break, the numbers are generated content. A `role="tablist"`
in the header switches the blocks: each tab's `aria-controls` names its `pre` (`role="tabpanel"`, `aria-labelledby` the
tab); the arrow keys, `Home` and `End` move and select, the indicator glides, the block swaps in. A block without a
name takes its tab, the title or the language as its `aria-labelledby`.

### JS API

```js
const code = DS.code.create(figure);            // or DS.core.get(figure, 'code') on the attribute path
code.set('{ "id": 43 }');                       // new source for the block shown, rendered (ds:change { code, index })
code.get();
code.select(1);                                 // the second file (ds:select { index, panel })
code.expand(true);                              // unfold (ds:expand { expanded })
code.wrap(true);                                // wrap (ds:wrap { wrap })
code.refresh();                                 // after the page changed a block's data-ds-code-* attributes or lines
code.on('select', ({ index }) => { /* ... */ });
DS.code.parseLines('2,4-6');                    // Set { 2, 4, 5, 6 }
DS.code.linesHtml(source, { language: 'json', start: 1, marks: new Set([2]) });   // the lines' markup, for a server or a test
```

`DS.code.create(el, { code })` returns the controller (`get`, `set`, `on`, `select`, `expand`, `wrap`, `refresh`,
`destroy`); `DS.code.parseLines` and `DS.code.linesHtml` are the pure functions behind it.

### Accessibility

- A block that can scroll is a stop (`tabindex="0"`) with a name: an inset ring on `:focus-visible`, solid from the first
  frame; the arrow keys scroll it. In a frame it is named by its tab, the title or the language.
- The wrap toggle is a toggle button (`aria-pressed`), the expand button a disclosure (`aria-expanded`,
  `aria-controls`); give icon buttons `aria-label` and `data-tip`.
- Tabs follow the ARIA tabs pattern with automatic activation. A marked line is a `<mark>`, and its bar shows it beside
  the tint.
- Copy: the copy button (`DS.copy`) says "Copied" to screen readers.

**Forced colours.** The block and the frame keep their edges (a transparent outline the forced colours paint; in a
frame the frame is the edge, and a focused block keeps its ring), the header its hairline; a marked line keeps its bar, in `Highlight`; the tokens take the text colour.

**Motion.** The fold glides: the block's height (a named exception, `meta.json`) opens over `--ds-dur-medium` on
`--ds-ease-out` and folds over `--ds-dur-base` on `--ds-ease-in`, set by DS.code from the height it has, so a reversal
continues; the fade follows on `--ds-dur-fast`, the chevron turns. A tab's block swaps in (`DS.motion.enter`, `swap`)
and the tabs' indicator glides.

**Print.** Blocks wrap and unclip; a folded block unfolds.

**Runtime properties.** DS.code writes `--ds-code-digits` (the width of the largest line number, in digits) on a block
and `--ds-code-max` (the folded lines) on the frame; read them, never set them.

**Hooks.** `--ds-code-block-radius` ([theming.md](theming.md#component-hooks)); the colours are the roles
`--ds-code-bg` and the code roles of [Syntax highlighting](#syntax-highlighting).
