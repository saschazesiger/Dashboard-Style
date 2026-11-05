/*
 * The Image demo: the shapes, cover and contain, a caption, a picture that
 * fails (with a second source and without), thumbnails that load lazily in
 * a list, and a picture the page swaps. The pictures are drawn as SVG data
 * so the styleguide works from disk. Registered through SG.demo()
 * (styleguide/sg-core.js). Shape and density come from the options panel.
 */
/** A made-up picture: a device on a desk, in one of three palettes, at width x height. */
function imagePicture(kind, width, height) {
  var palettes = [['#cfe3f7', '#5b8fc4', '#26415e'], ['#f3e1c7', '#c58b4e', '#5a3a1c'], ['#d9eedb', '#5f9e6a', '#24452a']];
  var p = palettes[kind % palettes.length];
  var w = width || 640;
  var h = height || 480;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">' +
    '<rect width="640" height="480" fill="' + p[0] + '"/><rect y="330" width="640" height="150" fill="' + p[1] + '"/>' +
    '<rect x="200" y="170" width="240" height="160" rx="12" fill="' + p[2] + '"/><rect x="224" y="194" width="192" height="40" rx="6" fill="' + p[0] + '"/>' +
    '<circle cx="520" cy="110" r="44" fill="' + p[1] + '"/></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function imageHtml(h, options) {
  var tag = options.caption ? 'figure' : options.inline ? 'span' : 'div';
  return '<' + tag + ' class="ds-image' + (options.cls ? ' ' + options.cls : '') + '"' + (options.style ? ' style="' + options.style + '"' : '') + '>' +
    '<span class="ds-image__frame" data-ds-image' + (options.fallback ? ' data-ds-image-fallback="' + options.fallback + '"' : '') + (options.name ? ' data-demo="' + options.name + '"' : '') + '>' +
    '<img src="' + options.src + '" alt="' + h.esc(options.alt) + '"' + (options.lazy ? ' loading="lazy" decoding="async"' : '') + (options.size ? ' width="' + options.size[0] + '" height="' + options.size[1] + '"' : '') + '></span>' +
    (options.caption ? '<figcaption class="ds-image__caption">' + options.caption + '</figcaption>' : '') + '</' + tag + '>';
}

SG.demo('image', {
  title: 'Image',
  group: 'content',
  need: 'Show a picture in a frame of a fixed shape, cropped or fitted, lazy, with words where it fails and a caption',
  lead: 'A picture in a frame of a fixed shape: cropped to fill it or fitted on the tint, a tint while it loads, the alt text where it fails, and a caption.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var grid = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--ds-space-4); align-items: start';
    return h.section('Shapes', '<div class="ds-card"><div style="' + grid + '">' +
        imageHtml(h, { cls: 'ds-image--square', src: imagePicture(0), alt: 'Printer 7 on a desk', caption: 'Square, 1 / 1' }) +
        imageHtml(h, { cls: 'ds-image--photo', src: imagePicture(1), alt: 'Laptop 0042 on a desk', caption: 'Photo, 4 / 3' }) +
        imageHtml(h, { cls: 'ds-image--wide', src: imagePicture(2), alt: 'Router in the server room', caption: 'Wide, 16 / 9' }) +
        imageHtml(h, { src: imagePicture(0, 640, 400), alt: 'Printer 7 on a desk', caption: 'Its own shape', size: [640, 400] }) +
        '</div></div>', 'The picture fills the frame and is cropped (cover). A frame of its own shape keeps its place while the picture loads.') +
      h.section('Cover and contain', '<div class="ds-card"><div style="' + grid + '">' +
        imageHtml(h, { cls: 'ds-image--square', src: imagePicture(1, 640, 300), alt: 'Ticket screenshot', caption: 'Cover: cropped' }) +
        imageHtml(h, { cls: 'ds-image--square ds-image--contain', src: imagePicture(1, 640, 300), alt: 'Ticket screenshot', caption: 'Contain: whole, on the tint' }) +
        imageHtml(h, { src: imagePicture(2), alt: 'Router in the server room', style: '--ds-image-ratio: 21 / 9', caption: '--ds-image-ratio: 21 / 9' }) +
        '</div></div>') +
      h.section('Where it fails', '<div class="ds-card"><div style="' + grid + '">' +
        imageHtml(h, { cls: 'ds-image--photo', src: 'data:image/svg+xml,not-a-picture', alt: 'Printer 7 by the window', caption: 'The alt text in its place', name: 'broken' }) +
        imageHtml(h, { cls: 'ds-image--photo', src: 'data:image/svg+xml,not-a-laptop', fallback: imagePicture(2), alt: 'Laptop 0042', caption: 'A second source first', name: 'second' }) +
        imageHtml(h, { cls: 'ds-image--photo', src: 'data:image/svg+xml,not-a-pattern', alt: '', caption: 'Decorative: the glyph only' }) +
        '</div></div>', 'A failed picture tries data-ds-image-fallback once, then shows the image glyph and its alt text.') +
      h.section('Thumbnails in a list, lazy', '<div class="ds-card" style="max-inline-size: 480px"><ul class="ds-list" aria-label="Devices">' +
        [['Printer 7', 'Second floor'], ['Laptop 0042', 'Ada Lovelace'], ['Router 3', 'Server room']].map(function (row, i) {
          return '<li class="ds-list__item"><span class="ds-list__media">' + imageHtml(h, { cls: 'ds-image--square', style: 'inline-size: 100%', inline: true, src: imagePicture(i, 112, 112), alt: '', lazy: true }) + '</span>' +
            '<span class="ds-list__text"><span class="ds-list__title">' + row[0] + '</span><span class="ds-list__meta">' + row[1] + '</span></span></li>';
        }).join('') + '</ul></div>', 'loading="lazy" on each picture: the browser fetches it as it nears the view. Beside a name, a thumbnail is decoration: alt="".') +
      h.section('A picture the page swaps', '<div class="ds-card" style="max-inline-size: 360px">' +
        imageHtml(h, { cls: 'ds-image--photo', src: imagePicture(0), alt: 'Printer 7', caption: 'Printer 7', name: 'swap' }) +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="next">' + h.icon('sync', 16) + 'Next picture</button></div></div>',
        'set() loads another picture: it fades out while it loads and fades in once it is there.') +
      h.section('Keyboard', '<p class="ds-muted">Pictures take no focus. A picture that leads somewhere sits in a link, whose name is the alt text or the words beside it.</p>');
  },

  wire: function (root, h) {
    var shown = 0;
    var names = ['Printer 7', 'Laptop 0042', 'Router 3'];
    var onClick = function (event) {
      if (!event.target.closest('[data-demo="next"]')) return;
      shown = (shown + 1) % 3;
      var frame = h.$('[data-demo="swap"]', root);
      var image = window.DS.get(frame, 'image');
      // A real picture takes a moment; the drawn one is there at once.
      h.$('img', frame).alt = names[shown];
      h.$('.ds-image__caption', root.querySelector('[data-demo="swap"]').parentNode).textContent = names[shown];
      if (image) image.set(imagePicture(shown));
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
