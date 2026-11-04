/*
 * Motion Lab: the pill across the levels of a nested drawer group. The indent
 * is padding, so the pill keeps the row's full width and only travels; the
 * labels change colour on its timing. The rail, the modal drawer, the switch
 * and the drawer with a view have their demos in lab.js.
 */
function row(glyph, label, current) {
  return '<a class="ds-drawer__item" href="#navigation"' + (current ? ' aria-current="page"' : '') + '><span data-glyph="' + glyph + '"></span><span class="ds-drawer__label">' + label + '</span></a>';
}

function goTo(stage, last, sg) {
  var rows = Array.from(stage.querySelectorAll('.ds-drawer__item'));
  rows.forEach(function (item, index) {
    if (index === (last ? rows.length - 1 : 0)) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  return sg.frames(2).then(function () { return DS.motion.settled(stage.querySelector('.ds-drawer__indicator')); });
}

function atLast(stage) {
  var rows = stage.querySelectorAll('.ds-drawer__item');
  return rows[rows.length - 1].getAttribute('aria-current') === 'page';
}

SG_LAB.add({
  id: 'drawer-nested',
  group: 'navigation',
  title: 'Drawer: the pill across nested groups',
  note: 'A group inside a group indents its rows by padding (<code>--ds-drawer-indent</code>), so the pill keeps the row\'s width and only travels, on the spring, its time growing with the distance.',
  shows: ['DS.indicator.createIndicator', '.ds-drawer__indicator', '--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-slow'],
  html: '<div class="ds-drawer__list" style="inline-size: 256px; overflow: visible;">' +
    '<div class="ds-drawer__group">' + row('home', 'Overview', true) +
      '<div class="ds-drawer__group"><p class="ds-drawer__heading">Tickets</p>' + row('ticket', 'Open') +
        '<div class="ds-drawer__group"><p class="ds-drawer__heading">Archive</p>' + row('history', 'This year') + '</div>' +
      '</div>' +
    '</div></div>',
  height: 300,
  setup: function (stage, sg) {
    // The icons come with DS: this file loads before the lab runs, on any page.
    stage.querySelectorAll('[data-glyph]').forEach(function (slot) {
      slot.replaceWith(DS.icons.iconElement(DS.icons[slot.getAttribute('data-glyph')], 20));
    });
    sg.indicator(stage.querySelector('.ds-drawer__list'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator' });
    stage.addEventListener('click', function (event) { if (event.target.closest('a')) event.preventDefault(); });
  },
  play: function (stage, sg) { return goTo(stage, !atLast(stage), sg); },
  reset: function (stage, sg) { return goTo(stage, false, sg); },
  state: atLast,
  toggle: function (stage, on, sg) { return goTo(stage, on, sg); },
});
