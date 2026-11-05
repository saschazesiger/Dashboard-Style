/*
 * The Presence demo: the four states with their words, the dots alone at
 * every size, presence in a table cell and a menu-like list, and a state
 * that changes. Registered through SG.demo() (styleguide/sg-core.js). Size
 * comes from the options panel; presence reads no tone, density or shape.
 */
var STATES = [['online', 'Online'], ['away', 'Away'], ['busy', 'Busy'], ['offline', 'Offline']];

function presence(state, word) {
  return '<span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--' + state + '"></span>' + word + '</span>';
}

SG.demo('presence', {
  title: 'Presence',
  group: 'feedback',
  need: 'Say whether a person is online, away, busy or offline, with a dot and a word',
  lead: 'Each state has a shape of its own as well as a colour, and a word always says it: the four stay apart without colour.',
  options: { sizes: true, density: false, shape: false, tones: false },

  render: function (h) {
    return h.section('States',
      '<div class="sg-row" data-demo="labels">' + STATES.map(function (row) { return presence(row[0], row[1]); }).join('') + '</div>',
      'A filled disc, a half-filled ring, a disc with a bar, an empty ring.') +

      h.section('Dots at every size',
        '<div class="sg-row" style="align-items: center;" data-demo="sizes">' + ['ds-xs', 'ds-sm', 'ds-md', 'ds-lg', 'ds-xl'].map(function (size) {
          return STATES.map(function (row) { return '<span class="ds-presence-dot ds-presence-dot--' + row[0] + ' ' + size + '"><span class="ds-sr">' + row[1] + '</span></span>'; }).join('');
        }).join('<span style="inline-size: var(--ds-space-4);"></span>') + '</div>',
        'A dot without a visible word takes it in .ds-sr inside it.') +

      h.section('In a table',
        '<div class="ds-table-wrap"><table class="ds-table"><thead><tr><th scope="col">Engineer</th><th scope="col">Presence</th><th scope="col">Ticket</th></tr></thead><tbody>' +
          [['Ada Lovelace', 0, 'TCK-1042'], ['Grace Hopper', 1, 'TCK-1043'], ['Joan Clarke', 2, 'TCK-1051'], ['Alan Turing', 3, '—']].map(function (row) {
            return '<tr><td>' + row[0] + '</td><td>' + presence(STATES[row[1]][0], STATES[row[1]][1]) + '</td><td>' + row[2] + '</td></tr>';
          }).join('') +
        '</tbody></table></div>') +

      h.section('A state that changes',
        '<div class="sg-row" style="align-items: center;"><span class="ds-presence-label" data-demo="live"><span class="ds-presence-dot ds-presence-dot--online"></span><span>Online</span></span>' +
        '<button class="ds-btn ds-sm" type="button" data-demo="cycle">Next state</button></div>',
        'The colours glide on --ds-dur-medium; the shape and the word change at once.');
  },

  wire: function (root, h) {
    var live = h.$('[data-demo="live"]', root);
    var index = 0;
    root.addEventListener('click', function (event) {
      if (!event.target.closest('[data-demo="cycle"]')) return;
      index = (index + 1) % STATES.length;
      live.querySelector('.ds-presence-dot').className = 'ds-presence-dot ds-presence-dot--' + STATES[index][0];
      live.lastElementChild.textContent = DS.core.t('presence' + STATES[index][1]);
    });
  },
});
