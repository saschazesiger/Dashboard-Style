/**
 * The bare specifier 'react-dom/client' for the browser tests (see
 * react.js): createRoot of the UMD build (react-dom.development.js,
 * window.ReactDOM), called the way the package's client entry calls it, so
 * React does not warn about the entry point. Dev-only; never shipped.
 */
const ReactDOM = globalThis.ReactDOM;
const internals = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

/** As react-dom/client: the client entry point marks its calls. */
function asClient(call) {
  internals.usingClientEntryPoint = true;
  try {
    return call();
  } finally {
    internals.usingClientEntryPoint = false;
  }
}

export function createRoot(container, options) {
  return asClient(() => ReactDOM.createRoot(container, options));
}

export const { flushSync } = ReactDOM;
