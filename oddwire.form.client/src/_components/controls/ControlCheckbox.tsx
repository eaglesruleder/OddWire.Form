import Form from 'react-bootstrap/Form';

import type { CoreControlProps } from './controlTypes';

export function ControlCheckbox({ param, label, value, hidden, onChange }: CoreControlProps<boolean>)
{
    if (hidden)
        return null;

    return (
        <div className="flex items-center gap mb-3">
            {label &&
            <label className="fill" htmlFor={param}>{label}</label>
            }
            <Form.Check
                id={param}
                type="checkbox"
                checked={value ?? false}
                onChange={e => onChange?.(e.target.checked, param)}
            />
        </div>
        );
}
