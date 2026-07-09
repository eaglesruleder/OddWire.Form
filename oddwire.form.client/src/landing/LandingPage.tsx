import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import type { FormIndexEntry, InstanceIndexEntry, ParamList } from '../_context';

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

            <div className="d-flex flex-column gap-2">
                {forms.map(form =>
                    <div key={form.formId} className="d-flex flex-column gap-2">
                        <Button variant="outline-primary" onClick={() => toggle(form.formId)}>
                            {form.label ?? form.formId}
                            {form.version ? <span className="text-muted"> v{form.version}</span> : null}
                        </Button>

                        {expandedFormId === form.formId
                        ?   <InstanceList form={form} instances={listInstances(form.formId)} />
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

function InstanceList({ form, instances }: { form: FormIndexEntry; instances: InstanceIndexEntry[] })
{
    const filterParams = form.filterParam ?? [];
    const orderParams = paramList(form.orderParam);
    const groupParams = paramList(form.groupParam);

    const [filters, setFilters] = useState<Record<string, string>>({});
    const [orderStep, setOrderStep] = useState(0);
    const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});

    const filtered = instances.filter(instance =>
        filterParams.every(param => !filters[param] || valueText(instance.filter?.[param]) === filters[param]));
    const ordered = orderInstances(filtered, orderParams, orderStep);
    const groups = groupInstances(ordered, groupParams);

    const cycleOrder = () =>
        setOrderStep(step => (step + 1) % (orderParams.length * 2 + 1));

    const toggleGroup = (label: string) =>
        setGroupOpen(value => ({ ...value, [label]: !(value[label] ?? true) }));

    return (
        <div className="d-flex flex-column gap-2 ms-3 mb-3">
            {(filterParams.length > 0 || orderParams.length > 0) &&
            <div className="d-flex justify-content-end flex-wrap gap-2">
                {filterParams.map(param =>
                    <select
                        key={param}
                        className="form-select form-select-sm w-auto"
                        value={filters[param] ?? ''}
                        aria-label={paramLabel(param)}
                        onChange={event => setFilters(value => ({ ...value, [param]: event.target.value }))}
                    >
                        {filterOptions(instances, param).map(option =>
                            <option key={option} value={option}>
                                {option || `${paramLabel(param)}: All`}
                            </option>
                            )}
                    </select>
                    )}

                {orderParams.length > 0 &&
                <Button size="sm" variant={orderStep ? 'primary' : 'outline-primary'} onClick={cycleOrder}>
                    Order: {orderLabel(orderParams, orderStep)}
                </Button>
                }
            </div>
            }

            {groups.map(group =>
                groupParams.length > 0
                ?   <div key={group.label} className="d-flex flex-column gap-1">
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            className="d-flex justify-content-between align-items-center"
                            onClick={() => toggleGroup(group.label)}
                        >
                            <span>{groupOpen[group.label] ?? true ? '▾' : '▸'} {group.label}</span>
                            <span className="text-muted">{group.instances.length}</span>
                        </Button>

                        {(groupOpen[group.label] ?? true) &&
                        <InstanceLinks formId={form.formId} instances={group.instances} />
                        }
                    </div>
                :   <InstanceLinks key={group.label} formId={form.formId} instances={group.instances} />
                )}

            {ordered.length === 0 && instances.length > 0
            ?   <span className="text-muted">No instances match the current filters.</span>
            :   null}

            <Link to={`/form/${form.formId}`}>+ New instance</Link>
        </div>
        );
}

function InstanceLinks({ formId, instances }: { formId: string; instances: InstanceIndexEntry[] })
{
    return (
        <div className="d-flex flex-column gap-1 ms-3">
            {instances.map(instance =>
                <Link key={instance.instanceId} to={`/form/${formId}/${instance.instanceId}`}>
                    {displayLabel(instance.display)}
                    {instance.dateModified ? <span className="text-muted"> - {formatDate(instance.dateModified)}</span> : null}
                </Link>
                )}
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

function paramList(value: ParamList | undefined): string[]
{
    if (!value)
        return [];

    return Array.isArray(value) ? value : [value];
}

function valueText(value: unknown): string
{
    return value == null ? '' : String(value);
}

function paramLabel(param: string): string
{
    return param
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, ch => ch.toUpperCase());
}

function filterOptions(instances: InstanceIndexEntry[], param: string): string[]
{
    return [
        '',
        ...[...new Set(instances
            .map(instance => valueText(instance.filter?.[param]))
            .filter(Boolean))]
            .sort((a, b) => a.localeCompare(b))
    ];
}

function orderLabel(params: string[], step: number): string
{
    if (step === 0)
        return 'None';

    const index = Math.floor((step - 1) / 2);
    return `${paramLabel(params[index])} ${(step - 1) % 2 === 0 ? '↑' : '↓'}`;
}

function orderInstances(instances: InstanceIndexEntry[], params: string[], step: number): InstanceIndexEntry[]
{
    if (step === 0 || params.length === 0)
        return instances;

    const param = params[Math.floor((step - 1) / 2)];
    const direction = (step - 1) % 2 === 0 ? 1 : -1;

    return [...instances].sort((a, b) => direction * compareValues(orderValue(a, param), orderValue(b, param)));
}

function orderValue(instance: InstanceIndexEntry, param: string): unknown
{
    return instance.order?.[param] ?? instance.display[param] ?? instance.filter?.[param] ?? instance.group?.[param];
}

function compareValues(a: unknown, b: unknown): number
{
    const aText = valueText(a);
    const bText = valueText(b);
    const aNumber = numberValue(aText);
    const bNumber = numberValue(bText);

    if (aNumber !== undefined && bNumber !== undefined)
        return aNumber - bNumber;

    return aText.localeCompare(bText);
}

function numberValue(value: string): number | undefined
{
    const fraction = value.match(/^(\d+)\/(\d+)$/);
    if (fraction)
        return Number(fraction[1]) / Number(fraction[2]);

    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function groupInstances(instances: InstanceIndexEntry[], params: string[]): { label: string; instances: InstanceIndexEntry[] }[]
{
    if (params.length === 0)
        return [{ label: 'Instances', instances }];

    const byLabel = new Map<string, InstanceIndexEntry[]>();

    for (const instance of instances)
    {
        const label = params.map(param => valueText(instance.group?.[param])).filter(Boolean).join(' / ') || 'Ungrouped';
        byLabel.set(label, [...(byLabel.get(label) ?? []), instance]);
    }

    return [...byLabel.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, groupedInstances]) => ({ label, instances: groupedInstances }));
}
