/**
 * The 3.0 styleguide shell (styleguide/index.html, shell.js, sg-core.js):
 * the drawer generated from the registered demos and the registry of the
 * meta.json files, every demo rendering without a console error, the
 * options panel putting its classes and attributes around the demo, the
 * search, the theme generator (live over http, the presets from disk) and
 * the page working from file://. The 2.x sections are tested on
 * legacy.html by the older specs.
 */
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { ready } from './helpers/motion.js';

const SHELL = '/styleguide/index.html';
const FILE = new URL('../../styleguide/index.html', import.meta.url).href;

/** Console errors and uncaught exceptions of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

/** Goes to a route of the shell and waits until it is rendered. */
async function go(page, route) {
  await page.evaluate((hash) => { location.hash = hash; }, `#/${route}`);
  await expect(page.locator('html')).toHaveAttribute('data-sg-route', route);
}

async function open(page, route = '') {
  await page.goto(`${SHELL}#/${route}`);
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-sg-route', route);
}

test.describe('navigation', () => {
  test('the drawer lists every registered demo under its meta.json group, then the foundations and the 2.x page', async ({ page }) => {
    await open(page);
    const { demos, registry } = await page.evaluate(() => ({
      demos: window.SG.list().map((spec) => spec.name),
      registry: Object.fromEntries(window.SG_REGISTRY.components.map((c) => [c.name, c.group])),
    }));
    expect(demos.length, 'at least one demo is registered').toBeGreaterThan(0);
    for (const name of demos) {
      const item = page.locator(`#sg-nav a.ds-drawer__item[href="#/components/${name}"]`);
      await expect(item, name).toHaveCount(1);
      // The heading of the item's group names the meta.json group.
      const heading = await item.evaluate((a) => a.closest('.ds-drawer__group').querySelector('.ds-drawer__heading').textContent);
      const titles = { data: 'Data display', forms: 'Forms and inputs', actions: 'Actions', overlays: 'Overlays', navigation: 'Navigation', feedback: 'Feedback', layout: 'Layout', content: 'Content', motion: 'Motion' };
      expect(heading, name).toBe(titles[registry[name]] ?? heading);
    }
    for (const href of ['#/', '#/needs', '#/colour', '#/type', '#/shape', '#/elevation', '#/motion', '#/icons', '#/tokens', '#/theme', 'motion.html', 'legacy.html']) {
      await expect(page.locator(`#sg-nav a[href="${href}"]`), href).toHaveCount(1);
    }
  });

  test('a drawer item opens its page, marks itself current and moves focus to the title', async ({ page }) => {
    await open(page);
    const name = await page.evaluate(() => window.SG.list()[0].name);
    const title = await page.evaluate((n) => window.SG.get(n).title, name);
    await page.locator(`#sg-nav a[href="#/components/${name}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', `components/${name}`);
    await expect(page.locator('#sg-page h1')).toHaveText(title);
    await expect(page.locator(`#sg-nav a[href="#/components/${name}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#sg-nav [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('#sg-page h1')).toBeFocused();
    await page.goBack();
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', '');
  });

  test('the need overview lists the need line of each demo and the 2.x need rows; a row without a demo links to the 2.x page; the filter narrows it', async ({ page }) => {
    await open(page, 'needs');
    const expected = await page.evaluate(() => {
      const own = window.SG.list().map((spec) => [spec.need, spec.name]);
      return [...new Set([...own, ...window.SG_REGISTRY.needs].map(([, name]) => name))].sort();
    });
    const shown = await page.locator('tr[data-sg-need]').evaluateAll((rows) => [...new Set(rows.map((row) => row.getAttribute('data-sg-need')))].sort());
    expect(shown).toEqual(expected);
    const first = await page.evaluate(() => window.SG.list()[0]);
    await expect(page.locator('tbody tr').first().locator('td').first()).toHaveText(first.need);
    await expect(page.locator(`tr[data-sg-need="${first.name}"] a`).first()).toHaveAttribute('href', `#/components/${first.name}`);
    const missing = await page.evaluate(() => window.SG_REGISTRY.needs.map(([, name]) => name).find((name) => !window.SG.get(name)));
    if (missing) await expect(page.locator(`tr[data-sg-need="${missing}"] a`).first()).toHaveAttribute('href', /^legacy\.html#/);
    await page.locator('#sg-need-filter').fill(first.need);
    await expect(page.locator('tbody tr:not([hidden])')).toHaveCount(1);
    await expect(page.locator('#sg-need-count')).toHaveText('1 needs');
  });

  test('every foundation page renders without a console error; the colour page checks the theme', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page);
    for (const route of ['needs', 'colour', 'type', 'shape', 'elevation', 'motion', 'icons', 'tokens', 'search', 'nowhere']) {
      await go(page, route);
      await expect(page.locator('#sg-page h1'), route).toBeVisible();
    }
    await go(page, 'colour');
    await expect(page.locator('[data-sg="theme-check"] .sg-finding').first()).toContainText('contrast pairs pass');
    await expect(page.locator('[data-sg="theme-check"] .sg-finding[data-ok="false"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test('every registered demo renders into its stage and wires without a console error', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  const names = await page.evaluate(() => window.SG.list().map((spec) => spec.name));
  for (const name of names) {
    await go(page, `components/${name}`);
    const root = page.locator(`#sg-stage > .sg-demo-root[data-sg-demo="${name}"]`);
    await expect(root, name).toHaveCount(1);
    expect(await root.evaluate((el) => el.children.length), `${name} renders markup`).toBeGreaterThan(0);
    await expect(page.locator('#sg-stage'), name).toHaveClass(/\bds-theme\b/);
  }
  expect(errors).toEqual([]);
});

test('a demo wires inside the stage: the chart demo takes new values and opens a column with a snackbar', async ({ page }) => {
  await open(page, 'components/chart');
  const stage = page.locator('#sg-stage');
  const col = stage.locator('[data-chart="columns"] .ds-columns__col').first();
  const before = await col.evaluate((el) => el.style.getPropertyValue('--ds-share'));
  await stage.locator('[data-chart-action="values"]').click();
  expect(await col.evaluate((el) => el.style.getPropertyValue('--ds-share'))).not.toBe(before);
  await stage.locator('[data-chart-action="open"]').first().click();
  await expect(page.locator('.ds-toasts .ds-toast').first()).toContainText('Opened the tickets of Mon');
});

test('the width option drives container behaviour: what queries the "ds-content" container narrows with the stage', async ({ page }) => {
  await open(page, 'components/chart');
  // .ds-facts with four entries: two columns up to 1040px of the container, one up to 520px.
  await page.locator('#sg-stage .sg-demo-root').evaluate((root) => {
    const facts = document.createElement('dl');
    facts.className = 'ds-facts';
    facts.id = 'sg-probe-facts';
    for (const name of ['Owner', 'Place', 'Seen', 'Ticket']) facts.insertAdjacentHTML('beforeend', `<div><dt>${name}</dt><dd>Ada Lovelace</dd></div>`);
    root.append(facts);
  });
  const columns = () => page.locator('#sg-probe-facts').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(await columns()).toBe(2);
  await page.locator('#sg-opt-width').fill('480');
  await expect.poll(columns).toBe(1);
  await page.locator('#sg-opt-width').fill('1280');
  await expect.poll(columns).toBe(2);
});

test('the speed select and ?speed= slow the page as on the 2.x page; the Motion Lab link stays', async ({ page }) => {
  await page.goto(`${SHELL}?speed=0.25#/components/chart`);
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-sg-speed', '0.25');
  await expect(page.locator('#sg-speed-select')).toHaveValue('0.25');
  await expect(page.locator('#sg-speed-readout')).toHaveText('Slow motion 0.25\u00d7');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-time-scale').trim())).toBe('4');
  await page.locator('#sg-speed-select').selectOption('1');
  await expect(page.locator('html')).not.toHaveAttribute('data-sg-speed', /./);
  await expect(page.locator('#sg-speed-readout')).toBeHidden();
  await page.locator('#sg-speed-select').selectOption('0.5');
  await page.reload();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-sg-speed', '0.25');
  await page.goto(SHELL);
  await ready(page);
  await expect(page.locator('html'), 'the choice of the select is stored').toHaveAttribute('data-sg-speed', '0.5');
  await page.locator('#sg-nav a[href="motion.html"]').click();
  await page.waitForURL(/motion\.html/);
  await ready(page);
  await expect(page.locator('#sg-nav a[href="index.html"]')).toHaveCount(1);
});

test.describe('options panel', () => {
  test('size, density, shape and touch become classes on the stage; scheme, contrast and preset apply to the page', async ({ page }) => {
    await open(page);
    const name = await page.evaluate(() => window.SG.list()[0].name);
    await go(page, `components/${name}`);
    const stage = page.locator('#sg-stage');
    const panel = page.locator('.sg-options');
    // The defaults add no class: the theme's own density and shape show.
    expect(await stage.evaluate((el) => [...el.classList].filter((c) => /^ds-(xs|sm|md|lg|xl|touch|density-|shape-|tone-)/.test(c)))).toEqual([]);

    await panel.locator('[data-sg-option="size"] [data-sg-value="lg"]').click();
    await expect(stage).toHaveClass(/\bds-lg\b/);
    await expect(panel.locator('[data-sg-option="size"] [data-sg-value="lg"]')).toHaveAttribute('aria-checked', 'true');
    await panel.locator('[data-sg-option="size"] [data-sg-value="xs"]').click();
    await expect(stage).toHaveClass(/\bds-xs\b/);
    await expect(stage).not.toHaveClass(/\bds-lg\b/);

    await panel.locator('select[data-sg-option="density"]').selectOption('dense');
    await expect(stage).toHaveClass(/\bds-density-dense\b/);
    await panel.locator('select[data-sg-option="shape"]').selectOption('square');
    await expect(stage).toHaveClass(/\bds-shape-square\b/);
    await panel.locator('input[data-sg-option="touch"]').check();
    await expect(stage).toHaveClass(/\bds-touch\b/);

    // The width: the stage's inline size, and full again at the slider's end.
    await panel.locator('#sg-opt-width').fill('480');
    await expect(stage).toHaveAttribute('style', /inline-size:\s*480px/);
    expect(Math.round((await stage.boundingBox()).width)).toBe(480);
    await expect(page.locator('#sg-opt-width-out')).toHaveText('480px');
    await panel.locator('#sg-opt-width').fill('1280');
    await expect(page.locator('#sg-opt-width-out')).toHaveText('Full');
    expect(await stage.getAttribute('style') ?? '').not.toMatch(/inline-size/);

    // The scheme pins the page and the stage (a .ds-theme of its own).
    await panel.locator('[data-sg-option="scheme"] [data-sg-value="dark"]').click();
    await expect(stage).toHaveAttribute('data-ds-scheme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'dark');
    expect(await stage.evaluate((el) => getComputedStyle(el).colorScheme)).toBe('dark');
    await panel.locator('[data-sg-option="scheme"] [data-sg-value="auto"]').click();
    await expect(stage).not.toHaveAttribute('data-ds-scheme', /./);

    // Contrast and preset load the preset files for the whole page.
    await panel.locator('input[data-sg-option="contrast"]').check();
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'default-contrast auto');
    await panel.locator('select[data-sg-option="preset"]').selectOption('ocean');
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'ocean-contrast auto');
    const href = await page.evaluate(() => [...document.querySelectorAll('#sg-preset, #sg-preset-2')].find((link) => !link.disabled).getAttribute('href'));
    expect(href).toBe('../dist/themes/presets/ocean-contrast.css');

    // The stage's choice carries over to the next demo page; Reset clears it.
    await panel.locator('[data-sg="reset-options"]').click();
    await expect(stage).not.toHaveClass(/\bds-(xs|density-dense|shape-square|touch)\b/);
  });

  test('SG.mount renders a demo with tone and variant, re-renders only for them, and runs the cleanup of wire', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(() => {
      const log = [];
      window.SG.demo('sg-probe', {
        title: 'Probe',
        group: 'actions',
        need: 'Test the API',
        options: { variants: ['filled', 'outlined'], tones: ['success', 'error'], sizes: ['sm', 'md'] },
        render: (h) => `<p data-variant="${h.variant ?? 'all'}" data-tone="${h.tone ?? 'none'}" id="${h.uid('probe')}">${h.esc('<Probe>')}</p>${h.icon('check', 16)}`,
        wire: (root) => { log.push('wire'); return () => log.push('cleanup'); },
      });
      const stage = document.createElement('div');
      document.querySelector('#sg-page').append(stage);
      const handle = window.SG.mount('sg-probe', stage, { size: 'sm', tone: 'success' });
      const first = { classes: [...stage.classList], text: stage.textContent, tone: stage.querySelector('p').dataset.tone, svg: Boolean(stage.querySelector('svg[aria-hidden="true"]')) };
      handle.update({ density: 'compact' });
      const sameRoot = handle.root === stage.querySelector('.sg-demo-root');
      handle.update({ variant: 'outlined', tone: 'error', scheme: 'dark' });
      const second = { classes: [...stage.classList], variant: stage.querySelector('p').dataset.variant, tone: stage.querySelector('p').dataset.tone, scheme: stage.getAttribute('data-ds-scheme') };
      handle.destroy();
      let threw = '';
      try { window.SG.demo('sg-bad', { title: 'Bad', render: () => '', options: { sizes: ['huge'] } }); } catch (error) { threw = error.message; }
      return { first, second, sameRoot, log, empty: stage.children.length, choices: window.SG.choices(window.SG.get('sg-probe')), threw };
    });
    expect(result.first.classes).toEqual(expect.arrayContaining(['ds-theme', 'sg-demo-stage', 'ds-sm', 'ds-tone-success']));
    expect(result.first.text).toBe('<Probe>');
    expect(result.first.tone).toBe('success');
    expect(result.first.svg).toBe(true);
    expect(result.sameRoot, 'density changes no markup').toBe(true);
    expect(result.second.classes).toEqual(expect.arrayContaining(['ds-sm', 'ds-density-compact', 'ds-tone-error']));
    expect(result.second.classes).not.toContain('ds-tone-success');
    expect(result.second).toMatchObject({ variant: 'outlined', tone: 'error', scheme: 'dark' });
    // The cleanup of wire runs before the next render and on destroy.
    expect(result.log).toEqual(['wire', 'cleanup', 'wire', 'cleanup']);
    expect(result.empty).toBe(0);
    expect(result.choices).toEqual({ variants: ['filled', 'outlined'], sizes: ['sm', 'md'], density: [], tones: ['success', 'error'], shape: [] });
    expect(result.threw).toMatch(/"huge" is not one of xs, sm, md, lg, xl/);
  });
});

test.describe('search', () => {
  test('finds components by name and need, classes, hooks and tokens, and opens what it finds', async ({ page }) => {
    await open(page);
    // "/" focuses the search; typing opens the search page.
    await page.locator('body').press('/');
    await expect(page.locator('#sg-search')).toBeFocused();
    await page.keyboard.type('chart');
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', 'search');
    const components = page.locator('#sg-results ul[aria-label="Components"]');
    await expect(components.locator('a', { hasText: 'Charts' })).toHaveAttribute('href', '#/components/chart');
    await expect(page.locator('#sg-search')).toBeFocused();

    await page.locator('#sg-search').fill('ds-btn--tonal');
    await expect(page.locator('#sg-results ul[aria-label="Classes and attributes"] a', { hasText: '.ds-btn--tonal' })).toHaveCount(1);
    await page.locator('#sg-search').fill('--ds-primary');
    const token = page.locator('#sg-results ul[aria-label="Tokens and hooks"] a', { hasText: /^--ds-primary$/ });
    await expect(token).toHaveAttribute('href', '#/tokens?q=--ds-primary');
    await page.locator('#sg-search').fill('qqqzzz');
    await expect(page.locator('#sg-results .ds-empty__title')).toContainText('Nothing matches');

    await page.locator('#sg-search').fill('--ds-primary');
    await page.locator('#sg-results ul[aria-label="Tokens and hooks"] a', { hasText: /^--ds-primary$/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', 'tokens');
    await expect(page.locator('#sg-token-filter')).toHaveValue('--ds-primary');
    await expect(page.locator('tbody tr[data-name="--ds-primary"]')).toBeVisible();
    await expect(page.locator('tbody tr[data-name="--ds-surface"]')).toBeHidden();
  });

  test('the search function covers the need lines (SG_SHELL.search)', async ({ page }) => {
    await open(page);
    const found = await page.evaluate(() => {
      const spec = window.SG.list()[0];
      const word = spec.need.split(/\s+/).find((w) => w.length > 4);
      return { name: spec.title, hits: window.SG_SHELL.search(word).components.map((c) => c.title) };
    });
    expect(found.hits).toContain(found.name);
  });
});

test.describe('theme generator', () => {
  test('generates a theme from a seed over http: previews in both schemes, the pair report and the file', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'theme');
    await expect(page.locator('html')).toHaveAttribute('data-sg-generated', '#0b57d0 tonal standard');
    await expect(page.locator('#sg-theme-report .sg-finding').first()).toContainText(/(\d+) of \1 pairs pass in both schemes/);
    const before = await page.locator('.sg-preview[data-ds-scheme="light"]').evaluate((el) => el.style.getPropertyValue('--ds-primary'));
    expect(before).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);

    await page.locator('#sg-seed').fill('#2f6b3a');
    await page.locator('#sg-scheme').selectOption('vibrant');
    await page.locator('#sg-density').selectOption('-2');
    await expect(page.locator('html')).toHaveAttribute('data-sg-generated', '#2f6b3a vibrant standard');
    const after = await page.locator('.sg-preview[data-ds-scheme="light"]').evaluate((el) => ({ primary: el.style.getPropertyValue('--ds-primary'), density: el.style.getPropertyValue('--ds-density') }));
    expect(after.primary).not.toBe(before);
    expect(after.density.trim()).toBe('-2');
    // The two previews show the two schemes of one theme.
    const colours = await page.locator('.sg-preview').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(colours[0]).not.toBe(colours[1]);
    await expect(page.locator('#sg-theme-css')).toContainText('--ds-density: -2;');

    const download = page.waitForEvent('download');
    await page.locator('[data-sg="download-theme"]').click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('custom.css');
    const text = await (await file.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString('utf8'));
    expect(text).toContain("--seed '#2f6b3a' --scheme vibrant");
    expect(text).toMatch(/\.ds-theme \{\n {2}--ds-color-scheme: light dark;/);

    // "Use in the styleguide" applies the file to the whole page.
    await page.locator('[data-sg="use-theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', /^generated /);
    expect(await page.locator('#sg-generated').evaluate((el) => el.textContent)).toContain('#2f6b3a');
    expect(errors).toEqual([]);
  });
});

test.describe('from disk (file://)', () => {
  test('the shell, a demo page and the 2.x page load without a console error; the generator runs in Firefox and falls back to the presets elsewhere', async ({ page, browserName }) => {
    const errors = collectErrors(page);
    await page.goto(FILE);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-sg-ready'));
    expect(await page.evaluate(() => window.SG.list().length)).toBeGreaterThan(0);
    const name = await page.evaluate(() => window.SG.list()[0].name);
    await page.locator(`#sg-nav a[href="#/components/${name}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', `components/${name}`);
    await expect(page.locator(`#sg-stage [data-sg-demo="${name}"]`)).toHaveCount(1);
    await page.locator('#sg-nav a[href="#/theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', 'theme');
    if (browserName !== 'firefox') {
      // Chromium and WebKit load no ES module from file://: the page says so and offers the presets.
      await expect(page.locator('html')).toHaveAttribute('data-sg-generator', 'unavailable');
      await expect(page.locator('#sg-generator-status .ds-alert')).toContainText('needs http');
      await page.locator('#sg-generator-status [data-sg-preset="forest"]').click();
      await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'forest auto');
      // Its one console error is the blocked module.
      expect(errors.filter((text) => !/Failed to load resource|theme\.mjs|CORS|[Oo]rigin/.test(text)), browserName).toEqual([]);
      errors.length = 0;
    } else {
      await expect(page.locator('html')).toHaveAttribute('data-sg-generated', '#0b57d0 tonal standard');
      expect(errors, browserName).toEqual([]);
    }

    await page.goto(new URL('legacy.html', FILE).href);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-sg-ready'));
    await expect(page.locator('#charts')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});

test('the paths of this spec exist', () => {
  expect(fileURLToPath(FILE)).toMatch(/styleguide[\\/]index\.html$/);
});
