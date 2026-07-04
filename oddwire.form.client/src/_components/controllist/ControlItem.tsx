import
    {ControlText
    ,ControlTextField
    ,ControlTextArea
    ,ControlCheckbox
    ,ControlRadio
    ,ControlDropdown
    ,ControlError
    } from './controls';
import type { InstanceEntity } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

type ControlItemProps = {
    control: ControlDef;
    instance: InstanceEntity;
    onChange: (value: unknown, param: string, key?: string) => void;
    };

export function ControlItem({ control, instance, onChange }: ControlItemProps)
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
        default:
        {
            const def = resolved as ControlDef;
            return <ControlError param={def.param}>Unknown control type: {def.type}</ControlError>;
        }
    }
}
