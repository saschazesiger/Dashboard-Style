/*
 * The Wheel demo: a live status line through each of its paths (the
 * module's lines through data-ds-wheel and its controller, the page's own
 * lines through DS.dom.morphHtml and DS.wheel.hooks), the hold that turns a
 * quick run of changes into one roll, a figure that ticks inside a line
 * without rolling, and a narrow line that cuts with an ellipsis. Registered
 * through SG.demo() (styleguide/sg-core.js).
 */
var STEPS = ['Thinking', 'Reading the device list', 'Running npm test', 'Checking ticket 4211', 'Writing the summary', 'Done'];

SG.demo('wheel', {
  title: 'Wheel',
  group: 'feedback',
  need: 'Say what is running right now in one line that changes often, without a spinner',
  lead: 'A status line whose new line pushes the old one out, like the drum of a counter. Every line shows for at least a moment, so a quick run of changes rolls once, to the last.',
  options: { sizes: true, density: false, shape: false, tones: false },

  render: function (h) {
    return h.section('Steps of a job', '<div class="sg-row">' +
        '<span class="ds-meta">Status</span>' +
        '<span aria-live="polite"><span class="ds-wheel" data-ds-wheel="' + STEPS[0] + '" data-ds-wheel-shimmer data-demo="slot"></span></span>' +
        '</div><div class="sg-row">' +
        '<button class="ds-btn" type="button" data-demo="next">' + h.icon('skipForward', 16) + 'Next step</button>' +
        '<button class="ds-btn" type="button" data-demo="burst">' + h.icon('zap', 16) + 'Five changes at once</button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" data-demo="reset">' + h.icon('reset', 16) + 'Start again</button>' +
        '</div><p class="ds-muted">data-ds-wheel holds the text and data-ds-wheel-shimmer adds the glint; a change of the attribute rolls. Five changes in one go roll once, to the last.</p>') +

      h.section('Rendered by the page', '<div class="sg-row">' +
        '<span class="ds-meta">Sync</span>' +
        '<span data-demo="morph"><span class="ds-wheel"><span class="ds-wheel__line" data-ds-key="Waiting">Waiting</span></span></span>' +
        '</div><div class="sg-row">' +
        '<button class="ds-btn" type="button" data-demo="sync">' + h.icon('sync', 16) + 'Sync 40 devices</button>' +
        '</div><p class="ds-muted">DS.dom.morphHtml with DS.wheel.hooks: each line is keyed by its text. "Syncing" keeps its key while its figure ticks, so it is patched in place and does not roll.</p>') +

      h.section('Narrow', '<div class="sg-row" style="max-inline-size: 160px">' +
        '<span class="ds-wheel" data-ds-wheel="Checking the warranty of LAPTOP-0042" data-demo="narrow"></span>' +
        '</div><p class="ds-muted">A line is as wide as its text, capped at the slot, and cut with an ellipsis.</p>') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">The line takes no focus. The slot sits in an <code>aria-live="polite"</code> region of the page, so each new step is spoken once; the leaving line is hidden from assistive tech.</p>');
  },

  wire: function (root, h) {
    var slot = h.$('[data-demo="slot"]', root);
    var morph = h.$('[data-demo="morph"]', root);
    var step = 0;
    var timers = [];
    var later = function (fn, ms) { timers.push(setTimeout(fn, h.slow(ms))); };
    var show = function (text) { slot.setAttribute('data-ds-wheel', text); };
    var draw = function (key, text) {
      DS.dom.morphHtml(morph, '<span class="ds-wheel"><span class="ds-wheel__line" data-ds-key="' + h.esc(key) + '">' + h.esc(text) + '</span></span>', DS.wheel.hooks);
    };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'next') {
        step = Math.min(step + 1, STEPS.length - 1);
        show(STEPS[step]);
        if (step === STEPS.length - 1) slot.removeAttribute('data-ds-wheel-shimmer');
      }
      if (kind === 'burst') {
        ['Listing devices', 'Reading LAPTOP-0042', 'Reading LAPTOP-0043', 'Reading LAPTOP-0044', 'Comparing versions'].forEach(function (text) {
          DS.core.get(slot, 'wheel').set(text, { shimmer: true });
        });
      }
      if (kind === 'reset') {
        step = 0;
        slot.setAttribute('data-ds-wheel-shimmer', '');
        show(STEPS[0]);
      }
      if (kind === 'sync') {
        timers.forEach(clearTimeout);
        timers = [];
        draw('Connecting', 'Connecting');
        for (var i = 1; i <= 40; i += 1) {
          (function (n) { later(function () { draw('Syncing', 'Syncing ' + n + ' of 40'); }, 1000 + n * 60); })(i);
        }
        later(function () { draw('Synced', 'Synced 40 devices'); }, 4000);
      }
    });
    return function () { timers.forEach(clearTimeout); };
  },
});
