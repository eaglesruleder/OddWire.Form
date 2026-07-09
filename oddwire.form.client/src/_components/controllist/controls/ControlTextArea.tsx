import Form from 'react-bootstrap/Form';

import type { CoreControlProps } from './controlTypes';

import { ControlBase } from './ControlBase';

export const ControlTextArea = (props: CoreControlProps<string>) =>
    <ControlBase {...props} stacked>
        <Form.Control
            id={props.param}
            as="textarea"
            placeholder={props.placeholder}
            value={props.value ?? ''}
            disabled={props.disabled}
            onChange={e => props.onChange?.(e.target.value, props.param)}
            rows={props.rows ?? 3}
        />
    </ControlBase>;
