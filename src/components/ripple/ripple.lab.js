/*
 * The Motion Lab's pointer ripple: ds-press-ripple through DS.ripple, its
 * growth from the pointer, its fade on release, and a press that ends
 * because an ancestor captured the pointer. Moved from styleguide/lab.js;
 * the build wraps this file into styleguide/lab-components.js.
 */
var $ = function (selector, root) { return root.querySelector(selector); };
var $$ = function (selector, root) { return Array.prototype.slice.call(root.querySelectorAll(selector)); };

var PRESSES = [['corner', 30, 'Corner, a click'], ['centre', 30, 'Centre, a click'], ['corner', 600, 'Corner, held'], ['centre', 600, 'Centre, held']];

/* A row of chips that scrolls when dragged: it captures the pointer, so
   the press on the chip under it ends (DS.ripple listens for
   gotpointercapture) and the ripple fades as on release. */
var DRAG_CHIPS = ['Laptops', 'Desktops', 'Tablets', 'Printers', 'Phones', 'Monitors', 'Docks'];

function after(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, Math.max(0, ms)); });
}

function wait(sg, ms) { return after(sg.slow(ms)); }

/** A pointer event of a mouse, as the browser sends it. */
function pointer(target, type, x, y) {
  var View = target.ownerDocument.defaultView;
  target.dispatchEvent(new View.PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 1, pointerType: 'mouse',
    button: 0, buttons: type === 'pointerdown' ? 1 : 0, clientX: x, clientY: y,
  }));
}

/** A press on `host`, at its centre or near its top-left corner, released after `ms` at the current speed. */
function press(host, sg, at, ms) {
  var rect = host.getBoundingClientRect();
  var x = at === 'corner' ? rect.left + 6 : rect.left + rect.width / 2;
  var y = at === 'corner' ? rect.top + 6 : rect.top + rect.height / 2;
  pointer(host, 'pointerdown', x, y);
  return wait(sg, ms).then(function () { pointer(host, 'pointerup', x, y); });
}

/** The finite, time-based animations running in `root` and its subtree (pseudo-elements too). */
function moving(root) {
  var timeline = root.ownerDocument.timeline;
  return root.getAnimations({ subtree: true }).filter(function (animation) {
    var timing = animation.effect && animation.effect.getComputedTiming();
    if (!timing || !isFinite(timing.endTime) || animation.timeline !== timeline) return false;
    return animation.playState === 'running';
  });
}

/** Resolves once nothing finite moves in `root` any more; a ceiling ends a wait that never settles. */
function quiet(root, sg) {
  var end = Date.now() + sg.slow(10000);
  function round() {
    var running = moving(root);
    if (!running.length || Date.now() > end) return undefined;
    return Promise.race([
      Promise.all(running.map(function (animation) { return animation.finished.catch(function () {}); })),
      after(end - Date.now()),
    ]).then(function () { return sg.frames(2); }).then(round);
  }
  return sg.frames(2).then(round);
}

/** Waits until every pointer ripple in `root` has faded and gone. */
function ripplesGone(root, sg) {
  var end = Date.now() + sg.slow(6000);
  return new Promise(function (resolve) {
    (function check() {
      if (!root.querySelector('.ds-press-ripple') || Date.now() > end) { resolve(); return; }
      requestAnimationFrame(check);
    }());
  }).then(function () { return quiet(root, sg); });
}

function dragRow(row) {
  var start = null;
  row.addEventListener('pointerdown', function (event) {
    start = { x: event.clientX, left: row.scrollLeft, id: event.pointerId, dragging: false };
  });
  row.addEventListener('pointermove', function (event) {
    if (!start || !(event.buttons & 1)) return;
    if (!start.dragging && Math.abs(event.clientX - start.x) > 6) {
      start.dragging = true;
      try { row.setPointerCapture(start.id); } catch (error) { /* a synthetic pointer: nothing to capture */ }
    }
    if (start.dragging) row.scrollLeft = start.left - (event.clientX - start.x);
  });
  var stop = function () { start = null; };
  row.addEventListener('pointerup', stop);
  row.addEventListener('pointercancel', stop);
}

/* What the browser does when the row captures a pointer, for Replay (a synthetic pointer cannot be captured). */
function captureBy(row) {
  var View = row.ownerDocument.defaultView;
  row.dispatchEvent(new View.PointerEvent('gotpointercapture', { bubbles: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
}

SG_LAB.add({
  id: 'press-ripple',
  group: 'keyframes',
  title: 'Pointer ripple',
  note: '<code>DS.ripple.attach(grid)</code>: a press grows <code>ds-press-ripple</code> from the point that was pressed, out to the farthest corner, and fades it once the press ends, never before <code>--ds-dur-instant</code>, so a 30ms click still shows the whole press. Replay presses all four at once, as a mouse would; press them yourself too. The chip row below scrolls when dragged: it captures the pointer (<code>gotpointercapture</code>), so the press on the chip ends at once, as it would on release; <code>release()</code> of the handle does the same by hand.',
  shows: ['ds-press-ripple', 'ds-fade-out', 'DS.ripple.attach', 'release()', 'gotpointercapture', '--ds-dur-medium', '--ds-dur-base', '--ds-dur-instant', '--ds-ease-out', '--ds-ease-in-out'],
  html: '<div class="sg-press-grid" id="sg-press-grid">' + PRESSES.map(function (item) {
    return '<button class="ds-btn ds-btn--tonal" type="button" data-press-at="' + item[0] + '" data-press-ms="' + item[1] + '">' + item[2] + '</button>';
  }).join('') + '</div>' +
    '<div class="ds-chips sg-drag-row" id="sg-drag-row" role="group" aria-label="Device kinds (drag to scroll)">' + DRAG_CHIPS.map(function (name) {
      return '<button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">' + name + '</span></span></button>';
    }).join('') + '</div>',
  height: 236,
  setup: function (stage) {
    DS.ripple.attach($('#sg-press-grid', stage));
    DS.ripple.attach($('#sg-drag-row', stage));
    dragRow($('#sg-drag-row', stage));
  },
  reset: function (stage) {
    DS.ripple.attach($('#sg-drag-row', stage)).release();
    $('#sg-drag-row', stage).scrollLeft = 0;
  },
  play: function (stage, sg) {
    var hosts = $$('[data-press-at]', stage);
    var chip = $$('#sg-drag-row .ds-chip', stage)[1];
    var row = $('#sg-drag-row', stage);
    var dragged = press(chip, sg, 'centre', 600);
    var captured = wait(sg, 120).then(function () { captureBy(row); });
    return Promise.all(hosts.map(function (host) {
      return press(host, sg, host.getAttribute('data-press-at'), Number(host.getAttribute('data-press-ms')));
    }).concat([dragged, captured])).then(function () { return ripplesGone(stage, sg); });
  },
});
