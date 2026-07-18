import { createContext } from 'react';
import localforage from 'localforage';

const storage = localforage.createInstance({ name: 'oddwire.form', storeName: 'formImages' });

// Intent: the full-res captured image is owned here as a Blob; the instance value carries only { id, thumbnail }.
// Metadata rides in the record (not a separate manifest) so imagesFor()/orphan sweeps are one iterate(), no index drift.
export type StoredImage = {
    id: string;
    formId: string;
    instanceId: string;
    param: string;
    mime: string;
    w: number;
    h: number;
    blob: Blob;
    };

export type FormImageContextValue = {
    saveImage: (record: StoredImage) => Promise<void>;
    getImage: (id: string) => Promise<StoredImage | undefined>;
    deleteImage: (id: string) => Promise<void>;
    imagesFor: (match: { formId?: string; instanceId?: string }) => Promise<StoredImage[]>;
    getObjectUrl: (id: string) => Promise<string | undefined>;
    revoke: (id: string) => void;
    };

class FormImageStore implements FormImageContextValue
{
    initialised = false;

    // Intent: session-scoped object-URL cache — resolve once, reuse across renders/popups, revoke centrally on delete
    private readonly urlCache = new Map<string, string>();

    async initialise()
    {
        this.initialised = true;
    }

    saveImage = async (record: StoredImage): Promise<void> =>
    {
        await storage.setItem(record.id, record);
    };

    getImage = async (id: string): Promise<StoredImage | undefined> =>
        await storage.getItem<StoredImage>(id) ?? undefined;

    deleteImage = async (id: string): Promise<void> =>
    {
        this.revoke(id);
        await storage.removeItem(id);
    };

    imagesFor = async (match: { formId?: string; instanceId?: string }): Promise<StoredImage[]> =>
    {
        const out: StoredImage[] = [];

        await storage.iterate<StoredImage, void>(record =>
        {
            if ((match.formId === undefined     || record.formId === match.formId)
            &&  (match.instanceId === undefined || record.instanceId === match.instanceId)
                )
                out.push(record);
        });

        return out;
    };

    getObjectUrl = async (id: string): Promise<string | undefined> =>
    {
        const cached = this.urlCache.get(id);
        if (cached)
            return cached;

        const record = await this.getImage(id);
        if (!record)
            return undefined;

        const url = URL.createObjectURL(record.blob);
        this.urlCache.set(id, url);
        return url;
    };

    revoke = (id: string): void =>
    {
        const url = this.urlCache.get(id);
        if (url)
        {
            URL.revokeObjectURL(url);
            this.urlCache.delete(id);
        }
    };
}

export const formImageStore = new FormImageStore();

export const FormImageContext = createContext<FormImageContextValue>(formImageStore);
