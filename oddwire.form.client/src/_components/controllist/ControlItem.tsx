import type { InstanceEntity, InstanceChange } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

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

type ControlItemProps = {
    control: ControlDef;
    instance: InstanceEntity;
    onChange: InstanceChange;
    depth?: number;
    };

export function ControlItem({ control, instance, onChange, depth = 0 }: ControlItemProps)
{
    const resolved = instance.resolve(control);

    switch (resolved.type)
    {
        case 'label':    return <ControlText      {...resolved} />;
        case 'text':     return <ControlTextField {...resolved} onChange={onChange} />;
        case 'textarea': return <ControlTextArea  {...resolved} onChange={onChange} />;
        case 'checkbox': return <ControlCheckbox  {...resolved} onChange={onChange} />;
        case 'radio':    return <ControlRadio     {...resolved} onChange={onChange} />;
        case 'dropdown': return <ControlDropdown  {...resolved} onChange={onChange} />;
        case 'collapsible': return <ControlCollapsible {...resolved} instance={instance} onChange={onChange} depth={depth} />;
        case 'popup':       return <ControlPopup       {...resolved} instance={instance} onChange={onChange} />;
        case 'tab':         return <ControlTab variant="inline" sections={[{ param: resolved.param, label: resolved.label ?? resolved.param, controls: resolved.controls }]} instance={instance} onChange={onChange} depth={depth} />;
        default:
        {
            const def = resolved as ControlDef;
            return <ControlError param={def.param}>Unknown control type: {def.type}</ControlError>;
        }
    }
}
