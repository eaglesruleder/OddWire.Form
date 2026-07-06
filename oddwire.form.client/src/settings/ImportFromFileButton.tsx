import { useRef } from 'react';

type ImportFromFileButtonProps = {
    // Intent: parent owns table naming + scope; this button only parses JSON rows and hands them up
    onImport: (rows: Record<string, unknown>[]) => void;
    label?: string;
    className?: string;
    title?: string;
    };

export function ImportFromFileButton({ onImport, label = 'Import from File', className = 'btn btn-outline-primary btn-sm', title }: ImportFromFileButtonProps)
{
    const inputRef = useRef<HTMLInputElement>(null);

    const onFile = async (file: File | undefined) =>
    {
        if (!file)
            return;

        try
        {
            const rows = parseRows(await file.text());
            onImport(rows);
        }
        catch (e)
        {
            // Intent: alert (not inline text) so the trigger works in a tight header slot as well as inline
            window.alert(e instanceof Error ? e.message : 'Import failed');
        }
        finally
        {
            if (inputRef.current)
                inputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={e => onFile(e.target.files?.[0])}
            />
            <button type="button" className={className} title={title ?? label} onClick={() => inputRef.current?.click()}>{label}</button>
        </>
        );
}

// Intent: first pass is JSON only — an array of flat objects; anything else is a clear parse error, not a silent empty table
function parseRows(text: string): Record<string, unknown>[]
{
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed) || parsed.length === 0)
        throw new Error('Expected a non-empty JSON array of rows');

    if (parsed.some(row => typeof row !== 'object' || row === null || Array.isArray(row)))
        throw new Error('Each row must be a JSON object');

    return parsed as Record<string, unknown>[];
}
