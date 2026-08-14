import { createContext } from 'react';
import localforage from 'localforage';

import type { ControlDef } from '../_components/controllist';
import type { DisplayParam, FormDefinition, FormIndexEntry, ParamList } from './types';

import { instanceStore } from './InstanceContext';
import { formImageStore } from './FormImageContext';
import { pdfTemplateStore } from './PdfTemplateContext';
import { installFormPackage } from './installFormPackage';
import { upsert } from './storeUtils';
import { loadFormPackage } from '../settings/FormManager/formPackages';
import aboutPackageUrl from './data/forms/about.zip?url';
import resumePackageUrl from './data/forms/resume.zip?url';
import monsterCardPackageUrl from '../mods/5etools/forms/monster-card.zip?url';
import ootaSession1PackageUrl from '../mods/5etools/forms/oota-session1.zip?url';

const INDEX_KEY = 'index';

const storage = localforage.createInstance({ name: 'oddwire.form', storeName: 'forms' });

function sameParams(a?: string[], b?: string[]): boolean
{
    if (a === b)
        return true;

    if (!a || !b || a.length !== b.length)
        return false;

    return a.every((param, i) => param === b[i]);
}

export function paramList(value: ParamList | undefined): string[]
{
    if (!value)
        return [];

    return Array.isArray(value) ? value : [value];
}

function projectionParams(form: Pick<FormIndexEntry, 'displayParam' | 'thumbnailParam' | 'groupParam' | 'filterParam' | 'orderParam'>): string[]
{
    return [
        ...displayParams(form.displayParam),
        ...(form.thumbnailParam ? [form.thumbnailParam] : []),
        ...paramList(form.groupParam),
        ...(form.filterParam ?? []),
        ...paramList(form.orderParam)
    ];
}

function displayParams(value: DisplayParam[] | undefined): string[]
{
    return (value ?? []).filter((param): param is string => typeof param === 'string');
}

function sameLabels(a: Record<string, string> | undefined, b: Record<string, string>, params: string[]): boolean
{
    return params.every(param => a?.[param] === b[param]);
}

export type FormContextValue = {
    getForm: (formId: string) => Promise<FormDefinition | undefined>;
    list: () => FormIndexEntry[];
    saveForm: (form: FormDefinition) => Promise<string>;
    deleteForm: (formId: string) => Promise<void>;
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
        {
            await this.installDefaultPackage(resumePackageUrl);
            await this.installDefaultPackage(aboutPackageUrl);
            await this.installDefaultPackage(monsterCardPackageUrl);
            await this.installDefaultPackage(ootaSession1PackageUrl);
        }

        this.initialised = true;
    }

    getForm = async (formId: string): Promise<FormDefinition | undefined> =>
        await storage.getItem<FormDefinition>(formId) ?? undefined;

    list = (): FormIndexEntry[] =>
        this.index;

    getDisplayParam = (formId: string): DisplayParam[] =>
        this.index.find(entry => entry.formId === formId)?.displayParam ?? [];

    getProjectionParams = (formId: string): Pick<FormIndexEntry, 'displayParam' | 'thumbnailParam' | 'groupParam' | 'filterParam' | 'orderParam' | 'projectionLabels'> =>
    {
        const entry = this.index.find(entry => entry.formId === formId);
        return {
            displayParam: entry?.displayParam,
            thumbnailParam: entry?.thumbnailParam,
            groupParam: entry?.groupParam,
            filterParam: entry?.filterParam,
            orderParam: entry?.orderParam,
            projectionLabels: entry?.projectionLabels
        };
    };

    saveForm = async (form: FormDefinition): Promise<string> =>
    {
        // Intent: identity lives on the object, not the storage key — key is derived from it
        form.formId ??= crypto.randomUUID();

        // Intent: forms are published elsewhere — persist dateModified as provided, never stamp it here
        // Intent: the prior displayParam is already cached in the index — no old-body load needed
        const prior = this.index.find(entry => entry.formId === form.formId);
        const projectedParams = projectionParams(form);
        const labels = controlLabels(form.controls);
        const projectionParamChanged = prior !== undefined
            && (!sameParams(projectionParams(prior), projectedParams) || !sameLabels(prior.projectionLabels, labels, projectedParams));

        await storage.setItem(form.formId, form);
        await this.refreshIndex(form, labels);

        // Intent: a changed displayParam invalidates every existing instance's cached display projection
        if (projectionParamChanged && instanceStore.list(form.formId).length > 0)
            await instanceStore.reindexForm(form.formId);

        return form.formId;
    };

    deleteForm = async (formId: string): Promise<void> =>
    {
        await storage.removeItem(formId);
        this.index = this.index.filter(entry => entry.formId !== formId);
        await storage.setItem(INDEX_KEY, this.index);
        await instanceStore.deleteFormInstances(formId);
    };

    private installDefaultPackage = async (url: string): Promise<void> =>
    {
        await installFormPackage(await loadFormPackage(url),
            {saveForm: this.saveForm
            ,saveInstance: instanceStore.save
            ,saveTemplate: pdfTemplateStore.saveTemplate
            ,images: formImageStore
            });
    };

    private refreshIndex = async (form: FormDefinition, labels = controlLabels(form.controls)): Promise<void> =>
    {
        const entry: FormIndexEntry =
            {formId: form.formId
            ,label: form.label
            ,version: form.version
            ,readonly: form.readonly
            ,displayParam: form.displayParam
            ,thumbnailParam: form.thumbnailParam
            ,thumbnailDefault: form.thumbnailParam ? controlDefault(form.controls, form.thumbnailParam) : undefined
            ,groupParam: form.groupParam
            ,filterParam: form.filterParam
            ,orderParam: form.orderParam
            ,projectionLabels: labels
            ,dateModified: form.dateModified
            };

        this.index = upsert(this.index, entry, e => e.formId === form.formId);
        await storage.setItem(INDEX_KEY, this.index);
    };
}

function controlLabels(controls: ControlDef[], labels: Record<string, string> = {}): Record<string, string>
{
    for (const control of controls)
    {
        labels[control.param] = control.label ?? labels[control.param] ?? control.param;

        if ('controls' in control && Array.isArray(control.controls) && isControlDefs(control.controls))
            controlLabels(control.controls, labels);
    }

    return labels;
}

// Intent: the form-level default value for a param (first control that actually carries one, recursing layout children) —
// lets the landing fall back to a shared default thumbnail for instances that never overrode it
function controlDefault(controls: ControlDef[], param: string): unknown
{
    for (const control of controls)
    {
        if (control.param === param && control.value !== undefined)
            return control.value;

        if ('controls' in control && Array.isArray(control.controls) && isControlDefs(control.controls))
        {
            const found = controlDefault(control.controls, param);
            if (found !== undefined)
                return found;
        }
    }

    return undefined;
}

function isControlDefs(controls: unknown[]): controls is ControlDef[]
{
    return controls.every(control =>
        typeof control === 'object'
        && control !== null
        && 'type' in control
        && 'param' in control);
}

export const formStore = new FormStore();

export const FormContext = createContext<FormContextValue>(formStore);
