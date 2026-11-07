/**
 * DS.code: the mark list and the line markup (numbers, marks, a diff's
 * lines, highlighting, escaping; the text stays the source). The browser
 * side (header, tabs, fold, wrap) is code.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { linesHtml, parseLines } from './code.js';

/** The text a line markup reads as: tags dropped, entities decoded. */
const textOf = (html) => html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

describe('DS.code.parseLines', () => {
  it('reads single lines and ranges, in any order and spacing', () => {
    assert.deepEqual([...parseLines('2,4-6')], [2, 4, 5, 6]);
    assert.deepEqual([...parseLines(' 9 , 3-1 ')], [9, 1, 2, 3]);
    assert.deepEqual([...parseLines('1 3')], [1, 3]);
  });

  it('skips nonsense and stays bounded', () => {
    assert.deepEqual([...parseLines('a,-2,3-,x-y')], []);
    assert.deepEqual([...parseLines(null)], []);
    assert.equal(parseLines('1-999999999').size, 10000);
  });
});

describe('DS.code.linesHtml', () => {
  it('one numbered line per line, each with its break but the last; the text stays the source', () => {
    const source = 'a\n<b>\n"c" & d';
    const html = linesHtml(source);
    assert.equal(html, '<span class="ds-code__line" data-line="1">a\n</span><span class="ds-code__line" data-line="2">&lt;b&gt;\n</span><span class="ds-code__line" data-line="3">&quot;c&quot; &amp; d</span>');
    assert.equal(textOf(html), source);
  });

  it('a final line break makes no empty last line; CRLF counts as one break', () => {
    assert.equal(linesHtml('a\n').match(/data-line/g).length, 1);
    assert.equal(textOf(linesHtml('a\r\nb')), 'a\nb');
    assert.equal(linesHtml(''), '<span class="ds-code__line" data-line="1"></span>');
  });

  it('numbers from start and marks the lines named by their number', () => {
    const html = linesHtml('x\ny\nz', { start: 10, marks: new Set([11]) });
    assert.ok(html.includes('<span class="ds-code__line" data-line="10">x\n</span>'));
    assert.ok(html.includes('<mark class="ds-code__line ds-code__line--mark" data-line="11">y\n</mark>'));
    assert.ok(html.includes('data-line="12">z</span>'));
  });

  it('highlights a known language, and keeps the spans within their line', () => {
    const html = linesHtml('/* a\nb */\nconst x = 1;', { language: 'js' });
    assert.ok(html.includes('<span class="ds-code__line" data-line="1"><span class="ds-highlight__comment">/* a</span>\n</span>'));
    assert.ok(html.includes('<span class="ds-highlight__keyword">const</span>'));
    assert.equal(textOf(html), '/* a\nb */\nconst x = 1;');
  });

  it('tints a diff\'s added and removed lines, not its file headers', () => {
    const html = linesHtml('--- a/x\n+++ b/x\n@@ -1 +1 @@\n-old\n+new\n same', { language: 'diff' });
    assert.equal((html.match(/ds-code__line--deleted/g) ?? []).length, 1);
    assert.equal((html.match(/ds-code__line--inserted/g) ?? []).length, 1);
    assert.ok(/class="ds-code__line ds-code__line--deleted" data-line="4"/.test(html));
  });

  it('renders 2,000 lines without backtracking', () => {
    const source = Array.from({ length: 2000 }, (_, i) => `  { "id": ${i}, "name": "LAPTOP-${i}", "retired": false },`).join('\n');
    const start = performance.now();
    const html = linesHtml(source, { language: 'json', marks: parseLines('10-20') });
    assert.equal(html.match(/data-line=/g).length, 2000);
    assert.ok(performance.now() - start < 5000);
  });
});
