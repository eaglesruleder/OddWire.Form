import { useContext, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';

import { FormContext, InstanceContext, patchControlValue } from '../_context';
import type { FormDefinition, FormInstance } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList } from '../_components/controllist';

// No landing-page selection yet (Stage 4); ids are fixed and the getters ignore them for now.
const SELECTED_FORM_ID = 'demo-form';
const SELECTED_INSTANCE_ID = 'demo-instance-1';

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance } = useContext(InstanceContext);

    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<FormInstance | null>(null);

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
        setInstance(prev => prev && patchControlValue(prev, param, value));

    if (!form || !instance)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading form…</div>
            </StripLayout>
            );

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <Form>
                <ControlList controls={form.controls} instanceControls={instance.controls} onChange={handleChange} />
            </Form>
        </StripLayout>
        );
}
