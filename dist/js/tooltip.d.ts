/*! Dashboard-Style 3.0.0-alpha.4 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of DS.tooltip (js/tooltip.js); DS.overlay.tooltips calls it. */
import type { Destroyable } from './motion.js';

/** Tooltips for every [data-tip] trigger under `root`. */
export declare function tooltips(root?: Document | Element | ShadowRoot): Destroyable;
