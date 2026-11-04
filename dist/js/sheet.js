/*! Dashboard-Style 3.0.0-alpha.4 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/**
 * The side sheet's module (DS.sheet): its behaviour today is the core's
 * (js/overlay.js: the stack, the trap, focus return, Escape, dismiss, the
 * exit, the snackbars that follow its panel), so this holds the sheet's own
 * API and its declarative form; resizing, a remembered width and the inspector
 * mode come here in phase 2.
 *
 *   <button data-ds-open="#details">Details</button>
 *   <dialog class="ds-sheet" id="details" aria-labelledby="t">...</dialog>
 *
 *   DS.sheet.open(sheet, { opener });  DS.sheet.close(sheet);   // DS.overlay.open and close
 *   DS.sheet.create(sheet)             // get(), set(), on(), destroy()
 *
 * ES2022; no progressive feature of its own.
 */
import { define } from './core.js';
import { internals, open as openOverlay, close as closeOverlay } from './overlay.js';

const { controllerOf } = internals;

/**
 * Opens a side sheet: DS.overlay.open().
 * @param {Element} element
 * @param {{ opener?: Element|null, container?: boolean, returnTo?: () => Element|null|undefined }} [options]
 * @returns {Promise<void>}
 */
export function open(element, options = {}) {
  return openOverlay(element, options);
}

/**
 * Closes a side sheet: DS.overlay.close().
 * @param {Element} element
 * @param {{ reason?: string }} [options]
 * @returns {Promise<void>}
 */
export function close(element, options = {}) {
  return closeOverlay(element, options);
}

/**
 * The controller of a side sheet, the one [data-ds-sheet] makes.
 * @param {Element} element
 * @returns {ReturnType<typeof controllerOf>}
 */
export function create(element) {
  return controllerOf(element);
}

define('sheet', {
  attribute: 'data-ds-sheet',
  init: (element) => create(element),
});
