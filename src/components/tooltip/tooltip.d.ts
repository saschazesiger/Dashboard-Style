/** Types of DS.tooltip (js/tooltip.js); DS.overlay.tooltips calls it. */
import type { Destroyable } from '../../types/js/motion.js';

/** Tooltips for every [data-tip] trigger under `root`. */
export declare function tooltips(root?: Document | Element | ShadowRoot): Destroyable;
