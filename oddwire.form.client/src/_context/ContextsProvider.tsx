import type { ReactNode } from 'react';

import { FormProvider } from './FormContext';
import { InstanceProvider } from './InstanceContext';

export const ContextsProvider = ({ children }: { children: ReactNode }) =>
    <FormProvider>
        <InstanceProvider>
            {children}
        </InstanceProvider>
    </FormProvider>;
