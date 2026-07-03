import { useContext, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';

import { FormContext } from '../_context';
import type { FormDefinition } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList } from '../_components/controllist';

// No landing-page selection yet (Stage 4); the id is fixed and getForm ignores it for now.
const SELECTED_FORM_ID = 'demo-form';

export function FormPage()
{
    const { getForm } = useContext(FormContext);

    const [form, setForm] = useState<FormDefinition | null>(null);
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() =>
    {
        let active = true;

        getForm(SELECTED_FORM_ID).then(loaded =>
        {
            if (active)
                setForm(loaded);
        });

        return () => { active = false; };
    }, [getForm]);

    const handleChange = (value: unknown, param: string) => setValues(prev => ({ ...prev, [param]: value }));

    if (!form)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading form…</div>
            </StripLayout>
            );

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <Form>
                <ControlList controls={form.controls} values={values} onChange={handleChange} />
            </Form>
        </StripLayout>
        );
}
