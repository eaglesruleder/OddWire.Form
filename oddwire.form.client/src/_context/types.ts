import type { ControlDef } from '../_components/controllist';

export type FormDefinition = {
    formId: string;
    label?: string;
    controls: ControlDef[];
    };

export type ControlInstance = {
    param: string;
    [key: string]: unknown;
    };

export type FormInstance = {
    formId?: string;
    instanceId?: string;
    controls: ControlInstance[];
    };
