import { useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';

import { LookupContext, GLOBAL_SCOPE } from '../../_context';

import { mapMonsters, MONSTER_SCHEMA, MONSTER_TABLE } from './monsterMapper';
import { monsterSets } from './monsterSets';
import type { MonsterSet } from './monsterSets';

// Intent: the popup body — lists each 5etools set and imports it (mapped) into the global Monster table.
// Import REPLACES the table's rows, so only one set is live at a time (importRows semantics).
export function MonsterSetCatalog()
{
    const store = useContext(LookupContext);
    const [busy, setBusy] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    const importSet = async (set: MonsterSet) =>
    {
        setBusy(set.id);
        setStatus(null);

        try
        {
            const rows = mapMonsters(await set.load());
            await store.importRows(GLOBAL_SCOPE, MONSTER_TABLE, rows, MONSTER_SCHEMA);
            setStatus(`Imported ${rows.length} into "${MONSTER_TABLE}" — reopen DB Manager to see it`);
        }
        catch (e)
        {
            setStatus(e instanceof Error ? e.message : 'Import failed');
        }
        finally
        {
            setBusy(null);
        }
    };

    return (
        <div className="flex column gap">
            {monsterSets.map(set =>
                <div key={set.id} className="flex items-center gap">
                    <span className="fill">
                        {set.label}
                        <span className="text-muted"> ({set.source})</span>
                    </span>
                    <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={busy !== null}
                        onClick={() => importSet(set)}
                    >
                        {busy === set.id ? 'Importing…' : 'Import'}
                    </Button>
                </div>
                )}
            {status && <span className="text-muted">{status}</span>}
        </div>
        );
}
