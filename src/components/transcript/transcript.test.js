/**
 * DS.transcript: the label of a day separator (day()), and the rules of the
 * stylesheet. Sticking to the end, the pill, loading earlier messages and
 * the announcements are transcript.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { day } from './transcript.js';
import { read, declarationsOf } from '../../../test/helpers.js';

describe('DS.transcript.day', () => {
  const now = new Date(2026, 10, 5, 14, 30);

  it('says today and yesterday in Intl\'s words, upper case first', () => {
    assert.equal(day(new Date(2026, 10, 5, 0, 1), { now, locale: 'en' }), 'Today');
    assert.equal(day(new Date(2026, 10, 4, 23, 59), { now, locale: 'en' }), 'Yesterday');
    assert.equal(day(new Date(2026, 10, 4, 12), { now, locale: 'de' }), 'Gestern');
  });

  it('names the weekday within the last week, else the date', () => {
    assert.equal(day(new Date(2026, 10, 2, 9), { now, locale: 'en' }), 'Monday');
    assert.equal(day(new Date(2026, 9, 20, 9), { now, locale: 'en' }), 'Tue, Oct 20');
  });

  it('adds the year for another year, and reads timestamps and date texts', () => {
    assert.equal(day(new Date(2025, 11, 31, 9), { now, locale: 'en' }), 'Wed, Dec 31, 2025');
    assert.equal(day(new Date(2026, 10, 5, 8).getTime(), { now, locale: 'en' }), 'Today');
    assert.equal(day('2026-11-04T12:00', { now, locale: 'en' }), 'Yesterday');
  });

  it('is empty for what is no date, and survives a locale the engine refuses', () => {
    for (const value of ['', 'soon', null, undefined, NaN]) assert.equal(day(value, { now, locale: 'en' }), '', String(value));
    assert.equal(day(new Date(2026, 10, 5), { now, locale: 'not a locale!' }).length > 0, true);
  });
});

describe('transcript.css', () => {
  const css = read('src/components/transcript/transcript.css');
  const own = (selector) => Object.fromEntries(declarationsOf(css, selector).map((entry) => [entry.property, entry.value]));

  it('keeps what is on screen in place itself, and rests a short conversation at the bottom', () => {
    assert.equal(own('.ds-transcript')['overflow-anchor'], 'none');
    assert.equal(own('.ds-transcript__list')['margin-block-start'], 'auto');
  });

  it('steps the gap between messages with the density', () => {
    assert.equal(own('.ds-transcript__list').gap, 'max(var(--ds-space-2), calc(var(--ds-transcript-gap, 24px) + var(--ds-density, 0) * 4px))');
  });
});
