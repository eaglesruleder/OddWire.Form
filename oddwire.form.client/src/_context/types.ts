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
