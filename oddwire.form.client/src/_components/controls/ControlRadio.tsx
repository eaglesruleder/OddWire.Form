import Form from 'react-bootstrap/Form';
import type { ControlOption, CoreControlProps } from './controlTypes';

// Static option select. Options come from `controls` for now (overloaded — revisited after the JSON renderer).
type ControlRadioProps = CoreControlProps<string> & {
  controls?: ControlOption[];
};

export function ControlRadio({ param, label, value, hidden, onChange, controls = [] }: ControlRadioProps) {
  if (hidden)
    return null;

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label className="d-block">{label}</Form.Label>}
      {controls.map(option => (
        <Form.Check
          key={option.value}
          inline
          type="radio"
          id={`${param}-${option.value}`}
          name={param}
          label={option.label}
          checked={value === option.value}
          onChange={() => onChange?.(option.value, param)}
        />
      ))}
    </Form.Group>
  );
}
