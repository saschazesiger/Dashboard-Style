/**
 * DS.core (3.0) in real engines: init() starts every behaviour on the page
 * (a test behaviour, the action guard and the ripple delegation) and its
 * destroy() takes it all back; the observer initialises markup added later
 * and an attribute DS.dom.morphHtml adds in place, and stops what leaves;
 * a keyed reorder (morphHtml, or a remove plus an add in one task) keeps
 * its controllers; data-ds-managed subtrees are skipped until handed back;
 * two copies of ds.js (another version) and the ES modules next to them
 * share one runtime, one overlay stack and one scroll lock. Runs in the
 * `fallback` project too (no moveBefore: a keyed move is a remove plus an
 * add there).
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/core.html');
  await ready(page);
}

/** The test behaviour's log since load. */
const log = (page) => page.evaluate(() => window.fxCore.log.slice());

/** Lets the observer's batch run (its records, then the microtask of the flush). */
const flush = (page) => page.evaluate(() => new Promise((resolve) => setTimeout(resolve)));

test('init() starts every behaviour, the guard and the ripple; destroy() takes them back', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.fxPage = DS.core.init(document); });
  expect(await log(page)).toEqual(['init a', 'init b', 'init c']);
  expect(await page.evaluate(() => DS.core.get(document.getElementById('a'), 'fx').key)).toBe('a');
  expect(await page.evaluate(() => DS.core.get(document.getElementById('a')) === DS.core.get(document.getElementById('a'), 'fx'))).toBe(true);
  // The ripple delegation and the guard are on.
  await expect(page.locator('html')).toHaveClass(/\bds-ripples\b/);
  await page.locator('#blocked').click({ force: true });
  await page.locator('#plain').click();
  expect(await page.evaluate(() => window.fxSeen.slice())).toEqual(['plain']);
  // The calls of 2.x share the runtime: the same handles, no second install.
  expect(await page.evaluate(() => DS.ripple.attach(document) === DS.ripple.attach(document))).toBe(true);
  expect(await page.evaluate(() => DS.overlay.tooltips(document) === DS.overlay.tooltips(document))).toBe(true);
  expect(await page.evaluate(() => DS.core.init(document) && document.querySelectorAll('.ds-tooltip').length)).toBe(1);

  // Markup added later starts, markup removed stops.
  await page.evaluate(() => {
    const item = document.createElement('li');
    item.id = 'd';
    item.setAttribute('data-ds-fx', '');
    document.getElementById('list').append(item);
  });
  await flush(page);
  expect((await log(page)).slice(3)).toEqual(['init d']);
  await page.evaluate(() => document.getElementById('d').remove());
  await flush(page);
  expect((await log(page)).slice(4)).toEqual(['destroy d']);

  // destroy(): the page held the root twice (the init() above); both holds go, then everything stops.
  await page.evaluate(() => { window.fxPage.destroy(); DS.core.destroy(document); });
  expect((await log(page)).slice(5).sort()).toEqual(['destroy a', 'destroy b', 'destroy c']);
  expect(await page.evaluate(() => window.fxCore.made.every((controller) => controller.signal.aborted))).toBe(true);
  expect(await page.evaluate(() => DS.core.get(document.getElementById('a')))).toBeNull();
  await page.evaluate(() => {
    const item = document.createElement('li');
    item.id = 'e';
    item.setAttribute('data-ds-fx', '');
    document.getElementById('list').append(item);
  });
  await flush(page);
  expect((await log(page)).length).toBe(8);
  // The ripple and the guard went with the root (the calls above got init()'s handles, they took nothing extra).
  await expect(page.locator('html')).not.toHaveClass(/\bds-ripples\b/);
  await page.locator('#blocked').click({ force: true });
  expect(await page.evaluate(() => window.fxSeen.slice())).toEqual(['plain', 'blocked']);
});

test('an attribute DS.dom.morphHtml adds in place starts its behaviour; an option restarts it; removing it stops it', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.fxPage = DS.core.init(document);
    window.fxPara = document.getElementById('para');
    DS.dom.morphHtml(document.getElementById('morph'), '<p id="para" data-ds-fx>A paragraph without a behaviour.</p>');
  });
  await flush(page);
  expect(await page.evaluate(() => document.getElementById('para') === window.fxPara)).toBe(true);
  expect((await log(page)).slice(3)).toEqual(['init para']);
  await page.evaluate(() => DS.dom.morphHtml(document.getElementById('morph'), '<p id="para" data-ds-fx data-ds-fx-label="Note">A paragraph without a behaviour.</p>'));
  await flush(page);
  expect((await log(page)).slice(4)).toEqual(['destroy para', 'init para']);
  await page.evaluate(() => DS.dom.morphHtml(document.getElementById('morph'), '<p id="para">A paragraph without a behaviour.</p>'));
  await flush(page);
  expect((await log(page)).slice(6)).toEqual(['destroy para']);
  expect(await page.evaluate(() => DS.core.get(window.fxPara))).toBeNull();
  await page.evaluate(() => window.fxPage.destroy());
});

test('a keyed reorder keeps every controller (morphHtml, and a remove plus an add in one task)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.fxPage = DS.core.init(document); });
  const ids = () => page.evaluate(() => ['a', 'b', 'c'].map((id) => DS.core.get(document.getElementById(id), 'fx').id));
  const before = await ids();
  await page.evaluate(() => DS.dom.morphHtml(document.getElementById('list'), [
    '<li data-ds-key="c" id="c" data-ds-fx>Charlie</li>',
    '<li data-ds-key="a" id="a" data-ds-fx>Alpha</li>',
    '<li data-ds-key="b" id="b" data-ds-fx>Bravo</li>',
  ].join('')));
  await flush(page);
  expect(await page.evaluate(() => [...document.querySelectorAll('#list li')].map((item) => item.id))).toEqual(['c', 'a', 'b']);
  await page.evaluate(() => {
    const list = document.getElementById('list');
    const b = document.getElementById('b');
    list.removeChild(b);
    list.prepend(b);
  });
  await flush(page);
  expect(await page.evaluate(() => [...document.querySelectorAll('#list li')].map((item) => item.id))).toEqual(['b', 'c', 'a']);
  expect(await log(page)).toEqual(['init a', 'init b', 'init c']);
  expect(await ids()).toEqual(before);
  await page.evaluate(() => window.fxPage.destroy());
});

test('data-ds-managed subtrees are skipped, also for markup added later, until the attribute goes', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.fxPage = DS.core.init(document);
    const late = document.createElement('span');
    late.id = 'late';
    late.setAttribute('data-ds-fx', '');
    document.getElementById('managed').append(late);
    document.getElementById('inside').setAttribute('data-ds-fx-label', 'Changed');
  });
  await flush(page);
  expect(await log(page)).toEqual(['init a', 'init b', 'init c']);
  expect(await page.evaluate(() => DS.core.get(document.getElementById('inside')))).toBeNull();
  await page.evaluate(() => document.getElementById('managed').removeAttribute('data-ds-managed'));
  await flush(page);
  expect((await log(page)).slice(3)).toEqual(['init inside', 'init late']);
  await page.evaluate(() => window.fxPage.destroy());
});

test('two copies of ds.js and the ES modules share one runtime, one overlay stack and one scroll lock', async ({ page }) => {
  await open(page);
  // A second copy of the same version merges into the first and changes nothing.
  await page.evaluate(() => new Promise((resolve) => {
    window.fxFirst = { DS: window.DS, overlay: window.DS.overlay, core: window.DS.core };
    const script = document.createElement('script');
    script.src = '/dist/ds.js';
    script.onload = resolve;
    document.head.append(script);
  }));
  expect(await page.evaluate(() => window.DS === window.fxFirst.DS && DS.overlay === window.fxFirst.overlay && DS.core === window.fxFirst.core)).toBe(true);
  // A copy of another version (an embedded widget's), and the ES modules next to the bundle.
  await page.evaluate(async () => {
    const source = await (await fetch('/dist/ds.js')).text();
    const script = document.createElement('script');
    script.textContent = source.split(`'${DS.version}'`).join("'9.9.9'");
    document.head.append(script);
  });
  const shared = await page.evaluate(async () => {
    const other = window.DashboardStyle.versions['9.9.9'];
    const coreModule = await import('/dist/js/core.js');
    const overlayModule = await import('/dist/js/overlay.js');
    window.fxOther = other;
    window.fxModule = overlayModule;
    return {
      version: other.version,
      runtime: other.core.runtime === DS.core.runtime && coreModule.runtime === DS.core.runtime,
      ownCode: other.overlay.open !== DS.overlay.open && overlayModule.open !== DS.overlay.open,
      tooltips: other.overlay.tooltips(document) === DS.overlay.tooltips(document) && overlayModule.tooltips(document) === DS.overlay.tooltips(document),
    };
  });
  expect(shared).toEqual({ version: '9.9.9', runtime: true, ownCode: true, tooltips: true });

  const state = () => page.evaluate(() => {
    const record = DS.core.runtime.state('overlay').get(document);
    return {
      lock: record?.lock.count ?? 0,
      order: (record?.order ?? []).map((entry) => entry.element.id),
      locked: document.body.classList.contains('ds-no-scroll'),
      mirrored: record === undefined || document[Symbol.for('ds.overlay')] === record,
    };
  });
  // The first dialog by the first copy, the second over it by the other version.
  await page.evaluate(async () => {
    await DS.overlay.open(document.getElementById('first'), { opener: document.getElementById('open-first') });
    await window.fxOther.overlay.open(document.getElementById('second'), { opener: document.getElementById('open-second') });
  });
  expect(await state()).toEqual({ lock: 2, order: ['first', 'second'], locked: true, mirrored: true });
  // Escape closes only the top layer, whichever copy opened it; the lock holds until the last one closed.
  await page.keyboard.press('Escape');
  await expect(page.locator('#second')).toBeHidden();
  await expect(page.locator('#first')).toBeVisible();
  expect(await state()).toEqual({ lock: 1, order: ['first'], locked: true, mirrored: true });
  // The ES module opens a layer over the first copy's: the same stack and lock.
  await page.evaluate(() => window.fxModule.open(document.getElementById('second'), { opener: document.getElementById('open-second') }));
  expect(await state()).toEqual({ lock: 2, order: ['first', 'second'], locked: true, mirrored: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('#second')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#first')).toBeHidden();
  expect(await state()).toEqual({ lock: 0, order: [], locked: false, mirrored: true });
});
