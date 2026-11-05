/**
 * DS.loadmore without a DOM: the status text of each state, the strings it
 * reads, and the registration. The control in a browser is loadmore.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statusText } from './loadmore.js';
import { config, runtime } from '../../js/core.js';

describe('DS.loadmore.statusText', () => {
  it('says how many show, of how many, in the locale', () => {
    config({ locale: 'en' });
    assert.equal(statusText({ loaded: 50, total: 1234, state: 'idle' }), 'Showing 50 of 1,234');
    assert.equal(statusText({ loaded: 50, total: null, state: 'idle' }), 'Showing 50');
    assert.equal(statusText({ loaded: 100, total: 1234, state: 'loading' }), 'Showing 100 of 1,234');
    config({ locale: 'de' });
    assert.equal(statusText({ loaded: 1500, total: 2500, state: 'idle' }), 'Showing 1.500 of 2.500');
    config({ locale: null });
  });

  it('says that everything shows, and a failure in words', () => {
    config({ locale: 'en' });
    assert.equal(statusText({ loaded: 1234, total: 1234, state: 'done' }), 'All 1,234 shown');
    assert.equal(statusText({ loaded: 12, total: null, state: 'done' }), 'All 12 shown');
    assert.equal(statusText({ loaded: 50, total: 80, state: 'error' }), 'Could not load more.');
    assert.equal(statusText({ loaded: null, total: null, state: 'idle' }), '');
    config({ locale: null });
  });

  it('takes the page\'s strings', () => {
    config({ strings: { loadMoreStatus: '{loaded} von {total}' } });
    assert.equal(statusText({ loaded: 5, total: 9, state: 'idle' }), '5 von 9');
    config({ strings: { loadMoreStatus: null } });
  });
});

describe('DS.loadmore registration', () => {
  it('registers its behaviour by data-ds-loadmore and watches its options', () => {
    const spec = runtime.state('core').specs.get('loadmore');
    assert.equal(spec.attribute, 'data-ds-loadmore');
    for (const name of ['loaded', 'total', 'auto', 'for']) assert.ok(spec.attributes.includes(`data-ds-loadmore-${name}`), name);
  });
});
