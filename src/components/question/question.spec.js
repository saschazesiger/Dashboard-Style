/**
 * The question card on its demo page: names and roles (a form and a radio
 * group named by the question), the error of an answer without a choice,
 * an answer by keyboard (digits, Enter) with the actions going, the
 * controls disabled, the line focused (announced only when the focus was
 * elsewhere), ds:answer and
 * ds:change; one's own answer, several choices, Skip, a cancelled
 * ds:answer settled by set(), a question from history, the narrow column,
 * density and shape, forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=question';

async function open(page) {
  await page.goto(URL);
  await ready(page);
}

const ONE = '[data-demo="one"]';

async function listen(page, selector) {
  await page.evaluate((sel) => {
    window.events = [];
    window.spoken = [];
    const el = document.querySelector(sel);
    el.addEventListener('ds:answer', (event) => window.events.push(['answer', event.detail]));
    el.addEventListener('ds:change', (event) => window.events.push(['change', event.detail.state]));
    new MutationObserver(() => {
      for (const node of document.querySelectorAll('.ds-sr[aria-live]')) if (node.textContent.trim()) window.spoken.push(node.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }, selector);
}

test('names and roles: a form and a radio group named by the question, the icon hidden', async ({ page }) => {
  await open(page);
  const card = page.locator(ONE);
  await expect(card).toHaveRole('form');
  await expect(card).toHaveAccessibleName('Which laptops should get new batteries?');
  await expect(card.getByRole('radiogroup')).toHaveAccessibleName('Which laptops should get new batteries?');
  await expect(card.getByRole('radio')).toHaveCount(3);
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await expect(card.locator('.ds-question__icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-demo="many"]').getByRole('group')).toHaveAccessibleName('Which reports should the summary include?');
});

test('an answer without a choice: the message with an icon, aria-invalid, focus on the first option; a choice clears it', async ({ page }) => {
  await open(page);
  const card = page.locator(ONE);
  await card.getByRole('button', { name: 'Answer' }).click();
  const error = card.locator('.ds-question__error');
  await expect(error).toBeVisible();
  await expect(error).toHaveText('Choose an answer.');
  await expect(error.locator('svg')).toHaveCount(1);
  const group = card.getByRole('radiogroup');
  await expect(group).toHaveAttribute('aria-invalid', 'true');
  await expect(group).toHaveAccessibleDescription('Choose an answer.');
  await expect(card.getByRole('radio').first()).toBeFocused();
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await page.keyboard.press('ArrowDown');
  await expect(error).toBeHidden();
  await expect(group).not.toHaveAttribute('aria-invalid');
});

test('keyboard: a digit picks, Enter answers; the actions go, the controls lock, the line takes focus and is not announced too', async ({ page }) => {
  await open(page);
  const card = page.locator(ONE);
  await listen(page, ONE);
  await card.getByRole('radio').first().focus();
  await page.keyboard.press('2');
  await expect(card.getByRole('radio').nth(1)).toBeChecked();
  await expect(card.getByRole('radio').nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('data-state', 'answered');
  const line = card.locator('.ds-question__answer');
  await expect(line).toHaveText('Answered: Only LAPTOP-0007');
  await expect(line).toBeFocused();
  await expect(card.locator('.ds-question__actions')).toBeHidden();
  await expect(card.getByRole('radio').nth(1)).toBeChecked();
  await expect(card.getByRole('radio').nth(1)).toBeDisabled();
  await expect(card.getByRole('textbox')).toBeDisabled();
  // Read on the focused line, so not announced as well. An answer set from
  // the page while the focus is elsewhere is announced instead.
  await page.locator('[data-demo="many"]').evaluate((el) => DS.core.get(el, 'question').set({ state: 'skipped' }));
  await expect.poll(() => page.evaluate(() => [...new Set(window.spoken)])).toEqual(['Skipped']);
  expect(await page.evaluate(() => window.events)).toEqual([
    ['answer', { values: ['worst'], labels: ['Only LAPTOP-0007'], other: '', skipped: false }],
    ['change', 'answered'],
  ]);
  // Asked again: everything comes back.
  await page.locator('[data-demo="again"]').click();
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await expect(card.locator('.ds-question__actions')).toBeVisible();
  await expect(card.locator('.ds-question__answer')).toBeHidden();
  await expect(card.getByRole('radio').nth(1)).toBeEnabled();
  await expect(card.getByRole('radio').nth(1)).not.toBeChecked();
});

test('one\'s own answer picks Something else and is the label; digits type in the field', async ({ page }) => {
  await open(page);
  const card = page.locator(ONE);
  await listen(page, ONE);
  await card.getByRole('textbox', { name: 'Your answer' }).fill('LAPTOP-0019 first');
  await page.keyboard.press('1');
  await expect(card.getByRole('textbox')).toHaveValue('LAPTOP-0019 first1');
  await expect(card.getByRole('radio', { name: /Something else/ })).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(card.locator('.ds-question__answer')).toHaveText('Answered: LAPTOP-0019 first1');
  expect((await page.evaluate(() => window.events))[0][1]).toEqual({ values: ['other'], labels: ['LAPTOP-0019 first1'], other: 'LAPTOP-0019 first1', skipped: false });
});

test('several choices: checkboxes, digits toggle, the labels as a list; Skip says Skipped', async ({ page }) => {
  await open(page);
  const card = page.locator('[data-demo="many"]');
  await card.getByRole('checkbox').first().focus();
  await page.keyboard.press('3');
  await expect(card.getByRole('checkbox').nth(2)).toBeChecked();
  await card.getByRole('button', { name: 'Answer' }).click();
  await expect(card.locator('.ds-question__answer')).toHaveText('Answered: Warranty and Repair costs');
  const one = page.locator(ONE);
  await one.getByRole('button', { name: 'Skip' }).click();
  await expect(one).toHaveAttribute('data-state', 'skipped');
  await expect(one.locator('.ds-question__answer')).toHaveText('Skipped');
});

test('a cancelled ds:answer keeps it open until the page settles it; a question from history is decided quietly', async ({ page }) => {
  await open(page);
  const server = page.locator('[data-demo="server"]');
  await server.getByRole('radio').first().check();
  await server.getByRole('button', { name: 'Answer' }).click();
  await expect(server).toHaveAttribute('data-state', 'waiting');
  await expect(server.locator('button[type="submit"]')).toHaveAttribute('aria-busy', 'true');
  await expect(server).toHaveAttribute('data-state', 'answered', { timeout: 5000 });
  await expect(server.locator('.ds-question__answer')).toHaveText('Answered: Now');
  const history = page.locator('[data-demo="history"]');
  await expect(history).toHaveAttribute('data-state', 'answered');
  await expect(history.locator('.ds-question__answer')).toHaveText('Answered: Hardware');
  await expect(history.locator('.ds-question__actions')).toBeHidden();
  const state = await page.locator(ONE).evaluate((el) => {
    const question = DS.core.get(el, 'question');
    question.set({ value: 'all' });
    return question.get();
  });
  expect(state).toEqual({ state: 'waiting', values: ['all'], labels: ['All three'], other: '' });
});

test('create() then destroy(): digits, Skip and Enter do nothing', async ({ page }) => {
  await open(page);
  await page.evaluate((sel) => {
    const copy = document.querySelector(sel).cloneNode(true);
    copy.removeAttribute('data-ds-question');
    copy.id = 'own';
    // A real submit would leave the page once nothing prevents it.
    copy.addEventListener('submit', (event) => event.preventDefault());
    document.querySelector('#fx-component').append(copy);
    window.answered = 0;
    copy.addEventListener('ds:answer', () => { window.answered += 1; });
    DS.question.create(copy).destroy();
  }, ONE);
  const card = page.locator('#own');
  await card.getByRole('radio').first().focus();
  await page.keyboard.press('2');
  await expect(card.getByRole('radio').nth(1)).not.toBeChecked();
  await card.getByRole('button', { name: 'Skip' }).click();
  await card.getByRole('radio').first().check();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.answered)).toBe(0);
  await expect(card).toHaveAttribute('data-state', 'waiting');
  await expect(card.locator('.ds-question__actions')).toBeVisible();
});

test('narrow and phone width: nothing overflows at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('options: density steps the padding and the room, shape scales the corners, touch reaches the cards and buttons', async ({ page }) => {
  await open(page);
  const read = () => page.locator(ONE).evaluate((el) => ({
    pad: parseFloat(getComputedStyle(el).paddingTop),
    gap: parseFloat(getComputedStyle(el).rowGap),
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
    button: el.querySelector('.ds-btn').getBoundingClientRect().height,
    card: el.querySelector('.ds-radio').getBoundingClientRect().height,
  }));
  const base = await read();
  expect(base.pad).toBe(16);
  expect(base.gap).toBe(12);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-density-compact', 'ds-shape-square', 'ds-touch'));
  const changed = await read();
  expect(changed.pad).toBe(14);
  expect(changed.gap).toBe(10);
  expect(changed.radius).toBe(0);
  expect(changed.button).toBeGreaterThanOrEqual(48);
  expect(changed.card).toBeGreaterThanOrEqual(48);
});

test('forced colours: the frame keeps its border, the glyph follows the line', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.locator('[data-demo="history"]').evaluate((el) => ({
    border: getComputedStyle(el).borderTopStyle,
    glyph: getComputedStyle(el.querySelector('.ds-question__glyph')).color,
    line: getComputedStyle(el.querySelector('.ds-question__answer')).color,
  }));
  expect(look.border).toBe('solid');
  expect(look.glyph).toBe(look.line);
});
