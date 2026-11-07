/*
 * The Terminal frame demo: a shell on a device (a tiny stand-in for the
 * emulator a page brings: an input line that echoes, a history and a
 * handful of commands) wired to the frame's key bar, the connection states
 * with their actions, and plain output in the theme's ANSI colours in a
 * frame that fills its box. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it.
 */
var TERM_HOST = 'ada@device-42';

var TERM_COMMANDS = {
  help: [['Commands: ', null], ['status', 'cyan'], [', ', null], ['uptime', 'cyan'], [', ', null], ['ls', 'cyan'], [', ', null], ['tickets', 'cyan'], [', ', null], ['clear', 'cyan'], [', ', null], ['exit', 'cyan']],
  status: [['● ', 'green'], ['sync      ', null], ['active', 'green'], [' (last run 2 min ago)\n', 'dim'], ['● ', 'yellow'], ['battery   ', null], ['15%', 'yellow'], [' (syncing less often)\n', 'dim'], ['● ', 'red'], ['storage   ', null], ['full', 'red'], [' (1.2 GB of 1.2 GB)', 'dim']],
  uptime: [[' 09:41:07 up 12 days,  3:02,  1 user,  load average: 0.08, 0.12, 0.10', null]],
  ls: [['config/  ', 'blue'], ['logs/  ', 'blue'], ['tickets/  ', 'blue'], ['firmware.bin  ', null], ['sync.sh', 'green']],
  tickets: [['#1042 ', 'bold'], ['open    ', 'yellow'], ['Sensor reads 0 after restart\n', null], ['#1043 ', 'bold'], ['closed  ', 'green'], ['Firmware 3.2.1 rollout\n', null], ['#1044 ', 'bold'], ['open    ', 'yellow'], ['Product label misprinted', null]],
};

var TERM_ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

/** What the bytes of a key look like, for the readout: ESC [ 1 ; 5 A, ^C. */
function termBytes(data) {
  return Array.from(data).map(function (char) {
    var code = char.charCodeAt(0);
    if (code === 27) return 'ESC';
    if (code === 9) return 'TAB';
    if (code === 127) return 'DEL';
    if (code < 32) return '^' + String.fromCharCode(code + 64);
    return char;
  }).join(' ');
}

SG.demo('terminal', {
  title: 'Terminal frame',
  group: 'content',
  need: 'Frame a terminal emulator: title, connection status, actions, and the keys a phone keyboard lacks',
  lead: 'The chrome around the terminal emulator a page brings (xterm.js or its own): the title, the connection status and the page\'s actions, the screen, and on phones a bar with the keys their keyboard lacks. The frame sends the bytes of each key and gives the emulator the theme\'s colours.',
  options: { sizes: true, density: true, tones: false, shape: true },

  render: function (h) {
    var head = function (title, actions) {
      return '<div class="ds-terminal__head"><span class="ds-terminal__title">' + h.esc(title) + '</span>' +
        '<span class="ds-terminal__actions">' + (actions || '') + '</span></div>';
    };
    var action = function (glyph, label, name) {
      return '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="' + label + '" data-demo="' + name + '">' + h.icon(glyph, 18) + '</button>';
    };
    var colours = TERM_ANSI.map(function (name) { return '<span data-fg="' + name + '">' + name + '</span>'; }).join(' ');

    return h.section('A shell on a device',
      '<div class="ds-terminal" data-ds-terminal data-ds-terminal-status="connected" data-ds-terminal-bar="always" data-demo="shell" aria-label="Shell on device 42">' +
        head(TERM_HOST + ': ~', action('refresh', 'Reconnect', 'reconnect') + action('trash', 'Clear the screen', 'clear')) +
        '<div class="ds-terminal__screen"><pre data-demo="out"><span data-fg="cyan">Device 42</span> · firmware 3.2.1 · last login 09:38 by Ada Lovelace\n</pre></div>' +
      '</div>' +
      '<p class="ds-muted">Last bytes sent: <code data-demo="bytes">(none yet)</code></p>',
      'The key bar shows on phones by default (<code>data-ds-terminal-bar="auto"</code>); here it always does. Tap Ctrl, then type <kbd class="ds-kbd">c</kbd>: the frame sends <code>^C</code>. The arrows walk the history, Tab completes, Esc clears the line.') +

      h.section('Connection states',
        '<div class="sg-row" style="align-items: stretch">' +
          '<div class="ds-terminal" data-ds-terminal data-ds-terminal-status="connecting" data-ds-terminal-bar="off" aria-label="Shell on device 7" style="flex: 1 1 18rem; --ds-terminal-height: 7rem">' +
            head('ada@device-7: ~') + '<div class="ds-terminal__screen"><pre><span data-sgr="dim">Opening a session on device 7 …</span></pre></div></div>' +
          '<div class="ds-terminal" data-ds-terminal data-ds-terminal-status="disconnected" data-ds-terminal-bar="off" data-demo="dropped" aria-label="Shell on device 9" style="flex: 1 1 18rem; --ds-terminal-height: 7rem">' +
            head('ada@device-9: ~', '<button class="ds-btn ds-btn--tonal ds-sm" type="button" data-demo="retry">' + h.icon('refresh', 16) + 'Reconnect</button>') +
            '<div class="ds-terminal__screen"><pre>$ tail -f logs/sync.log\n<span data-fg="red">Connection closed by the device.</span></pre></div></div>' +
        '</div>',
        'The status is a chip with an icon and a word, never the colour alone, and it is announced when it changes.') +

      h.section('Plain output that fills its box',
        '<div style="block-size: 15rem"><div class="ds-terminal ds-terminal--fill" data-ds-terminal data-ds-terminal-bar="off" data-demo="plain" aria-label="Build output">' +
          head('Build of Product 2.4.0') +
          '<div class="ds-terminal__screen"><pre>' +
            '$ npm run build\n<span data-sgr="dim">&gt; node scripts/build.mjs</span>\n' +
            '<span data-fg="green">✓</span> Compiled <span data-sgr="bold">src/devices</span> in 1.42 s\n' +
            '<span data-fg="yellow">warning:</span> src/tickets/list.js: an unused import\n' +
            '<span data-fg="red">error:</span> src/devices/sync.js:31: RETRIES is read before it is defined\n' +
            'ANSI colours: ' + colours + '\n' +
            '<span data-demo="theme" data-sgr="dim"></span>' +
          '</pre></div></div></div>',
        'Without an emulator (a replay, a read-only session) the page writes a <code>&lt;pre&gt;</code> with <code>data-fg</code> spans. <code>DS.terminal.theme(el)</code> gives an emulator the same colours.');
  },

  wire: function (root, h) {
    var shell = h.$('[data-demo="shell"]', root);
    var outEl = h.$('[data-demo="out"]', root);
    var bytes = h.$('[data-demo="bytes"]', root);
    var timers = [];
    var history = [];
    var place = 0;
    var input = null;

    var frame = function (el) { return el && DS.core.get(el, 'terminal'); };
    var later = function (fn, ms) { timers.push(setTimeout(fn, h.slow(ms))); };

    /* A tiny stand-in for an emulator: output spans, a prompt and one input line. */
    var write = function (parts) {
      parts.forEach(function (part) {
        var span = document.createElement('span');
        span.textContent = part[0];
        if (part[1] === 'bold' || part[1] === 'dim') span.setAttribute('data-sgr', part[1]);
        else if (part[1]) span.setAttribute('data-fg', part[1]);
        outEl.insertBefore(span, input ? input.parentNode : null);
      });
    };
    var prompt = function () {
      var line = document.createElement('span');
      line.style.cssText = 'display: flex; white-space: pre';
      var user = document.createElement('span');
      user.setAttribute('data-fg', 'green');
      user.setAttribute('data-sgr', 'bold');
      user.textContent = TERM_HOST;
      var path = document.createElement('span');
      path.setAttribute('data-fg', 'blue');
      path.textContent = '~';
      input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('aria-label', 'Command');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
      input.style.cssText = 'all: unset; flex: 1 1 auto; min-inline-size: 0';
      line.append(user, ':', path, '$ ', input);
      outEl.append(line);
      return line;
    };
    var newLine = function (keep) {
      var line = input.parentNode;
      var typed = document.createTextNode(input.value + (keep || '') + '\n');
      line.replaceChild(typed, input);
      input = null;
      prompt();
    };
    var focus = function () { if (input) input.focus({ preventScroll: true }); };
    var scroll = function () { outEl.scrollTop = outEl.scrollHeight; };

    if (outEl) {
      prompt();
      input.placeholder = 'type help';

      var run = function (command) {
        var name = command.trim();
        newLine();
        if (name) {
          history.push(name);
          place = history.length;
        }
        if (name === 'clear') {
          Array.from(outEl.childNodes).forEach(function (node) { if (node !== input.parentNode) node.remove(); });
        } else if (name === 'exit') {
          write([['logout\n', null]]);
          frame(shell).set({ status: 'disconnected' });
        } else if (TERM_COMMANDS[name]) {
          write(TERM_COMMANDS[name].concat([['\n', null]]));
        } else if (name) {
          write([[name.split(' ')[0] + ': command not found\n', 'red']]);
        }
        focus();
        scroll();
      };

      outEl.addEventListener('keydown', function (event) {
        if (event.target !== input) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          run(input.value);
        }
      });
      outEl.addEventListener('click', function () { if (!getSelection().toString()) focus(); });

      /* What the page does with the frame's keys: here, edit the input line. */
      shell.addEventListener('ds:key', function (event) {
        var detail = event.detail;
        bytes.textContent = termBytes(detail.data) + '  (' + (detail.ctrl ? 'Ctrl+' : '') + (detail.alt ? 'Alt+' : '') + detail.key + ')';
        if (!input) return;
        var at = input.selectionStart || 0;
        if (detail.data === '\u0003') {
          newLine('^C');
        } else if (detail.data === '\u0004') {
          run('exit');
        } else if (detail.data === '\u000c') {
          run('clear');
        } else if (detail.key === 'esc') {
          input.value = '';
        } else if (detail.key === 'tab') {
          var match = Object.keys(TERM_COMMANDS).concat(['clear', 'exit']).filter(function (name) { return input.value && name.indexOf(input.value) === 0; });
          if (match.length === 1) input.value = match[0] + ' ';
        } else if (detail.key === 'up' || detail.key === 'down') {
          place = Math.max(0, Math.min(history.length, place + (detail.key === 'up' ? -1 : 1)));
          input.value = history[place] || '';
        } else if (detail.key === 'left' || detail.key === 'right') {
          var to = Math.max(0, Math.min(input.value.length, at + (detail.key === 'left' ? -1 : 1)));
          input.setSelectionRange(to, to);
        } else if (!detail.ctrl && !detail.alt && detail.data.length === 1) {
          input.setRangeText(detail.data, at, input.selectionEnd || at, 'end');
        }
        if (document.activeElement && shell.contains(document.activeElement) && !document.activeElement.closest('.ds-terminal__keys')) focus();
        scroll();
      });
    }

    /* The page's actions: reconnect goes through connecting; the dropped session comes back. */
    var reconnect = function (el, then) {
      frame(el).set({ status: 'connecting' });
      later(function () {
        frame(el).set({ status: 'connected' });
        if (then) then();
      }, 1200);
    };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-demo]');
      if (!button) return;
      var name = button.getAttribute('data-demo');
      if (name === 'reconnect' && shell) reconnect(shell, function () { write([['Session restored.\n', 'green']]); scroll(); });
      if (name === 'clear' && input) {
        Array.from(outEl.childNodes).forEach(function (node) { if (node !== input.parentNode) node.remove(); });
        focus();
      }
      if (name === 'retry') {
        var dropped = h.$('[data-demo="dropped"]', root);
        reconnect(dropped, function () { h.toast('Device 9 connected again', 'success'); });
      }
    });

    /* The theme's colours, as an emulator would get them. */
    var plain = h.$('[data-demo="plain"]', root);
    var themeLine = h.$('[data-demo="theme"]', root);
    if (plain && themeLine) {
      var colours = DS.terminal.theme(plain);
      themeLine.textContent = 'DS.terminal.theme(): background ' + colours.background + ', red ' + colours.red;
    }

    return function () {
      timers.forEach(clearTimeout);
    };
  },
});
