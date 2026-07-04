import localforage from 'localforage';

import type { FormDefinition, FormInstance } from './types';
import { FormActiveInstance } from './InstanceContext';
import testForm from './data/forms/testform.json';
import testInstance from './data/instances/testinstance.json';

// Bundled seed JSON — loaded into storage on first run only. The JSON boundary cast lives here, once.
const seedForms =
    [testForm
    ] as unknown as FormDefinition[];

const seedInstances =
    [testInstance
    ] as unknown as FormInstance[];

const FORMS_KEY = 'forms';
const INSTANCES_KEY = 'instances';

// IndexedDB-backed store (localforage): survives refresh and stores structured/binary values natively,
// so PDF/image blobs slot in later without base64 bloat. localStorage is the automatic fallback driver.
const storage = localforage.createInstance({ name: 'oddwire.form' });

class PersistentStore
{
    initialised = false;
    forms: FormDefinition[] = [];
    instances: FormInstance[] = [];

    // Load persisted state; seed from bundled JSON on first run. Async — this is what the splash waits on.
    async initialise()
    {
        if (this.initialised)
            return;

        this.forms = await this.loadOrSeed(FORMS_KEY, seedForms);
        this.instances = await this.loadOrSeed(INSTANCES_KEY, seedInstances);

        this.initialised = true;
    }

    private async loadOrSeed<T>(key: string, seed: T[]): Promise<T[]>
    {
        const stored = await storage.getItem<T[]>(key);

        if (stored)
            return stored;

        await storage.setItem(key, seed);
        return seed;
    }

    getForm = async (formId: string): Promise<FormDefinition> =>
        this.forms.find(form => form.formId === formId) as FormDefinition;

    getInstance = async (instanceId: string): Promise<FormActiveInstance> =>
        new FormActiveInstance(this.instances.find(instance => instance.instanceId === instanceId) ?? { controls: [] });

    // Upsert the instance by instanceId and persist the array — the autosave write-back path.
    set = async (instance: FormInstance): Promise<void> =>
    {
        const plain: FormInstance = { ...instance };

        const index = this.instances.findIndex(stored => stored.instanceId === plain.instanceId);

        if (index >= 0)
            this.instances[index] = plain;
        else
            this.instances.push(plain);

        await storage.setItem(INSTANCES_KEY, this.instances);
    };
}

export const persistent = new PersistentStore();
