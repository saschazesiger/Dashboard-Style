## Prose and code

Rendered rich text (Markdown, a help article, a release note) and blocks of code.

```html
<div class="ds-prose">
  <h2>Before you start</h2>
  <p>Back up the device and note its <strong>asset tag</strong>. See <a href="/help/backup">backups</a>.</p>
  <ul><li>Charger</li><li>Docking station</li></ul>
  <blockquote><p>Devices older than four years are retired, not repaired.</p></blockquote>
  <pre><code>ds-cli retire LAPTOP-0042</code></pre>
  <table><thead><tr><th>Model</th><th>Years</th></tr></thead><tbody><tr><td>Latitude 7440</td><td>4</td></tr></tbody></table>
  <hr>
  <p>Ask <mark>IT support</mark> when in doubt.</p>
</div>

<pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1
Accept: application/json</code></pre>
```

- `.ds-prose` styles only bare elements inside it, under `:where(.ds-prose)`, so any class of the page wins: the
  margins reset, then one gap of `--ds-prose-gap` (`--ds-space-2`) between blocks and `--ds-space-5` above a
  heading; `h1` headline, `h2` subtitle, `h3` and `h4` the label weight at the reading size; lists indented
  `--ds-space-5` with `--ds-space-1` between items; `strong` in `--ds-prose-strong-weight` (the label weight); links
  underlined like every link; a `pre` is a code block; a `table` gets hairline rows, a `--ds-text-2` head and tabular
  figures and scrolls sideways when it is wider; a `blockquote` is a `--ds-surface-high` block on `--ds-radius-card`;
  images are never wider than the text. Font `--ds-prose-font` (`--ds-font-reading`); `.ds-prose--dense` takes
  `--ds-font-body` (in a card, a chat bubble, a side sheet). Long words hyphenate where the browser can (progressive:
  `hyphenate-limit-chars`, only words of 18 characters or more), else break.
- `.ds-code-block`: the code role on `--ds-code-bg` in the card radius, one line per line (`white-space: pre`, tab
  size 2), scrolling sideways with a thin scrollbar. Give it `tabindex="0"` and a name (`aria-label`) only when it can
  scroll sideways, so a keyboard reaches it (an inset ring). A `code` inside loses the inline chip.
  `.ds-code-block--wrap` wraps long lines instead.
- Under `.ds-base` bare headings take the type roles already (`h1` headline, `h2` subtitle, `h3` to `h6` the label
  role, no margins); `.ds-prose` keeps a reading hierarchy for rendered text.
- Forced colours: quotes and code blocks keep their edge. Print: code blocks and tables wrap.

