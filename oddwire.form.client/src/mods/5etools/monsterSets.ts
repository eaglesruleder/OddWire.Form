import type { RawMonster } from './monsterMapper';

// Intent: one importable 5etools source. `load` is the only I/O seam — swap the bundled import for a remote
// fetch('https://5e.tools/data/bestiary/…') later without touching the mapper or the catalog UI.
export type MonsterSet =
    {id: string
    ,label: string
    ,source: string
    ,load: () => Promise<RawMonster[]>
    };

export const monsterSets: MonsterSet[] =
    [{id: 'oota'
     ,label: 'Out of the Abyss'
     ,source: 'OotA'
     ,load: async () => (await import('./data/oota.json')).default as unknown as RawMonster[]
     }
    ,{id: 'mm'
     ,label: 'Monster Manual'
     ,source: 'MM'
     ,load: async () => (await import('./data/mm.json')).default as unknown as RawMonster[]
     }
    ];
