import Form from 'react-bootstrap/Form';
import { ControlBase } from './ControlBase';
import type { CoreControlProps, KeyboardType, TextValueType } from './controlTypes';

type ControlTextFieldProps = CoreControlProps<string> & {
  valueType?: TextValueType;   // semantic meaning of the value
  keyboardType?: KeyboardType; // UI hint only — overrides the valueType-derived keyboard
};

// Default on-screen keyboard per semantic type. keyboardType wins if given.
const keyboardForValueType: Record<TextValueType, KeyboardType> = {
  text: 'text',
  int: 'numeric',
  decimal: 'decimal',
  email: 'email',
  phone: 'tel',
};

// Single-line editable input. MVP stores the raw string — no parse/normalise yet, so typing stays natural.
export function ControlTextField({ param, label, value, hidden, stacked, onChange, valueType = 'text', keyboardType }: ControlTextFieldProps) {
  if (hidden)
    return null;

  const inputMode = keyboardType ?? keyboardForValueType[valueType];

  return (
    <ControlBase param={param} label={label} stacked={stacked}>
      <Form.Control
        id={param}
        type="text"
        inputMode={inputMode}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value, param)}
      />
    </ControlBase>
  );
}
