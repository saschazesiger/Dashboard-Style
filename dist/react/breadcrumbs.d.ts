/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <Breadcrumbs> (react/breadcrumbs.js), generated from src/components/shell/. */
import type { BehaviourComponent, Controller } from './shared.js';

export type BreadcrumbsVariant = never;

export interface BreadcrumbsEvents {
  /** ds:change on the root. */
  onDsChange?: (event: CustomEvent) => void;
  /** ds:filter on the root. */
  onDsFilter?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface BreadcrumbsOptions {
}

export declare const Breadcrumbs: BehaviourComponent<'nav', BreadcrumbsVariant, BreadcrumbsEvents & BreadcrumbsOptions, Controller>;
