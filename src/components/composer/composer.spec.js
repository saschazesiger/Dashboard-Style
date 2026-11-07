/**
 * The composer (3.0): the field row at every size x density and under
 * touch, Enter and Shift+Enter, send and stop, the command and mention
 * palettes (the APG combobox with a listbox popup), attachments as chips,
 * the remembered draft, names, and forced colours. Runs in the `fallback`
 * project too (field-sizing stripped: DS.dom.autosize() grows the field).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=composer');
  await ready(page);
  await page.evaluate(() => localStorage.clear());
}

const main = (page) => page.locator('[data-demo="main"]');
const field = (page) => main(page).locator('.ds-composer__input');

/** Types into the main field as a person does. */
async function type(page, text) {
  await field(page).click();
  await page.keyboard.type(text);
}

/** Collects the ds:<type> details of the main composer. */
async function listen(page, type) {
  await page.evaluate((name) => {
    window.__events = window.__events || {};
    window.__events[name] = [];
    document.querySelector('[data-demo="main"]').addEventListener(`ds:${name}`, (event) => {
      const { option, ...rest } = event.detail;
      window.__events[name].push(JSON.parse(JSON.stringify(rest, (key, value) => (value instanceof File ? value.name : value))));
    });
  }, type);
}
const events = (page, type) => page.evaluate((name) => window.__events[name], type);

test('the field row at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<form class="ds-composer"><textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Probe"></textarea></form>';
          document.querySelector('#fx-component').append(region);
          out.push({ touch, density, size, height: region.querySelector('textarea').getBoundingClientRect().height });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const box = Math.max(entry.touch ? 48 : 0, 40 + step * 8 + density * 4);
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeGreaterThanOrEqual(box - 0.5);
  }
});

test('Enter sends and clears, Shift+Enter breaks the line, an empty field sends nothing', async ({ page }) => {
  await open(page);
  await listen(page, 'send');
  const send = main(page).locator('button[type="submit"]');
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await field(page).click();
  await page.keyboard.press('Enter');
  expect(await events(page, 'send')).toEqual([]);
  await page.keyboard.type('First line');
  await expect(send).not.toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('second line');
  await expect(field(page)).toHaveValue('First line\nsecond line');
  await page.keyboard.press('Enter');
  const sent = await events(page, 'send');
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ text: 'First line\nsecond line', attachments: [], mentions: [], command: null });
  await expect(field(page)).toHaveValue('');
  await expect(field(page)).toBeFocused();
});

test('while busy the button is Stop: it says so, a press sends ds:stop and Enter keeps the text', async ({ page }) => {
  await open(page);
  const busy = page.locator('[data-demo="busy"]');
  const button = busy.locator('button[type="submit"]');
  await expect(busy).toHaveAttribute('data-state', 'busy');
  await expect(button).toHaveAttribute('aria-label', 'Stop');
  await expect(button.locator('.ds-icon-swap')).toHaveAttribute('data-swap', 'b');
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  const stopped = page.evaluate(() => new Promise((resolve) => document.querySelector('[data-demo="busy"]').addEventListener('ds:stop', () => resolve(true), { once: true })));
  await button.click();
  expect(await stopped).toBe(true);
  await busy.locator('textarea').fill('Still here');
  await busy.locator('textarea').press('Enter');
  await expect(busy.locator('textarea')).toHaveValue('Still here');
  // The page ends the reply: back to Send.
  await page.evaluate(() => DS.core.get(document.querySelector('[data-demo="busy"]'), 'composer').set({ busy: false }));
  await expect(button).toHaveAttribute('aria-label', 'Send');
  await expect(busy).not.toHaveAttribute('data-state', 'busy');
});

test('"/" opens the command palette at the caret: arrows move, Enter inserts, focus stays in the field', async ({ page }) => {
  await open(page);
  await listen(page, 'command');
  await listen(page, 'send');
  await type(page, '/');
  const palette = main(page).locator('.ds-composer__palette[data-ds-composer-trigger="/"]');
  await expect(palette).toHaveAttribute('data-state', 'open');
  await expect(palette).toBeVisible();
  await expect(field(page)).toHaveAttribute('aria-controls', await palette.getAttribute('id'));
  await expect(field(page)).toHaveAttribute('aria-autocomplete', 'list');
  const options = palette.locator('[role="option"]');
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  await expect(field(page)).toHaveAttribute('aria-activedescendant', await options.first().getAttribute('id'));
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(options.first()).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(options.last()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.type('as');
  await expect(options.filter({ visible: true })).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(field(page)).toHaveValue('/assign ');
  await expect(field(page)).toBeFocused();
  await expect(palette).not.toHaveAttribute('data-state', 'open');
  expect((await events(page, 'command'))[0]).toMatchObject({ value: '/assign', id: '/assign' });
  await page.keyboard.type('Ada');
  await page.keyboard.press('Enter');
  expect((await events(page, 'send'))[0]).toMatchObject({ text: '/assign Ada', command: '/assign' });
});

test('"@" filters people, Tab inserts the mention, Escape closes it for that word, no match says so', async ({ page }) => {
  await open(page);
  await listen(page, 'mention');
  await listen(page, 'send');
  await type(page, 'Ask @gr');
  const people = main(page).locator('.ds-composer__palette[data-ds-composer-trigger="@"]');
  await expect(people).toHaveAttribute('data-state', 'open');
  await expect(people.locator('[role="option"]').filter({ visible: true })).toHaveText([/Grace Hopper/]);
  await page.keyboard.press('Tab');
  await expect(field(page)).toHaveValue('Ask @Grace Hopper ');
  expect((await events(page, 'mention'))[0]).toMatchObject({ value: '@Grace Hopper', id: 'u-3' });
  await page.keyboard.type('and @zz');
  await expect(people).toHaveAttribute('data-state', 'open');
  await expect(people.locator('.ds-composer__empty')).toBeVisible();
  await expect(people.locator('.ds-composer__empty')).toHaveText('No results');
  await page.keyboard.press('Escape');
  await expect(people).not.toHaveAttribute('data-state', 'open');
  await expect(field(page)).not.toHaveAttribute('aria-activedescendant');
  await page.keyboard.type('z');
  await expect(people).not.toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Enter');
  expect((await events(page, 'send'))[0]).toMatchObject({ mentions: [{ value: '@Grace Hopper', id: 'u-3' }] });
});

test('a click on an option inserts it; a press outside closes the palette', async ({ page }) => {
  await open(page);
  await type(page, '/');
  const palette = main(page).locator('.ds-composer__palette[data-ds-composer-trigger="/"]');
  await palette.locator('[role="option"]', { hasText: '/label' }).click();
  await expect(field(page)).toHaveValue('/label ');
  await expect(field(page)).toBeFocused();
  await field(page).fill('');
  await type(page, '/');
  await expect(palette).toHaveAttribute('data-state', 'open');
  await page.mouse.click(5, 5);
  await expect(palette).not.toHaveAttribute('data-state', 'open');
});

test('files become chips with a size and a named remove button; removing hands the focus on', async ({ page }) => {
  await open(page);
  await listen(page, 'attach');
  await listen(page, 'send');
  await main(page).locator('.ds-composer__picker').setInputFiles([
    { name: 'battery-report.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(48200) },
    { name: 'screen.png', mimeType: 'image/png', buffer: Buffer.alloc(1200) },
  ]);
  const chips = main(page).locator('.ds-composer__attachment');
  await expect(chips).toHaveCount(2);
  await expect(chips.first().locator('.ds-composer__attachment-name')).toHaveText('battery-report.pdf');
  await expect(chips.first().locator('.ds-composer__attachment-size')).toHaveText('48.2 kB');
  await expect(main(page).locator('.ds-composer__attachments')).toHaveAttribute('aria-label', 'Attachments');
  expect((await events(page, 'attach'))[0].attachments.map((item) => item.name)).toEqual(['battery-report.pdf', 'screen.png']);
  // Files alone can be sent.
  await expect(main(page).locator('button[type="submit"]')).not.toHaveAttribute('aria-disabled', 'true');
  const remove = main(page).getByRole('button', { name: 'Remove battery-report.pdf' });
  await remove.focus();
  await page.keyboard.press('Enter');
  await expect(chips).toHaveCount(1);
  await expect(main(page).getByRole('button', { name: 'Remove screen.png' })).toBeFocused();
  await field(page).click();
  await page.keyboard.press('Enter');
  expect((await events(page, 'send'))[0].attachments.map((item) => item.name)).toEqual(['screen.png']);
  await expect(chips).toHaveCount(0);
});

test('the draft is remembered through DS.store and dropped on send', async ({ page }) => {
  await open(page);
  await type(page, 'A draft for later');
  expect(await page.evaluate(() => localStorage.getItem('ds:composer:styleguide-demo'))).toBe('"A draft for later"');
  await page.reload();
  await ready(page);
  await expect(field(page)).toHaveValue('A draft for later');
  await field(page).press('End');
  await field(page).press('Enter');
  expect(await page.evaluate(() => localStorage.getItem('ds:composer:styleguide-demo'))).toBeNull();
});

test('a new draft key keeps each conversation apart; a busy state set by script stays', async ({ page }) => {
  await open(page);
  await type(page, 'draft for A');
  await page.evaluate(() => DS.core.get(document.querySelector('[data-demo="main"]'), 'composer').set({ busy: true }));
  await main(page).evaluate((el) => el.setAttribute('data-ds-composer-draft', 'thread-B'));
  await expect(field(page)).toHaveValue('');
  await expect(main(page)).toHaveAttribute('data-state', 'busy');
  expect(await page.evaluate(() => localStorage.getItem('ds:composer:styleguide-demo'))).toBe('"draft for A"');
  await page.evaluate(() => DS.core.get(document.querySelector('[data-demo="main"]'), 'composer').set({ busy: false }));
  await type(page, '!');
  expect(await page.evaluate(() => localStorage.getItem('ds:composer:thread-B'))).toBe('"!"');
  expect(await page.evaluate(() => localStorage.getItem('ds:composer:styleguide-demo'))).toBe('"draft for A"');
  await main(page).evaluate((el) => el.setAttribute('data-ds-composer-draft', 'styleguide-demo'));
  await expect(field(page)).toHaveValue('draft for A');
  expect(await page.evaluate(() => localStorage.getItem('ds:composer:thread-B'))).toBe('"!"');
});

test('the palette stays against the caret as filtering shortens it and the page scrolls; the count is announced', async ({ page }) => {
  await open(page);
  // Low on a page taller than the window: the palette opens above the caret.
  await main(page).evaluate((el) => {
    el.style.marginBlock = `${window.innerHeight}px`;
    el.scrollIntoView({ block: 'end' });
    window.scrollBy(0, 160);
  });
  await type(page, '/');
  const palette = main(page).locator('.ds-composer__palette[data-ds-composer-trigger="/"]');
  await expect(palette).toHaveAttribute('data-state', 'open');
  await expect(palette).not.toHaveAttribute('data-placement', 'bottom');
  await expect(page.locator('.ds-sr[aria-live="polite"]')).toHaveText('Results: 4');
  const settled = () => palette.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
  // From the palette's bottom edge to the field's top edge.
  const gap = () => palette.evaluate((el) => {
    const field = el.closest('.ds-composer').querySelector('.ds-composer__input');
    return Math.round(field.getBoundingClientRect().top - el.getBoundingClientRect().bottom);
  });
  await settled();
  const start = await gap();
  await page.keyboard.type('su');
  await expect(palette.locator('[role="option"]').filter({ visible: true })).toHaveCount(1);
  await expect(page.locator('.ds-sr[aria-live="polite"]')).toHaveText('Results: 1');
  await settled();
  await expect.poll(gap).toBeGreaterThanOrEqual(start - 1);
  expect(await gap()).toBeLessThanOrEqual(start + 1);
  const fieldTop = await field(page).evaluate((el) => el.getBoundingClientRect().top);
  await page.evaluate(() => window.scrollBy(0, -120));
  await expect.poll(() => field(page).evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThan(fieldTop + 100);
  await expect(palette).toHaveAttribute('data-state', 'open');
  await expect.poll(gap).toBeGreaterThanOrEqual(start - 1);
  expect(await gap()).toBeLessThanOrEqual(start + 1);
});

test('destroy() lets go of the field: no autosize height, no palette listeners', async ({ page }) => {
  await open(page);
  await field(page).fill('one\ntwo\nthree\nfour');
  await main(page).evaluate((el) => DS.core.destroy(el));
  await expect(field(page)).not.toHaveAttribute('style', /height/);
  await field(page).fill('one\ntwo\nthree\nfour\nfive\nsix');
  await expect(field(page)).not.toHaveAttribute('style', /height/);
});

test('the field grows with its text up to its maximum, then scrolls', async ({ page }) => {
  await open(page);
  const start = (await field(page).boundingBox()).height;
  await field(page).fill('one\ntwo\nthree');
  await expect.poll(async () => (await field(page).boundingBox()).height).toBeGreaterThan(start + 20);
  await field(page).fill(Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n'));
  await expect.poll(async () => Math.round((await field(page).boundingBox()).height)).toBe(220);
});

test('names: every control of the composer has one, the disabled composer is blocked', async ({ page }) => {
  await open(page);
  await expect(main(page).getByRole('textbox', { name: 'Message' })).toBeVisible();
  await expect(main(page).getByRole('button', { name: 'Attach files' })).toBeVisible();
  await expect(main(page).getByRole('button', { name: 'Dictate' })).toHaveAttribute('aria-pressed', 'false');
  await expect(main(page).getByRole('button', { name: 'Send' })).toBeVisible();
  await expect(page.locator('[data-demo="disabled"] textarea')).toBeDisabled();
});

test('forced colours: the focused shell shows a Highlight outline, the active option SelectedItem', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await type(page, '/');
  const shell = await main(page).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(shell).toBe('solid');
  const option = main(page).locator('[role="option"][aria-selected="true"]');
  const colours = await option.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'SelectedItem';
    document.body.append(probe);
    const selected = getComputedStyle(probe).color;
    probe.remove();
    return { background: getComputedStyle(el).backgroundColor, selected };
  });
  expect(colours.background).toBe(colours.selected);
});
