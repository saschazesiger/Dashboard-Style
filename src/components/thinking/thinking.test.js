/**
 * DS.thinking: parsing the start, formatting the time and the tokens. The
 * clock, the wheel and the parts are thinking.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../../js/core.js';
import { create, elapsedText, isoDuration, sinceOf, tokensText } from './thinking.js';

describe('DS.thinking.sinceOf', () => {
  it('reads timestamps, numeric texts, date texts and dates', () => {
    assert.equal(sinceOf(1700000000000), 1700000000000);
    assert.equal(sinceOf('1700000000000'), 1700000000000);
    assert.equal(sinceOf('2026-11-05T09:00:00Z'), Date.UTC(2026, 10, 5, 9));
    assert.equal(sinceOf(new Date(Date.UTC(2026, 10, 5))), Date.UTC(2026, 10, 5));
  });

  it('gives null for nothing and for what is no date', () => {
    for (const value of [null, undefined, '', 'soon', new Date(Number.NaN)]) assert.equal(sinceOf(value), null);
  });
});

describe('DS.thinking.elapsedText', () => {
  it('shows whole seconds, narrow, cut not rounded', () => {
    config({ locale: 'en' });
    assert.equal(elapsedText(0), '0s');
    assert.equal(elapsedText(12999), '12s');
    assert.equal(elapsedText(65000), '1m 5s');
    assert.equal(elapsedText(3725000), '1h 2m');
    config({ locale: null });
  });

  it('never goes below zero', () => {
    config({ locale: 'en' });
    assert.equal(elapsedText(-5000), '0s');
    config({ locale: null });
  });
});

describe('DS.thinking.isoDuration', () => {
  it('writes ISO 8601 durations for datetime', () => {
    assert.equal(isoDuration(0), 'PT0S');
    assert.equal(isoDuration(12400), 'PT12S');
    assert.equal(isoDuration(65000), 'PT1M5S');
    assert.equal(isoDuration(3600000), 'PT1H');
    assert.equal(isoDuration(3725000), 'PT1H2M5S');
    assert.equal(isoDuration(Number.NaN), 'PT0S');
  });
});

describe('DS.thinking.tokensText', () => {
  it('counts compact, with the plural of the locale', () => {
    config({ locale: 'en' });
    assert.equal(tokensText(1), '1 token');
    assert.equal(tokensText(0), '0 tokens');
    assert.equal(tokensText(980), '980 tokens');
    assert.equal(tokensText(1240), '1.2K tokens');
    assert.equal(tokensText('2048'), '2K tokens');
    config({ locale: null });
  });

  it('takes the page\'s strings', () => {
    config({ locale: 'en', strings: { tokensOther: '{count} Token' } });
    assert.equal(tokensText(5), '5 Token');
    config({ locale: null, strings: { tokensOther: null } });
  });

  it('shows nothing for no count', () => {
    for (const value of [null, undefined, '', 'many', -1]) assert.equal(tokensText(value), '');
  });
});

describe('DS.thinking.create', () => {
  it('is the controller factory', () => {
    assert.equal(typeof create, 'function');
  });
});
