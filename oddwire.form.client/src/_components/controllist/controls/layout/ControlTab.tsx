import { useState } from 'react';
import type { ReactNode } from 'react';

import type { ControlDef } from '../controlTypes';
import type { InstanceEntity, InstanceChange } from '../../../../_context';

import { ControlList } from '../../ControlList';
import { ControlError } from '..';
import { stickyTop } from './stickyTop';
import './layoutControls.css';

// Intent: JSON tabs carry `controls`; programmatic callers (e.g. DB Manager) may pass rendered `content` + `disabled` instead
export type TabSection = {
    param: string;
    label: string;
    controls?: ControlDef[];
    content?: ReactNode;
    disabled?: boolean;
    notice?: string;
    };

type ControlTabProps = {
    sections: TabSection[];
    pageLayout?: boolean;
    defaultParam?: string;
    instance?: InstanceEntity;
    onChange?: InstanceChange;
    depth?: number;
    };

export function ControlTab(props: ControlTabProps)
{
    const firstEnabled = props.sections.find(section => !section.disabled) ?? props.sections[0];
    const [activeParam, setActiveParam] = useState(props.defaultParam ?? firstEnabled?.param ?? '');

    const requested = props.sections.find(section => section.param === activeParam);
    const active = requested && !requested.disabled ? requested : firstEnabled;

    if (!active)
        return null;

    const depth = props.depth ?? 0;
    const pageLayout = props.pageLayout ?? false;
    const childDepth = pageLayout ? 0 : depth + 1;

    const bar =
        <div
            className={pageLayout ? 'tab-bar tab-bar-root height-footer' : 'tab-bar tab-bar-inline'}
            style={pageLayout ? undefined : { top: stickyTop(depth) }}
        >
            {props.sections.map(section =>
            <button
                key={section.param}
                type="button"
                className={['tab', section.param === active.param ? 'active' : ''].filter(Boolean).join(' ')}
                disabled={section.disabled}
                onClick={() => setActiveParam(section.param)}
            >{section.label}</button>
            )}
        </div>;

    const body =
        <div className="pt-2">
            {active.notice &&
            <ControlError>{active.notice}</ControlError>
            }
            {active.content ?? (props.instance && props.onChange &&
            <ControlList controls={active.controls ?? []} instance={props.instance} onChange={props.onChange} depth={childDepth} />
            )}
        </div>;

    return pageLayout
    ?   <div className="tabset tabset-root margin-bot-footer">{body}{bar}</div>
    :   <div className="tabset tabset-inline mb-3">{bar}{body}</div>;
}
