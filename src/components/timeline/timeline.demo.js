/*
 * The Timeline demo: the history of a record with day groups and muted
 * entries; an activity feed with avatars and a live entry; comments in a
 * box of their own. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density and shape come from the options panel around it. The
 * entries are fake, as a project's would come from its data layer.
 */
function chip(h, status) {
  return '<span class="ds-status ds-status--' + status[0] + '">' + h.icon(status[1], 16) + '<span>' + status[2] + '</span></span>';
}

function historyHtml(h) {
  return '<li class="ds-timeline__group" role="presentation"><h4 class="ds-timeline__day">12 Oct 2026</h4></li>' +
    '<li class="ds-timeline__item" data-ds-key="h3"><div class="ds-timeline__head"><p class="ds-timeline__title">Issued</p>' + chip(h, ['ok', 'check', 'Active']) + '</div>' +
      '<p class="ds-timeline__meta"><time datetime="2026-10-12T14:05">14:05</time> · Ada Lovelace</p><p class="ds-timeline__text">Issued to Ada Lovelace.\nCharger and bag included.</p>' +
      '<div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" aria-label="Edit the entry of 12 Oct 2026, 14:05" data-demo="edit">Edit</button></div></li>' +
    '<li class="ds-timeline__item ds-timeline__item--muted" data-ds-key="h2"><div class="ds-timeline__head"><p class="ds-timeline__title">Return planned</p></div>' +
      '<p class="ds-timeline__meta"><time datetime="2026-10-12T09:40">09:40</time> · Grace Hopper</p><p class="ds-timeline__text">Cancelled: the loan was extended.</p></li>' +
    '<li class="ds-timeline__group" role="presentation"><h4 class="ds-timeline__day">3 Oct 2026</h4></li>' +
    '<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="h1"><span class="ds-timeline__marker" aria-hidden="true">' + h.icon('wrench', 16) + '</span><div class="ds-timeline__head"><p class="ds-timeline__title">Repaired</p></div>' +
      '<p class="ds-timeline__meta">' + h.icon('user', 16) + 'Service desk</p><p class="ds-timeline__text">Keyboard replaced under warranty.</p></li>';
}

var FEED = [
  { id: 'a3', initials: 'GH', who: 'Grace Hopper', what: 'took LAPTOP-0051', when: '08:47' },
  { id: 'a2', glyph: 'sync', who: 'The nightly sync', what: 'changed nothing', when: '02:00', muted: true },
  { id: 'a1', initials: 'AL', who: 'Ada Lovelace', what: 'renamed PRINTER-0003', when: 'Yesterday' },
];
var FRESH = [['AT', 'Alan Turing', 'took TABLET-0121'], ['AL', 'Ada Lovelace', 'closed ticket #42'], ['GH', 'Grace Hopper', 'returned LAPTOP-0051']];

function feedHtml(h, items) {
  return items.map(function (item) {
    return '<li class="ds-timeline__item ds-timeline__item--icon' + (item.muted ? ' ds-timeline__item--muted' : '') + '" data-ds-key="' + item.id + '"><span class="ds-timeline__marker" aria-hidden="true">' + (item.glyph ? h.icon(item.glyph, 16) : item.initials) + '</span>' +
      '<div class="ds-timeline__head"><p class="ds-timeline__title"><strong>' + item.who + '</strong> ' + item.what + '</p><time class="ds-timeline__time">' + item.when + '</time></div></li>';
  }).join('');
}

function commentsHtml(h) {
  return '<li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--comment" data-ds-key="c2"><span class="ds-timeline__marker" aria-hidden="true">GH</span>' +
      '<div class="ds-timeline__head"><p class="ds-timeline__title">Grace Hopper</p><time class="ds-timeline__time" datetime="2026-10-12T09:40">09:40</time></div>' +
      '<p class="ds-timeline__text">The keyboard is back from the service desk.\nCan you check the battery too?</p>' +
      '<div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" aria-label="Reply to Grace Hopper" data-demo="reply">Reply</button></div></li>' +
    '<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="c1"><span class="ds-timeline__marker" aria-hidden="true">' + h.icon('pencil', 16) + '</span>' +
      '<div class="ds-timeline__head"><p class="ds-timeline__title">Status changed to In repair</p>' + chip(h, ['warning', 'wrench', 'In repair']) + '</div><p class="ds-timeline__meta">Service desk, 09:12</p></li>';
}

SG.demo('timeline', {
  title: 'Timeline',
  group: 'data',
  need: 'Show the history of a record, an activity feed or comments, on a rail grouped by day',
  lead: 'Entries on a rail, grouped by day: a dot, or a marker with an icon or an avatar. An activity feed reads as sentences, comments stand in a box of their own, and a muted entry takes a ring. Size, density and shape change the rail and its marks together.',
  options: { sizes: true, density: true, shape: true, tones: false, variants: ['history', 'activity', 'comments'] },

  render: function (h) {
    var show = function (name) { return !h.variant || h.variant === name; };
    return (show('history') ? h.section('History', '<ol class="ds-timeline" role="list" aria-label="History of LAPTOP-0042" data-demo="history">' + historyHtml(h) + '</ol>',
      'A muted entry did not take effect: it says why in words. An icon marker says who or what did it.') : '') +

      (show('activity') ? h.section('Activity', '<ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Activity" data-demo="activity">' + feedHtml(h, FEED) + '</ol>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="add">' + h.icon('plus', 16) + 'Add an entry</button></div>',
        'A live feed: a new entry fades in at the top while the others glide down (DS.motion.flip with live: true). The sync\'s own entry is muted.') : '') +

      (show('comments') ? h.section('Comments', '<ol class="ds-timeline" role="list" aria-label="Comments on ticket #42" data-demo="comments">' + commentsHtml(h) + '</ol>',
        'What someone wrote stands in a box, apart from what happened.') : '') +

      h.section('Empty', '<ol class="ds-timeline" role="list" aria-label="No entries"></ol><p class="ds-muted">An empty timeline takes no room: show an empty state instead.</p>') +

      h.section('Keyboard', '<p class="ds-muted">An entry is no target. <kbd class="ds-kbd">Tab</kbd> reaches its buttons and links; name the entry in each button\'s <code>aria-label</code>.</p>');
  },

  // What a page writes itself: a new entry, and what its buttons do.
  wire: function (root, h) {
    var items = FEED.slice();
    var next = 0;
    var onClick = function (event) {
      var target = event.target.closest('[data-demo="add"], [data-demo="edit"], [data-demo="reply"]');
      if (!target || !root.contains(target)) return;
      var action = target.getAttribute('data-demo');
      if (action === 'edit') h.toast('Editing opens a form in place (DS.motion.crossfade).', 'info');
      if (action === 'reply') h.toast('A reply opens a form in place.', 'info');
      if (action === 'add') {
        var fresh = FRESH[next % FRESH.length];
        next += 1;
        items.unshift({ id: 'n' + next, initials: fresh[0], who: fresh[1], what: fresh[2], when: 'Just now' });
        if (items.length > 4) items.pop();
        var list = h.$('[data-demo="activity"]', root);
        window.DS.motion.flip(list, function (options) { window.DS.dom.morphHtml(list, feedHtml(h, items), options); }, { live: true });
      }
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
