import type { PDFFont, PDFPage } from 'pdf-lib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { ControlPdfBox } from '../_components/controllist';
import type { PdfTemplateRecord } from '../_context';

const PAGE_SIZE: [number, number] = [612, 792];
const DEFAULT_FONT_SIZE = 11;
const PDF_TYPE = 'application/pdf';

const GRID_THICKNESS = 0.5;
const GRID_COLOR = rgb(0, 0.35, 1);
const GRID_OPACITY = 0.3;
const GRID_LABEL_SIZE = 6;
const GRID_LABEL_COLOR = rgb(1, 0, 0);

export class PdfWriter
{
    private readonly pdf: PDFDocument;
    private readonly font: PDFFont;
    private readonly fontSize: number;

    private constructor(pdf: PDFDocument, font: PDFFont, fontSize: number)
    {
        this.pdf = pdf;
        this.font = font;
        this.fontSize = fontSize;
    }

    // Intent: fontSize <= 0 means "auto" — fall back to the page-scaled default
    static async create(template?: PdfTemplateRecord, fontSize = 0): Promise<PdfWriter>
    {
        const pdf = template ? await createFromTemplate(template) : await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);

        return new PdfWriter(pdf, font, fontSize);
    }

    // Intent: size precedence — per-box override, then the configured default, then page-scaled auto
    writeText(pageIndex: number, value: string, box: ControlPdfBox): void
    {
        const page = this.page(pageIndex);
        const boxSize = box.fontSize ?? 0;

        page.drawText(value, {
            x: box.x,
            y: box.y,
            size: boxSize > 0 ? boxSize : this.fontSize > 0 ? this.fontSize : fontSizeFor(page),
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

    // Intent: calibration overlay — a coordinate ruler so box {x,y} can be authored against the template
    drawGrid(spacing: number): void
    {
        if (spacing <= 0)
            return;

        for (const page of this.pdf.getPages())
            this.drawPageGrid(page, spacing);
    }

    async toBlob(): Promise<Blob>
    {
        const bytes = await this.pdf.save();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

        return new Blob([buffer], { type: PDF_TYPE });
    }

    private drawPageGrid(page: PDFPage, spacing: number): void
    {
        const width = page.getWidth();
        const height = page.getHeight();

        for (let x = spacing; x < width; x += spacing)
        {
            page.drawLine(
                { start: { x, y: 0 }
                , end:   { x, y: height }
                , thickness: GRID_THICKNESS
                , color: GRID_COLOR
                , opacity: GRID_OPACITY
                });
            this.drawGridLabel(page, String(x), x + 1, 1);
        }

        for (let y = spacing; y < height; y += spacing)
        {
            page.drawLine(
                { start: { x: 0,     y }
                , end:   { x: width, y }
                , thickness: GRID_THICKNESS
                , color: GRID_COLOR
                , opacity: GRID_OPACITY
                });
            this.drawGridLabel(page, String(y), 1, y + 1);
        }
    }

    private drawGridLabel(page: PDFPage, text: string, x: number, y: number): void
    {
        page.drawText(text, {
            x,
            y,
            size: GRID_LABEL_SIZE,
            font: this.font,
            color: GRID_LABEL_COLOR,
            });
    }

    private page(index: number): PDFPage
    {
        while (this.pdf.getPageCount() <= index)
            this.pdf.addPage(PAGE_SIZE);

        return this.pdf.getPage(index);
    }
}

function fontSizeFor(page: PDFPage): number
{
    return Math.min(DEFAULT_FONT_SIZE * (page.getHeight() / PAGE_SIZE[1]), 14);
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
