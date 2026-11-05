/**
 * DS.object: the values a ds:save carries. The edit mode runs in real
 * engines: object.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { values, create } from './object.js';

describe('DS.object.values', () => {
  it('maps each name once to its value', () => {
    assert.deepEqual(values([['name', 'LAPTOP-0042'], ['site', 'Building B']]), { name: 'LAPTOP-0042', site: 'Building B' });
  });

  it('turns a repeated name into a list, in order', () => {
    assert.deepEqual(values([['tag', 'a'], ['owner', 'Ada Lovelace'], ['tag', 'b'], ['tag', 'c']]), { tag: ['a', 'b', 'c'], owner: 'Ada Lovelace' });
  });

  it('is empty without entries and keeps names such as __proto__ as data', () => {
    assert.deepEqual(values([]), {});
    const out = values([['__proto__', 'x']]);
    assert.equal(Object.getPrototypeOf(out), Object.prototype);
    assert.equal(Object.getOwnPropertyDescriptor(out, '__proto__').value, 'x');
  });
});

describe('DS.object.create', () => {
  it('is a function of an element', () => {
    assert.equal(typeof create, 'function');
    assert.equal(create.length, 1);
  });
});
