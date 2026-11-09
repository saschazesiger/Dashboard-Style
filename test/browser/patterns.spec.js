/**
 * The page patterns (src/patterns/, docs/patterns.md "Page patterns") in
 * every engine: each page loads without a console error or warning, has one
 * h1 and its content in landmarks, names every control, never scrolls
 * sideways at 360px, follows the dark scheme, and looks as its screenshots
 * at 1280 and 390px, and starts on screen (a card taller than the window
 * grows the page instead of hiding its top). The interactive ones are
 * walked with the keyboard, with no console error on the way: a failed and
 * a good sign-in, a one-time code (wrong, short, good), the public form's
 * error summary, the wizard's steps and its way out, the onboarding dialog,
 * sign-up's answer from the server, the new password's own rule, the reset
 * and its way back, the recovery codes' check, copy and download, the
 * confirmed email and its resend pause, the request for access; and the
 * pages of part 3: billing, the invoice on paper, pricing, webhooks, the
 * status page, the changelog, notification settings, files, inbox, chat,
 * the calendar and the kanban board. Then
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
/** Pages that show today's date: their screenshots run on a fixed day (Date only; timers run as usual). */
const FIXED_DAY = { calendar: new Date('2026-11-08T10:42:00Z') };

/** Console errors and warnings, page errors and unhandled rejections of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

/** What the page's live regions say now (DS.overlay.announce(), the copy button). */
function announced(page) {
  return page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join('\n'));
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

      // The top of the page on screen at scroll 0: a card taller than the window grows the page (.ds-auth), it never
      // centres its top out of reach.
      for (const [width, height] of [[360, 640], [390, 844], [1280, 800]]) {
        await page.setViewportSize({ width, height });
        await settle(page);
        const tops = await page.evaluate(() => {
          window.scrollTo(0, 0);
          return { main: document.querySelector('main').getBoundingClientRect().top, h1: document.querySelector('h1').getBoundingClientRect().top };
        });
        expect(tops.main, `the top of <main> at ${width}x${height}`).toBeGreaterThanOrEqual(0);
        expect(tops.h1, `the top of the h1 at ${width}x${height}`).toBeGreaterThanOrEqual(0);
      }

      await open(page, name, 'scheme=dark');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
      expect(await page.locator('[data-pt-scheme]').first().getAttribute('aria-pressed')).toBe('true');
      expect(errors).toEqual([]);
    });

    test(`${name}: screenshots at 1280 and 390px`, async ({ page }) => {
      if (FIXED_DAY[name]) await page.clock.setFixedTime(FIXED_DAY[name]);
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
    const errors = collectErrors(page);
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
    expect(errors).toEqual([]);
  });

  test('sign in: a link by email needs the address, then says where it went', async ({ page }) => {
    const errors = collectErrors(page);
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
    expect(errors).toEqual([]);
  });

  test('two-step: a wrong code says so at the field, the recovery code takes over, a good code signs in', async ({ page }) => {
    const errors = collectErrors(page);
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
    expect(errors).toEqual([]);
  });

  test('two-step: six digits in empty cells send the form by themselves (data-ds-otp-submit)', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'sign-in-code');
    await page.locator('.ds-otp input').first().focus();
    await page.keyboard.type('123456');
    await page.waitForURL(/onboarding\.html$/);
    expect(errors).toEqual([]);
  });

  test('public form: a submit with problems lists them and links each to its field', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'form');
    // The optional serial number still keeps to its pattern (letters, digits and dashes): a fifth problem.
    await page.locator('#serial').fill('a b!');
    await page.getByRole('button', { name: 'Send the report' }).focus();
    await page.keyboard.press('Enter');
    const summary = page.locator('.ds-errorsummary');
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(5);
    await expect(page.locator('#serial')).toHaveAttribute('aria-invalid', 'true');
    await summary.locator('a').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#name')).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('wizard: Next checks the step, the steps move the focus to their title, Close asks before it drops what was typed', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'wizard');
    const next = page.getByRole('button', { name: 'Next' });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#name')).toBeFocused();
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('#name').fill('LAPTOP-0043');
    await page.locator('#serial').fill('a b!');
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#serial')).toBeFocused();
    await expect(page.locator('#serial')).toHaveAttribute('aria-invalid', 'true');

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
    expect(errors).toEqual([]);
  });

  test('onboarding: the invite dialog opens on its field and gives the focus back; the dark-theme button pins the scheme', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'onboarding');
    const invite = page.getByRole('button', { name: 'Invite people' });
    await invite.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#invite-emails')).toBeFocused();
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(invite).toBeFocused();

    // Sent: the dialog closes, the step turns done (which removes "Invite people"), and the focus moves on to the next
    // open step instead of falling to <main>.
    await invite.focus();
    await page.keyboard.press('Enter');
    await page.locator('#invite-emails').fill('grace@example.org, alan@example.org');
    await page.getByRole('button', { name: 'Send invitations' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#invite')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Add a device' })).toBeFocused();
    await expect(invite).toHaveCount(0);
    await expect(page.locator('[data-ds-key="team"] .ds-status')).toHaveText('Done');
    await expect(page.locator('.ds-progress__label')).toHaveText('3 of 5 done');
    await expect(page.locator('.ds-toast', { hasText: '2 invitations sent.' })).toBeVisible();

    const dark = page.getByRole('button', { name: 'Dark theme' });
    await expect(dark).toHaveAttribute('aria-pressed', 'false');
    await dark.focus();
    await page.keyboard.press('Enter');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-ds-scheme', 'dark');
    expect(errors).toEqual([]);
  });

  test('verify email: a short code says so at the field, the sixth digit confirms, the title takes the focus', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'verify-email');
    const group = page.locator('.ds-otp');
    const cells = group.locator('input:not([type="hidden"])');
    await cells.first().focus();
    await page.keyboard.type('12345');
    await page.keyboard.press('Enter');
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#code-error')).toHaveText('Enter all six digits of the code.');
    await expect(group).toHaveAttribute('aria-describedby', 'code-error code-hint');
    await expect(cells.nth(5)).toBeFocused();
    await expect.poll(() => announced(page)).toContain('Enter all six digits of the code.');

    await page.keyboard.type('6');
    await expect(page.locator('#done')).toBeVisible();
    await expect(page.locator('#form')).toBeHidden();
    await expect(page.locator('#title')).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('verify email: a new code, then a pause the button explains (aria-disabled, still focusable)', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'verify-email');
    const resend = page.getByRole('button', { name: 'Send a new code' });
    await resend.focus();
    await page.keyboard.press('Enter');
    await expect(resend).toHaveAttribute('aria-disabled', 'true');
    await expect(resend).toBeFocused();
    await expect(page.locator('#resend-wait')).toBeVisible();
    await expect(resend).toHaveAttribute('aria-describedby', 'resend-wait');
    await expect.poll(() => announced(page)).toContain('We sent a new code to ada@example.org.');
    // Blocked: another Enter sends nothing (the action guard), so the button never turns busy again.
    await page.keyboard.press('Enter');
    await expect(resend).not.toHaveAttribute('aria-busy', 'true');
    expect(errors).toEqual([]);
  });

  test("sign up: an empty submit lists the problems, the server's answer goes to the email field, a free address goes on", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'sign-up');
    const submit = page.getByRole('button', { name: 'Create account' });
    await submit.focus();
    await page.keyboard.press('Enter');
    const summary = page.locator('.ds-errorsummary');
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(4);

    await page.locator('#name').fill('Ada Lovelace');
    await page.locator('#email').fill('ada@example.com');
    await page.locator('#password').fill('correct horse battery staple');
    await page.locator('#terms').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#terms')).toBeChecked();
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(1);
    await expect(summary.locator('li')).toContainText('exists already');
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    await summary.locator('a').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#email')).toBeFocused();

    await page.locator('#email').fill('ada@example.org');
    await submit.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/verify-email\.html\?email=ada%40example\.org$/);
    expect(errors).toEqual([]);
  });

  test('new password: two different passwords are one problem at the second field; the same ones save', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'new-password');
    await page.locator('#password').fill('correct horse battery staple');
    await page.locator('#confirm').fill('correct horse battery');
    await page.locator('#confirm').press('Enter');
    const summary = page.locator('.ds-errorsummary');
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(1);
    await expect(summary.locator('li')).toContainText('The two passwords are not the same.');
    await expect(page.locator('#confirm')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('#confirm').fill('correct horse battery staple');
    await page.locator('#confirm').press('Enter');
    await expect(page.locator('#done')).toBeVisible();
    await expect(page.locator('#form')).toBeHidden();
    await expect(page.locator('#title')).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('reset password: the address is needed, then the page says where the link went; "Use another email" starts over', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'reset-password');
    const email = page.locator('#email');
    await email.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ds-errorsummary')).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    await email.fill('ada@example.org');
    await email.press('Enter');
    await expect(page.locator('#sent')).toBeVisible();
    await expect(page.locator('#sent-address')).toHaveText('ada@example.org');
    await expect(page.locator('#title')).toBeFocused();

    await page.getByRole('button', { name: 'Use another email' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#form')).toBeVisible();
    await expect(page.locator('#sent')).toBeHidden();
    await expect(email).toHaveValue('');
    await expect(email).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('recovery codes: the check is required; Copy and Download say what they did; then two-step goes on', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'recovery-codes');
    const submit = page.getByRole('button', { name: 'Turn on two-step verification' });
    await submit.focus();
    await page.keyboard.press('Enter');
    const summary = page.locator('.ds-errorsummary');
    await expect(summary).toBeFocused();
    await expect(summary.locator('li')).toHaveCount(1);
    await expect(page.locator('#saved')).toHaveAttribute('aria-invalid', 'true');
    await summary.locator('a').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#saved')).toBeFocused();

    // Copy writes the codes (or, where the clipboard is blocked, selects them and says how): either way it is said.
    await page.getByRole('button', { name: 'Copy' }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => announced(page)).toMatch(/Copied|Copying is blocked/);

    const download = page.getByRole('button', { name: 'Download' });
    await download.focus();
    const file = page.waitForEvent('download');
    await page.keyboard.press('Enter');
    expect((await file).suggestedFilename()).toBe('product-recovery-codes.txt');
    await expect.poll(() => announced(page)).toContain('Downloaded product-recovery-codes.txt.');
    await expect(download).toBeFocused();

    await page.locator('#saved').focus();
    await page.keyboard.press('Space');
    await submit.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/onboarding\.html$/);
    expect(errors).toEqual([]);
  });

  test('no access: the request is busy, then the button says it was sent and stays blocked; a snackbar answers', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, 'error-403');
    const ask = page.locator('#ask');
    await ask.focus();
    await page.keyboard.press('Enter');
    await expect(ask).toHaveAttribute('aria-busy', 'true');
    await expect(ask).toHaveAttribute('aria-disabled', 'true');
    await expect(ask).not.toHaveAttribute('aria-busy', 'true');
    await expect(ask.locator('.ds-btn__face').first()).toHaveText('Access requested', { timeout: 10000 });
    await expect(ask).toBeFocused();
    const toast = page.locator('.ds-toast', { hasText: 'We asked the administrators of your team.' });
    await expect(toast).toHaveCount(1);
    // Blocked: another Enter asks nothing more.
    await page.keyboard.press('Enter');
    await expect(ask).not.toHaveAttribute('aria-busy', 'true');
    await expect(toast).toHaveCount(1);
    expect(errors).toEqual([]);
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

test.describe('with the keyboard, part 3', () => {
  test('billing: the details dialog gives the focus back; cancelling asks first and can be taken back', async ({ page }) => {
    await open(page, 'billing');
    const edit = page.getByRole('button', { name: 'Edit' });
    await edit.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#details-email')).toBeFocused();
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(edit).toBeFocused();

    const cancel = page.locator('#cancel-plan');
    await cancel.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Keep the plan' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Cancel the plan' }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#plan-ending')).toBeVisible();
    await expect(page.locator('#plan-active')).toBeHidden();
    await expect(cancel).toHaveText('Resume plan');
  });

  test('invoice: on paper the bar goes and the printed line comes', async ({ page }) => {
    await open(page, 'invoice');
    await expect(page.locator('#printed')).toBeHidden();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('body > header')).toBeHidden();
    await expect(page.locator('#printed')).toBeVisible();
    await expect(page.locator('tfoot')).toContainText('$216.00');
    // Paper drops backgrounds: the stand-in logo prints its glyph alone, never white on white.
    const mark = await page.locator('.pt-brand__mark').evaluate((el) => {
      const style = getComputedStyle(el);
      const probe = document.createElement('span');
      probe.style.color = 'var(--ds-primary)';
      el.after(probe);
      const primary = getComputedStyle(probe).color;
      probe.remove();
      return { color: style.color, background: style.backgroundColor, primary };
    });
    expect(mark.background).toBe('rgba(0, 0, 0, 0)');
    expect(mark.color).toBe(mark.primary);
  });

  test('pricing: the period switch moves with the arrow keys and changes the prices', async ({ page }) => {
    await open(page, 'pricing');
    await page.getByRole('radio', { name: 'Monthly' }).focus();
    await page.keyboard.press('ArrowRight');
    const yearly = page.getByRole('radio', { name: 'Yearly' });
    await expect(yearly).toBeFocused();
    await page.keyboard.press('Space');
    await expect(yearly).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.ds-card:has(#plan-team) .pt-price')).toContainText('$10');
  });

  test('webhooks: the failed filter, a delivery in the side sheet, a resend that leads the log', async ({ page }) => {
    await open(page, 'webhooks');
    const rows = page.locator('#log tr');
    const all = await rows.count();
    await page.getByRole('radio', { name: 'Failed' }).focus();
    await page.keyboard.press('Space');
    await expect(rows).not.toHaveCount(all);
    await expect(rows.locator('.ds-tone-success')).toHaveCount(0);

    const first = rows.first().locator('[data-delivery]');
    await first.focus();
    await page.keyboard.press('Enter');
    const sheet = page.locator('#delivery');
    await expect(sheet).toBeVisible();
    await expect(page.locator('#request code')).toContainText('"type"');
    await page.locator('#resend').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#fact-result')).toContainText('200 OK');
    // The resend came from the Failed view: the log goes back to All, the new delivery first.
    await expect(page.getByRole('radio', { name: 'All' })).toBeChecked();
    await expect(rows).toHaveCount(all + 1);
    await expect(rows.first()).toContainText('200 OK');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('status page: five trackers of 90 cells, each one tab stop that the arrows walk', async ({ page }) => {
    await open(page, 'status-page');
    await expect(page.locator('.ds-tracker')).toHaveCount(5);
    const row = page.locator('.ds-tracker__cells').first();
    await expect(row.locator('.ds-tracker__cell')).toHaveCount(90);
    await expect(row.locator('[tabindex="0"]')).toHaveCount(1);
    await row.locator('[tabindex="0"]').focus();
    await page.keyboard.press('Home');
    await expect(row.locator('.ds-tracker__cell').first()).toBeFocused();
  });

  test('changelog: a kind that is off hides its items, and a release left empty says so', async ({ page }) => {
    await open(page, 'changelog');
    for (const kind of ['Improved', 'Fixed']) {
      await page.getByRole('checkbox', { name: kind }).focus();
      await page.keyboard.press('Space');
    }
    await expect(page.locator('[data-kind="fixed"]:visible')).toHaveCount(0);
    await expect(page.locator('#v4-4 [data-empty]')).toBeVisible();
    await expect(page.locator('#v4-6 [data-empty]')).toBeHidden();
  });

  test('notification settings: a change shows the save bar, an email that is off blocks its column', async ({ page }) => {
    await open(page, 'notification-settings');
    const bar = page.locator('.ds-savebar__bar');
    await expect(bar).toBeHidden();
    await page.locator('input[name="mention-email"]').focus();
    await page.keyboard.press('Space');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('1 unsaved change');
    await expect(page.locator('input[name="payment-email"]')).toHaveAttribute('aria-disabled', 'true');

    await page.locator('input[name="channel-email"]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('input[name="offline-email"]')).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'Discard' }).focus();
    await page.keyboard.press('Enter');
    await expect(bar).toBeHidden();
    await expect(page.locator('input[name="offline-email"]')).toHaveAttribute('aria-disabled', 'false');
  });

  test('files: search, the list view, a selection with its bar, delete with Undo, the preview beside the list', async ({ page }) => {
    await open(page, 'files');
    await page.locator('#q').fill('pdf');
    await expect(page.locator('#grid .ds-media')).toHaveCount(2);
    await page.locator('#q').fill('');
    await expect(page.locator('#grid .ds-media')).toHaveCount(12);

    await page.getByRole('radio', { name: 'Grid' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(page.locator('#list-card')).toBeVisible();
    await expect(page.locator('#grid')).toBeHidden();

    await page.getByRole('checkbox', { name: 'Select Old photos.zip' }).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#selection-bar')).toBeVisible();
    await expect(page.locator('#selected-count')).toHaveText('1 selected');
    await page.locator('#delete-selected').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#rows tr')).toHaveCount(11);
    await expect(page.locator('#select-all')).toBeFocused();
    await page.locator('.ds-toasts').getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('#rows tr')).toHaveCount(12);

    const file = page.locator('#rows [data-open="f6"]');
    await file.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#preview-title')).toHaveText('Delivery note 1042.pdf');
    await expect(file).toBeFocused();
  });

  test('inbox: a message opens beside the list on a desktop, archive hands the focus to the next row, a phone shows it alone with a back button', async ({ page }) => {
    await open(page, 'inbox');
    const row = page.locator('[href="#m7"]');
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#message-title')).toHaveText('Ticket #1042 is waiting for you');
    await expect(row).toBeFocused();
    await expect(row).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'Archive' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[href="#m7"]')).toHaveCount(0);
    await expect(page.locator('[href="#m6"]')).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, 'inbox');
    await page.locator('[href="#m6"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#message-title')).toBeFocused();
    await expect(page.locator('.ds-listdetail__list')).toBeHidden();
    await page.getByRole('button', { name: 'Back to the inbox' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[href="#m6"]')).toBeFocused();
  });

  test('chat: Enter sends, the message joins the transcript and a reply follows', async ({ page }) => {
    await open(page, 'chat');
    const messages = page.locator('#log article');
    const before = await messages.count();
    await page.locator('#message-input').focus();
    await page.keyboard.type('On my way');
    await page.keyboard.press('Enter');
    await expect(messages).toHaveCount(before + 1);
    await expect(messages.last()).toContainText('On my way');
    await expect(page.locator('#message-input')).toHaveValue('');
    await expect(messages).toHaveCount(before + 2, { timeout: 5000 });
  });

  test('calendar: the next week, and a new event that lands in the agenda', async ({ page }) => {
    await open(page, 'calendar');
    // The New event dialog's picker waits for the first open: the first paint does not build it.
    await expect(page.locator('#event .ds-picker__popover')).toHaveCount(0);
    const title = page.locator('#week-title');
    const week = await title.textContent();
    await page.getByRole('button', { name: 'Next week' }).focus();
    await page.keyboard.press('Enter');
    await expect(title).not.toHaveText(week);
    await page.getByRole('button', { name: 'Today' }).focus();
    await page.keyboard.press('Enter');
    await expect(title).toHaveText(week);

    await page.getByRole('button', { name: 'New event' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#event-name')).toBeFocused();
    await page.keyboard.type('Inventory count');
    await page.keyboard.press('Enter');
    await expect(page.locator('#agenda')).toContainText('Inventory count');
  });

  test('kanban: a card moves with the keyboard, and a full column is skipped', async ({ page }) => {
    await open(page, 'kanban');
    // A long title gives way: every handle keeps the width of its button.
    const grips = await page.locator('.ds-grip').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(new Set(grips).size, `grip widths ${grips}`).toBe(1);
    const doing = page.locator('[data-zone="doing"] [data-ds-key]');
    await expect(doing).toHaveCount(2);
    await page.getByRole('button', { name: 'Move Order a second dock for the lab' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(doing).toHaveCount(3);
    await expect(page.locator('[data-zone="doing"] .ds-badge')).toContainText('3 of 3');

    await page.getByRole('button', { name: 'Move Label the returned monitors' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(doing).toHaveCount(3);
    await expect(page.locator('[data-zone="review"] [data-ds-key="c3"]')).toHaveCount(1);
  });
});

test.describe('the styleguide area', () => {
  test('lists every pattern with its need line and loads a preview only on its page, at the chosen width', async ({ page }) => {
    // Firefox's hint "Layout was forced before the page was fully loaded" comes from the frame while the styleguide
    // sizes it as it loads; the page alone loads without it (above).
    const all = collectErrors(page);
    const errors = { get list() { return all.filter((text) => !/Layout was forced before the page was fully loaded/.test(text)); } };
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
    expect(errors.list).toEqual([]);
  });
});
