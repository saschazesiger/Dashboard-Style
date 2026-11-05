/*
 * The Text utilities demo: each class on generic content (tickets,
 * devices), next to the same text without it where the difference shows.
 * The width option narrows the stage, so the cuts and breaks move. What a
 * project writes itself: the full text of a cut one in a tooltip.
 */
var SUBJECT = 'Replace the battery of LAPTOP-0042 before the next sync window, Ada Lovelace reported it swelling';
var NOTE = 'The device stopped syncing after the last update. Ada Lovelace restarted it twice and cleared the cache, the sync log shows a certificate error each time, and the support line asked for the full report before Friday.';
var HASH = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

SG.demo('text', {
  title: 'Text utilities',
  group: 'layout',
  need: 'Cut, clamp, break or keep text, set it in the code family or tabular figures, balance a heading',
  lead: 'Classes for how a run of text wraps and cuts. Narrow the stage with the width option to move the cuts.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    var row = function (label, body) {
      // A column of a readable width, so the cuts show on a wide stage too.
      return '<div class="ds-stack" style="--ds-stack-gap: var(--ds-space-1); max-inline-size: 28rem; align-content: start"><div class="ds-meta">' + label + '</div>' + body + '</div>';
    };
    return h.section('Truncate', '<div class="ds-stack" data-demo="truncate">' +
        row('.ds-truncate', '<div class="ds-truncate" data-demo="truncated" data-tip="' + h.esc(SUBJECT) + '" tabindex="0">' + h.esc(SUBJECT) + '</div>') +
        row('.ds-truncate in a .ds-cluster--nowrap row with its action', '<div class="ds-cluster ds-cluster--nowrap"><span class="ds-truncate">' + h.esc(SUBJECT) + '</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-push" type="button" aria-label="Open ticket">' + h.icon('arrowRight', 18) + '</button></div>') +
        '</div>', 'One line and an ellipsis. Point at or focus the first line: its tooltip holds the full text.') +

      h.section('Clamp', '<div class="ds-grid" style="--ds-grid-min: 16rem" data-demo="clamp">' +
        row('.ds-clamp-1', '<div class="ds-clamp-1" data-demo="clamp-1">' + h.esc(NOTE) + '</div>') +
        row('.ds-clamp-2', '<div class="ds-clamp-2" data-demo="clamp-2">' + h.esc(NOTE) + '</div>') +
        row('.ds-clamp-3', '<div class="ds-clamp-3" data-demo="clamp-3">' + h.esc(NOTE) + '</div>') +
        row('.ds-clamp with --ds-clamp-lines: 4', '<div class="ds-clamp" style="--ds-clamp-lines: 4" data-demo="clamp-hook">' + h.esc(NOTE) + '</div>') +
        '</div>') +

      h.section('Break', '<div class="ds-grid" style="--ds-grid-min: 12rem" data-demo="break">' +
        '<section class="ds-card"><p class="ds-meta">Without .ds-break</p><p class="ds-mono" data-demo="unbroken" style="overflow: hidden">' + HASH + '</p></section>' +
        '<section class="ds-card"><p class="ds-meta">.ds-break</p><p class="ds-mono ds-break" data-demo="broken">' + HASH + '</p></section>' +
        '</div>', 'A hash or a URL breaks anywhere instead of widening its column.') +

      h.section('Mono and tabular', '<div class="ds-grid" style="--ds-grid-min: 12rem" data-demo="figures">' +
        '<section class="ds-card"><p class="ds-meta">Proportional figures</p><p data-demo="proportional">1,111<br>8,888<br>4,096</p></section>' +
        '<section class="ds-card"><p class="ds-meta">.ds-tabular</p><p class="ds-tabular" data-demo="tabular">1,111<br>8,888<br>4,096</p></section>' +
        '<section class="ds-card"><p class="ds-meta">.ds-mono</p><p><span class="ds-mono" data-demo="mono">SN 4C1-77Q</span> in a sentence, at the size of the text around it.</p></section>' +
        '</div>') +

      h.section('Balance and pretty', '<div class="ds-grid" style="--ds-grid-min: 14rem" data-demo="wrap">' +
        '<section class="ds-card"><p class="ds-meta">Without</p><h3 class="ds-card__title" style="max-inline-size: 22ch">Pair a new device with the console in three steps</h3></section>' +
        '<section class="ds-card"><p class="ds-meta">.ds-balance</p><h3 class="ds-card__title ds-balance" style="max-inline-size: 22ch" data-demo="balanced">Pair a new device with the console in three steps</h3></section>' +
        '<section class="ds-card"><p class="ds-meta">.ds-pretty</p><p class="ds-pretty" data-demo="pretty">' + h.esc(NOTE) + '</p></section>' +
        '</div>', '.ds-pretty is progressive: where it is missing the paragraph wraps as usual.') +

      h.section('Keep together', '<p data-demo="nowrap">Storage left on LAPTOP-0042: <span class="ds-nowrap">512 GB</span> of <span class="ds-nowrap">1 TB</span> (.ds-nowrap, from the utilities).</p>');
  },
});
