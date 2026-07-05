import { createContext } from 'react';

import type { FormInstance, InstanceIndexEntry } from './types';

export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormInstance | undefined>;
    list: (formId: string) => InstanceIndexEntry[];
    save: (instance: FormInstance) => Promise<string>;
    };

export const instanceContextValue: InstanceContextValue =
    {getInstance: async () => undefined
    ,list: () => []
    ,save: async () => ''
    };

export const InstanceContext = createContext<InstanceContextValue>(instanceContextValue);
