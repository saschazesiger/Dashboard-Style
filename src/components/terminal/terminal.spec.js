/**
 * The terminal frame: what it renders (the status chip, the key bar as a
 * toolbar), where the bar shows, the bytes a key sends with and without a
 * held modifier, a character typed into the screen with Ctrl held, the
 * focus staying in the screen, the toolbar's keyboard, set() and update(),
 * the theme's colours for an emulator, the options, the contrast of the
 * plain output, forced colours and the demo. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const ESC = '\u001b';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=terminal');
  await ready(page);
}

/** A fresh frame in the fixture, by the attribute path or by create(options); window.sent collects what send() got. */
async function mount(page, { attributes = {}, options = null, cls = '' } = {}) {
  await page.evaluate(({ attributes, options, cls }) => {
    document.querySelector('#probe')?.remove();
    window.sent = [];
    window.keys = [];
    const host = document.createElement('div');
    host.id = 'probe';
    host.className = `ds-terminal ${cls}`.trim();
    host.innerHTML = '<div class="ds-terminal__head"><span class="ds-terminal__title">ada@device-42: ~</span>'
      + '<span class="ds-terminal__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Reconnect">R</button></span></div>'
      + '<div class="ds-terminal__screen"><input id="probe-input" aria-label="Command" style="all: unset; inline-size: 100%"><pre><span data-fg="red">red</span> <span data-fg="green">green</span> <span data-fg="yellow">yellow</span> <span data-fg="blue">blue</span> <span data-fg="magenta">magenta</span> <span data-fg="cyan">cyan</span> <span data-fg="black">black</span> <span data-fg="white">white</span></pre></div>';
    for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value);
    host.addEventListener('ds:key', (event) => window.keys.push(event.detail));
    document.querySelector('#fx-component').prepend(host);
    if (options) window.probeFrame = DS.terminal.create(host, { ...options, send: (data) => window.sent.push(data) });
    else {
      host.setAttribute('data-ds-terminal', '');
      window.probeFrame = null;
    }
  }, { attributes, options, cls });
  const frame = page.locator('#probe');
  await expect(frame.locator('.ds-terminal__keys')).toHaveCount(1);
  await page.evaluate(() => {
    if (!window.probeFrame) {
      window.probeFrame = DS.core.get(document.querySelector('#probe'), 'terminal');
      window.probeFrame.set({ send: (data) => window.sent.push(data) });
    }
  });
  return frame;
}

const sent = (page) => page.evaluate(() => window.sent);

/** The page in the light scheme, or with the shipped dark theme. */
async function scheme(page, name) {
  await page.evaluate(async (name) => {
    let link = document.querySelector('#probe-dark');
    if (name === 'light') return link?.remove();
    if (link) return;
    link = document.createElement('link');
    link.id = 'probe-dark';
    link.rel = 'stylesheet';
    link.href = '/dist/themes/dark.css';
    const loaded = new Promise((resolve) => { link.onload = resolve; });
    document.head.append(link);
    await loaded;
  }, name);
}

test('renders the status chip and the key bar as a named toolbar; the frame is a group named by its title', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-status': 'connected', 'data-ds-terminal-bar': 'always' } });
  await expect(frame).toHaveAttribute('role', 'group');
  await expect(page.getByRole('group', { name: 'ada@device-42: ~' })).toHaveCount(1);
  const status = frame.getByRole('status');
  await expect(status).toHaveText('Connected');
  await expect(status).toHaveClass(/ds-status/);
  await expect(status).toHaveClass(/ds-tone-success/);
  await expect(status.locator('svg')).toHaveCount(1);
  // The chip sits between the title and the actions.
  expect(await frame.locator('.ds-terminal__head > *').evaluateAll((els) => els.map((el) => el.className.split(' ').find((name) => name.startsWith('ds-terminal__'))))).toEqual(['ds-terminal__title', 'ds-terminal__status', 'ds-terminal__actions']);
  const bar = frame.getByRole('toolbar', { name: 'Terminal keys' });
  await expect(bar).toBeVisible();
  // The frame gives the page's screen no id (a morph would take it for a key): aria-controls only names one it has.
  await expect(frame.locator('.ds-terminal__screen')).not.toHaveAttribute('id', /.*/);
  await expect(bar).not.toHaveAttribute('aria-controls', /.*/);
  const names = await bar.getByRole('button').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') || el.textContent));
  expect(names).toEqual(['Esc', 'Tab', 'Ctrl', 'Alt', 'Arrow left', 'Arrow up', 'Arrow down', 'Arrow right']);
  await expect(bar.getByRole('button', { name: 'Ctrl' })).toHaveAttribute('aria-pressed', 'false');
  await expect(bar.getByRole('button', { name: 'Alt' })).toHaveAttribute('aria-pressed', 'false');
  await expect(bar.getByRole('button', { name: 'Esc' })).not.toHaveAttribute('aria-pressed', /.*/);
  // One tab stop.
  expect(await bar.locator('[tabindex="0"]').count()).toBe(1);
  // A page's aria-label wins over the title.
  await page.evaluate(() => { const el = document.querySelector('#probe'); el.setAttribute('aria-label', 'Shell on device 42'); });
  await expect(frame).toHaveAccessibleName('Shell on device 42');
  // ... and stays when the title changes.
  await page.evaluate(() => window.probeFrame.set({ title: 'ada@device-42: /tmp' }));
  await expect(frame).toHaveAccessibleName('Shell on device 42');
});

test('the bar shows under a coarse pointer by default, always with "always", never with "off"', async ({ page }) => {
  await open(page);
  const frame = await mount(page);
  const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  await expect(frame).toHaveAttribute('data-bar', 'auto');
  if (coarse) await expect(frame.locator('.ds-terminal__keys')).toBeVisible();
  else await expect(frame.locator('.ds-terminal__keys')).toBeHidden();
  await page.evaluate(() => window.probeFrame.set({ bar: 'always' }));
  await expect(frame.locator('.ds-terminal__keys')).toBeVisible();
  await page.evaluate(() => window.probeFrame.set({ bar: 'off' }));
  await expect(frame.locator('.ds-terminal__keys')).toBeHidden();
  await page.evaluate(() => window.probeFrame.set({ bar: 'always', keys: [] }));
  await expect(frame.locator('.ds-terminal__keys')).toBeHidden();
});

test('a key sends its bytes through send() and ds:key; Ctrl and Alt are held for the next key, then let go', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { options: { bar: 'always', keys: ['esc', 'tab', 'ctrl', 'alt', 'left', 'up', 'down', 'right', 'pgup', '|'] } });
  const bar = frame.getByRole('toolbar');
  await bar.getByRole('button', { name: 'Esc' }).click();
  await bar.getByRole('button', { name: 'Tab' }).click();
  await bar.getByRole('button', { name: 'Arrow up' }).click();
  await bar.getByRole('button', { name: 'Arrow left' }).click();
  await bar.getByRole('button', { name: 'Page Up' }).click();
  await bar.getByRole('button', { name: '|' }).click();
  expect(await sent(page)).toEqual([ESC, '\t', `${ESC}[A`, `${ESC}[D`, `${ESC}[5~`, '|']);
  const ctrl = bar.getByRole('button', { name: 'Ctrl' });
  await ctrl.click();
  await expect(ctrl).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Ctrl held for the next key'))).toBe(true);
  await bar.getByRole('button', { name: 'Arrow up' }).click();
  await expect(ctrl).toHaveAttribute('aria-pressed', 'false');
  expect((await sent(page)).at(-1)).toBe(`${ESC}[1;5A`);
  const detail = await page.evaluate(() => window.keys.at(-1));
  expect(detail).toEqual({ key: 'up', data: `${ESC}[1;5A`, ctrl: true, alt: false });
  // Alt, then Alt again: let go, nothing sent.
  const alt = bar.getByRole('button', { name: 'Alt' });
  const before = (await sent(page)).length;
  await alt.click();
  await alt.click();
  await expect(alt).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Alt released'))).toBe(true);
  expect((await sent(page)).length).toBe(before);
  // Ctrl and Alt together on a key.
  await ctrl.click();
  await alt.click();
  await bar.getByRole('button', { name: 'Arrow right' }).click();
  expect((await sent(page)).at(-1)).toBe(`${ESC}[1;7C`);
  expect(await page.evaluate(() => window.probeFrame.get())).toMatchObject({ ctrl: false, alt: false });
});

test('with Ctrl held, the next character typed into the screen is sent as its control code; the emulator never sees it', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { options: { bar: 'always' } });
  const input = frame.locator('#probe-input');
  await input.focus();
  await frame.getByRole('button', { name: 'Ctrl' }).click();
  // The focus stayed in the screen.
  expect(await page.evaluate(() => document.activeElement.id)).toBe('probe-input');
  await page.keyboard.type('c');
  expect((await sent(page)).at(-1)).toBe('\u0003');
  await expect(input).toHaveValue('');
  await expect(frame.getByRole('button', { name: 'Ctrl' })).toHaveAttribute('aria-pressed', 'false');
  // Let go: typing reaches the emulator again.
  await page.keyboard.type('ls');
  await expect(input).toHaveValue('ls');
  expect(await sent(page)).toEqual(['\u0003']);
  // Alt, then x: ESC x.
  await frame.getByRole('button', { name: 'Alt' }).click();
  await page.keyboard.type('x');
  expect((await sent(page)).at(-1)).toBe(`${ESC}x`);
  await expect(input).toHaveValue('ls');
  // A press on any key keeps the focus where it was.
  await frame.getByRole('button', { name: 'Arrow down' }).click();
  expect(await page.evaluate(() => document.activeElement.id)).toBe('probe-input');
});

test('the toolbar keyboard: one tab stop, arrows, Home and End move; Enter and Space press', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-bar': 'always' } });
  const bar = frame.getByRole('toolbar');
  await frame.getByRole('button', { name: 'Reconnect' }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // The input of the screen first, then the bar.
  await expect(bar.getByRole('button', { name: 'Esc' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(bar.getByRole('button', { name: 'Tab' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(bar.getByRole('button', { name: 'Arrow right' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(bar.getByRole('button', { name: 'Esc' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await sent(page)).toEqual([ESC]);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(bar.getByRole('button', { name: 'Ctrl' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(bar.getByRole('button', { name: 'Ctrl' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  expect((await sent(page)).at(-1)).toBe('\t');
  // Tab leaves the bar: it is one stop.
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.closest('.ds-terminal__keys'))).toBeNull();
});

test('set() changes the status, the title and the keys, with ds:change; update() reads the attributes; destroy() cleans up', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-bar': 'always' } });
  await expect(frame.getByRole('status')).toHaveCount(0);
  await page.evaluate(() => { window.changes = []; document.querySelector('#probe').addEventListener('ds:change', (event) => window.changes.push(event.detail)); });
  await page.evaluate(() => window.probeFrame.set({ status: 'connecting' }));
  const status = frame.getByRole('status');
  await expect(status).toHaveText('Connecting');
  await expect(status).toHaveClass(/ds-status--running/);
  await expect(status.locator('.ds-spinner')).toHaveCount(1);
  const chip = await status.elementHandle();
  await page.evaluate(() => window.probeFrame.set({ status: 'disconnected', title: 'ada@device-42: /var/log' }));
  await expect(status).toHaveText('Disconnected');
  await expect(status).not.toHaveClass(/ds-tone-|running/);
  await expect(status.locator('svg')).toHaveCount(1);
  // The chip is the same element, so its colour glides.
  expect(await chip.evaluate((el) => el.isConnected)).toBe(true);
  await expect(frame.locator('.ds-terminal__title')).toHaveText('ada@device-42: /var/log');
  await expect(frame).toHaveAttribute('data-status', 'disconnected');
  expect(await page.evaluate(() => window.changes)).toEqual([
    { status: 'connecting', title: 'ada@device-42: ~' },
    { status: 'disconnected', title: 'ada@device-42: /var/log' },
  ]);
  await page.evaluate(() => window.probeFrame.set({ status: null }));
  await expect(frame.getByRole('status')).toHaveCount(0);
  await page.evaluate(() => {
    const el = document.querySelector('#probe');
    el.setAttribute('data-ds-terminal-keys', 'esc ctrl ~ nonsense');
    el.setAttribute('data-ds-terminal-status', 'connected');
  });
  await expect.poll(() => frame.locator('.ds-terminal__key').count()).toBe(3);
  await expect(frame.getByRole('status')).toHaveText('Connected');
  await page.evaluate(() => window.probeFrame.destroy());
  await expect(frame.locator('.ds-terminal__keys, .ds-terminal__status')).toHaveCount(0);
  expect(await frame.evaluate((el) => [el.getAttribute('role'), el.getAttribute('aria-label'), el.getAttribute('data-bar')])).toEqual([null, null, null]);
});

test('a status change keeps the focus on its key and the tab stop where it was', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-status': 'connecting', 'data-ds-terminal-bar': 'always' } });
  const bar = frame.getByRole('toolbar');
  await bar.getByRole('button', { name: 'Esc' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const ctrl = bar.getByRole('button', { name: 'Ctrl' });
  await expect(ctrl).toBeFocused();
  const before = await ctrl.elementHandle();
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-terminal-status', 'connected'));
  await expect(frame.getByRole('status')).toHaveText('Connected');
  await expect(ctrl).toBeFocused();
  // The bar was not rebuilt: the same button, still the one tab stop.
  expect(await ctrl.evaluate((el, old) => el === old, before)).toBe(true);
  await expect(bar.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(ctrl).toHaveAttribute('tabindex', '0');
  // New keys rebuild it; the focused key keeps the focus.
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-terminal-keys', 'tab ctrl up'));
  await expect(bar.getByRole('button')).toHaveCount(3);
  await expect(bar.getByRole('button', { name: 'Ctrl' })).toBeFocused();
  await expect(bar.getByRole('button', { name: 'Ctrl' })).toHaveAttribute('tabindex', '0');
});

test('a re-render of the page with DS.dom.morphHtml keeps the key bar, the status chip, the name and the page\'s nodes', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-status': 'connected', 'data-ds-terminal-bar': 'always' } });
  const result = await page.evaluate(() => {
    const host = document.querySelector('#probe');
    const wrap = document.createElement('div');
    wrap.id = 'probe-wrap';
    host.before(wrap);
    wrap.append(host);
    const action = host.querySelector('.ds-terminal__actions button');
    const screen = host.querySelector('.ds-terminal__screen');
    const html = (title) => '<div id="probe" class="ds-terminal" data-ds-terminal data-ds-terminal-status="connected" data-ds-terminal-bar="always">'
      + `<div class="ds-terminal__head"><span class="ds-terminal__title">${title}</span>`
      + '<span class="ds-terminal__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Reconnect">R</button></span></div>'
      + `<div class="ds-terminal__screen">${screen.innerHTML}</div></div>`;
    DS.dom.morphHtml(wrap, html('ada@device-42: ~'));
    DS.dom.morphHtml(wrap, html('ada@device-42: /var/log'));
    return { same: wrap.firstElementChild === host, action: host.querySelector('.ds-terminal__actions button') === action, screen: host.querySelector('.ds-terminal__screen') === screen };
  });
  expect(result).toEqual({ same: true, action: true, screen: true });
  await expect(frame).toHaveAttribute('role', 'group');
  await expect(frame).toHaveAttribute('data-bar', 'always');
  await expect(frame).toHaveAttribute('data-status', 'connected');
  await expect(frame.getByRole('toolbar', { name: 'Terminal keys' })).toBeVisible();
  await expect(frame.getByRole('status')).toHaveText('Connected');
  await expect(page.getByRole('group', { name: 'ada@device-42: /var/log' })).toHaveCount(1);
  expect(await frame.locator('.ds-terminal__head > *').evaluateAll((els) => els.map((el) => el.className.split(' ').find((name) => name.startsWith('ds-terminal__'))))).toEqual(['ds-terminal__title', 'ds-terminal__status', 'ds-terminal__actions']);
});

test('theme() gives an emulator the theme\'s colours of the place, the hooks and the scheme', async ({ page }) => {
  await open(page);
  await mount(page);
  const read = () => page.evaluate(() => DS.terminal.theme(document.querySelector('#probe')));
  const colours = await read();
  expect(Object.keys(colours)).toEqual(['background', 'foreground', 'cursor', 'cursorAccent', 'selectionBackground', 'selectionForeground', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite']);
  for (const value of Object.values(colours)) expect(value).toMatch(/^(rgb|color|oklab|oklch)\(/);
  const role = (name) => page.evaluate((name) => {
    const span = document.createElement('span');
    span.style.color = `var(${name})`;
    document.querySelector('#fx-component').append(span);
    const value = getComputedStyle(span).color;
    span.remove();
    return value;
  }, name);
  expect(colours.red).toBe(await role('--ds-error'));
  expect(colours.background).toBe(await role('--ds-code-bg'));
  expect(colours.brightRed).toBe(colours.red);
  expect(await page.locator('.ds-terminal__probe').count()).toBe(0);
  await page.evaluate(() => document.querySelector('#probe').style.setProperty('--ds-terminal-red', 'rgb(1, 2, 3)'));
  expect((await read()).red).toBe('rgb(1, 2, 3)');
  await scheme(page, 'dark');
  expect((await read()).background).not.toBe(colours.background);
});

test('options: size and density step the head, shape the corners, touch the keys; narrow hides the status word', async ({ page }) => {
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-bar': 'always', 'data-ds-terminal-status': 'connected' } });
  const head = (cls) => page.evaluate((cls) => {
    const probe = document.querySelector('#probe');
    probe.className = `ds-terminal ${cls}`.trim();
    return probe.querySelector('.ds-terminal__head').getBoundingClientRect().height;
  }, cls);
  expect(await head('')).toBe(48);
  expect(await head('ds-lg')).toBe(56);
  expect(await head('ds-sm')).toBe(40);
  expect(await head('ds-density-dense')).toBe(40);
  const radius = (cls) => page.evaluate((cls) => {
    const probe = document.querySelector('#probe');
    probe.className = `ds-terminal ${cls}`.trim();
    return parseFloat(getComputedStyle(probe).borderTopLeftRadius);
  }, cls);
  const base = await radius('');
  expect(base).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-soft')).toBeCloseTo(base / 2, 1);
  const key = frame.locator('.ds-terminal__key').first();
  await page.evaluate(() => { document.querySelector('#probe').className = 'ds-terminal'; });
  expect(await key.evaluate((el) => el.getBoundingClientRect().height)).toBe(40);
  await page.evaluate(() => { document.querySelector('#probe').className = 'ds-terminal ds-touch ds-density-dense'; });
  expect(await key.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
  // Narrower than a phone: the frame at 300px; the chip keeps its icon, its word is still read.
  await page.evaluate(() => { const probe = document.querySelector('#probe'); probe.className = 'ds-terminal'; probe.style.inlineSize = '300px'; });
  const word = frame.locator('.ds-terminal__status > span').last();
  expect(await word.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
  await expect(frame.getByRole('status')).toHaveText('Connected');
  expect(await frame.locator('.ds-terminal__status svg').evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(0);
  // Nothing spills sideways: the bar scrolls, the title ellipsizes.
  expect(await frame.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const keys = frame.locator('.ds-terminal__keys');
  expect(await keys.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
  // --fill: the screen takes the rest of the frame's box.
  await page.evaluate(() => {
    const probe = document.querySelector('#probe');
    probe.style.inlineSize = '';
    probe.className = 'ds-terminal ds-terminal--fill';
    const box = document.createElement('div');
    box.id = 'probe-box';
    box.style.blockSize = '300px';
    probe.before(box);
    box.append(probe);
  });
  const sizes = await frame.evaluate((el) => {
    const parts = ['.ds-terminal__head', '.ds-terminal__screen', '.ds-terminal__keys'].map((sel) => el.querySelector(sel).getBoundingClientRect().height);
    return { frame: el.getBoundingClientRect().height, parts };
  });
  expect(sizes.frame).toBe(300);
  expect(Math.round(sizes.parts.reduce((a, b) => a + b, 0))).toBe(298);
});

/** WCAG contrast of an element's text on the screen's ground. */
const contrastOf = (page, selector) => page.evaluate((selector) => {
  const el = document.querySelector(selector);
  const rgb = (value) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [a, b] = [lum(rgb(getComputedStyle(el).color)), lum(rgb(getComputedStyle(el.closest('.ds-terminal__screen')).backgroundColor))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}, selector);

test('the ANSI colours of plain output read at 4.5:1 on the screen, light and dark', async ({ page }) => {
  await open(page);
  await mount(page);
  for (const name of ['light', 'dark']) {
    await scheme(page, name);
    for (const colour of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
      expect(await contrastOf(page, `#probe [data-fg="${colour}"]`), `${name} ${colour}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('forced colours: the frame keeps its lines, a held Ctrl is Highlight, the status its icon and word', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const frame = await mount(page, { attributes: { 'data-ds-terminal-bar': 'always', 'data-ds-terminal-status': 'disconnected' } });
  const system = (property, value) => page.evaluate(({ property, value }) => {
    const probe = document.createElement('span');
    probe.style[property] = value;
    document.body.append(probe);
    const colour = getComputedStyle(probe)[property];
    probe.remove();
    return colour;
  }, { property, value });
  expect(await frame.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await system('color', 'CanvasText'));
  expect(await frame.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
  const ctrl = frame.getByRole('button', { name: 'Ctrl' });
  await ctrl.click();
  const highlight = await system('backgroundColor', 'Highlight');
  await page.mouse.move(0, 0);
  await expect.poll(() => ctrl.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(highlight);
  await expect(frame.getByRole('status')).toHaveText('Disconnected');
  await expect(frame.getByRole('status').locator('svg')).toHaveCount(1);
});

test('the demo renders without errors; the shell runs a command and Ctrl+C from the bar', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const shell = page.locator('[data-demo="shell"]');
  await expect(shell.getByRole('status')).toHaveText('Connected');
  const input = shell.getByRole('textbox', { name: 'Command' });
  await input.click();
  await page.keyboard.type('status');
  await page.keyboard.press('Enter');
  await expect(shell.locator('.ds-terminal__screen')).toContainText('battery');
  await shell.getByRole('button', { name: 'Ctrl' }).click();
  await page.keyboard.type('c');
  await expect(page.locator('[data-demo="bytes"]')).toContainText('^C');
  await shell.getByRole('button', { name: 'Arrow up' }).click();
  await expect(shell.getByRole('textbox', { name: 'Command' })).toHaveValue('status');
  await page.locator('[data-demo="retry"]').click();
  await expect(page.locator('[data-demo="dropped"]').getByRole('status')).toHaveText('Connecting');
  await expect(page.locator('[data-demo="dropped"]').getByRole('status')).toHaveText('Connected', { timeout: 10000 });
  await expect(page.locator('[data-demo="theme"]')).toContainText('DS.terminal.theme()');
  expect(errors).toEqual([]);
});
