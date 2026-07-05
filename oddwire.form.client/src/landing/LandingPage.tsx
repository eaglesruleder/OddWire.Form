import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import type { InstanceIndexEntry } from '../_context';
import { FormContext, InstanceContext } from '../_context';
import { StripLayout } from '../_components/layout';

export function LandingPage()
{
    const { list: listForms } = useContext(FormContext);
    const { list: listInstances } = useContext(InstanceContext);

    const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

    const forms = listForms();

    const toggle = (formId: string) =>
        setExpandedFormId(current => current === formId ? null : formId);

    return (
        <StripLayout left="⚙" leftLink="/settings" title="OddWire Forms">
            <div className="text-muted mb-3">Select a form</div>

            <div className="flex column gap">
                {forms.map(form =>
                    <div key={form.formId} className="flex column gap">
                        <Button variant="outline-primary" onClick={() => toggle(form.formId)}>
                            {form.label ?? form.formId}
                            {form.version ? <span className="text-muted"> v{form.version}</span> : null}
                        </Button>

                        {expandedFormId === form.formId
                        ?   <InstanceList formId={form.formId} instances={listInstances(form.formId)} />
                        :   null}
                    </div>
                    )}

                {forms.length === 0
                ?   <span className="text-muted">No forms available.</span>
                :   null}
            </div>
        </StripLayout>
        );
}

function InstanceList({ formId, instances }: { formId: string; instances: InstanceIndexEntry[] })
{
    return (
        <div className="flex column gap ms-3 mb-3">
            {instances.map(instance =>
                <Link key={instance.instanceId} to={`/form/${formId}/${instance.instanceId}`}>
                    {displayLabel(instance.display)}
                    {instance.dateModified ? <span className="text-muted"> — {formatDate(instance.dateModified)}</span> : null}
                </Link>
                )}

            <Link to={`/form/${formId}`}>+ New instance</Link>
        </div>
        );
}

function displayLabel(display: Record<string, unknown>): string
{
    const values = Object.values(display).filter(value => value !== undefined && value !== null && value !== '');
    return values.length ? values.join(' · ') : 'Untitled instance';
}

function formatDate(iso: string): string
{
    return new Date(iso).toLocaleString();
}
