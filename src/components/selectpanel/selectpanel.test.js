/**
 * DS.selectpanel without a DOM: the button's summary, the registration, and
 * that it opens only through DS.overlay. The behaviour in a browser is
 * selectpanel.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, create } from './selectpanel.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

describe('DS.selectpanel.summarize', () => {
  it('says nothing for none, the names of one or two, a count beyond, and all', () => {
    assert.equal(summarize([], 5), '');
    assert.equal(summarize(['Bug'], 5), 'Bug');
    assert.equal(summarize(['Bug', 'Docs'], 5), 'Bug and Docs');
    assert.equal(summarize(['Bug', 'Docs', 'Lab'], 5), '3 selected');
    assert.equal(summarize(['Bug', 'Docs', 'Lab'], 3), 'All selected');
    // Two of two are their names, not "all".
    assert.equal(summarize(['Bug', 'Docs'], 2), 'Bug and Docs');
  });
});

describe('DS.selectpanel', () => {
  it('registers its behaviour by its attribute and needs its parts', () => {
    const spec = runtime.state('core').specs.get('selectpanel');
    assert.equal(spec.attribute, 'data-ds-selectpanel');
    assert.equal(create(null), null);
    assert.equal(create({ querySelector: () => null }), null);
  });

  it('opens and closes only through DS.overlay, with no ms of its own', () => {
    const source = read('src/components/selectpanel/selectpanel.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(source, /import \{ open as openOverlay, close as closeOverlay \} from '\.\.\/\.\.\/js\/overlay\.js';/);
    assert.doesNotMatch(source, /setTimeout\(|\.innerHTML\s*=/);
  });
});
