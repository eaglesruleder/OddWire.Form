import type { InstanceEntity } from '../../_context';
import { evaluateTemplate, hasTemplate } from './template';

// Intent: interpolate {param} tokens in a label with the instance's current values — e.g. "STR {strSave}" → "STR +3"
export function resolveLabel(label: string | undefined, instance: InstanceEntity): string | undefined
{
    if (!label || !hasTemplate(label))
        return label;

    return evaluateTemplate(label, param => instance.get(param)?.value);
}
