/*! Dashboard-Style 3.0.0-alpha.4 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of DS.menu (js/menu.js). */
import type { CloseReason, OpenOptions, OverlayController } from './overlay.js';

/** Opens a menu: DS.overlay.open(). */
export declare function open(element: Element, options?: OpenOptions): Promise<void>;
/** Closes a menu: DS.overlay.close(). */
export declare function close(element: Element, options?: { reason?: CloseReason }): Promise<void>;
/** The controller of a menu, the one [data-ds-menu] makes. */
export declare function create(element: Element): OverlayController;
