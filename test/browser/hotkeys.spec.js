/**
 * DS.hotkeys (js/hotkeys.js) in real engines: combos by platform, fields,
 * scopes, `within`, overlays masking what is behind them, the order of who
 * takes a key, data-ds-hotkey and the data of a shortcut sheet.
 * fixtures/a11y-hotkeys.html, on the ES modules of src/js/; runs in the
 * `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

async function open(page, { apple = false } = {}) {
  if (apple) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
      Object.defineProperty(navigator, 'userAgentData', { get: () => undefined });
    });
  }
  await page.goto('/test/browser/fixtures/a11y-hotkeys.html');
  await ready(page);
  await settle(page);
  // Focus on the page, away from any field.
  await page.locator('#first').focus();
}

/** Registers `combo`; each press adds `name` to window.fx.log. */
const bind = (page, combo, name, options = {}) => page.evaluate(([c, n, o]) => {
  if (o.withinId) o.within = document.getElementById(o.withinId);
  if (o.ownerId) o.owner = document.getElementById(o.ownerId);
  window.fx.hotkeys.register(c, () => { window.fx.log.push(n); return o.pass ? false : undefined; }, o);
}, [combo, name, options]);
const log = (page) => page.evaluate(() => window.fx.log);

test('mod is Control off Apple systems; the default of the page is prevented', async ({ page }) => {
  await open(page);
  await bind(page, 'mod+j', 'hit');
  await page.evaluate(() => { document.addEventListener('keydown', (event) => { window.fx.prevented = event.defaultPrevented; }); });
  await page.keyboard.press('Control+j');
  expect(await log(page)).toEqual(['hit']);
  await page.keyboard.press('Meta+j');
  expect(await log(page), 'Meta is no mod here').toEqual(['hit']);
  await page.keyboard.press('j');
  expect(await log(page), 'nor is nothing').toEqual(['hit']);
  await page.keyboard.press('Control+Shift+j');
  expect(await log(page), 'only the modifiers of the combo').toEqual(['hit']);
  const text = await page.evaluate(() => window.fx.hotkeys.format('mod+shift+j'));
  expect(text).toEqual({ keys: ['Ctrl', 'Shift', 'J'], text: 'Ctrl+Shift+J', aria: 'Control+Shift+J' });
});

test('mod is Command on Apple systems, and format() shows it', async ({ page }) => {
  await open(page, { apple: true });
  await bind(page, 'mod+j', 'hit');
  await page.keyboard.press('Control+j');
  expect(await log(page), 'Control is no mod here').toEqual([]);
  await page.keyboard.press('Meta+j');
  expect(await log(page)).toEqual(['hit']);
  const text = await page.evaluate(() => window.fx.hotkeys.format('mod+shift+j'));
  expect(text).toEqual({ keys: ['⇧', '⌘', 'J'], text: '⇧⌘J', aria: 'Shift+Meta+J' });
  expect(await page.evaluate(() => window.fx.hotkeys.isApple())).toBe(true);
});

test('a character is what it types: ? with its Shift; another alphabet by the place of the key', async ({ page }) => {
  await open(page);
  await bind(page, '?', 'help');
  await bind(page, 'mod+j', 'hit');
  await page.keyboard.press('Shift+Slash');
  expect(await log(page)).toEqual(['help']);
  await page.evaluate(() => document.getElementById('first').dispatchEvent(new KeyboardEvent('keydown', { key: 'о', code: 'KeyJ', ctrlKey: true, bubbles: true, cancelable: true })));
  expect(await log(page), 'a Cyrillic layout').toEqual(['help', 'hit']);
});

test('plain combos stay out of fields and key widgets; mod combos work there; fields changes it', async ({ page }) => {
  await open(page);
  await bind(page, 'j', 'plain');
  await bind(page, 'mod+j', 'mod');
  await bind(page, 'n', 'always', { fields: true });
  await bind(page, 'mod+m', 'never', { fields: false });
  await page.locator('#plain-field').focus();
  await page.keyboard.press('j');
  await expect(page.locator('#plain-field'), 'it types').toHaveValue('j');
  await page.keyboard.press('Control+j');
  await page.keyboard.press('n');
  await page.keyboard.press('Control+m');
  expect(await log(page)).toEqual(['mod', 'always']);
  await page.locator('#plain-field').fill('');
  await page.locator('#ada').focus();
  await page.keyboard.press('j');
  expect(await log(page), 'in a listbox: its type-ahead').toEqual(['mod', 'always']);
  for (const id of ['#readonly-field', '#check', '#first']) {
    await page.locator(id).focus();
    await page.keyboard.press('j');
  }
  expect(await log(page), 'a read-only field, a checkbox and a button type nothing').toEqual(['mod', 'always', 'plain', 'plain', 'plain']);
});

test('scopes: the one turned on last first; exclusive masks; destroy brings back', async ({ page }) => {
  await open(page);
  await bind(page, 'j', 'global');
  await bind(page, 'j', 'board', { scope: 'board' });
  await bind(page, 'k', 'only-global');
  await page.keyboard.press('j');
  expect(await log(page), 'a scope that is off').toEqual(['global']);
  await page.evaluate(() => { window.board = window.fx.hotkeys.scope('board'); });
  expect(await page.evaluate(() => window.fx.hotkeys.scopes())).toEqual(['board', 'global']);
  await page.keyboard.press('j');
  await page.keyboard.press('k');
  expect(await log(page), 'the scope wins, global still counts').toEqual(['global', 'board', 'only-global']);
  await page.evaluate(() => { window.editor = window.fx.hotkeys.scope('editor', { exclusive: true }); });
  expect(await page.evaluate(() => window.fx.hotkeys.scopes())).toEqual(['editor']);
  await page.keyboard.press('j');
  expect(await log(page), 'masked').toEqual(['global', 'board', 'only-global']);
  await page.evaluate(() => { window.editor.destroy(); window.editor.destroy(); window.board.destroy(); });
  await page.keyboard.press('j');
  expect((await log(page)).at(-1)).toBe('global');
});

test('the last registration wins, destroy() brings the earlier back, a handler that returns false passes on', async ({ page }) => {
  await open(page);
  await bind(page, 'j', 'early');
  await bind(page, 'j', 'late', { pass: true });
  await page.keyboard.press('j');
  expect(await log(page)).toEqual(['late', 'early']);
  await page.evaluate(() => {
    window.again = window.fx.hotkeys.register('j', () => { window.fx.log.push('again'); });
  });
  await page.keyboard.press('j');
  expect((await log(page)).slice(2)).toEqual(['again']);
  await page.evaluate(() => window.again.destroy());
  await page.keyboard.press('j');
  expect((await log(page)).slice(3)).toEqual(['late', 'early']);
});

test('within: only from there, the innermost first, before any scope', async ({ page }) => {
  await open(page);
  await bind(page, 'j', 'global');
  await bind(page, 'j', 'outer', { withinId: 'within-outer' });
  await bind(page, 'j', 'inner', { withinId: 'within-inner' });
  await page.keyboard.press('j');
  expect(await log(page), 'outside').toEqual(['global']);
  await page.locator('#within-outer').focus();
  await page.keyboard.press('j');
  await page.locator('#within-inner').focus();
  await page.keyboard.press('j');
  expect(await log(page)).toEqual(['global', 'outer', 'inner']);
});

test('an open overlay masks what is behind it; within, owner and overlays: true count', async ({ page }) => {
  await open(page);
  await bind(page, 'j', 'behind');
  await bind(page, 'k', 'in-dialog', { withinId: 'dialog' });
  await bind(page, 'n', 'owned', { ownerId: 'dialog-a' });
  await bind(page, 'm', 'everywhere', { overlays: true });
  await page.locator('#open-dialog').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dialog-a')).toBeFocused();
  for (const key of ['j', 'k', 'n', 'm', 'd']) await page.keyboard.press(key);
  expect(await log(page), 'the page behind stays out; the dialog\'s own data-ds-hotkey counts').toEqual(['in-dialog', 'owned', 'everywhere', 'dialog-a']);
  await page.locator('#dialog-b').press('Enter');
  await expect(page.locator('#open-dialog')).toBeFocused();
  await settle(page);
  await page.keyboard.press('j');
  expect((await log(page)).at(-1), 'closed: it counts again').toBe('behind');
});

test('the page comes first; a composing IME and a held key get nothing, repeat: true takes it', async ({ page }) => {
  await open(page);
  await bind(page, 'j', 'plain');
  await bind(page, 'k', 'held', { repeat: true });
  await page.evaluate(() => {
    document.getElementById('first').addEventListener('keydown', (event) => { if (event.key === 'x') event.preventDefault(); });
    window.fx.hotkeys.register('x', () => { window.fx.log.push('x'); });
    window.press = (init) => document.getElementById('first').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  });
  await page.keyboard.press('x');
  expect(await log(page), 'the page prevented it').toEqual([]);
  await page.evaluate(() => {
    window.press({ key: 'j', isComposing: true });
    window.press({ key: 'j', repeat: true });
    window.press({ key: 'k', repeat: true });
  });
  expect(await log(page)).toEqual(['held']);
});

test('data-ds-hotkey: presses the button or focuses the field; never when it could not take focus; aria-keyshortcuts', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Control+k');
  await page.keyboard.press('x');
  expect(await log(page), 'each alternative').toEqual(['hk-button', 'hk-button']);
  for (const key of ['y', 'u', 'i']) await page.keyboard.press(key);
  expect(await log(page), 'disabled, aria-disabled and hidden stay out').toEqual(['hk-button', 'hk-button']);
  await page.keyboard.press('o');
  expect((await log(page)).at(-1)).toBe('hk-named');

  await page.keyboard.press('Slash');
  await expect(page.locator('#hk-field'), 'a field takes focus').toBeFocused();
  await expect(page.locator('#hk-field'), 'and the key is not typed').toHaveValue('query');
  expect(await page.evaluate(() => { const field = document.getElementById('hk-field'); return [field.selectionStart, field.selectionEnd]; })).toEqual([0, 5]);

  await expect(page.locator('#hk-button')).toHaveAttribute('aria-keyshortcuts', 'Control+K X');
  await expect(page.locator('#hk-named'), 'the page\'s own stays').toHaveAttribute('aria-keyshortcuts', 'O');
});

test('data-ds-hotkey: attributes added and removed later follow, through DS.init()', async ({ page }) => {
  await open(page);
  await page.locator('#first').focus();
  await page.evaluate(() => document.getElementById('first').setAttribute('data-ds-hotkey', 'q'));
  await expect(page.locator('#first')).toHaveAttribute('aria-keyshortcuts', 'Q');
  await page.evaluate(() => { document.getElementById('first').addEventListener('click', () => window.fx.log.push('first')); });
  await page.keyboard.press('q');
  expect(await log(page)).toEqual(['first']);
  await page.evaluate(() => document.getElementById('first').removeAttribute('data-ds-hotkey'));
  await expect(page.locator('#first')).not.toHaveAttribute('aria-keyshortcuts', 'Q');
  await page.keyboard.press('q');
  expect(await log(page)).toEqual(['first']);
});

test('list() and onChange(): the data of a shortcut sheet', async ({ page }) => {
  await open(page);
  const data = await page.evaluate(() => {
    const { hotkeys } = window.fx;
    let changes = 0;
    const off = hotkeys.onChange(() => { changes += 1; });
    const save = hotkeys.register('mod+s', () => {}, { description: 'Save', group: 'Editing' });
    hotkeys.register(['j', 'down'], () => {}, { description: 'Next row', scope: 'board', group: 'Editing' });
    hotkeys.register('?', () => {}, { description: 'Show shortcuts' });
    hotkeys.register('h', () => {});
    const first = hotkeys.list({ apple: false });
    const active = hotkeys.list({ apple: false, activeOnly: true });
    hotkeys.register('mod+s', () => {}, { description: 'Save all', group: 'Editing' });
    const replaced = hotkeys.list({ apple: true });
    const before = changes;
    off();
    save.destroy();
    return { first, active, replaced, before, after: changes };
  });
  const editing = data.first.find((group) => group.name === 'Editing');
  expect(editing.items).toEqual([
    { description: 'Save', scope: 'global', active: true, combos: [{ combo: 'mod+s', keys: ['Ctrl', 'S'], text: 'Ctrl+S', aria: 'Control+S' }] },
    { description: 'Next row', scope: 'board', active: false, combos: [{ combo: 'j', keys: ['J'], text: 'J', aria: 'J' }, { combo: 'down', keys: ['↓'], text: '↓', aria: 'ArrowDown' }] },
  ]);
  expect(data.first.find((group) => group.name === 'General').items.map((item) => item.description)).toContain('Show shortcuts');
  expect(data.first.flatMap((group) => group.items).filter((item) => item.combos[0].combo === 'h'), 'no description: off the sheet').toEqual([]);
  expect(data.active.find((group) => group.name === 'Editing').items.map((item) => item.description)).toEqual(['Save']);
  const saves = data.replaced.find((group) => group.name === 'Editing').items.filter((item) => item.combos[0].combo === 'mod+s');
  expect(saves.map((item) => [item.description, item.combos[0].text]), 'the later one replaces it').toEqual([['Save all', '⌘S']]);
  expect(data.before, 'a change per registration').toBeGreaterThanOrEqual(5);
  expect(data.after, 'unsubscribed').toBe(data.before);
  // The markup of the page is on the sheet too.
  expect(data.first.find((group) => group.name === 'Devices').items[0].description).toBe('Search devices');
});

test('strings: the key names go through DS.core.config()', async ({ page }) => {
  await open(page);
  const text = await page.evaluate(() => {
    window.fx.core.config({ strings: { keyCtrl: 'Strg', keyShift: 'Umschalt', keyEnter: 'Eingabe' } });
    const result = window.fx.hotkeys.format('mod+shift+enter', { apple: false }).text;
    window.fx.core.config({ strings: { keyCtrl: null, keyShift: null, keyEnter: null } });
    return result;
  });
  expect(text).toBe('Strg+Umschalt+Eingabe');
});
