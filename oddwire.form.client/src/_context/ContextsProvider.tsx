import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { FormContext } from './FormContext';
import { InstanceContext } from './InstanceContext';
import { persistent } from './persistentStore';
import { StripLayout } from '../_components/layout';

export function ContextsProvider({ children }: { children: ReactNode })
{
    const [initialised, setInitialised] = useState(persistent.initialised);

    useEffect(() =>
    {
        let active = true;

        persistent.initialise().then(() =>
        {
            if (active)
                setInitialised(true);
        });

        return () => { active = false; };
    }, []);

    if (!initialised)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Initialising…</div>
            </StripLayout>
            );

    return (
        <FormContext.Provider value={{ getForm: persistent.getForm, list: persistent.listForms }}>
            <InstanceContext.Provider value={{ getInstance: persistent.getInstance, list: persistent.listInstances, save: persistent.saveInstance }}>
                {children}
            </InstanceContext.Provider>
        </FormContext.Provider>
        );
}
