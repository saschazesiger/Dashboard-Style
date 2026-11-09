// The tickets page: ES modules of the copy, imported one by one.
import { enter } from '../vendor/dashboard-style/js/motion.js';
import { createIndicator } from '../vendor/dashboard-style/js/indicator.js';
import { toast, confirm } from '../vendor/dashboard-style/js/overlay.js';

const plot = document.querySelector('.ds-columns__plot');
for (const bar of plot.querySelectorAll('.ds-columns__fill')) enter(bar, 'fill-y');

const tabs = document.querySelector('.app-tabs');
if (tabs) createIndicator(tabs, { selector: '[aria-current="page"]' });

export async function closeTicket(id, region) {
  if (!(await confirm({ title: `Close ticket ${id}?`, confirm: 'Close ticket' }))) return;
  toast(region, `Ticket ${id} is closed.`);
  const badge = document.querySelector(`[data-ticket="${id}"] .ds-badge`);
  badge.className = 'ds-badge ' + 'ds-badge--' + (id % 2 ? 'warning' : 'error');
}
