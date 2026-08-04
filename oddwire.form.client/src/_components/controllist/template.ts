export type TemplateValueSource = (param: string) => unknown;

const PARAM_RE = /^[A-Za-z_]\w*$/;
const MAX_TEMPLATE_DEPTH = 20;

export function hasTemplate(value: string): boolean
{
    return value.includes('{') && readTemplateParts(value).some(part => part.kind === 'expr');
}

export function templateRefs(template: string): string[]
{
    const refs = new Set<string>();

    const collect = (value: string, depth = 0): void =>
    {
        if (depth > MAX_TEMPLATE_DEPTH)
            return;

        for (const part of readTemplateParts(value))
        {
            if (part.kind !== 'expr')
                continue;

            const expr = parseExpression(part.value);

            refs.add(expr.param);

            if (expr.kind === 'conditional')
            {
                collect(expr.whenTrue, depth + 1);
                collect(expr.whenFalse, depth + 1);
            }
        }
    };

    collect(template);

    return [...refs];
}

export function evaluateTemplate(template: string, source: TemplateValueSource): string
{
    const evaluate = (value: string, depth = 0): string =>
    {
        if (depth > MAX_TEMPLATE_DEPTH)
            return value;

        return readTemplateParts(value).map(part =>
        {
            if (part.kind === 'text')
                return part.value;

            const expr = parseExpression(part.value);

            if (expr.kind === 'param')
                return valueText(source(expr.param));

            const branch = isFilled(source(expr.param)) ? expr.whenTrue : expr.whenFalse;
            return evaluate(branch, depth + 1);
        }).join('');
    };

    return evaluate(template);
}

function valueText(value: unknown): string
{
    return value == null ? '' : String(value);
}

function isFilled(value: unknown): boolean
{
    if (value == null || value === false)
        return false;

    if (typeof value === 'string')
        return value.trim() !== '';

    if (Array.isArray(value))
        return value.length > 0;

    return true;
}

type TemplatePart =
    | { kind: 'text'; value: string }
    | { kind: 'expr'; value: string };

function readTemplateParts(template: string): TemplatePart[]
{
    const parts: TemplatePart[] = [];
    let textStart = 0;
    let i = 0;

    while (i < template.length)
    {
        if (template[i] !== '{')
        {
            i++;
            continue;
        }

        const end = findClosingBrace(template, i);

        if (end < 0)
        {
            i++;
            continue;
        }

        if (i > textStart)
            parts.push({ kind: 'text', value: template.slice(textStart, i) });

        parts.push({ kind: 'expr', value: template.slice(i + 1, end).trim() });
        i = end + 1;
        textStart = i;
    }

    if (textStart < template.length)
        parts.push({ kind: 'text', value: template.slice(textStart) });

    return parts;
}

function findClosingBrace(value: string, start: number): number
{
    let depth = 0;
    let quote: string | undefined;

    for (let i = start; i < value.length; i++)
    {
        const ch = value[i];
        const prev = value[i - 1];

        if (quote)
        {
            if (ch === quote && prev !== '\\')
                quote = undefined;
            continue;
        }

        if (ch === '"' || ch === "'")
        {
            quote = ch;
            continue;
        }

        if (ch === '{')
            depth++;
        else if (ch === '}')
        {
            depth--;
            if (depth === 0)
                return i;
        }
    }

    return -1;
}

type ParsedExpression =
    | { kind: 'param'; param: string }
    | { kind: 'conditional'; param: string; whenTrue: string; whenFalse: string };

function parseExpression(expr: string): ParsedExpression
{
    const question = findTopLevel(expr, '?');

    if (question < 0)
        return { kind: 'param', param: normaliseParam(expr) };

    const param = normaliseParam(expr.slice(0, question));
    const branches = expr.slice(question + 1);
    const colon = findTopLevel(branches, ':');

    if (colon < 0)
        return { kind: 'conditional', param, whenTrue: unquote(branches), whenFalse: '' };

    return {
        kind: 'conditional',
        param,
        whenTrue: unquote(branches.slice(0, colon)),
        whenFalse: unquote(branches.slice(colon + 1)),
        };
}

function normaliseParam(value: string): string
{
    const param = value.trim();
    return PARAM_RE.test(param) ? param : '';
}

function findTopLevel(value: string, needle: string): number
{
    let depth = 0;
    let quote: string | undefined;

    for (let i = 0; i < value.length; i++)
    {
        const ch = value[i];
        const prev = value[i - 1];

        if (quote)
        {
            if (ch === quote && prev !== '\\')
                quote = undefined;
            continue;
        }

        if (ch === '"' || ch === "'")
        {
            quote = ch;
            continue;
        }

        if (ch === '{')
            depth++;
        else if (ch === '}')
            depth--;
        else if (ch === needle && depth === 0)
            return i;
    }

    return -1;
}

function unquote(value: string): string
{
    const trimmed = value.trim();

    if (trimmed.length < 2)
        return trimmed;

    const quote = trimmed[0];

    if ((quote !== '"' && quote !== "'") || trimmed[trimmed.length - 1] !== quote)
        return trimmed;

    return trimmed.slice(1, -1)
        .replaceAll(`\\${quote}`, quote)
        .replaceAll('\\\\', '\\');
}
