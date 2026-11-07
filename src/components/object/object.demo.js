/*
 * The Object page demo: one device on one page, in a scrolling box: the
 * sticky head with its key facts and actions, the section anchors under it,
 * three sections that turn into their forms, one by one or all at once, and
 * a read-only history the edit mode leaves alone. Registered through
 * SG.demo() (styleguide/sg-core.js). data-ds-object, data-ds-page-head and
 * data-ds-toc bring the behaviour; the page validates (its forms are
 * novalidate: the system's error hints, not the browser's), saves (here a
 * short wait, then done()) and writes the new values into the view.
 */
var FIELDS = {
  general: [['name', 'Name', 'LAPTOP-0042'], ['model', 'Model', 'Laptop 14'], ['serial', 'Serial', 'SN-7440-0042']],
  owner: [['owner', 'Owner', 'Ada Lovelace'], ['site', 'Site', 'Building B'], ['team', 'Team', 'Support']],
  network: [['address', 'Last address', '10.0.4.42'], ['network', 'Network', 'Office']],
};
var TITLES = { general: 'General', owner: 'Owner', network: 'Network', history: 'History' };
var HISTORY = [['Today, 09:12', 'Synced'], ['Yesterday, 17:40', 'Assigned to Ada Lovelace'], ['3 May, 08:05', 'Enrolled']];

/** A section without a form: the edit mode leaves it as it is. */
function history(h, ids) {
  var title = ids.history + '-title';
  return '<section class="ds-card ds-object__section" id="' + ids.history + '" aria-labelledby="' + title + '">' +
    '<div class="ds-object__head"><h4 class="ds-object__title" id="' + title + '">' + TITLES.history + '</h4></div>' +
    '<div class="ds-object__view"><dl class="ds-facts ds-facts--rows">' + HISTORY.map(function (entry) {
      return '<div><dt>' + h.esc(entry[0]) + '</dt><dd>' + h.esc(entry[1]) + '</dd></div>';
    }).join('') + '</dl></div></section>';
}

/** The page's own validation: every field is required; an error is a hint with an icon and words (Form). */
function clearErrors(scope) {
  scope.querySelectorAll('[aria-invalid="true"]').forEach(function (input) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  });
  scope.querySelectorAll('[data-demo="error"]').forEach(function (hint) { hint.remove(); });
}

function showError(input) {
  var hint = document.createElement('small');
  hint.className = 'ds-field__hint ds-field__hint--error';
  hint.id = input.id + '-error';
  hint.setAttribute('data-demo', 'error');
  hint.append(DS.icons.iconElement(DS.icons.alertCircle, 16, '', document), document.createTextNode(DS.core.t('valueRequired')));
  input.closest('.ds-field').append(hint);
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', hint.id);
}

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
    var ids = { general: h.uid('obj-general'), owner: h.uid('obj-owner'), network: h.uid('obj-network'), history: h.uid('obj-history') };
    var heading = h.uid('obj-title');
    return h.section('A device', '<div style="' + BOX + '" data-demo="box"><div class="ds-object" data-ds-object>' +
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
          ['general', 'owner', 'network', 'history'].map(function (key) { return '<li><a class="ds-toc__link" href="#' + ids[key] + '">' + TITLES[key] + '</a></li>'; }).join('') + '</ol></nav>' +
        section(h, ids, 'general') + section(h, ids, 'owner') + section(h, ids, 'network') + history(h, ids) +
        '</div></div>',
        'Edit in a section turns that section into its form; Edit in the head turns all of them (History has no form and stays as it is), and Save all and Cancel take its place. Save validates (every field is required here: an empty one keeps its form open with an error), the view comes back with the new values and a screen reader hears it.') +

      h.section('Keyboard', '<p class="ds-muted">Edit moves the focus to the first field; <kbd class="ds-kbd">Enter</kbd> in a field saves, <kbd class="ds-kbd">Escape</kbd> cancels, and the focus returns to the section\'s Edit. The anchors are links: <kbd class="ds-kbd">Enter</kbd> jumps to a section and moves the focus there.</p>');
  },

  wire: function (root, h) {
    // The page validates, then saves: a short wait as a server would take, then done(); the view shows the new values.
    root.addEventListener('ds:save', function (event) {
      var detail = event.detail;
      var el = event.target.closest('.ds-object');
      var record = DS.get(el, 'object');
      if (!record) return;
      event.preventDefault();
      clearErrors(detail.form);
      var invalid = [].filter.call(detail.form.querySelectorAll('input'), function (input) { return !input.checkValidity(); });
      if (invalid.length) {
        invalid.forEach(showError);
        invalid[0].focus();
        return;
      }
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
    // A field that is filled again loses its error; a section that leaves its form loses them all.
    root.addEventListener('input', function (event) {
      var input = event.target;
      if (input.getAttribute('aria-invalid') === 'true' && input.checkValidity()) clearErrors(input.closest('.ds-field'));
    });
    root.addEventListener('ds:change', function (event) {
      if (!event.target.matches('.ds-object')) return;
      event.target.querySelectorAll('.ds-object__section:not([data-editing])').forEach(clearErrors);
    });
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href="#"]');
      if (link) event.preventDefault();
    });
  },
});
