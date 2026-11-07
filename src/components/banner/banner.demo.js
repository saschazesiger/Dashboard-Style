/*
 * The Banner demo: the app frame's message strip in a small panel, with
 * three messages in priority order (the error first), the more button, a
 * dismissal that is remembered (Forget dismissals brings them back), a
 * message that is not dismissible, and broadcasts from data. Ordering,
 * dismissal and remembering come from the system (data-ds-banner).
 */
function bannerPanel(h, id, body) {
  return '<div class="ds-panel" data-demo="panel" style="grid-area: auto; margin: 0; min-height: 0">' +
    '<div class="ds-banner" id="' + id + '" data-ds-banner data-ds-banner-remember="session">' + body + '</div>' +
    '<main class="ds-view" tabindex="-1" style="flex: none"><div class="ds-content"><p class="ds-muted">The view: 240 devices, 12 offline.</p></div></main></div>';
}

SG.demo('banner', {
  title: 'Banner',
  group: 'feedback',
  need: 'Broadcast a message to the whole app: several in priority order, each dismissible and remembered',
  lead: 'Messages for the whole app above the view: the most urgent first, the others behind "Show more", each dismissible; a dismissal is remembered (here for this tab). The options panel changes the alerts through size, density and shape.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var markup = '<div class="ds-alert ds-tone-info" role="status" data-ds-banner-id="sg-maintenance-1109">' + h.icon('info', 20) +
      '<span class="ds-alert__text">Maintenance on Sunday, 02:00 to 04:00. Devices stay online.</span><a class="ds-btn ds-btn--text ds-sm" href="#status">Details</a></div>' +
      '<div class="ds-alert ds-tone-error" role="alert" data-ds-banner-id="sg-outage-1104">' + h.icon('alertCircle', 20) +
      '<div class="ds-alert__text"><p class="ds-alert__title">Sign-in is down for some people</p><p>We are on it. Devices keep syncing.</p></div></div>' +
      '<div class="ds-alert ds-tone-warning" role="status" data-ds-banner-id="sg-offline" data-ds-banner-dismiss="off">' + h.icon('wifiOff', 20) +
      '<span class="ds-alert__text">You are offline. Changes are saved when the connection is back.</span><button class="ds-btn ds-btn--text ds-sm" type="button">Retry</button></div>';
    return h.section('In the app frame', '<div class="ds-stack">' + bannerPanel(h, h.uid('banner'), markup) +
      '<div class="sg-row" data-demo="buttons">' +
      '<button class="ds-btn" type="button" data-demo="broadcast">Broadcast a notice</button>' +
      '<button class="ds-btn" type="button" data-demo="urgent">Broadcast an urgent one</button>' +
      '<button class="ds-btn" type="button" data-demo="online">Back online</button>' +
      '<button class="ds-btn ds-btn--text" type="button" data-demo="forget">Forget dismissals</button></div></div>',
      'The error leads whatever the markup\'s order; the offline message has no dismiss button (the page takes it back when the connection returns).') +

      h.section('All at once', bannerPanel(h, h.uid('banner-all'),
        '<div class="ds-alert ds-tone-success" role="status" data-ds-banner-id="sg-all-sync">' + h.icon('checkCircle', 20) + '<span class="ds-alert__text">All 240 devices synced.</span></div>' +
        '<div class="ds-alert" role="status" data-ds-banner-id="sg-all-tip">' + h.icon('info', 20) + '<span class="ds-alert__text">Tip: press ? to see every shortcut.</span></div>').replace('data-ds-banner ', 'data-ds-banner data-ds-banner-max="3" '),
        'data-ds-banner-max="3": up to three show; only the first keeps the panel\'s corners.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each message\'s action and dismiss button, then "Show more". Dismissing moves focus to the next message, never to the page\'s body.</p>');
  },

  wire: function (root, h) {
    var el = h.$('.ds-banner', root);
    var banner = DS.banner.create(el);
    var count = 0;
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button || button.tagName !== 'BUTTON') return;
      var what = button.getAttribute('data-demo');
      if (what === 'broadcast') {
        count += 1;
        banner.add({ id: 'sg-notice-' + count, tone: 'info', text: 'Product 4.' + count + ' rolls out tonight.', action: { label: 'Release notes', href: '#notes' } });
      } else if (what === 'urgent') {
        count += 1;
        banner.add({ id: 'sg-urgent-' + count, tone: 'error', title: 'Backups are paused', text: 'Storage is full on SERVER-0003.', priority: 90 });
      } else if (what === 'online') banner.remove('sg-offline');
      else if (what === 'forget') {
        ['sg-maintenance-1109', 'sg-outage-1104'].forEach(function (id) { banner.restore(id); });
        for (var i = 1; i <= count; i += 1) { banner.restore('sg-notice-' + i); banner.restore('sg-urgent-' + i); }
      }
    });
  },
});
