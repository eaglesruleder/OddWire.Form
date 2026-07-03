import { createContext } from 'react';

import type { FormDefinition } from './types';
import testForm from './data/forms/testform.json';

export type FormContextValue = {
    getForm: (formId: string) => Promise<FormDefinition>;
    };

// Intent: getForm is the future pathway to code against. This body is currently a stub.
export const formContextValue: FormContextValue =
    {getForm: async () => testForm as unknown as FormDefinition
    };

export const FormContext = createContext<FormContextValue>(formContextValue);
