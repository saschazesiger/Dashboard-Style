/* An exclusive accordion: details[name], the one that closes plays the same motion. */
SG_LAB.add({
  id: 'disclosure-accordion',
  group: 'utilities',
  title: 'Exclusive accordion',
  note: 'Rows that share a <code>name</code> open one at a time, with no script: the browser closes the other row, and both play the motion of <code>.ds-collapsible</code> and the <code>.ds-chevron</code> at once.',
  shows: ['.ds-disclosure--row', '.ds-disclosure-list', '.ds-collapsible', '.ds-chevron', '--ds-dur-medium', '--ds-dur-fast'],
  html: '<div class="ds-disclosure-list">' + ['When does the sync run?', 'What does a lock mean?'].map(function (title, index) {
    return '<details class="ds-collapsible ds-disclosure ds-disclosure--row" name="lab-accordion"' + (index === 0 ? ' open' : '') + '><summary><span class="ds-disclosure__title">' + title + '</span></summary><div class="ds-disclosure__body"><p class="ds-muted">Every night at 02:00; a manual run starts at once.</p></div></details>';
  }).join('') + '</div>',
  height: 200,
  setup: function (stage) {
    stage.querySelectorAll('summary').forEach(function (summary) { summary.insertAdjacentHTML('beforeend', DS.icons.icon(DS.icons.chevronDown, 20, 'ds-chevron')); });
  },
  play: function (stage) {
    var rows = stage.querySelectorAll('details');
    var next = rows[0].open ? rows[1] : rows[0];
    next.open = true;
    return DS.motion.settled(stage, { transitions: true, subtree: true });
  },
  state: function (stage) { return stage.querySelectorAll('details')[1].open; },
  toggle: function (stage, on) {
    stage.querySelectorAll('details')[on ? 1 : 0].open = true;
    return DS.motion.settled(stage, { transitions: true, subtree: true });
  },
});
