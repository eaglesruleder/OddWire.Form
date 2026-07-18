import { useContext, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import type { DisplayParam, FormIndexEntry, InstanceIndexEntry, ParamList } from '../_context';

import { FormContext, InstanceContext } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlDropdown } from '../_components/controllist/controls';
import { isCapturedImage, imageValueText } from '../_components/controllist';
import './landing.css';

export function LandingPage()
{
    const { list: listForms } = useContext(FormContext);
    const { list: listInstances } = useContext(InstanceContext);
    const [searchParams] = useSearchParams();

    const [expandedFormId, setExpandedFormId] = useState<string | null>(() => searchParams.get('FormID') ?? searchParams.get('formId'));

    const forms = listForms();
    const requestedForm = requestedFormId(forms, searchParams);

    useEffect(() =>
    {
        if (requestedForm)
            setExpandedFormId(requestedForm.formId);
    }, [requestedForm?.formId]);

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
                        ?   <InstanceList form={form} instances={listInstances(form.formId)} searchParams={searchParams} />
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

function requestedFormId(forms: FormIndexEntry[], searchParams: URLSearchParams): FormIndexEntry | undefined
{
    const requested = searchParams.get('FormID') ?? searchParams.get('formId');

    if (!requested)
        return undefined;

    return forms.find(form => form.formId === requested || form.label === requested);
}

function InstanceList({ form, instances, searchParams }: { form: FormIndexEntry; instances: InstanceIndexEntry[]; searchParams: URLSearchParams })
{
    const filterParams = form.filterParam ?? [];
    const orderParams = paramList(form.orderParam);
    const groupParams = paramList(form.groupParam);
    const routeGroupFilters = routeFilters(groupParams, searchParams);

    const [filters, setFilters] = useState<Record<string, string>>(() => routeFilters(filterParams, searchParams));
    const [orderStep, setOrderStep] = useState(0);
    const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});

    const filtered = instances.filter(instance =>
        filterParams.every(param => !filters[param] || valueText(instance.filter?.[param]) === filters[param]));
    const ordered = orderInstances(filtered, orderParams, orderStep);
    const groups = groupInstances(ordered, groupParams);

    const cycleOrder = () =>
        setOrderStep(step => (step + 1) % (orderParams.length * 2 + 1));

    const toggleGroup = (label: string) =>
        setGroupOpen(value => ({ ...value, [label]: !isGroupOpen(label, value, routeGroupFilters) }));

    return (
        <div className="d-flex flex-column gap-2 ms-3 mb-3">
            {(filterParams.length > 0 || orderParams.length > 0) &&
            <div className="d-flex justify-content-end flex-wrap gap-2">
                {filterParams.map(param =>
                    <ControlDropdown
                        key={param}
                        param={param}
                        value={filters[param] ?? ''}
                        stacked
                        label=""
                        placeholder={`${paramLabel(param)}: All`}
                        className="mb-0"
                        controls={filterOptions(instances, param).map(option =>
                            ({ value: option, label: option || `${paramLabel(param)}: All` }))}
                        onChange={value => setFilters(filters => ({ ...filters, [param]: String(value) }))}
                    />
                    )}

                {orderParams.length > 0 &&
                <Button size="sm" className="instance-order-button" variant={orderStep ? 'primary' : 'outline-primary'} onClick={cycleOrder}>
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
                            <span>{isGroupOpen(group.label, groupOpen, routeGroupFilters) ? '▾' : '▸'} {group.label}</span>
                            <span className="text-muted">{group.instances.length}</span>
                        </Button>

                        {(isGroupOpen(group.label, groupOpen, routeGroupFilters)) &&
                        <InstanceLinks form={form} instances={group.instances} />
                        }
                    </div>
                :   <InstanceLinks key={group.label} form={form} instances={group.instances} />
                )}

            {ordered.length === 0 && instances.length > 0
            ?   <span className="text-muted">No instances match the current filters.</span>
            :   null}

            <Link to={`/form/${form.formId}`}>+ New instance</Link>
        </div>
        );
}

function routeFilters(params: string[], searchParams: URLSearchParams): Record<string, string>
{
    const values: Record<string, string> = {};

    for (const param of params)
    {
        const value = searchParams.get(param);

        if (value)
            values[param] = value;
    }

    return values;
}

function isGroupOpen(label: string, groupOpen: Record<string, boolean>, routeGroupFilters: Record<string, string>): boolean
{
    if (label in groupOpen)
        return groupOpen[label];

    const routeLabel = Object.values(routeGroupFilters).filter(Boolean).join(' / ');
    return routeLabel !== '' && normaliseRouteValue(label) === normaliseRouteValue(routeLabel);
}

function InstanceLinks({ form, instances }: { form: FormIndexEntry; instances: InstanceIndexEntry[] })
{
    return (
        <div className="instance-list">
            {instances.map(instance =>
                <Link key={instance.instanceId} className="instance-row" to={`/form/${form.formId}/${instance.instanceId}`}>
                    <span className="instance-row-main">
                        <span className="instance-row-title">{displayTitle(instance, form.displayParam)}</span>
                        {instance.dateModified ? <span className="instance-row-subtitle">Edited {formatDate(instance.dateModified)}</span> : null}
                    </span>
                    <span className="instance-row-details">
                        {displayDetails(instance, form.displayParam).map(detail =>
                            detail.kind === 'break'
                            ?   <span key={detail.key} className="instance-row-break" />
                            :   <span key={detail.param} className="instance-row-detail">
                                    <span className="instance-row-detail-label">{detail.label}</span>
                                    <span>{detail.value}</span>
                                </span>
                            )}
                    </span>
                </Link>
                )}
        </div>
        );
}

type DisplayDetail =
    | { kind: 'break'; key: string }
    | { kind: 'field'; param: string; label: string; value: string };

function displayTitle(instance: InstanceIndexEntry, params: DisplayParam[] | undefined): string
{
    const orderedParams = displayParams(instance, params);
    const firstParam = orderedParams.find((param): param is string => typeof param === 'string');
    const firstValue = firstParam ? valueText(instance.display[firstParam]) : '';

    return firstValue || 'Untitled instance';
}

function displayDetails(instance: InstanceIndexEntry, params: DisplayParam[] | undefined): DisplayDetail[]
{
    const out: DisplayDetail[] = [];
    let skippedTitle = false;

    for (const param of displayParams(instance, params))
    {
        if (param === null)
        {
            if (skippedTitle)
                out.push({ kind: 'break', key: `break-${out.length}` });
            continue;
        }

        if (!skippedTitle)
        {
            skippedTitle = true;
            continue;
        }

        const field = instance.display[param];
        const value = valueText(field);

        if (value)
            out.push({ kind: 'field', param, label: projectionLabel(field) ?? paramLabel(param), value });
    }

    return trimBreaks(out);
}

function displayParams(instance: InstanceIndexEntry, params: DisplayParam[] | undefined): DisplayParam[]
{
    return params && params.length > 0 ? params : Object.keys(instance.display);
}

function trimBreaks(details: DisplayDetail[]): DisplayDetail[]
{
    while (details[0]?.kind === 'break')
        details.shift();

    while (details[details.length - 1]?.kind === 'break')
        details.pop();

    return details;
}

export function displayLabel(display: Record<string, unknown>): string
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
    const unwrapped = projectionValue(value);

    if (isCapturedImage(unwrapped))
        return imageValueText(unwrapped);

    return unwrapped == null ? '' : String(unwrapped);
}

function normaliseRouteValue(value: string): string
{
    return value.trim().toLowerCase();
}

function projectionValue(value: unknown): unknown
{
    return isProjectionObject(value) ? value.value : value;
}

function projectionLabel(value: unknown): string | undefined
{
    return isProjectionObject(value) ? value.label : undefined;
}

function isProjectionObject(value: unknown): value is { label?: string; value?: unknown }
{
    return typeof value === 'object' && value !== null && 'value' in value && 'label' in value;
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
