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
 * confirmed email and its resend pause, and the request for access. Then
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
