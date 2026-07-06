import localforage from 'localforage';
import Button from 'react-bootstrap/Button';

import { StripLayout } from '../_components/layout';
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
            <div className="mb-3">
                <Button variant="danger" onClick={clearCache}>Clear Cache</Button>
            </div>
            <DbManager />
        </StripLayout>
        );
}
