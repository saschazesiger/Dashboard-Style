/*
 * The State label demo: the workflow states filled and subtle, in an
 * item's head, in a list, a state that changes, and a narrow width.
 * Registered through SG.demo() (styleguide/sg-core.js). Size and shape
 * come from the options panel; the panel's tone shows one more lozenge,
 * since a lozenge reads only its own.
 */
var LOZENGE_STATES = [['success', 'circleDot', 'Open'], ['primary', 'gitPullRequest', 'In review'], ['info', 'gitMerge', 'Merged'], ['error', 'circleX', 'Closed'], ['neutral', 'pencil', 'Draft'], ['warning', 'clock', 'On hold']];

function lozengeHtml(h, state, subtle) {
  return '<span class="ds-lozenge' + (subtle ? ' ds-lozenge--subtle' : '') + ' ds-tone-' + state[0] + '">' + h.icon(state[1], 16) + '<span>' + state[2] + '</span></span>';
}

SG.demo('lozenge', {
  title: 'State label',
  group: 'feedback',
  need: 'Show where an item stands in its workflow (open, merged, closed, draft) as a bold label',
  lead: 'A bold, filled pill for the workflow state of one item. The state is always a word and usually an icon; the same state keeps its tone and icon everywhere.',
  options: { sizes: true, density: false, shape: true, tones: true },

  render: function (h) {
    var states = LOZENGE_STATES.slice();
    if (h.tone) states = states.filter(function (state) { return state[0] === h.tone; });
    return h.section('Filled', '<div class="sg-row" data-demo="filled">' + states.map(function (state) { return lozengeHtml(h, state); }).join('') + '<span class="ds-lozenge"><span>No tone</span></span></div>') +
      h.section('Subtle', '<div class="sg-row" data-demo="subtle">' + states.map(function (state) { return lozengeHtml(h, state, true); }).join('') + '</div>', 'The container pair, for a list of many items.') +
      h.section('In an item\'s head', '<div class="ds-card"><div class="sg-row"><h3 class="ds-card__title" style="margin: 0">Printer jams on the second floor</h3><span data-demo="live">' + lozengeHtml(h, LOZENGE_STATES[0]) + '</span></div>' +
        '<p class="ds-muted">Opened by Ada Lovelace, ticket 4,127.</p><div class="sg-row"><button class="ds-btn ds-btn--tonal ds-sm" type="button" data-demo="toggle">Close ticket</button></div></div>',
        'The page announces a state that changes; the colours glide, the word changes at once.') +
      h.section('In a list', '<ul class="ds-list" aria-label="Tickets">' + [['Printer jams on the second floor', 0], ['Laptop battery swells', 3], ['Replace the badge readers', 4], ['Network switch firmware', 2]].map(function (row) {
        return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + row[0] + '</span></span>' + lozengeHtml(h, LOZENGE_STATES[row[1]], true) + '</li>';
      }).join('') + '</ul>') +
      h.section('Narrow', '<div class="ds-card" style="max-inline-size: 200px">' + lozengeHtml(h, ['primary', 'gitPullRequest', 'Waiting for a second review']) + '</div>', 'A word too long for its place ends in an ellipsis.') +
      h.section('Keyboard', '<p class="ds-muted">A state label is text: nothing takes focus. It is read with the item\'s head.</p>');
  },

  wire: function (root, h) {
    var open = true;
    var onClick = function (event) {
      var button = event.target.closest('[data-demo="toggle"]');
      if (!button) return;
      open = !open;
      var state = open ? LOZENGE_STATES[0] : LOZENGE_STATES[3];
      window.DS.dom.morphHtml(h.$('[data-demo="live"]', root), lozengeHtml(h, state));
      button.textContent = open ? 'Close ticket' : 'Reopen ticket';
      window.DS.a11y.announce('Ticket ' + state[2].toLowerCase());
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
