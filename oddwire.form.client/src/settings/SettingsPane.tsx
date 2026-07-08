import type { ReactNode } from 'react';

import './settings.css';

// Intent: shared Settings collapsible — a header bar (clickable toggle) with a right-aligned actions slot, over a body
type SettingsPaneProps = {
    title: string;
    headerActions?: ReactNode;      // buttons that sit on the header bar, right-aligned
    expanded: boolean;              // controlled by the parent so header actions can gate on it (e.g. Clear only when open)
    onToggle: () => void;
    children: ReactNode;
    };

export function SettingsPane({ title, headerActions, expanded, onToggle, children }: SettingsPaneProps)
{
    return (
        <div className="settings-pane mb-3">
            <div className="settings-pane-header flex items-center gap">
                <button type="button" className="settings-pane-toggle flex items-center gap fill" onClick={onToggle}>
                    <span className="collapsible-chevron">{expanded ? '▾' : '▸'}</span>
                    <span className="fill">{title}</span>
                </button>
                {headerActions}
            </div>
            {expanded &&
            <div className="settings-pane-body">{children}</div>
            }
        </div>
        );
}
