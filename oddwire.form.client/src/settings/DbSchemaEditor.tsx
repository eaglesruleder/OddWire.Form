import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import type { ControlDef } from '../_components/controllist';

type DbSchemaEditorProps = {
    schema: ControlDef[];
    onChange: (schema: ControlDef[]) => void;
    };

// Intent: first-pass schema editor — simple control types only; editing a column is inline, one at a time
const SIMPLE_TYPES = ['text', 'checkbox', 'dropdown'] as const;
type SimpleType = typeof SIMPLE_TYPES[number];

type ColumnDraft = {
    originalParam: string | null;   // null → a new column not yet in the schema
    param: string;
    label: string;
    type: SimpleType;
    };

export function DbSchemaEditor({ schema, onChange }: DbSchemaEditorProps)
{
    const [draft, setDraft] = useState<ColumnDraft | null>(null);

    const startNew = () =>
        setDraft({ originalParam: null, param: '', label: '', type: 'text' });

    const startEdit = (column: ControlDef) =>
        setDraft({ originalParam: column.param, param: column.param, label: column.label ?? '', type: column.type as SimpleType });

    const removeColumn = (param: string) =>
    {
        onChange(schema.filter(column => column.param !== param));

        if (draft?.originalParam === param)
            setDraft(null);
    };

    // Intent: renaming a column's param orphans row data keyed by the old name — accepted here; rows aren't migrated
    const commit = () =>
    {
        if (!draft)
            return;

        const param = draft.param.trim();
        const clashes = schema.some(column => column.param === param && column.param !== draft.originalParam);

        if (!param || clashes)
            return;

        const column = { type: draft.type, param, label: draft.label.trim() || param } as ControlDef;

        const next = draft.originalParam === null
            ? [column, ...schema]                                                            // new → sticky to top
            : schema.map(existing => existing.param === draft.originalParam ? column : existing);

        onChange(next);
        setDraft(null);
    };

    const editorFor = (draft: ColumnDraft) =>
        <ColumnEditor draft={draft} setDraft={setDraft} onConfirm={commit} onCancel={() => setDraft(null)} />;

    return (
        <div className="flex column gap">
            <div className="flex">
                <span className="fill" />
                <Button size="sm" variant="outline-primary" onClick={startNew}>+ Column</Button>
            </div>

            {draft?.originalParam === null &&
            <div className="db-new-col">{editorFor(draft)}</div>
            }

            {schema.map(column =>
                draft?.originalParam === column.param
                ?   <div key={column.param}>{editorFor(draft)}</div>
                :   <div key={column.param} className="flex items-center gap">
                        <span className="fill">{column.label ?? column.param} <span className="text-muted">({column.type} · {column.param})</span></span>
                        <Button size="sm" variant="outline-primary" onClick={() => startEdit(column)}>✎</Button>
                        <Button size="sm" variant="outline-danger" onClick={() => removeColumn(column.param)}>✕</Button>
                    </div>
                )}

            {schema.length === 0 && !draft
            ?   <span className="text-muted">No columns yet.</span>
            :   null}
        </div>
        );
}

type ColumnEditorProps = {
    draft: ColumnDraft;
    setDraft: (draft: ColumnDraft) => void;
    onConfirm: () => void;
    onCancel: () => void;
    };

function ColumnEditor({ draft, setDraft, onConfirm, onCancel }: ColumnEditorProps)
{
    return (
        <div className="flex gap items-end stack-sm">
            <label className="flex column fill">
                <small className="text-muted">param</small>
                <Form.Control size="sm" value={draft.param} onChange={e => setDraft({ ...draft, param: e.target.value })} />
            </label>
            <label className="flex column fill">
                <small className="text-muted">label</small>
                <Form.Control size="sm" value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} />
            </label>
            <Form.Select size="sm" value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as SimpleType })}>
                {SIMPLE_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
            </Form.Select>
            <Button size="sm" variant="outline-success" onClick={onConfirm}>✓</Button>
            <Button size="sm" variant="outline-danger" onClick={onCancel}>✕</Button>
        </div>
        );
}
