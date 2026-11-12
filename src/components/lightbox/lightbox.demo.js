/*
 * The Lightbox demo: the photos of a device in a gallery (drawn here as SVG,
 * so the styleguide works from disk), an image that fails to load, a list
 * shown without a gallery, and a gallery of one. The viewer, its keys, zoom,
 * pan and swipe come from the system (data-ds-lightbox); wire() holds only
 * the button that shows a list.
 */
var LB_PHOTOS = [
  ['The lid of LAPTOP-0042', 'The lid, scratched on the left', '#5b7fbd', 'lid'],
  ['The keyboard of LAPTOP-0042', 'The keyboard: two keys are missing', '#6a8f6b', 'keys'],
  ['The ports of LAPTOP-0042', 'The ports on the right side', '#9a6fb0', 'ports'],
  ['The label of LAPTOP-0042', 'The asset label under the battery', '#b0805a', 'label'],
  ['The charger of LAPTOP-0042', 'The charger that came with it', '#5d8f9a', 'charger'],
  ['The box of LAPTOP-0042', 'The box it was delivered in', '#8a8a5a', 'box'],
];

/* A picture of a device part as an SVG data URI: a tinted field and a simple drawing, on a 160 x 100 grid. */
function lbPicture(colour, kind, width, height) {
  var key = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="9" height="8" rx="2" fill="' + colour + '" fill-opacity=".7"/>'; };
  var keys = '';
  for (var row = 0; row < 3; row += 1) {
    for (var col = 0; col < 7; col += 1) if (!(row === 1 && (col === 2 || col === 3))) keys += key(30 + col * 15, 32 + row * 12);
  }
  var shapes = {
    lid: '<rect x="35" y="15" width="90" height="70" rx="10" fill="#fff" fill-opacity=".85"/><circle cx="80" cy="50" r="8" fill="' + colour + '"/><path d="M45 28 L62 22" stroke="#333" stroke-width="2"/>',
    keys: '<rect x="22" y="25" width="116" height="50" rx="8" fill="#fff" fill-opacity=".85"/>' + keys,
    ports: '<rect x="15" y="38" width="130" height="24" rx="6" fill="#fff" fill-opacity=".85"/><rect x="30" y="45" width="14" height="10" rx="2" fill="#333"/><rect x="52" y="45" width="20" height="10" rx="2" fill="#333"/><circle cx="90" cy="50" r="4" fill="#333"/><rect x="104" y="46" width="12" height="8" rx="4" fill="#333"/>',
    label: '<rect x="45" y="28" width="70" height="44" rx="6" fill="#fff"/><path d="M54 40 H106 M54 50 H96 M54 60 H100" stroke="#333" stroke-width="3"/>',
    charger: '<rect x="58" y="22" width="44" height="42" rx="10" fill="#fff" fill-opacity=".9"/><path d="M80 64 V88" stroke="#fff" stroke-width="5"/><path d="M72 22 V12 M88 22 V12" stroke="#fff" stroke-width="4"/>',
    box: '<path d="M45 35 L80 20 L115 35 L115 72 L80 88 L45 72 Z" fill="#fff" fill-opacity=".85"/><path d="M45 35 L80 50 L115 35 M80 50 V88" stroke="' + colour + '" stroke-width="3" fill="none"/>',
  };
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">' +
    '<rect width="160" height="100" fill="' + colour + '"/>' + (shapes[kind] || '') + '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function lbItem(h, photo, extra) {
  return '<li><a class="ds-lightbox__item" href="' + lbPicture(photo[2], photo[3], 1600, 1000) + '" data-caption="' + h.esc(photo[1]) + '"' + (extra || '') + '>' +
    '<img src="' + lbPicture(photo[2], photo[3], 240, 240) + '" alt="' + h.esc(photo[0]) + '"></a></li>';
}

SG.demo('lightbox', {
  title: 'Lightbox',
  group: 'overlays',
  need: 'Look at the images of a record one at a time over the whole window, with thumbnails, zoom and a caption',
  lead: 'A gallery of links to full images; the viewer shows them one at a time over the whole window, dark in both schemes, with thumbnails, the arrow keys, zoom and pan, a caption and swipe on touch. The options panel changes density and shape around the gallery.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('A gallery', '<ul class="ds-lightbox__gallery" aria-label="Photos of LAPTOP-0042" data-ds-lightbox data-demo="gallery">' +
      LB_PHOTOS.map(function (photo) { return lbItem(h, photo); }).join('') + '</ul>',
      'Each item links to the full image, so it works without the script. Click one: the arrows, Home and End move; a click on the image (a double tap) zooms in to its own pixels and back, + and - zoom, a drag or the wheel pans a zoomed image, Escape closes.') +

      h.section('An image that fails', '<ul class="ds-lightbox__gallery" aria-label="Attachments of ticket #1042" data-ds-lightbox data-demo="failing">' +
        lbItem(h, LB_PHOTOS[1]) +
        '<li><a class="ds-lightbox__item" href="data:image/png;base64,AAAA" data-caption="A photo that did not upload"><img src="' + lbPicture('#7b7b7b', 'label', 240, 240) + '" alt="A broken attachment"></a></li></ul>',
        'An image that does not load shows an icon and words in its place.') +

      h.section('A list without a gallery', '<div class="sg-row"><button class="ds-btn" type="button" data-demo="show">' + h.icon('image', 18) + 'Show the photos of TABLET-0007</button></div>',
        'DS.lightbox.show() takes images the page has as data; the viewer goes once it closed. With original: true its bar links to the image on its own.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">←</kbd> <kbd class="ds-kbd">→</kbd> the previous and the next image (they pan when zoomed), <kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> pan, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> the first and the last, <kbd class="ds-kbd">+</kbd> <kbd class="ds-kbd">-</kbd> zoom, <kbd class="ds-kbd">0</kbd> fits; <kbd class="ds-kbd">Escape</kbd> takes the zoom back, then closes. <kbd class="ds-kbd">Tab</kbd> stays inside.</p>');
  },

  wire: function (root, h) {
    h.$('[data-demo="show"]', root).addEventListener('click', function (event) {
      DS.lightbox.show(LB_PHOTOS.slice(2, 5).map(function (photo) {
        return { src: lbPicture(photo[2], photo[3], 1600, 1000), thumb: lbPicture(photo[2], photo[3], 240, 240), alt: photo[0].replace('LAPTOP-0042', 'TABLET-0007'), caption: photo[1] };
      }), { opener: event.currentTarget, label: 'Photos of TABLET-0007', original: true });
    });
    return function () {
      h.$$('[data-ds-lightbox]', root).forEach(function (gallery) {
        var box = DS.get(gallery, 'lightbox');
        if (box) box.destroy();
      });
    };
  },
});
