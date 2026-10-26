/**
 * The record parts of 2.0 in real engines (fixtures/lists.html): the row
 * list (the stretched action, the state layer, the inset ring, the blocked
 * row, the current row, the ripple over the row, rows that glide and fade
 * in, trailing parts that wrap), key-value rows that open (their text in
 * line with static rows, the ring that snaps in, the blocked model, the
 * kv fixes, bars), facts in rows with the lock, the disclosure (the pill
 * that morphs, rectangular accordion rows to the card's edges, one open at
 * a time where details[name] exists) and the task list (the tick that
 * draws when a step turns done). The timeline has a spec of its own
 * (timeline.spec.js).
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/lists.html';

/** Loads the fixture (optionally with DS.ripple attached) and lets its load-time motion end. */
async function open(page, { attach = false } = {}) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** A token of the theme as the engine computes it (a number for the state tokens). */
const token = (page, name) => page.evaluate((n) => getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue(n).trim(), name);

/** The opacity of an element's ::before (its state layer) right now. */
const layer = (locator) => locator.evaluate((el) => Number(getComputedStyle(el, '::before').opacity));

/**
 * Moves the mouse to the centre of an element inside a row. The row's
 * action stretches over the whole row, so the pointer lands on it, as for a
 * user; Playwright's own hover() would wait for the element to be the
 * target.
 */
async function pointAt(page, locator) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

/** A row of #rows by its key. */
const row = (page, key) => page.locator(`#rows > .ds-list__item[data-ds-key="${key}"]`);

test.describe('row list', () => {
  test('a row opens its record from anywhere on it; its own button stays a control of its own', async ({ page }) => {
    await open(page);
    await pointAt(page, row(page, 'd42').locator('.ds-list__meta'));
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('#opened')).toHaveText('LAPTOP-0042');
    await page.evaluate(() => { document.getElementById('opened').textContent = 'none'; });
    await row(page, 'd42').getByRole('button', { name: 'More for LAPTOP-0042' }).click();
    await expect(page.locator('#more')).toHaveText('More for LAPTOP-0042');
    await expect(page.locator('#opened')).toHaveText('none');
  });

  test('hover and press lay the state layer over the row; keyboard focus rings it inside, at once; no morph', async ({ page }) => {
    await open(page);
    const target = row(page, 'd42');
    const radius = await target.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
    await pointAt(page, target.locator('.ds-list__meta'));
    await settle(page);
    expect(await layer(target)).toBeCloseTo(Number(await token(page, '--ds-state-hover-lg')), 3);
    await page.mouse.down();
    await settle(page);
    expect(await layer(target)).toBeCloseTo(Number(await token(page, '--ds-state-pressed')), 3);
    // Rows never morph: the first row keeps its outer corner while pressed.
    expect(await target.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe(radius);
    await page.mouse.up();
    await page.mouse.move(1, 1);
    await settle(page);
    const second = row(page, 'p03');
    await focusByKeyboard(page, second.locator('.ds-list__action'));
    // The focus layer and the ring come at once (the ring's offset snaps, its colour and width never animate).
    expect(await layer(second)).toBeCloseTo(Number(await token(page, '--ds-state-focus')), 3);
    const ring = await second.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
    expect(ring).toEqual({ style: 'solid', width: '2px' });
    await settle(page);
    expect(await second.evaluate((el) => getComputedStyle(el).outlineOffset)).toBe('-2px');
    // The action itself draws no ring of its own.
    expect(await second.locator('.ds-list__action').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
  });

  test('a blocked row shows no hover or press layer and takes not-allowed; it keeps its focus layer', async ({ page }) => {
    await open(page);
    const blocked = row(page, 'm09');
    await pointAt(page, blocked.locator('.ds-list__meta'));
    await settle(page);
    expect(await layer(blocked)).toBe(0);
    expect(await blocked.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
    await page.mouse.down();
    await settle(page);
    expect(await layer(blocked)).toBe(0);
    await page.mouse.up();
    await page.mouse.move(1, 1);
    await focusByKeyboard(page, blocked.locator('.ds-list__action'));
    await settle(page);
    expect(await layer(blocked)).toBeCloseTo(Number(await token(page, '--ds-state-focus')), 3);
  });

  test('the current row takes the tint (aria-current on its action), and SelectedItem in forced colours', async ({ page, browserName }) => {
    await open(page);
    const current = row(page, 'd17');
    const tint = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--ds-accent)';
      document.querySelector('.ds-theme').append(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    expect(await current.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(tint);
    expect(await row(page, 'd42').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
    await page.emulateMedia({ forcedColors: 'active' });
    await settle(page);
    const selected = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'forced-color-adjust: none; background-color: SelectedItem; color: SelectedItemText';
      document.body.append(probe);
      const colours = [getComputedStyle(probe).backgroundColor, getComputedStyle(probe).color];
      probe.remove();
      return colours;
    });
    expect(await current.evaluate((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color])).toEqual(selected);
  });

  test('a press ripples the whole row from the pointer; a press on its button ripples only the button', async ({ page }) => {
    await open(page, { attach: true });
    const target = row(page, 'd42');
    const box = await target.locator('.ds-list__meta').boundingBox();
    await page.mouse.move(box.x + 10, box.y + 5);
    await page.mouse.down();
    expect(await target.evaluate((el) => el.querySelectorAll(':scope > .ds-press-ripple').length)).toBe(1);
    expect(await target.evaluate((el) => el.classList.contains('ds-pressed'))).toBe(true);
    await page.mouse.up();
    await settle(page, { timeout: 5000 });
    const button = target.locator('.ds-list__actions .ds-btn');
    const at = await button.boundingBox();
    await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2);
    await page.mouse.down();
    expect(await button.evaluate((el) => el.querySelectorAll(':scope > .ds-press-ripple').length)).toBe(1);
    expect(await target.evaluate((el) => el.querySelectorAll(':scope > .ds-press-ripple').length)).toBe(0);
    expect(await target.evaluate((el) => el.classList.contains('ds-pressed'))).toBe(false);
    await page.mouse.up();
  });

  test('a blocked row and a blocked key-value row start no ripple and hold no .ds-pressed (inactive() of DS.ripple)', async ({ page }) => {
    await open(page, { attach: true });
    for (const [target, spot] of [[row(page, 'm09'), row(page, 'm09').locator('.ds-list__meta')], [page.locator('#kv-blocked'), page.locator('#kv-blocked strong')]]) {
      const box = await spot.boundingBox();
      await page.mouse.move(box.x + 10, box.y + box.height / 2);
      await page.mouse.down();
      expect(await target.evaluate((el) => el.querySelectorAll('.ds-press-ripple').length)).toBe(0);
      expect(await target.evaluate((el) => el.classList.contains('ds-pressed'))).toBe(false);
      await page.mouse.up();
      await page.mouse.move(1, 1);
    }
  });

  test('rows glide through flip() on an opaque backing; a new row fades in over --ds-dur-fast', async ({ page }) => {
    await open(page);
    const fast = await page.evaluate(() => DS.motion.motionDuration(document.querySelector('.ds-theme'), '--ds-dur-fast'));
    const seen = await page.evaluate(() => {
      const list = document.getElementById('rows');
      fxLists.rows.reverse();
      fxLists.rows.push(['n01', 'TABLET-0121', 'ok']);
      DS.motion.flip(list, (options) => DS.dom.morphHtml(list, fxLists.rowsHtml(), options));
      const fresh = list.querySelector('[data-ds-key="n01"]');
      const fade = fresh.getAnimations().find((animation) => animation.animationName === 'ds-fade-in');
      const moving = [...list.children].filter((item) => item !== fresh && item.getAnimations().some((animation) => !animation.animationName));
      return {
        glide: list.hasAttribute('data-ds-glide'),
        backing: getComputedStyle(moving[0]).backgroundImage,
        fade: fade ? fade.effect.getComputedTiming().duration : null,
        moving: moving.length,
      };
    });
    expect(seen.glide).toBe(true);
    expect(seen.backing).toMatch(/gradient/);
    expect(seen.moving).toBeGreaterThan(0);
    expect(seen.fade).toBe(fast);
    await settle(page, { timeout: 5000 });
    expect(await page.evaluate(() => document.getElementById('rows').hasAttribute('data-ds-glide'))).toBe(false);
  });

  test('trailing parts stay beside the text in a wide list and drop to a second line in a narrow one', async ({ page }) => {
    await open(page);
    const wide = await row(page, 'd42').evaluate((el) => {
      const text = el.querySelector('.ds-list__text').getBoundingClientRect();
      const status = el.querySelector('.ds-status').getBoundingClientRect();
      return { text: text.bottom, status: status.top };
    });
    expect(wide.status).toBeLessThan(wide.text);
    const narrow = await page.locator('#narrow-row').evaluate((el) => {
      const text = el.querySelector('.ds-list__text').getBoundingClientRect();
      const status = el.querySelector('.ds-status').getBoundingClientRect();
      const chevron = el.querySelector('.ds-list__chevron').getBoundingClientRect();
      return { text: text.bottom, status: status.top, chevron: chevron.right, row: el.getBoundingClientRect().right - parseFloat(getComputedStyle(el).paddingRight) };
    });
    expect(narrow.status).toBeGreaterThanOrEqual(narrow.text);
    // The chevron keeps to the end of the row.
    expect(Math.abs(narrow.chevron - narrow.row)).toBeLessThan(1);
    // The list itself clips nothing.
    expect(await page.locator('#narrow').evaluate((el) => getComputedStyle(el).overflow)).toBe('visible');
  });
});

test.describe('key-value rows, bars, facts and the lock', () => {
  test('a row that opens keeps its text in line with the static rows and hangs its layer into the sides', async ({ page }) => {
    await open(page);
    const xs = await page.evaluate(() => ({
      static: document.querySelector('#kv-static li > span').getBoundingClientRect().left,
      link: document.querySelector('#kv-link > span').getBoundingClientRect().left,
      button: document.querySelector('#kv-button > span').getBoundingClientRect().left,
      plain: document.querySelector('#kv-plain > span').getBoundingClientRect().left,
      row: document.getElementById('kv-link').getBoundingClientRect().left,
      value: document.querySelector('#kv-static strong').getBoundingClientRect().right,
      linkValue: document.querySelector('#kv-link > strong').getBoundingClientRect().right,
    }));
    expect(Math.abs(xs.link - xs.static)).toBeLessThan(0.5);
    expect(Math.abs(xs.button - xs.static)).toBeLessThan(0.5);
    expect(Math.abs(xs.plain - xs.static)).toBeLessThan(0.5);
    expect(Math.abs(xs.linkValue - xs.value)).toBeLessThan(0.5);
    expect(xs.static - xs.row).toBeCloseTo(8, 0);
    const link = page.locator('#kv-link');
    await link.hover();
    await settle(page);
    expect(await layer(link)).toBeCloseTo(Number(await token(page, '--ds-state-hover-lg')), 3);
    await page.mouse.move(1, 1);
    await focusByKeyboard(page, link);
    await settle(page);
    expect(await link.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineOffset])).toEqual(['solid', '2px']);
  });

  test('a blocked row takes the disabled ink and shows no layer', async ({ page }) => {
    await open(page);
    const blocked = page.locator('#kv-blocked');
    await blocked.hover();
    await settle(page);
    expect(await layer(blocked)).toBe(0);
    const ink = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--ds-disabled-ink)';
      document.querySelector('.ds-theme').append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    expect(await blocked.evaluate((el) => getComputedStyle(el).color)).toBe(ink);
    expect(await blocked.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
  });

  test('the kv fixes: no top margin, no bottom padding on the last row, labels that wrap, quiet values', async ({ page }) => {
    await open(page);
    const seen = await page.evaluate(() => {
      const bare = document.getElementById('kv-bare');
      const long = document.querySelector('#kv li:last-child .ds-kv-list__row > span');
      const quiet = document.getElementById('kv-quiet');
      return {
        margin: getComputedStyle(bare).marginTop,
        last: getComputedStyle(bare.lastElementChild).paddingBottom,
        lines: long.getBoundingClientRect().height / parseFloat(getComputedStyle(long).lineHeight),
        apart: quiet.getBoundingClientRect().left >= long.getBoundingClientRect().right,
        weight: getComputedStyle(quiet).fontWeight,
      };
    });
    expect(seen.margin).toBe('0px');
    expect(seen.last).toBe('0px');
    expect(seen.lines).toBeGreaterThan(1.5);
    expect(seen.apart).toBe(true);
    expect(seen.weight).toBe('400');
  });

  test('bars: the label stays on one line with an ellipsis, the meter takes a line of its own', async ({ page }) => {
    await open(page);
    const seen = await page.evaluate(() => {
      const label = document.getElementById('bar-label');
      const meter = document.querySelector('#bars .ds-meter');
      return {
        cut: label.scrollWidth > label.clientWidth,
        overflow: getComputedStyle(label).textOverflow,
        below: meter.getBoundingClientRect().top >= label.getBoundingClientRect().bottom,
        wide: meter.getBoundingClientRect().width >= meter.parentElement.clientWidth - 1,
      };
    });
    expect(seen).toEqual({ cut: true, overflow: 'ellipsis', below: true, wide: true });
  });

  test('facts in rows: the label beside its value, above it in a narrow window; the lock follows the value', async ({ page }) => {
    await open(page);
    const place = () => page.evaluate(() => {
      const dt = document.querySelector('#facts dt').getBoundingClientRect();
      const dd = document.querySelector('#facts dd').getBoundingClientRect();
      return { beside: dd.left > dt.right && Math.abs(dd.top - dt.top) < 2, below: dd.top >= dt.bottom };
    });
    expect(await place()).toEqual({ beside: true, below: false });
    const lock = await page.evaluate(() => {
      const icon = document.getElementById('lock').getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('fact-owner').firstChild);
      return icon.left - range.getBoundingClientRect().right;
    });
    expect(lock).toBeCloseTo(4, 0);
    await page.setViewportSize({ width: 560, height: 800 });
    expect(await place()).toEqual({ beside: false, below: true });
  });
});

test.describe('disclosure', () => {
  test('the plain summary is a pill that turns squarer while pressed and springs back; it opens on a click', async ({ page }) => {
    await open(page);
    const summary = page.locator('#disclosure > summary');
    const height = await summary.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(40);
    expect(await summary.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeCloseTo(height / 2, 0);
    await summary.hover();
    await page.mouse.down();
    await settle(page);
    expect(await summary.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeCloseTo(Number.parseFloat(await token(page, '--ds-radius-action-pressed')), 0);
    await page.mouse.up();
    await settle(page);
    expect(await summary.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeCloseTo(height / 2, 0);
    expect(await page.locator('#disclosure').evaluate((el) => el.open)).toBe(true);
    // The body starts --ds-space-3 below the summary; the summary's text lines up with the card's.
    const body = await page.evaluate(() => {
      const summaryBox = document.querySelector('#disclosure > summary').getBoundingClientRect();
      const text = document.querySelector('#disclosure .ds-disclosure__body p').getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('#disclosure > summary').firstChild);
      return { gap: text.top - summaryBox.bottom, inLine: Math.abs(range.getBoundingClientRect().left - text.left) };
    });
    expect(body.gap).toBeCloseTo(12, 0);
    expect(body.inLine).toBeLessThan(1);
  });

  test('accordion rows run to the card edges, keep a rectangular layer and an inset ring, and open one at a time', async ({ page }) => {
    await open(page);
    const edges = await page.evaluate(() => {
      const card = document.getElementById('disclosure-card');
      const summary = document.querySelector('#row-a > summary').getBoundingClientRect();
      const box = card.getBoundingClientRect();
      return { left: summary.left - box.left - card.clientLeft, right: box.right - card.clientLeft - summary.right };
    });
    expect(edges.left).toBeCloseTo(0, 0);
    expect(edges.right).toBeCloseTo(0, 0);
    const summary = page.locator('#row-a > summary');
    expect(await summary.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe('0px');
    await focusByKeyboard(page, summary);
    await settle(page);
    expect(await summary.evaluate((el) => getComputedStyle(el).outlineOffset)).toBe('-2px');
    await summary.click();
    await page.locator('#row-b > summary').click();
    await settle(page);
    const state = await page.evaluate(() => ({
      a: document.getElementById('row-a').open,
      b: document.getElementById('row-b').open,
      exclusive: 'name' in HTMLDetailsElement.prototype,
    }));
    expect(state.b).toBe(true);
    // details[name] is progressive: where it is missing, each row opens on its own.
    expect(state.a).toBe(!state.exclusive);
  });
});

test.describe('tasks', () => {
  test('a step that turns done draws its tick; the status shows in the mark and the weight', async ({ page }) => {
    await open(page);
    const seen = await page.evaluate(() => {
      const list = document.getElementById('tasks');
      const item = (index) => list.children[index];
      const before = {
        pending: getComputedStyle(item(2).querySelector('.ds-tasks__mark'), '::before').borderTopStyle,
        running: getComputedStyle(item(1).querySelector('.ds-tasks__text')).fontWeight,
        pendingWeight: getComputedStyle(item(2).querySelector('.ds-tasks__text')).fontWeight,
      };
      fxLists.tasks[1] = 'done';
      DS.dom.morphHtml(list, fxLists.tasksHtml());
      const mark = item(1).querySelector('.ds-tasks__mark');
      void getComputedStyle(mark).strokeDashoffset;
      const draw = mark.getAnimations().find((animation) => animation.transitionProperty === 'stroke-dashoffset');
      return { ...before, draws: Boolean(draw), status: item(1).getAttribute('data-status') };
    });
    expect(seen).toEqual({ pending: 'solid', running: '500', pendingWeight: '400', draws: true, status: 'done' });
    await settle(page);
  });

  test('the tick draws from its start: the dash offset runs from 1 to 0; a step rendered done stays still', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => document.getElementById('tasks').getAnimations({ subtree: true }).filter((animation) => !animation.animationName?.startsWith('ds-spin')).length)).toBe(0);
    const samples = await page.evaluate(() => {
      fxLists.tasks[1] = 'done';
      DS.dom.morphHtml(document.getElementById('tasks'), fxLists.tasksHtml());
      const mark = document.querySelector('#tasks > li:nth-child(2) .ds-tasks__mark');
      const el = mark.querySelector('svg');
      void getComputedStyle(mark).strokeDashoffset;
      const animation = mark.getAnimations().find((each) => each.transitionProperty === 'stroke-dashoffset');
      animation.pause();
      const timing = animation.effect.getComputedTiming();
      const delay = animation.effect.getTiming().delay;
      return [0, 0.5, 1].map((progress) => {
        animation.currentTime = delay + progress * Number(timing.duration) - (progress === 1 ? 1 : 0);
        return parseFloat(getComputedStyle(el.querySelector('[pathLength]')).strokeDashoffset);
      });
    });
    expect(samples[0]).toBeCloseTo(1, 2);
    expect(samples[1]).toBeLessThan(samples[0]);
    expect(samples[2]).toBeLessThan(0.05);
  });
});
