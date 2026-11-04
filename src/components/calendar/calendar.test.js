/**
 * DS.calendar without a DOM: the date engine every picker shares (plain
 * dates, steps, weeks and their numbering, the month grid, the rules of
 * what may be picked, Intl names) and its registration. The grid's keys,
 * names and range preview in a browser are calendar.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as calendar from './calendar.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

const { parse, iso, add, compare, daysIn, weekInfo, weekNumber, grid, available, label, rangeLabel, today } = calendar;

describe('DS.calendar engine', () => {
  it('parses ISO text, dates and plain dates, and refuses days that do not exist', () => {
    assert.deepEqual(parse('2026-11-04'), { year: 2026, month: 11, day: 4 });
    assert.deepEqual(parse('2026-11-04T09:30'), { year: 2026, month: 11, day: 4 });
    assert.deepEqual(parse(new Date(2026, 1, 28)), { year: 2026, month: 2, day: 28 });
    assert.deepEqual(parse({ year: 2028, month: 2, day: 29 }), { year: 2028, month: 2, day: 29 });
    for (const bad of ['2026-02-29', '2026-13-01', '2026-00-10', '04.11.2026', '', null, undefined, new Date('x'), { year: 2026 }]) assert.equal(parse(bad), null, String(bad));
  });

  it('writes ISO text, padded, with an expanded year outside 0000-9999', () => {
    assert.equal(iso({ year: 2026, month: 1, day: 5 }), '2026-01-05');
    assert.equal(iso({ year: 812, month: 12, day: 25 }), '0812-12-25');
    assert.equal(iso({ year: 12026, month: 1, day: 1 }), '+012026-01-01');
    assert.equal(iso(null), '');
  });

  it('steps by years, months and days, keeping the day where the month has it', () => {
    const jan31 = { year: 2026, month: 1, day: 31 };
    assert.deepEqual(add(jan31, { months: 1 }), { year: 2026, month: 2, day: 28 });
    assert.deepEqual(add(jan31, { months: 13 }), { year: 2027, month: 2, day: 28 });
    assert.deepEqual(add({ year: 2028, month: 2, day: 29 }, { years: 1 }), { year: 2029, month: 2, day: 28 });
    assert.deepEqual(add(jan31, { days: 1 }), { year: 2026, month: 2, day: 1 });
    assert.deepEqual(add({ year: 2026, month: 3, day: 1 }, { days: -1 }), { year: 2026, month: 2, day: 28 });
    assert.deepEqual(add({ year: 2026, month: 1, day: 15 }, { months: -1 }), { year: 2025, month: 12, day: 15 });
    // Across a daylight saving change the day count stays whole (UTC day numbers).
    assert.deepEqual(add({ year: 2026, month: 3, day: 28 }, { days: 2 }), { year: 2026, month: 3, day: 30 });
    assert.ok(compare({ year: 2026, month: 1, day: 1 }, { year: 2025, month: 12, day: 31 }) > 0);
    assert.equal(compare(jan31, { ...jan31 }), 0);
    assert.equal(daysIn(2028, 2), 29);
    assert.equal(daysIn(2026, 4), 30);
  });

  it('knows the week of a locale: first day and the days of the first week', () => {
    assert.deepEqual(weekInfo('de-DE'), { firstDay: 1, minimalDays: 4 });
    assert.deepEqual(weekInfo('en-US'), { firstDay: 7, minimalDays: 1 });
    // A language alone takes its likely region (en: US).
    assert.equal(weekInfo('en').firstDay, 7);
    assert.equal(weekInfo('en-GB').firstDay, 1);
    assert.equal(weekInfo('ar-EG').firstDay, 6);
    assert.equal(weekInfo('de', { firstDay: 7 }).firstDay, 7, 'an option overrides');
    assert.equal(weekInfo('not a locale!!').firstDay > 0, true, 'a refused locale still answers');
  });

  it('numbers weeks as ISO 8601 and as the week of January 1st', () => {
    const isoWeeks = { firstDay: 1, minimalDays: 4 };
    // 2026-01-01 is a Thursday: week 1. 2027-01-01 a Friday: still week 53 of 2026.
    assert.equal(weekNumber({ year: 2026, month: 1, day: 1 }, isoWeeks), 1);
    assert.equal(weekNumber({ year: 2026, month: 12, day: 31 }, isoWeeks), 53);
    assert.equal(weekNumber({ year: 2027, month: 1, day: 1 }, isoWeeks), 53);
    assert.equal(weekNumber({ year: 2027, month: 1, day: 4 }, isoWeeks), 1);
    assert.equal(weekNumber({ year: 2026, month: 11, day: 4 }, isoWeeks), 45);
    // 2024-12-30 (a Monday) is week 1 of 2025.
    assert.equal(weekNumber({ year: 2024, month: 12, day: 30 }, isoWeeks), 1);
    const us = { firstDay: 7, minimalDays: 1 };
    assert.equal(weekNumber({ year: 2026, month: 1, day: 1 }, us), 1);
    assert.equal(weekNumber({ year: 2026, month: 1, day: 4 }, us), 2);
    // The week that holds January 1st is week 1, also its days in December.
    assert.equal(weekNumber({ year: 2026, month: 12, day: 31 }, us), 1);
    assert.equal(weekNumber({ year: 2026, month: 12, day: 26 }, us), 52);
  });

  it('lays a month out in six whole weeks from the first day', () => {
    const weeks = grid(2026, 11, 1);
    assert.equal(weeks.length, 6);
    assert.ok(weeks.every((week) => week.length === 7));
    // November 2026 starts on a Sunday: the Monday before is October 26.
    assert.deepEqual(weeks[0][0], { year: 2026, month: 10, day: 26 });
    assert.deepEqual(weeks[0][6], { year: 2026, month: 11, day: 1 });
    const sunday = grid(2026, 11, 7);
    assert.deepEqual(sunday[0][0], { year: 2026, month: 11, day: 1 });
    assert.deepEqual(sunday[5][6], { year: 2026, month: 12, day: 12 });
  });

  it('decides what may be picked: min, max, dates, ranges, weekdays and a function', () => {
    const day = (text) => parse(text);
    assert.equal(available(day('2026-11-04'), { min: '2026-11-04', max: '2026-11-04' }), true);
    assert.equal(available(day('2026-11-03'), { min: '2026-11-04' }), false);
    assert.equal(available(day('2026-11-05'), { max: '2026-11-04' }), false);
    assert.equal(available(day('2026-11-07'), { disabled: '6,7' }), false, 'a Saturday');
    assert.equal(available(day('2026-11-09'), { disabled: '6,7' }), true, 'a Monday');
    assert.equal(available(day('2026-12-25'), { disabled: ['2026-12-24/2026-12-26'] }), false);
    assert.equal(available(day('2026-12-27'), { disabled: ['2026-12-24/2026-12-26'] }), true);
    assert.equal(available(day('2026-11-11'), { disabled: '2026-11-11' }), false);
    assert.equal(available(day('2026-11-11'), { disabled: (date) => date.day === 11 }), false);
    assert.equal(available(day('2026-11-12'), { disabled: (date) => date.day === 11 }), true);
  });

  it('names dates and ranges through Intl', () => {
    assert.equal(label('2026-11-04', { locale: 'en-US' }), 'Wednesday, November 4, 2026');
    assert.equal(label('2026-11-04', { locale: 'de-DE' }), 'Mittwoch, 4. November 2026');
    assert.match(rangeLabel('2026-11-01', '2026-11-07', { locale: 'en-US' }), /^Nov 1\s*–\s*7, 2026$/);
    assert.equal(label('nope'), '');
  });

  it('tells today in a zone', () => {
    const now = Date.UTC(2026, 10, 4, 23, 30);
    assert.deepEqual(today({ timeZone: 'UTC', now }), { year: 2026, month: 11, day: 4 });
    assert.deepEqual(today({ timeZone: 'Etc/GMT-2', now }), { year: 2026, month: 11, day: 5 });
  });
});

describe('DS.calendar grid', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('calendar');
    assert.equal(spec.attribute, 'data-ds-calendar');
    assert.ok(spec.attributes.includes('data-ds-value'));
  });

  it('names no timing and writes no UI text of its own but the two month buttons', () => {
    const source = read('src/components/calendar/calendar.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(source, /\b\d+ms\b|setTimeout/);
    assert.deepEqual([...source.matchAll(/\bt\('(\w+)'\)/g)].map((match) => match[1]).sort(), ['nextMonth', 'previousMonth']);
  });
});
