import type { CSSProperties } from 'react';

import type { LabelHeading } from './controlTypes';
import { labelHeadingClass, normaliseLabelHeading } from './labelHeading';

type ControlHeadingLabelProps = {
    label: string;
    labelHeading?: LabelHeading;
    defaultHeading: LabelHeading;
    htmlFor?: string;
    className?: string;
    style?: CSSProperties;
    };

export function ControlHeadingLabel({ label, labelHeading, defaultHeading, htmlFor, className, style }: ControlHeadingLabelProps)
{
    const heading = normaliseLabelHeading(labelHeading, defaultHeading);
    const classes = labelHeadingClass(labelHeading, defaultHeading, className);

    if (htmlFor)
        return <label className={classes} style={style} htmlFor={htmlFor}>{label}</label>;

    switch (heading)
    {
        case 'h1': return <h1 className={classes} style={style}>{label}</h1>;
        case 'h2': return <h2 className={classes} style={style}>{label}</h2>;
        case 'h3': return <h3 className={classes} style={style}>{label}</h3>;
        case 'h4': return <h4 className={classes} style={style}>{label}</h4>;
        case 'h5': return <h5 className={classes} style={style}>{label}</h5>;
        case 'h6': return <h6 className={classes} style={style}>{label}</h6>;
    }
}
