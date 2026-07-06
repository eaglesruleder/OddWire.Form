import { useContext } from 'react';

import type { InstanceEntity, InstanceChange, LookupTable } from '../../_context';
import type { ControlDef, ControlOption, DbOptions } from './controls/controlTypes';

import
    {ControlText
    ,ControlTextField
    ,ControlTextArea
    ,ControlCheckbox
    ,ControlRadio
    ,ControlDropdown
    ,ControlError
    } from './controls';
import { ControlCollapsible, ControlPopup, ControlTab } from './controls/layout';
import { DbContext, resolveDbOptions } from './lookup';

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

    switch (resolved.type)
    {
        case 'label':    return <ControlText      {...resolved} />;
        case 'text':     return <ControlTextField {...resolved} onChange={onChange} />;
        case 'textarea': return <ControlTextArea  {...resolved} onChange={onChange} />;
        case 'checkbox': return <ControlCheckbox  {...resolved} onChange={onChange} />;
        case 'radio':    return <ControlRadio     {...resolved} {...optionSource(resolved.dbOptions, resolved.controls, db, instance)} onChange={onChange} />;
        case 'dropdown': return <ControlDropdown  {...resolved} {...optionSource(resolved.dbOptions, resolved.controls, db, instance)} onChange={onChange} />;
        case 'collapsible': return <ControlCollapsible {...resolved} instance={instance} onChange={onChange} depth={depth} />;
        case 'popup':       return <ControlPopup       {...resolved} instance={instance} onChange={onChange} />;
        case 'tab':         return <ControlTab sections={[{ param: resolved.param, label: resolved.label ?? resolved.param, controls: resolved.controls }]} instance={instance} onChange={onChange} depth={depth} />;
        default:
        {
            const def = resolved as ControlDef;
            return <ControlError param={def.param}>Unknown control type: {def.type}</ControlError>;
        }
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
