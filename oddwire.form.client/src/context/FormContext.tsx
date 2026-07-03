import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { FormDefinition } from '../_components/controls/controlTypes';
import testForm from '../data/forms/testform.json';

type FormContextValue = {
    getForm: (formId: string) => Promise<FormDefinition>;
    };

// Intent: getForm is the durable pathway FormPage codes against. This body is a stub that
// ignores the id and always returns the test form. Later it scans src/data/forms and reads
// from loaded context — only this body changes, not FormPage's async load pathway.
const formContextValue: FormContextValue =
    {getForm: async () => testForm as unknown as FormDefinition
    };

const FormContext = createContext<FormContextValue>(formContextValue);

export const useFormContext = () => useContext(FormContext);

export const FormProvider = ({ children }: { children: ReactNode }) =>
    <FormContext.Provider value={formContextValue}>
        {children}
    </FormContext.Provider>;
