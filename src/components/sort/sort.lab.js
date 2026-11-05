/*
 * The Motion Lab entry of DS.sort: the order button flips the direction, and
 * the one arrow turns 180deg on the spring; the words change at once and keep
 * the button's width.
 */
var made = new WeakMap();

/** The stage's one controller (create() makes a new one each call outside data-ds-sort). */
function sortOf(stage) {
  var el = stage.querySelector('[data-lab-sort]');
  if (!made.has(el)) made.set(el, DS.sort.create(el));
  return made.get(el);
}

SG_LAB.add({
  id: 'sort-order',
  group: 'data',
  title: 'Sort control: the order flips',
  note: 'The arrow turns on the spring (--ds-dur-medium, --ds-ease-spatial), as the table\'s sort arrow; the words change at once in a cell as wide as the longer one. Rapid toggles turn it back from where it is.',
  shows: ['DS.sort.create', '.ds-sort', '.ds-sort__arrow', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div class="ds-sort" data-lab-sort data-ds-value="name" role="group" aria-label="Sort">' +
    '<label class="ds-sort__label" for="sg-lab-sort-field">Sort by</label>' +
    '<select class="ds-input ds-sort__field" id="sg-lab-sort-field"><option value="name" data-ds-sort-type="text">Name</option>' +
    '<option value="seen" data-ds-sort-type="date">Last seen</option></select>' +
    '<button class="ds-btn ds-btn--quiet ds-sort__order" type="button">' + DS.icons.icon(DS.icons.arrowUp, 20, 'ds-sort__arrow') +
    '<span class="ds-sr">Order: </span><span class="ds-sort__words"><span class="ds-sort__word"></span><span class="ds-sort__word"></span></span></button></div>',
  height: 96,
  setup: function (stage) {
    sortOf(stage);
  },
  subject: function (stage) { return stage.querySelector('.ds-sort__arrow'); },
  state: function (stage) { return stage.querySelector('[data-lab-sort]').getAttribute('data-state') === 'descending'; },
  play: function (stage) {
    var sort = sortOf(stage);
    var arrow = stage.querySelector('.ds-sort__arrow');
    sort.set({ direction: 'descending' });
    return DS.motion.settled(arrow).then(function () {
      sort.set({ direction: 'ascending' });
      return DS.motion.settled(arrow);
    });
  },
  toggle: function (stage, on) {
    sortOf(stage).set({ direction: on ? 'descending' : 'ascending' });
    return DS.motion.settled(stage.querySelector('.ds-sort__arrow'));
  },
});
