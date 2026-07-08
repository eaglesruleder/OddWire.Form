import { createContext } from 'react';
import localforage from 'localforage';

import type { ControlDef } from '../_components/controllist';
import type { LookupDatabase, LookupTable } from './types';
import { GLOBAL_SCOPE } from './types';

import modelLookup from './data/lookup/model.json';
import onLotLookup from './data/lookup/onlot.json';

const DB_KEY = 'db';

const seedTables =
    [modelLookup
    ,onLotLookup
    ] as unknown as LookupTable[];

const storage = localforage.createInstance({ name: 'oddwire.form', storeName: 'lookup' });

export type LookupContextValue = {
    // Intent: one aggregated map per form — global tables overlaid by form-local ones (local layer deferred)
    get: (formId?: string) => Record<string, LookupTable>;
    listTables: (scope: string) => LookupTable[];
    getTable: (scope: string, tableName: string) => LookupTable | undefined;
    saveTable: (scope: string, table: LookupTable) => Promise<void>;
    deleteTable: (scope: string, tableName: string) => Promise<void>;
    importRows: (scope: string, tableName: string, rows: Record<string, unknown>[], schema?: ControlDef[]) => Promise<void>;
    };

class LookupStore implements LookupContextValue
{
    initialised = false;
    db: LookupDatabase = {};

    async initialise()
    {
        if (this.initialised)
            return;

        this.db = await storage.getItem<LookupDatabase>(DB_KEY) ?? {};

        if (Object.keys(this.db).length === 0)
            for (const table of seedTables)
                await this.saveTable(GLOBAL_SCOPE, table);

        this.initialised = true;
    }

    // Intent: aggregate scope layers into one table map — db[formId][t] ?? db[_global][t], whole-table override
    get = (formId?: string): Record<string, LookupTable> =>
    {
        const merged: Record<string, LookupTable> = { ...(this.db[GLOBAL_SCOPE] ?? {}) };

        if (formId)
            for (const [tableName, table] of Object.entries(this.db[formId] ?? {}))
                merged[tableName] = table;

        return merged;
    };

    listTables = (scope: string): LookupTable[] =>
        Object.values(this.db[scope] ?? {});

    getTable = (scope: string, tableName: string): LookupTable | undefined =>
        this.db[scope]?.[tableName];

    saveTable = async (scope: string, table: LookupTable): Promise<void> =>
    {
        table.lastUpdated = new Date().toISOString();

        this.db = { ...this.db, [scope]: { ...this.db[scope], [table.tableName]: table } };
        await storage.setItem(DB_KEY, this.db);
    };

    deleteTable = async (scope: string, tableName: string): Promise<void> =>
    {
        const scopeTables = { ...this.db[scope] };
        delete scopeTables[tableName];

        this.db = { ...this.db, [scope]: scopeTables };
        await storage.setItem(DB_KEY, this.db);
    };

    // Intent: import replaces rows only — an existing table keeps its schema, a new one infers columns from the first row
    importRows = async (scope: string, tableName: string, rows: Record<string, unknown>[], schema?: ControlDef[]): Promise<void> =>
    {
        const existing = this.getTable(scope, tableName);

        const table: LookupTable =
            {tableName
            ,schema: schema ?? existing?.schema ?? inferSchema(rows)
            ,rows
            };

        await this.saveTable(scope, table);
    };
}

// Intent: no schema given — infer a text column per key on the first row so the row editor still renders
function inferSchema(rows: Record<string, unknown>[]): ControlDef[]
{
    const first = rows[0] ?? {};

    return Object.keys(first).map(param =>
        ({ type: 'text', param, label: param } as ControlDef));
}

export const lookupStore = new LookupStore();

export const LookupContext = createContext<LookupContextValue>(lookupStore);
