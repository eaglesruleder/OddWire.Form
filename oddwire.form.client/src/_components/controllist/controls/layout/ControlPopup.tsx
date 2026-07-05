import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import { ControlButton } from '../ControlButton';
import { StripLayout } from '../../../layout';
import { ControlList } from '../../ControlList';
import type { ControlDef } from '../controlTypes';
import type { InstanceEntity, InstanceChange } from '../../../../_context';

import './layoutControls.css';

type ControlPopupProps = {
    param: string;
    label?: string;
    hidden?: boolean;
    controls: ControlDef[];
    instance: InstanceEntity;
    onChange: InstanceChange;
    };

export function ControlPopup(props: ControlPopupProps)
{
    const [open, setOpen] = useState(false);

    if (props.hidden)
        return null;

    const title = props.label ?? props.param;

    return (
        <div className="mb-3">
            <ControlButton label={title} onClick={() => setOpen(true)} />
            <Modal show={open} onHide={() => setOpen(false)} centered dialogClassName="popup-dialog" contentClassName="popup-content">
                <StripLayout
                    title={title}
                    left={<button type="button" className="strip-btn" onClick={() => setOpen(false)}>←</button>}
                >
                    <ControlList controls={props.controls} instance={props.instance} onChange={props.onChange} />
                </StripLayout>
            </Modal>
        </div>
        );
}
