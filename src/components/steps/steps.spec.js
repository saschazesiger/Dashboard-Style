/**
 * Steps on the options model (3.0), on their demo: the mark and the type by
 * size, the shape on marks and segments, density on a column's room; every
 * status (error and optional with their words, never colour alone); the
 * column (the connector from mark to mark, every label kept when narrow); the
 * row folding to the current label; the bar; moving on in place (the mark
 * stays, the check draws); names; forced colours. Runs in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=steps';

async function open(page) {
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const COLUMN = '.ds-steps--vertical';
const ROW = '[aria-label="Every status, in a row"]';

test('size: 4px of mark per step and the size\'s type at the regular weight; the current label alone is heavier', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(() => {
    const out = {};
    for (const size of ['ds-xs', 'ds-sm', 'ds-md', 'ds-lg', 'ds-xl']) {
      const list = document.createElement('ol');
      list.className = `ds-steps ${size}`;
      list.innerHTML = '<li class="ds-steps__step"><span class="ds-steps__mark">1</span><span class="ds-steps__label">One</span></li><li class="ds-steps__step" aria-current="step"><span class="ds-steps__mark">2</span><span class="ds-steps__label">Two</span></li>';
      document.querySelector('#fx-component').append(list);
      const [first, second] = list.querySelectorAll('.ds-steps__step');
      out[size] = { mark: first.querySelector('.ds-steps__mark').getBoundingClientRect().width, font: parseFloat(getComputedStyle(first).fontSize), weight: getComputedStyle(first).fontWeight, current: getComputedStyle(second.querySelector('.ds-steps__label')).fontWeight };
    }
    return out;
  });
  expect(measured).toEqual({
    'ds-xs': { mark: 16, font: 12, weight: '400', current: '500' },
    'ds-sm': { mark: 20, font: 14, weight: '400', current: '500' },
    'ds-md': { mark: 24, font: 14, weight: '400', current: '500' },
    'ds-lg': { mark: 28, font: 16, weight: '400', current: '500' },
    'ds-xl': { mark: 32, font: 16, weight: '400', current: '500' },
  });
});

test('shape: the marks and the segments; density: the room in a column, not the row or the marks', async ({ page }) => {
  await open(page);
  const read = () => page.evaluate(([column]) => ({
    mark: getComputedStyle(document.querySelector(`${column} .ds-steps__mark`)).borderTopLeftRadius,
    segment: parseFloat(getComputedStyle(document.querySelector('.ds-steps--bar .ds-steps__step')).borderTopLeftRadius),
  }), [COLUMN]);
  expect(await read()).toEqual({ mark: '50%', segment: 4 });
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-shape-square'));
  expect(await read()).toEqual({ mark: '0%', segment: 0 });
  await page.$eval('.sg-demo-root', (el) => el.classList.remove('ds-shape-square'));

  const room = () => page.$eval(`${COLUMN} .ds-steps__step`, (el) => parseFloat(getComputedStyle(el).paddingBlockEnd));
  const mark = () => page.$eval(`${COLUMN} .ds-steps__mark`, (el) => el.getBoundingClientRect().width);
  expect(await room()).toBe(20);
  await page.$eval('.sg-demo-root', (el) => el.classList.add('ds-density-dense'));
  expect(await room()).toBe(16);
  expect(await mark()).toBe(24);
});

test('every status: done, error with its icon and word, current, optional with a dashed ring and its word', async ({ page }) => {
  await open(page);
  const colour = (token, property = 'color') => page.evaluate(([name, prop]) => {
    const probe = document.createElement('span');
    probe.style[prop] = `var(${name})`;
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe)[prop];
    probe.remove();
    return value;
  }, [token, property]);
  const step = (status) => page.locator(`${ROW} .ds-steps__step[data-status="${status}"]`);
  const look = (locator) => locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color, border: style.borderTopStyle };
  });

  const error = await look(step('error').locator('.ds-steps__mark'));
  expect(error.background).toBe(await colour('--ds-error', 'backgroundColor'));
  expect(error.color).toBe(await colour('--ds-on-error'));
  await expect(step('error').locator('svg')).toHaveCount(1);
  await expect(step('error').locator('.ds-steps__hint')).toHaveText('Add a phone number');
  expect(await step('error').locator('.ds-steps__hint').evaluate((el) => getComputedStyle(el).color)).toBe(await colour('--ds-error'));

  const optional = await look(step('optional').locator('.ds-steps__mark'));
  expect(optional.border).toBe('dashed');
  await expect(step('optional').locator('.ds-steps__hint')).toHaveText('Optional');

  const done = await look(step('done').locator('.ds-steps__mark'));
  expect(done.background).toBe(await colour('--ds-primary', 'backgroundColor'));
  await expect(step('done').locator('svg')).toHaveCount(1);
  expect(await page.locator(`${ROW} [aria-current="step"] .ds-steps__label`).evaluate((el) => getComputedStyle(el).fontWeight)).toBe('500');
});

test('the column: the mark in its own column, the connector from mark to mark, text beside it, wrapped', async ({ page }) => {
  await open(page);
  const geometry = await page.$eval(COLUMN, (list) => {
    const [done, error] = list.querySelectorAll('.ds-steps__step');
    const mark = done.querySelector('.ds-steps__mark').getBoundingClientRect();
    const next = error.querySelector('.ds-steps__mark').getBoundingClientRect();
    const line = getComputedStyle(done, '::after');
    const hint = error.querySelector('.ds-steps__hint').getBoundingClientRect();
    const label = error.querySelector('.ds-steps__label').getBoundingClientRect();
    const start = done.getBoundingClientRect().top;
    return {
      lineTop: parseFloat(line.top),
      lineBottom: start + parseFloat(line.top) + parseFloat(line.height),
      nextTop: next.top,
      markBottom: mark.bottom - start,
      lineLeft: parseFloat(line.left),
      markCentre: mark.left + mark.width / 2 - done.getBoundingClientRect().left,
      hintUnder: hint.top >= label.bottom - 1,
      hintLeft: hint.left - label.left,
      lastHasLine: getComputedStyle(list.lastElementChild, '::after').content,
      noRowLine: getComputedStyle(error, '::before').content,
    };
  });
  expect(geometry.lineTop).toBe(geometry.markBottom + 4);
  expect(geometry.lineBottom).toBeLessThanOrEqual(geometry.nextTop);
  expect(geometry.lineLeft).toBe(geometry.markCentre);
  expect(geometry.hintUnder).toBe(true);
  expect(geometry.hintLeft).toBe(0);
  expect(geometry.lastHasLine).toBe('none');
  expect(geometry.noRowLine).toBe('none');
  // The connector after a done step is the primary colour.
  const connector = await page.$eval(COLUMN, (list) => getComputedStyle(list.querySelector('[data-status="done"]'), '::after').backgroundColor);
  const primary = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--ds-primary)';
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(connector).toBe(primary);
});

test('narrow content: a row keeps only the current label in sight, a column keeps them all; every word is still read', async ({ page }) => {
  await open(page);
  const seen = (list) => page.evaluate((html) => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-content';
    wrap.style.inlineSize = '400px';
    wrap.innerHTML = html;
    document.querySelector('#fx-component').append(wrap);
    const out = [...wrap.querySelectorAll('.ds-steps__label, .ds-steps__hint')].filter((el) => el.getBoundingClientRect().width > 1).map((el) => el.textContent);
    const all = wrap.textContent;
    wrap.remove();
    return { out, all };
  }, list);
  const row = await page.$eval(ROW, (el) => el.outerHTML);
  const column = await page.$eval(COLUMN, (el) => el.outerHTML);
  const narrowRow = await seen(row);
  expect(narrowRow.out).toEqual(['Problem']);
  expect(narrowRow.all).toContain('Add a phone number');
  expect((await seen(column)).out).toEqual(['Device, done', 'Contact', 'Add a phone number', 'Problem', 'Photos', 'Optional', 'Review']);
});

test('a row with hints: at 620 and 800px of content every label keeps its width, and a hint truncates before the next mark', async ({ page }) => {
  await open(page);
  const html = await page.$eval(ROW, (el) => el.outerHTML);
  for (const width of [620, 800, 1200]) {
    const measured = await page.evaluate(([markup, inline]) => {
      const wrap = document.createElement('div');
      wrap.className = 'ds-content';
      wrap.style.padding = '0';
      wrap.style.inlineSize = `${inline}px`;
      wrap.innerHTML = markup;
      document.querySelector('#fx-component').append(wrap);
      const steps = [...wrap.querySelectorAll('.ds-steps__step')];
      const out = steps.map((step, index) => {
        const label = step.querySelector('.ds-steps__label');
        const hint = step.querySelector('.ds-steps__hint');
        const next = steps[index + 1]?.querySelector('.ds-steps__mark').getBoundingClientRect();
        const end = (hint ?? label).getBoundingClientRect().right;
        return { name: label.textContent, label: label.getBoundingClientRect().width, full: label.scrollWidth, room: next ? next.left - end : 1, inStep: step.getBoundingClientRect().right - end };
      });
      const row = wrap.firstElementChild;
      const overflow = row.scrollWidth - row.clientWidth;
      wrap.remove();
      return { out, overflow };
    }, [html, width]);
    expect(measured.overflow, `${width}: the row fits`).toBeLessThanOrEqual(0);
    for (const step of measured.out) {
      expect(step.label, `${width} ${step.name}: its label keeps its width`).toBeGreaterThanOrEqual(step.full - 1);
      expect(step.room, `${width} ${step.name}: ends before the next mark`).toBeGreaterThan(0);
      expect(step.inStep, `${width} ${step.name}: ends inside its step`).toBeGreaterThanOrEqual(-0.5);
    }
  }
  // The bar holds the same items and keeps its equal segments.
  const segments = await page.$$eval('.ds-steps--bar[aria-label^="Step 3"] .ds-steps__step', (els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  expect(new Set(segments).size).toBe(1);
});

test('the bar: done and current segments fill, an error segment in the error colour; marks and words unseen', async ({ page }) => {
  await open(page);
  const segments = await page.$$eval('[aria-label^="Step 3 of 5"] .ds-steps__step', (els) => els.map((el) => {
    const fill = getComputedStyle(el, '::after');
    return { clip: fill.clipPath, background: fill.backgroundColor, height: el.getBoundingClientRect().height, mark: getComputedStyle(el.querySelector('.ds-steps__mark')).display, hint: el.querySelector('.ds-steps__hint')?.getBoundingClientRect().width ?? 0 };
  }));
  await settle(page);
  expect(segments.map((segment) => segment.height)).toEqual([4, 4, 4, 4, 4]);
  expect(segments.every((segment) => segment.mark === 'none')).toBe(true);
  expect(segments.every((segment) => segment.hint <= 1)).toBe(true);
  expect(segments[1].background).not.toBe(segments[0].background);
  expect(segments[3].clip).toContain('100%');
  expect(segments[0].clip).not.toContain('100%');
});

test('moving on in place: the mark stays, the done status lands, the bar follows', async ({ page }) => {
  await open(page);
  const row = page.locator('[data-demo="row"]');
  const mark = row.locator('.ds-steps__step').nth(1).locator('.ds-steps__mark');
  await mark.evaluate((el) => { window.__mark = el; });
  await page.locator('[data-demo="next"]').click();
  await settle(page);
  expect(await mark.evaluate((el) => el === window.__mark)).toBe(true);
  await expect(row.locator('.ds-steps__step').nth(1)).toHaveAttribute('data-status', 'done');
  await expect(row.locator('.ds-steps__step').nth(2)).toHaveAttribute('aria-current', 'step');
  expect(await mark.evaluate((el) => getComputedStyle(el).strokeDashoffset)).toMatch(/^0(px)?$/);
  await expect(page.locator('[data-demo="bar"]')).toHaveAttribute('aria-label', 'Step 3 of 3');
});

test('names: a labelled list, aria-current on the current step, the words of each status', async ({ page }) => {
  await open(page);
  const list = page.getByRole('list', { name: 'Every status, in a row' });
  await expect(list.getByRole('listitem')).toHaveCount(5);
  await expect(list.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(list.getByRole('listitem').first()).toContainText('Device, done');
  await expect(list.getByRole('listitem').nth(1)).toContainText('Add a phone number');
  // Steps are no tab stops.
  expect(await list.locator('a, button, [tabindex]').count()).toBe(0);
});

test('forced colours: done and current Highlight, an error mark its ring and icon, the column\'s connector CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { highlight: probe('backgroundColor', 'Highlight'), text: probe('color', 'CanvasText') };
  });
  const mark = (selector) => page.locator(`${ROW} ${selector} .ds-steps__mark`).evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderTopColor }));
  expect((await mark('[data-status="done"]')).background).toBe(system.highlight);
  expect((await mark('[aria-current="step"]')).background).toBe(system.highlight);
  expect((await mark('[data-status="error"]')).border).toBe(system.text);
  // A hairline is a background: it keeps its line, the done one in Highlight.
  const connectors = await page.$eval(COLUMN, (list) => [getComputedStyle(list.children[0], '::after').backgroundColor, getComputedStyle(list.children[1], '::after').backgroundColor]);
  expect(connectors).toEqual([system.highlight, system.text]);
  expect(await page.$eval(ROW, (list) => getComputedStyle(list.children[2], '::before').backgroundColor)).toBe(system.text);
  const bar = await page.$$eval('[aria-label^="Step 3 of 5"] .ds-steps__step', (els) => els.map((el) => getComputedStyle(el, '::after').backgroundColor));
  expect(bar[0]).toBe(system.highlight);
  expect(bar[1]).toBe(system.text);
});

test('clickable: a done step\'s button is a tab stop, Enter goes there: aria-current moves to its button, a screen reader hears it, ds:change may stop it', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="clickable"]');
  const buttons = list.getByRole('button');
  await expect(buttons).toHaveCount(3);
  await expect(list.getByRole('button', { name: 'Contact' })).toHaveAttribute('aria-current', 'step');
  // Only the current label takes the label weight.
  const weights = await list.locator('.ds-steps__label').evaluateAll((els) => els.map((el) => getComputedStyle(el).fontWeight));
  expect(weights).toEqual(['400', '400', '500', '400', '400']);
  const device = list.getByRole('button', { name: /^Device/ });
  await device.focus();
  await page.keyboard.press('Enter');
  await expect(device).toHaveAttribute('aria-current', 'step');
  await expect(list.getByRole('button', { name: 'Contact' })).not.toHaveAttribute('aria-current');
  await expect(device).toBeFocused();
  await expect(page.locator('[aria-live]').filter({ hasText: 'Step 1 of 5: Device' })).toHaveCount(1);
  // The current label follows the button that carries aria-current.
  expect(await list.locator('.ds-steps__label').first().evaluate((el) => getComputedStyle(el).fontWeight)).toBe('500');
  // A listener that cancels keeps the step where it is.
  await page.evaluate(() => document.addEventListener('ds:change', (event) => event.preventDefault(), { once: true }));
  await list.getByRole('button', { name: /^Problem/ }).click();
  await expect(device).toHaveAttribute('aria-current', 'step');
  // The controller.
  const moved = await list.evaluate((el) => {
    const steps = DS.get(el, 'steps');
    const seen = [];
    const off = steps.on('change', (detail) => seen.push(detail.index));
    steps.set(2);
    off();
    return { at: steps.get(), seen };
  });
  expect(moved).toEqual({ at: 2, seen: [2] });
});

test('clickable: the state layer reaches past the mark and label without moving them, presses squarer, ripples; touch makes it a finger\'s target', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="clickable"]');
  const plain = await page.locator('[aria-label="Every status, in a row"] .ds-steps__step').first().evaluate((el) => el.getBoundingClientRect().height);
  const link = list.locator('.ds-steps__link').first();
  const geometry = await link.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const mark = el.querySelector('.ds-steps__mark').getBoundingClientRect();
    return { height: box.height, step: el.parentElement.getBoundingClientRect().height, left: mark.left - box.left, radius: parseFloat(getComputedStyle(el, '::before').borderTopLeftRadius) };
  });
  expect(geometry.height).toBe(32);
  expect(geometry.step).toBe(plain);
  expect(geometry.left).toBe(8);
  expect(geometry.radius).toBe(16);
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(link.locator('.ds-press-ripple')).toHaveCount(1);
  await page.mouse.up();
  await list.evaluate((el) => el.classList.add('ds-touch'));
  expect(await link.evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
});

test('the stage path: chevrons 40px high (touch 48), the current filled with the label weight, done with a check, hints read not shown; narrow keeps the current label whole', async ({ page }) => {
  await open(page);
  const path = page.locator('[aria-label="Ticket 1042: stages"]');
  const stages = path.locator('.ds-steps__step');
  const look = await stages.evaluateAll((els) => els.map((el) => ({
    height: el.getBoundingClientRect().height,
    clip: getComputedStyle(el).clipPath.startsWith('polygon'),
    background: getComputedStyle(el).backgroundColor,
    mark: getComputedStyle(el.querySelector('.ds-steps__mark')).display,
    weight: getComputedStyle(el.querySelector('.ds-steps__label')).fontWeight,
  })));
  expect(look.map((entry) => entry.height)).toEqual([40, 40, 40, 40, 40]);
  expect(look.every((entry) => entry.clip)).toBe(true);
  expect(look.map((entry) => entry.mark)).toEqual(['grid', 'grid', 'none', 'none', 'none']);
  expect(look.map((entry) => entry.weight)).toEqual(['400', '400', '500', '400', '400']);
  expect(new Set(look.map((entry) => entry.background)).size).toBe(3);
  // Chevrons nest: each one starts inside the previous one's point.
  const overlaps = await stages.evaluateAll((els) => els.slice(1).map((el, index) => els[index].getBoundingClientRect().right - el.getBoundingClientRect().left));
  for (const overlap of overlaps) expect(overlap).toBeCloseTo(8, 1);
  await path.evaluate((el) => el.classList.add('ds-touch'));
  expect(await stages.first().evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
  await path.evaluate((el) => el.classList.remove('ds-touch'));
  // The error path: its hint word is read, not shown.
  const error = page.locator('[aria-label="Ticket 1044: stages, one needs attention"] [data-status="error"]');
  await expect(error).toContainText('needs attention');

  await page.setViewportSize({ width: 390, height: 900 });
  await settle(page);
  const current = path.locator('[aria-current="step"] .ds-steps__label');
  const whole = await current.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(whole).toBe(true);
  const right = await path.evaluate((el) => el.getBoundingClientRect().right);
  expect(right).toBeLessThanOrEqual(390);
});

test('the stage path\'s links: the current stage\'s button carries aria-current, a passed stage\'s button goes there, the ring lies inside', async ({ page }) => {
  await open(page);
  const path = page.locator('[data-demo="path"]');
  await expect(path.getByRole('button')).toHaveCount(3);
  const triaged = path.getByRole('button', { name: /^Triaged/ });
  await triaged.focus();
  await page.keyboard.press('Space');
  await expect(triaged).toHaveAttribute('aria-current', 'step');
  // The ring snaps inward (outline-offset on --ds-dur-fast) and rests inside the chevron.
  await expect.poll(() => triaged.evaluate((el) => {
    const style = getComputedStyle(el);
    return parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
  })).toBe(0);
});

test('forced colours: the current stage Highlight, the others Canvas with their words', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style.backgroundColor = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el).backgroundColor;
      el.remove();
      return colour;
    };
    return { highlight: probe('Highlight'), canvas: probe('Canvas') };
  });
  const backgrounds = await page.locator('[aria-label="Ticket 1042: stages"] .ds-steps__step').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  expect(backgrounds).toEqual([system.canvas, system.canvas, system.highlight, system.canvas, system.canvas]);
});
