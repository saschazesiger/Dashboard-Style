/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <ListDetail> (react/listdetail.js), generated from src/components/listdetail/. */
import type { BehaviourComponent } from './shared.js';

export type ListDetailVariant = 'outlined';

export interface ListDetailEvents {
  /** ds:change on the root. */
  onDsChange?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface ListDetailOptions {
}

export declare const ListDetail: BehaviourComponent<'div', ListDetailVariant, ListDetailEvents & ListDetailOptions, ReturnType<typeof import('../js/listdetail.js').create>>;
