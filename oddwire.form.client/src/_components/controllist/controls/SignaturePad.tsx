import { useEffect, useRef } from 'react';
import SignaturePadLib from 'signature_pad';

// Intent: isolates the draw surface — signature_pad on a transparent canvas over an optional base image (annotation).
// Save composites base + strokes into one PNG blob and hands it up; the caller owns storage/value (same pipeline as file capture).
type SignaturePadProps = {
    width: number;
    height: number;
    penColor?: string;
    background?: string;      // solid fill for a drawpad; omitted → transparent (signatures composite over a PDF)
    baseImageUrl?: string;    // draw over this image, then flatten on save
    onCapture: (blob: Blob) => void;
    onCancel: () => void;
    };

export function SignaturePad(props: SignaturePadProps)
{
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePadLib | null>(null);

    useEffect(() =>
    {
        const canvas = canvasRef.current;
        if (!canvas)
            return;

        // Intent: back the canvas at device resolution so strokes stay crisp; scale the context to CSS px
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = props.width * ratio;
        canvas.height = props.height * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);

        const pad = new SignaturePadLib(canvas, { penColor: props.penColor ?? '#000', backgroundColor: 'rgba(0,0,0,0)' });
        padRef.current = pad;

        return () => { pad.off(); padRef.current = null; };
    }, [props.width, props.height, props.penColor]);

    const onSave = async () =>
    {
        const pad = padRef.current;
        if (!pad)
            return;

        if (pad.isEmpty() && !props.baseImageUrl)
            return;

        props.onCapture(await composite(props, pad.toDataURL('image/png')));
    };

    return (
        <div className="flex column gap items-center">
            <div style={{ position: 'relative', width: props.width, height: props.height, border: '1px solid var(--border, #ccc)', background: props.background ?? 'transparent' }}>
                {props.baseImageUrl &&
                <img src={props.baseImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                }
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }} />
            </div>
            <div className="flex gap">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => padRef.current?.clear()}>Clear</button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={props.onCancel}>Cancel</button>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={onSave}>Save</button>
            </div>
        </div>
        );
}

// Intent: flatten to one PNG at device resolution — solid fill (if any), then the base image (contain-fit), then the strokes
async function composite(props: SignaturePadProps, strokesUrl: string): Promise<Blob>
{
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const w = Math.round(props.width * ratio);
    const h = Math.round(props.height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const context = canvas.getContext('2d');
    if (!context)
        throw new Error('Canvas unavailable');

    if (props.background)
    {
        context.fillStyle = props.background;
        context.fillRect(0, 0, w, h);
    }

    if (props.baseImageUrl)
        drawContain(context, await loadImage(props.baseImageUrl), w, h);

    context.drawImage(await loadImage(strokesUrl), 0, 0, w, h);   // strokes canvas already matches the pad aspect → 1:1

    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Draw capture failed')), 'image/png'));
}

function drawContain(context: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number): void
{
    const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;

    context.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function loadImage(src: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = src;
    });
}
