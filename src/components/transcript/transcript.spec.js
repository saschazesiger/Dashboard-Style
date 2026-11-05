/**
 * The transcript (3.0): it opens at the end and sticks there, the "Latest"
 * pill with its count while scrolled up (never for the user's own
 * messages), earlier messages loading in place (the message on screen does
 * not move, in every engine), the announcements (a complete reply once,
 * the log itself silent), the keyboard and forced colours. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=transcript');
  await ready(page);
}

const log = (page) => page.locator('[data-demo="log"]');
const pill = (page) => log(page).locator('.ds-jump .ds-presence');
const gap = (page) => log(page).evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);

/** Appends a complete message of `role` at the end of the list. */
function append(page, role, text) {
  return log(page).evaluate((el, [kind, words]) => {
    const article = document.createElement('article');
    article.className = `ds-message ds-message--${kind}`;
    article.innerHTML = `<div class="ds-message__main"><header class="ds-message__head"><span class="ds-message__author">${kind === 'user' ? 'Ada Lovelace' : 'Assistant'}</span></header><div class="ds-message__content"><p></p></div></div>`;
    article.querySelector('p').textContent = words;
    el.querySelector('.ds-transcript__list').append(article);
  }, [role, text]);
}

const spoken = (page) => page.locator('.ds-sr[aria-live="polite"]');

test('opens at the end and stays there while messages arrive; the log is silent, the transcript speaks', async ({ page }) => {
  await open(page);
  expect(await gap(page)).toBeLessThanOrEqual(1);
  await expect(pill(page)).toBeHidden();
  await expect(log(page).locator('.ds-transcript__list')).toHaveAttribute('aria-live', 'off');
  await append(page, 'assistant', 'The router restarted at 03:12.');
  await expect.poll(() => gap(page)).toBeLessThanOrEqual(1);
  await expect(spoken(page)).toHaveText('Assistant: The router restarted at 03:12.');
  await expect(pill(page)).toBeHidden();
});

test('scrolled up: new replies bring the pill with their count, the user\'s own do not count; Latest goes back', async ({ page }) => {
  await open(page);
  await log(page).evaluate((el) => { el.scrollTop = 0; });
  await expect(pill(page)).toBeVisible();
  const counter = pill(page).locator('.ds-transcript__unread');
  await expect(counter).toBeHidden();
  await append(page, 'assistant', 'One.');
  await append(page, 'user', 'Mine.');
  await append(page, 'assistant', 'Two.');
  await expect(counter).toHaveText('2 new');
  expect(await log(page).evaluate((el) => el.scrollTop)).toBe(0);
  expect(await log(page).evaluate((el) => DS.core.get(el, 'transcript').get())).toEqual({ atEnd: false, unread: 2 });
  const latest = pill(page).getByRole('button', { name: /Latest/ });
  await expect(latest).toHaveAccessibleName('Latest 2 new');
  await latest.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => gap(page), { timeout: 3000 }).toBeLessThanOrEqual(1);
  await expect(pill(page)).toBeHidden();
  await expect(log(page)).toBeFocused();
  expect(await log(page).evaluate((el) => DS.core.get(el, 'transcript').get().unread)).toBe(0);
});

test('a streaming reply is announced once, when it is complete, never word by word', async ({ page }) => {
  await open(page);
  await log(page).evaluate((el) => {
    const article = document.createElement('article');
    article.className = 'ds-message ds-message--assistant';
    article.id = 'probe';
    article.setAttribute('data-ds-message', 'streaming');
    article.innerHTML = '<div class="ds-message__main"><header class="ds-message__head"><span class="ds-message__author">Assistant</span></header><div class="ds-message__content"><p>The fan</p></div></div>';
    el.querySelector('.ds-transcript__list').append(article);
  });
  const probe = page.locator('#probe');
  await expect(probe).toHaveAttribute('aria-busy', 'true');
  await probe.evaluate((el) => DS.message.create(el).append(' is replaced'));
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => document.querySelector('.ds-sr[aria-live="polite"]')?.textContent ?? '')).not.toContain('The fan');
  await probe.evaluate((el) => DS.message.create(el).set('done'));
  await expect(spoken(page)).toHaveText('Assistant: The fan is replaced');
  expect(await gap(page)).toBeLessThanOrEqual(1);
});

test('a send from the composer sticks to the end, and the reply that follows streams in there', async ({ page }) => {
  await open(page);
  await log(page).evaluate((el) => { el.scrollTop = 0; });
  await page.locator('[data-demo="composer"] textarea').fill('Is the printer fixed?');
  await page.locator('[data-demo="composer"] textarea').press('Enter');
  await expect(log(page).locator('.ds-message--user').last()).toContainText('Is the printer fixed?');
  await expect.poll(() => gap(page), { timeout: 3000 }).toBeLessThanOrEqual(1);
  await expect(log(page).locator('.ds-message').last()).toContainText('Ticket 1042', { timeout: 10000 });
  await expect.poll(() => gap(page)).toBeLessThanOrEqual(1);
});

test('loading earlier messages keeps the message on screen in place, announces it, and hides the button at the end', async ({ page }) => {
  await open(page);
  await log(page).evaluate((el) => { el.scrollTop = 0; });
  await log(page).locator('.ds-message').first().evaluate((el) => { el.id = 'anchor'; });
  const first = page.locator('#anchor');
  const before = (await first.boundingBox()).y;
  const button = log(page).getByRole('button', { name: 'Load earlier messages' });
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(log(page).locator('.ds-message')).toHaveCount(8, { timeout: 5000 });
  await expect(spoken(page)).toHaveText('Earlier messages loaded');
  expect(Math.abs((await first.boundingBox()).y - before)).toBeLessThanOrEqual(1);
  await expect(button).not.toHaveAttribute('aria-busy', 'true');
  // Nothing loaded above is counted or spoken.
  expect(await log(page).evaluate((el) => DS.core.get(el, 'transcript').get().unread)).toBe(0);
  await log(page).evaluate((el) => { el.scrollTop = 0; });
  await button.click();
  await expect(log(page).locator('.ds-message')).toHaveCount(12, { timeout: 5000 });
  await expect(log(page).locator('.ds-transcript__earlier')).toBeHidden();
});

test('day separators read today and yesterday in the locale', async ({ page }) => {
  await open(page);
  await expect(log(page).locator('.ds-transcript__day')).toHaveText(['Yesterday', 'Today']);
  const german = await page.evaluate(() => DS.transcript.day(Date.now() - 864e5, { locale: 'de' }));
  expect(german).toBe('Gestern');
});

test('keyboard: the transcript is a named tab stop with an inset ring; the log is named', async ({ page }) => {
  await open(page);
  await expect(log(page)).toHaveAttribute('role', 'region');
  await expect(log(page)).toHaveAccessibleName('Conversation');
  await expect(log(page)).toHaveAttribute('tabindex', '0');
  await expect(page.getByRole('log', { name: 'Messages' })).toBeVisible();
  await log(page).focus();
  await page.keyboard.press('Home');
  await expect.poll(() => log(page).evaluate((el) => el.scrollTop)).toBe(0);
  await page.keyboard.press('End');
  await expect.poll(() => gap(page)).toBeLessThanOrEqual(1);
});

test('density steps the gap between messages', async ({ page }) => {
  await open(page);
  const gaps = await log(page).evaluate((el) => {
    const list = el.querySelector('.ds-transcript__list');
    const read = () => parseFloat(getComputedStyle(list).rowGap);
    const base = read();
    el.classList.add('ds-density-dense');
    const dense = read();
    el.classList.remove('ds-density-dense');
    return { base, dense };
  });
  expect(gaps).toEqual({ base: 24, dense: 16 });
});

test('forced colours: the day lines stay visible', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const line = await log(page).locator('.ds-transcript__day').first().evaluate((el) => getComputedStyle(el, '::before').borderTopStyle);
  expect(line).toBe('solid');
});
