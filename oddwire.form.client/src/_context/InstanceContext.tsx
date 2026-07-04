import { createContext } from 'react';

import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance } from './types';
import testInstance from './data/instances/testinstance.json';

// The live instance as a behaviour-carrying object: the sparse overlay plus the
// operations over it (get / resolve / setValue), so consumers hold one thing, not
// an array plus a bag of free helpers.
export class FormActiveInstance implements FormInstance
{
    readonly formId?: string;
    readonly instanceId?: string;
    readonly controls: ControlInstance[];

    constructor(instance: FormInstance)
    {
        this.formId = instance.formId;
        this.instanceId = instance.instanceId;
        this.controls = instance.controls;
    }

    get(param: string): ControlInstance | undefined
    {
        const matches = this.controls.filter(control => control.param === param);

        // MVP rule: last matching param wins; warn so a duplicate does not resolve silently.
        if (matches.length > 1)
            console.warn(`[instance] duplicate param '${param}' (${matches.length} entries) — last wins`);

        return matches[matches.length - 1];
    }

    resolve(control: ControlDef): ControlDef
    {
        // Merge boundary: instance overrides any form prop by key; cast once past the JSON-shaped overlay.
        return { ...control, ...this.get(control.param) } as unknown as ControlDef;
    }

    setValue(param: string, control: Record<string, unknown>): FormActiveInstance
    {
        // Intent: return a new instance — a mutated one would not re-render. `control` is the whole
        // merged patch for this param (caller spreads get(param) + the changed key), so this just upserts.
        const merged: ControlInstance = { ...control, param };

        const existing = this.controls.some(existingControl => existingControl.param === param);

        const controls = existing
        ?   this.controls.map(existingControl => existingControl.param === param ? merged : existingControl)
        :   [...this.controls, merged];

        return new FormActiveInstance({ ...this, controls });
    }
}

export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormActiveInstance>;
    set: (instance: FormInstance) => void;
    };

// Intent: getInstance / set mirror the FormContext API shape — durable pathways to code against.
// This stub default is only a fallback; ContextsProvider supplies the persistent-store implementation.
export const instanceContextValue: InstanceContextValue =
    {getInstance: async () => new FormActiveInstance(testInstance as unknown as FormInstance)
    ,set: () => {}
    };

export const InstanceContext = createContext<InstanceContextValue>(instanceContextValue);
