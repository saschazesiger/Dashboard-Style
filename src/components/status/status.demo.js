/*
 * The Status demo: every tone with its icon and word, the running chip, a
 * polled chip patched in place by DS.dom.morphHtml, and tags. Registered
 * through SG.demo() (styleguide/sg-core.js). Size, density and shape come from
 * the options panel around it; the panel's tone goes on the chips of the tone
 * row, since a chip reads only its own.
 */
var TONES = [['success', 'check', 'Synced'], ['warning', 'alert', 'Expires soon'], ['error', 'alertCircle', 'Failed'], ['info', 'info', 'Update ready'], ['primary', 'sparkles', 'Assigned'], ['neutral', 'clock', 'Queued']];
var POLL = [['ds-status--running', '', 'Syncing'], ['ds-tone-success', 'check', 'Synced'], ['ds-tone-error', 'alertCircle', 'Failed']];

function chip(h, cls, glyph, word) {
  var mark = glyph ? h.icon(glyph, 16) : '<span class="ds-spinner ds-status__spinner" aria-hidden="true"></span>';
  return '<span class="ds-status' + (cls ? ' ' + cls : '') + '">' + mark + '<span>' + word + '</span></span>';
}

SG.demo('status', {
  title: 'Status chip and tag',
  group: 'feedback',
  need: 'Show the state of one item with an icon and a word, or label it with a tag',
  lead: 'Status is never colour alone: always an icon and a word, on the tonal container of its tone. Show chips for deviations, not for the normal case.',
  options: { sizes: true, density: false, shape: true, tones: true },

  render: function (h) {
    var tones = TONES.filter(function (row) { return !h.tone || row[0] === h.tone; });
    return h.section('Tones', '<div class="sg-row" data-demo="tones">' + tones.map(function (row) {
      return chip(h, 'ds-tone-' + row[0], row[1], row[2]);
    }).join('') + '</div>') +

      h.section('Running and idle', '<div class="sg-row">' +
        chip(h, 'ds-status--running', '', 'Running') + chip(h, '', 'clock', 'Waiting') + chip(h, '', 'ban', 'Off') + '</div>') +

      h.section('A live chip', '<div class="sg-row"><button class="ds-btn ds-sm ds-btn--quiet" type="button" data-demo="poll" aria-pressed="false">Poll every 1.5s</button><span data-demo="polled">' + chip(h, POLL[0][0], POLL[0][1], POLL[0][2]) + '</span></div>' +
        '<p class="ds-muted">Rendered with DS.dom.morphHtml: the kept chip changes colour over 250ms, an icon that comes in new fades in and springs up, the word changes at once.</p>') +

      h.section('A long label', '<div style="max-width:200px">' + chip(h, 'ds-tone-warning', 'alert', 'The warranty of this device ends within the next thirty days') + '</div>' +
        '<p class="ds-muted">Fully round at one line; a label that wraps keeps soft corners.</p>') +

      h.section('Tags: words, not states or counts', '<div class="sg-row"><span class="ds-tag">Preview</span><span class="ds-tag">' + h.icon('sparkles', 16) + 'Beta</span><span class="ds-tag ds-tone-neutral">' + h.icon('tag', 16) + 'External</span><span class="ds-tag ds-tone-info">Internal</span><span class="ds-tag ds-tone-success">Verified</span></div>') +

      h.section('Keyboard', '<p class="ds-muted">Chips and tags are no stops of their own; a status that changes while the user waits goes through a live region.</p>');
  },

  wire: function (root, h) {
    var holder = h.$('[data-demo="polled"]', root);
    var button = h.$('[data-demo="poll"]', root);
    var step = 0;
    var timer = 0;
    button.addEventListener('click', function () {
      var on = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(on));
      clearInterval(timer);
      if (!on) return;
      timer = setInterval(function () {
        step += 1;
        var state = POLL[step % POLL.length];
        DS.dom.morphHtml(holder, chip(h, state[0], state[1], state[2]));
      }, h.slow(1500));
    });
    return function () { clearInterval(timer); };
  },
});
