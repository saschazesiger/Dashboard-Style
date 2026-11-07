/*
 * The Log viewer demo: a device's live log (levels, a stack trace, a stream
 * that can be started and paused, 100,000 lines on demand), a finished
 * build with ANSI colours that wraps and has no timestamps, and the empty
 * state. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel around it.
 */
var LOG_START = Date.UTC(2026, 10, 4, 9, 0, 1, 120);

/** A stamp `ms` after the start, as a device writes it. */
function logStamp(ms) {
  return new Date(LOG_START + ms).toISOString();
}

var LOG_EVENTS = [
  ['INFO ', 'Device 42 started (firmware 3.2.1)'],
  ['DEBUG', 'Loaded settings: interval=10m region=north owner="Ada Lovelace"'],
  ['INFO ', 'Connected to the server in 214 ms'],
  ['WARN ', 'Battery at 15%: syncing less often'],
  ['INFO ', 'Synced 12 settings, 3 tickets'],
  ['DEBUG', 'Next sync in 600 s'],
  ['ERROR', 'Sync failed: timeout after 8000 ms'],
  ['', '    at sync (src/devices/sync.js:31)'],
  ['', '    at run (src/devices/queue.js:88)'],
  ['INFO ', 'Retrying (attempt 2 of 3)'],
  ['INFO ', 'Synced 12 settings, 0 tickets'],
  ['TRACE', 'Heartbeat ok'],
  ['WARN ', 'Clock drift of 2.4 s corrected'],
  ['FATAL', 'Storage full: cannot write the ticket queue'],
  ['INFO ', 'Storage cleaned: 1.2 GB free'],
];

function logLines(count, offset) {
  var lines = [];
  for (var i = 0; i < count; i += 1) {
    var event = LOG_EVENTS[(i + (offset || 0)) % LOG_EVENTS.length];
    lines.push(event[0] ? logStamp((i + (offset || 0)) * 1370) + ' ' + event[0] + ' ' + event[1] : event[1]);
  }
  return lines;
}

var ESC = String.fromCharCode(27);
var LOG_BUILD = [
  ESC + '[1m> product@2.4.0 build' + ESC + '[0m',
  ESC + '[2m> node scripts/build.mjs' + ESC + '[0m',
  '',
  ESC + '[36mi' + ESC + '[39m Building 214 modules for the device console …',
  ESC + '[32m✓ Compiled ' + ESC + '[1msrc/devices' + ESC + '[22m' + ESC + '[39m in 1.42 s',
  ESC + '[32m✓ Compiled ' + ESC + '[1msrc/tickets' + ESC + '[22m' + ESC + '[39m in 0.88 s',
  ESC + '[33mwarning:' + ESC + '[39m ' + ESC + '[33msrc/tickets/list.js' + ESC + '[39m: the import of "./legacy.js" is unused; it adds 14 kB to the bundle that every page of the console loads, so remove it or load it later',
  ESC + '[31merror:' + ESC + '[39m src/devices/sync.js:31: ' + ESC + '[4mRETRIES' + ESC + '[24m is read before it is defined',
  ESC + '[90m    29 │ export async function sync(device) {' + ESC + '[39m',
  ESC + '[90m    30 │   let attempt = 0;' + ESC + '[39m',
  ESC + '[31m  > 31 │   while (attempt < RETRIES) {' + ESC + '[39m',
  ESC + '[35mhint:' + ESC + '[39m move the constant above the function, or import it from ' + ESC + '[34msrc/devices/config.js' + ESC + '[39m',
  '',
  ESC + '[41m' + ESC + '[97m FAIL ' + ESC + '[0m 1 error, 1 warning in 2.31 s',
].join('\n');

SG.demo('logview', {
  title: 'Log viewer',
  group: 'content',
  need: 'Read a long or live log: levels, colours, filter, search, follow the end, copy lines',
  lead: 'Only the lines near the viewport are in the page, so a hundred thousand lines scroll as lightly as a hundred. Levels show an icon and a word, ANSI colours take the theme\'s roles, and the reader filters, searches, wraps, copies lines and follows the end.',
  options: { sizes: true, density: true, tones: false, shape: true },

  render: function (h) {
    return h.section('A device\'s live log',
      '<div class="sg-row">' +
        '<button class="ds-btn ds-btn--tonal ds-sm" type="button" aria-pressed="false" data-demo="stream">' + h.icon('play', 16) + '<span>Stream new lines</span></button>' +
        '<button class="ds-btn ds-btn--quiet ds-sm" type="button" data-demo="many">' + h.icon('plus', 16) + 'Add 100,000 lines</button>' +
      '</div>' +
      '<div class="ds-logview" data-ds-logview data-demo="live" data-ds-logview-limit="250000" aria-label="Log of device 42"><pre class="ds-logview__source">' + h.esc(logLines(45).join('\n')) + '</pre></div>',
      'Follows the end while lines arrive: scroll up and the Latest pill brings you back. Select lines with a click, Shift+click or the keyboard, and copy them.') +

      h.section('A finished build',
        '<div class="ds-logview" data-demo="build" data-ds-logview-follow="off" data-ds-logview-wrap data-ds-logview-time="off" aria-label="Build output" style="--ds-logview-height: 22rem"></div>',
        'ANSI colours mapped to theme roles, long lines wrapped, no timestamps, nothing to follow.') +

      h.section('Nothing yet',
        '<div class="ds-logview" data-ds-logview data-ds-logview-tools="off" aria-label="Log of device 7" style="--ds-logview-height: 10rem"><pre class="ds-logview__source"></pre></div>',
        'An empty log says so; without the bar it is only the lines.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the search, its buttons, the level chips, the tools and then the lines as one stop. ' +
        'In the lines: <kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> <kbd class="ds-kbd">Home</kbd> <kbd class="ds-kbd">End</kbd> move, <kbd class="ds-kbd">Space</kbd> selects, ' +
        '<kbd class="ds-kbd">Shift</kbd>+<kbd class="ds-kbd">↓</kbd> extends, <kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">A</kbd> selects all, <kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">C</kbd> copies, ' +
        '<kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">F</kbd> searches. In the search: <kbd class="ds-kbd">Enter</kbd> next, <kbd class="ds-kbd">Shift</kbd>+<kbd class="ds-kbd">Enter</kbd> previous.</p>');
  },

  wire: function (root, h) {
    var live = h.$('[data-demo="live"]', root);
    var log = function () { return live && DS.core.get(live, 'logview'); };
    var handles = [];
    var timer = 0;
    var next = 45;
    var stream = h.$('[data-demo="stream"]', root);
    var stop = function () {
      clearInterval(timer);
      timer = 0;
      if (stream) {
        stream.setAttribute('aria-pressed', 'false');
        stream.querySelector('span').textContent = 'Stream new lines';
      }
    };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button || !log()) return;
      if (button.getAttribute('data-demo') === 'stream') {
        if (timer) {
          stop();
          return;
        }
        button.setAttribute('aria-pressed', 'true');
        button.querySelector('span').textContent = 'Pause the stream';
        timer = setInterval(function () {
          log().append(logLines(3, next));
          next += 3;
        }, h.slow(400));
      }
      if (button.getAttribute('data-demo') === 'many') {
        log().append(logLines(100000, next));
        next += 100000;
        h.toast('100,000 lines added', 'info');
      }
    });

    var build = h.$('[data-demo="build"]', root);
    if (build) handles.push(DS.logview.create(build, { lines: LOG_BUILD }));
    return function () {
      stop();
      handles.forEach(function (handle) { handle.destroy(); });
    };
  },
});
