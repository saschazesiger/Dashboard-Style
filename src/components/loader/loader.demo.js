/*
 * The Shape loader demo: the loader, its contained variant and the two places
 * it stands in. Registered through SG.demo() (styleguide/sg-core.js). Size
 * comes from the options panel around it.
 */
SG.demo('loader', {
  title: 'Shape loader',
  group: 'feedback',
  need: 'Show that a whole region is loading, with a morphing shape',
  lead: 'The block loader for a section, a sheet or the app start: the shape morphs through the seven Material shapes while it turns. A few per view at most; inline spots keep the spinner.',
  options: { variants: ['contained'], sizes: true, density: false, shape: false, tones: false },

  render: function (h) {
    return h.section('Variants', '<div class="sg-row">' +
      (h.variant ? '' : '<span class="ds-loader" aria-hidden="true"></span>') +
      '<span class="ds-loader ds-loader--contained" aria-hidden="true"></span>' +
      '</div>') +

      h.section('Sizes', '<div class="sg-row"><span class="ds-loader ds-xs" aria-hidden="true"></span><span class="ds-loader ds-sm" aria-hidden="true"></span><span class="ds-loader ds-md" aria-hidden="true"></span><span class="ds-loader ds-lg" aria-hidden="true"></span><span class="ds-loader ds-xl" aria-hidden="true"></span></div>') +

      h.section('Where it stands', '<div class="ds-loading" role="status"><span class="ds-loader ds-sm" aria-hidden="true"></span>Loading more devices ...</div>' +
        '<div class="ds-boot" style="min-height:160px" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting the console ...</div>' +
        '<p class="ds-muted">In .ds-loading or .ds-boot the container waits its delay, so the loader has no fade of its own.</p>') +

      h.section('Keyboard', '<p class="ds-muted">None: it is decoration, aria-hidden, and the role="status" around it carries the words.</p>');
  },
});
