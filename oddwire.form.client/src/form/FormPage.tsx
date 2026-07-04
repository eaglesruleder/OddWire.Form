import { useContext, useEffect, useReducer, useState } from 'react';
import Form from 'react-bootstrap/Form';

import { FormContext, InstanceContext, InstanceEntity } from '../_context';
import type { FormDefinition, InstanceChange } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlError } from '../_components/controllist';

const SELECTED_FORM_ID = 'demo-form';
const SELECTED_INSTANCE_ID = 'demo-instance-1';

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance, set } = useContext(InstanceContext);

    const formId = SELECTED_FORM_ID;
    const instanceId = SELECTED_INSTANCE_ID;

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<InstanceEntity | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    useEffect(() =>
    {
        let active = true;

        const formPromise = getForm(formId).then(loaded => { if (active && loaded) setForm(loaded); });

        const instancePromise = instanceId
        ?   getInstance(instanceId).then(loaded => { if (active && loaded) setInstance(InstanceEntity.from(loaded)); })
        :   Promise.resolve().then(() => { if (active) setInstance(InstanceEntity.from({ controls: [] })); });

        Promise.all([formPromise, instancePromise]).then(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [getForm, getInstance, formId, instanceId]);

    const onChange: InstanceChange = (value, param, key = 'value') =>
    {
        if (!instance)
            return;

        instance.setValue(param, key, value);
        set(instance.instance, instanceId);
        bumpRender();
    };

    const errorPage = (message: string) =>
        <StripLayout title="OddWire Forms">
            <Form>
                <ControlError>{message}</ControlError>
            </Form>
        </StripLayout>;

    if (loading)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading…</div>
            </StripLayout>
            );

    if (!form)
        return errorPage(formId ? 'Form Not Found' : 'No Form Requested');

    if (!instance && instanceId)
        return errorPage('Instance Not Found');

    if (!instance)
        return null;

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <Form>
                <ControlList controls={form.controls} instance={instance} onChange={onChange} />
            </Form>
        </StripLayout>
        );
}
