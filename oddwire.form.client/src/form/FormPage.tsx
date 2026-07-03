import { useState } from 'react';
import Form from 'react-bootstrap/Form';

import { StripLayout } from '../_components/layout';
import {
    ControlText,
    ControlTextField,
    ControlTextArea,
    ControlCheckbox,
    ControlRadio,
    ControlDropdown,
} from '../_components/controls';

export function FormPage()
{
    const [values, setValues] = useState<Record<string, unknown>>(
        {fullName: 'Dillon O’Dwyer'
        ,email: ''
        ,age: ''
        ,bio: 'IT Coordinator and Software Developer'
        ,subscribed: true
        ,status: 'open'
        ,priority: 'medium'
        });

    const handleChange = (value: unknown, param: string) => setValues(prev => ({ ...prev, [param]: value }));

    const statusOptions =
        [{ value: 'open', label: 'Open' }
        ,{ value: 'closed', label: 'Closed' }
        ];

    const priorityOptions =
        [{ value: 'low', label: 'Low' }
        ,{ value: 'medium', label: 'Medium' }
        ,{ value: 'high', label: 'High' }
        ];

    return (
        <StripLayout title="OddWire Forms">
            <Form>
                <ControlText
                    param="section"
                    label="Contact"
                    value="Fill in your details below."
                />
                <ControlTextField
                    param="fullName"
                    label="Full name"
                    value={values.fullName as string}
                    onChange={handleChange}
                />
                <ControlTextField
                    param="email"
                    label="Email"
                    valueType="email"
                    value={values.email as string}
                    onChange={handleChange}
                />
                <ControlTextField
                    param="age"
                    label="Age"
                    valueType="int"
                    value={values.age as string}
                    onChange={handleChange}
                />
                <ControlTextArea
                    param="bio"
                    label="Short bio"
                    value={values.bio as string}
                    onChange={handleChange}
                />
                <ControlTextField
                    param="secret"
                    label="Should never appear"
                    value="hidden"
                    onChange={handleChange}
                    hidden
                />
                <ControlCheckbox
                    param="subscribed"
                    label="Subscribe to updates"
                    value={values.subscribed as boolean}
                    onChange={handleChange}
                />
                <ControlRadio
                    param="status"
                    label="Status"
                    value={values.status as string}
                    controls={statusOptions}
                    onChange={handleChange}
                />
                <ControlDropdown
                    param="priority"
                    label="Priority"
                    value={values.priority as string}
                    controls={priorityOptions}
                    onChange={handleChange}
                />
                <ControlText
                    param="debug"
                    label="Live values"
                    value={JSON.stringify(values, null, 2)}
                    className="bubble"
                />
            </Form>
        </StripLayout>
        );
}
