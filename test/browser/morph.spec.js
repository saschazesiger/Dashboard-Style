/**
 * DS.dom.morphHtml() in real engines: patched nodes keep their identity (a
 * progress transition runs), a field re-rendered on every keystroke keeps
 * focus, caret and value (a focused select its option, a focused radio the
 * choice of its group), a segmented control keeps its indicator, and a
 * keyed reorder takes the moveBefore path where it exists and insertBefore
 * elsewhere (the `fallback` project removes moveBefore) with one result. A
 * re-render during DS.motion.leave() skips an element being removed and
 * keeps one that leaves to stay inert.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/data.html');
  await ready(page);
  await settle(page);
}

test('patched nodes keep their identity, and a progress transition runs', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const form = document.getElementById('form');
    const markup = (share, label) => `<div class="ds-progress" style="--ds-progress: ${share}"><div class="ds-progress__track" role="progressbar" aria-label="Import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${share * 100}"><div class="ds-progress__bar"></div></div><p class="ds-progress__label">${label}</p></div>`;
    DS.dom.morphHtml(form, markup(0.2, '20%'));
    const before = [...form.querySelectorAll('*')];
    getComputedStyle(form.querySelector('.ds-progress')).getPropertyValue('--ds-progress');
    DS.dom.morphHtml(form, markup(0.6, '60%'));
    const after = [...form.querySelectorAll('*')];
    // The share glides on the .ds-progress element (a registered number the bar reads).
    const bar = form.querySelector('.ds-progress');
    return {
      same: before.length === after.length && before.every((node, index) => node === after[index]),
      label: form.querySelector('.ds-progress__label').textContent,
      valuenow: form.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),
      transitions: bar.getAnimations().map((animation) => animation.transitionProperty),
    };
  });
  expect(result).toEqual({ same: true, label: '60%', valuenow: '60', transitions: ['--ds-progress'] });
});

test('a field re-rendered on every keystroke keeps focus, caret and value', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const form = document.getElementById('form');
    const render = (value) => DS.dom.morphHtml(form, `<div class="ds-field"><label class="ds-field__label" for="device-name">Name</label><input class="ds-input" id="device-name" value="${value}" aria-describedby="device-name-hint"><small class="ds-field__hint" id="device-name-hint">${value.length} of 20 characters</small></div>`);
    render('');
    window.fxInput = form.querySelector('input');
    form.addEventListener('input', (event) => render(event.target.value));
  });
  const input = page.locator('#device-name');
  await input.focus();
  await page.keyboard.type('LAPTOP-42');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('00');
  const state = await page.evaluate(() => {
    const field = document.getElementById('device-name');
    return {
      same: field === window.fxInput,
      focused: document.activeElement === field,
      value: field.value,
      attribute: field.getAttribute('value'),
      caret: [field.selectionStart, field.selectionEnd],
      hint: document.getElementById('device-name-hint').textContent,
    };
  });
  expect(state).toEqual({ same: true, focused: true, value: 'LAPTOP-0042', attribute: 'LAPTOP-0042', caret: [9, 9], hint: '11 of 20 characters' });
});

test('a focused select keeps the option the user picked through a re-render that selects another', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.fxRender = (selected) => DS.dom.morphHtml(document.getElementById('form'), `<div class="ds-field"><label class="ds-field__label" for="fx-select">Plan</label><select class="ds-input" id="fx-select">${['a', 'b', 'c'].map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${value}</option>`).join('')}</select></div>`);
    window.fxRender('b');
  });
  await page.locator('#fx-select').focus();
  await page.locator('#fx-select').selectOption('c');
  const state = await page.evaluate(() => {
    window.fxRender('a');
    const kept = { value: document.getElementById('fx-select').value, focused: document.activeElement?.id };
    // Once focus has left, the next render brings the rendered choice.
    document.getElementById('fx-select').blur();
    window.fxRender('b');
    return { ...kept, after: document.getElementById('fx-select').value };
  });
  expect(state).toEqual({ value: 'c', focused: 'fx-select', after: 'b' });
});

test('a focused radio keeps the choice of its group through a re-render that checks another', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.fxRender = (checked) => DS.dom.morphHtml(document.getElementById('form'), `<div class="ds-radios" role="radiogroup" aria-label="Plan">${['a', 'b', 'c'].map((value) => `<label class="ds-radio"><input type="radio" name="fx-plan" id="r-${value}" value="${value}"${value === checked ? ' checked' : ''}><span><strong>${value}</strong></span></label>`).join('')}</div>`);
    window.fxRender('b');
  });
  await page.locator('#r-b').focus();
  await page.keyboard.press('ArrowDown');
  const state = await page.evaluate(() => {
    const picked = { focused: document.activeElement?.id, checked: document.querySelector('[name="fx-plan"]:checked')?.id };
    window.fxRender('a');
    const kept = { focused: document.activeElement?.id, checked: document.querySelector('[name="fx-plan"]:checked')?.id };
    document.activeElement.blur();
    window.fxRender('b');
    return { picked, kept, after: document.querySelector('[name="fx-plan"]:checked')?.id };
  });
  expect(state).toEqual({ picked: { focused: 'r-c', checked: 'r-c' }, kept: { focused: 'r-c', checked: 'r-c' }, after: 'r-b' });
});

test('a morphed segmented control keeps its indicator, and update() then glides', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const track = document.getElementById('segmented');
    const indicator = track.querySelector('.ds-indicator');
    const options = (current) => ['Live', 'Admin', 'Reports'].map((label) => `<a class="ds-segmented__option" href="#${label.toLowerCase()}"${label === current ? ' aria-current="true"' : ''}>${label}</a>`).join('');
    DS.dom.morphHtml(track, options('Admin'));
    const kept = track.querySelector('.ds-indicator') === indicator && track.firstElementChild === indicator;
    window.fixtureIndicators[0].update();
    return {
      kept,
      count: track.querySelectorAll('.ds-indicator').length,
      hasIndicator: track.classList.contains('ds-has-indicator'),
      instant: indicator.classList.contains('ds-indicator--instant'),
      gliding: indicator.getAnimations().length > 0,
      current: track.querySelector('[aria-current="true"]').textContent,
    };
  });
  expect(result).toEqual({ kept: true, count: 1, hasIndicator: true, instant: false, gliding: true, current: 'Admin' });
});

test('a keyed reorder moves the same nodes, through moveBefore where it exists', async ({ page, browserName, dsFallback }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const list = document.getElementById('list');
    // Focusable rows (the markup says so, so a patch keeps it).
    const markup = (names) => fxData.list(names).split('<li ').join('<li tabindex="-1" ');
    DS.dom.morphHtml(list, markup(fxData.names));
    const nodes = [...list.children];
    nodes[5].focus();
    const calls = { moveBefore: 0, insertBefore: 0 };
    // insertBefore lives on Node.prototype: the spy shadows it on Element.prototype and goes again.
    const spy = (name) => {
      const original = Element.prototype[name];
      if (typeof original !== 'function') return () => {};
      const own = Object.prototype.hasOwnProperty.call(Element.prototype, name);
      Element.prototype[name] = function (...args) {
        if (this === list) calls[name] += 1;
        return original.apply(this, args);
      };
      return () => {
        if (own) Element.prototype[name] = original;
        else delete Element.prototype[name];
      };
    };
    const undo = [spy('moveBefore'), spy('insertBefore')];
    const reversed = [...fxData.names].reverse();
    DS.dom.morphHtml(list, markup(reversed));
    undo.forEach((restore) => restore());
    const after = [...list.children];
    return {
      supported: typeof Element.prototype.moveBefore === 'function',
      calls,
      order: after.map((item) => item.getAttribute('data-ds-key')),
      same: after.every((node) => nodes.includes(node)) && after.length === nodes.length,
      focused: document.activeElement === nodes[5],
    };
  });
  expect(result.order).toEqual([...(await page.evaluate(() => fxData.names))].reverse());
  expect(result.same).toBe(true);
  expect(result.focused).toBe(true);
  if (dsFallback) expect(result.supported).toBe(false);
  if (browserName === 'chromium' && !dsFallback) expect(result.supported).toBe(true);
  if (result.supported) expect(result.calls).toEqual({ moveBefore: expect.any(Number), insertBefore: 0 });
  else expect(result.calls.insertBefore).toBeGreaterThan(0);
  expect(result.calls.moveBefore + result.calls.insertBefore).toBeGreaterThan(0);
});

test('a re-render during an unkeyed leave() patches the next item, not the leaving one', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const list = document.getElementById('list');
    list.innerHTML = '<li>A</li><li>B</li><li>C</li>';
    const shown = () => [...list.children].map((item) => `${item.textContent}${item.classList.contains('ds-leave') ? ' .ds-leave' : ''}${item.inert ? ' inert' : ''}`);
    const leaving = DS.motion.leave(list.children[1]);
    DS.dom.morphHtml(list, '<li>A</li><li>C (updated)</li>');
    const during = shown();
    await leaving;
    return { during, after: shown() };
  });
  expect(result.during).toEqual(['A', 'B .ds-leave inert', 'C (updated)']);
  expect(result.after).toEqual(['A', 'C (updated)']);
});

test('a re-render during leave(…, { then: "keep" }) patches the element and keeps it inert', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const form = document.getElementById('form');
    form.innerHTML = '<div class="fx-panel">Old</div>';
    const panel = form.firstElementChild;
    const leaving = DS.motion.leave(panel, 'sink', { then: 'keep' });
    DS.dom.morphHtml(form, '<div class="fx-panel">New</div>');
    await leaving;
    return { same: form.firstElementChild === panel, text: panel.textContent, inert: panel.inert, opacity: getComputedStyle(panel).opacity };
  });
  expect(result).toEqual({ same: true, text: 'New', inert: true, opacity: '0' });
});

/* ── 2.0: CSP-safe styles, equal shells, onKeep ───────────────────── */

test('under style-src \'self\' a morphed style applies without a violation, patched or inserted (2.0)', async ({ page }) => {
  await page.goto('/test/browser/fixtures/csp.html');
  await ready(page);
  const result = await page.evaluate(async () => {
    const target = document.getElementById('target');
    const box = document.getElementById('box');
    DS.dom.morphHtml(target, '<div class="fx-box" id="box" style="--x: 1; margin-top: 3px"></div><p class="fx-new" style="--y: 2">New</p>');
    // A violation event comes in a task of its own.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const added = target.querySelector('.fx-new');
    return {
      same: target.firstElementChild === box,
      x: getComputedStyle(box).getPropertyValue('--x').trim(),
      margin: getComputedStyle(box).marginTop,
      y: getComputedStyle(added).getPropertyValue('--y').trim(),
      violations: window.fxViolations,
    };
  });
  expect(result).toEqual({ same: true, x: '1', margin: '3px', y: '2', violations: [] });
});

test('stagger, countUp and an empty style leave identical nodes: { replace: true } keeps them (2.0)', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const list = document.getElementById('list');
    const markup = fxData.list(fxData.names.slice(0, 4), [1, 2, 3, 4]);
    DS.dom.morphHtml(list, markup);
    const before = [...list.children];
    await DS.motion.enterAll(before, 'fade');
    const figure = before[0].querySelector('.ds-num');
    await DS.motion.countUp(figure, 1, { from: 0 }).finished;
    const styles = before.map((item) => item.getAttribute('style')).concat(figure.getAttribute('style'));
    DS.dom.morphHtml(list, markup, { replace: true });
    // A blank style in the template equals none.
    DS.dom.morphHtml(list, markup.replace('<li class="fx-item"', '<li class="fx-item" style=" "'), { replace: true });
    return { styles, same: before.every((item, index) => list.children[index] === item) };
  });
  expect(result.styles.filter((value) => value !== null && !/\S/.test(value)), 'no empty style left behind').toEqual([]);
  expect(result.same).toBe(true);
});

test('onKeep tells the page which template a kept node now stands for (2.0)', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const list = document.getElementById('list');
    const rows = (pairs) => pairs.map(([key, load]) => `<li class="fx-item" data-ds-key="${key}" data-load="${load}">${key}</li>`).join('');
    DS.dom.morphHtml(list, rows([['LAPTOP-0042', 1], ['LAPTOP-0043', 2]]));
    const before = [...list.children];
    const kept = [];
    // The template's attributes say what the node now stands for (its children may have moved into the page).
    DS.dom.morphHtml(list, rows([['LAPTOP-0043', 7], ['LAPTOP-0042', 8]]), {
      onKeep: (node, template) => kept.push([before.indexOf(node), template.getAttribute('data-ds-key'), template.getAttribute('data-load')]),
    });
    return kept;
  });
  expect(result).toEqual([[1, 'LAPTOP-0043', '7'], [0, 'LAPTOP-0042', '8']]);
});

test('a style= in text, in a quoted value or in a textarea is left alone by the CSP-safe parse (2.0)', async ({ page }) => {
  await page.goto('/test/browser/fixtures/csp.html');
  await ready(page);
  const result = await page.evaluate(async () => {
    const target = document.getElementById('target');
    DS.dom.morphHtml(target, '<p data-tip=\'a style="x" > b\' style="--z: 4">width style="1"</p><textarea id="t"><b style="q"></textarea><svg viewBox="0 0 2 2" style="--w: 5"><rect width="1" height="1" style="fill: red"/></svg>');
    await new Promise((resolve) => setTimeout(resolve, 100));
    const p = target.querySelector('p');
    return {
      tip: p.getAttribute('data-tip'),
      text: p.textContent,
      z: getComputedStyle(p).getPropertyValue('--z').trim(),
      area: document.getElementById('t').value,
      w: getComputedStyle(target.querySelector('svg')).getPropertyValue('--w').trim(),
      fill: getComputedStyle(target.querySelector('rect')).fill,
      carriers: target.querySelectorAll('[data-ds-style]').length,
      violations: window.fxViolations,
    };
  });
  expect(result).toEqual({ tip: 'a style="x" > b', text: 'width style="1"', z: '4', area: '<b style="q">', w: '5', fill: 'rgb(255, 0, 0)', carriers: 0, violations: [] });
});
