import type { FormInstance, InstanceChange } from '../../../../_context';
import { InstanceEntity } from '../../../../_context';

import { ControlButton } from '../ControlButton';
import type { ControlDef, FlattenCtx, FlattenResult, LooperControlDef, LooperRowInstance } from '../controlTypes';
import { ControlList } from '../../ControlList';

type ControlLooperProps = {
    param: string;
    label?: string;
    value?: LooperRowInstance[];
    hidden?: boolean;
    controls: ControlDef[];
    addRows?: boolean;
    onChange?: InstanceChange;
    };

// Intent: export plugin — a looper's value is an array of rows; each row flattens over the child controls in its own scope
export function looperFlatten(resolved: LooperControlDef, ctx: FlattenCtx): FlattenResult
{
    const rows = Array.isArray(resolved.value) ? resolved.value : [];

    return { value: rows.map(row => ctx.scope(resolved.controls, row)) };
}

export function ControlLooper(props: ControlLooperProps)
{
    if (props.hidden)
        return null;

    const rows = normaliseRows(props.value);
    const addRows = props.addRows ?? false;

    const addRow = () =>
        props.onChange?.([...rows, { controls: [] }], props.param);

    return (
        <div>
            {rows.map((row, rowIndex) =>
            {
                const rowEntity = new InstanceEntity(row as FormInstance);
                const onRowChange: InstanceChange = (value, key, subkey = 'value') =>
                {
                    rowEntity.setValue(key, subkey, value);
                    props.onChange?.(replaceRow(rows, rowIndex, rowEntity.instance), props.param);
                };

                return (
                    <div key={row.instanceId ?? rowIndex}>
                        <ControlList controls={props.controls} instance={rowEntity} onChange={onRowChange} />
                    </div>
                    );
            })}
            {addRows &&
            <ControlButton label="+ Add Row" size="sm" variant="outline-primary" onClick={addRow} />
            }
        </div>
        );
}

function replaceRow(rows: LooperRowInstance[], rowIndex: number, row: FormInstance): LooperRowInstance[]
{
    return rows.map((existing, i) => i === rowIndex ? row : existing) as LooperRowInstance[];
}

function normaliseRows(value: LooperRowInstance[] | undefined): LooperRowInstance[]
{
    if (!Array.isArray(value))
        return [];

    return value.map(row => Array.isArray(row?.controls) ? row : { controls: [] });
}
