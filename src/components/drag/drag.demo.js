/*
 * The Drag and files demo: the file field, the drop zone in all its states,
 * the chosen files, and rows reordered by a grip. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the options
 * panel around it. Rendering the files and saving the order are what a project
 * writes itself; dropping and sorting are DS.dom.dropzone() and
 * DS.motion.sortable().
 */
function zone(h, attributes, inputAttributes, hint, inline) {
  return '<label class="ds-dropzone' + (inline ? ' ds-dropzone--inline' : '') + '"' + (attributes || '') + '>' +
    '<input class="ds-dropzone__input" type="file" accept=".csv" multiple' + (inputAttributes || '') + '>' +
    '<span class="ds-dropzone__disc" aria-hidden="true">' + h.icon('upload', inline ? 20 : 24) + '</span>' +
    '<span class="ds-dropzone__title"><span class="ds-dropzone__idle">Drop CSV files here or <span class="ds-dropzone__browse">browse</span></span><span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span></span>' +
    '<span class="ds-dropzone__hint">' + hint + '</span></label>';
}

var STEPS = ['Back up the database', 'Update the agents', 'Restart the gateways', 'Send the report'];

SG.demo('drag', {
  title: 'Drag and files',
  group: 'forms',
  need: 'Reorder rows by a grip, or drop files onto a zone',
  lead: 'A drop zone and a file field for files, a grip for rows. The options panel changes size, density, shape and touch around the demo.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var photo = h.uid('file');
    var locked = h.uid('file');
    var limit = h.uid('limit');
    return h.section('Drop zone', '<div class="ds-stack">' + zone(h, ' data-demo="zone"', '', 'Up to 10 MB each') + '<p class="ds-muted" data-demo="zone-out" aria-live="polite">No file chosen yet.</p></div>',
      'Drop, browse or paste. The zone is a label: Enter on its input opens the file dialog, and the ring shows on the zone.') +

      h.section('In one row', zone(h, '', '', 'Up to 10 MB each', true),
      'For a form where the full zone would take too much room.') +

      h.section('States', '<div class="ds-grid-2">' +
        zone(h, ' data-ds-dragover=""', '', 'Up to 10 MB each') +
        zone(h, '', ' aria-invalid="true" aria-describedby="' + limit + '"', '<span id="' + limit + '">report.csv is over the 10 MB limit</span>') +
        zone(h, '', ' disabled', 'Uploads are closed for this list') +
        '</div>', 'Files dragged over it (written by DS.dom.dropzone(), with the words of the drop state); a file over a limit, said in words; disabled through its input.') +

      h.section('The file field', '<div class="ds-form">' +
        '<div class="ds-field"><label class="ds-field__label" for="' + photo + '">Photo</label><input class="ds-input" type="file" id="' + photo + '" accept="image/*"></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="' + locked + '">Locked</label><input class="ds-input" type="file" id="' + locked + '" disabled></div></div>') +

      h.section('The chosen files', '<ul class="ds-list" aria-label="Chosen files" data-demo="files"></ul>',
      'The list is the page\'s: rows with a progress bar and a remove button, rendered through DS.motion.flip().') +

      h.section('Reorder rows', '<ul class="ds-plain-list" data-demo="rows" style="display: grid; gap: var(--ds-space-1);">' + STEPS.map(function (text, index) {
        return '<li data-ds-key="step-' + index + '" style="display: flex; align-items: center; gap: var(--ds-space-2); border-radius: var(--ds-radius-sm); background: var(--ds-surface);"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move ' + text + '">' + h.icon('grip', 20) + '</button><span>' + text + '</span></li>';
      }).join('') + '</ul><p class="ds-muted" data-demo="rows-out">Order: 1, 2, 3, 4</p>',
      'Drag the grip, or focus it and press the arrow keys.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the zone\'s input and each grip. On a grip, <kbd class="ds-kbd">ArrowUp</kbd> and <kbd class="ds-kbd">ArrowDown</kbd> move the row one place, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> to the start or the end; the grip keeps the focus, and each move is spoken. <kbd class="ds-kbd">Enter</kbd> on the zone opens the file dialog.</p>');
  },

  wire: function (root, h) {
    var list = h.$('[data-demo="files"]', root);
    var out = h.$('[data-demo="zone-out"]', root);
    var rows = h.$('[data-demo="rows"]', root);
    var rowsOut = h.$('[data-demo="rows-out"]', root);
    var files = [{ key: 'f1', name: 'devices.csv', share: 0.3 }, { key: 'f2', name: 'owners.csv', share: 1 }];
    var next = 3;

    function render() {
      DS.motion.flip(list, function () {
        DS.dom.morphHtml(list, files.map(function (file) {
          return '<li class="ds-list__item" data-ds-key="' + file.key + '">' + h.icon('fileText', 20, 'ds-list__icon') +
            '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(file.name) + '</span><span class="ds-list__meta">' + Math.round(file.share * 100) + '%</span></span>' +
            '<div class="ds-progress ds-progress--flat" style="--ds-progress: ' + file.share + '; flex: 0 1 160px; min-width: 80px;"><div class="ds-progress__track" role="progressbar" aria-label="Upload of ' + h.esc(file.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(file.share * 100) + '"><div class="ds-progress__bar"></div></div></div>' +
            '<span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove ' + h.esc(file.name) + '" data-remove="' + file.key + '">' + h.icon('close', 20) + '</button></span></li>';
        }).join(''));
      });
    }
    render();

    list.addEventListener('click', function (event) {
      var button = event.target.closest('[data-remove]');
      if (!button) return;
      files = files.filter(function (file) { return file.key !== button.getAttribute('data-remove'); });
      render();
    });

    var handles = [
      DS.dom.dropzone(h.$('[data-demo="zone"]', root), {
        paste: true,
        onFiles: function (added) {
          added.forEach(function (file) { files.push({ key: 'f' + (next++), name: file.name, share: 0 }); });
          out.textContent = 'Added ' + added.map(function (file) { return file.name; }).join(', ') + '.';
          render();
        },
      }),
      DS.motion.sortable(rows, {
        onChange: function (order) {
          rowsOut.textContent = 'Order: ' + order.map(function (row) { return Number(row.getAttribute('data-ds-key').slice(5)) + 1; }).join(', ');
        },
      }),
    ];
    return function () { handles.forEach(function (handle) { handle.destroy(); }); };
  },
});
