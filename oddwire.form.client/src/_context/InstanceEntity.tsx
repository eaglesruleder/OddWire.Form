import { Component } from 'react';
import type { ReactNode } from 'react';

import { InstanceContext } from './InstanceContext';
import type { InstanceContextValue } from './InstanceContext';
import type { ControlDef } from '../_components/controllist';
import type { FormInstance, ControlInstance } from './types';

export type InstanceChange = (value: unknown, param: string, key?: string) => void;

type InstanceEntityProps = {
    instanceId: string;
    instance: FormInstance;
    children: (instance: InstanceEntity, onChange: InstanceChange) => ReactNode;
    };

export class InstanceEntity extends Component<InstanceEntityProps>
{
    static contextType = InstanceContext;
    declare context: InstanceContextValue;

    instance: FormInstance;

    constructor(props: InstanceEntityProps)
    {
        super(props);
        this.instance = props.instance;
    }

    static from(instance: FormInstance): InstanceEntity
    {
        return new InstanceEntity({ instanceId: instance.instanceId ?? '', instance, children: () => null });
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

    onChange: InstanceChange = (value, param, key = 'value') =>
    {
        this.setValue(param, key, value);
        this.context.set(this.instance, this.props.instanceId);
        this.forceUpdate();
    };

    render()
    {
        return this.props.children(this, this.onChange);
    }
}
