import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Form from 'react-bootstrap/Form';

import type { FormDefinition, InstanceChange } from '../_context';
import type { ControlDef, TabSection } from '../_components/controllist';

import { FormContext, InstanceContext, InstanceEntity } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlTab, ControlError } from '../_components/controllist';

function buildRootTabSections(controls: ControlDef[]): TabSection[]
{
    const sections: TabSection[] = controls
        .filter(control => control.type === 'tab')
        .map(tab => ({ param: tab.param, label: tab.label ?? tab.param, controls: (tab as { controls: ControlDef[] }).controls }));

    const strays = controls.filter(control => control.type !== 'tab');
    if (strays.length > 0)
        sections.push({ param: '__unexpected', label: '⚠', controls: strays, notice: 'Unexpected controls in tab layout' });

    return sections;
}

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance, save } = useContext(InstanceContext);
    const navigate = useNavigate();

    const { formId = '', instanceId } = useParams();

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<InstanceEntity | null>(null);
    const [autosaving, setAutosaving] = useState(false);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    // latest instance, read (not depended on) by the effect to skip reloading one we already hold
    const instanceRef = useRef<InstanceEntity | null>(null);
    instanceRef.current = instance;

    useEffect(() =>
    {
        let active = true;

        const formPromise = getForm(formId).then(loaded => { if (active) setForm(loaded ?? null); });

        const instancePromise = resolveInstance();

        Promise.all([formPromise, instancePromise]).then(() => { if (active) setLoading(false); });

        return () => { active = false; };

        //#region resolve instance — existing by id (autosaves), or an unsaved fresh one when the id is absent
        async function resolveInstance()
        {
            if (!instanceId)
            {
                // Intent: do not persist on mount — a new instance stays in memory until the first hard save
                if (active)
                {
                    setInstance(InstanceEntity.from({ formId, controls: [] }));
                    setAutosaving(false);
                }
                return;
            }

            // Intent: already holding this instance (just saved + navigated) — keep it, skip the reload
            if (instanceRef.current?.instanceId === instanceId)
            {
                setAutosaving(true);
                return;
            }

            const loaded = await getInstance(instanceId);
            if (active)
            {
                setInstance(loaded ? InstanceEntity.from(loaded) : null);
                setAutosaving(!!loaded);
            }
        }
        //#endregion
    }, [getForm, getInstance, formId, instanceId]);

    const onChange: InstanceChange = (value, key, subkey = 'value') =>
    {
        if (!instance)
            return;

        instance.setValue(key, subkey, value);

        if (autosaving)
            void save(instance.instance);

        bumpRender();
    };

    const onSave = async () =>
    {
        if (!instance)
            return;

        const id = await save(instance.instance);
        setAutosaving(true);

        if (!instanceId)
            navigate(`/form/${formId}/${id}`, { replace: true });
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

    const saveIcon =
        <button
            type="button"
            className="strip-btn"
            onClick={onSave}
            disabled={autosaving}
            title={autosaving ? 'Autosaving' : 'Save'}
        >💾</button>;

    const isRootTab = form.controls[0]?.type === 'tab';

    return (
        <StripLayout left="←" leftLink="/" right={saveIcon} title={form.label ?? 'OddWire Forms'}>
            <Form>
                {isRootTab
                ?   <ControlTab variant="root" sections={buildRootTabSections(form.controls)} instance={instance} onChange={onChange} />
                :   <ControlList controls={form.controls} instance={instance} onChange={onChange} />
                }
            </Form>
        </StripLayout>
        );
}
