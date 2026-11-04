/*
 * The Loading demo: the loading line, every skeleton preset in the wave or the
 * pulse, a page's skeleton that gives way to its content, and fast and slow
 * loads. Registered through SG.demo() (styleguide/sg-core.js). Size, density
 * and shape come from the options panel around it.
 */
function bone(cls) {
  return '<span class="ds-skeleton__line' + (cls ? ' ds-skeleton__line--' + cls : '') + '"></span>';
}

function surface(pulse, words, body) {
  return '<div class="ds-skeleton' + (pulse ? ' ds-skeleton--pulse' : '') + '" role="status"><span class="ds-sr">' + words + '</span>' + body + '</div>';
}

function row() {
  return '<div class="ds-skeleton__row" aria-hidden="true"><span class="ds-skeleton__avatar"></span><span class="ds-skeleton__lines">' + bone('mid') + bone('short') + '</span>' + bone() + '</div>';
}

function presets(pulse) {
  return '<div class="ds-grid-2" data-demo="presets">' +
    surface(pulse, 'Loading a text', '<div class="ds-stack" aria-hidden="true">' + bone('heading') + bone('lead') + bone() + bone('mid') + bone('short') + '</div>') +
    surface(pulse, 'Loading a picture', '<span class="ds-skeleton__media" aria-hidden="true"></span>') +
    surface(pulse, 'Loading a list', row() + row()) +
    surface(pulse, 'Loading a table', '<div class="ds-skeleton__table" aria-hidden="true"><div class="ds-skeleton__cells ds-skeleton__cells--head">' + bone('mid') + bone('short') + bone('short') + '</div><div class="ds-skeleton__cells">' + bone() + bone('mid') + bone('short') + '</div><div class="ds-skeleton__cells">' + bone('mid') + bone('mid') + bone('short') + '</div></div>') +
    surface(pulse, 'Loading a card', '<div class="ds-skeleton__card" aria-hidden="true">' + bone('title') + bone() + bone('short') + '</div>') +
    surface(pulse, 'Loading a form', '<div class="ds-skeleton__form" aria-hidden="true">' + bone('label') + '<span class="ds-skeleton__field"></span>' + bone('label') + '<span class="ds-skeleton__field"></span></div>') +
    '</div>';
}

function page() {
  return surface(false, 'Loading the page', '<span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span><span class="ds-skeleton__line ds-skeleton__line--lead" aria-hidden="true"></span><p class="ds-skeleton__note">Loading 3 of 12 reports</p>' +
    '<div class="ds-skeleton__card" aria-hidden="true">' + bone('title') + bone() + bone('short') + '</div>');
}

SG.demo('loading', {
  title: 'Loading',
  group: 'feedback',
  need: 'Hold the place of content that is loading: skeleton presets, a loading line and a page load bar',
  lead: 'Fast loads show nothing: indicators fade in after the loader delay and then stay long enough not to flicker. Their loops always run at their token speed.',
  options: { variants: ['wave', 'pulse'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Skeleton presets', presets(h.variant === 'pulse') + '<p class="ds-muted">Text and heading, media, list rows, a table, a card and a form. By default one calm wave passes over every bone at once; pick the pulse in the options panel and each bone breathes in place.</p>') +

      h.section('The loading line', '<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Loading more devices ...</div>' +
        '<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Importing devices<p class="ds-loading__detail">812 of 2,030 rows</p></div>') +

      h.section('A page\'s skeleton, then the page', '<div data-demo="page">' + page() + '</div><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="page-load">Load the page</button></div>' +
        '<p class="ds-muted">Loaded, the page replaces the skeleton with .ds-reveal.</p>') +

      h.section('Fast and slow loads', '<div data-demo="load-stage"><p class="ds-muted">Load the device list.</p></div>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="load" data-ms="150">Fast (150ms)</button><button class="ds-btn ds-sm" type="button" data-demo="load" data-ms="1200">Slow (1.2s)</button></div>' +
        '<p class="ds-muted">The loading line goes in at once but fades in only after the loader delay, so the fast load shows nothing. DS.motion.settleLoader keeps one that did show for at least the hold time.</p>') +

      h.section('Keyboard', '<p class="ds-muted">No stop of its own. The surface or line holds role="status" and the words; the bones say nothing.</p>');
  },

  wire: function (root, h) {
    var timers = [];
    var loaded = '<div class="ds-reveal"><h4>Devices</h4><p class="ds-muted">1,284 devices, 7 overdue for replacement.</p></div>';
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'page-load') {
        var holder = h.$('[data-demo="page"]', root);
        var showing = holder.querySelector('.ds-skeleton');
        DS.dom.morphHtml(holder, showing ? loaded : page(), { replace: true });
      }
      if (kind === 'load') {
        var stage = h.$('[data-demo="load-stage"]', root);
        var startedAt = Date.now();
        DS.dom.morphHtml(stage, '<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Loading devices ...</div>', { replace: true });
        timers.push(setTimeout(function () {
          DS.motion.settleLoader(startedAt, { element: h.$('.ds-loading', stage) }).then(function () {
            DS.dom.morphHtml(stage, '<p class="ds-reveal">1,284 devices loaded.</p>', { replace: true });
          });
        }, h.slow(Number(button.getAttribute('data-ms')))));
      }
    });
    return function () { timers.forEach(clearTimeout); };
  },
});
