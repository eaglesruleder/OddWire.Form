import Form from 'react-bootstrap/Form';

import type { ControlOption, CoreControlProps } from './controlTypes';

import { ControlBase } from './ControlBase';

type ControlRadioProps = CoreControlProps<string> & {
    controls?: ControlOption[];
    };

export const ControlRadio = (props: ControlRadioProps) =>
    <ControlBase {...props}>
        {props.disabled || (props.controls ?? []).length === 0
        ?   <span className="text-muted">{props.placeholder ?? 'No Options'}</span>
        :   (props.controls ?? []).map(option =>
            <Form.Check
                key={option.value}
                id={`${props.param}-${option.value}`}
                name={props.param}
                type="radio"
                label={option.label}
                checked={props.value === option.value}
                onChange={() => props.onChange?.(option.value, props.param)}
                inline
            />
            )}
    </ControlBase>;
