/*! Dashboard-Style 3.0.0-alpha.3 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of DS.toast (js/toast.js); DS.overlay.toast and the others call these. */
import type { ToastHandle, ToastKind } from './overlay.js';

export interface ToastOptions {
  kind?: ToastKind;
  persistent?: boolean;
  timeout?: number;
  closeLabel?: string;
  action?: { label: string; onClick?: (event: Event, handle: ToastHandle) => void };
  key?: string;
  restart?: boolean;
  reserve?: boolean;
}

/** The page's snackbar region (.ds-toasts), created when missing; null without a DOM. */
export declare function toastRegion(doc?: Document): HTMLElement | null;
/** Says `text` to assistive technology without a snackbar. */
export declare function announce(text: string, options?: { assertive?: boolean; region?: Element | null }): void;
/** Shows a snackbar in `region` (null: the page's region). */
export declare function toast(region: Element | null, content: Element | string, options?: ToastOptions): ToastHandle;
/** Closes the snackbars of `region` that match `filter`. */
export declare function closeToasts(region?: Element | null, filter?: { kind?: ToastKind; key?: string }): Promise<void>;
