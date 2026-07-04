import { Component } from 'react';
import type { ReactNode } from 'react';

import { InstanceContext } from './InstanceContext';
import type { InstanceContextValue } from './InstanceContext';
import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance } from './types';

export type InstanceChange = (value: unknown, param: string, key?: string) => void;

type InstanceEntityProps = {
    instanceId: string;
    children: (instance: InstanceEntity, onChange: InstanceChange) => ReactNode;
    };

// The live instance as one thing: a value object (get / resolve / setValue over the sparse overlay)
// that is ALSO a React component. Mounted, it loads itself from the InstanceContext repo, re-renders
// its children on edit, and writes each change back. Detached (InstanceEntity.from(data)), the same
// read/merge methods work as a plain object — the overlay lives in a field, not React state, so
// nothing here touches React until you actually render it.
export class InstanceEntity extends Component<InstanceEntityProps>
{
    static contextType = InstanceContext;
    declare context: InstanceContextValue;

    instance: FormInstance = { controls: [] };
    private loaded = false;

    // Object mode — build a detached entity around plain data, no React lifecycle involved.
    static from(instance: FormInstance): InstanceEntity
    {
        const entity = new InstanceEntity({ instanceId: instance.instanceId ?? '', children: () => null });
        entity.instance = instance;
        entity.loaded = true;
        return entity;
    }

    get(param: string): ControlInstance | undefined
    {
        const matches = this.instance.controls.filter(control => control.param === param);

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

    setValue(param: string, key: string, value: unknown): void
    {
        // Merge the changed key into this param's control (the entity's job, not the repo's).
        const merged: ControlInstance = { ...this.get(param), param, [key]: value };

        const exists = this.instance.controls.some(control => control.param === param);

        const controls = exists
        ?   this.instance.controls.map(control => control.param === param ? merged : control)
        :   [...this.instance.controls, merged];

        // Point the field at a fresh object — don't mutate the repo's instance in place (getInstance
        // hands back its own reference). The entity mutates; the repo's copy only changes via set.
        this.instance = { ...this.instance, controls };
    }

    async componentDidMount()
    {
        this.instance = await this.context.getInstance(this.props.instanceId);
        this.loaded = true;
        this.forceUpdate();
    }

    onChange: InstanceChange = (value, param, key = 'value') =>
    {
        this.setValue(param, key, value);
        this.context.set(this.instance, this.props.instanceId);
        this.forceUpdate();
    };

    render()
    {
        if (!this.loaded)
            return null;

        return this.props.children(this, this.onChange);
    }
}
