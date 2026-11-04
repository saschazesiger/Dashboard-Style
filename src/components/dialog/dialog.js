/**
 * The behaviour of a dialog (DS.dialog): what only a dialog does once
 * DS.overlay opened it (the stack, the trap, focus return, Escape, dismiss
 * and the exit stay in the core, js/overlay.js).
 *
 *   <button data-ds-open="#delete-dialog">Delete</button>
 *   <dialog class="ds-dialog" id="delete-dialog" aria-labelledby="t">...</dialog>
 *
 *   DS.dialog.open(dialog, { opener });  DS.dialog.close(dialog);   // DS.overlay.open and close
 *   DS.dialog.create(dialog)             // get(), set(), on(), destroy()
 *   await DS.dialog.confirm({ title, text, destructive: true });   // also DS.overlay.confirm
 *   DS.dialog.form(dialog, { onSubmit });   // a form dialog: busy while it runs
 *
 * Promise dialogs: confirm(), alert() and prompt() build a dialog.ds-dialog
 * with DOM APIs inside the opener's .ds-theme, open it through open() and
 * remove it after its exit; the promise resolves with the answer when the
 * close starts. onConfirm runs with busy() on the confirm button and
 * data-ds-busy on the dialog; a rejection keeps it open with an error
 * snackbar (errorText) and focus back on the confirm button.
 *
 * An action sheet's list (.ds-dialog__list): ArrowUp, ArrowDown, Home and End
 * move focus among its .ds-menu__item rows.
 *
 * Form dialog: when the box is a <form class="ds-dialog__box">, a submit
 * (the constraint validation has passed by then) sends a cancelable
 * ds:submit ({ form, data }) and closes it with reason "submit" unless the
 * page called preventDefault(). form(dialog, { onSubmit, errorText }) runs
 * onSubmit(data, form) like onConfirm(): busy() on the submit button,
 * data-ds-busy on the dialog, a rejection keeps it open with an error
 * snackbar. The submit button of a form that closes natively (a form that is
 * not the box, method="dialog") is the page's business, as in 2.x.
 *
 * ES2022; no progressive feature of its own.
 */
import { define, emit } from '../../js/core.js';
import { busy } from '../../js/motion.js';
import { alertCircle, iconElement } from '../../js/icons.js';
import { internals, open as openOverlay, close as closeOverlay } from '../../js/overlay.js';

const { overlays, activeIn, sharedOf, canFocus, arrowTarget, controllerOf, part } = internals;

/**
 * Opens a dialog: DS.overlay.open().
 * @param {Element} element
 * @param {{ opener?: Element|null, container?: boolean, returnTo?: () => Element|null|undefined }} [options]
 * @returns {Promise<void>}
 */
export function open(element, options = {}) {
  return openOverlay(element, options);
}

/**
 * Closes a dialog: DS.overlay.close().
 * @param {Element} element
 * @param {{ reason?: string }} [options]
 * @returns {Promise<void>}
 */
export function close(element, options = {}) {
  return closeOverlay(element, options);
}

/** What a failed onConfirm says by default (never the raw error message). */
const CONFIRM_ERROR = 'That did not work. Try again.';

/** What a required prompt field left empty says by default. */
const REQUIRED_TEXT = 'Enter a value.';

/**
 * Asks with a built dialog: Cancel and a confirm button. `destructive`
 * makes it an alertdialog whose first focus is Cancel, and its confirm
 * button filled in the error tone (D10: the one place a button is red); the
 * label names the consequence. `onConfirm` (async)
 * runs with busy() on the confirm button and data-ds-busy on the dialog: a
 * rejection keeps it open, shows `errorText` as an error snackbar above it
 * (in the theme's .ds-toasts region, made when the page has none, inside
 * the open dialog) and focuses the confirm button again.
 * Resolves true when it closed through the confirm button, else false.
 * @param {{ title?: string, text?: string, confirmLabel?: string, cancelLabel?: string, destructive?: boolean,
 *   opener?: Element|null, onConfirm?: () => unknown, errorText?: string }} [options]
 * @returns {Promise<boolean>}
 */
export function confirm(options = {}) {
  return /** @type {Promise<boolean>} */ (ask('confirm', options));
}

/**
 * Tells something with a built alertdialog and one button (`closeLabel`,
 * default "OK"); resolves once it closes.
 * @param {{ title?: string, text?: string, closeLabel?: string, opener?: Element|null }} [options]
 * @returns {Promise<void>}
 */
export function alert(options = {}) {
  return /** @type {Promise<void>} */ (ask('alert', options));
}

/**
 * Asks for one value with a built dialog: a field (`label`, `value`;
 * `input` sets its type, autocomplete, inputmode, required, spellcheck,
 * autocapitalize, autocorrect and enterkeyhint), Cancel and a confirm
 * button; Enter in the field confirms. A required field left
 * empty stays open with the field error `requiredText` (default "Enter a
 * value."; aria-invalid, a .ds-field__hint--error linked by
 * aria-describedby, announced assertively) until the next input.
 * `onConfirm(value)` runs as in confirm(). Resolves the value when it
 * closed through the confirm button, else null.
 * @param {{ title?: string, text?: string, label?: string, value?: string, confirmLabel?: string,
 *   cancelLabel?: string, opener?: Element|null, onConfirm?: (value: string) => unknown, errorText?: string,
 *   requiredText?: string,
 *   input?: { type?: string, autocomplete?: string, inputmode?: string, required?: boolean,
 *     spellcheck?: boolean, autocapitalize?: string, autocorrect?: string, enterkeyhint?: string } }} [options]
 * @returns {Promise<string|null>}
 */
export function prompt(options = {}) {
  return /** @type {Promise<string|null>} */ (ask('prompt', options));
}

/** The answer of a promise dialog that closed without its confirm button. */
const declined = (kind) => (kind === 'confirm' ? false : kind === 'prompt' ? null : undefined);

/**
 * Builds, opens and answers a promise dialog (confirm(), alert(),
 * prompt()): native <dialog> markup inside the opener's .ds-theme (else
 * the first one), DOM APIs only (no HTML strings, CSP-safe), removed once
 * its exit settled.
 */
function ask(kind, options) {
  const opener = options.opener ?? null;
  const doc = opener?.ownerDocument ?? globalThis.document;
  if (!doc?.createElement || !doc.body) return Promise.resolve(declined(kind));
  const theme = opener?.closest?.('.ds-theme') ?? activeIn(doc.body)?.closest?.('.ds-theme') ?? doc.querySelector('.ds-theme');
  const home = !theme || theme === doc.documentElement ? doc.body : theme;
  const id = `ds-ask-${sharedOf(doc).seq += 1}`;
  const make = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  };
  const native = typeof make('dialog').showModal === 'function';
  const dialog = make(native ? 'dialog' : 'div', 'ds-dialog');
  const box = make('div', 'ds-dialog__box');
  // The modal semantics: a native dialog has them; the div markup's box takes the role.
  const labelled = native ? dialog : box;
  const role = kind === 'alert' || options.destructive ? 'alertdialog' : 'dialog';
  if (native) {
    if (role === 'alertdialog') dialog.setAttribute('role', role);
  } else {
    dialog.hidden = true;
    box.setAttribute('role', role);
    box.setAttribute('aria-modal', 'true');
  }
  const backdrop = make('div', 'ds-dialog__backdrop');
  backdrop.setAttribute('data-close', '');
  const title = make('h2', 'ds-dialog__title', options.title ?? '');
  title.id = `${id}-title`;
  labelled.setAttribute('aria-labelledby', title.id);
  box.append(title);
  if (options.text) {
    const text = make('p', 'ds-dialog__text', options.text);
    text.id = `${id}-text`;
    labelled.setAttribute('aria-describedby', text.id);
    box.append(text);
  }
  /** @type {HTMLInputElement|null} */
  let field = null;
  if (kind === 'prompt') {
    const wrap = make('div', 'ds-field');
    const label = make('label', 'ds-field__label', options.label ?? '');
    field = /** @type {HTMLInputElement} */ (make('input', 'ds-input'));
    field.id = `${id}-field`;
    label.htmlFor = field.id;
    const input = options.input ?? {};
    field.type = input.type ?? 'text';
    if (input.autocomplete) field.setAttribute('autocomplete', input.autocomplete);
    if (input.inputmode) field.setAttribute('inputmode', input.inputmode);
    if (input.required) field.required = true;
    // Typing hints for a path or a code: written only when given, so the browser's defaults stay otherwise.
    if (typeof input.spellcheck === 'boolean') field.setAttribute('spellcheck', String(input.spellcheck));
    for (const name of ['autocapitalize', 'autocorrect', 'enterkeyhint']) {
      if (input[name]) field.setAttribute(name, input[name]);
    }
    field.value = options.value ?? '';
    field.setAttribute('autofocus', '');
    wrap.append(label, field);
    box.append(wrap);
  }
  const actions = make('div', 'ds-dialog__actions');
  const button = (className, text) => {
    const node = /** @type {HTMLButtonElement} */ (make('button', className, text));
    node.type = 'button';
    return node;
  };
  /** @type {HTMLButtonElement|null} */
  let cancel = null;
  let confirmButton;
  if (kind === 'alert') {
    confirmButton = button('ds-btn ds-btn--filled', options.closeLabel ?? 'OK');
    confirmButton.setAttribute('data-close', '');
    confirmButton.setAttribute('autofocus', '');
    actions.append(confirmButton);
  } else {
    cancel = button('ds-btn ds-btn--text', options.cancelLabel ?? 'Cancel');
    cancel.setAttribute('data-close', '');
    // The faces of busy(): the label, and the spinner with it while onConfirm runs.
    const label = options.confirmLabel ?? 'Confirm';
    confirmButton = button(options.destructive ? 'ds-btn ds-btn--filled ds-tone-error' : 'ds-btn ds-btn--filled');
    const faces = make('span', 'ds-btn__faces');
    const rest = make('span', 'ds-btn__face', label);
    const working = make('span', 'ds-btn__face ds-btn__face--busy');
    working.setAttribute('aria-hidden', 'true');
    working.append(make('span', 'ds-spinner ds-spinner--sm'), doc.createTextNode(label));
    faces.append(rest, working);
    confirmButton.append(faces);
    // The safe choice first in a destructive question; else the answer, or the field.
    if (options.destructive) cancel.setAttribute('autofocus', '');
    else if (!field) confirmButton.setAttribute('autofocus', '');
    actions.append(cancel, confirmButton);
  }
  box.append(actions);
  dialog.append(backdrop, box);

  return new Promise((resolve) => {
    dialog.addEventListener('ds-close', (event) => {
      if (event.target !== dialog) return;
      const reason = /** @type {CustomEvent} */ (event).detail?.reason;
      resolve(reason === 'confirm' ? (kind === 'confirm' ? true : kind === 'prompt' ? field?.value ?? '' : undefined) : declined(kind));
      // Gone once its exit settled (unless it opened again meanwhile).
      Promise.resolve(overlays.get(dialog)?.closing).then(() => {
        if (overlays.get(dialog)?.phase !== 'open') dialog.remove();
      });
    });
    if (kind === 'alert') {
      home.append(dialog);
      open(dialog, { opener });
      return;
    }
    // A required field left empty: the documented field error (an
    // aria-invalid field described by a .ds-field__hint--error with its
    // icon, so never colour alone), said at once since focus is already
    // there and the description is only read on the next focus.
    /** @type {HTMLElement|null} */
    let hint = null;
    const invalid = (/** @type {HTMLInputElement} */ input) => {
      const text = String(options.requiredText ?? REQUIRED_TEXT);
      if (!hint) {
        hint = make('small', 'ds-field__hint ds-field__hint--error');
        hint.id = `${id}-error`;
        hint.append(iconElement(alertCircle, 16, undefined, doc), doc.createTextNode(text));
        input.parentElement?.append(hint);
      }
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', hint.id);
      input.focus();
      const speaker = part('toast');
      speaker?.announce(text, { assertive: true, region: speaker.regionOfTheme(doc, theme, home) });
    };
    // Typing takes the error away at once (the documented instant removal).
    const valid = () => {
      if (!field) return;
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      hint?.remove();
      hint = null;
    };
    const attempt = async () => {
      if (dialog.hasAttribute('data-ds-busy') || overlays.get(dialog)?.phase !== 'open') return;
      if (field?.required && !field.value.trim()) {
        invalid(field);
        return;
      }
      valid();
      if (typeof options.onConfirm !== 'function') {
        close(dialog, { reason: 'confirm' });
        return;
      }
      // Busy: the dialog refuses the user's closes, Cancel says it is blocked, the value stays.
      dialog.setAttribute('data-ds-busy', '');
      cancel?.setAttribute('aria-disabled', 'true');
      if (field) field.readOnly = true;
      const settle = () => {
        dialog.removeAttribute('data-ds-busy');
        cancel?.removeAttribute('aria-disabled');
        if (field) field.readOnly = false;
      };
      try {
        await busy(confirmButton, () => options.onConfirm(field?.value ?? undefined), { done: false });
      } catch {
        settle();
        if (!dialog.isConnected) return;
        // Above the dialog: the theme's region (made when the page has
        // none) moves into it on first use.
        const speaker = part('toast');
        const region = speaker?.regionOfTheme(doc, theme, home);
        if (region) speaker.toast(region, options.errorText ?? CONFIRM_ERROR, { kind: 'error' });
        confirmButton.focus({ preventScroll: true });
        return;
      }
      settle();
      close(dialog, { reason: 'confirm' });
    };
    confirmButton.addEventListener('click', (/** @type {MouseEvent} */ event) => {
      if (event.detail > 1) return;
      attempt();
    });
    field?.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
      if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) return;
      event.preventDefault();
      attempt();
    });
    field?.addEventListener('input', valid);
    home.append(dialog);
    open(dialog, { opener });
  });
}

/**
 * An action sheet's list (.ds-dialog__list): ArrowUp, ArrowDown, Home and
 * End move focus among its .ds-menu__item rows (wrapping), as in a menu.
 */
function wireDialogList(dialog) {
  dialog.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const list = /** @type {Element} */ (event.target)?.closest?.('.ds-dialog__list');
    if (!list || !dialog.contains(list)) return;
    const next = arrowTarget([...list.querySelectorAll('.ds-menu__item')].filter(canFocus), event);
    if (!next) return;
    event.preventDefault();
    next.focus();
  });
}

/** The form dialogs that form() took over: its options, per dialog. @type {WeakMap<Element, { onSubmit: (data: FormData, form: HTMLFormElement) => unknown, errorText?: string }>} */
const forms = new WeakMap();

/**
 * Makes `element`'s box form run `onSubmit` before it closes (see the
 * header); returns its controller.
 * @param {Element} element
 * @param {{ onSubmit?: (data: FormData, form: HTMLFormElement) => unknown, errorText?: string }} [options]
 * @returns {ReturnType<typeof controllerOf>}
 */
export function form(element, options = {}) {
  if (typeof options.onSubmit === 'function') forms.set(element, { onSubmit: options.onSubmit, errorText: options.errorText });
  else forms.delete(element);
  return controllerOf(element);
}

/** A submit of the dialog's box form: ds:submit, then onSubmit (busy, a failure keeps it open), then the close. */
function wireForm(dialog) {
  dialog.addEventListener('submit', async (/** @type {SubmitEvent} */ event) => {
    const box = /** @type {HTMLFormElement} */ (event.target);
    if (!box?.matches?.('form.ds-dialog__box') || box.closest('.ds-dialog') !== dialog) return;
    event.preventDefault();
    if (dialog.hasAttribute('data-ds-busy') || overlays.get(dialog)?.phase !== 'open') return;
    const data = new FormData(box, /** @type {any} */ (event).submitter);
    if (!emit(dialog, 'submit', { form: box, data }, { cancelable: true })) return;
    const setup = forms.get(dialog);
    if (setup) {
      const submit = /** @type {any} */ (event).submitter ?? box.querySelector('[type="submit"]');
      dialog.setAttribute('data-ds-busy', '');
      try {
        await busy(submit, () => setup.onSubmit(data, box), { done: false });
      } catch {
        dialog.removeAttribute('data-ds-busy');
        if (!dialog.isConnected) return;
        const speaker = part('toast');
        const region = speaker?.regionOfTheme(dialog.ownerDocument, dialog.closest('.ds-theme'), dialog.parentNode);
        if (region) speaker.toast(region, setup.errorText ?? CONFIRM_ERROR, { kind: 'error' });
        if (canFocus(submit)) submit.focus({ preventScroll: true });
        return;
      }
      dialog.removeAttribute('data-ds-busy');
    }
    close(dialog, { reason: 'submit' });
  });
}

/**
 * The controller of a dialog, the one [data-ds-dialog] makes.
 * @param {Element} element
 * @returns {ReturnType<typeof controllerOf>}
 */
export function create(element) {
  return controllerOf(element);
}

define('dialog', {
  attribute: 'data-ds-dialog',
  init: (element) => create(element),
});

internals.use('dialog', {
  confirm,
  alert,
  prompt,
  wire(dialog) {
    wireDialogList(dialog);
    wireForm(dialog);
  },
});
