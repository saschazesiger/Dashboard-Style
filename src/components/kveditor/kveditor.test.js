/**
 * DS.kveditor: reading and writing KEY=value lines, duplicates and the
 * object, in Node. The rows, paste, keys and secrets are kveditor.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { duplicates, parse, stringify, toObject } from './kveditor.js';

describe('DS.kveditor.parse', () => {
  it('reads KEY=value lines as a .env file has them', () => {
    const text = [
      '# a comment',
      '',
      'API_URL=https://api.example.test',
      'export LOG_LEVEL=info',
      'GREETING="Hello, \\"world\\"\\nbye"',
      "RAW='kept \\n as is'",
      'PLAIN = spaced value   # a trailing comment',
      'EMPTY=',
      'EQUALS=a=b=c',
      'NOVALUE',
    ].join('\r\n');
    assert.deepEqual(parse(text), [
      { key: 'API_URL', value: 'https://api.example.test' },
      { key: 'LOG_LEVEL', value: 'info' },
      { key: 'GREETING', value: 'Hello, "world"\nbye' },
      { key: 'RAW', value: 'kept \\n as is' },
      { key: 'PLAIN', value: 'spaced value' },
      { key: 'EMPTY', value: '' },
      { key: 'EQUALS', value: 'a=b=c' },
      { key: 'NOVALUE', value: '' },
    ]);
  });

  it('keeps a # inside a quoted value and skips lines without a key', () => {
    assert.deepEqual(parse('TAG="#blue # green"\n=orphan'), [{ key: 'TAG', value: '#blue # green' }]);
    assert.deepEqual(parse(''), []);
    assert.deepEqual(parse(null), []);
  });
});

describe('DS.kveditor.stringify', () => {
  it('writes lines, quoting only what needs it, and reads back the same', () => {
    const rows = [
      { key: 'API_URL', value: 'https://api.example.test' },
      { key: 'GREETING', value: 'Hello, "world"\nbye' },
      { key: 'EMPTY', value: '' },
      { key: ' ', value: 'no key' },
      { key: 'TAG', value: '#blue' },
    ];
    const text = stringify(rows);
    assert.equal(text, 'API_URL=https://api.example.test\nGREETING="Hello, \\"world\\"\\nbye"\nEMPTY=\nTAG="#blue"');
    assert.deepEqual(parse(text), rows.filter((row) => row.key.trim()));
  });
});

describe('DS.kveditor.duplicates and toObject', () => {
  const rows = [{ key: 'A', value: '1' }, { key: 'B', value: '2' }, { key: ' A ', value: '3' }, { key: '', value: 'x' }, { key: '', value: 'y' }, { key: 'a', value: '4' }];

  it('finds keys that come more than once, trimmed and case-sensitive, empty keys aside', () => {
    assert.deepEqual([...duplicates(rows)], [['A', [0, 2]]]);
    assert.equal(duplicates([{ key: 'A' }]).size, 0);
  });

  it('makes an object where the last row of a key wins', () => {
    assert.deepEqual(toObject(rows), { A: '3', B: '2', a: '4' });
  });
});
