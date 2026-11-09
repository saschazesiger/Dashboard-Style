/*! Dashboard-Style 3.0.0-alpha.6 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/** Types of <Search> (react/search.js), generated from src/components/search/. */
import type { BehaviourComponent } from './shared.js';

export type SearchVariant = never;

export interface SearchEvents {
  /** ds:search on the root. */
  onDsSearch?: (event: CustomEvent) => void;
}

/** The options of its documented attributes. */
export interface SearchOptions {
}

export declare const Search: BehaviourComponent<'div', SearchVariant, SearchEvents & SearchOptions, ReturnType<typeof import('../js/search.js').create>>;
