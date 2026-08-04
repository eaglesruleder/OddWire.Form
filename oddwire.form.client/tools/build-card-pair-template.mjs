import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { degrees, PDFDocument } from 'pdf-lib';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');

const defaults = {
    cover: path.resolve(clientRoot, 'src/mods/5etools/forms/Cover.png'),
    page: path.resolve(clientRoot, 'src/mods/5etools/forms/Page.png'),
    stat: path.resolve(clientRoot, 'src/mods/5etools/forms/Monster Stats.png'),
    out: path.resolve(clientRoot, 'src/mods/5etools/forms/monster-card-pair-template.pdf'),
    };

const args = parseArgs(process.argv.slice(2));
const coverPath = path.resolve(args.cover ?? defaults.cover);
const pagePath = path.resolve(args.page ?? defaults.page);
const statPath = path.resolve(args.stat ?? defaults.stat);
const outPath = path.resolve(args.out ?? defaults.out);

const pdf = await PDFDocument.create();
const cover = await embedPng(pdf, coverPath);
const page = await embedPng(pdf, pagePath);
const stat = await embedPng(pdf, statPath);

assertSameSize(cover, page, stat);

const cardW = cover.width;
const cardH = cover.height;
const pairSize = [cardW, cardH * 2];

const front = pdf.addPage(pairSize);
drawRotatedTop(front, cover, cardW, cardH);
front.drawImage(stat, { x: 0, y: 0, width: cardW, height: cardH });

const back = pdf.addPage(pairSize);
drawRotatedTop(back, page, cardW, cardH);
back.drawImage(page, { x: 0, y: 0, width: cardW, height: cardH });

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, await pdf.save());

console.log(`Wrote ${outPath}`);
console.log(`Pair page size: ${cardW} x ${cardH * 2}`);

async function embedPng(pdfDoc, filePath)
{
    return pdfDoc.embedPng(await readFile(filePath));
}

function drawRotatedTop(targetPage, image, cardW, cardH)
{
    targetPage.drawImage(image, {
        x: cardW,
        y: cardH * 2,
        width: cardW,
        height: cardH,
        rotate: degrees(180),
        });
}

function assertSameSize(...images)
{
    const [first] = images;
    const mismatch = images.find(image => image.width !== first.width || image.height !== first.height);

    if (mismatch)
        throw new Error('All card source PNGs must have the same width and height.');
}

function parseArgs(argv)
{
    const parsed = {};

    for (let i = 0; i < argv.length; i++)
    {
        const key = argv[i];

        if (!key.startsWith('--'))
            throw new Error(`Unexpected argument: ${key}`);

        const value = argv[++i];
        if (!value)
            throw new Error(`Missing value for ${key}`);

        parsed[key.slice(2)] = value;
    }

    return parsed;
}
