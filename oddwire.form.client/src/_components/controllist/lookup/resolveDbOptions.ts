import type { LookupTable } from '../../../_context';
import type { InstanceEntity } from '../../../_context';
import type { ControlOption, DbOptions } from '../controls/controlTypes';

export type ResolvedDbOptions = {
    controls: ControlOption[];
    disabled: boolean;
    placeholder?: string;
    };

// Intent: db missing or zero options → disabled + "No Options"; the acceptance-criteria fallback lives here
export function resolveDbOptions
    (dbOptions: DbOptions
    ,db: Record<string, LookupTable>
    ,instance: InstanceEntity
    ,staticControls: ControlOption[]
    ): ResolvedDbOptions
{
    const config = normalise(dbOptions, db);
    const table = db[config.table];

    if (!table)
        return { controls: staticControls, disabled: true, placeholder: 'No Options' };

    const rows = applyFilter(table.rows, config.filter, instance);

    const dbControls = rows.map(row =>
        ({value: String(row[config.valueParam] ?? '')
        ,label: String(row[config.labelParam ?? config.valueParam] ?? row[config.valueParam] ?? '')
        }));

    const controls = config.joinOptions
        ? [...staticControls, ...dbControls]
        : dbControls;

    if (controls.length === 0)
        return { controls, disabled: true, placeholder: 'No Options' };

    return { controls, disabled: false };
}

type NormalisedDbOptions = {
    table: string;
    valueParam: string;
    labelParam?: string;
    filter?: { formParam: string; tableParam: string };
    joinOptions?: boolean;
    };

// Intent: string shorthand is a bare table name — value/label default to the schema's first param
function normalise(dbOptions: DbOptions, db: Record<string, LookupTable>): NormalisedDbOptions
{
    if (typeof dbOptions === 'string')
    {
        const firstParam = db[dbOptions]?.schema[0]?.param ?? 'id';
        return { table: dbOptions, valueParam: firstParam, labelParam: firstParam };
    }

    return { ...dbOptions, filter: normaliseFilter(dbOptions.filter) };
}

// Intent: filter string means formParam === tableParam
function normaliseFilter(filter: string | { formParam: string; tableParam: string } | undefined): { formParam: string; tableParam: string } | undefined
{
    if (filter === undefined)
        return undefined;

    if (typeof filter === 'string')
        return { formParam: filter, tableParam: filter };

    return filter;
}

// Intent: dependent list — keep rows whose tableParam matches the instance's current formParam value; no upstream value → no options
function applyFilter
    (rows: Record<string, unknown>[]
    ,filter: { formParam: string; tableParam: string } | undefined
    ,instance: InstanceEntity
    ): Record<string, unknown>[]
{
    if (!filter)
        return rows;

    const formValue = instance.get(filter.formParam)?.value;

    if (formValue === undefined || formValue === null || formValue === '')
        return [];

    return rows.filter(row => row[filter.tableParam] === formValue);
}
