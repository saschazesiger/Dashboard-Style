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

/*
 * A submenu: it grows out of its item, beside it, and goes with its parent.
 */
SG_LAB.add({
  id: 'menu-submenu',
  group: 'overlays',
  title: 'Submenu beside its item',
  note: 'It grows out of its item towards the end on the spring, its first item level with it; ArrowLeft or Escape closes it onto the item, and the parent takes it along when it closes.',
  shows: ['.ds-menu__chevron', '--ds-delay-tooltip-hide', '--ds-delay-tooltip-skip', '--ds-scale-popup'],
  html: '<div class="sg-popup-stage"><button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-menu-parent" data-lab-open>Device</button>' +
    '<div class="ds-menu" role="menu" id="sg-lab-menu-parent" aria-label="Device" hidden>' +
    '<button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Rename</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-menu-sub" data-lab-sub><span class="ds-menu__label">Move to</span>' +
    '<svg class="ds-menu__chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>' +
    '<div class="ds-menu" role="menu" id="sg-lab-menu-sub" aria-label="Move to" hidden>' +
    '<button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Storage room</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Front desk</span></button></div></div></div>',
  height: 220,
  setup: function (stage) {
    var trigger = stage.querySelector('[data-lab-open]');
    var menu = stage.querySelector('#sg-lab-menu-parent');
    trigger.addEventListener('click', function () {
      if (menu.getAttribute('data-state') === 'open') DS.menu.close(menu);
      else DS.menu.open(menu, { opener: trigger });
    });
  },
  subject: function (stage) { return stage.querySelector('#sg-lab-menu-sub'); },
  state: function (stage) { return stage.querySelector('#sg-lab-menu-sub').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var menu = stage.querySelector('#sg-lab-menu-parent');
    var sub = stage.querySelector('#sg-lab-menu-sub');
    return DS.menu.open(menu, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () { stage.querySelector('[data-lab-sub]').click(); return DS.motion.settled(sub); })
      .then(function () { return DS.menu.close(menu); })
      .then(function () { return DS.motion.settled(sub); });
  },
  toggle: function (stage, on) {
    var menu = stage.querySelector('#sg-lab-menu-parent');
    var sub = stage.querySelector('#sg-lab-menu-sub');
    if (!on) return DS.menu.close(sub);
    // The parent opens (if it is not open) and the submenu at once, so the
    // submenu's own entrance is what a reversal turns back.
    if (menu.getAttribute('data-state') !== 'open') DS.menu.open(menu, { opener: stage.querySelector('[data-lab-open]') });
    stage.querySelector('[data-lab-sub]').click();
    return DS.motion.settled(sub);
  },
});

/*
 * A context menu at the pointer: DS.menu.openAt() grows it from the point.
 */
SG_LAB.add({
  id: 'menu-context',
  group: 'overlays',
  title: 'Context menu at a point',
  note: 'It grows from the point it was asked at (a right click, a long press), below and after it, and leaves with a quick fade.',
  shows: ['DS.menu.openAt', '--ds-dur-medium', '--ds-ease-spatial', '--ds-dur-instant'],
  html: '<div class="sg-popup-stage"><div class="ds-pressable ds-pressable--inset" tabindex="0" data-lab-row style="padding:var(--ds-space-3)">LAPTOP-0042: right-click me</div>' +
    '<div class="ds-menu" role="menu" id="sg-lab-menu-context" aria-label="Device actions" hidden>' +
    '<button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Rename</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Duplicate</span></button></div></div>',
  height: 200,
  setup: function (stage) {
    var row = stage.querySelector('[data-lab-row]');
    row.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      DS.menu.openAt(stage.querySelector('.ds-menu'), { x: event.clientX, y: event.clientY, opener: row });
    });
  },
  subject: function (stage) { return stage.querySelector('.ds-menu'); },
  state: function (stage) { return stage.querySelector('.ds-menu').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var menu = stage.querySelector('.ds-menu');
    var row = stage.querySelector('[data-lab-row]');
    var box = row.getBoundingClientRect();
    return DS.menu.openAt(menu, { x: box.left + box.width / 2, y: box.top + box.height / 2, opener: row })
      .then(function () { return DS.menu.close(menu); })
      .then(function () { return DS.motion.settled(menu); });
  },
  toggle: function (stage, on) {
    var menu = stage.querySelector('.ds-menu');
    var row = stage.querySelector('[data-lab-row]');
    var box = row.getBoundingClientRect();
    return on ? DS.menu.openAt(menu, { x: box.left + box.width / 2, y: box.top + box.height / 2, opener: row }) : DS.menu.close(menu);
  },
});
