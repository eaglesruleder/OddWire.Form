import type { FlattenCtx, FlattenResult, LooperControlDef } from '../controlTypes';

// Intent: export plugin — a looper's value is an array of rows; each row flattens over the child controls in its own scope
export function looperFlatten(resolved: LooperControlDef, ctx: FlattenCtx): FlattenResult
{
    const rows = Array.isArray(resolved.value) ? resolved.value : [];

    return { value: rows.map(row => ctx.scope(resolved.controls, row)) };
}
