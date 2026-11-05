/**
 * DS.tree: the rule behind a folder's tri-state check, and the module
 * without a DOM. The browser side is tree.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkState, create } from './tree.js';

describe('DS.tree.checkState', () => {
  it('is true when every child is checked, false when none is, mixed between', () => {
    assert.equal(checkState(['true', 'true']), 'true');
    assert.equal(checkState(['false', 'false']), 'false');
    assert.equal(checkState(['true', 'false']), 'mixed');
    assert.equal(checkState(['false', 'mixed']), 'mixed');
    assert.equal(checkState(['mixed', 'mixed']), 'mixed');
  });

  it('counts a child without a state as not checked', () => {
    assert.equal(checkState([null, undefined, 'false']), 'false');
    assert.equal(checkState(['true', null]), 'mixed');
  });

  it('is null without children, so a folder keeps its own state', () => {
    assert.equal(checkState([]), null);
    assert.equal(checkState(new Set()), null);
  });

  it('takes any iterable', () => {
    assert.equal(checkState(new Set(['true'])), 'true');
    assert.equal(checkState((function* states() { yield 'true'; yield 'false'; })()), 'mixed');
  });
});

describe('DS.tree.create', () => {
  it('returns an inert controller for what is no element, touching nothing', async () => {
    const tree = create(null);
    assert.equal(tree.get(), null);
    assert.equal(tree.item('a'), null);
    assert.equal(tree.check('a'), false);
    assert.equal(await tree.expand('a'), false);
    assert.equal(await tree.reload('a'), false);
    const off = tree.on('toggle', () => {});
    assert.equal(typeof off, 'function');
    tree.destroy();
    tree.destroy();
  });
});
