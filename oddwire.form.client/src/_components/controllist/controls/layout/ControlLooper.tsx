import type { FormInstance, InstanceChange } from '../../../../_context';
import { InstanceEntity } from '../../../../_context';

import { ControlButton } from '../ControlButton';
import type { ControlDef, LooperRowInstance } from '../controlTypes';
import { ControlList } from '../../ControlList';
import './layoutControls.css';

type ControlLooperProps = {
    param: string;
    label?: string;
    value?: LooperRowInstance[];
    hidden?: boolean;
    controls: ControlDef[];
    addRows?: boolean;
    onChange?: InstanceChange;
    };

export function ControlLooper(props: ControlLooperProps)
{
    if (props.hidden)
        return null;

    const rows = normaliseRows(props.value);
    const addRows = props.addRows ?? false;

    const addRow = () =>
        props.onChange?.([...rows, { controls: [] }], props.param);

    return (
        <div className="looper mb-3">
            <div className="flex items-center gap mb-3">
                <div className="separator fill">{props.label ?? props.param}</div>
                {addRows &&
                <ControlButton label="+ Add Row" size="sm" variant="outline-primary" onClick={addRow} />
                }
            </div>
            {rows.length < 1 &&
            <div className="control-static looper-empty">No rows</div>
            }
            {rows.map((row, rowIndex) =>
            {
                const rowEntity = new InstanceEntity(row as FormInstance);
                const onRowChange: InstanceChange = (value, key, subkey = 'value') =>
                {
                    rowEntity.setValue(key, subkey, value);
                    props.onChange?.(replaceRow(rows, rowIndex, rowEntity.instance), props.param);
                };

                return (
                    <div key={row.instanceId ?? rowIndex} className="looper-row bubble">
                        <div className="looper-row-title">Row {rowIndex + 1}</div>
                        <ControlList controls={props.controls} instance={rowEntity} onChange={onRowChange} />
                    </div>
                    );
            })}
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
