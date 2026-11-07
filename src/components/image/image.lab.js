/* Image: a picture that arrives fades in; a new one fades out while it loads. */
(function () {
  var PICTURE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#cfe3f7"/><rect y="330" width="640" height="150" fill="#5b8fc4"/><rect x="200" y="170" width="240" height="160" rx="12" fill="#26415e"/></svg>');

  SG_LAB.add({
    id: 'image-load',
    group: 'data',
    title: 'Image',
    note: 'The frame holds its place on the tint while the picture loads (<code>data-state="loading"</code>); once it is there it fades in over <code>--ds-dur-medium</code>, and a new picture fades out over <code>--ds-dur-fast</code>. Transitions, so a change mid-way turns back from where it is.',
    shows: ['.ds-image', '.ds-image__frame', 'DS.image.create', '--ds-dur-medium', '--ds-dur-fast', '--ds-ease-in-out'],
    html: '<figure class="ds-image ds-image--photo" style="inline-size: 200px; margin: auto"><span class="ds-image__frame"><img src="' + PICTURE + '" alt="Printer 7"></span><figcaption class="ds-image__caption">Printer 7</figcaption></figure>',
    height: 220,
    setup: function (stage) {
      var frame = stage.querySelector('.ds-image__frame');
      if (!DS.get(frame, 'image')) DS.image.create(frame);
    },
    play: function (stage) {
      var frame = stage.querySelector('.ds-image__frame');
      var img = frame.querySelector('img');
      // From the loading state at once, as a picture not there yet starts.
      img.style.transition = 'none';
      frame.setAttribute('data-state', 'loading');
      getComputedStyle(img).opacity;
      img.style.removeProperty('transition');
      getComputedStyle(img).opacity;
      frame.setAttribute('data-state', 'loaded');
      return DS.motion.settled(img);
    },
    toggle: function (stage, on) {
      var frame = stage.querySelector('.ds-image__frame');
      frame.setAttribute('data-state', on ? 'loaded' : 'loading');
      return DS.motion.settled(frame.querySelector('img'));
    },
    state: function (stage) {
      return stage.querySelector('.ds-image__frame').getAttribute('data-state') !== 'loading';
    }
  });
})();
