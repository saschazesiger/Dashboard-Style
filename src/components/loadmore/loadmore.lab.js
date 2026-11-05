/*
 * The Motion Lab entry of DS.loadmore: a slow page. The button's busy face
 * shows after --ds-delay-loader and stays for --ds-hold-loader; the new rows
 * fade in through DS.motion.flip (keyed, so nothing else moves); the status
 * changes at once.
 */
var made = new WeakMap();

function rowHtml(index) {
  return '<li class="ds-list__item" data-ds-key="r' + index + '"><span class="ds-list__text"><span class="ds-list__title">TICKET-' + (1040 + index) + '</span></span></li>';
}

function rowsHtml(count) {
  var out = '';
  for (var i = 0; i < count; i += 1) out += rowHtml(i);
  return out;
}

function controlOf(stage, sg) {
  var el = stage.querySelector('.ds-loadmore');
  if (made.has(el)) return made.get(el);
  var list = stage.querySelector('ul');
  var control = DS.loadmore.create(el, {
    load: function (state) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var next = (state.loaded || 0) + 2;
          DS.motion.flip(list, function (options) { DS.dom.morphHtml(list, rowsHtml(next), options); }, { items: 'li' });
          resolve({ loaded: next });
        }, sg.slow(600));
      });
    },
  });
  made.set(el, control);
  return control;
}

SG_LAB.add({
  id: 'loadmore-page',
  group: 'data',
  title: 'Load more: a slow page',
  note: 'The busy face shows only after --ds-delay-loader and stays at least --ds-hold-loader; the two new rows fade in through DS.motion.flip, the rows above stay where they are, and the status changes at once.',
  shows: ['DS.loadmore.create', '.ds-loadmore', '--ds-delay-loader', '--ds-hold-loader'],
  html: '<ul class="ds-list" aria-label="Tickets">' + rowsHtml(2) + '</ul>' +
    '<div class="ds-loadmore ds-loadmore--inline" data-ds-loadmore-loaded="2" data-ds-loadmore-total="12"><p class="ds-loadmore__status"><span class="ds-loadmore__text"></span></p>' +
    '<button class="ds-btn ds-loadmore__button" type="button"><span class="ds-btn__faces"><span class="ds-btn__face">Load more</span>' +
    '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--ink ds-sm"></span>Loading</span></span></button></div>',
  height: 300,
  setup: function (stage, sg) {
    controlOf(stage, sg);
  },
  reset: function (stage, sg) {
    var list = stage.querySelector('ul');
    DS.dom.morphHtml(list, rowsHtml(2));
    controlOf(stage, sg).reset({ loaded: 2, total: 12 });
  },
  play: function (stage, sg) {
    return controlOf(stage, sg).load().then(function () {
      return DS.motion.settled(stage, { subtree: true });
    });
  },
});
