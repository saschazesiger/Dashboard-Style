/*
 * The Toggletip demo: the info button on the label row of a field, next to a
 * figure and a heading, a card placed above, and a blocked one. Opening,
 * placing, the announcement and closing come from the system
 * (data-ds-toggletip, DS.init()).
 */
function card(h, id, title, text, link) {
  return '<div class="ds-popover ds-popover--tip ds-popover--arrow" id="' + id + '" role="group" aria-label="' + title + '" hidden>' +
    '<div class="ds-popover__head"><h3 class="ds-popover__title">' + title + '</h3></div>' +
    '<div class="ds-popover__body"><p>' + text + '</p></div>' +
    (link ? '<div class="ds-popover__foot"><a class="ds-link-btn" href="#">' + link + '</a></div>' : '') + '</div>';
}

function tip(h, id, label, extra) {
  return '<button class="ds-toggletip" type="button" aria-label="' + label + '" aria-expanded="false" aria-controls="' + id + '" data-ds-toggletip="#' + id + '"' + (extra || '') + '>' + h.icon('info', 16) + '</button>';
}

SG.demo('toggletip', {
  title: 'Toggletip',
  group: 'overlays',
  need: 'Explain a field or a figure in a help card that opens on a click or tap of an info button',
  lead: 'An info button that opens a help card on a click or a tap, never on hover; a screen reader hears the card when it opens. The options panel changes the button through size, touch and shape.',
  options: { sizes: true, density: false, shape: true, tones: false },

  render: function (h) {
    var serial = h.uid('serial');
    var serialHelp = h.uid('serial-help');
    var owner = h.uid('owner');
    var ownerHelp = h.uid('owner-help');
    var uptime = h.uid('uptime');
    var above = h.uid('above');
    var blocked = h.uid('blocked');
    return h.section('Next to a field label', '<div class="ds-form-grid" style="max-inline-size:640px">' +
      '<div class="ds-field"><label class="ds-field__label" for="' + serial + '">Serial number</label>' +
      tip(h, serialHelp, 'About the serial number', ' data-demo="serial"') +
      card(h, serialHelp, 'Serial number', 'On the sticker under the device: 8 to 12 letters and digits.', 'Where to find it') +
      '<input class="ds-input" id="' + serial + '" type="text" autocomplete="off" placeholder="SN-00000000"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="' + owner + '">Owner</label>' +
      tip(h, ownerHelp, 'About the owner', ' data-demo="owner"') +
      card(h, ownerHelp, 'Owner', 'The person who answers for the device. Tickets about it go to them first.') +
      '<input class="ds-input" id="' + owner + '" type="text" autocomplete="off" value="Ada Lovelace"></div></div>',
      'The label and the button share the label row; the card takes no room.') +

      h.section('Next to a figure', '<p class="ds-muted">Uptime this month ' + tip(h, uptime, 'About uptime', ' data-demo="uptime"') + '</p>' +
        card(h, uptime, 'Uptime', 'The share of the month the device answered its checks. Planned maintenance does not count.', 'How it is measured') +
        '<p class="ds-muted">Placed above ' + tip(h, above, 'About the placement', ' data-ds-toggletip-placement="top" data-demo="above"') + '</p>' +
        card(h, above, 'Placed above', 'data-ds-toggletip-placement picks the side; with no room it flips.')) +

      h.section('States', '<p class="ds-muted">Blocked ' + tip(h, blocked, 'About the warranty', ' aria-disabled="true" data-demo="blocked"') + '</p>' +
        card(h, blocked, 'Warranty', 'Only for devices bought this year.'),
        'Open, the button takes the primary ink and says expanded; a blocked one keeps its focus but does not open.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> opens the card and a screen reader hears it; focus stays on the button and <kbd class="ds-kbd">Tab</kbd> reaches the link. <kbd class="ds-kbd">Escape</kbd> closes it.</p>');
  },

  wire: function (root) {
    root.addEventListener('click', function (event) {
      if (event.target.closest('a[href="#"]')) event.preventDefault();
    });
  },
});
