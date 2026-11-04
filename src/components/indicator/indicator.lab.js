/*
 * The Motion Lab's sliding indicator on a track of buttons: the stretch and
 * landing, the travel time by distance, an interrupted glide, a re-render
 * that keeps the pill, and no active item. Moved from styleguide/lab.js; the
 * build wraps this file into styleguide/lab-components.js.
 */
var $ = function (selector, root) { return root.querySelector(selector); };
var $$ = function (selector, root) { return Array.prototype.slice.call(root.querySelectorAll(selector)); };

var TRACK = ['Day', 'Week', 'Month', 'Quarter', 'Year', 'All time'];
var TRACK_LONG = ['Today', 'This week', 'This month', 'This quarter', 'This year', 'All time'];
var trackLast = 0;
var trackTimer = 0;
var trackLong = false;

/* Markup through an inert <template>, as in lab.js. */
function setHtml(element, html) {
  var template = document.createElement('template');
  template.innerHTML = html;
  element.replaceChildren(template.content);
}

function trackButtons(stage) { return $$('#sg-track > button', stage); }

function trackHtml(names) {
  return names.map(function (name, index) {
    return '<button class="ds-btn ds-sm" type="button" aria-pressed="' + (index === trackLast) + '" tabindex="' + (index === trackLast ? 0 : -1) + '">' + name + '</button>';
  }).join('');
}

/* Moves the active item; the read-out names the distance between the
   two items' centres and the travel time it gives. */
function pressTrack(stage, index) {
  clearTimeout(trackTimer);
  var clear = $('[data-sg="track-clear"]', stage.parentNode);
  if (clear) clear.setAttribute('aria-pressed', 'false');
  var buttons = trackButtons(stage);
  var from = buttons[trackLast];
  var to = buttons[index];
  if (from && to && from !== to) {
    var a = from.getBoundingClientRect();
    var b = to.getBoundingClientRect();
    var px = Math.abs(b.left + b.width / 2 - a.left - a.width / 2);
    setHtml($('#sg-track-move', stage.parentNode), 'Last move: <strong class="ds-num">' + Math.abs(index - trackLast) + '</strong> ' + (Math.abs(index - trackLast) === 1 ? 'item' : 'items') +
      ', <strong class="ds-num">' + Math.round(px) + 'px</strong> · <code>travelDuration</code> <strong class="ds-num">' + Math.round(DS.motion.travelDuration(to, px)) + 'ms</strong>');
  }
  buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === index)); });
  if (index >= 0) trackLast = index;
}

/* The pill places itself one frame after the change (its observer); then
   its edges run as transitions. */
function trackSettled(stage, sg) {
  return sg.frames(2).then(function () { return DS.motion.settled($('#sg-track > .ds-indicator', stage), { transitions: true }); });
}

function trackDemo(stage, action, button, sg) {
  var count = trackButtons(stage).length;
  if (action === 'track-hop') pressTrack(stage, trackLast + 1 < count ? trackLast + 1 : trackLast - 1);
  if (action === 'track-jump') pressTrack(stage, trackLast < count / 2 ? count - 1 : 0);
  if (action === 'track-interrupt') {
    // The second target 80ms later (at the current speed), while the
    // first glide still runs: the pill turns from where it is.
    var far = trackLast < count / 2 ? count - 1 : 0;
    var middle = Math.floor(count / 2);
    pressTrack(stage, far);
    trackTimer = setTimeout(function () { pressTrack(stage, middle); }, sg.slow(80));
  }
  if (action === 'track-morph') {
    // A re-render of the whole track with other labels: the pill stays
    // (morphHtml keeps it) and glides to the new size of its item.
    trackLong = !trackLong;
    DS.dom.morphHtml($('#sg-track', stage), trackHtml(trackLong ? TRACK_LONG : TRACK));
  }
  if (action === 'track-clear') {
    if (button.getAttribute('aria-pressed') === 'true') {
      pressTrack(stage, trackLast);
    } else {
      pressTrack(stage, -1);
      button.setAttribute('aria-pressed', 'true');
    }
  }
}

SG_LAB.add({
  id: 'track',
  group: 'navigation',
  title: 'Indicator',
  note: 'The pill stretches toward its target (the leading edge leads, the trailing edge follows), passes it by a hair and settles on the spring; a longer jump takes longer, up to a cap (travelDuration, in the read-out). It follows aria-pressed by itself: the buttons only change the attribute. A new target mid-glide continues from where the pill is, and a re-render of the track through <code>DS.dom.morphHtml</code> keeps the pill, which glides to its item\'s new size. The track is one tab stop (<code>DS.dom.roving()</code>): the arrow keys, Home and End move the focus and press the item.',
  shows: ['DS.indicator.create', 'DS.motion.travelDuration', 'DS.dom.morphHtml', 'DS.dom.roving', '--ds-ease-spatial', '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-micro'],
  html: '<div class="sg-track" id="sg-track">' + trackHtml(TRACK) + '</div>',
  after: '<p class="ds-meta sg-readout" id="sg-track-move" data-lab-readout aria-live="polite">Press an item, or hop and jump.</p>',
  height: 120,
  wide: true,
  controls: '<div class="sg-row"><button class="ds-btn ds-sm ds-btn--text" type="button" data-sg="track-hop">Hop to the neighbour</button><button class="ds-btn ds-sm ds-btn--text" type="button" data-sg="track-jump">Jump across</button><button class="ds-btn ds-sm ds-btn--text" type="button" data-sg="track-interrupt">Interrupt (two targets 80ms apart)</button><button class="ds-btn ds-sm ds-btn--text" type="button" data-sg="track-morph">Re-render (morphHtml)</button><button class="ds-btn ds-sm ds-btn--quiet" type="button" data-sg="track-clear" aria-pressed="false">No active item</button></div>',
  setup: function (stage, sg) {
    var track = $('#sg-track', stage);
    sg.indicator(track, { active: '[aria-pressed="true"]', className: 'sg-track__indicator' });
    DS.dom.roving(track, { items: 'button' });
    track.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (button) pressTrack(stage, trackButtons(stage).indexOf(button));
    });
    stage.parentNode.addEventListener('click', function (event) {
      var button = event.target.closest('[data-sg^="track-"]');
      if (button) trackDemo(stage, button.getAttribute('data-sg'), button, sg);
    });
  },
  play: function (stage, sg) {
    trackDemo(stage, 'track-jump', null, sg);
    return trackSettled(stage, sg);
  },
  state: function () { return trackLast === TRACK.length - 1; },
  toggle: function (stage, on, sg) {
    pressTrack(stage, on ? TRACK.length - 1 : 0);
    return trackSettled(stage, sg);
  },
});
