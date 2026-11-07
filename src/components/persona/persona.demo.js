/*
 * The Persona demo: the default, stacked and inline layouts, every status,
 * a picture and an entity, interactive personas (a link, a button, a
 * blocked one), personas in a list and a table, and a narrow column where
 * the lines end in an ellipsis. Registered through SG.demo()
 * (styleguide/sg-core.js). Size and shape come from the options panel.
 */
var TEAM = [
  ['Ada Lovelace', 'Field engineer', 'online', 'Online'],
  ['Grace Hopper', 'Support lead', 'away', 'Away'],
  ['Joan Clarke', 'Network operator', 'busy', 'Busy'],
  ['Alan Turing', 'Release manager', 'offline', 'Offline'],
];

function avatar(h, name, status, extra) {
  return '<span class="ds-avatar ds-avatar--hue-' + DS.avatar.hue(name) + '" aria-hidden="true">' + h.esc(DS.avatar.initials(name)) +
    (status ? '<span class="ds-presence-dot ds-presence-dot--' + status + '"></span>' : '') + (extra || '') + '</span>';
}

function statusLine(status, word) {
  return '<span class="ds-persona__status"><span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--' + status + '"></span>' + word + '</span></span>';
}

function persona(h, row, opts) {
  opts = opts || {};
  var tag = opts.tag || 'div';
  return '<' + tag + ' class="ds-persona' + (opts.cls ? ' ' + opts.cls : '') + '"' + (opts.attrs || '') + '>' +
    avatar(h, row[0], opts.dot ? row[2] : '') +
    '<span class="ds-persona__text"><span class="ds-persona__name">' + h.esc(row[0]) + '</span>' +
    (row[1] ? '<span class="ds-persona__role">' + h.esc(row[1]) + '</span>' : '') +
    (opts.status ? statusLine(row[2], row[3]) : '') +
    '</span></' + tag + '>';
}

SG.demo('persona', {
  title: 'Persona',
  group: 'data',
  need: 'Show a person in one block: avatar, name, role and status',
  lead: 'The avatar, the name, a role and a status in words. The avatar is aria-hidden: the name beside it names the person once.',
  options: { sizes: true, density: false, shape: true, tones: false },

  render: function (h) {
    return h.section('Name, role and status',
      '<div class="sg-row" data-demo="default" style="gap: var(--ds-space-6);">' + TEAM.map(function (row) {
        return persona(h, row, { status: true, dot: true });
      }).join('') + '</div>', 'The status as the avatar\'s dot and as a word on its own line.') +

      h.section('Name and role',
        '<div class="sg-row" style="gap: var(--ds-space-6);">' +
          persona(h, ['Ada Lovelace', 'ada@example.com']) +
          '<div class="ds-persona"><span class="ds-avatar" aria-hidden="true">' + h.icon('user', 20) + '</span><span class="ds-persona__text"><span class="ds-persona__name">Unassigned</span><span class="ds-persona__role">No owner yet</span></span></div>' +
          '<div class="ds-persona"><span class="ds-avatar ds-avatar--square" aria-hidden="true">' + h.icon('server', 20) + '</span><span class="ds-persona__text"><span class="ds-persona__name">Build service</span><span class="ds-persona__role">Automation</span></span></div>' +
          persona(h, ['Grace Hopper', '']) +
        '</div>', 'A person with an address, someone unknown, an entity on a square, a name alone.') +

      h.section('Stacked',
        '<div class="sg-row" data-demo="stacked" style="gap: var(--ds-space-8); align-items: start;">' + TEAM.slice(0, 3).map(function (row) {
          return persona(h, row, { cls: 'ds-persona--stacked ds-xl', status: true, dot: true });
        }).join('') + '</div>', 'The head of a profile card or a grid of people.') +

      h.section('Inline',
        '<p style="margin: 0;">Ticket TCK-1042 was assigned to ' + persona(h, TEAM[0], { tag: 'span', cls: 'ds-persona--inline ds-sm' }) + ' this morning.</p>',
        'One line: the name, then the role.') +

      h.section('Interactive',
        '<div class="sg-row" data-demo="interactive" style="gap: var(--ds-space-4);">' +
          persona(h, TEAM[0], { tag: 'a', cls: 'ds-pressable', attrs: ' href="#"', dot: true }) +
          persona(h, TEAM[1], { tag: 'button', cls: 'ds-pressable', attrs: ' type="button"' }) +
          persona(h, TEAM[3], { tag: 'button', cls: 'ds-pressable', attrs: ' type="button" disabled' }) +
        '</div>', 'A link or a button with .ds-pressable: the state layer, the focus ring and the ripple. The last one is disabled.') +

      h.section('In a list and a table',
        '<div class="sg-grid-2" style="display: grid; gap: var(--ds-space-4); grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); align-items: start;">' +
          '<ul class="ds-list" aria-label="On call">' + TEAM.map(function (row) {
            return '<li class="ds-list__item">' + persona(h, row, { status: true, dot: true }) + '</li>';
          }).join('') + '</ul>' +
          '<div class="ds-table-wrap"><table class="ds-table"><thead><tr><th scope="col">Owner</th><th scope="col">Ticket</th></tr></thead><tbody>' +
            TEAM.map(function (row, index) {
              return '<tr><td>' + persona(h, row, { cls: 'ds-sm' }) + '</td><td>TCK-' + (1042 + index) + '</td></tr>';
            }).join('') +
          '</tbody></table></div>' +
        '</div>') +

      h.section('Narrow',
        '<div data-demo="narrow" style="inline-size: 180px; border: 1px dashed var(--ds-line); padding: var(--ds-space-2);">' +
          persona(h, ['Katherine Johnson-Goble', 'Senior network operations engineer', 'away', 'Away, back at 14:00'], { status: true, dot: true }) +
        '</div>', 'Each line ends in an ellipsis rather than wrap.');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-demo="interactive"] .ds-persona');
      if (!target) return;
      event.preventDefault();
      h.toast('Open ' + target.querySelector('.ds-persona__name').textContent, 'info');
    });
  },
});
