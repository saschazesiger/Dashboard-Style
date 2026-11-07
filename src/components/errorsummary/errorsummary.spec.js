/**
 * The error summary: a submit with problems stops, the summary shows with
 * its title and a link per problem in the form's order, takes the focus;
 * the fields get aria-invalid and their empty hints the message; the page's
 * own hint and aria-invalid count; a link moves the focus into its field;
 * fixing a field takes its line away, the last one hides the summary; a
 * valid submit reaches the page; set() for a server's answer; reset; the
 * names; touch; forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=errorsummary');
  await ready(page);
}

async function add(page) {
  await page.evaluate(() => {
    const field = (id, label, control, hint = '<small class="ds-field__hint ds-field__hint--error" hidden></small>') =>
      `<div class="ds-field"><label class="ds-field__label" for="${id}">${label}</label>${control}${hint}</div>`;
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin',
      '<form class="ds-form" id="es-form">' +
      '<div class="ds-alert ds-tone-error ds-errorsummary" id="es" data-ds-errorsummary hidden>' + window.DS.icons.icon(window.DS.icons.alertCircle, 20) +
      '<div class="ds-alert__text"><h2 class="ds-alert__title ds-errorsummary__title" id="es-title"></h2><ul class="ds-errorsummary__list"></ul></div></div>' +
      field('es-name', 'Device name <span class="ds-field__required" aria-hidden="true">*</span>', '<input class="ds-input" id="es-name" required>') +
      field('es-serial', 'Serial number', '<input class="ds-input" id="es-serial" required pattern="SN-[0-9]{4}">',
        '<small class="ds-field__hint ds-field__hint--error" id="es-serial-hint">Use the form SN-0000.</small>') +
      field('es-room', 'Room', '<input class="ds-input" id="es-room">') +
      field('es-owner', 'Owner', '<input class="ds-input" id="es-owner" disabled required>') +
      '<button class="ds-btn ds-btn--filled" type="submit" id="es-submit">Add device</button><button type="reset" id="es-reset">Discard</button></form>');
    window.sgSubmits = 0;
    document.getElementById('es-form').addEventListener('submit', (event) => { event.preventDefault(); window.sgSubmits += 1; });
  });
  await page.waitForFunction(() => document.getElementById('es')?.getAttribute('tabindex') === '-1');
}

const links = (page) => page.locator('#es .ds-errorsummary__list a').allTextContents();

test('a submit with problems: stopped, the title and links in order, the focus on the summary', async ({ page }) => {
  await open(page);
  await add(page);
  await expect(page.locator('#es-form')).toHaveAttribute('novalidate', '');
  await page.locator('#es-serial').fill('42');
  await page.locator('#es-submit').click();
  const summary = page.locator('#es');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(summary).toHaveAttribute('role', 'group');
  await expect(summary).toHaveAccessibleName('There are 2 problems');
  const texts = await links(page);
  expect(texts).toHaveLength(2);
  expect(texts[0]).toMatch(/^Device name: /);
  expect(texts[1]).toBe('Use the form SN-0000.');
  expect(await page.evaluate(() => window.sgSubmits)).toBe(0);
  // After a pointer submit the ring shows where the engine honours focus({ focusVisible: true }).
  // The fields: aria-invalid; the empty hint gets the message, linked; the page's own hint stays as it was.
  await expect(page.locator('#es-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#es-serial')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#es-room')).not.toHaveAttribute('aria-invalid', /./);
  const nameHint = page.locator('#es-name ~ .ds-field__hint--error');
  await expect(nameHint).toBeVisible();
  await expect(page.locator('#es-name')).toHaveAccessibleDescription(await nameHint.textContent());
  await expect(page.locator('#es-serial-hint')).toHaveText('Use the form SN-0000.');
});

test('a link moves the focus into its field; fixing fields takes their lines away and the last hides the summary', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#es-submit').click();
  await expect(page.locator('#es')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#es .ds-errorsummary__list a').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#es-name')).toBeFocused();
  await page.keyboard.type('LAPTOP-0042');
  await expect(page.locator('#es')).toHaveAccessibleName('There is 1 problem');
  expect(await links(page)).toHaveLength(1);
  await expect(page.locator('#es-name')).not.toHaveAttribute('aria-invalid', /./);
  await expect(page.locator('#es-name ~ .ds-field__hint--error')).toBeHidden();
  await page.locator('#es .ds-errorsummary__list a').first().click();
  await expect(page.locator('#es-serial')).toBeFocused();
  await page.keyboard.type('SN-0042');
  await expect(page.locator('#es')).toBeHidden();
  await page.locator('#es-submit').click();
  expect(await page.evaluate(() => window.sgSubmits)).toBe(1);
});

test('the page\'s own aria-invalid counts; set() shows a server\'s answer; reset takes everything back', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#es-name').fill('LAPTOP-0042');
  await page.locator('#es-serial').fill('SN-0042');
  await page.evaluate(() => document.getElementById('es-room').setAttribute('aria-invalid', 'true'));
  await page.locator('#es-submit').click();
  expect(await links(page)).toEqual(['Room']);
  await page.evaluate(() => document.getElementById('es-room').removeAttribute('aria-invalid'));
  await page.evaluate(() => window.DS.core.get(document.getElementById('es'), 'errorsummary').set([{ field: 'es-serial', text: 'SN-0042 is taken.' }]));
  expect(await links(page)).toEqual(['SN-0042 is taken.']);
  await expect(page.locator('#es')).toBeFocused();
  await expect(page.locator('#es-serial')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#es-reset').click();
  await expect(page.locator('#es')).toBeHidden();
  await expect(page.locator('#es-serial')).not.toHaveAttribute('aria-invalid', /./);
});

test('a submit from the keyboard: the summary takes the focus with its ring, solid at once', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#es-serial').fill('42');
  await page.locator('#es-serial').press('Enter');
  const summary = page.locator('#es');
  await expect(summary).toBeFocused();
  expect(await summary.evaluate((el) => [el.matches(':focus-visible'), getComputedStyle(el).outlineStyle])).toEqual([true, 'solid']);
});

test('validate() without the focus; a valid form passes', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#es-room').focus();
  const ok = await page.evaluate(() => window.DS.core.get(document.getElementById('es'), 'errorsummary').validate({ focus: false }));
  expect(ok).toBe(false);
  await expect(page.locator('#es')).toBeVisible();
  await expect(page.locator('#es-room')).toBeFocused();
  await page.locator('#es-name').fill('LAPTOP-0042');
  await page.locator('#es-serial').fill('SN-0042');
  expect(await page.evaluate(() => window.DS.core.get(document.getElementById('es'), 'errorsummary').validate())).toBe(true);
  await expect(page.locator('#es')).toBeHidden();
});

test('touch: each link takes the touch target; the demo renders at 360px without console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  await expect(page.locator('[data-demo="static"] .ds-errorsummary')).toBeVisible();
  await page.evaluate(() => document.querySelector('[data-demo="static"]').classList.add('ds-touch'));
  expect(await page.locator('[data-demo="static"] .ds-errorsummary__list a').first().evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('[data-demo="form"] button[type="submit"]').click();
  await expect(page.locator('[data-demo="form"] .ds-errorsummary')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('forced colours: the links are LinkText, the alert keeps an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const out = await page.evaluate(() => {
    const link = document.querySelector('[data-demo="static"] .ds-errorsummary__list a');
    const probe = document.createElement('span');
    probe.style.color = 'LinkText';
    link.parentElement.append(probe);
    const want = getComputedStyle(probe).color;
    probe.remove();
    const box = getComputedStyle(document.querySelector('[data-demo="static"] .ds-errorsummary'));
    return [getComputedStyle(link).color === want, box.outlineStyle !== 'none' || box.borderTopStyle !== 'none'];
  });
  expect(out).toEqual([true, true]);
});

test('a required radio group is one problem, named by its legend, marked and unmarked together', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    document.getElementById('es-room').closest('.ds-field').insertAdjacentHTML('afterend',
      '<fieldset class="ds-field" id="es-kind"><legend class="ds-field__label">Device type</legend>' +
      ['Laptop', 'Phone', 'Router'].map((label, i) => `<label class="ds-radio"><input class="ds-radio-input" type="radio" name="kind" id="es-kind-${i}" value="${i}"${i === 0 ? ' required' : ''}> ${label}</label>`).join('') +
      '<small class="ds-field__hint ds-field__hint--error" hidden></small></fieldset>');
  });
  await page.locator('#es-name').fill('LAPTOP-0042');
  await page.locator('#es-serial').fill('SN-0042');
  await page.locator('#es-submit').click();
  const texts = await links(page);
  expect(texts).toHaveLength(1);
  expect(texts[0]).toMatch(/^Device type: /);
  await expect(page.locator('#es .ds-errorsummary__list a')).toHaveAttribute('href', '#es-kind-0');
  for (const i of [0, 1, 2]) await expect(page.locator(`#es-kind-${i}`)).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#es-kind-1').check();
  await expect(page.locator('#es')).toBeHidden();
  for (const i of [0, 1, 2]) await expect(page.locator(`#es-kind-${i}`)).not.toHaveAttribute('aria-invalid', /./);
  await expect(page.locator('#es-kind .ds-field__hint--error')).toBeHidden();
});

test('typing into a field the list did not name adds nothing until the next submit', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => { document.getElementById('es-room').type = 'email'; });
  await page.locator('#es-submit').click();
  expect(await links(page)).toHaveLength(2);
  await page.locator('#es-room').fill('ada');
  expect(await links(page)).toHaveLength(2);
  await expect(page.locator('#es-room')).not.toHaveAttribute('aria-invalid', /./);
  await expect(page.locator('#es-room ~ .ds-field__hint--error')).toBeHidden();
  await page.locator('#es-name').fill('LAPTOP-0042');
  await expect(page.locator('#es')).toHaveAccessibleName('There is 1 problem');
  await page.locator('#es-submit').click();
  expect(await links(page)).toHaveLength(2);
  await expect(page.locator('#es-room')).toHaveAttribute('aria-invalid', 'true');
});
