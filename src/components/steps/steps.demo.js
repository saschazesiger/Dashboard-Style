/*
 * The Steps demo: a row, a column and a bar, every status, moving on in
 * place. Registered through SG.demo() (styleguide/sg-core.js). Size, density
 * and shape come from the options panel around it. The page owns the status
 * of each step: it re-renders the list with DS.dom.morphHtml, so a mark stays
 * and a new check draws itself.
 */
var STEPS = ['Device', 'Problem', 'Contact'];

function step(h, label, attrs, mark, hint, read) {
  return '<li class="ds-steps__step"' + attrs + '><span class="ds-steps__mark">' + mark + '</span>' +
    '<span class="ds-steps__label">' + label + (read ? '<span class="ds-sr">, ' + read + '</span>' : '') + '</span>' +
    (hint ? '<span class="ds-steps__hint">' + hint + '</span>' : '') + '</li>';
}

function progress(h, current) {
  return STEPS.map(function (label, index) {
    var done = index < current;
    return step(h, label, (done ? ' data-status="done"' : '') + (index === current ? ' aria-current="step"' : ''), done ? h.icon('check', 16) : String(index + 1), '', done ? 'done' : '');
  }).join('');
}

function states(h) {
  return step(h, 'Device', ' data-status="done"', h.icon('check', 16), '', 'done') +
    step(h, 'Contact', ' data-status="error"', h.icon('alertCircle', 16), 'Add a phone number') +
    step(h, 'Problem', ' aria-current="step"', '3') +
    step(h, 'Photos', ' data-status="optional"', '4', 'Optional') +
    step(h, 'Review', '', '5');
}

SG.demo('steps', {
  title: 'Steps',
  group: 'navigation',
  need: 'Show where the user is in a form of a few steps: done, current, upcoming, optional or in error, in a row, a column or a bar',
  lead: 'Where the user is in a short sequence. Steps are not buttons: going back is a link or a button of the page. A status is never told by colour alone: a check, an icon, a word, the weight.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Moving on', '<ol class="ds-steps" aria-label="Report a problem" data-demo="row">' + progress(h, 1) + '</ol>' +
        '<ol class="ds-steps ds-steps--bar" aria-label="Step 2 of 3" data-demo="bar" style="margin-block: var(--ds-space-4);">' + progress(h, 1) + '</ol>' +
        '<div class="sg-row"><button class="ds-btn" type="button" data-demo="back">Back</button><button class="ds-btn ds-btn--filled" type="button" data-demo="next">Next</button></div>',
        'The check of a step that turns done draws itself; the connector and the segment follow. At 600px of the content a row shows only the current label: narrow the width in the options panel.') +

      h.section('Every status', '<ol class="ds-steps" aria-label="Every status, in a row">' + states(h) + '</ol>',
        'Done, in error with its icon and word, current, optional with a dashed ring and its word, upcoming.') +

      h.section('Vertical', '<ol class="ds-steps ds-steps--vertical" aria-label="Every status, in a column" style="max-inline-size: 360px;">' + states(h) + '</ol>',
        'A column for long or wordy sequences: labels and hints wrap, and all of them stay at every width.') +

      h.section('Bar', '<ol class="ds-steps ds-steps--bar" aria-label="Step 3 of 5, step 2 needs attention">' + states(h) + '</ol>',
        'One segment per step; the list\'s aria-label says where the user is.') +

      h.section('Keyboard', '<p class="ds-muted">Steps are no tab stops: the page\'s own links and buttons are. A screen reader reads the list, its <code>aria-current="step"</code> and the words of each step.</p>');
  },

  wire: function (root, h) {
    var current = 1;
    var row = h.$('[data-demo="row"]', root);
    var segments = h.$('[data-demo="bar"]', root);
    var show = function () {
      DS.dom.morphHtml(row, progress(h, current));
      DS.dom.morphHtml(segments, progress(h, current));
      segments.setAttribute('aria-label', 'Step ' + Math.min(current + 1, STEPS.length) + ' of ' + STEPS.length);
    };
    h.$('[data-demo="next"]', root).addEventListener('click', function () { current = Math.min(current + 1, STEPS.length); show(); });
    h.$('[data-demo="back"]', root).addEventListener('click', function () { current = Math.max(current - 1, 0); show(); });
  },
});
