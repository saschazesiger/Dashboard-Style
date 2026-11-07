/*
 * The Tracker demo: a device's uptime over 90 days with every state, the
 * last 30 runs of a job, a narrow card, a row the page renders again from
 * data. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density and shape come from the options panel.
 */
var TRK_WORDS = { success: 'up', info: 'maintenance', warning: 'degraded', error: 'down', empty: 'no data' };
var TRK_RUN_WORDS = { success: 'passed', info: 'skipped', warning: 'flaky', error: 'failed', empty: 'not run' };
var TRK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 90 days ending Nov 4, 2026: mostly up, a few problems at fixed places. */
function trackerDays(seed) {
  var special = { 3: 'empty', 4: 'empty', 17: 'info', 38: 'warning', 39: 'warning', 61: 'error', 74: 'warning', 86: 'error' };
  var days = [];
  for (var i = 0; i < 90; i += 1) {
    var date = new Date(Date.UTC(2026, 10, 4 - (89 - i)));
    var state = special[(i + seed) % 90] || 'success';
    var words = TRK_WORDS[state] + (state === 'error' ? ' ' + (12 + (i * 7) % 50) + ' min' : '');
    days.push({ state: state, label: TRK_MONTHS[date.getUTCMonth()] + ' ' + date.getUTCDate() + ': ' + words });
  }
  return days;
}

function trackerSummary(days) {
  var c = window.DS.tracker.counts(days);
  var up = (c.success + c.info + c.warning * 0.5) / Math.max(1, c.total - c.empty) * 100;
  return up.toFixed(1) + '% uptime, ' + c.error + (c.error === 1 ? ' failure' : ' failures') + ' in ' + c.total + ' days';
}

function trackerCells(h, list) {
  return list.map(function (cell) {
    return '<span class="ds-tracker__cell ds-tracker__cell--' + cell.state + '" role="img" aria-label="' + h.esc(cell.label) + '" data-tip="' + h.esc(cell.label) + '"></span>';
  }).join('');
}

function trackerLegend(words) {
  return '<ul class="ds-tracker__legend" aria-hidden="true">' + ['success', 'info', 'warning', 'error', 'empty'].map(function (state) {
    return '<li><span class="ds-tracker__cell ds-tracker__cell--' + state + '"></span>' + words[state].charAt(0).toUpperCase() + words[state].slice(1) + '</li>';
  }).join('') + '</ul>';
}

function trackerHtml(h, options) {
  return '<figure class="ds-tracker" data-demo="' + options.name + '">' +
    '<figcaption class="ds-tracker__head"><span class="ds-tracker__label">' + options.title + '</span><span class="ds-tracker__summary" data-demo="summary">' + options.summary + '</span></figcaption>' +
    '<div class="ds-tracker__cells" role="group" aria-label="' + h.esc(options.group) + '" data-ds-tracker>' + trackerCells(h, options.cells) + '</div>' +
    '<div class="ds-tracker__axis"><span>' + options.from + '</span><span>' + options.to + '</span></div>' +
    (options.legend ? trackerLegend(options.legend) : '') + '</figure>';
}

SG.demo('tracker', {
  title: 'Tracker',
  group: 'data',
  need: 'Show a row of status cells (uptime by day, the last runs of a job), each state with its own shape and word, and a summary',
  lead: 'A row of status cells with a summary in words. Problems stand to the full height, the calm states stay low and the doubtful ones are dashed, so a state reads without its colour; every cell names its date and state in its tooltip.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var days = trackerDays(0);
    var runs = [];
    var pattern = 'ssssswssessssssisssssssswsssse';
    for (var i = 0; i < 30; i += 1) {
      var state = { s: 'success', w: 'warning', e: 'error', i: 'info' }[pattern.charAt(i)];
      runs.push({ state: state, label: 'Run ' + (1201 + i) + ': ' + TRK_RUN_WORDS[state] });
    }
    var failed = runs.filter(function (run) { return run.state === 'error'; }).length;
    return h.section('Uptime over 90 days', '<div class="ds-card">' +
        trackerHtml(h, { name: 'uptime', title: 'Printer 7', summary: trackerSummary(days), group: 'Printer 7, last 90 days', cells: days, from: '90 days ago', to: 'Today', legend: TRK_WORDS }) +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="refresh">' + h.icon('sync', 16) + 'Next day</button></div></div>',
        'Point at a cell, or Tab into the row and use the arrow keys: each cell shows its date and state.') +
      h.section('The last 30 runs of a job', '<div class="ds-card">' +
        trackerHtml(h, { name: 'runs', title: 'Nightly backup', summary: failed + ' failed of 30 runs', group: 'Nightly backup, last 30 runs', cells: runs, from: 'Run 1201', to: 'Run 1230', legend: TRK_RUN_WORDS }) + '</div>') +
      h.section('Narrow', '<div class="ds-card" style="max-inline-size: 328px">' +
        trackerHtml(h, { name: 'narrow', title: 'Laptop 0042, every check of the north building', summary: trackerSummary(trackerDays(23)), group: 'Laptop 0042, last 90 days', cells: trackerDays(23), from: 'Aug 7', to: 'Nov 4' }) + '</div>',
        'Under 480px the gap closes to 1px, so 90 cells fit a phone; the long label ends in an ellipsis.') +
      h.section('Keyboard', '<p class="ds-muted">The row is one tab stop, starting on the most recent cell. <kbd class="ds-kbd">←</kbd> <kbd class="ds-kbd">→</kbd> move between the cells, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> go to the first and the last; the focused cell shows its tooltip, <kbd class="ds-kbd">Esc</kbd> hides it.</p>');
  },

  wire: function (root, h) {
    var shift = 0;
    var onClick = function (event) {
      if (!event.target.closest('[data-demo="refresh"]')) return;
      shift += 1;
      var figure = h.$('[data-demo="uptime"]', root);
      var days = trackerDays(shift);
      window.DS.get(h.$('.ds-tracker__cells', figure), 'tracker').set(days);
      h.$('[data-demo="summary"]', figure).textContent = trackerSummary(days);
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
