import { ControlItem } from './ControlItem';
import type { ControlDef } from './controls/controlTypes';

type ControlListProps = {
    controls: ControlDef[];
    values: Record<string, unknown>;
    onChange: (value: unknown, param: string) => void;
    };

// First map is the merge boundary — resolve each live value into a fresh def (never mutate the
// shared definition), cast once. Second map renders. Stage 3's instance overlay merges in the first.
export const ControlList = ({ controls, values, onChange }: ControlListProps) =>
    controls
        .map(control => ({ ...control, value: values[control.param] ?? control.value }) as unknown as ControlDef)
        .map(control => <ControlItem key={control.param} {...control} onChange={onChange} />);
