import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { FormContext, formStore } from './FormContext';
import { InstanceContext, instanceStore } from './InstanceContext';
import { StripLayout } from '../_components/layout';

export function ContextsProvider({ children }: { children: ReactNode })
{
    const [initialised, setInitialised] = useState(formStore.initialised && instanceStore.initialised);

    useEffect(() =>
    {
        let active = true;

        // Intent: forms first — instance display projection reads the form index
        (async () =>
        {
            await formStore.initialise();
            await instanceStore.initialise();

            if (active)
                setInitialised(true);
        })();

        return () => { active = false; };
    }, []);

    if (!initialised)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Initialising…</div>
            </StripLayout>
            );

    return (
        <FormContext.Provider value={formStore}>
            <InstanceContext.Provider value={instanceStore}>
                {children}
            </InstanceContext.Provider>
        </FormContext.Provider>
        );
}
