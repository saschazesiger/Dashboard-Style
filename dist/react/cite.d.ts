/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <Cite> (react/cite.js), generated from src/components/cite/. */
import type { BehaviourComponent } from './shared.js';

export type CiteVariant = never;

export interface CiteEvents {
  /** ds:change on the root. */
  onDsChange?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface CiteOptions {
}

export declare const Cite: BehaviourComponent<'button', CiteVariant, CiteEvents & CiteOptions, ReturnType<typeof import('../js/cite.js').create>>;
