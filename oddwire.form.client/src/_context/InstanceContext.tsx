import { createContext } from 'react';

import type { FormInstance } from './types';
import testInstance from './data/instances/testinstance.json';

export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormInstance | undefined>;
    set: (instance: FormInstance, instanceId: string) => void;
    save: (instance: FormInstance, instanceId?: string) => string;
    };

export const instanceContextValue: InstanceContextValue =
    {getInstance: async () => testInstance as unknown as FormInstance
    ,set: () => {}
    ,save: () => ''
    };

export const InstanceContext = createContext<InstanceContextValue>(instanceContextValue);
