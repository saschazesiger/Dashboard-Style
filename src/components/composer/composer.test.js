/**
 * DS.composer: the word a palette serves (query()), and the rules of the
 * stylesheet that the options and the palette rest on. The behaviour (send,
 * stop, drafts, attachments, the palettes) is composer.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { query } from './composer.js';
import { read, declarationsOf } from '../../../test/helpers.js';

describe('DS.composer.query', () => {
  it('finds "/" only at the start of the message', () => {
    assert.deepEqual(query('/sum', 4), { trigger: '/', query: 'sum', start: 0, end: 4 });
    assert.deepEqual(query('  /', 3), { trigger: '/', query: '', start: 2, end: 3 });
    assert.equal(query('see /sum', 8), null);
  });

  it('finds "@" at the start or after white space, with the text typed up to the caret', () => {
    assert.deepEqual(query('ask @gr', 7), { trigger: '@', query: 'gr', start: 4, end: 7 });
    assert.deepEqual(query('@ada and more', 4), { trigger: '@', query: 'ada', start: 0, end: 4 });
    assert.deepEqual(query('line\n@', 6), { trigger: '@', query: '', start: 5, end: 6 });
    assert.equal(query('mail@host', 9), null, 'inside a word');
  });

  it('serves no word once the caret left it or another trigger follows', () => {
    assert.equal(query('@ada ', 5), null);
    assert.equal(query('@ada@b', 6), null);
    assert.equal(query('', 0), null);
    assert.equal(query(null, 3), null);
  });

  it('takes the page\'s triggers and clamps the caret', () => {
    assert.deepEqual(query('#12', 3, ['#']), { trigger: '#', query: '12', start: 0, end: 3 });
    assert.equal(query('@ada', 4, ['#']), null);
    assert.deepEqual(query('@ad', 99), { trigger: '@', query: 'ad', start: 0, end: 3 });
  });
});

describe('composer.css', () => {
  const css = read('src/components/composer/composer.css');
  const own = (selector) => Object.fromEntries(declarationsOf(css, selector).map((entry) => [entry.property, entry.value]));

  it('computes the field row from the field height, size, density and touch', () => {
    assert.equal(own('.ds-composer > .ds-composer__input')['--_box'],
      'max(var(--ds-target-min, 0px), calc(var(--ds-input-height, 40px) + var(--ds-size-step, 0) * 8px + var(--ds-density, 0) * 4px))');
    assert.match(own('.ds-composer__option')['min-height'], /^max\(var\(--ds-target-min, 0px\), calc\(var\(--ds-composer-option-height, 40px\)/);
  });

  it('multiplies every radius by the shape', () => {
    for (const selector of ['.ds-composer', '.ds-composer__attachment', '.ds-composer__palette']) {
      assert.match(own(selector)['border-radius'], /\* var\(--ds-shape, 1\)\)$/, selector);
    }
  });

  it('keys the palette motion on data-state: in on the spring, out fading only, faster', () => {
    assert.match(own('.ds-composer__palette[data-state="open"]').transition, /scale var\(--ds-dur-medium\) var\(--ds-ease-spatial\)/);
    assert.match(own('.ds-composer__palette').transition, /^opacity var\(--ds-dur-instant\)/);
  });
});
