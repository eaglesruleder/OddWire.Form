import type { LabelHeading } from './controlTypes';

const labelHeadings: readonly LabelHeading[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export function labelHeadingClass(labelHeading: LabelHeading | undefined, defaultHeading: LabelHeading, className?: string): string
{
    return ['control-heading', normaliseLabelHeading(labelHeading, defaultHeading), className]
        .filter(Boolean)
        .join(' ');
}

export function normaliseLabelHeading(labelHeading: LabelHeading | undefined, defaultHeading: LabelHeading): LabelHeading
{
    return labelHeading && labelHeadings.includes(labelHeading) ? labelHeading : defaultHeading;
}
