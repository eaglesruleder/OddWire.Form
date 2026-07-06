import Button from 'react-bootstrap/Button';

import type { LookupTable } from '../_context';

type DbTableListProps = {
    tables: LookupTable[];
    selected: string | null;
    onSelect: (tableName: string) => void;
    onDelete: (tableName: string) => void;
    onCreate: () => void;
    };

export function DbTableList({ tables, selected, onSelect, onDelete, onCreate }: DbTableListProps)
{
    return (
        <div className="flex column gap mb-3">
            {tables.map(table =>
                <div key={table.tableName} className="flex items-center gap">
                    <Button
                        size="sm"
                        variant={table.tableName === selected ? 'primary' : 'outline-primary'}
                        className="fill"
                        onClick={() => onSelect(table.tableName)}
                    >
                        {table.tableName}
                        <span className="text-muted"> — {table.rows.length} row{table.rows.length === 1 ? '' : 's'}</span>
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(table.tableName)}>✕</Button>
                </div>
                )}

            {tables.length === 0
            ?   <span className="text-muted">No tables. Import a file or create one.</span>
            :   null}

            <div><Button size="sm" variant="outline-primary" onClick={onCreate}>+ New table</Button></div>
        </div>
        );
}
