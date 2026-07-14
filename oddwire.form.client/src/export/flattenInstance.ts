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
    fontSize?: number;
    };

export function flattenInstance(form: FormDefinition, instance: InstanceEntity): FlattenedInstanceExport
{
    const values: Record<string, unknown> = {};
    const pdf: FlattenedPdfField[] = [];

    walkControls(form.controls, instance, values, pdf);

    return {
        formId: form.formId,
        instanceId: instance.instance.instanceId,
        label: form.label,
        dateExported: new Date().toISOString(),
        values,
        pdf,
        };
}

function walkControls(controls: ControlDef[], instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    for (const control of controls)
        walkControl(control, instance, values, pdf);
}

// Intent: the walker owns the tree walk + pdf emission; flattenControl (the plugin switch) only shapes each node's value
function walkControl(control: ControlDef, instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    const resolved = instance.resolve(control);

    const ctx: FlattenCtx =
        { recurse: children => walkControls(children, instance, values, pdf)
        , scope:   rowScope
        };

    const result = flattenControl(resolved, ctx);

    if (result)
    {
        values[resolved.param] = result.value;
        addPdfField(resolved, result.value, pdf);
    }
}

// Intent: flatten children into a fresh row instance (looper rows) — own scope, pdf boxes dropped
function rowScope(controls: ControlDef[], row: unknown): Record<string, unknown>
{
    const rowInstance = new InstanceEntity(isRowInstance(row) ? row : { controls: [] });
    const rowValues: Record<string, unknown> = {};

    walkControls(controls, rowInstance, rowValues, []);

    return rowValues;
}

function addPdfField(control: ControlDef, value: unknown, pdf: FlattenedPdfField[]): void
{
    if (!control.pdf)
        return;

    pdf.push({
        param: control.param,
        value,
        pages: control.pdf,
        fontSize: control.export?.pdf?.fontSize,
        });
}

function isRowInstance(value: unknown): value is { controls: { param: string; [key: string]: unknown }[] }
{
    return typeof value === 'object'
    &&  value !== null
    &&  'controls' in value
    &&  Array.isArray(value.controls);
}
