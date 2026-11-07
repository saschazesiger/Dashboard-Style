/*
 * The Link demo: the four looks, in text and on their own, with their
 * icons, then a narrow card where a standalone link closes a list.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, touch and
 * shape come from the options panel around it; links take no tone.
 */
var VARIANTS = ['inline', 'standalone', 'external', 'quiet'];

SG.demo('link', {
  title: 'Link',
  group: 'actions',
  need: 'Navigate: a link in text, a standalone link, an external link with its icon, or a quiet secondary link',
  lead: 'A link goes somewhere; a button does something. In text a link keeps its underline, so colour alone never tells it apart.',
  options: { variants: VARIANTS, sizes: true, density: false, shape: true, tones: false },

  render: function (h) {
    var show = function (name) { return !h.variant || h.variant === name; };
    var external = function (label, cls) {
      return '<a class="ds-link ds-link--external' + (cls || '') + '" href="https://example.com/" target="_blank" rel="noopener noreferrer">' + label +
        h.icon('external', 16, 'ds-link__icon') + '<span class="ds-sr"> (opens in a new tab)</span></a>';
    };
    var out = '';
    if (show('inline')) {
      out += h.section('Inline', '<p data-demo="inline">Ticket 4127 is assigned to <a class="ds-link" href="#ada">Ada Lovelace</a>; the device <a class="ds-link" href="#laptop">LAPTOP-0042</a> was last seen on Monday.</p>',
        'In running text: the link colour and the underline. Under .ds-base every link looks like this; .ds-link gives the look to a region without it.');
    }
    if (show('standalone')) {
      out += h.section('Standalone', '<div class="sg-row" data-demo="standalone">' +
        '<a class="ds-link ds-link--standalone" href="#devices">All devices' + h.icon('arrowRight', 16, 'ds-link__icon') + '</a>' +
        '<a class="ds-link ds-link--standalone" href="#tickets">Open tickets' + h.icon('chevronRight', 16, 'ds-link__icon') + '</a>' +
        '<a class="ds-link ds-link--standalone" href="#settings">Settings</a>' +
        '</div>', 'On its own line or at the end of a card: the label weight, no underline until hover or focus.');
    }
    if (show('external')) {
      out += h.section('External', '<p data-demo="external">Read the ' + external('product manual') + ' before the first update.</p>' +
        '<div class="sg-row">' + external('Service status', ' ds-link--standalone') + '</div>',
        'It leaves the product: the external icon, rel="noopener noreferrer" and a screen reader text that says a new tab opens.');
    }
    if (show('quiet')) {
      out += h.section('Quiet', '<div class="sg-row" data-demo="quiet">' +
        '<a class="ds-link ds-link--standalone" href="#history">Open the device</a>' +
        '<a class="ds-link--quiet" href="#history">Show history</a>' +
        '<a class="ds-link--quiet" href="#help">Help</a>' +
        '</div>', 'A secondary link next to the main one: the quieter ink and a hairline underline.');
    }
    if (!h.variant) {
      out += h.section('In a card', '<div class="ds-card" style="max-inline-size: 360px">' +
        '<h3 class="ds-card__title">Recent tickets</h3>' +
        '<p class="ds-muted">3 open, 1 waiting for <a class="ds-link" href="#ada">Ada Lovelace</a>.</p>' +
        '<a class="ds-link ds-link--standalone" href="#tickets">All tickets' + h.icon('arrowRight', 16, 'ds-link__icon') + '</a></div>');
      out += h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each link; <kbd class="ds-kbd">Enter</kbd> follows it. The focus ring snaps in from a little further out.</p>');
    }
    return out;
  },

  wire: function (root) {
    // The demo's links stay on the page (the external ones open their tab).
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (link) event.preventDefault();
    });
  },
});
