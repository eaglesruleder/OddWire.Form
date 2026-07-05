import { createContext } from 'react';

import type { FormDefinition, FormIndexEntry } from './types';

export type FormContextValue = {
    getForm: (formId: string) => Promise<FormDefinition | undefined>;
    list: () => FormIndexEntry[];
    };

export const formContextValue: FormContextValue =
    {getForm: async () => undefined
    ,list: () => []
    };

export const FormContext = createContext<FormContextValue>(formContextValue);
