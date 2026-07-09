import { useContext, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import { LookupContext, GLOBAL_SCOPE } from '../../_context';
import { StripLayout } from '../../_components/layout';

import { mapMonsters, MONSTER_KEY, MONSTER_SCHEMA, MONSTER_TABLE } from './monsterMapper';
import type { MonsterRow, RawMonster } from './monsterMapper';
import { monsterSets } from './monsterSets';
import type { MonsterSet } from './monsterSets';
import './monsterSetCatalog.css';

export function MonsterSetCatalog()
{
    const store = useContext(LookupContext);
    const [busy, setBusy] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [sourceLabels, setSourceLabels] = useState<Record<string, string>>({});
    const [loadedSet, setLoadedSet] = useState<MonsterSet | null>(null);
    const [loadedMonsters, setLoadedMonsters] = useState<RawMonster[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [collection, setCollection] = useState('');
    const [session, setSession] = useState('');

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

    const existing = store.getTable(GLOBAL_SCOPE, MONSTER_TABLE)?.rows as MonsterRow[] | undefined;
    const conflicts = new Set((existing ?? []).map(row => keyOf(row)).filter(Boolean));
    const visibleMonsters = sortMonsters(loadedMonsters, conflicts)
        .filter(monster => monster.name.toLowerCase().includes(filter.trim().toLowerCase()));
    const allVisibleSelected = visibleMonsters.length > 0 && visibleMonsters.every(monster => selected.has(monster.name));

    const loadSet = async (set: MonsterSet) =>
    {
        setBusy(set.id);
        setStatus(null);

        try
        {
            const label = sourceLabels[set.source] ?? prettySourceCode(set.source);
            const monsters = await set.load();

            setLoadedSet(set);
            setLoadedMonsters(monsters);
            setSelected(new Set(monsters.map(monster => monster.name)));
            setFilter('');
            setStatus(`Loaded ${monsters.length} monsters from ${label}`);
        }
        catch (e)
        {
            setStatus(e instanceof Error ? e.message : 'Load failed');
        }
        finally
        {
            setBusy(null);
        }
    };

    const importSelected = async () =>
    {
        if (!loadedSet)
            return;

        const picked = loadedMonsters.filter(monster => selected.has(monster.name));
        const incoming = mapMonsters(picked, { collection, session });
        const rows = mergeByKey(existing ?? [], incoming);

        await store.saveTable(GLOBAL_SCOPE, { tableName: MONSTER_TABLE, schema: MONSTER_SCHEMA, rows });
        setStatus(`Imported ${incoming.length} from ${sourceLabel(loadedSet, sourceLabels)} - table now ${rows.length} (reopen DB Manager to see it)`);
    };

    const toggleMonster = (name: string, checked: boolean) =>
        setSelected(values =>
        {
            const next = new Set(values);
            checked ? next.add(name) : next.delete(name);
            return next;
        });

    const toggleVisible = (checked: boolean) =>
        setSelected(values =>
        {
            const next = new Set(values);
            for (const monster of visibleMonsters)
                checked ? next.add(monster.name) : next.delete(monster.name);
            return next;
        });

    return (
        <div className="flex column gap">
            <SourceList
                busy={busy}
                sourceFilter={sourceFilter}
                sourceLabels={sourceLabels}
                onFilter={setSourceFilter}
                onLoad={loadSet}
            />

            {loadedSet &&
            <Modal show onHide={() => setLoadedSet(null)} centered dialogClassName="popup-dialog" contentClassName="popup-content">
                <StripLayout
                    title={sourceLabel(loadedSet, sourceLabels)}
                    left={<button type="button" className="strip-btn" onClick={() => setLoadedSet(null)}>←</button>}
                    right={<button type="button" className="strip-btn" disabled={selected.size === 0} onClick={importSelected} title="Import selected">✓</button>}
                >
                    <MonsterReview
                    conflicts={conflicts}
                    collection={collection}
                    filter={filter}
                    loadedSet={loadedSet}
                    selected={selected}
                    session={session}
                    sourceLabels={sourceLabels}
                    status={status}
                    visibleMonsters={visibleMonsters}
                    allVisibleSelected={allVisibleSelected}
                    onCollection={setCollection}
                    onFilter={setFilter}
                    onSession={setSession}
                    onToggleMonster={toggleMonster}
                    onToggleVisible={toggleVisible}
                />
                </StripLayout>
            </Modal>
            }

            {!loadedSet && status && <span className="text-muted">{status}</span>}
        </div>
        );
}

function SourceList
    ({busy
    ,sourceFilter
    ,sourceLabels
    ,onFilter
    ,onLoad
    }: {
        busy: string | null;
        sourceFilter: string;
        sourceLabels: Record<string, string>;
        onFilter: (value: string) => void;
        onLoad: (set: MonsterSet) => void;
        })
{
    const visibleSets = monsterSets.filter(set =>
    {
        const needle = sourceFilter.trim().toLowerCase();
        const label = sourceLabel(set, sourceLabels).toLowerCase();
        return !needle || label.includes(needle) || set.source.toLowerCase().includes(needle);
    });

    return (
        <>
            <Form.Control
                type="text"
                placeholder="Filter sources..."
                value={sourceFilter}
                onChange={event => onFilter(event.target.value)}
            />

            {visibleSets.map(set =>
            {
                const label = sourceLabel(set, sourceLabels);

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
                        onClick={() => onLoad(set)}
                    >
                        {busy === set.id ? 'Loading...' : 'Load'}
                    </Button>
                </div>
                );
            })}
        </>
        );
}

type MonsterReviewProps = {
    conflicts: Set<string>;
    collection: string;
    filter: string;
    loadedSet: MonsterSet;
    selected: Set<string>;
    session: string;
    sourceLabels: Record<string, string>;
    status: string | null;
    visibleMonsters: RawMonster[];
    allVisibleSelected: boolean;
    onCollection: (value: string) => void;
    onFilter: (value: string) => void;
    onSession: (value: string) => void;
    onToggleMonster: (name: string, checked: boolean) => void;
    onToggleVisible: (checked: boolean) => void;
    };

function MonsterReview(props: MonsterReviewProps)
{
    return (
        <div className="monster-import-review">
            <div className="monster-import-tools">
                <Form.Control
                    className="monster-import-filter"
                    type="text"
                    placeholder="Filter monsters..."
                    value={props.filter}
                    onChange={event => props.onFilter(event.target.value)}
                />
                <Form.Check
                    className="monster-import-select-all"
                    type="checkbox"
                    label={`${props.allVisibleSelected ? 'Deselect' : 'Select'} visible`}
                    checked={props.allVisibleSelected}
                    onChange={event => props.onToggleVisible(event.target.checked)}
                />
                <Form.Group className="monster-import-meta-field">
                    <Form.Label>Collection</Form.Label>
                    <Form.Control
                        type="text"
                        value={props.collection}
                        onChange={event => props.onCollection(event.target.value)}
                    />
                </Form.Group>
                <Form.Group className="monster-import-meta-field">
                    <Form.Label>Session</Form.Label>
                    <Form.Control
                        type="text"
                        value={props.session}
                        onChange={event => props.onSession(event.target.value)}
                    />
                </Form.Group>
            </div>

            {props.status && <span className="text-muted">{props.status}</span>}

            <div className="monster-import-list">
                {props.visibleMonsters.map(monster =>
                {
                    const conflict = props.conflicts.has(monster.name);

                    return (
                    <label key={`${monster.source ?? props.loadedSet.source}-${monster.name}`} className={['monster-import-row', conflict ? 'conflict' : ''].filter(Boolean).join(' ')}>
                        <span className="monster-import-name">{monster.name}</span>
                        <span className="monster-import-check">
                            {conflict && <span className="monster-import-warning" title="This monster already exists">!</span>}
                            <Form.Check
                                type="checkbox"
                                aria-label={`Import ${monster.name}`}
                                checked={props.selected.has(monster.name)}
                                onChange={event => props.onToggleMonster(monster.name, event.target.checked)}
                            />
                        </span>
                    </label>
                    );
                })}
            </div>
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

function sourceLabel(set: MonsterSet, sourceLabels: Record<string, string>): string
{
    return sourceLabels[set.source] ?? prettySourceCode(set.source);
}

function prettySourceCode(source: string): string
{
    return source
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/-/g, ' - ');
}

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

function sortMonsters(monsters: RawMonster[], conflicts: Set<string>): RawMonster[]
{
    return [...monsters].sort((a, b) =>
    {
        const conflictSort = Number(conflicts.has(b.name)) - Number(conflicts.has(a.name));
        return conflictSort || a.name.localeCompare(b.name);
    });
}
