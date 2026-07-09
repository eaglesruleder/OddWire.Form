import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Form from 'react-bootstrap/Form';

import type { FormDefinition, InstanceChange } from '../_context';
import type { ControlDef, TabSection } from '../_components/controllist';

import { FormContext, InstanceContext, LookupContext, InstanceEntity } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlTab, ControlError, DbContext, resolveLabel } from '../_components/controllist';

function buildRootTabSections(controls: ControlDef[], instance: InstanceEntity): TabSection[]
{
    const sections: TabSection[] = controls
        .map(control => instance.resolve(control))
        .filter(control => control.type === 'tab' && !control.hidden)
        .map(tab => ({ param: tab.param, label: resolveLabel(tab.label, instance) ?? tab.param, controls: (tab as { controls: ControlDef[] }).controls }));

    const strays = controls
        .map(control => instance.resolve(control))
        .filter(control => control.type !== 'tab' && !control.hidden);
    if (strays.length > 0)
        sections.push({ param: '__unexpected', label: '⚠', controls: strays, notice: 'Unexpected controls in tab layout' });

    return sections;
}

export function FormPage()
{
    const { getForm } = useContext(FormContext);
    const { getInstance, save } = useContext(InstanceContext);
    const { get: getDb } = useContext(LookupContext);
    const navigate = useNavigate();

    const { formId = '', instanceId } = useParams();

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<InstanceEntity | null>(null);
    const [autosaving, setAutosaving] = useState(false);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const instanceRef = useRef<InstanceEntity | null>(null);
    instanceRef.current = instance;

    // Intent: the entity persists itself (debounced) but only once autosaving — read the live flag off a ref, not a stale closure
    const autosavingRef = useRef(autosaving);
    autosavingRef.current = autosaving;

    const attachPersist = (entity: InstanceEntity) =>
        entity.withPersist(body => { if (autosavingRef.current) void save(body); });

    useEffect(() =>
    {
        let active = true;

        const formPromise = getForm(formId).then(loaded => { if (active) setForm(loaded ?? null); });

        const instancePromise = resolveInstance();

        Promise.all([formPromise, instancePromise]).then(() => { if (active) setLoading(false); });

        // Intent: flush any pending debounced persist before this instance is replaced or the page unmounts
        return () => { active = false; instanceRef.current?.flush(); };

        async function resolveInstance()
        {
            if (!instanceId)
            {
                // Intent: do not persist on mount — a new instance stays in memory until the first hard save (autosaving gate)
                if (active)
                {
                    setInstance(attachPersist(InstanceEntity.from({ formId, controls: [] })));
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
                setInstance(loaded ? attachPersist(InstanceEntity.from(loaded)) : null);
                setAutosaving(!!loaded);
            }
        }
    }, [getForm, getInstance, formId, instanceId]);

    // Intent: apply + render now; the entity persists itself (debounced) so we don't save the whole instance per keystroke
    const onChange: InstanceChange = (value, key, subkey = 'value') =>
    {
        if (!instance)
            return;

        instance.setValue(key, subkey, value);
        bumpRender();
    };

    const onSave = async () =>
    {
        if (!instance)
            return;

        // Intent: hard save writes immediately — drop any pending debounced write so it doesn't fire a stale duplicate
        instance.cancelPersist();
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
            <DbContext.Provider value={getDb(formId)}>
                <Form>
                    {isRootTab
                    ?   <ControlTab pageLayout sections={buildRootTabSections(form.controls, instance)} instance={instance} onChange={onChange} />
                    :   <ControlList controls={form.controls} instance={instance} onChange={onChange} />
                    }
                </Form>
            </DbContext.Provider>
        </StripLayout>
        );
}
