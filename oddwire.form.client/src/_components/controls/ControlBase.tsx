import type { ReactNode } from 'react';

import type { CoreControlProps } from './controlTypes';

type ControlBaseProps = Pick<CoreControlProps<unknown>, 'label' | 'hidden' | 'stacked'> & {
    className?: string;
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
            <label className="control-label">{props.label}</label>
            }
            <div className="fill">{props.children}</div>
        </div>
        );
}
