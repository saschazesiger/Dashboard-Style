/*
 * The Priority action bar demo: a toolbar of ticket actions that folds into
 * More, the same bar at the end of a head, and a resizable frame to watch
 * it fold. Registered through SG.demo() (styleguide/sg-core.js). Narrow the
 * width in the options panel, or drag the frame's corner.
 */
var ACTIONS = [
  ['pencil', 'Edit', 3],
  ['userPlus', 'Assign', 2],
  ['tag', 'Label', 0],
  ['bellOff', 'Mute', 0, true],
  ['archive', 'Archive', 0],
  ['duplicate', 'Duplicate', 0],
  ['trash', 'Delete', 1],
];

function bar(h, look, extra) {
  return '<div class="ds-priority-bar' + (extra || '') + '" role="toolbar" aria-label="Ticket actions" data-ds-prioritybar>' + ACTIONS.map(function (action) {
    return '<button class="ds-btn ds-btn--' + look + '" type="button"' + (action[2] ? ' data-ds-priority="' + action[2] + '"' : '') +
      (action[3] ? ' aria-pressed="false" data-ds-toggle' : '') + ' data-demo-action="' + action[1] + '">' + h.icon(action[0], 16) + action[1] + '</button>';
  }).join('') + '</div>';
}

SG.demo('prioritybar', {
  title: 'Priority action bar',
  group: 'actions',
  need: 'Keep a row of actions on one line at any width: what does not fit folds into a More menu',
  lead: 'Actions stay on one line: the least important fold into More when the room runs out, and come back when there is room. The menu holds the same commands.',
  options: { variants: ['quiet', 'outlined', 'text'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var look = h.variant || 'quiet';
    return h.section('A toolbar', bar(h, look) + '<p class="ds-meta" data-demo="log">Folded: nothing</p>',
      'Edit (priority 3), Assign (2) and Delete (1) stay longest; the rest fold from the end. Mute is a toggle: in the menu it is a check item.') +

      h.section('Drag the corner', '<div class="sg-resize" data-demo="frame" style="resize: horizontal; overflow: hidden; inline-size: 100%; min-inline-size: 120px; max-inline-size: 100%; padding: var(--ds-space-2); border: 1px dashed var(--ds-line-2); border-radius: var(--ds-radius-sm)">' +
        bar(h, look) + '</div>', 'The bar takes the width its parent gives and measures again on every change.') +

      h.section('In a head', '<div class="ds-card"><div style="display: flex; align-items: center; gap: var(--ds-space-3); min-inline-size: 0">' +
        '<h3 class="ds-card__title" style="margin: 0; flex: 0 1 auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Printer on floor 2</h3>' +
        bar(h, look, ' ds-priority-bar--end') + '</div><p class="ds-muted">The title takes its room; the bar grows into the rest with its actions at the end.</p></div>') +

      h.section('Keyboard', '<p class="ds-muted">The toolbar is one tab stop: <kbd class="ds-kbd">←</kbd> <kbd class="ds-kbd">→</kbd> move between the actions and More, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> to the ends. On More, <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">↓</kbd> open the menu.</p>');
  },

  wire: function (root, h) {
    var log = h.$('[data-demo="log"]', root);
    root.addEventListener('ds:change', function (event) {
      if (!event.target.matches('.ds-priority-bar') || !log || !event.target.parentElement.contains(log)) return;
      var names = event.detail.folded.map(function (action) { return action.getAttribute('data-demo-action'); });
      log.textContent = 'Folded: ' + (names.join(', ') || 'nothing');
    });
    root.addEventListener('click', function (event) {
      var action = event.target.closest('[data-demo-action]');
      if (action && !action.hasAttribute('aria-pressed')) h.toast(action.getAttribute('data-demo-action') + ': done.', 'success');
    });
  },
});
