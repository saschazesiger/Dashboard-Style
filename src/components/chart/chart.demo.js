/*
 * The styleguide's Charts section (styleguide/index.html#charts): meters,
 * columns, columns that open, grouped columns with a sparkline. Built into
 * styleguide/demos.js as SG_DEMOS.chart; styleguide.js renders it, routes
 * the data-sg="ls-chart-*" actions to action() and fills marks() once on
 * the first render. `sg` holds the styleguide's helpers (section, card,
 * icon, $, $$, toast).
 */
var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var CHART_SETS = [[42, 38, 51, 47, 30, 8, 5], [36, 44, 40, 52, 41, 12, 9], [28, 31, 45, 39, 50, 6, 11]];
var chartsAt = 0;

function columnsHtml(values, interactive) {
  var max = Math.max.apply(null, values);
  return values.map(function (value, index) {
    var share = 'style="--ds-share:' + (value / max).toFixed(3) + '"';
    var parts = '<span class="ds-columns__value">' + value + '</span><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-columns__label">' + DAYS[index] + '</span>';
    if (interactive) return '<li><button class="ds-columns__col" type="button" ' + share + ' aria-label="' + DAYS[index] + ': ' + value + ' tickets" data-sg="ls-chart-col">' + parts + '</button></li>';
    return '<li class="ds-columns__col" ' + share + '>' + parts + '</li>';
  }).join('');
}

var WEEKS = [['W37', 12, 9, 2], ['W38', 15, 14, 4], ['W39', 9, 12, 1], ['W40', 18, 11, 3], ['W41', 11, 16, 5], ['W42', 14, 6, 2]];

function groupsHtml() {
  var max = 18;
  return WEEKS.map(function (week, index) {
    var current = index === WEEKS.length - 1;
    return '<li class="ds-columns__group' + (current ? ' ds-columns__group--current' : '') + '"><ol class="ds-columns__plot">' +
      '<li class="ds-columns__col" style="--ds-share:' + (week[1] / max).toFixed(3) + '"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Opened: ' + week[1] + '</span></li>' +
      '<li class="ds-columns__col ds-columns__col--s2" style="--ds-share:' + (week[2] / max).toFixed(3) + '"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Closed: ' + week[2] + '</span></li>' +
      '<li class="ds-columns__col ds-columns__col--s3" style="--ds-share:' + (week[3] / max).toFixed(3) + '"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Reopened: ' + week[3] + '</span></li></ol>' +
      '<span class="ds-columns__label">' + week[0] + (current ? '<span class="ds-sr">, this week</span>' : '') + '</span></li>';
  }).join('');
}

var SPARK = [3, 5, 4, 7, 6, 2, 8, 5, 9, 6, 4, 7, 10, 12];

/** The section's markup. */
export function render(sg) {
  var section = sg.section;
  var card = sg.card;
  var icon = sg.icon;
  var spark = SPARK.map(function (value, index) {
    return '<li class="ds-columns__col' + (index === SPARK.length - 1 ? ' ds-columns__col--highlight' : '') + '" style="--ds-share:' + (value / 12).toFixed(3) + '"><span class="ds-columns__fill"></span></li>';
  }).join('');
  return section('charts', 'Charts', 'Meters, columns and legends from the chart roles: four series in a fixed order, each at 3:1. A fill is clipped at its share (--ds-share), never scaled, so its round end keeps its shape; the first render fills from zero, later values glide.',
    '<div class="ds-grid-2">' +
    card('Meters', '<div class="sg-meters" id="sg-meters">' +
      '<p class="sg-meter-label"><span>Disk</span><strong class="ds-num" id="sg-meter-disk">62%</strong></p><span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62" aria-valuetext="62% used" style="--ds-share:.62"></span>' +
      '<p class="sg-meter-label"><span>Memory: high</span><strong class="ds-num">91%</strong></p><span class="ds-meter ds-meter--warning" role="meter" aria-label="Memory" aria-valuemin="0" aria-valuemax="100" aria-valuenow="91" aria-valuetext="91% used, high" style="--ds-share:.91"></span>' +
      '<p class="sg-meter-label"><span>Battery health</span><strong class="ds-num">48%</strong></p><span class="ds-meter ds-meter--neutral" role="meter" aria-label="Battery health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="48" aria-valuetext="48%" style="--ds-share:.48"></span></div>' +
      '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-chart-meter">' + icon('sync', 16) + 'New disk value</button></div>' +
      '<p class="ds-muted">DS.dom.progress sets the share and its ARIA; the meter glides on --ds-ease-value while its figure counts (DS.motion.countUp) in the same task: both land on the same frame.</p>') +
    card('Columns', '<figure class="ds-columns" id="sg-columns"><figcaption class="ds-sr">Devices that checked in, per day</figcaption><ol class="ds-columns__plot">' + columnsHtml(CHART_SETS[0]) + '</ol></figure>' +
      '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-chart-values">' + icon('sync', 16) + 'New values</button><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-chart-fill">Fill again</button></div>' +
      '<p class="ds-muted">New values glide; Fill again plays the first render (DS.motion.enterAll(marks, \'fill\'), .ds-enter--fill).</p>') +
    '</div>' +
    '<div class="ds-grid-2">' +
    card('Columns that open', '<figure class="ds-columns"><figcaption class="ds-sr">Tickets per day</figcaption><ol class="ds-columns__plot">' + columnsHtml(CHART_SETS[1], true) + '</ol></figure>' +
      '<p class="ds-muted">Each column is a button that opens its day: a state layer, an inset ring and the ripple, no morph.</p>') +
    card('Grouped, with a sparkline', '<figure class="ds-columns ds-columns--grouped"><figcaption class="ds-sr">Tickets opened, closed and reopened per week</figcaption>' +
      '<div class="ds-scroll-x" tabindex="0" role="group" aria-label="Tickets per week"><ol class="ds-columns__groups">' + groupsHtml() + '</ol></div></figure>' +
      '<ul class="ds-legend"><li><span class="ds-legend__key"></span>Opened</li><li><span class="ds-legend__key ds-legend__key--s2"></span>Closed</li><li><span class="ds-legend__key ds-legend__key--s3"></span>Reopened</li></ul>' +
      '<div class="sg-spark"><p class="sg-spark__figure">12</p><figure class="ds-columns ds-columns--mini" role="img" aria-label="Tickets per day, last 14 days: highest 12 today"><ol class="ds-columns__plot" aria-hidden="true">' + spark + '</ol></figure></div>') +
    '</div>');
}

/** The marks (meters and columns) that fill on the first render, inside `root` (default: the section). */
export function marks(sg, root) {
  return sg.$$('.ds-meter, .ds-columns__col', root || sg.$('#charts'));
}

/** The section's buttons (data-sg="ls-chart-*"). */
export function action(sg, name, el) {
  var $ = sg.$;
  var M = window.DS.motion;
  if (name === 'ls-chart-values') {
    chartsAt = (chartsAt + 1) % CHART_SETS.length;
    var values = CHART_SETS[chartsAt];
    var max = Math.max.apply(null, values);
    sg.$$('#sg-columns .ds-columns__col').forEach(function (col, index) {
      col.style.setProperty('--ds-share', (values[index] / max).toFixed(3));
      $('.ds-columns__value', col).textContent = String(values[index]);
    });
  }
  if (name === 'ls-chart-fill') M.enterAll(marks(sg, $('#sg-columns')), 'fill', { stagger: false });
  if (name === 'ls-chart-meter') {
    var meter = $('#sg-meters .ds-meter');
    var next = Number(meter.getAttribute('aria-valuenow')) >= 60 ? 27 : 84;
    // DS.dom.progress() sets the share and its ARIA in one call.
    window.DS.dom.progress(meter, next / 100, { valueText: next + '% used' });
    M.countUp($('#sg-meter-disk'), next, { format: function (value) { return Math.round(value) + '%'; } });
  }
  if (name === 'ls-chart-col') sg.toast('Opened the tickets of ' + el.getAttribute('aria-label').split(':')[0] + '.', 'info');
}
