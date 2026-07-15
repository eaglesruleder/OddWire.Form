// PDF box-placement preview.
//   node tools/box-preview.mjs [formName]     (default: monster-card)
// Reads src/AppSettings.json + src/_context/data/forms/<form>.json + <form>.png,
// then writes tools/box-preview.html — open it in any browser to see each control's
// pdf box drawn on the template at its resolved fontSize (control override -> settings default),
// over a coordinate grid. No server needed: the template is inlined as a data URI.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const clientRoot = join(here, '..');
const formsDir = join(clientRoot, 'src/_context/data/forms');

const formName = process.argv[2] || 'monster-card';
const settings = JSON.parse(readFileSync(join(clientRoot, 'src/AppSettings.json'), 'utf8'));
const form = JSON.parse(readFileSync(join(formsDir, `${formName}.json`), 'utf8'));
const pngB64 = readFileSync(join(formsDir, `${formName}.png`)).toString('base64');

const defaultSize = settings.export.pdf.fontSize;
const grid = settings.export.pdf.showGrid;

const boxes = [];
const walk = controls => controls.forEach(c =>
{
    if (c.pdf)
    {
        // mirror PdfWriter precedence: per-box override, else settings default
        for (const pageBoxes of Object.values(c.pdf))
            pageBoxes.forEach(b => boxes.push({ param: c.param, x: b.x, y: b.y, fontSize: b.fontSize > 0 ? b.fontSize : defaultSize }));
    }

    if (c.controls && ['tab', 'collapsible', 'popup', 'looper'].includes(c.type))
        walk(c.controls);
});
walk(form.controls);

const html = [
    '<!doctype html><meta charset=utf-8>',
    `<title>box-preview: ${formName}</title>`,
    '<body style="margin:0;background:#333"><canvas id=c></canvas>',
    '<script>',
    `const IMG='data:image/png;base64,${pngB64}';`,
    `const BOXES=${JSON.stringify(boxes)};`,
    `const GRID=${grid};`,
    `const img=new Image();img.onload=()=>{`,
    ` const W=img.width,H=img.height,cv=document.getElementById('c'),g=cv.getContext('2d');`,
    ` cv.width=W;cv.height=H;g.drawImage(img,0,0);`,
    ` g.lineWidth=0.5;g.strokeStyle='rgba(0,90,255,0.22)';g.textBaseline='bottom';`,
    ` for(let x=GRID;x<W;x+=GRID){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();g.font='7px Helvetica';g.fillStyle='rgba(255,0,0,0.5)';g.fillText(x,x+1,H-1);}`,
    ` for(let y=GRID;y<H;y+=GRID){const cy=H-y;g.beginPath();g.moveTo(0,cy);g.lineTo(W,cy);g.stroke();g.fillStyle='rgba(255,0,0,0.5)';g.fillText(y,1,cy-1);}`,
    // pdf y is bottom-left origin -> canvas y = H - y
    ` BOXES.forEach(b=>{const cy=H-b.y;g.fillStyle='rgba(220,0,0,0.85)';g.beginPath();g.arc(b.x,cy,3,0,7);g.fill();g.fillStyle='rgba(0,0,0,0.9)';g.font=b.fontSize+'px Helvetica';g.textBaseline='alphabetic';g.fillText(b.param,b.x,cy);});`,
    `};img.src=IMG;`,
    '</script>',
].join('\n');

const out = join(here, 'box-preview.html');
writeFileSync(out, html);
console.log(`${formName}: ${boxes.length} boxes, default fontSize ${defaultSize}, grid ${grid}px`);
console.log(`wrote ${out} — open it in a browser`);
