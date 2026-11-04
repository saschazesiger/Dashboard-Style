/*! Dashboard-Style 3.0.0-alpha.4 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of DS.sheet (js/sheet.js). */
import type { CloseReason, OpenOptions, OverlayController } from './overlay.js';

/** Opens a side sheet: DS.overlay.open(). */
export declare function open(element: Element, options?: OpenOptions): Promise<void>;
/** Closes a side sheet: DS.overlay.close(). */
export declare function close(element: Element, options?: { reason?: CloseReason }): Promise<void>;
/** The controller of a side sheet, the one [data-ds-sheet] makes. */
export declare function create(element: Element): OverlayController;
