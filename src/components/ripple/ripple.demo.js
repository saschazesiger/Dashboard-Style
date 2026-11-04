/*
 * The Ripple demo: every kind of host, the opt-out, an element of the page's
 * own, the blocked hosts and the keyboard. The page has already called
 * DS.ripple.attach(document), so nothing here wires a press. Size, density,
 * shape and touch come from the options panel around it: the ripple follows
 * each host, also the square ones.
 */
/* What a project's own element brings: its frame, from the tokens. */
var OWN = 'padding: var(--ds-space-3) var(--ds-space-4); border: 1px solid var(--ds-line-2); border-radius: calc(var(--ds-radius-card) * var(--ds-shape, 1));';

function chip(label) {
  return '<button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">' + label + '</span></span></button>';
}

SG.demo('ripple', {
  title: 'Ripple',
  group: 'motion',
  need: 'Answer a press with a ripple from the pointer, and hold quick presses visible',
  lead: 'Press and hold anything on this page: a circle of the content colour grows from the pointer out to the farthest corner, and fades when the press ends. One DS.ripple.attach(document) wires every action, also the ones rendered later. The options panel changes the hosts around it: the ripple measures each one and is clipped by its radius, so a square host ripples in a square.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var row = h.uid('row');
    return h.section('Actions', '<div class="sg-row" data-demo="buttons">' +
      '<button class="ds-btn" type="button">Export</button>' +
      '<button class="ds-btn ds-btn--filled" type="button">Save</button>' +
      '<button class="ds-btn ds-btn--tonal" type="button">Add entry</button>' +
      '<button class="ds-btn ds-btn--text" type="button">Details</button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Edit">' + h.icon('pencil', 20) + '</button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="Minimize">' + h.icon('minimize', 20) + '</button>' +
      '</div>') +

      h.section('Other hosts', '<div class="sg-row" data-demo="hosts">' + chip('Laptops') + chip('Printers') + '</div>' +
        '<div class="ds-grid-2">' +
        '<button class="ds-card ds-card--interactive" type="button" data-demo="card"><span class="ds-card__title">PRINTER-0003</span><span class="ds-muted">The whole card is one button.</span></button>' +
        '<ul class="ds-list ds-list--interactive" aria-label="Devices"><li class="ds-list__item"><span class="ds-list__title"><a class="ds-list__action" href="#' + row + '">LAPTOP-0042</a></span></li></ul>' +
        '</div>') +

      h.section('Your own element', '<div class="sg-row">' +
        '<div class="ds-pressable" role="button" tabindex="0" data-demo="pressable" style="' + OWN + '">.ds-pressable: the state layer, the ring and the ripple</div>' +
        '<div data-ds-ripple tabindex="0" role="button" data-demo="own" style="' + OWN + '">data-ds-ripple: only the ripple</div>' +
        '</div>') +

      h.section('Colour', '<div class="sg-row"><button class="ds-btn" type="button" style="--ds-ripple-color: var(--ds-primary)">--ds-ripple-color on one button</button></div>') +

      h.section('No ripple', '<div class="sg-row" data-demo="blocked">' +
        '<button class="ds-btn ds-btn--filled" type="button" disabled>Disabled</button>' +
        '<button class="ds-btn ds-btn--filled" type="button" aria-disabled="true">aria-disabled</button>' +
        '<button class="ds-btn ds-btn--filled" type="button" aria-busy="true">Busy</button>' +
        '<span data-ds-ripple="off"><button class="ds-btn" type="button">data-ds-ripple="off"</button></span>' +
        '<button class="ds-link-btn" type="button">An inline link</button>' +
        '</div><p class="ds-muted">Blocked hosts and inline links never ripple; data-ds-ripple="off" opts a host or a whole region out. Without DS.ripple.attach() the flat state layer stays the press feedback.</p>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> on a focused host ripples from its centre. The span is aria-hidden, so it never changes the host\'s name. In forced colours there is no ripple.</p>');
  },
});
