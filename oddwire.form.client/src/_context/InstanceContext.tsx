import { createContext } from 'react';

import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance } from './types';
import testInstance from './data/instances/testinstance.json';

export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormInstance>;
    };

// Intent: getInstance mirrors getForm — the durable pathway to code against; body is a stub for now.
export const instanceContextValue: InstanceContextValue =
    {getInstance: async () => testInstance as unknown as FormInstance
    };

export const InstanceContext = createContext<InstanceContextValue>(instanceContextValue);

// Instance-overlay helpers — colocated with the context that owns the instance, not a utils bucket.

export function findInstanceControl(controls: ControlInstance[], param: string): ControlInstance | undefined
{
    const matches = controls.filter(control => control.param === param);

    // MVP rule: last matching param wins; warn so a duplicate does not resolve silently.
    if (matches.length > 1)
        console.warn(`[instance] duplicate param '${param}' (${matches.length} entries) — last wins`);

    return matches[matches.length - 1];
}

export function resolveControl(formControl: ControlDef, instanceControl?: ControlInstance): ControlDef
{
    // Merge boundary: instance overrides any form prop by key; cast once past the JSON-shaped overlay.
    return { ...formControl, ...instanceControl } as unknown as ControlDef;
}

export function patchControlValue(instance: FormInstance, param: string, value: unknown): FormInstance
{
    // Intent: immutable array replacement — mutating in place does not re-render reliably.
    const existing = instance.controls.some(control => control.param === param);

    const controls = existing
    ?   instance.controls.map(control => control.param === param ? { ...control, value } : control)
    :   [...instance.controls, { param, value }];

    return { ...instance, controls };
}
