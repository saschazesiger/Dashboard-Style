/*
 * The Diff view demo: the change of a ticket in a few files (an edit with
 * word marks and a fold, a rename, a new binary, a deleted file), the
 * unified, split and auto views, wrapping, the lines between hunks loaded
 * by the page, and the states with nothing to show. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape and touch come
 * from the options panel around it.
 */
var DIFF_SYNC = [
  'diff --git a/src/devices/sync.js b/src/devices/sync.js',
  'index 83db48f..bf269f4 100644',
  '--- a/src/devices/sync.js',
  '+++ b/src/devices/sync.js',
  '@@ -1,24 +1,26 @@ import { fetch } from \'../net.js\';',
  ' import { fetch } from \'../net.js\';',
  ' import { log } from \'../log.js\';',
  ' ',
  '-const RETRIES = 2;',
  '-const TIMEOUT = 5000;',
  '+const RETRIES = 3;',
  '+const TIMEOUT = 8000;',
  '+const BACKOFF = 500;',
  ' ',
  ' /**',
  '  * Sync one device with the server: its settings, its firmware',
  '  * version and the last time it was seen. A device that does not',
  '  * answer is tried again, a little later each time.',
  '  */',
  ' export async function sync(device) {',
  '   const started = Date.now();',
  '   let attempt = 0;',
  '   let last = null;',
  '   while (attempt < RETRIES) {',
  '     attempt += 1;',
  '     try {',
  '-      return await fetch(device.url, { timeout: TIMEOUT });',
  '+      return await fetch(device.url, { timeout: TIMEOUT, attempt });',
  '     } catch (error) {',
  '       last = error;',
  '-      log.warn(`Device ${device.id} did not answer`);',
  '+      log.warn(`Device ${device.id} did not answer (attempt ${attempt})`);',
  '+      await wait(BACKOFF * attempt);',
  '     }',
  '   }',
  '@@ -40,7 +42,6 @@ export function summary(devices) {',
  '   const online = devices.filter((device) => device.online);',
  '   return {',
  '     total: devices.length,',
  '-    // Offline devices are counted twice here.',
  '     online: online.length,',
  '     offline: devices.length - online.length,',
  '   };',
].join('\n');

var DIFF_MORE = [
  'diff --git a/config/sync.yml b/config/devices.yml',
  'similarity index 82%',
  'rename from config/sync.yml',
  'rename to config/devices.yml',
  'index 1c2d3e4..5f6a7b8 100644',
  '--- a/config/sync.yml',
  '+++ b/config/devices.yml',
  '@@ -1,4 +1,4 @@',
  ' devices:',
  '-  interval: 15m',
  '+  interval: 10m',
  '   region: north',
  '   owner: Ada Lovelace',
  'diff --git a/assets/product.png b/assets/product.png',
  'new file mode 100644',
  'index 0000000..e69de29',
  'Binary files /dev/null and b/assets/product.png differ',
  'diff --git a/src/devices/legacy.js b/src/devices/legacy.js',
  'deleted file mode 100644',
  'index 7a8b9c0..0000000',
  '--- a/src/devices/legacy.js',
  '+++ /dev/null',
  '@@ -1,3 +0,0 @@',
  '-export function legacySync() {',
  '-  return null;',
  '-}',
  '\\ No newline at end of file',
].join('\n');

var DIFF_GAP = [
  'diff --git a/docs/tickets.md b/docs/tickets.md',
  '--- a/docs/tickets.md',
  '+++ b/docs/tickets.md',
  '@@ -18,3 +18,3 @@ ## Priorities',
  ' A ticket has one priority.',
  '-Urgent tickets page the person on call.',
  '+Urgent tickets page the person on call within five minutes.',
  ' Low tickets wait for the weekly review.',
].join('\n');

function diffSource(text) {
  return '<pre class="ds-diff__source">' + text.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</pre>';
}

function diffViewSwitch(label) {
  var radio = function (value, text, on) {
    return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + on + '"' + (on ? '' : ' tabindex="-1"') + ' data-mode="' + value + '" data-label="' + text + '">' + text + '</button>';
  };
  return '<div class="ds-segmented" role="radiogroup" aria-label="' + label + '" data-demo="views">' +
    radio('unified', 'Unified', true) + radio('split', 'Split', false) + radio('auto', 'Auto', false) + '</div>';
}

SG.demo('diff', {
  title: 'Diff view',
  group: 'content',
  need: 'Show what changed in files: unified or side by side, with word marks and folded context',
  lead: 'Unified diff text, rendered: file headers with their counts, hunk headers, two gutters, the changed words marked, and long runs of unchanged lines folded behind a button. The sign and a hidden word say what changed, never the colour alone.',
  options: { sizes: true, density: true, tones: false, shape: true },

  render: function (h) {
    return h.section('A ticket\'s change', '<div class="sg-row" style="justify-content: space-between">' + diffViewSwitch('View') +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet ds-sm" type="button" aria-pressed="false" data-demo="wrap">' + h.icon('wrapText', 16) + 'Wrap lines</button>' +
        '<button class="ds-btn ds-btn--quiet ds-sm" type="button" data-demo="expand">' + h.icon('expandAll', 16) + 'Show all lines</button></div></div>' +
        '<div class="ds-diff" data-ds-diff data-demo="main" aria-label="Changes in ticket 4127">' + diffSource(DIFF_SYNC + '\n' + DIFF_MORE) + '</div>',
      'Unified by default; Split puts old and new side by side, Auto picks by the width. The second hunk of sync.js folds the long comment and loop.') +

      h.section('Lines between hunks', '<div class="ds-diff" data-demo="gap" aria-label="Changes in docs/tickets.md">' + diffSource(DIFF_GAP) + '</div>',
        'With a load callback the page fetches the lines the diff leaves out: the button in the hunk header shows them, and the focus moves to the first.') +

      h.section('Nothing to show', '<div class="ds-diff" data-ds-diff aria-label="An empty change">' + diffSource('') + '</div>',
        'Empty text says so. A binary file and a pure rename get a line of text instead of a table (above).') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each file\'s toggle, then its lines as a region that scrolls sideways with the arrow keys, then the fold buttons. A fold moves the focus to the first line it opened.</p>');
  },

  wire: function (root, h) {
    var main = h.$('[data-demo="main"]', root);
    // DS.init() reaches markup added after it within a microtask: ask for the controller when it is needed.
    var view = function () { return main && DS.core.get(main, 'diff'); };
    var handles = [];
    var views = h.$('[data-demo="views"]', root);
    if (views && main) {
      handles.push(DS.indicator.create(views, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' }));
      handles.push(DS.dom.roving(views, { items: '.ds-segmented__option' }));
      views.addEventListener('click', function (event) {
        var option = event.target.closest('.ds-segmented__option');
        if (!option) return;
        h.$$('.ds-segmented__option', views).forEach(function (item) { item.setAttribute('aria-checked', String(item === option)); });
        view().set({ view: option.getAttribute('data-mode') });
      });
    }
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button || !view()) return;
      if (button.getAttribute('data-demo') === 'wrap') {
        var on = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(on));
        main.classList.toggle('ds-diff--wrap', on);
      }
      if (button.getAttribute('data-demo') === 'expand') view().expand();
    });

    // The lines a diff leaves out, as a page's backend would answer.
    var gap = h.$('[data-demo="gap"]', root);
    if (gap) {
      handles.push(DS.diff.create(gap, {
        load: function (request) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              var lines = [];
              for (var line = request.from; line <= request.to; line += 1) lines.push(line === 1 ? '# Tickets' : line === 3 ? '## Priorities' : 'Line ' + line + ' of the ticket guide.');
              resolve(lines);
            }, h.slow(400));
          });
        },
      }));
    }
    return function () { handles.forEach(function (handle) { handle.destroy(); }); };
  },
});
