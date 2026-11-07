/**
 * DS.diff: the parser, the word marks and the rows a view shows, in Node
 * (no DOM). The browser side is diff.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, words, rows, highlighter } from './diff.js';

const GIT = [
  'commit 3f2a9c1',
  'Author: Ada Lovelace',
  '',
  '    Retry the device sync',
  '',
  'diff --git a/src/sync.js b/src/sync.js',
  'index 83db48f..bf269f4 100644',
  '--- a/src/sync.js',
  '+++ b/src/sync.js',
  '@@ -1,5 +1,6 @@ export function sync(device) {',
  " import { fetch } from './net.js';",
  '-const RETRIES = 2;',
  '+const RETRIES = 3;',
  '+const DELAY = 500;',
  ' ',
  ' export function sync(device) {',
  '   return fetch(device.url);',
  '@@ -40,3 +41,2 @@ function done() {',
  ' }',
  '-// old note',
  ' end',
  '\\ No newline at end of file',
  'diff --git a/docs/old.md b/docs/new.md',
  'similarity index 90%',
  'rename from docs/old.md',
  'rename to docs/new.md',
  'diff --git a/assets/logo.png b/assets/logo.png',
  'new file mode 100644',
  'index 0000000..e69de29',
  'Binary files /dev/null and b/assets/logo.png differ',
  'diff --git a/tmp/cache.txt b/tmp/cache.txt',
  'deleted file mode 100644',
  '--- a/tmp/cache.txt',
  '+++ /dev/null',
  '@@ -1 +0,0 @@',
  '-stale',
].join('\n');

describe('DS.diff.parse', () => {
  it('reads files, statuses, paths, hunks and both line numbers', () => {
    const files = parse(GIT);
    assert.equal(files.length, 4);
    const [sync, renamed, binary, deleted] = files;
    assert.equal(sync.path, 'src/sync.js');
    assert.equal(sync.status, 'modified');
    assert.equal(sync.additions, 2);
    assert.equal(sync.deletions, 2);
    assert.equal(sync.hunks.length, 2);
    assert.deepEqual(
      { oldStart: sync.hunks[0].oldStart, oldLines: sync.hunks[0].oldLines, newStart: sync.hunks[0].newStart, newLines: sync.hunks[0].newLines, section: sync.hunks[0].section },
      { oldStart: 1, oldLines: 5, newStart: 1, newLines: 6, section: 'export function sync(device) {' },
    );
    assert.deepEqual(sync.hunks[0].lines.map((line) => [line.kind, line.old, line.new]), [
      ['ctx', 1, 1], ['del', 2, null], ['add', null, 2], ['add', null, 3], ['ctx', 3, 4], ['ctx', 4, 5], ['ctx', 5, 6],
    ]);
    assert.equal(sync.hunks[0].lines[4].text, '', 'an empty context line');
    assert.equal(sync.hunks[1].lines.at(-1).noNewline, true);
    assert.deepEqual([renamed.status, renamed.oldPath, renamed.newPath, renamed.path], ['renamed', 'docs/old.md', 'docs/new.md', 'docs/new.md']);
    assert.deepEqual([binary.status, binary.binary, binary.oldPath, binary.path], ['added', true, null, 'assets/logo.png']);
    assert.deepEqual([deleted.status, deleted.newPath, deleted.path, deleted.deletions], ['deleted', null, 'tmp/cache.txt', 1]);
    assert.equal(deleted.hunks[0].newLines, 0);
  });

  it('reads a plain diff -u of several files, timestamps and all, and CRLF text', () => {
    const files = parse([
      '--- before/a.txt\t2026-11-04 09:00:00',
      '+++ after/a.txt\t2026-11-04 09:05:00',
      '@@ -1 +1 @@',
      '-one',
      '+two',
      '--- before/b.txt',
      '+++ after/b.txt',
      '@@ -1,2 +1,2 @@',
      ' keep',
      '--- not a header, a removed line',
      '+++ not a header, an added line',
    ].join('\r\n'));
    assert.equal(files.length, 2);
    assert.equal(files[0].oldPath, 'before/a.txt');
    assert.equal(files[1].newPath, 'after/b.txt');
    assert.deepEqual(files[1].hunks[0].lines.map((line) => line.kind), ['ctx', 'del', 'add']);
    assert.equal(files[1].hunks[0].lines[1].text, '-- not a header, a removed line');
  });

  it('takes a hunk without a file header, and nothing at all from empty text', () => {
    const [file] = parse('@@ -3,2 +3,2 @@\n a\n-b\n+c');
    assert.equal(file.hunks[0].lines.length, 3);
    assert.equal(file.path, '');
    assert.deepEqual(parse(''), []);
    assert.deepEqual(parse(null), []);
  });

  it('keeps quoted paths with spaces', () => {
    const [file] = parse('diff --git "a/my file.txt" "b/my file.txt"\n--- "a/my file.txt"\n+++ "b/my file.txt"\n@@ -1 +1 @@\n-a\n+b');
    assert.equal(file.path, 'my file.txt');
    assert.equal(file.status, 'modified');
  });
});

describe('DS.diff.words', () => {
  it('marks only the words that changed', () => {
    assert.deepEqual(words('const RETRIES = 2;', 'const RETRIES = 3;'), { removed: [[16, 17]], added: [[16, 17]] });
    const change = words('return fetch(device.url);', 'return fetch(device.url, { retries });');
    assert.deepEqual(change.removed, []);
    assert.equal('return fetch(device.url, { retries });'.slice(...change.added[0]), ', { retries }');
  });

  it('joins changes across the whitespace between them, never at the ends', () => {
    const change = words('a b c d', 'a x y d');
    assert.deepEqual(change.removed, [[2, 5]]);
    assert.deepEqual(change.added, [[2, 5]]);
  });

  it('marks nothing for a rewrite, empty lines or very long ones', () => {
    assert.equal(words('the quick brown fox', 'lorem ipsum dolor sit'), null);
    assert.equal(words('', 'x'), null);
    const long = Array.from({ length: 600 }, (_, i) => `w${i}`).join(' ');
    assert.equal(words(long, `${long} more`), null);
  });

  it('counts letters of every script as words', () => {
    const change = words('Grüße an Ada', 'Grüße an Grace');
    assert.equal('Grüße an Grace'.slice(...change.added[0]), 'Grace');
  });
});

describe('DS.diff.rows', () => {
  const long = (count) => [
    'diff --git a/a.txt b/a.txt',
    '--- a/a.txt',
    '+++ b/a.txt',
    `@@ -10,${count + 2} +10,${count + 2} @@`,
    '-old',
    '+new',
    ...Array.from({ length: count }, (_, i) => ` same ${i}`),
    '-x',
    '+y',
  ].join('\n');

  it('folds a long run of unchanged lines, keeping the context on each side', () => {
    const [file] = parse(long(20));
    const list = rows(file, { context: 3 });
    const fold = list.find((row) => row.type === 'fold');
    assert.equal(fold.count, 14);
    assert.equal(fold.lines[0].text, 'same 3');
    assert.deepEqual(list.map((row) => row.type), ['hunk', 'line', 'line', 'line', 'line', 'line', 'fold', 'line', 'line', 'line', 'line', 'line']);
    assert.equal(rows(file, { context: 3, expanded: [fold.key] }).some((row) => row.type === 'fold'), false);
    assert.equal(rows(file, { context: 'all' }).some((row) => row.type === 'fold'), false);
  });

  it('leaves a short run alone (a fold hides at least four lines)', () => {
    const [file] = parse(long(9));
    assert.equal(rows(file, { context: 3 }).some((row) => row.type === 'fold'), false);
    assert.equal(rows(parse(long(10))[0], { context: 3 }).find((row) => row.type === 'fold').count, 4);
  });

  it('pairs removals with additions side by side, and marks their words', () => {
    const [file] = parse(GIT);
    const list = rows(file, { view: 'split' });
    const pairs = list.filter((row) => row.type === 'pair');
    assert.deepEqual(pairs.slice(0, 3).map((row) => [row.left?.kind ?? null, row.right?.kind ?? null]), [['ctx', 'ctx'], ['del', 'add'], [null, 'add']]);
    assert.deepEqual(pairs[1].left.marks, [[16, 17]]);
    assert.deepEqual(pairs[1].right.marks, [[16, 17]]);
    assert.equal(list.at(-1).type, 'note', 'no newline at the end, after its line');
  });

  it('counts the lines above a hunk that the diff leaves out', () => {
    const [file] = parse(GIT);
    const hunks = rows(file).filter((row) => row.type === 'hunk');
    assert.equal(hunks[0].gap, null);
    assert.deepEqual(hunks[1].gap, { from: 6, to: 39, count: 34, key: 'g1' });
  });
});

describe('DS.diff.highlighter', () => {
  it('sets the page\'s highlighter and returns the one before', () => {
    const fn = (code) => code;
    assert.equal(highlighter(fn), null);
    assert.equal(highlighter(null), fn);
  });
});
