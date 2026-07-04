import { createContext } from 'react';

import type { FormInstance } from './types';
import testInstance from './data/instances/testinstance.json';

export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormInstance>;
    set: (instance: FormInstance, instanceId: string) => void;
    };

export const instanceContextValue: InstanceContextValue =
    {getInstance: async () => testInstance as unknown as FormInstance
    ,set: () => {}
    };

export const InstanceContext = createContext<InstanceContextValue>(instanceContextValue);
