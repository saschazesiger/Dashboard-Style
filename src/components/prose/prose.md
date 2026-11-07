## Prose and code

Rendered rich text (Markdown through [Markdown](#markdown), a help article, a release note). A `pre` in it is a
[Code block](#code-block).

```html
<div class="ds-prose">
  <h2>Before you start</h2>
  <p>Back up the device and note its <strong>asset tag</strong>. See <a href="/help/backup">backups</a>.</p>
  <ul><li>Charger</li><li>Docking station</li></ul>
  <blockquote><p>Devices older than four years are retired, not repaired.</p></blockquote>
  <pre><code>ds-cli retire LAPTOP-0042</code></pre>
  <table><thead><tr><th>Model</th><th>Years</th></tr></thead><tbody><tr><td>Laptop 14</td><td>4</td></tr></tbody></table>
  <hr>
  <p>Ask <mark>IT support</mark> when in doubt, or press <kbd>Ctrl</kbd> <kbd>K</kbd>.</p>
  <ul>
    <li><label><input type="checkbox" disabled checked> Charger packed</label></li>                  <!-- a task list -->
    <li><label><input type="checkbox" disabled> Label printed</label></li>
  </ul>
  <div class="ds-prose__callout ds-tone-warning" role="note">                                         <!-- a callout -->
    <p class="ds-prose__callout-title">[icon alert 16]Warning</p>
    <p>Retiring a device erases it.</p>
  </div>
  <h2 id="setup"><a class="ds-prose__anchor" href="#setup">Setup[icon link 16]</a></h2>             <!-- a heading anchor -->
  <p>Retired after four years.<sup class="ds-prose__fnref"><a href="#fn-1" id="fnref-1" aria-describedby="fn-label">1</a></sup></p>
  <section class="ds-prose__footnotes" aria-labelledby="fn-label">                                    <!-- footnotes -->
    <h2 class="ds-sr" id="fn-label">Footnotes</h2>
    <ol><li id="fn-1"><p>The policy of the IT department.
      <a class="ds-prose__fnback" href="#fnref-1" aria-label="Back to reference 1">[icon cornerUpLeft 16]</a></p></li></ol>
  </section>
</div>

<div class="ds-prose ds-prose--compact"> ... </div>                                                   <!-- a chat bubble -->
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-prose--dense` | the prose | the body role instead of the reading role, the same hierarchy (in a card, a side sheet) |
| Variant | `.ds-prose--compact` | the prose | for a chat bubble or a narrow panel: the body role, every heading at that size in the label weight, blocks `--ds-space-1` apart, less padding in quotes, callouts, code and table cells |
| Tone | `.ds-tone-*` | `.ds-prose__callout` | the tint and its ink; always with `.ds-prose__callout-title`, a word and an icon |
| Density | `.ds-density-*` | the prose or an ancestor | 1px per step off the gap between blocks, 2px off the padding of quotes, callouts, code ([Code block](#code-block)) and table cells (`.ds-prose--compact`, tight already: 1px, and a cell keeps its side padding); the text stays. A density class on one block changes that block, not the gap above it |
| Shape | `.ds-shape-*` | the prose or an ancestor | multiplies the radius of quotes, callouts, inline code, `kbd`, `mark` and code blocks |
| Size, touch | not read | | text keeps its role; the only targets are links in text and read-only checkboxes |

- `.ds-prose` styles only bare elements inside it, under `:where(.ds-prose)`, so any class of the page wins over what
  it sets and an element with a class that starts with `ds-` keeps its component's look (a class that merely contains
  those letters, such as `needs-review`, is the page's own): the
  margins reset, then one gap of `--ds-prose-gap` (`--ds-space-2`) between blocks and `--ds-space-5` above a
  heading; `h1` headline, `h2` subtitle, `h3` and `h4` the label weight at the reading size; lists indented
  `--ds-space-5` with `--ds-space-1` between items; `strong` in `--ds-prose-strong-weight` (the label weight); links
  underlined like every link; a `pre` is a code block ([Code block](#code-block)); a `table` gets hairline rows, a
  `--ds-text-2` head and tabular figures and scrolls sideways when it is wider, and a cell's `data-align="start"`,
  `"center"` or `"end"` aligns it (DS.markdown writes a GFM table's alignment so); a `blockquote` is a
  `--ds-surface-high` block on `--ds-radius-card`; images are never wider than the text; inline `code` is a chip in the
  text's size, a `kbd` a key (the code font in a hairline box, as `.ds-kbd`), a `mark` sits on the tint (`--ds-accent`,
  `--ds-on-accent`). Font `--ds-prose-font` (`--ds-font-reading`); `.ds-prose--dense` takes
  `--ds-font-body` (in a card, a side sheet). Long words hyphenate where the browser can (progressive:
  `hyphenate-limit-chars`, only words of 18 characters or more), else break.
- Task lists: a list item that starts with a checkbox (the input directly in the `<li>`, or in its first `<p>` or
  `<label>`, as Markdown renderers write them) loses its bullet and takes the checkbox in the bullet's place,
  drawn like a `.ds-checkbox` in `--ds-primary`, without its motion; wrapped lines stay in line with the text. Name each
  checkbox with a `<label>` around it: a bare input has no name. Rendered text is read-only unless the page wires it, so
  `disabled` does not dim the box here: it is how Markdown says read-only, and the state must read.
- Callouts: `.ds-prose__callout` with `.ds-prose__callout-title` (an icon and a word) and a tone
  (`.ds-tone-info`, `-success`, `-warning`, `-error`, on the callout itself; without one the quote's surface, also
  inside an element with a tone): the block takes `--ds-tone-container` and `--ds-on-tone-container`, bare links in it
  the same ink, still underlined; a component in it keeps its look. The word says what it is, so meaning never rests on
  the colour.
- Footnotes: `.ds-prose__footnotes`, the meta role in `--ds-text-2` under a hairline, with a hidden heading that names
  it (`.ds-sr`, `aria-labelledby`). A reference is `<sup class="ds-prose__fnref"><a>`: the caption role, a figure that
  leaves the line height alone, described by that heading (`aria-describedby`); each note ends with a
  `.ds-prose__fnback` link back (`aria-label` "Back to reference 1", a `cornerUpLeft` icon). The note a reference jumped
  to (`:target`) takes the tint, so the eye finds it.
- Heading anchors: `<h2 id="setup"><a class="ds-prose__anchor" href="#setup">Setup[icon link 16]</a></h2>`. The heading's
  text links to the heading, so the heading's name stays its text and the link adds no extra stop; it keeps the
  heading's look (no colour, no underline), and the icon (`aria-hidden`) fades in while the heading is hovered or the
  link holds the focus (`--ds-dur-fast`, out on `--ds-dur-instant`; opacity only, nothing moves).
- Under `.ds-base` bare headings take the type roles already (`h1` headline, `h2` subtitle, `h3` to `h6` the label
  role, no margins); `.ds-prose` keeps a reading hierarchy for rendered text.
- Keyboard and names: links and checkboxes are native, each with a ring on `:focus-visible` (heading anchors, footnote
  links); a code block that can scroll needs `tabindex="0"` and a name ([Code block](#code-block)).
- Forced colours: quotes and callouts keep their edge (a transparent outline the forced colours paint); a task box takes
  `Highlight` / `HighlightText` when checked, a `CanvasText` edge when not; a `mark` takes `Mark` / `MarkText`; a `kbd`
  keeps its border. Print: tables wrap; anchor icons go.
- Hooks: `--ds-prose-gap`, `--ds-prose-font`, `--ds-prose-strong-weight`, `--ds-prose-radius`
  ([theming.md](theming.md#component-hooks)).
