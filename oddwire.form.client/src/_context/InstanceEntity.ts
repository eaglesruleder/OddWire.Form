import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance } from './types';

export type InstanceChange = (value: unknown, param: string, key?: string) => void;

export class InstanceEntity
{
    instance: FormInstance;

    constructor(instance: FormInstance)
    {
        this.instance = instance;
    }

    static from(instance: FormInstance): InstanceEntity
    {
        return new InstanceEntity({ ...instance, instanceId: instance.instanceId ?? crypto.randomUUID() });
    }

    get instanceId(): string
    {
        return this.instance.instanceId as string;
    }

    get(param: string): ControlInstance | undefined
    {
        const matches = this.instance.controls.filter(control => control.param === param);

        if (matches.length > 1)
            console.warn(`[instance] duplicate param '${param}' (${matches.length} entries) — last wins`);

        return matches[matches.length - 1];
    }

    resolve(control: ControlDef): ControlDef
    {
        return { ...control, ...this.get(control.param) } as unknown as ControlDef;
    }

    setValue(param: string, key: string, value: unknown): void
    {
        const merged: ControlInstance = { ...this.get(param), param, [key]: value };

        const exists = this.instance.controls.some(control => control.param === param);

        const controls = exists
        ?   this.instance.controls.map(control => control.param === param ? merged : control)
        :   [...this.instance.controls, merged];

        this.instance = { ...this.instance, controls };
    }
}
