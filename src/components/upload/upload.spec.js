/**
 * File upload (DS.upload): files by the dialog and by paste, the limits and
 * their words, the rows' statuses, progress and ARIA, retry and remove with
 * focus, the resize, the preview grid, the options and forced colours. Runs
 * in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=upload');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** A fresh upload made for the test, with its events recorded on window.events. */
async function make(page, attributes = '', list = '<ul class="ds-list ds-upload__list" aria-label="Files"></ul>', around = '') {
  await page.evaluate(({ attributes, list, around }) => {
    document.querySelector('[data-test-upload]')?.closest('[data-test-region]')?.remove();
    const region = document.createElement('div');
    region.setAttribute('data-test-region', '');
    region.className = around;
    region.innerHTML = `<div class="ds-upload" data-ds-upload data-test-upload ${attributes}>
      <label class="ds-dropzone"><input class="ds-dropzone__input" type="file" multiple>
      <span class="ds-dropzone__title"><span class="ds-dropzone__idle">Drop files here</span></span>
      <span class="ds-dropzone__hint" id="test-hint">Up to 1 kB</span></label>${list}</div>`;
    document.querySelector('#fx-component').prepend(region);
    window.events = [];
    for (const type of ['files', 'reject', 'retry', 'remove', 'change']) {
      region.addEventListener(`ds:${type}`, (event) => window.events.push({ type, detail: JSON.parse(JSON.stringify(event.detail, (key, value) => (key === 'file' ? undefined : value))) }));
    }
  }, { attributes, list, around });
  await page.waitForFunction(() => DS.get(document.querySelector('[data-test-upload]'), 'upload'));
  return page.locator('[data-test-upload]');
}

const files = (...specs) => specs.map(([name, size, mimeType = 'text/csv']) => ({ name, mimeType, buffer: Buffer.alloc(size, 65) }));
const upload = (page) => page.evaluateHandle(() => DS.get(document.querySelector('[data-test-upload]'), 'upload'));

test('files from the dialog become rows, announced, and ds:files hands them to the page', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await el.locator('input[type="file"]').setInputFiles(files(['devices.csv', 300], ['rooms.csv', 200]));
  const rows = el.locator('.ds-upload__item');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('.ds-upload__name')).toHaveText('devices.csv');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'queued');
  await expect(rows.nth(0).locator('.ds-upload__meta')).toContainText('Waiting');
  await expect(rows.nth(0)).toHaveAttribute('aria-busy', 'true');
  await expect(rows.nth(0).locator('.ds-upload__bar')).toBeHidden();
  const events = await page.evaluate(() => window.events);
  const added = events.find((event) => event.type === 'files');
  expect(added.detail.entries.map((entry) => [entry.name, entry.size, entry.status])).toEqual([['devices.csv', 300, 'queued'], ['rooms.csv', 200, 'queued']]);
  await expect(page.locator('.ds-sr, [aria-live]').filter({ hasText: 'Added 2 files.' }).first()).toBeAttached();
});

test('progress, done and fail: the bar and its ARIA, the words and icons, Retry', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await el.locator('input[type="file"]').setInputFiles(files(['devices.csv', 300]));
  const row = el.locator('.ds-upload__item').first();
  const id = await row.getAttribute('data-ds-key');
  const handle = await upload(page);
  await handle.evaluate((controller, id) => controller.progress(id, 0.4), id);
  await expect(row).toHaveAttribute('data-status', 'uploading');
  const track = row.locator('[role="progressbar"]');
  await expect(track).toBeVisible();
  await expect(track).toHaveAttribute('aria-valuenow', '40');
  await expect(track).toHaveAccessibleName('Upload of devices.csv');
  await expect(row.locator('.ds-upload__meta')).toContainText('40%');

  await handle.evaluate((controller, id) => controller.fail(id, 'The server refused it.'), id);
  await expect(row).toHaveAttribute('data-status', 'error');
  await expect(row).not.toHaveAttribute('aria-busy', 'true');
  await expect(row.locator('.ds-upload__meta')).toContainText('The server refused it.');
  await expect(row.locator('.ds-upload__meta svg')).toHaveCount(1);
  const retry = row.getByRole('button', { name: 'Retry devices.csv' });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(row).toHaveAttribute('data-status', 'queued');
  await expect(retry).toBeHidden();
  await expect(row.getByRole('button', { name: 'Remove devices.csv' }), 'focus moves from the hidden Retry to Remove').toBeFocused();
  expect((await page.evaluate(() => window.events)).filter((event) => event.type === 'retry')[0].detail.entry.name).toBe('devices.csv');

  // done() with the server's url: the media turns into the preview, the row and its focus stay.
  await handle.evaluate((controller, id) => controller.done(id, { url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }), id);
  await expect(row).toHaveAttribute('data-status', 'done');
  await expect(row.locator('.ds-upload__meta')).toContainText('Uploaded');
  await expect(row.locator('.ds-upload__bar')).toBeHidden();
  await expect(row.locator('.ds-upload__thumb img')).toHaveCount(1);
  await expect(row.getByRole('button', { name: 'Remove devices.csv' })).toBeFocused();
});

test('Remove takes a row out, sends ds:remove and moves focus to the next row, then to the zone', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await el.locator('input[type="file"]').setInputFiles(files(['a.csv', 10], ['b.csv', 10]));
  await expect(el.locator('.ds-upload__item')).toHaveCount(2);
  await el.getByRole('button', { name: 'Remove a.csv' }).focus();
  await page.keyboard.press('Enter');
  await expect(el.locator('.ds-upload__item')).toHaveCount(1);
  await expect(el.getByRole('button', { name: 'Remove b.csv' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(el.locator('.ds-upload__item')).toHaveCount(0);
  await expect(el.locator('input[type="file"]')).toBeFocused();
  const removed = (await page.evaluate(() => window.events)).filter((event) => event.type === 'remove').map((event) => event.detail.entry.name);
  expect(removed).toEqual(['a.csv', 'b.csv']);
});

test('limits: type, size and count are refused in words, the zone turns invalid, the next pick clears it', async ({ page }) => {
  await open(page);
  const el = await make(page, 'data-ds-upload-accept=".csv" data-ds-upload-max-size="1 kB" data-ds-upload-max-files="2"');
  const input = el.locator('input[type="file"]');
  await input.setInputFiles([...files(['big.csv', 4000], ['ok.csv', 100], ['b.csv', 100], ['c.csv', 100]), ...files(['photo.png', 10, 'image/png'])]);
  await expect(el.locator('.ds-upload__item')).toHaveCount(2);
  const error = el.locator('.ds-upload__error');
  await expect(error).toBeVisible();
  await expect(error).toContainText('big.csv is larger than 1 kB.');
  await expect(error).toContainText('c.csv was not added: at most 2 files.');
  await expect(error).toContainText('photo.png is not a type this field takes.');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const describedBy = await input.getAttribute('aria-describedby');
  expect(describedBy.split(' ')).toContain(await error.getAttribute('id'));
  const reasons = (await page.evaluate(() => window.events)).find((event) => event.type === 'reject').detail.rejected.map((item) => item.reason).sort();
  expect(reasons).toEqual(['count', 'size', 'type']);
  // The zone's error edge.
  expect(await el.locator('.ds-dropzone').evaluate((zone) => getComputedStyle(zone).borderTopStyle)).toBe('solid');

  await el.getByRole('button', { name: 'Remove ok.csv' }).click();
  await expect(error).toBeHidden();
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await expect(input).not.toHaveAttribute('aria-describedby', /.+/);
});

test('paste: files pasted while focus is inside the upload are added; outside, nothing', async ({ page }) => {
  await open(page);
  const el = await make(page);
  const paste = (inside) => page.evaluate((inside) => {
    const target = inside ? document.querySelector('[data-test-upload] input[type="file"]') : document.body;
    if (inside) target.focus();
    else document.activeElement?.blur();
    const data = new DataTransfer();
    data.items.add(new File(['x'], 'screenshot.png', { type: 'image/png' }));
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    // Firefox drops clipboardData from the constructor's dictionary.
    Object.defineProperty(event, 'clipboardData', { value: data });
    target.dispatchEvent(event);
  }, inside);
  await paste(false);
  await page.waitForTimeout(100);
  await expect(el.locator('.ds-upload__item')).toHaveCount(0);
  await paste(true);
  await expect(el.locator('.ds-upload__item')).toHaveCount(1);
  await expect(el.locator('.ds-upload__thumb img'), 'a picture gets its thumbnail').toHaveCount(1);
});

test('resize: a large picture is drawn at most the box, its proportions kept', async ({ page }) => {
  await open(page);
  await make(page, 'data-ds-upload-resize="200" data-ds-upload-max-size="1 MB"');
  const size = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    for (let x = 0; x < 1200; x += 7) { context.fillStyle = `hsl(${x % 360} 70% 50%)`; context.fillRect(x, 0, 7, 600); }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const controller = DS.get(document.querySelector('[data-test-upload]'), 'upload');
    const [entry] = await controller.add([new File([blob], 'wide.png', { type: 'image/png' })]);
    const bitmap = await createImageBitmap(controller.get().find((item) => item.id === entry.id).file);
    return { width: bitmap.width, height: bitmap.height, type: entry.type, smaller: entry.size < blob.size };
  });
  expect(size).toEqual({ width: 200, height: 100, type: 'image/png', smaller: true });
});

test('the preview grid: a tile per file with its preview and tonal buttons over its corner', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const el = await make(page, '', '<ul class="ds-upload__grid" aria-label="Photos"></ul>');
  await page.evaluate(() => DS.get(document.querySelector('[data-test-upload]'), 'upload').set([
    { name: 'a.png', size: 10, type: 'image/png', status: 'done' },
    { name: 'b.pdf', size: 10, type: 'application/pdf', status: 'error', error: 'Refused.' },
  ]));
  const tiles = el.locator('.ds-upload__tile');
  await expect(tiles).toHaveCount(2);
  await expect(tiles.nth(1).locator('.ds-upload__preview .ds-upload__glyph')).toHaveCount(1);
  await expect(tiles.nth(1).locator('.ds-upload__retry')).toHaveClass(/ds-btn--tonal/);
  const geometry = await tiles.nth(1).evaluate((tile) => {
    const box = tile.getBoundingClientRect();
    const actions = tile.querySelector('.ds-upload__actions').getBoundingClientRect();
    const preview = tile.querySelector('.ds-upload__preview').getBoundingClientRect();
    return { width: box.width, inPreview: actions.top >= preview.top && actions.bottom <= preview.bottom && actions.right <= box.right, border: getComputedStyle(tile).borderTopColor, error: getComputedStyle(tile).getPropertyValue('--ds-error') };
  });
  expect(geometry.width).toBeGreaterThanOrEqual(144);
  expect(geometry.inPreview).toBe(true);
});

test('options: size steps the tile, density the gaps, shape the radius; touch reaches the buttons', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const measure = async (around) => {
    const el = await make(page, '', '<ul class="ds-upload__grid" aria-label="Photos"></ul>', around);
    await page.evaluate(() => DS.get(document.querySelector('[data-test-upload]'), 'upload').set([{ name: 'a.csv', size: 10, status: 'done' }]));
    return el.evaluate((upload) => {
      upload.style.inlineSize = '500px';
      const grid = upload.querySelector('.ds-upload__grid');
      const tile = upload.querySelector('.ds-upload__tile');
      return {
        column: parseFloat(getComputedStyle(grid).gridTemplateColumns.split(' ')[0]),
        tracks: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        gap: parseFloat(getComputedStyle(grid).columnGap),
        radius: parseFloat(getComputedStyle(tile).borderTopLeftRadius),
        button: upload.querySelector('.ds-upload__remove').getBoundingClientRect().height,
      };
    });
  };
  const base = await measure('');
  const large = await measure('ds-lg');
  expect(large.tracks).toBeLessThan(base.tracks);
  expect((await measure('ds-density-tight')).gap).toBeCloseTo(base.gap - 6, 0);
  expect((await measure('ds-shape-square')).radius).toBe(0);
  expect((await measure('ds-shape-round')).radius).toBeCloseTo(base.radius * 1.5, 0);
  expect((await measure('ds-touch')).button).toBeGreaterThanOrEqual(48);
});

test('rows fit a 360px stage: the actions keep the first line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  const el = await make(page, '', undefined, '');
  await el.evaluate((upload) => { upload.style.inlineSize = '360px'; });
  await page.evaluate(() => DS.get(document.querySelector('[data-test-upload]'), 'upload').set([
    { name: 'a-rather-long-name-for-a-device-list.csv', size: 4000, status: 'error', error: 'The connection dropped.' },
  ]));
  const row = el.locator('.ds-upload__item');
  const boxes = await row.evaluate((item) => ({
    text: item.querySelector('.ds-list__text').getBoundingClientRect(),
    actions: item.querySelector('.ds-upload__actions').getBoundingClientRect(),
    row: item.getBoundingClientRect(),
  }));
  expect(boxes.actions.right).toBeLessThanOrEqual(boxes.row.right);
  expect(boxes.actions.left, 'beside the words').toBeGreaterThanOrEqual(boxes.text.right);
  expect(boxes.actions.bottom).toBeLessThanOrEqual(boxes.text.bottom + 1);
});

test('forced colours: tiles keep their edges, a failed tile a second one', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const el = await make(page, '', '<ul class="ds-upload__grid" aria-label="Photos"></ul>');
  await page.evaluate(() => DS.get(document.querySelector('[data-test-upload]'), 'upload').set([
    { name: 'a.csv', size: 10, status: 'done' },
    { name: 'b.csv', size: 10, status: 'error', error: 'Refused.' },
  ]));
  const styles = await el.locator('.ds-upload__tile').evaluateAll((tiles) => tiles.map((tile) => ({ border: getComputedStyle(tile).borderTopStyle, outline: getComputedStyle(tile).outlineStyle })));
  expect(styles[0]).toEqual({ border: 'solid', outline: 'none' });
  expect(styles[1].outline).toBe('solid');
});

test('the demo renders every section without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.locator('.ds-upload')).toHaveCount(4);
  await expect(page.locator('[data-demo="rows"] .ds-upload__item')).toHaveCount(4);
  await expect(page.locator('[data-demo="grid"] .ds-upload__tile')).toHaveCount(4);
  expect(errors).toEqual([]);
});
