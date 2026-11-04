/* The pulse of a skeleton: the bones breathe in place, on the loop token, instead of the wave passing over them. */
(function () {
  var html = '<div class="ds-skeleton ds-skeleton--pulse" role="status" style="width:100%"><span class="ds-sr">Loading ...</span>' +
    '<div class="ds-skeleton__row" aria-hidden="true"><span class="ds-skeleton__avatar"></span><span class="ds-skeleton__lines"><span class="ds-skeleton__line ds-skeleton__line--mid"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></span></div>' +
    '<span class="ds-skeleton__media" style="max-width:240px" aria-hidden="true"></span></div>';

  SG_LAB.add({
    id: 'skeleton-pulse',
    group: 'feedback',
    title: 'Skeleton pulse',
    note: '<code>.ds-skeleton--pulse</code>: each bone shows the highlight, its opacity breathing on <code>ds-fade-in</code>, infinite and alternate, on <code>--ds-loop-skeleton</code> and <code>--ds-ease-in-out</code>, after <code>--ds-delay-loader</code>. A loop, so Replay starts it over.',
    shows: ['.ds-skeleton--pulse', 'ds-fade-in', '--ds-loop-skeleton', '--ds-delay-loader', '--ds-ease-in-out', '--ds-skeleton-highlight'],
    html: html,
    height: 240,
    play: function (stage) {
      stage.innerHTML = html;
      return DS.motion.settled(stage.querySelector('.ds-skeleton'));
    },
  });
})();
