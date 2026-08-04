import type { InstanceEntity } from '../../_context';

import type { ControlDef } from './controls/controlTypes';
import type { TabSection } from './controls/layout';
import { resolveLabel } from './resolveLabel';

// Intent: a root-tab form renders its top-level tabs as the page's fixed footer sections; any visible non-tab stray at the
// root is surfaced in a single ⚠ section rather than silently dropped.
export function buildRootTabSections(controls: ControlDef[], instance: InstanceEntity): TabSection[]
{
    const sections: TabSection[] = controls
        .map(control => instance.resolve(control))
        .filter(control => control.type === 'tab' && !control.hidden)
        .map(tab => ({ param: tab.param, label: resolveLabel(tab.label, instance) ?? tab.param, controls: (tab as { controls: ControlDef[] }).controls }));

    const strays = controls
        .map(control => instance.resolve(control))
        .filter(control => control.type !== 'tab' && !control.hidden);
    if (strays.length > 0)
        sections.push({ param: '__unexpected', label: '⚠', controls: strays, notice: 'Unexpected controls in tab layout' });

    return sections;
}
