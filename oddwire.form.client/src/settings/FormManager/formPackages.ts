import JSZip from 'jszip';

import type { FormDefinition, PdfTemplateRecord } from '../../_context';

export type BundledFormPackage = {
    form: FormDefinition;
    template?: Omit<PdfTemplateRecord, 'formId'>;
    images: BundledImage[];   // images/<param>.<ext> → default value for the image control of that param
    };

// Intent: a package image maps to a control by filename stem — images/logo.png installs as the default of the 'logo' control
export type BundledImage = { param: string; fileName: string; mime: string; blob: Blob };

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
        images: await imageEntries(zip),
        };
}

function pdfTemplateEntry(zip: JSZip): JSZip.JSZipObject | undefined
{
    return Object.values(zip.files)
        .find(entry => !entry.dir && normalisePath(entry.name).startsWith('export/pdf/'));
}

async function imageEntries(zip: JSZip): Promise<BundledImage[]>
{
    const entries = Object.values(zip.files)
        .filter(entry => !entry.dir && normalisePath(entry.name).startsWith('images/'));

    return Promise.all(entries.map(async entry => (
        {param: paramOf(entry.name)
        ,fileName: fileName(entry.name)
        ,mime: contentType(entry.name)
        ,blob: await entry.async('blob')
        })));
}

// Intent: control param is the image filename without its extension (images/logo.png → 'logo')
function paramOf(path: string): string
{
    return fileName(path).replace(/\.[^.]+$/, '');
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
