import localforage from 'localforage';

import type
    {FormDefinition
    ,FormInstance
    ,ControlInstance
    ,FormIndexEntry
    ,InstanceIndexEntry
    } from './types';
import testForm from './data/forms/testform.json';
import testInstance from './data/instances/testinstance.json';

const seedForms =
    [testForm
    ] as unknown as FormDefinition[];

const seedInstances =
    [testInstance
    ] as unknown as FormInstance[];

const FORMS_INDEX = 'forms-index';
const INSTANCES_INDEX = 'instances-index';
const FORM_BODY = 'form';
const INSTANCE_BODY = 'instance';

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
    formsIndex: FormIndexEntry[] = [];
    instancesIndex: InstanceIndexEntry[] = [];

    async initialise()
    {
        if (this.initialised)
            return;

        this.formsIndex = await storage.getItem<FormIndexEntry[]>(FORMS_INDEX) ?? [];
        this.instancesIndex = await storage.getItem<InstanceIndexEntry[]>(INSTANCES_INDEX) ?? [];

        if (this.formsIndex.length === 0)
            for (const form of seedForms)
                await this.saveForm(form);

        if (this.instancesIndex.length === 0)
            for (const instance of seedInstances)
                await this.saveInstance(instance);

        this.initialised = true;
    }

    //#region Reads

    getForm = async (formId: string): Promise<FormDefinition | undefined> =>
        await storage.getItem<FormDefinition>(`${FORM_BODY}:${formId}`) ?? undefined;

    getInstance = async (instanceId: string): Promise<FormInstance | undefined> =>
    {
        const body = await storage.getItem<FormInstance>(`${INSTANCE_BODY}:${instanceId}`);
        return body ? compressDuplicates(body) : undefined;
    };

    listForms = (): FormIndexEntry[] =>
        this.formsIndex;

    listInstances = (formId: string): InstanceIndexEntry[] =>
        this.instancesIndex.filter(entry => entry.formId === formId);

    //#endregion

    //#region Writes

    saveForm = async (form: FormDefinition): Promise<string> =>
    {
        // Intent: identity lives on the object, not the storage key — key is derived from it
        form.formId ??= crypto.randomUUID();
        form.dateModified = new Date().toISOString();

        await storage.setItem(`${FORM_BODY}:${form.formId}`, form);
        await this.refreshFormIndex(form);

        return form.formId;
    };

    saveInstance = async (instance: FormInstance): Promise<string> =>
    {
        instance.instanceId ??= crypto.randomUUID();
        instance.dateModified = new Date().toISOString();

        const body = compressDuplicates(instance);

        await storage.setItem(`${INSTANCE_BODY}:${instance.instanceId}`, body);
        await this.refreshInstanceIndex(body);

        return instance.instanceId;
    };

    //#endregion

    //#region Index projection

    private refreshFormIndex = async (form: FormDefinition): Promise<void> =>
    {
        const entry: FormIndexEntry =
            {formId: form.formId
            ,label: form.label
            ,version: form.version
            ,displayParam: form.displayParam
            ,dateModified: form.dateModified
            };

        this.formsIndex = upsert(this.formsIndex, entry, e => e.formId === form.formId);
        await storage.setItem(FORMS_INDEX, this.formsIndex);
    };

    private refreshInstanceIndex = async (instance: FormInstance): Promise<void> =>
    {
        const entry: InstanceIndexEntry =
            {instanceId: instance.instanceId as string
            ,formId: instance.formId
            ,dateModified: instance.dateModified
            ,display: this.projectDisplay(instance)
            };

        this.instancesIndex = upsert(this.instancesIndex, entry, e => e.instanceId === instance.instanceId);
        await storage.setItem(INSTANCES_INDEX, this.instancesIndex);
    };

    private projectDisplay = (instance: FormInstance): Record<string, unknown> =>
    {
        const displayParam = this.formsIndex.find(form => form.formId === instance.formId)?.displayParam ?? [];

        const display: Record<string, unknown> = {};
        for (const param of displayParam)
            display[param] = instance.controls.find(control => control.param === param)?.value;

        return display;
    };

    //#endregion
}

function upsert<T>(list: T[], entry: T, match: (item: T) => boolean): T[]
{
    const index = list.findIndex(match);

    if (index < 0)
        return [...list, entry];

    const next = [...list];
    next[index] = entry;
    return next;
}

export const persistent = new PersistentStore();
