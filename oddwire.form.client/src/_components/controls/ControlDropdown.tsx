import Form from 'react-bootstrap/Form';

import { ControlBase } from './ControlBase';
import type { ControlOption, CoreControlProps } from './controlTypes';

type ControlDropdownProps = CoreControlProps<string> & {
    controls?: ControlOption[];
    };

export const ControlDropdown = (props: ControlDropdownProps) =>
    <ControlBase {...props}>
        <Form.Select value={props.value ?? ''} onChange={e => props.onChange?.(e.target.value, props.param)}>
            <option value="" disabled>Select…</option>
            {(props.controls ?? []).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </Form.Select>
    </ControlBase>;
