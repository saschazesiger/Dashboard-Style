/* The Motion Lab entry of DS.transcript: the "Latest" pill comes while the reader is scrolled up and a reply arrives, and goes at the end. */
SG_LAB.add({
  id: 'transcript-latest',
  group: 'data',
  title: 'Transcript: the "Latest" pill',
  note: 'Scrolled up, a message that arrives brings the pill (a <code>.ds-presence</code>) with its count; "Latest" glides back to the end within one screen and the pill goes.',
  shows: ['DS.transcript.create', '.ds-transcript', '.ds-presence', '.ds-jump'],
  html: '<div class="ds-transcript" role="region" aria-label="Conversation" tabindex="0" style="block-size:200px">' +
    '<div class="ds-transcript__list" role="log" aria-label="Messages">' +
    ['Which devices need attention?', 'Laptop 4, the monitor in room 2 and the router.', 'Why laptop 4?', 'It drains overnight: wake for network access is on.', 'And the router?', 'It restarted twice; it is fine now.']
      .map(function (text, i) {
        return '<div class="ds-message ds-message--' + (i % 2 ? 'assistant' : 'user') + '"><div class="ds-message__main"><p class="ds-message__content">' + text + '</p></div></div>';
      }).join('') + '</div></div>',
  height: 220,
  setup: function (stage) {
    stage.transcript = DS.transcript.create(stage.querySelector('.ds-transcript'));
  },
  subject: function (stage) { return stage.querySelector('.ds-presence'); },
  state: function (stage) { return !stage.transcript.get().atEnd; },
  toggle: function (stage, on) {
    var log = stage.querySelector('.ds-transcript');
    var pill = stage.querySelector('.ds-presence');
    if (on) {
      log.scrollTop = 0;
      var message = document.createElement('div');
      message.className = 'ds-message ds-message--assistant';
      message.innerHTML = '<div class="ds-message__main"><p class="ds-message__content">A new reply.</p></div>';
      stage.querySelector('.ds-transcript__list').append(message);
    } else stage.transcript.stick();
    // The module answers the scroll and the new message a frame later; then
    // the pill's transitions run (and a smooth scroll back, if any).
    return new Promise(function (resolve) { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); })
      .then(function () { return DS.motion.settled(pill, { transitions: true }); });
  },
  play: function (stage) {
    var lab = this;
    return lab.toggle(stage, true).then(function () { return lab.toggle(stage, false); });
  },
});
