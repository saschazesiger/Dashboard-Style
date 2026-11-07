/**
 * DS.datagrid without a DOM: the client pipeline (query: filter, sort, tree,
 * groups, page), the CSV writer and the summaries, and the registration. The
 * grid itself in a browser is datagrid.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { query, csv, summary, create } from './datagrid.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

const columns = [
  { key: 'name', label: 'Device' },
  { key: 'model', label: 'Model' },
  { key: 'load', label: 'Load', type: 'number' },
  { key: 'bought', label: 'Bought', type: 'date' },
];

const rows = [
  { id: 'd1', name: 'LAPTOP-0100', model: 'Laptop 14', load: 37, bought: '2023-04-01' },
  { id: 'd2', name: 'LAPTOP-0107', model: 'Laptop 13', load: 74, bought: '2021-01-12' },
  { id: 'd3', name: 'DESKTOP-0114', model: 'Desktop 7', load: null, bought: '2022-07-30' },
  { id: 'd4', name: 'LAPTOP-0121', model: 'Laptop 14', load: 8, bought: '2024-02-14' },
  { id: 'd5', name: 'laptop-0009', model: 'Laptop 13', load: 74, bought: '' },
];

const keys = (result) => result.items.map((item) => item.key);

describe('DS.datagrid.query: filter', () => {
  it('passes every row without a filter, keyed by id', () => {
    const result = query(rows, { columns });
    assert.deepEqual(keys(result), ['d1', 'd2', 'd3', 'd4', 'd5']);
    assert.equal(result.total, 5);
    assert.equal(result.filtered.length, 5);
  });

  it('matches text in any filterable column, ignoring case and outer space', () => {
    assert.deepEqual(keys(query(rows, { columns, filter: '  laptop 13 ' })), ['d2', 'd5']);
    assert.deepEqual(keys(query(rows, { columns: columns.map((column) => (column.key === 'model' ? { ...column, filterable: false } : column)), filter: 'laptop 13' })), []);
    assert.deepEqual(keys(query(rows, { columns, filter: '   ' })), ['d1', 'd2', 'd3', 'd4', 'd5']);
  });

  it('takes a function of the row, or a value, a list or a function per column', () => {
    assert.deepEqual(keys(query(rows, { columns, filter: (row) => row.load > 50 })), ['d2', 'd5']);
    assert.deepEqual(keys(query(rows, { columns, filter: { model: 'Laptop 14' } })), ['d1', 'd4']);
    assert.deepEqual(keys(query(rows, { columns, filter: { model: ['Laptop 13', 'Desktop 7'] } })), ['d2', 'd3', 'd5']);
    assert.deepEqual(keys(query(rows, { columns, filter: { load: (value) => value !== null && value < 40 } })), ['d1', 'd4']);
    assert.deepEqual(keys(query(rows, { columns, filter: { model: [], load: '' } })), ['d1', 'd2', 'd3', 'd4', 'd5']);
  });
});

describe('DS.datagrid.query: sort', () => {
  it('sorts text by the locale, numbers by value, dates by time', () => {
    assert.deepEqual(keys(query(rows, { columns, sort: [{ key: 'name', dir: 'ascending' }] })), ['d3', 'd5', 'd1', 'd2', 'd4']);
    assert.deepEqual(keys(query(rows, { columns, sort: { key: 'load', dir: 'descending' } })), ['d2', 'd5', 'd1', 'd4', 'd3']);
    assert.deepEqual(keys(query(rows, { columns, sort: [{ key: 'bought', dir: 'ascending' }] })), ['d2', 'd3', 'd1', 'd4', 'd5']);
  });

  it('puts empty values last in either direction and keeps equal rows in their order', () => {
    const up = keys(query(rows, { columns, sort: [{ key: 'load', dir: 'ascending' }] }));
    assert.deepEqual(up, ['d4', 'd1', 'd2', 'd5', 'd3']);
    assert.equal(keys(query(rows, { columns, sort: [{ key: 'load', dir: 'descending' }] })).at(-1), 'd3');
  });

  it('sorts by several columns, the first one first', () => {
    const result = query(rows, { columns, sort: [{ key: 'model', dir: 'ascending' }, { key: 'load', dir: 'descending' }] });
    assert.deepEqual(keys(result), ['d3', 'd2', 'd5', 'd1', 'd4']);
  });

  it('takes a key alone, "desc", and drops unknown and repeated columns', () => {
    assert.deepEqual(keys(query(rows, { columns, sort: ['load'] })), ['d4', 'd1', 'd2', 'd5', 'd3']);
    assert.deepEqual(keys(query(rows, { columns, sort: [{ key: 'load', dir: 'desc' }, { key: 'load', dir: 'ascending' }, { key: 'nothing' }] })), ['d2', 'd5', 'd1', 'd4', 'd3']);
  });

  it('reads a column\'s value() and sortValue()', () => {
    const derived = [{ key: 'size', value: (row) => row.name.length, type: 'number' }, { key: 'name', sortValue: (row) => row.name.slice(-2) }];
    assert.deepEqual(keys(query(rows, { columns: derived, sort: [{ key: 'name', dir: 'ascending' }] })), ['d1', 'd2', 'd5', 'd3', 'd4']);
    assert.deepEqual(keys(query(rows, { columns: derived, sort: [{ key: 'size', dir: 'descending' }] })).slice(0, 1), ['d3']);
  });
});

describe('DS.datagrid.query: page', () => {
  it('returns one page of the sorted rows, with the total that passed the filter', () => {
    const result = query(rows, { columns, sort: [{ key: 'name', dir: 'ascending' }], page: { index: 1, size: 2 } });
    assert.deepEqual(keys(result), ['d1', 'd2']);
    assert.equal(result.total, 5);
    assert.deepEqual(result.items.map((item) => item.posinset), [3, 4]);
    assert.equal(result.filtered.length, 5);
    assert.deepEqual(keys(query(rows, { columns, page: { index: 9, size: 2 } })), []);
  });

  it('keys rows by a property or a function, else by their index', () => {
    assert.deepEqual(keys(query(rows, { columns, key: 'name' })).slice(0, 2), ['LAPTOP-0100', 'LAPTOP-0107']);
    assert.deepEqual(keys(query(rows, { columns, key: (row, index) => `${row.model}:${index}` })).slice(0, 1), ['Laptop 14:0']);
    assert.deepEqual(keys(query([{ name: 'a' }, { name: 'b' }], { columns })), ['0', '1']);
  });
});

describe('DS.datagrid.query: tree rows', () => {
  const tree = [
    { id: 'a', name: 'Building A', children: [
      { id: 'a1', name: '1st floor', children: [{ id: 'x', name: 'LAPTOP-0100' }, { id: 'y', name: 'DESKTOP-0114' }] },
      { id: 'a2', name: '2nd floor', children: [] },
    ] },
    { id: 'b', name: 'Building B', children: [{ id: 'b1', name: 'Ground floor', children: [{ id: 'z', name: 'TABLET-0300' }] }] },
    { id: 's', name: 'Storage' },
  ];
  const cols = [{ key: 'name', label: 'Name' }];

  it('shows the roots, and the children of an expanded row, with level, set size and position', () => {
    const result = query(tree, { columns: cols, tree: true, expanded: ['a'] });
    assert.deepEqual(keys(result), ['a', 'a1', 'a2', 'b', 's']);
    const [a, a1, a2, b, s] = result.items;
    assert.deepEqual([a.level, a.expanded, a.setsize, a.posinset], [1, true, 3, 1]);
    assert.deepEqual([a1.level, a1.parent, a1.expanded, a1.posinset, a1.setsize], [2, 'a', false, 1, 2]);
    assert.equal(a2.expanded, null, 'no children: no aria-expanded');
    assert.equal(b.expanded, false);
    assert.equal(s.expanded, null);
    assert.equal(result.total, 3, 'the total counts roots');
  });

  it('keeps the ancestors of a match and opens them; the filtered list holds the matches with their ancestors', () => {
    const result = query(tree, { columns: cols, tree: true, filter: 'desktop' });
    assert.deepEqual(keys(result), ['a', 'a1', 'y']);
    assert.equal(result.total, 1);
    assert.deepEqual(result.filtered.map((row) => row.id), ['a', 'a1', 'y']);
  });

  it('sorts siblings at every level and pages by the roots', () => {
    const sorted = query(tree, { columns: cols, tree: true, expanded: ['a', 'a1'], sort: [{ key: 'name', dir: 'descending' }] });
    assert.deepEqual(keys(sorted), ['s', 'b', 'a', 'a2', 'a1', 'x', 'y']);
    const paged = query(tree, { columns: cols, tree: true, expanded: ['b'], page: { index: 1, size: 1 } });
    assert.deepEqual(keys(paged), ['b', 'b1']);
  });

  it('sorts ten thousand roots in linear time, not by looking each row up again', () => {
    const many = Array.from({ length: 10000 }, (_, at) => ({ id: `r${at}`, name: `n${(at * 7919) % 10000}`, load: (at * 31) % 977, children: [{ id: `c${at}`, name: 'child' }] }));
    const started = performance.now();
    const result = query(many, { columns: [{ key: 'name' }, { key: 'load', type: 'number' }], tree: true, sort: [{ key: 'load', dir: 'descending' }, { key: 'name' }] });
    const took = performance.now() - started;
    assert.equal(result.items.length, 10000);
    assert.equal(result.items[0].row.load, 976);
    // Looked up by find() it took seconds; a sort of node and row together, a few hundred milliseconds at most.
    assert.ok(took < 1500, `query() took ${Math.round(took)}ms`);
  });

  it('reads children through a property name or a function', () => {
    const flat = [{ id: 'p', name: 'Parent', kids: [{ id: 'c', name: 'Child' }] }];
    assert.deepEqual(keys(query(flat, { columns: cols, tree: { children: 'kids' }, expanded: ['p'] })), ['p', 'c']);
    assert.deepEqual(keys(query(flat, { columns: cols, tree: { children: (row) => row.kids }, expanded: ['p'] })), ['p', 'c']);
  });
});

describe('DS.datagrid.query: row groups', () => {
  it('puts a head item before the rows of each value, in the order of the values', () => {
    const result = query(rows, { columns, group: 'model', sort: [{ key: 'name', dir: 'ascending' }] });
    const shape = result.items.map((item) => `${item.kind}:${item.key}`);
    assert.deepEqual(shape, ['group:Desktop 7', 'row:d3', 'group:Laptop 13', 'row:d5', 'row:d2', 'group:Laptop 14', 'row:d1', 'row:d4']);
    const head = result.items[2];
    assert.deepEqual([head.level, head.setsize, head.posinset, head.expanded, head.children], [1, 3, 2, true, 2]);
    assert.deepEqual([result.items[3].level, result.items[3].parent, result.items[3].setsize], [2, 'Laptop 13', 2]);
    assert.equal(result.total, 5);
  });

  it('follows the sort when it names the grouping column, and leaves out the rows of a collapsed group', () => {
    const result = query(rows, { columns, group: { by: 'model' }, sort: [{ key: 'model', dir: 'descending' }], collapsed: ['Laptop 14'] });
    assert.deepEqual(result.items.map((item) => `${item.kind}:${item.key}`), ['group:Laptop 14', 'group:Laptop 13', 'row:d2', 'row:d5', 'group:Desktop 7', 'row:d3']);
    assert.equal(result.items[0].expanded, false);
    assert.equal(result.items[0].children, 2, 'a collapsed group still counts its rows');
  });

  it('groups empty values under one head, last', () => {
    const result = query([...rows, { id: 'd6', name: 'Spare', model: '' }], { columns, group: 'model' });
    const heads = result.items.filter((item) => item.kind === 'group');
    assert.equal(heads.at(-1).key, '');
    assert.equal(heads.at(-1).children, 1);
  });
});

describe('DS.datagrid.summary', () => {
  it('sums, averages, finds the least and most, and counts', () => {
    assert.equal(summary(rows, { key: 'load', summary: 'sum' }), 193);
    assert.equal(summary(rows, { key: 'load', summary: 'avg' }), 193 / 4);
    assert.equal(summary(rows, { key: 'load', summary: 'min' }), 8, 'an empty value is no 0');
    assert.equal(summary(rows, { key: 'load', summary: 'max' }), 74);
    assert.equal(summary(rows, { key: 'load', summary: 'count' }), 5);
  });

  it('runs a function of the rows, and is null with nothing to sum or no summary', () => {
    assert.equal(summary(rows, { key: 'load', summary: (list) => list.filter((row) => row.load > 50).length }), 2);
    assert.equal(summary(rows, { key: 'name', summary: 'sum' }), null);
    assert.equal(summary(rows, { key: 'load' }), null);
    assert.equal(summary([], { key: 'load', summary: 'max' }), null);
    assert.equal(summary(rows, null), null);
  });

  it('reads a column\'s value()', () => {
    assert.equal(summary(rows, { key: 'twice', value: (row) => (row.load ?? 0) * 2, summary: 'max' }), 148);
  });
});

describe('DS.datagrid.csv', () => {
  it('writes a header of labels, then a line per row, with CRLF', () => {
    const text = csv(rows.slice(0, 2), columns.slice(0, 3), { locale: 'en' });
    assert.equal(text, 'Device,Model,Load\r\nLAPTOP-0100,Laptop 14,37\r\nLAPTOP-0107,Laptop 13,74');
  });

  it('quotes a field with the separator, a quote or a line break, doubling quotes (RFC 4180)', () => {
    const text = csv([{ a: 'one, two', b: 'say "hi"', c: 'line\nbreak', d: 'plain' }], ['a', 'b', 'c', 'd'], { header: false });
    assert.equal(text, '"one, two","say ""hi""","line\nbreak",plain');
  });

  it('defuses a field that a spreadsheet would run as a formula, but not a negative number', () => {
    const text = csv([{ a: '=SUM(A1:A9)', b: '+1', c: '@cmd', d: '-12.5', e: '-x' }], ['a', 'b', 'c', 'd', 'e'], { header: false });
    assert.equal(text, "'=SUM(A1:A9),'+1,'@cmd,-12.5,'-x");
    assert.equal(csv([{ a: '=1' }], ['a'], { header: false, safe: false }), '=1');
  });

  it('keeps a formatted negative figure a figure: grouped, localized, a percent or currency sign', () => {
    const figures = ['-1,234.5', '-1,234,567', '-1.234,5', '-1\u00a0234,5', '-1\u202f234', "-1'234.50", '-12%', '-$1,234.50', '-€ 5', '-1 234,50 €'];
    for (const value of figures) assert.equal(csv([{ a: value }], ['a'], { header: false, separator: ';' }), value, value);
    const formatted = csv([{ n: -1234.5 }, { n: -1234567 }], [{ key: 'n', type: 'number' }], { header: false, locale: 'en', separator: ';' });
    assert.equal(formatted, '-1,234.5\r\n-1,234,567');
    assert.equal(csv([{ n: -1234.5 }], [{ key: 'n', type: 'number' }], { header: false, locale: 'de', separator: ';' }), '-1.234,5');
    // Still defused: anything a formula could do.
    const risky = ['-1+2', '-2*3', '-1,2;cmd', '+5', '+A1', '-SUM(1)', '-1)', '- 1'];
    for (const value of risky) assert.match(csv([{ a: value }], ['a'], { header: false, separator: '\t' }), /^"?'/, value);
  });

  it('takes another separator, leaves out export: false, and writes exportValue() and raw values', () => {
    const cols = [{ key: 'name', label: 'Device' }, { key: 'load', label: 'Load', type: 'number', exportValue: (row) => `${row.load ?? 0}%` }, { key: 'secret', export: false }];
    assert.equal(csv(rows.slice(0, 1), cols, { separator: '\t' }), 'Device\tLoad\r\nLAPTOP-0100\t37%');
    const date = new Date(Date.UTC(2024, 1, 14));
    assert.equal(csv([{ when: date }], [{ key: 'when', type: 'date' }], { header: false, raw: true }), '2024-02-14T00:00:00.000Z');
  });

  it('formats numbers by the locale unless raw, and writes a column\'s format()', () => {
    const big = [{ n: 12345.5 }];
    assert.equal(csv(big, [{ key: 'n', type: 'number' }], { header: false, locale: 'en' }), '"12,345.5"');
    assert.equal(csv(big, [{ key: 'n', type: 'number' }], { header: false, raw: true }), '12345.5');
    assert.equal(csv(big, [{ key: 'n', format: (value) => `${value} kg` }], { header: false }), '12345.5 kg');
  });
});

describe('DS.datagrid.create and the registration', () => {
  it('registers data-ds-datagrid with an element behaviour and a delegated one for outside commands', () => {
    const spec = runtime.state('core').specs.get('datagrid');
    assert.equal(spec.attribute, 'data-ds-datagrid');
    assert.equal(typeof spec.init, 'function');
    assert.equal(typeof spec.global, 'function');
  });

  it('takes only a table', () => {
    assert.throws(() => create(null), TypeError);
    assert.throws(() => create({ ownerDocument: {}, localName: 'div' }), TypeError);
  });

  it('names no timing of its own and writes no markup through innerHTML on page content', () => {
    const source = read('src/components/datagrid/datagrid.js');
    assert.doesNotMatch(source, /setTimeout\([^)]*,\s*\d+\s*\)/);
    assert.doesNotMatch(source, /\.innerHTML\s*=/);
    assert.doesNotMatch(source, /\.outerHTML\s*=/);
  });
});
