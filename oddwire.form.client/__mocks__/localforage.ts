type Store = Map<string, unknown>;

const stores = new Map<string, Store>();

function storeKey(options?: { name?: string; storeName?: string }): string
{
    return `${options?.name ?? 'default'}:${options?.storeName ?? 'keyvaluepairs'}`;
}

function getStore(options?: { name?: string; storeName?: string }): Store
{
    const key = storeKey(options);
    let store = stores.get(key);

    if (!store)
    {
        store = new Map<string, unknown>();
        stores.set(key, store);
    }

    return store;
}

export function __resetLocalforage(): void
{
    stores.clear();
}

const localforage = {
    createInstance(options?: { name?: string; storeName?: string })
    {
        const store = getStore(options);

        return {
            async getItem<T>(key: string): Promise<T | null>
            {
                return store.has(key) ? store.get(key) as T : null;
            },

            async setItem<T>(key: string, value: T): Promise<T>
            {
                store.set(key, value);
                return value;
            },

            async removeItem(key: string): Promise<void>
            {
                store.delete(key);
            },

            async iterate<T, TResult>(iterator: (value: T, key: string) => TResult | void): Promise<TResult | void>
            {
                for (const [key, value] of store)
                {
                    const result = iterator(value as T, key);
                    if (result !== undefined)
                        return result;
                }
            },
        };
    },

    async dropInstance(options?: { name?: string; storeName?: string }): Promise<void>
    {
        if (options?.storeName)
        {
            stores.delete(storeKey(options));
            return;
        }

        const prefix = `${options?.name ?? 'default'}:`;
        for (const key of [...stores.keys()])
            if (key.startsWith(prefix))
                stores.delete(key);
    },
};

export default localforage;
