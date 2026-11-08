/**
 * Counts the event listeners on window, document, <html> and <body>
 * (window.__listeners()), for the leak checks of react.spec.js: add and
 * remove are followed, and so are the two ways a listener goes by itself
 * (an aborted signal, `once` after its first call). A classic script that
 * runs before every other one.
 */
(function () {
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  /** target -> Map of "type|capture" -> Map(listener -> record) */
  const live = new Map();
  const watched = (target) => target === window || target === document || target === document.documentElement || target === document.body;
  const capture = (options) => Boolean(typeof options === 'boolean' ? options : options && options.capture);
  const slot = (target, type, options) => {
    if (!live.has(target)) live.set(target, new Map());
    const byType = live.get(target);
    const key = `${type}|${capture(options)}`;
    if (!byType.has(key)) byType.set(key, new Map());
    return byType.get(key);
  };
  proto.addEventListener = function (type, listener, options) {
    if (!listener || !watched(this)) return add.call(this, type, listener, options);
    const records = slot(this, type, options);
    if (records.has(listener)) return add.call(this, type, records.get(listener).wrapped, options);
    const signal = options && typeof options === 'object' ? options.signal : null;
    if (signal && signal.aborted) return undefined;
    const once = Boolean(options && typeof options === 'object' && options.once);
    const record = { wrapped: null };
    record.wrapped = once
      ? function (event) {
        records.delete(listener);
        return typeof listener === 'function' ? listener.call(this, event) : listener.handleEvent(event);
      }
      : listener;
    records.set(listener, record);
    if (signal) signal.addEventListener('abort', () => records.delete(listener), { once: true });
    return add.call(this, type, record.wrapped, options);
  };
  proto.removeEventListener = function (type, listener, options) {
    if (!listener || !watched(this)) return remove.call(this, type, listener, options);
    const records = slot(this, type, options);
    const record = records.get(listener);
    records.delete(listener);
    return remove.call(this, type, record ? record.wrapped : listener, options);
  };
  /** The live listeners by "target type|capture": { 'document keydown|false': 2, ... }. */
  window.__listeners = function () {
    const out = {};
    const name = (target) => (target === window ? 'window' : target === document ? 'document' : target === document.documentElement ? 'html' : 'body');
    for (const [target, byType] of live) {
      for (const [key, records] of byType) if (records.size) out[`${name(target)} ${key}`] = records.size;
    }
    return out;
  };
})();
