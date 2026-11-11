/*
 * The Notification centre demo: a bell in a small top bar with its count,
 * the sheet with groups by day, read and unread, actions, the settings
 * link, mark all read, the unread-only switch and the empty state; fake
 * arrivals stand for what a project's push or poll delivers. Opening,
 * reading and the count come from the system (data-ds-notifications,
 * data-ds-open); wire() holds the data and what the actions do.
 */
var NOTIFICATION_MINUTE = 60000;

function notificationItems() {
  var now = Date.now();
  // Today's items stay today in the first hour after midnight, so the groups are always Today, Yesterday, Earlier.
  var midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  var ago = function (minutes) { return Math.max(now - minutes * NOTIFICATION_MINUTE, midnight.getTime()); };
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(16, 20, 0, 0);
  return [
    { id: 'offline-42', title: 'LAPTOP-0042 is offline', text: 'Last seen 12 minutes ago in Building A.', time: ago(12), tone: 'warning', icon: DS.icons.wifiOff, href: '#devices/laptop-0042', actions: [{ id: 'ticket', label: 'Open a ticket' }] },
    { id: 'ticket-1047', title: 'Ada Lovelace assigned T-1047 to you', text: 'Cannot reach the printer.', time: ago(47), icon: DS.icons.ticket, href: '#tickets/1047' },
    { id: 'backup', title: 'The nightly backup finished', text: '240 devices, 1.2 GB.', time: yesterday.getTime(), tone: 'success', icon: DS.icons.checkCircle, read: true },
    { id: 'cert', title: 'The certificate of SERVER-0003 expires in 5 days', time: yesterday.getTime() - 3 * 60 * NOTIFICATION_MINUTE, tone: 'error', icon: DS.icons.shieldAlert, actions: [{ id: 'renew', label: 'Renew' }, { id: 'remind', label: 'Remind me' }] },
    { id: 'update', title: 'Product 4.2 is ready to install', text: 'Release notes are in the help centre.', time: now - 6 * 24 * 60 * NOTIFICATION_MINUTE, icon: DS.icons.download, read: true },
  ];
}

function notificationSheet(h, id, titleId, empty) {
  return '<dialog class="ds-sheet ds-notifications" id="' + id + '" data-ds-notifications aria-labelledby="' + titleId + '" data-demo="' + (empty ? 'empty-sheet' : 'sheet') + '">' +
    '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel">' +
    '<div class="ds-sheet__head"><div class="ds-sheet__heading"><h2 class="ds-sheet__title" id="' + titleId + '">Notifications</h2><p class="ds-sheet__subtitle"></p></div>' +
    '<a class="ds-btn ds-btn--quiet ds-btn--icon" href="#settings/notifications" aria-label="Notification settings" data-tip="Notification settings">' + h.icon('settings', 20) + '</a>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-tip="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
    '<div class="ds-notifications__bar"><label class="ds-switch"><input type="checkbox" role="switch" data-ds-notifications-unread-only>' +
    '<span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Only unread</span></label>' +
    '<button class="ds-btn ds-btn--text ds-sm" type="button" data-ds-notifications-read-all>Mark all as read</button></div>' +
    '<div class="ds-sheet__body ds-notifications__feed" tabindex="0">' +
    (empty ? '<div class="ds-empty ds-notifications__empty"><span class="ds-empty__disc" aria-hidden="true">' + h.icon('bell', 24) + '</span>' +
      '<p class="ds-empty__title">You are all caught up</p><p class="ds-empty__text">New notifications show here.</p></div>' : '') +
    '</div></section></dialog>';
}

SG.demo('notifications', {
  title: 'Notification centre',
  group: 'overlays',
  need: 'Collect what happened for someone: a bell with the unread count and a sheet of notifications to read, act on and mark read',
  lead: 'A bell with the unread count opens a side sheet of notifications, grouped by day. Arrivals are announced; the count follows reading. The options panel changes the rows through size, density and shape.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var id = h.uid('inbox');
    var emptyId = h.uid('inbox-empty');
    return h.section('Try it', '<div class="sg-row" data-demo="bar">' +
      '<span class="ds-notifications__bell"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-open="#' + id + '" aria-label="Notifications" data-tip="Notifications" data-demo="bell">' + h.icon('bell', 20) + '</button></span>' +
      '<button class="ds-btn" type="button" data-demo="arrive">A notification arrives</button>' +
      '<button class="ds-btn" type="button" data-demo="burst">Three arrive at once</button>' +
      '<span class="ds-notifications__bell"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-open="#' + emptyId + '" aria-label="Notifications, none" data-tip="An empty centre" data-demo="empty-bell">' + h.icon('bell', 20) + '</button></span></div>' +
      notificationSheet(h, id, h.uid('inbox-title'), false) + notificationSheet(h, emptyId, h.uid('inbox-empty-title'), true),
      'The first bell holds five notifications, three of them unread; the second opens an empty centre.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> on the bell opens the sheet; <kbd class="ds-kbd">Tab</kbd> goes through each notification\'s link, actions and read button; <kbd class="ds-kbd">Esc</kbd> closes it and focus returns to the bell. Arrivals are announced, never focused.</p>');
  },

  wire: function (root, h) {
    var sheet = h.$('[data-demo="sheet"]', root);
    var centre = DS.notifications.create(sheet, { items: notificationItems() });
    DS.notifications.create(h.$('[data-demo="empty-sheet"]', root), { items: [] });
    var count = 0;
    var devices = ['TABLET-0207', 'PHONE-0311', 'DESKTOP-0012', 'MONITOR-0120'];
    var arrival = function () {
      count += 1;
      var device = devices[count % devices.length];
      return { id: 'arrived-' + count, title: device + ' needs an update', text: 'Product 4.2 is ready for it.', time: Date.now(), icon: DS.icons.download, tone: 'info', actions: [{ id: 'install', label: 'Install' }] };
    };
    centre.on('action', function (detail) {
      h.toast(detail.action.label + ': ' + detail.item.title + '.', 'info');
      if (detail.action.id === 'renew' || detail.action.id === 'install') centre.read(detail.item.id);
    });
    centre.on('select', function (detail) { h.toast('Opened ' + detail.item.title + '.', 'info'); });
    // Links of the demo go nowhere: a project's router takes them.
    sheet.addEventListener('click', function (event) {
      if (event.target.closest('a[href^="#"]')) event.preventDefault();
    });
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo="arrive"], [data-demo="burst"]');
      if (!button) return;
      if (button.getAttribute('data-demo') === 'arrive') centre.add(arrival());
      else centre.add([arrival(), arrival(), arrival()]);
    });
  },
});
