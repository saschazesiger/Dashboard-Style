/*
 * The Transcript demo: a whole conversation as a project wires it, a
 * transcript over a composer. Days, earlier messages that load in place,
 * replies that stream in (stick to the end, or the "Latest" pill with its
 * count while scrolled up). Registered through SG.demo()
 * (styleguide/sg-core.js). The fake backend and the rendering of messages
 * are the page-side part, in wire.
 */
var TX_REPLIES = [
  'Laptop 4 lost 4% an hour last night with its lid closed. That points to a sleep setting: wake for network access is on.',
  'Ticket 1042 is assigned to Grace Hopper. She expects the replacement fan on Thursday.',
  'The monitor in room 2 reports no signal on its second input. Try the other cable first.',
];

var TX_EARLIER = [
  ['user', 'Can you check the printer on the second floor?'],
  ['assistant', 'The printer reports a paper jam in tray 2. Ticket 1038 is open for it.'],
  ['user', 'Thanks. Any other devices with errors?'],
  ['assistant', 'Only the router in the hallway restarted twice overnight; it is fine now.'],
];

function txEsc(text) {
  return String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function txMessage(h, role, text, state) {
  var id = h.uid('author');
  var mine = role === 'user';
  var actions = mine
    ? ''
    : '<footer class="ds-message__footer" role="group" aria-label="Message actions">' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy" data-tip="Copy" data-ds-message-action="copy">' +
      '<span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">' + h.icon('copy', 18) + '</span><span class="ds-icon-swap__b">' + h.icon('check', 18) + '</span></span></button>' +
      '<div class="ds-feedback" role="group" aria-label="Rate this answer" data-ds-feedback>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="false" aria-label="Helpful" data-tip="Helpful" data-ds-feedback-value="up">' + h.icon('thumbUp', 18, 'ds-icon--fillable') + '</button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="false" aria-label="Not helpful" data-tip="Not helpful" data-ds-feedback-value="down">' + h.icon('thumbDown', 18, 'ds-icon--fillable') + '</button></div></footer>';
  return '<article class="ds-message ds-message--' + role + '" data-ds-message="' + (state || '') + '" aria-labelledby="' + id + '">' +
    (mine ? '' : '<div class="ds-message__avatar" aria-hidden="true">' + h.icon('bot', 20) + '</div>') +
    '<div class="ds-message__main"><header class="ds-message__head"><span class="ds-message__author" id="' + id + '">' + (mine ? 'Ada Lovelace' : 'Assistant') + '</span></header>' +
    '<div class="ds-message__content' + (mine ? '' : ' ds-prose ds-prose--compact') + '">' + (mine ? txEsc(text) : '<p>' + txEsc(text) + '</p>') + '</div>' +
    actions + '</div></article>';
}

function txNodes(html) {
  return document.createRange().createContextualFragment(html);
}

SG.demo('transcript', {
  title: 'Transcript',
  group: 'content',
  need: 'Scroll a conversation: stick to the end, a "Latest" jump with the count of new messages, day separators, load earlier messages in place',
  lead: 'A conversation as a project wires it: the transcript over a composer. Send a message, or let replies arrive while you read further up: the "Latest" pill counts them.',
  options: { variants: false, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var now = new Date();
    var yesterday = new Date(now.getTime() - 864e5);
    return h.section('Conversation', '<div data-demo="chat" style="display:flex;flex-direction:column;gap:var(--ds-space-2);block-size:480px;border:1px solid var(--ds-line);border-radius:var(--ds-radius-xl);background:var(--ds-surface);overflow:hidden">' +
        '<div class="ds-transcript" data-ds-transcript role="region" aria-label="Conversation" tabindex="0" style="flex:1 1 auto" data-demo="log">' +
        '<div class="ds-transcript__earlier"><button class="ds-btn ds-btn--text" type="button" data-ds-transcript-earlier>Load earlier messages</button></div>' +
        '<div class="ds-transcript__list" role="log" aria-label="Messages">' +
        '<h3 class="ds-transcript__day">' + h.esc(DS.transcript.day(yesterday)) + '</h3>' +
        txMessage(h, 'user', 'Which devices need attention this week?') +
        txMessage(h, 'assistant', 'Three: laptop 4 (battery), the monitor in room 2 (no signal) and the router in the hallway (restarts).') +
        '<h3 class="ds-transcript__day">' + h.esc(DS.transcript.day(now)) + '</h3>' +
        txMessage(h, 'user', 'Why does laptop 4 lose its charge overnight?') +
        txMessage(h, 'assistant', TX_REPLIES[0]) +
        '</div></div>' +
        '<form class="ds-composer" data-ds-composer style="margin:0 var(--ds-space-2) var(--ds-space-2)" data-demo="composer">' +
        '<textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Ask about a device"></textarea>' +
        '<button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">' +
        '<span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">' + h.icon('send', 20) + '</span><span class="ds-icon-swap__b">' + h.icon('square', 20) + '</span></span></button></form>' +
        '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--outlined" type="button" data-demo="incoming">Receive a reply</button></div>',
        'Scroll up and press "Receive a reply": the transcript stays where you read and the pill counts what came. "Load earlier messages" keeps the message on screen in place.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the transcript; the arrow keys and <kbd class="ds-kbd">Page Up</kbd> / <kbd class="ds-kbd">Page Down</kbd> scroll it. Replies are announced once they are complete.</p>');
  },

  wire: function (root, h) {
    var log = h.$('[data-demo="log"]', root);
    var form = h.$('[data-demo="composer"]', root);
    if (!log || !form) return function () {};
    var list = h.$('.ds-transcript__list', log);
    var transcript = DS.transcript.create(log);
    var composer = DS.composer.create(form);
    var timers = [];
    var turn = 1;
    var earlier = 0;

    function stream(text) {
      list.append(txNodes(txMessage(h, 'assistant', '', 'streaming')));
      var article = list.lastElementChild;
      var message = DS.message.create(article);
      var words = text.split(' ');
      composer.set({ busy: true });
      words.forEach(function (word, i) {
        timers.push(setTimeout(function () {
          message.append((i ? ' ' : '') + word);
          if (i === words.length - 1) {
            message.set('done');
            composer.set({ busy: false });
          }
        }, h.slow(90 * (i + 1))));
      });
      return message;
    }

    form.addEventListener('ds:send', function (event) {
      list.append(txNodes(txMessage(h, 'user', event.detail.text)));
      transcript.stick();
      timers.push(setTimeout(function () { stream(TX_REPLIES[turn++ % TX_REPLIES.length]); }, h.slow(400)));
    });
    form.addEventListener('ds:stop', function () {
      timers.forEach(clearTimeout);
      timers = [];
      var last = list.lastElementChild;
      var message = last && DS.core.get(last, 'message');
      if (message && message.get().state === 'streaming') message.set('partial');
      composer.set({ busy: false });
    });
    h.$('[data-demo="incoming"]', root).addEventListener('click', function () {
      stream(TX_REPLIES[turn++ % TX_REPLIES.length]);
    });
    log.addEventListener('ds:earlier', function () {
      timers.push(setTimeout(function () {
        var html = '<h3 class="ds-transcript__day">' + h.esc(DS.transcript.day(new Date(Date.now() - (3 + earlier) * 864e5))) + '</h3>' +
          TX_EARLIER.map(function (row) { return txMessage(h, row[0], row[1]); }).join('');
        list.prepend(txNodes(html));
        earlier += 1;
        transcript.loaded({ more: earlier < 2 });
      }, h.slow(600)));
    });
    return function () { timers.forEach(clearTimeout); };
  },
});
