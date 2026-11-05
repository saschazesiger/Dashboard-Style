/* The meter's ballistics: a burst rises at once, the bar falls over --ds-dur-glide per full scale, the peak holds --ds-hold-status and falls. */
(function () {
  function meterOf(stage) {
    var el = stage.querySelector('.ds-levelmeter');
    stage.levelmeter = stage.levelmeter || DS.core.get(el, 'levelmeter') || DS.levelmeter.create(el);
    return stage.levelmeter;
  }

  /* Resolves once the bar and the peak are back at the level asked for. */
  function rest(stage, value) {
    var meter = meterOf(stage);
    return new Promise(function (resolve) {
      (function wait() {
        var state = meter.get();
        var track = stage.querySelector('.ds-levelmeter__track');
        var shown = parseFloat(track.style.getPropertyValue('--ds-levelmeter-level')) || 0;
        if (Math.abs(shown - value) < 0.002 && Math.abs(state.peak - value) < 0.002) resolve();
        else requestAnimationFrame(wait);
      })();
    });
  }

  SG_LAB.add({
    id: 'levelmeter-ballistics',
    group: 'feedback',
    title: 'Level meter',
    note: '<code>DS.levelmeter.create()</code>: a burst rises at once; the bar falls over <code>--ds-dur-glide</code> per full scale, the peak mark holds <code>--ds-hold-status</code> and then falls the same way. Live data: no transition, the ballistics run per frame.',
    shows: ['DS.levelmeter.create', '.ds-levelmeter', '.ds-levelmeter__fill', '.ds-levelmeter__peak', '--ds-dur-glide', '--ds-hold-status'],
    html: '<div class="ds-levelmeter ds-xl" style="inline-size: 280px;"><span class="ds-levelmeter__label" id="sg-lab-level">Microphone</span>' +
      '<div class="ds-levelmeter__track" role="meter" aria-labelledby="sg-lab-level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="ds-levelmeter__fill"></span><span class="ds-levelmeter__peak"></span></div>' +
      '<span class="ds-levelmeter__note" aria-live="polite"></span></div>',
    height: 140,
    play: function (stage) {
      var meter = meterOf(stage);
      meter.set(0.8);
      return new Promise(function (resolve) { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); })
        .then(function () { meter.set(0); return rest(stage, 0); });
    },
    toggle: function (stage, on) {
      meterOf(stage).set(on ? 0.7 : 0);
      return rest(stage, on ? 0.7 : 0);
    },
    state: function (stage) {
      return meterOf(stage).get().level > 0;
    },
    reset: function (stage) {
      meterOf(stage).set(0);
      return rest(stage, 0);
    },
  });
})();
