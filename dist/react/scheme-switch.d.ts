/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <SchemeSwitch> (react/scheme-switch.js), generated from src/components/shell/. */
import type { BehaviourComponent, Controller } from './shared.js';

export type SchemeSwitchVariant = never;

export interface SchemeSwitchEvents {
  /** ds:change on the root. */
  onDsChange?: (event: CustomEvent) => void;
  /** ds:filter on the root. */
  onDsFilter?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface SchemeSwitchOptions {
}

export declare const SchemeSwitch: BehaviourComponent<'div', SchemeSwitchVariant, SchemeSwitchEvents & SchemeSwitchOptions, Controller>;
