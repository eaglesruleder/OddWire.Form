import type { ReactNode } from 'react';

import type { InstanceEntity, InstanceChange } from '../../_context';
import type { ControlDef } from './controls/controlTypes';

import { ControlItem } from './ControlItem';
import { ControlTab } from './controls/layout';

type ControlListProps = {
    controls: ControlDef[];
    instance: InstanceEntity;
    onChange: InstanceChange;
    };

export function ControlList({ controls, instance, onChange }: ControlListProps)
{
    const items: ReactNode[] = [];

    let i = 0;
    while (i < controls.length)
    {
        const control = controls[i];

        if (control.type !== 'tab')
        {
            items.push(<ControlItem key={control.param} control={control} instance={instance} onChange={onChange} />);
            i++;
            continue;
        }

        const sections = [];
        while (i < controls.length && controls[i].type === 'tab')
        {
            const tab = controls[i] as ControlDef & { controls: ControlDef[] };
            sections.push({ param: tab.param, label: tab.label ?? tab.param, controls: tab.controls });
            i++;
        }
        items.push(<ControlTab key={`tabset-${sections[0].param}`} variant="inline" sections={sections} instance={instance} onChange={onChange} />);
    }

    return items;
}
