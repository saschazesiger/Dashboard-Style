/*
 * The Motion Lab entry of DS.menubutton: the menu grows out of the button
 * (DS.menu's entrance) while the chevron turns on the spring; closed
 * mid-way, both turn back from where they are.
 */
SG_LAB.add({
  id: 'menubutton-open',
  group: 'overlays',
  title: 'Menu button opens its menu',
  note: '<code>DS.menubutton.open()</code> and <code>close()</code>: the menu grows out of the button on the spring, the chevron (<code>.ds-chevron</code>) turns over <code>--ds-dur-medium</code>; the menu leaves with a quick fade and the chevron turns back.',
  shows: ['DS.menubutton.open', 'DS.menubutton.close', '.ds-menu-btn', '.ds-chevron', '--ds-dur-medium', '--ds-ease-spatial', '--ds-dur-instant'],
  html: '<div class="sg-popup-stage"><button class="ds-btn ds-menu-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-lab-menubutton" data-lab-open>Sort: <span class="ds-menu-btn__value">Name</span>' +
    '<span data-lab-chevron></span></button>' +
    '<div class="ds-menu" role="menu" id="sg-lab-menubutton" aria-label="Sort by" data-ds-menu-checks hidden>' +
    '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true" value="name"><span class="ds-menu__label">Name</span></button>' +
    '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" value="seen"><span class="ds-menu__label">Last seen</span></button>' +
    '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" value="owner"><span class="ds-menu__label">Owner</span></button></div></div>',
  height: 220,
  setup: function (stage) {
    // The system's own glyph, as a real menu button draws it.
    var slot = stage.querySelector('[data-lab-chevron]');
    slot.replaceWith(DS.icons.iconElement(DS.icons.chevronDown, 16, 'ds-chevron ds-menu-btn__chevron'));
    DS.menubutton.create(stage.querySelector('[data-lab-open]'), { menu: stage.querySelector('.ds-menu') });
  },
  subject: function (stage) { return stage.querySelector('.ds-menu'); },
  state: function (stage) { return stage.querySelector('[data-lab-open]').getAttribute('aria-expanded') === 'true'; },
  play: function (stage) {
    var button = stage.querySelector('[data-lab-open]');
    return DS.menubutton.open(button)
      .then(function () { return DS.menubutton.close(button); })
      .then(function () { return DS.motion.settled(stage.querySelector('.ds-menu')); });
  },
  toggle: function (stage, on) {
    var button = stage.querySelector('[data-lab-open]');
    return on ? DS.menubutton.open(button) : DS.menubutton.close(button);
  },
});
