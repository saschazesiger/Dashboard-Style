/* The shimmer: a glint that travels over the words, a pass and a pause, on the progress wave's keyframe. */
SG_LAB.add({
  id: 'shimmer',
  group: 'feedback',
  title: 'Shimmer',
  note: '<code>.ds-shimmer</code>: a copy of the text in <code>--ds-shimmer-glint</code> through a band of a mask that travels one <code>--ds-shimmer-length</code> per round (<code>--ds-loop-shimmer</code>, the loader\'s 4.55s), on <code>ds-progress-wave</code>. Replay switches it on and off; slow it down with the speed select.',
  shows: ['.ds-shimmer', 'ds-progress-wave', '--ds-loop-loader'],
  html: '<p><span class="ds-shimmer" data-shimmer="Running npm test" data-lab-shimmer>Running npm test</span></p>',
  height: 120,
  play: function (stage) {
    var line = stage.querySelector('[data-lab-shimmer]');
    line.classList.toggle('ds-shimmer');
    return Promise.resolve();
  },
  toggle: function (stage, on) {
    stage.querySelector('[data-lab-shimmer]').classList.toggle('ds-shimmer', on);
    return Promise.resolve();
  },
  state: function (stage) {
    return stage.querySelector('[data-lab-shimmer]').classList.contains('ds-shimmer');
  },
});
