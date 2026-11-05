/**
 * Expandable text (DS.expandable): a long text shows its first lines and a
 * "Show more" button; the button shows only while the text is longer than
 * those lines.
 *
 *   <div class="ds-expandable" data-ds-expandable>
 *     <div class="ds-expandable__text">A description of many lines ...</div>
 *   </div>
 *   const more = DS.expandable.create(el);   more.set(true);   more.get();   true
 *
 * The module gives the text an id (unless it has one) and adds the toggle
 * after it: <button class="ds-link-btn ds-expandable__toggle" type="button"
 * aria-expanded="false" aria-controls="..."> with the strings showMore and
 * showLess. It writes data-state="closed" or "open" on the element; the
 * stylesheet clamps the text to --ds-expandable-lines (3) only while closed,
 * so without the script the whole text shows. data-ds-expandable="open"
 * starts open.
 *
 * Whether the text is longer than its lines is measured again on every
 * resize: a text that fits hides the toggle (and is neither open nor
 * closed for the reader). Opening keeps focus on the toggle, so Tab goes on
 * from it; the text is read whole by a screen reader in both states (the
 * clamp is visual).
 *
 * The controller: get() gives whether it is open, set(open) opens or
 * closes it, on('change', fn) runs with { open }, update() measures again,
 * destroy() removes the toggle and the state. Events: ds:change.
 *
 * ES2022. Progressive:
 * - ResizeObserver: without it the toggle is decided once, at start and on
 *   update().
 */
import { define, emit, t } from '../../js/core.js';

let uid = 0;

/**
 * Whether a text clamped to its lines hides some of them: its full height
 * is more than `lines` lines (half a line of slack for rounding).
 * @param {number} fullHeight
 * @param {number} lineHeight
 * @param {number} lines
 * @returns {boolean}
 */
export function overflows(fullHeight, lineHeight, lines) {
  if (!(lineHeight > 0) || !(lines > 0)) return false;
  return fullHeight > lineHeight * (lines + 0.5);
}

function controller(el, given) {
  const doc = el.ownerDocument;
  const view = doc.defaultView ?? globalThis;
  const listeners = new Set();
  const text = el.querySelector('.ds-expandable__text') ?? el;
  let open = given.open ?? el.getAttribute('data-ds-expandable') === 'open';
  let live = true;
  let addedId = false;
  if (!text.id) {
    uid += 1;
    text.id = `ds-expandable-${uid}`;
    addedId = true;
  }
  const toggle = doc.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ds-link-btn ds-expandable__toggle';
  toggle.setAttribute('aria-controls', text.id);
  if (text !== el) text.after(toggle);
  else el.append(toggle);

  const linesOf = () => {
    const read = Number.parseFloat(view.getComputedStyle(el).getPropertyValue('--ds-expandable-lines'));
    return Number.isFinite(read) && read > 0 ? read : 3;
  };

  /** The full height of the text: measured unclamped, in the same frame. */
  const measure = () => {
    if (!live) return;
    el.setAttribute('data-state', 'measuring');
    const full = text.scrollHeight;
    const line = Number.parseFloat(view.getComputedStyle(text).lineHeight) || 0;
    const long = overflows(full, line, linesOf());
    toggle.hidden = !long;
    if (!long) el.removeAttribute('data-state');
    else el.setAttribute('data-state', open ? 'open' : 'closed');
    toggle.setAttribute('aria-expanded', String(open || !long));
    toggle.textContent = t(open ? 'showLess' : 'showMore');
  };

  const flip = () => api.set(!open);
  toggle.addEventListener('click', flip);
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => measure()) : null;
  resize?.observe(el);
  measure();

  const api = {
    get() {
      return open;
    },
    set(next) {
      const value = Boolean(next);
      if (value === open) return;
      open = value;
      measure();
      emit(el, 'change', { open });
      for (const fn of [...listeners]) fn({ open });
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
      live = false;
      resize?.disconnect();
      toggle.removeEventListener('click', flip);
      toggle.remove();
      el.removeAttribute('data-state');
      if (addedId) text.removeAttribute('id');
      listeners.clear();
    },
  };
  return api;
}

define('expandable', {
  attribute: 'data-ds-expandable',
  init(el) {
    return controller(el, {});
  },
});

/**
 * Expandable text driven from the page; the same controller the attribute path makes.
 * @param {Element} el
 * @param {{ open?: boolean }} [options]
 */
export function create(el, options = {}) {
  return controller(el, options);
}
