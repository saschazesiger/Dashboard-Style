/*
 * The Composer demo: the full message field (attachments, commands,
 * mentions, the microphone slot, send and stop, a remembered draft), the
 * 2.x markup, and its states (busy, with files, blocked). Registered
 * through SG.demo() (styleguide/sg-core.js). Size, density, shape and touch
 * come from the options panel around it. The page-side part (what a send
 * does, the fake reply that makes it busy) is in wire.
 */
var COMMANDS = [
  ['sparkles', '/summarize', 'Sum up the ticket'],
  ['userPlus', '/assign', 'Give the ticket to someone'],
  ['tag', '/label', 'Add a label'],
  ['clock', '/remind', 'Remind me later'],
];

var PEOPLE = [
  ['u-1', 'Ada Lovelace', 'Support'],
  ['u-2', 'Charles Babbage', 'Hardware'],
  ['u-3', 'Grace Hopper', 'Compilers'],
  ['u-4', 'Alan Turing', 'Research'],
];

function sendButton(h) {
  return '<button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">' +
    '<span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">' + h.icon('send', 20) + '</span><span class="ds-icon-swap__b">' + h.icon('square', 20) + '</span></span></button>';
}

function palettes(h) {
  return '<div class="ds-composer__palette" role="listbox" aria-label="Commands" data-ds-composer-trigger="/" popover="manual" hidden>' +
    COMMANDS.map(function (row) {
      return '<div class="ds-composer__option" role="option" data-value="' + row[1] + '">' + h.icon(row[0], 20) +
        '<span class="ds-composer__option-label">' + row[1] + '</span><span class="ds-composer__option-hint">' + row[2] + '</span></div>';
    }).join('') + '</div>' +
    '<div class="ds-composer__palette" role="listbox" aria-label="People" data-ds-composer-trigger="@" popover="manual" hidden>' +
    PEOPLE.map(function (row) {
      return '<div class="ds-composer__option" role="option" data-value="@' + row[1] + '" data-id="' + row[0] + '">' + h.icon('user', 20) +
        '<span class="ds-composer__option-label">' + row[1] + '</span><span class="ds-composer__option-hint">' + row[2] + '</span></div>';
    }).join('') + '</div>';
}

function full(h, extra) {
  return '<form class="ds-composer" data-ds-composer ' + (extra || '') + '>' +
    '<ul class="ds-composer__attachments" aria-label="Attachments"></ul>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Attach files" data-tip="Attach files" data-ds-composer-attach>' + h.icon('paperclip', 20) + '</button>' +
    '<input class="ds-composer__picker" type="file" multiple hidden>' +
    '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Message, / or @"></textarea>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Dictate" aria-pressed="false" data-tip="Dictate" data-demo="mic">' + h.icon('mic', 20) + '</button>' +
    sendButton(h) + palettes(h) + '</form>';
}

SG.demo('composer', {
  title: 'Composer',
  group: 'forms',
  need: 'Write a message: a field that grows, attachments as chips, slash commands, mentions, send and stop, drafts',
  lead: 'The message field of a conversation. Type <kbd class="ds-kbd">/</kbd> at the start for a command or <kbd class="ds-kbd">@</kbd> to mention someone; drop or paste files to attach them. The draft stays when you leave the page.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Message field', full(h, 'data-ds-composer-draft="styleguide-demo" data-demo="main"') +
        '<p class="ds-muted" data-demo="log" aria-live="polite"></p>',
        'Enter sends, Shift+Enter breaks the line. A send turns the button into Stop while the reply runs.') +

      h.section('Simple', '<form class="ds-composer" data-ds-composer data-demo="simple">' +
        '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Note" placeholder="Write a note"></textarea>' +
        sendButton(h) + '</form>', 'The 2.x markup: a field and a send button.') +

      h.section('States', '<div class="ds-stack">' +
        '<form class="ds-composer" data-ds-composer data-ds-composer-busy data-demo="busy">' +
        '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message while a reply runs" placeholder="Message"></textarea>' + sendButton(h) + '</form>' +
        full(h, 'data-demo="files"').replace('placeholder="Message, / or @"', 'placeholder="Message"').replace('aria-label="Message"', 'aria-label="Message with files"') +
        '<form class="ds-composer" data-ds-composer data-demo="disabled">' +
        '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message (closed ticket)" placeholder="This ticket is closed" disabled></textarea>' +
        '<button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" disabled>' + h.icon('send', 20) + '</button></form>' +
        '</div>', 'Busy: Stop instead of Send. With files: chips above the text. Closed: the field is disabled.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd> sends, <kbd class="ds-kbd">Shift</kbd>+<kbd class="ds-kbd">Enter</kbd> breaks the line. In a palette <kbd class="ds-kbd">↓</kbd> and <kbd class="ds-kbd">↑</kbd> move, <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Tab</kbd> inserts, <kbd class="ds-kbd">Esc</kbd> closes it; the focus stays in the field. <kbd class="ds-kbd">Tab</kbd> reaches the attachments\' remove buttons.</p>');
  },

  wire: function (root, h) {
    var main = h.$('[data-demo="main"]', root);
    var log = h.$('[data-demo="log"]', root);
    var timer = 0;
    if (main) {
      var composer = DS.core.get(main, 'composer') || DS.composer.create(main);
      main.addEventListener('ds:send', function (event) {
        var detail = event.detail;
        var files = detail.attachments.length ? ' with ' + detail.attachments.length + ' file' + (detail.attachments.length === 1 ? '' : 's') : '';
        log.textContent = 'Sent' + files + (detail.command ? ', command ' + detail.command : '') + (detail.mentions.length ? ', mentioning ' + detail.mentions.map(function (m) { return m.value; }).join(', ') : '') + '.';
        composer.set({ busy: true });
        timer = setTimeout(function () { composer.set({ busy: false }); }, h.slow(2400));
      });
      main.addEventListener('ds:stop', function () {
        clearTimeout(timer);
        composer.set({ busy: false });
        log.textContent = 'Stopped.';
      });
    }
    var mic = h.$('[data-demo="mic"]', root);
    if (mic) {
      mic.addEventListener('click', function () {
        var on = mic.getAttribute('aria-pressed') !== 'true';
        mic.setAttribute('aria-pressed', String(on));
        if (!on && main) {
          var c = DS.core.get(main, 'composer');
          if (c) c.set({ text: (c.get().text ? c.get().text + ' ' : '') + 'Please check the laptop in room 4.' });
        }
      });
    }
    var withFiles = h.$('[data-demo="files"]', root);
    if (withFiles && typeof File === 'function') {
      var filesComposer = DS.core.get(withFiles, 'composer') || DS.composer.create(withFiles);
      filesComposer.add([
        new File(['a'.repeat(48200)], 'battery-report.pdf', { type: 'application/pdf' }),
        new File(['b'.repeat(1520000)], 'screen-photo.jpg', { type: 'image/jpeg' }),
      ]);
    }
    return function () { clearTimeout(timer); };
  },
});
