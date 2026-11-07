/**
 * DS.markdown.render: the blocks and inlines of the subset, the GFM
 * extensions, footnotes and callouts, and above all the safety (no HTML
 * passthrough, only http, https, mailto and relative links). The browser
 * side (the attribute path, morphing in place) is markdown.spec.js.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, slug, use } from './markdown.js';
import { use as highlighter } from '../highlight/highlight.js';

const one = (source, options) => render(source, options).trim();

describe('blocks', () => {
  it('headings: ATX with an id, closing hashes dropped, setext, an offset', () => {
    assert.equal(one('# Retire a device'), '<h1 id="retire-a-device">Retire a device</h1>');
    assert.equal(one('### Notes ###'), '<h3 id="notes">Notes</h3>');
    assert.equal(one('Title\n====='), '<h1 id="title">Title</h1>');
    assert.equal(one('Sub\n---'), '<h2 id="sub">Sub</h2>');
    assert.equal(one('# A\n# A'), '<h1 id="a">A</h1>\n<h1 id="a-1">A</h1>');
    assert.equal(one('# Top', { headingOffset: 1, idPrefix: 'm-' }), '<h2 id="m-top">Top</h2>');
    assert.equal(one('####### seven'), '<p>####### seven</p>');
    assert.equal(one('#hashtag'), '<p>#hashtag</p>');
  });

  it('heading anchors: the text links to the heading, the icon hidden', () => {
    const html = one('## Before you start', { anchors: true });
    assert.match(html, /^<h2 id="before-you-start"><a class="ds-prose__anchor" href="#before-you-start">Before you start<svg [^>]*aria-hidden="true"/);
  });

  it('heading anchors hold no other link: links, autolinks and footnote references are their text', () => {
    const html = render('## See [docs](https://example.com) or <https://example.com/a>, www.example.com and a note[^1]\n\n[^1]: Text.', { anchors: true });
    const heading = /<h2[^]*?<\/h2>/.exec(html)[0];
    assert.equal((heading.match(/<a\b/g) ?? []).length, 1, heading);
    assert.match(heading, /^<h2 id="[^"]+"><a class="ds-prose__anchor" href="#[^"]+">See docs or https:\/\/example\.com\/a, www\.example\.com and a note<sup class="ds-prose__fnref">1<\/sup><svg/);
    assert.ok(html.includes('<li id="fn-1"><p>Text.</p></li>'), 'a note referenced only as a number has no link back');
    assert.equal(one('## See [docs](/x)'), '<h2 id="see-docs">See <a href="/x">docs</a></h2>', 'without anchors the link stays');
  });

  it('a footnote reference in a link\'s text is its number alone', () => {
    const html = render('[see[^1]](/x)\n\n[^1]: Text.');
    assert.ok(html.startsWith('<p><a href="/x">see<sup class="ds-prose__fnref">1</sup></a></p>'), html);
  });

  it('ids never collide: heading slugs, repeats, the code and footnote ids', () => {
    assert.equal(one('# Setup\n# Setup 1\n# Setup'), '<h1 id="setup">Setup</h1>\n<h1 id="setup-1">Setup 1</h1>\n<h1 id="setup-2">Setup</h1>');
    const code = render('## Code 1\n\n```js\nx\n```', { code: 'block', idPrefix: 'm-' });
    assert.ok(code.includes('<h2 id="m-code-1-1">') && code.includes('<code id="m-code-1"') && code.includes('data-ds-copy="#m-code-1"'), code);
    const notes = render('## Footnotes\n\n## fn-1\n\n## fnref-1\n\nA[^!] B[^?]\n\n[^!]: one\n[^?]: two', { idPrefix: 'm-' });
    for (const id of ['m-footnotes', 'm-fn-1', 'm-fn-2', 'm-fnref-1', 'm-fnref-2', 'm-footnotes-1', 'm-fn-1-1', 'm-fnref-1-1']) {
      assert.equal(notes.split(`id="${id}"`).length, 2, `${id} once: ${notes}`);
    }
    assert.ok(notes.includes('href="#m-fn-1"') && notes.includes('href="#m-fn-2"'), 'two labels that slug alike keep two notes');
  });

  it('paragraphs, soft and hard breaks; breaks makes every break hard', () => {
    assert.equal(one('one\ntwo\n\nthree'), '<p>one\ntwo</p>\n<p>three</p>');
    assert.equal(one('one  \ntwo\\\nthree'), '<p>one<br>\ntwo<br>\nthree</p>');
    assert.equal(one('one\ntwo', { breaks: true }), '<p>one<br>\ntwo</p>');
  });

  it('lists: bullets, ordered with a start, nesting, tight and loose', () => {
    assert.equal(one('- a\n- b\n  - c'), '<ul>\n<li>a</li>\n<li>b\n<ul>\n<li>c</li>\n</ul></li>\n</ul>');
    assert.equal(one('3. a\n4. b'), '<ol start="3">\n<li>a</li>\n<li>b</li>\n</ol>');
    assert.equal(one('- a\n\n- b'), '<ul>\n<li><p>a</p></li>\n<li><p>b</p></li>\n</ul>');
    assert.equal(one('* a\n+ b'), '<ul>\n<li>a</li>\n</ul>\n<ul>\n<li>b</li>\n</ul>', 'another bullet starts another list');
    assert.equal(one('text\n2. not a list'), '<p>text\n2. not a list</p>', 'only 1. interrupts a paragraph');
    assert.equal(one('- a\nlazy'), '<ul>\n<li>a\nlazy</li>\n</ul>');
  });

  it('task lists: a disabled checkbox in a label', () => {
    assert.equal(one('- [x] done\n- [ ] todo'), '<ul>\n<li><label><input type="checkbox" disabled checked> done</label></li>\n<li><label><input type="checkbox" disabled> todo</label></li>\n</ul>');
    assert.equal(one('- [x] done\n\n- [ ] todo'), '<ul>\n<li><p><label><input type="checkbox" disabled checked> done</label></p></li>\n<li><p><label><input type="checkbox" disabled> todo</label></p></li>\n</ul>');
  });

  it('quotes with lazy lines; callouts in their tone with icon and word', () => {
    assert.equal(one('> quote\nlazy'), '<blockquote>\n<p>quote\nlazy</p>\n</blockquote>');
    const callout = one('> [!WARNING]\n> Retiring erases it.');
    assert.match(callout, /^<div class="ds-prose__callout ds-tone-warning" role="note"><p class="ds-prose__callout-title"><svg[^>]*>.*<\/svg>Warning<\/p>\n<p>Retiring erases it.<\/p><\/div>$/s);
    for (const [kind, tone, word] of [['NOTE', 'info', 'Note'], ['tip', 'success', 'Tip'], ['Important', 'primary', 'Important'], ['CAUTION', 'error', 'Caution']]) {
      const html = one(`> [!${kind}]\n> text`);
      assert.ok(html.includes(`ds-tone-${tone}`) && html.includes(`</svg>${word}</p>`), kind);
    }
  });

  it('code: fenced with a language (highlighted), tildes, indented, an unclosed fence runs to the end', () => {
    assert.equal(one('```js\nconst a = 1;\n```'), '<pre tabindex="0" aria-label="js"><code class="language-js"><span class="ds-highlight__keyword">const</span> a <span class="ds-highlight__operator">=</span> <span class="ds-highlight__number">1</span><span class="ds-highlight__punctuation">;</span></code></pre>');
    assert.equal(one('~~~\n<b>\n~~~'), '<pre tabindex="0" aria-label="Code"><code>&lt;b&gt;</code></pre>', 'a block can scroll: a stop with a name');
    assert.equal(one('    indented\n    code'), '<pre tabindex="0" aria-label="Code"><code>indented\ncode</code></pre>');
    assert.equal(one('```\nopen'), '<pre tabindex="0" aria-label="Code"><code>open</code></pre>');
    assert.equal(one('```js\nconst a\n```', { highlight: false }), '<pre tabindex="0" aria-label="js"><code class="language-js">const a</code></pre>');
    assert.equal(one('``` js extra words\nx\n```', { highlight: false }), '<pre tabindex="0" aria-label="js"><code class="language-js">x</code></pre>');
  });

  it('code: a frame with a header and a copy button for DS.code', () => {
    const html = one('```py\nprint(1)\n```', { code: 'block', idPrefix: 'm1-' });
    assert.match(html, /^<figure class="ds-code" data-ds-code data-ds-code-lang="py"><div class="ds-code__head ds-sm"><span class="ds-code__lang">py<\/span>/);
    assert.ok(html.includes('data-ds-copy="#m1-code-1"') && html.includes('aria-label="Copy code"') && html.includes('<code id="m1-code-1" class="language-py"><span class="ds-code__line" data-line="1"><span class="ds-highlight__function">print</span>'));
    assert.ok(html.includes('<pre class="ds-code-block" tabindex="0" aria-label="py">'));
    assert.ok(one('```\nx\n```', { code: 'block' }).includes('<pre class="ds-code-block" tabindex="0" aria-label="Code">'), 'a block without a language is named too');
  });

  it('code frame: a language the system does not know goes to the page\'s highlighter, as DS.code passes it', () => {
    highlighter((code, language) => (language === 'rust' ? `<b>${code}</b>` : null));
    try {
      const html = one('```rust\nfn main\n```', { code: 'block', idPrefix: 'r-' });
      assert.ok(html.includes('data-ds-code-lang="rust"') && html.includes('<span class="ds-code__line" data-line="1"><b>fn main</b></span>'), html);
    } finally {
      highlighter(null);
    }
  });

  it('thematic breaks; a table with alignment, escaped pipes and short rows', () => {
    assert.equal(one('***\n- - -\n___'), '<hr>\n<hr>\n<hr>');
    assert.equal(one('| A | B | C |\n|:--|:-:|--:|\n| 1 | a \\| b |\n'),
      '<table><thead><tr><th data-align="start">A</th><th data-align="center">B</th><th data-align="end">C</th></tr></thead><tbody><tr><td data-align="start">1</td><td data-align="center">a | b</td><td data-align="end"></td></tr></tbody></table>');
    assert.equal(one('a | b\n--|--'), '<table><thead><tr><th>a</th><th>b</th></tr></thead></table>');
    assert.equal(one('| a | b |\n|---|'), '<p>| a | b |\n|---|</p>', 'a delimiter row of another width makes no table');
  });

  it('raw HTML is text: shown as written', () => {
    assert.equal(one('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    assert.equal(one('<div onclick="x()">hi</div>'), '<p>&lt;div onclick=&quot;x()&quot;&gt;hi&lt;/div&gt;</p>');
    assert.equal(one('<!-- c -->'), '<p>&lt;!-- c --&gt;</p>');
  });
});

describe('inlines', () => {
  it('emphasis by the delimiter rules', () => {
    assert.equal(one('**strong** *em* _em_ __strong__'), '<p><strong>strong</strong> <em>em</em> <em>em</em> <strong>strong</strong></p>');
    assert.equal(one('***both***'), '<p><em><strong>both</strong></em></p>');
    assert.equal(one('*a **b** c*'), '<p><em>a <strong>b</strong> c</em></p>');
    assert.equal(one('snake_case_word and 5*6*7'), '<p>snake_case_word and 5<em>6</em>7</p>');
    assert.equal(one('* not em *'), '<ul>\n<li>not em *</li>\n</ul>');
    assert.equal(one('a * b * c'), '<p>a * b * c</p>');
    assert.equal(one('**unclosed'), '<p>**unclosed</p>');
    assert.equal(one('~~gone~~ ~one~ ~~~three~~~'), '<p><del>gone</del> <del>one</del> ~~~three~~~</p>');
  });

  it('code spans: backtick runs, spaces, no escapes inside', () => {
    assert.equal(one('`a <b>`'), '<p><code>a &lt;b&gt;</code></p>');
    assert.equal(one('`` a ` b ``'), '<p><code>a ` b</code></p>');
    assert.equal(one('`\\*`'), '<p><code>\\*</code></p>');
    assert.equal(one('`open'), '<p>`open</p>');
  });

  it('backslash escapes and entities', () => {
    assert.equal(one('\\*not em\\* \\# \\a'), '<p>*not em* # \\a</p>');
    assert.equal(one('&copy; &amp; &#35; &#x41; &bogus; &#0;'), '<p>\u00a9 &amp; # A &amp;bogus; \ufffd</p>');
  });

  it('links: inline with a title, references (full, collapsed, shortcut), nested brackets', () => {
    assert.equal(one('[docs](/help "Help")'), '<p><a href="/help" title="Help">docs</a></p>');
    assert.equal(one('[x](<a b>)'), '<p><a href="a%20b">x</a></p>');
    assert.equal(one('[a](https://example.com/(x))'), '<p><a href="https://example.com/(x)" rel="noopener">a</a></p>');
    assert.equal(one('[one][r] [r][] [r]\n\n[r]: /path \'T\''), '<p><a href="/path" title="T">one</a> <a href="/path" title="T">r</a> <a href="/path" title="T">r</a></p>');
    assert.equal(one('[no ref]'), '<p>[no ref]</p>');
    assert.equal(one('[a [b](/x)](/y)'), '<p>[a <a href="/x">b</a>](/y)</p>', 'no link inside a link');
    assert.equal(one('[**bold**](/x)'), '<p><a href="/x"><strong>bold</strong></a></p>');
  });

  it('external links take rel noopener, a target with noreferrer; mailto and relative ones none', () => {
    assert.equal(one('[a](https://example.com)'), '<p><a href="https://example.com" rel="noopener">a</a></p>');
    assert.equal(one('[a](https://example.com)', { target: '_blank' }), '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">a</a></p>');
    assert.equal(one('[a](mailto:it@example.com) [b](#top) [c](../x)'), '<p><a href="mailto:it@example.com">a</a> <a href="#top">b</a> <a href="../x">c</a></p>');
  });

  it('images: lazy, alt as text; images: false makes a link', () => {
    assert.equal(one('![A *device*](https://example.com/d.png "Photo")'), '<p><img src="https://example.com/d.png" alt="A device" title="Photo" loading="lazy" decoding="async"></p>');
    assert.equal(one('![A device](/d.png)', { images: false }), '<p><a href="/d.png">A device</a></p>');
  });

  it('autolinks: <url>, <mail>, and the extended www., http(s) and addresses', () => {
    assert.equal(one('<https://example.com/a?b=1>'), '<p><a href="https://example.com/a?b=1" rel="noopener">https://example.com/a?b=1</a></p>');
    assert.equal(one('<it@example.com>'), '<p><a href="mailto:it@example.com">it@example.com</a></p>');
    assert.equal(one('See www.example.com/help.'), '<p>See <a href="http://www.example.com/help" rel="noopener">www.example.com/help</a>.</p>');
    assert.equal(one('(https://example.com/a_(b))'), '<p>(<a href="https://example.com/a_(b)" rel="noopener">https://example.com/a_(b)</a>)</p>');
    assert.equal(one('Write to it@example.com.'), '<p>Write to <a href="mailto:it@example.com">it@example.com</a>.</p>');
    assert.equal(one('[see www.example.com](/x)'), '<p><a href="/x">see www.example.com</a></p>', 'no autolink inside a link');
    assert.equal(one('`www.example.com`'), '<p><code>www.example.com</code></p>');
  });

  it('footnotes: numbered in order of reference, a hidden heading, links back for every reference', () => {
    const html = render('A[^b] and B[^a] and A again[^b].\n\n[^a]: Note *a*.\n[^b]: Note b.', { idPrefix: 'm-' });
    assert.ok(html.includes('<sup class="ds-prose__fnref"><a href="#m-fn-1" id="m-fnref-1" aria-describedby="m-footnotes">1</a></sup>'), 'ids by number');
    assert.ok(html.includes('<sup class="ds-prose__fnref"><a href="#m-fn-2" id="m-fnref-2" aria-describedby="m-footnotes">2</a></sup>'));
    assert.ok(html.includes('id="m-fnref-1-2"'));
    assert.ok(html.includes('<section class="ds-prose__footnotes" aria-labelledby="m-footnotes"><h2 class="ds-sr" id="m-footnotes">Footnotes</h2>'));
    assert.ok(html.indexOf('<li id="m-fn-1"><p>Note b.') > 0 && html.indexOf('id="m-fn-1"') < html.indexOf('id="m-fn-2"'), 'notes in the order of their references');
    assert.ok(html.includes('href="#m-fnref-1-2" aria-label="Back to reference 1"'));
    assert.ok(html.includes('<p>Note <em>a</em>. <a class="ds-prose__fnback" href="#m-fnref-2" aria-label="Back to reference 2">'));
    assert.equal(one('An [^undefined] reference.'), '<p>An [^undefined] reference.</p>');
    assert.equal(one('[^unused]: never referenced'), '', 'a note nobody references is not written');
  });
});

describe('safety', () => {
  const HOSTILE = [
    'javascript:alert(1)', 'JAVASCRIPT:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'java&#x09;script:alert(1)',
    '&#106;avascript:alert(1)', 'jav&#x61;script:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd', '\u0001javascript:alert(1)', 'javascript&colon;alert(1)',
  ];

  it('writes a link or image with another scheme as its text alone', () => {
    for (const url of HOSTILE) {
      const source = `[link](${url.replace(/[()]/g, (char) => `\\${char}`)}) ![image](${url.replace(/[()]/g, (char) => `\\${char}`)}) <${url}>`;
      const html = render(source);
      assert.ok(!/href="[^"]*script|src="[^"]*(script|data)/i.test(html), `${url}: ${html}`);
      assert.ok(!/<a [^>]*href="(?:javascript|vbscript|data|file)/i.test(html), url);
    }
  });

  it('escapes every attribute value and every text', () => {
    const html = render('[x](/a"onmouseover="alert(1) "t\\"itle") ![a" onerror="x](/b.png) `"\'<>&`');
    assert.ok(!html.includes('" onmouseover'), html);
    assert.ok(!html.includes('" onerror'), html);
    assert.ok(html.includes('<code>&quot;&#39;&lt;&gt;&amp;</code>'), html);
  });

  it('never writes a tag the subset does not have', () => {
    const allowed = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'del', 'code', 'pre', 'a', 'img', 'ul', 'ol', 'li', 'label', 'input', 'blockquote', 'div', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'section', 'svg', 'path', 'circle', 'span', 'figure', 'button', 'rect']);
    const sources = ['<iframe src=x>', '<svg onload=alert(1)>', '<<script>>', '<img src=x onerror=alert(1)>', '<a href="javascript:x">x</a>', '<style>*{}</style>', '<math><mi>x</mi></math>', '<details open ontoggle=alert(1)>',
      '```html\n<script>x</script>\n```', '> [!NOTE]\n> <b>x</b>', '| <b> | x |\n|--|--|\n| <i> | y |', '- [x] <img src=x>', '[^1]\n\n[^1]: <script>'];
    for (const source of sources) {
      for (const [, tag] of render(source, { code: 'block' }).matchAll(/<([a-z][a-z0-9]*)/gi)) assert.ok(allowed.has(tag.toLowerCase()), `${source}: <${tag}>`);
    }
  });

  it('widens the schemes on request; relative links stay links', () => {
    assert.equal(one('[call](tel:+41000000)'), '<p>call</p>');
    assert.equal(one('[call](tel:+41000000)', { schemes: ['http', 'https', 'tel'] }), '<p><a href="tel:+41000000" rel="noopener">call</a></p>');
  });

  it('keeps ids to letters, digits, - and _', () => {
    assert.equal(one('# A', { idPrefix: '"><script>' }), '<h1 id="scripta">A</h1>');
  });
});

describe('the page\'s own sanitiser and renderer', () => {
  afterEach(() => use(null));

  it('runs the sanitiser on every result, the renderer instead of the system\'s', () => {
    assert.equal(render('**x**', { sanitize: (html) => html.replace(/strong/g, 'b') }), '<p><b>x</b></p>');
    assert.equal(render('**x**', { renderer: (source) => `<div>${source}</div>`, sanitize: (html) => html.toUpperCase() }), '<DIV>**X**</DIV>');
  });

  it('use() sets the page\'s defaults; an option of a call wins; null clears them', () => {
    use({ breaks: true, sanitize: (html) => `${html}!` });
    assert.equal(render('a\nb'), '<p>a<br>\nb</p>!');
    assert.equal(render('a\nb', { breaks: false }), '<p>a\nb</p>!');
    use(null);
    assert.equal(render('a\nb'), '<p>a\nb</p>');
  });
});

describe('slug', () => {
  it('lower case, words joined by hyphens, punctuation dropped, letters of every script kept', () => {
    assert.equal(slug('Before you start!'), 'before-you-start');
    assert.equal(slug('  A -- B  '), 'a-b');
    assert.equal(slug('Gerät & Zubehör'), 'gerät-zubehör');
    assert.equal(slug('???'), 'section');
  });
});

describe('robustness', () => {
  // Each a source of `n` characters that once took quadratic time (seconds at 100 KB) or overflowed the stack.
  const HOSTILE = {
    'unclosed destinations': (n) => '[a](b'.repeat(n / 5),
    'brackets': (n) => '['.repeat(n / 2) + ']'.repeat(n / 2),
    'unclosed titles': (n) => '[a](b ('.repeat(n / 7),
    'angle destinations': (n) => '[a](<b'.repeat(n / 6),
    'links in brackets': (n) => '['.repeat(n / 2) + '[a](b)'.repeat(n / 12),
    'entities': (n) => '&a'.repeat(n / 2),
    'code span runs': (n) => Array.from({ length: Math.floor(Math.sqrt(2 * n)) }, (_, i) => `${'`'.repeat(i + 1)}a`).join(''),
    'addresses': (n) => 'a_'.repeat(n / 2),
    'autolinks in brackets': (n) => '['.repeat(n / 2) + '(www.a]'.repeat(n / 14),
    'autolink tails': (n) => `www.a${'&b;.)'.repeat(n / 5)}`,
    'footnote openers': (n) => '[^a'.repeat(n / 3),
    'nested lists': (n) => `${'- '.repeat(n / 2)}x`,
    'nested quotes': (n) => `${'>'.repeat(n)} x`,
    'nested list lines': (n) => Array.from({ length: Math.floor(Math.sqrt(n)) }, (_, i) => `${'  '.repeat(i)}- x`).join('\n'),
    'emphasis': (n) => '*a**b***c'.repeat(n / 9),
    'runs': (n) => '*'.repeat(n),
    'underscores': (n) => 'a'.repeat(n / 2) + '_'.repeat(n / 2),
  };
  /** The faster of two runs, in ms. */
  const time = (source) => Math.min(...[0, 1].map(() => {
    const start = performance.now();
    render(source, { anchors: true, code: 'block' });
    return performance.now() - start;
  }));

  it('renders hostile input in linear time and never overflows the stack', () => {
    for (const [name, make] of Object.entries(HOSTILE)) {
      const small = time(make(25000));
      const large = time(make(100000));
      // Linear: four times the text, about four times the time (quadratic would be sixteen). Fast is fine whatever the ratio.
      assert.ok(large < 250 || large < small * 8 + 50, `${name}: 25 KB ${small.toFixed(0)}ms, 100 KB ${large.toFixed(0)}ms`);
    }
  });

  it('nests quotes and lists 100 deep; deeper markers are text', () => {
    const html = render(`${'> '.repeat(150)}x`);
    assert.equal(html.split('<blockquote>').length - 1, 100);
    assert.ok(html.includes(`<p>${'&gt; '.repeat(49)}&gt; x</p>`), html.slice(-400));
    assert.equal(render(`${'- '.repeat(150)}x`).split('<ul>').length - 1, 100);
  });

  it('takes CRLF, a NUL, an empty source', () => {
    assert.equal(one('a\r\nb'), '<p>a\nb</p>');
    assert.equal(one('a\u0000b'), '<p>a\ufffdb</p>');
    assert.equal(render(''), '');
    assert.equal(render(null), '');
  });
});
