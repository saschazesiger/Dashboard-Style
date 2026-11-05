/*
 * The Spacing demo: the gap scale on a cluster of chips, a gap on a stack
 * of cards, and the top margins (a step and auto). What a project writes
 * itself: nothing but the markup.
 */
var GAP_STEPS = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12'];

SG.demo('spacing', {
  title: 'Spacing',
  group: 'layout',
  need: 'Set the gap between parts, or the rare top margin, on the space scale',
  lead: 'The gap of a container on the space scale, and the rare top margin. An exact step: the density option does not change it.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    var squares = function () {
      return ['A', 'B', 'C', 'D'].map(function (letter) {
        return '<span class="ds-kbd" aria-hidden="true">' + letter + '</span>';
      }).join('');
    };
    return h.section('Gap', '<div class="ds-stack" data-demo="gaps">' + GAP_STEPS.map(function (step) {
        return '<div class="ds-cluster ds-cluster--nowrap"><span class="ds-meta ds-mono" style="inline-size: 7rem; flex: none">.ds-gap-' + step + '</span>' +
          '<div class="ds-cluster ds-gap-' + step + '" data-demo="gap" data-step="' + step + '">' + squares() + '</div></div>';
      }).join('') + '</div>', 'From none to --ds-space-12 (48px), on a 4px grid.') +

      h.section('On a stack of cards', '<div class="ds-stack ds-gap-2" data-demo="stack">' +
        ['LAPTOP-0042', 'LAPTOP-0017', 'MONITOR-0007'].map(function (name) {
          return '<section class="ds-card"><h3 class="ds-card__title">' + name + '</h3></section>';
        }).join('') + '</div>', '.ds-stack.ds-gap-2: the stack\'s own 16px becomes 8px.') +

      h.section('Top margin', '<div class="ds-grid" style="--ds-grid-min: 14rem" data-demo="margins">' +
        '<section class="ds-card"><p>Synced today at 09:12.</p><p class="ds-meta ds-mt-6" data-demo="mt">.ds-mt-6: set apart by 24px</p></section>' +
        '<section class="ds-card" style="display: flex; flex-direction: column; min-block-size: 12rem" data-demo="auto-card"><h3 class="ds-card__title">Ticket 1042</h3><p class="ds-muted">Battery swelling.</p>' +
        '<div class="ds-cluster ds-mt-auto" data-demo="mt-auto"><button class="ds-btn ds-btn--text ds-sm" type="button">Open ticket</button></div></section>' +
        '</div>', '.ds-mt-auto sends the card\'s action to its foot.');
  },
});
