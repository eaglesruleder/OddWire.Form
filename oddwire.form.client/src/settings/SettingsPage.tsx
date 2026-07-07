import localforage from 'localforage';

import { StripLayout } from '../_components/layout';
import { DbManager } from './DBManager';
import { FormManager } from './FormManager';

export function SettingsPage()
{
    // Intent: wipe every localforage store (forms/instances/lookup) then reload so the stores re-seed from scratch
    const clearAll = async () =>
    {
        if (!window.confirm('Delete ALL cached data (forms, instances, and lookup)?'))
            return;

        await localforage.dropInstance({ name: 'oddwire.form' });
        window.location.href = '/';
    };

    const clearAllIcon =
        <button type="button" className="strip-btn" onClick={clearAll} title="Clear all cached data">⚠</button>;

    return (
        <StripLayout left="←" leftLink="/" right={clearAllIcon} title="Settings">
            <DbManager />
            <FormManager />
        </StripLayout>
        );
}
