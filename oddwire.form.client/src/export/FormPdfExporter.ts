import type { FormDefinition } from '../_context';
import { InstanceEntity } from '../_context';

import { flattenInstance } from './flattenInstance';
import type { FlattenedInstanceExport } from './flattenInstance';
import { PdfWriter } from './PdfWriter';

export class FormPdfExporter
{
    private readonly form: FormDefinition;
    private readonly instance: InstanceEntity;

    constructor(form: FormDefinition, instance: InstanceEntity)
    {
        this.form = form;
        this.instance = instance;
    }

    async export(): Promise<Blob>
    {
        const flattened = flattenInstance(this.form, this.instance);
        const writer = await PdfWriter.create();

        this.writePlacedValues(writer, flattened);

        return writer.toBlob();
    }

    private writePlacedValues(writer: PdfWriter, flattened: FlattenedInstanceExport): void
    {
        for (const field of flattened.pdf)
            for (const [pageKey, boxes] of Object.entries(field.pages))
                for (const box of boxes)
                    writer.writeText(pageIndex(pageKey), String(field.value ?? ''), box);
    }
}

function pageIndex(page: string): number
{
    const index = Number.parseInt(page, 10);
    return Number.isFinite(index) && index >= 0 ? index : 0;
}
