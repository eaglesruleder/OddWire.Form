import
    {ControlText
    ,ControlTextField
    ,ControlTextArea
    ,ControlCheckbox
    ,ControlRadio
    ,ControlDropdown
    } from './controls';
import { ControlBase } from './controls/ControlBase';
import { resolveControl } from '../../_context';
import type { ControlInstance } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

type ControlItemProps = {
    control: ControlDef;
    instance?: ControlInstance;
    onChange: (value: unknown, param: string) => void;
    };

export function ControlItem({ control, instance, onChange }: ControlItemProps)
{
    const resolved = resolveControl(control, instance);

    switch (resolved.type)
    {
        case 'label':    return <ControlText {...resolved} />;
        case 'text':     return <ControlTextField {...resolved} onChange={onChange} />;
        case 'textarea': return <ControlTextArea {...resolved} onChange={onChange} />;
        case 'checkbox': return <ControlCheckbox {...resolved} onChange={onChange} />;
        case 'radio':    return <ControlRadio {...resolved} onChange={onChange} />;
        case 'dropdown': return <ControlDropdown {...resolved} onChange={onChange} />;
        default:
        {
            const def = resolved as ControlDef;
            return <ControlBase param={def.param} label="Error" className="error" labelClassName="bold">Unknown control type: {def.type}</ControlBase>;
        }
    }
}
