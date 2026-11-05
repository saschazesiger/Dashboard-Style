/*
 * The Motion Lab entry of DS.loadingoverlay: a card blocked while it saves.
 */
SG_LAB.add({
  id: 'loadingoverlay-show',
  group: 'feedback',
  title: 'Loading overlay over a card',
  note: 'The card is blocked at once; after --ds-delay-loader the veil and the box fade in over --ds-dur-fast while the box rises --ds-distance-sm on --ds-ease-out. Once visible it stays for --ds-hold-loader at least, then fades out over --ds-dur-instant.',
  shows: ['DS.loadingoverlay.show', 'DS.loadingoverlay.hide', 'DS.loadingoverlay.wait', '.ds-loadingoverlay', '--ds-delay-loader', '--ds-hold-loader', '--ds-dur-fast', '--ds-dur-instant', '--ds-distance-sm'],
  html: '<section class="ds-card" aria-label="LAPTOP-0042" style="position:relative;inline-size:100%;min-block-size:160px" data-lab-card>' +
    '<h2 class="ds-card__title">LAPTOP-0042</h2><p class="ds-muted">Owner: Ada Lovelace</p><p class="ds-muted">Location: Building A</p></section>',
  height: 200,
  subject: function (stage) { return stage.querySelector('[data-lab-card] .ds-loadingoverlay') || stage.querySelector('[data-lab-card]'); },
  state: function (stage) { var veil = stage.querySelector('[data-lab-card] .ds-loadingoverlay'); return Boolean(veil && veil.getAttribute('data-state') === 'open'); },
  play: function (stage) {
    var card = stage.querySelector('[data-lab-card]');
    return DS.loadingoverlay.wait(card, new Promise(function (resolve) {
      setTimeout(resolve, DS.motion.motionDuration(card, '--ds-dur-glide') * 2);
    }), { message: 'Saving LAPTOP-0042 ...' });
  },
  toggle: function (stage, on) {
    var card = stage.querySelector('[data-lab-card]');
    if (on) DS.loadingoverlay.show(card, { message: 'Saving LAPTOP-0042 ...' });
    else return DS.loadingoverlay.hide(card);
    return Promise.resolve();
  },
});
