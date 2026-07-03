import Form from 'react-bootstrap/Form';
import type { ControlOption, CoreControlProps } from './controlTypes';

// Static select. Same option model as ControlRadio.
type ControlDropdownProps = CoreControlProps<string> & {
  controls?: ControlOption[];
};

export function ControlDropdown({ param, label, value, hidden, onChange, controls = [] }: ControlDropdownProps) {
  if (hidden)
    return null;

  return (
    <Form.Group className="mb-3" controlId={param}>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Select value={value ?? ''} onChange={e => onChange?.(e.target.value, param)}>
        <option value="" disabled>Select…</option>
        {controls.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}
