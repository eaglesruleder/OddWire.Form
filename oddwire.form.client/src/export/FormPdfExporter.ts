import type { FormDefinition } from '../_context';
import { InstanceEntity } from '../_context';
import type { PdfTemplateRecord } from '../_context';

import appSettings from '../AppSettings.json';

import { flattenInstance } from './flattenInstance';
import type { FlattenedInstanceExport } from './flattenInstance';
import { PdfWriter } from './PdfWriter';

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

        this.writePlacedValues(writer, flattened);
        writer.drawGrid(appSettings.export.pdf.showGrid);

        return writer.toBlob();
    }

    private writePlacedValues(writer: PdfWriter, flattened: FlattenedInstanceExport): void
    {
        for (const field of flattened.pdf)
            for (const [pageKey, boxes] of Object.entries(field.pages))
                for (const box of boxes)
                    writer.writeText(pageIndex(pageKey), String(field.value ?? ''), box, field.fontSize);
    }
}

function pageIndex(page: string): number
{
    const index = Number.parseInt(page, 10);
    return Number.isFinite(index) && index >= 0 ? index : 0;
}
