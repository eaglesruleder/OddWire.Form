import type { MonsterMod, MonsterModMap, RawMonster } from './monsterMapper';

const BESTIARY_BASE_URL = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary';

// Intent: source code -> upstream bestiary file. Mirrors https://5e.tools/data/bestiary/index.json.
const BESTIARY_INDEX: Record<string, string> =
    {AATM: 'bestiary-aatm.json'
    ,ABH: 'bestiary-abh.json'
    ,AI: 'bestiary-ai.json'
    ,'AitFR-ISF': 'bestiary-aitfr-isf.json'
    ,'AitFR-THP': 'bestiary-aitfr-thp.json'
    ,'AitFR-DN': 'bestiary-aitfr-dn.json'
    ,'AitFR-FCD': 'bestiary-aitfr-fcd.json'
    ,AWM: 'bestiary-awm.json'
    ,BAM: 'bestiary-bam.json'
    ,BGDIA: 'bestiary-bgdia.json'
    ,BGG: 'bestiary-bgg.json'
    ,BMT: 'bestiary-bmt.json'
    ,CM: 'bestiary-cm.json'
    ,CoA: 'bestiary-coa.json'
    ,CoS: 'bestiary-cos.json'
    ,CRCotN: 'bestiary-crcotn.json'
    ,DC: 'bestiary-dc.json'
    ,DIP: 'bestiary-dip.json'
    ,DitLCoT: 'bestiary-ditlcot.json'
    ,DMG: 'bestiary-dmg.json'
    ,DoD: 'bestiary-dod.json'
    ,DoSI: 'bestiary-dosi.json'
    ,DSotDQ: 'bestiary-dsotdq.json'
    ,EFA: 'bestiary-efa.json'
    ,EGW: 'bestiary-egw.json'
    ,ERLW: 'bestiary-erlw.json'
    ,ESK: 'bestiary-esk.json'
    ,FRAiF: 'bestiary-fraif.json'
    ,FTD: 'bestiary-ftd.json'
    ,GGR: 'bestiary-ggr.json'
    ,GoS: 'bestiary-gos.json'
    ,GotSF: 'bestiary-gotsf.json'
    ,'HAT-TG': 'bestiary-hat-tg.json'
    ,HftT: 'bestiary-hftt.json'
    ,HoL: 'bestiary-hol.json'
    ,HotB: 'bestiary-hotb.json'
    ,HotDQ: 'bestiary-hotdq.json'
    ,IDRotF: 'bestiary-idrotf.json'
    ,IMR: 'bestiary-imr.json'
    ,JttRC: 'bestiary-jttrc.json'
    ,KftGV: 'bestiary-kftgv.json'
    ,KKW: 'bestiary-kkw.json'
    ,LFL: 'bestiary-lfl.json'
    ,LLK: 'bestiary-llk.json'
    ,LMoP: 'bestiary-lmop.json'
    ,LoX: 'bestiary-lox.json'
    ,LR: 'bestiary-lr.json'
    ,LRDT: 'bestiary-lrdt.json'
    ,MaBJoV: 'bestiary-mabjov.json'
    ,MCV1SC: 'bestiary-mcv1sc.json'
    ,MCV2DC: 'bestiary-mcv2dc.json'
    ,MCV3MC: 'bestiary-mcv3mc.json'
    ,MCV4EC: 'bestiary-mcv4ec.json'
    ,MisMV1: 'bestiary-mismv1.json'
    ,MFF: 'bestiary-mff.json'
    ,MGELFT: 'bestiary-mgelft.json'
    ,MM: 'bestiary-mm.json'
    ,MPMM: 'bestiary-mpmm.json'
    ,MPP: 'bestiary-mpp.json'
    ,MOT: 'bestiary-mot.json'
    ,MTF: 'bestiary-mtf.json'
    ,NF: 'bestiary-nf.json'
    ,'NRH-TCMC': 'bestiary-nrh-tcmc.json'
    ,'NRH-AVitW': 'bestiary-nrh-avitw.json'
    ,'NRH-ASS': 'bestiary-nrh-ass.json'
    ,'NRH-CoI': 'bestiary-nrh-coi.json'
    ,'NRH-TLT': 'bestiary-nrh-tlt.json'
    ,'NRH-AWoL': 'bestiary-nrh-awol.json'
    ,'NRH-AT': 'bestiary-nrh-at.json'
    ,OotA: 'bestiary-oota.json'
    ,OoW: 'bestiary-oow.json'
    ,PaBTSO: 'bestiary-pabtso.json'
    ,PSA: 'bestiary-ps-a.json'
    ,PSD: 'bestiary-ps-d.json'
    ,PSI: 'bestiary-ps-i.json'
    ,PSK: 'bestiary-ps-k.json'
    ,PSX: 'bestiary-ps-x.json'
    ,PSZ: 'bestiary-ps-z.json'
    ,PHB: 'bestiary-phb.json'
    ,PotA: 'bestiary-pota.json'
    ,QftIS: 'bestiary-qftis.json'
    ,RHW: 'bestiary-rhw.json'
    ,RMBRE: 'bestiary-rmbre.json'
    ,RoT: 'bestiary-rot.json'
    ,RtG: 'bestiary-rtg.json'
    ,SADS: 'bestiary-sads.json'
    ,SCC: 'bestiary-scc.json'
    ,SDW: 'bestiary-sdw.json'
    ,SKT: 'bestiary-skt.json'
    ,SLW: 'bestiary-slw.json'
    ,TCE: 'bestiary-tce.json'
    ,TTP: 'bestiary-ttp.json'
    ,TftYP: 'bestiary-tftyp.json'
    ,ToA: 'bestiary-toa.json'
    ,ToFW: 'bestiary-tofw.json'
    ,VD: 'bestiary-vd.json'
    ,VEoR: 'bestiary-veor.json'
    ,VGM: 'bestiary-vgm.json'
    ,VRGR: 'bestiary-vrgr.json'
    ,XGE: 'bestiary-xge.json'
    ,WBtW: 'bestiary-wbtw.json'
    ,WDH: 'bestiary-wdh.json'
    ,WDMM: 'bestiary-wdmm.json'
    ,WttHC: 'bestiary-wtthc.json'
    ,XDMG: 'bestiary-xdmg.json'
    ,XMM: 'bestiary-xmm.json'
    ,XPHB: 'bestiary-xphb.json'
    };

export type MonsterSet =
    {id: string
    ,label: string
    ,source: string
    ,load: () => Promise<RawMonster[]>
    };

type BestiaryPayload = {
    monster?: RawMonster[];
    };

const rawBestiaryCache = new Map<string, Promise<RawMonster[]>>();

export const monsterSets: MonsterSet[] =
    Object.entries(BESTIARY_INDEX).map(([source, file]) =>
        ({id: source
        ,label: source
        ,source
        ,load: () => loadBestiary(file)
        }));

async function loadBestiary(file: string): Promise<RawMonster[]>
{
    return expandCopies(await fetchBestiary(file));
}

async function fetchBestiary(file: string): Promise<RawMonster[]>
{
    if (!rawBestiaryCache.has(file))
        rawBestiaryCache.set(file, downloadBestiary(file).catch(error =>
        {
            rawBestiaryCache.delete(file);
            throw error;
        }));

    return rawBestiaryCache.get(file) as Promise<RawMonster[]>;
}

async function downloadBestiary(file: string): Promise<RawMonster[]>
{
    const response = await fetch(`${BESTIARY_BASE_URL}/${file}`);

    if (!response.ok)
        throw new Error(`Could not download ${file} (${response.status})`);

    const payload = await response.json() as BestiaryPayload | RawMonster[];
    return Array.isArray(payload) ? payload : payload.monster ?? [];
}

async function expandCopies(monsters: RawMonster[]): Promise<RawMonster[]>
{
    const byKey = new Map<string, RawMonster>();
    const localByName = new Map<string, RawMonster>();
    const resolved = new Map<RawMonster, RawMonster>();

    for (const monster of monsters)
    {
        byKey.set(monsterKey(monster.name, monster.source), monster);
        localByName.set(monsterNameKey(monster.name), monster);
    }

    const resolve = async (monster: RawMonster, seen = new Set<RawMonster>()): Promise<RawMonster> =>
    {
        if (!monster._copy)
            return monster;

        if (resolved.has(monster))
            return resolved.get(monster) as RawMonster;

        if (seen.has(monster))
            return monster;

        seen.add(monster);

        const copy = monster._copy;
        const base = await lookupBaseMonster(copy.name, monster.source, copy.source, byKey, localByName);

        if (!base)
            return monster;

        const expanded = applyMods(clone(await resolve(base, seen)), copy._mod);
        const {_copy, _mod, ...overrides} = monster;
        const merged = applyMods({ ...expanded, ...overrides }, _mod);

        resolved.set(monster, merged);
        return merged;
    };

    return Promise.all(monsters.map(monster => resolve(monster)));
}

async function lookupBaseMonster(
    name: string,
    localSource: string | undefined,
    copySource: string | undefined,
    byKey: Map<string, RawMonster>,
    localByName: Map<string, RawMonster>,
    ): Promise<RawMonster | undefined>
{
    const existing = byKey.get(monsterKey(name, localSource)) ?? localByName.get(monsterNameKey(name));

    if (existing || !copySource)
        return existing;

    const file = bestiaryFile(copySource);

    if (!file)
        return undefined;

    const monsters = await fetchBestiary(file);

    for (const monster of monsters)
        byKey.set(monsterKey(monster.name, monster.source), monster);

    return monsters.find(monster => monsterKey(monster.name, monster.source) === monsterKey(name, copySource))
    ?? monsters.find(monster => monsterNameKey(monster.name) === monsterNameKey(name));
}

function applyMods<T extends Record<string, unknown>>(target: T, mods: MonsterModMap | undefined): T
{
    if (!mods)
        return target;

    const out = { ...target };

    for (const [prop, mod] of Object.entries(mods))
        for (const op of Array.isArray(mod) ? mod : [mod])
            applyMod(out, prop, op);

    return out;
}

function applyMod(target: Record<string, unknown>, prop: string, mod: MonsterMod): void
{
    const currentValue = target[prop];
    const current = Array.isArray(currentValue) ? [...currentValue] : [];
    const items = asArray(mod.items);

    switch (mod.mode)
    {
        case 'appendArr':
            target[prop] = [...current, ...items];
            break;
        case 'prependArr':
            target[prop] = [...items, ...current];
            break;
        case 'replaceArr':
            target[prop] = replaceArrayItem(current, mod.replace, items);
            break;
        case 'removeArr':
            target[prop] = removeArrayItems(current, mod.names ?? namesOf(items));
            break;
        case 'insertArr':
            target[prop] = insertArrayItems(current, mod.index ?? current.length, items);
            break;
        default:
            break;
    }
}

function replaceArrayItem(current: unknown[], name: string | undefined, items: unknown[]): unknown[]
{
    if (!name)
        return current;

    const index = current.findIndex(item => named(item) === name);

    return index < 0
    ?   [...current, ...items]
    :   [...current.slice(0, index), ...items, ...current.slice(index + 1)];
}

function removeArrayItems(current: unknown[], names: string[]): unknown[]
{
    const remove = new Set(names);
    return current.filter(item => !remove.has(named(item) ?? ''));
}

function namesOf(items: unknown[]): string[]
{
    return items.map(item => named(item)).filter((name): name is string => Boolean(name));
}

function insertArrayItems(current: unknown[], index: number, items: unknown[]): unknown[]
{
    return [...current.slice(0, index), ...items, ...current.slice(index)];
}

function asArray(value: unknown): unknown[]
{
    if (value == null)
        return [];

    return Array.isArray(value) ? value : [value];
}

function named(value: unknown): string | undefined
{
    return typeof value === 'object' && value !== null && 'name' in value
    ?   String((value as { name?: unknown }).name)
    :   typeof value === 'string' ? value : undefined;
}

function clone<T>(value: T): T
{
    return JSON.parse(JSON.stringify(value)) as T;
}

function monsterKey(name: string, source: string | undefined): string
{
    return `${normaliseKey(source ?? '')}|${monsterNameKey(name)}`;
}

function bestiaryFile(source: string): string | undefined
{
    return BESTIARY_INDEX[source]
    ?? Object.entries(BESTIARY_INDEX).find(([key]) => normaliseKey(key) === normaliseKey(source))?.[1];
}

function monsterNameKey(name: string): string
{
    return normaliseKey(name);
}

function normaliseKey(value: string): string
{
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
