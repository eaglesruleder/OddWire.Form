import type { CoreControlProps } from './controlTypes';

// Display-only. Shows label, falling back to value. Never emits onChange.
export function ControlLabel({ label, value, hidden }: CoreControlProps<string>) {
  if (hidden)
    return null;

  return <div className="semibold mb-2">{label ?? value}</div>;
}
