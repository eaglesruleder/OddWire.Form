import { createContext } from 'react';
import localforage from 'localforage';

import type { FormDefinition, FormIndexEntry } from './types';
import { upsert } from './storeUtils';
import testForm from './data/forms/testform.json';

const INDEX_KEY = 'index';

const seedForms =
    [testForm
    ] as unknown as FormDefinition[];

const storage = localforage.createInstance({ name: 'oddwire.form', storeName: 'forms' });

export type FormContextValue = {
    getForm: (formId: string) => Promise<FormDefinition | undefined>;
    list: () => FormIndexEntry[];
    saveForm: (form: FormDefinition) => Promise<string>;
    };

class FormStore implements FormContextValue
{
    initialised = false;
    index: FormIndexEntry[] = [];

    async initialise()
    {
        if (this.initialised)
            return;

        this.index = await storage.getItem<FormIndexEntry[]>(INDEX_KEY) ?? [];

        if (this.index.length === 0)
            for (const form of seedForms)
                await this.saveForm(form);

        this.initialised = true;
    }

    getForm = async (formId: string): Promise<FormDefinition | undefined> =>
        await storage.getItem<FormDefinition>(formId) ?? undefined;

    list = (): FormIndexEntry[] =>
        this.index;

    getDisplayParam = (formId: string): string[] =>
        this.index.find(entry => entry.formId === formId)?.displayParam ?? [];

    saveForm = async (form: FormDefinition): Promise<string> =>
    {
        // Intent: identity lives on the object, not the storage key — key is derived from it
        form.formId ??= crypto.randomUUID();
        form.dateModified = new Date().toISOString();

        await storage.setItem(form.formId, form);
        await this.refreshIndex(form);

        return form.formId;
    };

    private refreshIndex = async (form: FormDefinition): Promise<void> =>
    {
        const entry: FormIndexEntry =
            {formId: form.formId
            ,label: form.label
            ,version: form.version
            ,displayParam: form.displayParam
            ,dateModified: form.dateModified
            };

        this.index = upsert(this.index, entry, e => e.formId === form.formId);
        await storage.setItem(INDEX_KEY, this.index);
    };
}

export const formStore = new FormStore();

export const FormContext = createContext<FormContextValue>(formStore);
