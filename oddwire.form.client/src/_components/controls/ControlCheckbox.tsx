import Form from 'react-bootstrap/Form';

import type { CoreControlProps } from './controlTypes';

export function ControlCheckbox(props: CoreControlProps<boolean>)
{
    if (props.hidden)
        return null;

    return (
        <div className="flex items-center gap mb-3">
            {props.label &&
            <label className="fill">{props.label}</label>
            }
            <Form.Check
                type="checkbox"
                checked={props.value ?? false}
                onChange={e => props.onChange?.(e.target.checked, props.param)}
            />
        </div>
        );
}
