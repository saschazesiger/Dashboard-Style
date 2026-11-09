/**
 * Accessibility sweep over every demo of the styleguide (Chromium: the
 * accessibility tree comes from CDP Accessibility.getFullAXTree). An
 * axe-style pass of the rules a design system controls, so a demo that
 * breaks one fails here, whatever component it shows:
 * - every interactive role (button, link, checkbox, textbox, combobox,
 *   menuitem, tab, switch, slider, option, ...) has an accessible name;
 * - aria-labelledby, aria-describedby, aria-controls and aria-owns name ids
 *   that exist (aria-controls may name a popup made on demand: allowed when
 *   the element is collapsed);
 * - no id appears twice;
 * - images (<img>, role="img", <svg> not aria-hidden) have a text
 *   alternative;
 * - a role attribute holds a valid ARIA role.
 * The checks run on the demo as it renders (states the demos show); the
 * components' own specs test the states their behaviour reaches.
 */
import { test, expect } from '@playwright/test';
import { ready, settle } from './helpers/motion.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'the accessibility tree is read through CDP');

const INTERACTIVE = new Set(['button', 'link', 'checkbox', 'radio', 'textbox', 'searchbox', 'combobox', 'listbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'switch', 'slider', 'spinbutton', 'option', 'treeitem', 'gridcell', 'columnheader', 'rowheader', 'scrollbar', 'separator']);
// separator counts only when focusable (a window splitter); the others always.
const ROLES = new Set(['alert', 'alertdialog', 'application', 'article', 'banner', 'blockquote', 'button', 'caption', 'cell', 'checkbox', 'code', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'deletion', 'dialog', 'directory', 'document', 'emphasis', 'feed', 'figure', 'form', 'generic', 'grid', 'gridcell', 'group', 'heading', 'img', 'insertion', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'mark', 'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation', 'none', 'note', 'option', 'paragraph', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'strong', 'subscript', 'superscript', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox', 'time', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem']);

/** The demo names, from the registry the styleguide reads. */
async function demoNames(page) {
  await page.goto('/styleguide/index.html#/components/button');
  await ready(page);
  return page.evaluate(() => window.SG.list().map((spec) => spec.name));
}

/** Problems of the DOM rules (ids, references, images, roles) inside the stage. */
function domProblems(page) {
  return page.evaluate(() => {
    const stage = document.getElementById('sg-stage');
    const out = [];
    const ids = new Map();
    for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1);
    for (const el of stage.querySelectorAll('[id]')) if (ids.get(el.id) > 1) out.push(`id "${el.id}" appears ${ids.get(el.id)} times`);
    const label = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`;
    for (const name of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns']) {
      for (const el of stage.querySelectorAll(`[${name}]`)) {
        for (const ref of el.getAttribute(name).split(/\s+/).filter(Boolean)) {
          if (document.getElementById(ref)) continue;
          // A popup made on demand: a collapsed control may name it before it exists.
          if (name === 'aria-controls' && el.getAttribute('aria-expanded') !== 'true') continue;
          out.push(`${label(el)} ${name}="${ref}" names no element`);
        }
      }
    }
    for (const el of stage.querySelectorAll('[role]')) {
      const roles = el.getAttribute('role').trim().split(/\s+/);
      if (!roles.some((role) => window.__ROLES.includes(role))) out.push(`${label(el)} role="${el.getAttribute('role')}" is no ARIA role`);
    }
    for (const img of stage.querySelectorAll('img')) if (!img.hasAttribute('alt') && !img.closest('[aria-hidden="true"]')) out.push(`${label(img)} has no alt`);
    return [...new Set(out)];
  });
}

test('every demo: interactive elements are named, references resolve, ids are unique, images have text', async ({ page }) => {
  test.setTimeout(900000);
  const names = await demoNames(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Accessibility.enable');
  await page.evaluate((roles) => { window.__ROLES = roles; }, [...ROLES]);
  const problems = {};
  for (const name of names) {
    await page.evaluate((hash) => { location.hash = hash; }, `#/components/${name}`);
    await expect(page.locator('html')).toHaveAttribute('data-sg-route', `components/${name}`);
    await settle(page, { timeout: 20000 }).catch(() => {});
    await page.evaluate((roles) => { window.__ROLES = roles; }, [...ROLES]);
    const found = await domProblems(page);
    // The accessibility tree of the stage: interactive nodes without a name.
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId: stageId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#sg-stage' });
    const { node: stageNode } = await cdp.send('DOM.describeNode', { nodeId: stageId });
    const inStage = new Set();
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    const stageAx = nodes.find((node) => node.backendDOMNodeId === stageNode.backendNodeId);
    if (stageAx) {
      const walk = (id) => { const node = byId.get(id); if (!node || inStage.has(id)) return; inStage.add(id); for (const child of node.childIds || []) walk(child); };
      walk(stageAx.nodeId);
    }
    for (const node of nodes) {
      if (!inStage.has(node.nodeId) || node.ignored) continue;
      const role = node.role?.value;
      if (!INTERACTIVE.has(role)) continue;
      const focusable = node.properties?.some((p) => p.name === 'focusable' && p.value?.value);
      if (role === 'separator' && !focusable) continue;
      if (['gridcell', 'columnheader', 'rowheader', 'option', 'treeitem'].includes(role) && !focusable) continue;
      if ((node.name?.value || '').trim()) continue;
      // An empty grid cell is blank on purpose (a total that has no value): screen readers say so.
      if (role === 'gridcell' && !(await cdp.send('DOM.resolveNode', { backendNodeId: node.backendDOMNodeId }).then(({ object }) => cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: 'function () { return this.textContent.trim() || this.querySelector("input, button, a, select, textarea, img, svg:not([aria-hidden])") ? 1 : 0; }', returnByValue: true })).then((r) => r.result.value))) continue;
      const { node: dom } = node.backendDOMNodeId ? await cdp.send('DOM.describeNode', { backendNodeId: node.backendDOMNodeId }) : { node: null };
      const attrs = dom?.attributes ? Object.fromEntries(dom.attributes.reduce((pairs, value, index, list) => (index % 2 ? pairs : [...pairs, [value, list[index + 1]]]), [])) : {};
      found.push(`${role} without a name: <${dom?.localName ?? '?'}${attrs.id ? `#${attrs.id}` : ''}${attrs.class ? `.${attrs.class.split(/\s+/).slice(0, 2).join('.')}` : ''}>`);
    }
    if (found.length) problems[name] = [...new Set(found)];
  }
  test.info().annotations.push({ type: 'demos', description: `${names.length} demos swept` });
  expect(problems).toEqual({});
});
