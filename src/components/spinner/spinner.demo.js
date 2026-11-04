/*
 * The Spinner demo: the arc on a surface and in the text colour, the ring at
 * several shares, tones. Registered through SG.demo() (styleguide/sg-core.js).
 * Size comes from the options panel around it; the panel's tone goes on the
 * rings of the tone row, since a spinner reads only its own.
 */
var TONES = [['primary', 'Sync'], ['info', 'Notes'], ['success', 'Backup'], ['warning', 'Disk'], ['error', 'Import'], ['neutral', 'Queue']];

function ring(share, name, cls) {
  return '<span class="ds-spinner ds-spinner--determinate' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-label="' + name + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(share * 100) + '" style="--ds-progress:' + share + '"></span>';
}

SG.demo('spinner', {
  title: 'Spinner',
  group: 'feedback',
  need: 'Show a short wait in place, or a known share as a ring',
  lead: 'The inline loader: the arc grows and shrinks while it turns. Show it only after the loader delay, so fast loads never flash it. A block that waits shows the shape loader instead.',
  options: { variants: ['determinate'], sizes: true, density: false, shape: false, tones: true },

  render: function (h) {
    var tones = TONES.filter(function (row) { return !h.tone || row[0] === h.tone; });
    return (h.variant ? '' : h.section('The arc', '<div class="sg-row"><span class="ds-spinner" aria-hidden="true"></span><span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span></div>') +
      h.section('In a control', '<div class="sg-row"><button class="ds-btn ds-btn--filled" type="button"><span class="ds-spinner ds-spinner--ink ds-sm" aria-hidden="true"></span>Saving</button><button class="ds-btn" type="button"><span class="ds-spinner ds-spinner--ink" aria-hidden="true"></span>Syncing</button></div>' +
        '<p class="ds-muted">--ink takes the text colour on a faint ring of it.</p>')) +

      h.section('A share', '<div class="sg-row" data-demo="rings">' + ring(0.05, 'Upload 5%') + ring(0.4, 'Upload 40%') + ring(1, 'Upload done') + ring(0.4, 'Upload, plain ring', 'ds-spinner--flat') + '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="advance">Advance</button></div>' +
        '<p class="ds-muted">The ring never spins; its value glides, through DS.dom.progress. A wavy arc, a gap and the track; --flat keeps it plain.</p>') +

      h.section('Tones, each with its word', '<div class="sg-row" data-demo="tones">' + tones.map(function (row) {
        return '<span class="sg-row">' + ring(0.6, row[1], 'ds-tone-' + row[0]) + '<span>' + row[1] + '</span></span>';
      }).join('') + '</div>') +

      h.section('Keyboard', '<p class="ds-muted">No stop of its own. The arc is aria-hidden, and the words around it say what runs; a ring is a progressbar with a name.</p>');
  },

  wire: function (root, h) {
    var share = 0.4;
    root.addEventListener('click', function (event) {
      if (!event.target.closest('[data-demo="advance"]')) return;
      share = share >= 1 ? 0.1 : Math.min(1, share + 0.2);
      h.$$('[data-demo="rings"] .ds-spinner--determinate', root).forEach(function (el) { DS.dom.progress(el, share); });
    });
  },
});
