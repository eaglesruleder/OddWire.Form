import { createContext } from 'react';

import type { LookupTable } from '../../../_context';

// Intent: the aggregated per-form table map — FormPage builds it via lookupStore.get(formId) and provides it here
export const DbContext = createContext<Record<string, LookupTable>>({});
