/*
 * The Empty state demo: its places (section, page, inline), every cause with
 * its icon, words and action, a picture, two actions, and the confirmation.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, density and shape
 * come from the options panel around it; the panel's tone goes on the sample
 * disc, since an empty state reads only its own.
 */
var CAUSES = [
  ['no-data', 'box', 'No devices yet', 'Add the first one or import a list.', 'Add device', ''],
  ['first-use', 'sparkles', 'Bring your fleet in', 'Keep every device, its owner and its warranty in one place.', 'Get started', ''],
  ['not-set-up', 'settings', 'Sign-in is not set up', 'Connect a directory so people can sign in.', 'Open settings', ''],
  ['no-results', 'search', 'Nothing matches "floor 9"', 'Try another word, or clear the filter.', 'Clear filter', 'status'],
  ['no-access', 'lock', 'You cannot see this list', 'Ask an administrator for the Inventory role.', '', ''],
  ['offline', 'wifiOff', 'You are offline', 'The list comes back when the connection does.', 'Try again', 'status'],
  ['error', 'alertCircle', 'Could not load the devices', 'The server did not answer.', 'Try again', 'alert'],
];

function state(h, cls, glyph, size, title, text, action, role) {
  return '<div class="ds-empty' + (cls ? ' ' + cls : '') + '"' + (role ? ' role="' + role + '"' : '') + '><span class="ds-empty__disc" aria-hidden="true">' + h.icon(glyph, size) + '</span>' +
    '<p class="ds-empty__title">' + title + '</p><p class="ds-empty__text">' + text + '</p>' +
    (action ? '<button class="ds-btn ds-btn--tonal" type="button">' + action + '</button>' : '') + '</div>';
}

function done(h) {
  return '<div class="ds-empty ds-empty--done" role="status"><span class="ds-empty__disc" aria-hidden="true">' + h.icon('check', 24) + '</span><p class="ds-empty__title">Request sent</p><p class="ds-empty__text">We will answer within a day.</p></div>';
}

SG.demo('empty', {
  title: 'Empty state',
  group: 'feedback',
  need: 'Say that there is nothing to show and why, at the size of its place, or confirm that a job finished',
  lead: 'A title, at most one line of what to do next and at most one action. Its place sets the room it takes, its cause the words and the colours; icon and words always say it, never the colour alone.',
  options: { variants: ['section', 'page', 'inline'], sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var place = h.variant ? ' ds-empty--' + h.variant : '';
    var tone = h.tone ? ' ds-tone-' + h.tone : '';
    return h.section('Why it is empty', '<div class="ds-grid-2" data-demo="causes">' + CAUSES.map(function (row) {
      return h.card(row[0].replace(/-/g, ' '), state(h, 'ds-empty--' + row[0] + place, row[1], h.variant === 'page' ? 32 : h.variant === 'inline' ? 16 : 24, row[2], row[3], row[4], row[5]));
    }).join('') + h.card('A tone', state(h, tone.trim() + place, 'box', h.variant === 'page' ? 32 : h.variant === 'inline' ? 16 : 24, 'A tone on the state', 'The options panel sets it here.', '', '')) + '</div>') +

      h.section('In a list', '<div class="ds-card">' + state(h, 'ds-empty--inline ds-empty--no-results', 'search', 16, 'No matches', 'Nothing matches "floor 9".', 'Clear', 'status') + '</div>') +

      h.section('A whole page, with a picture and two actions', '<div class="ds-empty ds-empty--page ds-empty--first-use"><span class="ds-empty__media" aria-hidden="true">' + h.icon('box', 96) + '</span><p class="ds-empty__title">Bring your fleet in</p><p class="ds-empty__text">Import a list, or add the first device by hand.</p><div class="ds-empty__actions"><button class="ds-btn ds-btn--filled" type="button">Import a list</button><button class="ds-btn" type="button">Add device</button></div></div>') +

      h.section('A confirmation', '<div data-demo="done">' + done(h) + '</div><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="replay">Play again</button></div>') +

      h.section('Keyboard', '<p class="ds-muted">No stop of its own: <kbd class="ds-kbd">Tab</kbd> reaches its action.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      if (!event.target.closest('[data-demo="replay"]')) return;
      var holder = h.$('[data-demo="done"]', root);
      // A new node plays its entrance: a re-render that keeps the node never does.
      holder.replaceChildren();
      holder.insertAdjacentHTML('beforeend', done(h));
    });
  },
});
