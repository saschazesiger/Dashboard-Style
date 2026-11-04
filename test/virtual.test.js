/**
 * DS.virtual (src/js/virtual.js) without a DOM: the height model (a Fenwick
 * tree checked against plain sums) and create() without an element. The window,
 * the focus, ARIA and morphHtml run in real engines in
 * test/browser/virtual.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, sizes } from '../src/js/virtual.js';

/** What the model must say, by adding up. */
const sum = (heights, index) => heights.slice(0, index).reduce((total, height) => total + height, 0);

describe('sizes()', () => {
  it('starts from the estimate: a number or a function of the index', () => {
    const flat = sizes(10, 20);
    assert.equal(flat.count, 10);
    assert.equal(flat.total(), 200);
    assert.equal(flat.offset(0), 0);
    assert.equal(flat.offset(3), 60);
    assert.equal(flat.offset(10), 200);
    assert.equal(flat.offset(99), 200, 'past the end: the total');
    assert.equal(flat.measured(3), false);
    const shaped = sizes(4, (index) => (index + 1) * 10);
    assert.equal(shaped.total(), 100);
    assert.equal(shaped.offset(2), 30);
    assert.equal(shaped.size(3), 40);
  });

  it('falls back on a sane height for an estimate that is none', () => {
    for (const bad of [0, -5, NaN]) assert.ok(sizes(1, bad).size(0) > 0);
  });

  it('finds the row at an offset', () => {
    const model = sizes(5, 10);
    assert.equal(model.indexAt(-1), 0);
    assert.equal(model.indexAt(0), 0);
    assert.equal(model.indexAt(9.9), 0);
    assert.equal(model.indexAt(10), 1);
    assert.equal(model.indexAt(49.9), 4);
    assert.equal(model.indexAt(500), 4, 'past the end: the last row');
    assert.equal(sizes(0).indexAt(10), 0);
  });

  it('agrees with plain sums through random updates', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const count of [1, 2, 3, 7, 8, 9, 64, 65, 500]) {
      const model = sizes(count, 30);
      const heights = new Array(count).fill(30);
      for (let step = 0; step < 200; step += 1) {
        const index = Math.floor(random() * count);
        const height = 1 + Math.floor(random() * 100);
        const delta = model.set(index, height);
        assert.equal(delta, height - heights[index]);
        heights[index] = height;
        const at = Math.floor(random() * (count + 1));
        assert.equal(model.offset(at), sum(heights, at));
        assert.equal(model.total(), sum(heights, count));
        // Every offset inside a row finds that row.
        const row = Math.floor(random() * count);
        const inside = sum(heights, row) + random() * (heights[row] - 0.01);
        assert.equal(model.indexAt(inside), row, `count ${count}, row ${row}`);
        assert.equal(model.indexAt(sum(heights, row)), row);
      }
    }
  });

  it('keeps measured rows through resize, and estimates the new ones', () => {
    const model = sizes(3, 10);
    model.set(1, 50);
    model.resize(5);
    assert.equal(model.count, 5);
    assert.equal(model.total(), 10 + 50 + 10 + 10 + 10);
    assert.equal(model.measured(1), true);
    assert.equal(model.measured(4), false);
    model.resize(2);
    assert.equal(model.total(), 60);
    model.resize(0);
    assert.equal(model.total(), 0);
    assert.equal(model.count, 0);
  });

  it('a better estimate reaches only what was not measured; forget() all of it', () => {
    const model = sizes(4, 10);
    model.set(0, 99);
    model.estimate(20);
    assert.equal(model.size(0), 99);
    assert.equal(model.size(1), 20);
    assert.equal(model.total(), 99 + 60);
    model.forget();
    assert.equal(model.measured(0), false);
    assert.equal(model.total(), 80);
  });

  it('ignores a row outside the model', () => {
    const model = sizes(2, 10);
    assert.equal(model.set(5, 100), 0);
    assert.equal(model.set(-1, 100), 0);
    assert.equal(model.total(), 20);
  });

  it('stays quick for a million rows', () => {
    const model = sizes(1_000_000, 40);
    assert.equal(model.total(), 40_000_000);
    model.set(999_999, 80);
    assert.equal(model.offset(1_000_000), 40_000_040);
    assert.equal(model.indexAt(39_999_960), 999_999);
    assert.equal(model.indexAt(20_000_000), 500_000);
  });
});

describe('create()', () => {
  it('returns a controller that does nothing without an element', () => {
    const idle = create(null, { render: () => '' });
    assert.deepEqual(idle.get(), { start: 0, end: 0, count: 0, active: 0 });
    assert.equal(idle.scrollTo(3), null);
    assert.equal(idle.focus(3), null);
    assert.equal(idle.row(3), null);
    assert.equal(idle.indexOf(null), -1);
    idle.set({ count: 1 });
    idle.refresh();
    idle.on('range', () => {})();
    idle.destroy();
  });
});
