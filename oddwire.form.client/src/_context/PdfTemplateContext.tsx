import { createContext } from 'react';
import localforage from 'localforage';

const TEMPLATE_KEY = 'template';

const storage = localforage.createInstance({ name: 'oddwire.form', storeName: 'pdfTemplates' });

export type PdfTemplateRecord = {
    formId: string;
    fileName: string;
    type: string;
    blob: Blob;
    };

export type PdfTemplateContextValue = {
    getTemplate: (formId: string) => Promise<PdfTemplateRecord | undefined>;
    saveTemplate: (formId: string, fileName: string, type: string, blob: Blob) => Promise<void>;
    };

class PdfTemplateStore implements PdfTemplateContextValue
{
    initialised = false;

    async initialise()
    {
        this.initialised = true;
    }

    getTemplate = async (formId: string): Promise<PdfTemplateRecord | undefined> =>
        await storage.getItem<PdfTemplateRecord>(keyOf(formId)) ?? undefined;

    saveTemplate = async (formId: string, fileName: string, type: string, blob: Blob): Promise<void> =>
    {
        await storage.setItem(keyOf(formId), { formId, fileName, type, blob });
    };
}

function keyOf(formId: string): string
{
    return `${formId}/${TEMPLATE_KEY}`;
}

export const pdfTemplateStore = new PdfTemplateStore();

export const PdfTemplateContext = createContext<PdfTemplateContextValue>(pdfTemplateStore);
