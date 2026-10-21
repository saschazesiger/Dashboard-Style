/**
 * Updating rendered HTML in place, without restarting animations.
 *
 * Replacing innerHTML recreates every node: entrance animations play again,
 * spinners jump back to their start, transitions never run and focus is
 * lost. morphHtml() instead patches the nodes that are already there:
 *
 * - A node of the same tag (and the same key, or both without one) is kept.
 *   Its attributes are synced (changed ones set, missing ones removed) and
 *   its children patched the same way, so a class or --ds-progress change
 *   runs its transition. Text nodes change their text in place.
 * - Keys: `data-ds-key`, else `id`. A keyed node is looked up among all old
 *   siblings and moved to its place; two different keys never morph into
 *   each other. Unkeyed nodes match by position, with a short look-ahead
 *   (8 siblings) for an identical node, so the cost stays linear.
 * - Runtime state survives: the classes DS adds (ds-enter*, ds-leave*,
 *   ds-has-indicator, ds-pressed, ds-ripples), the custom properties it
 *   writes (--ds-i, --ds-indicator-*, --ds-ripple-*, --ds-motion-origin,
 *   --ds-clip-from), data-ds-staggered and the `inert` of an element in a
 *   DS.motion.leave() (ds-leave*). The focused element and its ancestors
 *   are always patched, never replaced; a focused control keeps its live
 *   value and selection (only unfocused controls get their value, checked
 *   and selected properties from changed attributes).
 * - `data-ds-keep` nodes (the indicator, ripples) are never matched,
 *   moved or removed. `data-ds-replace` on a node, old or new, or
 *   `{ replace: true }` for the whole call, brings back replace-on-change
 *   for that subtree (fresh nodes, fresh listeners).
 * - Hooks for DS.motion.flip(): `onInsert(node)` after a new element went
 *   in; `onRemove(node)` may return a Promise, and the node then stays as a
 *   pending removal (inert, aria-hidden, data-ds-leaving) that later morphs
 *   skip, until the Promise settles. DS.motion.leave() marks an element it
 *   will remove the same way (data-ds-leaving), so a re-render during its
 *   exit patches the next live sibling instead. `holdOrder: true` patches
 *   matched children of `target` in place and leaves moves, inserts and
 *   removals to a later call.
 *
 * ES2022 (Safari 16.4); a module may import from an earlier module; newer
 * APIs only behind feature detection, named under Progressive:.
 *
 * Progressive: moveBefore (a keyed move keeps the node's animations,
 * focus and iframe state); elsewhere insertBefore, and a moved node that
 * held the focus gets it back with its selection. insertBefore makes the
 * node new to the style engine, so its @starting-style entrances (a status
 * icon) would play again: it carries data-ds-moving (transition: none in
 * motion.css) until one style flush at the end of the call.
 */

/** How many candidate siblings the look-ahead for an identical node checks. */
const LOOKAHEAD = 8;

/** Classes that DS sets at runtime; a patch never removes them. */
const RUNTIME_CLASS = /^ds-(?:enter|leave)(?:--[\w-]+)?$|^ds-(?:has-indicator|pressed|ripples)$/;

/** Custom properties that DS writes at runtime; a patch keeps them over the new style text. */
const RUNTIME_STYLE = /^--ds-(?:i|indicator-[\w-]+|ripple-[\w-]+|motion-origin|clip-from)$/;

/** Attributes that DS sets at runtime; a patch never removes them. */
const RUNTIME_ATTRIBUTES = new Set(['data-ds-staggered', 'data-ds-moving']);

/** An element in a DS.motion.leave() (running, or kept with then: 'keep'): its `inert` is runtime state. */
const exiting = (element) => Array.from(element.classList ?? []).some((name) => /^ds-leave(?:--[\w-]+)?$/.test(name));

/**
 * @typedef {object} MorphOptions
 * @property {boolean} [replace]  replace instead of patching nodes whose shell differs
 * @property {boolean} [holdOrder]  patch matched children of the target only (no moves, inserts or removals)
 * @property {(node: Element) => void} [onInsert]  after a new element was inserted
 * @property {(node: Element) => (Promise<unknown>|unknown)} [onRemove]  before an element goes; a Promise keeps it until it settles
 */

/**
 * @typedef {object} Context
 * @property {boolean} replace
 * @property {MorphOptions} options
 * @property {Element|null} active  the focused element at the start of the call
 * @property {Element[]} moved  nodes moved by insertBefore, marked data-ds-moving until the call ends
 */

const isElement = (node) => node?.nodeType === 1;

/** Same element "shell": tag and attributes, ignoring the children. */
function sameShell(a, b) {
  if (!isElement(a) || !isElement(b)) return false;
  const x = /** @type {Element} */ (a);
  const y = /** @type {Element} */ (b);
  if (x.tagName !== y.tagName || x.attributes.length !== y.attributes.length) return false;
  for (const attribute of Array.from(x.attributes)) {
    if (y.getAttribute(attribute.name) !== attribute.value) return false;
  }
  return true;
}

/** The key of a node: data-ds-key, else id, else null. */
function keyOf(node) {
  if (!isElement(node)) return null;
  return node.getAttribute('data-ds-key') || node.getAttribute('id') || null;
}

const kept = (node) => isElement(node) && node.hasAttribute('data-ds-keep');
const leaving = (node) => isElement(node) && node.hasAttribute('data-ds-leaving');
/** A node a morph never looks at: kept (indicator, ripple) or a pending removal. */
const skipped = (node) => kept(node) || leaving(node);
const blank = (node) => node.nodeType === 3 && !/\S/.test(node.nodeValue ?? '');
const replacing = (node) => isElement(node) && node.hasAttribute('data-ds-replace');

/** The node itself or the first sibling after it that a morph looks at. */
function live(node) {
  let current = node;
  while (current && skipped(current)) current = current.nextSibling;
  return current;
}

/** Holds the focused element (or is it). */
function holdsFocus(node, ctx) {
  return Boolean(ctx.active && isElement(node) && (node === ctx.active || node.contains(ctx.active)));
}

/** Same kind of node: both text, both comments, or elements of one tag. */
function sameKind(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  return !isElement(a) || a.tagName === b.tagName;
}

/* ── Removing and inserting ─────────────────────────── */

/**
 * Removes a node, through onRemove: a returned Promise keeps it as a
 * pending removal (inert, hidden from assistive tech, skipped by later
 * morphs) until it settles. Kept nodes never go.
 */
function removeNode(node, ctx) {
  if (kept(node)) return;
  if (!isElement(node) || typeof ctx.options.onRemove !== 'function') {
    node.remove();
    return;
  }
  const result = ctx.options.onRemove(/** @type {Element} */ (node));
  if (!result || typeof (/** @type {any} */ (result).then) !== 'function') {
    node.remove();
    return;
  }
  const element = /** @type {HTMLElement} */ (node);
  element.setAttribute('data-ds-leaving', '');
  element.setAttribute('aria-hidden', 'true');
  element.inert = true;
  const done = () => element.remove();
  /** @type {Promise<unknown>} */ (result).then(done, done);
}

function insertNode(parent, node, before, ctx) {
  parent.insertBefore(node, before);
  if (isElement(node)) ctx.options.onInsert?.(node);
}

/**
 * Moves a kept node before `before`: moveBefore where it exists (the node
 * keeps its animations and focus), else insertBefore, after which a node
 * that held the focus gets it back with its selection. The insertBefore
 * path marks the node data-ds-moving, so it skips its @starting-style
 * entrances; morphChildren() lifts the marks after one style flush.
 */
function moveNode(parent, node, before, ctx) {
  if (typeof parent.moveBefore === 'function') {
    try {
      parent.moveBefore(node, before);
      return;
    } catch {
      // Not movable atomically (another document, disconnected): insert.
    }
  }
  const focused = holdsFocus(node, ctx) ? /** @type {any} */ (ctx.active) : null;
  let selection = null;
  try {
    if (focused && typeof focused.selectionStart === 'number') selection = [focused.selectionStart, focused.selectionEnd, focused.selectionDirection];
  } catch {
    // Inputs without a selection (checkbox, number) throw on read.
  }
  if (!node.hasAttribute('data-ds-moving')) {
    node.setAttribute('data-ds-moving', '');
    ctx.moved.push(node);
  }
  parent.insertBefore(node, before);
  const doc = parent.ownerDocument;
  if (focused && doc?.activeElement !== focused && typeof focused.focus === 'function') {
    focused.focus({ preventScroll: true });
    if (selection) focused.setSelectionRange?.(selection[0], selection[1], selection[2] ?? undefined);
  }
}

/* ── Patching one node ──────────────────────────────── */

/** Syncs the class attribute, keeping the runtime classes of `old`. */
function syncClass(old, next) {
  const wanted = (next.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  const current = Array.from(old.classList);
  const runtime = current.filter((name) => RUNTIME_CLASS.test(name) && !wanted.includes(name));
  const result = [...wanted, ...runtime];
  if (result.length === current.length && result.every((name) => current.includes(name))) return;
  if (result.length) old.setAttribute('class', result.join(' '));
  else old.removeAttribute('class');
}

/** Syncs the style attribute, then puts back the custom properties DS wrote at runtime. */
function syncStyle(old, next) {
  const wanted = next.getAttribute('style');
  if (old.getAttribute('style') === wanted) return;
  const style = old.style;
  const runtime = [];
  if (style) {
    for (let index = 0; index < style.length; index += 1) {
      const name = style[index];
      if (RUNTIME_STYLE.test(name)) runtime.push([name, style.getPropertyValue(name), style.getPropertyPriority(name)]);
    }
  }
  if (wanted === null) old.removeAttribute('style');
  else old.setAttribute('style', wanted);
  for (const [name, value, priority] of runtime) style.setProperty(name, value, priority);
  if (style && !style.length && wanted === null) old.removeAttribute('style');
}

/** An unfocused form control follows a changed attribute with its live property too. */
function syncProperty(element, name, present, ctx) {
  if (element === ctx.active) return;
  const tag = element.tagName;
  if (tag === 'INPUT' && name === 'value') element.value = element.getAttribute('value') ?? '';
  else if (tag === 'INPUT' && name === 'checked') element.checked = present;
  else if (tag === 'OPTION' && name === 'selected') element.selected = present;
}

/** Sets the changed attributes of `next` on `old` and removes the missing ones. */
function syncAttributes(old, next, ctx) {
  for (const attribute of Array.from(old.attributes)) {
    const name = attribute.name;
    if (name === 'class' || name === 'style' || RUNTIME_ATTRIBUTES.has(name)) continue;
    if (name === 'inert' && exiting(old)) continue;
    if (attribute.namespaceURI ? next.hasAttributeNS(attribute.namespaceURI, attribute.localName) : next.hasAttribute(name)) continue;
    if (attribute.namespaceURI) old.removeAttributeNS(attribute.namespaceURI, attribute.localName);
    else old.removeAttribute(name);
    syncProperty(old, name, false, ctx);
  }
  for (const attribute of Array.from(next.attributes)) {
    const name = attribute.name;
    if (name === 'class' || name === 'style') continue;
    if (attribute.namespaceURI) {
      if (old.getAttributeNS(attribute.namespaceURI, attribute.localName) === attribute.value) continue;
      old.setAttributeNS(attribute.namespaceURI, name, attribute.value);
    } else {
      if (old.getAttribute(name) === attribute.value) continue;
      old.setAttribute(name, attribute.value);
    }
    syncProperty(old, name, true, ctx);
  }
  syncClass(old, next);
  syncStyle(old, next);
}

/**
 * Patches `old` into `next` (same kind): text in place, or the attributes
 * and then the children of an element.
 */
function patchNode(old, next, ctx) {
  if (!isElement(old)) {
    if (old.nodeValue !== next.nodeValue) old.nodeValue = next.nodeValue;
    return;
  }
  if (!sameShell(old, next)) syncAttributes(old, next, ctx);
  const inner = { ...ctx, replace: ctx.replace || replacing(old) || replacing(next) };
  const before = old.tagName === 'TEXTAREA' ? old.textContent : null;
  patchChildren(old, Array.from(next.childNodes), inner, false);
  // A textarea's value follows its text only until it is edited.
  if (before !== null && old !== ctx.active && old.textContent !== before) old.value = old.textContent;
}

/**
 * Whether `old` may be patched into `next` in place: the same kind, and
 * neither (nor the call) asks for replacement, unless `old` holds the
 * focus, which is never replaced.
 */
function patchable(old, next, ctx) {
  if (!sameKind(old, next)) return false;
  if (holdsFocus(old, ctx)) return true;
  return !(ctx.replace || replacing(old) || replacing(next));
}

/* ── Children ───────────────────────────────────────── */

/**
 * Looks at most LOOKAHEAD candidate siblings after `cursor` for a node
 * identical to `node` (tags first, isEqualNode last). Blank text, keyed,
 * kept and leaving nodes are no candidates. A hit behind a node that holds
 * the focus does not count (the focused node would go).
 */
function lookAhead(cursor, node, ctx) {
  let candidate = cursor.nextSibling;
  let checked = 0;
  if (holdsFocus(cursor, ctx)) return null;
  while (candidate && checked < LOOKAHEAD) {
    if (!skipped(candidate) && !blank(candidate) && keyOf(candidate) === null) {
      checked += 1;
      if (sameKind(candidate, node) && candidate.isEqualNode(node)) return candidate;
      if (holdsFocus(candidate, ctx)) return null;
    }
    candidate = candidate.nextSibling;
  }
  return null;
}

/**
 * holdOrder: patches the old children that match a desired one (by key,
 * or unkeyed by position and kind) and touches nothing else.
 */
function patchInPlace(parent, desired, ctx) {
  const keyed = new Map();
  const unkeyed = [];
  for (const child of Array.from(parent.childNodes)) {
    if (skipped(child)) continue;
    const key = keyOf(child);
    if (key === null) unkeyed.push(child);
    else if (!keyed.has(key)) keyed.set(key, child);
  }
  let index = 0;
  for (const node of desired) {
    const key = keyOf(node);
    if (key !== null) {
      const old = keyed.get(key);
      if (old && old.tagName === node.tagName) {
        keyed.delete(key);
        patchNode(old, node, ctx);
      }
      continue;
    }
    const limit = Math.min(unkeyed.length, index + LOOKAHEAD + 1);
    for (let at = index; at < limit; at += 1) {
      if (!sameKind(unkeyed[at], node)) continue;
      if (!unkeyed[at].isEqualNode(node)) patchNode(unkeyed[at], node, ctx);
      index = at + 1;
      break;
    }
  }
}

/**
 * Makes the children of `parent` equal to `desired` (detached nodes). For
 * each desired node: a keyed one is looked up by key and moved into
 * place; an unkeyed one is kept when the cursor is identical, recursed
 * into when the cursor has the same shell, found by the look-ahead
 * (dropping what lies between), patched when the cursor has the same tag,
 * else inserted. What is left over goes.
 */
function patchChildren(parent, desired, ctx, top) {
  if (top && ctx.options.holdOrder) {
    patchInPlace(parent, desired, ctx);
    return;
  }
  /** @type {Map<string, Node>} */
  const keyed = new Map();
  for (const child of Array.from(parent.childNodes)) {
    const key = skipped(child) ? null : keyOf(child);
    if (key !== null && !keyed.has(key)) keyed.set(key, child);
  }
  const used = new Set();
  let cursor = live(parent.firstChild);
  const step = () => {
    cursor = live(cursor.nextSibling);
  };

  for (const node of desired) {
    const key = keyOf(node);
    if (key !== null) {
      const old = keyed.get(key);
      if (old && !used.has(old) && sameKind(old, node) && (sameShell(old, node) || patchable(old, node, ctx))) {
        used.add(old);
        if (old === cursor) step();
        else moveNode(parent, old, cursor, ctx);
        patchNode(old, node, ctx);
      } else {
        insertNode(parent, node, cursor, ctx);
      }
      continue;
    }
    if (!cursor) {
      insertNode(parent, node, null, ctx);
      continue;
    }
    const cursorKeyed = keyOf(cursor) !== null;
    // 1. Identical: keep it.
    if (!cursorKeyed && sameKind(cursor, node) && cursor.isEqualNode(node)) {
      step();
      continue;
    }
    // 2. Same shell: only the children differ.
    if (!cursorKeyed && sameShell(cursor, node)) {
      const current = cursor;
      step();
      patchNode(current, node, ctx);
      continue;
    }
    // 3. An identical node a few siblings on: what lies between is gone.
    const match = cursorKeyed ? null : lookAhead(cursor, node, ctx);
    if (match) {
      let stale = cursor;
      while (stale && stale !== match) {
        const next = stale.nextSibling;
        // Keyed nodes may still be matched further on; kept and leaving ones stay.
        if (!skipped(stale) && keyOf(stale) === null) removeNode(stale, ctx);
        stale = next;
      }
      cursor = live(match.nextSibling);
      continue;
    }
    // 4. Same tag, both unkeyed: patch in place, or swap it where replacement is asked for.
    if (!cursorKeyed && sameKind(cursor, node)) {
      const current = cursor;
      step();
      if (patchable(current, node, ctx)) patchNode(current, node, ctx);
      else {
        insertNode(parent, node, current, ctx);
        removeNode(current, ctx);
      }
      continue;
    }
    // 5. New.
    insertNode(parent, node, cursor, ctx);
  }

  // Left over: everything from the cursor on, and keyed nodes nobody asked for.
  while (cursor) {
    const stale = cursor;
    cursor = live(stale.nextSibling);
    if (!used.has(stale)) removeNode(stale, ctx);
  }
  for (const old of keyed.values()) {
    if (!used.has(old) && old.parentNode === parent && !leaving(old)) removeNode(old, ctx);
  }
}

/**
 * Makes the children of `target` equal to `nodes` (detached nodes),
 * patching in place (see the header).
 * @param {Node} target
 * @param {Node[]|NodeList} nodes
 * @param {MorphOptions} [options]
 */
export function morphChildren(target, nodes, options = {}) {
  const ctx = {
    replace: options.replace === true,
    options,
    active: /** @type {any} */ (target).ownerDocument?.activeElement ?? null,
    moved: [],
  };
  try {
    patchChildren(target, Array.from(nodes), ctx, true);
  } finally {
    settleMoved(ctx.moved);
  }
}

/**
 * Lifts the data-ds-moving marks after one style flush: the moved nodes
 * get their style without transitions (no @starting-style entrance), and
 * keep it as their before-change style once the mark is gone.
 */
function settleMoved(moved) {
  if (!moved.length) return;
  const view = moved[0].ownerDocument?.defaultView;
  // Reading a computed value resolves the style of the whole document.
  if (typeof view?.getComputedStyle === 'function') void view.getComputedStyle(moved[0]).opacity;
  for (const node of moved) node.removeAttribute('data-ds-moving');
}

/**
 * Sets the content of `target` to `html`, touching only what changed.
 * @param {Element} target
 * @param {string} html
 * @param {MorphOptions} [options]  replace, holdOrder, onInsert, onRemove (pass DS.motion.flip's object straight on)
 */
export function morphHtml(target, html, options = {}) {
  const template = target.ownerDocument.createElement('template');
  template.innerHTML = html;
  morphChildren(target, Array.from(template.content.childNodes), options);
}
