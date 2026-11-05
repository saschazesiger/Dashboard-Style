/**
 * DS.highlight: where the terms of a query occur, folding case and accents
 * and joining touching hits. The browser side (the marks) is highlight.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ranges } from './highlight.js';

describe('DS.highlight.ranges', () => {
  it('finds every word of the query, ignoring case', () => {
    assert.deepEqual(ranges('Toner low on printer 7; toner ordered', 'toner'), [[0, 5], [24, 29]]);
    assert.deepEqual(ranges('Toner low on printer 7', 'PRINT toner'), [[0, 5], [13, 18]]);
  });

  it('folds accents and keeps the indices of the text', () => {
    assert.deepEqual(ranges('Café au lait', 'cafe'), [[0, 4]]);
    assert.deepEqual(ranges('Café noir', 'café'), [[0, 5]]);
    assert.deepEqual(ranges('Ünïcode', 'unic'), [[0, 4]]);
  });

  it('joins hits that touch or overlap', () => {
    assert.deepEqual(ranges('aaaa', 'aa'), [[0, 4]]);
    assert.deepEqual(ranges('printer', 'print inter'), [[0, 7]]);
  });

  it('reads the whole query as one in phrase mode', () => {
    assert.deepEqual(ranges('the second floor, second room', 'second floor', { mode: 'phrase' }), [[4, 16]]);
    assert.deepEqual(ranges('the second floor, second room', 'second floor'), [[4, 10], [11, 16], [18, 24]]);
  });

  it('finds nothing for an empty query or text', () => {
    assert.deepEqual(ranges('text', '  '), []);
    assert.deepEqual(ranges('', 'a'), []);
  });
});
