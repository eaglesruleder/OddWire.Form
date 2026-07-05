import { useContext, useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Form from 'react-bootstrap/Form';

import type { FormDefinition, InstanceChange } from '../_context';

import { FormContext, InstanceContext, InstanceEntity } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlError } from '../_components/controllist';

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance, save } = useContext(InstanceContext);
    const navigate = useNavigate();

    const { formId = '', instanceId } = useParams();

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<InstanceEntity | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    useEffect(() =>
    {
        let active = true;

        const formPromise = getForm(formId).then(loaded => { if (active) setForm(loaded ?? null); });

        const instancePromise = resolveInstance();

        Promise.all([formPromise, instancePromise]).then(() => { if (active) setLoading(false); });

        return () => { active = false; };

        //#region resolve instance — existing by id, or a fresh saved instance when the id is absent
        async function resolveInstance()
        {
            if (!instanceId)
            {
                const fresh = InstanceEntity.from({ formId, controls: [] });
                await save(fresh.instance);

                if (!active)
                    return;

                setInstance(fresh);
                navigate(`/form/${formId}/${fresh.instanceId}`, { replace: true });
                return;
            }

            const loaded = await getInstance(instanceId);
            if (active)
                setInstance(loaded ? InstanceEntity.from(loaded) : null);
        }
        //#endregion
    }, [getForm, getInstance, save, navigate, formId, instanceId]);

    const onChange: InstanceChange = (value, key, subkey = 'value') =>
    {
        if (!instance)
            return;

        instance.setValue(key, subkey, value);
        void save(instance.instance);

        bumpRender();
    };

    const errorPage = (message: string) =>
        <StripLayout left="←" leftLink="/" title="OddWire Forms">
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
        return errorPage('Form Not Found');

    if (!instance)
        return errorPage('Instance Not Found');

    return (
        <StripLayout left="←" leftLink="/" title={form.label ?? 'OddWire Forms'}>
            <Form>
                <ControlList controls={form.controls} instance={instance} onChange={onChange} />
                <div className="text-muted mt-3">autosaving</div>
            </Form>
        </StripLayout>
        );
}
