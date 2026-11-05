/**
 * DS.transfer without a DOM: the arithmetic of a move both ways, and the
 * registration. The behaviour in a browser is transfer.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { move, create } from './transfer.js';
import { runtime, t } from '../../js/core.js';

describe('DS.transfer.move', () => {
  it('adds to the end of the target, in the order of the source', () => {
    assert.deepEqual(move(['a', 'b', 'c', 'd'], ['x'], ['d', 'b']), { from: ['a', 'c'], to: ['x', 'b', 'd'] });
  });

  it('goes back to the source in the first order', () => {
    assert.deepEqual(move(['x', 'b', 'd'], ['a', 'c'], ['d', 'b'], ['a', 'b', 'c', 'd', 'x']), { from: ['x'], to: ['a', 'b', 'c', 'd'] });
  });

  it('moves nothing that is not on the side it leaves', () => {
    assert.deepEqual(move(['a'], ['b'], ['b', 'z']), { from: ['a'], to: ['b'] });
  });
});

describe('DS.transfer', () => {
  it('registers its behaviour by its attribute and needs both lists', () => {
    assert.equal(runtime.state('core').specs.get('transfer').attribute, 'data-ds-transfer');
    assert.equal(create(null), null);
    assert.equal(create({ querySelector: () => null }), null);
    assert.equal(t('transferMoved', { count: 3, list: 'Chosen' }), 'Moved 3 to Chosen');
  });
});
