import type { ReactNode } from 'react';

type ControlBaseProps = {
    param: string;
    label?: string;
    stacked?: boolean;
    className?: string;
    hidden?: boolean;
    children: ReactNode;
    };

export function ControlBase({ param, label, stacked, className, hidden, children }: ControlBaseProps)
{
    if (hidden)
        return null;

    const rowClass =
        ['flex', stacked ? 'column' : 'items-center', 'gap', 'mb-3', 'stack-sm', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={rowClass}>
            {label &&
            <label className="control-label" htmlFor={param}>{label}</label>
            }
            <div className="fill">{children}</div>
        </div>
    );
}
