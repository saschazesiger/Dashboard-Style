/*
 * The Motion Lab entry of DS.notifications: the centre opens as a side
 * sheet (DS.overlay), a notification arrives at the top (it fades in, the
 * others glide), and the sheet closes.
 */
var labCentre = null;

function labCentreOf() {
  if (labCentre && labCentre.isConnected) return labCentre;
  var host = document.createElement('div');
  host.innerHTML = '<dialog class="ds-sheet ds-notifications" id="sg-lab-notifications" aria-labelledby="sg-lab-notifications-title">' +
    '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel">' +
    '<div class="ds-sheet__head"><div class="ds-sheet__heading"><h2 class="ds-sheet__title" id="sg-lab-notifications-title">Notifications</h2><p class="ds-sheet__subtitle"></p></div>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + DS.icons.icon(DS.icons.close, 20) + '</button></div>' +
    '<div class="ds-sheet__body ds-notifications__feed" tabindex="0"></div></section></dialog>';
  labCentre = host.firstChild;
  (document.querySelector('.ds-theme') || document.body).append(labCentre);
  DS.notifications.create(labCentre, { items: [
    { id: 'lab-1', title: 'LAPTOP-0042 is offline', time: Date.now() - 600000, tone: 'warning', icon: DS.icons.wifiOff },
    { id: 'lab-2', title: 'The nightly backup finished', time: Date.now() - 3600000, tone: 'success', icon: DS.icons.checkCircle, read: true },
  ] });
  return labCentre;
}

var labArrivals = 0;

SG_LAB.add({
  id: 'notifications-arrive',
  group: 'overlays',
  title: 'Notification centre: a notification arrives',
  note: 'The sheet opens (DS.overlay); a notification arrives at the top: it fades in (ds-fade-in) while the others glide down (DS.motion.flip(), --ds-dur-medium on the spring); the unread dot comes in over --ds-dur-fast. Then the sheet closes and focus returns to the opener.',
  shows: ['DS.notifications.create', 'DS.notifications.open', 'DS.notifications.close', 'DS.motion.flip', 'ds-fade-in', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-spatial'],
  html: '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-lab-open>Open the centre</button></div>',
  height: 80,
  setup: function (stage) {
    stage.querySelector('[data-lab-open]').addEventListener('click', function (event) {
      DS.notifications.open(labCentreOf(), { opener: event.currentTarget });
    });
  },
  subject: function () { return labCentreOf(); },
  state: function () { return labCentreOf().getAttribute('data-state') === 'open'; },
  play: function (stage, sg) {
    var sheet = labCentreOf();
    var wait = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, sg.slow(ms)); }); };
    return DS.notifications.open(sheet, { opener: stage.querySelector('[data-lab-open]') })
      .then(function () {
        labArrivals += 1;
        DS.notifications.create(sheet).add({ id: 'lab-new-' + labArrivals, title: 'TABLET-0207 needs an update', time: Date.now(), icon: DS.icons.download, tone: 'info' }, { announce: false });
        return wait(50);
      })
      .then(function () { return DS.motion.settled(sheet.querySelector('.ds-notifications__feed'), { subtree: true }); })
      .then(function () { return wait(400); })
      .then(function () { return DS.notifications.close(sheet); });
  },
  toggle: function (stage, on) {
    var sheet = labCentreOf();
    return on ? DS.notifications.open(sheet, { opener: stage.querySelector('[data-lab-open]') }) : DS.notifications.close(sheet);
  },
});
