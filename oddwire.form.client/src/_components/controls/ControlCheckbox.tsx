import Form from 'react-bootstrap/Form';
import type { CoreControlProps } from './controlTypes';

// Boolean input. Emits the checked state.
export function ControlCheckbox({ param, label, value, hidden, onChange }: CoreControlProps<boolean>) {
  if (hidden)
    return null;

  return (
    <Form.Check
      className="mb-3"
      type="checkbox"
      id={param}
      label={label}
      checked={value ?? false}
      onChange={e => onChange?.(e.target.checked, param)}
    />
  );
}
