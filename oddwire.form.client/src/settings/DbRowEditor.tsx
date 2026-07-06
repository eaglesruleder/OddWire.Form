import { useReducer, useState } from 'react';
import Button from 'react-bootstrap/Button';

import type { ControlDef } from '../_components/controllist';
import type { InstanceChange } from '../_context';

import { InstanceEntity } from '../_context';
import { ControlList } from '../_components/controllist';

type DbRowEditorProps = {
    schema: ControlDef[];
    rows: Record<string, unknown>[];
    onChange: (rows: Record<string, unknown>[]) => void;
    };

// Intent: a row is a plain param→value record; the editor treats it as a form instance and reads values back out on save
export function DbRowEditor({ schema, rows, onChange }: DbRowEditorProps)
{
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editor, setEditor] = useState<InstanceEntity | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const beginEdit = (index: number | null) =>
    {
        const row = index === null ? {} : rows[index];
        setEditor(InstanceEntity.from({ controls: rowToControls(schema, row) }));
        setEditingIndex(index);
    };

    const cancel = () =>
    {
        setEditor(null);
        setEditingIndex(null);
    };

    const commit = () =>
    {
        if (!editor)
            return;

        const row = controlsToRow(schema, editor);

        const next = editingIndex === null
            ? [...rows, row]
            : rows.map((existing, i) => i === editingIndex ? row : existing);

        onChange(next);
        cancel();
    };

    const remove = (index: number) =>
        onChange(rows.filter((_, i) => i !== index));

    const onEditorChange: InstanceChange = (value, key, subkey = 'value') =>
    {
        if (!editor)
            return;

        editor.setValue(key, subkey, value);
        bumpRender();
    };

    if (editor)
        return (
            <div className="db-row-editor mb-3">
                <ControlList controls={schema} instance={editor} onChange={onEditorChange} />
                <div className="flex gap">
                    <Button size="sm" variant="primary" onClick={commit}>Save row</Button>
                    <Button size="sm" variant="outline-secondary" onClick={cancel}>Cancel</Button>
                </div>
            </div>
            );

    return (
        <div className="flex column gap mb-3">
            {rows.map((row, index) =>
                <div key={index} className="flex items-center gap">
                    <span className="fill">{rowSummary(schema, row)}</span>
                    <Button size="sm" variant="outline-primary" onClick={() => beginEdit(index)}>Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => remove(index)}>✕</Button>
                </div>
                )}

            {rows.length === 0
            ?   <span className="text-muted">No rows.</span>
            :   null}

            <div><Button size="sm" variant="outline-primary" onClick={() => beginEdit(null)}>+ Add row</Button></div>
        </div>
        );
}

function rowToControls(schema: ControlDef[], row: Record<string, unknown>)
{
    return schema.map(control => ({ param: control.param, value: row[control.param] }));
}

function controlsToRow(schema: ControlDef[], editor: InstanceEntity): Record<string, unknown>
{
    const row: Record<string, unknown> = {};

    for (const control of schema)
        row[control.param] = editor.get(control.param)?.value;

    return row;
}

function rowSummary(schema: ControlDef[], row: Record<string, unknown>): string
{
    const values = schema
        .map(control => row[control.param])
        .filter(value => value !== undefined && value !== null && value !== '');

    return values.length ? values.join(' · ') : '(empty row)';
}
