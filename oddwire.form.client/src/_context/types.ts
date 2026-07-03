import type { ControlDef } from '../_components/controllist';

export type FormDefinition = {
    formId: string;
    label?: string;
    controls: ControlDef[];
    };
