import Form from 'react-bootstrap/Form';
import type { CoreControlProps, KeyboardType, TextValueType } from './controlTypes';

type ControlTextProps = CoreControlProps<string> & {
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

// Single-line input. MVP stores the raw string — no parse/normalise yet, so typing stays natural.
export function ControlText({ param, label, value, hidden, onChange, valueType = 'text', keyboardType }: ControlTextProps) {
  if (hidden)
    return null;

  const inputMode = keyboardType ?? keyboardForValueType[valueType];

  return (
    <Form.Group className="mb-3" controlId={param}>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        type="text"
        inputMode={inputMode}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value, param)}
      />
    </Form.Group>
  );
}
