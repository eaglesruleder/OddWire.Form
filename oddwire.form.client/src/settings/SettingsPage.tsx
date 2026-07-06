import { StripLayout } from '../_components/layout';
import { DbManager } from './DbManager';

export function SettingsPage()
{
    return (
        <StripLayout left="←" leftLink="/" title="Settings">
            <DbManager />
        </StripLayout>
        );
}
