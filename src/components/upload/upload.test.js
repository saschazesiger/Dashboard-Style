/**
 * DS.upload: the pure parts (accept lists, sizes, the limits, the fit of a
 * picture) in Node. The rows, the zone and the events are upload.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { accepts, fitSize, parseSize, resizeImage, validate } from './upload.js';

const file = (name, size = 10, type = '') => ({ name, size, type });

describe('DS.upload.accepts', () => {
  it('reads extensions, MIME types and families, case-insensitive', () => {
    assert.equal(accepts(file('Devices.CSV'), '.csv'), true);
    assert.equal(accepts(file('a.png', 1, 'image/png'), 'image/*'), true);
    assert.equal(accepts(file('a.pdf', 1, 'application/pdf'), 'image/*, application/pdf'), true);
    assert.equal(accepts(file('a.txt', 1, 'text/plain'), 'image/*,.csv'), false);
    assert.equal(accepts(file('a.png', 1, 'IMAGE/PNG'), 'image/png'), true);
  });

  it('takes everything with an empty list', () => {
    assert.equal(accepts(file('a.exe'), ''), true);
    assert.equal(accepts(file('a.exe')), true);
  });
});

describe('DS.upload.parseSize', () => {
  it('reads bytes and the units people write', () => {
    assert.equal(parseSize('10485760'), 10485760);
    assert.equal(parseSize('10 MB'), 10_000_000);
    assert.equal(parseSize('500kB'), 500_000);
    assert.equal(parseSize('2 MiB'), 2 * 1024 * 1024);
    assert.equal(parseSize('1.5 GB'), 1_500_000_000);
    assert.equal(parseSize(2048), 2048);
  });

  it('is null for anything else', () => {
    for (const value of ['', 'ten', '10 parsecs', null, undefined, -1, NaN]) assert.equal(parseSize(value), null, String(value));
  });
});

describe('DS.upload.validate', () => {
  it('refuses by type, then count, then size, and says the limit', () => {
    const files = [file('a.csv', 10), file('b.png', 10, 'image/png'), file('c.csv', 5000), file('d.csv', 20), file('e.csv', 30)];
    const { accepted, rejected } = validate(files, { accept: '.csv', maxSize: 1000, maxFiles: 3, count: 1 });
    assert.deepEqual(accepted.map((item) => item.name), ['a.csv', 'd.csv']);
    assert.deepEqual(rejected.map((item) => [item.file.name, item.reason, item.limit]), [
      ['b.png', 'type', '.csv'],
      ['c.csv', 'size', 1000],
      ['e.csv', 'count', 3],
    ]);
  });

  it('counts the files shown against maxFiles, and refuses empty files with minSize', () => {
    assert.equal(validate([file('a')], { maxFiles: 2, count: 2 }).rejected[0].reason, 'count');
    assert.equal(validate([file('a', 0)], { minSize: 1 }).rejected[0].reason, 'empty');
    assert.equal(validate([file('a', 0)]).accepted.length, 1, 'no limits, no refusals');
  });
});

describe('DS.upload.fitSize', () => {
  it('keeps the proportions inside the box', () => {
    assert.deepEqual(fitSize(4000, 3000, { maxWidth: 1600, maxHeight: 1600 }), { width: 1600, height: 1200, scale: 0.4 });
    assert.deepEqual(fitSize(1000, 4000, { maxWidth: 1600, maxHeight: 1600 }), { width: 400, height: 1600, scale: 0.4 });
    assert.deepEqual(fitSize(3000, 1000, { maxWidth: 1500 }), { width: 1500, height: 500, scale: 0.5 });
  });

  it('never makes a picture larger, and never smaller than a pixel', () => {
    assert.deepEqual(fitSize(800, 600, { maxWidth: 1600 }), { width: 800, height: 600, scale: 1 });
    assert.equal(fitSize(10000, 1, { maxWidth: 100 }).height, 1);
  });
});

describe('DS.upload.resizeImage', () => {
  it('gives back what it cannot draw', async () => {
    const text = file('notes.txt', 10, 'text/plain');
    assert.equal(await resizeImage(text, { maxWidth: 10 }), text);
    const gif = file('moves.gif', 10, 'image/gif');
    assert.equal(await resizeImage(gif, { maxWidth: 10 }), gif);
    const png = file('a.png', 10, 'image/png');
    assert.equal(await resizeImage(png, { maxWidth: 10 }), png, 'no createImageBitmap in Node');
  });
});
