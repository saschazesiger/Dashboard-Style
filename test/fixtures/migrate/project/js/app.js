/* The devices page: classic script on vendor/dashboard-style/ds.js. */
(function () {
  const ripple = DS.ripple.attach(document);
  DS.overlay.tooltips(document);

  const dialog = document.getElementById('add-device');
  document.querySelector('[data-open-dialog]').addEventListener('click', (event) => {
    DS.overlay.open(dialog, { opener: event.currentTarget });
  });
  dialog.addEventListener('click', (event) => {
    const close = event.target.closest('[data-close]');
    if (close && close.dataset.close !== 'keep') DS.overlay.close(dialog);
  });
  dialog.addEventListener('ds-close', (event) => {
    if (event.detail.reason === 'escape') console.info('closed with Escape');
  });

  const tabs = document.querySelector('.app-tabs');
  if (tabs) DS.indicator.createIndicator(tabs, { selector: '[aria-selected="true"]' });

  /** A status chip: the state comes from the backend (ok, warning, error). */
  function statusChip(state, label) {
    return `<span class="ds-status ds-status--${state}">${label}</span>`;
  }

  async function refresh(button) {
    const startedAt = performance.now();
    button.classList.add('ds-btn--sm');
    const rows = await fetch('/api/devices').then((response) => response.json());
    await DS.motion.settleLoader(startedAt, performance.now());
    for (const row of document.querySelectorAll('.ds-table--dense tbody tr')) {
      row.querySelector('.ds-badge').classList.toggle('ds-badge--ok', rows.length > 0);
    }
    DS.overlay.toast(document.querySelector('.ds-toasts'), statusChip('ok', 'Refreshed'));
  }

  document.getElementById('refresh').addEventListener('click', (event) => refresh(event.currentTarget));

  window.addEventListener('pagehide', () => ripple.detach());
})();
