import { ControlItem } from './ControlItem';
import type { InstanceEntity, InstanceChange } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

type ControlListProps = {
    controls: ControlDef[];
    instance: InstanceEntity;
    onChange: InstanceChange;
    };

export const ControlList = ({ controls, instance, onChange }: ControlListProps) =>
    controls.map(control =>
        <ControlItem
            key={control.param}
            control={control}
            instance={instance}
            onChange={onChange}
        />);
