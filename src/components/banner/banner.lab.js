/*
 * The Motion Lab entry of DS.banner: messages come and go above a view
 * inside DS.motion.flip() on the panel, so the view glides and nothing
 * animates a height; a message that appears fades in.
 */
var LAB_BANNERS = [
  { id: 'lab-notice', tone: 'info', text: 'Maintenance on Sunday, 02:00 to 04:00.' },
  { id: 'lab-urgent', tone: 'error', text: 'Sign-in is down for some people.' },
];

SG_LAB.add({
  id: 'banner-priority',
  group: 'feedback',
  title: 'Banner messages in priority order',
  note: 'A broadcast arrives (the urgent one goes first), "Show more" reveals the waiting ones, a dismissal hides one: each a change inside DS.motion.flip() on the panel. The view glides (--ds-dur-medium, --ds-ease-spatial), the message that appears fades in (ds-fade-in); no height animates.',
  shows: ['DS.banner.create', 'DS.motion.flip', 'ds-fade-in', '--ds-dur-medium', '--ds-ease-spatial'],
  // Unnamed: this page's own panel is the one ds-panel of a View Transition (the drawer demo runs one).
  html: '<div class="ds-panel" style="margin: 0; min-height: 0; border: 1px solid var(--ds-line); view-transition-name: none;">' +
    '<div class="ds-banner" data-lab-banner data-ds-banner-remember="off"></div>' +
    '<div class="ds-content"><p class="ds-muted">The view.</p></div></div>',
  height: 220,
  setup: function (stage) {
    stage._banner = DS.banner.create(stage.querySelector('[data-lab-banner]'));
  },
  // Back to two messages, folded: the error shows, the notice waits.
  reset: function (stage) {
    ['lab-notice', 'lab-urgent'].forEach(function (id) { stage._banner.restore(id); });
    stage._banner.set(LAB_BANNERS);
    stage._banner.expand(false);
    return DS.motion.settled(stage.querySelector('.ds-panel'), { subtree: true });
  },
  state: function (stage) { return stage.querySelectorAll('.ds-banner > .ds-alert:not([hidden])').length > 1; },
  play: function (stage, sg) {
    var banner = stage._banner;
    var panel = stage.querySelector('.ds-panel');
    var wait = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, sg.slow(ms)); }); };
    banner.set([{ id: 'lab-notice', tone: 'info', text: 'Maintenance on Sunday, 02:00 to 04:00.' }]);
    return DS.motion.settled(panel, { subtree: true })
      .then(function () { banner.add({ id: 'lab-urgent', tone: 'error', text: 'Sign-in is down for some people.' }); return wait(50); })
      .then(function () { return DS.motion.settled(panel, { subtree: true }); })
      .then(function () { banner.expand(true); return wait(50); })
      .then(function () { return DS.motion.settled(panel, { subtree: true }); })
      .then(function () { banner.dismiss('lab-urgent'); return wait(50); })
      .then(function () { return DS.motion.settled(panel, { subtree: true }); });
  },
  toggle: function (stage, on) {
    var banner = stage._banner;
    if (stage.querySelectorAll('.ds-banner > .ds-alert').length < 2 || banner.get().length === 0) {
      ['lab-notice', 'lab-urgent'].forEach(function (id) { banner.restore(id); });
      banner.set(LAB_BANNERS);
    }
    banner.expand(on);
  },
});
