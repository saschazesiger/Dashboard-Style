/**
 * The dialog on the options model (3.0): the sizes and their 2.x alias, density
 * on the box's padding, shape on its radius, full screen on phones, the form
 * dialog, the filled error button of a destructive confirmation (D10) and of
 * nothing else, the declarative triggers and their 2.x name, the ds: events,
 * the keyboard, names and forced colours. The 2.x behaviour stays in
 * test/browser/overlay.spec.js, promise-dialogs.spec.js and
 * dialog-layout.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=dialog');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** The box of a dialog made for the test, in `classes`, inside a region of `around`. */
const measure = (page, classes, around = '') => page.evaluate(async ({ classes, around }) => {
  const region = document.createElement('div');
  region.className = around;
  region.innerHTML = `<dialog class="ds-dialog ${classes}" aria-label="Probe"><div class="ds-dialog__backdrop"></div><div class="ds-dialog__box"><h2 class="ds-dialog__title">Probe</h2><div class="ds-dialog__actions"><button class="ds-btn" type="button">OK</button></div></div></dialog>`;
  document.querySelector('#fx-component').append(region);
  const dialog = region.querySelector('dialog');
  await DS.overlay.open(dialog);
  const box = dialog.querySelector('.ds-dialog__box');
  // A loaded machine can resolve open() on settled()'s timeout: the box is still scaling then.
  await Promise.all(box.getAnimations().map((animation) => animation.finished.catch(() => null)));
  const style = getComputedStyle(box);
  const out = { width: box.getBoundingClientRect().width, height: box.getBoundingClientRect().height, padding: parseFloat(style.paddingInlineStart), gap: parseFloat(style.rowGap), radius: parseFloat(style.borderTopLeftRadius), button: dialog.querySelector('.ds-btn').getBoundingClientRect().height };
  await DS.overlay.close(dialog);
  region.remove();
  return out;
}, { classes, around });

test('the sizes: 320, 400, 560 and 720px, capped by the window; --wide is --lg', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  expect((await measure(page, 'ds-dialog--sm')).width).toBeCloseTo(320, 0);
  expect((await measure(page, '')).width).toBeCloseTo(400, 0);
  expect((await measure(page, 'ds-dialog--lg')).width).toBeCloseTo(560, 0);
  expect((await measure(page, 'ds-dialog--wide')).width, 'the 2.x alias').toBeCloseTo(560, 0);
  expect((await measure(page, 'ds-dialog--xl')).width).toBeCloseTo(720, 0);
  await page.setViewportSize({ width: 390, height: 800 });
  expect((await measure(page, 'ds-dialog--xl')).width, 'never wider than the window').toBeLessThanOrEqual(390 - 2 * 16);
});

test('density changes the padding and the gap, not the width; a size class reaches the controls only', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  const comfortable = await measure(page, '');
  const compact = await measure(page, '', 'ds-density-compact');
  const tight = await measure(page, '', 'ds-density-tight');
  expect(comfortable.padding).toBeCloseTo(24, 0);
  expect(compact.padding).toBeCloseTo(22, 0);
  expect(tight.padding).toBeCloseTo(18, 0);
  expect(compact.gap).toBeCloseTo(comfortable.gap - 2, 0);
  expect(tight.width).toBeCloseTo(comfortable.width, 0);
  const small = await measure(page, '', 'ds-sm');
  expect(small.width).toBeCloseTo(comfortable.width, 0);
  expect(small.button).toBeCloseTo(comfortable.button - 8, 0);
  const touch = await measure(page, '', 'ds-touch ds-density-tight');
  expect(touch.button, '.ds-touch reaches the buttons inside').toBeGreaterThanOrEqual(48);
});

test('the shape multiplies the radius', async ({ page }) => {
  await open(page);
  const plain = await measure(page, '');
  expect(plain.radius).toBeGreaterThan(0);
  expect((await measure(page, '', 'ds-shape-square')).radius).toBe(0);
  expect((await measure(page, '', 'ds-shape-soft')).radius).toBeCloseTo(plain.radius / 2, 1);
  expect((await measure(page, '', 'ds-shape-round')).radius).toBeCloseTo(plain.radius * 1.5, 1);
});

test('full screen on phones: --full-narrow fills the window at 600px and below, a normal dialog above', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  expect((await measure(page, 'ds-dialog--full-narrow')).width).toBeCloseTo(400, 0);
  const full = await measure(page, 'ds-dialog--full');
  expect(full.width).toBeCloseTo(1280, -1);
  expect(full.height).toBeCloseTo(800, -1);
  await page.setViewportSize({ width: 390, height: 800 });
  const narrow = await measure(page, 'ds-dialog--full-narrow');
  expect(narrow.width).toBeCloseTo(390, 0);
  expect(narrow.height).toBeCloseTo(800, 0);
});

test('a form dialog: Enter submits, the browser validates first, ds:submit tells, and it closes with reason submit', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const dialog = document.querySelector('[data-demo="form"]');
    DS.dialog.form(dialog, {});
    window.seen = [];
    dialog.addEventListener('ds:submit', (event) => window.seen.push(['submit', event.detail.data.get('name')]));
    dialog.addEventListener('ds:close', (event) => window.seen.push(['close', event.detail.reason]));
  });
  const dialog = page.locator('[data-demo="form"]');
  const field = dialog.locator('input');
  await page.getByRole('button', { name: 'Rename the device' }).click();
  await expect(field, 'autofocus').toBeFocused();
  await field.fill('');
  await page.keyboard.press('Enter');
  await expect(dialog, 'invalid: it stays').toHaveAttribute('data-state', 'open');
  expect(await page.evaluate(() => window.seen)).toEqual([]);
  await field.fill('DESKTOP-0107');
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => window.seen)).toEqual([['submit', 'DESKTOP-0107'], ['close', 'submit']]);
  await expect(page.getByRole('button', { name: 'Rename the device' }), 'focus back on the opener').toBeFocused();
});

test('a form dialog: ds:submit can be cancelled; form() stays open and busy while onSubmit runs; a failure keeps it open with a snackbar', async ({ page }) => {
  await open(page);
  const dialog = page.locator('[data-demo="form"]');
  await page.evaluate(() => {
    const el = document.querySelector('[data-demo="form"]');
    DS.dialog.form(el, {});
    window.cancel = (event) => event.preventDefault();
    el.addEventListener('ds:submit', window.cancel);
  });
  await page.getByRole('button', { name: 'Rename the device' }).click();
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(dialog, 'cancelled: it stays').toHaveAttribute('data-state', 'open');
  await page.evaluate(() => {
    const el = document.querySelector('[data-demo="form"]');
    el.removeEventListener('ds:submit', window.cancel);
    window.release = null;
    DS.dialog.form(el, { errorText: 'Could not rename.', onSubmit: () => new Promise((resolve, reject) => { window.release = { resolve, reject }; }) });
  });
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveAttribute('data-ds-busy', '');
  await page.keyboard.press('Escape');
  await expect(dialog, 'busy: Escape does nothing').toHaveAttribute('data-state', 'open');
  await page.evaluate(() => window.release.reject(new Error('no')));
  await expect(page.locator('.ds-toast__text', { hasText: 'Could not rename.' })).toBeVisible();
  await expect(dialog).not.toHaveAttribute('data-ds-busy', '');
  await expect(dialog).toHaveAttribute('data-state', 'open');
  await expect(page.locator('[data-demo="form"] [type="submit"]'), 'focus back on the button').toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveAttribute('data-ds-busy', '');
  await page.evaluate(() => window.release.resolve());
  await settle(page);
  await expect(dialog).toBeHidden();
});

test('a form dialog while onSubmit runs, on the documented markup: the spinner, Cancel blocked, the fields held; a failure gives it all back', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `
      <button class="ds-btn" type="button" id="rename-open" data-ds-open="#rename">Rename</button>
      <dialog class="ds-dialog" id="rename" aria-labelledby="rename-title">
        <div class="ds-dialog__backdrop" data-ds-close></div>
        <form class="ds-dialog__box" data-ds-dialog-form>
          <h2 class="ds-dialog__title" id="rename-title">Rename the device</h2>
          <div class="ds-dialog__body">
            <div class="ds-field"><label class="ds-field__label" for="rename-name">Name</label>
              <input class="ds-input" id="rename-name" name="name" required autofocus></div>
            <label><input type="checkbox" id="rename-keep" name="keep"> Keep the old name</label>
            <input class="ds-input" id="rename-note" name="note" readonly value="locked by the page" aria-label="Note">
          </div>
          <div class="ds-dialog__actions">
            <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
            <button class="ds-btn ds-btn--filled" type="submit">
              <span class="ds-btn__faces"><span class="ds-btn__face">Save</span>
                <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Save</span></span>
            </button>
          </div>
        </form>
      </dialog>`);
    window.release = null;
    DS.dialog.form(document.getElementById('rename'), { onSubmit: () => new Promise((resolve, reject) => { window.release = { resolve, reject }; }) });
  });
  const dialog = page.locator('#rename');
  const cancel = dialog.locator('.ds-dialog__actions [data-ds-close]');
  const submit = dialog.locator('[type="submit"]');
  const name = page.locator('#rename-name');
  const keep = page.locator('#rename-keep');
  const held = () => page.evaluate(() => ({ name: document.getElementById('rename-name').readOnly, keep: document.getElementById('rename-keep').inert, note: document.getElementById('rename-note').readOnly }));
  await page.locator('#rename-open').click();
  await settle(page);
  await name.fill('DESKTOP-0107');
  await page.keyboard.press('Enter');

  await expect(dialog).toHaveAttribute('data-ds-busy', '');
  await expect(submit).toHaveAttribute('aria-busy', 'true');
  await expect(cancel).toHaveAttribute('aria-disabled', 'true');
  expect(await held()).toEqual({ name: true, keep: true, note: true });
  await expect.poll(() => submit.locator('.ds-btn__face--busy').evaluate((face) => Number(getComputedStyle(face).opacity)), 'the spinner face shows').toBeGreaterThan(0.9);
  await page.evaluate(() => document.querySelector('#rename .ds-dialog__actions [data-ds-close]').click());
  await expect(dialog, 'Cancel is refused').toHaveAttribute('data-state', 'open');

  await page.evaluate(() => window.release.reject(new Error('no')));
  await expect(dialog).not.toHaveAttribute('data-ds-busy', '');
  await expect(cancel).not.toHaveAttribute('aria-disabled', 'true');
  expect(await held(), 'given back; what the page set stays').toEqual({ name: false, keep: false, note: true });
  await expect(dialog).toHaveAttribute('data-state', 'open');
  await expect(submit, 'focus on the button').toBeFocused();

  await page.locator('#rename-keep').focus();
  await page.evaluate(() => document.querySelector('#rename form').requestSubmit());
  await expect(dialog).toHaveAttribute('data-ds-busy', '');
  await expect(submit, 'a control that goes inert hands its focus on').toBeFocused();
  await page.evaluate(() => window.release.resolve());
  await settle(page);
  await expect(dialog).toBeHidden();
  expect(await held(), 'and after a success, for the next open').toEqual({ name: false, keep: false, note: true });
  await expect(keep).not.toBeChecked();
});

test('the demo\'s busy dialog: Cancel says it is blocked while the action runs', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Delete 3 devices' }).click();
  await settle(page);
  const dialog = page.locator('[data-demo="busy"]');
  await page.locator('[data-demo="busy-action"]').click();
  await expect(dialog).toHaveAttribute('data-ds-busy', '');
  await expect(dialog.locator('.ds-dialog__actions [data-ds-close]')).toHaveAttribute('aria-disabled', 'true');
});

test('the strings: DS.config({ strings }) names the buttons and messages of a built dialog; an option still wins', async ({ page }) => {
  await open(page);
  const texts = await page.evaluate(async () => {
    DS.config({ strings: { ok: 'Gut', cancel: 'Abbrechen', confirm: 'Bestaetigen', actionFailed: 'Das ging nicht.', valueRequired: 'Bitte ausfuellen.' } });
    const built = () => document.querySelector('dialog.ds-dialog[open][aria-labelledby^="ds-ask"]');
    const shown = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const out = {};
    const told = DS.dialog.alert({ title: 'A' });
    await shown();
    out.ok = built().querySelector('.ds-btn--filled').textContent;
    built().querySelector('.ds-btn--filled').click();
    await told;
    const asked = DS.dialog.prompt({ title: 'B', label: 'Name', input: { required: true } });
    await shown();
    out.cancel = built().querySelector('.ds-btn--text').textContent;
    out.confirm = built().querySelector('.ds-btn--filled .ds-btn__face').textContent;
    built().querySelector('.ds-btn--filled').click();
    out.required = built().querySelector('.ds-field__hint--error').textContent;
    built().querySelector('.ds-btn--text').click();
    await asked;
    const failing = DS.dialog.confirm({ title: 'C', confirmLabel: 'Loeschen', onConfirm: () => Promise.reject(new Error('no')) });
    await shown();
    out.option = built().querySelector('.ds-btn--filled .ds-btn__face').textContent;
    built().querySelector('.ds-btn--filled').click();
    await new Promise((resolve) => { const wait = () => (document.querySelector('.ds-toast__text') ? resolve() : setTimeout(wait, 20)); wait(); });
    out.failed = document.querySelector('.ds-toast__text').textContent;
    built().querySelector('.ds-btn--text').click();
    await failing;
    DS.config({ strings: { ok: 'OK', cancel: 'Cancel', confirm: 'Confirm', actionFailed: 'That did not work. Try again.', valueRequired: 'Enter a value.' } });
    return out;
  });
  expect(texts).toEqual({ ok: 'Gut', cancel: 'Abbrechen', confirm: 'Bestaetigen', required: 'Bitte ausfuellen.', option: 'Loeschen', failed: 'Das ging nicht.' });
});

test('a box form without data-ds-dialog-form stays the page\'s, as in 2.x: no ds:submit, no close', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<dialog class="ds-dialog" id="own-form" aria-label="Own"><form class="ds-dialog__box"><input name="a" value="1"><button type="submit">Go</button></form></dialog>');
    const dialog = document.getElementById('own-form');
    const events = [];
    dialog.addEventListener('ds:submit', () => events.push('ds:submit'));
    dialog.querySelector('form').addEventListener('submit', (event) => { event.preventDefault(); events.push('page'); });
    await DS.overlay.open(dialog);
    dialog.querySelector('button').click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const open = dialog.getAttribute('data-state');
    await DS.overlay.close(dialog);
    return { events, open };
  });
  expect(seen).toEqual({ events: ['page'], open: 'open' });
});

test('D10: confirm({ destructive: true }) fills its button in the error tone; a plain confirm stays primary', async ({ page }) => {
  await open(page);
  const look = (destructive) => page.evaluate(async (destructive) => {
    const asked = DS.overlay.confirm({ title: 'Delete 3 devices?', text: 'This cannot be undone.', confirmLabel: 'Delete devices', destructive });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const dialog = document.querySelector('dialog.ds-dialog[open][aria-labelledby^="ds-ask"]');
    const button = dialog.querySelector('.ds-btn--filled');
    const probe = document.createElement('i');
    probe.style.color = 'var(--ds-error)';
    dialog.append(probe);
    const error = getComputedStyle(probe).color;
    probe.remove();
    const out = { role: dialog.getAttribute('role'), classes: button.className, background: getComputedStyle(button).backgroundColor, error, focused: document.activeElement.textContent, label: button.textContent };
    await Promise.all(button.getAnimations().map((animation) => animation.finished.catch(() => null)));
    out.background = getComputedStyle(button).backgroundColor;
    dialog.querySelector('.ds-btn--text').click();
    await asked;
    return out;
  }, destructive);
  const hard = await look(true);
  expect(hard.classes).toContain('ds-tone-error');
  expect(hard.background).toBe(hard.error);
  expect(hard.role).toBe('alertdialog');
  expect(hard.focused, 'the safe choice first').toBe('Cancel');
  expect(hard.label, 'the label names the consequence').toContain('Delete devices');
  await settle(page);
  const plain = await look(false);
  expect(plain.classes).not.toContain('ds-tone-error');
  expect(plain.background).not.toBe(plain.error);
  expect(plain.role).toBeNull();
});

test('triggers: data-ds-open opens with its button as the opener, data-ds-close and data-close close, data-ds-close="#id" from outside', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await page.evaluate(() => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<button class="ds-btn" type="button" id="outside" data-ds-close="#alias" style="position:fixed;inset:0 auto auto 0;z-index:9999">Outside</button>'
      + '<button class="ds-btn" type="button" id="by-id" data-ds-open="alias">By id</button>'
      + '<div class="ds-dialog" id="alias" hidden><div class="ds-dialog__backdrop"></div><div class="ds-dialog__box" role="dialog" aria-modal="true" aria-label="Alias"><button class="ds-btn" type="button" id="old-name" data-close>Close</button></div></div>');
    window.reasons = [];
    document.addEventListener('ds-close', (event) => window.reasons.push(`old:${event.detail.reason}`));
    document.addEventListener('ds:close', (event) => window.reasons.push(`new:${event.detail.reason}`));
  });
  const alias = page.locator('#alias');
  await page.locator('#by-id').click();
  await expect(alias).toHaveAttribute('data-state', 'open');
  await page.locator('#old-name').click();
  await settle(page);
  await expect(alias).toBeHidden();
  await expect(page.locator('#by-id')).toBeFocused();
  expect(await page.evaluate(() => window.reasons), 'both names of the event, the same reason').toEqual(['old:close', 'new:close']);
  await page.evaluate(() => DS.overlay.open(document.getElementById('alias'), { opener: document.getElementById('by-id') }));
  await page.evaluate(() => document.getElementById('outside').click());
  await settle(page);
  await expect(alias).toBeHidden();
  const sized = page.locator('[data-demo="sizes"] .ds-btn').first();
  await sized.click();
  const shown = page.locator('dialog[open]');
  await expect(shown.locator('.ds-dialog__box')).toBeVisible();
  await settle(page);
  await shown.locator('.ds-dialog__actions [data-ds-close]').first().click();
  await settle(page);
  await expect(sized).toBeFocused();
});

test('a closer with a value closes only the overlay it names, also from inside another one', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  const state = await page.evaluate(async () => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `
      <dialog class="ds-sheet" id="host-sheet" aria-label="Sheet">
        <div class="ds-sheet__backdrop" data-ds-close></div>
        <section class="ds-sheet__panel">
          <button class="ds-btn" type="button" id="names-other" data-ds-close="#other-dialog">Close the other</button>
          <button class="ds-btn" type="button" id="names-self" data-ds-close="#host-sheet">Close this</button>
          <button class="ds-btn" type="button" id="plain-closer" data-ds-close>Close</button>
        </section>
      </dialog>
      <div class="ds-dialog" id="other-dialog" hidden><div class="ds-dialog__backdrop"></div><div class="ds-dialog__box" role="dialog" aria-modal="true" aria-label="Other"><p>Other</p></div></div>`);
    const sheet = document.getElementById('host-sheet');
    const other = document.getElementById('other-dialog');
    const shown = (element) => element.getAttribute('data-state') === 'open';
    const out = {};
    await DS.overlay.open(sheet);
    await DS.overlay.open(other);
    document.getElementById('names-other').click();
    out.named = { sheet: shown(sheet), other: shown(other) };
    await DS.motion.settled(other.querySelector('.ds-dialog__box'));
    document.getElementById('names-other').click();
    out.notOpen = { sheet: shown(sheet) };
    document.getElementById('names-self').click();
    out.self = { sheet: shown(sheet) };
    await DS.motion.settled(sheet.querySelector('.ds-sheet__panel'));
    await DS.overlay.open(sheet);
    document.getElementById('plain-closer').click();
    out.plain = { sheet: shown(sheet) };
    return out;
  });
  expect(state).toEqual({
    named: { sheet: true, other: false },
    notOpen: { sheet: true },
    self: { sheet: false },
    plain: { sheet: false },
  });
});

test('the keyboard: focus moves in, Tab stays inside, Escape closes and focus is back on the opener; the arrows move through an action sheet', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  const trigger = page.locator('[data-demo="sizes"] .ds-btn').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const shown = page.locator('dialog[open]');
  await expect(shown).toBeVisible();
  const inside = () => page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]')));
  expect(await inside()).toBe(true);
  for (let tabs = 0; tabs < 4; tabs += 1) {
    await page.keyboard.press('Tab');
    // A native dialog may hand the tab to the browser's own chrome between its two ends; it comes back inside.
    const active = await page.evaluate(() => (document.activeElement === document.body ? 'body' : document.activeElement?.closest('dialog[open]') ? 'inside' : 'page'));
    expect(active).not.toBe('page');
  }
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(trigger).toBeFocused();

  await page.getByRole('button', { name: 'Action sheet' }).click();
  await settle(page);
  const sheet = page.locator('dialog.ds-dialog--bottom');
  await sheet.locator('.ds-menu__item').first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(sheet.locator('.ds-menu__item').nth(1)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(sheet.locator('.ds-menu__item').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await settle(page);
});

test('names and roles: the native dialog takes its name from the title; a question that destroys is an alertdialog; DS.dialog holds the same functions', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="sizes"] .ds-btn').first().click();
  await expect(page.getByRole('dialog', { name: 'Archive LAPTOP-0042?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await settle(page);
  await page.getByRole('button', { name: 'Delete 3 devices' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Delete 3 devices?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await settle(page);
  const api = await page.evaluate(async () => {
    const asked = DS.dialog.alert({ title: 'Export ready' });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const built = document.querySelector('dialog[role="alertdialog"][open]');
    const out = { role: built.getAttribute('role'), control: DS.dialog.create(built).get() };
    await DS.dialog.close(built);
    await asked;
    return out;
  });
  expect(api).toEqual({ role: 'alertdialog', control: true });
});

test('forced colours: the box keeps its edge; the error tone becomes a system pair, its label carries the meaning', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await page.getByRole('button', { name: 'Delete 3 devices' }).click();
  await settle(page);
  const styles = await page.evaluate(() => {
    const dialog = document.querySelector('[data-demo="busy"]');
    const box = dialog.querySelector('.ds-dialog__box');
    const button = dialog.querySelector('.ds-tone-error');
    const system = (name) => {
      const probe = document.createElement('i');
      probe.style.forcedColorAdjust = 'none';
      probe.style.color = name;
      dialog.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    return { edge: getComputedStyle(box).borderTopColor, color: getComputedStyle(button).color, background: getComputedStyle(button).backgroundColor, label: button.textContent.trim(), buttonText: system('ButtonText'), buttonFace: system('ButtonFace'), canvas: system('Canvas') };
  });
  expect(styles.edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(styles.label).toContain('Delete 3 devices');
  expect(styles.color, 'the error ink is gone').toBe(styles.buttonText);
  expect([styles.buttonFace, styles.canvas, 'rgba(0, 0, 0, 0)'], 'the error fill is gone').toContain(styles.background);
  await page.keyboard.press('Escape');
});
