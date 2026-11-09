/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <Secret> (react/secret.js), generated from src/components/secret/. */
import type { BehaviourComponent } from './shared.js';

export type SecretVariant = 'changed' | 'filled' | 'full' | 'grow' | 'inset' | 'outlined' | 'success' | 'warning';

export interface SecretEvents {
  /** ds:change on the root. */
  onDsChange?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface SecretOptions {
}

export declare const Secret: BehaviourComponent<'div', SecretVariant, SecretEvents & SecretOptions, ReturnType<typeof import('../js/secret.js').create>>;
