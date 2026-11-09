/*
 * The Motion Lab (motion.html): every motion of Dashboard-Style as a
 * replayable demo, in its frame. A classic script on top of dist/ds.js, so
 * the page runs from disk. It holds the frame, the navigation (the drawer
 * with its scroll-spy, the modal drawer), the theme select, the speed
 * select and the readiness hook; the demos come from the registry
 * window.SG_LAB (lab.js and the generated lab-components.js, loaded before
 * this file), whose cards get Replay, Rapid toggle and Reverse at 50% here.
 * The styleguide itself is index.html (shell.js), with a frame of its own;
 * the 2.x styleguide that shared this script is retired.
 *
 * Hooks for the browser tests (test/browser/), harmless when opened by hand:
 *   html[data-sg-ready]   set once the frame, the themes and the demos near the viewport are
 *                         set up and a saved theme has loaded (the demos
 *                         come after the first render: startLab)
 *   html[data-sg-theme]   the theme last applied, set once its values and
 *                         the indicators were updated
 *   ?speed=0.1            slow motion (a factor of 1 or less), marked
 *                         html[data-sg-speed]; it wins over the speed
 *                         select's stored choice and is not stored
 *   [data-lab-demo]       a lab card: data-lab-shows (what it exercises),
 *                         data-lab-state running or settled, and its
 *                         buttons [data-lab="replay|rapid|reverse"]
 *   window.SG_LAB_HELPERS the `sg` object the registry's functions receive
 *                         (a test calls a demo's reset() with it)
 */
(function () {
  'use strict';

  var DS = window.DS;
  var I = DS.icons;
  var M = DS.motion;
  var icon = function (name, size, cls) { return I.icon(I[name], size, cls); };
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var esc = function (text) { return String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ── Slow motion: the speed select and ?speed=<factor> ───────────── */

  /*
   * Styleguide tooling only. --ds-time-scale multiplies every duration and
   * delay token: at a speed of 0.1 it is 10, inline on the root .ds-theme
   * element (<html>), so CSS motion and everything DS.motion times from
   * the tokens (motionDuration() reads them) run ten times slower. Themes
   * and components never set it (test/tokens.test.js forbids it in src/
   * and themes/). The select's choice is stored; ?speed= wins over it and
   * is not stored, so test runs are deterministic.
   */
  var SPEEDS = [1, 0.5, 0.25, 0.1];
  var SPEED_KEY = 'ds-styleguide-speed';
  var speed = 1;

  function applySpeed(factor) {
    var root = document.documentElement;
    speed = factor;
    if (factor < 1) {
      root.setAttribute('data-sg-speed', String(factor));
      root.style.setProperty('--ds-time-scale', String(1 / factor));
    } else {
      root.removeAttribute('data-sg-speed');
      root.style.removeProperty('--ds-time-scale');
    }
  }

  (function initialSpeed() {
    var asked = Number(new URLSearchParams(location.search).get('speed'));
    var stored = 1;
    try { stored = Number(localStorage.getItem(SPEED_KEY)); } catch (e) { stored = 1; /* storage may be blocked */ }
    applySpeed(asked > 0 && asked <= 1 ? asked : SPEEDS.indexOf(stored) !== -1 ? stored : 1);
  }());

  /* A demo's own timer (a fake request, a poll, a feed): slowed down with
     the speed like the motion, so the story keeps its pace. */
  function slow(ms) { return ms / speed; }

  /* The read-out next to the select names the speed while it is below 1,
     so a screenshot never hides it; the lab's ms labels follow. */
  function showSpeed() {
    var out = $('#sg-speed-readout');
    out.hidden = speed >= 1;
    out.textContent = 'Slow motion ' + speed + '\u00d7';
    refreshTimes();
  }

  /* The select in the top bar. A ?speed= factor that is none of its
     options gets an option of its own for the visit. */
  function setupSpeed() {
    var select = $('#sg-speed-select');
    if (SPEEDS.indexOf(speed) === -1) {
      var option = document.createElement('option');
      option.value = String(speed);
      option.textContent = speed + '\u00d7';
      select.appendChild(option);
    }
    select.value = String(speed);
    showSpeed();
    select.addEventListener('change', function () {
      applySpeed(Number(select.value));
      try { localStorage.setItem(SPEED_KEY, String(speed)); } catch (e) { /* storage may be blocked */ }
      showSpeed();
    });
  }

  /* ── Sections ─────────────────────────────────────────────────────── */

  /* The drawer: the lab's sections (the groups that have demos), then the
     way back; [section id, label, icon], and a fourth entry for a link to
     the other page. */
  function labNav() {
    return [
      { group: 'Motion Lab', items: [['lab', 'Overview', 'overview']].concat(labGroups().map(function (group) { return [group.id, group.title, group.icon]; })) },
      { group: 'Styleguide', items: [['index', 'Components and tokens', 'arrowLeft', 'index.html']] },
    ];
  }

  var LAB = window.SG_LAB || [];

  /** The lab's groups that have demos, in page order. */
  function labGroups() {
    return (window.SG_LAB_GROUPS || []).filter(function (group) {
      return LAB.some(function (entry) { return entry.group === group.id; });
    });
  }

  /** Tokens whose computed value is a time: the card shows them in ms. */
  var TIMED = /^--ds-(dur|delay|hold|stagger|loop)(-|$)/;

  function isToken(name) { return name.indexOf('--ds-') === 0; }

  /** A token as a label; a time token with its computed ms (refreshTimes() fills it). */
  function tokenLabel(name) {
    return '<code>' + name + '</code>' + (TIMED.test(name) ? ' <span class="ds-num" data-lab-ms="' + name + '"></span>' : '');
  }

  /* A code label is an inline-block, and an inline-block adds a line break
     opportunity on each side, even next to "(" or ",": the punctuation
     touching a label goes into one .sg-glue span with it, which keeps them
     on one line (the label itself can still wrap inside). */
  function glue(html) {
    return html.replace(/([(\[{"']*)(<code>[^<]*<\/code>)([)\]}.,;:!?"']*)/g, function (match, before, code, after) {
      return before || after ? '<span class="sg-glue">' + before + code + after + '</span>' : match;
    });
  }

  /* One demo of the registry: stage, the tokens it uses with their ms at the
     current speed, what else it exercises, and its buttons. */
  function labCard(entry) {
    return glue(labCardHtml(entry));
  }

  function labCardHtml(entry) {
    var tokens = entry.shows.filter(isToken);
    var others = entry.shows.filter(function (name) { return !isToken(name); });
    return '<article class="ds-card sg-demo' + (entry.wide ? ' sg-demo--wide' : '') + '" data-lab-demo="' + entry.id + '" data-lab-shows="' + esc(entry.shows.join(' ')) + '" data-lab-state="idle" aria-labelledby="lab-' + entry.id + '-title">' +
      '<h3 class="ds-card__title" id="lab-' + entry.id + '-title">' + entry.title + '</h3>' +
      (entry.note ? '<p class="ds-muted sg-demo__note">' + entry.note + '</p>' : '') +
      '<div class="sg-lab-stage"' + (entry.height ? ' style="--sg-lab-stage-height: ' + entry.height + 'px"' : '') + '>' + entry.html + '</div>' +
      (entry.after || '') +
      (tokens.length ? '<p class="ds-meta sg-demo__tokens">' + tokens.map(tokenLabel).join(' · ') + '</p>' : '') +
      (others.length ? '<p class="ds-meta sg-demo__shows">Exercises ' + others.map(function (name) { return '<code>' + esc(name) + '</code>'; }).join(', ') + '</p>' : '') +
      '<div class="sg-row sg-demo__actions"><button class="ds-btn ds-sm ds-btn--tonal" type="button" data-lab="replay">' + icon('reset', 16) + (entry.playLabel || 'Replay') + '</button>' +
      (entry.toggle ? '<button class="ds-btn ds-sm" type="button" data-lab="rapid">Rapid toggle</button><button class="ds-btn ds-sm" type="button" data-lab="reverse">Reverse at 50%</button>' : '') + '</div>' +
      (entry.controls || '') + '</article>';
  }

  function labGroup(group) {
    return '<section class="sg-section" id="' + group.id + '" aria-labelledby="' + group.id + '-title">' +
      '<header class="ds-page-head"><h2 class="ds-page-head__title" id="' + group.id + '-title">' + group.title + '</h2>' +
      '<p class="ds-page-head__lead">' + group.lead + '</p></header>' +
      '<div class="sg-demos">' + LAB.filter(function (entry) { return entry.group === group.id; }).map(labCard).join('') + '</div></section>';
  }

  /* The lab's opening: what it is, how to use it, and four figures. */
  function labIntro() {
    var durations = {};
    LAB.forEach(function (entry) { entry.shows.forEach(function (name) { if (name.indexOf('--ds-dur-') === 0) durations[name] = true; }); });
    var curves = LAB.filter(function (entry) { return entry.id.indexOf('curve-') === 0; }).length;
    var figure = function (name, value, glyph, note, id) {
      return '<div class="ds-tile"><p class="ds-tile__label">' + icon(glyph, 20) + '<span>' + name + '</span></p><p class="ds-tile__value"' + (id ? ' id="' + id + '"' : '') + '>' + value + '</p><p class="ds-tile__note">' + note + '</p></div>';
    };
    return '<section class="sg-section" id="lab" aria-labelledby="lab-title">' +
      '<div class="sg-hero"><h1 id="lab-title">Motion Lab</h1>' +
      '<p>Every motion of Dashboard-Style, one demo at a time: the curves and durations it is built from, sampled from this browser, and the choreography of its parts. Replay any demo; Rapid toggle and Reverse at 50% interrupt it, and every motion continues from where it is.</p>' +
      '<p>The Speed select in the top bar slows everything down to a tenth (or add <code>?speed=0.1</code> to the address): it sets <code>--ds-time-scale</code>, so CSS motion and DS.motion slow down together.</p>' +
      '<div class="sg-row"><a class="ds-btn ds-btn--filled" href="#foundations">Start with the curves</a><a class="ds-btn" href="index.html">' + icon('arrowLeft', 16) + 'Back to the styleguide</a><a class="ds-btn ds-btn--text" href="../docs/motion.md">Motion reference ' + icon('arrowRight', 16) + '</a></div></div>' +
      '<div class="ds-tiles">' +
      figure('Demos', String(LAB.length), 'apps', 'each one replays') + figure('Curves', String(curves), 'activity', 'sampled, not drawn') +
      figure('Durations', String(Object.keys(durations).length), 'clock', '50 to 600ms') + figure('Spring peak', '...', 'sparkles', 'the contract: at most 1.05', 'sg-lab-peak') +
      '</div></section>';
  }

  /* The time labels of the lab: tokens in ms at the current speed, and the
     travel times of the ladder. */
  function refreshTimes() {
    // Every read first, then every write: a write between two reads would
    // make each read restyle the whole page again.
    var labels = $$('[data-lab-ms]').map(function (el) { return [el, Math.round(M.motionDuration(el, el.getAttribute('data-lab-ms'))) + 'ms']; })
      .concat($$('[data-lab-travel]').map(function (el) { return [el, Math.round(M.travelDuration(el, Number(el.getAttribute('data-lab-travel')))) + 'ms']; }));
    labels.forEach(function (label) { if (label[0].textContent !== label[1]) label[0].textContent = label[1]; });
  }

  /* The helpers a lab entry gets as `sg` (lab.js). */
  var indicators = [];

  function addIndicator(track, options) {
    var made = DS.indicator.create(track, options);
    indicators.push(made);
    return made;
  }

  function frames(count) {
    return new Promise(function (resolve) {
      var left = count;
      (function tick() {
        if (left <= 0) { resolve(); return; }
        left -= 1;
        requestAnimationFrame(tick);
      }());
    });
  }

  var SG = { icon: icon, toast: function (text, kind) { return toast(text, kind); }, slow: slow, indicator: addIndicator, frames: frames };
  window.SG_LAB_HELPERS = SG;

  /* Each demo's run: a newer press supersedes an older one (its timers stop,
     and only the latest run marks the card settled), and `on` is where a
     reversible demo is. */
  var labDemos = {};

  function labOn(demo) {
    if (demo.entry.state) demo.on = !!demo.entry.state(demo.stage);
    return demo.on;
  }

  function labRun(demo, start) {
    var run = demo.run += 1;
    demo.timers.forEach(clearTimeout);
    demo.timers = [];
    demo.card.setAttribute('data-lab-state', 'running');
    var finish = function () { if (run === demo.run) demo.card.setAttribute('data-lab-state', 'settled'); };
    new Promise(function (resolve) { resolve(start()); }).then(finish, function (error) {
      finish();
      throw error;
    });
  }

  function later(demo, ms) {
    return new Promise(function (resolve) { demo.timers.push(setTimeout(resolve, ms)); });
  }

  function labReplay(demo) {
    labRun(demo, function () {
      if (demo.entry.reset) demo.entry.reset(demo.stage, SG);
      var done = demo.entry.play(demo.stage, SG);
      demo.on = true;
      labOn(demo);
      return done;
    });
  }

  /* Five toggles 80ms apart (at the current speed): the end state is the
     one the count implies, and nothing jumps on the way. */
  function labRapid(demo) {
    labRun(demo, function () {
      labOn(demo);
      return new Promise(function (resolve) {
        var left = 5;
        (function next() {
          demo.on = !demo.on;
          var done = demo.entry.toggle(demo.stage, demo.on, SG);
          left -= 1;
          if (left) demo.timers.push(setTimeout(next, slow(80)));
          else resolve(done);
        }());
      });
    });
  }

  /** How long until the longest motion in `root` (the stage, or the entry's subject) is half done (ms). */
  function halfway(root) {
    var longest = null;
    root.getAnimations({ subtree: true }).forEach(function (animation) {
      var timing = animation.effect && animation.effect.getComputedTiming();
      if (!timing || !isFinite(timing.endTime) || !(timing.endTime > 0)) return;
      if (!longest || timing.endTime > longest.end) longest = { end: timing.endTime, at: Number(animation.currentTime) || 0 };
    });
    if (!longest) return M.motionDuration(document.documentElement, '--ds-dur-medium') / 2;
    return Math.max(0, longest.end / 2 - longest.at);
  }

  /* Starts the motion, then turns it back at half of its (scaled) duration:
     the way back continues from there, never from the start. */
  function labReverse(demo) {
    labRun(demo, function () {
      demo.on = !labOn(demo);
      demo.entry.toggle(demo.stage, demo.on, SG);
      // Two frames: an indicator places itself one frame after the change.
      return frames(2).then(function () {
        var subject = demo.entry.subject ? demo.entry.subject(demo.stage) : demo.stage;
        return later(demo, halfway(subject || demo.stage));
      }).then(function () {
        demo.on = !demo.on;
        return demo.entry.toggle(demo.stage, demo.on, SG);
      });
    });
  }

  /* The lab's sections, appended to the opening that render() put in. */
  function renderLabSections() {
    var template = document.createElement('template');
    template.innerHTML = labGroups().map(labGroup).join('');
    var sections = Array.prototype.slice.call(template.content.children);
    presetStates(template.content);
    $('#sg-page').append(template.content);
    return sections;
  }

  /*
   * The lab's sections and demos come after the first render. Built, laid
   * out and set up (curves sampled, indicators placed) before it, they kept
   * the page render-blocked (<link rel="expect"> in motion.html) for half a
   * second and more, and a cross-document View Transition whose new page
   * comes that late is skipped once the engine's timeout passes: the move
   * from the styleguide lost its glide on a busy machine. So the first
   * render holds the frame, the drawer with its named pill and the lab's
   * opening; the rest waits for the incoming View Transition to finish
   * (its main-thread animations, the pill's size among them, would stall
   * behind the work) or, without one, for the frame after the reveal.
   * pagereveal comes before the animation frame callbacks of the same
   * frame: a first frame callback that has seen none comes after a reveal
   * that happened earlier, or in an engine without the event.
   */
  function startLab(done) {
    var transition = null;
    var start = function () {
      setTimeout(function () {
        var sections = renderLabSections();
        $$('.sg-section').forEach(function (s) { spy.observe(s); });
        refreshTimes();
        M.enterAll(sections, 'swap');
        var target = location.hash && document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
        setupLab(done);
      }, 0);
    };
    window.addEventListener('pagereveal', function (event) { transition = event.viewTransition || null; }, { once: true });
    requestAnimationFrame(function () {
      if (transition) transition.finished.then(start, start);
      else start();
    });
  }

  /* Sets a demo up once: its setup runs under data-ds-moving on its card
     (transition: none, motion.css), lifted after one style flush, so the
     state it writes at once (a Send button blocked while its field is
     empty, a meter's share, the ranks of an ordered choice, a scroller's
     edge hairlines) shows at once instead of playing as a transition. */
  function setupDemo(demo, batched) {
    if (demo.ready) return demo;
    demo.ready = true;
    if (!batched) demo.card.setAttribute('data-ds-moving', '');
    if (demo.entry.setup) demo.entry.setup(demo.stage, SG);
    labOn(demo);
    if (!batched) {
      void getComputedStyle(demo.card).opacity;
      demo.card.removeAttribute('data-ds-moving');
    }
    demo.card.setAttribute('data-lab-ready', '');
    return demo;
  }

  /*
   * About 200 demos, 18,000 elements: set up all at once (each setup
   * measures, so each forces a style flush of the page) they kept a phone
   * busy for seconds. The cards render at once; a demo is set up when its
   * card comes near the viewport, when one of its buttons is pressed, or
   * in the idle time after the first frames, a few per slice, nearest
   * first. data-sg-ready comes once the cards near the viewport are set
   * up, data-lab-complete once the last one is; window.SG_LAB_SETUP(id)
   * sets one up at once (the tests call it before they drive a demo).
   *
   * The charts are set up last. Once an SVG <text> is in the page (a
   * chart's ticks), WebKit lays the whole page out again after every
   * pointer, touch or wheel listener a later setup adds, at its next
   * layout read: half a second each on this page. Set up last, they pay
   * it at most once.
   */
  function setupLab(done) {
    var pending = [];
    var charts = [];
    LAB.forEach(function (entry) {
      var card = $('[data-lab-demo="' + entry.id + '"]');
      var demo = labDemos[entry.id] = { entry: entry, card: card, stage: $('.sg-lab-stage', card), on: false, run: 0, timers: [], ready: false };
      (demo.stage.querySelector('.ds-chart') ? charts : pending).push(demo);
    });
    pending = pending.concat(charts);
    var finished = false;
    var finish = function () {
      if (finished || pending.some(function (demo) { return !demo.ready; })) return;
      finished = true;
      if (near) near.disconnect();
      var spatial = $('[data-lab-curve="--ds-ease-spatial"] [data-lab-peak]');
      if (spatial && $('#sg-lab-peak')) $('#sg-lab-peak').textContent = spatial.getAttribute('data-lab-peak');
      document.documentElement.setAttribute('data-lab-complete', '');
    };
    // Ready once the cards in and near the viewport are set up (the observer's first report comes after the first
    // frame that lays them out); the rest follow in idle time, or at once through SG_LAB_SETUP.
    requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(done, 0); }); });
    window.SG_LAB_SETUP = function (id) { var demo = labDemos[id]; if (demo) setupDemo(demo); finish(); return Boolean(demo); };
    // Everything at once, every card rendered: the sweeps of the tests (curves, stage sizes, hover, forced colours).
    window.SG_LAB_SETUP_ALL = function () {
      // One data-ds-moving on the page and one flush for all of them, as a page wires its components before its
      // first render (a flush per demo on a page this size costs seconds).
      var page = $('#sg-page');
      document.documentElement.setAttribute('data-lab-rendered', '');
      page.setAttribute('data-ds-moving', '');
      pending.forEach(function (demo) { setupDemo(demo, true); });
      void getComputedStyle(page).opacity;
      page.removeAttribute('data-ds-moving');
      finish();
    };
    // Near the viewport: first in the queue (set up in the next idle slice, so a scroll stays smooth).
    var soon = [];
    var near = typeof IntersectionObserver === 'function' ? new IntersectionObserver(function (entries) {
      entries.forEach(function (item) {
        var demo = item.isIntersecting && labDemos[item.target.getAttribute('data-lab-demo')];
        if (demo && !demo.ready && soon.indexOf(demo) < 0) soon.push(demo);
      });
    }, { rootMargin: '100% 0px' }) : null;
    if (near) pending.forEach(function (demo) { near.observe(demo.card); });
    // The rest in idle slices of a few milliseconds, so a phone stays responsive while the lab finishes.
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(function () { fn({ timeRemaining: function () { return 8; } }); }, 16); };
    var slice = function (deadline) {
      var started = performance.now();
      while (pending.some(function (demo) { return !demo.ready; })) {
        if ((deadline.timeRemaining ? deadline.timeRemaining() : 0) <= 1 && performance.now() - started > 4) break;
        if (performance.now() - started > 12) break;
        var next = soon.shift();
        while (next && next.ready) next = soon.shift();
        setupDemo(next || pending.find(function (demo) { return !demo.ready; }));
      }
      if (pending.some(function (demo) { return !demo.ready; })) idle(slice, { timeout: 500 });
      finish();
    };
    idle(slice, { timeout: 500 });
    $('#sg-page').addEventListener('click', function (event) {
      var button = event.target.closest('[data-lab]');
      var demo = button && labDemos[button.closest('[data-lab-demo]').getAttribute('data-lab-demo')];
      if (!demo) return;
      setupDemo(demo);
      var kind = button.getAttribute('data-lab');
      if (kind === 'replay') labReplay(demo);
      if (kind === 'rapid' && demo.entry.toggle) labRapid(demo);
      if (kind === 'reverse' && demo.entry.toggle) labReverse(demo);
    });
    DS.overlay.tooltips(document);
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  /* Markup into the page through an inert <template>: parsed straight into
     the document (innerHTML with an icon's <svg>), it would make Chromium
     end the render block of the pages' <link rel="expect"> before the
     named drawer indicator exists (css/optional/view-transitions.css). */
  function setHtml(element, html, prepare) {
    var template = document.createElement('template');
    template.innerHTML = html;
    if (prepare) prepare(template.content);
    element.replaceChildren(template.content);
  }

  /* The frame and the lab's opening; the demos follow once the page is
     revealed (startLab). The current item is part of the first render, so
     its colour never fades in on load: an address with a section's hash
     starts on that section's item, before the section itself exists. */
  function render() {
    $('#sg-version').textContent = 'v' + DS.version;
    setHtml($('[data-sg="menu"]'), icon('menu', 20));
    setHtml($('#sg-nav'), labNav().map(function (group) {
      return '<div class="ds-drawer__group"><p class="ds-drawer__heading">' + group.group + '</p>' + group.items.map(function (item) {
        return '<a class="ds-drawer__item" href="' + (item[3] || '#' + item[0]) + '">' + icon(item[2], 20) + '<span class="ds-drawer__label">' + item[1] + '</span></a>';
      }).join('') + '</div>';
    }).join(''));
    setHtml($('#sg-page'), labIntro());
    var hashed = location.hash && $$('#sg-nav a').some(function (a) { return a.getAttribute('href') === location.hash; });
    setActive(hashed ? location.hash.slice(1) : 'lab');
  }

  /* The mixed state exists only as a property: set it on the parsed markup
     before it goes into the page, or the boxes play their dash on load
     where the engine has styled them on insertion (Firefox, WebKit). A
     header checkbox takes the state of its rows. */
  function presetStates(root) {
    $$('[data-sg="indeterminate"], [data-check-some]', root).forEach(function (input) { input.indeterminate = true; });
    $$('table', root).forEach(function (table) {
      var all = $('thead input[type="checkbox"]', table);
      var rows = $$('tbody input[type="checkbox"]', table);
      if (!all || !rows.length) return;
      var checked = rows.filter(function (row) { return row.checked; }).length;
      all.checked = checked === rows.length;
      all.indeterminate = checked > 0 && checked < rows.length;
    });
  }

  /* ── Navigation: drawer, active section, modal drawer ──────────────── */

  var app = $('#sg-app');
  var view = $('#main');
  var modal = window.matchMedia(DS.overlay.DRAWER_QUERY);

  /* The indicators follow aria-current and aria-pressed by themselves
     (their MutationObserver): no update() after a change. */
  function setActive(id) {
    $$('#sg-nav .ds-drawer__item').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) {
        if (a.getAttribute('aria-current') !== 'page') a.setAttribute('aria-current', 'page');
      } else if (a.hasAttribute('aria-current')) {
        a.removeAttribute('aria-current');
      }
    });
  }

  /* The modal drawer through DS.overlay: the scroll lock, the inert page,
     Escape, the scrim, and focus back on the menu button at once. */
  function openDrawer(open) {
    var drawer = $('#sg-drawer');
    if (open) DS.overlay.open(drawer, { opener: $('[data-sg="menu"]') });
    else DS.overlay.close(drawer);
  }

  /* Scroll-spy with a programmatic smooth scroll: a drawer link sets its
     item current at once and mutes the spy until the scroll ends, so the
     pill does not walk through every section on the way. The end is
     scrollend where it exists (Progressive), else a quiet period without
     scroll events (--ds-dur-fast) that each scroll event restarts. The
     period only starts with the first scroll event (a busy page may start
     the smooth scroll late), and a link to where the view already is mutes
     nothing, since no scroll follows. */
  var navigating = false;
  var quietTimer = 0;
  /** The scroll-spy (an IntersectionObserver on the sections), set up by setupNavigation(). */
  var spy = null;

  /** Whether scrolling `section` to the top of the view moves the view. */
  function scrollsTo(section) {
    var margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    var top = section.getBoundingClientRect().top - view.getBoundingClientRect().top - view.clientTop - margin + view.scrollTop;
    var target = Math.max(0, Math.min(view.scrollHeight - view.clientHeight, top));
    return Math.abs(target - view.scrollTop) >= 1;
  }

  function stopNavigating() {
    navigating = false;
    clearTimeout(quietTimer);
  }

  function waitForQuiet() {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(stopNavigating, M.motionDuration(view, '--ds-dur-fast'));
  }

  function setupNavigation() {
    // Named, so the pill glides across the load between the two pages
    // (css/optional/view-transitions.css).
    // The current item is set (render()): the pill's first placement jumps
    // there, instead of growing in from an empty track on load.
    addIndicator($('#sg-nav'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator', name: 'nav' });
    var list = $('#sg-nav');
    var overflow = function () { list.classList.toggle('ds-drawer__list--overflow', list.scrollHeight > list.clientHeight + 1); };
    overflow();
    // The shades of the cut edges where scroll timelines are missing.
    DS.dom.scrollEdges(list, { axis: 'block' });
    window.addEventListener('resize', overflow);
    var visible = {};
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      if (navigating) return;
      var first = $$('.sg-section').filter(function (s) { return visible[s.id]; })[0];
      if (first) setActive(first.id);
    }, { root: view, rootMargin: '0px 0px -60% 0px' });
    // The spy starts with the sections (startLab): watching the opening
    // alone would take the pill off a hash's section on load.

    // data-scrolled (DS.dom.watchScrolled): the fallback of the scroll-driven hairlines and the top bar's tint.
    DS.dom.watchScrolled(view, app);
    // The inline sheets of the page are never opened through DS.overlay, which watches the others.
    $$('.ds-sheet__panel').forEach(function (panel) { DS.dom.watchScrolled($('.ds-sheet__body', panel)); });
    view.addEventListener('scroll', function () {
      if (navigating && !('onscrollend' in view)) waitForQuiet();
    }, { passive: true });
    if ('onscrollend' in view) view.addEventListener('scrollend', function () { if (navigating) stopNavigating(); });

    $('#sg-nav').addEventListener('click', function (event) {
      var link = event.target.closest('a');
      // A link to the other page loads it (a cross-document View Transition over http).
      if (!link || link.getAttribute('href').charAt(0) !== '#') return;
      event.preventDefault();
      var id = link.getAttribute('href').slice(1);
      var section = $('#' + id);
      setActive(id);
      stopNavigating();
      navigating = scrollsTo(section);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
      if (modal.matches) openDrawer(false);
    });
    // The scrim and Escape close the drawer by themselves (DS.overlay).
    $('[data-sg="menu"]').addEventListener('click', function () {
      openDrawer(!app.hasAttribute('data-drawer-open'));
    });
  }

  /* Snackbars through DS.overlay.toast(): at most three, the others glide;
     an error stays until it is closed. */
  function toast(text, kind) {
    return DS.overlay.toast(toastRegion(), text, { kind: kind === true ? 'error' : kind || 'success' });
  }

  /* The region, aligned with the content panel (the drawer is beside it);
     while a side sheet has taken the region in, DS.overlay sets the edge. */
  function toastRegion() {
    var region = $('#sg-toasts');
    if (region.parentNode === document.body) region.style.setProperty('--ds-toast-left', Math.round($('.ds-panel').getBoundingClientRect().left + 24) + 'px');
    return region;
  }

  /* ── Themes ───────────────────────────────────────────────────────── */

  var PRESETS = {
    square: '.ds-theme {\n  --ds-radius-xs: 0; --ds-radius-sm: 0; --ds-radius-md: 0; --ds-radius-lg: 0; --ds-radius-xl: 0; --ds-radius-2xl: 0;\n  --ds-radius-chip: 9999px;\n  --ds-elev-hover: none; --ds-elev-overlay: none;\n  --ds-dialog-border: 1px solid var(--ds-line);\n  --ds-backdrop: #ffffff; --ds-surface-low: #f6f6f6; --ds-surface-high: #f0f0f0;\n  --ds-text: #000000; --ds-primary: #202124; --ds-accent: #e8eaed; --ds-on-accent: #000000;\n  --ds-link-underline: rgba(0, 0, 0, .35);\n  --ds-alert-edge: 4px;\n}',
    dim: '.ds-theme {\n  --ds-disabled-opacity: var(--ds-state-disabled); --ds-disabled-fill: initial; --ds-disabled-ink: initial;\n}',
  };

  /* Theme files, as [href, media] for the two theme links: the template
     and the shipped themes of dist/themes/. "System" loads dark and
     contrast for the media that ask for them, as a project does. */
  var THEME_FILES = {
    example: [['../themes/example.css', '']],
    dark: [['../dist/themes/dark.css', '']],
    compact: [['../dist/themes/compact.css', '']],
    contrast: [['../dist/themes/contrast.css', '']],
    system: [['../dist/themes/dark.css', '(prefers-color-scheme: dark)'], ['../dist/themes/contrast.css', '(prefers-contrast: more)']],
  };

  /* Counts theme changes: a slow load that a newer choice overtook still
     calls its `done`, but never updates or marks the page. */
  var themeRun = 0;

  /* Once a theme's rules apply: refresh the time labels, re-place the
     indicators, then mark the theme for the tests. */
  function afterThemeChange(value) {
    refreshTimes();
    indicators.forEach(function (made) { made.update(); });
    document.documentElement.setAttribute('data-sg-theme', value);
  }

  /* Calls back once the theme link has its sheet: at once when the href is
     unchanged and the sheet is there (no load event follows), otherwise on
     the link's load or error event. */
  function whenLinkLoaded(link, href, callback) {
    if (link.href === new URL(href, document.baseURI).href && link.sheet) { callback(); return; }
    var finish = function () {
      link.removeEventListener('load', finish);
      link.removeEventListener('error', finish);
      callback();
    };
    link.addEventListener('load', finish);
    link.addEventListener('error', finish);
    link.href = href;
  }

  /* Swaps the theme in one step: inside DS.motion.transition() as a
     fade-through (View Transitions; elsewhere the view fades through with
     .ds-enter--swap), or at once (`instant`, the saved theme on load).
     Calls `then` once the swap and its motion are done. */
  function swapTheme(apply, instant, then) {
    if (instant) { apply(); requestAnimationFrame(then); return; }
    M.transition(apply, { type: 'fade-through' }).then(then, then);
  }

  /* Applies a theme (a value of the select), then calls `done`. Theme
     files load first, their links on media "not all" (a disabled link
     would not load at all); only then does the page switch, in one step,
     and afterThemeChange() re-places the indicators. */
  function applyTheme(value, done, instant) {
    var links = [$('#sg-theme-link'), $('#sg-theme-link-2')];
    var style = $('#sg-theme-style');
    var files = THEME_FILES[value] || [];
    var run = themeRun += 1;
    var finish = function () {
      if (run === themeRun) afterThemeChange(value);
      if (done) done();
    };
    var apply = function () {
      if (run !== themeRun) return;          // a newer choice took over
      style.textContent = PRESETS[value] || '';
      links.forEach(function (link, i) {
        link.media = files[i] ? files[i][1] : '';
        link.disabled = !files[i];
      });
    };
    try { localStorage.setItem('ds-styleguide-theme', value === 'file' ? 'default' : value); } catch (e) { /* storage may be blocked */ }
    if (!files.length) { swapTheme(apply, instant, finish); return; }
    var waiting = files.length;
    files.forEach(function (entry, i) {
      var link = links[i];
      if (link.disabled) link.media = 'not all';
      link.disabled = false;
      whenLinkLoaded(link, entry[0], function () {
        waiting -= 1;
        if (waiting) return;
        if (run !== themeRun) { if (done) done(); return; }
        swapTheme(apply, instant, finish);
      });
    });
  }

  /* Wires the switcher and applies the saved theme, then calls `done`. */
  function setupThemes(done) {
    var select = $('#sg-theme-select');
    var file = $('#sg-theme-file');
    var saved = 'default';
    try { saved = localStorage.getItem('ds-styleguide-theme') || 'default'; } catch (e) { saved = 'default'; }
    select.addEventListener('change', function () {
      if (select.value === 'file') { file.click(); return; }
      applyTheme(select.value);
    });
    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      if (!chosen) { select.value = 'default'; applyTheme('default'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var run = themeRun += 1;
        swapTheme(function () {
          if (run !== themeRun) return;
          $('#sg-theme-link').disabled = true;
          $('#sg-theme-link-2').disabled = true;
          $('#sg-theme-style').textContent = String(reader.result);
        }, false, function () { if (run === themeRun) afterThemeChange('file'); });
        toast('Theme loaded: ' + chosen.name);
      };
      reader.readAsText(chosen);
    });
    if (saved !== 'default' && saved !== 'file') {
      select.value = saved;
      applyTheme(saved, done, true);
    } else {
      done();
    }
  }

  // Tests wait for data-sg-ready instead of racing the first stagger: it
  // comes once the themes and the demos are set up.
  var waiting = 2;
  var started = function () {
    waiting -= 1;
    if (!waiting) document.documentElement.setAttribute('data-sg-ready', '');
  };
  render();
  // Every action gets the pointer ripple (and iOS its :active feedback).
  DS.ripple.attach(document);
  setupNavigation();
  setupSpeed();
  startLab(started);
  setupThemes(started);
  // First render: the opening staggers in once (the demos join when they come).
  M.staggerOnce($('#sg-page'));
}());
