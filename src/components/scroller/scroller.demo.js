/*
 * The Horizontal scroller demo: a strip that scrolls sideways, a reel of
 * cards, a column that scrolls down, and the place of a "Latest" pill in a
 * log. The options panel's density reaches the reel's gap; the width option
 * narrows the panel the strips scroll in. What a project writes itself: the
 * calls of DS.dom.scrollEdges() and DS.dom.followEnd().
 */
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var DEVICES = ['LAPTOP-0042', 'LAPTOP-0017', 'MONITOR-0007', 'PRINTER-0003', 'TABLET-0121', 'PHONE-0300', 'DOCK-0044'];
var LOG = ['Synced LAPTOP-0042.', 'Imported 12 devices.', 'TABLET-0121 is back online.', 'Exported the list as CSV.', 'Restarted PRINTER-0003.', 'Ada Lovelace signed in.', 'Grace Hopper took MONITOR-0007.', 'Nightly sync finished.'];

SG.demo('scroller', {
  title: 'Horizontal scroller',
  group: 'layout',
  need: 'Let a wide strip or a tall column scroll on its own with edge fades, a reel of cards, and float a jump pill in a log',
  lead: 'Content wider or taller than its room scrolls on its own, with a fade at each end that still has content to show. A strip that fits fades nowhere.',
  options: { sizes: false, density: true, shape: false, tones: false },

  render: function (h) {
    var months = MONTHS.concat(MONTHS).map(function (month, index) {
      return '<div style="flex:none;padding:var(--ds-space-2) var(--ds-space-4)"><span class="ds-meta">' + month + '</span><br><strong>' + (380 + ((index * 53) % 120)) + '</strong></div>';
    }).join('');
    return h.section('A strip that scrolls sideways', '<div class="ds-scroll-x" tabindex="0" role="region" aria-label="Check-ins per month" data-demo="strip"><div style="display:flex;inline-size:max-content">' + months + '</div></div>',
      'Nothing inside takes focus, so the strip is the tab stop.') +

      h.section('A strip that fits', '<div class="ds-scroll-x" data-demo="fits"><p class="ds-muted">Fits its panel: no fade, no scrollbar.</p></div>') +

      h.section('Reel', '<div class="ds-scroll-x ds-scroll-x--reel" role="region" aria-label="Devices" data-demo="reel">' + DEVICES.map(function (name) {
        return '<a class="ds-card ds-card--interactive" href="#scroller-demo"><span class="ds-card__title">' + name + '</span><span class="ds-muted">Issued, synced today.</span></a>';
      }).join('') + '</div>', 'Each child a share of the panel, so the next one peeks in; the scroll rests on the start of one. The cards take focus, so the reel needs no tab stop of its own.') +

      h.section('A column that scrolls down', '<div class="ds-scroll-y" tabindex="0" role="region" aria-label="Activity" style="--ds-scroll-max-height:160px" data-demo="column">' + LOG.concat(LOG).map(function (line) {
        return '<p class="ds-muted">' + line + '</p>';
      }).join('') + '</div>', 'Its scrollbar keeps its room whether it shows or not, where the browser has scrollbar-gutter.') +

      h.section('A pill in a log', '<div class="ds-scroll-y" style="--ds-scroll-max-height:160px" data-demo="log" tabindex="0" role="region" aria-label="Log">' + LOG.concat(LOG).map(function (line) {
        return '<p class="ds-muted">' + line + '</p>';
      }).join('') + '<div class="ds-jump"><div class="ds-presence" hidden><button class="ds-btn ds-btn--tonal ds-btn--icon" type="button" aria-label="Latest">' + h.icon('arrowDown', 20) + '</button></div></div></div>',
      'Scroll up: the pill floats above the bottom edge and takes no room.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the strip, where nothing inside takes focus; the arrow keys scroll it, with an inset ring and no fades while it holds the focus.</p>');
  },

  wire: function (root, h) {
    var cleanups = [
      DS.dom.scrollEdges(h.$('[data-demo="strip"]', root)),
      DS.dom.scrollEdges(h.$('[data-demo="reel"]', root)),
      DS.dom.scrollEdges(h.$('[data-demo="column"]', root), { axis: 'block' }),
    ];
    var log = h.$('[data-demo="log"]', root);
    cleanups.push(DS.dom.scrollEdges(log, { axis: 'block' }));
    cleanups.push(DS.dom.followEnd(log, { pill: h.$('.ds-presence', log) }));
    root.addEventListener('click', function (event) {
      if (event.target.closest('a[href="#scroller-demo"]')) event.preventDefault();
    });
    return function () {
      cleanups.forEach(function (handle) { if (handle && handle.destroy) handle.destroy(); });
    };
  },
});
