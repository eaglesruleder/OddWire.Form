import
    { ControlText
    , ControlTextField
    , ControlTextArea
    , ControlCheckbox
    , ControlRadio
    , ControlDropdown
    } from './controls';
import type { ControlDef } from './controls/controlTypes';

type ControlItemProps = {
    control: ControlDef;
    value?: unknown;
    onChange: (value: unknown, param: string) => void;
    };

export function ControlItem({ control, value, onChange }: ControlItemProps)
{
    if (control.hidden)
        return null;

    switch (control.type)
    {
        case 'label':
            return <ControlText param={control.param} label={control.label} value={value as string} />;

        case 'text':
            return <ControlTextField param={control.param} label={control.label} value={value as string} valueType={control.valueType} keyboardType={control.keyboardType} onChange={onChange} />;

        case 'textarea':
            return <ControlTextArea param={control.param} label={control.label} value={value as string} onChange={onChange} />;

        case 'checkbox':
            return <ControlCheckbox param={control.param} label={control.label} value={value as boolean} onChange={onChange} />;

        case 'radio':
            return <ControlRadio param={control.param} label={control.label} value={value as string} controls={control.controls} onChange={onChange} />;

        case 'dropdown':
            return <ControlDropdown param={control.param} label={control.label} value={value as string} controls={control.controls} onChange={onChange} />;

        default:
            return <div className="unsupported-control">Unsupported control type: {(control as ControlDef).type}</div>;
    }
}
