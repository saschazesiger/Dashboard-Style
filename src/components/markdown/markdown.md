## Markdown

Renders Markdown into [Prose](#prose-and-code) safely: a small renderer of the CommonMark subset a dashboard needs,
plus GFM tables, task lists, strikethrough and autolinks, footnotes and callouts. No HTML passes through. A page with
needs of its own plugs in its own sanitiser or renderer.

```html
<!-- rendered by DS.init() from its text; until then the text keeps its line breaks -->
<div class="ds-prose" data-ds-markdown data-ds-markdown-anchors>
## Before you start
Back up the device and note its **asset tag**.
</div>

<!-- a chat message: line breaks kept, code blocks with a copy button -->
<div class="ds-prose ds-prose--compact" data-ds-markdown data-ds-markdown-breaks data-ds-markdown-code="block">
Run `ds-cli retire` with the asset tag.
</div>
```

The source may also sit in a `script` element of the type `text/markdown` inside the element, where `<` and `&` need
no escaping.

```js
DS.markdown.render('# Retire\nBack up **first**.');                 // '<h1 id="retire">Retire</h1>\n<p>Back up <strong>first</strong>.</p>'
const answer = DS.markdown.create(bubble, { source: '', breaks: true, code: 'block' });
answer.set(answer.get() + chunk);                                    // a streamed answer: patched in place (DS.dom.morphHtml)
DS.markdown.use({ sanitize: (html) => DOMPurify.sanitize(html) });  // the page's sanitiser, on every render
DS.markdown.use({ renderer: (source) => marked.parse(source), sanitize: (html) => DOMPurify.sanitize(html) });
DS.markdown.slug('Before you start');                                // 'before-you-start'
```

**What it writes** (the bare markup `.ds-prose` styles):

| Markdown | Markup |
|---|---|
| `#` to `######`, or a line of `===` / `---` under text | `h1` to `h6` with an `id` from the text (`slug`, numbered `-1`, `-2` ... until it is unique among every id of the render, the system's own included); with `anchors` the text links to the heading (`.ds-prose__anchor`), and links, autolinks and footnote references inside it are written as their text (a link holds no other link) |
| text, a blank line between paragraphs | `p`; a line break is a space, two spaces or `\` before it a `<br>` (with `breaks` every one is) |
| `**strong**`, `*em*`, `_em_`, `~~gone~~`, `` `code` `` | `strong`, `em`, `del`, `code` (CommonMark's delimiter rules: `snake_case_words` stay words) |
| `- item`, `* item`, `+ item`, `1. item` (or `1)`), nested by indent | `ul`, `ol` (`start` from the first number); tight lists without `p`, loose ones with |
| `- [ ] todo`, `- [x] done` | a task item: `<label><input type="checkbox" disabled> text</label>`, read-only |
| `> quote` | `blockquote` |
| `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` | a `.ds-prose__callout` in the tone info, success, primary, warning or error, with its icon and word (`calloutNote` ...) |
| ```` ```js ```` ... ```` ``` ````, `~~~`, four spaces | `<pre tabindex="0" aria-label="js"><code class="language-js">` (a block can scroll: a stop named by its language, else `codeBlock`, "Code"), highlighted by [Syntax highlighting](#syntax-highlighting) (the page's own highlighter too); with `code: 'block'` a [Code block](#code-block) frame with the language and a copy button (its lines written as DS.code renders them, so a streamed render patches nothing back, and a frame DS.code already runs is refreshed after each render) |
| `***`, `---`, `___` | `hr` |
| a GFM table, `:--`, `:-:`, `--:` | `table` with `thead` and `tbody`, the alignment as `data-align="start|center|end"` |
| `[text](https://example.com "title")`, `[text][ref]`, `[ref]`, `[ref]: /path` | `a`; an external one with `rel="noopener"` (and `target`) |
| `![alt](https://example.com/a.png)` | `img` with `loading="lazy"` (only http, https or relative; `images: false` writes a link) |
| `<https://...>`, `<name@example.com>`, `www.example.com`, `https://...`, `name@example.com` | `a` |
| `text[^1]` and `[^1]: note` | a numbered `.ds-prose__fnref`, and the notes in a `.ds-prose__footnotes` with a hidden heading (`footnotes`) and a `.ds-prose__fnback` link back to each reference; ids by number (`fn-1`, `fnref-1`, `fnref-1-2`); in a link's text or an anchored heading the reference is its number alone |
| `<b>`, `<script>`, any HTML | text, escaped: shown as written |

**Safety.** Every character of the source is escaped in text and attributes. A link or image whose URL names any other
scheme than http, https and mailto (`javascript:`, `data:`, `vbscript:`, `file:`, also written with entities, control
characters, white space or capitals) is written as its text; relative and `#` links stay links. `schemes` widens the
list (`['http', 'https', 'mailto', 'tel']`). Ids take `idPrefix`, so two rendered texts on a page keep their footnotes
apart (the attribute path and `create()` give each element its own).

**Hostile input.** The renderer takes untrusted text (a chat answer, a ticket) in time linear in its length: scans
for a closing bracket, backtick run, quote or address stop where CommonMark's limits do (a label holds at most 999
characters, parentheses in a destination nest 32 deep) or remember that a first scan found no end. Quotes and lists
nest 100 deep; deeper markers are paragraph text, so no input overflows the stack.

**The hook for the page's own.** `sanitize(html)` runs on every result (the system's or the renderer's), `renderer(source)`
replaces the system's renderer; pass them per call or once for the page with `DS.markdown.use({ ... })`
(`DS.markdown.use(null)` clears it). A renderer's markup is the page's: without a sanitiser it is taken as it comes.

### Options

| Option | Attribute | Effect |
|---|---|---|
| `anchors` | `data-ds-markdown-anchors` | headings link to themselves (`.ds-prose__anchor`, an icon on hover and focus) |
| `breaks` | `data-ds-markdown-breaks` | every line break a `<br>` (a chat message) |
| `code` | `data-ds-markdown-code="block"` | fenced code in a `.ds-code` frame with its language and a copy button (`copyCode`) |
| `highlight` | | `false`: code stays plain |
| `images` | `data-ds-markdown-images="off"` | `false`: an image becomes a link to it |
| `idPrefix` | | before every id it writes |
| `headingOffset` | | added to every heading level (`1`: `#` writes `h2`), at most `h6` |
| `schemes`, `target`, `rel` | | the link schemes (default http, https, mailto), the target and rel of external links |
| `renderer`, `sanitize` | | the page's own (above) |

The look is the prose's: size, density, shape and tone are its options ([Prose](#prose-and-code)).

### Behaviour: `data-ds-markdown`

| Attribute | On | Effect |
|---|---|---|
| `data-ds-markdown` | the prose element | renders its text (de-indented), or a `<script type="text/markdown">` in it, into the element; a change of an option attribute renders again |
| `data-state="rendered"` | the element, written by the system | until it is set, `markdown.css` keeps the source's line breaks (`white-space: pre-line`), so the text reads without the module |

### JS API

`DS.markdown.render(source, options)` returns the markup; `DS.markdown.create(el, { source, ...options })` returns
the controller (`get`, `set`, `on('change')`, `destroy`) that the attribute path makes, rendering through
`DS.dom.morphHtml`, so `set()` patches only what changed (a streamed answer keeps its nodes, a selection and a focused
link); `ds:change` `{ source }` goes out on the element. `DS.markdown.use(defaults)` sets the page's defaults;
`DS.markdown.slug(text)` is the id a heading gets.

### Accessibility

Headings keep their levels (`headingOffset` fits them under the page's own); a heading anchor's name is the heading's
text, its icon hidden. Task boxes are disabled checkboxes named by their label. A footnote reference is a link
described by the hidden "Footnotes" heading; each note links back ("Back to reference 1"). A callout is
`role="note"` with its word. Images keep their alt text. Links are plain links: the system adds no extra tab stops.

**Forced colours, motion.** Those of [Prose](#prose-and-code) and [Code block](#code-block); the renderer adds none.

<!-- changelog -->
- Markdown (3.0): `DS.markdown` (`data-ds-markdown` with `-anchors`, `-breaks`, `-code`, `-images`; `render`,
  `create`, `use`, `slug`): a safe CommonMark subset with GFM tables, task lists, strikethrough and autolinks,
  footnotes and callouts, no HTML passthrough, links limited to http, https, mailto and relative URLs, the page's own
  sanitiser or renderer as a hook; linear time on hostile input, nesting capped at 100. Strings `copyCode`,
  `codeBlock`, `footnotes`, `footnoteBack`, `calloutNote`, `calloutTip`, `calloutImportant`, `calloutWarning`,
  `calloutCaution`.
