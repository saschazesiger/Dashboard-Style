/*
 * DS.chart in the Motion Lab: a line and its area morph their path to new
 * data (the named exception of D14) while the bars glide on their share,
 * and a donut's slices and a gauge's arc turn while their figures count.
 * Each continues from the frame it shows when the data changes again.
 */
var LAB_CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var LAB_CHART_A = [[42, 38, 51, 47, 30, 12, 9], [5.2, 6.1, 4.8, 7.4, 6.6, 3.1, 2.8]];
var LAB_CHART_B = [[18, 44, 29, 58, 41, 33, 20], [2.4, 3.8, 6.9, 5.2, 7.8, 6.1, 4.4]];
var LAB_CHART_SETTLE = { subtree: true, transitions: true, names: ['ds-chart-morph', 'ds-fill-share', 'ds-fade-in'] };

function labChartSpec(set) {
  return {
    type: 'combo', labels: LAB_CHART_DAYS, legend: false, table: false,
    series: [{ name: 'Tickets', values: set[0] }, { name: 'Hours to solve', values: set[1], mark: 'area', axis: 'end' }],
    y2: {},
  };
}

SG_LAB.add({
  id: 'chart-morph',
  group: 'data',
  title: 'Chart: paths morph, bars glide',
  note: '<code>DS.chart.create()</code> and <code>set()</code>: the area and its line morph their path to the new data (D14) while the columns glide on <code>--ds-share</code> and <code>--ds-chart-from</code>, all on <code>--ds-ease-value</code> over <code>--ds-dur-glide</code>, so they land together. The first render fills the bars from zero and draws the line up from the baseline.',
  shows: ['DS.chart.create', '.ds-chart', '.ds-chart__line', '.ds-chart__area', '.ds-chart__bar', '.ds-enter--fill', 'ds-fill-share', '--ds-dur-glide', '--ds-ease-value'],
  html: '<figure class="ds-chart" data-lab-chart style="inline-size:100%"></figure>',
  height: 280,
  wide: true,
  setup: function (stage) {
    stage.chart = DS.chart.create(stage.querySelector('[data-lab-chart]'), labChartSpec(LAB_CHART_A));
    stage.on = false;
  },
  play: function (stage) {
    var el = stage.querySelector('[data-lab-chart]');
    stage.on = !stage.on;
    stage.chart.set(labChartSpec(stage.on ? LAB_CHART_B : LAB_CHART_A));
    return DS.motion.settled(el, LAB_CHART_SETTLE);
  },
  toggle: function (stage, on) {
    var el = stage.querySelector('[data-lab-chart]');
    stage.on = on;
    stage.chart.set(labChartSpec(on ? LAB_CHART_B : LAB_CHART_A));
    return DS.motion.settled(el, LAB_CHART_SETTLE);
  },
  state: function (stage) {
    return Boolean(stage.on);
  },
  reset: function (stage) {
    var el = stage.querySelector('[data-lab-chart]');
    if (stage.chart) stage.chart.destroy();
    stage.chart = DS.chart.create(el, labChartSpec(LAB_CHART_A));
    stage.on = false;
    return DS.motion.settled(el, LAB_CHART_SETTLE);
  },
});

SG_LAB.add({
  id: 'chart-arcs',
  group: 'data',
  title: 'Chart: slices and a gauge',
  note: 'A donut\'s slices and a gauge\'s value arc turn to their new angles on the same curve and time, and the figure in the middle counts (<code>DS.motion.countUp</code>); the gauge\'s zone word changes with it.',
  shows: ['.ds-chart__slice', '.ds-chart__value-arc', '.ds-chart__figure', 'DS.motion.countUp'],
  html: '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;inline-size:100%">' +
    '<figure class="ds-chart" data-lab-donut><figcaption>Tickets by channel</figcaption></figure>' +
    '<figure class="ds-chart" data-lab-gauge><figcaption>Processor load</figcaption></figure></div>',
  height: 300,
  wide: true,
  setup: function (stage) {
    stage.donut = DS.chart.create(stage.querySelector('[data-lab-donut]'), { type: 'donut', labels: ['Email', 'Portal', 'Phone', 'Chat'], series: [{ name: 'Tickets', values: [184, 122, 86, 54] }], legend: false, table: false });
    stage.gauge = DS.chart.create(stage.querySelector('[data-lab-gauge]'), { type: 'gauge', value: 36, zones: [{ to: 70, tone: 'success', label: 'Normal' }, { to: 90, tone: 'warning', label: 'High' }, { tone: 'error', label: 'Critical' }], format: { style: 'unit', unit: 'percent' } });
    stage.on = false;
  },
  play: function (stage) {
    return this.toggle(stage, !stage.on);
  },
  toggle: function (stage, on) {
    stage.on = on;
    stage.donut.set({ series: [{ name: 'Tickets', values: on ? [60, 140, 210, 90] : [184, 122, 86, 54] }] });
    stage.gauge.set({ value: on ? 94 : 36 });
    return Promise.all([stage.querySelector('[data-lab-donut]'), stage.querySelector('[data-lab-gauge]')].map(function (el) { return DS.motion.settled(el, LAB_CHART_SETTLE); }));
  },
  state: function (stage) {
    return Boolean(stage.on);
  },
});
