import { useContext, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';

import { FormContext, InstanceContext, InstanceEntity } from '../_context';
import type { FormDefinition, FormInstance } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlError } from '../_components/controllist';

const SELECTED_FORM_ID = 'demo-form';
const SELECTED_INSTANCE_ID = 'demo-instance-1';

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance } = useContext(InstanceContext);

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<FormInstance | null>(null);

    useEffect(() =>
    {
        let active = true;

        const formPromise = getForm(SELECTED_FORM_ID).then(loaded => { if (active) setForm(loaded); });
        const instancePromise = getInstance(SELECTED_INSTANCE_ID).then(loaded => { if (active) setInstance(loaded); });

        Promise.all([formPromise, instancePromise]).then(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [getForm, getInstance]);

    if (loading)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading…</div>
            </StripLayout>
            );

    if (!form)
        return (
            <StripLayout title="OddWire Forms">
                <Form>
                    <ControlError>Form Not Found</ControlError>
                </Form>
            </StripLayout>
            );

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <Form>
                <InstanceEntity key={SELECTED_INSTANCE_ID} instanceId={SELECTED_INSTANCE_ID} instance={instance ?? { controls: [] }}>
                    {(entity, onChange) =>
                        <ControlList controls={form.controls} instance={entity} onChange={onChange} />
                    }
                </InstanceEntity>
            </Form>
        </StripLayout>
        );
}
