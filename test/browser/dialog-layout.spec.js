/**
 * The dialog layouts of 2.0 (fixtures/dialog-layout.html) in real engines:
 *
 * - body: with a .ds-dialog__body only the body scrolls (1280×600), the
 *   box scrolls as one in a window 320px high or less (320×256), a ring
 *   or halo inside the body is not clipped, --ds-dialog-height keeps the
 *   box's height with 40, 2 and 0 rows, the hairline shows while scrolled,
 *   an empty body and empty actions take no room;
 * - fallback focus: a box that took focus because nothing inside could
 *   shows no ring, the sheet panel keeps its transparent outline;
 * - full screen and the action sheet: the box fills the window at 390px
 *   (a normal dialog at 1280px), the action sheet sits at the bottom edge
 *   and its rows take the arrow keys; both rise with the fade (no scale)
 *   and drop back, as the Overlays table of docs/motion.md says;
 * - the side sheet: a long title wraps, the subtitle is one line, the foot
 *   ends the panel above a hairline, a lone button keeps its width.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/dialog-layout.html';

async function load(page, width = 1280, height = 800) {
  await page.setViewportSize({ width, height });
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Opens `id` from its button and waits until the entrance settled. */
async function openSettled(page, id, opener) {
  await page.evaluate(([name, from]) => DS.overlay.open(document.getElementById(name), { opener: document.getElementById(from) }), [id, opener]);
  await settle(page);
}

/** Scroll sizes of the box and the body of `id`. */
const scrolling = (page, id) => page.evaluate((name) => {
  const box = document.querySelector(`#${name} .ds-dialog__box`);
  const body = box.querySelector('.ds-dialog__body');
  return {
    box: box.scrollHeight > box.clientHeight + 1,
    body: body.scrollHeight > body.clientHeight + 1,
  };
}, id);

test.describe('dialog body (2.0)', () => {
  test('1280×600: only the body scrolls; title, search and actions stay in view; the hairline shows while scrolled', async ({ page }) => {
    await load(page, 1280, 600);
    await openSettled(page, 'people', 'open-people');
    expect(await scrolling(page, 'people')).toEqual({ box: false, body: true });
    const inView = await page.evaluate(() => ['people-title', 'people-search', 'people-ok'].map((id) => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }));
    expect(inView).toEqual([true, true, true]);
    const hairline = await page.evaluate(() => {
      const box = document.querySelector('#people .ds-dialog__box');
      const body = document.getElementById('people-body');
      const color = () => getComputedStyle(body).borderTopColor;
      const rest = color();
      // data-scrolled comes from DS.dom.watchScrolled(); set here by hand. The hairline shows on --ds-dur-fast.
      box.setAttribute('data-scrolled', '');
      body.getAnimations().forEach((animation) => animation.finish());
      const line = getComputedStyle(document.body).getPropertyValue('--ds-line').trim();
      const probe = document.createElement('div');
      probe.style.color = line;
      document.body.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return { rest, scrolled: color(), expected };
    });
    expect(hairline.rest).toBe('rgba(0, 0, 0, 0)');
    expect(hairline.scrolled).toBe(hairline.expected);
  });

  test('320×256: the box scrolls as one, so every part stays reachable', async ({ page }) => {
    await load(page, 320, 256);
    await openSettled(page, 'people', 'open-people');
    expect(await scrolling(page, 'people')).toEqual({ box: true, body: false });
  });

  test('a focused checkbox in the body keeps its whole halo inside the scroller', async ({ page }) => {
    await load(page, 1280, 600);
    await openSettled(page, 'people', 'open-people');
    const fits = await page.evaluate(() => {
      const body = document.getElementById('people-body');
      const input = document.getElementById('person-0');
      input.focus();
      const halo = (parseFloat(getComputedStyle(input).getPropertyValue('--ds-check-target')) || 40) - input.getBoundingClientRect().width;
      const outer = body.getBoundingClientRect();
      const rect = input.getBoundingClientRect();
      return { left: rect.left - halo / 2 >= outer.left, top: rect.top - halo / 2 >= outer.top };
    });
    expect(fits).toEqual({ left: true, top: true });
  });

  test('--ds-dialog-height keeps the box\'s height with 40, 2 and 0 rows', async ({ page }) => {
    await load(page, 1280, 800);
    await openSettled(page, 'people', 'open-people');
    const heights = [];
    for (const count of [40, 2, 0]) {
      heights.push(await page.evaluate((rows) => {
        window.fillPeople(rows);
        return Math.round(document.querySelector('#people .ds-dialog__box').getBoundingClientRect().height);
      }, count));
    }
    expect(heights).toEqual([480, 480, 480]);
  });

  test('an empty body and empty actions take no room; the box takes focus and shows no ring', async ({ page }) => {
    await load(page);
    await page.focus('#open-note');
    await page.keyboard.press('Enter');
    await settle(page);
    const read = await page.evaluate(() => {
      const box = document.querySelector('#note .ds-dialog__box');
      return {
        body: getComputedStyle(box.querySelector('.ds-dialog__body')).display,
        actions: getComputedStyle(box.querySelector('.ds-dialog__actions')).display,
        focus: document.activeElement === box,
        ring: getComputedStyle(box).outlineStyle,
      };
    });
    expect(read).toEqual({ body: 'none', actions: 'none', focus: true, ring: 'none' });
  });

  test('the sheet panel keeps its transparent outline when the sheet opens from the keyboard', async ({ page }) => {
    await load(page);
    await page.focus('#open-filters');
    await page.keyboard.press('Enter');
    await settle(page);
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('#filters .ds-sheet__panel'));
      return [style.outlineStyle, style.outlineColor];
    });
    expect(outline).toEqual(['solid', 'rgba(0, 0, 0, 0)']);
  });
});

test.describe('full screen and the action sheet (2.0)', () => {
  test('--full-narrow fills the window at 390px and is a normal dialog at 1280px; the head lines up', async ({ page }) => {
    await load(page, 390, 800);
    await openSettled(page, 'full', 'open-full');
    const phone = await page.evaluate(() => {
      const box = document.querySelector('#full .ds-dialog__box').getBoundingClientRect();
      const title = document.getElementById('full-title').getBoundingClientRect();
      const close = document.getElementById('full-close').getBoundingClientRect();
      const save = document.getElementById('full-save').getBoundingClientRect();
      return {
        box: [box.left, box.top, box.width, box.height].map(Math.round),
        radius: getComputedStyle(document.querySelector('#full .ds-dialog__box')).borderTopLeftRadius,
        row: close.right <= title.left && title.right <= save.left,
      };
    });
    expect(phone).toEqual({ box: [0, 0, 390, 800], radius: '0px', row: true });
    await page.keyboard.press('Escape');
    await settle(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSettled(page, 'full', 'open-full');
    const desk = await page.evaluate(() => Math.round(document.querySelector('#full .ds-dialog__box').getBoundingClientRect().width));
    expect(desk).toBe(400);
  });

  test('the action sheet sits at the bottom edge; ArrowDown, ArrowUp, Home and End move through its rows, wrapping', async ({ page }) => {
    await load(page, 390, 800);
    await openSettled(page, 'actions', 'open-actions');
    const place = await page.evaluate(() => Math.round(innerHeight - document.querySelector('#actions .ds-dialog__box').getBoundingClientRect().bottom));
    expect(place).toBe(16);
    const focus = () => page.evaluate(() => document.activeElement.id);
    expect(await focus()).toBe('act-edit');
    const walk = [];
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'End', 'Home']) {
      await page.keyboard.press(key);
      walk.push(await focus());
    }
    expect(walk).toEqual(['act-copy', 'act-archive', 'act-edit', 'act-archive', 'act-archive', 'act-edit']);
  });

  for (const [id, opener, distance, width] of [['full', 'open-full', '--ds-distance-lg', 390], ['actions', 'open-actions', '--ds-distance-sheet', 390], ['full', 'open-full', null, 1280]]) {
    test(`${id} at ${width}px: ${distance ? 'it rises with the fade, no scale, and drops back' : 'a normal dialog grows from the opener'} (the Overlays table)`, async ({ page }) => {
      await load(page, width, 800);
      const tracks = (act) => page.evaluate(([name, from, action]) => {
        const el = document.getElementById(name);
        if (action === 'open') DS.overlay.open(el, { opener: document.getElementById(from) });
        else DS.overlay.close(el);
        const box = el.querySelector('.ds-dialog__box');
        const out = box.getAnimations().filter((a) => a.transitionProperty && a.effect.getTiming().duration > 0)
          .map((a) => `${a.transitionProperty} ${Math.round(a.effect.getTiming().duration)}`).sort();
        const style = getComputedStyle(box);
        return { out, scale: style.scale };
      }, [id, opener, act]);
      const t = await page.evaluate(() => Object.fromEntries(['--ds-dur-fast', '--ds-dur-base', '--ds-dur-slow', '--ds-dur-long'].map((name) => [name, Math.round(DS.motion.motionDuration(document.body, name))])));
      const entrance = await tracks('open');
      if (distance) {
        expect(entrance.out).toEqual([`opacity ${t['--ds-dur-fast']}`, `translate ${t['--ds-dur-long']}`]);
        expect(entrance.scale).toBe('none');
      } else {
        expect(entrance.out).toEqual([`opacity ${t['--ds-dur-fast']}`, `scale ${t['--ds-dur-slow']}`, `translate ${t['--ds-dur-slow']}`]);
      }
      await settle(page);
      const exit = await tracks('close');
      if (distance) expect(exit.out).toEqual([`opacity ${t['--ds-dur-base']}`, `translate ${t['--ds-dur-base']}`]);
      await settle(page);
      expect(await page.evaluate((name) => document.getElementById(name).hasAttribute('data-state'), id)).toBe(false);
    });
  }
});

test.describe('side sheet head and foot (2.0)', () => {
  test('a long title wraps, the subtitle stays one line, the foot ends the panel and a lone button keeps its width', async ({ page }) => {
    await load(page, 1280, 800);
    await openSettled(page, 'filters', 'open-filters');
    const read = await page.evaluate(() => {
      const line = (el) => parseFloat(getComputedStyle(el).lineHeight);
      const title = document.getElementById('filters-title');
      const subtitle = document.getElementById('filters-count');
      const panel = document.querySelector('#filters .ds-sheet__panel').getBoundingClientRect();
      const foot = document.getElementById('filters-foot');
      const body = document.getElementById('filters-body');
      const more = document.getElementById('filters-more').getBoundingClientRect();
      return {
        titleLines: Math.round(title.getBoundingClientRect().height / line(title)),
        subtitleLines: Math.round(subtitle.getBoundingClientRect().height / line(subtitle)),
        footAtEnd: Math.round(panel.bottom - foot.getBoundingClientRect().bottom),
        footBorder: getComputedStyle(foot).borderTopStyle,
        bodyEnd: getComputedStyle(body).paddingBottom,
        bodyPosition: getComputedStyle(body).position,
        lone: more.width < body.clientWidth / 2,
      };
    });
    expect(read).toEqual({ titleLines: 2, subtitleLines: 1, footAtEnd: 0, footBorder: 'solid', bodyEnd: '12px', bodyPosition: 'relative', lone: true });
  });
});

test.describe('confirm by typing the name (2.0, the styleguide recipe)', () => {
  test('the action is blocked until the name is typed; Enter runs it busy (Escape waits, the field read-only); then it closes with a snackbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/styleguide/index.html');
    await ready(page);
    await page.locator('[data-sg="dialog-type"]').click();
    const dialog = page.locator('#sg-dialog-type');
    await expect(dialog).toHaveAttribute('data-state', 'open');
    const field = page.locator('#sg-type-field');
    const ok = page.locator('#sg-type-ok');
    await expect(field).toBeFocused();
    await expect(ok).toHaveAttribute('aria-disabled', 'true');
    // A wrong name: still blocked, and Enter runs nothing.
    await field.fill('LAPTOP-004');
    await page.keyboard.press('Enter');
    await expect(ok).toHaveAttribute('aria-disabled', 'true');
    expect(await dialog.evaluate((el) => el.hasAttribute('data-ds-busy'))).toBe(false);
    // The name: the action is free; Enter runs it, busy.
    await field.fill('LAPTOP-0042');
    await expect(ok).toHaveAttribute('aria-disabled', 'false');
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveAttribute('data-ds-busy', '');
    expect(await field.evaluate((input) => input.readOnly)).toBe(true);
    await expect(page.locator('#sg-type-cancel')).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveAttribute('data-state', 'open');
    // Done: it closes, and the snackbar says what happened.
    await expect(dialog).not.toHaveAttribute('data-state', 'open', { timeout: 5000 });
    await expect(page.locator('.ds-toast', { hasText: 'LAPTOP-0042 deleted.' })).toBeVisible();
  });
});

/*
 * Settled shots of the 2.0 overlay parts (Chromium, like the phone and
 * forced-colour shots of baseline.spec.js): the full-screen dialog and the
 * action sheet at 390px, the side sheet's head and foot at 1280px and 390px.
 */
test.describe('baselines (2.0)', () => {
  test.beforeEach(({ browserName, dsFallback }) => {
    test.skip(browserName !== 'chromium' || dsFallback, 'one engine for the settled shots, as baseline.spec.js does for phones');
  });

  for (const [id, opener, width, name] of [
    ['full', 'open-full', 390, 'dialog-full-390.png'],
    ['actions', 'open-actions', 390, 'action-sheet-390.png'],
    ['filters', 'open-filters', 1280, 'sheet-head-foot-1280.png'],
    ['filters', 'open-filters', 390, 'sheet-head-foot-390.png'],
  ]) {
    test(name, async ({ page }) => {
      await load(page, width, 800);
      await openSettled(page, id, opener);
      await page.evaluate(() => document.activeElement?.blur());
      await settle(page);
      await expect.soft(page, name).toHaveScreenshot(name, { animations: 'allow' });
    });
  }
});
