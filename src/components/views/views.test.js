/**
 * DS.views without a DOM: the address format of a view's state (toQuery,
 * fromQuery) and the registration. The menu, the store, the dialogs and the
 * address of a page run in views.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toQuery, fromQuery } from './views.js';
import { runtime } from '../../js/core.js';

describe('DS.views.toQuery', () => {
  it('writes the view, every filter value, the sort and the columns, filters in name order', () => {
    const state = { sort: '-seen', columns: ['name', 'status'], filters: { status: ['online', 'offline'], kind: ['laptop'] } };
    assert.equal(toQuery(state, { view: 'mine' }), 'view=mine&kind=laptop&status=online&status=offline&sort=-seen&cols=name%2Cstatus');
  });

  it('keeps a range with an open end, leaves out empty filters and parts, encodes text', () => {
    assert.equal(toQuery({ filters: { storage: ['', '512'], q: [''], owner: [] } }), 'storage=&storage=512');
    assert.equal(toQuery({ filters: { q: ['Ada Lovelace & co'] } }), 'q=Ada+Lovelace+%26+co');
    assert.equal(toQuery({}), '');
    assert.equal(toQuery(null), '');
    assert.equal(toQuery({ filters: { status: 'online' } }), 'status=online');
  });

  it('puts the prefix before every name', () => {
    assert.equal(toQuery({ filters: { status: ['online'] }, sort: 'name' }, { prefix: 'd.', view: 'all' }), 'd.view=all&d.status=online&d.sort=name');
  });
});

describe('DS.views.fromQuery', () => {
  it('reads what toQuery writes', () => {
    const state = { filters: { kind: ['laptop'], status: ['online', 'offline'], storage: ['', '512'] }, sort: '-seen', columns: ['name', 'status'] };
    assert.deepEqual(fromQuery(`?${toQuery(state, { view: 'mine' })}`), { view: 'mine', state });
    assert.deepEqual(fromQuery(new URLSearchParams(toQuery(state))), { view: null, state });
  });

  it('gives null without any of its parameters, and drops empty parts', () => {
    assert.equal(fromQuery(''), null);
    assert.equal(fromQuery('?'), null);
    assert.deepEqual(fromQuery('q=&cols='), { view: null, state: {} });
    assert.deepEqual(fromQuery('view=all'), { view: 'all', state: {} });
  });

  it('with a prefix reads only its own parameters', () => {
    assert.deepEqual(fromQuery('?tab=2&d.status=online&d.sort=-name&status=x', { prefix: 'd.' }), { view: null, state: { filters: { status: ['online'] }, sort: '-name' } });
    assert.equal(fromQuery('?tab=2', { prefix: 'd.' }), null);
    // Without one every parameter but view, sort and cols is a filter.
    assert.deepEqual(fromQuery('?tab=2'), { view: null, state: { filters: { tab: ['2'] } } });
  });

  it('reads a parameter named like a member of Object.prototype as a filter, and leaves the prototype alone', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
      const read = fromQuery(`${name}=1&${name}=2`);
      assert.deepEqual(read, { view: null, state: { filters: { [name]: ['1', '2'] } } });
      assert.equal(toQuery(read.state), `${name}=1&${name}=2`);
    }
    const proto = fromQuery('__proto__=x&status=online');
    assert.deepEqual(proto.state.filters, JSON.parse('{ "__proto__": ["x"], "status": ["online"] }'));
    assert.equal(Object.getPrototypeOf(proto.state.filters), Object.prototype);
    assert.equal(Object.hasOwn(proto.state.filters, '__proto__'), true);
    assert.equal(toQuery(proto.state), '__proto__=x&status=online');
    assert.equal({}.x, undefined);
  });
});

describe('DS.views registration', () => {
  it('registers data-ds-views and watches its options', () => {
    const spec = runtime.state('core').specs.get('views');
    assert.equal(spec.attribute, 'data-ds-views');
    assert.deepEqual(spec.attributes, ['data-ds-views-key', 'data-ds-views-url', 'data-ds-views-prefix']);
  });
});
