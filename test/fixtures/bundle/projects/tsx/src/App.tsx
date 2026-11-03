import { open } from 'dashboard-style/js/overlay.js';
import { check, icon } from 'dashboard-style/js/icons.js';

type Props = { kind: 'accent' | 'muted'; values: number[] };

export function Chart({ values }: Props) {
  return (
    <figure className="ds-chart">
      {values.map((value) => <div className="ds-chart__bar ds-chart__bar--accent" style={{ height: value }} />)}
      <span data-ds-icon="plus" />
      <span dangerouslySetInnerHTML={{ __html: icon(check) }} />
    </figure>
  );
}

export function Picker() {
  return <div className="ds-combo" onClick={(event) => open(event.currentTarget)} />;
}
