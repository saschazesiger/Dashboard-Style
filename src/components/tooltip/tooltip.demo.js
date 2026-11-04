/*
 * The Tooltip demo: icon buttons along a toolbar (the warm-up), the shortcut
 * slot, a blocked control that says why, a tip that shows only while its text
 * is cut off. Everything comes from the system: [data-tip] and DS.init().
 */
SG.demo('tooltip', {
  title: 'Tooltip',
  group: 'overlays',
  need: 'Name an icon button or explain a control on hover and focus',
  lead: 'One tooltip serves the whole theme: on hover after a moment, on keyboard focus at once, on touch after a long press. The options panel changes its shape; size, density and tone do not apply.',
  options: { sizes: false, density: false, shape: true, tones: false },

  render: function (h) {
    return h.section('Along a toolbar', '<div class="sg-row" data-demo="toolbar" role="toolbar" aria-label="Device">' +
      [['pencil', 'Edit'], ['copy', 'Duplicate'], ['archive', 'Archive'], ['link', 'Copy link']].map(function (entry) {
        return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="' + entry[1] + '" data-tip="' + entry[1] + '">' + h.icon(entry[0], 20) + '</button>';
      }).join('') + '</div>', 'Rest on one: its tooltip comes after a moment. The next ones show at once and swap in place.') +

      h.section('With a shortcut', '<div class="sg-row"><button class="ds-btn" type="button" data-tip="Search the list" data-tip-shortcut="Ctrl K" data-demo="shortcut">' + h.icon('search', 16) + 'Search</button></div>') +

      h.section('States', '<div class="sg-row"><button class="ds-btn ds-btn--filled" type="button" aria-disabled="true" data-tip="Fill in the serial number first" data-demo="blocked">Publish</button>' +
        '<span role="img" aria-label="Online" data-tip="Online since 09:12" data-demo="image">' + h.icon('checkCircle', 20) + '</span></div>',
        'A blocked control says why: it keeps its focus, and a tap shows the tip.') +

      h.section('Only while cut off', '<div class="sg-row"><a href="#" style="display:block;max-inline-size:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" data-tip="LAPTOP-0042-FINANCE-BACKUP-WEST" data-demo="cut">LAPTOP-0042-FINANCE-BACKUP-WEST</a>' +
        '<a href="#" data-tip="LAPTOP-0042" data-demo="fits">LAPTOP-0042</a></div>',
        'A tip that repeats the text shows only while that text is cut off, and never describes the link.') +

      h.section('Keyboard', '<p class="ds-muted">Keyboard focus shows the tooltip at once, <kbd class="ds-kbd">Escape</kbd> hides it, and it never takes focus. While it shows, the trigger is described by it, unless its name says the same.</p>');
  },
});
