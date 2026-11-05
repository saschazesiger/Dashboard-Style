/**
 * Split button (DS.splitbutton): one pill with two targets, the action and
 * a menu of related actions or of the action's variants.
 *
 *   <div class="ds-btn-group ds-split-btn" role="group" aria-label="Merge" data-ds-splitbutton>
 *     <button class="ds-btn ds-btn--filled ds-split-btn__action" type="button" value="merge">
 *       <span class="ds-split-btn__label">Merge</span></button>
 *     <button class="ds-btn ds-btn--filled ds-split-btn__toggle" type="button" aria-label="More merge options"
 *             aria-haspopup="menu" aria-expanded="false" aria-controls="merge-menu">(chevronDown 20, .ds-chevron)</button>
 *   </div>
 *   <div class="ds-menu" id="merge-menu" role="menu" aria-label="Merge options" hidden>...</div>
 *
 *   const merge = DS.splitbutton.create(group);   get(), set(value), on('change', fn), open(), close()
 *
 * The action is the page's: its click handler does the work (read
 * action.value for a choice). The toggle is a menu button (DS.menubutton):
 * a click, Enter or Space open the menu, ArrowDown on its first item,
 * ArrowUp on its last, Escape brings focus back to the toggle; the menu
 * opens under the toggle. Its menu: the toggle's aria-controls, else the
 * .ds-menu right after the group (or inside it). A toggle without a name
 * gets one from the strings: "More options for <action>" (moreOptionsFor).
 *
 * A choice (the menu holds menuitemradio items, the GitHub merge button):
 * the checked one is the action's variant. Its label shows in
 * .ds-split-btn__label, its value is written to the action's value
 * attribute, and a user's pick sends ds:change ({ value, item }) on the
 * group; set() from the page sends nothing; data-ds-value on the group is
 * the start.
 *
 * ES2022; no progressive feature.
 */
import { define, emit, t } from '../../js/core.js';
import { create as menuButton, menuOf } from '../menubutton/menubutton.js';

/** The parts of a split button: the action, the toggle and the menu. */
export function partsOf(group) {
  const toggle = group.querySelector('.ds-split-btn__toggle');
  const action = group.querySelector('.ds-split-btn__action') ?? [...group.querySelectorAll('.ds-btn')].find((button) => button !== toggle) ?? null;
  let menu = toggle ? menuOf(toggle, toggle.getAttribute('data-ds-menubutton') ?? '') : null;
  if (!menu) {
    const next = group.nextElementSibling;
    menu = group.querySelector('.ds-menu') ?? (next?.matches?.('.ds-menu') ? next : null);
  }
  return { action, toggle, menu };
}

/** The words of the action: its aria-label, else its text. */
const nameOf = (action) => (action?.getAttribute('aria-label') || action?.textContent || '').replace(/\s+/g, ' ').trim();

function controller(group, options, signal) {
  const { action, toggle, menu } = partsOf(group);
  const listeners = new Set();
  const local = new AbortController();
  signal?.addEventListener('abort', () => local.abort(), { once: true });
  // A name for the toggle when the markup gives none; kept in step with the action's label.
  const named = Boolean(toggle?.hasAttribute('aria-label') || toggle?.hasAttribute('aria-labelledby'));
  const name = () => {
    if (!named && toggle) toggle.setAttribute('aria-label', t('moreOptionsFor', { label: nameOf(action) }));
  };
  name();
  const label = action?.querySelector('.ds-split-btn__label') ?? null;
  const trigger = toggle ? menuButton(toggle, { menu, label, value: options.value ?? null }) : null;
  const sync = () => {
    const value = trigger?.get();
    if (action && value !== null && value !== undefined && action.getAttribute('value') !== value) action.setAttribute('value', value);
    name();
  };
  sync();
  const off = trigger?.on('change', ({ value, item }) => {
    sync();
    const detail = { value, item };
    emit(group, 'change', detail);
    for (const fn of [...listeners]) fn(detail);
  });
  local.signal.addEventListener('abort', () => {
    off?.();
    trigger?.destroy();
  }, { once: true });

  return {
    element: group,
    action,
    toggle,
    menu,
    get: () => trigger?.get() ?? null,
    set(value) {
      trigger?.set(value);
      sync();
    },
    on(type, fn) {
      if (type !== 'change' || typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    open: () => trigger?.open() ?? Promise.resolve(),
    close: () => trigger?.close() ?? Promise.resolve(),
    update(names) {
      if (names.includes('data-ds-value')) this.set(group.getAttribute('data-ds-value'));
    },
    destroy() {
      listeners.clear();
      local.abort();
    },
  };
}

/**
 * A split button driven from the page; the controller data-ds-splitbutton
 * makes. `value`: the start of a choice (else the checked radio).
 * @param {Element} group
 * @param {{ value?: string|null }} [options]
 */
export function create(group, options = {}) {
  return controller(group, options, null);
}

define('splitbutton', {
  attribute: 'data-ds-splitbutton',
  attributes: ['data-ds-value'],
  init: (group, ctx) => controller(group, { value: group.getAttribute('data-ds-value') }, ctx.signal),
});
