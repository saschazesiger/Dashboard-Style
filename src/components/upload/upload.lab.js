/* A file upload's rows: files come in through DS.motion.flip (they fade in, the others glide), their bars glide to each share, a removed row fades out while the rest close the gap. */
SG_LAB.add({
  id: 'upload-rows',
  group: 'controls',
  title: 'File upload rows',
  note: '<code>DS.upload.create()</code>: added files fade in through <code>DS.motion.flip()</code>, the bar glides to each share on <code>--ds-ease-value</code>, Remove takes a row out while the others close the gap. Toggle adds and removes the second file.',
  shows: ['DS.upload.create', '.ds-upload', '.ds-upload__item', '.ds-upload__bar', 'DS.motion.flip', '--ds-ease-value'],
  html: '<div class="ds-upload" style="inline-size: min(100%, 520px)"><ul class="ds-list ds-upload__list" aria-label="Files" data-lab-list></ul></div>',
  height: 280,
  setup: function (stage) {
    var el = stage.querySelector('.ds-upload');
    stage.upload = DS.upload.create(el, {});
    stage.upload.set([{ id: 'lab-a', name: 'devices.csv', size: 48213, type: 'text/csv', status: 'done' }]);
  },
  play: function (stage) {
    var upload = stage.upload;
    var list = stage.querySelector('[data-lab-list]');
    var file = new File([new Uint8Array(2048)], 'inventory.csv', { type: 'text/csv' });
    return upload.add([file]).then(function (entries) {
      var id = entries[0].id;
      upload.progress(id, 0.35);
      return DS.motion.settled(list).then(function () {
        upload.progress(id, 1);
        upload.done(id);
        return DS.motion.settled(list);
      }).then(function () { return upload.remove(id); });
    });
  },
  toggle: function (stage, on) {
    var upload = stage.upload;
    var list = stage.querySelector('[data-lab-list]');
    stage.want = on;
    if (on && !stage.second) {
      stage.second = 'pending';
      return upload.add([new File([new Uint8Array(4096)], 'report.pdf', { type: 'application/pdf' })]).then(function (entries) {
        stage.second = entries[0] ? entries[0].id : null;
        // Turned off while it was being added: it goes again.
        if (stage.second && !stage.want) {
          var added = stage.second;
          stage.second = null;
          return upload.remove(added);
        }
        if (stage.second) upload.progress(stage.second, 0.6);
        return DS.motion.settled(list);
      });
    }
    if (!on && stage.second && stage.second !== 'pending') {
      var id = stage.second;
      stage.second = null;
      return upload.remove(id);
    }
    return DS.motion.settled(list);
  },
  state: function (stage) {
    return Boolean(stage.second);
  },
  reset: function (stage) {
    stage.second = null;
    stage.upload.set([{ id: 'lab-a', name: 'devices.csv', size: 48213, type: 'text/csv', status: 'done' }]);
  },
});
