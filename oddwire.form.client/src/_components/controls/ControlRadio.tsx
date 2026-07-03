import Form from 'react-bootstrap/Form';
import { ControlBase } from './ControlBase';
import type { ControlOption, CoreControlProps } from './controlTypes';

// Static option select. Options come from `controls` for now (overloaded — revisited after the JSON renderer).
type ControlRadioProps = CoreControlProps<string> & {
  controls?: ControlOption[];
};

export function ControlRadio({ param, label, value, hidden, stacked, onChange, controls = [] }: ControlRadioProps) {
  if (hidden)
    return null;

  return (
    <ControlBase param={param} label={label} stacked={stacked}>
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
    </ControlBase>
  );
}
