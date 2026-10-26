/**
 * DS.motion.guard() (2.0) in real engines: a blocked action is blocked for
 * every input. Enter in a field does not submit through a busy default
 * button, Space on a busy button and a click on an aria-disabled one never
 * reach the page, a label click on an aria-disabled switch never flips it,
 * a middle click on an aria-disabled link opens nothing; a control under
 * data-ds-guard="off" and a button in an aria-busy region stay usable, and
 * focus and the tooltip of a blocked control stay; DS.ripple.attach()
 * installs it too; Enter and Space on an aria-disabled ARIA-role action
 * (a div with role="button") never reach the page's key handler. Runs in
 * the `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready } from './helpers/motion.js';

async function open(page, { install = true } = {}) {
  await page.goto('/test/browser/fixtures/guard.html');
  await ready(page);
  if (install) await page.evaluate(() => { window.fxGuard = DS.motion.guard(document); });
  await page.evaluate(() => { window.fxSeen.length = 0; });
}

const seen = (page) => page.evaluate(() => window.fxSeen.slice());

test('Enter in a field submits, until the default button is busy (busy() installs the guard)', async ({ page }) => {
  await open(page, { install: false });
  await page.locator('#name').focus();
  await page.keyboard.press('Enter');
  expect(await seen(page)).toContain('submit save');
  await page.evaluate(() => {
    window.fxSeen.length = 0;
    // Work that never ends: the button stays busy.
    DS.motion.busy(document.getElementById('save'), () => new Promise(() => {}));
  });
  await page.locator('#name').focus();
  await page.keyboard.press('Enter');
  await page.locator('#save').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  expect(await seen(page)).toEqual([]);
  // The busy button keeps the focus.
  expect(await page.evaluate(() => document.activeElement.id)).toBe('save');
});

test('a done button is blocked like a busy one', async ({ page }) => {
  await open(page);
  // Slowed tenfold, so the success face (--ds-hold-success) outlasts the key presses on a loaded machine.
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--ds-time-scale', '10');
    DS.motion.busy(document.getElementById('save'), () => 'saved');
  });
  await expect(page.locator('#save')).toHaveClass(/ds-btn--done/);
  await page.locator('#save').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  expect(await seen(page)).toEqual([]);
  await expect(page.locator('#save')).toHaveClass(/ds-btn--done/);
});

test('an aria-disabled button keeps focus and its tooltip, but no click, Enter or Space reaches the page', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.tooltips(document));
  const publish = page.locator('#publish');
  await page.mouse.move(1, 1);
  await publish.hover({ force: true });
  await expect(page.locator('.ds-tooltip[data-state="open"]')).toHaveText('Fill in the serial number first', { timeout: 5000 });
  await publish.click({ force: true });
  await publish.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  expect(await seen(page)).toEqual([]);
  expect(await page.evaluate(() => document.activeElement.id)).toBe('publish');
});

test('a label click on an aria-disabled switch never flips it', async ({ page }) => {
  await open(page);
  await page.locator('#switch .ds-switch__label').click({ force: true });
  await page.locator('#switch .ds-switch__track').click({ force: true });
  await page.locator('#switch-input').focus();
  await page.keyboard.press('Space');
  expect(await page.locator('#switch-input').isChecked()).toBe(false);
  // The label's own click is no action; the click it sends to the input never arrives.
  expect((await seen(page)).filter((entry) => entry !== 'click switch')).toEqual([]);
});

test('a middle click on an aria-disabled link opens nothing and reaches no listener', async ({ page, context }) => {
  await open(page);
  const pages = context.pages().length;
  await page.locator('#link').click({ button: 'middle', force: true });
  await page.locator('#link').click({ force: true });
  await page.waitForTimeout(300);
  expect(await seen(page)).toEqual([]);
  expect(context.pages().length).toBe(pages);
  expect(new URL(page.url()).hash).toBe('');
});

test('data-ds-guard="off", a button in an aria-busy region and a usable button stay usable; destroy() lets go', async ({ page }) => {
  await open(page);
  await page.locator('#explains').click({ force: true });
  await page.locator('#in-region').click();
  await page.locator('#plain').click();
  expect(await seen(page)).toEqual(['click explains', 'click in-region', 'click plain']);
  await page.evaluate(() => { window.fxSeen.length = 0; window.fxGuard.destroy(); });
  await page.locator('#publish').click({ force: true });
  expect(await seen(page)).toEqual(['click publish']);
});

test('DS.ripple.attach() installs the guard, and its destroy() lets go (CT-1)', async ({ page }) => {
  await open(page, { install: false });
  await page.locator('#publish').click({ force: true });
  expect(await seen(page)).toEqual(['click publish']);
  await page.evaluate(() => { window.fxSeen.length = 0; window.fxRipples = DS.ripple.attach(document); });
  await page.locator('#publish').click({ force: true });
  await page.locator('#publish').focus();
  await page.keyboard.press('Enter');
  await page.locator('#plain').click();
  expect(await seen(page)).toEqual(['click plain']);
  await page.evaluate(() => { window.fxSeen.length = 0; window.fxRipples.destroy(); });
  await page.locator('#publish').click({ force: true });
  expect(await seen(page)).toEqual(['click publish']);
});

test('an aria-disabled ARIA-role action: Enter and Space never reach the page\'s key handler; a usable one and the arrows still work', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const theme = document.querySelector('.ds-theme');
    theme.insertAdjacentHTML('beforeend', '<div class="ds-pressable" role="button" tabindex="0" id="custom-off" aria-disabled="true">Archive</div>'
      + '<div class="ds-pressable" role="button" tabindex="0" id="custom-on">Restore</div>');
    // The page's own key handling, as docs/components.md tells it to add for .ds-pressable.
    for (const id of ['custom-off', 'custom-on']) {
      document.getElementById(id).addEventListener('keydown', (event) => window.fxSeen.push(`key ${event.key} ${id}`));
      document.getElementById(id).addEventListener('keyup', (event) => window.fxSeen.push(`keyup ${event.key} ${id}`));
    }
  });
  await page.locator('#custom-off').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => document.activeElement.id), 'the blocked one keeps the focus').toBe('custom-off');
  await page.locator('#custom-on').focus();
  await page.keyboard.press('Enter');
  expect(await seen(page)).toEqual(['key ArrowDown custom-off', 'keyup ArrowDown custom-off', 'key Enter custom-on', 'keyup Enter custom-on']);
});
