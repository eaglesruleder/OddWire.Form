import { ControlItem } from './ControlItem';
import type { FormActiveInstance } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

type ControlListProps = {
    controls: ControlDef[];
    instance: FormActiveInstance;
    onChange: (value: unknown, param: string, key?: string) => void;
    };

export const ControlList = ({ controls, instance, onChange }: ControlListProps) =>
    controls.map(control =>
        <ControlItem
            key={control.param}
            control={control}
            instance={instance}
            onChange={onChange}
        />);
