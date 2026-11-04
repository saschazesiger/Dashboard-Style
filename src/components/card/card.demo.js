/*
 * The Card demo: the looks, the parts of a card, clickable and selectable
 * cards and the horizontal layout. Density, shape and touch come from the
 * options panel around it, so no card here carries an option class; the
 * panel's variant goes on the plain cards. What a project writes itself:
 * toggling the selected attribute and the toast after a click.
 */
var LOOKS = [
  ['outlined', 'The default look: a hairline on the surface.'],
  ['filled', 'A quieter block inside a card or form.'],
  ['elevated', 'Floats a little, instead of the hairline.'],
];

function look(h, name) { return name ? ' ds-card--' + name : ''; }

function plan(h, title, text, on, extra) {
  return '<button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="' + on + '" data-demo="pick"' + (extra || '') + '>' +
    '<span class="ds-card__title">' + title + '</span><span class="ds-muted">' + text + '</span>' +
    '<span class="ds-card__check" aria-hidden="true">' + h.icon('check', 16) + '</span></button>';
}

SG.demo('card', {
  title: 'Card',
  group: 'layout',
  need: 'Group related content in a block, or let a whole block open or pick something',
  lead: 'A block on a surface. Hierarchy comes from type and hairlines. A card can open something, be one choice among a few, or set its media beside its text. The options panel changes density, shape and touch around the demo.',
  options: { variants: LOOKS.map(function (entry) { return entry[0]; }), sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var looks = LOOKS.filter(function (entry) { return !h.variant || entry[0] === h.variant; });
    return h.section('Variants', '<div class="ds-grid-2" data-demo="variants">' + looks.map(function (entry) {
      return '<section class="ds-card ds-card--' + entry[0] + '"><h3 class="ds-card__title">' + entry[0].charAt(0).toUpperCase() + entry[0].slice(1) + '</h3><p class="ds-muted">' + entry[1] + '</p></section>';
    }).join('') + '</div>') +

      h.section('The parts of a card', '<section class="ds-card' + look(h, h.variant) + '" data-demo="parts">' +
        '<div class="ds-card__row"><h3 class="ds-card__title">LAPTOP-0042</h3><span class="ds-status ds-status--ok">' + h.icon('check', 16) + '<span>Managed</span></span></div>' +
        '<p class="ds-muted">Issued to Ada Lovelace. <a href="#card-demo">Open the record</a> or copy the serial <code>5CD1234XYZ</code>.</p>' +
        '<h4 class="ds-card__subtitle">Sources</h4><p class="ds-muted">Directory and device management.</p>' +
        '<div class="ds-card__section"><h4 class="ds-card__subtitle">Advanced</h4><p class="ds-muted">Asset tag, purchase date and the cost centre.</p></div>' +
        '<nav class="ds-card__links" aria-label="Related"><a class="ds-btn ds-btn--text ds-card__link" href="#card-demo">History ' + h.icon('arrowRight', 16) + '</a><a class="ds-btn ds-btn--text ds-card__link" href="#card-demo">Tickets ' + h.icon('arrowRight', 16) + '</a></nav>' +
        '<div class="ds-card__more"><button class="ds-btn" type="button">Load more</button></div>' +
        '</section>') +

      h.section('Clickable', '<div class="ds-grid-2" data-demo="clickable">' +
        '<a class="ds-card ds-card--interactive' + look(h, h.variant) + '" href="#card-demo" data-demo="open" data-name="MONITOR-0007"><h3 class="ds-card__title">MONITOR-0007</h3><p class="ds-muted">A link: the whole card goes somewhere.</p></a>' +
        '<button class="ds-card ds-card--interactive' + look(h, h.variant) + '" type="button" data-demo="open" data-name="PRINTER-0003"><span class="ds-card__row"><span class="ds-card__title">PRINTER-0003</span><span class="ds-status ds-status--warning">' + h.icon('alert', 16) + '<span>Toner low</span></span></span><span class="ds-muted">A button: hover lays a layer over it, a press turns it squarer and ripples.</span></button>' +
        '<div class="ds-card ds-card--interactive' + look(h, h.variant) + '"><div class="ds-card__row"><h3 class="ds-card__title"><a class="ds-card__action" href="#card-demo" data-demo="open" data-name="LAPTOP-0017">LAPTOP-0017</a></h3><button class="ds-btn ds-sm" type="button" data-demo="restart">Restart</button></div><p class="ds-muted">The title link stretches over the card; Restart stays a button of its own.</p></div>' +
        '<button class="ds-card ds-card--interactive' + look(h, h.variant) + '" type="button" disabled><span class="ds-card__title">Disabled</span><span class="ds-muted">Dimmed, with no hover, no press and no morph.</span></button>' +
        '<button class="ds-card ds-card--interactive' + look(h, h.variant) + '" type="button" aria-disabled="true"><span class="ds-card__title">Blocked</span><span class="ds-muted">aria-disabled: stays focusable, so it can say why.</span></button>' +
        '</div>') +

      h.section('Selectable', '<div class="ds-grid-2" role="group" aria-label="Plan" data-demo="plans">' +
        plan(h, 'Standard', 'Daily sync, 30 days of history.', 'true') +
        plan(h, 'Extended', 'Hourly sync, a year of history.', 'false') +
        plan(h, 'Archive', 'Monthly sync, kept for ten years. Blocked for this tenant.', 'false', ' aria-disabled="true"') +
        '<div class="ds-card ds-card--interactive ds-card--selectable"><h3 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="false" data-demo="pick">Custom</button></h3><p class="ds-muted">The button form of the action, with a link of its own.</p><a class="ds-link--quiet" href="#card-demo">Compare plans</a><span class="ds-card__check" aria-hidden="true">' + h.icon('check', 16) + '</span></div>' +
        '</div>', 'The tint, the ring and the check say the same: a selected card is never told by colour alone.') +

      h.section('Horizontal', '<div class="ds-stack" data-demo="horizontal">' +
        '<section class="ds-card ds-card--horizontal' + look(h, h.variant) + '"><div class="ds-card__media" role="img" aria-label="A printer">' + h.icon('printer', 24) + '</div><div class="ds-card__body"><h3 class="ds-card__title">PRINTER-0003</h3><p class="ds-muted">Media beside the body. Narrow the width in the options panel: below 416px they stack.</p></div></section>' +
        '<button class="ds-card ds-card--interactive ds-card--horizontal' + look(h, h.variant) + '" type="button" data-demo="open" data-name="MONITOR-0007"><span class="ds-card__media">' + h.icon('monitor', 24) + '</span><span class="ds-card__body"><span class="ds-card__title">MONITOR-0007</span><span class="ds-muted">Clickable and horizontal: one button.</span></span></button>' +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each clickable card and each control inside one; <kbd class="ds-kbd">Enter</kbd> opens a card, <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses a button card or picks a selectable one.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-demo]');
      if (!target) {
        if (event.target.closest('a[href="#card-demo"]')) event.preventDefault();
        return;
      }
      var kind = target.getAttribute('data-demo');
      if (kind === 'open') {
        event.preventDefault();
        h.toast('Opened ' + target.getAttribute('data-name') + '.', 'info');
      }
      if (kind === 'restart') h.toast('Restarting LAPTOP-0017.', 'info');
      if (kind === 'pick' && target.getAttribute('aria-disabled') !== 'true') {
        h.$$('[data-demo="pick"]', root).forEach(function (other) { if (other !== target) other.setAttribute('aria-pressed', 'false'); });
        target.setAttribute('aria-pressed', 'true');
      }
    });
  },
});
