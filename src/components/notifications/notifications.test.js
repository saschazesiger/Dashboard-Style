/**
 * DS.notifications' grouping: the day of a time, and groups newest first.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dayOf, groupByDay } from './notifications.js';

// A fixed moment, local time: 5 November 2026, 14:30.
const NOW = new Date(2026, 10, 5, 14, 30).getTime();
const at = (day, hour) => new Date(2026, 10, day, hour, 0).getTime();

describe('DS.notifications.dayOf()', () => {
  it('names today, yesterday and earlier by the calendar day', () => {
    assert.equal(dayOf(at(5, 0), NOW), 'today');
    assert.equal(dayOf(at(5, 13), NOW), 'today');
    assert.equal(dayOf(new Date(at(5, 9)), NOW), 'today');
    assert.equal(dayOf(new Date(at(5, 9)).toISOString(), NOW), 'today');
    assert.equal(dayOf(at(4, 23), NOW), 'yesterday');
    assert.equal(dayOf(at(4, 0), NOW), 'yesterday');
    assert.equal(dayOf(at(3, 23), NOW), 'earlier');
    assert.equal(dayOf(null, NOW), 'earlier');
    assert.equal(dayOf('not a date', NOW), 'earlier');
  });
});

describe('DS.notifications.groupByDay()', () => {
  it('groups by day, newest first, and keeps a named group where its newest item falls', () => {
    const items = [
      { id: 'a', time: at(3, 10) },
      { id: 'b', time: at(5, 9) },
      { id: 'c', time: at(5, 12) },
      { id: 'd', time: at(4, 8) },
      { id: 'e', time: at(5, 11), group: 'Mentions' },
      { id: 'f' },
    ];
    const groups = groupByDay(items, { now: NOW });
    assert.deepEqual(groups.map((group) => group.key), ['today', 'Mentions', 'yesterday', 'earlier']);
    assert.deepEqual(groups.map((group) => group.items.map((item) => item.id)), [['c', 'b'], ['e'], ['d'], ['a', 'f']]);
    assert.deepEqual(groups.map((group) => group.day), [true, false, true, true]);
    assert.deepEqual(items.map((item) => item.id), ['a', 'b', 'c', 'd', 'e', 'f'], 'the given list stays');
    assert.deepEqual(groupByDay([]), []);
  });
});
