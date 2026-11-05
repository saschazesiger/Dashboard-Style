/*
 * The Reasoning disclosure demo: thoughts that stream in under "Thinking"
 * and close to "Thought for ..." at the end (auto open and close), one done
 * with the page's own summary, a long one that scrolls, and a narrow
 * column. Registered through SG.demo() (styleguide/sg-core.js).
 */
var THOUGHTS = [
  'The request asks which laptops leave their warranty before the end of the year.',
  'The device list has forty laptops; their warranty ends are in the purchase records.',
  'Eleven of them end before March, three of those are in the repair queue already.',
  'The summary should group them by month and name the three in repair first.',
];

function reasoningMarkup(h, attrs, line, thoughts, label) {
  return '<details class="ds-collapsible ds-disclosure ds-reasoning" ' + attrs + '>' +
    '<summary><span class="ds-reasoning__icon">' + h.icon('sparkle', 18) + '</span>' +
    '<span class="ds-reasoning__summary">' + h.esc(line) + '</span> <time class="ds-reasoning__time"></time>' +
    h.icon('chevronDown', 20, 'ds-chevron') + '</summary>' +
    '<div class="ds-disclosure__body ds-reasoning__body"><div class="ds-reasoning__text" tabindex="0" aria-label="' + (label || 'Thoughts') + '">' +
    thoughts.map(function (text) { return '<p>' + h.esc(text) + '</p>'; }).join('') +
    '</div></div></details>';
}

SG.demo('reasoning', {
  title: 'Reasoning disclosure',
  group: 'content',
  need: 'Keep an assistant\'s thinking collapsed under one summary line, readable on demand',
  lead: 'While it runs the line says "Thinking" with the shimmer and the thoughts stream in; at the end it closes to "Thought for ..." or the page\'s own summary.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Streaming', reasoningMarkup(h, 'data-demo="live" data-ds-reasoning data-ds-reasoning-auto', '', [THOUGHTS[0]]) +
        '<div class="sg-row">' +
        '<button class="ds-btn" type="button" data-demo="think">' + h.icon('play', 16) + 'Think again</button>' +
        '</div>', 'data-ds-reasoning-auto opens it while the thoughts come in and closes it at the end; a reader who toggles it keeps it as they left it.') +

      h.section('Done, with the page\'s summary', reasoningMarkup(h, 'data-ds-reasoning data-ds-reasoning-since="0" data-ds-reasoning-done="48000"', 'Compared the warranty dates of 40 laptops', THOUGHTS)) +

      h.section('Done, written by the module', reasoningMarkup(h, 'data-demo="written" data-ds-reasoning data-ds-reasoning-since="0" data-ds-reasoning-done="12000"', '', THOUGHTS.concat(THOUGHTS, THOUGHTS), 'Long thoughts'),
        'A long one scrolls inside its rail.') +

      h.section('Narrow', '<div style="max-inline-size: 260px">' + reasoningMarkup(h, 'data-ds-reasoning data-ds-reasoning-since="0" data-ds-reasoning-done="9000"', 'Grouped the devices by warranty end and month', THOUGHTS.slice(0, 2)) + '</div>') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Tab reaches the summary; Enter or Space opens it. The thoughts take focus to scroll. The line is no live region: the answer that follows says the result.</p>');
  },

  wire: function (root, h) {
    var live = h.$('[data-demo="live"]', root);
    var text = h.$('.ds-reasoning__text', live);
    var timers = [];
    var run = function () {
      timers.forEach(clearTimeout);
      timers = [];
      var thinking = DS.core.get(live, 'reasoning');
      if (!thinking) return;
      text.replaceChildren();
      thinking.set({ done: false, since: Date.now() });
      THOUGHTS.forEach(function (thought, index) {
        timers.push(setTimeout(function () {
          var p = document.createElement('p');
          p.textContent = thought;
          text.append(p);
        }, h.slow(700 * (index + 1))));
      });
      timers.push(setTimeout(function () { thinking.set({ done: true }); }, h.slow(700 * (THOUGHTS.length + 1))));
    };
    h.$('[data-demo="think"]', root).addEventListener('click', run);
    // DS.init() finds the new markup in a moment; then the first run starts.
    timers.push(setTimeout(run, 0));
    return function () { timers.forEach(clearTimeout); };
  },
});
