/**
 * The page patterns (src/patterns/, docs/patterns.md "Page patterns") in
 * every engine: each page loads without a console error or warning, has one
 * h1 and its content in landmarks, names every control, never scrolls
 * sideways at 360px, follows the dark scheme, and looks as its screenshots
 * at 1280 and 390px. The interactive ones are walked with the keyboard: a
 * failed and a good sign-in, a one-time code, the public form's error
 * summary, the wizard's steps and its way out, the onboarding dialog; and
 * the pages of part 3: billing, the invoice on paper, pricing, webhooks,
 * the status page, the changelog, notification settings, files, inbox,
 * chat, the calendar and the kanban board. Then
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
