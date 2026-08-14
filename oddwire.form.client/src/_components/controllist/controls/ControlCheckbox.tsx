import Form from 'react-bootstrap/Form';

import type { CoreControlProps } from './controlTypes';
import { ControlHeadingLabel } from './ControlHeadingLabel';

export function ControlCheckbox(props: CoreControlProps<boolean>)
{
    if (props.hidden)
        return null;

    const wrapClass =
        ['flex', 'items-center', 'gap', 'mb-3', props.cellClassName]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={wrapClass}>
            {props.label &&
            <ControlHeadingLabel label={props.label} labelHeading={props.labelHeading} defaultHeading="h5" htmlFor={props.param} className="fill" />
            }
            <Form.Check
                id={props.param}
                type="checkbox"
                checked={props.value ?? false}
                disabled={props.disabled}
                onChange={e => props.onChange?.(e.target.checked, props.param)}
            />
        </div>
        );
}
