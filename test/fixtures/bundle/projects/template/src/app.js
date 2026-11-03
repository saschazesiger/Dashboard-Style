// A page rendered from template strings; the scan reads it as plain text.
export function row(device) {
  return `<li class="ds-chip ${device.selected ? 'ds-chip--selected' : ''}">
    ${device.name}
    <button class="ds-btn ds-btn--text" type="button">Remove</button>
  </li>`;
}

export function saved(region) {
  DS.overlay.toast(region, 'Saved');
  return DS.icons.icon(DS.icons.check, 16);
}
