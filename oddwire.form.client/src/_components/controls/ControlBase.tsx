import type { ReactNode } from 'react';
import './ControlBase.css';

// Shared label+field skeleton every editable control renders through, so label placement
// and row spacing are tuned in one place. stacked = label above; default = label-left / field-fills-right.
type ControlBaseProps = {
  param: string;
  label?: string;
  stacked?: boolean;
  children: ReactNode;
};

export function ControlBase({ param, label, stacked, children }: ControlBaseProps) {
  return (
    <div className={stacked ? 'control-row stacked' : 'control-row'}>
      {label && <label className="control-label" htmlFor={param}>{label}</label>}
      <div className="control-field">{children}</div>
    </div>
  );
}
