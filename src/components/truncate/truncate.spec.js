/**
 * Truncate: the three positions cut to fit and again on a resize, the tip
 * only while cut (on hover and on keyboard focus), the whole text for a
 * screen reader, a link's name, a new text by set() and by a morph, the
 * two-line clamp. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { layouts, ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=truncate');
  await ready(page);
}

const state = (locator) => locator.evaluate((el) => ({
  shown: el.querySelector('.ds-truncate__shown')?.textContent ?? el.textContent,
  fits: el.scrollWidth <= el.clientWidth + 0.5,
  tip: el.getAttribute('data-tip'),
}));

test('start and middle are cut by the module to fit, the end by CSS; each carries the whole text as its tip', async ({ page }) => {
  await open(page);
  const middle = await state(page.locator('#fx-component [data-demo="middle"]'));
  expect(middle.shown).toMatch(/^inventory-.*….*\.csv$/);
  expect(middle.fits).toBe(true);
  expect(middle.tip).toBe('inventory-export-2026-11-04-final-reviewed-by-ada.csv');
  const start = await state(page.locator('#fx-component [data-demo="start"]'));
  expect(start.shown).toMatch(/^….*printer-7$/);
  const end = page.locator('#fx-component [data-demo="end"]');
  expect(await end.evaluate((el) => [getComputedStyle(el).textOverflow, el.scrollWidth > el.clientWidth])).toEqual(['ellipsis', true]);
  await expect(end).toHaveAttribute('data-tip', /^Replace the toner/);
});

test('a resize cuts again; a text that fits loses its tip and its parts', async ({ page }) => {
  await open(page);
  const middle = page.locator('#fx-component [data-demo="middle"]');
  const narrow = (await state(middle)).shown;
  await page.locator('#fx-component [data-demo="width"]').evaluate((el) => {
    el.value = '560';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(async () => (await state(middle)).shown.length).toBeGreaterThan(narrow.length);
  await expect(middle).not.toHaveAttribute('data-tip');
  expect(await middle.evaluate((el) => el.children.length)).toBe(0);
  await expect(page.locator('#fx-component [data-demo="end"]')).not.toHaveAttribute('data-tip');
});

test('a screen reader reads the whole text; the cut is hidden from it', async ({ page }) => {
  await open(page);
  const middle = page.locator('#fx-component [data-demo="middle"]');
  await expect(middle.locator('.ds-truncate__shown')).toHaveAttribute('aria-hidden', 'true');
  await expect(middle.locator('.ds-sr')).toHaveText('inventory-export-2026-11-04-final-reviewed-by-ada.csv');
  await expect(page.getByRole('link', { name: 'device-inventory-north-building-2026-11.csv', exact: true })).toBeVisible();
});

test('keyboard focus shows the whole text in the tooltip, Escape hides it', async ({ page }) => {
  await open(page);
  const middle = page.locator('#fx-component [data-demo="middle"]');
  await page.locator('#fx-component [data-demo="start"]').focus();
  await page.keyboard.press('Tab');
  await expect(middle).toBeFocused();
  const tip = page.getByRole('tooltip');
  await expect(tip).toHaveText('inventory-export-2026-11-04-final-reviewed-by-ada.csv');
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
});

test('set() and a morph write a new whole text, cut at once', async ({ page }) => {
  await open(page);
  const live = page.locator('#fx-component [data-demo="live"]');
  expect((await state(live)).shown).toBe('backup-2026-11-04.tar.gz');
  await page.locator('#fx-component [data-demo="rename"]').click();
  await expect.poll(async () => (await state(live)).shown).toMatch(/^backup-of.*….*\.tar\.gz$/);
  const morphed = await page.evaluate(async () => {
    const holder = document.createElement('div');
    holder.style.inlineSize = '120px';
    document.querySelector('#fx-component').append(holder);
    window.DS.dom.morphHtml(holder, '<span class="ds-truncate" data-ds-truncate="middle">first-file-name-that-is-long.txt</span>');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.DS.dom.morphHtml(holder, '<span class="ds-truncate" data-ds-truncate="middle">second-file-name-that-is-long.txt</span>');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = holder.firstElementChild;
    const out = [el.querySelector('.ds-sr')?.textContent, el.querySelector('.ds-truncate__shown')?.textContent];
    holder.remove();
    return out;
  });
  expect(morphed[0]).toBe('second-file-name-that-is-long.txt');
  expect(morphed[1]).toMatch(/^second.*….*\.txt$/);
});

test('two lines: clamped by CSS (360px)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const lines = page.locator('#fx-component .ds-truncate--lines');
  const [height, line] = await lines.evaluate((el) => [el.getBoundingClientRect().height, parseFloat(getComputedStyle(el).lineHeight)]);
  expect(Math.round(height / line)).toBe(2);
});

test('four hundred file names are cut when they start and again on a resize in one batch, not a layout per candidate', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const box = document.createElement('div');
    box.id = 'many';
    box.style.inlineSize = '600px';
    document.querySelector('#fx-component').append(box);
  });
  const read = () => page.evaluate(() => [...document.querySelectorAll('#many .ds-truncate')].map((el) => {
    const shown = el.querySelector('.ds-truncate__shown');
    return { fits: el.scrollWidth <= el.clientWidth + 0.5, cut: Boolean(shown), share: shown ? shown.getBoundingClientRect().width / el.clientWidth : 1 };
  }));
  const start = await layouts(page, (count) => {
    const html = Array.from({ length: count }, (_, index) => `<div><span class="ds-truncate" data-ds-truncate="middle">inventory-export-${index}-2026-11-04-final-reviewed-by-ada-lovelace-for-every-printer-and-scanner-in-the-north-building.csv</span></div>`).join('');
    window.DS.dom.morphHtml(document.querySelector('#many'), html);
  }, 400);
  const wide = await read();
  const resize = await layouts(page, () => {
    document.querySelector('#many').style.inlineSize = '300px';
  });
  const narrow = await read();
  test.info().annotations.push({ type: 'layouts', description: `start: ${start.forced} forced in ${Math.round(start.ms)}ms; resize: ${resize.forced} forced in ${Math.round(resize.ms)}ms` });
  for (const rows of [wide, narrow]) {
    expect(rows).toHaveLength(400);
    expect(rows.every((row) => row.fits && row.cut)).toBe(true);
    // As much as fits: the cut fills its room but for a character or two.
    expect(Math.min(...rows.map((row) => row.share))).toBeGreaterThan(0.9);
  }
  // A layout per candidate forced thousands here (seconds: 4.7s for 200
  // names in Chromium); the batch forces a few for all of them.
  expect(start.forced).toBeLessThan(10);
  expect(resize.forced).toBeLessThan(10);
});
