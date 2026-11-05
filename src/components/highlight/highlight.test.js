/**
 * DS.highlight: the tokenizers of every language, the escaping, the line
 * split (also of an external highlighter's markup), aliases, registration
 * and the speed on 2,000 lines. The browser side is highlight.spec.js.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrast, pickLightDark, resolveColour } from '../../../scripts/tools/theme-rules.mjs';
import { KINDS, create, highlight, language, languages, lines, register, tokenize, use } from './highlight.js';

/** The tokens with a kind, as 'kind:text'. */
const marked = (code, lang) => tokenize(code, lang).filter((token) => token.kind).map((token) => `${token.kind}:${token.text}`);
const kindOf = (code, lang, text) => tokenize(code, lang).find((token) => token.text === text)?.kind ?? null;

describe('DS.highlight.tokenize', () => {
  it('covers every character in order, in every language', () => {
    const samples = {
      json: '{ "id": 42, "tags": [true, null, -1.5e3], "name": "a\\"b" }',
      js: 'const re = /a\\/b[/]c/g; let x = a / b / 2; // done\n`t ${x}`',
      ts: 'interface Device { id: number; name?: string }\ntype Id = string;',
      sh: '$ ds-cli retire LAPTOP-0042 --force # done\nexport FOO=bar',
      html: '<!doctype html>\n<div class="a" hidden>Hi &amp; bye<!-- c --></div><script>const a = 1;</script>',
      xml: '<?xml version="1.0"?><device id="42"><![CDATA[ x < y ]]></device>',
      css: '@media (min-width: 600px) { .card > a:hover { color: #fff; } }',
      sql: "SELECT id, COUNT(*) FROM devices WHERE name LIKE 'LAP%'; -- c",
      yaml: '---\nname: Device # c\nports:\n  - 80\nactive: true\n',
      go: 'func main() { x := 42; fmt.Println("hi", x, nil) }',
      py: '@dataclass\nclass Device(Base):\n    def name(self) -> str:\n        return f"x{self.id}"',
      diff: '--- a/x\n+++ b/x\n@@ -1 +1 @@\n-old\n+new\n context',
    };
    for (const [lang, code] of Object.entries(samples)) {
      const tokens = tokenize(code, lang);
      assert.equal(tokens.map((token) => token.text).join(''), code, lang);
      for (const token of tokens) assert.ok(token.kind === null || KINDS.includes(token.kind), `${lang}: ${token.kind}`);
      assert.ok(tokens.some((token) => token.kind), `${lang} finds tokens`);
    }
  });

  it('json: keys, strings, numbers, constants', () => {
    assert.deepEqual(marked('{"id": 42, "ok": true, "n": null, "s": "x"}', 'json'),
      ['punctuation:{', 'property:"id"', 'punctuation::', 'number:42', 'punctuation:,', 'property:"ok"', 'punctuation::', 'constant:true',
        'punctuation:,', 'property:"n"', 'punctuation::', 'constant:null', 'punctuation:,', 'property:"s"', 'punctuation::', 'string:"x"', 'punctuation:}']);
  });

  it('js: a regular expression after an operator, a division after a value', () => {
    assert.equal(kindOf('const re = /a\\/b/g;', 'js', '/a\\/b/g'), 'regex');
    assert.deepEqual(marked('a / b / c', 'js'), ['operator:/', 'operator:/']);
    assert.equal(kindOf('return /x/.test(s)', 'js', '/x/'), 'regex');
    assert.equal(kindOf('(a) / 2', 'js', '/'), 'operator');
  });

  it('js: keywords, calls, properties, types, constants and object keys by what stands around them', () => {
    const code = 'class A extends B { run() { this.items.push(new Device({ name: "x" })); return MAX_SIZE; } }';
    assert.equal(kindOf(code, 'js', 'class'), 'keyword');
    assert.equal(kindOf(code, 'js', 'A'), 'type');
    assert.equal(kindOf(code, 'js', 'run'), 'function');
    assert.equal(kindOf(code, 'js', 'this'), 'constant');
    assert.equal(kindOf(code, 'js', 'items'), 'property');
    assert.equal(kindOf(code, 'js', 'push'), 'function');
    assert.equal(kindOf(code, 'js', 'Device'), 'type');
    assert.equal(kindOf(code, 'js', 'name'), 'property');
    assert.equal(kindOf(code, 'js', 'MAX_SIZE'), 'constant');
    assert.equal(kindOf('obj.get(1); x = { get: 1 }', 'js', 'get'), 'function');
    assert.equal(kindOf('@Component class A {}', 'ts', '@Component'), 'meta');
  });

  it('js: comments and strings span lines; a template string is one string', () => {
    assert.deepEqual(marked('/* a\nb */ `x\n${y}`', 'js'), ['comment:/* a\nb */', 'string:`x\n${y}`']);
    assert.equal(kindOf('"unterminated', 'js', '"unterminated'), 'string');
  });

  it('ts: its own keywords and built-in types; type only as a declaration', () => {
    assert.equal(kindOf('interface A { id: number }', 'ts', 'interface'), 'keyword');
    assert.equal(kindOf('interface A { id: number }', 'ts', 'number'), 'type');
    assert.equal(kindOf('type Id = string;', 'ts', 'type'), 'keyword');
    assert.equal(kindOf('const type = 1;', 'ts', 'type'), null);
    assert.equal(kindOf('const interface_ = 1;', 'js', 'interface_'), null);
  });

  it('sh: the command, options, variables, strings, comments and a prompt', () => {
    assert.deepEqual(marked('$ ds-cli retire LAPTOP-0042 --force # done', 'sh'), ['meta:$', 'function:ds-cli', 'attribute:--force', 'comment:# done']);
    assert.equal(kindOf('echo "$HOME" | grep -v x', 'sh', 'grep'), 'function');
    assert.equal(kindOf('echo ${HOME}', 'sh', '${HOME}'), 'variable');
    assert.equal(kindOf('FOO=bar make', 'sh', 'FOO'), 'variable');
    assert.equal(kindOf('if true; then echo; fi', 'sh', 'then'), 'keyword');
    assert.equal(kindOf('echo a#b', 'sh', '#b'), null, 'a # inside a word is no comment');
    assert.equal(kindOf('echo then', 'sh', 'then'), null, 'a keyword only where a command stands');
  });

  it('html: tags in their parts, attributes, entities, comments; script and style in their own language', () => {
    assert.deepEqual(marked('<a href="/x" hidden>&amp;</a>', 'html'),
      ['punctuation:<', 'tag:a', 'attribute:href', 'punctuation:=', 'string:"/x"', 'attribute:hidden', 'punctuation:>', 'constant:&amp;', 'punctuation:</', 'tag:a', 'punctuation:>']);
    assert.equal(kindOf('<script>const a = 1;</script>', 'html', 'const'), 'keyword');
    assert.equal(kindOf('<style>a { color: red }</style>', 'html', 'color'), 'property');
    assert.equal(kindOf('<script>const a = 1;</script>', 'xml', 'const'), null, 'xml embeds nothing');
    assert.equal(kindOf('<!-- note -->', 'html', '<!-- note -->'), 'comment');
  });

  it('css: selectors, properties, values, at-rules, custom properties and pseudo-classes', () => {
    const code = '@media (min-width: 600px) { .card > a:hover, #main { color: #fff; margin: 0 auto !important; --x: var(--y, 2px); } }';
    assert.equal(kindOf(code, 'css', '@media'), 'keyword');
    assert.equal(kindOf(code, 'css', 'min-width'), 'property');
    assert.equal(kindOf(code, 'css', '600px'), 'number');
    assert.equal(kindOf(code, 'css', 'card'), 'type');
    assert.equal(kindOf(code, 'css', 'a'), 'tag');
    assert.equal(kindOf(code, 'css', ':hover'), 'keyword');
    assert.equal(kindOf(code, 'css', '#main'), 'type');
    assert.equal(kindOf(code, 'css', 'color'), 'property');
    assert.equal(kindOf(code, 'css', '#fff'), 'number');
    assert.equal(kindOf(code, 'css', 'auto'), 'constant');
    assert.equal(kindOf(code, 'css', '!important'), 'keyword');
    assert.equal(kindOf(code, 'css', '--x'), 'property');
    assert.equal(kindOf(code, 'css', 'var'), 'function');
    assert.equal(kindOf(code, 'css', '--y'), 'variable');
  });

  it('sql: keywords in any case, functions, types, strings with a doubled quote, comments', () => {
    const code = "select COUNT(*) as n from devices where name = 'it''s' and age > 4::int -- c";
    assert.equal(kindOf(code, 'sql', 'select'), 'keyword');
    assert.equal(kindOf(code, 'sql', 'COUNT'), 'function');
    assert.equal(kindOf(code, 'sql', "'it''s'"), 'string');
    assert.equal(kindOf(code, 'sql', 'int'), 'type');
    assert.equal(kindOf(code, 'sql', '-- c'), 'comment');
    assert.equal(kindOf(code, 'sql', 'devices'), null);
  });

  it('yaml: keys, scalars, list items, anchors, comments, documents', () => {
    const code = '---\nname: Device # c\nports:\n  - 80\n  - "443"\nactive: true\nbase: &base\n  url: http://x\n';
    assert.equal(kindOf(code, 'yaml', '---'), 'meta');
    assert.equal(kindOf(code, 'yaml', 'name'), 'property');
    assert.equal(kindOf(code, 'yaml', '# c'), 'comment');
    assert.equal(kindOf(code, 'yaml', '80'), 'number');
    assert.equal(kindOf(code, 'yaml', '"443"'), 'string');
    assert.equal(kindOf(code, 'yaml', 'true'), 'constant');
    assert.equal(kindOf(code, 'yaml', '&base'), 'meta');
    assert.equal(kindOf(code, 'yaml', 'url'), 'property');
    assert.equal(kindOf('- LAPTOP-0042\n- 42\nkey: [1, x-2]', 'yaml', '0042'), null, 'a number inside a word is the word');
    assert.equal(kindOf('- LAPTOP-0042\n- 42\nkey: [1, x-2]', 'yaml', '42'), 'number');
    assert.equal(kindOf('- LAPTOP-0042\n- 42\nkey: [1, x-2]', 'yaml', '1'), 'number');
  });

  it('go: keywords, types, constants, calls and qualified names', () => {
    const code = 'func main() { var d Device; x := len(d.Ports); fmt.Println(x, nil) }';
    assert.equal(kindOf(code, 'go', 'func'), 'keyword');
    assert.equal(kindOf(code, 'go', 'main'), 'function');
    assert.equal(kindOf(code, 'go', 'len'), 'function');
    assert.equal(kindOf(code, 'go', 'Println'), 'function');
    assert.equal(kindOf(code, 'go', 'nil'), 'constant');
    assert.equal(kindOf('type Device struct { ID int }', 'go', 'Device'), 'type');
    assert.equal(kindOf('type Device struct { ID int }', 'go', 'int'), 'type');
  });

  it('py: decorators, definitions, self, constants, prefixed and triple-quoted strings', () => {
    const code = '@dataclass\nclass Device(Base):\n    """Doc\n    string"""\n    def name(self) -> str:\n        return f"x{self.id}" if True else None';
    assert.equal(kindOf(code, 'py', '@dataclass'), 'meta');
    assert.equal(kindOf(code, 'py', 'Device'), 'type');
    assert.equal(kindOf(code, 'py', 'Base'), 'type');
    assert.equal(kindOf(code, 'py', '"""Doc\n    string"""'), 'string');
    assert.equal(kindOf(code, 'py', 'name'), 'function');
    assert.equal(kindOf(code, 'py', 'self'), 'variable');
    assert.equal(kindOf(code, 'py', 'f"x{self.id}"'), 'string');
    assert.equal(kindOf(code, 'py', 'True'), 'constant');
  });

  it('diff: headers, hunks, inserted and deleted lines, the context plain', () => {
    assert.deepEqual(marked('diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n-old\n+new\n context\n\\ No newline at end of file', 'diff'),
      ['meta:diff --git a/x b/x', 'meta:--- a/x', 'meta:+++ b/x', 'meta:@@ -1,2 +1,2 @@', 'deleted:-old', 'inserted:+new', 'comment:\\ No newline at end of file']);
  });

  it('an unknown language is one plain token; empty code no token', () => {
    assert.deepEqual(tokenize('a < b', 'cobol'), [{ kind: null, text: 'a < b' }]);
    assert.deepEqual(tokenize('', 'js'), []);
  });
});

describe('DS.highlight.language and languages', () => {
  it('resolves aliases and the language- prefix, case-insensitive', () => {
    assert.equal(language('yml'), 'yaml');
    assert.equal(language('language-python'), 'py');
    assert.equal(language('TypeScript'), 'ts');
    assert.equal(language('bash'), 'sh');
    assert.equal(language('svg'), 'xml');
    assert.equal(language('nope'), null);
    assert.equal(language(''), null);
    assert.equal(language(undefined), null);
  });

  it('lists the ten languages of D13 (js and ts, html and xml apart)', () => {
    for (const name of ['json', 'js', 'ts', 'sh', 'html', 'xml', 'css', 'sql', 'yaml', 'go', 'py', 'diff']) assert.ok(languages().includes(name), name);
  });
});

describe('DS.highlight.highlight and lines', () => {
  it('escapes every character of the code; only the token spans are markup', () => {
    assert.equal(highlight('<b>&"', 'html'), '<span class="ds-highlight__punctuation">&lt;</span><span class="ds-highlight__tag">b</span><span class="ds-highlight__punctuation">&gt;</span>&amp;&quot;');
    assert.equal(highlight('<img src=x onerror=alert(1)>', 'cobol'), '&lt;img src=x onerror=alert(1)&gt;');
    const markup = highlight('"</span><script>alert(1)</script>"', 'js');
    assert.ok(!markup.includes('<script>'), markup);
  });

  it('splits at line breaks, closing each span on its line', () => {
    assert.deepEqual(lines('/* a\nb */ x\r\n"s"\n', 'js'), [
      '<span class="ds-highlight__comment">/* a</span>',
      '<span class="ds-highlight__comment">b */</span> x',
      '<span class="ds-highlight__string">&quot;s&quot;</span>',
      '',
    ]);
    assert.deepEqual(lines('', 'js'), ['']);
    assert.deepEqual(lines('a\n\nb', 'cobol'), ['a', '', 'b']);
  });
});

describe('DS.highlight.use: the page\'s own highlighter', () => {
  afterEach(() => use(null));

  it('goes first, its markup as it comes; null leaves the language to the system', () => {
    use((code, lang) => (lang === 'ruby' ? `<span class="hl-k">${code.replace(/\n/g, '\n')}</span>` : null));
    assert.equal(highlight('def x', 'ruby'), '<span class="hl-k">def x</span>');
    assert.equal(highlight('{"a": 1}', 'json'), highlight('{"a": 1}', 'json'), 'the system keeps json');
    assert.ok(highlight('{"a": 1}', 'json').includes('ds-highlight__property'));
  });

  it('lines() splits its markup, closing and reopening the spans open at a break', () => {
    use(() => '<span class="a">one\n<span class="b">two\nthree</span></span>\nfour<br>');
    assert.deepEqual(lines('x', 'any'), [
      '<span class="a">one</span>',
      '<span class="a"><span class="b">two</span></span>',
      '<span class="a"><span class="b">three</span></span>',
      'four<br>',
    ]);
  });

  it('use(null) and a value that is no function go back to the system', () => {
    use(() => 'x');
    use('nope');
    assert.ok(highlight('a = 1', 'py').includes('ds-highlight__operator'));
  });
});

describe('DS.highlight.register', () => {
  it('adds a language with aliases; a kind may be a function', () => {
    register('ini', [['comment', /;[^\n]*/], [(word) => (word === 'on' ? 'constant' : 'property'), /^[\w.]+(?=\s*=)|\bon\b/], ['string', /"[^"\n]*"/]], ['conf']);
    assert.deepEqual(marked('; c\nname = "x"\nflag = on', 'conf'), ['comment:; c', 'property:name', 'string:"x"', 'property:flag', 'constant:on']);
    assert.equal(language('conf'), 'ini');
  });

  it('takes a tokenizer function of its own', () => {
    register('upper', (code) => code.split(/(\s+)/).map((part) => [/^[A-Z]+$/.test(part) ? 'keyword' : null, part]));
    assert.deepEqual(marked('GET /devices HTTP', 'upper'), ['keyword:GET', 'keyword:HTTP']);
  });
});

describe('DS.highlight.create', () => {
  function stub(text) {
    return {
      textContent: text,
      attributes: { 'data-ds-highlight': 'cobol' },
      className: '',
      isConnected: true,
      getAttribute(name) { return this.attributes[name] ?? null; },
      dispatchEvent() { return true; },
    };
  }

  it('leaves an unknown language as plain text and reports a change once', () => {
    const el = stub('MOVE A TO B');
    const view = create(el);
    assert.equal(view.get(), 'MOVE A TO B');
    const seen = [];
    view.on('change', (detail) => seen.push(detail));
    view.set('ADD 1 TO A');
    view.set('ADD 1 TO A');
    assert.equal(el.textContent, 'ADD 1 TO A');
    assert.deepEqual(seen, [{ code: 'ADD 1 TO A', language: 'cobol' }]);
    assert.equal(typeof view.on('other', () => {}), 'function');
  });
});

describe('speed', () => {
  // The bound catches a pattern that backtracks (seconds to minutes), not a slow machine: the suite runs in parallel.
  // The browser spec times 2,000 lines in a real engine.
  it('tokenizes 2,000 lines of each language without backtracking', () => {
    const js = Array.from({ length: 2000 }, (_, i) => `function f${i}(a, b) { return a.value + "s${i}" * 0x${i} / 2; } // ${i}`).join('\n');
    const samples = {
      js, ts: js, json: Array.from({ length: 2000 }, (_, i) => `  { "id": ${i}, "name": "LAPTOP-${i}", "active": true },`).join('\n'),
      py: Array.from({ length: 2000 }, (_, i) => `    x${i} = self.devices[${i}].name if True else None  # c`).join('\n'),
      css: Array.from({ length: 2000 }, (_, i) => `.card-${i} > a:hover { color: #fff; margin: ${i}px auto; }`).join('\n'),
      sh: Array.from({ length: 2000 }, (_, i) => `ds-cli retire LAPTOP-${i} --force | grep -v "$HOME" # ${i}`).join('\n'),
    };
    for (const [lang, code] of Object.entries(samples)) {
      lines(code, lang);
      const start = performance.now();
      const result = lines(code, lang);
      const took = performance.now() - start;
      assert.equal(result.length, 2000, lang);
      assert.ok(took < 5000, `${lang}: ${took.toFixed(0)}ms`);
    }
  });
});

describe('the code roles (meta.json roles, contrast-checked)', () => {
  // The roles the integrator moves into tokens.css, themes/dark.css and themes/contrast.css: each value must reach
  // 4.5:1 on --ds-code-bg in the scheme it is for, 7:1 with the contrast theme; and until then the fallbacks of
  // highlight.css must read on the same ground in every shipped theme.
  const root = new URL('../../../', import.meta.url);
  const read = (file) => readFileSync(new URL(file, root), 'utf8');
  /** The custom properties a stylesheet declares outside @media, the last one winning. */
  const declared = (file) => {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    return Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map((match) => [match[1], match[2].trim()]));
  };
  const stack = (scheme, ...files) => {
    const layers = ['src/core/tokens.css', ...files].map(declared).reverse();
    return (name) => {
      for (const layer of layers) if (name in layer) return pickLightDark(layer[name], scheme);
      return undefined;
    };
  };
  const meta = JSON.parse(read('src/components/highlight/meta.json'));
  const roles = Object.entries(meta.roles);
  const ratio = (fg, lookup) => contrast(resolveColour(fg, lookup), resolveColour('var(--ds-code-bg)', lookup));

  it('requests every role the stylesheet reads, as a text pair on --ds-code-bg', () => {
    const read_ = [...new Set([...read('src/components/highlight/highlight.css').matchAll(/var\((--ds-code-[\w-]+)/g)].map((m) => m[1]))].sort();
    assert.deepEqual(roles.map(([name]) => name).sort(), read_);
    for (const [name, role] of roles) assert.deepEqual(role.pair, [name, '--ds-code-bg', 'text'], name);
  });

  it('reaches 4.5:1 in light and dark, 7:1 with the contrast theme', () => {
    const failing = [];
    const check = (label, value, lookup, min) => {
      const r = ratio(value, lookup);
      if (r === null || r < min) failing.push(`${label}: ${r === null ? 'not resolved' : r.toFixed(2)} (needs ${min})`);
    };
    for (const [name, role] of roles) {
      check(`${name} light`, role.light, stack('light'), 4.5);
      check(`${name} dark`, role.dark, stack('light', 'themes/dark.css'), 4.5);
      check(`${name} contrast light`, pickLightDark(role.contrast, 'light'), stack('light', 'themes/contrast.css'), 7);
      check(`${name} contrast dark`, pickLightDark(role.contrast, 'dark'), stack('light', 'themes/dark.css', 'themes/contrast.css'), 7);
    }
    assert.deepEqual(failing, []);
  });

  it('falls back to palette roles that read on the code ground in every shipped theme', () => {
    const css = read('src/components/highlight/highlight.css');
    const fallbacks = [...css.matchAll(/var\((--ds-code-[\w-]+),\s*(var\(--ds-[\w-]+\))\)/g)].map((m) => [m[1], m[2]]);
    assert.equal(fallbacks.length, roles.length);
    const failing = [];
    for (const files of [[], ['themes/dark.css'], ['themes/contrast.css'], ['themes/dark.css', 'themes/contrast.css']]) {
      const lookup = stack('light', ...files);
      for (const [name, fallback] of fallbacks) {
        const r = ratio(fallback, lookup);
        if (r === null || r < 4.5) failing.push(`${name} → ${fallback} (${files.join(' + ') || 'default'}): ${r === null ? 'not resolved' : r.toFixed(2)}`);
      }
    }
    assert.deepEqual(failing, []);
  });
});
