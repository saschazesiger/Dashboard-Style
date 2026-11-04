/**
 * Form wizard (DS.wizard): the steps it writes, Next with the checks and
 * errors in words, Back, Enter, the summary with Edit, the submit, the
 * events, the options and forced colours. Runs in the `fallback` project
 * too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=wizard');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** A small wizard made for the test: Device (required serial), Problem (radios), Review. */
async function make(page, { around = '', steps = '' } = {}) {
  await page.evaluate(({ around, steps }) => {
    document.querySelector('[data-test-region]')?.remove();
    const region = document.createElement('div');
    region.setAttribute('data-test-region', '');
    region.className = around;
    region.innerHTML = `<form class="ds-wizard" data-ds-wizard data-test-wizard aria-label="Report a problem">
      <ol class="ds-steps ds-wizard__steps ${steps}" aria-label="Report a problem"></ol>
      <section class="ds-wizard__panel" aria-labelledby="t-w1"><h3 class="ds-wizard__title" id="t-w1">Device</h3>
        <div class="ds-field"><label class="ds-field__label" for="t-serial">Serial number</label><input class="ds-input" id="t-serial" name="serial" required pattern="SN-[0-9]{4}"></div>
        <div class="ds-field"><label class="ds-field__label" for="t-note">Note</label><input class="ds-input" id="t-note" name="note"></div>
        <div class="ds-field"><label class="ds-field__label" for="t-secret">Internal</label><input class="ds-input" id="t-secret" name="internal" value="x" data-ds-wizard-summary="off"></div></section>
      <section class="ds-wizard__panel" aria-labelledby="t-w2" hidden><h3 class="ds-wizard__title" id="t-w2">Problem</h3>
        <fieldset class="ds-fieldset"><legend class="ds-fieldset__legend">What happened</legend>
          <label class="ds-check"><input type="radio" name="kind" value="power" required><span>It does not start</span></label>
          <label class="ds-check"><input type="radio" name="kind" value="slow"><span>It is slow</span></label></fieldset></section>
      <section class="ds-wizard__panel" data-ds-wizard-optional aria-labelledby="t-w3" hidden><h3 class="ds-wizard__title" id="t-w3">Photos</h3>
        <label class="ds-check"><input type="checkbox" name="callback"><span>Call me back</span></label></section>
      <section class="ds-wizard__panel" data-ds-wizard-summary aria-labelledby="t-w4" hidden><h3 class="ds-wizard__title" id="t-w4">Review</h3><div class="ds-wizard__summary"></div></section>
      <div class="ds-wizard__actions"><button class="ds-btn ds-wizard__back" type="button">Back</button>
        <button class="ds-btn ds-btn--filled ds-wizard__next" type="button">Next</button>
        <button class="ds-btn ds-btn--filled ds-wizard__submit" type="submit" hidden>Send report</button></div></form>`;
    document.querySelector('#fx-component').prepend(region);
    window.events = [];
    window.sent = 0;
    const form = region.querySelector('form');
    form.addEventListener('ds:step', (event) => window.events.push(['step', event.detail.index, event.detail.from, event.detail.direction]));
    form.addEventListener('ds:validate', (event) => window.events.push(['validate', event.detail.index, event.detail.invalid.length]));
    form.addEventListener('submit', (event) => { event.preventDefault(); window.sent += 1; });
  }, { around, steps });
  await page.waitForFunction(() => DS.get(document.querySelector('[data-test-wizard]'), 'wizard'));
  return page.locator('[data-test-wizard]');
}

const state = (page) => page.evaluate(() => {
  const { index, count, step, status } = DS.get(document.querySelector('[data-test-wizard]'), 'wizard').get();
  return { index, count, step, status };
});

test('the steps it writes: numbers, the current one, Optional; Back hidden on the first step', async ({ page }) => {
  await open(page);
  const el = await make(page);
  const steps = el.locator('.ds-steps__step');
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(steps.nth(1).locator('.ds-steps__mark')).toHaveText('2');
  await expect(steps.nth(2)).toHaveAttribute('data-status', 'optional');
  await expect(steps.nth(2).locator('.ds-steps__hint')).toHaveText('Optional');
  await expect(el.locator('.ds-wizard__back')).toBeHidden();
  await expect(el.locator('.ds-wizard__submit')).toBeHidden();
  await expect(el.locator('.ds-wizard__panel').nth(1)).toBeHidden();
  expect(await el.evaluate((form) => form.noValidate)).toBe(true);
  expect(await state(page)).toEqual({ index: 0, count: 4, step: 'Device', status: ['', '', '', ''] });
});

test('Next on an invalid step: errors in words, focus on the first, the step in error, spoken', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await el.getByRole('button', { name: 'Next' }).click();
  const serial = el.getByRole('textbox', { name: 'Serial number' });
  await expect(serial).toBeFocused();
  await expect(serial).toHaveAttribute('aria-invalid', 'true');
  const hint = el.locator('.ds-wizard__error');
  await expect(hint).toHaveCount(1);
  await expect(hint.locator('svg')).toHaveCount(1);
  expect((await hint.textContent()).trim().length).toBeGreaterThan(0);
  expect(await serial.evaluate((input) => input.getAttribute('aria-describedby'))).toBe(await hint.getAttribute('id'));
  const first = el.locator('.ds-steps__step').first();
  await expect(first).toHaveAttribute('data-status', 'error');
  await expect(first.locator('.ds-steps__hint')).toHaveText('Needs attention');
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('One field needs attention.'))).toBe(true);
  expect(await state(page)).toMatchObject({ index: 0 });
  // A field put right loses its error at once, and the step its error state.
  await serial.fill('SN-1234');
  await expect(serial).not.toHaveAttribute('aria-invalid', 'true');
  await expect(hint).toHaveCount(0);
  await expect(first).not.toHaveAttribute('data-status', 'error');
  // A pattern mismatch is an error too.
  await serial.fill('nope');
  await el.getByRole('button', { name: 'Next' }).click();
  await expect(serial).toHaveAttribute('aria-invalid', 'true');
});

test('a valid step turns done, the next opens with its title focused and spoken; Back never checks', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await el.getByRole('textbox', { name: 'Serial number' }).fill('SN-1234');
  await el.getByRole('button', { name: 'Next' }).click();
  await expect(el.getByRole('heading', { name: 'Problem' })).toBeFocused();
  const steps = el.locator('.ds-steps__step');
  await expect(steps.nth(0)).toHaveAttribute('data-status', 'done');
  await expect(steps.nth(0).locator('.ds-steps__label')).toHaveText('Device, done');
  await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(el.locator('.ds-wizard__back')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Step 2 of 4: Problem'))).toBe(true);
  // The radio group: one error, in its fieldset, on every radio.
  await el.getByRole('button', { name: 'Next' }).click();
  await expect(el.locator('fieldset .ds-wizard__error')).toHaveCount(1);
  await expect(el.getByRole('radio', { name: 'It does not start' })).toBeFocused();
  await expect(el.getByRole('radio', { name: 'It is slow' })).toHaveAttribute('aria-invalid', 'true');
  await el.getByRole('button', { name: 'Back' }).click();
  expect(await state(page)).toMatchObject({ index: 0 });
  await expect(el.getByRole('heading', { name: 'Device' })).toBeFocused();
  const events = await page.evaluate(() => window.events);
  expect(events).toContainEqual(['step', 1, 0, 'forward']);
  expect(events).toContainEqual(['step', 0, 1, 'back']);
  expect(events).toContainEqual(['validate', 1, 1]);
});

test('Enter in a field goes on; ds:validate can refuse a step', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await page.evaluate(() => {
    document.querySelector('[data-test-wizard]').addEventListener('ds:validate', (event) => {
      if (event.detail.index === 0 && event.detail.panel.querySelector('[name="note"]').value === 'taken') event.preventDefault();
    });
  });
  await el.getByRole('textbox', { name: 'Serial number' }).fill('SN-1234');
  await el.getByRole('textbox', { name: 'Note' }).fill('taken');
  await page.keyboard.press('Enter');
  expect(await state(page)).toMatchObject({ index: 0 });
  await el.getByRole('textbox', { name: 'Note' }).fill('free');
  await page.keyboard.press('Enter');
  expect(await state(page)).toMatchObject({ index: 1 });
  expect(await page.evaluate(() => window.sent)).toBe(0);
});

test('the summary lists every step with Edit; the submit checks again and reaches the page once', async ({ page }) => {
  await open(page);
  const el = await make(page);
  await el.getByRole('textbox', { name: 'Serial number' }).fill('SN-1234');
  await el.getByRole('button', { name: 'Next' }).click();
  await el.getByRole('radio', { name: 'It is slow' }).check();
  await el.getByRole('button', { name: 'Next' }).click();
  await expect(el.getByRole('heading', { name: 'Photos' })).toBeFocused();
  await el.getByRole('button', { name: 'Next' }).click();
  await expect(el.locator('.ds-wizard__next')).toBeHidden();
  await expect(el.getByRole('button', { name: 'Send report' })).toBeVisible();
  const summary = el.locator('.ds-wizard__summary');
  await expect(summary.locator('.ds-wizard__group')).toHaveCount(3);
  await expect(summary.locator('.ds-wizard__group-title')).toHaveText(['Device', 'Problem', 'Photos']);
  const facts = await summary.locator('dl > div').evaluateAll((rows) => rows.map((row) => `${row.querySelector('dt').textContent}=${row.querySelector('dd').textContent}`));
  expect(facts).toEqual(['Serial number=SN-1234', 'Note=Not given', 'What happened=It is slow', 'Call me back=No']);
  // Edit goes back to its step; the way forward checks again.
  await summary.getByRole('button', { name: 'Edit Problem' }).click();
  expect(await state(page)).toMatchObject({ index: 1 });
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-test-wizard]'), 'wizard').go(3))).toBe(true);
  // A step broken behind the summary: the submit opens it with its errors and the page hears nothing.
  await page.evaluate(() => { document.querySelector('#t-serial').value = ''; });
  await el.getByRole('button', { name: 'Send report' }).click();
  expect(await state(page)).toMatchObject({ index: 0 });
  await expect(el.getByRole('textbox', { name: 'Serial number' })).toBeFocused();
  expect(await page.evaluate(() => window.sent)).toBe(0);
  await el.getByRole('textbox', { name: 'Serial number' }).fill('SN-9999');
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-test-wizard]'), 'wizard').go(3))).toBe(true);
  await el.getByRole('button', { name: 'Send report' }).click();
  expect(await page.evaluate(() => window.sent)).toBe(1);
});

test('the bar variant names the list "Step n of m"', async ({ page }) => {
  await open(page);
  const el = await make(page, { steps: 'ds-steps--bar' });
  await expect(el.locator('.ds-steps')).toHaveAttribute('aria-label', 'Step 1 of 4');
  await el.getByRole('textbox', { name: 'Serial number' }).fill('SN-1234');
  await el.getByRole('button', { name: 'Next' }).click();
  await expect(el.locator('.ds-steps')).toHaveAttribute('aria-label', 'Step 2 of 4');
});

test('options: density tightens the gaps, touch makes the actions 48px; 360px wraps without overflow', async ({ page }) => {
  await open(page);
  const measure = async (around) => {
    const el = await make(page, { around });
    return el.evaluate((form) => ({
      gap: parseFloat(getComputedStyle(form).rowGap),
      panelGap: parseFloat(getComputedStyle(form.querySelector('.ds-wizard__panel')).rowGap),
      next: form.querySelector('.ds-wizard__next').getBoundingClientRect().height,
    }));
  };
  const base = await measure('');
  const dense = await measure('ds-density-dense');
  expect(dense.gap).toBeCloseTo(base.gap - 4, 0);
  expect(dense.panelGap).toBeCloseTo(base.panelGap - 4, 0);
  expect((await measure('ds-touch ds-density-tight')).next).toBeGreaterThanOrEqual(48);
  const el = await make(page);
  await el.evaluate((form) => { form.style.inlineSize = '328px'; });
  expect(await el.evaluate((form) => form.scrollWidth <= form.clientWidth + 1)).toBe(true);
});

test('forced colours: the hairline over the actions stays', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const el = await make(page);
  const line = await el.locator('.ds-wizard__actions').evaluate((node) => getComputedStyle(node).borderTopStyle);
  expect(line).toBe('solid');
});

test('the demo renders without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.locator('[data-demo="wizard"]')).toHaveCount(3);
  await expect(page.locator('[data-demo="wizard"]').first().locator('.ds-steps__step')).toHaveCount(5);
  await expect(page.locator('[data-demo="wizard"] .ds-steps--bar')).toHaveAttribute('aria-label', 'Step 1 of 5');
  expect(errors).toEqual([]);
});

