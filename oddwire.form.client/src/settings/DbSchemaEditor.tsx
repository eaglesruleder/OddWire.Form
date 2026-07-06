import { useState } from 'react';

import type { ControlDef, ControlOption } from '../_components/controllist';

import { ControlTextField, ControlDropdown, ControlButton } from '../_components/controllist/controls';

type DbSchemaEditorProps = {
    schema: ControlDef[];
    onChange: (schema: ControlDef[]) => void;
    };

// Intent: first-pass schema editor — simple control types only; one column edited inline at a time
const SIMPLE_TYPES = ['text', 'checkbox', 'dropdown'] as const;
type SimpleType = typeof SIMPLE_TYPES[number];

const TYPE_OPTIONS: ControlOption[] = SIMPLE_TYPES.map(type => ({ value: type, label: type }));

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

    const patchDraft = (patch: Partial<ColumnDraft>) =>
        setDraft(current => current && { ...current, ...patch });

    return (
        <div className="flex column gap">
            <div className="flex db-add-col">
                <span className="fill" />
                <ControlButton label="+ Add" size="sm" variant="outline-primary" onClick={startNew} />
            </div>

            {draft?.originalParam === null &&
            <div className="db-new-col">
                <ColumnRow idPrefix="new" editing values={draft} onField={patchDraft} onPrimary={commit} onSecondary={() => setDraft(null)} />
            </div>
            }

            {schema.map(column =>
                draft?.originalParam === column.param
                ?   <div key={column.param}>
                        <ColumnRow idPrefix={column.param} editing values={draft} onField={patchDraft} onPrimary={commit} onSecondary={() => setDraft(null)} />
                    </div>
                :   <ColumnRow
                        key={column.param}
                        idPrefix={column.param}
                        editing={false}
                        values={{ param: column.param, label: column.label ?? column.param, type: column.type as SimpleType }}
                        onField={() => {}}
                        onPrimary={() => startEdit(column)}
                        onSecondary={() => removeColumn(column.param)}
                    />
                )}

            {schema.length === 0 && !draft
            ?   <span className="text-muted">No columns yet.</span>
            :   null}
        </div>
        );
}

type ColumnRowProps = {
    idPrefix: string;
    editing: boolean;
    values: { param: string; label: string; type: SimpleType };
    onField: (patch: Partial<ColumnDraft>) => void;
    onPrimary: () => void;
    onSecondary: () => void;
    };

// Intent: one row built from control primitives — readonly toggles with edit mode, so display and edit share one shape
function ColumnRow({ idPrefix, editing, values, onField, onPrimary, onSecondary }: ColumnRowProps)
{
    const readonly = !editing;

    return (
        <div className="grid items-end">
            <ControlTextField param={`${idPrefix}-param`} className="col-4" label="param" stacked readonly={readonly} value={values.param} onChange={value => onField({ param: value })} />
            <ControlTextField param={`${idPrefix}-label`} className="col-4" label="label" stacked readonly={readonly} value={values.label} onChange={value => onField({ label: value })} />
            <ControlDropdown param={`${idPrefix}-type`} className="col-2" label="type" stacked readonly={readonly} value={values.type} controls={TYPE_OPTIONS} onChange={value => onField({ type: value as SimpleType })} />
            <ControlButton label={editing ? '✓' : '✎'} className="col-1" size="sm" variant={editing ? 'outline-success' : 'outline-primary'} onClick={onPrimary} />
            <ControlButton label="✕" className="col-1" size="sm" variant="outline-danger" onClick={onSecondary} />
        </div>
        );
}
