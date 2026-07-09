import { useState } from 'react';

import type { ControlDef } from '../controlTypes';
import type { InstanceEntity, InstanceChange } from '../../../../_context';

import { ControlList } from '../../ControlList';
import { stickyTop } from './stickyTop';
import './layoutControls.css';

type ControlCollapsibleProps = {
    param: string;
    label?: string;
    subtitle?: string;
    hidden?: boolean;
    controls: ControlDef[];
    instance: InstanceEntity;
    onChange: InstanceChange;
    depth?: number;
    };

export function ControlCollapsible(props: ControlCollapsibleProps)
{
    const [expanded, setExpanded] = useState(false);

    if (props.hidden)
        return null;

    const depth = props.depth ?? 0;

    return (
        <div className="collapsible mb-3">
            <button
                type="button"
                className="collapsible-header flex items-center gap"
                style={{ top: stickyTop(depth) }}
                onClick={() => setExpanded(open => !open)}
            >
                <span className="collapsible-chevron">{expanded ? '▾' : '▸'}</span>
                <span className="collapsible-title fill">
                    <span>{props.label ?? props.param}</span>
                </span>
                {props.subtitle && <span className="collapsible-subtitle">{props.subtitle}</span>}
            </button>
            {expanded &&
            <div className="collapsible-body">
                <ControlList controls={props.controls} instance={props.instance} onChange={props.onChange} depth={depth + 1} />
            </div>
            }
        </div>
        );
}
