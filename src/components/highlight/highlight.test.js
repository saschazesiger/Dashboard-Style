/**
 * DS.highlight: the tokenizers of every language, the escaping, the line
 * split (also of an external highlighter's markup), aliases, registration
 * and the speed on 2,000 lines and on long single lines. The browser side is highlight.spec.js.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrast, pickLightDark, resolveColour, TEXT_PAIRS } from '../../../scripts/tools/theme-rules.mjs';
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

  it('takes long single lines in linear time (they once took seconds to minutes)', () => {
    const cases = [
      ['sh', (n) => 'a '.repeat(n / 2)], ['sh', (n) => '$ a '.repeat(n / 4)],
      ['yaml', (n) => ' '.repeat(n)], ['yaml', (n) => '- '.repeat(n / 2)], ['yaml', (n) => `x ${'- '.repeat(n / 2)}`],
      ['yaml', (n) => `{${',a'.repeat(n / 2)}`], ['yaml', (n) => 'a: '.repeat(n / 3)],
      ['js', (n) => 'a '.repeat(n / 2)], ['css', (n) => `a{${'b:c '.repeat(n / 4)}`], ['html', (n) => '<a '.repeat(n / 3)],
    ];
    const time = (code, lang) => Math.min(...[0, 1].map(() => {
      const start = performance.now();
      tokenize(code, lang);
      return performance.now() - start;
    }));
    for (const [lang, make] of cases) {
      const small = time(make(25000), lang);
      const large = time(make(100000), lang);
      // Four times the code, about four times the time (quadratic: sixteen); tens of milliseconds pass whatever the ratio.
      assert.ok(large < 100 || large < small * 8 + 30, `${lang} ${JSON.stringify(make(12))}: 25 KB ${small.toFixed(0)}ms, 100 KB ${large.toFixed(0)}ms`);
    }
  });
});

describe('the code roles (tokens.css, the shipped themes, contrast-checked)', () => {
  // Colour roles of tokens.css, with their dark values in themes/dark.css and their contrast values in
  // themes/contrast.css: each reaches 4.5:1 on --ds-code-bg in the scheme it is for, 7:1 with the contrast theme.
  const root = new URL('../../../', import.meta.url);
  const read = (file) => readFileSync(new URL(file, root), 'utf8');
  /** The custom properties a stylesheet declares outside @media, the last one winning. */
  const declared = (file) => {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    return Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map((match) => [match[1], match[2].trim()]));
  };
  /** The value of a name with `files` loaded after tokens.css, as the scheme of the stack sees a light-dark() pair. */
  const stack = (...files) => {
    const layers = ['src/core/tokens.css', ...files].map(declared).reverse();
    const raw = (name) => layers.find((layer) => name in layer)?.[name];
    const scheme = /\bdark\b/.test(raw('--ds-color-scheme') ?? '') ? 'dark' : 'light';
    return (name) => {
      const value = raw(name);
      return value === undefined ? undefined : pickLightDark(value, scheme);
    };
  };
  const css = read('src/components/highlight/highlight.css');
  const roles = [...new Set([...css.matchAll(/var\((--ds-code-[\w-]+)/g)].map((m) => m[1]))].sort();
  const ratio = (name, lookup) => contrast(resolveColour(`var(${name})`, lookup), resolveColour('var(--ds-code-bg)', lookup));

  it('reads every code role plainly, a role of tokens.css with its dark and contrast values and its text pair', () => {
    assert.equal(roles.length, 10);
    assert.doesNotMatch(css, /var\(--ds-code-[\w-]+,/, 'roles are read without a fallback');
    const [tokens, dark, more] = ['src/core/tokens.css', 'themes/dark.css', 'themes/contrast.css'].map(declared);
    for (const name of roles) {
      assert.match(tokens[name] ?? '', /^#[0-9a-f]{6}$/, `${name} in tokens.css`);
      assert.match(dark[name] ?? '', /^#[0-9a-f]{6}$/, `${name} in themes/dark.css`);
      assert.match(more[name] ?? '', /^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/, `${name} in themes/contrast.css`);
      assert.ok(TEXT_PAIRS.some(([fg, bg]) => fg === name && bg === '--ds-code-bg'), `${name} on --ds-code-bg in TEXT_PAIRS`);
    }
    const meta = JSON.parse(read('src/components/highlight/meta.json'));
    assert.ok(!('roles' in meta), 'no requested roles left in meta.json');
    for (const name of roles) assert.ok(!(name in meta.hooks), `${name} is a role, not a hook`);
  });

  it('reaches 4.5:1 in light and dark, 7:1 with the contrast theme', () => {
    const failing = [];
    const views = [[[], 4.5], [['themes/dark.css'], 4.5], [['themes/contrast.css'], 7], [['themes/dark.css', 'themes/contrast.css'], 7]];
    for (const [files, min] of views) {
      const lookup = stack(...files);
      for (const name of roles) {
        const r = ratio(name, lookup);
        if (r === null || r < min) failing.push(`${name} (${files.join(' + ') || 'default'}): ${r === null ? 'not resolved' : r.toFixed(2)} (needs ${min})`);
      }
    }
    assert.deepEqual(failing, []);
  });
});
