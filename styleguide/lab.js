/*
 * The Motion Lab's demo registry (motion.html). A classic script on top of
 * dist/ds.js, loaded before styleguide.js, which renders the entries into
 * the lab's sections, wires their buttons and marks html[data-sg-ready].
 *
 *   window.SG_LAB_GROUPS   the lab's sections in page order: id, title,
 *                          icon (a DS.icons name), lead; a group without
 *                          demos is not rendered
 *   window.SG_LAB          the demos in page order, one entry each:
 *
 *   id, group, title       data-lab-demo="<id>", its section, the card title
 *   shows                  what the demo exercises: classes ('.ds-enter--pop'),
 *                          keyframes ('ds-draw'), exports ('DS.motion.flip')
 *                          and tokens ('--ds-ease-spatial'); the card lists
 *                          them in data-lab-shows and names the tokens with
 *                          their computed ms at the current speed
 *   note                   optional caption above the stage
 *   html                   the stage markup (.sg-lab-stage: at least
 *                          `height`, taller where its content needs it;
 *                          a demo keeps its size between states, so a
 *                          replay never shifts the page)
 *   height                 optional minimum stage height in px (default 184)
 *   after                  optional markup right under the stage (a caption)
 *   controls               optional markup: the demo's own buttons, in a
 *                          row under Replay
 *   wide                   optional: the card spans the whole row
 *   playLabel              optional label of the Replay button
 *   setup(stage, sg)       optional, once after rendering (wires controls)
 *   play(stage, sg)        plays the motion; returns a Promise that resolves
 *                          once it has settled (through DS.motion.settled)
 *   toggle(stage, on, sg)  optional, for reversible motion: towards `on`
 *                          from wherever the motion is (D21); a Promise like
 *                          play(). Gives the card "Rapid toggle" (five
 *                          toggles 80ms apart) and "Reverse at 50%"
 *   state(stage)           optional, with toggle: where a reversible demo is
 *                          now (true: the end of its motion). Without it the
 *                          lab assumes false at first and true after play()
 *   reset(stage, sg)       optional, back to the start before a Replay
 *                          (and before the tests' Rapid toggle); may
 *                          return a Promise that resolves there
 *   subject(stage)         optional: the element whose motion "Reverse at
 *                          50%" times (an overlay at the end of <body>, a
 *                          frame's document); default the stage
 *
 * `sg` is the styleguide's helper object: icon(name, size, cls), toast(text,
 * kind), slow(ms) (a demo timer at the current speed), indicator(track,
 * options) (a DS.indicator the theme switch re-places) and frames(n).
 *
 * A plot's SVG carries data-lab-peak (the highest sample, 3 decimals) and
 * data-lab-values (the 101 samples) for the browser tests.
 *
 * The lab's own motion (plots, lanes, the ladder) runs on el.animate with
 * the id 'sg-lab', so DS.motion.settled(stage, { names: ['sg-lab'],
 * subtree: true }) waits for it like for any CSS animation. Interrupted, it
 * reads the current value, cancels and continues from there with the curve
 * of the new direction: the one mechanism of DS.motion (D21).
 *
 * Styleguide tooling only, in the ES5 style of styleguide.js.
 */
(function () {
  'use strict';

  var DS = window.DS;
  var M = DS.motion;
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var esc = function (text) { return String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var icon = function (name, size, cls) { return DS.icons.icon(DS.icons[name], size, cls); };

  /* Markup through an inert <template>, as in styleguide.js: parsing
     straight into the page would end the render block of the pages'
     <link rel="expect"> early in Chromium. */
  function setHtml(element, html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    element.replaceChildren(template.content);
  }

  /** The id of the lab's script animations: settled() waits for it by name. */
  var LAB = 'sg-lab';

  /** Waits for the lab's own animations in `root` (and its subtree). */
  function settledLab(root) {
    return M.settled(root, { names: [LAB], subtree: true });
  }

  /**
   * el.animate() on the curve of an easing token, as the browser computes
   * it. An engine that cannot parse linear() in el.animate() (Chrome 111,
   * Safari 16.4) throws: then the token's cubic fallback plays, as in
   * DS.motion.
   */
  function animateToken(el, frames, duration, token, options) {
    var timing = { duration: duration, easing: M.motionEasing(el, token) };
    if (options && options.fill) timing.fill = options.fill;
    var animation;
    try {
      animation = el.animate(frames, timing);
    } catch (error) {
      timing.easing = String(M.MOTION_FALLBACKS[token] || 'ease');
      animation = el.animate(frames, timing);
    }
    animation.id = LAB;
    return animation;
  }

  /**
   * Moves `el` along x to `x` px from wherever it is painted now (a running
   * move included): read the current translate, cancel, then animate from
   * there to the target, which stays as the element's own style.
   */
  function moveTo(el, x, duration, token) {
    var from = getComputedStyle(el).translate;
    el.getAnimations().forEach(function (animation) { if (animation.id === LAB) animation.cancel(); });
    var to = x + 'px 0px';
    el.style.translate = to;
    if (!duration) return null;
    return animateToken(el, [{ translate: !from || from === 'none' ? '0px 0px' : from }, { translate: to }], duration, token);
  }

  /** How far a box travels in its lane: the lane's width minus the box, at most `cap` px. */
  function travel(box, cap) {
    var room = Math.max(0, box.parentNode.clientWidth - box.offsetWidth);
    return Math.round(cap ? Math.min(cap, room) : room);
  }

  /* ── Helpers of the choreography demos ───────────────────────────── */

  /** Resolves after `ms` of real time (a duration already read from the tokens). */
  function after(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, Math.max(0, ms)); });
  }

  /** A demo's own pause (a fake request, a step of a story) at the current speed. */
  function wait(sg, ms) { return after(sg.slow(ms)); }

  /** Resolves once `test()` holds, checked every frame, or after `ms` at the current speed. */
  function until(sg, test, ms) {
    var end = Date.now() + sg.slow(ms || 4000);
    return new Promise(function (resolve) {
      (function check() {
        if (test() || Date.now() > end) { resolve(); return; }
        requestAnimationFrame(check);
      }());
    });
  }

  /** The finite, time-based animations running in `root` and its subtree (pseudo-elements too). */
  function moving(root) {
    if (!root || !root.isConnected) return [];
    var timeline = root.ownerDocument.timeline;
    return root.getAnimations({ subtree: true }).filter(function (animation) {
      var timing = animation.effect && animation.effect.getComputedTiming();
      // Loops never end and scroll-driven animations follow the scroll.
      if (!timing || !isFinite(timing.endTime) || animation.timeline !== timeline) return false;
      return animation.playState === 'running';
    });
  }

  /**
   * Resolves once nothing finite moves in `roots` any more: CSS animations
   * and transitions, el.animate() (a FLIP, a handoff, the chip slot) and
   * pseudo-elements alike. It looks again two frames after each round, so
   * motion that one motion starts (a ripple's fade after its growth, a
   * held reorder) is waited for too; a ceiling ends a wait that never
   * settles. DS.motion.settled() waits for one element's own named motion;
   * a demo that starts motion in many places waits for all of it here.
   */
  function quiet(roots, sg) {
    var list = [].concat(roots);
    var end = Date.now() + sg.slow(10000);
    function round() {
      var running = [];
      list.forEach(function (root) { running = running.concat(moving(root)); });
      if (!running.length || Date.now() > end) return undefined;
      return Promise.race([
        Promise.all(running.map(function (animation) { return animation.finished.catch(function () {}); })),
        after(end - Date.now()),
      ]).then(function () { return sg.frames(2); }).then(round);
    }
    return sg.frames(2).then(round);
  }

  /** A pointer event of a mouse, as the browser sends it (DS.ripple and the tooltips listen for these). */
  function pointer(target, type, x, y, related) {
    var View = target.ownerDocument.defaultView;
    target.dispatchEvent(new View.PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 1, pointerType: 'mouse',
      button: 0, buttons: type === 'pointerdown' ? 1 : 0, clientX: x, clientY: y, relatedTarget: related || null,
    }));
  }

  /**
   * A press on `host`, at its centre or near its top-left corner, released
   * after `ms` (at the current speed): what DS.ripple sees from a mouse.
   * It neither focuses nor clicks the host.
   */
  function press(host, sg, at, ms) {
    var rect = host.getBoundingClientRect();
    var x = at === 'corner' ? rect.left + 6 : rect.left + rect.width / 2;
    var y = at === 'corner' ? rect.top + 6 : rect.top + rect.height / 2;
    pointer(host, 'pointerdown', x, y);
    return wait(sg, ms).then(function () { pointer(host, 'pointerup', x, y); });
  }

  /** Waits until every pointer ripple in `root` has faded and gone. */
  function ripplesGone(root, sg) {
    return until(sg, function () { return !root.querySelector('.ds-press-ripple'); }, 6000).then(function () { return quiet(root, sg); });
  }

  /** A switch row with its state word (switch.css crossfades On and Off). */
  function switchHtml(id, name, checked) {
    return '<label class="ds-switch"><input type="checkbox" role="switch" id="' + id + '"' + (checked ? ' checked' : '') + '><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">' + name + '</span>' +
      '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
  }

  /** The faces of a button that works (button.css): label, busy, done. */
  function facesHtml(label, busyLabel, doneLabel) {
    return '<span class="ds-btn__faces"><span class="ds-btn__face">' + esc(label) + '</span>' +
      '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>' + esc(busyLabel) + '</span>' +
      '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + icon('check', 16) + esc(doneLabel) + '</span></span>';
  }

  /** A read-out line under a stage (data-lab-readout), polite to screen readers. */
  function readoutHtml(id, text) {
    return '<p class="ds-meta sg-readout" id="' + id + '" data-lab-readout aria-live="polite">' + (text || '') + '</p>';
  }

  /* ── A small app in a frame ──────────────────────────────────────── */

  /*
   * Motion that belongs to a whole document (View Transitions, the modal
   * drawer below 900px, the top bar's tint) plays in a frame of its own:
   * an <iframe srcdoc> with dist/ds.css and dist/ds.js. A srcdoc document
   * shares this page's origin and base URL, so it works from disk too, and
   * the lab drives it through the frame's own DS. The frame follows the
   * speed select (--ds-time-scale on its <html>) and the theme.
   */
  var FRAME_HEAD = '<!doctype html><html lang="en" class="ds-theme ds-base"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Demo frame</title>' +
    '<link rel="stylesheet" href="../dist/fonts/fonts.css"><link rel="stylesheet" href="../dist/ds.css"><link rel="stylesheet" href="styleguide.css">' +
    '<link rel="stylesheet" id="sg-theme-link" disabled><style id="sg-theme-style"></style></head>';

  var labFrames = [];
  var frameWatch = null;

  /** Copies the speed and the theme of the lab into a frame. */
  function syncFrame(frame) {
    var doc = frame.contentDocument;
    if (!doc || !doc.documentElement) return;
    var scale = document.documentElement.style.getPropertyValue('--ds-time-scale');
    if (scale) doc.documentElement.style.setProperty('--ds-time-scale', scale);
    else doc.documentElement.style.removeProperty('--ds-time-scale');
    var style = $('#sg-theme-style', doc);
    if (style) style.textContent = $('#sg-theme-style').textContent;
    var link = $('#sg-theme-link');
    var own = $('#sg-theme-link', doc);
    if (!own) return;
    if (!link.disabled && link.getAttribute('href') && link.media !== 'not all') {
      if (own.href !== link.href) own.href = link.href;
      own.disabled = false;
    } else {
      own.disabled = true;
    }
  }

  /**
   * Fills the frame in `stage` with `body` (the frame's markup) and resolves
   * with the frame's window once its DS is there.
   */
  function openFrame(stage, body) {
    var frame = $('iframe', stage);
    var ready = new Promise(function (resolve) {
      frame.addEventListener('load', function () {
        syncFrame(frame);
        resolve(frame.contentWindow);
      }, { once: true });
    });
    frame.srcdoc = FRAME_HEAD + '<body>' + body + '<script src="../dist/ds.js"></script></body></html>';
    labFrames.push(frame);
    if (!frameWatch) {
      frameWatch = new MutationObserver(function () { labFrames.forEach(syncFrame); });
      frameWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-sg-theme'] });
    }
    return ready;
  }

  /* ── Overlays: the Escape stack and the scroll lock, read out ────── */

  var LAYERS = '.ds-dialog, .ds-sheet, .ds-menu, .ds-combo__popup';

  /** What DS.overlay shows of its state: the open layers (data-state) and the lock (body.ds-no-scroll). */
  function layersText(doc) {
    var open = $$(LAYERS, doc).filter(function (el) { return el.getAttribute('data-state') === 'open'; }).length;
    if ($('.ds-app[data-drawer-open]', doc)) open += 1;
    return 'Escape stack: <strong class="ds-num">' + open + '</strong> open ' + (open === 1 ? 'layer' : 'layers') +
      ' · <code>body.ds-no-scroll</code>: <strong>' + (doc.body.classList.contains('ds-no-scroll') ? 'yes' : 'no') + '</strong>';
  }

  /* The read-outs and the document each one reads; one observer per document. */
  var layerOuts = [];
  var layerDocs = [];

  function showLayers(doc) {
    layerOuts.forEach(function (entry) { if (entry.doc === doc) setHtml(entry.out, layersText(doc)); });
  }

  /** Keeps the read-out `out` (in a card) up to date with the layers of `doc`. */
  function watchLayers(out, doc) {
    layerOuts.push({ out: out, doc: doc });
    if (layerDocs.indexOf(doc) === -1) {
      layerDocs.push(doc);
      var frame = 0;
      new MutationObserver(function () {
        if (!frame) frame = requestAnimationFrame(function () { frame = 0; showLayers(doc); });
      }).observe(doc.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-state', 'class', 'data-drawer-open'] });
    }
    showLayers(doc);
  }

  function layersHtml() {
    return '<p class="ds-meta sg-readout" data-lab-layers aria-live="off"></p>';
  }

  /* ── Groups ──────────────────────────────────────────────────────── */

  window.SG_LAB_GROUPS = [
    { id: 'foundations', title: 'Foundations', icon: 'activity', lead: 'The curves and durations every motion is built from, sampled from this browser. Change the speed in the top bar and every figure follows: CSS and JS read the same tokens.' },
    { id: 'utilities', title: 'Utilities', icon: 'sparkles', lead: 'Entrances, exits and stagger as classes (.ds-enter, .ds-leave, .ds-stagger) and through DS.motion. Press again while one runs: it continues from where it is.' },
    { id: 'keyframes', title: 'Keyframes', icon: 'image', lead: 'Keyframes that no utility plays on its own: a component or a page names them, with a duration and a curve from the tokens.' },
    { id: 'data', title: 'Data motion', icon: 'barChart', lead: 'Figures count from what they show, rows glide to their new places, live data waits while you point at it, and a re-render keeps what did not change.' },
    { id: 'controls', title: 'Controls', icon: 'check', lead: 'Press, focus and selection: the ripple from the pointer, the shape morph, the focus snap, busy and success faces, and the small motion of chips, switches, checks and fields.' },
    { id: 'navigation', title: 'Navigation', icon: 'menu', lead: 'The sliding indicator stretches toward its target, lands on the spring and takes longer for a longer jump; the drawer, the segmented switch and the top bar move with it.' },
    { id: 'overlays', title: 'Overlays', icon: 'copy', lead: 'Dialogs, sheets, the modal drawer, menus, tooltips and snackbars through DS.overlay. Rapid toggle opens and closes five times: every layer turns back from where it is, and the read-out shows the Escape stack and the scroll lock.' },
    { id: 'feedback', title: 'Feedback', icon: 'sync', lead: 'Loaders that wait before they show and stay long enough not to flicker, the skeleton wave, progress that glides, and the motion of status, tables, alerts and tiles.' },
    { id: 'views', title: 'Views and scroll', icon: 'monitor', lead: 'The motion between views (View Transitions, and the fade-through without them) and the motion that follows scrolling.' },
  ];

  /* ── Foundations: curves ─────────────────────────────────────────── */

  /* Each easing token with the duration its plot's ball takes and the use
     of the curve (the token table of docs/motion.md). */
  var CURVES = [
    ['--ds-ease-spatial', '--ds-dur-slow', 'The spring: every spatial movement that floats (indicator, switch handle, sheets, dialogs, menus, FLIP). It passes the target by a hair and settles.'],
    ['--ds-ease-in-out', '--ds-dur-base', 'M3 standard: effects (opacity, colour) and changes that stay on screen.'],
    ['--ds-ease-out', '--ds-dur-medium', 'Emphasized decelerate: entering movement without the spring, and sizes that push layout.'],
    ['--ds-ease-in', '--ds-dur-fast', 'Standard accelerate: small exits.'],
    ['--ds-ease-exit', '--ds-dur-base', 'Emphasized accelerate: large surfaces leaving (movement only).'],
    ['--ds-ease-emphasized', '--ds-dur-slow', 'Movement that starts and ends on screen.'],
    ['--ds-ease-value', '--ds-dur-glide', 'Values that travel: progress bars and countUp, so a figure and its bar land together.'],
  ];

  /* The plot's value range: room for the spring's overshoot above 1 and a
     margin below 0, so the [0, 1] band sits inside. */
  var TOP = 1.15;
  var BOTTOM = -0.15;
  var y = function (value) { return Math.round((TOP - value) / (TOP - BOTTOM) * 10000) / 100; };

  /**
   * Samples the curve the browser uses for `token`: a hidden probe animates
   * translate from 0px to 1000px with the computed easing, paused, and is
   * sought across 101 points. This sees linear() overshoot, and in an
   * engine without linear() the cubic fallback.
   * @returns {{ easing: string, values: number[] }}
   */
  function sampleCurve(stage, token) {
    var probe = document.createElement('span');
    probe.className = 'sg-probe';
    probe.setAttribute('aria-hidden', 'true');
    stage.appendChild(probe);
    var animation = animateToken(probe, [{ translate: '0px' }, { translate: '1000px' }], 1000, token, { fill: 'both' });
    animation.pause();
    var values = [];
    for (var step = 0; step <= 100; step += 1) {
      animation.currentTime = step * 10;
      values.push((parseFloat(getComputedStyle(probe).translate) || 0) / 1000);
    }
    var easing = animation.effect.getTiming().easing;
    animation.cancel();
    probe.remove();
    return { easing: easing, values: values };
  }

  /** The easing as a short caption: a cubic in full, linear() by its stops. */
  function easingName(easing) {
    if (/^linear\(/.test(easing)) return 'linear(), ' + (easing.split(',').length) + ' stops';
    return easing;
  }

  function plotHtml(token) {
    return '<div class="sg-plot" data-lab-curve="' + token + '">' +
      '<svg class="sg-plot__svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Curve of ' + token + '">' +
      '<rect class="sg-plot__band" x="0" y="' + y(1) + '" width="100" height="' + (y(0) - y(1)) + '"/>' +
      '<line class="sg-plot__line" x1="0" x2="100" y1="' + y(1) + '" y2="' + y(1) + '"/>' +
      '<line class="sg-plot__line" x1="0" x2="100" y1="' + y(0) + '" y2="' + y(0) + '"/>' +
      '<path class="sg-plot__path" d=""/></svg>' +
      '<span class="sg-plot__mark sg-plot__mark--one" style="top:' + y(1) + '%">1</span><span class="sg-plot__mark" style="top:' + y(0) + '%">0</span>' +
      '<span class="sg-plot__area" style="top:' + y(1) + '%;height:' + (y(0) - y(1)) + '%"><span class="sg-plot__x"><span class="sg-plot__y"><span class="sg-plot__ball"></span></span></span></span>' +
      '</div>';
  }

  /** Draws the sampled path and writes the peak (caption and data-lab-peak). */
  function drawPlot(stage, token) {
    var sample = sampleCurve(stage, token);
    var values = sample.values;
    var peak = Math.max.apply(null, values);
    var low = Math.min.apply(null, values);
    var monotonic = values.every(function (value, index) { return !index || value >= values[index - 1] - 1e-6; });
    var path = values.map(function (value, index) { return (index ? 'L' : 'M') + index + ' ' + y(value); }).join(' ');
    var svg = $('.sg-plot__svg', stage);
    $('.sg-plot__path', svg).setAttribute('d', path);
    svg.setAttribute('data-lab-peak', peak.toFixed(3));
    svg.setAttribute('data-lab-values', values.map(function (value) { return value.toFixed(4); }).join(' '));
    svg.setAttribute('aria-label', 'Curve of ' + token + ', peak ' + peak.toFixed(3));
    var verdict = peak > 1.0005
      ? 'overshoots ' + ((peak - 1) * 100).toFixed(1) + ' %, then settles'
      : low < -0.0005 ? 'dips below 0' : monotonic ? 'within [0, 1], monotonic' : 'within [0, 1]';
    var caption = stage.parentNode.querySelector('.sg-plot__caption');
    setHtml(caption, 'Peak <strong class="ds-num">' + peak.toFixed(3) + '</strong> · ' + verdict + ' · <code>' + esc(easingName(sample.easing)) + '</code>');
    return peak;
  }

  /** The ball runs along the curve: x linear in time, y on the token's curve. */
  function playBall(stage, token, durationToken) {
    var duration = M.motionDuration(stage, durationToken);
    var x = $('.sg-plot__x', stage);
    var yBox = $('.sg-plot__y', stage);
    [x, yBox].forEach(function (el) { el.getAnimations().forEach(function (animation) { if (animation.id === LAB) animation.cancel(); }); });
    x.style.translate = '100% 0%';
    yBox.style.translate = '0% -100%';
    x.animate([{ translate: '0% 0%' }, { translate: '100% 0%' }], { duration: duration, easing: 'linear' }).id = LAB;
    animateToken(yBox, [{ translate: '0% 0%' }, { translate: '0% -100%' }], duration, token);
    return settledLab(stage);
  }

  var LAB_DEMOS = CURVES.map(function (curve) {
    var token = curve[0];
    return {
      id: 'curve-' + token.replace('--ds-ease-', ''),
      group: 'foundations',
      title: '<code>' + token + '</code>',
      note: curve[2],
      shows: [token, curve[1], 'DS.motion.motionEasing'],
      html: plotHtml(token),
      after: '<p class="ds-meta sg-plot__caption" aria-live="polite"></p>',
      height: 200,
      playLabel: 'Play',
      setup: function (stage) { drawPlot(stage, token); },
      play: function (stage) { return playBall(stage, token, curve[1]); },
    };
  });

  /* ── Foundations: the spring explainer ───────────────────────────── */

  var SPRING_LANES = [
    ['--ds-dur-medium', 'small control: switch handle, chip, check'],
    ['--ds-dur-slow', 'dialog, FLIP, the indicator at its cap'],
    ['--ds-dur-long', 'side sheet, modal drawer, container transform'],
  ];

  function laneHtml(token, use, extra) {
    return '<div class="sg-lane"><p class="sg-lane__label"><code>' + token + '</code> <span class="ds-num" data-lab-ms="' + token + '"></span> · ' + use + '</p>' +
      '<div class="sg-lane__track"><span class="sg-lane__box"' + (extra || '') + ' data-lab-dur="' + token + '"></span></div></div>';
  }

  /* The boxes towards `on` (the end of their lanes) or back, each over its
     own duration on the one spring. */
  function springTo(stage, on) {
    var boxes = $$('.sg-lane__box', stage);
    var distance = travel(boxes[0]);
    boxes.forEach(function (box) {
      moveTo(box, on ? distance : 0, M.motionDuration(stage, box.getAttribute('data-lab-dur')), '--ds-ease-spatial');
    });
    return settledLab(stage);
  }

  LAB_DEMOS.splice(1, 0, {
    id: 'spring',
    group: 'foundations',
    title: 'One spring for every size',
    note: '<code>--ds-ease-spatial</code> drives all three boxes over the same distance. The curve is normalised to its settle time, so one spring serves a 250ms handle and a 450ms sheet; <code>scripts/motion-curves.mjs</code> samples it into <code>linear()</code>. Only movement that floats (translate, scale, clip-path) overshoots; sizes that push layout (chip width, the room of a message, an expandable row, <code>.ds-collapsible</code>) land on <code>--ds-ease-out</code>.',
    shows: ['--ds-ease-spatial', '--ds-ease-out', '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-long'],
    html: '<div class="sg-lanes">' + SPRING_LANES.map(function (lane) { return laneHtml(lane[0], lane[1]); }).join('') + '</div>',
    height: 200,
    reset: function (stage) { $$('.sg-lane__box', stage).forEach(function (box) { moveTo(box, 0, 0, '--ds-ease-spatial'); }); },
    play: function (stage) { return springTo(stage, true); },
    toggle: springTo,
  });

  /* ── Foundations: the duration ladder ────────────────────────────── */

  var LADDER = [
    ['--ds-dur-micro', 'press-in of layers and radius, tiny ticks'],
    ['--ds-dur-instant', 'pressed state, popup exits'],
    ['--ds-dur-fast', 'colour, small exits, focus snap'],
    ['--ds-dur-base', 'toggles, exits of panels and dialogs'],
    ['--ds-dur-medium', 'small spatial movement, menu entrances'],
    ['--ds-dur-slow', 'dialogs, FLIP, indicator cap'],
    ['--ds-dur-long', 'sheets, modal drawer, container transform'],
    ['--ds-dur-glide', 'values that travel: progress, countUp'],
  ];

  /** The distances of the travel row (px), as an indicator and FLIP would move. */
  var TRAVELS = [40, 160, 480];

  /** The same 240px for every chip of the ladder. */
  var LADDER_PX = 240;

  function ladderRow(label, use, attributes) {
    return '<div class="sg-ladder__row"><p class="sg-ladder__label"><span>' + label + '</span><span class="sg-ladder__use">' + use + '</span></p>' +
      '<div class="sg-ladder__lane"><span class="sg-ladder__chip"' + attributes + '></span></div></div>';
  }

  function ladderHtml() {
    return '<div class="sg-ladder">' +
      '<p class="sg-ladder__head">Durations: 240px on <code>--ds-ease-in-out</code></p>' +
      LADDER.map(function (step) {
        return ladderRow('<code>' + step[0] + '</code> <span class="ds-num" data-lab-ms="' + step[0] + '"></span>', step[1], ' data-lab-dur="' + step[0] + '"');
      }).join('') +
      '<p class="sg-ladder__head">Travel: <code>DS.motion.travelDuration(el, px)</code> on <code>--ds-ease-spatial</code></p>' +
      TRAVELS.map(function (px) {
        return ladderRow('<code>' + px + 'px</code> <span class="ds-num" data-lab-travel="' + px + '"></span>', px === 40 ? 'a neighbour: --ds-dur-medium' : px === 480 ? '480px and beyond: --ds-dur-slow' : 'in between, by distance', ' data-lab-px="' + px + '"');
      }).join('') + '</div>';
  }

  /* Every chip at once, towards `on` or back: the ladder on the standard
     curve over its 240px, the travel row on the spring over its distance
     (clamped to the lane on a narrow screen, still timed for the full
     distance). */
  function ladderTo(stage, on) {
    $$('.sg-ladder__chip', stage).forEach(function (chip) {
      var px = Number(chip.getAttribute('data-lab-px'));
      if (px) moveTo(chip, on ? travel(chip, px) : 0, M.travelDuration(stage, px), '--ds-ease-spatial');
      else moveTo(chip, on ? travel(chip, LADDER_PX) : 0, M.motionDuration(stage, chip.getAttribute('data-lab-dur')), '--ds-ease-in-out');
    });
    return settledLab(stage);
  }

  LAB_DEMOS.push({
    id: 'durations',
    group: 'foundations',
    title: 'Duration ladder',
    note: 'Short steps for small feedback, long ones only for large surfaces. "Play all" starts every chip at once, so the rhythm reads as one picture; the second part is the distance rule of the indicator and FLIP.',
    shows: LADDER.map(function (step) { return step[0]; }).concat(['--ds-ease-in-out', '--ds-ease-spatial', 'DS.motion.travelDuration', 'DS.motion.motionDuration']),
    html: ladderHtml(),
    wide: true,
    playLabel: 'Play all',
    reset: function (stage) { $$('.sg-ladder__chip', stage).forEach(function (chip) { moveTo(chip, 0, 0, '--ds-ease-in-out'); }); },
    play: function (stage) { return ladderTo(stage, true); },
    toggle: ladderTo,
  });

  /* ── Utilities: enter and leave ──────────────────────────────────── */

  /* The leave buttons bring the card back 400ms after its exit, unless
     another press came first. Every press is a new run: a superseded
     leave() still resolves (without acting), so only the latest press may
     bring the card back. */
  var leaveRun = 0;
  var backTimer = 0;

  function motionCard(stage) { return $('#sg-motion-card', stage); }

  LAB_DEMOS.push({
    id: 'enter-leave',
    group: 'utilities',
    title: 'Enter and leave',
    note: 'Every <code>.ds-enter</code> and <code>.ds-leave</code> variant through <code>DS.motion.enter()</code> and leave(). enter() and leave() continue from where the card is, whenever they are pressed; enter() also cleans up whatever variant played before. "delayed" waits for the loader delay first; "fill-x" and "fill-y" grow a bar or a column to its share. Cancel stops at the rest state at once.',
    shows: ['.ds-enter', '.ds-enter--fade', '.ds-enter--scale', '.ds-enter--slide', '.ds-enter--swap', '.ds-enter--delayed', '.ds-enter--pop', '.ds-enter--fill-x', '.ds-enter--fill-y',
      '.ds-leave', '.ds-leave--sink', '.ds-leave--scale', '.ds-leave--slide', '.ds-leave--pop',
      'ds-fade-in', 'ds-lift-in', 'ds-grow-in', 'ds-shift-in', 'ds-pop-in', 'ds-fill-x', 'ds-fill-y', 'ds-fade-out', 'ds-drop-out', 'ds-shrink-out', 'ds-shift-out', 'ds-pop-out',
      'DS.motion.enter', 'DS.motion.leave', 'DS.motion.cancel',
      '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-fast', '--ds-dur-base', '--ds-dur-glide', '--ds-delay-loader', '--ds-ease-in-out', '--ds-ease-spatial', '--ds-ease-in', '--ds-ease-value',
      '--ds-distance-md', '--ds-distance-xl', '--ds-scale-enter', '--ds-scale-small'],
    html: '<div class="ds-card sg-lab-card" id="sg-motion-card" data-lab-keep><h4 class="ds-card__title">A card</h4><p class="ds-muted">Plays the chosen entrance or exit.</p></div>',
    controls: '<div class="sg-row">' + ['', 'fade', 'scale', 'slide', 'swap', 'delayed', 'pop', 'fill-x', 'fill-y'].map(function (v) { return '<button class="ds-btn ds-btn--sm" type="button" data-enter="' + v + '">enter' + (v ? ' ' + v : '') + '</button>'; }).join('') + '</div>' +
      '<div class="sg-row">' + ['', 'sink', 'scale', 'slide', 'pop'].map(function (v) { return '<button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-leave="' + v + '">leave' + (v ? ' ' + v : '') + '</button>'; }).join('') +
      '<button class="ds-btn ds-btn--sm ds-btn--quiet" type="button" data-motion-cancel>Cancel</button></div>',
    setup: function (stage, sg) {
      stage.parentNode.addEventListener('click', function (event) {
        var el = event.target.closest('[data-enter], [data-leave], [data-motion-cancel]');
        if (!el) return;
        clearTimeout(backTimer);
        leaveRun += 1;
        var card = motionCard(stage);
        if (el.hasAttribute('data-motion-cancel')) { M.cancel(card); return; }
        if (el.hasAttribute('data-enter')) { M.enter(card, el.getAttribute('data-enter')); return; }
        var run = leaveRun;
        M.leave(card, el.getAttribute('data-leave'), { then: 'keep' }).then(function () {
          if (run !== leaveRun || !card.classList.contains('ds-leave')) return;
          backTimer = setTimeout(function () {
            if (run === leaveRun) M.enter(card, 'fade');
          }, sg.slow(400));
        });
      });
    },
    play: function (stage) {
      clearTimeout(backTimer);
      leaveRun += 1;
      return M.enter(motionCard(stage));
    },
    state: function (stage) { return !motionCard(stage).classList.contains('ds-leave'); },
    toggle: function (stage, on) {
      clearTimeout(backTimer);
      leaveRun += 1;
      return on ? M.enter(motionCard(stage)) : M.leave(motionCard(stage), '', { then: 'keep' });
    },
  });

  /* ── Utilities: stagger ──────────────────────────────────────────── */

  LAB_DEMOS.push({
    id: 'stagger',
    group: 'utilities',
    title: 'Stagger',
    note: '<code>DS.motion.enterAll()</code>: one batch, each square enters one step after the other (30ms, at most six steps); the classes and <code>--ds-i</code> go once each one landed. "Fill as bars" grows them from their left edge.',
    shows: ['DS.motion.enterAll', '.ds-enter--scale', '.ds-enter--fill-x', '--ds-stagger', '--ds-dur-medium', '--ds-dur-glide', '--ds-ease-value'],
    html: '<div class="sg-stagger-list" id="sg-stagger">' + new Array(9).join('<span></span>') + '</div>',
    after: readoutHtml('sg-stagger-left'),
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="stagger">Stagger</button><button class="ds-btn ds-btn--sm" type="button" data-sg="fill">Fill as bars</button></div>',
    setup: function (stage) {
      var list = $('#sg-stagger', stage);
      stage.parentNode.addEventListener('click', function (event) {
        var action = event.target.closest('[data-sg]');
        if (!action) return;
        list.classList.toggle('sg-fill', action.getAttribute('data-sg') === 'fill');
        staggerSquares(stage, action.getAttribute('data-sg') === 'fill' ? 'fill-x' : 'scale');
      });
    },
    play: function (stage) {
      $('#sg-stagger', stage).classList.remove('sg-fill');
      return staggerSquares(stage, 'scale');
    },
  });

  /** What a stagger left on its items: motion classes and inline --ds-i (none, once it settled). */
  function leftBehind(items) {
    var classes = items.filter(function (item) { return /\bds-(enter|leave)\b/.test(item.className); }).length;
    var steps = items.filter(function (item) { return item.style.getPropertyValue('--ds-i') !== ''; }).length;
    return 'Left behind: <strong class="ds-num">' + classes + '</strong> motion classes, <strong class="ds-num">' + steps + '</strong> <code>--ds-i</code>';
  }

  function staggerSquares(stage, variant) {
    var items = $$('#sg-stagger > span', stage);
    var out = $('#sg-stagger-left', stage.parentNode);
    setHtml(out, 'Staggering ...');
    return M.enterAll(items, variant).then(function () { setHtml(out, leftBehind(items)); });
  }

  /* ── Utilities: staggerOnce and .ds-stagger ──────────────────────── */

  /** A fresh list in place of the old one: a first render. */
  function freshList(stage, css) {
    var list = document.createElement('div');
    list.className = 'sg-stagger-list sg-once' + (css ? ' ds-stagger' : '');
    for (var i = 0; i < 8; i += 1) list.appendChild(document.createElement('span'));
    $('.sg-once', stage).replaceWith(list);
    return list;
  }

  LAB_DEMOS.push({
    id: 'stagger-once',
    group: 'utilities',
    title: 'First render',
    note: 'A view\'s first render staggers once. <code>DS.motion.staggerOnce()</code> plays the fade and 4px rise of <code>.ds-stagger</code> through enterAll(), marks the container and leaves nothing behind; a second call (a refresh) resolves at once, without motion. "CSS only" is the class itself: <code>.ds-stagger</code> numbers its children with sibling-index() where it exists, else <code>DS.motion.stagger()</code> writes <code>--ds-i</code>; the page drops the class once it played.',
    shows: ['DS.motion.staggerOnce', 'DS.motion.stagger', '.ds-stagger', '.ds-enter--swap', '--ds-stagger', '--ds-dur-medium', '--ds-distance-sm'],
    html: '<div class="sg-stagger-list sg-once"></div>',
    after: readoutHtml('sg-once-left'),
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-once="css">CSS only (.ds-stagger)</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-once="again">Call staggerOnce() again</button></div>',
    setup: function (stage, sg) {
      var list = freshList(stage, false);
      list.setAttribute('data-ds-staggered', '');
      stage.parentNode.addEventListener('click', function (event) {
        var button = event.target.closest('[data-once]');
        if (!button) return;
        var out = $('#sg-once-left', stage.parentNode);
        if (button.getAttribute('data-once') === 'again') {
          var start = performance.now();
          M.staggerOnce($('.sg-once', stage)).then(function () {
            setHtml(out, 'A second <code>staggerOnce()</code> resolved after <strong class="ds-num">' + Math.round(performance.now() - start) + 'ms</strong>, without motion.');
          });
          return;
        }
        var css = freshList(stage, true);
        var items = $$('span', css);
        M.stagger(items);
        quiet(css, sg).then(function () {
          css.classList.remove('ds-stagger');
          items.forEach(function (item) { item.style.removeProperty('--ds-i'); });
          setHtml(out, '.ds-stagger played; the page dropped the class and the steps. ' + leftBehind(items));
        });
      });
    },
    play: function (stage) {
      var list = freshList(stage, false);
      var items = $$('span', list);
      var out = $('#sg-once-left', stage.parentNode);
      setHtml(out, 'Staggering ...');
      return M.staggerOnce(list).then(function () { setHtml(out, leftBehind(items) + ' · <code>data-ds-staggered</code> set'); });
    },
  });

  /* ── Utilities: interruption benches ─────────────────────────────── */

  /*
   * A trace of the card's opacity over the run (rAF samples), with a mark
   * at each interruption: a continuous line is the proof that a motion
   * turned back from where it was (D21), never restarted from zero.
   */
  function traceHtml() {
    return '<svg class="sg-trace" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Opacity of the card over time">' +
      '<rect class="sg-trace__band" x="0" y="0" width="100" height="40"/><g class="sg-trace__marks"></g><path class="sg-trace__path" d="M0 0 L100 0"/></svg>' +
      '<p class="ds-meta sg-trace__caption">Opacity over time: the top edge is 1, the bottom 0.</p>';
  }

  function drawTrace(svg, samples, marks) {
    var total = samples.length ? Math.max(1, samples[samples.length - 1][0]) : 1;
    var x = function (t) { return Math.round(t / total * 10000) / 100; };
    $('.sg-trace__path', svg).setAttribute('d', samples.map(function (sample, index) {
      return (index ? 'L' : 'M') + x(sample[0]) + ' ' + Math.round((1 - sample[1]) * 4000) / 100;
    }).join(' '));
    setHtml($('.sg-trace__marks', svg), marks.map(function (t) {
      return '<line class="sg-trace__mark" x1="' + x(t) + '" x2="' + x(t) + '" y1="0" y2="40"/>';
    }).join(''));
    svg.setAttribute('data-lab-trace', samples.map(function (sample) { return sample[1].toFixed(3); }).join(' '));
  }

  var bench = { recording: null, run: 0 };

  /** Starts (or continues) a trace of the bench card; mark() notes an interruption. */
  function benchTrace(stage, interrupts) {
    if (bench.recording) {
      if (interrupts) bench.recording.marks.push(performance.now() - bench.recording.start);
      return bench.recording;
    }
    var card = $('#sg-bench-card', stage);
    var recording = { start: performance.now(), samples: [], marks: [], on: true };
    (function sample() {
      if (!recording.on) return;
      recording.samples.push([performance.now() - recording.start, Number(getComputedStyle(card).opacity)]);
      requestAnimationFrame(sample);
    }());
    bench.recording = recording;
    return recording;
  }

  /** Ends the trace once the latest motion of the bench settled. */
  function benchDone(stage, done) {
    var run = bench.run += 1;
    return done.then(function () {
      if (run !== bench.run || !bench.recording) return;
      bench.recording.on = false;
      drawTrace($('.sg-trace', stage), bench.recording.samples, bench.recording.marks);
      bench.recording = null;
    });
  }

  function benchShown(stage) { return !$('#sg-bench-card', stage).classList.contains('ds-leave'); }

  /* Resolves once the element's own motion is half done, by its own clock
     (a busy page may start an animation a few frames late). */
  function atHalf(el, sg) {
    return until(sg, function () {
      return el.getAnimations().every(function (animation) {
        var end = animation.effect && animation.effect.getComputedTiming().endTime;
        return !isFinite(end) || animation.playState !== 'running' || (Number(animation.currentTime) || 0) >= end / 2;
      });
    }, 3000);
  }

  /* Enter, and leave once the entrance is half done; or the other way round. */
  function benchTurn(stage, first, sg) {
    var card = $('#sg-bench-card', stage);
    benchTrace(stage, false);
    if (first === 'enter') M.enter(card, 'scale');
    else M.leave(card, '', { then: 'keep' });
    return sg.frames(1).then(function () { return atHalf(card, sg); }).then(function () {
      benchTrace(stage, true);
      return first === 'enter' ? M.leave(card, '', { then: 'keep' }) : M.enter(card, 'scale');
    });
  }

  LAB_DEMOS.push({
    id: 'interrupt',
    group: 'utilities',
    title: 'Interruption benches',
    note: 'enter() and leave() never restart: a later call reads where the card is and continues from there on its own curve. The line is the card\'s opacity as it was painted, frame by frame; each dashed mark is an interruption. Replay runs both benches: a leave at 50% of an enter, then an enter during that leave.',
    shows: ['DS.motion.enter', 'DS.motion.leave', 'DS.motion.settled', '.ds-enter--scale', '.ds-leave', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-in-out', '--ds-ease-in'],
    html: '<div class="sg-bench"><div class="ds-card sg-lab-card" id="sg-bench-card" data-lab-keep><h4 class="ds-card__title">A card</h4><p class="ds-muted">Interrupted on purpose.</p></div><div>' + traceHtml() + '</div></div>',
    height: 220,
    wide: true,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-bench="enter">Leave at 50% of an enter</button><button class="ds-btn ds-btn--sm" type="button" data-bench="leave">Enter during a leave</button></div>',
    setup: function (stage, sg) {
      stage.parentNode.addEventListener('click', function (event) {
        var button = event.target.closest('[data-bench]');
        if (button) benchDone(stage, benchTurn(stage, button.getAttribute('data-bench'), sg));
      });
    },
    play: function (stage, sg) {
      var card = $('#sg-bench-card', stage);
      M.cancel(card);
      bench.recording = null;
      // From the hidden card, so the trace starts at 0 rather than with a cut.
      return M.leave(card, '', { then: 'keep' }).then(function () {
        bench.recording = null;
        return benchDone(stage, benchTurn(stage, 'enter', sg)
          .then(function () { return M.enter(card, 'scale'); })
          .then(function () { return benchTurn(stage, 'leave', sg); }));
      });
    },
    state: benchShown,
    toggle: function (stage, on) {
      var card = $('#sg-bench-card', stage);
      benchTrace(stage, true);
      return benchDone(stage, on ? M.enter(card, 'scale') : M.leave(card, '', { then: 'keep' }));
    },
  });

  /* ── Utilities: .ds-reveal ───────────────────────────────────────── */

  LAB_DEMOS.push({
    id: 'reveal',
    group: 'utilities',
    title: 'Reveal',
    note: 'Content that replaces its placeholder fades in with the smallest rise (<code>.ds-reveal</code>), once. <code>DS.motion.replay()</code> restarts the class on an element that may still carry it, with a style flush and no layout.',
    shows: ['.ds-reveal', 'DS.motion.replay', 'ds-fade-in', 'ds-lift-in', '--ds-dur-medium', '--ds-distance-sm'],
    html: '<section class="ds-card sg-lab-card sg-reveal"><h4 class="ds-card__title">LAPTOP-0042</h4><p class="ds-muted">Latitude 7440, issued to Ada Lovelace. Loaded just now.</p></section>',
    play: function (stage) {
      var block = $('.sg-reveal', stage);
      M.replay(block, 'ds-reveal');
      return M.settled(block).then(function () { block.classList.remove('ds-reveal'); });
    },
  });

  /* ── Utilities: .ds-swap and .ds-icon-swap ───────────────────────── */

  var SYNC_TEXT = ['Synced 2 minutes ago', 'Working offline'];

  LAB_DEMOS.push({
    id: 'swap',
    group: 'utilities',
    title: 'Swaps',
    note: '<code>DS.motion.crossfade()</code> swaps a text in a <code>.ds-swap</code> slot: the old line fades out fast while the new one fades in, in one grid cell, so nothing jumps in width. The button\'s icons are a <code>.ds-icon-swap</code> that follows aria-pressed by CSS alone: the incoming icon fades in and springs up from <code>--ds-scale-small</code>.',
    shows: ['.ds-swap', '.ds-icon-swap', 'DS.motion.crossfade', '--ds-dur-fast', '--ds-dur-instant', '--ds-dur-medium', '--ds-ease-in-out', '--ds-ease-in', '--ds-ease-spatial', '--ds-scale-small'],
    html: '<div class="sg-swap-row"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Work offline" aria-pressed="false" data-swap-toggle><span class="ds-icon-swap"><span class="ds-icon-swap__a">' + icon('wifi', 20) + '</span><span class="ds-icon-swap__b">' + icon('wifiOff', 20) + '</span></span></button>' +
      '<p class="sg-swap-text" id="sg-swap-text">' + SYNC_TEXT[0] + '</p></div>',
    setup: function (stage) {
      $('[data-swap-toggle]', stage).addEventListener('click', function () { swapTo(stage, !swapOn(stage)); });
    },
    play: function (stage) { return swapTo(stage, !swapOn(stage)); },
    state: swapOn,
    toggle: function (stage, on) { return swapTo(stage, on); },
  });

  function swapOn(stage) { return $('[data-swap-toggle]', stage).getAttribute('aria-pressed') === 'true'; }

  function swapTo(stage, on) {
    var button = $('[data-swap-toggle]', stage);
    button.setAttribute('aria-pressed', String(on));
    return Promise.all([
      M.crossfade($('#sg-swap-text', stage), SYNC_TEXT[on ? 1 : 0]),
      M.settled($('.ds-icon-swap', button), { transitions: true, subtree: true }),
    ]);
  }

  /* ── Utilities: .ds-presence and .ds-presence--keep ──────────────── */

  function presenceOn(stage) { return $('.ds-presence--keep', stage).hasAttribute('data-ds-shown'); }

  function presenceTo(stage, on, sg) {
    // A wrapper carries .ds-presence, never the pill itself: the pill keeps
    // its own hover, press and focus transitions inside it.
    $('#sg-presence-pill', stage).hidden = !on;
    $('.ds-presence--keep', stage).toggleAttribute('data-ds-shown', on);
    return sg.frames(2).then(function () { return quiet(stage, sg); });
  }

  LAB_DEMOS.push({
    id: 'presence',
    group: 'utilities',
    title: 'Presence',
    note: '<code>.ds-presence</code> on a wrapper toggled with <code>hidden</code>: it fades in and grows on the spring, and leaves faster; the pill inside keeps its own hover and focus motion. <code>.ds-presence--keep</code> keeps its box, so nothing around it moves: the page sets <code>data-ds-shown</code>, it fades in over <code>--ds-dur-fast</code> and out in <code>--ds-dur-instant</code> (exit 0.67), and while hidden it is out of the tab order.',
    shows: ['.ds-presence', '.ds-presence--keep', '--ds-dur-fast', '--ds-dur-instant', '--ds-dur-medium', '--ds-ease-in-out', '--ds-ease-spatial', '--ds-scale-popup'],
    html: '<div class="sg-presence-demo"><div class="sg-row"><span class="ds-presence" id="sg-presence-pill" hidden><button class="ds-btn ds-btn--tonal ds-btn--sm" type="button">' + icon('arrowDown', 16) + 'Latest</button></span></div>' +
      '<p class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-presence-save>Save</button><span class="ds-presence ds-presence--keep ds-muted">' + icon('check', 16) + 'Saved</span><span class="ds-muted">Nothing moves.</span></p></div>',
    height: 140,
    setup: function (stage, sg) {
      $('[data-presence-save]', stage).addEventListener('click', function () { presenceTo(stage, !presenceOn(stage), sg); });
    },
    play: function (stage, sg) { return presenceTo(stage, !presenceOn(stage), sg); },
    state: presenceOn,
    toggle: function (stage, on, sg) { return presenceTo(stage, on, sg); },
  });

  /* ── Utilities: the rules disclosure ─────────────────────────────── */

  /* The motion rules in short, from the rules of docs/motion.md. */
  var RULES = [
    'Animate only transform, translate, scale, opacity, colours, shadows, clip-path and registered properties, plus a named list of exceptions: rotation for spinners, loaders, chevrons and icon swaps, the press radius, the focus offset, drawn strokes, the progress wave and a few layout heights.',
    'Effects stay within their range: fades run on the standard curve, values on the value curve. Movement that floats (translate, scale, clip-path) runs on the spring; sizes that push layout land on <code>--ds-ease-out</code>.',
    'Exits take 0.3 to 0.8 of their entrance and accelerate; popups may leave in <code>--ds-dur-instant</code>.',
    'Distances stay short (4 to 24px; sheets slide their full width); scales are .98, .95, .9 and .6, from an origin at the trigger.',
    'Hover never moves anything. A press ripples from the pointer and turns the shape squarer, then springs back; only the switch handle grows.',
    'Durations come from the ladder, 50 to 600ms; the spring\'s duration picks the size of what moves.',
    'Stagger 30ms, at most six steps, on the first render of a view only.',
    'Data glides: figures count from the shown value, reordered rows move to their new places, live data waits while you point at it, and a refresh never replays an entrance.',
    'Loaders wait 200ms before they show and then stay at least 450ms, so nothing flickers.',
    'Re-render with <code>DS.dom.morphHtml</code>, never <code>innerHTML</code>: a spinner keeps turning, a field keeps its focus.',
    'Focus rings are solid from the first frame; only their offset snaps in.',
    'Interrupted, every motion continues from where it is, on the curve of its new direction.',
  ];

  LAB_DEMOS.push({
    id: 'disclosure',
    group: 'utilities',
    title: 'Disclosure',
    note: 'A <code>.ds-collapsible</code>: it opens over 250ms, decelerating, while the content fades in, and closes faster, accelerating; the <code>.ds-chevron</code> turns with it. The button sits flush with the content edge, and its focus ring still shows in full.',
    shows: ['.ds-collapsible', '.ds-chevron', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-out', '--ds-ease-in'],
    html: '<details class="ds-collapsible sg-disclosure"><summary>Show the motion rules' + icon('chevronDown', 20, 'ds-chevron') + '</summary><ol class="ds-muted">' +
      RULES.map(function (rule) { return '<li>' + rule + '</li>'; }).join('') + '</ol>' +
      '<button class="ds-btn ds-btn--sm" type="button" data-sg="copy-rules">' + icon('copy', 16) + 'Copy the rules</button></details>',
    wide: true,
    setup: function (stage, sg) {
      $('[data-sg="copy-rules"]', stage).addEventListener('click', function () { sg.toast('Copied the motion rules.', 'info'); });
    },
    play: function (stage, sg) {
      var details = $('details', stage);
      details.open = !details.open;
      return sg.frames(1).then(function () { return M.settled(details, { transitions: true, subtree: true }); });
    },
    state: function (stage) { return $('details', stage).open; },
    toggle: function (stage, on, sg) {
      var details = $('details', stage);
      details.open = on;
      return sg.frames(1).then(function () { return M.settled(details, { transitions: true, subtree: true }); });
    },
  });

  /* ── Keyframes: ds-draw ──────────────────────────────────────────── */

  LAB_DEMOS.push({
    id: 'draw',
    group: 'keyframes',
    title: 'A check that draws itself',
    note: '<code>ds-draw</code> on the check glyph: its path carries pathLength="1", the page sets stroke-dasharray: 1, and the stroke draws in from <code>--ds-draw-length</code>. <code>DS.motion.replay()</code> restarts the class on the <code>&lt;svg&gt;</code> itself (a style flush works on SVG, a layout read would not).',
    shows: ['ds-draw', 'DS.motion.replay', '--ds-draw-length', '--ds-dur-slow', '--ds-ease-out'],
    html: '<div class="sg-row sg-draw-row"><span class="sg-draw-disc">' + icon('check', 40, 'sg-draw') + '</span><span class="sg-draw-disc sg-draw-disc--quiet">' + icon('checkCircle', 40, 'sg-draw') + '</span></div>',
    play: function (stage) {
      var glyphs = $$('svg.sg-draw', stage);
      glyphs.forEach(function (svg) { M.replay(svg, 'sg-draw--play'); });
      return Promise.all(glyphs.map(function (svg) { return M.settled(svg, { names: ['ds-draw'] }); }));
    },
  });

  /* ── Keyframes: ds-roll-in / ds-roll-out ─────────────────────────── */

  var ROLL = ['Checking 4 devices ...', '3 of 4 devices up to date', 'All 4 devices up to date', 'Synced 2 minutes ago'];
  var rollAt = 0;

  function rollNext(stage) {
    rollAt = (rollAt + 1) % ROLL.length;
    return M.roll($('#sg-roll', stage), ROLL[rollAt]);
  }

  LAB_DEMOS.push({
    id: 'roll',
    group: 'keyframes',
    title: 'Rolling status line',
    note: '<code>DS.motion.roll()</code> on a status line (a <code>.ds-swap</code> slot): the old line leaves upwards (<code>ds-roll-out</code>, fast, accelerating), and once it is half out the new one comes up from below on the spring (<code>ds-roll-in</code> after <code>--ds-enter-delay</code>, half of <code>--ds-dur-fast</code>), so the two lines never cover each other. A roll during a roll continues from where each line is. <code>.ds-swap--fade</code> gives the slot soft edges (<code>--ds-swap-fade</code>, a static mask), and <code>{ hold: true }</code> keeps each line up for <code>--ds-hold-status</code>: of five quick changes only the latest rolls in after the wait.',
    shows: ['ds-roll-in', 'ds-roll-out', 'DS.motion.roll', '.ds-swap', '.ds-swap--fade', '--ds-swap-fade', '--ds-hold-status', '--ds-dur-fast', '--ds-dur-medium', '--ds-ease-spatial', '--ds-ease-in', '--ds-enter-delay'],
    html: '<p class="sg-roll ds-swap--fade" id="sg-roll" aria-live="polite">' + ROLL[0] + '</p>',
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-roll="twice">Roll twice, 80ms apart</button><button class="ds-btn ds-btn--sm" type="button" data-roll="hold">Five changes, holding each</button></div>',
    setup: function (stage, sg) {
      $('[data-roll="twice"]', stage.parentNode).addEventListener('click', function () {
        rollNext(stage);
        setTimeout(function () { rollNext(stage); }, sg.slow(80));
      });
      // With hold every line stays --ds-hold-status; the changes that come
      // during the wait replace the waiting text, so only the latest rolls.
      $('[data-roll="hold"]', stage.parentNode).addEventListener('click', function () {
        for (var i = 0; i < 5; i += 1) {
          setTimeout(function () {
            rollAt = (rollAt + 1) % ROLL.length;
            M.roll($('#sg-roll', stage), ROLL[rollAt], { hold: true });
          }, sg.slow(80 * i));
        }
      });
    },
    play: rollNext,
  });

  /* ── Keyframes: ds-scan ──────────────────────────────────────────── */

  LAB_DEMOS.push({
    id: 'scan',
    group: 'keyframes',
    title: 'Scan over media',
    note: '<code>ds-scan</code> moves a band from above a frame to below it (<code>--ds-scan-from</code>, <code>--ds-scan-to</code>, in percent of the band) while media is being processed: here two passes on the standard curve, then the image counts as processed.',
    shows: ['ds-scan', '--ds-dur-glide', '--ds-ease-in-out'],
    html: '<div class="sg-media"><span class="sg-media__frame">' + icon('image', 40) + '</span><span class="sg-scan" aria-hidden="true"></span><p class="ds-meta sg-media__state" id="sg-scan-state">Photo of LAPTOP-0042</p></div>',
    play: function (stage) {
      var band = $('.sg-scan', stage);
      $('#sg-scan-state', stage).textContent = 'Processing the photo ...';
      M.replay(band, 'sg-scan--play');
      return M.settled(band, { names: ['ds-scan'] }).then(function () {
        $('#sg-scan-state', stage).textContent = 'Processed: no damage found';
      });
    },
  });

  /* ── Keyframes: ds-ripple (the confirmation ring) ────────────────── */

  LAB_DEMOS.push({
    id: 'ring',
    group: 'keyframes',
    title: 'Confirmation ring',
    note: '<code>ds-ripple</code>: a ring that widens to <code>--ds-ripple-scale</code> (1.6) and fades once behind a state that was just saved. It only grows and disappears, on a curve that lands without passing its end.',
    shows: ['ds-ripple', '--ds-ripple-scale', '--ds-ripple-opacity', '--ds-dur-slow', '--ds-ease-out'],
    html: '<div class="sg-ring-host"><span class="sg-ring" aria-hidden="true"></span><span class="ds-status" id="sg-ring-status">' + icon('clock', 16) + '<span>Not saved yet</span></span></div>',
    play: function (stage) {
      var ring = $('.sg-ring', stage);
      setHtml($('#sg-ring-status', stage), icon('check', 16) + '<span>Saved</span>');
      $('#sg-ring-status', stage).className = 'ds-status ds-status--ok';
      M.replay(ring, 'sg-ring--play');
      return M.settled(ring, { names: ['ds-ripple'] });
    },
  });

  /* ── Keyframes: ds-press-ripple through DS.ripple ────────────────── */

  var PRESSES = [['corner', 30, 'Corner, a click'], ['centre', 30, 'Centre, a click'], ['corner', 600, 'Corner, held'], ['centre', 600, 'Centre, held']];

  /* A row of chips that scrolls when dragged: it captures the pointer, so
     the press on the chip under it ends (DS.ripple listens for
     gotpointercapture) and the ripple fades as on release. */
  var DRAG_CHIPS = ['Laptops', 'Desktops', 'Tablets', 'Printers', 'Phones', 'Monitors', 'Docks'];

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

  LAB_DEMOS.push({
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

  /* ── Keyframes: ds-pop-in / ds-pop-out ───────────────────────────── */

  function badge(stage) { return $('.ds-badge', stage); }
  function badgeShown(stage) { var el = badge(stage); return !el.hidden && !el.classList.contains('ds-leave'); }

  LAB_DEMOS.push({
    id: 'pop',
    group: 'keyframes',
    title: 'Badge',
    note: 'A count badge (<code>.ds-badge</code>) pops in from <code>--ds-scale-small</code> on the spring with its fade (<code>.ds-enter--pop</code>: <code>ds-fade-in</code>, <code>ds-pop-in</code>) and pops out the same way back, faster (<code>.ds-leave--pop</code>: <code>ds-fade-out</code>, <code>ds-pop-out</code>). While it shows, the number changes at once.',
    shows: ['ds-pop-in', 'ds-pop-out', '.ds-enter--pop', '.ds-leave--pop', '--ds-scale-small', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-spatial', '--ds-ease-in'],
    html: '<span class="sg-badge-host"><button class="ds-btn" type="button">' + icon('mail', 16) + 'Inbox <span class="ds-badge" hidden>3</span></button></span>',
    reset: function (stage) {
      M.cancel(badge(stage));
      badge(stage).hidden = true;
    },
    play: function (stage) { return M.enter(badge(stage), 'pop'); },
    state: badgeShown,
    toggle: function (stage, on) { return on ? M.enter(badge(stage), 'pop') : M.leave(badge(stage), 'pop', { then: 'hide' }); },
  });

  /* ── Keyframes: ds-clip-in / ds-clip-out from four triggers ──────── */

  var CLIP_SIDES = ['top', 'right', 'bottom', 'left'];
  var clipAt = 0;

  function clipPanel(stage) { return $('.sg-clip__panel', stage); }

  /* Opens the panel from the trigger on `side`: originFrom() writes the
     origin and the clip edge, then the entrance reveals it from there. */
  function clipOpen(stage, side) {
    var panel = clipPanel(stage);
    var trigger = $('[data-clip="' + side + '"]', stage);
    $$('[data-clip]', stage).forEach(function (each) { each.setAttribute('aria-expanded', String(each === trigger)); });
    panel.hidden = false;
    var origin = M.originFrom(trigger, panel);
    setHtml($('.sg-clip__side', panel), 'Opened from the ' + side + ' trigger: it lies on its <code>' + origin.side + '</code> side.');
    return M.enter(panel);
  }

  function clipClose(stage) {
    $$('[data-clip]', stage).forEach(function (each) { each.setAttribute('aria-expanded', 'false'); });
    return M.leave(clipPanel(stage), '', { then: 'hide' });
  }

  function clipShown(stage) { var panel = clipPanel(stage); return !panel.hidden && !panel.classList.contains('ds-leave'); }

  LAB_DEMOS.push({
    id: 'clip',
    group: 'keyframes',
    title: 'Reveal from a trigger',
    note: 'A panel shown by hand with <code>ds-clip-in</code> and <code>ds-clip-out</code> (set through the <code>--ds-enter-*</code> and <code>--ds-leave-*</code> hooks, so enter() and leave() keep their interruption). <code>DS.motion.originFrom(trigger, panel)</code> writes <code>--ds-motion-origin</code> and <code>--ds-clip-from</code>: the panel uncovers itself from the edge that faces its trigger. Replay opens it from each trigger in turn.',
    shows: ['ds-clip-in', 'ds-clip-out', 'DS.motion.originFrom', '--ds-clip-from', '--ds-motion-origin', '--ds-enter-keyframes', '--ds-leave-keyframes', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial', '--ds-ease-in'],
    html: '<div class="sg-clip">' + CLIP_SIDES.map(function (side) {
      return '<button class="ds-btn ds-btn--sm sg-clip__trigger sg-clip__trigger--' + side + '" type="button" aria-expanded="false" data-clip="' + side + '">' + side.charAt(0).toUpperCase() + side.slice(1) + '</button>';
    }).join('') + '<div class="sg-clip__panel" hidden><p class="ds-card__title">Device actions</p><p class="ds-muted sg-clip__side"></p></div></div>',
    height: 260,
    setup: function (stage) {
      stage.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-clip]');
        if (!trigger) return;
        if (trigger.getAttribute('aria-expanded') === 'true') clipClose(stage);
        else clipOpen(stage, trigger.getAttribute('data-clip'));
      });
    },
    play: function (stage) {
      clipAt = (clipAt + 1) % CLIP_SIDES.length;
      return clipOpen(stage, CLIP_SIDES[clipAt]);
    },
    state: clipShown,
    toggle: function (stage, on) { return on ? clipOpen(stage, CLIP_SIDES[clipAt]) : clipClose(stage); },
  });

  /* ── Data: count ─────────────────────────────────────────────────── */

  var COUNT_TILES = [['laptop', 'Devices', 1284], ['alert', 'Overdue', 7]];

  function countTiles(stage, options) {
    return $$('.ds-tile__value[data-count]', stage).map(function (el) {
      return M.countUp(el, Number(el.getAttribute('data-count')), {
        duration: options && options.instant ? 0 : undefined,
        format: function (value) { return Math.round(value).toLocaleString('en-US'); },
      }).finished;
    });
  }

  /* Each press raises the tiles by a step from the value they show (a
     second press retargets a running count), and the figure counts with
     its bar, so both land together (--ds-ease-value over --ds-dur-glide). */
  function countMore(stage) {
    $$('.ds-tile__value[data-count]', stage).forEach(function (el) {
      var value = Number(el.getAttribute('data-count'));
      el.setAttribute('data-count', String(value + Math.max(1, Math.round(value * 0.05))));
    });
    var done = countTiles(stage);
    var progress = $('#sg-count-progress', stage);
    var share = parseFloat(progress.style.getPropertyValue('--ds-progress')) || 0;
    share = share >= 0.95 ? 0.15 : Math.min(1, Math.round((share + 0.2) * 100) / 100);
    progress.style.setProperty('--ds-progress', String(share));
    $('.ds-progress__track', progress).setAttribute('aria-valuenow', String(Math.round(share * 100)));
    done.push(M.countUp($('#sg-count-figure', stage), Math.round(share * 100), { format: function (value) { return Math.round(value) + '%'; } }).finished);
    return Promise.all(done);
  }

  LAB_DEMOS.push({
    id: 'count',
    group: 'data',
    title: 'Count up',
    note: '<code>DS.motion.countUp()</code> counts from the value it shows; a second press mid-count retargets from there ("Press twice" presses again halfway). The figure under the tiles counts with its bar (a <code>--ds-progress</code> transition) on the same curve and time, so both land in the same frame.',
    shows: ['DS.motion.countUp', '--ds-progress', '--ds-ease-value', '--ds-dur-glide'],
    html: '<div class="ds-tiles sg-count-tiles">' + COUNT_TILES.map(function (tile) {
      return '<div class="ds-tile"><p class="ds-tile__label">' + icon(tile[0], 20) + '<span>' + tile[1] + '</span></p><p class="ds-tile__value" data-count="' + tile[2] + '">' + tile[2].toLocaleString('en-US') + '</p></div>';
    }).join('') + '</div>' +
      '<div class="ds-progress sg-count-progress" id="sg-count-progress" style="--ds-progress:.6"><div class="ds-progress__track" role="progressbar" aria-label="Share counted" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"><div class="ds-progress__bar"></div></div><p class="ds-progress__label" id="sg-count-figure">60%</p><p class="ds-progress__detail">figure and bar land together</p></div>',
    height: 240,
    wide: true,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="count">Count up the tiles</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-count-twice>Press twice (again mid-count)</button></div>',
    setup: function (stage) {
      // The shown values are where the first count starts from.
      countTiles(stage, { instant: true });
      M.countUp($('#sg-count-figure', stage), 60, { duration: 0, format: function (value) { return Math.round(value) + '%'; } });
      $('[data-sg="count"]', stage.parentNode).addEventListener('click', function () { countMore(stage); });
      $('[data-count-twice]', stage.parentNode).addEventListener('click', function () {
        countMore(stage);
        setTimeout(function () { countMore(stage); }, M.motionDuration(stage, '--ds-dur-glide') / 2);
      });
    },
    play: countMore,
  });

  /* ── Data: a keyed list through flip() ───────────────────────────── */

  var data = {
    items: [
      { id: 'd1', name: 'LAPTOP-0042', load: 72 },
      { id: 'd2', name: 'LAPTOP-0017', load: 35 },
      { id: 'd3', name: 'PRINTER-0003', load: 88 },
      { id: 'd4', name: 'TABLET-0121', load: 14 },
      { id: 'd5', name: 'LAPTOP-0108', load: 51 },
      { id: 'd6', name: 'DESKTOP-0009', load: 63 },
    ],
    next: 7,
    filter: '',
    sorted: false,
    feed: 0,
  };

  /** At most this many rows, so the list fits its stage. */
  var DATA_MAX = 9;

  function dataShown() {
    var query = data.filter.trim().toLowerCase();
    return data.items.filter(function (item) { return !query || item.name.toLowerCase().indexOf(query) !== -1; });
  }

  function dataCount() {
    var shown = dataShown().length;
    return shown === data.items.length ? data.items.length + ' devices' : shown + ' of ' + data.items.length + ' devices';
  }

  function dataHtml() {
    var shown = dataShown();
    if (!shown.length) return '<li><span class="ds-muted">No device matches "' + esc(data.filter.trim()) + '".</span></li>';
    return shown.map(function (item) {
      return '<li data-ds-key="' + item.id + '"><span>' + esc(item.name) + '</span><strong class="ds-num">' + item.load + '%</strong></li>';
    }).join('');
  }

  /* Re-renders the list through flip(); `status` (optional) rolls in above
     the list. While the live guard holds (a mouse or pen over the list, or
     focus in a row), flip() calls the render with holdOrder: the values
     change in place, and "Order held" shows until the reorder runs. */
  function updateData(card, status, live) {
    var list = $('#sg-data-list', card);
    if (data.sorted) data.items.sort(function (a, b) { return b.load - a.load; });
    if (status !== undefined) M.roll($('#sg-data-status', card), status ? dataCount() + ' · ' + status : dataCount());
    return M.flip(list, function (options) {
      $('#sg-data-held', card).hidden = !options.holdOrder;
      DS.dom.morphHtml(list, dataHtml(), options);
    }, live ? { live: true } : {});
  }

  function shuffleData() {
    data.sorted = false;
    for (var i = data.items.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = data.items[i];
      data.items[i] = data.items[j];
      data.items[j] = swap;
    }
  }

  function dataAction(card, action, button, sg) {
    var names = ['LAPTOP', 'TABLET', 'DESKTOP', 'PRINTER'];
    if (action === 'data-add' && data.items.length < DATA_MAX) {
      var id = data.next;
      data.next += 1;
      var item = { id: 'd' + id, name: names[id % names.length] + '-0' + (200 + id), load: Math.round(5 + Math.random() * 90) };
      data.items.splice(Math.floor(Math.random() * (data.items.length + 1)), 0, item);
      updateData(card, 'added ' + item.name);
    }
    if (action === 'data-remove' && data.items.length) {
      var gone = data.items.splice(Math.floor(Math.random() * data.items.length), 1)[0];
      updateData(card, 'removed ' + gone.name);
    }
    if (action === 'data-shuffle') {
      shuffleData();
      updateData(card, 'shuffled');
    }
    if (action === 'data-sort') {
      data.sorted = true;
      updateData(card, 'sorted by load');
    }
    if (action === 'data-live') {
      var on = button.checked;
      clearInterval(data.feed);
      data.feed = 0;
      if (on) {
        data.sorted = true;
        data.feed = setInterval(function () {
          data.items.forEach(function (row) {
            if (Math.random() < 0.5) row.load = Math.max(1, Math.min(99, row.load + Math.round((Math.random() - 0.5) * 40)));
          });
          updateData(card, undefined, true);
        }, sg.slow(700));
      }
      M.roll($('#sg-data-status', card), dataCount() + ' · live data ' + (on ? 'on, sorted by load' : 'off'));
    }
  }

  LAB_DEMOS.push({
    id: 'data-list',
    group: 'data',
    title: 'A keyed list',
    note: 'Re-rendered with <code>DS.dom.morphHtml</code> inside <code>DS.motion.flip</code>: rows glide to their new places on the spring, over a time that grows with the distance; new rows fade in, removed rows fade out of the flow while the list closes the gap. Typing filters on every keystroke. Live data re-sorts every 700ms with live: true; while the mouse is over the list or a row has focus, the values change at once and the reorder waits ("Order held"), at most 2s.',
    shows: ['DS.motion.flip', 'DS.dom.morphHtml', 'DS.motion.roll', 'DS.motion.travelDuration', '--ds-dur-medium', '--ds-dur-slow', '--ds-ease-spatial', '--ds-ease-out'],
    html: '<div class="sg-data-head"><p class="ds-meta sg-data-status" id="sg-data-status" aria-live="polite"><span>' + dataCount() + '</span></p><span class="ds-status sg-data-held" id="sg-data-held" hidden>' + icon('lock', 16) + '<span>Order held</span></span></div>' +
      '<ul class="ds-kv-list sg-data-list" id="sg-data-list">' + dataHtml() + '</ul>',
    height: 440,
    wide: true,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="data-add">' + icon('plus', 16) + 'Add</button><button class="ds-btn ds-btn--sm" type="button" data-sg="data-remove">Remove</button><button class="ds-btn ds-btn--sm" type="button" data-sg="data-shuffle">Shuffle</button><button class="ds-btn ds-btn--sm" type="button" data-sg="data-sort">Sort by load</button></div>' +
      '<div class="sg-row">' + switchHtml('sg-data-live', 'Live data (every 700ms)') + '</div>' +
      '<div class="ds-field sg-data-filter"><label class="ds-field__label" for="sg-data-filter">Filter</label><input class="ds-input" id="sg-data-filter" type="search" autocomplete="off" placeholder="Device name"></div>',
    setup: function (stage, sg) {
      var card = stage.parentNode;
      card.addEventListener('click', function (event) {
        var button = event.target.closest('[data-sg^="data-"]');
        if (button) dataAction(card, button.getAttribute('data-sg'), button, sg);
      });
      $('#sg-data-live', card).addEventListener('change', function (event) { dataAction(card, 'data-live', event.target, sg); });
      $('#sg-data-filter', card).addEventListener('input', function (event) {
        data.filter = event.target.value;
        updateData(card, data.filter.trim() ? 'filtered' : null);
      });
    },
    play: function (stage) {
      shuffleData();
      return updateData(stage.parentNode, 'shuffled');
    },
  });

  /* ── Data: a list reordered by drag and keyboard ─────────────────── */

  var SORT_ROWS = ['Back up the database', 'Update the agents', 'Restart the gateways', 'Send the report'];

  function sortGrip(stage, index) { return $('[data-ds-key="sort-' + index + '"] .ds-grip', stage); }

  function sortOn(stage) {
    var rows = $$('#sg-lab-sortable > li', stage);
    return rows[rows.length - 1].getAttribute('data-ds-key') === 'sort-0';
  }

  /* The keys of the grip, as a keyboard user presses them: End moves the
     first row to the end, Home brings it back; both glide through flip(). */
  function sortTo(stage, on, sg) {
    sortGrip(stage, 0).dispatchEvent(new KeyboardEvent('keydown', { key: on ? 'End' : 'Home', bubbles: true, cancelable: true }));
    return sg.frames(2).then(function () { return quiet(stage, sg); });
  }

  LAB_DEMOS.push({
    id: 'sortable',
    group: 'data',
    title: 'Reorder by drag and keyboard',
    note: '<code>DS.motion.sortable()</code>: drag a row by its grip, or focus the grip and press the arrow keys, Home or End. The dragged row follows the pointer, raised (<code>data-ds-dragging</code>: the dragged state layer and a shadow, nothing scales); whenever it passes the middle of a neighbour the others glide through <code>DS.motion.flip()</code>, and a move during a glide continues from where each row is. The new position is spoken; the read-out shows what <code>onChange</code> got.',
    shows: ['DS.motion.sortable', 'DS.motion.flip', '--ds-state-dragged', '--ds-elev-2', '--ds-dur-fast', '--ds-dur-instant', '--ds-dur-slow', '--ds-ease-spatial'],
    html: '<ul class="ds-plain-list sg-sortable" id="sg-lab-sortable">' + SORT_ROWS.map(function (text, index) {
      return '<li class="sg-sortable__row" data-ds-key="sort-' + index + '"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move ' + text + '">' + icon('menu', 20) + '</button><span>' + text + '</span></li>';
    }).join('') + '</ul>',
    after: readoutHtml('sg-lab-sortable-out', 'Order: 1, 2, 3, 4'),
    height: 220,
    setup: function (stage) {
      M.sortable($('#sg-lab-sortable', stage), {
        onChange: function (order) {
          $('#sg-lab-sortable-out', stage.parentNode).textContent = 'Order: ' + order.map(function (row) { return Number(row.getAttribute('data-ds-key').slice(5)) + 1; }).join(', ');
        },
      });
    },
    play: function (stage, sg) { return sortTo(stage, !sortOn(stage), sg); },
    state: sortOn,
    toggle: sortTo,
  });

  /* ── Data: a log that sticks to its end ──────────────────────────── */

  var logLine = 0;

  function logAppend(stage, count) {
    var log = $('#sg-lab-log', stage);
    for (var i = 0; i < count; i += 1) {
      logLine += 1;
      var line = document.createElement('p');
      line.className = 'sg-log__line';
      line.textContent = 'Row ' + logLine * 37 + ' imported';
      log.append(line);
    }
  }

  function logOn(stage) { return !$('#sg-lab-log-pill', stage).hidden; }

  function logTo(stage, on, sg) {
    var log = $('#sg-lab-log', stage);
    if (on) log.scrollTo({ top: 0, behavior: 'smooth' });
    else logFollow.stick();
    return until(sg, function () { return on ? log.scrollTop < 1 : log.scrollHeight - log.clientHeight - log.scrollTop < 1; }, 4000)
      .then(function () { return sg.frames(2); }).then(function () { return quiet(stage, sg); });
  }

  var logFollow = null;

  LAB_DEMOS.push({
    id: 'follow-end',
    group: 'data',
    title: 'A log that follows its end',
    note: '<code>DS.dom.followEnd()</code>: while the log is at its end, new lines keep it there (a ResizeObserver, nothing polls). Scroll up and it lets go: the "Latest" pill shows (a <code>.ds-presence</code> wrapper), and a click on it goes back to the end, smoothly within one view height, else at once. Replay adds three lines.',
    shows: ['DS.dom.followEnd', '.ds-presence', '--ds-dur-fast', '--ds-ease-spatial'],
    html: '<div class="sg-log-demo"><div class="sg-log" id="sg-lab-log" tabindex="0" aria-label="Import log"></div>' +
      '<div class="sg-log__jump"><span class="ds-presence" id="sg-lab-log-pill" hidden><button class="ds-btn ds-btn--tonal ds-btn--sm" type="button">' + icon('arrowDown', 16) + 'Latest</button></span></div></div>',
    height: 200,
    setup: function (stage) {
      logAppend(stage, 8);
      var log = $('#sg-lab-log', stage);
      log.scrollTop = log.scrollHeight;
      logFollow = DS.dom.followEnd(log, { pill: $('#sg-lab-log-pill', stage) });
    },
    play: function (stage, sg) {
      logAppend(stage, 3);
      return sg.frames(3).then(function () { return quiet(stage, sg); });
    },
    state: logOn,
    toggle: logTo,
  });

  /* ── Data: morphHtml versus innerHTML ────────────────────────────── */

  var JOBS = [['j1', 'Backup LAPTOP-0042'], ['j2', 'Update TABLET-0121'], ['j3', 'Scan PRINTER-0003']];
  var jobTick = 0;
  var jobFeed = 0;

  function jobsHtml(tick, side) {
    return JOBS.map(function (job, index) {
      var share = (tick * 7 + index * 23) % 100;
      return '<li data-ds-key="' + job[0] + '"><span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span><span class="sg-job__name">' + job[1] + '</span>' +
        '<strong class="ds-num">' + share + '%</strong><input class="ds-input sg-job__note" aria-label="Note on ' + job[1] + ' (' + side + ')" placeholder="Note"></li>';
    }).join('');
  }

  /* One update of both lists: the left one is replaced, the right one
     patched in place (DS.dom.morphChildren, the node form of morphHtml). */
  function jobsUpdate(stage) {
    jobTick += 1;
    var left = $('#sg-jobs-replace', stage);
    var right = $('#sg-jobs-morph', stage);
    var focused = document.activeElement;
    var where = left.contains(focused) ? 'replace' : right.contains(focused) ? 'morph' : '';
    setHtml(left, jobsHtml(jobTick, 'innerHTML'));
    var template = document.createElement('template');
    template.innerHTML = jobsHtml(jobTick, 'morphHtml');
    DS.dom.morphChildren(right, template.content.childNodes);
    var out = $('#sg-jobs-focus', stage.parentNode);
    if (where === 'replace') setHtml(out, 'Focus was in the replaced list: it is lost now.');
    else if (where === 'morph') setHtml(out, 'Focus is in the patched list: it stayed, caret and all.');
  }

  LAB_DEMOS.push({
    id: 'morph',
    group: 'data',
    title: 'Morph, not innerHTML',
    note: 'Both lists get the same new values. The left one is replaced (innerHTML): every spinner restarts and waits its loader delay again, and a note being typed loses its focus. The right one is patched in place with <code>DS.dom.morphHtml</code> (morphChildren): only the figures change, the spinners keep turning and the focus stays. Type in a note, then turn the updates on.',
    shows: ['DS.dom.morphHtml', 'DS.dom.morphChildren', 'ds-spinner-arc', '--ds-delay-loader', '--ds-loop-arc'],
    html: '<div class="sg-jobs"><div><p class="sg-label">innerHTML</p><ul class="ds-kv-list sg-jobs__list" id="sg-jobs-replace">' + jobsHtml(0, 'innerHTML') + '</ul></div>' +
      '<div><p class="sg-label">DS.dom.morphHtml</p><ul class="ds-kv-list sg-jobs__list" id="sg-jobs-morph">' + jobsHtml(0, 'morphHtml') + '</ul></div></div>',
    after: readoutHtml('sg-jobs-focus'),
    height: 260,
    wide: true,
    controls: '<div class="sg-row">' + switchHtml('sg-jobs-feed', 'Update every second') + '</div>',
    setup: function (stage, sg) {
      $('#sg-jobs-feed', stage.parentNode).addEventListener('change', function (event) {
        clearInterval(jobFeed);
        jobFeed = event.target.checked ? setInterval(function () { jobsUpdate(stage); }, sg.slow(1000)) : 0;
      });
    },
    play: function (stage, sg) {
      jobsUpdate(stage);
      return quiet(stage, sg);
    },
  });

  /* ── Data: settleLoader, fast and slow ───────────────────────────── */

  /* A load into `pane`: the loading line goes in at once (it shows only
     after the loader delay), the fake request takes `ms`, then
     settleLoader() keeps a loader that did show for the hold time. The
     caption tells what the loader does for a request of `ms` (at the
     current speed), not what a late timer made of it: on a busy machine
     the 150ms timer may fire after the 200ms delay, and the caption would
     change from run to run. */
  function loadInto(pane, ms, sg) {
    setHtml(pane, '<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading the devices ...</div>');
    var loader = pane.firstChild;
    var times = { delay: M.motionDuration(loader, '--ds-delay-loader'), minVisible: M.motionDuration(loader, '--ds-hold-loader') };
    var startedAt = Date.now();
    return wait(sg, ms).then(function () {
      var hold = M.loaderHoldMs(0, sg.slow(ms), times);
      var shown = sg.slow(ms) > times.delay;
      return M.settleLoader(startedAt, { element: loader }).then(function () {
        setHtml(pane, '<p class="ds-muted">Loaded 1,284 devices. ' + (!shown ? 'The loader never showed.' : hold > 0 ? 'The loader had just appeared, so it stayed ' + Math.round(hold) + 'ms longer.' : 'The loader showed and left at once.') + '</p>');
        return M.enter(pane.firstChild, 'swap');
      });
    });
  }

  LAB_DEMOS.push({
    id: 'settle-loader',
    group: 'data',
    title: 'Fast and slow loads',
    note: 'The same load twice: 150ms on the left, 1200ms on the right. A loading line fades in only after <code>--ds-delay-loader</code>, so the fast load shows nothing at all; once one showed, <code>DS.motion.settleLoader()</code> keeps it for <code>--ds-hold-loader</code>, so it never flashes up and away.',
    shows: ['DS.motion.settleLoader', 'DS.motion.loaderHoldMs', '.ds-enter--swap', '--ds-delay-loader', '--ds-hold-loader', 'ds-loader-morph'],
    html: '<div class="sg-panes"><div><p class="sg-label">Fast (150ms)</p><div class="sg-pane" id="sg-load-fast"><p class="ds-muted">Ready.</p></div></div>' +
      '<div><p class="sg-label">Slow (1200ms)</p><div class="sg-pane" id="sg-load-slow"><p class="ds-muted">Ready.</p></div></div></div>',
    wide: true,
    play: function (stage, sg) {
      return Promise.all([loadInto($('#sg-load-fast', stage), 150, sg), loadInto($('#sg-load-slow', stage), 1200, sg)]);
    },
  });

  /* ── Controls: press on every action type ────────────────────────── */

  var ACTIONS = [
    '<button class="ds-btn ds-btn--primary" type="button">Primary</button>',
    '<button class="ds-btn ds-btn--tonal" type="button">Tonal</button>',
    '<button class="ds-btn" type="button">Outlined</button>',
    '<button class="ds-btn ds-btn--text" type="button">Text</button>',
    '<button class="ds-btn ds-btn--quiet" type="button">' + icon('filter', 16) + 'Quiet</button>',
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings">' + icon('settings', 20) + '</button>',
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="More actions">' + icon('moreVertical', 20) + '</button>',
    '<label class="ds-chip"><input class="ds-chip__input" type="checkbox"><span class="ds-chip__body">' + icon('check', 18, 'ds-chip__check') + '<span>Chip</span></span></label>',
    '<nav class="ds-segmented sg-press-segmented" aria-label="Mode"><a class="ds-segmented__option" href="#controls" aria-current="true" data-label="Live">Live</a><a class="ds-segmented__option" href="#controls" data-label="Admin">Admin</a></nav>',
  ];

  var PRESS_CARDS = '<div class="sg-press-cards">' +
    '<button class="ds-tile" type="button"><span class="ds-tile__label">' + icon('alert', 20) + '<span>Overdue</span></span><span class="ds-tile__value">7</span></button>' +
    '<button class="ds-card ds-card--interactive" type="button"><span class="ds-card__title">PRINTER-0003</span><span class="ds-muted sg-card-text">A clickable card</span></button>' +
    '<div class="ds-radios sg-press-radios" role="radiogroup" aria-label="Plan"><label class="ds-radio"><input type="radio" name="sg-press-plan" checked><span><strong>Standard</strong><small>A radio card</small></span></label></div></div>';

  LAB_DEMOS.push({
    id: 'press',
    group: 'controls',
    title: 'Press on every action',
    note: 'Every action presses the same way: the state layer comes in <code>--ds-dur-micro</code>, the ripple grows from the pointer, and the shape turns squarer (pills to <code>--ds-radius-action-pressed</code>, cards and radio cards to <code>--ds-radius-card-pressed</code>, tiles to their hook) and springs back on release. Nothing scales and nothing moves on hover. Replay holds each for 300ms.',
    shows: ['DS.ripple.attach', 'ds-press-ripple', '--ds-radius-action-pressed', '--ds-radius-card-pressed', '--ds-tile-radius-pressed', '--ds-dur-micro', '--ds-dur-medium', '--ds-ease-out', '--ds-ease-spatial', '--ds-state-pressed'],
    html: '<div class="sg-press-all"><div class="sg-row">' + ACTIONS.join('') + '</div>' + PRESS_CARDS + '</div>',
    height: 260,
    wide: true,
    setup: function (stage) {
      $$('a.ds-segmented__option', stage).forEach(function (option) {
        option.addEventListener('click', function (event) { event.preventDefault(); });
      });
    },
    play: function (stage, sg) {
      var hosts = $$('.ds-btn, .ds-chip, .ds-segmented__option, .ds-tile, .ds-card--interactive, .ds-radio', stage);
      return Promise.all(hosts.map(function (host) { return press(host, sg, 'centre', 300); }))
        .then(function () { return ripplesGone(stage, sg); });
    },
  });

  /* ── Controls: the focus snap ────────────────────────────────────── */

  LAB_DEMOS.push({
    id: 'focus',
    group: 'controls',
    title: 'Focus snap',
    note: 'Keyboard focus: the ring is solid from the first frame, one ring width further out, then its offset snaps in over <code>--ds-dur-fast</code> (a transition of outline-offset, decelerating); colour and width never animate. Replay walks the focus along the row as Tab would; press Tab yourself to see it.',
    shows: ['--ds-focus-outline', '--ds-focus-offset', '--ds-focus-width', '--ds-dur-fast', '--ds-ease-out'],
    html: '<div class="sg-row sg-focus-row"><button class="ds-btn ds-btn--primary" type="button">Save</button><button class="ds-btn" type="button">Export</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings">' + icon('settings', 20) + '</button>' +
      '<label class="ds-chip"><input class="ds-chip__input" type="checkbox"><span class="ds-chip__body">' + icon('check', 18, 'ds-chip__check') + '<span>Active</span></span></label><input class="ds-input sg-focus-input" aria-label="Search" placeholder="Search"></div>',
    play: function (stage, sg) {
      var stops = $$('button, input', stage);
      var step = Promise.resolve();
      stops.forEach(function (stop, index) {
        step = step.then(function () {
          stop.focus({ preventScroll: true, focusVisible: true });
          return index < stops.length - 1 ? wait(sg, 400) : quiet(stage, sg);
        });
      });
      return step;
    },
  });

  /* ── Controls: the locked switch ─────────────────────────────────── */

  function lockedRow(stage) { return $('.ds-switch', stage); }
  function lockedOn(stage) { return lockedRow(stage).classList.contains('ds-switch--locked'); }

  /* Locks or frees the switch: the lock fades in on --ds-dur-fast and out on --ds-dur-instant, the off handle grows to hold it. */
  function lockSwitch(stage, on) {
    var row = lockedRow(stage);
    var input = $('input', row);
    row.classList.toggle('ds-switch--locked', on);
    if (on) input.setAttribute('aria-disabled', 'true');
    else input.removeAttribute('aria-disabled');
    $('.ds-switch__hint', row).textContent = on ? 'Set by the device policy' : 'You can change it';
    return M.settled($('.ds-switch__icon', row), { transitions: true });
  }

  LAB_DEMOS.push({
    id: 'switch-locked',
    group: 'controls',
    title: 'Locked switch',
    note: 'A value another system sets: <code>.ds-switch--locked</code> with <code>aria-disabled</code>. The lock fades in on <code>--ds-dur-fast</code> and out faster on <code>--ds-dur-instant</code>, the off handle grows to hold it, and the lock rides the handle on the spring when the value changes (set by the system, not by a click). Replay locks the switch and lets the policy flip its value.',
    shows: ['.ds-switch--locked', '--ds-dur-fast', '--ds-dur-instant', '--ds-dur-medium', '--ds-ease-spatial', '--ds-ease-in-out'],
    html: '<div class="ds-stack"><label class="ds-switch"><input type="checkbox" role="switch" aria-describedby="sg-lab-lock-why"><span class="ds-switch__track" aria-hidden="true">' + icon('lock', 16, 'ds-switch__icon') + '</span><span class="ds-switch__label">Disk encryption</span><small class="ds-switch__hint" id="sg-lab-lock-why">You can change it</small></label></div>',
    reset: function (stage) {
      lockSwitch(stage, false);
      $('input', lockedRow(stage)).checked = false;
    },
    play: function (stage, sg) {
      var input = $('input', lockedRow(stage));
      return lockSwitch(stage, true).then(function () { return wait(sg, 300); }).then(function () {
        input.checked = !input.checked;
        return quiet(stage, sg);
      });
    },
    state: lockedOn,
    toggle: lockSwitch,
  });

  /* ── Controls: busy and success ──────────────────────────────────── */

  function busyRun(button, ms, sg) {
    // A new label during the run (DS.motion.setLabel) waits for the rest face.
    var next = button.getAttribute('data-busy-next');
    if (next) M.setLabel(button, next);
    return M.busy(button, function () { return wait(sg, ms); }).then(function () {
      return until(sg, function () { return !button.classList.contains('ds-btn--done'); }, 3000);
    }).then(function () { return quiet(button, sg); });
  }

  LAB_DEMOS.push({
    id: 'busy',
    group: 'controls',
    title: 'Busy and success',
    note: '<code>DS.motion.busy()</code> on two saves and a retry. The fast one (150ms) answers before the loader delay: nothing changes but the success face. The slow one (1200ms) shows its spinner after <code>--ds-delay-loader</code>, keeps it at least <code>--ds-hold-loader</code>, then the label and spinner crossfade to the success face, whose check draws itself, for <code>--ds-hold-success</code>; its new label (<code>DS.motion.setLabel()</code>, set as the run starts) shows once it is back at rest. The retry has no success face, so it goes straight back to its label. The width never changes: the faces share one cell. While a button works or shows its success, <code>DS.motion.guard()</code> blocks every click, Enter and Space on it (the read-out counts them).',
    shows: ['DS.motion.busy', 'DS.motion.guard', 'DS.motion.setLabel', 'ds-draw', 'ds-spinner-arc', '--ds-delay-loader', '--ds-hold-loader', '--ds-hold-success', '--ds-dur-fast', '--ds-dur-medium'],
    html: '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-busy="150">' + facesHtml('Save (150ms)', 'Saving', 'Saved') + '</button>' +
      '<button class="ds-btn" type="button" data-busy="1200" data-busy-next="Save again (1200ms)">' + facesHtml('Save (1200ms)', 'Saving', 'Saved') + '</button>' +
      '<button class="ds-btn ds-btn--text" type="button" data-busy="1200"><span class="ds-btn__faces"><span class="ds-btn__face">Retry (1200ms)</span>' +
      '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Retrying</span></span></button></div>',
    after: readoutHtml('sg-busy-blocked', 'Click a button again while it works: <code>DS.motion.guard()</code> blocks it.'),
    setup: function (stage, sg) {
      // Counts the activations the guard blocks: this listener comes before
      // the guard's (busy() installs it on its first run), in the same phase.
      var blocked = 0;
      window.addEventListener('click', function (event) {
        var button = event.isTrusted && event.target.closest && event.target.closest('[data-busy]');
        if (!button || !stage.contains(button) || !button.matches('[aria-busy="true"], .ds-btn--done')) return;
        blocked += 1;
        setHtml($('#sg-busy-blocked', stage.parentNode), 'Blocked activations: <strong class="ds-num">' + blocked + '</strong> (<code>DS.motion.guard()</code>: clicks, Enter and Space on a busy or done button never reach the page)');
      }, true);
      stage.addEventListener('click', function (event) {
        var button = event.target.closest('[data-busy]');
        if (button) busyRun(button, Number(button.getAttribute('data-busy')), sg);
      });
    },
    play: function (stage, sg) {
      return Promise.all($$('[data-busy]', stage).map(function (button) { return busyRun(button, Number(button.getAttribute('data-busy')), sg); }));
    },
  });

  /* ── Controls: icon pairs ────────────────────────────────────────── */

  function iconPairs(stage, on) {
    var copy = $('[data-pair="copy"] .ds-icon-swap', stage);
    var offline = $('[data-pair="offline"]', stage);
    offline.setAttribute('aria-pressed', String(on));
    $('[data-pair="helpful"]', stage).setAttribute('aria-pressed', String(on));
    $('[data-pair="copy"]', stage).setAttribute('aria-label', on ? 'Link copied' : 'Copy link');
    return Promise.all([
      M.crossfade(copy, icon(on ? 'check' : 'copy', 20), { kind: 'icon' }),
      M.settled($('.ds-icon-swap', offline), { transitions: true, subtree: true }),
    ]);
  }

  function iconPairsOn(stage) { return $('[data-pair="offline"]', stage).getAttribute('aria-pressed') === 'true'; }

  LAB_DEMOS.push({
    id: 'icon-swap',
    group: 'controls',
    title: 'Icon pairs',
    note: 'Copy turns into a check (<code>DS.motion.crossfade(el, icon, { kind: \'icon\' })</code>), and a pressed toggle swaps wifi for wifi off by CSS alone (aria-pressed). The incoming icon fades in and springs up from <code>--ds-scale-small</code>, a check draws itself, the outgoing one only fades; a rapid toggle turns back from where both icons are. The thumb does not swap: it fills while pressed (<code>.ds-icon--fillable</code>, the fill on <code>--ds-dur-fast</code>).',
    shows: ['DS.motion.crossfade', '.ds-icon-swap', '.ds-icon--fillable', 'ds-draw', '--ds-scale-small', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-spatial', '--ds-ease-in-out'],
    html: '<div class="sg-row"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-pair="copy"><span class="ds-icon-swap">' + icon('copy', 20) + '</span></button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Work offline" aria-pressed="false" data-pair="offline"><span class="ds-icon-swap"><span class="ds-icon-swap__a">' + icon('wifi', 20) + '</span><span class="ds-icon-swap__b">' + icon('wifiOff', 20) + '</span></span></button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Helpful" aria-pressed="false" data-pair="helpful">' + icon('thumbUp', 20, 'ds-icon--fillable') + '</button></div>',
    setup: function (stage) {
      stage.addEventListener('click', function (event) {
        if (event.target.closest('[data-pair]')) iconPairs(stage, !iconPairsOn(stage));
      });
    },
    play: function (stage) { return iconPairs(stage, !iconPairsOn(stage)); },
    state: iconPairsOn,
    toggle: iconPairs,
  });

  /* ── Controls: chips ─────────────────────────────────────────────── */

  var CHIPS = ['Active', 'In storage', 'Archived', 'Lent out', 'In repair', 'Older than 4 years'];

  /* Sets a chip the way a click would, so DS.ripple's change listener
     glides the slot and the neighbours (a programmatic change alone has
     no event, and only the CSS would run). */
  function setChip(stage, name, on) {
    var input = $$('.ds-chip__input', stage).filter(function (each) { return each.parentNode.textContent === name; })[0];
    if (input.checked === on) return;
    input.checked = on;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function chipsOn(stage) { return $$('.ds-chip__input', stage)[2].checked; }

  LAB_DEMOS.push({
    id: 'chips',
    group: 'controls',
    title: 'Filter chips',
    note: 'Selecting a chip opens the room of its check (its width, on <code>--ds-ease-out</code>: a size that pushes layout lands without passing its end) while the check draws itself; the neighbours follow. When a chip no longer fits its line, the slot lands at once and the chips glide to their new places (FLIP), across the wrap. Deselecting reverses it.',
    shows: ['DS.ripple.attach', 'DS.motion.flip', 'ds-draw', '--ds-dur-medium', '--ds-dur-micro', '--ds-ease-out', '--ds-ease-spatial'],
    html: '<fieldset class="ds-chips sg-chip-row"><legend class="ds-sr">Status</legend>' + CHIPS.map(function (name, index) {
      return '<label class="ds-chip"><input class="ds-chip__input" type="checkbox"' + (index ? '' : ' checked') + '><span class="ds-chip__body">' + icon('check', 18, 'ds-chip__check') + '<span>' + name + '</span></span></label>';
    }).join('') + '</fieldset>',
    play: function (stage, sg) {
      setChip(stage, 'Archived', !chipsOn(stage));
      return quiet(stage, sg);
    },
    state: chipsOn,
    toggle: function (stage, on, sg) {
      setChip(stage, 'Archived', on);
      setChip(stage, 'In storage', on);
      return quiet(stage, sg);
    },
  });

  /* ── Controls: the drop zone ─────────────────────────────────────── */

  function dropOn(stage) { return $('.ds-dropzone', stage).hasAttribute('data-ds-dragover'); }

  /* The demo sets the attribute that DS.dom.dropzone() owns while files are
     dragged over the zone (a script cannot start a real file drag). */
  function dropTo(stage, on, sg) {
    $('.ds-dropzone', stage).toggleAttribute('data-ds-dragover', on);
    return sg.frames(2).then(function () { return quiet(stage, sg); });
  }

  LAB_DEMOS.push({
    id: 'dropzone',
    group: 'controls',
    title: 'Drop zone',
    note: 'A <code>.ds-dropzone</code> while files are dragged over it (<code>data-ds-dragover</code>, written by <code>DS.dom.dropzone()</code>): it takes the accent with an inset primary edge over <code>--ds-dur-fast</code>, so nothing shifts, and its title crossfades in one cell to say so in words; the old title leaves in <code>--ds-dur-instant</code>. It presses like a radio card. Drop a file on it, or Replay.',
    shows: ['--ds-dropzone-border', '--ds-radius-card-pressed', '--ds-dur-fast', '--ds-dur-instant', '--ds-dur-micro', '--ds-ease-in-out', '--ds-ease-spatial'],
    html: '<label class="ds-dropzone sg-lab-dropzone"><input class="ds-dropzone__input" type="file" accept=".csv" multiple>' +
      '<span class="ds-dropzone__disc" aria-hidden="true">' + icon('plus', 24) + '</span>' +
      '<span class="ds-dropzone__title"><span class="ds-dropzone__idle">Drop CSV files here or <span class="ds-dropzone__browse">browse</span></span><span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span></span>' +
      '<span class="ds-dropzone__hint">Up to 10 MB each</span></label>',
    after: readoutHtml('sg-lab-dropzone-out', 'No file yet.'),
    height: 200,
    setup: function (stage) {
      DS.dom.dropzone($('.ds-dropzone', stage), {
        onFiles: function (files) {
          $('#sg-lab-dropzone-out', stage.parentNode).textContent = 'Added ' + files.map(function (file) { return file.name; }).join(', ') + '.';
        },
      });
    },
    play: function (stage, sg) { return dropTo(stage, !dropOn(stage), sg); },
    state: dropOn,
    toggle: dropTo,
  });

  /* ── Controls: input chips ───────────────────────────────────────── */

  var INPUT_CHIPS = ['Building C', 'Owner: Ada Lovelace', 'Warranty ends this year', 'In repair'];

  function inputChipsHtml() {
    return INPUT_CHIPS.map(function (name) {
      return '<button class="ds-chip ds-chip--input" type="button" data-ds-key="' + esc(name) + '"><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>' + esc(name) + '</span>' + icon('close', 18, 'ds-chip__trailing') + '</span></button>';
    }).join('');
  }

  /* Removes an input chip as a click would: focus to the neighbour, the chips after it glide into its place. */
  function removeInputChip(stage, chip) {
    var row = $('.ds-chips', stage);
    var next = chip.nextElementSibling || chip.previousElementSibling;
    if (next && row.contains(document.activeElement)) next.focus({ preventScroll: true });
    return M.flip(row, function () { chip.remove(); });
  }

  LAB_DEMOS.push({
    id: 'input-chips',
    group: 'controls',
    title: 'Input chips',
    note: 'Active filters as input chips (<code>.ds-chip--input</code>, buttons): a press ripples, and the chip removes its filter through <code>DS.motion.flip</code>: it fades out in place while the chips after it glide into its room on the spring, across a wrap too. Replay removes the second chip, then the filters come back.',
    shows: ['.ds-chip--input', 'DS.motion.flip', 'DS.ripple.attach', 'ds-fade-out', '--ds-ease-spatial', '--ds-dur-fast'],
    html: '<div class="ds-chips sg-chip-row" role="group" aria-label="Active filters">' + inputChipsHtml() + '</div>',
    setup: function (stage) {
      stage.addEventListener('click', function (event) {
        var chip = event.target.closest('.ds-chip--input');
        if (chip) removeInputChip(stage, chip);
      });
    },
    reset: function (stage) { DS.dom.morphHtml($('.ds-chips', stage), inputChipsHtml()); },
    play: function (stage, sg) {
      var chip = $$('.ds-chip--input', stage)[1];
      if (!chip) {
        DS.dom.morphHtml($('.ds-chips', stage), inputChipsHtml());
        return quiet(stage, sg);
      }
      return removeInputChip(stage, chip).then(function () { return quiet(stage, sg); });
    },
  });

  /* ── Controls: switch ────────────────────────────────────────────── */

  function switchInput(stage) { return $('#sg-lab-switch', stage); }

  LAB_DEMOS.push({
    id: 'switch',
    group: 'controls',
    title: 'Switch',
    note: 'Pressed, the handle grows to its full size in <code>--ds-dur-instant</code> (the one thing that scales on press); on release it travels and settles on the spring while the track and the state word change colour. A programmatic change runs the same transitions, and a rapid toggle turns the handle back from where it is. Replay presses and holds, then lets go.',
    shows: ['--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-instant', '--ds-dur-fast', '--ds-ease-in-out'],
    html: '<div class="ds-stack">' + switchHtml('sg-lab-switch', 'Nightly sync') + '</div>',
    play: function (stage, sg) {
      var row = $('.ds-switch', stage);
      row.classList.add('ds-pressed');
      return wait(sg, 500).then(function () {
        row.classList.remove('ds-pressed');
        switchInput(stage).checked = !switchInput(stage).checked;
        return quiet(stage, sg);
      });
    },
    state: function (stage) { return switchInput(stage).checked; },
    toggle: function (stage, on, sg) {
      switchInput(stage).checked = on;
      return quiet(stage, sg);
    },
  });

  /* ── Controls: checkboxes and radios ─────────────────────────────── */

  var CHECK_ROWS = [['c1', 'LAPTOP-0042'], ['c2', 'TABLET-0121'], ['c3', 'PRINTER-0003']];

  /* The header box of the little table: checked, mixed or empty by its rows. */
  function syncAll(stage) {
    var rows = $$('[data-check-row]', stage);
    var checked = rows.filter(function (row) { return row.checked; }).length;
    var all = $('[data-check-all]', stage);
    all.checked = checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
  }

  function checksTo(stage, on, sg) {
    $$('[data-check-row]', stage).forEach(function (row) { row.checked = on; });
    syncAll(stage);
    $('[data-check-some]', stage).indeterminate = !on;
    $('[data-check-some]', stage).checked = on;
    $$('.ds-radio input', stage)[on ? 1 : 0].checked = true;
    $$('.ds-radio-input', stage)[on ? 1 : 0].checked = true;
    return quiet(stage, sg);
  }

  LAB_DEMOS.push({
    id: 'checks',
    group: 'controls',
    title: 'Checkboxes and radios',
    note: 'The native inputs, drawn by CSS: the check draws itself, the indeterminate dash morphs into it, a radio\'s dot grows on the spring, and the halo is the press. In a table, "select all" changes every row in the same frame (no stagger), and the header turns mixed when only some are selected. Radio cards turn squarer while pressed.',
    shows: ['--ds-dur-medium', '--ds-dur-fast', '--ds-ease-out', '--ds-ease-spatial', '--ds-ease-in'],
    html: '<div class="sg-checks"><div class="ds-stack"><label class="ds-check"><input type="checkbox" checked><span>Managed</span></label><label class="ds-check"><input type="checkbox" data-check-some><span>Some of them (indeterminate)</span></label>' +
      '<div class="sg-row"><input class="ds-radio-input" type="radio" name="sg-lab-size" aria-label="Small" checked><input class="ds-radio-input" type="radio" name="sg-lab-size" aria-label="Large"></div></div>' +
      '<div class="ds-table-wrap"><table class="ds-table"><caption class="ds-sr">Devices</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-check-all></th><th scope="col">Device</th></tr></thead><tbody>' +
      CHECK_ROWS.map(function (row) { return '<tr><td><input type="checkbox" aria-label="Select ' + row[1] + '" data-check-row></td><td>' + row[1] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="ds-radios" role="radiogroup" aria-label="Plan"><label class="ds-radio"><input type="radio" name="sg-lab-plan" checked><span><strong>Standard</strong><small>Replaced after four years.</small></span></label><label class="ds-radio"><input type="radio" name="sg-lab-plan"><span><strong>Extended</strong><small>Six years, with a longer warranty.</small></span></label></div></div>',
    height: 260,
    wide: true,
    setup: function (stage) {
      $('[data-check-some]', stage).indeterminate = true;
      stage.addEventListener('change', function (event) {
        if (event.target.hasAttribute('data-check-all')) {
          $$('[data-check-row]', stage).forEach(function (row) { row.checked = event.target.checked; });
        }
        if (event.target.hasAttribute('data-check-row') || event.target.hasAttribute('data-check-all')) syncAll(stage);
      });
    },
    play: function (stage, sg) { return checksTo(stage, !$('[data-check-all]', stage).checked, sg); },
    state: function (stage) { return $('[data-check-all]', stage).checked; },
    toggle: checksTo,
  });

  /* ── Controls: validation on blur ────────────────────────────────── */

  /* Sets the ticket field invalid or valid while focus stays in the form
     (validation on blur): the message is inserted, so its room opens. */
  function validate(stage, wrong, sg) {
    var field = $('#sg-lab-ticket', stage);
    var form = field.closest('form');
    // The ticket field is left (blur): focus moves on to the note.
    if (wrong || !form.contains(document.activeElement)) $('#sg-lab-ticket-note', stage).focus({ preventScroll: true });
    var hint = $('#sg-lab-ticket-error', stage);
    if (wrong) {
      field.value = '12a4';
      field.setAttribute('aria-invalid', 'true');
      if (!hint) {
        hint = document.createElement('small');
        hint.className = 'ds-field__hint ds-field__hint--error';
        hint.id = 'sg-lab-ticket-error';
        setHtml(hint, icon('alertCircle', 16) + 'A ticket number has five digits.');
        field.parentNode.appendChild(hint);
        field.setAttribute('aria-describedby', hint.id);
      }
    } else {
      field.value = '12345';
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      if (hint) hint.remove();
    }
    return quiet(form, sg);
  }

  function invalid(stage) { return $('#sg-lab-ticket', stage).getAttribute('aria-invalid') === 'true'; }

  LAB_DEMOS.push({
    id: 'validation',
    group: 'controls',
    title: 'Validation on blur',
    note: 'A message that appears while someone works in the form fades in while its room opens from 0 (on <code>--ds-ease-out</code>, a layout size); one that goes leaves at once. The field\'s border and label take the error colour without motion. Replay types a wrong number and moves on, as Tab would.',
    shows: ['ds-fade-in', '--ds-dur-base', '--ds-dur-fast', '--ds-ease-out', '--ds-ease-in-out'],
    html: '<form class="ds-form sg-validate" onsubmit="return false"><div class="ds-field"><label class="ds-field__label" for="sg-lab-ticket">Ticket number</label><input class="ds-input" id="sg-lab-ticket" inputmode="numeric" autocomplete="off" placeholder="12345"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-lab-ticket-note">Note</label><input class="ds-input" id="sg-lab-ticket-note" placeholder="Optional"></div></form>',
    height: 240,
    play: function (stage, sg) {
      $('#sg-lab-ticket', stage).focus({ preventScroll: true, focusVisible: true });
      if (invalid(stage)) validate(stage, false, sg);
      return wait(sg, 300).then(function () { return validate(stage, true, sg); });
    },
    state: invalid,
    toggle: function (stage, on, sg) { return validate(stage, on, sg); },
  });

  /* ── Controls: a live check, a changed field, the search key, radio tiles ── */

  /* The username's verdict: 'taken' (an error), 'free' (a confirmation) or
     '' (no hint). The hint element stays while the verdict changes, so a
     turn from error to success replays nothing; a new hint fades in while
     its room opens (focus is in the form). */
  function liveCheck(stage, verdict, sg) {
    var field = $('#sg-lab-user', stage);
    var form = field.closest('form');
    if (!form.contains(document.activeElement)) field.focus({ preventScroll: true });
    var hint = $('#sg-lab-user-hint', stage);
    field.value = verdict === 'taken' ? 'ada' : verdict === 'free' ? 'ada.byron' : '';
    if (verdict === 'taken') field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (!verdict) {
      field.removeAttribute('aria-describedby');
      if (hint) hint.remove();
      return quiet(form, sg);
    }
    if (!hint) {
      hint = document.createElement('small');
      hint.id = 'sg-lab-user-hint';
      field.parentNode.appendChild(hint);
      field.setAttribute('aria-describedby', hint.id);
    }
    hint.className = 'ds-field__hint ds-field__hint--' + (verdict === 'taken' ? 'error' : 'success');
    setHtml(hint, verdict === 'taken' ? icon('alertCircle', 16) + 'Already taken.' : icon('checkCircle', 16) + 'Available.');
    return quiet(form, sg);
  }

  function confirmed(stage) { return $('#sg-lab-user-hint', stage) !== null && $('#sg-lab-user-hint', stage).classList.contains('ds-field__hint--success'); }

  LAB_DEMOS.push({
    id: 'live-check',
    group: 'controls',
    title: 'Live check',
    note: 'A check while typing: the error turns into a confirmation (<code>.ds-field__hint--success</code>) in the same element, so only its text and icon change; a hint that appears fades in while its room opens, one that goes leaves at once. Speak a result at once with <code>DS.overlay.announce()</code>.',
    shows: ['.ds-field__hint--success', 'ds-fade-in', '--ds-dur-base', '--ds-dur-fast', '--ds-ease-out', '--ds-ease-in-out'],
    html: '<form class="ds-form" onsubmit="return false"><div class="ds-field"><label class="ds-field__label" for="sg-lab-user">Username</label><input class="ds-input" id="sg-lab-user" autocomplete="off" placeholder="ada.lovelace"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-lab-user-note">Note</label><input class="ds-input" id="sg-lab-user-note" placeholder="Optional"></div></form>',
    height: 240,
    play: function (stage, sg) {
      return liveCheck(stage, '', sg)
        .then(function () { return wait(sg, 200); })
        .then(function () { return liveCheck(stage, 'taken', sg); })
        .then(function () { return wait(sg, 400); })
        .then(function () { return liveCheck(stage, 'free', sg); });
    },
    state: confirmed,
    toggle: function (stage, on, sg) { return liveCheck(stage, on ? 'free' : '', sg); },
  });

  function changedTo(stage, on, sg) {
    var field = $('#sg-lab-changed', stage);
    field.classList.toggle('ds-field--changed', on);
    $('input', field).value = on ? 'C 1.01' : 'B 2.14';
    return quiet(stage, sg);
  }

  LAB_DEMOS.push({
    id: 'field-changed',
    group: 'controls',
    title: 'Changed field',
    note: 'The dot after the label of a <code>.ds-field--changed</code> fades in on <code>--ds-dur-fast</code> and out on <code>--ds-dur-instant</code> (an exit of 0.67); it always takes its room, so the label never shifts. The word "(changed)" joins the label\'s name only while it shows.',
    shows: ['.ds-field--changed', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-in-out', '--ds-ease-in'],
    html: '<form class="ds-form ds-form--rows" onsubmit="return false"><div class="ds-field" id="sg-lab-changed"><label class="ds-field__label" for="sg-lab-room">Room <span class="ds-field__changed ds-sr">(changed)</span></label><input class="ds-input" id="sg-lab-room" value="B 2.14"></div>' +
      '<div class="ds-field" role="group" aria-labelledby="sg-lab-serial"><span class="ds-field__label" id="sg-lab-serial">Serial number</span><span class="ds-field__value">5CD1234XYZ</span></div></form>',
    height: 200,
    play: function (stage, sg) { return changedTo(stage, !$('#sg-lab-changed', stage).classList.contains('ds-field--changed'), sg); },
    state: function (stage) { return $('#sg-lab-changed', stage).classList.contains('ds-field--changed'); },
    toggle: changedTo,
  });

  /* The search key goes once the field has a value (or the focus) and
     comes back when it rests empty. */
  function keyTo(stage, gone, sg) {
    $('#sg-lab-search', stage).value = gone ? 'laptop' : '';
    return quiet(stage, sg);
  }

  LAB_DEMOS.push({
    id: 'search-key',
    group: 'controls',
    title: 'Search key',
    note: 'The "/" key in an empty search goes once the field has a value or the focus (in <code>--ds-dur-instant</code>, then hidden) and comes back on <code>--ds-dur-fast</code> when it rests empty again. The field keeps room for it, so nothing moves.',
    shows: ['.ds-search__key', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-in-out'],
    html: '<div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="sg-lab-search" type="search" aria-label="Search devices" aria-keyshortcuts="/" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div>',
    height: 120,
    play: function (stage, sg) { return keyTo(stage, $('#sg-lab-search', stage).value === '', sg); },
    state: function (stage) { return $('#sg-lab-search', stage).value !== ''; },
    toggle: keyTo,
  });

  var KINDS = [['laptop', 'Laptop', 'With a dock.', 'laptop'], ['desktop', 'Desktop', 'At one desk.', 'monitor']];
  var tilePills = [];

  function tilesTo(stage, second, sg) {
    $$('.ds-radio input', stage)[second ? 1 : 0].checked = true;
    // Checking a radio changes no attribute: the page moves the pill.
    tilePills.forEach(function (pill) { pill.update(); });
    return quiet(stage, sg);
  }

  LAB_DEMOS.push({
    id: 'radio-tiles',
    group: 'controls',
    title: 'Radio tiles',
    note: 'The check of the chosen tile pops from <code>--ds-scale-small</code> on the spring while it fades in, and leaves faster, accelerating; the icon disc fills. With the indicator the tint is a pill that glides from tile to tile (<code>.ds-radios__indicator</code>); the ring changes at once. Pressed, a tile turns squarer like every radio card.',
    shows: ['.ds-radios--tiles', '.ds-radios__indicator', '--ds-scale-small', '--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-in'],
    html: '<div class="ds-radios ds-radios--tiles" role="radiogroup" aria-label="Device type">' + KINDS.map(function (kind, index) {
      return '<label class="ds-radio"><input type="radio" name="sg-lab-kind" value="' + kind[0] + '"' + (index === 0 ? ' checked' : '') + '><span class="ds-radio__icon" aria-hidden="true">' + icon(kind[3], 20) + '</span>' +
        '<span><strong>' + kind[1] + '</strong><small>' + kind[2] + '</small></span><span class="ds-radio__mark" aria-hidden="true">' + icon('check', 14) + '</span></label>';
    }).join('') + '</div>',
    height: 140,
    setup: function (stage, sg) {
      var group = $('.ds-radios', stage);
      var pill = sg.indicator(group, { active: '.ds-radio:has(input:checked)', className: 'ds-radios__indicator' });
      tilePills.push(pill);
      group.addEventListener('change', function () { pill.update(); });
    },
    play: function (stage, sg) { return tilesTo(stage, !$$('.ds-radio input', stage)[1].checked, sg); },
    state: function (stage) { return $$('.ds-radio input', stage)[1].checked; },
    toggle: tilesTo,
  });

  /* ── Navigation: the indicator on a track of buttons ─────────────── */

  var TRACK = ['Day', 'Week', 'Month', 'Quarter', 'Year', 'All time'];
  var TRACK_LONG = ['Today', 'This week', 'This month', 'This quarter', 'This year', 'All time'];
  var trackLast = 0;
  var trackTimer = 0;
  var trackLong = false;

  function trackButtons(stage) { return $$('#sg-track > button', stage); }

  function trackHtml(names) {
    return names.map(function (name, index) {
      return '<button class="ds-btn ds-btn--sm" type="button" aria-pressed="' + (index === trackLast) + '" tabindex="' + (index === trackLast ? 0 : -1) + '">' + name + '</button>';
    }).join('');
  }

  /* Moves the active item; the read-out names the distance between the
     two items' centres and the travel time it gives. */
  function pressTrack(stage, index) {
    clearTimeout(trackTimer);
    var clear = $('[data-sg="track-clear"]', stage.parentNode);
    if (clear) clear.setAttribute('aria-pressed', 'false');
    var buttons = trackButtons(stage);
    var from = buttons[trackLast];
    var to = buttons[index];
    if (from && to && from !== to) {
      var a = from.getBoundingClientRect();
      var b = to.getBoundingClientRect();
      var px = Math.abs(b.left + b.width / 2 - a.left - a.width / 2);
      setHtml($('#sg-track-move', stage.parentNode), 'Last move: <strong class="ds-num">' + Math.abs(index - trackLast) + '</strong> ' + (Math.abs(index - trackLast) === 1 ? 'item' : 'items') +
        ', <strong class="ds-num">' + Math.round(px) + 'px</strong> · <code>travelDuration</code> <strong class="ds-num">' + Math.round(M.travelDuration(to, px)) + 'ms</strong>');
    }
    buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === index)); });
    if (index >= 0) trackLast = index;
  }

  /* The pill places itself one frame after the change (its observer); then
     its edges run as transitions. */
  function trackSettled(stage, sg) {
    return sg.frames(2).then(function () { return M.settled($('#sg-track > .ds-indicator', stage), { transitions: true }); });
  }

  function trackDemo(stage, action, button, sg) {
    var count = trackButtons(stage).length;
    if (action === 'track-hop') pressTrack(stage, trackLast + 1 < count ? trackLast + 1 : trackLast - 1);
    if (action === 'track-jump') pressTrack(stage, trackLast < count / 2 ? count - 1 : 0);
    if (action === 'track-interrupt') {
      // The second target 80ms later (at the current speed), while the
      // first glide still runs: the pill turns from where it is.
      var far = trackLast < count / 2 ? count - 1 : 0;
      var middle = Math.floor(count / 2);
      pressTrack(stage, far);
      trackTimer = setTimeout(function () { pressTrack(stage, middle); }, sg.slow(80));
    }
    if (action === 'track-morph') {
      // A re-render of the whole track with other labels: the pill stays
      // (morphHtml keeps it) and glides to the new size of its item.
      trackLong = !trackLong;
      DS.dom.morphHtml($('#sg-track', stage), trackHtml(trackLong ? TRACK_LONG : TRACK));
    }
    if (action === 'track-clear') {
      if (button.getAttribute('aria-pressed') === 'true') {
        pressTrack(stage, trackLast);
      } else {
        pressTrack(stage, -1);
        button.setAttribute('aria-pressed', 'true');
      }
    }
  }

  LAB_DEMOS.push({
    id: 'track',
    group: 'navigation',
    title: 'Indicator',
    note: 'The pill stretches toward its target (the leading edge leads, the trailing edge follows), passes it by a hair and settles on the spring; a longer jump takes longer, up to a cap (travelDuration, in the read-out). It follows aria-pressed by itself: the buttons only change the attribute. A new target mid-glide continues from where the pill is, and a re-render of the track through <code>DS.dom.morphHtml</code> keeps the pill, which glides to its item\'s new size. The track is one tab stop (<code>DS.dom.roving()</code>): the arrow keys, Home and End move the focus and press the item.',
    shows: ['DS.indicator.createIndicator', 'DS.motion.travelDuration', 'DS.dom.morphHtml', 'DS.dom.roving', '--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-micro'],
    html: '<div class="sg-track" id="sg-track">' + trackHtml(TRACK) + '</div>',
    after: readoutHtml('sg-track-move', 'Press an item, or hop and jump.'),
    height: 120,
    wide: true,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-hop">Hop to the neighbour</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-jump">Jump across</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-interrupt">Interrupt (two targets 80ms apart)</button><button class="ds-btn ds-btn--sm ds-btn--text" type="button" data-sg="track-morph">Re-render (morphHtml)</button><button class="ds-btn ds-btn--sm ds-btn--quiet" type="button" data-sg="track-clear" aria-pressed="false">No active item</button></div>',
    setup: function (stage, sg) {
      var track = $('#sg-track', stage);
      sg.indicator(track, { active: '[aria-pressed="true"]', className: 'sg-track__indicator' });
      DS.dom.roving(track, { items: 'button' });
      track.addEventListener('click', function (event) {
        var button = event.target.closest('button');
        if (button) pressTrack(stage, trackButtons(stage).indexOf(button));
      });
      stage.parentNode.addEventListener('click', function (event) {
        var button = event.target.closest('[data-sg^="track-"]');
        if (button) trackDemo(stage, button.getAttribute('data-sg'), button, sg);
      });
    },
    play: function (stage, sg) {
      trackDemo(stage, 'track-jump', null, sg);
      return trackSettled(stage, sg);
    },
    state: function () { return trackLast === TRACK.length - 1; },
    toggle: function (stage, on, sg) {
      pressTrack(stage, on ? TRACK.length - 1 : 0);
      return trackSettled(stage, sg);
    },
  });

  /* ── Navigation: the drawer with a view ──────────────────────────── */

  function drawerHidden() { return $('#sg-app').hasAttribute('data-drawer-hidden'); }

  /* The one recipe of docs/components.md for both paths: inside
     DS.motion.transition(), set or remove data-drawer-hidden, and enter()
     the drawer when it comes back. With View Transitions the panel morphs
     to its new width while the drawer leaves or returns; without them the
     drawer slides in by enter() and the view fades through. */
  function drawerTo(hide) {
    var app = $('#sg-app');
    var drawer = $('#sg-drawer');
    if (hide && app.hasAttribute('data-drawer-open')) DS.overlay.close(drawer);
    return M.transition(function () {
      if (hide) {
        app.setAttribute('data-drawer-hidden', '');
        return undefined;
      }
      app.removeAttribute('data-drawer-hidden');
      M.enter(drawer);
      return undefined;
    });
  }

  LAB_DEMOS.push({
    id: 'drawer',
    group: 'navigation',
    title: 'A view without the drawer',
    note: 'This page\'s own drawer leaves for a view that has none and comes back with the next one: the panel takes the width on the spring while the drawer slides out, accelerating, and back in (<code>DS.motion.transition()</code> with data-drawer-hidden; without View Transitions the drawer slides in with enter() and the view fades through). Replay hides it and brings it back; Rapid toggle may leave it hidden: toggle once more.',
    shows: ['DS.motion.transition', 'DS.motion.enter', 'ds-shift-in', 'ds-shift-out', '--ds-dur-long', '--ds-dur-slow', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit'],
    html: '<p class="ds-muted sg-drawer-state" id="sg-drawer-state">The drawer is on the left of this page.</p>',
    height: 120,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-drawer-toggle>Hide or show the drawer</button></div>',
    setup: function (stage) {
      $('[data-drawer-toggle]', stage.parentNode).addEventListener('click', function () { drawerTo(!drawerHidden()); });
      new MutationObserver(function () {
        $('#sg-drawer-state', stage).textContent = drawerHidden() ? 'This view has no drawer: the panel takes the width.' : 'The drawer is on the left of this page.';
      }).observe($('#sg-app'), { attributes: true, attributeFilter: ['data-drawer-hidden'] });
    },
    play: function (stage, sg) {
      return drawerTo(true).then(function () { return wait(sg, 300); }).then(function () { return drawerTo(false); }).then(function () { return quiet($('#sg-drawer'), sg); });
    },
    state: drawerHidden,
    toggle: function (stage, on, sg) {
      return drawerTo(on).then(function () { return quiet($('#sg-drawer'), sg); });
    },
  });

  /* ── Navigation: the segmented switch ────────────────────────────── */

  var MODES = ['Live', 'Admin', 'Reports'];

  function segmentTo(stage, index, sg) {
    $$('.ds-segmented__option', stage).forEach(function (option, at) {
      if (at === index) option.setAttribute('aria-current', 'true');
      else option.removeAttribute('aria-current');
    });
    return sg.frames(2).then(function () { return quiet(stage, sg); });
  }

  function segmentAt(stage) {
    return $$('.ds-segmented__option', stage).map(function (option) { return option.getAttribute('aria-current') === 'true'; }).indexOf(true);
  }

  LAB_DEMOS.push({
    id: 'segmented',
    group: 'navigation',
    title: 'Segmented switch',
    note: 'The tint glides between the options on the spring (<code>DS.indicator</code>) and the labels change colour while it arrives; the current option is also set in the label weight, and data-label keeps the width of the heavier weight, so the switch never changes width.',
    shows: ['DS.indicator.createIndicator', '--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-in-out'],
    html: '<nav class="ds-segmented sg-lab-segmented" aria-label="Mode">' + MODES.map(function (mode, index) {
      return '<a class="ds-segmented__option" href="#navigation" data-label="' + mode + '"' + (index ? '' : ' aria-current="true"') + '>' + mode + '</a>';
    }).join('') + '</nav>',
    height: 120,
    setup: function (stage, sg) {
      var nav = $('.ds-segmented', stage);
      sg.indicator(nav, { active: '[aria-current="true"]', className: 'ds-segmented__indicator' });
      nav.addEventListener('click', function (event) {
        var option = event.target.closest('a');
        if (!option) return;
        event.preventDefault();
        segmentTo(stage, $$('.ds-segmented__option', stage).indexOf(option), sg);
      });
    },
    play: function (stage, sg) { return segmentTo(stage, (segmentAt(stage) + 1) % MODES.length, sg); },
    state: function (stage) { return segmentAt(stage) === MODES.length - 1; },
    toggle: function (stage, on, sg) { return segmentTo(stage, on ? MODES.length - 1 : 0, sg); },
  });

  /* ── Frames: a small app ─────────────────────────────────────────── */

  var FRAME_ITEMS = [['overview', 'Overview'], ['laptop', 'Devices'], ['ticket', 'Tickets'], ['users', 'Owners']];

  function frameCards(count) {
    var names = ['LAPTOP-0042', 'TABLET-0121', 'PRINTER-0003', 'DESKTOP-0107', 'LAPTOP-0017', 'TABLET-0207'];
    var out = '';
    for (var i = 0; i < count; i += 1) {
      out += '<section class="ds-card"><h2 class="ds-card__title">' + names[i % names.length] + '</h2><p class="ds-muted">Synced today, issued to ' + ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'][i % 3] + '.</p></section>';
    }
    return out;
  }

  /* The app frame: top bar, the drawer (modal at this width) and a view. */
  function appFrameHtml(withDrawer, page) {
    return '<div class="ds-app' + (withDrawer ? ' ds-app--drawer' : '') + '" id="app"><a class="ds-skip" href="#view">Skip to content</a>' +
      '<div class="ds-topbar">' + (withDrawer ? '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="drawer" id="menu">' + icon('menu', 20) + '</button>' : '') +
      '<a class="ds-brand" href="#view"><span class="ds-brand__name">Inventory</span></a></div>' +
      (withDrawer ? '<div class="ds-scrim"></div><nav class="ds-drawer" id="drawer" aria-label="Main" tabindex="-1"><div class="ds-drawer__head" aria-hidden="true"><span class="ds-brand__name">Inventory</span></div>' +
        '<div class="ds-drawer__list" id="drawer-list"><div class="ds-drawer__group"><p class="ds-drawer__heading">Inventory</p>' + FRAME_ITEMS.map(function (item, index) {
          return '<a class="ds-drawer__item" href="#view"' + (index ? '' : ' aria-current="page"') + '>' + icon(item[0], 20) + '<span class="ds-drawer__label">' + item[1] + '</span></a>';
        }).join('') + '</div></div></nav>' : '') +
      '<div class="ds-panel"><main class="ds-view" id="view" tabindex="-1"><div class="ds-content"><div class="ds-page" id="page">' + page + '</div></div></main></div></div>';
  }

  function pageHead(title, lead) {
    return '<header class="ds-page-head"><h1 class="ds-page-head__title">' + title + '</h1>' + (lead ? '<p class="ds-page-head__lead">' + lead + '</p>' : '') + '</header>';
  }

  function frameHtml(cls, title) {
    return '<iframe class="sg-frame' + (cls ? ' ' + cls : '') + '" title="' + title + '"></iframe>';
  }

  /* ── Navigation: the top bar's tint on scroll ────────────────────── */

  var topbar = { win: null, ready: null };

  function topbarScroll(on, sg) {
    return topbar.ready.then(function (win) {
      var view = win.document.getElementById('view');
      var target = on ? Math.min(160, view.scrollHeight - view.clientHeight) : 0;
      view.scrollTo({ top: target, behavior: 'smooth' });
      return until(sg, function () { return Math.abs(view.scrollTop - target) < 1; }, 3000).then(function () { return quiet(win.document.documentElement, sg); });
    });
  }

  LAB_DEMOS.push({
    id: 'topbar',
    group: 'navigation',
    title: 'Top bar on scroll',
    note: 'Scrolled, the top bar tints to a surface container colour and its hairline shows, over the first pixels of scroll (<code>ds-scroll-fade</code> on the view\'s scroll timeline; without scroll timelines data-scrolled from <code>DS.dom.watchScrolled()</code> and a transition). The lab\'s own top bar does the same: scroll this page back to the top and watch it. Replay scrolls the small app down and back.',
    shows: ['ds-scroll-fade', 'DS.motion.resyncScroll', 'DS.dom.watchScrolled', '--ds-dur-fast', '--ds-ease-in-out'],
    html: frameHtml('sg-frame--phone', 'A small app: the top bar on scroll'),
    height: 360,
    setup: function (stage) {
      topbar.ready = openFrame(stage, appFrameHtml(false, pageHead('Devices', 'Scroll this view: the top bar tints.') + frameCards(6))).then(function (win) {
        win.DS.dom.watchScrolled(win.document.getElementById('view'), win.document.getElementById('app'));
        return win;
      });
    },
    play: function (stage, sg) {
      return topbarScroll(true, sg).then(function () { return wait(sg, 400); }).then(function () { return topbarScroll(false, sg); });
    },
    state: function (stage) {
      var frame = $('iframe', stage);
      var view = frame.contentDocument && frame.contentDocument.getElementById('view');
      return !!view && view.scrollTop > 0;
    },
    toggle: function (stage, on, sg) { return topbarScroll(on, sg); },
  });

  /* ── Overlays ────────────────────────────────────────────────────── */

  /* The lab's overlays live at the end of <body> (inside the .ds-theme,
     where DS.overlay wants them), built once. */
  function addToBody(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    var element = template.content.firstElementChild;
    document.body.appendChild(element);
    return element;
  }

  function dialogHtml(id, native, title, text, action, extra) {
    var labels = ' aria-labelledby="' + id + '-title" aria-describedby="' + id + '-text"';
    var box = '<h2 class="ds-dialog__title" id="' + id + '-title">' + title + '</h2><p class="ds-dialog__text" id="' + id + '-text">' + text + '</p>' +
      '<div class="ds-dialog__actions">' + (extra || '') + '<button class="ds-btn ds-btn--text" type="button" data-close autofocus>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>' + action + '</button></div>';
    return native
      ? '<dialog class="ds-dialog" id="' + id + '" role="alertdialog"' + labels + '><div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box">' + box + '</div></dialog>'
      : '<div class="ds-dialog" id="' + id + '" hidden><div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box" role="alertdialog" aria-modal="true"' + labels + '>' + box + '</div></div>';
  }

  function sheetHtml(id, native) {
    var tag = native ? 'dialog' : 'div';
    return '<' + tag + ' class="ds-sheet" id="' + id + '"' + (native ? ' aria-labelledby="' + id + '-title"' : ' role="dialog" aria-modal="true" aria-labelledby="' + id + '-title" hidden') + '>' +
      '<div class="ds-sheet__backdrop" data-close></div><section class="ds-sheet__panel">' +
      '<div class="ds-sheet__head"><h2 class="ds-sheet__title" id="' + id + '-title">LAPTOP-0042</h2><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>' + icon('close', 20) + '</button></div>' +
      '<div class="ds-sheet__body" tabindex="0"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div><div><dt>Location</dt><dd>Building A, 1st floor</dd></div><div><dt>Model</dt><dd>Latitude 7440</dd></div></dl>' +
      '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="button" data-close>Save</button><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div></div></section></' + tag + '>';
  }

  function isOpen(el) { return el.getAttribute('data-state') === 'open'; }

  /* Opens, or closes and waits until DS.overlay has hidden it again. */
  function layer(el, on, opener) {
    return on ? DS.overlay.open(el, { opener: opener }) : DS.overlay.close(el);
  }

  /*
   * One overlay demo: a stage with the opener and the layers read-out;
   * Replay opens the layer, opens the nested one from it (dialogs), then
   * closes both; Rapid toggle and Reverse at 50% open and close it.
   */
  function overlayDemo(options) {
    var made = {};
    LAB_DEMOS.push({
      id: options.id,
      group: 'overlays',
      title: options.title,
      note: options.note,
      shows: options.shows,
      html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-overlay-open>' + options.button + '</button></div>',
      after: layersHtml(),
      height: 120,
      setup: function (stage) {
        made.el = addToBody(options.markup);
        made.nested = options.nested ? addToBody(options.nested) : null;
        var opener = $('[data-overlay-open]', stage);
        opener.addEventListener('click', function () { layer(made.el, true, opener); });
        if (made.nested) $('[data-nested]', made.el).addEventListener('click', function (event) { layer(made.nested, true, event.currentTarget); });
        watchLayers($('[data-lab-layers]', stage.parentNode), document);
      },
      subject: function () { return made.el; },
      play: function (stage, sg) {
        var opener = $('[data-overlay-open]', stage);
        var steps = layer(made.el, true, opener).then(function () { return wait(sg, 300); });
        if (made.nested) {
          steps = steps.then(function () { return layer(made.nested, true, $('[data-nested]', made.el)); })
            .then(function () { return wait(sg, 300); })
            .then(function () { return layer(made.nested, false); });
        }
        return steps.then(function () { return layer(made.el, false); }).then(function () { return quiet(made.el, sg); });
      },
      state: function () { return isOpen(made.el); },
      toggle: function (stage, on) { return layer(made.el, on, $('[data-overlay-open]', stage)); },
    });
  }

  var NESTED = '<button class="ds-btn ds-btn--text" type="button" data-nested>Open a nested dialog</button>';
  var DIALOG_SHOWS = ['DS.overlay.open', 'DS.overlay.close', 'DS.overlay.lockScroll', 'DS.overlay.unlockScroll', 'DS.motion.originFrom', '--ds-dur-slow', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit', '--ds-ease-in-out', '--ds-scale-enter', '--ds-distance-sm'];

  overlayDemo({
    id: 'dialog',
    title: 'Dialog (native)',
    note: 'A <code>&lt;dialog&gt;</code> through <code>DS.overlay.open()</code>: the scrim fades while the box fades, grows from <code>--ds-scale-enter</code> and rises on the spring, from an origin towards its opener; it leaves the same way back in <code>--ds-dur-base</code>, accelerating, with focus back on the opener at once. A nested dialog takes the lighter scrim. The read-out counts the open layers (the Escape stack) and the scroll lock.',
    shows: DIALOG_SHOWS,
    button: 'Open dialog',
    markup: dialogHtml('sg-lab-dialog', true, 'Delete 3 devices?', 'They disappear from every list. This cannot be undone.', 'Delete devices', NESTED),
    nested: dialogHtml('sg-lab-dialog-nested', true, 'Keep their history?', 'The history of the three devices can stay in the archive for a year.', 'Keep history'),
  });

  overlayDemo({
    id: 'dialog-div',
    title: 'Dialog (div markup)',
    note: 'The same dialog in the div markup: <code>DS.overlay</code> makes the page inert itself (the siblings up to <code>&lt;body&gt;</code>), so the motion, Escape, the focus and the lock behave as with the native one.',
    shows: DIALOG_SHOWS,
    button: 'Open dialog',
    markup: dialogHtml('sg-lab-dialog-div', false, 'Archive 3 devices?', 'They leave the active lists and stay in the archive for a year.', 'Archive devices', NESTED),
    nested: dialogHtml('sg-lab-dialog-div-nested', false, 'Notify their owners?', 'Ada Lovelace and Grace Hopper get an email about it.', 'Notify'),
  });

  var SHEET_SHOWS = ['DS.overlay.open', 'DS.overlay.close', '--ds-dur-long', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit', '--ds-distance-sheet'];

  overlayDemo({
    id: 'sheet',
    title: 'Side sheet (native)',
    note: 'An opaque panel slides its full width in from the edge on the spring (<code>--ds-dur-long</code>) while the scrim fades, and goes back in <code>--ds-dur-base</code>, accelerating, without a fade. A strip past its outer edge covers the overshoot; at 600px and below it rises from the bottom.',
    shows: SHEET_SHOWS,
    button: 'Open side sheet',
    markup: sheetHtml('sg-lab-sheet', true),
  });

  overlayDemo({
    id: 'sheet-div',
    title: 'Side sheet (div markup)',
    note: 'The same side sheet in the div markup.',
    shows: SHEET_SHOWS,
    button: 'Open side sheet',
    markup: sheetHtml('sg-lab-sheet-div', false),
  });

  /* ── Overlays: the modal drawer (in a phone-sized frame) ─────────── */

  var modalDrawer = { ready: null };

  function modalDrawerTo(on) {
    return modalDrawer.ready.then(function (win) {
      var doc = win.document;
      return on ? win.DS.overlay.open(doc.getElementById('drawer'), { opener: doc.getElementById('menu') }) : win.DS.overlay.close(doc.getElementById('drawer'));
    });
  }

  LAB_DEMOS.push({
    id: 'modal-drawer',
    group: 'overlays',
    title: 'Modal drawer',
    note: 'Below 900px the drawer is modal: it slides its full width in on the spring over <code>--ds-dur-long</code> while the scrim fades, and leaves in <code>--ds-dur-base</code>, accelerating. Check the edge at phone width: the drawer\'s background runs past the screen edge, so the spring never shows a gap. Escape, the scrim and focus go through <code>DS.overlay</code>; the read-out is the frame\'s.',
    shows: ['DS.overlay.open', 'DS.overlay.close', 'DS.indicator.createIndicator', '--ds-dur-long', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-exit', '--ds-distance-sheet'],
    html: frameHtml('sg-frame--phone', 'A small app: the modal drawer'),
    after: layersHtml(),
    height: 360,
    setup: function (stage) {
      modalDrawer.ready = openFrame(stage, appFrameHtml(true, pageHead('Overview', 'Open the menu.') + frameCards(2))).then(function (win) {
        var doc = win.document;
        win.DS.ripple.attach(doc);
        win.DS.indicator.createIndicator(doc.getElementById('drawer-list'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator' });
        doc.getElementById('menu').addEventListener('click', function () {
          if (doc.getElementById('app').hasAttribute('data-drawer-open')) win.DS.overlay.close(doc.getElementById('drawer'));
          else win.DS.overlay.open(doc.getElementById('drawer'), { opener: doc.getElementById('menu') });
        });
        doc.getElementById('drawer-list').addEventListener('click', function (event) {
          var item = event.target.closest('a');
          if (!item) return;
          event.preventDefault();
          $$('.ds-drawer__item', doc).forEach(function (each) { if (each === item) each.setAttribute('aria-current', 'page'); else each.removeAttribute('aria-current'); });
          win.DS.overlay.close(doc.getElementById('drawer'));
        });
        watchLayers($('[data-lab-layers]', stage.parentNode), doc);
        return win;
      });
    },
    subject: function (stage) {
      var frame = $('iframe', stage);
      return frame.contentDocument ? frame.contentDocument.getElementById('drawer') : null;
    },
    play: function (stage, sg) {
      return modalDrawerTo(true).then(function () { return wait(sg, 400); }).then(function () { return modalDrawerTo(false); });
    },
    state: function (stage) {
      var frame = $('iframe', stage);
      var app = frame.contentDocument && frame.contentDocument.getElementById('app');
      return !!app && app.hasAttribute('data-drawer-open');
    },
    toggle: function (stage, on) { return modalDrawerTo(on); },
  });

  /* ── Overlays: a menu and a combobox near the bottom edge ────────── */

  /* Scrolls the lab so `trigger` sits at the bottom of the view: there is
     no room below it, so the popup opens above (data-placement="top"). */
  function toBottom(trigger) {
    var view = $('#main');
    var rect = trigger.getBoundingClientRect();
    var bottom = Math.min(view.getBoundingClientRect().bottom, window.innerHeight);
    view.scrollTop += rect.bottom - (bottom - 24);
  }

  function placementText(popup) {
    return 'Opened ' + (popup.getAttribute('data-placement') === 'top' ? 'above its trigger: no room below' : 'below its trigger') + (popup.hasAttribute('data-anchored') ? ' (anchor positioning)' : ' (placed by script)') + '.';
  }

  LAB_DEMOS.push({
    id: 'menu',
    group: 'overlays',
    title: 'Menu near the bottom edge',
    note: 'A <code>.ds-menu</code> grows out of its trigger: its clip opens from the trigger\'s edge and it grows from <code>--ds-scale-popup</code> at an origin on the trigger, on the spring over <code>--ds-dur-medium</code>, and leaves with a fade in <code>--ds-dur-instant</code>. Replay first scrolls the trigger to the bottom of the view, so the menu flips above it.',
    shows: ['DS.overlay.open', 'DS.overlay.close', 'DS.motion.originFrom', '--ds-clip-from', '--ds-motion-origin', '--ds-scale-popup', '--ds-dur-medium', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-spatial'],
    html: '<div class="sg-popup-stage"><button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-menu" data-menu-trigger>' + icon('moreVertical', 16) + 'Actions</button>' +
      '<div class="ds-menu" role="menu" id="sg-lab-menu" aria-label="Actions" hidden>' +
      '<button class="ds-menu__item" role="menuitem" type="button">' + icon('pencil', 20) + '<span class="ds-menu__label">Edit</span></button>' +
      '<button class="ds-menu__item" role="menuitem" type="button">' + icon('copy', 20) + '<span class="ds-menu__label">Duplicate</span></button>' +
      '<div class="ds-menu__divider" role="separator"></div>' +
      '<button class="ds-menu__item" role="menuitem" type="button">' + icon('archive', 20) + '<span class="ds-menu__label">Archive</span></button></div></div>',
    after: readoutHtml('sg-menu-placement') + layersHtml(),
    height: 200,
    setup: function (stage) {
      var trigger = $('[data-menu-trigger]', stage);
      var menu = $('#sg-lab-menu', stage);
      trigger.addEventListener('click', function () { layer(menu, !isOpen(menu), trigger); });
      new MutationObserver(function () { if (isOpen(menu)) setHtml($('#sg-menu-placement', stage.parentNode), placementText(menu)); })
        .observe(menu, { attributes: true, attributeFilter: ['data-state', 'data-placement'] });
      watchLayers($('[data-lab-layers]', stage.parentNode), document);
    },
    subject: function (stage) { return $('#sg-lab-menu', stage); },
    play: function (stage, sg) {
      var trigger = $('[data-menu-trigger]', stage);
      var menu = $('#sg-lab-menu', stage);
      toBottom(trigger);
      return layer(menu, true, trigger).then(function () { return wait(sg, 400); }).then(function () { return layer(menu, false); }).then(function () { return quiet(menu, sg); });
    },
    state: function (stage) { return isOpen($('#sg-lab-menu', stage)); },
    toggle: function (stage, on) {
      var trigger = $('[data-menu-trigger]', stage);
      if (on) toBottom(trigger);
      return layer($('#sg-lab-menu', stage), on, trigger);
    },
  });

  var MODEL_NAMES = ['Latitude 5430', 'Latitude 7440', 'Precision 3581', 'OptiPlex 7010', 'Surface Laptop 5'];

  function comboParts(stage) {
    return { input: $('#sg-lab-combo', stage), popup: $('.ds-combo__popup', stage) };
  }

  function comboTo(stage, on) {
    var parts = comboParts(stage);
    if (on) {
      toBottom(parts.input);
      parts.input.focus({ preventScroll: true });
      return isOpen(parts.popup) ? Promise.resolve() : DS.overlay.open(parts.popup, { opener: parts.input });
    }
    return isOpen(parts.popup) || parts.popup.hasAttribute('data-state') ? DS.overlay.close(parts.popup) : Promise.resolve();
  }

  LAB_DEMOS.push({
    id: 'combobox',
    group: 'overlays',
    title: 'Combobox near the bottom edge',
    note: 'The list of a combobox grows out of its field like a menu and turns the chevron with it; with no room below, it opens above. Focus stays in the field. Replay scrolls the field to the bottom of the view first.',
    shows: ['DS.overlay.open', 'DS.overlay.close', 'DS.motion.originFrom', '--ds-scale-popup', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial'],
    html: '<div class="sg-popup-stage"><div class="ds-field sg-combo-field"><label class="ds-field__label" for="sg-lab-combo">Model</label>' +
      '<div class="ds-combo"><input class="ds-input ds-combo__input" id="sg-lab-combo" role="combobox" aria-expanded="false" aria-controls="sg-lab-combo-list" aria-autocomplete="list" autocomplete="off">' +
      '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + icon('chevronDown', 20) + '</button>' +
      '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="sg-lab-combo-list" role="listbox">' + MODEL_NAMES.map(function (name, index) {
        return '<li class="ds-combo__option" id="sg-lab-combo-' + index + '" role="option" aria-selected="false"><span class="ds-combo__name">' + name + '</span></li>';
      }).join('') + '</ul><p class="ds-combo__status" role="status">' + MODEL_NAMES.length + ' models</p></div></div></div></div>',
    after: readoutHtml('sg-combo-placement') + layersHtml(),
    height: 360,
    setup: function (stage) {
      var parts = comboParts(stage);
      $('.ds-combo__toggle', stage).addEventListener('mousedown', function (event) { event.preventDefault(); });
      parts.popup.addEventListener('mousedown', function (event) { event.preventDefault(); });
      $('.ds-combo__toggle', stage).addEventListener('click', function () { comboTo(stage, !isOpen(parts.popup)); });
      parts.input.addEventListener('blur', function () { if (isOpen(parts.popup)) DS.overlay.close(parts.popup); });
      $('.ds-combo__list', stage).addEventListener('click', function (event) {
        var option = event.target.closest('.ds-combo__option');
        if (!option) return;
        parts.input.value = option.textContent;
        DS.overlay.close(parts.popup);
      });
      new MutationObserver(function () { if (isOpen(parts.popup)) setHtml($('#sg-combo-placement', stage.parentNode), placementText(parts.popup)); })
        .observe(parts.popup, { attributes: true, attributeFilter: ['data-state', 'data-placement'] });
      watchLayers($('[data-lab-layers]', stage.parentNode), document);
    },
    subject: function (stage) { return comboParts(stage).popup; },
    play: function (stage, sg) {
      return comboTo(stage, true).then(function () { return wait(sg, 400); }).then(function () { return comboTo(stage, false); }).then(function () { return quiet(stage, sg); });
    },
    state: function (stage) { return isOpen(comboParts(stage).popup); },
    toggle: comboTo,
  });

  /* ── Overlays: tooltips along a toolbar ──────────────────────────── */

  var TIPS = [['sync', 'Sync now'], ['download', 'Download report'], ['history', 'Show history'], ['lock', 'Lock device'], ['settings', 'Device settings']];

  function tooltip() { return $('body > .ds-tooltip[role="tooltip"]') || $('.ds-tooltip[role="tooltip"]'); }

  /* The pointer arrives on `button` from `from` (or from outside). */
  function hover(button, from) {
    var rect = button.getBoundingClientRect();
    if (from) pointer(from, 'pointerout', rect.left + 4, rect.top + 4, button);
    pointer(button, 'pointerover', rect.left + rect.width / 2, rect.top + rect.height / 2, from || null);
  }

  function unhover(button) {
    var rect = button.getBoundingClientRect();
    pointer(button, 'pointerout', rect.left - 20, rect.top - 20, null);
  }

  LAB_DEMOS.push({
    id: 'tooltips',
    group: 'overlays',
    title: 'Tooltips along a toolbar',
    note: 'A pointer that rests on a button shows its tooltip after <code>--ds-delay-tooltip</code>; moving on along the toolbar within <code>--ds-delay-tooltip-skip</code> shows the next one at once, swapped in place (the warm-up). It fades and grows from <code>--ds-scale-tooltip</code> at its anchor, stays while the pointer crosses onto it (<code>--ds-delay-tooltip-hide</code>) and goes on Escape. Replay moves a pointer along the row.',
    shows: ['DS.overlay.tooltips', '--ds-delay-tooltip', '--ds-delay-tooltip-skip', '--ds-delay-tooltip-hide', '--ds-scale-tooltip', '--ds-dur-fast', '--ds-dur-instant'],
    html: '<div class="sg-row" role="toolbar" aria-label="Device actions">' + TIPS.map(function (tip) {
      return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="' + tip[1] + '" data-tip="' + tip[1] + '">' + icon(tip[0], 20) + '</button>';
    }).join('') + '</div>',
    height: 140,
    subject: function () { return tooltip(); },
    play: function (stage, sg) {
      var buttons = $$('[data-tip]', stage);
      hover(buttons[0]);
      var step = until(sg, function () { var tip = tooltip(); return !!tip && tip.getAttribute('data-state') === 'open'; }, 3000).then(function () { return wait(sg, 400); });
      buttons.slice(1).forEach(function (button, index) {
        step = step.then(function () { hover(button, buttons[index]); return wait(sg, 250); });
      });
      return step.then(function () { unhover(buttons[buttons.length - 1]); })
        .then(function () { return until(sg, function () { var tip = tooltip(); return !tip || tip.hidden; }, 3000); })
        .then(function () { return quiet(tooltip(), sg); });
    },
    state: function () { var tip = tooltip(); return !!tip && tip.getAttribute('data-state') === 'open'; },
    toggle: function (stage, on, sg) {
      var button = $('[data-tip]', stage);
      if (on) hover(button);
      else unhover(button);
      return wait(sg, on ? 600 : 150).then(function () { return quiet(tooltip(), sg); });
    },
  });

  /* ── Overlays: the snackbar stack ────────────────────────────────── */

  var SPAM = ['Synced LAPTOP-0042.', 'Imported 12 devices.', 'TABLET-0121 is back online.', 'Exported the list as CSV.', 'Restarted PRINTER-0003.'];
  var snack = { shown: [], latest: null };

  function toastRegion() {
    var region = $('#sg-toasts');
    // Aligned with the content panel (the drawer is beside it).
    if (region.parentNode === document.body) region.style.setProperty('--ds-toast-left', Math.round($('.ds-panel').getBoundingClientRect().left + 24) + 'px');
    return region;
  }

  function snackbar(text, options) {
    var handle = DS.overlay.toast(toastRegion(), text, options || {});
    snack.shown.push(handle);
    handle.closed.then(function () {
      var at = snack.shown.indexOf(handle);
      if (at !== -1) snack.shown.splice(at, 1);
      showSnack();
    });
    showSnack();
    return handle;
  }

  /* On screen, and waiting in the queue (built, not yet in the region). */
  function showSnack() {
    var out = $('#sg-snack-count');
    if (!out) return;
    var region = $('#sg-toasts');
    var onScreen = $$('.ds-toast', region).filter(function (el) { return !el.hasAttribute('data-ds-leaving'); }).length;
    var waiting = snack.shown.filter(function (handle) { return !handle.el || !region.contains(handle.el); }).length;
    setHtml(out, 'On screen: <strong class="ds-num">' + onScreen + '</strong> · waiting in the queue: <strong class="ds-num">' + waiting + '</strong>');
  }

  LAB_DEMOS.push({
    id: 'snackbars',
    group: 'overlays',
    title: 'Snackbar stack',
    note: 'At most three snackbars show; the others glide (FLIP) while one enters or leaves. A fourth replaces the oldest one that would close by itself; behind three that stay (errors, persistent ones), it waits in the queue. Timers pause while the pointer is over a message or focus is in it. "Spam" sends five in one second; "Persistent" sends three that stay and a fourth that waits until you close one. Replay closes what is left first; Rapid toggle sends one message that stays and takes it back.',
    shows: ['DS.overlay.toast', 'DS.motion.flip', 'ds-fade-in', 'ds-lift-in', 'ds-fade-out', '--ds-dur-medium', '--ds-dur-fast', '--ds-dur-slow', '--ds-ease-spatial'],
    html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-snack="spam">Spam snackbars</button><button class="ds-btn" type="button" data-snack="persistent">Persistent</button><button class="ds-btn ds-btn--text" type="button" data-snack="clear">Close all</button></div>',
    after: readoutHtml('sg-snack-count'),
    height: 120,
    setup: function (stage, sg) {
      stage.addEventListener('click', function (event) {
        var button = event.target.closest('[data-snack]');
        if (!button) return;
        var kind = button.getAttribute('data-snack');
        if (kind === 'spam') snackSpam(sg);
        if (kind === 'persistent') {
          ['Firmware update waiting for LAPTOP-0042.', 'TABLET-0207 has not synced for a week.', 'The certificate expires in 5 days.'].forEach(function (text) { snackbar(text, { kind: 'info', persistent: true }); });
          snackbar('Synced 3 devices.', { kind: 'success' });
        }
        if (kind === 'clear') clearSnacks();
      });
      showSnack();
    },
    subject: function () { return $('#sg-toasts'); },
    reset: function () { return clearSnacks(); },
    play: function (stage, sg) { return snackSpam(sg); },
    state: function () { return !!snack.latest && snack.shown.indexOf(snack.latest) !== -1; },
    // The toggled message stays until it is toggled off: only the toggle
    // takes it away, never its own timer half-way through a Rapid toggle.
    toggle: function (stage, on, sg) {
      if (on) snack.latest = snackbar('Saved LAPTOP-0042.', { kind: 'success', persistent: true });
      else if (snack.latest) snack.latest.close();
      return wait(sg, 50)
        .then(function () { return quiet($('#sg-toasts'), sg); })
        .then(function () { return until(sg, function () { return !$('#sg-toasts [data-ds-leaving]'); }); });
    },
  });

  /* Closes every message of the demo (on screen or waiting); resolves once all are gone. */
  function clearSnacks() {
    return Promise.all(snack.shown.slice().map(function (handle) {
      handle.close();
      return handle.closed;
    }));
  }

  /* Five snackbars in one second (at the current speed). */
  function snackSpam(sg) {
    var step = Promise.resolve();
    SPAM.forEach(function (text, index) {
      step = step.then(function () {
        snackbar(text, { kind: index % 2 ? 'info' : 'success' });
        return wait(sg, 200);
      });
    });
    return step.then(function () { return quiet($('#sg-toasts'), sg); });
  }

  /* ── Feedback: loaders ───────────────────────────────────────────── */

  var LOADERS = '<div class="sg-loaders-demo"><div class="ds-boot sg-lab-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting the console ...</div>' +
    '<div class="ds-stack"><div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading more devices ...</div>' +
    '<p class="sg-row"><span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Importing</span></span><span class="ds-spinner" aria-hidden="true"></span><span class="ds-loader ds-loader--contained" aria-hidden="true"></span></p></div></div>';

  LAB_DEMOS.push({
    id: 'loaders',
    group: 'feedback',
    title: 'Loaders',
    note: 'The shape loader (<code>.ds-loader</code>) is the block loader of <code>.ds-boot</code> and <code>.ds-loading</code>: it morphs through the seven Material shapes, each step landing on the spring, while it turns. Inline spots keep the arc spinner, which grows and shrinks while it turns. Replay inserts them again: the shape loaders fade in only after their delay (<code>--ds-delay-boot</code> for the app start, <code>--ds-delay-loader</code> for the rest). The arc spinner has no delay of its own: here it shows a running state at once, and a page that shows one for a wait delays it (<code>.ds-loading</code>, a <code>.ds-enter.ds-enter--delayed</code> wrapper or <code>DS.motion.enter(spinner, \'delayed\')</code>). The loops always run at their token speed.',
    shows: ['ds-loader-morph', 'ds-loader-turn', 'ds-spinner-arc', 'ds-spin', 'ds-fade-in', '--ds-delay-loader', '--ds-delay-boot', '--ds-loop-loader', '--ds-loop-arc', '--ds-loop-spin', '--ds-ease-spatial'],
    html: LOADERS,
    height: 200,
    wide: true,
    play: function (stage, sg) {
      setHtml(stage, LOADERS);
      return quiet(stage, sg);
    },
  });

  /* ── Feedback: determinate progress ──────────────────────────────── */

  function progressBlock(id, share, name, flat) {
    return '<div class="ds-progress' + (flat ? ' ds-progress--flat' : '') + '" id="' + id + '" style="--ds-progress:' + share + '"><div class="ds-progress__track" role="progressbar" aria-label="' + name + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(share * 100) + '"><div class="ds-progress__bar"></div></div>' +
      '<p class="ds-progress__label">' + Math.round(share * 100) + '%</p><p class="ds-progress__detail">' + (flat ? 'flat: no gap, no stop dot, no wave' : 'wavy, with a gap and a stop dot') + '</p></div>';
  }

  function ringHtml(share, flat) {
    return '<span class="ds-spinner ds-spinner--determinate' + (flat ? ' ds-spinner--flat' : '') + '" role="progressbar" aria-label="Upload' + (flat ? ' (flat)' : '') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(share * 100) + '" style="--ds-progress:' + share + '"></span>';
  }

  function progressTo(stage, share, sg) {
    $$('.ds-progress, .ds-spinner--determinate', stage).forEach(function (el) {
      // The share and its ARIA in one call; the figure counts in the same task.
      DS.dom.progress(el, share);
      var label = $('.ds-progress__label', el);
      if (label) M.countUp(label, Math.round(share * 100), { format: function (value) { return Math.round(value) + '%'; } });
    });
    return quiet(stage, sg);
  }

  function progressShare(stage) { return parseFloat($('.ds-progress', stage).style.getPropertyValue('--ds-progress')) || 0; }

  LAB_DEMOS.push({
    id: 'progress',
    group: 'feedback',
    title: 'Progress',
    note: 'Determinate progress glides to a new share on <code>--ds-ease-value</code> over <code>--ds-dur-glide</code>, the curve and time of countUp(), so the figure lands with its bar. The wavy bar and ring carry a wave that travels (<code>ds-progress-wave</code>) and flattens near the ends; --flat drops the wave, the gap and the stop dot.',
    shows: ['ds-progress-wave', 'DS.motion.countUp', 'DS.dom.progress', '--ds-progress', '--ds-dur-glide', '--ds-ease-value', '--ds-loop-wave'],
    html: '<div class="sg-progress-demo"><div class="ds-stack">' + progressBlock('sg-lab-progress', 0.3, 'Import') + progressBlock('sg-lab-progress-flat', 0.3, 'Import (flat)', true) + '</div>' +
      '<div class="sg-row">' + ringHtml(0.3) + ringHtml(0.3, true) + '</div></div>',
    height: 220,
    wide: true,
    play: function (stage, sg) {
      var share = progressShare(stage);
      return progressTo(stage, share >= 0.9 ? 0.15 : Math.min(1, Math.round((share + 0.25) * 100) / 100), sg);
    },
    state: function (stage) { return progressShare(stage) >= 0.85; },
    toggle: function (stage, on, sg) { return progressTo(stage, on ? 0.9 : 0.2, sg); },
  });

  /* ── Feedback: unknown share, then a share ───────────────────────── */

  function handoffRun(stage, sg) {
    var p = $('#sg-lab-run', stage);
    var say = function (label, detail) {
      $('.ds-progress__label', p).textContent = label;
      $('.ds-progress__detail', p).textContent = detail;
    };
    // DS.dom.progress(): null is an unknown share (indeterminate, or waiting), with its words for assistive tech.
    var unknown = function (waiting, text) { DS.dom.progress(p, null, { waiting: waiting, valueText: text }); };
    var share = function (value, label, detail) {
      DS.dom.progress(p, value);
      say(label, detail);
    };
    DS.dom.progress(p, 0);
    unknown(true, 'Waiting');
    say('Waiting for a free worker ...', 'queued');
    return wait(sg, 900).then(function () {
      unknown(false, 'Preparing');
      say('Preparing the import ...', 'reading the file');
      return wait(sg, 1600);
    }).then(function () {
      share(0.3, '30%', '609 of 2,030 rows');
      return wait(sg, 1000);
    }).then(function () {
      share(1, '100%', 'Done');
      return quiet(p, sg);
    });
  }

  LAB_DEMOS.push({
    id: 'indeterminate',
    group: 'feedback',
    title: 'Unknown share, then a share',
    note: 'While the share is unknown, two segments chase each other (<code>ds-progress-head</code> and <code>ds-progress-tail</code>, the M3 choreography); waiting for a worker is the quiet variant. The first share stops the segments and fades them out while the bar grows from 0 to its share; aria-valuetext gives way to aria-valuenow.',
    shows: ['ds-progress-head', 'ds-progress-tail', 'DS.dom.progress', '--ds-loop-indeterminate', '--ds-dur-glide', '--ds-ease-value'],
    html: '<div class="ds-progress" id="sg-lab-run" style="--ds-progress:0"><div class="ds-progress__track" role="progressbar" aria-label="Import run" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ds-progress__bar"></div></div><p class="ds-progress__label">Ready</p><p class="ds-progress__detail">Replay runs waiting, preparing, 30%, done</p></div>',
    height: 140,
    play: handoffRun,
  });

  /* ── Feedback: the skeleton wave ─────────────────────────────────── */

  function skeletonHtml(withBar) {
    return '<div class="ds-skeleton" role="status"><span class="ds-sr">Loading the devices ...</span>' +
      (withBar ? '<span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>' : '') +
      '<span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span>' +
      '<div class="ds-skeleton__card"><span class="ds-skeleton__line ds-skeleton__line--title"></span><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div></div>';
  }

  function loadedHtml() {
    return '<div class="sg-loaded"><h4 class="sg-loaded__title">Devices</h4><section class="ds-card"><h5 class="ds-card__title">LAPTOP-0042</h5><p class="ds-muted">Latitude 7440, issued to Ada Lovelace.</p></section></div>';
  }

  /* A skeleton (with or without its loading bar) until the fake request
     answers and settleLoader() allows, then the page with .ds-reveal. */
  function skeletonLoad(pane, withBar, ms, sg) {
    setHtml(pane, skeletonHtml(withBar));
    var skeleton = pane.firstChild;
    var startedAt = Date.now();
    return wait(sg, ms).then(function () { return M.settleLoader(startedAt, { element: skeleton }); }).then(function () {
      setHtml(pane, loadedHtml());
      M.replay(pane.firstChild, 'ds-reveal');
      return M.settled(pane.firstChild);
    }).then(function () { pane.firstChild.classList.remove('ds-reveal'); });
  }

  LAB_DEMOS.push({
    id: 'skeleton',
    group: 'feedback',
    title: 'Skeleton',
    note: 'One calm diagonal wave passes over every bone of the surface at once (<code>ds-skeleton-wave</code>), alone and with its loading bar; both wait for the loader delay. When the data arrives, settleLoader() keeps a skeleton that showed for the hold time, and the page replaces it with <code>.ds-reveal</code>.',
    shows: ['ds-skeleton-wave', 'ds-progress-head', 'ds-progress-tail', '.ds-reveal', 'DS.motion.settleLoader', '--ds-loop-skeleton', '--ds-delay-loader', '--ds-hold-loader'],
    html: '<div class="sg-panes"><div><p class="sg-label">Skeleton</p><div class="sg-pane sg-pane--tall" id="sg-skeleton-alone">' + loadedHtml() + '</div></div>' +
      '<div><p class="sg-label">With a loading bar</p><div class="sg-pane sg-pane--tall" id="sg-skeleton-bar">' + loadedHtml() + '</div></div></div>',
    height: 280,
    wide: true,
    play: function (stage, sg) {
      return Promise.all([skeletonLoad($('#sg-skeleton-alone', stage), false, 1600, sg), skeletonLoad($('#sg-skeleton-bar', stage), true, 1600, sg)]);
    },
  });

  /* ── Feedback: stale content ─────────────────────────────────────── */

  var staleSeed = 0;

  function staleHtml() {
    staleSeed += 1;
    return [['Online', 1180 + (staleSeed * 37) % 60], ['Offline', 42 + (staleSeed * 13) % 20], ['Updating', 6 + (staleSeed * 5) % 9]].map(function (row) {
      return '<li><span>' + row[0] + '</span><strong class="ds-num">' + row[1].toLocaleString('en-US') + '</strong></li>';
    }).join('');
  }

  /* DS.motion.refresh(): stale and aria-busy at once, the load, then the
     fresh values in the same task as the stale removal. */
  function staleRefresh(box, ms, sg) {
    return M.refresh(box, function () { return wait(sg, ms); }).then(function () {
      DS.dom.morphHtml($('ul', box), staleHtml());
      return quiet(box, sg);
    });
  }

  LAB_DEMOS.push({
    id: 'stale',
    group: 'feedback',
    title: 'Stale while refreshing',
    note: '<code>DS.motion.refresh()</code>: while a refresh runs the list carries <code>.ds-stale</code> and aria-busy="true". It dims only after the loader delay, so the 150ms refresh never dims; the 1200ms one does, stays dimmed at least <code>--ds-hold-loader</code>, and the fresh values replace the old ones in place (morphHtml), at once. In a <code>.ds-content</code> or <code>.ds-page</code> the call also puts a loading bar at the top of the panel.',
    shows: ['DS.motion.refresh', '--ds-delay-loader', '--ds-hold-loader', '--ds-dur-base', '--ds-state-stale', 'DS.dom.morphHtml'],
    html: '<div class="sg-panes"><div><p class="sg-label">150ms</p><div class="sg-stale" id="sg-stale-fast" aria-busy="false"><ul class="ds-kv-list">' + staleHtml() + '</ul></div></div>' +
      '<div><p class="sg-label">1200ms</p><div class="sg-stale" id="sg-stale-slow" aria-busy="false"><ul class="ds-kv-list">' + staleHtml() + '</ul></div></div></div>',
    wide: true,
    play: function (stage, sg) {
      return Promise.all([staleRefresh($('#sg-stale-fast', stage), 150, sg), staleRefresh($('#sg-stale-slow', stage), 1200, sg)]);
    },
  });

  /* ── Feedback: status polling ────────────────────────────────────── */

  var POLL = [['running', '', 'Syncing'], ['ok', 'check', 'Synced'], ['error', 'alert', 'Failed']];
  var poll = { step: 0, timer: 0 };

  function pollChip(step) {
    var state = POLL[step % POLL.length];
    var mark = state[1] ? icon(state[1], 16) : '<span class="ds-spinner ds-status__spinner" aria-hidden="true"></span>';
    return '<span class="ds-status ds-status--' + state[0] + '">' + mark + '<span>' + state[2] + '</span></span>';
  }

  function pollStep(stage) {
    poll.step += 1;
    DS.dom.morphHtml($('#sg-lab-poll', stage), pollChip(poll.step));
  }

  LAB_DEMOS.push({
    id: 'status',
    group: 'feedback',
    title: 'Status polling',
    note: 'A polled status chip, re-rendered with <code>DS.dom.morphHtml</code>: the kept chip changes colour over <code>--ds-dur-medium</code>, an icon that comes in new fades in and springs up, the word changes at once. Polling never replays an entrance.',
    shows: ['DS.dom.morphHtml', '--ds-dur-medium', '--ds-ease-in-out', '--ds-ease-spatial'],
    html: '<div class="sg-row"><span id="sg-lab-poll">' + pollChip(0) + '</span></div>',
    height: 120,
    controls: '<div class="sg-row">' + switchHtml('sg-lab-poll-feed', 'Poll every 1.5s') + '</div>',
    setup: function (stage, sg) {
      $('#sg-lab-poll-feed', stage.parentNode).addEventListener('change', function (event) {
        clearInterval(poll.timer);
        poll.timer = event.target.checked ? setInterval(function () { pollStep(stage); }, sg.slow(1500)) : 0;
      });
    },
    play: function (stage, sg) {
      pollStep(stage);
      return quiet(stage, sg);
    },
  });

  /* ── Feedback: a table ───────────────────────────────────────────── */

  var TABLE = {
    rows: [
      { id: 'r1', name: 'LAPTOP-0042', owner: 'Ada Lovelace', load: 32, place: 'Building A, 1st floor' },
      { id: 'r2', name: 'LAPTOP-0043', owner: 'Alan Turing', load: 14, place: 'Building A, 2nd floor' },
      { id: 'r3', name: 'DESKTOP-0107', owner: '', load: 93, place: 'Server room' },
      { id: 'r4', name: 'LAPTOP-0051', owner: 'Grace Hopper', load: 78, place: 'Building B, ground floor' },
      { id: 'r5', name: 'TABLET-0121', owner: 'Katherine Johnson', load: 47, place: 'Building B, 1st floor' },
    ],
    sort: 'name',
    dir: 'ascending',
    filter: '',
    selected: {},
    expanded: {},
    feed: 0,
  };

  function tableShown() {
    var query = TABLE.filter.trim().toLowerCase();
    var sign = TABLE.dir === 'ascending' ? 1 : -1;
    return TABLE.rows.filter(function (row) { return !query || (row.name + ' ' + row.owner).toLowerCase().indexOf(query) !== -1; })
      .sort(function (a, b) { return sign * (TABLE.sort === 'load' ? a.load - b.load : a.name.localeCompare(b.name)); });
  }

  function tableHeadHtml() {
    var sortable = function (key, text, cls) {
      var sorted = TABLE.sort === key;
      return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (sorted ? ' aria-sort="' + TABLE.dir + '"' : '') + '><button class="ds-table__sort" type="button" data-table-sort="' + key + '">' + text + (sorted ? icon('arrowUp', 16, 'ds-table__sort-arrow') : '') + '</button></th>';
    };
    return '<tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-table-all></th><th scope="col"><span class="ds-sr">Details</span></th>' + sortable('name', 'Device') + '<th scope="col" class="ds-col--secondary">Owner</th>' + sortable('load', 'Load', 'ds-num') + '</tr>';
  }

  function tableRowsHtml(rows) {
    return rows.map(function (row) {
      var open = !!TABLE.expanded[row.id];
      return '<tr data-ds-key="' + row.id + '"><td><input type="checkbox" aria-label="Select ' + row.name + '" data-table-row' + (TABLE.selected[row.id] ? ' checked' : '') + '></td>' +
        '<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="' + open + '" aria-controls="sg-lab-detail-' + row.id + '" aria-label="Details of ' + row.name + '" data-table-toggle>' + icon('chevronDown', 20, 'ds-chevron') + '</button></td>' +
        '<td class="ds-nowrap">' + row.name + '</td><td class="ds-col--secondary">' + (row.owner || '<span class="ds-muted">Not issued</span>') + '</td><td class="ds-num">' + row.load + '%</td></tr>' +
        '<tr class="ds-table__detail" id="sg-lab-detail-' + row.id + '" data-ds-key="' + row.id + '-detail"' + (open ? '' : ' inert') + '><td colspan="5"><div class="ds-table__expand"><div><dl class="ds-facts"><div><dt>Location</dt><dd>' + row.place + '</dd></div><div><dt>Owner</dt><dd>' + (row.owner || 'Not issued') + '</dd></div></dl></div></div></td></tr>';
    }).join('');
  }

  function tableSync(stage) {
    var rows = tableShown();
    var checked = rows.filter(function (row) { return TABLE.selected[row.id]; }).length;
    var all = $('[data-table-all]', stage);
    all.checked = rows.length > 0 && checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
  }

  /* A user's sort or filter glides at once; the live feed waits for the pointer. */
  function tableRender(stage, live) {
    var tbody = $('tbody', stage);
    DS.dom.morphHtml($('thead', stage), tableHeadHtml());
    var done = M.flip(tbody, function (options) { DS.dom.morphHtml(tbody, tableRowsHtml(tableShown()), options); }, { items: 'tr', live: !!live });
    tableSync(stage);
    // A table that fits again keeps no edge fade.
    M.resyncScroll($('.ds-table-wrap', stage));
    return done;
  }

  function tableSortBy(stage, key) {
    TABLE.dir = TABLE.sort === key && TABLE.dir === 'ascending' ? 'descending' : 'ascending';
    TABLE.sort = key;
    return tableRender(stage);
  }

  LAB_DEMOS.push({
    id: 'table',
    group: 'feedback',
    title: 'Table',
    note: 'Sort by a column or type a filter: the rows glide to their places through <code>DS.motion.flip</code> on every keystroke, and the sort arrow turns. "Select all" checks every row in the same frame. A row\'s chevron opens its details, the room on <code>--ds-ease-out</code> (a layout size), the content fading in. The live feed changes the load every 2s; sorted by load the rows reorder, but only while the mouse is not over the table.',
    shows: ['DS.motion.flip', 'DS.dom.morphHtml', 'DS.motion.resyncScroll', '.ds-chevron', '--ds-dur-slow', '--ds-dur-medium', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-out', '--ds-ease-in'],
    html: '<div class="ds-table-wrap"><table class="ds-table ds-table--interactive sg-lab-table"><caption class="ds-sr">Devices</caption><thead>' + tableHeadHtml() + '</thead><tbody>' + tableRowsHtml(tableShown()) + '</tbody></table></div>',
    height: 420,
    wide: true,
    controls: '<div class="sg-row"><div class="ds-field sg-data-filter"><label class="ds-field__label" for="sg-lab-table-filter">Filter</label><input class="ds-input" id="sg-lab-table-filter" type="search" autocomplete="off" placeholder="Device or owner"></div>' + switchHtml('sg-lab-table-live', 'Live feed, sorted by load') + '</div>',
    setup: function (stage, sg) {
      var card = stage.parentNode;
      stage.addEventListener('click', function (event) {
        var sort = event.target.closest('[data-table-sort]');
        if (sort) tableSortBy(stage, sort.getAttribute('data-table-sort'));
        var toggle = event.target.closest('[data-table-toggle]');
        if (toggle) {
          var id = toggle.closest('tr').getAttribute('data-ds-key');
          TABLE.expanded[id] = !TABLE.expanded[id];
          toggle.setAttribute('aria-expanded', String(TABLE.expanded[id]));
          $('#sg-lab-detail-' + id, stage).inert = !TABLE.expanded[id];
        }
      });
      stage.addEventListener('change', function (event) {
        var input = event.target;
        if (input.hasAttribute('data-table-all')) {
          tableShown().forEach(function (row) { TABLE.selected[row.id] = input.checked; });
          $$('[data-table-row]', stage).forEach(function (row) { row.checked = input.checked; });
        }
        if (input.hasAttribute('data-table-row')) TABLE.selected[input.closest('tr').getAttribute('data-ds-key')] = input.checked;
        tableSync(stage);
      });
      $('#sg-lab-table-filter', card).addEventListener('input', function (event) {
        TABLE.filter = event.target.value;
        tableRender(stage);
      });
      $('#sg-lab-table-live', card).addEventListener('change', function (event) {
        clearInterval(TABLE.feed);
        TABLE.feed = 0;
        if (!event.target.checked) return;
        TABLE.sort = 'load';
        TABLE.dir = 'descending';
        TABLE.feed = setInterval(function () {
          TABLE.rows.forEach(function (row) { if (Math.random() < 0.6) row.load = Math.max(1, Math.min(99, row.load + Math.round((Math.random() - 0.5) * 50))); });
          tableRender(stage, true);
        }, sg.slow(2000));
        tableRender(stage);
      });
      tableSync(stage);
    },
    play: function (stage, sg) { return tableSortBy(stage, 'load').then(function () { return quiet(stage, sg); }); },
  });

  /* ── Feedback: alerts and the errors disclosure ──────────────────── */

  var ALERT_NEWS = ['Synced LAPTOP-0042.', 'Imported 12 devices.', 'TABLET-0121 is back online.', 'Exported the list as CSV.'];
  var alertCount = 0;

  function alertHtml(text) {
    return '<div class="ds-alert ds-alert--success">' + icon('checkCircle', 20) + '<span class="ds-alert__text">' + text + '</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-alert-dismiss>Dismiss</button></div>';
  }

  function alertInsert(stage) {
    var stack = $('.sg-alerts', stage);
    var template = document.createElement('template');
    template.innerHTML = alertHtml(ALERT_NEWS[alertCount % ALERT_NEWS.length]);
    alertCount += 1;
    var alert = template.content.firstElementChild;
    var shown = $$(':scope > .ds-alert:not([data-ds-leaving])', stack);
    var oldest = shown.length >= 3 ? shown[shown.length - 1] : null;
    return M.flip(stack, function () {
      if (oldest) oldest.remove();
      stack.prepend(alert);
    });
  }

  LAB_DEMOS.push({
    id: 'alerts',
    group: 'feedback',
    title: 'Alerts and errors',
    note: 'Both through <code>DS.motion.flip</code> on the stack: a new alert fades in at the top while the others glide down (past three, the oldest goes in the same call); a dismissed one fades out in place while the ones below glide up, and the focus moves to the next alert\'s Dismiss (<code>refocus</code>). The <code>.ds-errors</code> disclosure opens like any <code>.ds-collapsible</code> and its chevron turns.',
    shows: ['DS.motion.flip', '.ds-collapsible', 'ds-fade-in', '--ds-dur-slow', '--ds-dur-fast', '--ds-ease-spatial'],
    html: '<div class="sg-alerts">' + alertHtml('The nightly sync runs at 02:00.') + '</div>' +
      '<details class="ds-errors ds-collapsible"><summary>' + icon('alertCircle', 16) + '2 rows were skipped' + icon('chevronDown', 16, 'ds-errors__chevron') + '</summary><ul><li>Row 4: unknown model "XPS 13 9999"</li><li>Row 9: duplicate serial number</li></ul></details>',
    height: 340,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-alert-insert>' + icon('plus', 16) + 'Insert an alert</button></div>',
    setup: function (stage) {
      stage.addEventListener('click', function (event) {
        var dismiss = event.target.closest('[data-alert-dismiss]');
        if (!dismiss) return;
        var alert = dismiss.closest('.ds-alert');
        // flip() moves the focus to the next alert's Dismiss (refocus), and to Insert when none is left.
        M.flip($('.sg-alerts', stage), function () { alert.remove(); }, { refocus: function () { return $('[data-alert-insert]', stage.parentNode); } });
      });
      $('[data-alert-insert]', stage.parentNode).addEventListener('click', function () { alertInsert(stage); });
    },
    play: function (stage, sg) { return alertInsert(stage).then(function () { return quiet(stage, sg); }); },
  });

  /* ── Feedback: tiles and cards ───────────────────────────────────── */

  function tilesCount(stage) {
    var value = $('#sg-lab-tile-value', stage);
    var devices = 1284 + Math.round(Math.random() * 40);
    var synced = devices - Math.round(10 + Math.random() * 180);
    var share = synced / devices;
    var meter = $('#sg-lab-tile-meter', stage);
    meter.style.setProperty('--ds-progress', String(share));
    $('.ds-progress__track', meter).setAttribute('aria-valuenow', String(Math.round(share * 100)));
    $('#sg-lab-tile-note', stage).textContent = (devices - synced).toLocaleString('en-US') + ' not synced yet';
    return M.countUp(value, synced, { format: function (n) { return Math.round(n).toLocaleString('en-US'); } }).finished;
  }

  LAB_DEMOS.push({
    id: 'tiles',
    group: 'feedback',
    title: 'Tiles and cards',
    note: 'A key figure counts from what it shows while its meter glides on the same curve and time; the note changes at once. A clickable tile and a clickable card press like every action: the state layer, the ripple and the shape turning squarer (16 to 12px, 12 to 8px), springing back. Replay counts and presses both. Rapid toggle selects them (aria-pressed): the tint glides on <code>--ds-dur-fast</code>, the inset ring shows at once.',
    shows: ['DS.motion.countUp', '--ds-tile-radius-pressed', '--ds-radius-card-pressed', '--ds-selected-ring', 'ds-press-ripple', '--ds-dur-glide', '--ds-ease-value', '--ds-dur-micro', '--ds-dur-fast', '--ds-ease-spatial'],
    html: '<div class="sg-tiles-demo"><div class="ds-tile"><p class="ds-tile__label">' + icon('sync', 20) + '<span>Synced</span></p><p class="ds-tile__value" id="sg-lab-tile-value">1,210</p>' +
      '<div class="ds-progress ds-progress--flat sg-tile-progress" id="sg-lab-tile-meter" style="--ds-progress:.94"><div class="ds-progress__track" role="progressbar" aria-label="Synced devices" aria-valuemin="0" aria-valuemax="100" aria-valuenow="94"><div class="ds-progress__bar"></div></div></div>' +
      '<p class="ds-tile__note" id="sg-lab-tile-note">74 not synced yet</p></div>' +
      '<button class="ds-tile" type="button" aria-pressed="false" data-tile-press><span class="ds-tile__label">' + icon('alert', 20) + '<span>Overdue</span></span><span class="ds-tile__value">7</span><span class="ds-tile__note">clickable tile</span></button>' +
      '<button class="ds-card ds-card--interactive" type="button" aria-pressed="false" data-tile-press><span class="ds-card__title">PRINTER-0003</span><span class="ds-muted sg-card-text">Floor 2. The whole card is one button.</span></button></div>',
    height: 240,
    wide: true,
    setup: function (stage) {
      M.countUp($('#sg-lab-tile-value', stage), 1210, { duration: 0, format: function (n) { return Math.round(n).toLocaleString('en-US'); } });
    },
    play: function (stage, sg) {
      var counting = tilesCount(stage);
      var pressing = Promise.all($$('[data-tile-press]', stage).map(function (host) { return press(host, sg, 'centre', 300); }));
      return Promise.all([counting, pressing]).then(function () { return ripplesGone(stage, sg); });
    },
    // Selected (a filter by the figure, a chosen card): the tint glides on --ds-dur-fast, the inset ring shows at once.
    state: function (stage) { return $('[data-tile-press]', stage).getAttribute('aria-pressed') === 'true'; },
    toggle: function (stage, on, sg) {
      $$('[data-tile-press]', stage).forEach(function (host) { host.setAttribute('aria-pressed', String(on)); });
      return quiet(stage, sg);
    },
  });

  /* ── Feedback: the done state ────────────────────────────────────── */

  function doneHtml() {
    return '<div class="ds-empty ds-empty--done" role="status"><span class="ds-empty__disc" aria-hidden="true">' + icon('check', 24) + '</span><p class="ds-empty__title">Request sent</p><p class="ds-empty__text">IT answers within a day.</p></div>';
  }

  LAB_DEMOS.push({
    id: 'done-state',
    group: 'feedback',
    title: 'Done state',
    note: '<code>.ds-empty--done</code>: after <code>--ds-dur-base</code> the disc fades in and pops up on the spring (<code>ds-fade-in</code>, <code>ds-pop-in</code>, <code>--ds-dur-slow</code>), a ring widens and fades once behind it (<code>ds-ripple</code>), and the check draws itself (<code>ds-draw</code> over <code>--ds-dur-glide</code>). It plays when the element is inserted or shown, never when a re-render keeps it. Replay inserts it again.',
    shows: ['.ds-empty--done', 'ds-fade-in', 'ds-pop-in', 'ds-ripple', 'ds-draw', '--ds-dur-base', '--ds-dur-slow', '--ds-dur-glide', '--ds-ease-spatial', '--ds-ease-out'],
    html: '<div id="sg-lab-done">' + doneHtml() + '</div>',
    height: 240,
    play: function (stage, sg) {
      var holder = $('#sg-lab-done', stage);
      setHtml(holder, doneHtml());
      return quiet(stage, sg);
    },
  });

  /* ── Views: DS.motion.transition() in a frame ────────────────────── */

  var VIEW_PAGES = [
    ['Devices', 'Every laptop and desktop, synced nightly.'],
    ['Tickets', 'Three open, one waiting for a part.'],
    ['Owners', 'Forty-two people in six teams.'],
  ];
  var views = { at: 0, ready: null, detail: false };

  function viewPage(index) {
    var page = VIEW_PAGES[index % VIEW_PAGES.length];
    return pageHead(page[0], page[1]) + '<div class="ds-grid-2">' + frameCards(2) + '</div>';
  }

  function detailPage() {
    return pageHead('LAPTOP-0042', 'The card grew into its detail.') +
      '<section class="ds-card sg-frame-detail" id="detail"><h2 class="ds-card__title">LAPTOP-0042</h2><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div><div><dt>Model</dt><dd>Latitude 7440</dd></div><div><dt>Location</dt><dd>Building A, 1st floor</dd></div></dl></section>';
  }

  /* Without View Transitions: .ds-theme moves from <html> to the app, as
     for an embedded widget, so transition() takes its fallback. */
  function viewsFallback(doc, on) {
    doc.documentElement.classList.toggle('ds-theme', !on);
    doc.getElementById('app').classList.toggle('ds-theme', on);
  }

  /* One navigation of the small app, through DS.motion.transition(). */
  function viewGo(stage, type) {
    return views.ready.then(function (win) {
      var doc = win.document;
      var page = doc.getElementById('page');
      viewsFallback(doc, $('#sg-views-fallback', stage.parentNode).checked);
      var from = null;
      var html;
      if (type === 'container') {
        if (views.detail) return undefined;
        from = $('.ds-card', page);
        html = detailPage();
        views.detail = true;
      } else {
        views.at = type === 'back' ? (views.at + VIEW_PAGES.length - 1) % VIEW_PAGES.length : type === 'forward' ? (views.at + 1) % VIEW_PAGES.length : (views.at + 2) % VIEW_PAGES.length;
        html = viewPage(views.at);
        views.detail = false;
      }
      setHtml($('#sg-views-at', stage.parentNode), 'Last: <code>' + type + '</code> · ' + (doc.startViewTransition && doc.documentElement.classList.contains('ds-theme') ? 'View Transition' : 'fallback: .ds-enter--swap'));
      return win.DS.motion.transition(function () {
        setHtml(page, html);
        doc.getElementById('view').scrollTop = 0;
        return type === 'container' ? doc.getElementById('detail') : page;
      }, { type: type, from: from });
    });
  }

  LAB_DEMOS.push({
    id: 'views',
    group: 'views',
    title: 'Between views',
    note: '<code>DS.motion.transition()</code> in a small app: fade-through between top-level destinations (the old view goes in <code>--ds-dur-instant</code>, the new one fades in and grows from <code>--ds-scale-enter</code>), shared axis X for forward and back (both views travel on the spring, landing together), and the container transform from a card into its detail over <code>--ds-dur-long</code>. The top bar never moves. "Without View Transitions" runs the same update through the fallback: the new view fades through with <code>.ds-enter--swap</code>.',
    shows: ['DS.motion.transition', '.ds-enter--swap', 'ds-fade-in', 'ds-fade-out', 'ds-grow-in', 'ds-shift-in', 'ds-shift-out', '--ds-dur-instant', '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-long', '--ds-ease-spatial', '--ds-ease-in', '--ds-distance-xl', '--ds-scale-enter'],
    html: frameHtml('', 'A small app: views'),
    after: readoutHtml('sg-views-at', 'Pick a navigation.'),
    height: 380,
    wide: true,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-view="fade-through">Fade-through</button><button class="ds-btn ds-btn--sm" type="button" data-view="back">' + icon('arrowLeft', 16) + 'Back</button><button class="ds-btn ds-btn--sm" type="button" data-view="forward">Forward' + icon('arrowRight', 16) + '</button><button class="ds-btn ds-btn--sm" type="button" data-view="container">Card into its detail</button></div>' +
      '<div class="sg-row">' + switchHtml('sg-views-fallback', 'Without View Transitions') + '</div>',
    setup: function (stage) {
      views.ready = openFrame(stage, appFrameHtml(false, viewPage(0)));
      stage.parentNode.addEventListener('click', function (event) {
        var button = event.target.closest('[data-view]');
        if (button) viewGo(stage, button.getAttribute('data-view'));
      });
    },
    subject: function (stage) {
      var frame = $('iframe', stage);
      return frame.contentDocument ? frame.contentDocument.documentElement : null;
    },
    play: function (stage) { return viewGo(stage, 'forward'); },
    state: function () { return views.at !== 0 || views.detail; },
    toggle: function (stage, on) {
      if (on) return viewGo(stage, 'forward');
      views.at = 1;
      return viewGo(stage, 'back');
    },
  });

  /* ── Views: a wizard outside the app frame (.ds-vt-view) ─────────── */

  var WIZARD = [
    ['Choose the device', 'Step 1 of 3: which device is returned?'],
    ['Check its state', 'Step 2 of 3: anything broken or missing?'],
    ['Confirm the return', 'Step 3 of 3: the owner gets a receipt.'],
  ];
  var wizard = { at: 0, ready: null };

  function wizardStep(index) {
    var step = WIZARD[index];
    return '<section class="ds-card sg-wizard-step"><h1 class="ds-card__title" tabindex="-1">' + step[0] + '</h1><p class="ds-muted">' + step[1] + '</p></section>';
  }

  function wizardGo(stage, type) {
    return wizard.ready.then(function (win) {
      var doc = win.document;
      var next = type === 'back' ? Math.max(0, wizard.at - 1) : Math.min(WIZARD.length - 1, wizard.at + 1);
      if (next === wizard.at) return undefined;
      wizard.at = next;
      return win.DS.motion.transition(function () {
        var view = doc.getElementById('wizard');
        var template = doc.createElement('template');
        template.innerHTML = wizardStep(next);
        view.replaceChildren(template.content);
        return view;
      }, { type: type });
    });
  }

  LAB_DEMOS.push({
    id: 'wizard',
    group: 'views',
    title: 'A wizard outside the frame',
    note: 'A page without <code>.ds-app</code> (a wizard, a sign-in page) marks its view <code>.ds-vt-view</code>: it is named <code>ds-view</code> only while <code>DS.motion.transition()</code> runs, so Next and Back travel on the shared axis like the app\'s views. Without View Transitions the new step enters with <code>.ds-enter--swap</code>. (A page passes <code>focus: true</code> too, so a focus that was lost lands on the new step\'s heading; the demo leaves the focus on its buttons.)',
    shows: ['.ds-vt-view', 'DS.motion.transition', '.ds-enter--swap', 'ds-shift-in', 'ds-shift-out', '--ds-dur-long', '--ds-ease-spatial', '--ds-distance-xl'],
    html: frameHtml('', 'A wizard without the app frame'),
    height: 220,
    controls: '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-wizard="back">' + icon('arrowLeft', 16) + 'Back</button><button class="ds-btn ds-btn--sm" type="button" data-wizard="forward">Next' + icon('arrowRight', 16) + '</button></div>',
    setup: function (stage) {
      wizard.ready = openFrame(stage, '<main class="ds-vt-view sg-wizard" id="wizard">' + wizardStep(0) + '</main>');
      stage.parentNode.addEventListener('click', function (event) {
        var button = event.target.closest('[data-wizard]');
        if (button) wizardGo(stage, button.getAttribute('data-wizard'));
      });
    },
    subject: function (stage) {
      var frame = $('iframe', stage);
      return frame.contentDocument ? frame.contentDocument.documentElement : null;
    },
    play: function (stage) { return wizardGo(stage, wizard.at === WIZARD.length - 1 ? 'back' : 'forward'); },
    state: function () { return wizard.at > 0; },
    toggle: function (stage, on) {
      if (!on) return wizardGo(stage, 'back');
      return wizardGo(stage, 'forward');
    },
  });

  /* ── Views: .ds-view--leaving ────────────────────────────────────── */

  var swapRun = 0;
  var swapAt = 0;

  /* The documented swap sequence (docs/components.md, App frame): fade the
     children out, wait for that fade, replace, and let the new content
     enter in the same task; a newer swap takes over. */
  function swapView(stage) {
    var target = $('.sg-swap-view', stage);
    var run = swapRun += 1;
    swapAt += 1;
    target.classList.add('ds-view--leaving');
    return M.settled(target.firstElementChild, { event: 'transitionend', property: 'opacity' }).then(function () {
      if (run !== swapRun) return undefined;
      var page = VIEW_PAGES[swapAt % VIEW_PAGES.length];
      setHtml(target, '<div class="sg-swap-page"><h4 class="ds-card__title">' + page[0] + '</h4><p class="ds-muted">' + page[1] + '</p></div>');
      target.classList.remove('ds-view--leaving');
      return M.enter(target.firstElementChild, 'swap');
    });
  }

  LAB_DEMOS.push({
    id: 'view-leaving',
    group: 'views',
    title: 'Leaving view, by hand',
    note: 'Deprecated since 2.0 (removed in 3.0 at the earliest): use <code>DS.motion.transition()</code>. Without it, <code>.ds-view--leaving</code> fades the view\'s children out (<code>--ds-dur-instant</code>, accelerating), the page waits for that fade with <code>DS.motion.settled()</code>, replaces the content and lets it enter with <code>.ds-enter--swap</code>. Pressing again during a swap ends on the latest view.',
    shows: ['DS.motion.settled', 'DS.motion.enter', '.ds-enter--swap', '--ds-dur-instant', '--ds-dur-medium', '--ds-ease-in', '--ds-distance-sm'],
    html: '<div class="sg-swap-view"><div class="sg-swap-page"><h4 class="ds-card__title">' + VIEW_PAGES[0][0] + '</h4><p class="ds-muted">' + VIEW_PAGES[0][1] + '</p></div></div>',
    height: 140,
    play: swapView,
  });

  /* ── Views: motion that follows scrolling ────────────────────────── */

  function scrollBox(stage, to, sg) {
    var box = $('.sg-scroll-box', stage);
    var target = to === 'end' ? box.scrollHeight - box.clientHeight : 0;
    box.scrollTo({ top: target, behavior: 'smooth' });
    var wide = $('.ds-table-wrap', stage);
    wide.scrollTo({ left: to === 'end' ? wide.scrollWidth - wide.clientWidth : 0, behavior: 'smooth' });
    return until(sg, function () { return Math.abs(box.scrollTop - target) < 1; }, 4000).then(function () { return quiet(stage, sg); });
  }

  var REPORT = [['Fleet', '1,284 devices in 6 buildings.'], ['Age', 'Three years on average; 7 overdue.'], ['Tickets', '42 opened, 39 closed this month.'], ['Storage', '18 devices wait to be issued.'], ['Costs', 'Within the budget for the quarter.']];

  LAB_DEMOS.push({
    id: 'scroll',
    group: 'views',
    title: 'Reveal on scroll and edge fades',
    note: 'In a long read-only page each block fades in and rises while it scrolls into view (<code>.ds-reveal--scroll</code>, tied to the scroll position: scrolling back reverses it). A table wider than its card fades its edges while it scrolls sideways (<code>ds-edge-fade</code> on the wrapper\'s scroll timeline). Without scroll timelines both stay static, never hidden. <code>DS.dom.scrollEdges()</code> reports which ends of the table have more to scroll (the read-out). Replay scrolls both to the end and back.',
    shows: ['.ds-reveal--scroll', 'ds-edge-fade', 'DS.dom.scrollEdges', 'ds-fade-in', 'ds-lift-in', '--ds-distance-md'],
    html: '<div class="sg-scroll-demo"><div class="sg-scroll-box" tabindex="0" aria-label="A report">' + REPORT.map(function (block) {
      return '<section class="ds-card ds-reveal--scroll"><h4 class="ds-card__title">' + block[0] + '</h4><p class="ds-muted">' + block[1] + '</p></section>';
    }).join('') + '</div>' +
      '<div class="ds-table-wrap sg-wide-table" tabindex="0" aria-label="A wide table"><table class="ds-table ds-table--wide"><caption class="ds-sr">Devices</caption><thead><tr>' +
      ['Device', 'Owner', 'Model', 'Location', 'Serial', 'Address', 'Release', 'Memory'].map(function (name) { return '<th scope="col">' + name + '</th>'; }).join('') + '</tr></thead><tbody>' +
      ['LAPTOP-0042', 'TABLET-0121', 'PRINTER-0003'].map(function (name) {
        return '<tr><td class="ds-nowrap">' + name + '</td><td class="ds-nowrap">Ada Lovelace</td><td class="ds-nowrap">Latitude 7440</td><td class="ds-nowrap">Building A, 1st floor</td><td>5CD1234XYZ</td><td>10.0.4.42</td><td class="ds-nowrap">Release 24.2</td><td>32 GB</td></tr>';
      }).join('') + '</tbody></table></div></div>',
    after: readoutHtml('sg-scroll-edges', ''),
    height: 280,
    wide: true,
    setup: function (stage) {
      var wide = $('.ds-table-wrap', stage);
      var out = $('#sg-scroll-edges', stage.parentNode);
      var say = function () {
        var start = wide.hasAttribute('data-ds-overflow-start');
        var end = wide.hasAttribute('data-ds-overflow-end');
        out.textContent = 'The table has more to scroll ' + (start && end ? 'at both ends' : start ? 'at its start' : end ? 'at its end' : 'at neither end') + ' (data-ds-overflow-start, data-ds-overflow-end).';
      };
      new MutationObserver(say).observe(wide, { attributes: true, attributeFilter: ['data-ds-overflow-start', 'data-ds-overflow-end'] });
      DS.dom.scrollEdges(wide);
      say();
    },
    play: function (stage, sg) {
      return scrollBox(stage, 'end', sg).then(function () { return wait(sg, 300); }).then(function () { return scrollBox(stage, 'start', sg); });
    },
    state: function (stage) { return $('.sg-scroll-box', stage).scrollTop > 0; },
    toggle: function (stage, on, sg) { return scrollBox(stage, on ? 'end' : 'start', sg); },
  });

  /* The order of the cards inside each section (entries not named keep
     their place after these). Half-width cards come in pairs before a wide
     card, so none sits alone beside an empty column; an odd one goes last
     in its section. */
  var ORDER = ['enter-leave', 'reveal', 'interrupt', 'stagger', 'stagger-once', 'disclosure', 'swap',
    'draw', 'roll', 'scan', 'ring', 'press-ripple', 'pop', 'clip',
    'count', 'data-list', 'morph', 'settle-loader',
    'press', 'focus', 'busy', 'icon-swap', 'chips', 'input-chips', 'switch', 'switch-locked', 'validation', 'checks',
    'track', 'drawer', 'segmented', 'topbar',
    'loaders', 'progress', 'indeterminate', 'status', 'skeleton', 'stale', 'table', 'tiles', 'alerts', 'done-state',
    'views', 'scroll', 'view-leaving'];
  LAB_DEMOS = LAB_DEMOS.map(function (entry, index) { return { entry: entry, index: index }; }).sort(function (a, b) {
    var rank = function (item) { var at = ORDER.indexOf(item.entry.id); return at === -1 ? ORDER.length + item.index : at; };
    return rank(a) - rank(b);
  }).map(function (item) { return item.entry; });

  window.SG_LAB = LAB_DEMOS;
}());
