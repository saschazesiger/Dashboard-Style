/**
 * DS.datefield without a DOM: the layout of the parts in each locale, the
 * hour cycle, typing a digit, zones and wall times, and its registration.
 * The keys, the names and the states in a browser are datefield.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { layout, hourCycle, typeDigit, toInstant, zoneName } from './datefield.js';
import { runtime } from '../../js/core.js';

const kinds = (parts) => parts.map((part) => (part.type === 'literal' ? part.value.replace(/\s/g, ' ') : part.group ? `${part.group}.${part.type}` : part.type));

describe('DS.datefield', () => {
  it('lays the parts out in the order and with the separators of the locale', () => {
    assert.deepEqual(kinds(layout('date', 'en-US')), ['month', '/', 'day', '/', 'year']);
    assert.deepEqual(kinds(layout('date', 'de-DE')), ['day', '.', 'month', '.', 'year']);
    assert.deepEqual(kinds(layout('date', 'ja-JP')), ['year', '/', 'month', '/', 'day']);
    assert.deepEqual(kinds(layout('time', 'en-US')), ['hour', ':', 'minute', ' ', 'dayPeriod']);
    assert.deepEqual(kinds(layout('time', 'de-DE')), ['hour', ':', 'minute']);
    assert.deepEqual(kinds(layout('time', 'de-DE', { seconds: true })), ['hour', ':', 'minute', ':', 'second']);
    assert.deepEqual(kinds(layout('time', 'en-US', { hourCycle: 'h23' })), ['hour', ':', 'minute']);
    const datetime = kinds(layout('datetime', 'en-US'));
    assert.deepEqual(datetime.filter((kind) => !/^\W/.test(kind)), ['month', 'day', 'year', 'hour', 'minute', 'dayPeriod']);
    const range = kinds(layout('range', 'en-US'));
    assert.deepEqual(range, ['start.month', '/', 'start.day', '/', 'start.year', ' – ', 'end.month', '/', 'end.day', '/', 'end.year']);
  });

  it('reads the hour cycle of a locale, and lets the markup name one', () => {
    assert.equal(hourCycle('en-US'), 'h12');
    assert.equal(hourCycle('de-DE'), 'h23');
    assert.equal(hourCycle('en-GB'), 'h23');
    assert.equal(hourCycle('ja-JP', 'h11'), 'h12');
    assert.equal(hourCycle('en-US', 'h24'), 'h23');
  });

  it('types digits: moves on once no further digit fits, starts again past the greatest value', () => {
    assert.deepEqual(typeDigit({ min: 1, max: 12, typed: '', digit: '1' }), { value: 1, typed: '1', done: false });
    assert.deepEqual(typeDigit({ min: 1, max: 12, typed: '1', digit: '2' }), { value: 12, typed: '12', done: true });
    assert.deepEqual(typeDigit({ min: 1, max: 12, typed: '', digit: '4' }), { value: 4, typed: '4', done: true });
    assert.deepEqual(typeDigit({ min: 1, max: 12, typed: '1', digit: '5' }), { value: 5, typed: '5', done: true });
    // A leading zero waits for the next digit.
    assert.deepEqual(typeDigit({ min: 1, max: 31, typed: '', digit: '0' }), { value: null, typed: '0', done: false });
    assert.deepEqual(typeDigit({ min: 1, max: 31, typed: '0', digit: '7' }), { value: 7, typed: '07', done: true });
    assert.deepEqual(typeDigit({ min: 0, max: 59, typed: '', digit: '0' }), { value: 0, typed: '0', done: false });
    // A year takes four digits.
    let year = { typed: '' };
    for (const digit of '2026') year = typeDigit({ min: 1, max: 9999, typed: year.typed, digit, size: 4 });
    assert.deepEqual(year, { value: 2026, typed: '2026', done: true });
  });

  it('turns a wall time into an instant in a zone', () => {
    assert.equal(toInstant('2026-11-04T09:30', 'UTC').toISOString(), '2026-11-04T09:30:00.000Z');
    // Etc/GMT-2 is two hours ahead of UTC.
    assert.equal(toInstant('2026-11-04T09:30', 'Etc/GMT-2').toISOString(), '2026-11-04T07:30:00.000Z');
    assert.equal(toInstant('2026-11-04', 'Etc/GMT+5').toISOString(), '2026-11-04T05:00:00.000Z');
    assert.equal(toInstant('2026-11-04T09:30', 'local').getHours(), 9);
    assert.equal(toInstant('not a time', 'UTC'), null);
  });

  it('names a zone by its offset and its long name', () => {
    const utc = zoneName('UTC', { locale: 'en-US', at: new Date(Date.UTC(2026, 10, 4)) });
    assert.equal(utc.id, 'UTC');
    assert.match(utc.short, /^GMT|UTC/);
    assert.match(utc.long, /Coordinated Universal Time|UTC/);
    assert.match(zoneName('Etc/GMT-2', { locale: 'en-US' }).short, /GMT\+2/);
    assert.ok(zoneName('local').id);
  });

  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('datefield');
    assert.equal(spec.attribute, 'data-ds-datefield');
    assert.ok(spec.attributes.includes('data-ds-datefield-type'));
  });
});
