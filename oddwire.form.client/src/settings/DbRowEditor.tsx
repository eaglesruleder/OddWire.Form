import { useReducer, useState } from 'react';
import Button from 'react-bootstrap/Button';

import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance, InstanceChange } from '../_context';

import { InstanceEntity, mergeInstances } from '../_context';
import { ControlList } from '../_components/controllist';
import { ControlDropdown } from '../_components/controllist/controls';

type DbRowEditorProps = {
    schema: ControlDef[];
    rows: Record<string, unknown>[];
    onChange: (rows: Record<string, unknown>[]) => void;
    };

// Intent: a row is a controlform instance — schema is the model, the picked row is the instance, edits write straight to context
export function DbRowEditor({ schema, rows, onChange }: DbRowEditorProps)
{
    const keyParam = schema[0]?.param ?? 'id';

    const [entity, setEntity] = useState<InstanceEntity | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [originalKey, setOriginalKey] = useState<string | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const clear = () =>
    {
        setEntity(null);
        setIsNew(false);
        setSelectedKey(null);
        setOriginalKey(null);
    };

    const pickRow = (key: string) =>
    {
        if (!key)
            return clear();

        const row = rows.find(r => String(r[keyParam] ?? '') === key) ?? {};
        setEntity(InstanceEntity.from({ controls: rowToControls(schema, row) }));
        setIsNew(false);
        setSelectedKey(key);
        setOriginalKey(key);
    };

    const addNew = () =>
    {
        setEntity(InstanceEntity.from({ controls: rowToControls(schema, {}) }));
        setIsNew(true);
        setSelectedKey(null);
        setOriginalKey(null);
    };

    const deleteRow = () =>
    {
        if (!selectedKey || !window.confirm(`Delete row "${selectedKey}"?`))
            return;

        onChange(rows.filter(r => String(r[keyParam] ?? '') !== selectedKey));
        clear();
    };

    // Intent: live write-through — each edit persists straight into the table; a key edit (new row) renames rather than duplicates
    const onContextChange: InstanceChange = (value, param, subkey = 'value') =>
    {
        if (!entity)
            return;

        entity.setValue(param, subkey, value);

        const row = controlsToRow(schema, entity);
        const currentKey = String(row[keyParam] ?? '');

        if (currentKey)
        {
            onChange(writeRow(rows, keyParam, originalKey, currentKey, row));
            setOriginalKey(currentKey);
        }

        bumpRender();
    };

    const rowOptions = rows.map(row =>
        ({ value: String(row[keyParam] ?? ''), label: rowLabel(schema, keyParam, row) }));

    // Intent: existing row → hide the key (the dropdown above owns it); new row → key is an editable text field
    const keyOverlay: FormInstance =
        { controls: [{ param: keyParam, ...(isNew ? { type: 'text' } : { hidden: true }) } as ControlInstance] };

    const viewInstance = entity
        ? InstanceEntity.from(mergeInstances(entity.instance, keyOverlay))
        : null;

    return (
        <div className="flex column gap">
            <div><Button size="sm" variant="outline-primary" onClick={addNew}>+ Add New Row</Button></div>

            <ControlDropdown
                param="__row"
                label={schema[0]?.label ?? keyParam}
                placeholder="Select a row…"
                value={selectedKey ?? ''}
                controls={rowOptions}
                onChange={pickRow}
            />

            {viewInstance &&
            <div className="db-row-editor">
                <ControlList controls={schema} instance={viewInstance} onChange={onContextChange} />
                {selectedKey &&
                <div><Button size="sm" variant="outline-danger" onClick={deleteRow}>Delete Row</Button></div>
                }
            </div>
            }
        </div>
        );
}

function rowToControls(schema: ControlDef[], row: Record<string, unknown>): ControlInstance[]
{
    return schema.map(control => ({ param: control.param, value: row[control.param] }));
}

function controlsToRow(schema: ControlDef[], entity: InstanceEntity): Record<string, unknown>
{
    const row: Record<string, unknown> = {};

    for (const control of schema)
        row[control.param] = entity.get(control.param)?.value;

    return row;
}

// Intent: same key → replace in place (stable order); rename/new → drop old + colliding keys, append
function writeRow
    (rows: Record<string, unknown>[]
    ,keyParam: string
    ,originalKey: string | null
    ,currentKey: string
    ,row: Record<string, unknown>
    ): Record<string, unknown>[]
{
    const keyOf = (r: Record<string, unknown>) => String(r[keyParam] ?? '');

    if (originalKey === currentKey && rows.some(r => keyOf(r) === currentKey))
        return rows.map(r => keyOf(r) === currentKey ? row : r);

    const filtered = rows.filter(r => keyOf(r) !== currentKey && keyOf(r) !== (originalKey ?? ''));
    return [...filtered, row];
}

function rowLabel(schema: ControlDef[], keyParam: string, row: Record<string, unknown>): string
{
    const key = String(row[keyParam] ?? '');
    const labelParam = schema[1]?.param;
    const extra = labelParam ? row[labelParam] : undefined;

    return extra !== undefined && extra !== null && extra !== '' ? `${key} · ${extra}` : (key || '(empty)');
}
