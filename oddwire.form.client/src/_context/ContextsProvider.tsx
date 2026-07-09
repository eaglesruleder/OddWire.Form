import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { FormContext, formStore } from './FormContext';
import { InstanceContext, instanceStore } from './InstanceContext';
import { LookupContext, lookupStore } from './LookupContext';
import { PdfTemplateContext, pdfTemplateStore } from './PdfTemplateContext';
import { StripLayout } from '../_components/layout';

export function ContextsProvider({ children }: { children: ReactNode })
{
    const [initialised, setInitialised] = useState(formStore.initialised && instanceStore.initialised && lookupStore.initialised && pdfTemplateStore.initialised);

    useEffect(() =>
    {
        let active = true;

        // Intent: forms first — instance display projection reads the form index
        (async () =>
        {
            await formStore.initialise();
            await instanceStore.initialise();
            await lookupStore.initialise();
            await pdfTemplateStore.initialise();

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
                <LookupContext.Provider value={lookupStore}>
                    <PdfTemplateContext.Provider value={pdfTemplateStore}>
                        {children}
                    </PdfTemplateContext.Provider>
                </LookupContext.Provider>
            </InstanceContext.Provider>
        </FormContext.Provider>
        );
}
