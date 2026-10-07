import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

import type { DisplayParam, FormDefinition, FormInstance, InstanceChange, ParamList } from '../_context';

import { FormContext, InstanceContext, LookupContext, InstanceEntity, FormActionsContext, FormImageContext, PdfTemplateContext } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlTab, ControlError, ControlButton, DbContext, buildRootTabSections } from '../_components/controllist';
import { flattenInstance } from '../export';
import { downloadBlob } from '../export/pdf/downloadBlob';

export type FormSurfaceProps = {
    formId: string;
    instanceId?: string;
    // Intent: the runtime reports navigation; its host decides whether that is a router transition, a tab change, or nothing.
    onNavigate?: (path: string) => void;
    };

export type HostedFormSurfaceProps = {
    formId: string;
    // Intent: identity is host-owned only; hosted mode never interprets this as a local store key.
    instance: FormInstance;
    prependRootTabs?: HostedRootTab[];
    defaultRootTab?: string;
    };

export type HostedRootTab = {
    param: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
    };

export function FormSurface({ formId, instanceId, onNavigate }: FormSurfaceProps)
{
    const { getForm, deleteForm } = useContext(FormContext);
    const { getInstance, save } = useContext(InstanceContext);
    const { get: getDb } = useContext(LookupContext);
    const images = useContext(FormImageContext);
    const { deleteTemplate } = useContext(PdfTemplateContext);

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [instance, setInstance] = useState<InstanceEntity | null>(null);
    const [autosaving, setAutosaving] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string>();
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const instanceRef = useRef<InstanceEntity | null>(null);

    // Intent: the entity persists itself (debounced) but only once autosaving — read the live flag off a ref, not a stale closure
    const autosavingRef = useRef(autosaving);

    useEffect(() => { instanceRef.current = instance; }, [instance]);
    useEffect(() => { autosavingRef.current = autosaving; }, [autosaving]);

    const attachPersist = useCallback((entity: InstanceEntity) =>
        entity.withPersist(body => { if (autosavingRef.current) void save(body); }), [save]);

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
    }, [getForm, getInstance, formId, instanceId, attachPersist]);

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
            onNavigate?.(`/form/${formId}/${id}`);

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

    const onDeleteReadonlyForm = async () =>
    {
        if (!form)
            return;

        const label = form.label ?? form.formId;
        if (!window.confirm(`Delete "${label}"?`))
            return;

        try
        {
            const ownedImages = await images.imagesFor({ formId });

            await Promise.all(ownedImages.map(record => images.deleteImage(record.id)));
            await deleteTemplate(formId);
            await deleteForm(formId);
            onNavigate?.('/');
        }
        catch (error)
        {
            setToastMessage(error instanceof Error ? `Delete failed: ${error.message}` : 'Delete failed');
        }
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

    const onExportJson = () =>
    {
        if (!form || !instance)
            return;

        instance.flush();

        downloadBlob(
            new Blob([JSON.stringify(instance.instance, null, 2)], { type: 'application/json' }),
            `${instanceFileStem(form, instance)}.instance.json`);

        setActionsOpen(false);
        setToastMessage('JSON exported');
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
            onNavigate?.(`/export-pdf/${formId}/${id}`);
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
        <StripLayout left="←" leftAction={() => onNavigate?.('/')} title="OddWire Forms">
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

    const actionsIcon = form.readonly
    ?   <button
            type="button"
            className="strip-btn"
            onClick={() => void onDeleteReadonlyForm()}
            title="Delete"
            aria-label="Delete form"
        >🗑</button>
    :
        <button
            type="button"
            className="strip-btn"
            onClick={onHeaderAction}
            title={hasExport ? 'Export' : autosaving ? 'Autosaving' : 'Save'}
        >{hasExport ? '...' : '💾'}</button>;

    return (
        <StripLayout left="←" leftAction={() => onNavigate?.(backLink)} right={actionsIcon} title={form.label ?? 'OddWire Forms'}>
            <DbContext.Provider value={getDb(formId)}>
                <FormActionsContext.Provider value={{ requestSave: onSave, isSaved: autosaving }}>
                <Form>
                    <FormRenderer form={form} instance={instance} onChange={onChange} />
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
                                <ControlButton label="Export JSON" onClick={onExportJson} disabled={exporting} />
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
                </FormActionsContext.Provider>
            </DbContext.Provider>
        </StripLayout>
        );
}

// Host-owned snapshots deliberately bypass InstanceContext. The entity is a defensive clone used
// only for the renderer's param overlay lookup; read-only controls cannot mutate or persist it.
export function HostedFormSurface({ formId, instance, prependRootTabs = [], defaultRootTab }: HostedFormSurfaceProps)
{
    const { getForm } = useContext(FormContext);
    const { get: getDb } = useContext(LookupContext);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormDefinition | null>(null);

    const hosted = useMemo(() =>
        InstanceEntity.from(
            { ...instance
            ,formId: instance.formId ?? formId
            ,controls: instance.controls.map(control => ({ ...control }))
            }),
        [formId, instance]);

    useEffect(() =>
    {
        let active = true;

        void getForm(formId).then(loaded =>
        {
            if (active)
            {
                setForm(loaded ?? null);
                setLoading(false);
            }
        });

        return () => { active = false; };
    }, [getForm, formId]);

    if (loading)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Loading…</div>
            </StripLayout>
            );

    if (!form)
        return (
            <StripLayout title="OddWire Forms">
                <Form><ControlError>Form Not Found</ControlError></Form>
            </StripLayout>
            );

    return (
        <StripLayout title={form.label ?? 'OddWire Forms'}>
            <DbContext.Provider value={getDb(formId)}>
                <FormActionsContext.Provider value={hostedActions}>
                    <Form>
                        <FormRenderer form={form} instance={hosted} onChange={ignoreHostedChange} readonly prependRootTabs={prependRootTabs} defaultRootTab={defaultRootTab} />
                    </Form>
                </FormActionsContext.Provider>
            </DbContext.Provider>
        </StripLayout>
        );
}

type FormRendererProps = {
    form: FormDefinition;
    instance: InstanceEntity;
    onChange: InstanceChange;
    readonly?: boolean;
    prependRootTabs?: HostedRootTab[];
    defaultRootTab?: string;
    };

function FormRenderer({ form, instance, onChange, readonly = false, prependRootTabs = [], defaultRootTab }: FormRendererProps)
{
    const isRootTab = form.controls[0]?.type === 'tab';

    return isRootTab
    ?   <ControlTab pageLayout sections={[...prependRootTabs, ...buildRootTabSections(form.controls, instance)]} defaultParam={defaultRootTab} instance={instance} onChange={onChange} readonly={readonly} />
    :   <ControlList controls={form.controls} instance={instance} onChange={onChange} readonly={readonly} />;
}

const hostedActions = { requestSave: async () => undefined, isSaved: false };
const ignoreHostedChange: InstanceChange = () => undefined;

// Intent: standalone routing remains a thin adapter. The persisted runtime and renderer live in FormSurface.
export function FormPage()
{
    const navigate = useNavigate();
    const { formId = '', instanceId } = useParams();

    return <FormSurface formId={formId} instanceId={instanceId} onNavigate={path => navigate(path)} />;
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

function fileStem(form: FormDefinition): string
{
    return cleanFileStem(form.label ?? form.formId ?? 'form');
}

function instanceFileStem(form: FormDefinition, instance: InstanceEntity): string
{
    return cleanFileStem(displayParamValue(form.displayParam, instance) ?? fileStem(form));
}

function displayParamValue(params: DisplayParam[] | undefined, instance: InstanceEntity): string | undefined
{
    const param = params?.[0];

    if (typeof param !== 'string')
        return undefined;

    const value = instance.get(param)?.value;
    const text = value == null ? '' : String(value).trim();

    return text || undefined;
}

function cleanFileStem(value: string): string
{
    return value.replace(/[^\w.-]+/g, '_');
}
