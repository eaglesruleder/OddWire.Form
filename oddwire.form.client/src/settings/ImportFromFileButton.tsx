import { useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';

type ImportFromFileButtonProps = {
    // Intent: parent owns table naming + scope; this button only parses JSON rows and hands them up
    onImport: (rows: Record<string, unknown>[]) => void;
    };

export function ImportFromFileButton({ onImport }: ImportFromFileButtonProps)
{
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const onFile = async (file: File | undefined) =>
    {
        setError(null);

        if (!file)
            return;

        try
        {
            const rows = parseRows(await file.text());
            onImport(rows);
        }
        catch (e)
        {
            setError(e instanceof Error ? e.message : 'Import failed');
        }
        finally
        {
            if (inputRef.current)
                inputRef.current.value = '';
        }
    };

    return (
        <div className="mb-3">
            <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={e => onFile(e.target.files?.[0])}
            />
            <Button size="sm" variant="outline-primary" onClick={() => inputRef.current?.click()}>Import from File</Button>
            {error && <span className="text-muted"> — {error}</span>}
        </div>
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
