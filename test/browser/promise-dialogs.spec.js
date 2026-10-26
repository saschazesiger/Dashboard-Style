/**
 * DS.overlay.confirm(), alert() and prompt() (2.0) in real engines, on the
 * overlay fixture (a .ds-theme body, a snackbar region added per test,
 * or none: then the error still shows above the dialog):
 * the built dialog's markup and names, the first focus (Cancel when
 * destructive), the answers (confirm, Cancel, Escape, the backdrop), the
 * removal after the exit and focus back on the opener; onConfirm with the
 * busy button, the dialog refusing to close meanwhile, and a failure that
 * keeps it open with the error snackbar and focus on the confirm button;
 * prompt()'s field (input options, Enter, a required empty value with its
 * field error and announcement).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/overlay.html';

async function load(page, { region = true } = {}) {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (!region) return;
  // A snackbar region of the theme, for the error of a failed onConfirm.
  await page.evaluate(() => {
    const region = document.createElement('div');
    region.className = 'ds-toasts';
    region.id = 'toasts';
    document.body.append(region);
  });
}

/** Starts a promise dialog in the page; its answer lands in window.__answer (the string 'pending' until then). */
function ask(page, kind, options = {}) {
  return page.evaluate(([name, opts]) => {
    window.__answer = 'pending';
    const opener = document.getElementById('open-dialog');
    const extra = {};
    if (opts.work === 'ok') extra.onConfirm = () => new Promise((resolve) => { window.__finish = resolve; });
    if (opts.work === 'fail') extra.onConfirm = () => Promise.reject(new Error('HTTP 500 from /api/devices'));
    delete opts.work;
    DS.overlay[name]({ title: 'Delete 3 devices?', text: 'They disappear from every list.', opener, ...opts, ...extra })
      .then((answer) => { window.__answer = answer === undefined ? 'undefined' : answer; });
  }, [kind, options]);
}

/** The open promise dialog: its parts and where focus is. */
const built = (page) => page.evaluate(() => {
  const dialog = document.querySelector('.ds-dialog[data-state="open"]');
  if (!dialog) return null;
  const box = dialog.querySelector('.ds-dialog__box');
  const title = dialog.querySelector('.ds-dialog__title');
  // A button's label: its resting face (the busy face repeats it, hidden).
  const label = (node) => (node.querySelector('.ds-btn__face') ?? node).textContent.trim();
  const text = dialog.querySelector('.ds-dialog__text');
  return {
    tag: dialog.tagName.toLowerCase(),
    role: dialog.getAttribute('role'),
    inTheme: Boolean(dialog.closest('.ds-theme')),
    labelled: dialog.getAttribute('aria-labelledby') === title.id,
    described: text ? dialog.getAttribute('aria-describedby') === text.id : null,
    buttons: [...box.querySelectorAll('.ds-dialog__actions .ds-btn')].map(label),
    backdrop: dialog.querySelector('.ds-dialog__backdrop').hasAttribute('data-close'),
    focus: label(document.activeElement) || document.activeElement.tagName.toLowerCase(),
  };
});

const answer = (page) => page.waitForFunction(() => window.__answer !== 'pending').then(() => page.evaluate(() => window.__answer));

/** Waits until no promise dialog is left in the document. */
const gone = (page) => page.waitForFunction(() => !document.querySelector('.ds-dialog:not(#dialog):not(#native)'));

test.describe('confirm() (2.0)', () => {
  test('builds a named native dialog in the theme; the confirm button answers true, removes it after the exit and gives focus back', async ({ page }) => {
    await load(page);
    await ask(page, 'confirm', { confirmLabel: 'Delete devices' });
    await settle(page);
    expect(await built(page)).toEqual({
      tag: 'dialog', role: null, inTheme: true, labelled: true, described: true,
      buttons: ['Cancel', 'Delete devices'], backdrop: true, focus: 'Delete devices',
    });
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--primary').click();
    expect(await answer(page)).toBe(true);
    await gone(page);
    expect(await page.evaluate(() => document.activeElement.id)).toBe('open-dialog');
  });

  test('destructive: an alertdialog that focuses Cancel; Cancel, Escape and the backdrop answer false', async ({ page }) => {
    await load(page);
    await ask(page, 'confirm', { destructive: true, confirmLabel: 'Delete devices' });
    await settle(page);
    const parts = await built(page);
    expect([parts.role, parts.focus]).toEqual(['alertdialog', 'Cancel']);
    await page.keyboard.press('Enter');
    expect(await answer(page)).toBe(false);
    await gone(page);
    await ask(page, 'confirm', { destructive: true });
    await settle(page);
    await page.keyboard.press('Escape');
    expect(await answer(page)).toBe(false);
    await gone(page);
    await ask(page, 'confirm', {});
    await settle(page);
    await page.waitForTimeout(400);
    await page.mouse.click(4, 4);
    expect(await answer(page)).toBe(false);
    await gone(page);
  });

  test('onConfirm: the button is busy and the dialog refuses to close until the work is done; then it answers true', async ({ page }) => {
    await load(page);
    await ask(page, 'confirm', { work: 'ok', confirmLabel: 'Delete devices' });
    await settle(page);
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--primary').click();
    const during = await page.evaluate(() => {
      const dialog = document.querySelector('.ds-dialog[data-state="open"]');
      return {
        busy: dialog.hasAttribute('data-ds-busy'),
        button: dialog.querySelector('.ds-btn--primary').getAttribute('aria-busy'),
        cancel: dialog.querySelector('.ds-btn--text').getAttribute('aria-disabled'),
      };
    });
    expect(during).toEqual({ busy: true, button: 'true', cancel: 'true' });
    await page.keyboard.press('Escape');
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--text').dispatchEvent('click');
    expect(await page.evaluate(() => window.__answer)).toBe('pending');
    expect(await page.evaluate(() => Boolean(document.querySelector('.ds-dialog[data-state="open"]')))).toBe(true);
    await page.evaluate(() => window.__finish());
    expect(await answer(page)).toBe(true);
    await gone(page);
  });

  test('a failed onConfirm keeps the dialog open with the error snackbar (never the raw error) and focus on the confirm button', async ({ page }) => {
    await load(page);
    await ask(page, 'confirm', { work: 'fail', confirmLabel: 'Delete devices', errorText: 'Could not delete the devices.' });
    await settle(page);
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--primary').click();
    await page.waitForFunction(() => document.querySelector('.ds-toast--error'));
    const after = await page.evaluate(() => {
      const dialog = document.querySelector('.ds-dialog[data-state="open"]');
      return {
        open: Boolean(dialog),
        busy: dialog.hasAttribute('data-ds-busy'),
        cancel: dialog.querySelector('.ds-btn--text').hasAttribute('aria-disabled'),
        toast: document.querySelector('.ds-toast--error .ds-toast__text').textContent,
        toastAbove: dialog.contains(document.querySelector('.ds-toast--error')),
        focus: document.activeElement === dialog.querySelector('.ds-btn--primary'),
        answer: window.__answer,
      };
    });
    expect(after).toEqual({ open: true, busy: false, cancel: false, toast: 'Could not delete the devices.', toastAbove: true, focus: true, answer: 'pending' });
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--text').click();
    expect(await answer(page)).toBe(false);
    await gone(page);
  });

  test('without a region of its theme (an embedded widget\'s comes first), the error snackbar still shows above the dialog', async ({ page }) => {
    await load(page, { region: false });
    await page.evaluate(() => {
      const widget = document.createElement('div');
      widget.className = 'ds-theme';
      widget.innerHTML = '<div class="ds-toasts" id="widget-toasts"></div>';
      document.body.prepend(widget);
    });
    await ask(page, 'confirm', { work: 'fail', confirmLabel: 'Delete devices', errorText: 'Could not delete the devices.' });
    await settle(page);
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--primary').click();
    await page.waitForFunction(() => document.querySelector('.ds-toast--error'));
    await settle(page);
    const after = await page.evaluate(() => {
      const dialog = document.querySelector('.ds-dialog[data-state="open"]');
      const message = document.querySelector('.ds-toast--error');
      const rect = message.getBoundingClientRect();
      return {
        inDialog: dialog.contains(message),
        hit: message.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)),
        widget: document.getElementById('widget-toasts').childElementCount,
        said: [...dialog.querySelectorAll('.ds-sr[aria-live="assertive"]')].map((node) => node.textContent),
      };
    });
    expect(after).toEqual({ inDialog: true, hit: true, widget: 0, said: ['Could not delete the devices.'] });
  });

  test('the default error text is the one of the docs', async ({ page }) => {
    await load(page);
    await ask(page, 'confirm', { work: 'fail' });
    await settle(page);
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--primary').click();
    await page.waitForFunction(() => document.querySelector('.ds-toast--error'));
    expect(await page.evaluate(() => document.querySelector('.ds-toast--error .ds-toast__text').textContent)).toBe('That did not work. Try again.');
  });
});

test.describe('prompt() and alert() (2.0)', () => {
  test('prompt(): a labelled field with the value and the input options; Enter answers the value, Cancel null', async ({ page }) => {
    await load(page);
    await ask(page, 'prompt', { title: 'Rename', text: '', label: 'Name', value: 'LAPTOP-0042', input: { type: 'text', autocomplete: 'off', inputmode: 'text' } });
    await settle(page);
    const field = await page.evaluate(() => {
      const input = document.querySelector('.ds-dialog[data-state="open"] .ds-input');
      return {
        label: document.querySelector(`label[for="${input.id}"]`)?.textContent,
        value: input.value,
        focus: document.activeElement === input,
        type: input.type,
        autocomplete: input.getAttribute('autocomplete'),
        inputmode: input.getAttribute('inputmode'),
      };
    });
    expect(field).toEqual({ label: 'Name', value: 'LAPTOP-0042', focus: true, type: 'text', autocomplete: 'off', inputmode: 'text' });
    await page.keyboard.press('End');
    await page.keyboard.type('-B');
    await page.keyboard.press('Enter');
    expect(await answer(page)).toBe('LAPTOP-0042-B');
    await gone(page);
    await ask(page, 'prompt', { title: 'Rename', label: 'Name' });
    await settle(page);
    await page.locator('.ds-dialog[data-state="open"] .ds-btn--text').click();
    expect(await answer(page)).toBe(null);
    await gone(page);
  });

  test('prompt(): a required field left empty stays open with the field error (icon, text, aria-describedby, announced); typing clears it', async ({ page }) => {
    await load(page, { region: false });
    await ask(page, 'prompt', { title: 'Name the group', label: 'Name', input: { required: true }, requiredText: 'Name the group.' });
    await settle(page);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('.ds-dialog[data-state="open"] .ds-sr[aria-live="assertive"]')?.textContent);
    const read = await page.evaluate(() => {
      const dialog = document.querySelector('.ds-dialog[data-state="open"]');
      const input = dialog.querySelector('.ds-input');
      const hint = document.getElementById(input.getAttribute('aria-describedby'));
      return {
        open: Boolean(dialog),
        invalid: input.getAttribute('aria-invalid'),
        hint: hint ? { error: hint.matches('.ds-field__hint.ds-field__hint--error'), icon: Boolean(hint.querySelector('svg[aria-hidden="true"]')), text: hint.textContent, inField: input.parentElement.contains(hint) } : null,
        said: dialog.querySelector('.ds-sr[aria-live="assertive"]').textContent,
        focus: document.activeElement === input,
        answer: window.__answer,
      };
    });
    expect(read).toEqual({
      open: true, invalid: 'true', hint: { error: true, icon: true, text: 'Name the group.', inField: true },
      said: 'Name the group.', focus: true, answer: 'pending',
    });
    await page.keyboard.type('L');
    expect(await page.evaluate(() => {
      const input = document.querySelector('.ds-dialog[data-state="open"] .ds-input');
      return { invalid: input.hasAttribute('aria-invalid'), described: input.hasAttribute('aria-describedby'), hint: Boolean(input.parentElement.querySelector('.ds-field__hint')) };
    })).toEqual({ invalid: false, described: false, hint: false });
    await page.keyboard.type('ab');
    await page.keyboard.press('Enter');
    expect(await answer(page)).toBe('Lab');
  });

  test('alert(): an alertdialog with one button that resolves once it closes', async ({ page }) => {
    await load(page);
    await ask(page, 'alert', { title: 'Export ready', text: 'The file is in your downloads.', closeLabel: 'Got it' });
    await settle(page);
    const parts = await built(page);
    expect([parts.role, parts.buttons, parts.focus]).toEqual(['alertdialog', ['Got it'], 'Got it']);
    await page.keyboard.press('Enter');
    expect(await answer(page)).toBe('undefined');
    await gone(page);
    expect(await page.evaluate(() => document.activeElement.id)).toBe('open-dialog');
  });
});
