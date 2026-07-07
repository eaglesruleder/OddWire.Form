import type { ControlDef } from '../../_components/controllist';

type Row = Record<string, unknown>;

export const keyOf = (row: Row, keyParam: string): string =>
    String(row[keyParam] ?? '');

// Intent: display a row as "key · secondColumn" (or just the key) — used by the picker and the dup-resolve popup
export function rowLabel(schema: ControlDef[], keyParam: string, row: Row): string
{
    const key = keyOf(row, keyParam);
    const labelParam = schema[1]?.param;
    const extra = labelParam ? row[labelParam] : undefined;

    return extra !== undefined && extra !== null && extra !== '' ? `${key} · ${extra}` : (key || '(empty)');
}

// Intent: upsert incoming rows into existing — a colliding key is overwritten only if ticked, else the existing row stays;
// non-colliding incoming rows are appended. Preserves existing order.
export function mergeRows(existing: Row[], incoming: Row[], keyParam: string, overwrite: Set<string>): Row[]
{
    const incomingByKey = new Map(incoming.map(row => [keyOf(row, keyParam), row]));
    const existingKeys = new Set(existing.map(row => keyOf(row, keyParam)));

    const merged = existing.map(row =>
    {
        const key = keyOf(row, keyParam);
        return overwrite.has(key) && incomingByKey.has(key) ? incomingByKey.get(key)! : row;
    });

    for (const row of incoming)
        if (!existingKeys.has(keyOf(row, keyParam)))
            merged.push(row);

    return merged;
}

// Intent: incoming rows whose key already exists — the set the dup-resolve popup asks about
export function collisionsOf(existing: Row[], incoming: Row[], keyParam: string): Row[]
{
    const existingKeys = new Set(existing.map(row => keyOf(row, keyParam)));
    return incoming.filter(row => existingKeys.has(keyOf(row, keyParam)));
}
