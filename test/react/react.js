/**
 * The bare specifier 'react' for the browser tests: an import map points
 * it here, and this module hands out the UMD build that the fixture loaded
 * first (react.development.js, window.React), as a bundler would resolve
 * the package. Dev-only; never shipped.
 */
const React = globalThis.React;

export default React;
export const {
  Children, Component, Fragment, Profiler, PureComponent, StrictMode, Suspense, cloneElement, createContext,
  createElement, createRef, forwardRef, isValidElement, lazy, memo, startTransition, useCallback, useContext,
  useDebugValue, useDeferredValue, useEffect, useId, useImperativeHandle, useInsertionEffect, useLayoutEffect,
  useMemo, useReducer, useRef, useState, useSyncExternalStore, useTransition, version,
} = React;
