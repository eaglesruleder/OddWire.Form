// Intent: turn a picked file into a full-res source blob + a small thumbnail data-URI. The blob keeps the original file
// bytes untouched (evidence-grade source); the thumbnail is a canvas-downscaled JPEG bounded by MAX_THUMB_RES for the
// instance value, so the sparse overlay stays light and renders without touching the blob store.
const MAX_THUMB_RES = 256;   // longest-edge px cap for the in-value thumbnail
const THUMB_QUALITY = 0.8;

export type CapturedImageData = { blob: Blob; mime: string; w: number; h: number; thumbnail: string };

// Intent: works for a picked File or a bundled-package Blob — the original bytes are kept as the source; only the thumbnail
// is re-encoded. mime defaults to the blob's own type (a File carries it; a zip entry supplies it).
export async function captureImage(source: Blob, mime = source.type): Promise<CapturedImageData>
{
    const url = URL.createObjectURL(source);

    try
    {
        const image = await loadImage(url);
        const resolvedMime = mime || 'application/octet-stream';

        return {
            blob: source,
            mime: resolvedMime,
            w: image.naturalWidth,
            h: image.naturalHeight,
            thumbnail: makeThumbnail(image, resolvedMime),
            };
    }
    finally
    {
        URL.revokeObjectURL(url);
    }
}

// Intent: keep the thumbnail in the source's own format so transparency (png) survives natively; the res-shrink is what
// bounds size. A format the canvas can't encode falls back to png per the toDataURL spec.
function makeThumbnail(image: HTMLImageElement, mime: string): string
{
    const scale = Math.min(1, MAX_THUMB_RES / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.max(1, Math.round(image.naturalWidth * scale));
    const h = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const context = canvas.getContext('2d');
    if (!context)
        throw new Error('Canvas unavailable');

    context.drawImage(image, 0, 0, w, h);
    return canvas.toDataURL(mime, THUMB_QUALITY);
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
