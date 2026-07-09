import type { ControlDef } from '../_components/controllist';
import type { FormDefinition } from '../_context';

import { InstanceEntity } from '../_context';

export type FlattenedInstanceExport = {
    formId: string;
    instanceId?: string;
    label?: string;
    dateExported: string;
    values: Record<string, unknown>;
    };

export function flattenInstance(form: FormDefinition, instance: InstanceEntity): FlattenedInstanceExport
{
    return {
        formId: form.formId,
        instanceId: instance.instance.instanceId,
        label: form.label,
        dateExported: new Date().toISOString(),
        values: flattenControls(form.controls, instance),
        };
}

function flattenControls(controls: ControlDef[], instance: InstanceEntity): Record<string, unknown>
{
    const values: Record<string, unknown> = {};

    for (const control of controls)
        flattenControl(control, instance, values);

    return values;
}

function flattenControl(control: ControlDef, instance: InstanceEntity, values: Record<string, unknown>): void
{
    const resolved = instance.resolve(control);

    switch (resolved.type)
    {
        case 'collapsible':
        case 'popup':
        case 'tab':
            flattenChildren(resolved.controls, instance, values);
            return;

        case 'looper':
            values[resolved.param] = flattenRows(resolved.controls, resolved.value);
            return;

        default:
            values[resolved.param] = resolved.value ?? null;
            return;
    }
}

function flattenChildren(controls: ControlDef[], instance: InstanceEntity, values: Record<string, unknown>): void
{
    for (const control of controls)
        flattenControl(control, instance, values);
}

function flattenRows(controls: ControlDef[], rows: unknown): Record<string, unknown>[]
{
    if (!Array.isArray(rows))
        return [];

    return rows.map(row =>
    {
        const rowInstance = new InstanceEntity(isRowInstance(row) ? row : { controls: [] });
        return flattenControls(controls, rowInstance);
    });
}

function isRowInstance(value: unknown): value is { controls: { param: string; [key: string]: unknown }[] }
{
    return typeof value === 'object'
    &&  value !== null
    &&  'controls' in value
    &&  Array.isArray(value.controls);
}
