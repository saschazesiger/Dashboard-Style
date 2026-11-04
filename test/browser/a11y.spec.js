/**
 * DS.a11y (js/a11y.js) in real engines: trap() (Tab wraps, stray focus comes
 * back, traps stack, it rests under an overlay, snackbars stay usable, focus
 * returns), tabbables(), readsKeys(), typeahead() (search, cycling, what is
 * skipped and reached, next to roving()), and roving() and announce() as the
 * functions of DS.dom and DS.overlay. fixtures/a11y-hotkeys.html, on the ES
 * modules of src/js/; runs in the `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/a11y-hotkeys.html');
  await ready(page);
  await settle(page);
}

const focused = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

test('tabbables(): skips disabled, hidden, unseen and tabindex -1; a radio group counts once', async ({ page }) => {
  await open(page);
  const ids = await page.evaluate(() => window.fx.a11y.tabbables(document.getElementById('region')).map((node) => node.id));
  expect(ids).toEqual(['first', 'kind-b', 'field', 'open-dialog', 'last']);
  expect(await page.evaluate(() => window.fx.a11y.tabbables(null))).toEqual([]);
});

test('tabbables(): a disabled fieldset, a closed details, visibility and content-visibility of an ancestor stay out', async ({ page }) => {
  await open(page);
  const ids = (id) => page.evaluate((region) => window.fx.a11y.tabbables(document.getElementById(region)).map((node) => node.id), id);
  expect(await ids('fieldset-first')).toEqual(['fs-a', 'fs-b']);
  expect(await ids('closed-last')).toEqual(['cl-a', 'cl-summary']);
  await page.locator('#cl-summary').click();
  expect(await ids('closed-last'), 'open: its content counts').toEqual(['cl-a', 'cl-summary', 'cl-inside']);
  const answers = await page.evaluate(() => ['fs-off', 'cl-unseen', 'cl-skipped', 'cl-a'].map((id) => window.fx.a11y.canTakeFocus(document.getElementById(id))));
  expect(answers).toEqual([false, false, false, true]);
});

test('readsKeys(): fields and key widgets yes; read-only fields, checkboxes and buttons no', async ({ page }) => {
  await open(page);
  const answers = await page.evaluate(() => Object.fromEntries(['plain-field', 'choice', 'ada', 'readonly-field', 'check', 'first'].map((id) => [id, window.fx.a11y.readsKeys(document.getElementById(id))])));
  expect(answers).toEqual({ 'plain-field': true, choice: true, ada: true, 'readonly-field': false, check: false, first: false });
});

test('trap(): focus moves in, Tab and Shift+Tab wrap and walk in order', async ({ page }) => {
  await open(page);
  await page.locator('#before').focus();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('region')); });
  await expect(page.locator('#first'), 'the first tabbable').toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#last'), 'Shift+Tab wraps').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first'), 'Tab wraps').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#kind-b'), 'native order inside, the checked radio').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#field')).toBeFocused();
});

test('trap(): stray focus comes back; destroy() returns focus and is safe twice', async ({ page }) => {
  await open(page);
  await page.locator('#before').focus();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('region')); });
  await page.locator('#field').focus();
  await page.evaluate(() => document.getElementById('after').focus());
  await expect(page.locator('#field'), 'back to where it was inside').toBeFocused();
  // The same handle for the same container.
  expect(await page.evaluate(() => window.hold === window.fx.a11y.trap(document.getElementById('region')))).toBe(true);
  await page.evaluate(() => { window.hold.destroy(); window.hold.destroy(); });
  await expect(page.locator('#before'), 'focus returns').toBeFocused();
  await page.locator('#last').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#last'), 'no trap any more').not.toBeFocused();
});

test('trap(): initial, [autofocus], focus already inside, returnFocus, an empty region', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('region'), { initial: '#field', returnFocus: document.getElementById('after') }); });
  await expect(page.locator('#field')).toBeFocused();
  await page.evaluate(() => window.hold.destroy());
  await expect(page.locator('#after'), 'returnFocus').toBeFocused();

  await page.locator('#last').focus();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('region'), { returnFocus: false }); });
  await expect(page.locator('#last'), 'focus already inside stays').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
  await expect(page.locator('#last'), 'returnFocus: false').toBeFocused();

  await page.locator('#before').focus();
  await page.evaluate(() => {
    document.getElementById('field').setAttribute('autofocus', '');
    window.hold = window.fx.a11y.trap(document.getElementById('region'));
  });
  await expect(page.locator('#field'), '[autofocus]').toBeFocused();
  await page.evaluate(() => window.hold.destroy());

  await page.locator('#before').focus();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('region'), { initial: false }); });
  await expect(page.locator('#before'), 'initial: false leaves it').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first'), 'the next Tab goes in').toBeFocused();
  await page.evaluate(() => window.hold.destroy());

  await page.locator('#before').focus();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('empty-region')); });
  await expect(page.locator('#empty-region'), 'nothing to focus: the region itself').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#empty-region')).toBeFocused();
  await page.evaluate(() => window.hold.destroy());
  await expect(page.locator('#before')).toBeFocused();
  expect(await page.locator('#empty-region').getAttribute('tabindex'), 'its tabindex goes too').toBeNull();
});

test('trap(): a disabled fieldset first: focus goes in and Tab still works', async ({ page }) => {
  await open(page);
  await page.locator('#before').focus();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('fieldset-first')); });
  await expect(page.locator('#fs-a'), 'past the fieldset').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#fs-b')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#fs-a'), 'wraps past the fieldset').toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#fs-b'), 'and backwards').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
  await expect(page.locator('#before')).toBeFocused();
});

test('trap(): a closed details and a disabled fieldset last: Tab wraps from the summary', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('closed-last')); });
  await expect(page.locator('#cl-a')).toBeFocused();
  await page.locator('#cl-summary').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#cl-a'), 'wraps').toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#cl-summary'), 'and backwards').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
});

test('trap(): from a box inside the region that is no stop, Tab finds the next stop and wraps', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('box-last')); });
  await page.locator('#bl-end').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#bl-a'), 'nothing after it: wraps').toBeFocused();
  await page.locator('#bl-end').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#bl-b'), 'backwards: the stop before it').toBeFocused();
  await page.locator('#bl-middle').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#bl-b'), 'the next stop').toBeFocused();
  await page.locator('#bl-middle').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#bl-a'), 'the stop before').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
});

test('trap(): a region below the fold scrolls into view, and so does the return', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 300 });
  await open(page);
  await page.locator('#before').focus();
  await page.evaluate(() => { window.scrollTo(0, 0); window.hold = window.fx.a11y.trap(document.getElementById('box-last')); });
  await expect(page.locator('#bl-a'), 'the focused control').toBeFocused();
  await expect(page.locator('#bl-a'), 'can be seen').toBeInViewport();
  await page.locator('#bl-b').focus();
  await page.evaluate(() => { window.scrollTo(0, 0); document.getElementById('after').focus({ preventScroll: true }); });
  await expect(page.locator('#bl-b'), 'stray focus comes back').toBeFocused();
  await expect(page.locator('#bl-b'), 'into view').toBeInViewport();
  await page.evaluate(() => window.hold.destroy());
  await expect(page.locator('#before'), 'focus returns').toBeFocused();
  await expect(page.locator('#before'), 'into view').toBeInViewport();
});

test('trap(): in a shadow root focus returns to the opener in that root', async ({ page }) => {
  await open(page);
  const after = await page.evaluate(() => {
    const host = document.createElement('div');
    document.querySelector('.ds-theme').append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<button id="opener">Opener</button><section id="box"><button id="inside-a">A</button><button id="inside-b">B</button></section>';
    shadow.getElementById('opener').focus();
    const hold = window.fx.a11y.trap(shadow.getElementById('box'));
    const inside = shadow.activeElement.id;
    hold.destroy();
    return { inside, back: shadow.activeElement?.id };
  });
  expect(after).toEqual({ inside: 'inside-a', back: 'opener' });
});

test('trap(): the last one holds, destroying it wakes the one below', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.outer = window.fx.a11y.trap(document.getElementById('region'));
    window.inner = window.fx.a11y.trap(document.getElementById('inner-region'));
  });
  await expect(page.locator('#inner-first')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#inner-last'), 'the top trap wraps').toBeFocused();
  await page.evaluate(() => window.inner.destroy());
  await expect(page.locator('#first'), 'back in the lower trap').toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#last'), 'the lower trap holds again').toBeFocused();
  await page.evaluate(() => window.outer.destroy());
});

test('trap(): rests while a dialog is open, holds again after it closes', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('region')); });
  await page.locator('#open-dialog').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dialog-a'), 'the dialog keeps its focus').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#dialog-b'), 'Tab belongs to the dialog').toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#open-dialog'), 'focus returns to the opener').toBeFocused();
  await settle(page);
  await page.locator('#last').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first'), 'the trap holds again').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
});

test('trap(): a region inside an open dialog keeps holding', async ({ page }) => {
  await open(page);
  await page.locator('#open-dialog').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dialog-a')).toBeFocused();
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('dialog-region')); });
  await expect(page.locator('#dr-a')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#dr-b')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#dr-a'), 'it wraps inside the dialog').toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#dr-b'), 'and backwards').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
});

test('trap(): a dialog inside the trapped region makes it rest', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.hold = window.fx.a11y.trap(document.getElementById('outer-region')); });
  await expect(page.locator('#or-first')).toBeFocused();
  await page.locator('#or-open').focus();
  await page.evaluate(() => window.fx.overlay.open(document.getElementById('or-dialog'), { opener: document.getElementById('or-open') }));
  await expect(page.locator('#or-a'), 'the dialog has focus').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#or-b')).toBeFocused();
  await page.keyboard.press('Tab');
  // Holding, the trap would send this to #or-first, inert behind the dialog: focus would go nowhere.
  await expect(page.locator('#or-first'), 'Tab belongs to the dialog').not.toBeFocused();
  expect(await page.evaluate(() => document.getElementById('or-dialog').contains(document.activeElement) || document.activeElement === document.body), 'it stays in the dialog').toBe(true);
  await page.evaluate(() => window.fx.overlay.close(document.getElementById('or-dialog')));
  await expect(page.locator('#or-open'), 'focus returns to the opener').toBeFocused();
  await settle(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('#or-first'), 'the trap holds again').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
});

test('trap(): a snackbar stays usable above it, and the next Tab out returns', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.hold = window.fx.a11y.trap(document.getElementById('region'));
    window.fx.overlay.toast(document.getElementById('toasts'), 'Saved LAPTOP-0042.', { persistent: true, action: { label: 'Undo' } });
  });
  const action = page.locator('#toasts button').first();
  await action.focus();
  await expect(action, 'focus may sit on the snackbar').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#toasts button').last(), 'Tab walks its buttons').toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first'), 'from the end of the region: inside again').toBeFocused();
  await action.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#last'), 'and backwards').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
});

test('roving(): the function of DS.dom, one handle per container', async ({ page }) => {
  await open(page);
  const same = await page.evaluate(() => {
    const list = document.getElementById('people');
    const handle = window.fx.a11y.roving(list, { orientation: 'vertical', activate: false });
    const result = handle === window.fx.dom.roving(list);
    handle.destroy();
    return result;
  });
  expect(same).toBe(true);
});

test('typeahead(): a word, a cycling letter, skipped and reached items, a new search after the delay', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.hold = window.fx.a11y.typeahead(document.getElementById('people')); });
  await page.locator('#ada').focus();
  await page.keyboard.type('gr');
  await expect(page.locator('#grace'), 'a word').toBeFocused();
  await page.evaluate(() => document.getElementById('ada').focus());
  await page.waitForTimeout(700);
  await page.keyboard.press('a');
  await expect(page.locator('#alan'), 'aria-disabled is reached, its name is read').toBeFocused();
  await page.keyboard.press('a');
  await expect(page.locator('#ada'), 'one letter again: cycles').toBeFocused();
  await page.waitForTimeout(700);
  await page.keyboard.press('h');
  await expect(page.locator('#ada'), 'a hidden item is skipped: no match, no move').toBeFocused();
  await page.waitForTimeout(700);
  await page.keyboard.press('k');
  await expect(page.locator('#named'), 'by its aria-label').toBeFocused();
  await page.evaluate(() => window.hold.destroy());
  await page.waitForTimeout(700);
  await page.keyboard.press('b');
  await expect(page.locator('#named'), 'destroyed').toBeFocused();
});

test('typeahead(): a space within a word, an arrow starts over, a modifier and a field stay out', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.fx.a11y.typeahead(document.getElementById('people'));
    window.fx.a11y.typeahead(document.getElementById('with-field'));
    window.fx.pressed = 0;
    document.getElementById('people').addEventListener('keydown', (event) => { if (event.key === ' ' && event.defaultPrevented) window.fx.pressed += 1; });
    document.addEventListener('keydown', (event) => { if (event.key === ' ' && event.defaultPrevented) window.fx.pressed += 1; });
  });
  await page.locator('#ada').focus();
  await page.keyboard.type('barbara l');
  await expect(page.locator('#barbara')).toBeFocused();
  expect(await page.evaluate(() => window.fx.pressed), 'the space of the word prevented its default').toBeGreaterThan(0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('g');
  await expect(page.locator('#grace'), 'a navigation key starts a new search').toBeFocused();
  await page.waitForTimeout(700);
  await page.keyboard.press('Control+a');
  await expect(page.locator('#grace'), 'with a modifier: nothing').toBeFocused();
  await page.locator('#filter').focus();
  await page.keyboard.type('filter');
  await expect(page.locator('#filter'), 'the field keeps its letters').toBeFocused();
  await expect(page.locator('#filter')).toHaveValue('filter');
});

test('typeahead() next to roving(): the tab stop follows; onMatch and label replace the defaults', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const list = document.getElementById('people');
    window.fx.a11y.roving(list, { orientation: 'vertical', activate: false });
    window.fx.a11y.typeahead(list);
  });
  await page.locator('#ada').focus();
  await page.keyboard.press('g');
  await expect(page.locator('#grace')).toBeFocused();
  expect(await page.locator('#grace').getAttribute('tabindex'), 'the stop moved').toBe('0');
  expect(await page.locator('#ada').getAttribute('tabindex')).toBe('-1');

  await page.locator('#option-filter').focus();
  const matched = await page.evaluate(() => new Promise((resolve) => {
    window.fx.a11y.typeahead(document.getElementById('with-field'), { items: () => [document.getElementById('option-filter')], label: () => 'zebra', onMatch: (item) => resolve(item.id) });
    document.getElementById('option-filter').dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true }));
  }));
  expect(matched).toBe('option-filter');
});

test('typeahead(): with onMatch and aria-activedescendant the search goes on from the named item', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const list = document.getElementById('people');
    const seen = [];
    list.setAttribute('tabindex', '0');
    window.fx.a11y.typeahead(list, { onMatch: (item) => { seen.push(item.id); list.setAttribute('aria-activedescendant', item.id); } });
    list.focus();
    const press = (key) => list.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    press('a');
    press('a');
    press('a');
    return seen;
  });
  expect(seen, 'cycles, as with real focus').toEqual(['ada', 'alan', 'ada']);
});

test('typeahead(): current() names the item when nothing else does', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const list = document.getElementById('people');
    const seen = [];
    list.setAttribute('tabindex', '0');
    window.fx.a11y.typeahead(list, { current: () => document.getElementById('ada'), onMatch: (item) => seen.push(item.id) });
    list.focus();
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    return seen;
  });
  expect(seen).toEqual(['alan']);
});

test('typeahead(): an item in a disabled fieldset or a closed details is skipped', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const seen = [];
    const region = document.getElementById('closed-last');
    window.fx.a11y.typeahead(region, { items: 'button, summary', onMatch: (item) => seen.push(item.id) });
    const press = (key) => document.getElementById('cl-a').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    press('i'); // Inside, in the closed details.
    return seen;
  });
  expect(seen).toEqual([]);
});

test('announce(): says the text through the announcers, shows nothing', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.fx.a11y.announce('Device saved'));
  await expect(page.locator('.ds-sr[aria-live="polite"]')).toHaveText('Device saved');
  await expect(page.locator('.ds-toast'), 'no message').toHaveCount(0);
  await page.evaluate(() => window.fx.a11y.announce('Connection lost', { assertive: true }));
  await expect(page.locator('.ds-sr[aria-live="assertive"]')).toHaveText('Connection lost');
});
