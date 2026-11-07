/*
 * The Load more demo: a list that grows by a button, an infinite scroll in
 * a scroller that stops after three automatic loads, the inline look in a
 * card's foot, a load that fails and tries again, and a list that shows
 * everything. The system drives the control (data-ds-loadmore); wire() is
 * the page: a fake backend on ds:loadmore that renders the new rows with
 * DS.dom.morphHtml inside DS.motion.flip and answers through respond().
 */
var KINDS = [['laptop', 'Laptop'], ['monitor', 'Desktop'], ['tablet', 'Tablet'], ['smartphone', 'Phone'], ['server', 'Server']];

function device(index) {
  var kind = KINDS[index % KINDS.length];
  return { id: 'd' + index, icon: kind[0], name: kind[1].toUpperCase() + '-' + String(1000 + index * 7).slice(-4), meta: kind[1] + ' · Building ' + 'ABCD'.charAt(index % 4) };
}

function rows(h, count) {
  var out = '';
  for (var i = 0; i < count; i += 1) {
    var d = device(i);
    out += '<li class="ds-list__item" data-ds-key="' + d.id + '">' + h.icon(d.icon, 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(d.name) + '</span><span class="ds-list__meta">' + h.esc(d.meta) + '</span></span></li>';
  }
  return out;
}

function control(h, list, loaded, total, extra, cls) {
  return '<div class="ds-loadmore' + (cls ? ' ' + cls : '') + '" data-ds-loadmore data-ds-loadmore-for="#' + list + '" data-ds-loadmore-loaded="' + loaded + '"' +
    (total == null ? '' : ' data-ds-loadmore-total="' + total + '"') + (extra || '') + '>' +
    '<p class="ds-loadmore__status">' + h.icon('alertCircle', 16, 'ds-loadmore__icon') + '<span class="ds-loadmore__text"></span></p>' +
    '<button class="ds-btn ds-loadmore__button" type="button"><span class="ds-btn__faces"><span class="ds-btn__face">Load more devices</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Loading</span></span></button></div>';
}

function block(h, title, loaded, total, extra, options) {
  var list = h.uid('devices');
  options = options || {};
  var body = '<ul class="ds-list" id="' + list + '" aria-label="' + title + '" data-total="' + (total == null ? 40 : total) + '"' + (options.fail ? ' data-fail' : '') + '>' + rows(h, loaded) + '</ul>' +
    control(h, list, loaded, total, extra, options.cls);
  return options.scroll ? '<div class="sg-loadmore-scroll" tabindex="0" role="region" aria-label="' + title + ', scrolls" style="max-height: 320px; overflow: auto; padding-inline: var(--ds-space-1)">' + body + '</div>' : body;
}

SG.demo('loadmore', {
  title: 'Load more and infinite scroll',
  group: 'data',
  need: 'Grow a long list by pages: a Load more button, or an infinite scroll that stops for the footer',
  lead: 'The end of a list that grows by pages. The button is always there; with an infinite scroll the next page also loads as the end scrolls into view, three times, and then the button takes over so the footer stays reachable.',
  options: { variants: ['default', 'inline'], tones: false },

  render: function (h) {
    var inline = h.variant === 'inline' ? 'ds-loadmore--inline' : '';
    return h.section('Load more', '<div style="max-width: 560px">' + block(h, 'Devices', 5, 17, '', { cls: inline }) + '</div>',
      'Each press loads five more. The busy face shows only when the page is slow; the status and an announcement say how many show.') +
      h.section('Infinite scroll', '<div style="max-width: 560px">' + block(h, 'Devices in the scroller', 8, 60, ' data-ds-loadmore-auto="3"', { scroll: true, cls: inline }) + '</div>',
        'Scroll to the end: the next page loads by itself three times, then the button loads. The sentinel watches the scroller it sits in.') +
      h.section('In a card', '<section class="ds-card" style="max-width: 560px"><h3 class="ds-card__title">Open tickets</h3>' +
        block(h, 'Open tickets', 3, null, ' data-ds-loadmore-focus="new"', { cls: 'ds-loadmore--inline' }) + '</section>',
        'The inline look at the foot of a card, without a total ("Showing 3"); after a press the focus moves to the first new row.') +
      h.section('States', '<div class="ds-grid-2">' +
        '<div>' + block(h, 'Devices that fail to load', 3, 12, '', { fail: true, cls: inline }) + '</div>' +
        '<div>' + block(h, 'All devices', 4, 4, '', { cls: inline }) + '</div></div>',
        'A load that fails says so in words, with an icon, and the button tries again (the next press works). A list that shows everything has no button.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the button in both modes; <kbd class="ds-kbd">Enter</kbd> loads. Focus stays on the button, now after the new rows, or moves to the first new row; when the button goes, the status takes the focus.</p>');
  },

  wire: function (root, h) {
    var timers = [];
    h.$$('.ds-loadmore', root).forEach(function (el) {
      var list = root.querySelector(el.getAttribute('data-ds-loadmore-for'));
      var total = Number(list.getAttribute('data-total'));
      var failNext = list.hasAttribute('data-fail');
      var shown = list.children.length;
      el.addEventListener('ds:loadmore', function (event) {
        event.detail.respond(new Promise(function (resolve, reject) {
          timers.push(setTimeout(function () {
            if (failNext) {
              failNext = false;
              reject(new Error('offline'));
              return;
            }
            shown = Math.min(total, shown + (el.hasAttribute('data-ds-loadmore-auto') ? 8 : el.hasAttribute('data-ds-loadmore-total') ? 5 : 3));
            DS.motion.flip(list, function (options) { DS.dom.morphHtml(list, rows(h, shown), options); }, { items: 'li' });
            resolve(el.hasAttribute('data-ds-loadmore-total') ? { loaded: shown } : { loaded: shown, done: shown >= 12 });
          }, h.slow(700)));
        }));
      });
    });
    return function () { timers.forEach(clearTimeout); };
  },
});
