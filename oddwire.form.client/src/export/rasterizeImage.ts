// Intent: export runs client-side, so decode any browser-supported image (png/jpg/webp/gif, data URI, URL, or a captured
// Blob) via an <img> + canvas and hand back PNG bytes for pdf-lib (which embeds png/jpg only). An optional target downscales
// to that px footprint (never upscales) so a placed image is only as heavy as its PDF box needs. Returns null on load/taint.
export async function rasterizeToPng(source: string | Blob, target?: { w: number; h: number }): Promise<Uint8Array | null>
{
    if (!source)
        return null;

    const url = typeof source === 'string' ? source : URL.createObjectURL(source);

    try
    {
        const image = await loadImage(url);
        const { w, h } = fitDimensions(image.naturalWidth, image.naturalHeight, target);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const context = canvas.getContext('2d');
        if (!context)
            return null;

        context.drawImage(image, 0, 0, w, h);

        // Intent: toDataURL throws if the canvas is cross-origin tainted — treat as "no image" rather than failing the export
        const dataUrl = canvas.toDataURL('image/png');
        return base64ToBytes(dataUrl.split(',')[1] ?? '');
    }
    catch
    {
        return null;
    }
    finally
    {
        if (typeof source !== 'string')
            URL.revokeObjectURL(url);
    }
}

// Intent: fit within the target box (aspect-kept, downscale-only); no target → natural size
function fitDimensions(naturalW: number, naturalH: number, target?: { w: number; h: number }): { w: number; h: number }
{
    if (!target || target.w <= 0 || target.h <= 0)
        return { w: naturalW, h: naturalH };

    const scale = Math.min(1, target.w / naturalW, target.h / naturalH);
    return { w: Math.max(1, Math.round(naturalW * scale)), h: Math.max(1, Math.round(naturalH * scale)) };
}

function loadImage(src: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const image = new Image();

        image.crossOrigin = 'anonymous';   // request CORS so remote images stay untainted where the host allows it
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('image load failed'));
        image.src = src;
    });
}

function base64ToBytes(base64: string): Uint8Array
{
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);

    return bytes;
}
