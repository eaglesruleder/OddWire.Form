import { ControlItem } from './ControlItem';
import type { ControlDef } from './controls/controlTypes';

type ControlListProps = {
    controls: ControlDef[];
    values: Record<string, unknown>;
    onChange: (value: unknown, param: string) => void;
    };

export const ControlList = ({ controls, values, onChange }: ControlListProps) =>
    controls
        .map(control => ({ ...control, value: values[control.param] ?? control.value }) as unknown as ControlDef)
        .map(control => <ControlItem key={control.param} {...control} onChange={onChange} />);
