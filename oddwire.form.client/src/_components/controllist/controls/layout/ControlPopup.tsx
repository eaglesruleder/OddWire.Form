import { useState } from 'react';
import type { ReactNode } from 'react';
import Modal from 'react-bootstrap/Modal';
import type { ButtonProps } from 'react-bootstrap/Button';

import type { ControlDef } from '../controlTypes';
import type { InstanceEntity, InstanceChange } from '../../../../_context';

import { ControlButton } from '../ControlButton';
import { StripLayout } from '../../../layout';
import { ControlList } from '../../ControlList';
import './layoutControls.css';

// Intent: JSON popups carry `controls`; programmatic callers (e.g. DB Manager) may pass rendered `content` + a header `right` action
type ControlPopupProps = {
    param: string;
    label?: string;
    hidden?: boolean;
    right?: ReactNode;
    content?: ReactNode;
    controls?: ControlDef[];
    instance?: InstanceEntity;
    onChange?: InstanceChange;
    triggerVariant?: ButtonProps['variant'];
    triggerSize?: ButtonProps['size'];
    };

export function ControlPopup(props: ControlPopupProps)
{
    const [open, setOpen] = useState(false);

    if (props.hidden)
        return null;

    const title = props.label ?? props.param;

    const body = props.content ?? (props.instance && props.onChange &&
        <ControlList controls={props.controls ?? []} instance={props.instance} onChange={props.onChange} />);

    return (
        <div className="mb-3">
            <ControlButton label={title} variant={props.triggerVariant} size={props.triggerSize} onClick={() => setOpen(true)} />
            <Modal show={open} onHide={() => setOpen(false)} centered dialogClassName="popup-dialog" contentClassName="popup-content">
                <StripLayout
                    title={title}
                    left={<button type="button" className="strip-btn" onClick={() => setOpen(false)}>←</button>}
                    right={props.right}
                >
                    {body}
                </StripLayout>
            </Modal>
        </div>
        );
}
