/* Category bar: the parts fill from zero, then their shares glide between two splits. */
(function () {
  var A = [0.5, 0.3, 0.2];
  var B = [0.2, 0.35, 0.45];

  SG_LAB.add({
    id: 'category-bar-share',
    group: 'data',
    title: 'Category bar',
    note: 'Each part is as wide as its <code>--ds-share</code>: the first render fills from zero (<code>.ds-enter--fill</code>), a new split glides on <code>--ds-ease-value</code> over <code>--ds-dur-glide</code>; the widths follow the registered share, so the parts never jump.',
    shows: ['.ds-category-bar', '.ds-category-bar__part', '.ds-enter--fill', '--ds-share', '--ds-ease-value', '--ds-dur-glide'],
    html: '<figure class="ds-category-bar" style="inline-size: min(100%, 420px)"><figcaption class="ds-category-bar__head"><span class="ds-category-bar__label">Tickets by status</span><span class="ds-category-bar__total">240</span></figcaption>' +
      '<div class="ds-category-bar__track" role="img" aria-label="Tickets by status">' +
      '<span class="ds-category-bar__part" style="--ds-share: .5"></span><span class="ds-category-bar__part ds-category-bar__part--s2" style="--ds-share: .3"></span><span class="ds-category-bar__part ds-category-bar__part--s3" style="--ds-share: .2"></span></div>' +
      '<ul class="ds-legend" aria-hidden="true"><li><span class="ds-legend__key"></span>Open</li><li><span class="ds-legend__key ds-legend__key--s2"></span>In progress</li><li><span class="ds-legend__key ds-legend__key--s3"></span>Closed</li></ul></figure>',
    play: function (stage) {
      var parts = Array.prototype.slice.call(stage.querySelectorAll('.ds-category-bar__part'));
      DS.motion.enterAll(parts, 'fill', { stagger: false });
      return DS.motion.settled(parts[0]);
    },
    toggle: function (stage, on) {
      var parts = stage.querySelectorAll('.ds-category-bar__part');
      parts.forEach(function (part, index) { part.style.setProperty('--ds-share', String((on ? B : A)[index])); });
      return DS.motion.settled(parts[0]);
    }
  });
})();
