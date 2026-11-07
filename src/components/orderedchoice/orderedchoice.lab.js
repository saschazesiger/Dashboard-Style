/*
 * The Motion Lab entry of DS.orderedchoice: a row moves to the top and back
 * (DS.dnd through DS.motion.flip); the rank discs follow.
 */
SG_LAB.add({
  id: 'orderedchoice-move',
  group: 'controls',
  title: 'Ordered choice: a row moves',
  note: 'The rows glide to their new places on <code>--ds-ease-spatial</code> (<code>DS.dnd</code> through <code>DS.motion.flip</code>); the rank discs change with them, and a disc fades in over <code>--ds-dur-fast</code> when its row is checked.',
  shows: ['DS.orderedchoice.create', '.ds-orderedchoice', '.ds-orderedchoice__item', '.ds-orderedchoice__rank', '--ds-ease-spatial', '--ds-dur-fast'],
  html: '<ol class="ds-orderedchoice" aria-label="Columns" style="inline-size: 280px;">' +
    ['Name', 'Status', 'Owner'].map(function (name, index) {
      return '<li class="ds-orderedchoice__item"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move ' + name + '"></button>' +
        '<label class="ds-check"><input type="checkbox" value="' + name.toLowerCase() + '"' + (index < 2 ? ' checked' : '') + '><span>' + name + '</span></label><span class="ds-orderedchoice__rank"></span></li>';
    }).join('') + '</ol>',
  height: 220,
  setup: function (stage) {
    stage.querySelectorAll('.ds-grip').forEach(function (grip) { grip.innerHTML = DS.icons.icon(DS.icons.grip, 20); });
    DS.orderedchoice.create(stage.querySelector('.ds-orderedchoice'));
  },
  state: function (stage) { return DS.orderedchoice.create(stage.querySelector('.ds-orderedchoice')).order()[0] === 'owner'; },
  play: function (stage) {
    var list = stage.querySelector('.ds-orderedchoice');
    var control = DS.orderedchoice.create(list);
    control.set(['name', 'status']);
    control.move('owner', 0);
    return DS.motion.settled(list, { subtree: true })
      .then(function () { control.move('owner', 2); return DS.motion.settled(list, { subtree: true }); });
  },
  toggle: function (stage, on) {
    var list = stage.querySelector('.ds-orderedchoice');
    DS.orderedchoice.create(list).move('owner', on ? 0 : 2);
    return DS.motion.settled(list, { subtree: true });
  },
  reset: function (stage) { DS.orderedchoice.create(stage.querySelector('.ds-orderedchoice')).set(['name', 'status']); },
});
