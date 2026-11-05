/*
 * The Meter variants demo: a segmented score, threshold marks, rings and
 * gauges in every tone with their words, bar gauges with zones, and a
 * button that sets new shares (they glide, the figures count). Registered
 * through SG.demo() (styleguide/sg-core.js). Size, density and shape come
 * from the options panel; the panel's tone goes on the meters of the tone
 * row, since a meter reads only its own.
 */
var GAUGE_TONES = [['primary', 'Storage', 0.42, '42% used'], ['success', 'Backups', 0.96, '96% complete'], ['warning', 'CPU', 0.84, '84%, high'], ['error', 'Memory', 0.97, '97%, critical']];

function gaugeHtml(h, tone, label, share, words, arc, threshold) {
  var percent = Math.round(share * 100);
  return '<div class="ds-gauge' + (arc ? ' ds-gauge--arc' : '') + (tone ? ' ds-tone-' + tone : '') + '" role="meter" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '" aria-valuetext="' + words + '" style="--ds-share: ' + share + '" data-demo="gauge">' +
    (threshold ? '<span class="ds-gauge__threshold" style="--ds-share: ' + threshold + '" aria-hidden="true"></span>' : '') +
    '<span class="ds-gauge__value" aria-hidden="true">' + percent + '%</span><span class="ds-gauge__label" aria-hidden="true">' + label + '</span></div>';
}

function barGaugeHtml(h, label, share, note, glyph) {
  var id = h.uid('bar-gauge');
  var percent = Math.round(share * 100);
  return '<div class="ds-bar-gauge" role="meter" aria-labelledby="' + id + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '" aria-valuetext="' + percent + '%' + (note ? ', ' + note.toLowerCase() : '') + '" style="--ds-share: ' + share + '; --ds-bar-gauge-warning: .7; --ds-bar-gauge-error: .9" data-demo="bar-gauge">' +
    '<span class="ds-bar-gauge__label" id="' + id + '">' + label + '</span><span class="ds-bar-gauge__value" aria-hidden="true">' + percent + '%</span>' +
    '<span class="ds-bar-gauge__track" aria-hidden="true"></span>' +
    (note ? '<span class="ds-bar-gauge__note" aria-hidden="true">' + h.icon(glyph, 16) + note + '</span>' : '') + '</div>';
}

SG.demo('meter', {
  title: 'Meter variants',
  group: 'data',
  need: 'Show a share of a known whole as a segmented bar, a ring, a gauge or a bar gauge, with thresholds',
  lead: 'Beyond the thin linear meter: a score in steps, threshold marks, a ring, a gauge and a bar gauge with warning and error zones. Each one says its value in words; a colour alone never does.',
  options: { sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var tones = GAUGE_TONES.filter(function (row) { return !h.tone || row[0] === h.tone; });
    if (!tones.length) tones = [[h.tone, 'Queue', 0.6, '60% full']];
    return h.section('Linear, with a threshold', '<div class="ds-card" data-demo="linear">' +
        '<p class="ds-muted">Disk: 62% used, limit 80%</p>' +
        '<span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62" aria-valuetext="62% used, limit 80%" style="--ds-share: .62" data-demo="share"><span class="ds-meter__threshold" style="--ds-share: .8" aria-hidden="true"></span></span>' +
        '<p class="ds-muted">Quota: 91% used, above its limit of 80%</p>' +
        '<span class="ds-meter ds-tone-error" role="meter" aria-label="Quota" aria-valuemin="0" aria-valuemax="100" aria-valuenow="91" aria-valuetext="91% used, above the 80% limit" style="--ds-share: .91"><span class="ds-meter__threshold" style="--ds-share: .8" aria-hidden="true"></span></span>' +
        '</div>', 'The mark keeps its own share; the words say what it means.') +

      h.section('Segmented', '<div class="ds-card" data-demo="segmented">' +
        '<p class="ds-muted">Password strength: strong (4 of 5)</p>' +
        '<span class="ds-meter ds-meter--segmented ds-tone-success" role="meter" aria-label="Password strength" aria-valuemin="0" aria-valuemax="5" aria-valuenow="4" aria-valuetext="Strong" style="--ds-share: .8"></span>' +
        '<p class="ds-muted">Setup: 2 of 3 steps</p>' +
        '<span class="ds-meter ds-meter--segmented" role="meter" aria-label="Setup" aria-valuemin="0" aria-valuemax="3" aria-valuenow="2" aria-valuetext="2 of 3 steps" style="--ds-share: .6667; --ds-meter-segments: 3"></span>' +
        '</div>') +

      h.section('Ring and gauge', '<div class="sg-row" data-demo="gauges">' +
        tones.map(function (row) { return gaugeHtml(h, row[0], row[1], row[2], row[3], false, 0); }).join('') +
        '</div><div class="sg-row">' +
        tones.map(function (row) { return gaugeHtml(h, row[0], row[1], row[2], row[3] + (row[2] > 0.8 ? ', above the 80% limit' : ''), true, 0.8); }).join('') +
        gaugeHtml(h, null, 'Idle', 0, '0%', true, 0) +
        '</div><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="shuffle">' + h.icon('refresh', 16) + 'New values</button></div>',
        'Every gauge says its value in aria-valuetext; the figure inside is aria-hidden. The tick marks the 80% limit.') +

      h.section('Bar gauge', '<div class="ds-card" data-demo="bars">' +
        barGaugeHtml(h, 'Memory', 0.84, 'High', 'alert') +
        barGaugeHtml(h, 'Disk', 0.46, '', '') +
        barGaugeHtml(h, 'Swap', 0.94, 'Critical', 'alertCircle') +
        barGaugeHtml(h, 'Network', 0, 'No traffic', 'info') +
        '</div>', 'Zones from 70% (warning) and 90% (error) show on the track, lit up to the value and faint beyond it.') +

      h.section('Narrow', '<div class="ds-card" style="max-inline-size: 320px">' +
        barGaugeHtml(h, 'A long label that does not fit beside its figure', 0.73, 'Above 70%', 'alert') +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted">A meter is no stop of its own: nothing here takes focus. A screen reader reads the name and the value text.</p>');
  },

  // What a page writes itself: new values from its data. The shares glide,
  // the figures count on the same frame.
  wire: function (root, h) {
    var M = window.DS.motion;
    var onClick = function (event) {
      var button = event.target.closest('[data-demo="shuffle"]');
      if (!button || !root.contains(button)) return;
      h.$$('[data-demo="gauge"], [data-demo="bar-gauge"]', root).forEach(function (meter) {
        var next = Math.round(Math.random() * 100);
        meter.style.setProperty('--ds-share', String(next / 100));
        meter.setAttribute('aria-valuenow', String(next));
        meter.setAttribute('aria-valuetext', next + '%');
        var figure = meter.querySelector('.ds-gauge__value, .ds-bar-gauge__value');
        if (figure) M.countUp(figure, next, { from: parseFloat(figure.textContent) || 0, format: function (value) { return Math.round(value) + '%'; } });
      });
    };
    root.addEventListener('click', onClick);
    M.enterAll(h.$$('.ds-gauge, .ds-bar-gauge', root), 'fill', { stagger: false });
  },
});
