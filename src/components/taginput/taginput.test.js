/**
 * DS.taginput without a DOM: the parsing of typed and pasted text, the
 * checks (empty, repeat, pattern, validate, max) with their messages, and
 * its registration. The behaviour in a browser is taginput.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { split, check, create } from './taginput.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

describe('DS.taginput.split', () => {
  it('splits on the separators, line breaks, tabs and semicolons, trimmed, the empty parts gone', () => {
    assert.deepEqual(split('lab, kiosk; spare\nprinter\t floor-2 ,,'), ['lab', 'kiosk', 'spare', 'printer', 'floor-2']);
    assert.deepEqual(split(' one '), ['one']);
    assert.deepEqual(split(''), []);
    assert.deepEqual(split(null), []);
  });

  it('takes other separators, and escapes those a character class reads', () => {
    assert.deepEqual(split('a|b c', ['|']), ['a', 'b c']);
    assert.deepEqual(split('a-b]c', ['-', ']']), ['a', 'b', 'c']);
    assert.deepEqual(split('a b', [' ']), ['a', 'b']);
  });
});

describe('DS.taginput.check', () => {
  it('passes a new tag and refuses an empty one', () => {
    assert.deepEqual(check('printer', []), { ok: true });
    assert.equal(check('   ', []).reason, 'empty');
  });

  it('refuses a repeat, case aside, unless unique is off', () => {
    const verdict = check('Printer', ['printer']);
    assert.equal(verdict.reason, 'duplicate');
    assert.equal(verdict.message, 'Printer is in the list already');
    assert.equal(check('Printer', ['printer'], { unique: false }).ok, true);
  });

  it('refuses past the maximum, before anything else', () => {
    const verdict = check('printer', ['a', 'b'], { max: 2 });
    assert.equal(verdict.reason, 'max');
    assert.equal(verdict.message, 'Up to 2 items');
    assert.equal(check('c', ['a'], { max: 2 }).ok, true);
  });

  it('checks a pattern against the whole text, as a source or a RegExp', () => {
    assert.equal(check('ada@example.com', [], { pattern: '[^@\\s]+@[^@\\s]+' }).ok, true);
    const verdict = check('ada at example', [], { pattern: '[^@\\s]+@[^@\\s]+' });
    assert.equal(verdict.reason, 'invalid');
    assert.equal(verdict.message, 'ada at example is not valid');
    assert.equal(check('x1', [], { pattern: /^[a-z]+$/ }).ok, false);
  });

  it('asks validate, which refuses with false or a message of its own', () => {
    assert.equal(check('x', [], { validate: () => false }).message, 'x is not valid');
    assert.equal(check('x', [], { validate: () => 'Use small letters' }).message, 'Use small letters');
    assert.equal(check('x', ['y'], { validate: (text, value) => value.length === 1 }).ok, true);
  });
});

describe('DS.taginput', () => {
  it('registers its behaviour by its attribute and needs its field', () => {
    const spec = runtime.state('core').specs.get('taginput');
    assert.equal(spec.attribute, 'data-ds-taginput');
    assert.equal(create(null), null);
    assert.equal(create({ querySelector: () => null }), null);
  });

  it('writes no page markup and no ms of its own', () => {
    const source = read('src/components/taginput/taginput.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(source, /\.innerHTML\s*=|insertAdjacentHTML/);
    assert.doesNotMatch(source, /setTimeout\(/);
  });
});
