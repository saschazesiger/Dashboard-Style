/**
 * A partial bundle renders like the full ds.css and ds.js: the bundle tool
 * (scripts/tools/bundle.mjs) scans fixtures/bundle.html and writes a
 * minified classic bundle from this checkout's dist/ (its manifest.json)
 * into test-results/. The page then loads once with the bundle and once
 * with ds.min.css and ds.min.js: every computed property of the elements it
 * uses is the same, the ripple grows from a press, and the
 * dialog opens, takes focus and closes on Escape.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '../../scripts/tools/bundle.mjs';
import { ready, settle } from './helpers/motion.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PAGE = '/test/browser/fixtures/bundle.html';
let folder = '';
let sizes = null;

test.beforeAll(({}, testInfo) => {
  // One folder per project: the engines run in parallel workers.
  const name = `bundle-${testInfo.project.name}`;
  const out = join(ROOT, 'test-results', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const result = bundle({
    config: { content: ['test/browser/fixtures/bundle.html'], out: `test-results/${name}`, minify: true, js: 'classic' },
    cwd: ROOT,
    dist: join(ROOT, 'dist'),
  });
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  sizes = result.entries[0].report;
  folder = `/test-results/${name}`;
});

/** Every computed property of the probed elements (and the ::before of each button), as plain data. */
const styles = (page) => page.evaluate(() => {
  const out = {};
  const read = (style) => Object.fromEntries([...style].sort().map((property) => [property, style.getPropertyValue(property)]));
  for (const element of document.querySelectorAll('[data-probe]')) {
    const name = element.getAttribute('data-probe');
    out[name] = read(getComputedStyle(element));
    if (element.matches('.ds-btn')) out[`${name}::before`] = read(getComputedStyle(element, '::before'));
    [...element.children].forEach((child, index) => { out[`${name} > ${index}`] = read(getComputedStyle(child)); });
  }
  return out;
});

/** mode: 'bundle', 'full' (ds.css and ds.js) or 'min' (ds.min.css and ds.min.js). */
async function load(page, mode) {
  await page.goto(mode === 'bundle' ? `${PAGE}?bundle=${encodeURIComponent(folder)}` : mode === 'min' ? `${PAGE}?min` : PAGE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The names an `@property` file registers. */
const registered = (path) => new Set([...readFileSync(path, 'utf8').matchAll(/@property\s+(--[\w-]+)/g)].map((match) => match[1]));

/**
 * The properties that differ between the full page (a) and the bundle (b),
 * per element. Custom properties keep the text of their declaration, so
 * they compare without whitespace (the minified files drop it); one the
 * bundle lacks may only be a registration of a component it leaves out.
 */
function differences(a, b) {
  const found = [];
  const left = [...registered(join(ROOT, 'dist/css/properties.css'))].filter((name) => !registered(join(ROOT, folder.slice(1), 'properties.css')).has(name));
  const tight = (value) => value?.replace(/\s+/g, ' ').replace(/\s*([,()/])\s*/g, '$1').trim();
  for (const element of new Set([...Object.keys(a), ...Object.keys(b)])) {
    for (const property of new Set([...Object.keys(a[element] ?? {}), ...Object.keys(b[element] ?? {})])) {
      const [x, y] = [a[element]?.[property], b[element]?.[property]];
      if (property.startsWith('--') && (tight(x) === tight(y) || (y === undefined && left.includes(property)))) continue;
      if (x !== y) found.push(`${element} ${property}: ${x} | ${y}`);
    }
  }
  return found;
}

test('the bundle holds what the page uses, at a fraction of ds.css and ds.js', () => {
  // In cascade order (manifest.json "order").
  const order = JSON.parse(readFileSync(join(ROOT, 'dist/manifest.json'), 'utf8')).order;
  const expected = ['utilities', 'button', 'spinner', 'card', 'status', 'alert', 'chip', 'dialog', 'ripple'].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  expect(sizes.components.map((item) => item.name)).toEqual(expected);
  expect(sizes.modules.map((item) => item.name)).toEqual(['core', 'motion', 'dom', 'ripple', 'icons', 'position', 'overlay', 'dialog']);
  expect(sizes.icons.map((item) => item.name).sort()).toEqual(['alertCircle', 'check', 'wifiOff']);
  expect(sizes.files.css.gzip).toBeLessThan(40 * 1024);
});

test('a partial bundle computes the same styles as ds.css, at rest and with the dialog open', async ({ page }) => {
  // Against ds.min.css: the bundle is made of the .min.css files, whose custom properties keep lightningcss's
  // spelling of their text (.4s for 400ms); minified.spec.js shows that ds.min.css renders as ds.css does.
  await load(page, 'min');
  const full = await styles(page);
  await page.locator('#open').click();
  await settle(page);
  const fullOpen = await styles(page);

  await load(page, 'bundle');
  expect(await page.evaluate(() => [Object.keys(DS).sort(), document.styleSheets[1].href])).toEqual([
    ['config', 'core', 'define', 'dialog', 'dom', 'get', 'icons', 'init', 'motion', 'overlay', 'position', 'ripple', 'version'],
    expect.stringContaining('/ds.bundle.css'),
  ]);
  expect(differences(full, await styles(page))).toEqual([]);
  await page.locator('#open').click();
  await settle(page);
  expect(differences(fullOpen, await styles(page))).toEqual([]);
});

for (const mode of ['bundle', 'full']) {
  test(`the ripple and the dialog work (${mode})`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await load(page, mode);
    const button = page.locator('#open');
    const box = await button.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 10);
    await page.mouse.down();
    await expect(button.locator('.ds-press-ripple')).toHaveCount(1);
    expect(await button.locator('.ds-press-ripple').evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
    await page.mouse.up();
    await settle(page);

    const dialog = page.locator('#dialog');
    await expect(dialog).toHaveAttribute('data-state', 'open');
    await expect(page.locator('#cancel')).toBeFocused();
    await expect(dialog.locator('.ds-dialog__box')).toBeVisible();
    await settle(page);
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(dialog.locator('.ds-dialog__box')).toBeHidden();
    await expect(button).toBeFocused();
    await expect(page.locator('[data-probe="status"] svg')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

/*
 * Sublayers (3.0): every component's rules sit in ds.components.<name>, and
 * every single file of dist/css/ declares the sublayers in manifest order, so
 * the first stylesheet a page loads fixes the cascade. A page that links only
 * the files it uses, the components in reverse manifest order and the core
 * after them, computes the same styles as ds.css: the component fixtures of
 * the containers (whose rules meet other components'), and the reference app.
 */
test.describe('single files in reverse order cascade as ds.css', () => {
  // Every computed property of every element, twice: a long table takes a while.
  test.setTimeout(120_000);
  const manifest = JSON.parse(readFileSync(join(ROOT, 'dist/manifest.json'), 'utf8'));

  /**
   * Every element's computed style (and its ::before and ::after), with transitions and animations at their end or
   * start, keyed by its path (tag, id and classes per step, its place among such siblings) and the state its
   * scripts wrote (data-*): an indicator placed again without a glide, or a row whose live status changed while the
   * stylesheets load, is another state, not another cascade.
   */
  const everything = (page) => page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming().iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      } else animation.finish();
    }
    const out = [];
    // Values the layout resolves (sizes, grid tracks, origins, offsets) follow the moment of the reading as much as
    // the cascade: a stylesheet swap lays the page out again. Every declared value is compared.
    const resolved = /^(-webkit-)?((min-|max-)?(width|height|inline-size|block-size)|grid-template-(columns|rows)|(perspective|transform)-origin|top|right|bottom|left|inset(-.*)?)$/;
    const read = (style) => [...style].filter((property) => !property.startsWith('--') && !resolved.test(property)).map((property) => `${property}: ${style.getPropertyValue(property)}`).join('; ');
    const step = (node) => `${node.localName}${node.id ? `#${node.id}` : ''}.${[...node.classList].join('.')}`;
    const keys = new Map();
    const key = (node) => {
      if (!keys.has(node)) {
        let index = 1;
        for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) if (step(sibling) === step(node)) index += 1;
        keys.set(node, `${node.parentElement ? `${key(node.parentElement)} > ` : ''}${step(node)}:${index}`);
      }
      return keys.get(node);
    };
    for (const element of document.querySelectorAll('body, body *')) {
      if (element.closest('script, style, template')) continue;
      // The state a script wrote (classes, data-*) goes with the key: an element whose state changed is not compared.
      const state = [...element.attributes].filter(({ name }) => name === 'class' || name.startsWith('data-')).map(({ name, value }) => `${name}=${value}`).join(' ');
      out.push([`${key(element)} [${state}]`, read(getComputedStyle(element))]);
      for (const pseudo of ['::before', '::after']) {
        const style = getComputedStyle(element, pseudo);
        if (style.content !== 'none' && style.content !== 'normal') out.push([`${key(element)} [${state}]${pseudo}`, read(style)]);
      }
    }
    return out;
  });

  /** The components the page uses (a class or an attribute of theirs) and what they require, transitively, in reverse manifest order. */
  const used = (page) => page.evaluate((components) => {
    const found = new Set(Object.entries(components).filter(([, entry]) => entry.classes.some((name) => document.querySelector(`.${CSS.escape(name)}`))
      || entry.attributes.some((name) => document.querySelector(`[${name}]`))).map(([name]) => name));
    for (let size = 0; size !== found.size;) {
      size = found.size;
      for (const name of [...found]) for (const other of components[name].requires) found.add(other);
    }
    return Object.keys(components).filter((name) => found.has(name)).reverse();
  }, manifest.components);

  /** Swaps the page's ds.css for the single files: the components in reverse order, then the core files in reverse order. */
  async function relink(page, names) {
    // css/properties.css too: a component may read a property another one registers (the combobox list's fades use
    // the scroller's), and a single file holds only its own registrations.
    const files = [...names.map((name) => manifest.components[name].css), ...[...manifest.core.css].reverse(), manifest.core.properties].map((path) => `/dist/${path}`);
    await page.evaluate(async (hrefs) => {
      const full = document.querySelector('link[rel="stylesheet"][href$="dist/ds.css"]');
      const links = hrefs.map((href) => Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
      full.after(...links);
      await Promise.all(links.map((link) => new Promise((resolve, reject) => { link.onload = resolve; link.onerror = () => reject(new Error(link.href)); })));
      full.remove();
    }, files);
  }

  /** The properties that differ, per element both sides hold (a popup a script adds or drops on resize aside). */
  const differ = (a, b) => {
    const after = new Map(b);
    expect(a.filter(([name]) => after.has(name)).length).toBeGreaterThan(a.length * 0.98);
    return a.flatMap(([name, style]) => {
      if (!after.has(name) || after.get(name) === style) return [];
      const left = new Map(style.split('; ').map((pair) => pair.split(': ')));
      const right = new Map((after.get(name) ?? '').split('; ').map((pair) => pair.split(': ')));
      return [`${name}: ${[...left].filter(([property, value]) => right.get(property) !== value).map(([property, value]) => `${property} ${value} | ${right.get(property)}`).join(', ')}`];
    });
  };

  const PAGES = [
    ...['card', 'table', 'form', 'list', 'page', 'shell', 'dialog', 'sheet', 'tabs', 'badge', 'combobox', 'savebar', 'toast', 'utilities'].map((name) => `/test/browser/fixtures/component.html?c=${name}`),
    // The reference app's views (its overview's activity feed moves on by itself, so it is left out).
    '/example/index.html#/devices',
    '/example/index.html#/tickets',
    '/example/index.html#/settings',
  ];

  for (const path of PAGES) {
    test(path, async ({ page }) => {
      // A fixed clock: the reference app's live data must not change between the two readings.
      await page.clock.install({ time: new Date('2026-03-02T10:00:00Z') });
      await page.goto(path);
      await page.clock.runFor(3000);
      if (path.includes('component.html')) await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', /.*/);
      else await expect(page.locator('#page')).not.toBeEmpty();
      await page.mouse.move(1, 1);
      await page.clock.runFor(2000);
      const before = await everything(page);
      const names = await used(page);
      expect(names.length).toBeGreaterThan(1);
      // No time passes: the stylesheets load over the network, the page's timers stay where they were.
      await relink(page, names);
      expect(await page.evaluate(() => [...document.styleSheets].some((sheet) => sheet.href?.endsWith('/ds.css')))).toBe(false);
      expect(differ(before, await everything(page))).toEqual([]);
    });
  }
});
