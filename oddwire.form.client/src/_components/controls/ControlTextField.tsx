import Form from 'react-bootstrap/Form';

import { ControlBase } from './ControlBase';
import type { CoreControlProps, KeyboardType, TextValueType } from './controlTypes';

type ControlTextFieldProps = CoreControlProps<string> & {
    valueType?: TextValueType;
    keyboardType?: KeyboardType;
    };

const keyboardForValueType: Record<TextValueType, KeyboardType> =
    {text: 'text'
    ,int: 'numeric'
    ,decimal: 'decimal'
    ,email: 'email'
    ,phone: 'tel'
    };

export const ControlTextField = (props: ControlTextFieldProps) =>
    <ControlBase {...props}>
        <Form.Control
            id={props.param}
            type="text"
            value={props.value ?? ''}
            inputMode={props.keyboardType ?? keyboardForValueType[props.valueType ?? 'text']}
            onChange={e => props.onChange?.(e.target.value, props.param)}
        />
    </ControlBase>;
