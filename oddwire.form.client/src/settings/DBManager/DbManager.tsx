import { useContext, useReducer, useState } from 'react';
import Button from 'react-bootstrap/Button';

import type { ControlDef, TabSection } from '../../_components/controllist';
import type { LookupTable } from '../../_context';

import { LookupContext, GLOBAL_SCOPE } from '../../_context';
import { ControlTab } from '../../_components/controllist';
import { ControlDropdown } from '../../_components/controllist/controls';
import { SettingsPane } from '../SettingsPane';
import { ImportFromFileButton } from './ImportFromFileButton';
import { DbSchemaEditor } from './DbSchemaEditor';
import { DbRowEditor } from './DbRowEditor';
import { DupResolvePopup } from './DupResolvePopup';
import type { Collision } from './DupResolvePopup';
import { keyOf, rowLabel, mergeRows, collisionsOf } from './rowUtils';
import './dbManager.css';

type PendingImport = { name: string; table: LookupTable; rows: Record<string, unknown>[]; keyParam: string; collisions: Collision[] };

const ADD_NEW = '__addNew';

// Intent: global scope only this phase — form-local tables are a later layer; the store already merges both
export function DbManager()
{
    const store = useContext(LookupContext);

    const [expanded, setExpanded] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const tables = store.listTables(GLOBAL_SCOPE);
    const selectedTable = selected ? store.getTable(GLOBAL_SCOPE, selected) : undefined;

    const persist = async (mutate: Promise<unknown>) =>
    {
        await mutate;
        bumpRender();
    };

    const saveTable = (table: LookupTable) =>
        persist(store.saveTable(GLOBAL_SCOPE, table));

    const onCreate = () =>
    {
        const name = window.prompt('New table name')?.trim();

        if (!name || tables.some(table => table.tableName === name))
            return;

        void saveTable({ tableName: name, schema: [], rows: [] });
        setSelected(name);
    };

    // Intent: the picker's "Add New" option routes to create; any other value selects that table
    const onPick = (value: string) =>
        value === ADD_NEW ? onCreate() : setSelected(value || null);

    // Intent: new table → infer schema + add all; existing table → upsert, deferring key collisions to the resolve popup
    const onImport = (rows: Record<string, unknown>[]) =>
    {
        const name = window.prompt('Import into table name')?.trim();

        if (!name)
            return;

        const table = store.getTable(GLOBAL_SCOPE, name);

        if (!table)
        {
            void persist(store.importRows(GLOBAL_SCOPE, name, rows));
            setSelected(name);
            return;
        }

        const keyParam = table.schema[0]?.param ?? 'id';
        const collisions = collisionsOf(table.rows, rows, keyParam);

        if (collisions.length === 0)
        {
            void saveTable({ ...table, rows: mergeRows(table.rows, rows, keyParam, new Set()) });
            setSelected(name);
            return;
        }

        setPendingImport({ name, table, rows, keyParam, collisions: collisions.map(row =>
            ({ key: keyOf(row, keyParam), label: rowLabel(table.schema, keyParam, table.rows.find(existing => keyOf(existing, keyParam) === keyOf(row, keyParam)) ?? row) })) });
    };

    const onResolveImport = (overwriteKeys: Set<string>) =>
    {
        if (!pendingImport)
            return;

        void saveTable({ ...pendingImport.table, rows: mergeRows(pendingImport.table.rows, pendingImport.rows, pendingImport.keyParam, overwriteKeys) });
        setSelected(pendingImport.name);
        setPendingImport(null);
    };

    const onDelete = () =>
    {
        if (!selected || !window.confirm(`Delete table "${selected}"?`))
            return;

        void persist(store.deleteTable(GLOBAL_SCOPE, selected));
        setSelected(null);
    };

    // Intent: Clear resets the selected table's rows (keeps the table + schema); Delete removes the whole table
    const onClear = () =>
    {
        if (!selectedTable || !window.confirm(`Clear all rows from "${selectedTable.tableName}"?`))
            return;

        void saveTable({ ...selectedTable, rows: [] });
    };

    const onSchemaChange = (schema: ControlDef[]) =>
    {
        if (selectedTable)
            void saveTable({ ...selectedTable, schema });
    };

    const onRowsChange = (rows: Record<string, unknown>[]) =>
    {
        if (selectedTable)
            void saveTable({ ...selectedTable, rows });
    };

    const pickerOptions =
        [...tables.map(table => ({ value: table.tableName, label: table.tableName }))
        ,{ value: ADD_NEW, label: '+ Add New' }
        ];

    const editorTabs: TabSection[] =
        [{param: 'model'
         ,label: 'Edit Model'
         ,disabled: !selectedTable
         ,content: selectedTable && <DbSchemaEditor key={selectedTable.tableName} schema={selectedTable.schema} onChange={onSchemaChange} />
         }
        ,{param: 'rows'
         ,label: 'Edit Rows'
         ,disabled: !selectedTable
         ,content: selectedTable && <DbRowEditor key={selectedTable.tableName} schema={selectedTable.schema} rows={selectedTable.rows} onChange={onRowsChange} />
         }
        ];

    // Intent: Clear only shows while open (it acts on the open editor's table); Import stays available either way
    const headerActions =
        <>
            {expanded &&
            <Button variant="danger" disabled={!selectedTable} onClick={onClear}>Clear</Button>
            }
            <ImportFromFileButton onImport={onImport} label="Import" className="btn btn-outline-primary" />
        </>;

    return (
        <>
        <SettingsPane title="DB Manager" expanded={expanded} onToggle={() => setExpanded(open => !open)} headerActions={headerActions}>
            <div className="flex items-center gap mb-3">
                <div className="fill">
                    <ControlDropdown
                        param="__table"
                        label="Table (global)"
                        placeholder="Select a table…"
                        value={selected ?? ''}
                        controls={pickerOptions}
                        onChange={onPick}
                    />
                </div>
                {selected &&
                <Button size="sm" variant="outline-danger" onClick={onDelete}>Delete</Button>
                }
            </div>

            <ControlTab sections={editorTabs} defaultParam="rows" />
        </SettingsPane>

        {pendingImport &&
        <DupResolvePopup collisions={pendingImport.collisions} onAccept={onResolveImport} onCancel={() => setPendingImport(null)} />
        }
        </>
        );
}
