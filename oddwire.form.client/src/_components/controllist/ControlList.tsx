import type { ReactNode } from 'react';

import type { InstanceEntity, InstanceChange } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

import { ControlItem } from './ControlItem';
import { ControlTab } from './controls/layout';
import { resolveLabel } from './resolveLabel';

type ControlListProps = {
    controls: ControlDef[];
    instance: InstanceEntity;
    onChange: InstanceChange;
    depth?: number;
    };

export function ControlList({ controls, instance, onChange, depth = 0 }: ControlListProps)
{
    const items: ReactNode[] = [];

    let i = 0;
    while (i < controls.length)
    {
        const control = controls[i];

        if (control.type !== 'tab')
        {
            items.push(<ControlItem key={control.param} control={control} instance={instance} onChange={onChange} depth={depth} />);
            i++;
            continue;
        }

        const sections = [];
        while (i < controls.length && controls[i].type === 'tab')
        {
            const tab = controls[i] as ControlDef & { controls: ControlDef[] };
            if (!tab.hidden)
                sections.push({ param: tab.param, label: resolveLabel(tab.label, instance) ?? tab.param, controls: tab.controls });
            i++;
        }
        if (sections.length > 0)
            items.push(<ControlTab key={`tabset-${sections[0].param}`} sections={sections} instance={instance} onChange={onChange} depth={depth} />);
    }

    // Intent: a 12-col grid — items are full-width by default; a control's `cellClassName` (col-N) opts into columns
    return <div className="control-grid">{items}</div>;
}
