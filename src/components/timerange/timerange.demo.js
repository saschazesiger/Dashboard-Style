/*
 * The Time range demo: the range control of a monitoring view over a list
 * of fake device metrics. The range, the popover, the recent ranges and the
 * auto refresh come from the system (data-ds-timerange); wire() is the page:
 * it listens to ds:refresh and "loads" again, and keeps the range in the
 * address it would write.
 */
SG.demo('timerange', {
  title: 'Time range',
  group: 'forms',
  need: 'Choose the time range of a monitoring view, relative or absolute, and refresh it now or on an interval',
  lead: 'Quick relative ranges, an absolute from and to, the ranges used recently (remembered in the browser) and an auto-refresh interval. The values are short and readable, so the range belongs in the address: from=now-1h&to=now.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Monitoring view', '<div class="ds-stack" data-demo="view">' +
        '<div class="sg-row"><div class="ds-timerange" data-ds-timerange data-ds-timerange-from="now-1h" data-ds-timerange-to="now" data-ds-timerange-store="sg-devices" data-demo="range"></div></div>' +
        '<p class="ds-meta" data-demo="address">?from=now-1h&amp;to=now</p>' +
        '<p class="ds-meta" data-demo="loaded" aria-live="polite">CPU of LAPTOP-0042: waiting for the first load.</p>' +
        '</div>', 'Open the range: a quick range applies at once, an absolute one with Apply. The refresh button sends ds:refresh, and so does every tick of the interval.') +

      h.section('Absolute range in UTC, refreshing', '<div class="sg-row" data-demo="utc">' +
        '<div class="ds-timerange" data-ds-timerange data-ds-timerange-from="now/d" data-ds-timerange-to="now/d" data-ds-timerange-refresh="1m" data-ds-timerange-zone="UTC" data-ds-timerange-quick="now-15m,now-1h,now-6h,now-24h,now/d,now-1d/d,now/w" data-ds-timerange-intervals="30s,1m,5m" data-ds-timerange-store="sg-utc"></div>' +
        '</div>', 'Today, refreshed every minute; absolute times are typed and shown in UTC.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> on the range opens it; <kbd class="ds-kbd">Tab</kbd> moves through the quick ranges, the two fields, Apply and the recent ranges; <kbd class="ds-kbd">Enter</kbd> applies one, <kbd class="ds-kbd">Escape</kbd> closes without a change. The interval is a native select.</p>');
  },

  wire: function (root, h) {
    var range = h.$('[data-demo="range"]', root);
    var address = h.$('[data-demo="address"]', root);
    var loaded = h.$('[data-demo="loaded"]', root);
    var loads = 0;
    root.addEventListener('ds:change', function (event) {
      if (event.target === range) address.textContent = '?' + event.detail.query;
    });
    root.addEventListener('ds:refresh', function (event) {
      if (event.target !== range) return;
      loads += 1;
      var start = new Date(event.detail.start);
      var end = new Date(event.detail.end);
      loaded.textContent = 'CPU of LAPTOP-0042, load ' + loads + ' (' + event.detail.reason + '): ' +
        start.toLocaleTimeString() + ' to ' + end.toLocaleTimeString() + ', 42% on average.';
    });
  },
});
