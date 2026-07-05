import { useState } from 'react';

import { ControlList } from '../../ControlList';
import { ControlError } from '..';
import type { ControlDef } from '../controlTypes';
import type { InstanceEntity, InstanceChange } from '../../../../_context';

import './layoutControls.css';

// Derived section shape — one per `tab` control in a run. `notice` renders a ControlError
// banner above the body (used by FormPage's synthetic tab for stray non-tab controls).
export type TabSection = {
    param: string;
    label: string;
    controls: ControlDef[];
    notice?: string;
    };

type ControlTabProps = {
    sections: TabSection[];
    variant: 'inline' | 'root';
    instance: InstanceEntity;
    onChange: InstanceChange;
    };

export function ControlTab(props: ControlTabProps)
{
    const [activeParam, setActiveParam] = useState(props.sections[0]?.param ?? '');

    const active = props.sections.find(section => section.param === activeParam) ?? props.sections[0];

    if (!active)
        return null;

    const bar =
        <div className={`tab-bar tab-bar-${props.variant}`}>
            {props.sections.map(section =>
            <button
                key={section.param}
                type="button"
                className={['tab', section.param === active.param ? 'active' : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveParam(section.param)}
            >{section.label}</button>
            )}
        </div>;

    const body =
        <div className="tab-body">
            {active.notice &&
            <ControlError>{active.notice}</ControlError>
            }
            <ControlList controls={active.controls} instance={props.instance} onChange={props.onChange} />
        </div>;

    // Intent: root variant pins the bar to the page floor — body first, spacer clears the fixed bar
    return props.variant === 'root'
    ?   <div className="tabset tabset-root">{body}{bar}</div>
    :   <div className="tabset tabset-inline mb-3">{bar}{body}</div>;
}
