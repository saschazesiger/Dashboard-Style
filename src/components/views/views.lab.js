/*
 * The Motion Lab entry of DS.views: the trigger's chevron turns while its
 * menu is open, on the spring, and back from wherever it is.
 */
SG_LAB.add({
  id: 'views-chevron',
  group: 'data',
  title: 'Saved views: the trigger opens its menu',
  note: 'The chevron turns 180deg on the spring (--ds-dur-medium, --ds-ease-spatial) while the menu is open, as a disclosure chevron; the menu plays its own entrance. Rapid toggles turn it back from where it is.',
  shows: ['DS.views.create', '.ds-views', '.ds-views__chevron', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div class="ds-views" data-lab-views data-ds-views-url="off" data-ds-views-key="sg-lab">' +
    '<button class="ds-btn ds-views__trigger" type="button" aria-haspopup="menu" aria-expanded="false">' +
    '<span class="ds-views__name"></span><span class="ds-views__edited" hidden></span></button>' +
    '<div class="ds-views__list" hidden><button class="ds-menu__item" role="menuitemradio" type="button" data-ds-view="all">' +
    '<span class="ds-menu__label">All devices</span></button></div></div>',
  height: 96,
  setup: function (stage) {
    // The glyphs come from DS.icons, which the lab loads before it renders the stage.
    var trigger = stage.querySelector('.ds-views__trigger');
    trigger.insertAdjacentHTML('afterbegin', DS.icons.icon(DS.icons.layers, 20));
    trigger.insertAdjacentHTML('beforeend', DS.icons.icon(DS.icons.chevronDown, 20, 'ds-views__chevron'));
    DS.views.create(stage.querySelector('[data-lab-views]'));
  },
  subject: function (stage) { return stage.querySelector('.ds-views__chevron'); },
  state: function (stage) { return stage.querySelector('.ds-views__trigger').getAttribute('aria-expanded') === 'true'; },
  play: function (stage) {
    var trigger = stage.querySelector('.ds-views__trigger');
    var chevron = stage.querySelector('.ds-views__chevron');
    trigger.setAttribute('aria-expanded', 'true');
    return DS.motion.settled(chevron).then(function () {
      trigger.setAttribute('aria-expanded', 'false');
      return DS.motion.settled(chevron);
    });
  },
  toggle: function (stage, on) {
    stage.querySelector('.ds-views__trigger').setAttribute('aria-expanded', String(on));
    return DS.motion.settled(stage.querySelector('.ds-views__chevron'));
  },
});
