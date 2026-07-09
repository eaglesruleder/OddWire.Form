import type { FlattenedInstanceExport } from './flattenInstance';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const MARGIN = 48;
const LINE_H = 16;
const PAGE_SIZE: [number, number] = [612, 792];

export async function valuesPdf(exported: FlattenedInstanceExport): Promise<Blob>
{
    const lines =
        [exported.label ?? 'Form Export'
        ,`Form ID: ${exported.formId}`
        ,`Instance ID: ${exported.instanceId ?? ''}`
        ,''
        ,...valueLines(exported.values)
        ];

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    let page = pdf.addPage(PAGE_SIZE);
    let y = page.getHeight() - MARGIN;

    for (const line of lines)
    {
        if (y < MARGIN)
        {
            page = pdf.addPage(PAGE_SIZE);
            y = page.getHeight() - MARGIN;
        }

        page.drawText(line, {
            x: MARGIN,
            y,
            size: 11,
            font,
            color: rgb(0, 0, 0),
            });
        y -= LINE_H;
    }

    const bytes = await pdf.save();
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Blob([buffer], { type: 'application/pdf' });
}

function valueLines(values: Record<string, unknown>): string[]
{
    const lines: string[] = [];

    for (const [key, value] of Object.entries(values))
        lines.push(...formatValue(key, value));

    return lines;
}

function formatValue(key: string, value: unknown): string[]
{
    if (Array.isArray(value))
        return [`${key}:`, ...value.flatMap((entry, index) => formatValue(`  ${index + 1}`, entry))];

    if (typeof value === 'object' && value !== null)
        return [`${key}:`, ...Object.entries(value).flatMap(([childKey, childValue]) => formatValue(`  ${childKey}`, childValue))];

    return [`${key}: ${String(value ?? '')}`];
}
