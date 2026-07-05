import { useState } from 'react';

import type { ControlDef } from '../controlTypes';
import type { InstanceEntity, InstanceChange } from '../../../../_context';

import { ControlList } from '../../ControlList';
import './layoutControls.css';

type ControlCollapsibleProps = {
    param: string;
    label?: string;
    hidden?: boolean;
    controls: ControlDef[];
    instance: InstanceEntity;
    onChange: InstanceChange;
    };

export function ControlCollapsible(props: ControlCollapsibleProps)
{
    const [expanded, setExpanded] = useState(false);

    if (props.hidden)
        return null;

    return (
        <div className="collapsible mb-3">
            <button
                type="button"
                className="collapsible-header flex items-center gap"
                onClick={() => setExpanded(open => !open)}
            >
                <span className="collapsible-chevron">{expanded ? '▾' : '▸'}</span>
                <span className="fill">{props.label ?? props.param}</span>
            </button>
            {expanded &&
            <div className="collapsible-body">
                <ControlList controls={props.controls} instance={props.instance} onChange={props.onChange} />
            </div>
            }
        </div>
        );
}
