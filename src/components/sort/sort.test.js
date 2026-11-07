/**
 * DS.sort without a DOM: the text form of a sort (parse, stringify) and the
 * registration. The control in a browser is sort.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, stringify } from './sort.js';
import { runtime } from '../../js/core.js';

describe('DS.sort.parse', () => {
  it('reads a field, ascending, and a leading minus as descending', () => {
    assert.deepEqual(parse('name'), { field: 'name', direction: 'ascending' });
    assert.deepEqual(parse('-seen'), { field: 'seen', direction: 'descending' });
    assert.deepEqual(parse('+seen'), { field: 'seen', direction: 'ascending' });
    assert.deepEqual(parse('  -seen '), { field: 'seen', direction: 'descending' });
  });

  it('reads a :asc or :desc suffix in any case', () => {
    assert.deepEqual(parse('seen:desc'), { field: 'seen', direction: 'descending' });
    assert.deepEqual(parse('seen:DESCENDING'), { field: 'seen', direction: 'descending' });
    assert.deepEqual(parse('seen:asc'), { field: 'seen', direction: 'ascending' });
    assert.deepEqual(parse('a.b:asc'), { field: 'a.b', direction: 'ascending' });
  });

  it('gives null for no field', () => {
    for (const text of ['', '  ', '-', '+', ':desc', null, undefined]) assert.equal(parse(text), null, String(text));
  });
});

describe('DS.sort.stringify', () => {
  it('writes what parse reads', () => {
    assert.equal(stringify({ field: 'name', direction: 'ascending' }), 'name');
    assert.equal(stringify({ field: 'seen', direction: 'descending' }), '-seen');
    assert.equal(stringify({ field: 'seen' }), 'seen');
    for (const text of ['name', '-seen', 'a.b', '-x-y']) assert.equal(stringify(parse(text)), text);
  });

  it('gives empty text without a field', () => {
    assert.equal(stringify(null), '');
    assert.equal(stringify({ direction: 'descending' }), '');
  });
});

describe('DS.sort registration', () => {
  it('registers its behaviour by data-ds-sort', () => {
    const spec = runtime.state('core').specs.get('sort');
    assert.equal(spec.attribute, 'data-ds-sort');
    assert.equal(typeof spec.init, 'function');
  });
});
