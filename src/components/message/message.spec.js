/**
 * The message (3.0): the roles' layout, the states DS.message writes
 * (data-state, aria-busy, the cursor, the notes), streaming text, the
 * footer actions (copy with its confirmation, retry, edit), the options and
 * forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=message');
  await ready(page);
}

/** A message of the role in #fx-component, with its controller. */
async function probe(page, html) {
  await page.evaluate((markup) => {
    const holder = document.createElement('div');
    holder.id = 'probe';
    holder.innerHTML = markup;
    document.querySelector('#fx-component').prepend(holder);
  }, html);
  return page.locator('#probe .ds-message').first();
}

const REPLY = '<article class="ds-message ds-message--assistant" data-ds-message="streaming" aria-labelledby="pa"><div class="ds-message__avatar" aria-hidden="true">A</div>' +
  '<div class="ds-message__main"><header class="ds-message__head"><span class="ds-message__author" id="pa">Assistant</span></header>' +
  '<div class="ds-message__content"><p>The battery</p></div>' +
  '<footer class="ds-message__footer" role="group" aria-label="Message actions">' +
  '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy" data-tip="Copy" data-ds-message-action="copy"><span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">c</span><span class="ds-icon-swap__b">k</span></span></button>' +
  '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Retry" data-ds-message-action="retry">r</button>' +
  '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Share" data-ds-message-action="share">s</button>' +
  '</footer></div></article>';

test('streaming: data-state and aria-busy from the attribute, the cursor after the text, the footer invisible but in place', async ({ page }) => {
  await open(page);
  const message = await probe(page, REPLY);
  await expect(message).toHaveAttribute('data-state', 'streaming');
  await expect(message).toHaveAttribute('aria-busy', 'true');
  const cursor = await message.locator('.ds-message__content p').evaluate((p) => {
    const style = getComputedStyle(p, '::after');
    return { content: style.content, width: parseFloat(style.width), display: style.display };
  });
  expect(cursor.content).toBe('""');
  expect(cursor.width).toBeGreaterThan(4);
  const footer = message.locator('.ds-message__footer');
  await expect(footer).toHaveCSS('visibility', 'hidden');
  const before = await footer.boundingBox();
  await message.evaluate((el) => {
    const controller = DS.message.create(el);
    controller.append(' report shows');
    controller.set('done');
  });
  await expect(message.locator('.ds-message__content p')).toHaveText('The battery report shows');
  await expect(message).not.toHaveAttribute('data-state');
  await expect(message).not.toHaveAttribute('aria-busy');
  await expect(footer).toHaveCSS('visibility', 'visible');
  expect(await footer.boundingBox()).toEqual(before);
  expect(await message.locator('.ds-message__content p').evaluate((p) => getComputedStyle(p, '::after').content)).toBe('none');
});

test('partial and error write a note with an icon and a word; a page note wins; ds:change tells each change', async ({ page }) => {
  await open(page);
  const message = await probe(page, REPLY);
  const changes = await message.evaluate((el) => {
    const seen = [];
    el.addEventListener('ds:change', (event) => seen.push(`${event.detail.previous}>${event.detail.state}`));
    const controller = DS.message.create(el);
    controller.set('partial');
    const partial = el.querySelector('.ds-message__note')?.textContent;
    controller.set({ state: 'error', error: 'The connection was lost.' });
    const error = el.querySelector('.ds-message__note')?.textContent;
    const icon = Boolean(el.querySelector('.ds-message__note svg'));
    controller.set({ state: 'error', error: null });
    const fallback = el.querySelector('.ds-message__note')?.textContent;
    controller.set('done');
    const gone = el.querySelectorAll('.ds-message__note').length;
    return { seen, partial, error, icon, fallback, gone };
  });
  expect(changes).toEqual({ seen: ['streaming>partial', 'partial>error', 'error>done'], partial: 'Stopped', error: 'The connection was lost.', icon: true, fallback: 'Not completed', gone: 0 });
  // A note of the page's own replaces the module's.
  await message.evaluate((el) => {
    const note = document.createElement('p');
    note.className = 'ds-message__note';
    note.textContent = 'Stopped by Ada Lovelace';
    el.querySelector('.ds-message__content').after(note);
    DS.message.create(el).set('partial');
  });
  await expect(message.locator('.ds-message__note')).toHaveText(['Stopped by Ada Lovelace']);
  // The attribute path: a change of data-ds-message is read again.
  await message.evaluate((el) => el.setAttribute('data-ds-message', 'error'));
  await expect(message).toHaveAttribute('data-state', 'error');
});

test('a thumb in the footer bubbles its own ds:change through the message: event.target tells them apart', async ({ page }) => {
  await open(page);
  const message = page.locator('.ds-message:has(.ds-feedback)').first();
  await message.evaluate((el) => {
    window.__seen = [];
    el.addEventListener('ds:change', (event) => window.__seen.push({ own: event.target === el, detail: JSON.parse(JSON.stringify(event.detail)) }));
    window.__own = [];
    DS.message.create(el).on('change', (detail) => window.__own.push(detail));
  });
  await message.getByRole('button', { name: 'Helpful', exact: true }).click();
  await expect(message.getByRole('button', { name: 'Helpful', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Only the feedback's: the message did not change, and its controller heard nothing.
  expect(await page.evaluate(() => window.__seen)).toEqual([{ own: false, detail: { value: 'up', previous: null } }]);
  expect(await page.evaluate(() => window.__own)).toEqual([]);
});

test('copy writes the text, confirms on the button for a moment and announces; retry, edit and others send events', async ({ page, browserName }) => {
  await open(page);
  const message = await probe(page, REPLY);
  await message.evaluate((el) => {
    window.__copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (text) => { window.__copied.push(text); return Promise.resolve(); } } });
    window.__events = [];
    for (const type of ['copy', 'retry', 'edit', 'action']) el.addEventListener(`ds:${type}`, (event) => window.__events.push([type, event.detail]));
    DS.message.create(el).set('done');
  });
  const copy = message.getByRole('button', { name: 'Copy' });
  await copy.click();
  const button = message.locator('[data-ds-message-action="copy"]');
  await expect(button).toHaveAttribute('aria-label', 'Copied');
  await expect(button).toHaveAttribute('data-tip', 'Copied');
  await expect(button.locator('.ds-icon-swap')).toHaveAttribute('data-swap', 'b');
  expect(await page.evaluate(() => window.__copied)).toEqual(['The battery']);
  await expect(page.locator('.ds-sr[aria-live="polite"]').filter({ hasText: 'Copied' })).toHaveCount(1);
  await expect(button).toHaveAttribute('aria-label', 'Copy', { timeout: 3000 });
  await expect(button.locator('.ds-icon-swap')).toHaveAttribute('data-swap', 'a');
  await message.getByRole('button', { name: 'Retry' }).click();
  await message.getByRole('button', { name: 'Share' }).click();
  expect(await page.evaluate(() => window.__events.map(([type, detail]) => [type, JSON.stringify(detail)]))).toEqual([
    ['copy', JSON.stringify({ text: 'The battery' })], ['retry', '{}'], ['action', JSON.stringify({ action: 'share' })],
  ]);
  expect(browserName).toBeTruthy();
});

test('the user is at the end side in a bubble; the system line is centred; the tool result framed', async ({ page }) => {
  await open(page);
  const user = page.locator('.ds-message--user').first();
  const bubble = await user.locator('.ds-message__content').boundingBox();
  const row = await user.boundingBox();
  expect(Math.abs(row.x + row.width - (bubble.x + bubble.width))).toBeLessThan(2);
  expect(bubble.width).toBeLessThanOrEqual(row.width * 0.8 + 1);
  expect(await user.locator('.ds-message__content').evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
  const system = page.locator('.ds-message--system .ds-message__content');
  const line = await system.boundingBox();
  const stage = await page.locator('.ds-message--system').boundingBox();
  expect(Math.abs((line.x + line.width / 2) - (stage.x + stage.width / 2))).toBeLessThan(2);
  await expect(page.locator('.ds-message--tool .ds-message__content')).toHaveCSS('border-top-style', 'solid');
});

test('options: the avatar steps with the size, the gaps with the density, the bubble radius with the shape', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(() => {
    const region = document.createElement('div');
    document.querySelector('#fx-component').append(region);
    const at = (classes) => {
      region.className = classes;
      region.innerHTML = '<div class="ds-message ds-message--user"><div class="ds-message__avatar">A</div><div class="ds-message__main"><div class="ds-message__content">Hi</div><div class="ds-message__footer">f</div></div></div>';
      const avatar = region.querySelector('.ds-message__avatar').getBoundingClientRect().height;
      const gap = parseFloat(getComputedStyle(region.querySelector('.ds-message__main')).rowGap);
      const radius = parseFloat(getComputedStyle(region.querySelector('.ds-message__content')).borderTopLeftRadius);
      return { avatar, gap, radius };
    };
    const out = { md: at(''), xl: at('ds-xl'), xs: at('ds-xs'), dense: at('ds-density-dense'), square: at('ds-shape-square') };
    region.remove();
    return out;
  });
  expect(measured.md.avatar).toBe(32);
  expect(measured.xl.avatar).toBe(48);
  expect(measured.xs.avatar).toBe(16);
  expect(measured.dense.gap).toBe(measured.md.gap - 4);
  expect(measured.md.radius).toBeGreaterThan(0);
  expect(measured.square.radius).toBe(0);
});

test('names: articles named by their author, footers named groups, every action a name', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('article', { name: 'Ada Lovelace' }).first()).toBeVisible();
  await expect(page.getByRole('article', { name: 'Assistant' }).first()).toBeVisible();
  await expect(page.getByRole('group', { name: 'Message actions' }).first()).toBeVisible();
  for (const name of ['Copy', 'Retry', 'Edit', 'Helpful', 'Not helpful']) await expect(page.getByRole('button', { name }).first()).toBeVisible();
});

test('forced colours: the bubble keeps its edge, the error note its word', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await page.locator('.ds-message--user .ds-message__content').first().evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(edge).not.toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.ds-message[data-state="error"] .ds-message__note')).toHaveText('Not completed');
});
