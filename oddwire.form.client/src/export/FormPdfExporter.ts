import type { FormDefinition } from '../_context';
import { InstanceEntity } from '../_context';
import type { PdfTemplateRecord } from '../_context';

import appSettings from '../AppSettings.json';

import { flattenInstance } from './flattenInstance';
import type { FlattenedInstanceExport } from './flattenInstance';
import { PdfWriter } from './PdfWriter';
import { rasterizeToPng } from './rasterizeImage';

export class FormPdfExporter
{
    private readonly form: FormDefinition;
    private readonly instance: InstanceEntity;
    private readonly template?: PdfTemplateRecord;

    constructor(form: FormDefinition, instance: InstanceEntity, template?: PdfTemplateRecord)
    {
        this.form = form;
        this.instance = instance;
        this.template = template;
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
        {
            // Intent: image fields rasterize once, then draw into every box; text fields draw per box
            const png = field.image ? await rasterizeToPng(String(field.value ?? '')) : null;

            for (const [pageKey, boxes] of Object.entries(field.pages))
                for (const box of boxes)
                    if (field.image)
                    {
                        if (png)
                            await writer.drawImage(pageIndex(pageKey), png, box);
                    }
                    else
                        writer.writeText(pageIndex(pageKey), String(field.value ?? ''), box);
        }
    }
}

function pageIndex(page: string): number
{
    const index = Number.parseInt(page, 10);
    return Number.isFinite(index) && index >= 0 ? index : 0;
}
