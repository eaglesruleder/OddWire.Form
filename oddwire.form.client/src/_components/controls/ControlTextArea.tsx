import Form from 'react-bootstrap/Form';
import type { CoreControlProps } from './controlTypes';

// Multi-line input. Same value/onChange shape as ControlText.
export function ControlTextArea({ param, label, value, hidden, onChange }: CoreControlProps<string>) {
  if (hidden)
    return null;

  return (
    <Form.Group className="mb-3" controlId={param}>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        as="textarea"
        rows={3}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value, param)}
      />
    </Form.Group>
  );
}
