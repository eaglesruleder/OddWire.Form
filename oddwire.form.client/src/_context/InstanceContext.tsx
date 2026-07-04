import { createContext } from 'react';

import type { FormInstance } from './types';
import testInstance from './data/instances/testinstance.json';

// Repo API — get/set instances by id, nothing more. The live document and its edit logic live on
// InstanceEntity, not here. This stub default is only a fallback; ContextsProvider supplies the
// persistent-store implementation.
export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormInstance>;
    set: (instance: FormInstance, instanceId: string) => void;
    };

export const instanceContextValue: InstanceContextValue =
    {getInstance: async () => testInstance as unknown as FormInstance
    ,set: () => {}
    };

export const InstanceContext = createContext<InstanceContextValue>(instanceContextValue);
