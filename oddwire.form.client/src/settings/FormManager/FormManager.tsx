import { useState } from 'react';

import { SettingsPane } from '../SettingsPane';
import { FormList } from './FormList';

export function FormManager()
{
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="mb-3">
            <SettingsPane title="Form Manager" expanded={expanded} onToggle={() => setExpanded(open => !open)}>
                <FormList />
            </SettingsPane>
        </div>
        );
}
