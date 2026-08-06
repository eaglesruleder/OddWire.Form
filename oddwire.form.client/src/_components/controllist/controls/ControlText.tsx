import type { CoreControlProps } from './controlTypes';

type ControlTextProps = CoreControlProps<string> & {
    className?: string;
    };

export function ControlText({ label, value, hidden, className, cellClassName }: ControlTextProps)
{
    if (hidden)
        return null;

    const wrapClass =
        ['mb-3', className, cellClassName]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={wrapClass}>
            {label &&
            <div className="separator">{label}</div>
            }
            {value &&
            <div className="control-static">{value}</div>
            }
        </div>
        );
}
