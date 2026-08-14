import type { ControlDef, FlattenCtx, FlattenResult } from './controls/controlTypes';

import { looperFlatten } from './controls/layout';

// Intent: export-flatten router — the non-React sibling of the render switch; dispatches a resolved control to its
// flatten plugin. Layout recurses (emits nothing); looper has its own plugin; every leaf falls through to its raw value.
export function flattenControl(resolved: ControlDef, ctx: FlattenCtx): FlattenResult
{
    switch (resolved.type)
    {
        case 'tab':
        case 'collapsible':
        case 'popup':
            ctx.recurse(resolved.controls);
            return undefined;

        case 'looper':
            return looperFlatten(resolved, ctx);

        case 'calc':
            return { value: resolved.value ?? '' };

        default:
            return { value: resolved.value ?? null };
    }
}
