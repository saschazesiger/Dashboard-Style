/**
 * DS.form: the count behind a field's counter (a pure function) and a
 * counter without a page. The browser side is form.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { count, counter } from './form.js';

describe('DS.form.count', () => {
  it('counts against a limit', () => {
    assert.deepEqual(count('Dock in room B', 200), { length: 14, max: 200, remaining: 186, over: false });
    assert.deepEqual(count('abc', 3), { length: 3, max: 3, remaining: 0, over: false });
    assert.deepEqual(count('abcd', 3), { length: 4, max: 3, remaining: -1, over: true });
  });

  it('counts only without a limit', () => {
    for (const max of [null, undefined, '', -1, 'x']) assert.deepEqual(count('abc', max), { length: 3, max: null, remaining: null, over: false }, String(max));
  });

  it('counts what maxlength counts: UTF-16 code units', () => {
    assert.equal(count('😀', 10).length, 2);
    assert.equal(count('é', 10).length, 1);
    assert.equal(count(null, 10).length, 0);
  });

  it('takes a limit given as text, rounded down', () => {
    assert.equal(count('ab', '5').max, 5);
    assert.equal(count('ab', 5.9).max, 5);
  });
});

describe('DS.form.counter', () => {
  it('counts a field without a counter element or a document', () => {
    const field = {
      value: 'abc',
      getAttribute: (name) => (name === 'maxlength' ? '10' : null),
      hasAttribute: () => false,
      dispatchEvent: () => true,
    };
    const made = counter(field);
    assert.deepEqual(made.get(), { length: 3, max: 10, remaining: 7, over: false });
    made.set('abcdefghijk');
    assert.equal(made.get().remaining, -1);
    assert.equal(typeof made.on('nonsense', () => {}), 'function');
    made.destroy();
    made.destroy();
  });
});
