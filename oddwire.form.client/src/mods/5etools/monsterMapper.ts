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
    ,trait?: NamedEntries[]
    ,action?: NamedEntries[]
    ,bonus?: NamedEntries[]
    ,reaction?: NamedEntries[]
    ,legendary?: NamedEntries[]
    ,mythic?: NamedEntries[]
    ,variant?: VariantEntry[]
    ,spellcasting?: SpellcastingEntry[]
    ,hasToken?: boolean
    ,_copy?: MonsterCopy
    ,_mod?: MonsterModMap
    };

export type MonsterCopy = {
    name: string;
    source?: string;
    _mod?: MonsterModMap;
    };

export type MonsterModMap = Record<string, MonsterMod | MonsterMod[]>;
export type MonsterMod =
    {mode?: string
    ,items?: unknown
    ,replace?: string
    ,names?: string[]
    ,index?: number
    };

type DamageEntry = string | { resist?: string[]; immune?: string[]; vulnerable?: string[]; conditionImmune?: string[]; note?: string };
type DamageList = DamageEntry[];
type Entries = (string | { name?: string; type?: string; entries?: Entries; items?: Entries; [key: string]: unknown })[];
type NamedEntries = { name?: string; entries?: Entries };
type VariantEntry = NamedEntries & { type?: string; source?: string; page?: number; _version?: unknown };
type SpellcastingEntry =
    {name?: string
    ,type?: string
    ,ability?: string
    ,headerEntries?: Entries
    ,will?: string[]
    ,daily?: Record<string, string[]>
    ,spells?: Record<string, { slots?: number; spells?: string[] }>
    };
type LooperControlPatch = { hidden: true } | { hidden: false; value: LooperRowInstance[] };
type LooperRowInstance = { controls: { param: string; value: unknown; rows?: number }[] };
type ControlPatch = { hidden: true } | { hidden: false; value: string; rows?: number };

export type MonsterRow = Record<string, unknown>;
export type MonsterImportOptions =
    {collection?: string
    ,session?: string
    };

// #region Mapper

// Intent: THE dedicated mapper — one 5etools bestiary entry → one flat, de-tagged Monster row.
// Reads top-to-bottom as the row shape; every non-trivial field resolves through a named helper below.
export function mapMonster(m: RawMonster, options: MonsterImportOptions = {}): MonsterRow
{
    return (
        {monster: m.name
        ,name: m.name
        ,collection: options.collection ?? ''
        ,session: options.session ?? ''
        ,source: sourceName(m.source)
        ,cr: crToText(m.cr)
        ,size: sizeToText(m.size)
        ,type: typeToText(m.type)
        ,alignment: alignmentToText(m.alignment)
        ,ac: acToText(m.ac)
        ,hp: hpToText(m.hp)
        ,speed: speedToText(m.speed)
        ,initiative: dexInitiative(m)
        ,passive: m.passive != null ? String(m.passive) : ''
        ,...abilityScoreColumns(m)
        ,...abilityModColumns(m)
        ,...saveColumns(m)
        ,...skillColumns(m)
        ,damageVuln: hideWhenEmpty(damageListToText(m.vulnerable))
        ,damageRes: hideWhenEmpty(damageListToText(m.resist))
        ,damageImm: hideWhenEmpty(damageListToText(m.immune))
        ,conditionImm: hideWhenEmpty(damageListToText(m.conditionImmune))
        ,...sensesColumns(m)
        ,...combatLoopers(m)
        ,languages: rowsWhenFilled(listToText(m.languages))
        ,fluff: ''
        ,image: tokenUrl(m)
        });
}

export const mapMonsters = (raw: RawMonster[], options: MonsterImportOptions = {}): MonsterRow[] =>
    raw.map(monster => mapMonster(monster, options));

// #endregion

// #region Abilities → save & skill columns

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

// Intent: the raw 8-20 score for the *Attr card slots; blank when the source omits the ability
function abilityScoreColumns(m: RawMonster): MonsterRow
{
    const out: MonsterRow = {};

    for (const ability of ABILITIES)
    {
        const score = m[ability];
        out[`${ability}Attr`] = typeof score === 'number' ? String(score) : '';
    }

    return out;
}

function abilityModColumns(m: RawMonster): MonsterRow
{
    const out: MonsterRow = {};

    for (const ability of ABILITIES)
    {
        const score = m[ability];
        out[`${ability}Mod`] = typeof score === 'number' ? fmtMod(abilityMod(score)) : '';
    }

    return out;
}

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

// Intent: 5etools source code -> book name; unmapped codes fall back to the raw code
const SOURCE_NAMES: Record<string, string> =
    {MM: 'Monster Manual'
    ,MPMM: 'Mordenkainen Presents: Monsters of the Multiverse'
    ,MTF: "Mordenkainen's Tome of Foes"
    ,VGM: "Volo's Guide to Monsters"
    ,PHB: "Player's Handbook"
    ,DMG: "Dungeon Master's Guide"
    ,XGE: "Xanathar's Guide to Everything"
    ,TCE: "Tasha's Cauldron of Everything"
    ,FTD: "Fizban's Treasury of Dragons"
    ,OotA: 'Out of the Abyss'
    ,CoS: 'Curse of Strahd'
    ,PotA: 'Princes of the Apocalypse'
    ,ToA: 'Tomb of Annihilation'
    ,WDH: 'Waterdeep: Dragon Heist'
    ,WDMM: 'Waterdeep: Dungeon of the Mad Mage'
    ,LMoP: 'Lost Mine of Phandelver'
    };

const sourceName = (code: string | undefined): string =>
    code ? SOURCE_NAMES[code] ?? code : '';

// Intent: 2014 statblocks carry no explicit initiative — it is the DEX modifier
const dexInitiative = (m: RawMonster): string =>
    typeof m.dex === 'number' ? fmtMod(abilityMod(m.dex)) : '';

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

// Intent: card slot wants the bare number — drop the "(from natural armor/…)" source note
const acToText = (ac: RawMonster['ac']): string =>
    (ac ?? []).map(entry => typeof entry === 'number' ? String(entry) : String(entry.ac)).join(', ');

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

// Intent: darkvision is embedded in the senses string; lift it into its own field and strip it out —
// same parse-then-strip split as parseAttack / stripParsedAttackParts does for an action's to-hit & damage
const DARKVISION_RE = /darkvision\s+(\d+\s*ft\.?)/i;

function sensesColumns(m: RawMonster): MonsterRow
{
    const source = listToText(m.senses);
    const match = source.match(DARKVISION_RE);

    const darkvision = match ? match[1].replace(/\s+/g, ' ').trim() : '';
    const senses = match
        ?   source
                .replace(DARKVISION_RE, '')
                .replace(/\s*,\s*,\s*/g, ', ')          // collapse the comma the darkvision entry left behind
                .replace(/(^\s*,\s*)|(\s*,\s*$)/g, '')  // trim a dangling leading/trailing comma
                .replace(/\s{2,}/g, ' ')
                .trim()
        :   source;

    return { darkvision, senses: rowsWhenFilled(senses) };
}

function hideWhenEmpty(value: string): ControlPatch
{
    return value
    ?   { hidden: false, value, rows: lineCount(value) }
    :   { hidden: true };
}

function rowsWhenFilled(value: string): string | { value: string; rows: number }
{
    return value
    ?   { value, rows: lineCount(value) }
    :   value;
}

function hiddenWhenEmpty(entries: unknown[] | undefined): { hidden: boolean }
{
    return { hidden: !entries || entries.length < 1 };
}

function combatLoopers(m: RawMonster): MonsterRow
{
    return (
        {trait: namedEntriesSection(m.trait)
        ,spellcasting: spellcastingSection(m.spellcasting)
        ,tabSpellcasting: hiddenWhenEmpty(m.spellcasting)
        ,action: actionSection(m.action)
        ,bonus: namedEntriesSection(m.bonus)
        ,reaction: namedEntriesSection(m.reaction)
        ,legendary: namedEntriesSection(m.legendary)
        ,mythic: namedEntriesSection(m.mythic)
        ,variant: variantSection(m.variant)
        });
}

function namedEntriesSection(entries: NamedEntries[] | undefined): LooperControlPatch
{
    return looperSection(entries?.map(entry =>
        rowInstance(
            {name: entry.name ?? ''
            ,entries: entriesToText(entry.entries)
            })));
}

function actionSection(entries: NamedEntries[] | undefined): LooperControlPatch
{
    return looperSection(entries?.map(entry =>
    {
        const attack = parseAttack(entriesToRawText(entry.entries));

        return rowInstance(
            {name: entry.name ?? ''
            ,toHit: attack.toHit
            ,damage: attack.damage
            ,entries: actionEntriesToText(entry.entries)
            });
    }));
}

function variantSection(entries: VariantEntry[] | undefined): LooperControlPatch
{
    return looperSection(entries?.map(entry =>
        rowInstance(
            {name: entry.name ?? ''
            ,source: entry.source ?? ''
            ,page: entry.page != null ? String(entry.page) : ''
            ,type: entry.type ?? ''
            ,entries: entriesToText(entry.entries)
            })));
}

function spellcastingSection(entries: SpellcastingEntry[] | undefined): LooperControlPatch
{
    return looperSection(entries?.map(entry =>
        rowInstance(
            {name: entry.name ?? ''
            ,ability: entry.ability ?? ''
            ,type: entry.type ?? ''
            ,headerEntries: entriesToText(entry.headerEntries)
            ,will: listToText(entry.will)
            ,daily: dailySpellsToText(entry.daily)
            ,spells: slotSpellsToText(entry.spells)
            })));
}

function looperSection(rows: LooperRowInstance[] | undefined): LooperControlPatch
{
    return rows && rows.length > 0
    ?   { hidden: false, value: rows }
    :   { hidden: true };
}

function rowInstance(values: Record<string, unknown>): LooperRowInstance
{
    return (
        {controls: Object.entries(values)
            .filter(([, value]) => value !== '' && value != null)
            .map(([param, value]) => typeof value === 'string'
                ?   { param, value, rows: lineCount(value) }
                :   { param, value })
        });
}

function lineCount(value: string): number
{
    return value.split(/\r\n|\r|\n/).length;
}

function dailySpellsToText(daily: SpellcastingEntry['daily']): string
{
    if (!daily)
        return '';

    return Object.entries(daily)
        .map(([frequency, spells]) => `${frequency}: ${listToText(spells)}`)
        .join('\n');
}

function slotSpellsToText(spells: SpellcastingEntry['spells']): string
{
    if (!spells)
        return '';

    return Object.entries(spells)
        .map(([level, slot]) =>
        {
            const label = level === '0'
            ?   'Cantrips'
            :   `Level ${level}${slot.slots != null ? ` (${slot.slots} slots)` : ''}`;

            return `${label}: ${listToText(slot.spells)}`;
        })
        .join('\n');
}

function entriesToText(entries: Entries | undefined): string
{
    if (!Array.isArray(entries))
        return '';

    return entries
        .map(entryToText)
        .filter(Boolean)
        .join('\n');
}

function entriesToRawText(entries: Entries | undefined): string
{
    if (!Array.isArray(entries))
        return '';

    return entries
        .map(entryToRawText)
        .filter(Boolean)
        .join('\n');
}

function entryToText(entry: Entries[number]): string
{
    if (typeof entry === 'string')
        return deTag(entry);

    const heading = entry.name ? `${entry.name}. ` : '';
    const children = entriesToText(entry.entries ?? entry.items);

    return `${heading}${children}`.trim();
}

function entryToRawText(entry: Entries[number]): string
{
    if (typeof entry === 'string')
        return entry;

    const heading = entry.name ? `${entry.name}. ` : '';
    const children = entriesToRawText(entry.entries ?? entry.items);

    return `${heading}${children}`.trim();
}

function actionEntriesToText(entries: Entries | undefined): string
{
    return stripParsedAttackParts(entriesToText(entries));
}

function stripParsedAttackParts(text: string): string
{
    return text
        .replace(/^(?:[a-z]{1,3}(?:,[a-z]{1,3})?\s+)?[+-]?\d+\s+to hit,?\s*/i, '')
        .replace(/(?:reach 5 ?ft\.|one target)(?:, |\.\s)?/gi, '')
        .replace(/\s*(?:or\s+|plus\s+)?\d+\s*\([^)]*\)\s+[a-zA-Z]+\s+damage(?:\s+(?:in melee|at range|if used with two hands))?/g, '')
        .replace(/\.\s*,\s*and\s+/g, '. ')
        .replace(/\.\s*\./g, '.')
        .replace(/\. the target/g, '. The target')
        .replace(/\. if /g, '. If ')
        .replace(/\s+,/g, ',')
        .replace(/,\s*\./g, '.')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function parseAttack(text: string): { toHit: string; damage: string }
{
    const hit = text.match(/\{@hit\s*([+-]?\d+)\}/);
    const damage = text.match(/\{@damage\s*([^}]*)\}\)\s+([a-zA-Z]+)\s+damage/);

    return (
        {toHit: hit ? `1d20${fmtSigned(Number(hit[1]))}` : ''
        ,damage: damage ? `${compactFormula(damage[1])}${damage[2][0].toLowerCase()}` : ''
        });
}

const fmtSigned = (n: number): string =>
    n >= 0 ? `+${n}` : `${n}`;

const compactFormula = (formula: string): string =>
    formula.replace(/\s+/g, '');

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
    ,{ param: 'collection', label: 'Collection' }
    ,{ param: 'session', label: 'Session' }
    ,{ param: 'source', label: 'Source' }
    ,{ param: 'cr', label: 'Challenge' }
    ,{ param: 'size', label: 'Size' }
    ,{ param: 'type', label: 'Type' }
    ,{ param: 'alignment', label: 'Alignment' }
    ,{ param: 'ac', label: 'Armor Class' }
    ,{ param: 'hp', label: 'Hit Points' }
    ,{ param: 'speed', label: 'Speed' }
    ,{ param: 'initiative', label: 'Initiative' }
    ,{ param: 'passive', label: 'Passive Perception' }
    ,{ param: 'strAttr', label: 'STR Score' }
    ,{ param: 'dexAttr', label: 'DEX Score' }
    ,{ param: 'conAttr', label: 'CON Score' }
    ,{ param: 'intAttr', label: 'INT Score' }
    ,{ param: 'wisAttr', label: 'WIS Score' }
    ,{ param: 'chaAttr', label: 'CHA Score' }
    ,{ param: 'strMod', label: 'STR Mod' }
    ,{ param: 'dexMod', label: 'DEX Mod' }
    ,{ param: 'conMod', label: 'CON Mod' }
    ,{ param: 'intMod', label: 'INT Mod' }
    ,{ param: 'wisMod', label: 'WIS Mod' }
    ,{ param: 'chaMod', label: 'CHA Mod' }
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
    ,{ param: 'darkvision', label: 'Darkvision' }
    ,{ param: 'trait', label: 'Traits' }
    ,{ param: 'spellcasting', label: 'Spellcasting' }
    ,{ param: 'tabSpellcasting', label: 'Spellcasting Tab' }
    ,{ param: 'action', label: 'Actions' }
    ,{ param: 'bonus', label: 'Bonus Actions' }
    ,{ param: 'reaction', label: 'Reactions' }
    ,{ param: 'legendary', label: 'Legendary Actions' }
    ,{ param: 'mythic', label: 'Mythic Actions' }
    ,{ param: 'variant', label: 'Variants' }
    ,{ param: 'languages', label: 'Languages' }
    ,{ param: 'fluff', label: 'Description' }
    ,{ param: 'image', label: 'Image' }
    ];

export const MONSTER_SCHEMA: ControlDef[] =
    MONSTER_COLUMNS.map(column =>
        ({ type: 'text', param: column.param, label: column.label, valueType: 'text' } as ControlDef));

// #endregion
