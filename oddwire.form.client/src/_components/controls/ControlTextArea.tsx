import Form from 'react-bootstrap/Form';
import { ControlBase } from './ControlBase';
import type { CoreControlProps } from './controlTypes';

// Multi-line input. Same value/onChange shape as ControlText.
export function ControlTextArea({ param, label, value, hidden, stacked, onChange }: CoreControlProps<string>) {
  if (hidden)
    return null;

  return (
    <ControlBase param={param} label={label} stacked={stacked}>
      <Form.Control
        id={param}
        as="textarea"
        rows={3}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value, param)}
      />
    </ControlBase>
  );
}
