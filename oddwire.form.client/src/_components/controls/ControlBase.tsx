import type { ReactNode } from 'react';
import './ControlBase.css';

// Shared label+field skeleton every editable control renders through, so label placement
// and row spacing are tuned in one place. stacked = label above; default = label-left / field-fills-right.
// (ControlCheckbox is the exception — it uses its own wrapper.)
type ControlBaseProps = {
  param: string;
  label?: string;
  stacked?: boolean;
  className?: string;
  children: ReactNode;
};

export function ControlBase({ param, label, stacked, className, children }: ControlBaseProps) {
  const rowClass = ['control-row', stacked && 'stacked', className].filter(Boolean).join(' ');

  return (
    <div className={rowClass}>
      {label && <label className="control-label" htmlFor={param}>{label}</label>}
      <div className="control-field">{children}</div>
    </div>
  );
}
