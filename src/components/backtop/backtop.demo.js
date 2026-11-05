/*
 * The Back to top demo: a long device log in a scrolling box, with the
 * button at its end (an icon button) and a second box with a labelled one.
 * Registered through SG.demo() (styleguide/sg-core.js). data-ds-backtop
 * brings the behaviour; size, density, shape and touch reach the button
 * from the options panel.
 */
var EVENTS = ['Synced', 'Checked for updates', 'Battery at 80 %', 'Connected to the office network', 'Encryption verified', 'Synced', 'Owner changed to Ada Lovelace', 'Moved to Building B', 'Synced', 'Restarted after an update', 'Backup finished', 'Synced'];

function log(h, title, count) {
  var rows = '';
  for (var index = 0; index < count; index += 1) {
    rows += '<li style="padding-block: var(--ds-space-2); border-block-end: 1px solid var(--ds-line);">' + EVENTS[index % EVENTS.length] + ' <span class="ds-muted">· ' + (9 + Math.floor(index / 6)) + ':' + String((index * 7) % 60).padStart(2, '0') + '</span></li>';
  }
  return '<h4 style="margin: var(--ds-space-4) 0 var(--ds-space-2); font: var(--ds-font-subtitle);">' + title + '</h4><ol style="margin: 0; padding: 0; list-style: none;">' + rows + '</ol>';
}

var BOX = 'block-size: 320px; overflow-y: auto; border: 1px solid var(--ds-line); border-radius: calc(var(--ds-radius-md) * var(--ds-shape, 1)); padding: 0 var(--ds-space-4) var(--ds-space-4);';

SG.demo('backtop', {
  title: 'Back to top',
  group: 'navigation',
  need: 'Take the reader back to the top of a long page or box: a button that appears after a scroll',
  lead: 'A button that appears once the reader has scrolled down, and takes them back to the top with the focus. Scroll inside each box.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Icon button', '<div style="' + BOX + '" data-demo="icon-box">' + log(h, 'LAPTOP-0042: activity', 40) +
        '<button class="ds-btn ds-btn--elevated ds-btn--icon ds-backtop" type="button" data-ds-backtop data-ds-backtop-after="240" data-tip="Back to top" hidden>' + h.icon('arrowUp', 20) + '</button></div>',
        'It shows after 240px of scroll here (default: one height of the scroller) and hides again above half of that. Its name is the string backToTop; the tooltip repeats it.') +

      h.section('With a label', '<div style="' + BOX + '" data-demo="label-box">' + log(h, 'Ticket 1042: history', 40) +
        '<button class="ds-btn ds-btn--elevated ds-backtop" type="button" data-ds-backtop hidden>' + h.icon('arrowUp', 18) + 'Back to top</button></div>',
        'An extended button. It sits at the end of the content in its own row, so it never covers the last line.') +

      h.section('Keyboard', '<p class="ds-muted">The button is a tab stop at the end of the content while it shows. <kbd class="ds-kbd">Enter</kbd> scrolls back and moves the focus to the top (the first heading here), so <kbd class="ds-kbd">Tab</kbd> goes on from there.</p>');
  },
});
