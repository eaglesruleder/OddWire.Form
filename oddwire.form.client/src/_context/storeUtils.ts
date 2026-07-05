export function upsert<T>(list: T[], entry: T, match: (item: T) => boolean): T[]
{
    const index = list.findIndex(match);

    if (index < 0)
        return [...list, entry];

    const next = [...list];
    next[index] = entry;
    return next;
}
