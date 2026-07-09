import type { FormDefinition } from '../_context';
import { InstanceEntity } from '../_context';

import { flattenInstance } from './flattenInstance';
import type { FlattenedInstanceExport } from './flattenInstance';
import { PdfWriter } from './PdfWriter';

const MARGIN = 48;
const LINE_H = 16;
const FALLBACK_TOP = 792 - MARGIN;

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

        if (flattened.pdf.length > 0)
            this.writePlacedValues(writer, flattened);
        else
            this.writeValueList(writer, flattened);

        return writer.toBlob();
    }

    private writePlacedValues(writer: PdfWriter, flattened: FlattenedInstanceExport): void
    {
        for (const field of flattened.pdf)
            for (const [pageKey, boxes] of Object.entries(field.pages))
                for (const box of boxes)
                    writer.writeText(pageIndex(pageKey), String(field.value ?? ''), box);
    }

    private writeValueList(writer: PdfWriter, flattened: FlattenedInstanceExport): void
    {
        writer.writeLines(valueLines(flattened), {
            x: MARGIN,
            y: FALLBACK_TOP,
            lineHeight: LINE_H,
            marginBottom: MARGIN,
            });
    }
}

function valueLines(flattened: FlattenedInstanceExport): string[]
{
    return [
        flattened.label ?? 'Form Export',
        `Form ID: ${flattened.formId}`,
        `Instance ID: ${flattened.instanceId ?? ''}`,
        '',
        ...Object.entries(flattened.values).flatMap(([key, value]) => formatValue(key, value)),
        ];
}

function formatValue(key: string, value: unknown): string[]
{
    if (Array.isArray(value))
        return [`${key}:`, ...value.flatMap((entry, index) => formatValue(`  ${index + 1}`, entry))];

    if (typeof value === 'object' && value !== null)
        return [`${key}:`, ...Object.entries(value).flatMap(([childKey, childValue]) => formatValue(`  ${childKey}`, childValue))];

    return [`${key}: ${String(value ?? '')}`];
}

function pageIndex(page: string): number
{
    const index = Number.parseInt(page, 10);
    return Number.isFinite(index) && index >= 0 ? index : 0;
}
