import Form from 'react-bootstrap/Form';
import { ControlBase } from './ControlBase';
import type { CoreControlProps } from './controlTypes';

// Boolean input. Label sits in the base's label slot; only the box lives in the field.
export function ControlCheckbox({ param, label, value, hidden, stacked, onChange }: CoreControlProps<boolean>) {
  if (hidden)
    return null;

  return (
    <ControlBase param={param} label={label} stacked={stacked}>
      <Form.Check
        id={param}
        type="checkbox"
        checked={value ?? false}
        onChange={e => onChange?.(e.target.checked, param)}
      />
    </ControlBase>
  );
}
