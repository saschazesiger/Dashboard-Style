/**
 * DS.dom.dropzone() and the drop zone (2.0) in real engines: a drag of
 * files over the zone (and over its children) shows data-ds-dragover and
 * the words of the drop state, a drop hands the accepted files on, a page
 * drop target gets the dashed outline, a paste with focus inside takes the
 * clipboard's files, and the zone shows its ring for its hidden input.
 * Chromium and Firefox take a synthetic DragEvent with a DataTransfer;
 * WebKit cannot construct one with files, so there the attribute is driven
 * directly and the CSS is checked. fixtures/helpers-2.html; runs in the
 * `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/helpers-2.html');
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Dispatches drag events carrying files on `selector`; false where the engine builds no DataTransfer with files. */
function drag(page, selector, types, names = []) {
  return page.evaluate(([sel, list, files]) => {
    let transfer;
    try {
      transfer = new DataTransfer();
      for (const name of files) transfer.items.add(new File(['a,b\n1,2'], name, { type: name.endsWith('.csv') ? 'text/csv' : name.endsWith('.png') ? 'image/png' : 'application/octet-stream' }));
    } catch {
      return false;
    }
    if (files.length && !transfer.files.length) return false;
    const target = document.querySelector(sel);
    for (const type of list) target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
    return true;
  }, [selector, types, names]);
}

test('a file drag over the zone and its children shows the drop state; a drop hands on the accepted file', async ({ page, browserName }) => {
  await open(page);
  const zone = page.locator('#zone');
  const supported = await drag(page, '#zone', ['dragenter'], ['devices.csv']);
  test.skip(!supported && browserName !== 'webkit', 'no DataTransfer with files');
  if (!supported) {
    // WebKit: the attribute drives the look.
    await page.evaluate(() => document.getElementById('zone').setAttribute('data-ds-dragover', ''));
  } else {
    await drag(page, '.ds-dropzone__hint', ['dragenter'], ['devices.csv']);
    await drag(page, '#zone', ['dragleave'], ['devices.csv']);
    await expect(zone, 'still over a child').toHaveAttribute('data-ds-dragover', '');
  }
  await settle(page);
  const look = await page.evaluate(() => {
    const element = document.getElementById('zone');
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      accent: getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-accent').trim(),
      shadow: style.boxShadow !== 'none',
      idle: getComputedStyle(element.querySelector('.ds-dropzone__idle')).opacity,
      over: getComputedStyle(element.querySelector('.ds-dropzone__over')).opacity,
    };
  });
  expect(look.shadow).toBe(true);
  expect([look.idle, look.over]).toEqual(['0', '1']);
  if (!supported) return;
  await drag(page, '#zone', ['drop'], ['notes.txt', 'devices.csv', 'room.png']);
  await expect(zone).not.toHaveAttribute('data-ds-dragover', '');
  expect(await page.evaluate(() => window.fxFiles)).toEqual(['zone: devices.csv']);
});

test('a text drag is no file drag: nothing changes', async ({ page }) => {
  await open(page);
  const prevented = await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.setData('text/plain', 'hello');
    const event = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer });
    document.getElementById('zone').dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    document.getElementById('zone').dispatchEvent(event);
    return event.defaultPrevented;
  }).catch(() => null);
  test.skip(prevented === null, 'no DataTransfer');
  expect(prevented).toBe(false);
  await expect(page.locator('#zone')).not.toHaveAttribute('data-ds-dragover', '');
});

test('a page drop target gets the dashed outline and takes several files', async ({ page }) => {
  await open(page);
  const supported = await drag(page, '#pane-child', ['dragenter'], ['a.csv', 'b.csv']);
  test.skip(!supported, 'no DataTransfer with files');
  await expect(page.locator('#pane')).toHaveAttribute('data-ds-dragover', '');
  const outline = await page.evaluate(() => getComputedStyle(document.getElementById('pane')).outlineStyle);
  expect(outline).toBe('dashed');
  await drag(page, '#pane', ['drop'], ['a.csv', 'b.csv']);
  expect(await page.evaluate(() => window.fxFiles)).toEqual(['pane: a.csv, b.csv']);
});

test('a paste with focus in the zone takes the clipboard\'s file; the zone rings for its hidden input', async ({ page }) => {
  await open(page);
  await page.locator('#zone-input').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const ring = await page.evaluate(() => getComputedStyle(document.getElementById('zone')).outlineStyle);
  expect(ring).toBe('solid');
  const pasted = await page.evaluate(() => {
    try {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['x'], 'shot.png', { type: 'image/png' }));
      if (!transfer.files.length) return false;
      const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer });
      if (!event.clipboardData?.files.length) return false;
      document.getElementById('zone-input').dispatchEvent(event);
      return true;
    } catch {
      return false;
    }
  });
  test.skip(!pasted, 'no ClipboardEvent with files');
  expect(await page.evaluate(() => window.fxFiles)).toEqual(['zone: shot.png']);
});
