/**
 * DS.filterbar without a DOM: the rules that turn named controls into
 * filters and back (read, write), on stand-ins of the controls, and the
 * registration. Chips, folding and the sheet run in filterbar.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { read, write } from './filterbar.js';
import { runtime } from '../../js/core.js';

/** A stand-in of an input, select or textarea, enough for read() and write(). */
function control(props) {
  const attrs = props.attrs ?? {};
  const node = {
    tagName: props.tag ?? 'INPUT',
    type: props.type ?? 'text',
    name: props.name,
    value: props.value ?? '',
    checked: props.checked ?? false,
    disabled: props.disabled ?? false,
    multiple: props.multiple ?? false,
    getAttribute: (name) => attrs[name] ?? null,
  };
  if (props.options) {
    node.options = props.options.map(([value, selected]) => ({ value, selected: Boolean(selected) }));
    Object.defineProperty(node, 'selectedOptions', { get: () => node.options.filter((option) => option.selected) });
    Object.defineProperty(node, 'selectedIndex', {
      get: () => node.options.findIndex((option) => option.selected),
      set: (index) => node.options.forEach((option, at) => { option.selected = at === index; }),
    });
  }
  return node;
}

const root = (nodes) => ({ querySelectorAll: () => nodes });

describe('DS.filterbar.read', () => {
  it('gives each filter as a list of strings and leaves empty ones out', () => {
    const nodes = [
      control({ type: 'search', name: 'q', value: ' fan ' }),
      control({ type: 'checkbox', name: 'status', value: 'online', checked: true }),
      control({ type: 'checkbox', name: 'status', value: 'offline' }),
      control({ type: 'checkbox', name: 'status', value: 'repair', checked: true }),
      control({ type: 'radio', name: 'kind', value: 'laptop' }),
      control({ type: 'radio', name: 'kind', value: 'tablet', checked: true }),
      control({ tag: 'SELECT', name: 'site', options: [['', true], ['a'], ['b']] }),
      control({ tag: 'SELECT', name: 'tag', multiple: true, options: [['x', true], ['y'], ['z', true]] }),
      control({ type: 'checkbox', name: 'mine', checked: true }),
      control({ type: 'text', name: 'owner', value: '   ' }),
      control({ type: 'button', name: 'go', value: 'x' }),
      control({ type: 'text', name: 'off', value: 'x', disabled: true }),
    ];
    assert.deepEqual(read(root(nodes)), { q: ['fan'], status: ['online', 'repair'], kind: ['tablet'], tag: ['x', 'z'], mine: ['on'] });
  });

  it('reads two bounds of one name as a range, open ends empty', () => {
    const range = (min, max) => [
      control({ type: 'number', name: 'storage', value: min, attrs: { 'data-ds-filter-bound': 'min' } }),
      control({ type: 'number', name: 'storage', value: max, attrs: { 'data-ds-filter-bound': 'max' } }),
    ];
    assert.deepEqual(read(root(range('256', '1024'))), { storage: ['256', '1024'] });
    assert.deepEqual(read(root(range('256', ''))), { storage: ['256', ''] });
    assert.deepEqual(read(root(range('', '64'))), { storage: ['', '64'] });
    assert.deepEqual(read(root(range('', ''))), {});
  });
});

describe('DS.filterbar.write', () => {
  it('sets the controls, empties the names left out, and returns those that changed', () => {
    const q = control({ type: 'search', name: 'q', value: 'fan' });
    const online = control({ type: 'checkbox', name: 'status', value: 'online', checked: true });
    const offline = control({ type: 'checkbox', name: 'status', value: 'offline' });
    const site = control({ tag: 'SELECT', name: 'site', options: [['', true], ['a'], ['b']] });
    const min = control({ type: 'number', name: 'storage', attrs: { 'data-ds-filter-bound': 'min' } });
    const max = control({ type: 'number', name: 'storage', value: '9', attrs: { 'data-ds-filter-bound': 'max' } });
    const nodes = [q, online, offline, site, min, max];
    const changed = write(root(nodes), { status: ['offline'], site: 'b', storage: ['64', ''] });
    assert.deepEqual(read(root(nodes)), { status: ['offline'], site: ['b'], storage: ['64', ''] });
    assert.deepEqual(changed, [q, online, offline, site, min, max]);
    assert.deepEqual(write(root(nodes), { status: ['offline'], site: ['b'], storage: ['64', ''] }), []);
    // A select without the value falls back to its empty option; nothing set: back to it too.
    write(root(nodes), { site: ['nope'] });
    assert.equal(site.selectedIndex, -1);
    write(root(nodes), {});
    assert.equal(site.selectedIndex, 0);
    assert.deepEqual(read(root(nodes)), {});
  });

  it('round-trips what read() gives', () => {
    const nodes = [
      control({ type: 'checkbox', name: 'a', value: '1' }),
      control({ type: 'checkbox', name: 'a', value: '2' }),
      control({ type: 'text', name: 'b' }),
    ];
    const filters = { a: ['2'], b: ['x y'] };
    write(root(nodes), filters);
    assert.deepEqual(read(root(nodes)), filters);
  });
});

describe('DS.filterbar registration', () => {
  it('registers data-ds-filterbar and watches its sheet option', () => {
    const spec = runtime.state('core').specs.get('filterbar');
    assert.equal(spec.attribute, 'data-ds-filterbar');
    assert.deepEqual(spec.attributes, ['data-ds-filterbar-sheet']);
  });
});
