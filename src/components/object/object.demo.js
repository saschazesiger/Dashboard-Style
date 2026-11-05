/*
 * The Object page demo: one device on one page, in a scrolling box: the
 * sticky head with its key facts and actions, the section anchors under it,
 * and three sections that turn into their forms, one by one or all at once.
 * Registered through SG.demo() (styleguide/sg-core.js). data-ds-object,
 * data-ds-page-head and data-ds-toc bring the behaviour; the page saves (here
 * a short wait, then done()) and writes the new values into the view.
 */
var FIELDS = {
  general: [['name', 'Name', 'LAPTOP-0042'], ['model', 'Model', 'Laptop 14'], ['serial', 'Serial', 'SN-7440-0042']],
  owner: [['owner', 'Owner', 'Ada Lovelace'], ['site', 'Site', 'Building B'], ['team', 'Team', 'Support']],
  network: [['address', 'Last address', '10.0.4.42'], ['network', 'Network', 'Office']],
};
var TITLES = { general: 'General', owner: 'Owner', network: 'Network' };

function section(h, ids, key) {
  var fields = FIELDS[key];
  var title = ids[key] + '-title';
  return '<section class="ds-card ds-object__section" id="' + ids[key] + '" aria-labelledby="' + title + '">' +
    '<div class="ds-object__head"><h4 class="ds-object__title" id="' + title + '">' + TITLES[key] + '</h4>' +
    '<button class="ds-btn ds-btn--text ds-sm ds-object__edit" type="button" data-ds-object-edit aria-describedby="' + title + '">' + h.icon('pencil', 18) + 'Edit</button></div>' +
    '<div class="ds-object__view"><dl class="ds-facts ds-facts--rows">' + fields.map(function (field) {
      return '<div><dt>' + field[1] + '</dt><dd data-field="' + field[0] + '">' + h.esc(field[2]) + '</dd></div>';
    }).join('') + '</dl></div>' +
    '<form class="ds-form ds-object__form" hidden novalidate><div class="ds-form-grid ds-form-grid--2">' + fields.map(function (field) {
      var id = h.uid('obj-' + field[0]);
      return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + field[1] + '</label><input class="ds-input" id="' + id + '" name="' + field[0] + '" value="' + h.esc(field[2]) + '" required></div>';
    }).join('') + '</div><div class="ds-form-actions"><button class="ds-btn" type="button" data-ds-object-cancel>Cancel</button><button class="ds-btn ds-btn--filled" type="submit">Save</button></div></form></section>';
}

var BOX = 'block-size: 560px; overflow-y: auto; border: 1px solid var(--ds-line); border-radius: calc(var(--ds-radius-md) * var(--ds-shape, 1)); padding: 0 var(--ds-space-4) var(--ds-space-6); background: var(--ds-backdrop);';

SG.demo('object', {
  title: 'Object page',
  group: 'navigation',
  need: 'Show one record on one page: a head with its key facts, section anchors, and an edit mode that turns sections into inline forms',
  lead: 'One device on one page. The head keeps its key facts and condenses on scroll, the anchors mark the section being read, and Edit turns a section (or, in the head, every section) into its form. Scroll inside the box.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var ids = { general: h.uid('obj-general'), owner: h.uid('obj-owner'), network: h.uid('obj-network') };
    var heading = h.uid('obj-title');
    return h.section('A device', '<div style="' + BOX + '" data-demo="box"><article class="ds-object" aria-labelledby="' + heading + '" data-ds-object>' +
        '<header class="ds-page-head ds-page-head--sticky" data-ds-page-head>' +
          '<a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="#">' + h.icon('arrowLeft', 18) + '<span class="ds-sr">Back to </span>Devices</a>' +
          '<div class="ds-page-head__row"><div class="ds-page-head__text"><h3 class="ds-page-head__title" id="' + heading + '" tabindex="-1">LAPTOP-0042</h3>' +
            '<div class="ds-page-head__status"><span class="ds-status ds-tone-success">' + h.icon('check', 16) + '<span>Synced</span></span></div></div>' +
            '<div class="ds-page-head__actions"><button class="ds-btn" type="button" data-ds-object-cancel hidden>Cancel</button>' +
            '<button class="ds-btn ds-btn--filled" type="button" data-ds-object-save hidden>Save all</button>' +
            '<button class="ds-btn ds-btn--filled" type="button" data-ds-object-edit>' + h.icon('pencil', 18) + 'Edit</button></div></div>' +
          '<dl class="ds-page-head__details"><div class="ds-page-head__detail"><dt>Owner</dt><dd>Ada Lovelace</dd></div><div class="ds-page-head__detail"><dt>Site</dt><dd>Building B</dd></div><div class="ds-page-head__detail"><dt>Last sync</dt><dd>Today, 09:12</dd></div><div class="ds-page-head__detail"><dt>Open tickets</dt><dd>2</dd></div></dl>' +
        '</header>' +
        '<nav class="ds-toc ds-toc--bar ds-toc--sticky" aria-label="Sections" data-ds-toc data-ds-toc-hash="off"><ol class="ds-toc__list">' +
          ['general', 'owner', 'network'].map(function (key) { return '<li><a class="ds-toc__link" href="#' + ids[key] + '">' + TITLES[key] + '</a></li>'; }).join('') + '</ol></nav>' +
        section(h, ids, 'general') + section(h, ids, 'owner') + section(h, ids, 'network') +
        '</article></div>',
        'Edit in a section turns that section into its form; Edit in the head turns all of them, and Save all and Cancel take its place. Save validates (every field is required here), the view comes back with the new values and a screen reader hears it.') +

      h.section('Keyboard', '<p class="ds-muted">Edit moves the focus to the first field; <kbd class="ds-kbd">Enter</kbd> in a field saves, <kbd class="ds-kbd">Escape</kbd> cancels, and the focus returns to the section\'s Edit. The anchors are links: <kbd class="ds-kbd">Enter</kbd> jumps to a section and moves the focus there.</p>');
  },

  wire: function (root, h) {
    // The page saves: a short wait as a server would take, then done(); the view shows the new values.
    root.addEventListener('ds:save', function (event) {
      var detail = event.detail;
      var article = event.target.closest('.ds-object');
      var record = DS.get(article, 'object');
      if (!record) return;
      event.preventDefault();
      var submit = h.$('[type="submit"]', detail.form);
      var wait = new Promise(function (resolve) { setTimeout(resolve, h.slow(400)); });
      DS.motion.busy(submit, wait).then(function () {
        Object.keys(detail.values).forEach(function (name) {
          var cell = h.$('[data-field="' + name + '"]', detail.section);
          if (cell) cell.textContent = detail.values[name];
        });
        detail.form.querySelectorAll('input').forEach(function (input) { input.defaultValue = input.value; });
        record.done(detail.section);
      });
    });
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href="#"]');
      if (link) event.preventDefault();
    });
  },
});
