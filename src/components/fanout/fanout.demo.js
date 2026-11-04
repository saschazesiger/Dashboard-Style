SG.demo('fanout', {
  title: 'Fan-out probe',
  group: 'feedback',
  need: 'Prove that one folder is enough',
  options: { sizes: false, density: false, shape: true },
  render: function () { return '<div class="ds-fanout" data-ds-fanout data-demo="probe">Probe</div>'; },
});
