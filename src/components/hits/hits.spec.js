/**
 * Search hits: marks around every hit, folded case and accents, a new query
 * that replaces the marks, the phrase mode, skipped parts, a morph marked
 * again, the colours and the shape, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=hits');
  await ready(page);
}

const marks = (locator) => locator.evaluate((el) => [...el.querySelectorAll('mark.ds-hit')].map((m) => m.textContent));

test('every hit of every word is marked, case and accents ignored; a new query replaces the marks', async ({ page }) => {
  await open(page);
  const list = page.locator('#fx-component [data-demo="list"]');
  expect(await marks(list)).toEqual(['toner', 'Toner']);
  const search = page.locator('#fx-component [data-demo="search"]');
  await search.fill('cafe');
  expect(await marks(list)).toEqual(['Café']);
  await search.fill('print toner');
  expect(await marks(list)).toEqual(['toner', 'Print', 'Toner', 'print']);
  await search.fill('');
  expect(await marks(list)).toEqual([]);
  // The text is whole again: no split text nodes left behind.
  expect(await list.locator('.ds-list__title').first().evaluate((el) => el.childNodes.length)).toBe(1);
  await expect(page.locator('#fx-component [data-demo="count"]')).toHaveText('5 of 5 tickets');
});

test('the phrase mode marks the whole query only; the page\'s own marks and skipped parts stay', async ({ page }) => {
  await open(page);
  expect(await marks(page.locator('#fx-component [data-demo="phrase"]'))).toEqual(['second floor', 'second floor']);
  const out = await page.evaluate(() => {
    const el = document.createElement('div');
    el.innerHTML = 'toner <mark>toner</mark> <span data-ds-hits-skip>toner</span> <code>toner</code>';
    document.querySelector('#fx-component').append(el);
    const handle = window.DS.hits.create(el, { query: 'toner' });
    const result = [handle.get().count, el.querySelectorAll('mark').length];
    handle.destroy();
    result.push(el.querySelectorAll('mark').length, el.textContent);
    el.remove();
    return result;
  });
  expect(out).toEqual([2, 3, 1, 'toner toner toner toner']);
});

test('a re-render is marked again; set() emits ds:change with the count', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const list = document.querySelector('[data-demo="list"]');
    window.DS.dom.morphHtml(list, '<li class="ds-list__item">Toner for the north building</li>');
    await new Promise((r) => requestAnimationFrame(r));
    const after = [...list.querySelectorAll('mark.ds-hit')].map((m) => m.textContent);
    const detail = await new Promise((done) => {
      list.addEventListener('ds:change', (event) => done(event.detail), { once: true });
      window.DS.get(list, 'hits').set('north');
    });
    return [after, detail];
  });
  expect(result).toEqual([['Toner'], { query: 'north', count: 1 }]);
});

test('colours and shape: the warning container pair; square with .ds-shape-square', async ({ page }) => {
  await open(page);
  const mark = page.locator('#fx-component [data-demo="list"] mark').first();
  const [bg, ink, expectBg, expectInk] = await mark.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.background = 'var(--ds-warning-container)';
    probe.style.color = 'var(--ds-on-warning-container)';
    document.querySelector('#fx-component').append(probe);
    const out = [getComputedStyle(el).backgroundColor, getComputedStyle(el).color, getComputedStyle(probe).backgroundColor, getComputedStyle(probe).color];
    probe.remove();
    return out;
  });
  expect([bg, ink]).toEqual([expectBg, expectInk]);
  await mark.evaluate((el) => el.closest('.ds-card').classList.add('ds-shape-square'));
  expect(await mark.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe('0px');
});

test('forced colours: Mark and MarkText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const [bg, expected] = await page.locator('#fx-component [data-demo="list"] mark').first().evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'forced-color-adjust: none; background: Mark';
    document.body.append(probe);
    const out = [getComputedStyle(el).backgroundColor, getComputedStyle(probe).backgroundColor];
    probe.remove();
    return out;
  });
  expect(bg).toBe(expected);
});
