/**
 * Truncate (DS.truncate): a text too long for its place is cut at its end,
 * its start or its middle with an ellipsis, and shows whole in a tooltip
 * while it is cut. A screen reader always reads it whole.
 *
 *   <span class="ds-truncate" data-ds-truncate="middle">inventory-export-2026-11-04-final.csv</span>
 *   <a class="ds-truncate" data-ds-truncate="start" href="...">/devices/north/floor-2/printer-7</a>
 *   const cut = DS.truncate.create(el, { position: 'middle' });
 *   DS.truncate.fit('abcdefghij', 'middle', (text) => text.length <= 7);   'abc…hij'
 *
 * Positions: `end` (default) is CSS alone (text-overflow), the module only
 * writes the tip while the text is cut. `start` keeps the end (a path, the
 * last part of a breadcrumb); `middle` keeps both ends (a file name with its
 * extension, an ID that differs at the end). For those the module cuts the
 * text itself, as many characters (graphemes) as fit, on every resize:
 *
 *   <span class="ds-truncate" data-ds-truncate="middle" data-tip="inventory-export-2026-11-04-final.csv">
 *     <span class="ds-truncate__shown" aria-hidden="true">inventory-ex…final.csv</span>
 *     <span class="ds-sr">inventory-export-2026-11-04-final.csv</span></span>
 *
 * The whole text: the element's text when the behaviour starts, or
 * data-ds-truncate-text. A re-render (DS.dom.morphHtml) that writes a new
 * text into the element is taken as the new whole text. data-tip is owned
 * state, written only while the text is cut and only when the page wrote
 * no tip of its own.
 *
 * The controller: get() gives { text, shown, cut }, set(text) writes a new
 * whole text, on('change', fn) runs when the cut changed, update() measures
 * again, destroy() puts the whole text back.
 *
 * ES2022. Progressive:
 * - Intl.Segmenter (cuts between graphemes, so an emoji or an accented
 *   letter stays whole): without it the text is cut between code points.
 * - ResizeObserver: without it the text is cut once, at start and on
 *   update().
 */
import { define, emit } from '../../js/core.js';
import { own, disown } from '../../js/dom.js';

const POSITIONS = Object.freeze(['end', 'start', 'middle']);
const ELLIPSIS = '…';

/** The graphemes of a text (code points where Intl.Segmenter is missing). */
function graphemes(text) {
  if (typeof Intl.Segmenter === 'function') return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (part) => part.segment);
  return Array.from(text);
}

/**
 * `text` with `keep` graphemes kept around an ellipsis at `position`.
 * @param {string} text
 * @param {number} keep
 * @param {'end'|'start'|'middle'} [position]
 * @returns {string}
 */
export function cut(text, keep, position = 'end') {
  const parts = graphemes(String(text ?? ''));
  if (keep >= parts.length) return parts.join('');
  const n = Math.max(0, Math.floor(keep));
  if (position === 'start') return ELLIPSIS + parts.slice(parts.length - n).join('').trimStart();
  if (position === 'middle') {
    const head = Math.ceil(n / 2);
    const tail = n - head;
    return parts.slice(0, head).join('').trimEnd() + ELLIPSIS + (tail ? parts.slice(parts.length - tail).join('').trimStart() : '');
  }
  return parts.slice(0, n).join('').trimEnd() + ELLIPSIS;
}

/**
 * The longest cut of `text` at `position` for which `fits(shown)` is true
 * (a binary search over how many graphemes stay): the text itself when it
 * fits whole, else at least the ellipsis.
 * @param {string} text
 * @param {'end'|'start'|'middle'} position
 * @param {(shown: string) => boolean} fits
 * @returns {string}
 */
export function fit(text, position, fits) {
  const whole = String(text ?? '');
  if (fits(whole)) return whole;
  let low = 0;
  let high = graphemes(whole).length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(cut(whole, mid, position))) low = mid;
    else high = mid - 1;
  }
  return cut(whole, low, position);
}

function controller(el, given) {
  const doc = el.ownerDocument;
  const view = doc?.defaultView ?? globalThis;
  const listeners = new Set();
  let live = true;
  let text = given.text ?? el.getAttribute('data-ds-truncate-text') ?? el.textContent ?? '';
  let shownText = text;
  let wroteTip = false;
  let parts = null;

  const position = () => {
    const named = given.position ?? el.getAttribute('data-ds-truncate');
    return POSITIONS.includes(named) ? named : 'end';
  };

  const tip = (on) => {
    if (on) {
      if (!wroteTip && el.hasAttribute('data-tip')) return;
      if (!wroteTip) {
        wroteTip = true;
        own(el, 'attrs', 'data-tip');
      }
      if (el.getAttribute('data-tip') !== text) el.setAttribute('data-tip', text);
    } else if (wroteTip) {
      wroteTip = false;
      el.removeAttribute('data-tip');
      disown(el, 'attrs', 'data-tip');
    }
  };

  /** The whole text back in place of our parts; a page's own markup (end) is never touched. */
  const plain = () => {
    if (!parts) return;
    parts = null;
    el.textContent = text;
  };

  const measure = () => {
    if (!live) return;
    const at = position();
    const before = shownText;
    if (at === 'end' || !el.isConnected) {
      plain();
      shownText = text;
      tip(el.isConnected && el.scrollWidth > el.clientWidth + 0.5);
    } else {
      if (!parts) {
        const shown = doc.createElement('span');
        shown.className = 'ds-truncate__shown';
        shown.setAttribute('aria-hidden', 'true');
        const whole = doc.createElement('span');
        whole.className = 'ds-sr';
        parts = { shown, whole };
      }
      parts.whole.textContent = text;
      if (parts.shown.parentNode !== el || parts.whole.parentNode !== el) el.replaceChildren(parts.shown, parts.whole);
      const fits = (candidate) => {
        parts.shown.textContent = candidate;
        return el.scrollWidth <= el.clientWidth + 0.5;
      };
      shownText = fit(text, at, fits);
      if (shownText === text) plain();
      else parts.shown.textContent = shownText;
      tip(shownText !== text);
    }
    watcher?.takeRecords();
    if (shownText !== before) {
      const detail = { text, shown: shownText, cut: shownText !== text };
      for (const fn of [...listeners]) fn(detail);
    }
  };

  const watcher = typeof view.MutationObserver === 'function' ? new view.MutationObserver(() => {
    if (!live) return;
    // Our own parts gone, or a text that is not ours: a re-render wrote a new whole text.
    const ours = parts ? parts.shown.parentNode === el : el.textContent === text;
    if (!ours) text = el.textContent ?? '';
    measure();
  }) : null;
  watcher?.observe(el, { childList: true, characterData: true, subtree: true });
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => measure()) : null;
  // A cut element is only as wide as its cut text: its container's size says when more fits.
  resize?.observe(el);
  if (el.parentElement) resize?.observe(el.parentElement);
  measure();

  const api = {
    get() {
      return { text, shown: shownText, cut: shownText !== text };
    },
    set(next) {
      text = String(next ?? '');
      if (el.hasAttribute('data-ds-truncate-text')) el.setAttribute('data-ds-truncate-text', text);
      measure();
      if (live) emit(el, 'change', { text, shown: shownText, cut: shownText !== text });
    },
    on(type, fn) {
      if (type !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    update() {
      const named = el.getAttribute('data-ds-truncate-text');
      if (named !== null) text = named;
      measure();
    },
    destroy() {
      if (!live) return;
      live = false;
      watcher?.disconnect();
      resize?.disconnect();
      listeners.clear();
      tip(false);
      if (parts) el.textContent = text;
    },
  };
  return api;
}

define('truncate', {
  attribute: 'data-ds-truncate',
  attributes: ['data-ds-truncate-text'],
  init(el) {
    return controller(el, {});
  },
});

/**
 * Truncation driven from the page; the same controller the attribute path makes.
 * @param {Element} el
 * @param {{ position?: 'end'|'start'|'middle', text?: string }} [options]
 */
export function create(el, options = {}) {
  return controller(el, options);
}
