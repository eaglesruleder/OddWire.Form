import { ControlItem } from './ControlItem';
import { findInstanceControl } from '../../_context';
import type { ControlInstance } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

type ControlListProps = {
    controls: ControlDef[];
    instanceControls: ControlInstance[];
    onChange: (value: unknown, param: string) => void;
    };

export const ControlList = ({ controls, instanceControls, onChange }: ControlListProps) =>
    controls.map(control =>
        <ControlItem
            key={control.param}
            control={control}
            instance={findInstanceControl(instanceControls, control.param)}
            onChange={onChange}
        />);
