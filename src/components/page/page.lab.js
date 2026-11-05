/*
 * Motion Lab: the page head. A sticky head condenses once its box is
 * scrolled: the folded parts leave in one frame and keep their room, and
 * the hairline under it fades in with the scroll (or over --ds-dur-fast
 * where scroll timelines are missing).
 */
function pageHeadMarkup() {
  var cards = '';
  for (var index = 0; index < 6; index += 1) cards += '<div class="ds-card" style="min-block-size: 80px;"><p class="ds-muted" style="margin: 0;">Card ' + (index + 1) + '</p></div>';
  return '<div data-lab="page-head" style="block-size: 260px; inline-size: 420px; overflow-y: auto; padding: 0 var(--ds-space-3) var(--ds-space-3); background: var(--ds-backdrop);">' +
    '<header class="ds-page-head ds-page-head--sticky"><a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="#">' + DS.icons.icon(DS.icons.arrowLeft, 18) + 'Devices</a>' +
    '<div class="ds-page-head__row"><div class="ds-page-head__text"><h3 class="ds-page-head__title">LAPTOP-0042</h3><p class="ds-page-head__lead">Laptop 14 · Ada Lovelace</p></div>' +
    '<div class="ds-page-head__actions"><button class="ds-btn" type="button">Retire</button><button class="ds-btn ds-btn--filled" type="button">Edit</button></div></div>' +
    '<dl class="ds-page-head__details"><div class="ds-page-head__detail"><dt>Site</dt><dd>Building B</dd></div><div class="ds-page-head__detail"><dt>Last sync</dt><dd>Today, 09:12</dd></div></dl></header>' +
    '<div class="ds-stack">' + cards + '</div></div>';
}

SG_LAB.add({
  id: 'page-head-condense',
  group: 'navigation',
  title: 'Page head: condenses on scroll',
  note: 'Scrolled past what folds, the head takes <code>data-scrolled</code>: the back link, the lead and the key facts fold away in one frame and keep their room as a margin, so the cards stay in place. The hairline fades in with the scroll (<code>ds-scroll-fade</code>), or over <code>--ds-dur-fast</code>.',
  shows: ['DS.page.create', '.ds-page-head--sticky', 'ds-scroll-fade', '--ds-dur-fast'],
  html: pageHeadMarkup(),
  height: 280,
  wide: true,
  setup: function (stage) {
    stage.dsPage = DS.page.create(stage.querySelector('.ds-page-head'));
  },
  play: function (stage, sg) {
    var box = stage.querySelector('[data-lab="page-head"]');
    box.scrollTo({ top: 260, behavior: 'smooth' });
    return sg.frames(30).then(function () { return DS.motion.settled(stage.querySelector('.ds-page-head')); });
  },
  reset: function (stage, sg) {
    var box = stage.querySelector('[data-lab="page-head"]');
    box.scrollTop = 0;
    return sg.frames(2);
  },
  state: function (stage) { return stage.dsPage.get(); },
  toggle: function (stage, on, sg) {
    var box = stage.querySelector('[data-lab="page-head"]');
    box.scrollTo({ top: on ? 260 : 0, behavior: 'smooth' });
    return sg.frames(30);
  },
});
