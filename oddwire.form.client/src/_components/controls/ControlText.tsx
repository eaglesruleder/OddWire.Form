import type { CoreControlProps } from './controlTypes';

type ControlTextProps = CoreControlProps<string> & {
  className?: string; // block style to opt into, e.g. "bubble"
};

// Static text control with its own layout (not ControlBase): the label renders as a separator
// heading, the value as a full-width text dump. Label-only = a separator; value = a page-wide dump.
export function ControlText({ label, value, hidden, className }: ControlTextProps) {
  if (hidden)
    return null;

  const wrapClass = ['mb-3', className].filter(Boolean).join(' ');

  return (
    <div className={wrapClass}>
      {label && <div className="separator">{label}</div>}
      {value && <div className="control-static">{value}</div>}
    </div>
  );
}
