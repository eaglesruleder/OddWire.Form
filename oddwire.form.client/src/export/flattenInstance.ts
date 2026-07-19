import type { ControlDef, ControlPdfBox, FlattenCtx } from '../_components/controllist';
import { flattenControl } from '../_components/controllist';
import type { FormDefinition } from '../_context';

import { InstanceEntity } from '../_context';

export type FlattenedInstanceExport = {
    formId: string;
    instanceId?: string;
    label?: string;
    dateExported: string;
    values: Record<string, unknown>;
    pdf: FlattenedPdfField[];
    };

export type FlattenedPdfField = {
    param: string;
    value: unknown;
    pages: Record<string, ControlPdfBox[]>;
    image?: boolean;   // draw the value as an embedded image rather than text
    };

// Intent: a control whose value carries {param} tokens; deferred to a second pass so its referenced params are already flattened
type StagedField = { resolved: ControlDef; template: string };

export function flattenInstance(form: FormDefinition, instance: InstanceEntity): FlattenedInstanceExport
{
    const values: Record<string, unknown> = {};
    const pdf: FlattenedPdfField[] = [];

    resolveScope(form.controls, instance, values, pdf);

    return {
        formId: form.formId,
        instanceId: instance.instance.instanceId,
        label: form.label,
        dateExported: new Date().toISOString(),
        values,
        pdf,
        };
}

// Intent: flatten a scope in two phases — plain values first, then {param}-templated values once their referents exist
function resolveScope(controls: ControlDef[], instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    const staged: StagedField[] = [];

    walkControls(controls, instance, values, pdf, staged);
    resolveStaged(staged, values, pdf);
}

// Intent: re-queue a templated field until its staged referents are resolved (handles {a}->{b}->value chains);
// a full pass with no progress means a cycle or a dead ref, so resolve the remainder best-effort (missing -> '')
function resolveStaged(staged: StagedField[], values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    const stagedParams = new Set(staged.map(field => field.resolved.param));

    const emit = (field: StagedField): void =>
    {
        const value = interpolate(field.template, values);
        values[field.resolved.param] = value;
        addPdfField(field.resolved, value, pdf);
    };

    let queue = staged;

    while (queue.length > 0)
    {
        const deferred: StagedField[] = [];

        for (const field of queue)
            if (refsOf(field.template).some(ref => stagedParams.has(ref) && !(ref in values)))
                deferred.push(field);
            else
                emit(field);

        if (deferred.length === queue.length)   // no progress this pass -> cycle/dead ref
        {
            deferred.forEach(emit);
            return;
        }

        queue = deferred;
    }
}

function walkControls(controls: ControlDef[], instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[], staged: StagedField[]): void
{
    for (const control of controls)
        walkControl(control, instance, values, pdf, staged);
}

// Intent: the walker owns the tree walk + pdf emission; flattenControl (the plugin switch) only shapes each node's value
function walkControl(control: ControlDef, instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[], staged: StagedField[]): void
{
    const resolved = instance.resolve(control);

    const ctx: FlattenCtx =
        { recurse: children => walkControls(children, instance, values, pdf, staged)
        , scope:   rowScope
        };

    const result = flattenControl(resolved, ctx);

    if (!result)
        return;

    if (typeof result.value === 'string' && hasTemplate(result.value))
        staged.push({ resolved, template: result.value });
    else
    {
        values[resolved.param] = result.value;
        addPdfField(resolved, result.value, pdf);
    }
}

// Intent: looper rows flatten in their own scope (with their own two-pass template resolve); pdf boxes inside rows are dropped
function rowScope(controls: ControlDef[], row: unknown): Record<string, unknown>
{
    const rowInstance = new InstanceEntity(isRowInstance(row) ? row : { controls: [] });
    const rowValues: Record<string, unknown> = {};

    resolveScope(controls, rowInstance, rowValues, []);

    return rowValues;
}

const TEMPLATE_RE = /\{(\w+)\}/;

const hasTemplate = (value: string): boolean =>
    TEMPLATE_RE.test(value);

const refsOf = (template: string): string[] =>
    [...template.matchAll(/\{(\w+)\}/g)].map(match => match[1]);

// Intent: single-level {param} substitution against the flattened values; unknown/empty params collapse to ''
const interpolate = (template: string, values: Record<string, unknown>): string =>
    template.replace(/\{(\w+)\}/g, (_match, param: string) => String(values[param] ?? ''));

function addPdfField(control: ControlDef, value: unknown, pdf: FlattenedPdfField[]): void
{
    if (!control.pdf)
        return;

    pdf.push({
        param: control.param,
        value,
        pages: control.pdf,
        image: control.type === 'image' || control.type === 'signature',
        });
}

function isRowInstance(value: unknown): value is { controls: { param: string; [key: string]: unknown }[] }
{
    return typeof value === 'object'
    &&  value !== null
    &&  'controls' in value
    &&  Array.isArray(value.controls);
}
