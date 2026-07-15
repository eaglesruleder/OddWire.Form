import type { PDFFont, PDFPage } from 'pdf-lib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { ControlPdfBox } from '../_components/controllist';
import type { PdfTemplateRecord } from '../_context';

const PAGE_SIZE: [number, number] = [612, 792];
const DEFAULT_FONT_SIZE = 11;
const PDF_TYPE = 'application/pdf';

const MIN_FONT_SIZE = 5;
const ELLIPSIS = '…';

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

    writeText(pageIndex: number, value: string, box: ControlPdfBox): void
    {
        if (!value)
            return;

        const page = this.page(pageIndex);
        const baseSize = this.sizeFor(box, page);

        // Intent: no width -> single line at the anchor (fast path, prior behaviour)
        if (!box.w)
        {
            const y = alignedY(box, this.font.heightAtSize(baseSize));
            page.drawText(value, { x: alignedX(box, this.font.widthOfTextAtSize(value, baseSize)), y, size: baseSize, font: this.font, color: rgb(0, 0, 0) });
            return;
        }

        const size = box.shrinkToFit ? this.shrunkToFit(value, box, baseSize) : baseSize;
        let lines = wrapLines(this.font, value, size, box.w);

        if (!box.shrinkToFit && box.h)
            lines = this.clampToHeight(lines, box, size);

        this.drawLines(page, lines, box, size);
    }

    // Intent: size precedence — per-box override, then the configured default, then page-scaled auto
    private sizeFor(box: ControlPdfBox, page: PDFPage): number
    {
        const boxSize = box.fontSize ?? 0;
        return boxSize > 0 ? boxSize : this.fontSize > 0 ? this.fontSize : fontSizeFor(page);
    }

    // Intent: shrink the font one step at a time until the wrapped block fits the box's w (and h, if given), floored at MIN_FONT_SIZE
    private shrunkToFit(value: string, box: ControlPdfBox, startSize: number): number
    {
        let size = startSize;

        while (size > MIN_FONT_SIZE)
        {
            const lines = wrapLines(this.font, value, size, box.w ?? 0);
            const widest = Math.max(...lines.map(line => this.font.widthOfTextAtSize(line, size)));
            const blockHeight = lines.length * this.font.heightAtSize(size);

            if (widest <= (box.w ?? 0)
            &&  (!box.h || blockHeight <= box.h)
                )
                break;

            size -= 1;
        }

        return size;
    }

    // Intent: keep only the lines that fit h; mark truncation with an ellipsis on the last kept line
    private clampToHeight(lines: string[], box: ControlPdfBox, size: number): string[]
    {
        const maxLines = Math.max(1, Math.floor((box.h ?? 0) / this.font.heightAtSize(size)));

        if (lines.length <= maxLines)
            return lines;

        const kept = lines.slice(0, maxLines);
        kept[maxLines - 1] = ellipsize(this.font, kept[maxLines - 1], size, box.w ?? 0);
        return kept;
    }

    // Intent: stack wrapped lines top-to-bottom; the block is valign-placed and each line is align-placed by its own width
    private drawLines(page: PDFPage, lines: string[], box: ControlPdfBox, size: number): void
    {
        const lineHeight = this.font.heightAtSize(size);
        const bottomBaseline = alignedY(box, lines.length * lineHeight);   // baseline of the last (bottom) line

        lines.forEach((line, index) =>
        {
            const x = alignedX(box, this.font.widthOfTextAtSize(line, size));
            const y = bottomBaseline + (lines.length - 1 - index) * lineHeight;
            page.drawText(line, { x, y, size, font: this.font, color: rgb(0, 0, 0) });
        });
    }

    // Intent: draw pre-rasterized PNG bytes fit-contained (aspect-preserved) and centered inside the box
    async drawImage(pageIndex: number, pngBytes: Uint8Array, box: ControlPdfBox): Promise<void>
    {
        const boxW = box.w ?? 0;
        const boxH = box.h ?? 0;

        if (boxW <= 0 || boxH <= 0)
            return;

        const page = this.page(pageIndex);
        const image = await this.pdf.embedPng(pngBytes);
        const scale = Math.min(boxW / image.width, boxH / image.height);
        const width = image.width * scale;
        const height = image.height * scale;

        page.drawImage(image, { x: box.x + (boxW - width) / 2, y: box.y + (boxH - height) / 2, width, height });
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

// Intent: w = 0 (no width) collapses the box to the x anchor, so the same offset both aligns within a box and anchors a point
function alignedX(box: ControlPdfBox, textWidth: number): number
{
    const w = box.w ?? 0;

    switch (box.align)
    {
        case 'center': return box.x + (w - textWidth) / 2;
        case 'right':  return box.x + w - textWidth;   // right edge at x+w (or at x when no width) — text extends left
        default:       return box.x;                   // left / unset
    }
}

// Intent: greedy word-wrap to maxWidth; a single word wider than the box is left on its own line rather than dropped
function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[]
{
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length === 0)
        return [text];

    const lines: string[] = [];
    let line = '';

    for (const word of words)
    {
        const candidate = line ? `${line} ${word}` : word;

        if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth)
            line = candidate;
        else
        {
            lines.push(line);
            line = word;
        }
    }

    if (line)
        lines.push(line);

    return lines;
}

// Intent: trim characters until text + '…' fits maxWidth
function ellipsize(font: PDFFont, text: string, size: number, maxWidth: number): string
{
    let clipped = text;

    while (clipped.length > 0 && font.widthOfTextAtSize(clipped + ELLIPSIS, size) > maxWidth)
        clipped = clipped.slice(0, -1);

    return clipped.trimEnd() + ELLIPSIS;
}

// Intent: pdf-lib y is the text baseline; valign 'bottom' keeps the baseline at box.y (the prior default)
function alignedY(box: ControlPdfBox, textHeight: number): number
{
    const h = box.h ?? 0;

    switch (box.valign)
    {
        case 'middle': return box.y + (h - textHeight) / 2;
        case 'top':    return box.y + h - textHeight;
        default:       return box.y;                   // bottom / unset
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
