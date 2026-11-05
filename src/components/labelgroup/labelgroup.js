/**
 * Label group (DS.labelgroup): the tags of one item on one line, as many
 * as fit, then a "+N" button that shows all of them in a popup.
 *
 *   <div class="ds-label-group" data-ds-label-group [data-ds-label-group-max="3"]>
 *     <ul class="ds-label-group__list" aria-label="Labels of ticket 42"><li><span class="ds-tag">Printer</span></li>...</ul>
 *   </div>
 *   const labels = DS.labelgroup.create(group, { max: 3 });   labels.set(true);   // the popup open
 *   DS.labelgroup.visibleCount([60, 80, 70], 200, 32, 4);      2
 *
 * It measures the tags once they show, keeps those that fit on the line
 * (at most data-ds-label-group-max) and hides the others; again when the
 * group's width changes (ResizeObserver) and when the page re-renders the
 * list (DS.dom.morphHtml). One tag left alone in too little room ends in
 * an ellipsis. The button (.ds-label-group__more, a .ds-btn) says "+N"
 * and, for a screen reader, how many there are in all; it opens the popup
 * (.ds-label-group__popup, role="dialog", named like the list) with every
 * tag again, through DS.overlay: Escape closes it and focus goes back to
 * the button; a pointerdown outside it or focus that leaves it closes it.
 * The popup is placed at the button by DS.position: anchored in the top
 * layer where the engine can, else by --ds-label-group-x/-y.
 *
 * The tags in the popup are copies (without ids): a page that acts on a
 * tag (a link, a filter) listens on the document or uses links.
 *
 * The controller: get() gives { total, hidden, open }, set(open) opens or
 * closes the popup, on('change', fn) runs when the hidden count or the
 * popup changes, update() measures again, destroy() shows every tag and
 * takes the button and the popup away. Events: ds:change ({ total,
 * hidden, open }) on the group.
 *
 * ES2022. Progressive: CSS anchor positioning (DS.position decides);
 * focus({ focusVisible }) (the popup takes focus without the keyboard ring
 * after a click): without it the engine decides whether the ring shows.
 */
import { define, emit, get, runtime, t } from '../../js/core.js';
import { open as openOverlay, close as closeOverlay } from '../../js/overlay.js';
import { anchorPopup, place, pxOf, releaseAnchor, supportsAnchoring } from '../../js/position.js';

/** The page's label groups: the numbering of popups and anchors, and the open popups. */
const shared = runtime.state('labelgroup', () => ({ seq: 0, open: new Map() }));

/**
 * How many tags of `widths` fit in `room` px: all of them when they fit
 * without the button, else as many as fit beside a button `more` px wide,
 * `gap` px apart; at most `max`, at least one (it may end in an ellipsis).
 * @param {number[]} widths
 * @param {number} room
 * @param {number} more
 * @param {number} gap
 * @param {number} [max]
 * @returns {number}
 */
export function visibleCount(widths, room, more, gap, max = Infinity) {
  const total = widths.length;
  if (!total) return 0;
  const cap = Math.max(1, Math.min(total, Math.floor(Number.isFinite(max) && max >= 0 ? max : total)));
  const span = (n) => widths.slice(0, n).reduce((sum, width) => sum + width, 0) + gap * Math.max(0, n - 1);
  if (cap === total && span(total) <= room + 0.5) return total;
  for (let n = cap; n > 1; n -= 1) {
    if (span(n) + gap + more <= room + 0.5) return n;
  }
  return 1;
}

function controller(el, given) {
  const doc = el.ownerDocument;
  const view = doc?.defaultView ?? globalThis;
  const listeners = new Set();
  let live = true;
  let hiddenCount = 0;
  let isOpen = false;
  let anchored = null;
  const id = `ds-label-group-${shared.seq += 1}`;

  const list = () => el.querySelector(':scope > .ds-label-group__list');
  const items = () => [...(list()?.children ?? [])];
  const max = () => {
    const named = given.max ?? el.getAttribute('data-ds-label-group-max');
    const value = Number.parseInt(String(named ?? ''), 10);
    return Number.isFinite(value) && value >= 0 ? value : Infinity;
  };
  const name = () => list()?.getAttribute('aria-label') || t('labelGroupAll');

  const more = doc.createElement('button');
  more.type = 'button';
  more.className = 'ds-btn ds-btn--tonal ds-label-group__more';
  more.setAttribute('aria-haspopup', 'dialog');
  more.setAttribute('aria-expanded', 'false');
  more.setAttribute('aria-controls', `${id}-popup`);
  const count = doc.createElement('span');
  count.setAttribute('aria-hidden', 'true');
  more.append(count);
  more.hidden = true;

  const popup = doc.createElement('div');
  popup.className = 'ds-label-group__popup';
  popup.id = `${id}-popup`;
  popup.setAttribute('role', 'dialog');
  popup.tabIndex = -1;
  popup.hidden = true;
  const all = doc.createElement('ul');
  all.className = 'ds-label-group__all';
  popup.append(all);
  el.append(more, popup);

  const tell = () => {
    const detail = { total: items().length, hidden: hiddenCount, open: isOpen };
    emit(el, 'change', detail);
    for (const fn of [...listeners]) fn(detail);
  };

  const label = (hidden, total) => {
    count.textContent = `+${hidden}`;
    more.setAttribute('aria-label', t('labelGroupMore', { count: hidden, total }));
  };

  const measure = () => {
    if (!live) return;
    const tags = items();
    const before = hiddenCount;
    for (const item of tags) item.hidden = false;
    let shown = tags.length;
    if (el.isConnected && tags.length) {
      const gap = parseFloat(view.getComputedStyle(el).columnGap) || 0;
      // The widest the button gets: "+N" of every tag but one.
      label(tags.length, tags.length);
      more.hidden = false;
      const button = more.getBoundingClientRect().width;
      more.hidden = true;
      const widths = tags.map((item) => item.getBoundingClientRect().width);
      shown = visibleCount(widths, el.clientWidth, button, gap, max());
    }
    tags.forEach((item, index) => {
      item.hidden = index >= shown;
    });
    hiddenCount = tags.length - shown;
    label(hiddenCount, tags.length);
    more.hidden = hiddenCount === 0;
    if (!hiddenCount && isOpen) api.set(false);
    watcher?.takeRecords();
    if (hiddenCount !== before) tell();
  };

  /** Every tag again, copied into the popup (ids dropped: they are the page's). */
  const fill = () => {
    const copies = items().map((item) => {
      const copy = /** @type {Element} */ (item.cloneNode(true));
      copy.removeAttribute('hidden');
      copy.removeAttribute('id');
      for (const inner of copy.querySelectorAll('[id]')) inner.removeAttribute('id');
      return copy;
    });
    all.replaceChildren(...copies);
    popup.setAttribute('aria-label', name());
  };

  const release = () => {
    if (anchored) releaseAnchor(anchored);
    anchored = null;
    if (popup.hasAttribute('popover')) {
      try {
        popup.hidePopover();
      } catch {
        // Not open.
      }
      popup.removeAttribute('popover');
    }
    popup.removeAttribute('data-anchored');
    popup.removeAttribute('data-placement');
    popup.style.removeProperty('position-anchor');
  };

  const show = () => {
    fill();
    // At rest size and closed, then placed at the button; DS.overlay
    // takes it from there (the origin, the entrance, focus, Escape).
    popup.setAttribute('data-state', 'closed');
    popup.hidden = false;
    const offset = pxOf(popup, '--ds-space-1', 4);
    if (supportsAnchoring(view)) {
      if (anchorPopup(popup, more, { nextName: () => `--ds-label-group-anchor-${shared.seq += 1}`, offset })) anchored = more;
    } else {
      place(popup, more, { offset, padding: pxOf(popup, '--ds-space-2', 8), crossFlip: true, x: '--ds-label-group-x', y: '--ds-label-group-y' });
    }
    isOpen = true;
    shared.open.set(popup, { more, close: () => api.set(false) });
    // The ring shows when the button showed it (opened by a key).
    const ring = more.matches(':focus-visible');
    openOverlay(popup, { opener: more });
    // A popup of DS.overlay keeps focus where it is; this one is a
    // dialog, so focus moves into it (Escape gives it back).
    popup.focus({ preventScroll: true, focusVisible: ring });
    tell();
  };

  const hide = () => {
    isOpen = false;
    shared.open.delete(popup);
    closeOverlay(popup);
    tell();
  };

  const onClick = () => api.set(!isOpen);
  more.addEventListener('click', onClick);
  // Focus that leaves the popup (Tab on, a click elsewhere) closes it; to
  // its own button it stays, which closes it on the next press.
  const onFocusOut = (event) => {
    const next = /** @type {Node|null} */ (event.relatedTarget);
    if (isOpen && next && !popup.contains(next) && next !== more) api.set(false);
  };
  popup.addEventListener('focusout', onFocusOut);

  // Closed by DS.overlay itself (Escape): the state follows; once hidden,
  // out of the top layer.
  const popupWatch = typeof view.MutationObserver === 'function' ? new view.MutationObserver(() => {
    if (!popup.hidden) return;
    release();
    if (isOpen) {
      isOpen = false;
      shared.open.delete(popup);
      tell();
    }
  }) : null;
  popupWatch?.observe(popup, { attributes: true, attributeFilter: ['hidden'] });
  const onClose = () => {
    if (!isOpen) return;
    isOpen = false;
    shared.open.delete(popup);
    tell();
  };
  popup.addEventListener('ds:close', onClose);

  const watcher = typeof view.MutationObserver === 'function' ? new view.MutationObserver(() => measure()) : null;
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => measure()) : null;
  resize?.observe(el);

  const api = {
    get() {
      return { total: items().length, hidden: hiddenCount, open: isOpen };
    },
    set(next) {
      if (!live) return;
      if (next && !isOpen && hiddenCount) show();
      else if (!next && isOpen) hide();
    },
    on(type, fn) {
      if (type !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    update() {
      measure();
    },
    destroy() {
      if (!live) return;
      if (isOpen) hide();
      live = false;
      watcher?.disconnect();
      resize?.disconnect();
      popupWatch?.disconnect();
      shared.open.delete(popup);
      release();
      more.removeEventListener('click', onClick);
      popup.removeEventListener('focusout', onFocusOut);
      popup.removeEventListener('ds:close', onClose);
      for (const item of items()) item.hidden = false;
      more.remove();
      popup.remove();
      listeners.clear();
    },
  };

  measure();
  const target = list();
  if (target) watcher?.observe(target, { childList: true, subtree: true, characterData: true });
  return api;
}

/** A pointerdown outside an open popup and its button closes it. */
function outside(root) {
  const onDown = (event) => {
    const path = event.composedPath?.() ?? [event.target];
    for (const [popup, entry] of [...shared.open]) {
      if (!path.includes(popup) && !path.includes(entry.more)) entry.close();
    }
  };
  root.addEventListener('pointerdown', onDown, true);
  return () => root.removeEventListener('pointerdown', onDown, true);
}

define('labelgroup', {
  attribute: 'data-ds-label-group',
  attributes: ['data-ds-label-group-max'],
  global: outside,
  init(el) {
    return controller(el, {});
  },
});

/**
 * A label group driven from the page; the same controller the attribute
 * path makes (that one itself when DS.init() already made it).
 * @param {Element} el the .ds-label-group
 * @param {{ max?: number }} [options]
 */
export function create(el, options = {}) {
  return get(el, 'labelgroup') ?? controller(el, options);
}
