/*
 * Motion Lab: back to top. The button scales in once the box is scrolled
 * down and out again at the top; toggled fast, it continues from where it is.
 */
function backtopMarkup() {
  var rows = '';
  for (var index = 0; index < 24; index += 1) rows += '<p style="margin: 0; padding-block: var(--ds-space-2);">Event ' + (index + 1) + '</p>';
  return '<div data-lab="backtop" style="block-size: 200px; inline-size: 320px; overflow-y: auto; padding: 0 var(--ds-space-3) var(--ds-space-3); border: 1px solid var(--ds-line);">' + rows +
    '<button class="ds-btn ds-btn--elevated ds-btn--icon ds-backtop" type="button" hidden>' + DS.icons.icon(DS.icons.arrowUp, 20) + '</button></div>';
}

SG_LAB.add({
  id: 'backtop-show',
  group: 'navigation',
  title: 'Back to top: appears after a scroll',
  note: 'Scrolled past the threshold, the button enters with <code>.ds-enter--scale</code>; back at the top it leaves with <code>.ds-leave--scale</code> (0.3-0.8 of the entrance). Toggle fast: it continues from where it is.',
  shows: ['DS.backtop.create', '.ds-backtop', 'ds-grow-in', 'ds-shrink-out', '--ds-dur-medium'],
  html: backtopMarkup(),
  height: 220,
  setup: function (stage) {
    stage.dsBacktop = DS.backtop.create(stage.querySelector('.ds-backtop'), { after: 80 });
  },
  play: function (stage) {
    var box = stage.querySelector('[data-lab="backtop"]');
    box.scrollTop = 0;
    stage.dsBacktop.set(true);
    return DS.motion.settled(stage.querySelector('.ds-backtop'));
  },
  reset: function (stage) {
    stage.dsBacktop.set(false);
    return DS.motion.settled(stage.querySelector('.ds-backtop'));
  },
  state: function (stage) { return stage.dsBacktop.get(); },
  toggle: function (stage, on) {
    stage.dsBacktop.set(on);
    return DS.motion.settled(stage.querySelector('.ds-backtop'));
  },
});
