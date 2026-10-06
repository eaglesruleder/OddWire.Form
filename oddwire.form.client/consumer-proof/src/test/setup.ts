import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

// The packaged defaults include captured images. The browser runtime uses object URLs and canvas to
// retain their source blobs plus lightweight thumbnails; jsdom supplies neither image decoding nor
// a 2D canvas, so provide only those platform primitives while still exercising ZIP fetch/install.
Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:consumer-proof') });
Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn() });

class TestImage
{
    naturalWidth = 1;
    naturalHeight = 1;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string)
    {
        queueMicrotask(() => this.onload?.());
    }
}

Object.defineProperty(globalThis, 'Image', { value: TestImage });
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,') as unknown as typeof HTMLCanvasElement.prototype.toDataURL;
