import { useReducer, useState } from 'react';
import Button from 'react-bootstrap/Button';

import type { ControlDef } from '../../_components/controllist';
import type { FormInstance, ControlInstance, InstanceChange } from '../../_context';

import { InstanceEntity, mergeInstances } from '../../_context';
import { ControlList } from '../../_components/controllist';
import { ControlDropdown } from '../../_components/controllist/controls';
import { DupResolvePopup } from './DupResolvePopup';
import { keyOf, rowLabel, mergeRows } from './rowUtils';

type Row = Record<string, unknown>;

type DbRowEditorProps = {
    schema: ControlDef[];
    rows: Row[];
    onChange: (rows: Row[]) => void;
    };

// Intent: a row is a controlform instance — schema is the model, the picked row is the instance. Existing-row edits are
// live in-place (key hidden = no collision); add-new is a DRAFT committed on Save, resolving key collisions via a popup.
export function DbRowEditor({ schema, rows, onChange }: DbRowEditorProps)
{
    const keyParam = schema[0]?.param ?? 'id';

    const [entity, setEntity] = useState<InstanceEntity | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [collisionRow, setCollisionRow] = useState<Row | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const clear = () =>
    {
        setEntity(null);
        setIsNew(false);
        setSelectedKey(null);
        setCollisionRow(null);
    };

    const pickRow = (key: string) =>
    {
        if (!key)
            return clear();

        const row = rows.find(r => keyOf(r, keyParam) === key) ?? {};
        setEntity(InstanceEntity.from({ controls: rowToControls(schema, row) }));
        setIsNew(false);
        setSelectedKey(key);
        setCollisionRow(null);
    };

    const addNew = () =>
    {
        setEntity(InstanceEntity.from({ controls: rowToControls(schema, {}) }));
        setIsNew(true);
        setSelectedKey(null);
        setCollisionRow(null);
    };

    const deleteRow = () =>
    {
        if (!selectedKey || !window.confirm(`Delete row "${selectedKey}"?`))
            return;

        onChange(rows.filter(r => keyOf(r, keyParam) !== selectedKey));
        clear();
    };

    // Intent: existing row → live in-place update (key is hidden, so it can't collide); new row → draft only, commit later
    const onEditorChange: InstanceChange = (value, param, subkey = 'value') =>
    {
        if (!entity)
            return;

        entity.setValue(param, subkey, value);

        if (!isNew && selectedKey)
        {
            const row = controlsToRow(schema, entity);
            onChange(rows.map(r => keyOf(r, keyParam) === selectedKey ? row : r));
        }

        bumpRender();
    };

    // Intent: commit the draft — empty key blocked; a colliding key defers to the popup instead of silently overwriting
    const commitNew = () =>
    {
        if (!entity)
            return;

        const row = controlsToRow(schema, entity);

        if (!keyOf(row, keyParam))
        {
            window.alert(`Enter a ${schema[0]?.label ?? keyParam} first`);
            return;
        }

        if (rows.some(r => keyOf(r, keyParam) === keyOf(row, keyParam)))
        {
            setCollisionRow(row);
            return;
        }

        onChange([...rows, row]);
        clear();
    };

    const resolveCollision = (overwriteKeys: Set<string>) =>
    {
        if (collisionRow)
            onChange(mergeRows(rows, [collisionRow], keyParam, overwriteKeys));

        clear();
    };

    const rowOptions = rows.map(row =>
        ({ value: keyOf(row, keyParam), label: rowLabel(schema, keyParam, row) }));

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
                <ControlList controls={schema} instance={viewInstance} onChange={onEditorChange} />
                {isNew &&
                <div className="flex gap">
                    <Button size="sm" variant="success" onClick={commitNew}>Save row</Button>
                    <Button size="sm" variant="outline-secondary" onClick={clear}>Cancel</Button>
                </div>
                }
                {selectedKey &&
                <div><Button size="sm" variant="outline-danger" onClick={deleteRow}>Delete Row</Button></div>
                }
            </div>
            }

            {collisionRow &&
            <DupResolvePopup
                collisions={[{ key: keyOf(collisionRow, keyParam), label: rowLabel(schema, keyParam, rows.find(r => keyOf(r, keyParam) === keyOf(collisionRow, keyParam)) ?? collisionRow) }]}
                onAccept={resolveCollision}
                onCancel={() => setCollisionRow(null)}
            />
            }
        </div>
        );
}

function rowToControls(schema: ControlDef[], row: Row): ControlInstance[]
{
    return schema.map(control => ({ param: control.param, value: row[control.param] }));
}

function controlsToRow(schema: ControlDef[], entity: InstanceEntity): Row
{
    const row: Row = {};

    for (const control of schema)
        row[control.param] = entity.get(control.param)?.value;

    return row;
}
