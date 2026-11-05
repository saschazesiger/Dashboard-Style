/**
 * DS.chart: the engine without a DOM (ticks, the time axis, scales, paths
 * with gaps, stacking, hit testing, reading a table, the layout of every
 * kind). The browser side (drawing, the cursor, the keyboard, the morph)
 * is chart.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { layout, nearest, parse, path, scale, stack, ticks, timeTicks } from './chart.js';

const local = (text) => new Date(text).getTime();

describe('DS.chart.ticks', () => {
  it('steps by 1, 2 or 5 times a power of ten', () => {
    assert.deepEqual(ticks(0, 100, 5), [0, 20, 40, 60, 80, 100]);
    assert.deepEqual(ticks(0, 10, 5), [0, 2, 4, 6, 8, 10]);
    assert.deepEqual(ticks(0, 1, 5), [0, 0.2, 0.4, 0.6, 0.8, 1]);
    assert.deepEqual(ticks(-40, 40, 4), [-40, -20, 0, 20, 40]);
  });

  it('writes decimals without float noise', () => {
    assert.deepEqual(ticks(0, 0.3, 3), [0, 0.1, 0.2, 0.3]);
    for (const value of ticks(0.1, 0.9, 8)) assert.equal(String(value).length <= 4, true, String(value));
  });

  it('runs backwards for a reversed domain and handles the edges', () => {
    assert.deepEqual(ticks(10, 0, 5), [10, 8, 6, 4, 2, 0]);
    assert.deepEqual(ticks(5, 5), [5]);
    assert.deepEqual(ticks(NaN, 5), []);
  });
});

describe('DS.chart.timeTicks', () => {
  it('ticks whole hours across a day, in local time', () => {
    const out = timeTicks(local('2026-11-04T00:00'), local('2026-11-05T00:00'), 5);
    assert.ok(out.length >= 4 && out.length <= 9, String(out.length));
    for (const value of out) {
      const d = new Date(value);
      assert.equal(d.getMinutes(), 0);
      assert.equal(d.getHours() % 3, 0);
    }
  });

  it('ticks days, Mondays, months and years as the span grows', () => {
    const days = timeTicks(local('2026-11-01T00:00'), local('2026-11-08T00:00'), 7);
    assert.ok(days.every((value) => new Date(value).getHours() === 0));
    const weeks = timeTicks(local('2026-09-01T00:00'), local('2026-11-01T00:00'), 10);
    assert.ok(weeks.every((value) => new Date(value).getDay() === 1), 'Mondays');
    const months = timeTicks(local('2026-01-01T00:00'), local('2026-12-31T00:00'), 6);
    assert.ok(months.every((value) => new Date(value).getDate() === 1));
    const years = timeTicks(local('2000-01-01T00:00'), local('2030-01-01T00:00'), 6);
    assert.ok(years.every((value) => new Date(value).getMonth() === 0 && new Date(value).getDate() === 1));
    assert.ok(years.length <= 8);
  });

  it('stays inside the domain', () => {
    const min = local('2026-11-04T09:17');
    const max = local('2026-11-04T13:42');
    for (const value of timeTicks(min, max, 5)) assert.ok(value >= min && value <= max);
    assert.deepEqual(timeTicks(max, min), []);
  });
});

describe('DS.chart.scale', () => {
  it('maps and inverts a linear domain', () => {
    const s = scale('linear', [0, 100], [200, 0]);
    assert.equal(s.map(0), 200);
    assert.equal(s.map(50), 100);
    assert.equal(s.invert(100), 50);
    assert.deepEqual(s.ticks(5), [0, 20, 40, 60, 80, 100]);
  });

  it('maps a log domain by decades, zero and below to NaN', () => {
    const s = scale('log', [1, 1000], [0, 300]);
    assert.equal(s.map(10), 100);
    assert.equal(s.map(100), 200);
    assert.ok(Number.isNaN(s.map(0)));
    assert.deepEqual(s.ticks(10), [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]);
  });

  it('gives a band its centre, its width and the index under a pixel', () => {
    const s = scale('band', ['a', 'b', 'c', 'd'], [0, 400], { padding: 0.2 });
    assert.ok(s.bandwidth > 0 && s.bandwidth < 100);
    assert.equal(Math.round(s.map('a') + s.map('d')), 400, 'symmetric');
    assert.equal(s.invert(s.map('c')), 2);
    assert.equal(s.invert(-50), 0);
    assert.ok(Number.isNaN(s.map('zz')));
  });

  it('places a time domain by its milliseconds', () => {
    const a = local('2026-11-04T00:00');
    const b = local('2026-11-05T00:00');
    const s = scale('time', [a, b], [0, 240]);
    assert.equal(s.map(local('2026-11-04T12:00')), 120);
  });
});

describe('DS.chart.path', () => {
  const points = [{ x: 0, y: 10 }, { x: 10, y: 20 }, { x: 20, y: 5 }];

  it('draws a straight line, a step and a monotone curve', () => {
    assert.equal(path(points), 'M0 10L10 20L20 5');
    assert.equal(path(points, { curve: 'step' }), 'M0 10H10V20H20V5');
    const curve = path(points, { curve: 'monotone' });
    assert.match(curve, /^M0 10C/);
    assert.equal((curve.match(/C/g) ?? []).length, 2);
  });

  it('never overshoots a point with the monotone curve', () => {
    const flat = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 10 }, { x: 30, y: 0 }];
    const numbers = path(flat, { curve: 'monotone' }).replace(/[MC]/g, ' ').trim().split(/\s+/).map(Number);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    assert.ok(Math.max(...ys) <= 10 + 1e-9, String(ys));
  });

  it('breaks the line at a gap and leaves a lone point to its marker', () => {
    const gapped = [{ x: 0, y: 1 }, { x: 1, y: 2 }, null, { x: 3, y: 4 }, { x: 4, y: null }, { x: 5, y: 1 }, { x: 6, y: 2 }];
    assert.equal(path(gapped), 'M0 1L1 2M5 1L6 2');
  });

  it('closes an area along its baseline, and a step area along the same steps', () => {
    const area = [{ x: 0, y: 10, y0: 30 }, { x: 10, y: 20, y0: 30 }];
    assert.equal(path(area, { area: true }), 'M0 10L10 20L10 30L0 30Z');
    const stepped = [{ x: 0, y: 10, y0: 30 }, { x: 10, y: 20, y0: 25 }, { x: 20, y: 5, y0: 28 }];
    assert.equal(path(stepped, { area: true, curve: 'step' }), 'M0 10H10V20H20V5L20 28V25H10V30H0Z');
  });

  it('gives a lone point of an area a hairline band', () => {
    assert.equal(path([{ x: 5, y: 1, y0: 9 }], { area: true }), 'M4.5 1L5.5 1L5.5 9L4.5 9Z');
  });
});

describe('DS.chart.stack', () => {
  it('stacks positives upwards and negatives downwards, gaps as null', () => {
    const out = stack([[1, 2, -1], [3, null, -2]]);
    assert.deepEqual(out[0], [[0, 1], [0, 2], [-1, 0]]);
    assert.deepEqual(out[1], [[1, 4], null, [-3, -1]]);
  });

  it('stacks to 100% with offset percent', () => {
    const out = stack([[1, 0], [3, 0]], { offset: 'percent' });
    assert.deepEqual(out[0][0], [0, 0.25]);
    assert.deepEqual(out[1][0], [0.25, 1]);
    assert.deepEqual(out[1][1], [0, 0]);
  });
});

describe('DS.chart.nearest', () => {
  it('finds the nearest position either way round', () => {
    assert.equal(nearest([0, 10, 20, 30], 14), 1);
    assert.equal(nearest([0, 10, 20, 30], 16), 2);
    assert.equal(nearest([0, 10, 20, 30], 15), 2, 'a tie takes the later point');
    assert.equal(nearest([30, 20, 10, 0], 26), 0);
    assert.equal(nearest([0, 10], -100), 0);
    assert.equal(nearest([], 3), -1);
  });
});

describe('DS.chart.parse', () => {
  const cell = (text, attrs = {}) => ({
    textContent: text,
    getAttribute: (name) => attrs[name] ?? null,
    querySelector: (selector) => (selector === 'time[datetime]' && attrs.datetime ? { getAttribute: () => attrs.datetime } : null),
  });
  const row = (...cells) => ({ cells });

  it('reads the header as series and each row as a point, blanks and dashes as gaps', () => {
    const table = {
      tHead: { rows: [row(cell('Hour'), cell('Requests'), cell('Errors', { 'data-ds-chart-mark': 'area', 'data-ds-chart-tone': 'error' }))] },
      tBodies: [{ rows: [
        row(cell('09:00', { datetime: '2026-11-04T09:00' }), cell('1,200'), cell('3')),
        row(cell('10:00', { datetime: '2026-11-04T10:00' }), cell('–'), cell('')),
        row(cell('11:00', { 'data-value': '2026-11-04T11:00' }), cell('980'), cell('x')),
      ] }],
    };
    const spec = parse(table);
    assert.deepEqual(spec.labels, ['2026-11-04T09:00', '2026-11-04T10:00', '2026-11-04T11:00']);
    assert.deepEqual(spec.series[0], { name: 'Requests', values: [1200, null, 980] });
    assert.deepEqual(spec.series[1], { name: 'Errors', values: [3, null, null], mark: 'area', tone: 'error' });
    assert.equal(spec.x.label, 'Hour');
  });
});

describe('DS.chart.layout', () => {
  const labels = ['2026-11-04T09:00', '2026-11-04T10:00', '2026-11-04T11:00', '2026-11-04T12:00'];

  it('lays out a time series: a time axis, nice value ticks from zero, points in the plot, gaps kept', () => {
    const lay = layout({ type: 'line', labels, series: [{ name: 'Requests', values: [120, 340, null, 200] }] }, 600, 240);
    assert.equal(lay.kind, 'cartesian');
    assert.equal(lay.x.type, 'time');
    assert.equal(lay.yTicks[0].value, 0);
    assert.ok(lay.yTicks.at(-1).value >= 340);
    const [first, second, gap, last] = lay.series[0].points;
    assert.ok(first.x < second.x && second.x < last.x);
    assert.ok(second.y < first.y, 'higher values sit higher');
    assert.equal(gap.y, null);
    for (const point of [first, second, last]) {
      assert.ok(point.x >= lay.plot.x && point.x <= lay.plot.x + lay.plot.width);
      assert.ok(point.y >= lay.plot.y && point.y <= lay.plot.y + lay.plot.height);
    }
  });

  it('stacks areas so each sits on the one below', () => {
    const lay = layout({ type: 'area', stack: 'normal', labels, series: [{ name: 'A', values: [1, 2, 3, 4] }, { name: 'B', values: [2, 2, 2, 2] }] }, 600, 240);
    const [a, b] = lay.series;
    a.points.forEach((point, i) => assert.equal(b.points[i].y0, point.y));
  });

  it('groups columns side by side within their band, at most the widest bar', () => {
    const lay = layout({ type: 'column', labels: ['Mon', 'Tue'], series: [{ name: 'Opened', values: [4, 8] }, { name: 'Closed', values: [2, 6] }] }, 400, 200, { bar: 24, seam: 2 });
    const [opened, closed] = lay.series;
    assert.equal(opened.bars[0].width, closed.bars[0].width);
    assert.ok(opened.bars[0].width <= 24);
    assert.equal(closed.bars[0].x - opened.bars[0].x, opened.bars[0].width + 2, 'a seam between them');
    assert.equal(opened.bars[1].share, 1, 'the largest value fills the plot up to the nice max');
    assert.equal(opened.bars[0].from, 0);
  });

  it('stacks columns to 100% with the outer segment rounded and the inner resting on it', () => {
    const lay = layout({ type: 'column', stack: 'percent', labels: ['Mon'], series: [{ name: 'A', values: [1] }, { name: 'B', values: [3] }] }, 400, 200);
    const [a, b] = lay.series;
    assert.equal(a.bars[0].from, 0);
    assert.equal(a.bars[0].share, 0.25);
    assert.equal(b.bars[0].from, 0.25);
    assert.equal(b.bars[0].share, 1);
    assert.equal(a.bars[0].inner, true);
    assert.equal(b.bars[0].inner, false);
    assert.equal(b.bars[0].onStack, true);
    assert.equal(lay.yTicks.at(-1).label.replace(/\s/g, ''), '100%');
  });

  it('turns a bar chart on its side: the categories down, the values across', () => {
    const lay = layout({ type: 'bar', labels: ['Laptops', 'Printers'], series: [{ name: 'Devices', values: [40, 10] }] }, 400, 200);
    assert.equal(lay.horizontal, true);
    const [laptops, printers] = lay.series[0].bars;
    assert.ok(printers.y > laptops.y);
    assert.equal(laptops.width, lay.plot.width);
    assert.ok(laptops.share > printers.share);
  });

  it('puts the line of a combo on the second axis', () => {
    const lay = layout({ type: 'combo', labels: ['Mon', 'Tue'], series: [{ name: 'Tickets', values: [40, 60] }, { name: 'Hours', values: [1.5, 2] }], y2: { label: 'Hours' } }, 600, 240);
    assert.equal(lay.series[0].mark, 'column');
    assert.equal(lay.series[1].mark, 'line');
    assert.equal(lay.series[1].axis, 'end');
    assert.ok(lay.y2Ticks.length > 1);
    assert.ok(lay.y2.domain[1] < 10);
  });

  it('draws thresholds as lines and bands on the value scale, annotations along x', () => {
    const lay = layout({ type: 'line', labels, series: [{ name: 'Latency', values: [100, 200, 300, 250] }],
      thresholds: [{ value: 250, label: 'Limit', tone: 'error' }, { from: 0, to: 100, label: 'Good' }],
      annotations: [{ at: '2026-11-04T10:00', label: 'Deploy' }] }, 600, 240);
    const [line, band, mark] = lay.rules;
    assert.equal(line.kind, 'line');
    assert.equal(line.at, lay.y.map(250));
    assert.equal(band.kind, 'band');
    assert.equal(mark.axis, 'x');
    assert.equal(mark.at, lay.series[0].points[1].x);
  });

  it('cuts a donut into slices, the fifth and later into Other', () => {
    const lay = layout({ type: 'donut', labels: ['a', 'b', 'c', 'd', 'e', 'f'], series: [{ name: 'Share', values: [5, 4, 3, 2, 1, 1] }] }, 200, 200);
    assert.equal(lay.slices.length, 5);
    assert.equal(lay.slices[4].value, 2);
    assert.equal(lay.slices[4].slot, -1);
    assert.ok(Math.abs(lay.slices.at(-1).a1 - 2 * Math.PI) < 1e-9);
    assert.ok(lay.inner > 0);
    assert.equal(layout({ type: 'pie', labels: ['a'], series: [{ name: 'S', values: [1] }] }, 200, 200).inner, 0);
  });

  it('places a gauge value in its zone', () => {
    const lay = layout({ type: 'gauge', value: 82, zones: [{ to: 70, tone: 'success', label: 'Normal' }, { to: 90, tone: 'warning', label: 'High' }, { tone: 'error', label: 'Critical' }] }, 240, 160);
    assert.equal(lay.zone.label, 'High');
    assert.ok(lay.angle > lay.zones[1].a0 && lay.angle < lay.zones[1].a1);
    assert.equal(lay.zones.at(-1).to, 100);
  });

  it('gives each bar of a bar gauge its share and its zone word', () => {
    const lay = layout({ type: 'bargauge', max: 100, labels: ['Disk', 'Memory'], series: [{ name: 'Use', values: [45, 95] }], zones: [{ to: 80, label: 'OK' }, { tone: 'error', label: 'Full' }] }, 0, 0);
    assert.deepEqual(lay.rows.map((row) => [row.share, row.status, row.tone]), [[0.45, 'OK', null], [0.95, 'Full', 'error']]);
  });

  it('fits a sparkline with no axes', () => {
    const lay = layout({ type: 'sparkline', series: [{ name: 'Requests', values: [3, 5, 4, 8] }] }, 120, 32);
    assert.equal(lay.spark, true);
    assert.deepEqual(lay.xTicks, []);
    assert.deepEqual(lay.yTicks, []);
    const ys = lay.series[0].points.map((point) => point.y);
    assert.ok(Math.min(...ys) >= 0 && Math.max(...ys) <= 32);
  });

  it('thins the category ticks that would overlap', () => {
    const many = Array.from({ length: 60 }, (_, i) => `Device ${i + 1}`);
    const lay = layout({ type: 'column', labels: many, series: [{ name: 'Load', values: many.map((_, i) => i) }] }, 360, 200);
    assert.ok(lay.xTicks.length < 20 && lay.xTicks.length > 1);
    assert.equal(lay.xTicks.at(-1).value, 59, 'the last category keeps its label');
  });
});
