import localforage from 'localforage';

import type { FormDefinition, FormInstance, ControlInstance } from './types';
import testForm from './data/forms/testform.json';
import testInstance from './data/instances/testinstance.json';

const seedForms =
    [testForm
    ] as unknown as FormDefinition[];

const seedInstances =
    [testInstance
    ] as unknown as FormInstance[];

const FORMS_KEY = 'forms';
const INSTANCES_KEY = 'instances';

const storage = localforage.createInstance({ name: 'oddwire.form' });

function compressDuplicates(instance: FormInstance): FormInstance
{
    const byParam = new Map<string, ControlInstance>();

    for (const control of instance.controls)
        byParam.set(control.param, control);

    if (byParam.size === instance.controls.length)
        return instance;

    return { ...instance, controls: [...byParam.values()] };
}

class PersistentStore
{
    initialised = false;
    forms: FormDefinition[] = [];
    instances: FormInstance[] = [];

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

    getInstance = async (instanceId: string): Promise<FormInstance> =>
        compressDuplicates(this.instances.find(instance => instance.instanceId === instanceId) ?? { controls: [] });

    set = async (instance: FormInstance, instanceId: string): Promise<void> =>
    {
        const plain = compressDuplicates({ ...instance, instanceId });

        const index = this.instances.findIndex(stored => stored.instanceId === instanceId);

        if (index >= 0)
            this.instances[index] = plain;
        else
            this.instances.push(plain);

        await storage.setItem(INSTANCES_KEY, this.instances);
    };
}

export const persistent = new PersistentStore();
