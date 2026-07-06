import localforage from 'localforage';
import Button from 'react-bootstrap/Button';

import { StripLayout } from '../_components/layout';
import { MonsterImportPopup } from '../mods/5etools';
import { DbManager } from './DbManager';

export function SettingsPage()
{
    // Intent: wipe every localforage store (forms/instances/lookup) then reload so the stores re-seed from scratch
    const clearCache = async () =>
    {
        if (!window.confirm('Delete all cached forms, instances, and lookup data?'))
            return;

        await localforage.dropInstance({ name: 'oddwire.form' });
        window.location.href = '/';
    };

    return (
        <StripLayout left="←" leftLink="/" title="Settings">
            <div className="flex items-center gap mb-3">
                <Button variant="danger" onClick={clearCache}>Clear Cache</Button>
                <MonsterImportPopup />
            </div>
            <DbManager />
        </StripLayout>
        );
}
