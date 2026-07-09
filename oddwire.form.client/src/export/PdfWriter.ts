import type { PDFFont, PDFPage } from 'pdf-lib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { ControlPdfBox } from '../_components/controllist';
import type { PdfTemplateRecord } from '../_context';

const PAGE_SIZE: [number, number] = [612, 792];
const DEFAULT_FONT_SIZE = 11;
const PDF_TYPE = 'application/pdf';

export class PdfWriter
{
    private readonly pdf: PDFDocument;
    private readonly font: PDFFont;

    private constructor(pdf: PDFDocument, font: PDFFont)
    {
        this.pdf = pdf;
        this.font = font;
    }

    static async create(template?: PdfTemplateRecord): Promise<PdfWriter>
    {
        const pdf = template ? await createFromTemplate(template) : await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);

        return new PdfWriter(pdf, font);
    }

    writeText(pageIndex: number, value: string, box: ControlPdfBox): void
    {
        const page = this.page(pageIndex);

        page.drawText(value, {
            x: box.x,
            y: box.y,
            size: DEFAULT_FONT_SIZE,
            font: this.font,
            color: rgb(0, 0, 0),
            maxWidth: box.w,
            });
    }

    writeLines(lines: string[], options: { x: number; y: number; lineHeight: number; marginBottom: number }): void
    {
        let pageIndex = 0;
        let y = options.y;

        for (const line of lines)
        {
            if (y < options.marginBottom)
            {
                pageIndex++;
                y = this.page(pageIndex).getHeight() - options.marginBottom;
            }

            this.writeText(pageIndex, line, { x: options.x, y });
            y -= options.lineHeight;
        }
    }

    async toBlob(): Promise<Blob>
    {
        const bytes = await this.pdf.save();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

        return new Blob([buffer], { type: PDF_TYPE });
    }

    private page(index: number): PDFPage
    {
        while (this.pdf.getPageCount() <= index)
            this.pdf.addPage(PAGE_SIZE);

        return this.pdf.getPage(index);
    }
}

async function createFromTemplate(template: PdfTemplateRecord): Promise<PDFDocument>
{
    const bytes = await template.blob.arrayBuffer();

    if (isPdf(template))
        return PDFDocument.load(bytes);

    const pdf = await PDFDocument.create();
    const image = isPng(template)
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    return pdf;
}

function isPdf(template: PdfTemplateRecord): boolean
{
    return template.type === 'application/pdf'
    ||  template.fileName.toLowerCase().endsWith('.pdf');
}

function isPng(template: PdfTemplateRecord): boolean
{
    return template.type === 'image/png'
    ||  template.fileName.toLowerCase().endsWith('.png');
}
