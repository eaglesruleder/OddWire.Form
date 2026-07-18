import JSZip from 'jszip';

import type { FormDefinition, PdfTemplateRecord } from '../../_context';

export type BundledFormPackage = {
    form: FormDefinition;
    template?: Omit<PdfTemplateRecord, 'formId'>;
    };

export async function loadFormPackage(url: string): Promise<BundledFormPackage>
{
    const zip = await JSZip.loadAsync(await (await fetch(url)).arrayBuffer());
    const formEntry = zip.file('form.json');

    if (!formEntry)
        throw new Error('Package missing form.json');

    const form = JSON.parse(await formEntry.async('string')) as FormDefinition;
    const templateEntry = pdfTemplateEntry(zip);

    return {
        form,
        template: templateEntry
            ?   {
                    fileName: fileName(templateEntry.name),
                    type: contentType(templateEntry.name),
                    blob: await templateEntry.async('blob'),
                    }
            :   undefined,
        };
}

function pdfTemplateEntry(zip: JSZip): JSZip.JSZipObject | undefined
{
    return Object.values(zip.files)
        .find(entry => !entry.dir && normalisePath(entry.name).startsWith('export/pdf/'));
}

function fileName(path: string): string
{
    const normalised = normalisePath(path);

    return normalised.split('/').pop() ?? normalised;
}

function contentType(path: string): string
{
    const lower = path.toLowerCase();

    if (lower.endsWith('.pdf'))
        return 'application/pdf';

    if (lower.endsWith('.png'))
        return 'image/png';

    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';

    return 'application/octet-stream';
}

function normalisePath(path: string): string
{
    return path.replaceAll('\\', '/');
}
