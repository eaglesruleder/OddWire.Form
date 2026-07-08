import type { InstanceEntity } from '../../_context';

// Intent: interpolate {param} tokens in a label with the instance's current values — e.g. "STR {strSave}" → "STR +3"
export function resolveLabel(label: string | undefined, instance: InstanceEntity): string | undefined
{
    if (!label || !label.includes('{'))
        return label;

    return label.replace(/\{(\w+)\}/g, (_match, param: string) =>
    {
        const value = instance.get(param)?.value;
        return value == null ? '' : String(value);
    });
}
