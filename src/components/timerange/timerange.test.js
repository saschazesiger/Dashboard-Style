/**
 * DS.timerange without a DOM: the URL-friendly values (relative with
 * rounding, absolute, epoch), ranges, spans, names and the query string,
 * and its registration. The popover, the refresh and the recent ranges in
 * a browser are timerange.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, resolve, spanMs, label, query } from './timerange.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

// A Wednesday afternoon, local time.
const NOW = new Date(2026, 10, 4, 15, 42, 30, 250);

describe('DS.timerange', () => {
  it('parses relative values from now, with a rounding unit', () => {
    assert.equal(parse('now', { now: NOW }).getTime(), NOW.getTime());
    assert.equal(parse('now-15m', { now: NOW }).getTime(), NOW.getTime() - 15 * 60000);
    assert.equal(parse('now+1h', { now: NOW }).getTime(), NOW.getTime() + 3600000);
    assert.equal(parse('now-1d-2h', { now: NOW }).getTime(), new Date(2026, 10, 3, 13, 42, 30, 250).getTime());
    assert.equal(parse('now-1M', { now: NOW }).getMonth(), 9);
    assert.equal(parse('now/d', { now: NOW }).getTime(), new Date(2026, 10, 4).getTime());
    assert.equal(parse('now/d', { now: NOW, roundUp: true }).getTime(), new Date(2026, 10, 5).getTime() - 1);
    assert.equal(parse('now-1d/d', { now: NOW }).getTime(), new Date(2026, 10, 3).getTime());
    assert.equal(parse('now/M', { now: NOW }).getTime(), new Date(2026, 10, 1).getTime());
    assert.equal(parse('now/y', { now: NOW }).getTime(), new Date(2026, 0, 1).getTime());
    // Weeks start on the first day given (a Monday here: November 2nd).
    assert.equal(parse('now/w', { now: NOW, firstDay: 1 }).getTime(), new Date(2026, 10, 2).getTime());
    assert.equal(parse('now/w', { now: NOW, firstDay: 7 }).getTime(), new Date(2026, 10, 1).getTime());
    assert.equal(parse('now/h', { now: NOW }).getTime(), new Date(2026, 10, 4, 15).getTime());
  });

  it('parses absolute values: instants with an offset, wall times in a zone, epoch milliseconds', () => {
    assert.equal(parse('2026-11-04T09:00:00Z').toISOString(), '2026-11-04T09:00:00.000Z');
    assert.equal(parse('2026-11-04T09:00+02:00').toISOString(), '2026-11-04T07:00:00.000Z');
    assert.equal(parse('2026-11-04T09:00', { timeZone: 'UTC' }).toISOString(), '2026-11-04T09:00:00.000Z');
    assert.equal(parse('2026-11-04', { timeZone: 'UTC' }).toISOString(), '2026-11-04T00:00:00.000Z');
    assert.equal(parse('1793782800000').getTime(), 1793782800000);
    for (const bad of ['', 'yesterday', 'now-', 'now-5x', 'now/q', '2026-13-01', null]) assert.equal(parse(bad, { now: NOW }), null, String(bad));
  });

  it('resolves a range, a rounded "to" to the end of its unit', () => {
    const today = resolve({ from: 'now/d', to: 'now/d' }, { now: NOW });
    assert.equal(today.start.getTime(), new Date(2026, 10, 4).getTime());
    assert.equal(today.end.getTime(), new Date(2026, 10, 5).getTime() - 1);
    const hour = resolve({ from: 'now-1h' }, { now: NOW });
    assert.equal(hour.end.getTime() - hour.start.getTime(), 3600000);
    assert.equal(resolve({ from: 'nonsense' }, { now: NOW }), null);
  });

  it('rounds and steps in the calendar of its zone, not the browser\'s', () => {
    // A browser east of UTC: its midnight is 23:00 UTC the day before.
    const before = process.env.TZ;
    process.env.TZ = 'Europe/Zurich';
    try {
      const now = Date.UTC(2026, 10, 5, 10, 0);
      assert.equal(new Date(now).getTimezoneOffset(), -60, 'the zone took');
      const today = resolve({ from: 'now/d', to: 'now/d' }, { now, timeZone: 'UTC' });
      assert.deepEqual([today.start.toISOString(), today.end.toISOString()], ['2026-11-05T00:00:00.000Z', '2026-11-05T23:59:59.999Z']);
      const yesterday = resolve({ from: 'now-1d/d', to: 'now-1d/d' }, { now, timeZone: 'UTC' });
      assert.equal(yesterday.start.toISOString(), '2026-11-04T00:00:00.000Z');
      assert.equal(parse('now/w', { now, timeZone: 'UTC', firstDay: 1 }).toISOString(), '2026-11-02T00:00:00.000Z');
      assert.equal(parse('now/M', { now, timeZone: 'UTC', roundUp: true }).toISOString(), '2026-11-30T23:59:59.999Z');
      assert.equal(parse('now-1M/M', { now, timeZone: 'UTC' }).toISOString(), '2026-10-01T00:00:00.000Z');
      // Local time without a zone, as before; a day with a change of clocks has its 25 hours.
      assert.equal(parse('now/d', { now }).toISOString(), '2026-11-04T23:00:00.000Z');
      const long = resolve({ from: 'now/d', to: 'now/d' }, { now: Date.UTC(2026, 10, 1, 12), timeZone: 'America/New_York' });
      assert.deepEqual([long.start.toISOString(), long.end.toISOString()], ['2026-11-01T04:00:00.000Z', '2026-11-02T04:59:59.999Z']);
    } finally {
      if (before === undefined) delete process.env.TZ;
      else process.env.TZ = before;
    }
  });

  it('reads spans of the refresh interval', () => {
    assert.equal(spanMs('5s'), 5000);
    assert.equal(spanMs('15m'), 900000);
    assert.equal(spanMs('1h'), 3600000);
    assert.equal(spanMs(''), 0);
    assert.equal(spanMs('off'), 0);
    assert.equal(spanMs('1M'), 0, 'months are no interval');
  });

  it('names ranges for people through Intl', () => {
    assert.equal(label({ from: 'now-15m', to: 'now' }, { locale: 'en-US' }), 'Last 15 minutes');
    assert.equal(label({ from: 'now-1h' }, { locale: 'en-US' }), 'Last 1 hour');
    assert.equal(label({ from: 'now-7d', to: 'now' }, { locale: 'en-US' }), 'Last 7 days');
    assert.equal(label({ from: 'now/d', to: 'now/d' }, { locale: 'en-US' }), 'Today');
    assert.equal(label({ from: 'now-1d/d', to: 'now-1d/d' }, { locale: 'en-US' }), 'Yesterday');
    assert.equal(label({ from: 'now/w', to: 'now/w' }, { locale: 'en-US' }), 'This week');
    assert.equal(label({ from: 'now/d', to: 'now/d' }, { locale: 'de' }), 'Heute');
    const absolute = label({ from: '2026-11-04T09:00:00Z', to: '2026-11-04T17:00:00Z' }, { locale: 'en-US', timeZone: 'UTC' });
    assert.match(absolute, /Nov 4, 2026, 9:00\s?AM\s*–\s*5:00\s?PM/);
  });

  it('writes the range as a query string for the address', () => {
    assert.equal(query({ from: 'now-1h', to: 'now' }), 'from=now-1h&to=now');
    assert.equal(query({ from: 'now-6h', to: 'now', refresh: '30s' }), 'from=now-6h&to=now&refresh=30s');
    assert.equal(query({ from: '2026-11-04T09:00:00Z', to: 'now' }), 'from=2026-11-04T09%3A00%3A00Z&to=now');
    const back = new URLSearchParams(query({ from: 'now/d', to: 'now/d', refresh: '1m' }));
    assert.deepEqual([back.get('from'), back.get('to'), back.get('refresh')], ['now/d', 'now/d', '1m']);
  });

  it('registers its behaviour, and refreshes on the page\'s one clock', () => {
    assert.equal(runtime.state('core').specs.get('timerange').attribute, 'data-ds-timerange');
    const source = read('src/components/timerange/timerange.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(source, /stopClock = clock\(/);
    assert.doesNotMatch(source, /setInterval|setTimeout/);
  });
});
