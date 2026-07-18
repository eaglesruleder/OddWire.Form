import type { FormDefinition } from '../_context';
import { InstanceEntity } from '../_context';
import type { PdfTemplateRecord, FormImageContextValue } from '../_context';
import type { ControlPdfBox } from '../_components/controllist';
import { isCapturedImage } from '../_components/controllist';

import appSettings from '../AppSettings.json';

import { flattenInstance } from './flattenInstance';
import type { FlattenedInstanceExport, FlattenedPdfField } from './flattenInstance';
import { PdfWriter } from './PdfWriter';
import { rasterizeToPng } from './rasterizeImage';

// Intent: rasterize a placed image only to its box footprint — a first-pass reference PDF stays light with 20+ images;
// full-res stays in the blob store (server source-of-truth later). External-URL image values are skipped, not embedded.
const PDF_IMAGE_DPI = 150;

export class FormPdfExporter
{
    private readonly form: FormDefinition;
    private readonly instance: InstanceEntity;
    private readonly template?: PdfTemplateRecord;
    private readonly images?: FormImageContextValue;

    constructor(form: FormDefinition, instance: InstanceEntity, template?: PdfTemplateRecord, images?: FormImageContextValue)
    {
        this.form = form;
        this.instance = instance;
        this.template = template;
        this.images = images;
    }

    async export(): Promise<Blob>
    {
        const flattened = flattenInstance(this.form, this.instance);
        const writer = await PdfWriter.create(this.template, appSettings.export.pdf.fontSize);

        await this.writePlacedValues(writer, flattened);
        writer.drawGrid(appSettings.export.pdf.showGrid);

        return writer.toBlob();
    }

    private async writePlacedValues(writer: PdfWriter, flattened: FlattenedInstanceExport): Promise<void>
    {
        for (const field of flattened.pdf)
            if (field.image)
                await this.writeImageField(writer, field);
            else
                for (const [pageKey, boxes] of Object.entries(field.pages))
                    for (const box of boxes)
                        writer.writeText(pageIndex(pageKey), renderText(field.value), box);
    }

    // Intent: only captured images print (external-URL values are skipped); each box rasterizes the full-res blob down to
    // its own footprint, so differently-sized boxes each carry only the pixels they show.
    private async writeImageField(writer: PdfWriter, field: FlattenedPdfField): Promise<void>
    {
        if (!isCapturedImage(field.value))
            return;

        const record = await this.images?.getImage(field.value.id);
        if (!record)
            return;

        for (const [pageKey, boxes] of Object.entries(field.pages))
            for (const box of boxes)
            {
                const png = await rasterizeToPng(record.blob, boxTargetPx(box));
                if (png)
                    await writer.drawImage(pageIndex(pageKey), png, box);
            }
    }
}

// Intent: PDF box w/h are points (1/72"); convert to a pixel target at PDF_IMAGE_DPI for the downscale
function boxTargetPx(box: ControlPdfBox): { w: number; h: number }
{
    const scale = PDF_IMAGE_DPI / 72;
    return { w: Math.round((box.w ?? 0) * scale), h: Math.round((box.h ?? 0) * scale) };
}

// Intent: PDF-only formatting — a boolean checkbox prints 'X' when true, blank when false (custom glyph overrides are future).
// The flattened value stays a real boolean so API export still posts true/false.
const CHECKBOX_TRUE = 'X';

function renderText(value: unknown): string
{
    if (typeof value === 'boolean')
        return value ? CHECKBOX_TRUE : '';

    return String(value ?? '');
}

function pageIndex(page: string): number
{
    const index = Number.parseInt(page, 10);
    return Number.isFinite(index) && index >= 0 ? index : 0;
}
