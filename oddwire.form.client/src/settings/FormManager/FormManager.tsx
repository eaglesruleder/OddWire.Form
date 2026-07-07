import { useState } from 'react';

import { MonsterImportPopup } from '../../mods/5etools';
import { SettingsPane } from '../SettingsPane';
import { FormList } from './FormList';

// Intent: replaces the old form-install popup — the install catalogue is a collapsible, the 5etools importer a button in the pane (outside the collapsible)
export function FormManager()
{
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="mb-3">
            <SettingsPane title="Form Manager" expanded={expanded} onToggle={() => setExpanded(open => !open)}>
                <FormList />
            </SettingsPane>

            <MonsterImportPopup />
        </div>
        );
}
