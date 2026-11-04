/**
 * DS.combobox without a DOM: its registration, that it needs its parts,
 * and that its timing and strings come from the tokens and t(). The
 * behaviour in a browser is combobox.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as combobox from './combobox.js';
import { runtime, t } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

const source = () => read('src/components/combobox/combobox.js').replace(/\/\*[\s\S]*?\*\//g, '');

describe('DS.combobox', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('combobox');
    assert.equal(spec.attribute, 'data-ds-combobox');
    assert.equal(typeof spec.init, 'function');
  });

  it('makes nothing without its field, popup and list', () => {
    assert.equal(combobox.create(null), null);
    assert.equal(combobox.create({ querySelector: () => null }), null);
  });

  it('waits --ds-delay-loader before a search, unless the page says otherwise, and names no ms of its own', () => {
    assert.match(source(), /motionDuration\(element, '--ds-delay-loader'\)/);
    assert.doesNotMatch(source(), /\b\d+ms\b|setTimeout\([^,]+,\s*\d/);
  });

  it('says what it shows through the system strings', () => {
    for (const key of ['createOption', 'resultsOne', 'resultsOther', 'typeToSearch', 'added', 'removed', 'noResults', 'loading', 'actionFailed', 'remove']) {
      assert.match(source(), new RegExp(`t\\('${key}'|'${key}'`), key);
      assert.notEqual(t(key, { text: 'x', count: 2, label: 'x' }), key, `${key} has a default`);
    }
    assert.equal(t('createOption', { text: 'Tower 9' }), 'Create “Tower 9”');
  });

  it('opens and closes only through DS.overlay', () => {
    assert.match(source(), /import \{ open as openOverlay, close as closeOverlay \} from '\.\.\/\.\.\/js\/overlay\.js';/);
    assert.doesNotMatch(source(), /popup\.hidden = false|showPopover/);
  });

  it('writes no markup of the page\'s text', () => {
    assert.doesNotMatch(source(), /\.innerHTML\s*=|insertAdjacentHTML/);
  });
});
