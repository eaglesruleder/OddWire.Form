import Form from 'react-bootstrap/Form';

import { ControlBase } from './ControlBase';
import type { ControlOption, CoreControlProps } from './controlTypes';

type ControlRadioProps = CoreControlProps<string> & {
    controls?: ControlOption[];
    };

export const ControlRadio = (props: ControlRadioProps) =>
    <ControlBase {...props}>
        {(props.controls ?? []).map(option =>
        <Form.Check
            key={option.value}
            name={props.param}
            type="radio"
            label={option.label}
            checked={props.value === option.value}
            onChange={() => props.onChange?.(option.value, props.param)}
            inline
        />
        )}
    </ControlBase>;
