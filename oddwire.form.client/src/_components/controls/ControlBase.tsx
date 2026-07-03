import type { ReactNode } from 'react';

// Shared label+field skeleton for editable controls. Composes flex keyword utilities instead of
// a bespoke row class. stacked = label above (column); default = label-left / field-fills-right.
// stack-sm makes it stack on very-slim screens. (ControlCheckbox and ControlText don't use this.)
type ControlBaseProps = {
  param: string;
  label?: string;
  stacked?: boolean;
  className?: string;
  children: ReactNode;
};

export function ControlBase({ param, label, stacked, className, children }: ControlBaseProps) {
  const rowClass = ['flex', stacked ? 'column' : 'items-center', 'gap', 'mb-3', 'stack-sm', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClass}>
      {label && <label className="control-label" htmlFor={param}>{label}</label>}
      <div className="fill">{children}</div>
    </div>
  );
}
