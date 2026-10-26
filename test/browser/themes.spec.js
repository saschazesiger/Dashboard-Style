/**
 * Theming in the engines (2.0): derived roles resolve to the 1.x values and
 * follow their source, the floating surfaces and the colour scheme reach
 * the components, the shipped themes (dark, compact, contrast) apply where
 * they are loaded, and the styleguide, the live tour and the reference app
 * offer them. In Chromium also a dark baseline of the controls fixture and
 * the frame (the only dark shots of the set).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

/**
 * The computed colour of `value` (a var() or a colour) on a probe inside
 * the first .ds-theme, as [r, g, b, a] in 0-255 and 0-1. Engines serialise
 * color-mix() results as rgb() or color(srgb ...); both are read.
 */
function colourOf(page, value, selector = '.ds-theme') {
  return page.evaluate(([css, where]) => {
    const host = document.querySelector(where);
    const probe = document.createElement('span');
    probe.style.color = css;
    host.appendChild(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    const srgb = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)$/.exec(text);
    if (srgb) return [srgb[1], srgb[2], srgb[3]].map((c) => Number(c) * 255).concat(srgb[4] === undefined ? 1 : Number(srgb[4]));
    const rgb = /^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)$/.exec(text);
    if (rgb) return [rgb[1], rgb[2], rgb[3]].map(Number).concat(rgb[4] === undefined ? 1 : Number(rgb[4]));
    return text;
  }, [value, selector]);
}

function expectColour(actual, expected, label) {
  expect(Array.isArray(actual), `${label}: ${actual}`).toBe(true);
  for (let i = 0; i < 3; i += 1) expect(Math.abs(actual[i] - expected[i]), `${label}: channel ${i} of ${actual}`).toBeLessThanOrEqual(1);
  expect(Math.abs(actual[3] - expected[3]), `${label}: alpha of ${actual}`).toBeLessThanOrEqual(0.01);
}

async function openFixture(page, name, themes = []) {
  await page.goto(`${FIXTURES}${name}`);
  for (const theme of themes) await page.addStyleTag({ url: `/dist/themes/${theme}.css` });
  await ready(page);
  await settle(page);
}

test.describe('roles', () => {
  test('derived roles resolve to the 1.x values and follow a source set on .ds-theme', async ({ page }) => {
    await openFixture(page, 'controls.html');
    const expected = {
      '--ds-primary-hover': [31, 100, 212, 1],
      '--ds-primary-pressed': [9, 74, 177, 1],
      '--ds-link-underline': [11, 87, 208, 0.4],
      '--ds-fill-round': [31, 31, 31, 0.08],
      '--ds-disabled-fill': [31, 31, 31, 0.12],
      '--ds-disabled-ink': [31, 31, 31, 0.38],
    };
    for (const [name, value] of Object.entries(expected)) expectColour(await colourOf(page, `var(${name})`), value, name);
    // A theme that sets the source on the element itself: the mixes follow.
    await page.addStyleTag({ content: '.ds-theme { --ds-primary: #006a6a; --ds-text: #191c1c; }' });
    expectColour(await colourOf(page, 'var(--ds-primary-hover)'), [20, 118, 118, 1], 'hover follows --ds-primary');
    expectColour(await colourOf(page, 'var(--ds-link-underline)'), [0, 106, 106, 0.4], 'underline follows --ds-link');
    expectColour(await colourOf(page, 'var(--ds-disabled-ink)'), [25, 28, 28, 0.38], 'disabled ink follows --ds-text');
  });

  test('the colour scheme and the floating surfaces reach the theme root and the overlays', async ({ page }) => {
    await openFixture(page, 'overlay.html');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-theme')).colorScheme)).toBe('light');
    await page.addStyleTag({ content: '.ds-theme { --ds-surface-overlay: #fafafa; --ds-surface-popover: #f5f5f5; }' });
    const backgrounds = await page.evaluate(() => Object.fromEntries(['.ds-dialog__box', '.ds-sheet__panel', '.ds-menu']
      .map((selector) => [selector, document.querySelector(selector)])
      .filter(([, el]) => el)
      .map(([selector, el]) => [selector, getComputedStyle(el).backgroundColor])));
    expect(Object.keys(backgrounds).length, 'the fixture has floating layers').toBeGreaterThan(0);
    for (const [selector, colour] of Object.entries(backgrounds)) {
      expect(colour, selector).toBe(selector === '.ds-menu' ? 'rgb(245, 245, 245)' : 'rgb(250, 250, 250)');
    }
  });
});

test.describe('shipped themes', () => {
  test('dark: the palette, the scheme and the floating surfaces a tone above the page', async ({ page }) => {
    await openFixture(page, 'overlay.html', ['dark']);
    const theme = await page.evaluate(() => {
      const root = document.querySelector('.ds-theme');
      const style = getComputedStyle(root);
      return { scheme: style.colorScheme, surface: style.getPropertyValue('--ds-surface').trim(), overlay: style.getPropertyValue('--ds-surface-overlay').trim() };
    });
    expect(theme).toEqual({ scheme: 'dark', surface: '#1e1f20', overlay: '#282a2c' });
    const box = page.locator('.ds-dialog__box').first();
    if (await box.count()) expect(await box.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(40, 42, 44)');
    // The derived mixes follow the dark text and primary.
    expectColour(await colourOf(page, 'var(--ds-disabled-ink)'), [227, 227, 227, 0.38], 'disabled ink from the dark text');
  });

  test('compact: shorter controls and 13px UI text on a fine pointer, 16px field text kept on phones', async ({ page }) => {
    await openFixture(page, 'controls.html', ['compact']);
    const sizes = await page.evaluate(() => {
      const button = document.querySelector('#btn-outlined');
      return { button: button.getBoundingClientRect().height, font: getComputedStyle(button).fontSize };
    });
    expect(sizes).toEqual({ button: 32, font: '13px' });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-font-input').trim())).toMatch(/ 16px\/24px /);
  });

  test('contrast: secondary text as text, a 3px ring, solid underlines, on the default and the dark palette', async ({ page }) => {
    await openFixture(page, 'controls.html', ['contrast']);
    expect(await colourOf(page, 'var(--ds-text-2)')).toEqual(await colourOf(page, 'var(--ds-text)'));
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-focus-outline').trim())).toMatch(/^3px solid/);
    await page.addStyleTag({ url: '/dist/themes/dark.css' });
    await page.addStyleTag({ url: '/dist/themes/contrast.css' });
    const [text, outline] = [await colourOf(page, 'var(--ds-text)'), await colourOf(page, 'var(--ds-outline)')];
    expectColour(text, [227, 227, 227, 1], 'dark text');
    // 80% of the dark text over the dark surface: a light outline.
    expect(outline[0]).toBeGreaterThan(180);
  });
});

test.describe('where the themes are offered', () => {
  test('the styleguide: dark, compact, contrast and System (dark and contrast as the device asks)', async ({ page }) => {
    await page.goto('/styleguide/index.html');
    await ready(page);
    const scheme = () => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    for (const [value, expected] of [['dark', 'dark'], ['compact', 'light'], ['contrast', 'light'], ['default', 'light']]) {
      await page.locator('#sg-theme-select').selectOption(value);
      await expect(page.locator('html')).toHaveAttribute('data-sg-theme', value, { timeout: 15000 });
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ds-vt'), null, { timeout: 15000 });
      expect(await scheme(), value).toBe(expected);
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.locator('#sg-theme-select').selectOption('system');
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'system', { timeout: 15000 });
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ds-vt'), null, { timeout: 15000 });
    expect(await scheme()).toBe('dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(scheme).toBe('light');
  });

  test('the tour: the scheme choice links the dark theme and writes it into the theme file', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('demo-theme'); } catch (error) { /* blocked */ } });
    await page.goto('/demo/index.html');
    await ready(page);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-demo-ready'));
    await expect(page.locator('#demo-dark')).toHaveAttribute('media', 'not all');
    await page.locator('#theme-form input[value="teal"]').check({ force: true });
    await page.locator('#theme-form input[value="dark"]').check({ force: true });
    await expect(page.locator('#demo-dark')).toHaveAttribute('media', 'all');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-primary').trim())).toBe('#4cdada');
    await expect(page.locator('#theme-code')).toContainText('themes/dark.css');
    await expect(page.locator('#theme-code')).toContainText('dark tones');
    await page.locator('#theme-form input[value="system"]').check({ force: true });
    await expect(page.locator('#demo-dark')).toHaveAttribute('media', '(prefers-color-scheme: dark)');
    await expect(page.locator('#theme-code')).toContainText('@media (prefers-color-scheme: dark)');
  });

  test('the reference app: Appearance under Settings sets the dark link before the first paint', async ({ page }) => {
    await page.goto('/example/index.html#/settings');
    await ready(page);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
    await settle(page);
    await expect(page.locator('#ex-dark')).toHaveAttribute('media', '(prefers-color-scheme: dark)');
    await page.locator('input[name="appearance"][value="dark"]').check({ force: true });
    await expect(page.locator('#ex-dark')).toHaveAttribute('media', 'all');
    await expect(page.locator('html')).toHaveAttribute('data-ex-dark', '');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
    await page.reload();
    await ready(page);
    await expect(page.locator('#ex-dark')).toHaveAttribute('media', 'all');
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-ex-ready'));
    await settle(page);
    await page.locator('input[name="appearance"][value="system"]').check({ force: true });
    await expect(page.locator('#ex-dark')).toHaveAttribute('media', '(prefers-color-scheme: dark)');
    await expect(page.locator('html')).not.toHaveAttribute('data-ex-dark', '');
  });

  test('the styleguide theme check lists what a loaded theme fails, each row with an icon and a word', async ({ page }) => {
    await page.goto('/styleguide/index.html');
    await ready(page);
    const check = page.locator('#sg-theme-check');
    await expect(check.locator('.sg-finding[data-ok="false"]')).toHaveCount(0);
    await expect(check.locator('.sg-finding[data-ok="true"]')).toContainText('contrast pairs pass');
    const css = '.ds-theme {\n  --ds-text-2: color-mix(in srgb, #9aa0a6 80%, white);\n  --ds-font-input: var(--ds-font-body);\n  --ds-dur-fast: 1ms;\n}\n';
    await page.locator('#sg-theme-file').setInputFiles({ name: 'weak.css', mimeType: 'text/css', buffer: Buffer.from(css) });
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'file', { timeout: 15000 });
    const failing = check.locator('.sg-finding[data-ok="false"]');
    await expect(failing.filter({ hasText: /--ds-text-2 on --ds-surface: .*needs 4\.5:1 \(text\)/ })).toHaveCount(1);
    await expect(failing.filter({ hasText: '--ds-font-input is 14px' })).toHaveCount(1);
    await expect(failing.filter({ hasText: '--ds-dur-fast' })).toHaveCount(1);
    // Status never by colour alone: every row has its icon and its word.
    for (const row of await failing.all()) {
      await expect(row.locator('.ds-status svg')).toHaveCount(1);
      await expect(row.locator('.ds-status')).toContainText('Fails');
    }
    await page.locator('#sg-theme-select').selectOption('default');
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'default', { timeout: 15000 });
    await expect(check.locator('.sg-finding[data-ok="false"]')).toHaveCount(0);
  });
});

test.describe('dark baseline (Chromium)', () => {
  test.use({ viewport: { width: 1280, height: 2200 } });

  test('the controls fixture and the frame in the dark theme', async ({ page, browserName, dsFallback }) => {
    test.skip(browserName !== 'chromium' || !!dsFallback, 'the dark set is shot in Chromium only, to keep the set lean');
    await openFixture(page, 'controls.html', ['dark']);
    await page.mouse.move(1, 1);
    for (const id of ['buttons', 'chips', 'switch', 'checks', 'table', 'fields', 'nav']) {
      const section = page.locator(`section[aria-labelledby="${id}-title"]`);
      await settle(page);
      await expect.soft(section, id).toHaveScreenshot(`dark-controls-${id}.png`, { animations: 'disabled' });
    }
    await page.setViewportSize({ width: 1000, height: 800 });
    await openFixture(page, 'shell.html', ['dark']);
    await page.mouse.move(1, 1);
    await settle(page);
    await expect.soft(page, 'frame').toHaveScreenshot('dark-shell-docked.png', { animations: 'disabled' });
  });
});
