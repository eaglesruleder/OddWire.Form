import { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { InstanceContext } from './InstanceContext';
import type { FormActiveInstance } from './InstanceContext';

export type InstanceChange = (value: unknown, param: string, key?: string) => void;

type InstanceEntityProps = {
    instanceId: string;
    children: (instance: FormActiveInstance, onChange: InstanceChange) => ReactNode;
    };

// Owns the live instance (the active document) as a render-prop microcontext over the InstanceContext
// API: loads it, applies an edit by param/key, and writes each change back through the context.
export function InstanceEntity({ instanceId, children }: InstanceEntityProps)
{
    const instanceContext = useContext(InstanceContext);

    const [instance, setInstance] = useState<FormActiveInstance | null>(null);

    useEffect(() =>
    {
        let active = true;

        instanceContext.getInstance(instanceId).then(loaded =>
        {
            if (active)
                setInstance(loaded);
        });

        return () => { active = false; };
    }, [instanceContext, instanceId]);

    // Default key to 'value': a value-editing control names only what changed; other props override by key.
    const onChange: InstanceChange = (value, param, key = 'value') =>
    {
        if (!instance)
            return;

        const next = instance.setValue(param, { ...instance.get(param), [key]: value });
        setInstance(next);
        instanceContext.set(next);
    };

    if (!instance)
        return null;

    return <>{children(instance, onChange)}</>;
}
