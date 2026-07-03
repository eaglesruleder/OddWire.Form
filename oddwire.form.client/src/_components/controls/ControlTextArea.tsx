import Form from 'react-bootstrap/Form';

import { ControlBase } from './ControlBase';
import type { CoreControlProps } from './controlTypes';

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
