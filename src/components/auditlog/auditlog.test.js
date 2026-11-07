/**
 * DS.auditlog: the diff of two versions of a record, the entries by day,
 * the filters, and the module without a DOM. The browser side is
 * auditlog.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { changes, group, matches, create } from './auditlog.js';

describe('DS.auditlog.changes', () => {
  it('finds changed, added and removed fields, in the order of the new version, then what only the old one had', () => {
    const before = { name: 'LAPTOP-0042', owner: 'Grace Hopper', phone: '+1 555 0100', retired: false };
    const after = { name: 'LAPTOP-0042', owner: 'Ada Lovelace', room: 'Lab', retired: false };
    assert.deepEqual(changes(before, after), [
      { path: 'owner', field: 'owner', before: 'Grace Hopper', after: 'Ada Lovelace', kind: 'changed' },
      { path: 'room', field: 'room', before: undefined, after: 'Lab', kind: 'added' },
      { path: 'phone', field: 'phone', before: '+1 555 0100', after: undefined, kind: 'removed' },
    ]);
  });

  it('opens nested objects into dotted paths and lists of objects into indexed ones; a list of values is one field', () => {
    const before = { owner: { name: 'Grace Hopper', team: 'Service desk' }, ports: [{ speed: 1 }, { speed: 10 }], tags: ['loan'] };
    const after = { owner: { name: 'Ada Lovelace', team: 'Service desk' }, ports: [{ speed: 1 }, { speed: 25 }], tags: ['loan', 'lab'] };
    assert.deepEqual(changes(before, after).map((change) => [change.path, change.before, change.after]), [
      ['owner.name', 'Grace Hopper', 'Ada Lovelace'],
      ['ports[1].speed', 10, 25],
      ['tags', ['loan'], ['loan', 'lab']],
    ]);
  });

  it('labels paths by `fields` and leaves out `ignore` with what lies under it', () => {
    const list = changes({ owner: { name: 'A', team: 'X' }, updatedAt: 1 }, { owner: { name: 'B', team: 'Y' }, updatedAt: 2 }, { fields: { 'owner.name': 'Owner' }, ignore: ['updatedAt', 'owner.team'] });
    assert.deepEqual(list.map((change) => change.field), ['Owner']);
  });

  it('counts empty, null and missing as one "not set"; equal dates and lists are no change; a whole new record is all added', () => {
    assert.deepEqual(changes({ a: null, b: '' }, { b: undefined, c: null }), []);
    assert.deepEqual(changes({ at: new Date(5) }, { at: new Date(5) }), []);
    assert.deepEqual(changes({ tags: ['a', 'b'] }, { tags: ['a', 'b'] }), []);
    assert.deepEqual(changes(null, { name: 'X', model: 'Y' }).map((change) => change.kind), ['added', 'added']);
    assert.deepEqual(changes({ name: 'X' }, null).map((change) => change.kind), ['removed']);
  });

  it('keeps big integers exact', () => {
    const list = changes({ id: 9007199254740993n }, { id: 9007199254740995n });
    assert.equal(list[0].after, 9007199254740995n);
  });
});

describe('DS.auditlog.group', () => {
  const now = new Date('2026-10-12T16:00:00Z');
  const entries = [
    { id: 'old', at: '2026-10-05T13:10:00Z' },
    { id: 'today-early', at: '2026-10-12T02:00:00Z' },
    { id: 'none' },
    { id: 'yesterday', at: '2026-10-11T17:30:00Z' },
    { id: 'today-late', at: '2026-10-12T14:05:00Z' },
  ];

  it('groups by calendar day, newest first, names today and yesterday, writes other days out; undated last', () => {
    const days = group(entries, { now, timeZone: 'UTC', locale: 'en-GB' });
    assert.deepEqual(days.map((day) => day.key), ['2026-10-12', '2026-10-11', '2026-10-05', '']);
    assert.deepEqual([days[0].label, days[1].label, days[3].label], ['Today', 'Yesterday', 'No date']);
    // Intl writes the day out (the punctuation varies with the ICU data).
    assert.match(days[2].label, /^Monday,? 5 October 2026$/);
    assert.deepEqual(days[0].entries.map((entry) => entry.id), ['today-late', 'today-early']);
  });

  it('turns round with order: oldest, and follows the time zone', () => {
    assert.deepEqual(group(entries, { now, timeZone: 'UTC', order: 'oldest' }).map((day) => day.key), ['2026-10-05', '2026-10-11', '2026-10-12', '']);
    // 02:00 UTC on the 12th is still the 11th in a zone 5 hours behind.
    const behind = group([{ at: '2026-10-12T02:00:00Z' }], { now, timeZone: 'America/Chicago' });
    assert.equal(behind[0].key, '2026-10-11');
  });

  it('takes nothing for nothing', () => {
    assert.deepEqual(group([], { now }), []);
    assert.deepEqual(group(undefined, { now }), []);
  });
});

describe('DS.auditlog at scale', () => {
  const entries = Array.from({ length: 5000 }, (_, index) => ({ id: `e${index}`, at: Date.UTC(2026, 9, 12, 12) - index * 600000, actor: 'Ada Lovelace', action: 'changed', changes: [{ field: 'Owner', before: 'Grace Hopper', after: 'Ada Lovelace' }] }));

  it('groups 5000 entries by day and filters them by day quickly: one day formatter per time zone, not one per entry', () => {
    const start = performance.now();
    const days = group(entries, { now: Date.UTC(2026, 9, 12, 13), timeZone: 'UTC' });
    const passed = entries.filter((entry) => matches(entry, { from: '2026-10-01', to: '2026-10-10' }, { timeZone: 'UTC' }));
    const time = performance.now() - start;
    assert.equal(days.reduce((sum, day) => sum + day.entries.length, 0), 5000);
    assert.equal(days[0].key, '2026-10-12');
    assert.equal(passed.length, 1440);
    assert.ok(time < 1000, `${Math.round(time)}ms`);
  });
});

describe('DS.auditlog.matches', () => {
  const entry = {
    at: '2026-10-12T14:05:00Z',
    actor: { name: 'Ada Lovelace', id: 'ada' },
    action: 'changed',
    target: { label: 'LAPTOP-0042' },
    source: 'Web',
    facets: { kind: 'change', tags: ['lab', 'loan'] },
    changes: [{ field: 'Owner', before: 'Grace Hopper', after: 'Zoë Ada' }],
  };

  it('lets everything through without filters or with empty ones', () => {
    assert.equal(matches(entry), true);
    assert.equal(matches(entry, { text: '', actor: [], kind: null }), true);
  });

  it('text: every word somewhere in what the entry shows, without case or accents', () => {
    assert.equal(matches(entry, { text: 'lovelace laptop' }), true);
    assert.equal(matches(entry, { text: 'grace owner' }), true);
    assert.equal(matches(entry, { text: 'zoe' }), true);
    assert.equal(matches(entry, { text: 'printer' }), false);
  });

  it('a facet by its value or any of a list; an object by its id; the entry\'s own field without facets', () => {
    assert.equal(matches(entry, { kind: 'change' }), true);
    assert.equal(matches(entry, { kind: ['access', 'change'] }), true);
    assert.equal(matches(entry, { kind: 'access' }), false);
    assert.equal(matches(entry, { tags: 'loan' }), true);
    assert.equal(matches(entry, { actor: 'ada' }), true);
    assert.equal(matches(entry, { actor: 'grace' }), false);
    assert.equal(matches(entry, { action: 'changed' }), true);
  });

  it('from and to: whole days, inclusive; an entry without a time fails a date filter', () => {
    assert.equal(matches(entry, { from: '2026-10-12' }, { timeZone: 'UTC' }), true);
    assert.equal(matches(entry, { from: '2026-10-13' }, { timeZone: 'UTC' }), false);
    assert.equal(matches(entry, { to: '2026-10-12' }, { timeZone: 'UTC' }), true);
    assert.equal(matches(entry, { to: '2026-10-11' }, { timeZone: 'UTC' }), false);
    assert.equal(matches({ actor: 'X' }, { from: '2026-10-01' }), false);
  });
});

describe('DS.auditlog.create without a DOM', () => {
  it('returns an inert controller', () => {
    const log = create(null);
    assert.deepEqual(log.get(), []);
    assert.deepEqual(log.count(), { shown: 0, total: 0 });
    assert.equal(typeof log.on('filter', () => {}), 'function');
    log.destroy();
  });
});
