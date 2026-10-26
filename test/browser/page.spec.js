/**
 * The page of 2.0 (page.css, base.css, prose.css, steps.css) in real
 * engines: the record's page head (the back link hanging out by its
 * padding, the actions on the title's centre line and under it on a narrow
 * page, empty parts without room); breadcrumbs with their chevrons, only
 * the parent on a narrow page; a lone button keeping its width and the
 * stack gaps; the page base (headings on the type roles, code inside a pre
 * or a link without the chip, hr, mark, a link's icon); prose (rhythm,
 * headings, the quote, a table that scrolls) and a code block that scrolls
 * sideways with an inset ring; steps (marks, connectors, the bar);
 * .ds-view--fill and --fixed; the sign-in page; print.
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const URL = '/test/browser/fixtures/page.html';

async function open(page, { width = 1280, height = 800, query = '' } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(URL + query);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const box = (page, selector) => page.locator(selector).first().evaluate((el) => {
  const rect = el.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
});
const style = (page, selector, property, pseudo = null) => page.locator(selector).first().evaluate((el, [name, which]) => getComputedStyle(el, which).getPropertyValue(name), [property, pseudo]);

test.describe('page head', () => {
  test('the back label lines up with the title; the actions sit at the end on the title\'s centre line', async ({ page }) => {
    await open(page);
    const label = await page.locator('#back').evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el.lastChild);
      return range.getBoundingClientRect().left;
    });
    const icon = await box(page, '#back svg');
    const title = await box(page, '#title');
    expect(Math.abs(icon.left - title.left)).toBeLessThan(13); // the icon hangs out by the button's start padding
    expect(label).toBeGreaterThan(title.left);
    const actions = await box(page, '#actions');
    const row = await box(page, '#row');
    expect(Math.abs(actions.right - row.right)).toBeLessThan(1);
    const edit = await box(page, '#edit');
    expect(Math.abs((edit.top + edit.height / 2) - (title.top + title.height / 2))).toBeLessThan(1.5);
    expect(await style(page, '#lead', 'font-variant-numeric')).toContain('tabular-nums');
  });

  test('empty parts take no room; on a narrow page the actions start under the title', async ({ page }) => {
    await open(page);
    expect(await page.locator('#status').isVisible()).toBe(false);
    expect(await page.locator('#empty-head').isVisible()).toBe(false);
    await page.setViewportSize({ width: 560, height: 800 });
    await settle(page);
    const actions = await box(page, '#actions');
    const title = await box(page, '#title');
    expect(actions.top).toBeGreaterThan(title.bottom);
    expect(Math.abs(actions.left - title.left)).toBeLessThan(1);
  });

  test('print leaves out the back link and the actions', async ({ page }) => {
    await open(page);
    await page.emulateMedia({ media: 'print' });
    expect(await page.locator('#back').isVisible()).toBe(false);
    expect(await page.locator('#actions').isVisible()).toBe(false);
  });
});

test.describe('breadcrumbs', () => {
  test('a chevron between the links, the page itself plain; on a narrow page only the parent', async ({ page }) => {
    await open(page);
    expect(['normal', 'none']).toContain(await style(page, '#crumb-1', 'content', '::before'));
    const chevron = await page.locator('#crumb-2').evaluate((el) => {
      const cs = getComputedStyle(el, '::before');
      return { width: cs.width, mask: cs.maskImage || cs.webkitMaskImage };
    });
    expect(chevron.width).toBe('16px');
    expect(chevron.mask).toContain('data:image/svg+xml');
    expect(await style(page, '#crumb-1 a', 'text-decoration-line')).toBe('underline');
    expect(await style(page, '#crumb-3 a', 'text-decoration-line')).toBe('none');
    await page.setViewportSize({ width: 560, height: 800 });
    await settle(page);
    expect(await page.locator('#crumb-1').isVisible()).toBe(false);
    expect(await page.locator('#crumb-2').isVisible()).toBe(true);
    expect(await page.locator('#crumb-3').isVisible()).toBe(false);
    expect(await style(page, '#crumb-2', 'content', '::before')).toBe('none');
  });
});

test.describe('layout helpers', () => {
  test('a lone button keeps its own width; a stack in the page takes the page gap, one inside the 16px', async ({ page }) => {
    await open(page);
    const lone = await box(page, '#lone');
    const pageBox = await box(page, '#page');
    expect(lone.width).toBeLessThan(pageBox.width / 2);
    expect(await style(page, '#stack', 'row-gap')).toBe('20px');
    expect(await style(page, '#inner', 'row-gap')).toBe('16px');
  });
});

test.describe('page base', () => {
  test('bare headings take the type roles without margins', async ({ page }) => {
    await open(page);
    for (const [id, size] of [['#h1', '24px'], ['#h2', '16px'], ['#h3', '14px']]) {
      expect(await style(page, id, 'font-size')).toBe(size);
      expect(await style(page, id, 'margin-top')).toBe('0px');
    }
    expect(Number(await style(page, '#h1', 'font-weight'))).toBe(400);
    // A component class wins over the base.
    expect(await style(page, '#title', 'font-size')).toBe('24px');
  });

  test('code inside a pre or a link is just text; inline code keeps its chip', async ({ page }) => {
    await open(page);
    expect(await style(page, '#code', 'border-top-width')).toBe('1px');
    expect(await style(page, '#pre-code', 'border-top-width')).toBe('0px');
    expect(await style(page, '#pre-code', 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(await style(page, '#link-code', 'padding-left')).toBe('0px');
  });

  test('a rule is a hairline, a mark sits on the tint, a link\'s icon keeps its distance', async ({ page }) => {
    await open(page);
    expect(await style(page, '#hr', 'border-top-width')).toBe('1px');
    expect(await style(page, '#hr', 'border-bottom-width')).toBe('0px');
    expect(await style(page, '#mark', 'border-top-left-radius')).toBe('4px');
    expect(await style(page, '#link svg', 'margin-left')).toBe('4px');
  });
});

test.describe('prose and code', () => {
  test('one gap between blocks, more above a heading; the quote and the table', async ({ page }) => {
    await open(page);
    const h2 = await box(page, '#prose-h2');
    const p = await box(page, '#prose-p');
    expect(Math.round(p.top - h2.bottom)).toBe(8);
    expect(await style(page, '#prose-h2', 'font-size')).toBe('16px');
    expect(await style(page, '#prose-li', 'margin-top')).toBe('4px');
    expect(await style(page, '#quote', 'margin-left')).toBe('0px');
    expect(await style(page, '#num', 'font-variant-numeric')).toContain('tabular-nums');
    expect(await style(page, '#prose-table', 'overflow-x')).toBe('auto');
    expect(await style(page, '#prose-pre', 'white-space')).toBe('pre');
  });

  test('a code block scrolls sideways in its own box and rings inside on keyboard focus', async ({ page }) => {
    await open(page);
    expect(await page.locator('#block').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await style(page, '#block', 'position')).toBe('relative');
    expect(await style(page, '#block', 'outline-offset')).toBe('0px');
    await focusByKeyboard(page, page.locator('#block'));
    await settle(page);
    expect(await style(page, '#block', 'outline-style')).toBe('solid');
    expect(await style(page, '#block', 'outline-offset')).toBe('-2px');
    await page.emulateMedia({ media: 'print' });
    expect(await style(page, '#block', 'white-space')).toBe('pre-wrap');
  });
});

test.describe('steps', () => {
  test('done and current marks are filled, upcoming a ring; the connector after a done step is primary; the bar fills done and current', async ({ page }) => {
    await open(page);
    const primary = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--ds-primary)';
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    expect(await style(page, '#step-1 .ds-steps__mark', 'background-color')).toBe(primary);
    expect(await style(page, '#step-2 .ds-steps__mark', 'background-color')).toBe(primary);
    expect(await style(page, '#step-3 .ds-steps__mark', 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(await style(page, '#step-2', 'background-color', '::before')).toBe(primary);
    expect(await style(page, '#step-3', 'background-color', '::before')).not.toBe(primary);
    expect((await box(page, '#step-1 .ds-steps__mark')).width).toBe(24);
    expect(await style(page, '#bar-2', 'clip-path', '::after')).toMatch(/inset\(0(px)?\)/);
    expect(await style(page, '#bar-3', 'clip-path', '::after')).toContain('100%');
    expect((await box(page, '#bar-2')).height).toBe(4);
    // Rendered done, the check is drawn and still (nothing plays on load).
    expect(await page.locator('#step-1 .ds-steps__mark').evaluate((el) => [getComputedStyle(el.querySelector('svg')).strokeDashoffset, el.getAnimations({ subtree: true }).length])).toEqual(['0px', 0]);
    // A step turning done in place (its mark stays) draws its check: the
    // mark's offset glides from 1 to 0 and the check inherits it.
    const drawn = await page.locator('#step-2').evaluate((el) => {
      el.setAttribute('data-status', 'done');
      el.removeAttribute('aria-current');
      el.querySelector('.ds-steps__mark').innerHTML = DS.icons.icon(DS.icons.check, 16);
      const mark = el.querySelector('.ds-steps__mark');
      return mark.getAnimations().filter((a) => a.transitionProperty === 'stroke-dashoffset').map((a) => a.effect.getKeyframes().map((k) => String(k.strokeDashoffset)));
    });
    expect(drawn).toHaveLength(1);
    expect(drawn[0].map(parseFloat)).toEqual([1, 0]);
  });
});

test.describe('views that fill', () => {
  test('.ds-view--fill stops scrolling where there is room and its last child fills; below, it scrolls', async ({ page }) => {
    await open(page, { query: '?view=fill' });
    expect(await style(page, '#main', 'overflow-y')).toBe('hidden');
    const filler = await box(page, '#filler');
    const view = await box(page, '#main');
    expect(Math.abs(filler.bottom - (view.bottom - 24))).toBeLessThan(1.5);
    await page.setViewportSize({ width: 1280, height: 600 });
    await settle(page);
    expect(await style(page, '#main', 'overflow-y')).toBe('auto');
  });

  test('.ds-view--fixed never scrolls and has no gutter', async ({ page }) => {
    await open(page, { width: 390, height: 700, query: '?view=fixed' });
    expect(await style(page, '#main', 'overflow-y')).toBe('hidden');
    expect(await style(page, '#main', 'scrollbar-gutter') || 'auto').toBe('auto');
    const filler = await box(page, '#filler');
    const view = await box(page, '#main');
    expect(Math.abs(filler.bottom - (view.bottom - 24))).toBeLessThan(1.5);
  });
});

test.describe('sign-in page', () => {
  test('one centred card with the alert slot above it, the primary action as wide as the card', async ({ page }) => {
    await open(page, { width: 1000, height: 800, query: '?auth' });
    const card = await box(page, '#auth-card');
    expect(card.width).toBe(400);
    expect(Math.abs(card.left + card.width / 2 - 500)).toBeLessThan(1);
    expect(Math.abs(card.top + card.height / 2 - 400)).toBeLessThan(1);
    expect(await page.locator('#auth-alert').isVisible()).toBe(false);
    const button = await box(page, '#signin');
    expect(button.width).toBeGreaterThan(card.width - 60);
  });
});
