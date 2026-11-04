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

test('plain keys stay off what a native control does with them; fields: true takes them', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.fx.clicks = 0;
    document.getElementById('first').addEventListener('click', () => { window.fx.clicks += 1; });
  });
  for (const key of ['space', 'enter', 'left', 'right', 'up', 'down', 'home', 'end', 'pageup', 'pagedown']) await bind(page, key, key);
  const clicks = () => page.evaluate(() => window.fx.clicks);

  await page.locator('#first').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  expect(await clicks(), 'a button is pressed by both').toBe(2);
  await page.keyboard.press('ArrowRight');
  expect(await log(page), 'an arrow means nothing on a button').toEqual(['right']);

  await page.locator('#check').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#check'), 'a checkbox checks').toBeChecked();

  await page.locator('#range').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#range'), 'a range moves').toHaveValue('4');
  await page.keyboard.press('Home');
  await expect(page.locator('#range'), 'to its start').toHaveValue('0');

  await page.locator('#kind-b').focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#kind-a'), 'a radio group moves').toBeChecked();
  expect(await log(page), 'none of those reached a shortcut').toEqual(['right']);

  const roles = await page.evaluate(() => {
    const area = document.getElementById('hotkey-area');
    const taken = {};
    for (const [role, key, code] of [['button', ' ', 'space'], ['link', 'Enter', 'enter'], ['checkbox', ' ', 'space'], ['switch', ' ', 'space'], ['slider', 'ArrowLeft', 'left'], ['radiogroup', 'ArrowDown', 'down'], ['tablist', 'ArrowRight', 'right'], ['grid', 'PageDown', 'pagedown'], ['toolbar', 'End', 'end']]) {
      const el = document.createElement('div');
      el.setAttribute('role', role);
      el.tabIndex = 0;
      area.append(el);
      const before = window.fx.log.length;
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      taken[`${role}:${code}`] = window.fx.log.length > before;
      el.remove();
    }
    return taken;
  });
  expect(Object.values(roles).some(Boolean), JSON.stringify(roles)).toBe(false);

  await page.locator('#within-outer').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  expect((await log(page)).slice(-2), 'on an element that uses neither they count').toEqual(['space', 'left']);

  await page.evaluate(() => { window.fx.hotkeys.register('space', () => { window.fx.log.push('forced'); }, { fields: true }); });
  await page.locator('#first').focus();
  const before = await clicks();
  await page.keyboard.press('Space');
  expect((await log(page)).at(-1), 'fields: true').toBe('forced');
  expect(await clicks(), 'and the button stays unpressed').toBe(before);
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

test('a contained dialog masks only inside its container: the page around it stays live', async ({ page }) => {
  await open(page);
  await bind(page, 'mod+j', 'global');
  await page.evaluate(() => window.fx.overlay.open(document.getElementById('contained'), { opener: document.getElementById('ch-open') }));
  await expect(page.locator('#contained-a')).toBeFocused();
  await page.keyboard.press('Control+j');
  expect(await log(page), 'from inside the dialog: masked').toEqual([]);
  await page.locator('#before').focus();
  await page.keyboard.press('Control+j');
  expect(await log(page), 'from the page around it: it runs').toEqual(['global']);
  // A full modal over the page masks again, past the contained dialog below or above it.
  await page.evaluate(() => window.fx.overlay.open(document.getElementById('dialog'), { opener: document.getElementById('before') }));
  await expect(page.locator('#dialog-a')).toBeFocused();
  await page.keyboard.press('Control+j');
  expect(await log(page), 'a modal on top: masked').toEqual(['global']);
  await page.evaluate(() => window.fx.overlay.close(document.getElementById('dialog')));
  await settle(page);
  await page.evaluate(() => window.fx.overlay.close(document.getElementById('contained')));
  await settle(page);
});

const topLayer = (page) => page.evaluate(() => window.fx.overlay.topmost()?.id ?? null);
const openDialog = async (page) => {
  await page.locator('#open-dialog').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dialog-a')).toBeFocused();
};
/** With no registration left, the registry's listener goes: the next one comes after the overlay's on the document. */
const overlayListensFirst = async (page) => {
  await page.evaluate(() => { for (const el of document.querySelectorAll('[data-ds-hotkey]')) el.removeAttribute('data-ds-hotkey'); });
  await settle(page);
  await openDialog(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#open-dialog')).toBeFocused();
  await settle(page);
  expect(await topLayer(page)).toBe(null);
};

for (const order of ['the registry listens first', 'the overlay listens first']) {
  test(`Escape stays the overlay's: overlays: true, owner and data-ds-hotkey leave it (${order})`, async ({ page }) => {
    await open(page);
    if (order === 'the overlay listens first') await overlayListensFirst(page);
    await bind(page, 'escape', 'everywhere', { overlays: true });
    await bind(page, 'esc', 'owned', { ownerId: 'dialog-a' });
    await page.evaluate(() => { document.getElementById('dialog-b').setAttribute('data-ds-hotkey', 'escape'); });
    await settle(page);
    await openDialog(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#open-dialog'), 'the dialog closes').toBeFocused();
    expect(await topLayer(page)).toBe(null);
    expect(await log(page), 'and no registration ran').toEqual([]);
    await settle(page);
    await page.keyboard.press('Escape');
    expect((await log(page)).length, 'no layer: it counts again').toBe(1);
  });

  test(`Escape: a widget inside the layer handles its own, whichever listens first (${order})`, async ({ page }) => {
    await open(page);
    if (order === 'the overlay listens first') await overlayListensFirst(page);
    await bind(page, 'escape', 'widget', { withinId: 'dialog-region' });
    await openDialog(page);
    await page.keyboard.press('Escape');
    expect(await log(page), 'pressed outside the widget: not its').toEqual([]);
    await expect(page.locator('#open-dialog'), 'the dialog closes').toBeFocused();
    await settle(page);
    await openDialog(page);
    await page.locator('#dr-a').focus();
    await page.keyboard.press('Escape');
    expect(await log(page)).toEqual(['widget']);
    expect(await topLayer(page), 'the widget took it: the dialog stays').toBe('dialog');
    await page.evaluate(() => window.fx.overlay.close(document.getElementById('dialog')));
    await settle(page);
  });

  test(`Escape: a within around the layer is no widget in it; a handler that passes leaves the key to the dialog, once (${order})`, async ({ page }) => {
    await open(page);
    if (order === 'the overlay listens first') await overlayListensFirst(page);
    await page.evaluate(() => {
      const { hotkeys, log } = window.fx;
      hotkeys.register('escape', () => { log.push('around'); }, { within: document.querySelector('.ds-theme') });
      hotkeys.register('escape', () => { log.push('passes'); return false; }, { within: document.getElementById('dr-b') });
    });
    await openDialog(page);
    await page.locator('#dr-b').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#open-dialog'), 'the dialog closes').toBeFocused();
    expect(await topLayer(page)).toBe(null);
    expect(await log(page), 'the handler inside ran once, the one around it not').toEqual(['passes']);
  });
}

test('a function key works from a field and takes the key; fields: false keeps it out', async ({ page }) => {
  await open(page);
  await bind(page, 'f2', 'help');
  await bind(page, 'f4', 'never', { fields: false });
  await page.locator('#plain-field').focus();
  await page.keyboard.press('F2');
  await page.keyboard.press('F4');
  expect(await log(page)).toEqual(['help']);
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

test('a held key runs nothing but keeps its default; a key the first press passed on keeps it not', async ({ page }) => {
  await open(page);
  await bind(page, 'mod+j', 'save');
  await bind(page, 'k', 'pass', { pass: true });
  const prevented = await page.evaluate(() => {
    const press = (init) => {
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
      document.getElementById('first').dispatchEvent(event);
      return event.defaultPrevented;
    };
    return [press({ key: 'j', ctrlKey: true }), press({ key: 'j', ctrlKey: true, repeat: true }), press({ key: 'k' }), press({ key: 'k', repeat: true })];
  });
  expect(prevented).toEqual([true, true, false, false]);
  expect(await log(page)).toEqual(['save', 'pass']);
});

test('data-ds-hotkey: presses the button or focuses the field; never when it could not take focus; aria-keyshortcuts', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Control+k');
  await page.keyboard.press('x');
  expect(await log(page), 'each alternative').toEqual(['hk-button', 'hk-button']);
  for (const key of ['y', 'u', 'i', 'v', 'f']) await page.keyboard.press(key);
  expect(await log(page), 'disabled, aria-disabled, hidden, visibility: hidden and a disabled fieldset stay out').toEqual(['hk-button', 'hk-button']);
  await page.keyboard.press('o');
  expect((await log(page)).at(-1)).toBe('hk-named');

  await page.keyboard.press('Slash');
  await expect(page.locator('#hk-field'), 'a field takes focus').toBeFocused();
  await expect(page.locator('#hk-field'), 'and the key is not typed').toHaveValue('query');
  expect(await page.evaluate(() => { const field = document.getElementById('hk-field'); return [field.selectionStart, field.selectionEnd]; })).toEqual([0, 5]);

  await expect(page.locator('#hk-button')).toHaveAttribute('aria-keyshortcuts', 'Control+K X');
  await expect(page.locator('#hk-named'), 'the page\'s own stays').toHaveAttribute('aria-keyshortcuts', 'O');
});

test('data-ds-hotkey: the element decides: a menu item is pressed, a read-only field takes focus', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Control+d');
  expect(await log(page), 'a button in a role=menu').toEqual(['hk-menuitem']);
  await expect(page.locator('#first'), 'focus stays where it was').toBeFocused();
  await page.keyboard.press('r');
  await expect(page.locator('#hk-readonly'), 'a read-only field').toBeFocused();
  expect(await page.evaluate(() => { const field = document.getElementById('hk-readonly'); return [field.selectionStart, field.selectionEnd]; }), 'selected').toEqual([0, 4]);
});

test('data-ds-hotkey: aria-keyshortcuts survives a re-render with morphHtml, and goes with the attribute', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const area = document.createElement('div');
    area.id = 'morph-area';
    area.innerHTML = '<button type="button" id="hk-morph" data-ds-hotkey="z">Z</button>';
    document.querySelector('.ds-theme').append(area);
  });
  const button = page.locator('#hk-morph');
  await expect(button).toHaveAttribute('aria-keyshortcuts', 'Z');
  await page.evaluate(() => window.fx.dom.morphHtml(document.getElementById('morph-area'), '<button type="button" id="hk-morph" data-ds-hotkey="z">Z</button>'));
  expect(await button.getAttribute('aria-keyshortcuts'), 'the same template').toBe('Z');
  await page.evaluate(() => window.fx.dom.morphHtml(document.getElementById('morph-area'), '<button type="button" id="hk-morph" data-ds-hotkey="z">Zed</button>'));
  await expect(button).toHaveText('Zed');
  expect(await button.getAttribute('aria-keyshortcuts'), 'another text').toBe('Z');
  await page.evaluate(() => document.getElementById('hk-morph').removeAttribute('data-ds-hotkey'));
  await expect(button, 'the claim goes with it').not.toHaveAttribute('aria-keyshortcuts');
  await page.evaluate(() => {
    const el = document.getElementById('hk-morph');
    el.setAttribute('aria-keyshortcuts', 'Q');
    window.fx.dom.morphHtml(document.getElementById('morph-area'), '<button type="button" id="hk-morph">Zed</button>');
  });
  expect(await button.getAttribute('aria-keyshortcuts'), 'no longer owned: the markup decides').toBeNull();
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

test('list(): a description follows the label as the page stands; a function is asked each time', async ({ page }) => {
  await open(page);
  const described = (combo) => page.evaluate((wanted) => window.fx.hotkeys.list({ apple: false }).flatMap((group) => group.items).find((item) => item.combos.some((each) => each.combo === wanted))?.description ?? null, combo);
  expect(await described('o')).toBe('Own name');
  await page.evaluate(() => { document.getElementById('hk-named').textContent = 'New text'; });
  expect(await described('o'), 'the text as it is now').toBe('New text');
  await page.evaluate(() => { document.getElementById('hk-named').setAttribute('aria-label', 'Renamed'); });
  expect(await described('o'), 'its aria-label first').toBe('Renamed');
  await page.evaluate(() => {
    window.label = 'One';
    window.fx.hotkeys.register('mod+e', () => {}, { description: () => window.label });
  });
  expect(await described('mod+e')).toBe('One');
  await page.evaluate(() => { window.label = 'Two'; });
  expect(await described('mod+e')).toBe('Two');
  await page.evaluate(() => { window.label = null; });
  expect(await described('mod+e'), 'none now: off the sheet').toBe(null);
});

test('list(): only keys that work are active; what is not shown is not listed', async ({ page }) => {
  await open(page);
  const rows = () => page.evaluate(() => Object.fromEntries(window.fx.hotkeys.list({ apple: false }).flatMap((group) => group.items).map((item) => [item.description, item.active])));
  const first = await rows();
  expect(first['Disabled'], 'disabled: on the sheet, off').toBe(false);
  expect(first['Blocked'], 'aria-disabled').toBe(false);
  expect(first['In fieldset'], 'a disabled fieldset').toBe(false);
  expect(first['Own name'], 'one that works').toBe(true);
  for (const name of ['Hidden', 'Invisible', 'In dialog']) expect(first[name], `${name}: not listed`).toBeUndefined();
  expect(first['Filter devices'], 'its label names a field').toBe(true);

  const active = await page.evaluate(() => window.fx.hotkeys.list({ apple: false, activeOnly: true }).flatMap((group) => group.items).map((item) => item.description));
  expect(active).not.toContain('Disabled');
  expect(active).toContain('Own name');

  await page.locator('#open-dialog').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dialog-a')).toBeFocused();
  expect((await rows())['In dialog'], 'its layer open: listed').toBe(true);

  await page.evaluate(() => {
    const later = document.createElement('button');
    later.setAttribute('data-ds-hotkey', 'o');
    later.setAttribute('aria-keyshortcuts', 'O');
    later.hidden = true;
    later.textContent = 'Own name for phones';
    document.getElementById('hotkey-area').append(later);
  });
  await expect.poll(async () => page.evaluate(() => window.fx.hotkeys.list({ apple: false }).flatMap((group) => group.items).map((item) => item.description)), 'a later one that is hidden replaces nothing').toContain('Own name');

  const custom = await page.evaluate(() => {
    let on = false;
    window.fx.hotkeys.register('mod+y', () => { window.fx.log.push('custom'); }, { description: 'Custom', available: () => on });
    const read = () => window.fx.hotkeys.list({ apple: false }).flatMap((group) => group.items).find((item) => item.description === 'Custom').active;
    const off = read();
    on = true;
    return [off, read()];
  });
  expect(custom, 'available() is asked at list() time').toEqual([false, true]);
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
