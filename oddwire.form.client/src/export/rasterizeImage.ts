// Intent: export runs client-side, so decode any browser-supported image (png/jpg/webp/gif, data URI or URL) via an
// <img> + canvas and hand back PNG bytes for pdf-lib (which embeds png/jpg only). Returns null on load or CORS-taint failure.
export async function rasterizeToPng(src: string): Promise<Uint8Array | null>
{
    if (!src)
        return null;

    try
    {
        const image = await loadImage(src);
        const canvas = document.createElement('canvas');

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext('2d');
        if (!context)
            return null;

        context.drawImage(image, 0, 0);

        // Intent: toDataURL throws if the canvas is cross-origin tainted — treat as "no image" rather than failing the export
        const dataUrl = canvas.toDataURL('image/png');
        return base64ToBytes(dataUrl.split(',')[1] ?? '');
    }
    catch
    {
        return null;
    }
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
