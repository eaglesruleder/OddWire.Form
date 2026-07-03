import Form from 'react-bootstrap/Form';
import { ControlBase } from './ControlBase';
import type { ControlOption, CoreControlProps } from './controlTypes';

// Static select. Same option model as ControlRadio.
type ControlDropdownProps = CoreControlProps<string> & {
  controls?: ControlOption[];
};

export function ControlDropdown({ param, label, value, hidden, stacked, onChange, controls = [] }: ControlDropdownProps) {
  if (hidden)
    return null;

  return (
    <ControlBase param={param} label={label} stacked={stacked}>
      <Form.Select id={param} value={value ?? ''} onChange={e => onChange?.(e.target.value, param)}>
        <option value="" disabled>Select…</option>
        {controls.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Form.Select>
    </ControlBase>
  );
}
