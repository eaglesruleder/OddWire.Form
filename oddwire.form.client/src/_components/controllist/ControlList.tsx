import { ControlItem } from './ControlItem';
import type { ControlDef } from './controls/controlTypes';

type ControlListProps = {
    controls: ControlDef[];
    values: Record<string, unknown>;
    onChange: (value: unknown, param: string) => void;
    };

// Iterate a control scope; dispatch stays in ControlItem. The transitional values map
// resolves the live value per param (Stage 3 replaces it with the instance overlay).
export const ControlList = (props: ControlListProps) =>
    <>
        {props.controls.map(control =>
        <ControlItem
            key={control.param}
            control={control}
            value={props.values[control.param] ?? control.value}
            onChange={props.onChange}
        />
        )}
    </>;
