import type { ControlDef } from '../_components/controllist';

export type FormDefinition = {
    formId: string;
    label?: string;
    version?: string;
    displayParam?: string[];
    dateModified?: string;
    controls: ControlDef[];
    };

export type ControlInstance = {
    param: string;
    [key: string]: unknown;
    };

export type FormInstance = {
    formId?: string;
    instanceId?: string;
    dateModified?: string;
    controls: ControlInstance[];
    };

export type FormIndexEntry = {
    formId: string;
    label?: string;
    version?: string;
    displayParam?: string[];
    dateModified?: string;
    };

export type InstanceIndexEntry = {
    instanceId: string;
    formId?: string;
    dateModified?: string;
    display: Record<string, unknown>;
    };

// Intent: '_global' is the reserved scope key holding shared tables; real formIds hold form-local overrides
export const GLOBAL_SCOPE = '_global';

export type LookupTable = {
    tableName: string;
    lastUpdated?: string;
    schema: ControlDef[];
    rows: Record<string, unknown>[];
    };

// Intent: scope → tableName → table; get(formId) merges db[_global] under db[formId]
export type LookupDatabase = Record<string, Record<string, LookupTable>>;
