/*
 * The List-detail demo: devices, the record of the one picked and a ticket
 * of it as a sub-detail, in a layout that folds by its own width (the
 * width option of the panel narrows the stage: 360px shows one column with
 * back buttons, the full stage two). The levels, the back buttons, the
 * focus and the entering column come from the system (data-ds-listdetail,
 * data-ds-listdetail-show); wire() holds what a page writes itself: it
 * renders the record and the ticket (DS.dom.morphHtml) and marks the open
 * row.
 */
var LD_DEVICES = [
  { id: 'd42', name: 'LAPTOP-0042', icon: 'laptop', meta: 'Notebook 14 · Building A', owner: 'Ada Lovelace', seen: 'Today, 09:12', ticket: '#42', issue: 'The battery drains overnight.' },
  { id: 'd17', name: 'LAPTOP-0017', icon: 'laptop', meta: 'Notebook 14 · Building B', owner: 'Alan Turing', seen: 'Yesterday', ticket: '#57', issue: 'The dock does not wake the screen.' },
  { id: 'p03', name: 'PRINTER-0003', icon: 'printer', meta: 'Printer · Floor 2', owner: 'Service desk', seen: '2 hours ago', ticket: '#61', issue: 'Paper jam in tray 2.' },
  { id: 'm09', name: 'MONITOR-0009', icon: 'monitor', meta: 'Display · Room 4.12', owner: 'Grace Hopper', seen: 'Mon', ticket: '#63', issue: 'Flickers at 60 Hz.' },
  { id: 't21', name: 'TABLET-0121', icon: 'tablet', meta: 'Tablet · Service desk', owner: 'Katherine Johnson', seen: 'Today, 08:40', ticket: '#64', issue: 'Cracked corner of the case.' },
];

function ldRows(h, open) {
  return LD_DEVICES.map(function (row) {
    return '<li class="ds-list__item" data-ds-key="' + row.id + '">' + h.icon(row.icon, 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#' + row.id + '" data-ds-listdetail-show="detail" data-device="' + row.id + '"' +
      (row.id === open ? ' aria-current="true"' : '') + '>' + row.name + '</a></span><span class="ds-list__meta">' + row.meta + '</span></span>' +
      h.icon('chevronRight', 20, 'ds-list__chevron') + '</li>';
  }).join('');
}

function ldRecord(h, row) {
  if (!row) {
    return '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + h.icon('laptop', 24) + '</span>' +
      '<p class="ds-empty__title">No device picked</p><p class="ds-empty__text">Pick a device in the list to see its record.</p></div>';
  }
  return '<div class="ds-stack"><ul class="ds-kv-list"><li><span>Owner</span><strong>' + row.owner + '</strong></li><li><span>Model</span><strong>' + row.meta.split(' · ')[0] + '</strong></li>' +
    '<li><span>Last seen</span><strong>' + row.seen + '</strong></li></ul>' +
    '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-ds-listdetail-show="sub">' + h.icon('ticket', 16) + 'Ticket ' + row.ticket + '</button></div></div>';
}

function ldTicket(h, row) {
  return '<div class="ds-stack"><div><span class="ds-status ds-tone-warning">' + h.icon('clock', 16) + '<span>Waiting for parts</span></span></div>' +
    '<div>' + row.issue + '</div><div class="ds-muted">Opened by ' + row.owner + '.</div></div>';
}

function ldLayout(h, ids, frame) {
  return '<div class="ds-listdetail' + (frame ? ' ds-listdetail--outlined' : '') + '" data-ds-listdetail="list" role="group" aria-label="Devices" style="--ds-listdetail-height: 480px" data-demo="layout">' +
    '<section class="ds-listdetail__list" aria-labelledby="' + ids.list + '">' +
      '<header class="ds-listdetail__head"><h3 class="ds-listdetail__title" id="' + ids.list + '">Devices</h3><span class="ds-badge ds-tone-neutral">' + LD_DEVICES.length + '</span></header>' +
      '<ul class="ds-list ds-list--interactive" aria-label="Devices" data-ld-rows>' + ldRows(h, null) + '</ul></section>' +
    '<section class="ds-listdetail__detail" aria-labelledby="' + ids.detail + '">' +
      '<header class="ds-listdetail__head"><button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__back" type="button" aria-label="Back to devices" data-tip="Back to devices">' + h.icon('arrowLeft', 20) + '</button>' +
        '<h3 class="ds-listdetail__title" id="' + ids.detail + '" data-ld-title>Device</h3>' +
        '<button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__close" type="button" aria-label="Close the device" data-tip="Close">' + h.icon('close', 20) + '</button></header>' +
      '<div class="ds-listdetail__body" data-ld-record>' + ldRecord(h, null) + '</div></section>' +
    '<section class="ds-listdetail__sub" aria-labelledby="' + ids.sub + '">' +
      '<header class="ds-listdetail__head"><button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__back" type="button" aria-label="Back to the device" data-tip="Back">' + h.icon('arrowLeft', 20) + '</button>' +
        '<h3 class="ds-listdetail__title" id="' + ids.sub + '" data-ld-ticket-title>Ticket</h3>' +
        '<button class="ds-btn ds-btn--icon ds-btn--quiet ds-listdetail__close" type="button" aria-label="Close the ticket" data-tip="Close">' + h.icon('close', 20) + '</button></header>' +
      '<div class="ds-listdetail__body" data-ld-ticket></div></section>' +
  '</div>';
}

SG.demo('listdetail', {
  title: 'List-detail layout',
  group: 'layout',
  need: 'Show a list, the detail of what is picked and a sub-detail as columns that fold to one with a back button on phones',
  lead: 'Columns that fold by the layout\'s own width: under 720px one column with back buttons, up to 1080px two, beyond that the sub-detail beside both. Pick a device, then its ticket; narrow the stage with the width option to see the phone layout. The options panel changes the head\'s height and the padding (density), the frame (shape) and the targets (touch).',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var ids = { list: h.uid('ld-list'), detail: h.uid('ld-detail'), sub: h.uid('ld-sub') };
    var plain = { list: h.uid('ld-list'), detail: h.uid('ld-detail'), sub: h.uid('ld-sub') };
    return h.section('Devices, record and ticket', ldLayout(h, ids, true),
      'The rows open the record (data-ds-listdetail-show="detail"), the record\'s button its ticket ("sub"). The back button shows where the column before is hidden, the close button where it shows.') +
      h.section('Without a frame', ldLayout(h, plain, false).replace('data-demo="layout"', 'data-demo="plain"'),
        'The layout fills its place, with hairlines between the columns: the look inside the content panel.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the rows; <kbd class="ds-kbd">Enter</kbd> opens one. Where the list goes (a narrow layout) the focus moves to the record\'s title and a screen reader reads it; the back button brings the focus back to the row it came from. On a wide layout the focus stays in the list.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var link = event.target.closest('[data-device]');
      if (link) {
        event.preventDefault();
        var layout = link.closest('.ds-listdetail');
        var row = LD_DEVICES.filter(function (item) { return item.id === link.getAttribute('data-device'); })[0];
        layout.setAttribute('data-ld-open', row.id);
        DS.dom.morphHtml(h.$('[data-ld-rows]', layout), ldRows(h, row.id));
        h.$('[data-ld-title]', layout).textContent = row.name;
        h.$('.ds-listdetail__detail .ds-listdetail__back', layout).setAttribute('aria-label', 'Back to devices');
        h.$('.ds-listdetail__sub .ds-listdetail__back', layout).setAttribute('aria-label', 'Back to ' + row.name);
        DS.dom.morphHtml(h.$('[data-ld-record]', layout), ldRecord(h, row));
        return;
      }
      var ticket = event.target.closest('[data-ds-listdetail-show="sub"]');
      if (ticket) {
        var host = ticket.closest('.ds-listdetail');
        var open = LD_DEVICES.filter(function (item) { return item.id === host.getAttribute('data-ld-open'); })[0];
        h.$('[data-ld-ticket-title]', host).textContent = 'Ticket ' + open.ticket;
        DS.dom.morphHtml(h.$('[data-ld-ticket]', host), ldTicket(h, open));
      }
    });
    root.addEventListener('ds:change', function (event) {
      if (!event.target.matches('.ds-listdetail') || event.detail.level !== 'list') return;
      // Back at the list: nothing is picked any more.
      var layout = event.target;
      layout.removeAttribute('data-ld-open');
      DS.dom.morphHtml(h.$('[data-ld-rows]', layout), ldRows(h, null));
      h.$('[data-ld-title]', layout).textContent = 'Device';
      DS.dom.morphHtml(h.$('[data-ld-record]', layout), ldRecord(h, null));
    });
  },
});
