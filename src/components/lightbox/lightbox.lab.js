/*
 * The Motion Lab entry of DS.lightbox: the viewer opens on an image, steps
 * to the next one, zooms and closes.
 */
function lbLabPicture(colour) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 160 100"><rect width="160" height="100" fill="' + colour + '"/>' +
    '<rect x="40" y="20" width="80" height="60" rx="8" fill="#fff" fill-opacity=".85"/></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

SG_LAB.add({
  id: 'lightbox-open',
  group: 'overlays',
  title: 'Lightbox: open, next, zoom, close',
  note: 'The viewer opens as a dialog; the next image enters with the swap of DS.motion.enter(); the zoom glides over --ds-dur-medium on --ds-ease-out and back; the viewer closes as a dialog.',
  shows: ['DS.lightbox.open', 'DS.lightbox.close', '.ds-lightbox', '--ds-dur-medium', '--ds-ease-out'],
  html: '<ul class="ds-lightbox__gallery" aria-label="Photos of LAPTOP-0042" style="inline-size:100%" data-lab-gallery>' +
    '<li><a class="ds-lightbox__item" href="' + lbLabPicture('#5b7fbd') + '" data-caption="The lid"><img src="' + lbLabPicture('#5b7fbd') + '" alt="The lid of LAPTOP-0042"></a></li>' +
    '<li><a class="ds-lightbox__item" href="' + lbLabPicture('#6a8f6b') + '" data-caption="The keyboard"><img src="' + lbLabPicture('#6a8f6b') + '" alt="The keyboard of LAPTOP-0042"></a></li></ul>',
  height: 160,
  setup: function (stage) { DS.lightbox.create(stage.querySelector('[data-lab-gallery]')); },
  play: function (stage) {
    var gallery = stage.querySelector('[data-lab-gallery]');
    var box = DS.lightbox.create(gallery);
    var pause = function () { return new Promise(function (resolve) { setTimeout(resolve, DS.motion.motionDuration(gallery, '--ds-dur-glide')); }); };
    return DS.lightbox.open(gallery, { index: 0, opener: gallery.querySelector('a') })
      .then(pause)
      .then(function () { box.next(); return pause(); })
      .then(function () { box.set({ zoom: 2 }); return pause(); })
      .then(function () { box.set({ zoom: 1 }); return pause(); })
      .then(function () { return DS.lightbox.close(gallery); });
  },
});
