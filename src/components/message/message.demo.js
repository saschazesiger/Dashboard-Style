/*
 * The Message demo: the four roles, a reply that streams in (the page-side
 * part, the fake reply, is in wire), the stopped and failed states and the
 * footer actions. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it;
 * the role is the variant.
 */
var REPLY = 'The battery report of laptop 4 shows 812 charge cycles and 61% of its design capacity. ' +
  'It loses about 4% an hour while the lid is closed, which points to a sleep setting rather than the battery.';

function iconButton(h, action, label, glyph, swap) {
  var face = swap
    ? '<span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">' + h.icon(glyph, 18) + '</span><span class="ds-icon-swap__b">' + h.icon(swap, 18) + '</span></span>'
    : h.icon(glyph, 18);
  return '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="' + label + '" data-tip="' + label + '" data-ds-message-action="' + action + '">' + face + '</button>';
}

function thumbs(h) {
  return '<div class="ds-feedback" role="group" aria-label="Rate this answer" data-ds-feedback>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="false" aria-label="Helpful" data-tip="Helpful" data-ds-feedback-value="up">' + h.icon('thumbUp', 18, 'ds-icon--fillable') + '</button>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="false" aria-label="Not helpful" data-tip="Not helpful" data-ds-feedback-value="down">' + h.icon('thumbDown', 18, 'ds-icon--fillable') + '</button></div>';
}

function footer(h, parts) {
  return '<footer class="ds-message__footer" role="group" aria-label="Message actions">' + parts + '</footer>';
}

function assistant(h, opts) {
  var id = h.uid('author');
  return '<article class="ds-message ds-message--assistant" data-ds-message="' + (opts.state || '') + '" aria-labelledby="' + id + '"' + (opts.attrs || '') + '>' +
    '<div class="ds-message__avatar" aria-hidden="true">' + h.icon('bot', 20) + '</div>' +
    '<div class="ds-message__main">' +
    '<header class="ds-message__head"><span class="ds-message__author" id="' + id + '">Assistant</span><time class="ds-message__time" datetime="2026-11-04T09:41:00Z">09:41</time></header>' +
    '<div class="ds-message__content ds-prose ds-prose--compact">' + opts.body + '</div>' +
    footer(h, iconButton(h, 'copy', 'Copy', 'copy', 'check') + iconButton(h, 'retry', 'Retry', 'refresh') + (opts.thumbs === false ? '' : thumbs(h))) +
    '</div></article>';
}

function user(h, text) {
  var id = h.uid('author');
  return '<article class="ds-message ds-message--user" data-ds-message aria-labelledby="' + id + '">' +
    '<div class="ds-message__main">' +
    '<header class="ds-message__head"><span class="ds-message__author" id="' + id + '">Ada Lovelace</span><time class="ds-message__time" datetime="2026-11-04T09:40:00Z">09:40</time></header>' +
    '<div class="ds-message__content">' + h.esc(text) + '</div>' +
    footer(h, iconButton(h, 'copy', 'Copy', 'copy', 'check') + iconButton(h, 'edit', 'Edit', 'pencil')) +
    '</div></article>';
}

SG.demo('message', {
  title: 'Message',
  group: 'content',
  need: 'Show one turn of a conversation: user, assistant, system or tool, streaming, stopped or failed, with copy, retry, edit and feedback',
  lead: 'One turn of a conversation. The role is the variant; the state comes from <code>data-ds-message</code> or <code>DS.message</code>, and a reply is announced once it is complete, never word by word.',
  options: { variants: ['assistant', 'user', 'system', 'tool'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var show = function (name) { return !h.variant || h.variant === name; };
    var out = '';
    if (show('user') || show('assistant')) {
      out += h.section('Conversation', '<div class="ds-stack">' +
        (show('user') ? user(h, 'Why does laptop 4 lose its charge overnight?\nIt was full at 18:00.') : '') +
        (show('assistant') ? assistant(h, { body: '<p>' + h.esc(REPLY) + '</p><ul><li>Turn off <strong>wake for network access</strong>.</li><li>Check again tomorrow morning.</li></ul>' }) : '') +
        '</div>', 'The user\'s message sits in a bubble at the end; the reply runs the full width under its avatar. Copy shows a check for a moment.');
    }
    if (show('assistant')) {
      out += h.section('Streaming', '<div class="ds-stack">' +
        assistant(h, { state: 'streaming', body: '<p></p>', attrs: ' data-demo="stream"' }) +
        '<div class="sg-row"><button class="ds-btn ds-btn--tonal" type="button" data-demo="restart">Stream again</button>' +
        '<button class="ds-btn ds-btn--outlined" type="button" data-demo="stop">Stop</button>' +
        '<button class="ds-btn ds-btn--outlined" type="button" data-demo="fail">Fail</button></div></div>',
        'The cursor follows the text; the footer keeps its room and shows once the reply is complete.') +
        h.section('Stopped and failed', '<div class="ds-stack">' +
        assistant(h, { state: 'partial', body: '<p>The battery report of laptop 4 shows 812 charge cycles and</p>', thumbs: false }) +
        assistant(h, { state: 'error', body: '<p>Checking the battery report</p>', thumbs: false }) +
        '</div>', 'A note with an icon and a word says why the reply ended; Retry asks again.');
    }
    if (show('system')) {
      out += h.section('System line', '<div class="ds-message ds-message--system"><div class="ds-message__main">' +
        '<p class="ds-message__content">' + h.icon('userPlus', 16) + 'Grace Hopper joined the ticket</p></div></div>');
    }
    if (show('tool')) {
      out += h.section('Tool result', '<article class="ds-message ds-message--tool" aria-label="Tool result: battery_report">' +
        '<div class="ds-message__avatar" aria-hidden="true">' + h.icon('wrench', 20) + '</div>' +
        '<div class="ds-message__main"><header class="ds-message__head"><span class="ds-message__author">battery_report</span><span>laptop-4</span></header>' +
        '<pre class="ds-message__content">cycles:    812\ncapacity:  61%\ndrain:     4.1% / h (lid closed)</pre></div></article>');
    }
    return out + h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the footer\'s buttons; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses them. A screen reader moves between messages as articles.</p>');
  },

  wire: function (root, h) {
    var timers = [];
    var stream = h.$('[data-demo="stream"]', root);
    var log = function (text) { h.toast(text, 'info'); };
    root.addEventListener('ds:retry', function () { log('Retry: the page asks again.'); });
    root.addEventListener('ds:edit', function (event) { log('Edit: "' + event.detail.text.split('\n')[0] + '"'); });
    if (!stream) return function () {};
    var message = DS.message.create(stream);
    var words = REPLY.split(' ');
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function play() {
      clear();
      message.set({ state: 'streaming', text: '' });
      var content = h.$('.ds-message__content', stream);
      content.replaceChildren(document.createElement('p'));
      words.forEach(function (word, i) {
        timers.push(setTimeout(function () {
          message.append((i ? ' ' : '') + word);
          if (i === words.length - 1) message.set('done');
        }, h.slow(120 * (i + 1))));
      });
    }
    var restart = h.$('[data-demo="restart"]', root);
    var stop = h.$('[data-demo="stop"]', root);
    var fail = h.$('[data-demo="fail"]', root);
    restart.addEventListener('click', play);
    stop.addEventListener('click', function () { clear(); if (message.get().state === 'streaming') message.set('partial'); });
    fail.addEventListener('click', function () { clear(); message.set({ state: 'error', error: 'The connection was lost. Try again.' }); });
    stream.addEventListener('ds:retry', play);
    play();
    return clear;
  },
});
