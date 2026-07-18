import { useContext, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import { FormImageContext, FormActionsContext } from '../../../_context';

import type { CoreControlProps, CapturedImage } from './controlTypes';
import { isCapturedImage } from './controlTypes';
import { ControlBase } from './ControlBase';
import { captureImage } from './captureImage';

// Intent: editable when !disabled — Open captures a file to the blob store (gated on the instance being saved first),
// the thumbnail renders natively, a click loads the full-res blob into a modal. disabled → static display only.
type ControlImageProps = CoreControlProps<string | CapturedImage> & {
    formId: string;
    instanceId: string;
    };

export function ControlImage(props: ControlImageProps)
{
    const images = useContext(FormImageContext);
    const { requestSave, isSaved } = useContext(FormActionsContext);

    const inputRef = useRef<HTMLInputElement>(null);
    const [zoomUrl, setZoomUrl] = useState<string>();
    const [busy, setBusy] = useState(false);

    const value = props.value;
    const captured = isCapturedImage(value) ? value : undefined;
    const src = captured ? captured.thumbnail : typeof value === 'string' ? value : undefined;

    const onOpenClick = async () =>
    {
        // Intent: capture writes a blob stamped with instanceId — force a save first so the instance is never orphaned pre-save
        if (!isSaved)
        {
            if (!window.confirm('This form must be saved before adding images. Save now?'))
                return;

            await requestSave();
        }

        inputRef.current?.click();
    };

    const onFile = async (file: File | undefined) =>
    {
        if (!file)
            return;

        setBusy(true);

        try
        {
            const data = await captureImage(file);
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
            if (inputRef.current)
                inputRef.current.value = '';
        }
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
                <button type="button" className="btn btn-outline-primary btn-sm" disabled={busy} onClick={onOpenClick}>{busy ? 'Working…' : 'Open'}</button>
                {(captured || typeof value === 'string') &&
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={onClear}>Clear</button>
                }
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onFile(e.target.files?.[0])} />
            </div>
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
