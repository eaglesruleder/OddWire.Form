import { useContext, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';

import { FormContext, InstanceContext } from '../_context';
import type { FormDefinition, FormActiveInstance } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList } from '../_components/controllist';

const SELECTED_FORM_ID = 'demo-form';
const SELECTED_INSTANCE_ID = 'demo-instance-1';

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance } = useContext(InstanceContext);

    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<FormActiveInstance | null>(null);

    useEffect(() =>
    {
        let active = true;

        getForm(SELECTED_FORM_ID).then(loaded =>
        {
            if (active)
                setForm(loaded);
        });

        getInstance(SELECTED_INSTANCE_ID).then(loaded =>
        {
            if (active)
                setInstance(loaded);
        });

        return () => { active = false; };
    }, [getForm, getInstance]);

    const handleChange = (value: unknown, param: string) =>
        setInstance(prev => prev && prev.patch(param, value));

    if (!form || !instance)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading form…</div>
            </StripLayout>
            );

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <Form>
                <ControlList controls={form.controls} instance={instance} onChange={handleChange} />
            </Form>
        </StripLayout>
        );
}
