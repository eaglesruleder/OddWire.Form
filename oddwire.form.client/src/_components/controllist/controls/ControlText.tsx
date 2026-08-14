import type { CoreControlProps } from './controlTypes';
import { ControlHeadingLabel } from './ControlHeadingLabel';

type ControlTextProps = CoreControlProps<string> & {
    className?: string;
    };

export function ControlText({ label, labelHeading, value, hidden, className, cellClassName }: ControlTextProps)
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
            <ControlHeadingLabel label={label} labelHeading={labelHeading} defaultHeading="h3" className="separator" />
            }
            {value &&
            <div className="control-static">{value}</div>
            }
        </div>
        );
}
