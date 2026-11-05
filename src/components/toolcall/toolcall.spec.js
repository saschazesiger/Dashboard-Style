/**
 * The tool call on its demo page: every status with its mark and word, the
 * duration (milliseconds, seconds, ticking while it runs, stopping at the
 * end), set() swapping the mark and the word and announcing the end once,
 * the attributes read again, the keyboard (the summary opens, the code
 * scrolls), the names, the nested rail, size, density, shape, touch, the
 * narrow row, and forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=toolcall';

async function open(page) {
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
}

const LIST = '[data-demo="list"]';
const row = (page, status) => page.locator(`${LIST} > .ds-toolcall[data-status="${status}"]`);

test('every status shows a mark and a word, never colour alone; the durations read as they should', async ({ page }) => {
  await open(page);
  const look = await page.$$eval(`${LIST} > .ds-toolcall`, (rows) => rows.map((el) => ({
    status: el.dataset.status,
    word: el.querySelector('.ds-toolcall__word').textContent,
    mark: el.querySelector('.ds-toolcall__mark svg, .ds-toolcall__mark .ds-spinner') !== null,
    hidden: el.querySelector('.ds-toolcall__mark').getAttribute('aria-hidden'),
    time: el.querySelector('.ds-toolcall__time').textContent,
    colour: getComputedStyle(el.querySelector('.ds-toolcall__status')).color,
    markColour: getComputedStyle(el.querySelector('.ds-toolcall__mark')).color,
  })));
  expect(look.map((entry) => [entry.status, entry.word, entry.mark, entry.hidden])).toEqual([
    ['done', 'Done', true, 'true'],
    ['running', 'Running', true, 'true'],
    ['failed', 'Failed', true, 'true'],
    ['pending', 'Needs approval', true, 'true'],
    ['cancelled', 'Cancelled', true, 'true'],
  ]);
  expect(look[0].time).toBe('1s');
  await expect(page.locator('[data-demo="running"] .ds-toolcall__time')).toHaveText(/^\d+s$/);
  expect(look[2].time).toBe('30s');
  expect(look[3].time).toBe('');
  expect(look[4].time).toBe('420ms');
  const colour = (token) => page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
  expect(look[0].markColour).toBe(await colour('--ds-success'));
  expect(look[2].colour).toBe(await colour('--ds-error'));
  await expect(row(page, 'done').locator('.ds-toolcall__time')).toHaveAttribute('datetime', 'PT1S');
});

test('a running call ticks, and set() ends it: the mark, the word, the time stop, one announcement, ds:change', async ({ page }) => {
  await open(page);
  const running = page.locator('[data-demo="running"]');
  const time = running.locator('.ds-toolcall__time');
  const first = await time.textContent();
  await expect(time).not.toHaveText(first, { timeout: 2500 });
  await page.evaluate(() => {
    window.changes = [];
    window.spoken = [];
    document.querySelector('[data-demo="running"]').addEventListener('ds:change', (event) => window.changes.push(event.detail.status));
    new MutationObserver(() => {
      for (const node of document.querySelectorAll('.ds-sr[aria-live]')) if (node.textContent.trim()) window.spoken.push(node.textContent.trim());
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await page.locator('[data-demo="finish"]').click();
  await expect(running).toHaveAttribute('data-status', 'done');
  await expect(running.locator('.ds-toolcall__word')).toHaveText('Done');
  await expect(running.locator('.ds-toolcall__mark svg')).toHaveCount(1);
  await expect(running.locator('.ds-toolcall__mark .ds-spinner')).toHaveCount(0);
  const stopped = await time.textContent();
  await page.waitForTimeout(1300);
  await expect(time).toHaveText(stopped);
  expect(await page.evaluate(() => window.changes)).toEqual(['done']);
  // The end is spoken once, through the announcer of the snackbar region.
  await expect.poll(() => page.evaluate(() => [...new Set(window.spoken)])).toEqual(['search_tickets: Done']);

  await page.locator('[data-demo="restart"]').click();
  await expect(running).toHaveAttribute('data-status', 'running');
  await expect(running.locator('.ds-toolcall__mark .ds-spinner')).toHaveCount(1);
  await expect(running.locator('.ds-toolcall__word')).toHaveText('Running');
});

test('the attributes are read again: a page that re-renders writes the status and the duration', async ({ page }) => {
  await open(page);
  const cancelled = row(page, 'cancelled');
  await cancelled.evaluate((el) => {
    el.setAttribute('data-status', 'running');
    el.setAttribute('data-ds-toolcall-since', String(Date.now() - 5000));
    el.removeAttribute('data-ds-toolcall-duration');
  });
  await expect(page.locator('[data-demo="list"] > .ds-toolcall').nth(4).locator('.ds-toolcall__time')).toHaveText(/^[5-7]s$/);
  await page.locator('[data-demo="list"] > .ds-toolcall').nth(4).evaluate((el) => el.setAttribute('data-ds-toolcall-duration', '64000'));
  await expect(page.locator('[data-demo="list"] > .ds-toolcall').nth(4).locator('.ds-toolcall__time')).toHaveText('1m 4s');
});

test('keyboard: Tab reaches each summary, Enter and Space open it, its code takes focus to scroll; the name is the summary\'s text', async ({ page }) => {
  await open(page);
  const done = row(page, 'done');
  await done.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(done).toHaveJSProperty('open', true);
  await page.keyboard.press('Tab');
  await expect(done.locator('.ds-toolcall__code').first()).toBeFocused();
  await page.keyboard.press('Tab');
  const output = done.locator('.ds-toolcall__code').nth(1);
  await expect(output).toBeFocused();
  await expect(output).toHaveAccessibleName('Output');
  await done.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(done).toHaveJSProperty('open', false);
  await settle(page);
  await page.keyboard.press('Tab');
  await expect(row(page, 'running').locator('summary')).toBeFocused();
  const name = await done.locator('summary').evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim());
  expect(name).toBe('run_tests npm test -- devices Done 1s');
  // The focus ring is inset, solid.
  const ring = await row(page, 'running').locator('summary').evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(ring).toBe('solid');
});

test('nested calls sit on a rail without a frame of their own', async ({ page }) => {
  await open(page);
  const look = await page.locator('.ds-toolcall__calls').evaluate((calls) => {
    const child = calls.querySelector('.ds-toolcall');
    return {
      rail: getComputedStyle(calls).borderInlineStartWidth,
      frame: getComputedStyle(child).borderTopWidth,
      rows: calls.querySelectorAll(':scope > .ds-toolcall').length,
      failed: calls.querySelector('.ds-toolcall__part--error .ds-toolcall__label').textContent,
    };
  });
  expect(look).toEqual({ rail: '2px', frame: '0px', rows: 3, failed: 'Error' });
});

test('options: size and density step the summary, touch wins, shape scales the frame', async ({ page }) => {
  await open(page);
  const read = () => row(page, 'done').evaluate((el) => ({
    height: el.querySelector('summary').getBoundingClientRect().height,
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
  }));
  expect(await read()).toEqual({ height: 40, radius: 12 });
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-sm'));
  expect((await read()).height).toBe(32);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-density-compact'));
  expect((await read()).height).toBe(28);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-touch'));
  expect((await read()).height).toBe(48);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-shape-square'));
  expect((await read()).radius).toBe(0);
});

test('a narrow row lets the time go and cuts its arguments', async ({ page }) => {
  await open(page);
  const narrow = await page.locator('[style*="max-inline-size: 300px"] .ds-toolcall').evaluate((el) => ({
    time: getComputedStyle(el.querySelector('.ds-toolcall__time')).display,
    args: getComputedStyle(el.querySelector('.ds-toolcall__args')).display,
    width: el.getBoundingClientRect().width,
    overflow: el.querySelector('summary').scrollWidth <= el.querySelector('summary').clientWidth + 1,
  }));
  expect(narrow.time).toBe('none');
  expect(narrow.args).not.toBe('none');
  expect(narrow.width).toBeLessThanOrEqual(300);
  expect(narrow.overflow).toBe(true);
});

test('forced colours: the frame and the code keep their edges, the marks take CanvasText, the words stay', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await row(page, 'done').evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    el.append(probe);
    const canvasText = getComputedStyle(probe).color;
    probe.remove();
    return {
      frame: getComputedStyle(el).borderTopStyle,
      mark: getComputedStyle(el.querySelector('.ds-toolcall__mark')).color === canvasText,
      word: el.querySelector('.ds-toolcall__word').textContent,
    };
  });
  expect(look).toEqual({ frame: 'solid', mark: true, word: 'Done' });
});
