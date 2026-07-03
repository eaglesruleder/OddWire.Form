import
    {ControlText
    ,ControlTextField
    ,ControlTextArea
    ,ControlCheckbox
    ,ControlRadio
    ,ControlDropdown
    } from './controls';
import { ControlBase } from './controls/ControlBase';
import type { ControlDef } from './controls/controlTypes';

type ControlItemProps = ControlDef & {
    onChange: (value: unknown, param: string) => void;
    };

export function ControlItem(props: ControlItemProps)
{
    switch (props.type)
    {
        case 'label':    return <ControlText {...props} />;
        case 'text':     return <ControlTextField {...props} />;
        case 'textarea': return <ControlTextArea {...props} />;
        case 'checkbox': return <ControlCheckbox {...props} />;
        case 'radio':    return <ControlRadio {...props} />;
        case 'dropdown': return <ControlDropdown {...props} />;
        default:
        {
            const def = props as ControlDef;
            return <ControlBase param={def.param} label="Error" className="error" labelClassName="bold">Unknown control type: {def.type}</ControlBase>;
        }
    }
}
