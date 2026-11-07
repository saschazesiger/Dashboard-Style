/*
 * The Charts demo: DS.chart (lines and areas with gaps, thresholds and an
 * annotation; grouped, stacked, horizontal and 100% columns; a combo on
 * two axes; sparklines; donut, pie and ring; gauge and bar gauge; live
 * data that morphs; a chart read from its table), then the CSS-only marks
 * of 2.x: meters with their tones, columns, columns that open, grouped
 * columns with a sparkline. Registered through SG.demo()
 * (styleguide/sg-core.js); the build wraps this file into
 * styleguide/demos.js. Size, density and shape come from the options
 * panel around it; a tone goes on the mark it means, with words next to it.
 */

/* Hourly and daily points of a fixed day, so every render is the same. */
function hours(count) {
  var out = [];
  for (var i = 0; i < count; i += 1) out.push('2026-11-04T' + (i < 10 ? '0' : '') + i + ':00');
  return out;
}

function days(count, from) {
  var out = [];
  var start = new Date(2026, 9, from || 22);
  for (var i = 0; i < count; i += 1) {
    var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    out.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
  }
  return out;
}

/* A smooth, repeatable wave around `base`. */
function wave(count, base, swing, phase) {
  var out = [];
  for (var i = 0; i < count; i += 1) out.push(Math.round(base + swing * Math.sin((i + (phase || 0)) / 3.2) + swing * 0.4 * Math.cos((i + (phase || 0)) * 1.7)));
  return out;
}

function chartFigure(h, spec, caption, extra) {
  return '<figure class="ds-chart" data-ds-chart="' + h.esc(JSON.stringify(spec)) + '"' + (extra || '') + '>' +
    (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
}

var LATENCY_API = wave(24, 220, 60, 0);
var LATENCY_WEB = wave(24, 320, 70, 4);
LATENCY_WEB[6] = null;
LATENCY_WEB[7] = null;

function chartsHtml(h) {
  var tone = h.tone || null;
  var lines = chartFigure(h, {
    type: 'line', labels: hours(24), curve: 'monotone',
    series: [{ name: 'API', values: LATENCY_API }, { name: 'Web', values: LATENCY_WEB }],
    y: { label: 'ms' }, format: { maximumFractionDigits: 0 },
    thresholds: [{ value: 400, label: 'Limit 400 ms', tone: 'error' }],
    annotations: [{ at: '2026-11-04T14:00', label: 'Deploy' }],
  }, 'Response time per hour', ' data-chart-live="line"');
  var areas = chartFigure(h, {
    type: 'area', stack: 'normal', curve: 'monotone', labels: days(14),
    series: [{ name: 'Laptops', values: wave(14, 120, 12, 1) }, { name: 'Desktops', values: wave(14, 80, 8, 3) }, { name: 'Phones', values: wave(14, 60, 10, 6) }, { name: 'Printers', values: wave(14, 20, 4, 2) }],
  }, 'Devices online per day, by type');
  var grouped = chartFigure(h, {
    type: 'column', labels: ['W40', 'W41', 'W42', 'W43', 'W44', 'W45'],
    series: [{ name: 'Opened', values: [12, 15, 9, 18, 11, 14] }, { name: 'Closed', values: [9, 14, 12, 11, 16, 6] }, { name: 'Reopened', values: [2, 4, 1, 3, 5, 2] }],
    annotations: [{ from: 'W45', to: 'W45', label: 'This week' }],
  }, 'Tickets per week', ' data-chart-live="columns"');
  var stacked = chartFigure(h, {
    type: 'column', stack: 'normal', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [{ name: 'Low', values: [8, 6, 9, 7, 10, 2, 1] }, { name: 'Normal', values: [14, 12, 16, 13, 11, 3, 2] }, { name: 'High', values: [3, 5, 2, 6, 4, 1, 0] }],
  }, 'Tickets per day, by priority');
  var bars = chartFigure(h, {
    type: 'bar', labels: ['Laptops', 'Desktops', 'Tablets', 'Phones', 'Printers', 'Servers'],
    series: [{ name: 'Devices', values: [412, 268, 133, 351, 74, 28] }],
    thresholds: [{ value: 300, label: 'Licences' }],
  }, 'Devices by kind');
  var percent = chartFigure(h, {
    type: 'column', stack: 'percent', patterns: true, labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    series: [{ name: 'Solved', values: [62, 70, 58, 75, 81] }, { name: 'Waiting', values: [25, 20, 30, 17, 12] }, { name: 'Open', values: [13, 10, 12, 8, 7] }],
  }, 'Ticket status per month, share (hatched)');
  var combo = chartFigure(h, {
    type: 'combo', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [{ name: 'Tickets', values: [42, 38, 51, 47, 30, 8, 5] }, { name: 'Hours to solve', values: [5.2, 6.1, 4.8, 7.4, 6.6, 3.1, 2.8], axis: 'end' }],
    y: { label: 'Tickets' }, y2: { label: 'Hours', format: { maximumFractionDigits: 1 } },
  }, 'Tickets and time to solve');
  var spark = function (figure, label, spec) {
    return '<div class="ds-tile"><p class="ds-tile__label"><span>' + label + '</span></p><p class="ds-tile__value">' + figure + '</p>' +
      '<div class="ds-tile__trend">' + chartFigure(h, spec, '', '') + '</div></div>';
  };
  var sparks = '<div class="ds-tiles ds-tiles--3">' +
    spark('342', 'Requests per minute', { type: 'sparkline', title: 'Requests per minute', series: [{ name: 'Requests', values: wave(20, 300, 40, 2), tone: tone }], tooltip: true }) +
    spark('1,284', 'Devices online', { type: 'sparkline', mark: 'area', title: 'Devices online', series: [{ name: 'Devices', values: wave(20, 1200, 60, 5) }] }) +
    spark('12', 'Tickets today', { type: 'sparkline', mark: 'bar', title: 'Tickets per day', labels: days(14), series: [{ name: 'Tickets', values: [3, 5, 4, 7, 6, 2, 8, 5, 9, 6, 4, 7, 10, 12] }] }) +
    '</div>';
  var donut = chartFigure(h, {
    type: 'donut', labels: ['Email', 'Portal', 'Phone', 'Chat', 'Walk-in', 'Letter'],
    series: [{ name: 'Tickets', values: [184, 122, 86, 54, 12, 4] }],
  }, 'Tickets by channel');
  var pie = chartFigure(h, {
    type: 'pie', labels: ['Documents', 'Images', 'Video', 'Backups'], patterns: true,
    series: [{ name: 'Storage', values: [120, 340, 610, 930] }], format: 'bytes',
  }, 'Storage by kind (hatched)');
  var ring = chartFigure(h, {
    type: 'ring', max: 100, format: { style: 'unit', unit: 'percent' },
    series: [{ name: 'CPU', values: [64] }, { name: 'Memory', values: [81] }, { name: 'Disk', values: [47] }],
  }, 'Server load');
  var zones = [{ to: 70, tone: 'success', label: 'Normal' }, { to: 90, tone: 'warning', label: 'High' }, { tone: 'error', label: 'Critical' }];
  var gauge = chartFigure(h, { type: 'gauge', value: 76, name: 'CPU', zones: zones, format: { style: 'unit', unit: 'percent' }, label: 'CPU' }, 'Processor load', ' data-chart-live="gauge"');
  var bargauge = chartFigure(h, {
    type: 'bargauge', max: 100, labels: ['Server 1', 'Server 2', 'Server 3', 'Server 4'],
    series: [{ name: 'Disk', values: [42, 77, 93, 18] }], zones: zones, format: { style: 'unit', unit: 'percent' },
  }, 'Disk use per server');
  var table = '<figure class="ds-chart" data-ds-chart="column"><figcaption>Devices that checked in, per day (from its table)</figcaption>' +
    '<table class="ds-table"><thead><tr><th>Day</th><th>Laptops</th><th data-ds-chart-mark="line">Phones</th></tr></thead><tbody>' +
    [['Mon', 42, 30], ['Tue', 38, 33], ['Wed', 51, 29], ['Thu', 47, 35], ['Fri', 30, 31]].map(function (row) {
      return '<tr><th>' + row[0] + '</th><td>' + row[1] + '</td><td>' + row[2] + '</td></tr>';
    }).join('') + '</tbody></table></figure>';
  var empty = chartFigure(h, { type: 'line', labels: [], series: [{ name: 'Requests', values: [] }] }, 'No data yet');

  return h.section('Lines and areas',
      '<div class="ds-grid-2">' + h.card('', lines) + h.card('', areas) + '</div>',
      'Time series on a time axis in the page\'s locale: a gap where a value is missing, a threshold and an annotation with their words, series 2 to 4 dashed with their marker shapes. Point at the plot, or Tab to it and use the arrow keys; the legend shows and hides a series, the table icon shows the table.') +
    h.section('Columns and bars',
      '<div class="ds-grid-2">' + h.card('', grouped) + h.card('', stacked) + h.card('', bars) + h.card('', percent) + '</div>',
      'Grouped and stacked columns, horizontal bars and a 100% stack. Bars are value bars: clipped at their share, so a new value glides and the rounded end keeps its shape.') +
    h.section('Combo, two axes', h.card('', combo), 'Columns and a line on a second axis: both axes say what they count.') +
    h.section('Sparklines', sparks, 'A line, an area and bars at 32px next to their figure, named by a summary; the first one is a tab stop with a tooltip.') +
    h.section('Donut, pie and ring',
      '<div class="ds-grid-2">' + h.card('', donut) + h.card('', pie) + '</div>' + h.card('', ring),
      'The fifth slice and later fold into Other; each slice\'s share stands in the legend.') +
    h.section('Gauge and bar gauge',
      '<div class="ds-grid-2">' + h.card('', gauge) + h.card('', bargauge) + '</div>',
      'A value in its zone, always with the zone\'s word.') +
    h.section('Live data',
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-chart-action="chart-values">' + h.icon('sync', 16) + 'New data</button>' +
      '<button class="ds-btn ds-sm" type="button" data-chart-action="chart-stream" aria-pressed="false">' + h.icon('play', 16) + 'Stream</button></div>',
      'New data morphs the lines, glide the bars and count the figures (the response time chart, the tickets per week, the gauge); Stream adds a point every second and the window slides.') +
    h.section('From a table, and empty',
      '<div class="ds-grid-2">' + h.card('', table) + h.card('', empty) + '</div>',
      'data-ds-chart="column" on a figure with a table: the table is the data and stays the text equivalent.');
}
var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var CHART_SETS = [[42, 38, 51, 47, 30, 8, 5], [36, 44, 40, 52, 41, 12, 9], [28, 31, 45, 39, 50, 6, 11]];

function columnsHtml(values, interactive) {
  var max = Math.max.apply(null, values);
  return values.map(function (value, index) {
    var share = 'style="--ds-share:' + (value / max).toFixed(3) + '"';
    var parts = '<span class="ds-columns__value">' + value + '</span><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-columns__label">' + DAYS[index] + '</span>';
    if (interactive) return '<li><button class="ds-columns__col" type="button" ' + share + ' aria-label="' + DAYS[index] + ': ' + value + ' tickets" data-chart-action="open">' + parts + '</button></li>';
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

SG.demo('chart', {
  title: 'Charts',
  group: 'data',
  need: 'Show a share, a figure per day or week, or a trend at a glance',
  lead: 'DS.chart draws SVG charts from a table or a spec: line, area, column, bar, combo, sparkline, donut, pie, ring, gauge and bar gauge. A cursor with a tooltip follows the pointer and the keyboard (one tab stop, each point announced), the legend shows and hides series, a toggle shows the table, and live data morphs in. Below them, the CSS-only meters, columns and legends; all from the chart roles: four series in a fixed order, each at 3:1.',
  options: { sizes: true, density: true, shape: true, tones: ['neutral', 'primary', 'info', 'success', 'warning', 'error'] },

  render: function (h) {
    return chartsHtml(h) + h.section('Meters, columns and legends', legacyHtml(h), 'The CSS-only marks: a fill clipped at its share (--ds-share), never scaled, so its round end keeps its shape; the first render fills from zero, later values glide.');
  },

  // What a page writes itself: new values, a new meter reading, the first fill, opening a day.
  wire: function (root, h) {
    return wireCharts(root, h);
  }
});

function legacyHtml(h) {
    var spark = SPARK.map(function (value, index) {
      return '<li class="ds-columns__col' + (index === SPARK.length - 1 ? ' ds-columns__col--highlight' : '') + '" style="--ds-share:' + (value / 12).toFixed(3) + '"><span class="ds-columns__fill"></span></li>';
    }).join('');
    // The panel's tone goes on the first meter's fill and its legend key: tones read their own class.
    var tone = h.tone ? ' ds-tone-' + h.tone : '';
    return '<div class="ds-grid-2">' +
      h.card('Meters', '<div class="sg-meters" data-chart="meters">' +
        '<p class="sg-meter-label"><span>Disk</span><strong class="ds-num" data-chart="disk">62%</strong></p><span class="ds-meter' + tone + '" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62" aria-valuetext="62% used" style="--ds-share:.62"></span>' +
        '<p class="sg-meter-label"><span>Memory: high</span><strong class="ds-num">91%</strong></p><span class="ds-meter ds-tone-warning" role="meter" aria-label="Memory" aria-valuemin="0" aria-valuemax="100" aria-valuenow="91" aria-valuetext="91% used, high" style="--ds-share:.91"></span>' +
        '<p class="sg-meter-label"><span>Battery health</span><strong class="ds-num">48%</strong></p><span class="ds-meter ds-tone-neutral" role="meter" aria-label="Battery health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="48" aria-valuetext="48%" style="--ds-share:.48"></span></div>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-chart-action="meter">' + h.icon('sync', 16) + 'New disk value</button></div>' +
        '<p class="ds-muted">DS.dom.progress sets the share and its ARIA; the meter glides on --ds-ease-value while its figure counts (DS.motion.countUp) in the same task: both land on the same frame.</p>') +
      h.card('Columns', '<figure class="ds-columns" data-chart="columns"><figcaption class="ds-sr">Devices that checked in, per day</figcaption><ol class="ds-columns__plot">' + columnsHtml(CHART_SETS[0]) + '</ol></figure>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-chart-action="values">' + h.icon('sync', 16) + 'New values</button><button class="ds-btn ds-sm" type="button" data-chart-action="fill">Fill again</button></div>' +
        '<p class="ds-muted">New values glide; Fill again plays the first render (DS.motion.enterAll(marks, \'fill\'), .ds-enter--fill).</p>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      h.card('Columns that open', '<figure class="ds-columns"><figcaption class="ds-sr">Tickets per day</figcaption><ol class="ds-columns__plot">' + columnsHtml(CHART_SETS[1], true) + '</ol></figure>' +
        '<p class="ds-muted">Each column is a button that opens its day: a state layer, an inset ring and the ripple, no morph.</p>') +
      h.card('Grouped, with a sparkline', '<figure class="ds-columns ds-columns--grouped"><figcaption class="ds-sr">Tickets opened, closed and reopened per week</figcaption>' +
        '<div class="ds-scroll-x" tabindex="0" role="group" aria-label="Tickets per week"><ol class="ds-columns__groups">' + groupsHtml() + '</ol></div></figure>' +
        '<ul class="ds-legend"><li><span class="ds-legend__key"></span>Opened</li><li><span class="ds-legend__key ds-legend__key--s2"></span>Closed</li><li><span class="ds-legend__key ds-legend__key--s3"></span>Reopened</li></ul>' +
        '<div class="sg-spark"><p class="sg-spark__figure">12</p><figure class="ds-columns ds-columns--mini" role="img" aria-label="Tickets per day, last 14 days: highest 12 today"><ol class="ds-columns__plot" aria-hidden="true">' + spark + '</ol></figure></div>') +
      '</div>';
}

function wireCharts(root, h) {
    var M = window.DS.motion;
    var stream = null;
    var tick = 0;
    var chartOf = function (name) {
      var el = h.$('[data-chart-live="' + name + '"]', root);
      return el ? window.DS.core.get(el, 'chart') : null;
    };
    var nextValues = function () {
      tick += 1;
      var line = chartOf('line');
      if (line) line.set({ series: [{ name: 'API', values: wave(24, 220 + (tick % 3) * 30, 60, tick * 2) }, { name: 'Web', values: wave(24, 320 - (tick % 2) * 40, 70, tick * 3 + 4) }] });
      var columns = chartOf('columns');
      if (columns) columns.set({ series: [{ name: 'Opened', values: wave(6, 13, 5, tick) }, { name: 'Closed', values: wave(6, 11, 5, tick + 2) }, { name: 'Reopened', values: wave(6, 3, 2, tick + 1) }] });
      var gauge = chartOf('gauge');
      if (gauge) gauge.set({ value: [76, 48, 94, 63][tick % 4] });
    };
    var slide = function () {
      var line = chartOf('line');
      if (!line) return;
      var spec = line.get();
      var last = new Date(spec.labels[spec.labels.length - 1]);
      var next = new Date(last.getTime() + 3600000);
      var stamp = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(next.getDate()).padStart(2, '0') + 'T' + String(next.getHours()).padStart(2, '0') + ':00';
      tick += 1;
      line.set({
        labels: spec.labels.slice(1).concat(stamp),
        series: spec.series.map(function (entry, index) { return { name: entry.name, values: entry.values.slice(1).concat(wave(1, index ? 320 : 220, 60, tick * 1.3 + index * 4)[0]) }; }),
      });
    };
    var stopStream = function () {
      if (stream) clearInterval(stream);
      stream = null;
      var button = h.$('[data-chart-action="chart-stream"]', root);
      if (button) button.setAttribute('aria-pressed', 'false');
    };
    var at = 0;
    var marks = function (scope) { return h.$$('.ds-meter, .ds-columns__col', scope); };
    // The marks fill from zero once, on the first render (.ds-enter--fill).
    M.enterAll(marks(root), 'fill', { stagger: false });
    var onClick = function (event) {
      var button = event.target.closest('[data-chart-action]');
      if (!button || !root.contains(button)) return;
      var action = button.getAttribute('data-chart-action');
      var columns = h.$('[data-chart="columns"]', root);
      if (action === 'values') {
        at = (at + 1) % CHART_SETS.length;
        var values = CHART_SETS[at];
        var max = Math.max.apply(null, values);
        h.$$('.ds-columns__col', columns).forEach(function (col, index) {
          col.style.setProperty('--ds-share', (values[index] / max).toFixed(3));
          h.$('.ds-columns__value', col).textContent = String(values[index]);
        });
      }
      if (action === 'fill') M.enterAll(marks(columns), 'fill', { stagger: false });
      if (action === 'meter') {
        var meter = h.$('[data-chart="meters"] .ds-meter', root);
        var next = Number(meter.getAttribute('aria-valuenow')) >= 60 ? 27 : 84;
        // DS.dom.progress() sets the share and its ARIA in one call.
        window.DS.dom.progress(meter, next / 100, { valueText: next + '% used' });
        M.countUp(h.$('[data-chart="disk"]', root), next, { format: function (value) { return Math.round(value) + '%'; } });
      }
      if (action === 'open') h.toast('Opened the tickets of ' + button.getAttribute('aria-label').split(':')[0] + '.', 'info');
      if (action === 'chart-values') nextValues();
      if (action === 'chart-stream') {
        if (stream) stopStream();
        else {
          button.setAttribute('aria-pressed', 'true');
          slide();
          stream = setInterval(slide, h.slow(1000));
        }
      }
    };
    // A page's own reaction to a chosen point.
    var onSelect = function (event) {
      if (event.target.closest('[data-chart-live="columns"]') && event.detail) h.toast('Opened the tickets of ' + event.detail.label + '.', 'info');
    };
    root.addEventListener('click', onClick);
    root.addEventListener('ds:select', onSelect);
    return function () {
      stopStream();
      root.removeEventListener('click', onClick);
      root.removeEventListener('ds:select', onSelect);
    };
}
