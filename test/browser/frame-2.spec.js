/**
 * The app frame of 2.0 (shell.css, js/indicator.js) in real engines:
 * segmented options as buttons (the UA look reset, selection by
 * aria-checked, the disabled model, the start margin only in the top bar);
 * the drawer's back item standing in for the page head's back link above
 * 900px, counts that show on a closed group, the pill leaving an item whose
 * group closes and coming back, the row action, the foot rail and the tap
 * highlight; the rail (data-drawer-collapsed) above 900px only, its labels
 * readable but 1px; createIndicator() idempotent and reveal scrolling only
 * the list; the top bar's title, search and actions, the account capsule
 * (its end room without a sign-out button) and avatars; positioned views, the frame's height from
 * --ds-viewport-height and the bar hidden for the keyboard; the banner
 * gliding the view; forced colours (SelectedItem on the current drawer
 * item and the selected option) and print.
 */
import { test, expect } from './base-test.js';
import { ready, settle, setSpeed } from './helpers/motion.js';

const URL = '/test/browser/fixtures/frame-2.html';

async function open(page, width = 1280, height = 800) {
  await page.setViewportSize({ width, height });
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const box = (page, selector) => page.locator(selector).first().evaluate((el) => {
  const rect = el.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
});
const style = (page, selector, property, pseudo = null) => page.locator(selector).first().evaluate((el, [name, which]) => getComputedStyle(el, which).getPropertyValue(name), [property, pseudo]);

/** A system colour as the engine resolves it (forced colours off for the probe itself). */
function systemColour(page, keyword) {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.cssText = `forced-color-adjust: none; background-color: ${name}`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, keyword);
}

test.describe('segmented options as buttons', () => {
  test('lose the browser\'s button look, select by aria-checked, sit flush outside the top bar', async ({ page }) => {
    await open(page);
    const look = await page.locator('#mode-map').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { margin: cs.marginTop, top: cs.borderTopWidth, left: cs.borderLeftWidth, background: cs.backgroundColor, cursor: cs.cursor, font: cs.fontFamily === getComputedStyle(el.parentNode).fontFamily };
    });
    expect(look.margin).toBe('0px');
    expect(look.top).toBe('0px');
    expect(look.left).toBe('1px'); // the divider comes back
    expect(look.background).toBe('rgba(0, 0, 0, 0)');
    expect(look.cursor).toBe('pointer');
    expect(await style(page, '#modes', 'margin-left')).toBe('0px');
    // The selected option takes the label weight; the pill sits on it.
    expect(Number(await style(page, '#mode-list', 'font-weight'))).toBeGreaterThan(Number(await style(page, '#mode-map', 'font-weight')));
    const width = (await box(page, '#modes')).width;
    await page.locator('#mode-map').click();
    await settle(page);
    expect(Number(await style(page, '#mode-map', 'font-weight'))).toBeGreaterThan(Number(await style(page, '#mode-list', 'font-weight')));
    expect(Math.abs((await box(page, '#modes')).width - width)).toBeLessThan(0.5);
    const pill = await box(page, '#modes .ds-indicator');
    const map = await box(page, '#mode-map');
    expect(Math.abs(pill.left - map.left)).toBeLessThan(1);
  });

  test('take the disabled model when aria-disabled: no hover or press layer, the focus layer stays', async ({ page }) => {
    await open(page);
    const chart = page.locator('#mode-chart');
    expect(await style(page, '#mode-chart', 'cursor')).toBe('default');
    expect(await style(page, '#mode-chart', 'color')).not.toBe(await style(page, '#mode-map', 'color'));
    await chart.hover();
    await settle(page);
    expect(Number(await style(page, '#mode-chart', 'opacity', '::before'))).toBe(0);
    await page.mouse.down();
    await page.waitForTimeout(100);
    expect(Number(await style(page, '#mode-chart', 'opacity', '::before'))).toBe(0);
    expect(await chart.evaluate((el) => el.querySelector('.ds-press-ripple'))).toBeNull();
    await page.mouse.up();
    expect(await chart.getAttribute('aria-checked')).toBe('false');
  });

  test('keep the start margin after the brand in the top bar', async ({ page }) => {
    await open(page);
    const margin = await page.evaluate(() => {
      const nav = document.createElement('nav');
      nav.className = 'ds-segmented';
      nav.innerHTML = '<a class="ds-segmented__option" href="#a" aria-current="true">A</a><a class="ds-segmented__option" href="#b">B</a>';
      document.getElementById('brand').after(nav);
      const value = getComputedStyle(nav).marginLeft;
      nav.remove();
      return value;
    });
    expect(margin).toBe('16px');
  });
});

test.describe('drawer parts', () => {
  test('the back item stands in for the page head\'s back link above 900px, not below', async ({ page }) => {
    await open(page, 1280);
    expect(await page.locator('#head-back').isVisible()).toBe(false);
    expect(await page.locator('#back-item').isVisible()).toBe(true);
    // The hairline under it.
    expect(await style(page, '#back', 'border-bottom-width', '::after')).toBe('1px');
    await page.setViewportSize({ width: 800, height: 800 });
    await settle(page);
    expect(await page.locator('#head-back').isVisible()).toBe(true);
  });

  test('a group heading shows its count only while closed; the pill leaves an item whose group closes and comes back', async ({ page }) => {
    await open(page);
    expect(await page.locator('#group-count').isVisible()).toBe(false);
    expect(await page.locator('#item-count').isVisible()).toBe(true);
    const pill = page.locator('#list .ds-indicator');
    await page.locator('#toggle-a').click();
    await settle(page);
    expect(await page.locator('#group-count').isVisible()).toBe(true);
    expect(await pill.evaluate((el) => 'empty' in el.dataset)).toBe(true);
    await page.locator('#toggle-a').click();
    await settle(page);
    expect(await pill.evaluate((el) => 'empty' in el.dataset)).toBe(false);
    const item = await box(page, '#open');
    const painted = await box(page, '#list .ds-indicator');
    expect(Math.abs(painted.top - item.top)).toBeLessThan(1);
    // Across groups: the pill follows a click into the other group.
    await page.locator('#laptops').click();
    await settle(page);
    const laptops = await box(page, '#laptops');
    expect(Math.abs((await box(page, '#list .ds-indicator')).top - laptops.top)).toBeLessThan(1);
  });

  test('the group toggle is a pressable row of the item\'s height that ripples', async ({ page }) => {
    await open(page);
    const toggle = await box(page, '#toggle-a');
    expect(toggle.height).toBe(48);
    expect(await style(page, '#toggle-a', 'cursor')).toBe('pointer');
    await page.mouse.move(toggle.left + 30, toggle.top + 20);
    await page.mouse.down();
    await page.waitForTimeout(60);
    expect(await page.locator('#toggle-a .ds-press-ripple').count()).toBe(1);
    await page.mouse.up();
  });

  test('a row keeps room for its action at the item\'s end; counts are tabular and right-aligned', async ({ page }) => {
    await open(page);
    const item = await box(page, '#waiting');
    const action = await box(page, '#row-action');
    expect(action.right).toBeLessThanOrEqual(item.right);
    expect(Math.abs((action.top + action.height / 2) - (item.top + item.height / 2))).toBeLessThan(1);
    const count = await box(page, '#waiting .ds-drawer__count');
    expect(count.right).toBeLessThanOrEqual(action.left);
    expect(await style(page, '#item-count', 'font-variant-numeric')).toContain('tabular-nums');
    // Firefox has no tap highlight (and no such property).
    expect(['rgba(0, 0, 0, 0)', '']).toContain(await style(page, '#open', '-webkit-tap-highlight-color'));
  });

  test('the row action shows on demand: hover, focus and a current item', async ({ page }) => {
    await open(page);
    const opacity = () => page.locator('#row-action').evaluate((el) => getComputedStyle(el).opacity);
    const settled = async (value) => expect.poll(opacity).toBe(value);
    await settled('0');
    await page.locator('#waiting').hover();
    await settled('1');
    await page.mouse.move(1, 1);
    await settled('0');
    await page.locator('#row-action').focus();
    await settled('1');
    await page.locator('#row-action').blur();
    await settled('0');
    // The row is current through its item (the row itself carries nothing).
    await page.evaluate(() => {
      document.querySelector('#open').removeAttribute('aria-current');
      document.querySelector('#waiting').setAttribute('aria-current', 'page');
    });
    await settled('1');
  });

  test('the foot rail lays its items out icon-only in a row, their labels read but unseen', async ({ page }) => {
    await open(page);
    const items = await page.locator('#foot .ds-drawer__item').evaluateAll((els) => els.map((el) => {
      const rect = el.getBoundingClientRect();
      const label = el.querySelector('.ds-drawer__label').getBoundingClientRect();
      return { top: rect.top, width: rect.width, label: label.width };
    }));
    expect(items[0].top).toBe(items[1].top);
    expect(items[0].width).toBe(48);
    expect(items[0].label).toBeLessThanOrEqual(1);
  });

  test('createIndicator() twice on the same list keeps one pill and one handle', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(() => {
      const list = document.getElementById('list');
      const again = DS.indicator.createIndicator(list, { active: '[aria-current="page"]', className: 'ds-drawer__indicator', reveal: true });
      return { same: again === window.fxDrawer, pills: list.querySelectorAll(':scope > .ds-indicator').length };
    });
    expect(result).toEqual({ same: true, pills: 1 });
  });

  test('reveal scrolls only the list to a current item out of its view and marks the list', async ({ page }) => {
    await open(page, 1280, 520);
    expect(await page.locator('#list').evaluate((el) => el.classList.contains('ds-drawer__list--overflow'))).toBe(true);
    const before = await page.evaluate(() => document.getElementById('main').scrollTop);
    await page.evaluate(() => {
      document.querySelector('#list [aria-current]').removeAttribute('aria-current');
      document.getElementById('last').setAttribute('aria-current', 'page');
    });
    await page.waitForFunction(() => {
      const list = document.getElementById('list').getBoundingClientRect();
      const last = document.getElementById('last').getBoundingClientRect();
      return last.bottom <= list.bottom - 7;
    }, null, { timeout: 5000 });
    expect(await page.evaluate(() => document.getElementById('main').scrollTop)).toBe(before);
  });
});

test.describe('rail', () => {
  test('narrows the docked drawer to its icons above 900px; labels are 1px and read; the menu button shows', async ({ page }) => {
    await open(page, 1280);
    await page.evaluate(() => window.fxRail(true));
    await settle(page);
    const drawer = await box(page, '#drawer');
    expect(Math.round(drawer.width)).toBe(72);
    const item = await box(page, '#open');
    expect(item.width).toBe(48);
    const label = await box(page, '#open .ds-drawer__label');
    expect(label.width).toBeLessThanOrEqual(1);
    expect(await page.locator('#open').evaluate((el) => el.textContent)).toContain('Open');
    expect(await page.locator('#row-action').isVisible()).toBe(false);
    expect(await page.locator('#menu').isVisible()).toBe(true);
    // The pill follows its item's new size.
    const pill = await box(page, '#list .ds-indicator');
    expect(Math.abs(pill.width - 48)).toBeLessThan(1);
    // The labels come back with a fade (in --ds-dur-fast; slowed down, so a
    // busy machine still catches it running).
    await setSpeed(page, 0.1);
    await page.evaluate(() => window.fxRail(true));
    await settle(page, { timeout: 8000 });
    await page.evaluate(() => window.fxRail(false));
    const fading = await page.locator('#open .ds-drawer__label').evaluate((el) => el.getAnimations().map((a) => a.transitionProperty));
    expect(fading).toContain('opacity');
    await settle(page, { timeout: 8000 });
    expect(Math.round((await box(page, '#drawer')).width)).toBe(256);
  });

  test('leaves the modal drawer alone at 900px and below', async ({ page }) => {
    await open(page, 800);
    await page.evaluate(() => window.fxRail(true));
    await page.evaluate(() => DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') }));
    await settle(page);
    expect(Math.round((await box(page, '#drawer')).width)).toBe(256);
    expect((await box(page, '#open .ds-drawer__label')).width).toBeGreaterThan(1);
  });
});

test.describe('top bar and account', () => {
  test('title takes the room with an ellipsis; search centres up to its maximum; nothing shrinks the menu button', async ({ page }) => {
    await open(page, 1280);
    expect(await style(page, '#title', 'text-overflow')).toBe('ellipsis');
    const search = await box(page, '#search');
    expect(search.width).toBeLessThanOrEqual(720);
    expect(await style(page, '#menu', 'flex-shrink')).toBe('0');
    await page.setViewportSize({ width: 700, height: 800 });
    await settle(page);
    expect(await page.locator('#search').isVisible()).toBe(false);
  });

  test('on phones the title takes two lines of the label role and the brand name gives way', async ({ page }) => {
    await open(page, 390);
    expect(await style(page, '#title', 'font-size')).toBe('14px');
    expect(await style(page, '#title', '-webkit-line-clamp')).toBe('2');
    expect(await page.locator('#brand').isVisible()).toBe(false); // a brand of only a name goes with a title
  });

  test('the capsule keeps the avatar first at every width; an empty email and a divider before a hidden button take no room', async ({ page }) => {
    await open(page, 1280);
    const avatar = await box(page, '#avatar');
    const text = await box(page, '#account .ds-account__text');
    expect(avatar.left).toBeLessThan(text.left);
    expect(await page.locator('#email').isVisible()).toBe(false);
    expect(await style(page, '#account', 'border-top-width')).toBe('1px');
    expect(await page.locator('#divider').isVisible()).toBe(true);
    await page.evaluate(() => { document.getElementById('signout').hidden = true; });
    expect(await page.locator('#divider').isVisible()).toBe(false);
    await page.setViewportSize({ width: 340, height: 700 });
    await settle(page);
    expect(await page.locator('#avatar').isVisible()).toBe(true);
  });

  test('a capsule without a shown sign-out button ends with the room it starts with, wide and round (2.1)', async ({ page }) => {
    await open(page, 1280);
    /** The room from the capsule's edges (borders included) to its first and last shown part. */
    const room = () => page.evaluate(() => {
      const account = document.getElementById('account').getBoundingClientRect();
      const shown = [...document.getElementById('account').children].filter((el) => el.getClientRects().length && getComputedStyle(el).position !== 'absolute');
      const rects = shown.map((el) => el.getBoundingClientRect());
      return { start: Math.min(...rects.map((r) => r.left)) - account.left, end: account.right - Math.max(...rects.map((r) => r.right)) };
    });
    const withButton = await room();
    expect(withButton.end).toBeCloseTo(1 + 4, 0); // the text button brings its own padding
    await page.evaluate(() => { document.getElementById('signout').hidden = true; });
    const hidden = await room();
    expect(hidden.end).toBeCloseTo(1 + 16, 0);
    await page.evaluate(() => { document.getElementById('signout').remove(); document.getElementById('divider').remove(); });
    expect((await room()).end).toBeCloseTo(1 + 16, 0);
    // Below 720px only the avatar shows: as much room after it as before it
    // (without the fixture's long title, which leaves the account no room).
    await page.evaluate(() => document.getElementById('title').remove());
    await page.setViewportSize({ width: 390, height: 800 });
    await settle(page);
    const round = await room();
    expect(round.start).toBeCloseTo(1 + 8, 0);
    expect(round.end).toBeCloseTo(round.start, 0);
  });

  test('avatars are 24, 32 and 40px discs', async ({ page }) => {
    await open(page);
    for (const [id, size] of [['#avatar-sm', 24], ['#avatar-md', 32], ['#avatar-lg', 40]]) {
      const rect = await box(page, id);
      expect([rect.width, rect.height]).toEqual([size, size]);
      expect(await style(page, id, 'border-top-left-radius')).toBe('50%');
    }
  });
});

test.describe('views and the frame', () => {
  test('the view is positioned: an absolute element of the page stays in its scroller', async ({ page }) => {
    await open(page);
    expect(await style(page, '#main', 'position')).toBe('relative');
    expect(await style(page, '#list', 'position')).toBe('relative');
    expect(await page.evaluate(() => document.getElementById('probe-abs').offsetParent.id)).toBe('main');
    // The pad properties are defined on the view too.
    expect(await style(page, '#main', '--ds-content-pad-x')).not.toBe('');
    expect(await style(page, '#main', '--ds-content-pad-bottom')).not.toBe('');
  });

  test('the frame takes --ds-viewport-height; the opt-in bar hides while the keyboard is up', async ({ page }) => {
    await open(page, 1280, 800);
    expect((await box(page, '#app')).height).toBe(800);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--ds-viewport-height', '500px');
      document.getElementById('app').classList.add('ds-app--keyboard-hides-bar');
      document.documentElement.setAttribute('data-ds-keyboard', '');
    });
    expect((await box(page, '#app')).height).toBe(500);
    expect(await page.locator('#topbar').isVisible()).toBe(false);
    expect((await box(page, '#panel')).top).toBe(0);
  });

  test('the banner comes in above the view: the view glides, no height animates; it does not print', async ({ page }) => {
    await open(page);
    const before = (await box(page, '#main')).top;
    const played = await page.evaluate(() => {
      window.fxBanner(true);
      return document.getAnimations().map((a) => ({ target: a.effect.target?.id ?? '', props: Object.keys(a.effect.getKeyframes()[0] ?? {}) }));
    });
    expect(played.some((entry) => entry.target === 'main')).toBe(true);
    expect(played.every((entry) => !entry.props.includes('height'))).toBe(true);
    await settle(page);
    const banner = await box(page, '#banner');
    expect(Math.abs(banner.top - before)).toBeLessThan(1);
    expect((await box(page, '#main')).top).toBeGreaterThan(before);
    await page.emulateMedia({ media: 'print' });
    expect(await page.locator('#banner').isVisible()).toBe(false);
  });
});

test.describe('forced colours', () => {
  test('the current drawer item and the selected option are SelectedItem; blocked ones GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    const selected = await systemColour(page, 'SelectedItem');
    expect(await style(page, '#open', 'background-color')).toBe(selected);
    expect(await style(page, '#mode-list', 'background-color')).toBe(selected);
    expect(await style(page, '#list .ds-indicator', 'display')).toBe('none');
    expect(await style(page, '#mode-chart', 'color')).toBe(await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'GrayText';
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    }));
  });
});
