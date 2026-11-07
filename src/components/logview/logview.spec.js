/**
 * The log viewer: what it renders from the text (bar, chips with counts,
 * lines with their time, level and number), windowing at 100,000 lines, the
 * level filter, the search, selection and copy by pointer and keyboard,
 * following the end with the Latest pill, the view toggles, the options,
 * the contrast of the ANSI colours and the tints, and forced colours. Runs
 * in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const ESC = '\u001b';
const TEXT = [
  '2026-11-04T09:00:01.120Z INFO  Device 42 started',
  '2026-11-04T09:00:02.348Z WARN  Battery at 15%',
  '2026-11-04T09:00:03.500Z DEBUG Next sync in 600 s',
  '2026-11-04T09:00:05.902Z ERROR Sync failed: timeout after 8000 ms',
  '    at sync (src/devices/sync.js:31)',
  '    at run (src/devices/queue.js:88)',
  '2026-11-04T09:00:07.000Z INFO  Retrying the sync',
  `2026-11-04T09:00:08.000Z INFO  ${ESC}[31mred${ESC}[0m ${ESC}[32mgreen${ESC}[0m ${ESC}[33myellow${ESC}[0m ${ESC}[34mblue${ESC}[0m ${ESC}[35mmagenta${ESC}[0m ${ESC}[36mcyan${ESC}[0m ${ESC}[30mblack${ESC}[0m ${ESC}[1mbold${ESC}[0m`,
  '2026-11-04T09:00:09.000Z FATAL Storage full',
  '2026-11-04T09:00:10.000Z INFO  Synced 12 settings',
].join('\n');

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=logview');
  await ready(page);
  // The clipboard of a test run: what a copy wrote, without the permissions of each engine.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (text) => { window.copied = text; return Promise.resolve(); } } });
  });
}

/** A fresh view of `text` in the fixture, by the attribute path or by create(options). */
async function mount(page, text = TEXT, { attributes = {}, options = null, cls = '' } = {}) {
  await page.evaluate(({ text, attributes, options, cls }) => {
    document.querySelector('#probe')?.remove();
    const host = document.createElement('div');
    host.id = 'probe';
    host.className = `ds-logview ${cls}`;
    host.setAttribute('aria-label', 'Probe log');
    for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value);
    document.querySelector('#fx-component').prepend(host);
    if (options) window.probeLog = DS.logview.create(host, { lines: text, ...options });
    else {
      window.probeLog = null;
      const source = document.createElement('pre');
      source.className = 'ds-logview__source';
      source.textContent = text;
      host.append(source);
      host.setAttribute('data-ds-logview', '');
    }
  }, { text, attributes, options, cls });
  const view = page.locator('#probe');
  await expect(view.locator(text ? '.ds-logview__line' : '.ds-logview__empty').first()).toBeVisible();
  await page.evaluate(() => { window.probeLog = window.probeLog || DS.core.get(document.querySelector('#probe'), 'logview'); });
  return view;
}


/** The page in the light scheme, or with the shipped dark theme (the default palette is light only; dark.css is its dark). */
async function useScheme(page, name) {
  await page.evaluate(async (name) => {
    let link = document.querySelector('#probe-dark');
    if (name === 'light') return link?.remove();
    if (link) return;
    link = document.createElement('link');
    link.id = 'probe-dark';
    link.rel = 'stylesheet';
    link.href = '/dist/themes/dark.css';
    const loaded = new Promise((resolve) => { link.onload = resolve; });
    document.head.append(link);
    await loaded;
  }, name);
}

test('renders the bar, the chips with counts and the lines with time, level and number; the source hides', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  await expect(view.locator('.ds-logview__source')).toBeHidden();
  await expect(view.locator('.ds-logview__lines')).toHaveAttribute('role', 'listbox');
  await expect(view.locator('.ds-logview__lines')).toHaveAttribute('aria-label', 'Probe log');
  await expect(view.locator('.ds-logview__lines')).toHaveAttribute('aria-multiselectable', 'true');
  await expect(view.locator('.ds-logview__chip')).toHaveText([/Fatal\s*1/, /Error\s*3/, /Warning\s*1/, /Info\s*4/, /Debug\s*1/]);
  await expect(view.locator('.ds-logview__count')).toHaveText('10 lines');
  const error = view.locator('.ds-logview__line').nth(3);
  await expect(error).toHaveAttribute('role', 'option');
  await expect(error).toHaveAttribute('data-level', 'error');
  await expect(error).toHaveAttribute('aria-posinset', '4');
  await expect(error).toHaveAttribute('aria-setsize', '10');
  await expect(error.locator('.ds-logview__time')).toHaveText('09:00:05.902');
  await expect(error.locator('.ds-logview__word')).toHaveText('Error');
  await expect(error.locator('.ds-logview__level svg')).toHaveCount(1);
  await expect(error.locator('.ds-logview__text')).toHaveText('Sync failed: timeout after 8000 ms');
  expect(await error.locator('.ds-logview__num').evaluate((el) => getComputedStyle(el, '::before').content)).toBe('"4"');
  // A stack trace continues its line: the tint and the filter, no icon of its own.
  const trace = view.locator('.ds-logview__line').nth(4);
  await expect(trace).toHaveAttribute('data-level', 'error');
  await expect(trace.locator('.ds-logview__level svg')).toHaveCount(0);
  // The accessible name of a line: its time, its level word, its text; not its number.
  await expect(error).toHaveAccessibleName('09:00:05.902 Error Sync failed: timeout after 8000 ms');
});

test('windows 100,000 lines: few in the page, the keyboard reaches the last, and their place is told', async ({ page }) => {
  await open(page);
  const view = await mount(page, '', { options: { follow: false } });
  const started = await page.evaluate(() => {
    const lines = [];
    for (let i = 0; i < 100000; i += 1) lines.push(`09:00:${String(i % 60).padStart(2, '0')} ${i % 9 === 4 ? 'WARN' : 'INFO'} Device ${i % 50} synced`);
    const at = performance.now();
    window.probeLog.set({ text: lines });
    return performance.now() - at;
  });
  expect(started).toBeLessThan(5000);
  await expect(view.locator('.ds-logview__count')).toHaveText('100,000 lines');
  expect(await view.locator('.ds-logview__line').count()).toBeLessThan(80);
  await view.locator('.ds-logview__line').first().focus();
  await page.keyboard.press('End');
  const last = view.locator('.ds-logview__line[aria-posinset="100000"]');
  await expect(last).toBeFocused();
  await expect(last).toHaveAttribute('aria-setsize', '100000');
  await expect(last.locator('.ds-logview__num')).toHaveAttribute('data-line', '100000');
  await page.keyboard.press('Home');
  await expect(view.locator('.ds-logview__line[aria-posinset="1"]')).toBeFocused();
});

test('the level chips filter the lines, a stack trace goes with its line, and the count says so', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  await view.locator('.ds-logview__chip', { hasText: 'Error' }).click();
  await expect(view.locator('.ds-logview__chip', { hasText: 'Error' }).locator('input')).not.toBeChecked();
  await expect(view.locator('.ds-logview__line[data-level="error"]')).toHaveCount(0);
  await expect(view.locator('.ds-logview__line')).toHaveCount(7);
  await expect(view.locator('.ds-logview__count')).toHaveText('7 of 10 lines');
  await expect(page.locator('.ds-sr[aria-live="polite"]', { hasText: '7 of 10 lines' })).toHaveCount(1);
  const state = await page.evaluate(() => window.probeLog.get());
  expect(state.levels).toEqual(['fatal', 'warn', 'info', 'debug', 'trace']);
  await page.evaluate(() => window.probeLog.set({ levels: ['fatal', 'error'] }));
  await expect(view.locator('.ds-logview__line')).toHaveCount(4);
  await expect(view.locator('.ds-logview__chip', { hasText: 'Info' }).locator('input')).not.toBeChecked();
});

test('search: the count, Enter and Shift+Enter through the matches, only matching lines, Escape clears', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  const field = view.getByRole('searchbox', { name: 'Search the log' });
  await field.fill('sync');
  await expect(view.locator('.ds-logview__found')).toHaveText('6 matches');
  await expect(field).toHaveAttribute('aria-describedby', await view.locator('.ds-logview__found').getAttribute('id'));
  await expect(view.locator('mark.ds-logview__match')).toHaveCount(6);
  await field.press('Enter');
  await expect(view.locator('.ds-logview__found')).toHaveText('1 of 6');
  await expect(view.locator('.ds-logview__match--current')).toHaveCount(1);
  await expect(view.locator('.ds-logview__line', { has: page.locator('.ds-logview__match--current') })).toContainText('Next sync in 600 s');
  await field.press('Shift+Enter');
  await expect(view.locator('.ds-logview__found')).toHaveText('6 of 6');
  await expect(view.locator('.ds-logview__match--current')).toHaveText('Sync');
  await expect(view.locator('.ds-logview__line', { has: page.locator('.ds-logview__match--current') })).toContainText('Synced 12 settings');
  await view.getByRole('button', { name: 'Next match' }).click();
  await expect(view.locator('.ds-logview__found')).toHaveText('1 of 6');
  await view.getByRole('button', { name: 'Only matching lines' }).click();
  await expect(view.getByRole('button', { name: 'Only matching lines' })).toHaveAttribute('aria-pressed', 'true');
  await expect(view.locator('.ds-logview__line')).toHaveCount(5);
  await field.focus();
  await field.press('Escape');
  await expect(field).toHaveValue('');
  await expect(view.locator('.ds-logview__line')).toHaveCount(10);
  await field.fill('nothing like it');
  await expect(view.locator('.ds-logview__found')).toHaveText('No results');
  await expect(view.getByRole('button', { name: 'Next match' })).toBeDisabled();
});

test('selection and copy: click, Shift+click, Space, Shift+arrows, Ctrl+A, Escape; Ctrl+C copies plain text', async ({ page }) => {
  await open(page);
  const view = await mount(page, TEXT, { options: { follow: false } });
  const line = (n) => view.locator('.ds-logview__line').nth(n);
  await line(1).click();
  await expect(line(1)).toHaveAttribute('aria-selected', 'true');
  await line(3).click({ modifiers: ['Shift'] });
  await expect(view.locator('.ds-logview__line[aria-selected="true"]')).toHaveCount(3);
  await expect(view.getByRole('button', { name: 'Copy 3 lines' })).toBeVisible();
  await view.getByRole('button', { name: 'Copy 3 lines' }).click();
  await expect.poll(() => page.evaluate(() => window.copied)).toBe([
    '2026-11-04T09:00:02.348Z WARN  Battery at 15%',
    '2026-11-04T09:00:03.500Z DEBUG Next sync in 600 s',
    '2026-11-04T09:00:05.902Z ERROR Sync failed: timeout after 8000 ms',
  ].join('\n'));
  await expect(page.locator('.ds-sr[aria-live="polite"]', { hasText: 'Copied 3 lines' })).toHaveCount(1);

  // The keyboard: Escape clears, Space toggles, Shift+ArrowDown extends, Ctrl+A takes all.
  await line(3).focus();
  await page.keyboard.press('Escape');
  await expect(view.locator('.ds-logview__line[aria-selected="true"]')).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(line(3)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(line(5)).toBeFocused();
  await expect(view.locator('.ds-logview__line[aria-selected="true"]')).toHaveCount(3);
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => window.copied.split('\n').length)).toBe(3);
  await page.keyboard.press('ControlOrMeta+a');
  await expect(view.locator('.ds-logview__line[aria-selected="true"]')).toHaveCount(10);
  // The ANSI codes stay out of a copy.
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => window.copied)).toContain('INFO  red green yellow blue magenta cyan black bold');
  await page.keyboard.press('ControlOrMeta+f');
  await expect(view.getByRole('searchbox')).toBeFocused();
});

test('follows the end while lines arrive; scrolling up shows Latest, which goes back', async ({ page }) => {
  await open(page);
  const view = await mount(page, Array.from({ length: 60 }, (_, i) => `09:00:${String(i % 60).padStart(2, '0')} INFO line ${i + 1}`).join('\n'));
  const scroller = view.locator('.ds-logview__scroller');
  const gap = () => scroller.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);
  await expect.poll(gap).toBeLessThan(2);
  await page.evaluate(() => window.probeLog.append(['09:01:00 INFO more 1', '09:01:01 WARN more 2']));
  await expect(view.locator('.ds-logview__line', { hasText: 'more 2' })).toBeVisible();
  await expect.poll(gap).toBeLessThan(2);
  const latest = view.locator('.ds-logview__latest');
  await expect(latest).toBeHidden();
  await scroller.evaluate((el) => { el.scrollTop = 0; });
  await expect(latest).toBeVisible();
  await page.evaluate(() => window.probeLog.append('09:01:02 INFO more 3'));
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(0);
  await latest.getByRole('button', { name: 'Latest' }).click();
  await expect.poll(gap).toBeLessThan(2);
  await expect(latest).toBeHidden();
  // From the keyboard: the pill hides, so the focus goes to the last line.
  await scroller.evaluate((el) => { el.scrollTop = 0; });
  await expect(latest).toBeVisible();
  await latest.getByRole('button', { name: 'Latest' }).focus();
  await page.keyboard.press('Enter');
  await expect(view.locator('.ds-logview__line', { hasText: 'more 3' })).toBeFocused();
  await expect.poll(gap).toBeLessThan(2);
  await expect(latest).toBeHidden();
});

test('wrap and timestamps: toggles with aria-pressed, remembered in a store', async ({ page }) => {
  await open(page);
  await page.evaluate(() => localStorage.removeItem('ds:probe-log:wrap'));
  const view = await mount(page, TEXT, { attributes: { 'data-ds-logview-store': 'probe-log' } });
  const text = view.locator('.ds-logview__text').first();
  expect(await text.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre');
  await view.getByRole('button', { name: 'Wrap lines' }).click();
  await expect(view.getByRole('button', { name: 'Wrap lines' })).toHaveAttribute('aria-pressed', 'true');
  await expect(view).toHaveAttribute('data-wrap', '');
  expect(await text.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
  await view.getByRole('button', { name: 'Timestamps' }).click();
  await expect(view).toHaveAttribute('data-time', 'off');
  await expect(view.locator('.ds-logview__time').first()).toBeHidden();
  // A new view in the same store starts as the reader left it.
  const again = await mount(page, TEXT, { attributes: { 'data-ds-logview-store': 'probe-log' } });
  await expect(again).toHaveAttribute('data-wrap', '');
  await expect(again).toHaveAttribute('data-time', 'off');
  await page.evaluate(() => window.probeLog.set({ time: 'full', wrap: false }));
  await expect(again.locator('.ds-logview__time').first()).toHaveText('2026-11-04T09:00:01.120Z');
  await page.evaluate(() => { localStorage.removeItem('ds:probe-log:wrap'); localStorage.removeItem('ds:probe-log:time'); });
});

test('a page that re-renders the source with more lines appends them; destroy() gives the source back', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  await page.evaluate(() => { document.querySelector('#probe .ds-logview__source').textContent += '\n2026-11-04T09:00:11.000Z ERROR One more'; });
  await expect(view.locator('.ds-logview__count')).toHaveText('11 lines');
  await page.evaluate(() => DS.core.destroy(document.querySelector('#probe')));
  await expect(view.locator('.ds-logview__bar')).toHaveCount(0);
  await expect(view.locator('.ds-logview__source')).toBeVisible();
});

test('a re-render of the page with DS.dom.morphHtml keeps the view, appends the new lines and keeps the reader\'s choices', async ({ page }) => {
  await open(page);
  const view = await mount(page, `${TEXT}\n`);
  await view.getByRole('button', { name: 'Wrap lines' }).click();
  await view.locator('.ds-logview__line').first().click();
  expect(await page.evaluate(() => window.probeLog.get().selected)).toEqual([1]);
  const same = await page.evaluate((text) => {
    const host = document.querySelector('#probe');
    const wrap = document.createElement('div');
    wrap.id = 'probe-wrap';
    host.before(wrap);
    wrap.append(host);
    const esc = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<div id="probe" class="ds-logview" aria-label="Probe log" data-ds-logview><pre class="ds-logview__source">${esc(`${text}\n2026-11-04T09:00:11.000Z ERROR One more\n2026-11-04T09:00:12.000Z INFO  And another\n`)}</pre></div>`;
    DS.dom.morphHtml(wrap, html);
    return wrap.firstElementChild === host;
  }, TEXT);
  expect(same).toBe(true);
  await expect(view.locator('.ds-logview__count')).toHaveText('12 lines');
  await expect(view.locator('.ds-logview__bar')).toBeVisible();
  await expect(view.locator('.ds-logview__line', { hasText: 'And another' })).toHaveCount(1);
  await expect(view.locator('.ds-logview__source')).toBeHidden();
  await expect(view).toHaveAttribute('data-wrap', '');
  await expect(view).toHaveAttribute('data-time', 'time');
  // Appended, not started again: the selection stays.
  expect(await page.evaluate(() => window.probeLog.get().selected)).toEqual([1]);
});

test('an attribute change applies its option alone: the reader\'s wrap stays, follow and tools apply', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  await view.getByRole('button', { name: 'Wrap lines' }).click();
  await expect(view).toHaveAttribute('data-wrap', '');
  await page.evaluate(() => document.querySelector('#probe').setAttribute('aria-label', 'Renamed log'));
  await expect(view.getByRole('listbox', { name: 'Renamed log' })).toHaveCount(1);
  await expect(view).toHaveAttribute('data-wrap', '');
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-logview-follow', 'off'));
  await expect(view.locator('.ds-logview__scroller > .ds-jump')).toBeHidden();
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-logview-tools', 'off'));
  await expect(view.locator('.ds-logview__bar')).toBeHidden();
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-logview-tools', 'on'));
  await expect(view.locator('.ds-logview__bar')).toBeVisible();
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-logview-wrap', 'off'));
  await expect(view).not.toHaveAttribute('data-wrap', '');
  await expect(view).toHaveAttribute('data-time', 'time');
});

test('options: density and size step the lines, shape the corners; narrow hides the level word', async ({ page }) => {
  await open(page);
  await mount(page);
  const height = (cls) => page.evaluate((cls) => {
    const probe = document.querySelector('#probe');
    probe.className = `ds-logview ${cls}`;
    return probe.querySelector('.ds-logview__line').getBoundingClientRect().height;
  }, cls);
  expect(await height('')).toBe(24);
  expect(await height('ds-density-compact')).toBe(22);
  expect(await height('ds-density-dense')).toBe(20);
  expect(await height('ds-lg')).toBe(26);
  const radius = (cls) => page.evaluate((cls) => {
    const probe = document.querySelector('#probe');
    probe.className = `ds-logview ${cls}`;
    return parseFloat(getComputedStyle(probe).borderTopLeftRadius);
  }, cls);
  const base = await radius('');
  expect(base).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-soft')).toBeCloseTo(base / 2, 1);
  // Touch: the bar's buttons reach the target; the lines stay compact.
  await page.evaluate(() => { document.querySelector('#probe').className = 'ds-logview ds-touch'; });
  expect(await page.locator('#probe .ds-logview__tools .ds-btn').first().evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
  await page.evaluate(() => { const probe = document.querySelector('#probe'); probe.className = 'ds-logview'; probe.style.inlineSize = '340px'; });
  const word = page.locator('#probe .ds-logview__word').first();
  expect(await word.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
  expect(await page.locator('#probe .ds-logview__line').first().evaluate((el) => el.getBoundingClientRect().height)).toBe(24);
});

/** WCAG contrast of an element's text on the colours behind it (the line's tint over the ground). */
const contrastOf = (page, selector) => page.evaluate((selector) => {
  const el = document.querySelector(selector);
  const rgba = (value) => {
    const probe = document.createElement('canvas').getContext('2d');
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    return [...probe.getImageData(0, 0, 1, 1).data];
  };
  // The fill behind: every background from the element up to the view, laid over each other.
  const layers = [];
  for (let at = el; at; at = at.parentElement) {
    layers.unshift(getComputedStyle(at).backgroundColor);
    if (at.classList.contains('ds-logview__scroller')) break;
  }
  let ground = rgba(getComputedStyle(el.closest('.ds-logview')).backgroundColor).slice(0, 3);
  for (const layer of layers) {
    const [r, g, b, a] = rgba(layer);
    ground = [r, g, b].map((v, i) => v * (a / 255) + ground[i] * (1 - a / 255));
  }
  const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [a, b] = [lum(rgba(getComputedStyle(el).color)), lum(ground)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}, selector);

test('the ANSI colours, the level words and the matches read at 4.5:1, light and dark', async ({ page }) => {
  await open(page);
  await mount(page, TEXT, { options: { follow: false } });
  await page.evaluate(() => window.probeLog.set({ query: 'sync' }));
  await page.locator('#probe').getByRole('searchbox').press('Enter');
  for (const scheme of ['light', 'dark']) {
    await useScheme(page, scheme);
    const selectors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'black'].map((colour) => `#probe .ds-logview__ansi[data-fg="${colour}"]`)
      .concat(['fatal', 'error', 'warn', 'info', 'debug'].map((level) => `#probe .ds-logview__line[data-level="${level}"] .ds-logview__word`))
      .concat(['#probe .ds-logview__line[data-level="error"] .ds-logview__text', '#probe .ds-logview__match', '#probe .ds-logview__match--current', '#probe .ds-logview__num']);
    for (const selector of selectors) expect(await contrastOf(page, selector), `${scheme} ${selector}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('forced colours: a selected line is SelectedItem, a match Mark; the level keeps its icon and word', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const view = await mount(page, TEXT, { options: { follow: false } });
  await view.locator('.ds-logview__line').nth(3).click();
  await page.evaluate(() => window.probeLog.set({ query: 'sync' }));
  const system = (value) => page.evaluate((value) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = value;
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, value);
  const selected = view.locator('.ds-logview__line[aria-selected="true"]');
  const selectedItem = await system('SelectedItem');
  await expect.poll(() => selected.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(selectedItem);
  expect(await view.locator('.ds-logview__match').first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await system('Mark'));
  await expect(selected.locator('.ds-logview__word')).toHaveText('Error');
  await expect(selected.locator('.ds-logview__level svg')).toHaveCount(1);
});

test('the demo renders without errors; the stream and 100,000 lines work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const live = page.locator('[data-demo="live"]');
  await expect(live.locator('.ds-logview__count')).toHaveText('45 lines');
  await page.locator('[data-demo="many"]').click();
  await expect(live.locator('.ds-logview__count')).toHaveText('100,045 lines');
  await page.locator('[data-demo="stream"]').click();
  await expect(page.locator('[data-demo="stream"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(live.locator('.ds-logview__count')).not.toHaveText('100,045 lines');
  await page.locator('[data-demo="stream"]').click();
  await expect(page.locator('[data-demo="build"] .ds-logview__ansi[data-fg="green"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});
