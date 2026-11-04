/*
 * The Badge demo: a count on its hosts, every tone with its word, the dot, a
 * count with a maximum, and the states of a host. Registered through SG.demo()
 * (styleguide/sg-core.js). Size and shape come from the options panel around
 * it; the panel's tone goes on the badges of the tone row, since a badge reads
 * only its own.
 */
var TONES = [['neutral', 'Queued', 12], ['primary', 'Assigned', 4], ['info', 'Notes', 7], ['success', 'Passed', 41], ['warning', 'Warnings', 5], ['error', 'Failed', 2]];

SG.demo('badge', {
  title: 'Badge',
  group: 'feedback',
  need: 'Show a count or a dot on a button, chip, tab or drawer item',
  lead: 'A count on a control, or a dot that says something is new. A toned badge has its word next to it: colour is never the only signal.',
  options: { variants: ['dot'], sizes: true, density: false, shape: true, tones: true },

  render: function (h) {
    var tones = TONES.filter(function (row) { return !h.tone || row[0] === h.tone; });
    var dots = h.section('Dot', '<div class="sg-row" data-demo="dots">' + tones.map(function (row) {
      return '<span class="sg-row"><span class="ds-badge ds-badge--dot ds-tone-' + row[0] + '"></span><span>' + row[1] + '</span></span>';
    }).join('') +
      '<span class="sg-row" data-demo="default-dot"><span class="ds-badge ds-badge--dot"></span><span>New</span></span>' +
      '<button class="ds-btn ds-btn--quiet" type="button">Tasks <span class="ds-badge ds-badge--dot ds-tone-primary"><span class="ds-sr">New tasks</span></span></button>' +
      '<button class="ds-btn ds-btn--filled" type="button">Messages <span class="ds-badge ds-badge--dot"><span class="ds-sr">New messages</span></span></button>' +
      '</div><p class="ds-muted">A dot says nothing by itself: its word sits beside it or in .ds-sr.</p>');
    if (h.variant === 'dot') return dots;
    return h.section('On a control', '<div class="sg-row">' +
      '<button class="ds-btn" type="button" data-demo="add">' + h.icon('mail', 16) + 'Inbox <span class="ds-badge" data-demo="count">3</span></button>' +
      '<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true">' + h.icon('filter', 16) + 'Filters <span class="ds-badge">2</span></button>' +
      '<button class="ds-btn ds-btn--tonal" type="button">Updates <span class="ds-badge ds-tone-neutral">12</span></button>' +
      '<label class="ds-chip"><input class="ds-chip__input" type="checkbox" checked><span class="ds-chip__body">' + h.icon('check', 18, 'ds-chip__check') + '<span>Failed</span> <span class="ds-badge">2</span></span></label>' +
      '</div><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="add">' + h.icon('plus', 16) + 'One more</button><button class="ds-btn ds-sm" type="button" data-demo="clear">Mark all read</button></div>' +
      '<p class="ds-muted">A count that appears pops in, one that goes pops out; the figure changes at once.</p>') +

      h.section('Tones, each with its word', '<div class="sg-row" data-demo="tones">' + tones.map(function (row) {
        return '<span class="sg-row"><span>' + row[1] + '</span><span class="ds-badge ds-tone-' + row[0] + '">' + row[2] + '</span></span>';
      }).join('') + '</div>') +

      h.section('A count with a maximum', '<div class="sg-row">' +
        '<span class="ds-badge" data-ds-badge="7"></span>' +
        '<span class="ds-badge" data-ds-badge="99"></span>' +
        '<span class="ds-badge" data-ds-badge="128" data-ds-badge-max="99" data-demo="max"></span>' +
        '<span class="ds-badge ds-tone-error" data-ds-badge="12" data-ds-badge-max="9"></span>' +
        '</div><p class="ds-muted">data-ds-badge holds the count, data-ds-badge-max the largest figure (99 by default). At zero it takes no room.</p>') +

      dots +

      h.section('States of the host', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" disabled>Disabled <span class="ds-badge ds-tone-error">2</span></button>' +
        '<button class="ds-btn" type="button" aria-disabled="true">Blocked <span class="ds-badge">3</span></button>' +
        '<span class="ds-badge" data-demo="empty"></span>' +
        '</div><p class="ds-muted">A blocked host takes the disabled model over any tone. An empty badge sits after the second button and takes no room.</p>') +

      h.section('Keyboard', '<p class="ds-muted">A badge is no stop of its own: <kbd class="ds-kbd">Tab</kbd> reaches its host. Give the host a name that includes the count where it matters.</p>');
  },

  wire: function (root, h) {
    var count = h.$('[data-demo="count"]', root);
    if (!count) return;
    var inbox = DS.badge.create(count, { value: 3 });
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'add') inbox.set(Number(inbox.get()) + 1);
      if (kind === 'clear') inbox.set(0);
    });
  },
});
