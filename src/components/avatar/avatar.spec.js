/**
 * The avatar on the options model (3.0): the disc at every size (density and
 * touch leave it alone; an interactive avatar's hit area grows), the shape,
 * the square, the deprecated --sm and --lg; data-ds-avatar (initials, the hue
 * of the name, the label with the status word, a picture's alt, owned state
 * that a morph keeps, destroy); the corner parts that are never cut; the
 * group with "+N", its menu (keys, Escape, focus return, ds:select) and its
 * changes; the focus ring and a blocked avatar; forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { focusByKeyboard, ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = ['ds-density-comfortable', 'ds-density-compact', 'ds-density-dense', 'ds-density-tight'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=avatar');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Appends `html` to the fixture and returns what `read` makes of the element with id="probe". */
const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const box = '[el.getBoundingClientRect().width, el.getBoundingClientRect().height]';

test('the disc at every size; density and touch leave it alone; the deprecated --sm and --lg keep 24 and 40px', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const density of DENSITIES) {
      for (const [size, step] of SIZES) {
        const side = 32 + step * 8;
        expect(await probe(page, `<div class="${density}${touch ? ' ds-touch' : ''}"><span id="probe" class="ds-avatar ${size}">AL</span></div>`, box), `${size} ${density} ${touch}`).toEqual([side, side]);
      }
    }
  }
  expect(await probe(page, '<div class="ds-xl"><span id="probe" class="ds-avatar ds-avatar--sm">A</span></div>', box)).toEqual([24, 24]);
  expect(await probe(page, '<div class="ds-xs"><span id="probe" class="ds-avatar ds-avatar--lg">A</span></div>', box)).toEqual([40, 40]);
  // The type of the size.
  expect(await probe(page, '<span id="probe" class="ds-avatar ds-xs">A</span>', 'parseFloat(style.fontSize)')).toBe(12);
  expect(await probe(page, '<span id="probe" class="ds-avatar ds-xl">A</span>', 'parseFloat(style.fontSize)')).toBe(16);
});

test('an interactive avatar: the hit area reaches --ds-target-min under .ds-touch, the disc keeps its size', async ({ page }) => {
  await open(page);
  const hit = '(() => { const s = getComputedStyle(el, "::before"); const r = el.getBoundingClientRect(); return [r.width, r.width - parseFloat(s.left) - parseFloat(s.right)]; })()';
  expect(await probe(page, '<button id="probe" class="ds-avatar ds-sm" type="button" aria-label="Ada">A</button>', hit)).toEqual([24, 24]);
  expect(await probe(page, '<div class="ds-touch"><button id="probe" class="ds-avatar ds-sm" type="button" aria-label="Ada">A</button></div>', hit)).toEqual([24, 48]);
  expect(await probe(page, '<div class="ds-touch"><button id="probe" class="ds-avatar ds-xl" type="button" aria-label="Ada">A</button></div>', hit)).toEqual([48, 48]);
});

test('shape: a disc from the default up, square at 0; an entity takes a quarter of the side at most', async ({ page }) => {
  await open(page);
  // A percentage of the side: 50% is the disc; more stays a disc.
  const radius = 'parseFloat(style.borderTopLeftRadius) / (style.borderTopLeftRadius.endsWith("%") ? 100 : el.getBoundingClientRect().width)';
  expect(await probe(page, '<span id="probe" class="ds-avatar">A</span>', radius)).toBe(0.5);
  expect(await probe(page, '<div class="ds-shape-soft"><span id="probe" class="ds-avatar">A</span></div>', radius)).toBe(0.25);
  expect(await probe(page, '<div class="ds-shape-round"><span id="probe" class="ds-avatar">A</span></div>', radius)).toBeGreaterThanOrEqual(0.5);
  expect(await probe(page, '<div class="ds-shape-square"><span id="probe" class="ds-avatar">A</span></div>', radius)).toBe(0);
  const px = 'parseFloat(getComputedStyle(el).borderTopLeftRadius)';
  const small = await probe(page, '<span id="probe" class="ds-avatar ds-avatar--square">A</span>', px);
  expect(small).toBeGreaterThan(0);
  expect(small).toBeLessThanOrEqual(8);
  expect(await probe(page, '<span id="probe" class="ds-avatar ds-avatar--square ds-xs">A</span>', px)).toBeLessThanOrEqual(4);
  expect(await probe(page, '<div class="ds-shape-square"><span id="probe" class="ds-avatar ds-avatar--square">A</span></div>', px)).toBe(0);
});

test('data-ds-avatar: initials, the hue of the name, a label with the status word; decoration stays unnamed', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(async () => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', `<div id="t">
      <span class="ds-avatar" data-ds-avatar="Ada Lovelace" data-ds-avatar-status="busy"></span>
      <span class="ds-avatar" data-ds-avatar="Grace Hopper" aria-hidden="true"></span>
      <span class="ds-avatar ds-avatar--hue-1" data-ds-avatar="Joan Clarke" aria-label="Joan"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""></span>
      <img class="ds-avatar" data-ds-avatar="Alan Turing" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="">
      <button class="ds-avatar" type="button" data-ds-avatar="Hedy Lamarr" data-ds-avatar-initials="1"></button>
    </div>`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const [ada, grace, joan, alan, hedy] = host.querySelectorAll('#t > *');
    const read = (el) => ({ text: el.textContent, cls: el.className, role: el.getAttribute('role'), label: el.getAttribute('aria-label'), alt: el.getAttribute('alt') });
    return { ada: read(ada), dot: ada.querySelector('.ds-presence-dot')?.className, grace: read(grace), joan: read(joan), alan: read(alan), hedy: read(hedy), hue: DS.avatar.hue('Ada Lovelace') };
  });
  expect(out.ada).toEqual({ text: 'AL', cls: `ds-avatar ds-avatar--hue-${out.hue}`, role: 'img', label: 'Ada Lovelace, Busy', alt: null });
  expect(out.dot).toBe('ds-presence-dot ds-presence-dot--busy');
  expect(out.grace.label, 'aria-hidden: no name').toBeNull();
  expect(out.grace.role).toBeNull();
  expect(out.grace.text).toBe('GH');
  expect(out.joan.text, 'a picture: no initials').toBe('');
  expect(out.joan.cls, 'the page\'s hue stays').toBe('ds-avatar ds-avatar--hue-1');
  expect(out.joan.label, 'the page\'s label stays').toBe('Joan');
  expect(out.alan.alt).toBe('Alan Turing');
  expect(out.hedy.text).toBe('H');
  expect(out.hedy.role, 'a button keeps its role').toBeNull();
  expect(out.hedy.label).toBe('Hedy Lamarr');
});

test('the controller: set, get, on and ds:change; a morph keeps what it wrote; destroy gives the markup back', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<div id="t"><span class="ds-avatar"></span></div>');
    const el = host.querySelector('#t > .ds-avatar');
    const ada = DS.avatar.create(el, { name: 'Ada Lovelace', status: 'online' });
    const heard = [];
    const off = ada.on('change', (detail) => heard.push(`on ${detail.status}`));
    el.addEventListener('ds:change', (event) => heard.push(`event ${event.detail.status}`));
    ada.set({ status: 'away' });
    const away = [el.getAttribute('aria-label'), el.querySelector('.ds-presence-dot').className];
    off();
    ada.set({ status: null });
    const none = [el.getAttribute('aria-label'), el.querySelectorAll('.ds-presence-dot').length];
    ada.set({ status: 'busy' });
    DS.dom.morphHtml(host.querySelector('#t'), '<span class="ds-avatar"></span>');
    const morphed = [el.isConnected, el.className, el.textContent, el.getAttribute('aria-label'), el.querySelectorAll('.ds-presence-dot--busy').length];
    ada.set('Grace Hopper');
    const renamed = [el.textContent, el.getAttribute('aria-label'), el.className === `ds-avatar ds-avatar--hue-${DS.avatar.hue('Grace Hopper')}`];
    const state = ada.get();
    ada.destroy();
    const after = [el.className, el.getAttribute('aria-label'), el.getAttribute('role'), el.querySelectorAll('.ds-presence-dot').length];
    return { away, none, morphed, renamed, state, heard, after };
  });
  expect(out.away).toEqual(['Ada Lovelace, Away', 'ds-presence-dot ds-presence-dot--away']);
  expect(out.none).toEqual(['Ada Lovelace', 0]);
  expect(out.morphed[0]).toBe(true);
  expect(out.morphed.slice(2)).toEqual(['AL', 'Ada Lovelace, Busy', 1]);
  expect(out.morphed[1]).toMatch(/^ds-avatar ds-avatar--hue-\d$/);
  expect(out.renamed).toEqual(['GH', 'Grace Hopper, Busy', true]);
  expect(out.state).toEqual({ name: 'Grace Hopper', status: 'busy' });
  expect(out.heard).toEqual(['event away', 'on away', 'event ', 'event busy', 'event busy']);
  expect(out.after).toEqual(['ds-avatar', null, null, 0]);
});

test('the corner parts sit on the curve and are never cut', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<div id="t" style="padding: 24px;"><span class="ds-avatar ds-xl" role="img" aria-label="Ada, online, 3 unread">AL<span class="ds-presence-dot ds-presence-dot--online"></span><span class="ds-badge">3</span></span></div>');
    const avatar = host.querySelector('#t .ds-avatar');
    const a = avatar.getBoundingClientRect();
    const dot = avatar.querySelector('.ds-presence-dot').getBoundingClientRect();
    const badge = avatar.querySelector('.ds-badge').getBoundingClientRect();
    return { overflow: getComputedStyle(avatar).overflow, a: [a.left, a.top, a.right, a.bottom], dot: [dot.left, dot.top, dot.right, dot.bottom], badge: [badge.left, badge.top, badge.right, badge.bottom] };
  });
  expect(out.overflow).toBe('visible');
  // The dot straddles the bottom end of the curve: its centre inside the box, near the corner.
  const [l, t, r, b] = out.a;
  const dotCentre = [(out.dot[0] + out.dot[2]) / 2, (out.dot[1] + out.dot[3]) / 2];
  expect(dotCentre[0]).toBeGreaterThan(l + (r - l) * 0.75);
  expect(dotCentre[1]).toBeGreaterThan(t + (b - t) * 0.75);
  expect(dotCentre[0]).toBeLessThan(r);
  const badgeCentre = [(out.badge[0] + out.badge[2]) / 2, (out.badge[1] + out.badge[3]) / 2];
  expect(badgeCentre[0]).toBeGreaterThan(l + (r - l) * 0.75);
  expect(badgeCentre[1]).toBeLessThan(t + (b - t) * 0.25);
});

test('the group: max - 1 avatars and "+N", the menu of the rest with its keys, Escape back to the button, ds:select', async ({ page }) => {
  await open(page);
  const group = page.locator('[data-demo="group"]');
  await expect(group.locator('.ds-avatar:not(.ds-avatar-group__more):visible')).toHaveCount(3);
  const more = group.locator('.ds-avatar-group__more');
  await expect(more).toHaveText('+5');
  await expect(more).toHaveAttribute('aria-label', '5 more');
  await expect(group).toHaveAttribute('role', 'group');
  const menu = group.locator('.ds-menu');
  await expect(menu.locator('.ds-menu__item')).toHaveCount(5);
  await expect(menu.locator('.ds-menu__item').nth(0)).toHaveAttribute('role', 'menuitem');
  await expect(menu.locator('.ds-menu__item .ds-menu__label').first()).toHaveText('Alan Turing');
  await expect(menu.locator('.ds-menu__item').first(), 'the status word in the item').toContainText('Away');

  await focusByKeyboard(page, more);
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.locator('.ds-menu__item').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('.ds-menu__item').nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.locator('.ds-menu__item').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toBeFocused();
  await settle(page);

  const selected = page.evaluate(() => new Promise((resolve) => {
    document.querySelector('[data-demo="group"]').addEventListener('ds:select', (event) => resolve(event.detail.name), { once: true });
  }));
  await more.click();
  await expect(menu).toHaveAttribute('data-state', 'open');
  await menu.locator('.ds-menu__item').nth(1).click();
  expect(await selected).toBe('Katherine Johnson');
  await settle(page);
});

test('the group follows avatars added and removed, and set(max); destroy shows them all', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(async () => {
    const group = document.querySelector('[data-demo="group"]');
    const tick = () => new Promise((resolve) => setTimeout(resolve, 30));
    const read = () => [group.querySelectorAll(':scope > .ds-avatar:not(.ds-avatar-group__more):not([hidden])').length, group.querySelector('.ds-avatar-group__more').textContent, group.querySelectorAll('.ds-menu__item').length];
    const start = read();
    const people = () => group.querySelectorAll(':scope > .ds-avatar:not(.ds-avatar-group__more)');
    for (let n = people().length; n > 4; n -= 1) people()[people().length - 1].remove();
    await tick();
    const four = [...read(), group.querySelector('.ds-avatar-group__more').hidden];
    people()[3].remove();
    await tick();
    const three = [...read(), group.querySelector('.ds-avatar-group__more').hidden];
    const team = DS.core.get(group, 'avatar-group');
    team.set(2);
    const two = [...read(), team.get()];
    team.destroy();
    const after = [group.querySelectorAll(':scope > .ds-avatar[hidden]').length];
    return { start, four, three, two, after };
  });
  expect(out.start).toEqual([3, '+5', 5]);
  expect(out.four, 'exactly max: all of them, no "+N"').toEqual([4, '', 0, true]);
  expect(out.three).toEqual([3, '', 0, true]);
  expect(out.two).toEqual([1, '+2', 2, { max: 2, shown: 1, hidden: 2 }]);
  expect(out.after).toEqual([0]);
});

test('the group keeps focus when it shrinks: the menu of the rest closes, focus stays in the group; a focused item that goes passes it on', async ({ page }) => {
  await open(page);
  const group = page.locator('[data-demo="group"]');
  const more = group.locator('.ds-avatar-group__more');
  const menu = group.locator('.ds-menu');
  const removeLast = () => page.evaluate(() => {
    const people = document.querySelectorAll('[data-demo="group"] > .ds-avatar:not(.ds-avatar-group__more)');
    people[people.length - 1].remove();
  });

  // A focused item whose avatar goes: the item now at its place takes focus.
  await focusByKeyboard(page, more);
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('End');
  await expect(menu.locator('.ds-menu__item')).toHaveCount(5);
  await expect(menu.locator('.ds-menu__item').last()).toBeFocused();
  await removeLast();
  await expect(menu.locator('.ds-menu__item')).toHaveCount(4);
  await expect(menu.locator('.ds-menu__item').last()).toBeFocused();

  // Nothing left to list: the menu closes and focus stays in the group, never on <body>.
  for (let n = 0; n < 4; n += 1) await removeLast();
  await expect(more).toBeHidden();
  await expect(menu).not.toHaveAttribute('data-state', 'open');
  await settle(page);
  const focus = await page.evaluate(() => {
    const groupEl = document.querySelector('[data-demo="group"]');
    const active = document.activeElement;
    return { inGroup: groupEl.contains(active), body: active === document.body, tabindex: groupEl.getAttribute('tabindex') };
  });
  expect(focus.body).toBe(false);
  expect(focus.inGroup).toBe(true);
  // The demo's avatars are no buttons: the group itself holds focus, and gives tabindex back on destroy.
  expect(focus.tabindex).toBe('-1');
  expect(await page.evaluate(() => {
    const groupEl = document.querySelector('[data-demo="group"]');
    DS.core.get(groupEl, 'avatar-group').destroy();
    return groupEl.getAttribute('tabindex');
  })).toBeNull();
});

test('names, the focus ring and a blocked avatar', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="buttons"] button').first();
  await expect(button).toHaveAccessibleName('Ada Lovelace, open profile');
  await expect(page.locator('[data-demo="status"] .ds-avatar').first()).toHaveAccessibleName(/^Ada Lovelace, Online$/);
  await focusByKeyboard(page, button);
  await settle(page);
  const ring = await button.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el, '::after').opacity]);
  expect(ring[0]).toBe('solid');
  expect(Number(ring[1])).toBeGreaterThan(0);
  const blocked = page.locator('[data-demo="buttons"] button[disabled]');
  await blocked.hover({ force: true });
  await settle(page);
  expect(await blocked.evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('0');
  // The disabled model: the neutral fill and ink, unlike its enabled neighbour.
  const looks = await blocked.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-disabled-ink)';
    probe.style.backgroundColor = 'var(--ds-disabled-fill)';
    el.parentElement.append(probe);
    const want = [getComputedStyle(probe).color, getComputedStyle(probe).backgroundColor];
    probe.remove();
    const enabled = el.parentElement.querySelector('button:not([disabled])');
    return { want, got: [getComputedStyle(el).color, getComputedStyle(el).backgroundColor], enabled: getComputedStyle(enabled).backgroundColor };
  });
  expect(looks.got).toEqual(looks.want);
  expect(looks.got[1]).not.toBe(looks.enabled);
  expect(await probe(page, '<button id="probe" class="ds-avatar" type="button" aria-disabled="true" aria-label="A">A</button>', 'style.color')).toBe(looks.want[0]);
});

test('forced colours: the disc keeps an edge, the state layer goes, the ring turns a Highlight outline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await probe(page, '<span id="probe" class="ds-avatar">A</span>', 'style.outlineStyle')).toBe('solid');
  expect(await probe(page, '<button id="probe" class="ds-avatar" type="button" aria-label="A">A</button>', 'getComputedStyle(el, "::after").display')).toBe('none');
  const ring = await probe(page, '<span id="probe" class="ds-avatar ds-avatar--ring">A</span>', '[style.outlineStyle, style.outlineColor]');
  expect(ring[0]).toBe('solid');
  const highlight = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'Highlight';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(ring[1]).toBe(highlight);
  const gray = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'GrayText';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await probe(page, '<button id="probe" class="ds-avatar" type="button" aria-label="A" disabled>A</button>', '[style.color, style.outlineColor]')).toEqual([gray, gray]);
});
