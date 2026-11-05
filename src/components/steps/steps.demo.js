/*
 * The Steps demo: a row, a column and a bar, every status, moving on in
 * place; clickable steps (data-ds-steps) and a stage path. Registered through SG.demo() (styleguide/sg-core.js). Size, density
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

/** A step the user may go to: its mark and label in a button. */
function linked(h, label, status, current, mark, read) {
  return '<li class="ds-steps__step"' + (status ? ' data-status="' + status + '"' : '') + '><button class="ds-steps__link" type="button"' + (current ? ' aria-current="step"' : '') + '>' +
    '<span class="ds-steps__mark">' + mark + '</span><span class="ds-steps__label">' + label + (read ? '<span class="ds-sr">, ' + read + '</span>' : '') + '</span></button></li>';
}

function clickable(h) {
  return linked(h, 'Device', 'done', false, h.icon('check', 16), 'done') +
    linked(h, 'Problem', 'done', false, h.icon('check', 16), 'done') +
    linked(h, 'Contact', '', true, '3') +
    step(h, 'Photos', ' data-status="optional"', '4', 'Optional') +
    step(h, 'Review', '', '5');
}

var STAGES = ['New', 'Triaged', 'In progress', 'Waiting', 'Resolved'];

function path(h, current, links, error) {
  return STAGES.map(function (label, index) {
    var status = index < current ? 'done' : (error && index === current ? 'error' : '');
    var mark = status === 'done' ? h.icon('check', 16) : status === 'error' ? h.icon('alertCircle', 16) : String(index + 1);
    var read = status === 'done' ? 'done' : status === 'error' ? 'needs attention' : '';
    if (links && index <= current) return linked(h, label, status, index === current, mark, read);
    return step(h, label, (status ? ' data-status="' + status + '"' : '') + (index === current ? ' aria-current="step"' : ''), mark, '', read);
  }).join('');
}

SG.demo('steps', {
  title: 'Steps',
  group: 'navigation',
  need: 'Show where the user is in a few steps or a pipeline: done, current, upcoming, optional or in error, in a row, a column, a bar or a stage path, steps to go back to',
  lead: 'Where the user is in a short sequence or a pipeline. A step is no button unless it holds a .ds-steps__link: then the user may go to it. A status is never told by colour alone: a check, an icon, a word, the weight.',
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

      h.section('Clickable', '<ol class="ds-steps" aria-label="Report a problem, clickable" data-ds-steps data-demo="clickable">' + clickable(h) + '</ol>' +
        '<ol class="ds-steps ds-steps--vertical" aria-label="Report a problem, clickable, in a column" data-ds-steps style="max-inline-size: 360px; margin-block-start: var(--ds-space-5);">' + clickable(h) + '</ol>',
        'A done step holds a button: the user goes back to it. data-ds-steps moves aria-current and a screen reader hears the step; the page may cancel ds:change (a step that must validate first). Upcoming steps get no button until they may be reached.') +

      h.section('Stage path', '<ol class="ds-steps ds-steps--path" aria-label="Ticket 1042: stages">' + path(h, 2, false, false) + '</ol>' +
        '<ol class="ds-steps ds-steps--path" aria-label="Ticket 1043: stages, clickable" data-ds-steps data-demo="path" style="margin-block-start: var(--ds-space-4);">' + path(h, 2, true, false) + '</ol>' +
        '<ol class="ds-steps ds-steps--path" aria-label="Ticket 1044: stages, one needs attention" style="margin-block-start: var(--ds-space-4);">' + path(h, 3, false, true) + '</ol>',
        'The stages of a pipeline as chevrons: done ones tonal with a check, the current one filled, one that needs attention in the error colours with its icon. The second path takes the stages it has passed as buttons. At 600px of the content only the current label shows.') +

      h.section('Keyboard', '<p class="ds-muted">Plain steps are no tab stops: the page\'s own links and buttons are. A step with a button is one: <kbd class="ds-kbd">Tab</kbd> reaches it, <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> goes there. A screen reader reads the list, its <code>aria-current="step"</code> and the words of each step.</p>');
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
    // A step pressed in the clickable lists: the page says where the user went.
    root.addEventListener('ds:change', function (event) {
      if (!event.target.matches('[data-ds-steps]')) return;
      h.toast('Back to ' + event.detail.step.querySelector('.ds-steps__label').firstChild.textContent + '.', 'info');
    });
  },
});
