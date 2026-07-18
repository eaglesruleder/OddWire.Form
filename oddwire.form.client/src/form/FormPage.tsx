import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

import type { FormDefinition, InstanceChange, ParamList } from '../_context';
import type { ControlDef, TabSection } from '../_components/controllist';

import { FormContext, InstanceContext, LookupContext, InstanceEntity } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlTab, ControlError, ControlButton, DbContext, resolveLabel } from '../_components/controllist';
import { flattenInstance } from '../export';

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
    const [actionsOpen, setActionsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string>();
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
            return undefined;

        // Intent: hard save writes immediately — drop any pending debounced write so it doesn't fire a stale duplicate
        instance.cancelPersist();
        const id = await save(instance.instance);
        setAutosaving(true);

        if (!instanceId)
            navigate(`/form/${formId}/${id}`, { replace: true });

        return id;
    };

    const onHeaderAction = () =>
    {
        if (form?.export)
        {
            setActionsOpen(true);
            return;
        }

        if (autosaving)
        {
            setToastMessage('Autosaving enabled');
            return;
        }

        void onSave();
    };

    const onExportApi = async () =>
    {
        if (!form || !instance)
            return;

        const url = exportApiUrl(form);
        if (!url)
            return;

        setExporting(true);

        try
        {
            instance.flush();

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flattenInstance(form, instance)),
                });

            if (!response.ok)
                throw new Error(`Export failed (${response.status})`);

            setToastMessage('Exported');
        }
        catch (error)
        {
            setToastMessage(error instanceof Error ? error.message : 'Export failed');
        }
        finally
        {
            setExporting(false);
        }
    };

    const onExportPdf = async () =>
    {
        if (!form || !instance)
            return;

        if (!exportPdfEnabled(form))
            return;

        setExporting(true);

        try
        {
            instance.cancelPersist();
            const id = await save(instance.instance);
            setAutosaving(true);
            setActionsOpen(false);
            navigate(`/export-pdf/${formId}/${id}`);
        }
        catch (error)
        {
            setToastMessage(error instanceof Error ? error.message : 'PDF export failed');
        }
        finally
        {
            setExporting(false);
        }
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

    const backLink = landingBackLink(formId, form.groupParam, instance);

    const exportUrl = exportApiUrl(form);
    const hasPdfExport = exportPdfEnabled(form);
    const hasExport = !!form.export;

    const actionsIcon =
        <button
            type="button"
            className="strip-btn"
            onClick={onHeaderAction}
            title={hasExport ? 'Export' : autosaving ? 'Autosaving' : 'Save'}
        >{hasExport ? '...' : '💾'}</button>;

    const isRootTab = form.controls[0]?.type === 'tab';

    return (
        <StripLayout left="←" leftLink={backLink} right={actionsIcon} title={form.label ?? 'OddWire Forms'}>
            <DbContext.Provider value={getDb(formId)}>
                <Form>
                    {isRootTab
                    ?   <ControlTab pageLayout sections={buildRootTabSections(form.controls, instance)} instance={instance} onChange={onChange} />
                    :   <ControlList controls={form.controls} instance={instance} onChange={onChange} />
                    }
                </Form>
                {hasExport &&
                    <Modal show={actionsOpen} onHide={() => setActionsOpen(false)} centered dialogClassName="popup-dialog" contentClassName="popup-content">
                        <StripLayout
                            title="Export"
                            left={<button type="button" className="strip-btn" onClick={() => setActionsOpen(false)}>←</button>}
                        >
                            <div className="flex column gap">
                                {!autosaving
                                ?   <ControlButton label="Save" onClick={onSave} />
                                :   <div className="control-static">Autosaving</div>
                                }
                                {exportUrl &&
                                    <ControlButton label={exporting ? 'Exporting...' : 'Export API'} onClick={onExportApi} disabled={exporting} />
                                }
                                {hasPdfExport &&
                                    <ControlButton label={exporting ? 'Exporting...' : 'Export PDF'} onClick={onExportPdf} disabled={exporting} />
                                }
                            </div>
                        </StripLayout>
                    </Modal>
                }
                <ToastContainer position="bottom-center" className="p-3">
                    <Toast show={!!toastMessage} onClose={() => setToastMessage(undefined)} delay={1600} autohide>
                        <Toast.Body>{toastMessage}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </DbContext.Provider>
        </StripLayout>
        );
}

function exportApiUrl(form: FormDefinition): string | undefined
{
    return exportUrl(form, 'api');
}

function exportPdfEnabled(form: FormDefinition): boolean
{
    const value = form.export?.pdf;
    return value === true || (typeof value === 'object' && value.enabled !== false);
}

function exportUrl(form: FormDefinition, key: 'api'): string | undefined
{
    const config = form.export;
    if (!config)
        return undefined;

    const value = config[key];

    if (typeof value === 'string')
        return value;

    if (typeof value === 'object' && value.url)
        return value.url;

    return key === 'api' ? config.url : undefined;
}

function landingBackLink(formId: string, groupParam: ParamList | undefined, instance: InstanceEntity): string
{
    const params = new URLSearchParams({ FormID: formId });

    for (const param of paramList(groupParam))
    {
        const value = instance.get(param)?.value;

        if (value != null && value !== '')
            params.set(param, String(value));
    }

    return `/?${params.toString()}`;
}

function paramList(value: ParamList | undefined): string[]
{
    if (!value)
        return [];

    return Array.isArray(value) ? value : [value];
}
