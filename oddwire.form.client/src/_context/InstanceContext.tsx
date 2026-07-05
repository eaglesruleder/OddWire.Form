import { createContext } from 'react';
import localforage from 'localforage';

import type { FormInstance, ControlInstance, InstanceIndexEntry } from './types';

import { formStore } from './FormContext';
import { upsert } from './storeUtils';
import testInstance from './data/instances/testinstance.json';

const INDEX_KEY = 'index';

const seedInstances =
    [testInstance
    ] as unknown as FormInstance[];

const storage = localforage.createInstance({ name: 'oddwire.form', storeName: 'instances' });

function compressDuplicates(instance: FormInstance): FormInstance
{
    const byParam = new Map<string, ControlInstance>();

    for (const control of instance.controls)
        byParam.set(control.param, control);

    if (byParam.size === instance.controls.length)
        return instance;

    return { ...instance, controls: [...byParam.values()] };
}

export type InstanceContextValue = {
    getInstance: (instanceId: string) => Promise<FormInstance | undefined>;
    list: (formId: string) => InstanceIndexEntry[];
    save: (instance: FormInstance) => Promise<string>;
    };

class InstanceStore implements InstanceContextValue
{
    initialised = false;
    index: InstanceIndexEntry[] = [];

    async initialise()
    {
        if (this.initialised)
            return;

        this.index = await storage.getItem<InstanceIndexEntry[]>(INDEX_KEY) ?? [];

        if (this.index.length === 0)
            for (const instance of seedInstances)
                await this.save(instance);

        this.initialised = true;
    }

    getInstance = async (instanceId: string): Promise<FormInstance | undefined> =>
    {
        const body = await storage.getItem<FormInstance>(instanceId);
        return body ? compressDuplicates(body) : undefined;
    };

    list = (formId: string): InstanceIndexEntry[] =>
        this.index.filter(entry => entry.formId === formId);

    save = async (instance: FormInstance): Promise<string> =>
    {
        instance.instanceId ??= crypto.randomUUID();
        instance.dateModified = new Date().toISOString();

        const body = compressDuplicates(instance);

        await storage.setItem(instance.instanceId, body);
        await this.refreshIndex(body);

        return instance.instanceId;
    };

    // Intent: called by FormStore when a form's displayParam changes — re-project every affected instance
    reindexForm = async (formId: string): Promise<void> =>
    {
        const affected = this.index.filter(entry => entry.formId === formId);

        for (const entry of affected)
        {
            const body = await storage.getItem<FormInstance>(entry.instanceId);
            if (body)
                await this.refreshIndex(body);
        }
    };

    private refreshIndex = async (instance: FormInstance): Promise<void> =>
    {
        const entry: InstanceIndexEntry =
            {instanceId: instance.instanceId as string
            ,formId: instance.formId
            ,dateModified: instance.dateModified
            ,display: this.projectDisplay(instance)
            };

        this.index = upsert(this.index, entry, e => e.instanceId === instance.instanceId);
        await storage.setItem(INDEX_KEY, this.index);
    };

    // Intent: display is a form concern — read displayParam off the form store (FK-style navigation)
    private projectDisplay = (instance: FormInstance): Record<string, unknown> =>
    {
        const displayParam = formStore.getDisplayParam(instance.formId ?? '');

        const display: Record<string, unknown> = {};
        for (const param of displayParam)
            display[param] = instance.controls.find(control => control.param === param)?.value;

        return display;
    };
}

export const instanceStore = new InstanceStore();

export const InstanceContext = createContext<InstanceContextValue>(instanceStore);
