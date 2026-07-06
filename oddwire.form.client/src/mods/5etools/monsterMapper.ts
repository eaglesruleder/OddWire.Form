import type { ControlDef } from '../../_components/controllist';

// Intent: the lookup table the monster-card form binds to (dropdown valueParam 'monster', labelParam 'name')
export const MONSTER_TABLE = 'Monster';

// Intent: the row key — one row per creature name; merges use it, latest import overwrites a matching name
export const MONSTER_KEY = 'monster';

// Intent: loose view of a 5etools bestiary entry — only the fields this PoC mapper reads, all optional.
// traits/actions/spellcasting are deliberately NOT read yet — they need the shared entries→text renderer (deferred).
export type RawMonster =
    {name: string
    ,source?: string
    ,size?: string[]
    ,type?: string | { type: string; tags?: (string | { tag: string; prefix?: string })[] }
    ,alignment?: (string | { alignment?: string[] })[]
    ,ac?: (number | { ac: number; from?: string[] })[]
    ,hp?: { average?: number; formula?: string; special?: string }
    ,speed?: number | Record<string, number | { number: number; condition?: string }>
    ,str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number
    ,save?: Record<string, string>
    ,skill?: Record<string, string>
    ,senses?: string[]
    ,passive?: number
    ,languages?: string[]
    ,cr?: string | { cr: string }
    ,vulnerable?: DamageList
    ,resist?: DamageList
    ,immune?: DamageList
    ,conditionImmune?: DamageList
    ,hasToken?: boolean
    };

type DamageEntry = string | { resist?: string[]; immune?: string[]; vulnerable?: string[]; conditionImmune?: string[]; note?: string };
type DamageList = DamageEntry[];

export type MonsterRow = Record<string, string>;

// #region Mapper

// Intent: THE dedicated mapper — one 5etools bestiary entry → one flat, de-tagged Monster row.
// Reads top-to-bottom as the row shape; every non-trivial field resolves through a named helper below.
export function mapMonster(m: RawMonster): MonsterRow
{
    return (
        {monster: m.name
        ,name: m.name
        ,source: m.source ?? ''
        ,cr: crToText(m.cr)
        ,size: sizeToText(m.size)
        ,type: typeToText(m.type)
        ,alignment: alignmentToText(m.alignment)
        ,ac: acToText(m.ac)
        ,hp: hpToText(m.hp)
        ,speed: speedToText(m.speed)
        ,passive: m.passive != null ? String(m.passive) : ''
        ,...saveColumns(m)
        ,...skillColumns(m)
        ,damageVuln: damageListToText(m.vulnerable)
        ,damageRes: damageListToText(m.resist)
        ,damageImm: damageListToText(m.immune)
        ,conditionImm: damageListToText(m.conditionImmune)
        ,senses: listToText(m.senses)
        ,languages: listToText(m.languages)
        ,fluff: ''
        ,image: tokenUrl(m)
        });
}

export const mapMonsters = (raw: RawMonster[]): MonsterRow[] =>
    raw.map(mapMonster);

// #endregion

// #region Abilities → save & skill columns

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

// Intent: proficient save is stored pre-formatted ('+5'); otherwise fall back to the raw ability modifier
function saveColumns(m: RawMonster): MonsterRow
{
    const out: MonsterRow = {};

    for (const ability of ABILITIES)
    {
        const proficient = m.save?.[ability];
        const score = m[ability];

        out[`${ability}Save`] = proficient
            ?? (typeof score === 'number' ? fmtMod(abilityMod(score)) : '');
    }

    return out;
}

// Intent: statblocks only list proficient skills — a blank column means "not proficient", faithful to the source
const SKILL_KEY: Record<string, string> =
    {athletics: 'athletics'
    ,acrobatics: 'acrobatics'
    ,sleightOfHand: 'sleight of hand'
    ,stealth: 'stealth'
    ,arcana: 'arcana'
    ,history: 'history'
    ,investigation: 'investigation'
    ,nature: 'nature'
    ,religion: 'religion'
    ,animalHandling: 'animal handling'
    ,insight: 'insight'
    ,medicine: 'medicine'
    ,perception: 'perception'
    ,survival: 'survival'
    ,deception: 'deception'
    ,intimidation: 'intimidation'
    ,performance: 'performance'
    ,persuasion: 'persuasion'
    };

function skillColumns(m: RawMonster): MonsterRow
{
    const out: MonsterRow = {};

    for (const [param, key] of Object.entries(SKILL_KEY))
        out[param] = m.skill?.[key] ?? '';

    return out;
}

const abilityMod = (score: number): number => Math.floor((score - 10) / 2);
const fmtMod = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

// #endregion

// #region Field flatteners

const SIZE: Record<string, string> = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };
const ALIGN: Record<string, string> = { L: 'Lawful', N: 'Neutral', C: 'Chaotic', G: 'Good', E: 'Evil', U: 'Unaligned', A: 'Any' };

const crToText = (cr: RawMonster['cr']): string =>
    cr == null ? '' : typeof cr === 'string' ? cr : cr.cr;

const sizeToText = (size: string[] | undefined): string =>
    (size ?? []).map(code => SIZE[code] ?? code).join('/');

function typeToText(type: RawMonster['type']): string
{
    if (type == null)
        return '';

    if (typeof type === 'string')
        return cap(type);

    const tags = (type.tags ?? []).map(tag =>
        typeof tag === 'string' ? tag : tag.prefix ? `${tag.prefix} ${tag.tag}` : tag.tag);

    return cap(type.type) + (tags.length ? ` (${tags.join(', ')})` : '');
}

function alignmentToText(alignment: RawMonster['alignment']): string
{
    const codes = (alignment ?? []).filter((x): x is string => typeof x === 'string');

    if (codes.length === 0)
        return '';
    if (codes.length === 1)
        return ALIGN[codes[0]] === 'Any' ? 'Any alignment' : ALIGN[codes[0]] ?? codes[0];
    if (codes.every(code => code === 'N'))
        return 'Neutral';

    return codes.map(code => ALIGN[code] ?? code).join(' ');
}

const acToText = (ac: RawMonster['ac']): string =>
    (ac ?? []).map(entry =>
    {
        if (typeof entry === 'number')
            return String(entry);

        const from = (entry.from ?? []).map(deTag).join(', ');
        return `${entry.ac}${from ? ` (${from})` : ''}`;
    }).join(', ');

function hpToText(hp: RawMonster['hp']): string
{
    if (hp == null)
        return '';
    if (hp.special)
        return deTag(hp.special);

    return `${hp.average ?? ''}${hp.formula ? ` (${hp.formula})` : ''}`;
}

function speedToText(speed: RawMonster['speed']): string
{
    if (speed == null)
        return '';
    if (typeof speed === 'number')
        return `${speed} ft.`;

    const fmt = (v: number | { number: number; condition?: string }): string =>
        typeof v === 'number' ? `${v} ft.` : `${v.number} ft.${v.condition ? ` ${v.condition}` : ''}`;

    const parts: string[] = [];

    if (speed.walk != null)
        parts.push(fmt(speed.walk));

    for (const mode of ['burrow', 'climb', 'fly', 'swim'])
        if (speed[mode] != null)
            parts.push(`${mode} ${fmt(speed[mode])}`);

    return parts.join(', ');
}

// Intent: resist/immune/vulnerable/conditionImmune share one shape — plain strings, or a grouped {resist:[...], note} object
function damageListToText(list: DamageList | undefined): string
{
    if (!Array.isArray(list))
        return '';

    const parts: string[] = [];

    for (const entry of list)
    {
        if (typeof entry === 'string')
        {
            parts.push(entry);
            continue;
        }

        const inner = entry.resist ?? entry.immune ?? entry.vulnerable ?? entry.conditionImmune ?? [];
        const innerText = inner.join(', ');

        if (innerText)
            parts.push(`${innerText}${entry.note ? ` ${entry.note}` : ''}`);
    }

    return parts.map(deTag).join(', ');
}

const listToText = (list: string[] | undefined): string =>
    (list ?? []).map(deTag).join(', ');

// Intent: PoC image source — 5etools' public token path. Likely-correct scheme; verify a couple render before trusting it.
const tokenUrl = (m: RawMonster): string =>
    m.hasToken && m.source
        ? `https://5e.tools/img/bestiary/tokens/${m.source}/${encodeURIComponent(m.name)}.webp`
        : '';

// Intent: strip 5etools {@tag ...} markup down to its display text — keep the first pipe-segment (label, not source)
const deTag = (input: string): string =>
    input.replace(/\{@\w+\s*([^}]*)\}/g, (_match, content: string) => (content ?? '').split('|')[0]);

const cap = (s: string): string => s ? s[0].toUpperCase() + s.slice(1) : s;

// #endregion

// #region Table schema

// Intent: explicit column order + labels so the imported Monster table reads cleanly in DB Manager and the card form
const MONSTER_COLUMNS: { param: string; label: string }[] =
    [{ param: 'monster', label: 'Key' }
    ,{ param: 'name', label: 'Name' }
    ,{ param: 'source', label: 'Source' }
    ,{ param: 'cr', label: 'Challenge' }
    ,{ param: 'size', label: 'Size' }
    ,{ param: 'type', label: 'Type' }
    ,{ param: 'alignment', label: 'Alignment' }
    ,{ param: 'ac', label: 'Armor Class' }
    ,{ param: 'hp', label: 'Hit Points' }
    ,{ param: 'speed', label: 'Speed' }
    ,{ param: 'passive', label: 'Passive Perception' }
    ,{ param: 'strSave', label: 'STR Save' }
    ,{ param: 'dexSave', label: 'DEX Save' }
    ,{ param: 'conSave', label: 'CON Save' }
    ,{ param: 'intSave', label: 'INT Save' }
    ,{ param: 'wisSave', label: 'WIS Save' }
    ,{ param: 'chaSave', label: 'CHA Save' }
    ,{ param: 'athletics', label: 'Athletics' }
    ,{ param: 'acrobatics', label: 'Acrobatics' }
    ,{ param: 'sleightOfHand', label: 'Sleight of Hand' }
    ,{ param: 'stealth', label: 'Stealth' }
    ,{ param: 'arcana', label: 'Arcana' }
    ,{ param: 'history', label: 'History' }
    ,{ param: 'investigation', label: 'Investigation' }
    ,{ param: 'nature', label: 'Nature' }
    ,{ param: 'religion', label: 'Religion' }
    ,{ param: 'animalHandling', label: 'Animal Handling' }
    ,{ param: 'insight', label: 'Insight' }
    ,{ param: 'medicine', label: 'Medicine' }
    ,{ param: 'perception', label: 'Perception' }
    ,{ param: 'survival', label: 'Survival' }
    ,{ param: 'deception', label: 'Deception' }
    ,{ param: 'intimidation', label: 'Intimidation' }
    ,{ param: 'performance', label: 'Performance' }
    ,{ param: 'persuasion', label: 'Persuasion' }
    ,{ param: 'damageVuln', label: 'Damage Vulnerabilities' }
    ,{ param: 'damageRes', label: 'Damage Resistances' }
    ,{ param: 'damageImm', label: 'Damage Immunities' }
    ,{ param: 'conditionImm', label: 'Condition Immunities' }
    ,{ param: 'senses', label: 'Senses' }
    ,{ param: 'languages', label: 'Languages' }
    ,{ param: 'fluff', label: 'Description' }
    ,{ param: 'image', label: 'Image' }
    ];

export const MONSTER_SCHEMA: ControlDef[] =
    MONSTER_COLUMNS.map(column =>
        ({ type: 'text', param: column.param, label: column.label, valueType: 'text' } as ControlDef));

// #endregion
