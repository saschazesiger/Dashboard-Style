/**
 * DS.truncate: the cut at each position and the search for the longest
 * cut that fits. The browser side (measuring, the tip) is truncate.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cut, fit } from './truncate.js';

describe('DS.truncate.cut', () => {
  it('keeps the start, the end or both ends around one ellipsis', () => {
    assert.equal(cut('abcdefghij', 6), 'abcdef…');
    assert.equal(cut('abcdefghij', 6, 'start'), '…efghij');
    assert.equal(cut('abcdefghij', 6, 'middle'), 'abc…hij');
    assert.equal(cut('abcdefghij', 5, 'middle'), 'abc…ij');
    assert.equal(cut('abcdefghij', 0, 'middle'), '…');
  });

  it('returns the text when it keeps all of it, and never cuts a grapheme', () => {
    assert.equal(cut('abc', 3), 'abc');
    assert.equal(cut('abc', 10, 'middle'), 'abc');
    assert.equal(cut('a👩‍💻bc', 2), 'a👩‍💻…');
    assert.equal(cut('éé', 1, 'start'), '…é');
  });

  it('trims the spaces next to the ellipsis', () => {
    assert.equal(cut('one two three', 4), 'one…');
    assert.equal(cut('one two three', 6, 'start'), '…three');
  });
});

describe('DS.truncate.fit', () => {
  it('finds the longest cut that fits, the text when it fits whole', () => {
    const width = (limit) => (text) => [...text].length <= limit;
    assert.equal(fit('abcdefghij', 'middle', width(7)), 'abc…hij');
    assert.equal(fit('abcdefghij', 'middle', width(6)), 'abc…ij');
    assert.equal(fit('abcdefghij', 'start', width(5)), '…ghij');
    assert.equal(fit('abcdefghij', 'end', width(20)), 'abcdefghij');
    assert.equal(fit('abcdefghij', 'end', () => false), '…');
  });
});
