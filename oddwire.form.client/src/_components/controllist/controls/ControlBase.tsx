import type { CSSProperties, ReactNode } from 'react';

import type { CoreControlProps } from './controlTypes';

type ControlBaseProps = Pick<CoreControlProps<unknown>, 'param' | 'label' | 'hidden' | 'stacked'> & {
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
        ['flex', props.stacked ? 'column' : 'items-center', 'gap', 'mb-3', 'stack-sm', props.className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={rowClass}>
            {props.label &&
            <label className={['control-label', props.labelClassName].filter(Boolean).join(' ')} style={props.labelStyle} htmlFor={props.param}>{props.label}</label>
            }
            <div className="fill">{props.children}</div>
        </div>
        );
}
