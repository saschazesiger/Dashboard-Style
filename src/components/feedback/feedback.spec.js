/**
 * Feedback (3.0): the thumbs are exclusive toggles (aria-pressed, the
 * filled thumb), ds:change and ds:feedback, the thanks announced, the
 * reason dialog (focus in and back, the reasons and the comment, a skip
 * still counts), the lock, names and forced colours. Runs in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=feedback');
  await ready(page);
  await page.evaluate(() => {
    window.__events = [];
    for (const type of ['change', 'feedback']) document.addEventListener(`ds:${type}`, (event) => window.__events.push([type, JSON.parse(JSON.stringify(event.detail))]));
  });
}

const events = (page) => page.evaluate(() => window.__events);
const plain = (page) => page.locator('.ds-feedback').nth(1);

test('the thumbs are exclusive toggles; a value that turns on is feedback, thanked once', async ({ page }) => {
  await open(page);
  const up = plain(page).getByRole('button', { name: 'Helpful', exact: true });
  const down = plain(page).getByRole('button', { name: 'Not helpful' });
  await up.click();
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  await expect(down).toHaveAttribute('aria-pressed', 'false');
  const fill = await up.locator('svg > :last-child').evaluate((el) => getComputedStyle(el).fill);
  expect(fill).not.toBe('rgba(0, 0, 0, 0)');
  await expect(plain(page).locator('.ds-feedback__status')).toHaveText('Thanks for the feedback');
  await expect(page.locator('.ds-sr[aria-live="polite"]')).toHaveText('Thanks for the feedback');
  await up.click();
  await expect(up).toHaveAttribute('aria-pressed', 'false');
  await expect(plain(page).locator('.ds-feedback__status')).toHaveText('');
  expect(await events(page)).toEqual([
    ['change', { value: 'up', previous: null }],
    ['feedback', { value: 'up', reasons: [], comment: '' }],
    ['change', { value: null, previous: 'up' }],
  ]);
});

test('a thumb down asks why: focus moves into the dialog, the reasons and the comment come with the feedback', async ({ page }) => {
  await open(page);
  const main = page.locator('[data-demo="main"]');
  const down = main.getByRole('button', { name: 'Not helpful' });
  await down.click();
  const dialog = page.getByRole('dialog', { name: 'What went wrong?' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('.ds-dialog')))).toBe(true);
  await dialog.getByText('Incomplete').click();
  await dialog.getByText('Hard to follow').click();
  await dialog.getByLabel('Anything else? (optional)').fill('It missed the second laptop.');
  await dialog.getByRole('button', { name: 'Send feedback' }).click();
  await expect(dialog).toBeHidden();
  await expect(down).toBeFocused();
  await expect(page.locator('[data-demo="log"]')).toHaveText('Feedback: down, because incomplete, unclear ("It missed the second laptop.").');
  expect((await events(page)).filter(([type]) => type === 'feedback')).toEqual([['feedback', { value: 'down', reasons: ['incomplete', 'unclear'], comment: 'It missed the second laptop.' }]]);
});

test('Escape skips the dialog: the thumb still counts, the form starts empty next time', async ({ page }) => {
  await open(page);
  const main = page.locator('[data-demo="main"]');
  const down = main.getByRole('button', { name: 'Not helpful' });
  await down.click();
  const dialog = page.getByRole('dialog', { name: 'What went wrong?' });
  await expect(dialog).toBeVisible();
  await dialog.getByText('Incomplete').click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(down).toBeFocused();
  await expect(down).toHaveAttribute('aria-pressed', 'true');
  expect((await events(page)).filter(([type]) => type === 'feedback')).toEqual([['feedback', { value: 'down', reasons: [], comment: '' }]]);
  // Off, then on again: a fresh form.
  await down.click();
  await down.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[name="reason"]:checked')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Skip' }).click();
  await expect(dialog).toBeHidden();
  // A thumb up asks nothing.
  await main.getByRole('button', { name: 'Helpful', exact: true }).click();
  await expect(dialog).toBeHidden();
});

test('locked: once given, both thumbs are blocked and the choice keeps its look; set() shows a stored one', async ({ page }) => {
  await open(page);
  const locked = page.locator('.ds-feedback[data-ds-feedback-lock]');
  const up = locked.getByRole('button', { name: 'Helpful', exact: true });
  await up.click();
  await expect(up).toHaveAttribute('aria-disabled', 'true');
  await expect(locked.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-disabled', 'true');
  await locked.getByRole('button', { name: 'Not helpful' }).click({ force: true });
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  const stored = page.locator('.ds-feedback').nth(3);
  await expect(stored.getByRole('button', { name: 'Helpful', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await stored.evaluate((el) => DS.feedback.create(el).set('down'));
  await expect(stored.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true');
  expect(await stored.evaluate((el) => DS.feedback.create(el).get())).toEqual({ value: 'down' });
});

test('names: a named group of named toggles; touch makes 48px targets', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('group', { name: 'Rate this answer' })).toHaveCount(4);
  const size = await plain(page).evaluate((el) => {
    el.classList.add('ds-touch');
    return el.querySelector('button').getBoundingClientRect().height;
  });
  expect(size).toBeGreaterThanOrEqual(48);
});

test('forced colours: the pressed thumb is Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const pressed = page.locator('.ds-feedback').nth(3).locator('[aria-pressed="true"]');
  const colours = await pressed.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'Highlight';
    document.body.append(probe);
    const highlight = getComputedStyle(probe).color;
    probe.remove();
    return { background: getComputedStyle(el).backgroundColor, highlight };
  });
  expect(colours.background).toBe(colours.highlight);
});
