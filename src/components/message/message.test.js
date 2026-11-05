/**
 * DS.message: the states a value names, and the stylesheet's rules for the
 * roles and the states. The behaviour (append, notes, copy) is
 * message.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { state } from './message.js';
import { read, declarationsOf } from '../../../test/helpers.js';

describe('DS.message.state', () => {
  it('names the four states, in any case and with white space', () => {
    assert.equal(state('streaming'), 'streaming');
    assert.equal(state(' Partial '), 'partial');
    assert.equal(state('ERROR'), 'error');
    assert.equal(state('done'), 'done');
  });

  it('is done for an empty, unknown or missing value', () => {
    for (const value of ['', 'thinking', null, undefined, 3, {}]) assert.equal(state(value), 'done', String(value));
  });
});

describe('message.css', () => {
  const css = read('src/components/message/message.css');
  // The first rule of a selector wins here: the forced-colours block comes later.
  const own = (selector) => Object.fromEntries(declarationsOf(css, selector).reverse().map((entry) => [entry.property, entry.value]));

  it('puts the user at the end side, in a bubble whose radius follows the shape', () => {
    assert.equal(own('.ds-message--user')['flex-direction'], 'row-reverse');
    const bubble = own('.ds-message--user .ds-message__content');
    assert.equal(bubble['border-radius'], 'calc(var(--ds-message-radius, var(--ds-radius-xl)) * var(--ds-shape, 1))');
    assert.equal(bubble['max-inline-size'], 'var(--ds-message-user-max, 80%)');
    assert.equal(bubble['white-space'], 'pre-wrap');
  });

  it('keeps the footer\'s room while a reply streams, so nothing moves when it comes', () => {
    assert.equal(own('.ds-message[data-state="streaming"] .ds-message__footer').visibility, 'hidden');
  });

  it('shows a failed reply by an icon and a word in the error ink, never the colour alone', () => {
    assert.equal(own('.ds-message[data-state="error"] .ds-message__note').color, 'var(--ds-on-error-container)');
    assert.equal(own('.ds-message[data-state="error"] .ds-message__note > svg').color, 'var(--ds-error)');
  });

  it('computes the avatar from the size and the gaps from the density', () => {
    assert.equal(own('.ds-message__avatar')['--_avatar'], 'max(16px, calc(var(--ds-message-avatar-size, 32px) + var(--ds-size-step, 0) * 8px))');
    assert.match(own('.ds-message')['--_gap'], /var\(--ds-density, 0\) \* 2px/);
  });
});
