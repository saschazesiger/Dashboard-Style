/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <Shell> (react/shell.js), generated from src/components/shell/. */
import type { BehaviourComponent } from './shared.js';

export type ShellVariant = 'drawer' | 'keyboard-hides-bar';

export interface ShellEvents {
  /** ds:change on the root. */
  onDsChange?: (event: CustomEvent) => void;
  /** ds:filter on the root. */
  onDsFilter?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface ShellOptions {
}

export declare const Shell: BehaviourComponent<'div', ShellVariant, ShellEvents & ShellOptions, ReturnType<typeof import('../js/shell.js').create>>;
