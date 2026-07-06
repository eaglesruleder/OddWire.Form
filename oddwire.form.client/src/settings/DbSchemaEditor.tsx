import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import type { ControlDef } from '../_components/controllist';

type DbSchemaEditorProps = {
    schema: ControlDef[];
    onChange: (schema: ControlDef[]) => void;
    };

// Intent: first-pass schema editor — add/remove columns only, simple control types; editing a param would orphan row data
const SIMPLE_TYPES = ['text', 'checkbox', 'dropdown'] as const;
type SimpleType = typeof SIMPLE_TYPES[number];

export function DbSchemaEditor({ schema, onChange }: DbSchemaEditorProps)
{
    const [param, setParam] = useState('');
    const [label, setLabel] = useState('');
    const [type, setType] = useState<SimpleType>('text');

    const addColumn = () =>
    {
        const trimmed = param.trim();

        if (!trimmed || schema.some(control => control.param === trimmed))
            return;

        const column = { type, param: trimmed, label: label.trim() || trimmed } as ControlDef;

        onChange([...schema, column]);
        setParam('');
        setLabel('');
        setType('text');
    };

    const removeColumn = (removedParam: string) =>
        onChange(schema.filter(control => control.param !== removedParam));

    return (
        <div className="flex column gap mb-3">
            {schema.map(control =>
                <div key={control.param} className="flex items-center gap">
                    <span className="fill">{control.label ?? control.param} <span className="text-muted">({control.type} · {control.param})</span></span>
                    <Button size="sm" variant="outline-danger" onClick={() => removeColumn(control.param)}>✕</Button>
                </div>
                )}

            {schema.length === 0
            ?   <span className="text-muted">No columns yet.</span>
            :   null}

            <div className="flex gap stack-sm">
                <Form.Control size="sm" placeholder="param" value={param} onChange={e => setParam(e.target.value)} />
                <Form.Control size="sm" placeholder="label" value={label} onChange={e => setLabel(e.target.value)} />
                <Form.Select size="sm" value={type} onChange={e => setType(e.target.value as SimpleType)}>
                    {SIMPLE_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
                </Form.Select>
                <Button size="sm" variant="outline-primary" onClick={addColumn}>+ Column</Button>
            </div>
        </div>
        );
}
