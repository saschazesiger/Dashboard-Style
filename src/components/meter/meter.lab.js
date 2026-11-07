/* Meter variants: a gauge, an arc and a bar gauge fill from zero, then glide between two shares with their figures. */
(function () {
  var LOW = 0.32;
  var HIGH = 0.86;

  function figureOf(meter) {
    return meter.querySelector('.ds-gauge__value, .ds-bar-gauge__value');
  }

  function setShare(stage, share) {
    var percent = Math.round(share * 100);
    stage.querySelectorAll('[data-lab-meter]').forEach(function (meter) {
      meter.style.setProperty('--ds-share', String(share));
      meter.setAttribute('aria-valuenow', String(percent));
      meter.setAttribute('aria-valuetext', percent + '%');
      DS.motion.countUp(figureOf(meter), percent, { from: parseFloat(figureOf(meter).textContent) || 0, format: function (value) { return Math.round(value) + '%'; } });
    });
    return DS.motion.settled(stage.querySelector('[data-lab-meter]'));
  }

  SG_LAB.add({
    id: 'meter-share',
    group: 'data',
    title: 'Gauges and bar gauge',
    note: 'A ring, a gauge and a bar gauge read <code>--ds-share</code>: the first render fills from zero (<code>.ds-enter--fill</code>), a new share glides on <code>--ds-ease-value</code> over <code>--ds-dur-glide</code> while <code>DS.motion.countUp()</code> counts the figure on the same frame. A share set mid-glide takes over from where the fill is.',
    shows: ['.ds-gauge', '.ds-gauge--arc', '.ds-bar-gauge', '.ds-meter--segmented', '.ds-enter--fill', 'ds-fill-share', '--ds-share', '--ds-ease-value', '--ds-dur-glide'],
    html: '<div class="sg-row">' +
      '<div class="ds-gauge" role="meter" aria-label="Storage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="32" style="--ds-share: ' + LOW + '" data-lab-meter><span class="ds-gauge__value" aria-hidden="true">32%</span><span class="ds-gauge__label" aria-hidden="true">Storage</span></div>' +
      '<div class="ds-gauge ds-gauge--arc" role="meter" aria-label="CPU" aria-valuemin="0" aria-valuemax="100" aria-valuenow="32" style="--ds-share: ' + LOW + '" data-lab-meter><span class="ds-gauge__threshold" style="--ds-share: .8" aria-hidden="true"></span><span class="ds-gauge__value" aria-hidden="true">32%</span><span class="ds-gauge__label" aria-hidden="true">CPU</span></div>' +
      '</div><div class="ds-bar-gauge" role="meter" aria-label="Memory" aria-valuemin="0" aria-valuemax="100" aria-valuenow="32" style="--ds-share: ' + LOW + '; --ds-bar-gauge-warning: .7; --ds-bar-gauge-error: .9; inline-size: min(100%, 360px)" data-lab-meter><span class="ds-bar-gauge__label">Memory</span><span class="ds-bar-gauge__value">32%</span><span class="ds-bar-gauge__track" aria-hidden="true"></span></div>' +
      '<span class="ds-meter ds-meter--segmented" role="meter" aria-label="Score" aria-valuemin="0" aria-valuemax="5" aria-valuenow="2" style="--ds-share: .4; inline-size: min(100%, 360px)"></span>',
    height: 280,
    play: function (stage) {
      var meters = Array.prototype.slice.call(stage.querySelectorAll('[data-lab-meter], .ds-meter--segmented'));
      return DS.motion.enterAll(meters, 'fill', { stagger: false });
    },
    toggle: function (stage, on) {
      return setShare(stage, on ? HIGH : LOW);
    },
    state: function (stage) {
      return parseFloat(stage.querySelector('[data-lab-meter]').style.getPropertyValue('--ds-share')) > 0.5;
    },
  });
})();
