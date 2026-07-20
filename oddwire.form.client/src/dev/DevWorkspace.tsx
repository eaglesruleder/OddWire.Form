import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';

import type { FormDefinition, InstanceChange, LookupContextValue } from '../_context';
import { FormContext, LookupContext, InstanceEntity } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlList, ControlTab, ControlError, DbContext, buildRootTabSections } from '../_components/controllist';
import { downloadBlob } from '../export/pdf/downloadBlob';

import './dev.css';

const PARSE_DEBOUNCE_MS = 300;

// Intent: a live form-authoring bench at /forms/dev — edit a form's JSON on the left, render it over a throwaway in-memory
// instance on the right, and download either the edited form definition or the filled instance. No install, no persistence,
// so a template can be iterated and re-exported without touching the localforage catalogue.
export function DevWorkspace()
{
    const { list, getForm } = useContext(FormContext);
    const { get: getDb } = useContext(LookupContext);

    const [text, setText] = useState('');
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [instance, setInstance] = useState<InstanceEntity>(() => freshInstance(''));
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const instanceFormId = useRef('');
    const parseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const installed = list();

    // Intent: reparse (debounced) whenever the editor text changes — a fresh formId rebuilds the throwaway instance so
    // switching forms starts clean, but edits to the same form keep the data you've been typing into the preview
    useEffect(() =>
    {
        if (parseTimer.current)
            clearTimeout(parseTimer.current);

        parseTimer.current = setTimeout(() =>
        {
            if (text.trim() === '')
            {
                setForm(null);
                setParseError(null);
                return;
            }

            try
            {
                const parsed = JSON.parse(text) as FormDefinition;
                setForm(parsed);
                setParseError(null);

                const formId = parsed.formId ?? '';
                if (formId !== instanceFormId.current)
                {
                    instanceFormId.current = formId;
                    setInstance(freshInstance(formId));
                }
            }
            catch (error)
            {
                // Intent: keep the last good form on screen — a half-typed edit shouldn't blank the preview
                setParseError(error instanceof Error ? error.message : 'Invalid JSON');
            }
        }, PARSE_DEBOUNCE_MS);

        return () => { if (parseTimer.current) clearTimeout(parseTimer.current); };
    }, [text]);

    const loadForm = async (formId: string) =>
    {
        if (!formId)
        {
            setText('');
            return;
        }

        const body = await getForm(formId);
        if (body)
            setText(JSON.stringify(body, null, 2));
    };

    const onChange: InstanceChange = (value, key, subkey = 'value') =>
    {
        instance.setValue(key, subkey, value);
        bumpRender();
    };

    const resetInstance = () =>
    {
        setInstance(freshInstance(instanceFormId.current));
        bumpRender();
    };

    const downloadForm = () =>
        downloadBlob(new Blob([text], { type: 'application/json' }), `${fileStem(form)}.form.json`);

    const downloadInstance = () =>
        downloadBlob(new Blob([JSON.stringify(instance.instance, null, 2)], { type: 'application/json' }), `${fileStem(form)}.instance.json`);

    return (
        <StripLayout left="←" leftLink="/" title="Form Dev Workspace">
            <div className="dev-workspace">
                <section className="dev-editor">
                    <div className="dev-toolbar">
                        <Form.Select size="sm" onChange={event => void loadForm(event.target.value)} defaultValue="">
                            <option value="">Load form…</option>
                            {installed.map(entry =>
                                <option key={entry.formId} value={entry.formId}>{entry.label ?? entry.formId}</option>
                                )}
                        </Form.Select>
                        <span className="fill" />
                        <button type="button" className="dev-btn" onClick={downloadForm} disabled={!form}>⬇ Form</button>
                        <button type="button" className="dev-btn" onClick={downloadInstance} disabled={!form}>⬇ Instance</button>
                        <button type="button" className="dev-btn" onClick={resetInstance} disabled={!form}>Reset</button>
                    </div>

                    <textarea
                        className="dev-json"
                        spellCheck={false}
                        value={text}
                        onChange={event => setText(event.target.value)}
                        placeholder="Paste or edit a form definition JSON here…"
                    />

                    {parseError && <div className="dev-error">⚠ {parseError}</div>}
                </section>

                <section className="dev-preview">
                    <DevPreview form={form} instance={instance} onChange={onChange} getDb={getDb} />
                </section>
            </div>
        </StripLayout>
        );
}

type DevPreviewProps = {
    form: FormDefinition | null;
    instance: InstanceEntity;
    onChange: InstanceChange;
    getDb: LookupContextValue['get'];
    };

// Intent: same render decision as FormPage — root-tab forms lay out as page footer tabs, everything else as a control list
function DevPreview({ form, instance, onChange, getDb }: DevPreviewProps)
{
    if (!form)
        return <ControlError>No form loaded</ControlError>;

    const isRootTab = form.controls[0]?.type === 'tab';

    return (
        <DbContext.Provider value={getDb(form.formId ?? '')}>
            <Form>
                {isRootTab
                ?   <ControlTab pageLayout sections={buildRootTabSections(form.controls, instance)} instance={instance} onChange={onChange} />
                :   <ControlList controls={form.controls} instance={instance} onChange={onChange} />
                }
            </Form>
        </DbContext.Provider>
        );
}

function freshInstance(formId: string): InstanceEntity
{
    // Intent: no withPersist — the dev instance lives only in memory; downloads are the only way it leaves the page
    return InstanceEntity.from({ formId, controls: [] });
}

function fileStem(form: FormDefinition | null): string
{
    return (form?.label ?? form?.formId ?? 'form').replace(/[^\w.-]+/g, '_');
}
