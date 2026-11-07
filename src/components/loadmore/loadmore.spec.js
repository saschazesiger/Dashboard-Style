/**
 * Load more and infinite scroll (DS.loadmore): the status and the button by
 * keyboard, aria-busy, the announcements, the end (the button goes, the
 * status takes its focus), a failure that tries again, the sentinel with its
 * limit, focus on the first new row, the options and forced colours. Runs
 * in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/test/browser/fixtures/component.html?c=loadmore');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Everything the live regions of the page said since `mark()`. */
async function listen(page) {
  await page.evaluate(() => {
    window.said = [];
    new MutationObserver(() => {
      for (const node of document.querySelectorAll('[aria-live]')) if (node.textContent.trim()) window.said.push(node.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  return () => page.evaluate(() => [...new Set(window.said)].join('\n'));
}

const block = (page, name) => page.locator('.ds-loadmore').filter({ has: page.locator(`xpath=preceding-sibling::ul[@aria-label="${name}"]`) });

test('the status says how many show; the button loads by keyboard, the list is busy meanwhile, and it is announced', async ({ page }) => {
  await open(page);
  const said = await listen(page);
  const list = page.getByRole('list', { name: 'Devices', exact: true });
  const more = block(page, 'Devices');
  await expect(more.locator('.ds-loadmore__status')).toHaveText('Showing 5 of 17');
  await expect(list.getByRole('listitem')).toHaveCount(5);
  const button = more.getByRole('button', { name: 'Load more devices' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(more).toHaveAttribute('data-state', 'loading');
  await expect(list).toHaveAttribute('aria-busy', 'true');
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(more).not.toHaveAttribute('data-state', /./);
  await expect(list).not.toHaveAttribute('aria-busy', /./);
  await expect(list.getByRole('listitem')).toHaveCount(10);
  await expect(more.locator('.ds-loadmore__status')).toHaveText('Showing 10 of 17');
  await expect(button).toBeFocused();
  await expect.poll(said).toContain('Loaded 5 more. Showing 10 of 17');
});

test('the end: the button goes, the status takes its focus and says that everything shows', async ({ page }) => {
  await open(page);
  const said = await listen(page);
  const more = block(page, 'Devices');
  const button = more.locator('.ds-loadmore__button');
  for (const shown of ['Showing 10 of 17', 'Showing 15 of 17']) {
    await button.focus();
    await page.keyboard.press('Space');
    await expect(more.locator('.ds-loadmore__status')).toHaveText(shown);
  }
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(more).toHaveAttribute('data-state', 'done');
  await expect(button).toBeHidden();
  await expect(more.locator('.ds-loadmore__status')).toHaveText('All 17 shown');
  await expect(more.locator('.ds-loadmore__status')).toBeFocused();
  await expect.poll(said).toContain('Loaded 2 more. All 17 shown');
  // A list that shows everything from the start has no button.
  const all = block(page, 'All devices');
  await expect(all).toHaveAttribute('data-state', 'done');
  await expect(all.locator('.ds-loadmore__button')).toBeHidden();
  await expect(all.locator('.ds-loadmore__status')).toHaveText('All 4 shown');
});

test('a failure says so in words with an icon, the button tries again, and the next press works', async ({ page }) => {
  await open(page);
  const said = await listen(page);
  const more = block(page, 'Devices that fail to load');
  const button = more.locator('.ds-loadmore__button');
  await button.click();
  await expect(more).toHaveAttribute('data-state', 'error');
  await expect(more.locator('.ds-loadmore__status')).toHaveText('Could not load more.');
  await expect(more.locator('.ds-loadmore__icon')).toBeVisible();
  await expect(button).toHaveAccessibleName('Try again');
  await expect.poll(said).toContain('Could not load more.');
  await button.click();
  await expect(more.locator('.ds-loadmore__status')).toHaveText('Showing 8 of 12');
  await expect(more.locator('.ds-loadmore__icon')).toBeHidden();
  await expect(button).toHaveAccessibleName('Load more devices');
});

test('the infinite scroll loads as the end shows, three times, then waits for the button', async ({ page }) => {
  await open(page);
  const scroller = page.locator('.sg-loadmore-scroll');
  const list = scroller.getByRole('list');
  const more = scroller.locator('.ds-loadmore');
  await expect(list.getByRole('listitem')).toHaveCount(8);
  const end = () => scroller.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  for (const count of [16, 24, 32]) {
    await end();
    await expect(list.getByRole('listitem')).toHaveCount(count);
    await expect(more).not.toHaveAttribute('data-state', /./);
  }
  await end();
  await page.waitForTimeout(1500);
  await expect(list.getByRole('listitem')).toHaveCount(32);
  expect(await page.evaluate(() => DS.get(document.querySelector('.sg-loadmore-scroll .ds-loadmore')).get())).toEqual({ loaded: 32, total: 60, state: 'idle' });
  await more.getByRole('button').click();
  await expect(list.getByRole('listitem')).toHaveCount(40);
});

test('focus "new" moves to the first new row; no total: the end comes with done', async ({ page }) => {
  await open(page);
  const list = page.getByRole('list', { name: 'Open tickets' });
  const more = block(page, 'Open tickets');
  await expect(more.locator('.ds-loadmore__status')).toHaveText('Showing 3');
  await more.getByRole('button').focus();
  await page.keyboard.press('Enter');
  await expect(list.getByRole('listitem')).toHaveCount(6);
  await expect(list.getByRole('listitem').nth(3)).toBeFocused();
  await more.getByRole('button').click();
  await expect(list.getByRole('listitem')).toHaveCount(9);
  await more.getByRole('button').click();
  await expect(more).toHaveAttribute('data-state', 'done');
  await expect(more.locator('.ds-loadmore__status')).toHaveText('All 12 shown');
});

test('the controller: create with load, set, reset, one load at a time', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<ul id="probe-list"><li>a</li></ul><div class="ds-loadmore" data-ds-loadmore-for="#probe-list"><p class="ds-loadmore__status"><span class="ds-loadmore__text"></span></p><button class="ds-btn ds-loadmore__button" type="button">More</button></div>';
    document.querySelector('#fx-component').append(host);
    const el = host.querySelector('.ds-loadmore');
    let calls = 0;
    const more = DS.loadmore.create(el, { loaded: 1, total: 3, load: () => { calls += 1; return new Promise((resolve) => setTimeout(() => resolve(1), 50)); } });
    const same = DS.loadmore.create(el) === more;
    const first = more.load();
    const second = more.load();
    await first;
    await second;
    const after = more.get();
    more.reset({ loaded: 3, total: 3 });
    const done = more.get();
    more.reset({ loaded: 0, total: null });
    more.set({ loaded: 2 });
    const text = el.querySelector('.ds-loadmore__text').textContent;
    host.remove();
    return { same, calls, after, done, text };
  });
  expect(seen).toEqual({ same: true, calls: 1, after: { loaded: 2, total: 3, state: 'idle' }, done: { loaded: 3, total: 3, state: 'done' }, text: 'Showing 2' });
});

test('a reset during a slow load drops it: the next load keeps its own counts and sends one change', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<ul id="probe-list"><li>a</li></ul><div class="ds-loadmore" data-ds-loadmore-for="#probe-list"><p class="ds-loadmore__status"><span class="ds-loadmore__text"></span></p><button class="ds-btn ds-loadmore__button" type="button">More</button></div>';
    document.querySelector('#fx-component').append(host);
    const el = host.querySelector('.ds-loadmore');
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let slow = true;
    const more = DS.loadmore.create(el, {
      loaded: 5,
      total: 30,
      status: ({ loaded, total }) => `${loaded} of ${total} devices`,
      load: () => (slow ? wait(1500).then(() => ({ loaded: 10 })) : wait(100).then(() => ({ loaded: 15 }))),
    });
    const changes = [];
    more.on('change', (detail) => changes.push(detail));
    const said = [];
    new MutationObserver(() => {
      for (const node of document.querySelectorAll('[aria-live]')) if (node.textContent.trim()) said.push(node.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
    const first = more.load();
    await wait(800);
    more.reset({ loaded: 5, total: 30 });
    slow = false;
    const second = more.load();
    const answered = await second;
    const list = document.querySelector('#probe-list').getAttribute('aria-busy');
    await first;
    await wait(1200);
    const result = { answered, state: more.get(), changes: changes.map(({ loaded, added }) => ({ loaded, added })), list, text: el.querySelector('.ds-loadmore__text').textContent, said: said.some((text) => text.includes('15 of 30 devices')) };
    more.destroy();
    host.remove();
    return result;
  });
  expect(seen).toEqual({
    answered: { loaded: 15, total: 30, state: 'idle' },
    state: { loaded: 15, total: 30, state: 'idle' },
    changes: [{ loaded: 15, added: 10 }],
    list: null,
    text: '15 of 30 devices',
    said: true,
  });
});

test('options: density steps the padding, size and touch reach the button; a phone keeps it in 360px', async ({ page }) => {
  await open(page);
  const measure = (classes) => page.evaluate((classes) => {
    const host = document.createElement('div');
    host.className = classes;
    host.innerHTML = '<div class="ds-loadmore"><p class="ds-loadmore__status"><span class="ds-loadmore__text">Showing 1</span></p><button class="ds-btn ds-loadmore__button" type="button">More</button></div>';
    document.querySelector('#fx-component').append(host);
    const el = host.firstChild;
    const out = { pad: parseFloat(getComputedStyle(el).paddingTop), button: el.querySelector('button').getBoundingClientRect().height };
    host.remove();
    return out;
  }, classes);
  const plain = await measure('');
  expect(plain).toEqual({ pad: 16, button: 40 });
  expect((await measure('ds-density-compact')).pad).toBe(14);
  expect((await measure('ds-density-tight')).pad).toBe(10);
  expect((await measure('ds-sm')).button).toBe(32);
  expect((await measure('ds-touch ds-density-tight')).button).toBeGreaterThanOrEqual(48);
  await page.setViewportSize({ width: 360, height: 800 });
  await settle(page);
  for (const el of await page.locator('.ds-loadmore').all()) {
    const box = await el.boundingBox();
    if (box) expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});

test('forced colours: the failure keeps its icon and words in system colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const more = block(page, 'Devices that fail to load');
  await more.locator('.ds-loadmore__button').click();
  await expect(more).toHaveAttribute('data-state', 'error');
  const colours = await more.evaluate((el) => {
    const status = el.querySelector('.ds-loadmore__status');
    return { status: getComputedStyle(status).color, icon: getComputedStyle(el.querySelector('.ds-loadmore__icon')).color, canvasText: (() => { const probe = document.createElement('span'); probe.style.color = 'CanvasText'; document.body.append(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; })() };
  });
  expect(colours.status).toBe(colours.canvasText);
  expect(colours.icon).toBe(colours.status);
  await expect(more.locator('.ds-loadmore__status')).toHaveText('Could not load more.');
});
