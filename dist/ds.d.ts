/*! Dashboard-Style 3.0.0-alpha.4 | MIT License | https://github.com/saschazesiger/Dashboard-Style */
/**
 * Types of the classic script ds.js: the global DS and the registry
 * DashboardStyle (versions, runtime). Hand-written, like the module types
 * next to each module in js/*.d.ts (an import of js/<module>.js finds them
 * by itself). In a project with TypeScript or checkJs, reference this file:
 *
 *   /// <reference path="vendor/dashboard-style/ds.d.ts" />
 *
 * test/build.test.js keeps every declared export and its parameters equal
 * to the built modules.
 */
// generated: modules (scripts/build.mjs; do not edit)
import type * as core from './js/core.js';
import type * as motion from './js/motion.js';
import type * as indicator from './js/indicator.js';
import type * as dom from './js/dom.js';
import type * as ripple from './js/ripple.js';
import type * as icons from './js/icons.js';
import type * as position from './js/position.js';
import type * as overlay from './js/overlay.js';
import type * as a11y from './js/a11y.js';
import type * as hotkeys from './js/hotkeys.js';
import type * as format from './js/format.js';
import type * as store from './js/store.js';
import type * as virtual from './js/virtual.js';
import type * as dnd from './js/dnd.js';
import type * as badge from './js/badge.js';
import type * as dialog from './js/dialog.js';
import type * as menu from './js/menu.js';
import type * as sheet from './js/sheet.js';
import type * as toast from './js/toast.js';
import type * as tooltip from './js/tooltip.js';
// /generated: modules

/** What window.DS holds: the version, one namespace per module and the entry points of DS.core at the top level. */
export interface DashboardStyleApi {
  /** The version of this copy (package.json at build time). */
  readonly version: string;
  /** DS.core.init: attaches every registered behaviour under a root and keeps watching it. */
  readonly init: typeof core.init;
  /** DS.core.get: the controller of an element. */
  readonly get: typeof core.get;
  /** DS.core.define: registers a behaviour by name. */
  readonly define: typeof core.define;
  /** DS.core.config: locale and strings. */
  readonly config: typeof core.config;
  // generated: namespaces (scripts/build.mjs; do not edit)
  readonly core: typeof core;
  readonly motion: typeof motion;
  readonly indicator: typeof indicator;
  readonly dom: typeof dom;
  readonly ripple: typeof ripple;
  readonly icons: typeof icons;
  readonly position: typeof position;
  readonly overlay: typeof overlay;
  readonly a11y: typeof a11y;
  readonly hotkeys: typeof hotkeys;
  readonly format: typeof format;
  readonly store: typeof store;
  readonly virtual: typeof virtual;
  readonly dnd: typeof dnd;
  readonly badge: typeof badge;
  readonly dialog: typeof dialog;
  readonly menu: typeof menu;
  readonly sheet: typeof sheet;
  readonly toast: typeof toast;
  readonly tooltip: typeof tooltip;
  // /generated: namespaces
}

/** Every copy of ds.js on the page, by version: a widget reads DashboardStyle.versions['<its version>'] || DS. */
export interface DashboardStyleRegistry {
  versions: Record<string, DashboardStyleApi>;
  /** The page's one runtime, made by the copy that loaded first (DS.core.runtime). */
  readonly runtime: core.Runtime;
}

declare global {
  /** The first copy of ds.js on the page (a second copy of another version leaves it alone). */
  var DS: DashboardStyleApi;
  var DashboardStyle: DashboardStyleRegistry;
}
