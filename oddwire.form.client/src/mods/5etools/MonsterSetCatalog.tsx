import { useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';

import { LookupContext, GLOBAL_SCOPE } from '../../_context';

import { mapMonsters, MONSTER_KEY, MONSTER_SCHEMA, MONSTER_TABLE } from './monsterMapper';
import type { MonsterRow } from './monsterMapper';
import { monsterSets } from './monsterSets';
import type { MonsterSet } from './monsterSets';

// Intent: the popup body — lists each 5etools set and MERGES it (mapped) into the global Monster table.
// Import accumulates across sources; a name already present is overwritten by the newer import (latest wins).
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
            const incoming = mapMonsters(await set.load());
            const existing = store.getTable(GLOBAL_SCOPE, MONSTER_TABLE)?.rows as MonsterRow[] | undefined;
            const rows = mergeByKey(existing ?? [], incoming);

            await store.saveTable(GLOBAL_SCOPE, { tableName: MONSTER_TABLE, schema: MONSTER_SCHEMA, rows });
            setStatus(`Imported ${incoming.length} from ${set.label} — table now ${rows.length} (reopen DB Manager to see it)`);
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

// Intent: union existing + incoming rows keyed by name; incoming overwrites a matching key (latest import wins)
function mergeByKey(existing: MonsterRow[], incoming: MonsterRow[]): MonsterRow[]
{
    const byKey = new Map<string, MonsterRow>();

    for (const row of existing)
        byKey.set(row[MONSTER_KEY], row);

    for (const row of incoming)
        byKey.set(row[MONSTER_KEY], row);

    return [...byKey.values()];
}
