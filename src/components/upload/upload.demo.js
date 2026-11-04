/*
 * The File upload demo: rows with every status, a preview grid, the limits
 * with their errors, and a disabled upload. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. The fake upload (timers that report progress, a
 * file named "offline" that fails) is what a project writes itself with its
 * requests; checking, rows, previews and announcements are DS.upload.
 */
function uploadZone(h, accept, title, hint, attributes) {
  return '<label class="ds-dropzone">' +
    '<input class="ds-dropzone__input" type="file" accept="' + accept + '" multiple' + (attributes || '') + '>' +
    '<span class="ds-dropzone__disc" aria-hidden="true">' + h.icon('upload', 24) + '</span>' +
    '<span class="ds-dropzone__title"><span class="ds-dropzone__idle">' + title + ' or <span class="ds-dropzone__browse">browse</span></span><span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span></span>' +
    '<span class="ds-dropzone__hint">' + hint + '</span></label>';
}

/* A picture for the previews, drawn in the theme's chart colours. */
function picture(index, width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext('2d');
  // A role resolves to a colour only as a property value: read it back from a probe.
  var probe = document.createElement('span');
  (document.querySelector('.sg-demo-stage') || document.body).append(probe);
  var colour = function (name) {
    probe.style.color = 'var(' + name + ')';
    return getComputedStyle(probe).color;
  };
  context.fillStyle = colour('--ds-surface-high');
  context.fillRect(0, 0, width, height);
  context.fillStyle = colour(['--ds-chart-1', '--ds-chart-2', '--ds-chart-3', '--ds-chart-4'][index % 4]);
  context.fillRect(width * 0.18, height * 0.22, width * 0.64, height * 0.46);
  context.fillStyle = colour('--ds-text-2');
  context.fillRect(width * 0.12, height * 0.72, width * 0.76, height * 0.06);
  probe.remove();
  return new Promise(function (resolve) {
    canvas.toBlob(function (blob) { resolve(new File([blob], ['laptop-front.png', 'desk-setup.png', 'monitor-stand.png', 'docking-station.png'][index % 4], { type: 'image/png' })); }, 'image/png');
  });
}

/* The page's side: a fake request per entry that reports progress. */
function fakeUploads(root, h) {
  var timers = [];
  var send = function (el, entry) {
    var upload = DS.get(el, 'upload');
    var share = 0;
    var tick = function () {
      share += 0.25;
      if (/offline/i.test(entry.name) && share >= 0.5) { upload.fail(entry.id, 'The connection dropped.'); return; }
      if (share >= 1) { upload.done(entry.id); return; }
      upload.progress(entry.id, share);
      timers.push(setTimeout(tick, h.slow(450)));
    };
    timers.push(setTimeout(tick, h.slow(450)));
  };
  root.addEventListener('ds:files', function (event) {
    event.detail.entries.forEach(function (entry) { send(event.target, entry); });
  });
  root.addEventListener('ds:retry', function (event) {
    var entry = event.detail.entry;
    // A retry gets through: the name no longer fails.
    send(event.target, { id: entry.id, name: entry.name.replace(/offline/i, 'online') });
  });
  return function () { timers.forEach(clearTimeout); };
}

SG.demo('upload', {
  title: 'File upload',
  group: 'forms',
  need: 'Upload files: a drop zone, the files with their progress, retry and remove, previews, limits and smaller images',
  lead: 'Files by drop, the file dialog or paste, with their progress, retry and remove. Limits say in words what is wrong; pictures are made smaller in the browser before they go. The page uploads, DS.upload shows it.',
  options: { variants: ['list', 'grid'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var rows = h.section('Rows', '<div class="ds-upload" data-ds-upload data-ds-upload-max-size="10 MB" data-ds-upload-max-files="8" data-demo="rows">' +
        uploadZone(h, '.csv,.pdf,.xlsx,image/*', 'Drop files here', 'CSV, PDF, spreadsheets or pictures, up to 10 MB each, at most 8 files') +
        '<ul class="ds-list ds-upload__list" aria-label="Files"></ul></div>',
      'Every status: uploaded, uploading, waiting, failed with its reason and Retry. Add a file named "offline" to see one fail; Retry sends it again.');
    var grid = h.section('Previews', '<div class="ds-upload" data-ds-upload data-ds-upload-accept="image/*" data-ds-upload-max-files="6" data-ds-upload-resize="1600" data-demo="grid">' +
        uploadZone(h, 'image/*', 'Drop photos here', 'Pictures, at most 6; larger ones are made 1600px wide before they go') +
        '<ul class="ds-upload__grid" aria-label="Photos"></ul></div>',
      'A tile per file with its preview; Retry and Remove sit over the corner of the picture.');
    if (h.variant === 'list') return rows;
    if (h.variant === 'grid') return grid;
    return rows + grid +
      h.section('Limits', '<div class="ds-upload" data-ds-upload data-ds-upload-accept=".csv" data-ds-upload-max-size="1 kB" data-ds-upload-max-files="2" data-demo="limits">' +
        uploadZone(h, '.csv', 'Drop a CSV file here', 'CSV only, up to 1 kB, at most 2 files') +
        '<ul class="ds-list ds-upload__list" aria-label="Device lists"></ul></div>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="large">Add a large file</button><button class="ds-btn ds-sm" type="button" data-demo="type">Add a picture</button><button class="ds-btn ds-sm" type="button" data-demo="many">Add three files</button></div>',
      'A file over a limit is not added: the zone takes its error edge and the line under it says why, in words; a screen reader hears it at once.') +
      h.section('Disabled', '<div class="ds-upload" data-ds-upload>' + uploadZone(h, '.csv', 'Drop CSV files here', 'Uploads are closed for this list', ' disabled') + '</div>') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the zone, then each file\'s Retry and Remove. <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> on the zone opens the file dialog; files pasted while focus is inside the upload are added. Removing a file moves focus to the next one\'s Remove, else back to the zone.</p>');
  },

  wire: function (root, h) {
    // The controllers now, not at the observer's next batch: the demo fills them at once.
    DS.init(root);
    var stop = fakeUploads(root, h);
    var rows = h.$('[data-demo="rows"]', root);
    if (rows) {
      DS.get(rows, 'upload').set([
        { name: 'devices.csv', size: 48213, type: 'text/csv', status: 'done' },
        { name: 'inventory.xlsx', size: 2481920, type: 'application/vnd.ms-excel', status: 'uploading', progress: 0.45 },
        { name: 'report-november.pdf', size: 912384, type: 'application/pdf', status: 'queued' },
        { name: 'tickets-offline.csv', size: 18022, type: 'text/csv', status: 'error', error: 'The connection dropped.' },
      ]);
    }
    var grid = h.$('[data-demo="grid"]', root);
    if (grid) {
      Promise.all([0, 1, 2, 3].map(function (index) { return picture(index, 480, 360); })).then(function (files) {
        if (!grid.isConnected) return;
        var upload = DS.get(grid, 'upload');
        upload.set(files.map(function (file, index) {
          var entry = { file: file, status: 'done' };
          if (index === 1) { entry.status = 'uploading'; entry.progress = 0.6; }
          if (index === 2) { entry.status = 'queued'; }
          if (index === 3) { entry.status = 'error'; entry.error = 'The connection dropped.'; }
          return entry;
        }));
      });
    }
    var limits = h.$('[data-demo="limits"]', root);
    if (limits) {
      var upload = DS.get(limits, 'upload');
      var csv = function (name, size) { return new File([new Uint8Array(size)], name, { type: 'text/csv' }); };
      root.addEventListener('click', function (event) {
        var button = event.target.closest('[data-demo="large"], [data-demo="type"], [data-demo="many"]');
        if (!button) return;
        var kind = button.getAttribute('data-demo');
        if (kind === 'large') upload.add([csv('all-devices.csv', 48213)]);
        if (kind === 'type') upload.add([new File([new Uint8Array(64)], 'laptop.png', { type: 'image/png' })]);
        if (kind === 'many') upload.add([csv('room-a.csv', 210), csv('room-b.csv', 180), csv('room-c.csv', 240)]);
      });
    }
    return stop;
  },
});
