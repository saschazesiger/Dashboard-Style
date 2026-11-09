/**
 * The page patterns (src/patterns/, docs/patterns.md "Page patterns") in
 * every engine: each page loads without a console error or warning, has one
 * h1 and its content in landmarks, names every control, never scrolls
 * sideways at 360px, follows the dark scheme, and looks as its screenshots
 * at 1280 and 390px. The interactive ones are walked with the keyboard: a
 * failed and a good sign-in, a one-time code, the public form's error
 * summary, the wizard's steps and its way out, the onboarding dialog. Then
 * the styleguide's Patterns area: the list loads no frame, a pattern's page
 * loads one, the width switch scales it, "Open alone" opens the page.
 * test/patterns.test.js covers the files themselves.
 */
import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ready, settle } from './helpers/motion.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../src/patterns');
const PAGES = readdirSync(DIR).filter((name) => name.endsWith('.html')).map((name) => name.slice(0, -5)).sort();

/** Console errors and warnings, page errors and unhandled rejections of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

async function open(page, name, query = 'scheme=light') {
  await page.goto(`/src/patterns/${name}.html?${query}`);
  await ready(page);
  await settle(page);
}

/**
 * What a reader cannot reach or hear: visible text outside every landmark,
 * and focusable controls without a name (aria-labelledby, aria-label, a
 * label, their text or alt, a title).
 */
function audit(page) {
  return page.evaluate(() => {
    const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const LANDMARKS = 'main, body > header, body > footer, nav, aside, dialog, [role="dialog"], [role="alertdialog"], .ds-toasts, .ds-skip, .ds-topbar, [role="menu"]';
    const outside = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!node.textContent.trim() || !el || el.closest('script, template, [aria-hidden="true"]') || !visible(el)) continue;
      if (!el.closest(LANDMARKS)) outside.push(node.textContent.trim().slice(0, 40));
    }
    const text = (id) => document.getElementById(id)?.textContent.trim() ?? '';
    const nameOf = (el) => {
      if (el.getAttribute('aria-labelledby')) return el.getAttribute('aria-labelledby').split(/\s+/).map(text).join(' ').trim();
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
      if (el.labels && el.labels.length) return [...el.labels].map((label) => label.textContent.trim()).join(' ');
      if (/^(button|a|summary)$/i.test(el.tagName) || el.getAttribute('role')) {
        const own = [...el.querySelectorAll('img[alt]')].map((img) => img.alt).join(' ') + el.textContent;
        if (own.trim()) return own.trim();
      }
      return (el.getAttribute('title') || '').trim();
    };
    const controls = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), [role="radio"], [role="menuitem"]')]
      .filter((el) => visible(el) && !el.closest('[inert], [hidden]'));
    const unnamed = controls.filter((el) => !nameOf(el)).map((el) => el.outerHTML.slice(0, 80));
    return {
      h1: document.querySelectorAll('h1').length,
      main: document.querySelectorAll('main').length,
      outside,
      unnamed,
      controls: controls.length,
    };
  });
}

test.describe('every pattern', () => {
  for (const name of PAGES) {
    test(`${name}: loads clean, one h1, landmarks, every control named, no sideways scroll at 360px, both schemes`, async ({ page }) => {
      const errors = collectErrors(page);
      await open(page, name);
      const found = await audit(page);
      expect(found.h1, 'one h1').toBe(1);
      expect(found.main, 'one main').toBe(1);
      expect(found.outside, 'text outside the landmarks').toEqual([]);
      expect(found.unnamed, 'controls without a name').toEqual([]);
      expect(found.controls).toBeGreaterThan(0);
      // Every glyph drawn: no [data-icon] left empty.
      expect(await page.locator('[data-icon]:not(:has(svg))').count(), 'unfilled glyphs').toBe(0);

      await page.setViewportSize({ width: 360, height: 740 });
      await settle(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'sideways scroll at 360px').toBeLessThanOrEqual(0);

      await open(page, name, 'scheme=dark');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
      expect(await page.locator('[data-pt-scheme]').first().getAttribute('aria-pressed')).toBe('true');
      expect(errors).toEqual([]);
    });

    test(`${name}: screenshots at 1280 and 390px`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await open(page, name);
      await expect(page).toHaveScreenshot(`${name}-1280.png`, { fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-390.png`, { fullPage: true });
    });
  }
});

test.describe('with the keyboard', () => {
  test('sign in: an empty submit shows the error summary, a wrong password the alert, a good one the next page', async ({ page }) => {
    await open(page, 'sign-in');
    const email = page.locator('#email');
    await email.focus();
    await page.keyboard.press('Enter');
    const summary = page.locator('.ds-errorsummary');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(2);
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    await email.fill('ada@example.org');
    await page.locator('#password').fill('short');
    await page.locator('#password').press('Enter');
    const alert = page.locator('.ds-auth__alert [role="alert"]');
    await expect(alert).toBeFocused();
    await expect(page.locator('#password')).toHaveValue('');

    // The reveal is a pressed toggle; Tab moves on from the field to it.
    await page.locator('#password').fill('correct horse battery');
    await page.locator('#password').focus();
    await page.keyboard.press('Tab');
    const reveal = page.getByRole('button', { name: 'Show password' });
    await expect(reveal).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(reveal).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');

    await page.locator('#password').press('Enter');
    await page.waitForURL(/sign-in-code\.html$/);
  });

  test('sign in: a link by email needs the address, then says where it went', async ({ page }) => {
    await open(page, 'sign-in');
    const send = page.getByRole('button', { name: 'Email me a sign-in link' });
    await send.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ds-errorsummary')).toBeFocused();
    await page.locator('#email').fill('ada@example.org');
    await send.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#link-sent')).toBeVisible();
    await expect(page.locator('#link-address')).toHaveText('ada@example.org');
    await expect(page.locator('#title')).toBeFocused();
  });

  test('two-step: a wrong code says so at the field, the recovery code takes over, a good code signs in', async ({ page }) => {
    await open(page, 'sign-in-code');
    const group = page.locator('.ds-otp');
    await group.locator('input').first().focus();
    await page.keyboard.type('000000');
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#code-error')).toContainText('did not work');
    await expect(group).toHaveAttribute('aria-describedby', 'code-error code-hint');

    await page.getByRole('button', { name: 'Use a recovery code' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#recovery')).toBeFocused();
    await page.getByRole('button', { name: 'Use the authenticator app' }).focus();
    await page.keyboard.press('Enter');
    await expect(group.locator('input').first()).toBeFocused();

    // The cells keep the wrong code until the person changes it; typing over them and Enter sends the new one.
    await page.keyboard.type('123456');
    await expect(group).not.toHaveAttribute('aria-invalid', 'true');
    await page.keyboard.press('Enter');
    await page.waitForURL(/onboarding\.html$/);
  });

  test('two-step: six digits in empty cells send the form by themselves (data-ds-otp-submit)', async ({ page }) => {
    await open(page, 'sign-in-code');
    await page.locator('.ds-otp input').first().focus();
    await page.keyboard.type('123456');
    await page.waitForURL(/onboarding\.html$/);
  });

  test('public form: a submit with problems lists them and links each to its field', async ({ page }) => {
    await open(page, 'form');
    await page.getByRole('button', { name: 'Send the report' }).focus();
    await page.keyboard.press('Enter');
    const summary = page.locator('.ds-errorsummary');
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(4);
    await summary.locator('a').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#name')).toBeFocused();
  });

  test('wizard: Next checks the step, the steps move the focus to their title, Close asks before it drops what was typed', async ({ page }) => {
    await open(page, 'wizard');
    const next = page.getByRole('button', { name: 'Next' });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#name')).toBeFocused();
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('#name').fill('LAPTOP-0043');
    await page.locator('#serial').fill('SN-0043');
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#step-owner')).toBeFocused();
    await page.locator('#owner').selectOption('ada');
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#step-policy')).toBeFocused();
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#step-review')).toBeFocused();
    await expect(page.locator('.ds-wizard__summary')).toContainText('LAPTOP-0043');

    // The way out asks first (a destructive confirmation, D10: Cancel takes the focus); Escape keeps editing and gives
    // the focus back to Close.
    const close = page.locator('#close');
    await close.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(close).toBeFocused();

    await page.getByRole('button', { name: 'Add device' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#added-title')).toBeFocused();
    await expect(page.locator('#added-name')).toHaveText('LAPTOP-0043');
  });

  test('onboarding: the invite dialog opens on its field and gives the focus back; the dark-theme button pins the scheme', async ({ page }) => {
    await open(page, 'onboarding');
    const invite = page.getByRole('button', { name: 'Invite people' });
    await invite.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#invite-emails')).toBeFocused();
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(invite).toBeFocused();

    const dark = page.getByRole('button', { name: 'Dark theme' });
    await expect(dark).toHaveAttribute('aria-pressed', 'false');
    await dark.focus();
    await page.keyboard.press('Enter');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'dark');
  });
});

test.describe('the pages of the app, with the keyboard', () => {
  test('dashboard: the range moves with the arrow keys and the charts follow; a panel menu opens and gives the focus back', async ({ page }) => {
    await open(page, 'dashboard');
    await expect(page.locator('#chart-tickets .ds-chart__svg')).toHaveCount(1);
    const seven = page.getByRole('radio', { name: '7 days' });
    await seven.focus();
    await page.keyboard.press('ArrowRight');
    const thirty = page.getByRole('radio', { name: '30 days' });
    await expect(thirty).toBeFocused();
    await expect(thirty).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#panel-tickets [data-range-text]')).toHaveText('Last 30 days');
    await expect(page.locator('#chart-tickets tbody tr')).toHaveCount(30);

    const more = page.getByRole('button', { name: 'Actions for tickets per day' });
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(more).toBeFocused();
  });

  test('dashboard: 90 days fold into 13 weeks, and the charts morph after the click, one task each', async ({ page }) => {
    await open(page, 'dashboard');
    await page.locator('#chart-online').scrollIntoViewIfNeeded();
    await expect(page.locator('#chart-online tbody tr')).toHaveCount(7);
    await expect(page.locator('#chart-tickets tbody tr')).toHaveCount(7);
    // The click's own task only turns the switch: no chart is set in it (load-independent, unlike a time).
    const inClick = await page.evaluate(() => {
      document.querySelector('[data-range="90"]').click();
      return [document.querySelectorAll('#chart-tickets tbody tr').length, document.querySelectorAll('#chart-online tbody tr').length];
    });
    expect(inClick, 'no chart morphs inside the click').toEqual([7, 7]);
    // Then each chart morphs to 13 weekly points, never 90 per series.
    await expect(page.locator('#chart-tickets tbody tr')).toHaveCount(13);
    await expect(page.locator('#chart-online tbody tr')).toHaveCount(13);
  });

  test('dashboard: the alert opens the list filtered to the offline devices', async ({ page }) => {
    await open(page, 'dashboard');
    await page.getByRole('link', { name: 'Review devices' }).click();
    await expect(page).toHaveURL(/list\.html\?d\.view=offline/);
    await ready(page);
    await expect(page.locator('.ds-views__name')).toHaveText('Offline');
    await expect(page.locator('#f-status')).toHaveValue('offline');
    await expect(page.locator('#range')).not.toHaveText(/of 132$/);
    expect(await page.locator('#rows tr').count()).toBe(await page.locator('#rows .ds-status.ds-tone-warning').count());
  });

  test('list: search, sort, select in bulk, a saved view', async ({ page }) => {
    await open(page, 'list');
    await expect(page.locator('#rows tr')).toHaveCount(25);
    await expect(page.locator('#range')).toHaveText('1–25 of 132');

    const search = page.getByRole('searchbox', { name: 'Search devices' });
    await search.fill('grace');
    await expect(page.locator('.ds-filterbar__count')).toContainText(/\d+ devices?/);
    const filtered = await page.locator('#rows tr').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(25);
    await expect(page.locator('.ds-views__edited')).toBeVisible();
    await search.fill('');

    const device = page.locator('th[data-sort="name"]');
    await device.getByRole('button').focus();
    await page.keyboard.press('Enter');
    await expect(device).toHaveAttribute('aria-sort', 'descending');
    const seen = page.locator('th[data-sort="seen"]');
    await seen.getByRole('button').click();
    await expect(seen).toHaveAttribute('aria-sort', 'ascending');
    await expect(device).not.toHaveAttribute('aria-sort');
    await expect(seen.locator('.ds-table__sort-arrow')).toHaveCount(1);

    const first = page.locator('#rows tr').first().getByRole('checkbox');
    await first.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.ds-selection-bar__count')).toHaveText('1 selected');
    await expect(page.locator('#select-all')).toHaveJSProperty('indeterminate', true);
    // Searched out of sight, the selected device is still named in the bar.
    await search.fill('no device has this name');
    await expect(page.locator('.ds-selection-bar__count')).toHaveText('1 selected, 1 not shown');
    await search.fill('');
    await expect(page.locator('.ds-selection-bar__count')).toHaveText('1 selected');
    await page.getByRole('button', { name: 'Clear selection' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#select-all')).toBeFocused();
    await expect(page.locator('.ds-selection-bar')).toHaveCount(0);

    const trigger = page.locator('.ds-views__trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitemradio', { name: 'Offline' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ds-views__name')).toHaveText('Offline');
    await expect(page.locator('#f-status')).toHaveValue('offline');
    await expect(page.locator('#rows .ds-status')).not.toHaveCount(0);
    expect(await page.locator('#rows tr').count()).toBe(await page.locator('#rows .ds-status.ds-tone-warning').count());
  });

  test('record: a section edits in place, refuses a taken name at its field, saves; delete waits for the typed name', async ({ page }) => {
    await open(page, 'record');
    const edit = page.locator('#general .ds-object__edit');
    await edit.focus();
    await page.keyboard.press('Enter');
    const name = page.locator('#f-name');
    await expect(name).toBeFocused();
    await name.fill('LAPTOP-0043');
    await name.press('Enter');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#f-name-error')).toContainText('is taken');
    await expect(name).toBeFocused();
    await name.fill('LAPTOP-0044');
    await name.press('Enter');
    await expect(page.locator('#general [data-field="name"]')).toHaveText('LAPTOP-0044');
    await expect(edit).toBeFocused();
    // The new name reaches the h1, the tab, the history's label and the delete dialog, which then asks for it.
    await expect(page.locator('h1')).toHaveText('LAPTOP-0044');
    await expect(page).toHaveTitle(/^LAPTOP-0044 · /);
    await expect(page.locator('#timeline')).toHaveAttribute('aria-label', 'History of LAPTOP-0044');

    const remove = page.locator('#delete');
    await remove.focus();
    await page.keyboard.press('Enter');
    const confirm = page.locator('.ds-typeconfirm__confirm');
    await expect(page.getByRole('button', { name: 'Cancel' }).last()).toBeFocused();
    await expect(confirm).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#delete-title')).toHaveText('Delete LAPTOP-0044?');
    await page.locator('#delete-name').fill('LAPTOP-0042');
    await expect(confirm).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#delete-name').fill('LAPTOP-0044');
    await expect(confirm).not.toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await expect(remove).toBeFocused();
  });

  test('settings: a change shows the save bar with its count, Discard puts it back, a reserved address is refused at its field', async ({ page }) => {
    await open(page, 'settings');
    const bar = page.getByRole('region', { name: 'Unsaved changes' });
    await expect(bar).toBeHidden();
    await page.locator('#name').fill('Operations');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('1 unsaved change');
    await page.locator('[name="mail-tickets"]').focus();
    await page.keyboard.press('Space');
    await expect(bar).toContainText('2 unsaved changes');
    await bar.getByRole('button', { name: 'Discard' }).click();
    await expect(page.locator('#name')).toHaveValue('Product Operations');
    await expect(bar).toBeHidden();

    await page.locator('#address').fill('admin');
    await bar.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('#address')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#address-error')).toContainText('reserved');
    await page.locator('#address').fill('operations-2');
    await bar.getByRole('button', { name: 'Save changes' }).click();
    await expect(bar).toBeHidden();
    await expect(page.locator('#address')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('profile: a wrong current password is said at the field; a session signs out and leaves the list', async ({ page }) => {
    await open(page, 'profile');
    await page.locator('#current').fill('wrong password');
    await page.locator('#new-password').fill('a long new passphrase');
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.locator('#current')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#current')).toBeFocused();

    const others = page.getByRole('button', { name: 'Sign out everywhere else' });
    await page.getByRole('button', { name: 'Sign out of Safari on a phone' }).click();
    await expect(page.locator('#sessions .ds-list__item')).toHaveCount(2);
    await expect(page.locator('.ds-toasts')).toContainText('Signed out of 1 session.');
    await expect(others).not.toHaveAttribute('aria-disabled', 'true');
    // The last other session, one by one: "everywhere else" has nothing left, says why, and takes the focus.
    const last = page.getByRole('button', { name: 'Sign out of Chrome on a desktop' });
    await last.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#sessions .ds-list__item')).toHaveCount(1);
    await expect(others).toHaveAttribute('aria-disabled', 'true');
    // Its own description, whether or not its tip shows (a shown tip adds itself to it).
    await expect(others).toHaveAccessibleDescription(/^No other sessions are signed in\./);
    await expect(others).toBeFocused();
  });

  test('team: the invitation needs an address, then adds the person; a new role says so with Undo', async ({ page }) => {
    await open(page, 'team');
    const invite = page.getByRole('button', { name: 'Invite people' });
    await invite.focus();
    await page.keyboard.press('Enter');
    const field = page.locator('#invite-emails');
    await expect(field).toBeFocused();
    await page.getByRole('button', { name: 'Send invitations' }).click();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await field.fill('alan.kay@example.org');
    await field.press('Enter');
    await page.getByRole('button', { name: 'Send invitations' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(invite).toBeFocused();
    await expect(page.locator('#members')).toContainText('alan.kay@example.org');

    await page.getByRole('combobox', { name: 'Role of Joan Clarke' }).selectOption('admin');
    await expect(page.locator('.ds-toasts')).toContainText('Joan Clarke is now an administrator.');
  });

  test('permissions: a check counts as a change and saves; a locked cell says why', async ({ page }) => {
    await open(page, 'permissions');
    await expect(page.getByRole('img', { name: /^Owner: Delete devices, always on/ })).toHaveCount(1);
    const box = page.getByRole('checkbox', { name: 'Member: Delete devices' });
    await box.focus();
    await page.keyboard.press('Space');
    const bar = page.getByRole('region', { name: 'Unsaved changes' });
    await expect(bar).toContainText('1 unsaved change');
    await bar.getByRole('button', { name: 'Save permissions' }).click();
    await expect(bar).toBeHidden();
    await expect(box).toBeChecked();
  });

  test('API keys: a new key shows once and Done waits for "stored"; a key in use asks for its name', async ({ page }) => {
    await open(page, 'api-keys');
    await page.getByRole('button', { name: 'Create key' }).click();
    await page.locator('#key-name').fill('Backup script');
    // No access at all is refused in the Access group, with the focus on its first box; the next change clears it.
    const scopes = page.getByRole('group', { name: 'Access' });
    await page.getByRole('checkbox', { name: 'Read devices' }).uncheck();
    await page.getByRole('dialog', { name: 'Create a key' }).getByRole('button', { name: 'Create key' }).click();
    await expect(scopes).toHaveAccessibleDescription('Choose at least one kind of access.');
    await expect(page.getByRole('checkbox', { name: 'Read devices' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('#scope-error')).toBeHidden();
    await page.locator('#key-name').press('Enter');
    const once = page.getByRole('alertdialog', { name: 'Copy your new key' });
    await expect(once).toBeVisible();
    await expect(page.locator('#new-key')).toHaveText(/^pk_[0-9a-f]{48}$/);
    const done = page.getByRole('button', { name: 'Done' });
    await expect(done).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await expect(once).toBeVisible();
    await page.getByText('I have stored the key').click();
    await done.click();
    await expect(once).toBeHidden();
    await expect(page.locator('#keys')).toContainText('Backup script');

    // A key made today was never used, and its question says so.
    await page.getByRole('button', { name: 'Revoke Backup script' }).click();
    const plain = page.getByRole('alertdialog', { name: 'Revoke Backup script?' });
    await expect(plain).toContainText('It has never been used. This cannot be undone.');
    await page.keyboard.press('Escape');
    await expect(plain).toBeHidden();

    await page.getByRole('button', { name: 'Revoke Ticket sync' }).click();
    const revoke = page.locator('.ds-typeconfirm__confirm');
    await expect(revoke).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#revoke-name').fill('Ticket sync');
    await page.locator('#revoke-name').press('Enter');
    await expect(page.locator('#keys')).not.toContainText('Ticket sync');
  });

  test('integrations: the filter narrows the grid; Connect turns a card connected', async ({ page }) => {
    await open(page, 'integrations');
    await expect(page.locator('#grid .ds-card')).toHaveCount(9);
    const all = page.getByRole('radio', { name: 'All' });
    await all.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#grid .ds-card')).toHaveCount(4);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#grid .ds-card')).toHaveCount(5);
    const connect = page.getByRole('button', { name: 'Connect Calendar' });
    await connect.click();
    await expect(page.getByRole('dialog', { name: 'Connect Calendar' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Connect' }).click();
    await expect(page.locator('.ds-toasts')).toContainText('Calendar connected.');
    await page.getByRole('radio', { name: /^All/ }).click();
    await expect(page.locator('[data-ds-key="calendar"] .ds-status')).toContainText('Connected');
  });

  test('audit log: the kinds and the search narrow the log and the count follows', async ({ page }) => {
    await open(page, 'audit-log');
    const count = page.locator('.ds-auditlog__count');
    await expect(count).toHaveText('18 events');
    await page.locator('.ds-chip', { hasText: 'Syncs' }).click();
    await expect(count).toHaveText('3 of 18 events');
    await page.getByRole('searchbox', { name: 'Search the log' }).fill('katherine');
    await expect(count).toHaveText('1 of 18 events');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(count).toHaveText('18 events');
  });

  test('the frame on a phone: the menu opens the modal drawer on the current page and Escape gives the focus back', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, 'team');
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ds-drawer__item[aria-current="page"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
  });
});

test.describe('the styleguide area', () => {
  test('lists every pattern with its need line and loads a preview only on its page, at the chosen width', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/styleguide/index.html#/patterns');
    await ready(page);
    await expect(page.locator('[data-sg-pattern]')).toHaveCount(PAGES.length);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.ds-drawer__item[href="#/patterns"]')).toHaveAttribute('aria-current', 'page');

    await page.locator('[data-sg-pattern="sign-in"] a').click();
    await settle(page);
    const frame = page.locator('#sg-pattern-frame');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', /^\.\.\/src\/patterns\/sign-in\.html\?scheme=/);
    await expect(page.frameLocator('#sg-pattern-frame').locator('h1')).toHaveText('Sign in');
    await expect(page.locator('#sg-pattern-alone')).toHaveAttribute('href', /sign-in\.html/);

    await page.getByRole('radio', { name: 'Phone' }).click();
    expect(await frame.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(390, 0);
    await page.getByRole('radio', { name: 'Desktop' }).click();
    const stage = await page.locator('#sg-pattern-stage').evaluate((el) => el.clientWidth);
    expect(await frame.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(Math.min(1280, stage), 0);
    expect(errors).toEqual([]);
  });
});
