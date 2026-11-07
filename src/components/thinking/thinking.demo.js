/*
 * The Thinking indicator demo: a run that steps through a job with its
 * time and tokens ticking, a finished one, one without icon or thought, and
 * a narrow column where the meta goes under the step. Registered through
 * SG.demo() (styleguide/sg-core.js).
 */
var RUN = [
  ['Thinking', 'Reading the request about the warranty of the laptops'],
  ['Reading the device list', 'Forty laptops, eleven of them older than three years'],
  ['Running npm test', 'Checking that the export script still passes'],
  ['Writing the summary', 'Grouping the devices by warranty end'],
];

function thinkingMarkup(h, attrs, thought, icon) {
  return '<div class="ds-thinking" ' + attrs + '>' +
    (icon === false ? '' : '<span class="ds-thinking__icon">' + h.icon('sparkle', 20) + '</span>') +
    '<span class="ds-thinking__step" aria-live="polite"><span class="ds-wheel"></span></span>' +
    '<span class="ds-thinking__meta"><time class="ds-thinking__time"></time><span class="ds-thinking__tokens"></span></span>' +
    (thought === null ? '' : '<p class="ds-thinking__thought">' + h.esc(thought) + '</p>') +
    '</div>';
}

SG.demo('thinking', {
  title: 'Thinking indicator',
  group: 'feedback',
  need: 'Show what an assistant or agent is doing while it works: the step, the thought, the time and the tokens',
  lead: 'The step rolls on a wheel with the shimmer and is spoken once; the time and the tokens tick quietly beside it.',
  options: { sizes: true, density: true, shape: false, tones: false },

  render: function (h) {
    return h.section('At work', thinkingMarkup(h, 'data-demo="run" data-ds-thinking="' + RUN[0][0] + '" data-ds-thinking-tokens="312"', RUN[0][1]) +
        '<div class="sg-row">' +
        '<button class="ds-btn" type="button" data-demo="next">' + h.icon('skipForward', 16) + 'Next step</button>' +
        '<button class="ds-btn" type="button" data-demo="finish">' + h.icon('check', 16) + 'Finish</button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" data-demo="again">' + h.icon('reset', 16) + 'Start again</button>' +
        '</div>') +

      h.section('Done', thinkingMarkup(h, 'data-demo="done" data-ds-thinking="Done" data-ds-thinking-since="0" data-ds-thinking-done="48000" data-ds-thinking-tokens="18420"', 'Eleven laptops leave warranty before March'),
        'data-ds-thinking-done stops the time (its value is the total) and the shimmer.') +

      h.section('Plain', thinkingMarkup(h, 'data-demo="plain" data-ds-thinking="Checking ticket 4211"', null, false),
        'No icon and no thought: the step and the time.') +

      h.section('Narrow', '<div style="max-inline-size: 280px">' + thinkingMarkup(h, 'data-demo="narrow" data-ds-thinking="Restarting LAPTOP-0042 and waiting for it" data-ds-thinking-tokens="96"', 'Waiting for the device to come back online after the update') + '</div>',
        'When the step and the meta do not fit on a line, the time and the tokens wrap under the step.') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Nothing takes focus. The step is a polite live region: each new step is spoken once, the ticking time never.</p>');
  },

  wire: function (root, h) {
    var run = h.$('[data-demo="run"]', root);
    var at = 0;
    var tokens = 312;
    var get = function () { return DS.core.get(run, 'thinking'); };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-demo]');
      if (!button || !get()) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'next') {
        at = Math.min(at + 1, RUN.length - 1);
        tokens += 1400;
        get().set({ step: RUN[at][0], thought: RUN[at][1], tokens: tokens, done: false });
      }
      if (kind === 'finish') get().set({ step: 'Done', thought: 'Eleven laptops leave warranty before March', done: true });
      if (kind === 'again') {
        at = 0;
        tokens = 312;
        get().set({ step: RUN[0][0], thought: RUN[0][1], tokens: tokens, since: Date.now(), done: false });
      }
    });
  },
});
