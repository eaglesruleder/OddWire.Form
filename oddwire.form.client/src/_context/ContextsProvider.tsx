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
        persistent.initialise();
        setInitialised(true);
    }, []);

    if (!initialised)
        return (
            <StripLayout title="OddWire Forms">
                <div className="center">Initialising…</div>
            </StripLayout>
            );

    return (
        <FormContext.Provider value={persistent}>
            <InstanceContext.Provider value={persistent}>
                {children}
            </InstanceContext.Provider>
        </FormContext.Provider>
        );
}
