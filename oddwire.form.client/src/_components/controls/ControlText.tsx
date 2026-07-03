import { ControlBase } from './ControlBase';
import type { CoreControlProps } from './controlTypes';

type ControlTextProps = CoreControlProps<string> & {
  className?: string; // passed to the row, e.g. "debug-panel"
};

// Static, read-only text: label in the base's label slot, value shown as read-only text.
// (The editable single-line input is ControlTextField.)
export function ControlText({ param, label, value, hidden, stacked, className }: ControlTextProps) {
  if (hidden)
    return null;

  return (
    <ControlBase param={param} label={label} stacked={stacked} className={className}>
      <div className="control-static">{value}</div>
    </ControlBase>
  );
}
