import { createContext } from 'react';

// Intent: lets a deep control (ControlImage's save-gate) hard-save the in-memory instance and read whether it is persisted
// yet — supplied live by FormPage, consumed via useContext so no save handler is prop-drilled through the control tree.
export type FormActionsContextValue = {
    requestSave: () => Promise<string | undefined>;   // hard-saves the current instance, resolves its id
    isSaved: boolean;                                  // false while a new instance is in-memory only (pre-first-save)
    };

export const FormActionsContext = createContext<FormActionsContextValue>({ requestSave: async () => undefined, isSaved: false });
