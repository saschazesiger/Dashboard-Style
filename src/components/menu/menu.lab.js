/*
 * The Motion Lab entry of DS.menu: a menu with descriptions and a danger item.
 * The menu's other entries (near the bottom edge, the cut edges) sit in
 * styleguide/lab.js, shared with the overlay table of docs/motion.md.
 */
SG_LAB.add({
  id: 'menu-rich',
  group: 'overlays',
  title: 'Menu through DS.menu, with descriptions',
  note: 'It grows out of its trigger on the spring whatever its rows hold, and leaves with a quick fade; closed mid-way, it turns back from where it is.',
  shows: ['DS.menu.open', 'DS.menu.close', '--ds-dur-medium', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div class="sg-popup-stage"><button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-menu-rich" data-lab-open>Export</button>' +
    '<div class="ds-menu" role="menu" id="sg-lab-menu-rich" aria-label="Export" hidden>' +
    '<button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__content"><span class="ds-menu__label">Download</span><span class="ds-menu__description">A CSV file with every column.</span></span><span class="ds-menu__shortcut">Ctrl E</span></button>' +
    '<button class="ds-menu__item ds-menu__item--danger" role="menuitem" type="button"><span class="ds-menu__label">Delete the export</span></button></div></div>',
  height: 200,
  setup: function (stage) {
    var trigger = stage.querySelector('[data-lab-open]');
    var menu = stage.querySelector('.ds-menu');
    trigger.addEventListener('click', function () {
      if (menu.getAttribute('data-state') === 'open') DS.menu.close(menu);
      else DS.menu.open(menu, { opener: trigger });
    });
  },
  subject: function (stage) { return stage.querySelector('.ds-menu'); },
  state: function (stage) { return stage.querySelector('.ds-menu').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var menu = stage.querySelector('.ds-menu');
    return DS.menu.open(menu, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { return DS.menu.close(menu); })
      .then(function () { return DS.motion.settled(menu); });
  },
  toggle: function (stage, on) {
    var menu = stage.querySelector('.ds-menu');
    return on ? DS.menu.open(menu, { opener: stage.querySelector('[data-lab-open]') }) : DS.menu.close(menu);
  },
});
