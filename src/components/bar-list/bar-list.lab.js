/* Bar list: the bars fill from zero, then glide between two sets of shares. */
(function () {
  var LOW = [1, 0.42, 0.24, 0.12];
  var HIGH = [1, 0.86, 0.6, 0.35];
  var NAMES = ['Printers', 'Laptops', 'Monitors', 'Routers'];

  function setShares(stage, shares) {
    stage.querySelectorAll('.ds-bar-list__item').forEach(function (row, index) {
      row.style.setProperty('--ds-share', String(shares[index]));
    });
    return DS.motion.settled(stage.querySelector('.ds-bar-list__item:nth-child(2)'));
  }

  SG_LAB.add({
    id: 'bar-list-share',
    group: 'data',
    title: 'Bar list',
    note: 'Each row reads <code>--ds-share</code>: the first render fills from zero (<code>.ds-enter--fill</code>), a new share glides on <code>--ds-ease-value</code> over <code>--ds-dur-glide</code>, from where the bar is when it is set mid-glide.',
    shows: ['.ds-bar-list', '.ds-enter--fill', '--ds-share', '--ds-ease-value', '--ds-dur-glide'],
    html: '<ol class="ds-bar-list" aria-label="Tickets per device type" style="inline-size: min(100%, 420px)">' + NAMES.map(function (name, index) {
      return '<li class="ds-bar-list__item" style="--ds-share: ' + LOW[index] + '"><span class="ds-bar-list__label"><span>' + name + '</span></span><span class="ds-bar-list__value">' + Math.round(LOW[index] * 400) + '</span></li>';
    }).join('') + '</ol>',
    play: function (stage) {
      var rows = Array.prototype.slice.call(stage.querySelectorAll('.ds-bar-list__item'));
      DS.motion.enterAll(rows, 'fill', { stagger: false });
      return DS.motion.settled(rows[1]);
    },
    toggle: function (stage, on) {
      return setShares(stage, on ? HIGH : LOW);
    }
  });
})();
