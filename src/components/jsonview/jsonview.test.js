/**
 * DS.jsonview: the parser that keeps every number's digits, the model to
 * and from values and text, paths, ranges and search, and the module
 * without a DOM. The browser side is jsonview.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, fromValue, toValue, stringify, pathOf, ranges, search, create } from './jsonview.js';

describe('DS.jsonview.parse', () => {
  it('reads every kind of value, as JSON.parse does', () => {
    const text = '{"a": [1, -2.5, 3e2, true, false, null, "x"], "b": {}, "c": [], "d": "q\\"\\\\\\/\\b\\f\\n\\r\\t\\u00e9"}';
    assert.deepEqual(toValue(parse(text)), JSON.parse(text));
  });

  it('keeps the digits of a number a double cannot hold', () => {
    const model = parse('{"id": 12345678901234567890, "small": 42, "fraction": 0.1000000000000000055511151231257827}');
    assert.equal(model.entries[0][1].raw, '12345678901234567890');
    assert.equal(stringify(model, 0), '{"id":12345678901234567890,"small":42,"fraction":0.1000000000000000055511151231257827}');
    const value = toValue(model);
    assert.equal(typeof value.id, 'bigint');
    assert.equal(value.id, 12345678901234567890n);
    assert.equal(value.small, 42);
  });

  it('keeps duplicate keys and their order', () => {
    const model = parse('{"b": 1, "a": 2, "b": 3}');
    assert.deepEqual(model.entries.map(([key]) => key), ['b', 'a', 'b']);
  });

  it('says where the text stops being JSON, 1-based', () => {
    for (const [text, line, column] of [['{"a": }', 1, 7], ['{\n  "a": 1,\n  "b" 2\n}', 3, 7], ['[1, 2', 1, 6], ['{"a": 1} x', 1, 10], ['"open', 1, 6], ['', 1, 1], ['01', 1, 2], ['{"a": tru}', 1, 7], ['"\\x"', 1, 2]]) {
      assert.throws(() => parse(text), (error) => error instanceof SyntaxError && error.line === line && error.column === column, text);
    }
  });

  it('refuses control characters in strings and bad unicode escapes', () => {
    assert.throws(() => parse('"a\nb"'), SyntaxError);
    assert.throws(() => parse('"\\u12g4"'), SyntaxError);
  });

  it('takes whitespace around everything', () => {
    assert.deepEqual(toValue(parse(' \n\t{ "a" : [ 1 , 2 ] } \r\n')), { a: [1, 2] });
  });
});

describe('DS.jsonview.fromValue, toValue and stringify', () => {
  it('sees a value as JSON.stringify does', () => {
    const value = { when: new Date(Date.UTC(2026, 9, 12)), gone: undefined, fn() {}, list: [undefined, NaN, Infinity, 1], nested: { ok: true } };
    assert.equal(stringify(fromValue(value), 0), JSON.stringify(value));
  });

  it('writes a BigInt with its digits and indents like JSON.stringify', () => {
    assert.equal(stringify({ id: 2n ** 70n }, 0), '{"id":1180591620717411303424}');
    const value = { a: [1, { b: 'c' }], d: [], e: {} };
    assert.equal(stringify(value, 2), JSON.stringify(value, null, 2));
    assert.equal(stringify(value), JSON.stringify(value, null, 2));
  });

  it('refuses a cycle', () => {
    const value = { a: 1 };
    value.self = value;
    assert.throws(() => fromValue(value), TypeError);
  });

  it('keeps __proto__ as a plain key', () => {
    const value = toValue(parse('{"__proto__": {"x": 1}}'));
    assert.deepEqual(Object.keys(value), ['__proto__']);
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
  });
});

describe('DS.jsonview.pathOf', () => {
  it('writes identifiers with a dot, other keys quoted, indexes in brackets', () => {
    assert.equal(pathOf([]), '$');
    assert.equal(pathOf(['devices', 0, 'name']), '$.devices[0].name');
    assert.equal(pathOf(['display name', '0', '$ok', 'a-b']), '$["display name"]["0"].$ok["a-b"]');
    assert.equal(pathOf(['say "hi"']), '$["say \\"hi\\""]');
  });
});

describe('DS.jsonview.ranges', () => {
  it('opens a container into ranges of 100 above 100 entries, no level holding more than 100', () => {
    assert.deepEqual(ranges(0, 100), []);
    assert.deepEqual(ranges(0, 250), [[0, 100], [100, 200], [200, 250]]);
    const big = ranges(0, 25000);
    assert.equal(big.length, 3);
    assert.deepEqual(big[0], [0, 10000]);
    assert.deepEqual(ranges(0, 10000).length, 100);
    assert.deepEqual(ranges(10000, 20000)[0], [10000, 10100]);
  });
});

describe('DS.jsonview.search', () => {
  const model = parse('{"owner": {"name": "Ada Lovelace", "team": "Research"}, "tags": ["lovelace", "lab"], "count": 1024, "ok": true, "Lovelace": null}');

  it('finds keys and primitive values, case-insensitive, in document order', () => {
    assert.deepEqual(search(model, 'LOVELACE'), [[0, 0], [1, 0], [4]]);
    assert.deepEqual(search(model, 'name'), [[0, 0]]);
    assert.deepEqual(search(model, '102'), [[2]]);
    assert.deepEqual(search(model, 'true'), [[3]]);
  });

  it('finds nothing for a blank query, and stops at the limit', () => {
    assert.deepEqual(search(model, '  '), []);
    assert.equal(search(parse(JSON.stringify(Array.from({ length: 50 }, () => 'x'))), 'x', 10).length, 10);
  });

  it('skips array indexes as keys', () => {
    assert.deepEqual(search(parse('["a", "b"]'), '1'), []);
  });
});

describe('DS.jsonview.create', () => {
  it('returns an inert controller without a DOM', () => {
    const view = create(null);
    assert.equal(view.get(), null);
    assert.equal(view.text(), '');
    assert.equal(typeof view.on('copy', () => {}), 'function');
    view.destroy();
  });
});
