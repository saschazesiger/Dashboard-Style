/**
 * The fan-out probe: counts clicks, registered through define().
 */
import { define, emit } from '../../js/core.js';

export function create(el) {
  let value = 0;
  const handlers = new Set();
  const listen = () => {
    value += 1;
    el.textContent = String(value);
    emit(el, 'fanout', { value });
    handlers.forEach((fn) => fn(value));
  };
  el.addEventListener('click', listen);
  return {
    get: () => value,
    set: (next) => { value = next; },
    on: (type, fn) => { handlers.add(fn); return () => handlers.delete(fn); },
    destroy: () => el.removeEventListener('click', listen),
  };
}

define('fanout', { attribute: 'data-ds-fanout', init(el) { return create(el); } });
