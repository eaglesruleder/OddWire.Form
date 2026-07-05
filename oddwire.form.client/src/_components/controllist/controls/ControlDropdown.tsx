import Form from 'react-bootstrap/Form';

import type { ControlOption, CoreControlProps } from './controlTypes';

import { ControlBase } from './ControlBase';

type ControlDropdownProps = CoreControlProps<string> & {
    controls?: ControlOption[];
    };

export const ControlDropdown = (props: ControlDropdownProps) =>
    <ControlBase {...props}>
        <Form.Select id={props.param} value={props.value ?? ''} onChange={e => props.onChange?.(e.target.value, props.param)}>
            <option value="" disabled>Select…</option>
            {(props.controls ?? []).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </Form.Select>
    </ControlBase>;
