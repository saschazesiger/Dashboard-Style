/**
 * DS.query: the language (parse, stringify), the structured query and the
 * suggestions, in Node. The field, the tokens, the keys and the saved
 * queries are query.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, stringify, suggest, toQuery } from './query.js';

const KEYS = [
  { key: 'status', label: 'Status', values: ['open', 'pending', 'closed'] },
  { key: 'priority', label: 'Priority', type: 'number' },
  { key: 'assignee', label: 'Assignee', values: [{ value: 'ada', label: 'Ada Lovelace' }, { value: 'grace', label: 'Grace Hopper' }] },
  { key: 'created', type: 'date' },
  { key: 'title' },
];

describe('DS.query.parse', () => {
  it('reads filters, operators, several values, quotes and free words', () => {
    assert.deepEqual(parse('status:open,pending -assignee:ada priority:>=3 printer "paper jam" title:"Front desk"', KEYS), [
      { key: 'status', op: 'is', values: ['open', 'pending'] },
      { key: 'assignee', op: 'not', values: ['ada'] },
      { key: 'priority', op: 'gte', values: ['3'] },
      { key: null, op: 'is', values: ['printer paper jam'] },
      { key: 'title', op: 'is', values: ['Front desk'] },
    ]);
    assert.deepEqual(parse('status:!closed priority:<2 priority:>1 priority:<=4', KEYS).map((term) => term.op), ['not', 'lt', 'gt', 'lte']);
  });

  it('matches keys and listed values without regard to case, and by label', () => {
    assert.deepEqual(parse('STATUS:Open assignee:"grace hopper"', KEYS), [
      { key: 'status', op: 'is', values: ['open'] },
      { key: 'assignee', op: 'is', values: ['grace'] },
    ]);
  });

  it('marks what is no valid filter, and why', () => {
    const invalid = (text) => parse(text, KEYS).map((term) => term.invalid ?? null);
    assert.deepEqual(invalid('state:open'), ['key']);
    assert.deepEqual(invalid('status:done'), ['value']);
    assert.deepEqual(invalid('status:'), ['value']);
    assert.deepEqual(invalid('priority:high'), ['value']);
    assert.deepEqual(invalid('created:2026-13-01 created:2026-11-04'), ['value', null]);
    assert.deepEqual(invalid('status:>open'), ['op']);
    assert.deepEqual(invalid('-priority:>2'), ['op']);
    assert.deepEqual(invalid('priority:>1,2'), ['value']);
  });

  it('takes any key without a list of keys, and nothing from nothing', () => {
    assert.deepEqual(parse('room:"Second floor"'), [{ key: 'room', op: 'is', values: ['Second floor'] }]);
    assert.deepEqual(parse(''), []);
    assert.deepEqual(parse(null), []);
    assert.deepEqual(parse('  '), []);
  });

  it('keeps escaped quotes inside quotes', () => {
    assert.deepEqual(parse('title:"the \\"big\\" one"', KEYS)[0].values, ['the "big" one']);
  });
});

describe('DS.query.stringify', () => {
  it('writes terms that read back the same', () => {
    const text = 'status:open,pending -assignee:ada priority:>=3 printer jam title:"Front desk" title:"a,b"';
    const terms = parse(text, KEYS);
    assert.equal(stringify(terms), 'status:open,pending -assignee:ada priority:>=3 printer jam title:"Front desk" title:"a,b"');
    assert.deepEqual(parse(stringify(terms), KEYS), terms);
  });

  it('quotes free words that would read as a filter', () => {
    const terms = [{ key: null, op: 'is', values: ['status:open is a word'] }];
    assert.equal(stringify(terms), '"status:open" is a word');
    assert.deepEqual(parse(stringify(terms), KEYS), terms);
    assert.equal(stringify([]), '');
  });
});

describe('DS.query.toQuery', () => {
  it('splits valid filters, free text and invalid terms', () => {
    const query = toQuery(parse('status:open printer state:x', KEYS));
    assert.deepEqual(query.filters, [{ key: 'status', op: 'is', values: ['open'] }]);
    assert.equal(query.text, 'printer');
    assert.equal(query.invalid.length, 1);
    assert.equal(query.value, 'status:open printer state:x');
    assert.equal(query.terms.length, 3);
  });
});

describe('DS.query.suggest', () => {
  it('offers keys by name or label, with the free text last', () => {
    const result = suggest('pri', KEYS);
    assert.equal(result.kind, 'keys');
    assert.deepEqual(result.items.map((item) => [item.group, item.text, item.commit]), [['keys', 'priority:', false], ['text', 'pri', true]]);
    assert.deepEqual(suggest('', KEYS).items.map((item) => item.text), ['status:', 'priority:', 'assignee:', 'created:', 'title:']);
    assert.deepEqual(suggest('-st', KEYS).items[0].text, '-status:');
    assert.deepEqual(suggest('ada', KEYS).items.map((item) => item.group), ['text']);
  });

  it('offers the operators of a key that compares, then values', () => {
    assert.deepEqual(suggest('priority:', KEYS).items.map((item) => item.text), ['-priority:', 'priority:>', 'priority:>=', 'priority:<', 'priority:<=']);
    assert.deepEqual(suggest('status:', KEYS).items.map((item) => item.text), ['-status:', 'status:open', 'status:pending', 'status:closed']);
    assert.deepEqual(suggest('priority:>=3', KEYS).items.map((item) => [item.text, item.commit]), [['priority:>=3', true]]);
  });

  it('narrows values by what is typed, by value or label, leaving those already chosen', () => {
    assert.deepEqual(suggest('status:op', KEYS).items.map((item) => item.text), ['status:open']);
    assert.deepEqual(suggest('assignee:hop', KEYS).items.map((item) => [item.text, item.label]), [['assignee:grace', 'Grace Hopper']]);
    assert.deepEqual(suggest('status:open,', KEYS).items.map((item) => item.text), ['status:open,pending', 'status:open,closed']);
    assert.deepEqual(suggest('-status:cl', KEYS).items.map((item) => item.text), ['-status:closed']);
  });

  it('says so for an unknown key', () => {
    assert.deepEqual(suggest('state:o', KEYS), { kind: 'none', key: 'state', items: [] });
  });
});
