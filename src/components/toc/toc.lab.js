/*
 * Motion Lab: jump links. A jump marks its link at once and the bar glides
 * there on the indicator's spring while the section scrolls into view; the
 * reader's own scrolling moves the mark the same way.
 */
var SECTIONS = ['Overview', 'Hardware', 'Network', 'History'];

function tocMarkup() {
  return '<div data-lab="toc" style="display: grid; grid-template-columns: 9rem minmax(0, 1fr); gap: var(--ds-space-4); block-size: 200px; overflow-y: auto; inline-size: 360px;">' +
    '<nav class="ds-toc ds-toc--sticky" aria-label="On this page" style="--ds-toc-top: 0px;"><ol class="ds-toc__list">' + SECTIONS.map(function (name, index) {
      return '<li><a class="ds-toc__link" href="#lab-toc-' + index + '">' + name + '</a></li>';
    }).join('') + '</ol></nav><div>' + SECTIONS.map(function (name, index) {
      return '<h4 id="lab-toc-' + index + '" style="margin: 0; padding-block: var(--ds-space-2); font: var(--ds-font-subtitle);">' + name + '</h4><p class="ds-muted" style="margin: 0; block-size: 160px;">The ' + name.toLowerCase() + ' of the device.</p>';
    }).join('') + '</div></div>';
}

function tocSettled(stage, sg) {
  return sg.frames(2).then(function () { return DS.motion.settled(stage.querySelector('.ds-toc__indicator')); });
}

SG_LAB.add({
  id: 'toc-jump',
  group: 'navigation',
  title: 'Jump links: the mark follows the section',
  note: 'A jump marks its link at once; the bar glides there on <code>--ds-ease-spatial</code> while the section scrolls to the top. Toggle back and forth: the bar continues from where it is.',
  shows: ['DS.toc.create', '.ds-toc__indicator', '.ds-toc--sticky', '--ds-ease-spatial', '--ds-dur-medium'],
  html: tocMarkup(),
  height: 220,
  setup: function (stage) {
    stage.dsToc = DS.toc.create(stage.querySelector('.ds-toc'), { hash: false });
  },
  play: function (stage, sg) {
    stage.dsToc.set('lab-toc-2');
    return tocSettled(stage, sg);
  },
  reset: function (stage, sg) {
    stage.dsToc.set('lab-toc-0');
    return tocSettled(stage, sg);
  },
  state: function (stage) { return stage.dsToc.get() === 'lab-toc-3'; },
  toggle: function (stage, on, sg) {
    stage.dsToc.set(on ? 'lab-toc-3' : 'lab-toc-0');
    return tocSettled(stage, sg);
  },
});
