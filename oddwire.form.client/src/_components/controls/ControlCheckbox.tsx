import Form from 'react-bootstrap/Form';
import './ControlBase.css';
import type { CoreControlProps } from './controlTypes';

// Checkbox is the one control that doesn't use ControlBase: the label fills the left,
// and the box sits content-width on the right.
export function ControlCheckbox({ param, label, value, hidden, onChange }: CoreControlProps<boolean>) {
  if (hidden)
    return null;

  return (
    <div className="control-check">
      {label && <label className="control-label" htmlFor={param}>{label}</label>}
      <Form.Check
        id={param}
        type="checkbox"
        checked={value ?? false}
        onChange={e => onChange?.(e.target.checked, param)}
      />
    </div>
  );
}
