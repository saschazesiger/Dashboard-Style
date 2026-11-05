/*
 * The Avatar demo: initials on the tint and in the six hues of a name, a
 * picture, an icon, entities as squares, every size, the status dot of each
 * presence, the activity ring, corner badges, interactive avatars, a group
 * with "+N" and its menu, and the attribute path with a status that
 * changes. Registered through SG.demo() (styleguide/sg-core.js). Size and
 * shape come from the options panel; the panel's tone goes on the rings.
 */
var PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Joan Clarke', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton', 'Hedy Lamarr', 'Edsger Dijkstra'];
var STATES = [['online', 'Online'], ['away', 'Away'], ['busy', 'Busy'], ['offline', 'Offline']];

/* A generic portrait: a head and shoulders on a soft ground (no real person). */
function portrait() {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#9fb8d6"/><circle cx="32" cy="26" r="12" fill="#f1d3b8"/><path d="M8 64c2-14 12-20 24-20s22 6 24 20z" fill="#3a5f8f"/><path d="M20 24c0-9 6-14 12-14s12 5 12 14c-3-5-8-7-12-7s-9 2-12 7z" fill="#4a3426"/></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function face(h, name, extra, cls) {
  return '<span class="ds-avatar' + (cls ? ' ' + cls : '') + '" data-ds-avatar="' + h.esc(name) + '"' + (extra || '') + '></span>';
}

SG.demo('avatar', {
  title: 'Avatar',
  group: 'data',
  need: 'Show a person or an entity as a picture, initials or an icon, alone or as a group with "+N"',
  lead: 'A person as a disc, an entity as a rounded square. A status, an activity ring or a badge adds its word to the avatar\'s label: colour never says it alone.',
  options: { sizes: true, density: false, shape: true, tones: ['primary', 'success', 'warning', 'error'] },

  render: function (h) {
    var ringTone = h.tone ? ' ds-tone-' + h.tone : '';
    var groupMenu = h.uid('people');
    var smallMenu = h.uid('people');
    return h.section('Initials, picture, icon',
      '<div class="sg-row" data-demo="kinds">' +
        '<span class="ds-avatar" role="img" aria-label="Ada Lovelace">AL</span>' +
        '<span class="ds-avatar" role="img" aria-label="Ada Lovelace"><img src="' + portrait() + '" alt=""></span>' +
        '<span class="ds-avatar" role="img" aria-label="Unknown user">' + h.icon('user', 20) + '</span>' +
        '<span class="ds-avatar ds-avatar--square" role="img" aria-label="Build service">' + h.icon('server', 20) + '</span>' +
        '<span class="ds-avatar ds-avatar--square" data-ds-avatar="Field team"></span>' +
        '<span class="ds-avatar ds-avatar--square" role="img" aria-label="Assistant">' + h.icon('bot', 20) + '</span>' +
      '</div>', 'The tint without a name; a picture covers the disc; an icon for someone unknown. Entities (a team, a service, a device) are squares.') +

      h.section('A colour from the name',
        '<div class="sg-row" data-demo="hues">' + PEOPLE.map(function (name) { return face(h, name); }).join('') + '</div>',
        'data-ds-avatar writes the initials, one of six hues derived from the name (the same on every page) and the label. Every pair holds 4.5:1 in every theme.') +

      h.section('Sizes',
        '<div class="sg-row" data-demo="sizes" style="align-items: center;">' +
          ['ds-xs', 'ds-sm', 'ds-md', 'ds-lg', 'ds-xl'].map(function (size) {
            return face(h, 'Grace Hopper', size === 'ds-xs' ? ' data-ds-avatar-initials="1"' : '', size);
          }).join('') +
        '</div>', 'A size class on the avatar or any ancestor: 16, 24, 32, 40 and 48px. The extra small one shows one letter.') +

      h.section('Status',
        '<div class="sg-row" data-demo="status">' + STATES.map(function (row, index) {
          return face(h, PEOPLE[index], ' data-ds-avatar-status="' + row[0] + '"');
        }).join('') +
        '<span class="ds-avatar" role="img" aria-label="Ada Lovelace, online"><img src="' + portrait() + '" alt=""><span class="ds-presence-dot ds-presence-dot--online"></span></span>' +
        '</div>', 'Online, away, busy and offline differ in shape, and the label carries the word ("Ada Lovelace, Online").') +

      h.section('Activity ring and corner badge',
        '<div class="sg-row" data-demo="extras">' +
          '<span class="ds-avatar ds-avatar--ring' + ringTone + '" role="img" aria-label="Grace Hopper, new activity">GH</span>' +
          '<span class="ds-avatar ds-avatar--ring ds-tone-success" role="img" aria-label="Joan Clarke, speaking">JC</span>' +
          '<span class="ds-avatar ds-avatar--hue-2" role="img" aria-label="Alan Turing, 3 unread">AT<span class="ds-badge">3</span></span>' +
          '<span class="ds-avatar ds-avatar--hue-4" role="img" aria-label="Hedy Lamarr, new messages">HL<span class="ds-badge ds-badge--dot ds-tone-error"></span></span>' +
          '<span class="ds-avatar ds-avatar--ring' + ringTone + '" role="img" aria-label="Ada Lovelace, online, 12 unread"><img src="' + portrait() + '" alt=""><span class="ds-presence-dot ds-presence-dot--online"></span><span class="ds-badge ds-tone-error">12</span></span>' +
        '</div>', 'The ring says something new or speaking; a badge counts. Both sit on an edge of the ground and are never cut.') +

      h.section('Interactive',
        '<div class="sg-row" data-demo="buttons">' +
          '<button class="ds-avatar ds-avatar--hue-1" type="button" aria-label="Ada Lovelace, open profile" data-tip="Ada Lovelace">AL</button>' +
          '<a class="ds-avatar" href="#" aria-label="Grace Hopper, open profile" data-tip="Grace Hopper"><img src="' + portrait() + '" alt=""></a>' +
          '<button class="ds-avatar ds-avatar--hue-3" type="button" aria-label="Joan Clarke, online, open profile">JC<span class="ds-presence-dot ds-presence-dot--online"></span></button>' +
          '<button class="ds-avatar" type="button" aria-label="Alan Turing, open profile" disabled>AT</button>' +
        '</div>', 'A button or a link: a state layer over the picture, the focus ring and a touch target around the disc. No ripple: it would cut the corner parts.') +

      h.section('Group',
        '<div style="display: grid; gap: var(--ds-space-4); justify-items: start;">' +
          '<div class="ds-avatar-group" role="group" aria-label="Assigned to" data-ds-avatar-group data-ds-avatar-group-max="4" data-demo="group">' +
            PEOPLE.map(function (name, index) { return face(h, name, index === 3 ? ' data-ds-avatar-status="away"' : ''); }).join('') +
            '<button class="ds-avatar ds-avatar-group__more" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + groupMenu + '" data-ds-open="#' + groupMenu + '"></button>' +
            '<div class="ds-menu" role="menu" id="' + groupMenu + '" hidden></div>' +
          '</div>' +
          '<div class="ds-avatar-group ds-avatar-group--spread ds-sm" role="group" aria-label="Reviewers" data-ds-avatar-group data-ds-avatar-group-max="3">' +
            PEOPLE.slice(0, 5).map(function (name) { return face(h, name); }).join('') +
            '<button class="ds-avatar ds-avatar-group__more" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + smallMenu + '" data-ds-open="#' + smallMenu + '"></button>' +
            '<div class="ds-menu" role="menu" id="' + smallMenu + '" hidden></div>' +
          '</div>' +
          '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="add">' + h.icon('userPlus', 16) + 'Add a person</button><button class="ds-btn ds-sm" type="button" data-demo="remove">' + h.icon('userMinus', 16) + 'Remove one</button></div>' +
        '</div>', 'Past the maximum the group shows max - 1 avatars and "+N", a menu of the rest. --spread sets them side by side.') +

      h.section('Status from the page',
        '<div class="sg-row" style="align-items: center;"><span class="ds-avatar ds-lg" data-demo="live"></span>' +
        '<button class="ds-btn ds-sm" type="button" data-demo="cycle">Next status</button><span class="ds-muted" data-demo="label"></span></div>',
        'DS.avatar.create(el, { name, status }); set({ status }) moves the dot and rewrites the label.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each interactive avatar and the "+N" button; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses it. In the menu of the rest, <kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> move and <kbd class="ds-kbd">Esc</kbd> closes back to the button.</p>');
  },

  wire: function (root, h) {
    var live = h.$('[data-demo="live"]', root);
    var label = h.$('[data-demo="label"]', root);
    var states = ['online', 'away', 'busy', 'offline', null];
    var index = 0;
    var ada = DS.avatar.create(live, { name: 'Ada Lovelace', status: states[0] });
    var show = function () { label.textContent = live.getAttribute('aria-label'); };
    show();
    var group = h.$('[data-demo="group"]', root);
    var next = 0;
    var extra = ['Barbara Liskov', 'Radia Perlman', 'Frances Allen', 'John Backus'];
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'cycle') {
        index = (index + 1) % states.length;
        ada.set({ status: states[index] });
        show();
      }
      if (kind === 'add') {
        var name = extra[next % extra.length];
        next += 1;
        group.querySelector('.ds-avatar-group__more').insertAdjacentHTML('beforebegin', face(h, name));
      }
      if (kind === 'remove') {
        var people = group.querySelectorAll('.ds-avatar:not(.ds-avatar-group__more)');
        if (people.length > 1) people[people.length - 1].remove();
      }
    });
    group.addEventListener('ds:select', function (event) { h.toast('Open ' + event.detail.name, 'info'); });
    return function () { ada.destroy(); };
  },
});
