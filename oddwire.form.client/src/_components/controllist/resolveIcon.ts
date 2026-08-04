import type { InstanceEntity } from '../../_context';

import { isCapturedImage } from './controls/controlTypes';
import { resolveLabel } from './resolveLabel';

// Intent: an icon is either a glyph ('⚔') or a picture, and the author shouldn't have to say which.
export type ResolvedIcon = { src: string } | { text: string } | undefined;

// Intent: a lone {param} reads the instance's *raw* value so a captured image can expose its data-URI thumbnail —
// going through resolveLabel first would stringify it to [object Object]. Anything else (a literal, or a mixed
// string like 'lvl {cr}') still interpolates as text. Same source rules as the instance list: captured image →
// its thumbnail, bare url/data-uri → used as-is, otherwise the text is the glyph.
export function resolveIcon(icon: string | undefined, instance: InstanceEntity): ResolvedIcon
{
    if (!icon)
        return undefined;

    const token = icon.trim().match(/^\{(\w+)\}$/);
    const value = token ? instance.get(token[1])?.value : resolveLabel(icon, instance);

    if (isCapturedImage(value))
        return { src: value.thumbnail };

    const text = typeof value === 'string' ? value.trim() : '';

    if (!text)
        return undefined;

    return isImageSrc(text) ? { src: text } : { text };
}

const isImageSrc = (value: string): boolean =>
    /^(https?:\/\/|data:image\/|blob:|\/)/i.test(value);
