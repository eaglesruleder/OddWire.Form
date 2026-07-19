import { useContext, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import { FormImageContext, FormActionsContext } from '../../../_context';

import type { CoreControlProps, CapturedImage, DrawConfig } from './controlTypes';
import { isCapturedImage } from './controlTypes';
import { ControlBase } from './ControlBase';
import { captureImage } from './captureImage';
import { SignaturePad } from './SignaturePad';

// Intent: editable when !disabled — capture a file and/or a drawing to the blob store (gated on the instance being saved
// first), render the thumbnail natively, click to load the full-res blob. `draw` adds the pad; disabled → static display.
type ControlImageProps = CoreControlProps<string | CapturedImage> & {
    formId: string;
    instanceId: string;
    draw?: DrawConfig;
    };

type DrawSettings = { w: number; h: number; penColor?: string; background?: string; allowUpload: boolean };

export function ControlImage(props: ControlImageProps)
{
    const images = useContext(FormImageContext);
    const { requestSave, isSaved } = useContext(FormActionsContext);

    const inputRef = useRef<HTMLInputElement>(null);
    const [zoomUrl, setZoomUrl] = useState<string>();
    const [drawing, setDrawing] = useState(false);
    const [baseUrl, setBaseUrl] = useState<string>();
    const [busy, setBusy] = useState(false);

    const value = props.value;
    const captured = isCapturedImage(value) ? value : undefined;
    const src = captured ? captured.thumbnail : typeof value === 'string' ? value : undefined;

    const draw = normaliseDraw(props.draw);
    const showUpload = !draw || draw.allowUpload;

    // Intent: capture writes a blob stamped with instanceId — force a save first so the instance is never orphaned pre-save
    const ensureSaved = async (): Promise<boolean> =>
    {
        if (isSaved)
            return true;

        if (!window.confirm('This form must be saved before adding images. Save now?'))
            return false;

        await requestSave();
        return true;
    };

    const onOpenClick = async () =>
    {
        if (await ensureSaved())
            inputRef.current?.click();
    };

    const onDrawClick = async () =>
    {
        if (!(await ensureSaved()))
            return;

        // Intent: annotate — when uploads are allowed and an image exists, open the pad over its full-res source
        setBaseUrl(draw?.allowUpload && captured ? await images.getObjectUrl(captured.id) : undefined);
        setDrawing(true);
    };

    const onFile = async (file: File | undefined) =>
    {
        if (file)
            await commitBlob(file);

        if (inputRef.current)
            inputRef.current.value = '';
    };

    // Intent: the single storage path for both capture surfaces — store the full-res blob, drop any superseded owned blob,
    // and set the { id, thumbnail } value. captureImage keeps the thumbnail in the source's own format.
    const commitBlob = async (blob: Blob) =>
    {
        setBusy(true);

        try
        {
            const data = await captureImage(blob);
            const id = crypto.randomUUID();

            await images.saveImage(
                {id
                ,formId: props.formId
                ,instanceId: props.instanceId
                ,param: props.param
                ,mime: data.mime
                ,w: data.w
                ,h: data.h
                ,blob: data.blob
                });

            if (captured)
                await deleteOwned(captured.id);   // replacing — drop the superseded blob (but never a shared bundled default)

            props.onChange?.({ id, thumbnail: data.thumbnail }, props.param);
        }
        catch (e)
        {
            window.alert(e instanceof Error ? e.message : 'Image capture failed');
        }
        finally
        {
            setBusy(false);
        }
    };

    const onDrawCapture = async (blob: Blob) =>
    {
        setDrawing(false);
        await commitBlob(blob);
    };

    const onClear = async () =>
    {
        if (captured)
            await deleteOwned(captured.id);

        props.onChange?.('', props.param);   // key-lossy clear drops the instance entry
    };

    // Intent: only delete a blob this instance owns — a bundled form-default blob is shared across instances, so clearing/
    // replacing here just drops the overlay (reverting to the default) rather than destroying the shared source
    const deleteOwned = async (id: string) =>
    {
        const record = await images.getImage(id);

        if (record?.instanceId === props.instanceId)
            await images.deleteImage(id);
    };

    const onZoom = async () =>
    {
        if (captured)
            setZoomUrl(await images.getObjectUrl(captured.id));
    };

    return (
        <ControlBase {...props} stacked>
            {src
            ?   <img
                    src={src}
                    alt={props.label ?? props.param}
                    style={{ maxWidth: '100%', height: 'auto', display: 'block', cursor: captured ? 'zoom-in' : 'default' }}
                    onClick={captured ? onZoom : undefined}
                />
            :   <span className="text-muted">{props.placeholder ?? 'No image'}</span>
            }

            {!props.disabled &&
            <div className="flex gap mt-2">
                {showUpload &&
                <button type="button" className="btn btn-outline-primary btn-sm" disabled={busy} onClick={onOpenClick}>{busy ? 'Working…' : 'Open'}</button>
                }
                {draw &&
                <button type="button" className="btn btn-outline-primary btn-sm" disabled={busy} onClick={onDrawClick}>{draw.allowUpload && captured ? 'Annotate' : 'Draw'}</button>
                }
                {(captured || typeof value === 'string') &&
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={onClear}>Clear</button>
                }
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onFile(e.target.files?.[0])} />
            </div>
            }

            {draw &&
            <Modal show={drawing} onHide={() => setDrawing(false)} centered size="lg">
                <Modal.Body className="center">
                    <SignaturePad
                        width={draw.w}
                        height={draw.h}
                        penColor={draw.penColor}
                        background={draw.background}
                        baseImageUrl={baseUrl}
                        onCapture={onDrawCapture}
                        onCancel={() => setDrawing(false)}
                    />
                </Modal.Body>
            </Modal>
            }

            <Modal show={!!zoomUrl} onHide={() => setZoomUrl(undefined)} centered size="lg">
                <Modal.Body className="center">
                    {zoomUrl &&
                    <img src={zoomUrl} alt={props.label ?? props.param} style={{ maxWidth: '100%', height: 'auto' }} />
                    }
                </Modal.Body>
            </Modal>
        </ControlBase>
        );
}

// Intent: bare true → a plain draw pad (defaults); an object tunes it; absent → no draw surface. allowUpload defaults off
// (draw-only, the signature case) — a form opts into upload+draw to annotate.
function normaliseDraw(draw: DrawConfig | undefined): DrawSettings | undefined
{
    if (!draw)
        return undefined;

    const config = draw === true ? {} : draw;

    return {
        w: config.w ?? 600,
        h: config.h ?? 200,
        penColor: config.penColor,
        background: config.background,
        allowUpload: config.allowUpload ?? false,
        };
}
