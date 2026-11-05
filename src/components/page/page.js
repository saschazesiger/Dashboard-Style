/**
 * Page head (DS.page): a sticky head that condenses once the reader has
 * scrolled, and actions that fold into a More menu by width.
 *
 *   <header class="ds-page-head ds-page-head--sticky" data-ds-page-head> ... </header>
 *   const head = DS.page.create(header, { condense: true });
 *   head.get();  head.set(true);  head.refresh();  head.on('change', ({ condensed }) => ...);
 *
 * Condensing (a .ds-page-head--sticky head; data-ds-page-head-condense="off"
 * keeps it whole): the scroller is the nearest scrolling ancestor of the
 * head, else the page. Once the reader has scrolled past what folds (the
 * back link or breadcrumbs, the lead, the status, the key facts), the head
 * takes data-scrolled and the stylesheet folds those parts away; back at the
 * top it gives it up. While the head changes height the module moves the
 * scroll by as much, so the content under it stays where it was and nothing
 * jumps; a change that would leave the scroll at the top again is undone,
 * so the head never flickers. One passive scroll listener on the scroller,
 * throttled to a frame.
 *
 * Folding actions (any head with .ds-page-head__actions): the module writes
 * a More button (.ds-page-head__more, a quiet icon button named by the
 * string moreActions) and its .ds-menu after the actions. The actions that
 * do not fit the title row hide (owned `hidden`), first to last with the
 * filled ones last, and the menu lists them: its items press the action
 * (a click on the hidden button, or the link's address), with its icon,
 * label and blocked state. A ResizeObserver on the row and a
 * MutationObserver on the actions lay them out again.
 *
 * Owned state (DS.dom.morphHtml keeps it): data-scrolled on the head, hidden
 * on the folded actions. The More button and its menu are the system's own
 * (data-ds-keep). Events: ds:change ({ condensed }) on the head.
 *
 * ES2022. Progressive: none (ResizeObserver and MutationObserver are at the
 * floor; without them, in a test fake, the actions lay out once).
 */
import { define, emit, t } from '../../js/core.js';
import { own, disown } from '../../js/dom.js';
import { iconElement, moreVertical } from '../../js/icons.js';
import { open as openMenu, close as closeMenu } from '../menu/menu.js';

/** The numbering of the ids this module writes (More menus). */
let serial = 0;

/** px of scroll that count as the top: the head unfolds at or above it. */
const TOP = 1;

/**
 * Which actions fold, in a row of `room` px: none when all of them fit;
 * otherwise they fold in `order` (indices, the first folds first) until the
 * ones left and the More button (`more` px) fit. `gap` is the room between
 * two. Returns the folded indices, sorted.
 * @param {number[]} widths
 * @param {{ room: number, gap?: number, more?: number, order?: number[] }} options
 * @returns {number[]}
 */
export function fold(widths, options) {
  const { room, gap = 0, more = 0, order = widths.map((_, index) => index) } = options;
  const need = (kept, withMore) => {
    const parts = kept.map((index) => widths[index]);
    if (withMore) parts.push(more);
    return parts.length ? parts.reduce((sum, width) => sum + width, 0) + gap * (parts.length - 1) : 0;
  };
  const all = widths.map((_, index) => index);
  if (need(all, false) <= room) return [];
  const folded = new Set();
  for (const index of order) {
    folded.add(index);
    if (need(all.filter((each) => !folded.has(each)), true) <= room) break;
  }
  return [...folded].sort((a, b) => a - b);
}

/** Whether an element scrolls on the block axis. */
function scrolls(element, view) {
  const style = view.getComputedStyle(element);
  return /(auto|scroll|overlay)/.test(style.overflowY) && element.scrollHeight > element.clientHeight;
}

/** The nearest scrolling ancestor of `element`, or null for the page. */
function scrollerOf(element, view) {
  const doc = element.ownerDocument;
  for (let node = element.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    if (scrolls(node, view)) return node;
  }
  return null;
}

/** The text an action is known by: its label, else its aria-label or title. */
function labelOf(action) {
  const copy = action.cloneNode(true);
  for (const part of copy.querySelectorAll('svg, .ds-sr, .ds-badge')) part.remove();
  return copy.textContent.trim() || action.getAttribute('aria-label') || action.getAttribute('data-tip') || action.getAttribute('title') || '';
}

/**
 * The controller of one head.
 * @param {HTMLElement} head
 * @param {{ condense?: boolean }} options
 * @param {AbortSignal} [signal]
 */
function controller(head, options, signal) {
  const doc = head.ownerDocument;
  const view = doc.defaultView ?? globalThis;
  const abort = new AbortController();
  const listen = { signal: abort.signal };
  signal?.addEventListener('abort', () => abort.abort(), { once: true });
  const listeners = new Set();
  const owned = [];
  const take = (element, name) => {
    if (owned.some(([each, which]) => each === element && which === name)) return;
    own(element, 'attrs', name);
    owned.push([element, name]);
  };

  /* ── Condensing ─────────────────────────────── */

  const sticky = options.condense !== false && head.classList.contains('ds-page-head--sticky');
  const scroller = sticky ? scrollerOf(head, view) : null;
  const box = () => scroller ?? doc.scrollingElement ?? doc.documentElement;
  let condensed = head.hasAttribute('data-scrolled');
  /** How much the head lost the last time it condensed: no trial before the reader has scrolled that far. */
  let foldHeight = 0;
  if (sticky) take(head, 'data-scrolled');

  /** What follows the head in the flow: its place on screen is what must not move. */
  const anchor = () => head.nextElementSibling ?? head.parentElement;

  const apply = (on) => {
    if (on) head.setAttribute('data-scrolled', '');
    else head.removeAttribute('data-scrolled');
  };

  /**
   * Condenses (true) or unfolds (false) the head, keeping the content in
   * place; returns whether the state changed.
   */
  const condense = (on) => {
    if (on === condensed) return false;
    const ref = anchor();
    const before = ref?.getBoundingClientRect().top ?? 0;
    const start = box().scrollTop;
    const tall = head.getBoundingClientRect().height;
    apply(on);
    const after = ref?.getBoundingClientRect().top ?? 0;
    if (on) foldHeight = Math.max(0, tall - head.getBoundingClientRect().height);
    // The browser may have kept the content in place itself (scroll anchoring): move only by what is left.
    if (Math.abs(after - before) >= 0.5) (scroller ?? view).scrollBy({ top: after - before, behavior: 'instant' });
    // Condensed but back at the top: the fold was all there was to scroll. Undo it, or the head would flicker.
    if (on && box().scrollTop <= TOP && start > TOP) {
      apply(false);
      (scroller ?? view).scrollTo({ top: start, behavior: 'instant' });
      return false;
    }
    condensed = on;
    const detail = { condensed: on };
    emit(head, 'change', detail);
    for (const fn of listeners) fn(detail);
    return true;
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    if (!sticky) return;
    const top = box().scrollTop;
    if (!condensed && top > TOP + foldHeight) condense(true);
    else if (condensed && top <= TOP) condense(false);
  };
  const later = () => {
    if (frame) return;
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(update) : 0;
    if (!frame) update();
  };
  if (sticky) (scroller ?? view).addEventListener('scroll', later, { passive: true, signal: abort.signal });

  /* ── Folding actions ────────────────────────── */

  const actions = head.querySelector('.ds-page-head__actions');
  const row = actions?.closest('.ds-page-head__row') ?? actions?.parentElement ?? null;
  const folded = new Set();
  const itemsOf = new WeakMap();
  let more = null;
  let menu = null;

  const actionList = () => (actions ? [...actions.children].filter((child) => child !== more && child !== menu && !child.classList.contains('ds-menu')) : []);

  if (actions) {
    serial += 1;
    const menuId = `ds-page-more-${serial}`;
    more = doc.createElement('button');
    more.className = 'ds-btn ds-btn--quiet ds-btn--icon ds-page-head__more';
    more.type = 'button';
    more.hidden = true;
    more.setAttribute('aria-haspopup', 'menu');
    more.setAttribute('aria-expanded', 'false');
    more.setAttribute('aria-controls', menuId);
    more.setAttribute('aria-label', t('moreActions'));
    more.setAttribute('data-tip', t('moreActions'));
    more.dataset.dsKeep = '';
    more.append(iconElement(moreVertical, 20, '', doc));
    menu = doc.createElement('div');
    menu.className = 'ds-menu';
    menu.id = menuId;
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('moreActions'));
    menu.dataset.dsKeep = '';
    actions.append(more, menu);
    more.addEventListener('click', (event) => {
      if (event.detail > 1) return;
      if (more.getAttribute('aria-expanded') === 'true') closeMenu(menu);
      else openMenu(menu, { opener: more });
    }, listen);
    more.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      openMenu(menu, { opener: more });
    }, listen);
    menu.addEventListener('click', (event) => {
      const item = /** @type {Element} */ (event.target)?.closest?.('.ds-menu__item');
      const action = item ? itemsOf.get(item) : null;
      if (!action || item.getAttribute('aria-disabled') === 'true') return;
      if (item.tagName === 'A') {
        // A link item navigates by itself; the menu only closes.
        closeMenu(menu);
        return;
      }
      closeMenu(menu);
      action.click();
    }, listen);
  }

  /** The menu's items: one per folded action, its icon and label. */
  const fillMenu = (list) => {
    if (!menu) return;
    const items = list.map((action) => {
      const link = action.tagName === 'A' && action.hasAttribute('href');
      const item = doc.createElement(link ? 'a' : 'button');
      item.className = 'ds-menu__item';
      item.setAttribute('role', 'menuitem');
      if (link) {
        item.setAttribute('href', action.getAttribute('href'));
        for (const name of ['target', 'rel', 'download']) if (action.hasAttribute(name)) item.setAttribute(name, action.getAttribute(name));
      } else item.type = 'button';
      if (action.matches(':disabled') || action.getAttribute('aria-disabled') === 'true' || action.getAttribute('aria-busy') === 'true') item.setAttribute('aria-disabled', 'true');
      const glyph = action.querySelector(':scope > svg');
      if (glyph) item.append(glyph.cloneNode(true));
      const label = doc.createElement('span');
      label.className = 'ds-menu__label';
      label.textContent = labelOf(action);
      item.append(label);
      itemsOf.set(item, action);
      return item;
    });
    menu.replaceChildren(...items);
  };

  /** Lays the actions out: the ones that fit stay, the others go into the menu. */
  function layout() {
    if (!more || !actions.isConnected || !row) return;
    for (const action of folded) action.hidden = false;
    folded.clear();
    more.hidden = true;
    const all = actionList().filter((action) => !action.hidden);
    const style = view.getComputedStyle(actions);
    const gap = parseFloat(style.columnGap) || 0;
    const widths = all.map((action) => action.getBoundingClientRect().width);
    more.hidden = false;
    const moreWidth = more.getBoundingClientRect().width;
    more.hidden = true;
    // The first ones fold first; a filled action, the page's main one, last.
    const order = all.map((_, index) => index).sort((a, b) => Number(all[a].classList.contains('ds-btn--filled')) - Number(all[b].classList.contains('ds-btn--filled')) || a - b);
    const out = fold(widths, { room: row.clientWidth, gap, more: moreWidth, order });
    if (!out.length) {
      fillMenu([]);
      if (more.getAttribute('aria-expanded') === 'true') closeMenu(menu);
      return;
    }
    const list = [];
    for (const index of out) {
      const action = all[index];
      take(action, 'hidden');
      action.hidden = true;
      folded.add(action);
      list.push(action);
    }
    more.hidden = false;
    fillMenu(list);
  }

  let layoutFrame = 0;
  const relayout = () => {
    if (layoutFrame) return;
    layoutFrame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(() => { layoutFrame = 0; layout(); }) : 0;
    if (!layoutFrame) layout();
  };
  const resize = more && typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => layout()) : null;
  resize?.observe(row);
  const changes = more && typeof view.MutationObserver === 'function' ? new view.MutationObserver((records) => {
    if (records.every((record) => record.target === menu || menu.contains(record.target) || record.target === more)) return;
    relayout();
  }) : null;
  changes?.observe(actions, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'aria-label'] });
  layout();
  doc.fonts?.ready?.then(() => { if (!abort.signal.aborted) layout(); });
  update();

  let gone = false;
  return {
    /** Whether the head is condensed. */
    get() {
      return condensed;
    },
    /** Condenses (true) or unfolds (false) a sticky head, until the next scroll decides again. */
    set(value) {
      if (sticky) condense(Boolean(value));
    },
    on(type, fn) {
      if (type !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Lays the actions out again (after a change the observers cannot see, such as a font). */
    refresh() {
      layout();
      update();
    },
    destroy() {
      if (gone) return;
      gone = true;
      abort.abort();
      listeners.clear();
      resize?.disconnect();
      changes?.disconnect();
      if (frame) view.cancelAnimationFrame?.(frame);
      if (layoutFrame) view.cancelAnimationFrame?.(layoutFrame);
      for (const action of folded) action.hidden = false;
      folded.clear();
      if (menu && more?.getAttribute('aria-expanded') === 'true') closeMenu(menu);
      more?.remove();
      menu?.remove();
      for (const [element, name] of owned) disown(element, 'attrs', name);
      owned.length = 0;
    },
  };
}

define('page', {
  attribute: 'data-ds-page-head',
  attributes: ['data-ds-page-head-condense'],
  init(el, ctx) {
    return controller(/** @type {HTMLElement} */ (el), { condense: el.getAttribute('data-ds-page-head-condense') !== 'off' }, ctx.signal);
  },
});

/**
 * A page head driven from the page; the same controller the attribute path
 * makes.
 * @param {HTMLElement} el  the .ds-page-head
 * @param {{ condense?: boolean }} [options]
 */
export function create(el, options = {}) {
  return controller(el, { condense: options.condense !== false });
}
