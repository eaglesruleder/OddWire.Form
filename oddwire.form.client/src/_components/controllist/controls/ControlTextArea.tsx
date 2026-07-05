import Form from 'react-bootstrap/Form';

import type { CoreControlProps } from './controlTypes';

import { ControlBase } from './ControlBase';

export const ControlTextArea = (props: CoreControlProps<string>) =>
    <ControlBase {...props} stacked>
        <Form.Control
            id={props.param}
            as="textarea"
            value={props.value ?? ''}
            onChange={e => props.onChange?.(e.target.value, props.param)}
            rows={3}
        />
    </ControlBase>;
