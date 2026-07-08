import type { CSSProperties, ReactNode } from 'react';

import type { CoreControlProps } from './controlTypes';

type ControlBaseProps = Pick<CoreControlProps<unknown>, 'param' | 'label' | 'hidden' | 'stacked' | 'value' | 'readonly' | 'cellClassName'> & {
    className?: string;
    labelClassName?: string;
    labelStyle?: CSSProperties;
    children: ReactNode;
    };

export function ControlBase(props: ControlBaseProps)
{
    if (props.hidden)
        return null;

    const rowClass =
        ['flex', props.stacked ? 'column' : 'items-center', 'gap', 'mb-3', 'stack-sm', props.className, props.cellClassName]
        .filter(Boolean)
        .join(' ');

    const field = props.readonly ? readonlyField(props) : props.children;

    return (
        <div className={rowClass}>
            {props.label &&
            <label className={['control-label', props.labelClassName].filter(Boolean).join(' ')} style={props.labelStyle} htmlFor={props.param}>{props.label}</label>
            }
            <div className="fill">{field}</div>
        </div>
        );
}

// Intent: readonly === true renders the value as static text; a function renders its own node in place of the control
function readonlyField(props: ControlBaseProps): ReactNode
{
    if (typeof props.readonly === 'function')
        return props.readonly(props as CoreControlProps<unknown>);

    return <span className="control-static">{props.value == null ? '' : String(props.value)}</span>;
}
