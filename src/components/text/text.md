## Text utilities

How a run of text wraps, cuts and sets its figures: truncate, clamp, break, mono, tabular, balance.

```html
<span class="ds-truncate">A ticket subject that is cut with an ellipsis at the end of one line</span>
<h3><span class="ds-truncate">A heading cut on a line of its own</span></h3>
<p class="ds-clamp-2">A description that shows at most two lines, then an ellipsis.</p>
<p class="ds-clamp" style="--ds-clamp-lines: 7">At most seven lines.</p>
<code class="ds-break">sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</code>
<span class="ds-mono">SN 4C1-77Q</span>
<span class="ds-tabular">1,284</span>
<h2 class="ds-balance">Pair a new device with the console in three steps</h2>
<p class="ds-pretty">A paragraph that ends without a lone last word.</p>
<span class="ds-nowrap">512 GB</span>                 <!-- Utilities -->
```

| Class | Effect |
|---|---|
| `.ds-truncate` | one line, cut with an ellipsis at the end; an inline block at most as wide as its container, so it cuts a span in running text, a link or a cell, and a flex or grid item shrinks to fit (it takes `min-width: 0`); a heading or paragraph cut on a line of its own carries it on a span inside, so the block keeps its line |
| `.ds-clamp-1`, `.ds-clamp-2`, `.ds-clamp-3`, `.ds-clamp-4`, `.ds-clamp-5` | at most so many lines, then an ellipsis; a long word breaks anywhere; in a flex or grid row that stretches its items it keeps its own height (`align-self: start`), so no line shows past the ellipsis |
| `.ds-clamp` | the same for `--ds-clamp-lines` lines (2) |
| `.ds-break` | long tokens (hashes, URLs, serial numbers) break anywhere instead of widening their column |
| `.ds-mono` | the code family (`--ds-font-mono`) at the size of the text around it, without ligatures |
| `.ds-tabular` | figures of one width, so counts and times line up (`.ds-num` also aligns them to the end) |
| `.ds-balance` | lines of even length: headings, short leads |
| `.ds-pretty` | no lone last word: paragraphs (progressive, below) |
| `.ds-nowrap` | keeps a value and its unit together ([Utilities](#utilities)) |

- Cut text stays complete for everyone: the clipped text is still in the accessibility tree, but someone who reads
  the screen needs a way to the full text too, such as a tooltip (`data-tip` with the full text: a tip that repeats
  the visible text shows only while the text is cut, [Tooltip](#tooltip)), a details view or the page the item opens. A truncated link or row keeps its full name.
- Options: none read. The text keeps the type role of where it stands; size changes type through the components.
- Print: `.ds-truncate` and the clamps print in full (paper is as wide as it is).
- Forced colours: nothing of their own; the ellipsis is text.
- Progressive: `.ds-pretty` (`text-wrap: pretty`) wraps as usual where it is missing. `.ds-balance` is at the floor.
- Hooks: `--ds-clamp-lines` ([theming.md](theming.md#component-hooks)), on the element.

<!-- changelog -->
- Added: Text utilities, `.ds-truncate`, `.ds-clamp-1` to `.ds-clamp-5`, `.ds-clamp` (`--ds-clamp-lines`),
  `.ds-break`, `.ds-mono`, `.ds-tabular`, `.ds-balance` and `.ds-pretty`.
