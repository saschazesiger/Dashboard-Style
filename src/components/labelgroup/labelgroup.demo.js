/*
 * The Label group demo: a ticket's labels in a card head, a table column
 * of labels, a fixed maximum, a list the page renders again and a narrow
 * card. Registered through SG.demo() (styleguide/sg-core.js). Size, shape
 * and touch come from the options panel.
 */
var LG_TICKETS = [
  { id: 41, title: 'Printer 7 jams on duplex', labels: [['Printer'], ['Waiting for parts', 'warning', 'clock'], ['Second floor'], ['Hardware'], ['Vendor'], ['Weekly report']] },
  { id: 42, title: 'Laptop 0042 will not boot', labels: [['Laptop'], ['Urgent', 'error', 'alert'], ['Ada Lovelace']] },
  { id: 43, title: 'Badge reader offline', labels: [['Access'], ['Resolved', 'success', 'check'], ['North entrance'], ['Network'], ['Firmware'], ['Follow-up'], ['Audit'], ['Product']] },
  { id: 44, title: 'New monitor request', labels: [['Request']] }
];

function lgTags(h, labels) {
  return labels.map(function (label) {
    var tone = label[1] ? ' ds-tone-' + label[1] : '';
    var icon = label[2] ? h.icon(label[2], 16) : '';
    return '<li><span class="ds-tag' + tone + '">' + icon + h.esc(label[0]) + '</span></li>';
  }).join('');
}

function lgGroup(h, name, labels, extra) {
  return '<div class="ds-label-group" data-ds-label-group' + (extra || '') + '>' +
    '<ul class="ds-label-group__list" aria-label="' + h.esc(name) + '">' + lgTags(h, labels) + '</ul></div>';
}

SG.demo('labelgroup', {
  title: 'Label group',
  group: 'feedback',
  need: 'Show the tags of one item on one line, with "+N" for the rest and all of them in a popup',
  lead: 'As many tags as fit on the line, then a "+N" button that shows every tag in a popup. It measures again when the width changes or the page renders the list again.',
  options: { sizes: true, density: false, shape: true, tones: false },

  render: function (h) {
    var t = LG_TICKETS;
    var rows = t.map(function (ticket) {
      return '<tr><td class="ds-num">' + ticket.id + '</td><td>' + h.esc(ticket.title) + '</td><td style="inline-size: 40%; max-inline-size: 0">' +
        lgGroup(h, 'Labels of ticket ' + ticket.id, ticket.labels) + '</td></tr>';
    }).join('');
    return h.section('In a card', '<div class="ds-card" style="max-inline-size: 420px" data-demo="card"><h3 class="ds-card__title">Ticket ' + t[0].id + '</h3>' +
        '<p class="ds-muted">' + h.esc(t[0].title) + '</p>' + lgGroup(h, 'Labels of ticket ' + t[0].id, t[0].labels) + '</div>',
        'The tags that do not fit wait behind "+N". Press it: the popup holds every tag; Escape closes it and focus goes back to the button.') +
      h.section('In a table column', '<div class="ds-table-wrap"><table class="ds-table" data-demo="table"><thead><tr><th class="ds-num" scope="col">Ticket</th><th scope="col">Title</th><th scope="col">Labels</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
        'Ticket 44 has one tag and no button; the others count again when the column narrows.') +
      h.section('At most two', '<div class="ds-card" data-demo="max">' + lgGroup(h, 'Groups of Printer 7', t[2].labels, ' data-ds-label-group-max="2"') + '</div>',
        '<code>data-ds-label-group-max="2"</code>: the first two, whatever the room.') +
      h.section('Rendered again', '<div class="ds-card" data-demo="live">' + lgGroup(h, 'Labels of ticket 45', t[0].labels.slice(0, 2)) +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="add">' + h.icon('plus', 16) + 'Add a label</button>' +
        '<button class="ds-btn ds-btn--text ds-sm" type="button" data-demo="reset">Reset</button></div></div>',
        'The page renders the list again with <code>DS.dom.morphHtml</code>; the group counts again by itself.') +
      h.section('Narrow', '<div class="ds-card" style="max-inline-size: 240px" data-demo="narrow">' +
        lgGroup(h, 'Labels of ticket 46', [['Configuration management database'], ['Hardware'], ['Vendor']]) + '</div>',
        'One tag left alone in too little room ends in an ellipsis.');
  },

  wire: function (root, h) {
    var extra = [['Hardware'], ['Vendor'], ['Ada Lovelace'], ['Follow-up', 'info', 'info'], ['Product'], ['Audit'], ['Second floor']];
    var count = 2;
    var render = function () {
      var list = h.$('[data-demo="live"] .ds-label-group__list', root);
      var labels = LG_TICKETS[0].labels.slice(0, 2).concat(extra.slice(0, count - 2));
      window.DS.dom.morphHtml(list, lgTags(h, labels));
    };
    var onClick = function (event) {
      if (event.target.closest('[data-demo="add"]')) {
        count = Math.min(count + 1, 2 + extra.length);
        render();
      } else if (event.target.closest('[data-demo="reset"]')) {
        count = 2;
        render();
      }
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
