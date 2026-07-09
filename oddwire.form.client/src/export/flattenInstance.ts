import type { ControlDef, ControlPdfBox } from '../_components/controllist';
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
    };

export function flattenInstance(form: FormDefinition, instance: InstanceEntity): FlattenedInstanceExport
{
    const values: Record<string, unknown> = {};
    const pdf: FlattenedPdfField[] = [];

    flattenControls(form.controls, instance, values, pdf);

    return {
        formId: form.formId,
        instanceId: instance.instance.instanceId,
        label: form.label,
        dateExported: new Date().toISOString(),
        values,
        pdf,
        };
}

function flattenControls(controls: ControlDef[], instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    for (const control of controls)
        flattenControl(control, instance, values, pdf);
}

function flattenControl(control: ControlDef, instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    const resolved = instance.resolve(control);

    switch (resolved.type)
    {
        case 'collapsible':
        case 'popup':
        case 'tab':
            flattenChildren(resolved.controls, instance, values, pdf);
            return;

        case 'looper':
            values[resolved.param] = flattenRows(resolved.controls, resolved.value);
            addPdfField(resolved, values[resolved.param], pdf);
            return;

        default:
            values[resolved.param] = resolved.value ?? null;
            addPdfField(resolved, values[resolved.param], pdf);
            return;
    }
}

function flattenChildren(controls: ControlDef[], instance: InstanceEntity, values: Record<string, unknown>, pdf: FlattenedPdfField[]): void
{
    for (const control of controls)
        flattenControl(control, instance, values, pdf);
}

function flattenRows(controls: ControlDef[], rows: unknown): Record<string, unknown>[]
{
    if (!Array.isArray(rows))
        return [];

    return rows.map(row =>
    {
        const rowInstance = new InstanceEntity(isRowInstance(row) ? row : { controls: [] });
        const values: Record<string, unknown> = {};
        flattenControls(controls, rowInstance, values, []);
        return values;
    });
}

function addPdfField(control: ControlDef, value: unknown, pdf: FlattenedPdfField[]): void
{
    if (!control.pdf)
        return;

    pdf.push({
        param: control.param,
        value,
        pages: control.pdf,
        });
}

function isRowInstance(value: unknown): value is { controls: { param: string; [key: string]: unknown }[] }
{
    return typeof value === 'object'
    &&  value !== null
    &&  'controls' in value
    &&  Array.isArray(value.controls);
}
