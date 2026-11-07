/**
 * DS.listdetail: the levels, as the attribute and the triggers name them.
 * The browser side (the folding, the focus, the entrance) is
 * listdetail.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { arrange, level, parent } from './listdetail.js';

describe('DS.listdetail.arrange', () => {
  it('fits one column under the list and the detail, two up to the sub-detail, three beyond', () => {
    assert.deepEqual(arrange(390, 'list'), { columns: 1, shown: ['list'] });
    assert.deepEqual(arrange(719, 'detail'), { columns: 1, shown: ['detail'] });
    assert.deepEqual(arrange(719, 'sub'), { columns: 1, shown: ['sub'] });
    assert.deepEqual(arrange(720, 'list'), { columns: 2, shown: ['list', 'detail'] });
    assert.deepEqual(arrange(900, 'detail'), { columns: 2, shown: ['list', 'detail'] });
    assert.deepEqual(arrange(1079, 'sub'), { columns: 2, shown: ['detail', 'sub'] });
    assert.deepEqual(arrange(1080, 'sub'), { columns: 3, shown: ['list', 'detail', 'sub'] });
    assert.deepEqual(arrange(1400, 'detail'), { columns: 3, shown: ['list', 'detail'] });
  });

  it('follows the widths it is given', () => {
    assert.deepEqual(arrange(600, 'list', { list: 240, detail: 320 }), { columns: 2, shown: ['list', 'detail'] });
    assert.deepEqual(arrange(800, 'sub', { list: 240, detail: 320, sub: 240 }), { columns: 3, shown: ['list', 'detail', 'sub'] });
  });

  it('shows only the columns the layout has', () => {
    assert.deepEqual(arrange(1200, 'sub', { available: ['list', 'detail'] }), { columns: 3, shown: ['list', 'detail'] });
    assert.deepEqual(arrange(1200, 'detail', { available: ['list'] }), { columns: 1, shown: ['list'] });
    assert.deepEqual(arrange(300, 'sub', { available: ['list', 'detail'] }), { columns: 1, shown: ['list'] });
  });
});

describe('DS.listdetail.level', () => {
  it('reads the three levels, in any case and with spaces around', () => {
    assert.equal(level('list'), 'list');
    assert.equal(level('detail'), 'detail');
    assert.equal(level('sub'), 'sub');
    assert.equal(level(' Detail '), 'detail');
  });

  it('is the list for what names no level, or a level without its column', () => {
    for (const value of ['', null, undefined, 'record', 'details', '0']) assert.equal(level(value), 'list', String(value));
    assert.equal(level('sub', ['list', 'detail']), 'list');
    assert.equal(level('detail', ['list']), 'list');
    assert.equal(level('detail', ['list', 'detail']), 'detail');
  });
});

describe('DS.listdetail.parent', () => {
  it('goes up one level, and the list stays the list', () => {
    assert.equal(parent('sub'), 'detail');
    assert.equal(parent('detail'), 'list');
    assert.equal(parent('list'), 'list');
    assert.equal(parent('other'), 'list');
  });
});
