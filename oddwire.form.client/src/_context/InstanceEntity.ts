import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance } from './types';

export type InstanceChange = (value: unknown, key: string, subkey?: string) => void;

// Intent: overlay controls onto base by param (overlay fields win per-param); params only in an overlay are added
export function mergeInstances(base: FormInstance, ...overlays: FormInstance[]): FormInstance
{
    const byParam = new Map<string, ControlInstance>();

    for (const control of base.controls)
        byParam.set(control.param, { ...control });

    for (const overlay of overlays)
        for (const control of overlay.controls)
            byParam.set(control.param, { ...byParam.get(control.param), ...control });

    return { ...base, controls: [...byParam.values()] };
}

const PERSIST_DEBOUNCE_MS = 400;

// Intent: the live-data root — holds the overlay, applies edits (key-lossy), and owns debounced persistence so callers
// don't save the whole instance on every keystroke. React rendering stays with the caller (this class is store-agnostic).
export class InstanceEntity
{
    instance: FormInstance;

    private onPersist?: (instance: FormInstance) => void;
    private timer?: ReturnType<typeof setTimeout>;

    constructor(instance: FormInstance)
    {
        this.instance = instance;
    }

    static from(instance: FormInstance): InstanceEntity
    {
        return new InstanceEntity({ ...instance, instanceId: instance.instanceId ?? crypto.randomUUID() });
    }

    // Intent: opt into debounced persistence — edits schedule onPersist; flush()/cancelPersist() control the pending write
    withPersist(onPersist: (instance: FormInstance) => void): this
    {
        this.onPersist = onPersist;
        return this;
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

    setValue(param: string, subkey: string, value: unknown): void
    {
        this.applyValue(param, subkey, value);
        this.schedulePersist();
    }

    // Intent: batch a param→value record in one pass (e.g. dbOptions.fill) — one persist, not one per column
    setValues(values: Record<string, unknown>): void
    {
        for (const [param, value] of Object.entries(values))
            this.applyValue(param, 'value', value);

        this.schedulePersist();
    }

    setControls(values: Record<string, Record<string, unknown>>): void
    {
        for (const [param, value] of Object.entries(values))
            this.applyControl(param, value);

        this.schedulePersist();
    }

    // Intent: key-lossy — a null/empty value drops the param entry entirely rather than storing an empty
    private applyValue(param: string, subkey: string, value: unknown): void
    {
        if (subkey === 'value' && (value === null || value === undefined || value === ''))
        {
            this.instance = { ...this.instance, controls: this.instance.controls.filter(control => control.param !== param) };
            return;
        }

        const merged: ControlInstance = { ...this.get(param), param, [subkey]: value };

        const exists = this.instance.controls.some(control => control.param === param);

        const controls = exists
        ?   this.instance.controls.map(control => control.param === param ? merged : control)
        :   [...this.instance.controls, merged];

        this.instance = { ...this.instance, controls };
    }

    private applyControl(param: string, value: Record<string, unknown>): void
    {
        const merged: ControlInstance = { ...this.get(param), param, ...value };

        const exists = this.instance.controls.some(control => control.param === param);

        const controls = exists
        ?   this.instance.controls.map(control => control.param === param ? merged : control)
        :   [...this.instance.controls, merged];

        this.instance = { ...this.instance, controls };
    }

    private schedulePersist(): void
    {
        if (!this.onPersist)
            return;

        if (this.timer)
            clearTimeout(this.timer);

        this.timer = setTimeout(() =>
        {
            this.timer = undefined;
            this.onPersist?.(this.instance);
        }, PERSIST_DEBOUNCE_MS);
    }

    // Intent: force a pending persist now — call on unmount / navigation / before a hard save so edits aren't lost
    flush(): void
    {
        if (!this.timer)
            return;

        clearTimeout(this.timer);
        this.timer = undefined;
        this.onPersist?.(this.instance);
    }

    // Intent: drop a pending persist without firing it (after a hard save already wrote the whole instance)
    cancelPersist(): void
    {
        if (this.timer)
        {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
}
