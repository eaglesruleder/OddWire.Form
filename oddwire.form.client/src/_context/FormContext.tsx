import { createContext } from 'react';

import type { FormDefinition } from '../_components/controllist/controls/controlTypes';
import testForm from './data/forms/testform.json';

export type FormContextValue = {
    getForm: (formId: string) => Promise<FormDefinition>;
    };

// Intent: getForm is the durable pathway FormPage codes against. This body is a stub that
// ignores the id and always returns the test form. Later it scans _context/data/forms and
// reads from loaded context — only this body changes, not FormPage's async load pathway.
export const formContextValue: FormContextValue =
    {getForm: async () => testForm as unknown as FormDefinition
    };

export const FormContext = createContext<FormContextValue>(formContextValue);
