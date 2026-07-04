import { useContext, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';

import { FormContext, InstanceEntity } from '../_context';
import type { FormDefinition } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList } from '../_components/controllist';

const SELECTED_FORM_ID = 'demo-form';
const SELECTED_INSTANCE_ID = 'demo-instance-1';

export function FormPage()
{
    const { getForm } = useContext(FormContext);

    const [form, setForm] = useState<FormDefinition | null>(null);

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

    if (!form)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading form…</div>
            </StripLayout>
            );

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <Form>
                <InstanceEntity instanceId={SELECTED_INSTANCE_ID}>
                    {(instance, onChange) =>
                        <ControlList controls={form.controls} instance={instance} onChange={onChange} />
                    }
                </InstanceEntity>
            </Form>
        </StripLayout>
        );
}
