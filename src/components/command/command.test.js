/**
 * The search of the command palette (DS.command.fuzzy and rank): letters in
 * order with gaps, word starts and runs first, every word of the query,
 * case and accents aside, the marked ranges, keywords, and the order of
 * equal scores. Loading the module touches no DOM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fuzzy, rank, create, open, close } from './command.js';

describe('DS.command.fuzzy', () => {
  it('matches letters in order, with gaps, and marks them', () => {
    assert.deepEqual(fuzzy('adddev', 'Add a device')?.ranges, [[0, 3], [6, 9]]);
    assert.deepEqual(fuzzy('dev', 'Add a device')?.ranges, [[6, 9]]);
    assert.equal(fuzzy('xyz', 'Add a device'), null);
    assert.equal(fuzzy('ved', 'Add a device'), null, 'the order counts');
  });

  it('takes an empty query as a match of score 0', () => {
    assert.deepEqual(fuzzy('', 'Anything'), { score: 0, ranges: [] });
    assert.deepEqual(fuzzy('   ', 'Anything'), { score: 0, ranges: [] });
  });

  it('ignores case and accents', () => {
    assert.ok(fuzzy('CAFE', 'Café menu'));
    assert.deepEqual(fuzzy('cafe', 'Café menu')?.ranges, [[0, 4]]);
    assert.ok(fuzzy('ÉCRAN', 'ecran'));
  });

  it('needs every word of the query, in any order', () => {
    assert.ok(fuzzy('device add', 'Add a device'));
    assert.equal(fuzzy('device remove', 'Add a device'), null);
    assert.deepEqual(fuzzy('dev add', 'Add a device')?.ranges, [[0, 3], [6, 9]]);
  });

  it('scores word starts, runs and an early match higher', () => {
    const start = fuzzy('set', 'Open settings').score;
    const inner = fuzzy('set', 'Reset the router').score;
    assert.ok(start > inner, 'a word start beats the inside of a word');
    const run = fuzzy('dev', 'Device list').score;
    const spread = fuzzy('dev', 'Drive every volume').score;
    assert.ok(run > spread, 'a run beats letters spread out');
    assert.ok(fuzzy('ol', 'Open laptops').score > fuzzy('ol', 'Tool').score, 'initials of words count');
    assert.ok(fuzzy('device', 'Device').score > fuzzy('device', 'Device inventory of the whole building').score, 'a shorter text wins a tie');
  });

  it('prefers word starts for the marks', () => {
    // "of" could take the o of "Open"; the word "of" is the better match.
    assert.deepEqual(fuzzy('cam', 'Change a monitor')?.ranges, [[0, 1], [7, 8], [9, 10]]);
    assert.deepEqual(fuzzy('ls', 'List settings')?.ranges, [[0, 1], [5, 6]]);
  });

  it('marks within camel case and after signs', () => {
    assert.deepEqual(fuzzy('lt', 'laptopTablet')?.ranges, [[0, 1], [6, 7]]);
    assert.deepEqual(fuzzy('42', 'LAPTOP-0042')?.ranges, [[9, 11]]);
  });

  it('copes with what is no text', () => {
    assert.equal(fuzzy('a', null), null);
    assert.deepEqual(fuzzy(null, 'Text'), { score: 0, ranges: [] });
  });
});

describe('DS.command.rank', () => {
  const commands = [
    { id: 'settings', label: 'Open settings' },
    { id: 'add', label: 'Add device', keywords: ['new', 'create'] },
    { id: 'list', label: 'Device list' },
    { id: 'tickets', label: 'Tickets' },
  ];

  it('keeps every command, in order, for an empty query', () => {
    assert.deepEqual(rank(commands, '').map((entry) => entry.command.id), ['settings', 'add', 'list', 'tickets']);
  });

  it('puts the best match first and leaves out what does not match', () => {
    assert.deepEqual(rank(commands, 'dev').map((entry) => entry.command.id), ['list', 'add']);
  });

  it('finds a command by a keyword, below a label match and without marks', () => {
    const found = rank(commands, 'new');
    assert.deepEqual(found.map((entry) => entry.command.id), ['add']);
    assert.deepEqual(found[0].ranges, []);
    const both = rank([{ id: 'a', label: 'Create', keywords: [] }, { id: 'b', label: 'Other', keywords: ['create'] }], 'create');
    assert.deepEqual(both.map((entry) => entry.command.id), ['a', 'b']);
  });

  it('keeps the given order of equal scores', () => {
    const same = [{ id: 'one', label: 'Same' }, { id: 'two', label: 'Same' }, { id: 'three', label: 'Same' }];
    assert.deepEqual(rank(same, 'same').map((entry) => entry.command.id), ['one', 'two', 'three']);
  });
});

describe('DS.command without a DOM', () => {
  it('makes no palette without its field, and open and close resolve', async () => {
    const fake = { querySelector: () => null, ownerDocument: { defaultView: null }, getAttribute: () => null };
    assert.equal(create(fake), null);
    await open(fake);
    assert.equal(typeof close, 'function');
  });
});
