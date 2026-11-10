/* A citation's card: the popups' entrance from the marker, and its exit. */
SG_LAB.add({
  id: 'cite-card',
  group: 'overlays',
  title: 'Citation card',
  note: '<code>DS.cite.create()</code> and <code>set(open)</code>: the card fades in on <code>--ds-dur-fast</code> and grows from <code>--ds-scale-popup</code> at the marker on <code>--ds-ease-spatial</code> (<code>--ds-dur-medium</code>); it fades out in <code>--ds-dur-instant</code>. Rapid toggle turns it back from where it is.',
  shows: ['DS.cite.create', '.ds-cite', '.ds-cite__card', '--ds-scale-popup'],
  html: '<p>Eleven laptops leave warranty before March<button class="ds-cite" type="button" aria-controls="lab-cite-card" aria-label="Source 1: Warranty register 2026" data-lab-cite>1</button>.</p>' +
    '<div class="ds-cite__card" id="lab-cite-card" popover="manual" hidden><p class="ds-cite__source">example.com</p><a class="ds-cite__title" href="#">Warranty register 2026</a><p class="ds-cite__snippet">The warranty of LAPTOP-0042 ends on 28 February 2027.</p></div>',
  height: 220,
  setup: function (stage) {
    stage.cite = DS.cite.create(stage.querySelector('[data-lab-cite]'));
  },
  play: function (stage, sg) {
    var card = stage.querySelector('.ds-cite__card');
    stage.cite.set(true);
    return new Promise(function (resolve) {
      setTimeout(function () {
        stage.cite.set(false);
        resolve(DS.motion.settled(card));
      }, sg.slow(900));
    });
  },
  toggle: function (stage, on) {
    stage.cite.set(on);
    var card = stage.querySelector('.ds-cite__card');
    // Closing: the overlay's promise, which resolves once the exit has played (settled() can answer before it starts).
    return on ? DS.motion.settled(card) : DS.overlay.close(card);
  },
  state: function (stage) { return stage.cite.get(); },
});
