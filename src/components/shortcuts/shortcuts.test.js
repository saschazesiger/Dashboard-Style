/**
 * The grouping of the shortcut sheet (DS.shortcuts.byScope): the data of
 * DS.hotkeys.list() by scope, the scope that counts first first, the ones
 * that do not count now after it, 'global' last, each with its groups in
 * order. Loading the module touches no DOM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { byScope, create, open, close, render } from './shortcuts.js';

const item = (description, scope = 'global') => ({ description, scope, active: true, combos: [] });

describe('DS.shortcuts.byScope', () => {
  it('keeps one scope as it is, groups in order', () => {
    const groups = [{ name: 'Editing', items: [item('Save'), item('Undo')] }, { name: 'General', items: [item('Help')] }];
    assert.deepEqual(byScope(groups, ['global']), [{ scope: 'global', groups }]);
  });

  it('splits the groups by scope: the scope that counts first first, then the others, global last', () => {
    const groups = [
      { name: 'Editing', items: [item('Save'), item('Next card', 'board'), item('Zoom', 'map')] },
      { name: 'Cards', items: [item('Move', 'board')] },
    ];
    const found = byScope(groups, ['board', 'global']);
    assert.deepEqual(found.map((entry) => entry.scope), ['board', 'map', 'global']);
    assert.deepEqual(found[0].groups.map((group) => [group.name, group.items.map((one) => one.description)]), [['Editing', ['Next card']], ['Cards', ['Move']]]);
    assert.deepEqual(found[2].groups.map((group) => group.name), ['Editing']);
  });

  it('puts global last even when an exclusive scope leaves it out of the order', () => {
    const groups = [{ name: 'General', items: [item('Help'), item('Exit', 'editor')] }];
    assert.deepEqual(byScope(groups, ['editor']).map((entry) => entry.scope), ['editor', 'global']);
  });

  it('gives nothing for nothing', () => {
    assert.deepEqual(byScope([], ['global']), []);
    assert.deepEqual(byScope([{ name: 'Empty', items: [] }]), []);
  });
});

describe('DS.shortcuts without a DOM', () => {
  it('makes no sheet without its list; open and close resolve', async () => {
    const fake = { querySelector: () => null, ownerDocument: { defaultView: null }, getAttribute: () => null };
    assert.equal(create(fake), null);
    await open(fake);
    assert.equal(typeof close, 'function');
    assert.equal(typeof render, 'function');
  });
});
