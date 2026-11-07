/**
 * The tree view: a row at every size x density x touch and the shape; the
 * APG keyboard (arrows, Home, End, `*`, type-ahead, Enter, Space, Tab to
 * the row's buttons); names and roles; single selection; tri-state checks;
 * lazy children with the busy state, a failure and the retry; drag to move
 * by keys and by pointer, refused drops; the chevron and group motion; forced
 * colours. Runs in the `fallback` project too (the group opens at once there).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard, setSpeed } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=tree';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const tree = (page, name) => page.locator(`[data-demo="${name}"]`);
const item = (page, name, key) => tree(page, name).locator(`[data-ds-key="${key}"]`);
const focusedKey = (page) => page.evaluate(() => document.activeElement?.getAttribute('data-ds-key') ?? document.activeElement?.getAttribute('aria-label'));

test('a row at every size x density: 8px per size, 4px per density from 40px, .ds-touch as a minimum; the indent 4px per size', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<ul class="ds-tree" role="tree" aria-label="Probe"><li class="ds-tree__item" role="treeitem" aria-expanded="true"><div class="ds-tree__row"><span class="ds-tree__toggle"></span><span class="ds-tree__label">Folder</span></div>'
            + '<ul class="ds-tree__group" role="group"><li class="ds-tree__item" role="treeitem"><div class="ds-tree__row"><span class="ds-tree__label">Leaf</span></div></li></ul></li></ul>';
          document.querySelector('#fx-component').append(region);
          const rows = region.querySelectorAll('.ds-tree__row');
          const labels = region.querySelectorAll('.ds-tree__label');
          out.push({
            touch, density, size,
            row: rows[0].getBoundingClientRect().height,
            line: Math.max(parseFloat(getComputedStyle(labels[0]).lineHeight), region.querySelector('.ds-tree__toggle').getBoundingClientRect().height),
            padX: parseFloat(getComputedStyle(rows[0]).paddingInlineEnd),
            toggle: region.querySelector('.ds-tree__toggle').getBoundingClientRect().width,
            indent: labels[1].getBoundingClientRect().left - labels[0].getBoundingClientRect().left,
          });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    expect(entry.row, `${name}: row`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 40 + step * 8 + density * 4, entry.line), 0);
    expect(entry.padX, `${name}: side padding`).toBeCloseTo(Math.max(0, 8 + density * 2), 1);
    expect(entry.toggle, `${name}: toggle`).toBeCloseTo(24 + step * 4, 1);
    // A leaf one level in: its label sits one indent further than its folder's.
    expect(entry.indent, `${name}: indent`).toBeCloseTo(20 + step * 4, 0);
  }
});

test('the shape multiplies the row radius; the chosen row takes the tint and the label weight', async ({ page }) => {
  await open(page);
  const radii = await page.evaluate(() => [['ds-shape-square', 0], ['ds-shape-soft', 0.5], ['', 1], ['ds-shape-round', 1.5]].map(([cls, factor]) => {
    const region = document.createElement('div');
    region.className = cls;
    region.innerHTML = '<ul class="ds-tree" role="tree" aria-label="Probe"><li class="ds-tree__item" role="treeitem"><div class="ds-tree__row"><span class="ds-tree__label">Row</span></div></li></ul>';
    document.querySelector('#fx-component').append(region);
    const radius = parseFloat(getComputedStyle(region.querySelector('.ds-tree__row')).borderTopLeftRadius);
    region.remove();
    return { factor, radius };
  }));
  const base = radii.find((entry) => entry.factor === 1).radius;
  expect(base).toBeGreaterThan(0);
  for (const { factor, radius } of radii) expect(radius).toBeCloseTo(base * factor, 1);
  const chosen = await item(page, 'files', 'plan').evaluate((el) => {
    const row = el.querySelector('.ds-tree__row');
    const accent = getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-accent').trim();
    const probe = document.createElement('i');
    probe.style.color = accent;
    document.body.append(probe);
    const tint = getComputedStyle(probe).color;
    probe.remove();
    return { bg: getComputedStyle(row).backgroundColor, tint, weight: getComputedStyle(row.querySelector('.ds-tree__label')).fontWeight };
  });
  expect(chosen.bg).toBe(chosen.tint);
  expect(Number(chosen.weight)).toBeGreaterThanOrEqual(500);
});

test('roles and names: the tree, each item named by its label alone, one tab stop on the chosen row', async ({ page }) => {
  await open(page);
  const files = tree(page, 'files');
  await expect(files).toHaveAttribute('role', 'tree');
  await expect(page.getByRole('treeitem', { name: 'Documents', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('treeitem', { name: 'Rollout plan.pdf', exact: true })).toHaveAttribute('aria-selected', 'true');
  const stops = await files.evaluate((el) => [...el.querySelectorAll('[role="treeitem"]')].filter((node) => node.tabIndex === 0).map((node) => node.dataset.dsKey));
  expect(stops).toEqual(['plan']);
  // The buttons of other rows wait out of the tab order; the chosen row's are in it.
  const buttons = await files.evaluate((el) => [...el.querySelectorAll('.ds-tree__actions button')].map((button) => [button.closest('[role="treeitem"]').dataset.dsKey, button.tabIndex]));
  for (const [key, index] of buttons) expect(index, key).toBe(key === 'plan' ? 0 : -1);
  await expect(tree(page, 'checks')).toHaveAttribute('aria-multiselectable', 'true');
  await expect(files).not.toHaveAttribute('aria-multiselectable', /.*/);
});

test('the keyboard: arrows walk and open, Home and End, type-ahead, * opens the siblings, Tab reaches the row buttons then leaves', async ({ page }) => {
  await open(page);
  await focusByKeyboard(page, item(page, 'files', 'plan'));
  expect(await focusedKey(page)).toBe('plan');
  await page.keyboard.press('ArrowUp');
  expect(await focusedKey(page)).toBe('docs');
  await page.keyboard.press('ArrowLeft');
  await expect(item(page, 'files', 'docs')).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowDown');
  expect(await focusedKey(page)).toBe('reports');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await expect(item(page, 'files', 'docs')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('plan');
  await page.keyboard.press('ArrowLeft');
  expect(await focusedKey(page)).toBe('docs');
  await page.keyboard.press('End');
  expect(await focusedKey(page)).toBe('archive');
  await page.keyboard.press('Home');
  expect(await focusedKey(page)).toBe('docs');
  await page.keyboard.press('c');
  expect(await focusedKey(page)).toBe('contracts');
  await page.keyboard.press('*');
  await expect(item(page, 'files', 'contracts')).toHaveAttribute('aria-expanded', 'true');
  // A folder that closes over the focus takes it.
  await page.keyboard.press('ArrowDown');
  expect(await focusedKey(page)).toBe('lease');
  await tree(page, 'files').evaluate((el) => DS.core.get(el, 'tree').expand('contracts', false));
  expect(await focusedKey(page)).toBe('contracts');
  await expect(item(page, 'files', 'contracts')).toHaveAttribute('tabindex', '0');
  // Tab: the focused row's button, then out of the tree.
  await item(page, 'files', 'inventory').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.getAttribute('aria-label'))).toBe('More for Device inventory.xlsx');
  await page.keyboard.press('Tab');
  const outside = await page.evaluate(() => Boolean(document.activeElement.closest('[data-demo="files"]')));
  expect(outside).toBe(false);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  expect(await focusedKey(page)).toBe('inventory');
});

test('single selection: Enter and Space choose a row, ds:select tells the page; a blocked row is reached but never chosen', async ({ page }) => {
  await open(page);
  await item(page, 'files', 'inventory').focus();
  await page.keyboard.press('Enter');
  await expect(item(page, 'files', 'inventory')).toHaveAttribute('aria-selected', 'true');
  await expect(item(page, 'files', 'plan')).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('[data-demo="files-out"]')).toHaveText('Chosen: Device inventory.xlsx');
  await page.keyboard.press('End');
  expect(await focusedKey(page)).toBe('archive');
  await page.keyboard.press(' ');
  await expect(item(page, 'files', 'archive')).toHaveAttribute('aria-selected', 'false');
  await item(page, 'files', 'plan').locator('.ds-tree__label').click();
  await expect(item(page, 'files', 'plan')).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => DS.core.get(document.querySelector('[data-demo="files"]'), 'tree').get())).toBe('plan');
  // The chevron opens and closes without choosing.
  await item(page, 'files', 'contracts').locator(':scope > .ds-tree__row > .ds-tree__toggle').click();
  await expect(item(page, 'files', 'contracts')).toHaveAttribute('aria-expanded', 'true');
  await expect(item(page, 'files', 'plan')).toHaveAttribute('aria-selected', 'true');
});

test('checkboxes: a check reaches the subtree, folders show what their children hold, a disabled child stays', async ({ page }) => {
  await open(page);
  const checks = tree(page, 'checks');
  await expect(item(page, 'checks', 'devices')).toHaveAttribute('aria-checked', 'mixed');
  expect(await item(page, 'checks', 'devices').locator(':scope > .ds-tree__row .ds-tree__check').evaluate((box) => box.indeterminate)).toBe(true);
  await item(page, 'checks', 'devices.write').locator('.ds-tree__label').click();
  await expect(item(page, 'checks', 'devices.write')).toHaveAttribute('aria-checked', 'true');
  // Retire is disabled and unchecked: it does not hold the folder at mixed.
  await expect(item(page, 'checks', 'devices')).toHaveAttribute('aria-checked', 'true');
  await item(page, 'checks', 'devices').focus();
  await page.keyboard.press(' ');
  await expect(item(page, 'checks', 'devices')).toHaveAttribute('aria-checked', 'false');
  await expect(item(page, 'checks', 'devices.read')).toHaveAttribute('aria-checked', 'false');
  await expect(item(page, 'checks', 'devices.retire')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[data-demo="checks-out"]')).toHaveText('Checked: tickets, tickets.read, tickets.close');
  expect(await checks.evaluate((el) => DS.core.get(el, 'tree').get())).toEqual(['tickets', 'tickets.read', 'tickets.close']);
  await checks.evaluate((el) => DS.core.get(el, 'tree').set(['devices.read']));
  await expect(item(page, 'checks', 'devices')).toHaveAttribute('aria-checked', 'mixed');
  await expect(item(page, 'checks', 'tickets')).toHaveAttribute('aria-checked', 'false');
  // A lazy folder's rows arrive in its state.
  await item(page, 'checks', 'people').locator('.ds-tree__label').click();
  await item(page, 'checks', 'people').locator(':scope > .ds-tree__row > .ds-tree__toggle').click();
  await expect(item(page, 'checks', 'people.read')).toHaveAttribute('aria-checked', 'true');
  await expect(item(page, 'checks', 'people')).toHaveAttribute('aria-checked', 'true');
});

test('lazy children: busy with a spinner, then loaded and announced; a failure says so in words and the next opening loads', async ({ page }) => {
  await open(page);
  const reports = item(page, 'files', 'reports');
  await reports.focus();
  await page.keyboard.press('ArrowRight');
  await expect(reports).toHaveAttribute('aria-busy', 'true');
  await expect(reports.locator('.ds-tree__spinner')).toHaveCount(1);
  await expect(reports).toHaveAttribute('aria-expanded', 'true');
  await expect(reports).not.toHaveAttribute('aria-busy', /.*/);
  await expect(reports.locator('[role="treeitem"]')).toHaveCount(3);
  await expect(page.getByRole('treeitem', { name: 'Q3 devices.pdf', exact: true })).toHaveAttribute('aria-selected', 'false');
  await expect(item(page, 'files', 'monthly')).toHaveAttribute('data-ds-tree-lazy', '');
  await expect(page.locator('.ds-sr, [aria-live]').filter({ hasText: 'Loaded Reports.' })).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('q3');

  const shared = item(page, 'files', 'shared');
  await shared.focus();
  await page.keyboard.press('ArrowRight');
  await expect(shared).toHaveAttribute('data-state', 'error');
  await expect(shared).toHaveAttribute('aria-expanded', 'false');
  await expect(shared.locator('.ds-tree__error')).toHaveText('Could not load');
  await page.keyboard.press('ArrowRight');
  await expect(shared).toHaveAttribute('aria-expanded', 'true');
  await expect(shared).not.toHaveAttribute('data-state', /.*/);
  await expect(shared.locator('.ds-tree__error')).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: 'Handbook.pdf', exact: true })).toBeVisible();
});

test('drag by keys: Space on the grip lifts, the arrows walk the places, Space drops into a folder; ds:drop tells the parent', async ({ page }) => {
  await open(page);
  const drag = tree(page, 'drag');
  await drag.evaluate((el) => {
    window.drops = [];
    el.addEventListener('ds:drop', (event) => window.drops.push([event.detail.item.dataset.dsKey, event.detail.to.parent?.dataset.dsKey ?? null, event.detail.to.index, event.detail.mode]));
  });
  const grip = item(page, 'drag', 'r-101').locator(':scope > .ds-tree__row > .ds-tree__grip');
  await expect(grip).toHaveAttribute('aria-label', 'Move Room 101');
  await item(page, 'drag', 'r-101').focus();
  await page.keyboard.press('Tab');
  await expect(grip).toBeFocused();
  await page.keyboard.press(' ');
  await expect(item(page, 'drag', 'r-101')).toHaveAttribute('data-ds-dragging', '');
  // Its own place is before Room 102; then before Lab, then into Lab.
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'drag', 'lab')).toHaveAttribute('data-ds-tree-drop', 'before');
  await expect(page.locator('.ds-sr').filter({ hasText: 'Before Lab, in Building A.' })).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'drag', 'lab')).toHaveAttribute('data-ds-tree-drop', 'inside');
  await expect(page.locator('.ds-sr').filter({ hasText: 'Into Lab.' })).toHaveCount(1);
  await page.keyboard.press(' ');
  await expect(item(page, 'drag', 'lab').locator('[data-ds-key="r-101"]')).toHaveCount(1);
  // The folder it went into opens, so the item (and the focus) stays in sight.
  await expect(item(page, 'drag', 'lab')).toHaveAttribute('aria-expanded', 'true');
  await expect(drag.locator('[data-ds-tree-drop]')).toHaveCount(0);
  expect(await page.evaluate(() => window.drops)).toEqual([['r-101', 'lab', 1, 'keyboard']]);
  await expect(page.locator('.ds-sr').filter({ hasText: 'Moved Room 101 to Lab, position 2 of 2.' })).toHaveCount(1);
  await expect(grip).toBeFocused();

  // Escape cancels: nothing moves.
  await page.keyboard.press(' ');
  await page.keyboard.press('Home');
  await page.keyboard.press('Escape');
  await expect(item(page, 'drag', 'lab').locator('[data-ds-key="r-101"]')).toHaveCount(1);
  await expect(drag.locator('[data-ds-tree-drop]')).toHaveCount(0);

  // A refused drop goes back.
  await drag.evaluate((el) => el.addEventListener('ds:drop', (event) => event.preventDefault(), { once: true }));
  await item(page, 'drag', 'r-201').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press(' ');
  await page.keyboard.press('Home');
  await page.keyboard.press(' ');
  await expect(item(page, 'drag', 'b-b').locator('[data-ds-key="r-201"]')).toHaveCount(1);
});

test('drag by pointer: over a closed folder it frames the row, above a row a line; the drop moves the subtree', async ({ page }) => {
  await open(page);
  const grip = item(page, 'drag', 'r-102').locator(':scope > .ds-tree__row > .ds-tree__grip');
  await grip.scrollIntoViewIfNeeded();
  const from = await grip.boundingBox();
  const storage = await item(page, 'drag', 'storage').locator(':scope > .ds-tree__row').boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 10, { steps: 3 });
  await page.mouse.move(from.x + from.width / 2, storage.y + storage.height / 2, { steps: 12 });
  await expect(item(page, 'drag', 'storage')).toHaveAttribute('data-ds-tree-drop', 'inside');
  await page.mouse.up();
  await expect(item(page, 'drag', 'storage').locator('[data-ds-key="r-102"]')).toHaveCount(1);
  await settle(page);
  await expect(item(page, 'drag', 'r-102')).not.toHaveAttribute('data-ds-dragging', /.*/);
});

test('motion: the chevron turns a quarter on the spring; where interpolate-size runs, the group glides its height', async ({ page }) => {
  await open(page);
  const docs = item(page, 'files', 'docs');
  const chevron = docs.locator(':scope > .ds-tree__row > .ds-tree__toggle > svg');
  const turn = await chevron.evaluate((el) => {
    const style = getComputedStyle(el);
    return { rotate: style.rotate, property: style.transitionProperty, easing: style.transitionTimingFunction };
  });
  expect(turn.rotate).toBe('90deg');
  expect(turn.property).toContain('rotate');
  expect(turn.easing).toContain('linear(');
  // Slowed, so a loaded machine still sees the close run.
  await setSpeed(page, 0.1);
  await docs.focus();
  await page.keyboard.press('ArrowLeft');
  const group = docs.locator(':scope > .ds-tree__group');
  const glides = await page.evaluate(() => CSS.supports('interpolate-size', 'allow-keywords'));
  if (glides) {
    const running = await group.evaluate((el) => el.getAnimations().map((animation) => animation.transitionProperty));
    expect(running).toContain('height');
  }
  await settle(page, { timeout: 8000 });
  expect(await group.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  expect(await chevron.evaluate((el) => getComputedStyle(el).rotate)).toBe('none');
});

test('forced colours: the chosen row is SelectedItem, a blocked row GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('#fx-component').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { selected: probe('backgroundColor', 'SelectedItem'), selectedText: probe('color', 'SelectedItemText'), gray: probe('color', 'GrayText') };
  });
  const chosen = await item(page, 'files', 'plan').locator(':scope > .ds-tree__row').evaluate((row) => ({ bg: getComputedStyle(row).backgroundColor, ink: getComputedStyle(row.querySelector('.ds-tree__label')).color, meta: getComputedStyle(row.querySelector('.ds-tree__meta')).color }));
  expect(chosen.bg).toBe(system.selected);
  expect(chosen.ink).toBe(system.selectedText);
  expect(chosen.meta).toBe(system.selectedText);
  const blocked = await item(page, 'files', 'archive').locator(':scope > .ds-tree__row').evaluate((row) => getComputedStyle(row).color);
  expect(blocked).toBe(system.gray);
});

test('loader data: an href that is relative, a fragment, http(s) or mailto becomes a link; javascript: and data: stay text', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const el = document.createElement('ul');
    el.className = 'ds-tree';
    el.setAttribute('role', 'tree');
    el.setAttribute('aria-label', 'Probe');
    el.innerHTML = '<li class="ds-tree__item" role="treeitem" aria-expanded="false" data-ds-tree-lazy data-ds-key="root"><div class="ds-tree__row"><span class="ds-tree__toggle"></span><span class="ds-tree__label">Root</span></div></li>';
    document.querySelector('#fx-component').append(el);
    const hrefs = ['#a', '/files/a', 'https://example.com/a', 'mailto:ada@example.com', 'javascript:alert(1)', ' JAVASCRIPT:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x'];
    const files = DS.tree.create(el, { select: 'none', load: () => hrefs.map((href, index) => ({ id: `l${index}`, label: `Link ${index}`, href })) });
    return files.expand('root').then(() => {
      const result = hrefs.map((_, index) => {
        const label = el.querySelector(`[data-ds-key="l${index}"] .ds-tree__label`);
        return label.localName === 'a' ? label.getAttribute('href') : null;
      });
      files.destroy();
      el.remove();
      return result;
    });
  });
  expect(out).toEqual(['#a', '/files/a', 'https://example.com/a', 'mailto:ada@example.com', null, null, null, null]);
});

test('large: an arrow key moves the tab stop without a pass over every row (2000 rows, 20 presses)', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const el = document.createElement('ul');
    el.className = 'ds-tree';
    el.setAttribute('role', 'tree');
    el.setAttribute('aria-label', 'Large');
    el.innerHTML = Array.from({ length: 2000 }, (_, index) => `<li class="ds-tree__item" role="treeitem" tabindex="-1" data-ds-key="r${index}"><div class="ds-tree__row"><span class="ds-tree__label">Row ${index}</span><span class="ds-tree__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs" type="button" aria-label="Open row ${index}">o</button></span></div></li>`).join('');
    document.querySelector('#fx-component').append(el);
    const files = DS.tree.create(el);
    el.querySelector('[role="treeitem"]').focus();
    // The DOM queries the presses make: a pass over every row makes thousands each, a move of the tab stop a few.
    // Counted, not timed, so a busy machine cannot fail it.
    let queries = 0;
    const originals = { one: Element.prototype.querySelector, all: Element.prototype.querySelectorAll };
    Element.prototype.querySelector = function (...args) { queries += 1; return originals.one.apply(this, args); };
    Element.prototype.querySelectorAll = function (...args) { queries += 1; return originals.all.apply(this, args); };
    const start = performance.now();
    try {
      for (let step = 0; step < 20; step += 1) {
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      }
    } finally {
      Element.prototype.querySelector = originals.one;
      Element.prototype.querySelectorAll = originals.all;
    }
    const time = performance.now() - start;
    const focused = document.activeElement.getAttribute('data-ds-key');
    const stops = [...el.querySelectorAll('[tabindex="0"]')].map((node) => node.getAttribute('data-ds-key') ?? node.closest('[role="treeitem"]').getAttribute('data-ds-key'));
    files.destroy();
    el.remove();
    return { queries, time, focused, stops };
  });
  expect(result.focused).toBe('r20');
  // The one tab stop moved with it: the row and its button, nothing left behind.
  expect(result.stops).toEqual(['r20', 'r20']);
  // A handful of queries a press (a full pass made over 15,000).
  expect(result.queries, `${result.queries} queries in ${Math.round(result.time)}ms`).toBeLessThan(20 * 20);
});

test('rows a reload replaced are not kept alive by the tree', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'counts live objects through the Chrome DevTools Protocol');
  await open(page);
  await page.evaluate(async () => {
    const el = document.createElement('ul');
    el.className = 'ds-tree';
    el.setAttribute('role', 'tree');
    el.setAttribute('aria-label', 'Reloads');
    el.innerHTML = '<li class="ds-tree__item" role="treeitem" aria-expanded="false" data-ds-tree-lazy data-ds-key="root"><div class="ds-tree__row"><span class="ds-tree__toggle"></span><span class="ds-tree__label">Root</span></div></li>';
    document.querySelector('#fx-component').append(el);
    let round = 0;
    window.__reloads = DS.tree.create(el, { load: () => { round += 1; return Array.from({ length: 100 }, (_, index) => ({ id: `n${round}-${index}`, label: `Node ${index}` })); } });
    await window.__reloads.expand('root');
    for (let step = 0; step < 20; step += 1) {
      await window.__reloads.reload('root');
      // A microtask for the observer's pass over the new rows.
      await new Promise((resolve) => setTimeout(resolve));
    }
  });
  const client = await page.context().newCDPSession(page);
  await client.send('HeapProfiler.collectGarbage');
  const { result: proto } = await client.send('Runtime.evaluate', { expression: 'HTMLLIElement.prototype' });
  const { objects } = await client.send('Runtime.queryObjects', { prototypeObjectId: proto.objectId });
  const { result: count } = await client.send('Runtime.callFunctionOn', { objectId: objects.objectId, functionDeclaration: 'function () { return this.length; }', returnByValue: true });
  const inDocument = await page.evaluate(() => document.querySelectorAll('li').length);
  // 21 rounds of 100 rows were made; only about the last round's should live.
  expect(count.value).toBeLessThan(inDocument + 150);
  await page.evaluate(() => window.__reloads.destroy());
});
