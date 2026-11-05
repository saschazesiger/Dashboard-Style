/*
 * The Popover demo: a share box with a form and a foot, the four placements
 * with the arrow, a filter popover, a hover card on a person's name and a
 * long body that scrolls. Opening, placing and closing come from the system
 * (data-ds-popover, DS.init()); wire() holds only the message after an action.
 */
function trigger(h, id, label, extra) {
  return '<button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + id + '" data-ds-popover="#' + id + '"' + (extra || '') + '>' + label + '</button>';
}

function head(h, id, title) {
  return '<div class="ds-popover__head"><h2 class="ds-popover__title" id="' + id + '-t">' + title + '</h2>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-popover__close" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>';
}

SG.demo('popover', {
  title: 'Popover',
  group: 'overlays',
  need: 'Show a small form, a share box or details next to the control that opened it, without leaving the page',
  lead: 'A non-modal panel anchored to its trigger, in the top layer: a press outside, Escape or focus leaving it close it. The options panel changes its padding (density) and radius (shape).',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var share = h.uid('share');
    var filter = h.uid('filter');
    var long = h.uid('long');
    var person = h.uid('person');
    var sides = ['top', 'end', 'bottom', 'start'];
    var placed = sides.map(function (side) {
      var id = h.uid('side');
      return trigger(h, id, side.charAt(0).toUpperCase() + side.slice(1), ' data-ds-popover-placement="' + side + '" data-demo="side-' + side + '"') +
        '<div class="ds-popover ds-popover--tip ds-popover--arrow" id="' + id + '" role="dialog" aria-labelledby="' + id + '-t" hidden>' +
        '<div class="ds-popover__head"><h2 class="ds-popover__title" id="' + id + '-t">Placed ' + side + '</h2></div>' +
        '<div class="ds-popover__body"><p>It takes the other side when there is no room here.</p></div></div>';
    }).join('');

    return h.section('Share box', '<div class="sg-row">' +
      trigger(h, share, h.icon('share', 16) + 'Share', ' data-demo="share"') +
      '<div class="ds-popover ds-popover--arrow" id="' + share + '" role="dialog" aria-labelledby="' + share + '-t" hidden data-demo="share-panel">' +
      head(h, share, 'Share LAPTOP-0042') +
      '<div class="ds-popover__body"><div class="ds-field"><label class="ds-field__label" for="' + share + '-to">Send to</label>' +
      '<input class="ds-input" id="' + share + '-to" type="email" autocomplete="off" placeholder="ada@example.com"></div></div>' +
      '<div class="ds-popover__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>' +
      '<button class="ds-btn ds-btn--filled" type="button" data-ds-close data-toast="Shared with the address.">Send</button></div></div></div>',
      'Focus moves to the field; Tab past Send closes it and moves on, Escape closes it onto the button.') +

      h.section('Placement and arrow', '<div class="sg-row" style="display:flex;flex-wrap:wrap;gap:var(--ds-space-2);justify-content:center">' + placed + '</div>',
        'data-ds-popover-placement on the trigger: bottom (the default), top, start or end. With the arrow it centres on its trigger.') +

      h.section('Without arrow, aligned with the start edge', '<div class="sg-row">' +
        trigger(h, filter, h.icon('filter', 16) + 'Filters', ' data-demo="filter"') +
        '<div class="ds-popover" id="' + filter + '" role="dialog" aria-labelledby="' + filter + '-t" hidden>' +
        head(h, filter, 'Filter devices') +
        '<div class="ds-popover__body"><fieldset class="ds-field"><legend class="ds-field__label">Status</legend>' +
        ['Online', 'Offline', 'Retired'].map(function (label, index) {
          return '<label class="ds-check"><input type="checkbox"' + (index === 0 ? ' checked' : '') + '> ' + label + '</label>';
        }).join('') + '</fieldset></div>' +
        '<div class="ds-popover__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Clear</button>' +
        '<button class="ds-btn ds-btn--filled" type="button" data-ds-close data-toast="Showing 12 devices.">Apply</button></div></div></div>') +

      h.section('Hover card', '<p>Assigned to <a href="#" data-ds-popover="#' + person + '" data-ds-popover-trigger="hover" aria-describedby="' + person + '" data-demo="person">Ada Lovelace</a>, since 09:12.</p>' +
        '<div class="ds-popover ds-popover--tip ds-popover--arrow" id="' + person + '" role="group" aria-label="Ada Lovelace" hidden data-demo="person-card">' +
        '<div class="ds-popover__head"><h2 class="ds-popover__title">Ada Lovelace</h2></div>' +
        '<div class="ds-popover__body"><p>Field engineer, Devices team. 14 open tickets.</p></div>' +
        '<div class="ds-popover__foot"><a class="ds-link-btn" href="#">Open the profile</a></div></div>',
        'A mouse resting on the name opens it after a moment, keyboard focus at once; the pointer may cross onto the card. On touch the link keeps its own tap.') +

      h.section('Long content', '<div class="sg-row">' + trigger(h, long, 'Release notes', ' data-demo="long"') +
        '<div class="ds-popover ds-popover--arrow" id="' + long + '" role="dialog" aria-labelledby="' + long + '-t" hidden>' +
        head(h, long, 'Product 4.2') +
        '<div class="ds-popover__body" tabindex="0">' +
        ['Faster sync for devices with many tickets.', 'The device list remembers its columns.', 'Exports keep the filter of the list.', 'Owners can hand a device over in one step.', 'Retired devices leave the search.', 'Tickets show who changed them last.', 'The audit log groups changes by day.', 'Keyboard shortcuts for the common actions.'].map(function (text) {
          return '<p>' + text + '</p>';
        }).join('') + '</div></div></div>',
        'Never taller than the room on its side: its body scrolls.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> opens it and moves focus in, <kbd class="ds-kbd">Tab</kbd> past either end closes it, <kbd class="ds-kbd">Escape</kbd> closes it and focus goes back to the trigger.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var action = event.target.closest('[data-toast]');
      if (action) h.toast(action.getAttribute('data-toast'), 'info');
      if (event.target.closest('a[href="#"]')) event.preventDefault();
    });
  },
});
