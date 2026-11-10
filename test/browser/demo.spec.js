/**
 * The live tour (demo/, the start page on GitHub Pages): it loads only its
 * project bundle (demo/ds/, written by tools/bundle.mjs), starts without a
 * console error, sets each stop up only when it comes near the view, the
 * drawer and the command palette follow the stops, and every stop works end
 * to end (actions, forms with dates and a combobox, the data grid and the
 * charts, live data, overlays, navigation, content, the chat, the theme and
 * its generator, the icons). It runs in the `fallback` project too, so the
 * tour also works on the browser floor. `?live=0` stops the polling, so no
 * live update moves a row under a click.
 *
 * The last two tests measure the tour on a slow phone (Chromium, 4x CPU,
 * 390x844) and run only with DS_TOUR_PERF=1, alone: other workers on the CPU
 * would make every time noise.
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

const TOUR = '/demo/index.html?live=0';

/**
 * settle() of helpers/motion.js for the tour: every finite animation has
 * finished, except those inside a stop whose rendering the browser skips
 * (content-visibility: auto, far from the view). Firefox and WebKit hold
 * those at their first frame until the stop comes near, so they never end.
 */
async function settle(page, { timeout = 3000 } = {}) {
  const pending = await page.evaluate(async (limit) => {
    const deadline = performance.now() + limit;
    const shown = (animation) => {
      const target = animation.effect && animation.effect.target;
      return !target || typeof target.checkVisibility !== 'function' || target.checkVisibility({ contentVisibilityAuto: true });
    };
    const running = () => document.getAnimations().filter((animation) => {
      if (typeof ScrollTimeline === 'function' && animation.timeline instanceof ScrollTimeline) return false;
      const iterations = animation.effect && animation.effect.getComputedTiming().iterations;
      return Number.isFinite(iterations) && animation.playState !== 'finished' && animation.playState !== 'idle' && shown(animation);
    });
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
    for (;;) {
      let list = running();
      if (!list.length) {
        await frame();
        list = running();
        if (!list.length) return [];
      }
      if (performance.now() >= deadline) return list.map((a) => `${a.animationName || a.transitionProperty || a.id || 'script'} (${a.playState})`);
      await Promise.race([
        Promise.allSettled(list.map((animation) => animation.finished)),
        new Promise((resolve) => setTimeout(resolve, deadline - performance.now())),
      ]);
      await frame();
    }
  }, timeout);
  if (pending.length) throw new Error(`Animations did not settle within ${timeout}ms: ${pending.join(', ')}`);
}

/** Console errors and warnings, page errors and unhandled rejections of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

async function open(page, hash = '', query = '') {
  // A fresh theme for every test, once: a reload inside the test keeps the choice.
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem('demo-test')) return;
      sessionStorage.setItem('demo-test', '1');
      localStorage.removeItem('demo-theme');
      localStorage.removeItem('demo-theme-css');
    } catch (error) { /* blocked */ }
  });
  await page.goto(TOUR + query + hash);
  await ready(page);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-demo-ready'));
  await settle(page);
}

/** Brings a stop into view and waits until the tour has set it up. */
async function stop(page, id) {
  await page.evaluate((target) => document.getElementById(target).scrollIntoView({ block: 'start' }), id);
  await expect(page.locator(`#${id}`)).toHaveAttribute('data-demo-ready', '', { timeout: 15000 });
  await settle(page);
}

test('loads only its bundle, starts without a console error, and a drawer link takes the view to its stop', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  const assets = await page.evaluate(() => ({
    sheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => new URL(link.href).pathname),
    scripts: [...document.scripts].filter((script) => script.src).map((script) => new URL(script.src).pathname),
  }));
  expect(assets.sheets).toContain('/demo/ds/ds.bundle.css');
  expect(assets.scripts).toContain('/demo/ds/ds.bundle.js');
  expect([...assets.sheets, ...assets.scripts].filter((path) => /\/dist\/ds(\.min)?\.(css|js)$/.test(path))).toEqual([]);
  await expect(page.locator('#facts .ds-tile')).toHaveCount(4);
  await expect(page.locator('html')).toHaveClass(/ds-ripples/);
  await expect(page.locator('#nav [aria-current="page"]')).toHaveAttribute('href', '#welcome');
  await page.locator('#nav a[href="#overlays"]').click();
  await expect(page.locator('#nav [aria-current="page"]')).toHaveAttribute('href', '#overlays');
  await expect(page.locator('#overlays-title')).toBeFocused();
  await expect.poll(() => page.locator('#overlays').evaluate((section) => {
    const view = document.getElementById('main');
    return Math.round(section.getBoundingClientRect().top - view.getBoundingClientRect().top);
  }), { timeout: 10000 }).toBeLessThan(40);
  await expect(page.locator('#overlays')).toHaveAttribute('data-demo-ready', '');
  expect(new URL(page.url()).hash).toBe('#overlays');
  expect(errors).toEqual([]);
});

test('a stop waits in data-ds-managed until it comes near the view, then the system takes it over', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  const far = page.locator('#chat');
  await expect(far).toHaveAttribute('data-ds-managed', '');
  await expect(far).not.toHaveAttribute('data-demo-ready', '');
  // Nothing of it ran yet: no controller on its transcript, no icons drawn.
  expect(await page.evaluate(() => DS.core.get(document.querySelector('#transcript'), 'transcript'))).toBeNull();
  await stop(page, 'chat');
  await expect(far).not.toHaveAttribute('data-ds-managed', '');
  expect(await page.evaluate(() => Boolean(DS.core.get(document.querySelector('#transcript'), 'transcript')))).toBe(true);
  await expect(page.locator('#chat [data-ds-managed]')).toHaveCount(0);
  await expect(page.locator('#chat [data-icon]:not(:has(svg))')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a link to a stop lands there set up, and the command palette jumps to another', async ({ page }) => {
  await open(page, '#theme');
  await expect(page.locator('#theme')).toHaveAttribute('data-demo-ready', '');
  await expect(page.locator('#nav [aria-current="page"]')).toHaveAttribute('href', '#theme');
  await page.keyboard.press('Control+k');
  await expect(page.locator('#palette')).toHaveAttribute('data-state', 'open');
  await page.locator('#palette-input').fill('chat');
  await page.locator('#palette-input').press('Enter');
  await expect(page.locator('#nav [aria-current="page"]')).toHaveAttribute('href', '#chat', { timeout: 10000 });
  await expect(page.locator('#chat')).toHaveAttribute('data-demo-ready', '', { timeout: 10000 });
});

/** Scrolls the view down by one height at once and waits until `id` is set up. */
async function onwardTo(page, id) {
  await page.evaluate(() => { const view = document.getElementById('main'); view.scrollBy(0, view.clientHeight); });
  await expect(page.locator(`#${id}`)).toHaveAttribute('data-demo-ready', '', { timeout: 10000 });
  await expect(page.locator(`#${id} [data-ds-managed]`)).toHaveCount(0);
  await expect(page.locator(`#${id} [data-icon]:not(:has(svg))`)).toHaveCount(0);
}

/** Waits until a smooth jump has landed on `id` and the tour has lined it up. */
async function landed(page, id) {
  await expect(page.locator(`#${id}`)).toHaveAttribute('data-demo-ready', '', { timeout: 15000 });
  await expect.poll(() => page.locator(`#${id}`).evaluate((section) => {
    const view = document.getElementById('main');
    return Math.round(section.getBoundingClientRect().top - view.getBoundingClientRect().top);
  }), { timeout: 10000 }).toBeLessThan(40);
  await page.waitForTimeout(300);
}

test('after a jump, the stops next to the target set up as the view moves on', async ({ page }) => {
  // The entries of the stops a smooth jump passes or lands near are dropped while it runs: once it lands, the tour
  // watches them afresh, so the next stop sets up although it never crossed the margin again.
  await open(page);
  await page.locator('#welcome a[href="#actions"]').click();
  await landed(page, 'actions');
  await onwardTo(page, 'forms');
  await page.locator('#nav a[href="#overlays"]').click();
  await landed(page, 'overlays');
  await onwardTo(page, 'feedback');
});

test('the appearance switch pins the scheme and the tour keeps it', async ({ page }) => {
  await open(page);
  await page.locator('.ds-topbar [data-ds-scheme-value="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'dark');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('demo-theme')).appearance)).toBe('dark');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-demo-ready'));
  await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'dark');
  await expect(page.locator('.ds-topbar [data-ds-scheme-value="dark"]')).toHaveAttribute('aria-checked', 'true');
  await page.locator('.ds-topbar [data-ds-scheme-value="auto"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-ds-scheme', /./);
});

test('actions: a toggle group says its value, the split button opens its menu, the priority bar folds', async ({ page }) => {
  await open(page);
  await stop(page, 'actions');
  await page.locator('#view-toggle button[value="board"]').click();
  await expect(page.locator('#view-out')).toHaveText('View: board');
  await expect(page.locator('#view-toggle button[value="board"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.ds-split-btn__toggle').click();
  await expect(page.locator('#save-menu')).toBeVisible();
  await page.locator('#save-menu [data-say="Saved as a copy."]').click();
  await expect(page.locator('.ds-toast', { hasText: 'Saved as a copy.' })).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(page.locator('.ds-priority-bar [data-ds-folded]').first()).toBeAttached();
});

test('a search that leaves nothing shows the empty state; clearing the filters brings the rows back', async ({ page }) => {
  await open(page);
  await stop(page, 'live');
  const rows = page.locator('#live-body tr');
  const total = await rows.count();
  expect(total).toBeGreaterThan(0);
  await page.locator('#live-search').fill('no such device');
  await settle(page);
  await expect(rows).toHaveCount(0);
  await expect(page.locator('#live-empty .ds-empty')).toBeVisible();
  await page.locator('#live-empty [data-clear-filters]').click();
  await settle(page);
  await expect(rows).toHaveCount(total);
  await expect(page.locator('#live-empty .ds-empty')).toHaveCount(0);
  await expect(page.locator('#live-search')).toBeFocused();
});

test('sorting by name puts the rows in order and turns the header', async ({ page }) => {
  await open(page);
  await stop(page, 'live');
  await page.locator('[data-sort="name"]').click();
  await settle(page);
  await expect(page.locator('#live-head th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
  const names = await page.locator('#live-body [data-device]').allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

test('the dialog asks first and the snackbar offers an undo; the menu toggles its check', async ({ page }) => {
  await open(page);
  await stop(page, 'overlays');
  await page.locator('#open-dialog').click();
  await settle(page);
  await expect(page.locator('#confirm')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('#confirm [autofocus]')).toBeFocused();
  await page.locator('#confirm-delete').click();
  // Busy while the delete runs: Escape waits (data-ds-busy), the button works.
  await expect(page.locator('#confirm')).toHaveAttribute('data-ds-busy', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('#confirm')).toHaveAttribute('data-state', 'open');
  const toast = page.locator('.ds-toast', { hasText: '3 devices deleted.' });
  await expect(toast).toBeVisible();
  await expect(page.locator('#open-dialog')).toBeFocused();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.ds-toast', { hasText: 'Restored.' })).toBeVisible();

  await page.locator('#open-menu').click();
  await settle(page);
  await expect(page.locator('#open-menu')).toHaveAttribute('aria-expanded', 'true');
  const pinned = page.locator('#demo-menu [role="menuitemcheckbox"]');
  await pinned.click();
  await expect(pinned).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#open-menu')).toHaveAttribute('aria-expanded', 'false');
});

test('a row opens the side sheet, whose arrows step through the devices', async ({ page }) => {
  await open(page);
  await stop(page, 'live');
  const first = page.locator('#live-body [data-device]').first();
  await first.click();
  await settle(page);
  const name = await first.textContent();
  await expect(page.locator('#sheet-title')).toHaveText(name);
  await page.locator('#sheet [data-step="1"]').click();
  await settle(page);
  await expect(page.locator('#sheet-title')).not.toHaveText(name);
  // The pointer off the arrow: its tooltip would be the top layer, which Escape dismisses first.
  await page.mouse.move(1, 1);
  await settle(page);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(page.locator('#sheet')).not.toHaveAttribute('open', '');
  await expect(first).toBeFocused();
});

test('the form shows its errors on submit, takes a model from the combobox and adds the device', async ({ page }) => {
  await open(page);
  await stop(page, 'forms');
  await page.locator('#demo-form [type="submit"]').click();
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#f-name-error')).toHaveText('Give the device a name.');
  await expect(page.locator('#f-name')).toBeFocused();
  await page.locator('#f-name').fill('Lab printer');
  await expect(page.locator('#f-name')).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#f-model').pressSequentially('rack');
  await expect(page.locator('#f-model')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#model-list [role="option"]:not([hidden])')).toHaveCount(2);
  await page.locator('#f-model').press('ArrowDown');
  await page.locator('#f-model').press('Enter');
  await expect(page.locator('#f-model')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#f-model')).toHaveValue('Rack Server 1U');
  await page.locator('#demo-form [type="submit"]').click();
  await expect(page.locator('.ds-toast', { hasText: 'Lab printer added.' })).toBeVisible();
  await expect(page.locator('#f-name')).toHaveValue('');
});

test('dates, times and codes: the pickers render their fields, the code field accepts a pasted code', async ({ page }) => {
  await open(page);
  await stop(page, 'forms');
  await expect(page.locator('#due-picker [role="spinbutton"]').first()).toBeVisible();
  await expect(page.locator('#dates-title ~ * [data-ds-timepicker] [role="spinbutton"]').first()).toBeVisible();
  await page.locator('#due-picker .ds-datefield__toggle').click();
  await expect(page.locator('.ds-calendar').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#otp .ds-otp__cell').first().fill('123456');
  await expect(page.locator('.ds-toast', { hasText: 'Code accepted.' })).toBeVisible();
});

test.describe('the combobox under touch (WebKit)', () => {
  // A phone: Firefox cannot create an isMobile context, and the tap's click is WebKit's question.
  test.skip(({ browserName }) => browserName !== 'webkit', 'the iOS engine');
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 664 } });

  test('a tap on an option chooses it', async ({ page }) => {
    await open(page);
    await stop(page, 'forms');
    const field = page.locator('#f-model');
    await field.scrollIntoViewIfNeeded();
    // A tap on the field shows what it offers (a second tap, on the chevron, would close it again).
    await field.tap();
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await settle(page);
    const option = page.locator('#model-list [role="option"]').first();
    const name = (await option.locator('.ds-combo__name').textContent()).trim();
    await option.tap();
    await expect(field).toHaveValue(name);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
  });
});

test('the CSV import takes files from its dialog, uploads each with its progress, and a removal moves the focus on (2.0)', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await stop(page, 'forms');
  const csv = (name) => ({ name, mimeType: 'text/csv', buffer: Buffer.from('name,owner\nLAPTOP-0042,Ada Lovelace\n') });
  await page.locator('#csv-zone .ds-dropzone__input').setInputFiles([csv('devices.csv'), csv('owners.csv'), { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('png') }]);
  const rows = page.locator('#csv-files .ds-list__item');
  // The accept filter of the input keeps the image out.
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('devices.csv');
  await expect(rows.nth(0).locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '100', { timeout: 10000 });
  await expect(rows.nth(1)).toContainText('Uploaded', { timeout: 10000 });
  await rows.nth(0).locator('[data-remove]').focus();
  await rows.nth(0).locator('[data-remove]').press('Enter');
  await expect(rows).toHaveCount(1);
  await expect(page.locator('[aria-label="Remove owners.csv"]')).toBeFocused();
  await page.locator('[aria-label="Remove owners.csv"]').press('Enter');
  await expect(rows).toHaveCount(0);
  await expect(page.locator('#csv-zone .ds-dropzone__input')).toBeFocused();
  expect(errors).toEqual([]);
});

test('the data grid pages, filters and sorts; new data reaches the charts', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await stop(page, 'data');
  const rows = page.locator('#grid tbody tr');
  await expect(rows).toHaveCount(8);
  await expect(page.locator('#grid-pages .ds-pagination__range')).toContainText('of 40');
  await page.locator('#grid-filter').fill('Grace');
  await expect.poll(() => rows.count()).toBeLessThan(8);
  for (const owner of await page.locator('#grid tbody tr td:nth-child(4)').allTextContents()) expect(owner).toContain('Grace');
  await page.locator('#grid-filter').fill('');
  await expect(page.locator('#chart-line svg').first()).toBeVisible();
  const before = await page.locator('#chart-line').innerHTML();
  // A card far from the view skips its rendering (.demo-part); WebKit scrolls nothing inside it into view by
  // script (focus does), so the card comes first.
  await page.locator('#chart-new').evaluate((button) => button.closest('.demo-part').scrollIntoView({ block: 'center' }));
  await page.locator('#chart-new').click();
  await expect.poll(() => page.locator('#chart-line').innerHTML(), { timeout: 5000 }).not.toBe(before);
  await expect(page.locator('#tracker .ds-tracker__cell')).toHaveCount(60);
  await expect(page.locator('#tracker-summary')).toContainText('uptime');
  expect(errors).toEqual([]);
});

test('navigation: Next moves the steps on and marks the one behind done; a tab shows its panel', async ({ page }) => {
  await open(page);
  await stop(page, 'navigation');
  const steps = page.locator('#steps .ds-steps__step');
  await page.locator('#steps-next').click();
  await expect(steps.nth(2).locator('[aria-current="step"]')).toBeAttached();
  await expect(steps.nth(1)).toHaveAttribute('data-status', 'done');
  await page.locator('#steps-back').click();
  await expect(steps.nth(1).locator('[aria-current="step"]')).toBeAttached();
  await expect(steps.nth(1)).not.toHaveAttribute('data-status', 'done');
  await page.locator('#tab-history').click();
  await expect(page.locator('#panel-history')).toBeVisible();
  await expect(page.locator('#panel-details')).toBeHidden();
});

test('content: the Markdown preview renders as you type', async ({ page }) => {
  await open(page);
  await stop(page, 'content');
  await expect(page.locator('#md-preview h2')).toHaveText('Retire a device');
  await page.locator('#md-source').fill('# Hello\n\n- one\n- two');
  await expect(page.locator('#md-preview h1')).toHaveText('Hello');
  await expect(page.locator('#md-preview li')).toHaveCount(2);
});

test('the chat: a sent message gets a streamed reply that ends complete', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await stop(page, 'chat');
  const input = page.locator('#composer textarea');
  await input.fill('Which other laptops drain overnight?');
  await input.press('Enter');
  await expect(page.locator('#messages .ds-message--user').last()).toContainText('Which other laptops drain overnight?');
  const reply = page.locator('#messages .ds-message--assistant').nth(1);
  await expect(reply).toBeAttached({ timeout: 10000 });
  await expect(reply).toHaveAttribute('data-ds-message', '', { timeout: 15000 });
  await expect(reply).not.toHaveAttribute('data-state', /./);
  await expect(reply.locator('.ds-message__content')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('the theme: a preset swaps the file, a colour of your own goes through the generator, the choice is kept', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await stop(page, 'theme');
  const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-primary').trim());
  const before = await primary();
  await expect(page.locator('#theme-code')).toContainText('default preset');
  await page.locator('#theme-seeds label', { hasText: 'Ocean' }).click();
  await expect(page.locator('#theme-seeds input[value="ocean"]')).toBeChecked();
  await expect(page.locator('#demo-preset')).toHaveAttribute('href', '../dist/themes/presets/ocean.css');
  await expect.poll(primary).not.toBe(before);
  await expect(page.locator('#theme-code')).toContainText('presets/ocean.css');
  await page.locator('#theme-shape').selectOption('0');
  await expect(page.locator('#theme-code')).toContainText('--ds-shape: 0;');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('demo-theme')))).toMatchObject({ preset: 'ocean', shape: '0' });

  await page.locator('#theme-hex').fill('#b3264d');
  await page.locator('#theme-use').click();
  await expect(page.locator('#theme-code')).toContainText('generated by tools/theme.mjs', { timeout: 10000 });
  await expect.poll(() => page.evaluate(() => document.getElementById('demo-custom').textContent)).toContain('light-dark(');
  await expect(page.locator('#theme-report')).toContainText('every pair passes');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-demo-ready'));
  // Kept, before the first paint: the generated file is in the page again, the preset's link off.
  expect(await page.evaluate(() => document.getElementById('demo-custom').textContent.includes('light-dark('))).toBe(true);
  expect(await page.evaluate(() => document.getElementById('demo-preset').disabled)).toBe(true);
  await stop(page, 'theme');
  await page.locator('#theme-form [type="reset"]').click();
  await expect.poll(primary).toBe(before);
  await expect(page.locator('#theme-seeds input[value="default"]')).toBeChecked();
  expect(errors).toEqual([]);
});

test('the icon filter narrows the grid and an unknown name shows the empty state', async ({ page }) => {
  await open(page);
  await stop(page, 'icons');
  await expect(page.locator('#icon-grid .demo-icon')).toHaveCount(276);
  await page.locator('#icon-search').fill('arrow');
  await settle(page);
  // The four arrows, the four diagonals and arrowLeftRight.
  await expect(page.locator('#icon-grid .demo-icon')).toHaveCount(9);
  await page.locator('#icon-search').fill('zzz');
  await settle(page);
  await expect(page.locator('#icon-grid .demo-icon')).toHaveCount(0);
  await expect(page.locator('#icon-empty .ds-empty')).toBeVisible();
});

test('feedback: the import runs its bar, its ring and its figure to the end; an alert comes and goes', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  await stop(page, 'feedback');
  await page.locator('#run-import').click();
  await expect(page.locator('#import-label')).toHaveText('Preparing');
  await expect(page.locator('#import-ring')).toHaveAttribute('aria-valuenow', '100', { timeout: 15000 });
  await expect(page.locator('#import-label')).toHaveText('100%', { timeout: 5000 });
  await expect(page.locator('#import-detail')).toHaveText('2,030 of 2,030 rows');
  const before = await page.locator('#alerts .ds-alert').count();
  await page.locator('#add-alert').click();
  await expect(page.locator('#alerts .ds-alert')).toHaveCount(before + 1);
  // Status never by colour alone: every alert carries its icon and its words.
  for (const alert of await page.locator('#alerts .ds-alert').all()) {
    await expect(alert.locator('svg')).toHaveCount(1);
    await expect(alert.locator('.ds-alert__text')).not.toBeEmpty();
  }
  await page.locator('#alerts [data-dismiss]').first().click();
  await expect(page.locator('#alerts .ds-alert:not(.ds-leave)')).toHaveCount(before);
});

test('layout and people: the split pane resizes from the keyboard, the avatar group counts the rest', async ({ page }) => {
  await open(page);
  await stop(page, 'layout');
  const divider = page.locator('#layout .ds-splitpane__divider');
  const width = () => page.locator('#split-list').evaluate((pane) => Math.round(pane.getBoundingClientRect().width));
  const start = await width();
  await divider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect.poll(width).toBeGreaterThan(start);
  await stop(page, 'people');
  const more = page.locator('#people-group .ds-avatar-group__more');
  await expect(more).toHaveText('+3');
  await page.locator('#add-person').click();
  await expect(more).toHaveText('+4');
  await expect(more).toHaveAttribute('aria-label', '4 more');
});

test('get started: the tabs swap the snippet, which names only what the bundle tool knows', async ({ page }) => {
  await open(page);
  await stop(page, 'start');
  await expect(page.locator('#start-bundle-code')).toBeVisible();
  await page.locator('#start-page').click();
  await expect(page.locator('#start-page-code')).toBeVisible();
  await expect(page.locator('#start-bundle-code')).toBeHidden();
  await expect(page.locator('#start-page-code')).toContainText('ds/ds.bundle.js');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('nothing is wider than the screen or its card, and the menu opens the drawer as a modal sheet', async ({ page }) => {
    test.setTimeout(90000);
    await open(page);
    const stops = await page.$$eval('.demo-section', (sections) => sections.map((section) => section.id));
    for (const id of stops) {
      await stop(page, id);
      const wide = await page.evaluate(() => document.getElementById('main').scrollWidth - document.getElementById('main').clientWidth);
      expect(wide, id).toBeLessThanOrEqual(0);
      // Inside each card nothing passes its content box (a cut-off option would not widen the view): the parts
      // that bleed to the card's edge by design (a table, its pager) stay inside its padding box, and what sits in
      // a scroller of its own (the data grid, a code block, a strip) scrolls there. One known exception, the
      // system's: a date range field needs about 300px for its two dates at the 16px field text and takes up to
      // 14px of its card's padding at 360px in Chromium (it does not wrap yet; DS.picker / timerange).
      const past = await page.locator(`#${id}`).evaluate((section) => {
        const out = [];
        const known = (element) => Boolean(element.closest('.ds-field')?.querySelector(':scope > .ds-picker .ds-daterange__preset'));
        const scrolls = (element, card) => {
          for (let node = element.parentElement; node && node !== card; node = node.parentElement) {
            if (getComputedStyle(node).overflowX !== 'visible') return true;
          }
          return false;
        };
        for (const card of section.querySelectorAll('.ds-card')) {
          const box = card.getBoundingClientRect();
          const style = getComputedStyle(card);
          const content = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
          const padding = box.right - parseFloat(style.borderRightWidth);
          for (const element of card.querySelectorAll('*')) {
            if (element.closest('.ds-sr, [hidden], [popover], dialog, .ds-menu, .ds-picker__popover') || !element.getClientRects().length) continue;
            const rect = element.getBoundingClientRect();
            if (!rect.width || scrolls(element, card) || known(element)) continue;
            const bleeds = parseFloat(getComputedStyle(element).marginRight) < 0;
            if (rect.right > (bleeds ? padding : content) + 1) out.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}.${String(element.className.baseVal ?? element.className).split(' ')[0]} by ${Math.round(rect.right - content)}px`);
          }
        }
        return out;
      });
      expect(past, `${id}: nothing past its card`).toEqual([]);
    }
    await page.locator('#menu').click();
    await expect(page.locator('#app')).toHaveAttribute('data-drawer-open', '');
    await page.locator('#nav a[href="#people"]').click();
    await expect(page.locator('#app')).not.toHaveAttribute('data-drawer-open', '');
    await expect(page.locator('#people')).toHaveAttribute('data-demo-ready', '', { timeout: 10000 });
  });
});

/** Long tasks and interactions (event timing) of the page, from its start. */
async function watchMainThread(page) {
  await page.addInitScript(() => {
    window.demoLong = [];
    window.demoInteractions = [];
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.demoLong.push(Math.round(entry.duration)); }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (entry.interactionId) window.demoInteractions.push(Math.round(entry.duration));
    }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  });
}

/** The longest interaction (event-timing duration: input to the next paint) of what `act` does. */
async function interaction(page, act) {
  await page.evaluate(() => window.demoInteractions.splice(0));
  await act();
  await page.waitForTimeout(1500);
  return Math.max(0, ...await page.evaluate(() => window.demoInteractions.splice(0)));
}

/** The scope of the tour: no task over 200ms after the load at 4x CPU, and an answer within it. */
const TASK_BUDGET = 200;
/**
 * What opening the dialog and sorting the grid cost today, in the system rather than the tour: opening the confirm
 * dialog restyles the page (DS.overlay: inert and the scroll lock); sorting runs DS.motion.flip, whose
 * getAnimations() commits the whole document's style, and the grid's syncSeparators() reads each header's width
 * after writing the one before (a layout per column). Down to TASK_BUDGET once those land; never raised.
 */
const SYSTEM_BUDGET = 400;

test('on a slow phone (4x CPU) no task of the tour runs over 200ms: the start and the stops as they set up', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || !process.env.DS_TOUR_PERF, 'CPU throttling is a CDP command; times need the CPU alone: DS_TOUR_PERF=1, chromium only');
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  await watchMainThread(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  try {
    await open(page);
    await page.waitForTimeout(2000);
    // The start: the frame paints, then DS.core.init() (the pills read a finished layout), then the tiles count.
    const load = await page.evaluate(() => window.demoLong.splice(0));
    const stops = await page.$$eval('.demo-section', (sections) => sections.map((section) => section.id));
    for (const id of stops) await stop(page, id);
    const scroll = await page.evaluate(() => window.demoLong.splice(0));
    testInfo.annotations.push({ type: 'tour at 4x CPU', description: `load ${JSON.stringify(load)}; stops ${JSON.stringify(scroll)}` });
    expect(Math.max(0, ...load), 'the longest task of the start').toBeLessThan(TASK_BUDGET);
    expect(Math.max(0, ...scroll), 'the longest task while the stops set up').toBeLessThan(TASK_BUDGET);
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
});

test('on a slow phone (4x CPU) opening the dialog and sorting the data grid answer in time', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || !process.env.DS_TOUR_PERF, 'CPU throttling is a CDP command; times need the CPU alone: DS_TOUR_PERF=1, chromium only');
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await watchMainThread(page);
  await open(page);
  await stop(page, 'data');
  await stop(page, 'overlays');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  try {
    const dialog = await interaction(page, () => page.locator('#open-dialog').click());
    await page.keyboard.press('Escape');
    await expect(page.locator('#confirm')).not.toHaveAttribute('data-state', 'open');
    await page.waitForTimeout(1000);
    await page.locator('#data').evaluate((section) => section.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(1000);
    const sort = await interaction(page, () => page.locator('#grid th button').first().click());
    testInfo.annotations.push({ type: 'interactions at 4x CPU', description: `dialog ${dialog}ms; sort ${sort}ms (the scope: ${TASK_BUDGET}ms)` });
    expect(dialog, 'opening the confirm dialog').toBeLessThanOrEqual(SYSTEM_BUDGET);
    expect(sort, 'sorting the data grid').toBeLessThanOrEqual(SYSTEM_BUDGET);
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
});
