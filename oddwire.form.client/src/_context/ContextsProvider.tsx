import type { ReactNode } from 'react';

import { FormContext, formContextValue } from './FormContext';
import { InstanceContext, instanceContextValue } from './InstanceContext';

export const ContextsProvider = ({ children }: { children: ReactNode }) =>
    <FormContext.Provider value={formContextValue}>
        <InstanceContext.Provider value={instanceContextValue}>
            {children}
        </InstanceContext.Provider>
    </FormContext.Provider>;
