/**
 * The page on the options model (3.0), on its demo: the page's own rhythm
 * does not follow density or size, the head's actions line up with the
 * button's computed height at every option; the details row (a label over its
 * value, wrapping, printed); the tabs row of the head; empty parts take no
 * room; breadcrumbs (type by size, the touch minimum, keyboard, the parent at
 * 600px); names; forced colours. The 2.x behaviour stays in
 * test/browser/page.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=page';

async function open(page) {
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const HEAD = '.ds-page-head:has(.ds-page-head__details dd)';

test('the head\'s actions centre on the title line at every size and density', async ({ page }) => {
  await open(page);
  for (const classes of ['', 'ds-sm', 'ds-lg', 'ds-density-compact', 'ds-density-tight', 'ds-lg ds-density-dense', 'ds-touch']) {
    const result = await page.$eval(HEAD, (head, names) => {
      head.className = `ds-page-head ${names}`;
      const title = head.querySelector('.ds-page-head__title').getBoundingClientRect();
      const button = head.querySelector('.ds-page-head__actions .ds-btn').getBoundingClientRect();
      return { title: title.top + title.height / 2, button: button.top + button.height / 2 };
    }, classes);
    expect(Math.abs(result.title - result.button), `"${classes}"`).toBeLessThanOrEqual(1);
  }
});

test('the page\'s own rhythm stays: density and size change the controls inside, not its padding or gaps', async ({ page }) => {
  await open(page);
  const read = () => page.evaluate(() => {
    const content = document.querySelector('#page-rhythm');
    const inner = content.querySelector('.ds-page');
    return { pad: getComputedStyle(content).paddingTop, gap: getComputedStyle(inner).rowGap, button: content.querySelector('.ds-btn').getBoundingClientRect().height };
  });
  await page.evaluate(() => {
    const content = document.createElement('div');
    content.className = 'ds-content';
    content.id = 'page-rhythm';
    content.innerHTML = '<div class="ds-page"><p>One</p><button class="ds-btn" type="button">Add</button></div>';
    document.querySelector('#fx-component').append(content);
  });
  const before = await read();
  await page.$eval('#page-rhythm', (el) => el.classList.add('ds-density-tight'));
  const after = await read();
  expect(after.pad).toBe(before.pad);
  expect(after.gap).toBe(before.gap);
  expect(after.button).toBe(before.button - 12);
});

test('the details row: a label over its value, tabular figures, wrapping; it prints, the actions do not', async ({ page }) => {
  await open(page);
  const details = page.locator(`${HEAD} .ds-page-head__details`);
  const first = await details.locator('.ds-page-head__detail').first().evaluate((el) => {
    const term = el.querySelector('dt');
    const value = el.querySelector('dd');
    return {
      under: value.getBoundingClientRect().top >= term.getBoundingClientRect().bottom - 1,
      termFont: parseFloat(getComputedStyle(term).fontSize),
      valueFont: parseFloat(getComputedStyle(value).fontSize),
      margin: getComputedStyle(value).marginInlineStart,
      numeric: getComputedStyle(value).fontVariantNumeric,
    };
  });
  expect(first).toEqual({ under: true, termFont: 12, valueFont: 14, margin: '0px', numeric: 'tabular-nums' });
  await details.evaluate((el) => { el.style.inlineSize = '200px'; });
  const rows = await details.locator('.ds-page-head__detail').evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size);
  expect(rows).toBeGreaterThan(1);
  await details.evaluate((el) => { el.style.inlineSize = ''; });
  await page.emulateMedia({ media: 'print' });
  await expect(details).toBeVisible();
  await expect(page.locator(`${HEAD} .ds-page-head__actions`)).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
});

test('the tabs row is the head\'s last row, with its indicator on the current link', async ({ page }) => {
  await open(page);
  const tabs = page.locator(`${HEAD} .ds-page-head__tabs`);
  const geometry = await tabs.evaluate((el) => {
    const head = el.parentElement;
    const details = head.querySelector('.ds-page-head__details');
    return { last: head.lastElementChild === el, gap: el.getBoundingClientRect().top - details.getBoundingClientRect().bottom };
  });
  expect(geometry.last).toBe(true);
  expect(geometry.gap).toBe(4 + 12);
  const links = page.getByRole('navigation', { name: 'LAPTOP-0042' }).getByRole('link');
  await expect(links).toHaveCount(3);
  await links.nth(1).click();
  await expect(links.nth(1)).toHaveAttribute('aria-current', 'page');
  await settle(page);
  const landed = await tabs.evaluate((el) => {
    const pill = el.querySelector('.ds-tabs__indicator').getBoundingClientRect();
    const link = el.querySelector('[aria-current="page"]').getBoundingClientRect();
    return Math.abs(pill.left - link.left);
  });
  expect(landed).toBeLessThan(1);
});

test('empty parts take no room: lead, status, actions, details and tabs', async ({ page }) => {
  await open(page);
  const head = page.locator('.ds-page-head', { hasText: 'No status yet' });
  for (const part of ['lead', 'status', 'actions', 'details', 'tabs']) {
    expect(await head.locator(`.ds-page-head__${part}`).evaluate((el) => getComputedStyle(el).display), part).toBe('none');
  }
});

test('breadcrumbs: type by size at any ancestor, the touch minimum, the parent alone at 600px of the content', async ({ page }) => {
  await open(page);
  const crumbs = page.locator('.ds-breadcrumbs');
  const link = crumbs.locator('a').first();
  const font = () => link.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await font()).toBe(14);
  await crumbs.evaluate((el) => el.classList.add('ds-xs'));
  expect(await font()).toBe(12);
  await crumbs.evaluate((el) => el.classList.remove('ds-xs'));
  const before = await link.evaluate((el) => el.getBoundingClientRect().height);
  expect(before).toBeLessThan(48);
  await crumbs.evaluate((el) => el.classList.add('ds-touch'));
  expect(await link.evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
  // The text stays on the link's centre.
  const centred = await link.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return Math.abs((text.top + text.height / 2) - (box.top + box.height / 2));
  });
  expect(centred).toBeLessThan(2);
  await crumbs.evaluate((el) => el.classList.remove('ds-touch'));

  const narrow = await page.$eval('.ds-breadcrumbs', (el) => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-content';
    wrap.style.inlineSize = '400px';
    wrap.append(el.cloneNode(true));
    document.querySelector('#fx-component').append(wrap);
    const shown = [...wrap.querySelectorAll('li')].filter((item) => getComputedStyle(item).display !== 'none').map((item) => item.textContent);
    wrap.remove();
    return shown;
  });
  expect(narrow).toEqual(['Devices']);
});

test('keyboard and names: the back link reads its target, breadcrumbs are stops with the link ring, the page is marked', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('link', { name: 'Back to Devices', exact: true })).toHaveCount(1);
  const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(nav.getByRole('link', { name: 'LAPTOP-0042' })).toHaveAttribute('aria-current', 'page');
  const first = nav.getByRole('link').first();
  await focusByKeyboard(page, first);
  await expect(first).toBeFocused();
  expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link').nth(1)).toBeFocused();
});

test('forced colours: the breadcrumb chevrons paint in CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colours = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.forcedColorAdjust = 'none';
    probe.style.backgroundColor = 'CanvasText';
    document.querySelector('.ds-theme').append(probe);
    const text = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { text, chevron: getComputedStyle(document.querySelector('.ds-breadcrumbs li + li'), '::before').backgroundColor };
  });
  expect(colours.chevron).toBe(colours.text);
});
