import { useContext, useEffect, useState } from 'react';
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
    const [sourceLabels, setSourceLabels] = useState<Record<string, string>>({});

    useEffect(() =>
    {
        let cancelled = false;

        void loadSourceLabels()
            .then(labels =>
            {
                if (!cancelled)
                    setSourceLabels(labels);
            })
            .catch(() => undefined);

        return () => { cancelled = true; };
    }, []);

    const importSet = async (set: MonsterSet) =>
    {
        setBusy(set.id);
        setStatus(null);

        try
        {
            const label = sourceLabels[set.source] ?? prettySourceCode(set.source);
            const incoming = mapMonsters(await set.load());
            const existing = store.getTable(GLOBAL_SCOPE, MONSTER_TABLE)?.rows as MonsterRow[] | undefined;
            const rows = mergeByKey(existing ?? [], incoming);

            await store.saveTable(GLOBAL_SCOPE, { tableName: MONSTER_TABLE, schema: MONSTER_SCHEMA, rows });
            setStatus(`Imported ${incoming.length} from ${label} - table now ${rows.length} (reopen DB Manager to see it)`);
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
            {
                const label = sourceLabels[set.source] ?? prettySourceCode(set.source);

                return (
                <div key={set.id} className="flex items-center gap">
                    <span className="fill">
                        {label}
                        {label !== set.source && <span className="text-muted"> ({set.source})</span>}
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
                );
            })}
            {status && <span className="text-muted">{status}</span>}
        </div>
        );
}

type SourceMeta = {
    name?: string;
    id?: string;
    source?: string;
    };

type SourceMetaPayload = {
    book?: SourceMeta[];
    adventure?: SourceMeta[];
    };

async function loadSourceLabels(): Promise<Record<string, string>>
{
    const [books, adventures] = await Promise.all([
        loadSourceMeta('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/books.json', 'book'),
        loadSourceMeta('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/adventures.json', 'adventure')
    ]);

    const labels: Record<string, string> = {};

    for (const item of [...books, ...adventures])
    {
        if (item.name && item.source)
            labels[item.source] = item.name;
        if (item.name && item.id)
            labels[item.id] = item.name;
    }

    return labels;
}

async function loadSourceMeta(url: string, key: 'book' | 'adventure'): Promise<SourceMeta[]>
{
    const response = await fetch(url);

    if (!response.ok)
        return [];

    const payload = await response.json() as SourceMetaPayload;
    return payload[key] ?? [];
}

function prettySourceCode(source: string): string
{
    return source
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/-/g, ' - ');
}

// Intent: union existing + incoming rows keyed by name; incoming overwrites a matching key (latest import wins)
function mergeByKey(existing: MonsterRow[], incoming: MonsterRow[]): MonsterRow[]
{
    const byKey = new Map<string, MonsterRow>();

    for (const row of existing)
        byKey.set(keyOf(row), row);

    for (const row of incoming)
        byKey.set(keyOf(row), row);

    return [...byKey.values()];
}

function keyOf(row: MonsterRow): string
{
    return String(row[MONSTER_KEY] ?? '');
}
