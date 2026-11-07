/**
 * DS.unsaved: the snapshot of a form's fields and what differs between two,
 * in Node on small stand-ins for the controls. The bar, the keys, saving,
 * discarding and leaving are unsaved.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { diff, isDirty, snapshot } from './unsaved.js';

const control = (props) => ({ tagName: 'INPUT', type: 'text', name: '', id: '', value: '', hasAttribute: () => false, ...props });
const form = (...elements) => ({ elements });

describe('DS.unsaved.snapshot', () => {
  it('keys each control by its name (or id) and place, and reads its value as text', () => {
    const select = { tagName: 'SELECT', type: 'select-multiple', name: 'rooms', hasAttribute: () => false, options: [{ value: 'a', selected: true }, { value: 'b', selected: false }, { value: 'c', selected: true }] };
    const shot = snapshot(form(
      control({ name: 'name', value: 'LAPTOP-0042' }),
      control({ id: 'note', value: 'x' }),
      control({ name: 'tag', value: '1' }),
      control({ name: 'tag', value: '2' }),
      control({ type: 'checkbox', name: 'alerts', checked: true }),
      control({ type: 'file', name: 'photo', files: [{ name: 'front.jpg' }] }),
      control({ type: 'hidden', name: 'env', value: '{"A":"1"}' }),
      select,
    ));
    assert.deepEqual([...shot].map(([key, entry]) => [key, entry.group, entry.value]), [
      ['name[0]', 'name[0]', 'LAPTOP-0042'],
      ['#note[0]', '#note[0]', 'x'],
      ['tag[0]', 'tag[0]', '1'],
      ['tag[1]', 'tag[1]', '2'],
      ['alerts[0]', 'alerts[0]', 'on'],
      ['photo[0]', 'photo[0]', 'front.jpg'],
      ['env[0]', 'env[0]', '{"A":"1"}'],
      ['rooms[0]', 'rooms[0]', 'a\nc'],
    ]);
  });

  it('puts the radios of a name in one group and leaves out buttons, nameless and ignored controls', () => {
    const shot = snapshot(form(
      control({ type: 'radio', name: 'status', value: 'active', checked: true }),
      control({ type: 'radio', name: 'status', value: 'repair', checked: false }),
      control({ type: 'submit', name: 'go' }),
      { tagName: 'BUTTON', type: 'button', name: 'b', hasAttribute: () => false },
      { tagName: 'FIELDSET', type: 'fieldset', name: 'f', hasAttribute: () => false },
      control({ value: 'no name' }),
      control({ name: 'secret', hasAttribute: (name) => name === 'data-ds-unsaved-ignore' }),
    ));
    assert.deepEqual([...shot.keys()], ['status[0]', 'status[1]']);
    assert.deepEqual([...shot.values()].map((entry) => entry.group), ['status', 'status']);
    assert.equal(snapshot(null).size, 0);
  });
});

describe('DS.unsaved.diff', () => {
  const entries = (pairs) => new Map(pairs.map(([key, group, value]) => [key, { group, value }]));

  it('lists the groups that differ, a radio group once', () => {
    const before = entries([['name[0]', 'name[0]', 'A'], ['status[0]', 'status', 'on'], ['status[1]', 'status', ''], ['tag[0]', 'tag[0]', '1']]);
    const after = entries([['name[0]', 'name[0]', 'B'], ['status[0]', 'status', ''], ['status[1]', 'status', 'on'], ['tag[0]', 'tag[0]', '1']]);
    assert.deepEqual(diff(before, after), ['name[0]', 'status']);
    assert.deepEqual(diff(before, before), []);
  });

  it('counts controls that came or went', () => {
    const before = entries([['a[0]', 'a[0]', ''], ['b[0]', 'b[0]', 'x']]);
    const after = entries([['a[0]', 'a[0]', ''], ['c[0]', 'c[0]', '']]);
    assert.deepEqual(diff(before, after), ['c[0]', 'b[0]']);
  });
});

describe('DS.unsaved.isDirty', () => {
  it('is false without guards and without a DOM', () => {
    assert.equal(isDirty(), false);
  });
});
