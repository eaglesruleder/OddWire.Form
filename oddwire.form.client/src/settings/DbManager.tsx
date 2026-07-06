import { useContext, useReducer, useState } from 'react';
import Button from 'react-bootstrap/Button';

import type { ControlDef, TabSection } from '../_components/controllist';
import type { LookupTable } from '../_context';

import { LookupContext, GLOBAL_SCOPE } from '../_context';
import { ControlTab } from '../_components/controllist';
import { ControlDropdown } from '../_components/controllist/controls';
import { ImportFromFileButton } from './ImportFromFileButton';
import { DbSchemaEditor } from './DbSchemaEditor';
import { DbRowEditor } from './DbRowEditor';
import './dbManager.css';

const ADD_NEW = '__addNew';

// Intent: global scope only this phase — form-local tables are a later layer; the store already merges both
export function DbManager()
{
    const store = useContext(LookupContext);

    const [expanded, setExpanded] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
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

    const onImport = (rows: Record<string, unknown>[]) =>
    {
        const name = window.prompt('Import into table name')?.trim();

        if (!name)
            return;

        // Intent: import replaces rows and keeps an existing schema; a new table infers columns from the rows
        void persist(store.importRows(GLOBAL_SCOPE, name, rows));
        setSelected(name);
    };

    const onDelete = () =>
    {
        if (!selected || !window.confirm(`Delete table "${selected}"?`))
            return;

        void persist(store.deleteTable(GLOBAL_SCOPE, selected));
        setSelected(null);
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

    return (
        <div className="db-manager">
            <button type="button" className="db-manager-header flex items-center gap" onClick={() => setExpanded(open => !open)}>
                <span className="collapsible-chevron">{expanded ? '▾' : '▸'}</span>
                <span className="fill">DB Manager</span>
                <span className="text-muted">{tables.length} table{tables.length === 1 ? '' : 's'}</span>
            </button>

            {expanded &&
            <div className="db-manager-body">
                <ImportFromFileButton onImport={onImport} />

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

                <ControlTab sections={editorTabs} />
            </div>
            }
        </div>
        );
}
