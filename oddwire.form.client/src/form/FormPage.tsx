import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import './FormPage.css';
import { StripLayout } from '../_components/layout/StripLayout';
import { ControlLabel } from '../_components/controls/ControlLabel';
import { ControlText } from '../_components/controls/ControlText';
import { ControlTextArea } from '../_components/controls/ControlTextArea';
import { ControlCheckbox } from '../_components/controls/ControlCheckbox';
import { ControlRadio } from '../_components/controls/ControlRadio';
import { ControlDropdown } from '../_components/controls/ControlDropdown';

// Stage 1: hard-coded controls with local temp state. No JSON renderer, no instance merge —
// this only proves the control props + onChange contract before Stage 2 builds on it.
export function FormPage() {
  const [values, setValues] = useState<Record<string, unknown>>({
    fullName: 'Dillon O’Dwyer',
    email: '',
    age: '',
    bio: 'IT Coordinator and Software Developer',
    subscribed: true,
    status: 'open',
    priority: 'medium',
  });

  // Single root sink — every editable control reports here by param.
  const handleChange = (value: unknown, param: string) => {
    console.log(`onChange(${param})`, value);
    setValues(prev => ({ ...prev, [param]: value }));
  };

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <StripLayout title="OddWire Forms">
      <Form>
        <h2 className="section-title">Contact</h2>

      <ControlLabel param="intro" label="Fill in your details below." />

      <ControlText
        param="fullName"
        label="Full name"
        value={values.fullName as string}
        onChange={handleChange}
      />

      <ControlText
        param="email"
        label="Email"
        valueType="email"
        value={values.email as string}
        onChange={handleChange}
      />

      <ControlText
        param="age"
        label="Age"
        valueType="int"
        value={values.age as string}
        onChange={handleChange}
      />

      <ControlTextArea
        param="bio"
        label="Short bio"
        stacked
        value={values.bio as string}
        onChange={handleChange}
      />

      {/* Hidden control — proves hidden === true renders nothing. */}
      <ControlText param="secret" label="Should never appear" hidden value="hidden" onChange={handleChange} />

      <ControlCheckbox
        param="subscribed"
        label="Subscribe to updates"
        value={values.subscribed as boolean}
        onChange={handleChange}
      />

      <ControlRadio
        param="status"
        label="Status"
        controls={statusOptions}
        value={values.status as string}
        onChange={handleChange}
      />

      <ControlDropdown
        param="priority"
        label="Priority"
        controls={priorityOptions}
        value={values.priority as string}
        onChange={handleChange}
      />

      <section className="debug-panel">
        <h2>Live values</h2>
        <pre>{JSON.stringify(values, null, 2)}</pre>
      </section>
      </Form>
    </StripLayout>
  );
}
