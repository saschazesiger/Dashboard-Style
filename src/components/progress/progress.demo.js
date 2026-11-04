/*
 * The Progress demo: shares, the flat look, an unknown share, the run from
 * waiting to done, the label's places and the tones. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density and shape come from the
 * options panel around it; the panel's tone goes on the bars of the tone row,
 * since progress reads only its own.
 */
var TONES = [['primary', 'Sync'], ['info', 'Notes'], ['success', 'Backup done'], ['warning', 'Disk almost full'], ['error', 'Import failing'], ['neutral', 'Queue']];

function bar(share, name, label, detail, cls, text) {
  return '<div class="ds-progress' + (cls ? ' ' + cls : '') + '"' + (share === null ? '' : ' style="--ds-progress:' + share + '"') + '>' +
    '<div class="ds-progress__track" role="progressbar" aria-label="' + name + '" aria-valuemin="0" aria-valuemax="100"' + (share === null ? ' aria-valuetext="' + text + '"' : ' aria-valuenow="' + Math.round(share * 100) + '"') + '><div class="ds-progress__bar"></div></div>' +
    '<p class="ds-progress__label">' + label + '</p>' + (detail ? '<p class="ds-progress__detail">' + detail + '</p>' : '') + '</div>';
}

SG.demo('progress', {
  title: 'Progress',
  group: 'feedback',
  need: 'Show how far a known or unknown amount of work has come',
  lead: 'A bar that ends at the share, a gap, the remaining track and a stop dot; its value glides. The label says what it means, never the colour alone.',
  options: { variants: ['flat'], sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var flat = h.variant === 'flat' ? 'ds-progress--flat' : '';
    var tones = TONES.filter(function (row) { return !h.tone || row[0] === h.tone; });
    return h.section('A known share', '<div class="ds-stack" data-demo="shares">' +
      bar(0.05, 'Export', '5%', '102 of 2,030 rows', flat) +
      bar(0.4, 'Import', '40%', '812 of 2,030 rows', flat) +
      bar(1, 'Backup', '100%', 'Done', flat) +
      bar(0.4, 'Upload (flat)', '40%', 'flat: no gap, no stop dot, no wave', 'ds-progress--flat') + '</div>' +
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="advance">Advance</button></div>') +

      h.section('An unknown share', '<div class="ds-stack">' +
        bar(null, 'Preparing', 'Preparing the import ...', '', 'ds-progress--indeterminate', 'Preparing') +
        bar(null, 'Queued export', 'Waiting for a free worker ...', '', 'ds-progress--waiting', 'Waiting') +
        '<div data-demo="run-holder">' + bar(0, 'Import run', 'Ready', 'Start runs waiting, preparing, 30%, done') + '</div></div>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="run">Start</button></div>' +
        '<p class="ds-muted">While the share is unknown the bar has no aria-valuenow but an aria-valuetext; the first share sets aria-valuenow again. The segments stop and fade out, and the bar grows from 0 to its share.</p>') +

      h.section('Where the label sits', '<div class="ds-stack" data-demo="labels">' +
        bar(0.6, 'Under the track', 'Under the track (60%)', '1,218 of 2,030 rows') +
        bar(0.6, 'Above the track', 'Above the track (60%)', '1,218 of 2,030 rows', 'ds-progress--label-above') +
        bar(0.6, 'At the end', '60%', '1,218 of 2,030 rows', 'ds-progress--label-end') + '</div>') +

      h.section('Tones, each with its word', '<div class="ds-stack" data-demo="tones">' + tones.map(function (row) {
        return bar(0.7, row[1], row[1], '', 'ds-tone-' + row[0] + (flat ? ' ' + flat : ''));
      }).join('') + '</div>') +

      h.section('Keyboard', '<p class="ds-muted">No stop of its own. The track is a progressbar with a name and a value; a share that matters at once also goes through a live region.</p>');
  },

  wire: function (root, h) {
    var timers = [];
    var share = 0.4;
    var run = function () {
      var p = h.$('[data-demo="run-holder"] .ds-progress', root);
      var label = h.$('.ds-progress__label', p);
      var detail = h.$('.ds-progress__detail', p);
      var say = function (one, two) { label.textContent = one; detail.textContent = two; };
      timers.forEach(clearTimeout);
      timers = [];
      p.style.setProperty('--ds-progress', '0');
      DS.dom.progress(p, null, { waiting: true, valueText: 'Waiting' });
      say('Waiting for a free worker ...', 'queued');
      timers.push(setTimeout(function () {
        DS.dom.progress(p, null, { valueText: 'Preparing' });
        say('Preparing the import ...', 'reading the file');
      }, h.slow(1200)));
      timers.push(setTimeout(function () { DS.dom.progress(p, 0.3); say('30%', '609 of 2,030 rows'); }, h.slow(3000)));
      timers.push(setTimeout(function () { DS.dom.progress(p, 1); say('100%', 'Done'); }, h.slow(4500)));
    };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'run') run();
      if (kind === 'advance') {
        share = share >= 1 ? 0.1 : Math.min(1, share + 0.2);
        h.$$('[data-demo="shares"] .ds-progress', root).slice(1, 2).forEach(function (el) {
          DS.dom.progress(el, share);
          DS.motion.countUp(h.$('.ds-progress__label', el), Math.round(share * 100), { format: function (value) { return Math.round(value) + '%'; } });
        });
      }
    });
    return function () { timers.forEach(clearTimeout); };
  },
});
