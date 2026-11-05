/**
 * DS.feedback: the toggle rule and when the reason dialog asks. The
 * buttons, the dialog and the events are feedback.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asks, toggle } from './feedback.js';

describe('DS.feedback.toggle', () => {
  it('turns the pressed value on, and off when it was on', () => {
    assert.equal(toggle(null, 'up'), 'up');
    assert.equal(toggle('up', 'down'), 'down');
    assert.equal(toggle('down', 'down'), null);
  });
});

describe('DS.feedback.asks', () => {
  it('asks for a thumb down by default', () => {
    assert.equal(asks('down'), true);
    assert.equal(asks('up'), false);
    assert.equal(asks('down', ''), true);
  });

  it('follows the page\'s rule, and never for no value', () => {
    assert.equal(asks('up', 'up'), true);
    assert.equal(asks('down', 'up'), false);
    assert.equal(asks('up', 'both'), true);
    assert.equal(asks(null, 'both'), false);
  });
});
