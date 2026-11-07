## Syntax highlighting

Colours code by its syntax with the system's own small tokenizers (D13): `json`, `js` and `ts`, `sh`, `html` and
`xml`, `css`, `sql`, `yaml`, `go`, `py` and `diff`. A page that prefers its own highlighter plugs it in, and the colours
still come from the theme's code roles.

```html
<!-- highlighted by DS.init(): the element's text, in the language it names -->
<pre class="ds-code-block" tabindex="0" aria-label="Device"><code data-ds-highlight="json">{ "id": 42, "name": "LAPTOP-0042", "active": true }</code></pre>

<!-- the class a Markdown renderer writes works too (data-ds-highlight left empty) -->
<pre class="ds-code-block"><code class="language-sh" data-ds-highlight>ds-cli retire LAPTOP-0042 --force</code></pre>
```

DS.highlight writes the tokens as spans, each with one class:

| Class | Tokens | Role |
|---|---|---|
| `.ds-highlight__keyword` | `const`, `if`, `SELECT`, `@media` | `--ds-code-keyword` |
| `.ds-highlight__string`, `.ds-highlight__regex` | strings, template strings, regular expressions | `--ds-code-string` |
| `.ds-highlight__number`, `.ds-highlight__constant` | numbers, `true`, `null`, `None`, hex colours, entities | `--ds-code-number` |
| `.ds-highlight__comment` | comments | `--ds-code-comment` |
| `.ds-highlight__function`, `.ds-highlight__tag` | calls and definitions, a command (`sh`), a tag name | `--ds-code-function` |
| `.ds-highlight__type` | classes, built-in types, a CSS class or id selector, a YAML tag | `--ds-code-type` |
| `.ds-highlight__property`, `.ds-highlight__attribute`, `.ds-highlight__variable` | keys, CSS properties, attributes, options (`--force`), `$HOME` | `--ds-code-property` |
| `.ds-highlight__meta` | decorators, a doctype, a shell prompt, `---`, diff file and hunk headers | `--ds-code-meta` |
| `.ds-highlight__inserted`, `.ds-highlight__deleted` | the `+` and `-` lines of a diff | `--ds-code-inserted`, `--ds-code-deleted` |
| `.ds-highlight__punctuation` | brackets, commas, colons | `--ds-text-2` |
| `.ds-highlight__operator` | `=`, `=>`, `&&`, a pipe | the text colour |

| Language | Name | Aliases |
|---|---|---|
| JSON (comments allowed) | `json` | `jsonc`, `json5`, `webmanifest` |
| JavaScript | `js` | `javascript`, `mjs`, `cjs`, `jsx`, `node` |
| TypeScript | `ts` | `typescript`, `tsx`, `mts`, `cts` |
| Shell, a console session | `sh` | `bash`, `shell`, `zsh`, `console`, `shellsession`, `sh-session` |
| HTML (script and style inside in their own language) | `html` | `htm`, `xhtml`, `vue`, `svelte` |
| XML | `xml` | `svg`, `xsl`, `xslt`, `plist`, `rss`, `atom`, `xaml` |
| CSS | `css` | `scss`, `less` |
| SQL | `sql` | `psql`, `pgsql`, `postgres`, `postgresql`, `mysql`, `sqlite`, `plsql`, `tsql` |
| YAML | `yaml` | `yml` |
| Go | `go` | `golang` |
| Python | `py` | `python`, `python3`, `py3`, `pyi` |
| Unified diff | `diff` | `patch`, `udiff` |

**Options.** None: the tokens keep the size, weight and font of the code around them; size, density and shape are the
code block's. No tone: a colour of a token says nothing about status.

### Behaviour: `data-ds-highlight`

| Attribute | On | Effect |
|---|---|---|
| `data-ds-highlight` | a `code` (or any element) | highlights its text in place when `DS.init()` finds it: the value names the language (`json`, an alias), empty takes a `language-<x>` (or `lang-<x>`) class of the element; an unknown language leaves the text plain. A change of the value highlights again |

### JS API

```js
DS.highlight.tokenize('const a = 1;', 'js');      // [{ kind: 'keyword', text: 'const' }, { kind: null, text: ' a ' }, ...]
DS.highlight.highlight(code, 'json');             // escaped markup with the token spans, for a page that renders itself
DS.highlight.lines(code, 'py');                   // the same, one string per line: spans close and reopen at each break
DS.highlight.language('yml');                     // 'yaml'; null for a language no tokenizer knows
DS.highlight.languages();                         // ['css', 'diff', 'go', 'html', 'js', 'json', 'py', 'sh', 'sql', 'ts', 'xml', 'yaml']
DS.highlight.KINDS;                               // the token kinds, one class each
DS.highlight.register('ini', [['comment', /;[^\n]*/], ['property', /^[\w.]+(?=\s*=)/], ['string', /"[^"\n]*"/]], ['conf']);
DS.highlight.use((code, language) => hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : null);
const view = DS.highlight.create(el, { language: 'sql', code: 'SELECT 1' });   // the controller data-ds-highlight makes
view.set('SELECT id FROM devices');               // highlights the new code; ds:change { code, language }
view.get();
view.destroy();                                   // the plain text again
```

- `DS.highlight.tokenize(code, language)` covers every character of the code, in order: `kind` is one of
  `DS.highlight.KINDS` or `null` for plain text. An unknown language gives one plain token.
- `DS.highlight.highlight(code, language)` and `DS.highlight.lines(code, language)` escape every `&`, `<`, `>` and `"`
  of the code, so their markup is safe to render: only the token spans are markup. `lines()` splits at `\n` (and
  `\r\n`), so a code block can number and mark lines.
- `DS.highlight.register(name, rules, aliases)` adds a language or replaces one: `rules` is a list of `[kind, RegExp]`
  tried as one expression (the first rule that matches at the leftmost place wins); a kind may be a function
  `(text, state, index, end)` that returns a kind, `null` or a list of `[kind, text]` sub-tokens. Or pass a function
  `(code) => [kind, text][]` of your own.
- **The hook for an external highlighter**: `DS.highlight.use(fn)`, where `fn(code, language)` returns markup (taken
  as it comes: the page chose the highlighter and answers for its output) or `null` to leave the language to the
  system; `DS.highlight.use(null)` goes back. Give its token classes the code roles in the page's CSS
  (`.hljs-keyword { color: var(--ds-code-keyword); }`), so the theme still decides the colours. `lines()` splits its
  markup at the line breaks, closing and reopening the spans open there.
- `DS.highlight.create(el, { code, language })` returns the controller (`get`, `set`, `on('change')`, `destroy`);
  `destroy()` puts the plain text back.

**Speed.** One pass with one combined expression per language, linear in the code, long single lines included (it
also colours untrusted code, a `DS.markdown` answer): 2,000 lines of JavaScript take a few tens of milliseconds; the
code block (`DS.code`) renders only once per change.

**Accessibility.** Colour only: the code reads the same to a screen reader, and nothing in it is a stop of its own.
Every code role reaches 4.5:1 on `--ds-code-bg` in the light and the dark scheme, 7:1 under `themes/contrast.css`.

**Forced colours.** Every token takes the system's text colour, so the code reads as plain text; the `+` and `-` of a
diff stay.

**Roles.** `--ds-code-keyword`, `--ds-code-string`, `--ds-code-number`, `--ds-code-comment`, `--ds-code-function`,
`--ds-code-type`, `--ds-code-property`, `--ds-code-meta`, `--ds-code-inserted`, `--ds-code-deleted`, on
`--ds-code-bg` ([tokens.md](tokens.md)). A theme sets the roles, never the token classes.

<!-- changelog -->
- Syntax highlighting (3.0, D13): `DS.highlight` (`data-ds-highlight`; `tokenize`, `highlight`, `lines`, `language`,
  `languages`, `register`, `use`, `create`, `KINDS`) with tokenizers for json, js, ts, sh, html, xml, css, sql, yaml,
  go, py and diff; the token classes `.ds-highlight__*`; the colour roles `--ds-code-keyword`, `--ds-code-string`,
  `--ds-code-number`, `--ds-code-comment`, `--ds-code-function`, `--ds-code-type`, `--ds-code-property`,
  `--ds-code-meta`, `--ds-code-inserted`, `--ds-code-deleted` (light, dark and contrast values). Linear time, long single
  lines included.
