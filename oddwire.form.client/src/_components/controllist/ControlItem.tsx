import { useContext } from 'react';

import type { InstanceEntity, InstanceChange, LookupTable } from '../../_context';
import type { ControlDef, ControlOption, DbOptions, FlattenCtx, FlattenResult } from './controls/controlTypes';

import
    {ControlText
    ,ControlTextField
    ,ControlTextArea
    ,ControlCheckbox
    ,ControlImage
    ,ControlRadio
    ,ControlDropdown
    ,ControlError
    } from './controls';
import { ControlCollapsible, ControlLooper, ControlPopup, ControlTab, looperFlatten } from './controls/layout';
import { DbContext, resolveDbOptions } from './lookup';
import { resolveLabel } from './resolveLabel';

type ControlItemProps = {
    control: ControlDef;
    instance: InstanceEntity;
    onChange: InstanceChange;
    depth?: number;
    };

export function ControlItem({ control, instance, onChange, depth = 0 }: ControlItemProps)
{
    const db = useContext(DbContext);
    const resolved = instance.resolve(control);
    resolved.label = resolveLabel(resolved.label, instance);
    if (resolved.type === 'collapsible')
    {
        const subtitle = resolveLabel(resolved.subtitle, instance)?.trim();
        resolved.subtitle = subtitle || undefined;
    }

    switch (resolved.type)
    {
        case 'label':    return <ControlText      {...resolved} hidden={resolved.hidden || targetHidden(resolved.labelFor, instance)} />;
        case 'text':     return <ControlTextField {...resolved} onChange={onChange} />;
        case 'textarea': return <ControlTextArea  {...resolved} onChange={onChange} />;
        case 'checkbox': return <ControlCheckbox  {...resolved} onChange={onChange} />;
        case 'image':    return <ControlImage     {...resolved} />;
        case 'radio':    return <ControlRadio     {...resolved} {...optionSource(resolved.dbOptions, resolved.controls, db, instance)} onChange={fillOnChange(resolved.dbOptions, db, onChange, instance)} />;
        case 'dropdown': return <ControlDropdown  {...resolved} {...optionSource(resolved.dbOptions, resolved.controls, db, instance)} onChange={fillOnChange(resolved.dbOptions, db, onChange, instance)} />;
        case 'collapsible': return <ControlCollapsible {...resolved} instance={instance} onChange={onChange} depth={depth} />;
        case 'popup':       return <ControlPopup       {...resolved} instance={instance} onChange={onChange} />;
        case 'tab':         return <ControlTab sections={[{ param: resolved.param, label: resolved.label ?? resolved.param, controls: resolved.controls }]} instance={instance} onChange={onChange} depth={depth} />;
        case 'looper':      return <ControlLooper      {...resolved} onChange={onChange} />;
        default:
        {
            const def = resolved as ControlDef;
            return <ControlError param={def.param}>Unknown control type: {def.type}</ControlError>;
        }
    }
}

// Intent: export-flatten router — the non-React sibling of the render switch above; dispatches a resolved control to its
// flatten plugin. Layout recurses (emits nothing); looper has its own plugin; every leaf falls through to its raw value.
export function flattenControl(resolved: ControlDef, ctx: FlattenCtx): FlattenResult
{
    switch (resolved.type)
    {
        case 'tab':
        case 'collapsible':
        case 'popup':
            ctx.recurse(resolved.controls);
            return undefined;

        case 'looper':
            return looperFlatten(resolved, ctx);

        default:
            return { value: resolved.value ?? null };
    }
}

// Intent: no dbOptions → leave the control's own props untouched; otherwise db-resolved options override controls/disabled/placeholder
function optionSource
    (dbOptions: DbOptions | undefined
    ,staticControls: ControlOption[] | undefined
    ,db: Record<string, LookupTable>
    ,instance: InstanceEntity
    ): { controls?: ControlOption[]; disabled?: boolean; placeholder?: string }
{
    if (!dbOptions)
        return {};

    return resolveDbOptions(dbOptions, db, instance, staticControls ?? []);
}

// Intent: dbOptions.fill → selecting a row writes the key AND every other (non-empty) column into its matching param
// Batches the columns through instance.setValues (one persist) instead of N onChange calls; skips empty columns so a
// blank source value never clobbers an existing edit (e.g. notes) — key-lossy on the instance drops the rest.
function fillOnChange(dbOptions: DbOptions | undefined, db: Record<string, LookupTable>, onChange: InstanceChange, instance: InstanceEntity): InstanceChange
{
    if (!dbOptions || typeof dbOptions === 'string' || !dbOptions.fill)
        return onChange;

    const table = db[dbOptions.table];
    if (!table)
        return onChange;

    return (value, key, subkey) =>
    {
        const row = table.rows.find(entry => String(entry[dbOptions.valueParam] ?? '') === value);

        if (row)
        {
            const valuePatch: Record<string, unknown> = {};
            const controlPatch: Record<string, Record<string, unknown>> = {};

            for (const [column, columnValue] of Object.entries(row))
            {
                if (column === dbOptions.valueParam || columnValue === '' || columnValue == null)
                    continue;

                if (isControlPatch(columnValue))
                    controlPatch[column] = columnValue;
                else
                    valuePatch[column] = columnValue;
            }

            if (Object.keys(valuePatch).length > 0)
                instance.setValues(valuePatch);

            if (Object.keys(controlPatch).length > 0)
                instance.setControls(controlPatch);
        }

        onChange(value, key, subkey);   // the key + the single render
    };
}

function targetHidden(param: string | undefined, instance: InstanceEntity): boolean
{
    return param ? instance.get(param)?.hidden === true : false;
}

function isControlPatch(value: unknown): value is Record<string, unknown>
{
    return typeof value === 'object'
    &&  value !== null
    && !Array.isArray(value)
    &&  Object.keys(value).some(key => ['value', 'hidden', 'disabled', 'placeholder', 'readonly', 'rows'].includes(key));
}
