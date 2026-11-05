/**
 * DS.wheel: the hold's arithmetic and the hooks' choice of what to turn, on
 * stand-in elements (no DOM in Node). The motion itself is wheel.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, hooks, roll, turnAt } from './wheel.js';

describe('DS.wheel.turnAt', () => {
  it('turns at once the first time', () => {
    assert.equal(turnAt(-Infinity, 1000, 900, true), 1000);
    assert.equal(turnAt(-Infinity, 1000, 900, false), 1000);
  });

  it('waits out the hold of the line that showed: a change 200ms after a roll waits the hold minus 200ms', () => {
    assert.equal(turnAt(1000, 1200, 900, true) - 1200, 700);
  });

  it('turns at once after the hold', () => {
    assert.equal(turnAt(1000, 2500, 900, true), 2500);
  });

  it('takes the waiting line\'s time when that line never showed: no second hold', () => {
    assert.equal(turnAt(1900, 1300, 900, false), 1900);
    assert.equal(turnAt(1900, 2000, 900, false), 2000);
  });
});

describe('DS.wheel.hooks', () => {
  it('leaves nodes outside a wheel to the morph', () => {
    const node = { parentElement: { classList: { contains: () => false } } };
    assert.equal(hooks.onRemove(node), undefined);
    assert.doesNotThrow(() => hooks.onInsert(node));
    assert.equal(hooks.onRemove({ parentElement: null }), undefined);
  });

  it('is frozen, so a page merges it instead of changing it', () => {
    assert.ok(Object.isFrozen(hooks));
    assert.deepEqual(Object.keys(hooks).sort(), ['onInsert', 'onRemove']);
  });
});

describe('DS.wheel.roll and create without a DOM', () => {
  it('does nothing without a slot', async () => {
    assert.equal(await roll(null, 'Thinking'), undefined);
    assert.equal(await roll({}, 'Thinking'), undefined);
  });

  it('exports the controller factory', () => {
    assert.equal(typeof create, 'function');
  });
});
